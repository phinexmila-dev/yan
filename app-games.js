        // ==================== GAMES APP ====================
        let gamesState = {
            view: 'home', // home, selectContact, anonQA, guessWord, unoSetup, uno, numBombSetup, numBomb, numBombResult
            selectedContact: null,
            anonQA: { questions: [], currentAnswer: '' },
            guessWord: {
                messages: [],
                currentWord: '',
                isDescriber: true, // true=用户描述, false=联系人描述
                score: { user: 0, contact: 0 },
                revealed: false,
                generating: false
            },
            uno: null // will be initialized when game starts
        };

        // ===== 游戏状态持久化 =====
        const GAMES_SAVE_KEY = 'yan_games_state';
        const ANONQA_SAVE_PREFIX = 'yan_anonqa_'; // [FIX-匿问我答持久化] 按联系人独立存储

        // [FIX-匿问我答持久化] 保存匿问我答数据到独立的localStorage key
        function saveAnonQAData(contactId) {
            if (!contactId || !gamesState.anonQA) return;
            try {
                const qa = gamesState.anonQA;
                localStorage.setItem(ANONQA_SAVE_PREFIX + contactId, JSON.stringify({
                    questions: qa.questions || [],
                    inbox: qa.inbox || [],
                    currentAnswer: qa.currentAnswer || '',
                    mode: qa.mode || 'ask',
                    _savedAt: Date.now()
                }));
            } catch(e) {
                console.warn('[AnonQA] 保存失败:', e);
            }
        }

        // [FIX-匿问我答持久化] 从localStorage恢复匿问我答数据
        function loadAnonQAData(contactId) {
            if (!contactId) return null;
            try {
                const saved = localStorage.getItem(ANONQA_SAVE_PREFIX + contactId);
                if (!saved) return null;
                const data = JSON.parse(saved);
                if (!data) return null;
                return {
                    questions: data.questions || [],
                    inbox: data.inbox || [],
                    currentAnswer: data.currentAnswer || '',
                    mode: data.mode || 'ask'
                };
            } catch(e) {
                console.warn('[AnonQA] 恢复失败:', e);
                return null;
            }
        }

        // 保存游戏状态到 localStorage（仅保存可序列化的数据）
        function saveGamesState() {
            try {
                const saveData = {};
                // 保存当前视图
                saveData.view = gamesState.view;
                // 保存UNO游戏状态（如果存在且未结束）
                if (gamesState.uno && !gamesState.uno.gameOver) {
                    const uno = gamesState.uno;
                    saveData.uno = {
                        players: uno.players.map(p => ({
                            id: p.id,
                            name: p.name,
                            avatar: p.avatar,
                            hand: p.hand,
                            isUser: p.isUser,
                            isBot: p.isBot,
                            contactId: p.contact ? p.contact.id : null,
                            saidUno: p.saidUno,
                            score: p.score
                        })),
                        deck: uno.deck,
                        discardPile: uno.discardPile,
                        currentPlayerIdx: uno.currentPlayerIdx,
                        direction: uno.direction,
                        currentColor: uno.currentColor,
                        drawStack: uno.drawStack,
                        gameOver: uno.gameOver,
                        winner: null,
                        log: uno.log.slice(-30), // 只保留最近30条日志
                        pendingColorChoice: false,
                        pendingChallenge: null,
                        pendingCard: null,
                        playerSpeech: {},
                        gameTimer: uno.gameTimer,
                        stackingEnabled: uno.stackingEnabled,
                        challengeEnabled: uno.challengeEnabled,
                        unoCallEnabled: uno.unoCallEnabled,
                        previousColor: uno.previousColor,
                        _savedAt: Date.now()
                    };
                }
                // 保存数字炸弹状态
                if (gamesState.numBomb && !gamesState.numBomb.gameOver && (gamesState.view === 'numBomb' || gamesState.view === 'numBombResult')) {
                    const nb = gamesState.numBomb;
                    saveData.numBomb = {
                        mode: nb.mode,
                        bombNumber: nb.bombNumber,
                        rangeMin: nb.rangeMin,
                        rangeMax: nb.rangeMax,
                        players: nb.players.map(p => ({
                            id: p.id, name: p.name, avatar: p.avatar,
                            isUser: p.isUser, contactId: p.contact ? p.contact.id : null
                        })),
                        currentPlayerIdx: nb.currentPlayerIdx,
                        guessHistory: nb.guessHistory.slice(-30),
                        gameOver: nb.gameOver,
                        loser: nb.loser,
                        punishment: nb.punishment,
                        _savedAt: Date.now()
                    };
                }
                // 保存其他游戏状态
                if (gamesState.view === 'anonQA' && gamesState.selectedContact) {
                    saveData.selectedContactId = gamesState.selectedContact.id;
                    saveData.anonQA = gamesState.anonQA;
                }
                if (gamesState.view === 'guessWord' && gamesState.selectedContact) {
                    saveData.selectedContactId = gamesState.selectedContact.id;
                    saveData.guessWord = {
                        messages: gamesState.guessWord.messages,
                        currentWord: gamesState.guessWord.currentWord,
                        isDescriber: gamesState.guessWord.isDescriber,
                        score: gamesState.guessWord.score,
                        revealed: gamesState.guessWord.revealed
                    };
                }
                localStorage.setItem(GAMES_SAVE_KEY, JSON.stringify(saveData));
            } catch(e) {
                console.warn('保存游戏状态失败:', e);
            }
        }

        // 恢复游戏状态
        function restoreGamesState() {
            try {
                const saved = localStorage.getItem(GAMES_SAVE_KEY);
                if (!saved) return false;
                const data = JSON.parse(saved);
                if (!data || !data.view) return false;

                // 检查是否有UNO游戏需要恢复
                if (data.uno && data.view === 'uno') {
                    // 检查保存时间，超过1小时不恢复
                    if (data.uno._savedAt && Date.now() - data.uno._savedAt > 3600000) {
                        localStorage.removeItem(GAMES_SAVE_KEY);
                        return false;
                    }
                    // 重建player的contact引用
                    const restoredPlayers = data.uno.players.map(p => {
                        const restored = { ...p };
                        if (p.contactId && store.contacts) {
                            restored.contact = store.contacts.find(c => c.id === p.contactId) || null;
                        } else {
                            restored.contact = null;
                        }
                        delete restored.contactId;
                        return restored;
                    });
                    data.uno.players = restoredPlayers;
                    // 重置运行时状态
                    data.uno.aiThinking = false;
                    data.uno.timerInterval = null;
                    data.uno._catchablePlayer = null;
                    data.uno.lastPlayedCard = null;
                    data.uno.lastPlayedBy = null;
                    gamesState.uno = data.uno;
                    gamesState.view = 'uno';
                    // 重新启动计时器
                    if (!data.uno.gameOver && data.uno.gameTimer > 0) {
                        gamesState.uno.timerInterval = setInterval(() => {
                            gamesState.uno.gameTimer--;
                            if (gamesState.uno.gameTimer <= 0) {
                                clearInterval(gamesState.uno.timerInterval);
                                unoTimeUp(gamesState.uno);
                            }
                            renderGamesHome();
                        }, 1000);
                    }
                    gamesState.uno.log.push('📱 游戏已恢复！继续上一局...');
                    // 恢复后如果是AI的回合，触发AI出牌
                    setTimeout(() => {
                        if (gamesState.uno && !gamesState.uno.gameOver) {
                            const currentP = gamesState.uno.players[gamesState.uno.currentPlayerIdx];
                            if (currentP && !currentP.isUser) {
                                scheduleUnoAI();
                            }
                        }
                    }, 500);
                    return true;
                }

                // 恢复其他游戏
                if (data.view === 'anonQA' && data.selectedContactId && data.anonQA) {
                    const contact = store.contacts.find(c => c.id === data.selectedContactId);
                    if (contact) {
                        gamesState.selectedContact = contact;
                        gamesState.anonQA = data.anonQA;
                        gamesState.view = 'anonQA';
                        return true;
                    }
                }
                if (data.view === 'guessWord' && data.selectedContactId && data.guessWord) {
                    const contact = store.contacts.find(c => c.id === data.selectedContactId);
                    if (contact) {
                        gamesState.selectedContact = contact;
                        gamesState.guessWord = { ...data.guessWord, generating: false };
                        gamesState.view = 'guessWord';
                        return true;
                    }
                }
                // 恢复数字炸弹
                if (data.numBomb && (data.view === 'numBomb' || data.view === 'numBombResult')) {
                    if (data.numBomb._savedAt && Date.now() - data.numBomb._savedAt > 3600000) {
                        localStorage.removeItem(GAMES_SAVE_KEY);
                        return false;
                    }
                    const restoredPlayers = data.numBomb.players.map(p => {
                        const restored = { ...p };
                        if (p.contactId && store.contacts) {
                            restored.contact = store.contacts.find(c => c.id === p.contactId) || null;
                        } else {
                            restored.contact = null;
                        }
                        delete restored.contactId;
                        return restored;
                    });
                    data.numBomb.players = restoredPlayers;
                    data.numBomb.aiThinking = false;
                    gamesState.numBomb = data.numBomb;
                    gamesState.view = data.view;
                    return true;
                }
                return false;
            } catch(e) {
                console.warn('恢复游戏状态失败:', e);
                localStorage.removeItem(GAMES_SAVE_KEY);
                return false;
            }
        }

        // 清除保存的游戏状态（用户主动退出时）
        function clearSavedGamesState() {
            localStorage.removeItem(GAMES_SAVE_KEY);
        }

        // 预设词库
        const guessWordBank = [
            '太阳', '月亮', '星星', '彩虹', '雪花', '蝴蝶', '猫咪', '小狗', '兔子', '熊猫',
            '苹果', '西瓜', '草莓', '蛋糕', '冰淇淋', '巧克力', '棒棒糖', '奶茶',
            '钢琴', '吉他', '气球', '风筝', '摩天轮', '过山车', '烟花', '圣诞树',
            '向日葵', '玫瑰花', '樱花', '四叶草', '仙人掌',
            '企鹅', '海豚', '独角兽', '恐龙', '孔雀', '萤火虫',
            '飞机', '火箭', '潜水艇', '热气球', '时光机',
            '披萨', '寿司', '火锅', '棉花糖', '爆米花',
            '超人', '魔法师', '美人鱼', '机器人', '外星人',
            '图书馆', '游乐园', '沙滩', '城堡', '树屋'
        ];

        let _gamesRestoreAttempted = false;
        function renderGamesHome() {
            const area = document.getElementById('games-content');
            const contacts = store.contacts.filter(c => !c.isGroup);

            // 首次进入游戏app时尝试恢复上次的游戏状态
            if (!_gamesRestoreAttempted && gamesState.view === 'home') {
                _gamesRestoreAttempted = true;
                if (restoreGamesState()) {
                    // 成功恢复，重新渲染
                    renderGamesHome();
                    return;
                }
            }
            
            if (gamesState.view === 'selectContact') {
                renderGameContactSelect(area, contacts);
                return;
            }
            if (gamesState.view === 'anonQA') {
                renderAnonQAGame(area);
                return;
            }
            if (gamesState.view === 'guessWord') {
                renderGuessWordGame(area);
                return;
            }
            if (gamesState.view === 'unoSetup') {
                renderUnoSetup(area, contacts);
                return;
            }
            if (gamesState.view === 'uno') {
                renderUnoGame(area);
                // 自动保存游戏状态
                saveGamesState();
                return;
            }
            if (gamesState.view === 'numBombSetup') {
                renderNumBombSetup(area, contacts);
                return;
            }
            if (gamesState.view === 'numBomb') {
                renderNumBombGame(area);
                saveGamesState();
                return;
            }
            if (gamesState.view === 'numBombResult') {
                renderNumBombResult(area);
                return;
            }
            if (gamesState.view === 'detectiveHome' || (gamesState.view && gamesState.view.startsWith && gamesState.view.startsWith('detective'))) {
                // [FIX] detectiveState.view 是唯一的真实数据源
                // 不再从 gamesState.view 反向解析覆盖 detectiveState.view
                // 这样 app-detective.js 中直接设置 detectiveState.view 后调用 renderGamesHome() 就能正确跳转
                if (!detectiveState.view) detectiveState.view = 'home';
                // 同步 gamesState.view 以反映当前的 detectiveState.view
                gamesState.view = 'detective' + detectiveState.view.charAt(0).toUpperCase() + detectiveState.view.slice(1);
                renderDetectiveMain(area);
                return;
            }

            // Home view
            area.innerHTML = `
                <div class="games-page">
                    <div class="nav-bar" style="background:#fafafa; border-bottom:1px solid #f0f0f0;">
                        <div class="nav-icon" onclick="exitApp()"><i class="fas fa-chevron-left" style="color:#1a1a1a;"></i></div>
                        <div class="nav-title" style="color:#1a1a1a; font-weight:700;">游戏</div>
                        <div style="width:40px;"></div>
                    </div>
                    <div class="scroll-y games-home-scroll">
                        <div class="games-hero">
                            <div class="games-hero-emoji">🎮</div>
                            <div class="games-hero-title">和好友一起玩吧</div>
                            <div class="games-hero-sub">选择一个游戏，邀请联系人开始互动</div>
                        </div>
                        <div class="games-list">
                            <div class="game-card game-card-anon" onclick="gamesState.view='selectContact'; gamesState._pendingGame='anonQA'; renderGamesHome();">
                                <div class="game-card-icon">🎭</div>
                                <div class="game-card-info">
                                    <div class="game-card-title">匿问我答</div>
                                    <div class="game-card-desc">匿名向好友提问，TA会认真回答哦～</div>
                                </div>
                                <div class="game-card-arrow"><i class="fas fa-chevron-right"></i></div>
                            </div>
                            <div class="game-card game-card-guess" onclick="gamesState.view='selectContact'; gamesState._pendingGame='guessWord'; renderGamesHome();">
                                <div class="game-card-icon">🤔</div>
                                <div class="game-card-info">
                                    <div class="game-card-title">你说我猜</div>
                                    <div class="game-card-desc">一方描述一方猜，看看默契有多高！</div>
                                </div>
                                <div class="game-card-arrow"><i class="fas fa-chevron-right"></i></div>
                            </div>
                            <div class="game-card game-card-uno" onclick="gamesState.view='unoSetup'; gamesState._pendingGame='uno'; renderGamesHome();">
                                <div class="game-card-icon">🃏</div>
                                <div class="game-card-info">
                                    <div class="game-card-title">UNO</div>
                                    <div class="game-card-desc">邀请好友一起玩UNO！不够4人自动匹配AI～</div>
                                </div>
                                <div class="game-card-arrow"><i class="fas fa-chevron-right"></i></div>
                            </div>
                            <div class="game-card game-card-bomb" onclick="gamesState.view='numBombSetup'; renderGamesHome();">
                                <div class="game-card-icon">💣</div>
                                <div class="game-card-info">
                                    <div class="game-card-title">数字炸弹</div>
                                    <div class="game-card-desc">猜数字，别踩雷！邀请好友一起紧张刺激～</div>
                                </div>
                                <div class="game-card-arrow"><i class="fas fa-chevron-right"></i></div>
                            </div>
                            <div class="game-card game-card-horror" onclick="openHorrorFromGames();" style="background:#fff; border:1px solid #e0e0e0;">
                                <div class="game-card-icon" style="background:#f0f0f0;">👻</div>
                                <div class="game-card-info">
                                    <div class="game-card-title" style="color:#333;">规则怪谈</div>
                                    <div class="game-card-desc" style="color:#999;">每一条规则都可能是救命稻草，也可能是致命陷阱</div>
                                </div>
                                <div class="game-card-arrow" style="color:#ccc;"><i class="fas fa-chevron-right"></i></div>
                            </div>
                            <div class="game-card game-card-detective" onclick="gamesState.view='detectiveHome'; renderGamesHome();" style="background:#fff; border:1px solid #e0e0e0;">
                                <div class="game-card-icon" style="background:#f0f0f0;">🔍</div>
                                <div class="game-card-info">
                                    <div class="game-card-title" style="color:#333;">迷雾追凶</div>
                                    <div class="game-card-desc" style="color:#999;">侦探推理破案，每局都是全新AI案件</div>
                                </div>
                                <div class="game-card-arrow" style="color:#ccc;"><i class="fas fa-chevron-right"></i></div>
                            </div>
                        </div>
                        <div class="games-footer-deco">
                            <span>·</span><span>·</span><span>·</span>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderGameContactSelect(area, contacts) {
            const gameName = gamesState._pendingGame === 'anonQA' ? '匿问我答 🎭' : '你说我猜 🤔';
            area.innerHTML = `
                <div class="games-page">
                    <div class="nav-bar" style="background:#fafafa; border-bottom:1px solid #f0f0f0;">
                        <div class="nav-icon" onclick="gamesState.view='home'; renderGamesHome();"><i class="fas fa-chevron-left" style="color:#1a1a1a;"></i></div>
                        <div class="nav-title" style="color:#1a1a1a; font-weight:700;">选择好友</div>
                        <div style="width:40px;"></div>
                    </div>
                    <div class="scroll-y" style="background:#fafafa; padding:15px;">
                        <div class="games-select-header">
                            <div class="games-select-emoji">💌</div>
                            <div class="games-select-text">邀请谁来玩 ${gameName}？</div>
                        </div>
                        <div class="games-contact-list">
                            ${contacts.length === 0 ? '<div style="text-align:center; color:#ccc; padding:40px; font-size:14px;">还没有联系人哦，先去添加好友吧～</div>' :
                            contacts.map(c => `
                                <div class="games-contact-item" onclick="selectGameContact('${c.id}')">
                                    <img src="${c.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.name[0]) + '&background=ffb6c1&color=fff'}" class="games-contact-avatar">
                                    <div class="games-contact-name">${c.name}</div>
                                    <div class="games-contact-invite">邀请 💕</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        function selectGameContact(contactId) {
            const contact = store.contacts.find(c => c.id === contactId);
            if (!contact) return toast('找不到该联系人');
            gamesState.selectedContact = contact;
            
            if (gamesState._pendingGame === 'anonQA') {
                gamesState.view = 'anonQA';
                // [FIX-匿问我答持久化] 优先从localStorage恢复历史数据，不存在才新建
                const savedQA = loadAnonQAData(contactId);
                if (savedQA) {
                    gamesState.anonQA = savedQA;
                } else {
                    gamesState.anonQA = { questions: [], currentAnswer: '', mode: 'ask', inbox: [] };
                }
            } else {
                gamesState.view = 'guessWord';
                gamesState.guessWord = {
                    messages: [], currentWord: '', isDescriber: true,
                    score: { user: 0, contact: 0 }, revealed: false, generating: false
                };
            }
            renderGamesHome();
        }

        // ========== 匿问我答 (Social Feed Style) ==========
        function renderAnonQAGame(area) {
            const contact = gamesState.selectedContact;
            if (!contact) { gamesState.view = 'home'; renderGamesHome(); return; }
            const qa = gamesState.anonQA;
            if (!qa.mode) qa.mode = 'ask';
            if (!qa.inbox) qa.inbox = [];

            const isAskMode = qa.mode === 'ask';
            const unreadCount = qa.inbox.filter(x => !x.myAnswer).length;
            const userName = store.user?.name || '我';

            area.innerHTML = `
                <div class="games-page aqa-page">
                    <div class="aqa-nav">
                        <div class="aqa-nav-back" onclick="gamesState.view='home'; renderGamesHome();"><i class="fas fa-arrow-left"></i></div>
                        <div class="aqa-nav-title">匿问我答</div>
                        <div class="aqa-nav-right"></div>
                    </div>
                    <div class="aqa-tabs">
                        <div class="aqa-tab ${isAskMode?'active':''}" onclick="gamesState.anonQA.mode='ask';renderGamesHome();">
                            <i class="fas fa-paper-plane"></i> 我问TA
                        </div>
                        <div class="aqa-tab ${!isAskMode?'active':''}" onclick="gamesState.anonQA.mode='inbox';renderGamesHome();">
                            <i class="fas fa-inbox"></i> TA问我
                            ${unreadCount > 0 ? '<span class="aqa-tab-badge">' + unreadCount + '</span>' : ''}
                        </div>
                    </div>
                    <div class="scroll-y aqa-feed" id="anon-qa-scroll">
                        ${isAskMode ? renderAnonQA_AskMode(contact, qa) : renderAnonQA_InboxMode(contact, qa)}
                    </div>
                    ${isAskMode ? `
                    <div class="aqa-compose">
                        <div class="aqa-compose-avatar"><i class="fas fa-mask"></i></div>
                        <input type="text" id="anon-qa-input" class="aqa-compose-input" placeholder="匿名提问..." onkeypress="if(event.key==='Enter') sendAnonQuestion()">
                        <button class="aqa-compose-send" onclick="sendAnonQuestion()"><i class="fas fa-paper-plane"></i></button>
                    </div>` : `
                    <div class="aqa-compose">
                        <button class="aqa-gen-btn" onclick="generateCharQuestion()"><i class="fas fa-magic"></i> 让${contact.name}匿名问我一个问题</button>
                    </div>`}
                </div>
            `;
            setTimeout(() => {
                const scroll = document.getElementById('anon-qa-scroll');
                if (scroll) scroll.scrollTop = scroll.scrollHeight;
            }, 100);
        }

        function _aqaTimeAgo(ts) {
            if (!ts) return '';
            const diff = Date.now() - ts;
            if (diff < 60000) return '刚刚';
            if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
            if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
            return Math.floor(diff / 86400000) + ' 天前';
        }

        function renderAnonQA_AskMode(contact, qa) {
            if (qa.questions.length === 0) {
                return `
                    <div class="aqa-empty">
                        <div class="aqa-empty-icon">📭</div>
                        <div class="aqa-empty-text">还没有提问<br>在下方输入你想匿名问的问题</div>
                    </div>`;
            }
            return qa.questions.map((q, i) => {
                // [FIX-多轮对话] 渲染追问追答链
                const replies = q.replies || [];
                let repliesHtml = replies.map((r, ri) => {
                    if (r.role === 'user') {
                        return `<div class="aqa-comment aqa-comment-me">
                            <div class="aqa-comment-avatar-me"><i class="fas fa-mask"></i></div>
                            <div class="aqa-comment-content">
                                <span class="aqa-comment-name">匿名追问</span>
                                <span class="aqa-comment-text">${r.text}</span>
                            </div>
                        </div>`;
                    } else {
                        return `<div class="aqa-comment">
                            <img src="${contact.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(contact.name[0]) + '&background=222&color=fff&size=64'}" class="aqa-comment-avatar">
                            <div class="aqa-comment-content">
                                <span class="aqa-comment-name">${contact.name}</span>
                                <span class="aqa-comment-text">${r.text}</span>
                            </div>
                        </div>`;
                    }
                }).join('');
                // 如果最后一条是联系人回复（或第一轮answer已生成），显示追问输入框
                const lastRole = replies.length > 0 ? replies[replies.length - 1].role : (q.answer ? 'contact' : null);
                const showFollowUp = lastRole === 'contact';
                // 如果最后一条是用户追问，显示"联系人思考中"
                const showThinking = replies.length > 0 && replies[replies.length - 1].role === 'user' && !replies[replies.length - 1]._answered;

                return `<div class="aqa-post">
                    <div class="aqa-post-header">
                        <div class="aqa-post-avatar anon"><i class="fas fa-mask"></i></div>
                        <div class="aqa-post-meta">
                            <div class="aqa-post-author">匿名提问</div>
                            <div class="aqa-post-time">${_aqaTimeAgo(q.time)}</div>
                        </div>
                        <div class="aqa-post-actions">
                            <div class="aqa-post-action" onclick="event.stopPropagation(); regenerateAnonAnswer(${i})" title="重新生成回答"><i class="fas fa-redo-alt"></i></div>
                        </div>
                    </div>
                    <div class="aqa-post-body">${q.question}</div>
                    ${q.answer ? `
                        <div class="aqa-comment">
                            <img src="${contact.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(contact.name[0]) + '&background=222&color=fff&size=64'}" class="aqa-comment-avatar">
                            <div class="aqa-comment-content">
                                <span class="aqa-comment-name">${contact.name}</span>
                                <span class="aqa-comment-text">${q.answer}</span>
                            </div>
                        </div>
                        ${repliesHtml}
                        ${showThinking ? `
                            <div class="aqa-loading">
                                <div class="aqa-loading-dots"><span></span><span></span><span></span></div>
                                <span>${contact.name} 正在思考...</span>
                            </div>
                        ` : ''}
                        ${showFollowUp ? `
                            <div class="aqa-reply-bar" style="margin-top:8px;">
                                <input type="text" class="aqa-reply-input" id="anon-followup-${i}" placeholder="继续追问..." onkeypress="if(event.key==='Enter') sendAskFollowUp(${i})">
                                <button class="aqa-reply-btn" onclick="sendAskFollowUp(${i})"><i class="fas fa-reply"></i></button>
                            </div>
                        ` : ''}
                    ` : `
                        <div class="aqa-loading">
                            <div class="aqa-loading-dots"><span></span><span></span><span></span></div>
                            <span>${contact.name} 正在思考...</span>
                        </div>
                    `}
                </div>`;
            }).join('');
        }

        function renderAnonQA_InboxMode(contact, qa) {
            if (qa.inbox.length === 0) {
                return `
                    <div class="aqa-empty">
                        <div class="aqa-empty-icon">🤷</div>
                        <div class="aqa-empty-text">还没有收到匿名提问<br>点击下方按钮让TA问你一个问题</div>
                    </div>`;
            }
            return qa.inbox.map((q, i) => {
                // [FIX-多轮对话] 渲染TA问我的追问追答链
                const replies = q.replies || [];
                let repliesHtml = replies.map((r, ri) => {
                    if (r.role === 'contact') {
                        return `<div class="aqa-comment">
                            <img src="${contact.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(contact.name[0]) + '&background=222&color=fff&size=64'}" class="aqa-comment-avatar">
                            <div class="aqa-comment-content">
                                <span class="aqa-comment-name">${contact.name}</span>
                                <span class="aqa-comment-text">${r.text}</span>
                            </div>
                        </div>`;
                    } else {
                        return `<div class="aqa-comment aqa-comment-me">
                            <div class="aqa-comment-avatar-me"><i class="fas fa-user"></i></div>
                            <div class="aqa-comment-content">
                                <span class="aqa-comment-name">我的回复</span>
                                <span class="aqa-comment-text">${r.text}</span>
                            </div>
                        </div>`;
                    }
                }).join('');
                // 判断是否显示继续回复输入框：联系人最后发了消息（包括初始回复后的追问、或replies中的联系人消息）
                const lastRole = replies.length > 0 ? replies[replies.length - 1].role : (q.myAnswer ? 'user' : null);
                const showFollowUp = lastRole === 'contact';
                // 如果正在等待联系人回复，显示思考中动画
                const showThinking = q._waitingContactReply || (replies.length > 0 && replies[replies.length - 1].role === 'user' && replies[replies.length - 1]._pending);

                return `<div class="aqa-post">
                    <div class="aqa-post-header">
                        <div class="aqa-post-avatar secret"><i class="fas fa-user-secret"></i></div>
                        <div class="aqa-post-meta">
                            <div class="aqa-post-author">匿名来信</div>
                            <div class="aqa-post-time">${_aqaTimeAgo(q.time)}</div>
                        </div>
                        <div class="aqa-post-actions">
                            <div class="aqa-post-action" onclick="event.stopPropagation(); regenerateInboxQuestion(${i})" title="换一个问题"><i class="fas fa-sync-alt"></i></div>
                        </div>
                    </div>
                    <div class="aqa-post-body">${q.question}</div>
                    ${q.myAnswer ? `
                        <div class="aqa-comment aqa-comment-me">
                            <div class="aqa-comment-avatar-me"><i class="fas fa-user"></i></div>
                            <div class="aqa-comment-content">
                                <span class="aqa-comment-name">我的回答</span>
                                <span class="aqa-comment-text">${q.myAnswer}</span>
                            </div>
                            <div class="aqa-comment-regen" onclick="event.stopPropagation(); regenerateInboxAnswer(${i})" title="重新回答"><i class="fas fa-redo-alt"></i></div>
                        </div>
                        ${repliesHtml}
                        ${showThinking ? `
                            <div class="aqa-loading">
                                <div class="aqa-loading-dots"><span></span><span></span><span></span></div>
                                <span>${contact.name} 正在回复...</span>
                            </div>
                        ` : ''}
                        ${q._verifying ? `
                            <div class="aqa-verify loading">
                                <i class="fas fa-spinner fa-spin"></i> 正在转发给${contact.name}验证中...
                            </div>
                        ` : q.verified === undefined ? `
                            <div class="aqa-verify">
                                <span class="aqa-verify-hint">想知道是不是${contact.name}问的？</span>
                                <button class="aqa-verify-btn" onclick="forwardVerifyQuestion(${i})"><i class="fas fa-share"></i> 转发验证</button>
                            </div>
                        ` : `
                            <div class="aqa-verify-result ${q.verified ? 'confirmed' : 'denied'}">
                                <div class="aqa-verify-status">
                                    <i class="fas fa-${q.verified ? 'check-circle' : 'times-circle'}"></i>
                                    ${q.verified ? contact.name + '承认了：这是TA问的' : contact.name + '否认了：不是TA问的'}
                                </div>
                                ${q.verifyReply ? '<div class="aqa-verify-reply">"' + q.verifyReply.replace(/\n/g, '<br>') + '"</div>' : ''}
                                ${q.verifyTime ? '<div class="aqa-verify-time">' + _aqaTimeAgo(q.verifyTime) + '</div>' : ''}
                            </div>
                        `}
                        ${showFollowUp ? `
                            <div class="aqa-reply-bar" style="margin-top:8px;">
                                <input type="text" class="aqa-reply-input" id="inbox-followup-${i}" placeholder="继续回复..." onkeypress="if(event.key==='Enter') sendInboxFollowUp(${i})">
                                <button class="aqa-reply-btn" onclick="sendInboxFollowUp(${i})"><i class="fas fa-reply"></i></button>
                            </div>
                        ` : ''}
                    ` : `
                        <div class="aqa-reply-bar">
                            <input type="text" class="aqa-reply-input" id="anon-reply-${i}" placeholder="写下你的回答..." onkeypress="if(event.key==='Enter') answerInboxQuestion(${i})">
                            <button class="aqa-reply-btn" onclick="answerInboxQuestion(${i})"><i class="fas fa-reply"></i></button>
                        </div>
                    `}
                </div>`;
            }).join('');
        }

        async function sendAnonQuestion() {
            const input = document.getElementById('anon-qa-input');
            if (!input) return;
            const question = input.value.trim();
            if (!question) return toast('请输入问题');
            
            const contact = gamesState.selectedContact;
            if (!contact) return;

            const qIdx = gamesState.anonQA.questions.length;
            gamesState.anonQA.questions.push({ question, answer: '', time: Date.now() });
            input.value = '';
            renderGamesHome();

            try {
                const sysPrompt = buildGameSystemPrompt(contact, 'anonQA');
                const messages = [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: `你收到了一条匿名提问：「${question}」\n你不知道是谁问的。请用你自己的说话方式回答，2-4句话，自然口语化。只输出回答内容本身。` }
                ];
                const answer = await callGameAI(messages);
                gamesState.anonQA.questions[qIdx].answer = answer;
                saveAnonQAData(contact.id); // [FIX-匿问我答持久化]
                renderGamesHome();
            } catch(e) {
                gamesState.anonQA.questions[qIdx].answer = '（回答生成失败，请重试）';
                saveAnonQAData(contact.id); // [FIX-匿问我答持久化]
                renderGamesHome();
            }
        }

        // Character proactively asks user a question
        async function generateCharQuestion() {
            const contact = gamesState.selectedContact;
            if (!contact) return;
            const qa = gamesState.anonQA;
            if (!qa.inbox) qa.inbox = [];

            toast(contact.name + ' 正在想问题...');
            try {
                const sysPrompt = buildGameSystemPrompt(contact, 'anonQA');
                const existingQs = qa.inbox.map(q => q.question).join('；');
                const messages = [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: `你现在要匿名向对方提一个问题。这个问题应该体现你的好奇心和性格特点，可以是关于对方的喜好、秘密、感情、日常等。问题要有趣、有深度，让人想认真回答。${existingQs ? '已经问过的问题（不要重复）：' + existingQs : ''}\n只输出问题本身，不要加任何前缀或解释。一个问题即可。` }
                ];
                const question = await callGameAI(messages);
                qa.inbox.push({ question: question.replace(/^["""「『]|["""」』]$/g, '').trim(), time: Date.now(), fromContactId: contact.id });
                saveAnonQAData(contact.id); // [FIX-匿问我答持久化]
                renderGamesHome();
                toast('收到一个匿名提问！');
            } catch(e) {
                toast('生成问题失败：' + e.message);
            }
        }

        // User answers an inbox question
        function answerInboxQuestion(idx) {
            const input = document.getElementById('anon-reply-' + idx);
            if (!input) return;
            const answer = input.value.trim();
            if (!answer) return toast('请输入回答');
            gamesState.anonQA.inbox[idx].myAnswer = answer;
            if (gamesState.selectedContact) saveAnonQAData(gamesState.selectedContact.id); // [FIX-匿问我答持久化]
            renderGamesHome();
            // [FIX-多轮对话] 用户回答后自动触发联系人追问
            _triggerInboxContactReply(idx);
        }

        // ========== [NEW] 匿问我答 多轮对话 ==========

        // 构建多轮对话的消息历史（用于AI上下文）
        function _buildAnonConversationHistory(q, mode) {
            const msgs = [];
            if (mode === 'ask') {
                // 我问TA模式：用户匿名提问 → 联系人回答 → 追问链
                msgs.push({ role: 'user', content: '匿名提问：「' + q.question + '」' });
                if (q.answer) msgs.push({ role: 'assistant', content: q.answer });
                (q.replies || []).forEach(r => {
                    if (r.role === 'user') msgs.push({ role: 'user', content: r.text });
                    else msgs.push({ role: 'assistant', content: r.text });
                });
            } else {
                // TA问我模式：联系人提问 → 用户回答 → 追答链
                msgs.push({ role: 'assistant', content: '我匿名问了对方一个问题：「' + q.question + '」' });
                if (q.myAnswer) msgs.push({ role: 'user', content: '对方回答：「' + q.myAnswer + '」' });
                (q.replies || []).forEach(r => {
                    if (r.role === 'user') msgs.push({ role: 'user', content: '对方说：「' + r.text + '」' });
                    else msgs.push({ role: 'assistant', content: r.text });
                });
            }
            return msgs;
        }

        // 我问TA模式：用户追问，AI回答
        async function sendAskFollowUp(idx) {
            const input = document.getElementById('anon-followup-' + idx);
            if (!input) return;
            const text = input.value.trim();
            if (!text) return toast('请输入追问');
            const contact = gamesState.selectedContact;
            if (!contact) return;
            const q = gamesState.anonQA.questions[idx];
            if (!q) return;
            if (!q.replies) q.replies = [];

            q.replies.push({ role: 'user', text, time: Date.now() });
            input.value = '';
            renderGamesHome();

            try {
                const sysPrompt = buildGameSystemPrompt(contact, 'anonQA');
                const history = _buildAnonConversationHistory(q, 'ask');
                const messages = [
                    { role: 'system', content: sysPrompt + '\n\n这是一个匿名问答的多轮对话。你之前回答了匿名提问，现在对方继续追问。用你的说话方式自然回答，1-3句话。只输出回答内容。' },
                    ...history
                ];
                const reply = await callGameAI(messages);
                q.replies.push({ role: 'contact', text: reply, time: Date.now() });
                saveAnonQAData(contact.id);
                renderGamesHome();
            } catch(e) {
                q.replies.push({ role: 'contact', text: '（回复生成失败，请重试）', time: Date.now() });
                saveAnonQAData(contact.id);
                renderGamesHome();
            }
        }

        // TA问我模式：用户回答后自动触发联系人追问
        async function _triggerInboxContactReply(idx) {
            const contact = gamesState.selectedContact;
            if (!contact) return;
            const q = gamesState.anonQA.inbox[idx];
            if (!q) return;
            if (!q.replies) q.replies = [];

            // [FIX-多轮对话v2] 用标记位控制思考动画，不再将用户回答重复推入replies
            q._waitingContactReply = true;
            renderGamesHome();

            try {
                const sysPrompt = buildGameSystemPrompt(contact, 'anonQA');
                const history = _buildAnonConversationHistory(q, 'inbox');
                const messages = [
                    { role: 'system', content: sysPrompt + '\n\n你之前匿名问了对方一个问题，现在看到了对方的回答。请根据对方的回答做出自然的反应（可以是追问、评论、调侃、感谢等），用你的说话方式，1-3句话。只输出回应内容。' },
                    ...history
                ];
                const reply = await callGameAI(messages);
                delete q._waitingContactReply;
                q.replies.push({ role: 'contact', text: reply, time: Date.now() });
                saveAnonQAData(contact.id);
                renderGamesHome();
            } catch(e) {
                delete q._waitingContactReply;
                toast('联系人回复生成失败，请重试');
                saveAnonQAData(contact.id);
                renderGamesHome();
            }
        }

        // TA问我模式：用户继续回复联系人的追问
        async function sendInboxFollowUp(idx) {
            const input = document.getElementById('inbox-followup-' + idx);
            if (!input) return;
            const text = input.value.trim();
            if (!text) return toast('请输入回复');
            const contact = gamesState.selectedContact;
            if (!contact) return;
            const q = gamesState.anonQA.inbox[idx];
            if (!q) return;
            if (!q.replies) q.replies = [];

            q.replies.push({ role: 'user', text, time: Date.now(), _pending: true });
            input.value = '';
            renderGamesHome();

            try {
                const sysPrompt = buildGameSystemPrompt(contact, 'anonQA');
                const history = _buildAnonConversationHistory(q, 'inbox');
                const messages = [
                    { role: 'system', content: sysPrompt + '\n\n这是匿名问答的多轮对话。你之前匿名问了对方问题，对方又回复了你。请自然地继续对话（追问、评论、调侃等），1-3句话。只输出回应内容。' },
                    ...history
                ];
                const reply = await callGameAI(messages);
                if (q.replies.length > 0) delete q.replies[q.replies.length - 1]._pending;
                q.replies.push({ role: 'contact', text: reply, time: Date.now() });
                saveAnonQAData(contact.id);
                renderGamesHome();
            } catch(e) {
                if (q.replies.length > 0) delete q.replies[q.replies.length - 1]._pending;
                q.replies.push({ role: 'contact', text: '（回复生成失败）', time: Date.now() });
                saveAnonQAData(contact.id);
                renderGamesHome();
            }
        }

        // Forward question to contact to verify identity
        // [FIX-匿问我答转发验证v2] 增强：防重复、加载气泡、联系人读取、超时保护、滚动保持
        let _forwardVerifying = false;
        async function forwardVerifyQuestion(idx) {
            // 防止重复点击
            if (_forwardVerifying) {
                toast('正在验证中，请稍候...');
                return;
            }
            
            const contact = gamesState.selectedContact;
            if (!contact) {
                toast('找不到联系人信息，请重新选择', 'error');
                return;
            }
            
            // [FIX] 确保qa和inbox已初始化
            if (!gamesState.anonQA) gamesState.anonQA = { questions: [], currentAnswer: '', mode: 'inbox', inbox: [] };
            const qa = gamesState.anonQA;
            if (!qa.inbox) qa.inbox = [];
            
            const q = qa.inbox[idx];
            if (!q) {
                toast('找不到该问题', 'error');
                return;
            }
            if (q.verified !== undefined) {
                toast('该问题已经验证过了');
                return;
            }
            if (!q.myAnswer) {
                toast('请先回答问题再转发验证', 'error');
                return;
            }

            _forwardVerifying = true;
            
            // [FIX] 立即显示加载状态气泡并禁用按钮
            q._verifying = true;
            renderGamesHome();
            
            // [FIX] 保持滚动位置
            const scrollEl = document.getElementById('anon-qa-scroll');
            const scrollPos = scrollEl ? scrollEl.scrollTop : 0;
            
            toast('正在转发给 ' + contact.name + ' 验证...');
            
            try {
                // [FIX] 读取联系人完整人设、世界书、记忆和聊天记录
                const sysPrompt = buildGameSystemPrompt(contact, 'anonQA');
                
                // [FIX-验证逻辑v3] 修复逻辑矛盾：inbox中的问题100%是联系人生成的，
                // 所以验证结果必须最终承认。但为了趣味性，允许联系人先耍赖/害羞后承认。
                // 随机选择承认风格：直接承认 / 害羞承认 / 先装不知道再承认
                const confStyles = ['direct', 'shy', 'playful'];
                const confStyle = confStyles[Math.floor(Math.random() * confStyles.length)];
                let verifyContext = `对方收到了一条匿名提问：「${q.question}」`;
                if (q.myAnswer) {
                    verifyContext += `\n对方回答了：「${q.myAnswer}」`;
                }
                verifyContext += `\n\n现在对方来问你：这个匿名问题是不是你问的？`;
                verifyContext += `\n\n这个问题确实是你问的。`;
                if (confStyle === 'direct') {
                    verifyContext += `请大方承认，用你的说话风格解释为什么想问这个。看到对方的回答后，也可以发表一下感想。`;
                } else if (confStyle === 'shy') {
                    verifyContext += `你有点不好意思被发现了，但还是承认了。用你的说话风格，表现出害羞/不好意思的样子来承认。`;
                } else {
                    verifyContext += `你先装作不知道、故作惊讶，但最后还是承认了是你问的。用你的说话风格，先稍微耍赖一下然后大方承认。`;
                }
                verifyContext += `\n\n格式要求（严格遵守）：`;
                verifyContext += `\n第一行只写"是"`;
                verifyContext += `\n第二行开始写你的回应（用你的说话风格，2-3句话，自然口语化，不要加动作描写）`;
                
                const messages = [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: verifyContext }
                ];
                
                // [MOD] 不做超时限制
                const reply = await callGameAI(messages);
                
                const lines = reply.split('\n').filter(l => l.trim());
                const firstLine = (lines[0] || '').trim();
                // [FIX] 更健壮的判断逻辑 - 支持更多变体
                const isConfirmed = /^是[的呀啊哦嗯，,!！~～.]|^是$/.test(firstLine)
                    && !/^不/.test(firstLine) && !firstLine.includes('不是');
                const verifyReply = lines.slice(1).join('\n').trim() || (lines.length > 0 ? lines[0] : '（无回应）');

                q.verified = isConfirmed;
                q.verifyReply = verifyReply;
                q.verifyTime = Date.now();
                q.verifyContactName = contact.name;
                q.verifyContactAvatar = contact.avatar;
                delete q._verifying;
                renderGamesHome();
                
                // [FIX] 恢复滚动位置
                setTimeout(() => {
                    const el = document.getElementById('anon-qa-scroll');
                    if (el) el.scrollTop = scrollPos;
                }, 50);
                
                // [FIX] 显示验证结果toast
                if (isConfirmed) {
                    toast(`${contact.name} 承认了：这是TA问的！ 😏`);
                } else {
                    toast(`${contact.name} 否认了：不是TA问的 🤔`);
                }
            } catch(e) {
                delete q._verifying;
                console.error('转发验证失败:', e);
                toast('验证失败：' + (e.message || '网络错误，请重试'), 'error');
                renderGamesHome();
                // [FIX] 恢复滚动位置
                setTimeout(() => {
                    const el = document.getElementById('anon-qa-scroll');
                    if (el) el.scrollTop = scrollPos;
                }, 50);
            } finally {
                _forwardVerifying = false;
            }
        }

        // ========== 匿问我答: 重新生成功能 ==========
        async function regenerateAnonAnswer(idx) {
            const contact = gamesState.selectedContact;
            if (!contact) return;
            const qa = gamesState.anonQA;
            const q = qa.questions[idx];
            if (!q) return;
            q.answer = '';
            renderGamesHome();
            toast('重新生成回答中...');
            try {
                const sysPrompt = buildGameSystemPrompt(contact, 'anonQA');
                const messages = [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: `你收到了一条匿名提问：「${q.question}」\n你不知道是谁问的。请用你自己的说话方式回答，2-4句话，自然口语化。给出一个不同于之前的回答。只输出回答内容本身。` }
                ];
                const answer = await callGameAI(messages);
                qa.questions[idx].answer = answer;
                if (contact) saveAnonQAData(contact.id); // [FIX-匿问我答持久化]
                renderGamesHome();
            } catch(e) {
                qa.questions[idx].answer = '（回答生成失败，请重试）';
                if (contact) saveAnonQAData(contact.id); // [FIX-匿问我答持久化]
                renderGamesHome();
            }
        }

        // Note: regenerateAnonQuestion actually regenerates the answer for a given question (keeps original question)
        async function regenerateAnonQuestion(idx) {
            return regenerateAnonAnswer(idx);
        }

        async function regenerateInboxQuestion(idx) {
            const contact = gamesState.selectedContact;
            if (!contact) return;
            const qa = gamesState.anonQA;
            if (!qa.inbox || !qa.inbox[idx]) return;
            toast('换一个问题...');
            try {
                const sysPrompt = buildGameSystemPrompt(contact, 'anonQA');
                const existingQs = qa.inbox.map(q => q.question).join('；');
                const messages = [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: `你现在要匿名向对方提一个问题。问题要体现你的好奇心和性格特点，可以关于对方的喜好、秘密、感情、日常等。要有趣、有深度。${existingQs ? '已经问过的（不要重复）：' + existingQs : ''}\n只输出问题本身，一个问题，不要加前缀或解释。` }
                ];
                const question = await callGameAI(messages);
                qa.inbox[idx].question = question.replace(/^["""「『]|["""」』]$/g, '').trim();
                qa.inbox[idx].time = Date.now();
                qa.inbox[idx].myAnswer = '';
                delete qa.inbox[idx].verified;
                delete qa.inbox[idx].verifyReply;
                delete qa.inbox[idx].verifyTime;
                delete qa.inbox[idx]._verifying;
                renderGamesHome();
            } catch(e) {
                toast('重新生成失败：' + e.message);
            }
        }

        function regenerateInboxAnswer(idx) {
            const qa = gamesState.anonQA;
            if (!qa.inbox || !qa.inbox[idx]) return;
            qa.inbox[idx].myAnswer = '';
            delete qa.inbox[idx].verified;
            delete qa.inbox[idx].verifyReply;
            delete qa.inbox[idx].verifyTime;
            delete qa.inbox[idx]._verifying;
            renderGamesHome();
        }

        // ========== 你说我猜 ==========
        function renderGuessWordGame(area) {
            const contact = gamesState.selectedContact;
            if (!contact) { gamesState.view = 'home'; renderGamesHome(); return; }
            const gw = gamesState.guessWord;

            const roleText = gw.isDescriber ? '你来描述' : `${contact.name} 来描述`;
            const roleEmoji = gw.isDescriber ? '🗣️' : '👂';

            area.innerHTML = `
                <div class="games-page">
                    <div class="nav-bar" style="background:#fff; border-bottom:1px solid #e0e0e0; border:none;">
                        <div class="nav-icon" onclick="gamesState.view='home'; renderGamesHome();"><i class="fas fa-chevron-left" style="color:#333;"></i></div>
                        <div class="nav-title" style="color:#333; font-weight:700;">🤔 你说我猜</div>
                        <div class="nav-icon" onclick="showGuessWordRules()"><i class="fas fa-question-circle" style="color:#333;"></i></div>
                    </div>
                    <div class="scroll-y guess-word-scroll" id="guess-word-scroll">
                        <div class="guess-word-header">
                            <div class="guess-word-score-board">
                                <div class="guess-score-item">
                                    <div class="guess-score-label">我</div>
                                    <div class="guess-score-val">${gw.score.user}</div>
                                </div>
                                <div class="guess-score-vs">VS</div>
                                <div class="guess-score-item">
                                    <div class="guess-score-label">${contact.name}</div>
                                    <div class="guess-score-val">${gw.score.contact}</div>
                                </div>
                            </div>
                            <div class="guess-word-role-badge">${roleEmoji} 当前：${roleText}</div>
                        </div>

                        ${gw.currentWord ? `
                            <div class="guess-word-card ${gw.isDescriber ? 'describer' : 'guesser'}">
                                ${gw.isDescriber ? `
                                    <div class="guess-word-label">你要描述的词语是：</div>
                                    <div class="guess-word-reveal">${gw.currentWord}</div>
                                    <div class="guess-word-tip">💡 不能说出词语中的任何一个字哦！</div>
                                ` : `
                                    <div class="guess-word-label">猜猜 ${contact.name} 在描述什么？</div>
                                    <div class="guess-word-reveal">${gw.revealed ? gw.currentWord : '❓❓❓'}</div>
                                    ${gw.revealed ? '<div class="guess-word-tip">答案已揭晓！</div>' : '<div class="guess-word-tip">仔细听描述，大胆猜！</div>'}
                                `}
                            </div>
                        ` : `
                            <div class="guess-word-start-area">
                                <div style="font-size:60px; margin-bottom:15px;">🎲</div>
                                <div style="font-size:16px; color:#666; margin-bottom:20px;">准备好了吗？</div>
                                <div class="guess-word-mode-btns">
                                    <button class="guess-mode-btn guess-mode-describe" onclick="startGuessRound(true)">
                                        <i class="fas fa-comment-dots"></i> 我来描述
                                    </button>
                                    <button class="guess-mode-btn guess-mode-guess" onclick="startGuessRound(false)">
                                        <i class="fas fa-lightbulb"></i> 我来猜
                                    </button>
                                </div>
                            </div>
                        `}

                        <div class="guess-word-chat" id="guess-word-chat">
                            ${gw.messages.map(m => `
                                <div class="guess-msg ${m.role}">
                                    ${m.role === 'user' ? `
                                        <div class="guess-msg-bubble guess-msg-user">${m.text}</div>
                                    ` : `
                                        <div class="guess-msg-bubble guess-msg-contact">${m.text}</div>
                                    `}
                                </div>
                            `).join('')}
                            ${gw.generating ? `
                                <div class="guess-msg contact">
                                    <div class="guess-msg-bubble guess-msg-contact">
                                        <div class="aqa-loading-dots"><span></span><span></span><span></span></div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    ${gw.currentWord ? `
                        <div class="guess-word-input-bar">
                            <input type="text" id="guess-word-input" class="guess-word-input"
                                placeholder="${gw.isDescriber ? '输入描述...' : '输入你的猜测...'}"
                                onkeypress="if(event.key==='Enter') sendGuessMessage()">
                            <button class="guess-word-send-btn" onclick="sendGuessMessage()"><i class="fas fa-paper-plane"></i></button>
                            <button class="guess-word-action-btn" onclick="guessWordAction()" title="${gw.isDescriber ? '换一个词' : '揭晓答案'}">
                                ${gw.isDescriber ? '<i class="fas fa-sync-alt"></i>' : '<i class="fas fa-eye"></i>'}
                            </button>
                            <button class="guess-word-next-btn" onclick="nextGuessRound()" title="下一轮">
                                <i class="fas fa-forward"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
            // Scroll chat to bottom
            setTimeout(() => {
                const scroll = document.getElementById('guess-word-scroll');
                if (scroll) scroll.scrollTop = scroll.scrollHeight;
            }, 100);
        }

        function startGuessRound(isDescriber) {
            const gw = gamesState.guessWord;
            gw.isDescriber = isDescriber;
            gw.currentWord = guessWordBank[Math.floor(Math.random() * guessWordBank.length)];
            gw.messages = [];
            gw.revealed = false;
            gw.generating = false;

            if (!isDescriber) {
                // Contact describes first
                generateContactDescription();
            }
            renderGamesHome();
        }

        async function generateContactDescription() {
            const contact = gamesState.selectedContact;
            const gw = gamesState.guessWord;
            if (!contact || !gw.currentWord) return;

            gw.generating = true;
            renderGamesHome();

            try {
                const sysPrompt = buildGameSystemPrompt(contact, 'guessWord');
                const chatHistory = gw.messages.map(m => ({
                    role: m.role === 'user' ? 'user' : 'assistant',
                    content: m.text
                }));
                const messages = [
                    { role: 'system', content: sysPrompt },
                    ...chatHistory,
                    { role: 'user', content: gw.messages.length === 0 ?
                        `你现在要描述「${gw.currentWord}」这个词，让对方猜。不能说出词语中的任何一个字，用你自己的说话风格来描述，给出一个提示。简短一些，1-2句话。` :
                        `对方还没猜对，请再给一个新的提示来描述「${gw.currentWord}」，不能说出词语中的任何一个字。换个角度描述，1-2句话。`
                    }
                ];
                const reply = await callGameAI(messages);
                gw.messages.push({ role: 'contact', text: reply });
            } catch(e) {
                gw.messages.push({ role: 'contact', text: '（描述生成失败，请重试）' });
            }
            gw.generating = false;
            renderGamesHome();
        }

        async function sendGuessMessage() {
            const input = document.getElementById('guess-word-input');
            if (!input) return;
            const text = input.value.trim();
            if (!text) return;

            const contact = gamesState.selectedContact;
            const gw = gamesState.guessWord;
            if (!contact || !gw.currentWord) return;

            gw.messages.push({ role: 'user', text });
            input.value = '';

            if (gw.isDescriber) {
                // User is describing, contact guesses
                renderGamesHome();
                gw.generating = true;
                renderGamesHome();

                try {
                    const sysPrompt = buildGameSystemPrompt(contact, 'guessWord');
                    const chatHistory = gw.messages.map(m => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.text
                    }));
                    const messages = [
                        { role: 'system', content: sysPrompt },
                        { role: 'user', content: `我们在玩你说我猜游戏。我在描述一个词语，你来猜。根据我的描述，猜一个词语。只需要说出你猜的词语和简短的理由。用你自己的说话风格回答。` },
                        ...chatHistory
                    ];
                    const reply = await callGameAI(messages);
                    gw.messages.push({ role: 'contact', text: reply });

                    // Check if guessed correctly
                    if (reply.includes(gw.currentWord)) {
                        gw.score.contact += 1;
                        gw.messages.push({ role: 'contact', text: `🎉 我猜对了！是「${gw.currentWord}」！` });
                        gw.revealed = true;
                    }
                } catch(e) {
                    gw.messages.push({ role: 'contact', text: '（回复生成失败）' });
                }
                gw.generating = false;
                renderGamesHome();
            } else {
                // User is guessing
                renderGamesHome();
                if (text.includes(gw.currentWord) || gw.currentWord.includes(text)) {
                    gw.score.user += 1;
                    gw.messages.push({ role: 'contact', text: `🎉 恭喜你猜对了！答案就是「${gw.currentWord}」！` });
                    gw.revealed = true;
                    renderGamesHome();
                } else {
                    // Generate hint
                    await generateContactDescription();
                }
            }
        }

        function guessWordAction() {
            const gw = gamesState.guessWord;
            if (gw.isDescriber) {
                // Change word
                gw.currentWord = guessWordBank[Math.floor(Math.random() * guessWordBank.length)];
                gw.messages = [];
                gw.revealed = false;
                toast('换了一个新词！');
            } else {
                // Reveal answer
                gw.revealed = true;
                gw.messages.push({ role: 'contact', text: `答案是「${gw.currentWord}」哦～ 😊` });
            }
            renderGamesHome();
        }

        function nextGuessRound() {
            const gw = gamesState.guessWord;
            // Swap roles
            gw.isDescriber = !gw.isDescriber;
            gw.currentWord = guessWordBank[Math.floor(Math.random() * guessWordBank.length)];
            gw.messages = [];
            gw.revealed = false;
            gw.generating = false;

            if (!gw.isDescriber) {
                generateContactDescription();
            }
            renderGamesHome();
            toast('角色互换！新一轮开始～');
        }

        function showGuessWordRules() {
            const modal = document.createElement('div');
            modal.className = 'modal-mask';
            modal.style.display = 'flex';
            modal.id = 'modal-guess-rules';
            modal.innerHTML = `
                <div class="modal-box" style="max-width:320px; border-radius:20px; padding:25px;">
                    <div style="text-align:center; font-size:40px; margin-bottom:10px;">📖</div>
                    <h3 style="text-align:center; margin-bottom:15px; color:#333;">游戏规则</h3>
                    <div style="font-size:14px; color:#555; line-height:1.8;">
                        <p>🎯 <b>目标</b>：一方描述词语，另一方猜出来</p>
                        <p>🚫 <b>限制</b>：描述时不能说出词语中的任何一个字</p>
                        <p>🔄 <b>轮换</b>：每轮结束后可以互换角色</p>
                        <p>🏆 <b>计分</b>：猜对得1分，没有回合限制</p>
                        <p>💡 <b>提示</b>：可以多次描述，直到对方猜对</p>
                    </div>
                    <div style="text-align:center; margin-top:20px;">
                        <button onclick="document.getElementById('modal-guess-rules').remove()" style="padding:10px 30px; border:none; background:#000; color:#fff; border-radius:20px; font-size:14px; cursor:pointer;">知道啦！</button>
                    </div>
                </div>
            `;
            document.getElementById('device').appendChild(modal);
        }

        // ==================== UNO GAME (一起优诺 完整规则版) ====================
        const UNO_COLORS = ['red', 'yellow', 'green', 'blue'];
        const UNO_COLOR_MAP = { red: '🔴', yellow: '🟡', green: '🟢', blue: '🔵' };
        const UNO_COLOR_LABEL = { red: '红', yellow: '黄', green: '绿', blue: '蓝' };
        const UNO_COLOR_HEX = { red: '#d32f2f', yellow: '#f9a825', green: '#2e7d32', blue: '#1565c0' };
        const UNO_BOT_NAMES = ['小机', '阿诺', '乌诺', '卡牌君', '牌神', '幸运星', '出牌侠', '翻转王'];
        const UNO_GAME_TIME = 210; // 3.5分钟倒计时(秒)

        // 卡牌分值表
        function unoCardScore(card) {
            if (!card) return 0;
            if (card.type === 'number') return parseInt(card.value) || 0;
            if (card.type === 'action') return 20; // 功能牌20分
            if (card.type === 'wild') return 50; // 万能牌50分
            return 0;
        }

        // 计算玩家手牌总分
        function unoHandScore(hand) {
            return hand.reduce((sum, c) => sum + unoCardScore(c), 0);
        }

        // 创建108张标准UNO牌组
        function createUnoDeck() {
            const deck = [];
            UNO_COLORS.forEach(color => {
                // 数字0：每色1张 = 4张
                deck.push({ color, value: '0', type: 'number' });
                // 数字1-9：每色各2张 = 72张
                for (let i = 1; i <= 9; i++) {
                    deck.push({ color, value: String(i), type: 'number' });
                    deck.push({ color, value: String(i), type: 'number' });
                }
                // 功能牌：跳过、反转、+2，每色各2张 = 24张
                ['skip', 'reverse', 'draw2'].forEach(action => {
                    deck.push({ color, value: action, type: 'action' });
                    deck.push({ color, value: action, type: 'action' });
                });
            });
            // 万能牌：变色4张 + +4共4张 = 8张
            for (let i = 0; i < 4; i++) {
                deck.push({ color: 'wild', value: 'wild', type: 'wild' });
                deck.push({ color: 'wild', value: 'wild_draw4', type: 'wild' });
            }
            // 总计: 4 + 72 + 24 + 8 = 108张
            return deck;
        }

        function shuffleDeck(deck) {
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            return deck;
        }

        function unoCardLabel(card) {
            if (!card) return '?';
            const colorIcon = card.color === 'wild' ? '🌈' : (UNO_COLOR_MAP[card.color] || '');
            if (card.type === 'number') return colorIcon + card.value;
            if (card.value === 'skip') return colorIcon + '⊘';
            if (card.value === 'reverse') return colorIcon + '↺';
            if (card.value === 'draw2') return colorIcon + '+2';
            if (card.value === 'wild') return '🌈选色';
            if (card.value === 'wild_draw4') return '🌈+4';
            return colorIcon + card.value;
        }

        // Card display label for the visual card face
        function unoCardDisplay(card) {
            if (!card) return '?';
            if (card.type === 'number') return card.value;
            if (card.value === 'skip') return '⊘';
            if (card.value === 'reverse') return '⟲';
            if (card.value === 'draw2') return '+2';
            if (card.value === 'wild') return 'W';
            if (card.value === 'wild_draw4') return '+4';
            return card.value;
        }

        // 判断是否可以出牌（考虑叠加规则）
        function canPlayUnoCard(card, topCard, currentColor, drawStack) {
            // 如果有待处理的摸牌叠加
            if (drawStack && drawStack > 0) {
                // +2叠加中，只能出+2或+4
                if (topCard.value === 'draw2') {
                    return card.value === 'draw2' || card.value === 'wild_draw4';
                }
                // +4叠加中，只能出+4
                if (topCard.value === 'wild_draw4') {
                    return card.value === 'wild_draw4';
                }
            }
            if (card.type === 'wild') return true;
            if (card.color === currentColor) return true;
            if (card.value === topCard.value && card.type !== 'wild') return true;
            return false;
        }

        // 检查玩家是否有当前颜色的牌（用于+4质疑判定）
        function hasColorInHand(player, color) {
            return player.hand.some(c => c.color === color && c.type !== 'wild');
        }

        function initUnoGame(selectedContacts) {
            const deck = shuffleDeck(createUnoDeck());
            const players = [];
            // Player 0 = user
            players.push({
                id: '__user__',
                name: store.user.name || '我',
                avatar: store.user.avatar || 'https://ui-avatars.com/api/?name=我&background=95ec69&color=fff',
                isUser: true,
                isBot: false,
                contact: null,
                hand: [],
                saidUno: false,
                score: 0
            });
            // Selected contacts
            selectedContacts.forEach(c => {
                players.push({
                    id: c.id,
                    name: c.name,
                    avatar: c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name[0])}&background=ffb6c1&color=fff`,
                    isUser: false,
                    isBot: false,
                    contact: c,
                    hand: [],
                    saidUno: false,
                    score: 0
                });
            });
            // Fill with bots to reach 4 players
            const usedBotNames = [...UNO_BOT_NAMES];
            while (players.length < 4) {
                const botNameIdx = Math.floor(Math.random() * usedBotNames.length);
                const botName = usedBotNames.splice(botNameIdx, 1)[0] || ('Bot' + players.length);
                players.push({
                    id: 'bot_' + Date.now() + '_' + players.length,
                    name: botName,
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(botName[0])}&background=a29bfe&color=fff`,
                    isUser: false,
                    isBot: true,
                    contact: null,
                    hand: [],
                    saidUno: false,
                    score: 0
                });
            }
            // 发牌：每人7张
            players.forEach(p => {
                for (let i = 0; i < 7; i++) {
                    p.hand.push(deck.pop());
                }
            });
            // 翻开底牌：如果翻到功能牌/万能牌，执行效果后继续翻，直到翻出数字牌
            let firstCard = deck.pop();
            let startLog = [];
            let direction = 1;
            let startPlayerIdx = 0;
            // 处理翻开的功能牌效果
            while (firstCard.type !== 'number') {
                if (firstCard.type === 'wild') {
                    // 万能牌放回洗牌
                    deck.unshift(firstCard);
                    shuffleDeck(deck);
                    firstCard = deck.pop();
                    continue;
                }
                // 功能牌：执行效果
                if (firstCard.value === 'skip') {
                    startLog.push(`翻开 ${unoCardLabel(firstCard)}，跳过第一位玩家！`);
                    startPlayerIdx = 1; // 跳过第一个玩家
                } else if (firstCard.value === 'reverse') {
                    direction = -1;
                    startLog.push(`翻开 ${unoCardLabel(firstCard)}，方向反转！`);
                } else if (firstCard.value === 'draw2') {
                    startLog.push(`翻开 ${unoCardLabel(firstCard)}，第一位玩家摸2张！`);
                    // 第一位玩家摸2张
                    for (let i = 0; i < 2; i++) {
                        if (deck.length > 0) players[0].hand.push(deck.pop());
                    }
                    startPlayerIdx = 1;
                }
                // 继续翻下一张
                deck.unshift(firstCard); // 把功能牌放到弃牌堆底部（保留在弃牌堆）
                firstCard = deck.pop();
            }

            const gameState = {
                players,
                deck,
                discardPile: [firstCard],
                currentPlayerIdx: startPlayerIdx,
                direction: direction,
                currentColor: firstCard.color,
                drawStack: 0, // 叠加摸牌数
                winner: null,
                log: [`🎮 游戏开始！108张牌已就绪`, ...startLog, `首张牌是 ${unoCardLabel(firstCard)}`],
                pendingColorChoice: false,
                pendingCard: null,
                pendingChallenge: null, // { challengerId, challengedId, cardPlayed, previousColor }
                aiThinking: false,
                gameOver: false,
                playerSpeech: {},
                gameTimer: UNO_GAME_TIME,
                timerInterval: null,
                startTime: Date.now(),
                // 进阶规则开关
                stackingEnabled: true,    // 加牌叠加
                challengeEnabled: true,   // +4质疑
                unoCallEnabled: true,     // UNO喊牌
                lastPlayedCard: null,     // 上一张打出的牌（用于质疑判定）
                lastPlayedBy: null,       // 上一张牌是谁打的
                previousColor: null,      // +4前的颜色（用于质疑判定）
                // [FIX-记忆混乱] 记录游戏发起人
                initiator: { id: '__user__', name: store.user.name || '用户', isUser: true }
            };

            // 启动游戏计时器
            gameState.timerInterval = setInterval(() => {
                if (gameState.gameOver) {
                    clearInterval(gameState.timerInterval);
                    return;
                }
                gameState.gameTimer--;
                if (gameState.gameTimer <= 0) {
                    // 时间到！按分数判定胜负
                    clearInterval(gameState.timerInterval);
                    unoTimeUp(gameState);
                }
                // 每10秒更新一次显示
                if (gameState.gameTimer % 10 === 0 || gameState.gameTimer <= 30) {
                    renderGamesHome();
                }
            }, 1000);

            return gameState;
        }

        // 时间到 - 计分判定
        function unoTimeUp(uno) {
            if (uno.gameOver) return;
            uno.gameOver = true;
            clearSavedGamesState(); // 游戏结束，清除存档
            // 计算每位玩家的手牌分数
            let minScore = Infinity;
            let winner = null;
            const scoreBoard = [];
            uno.players.forEach(p => {
                const score = unoHandScore(p.hand);
                p.score = score;
                scoreBoard.push(`${p.isUser ? '你' : p.name}: ${score}分(${p.hand.length}张)`);
                if (score < minScore) {
                    minScore = score;
                    winner = p;
                }
            });
            uno.winner = winner;
            uno.log.push(`⏰ 时间到！按剩余手牌分数判定`);
            uno.log.push(`📊 ${scoreBoard.join(' | ')}`);
            uno.log.push(`🏆 ${winner.isUser ? '你' : winner.name} 以${minScore}分获胜！`);
            // [FIX-记忆混乱] 保存UNO游戏历史
            saveUnoToHistory(uno, 'timeout');
            renderGamesHome();
            // 生成AI反应
            if (winner && !winner.isUser && !winner.isBot && winner.contact) {
                generateUnoReaction(winner, 'win');
            }
            uno.players.forEach(p => {
                if (!p.isUser && !p.isBot && p.contact && p !== winner) {
                    generateUnoReaction(p, 'lose');
                }
            });
        }

        function unoTopCard(uno) {
            return uno.discardPile[uno.discardPile.length - 1];
        }

        function unoCurrentPlayer(uno) {
            return uno.players[uno.currentPlayerIdx];
        }

        function unoNextPlayer(uno) {
            uno.currentPlayerIdx = (uno.currentPlayerIdx + uno.direction + uno.players.length) % uno.players.length;
        }

        function unoDrawCard(uno, player, count = 1) {
            for (let i = 0; i < count; i++) {
                if (uno.deck.length === 0) {
                    // 弃牌堆洗牌成为摸牌堆
                    const top = uno.discardPile.pop();
                    uno.deck = shuffleDeck(uno.discardPile);
                    uno.discardPile = [top];
                }
                if (uno.deck.length > 0) {
                    player.hand.push(uno.deck.pop());
                }
            }
            player.saidUno = false;
        }

        function unoPlayCard(uno, player, cardIdx, chosenColor) {
            if (cardIdx < 0 || cardIdx >= player.hand.length) return; // 防止无效索引闪退
            const card = player.hand.splice(cardIdx, 1)[0];
            if (!card) return; // 防止card为undefined闪退
            uno.discardPile.push(card);
            
            // 记录上一张牌和上一个出牌者（用于+4质疑判定）
            uno.previousColor = uno.currentColor;
            uno.lastPlayedCard = card;
            uno.lastPlayedBy = player;

            // Handle wild color
            if (card.type === 'wild') {
                uno.currentColor = chosenColor || 'red';
            } else {
                uno.currentColor = card.color;
            }

            const playerName = player.isUser ? '你' : player.name;
            const colorLabel = UNO_COLOR_LABEL[uno.currentColor] || '';

            // Handle special cards
            if (card.value === 'skip') {
                uno.log.push(`${playerName} 打出了 ${unoCardLabel(card)}，跳过下一位！`);
                unoNextPlayer(uno); // 额外跳一步
            } else if (card.value === 'reverse') {
                uno.direction *= -1;
                uno.log.push(`${playerName} 打出了 ${unoCardLabel(card)}，方向反转！`);
                // 两人对局中反转等同于跳过
                if (uno.players.length === 2) unoNextPlayer(uno);
            } else if (card.value === 'draw2') {
                if (uno.stackingEnabled) {
                    // 叠加模式：累加到drawStack
                    uno.drawStack += 2;
                    uno.log.push(`${playerName} 打出了 ${unoCardLabel(card)}，当前叠加 +${uno.drawStack}！`);
                } else {
                    // 非叠加模式：直接让下家摸牌
                    uno.log.push(`${playerName} 打出了 ${unoCardLabel(card)}，下家摸2张！`);
                    unoNextPlayer(uno);
                    const victim = unoCurrentPlayer(uno);
                    unoDrawCard(uno, victim, 2);
                    uno.log.push(`${victim.isUser ? '你' : victim.name} 摸了2张牌`);
                }
            } else if (card.value === 'wild') {
                uno.log.push(`${playerName} 打出万能牌，选择了${colorLabel}色！`);
            } else if (card.value === 'wild_draw4') {
                if (uno.stackingEnabled) {
                    // 叠加模式
                    uno.drawStack += 4;
                    uno.log.push(`${playerName} 打出+4，选择了${colorLabel}色！当前叠加 +${uno.drawStack}！`);
                    // 标记待质疑（如果质疑功能开启）
                    if (uno.challengeEnabled) {
                        unoNextPlayer(uno);
                        const nextP = unoCurrentPlayer(uno);
                        // AI自动决定是否质疑
                        if (!nextP.isUser) {
                            unoBotChallenge(uno, nextP, player, card);
                        } else {
                            // 用户可以选择质疑
                            uno.pendingChallenge = {
                                challengerId: nextP.id,
                                challengedId: player.id,
                                cardPlayed: card,
                                previousColor: uno.previousColor,
                                drawAmount: uno.drawStack
                            };
                        }
                        // 质疑流程已处理了unoNextPlayer，直接return
                        return;
                    }
                } else {
                    uno.log.push(`${playerName} 打出+4，选择了${colorLabel}色！下家摸4张！`);
                    unoNextPlayer(uno);
                    const victim = unoCurrentPlayer(uno);
                    unoDrawCard(uno, victim, 4);
                    uno.log.push(`${victim.isUser ? '你' : victim.name} 摸了4张牌`);
                }
            } else {
                uno.log.push(`${playerName} 打出了 ${unoCardLabel(card)}`);
            }

            // Check win
            if (player.hand.length === 0) {
                uno.winner = player;
                uno.gameOver = true;
                clearSavedGamesState(); // 游戏结束，清除存档
                if (uno.timerInterval) clearInterval(uno.timerInterval);
                // 计算分数
                const scoreBoard = [];
                uno.players.forEach(p => {
                    p.score = unoHandScore(p.hand);
                    if (p !== player) scoreBoard.push(`${p.isUser ? '你' : p.name}: ${p.score}分`);
                });
                uno.log.push(`🎉 ${playerName} 赢了！`);
                if (scoreBoard.length > 0) uno.log.push(`📊 其他玩家分数: ${scoreBoard.join(' | ')}`);
                // [FIX-记忆混乱] 保存UNO游戏历史
                saveUnoToHistory(uno, 'normal');
                return;
            }

            // UNO check - 剩1张牌时
            if (player.hand.length === 1 && !player.saidUno) {
                if (!player.isUser) {
                    // AI有90%概率记得喊UNO
                    if (Math.random() < 0.9) {
                        player.saidUno = true;
                        uno.log.push(`${player.name} 喊了 UNO！`);
                    } else {
                        // AI忘记喊UNO，可以被抓
                        uno.log.push(`⚠️ ${player.name} 忘记喊UNO了！`);
                        // 延迟检查是否被抓（给用户机会点击抓）
                        uno._catchablePlayer = player;
                        setTimeout(() => {
                            if (uno._catchablePlayer === player && !player.saidUno && player.hand.length === 1) {
                                // 其他AI随机决定是否抓
                                const otherAI = uno.players.filter(p => !p.isUser && p !== player);
                                const catcher = otherAI.find(() => Math.random() < 0.3);
                                if (catcher) {
                                    unoDrawCard(uno, player, 2);
                                    uno.log.push(`🚨 ${catcher.name} 抓到 ${player.name} 没喊UNO！罚摸2张！`);
                                    renderGamesHome();
                                }
                            }
                            uno._catchablePlayer = null;
                        }, 3000);
                    }
                }
            }

            // 处理叠加后的摸牌（如果下家不能继续叠加）
            if ((card.value === 'draw2' || card.value === 'wild_draw4') && uno.stackingEnabled) {
                unoNextPlayer(uno);
                // 检查下家是否能叠加
                const nextP = unoCurrentPlayer(uno);
                const canStack = nextP.hand.some(c => {
                    if (card.value === 'draw2') return c.value === 'draw2' || c.value === 'wild_draw4';
                    if (card.value === 'wild_draw4') return c.value === 'wild_draw4';
                    return false;
                });
                if (!canStack && !nextP.isUser) {
                    // AI无法叠加，结算摸牌
                    unoDrawCard(uno, nextP, uno.drawStack);
                    uno.log.push(`${nextP.isUser ? '你' : nextP.name} 摸了${uno.drawStack}张牌，跳过回合`);
                    uno.drawStack = 0;
                    unoNextPlayer(uno); // 跳过该玩家的回合
                }
                // 如果能叠加或是用户，正常轮到下家出牌（用户需要自己决定是否叠加或摸牌）
                return; // 已经处理过unoNextPlayer了
            }

            unoNextPlayer(uno);
        }

        // AI决定是否质疑+4
        function unoBotChallenge(uno, challenger, challenged, card) {
            // AI根据一些策略决定是否质疑
            // 如果手中牌少（快赢了），更倾向于质疑
            const challengeProb = challenger.hand.length <= 3 ? 0.5 : 0.2;
            
            if (Math.random() < challengeProb) {
                // 决定质疑
                const hadColor = hasColorInHand(challenged, uno.previousColor);
                const challengerName = challenger.isUser ? '你' : challenger.name;
                const challengedName = challenged.isUser ? '你' : challenged.name;
                
                if (hadColor) {
                    // 质疑成功！出+4的人违规
                    uno.log.push(`🔍 ${challengerName} 质疑了 ${challengedName} 的+4！`);
                    uno.log.push(`✅ 质疑成功！${challengedName} 手中有${UNO_COLOR_LABEL[uno.previousColor]}色牌，违规出+4！`);
                    unoDrawCard(uno, challenged, 4);
                    uno.log.push(`${challengedName} 罚摸4张牌！`);
                    uno.drawStack = Math.max(0, uno.drawStack - 4);
                } else {
                    // 质疑失败！质疑者加罚
                    uno.log.push(`🔍 ${challengerName} 质疑了 ${challengedName} 的+4！`);
                    uno.log.push(`❌ 质疑失败！${challengedName} 手中确实没有${UNO_COLOR_LABEL[uno.previousColor]}色牌`);
                    const penalty = uno.drawStack + 2; // 原来的+额外2张
                    unoDrawCard(uno, challenger, penalty);
                    uno.log.push(`${challengerName} 罚摸${penalty}张牌！`);
                    uno.drawStack = 0;
                    unoNextPlayer(uno); // 跳过质疑者回合
                }
            } else {
                // 不质疑，接受摸牌
                unoDrawCard(uno, challenger, uno.drawStack);
                uno.log.push(`${challenger.isUser ? '你' : challenger.name} 选择不质疑，摸了${uno.drawStack}张牌`);
                uno.drawStack = 0;
                unoNextPlayer(uno); // 跳过
            }
        }

        // 用户质疑+4
        function unoUserChallenge(doChallenge) {
            const uno = gamesState.uno;
            if (!uno || !uno.pendingChallenge) return;
            const challenge = uno.pendingChallenge;
            const challenger = uno.players.find(p => p.id === challenge.challengerId);
            const challenged = uno.players.find(p => p.id === challenge.challengedId);
            uno.pendingChallenge = null;

            if (doChallenge) {
                const hadColor = hasColorInHand(challenged, challenge.previousColor);
                const challengedName = challenged.isUser ? '你' : challenged.name;
                
                if (hadColor) {
                    // 质疑成功
                    uno.log.push(`🔍 你质疑了 ${challengedName} 的+4！`);
                    uno.log.push(`✅ 质疑成功！${challengedName} 手中有${UNO_COLOR_LABEL[challenge.previousColor]}色牌！`);
                    unoDrawCard(uno, challenged, 4);
                    uno.log.push(`${challengedName} 罚摸4张牌！`);
                    uno.drawStack = Math.max(0, uno.drawStack - 4);
                    // 你不用摸牌，轮到你出牌
                } else {
                    // 质疑失败
                    uno.log.push(`🔍 你质疑了 ${challengedName} 的+4！`);
                    uno.log.push(`❌ 质疑失败！${challengedName} 确实没有${UNO_COLOR_LABEL[challenge.previousColor]}色牌`);
                    const penalty = uno.drawStack + 2;
                    unoDrawCard(uno, challenger, penalty);
                    uno.log.push(`你罚摸${penalty}张牌！`);
                    uno.drawStack = 0;
                    unoNextPlayer(uno);
                }
                // 生成被质疑者的反应
                if (!challenged.isUser && !challenged.isBot && challenged.contact) {
                    generateUnoReaction(challenged, hadColor ? 'challenged_caught' : 'challenged_innocent');
                }
            } else {
                // 不质疑
                unoDrawCard(uno, challenger, uno.drawStack);
                uno.log.push(`你选择不质疑，摸了${uno.drawStack}张牌`);
                uno.drawStack = 0;
                unoNextPlayer(uno);
            }
            
            renderGamesHome();
            if (!uno.gameOver) {
                scheduleUnoAI();
            }
        }

        // 用户抓别人没喊UNO
        function unoCatchPlayer(playerId) {
            const uno = gamesState.uno;
            if (!uno || uno.gameOver) return;
            const target = uno.players.find(p => p.id === playerId);
            if (!target || target.hand.length !== 1 || target.saidUno) {
                toast('无法抓取，该玩家已喊UNO或牌数不为1');
                return;
            }
            unoDrawCard(uno, target, 2);
            uno.log.push(`🚨 你抓到 ${target.name} 没喊UNO！罚摸2张！`);
            uno._catchablePlayer = null;
            toast(`抓到了！${target.name}罚摸2张 🎯`);
            renderGamesHome();
            // 生成AI反应
            if (!target.isBot && target.contact) {
                generateUnoReaction(target, 'caught_uno');
            }
        }

        // AI/Bot plays a card - 增强策略
        function unoBotDecide(uno, player) {
            const top = unoTopCard(uno);
            const playable = [];
            player.hand.forEach((card, idx) => {
                if (canPlayUnoCard(card, top, uno.currentColor, uno.drawStack)) {
                    playable.push({ card, idx });
                }
            });
            if (playable.length === 0) return null;

            // 增强AI策略
            const handSize = player.hand.length;
            const nextPlayerIdx = (uno.players.indexOf(player) + uno.direction + uno.players.length) % uno.players.length;
            const nextPlayer = uno.players[nextPlayerIdx];
            const nextHandSize = nextPlayer ? nextPlayer.hand.length : 99;

            playable.sort((a, b) => {
                // 如果在叠加中，优先出+牌
                if (uno.drawStack > 0) {
                    if (a.card.value === 'wild_draw4' && b.card.value !== 'wild_draw4') return -1;
                    if (a.card.value !== 'wild_draw4' && b.card.value === 'wild_draw4') return 1;
                    if (a.card.value === 'draw2' && b.card.value !== 'draw2') return -1;
                    return 0;
                }

                // 下家只剩1-2张牌时，优先打功能牌限制
                if (nextHandSize <= 2) {
                    if (a.card.value === 'skip' || a.card.value === 'reverse' || a.card.value === 'draw2') return -1;
                    if (b.card.value === 'skip' || b.card.value === 'reverse' || b.card.value === 'draw2') return 1;
                }

                // 保留万能牌到关键时刻（手牌多时不急着用）
                if (handSize > 4) {
                    if (a.card.type === 'wild' && b.card.type !== 'wild') return 1;
                    if (a.card.type !== 'wild' && b.card.type === 'wild') return -1;
                }

                // 优先出高分牌（减少手牌分数）
                const scoreA = unoCardScore(a.card);
                const scoreB = unoCardScore(b.card);
                if (scoreA !== scoreB) return scoreB - scoreA;

                // 优先出与手中最多颜色相同的牌
                if (a.card.color === b.card.color) return 0;
                const colorCountA = player.hand.filter(c => c.color === a.card.color).length;
                const colorCountB = player.hand.filter(c => c.color === b.card.color).length;
                return colorCountB - colorCountA;
            });

            const chosen = playable[0];
            let chosenColor = null;

            // +4的合法性检查（AI通常遵守规则，但偶尔会违规）
            if (chosen.card.value === 'wild_draw4') {
                const hasCurrentColor = hasColorInHand(player, uno.currentColor);
                if (hasCurrentColor && Math.random() < 0.7) {
                    // 有当前颜色的牌，70%概率不出+4（遵守规则）
                    // 找其他可出的牌
                    const altPlay = playable.find(p => p.card.value !== 'wild_draw4');
                    if (altPlay) {
                        const altChosen = altPlay;
                        if (altChosen.card.type === 'wild') {
                            const colorCount = {};
                            player.hand.forEach(c => {
                                if (c.color !== 'wild') colorCount[c.color] = (colorCount[c.color] || 0) + 1;
                            });
                            chosenColor = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0]?.[0] || UNO_COLORS[Math.floor(Math.random() * 4)];
                        }
                        return { cardIdx: altChosen.idx, chosenColor };
                    }
                }
            }

            if (chosen.card.type === 'wild') {
                const colorCount = {};
                player.hand.forEach(c => {
                    if (c.color !== 'wild') colorCount[c.color] = (colorCount[c.color] || 0) + 1;
                });
                chosenColor = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0]?.[0] || UNO_COLORS[Math.floor(Math.random() * 4)];
            }
            return { cardIdx: chosen.idx, chosenColor };
        }

        // UNO Setup: select contacts to invite (up to 3)
        function renderUnoSetup(area, contacts) {
            if (!gamesState._unoSelected) gamesState._unoSelected = new Set();
            const selected = gamesState._unoSelected;
            const maxInvite = 3;

            area.innerHTML = `
                <div class="games-page" style="background:linear-gradient(180deg,#fff5f5,#ffe8e8);">
                    <div class="nav-bar" style="background:linear-gradient(135deg,#ff9a9e,#fad0c4); border:none;">
                        <div class="nav-icon" onclick="gamesState.view='home'; gamesState._unoSelected=null; renderGamesHome();"><i class="fas fa-chevron-left" style="color:#c0392b;font-size:18px;"></i></div>
                        <div class="nav-title" style="color:#c0392b; font-weight:700;">🃏 UNO - 邀请好友</div>
                        <div style="width:40px;"></div>
                    </div>
                    <div class="scroll-y" style="background:linear-gradient(180deg,#fff5f5,#ffe8e8); padding:15px;">
                        <div class="uno-setup-header">
                            <div class="uno-setup-emoji">🃏</div>
                            <div class="uno-setup-title">一起优诺！</div>
                            <div class="uno-setup-sub">最多邀请3位好友，不足4人将自动匹配AI玩家<br>📋 108张牌 | ⏱️ ${Math.floor(UNO_GAME_TIME/60)}分${UNO_GAME_TIME%60}秒限时</div>
                            <div class="uno-setup-count">已选择 ${selected.size} / ${maxInvite} 位好友</div>
                        </div>
                        <div class="uno-setup-rules">
                            <div class="uno-rule-tag">✅ 加牌叠加</div>
                            <div class="uno-rule-tag">✅ +4质疑</div>
                            <div class="uno-rule-tag">✅ UNO喊牌</div>
                            <div class="uno-rule-tag">✅ 限时计分</div>
                        </div>
                        <div class="games-contact-list">
                            ${contacts.length === 0 ? '<div style="text-align:center; color:#ccc; padding:40px; font-size:14px;">还没有联系人哦，将自动匹配AI玩家～</div>' :
                            contacts.map(c => `
                                <div class="games-contact-item uno-contact-item ${selected.has(c.id) ? 'uno-selected' : ''}" onclick="toggleUnoContact('${c.id}')">
                                    <img src="${c.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.name[0]) + '&background=ffb6c1&color=fff'}" class="games-contact-avatar">
                                    <div class="games-contact-name">${c.name}</div>
                                    <div class="uno-check">${selected.has(c.id) ? '<i class="fas fa-check-circle" style="color:#333; font-size:22px;"></i>' : '<i class="far fa-circle" style="color:#ccc; font-size:22px;"></i>'}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="uno-setup-actions">
                            <button class="uno-start-btn" onclick="startUnoGame()">
                                <i class="fas fa-play"></i> 开始游戏 ${selected.size < 3 ? `(${3 - selected.size}位AI补位)` : ''}
                            </button>
                            <button class="uno-solo-btn" onclick="gamesState._unoSelected = new Set(); startUnoGame();">
                                <i class="fas fa-robot"></i> 独自挑战 (3位AI对手)
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        function toggleUnoContact(contactId) {
            if (!gamesState._unoSelected) gamesState._unoSelected = new Set();
            if (gamesState._unoSelected.has(contactId)) {
                gamesState._unoSelected.delete(contactId);
            } else {
                if (gamesState._unoSelected.size >= 3) return toast('最多邀请3位好友');
                gamesState._unoSelected.add(contactId);
            }
            renderGamesHome();
        }

        function startUnoGame() {
            const selectedIds = gamesState._unoSelected ? Array.from(gamesState._unoSelected) : [];
            const selectedContacts = selectedIds.map(id => store.contacts.find(c => c.id === id)).filter(Boolean);
            gamesState.uno = initUnoGame(selectedContacts);
            gamesState.view = 'uno';
            gamesState._unoSelected = null;
            renderGamesHome();
            // If first player is not user, start AI turn
            if (!gamesState.uno.players[gamesState.uno.currentPlayerIdx].isUser) {
                processUnoAITurn();
            }
        }

        function renderUnoGame(area) {
            const uno = gamesState.uno;
            if (!uno) { gamesState.view = 'home'; renderGamesHome(); return; }

            const currentP = unoCurrentPlayer(uno);
            const isMyTurn = currentP.isUser && !uno.gameOver && !uno.pendingColorChoice && !uno.pendingChallenge && !uno.aiThinking;
            const topCard = unoTopCard(uno);
            const userPlayer = uno.players.find(p => p.isUser);
            const userIdx = uno.players.indexOf(userPlayer);
            const myHand = userPlayer ? userPlayer.hand : [];
            const playerCount = uno.players.length;

            // 动态排列玩家位置
            const posMap = [
                { pos: 'bottom', player: uno.players[userIdx] },
                { pos: 'right', player: uno.players[(userIdx + 1) % playerCount] },
                { pos: 'top', player: uno.players[(userIdx + 2) % playerCount] },
                { pos: 'left', player: uno.players[(userIdx + 3) % playerCount] }
            ];

            const rightP = posMap[1].player;
            const topP = posMap[2].player;
            const leftP = posMap[3].player;

            // Recent log (last 2 messages)
            const recentLog = uno.log.slice(-2);

            // 格式化计时器
            const timerMin = Math.floor(Math.max(0, uno.gameTimer) / 60);
            const timerSec = Math.max(0, uno.gameTimer) % 60;
            const timerStr = `${timerMin}:${timerSec < 10 ? '0' : ''}${timerSec}`;
            const timerUrgent = uno.gameTimer <= 60;

            // 摸牌叠加提示
            const stackInfo = uno.drawStack > 0 ? `<div class="uno-stack-info">⚡ 叠加 +${uno.drawStack}</div>` : '';

            // Generate scattered discard pile cards
            const scatterCards = uno.discardPile.slice(-6);
            function seedRand(card, i) {
                const s = ((card.color || 'w').charCodeAt(0) * 31 + (card.value || '').toString().charCodeAt(0) * 17 + i * 53) % 1000;
                return s / 1000;
            }

            const scatteredHTML = scatterCards.map((card, i) => {
                const isTop = (i === scatterCards.length - 1);
                const rot = isTop ? 0 : (seedRand(card, i) * 40 - 20);
                const tx = isTop ? 0 : (seedRand(card, i + 10) * 24 - 12);
                const ty = isTop ? 0 : (seedRand(card, i + 20) * 24 - 12);
                const zIdx = i + 1;
                const opacity = isTop ? 1 : (0.6 + i * 0.06);
                const wildBorder = card.type === 'wild' && isTop ? 'border-color:' + UNO_COLOR_HEX[uno.currentColor] : '';
                return `<div class="uno-scattered-card uno-card-${card.color}"
                    style="transform:translate(${tx}px,${ty}px) rotate(${rot}deg); z-index:${zIdx}; opacity:${opacity}; ${wildBorder}"
                    ><div class="uno-card-value">${unoCardDisplay(card)}</div></div>`;
            }).join('');

            function getPlayerSpeech(player) {
                if (!uno.playerSpeech || !uno.playerSpeech[player.id]) return '';
                const speech = uno.playerSpeech[player.id];
                // 显示联系人说的话，带上名字标签
                return `<div class="uno-speech-bubble"><span class="uno-speech-name">${player.name}:</span> ${speech.text}</div>`;
            }

            // 可抓UNO的玩家
            function getCatchBtn(player) {
                if (!uno._catchablePlayer || uno._catchablePlayer !== player) return '';
                if (player.saidUno || player.hand.length !== 1) return '';
                return `<div class="uno-catch-btn" onclick="unoCatchPlayer('${player.id}')">🚨抓!</div>`;
            }

            function renderSidePlayer(player, position) {
                const isCurrent = uno.currentPlayerIdx === uno.players.indexOf(player);
                const cardBacks = Math.min(player.hand.length, 10);
                let cardsHTML = '';
                
                if (position === 'top') {
                    for (let i = 0; i < cardBacks; i++) {
                        const rot = (i - (cardBacks - 1) / 2) * 5;
                        const ty = Math.abs(i - (cardBacks - 1) / 2) * 2;
                        cardsHTML += `<div class="uno-opp-card-back uno-opp-card-h" style="transform:rotate(${rot}deg) translateY(${ty}px); margin-left:${i > 0 ? '-14px' : '0'};"></div>`;
                    }
                } else if (position === 'left') {
                    for (let i = 0; i < Math.min(cardBacks, 8); i++) {
                        const rot = (i - (Math.min(cardBacks, 8) - 1) / 2) * 5;
                        const tx = Math.abs(i - (Math.min(cardBacks, 8) - 1) / 2) * 2;
                        cardsHTML += `<div class="uno-opp-card-back uno-opp-card-v" style="transform:rotate(${90 + rot}deg) translateY(${tx}px); margin-top:${i > 0 ? '-18px' : '0'};"></div>`;
                    }
                } else if (position === 'right') {
                    for (let i = 0; i < Math.min(cardBacks, 8); i++) {
                        const rot = (i - (Math.min(cardBacks, 8) - 1) / 2) * 5;
                        const tx = Math.abs(i - (Math.min(cardBacks, 8) - 1) / 2) * 2;
                        cardsHTML += `<div class="uno-opp-card-back uno-opp-card-v" style="transform:rotate(${-90 + rot}deg) translateY(${tx}px); margin-top:${i > 0 ? '-18px' : '0'};"></div>`;
                    }
                }

                return `
                <div class="uno-seat uno-seat-${position} ${isCurrent ? 'uno-seat-active' : ''}">
                    ${getPlayerSpeech(player)}
                    ${getCatchBtn(player)}
                    <div class="uno-seat-info uno-seat-info-${position}">
                        <div class="uno-seat-avatar-wrap">
                            <img src="${player.avatar}" class="uno-seat-avatar">
                            ${isCurrent && !uno.gameOver ? '<div class="uno-seat-indicator"></div>' : ''}
                        </div>
                        <div class="uno-seat-meta">
                            <div class="uno-seat-name">${player.name}</div>
                            <div class="uno-seat-count">×${player.hand.length}</div>
                        </div>
                        ${player.hand.length === 1 && player.saidUno ? '<div class="uno-shout-badge">UNO!</div>' : ''}
                        ${player.hand.length === 1 && !player.saidUno ? '<div class="uno-shout-badge uno-shout-miss">未喊!</div>' : ''}
                    </div>
                    <div class="uno-seat-cards uno-seat-cards-${position}">${cardsHTML}</div>
                </div>`;
            }

            // 游戏结束时的详细计分
            let gameOverHTML = '';
            if (uno.gameOver) {
                const sortedPlayers = [...uno.players].sort((a, b) => (a.score || 0) - (b.score || 0));
                gameOverHTML = `
                    <div class="uno-table-gameover">
                        <div class="uno-gameover-inner">
                            <div class="uno-gameover-emoji">${uno.winner.isUser ? '🏆' : '😢'}</div>
                            <div class="uno-gameover-text">${uno.winner.isUser ? '你赢了！' : uno.winner.name + ' 赢了！'}</div>
                            <div class="uno-gameover-scores">
                                ${sortedPlayers.map((p, i) => `
                                    <div class="uno-score-row ${p === uno.winner ? 'uno-score-winner' : ''}">
                                        <span class="uno-score-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '4.'}</span>
                                        <span class="uno-score-name">${p.isUser ? '你' : p.name}</span>
                                        <span class="uno-score-val">${p.score || 0}分 (${p.hand.length}张)</span>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="uno-gameover-btns">
                                <button class="uno-restart-btn" onclick="if(gamesState.uno&&gamesState.uno.timerInterval)clearInterval(gamesState.uno.timerInterval); gamesState.view='unoSetup'; gamesState.uno=null; clearSavedGamesState(); _gamesRestoreAttempted=false; renderGamesHome();">🔄 再来</button>
                                <button class="uno-exit-btn" onclick="if(gamesState.uno&&gamesState.uno.timerInterval)clearInterval(gamesState.uno.timerInterval); gamesState.view='home'; gamesState.uno=null; clearSavedGamesState(); _gamesRestoreAttempted=false; renderGamesHome();">🏠 返回</button>
                            </div>
                        </div>
                    </div>
                `;
            }

            // 质疑弹窗
            let challengeHTML = '';
            if (uno.pendingChallenge) {
                const challenged = uno.players.find(p => p.id === uno.pendingChallenge.challengedId);
                challengeHTML = `
                    <div class="uno-color-modal">
                        <div class="uno-color-modal-content" style="max-width:300px;">
                            <div class="uno-color-modal-title">🔍 质疑 +4？</div>
                            <div style="text-align:center;padding:10px;font-size:13px;color:#666;">
                                ${challenged ? challenged.name : '对方'} 打出了+4<br>
                                你怀疑TA手中有${UNO_COLOR_LABEL[uno.pendingChallenge.previousColor]}色牌吗？<br>
                                <span style="color:#333;">质疑成功：对方罚摸4张</span><br>
                                <span style="color:#2196F3;">质疑失败：你多摸2张(共${uno.pendingChallenge.drawAmount + 2}张)</span>
                            </div>
                            <div class="uno-color-options" style="gap:12px;">
                                <div class="uno-color-option" style="background:#e74c3c;flex:1;" onclick="unoUserChallenge(true)">
                                    🔍 质疑！
                                </div>
                                <div class="uno-color-option" style="background:#95a5a6;flex:1;" onclick="unoUserChallenge(false)">
                                    😔 算了
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }

            area.innerHTML = `
                <div class="uno-table-wrap">
                    <div class="uno-table">
                        <!-- Top bar -->
                        <div class="uno-table-topbar">
                            <div class="uno-topbar-btn" onclick="confirmExitUno()"><i class="fas fa-sign-out-alt"></i></div>
                            <div class="uno-topbar-timer ${timerUrgent ? 'uno-timer-urgent' : ''}">⏱️ ${timerStr}</div>
                            <div class="uno-topbar-dir">${uno.direction === 1 ? '↻' : '↺'}</div>
                            <div class="uno-topbar-btn" onclick="showUnoLog()"><i class="fas fa-list"></i></div>
                        </div>

                        <!-- Top player -->
                        ${renderSidePlayer(topP, 'top')}

                        <!-- Left player -->
                        ${renderSidePlayer(leftP, 'left')}

                        <!-- Right player -->
                        ${renderSidePlayer(rightP, 'right')}

                        <!-- Center play area -->
                        <div class="uno-center">
                            <!-- Draw pile -->
                            <div class="uno-center-draw" onclick="${isMyTurn && !uno.pendingChallenge ? 'unoUserDraw()' : ''}" style="${isMyTurn && !uno.pendingChallenge ? 'cursor:pointer;' : 'cursor:default; opacity:0.6;'}">
                                <div class="uno-card-back-sm">UNO</div>
                                <div class="uno-center-draw-count">${uno.deck.length}</div>
                                ${isMyTurn ? '<div class="uno-center-draw-hint">摸牌</div>' : ''}
                            </div>

                            <!-- Discard pile - scattered -->
                            <div class="uno-center-discard">
                                ${scatteredHTML}
                                ${topCard.type === 'wild' ? `<div class="uno-center-color-dot" style="background:${UNO_COLOR_HEX[uno.currentColor]}"></div>` : ''}
                            </div>
                            ${stackInfo}
                        </div>

                        <!-- Center log overlay -->
                        <div class="uno-center-log">
                            ${recentLog.map(l => `<div class="uno-center-log-line">${l}</div>`).join('')}
                        </div>

                        ${uno.aiThinking ? '<div class="uno-table-thinking"><div class="uno-thinking-dots"><span></span><span></span><span></span></div></div>' : ''}

                        ${gameOverHTML}

                        <!-- Color choice modal -->
                        ${uno.pendingColorChoice ? `
                        <div class="uno-color-modal">
                            <div class="uno-color-modal-content">
                                <div class="uno-color-modal-title">🌈 选择颜色</div>
                                <div class="uno-color-options">
                                    ${UNO_COLORS.map(c => `
                                        <div class="uno-color-option" style="background:${UNO_COLOR_HEX[c]}" onclick="unoChooseColor('${c}')">
                                            ${UNO_COLOR_LABEL[c]}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- Challenge modal -->
                        ${challengeHTML}

                        <!-- UNO shout button - 剩2张牌时出现 -->
                        ${userPlayer && userPlayer.hand.length === 2 && isMyTurn ? `
                            <div class="uno-say-btn" onclick="unoSayUno()">UNO!</div>
                        ` : ''}
                        <!-- 剩1张但没喊的补救按钮 -->
                        ${userPlayer && userPlayer.hand.length === 1 && !userPlayer.saidUno ? `
                            <div class="uno-say-btn uno-say-late" onclick="unoSayUno()">快喊UNO!</div>
                        ` : ''}

                        <!-- Status -->
                        <div class="uno-table-status">
                            ${isMyTurn ? '<span class="uno-my-turn">你的回合</span>' :
                              (uno.pendingChallenge ? '<span class="uno-my-turn" style="background:#e74c3c;">是否质疑+4？</span>' :
                              (uno.gameOver ? '' : `<span>${currentP.name} 出牌中...</span>`))}
                            ${uno.drawStack > 0 && isMyTurn ? `<span class="uno-stack-warn">⚡叠加中+${uno.drawStack} 出+牌或摸牌</span>` : ''}
                        </div>

                        <!-- Bottom player (user) -->
                        <div class="uno-seat uno-seat-bottom ${uno.currentPlayerIdx === userIdx ? 'uno-seat-active' : ''}">
                            <div class="uno-user-section">
                                <div class="uno-user-avatar-area">
                                    <div class="uno-seat-avatar-wrap">
                                        <img src="${userPlayer.avatar}" class="uno-seat-avatar">
                                        ${uno.currentPlayerIdx === userIdx && !uno.gameOver ? '<div class="uno-seat-indicator"></div>' : ''}
                                    </div>
                                    <div class="uno-user-name">${userPlayer.name}</div>
                                    <div class="uno-user-count">${myHand.length}张 | ${unoHandScore(myHand)}分</div>
                                </div>
                                <div class="uno-my-hand" id="uno-my-hand">
                                    ${myHand.map((card, idx) => {
                                        const playable = isMyTurn && canPlayUnoCard(card, topCard, uno.currentColor, uno.drawStack);
                                        return `
                                        <div class="uno-hand-card ${playable ? 'uno-playable' : 'uno-unplayable'} uno-card-${card.color}"
                                             onclick="${playable ? 'unoUserPlay(' + idx + ')' : ''}"
                                             ${!playable ? 'style="opacity:0.5; filter:grayscale(30%);"' : ''}>
                                            <div class="uno-card-value">${unoCardDisplay(card)}</div>
                                            <div class="uno-card-score">${unoCardScore(card)}</div>
                                        </div>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Auto-scroll hand to center
            const handEl = document.getElementById('uno-my-hand');
            if (handEl) {
                handEl.scrollLeft = (handEl.scrollWidth - handEl.clientWidth) / 2;
            }
        }

        function unoUserPlay(cardIdx) {
            const uno = gamesState.uno;
            if (!uno || uno.gameOver || uno.pendingChallenge || uno.aiThinking) return;
            const userPlayer = uno.players.find(p => p.isUser);
            if (!userPlayer || uno.currentPlayerIdx !== uno.players.indexOf(userPlayer)) return;
            if (cardIdx < 0 || cardIdx >= userPlayer.hand.length) return; // 防止无效索引

            const card = userPlayer.hand[cardIdx];
            if (!card || !canPlayUnoCard(card, unoTopCard(uno), uno.currentColor, uno.drawStack)) return;

            if (card.type === 'wild') {
                // Show color picker
                uno.pendingColorChoice = true;
                uno.pendingCard = cardIdx;
                renderGamesHome();
                return;
            }

            unoPlayCard(uno, userPlayer, cardIdx, null);
            renderGamesHome();

            if (!uno.gameOver && !uno.pendingChallenge) {
                scheduleUnoAI();
            }
        }

        function unoChooseColor(color) {
            const uno = gamesState.uno;
            if (!uno || !uno.pendingColorChoice) return;
            const userPlayer = uno.players.find(p => p.isUser);
            if (!userPlayer) return;
            const cardIdx = uno.pendingCard;
            uno.pendingColorChoice = false;
            uno.pendingCard = null;
            if (cardIdx == null || cardIdx < 0 || cardIdx >= userPlayer.hand.length) return; // 防止无效索引
            unoPlayCard(uno, userPlayer, cardIdx, color);
            renderGamesHome();

            if (!uno.gameOver && !uno.pendingChallenge) {
                scheduleUnoAI();
            }
        }

        function unoUserDraw() {
            const uno = gamesState.uno;
            if (!uno || uno.gameOver || uno.pendingChallenge || uno.aiThinking) return;
            const userPlayer = uno.players.find(p => p.isUser);
            if (!userPlayer || uno.currentPlayerIdx !== uno.players.indexOf(userPlayer)) return;

            // 如果有叠加，摸叠加数量
            if (uno.drawStack > 0) {
                unoDrawCard(uno, userPlayer, uno.drawStack);
                uno.log.push(`你无法叠加，摸了${uno.drawStack}张牌，跳过回合`);
                uno.drawStack = 0;
                unoNextPlayer(uno);
                renderGamesHome();
                if (!uno.gameOver) {
                    scheduleUnoAI();
                }
                return;
            }

            unoDrawCard(uno, userPlayer, 1);
            const drawn = userPlayer.hand[userPlayer.hand.length - 1];
            uno.log.push(`你摸了一张牌`);

            // Check if drawn card can be played
            if (canPlayUnoCard(drawn, unoTopCard(uno), uno.currentColor, 0)) {
                renderGamesHome();
                toast('摸到 ' + unoCardLabel(drawn) + '，可以直接出！');
                return;
            }

            // Can't play, skip turn
            uno.log.push('你没有可出的牌，跳过回合');
            unoNextPlayer(uno);
            renderGamesHome();
            if (!uno.gameOver) {
                scheduleUnoAI();
            }
        }

        function unoSayUno() {
            const uno = gamesState.uno;
            if (!uno) return;
            const userPlayer = uno.players.find(p => p.isUser);
            if (userPlayer) {
                userPlayer.saidUno = true;
                uno.log.push('你喊了 UNO！');
                toast('UNO! 🎉');
                renderGamesHome();
            }
        }

        function scheduleUnoAI() {
            const uno = gamesState.uno;
            if (!uno || uno.gameOver) return;
            const current = unoCurrentPlayer(uno);
            if (current.isUser) return;

            uno.aiThinking = true;
            renderGamesHome();

            const delay = 800 + Math.random() * 1200;
            setTimeout(() => processUnoAITurn(), delay);
        }

        async function processUnoAITurn() {
            const uno = gamesState.uno;
            if (!uno || uno.gameOver) return;

            const player = unoCurrentPlayer(uno);
            if (player.isUser) {
                uno.aiThinking = false;
                renderGamesHome();
                return;
            }

            // 如果有叠加且无法继续叠加
            if (uno.drawStack > 0) {
                const canStack = player.hand.some(c => {
                    const top = unoTopCard(uno);
                    if (top.value === 'draw2') return c.value === 'draw2' || c.value === 'wild_draw4';
                    if (top.value === 'wild_draw4') return c.value === 'wild_draw4';
                    return false;
                });
                if (!canStack) {
                    unoDrawCard(uno, player, uno.drawStack);
                    uno.log.push(`${player.name} 无法叠加，摸了${uno.drawStack}张牌，跳过回合`);
                    uno.drawStack = 0;
                    unoNextPlayer(uno);
                    if (!player.isBot && player.contact && !uno.gameOver) {
                        generateUnoReaction(player, 'draw_stack');
                    }
                    uno.aiThinking = false;
                    renderGamesHome();
                    if (!uno.gameOver) {
                        const nextP = unoCurrentPlayer(uno);
                        if (!nextP.isUser) {
                            setTimeout(() => processUnoAITurn(), 800 + Math.random() * 1200);
                        }
                    }
                    return;
                }
            }

            const decision = unoBotDecide(uno, player);

            if (decision) {
                unoPlayCard(uno, player, decision.cardIdx, decision.chosenColor);
                
                // Generate AI chat reaction for contact players
                if (!player.isBot && player.contact && !uno.gameOver) {
                    generateUnoReaction(player, 'play');
                }
            } else {
                // Draw a card
                if (uno.drawStack > 0) {
                    unoDrawCard(uno, player, uno.drawStack);
                    uno.log.push(`${player.name} 摸了${uno.drawStack}张牌`);
                    uno.drawStack = 0;
                    unoNextPlayer(uno);
                } else {
                    unoDrawCard(uno, player, 1);
                    const drawn = player.hand[player.hand.length - 1];
                    uno.log.push(`${player.name} 摸了一张牌`);

                    // Try to play drawn card
                    if (canPlayUnoCard(drawn, unoTopCard(uno), uno.currentColor, 0)) {
                        const cardIdx = player.hand.length - 1;
                        let chosenColor = null;
                        if (drawn.type === 'wild') {
                            const colorCount = {};
                            player.hand.forEach(c => {
                                if (c.color !== 'wild') colorCount[c.color] = (colorCount[c.color] || 0) + 1;
                            });
                            chosenColor = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0]?.[0] || UNO_COLORS[Math.floor(Math.random() * 4)];
                        }
                        unoPlayCard(uno, player, cardIdx, chosenColor);
                    } else {
                        uno.log.push(`${player.name} 没有可出的牌，跳过`);
                        unoNextPlayer(uno);
                    }
                }

                if (!player.isBot && player.contact && !uno.gameOver) {
                    generateUnoReaction(player, 'draw');
                }
            }

            uno.aiThinking = false;
            renderGamesHome();

            if (!uno.gameOver) {
                const nextP = unoCurrentPlayer(uno);
                if (!nextP.isUser) {
                    setTimeout(() => processUnoAITurn(), 800 + Math.random() * 1200);
                }
            } else {
                if (uno.timerInterval) clearInterval(uno.timerInterval);
                // Game over reactions
                if (uno.winner && !uno.winner.isUser && !uno.winner.isBot && uno.winner.contact) {
                    generateUnoReaction(uno.winner, 'win');
                }
                uno.players.forEach(p => {
                    if (!p.isUser && !p.isBot && p.contact && p !== uno.winner) {
                        generateUnoReaction(p, 'lose');
                    }
                });
            }
        }

        // 清理AI回复：去除前缀、引号、省略号填充等，保证是纯对话内容
        function cleanUnoReply(reply) {
            if (!reply) return '';
            let cleaned = reply.trim();
            // 去除常见前缀格式如 "xxx说：" "xxx:" 等
            cleaned = cleaned.replace(/^["""「『]/, '').replace(/["""」』]$/, '');
            cleaned = cleaned.replace(/^(我|角色|人物|AI|assistant)[：:]\s*/i, '');
            // 去除多余引号
            cleaned = cleaned.replace(/^["'"'"「『]+|["'"'"」』]+$/g, '');
            // 如果全是省略号或标点，返回空
            if (/^[…\.。，,！!？?~～\s]+$/.test(cleaned)) return '';
            // 如果太短（仅1-2个非标点字符），返回空
            const contentChars = cleaned.replace(/[…\.。，,！!？?~～\s""''「」『』]/g, '');
            if (contentChars.length < 2) return '';
            // 截断过长内容（超过40字）
            if (cleaned.length > 40) cleaned = cleaned.substring(0, 40) + '…';
            return cleaned;
        }

        // [FIX-闪烁] 局部更新speech bubble，避免全量渲染导致闪烁
        function _updateUnoSpeechBubble(uno, playerId) {
            if (!uno || !uno.playerSpeech || !uno.playerSpeech[playerId]) return;
            const speech = uno.playerSpeech[playerId];
            const player = uno.players.find(p => p.id === playerId);
            if (!player) return;
            // 找到对应座位的DOM元素
            const seatEls = document.querySelectorAll('.uno-seat');
            seatEls.forEach(seatEl => {
                // 检查座位是否属于该玩家（通过名字匹配）
                const nameEl = seatEl.querySelector('.uno-seat-name');
                const userNameEl = seatEl.querySelector('.uno-user-name');
                const matchName = (nameEl && nameEl.textContent === player.name) || (userNameEl && userNameEl.textContent === player.name);
                if (!matchName) return;
                // 移除旧的speech bubble
                const oldBubble = seatEl.querySelector('.uno-speech-bubble');
                if (oldBubble) oldBubble.remove();
                // 添加新的speech bubble
                const bubble = document.createElement('div');
                bubble.className = 'uno-speech-bubble';
                bubble.setAttribute('data-player-id', playerId);
                bubble.innerHTML = `<span class="uno-speech-name">${player.name}:</span> ${speech.text}`;
                seatEl.insertBefore(bubble, seatEl.firstChild);
            });
        }

        function _removeUnoSpeechBubble(playerId) {
            document.querySelectorAll(`.uno-speech-bubble[data-player-id="${playerId}"]`).forEach(el => el.remove());
        }

        // [FIX-重复] 防止同一玩家同时生成多个reaction
        const _unoReactionPending = {};
        async function generateUnoReaction(player, situation) {
            if (!player.contact) return;
            // 如果该玩家已有pending的reaction请求，跳过
            if (_unoReactionPending[player.id]) return;
            _unoReactionPending[player.id] = true;
            try {
                const sysPrompt = buildGameSystemPrompt(player.contact, 'uno');
                let userPrompt = '';
                const uno = gamesState.uno;
                const handCount = player.hand.length;
                const handScore = unoHandScore(player.hand);
                const nameHint = `你是${player.contact.name}。`;

                if (situation === 'play') {
                    const lastLog = uno.log[uno.log.length - 1] || '';
                    userPrompt = `${nameHint}你正在玩UNO牌游戏。${lastLog}。你手里还有${handCount}张牌(${handScore}分)。\n\n【要求】请直接说一句游戏中的互动台词（8-25字），要有具体内容和情感，比如吐槽、挑衅、得意或紧张。\n禁止输出省略号、禁止描述动作、禁止写旁白。直接输出台词文字即可。\n\n好的台词示例：\n- "哈哈看我出这张！你们完蛋了！"\n- "这牌也太好了吧，不好意思啦～"\n- "等等让我想想该出哪张..."\n\n请输出你的台词：`;
                } else if (situation === 'draw') {
                    userPrompt = `${nameHint}你正在玩UNO牌游戏，没有可出的牌只能摸牌。你手里有${handCount}张牌。\n\n【要求】请直接说一句抱怨或自嘲的台词（8-20字），要有具体内容。\n禁止输出省略号、禁止描述动作。直接输出台词文字即可。\n\n示例：\n- "啊又要摸牌了，手里都快拿不下了"\n- "怎么一张能出的都没有啊！"\n\n请输出你的台词：`;
                } else if (situation === 'draw_stack') {
                    userPrompt = `${nameHint}你正在玩UNO牌游戏，被人叠加了好多罚牌，惨！你手里牌很多了。\n\n【要求】请直接说一句崩溃或搞笑的台词（8-25字），要有具体内容和真情实感。\n禁止输出省略号、禁止描述动作。\n\n示例：\n- "天哪这也太狠了吧你们！"\n- "我的牌都快比牌堆多了呜呜"\n\n请输出你的台词：`;
                } else if (situation === 'win') {
                    userPrompt = `${nameHint}你赢了UNO牌游戏！\n\n【要求】请直接说一句胜利宣言台词（8-25字），要得意开心有具体内容。\n禁止输出省略号、禁止描述动作。\n\n示例：\n- "耶！我就知道我能赢！太开心了！"\n- "本大人的实力，你们服了吧？"\n\n请输出你的台词：`;
                } else if (situation === 'lose') {
                    userPrompt = `${nameHint}你在UNO牌游戏中输了，你手里还剩${handCount}张牌值${handScore}分。\n\n【要求】请直接说一句认输或不服气的台词（8-20字），要有具体内容。\n禁止输出省略号、禁止描述动作。\n\n示例：\n- "下次再来！我才不会输第二次！"\n- "呜呜这次运气太差了嘛…"\n\n请输出你的台词：`;
                } else if (situation === 'challenged_caught') {
                    userPrompt = `${nameHint}你在UNO游戏中违规出了+4被质疑成功了！\n\n【要求】请直接说一句尴尬或狡辩的台词（8-20字），要有具体内容。\n禁止输出省略号。\n\n示例：\n- "被发现了...我以为没人会质疑的！"\n\n请输出你的台词：`;
                } else if (situation === 'challenged_innocent') {
                    userPrompt = `${nameHint}你在UNO游戏中被人质疑+4但你是清白的！对方质疑失败要多摸牌。\n\n【要求】请直接说一句得意或嘲讽的台词（8-20字），要有具体内容。\n禁止输出省略号。\n\n示例：\n- "哼，叫你乱质疑，活该多摸牌！"\n\n请输出你的台词：`;
                } else if (situation === 'caught_uno') {
                    userPrompt = `${nameHint}你在UNO游戏中忘记喊UNO被人抓到了！要罚摸2张牌。\n\n【要求】请直接说一句懊恼或无奈的台词（8-20字），要有具体内容。\n禁止输出省略号。\n\n示例：\n- "啊啊啊忘了喊了！太亏了！"\n\n请输出你的台词：`;
                }

                const messages = [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: userPrompt }
                ];
                let reply = await callGameAI(messages);
                // 清理回复内容，确保是有效的台词
                reply = cleanUnoReply(reply);
                if (reply && uno === gamesState.uno) {
                    // [FIX-重复] 检查是否已有相同内容的speech，避免重复
                    if (!uno.playerSpeech) uno.playerSpeech = {};
                    const existingSpeech = uno.playerSpeech[player.id];
                    if (existingSpeech && existingSpeech.text === reply) { delete _unoReactionPending[player.id]; return; } // 相同内容不重复显示
                    uno.log.push(`💬 ${player.name}: "${reply}"`);
                    const speechTimestamp = Date.now();
                    uno.playerSpeech[player.id] = { text: reply, timestamp: speechTimestamp };
                    // [FIX-闪烁] 只更新speech bubble DOM，不做全量renderGamesHome
                    _updateUnoSpeechBubble(uno, player.id);
                    setTimeout(() => {
                        if (uno === gamesState.uno && uno.playerSpeech && uno.playerSpeech[player.id] &&
                            uno.playerSpeech[player.id].timestamp === speechTimestamp) {
                            delete uno.playerSpeech[player.id];
                            // [FIX-闪烁] 只移除对应的speech bubble，不做全量渲染
                            _removeUnoSpeechBubble(player.id);
                        }
                    }, 6000);
                }
            } catch(e) {
                console.log('UNO reaction failed:', e);
            } finally {
                delete _unoReactionPending[player.id];
            }
        }

        function confirmExitUno() {
            const uno = gamesState.uno;
            if (uno && !uno.gameOver) {
                showConfirm('退出游戏', '确定要退出UNO吗？\n选择"确定"将彻底结束游戏。\n如果只是暂时离开，可以直接关闭app，下次会自动恢复。', () => {
                    if (uno.timerInterval) clearInterval(uno.timerInterval);
                    gamesState.view = 'home';
                    gamesState.uno = null;
                    clearSavedGamesState(); // 用户主动确认退出，清除存档
                    _gamesRestoreAttempted = false; // 重置恢复标记
                    renderGamesHome();
                });
            } else {
                if (uno && uno.timerInterval) clearInterval(uno.timerInterval);
                gamesState.view = 'home';
                gamesState.uno = null;
                clearSavedGamesState(); // 游戏已结束，清除存档
                _gamesRestoreAttempted = false;
                renderGamesHome();
            }
        }

        function showUnoLog() {
            const uno = gamesState.uno;
            if (!uno) return;
            const modal = document.createElement('div');
            modal.id = 'modal-uno-log';
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
            modal.innerHTML = `
                <div style="background:#fff;border-radius:20px;width:85%;max-height:70%;display:flex;flex-direction:column;overflow:hidden;">
                    <div style="padding:16px 20px;font-weight:700;font-size:16px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;">
                        <span>📋 游戏记录 (${uno.deck.length}张剩余)</span>
                        <div onclick="document.getElementById('modal-uno-log').remove()" style="cursor:pointer;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#f5f5f5;"><i class="fas fa-times" style="color:#999;"></i></div>
                    </div>
                    <div style="flex:1;overflow-y:auto;padding:16px;">
                        ${uno.log.map(l => `<div style="padding:6px 0;font-size:13px;color:#555;border-bottom:1px solid #f5f5f5;">${l}</div>`).join('')}
                    </div>
                </div>
            `;
            document.getElementById('device').appendChild(modal);
            const logDiv = modal.querySelector('div > div:last-child');
            if (logDiv) logDiv.scrollTop = logDiv.scrollHeight;
        }

        // ========== AI Helper ==========
        function buildGameSystemPrompt(contact, gameType) {
            let persona = '';
            if (contact.settings?.systemPrompt) {
                persona = contact.settings.systemPrompt;
            } else if (contact.persona) {
                persona = contact.persona;
            } else {
                persona = `你是${contact.name}。`;
            }

            // Get worldbook context
            let wbContext = '';
            const wbIds = contact.settings?.mountedWbIds || [];
            if (Array.isArray(wbIds) && wbIds.length > 0 && Array.isArray(store.worldbooks)) {
                const mountedBooks = store.worldbooks.filter(wb => wbIds.includes(wb.id));
                if (mountedBooks.length > 0) wbContext = '\n角色背景：' + mountedBooks.map(wb => wb.content).join('\n');
            }

            // [OPT] 游戏系统只需要记忆、聊天和关系网上下文
            let memoryContext = '';
            if (typeof buildContactGlobalMemory === 'function') {
                memoryContext = '\n你的全局记忆数据：' + buildContactGlobalMemory(contact.id, { sections: ['memory', 'chat', 'relation'] });
            }

            // Get recent chat history for emotional/relational context
            let chatContext = '';
            const chats = store.chats?.[contact.id];
            if (chats && chats.length > 0) {
                const recent = chats.slice(-10).filter(m => m.type === 'text');
                if (recent.length > 0) {
                    chatContext = '\n最近的聊天记录（参考说话风格和关系状态）：\n' + recent.map(m => `${m.sender === 'me' ? getUserPersonaName(contact, store.user.name || '用户') : contact.name}: ${m.content}`).join('\n');
                }
            }

            if (gameType === 'anonQA') {
                return `${persona}${wbContext}${memoryContext}${chatContext}\n\n你正在参与"匿问我答"——有人匿名向你提问，你不知道对方是谁。\n\n【核心要求】用你自己的性格和说话方式来回答，2-4句话，自然口语化。\n\n【严格禁止】\n- 禁止输出人设描述或角色介绍\n- 禁止输出动作描写如"*皱眉*"或"（叹气）"\n- 禁止OOC，你就是这个角色本人\n- 禁止猜测提问者的身份\n- 禁止输出空白内容或省略号代替回答\n\n【必须做到】\n- 直接输出回答内容，不要加任何前缀\n- 回答要有你的个人风格和口头禅\n- 像真的在社交平台上回答匿名提问一样自然`;
            } else if (gameType === 'uno') {
                return `${persona}${wbContext}${memoryContext}${chatContext}\n\n你正在和朋友们玩《一起优诺》UNO牌游戏。\n\n【核心要求】你需要用你的性格说出简短的游戏台词（8-30字的实际对话），就像真人玩牌时说的话。\n\n【严格禁止】\n- 禁止输出人设描述或角色介绍\n- 禁止输出"…"省略号代替内容\n- 禁止输出动作描写如"*皱眉*"或"（叹气）"\n- 禁止输出空白内容\n\n【必须做到】\n- 直接输出一句有具体内容的台词\n- 台词要有情感和具体含义，不能是空洞的\n- 用你的说话风格和口头禅来说话\n- 像真人打牌聊天一样自然`;
            } else if (gameType === 'numBomb') {
                return `${persona}${wbContext}${memoryContext}${chatContext}\n\n你正在和朋友们玩"数字炸弹"游戏——在1到100之间有一个炸弹数字，大家轮流猜数字，每次猜完范围会缩小，猜中炸弹数字的人就爆炸输了。\n\n【核心要求】你需要用你的性格说出简短的游戏反应台词（10-40字），就像真人玩猜数字时说的话。\n\n【严格禁止】\n- 禁止输出人设描述或角色介绍\n- 禁止输出"…"省略号代替内容\n- 禁止输出动作描写如"*皱眉*"或"（叹气）"\n- 禁止OOC，你就是这个角色本人\n- 禁止输出空白内容\n\n【必须做到】\n- 直接输出一句有具体内容的台词\n- 台词要有情感，比如紧张、兴奋、嘲讽、害怕、得意等\n- 用你的说话风格和口头禅\n- 像真人玩游戏时的自然反应`;
            } else {
                return `${persona}${wbContext}${memoryContext}${chatContext}\n\n你正在参与一个"你说我猜"的游戏。请用你自己的性格和说话方式来参与游戏。`;
            }
        }

        async function callGameAI(messages) {
            try {
                const data = await API.chatCompletion(messages, store.system.temp || 0.7);
                if (!data || !data.choices || !data.choices[0]) throw new Error('AI response invalid');
                return data.choices[0].message.content.trim();
            } catch(e) {
                console.error('callGameAI failed:', e);
                throw e;
            }
        }

        // ========== 💣 数字炸弹游戏 ==========

        // 数字炸弹 - 联系人邀请 & 设置页面
        function renderNumBombSetup(area, contacts) {
            if (!gamesState._nbSelected) gamesState._nbSelected = new Set();
            if (!gamesState._nbMode) gamesState._nbMode = 'play'; // play=同玩, host=出题
            if (!gamesState._nbNumber) gamesState._nbNumber = '';
            const selected = gamesState._nbSelected;
            const mode = gamesState._nbMode;

            area.innerHTML = `
                <div class="games-page nb-setup-page">
                    <div class="nav-bar" style="background:#FFF0E6; border:none;">
                        <div class="nav-icon" onclick="gamesState.view='home'; gamesState._nbSelected=null; gamesState._nbMode=null; gamesState._nbNumber=null; renderGamesHome();"><i class="fas fa-chevron-left" style="color:#333;font-size:18px;"></i></div>
                        <div class="nav-title" style="color:#333; font-weight:700;">💣 数字炸弹</div>
                        <div style="width:40px;"></div>
                    </div>
                    <div class="scroll-y" style="background:#FFF8F3; padding:15px;">
                        <div class="nb-setup-header">
                            <div class="nb-setup-emoji">💣</div>
                            <div class="nb-setup-title">猜数字，别踩雷！</div>
                            <div class="nb-setup-sub">邀请好友一起玩吧～ 不限人数</div>
                        </div>

                        <div style="text-align:center; margin-bottom:12px;">
                            <div class="nb-section-title" style="text-align:center; margin-bottom:8px;">── 选择模式 ──</div>
                        </div>
                        <div class="nb-mode-wrap">
                            <div class="nb-mode-btn ${mode === 'host' ? 'active' : ''}" onclick="gamesState._nbMode='host'; renderGamesHome();">
                                <span class="nb-mode-emoji">😈</span>
                                <div class="nb-mode-name">出题模式</div>
                                <span class="nb-mode-label">我设数字，看他们猜</span>
                            </div>
                            <div class="nb-mode-btn ${mode === 'play' ? 'active' : ''}" onclick="gamesState._nbMode='play'; renderGamesHome();">
                                <span class="nb-mode-emoji">🎲</span>
                                <div class="nb-mode-name">同玩模式</div>
                                <span class="nb-mode-label">系统随机，一起猜</span>
                            </div>
                        </div>

                        ${mode === 'host' ? `
                        <div class="nb-number-section">
                            <label>🔢 输入炸弹数字 (1-100)</label>
                            <input type="number" class="nb-number-input" id="nb-bomb-input" min="1" max="100" value="${gamesState._nbNumber || ''}" placeholder="?" oninput="gamesState._nbNumber=this.value">
                        </div>` : ''}

                        <div style="text-align:center; margin:10px 0 5px;">
                            <div class="nb-section-title" style="text-align:center;">── 邀请好友 (不限人数) ──</div>
                            <div class="nb-contact-count">已选择 ${selected.size} 位好友</div>
                        </div>

                        <div class="games-contact-list">
                            ${contacts.length === 0 ? '<div style="text-align:center; color:#ccc; padding:40px; font-size:14px;">还没有联系人哦，先去添加好友吧～</div>' :
                            contacts.map(c => `
                                <div class="games-contact-item nb-contact-item ${selected.has(c.id) ? 'nb-selected' : ''}" onclick="toggleNumBombContact('${c.id}')">
                                    <img src="${c.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.name[0]) + '&background=fddcca&color=e8734a'}" class="games-contact-avatar" style="border-color:#FDDCCA;">
                                    <div class="games-contact-name">${c.name}</div>
                                    <div class="nb-check">${selected.has(c.id) ? '<i class="fas fa-check-circle" style="color:#333; font-size:22px;"></i>' : '<i class="far fa-circle" style="color:#ccc; font-size:22px;"></i>'}</div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="nb-setup-actions">
                            <button class="nb-start-btn" onclick="startNumBombGame()" ${selected.size < 1 ? 'disabled' : ''}>
                                <i class="fas fa-play"></i> 开始游戏 (${selected.size + (mode === 'play' ? 1 : 0)}人${mode === 'host' ? '，你出题观战' : ''})
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        function toggleNumBombContact(contactId) {
            if (!gamesState._nbSelected) gamesState._nbSelected = new Set();
            if (gamesState._nbSelected.has(contactId)) {
                gamesState._nbSelected.delete(contactId);
            } else {
                gamesState._nbSelected.add(contactId);
            }
            renderGamesHome();
        }

        function startNumBombGame() {
            const selectedIds = gamesState._nbSelected ? Array.from(gamesState._nbSelected) : [];
            if (selectedIds.length < 1) return toast('至少邀请1位好友');
            const mode = gamesState._nbMode || 'play';
            let bombNumber;

            if (mode === 'host') {
                bombNumber = parseInt(gamesState._nbNumber);
                if (!bombNumber || bombNumber < 1 || bombNumber > 100) return toast('请输入1-100的数字');
            } else {
                bombNumber = Math.floor(Math.random() * 100) + 1;
            }

            const selectedContacts = selectedIds.map(id => store.contacts.find(c => c.id === id)).filter(Boolean);
            const players = [];

            // 同玩模式：用户参与
            if (mode === 'play') {
                players.push({
                    id: 'user',
                    name: store.user.name || '我',
                    avatar: store.user.avatar || '',
                    isUser: true,
                    contact: null
                });
            }

            // 添加联系人
            selectedContacts.forEach(c => {
                players.push({
                    id: c.id,
                    name: c.name,
                    avatar: c.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.name[0]) + '&background=fddcca&color=e8734a',
                    isUser: false,
                    contact: c
                });
            });

            // 随机打乱顺序
            for (let i = players.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [players[i], players[j]] = [players[j], players[i]];
            }

            gamesState.numBomb = {
                mode: mode,
                bombNumber: bombNumber,
                rangeMin: 0,
                rangeMax: 101,
                players: players,
                currentPlayerIdx: 0,
                guessHistory: [],
                gameOver: false,
                loser: null,
                punishment: '',
                aiThinking: false,
                resultReactions: [],
                startTime: Date.now(),
                // [FIX-记忆混乱] 记录游戏发起人，解决"不知道谁发起的"问题
                initiator: { id: '__user__', name: store.user.name || '用户', isUser: true }
            };

            gamesState.view = 'numBomb';
            gamesState._nbSelected = null;
            gamesState._nbMode = null;
            gamesState._nbNumber = null;
            renderGamesHome();

            // 如果第一个玩家是AI，自动触发
            const firstPlayer = players[0];
            if (!firstPlayer.isUser) {
                setTimeout(() => scheduleNumBombAI(), 800);
            }
        }

        // AI猜数 - 本地计算
        function aiGuessNumber(rangeMin, rangeMax) {
            const min = rangeMin + 1;
            const max = rangeMax - 1;
            if (min >= max) return min;
            const mid = Math.floor((min + max) / 2);
            const range = max - min;
            const offset = Math.floor(Math.random() * Math.ceil(range * 0.35));
            const direction = Math.random() > 0.5 ? 1 : -1;
            let guess = mid + (direction * offset);
            guess = Math.max(min, Math.min(max, guess));
            return guess;
        }

        // AI出牌逻辑
        async function scheduleNumBombAI() {
            const nb = gamesState.numBomb;
            if (!nb || nb.gameOver) return;
            const player = nb.players[nb.currentPlayerIdx];
            if (!player || player.isUser) return;

            nb.aiThinking = true;
            renderGamesHome();

            // 模拟AI思考时间
            await new Promise(r => setTimeout(r, 1200 + Math.random() * 1500));

            if (!gamesState.numBomb || gamesState.numBomb.gameOver) return;

            const guess = aiGuessNumber(nb.rangeMin, nb.rangeMax);
            await processNumBombGuess(guess, player);
        }

        // 处理猜数（用户或AI）
        async function processNumBombGuess(guess, player) {
            const nb = gamesState.numBomb;
            if (!nb || nb.gameOver) return;

            const isBomb = (guess === nb.bombNumber);
            let result = '';
            if (isBomb) {
                result = '💥 踩到炸弹！';
            } else if (guess > nb.bombNumber) {
                result = '📉 大了！';
                nb.rangeMax = guess;
            } else {
                result = '📈 小了！';
                nb.rangeMin = guess;
            }

            const historyEntry = {
                playerId: player.id,
                playerName: player.name,
                playerAvatar: player.avatar,
                guess: guess,
                result: result,
                isBomb: isBomb,
                reaction: ''
            };

            nb.guessHistory.push(historyEntry);

            // 获取AI反应台词
            if (!player.isUser && player.contact) {
                try {
                    const reaction = await getNumBombReaction(player.contact, isBomb ? 'self_bomb' : 'self_guess', {
                        guess, result, min: nb.rangeMin, max: nb.rangeMax
                    });
                    historyEntry.reaction = reaction;
                } catch(e) {
                    historyEntry.reaction = _getNumBombFallbackReaction(isBomb ? 'self_bomb' : 'self_guess', player.name);
                }
            }

            if (isBomb) {
                // 游戏结束
                nb.gameOver = true;
                nb.loser = { id: player.id, name: player.name, avatar: player.avatar };
                nb.aiThinking = false;
                clearSavedGamesState();

                // 保存到历史记录
                saveNumBombToHistory(nb);

                // 生成惩罚和所有人的结算反应
                gamesState.view = 'numBombResult';
                renderGamesHome();

                // 异步加载惩罚和反应
                generateNumBombEndReactions(nb);
                return;
            }

            // 下一位玩家
            nb.currentPlayerIdx = (nb.currentPlayerIdx + 1) % nb.players.length;
            nb.aiThinking = false;
            renderGamesHome();

            // 自动滚动到最新记录
            setTimeout(() => {
                const histList = document.querySelector('.nb-history-list');
                if (histList) histList.scrollTop = histList.scrollHeight;
            }, 100);

            // 如果下一位是AI，自动触发
            const nextPlayer = nb.players[nb.currentPlayerIdx];
            if (!nextPlayer.isUser) {
                setTimeout(() => scheduleNumBombAI(), 600);
            }
        }

        // 用户猜数
        function userNumBombGuess() {
            const nb = gamesState.numBomb;
            if (!nb || nb.gameOver) return;
            const player = nb.players[nb.currentPlayerIdx];
            if (!player || !player.isUser) return;

            const input = document.getElementById('nb-user-guess');
            if (!input) return;
            const guess = parseInt(input.value);
            if (!guess || guess <= nb.rangeMin || guess >= nb.rangeMax) {
                return toast(`请输入 ${nb.rangeMin + 1} ~ ${nb.rangeMax - 1} 之间的数字`);
            }
            input.value = '';
            processNumBombGuess(guess, player);
        }

        // 获取AI反应台词
        async function getNumBombReaction(contact, situation, context) {
            const sysPrompt = buildGameSystemPrompt(contact, 'numBomb');
            const situations = {
                'self_guess': `你刚猜了${context.guess}，结果是"${context.result}"，当前范围缩小到${context.min + 1}~${context.max - 1}。请直接说一句你的反应台词，10-30字。`,
                'other_guess': `${context.guesserName}猜了${context.guess}，结果是"${context.result}"，范围变成${context.min + 1}~${context.max - 1}。请直接说一句你的反应台词，10-30字。`,
                'self_bomb': `你猜了${context.guess}，踩到炸弹了！你输了！请直接说一句崩溃或搞笑的反应台词，15-40字。`,
                'other_bomb': `${context.loserName}猜了${context.guess}踩到炸弹爆炸了！你安全了！请直接说一句反应台词，15-40字。`,
                'punishment_react': `你踩雷了，惩罚是"${context.punishment}"。请直接说一句接受惩罚的反应台词，15-40字。`,
                'watch_punishment': `${context.loserName}的惩罚是"${context.punishment}"。请直接说一句围观反应台词，10-30字。`
            };

            const data = await API.chatCompletion([
                { role: 'system', content: sysPrompt },
                { role: 'user', content: situations[situation] || situations['self_guess'] }
            ], 0.9);

            let text = data.choices[0].message.content.trim();
            text = text.replace(/^[""""''「」『』]|[""""''「」『』]$/g, '').trim();
            // 去掉角色名前缀
            if (text.includes('：') || text.includes(':')) {
                const colonIdx = Math.min(
                    text.indexOf('：') > -1 ? text.indexOf('：') : 999,
                    text.indexOf(':') > -1 ? text.indexOf(':') : 999
                );
                if (colonIdx < 8) text = text.substring(colonIdx + 1).trim();
            }
            return text || _getNumBombFallbackReaction(situation, contact.name);
        }

        // 本地fallback反应
        function _getNumBombFallbackReaction(situation, name) {
            const reactions = {
                'self_guess': ['还好还好，继续~', '呼，没踩到！', '这个范围有点危险啊...', '安全！轮到下一个了'],
                'self_bomb': ['啊啊啊不会吧！', '完蛋了...', '太惨了呜呜', '我怎么这么倒霉！'],
                'other_bomb': ['哈哈哈太惨了！', '好险不是我！', '下次小心点哦~', '真的假的！'],
                'punishment_react': ['好吧我认了...', '这也太离谱了！', '呜呜呜饶了我吧', '行行行我做还不行吗'],
                'watch_punishment': ['快快快做给我们看！', '哈哈哈笑死我了', '好可怜噢~', '活该！谁让你踩的']
            };
            const pool = reactions[situation] || reactions['self_guess'];
            return pool[Math.floor(Math.random() * pool.length)];
        }

        // 生成游戏结束时的惩罚和所有人反应
        async function generateNumBombEndReactions(nb) {
            // 1. 生成惩罚
            const loserContact = nb.loser && nb.loser.id !== 'user' ?
                nb.players.find(p => p.id === nb.loser.id)?.contact : null;

            try {
                const punishPrompt = `请为"数字炸弹"游戏踩雷的人生成一个趣味惩罚（轻松搞笑的，比如：学猫叫、唱一首歌的副歌、说一句土味情话、做10个深蹲、模仿某个动物等）。只输出惩罚内容，15-30字，不要编号不要解释。`;
                const punishData = await API.chatCompletion([
                    { role: 'system', content: '你是一个派对游戏主持人，负责生成有趣但不过分的惩罚。' },
                    { role: 'user', content: punishPrompt }
                ], 0.95);
                nb.punishment = punishData.choices[0].message.content.trim().replace(/^[""""'']/,'').replace(/[""""'']$/,'');
            } catch(e) {
                const fallbackPunishments = [
                    '学猫叫三声给大家听！🐱',
                    '唱一首你最近在听的歌的副歌！🎤',
                    '说一句让人起鸡皮疙瘩的土味情话！💕',
                    '做10个深蹲！💪',
                    '模仿一个动物叫声并让大家猜！🐒',
                    '用唱歌的方式说一句话！🎵',
                    '闭着眼睛原地转三圈！🌀'
                ];
                nb.punishment = fallbackPunishments[Math.floor(Math.random() * fallbackPunishments.length)];
            }

            // 2. 获取踩雷者对惩罚的反应
            if (loserContact) {
                try {
                    const loserReaction = await getNumBombReaction(loserContact, 'punishment_react', { punishment: nb.punishment });
                    nb.loserPunishReaction = loserReaction;
                } catch(e) {
                    nb.loserPunishReaction = _getNumBombFallbackReaction('punishment_react', nb.loser.name);
                }
            } else if (nb.loser && nb.loser.id === 'user') {
                nb.loserPunishReaction = ''; // 用户自己踩雷，不生成反应
            }

            // 3. 批量获取其他人对结果的反应
            nb.resultReactions = [];
            const otherPlayers = nb.players.filter(p => p.id !== nb.loser.id && !p.isUser && p.contact);
            for (const player of otherPlayers) {
                try {
                    const reaction = await getNumBombReaction(player.contact, 'other_bomb', {
                        loserName: nb.loser.name, guess: nb.guessHistory[nb.guessHistory.length - 1]?.guess
                    });
                    nb.resultReactions.push({ id: player.id, name: player.name, avatar: player.avatar, text: reaction });
                } catch(e) {
                    nb.resultReactions.push({ id: player.id, name: player.name, avatar: player.avatar, text: _getNumBombFallbackReaction('other_bomb', player.name) });
                }
            }

            // 重新渲染结果页
            renderGamesHome();
        }

        // 保存到历史记录
        function saveNumBombToHistory(nb) {
            if (!store.numBombHistory) store.numBombHistory = [];
            store.numBombHistory.push({
                id: 'nb_' + Date.now(),
                time: Date.now(),
                bombNumber: nb.bombNumber,
                mode: nb.mode,
                players: nb.players.map(p => ({ id: p.id, name: p.name, isUser: p.isUser })),
                loser: nb.loser ? { id: nb.loser.id, name: nb.loser.name } : null,
                guessCount: nb.guessHistory.length,
                punishment: nb.punishment || '',
                duration: Date.now() - (nb.startTime || Date.now()),
                // [FIX-记忆混乱] 记录发起人信息
                initiator: nb.initiator || { id: '__user__', name: store.user.name || '用户', isUser: true }
            });
            if (store.numBombHistory.length > 50) {
                store.numBombHistory = store.numBombHistory.slice(-30);
            }
            // 更新成就统计
            if (!store.gameStats) store.gameStats = {};
            store.gameStats.bombGamesPlayed = (store.gameStats.bombGamesPlayed || 0) + 1;
            store.gameStats.gamesPlayed = (store.gameStats.gamesPlayed || 0) + 1;
            if (nb.loser && nb.loser.id !== 'user') {
                store.gameStats.bombSurviveStreak = (store.gameStats.bombSurviveStreak || 0) + 1;
            } else {
                store.gameStats.bombSurviveStreak = 0;
            }
            save();
        }

        // 游戏主界面渲染
        function renderNumBombGame(area) {
            const nb = gamesState.numBomb;
            if (!nb) { gamesState.view = 'home'; renderGamesHome(); return; }

            const currentPlayer = nb.players[nb.currentPlayerIdx];
            const isMyTurn = currentPlayer && currentPlayer.isUser;
            const rangeSize = nb.rangeMax - nb.rangeMin - 1;
            const leftPct = (nb.rangeMin / 100) * 100;
            const widthPct = ((nb.rangeMax - nb.rangeMin) / 100) * 100;
            const elapsed = Math.floor((Date.now() - (nb.startTime || Date.now())) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;

            area.innerHTML = `
                <div class="games-page nb-game-page">
                    <div class="nav-bar" style="background:#FFF0E6; border:none;">
                        <div class="nav-icon" onclick="exitNumBombGame()"><i class="fas fa-chevron-left" style="color:#333;font-size:18px;"></i></div>
                        <div class="nav-title" style="color:#333; font-weight:700;">💣 数字炸弹</div>
                        <div style="font-size:13px; color:#B88A6E; font-weight:600; padding-right:12px;">⏱️ ${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}</div>
                    </div>
                    <div class="scroll-y nb-game-scroll">
                        ${nb.mode === 'host' ? '<div class="nb-host-badge">😈 出题者模式 · 你在观战</div>' : ''}

                        <div class="nb-range-bar">
                            <div class="nb-range-title">💣 炸弹藏在范围内 · 剩余 ${rangeSize} 个数</div>
                            <div class="nb-range-labels">
                                <span>${nb.rangeMin + 1}</span>
                                <span>~</span>
                                <span>${nb.rangeMax - 1}</span>
                            </div>
                            <div class="nb-range-track">
                                <div class="nb-range-active" style="left:${leftPct}%; width:${widthPct}%;"></div>
                            </div>
                            <div class="nb-range-hint">${rangeSize <= 5 ? '⚠️ 范围已经很小了！小心！' : rangeSize <= 15 ? '😰 范围在缩小...' : '🎯 慢慢缩小范围'}</div>
                        </div>

                        <div class="nb-players-bar">
                            ${nb.players.map((p, i) => `
                                <div class="nb-player-slot">
                                    <img src="${p.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.name[0]) + '&background=fddcca&color=e8734a'}" class="nb-player-avatar ${i === nb.currentPlayerIdx ? 'nb-current-turn' : ''}">
                                    <div class="nb-player-name-tag ${i === nb.currentPlayerIdx ? 'nb-turn-tag' : ''}">${p.name.substring(0,3)}</div>
                                </div>
                            `).join('')}
                        </div>

                        ${isMyTurn && !nb.aiThinking ? `
                        <div class="nb-input-area">
                            <div class="nb-input-label">🎯 轮到你了！猜一个数字</div>
                            <div class="nb-input-row">
                                <input type="number" class="nb-guess-input" id="nb-user-guess" min="${nb.rangeMin + 1}" max="${nb.rangeMax - 1}" placeholder="?" onkeydown="if(event.key==='Enter')userNumBombGuess()">
                                <button class="nb-guess-btn" onclick="userNumBombGuess()">💣 确定</button>
                            </div>
                        </div>` : ''}

                        ${nb.aiThinking ? `
                        <div class="nb-waiting">
                            <div class="nb-waiting-text">轮到 <span class="nb-waiting-name">${currentPlayer ? currentPlayer.name : '...'}</span> 猜数...<span class="nb-thinking-dots"><span></span><span></span><span></span></span></div>
                        </div>` : ''}

                        ${!isMyTurn && !nb.aiThinking && nb.mode === 'host' ? `
                        <div class="nb-waiting">
                            <div class="nb-waiting-text">轮到 <span class="nb-waiting-name">${currentPlayer ? currentPlayer.name : '...'}</span> 猜数...<span class="nb-thinking-dots"><span></span><span></span><span></span></span></div>
                        </div>` : ''}

                        <div class="nb-history-title">💬 猜数记录 (${nb.guessHistory.length}轮)</div>
                        <div class="nb-history-list">
                            ${nb.guessHistory.length === 0 ? '<div style="text-align:center; color:#ccc; padding:20px; font-size:13px;">等待第一位玩家猜数...</div>' :
                            nb.guessHistory.map(h => `
                                <div class="nb-history-item ${h.isBomb ? 'nb-history-bomb' : ''}">
                                    <div class="nb-history-top">
                                        <img src="${h.playerAvatar || 'https://ui-avatars.com/api/?name=U&background=fddcca&color=e8734a'}" class="nb-history-avatar">
                                        <div class="nb-history-info">
                                            <div class="nb-history-player">${h.playerName} 猜了 <b>${h.guess}</b></div>
                                            <div class="nb-history-result">${h.result}</div>
                                        </div>
                                    </div>
                                    ${h.reaction ? `<div class="nb-history-reaction">💬 "${h.reaction}"</div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            // 自动聚焦输入框
            if (isMyTurn && !nb.aiThinking) {
                setTimeout(() => {
                    const input = document.getElementById('nb-user-guess');
                    if (input) input.focus();
                }, 200);
            }

            // 出题模式下AI自动开始
            if (nb.mode === 'host' && !nb.aiThinking && nb.guessHistory.length === 0) {
                setTimeout(() => scheduleNumBombAI(), 800);
            }
        }

        // 结算页面渲染
        function renderNumBombResult(area) {
            const nb = gamesState.numBomb;
            if (!nb) { gamesState.view = 'home'; renderGamesHome(); return; }

            // 排名：未踩雷的按猜数次数排，踩雷者最后
            const playerGuesses = {};
            nb.players.forEach(p => { playerGuesses[p.id] = 0; });
            nb.guessHistory.forEach(h => { playerGuesses[h.playerId] = (playerGuesses[h.playerId] || 0) + 1; });

            const safePs = nb.players.filter(p => !nb.loser || p.id !== nb.loser.id)
                .sort((a, b) => (playerGuesses[a.id] || 0) - (playerGuesses[b.id] || 0));
            const rankings = [...safePs];
            const loserPlayer = nb.players.find(p => nb.loser && p.id === nb.loser.id);
            if (loserPlayer) rankings.push(loserPlayer);

            const rankEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

            area.innerHTML = `
                <div class="games-page nb-game-page">
                    <div class="nav-bar" style="background:#FFF0E6; border:none;">
                        <div class="nav-icon" onclick="exitNumBombGame()"><i class="fas fa-chevron-left" style="color:#333;font-size:18px;"></i></div>
                        <div class="nav-title" style="color:#333; font-weight:700;">💣 游戏结束</div>
                        <div style="width:40px;"></div>
                    </div>
                    <div class="scroll-y nb-result-page">
                        <div class="nb-explosion-emoji">💥</div>
                        <div class="nb-result-title">
                            ${nb.loser ? `<span class="nb-loser-name">${nb.loser.name}</span> 踩到炸弹了！` : '游戏结束'}
                        </div>
                        <div class="nb-bomb-reveal">
                            炸弹数字是 <span class="nb-bomb-number">${nb.bombNumber}</span>
                        </div>

                        <div class="nb-ranking">
                            <div class="nb-ranking-title">🏆 排名</div>
                            ${rankings.map((p, i) => {
                                const isBomb = nb.loser && p.id === nb.loser.id;
                                const guesses = playerGuesses[p.id] || 0;
                                return `
                                <div class="nb-rank-item ${isBomb ? 'nb-rank-bomb' : 'nb-rank-safe'}">
                                    <div class="nb-rank-pos">${isBomb ? '💣' : (rankEmojis[i] || (i+1))}</div>
                                    <img src="${p.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.name[0]) + '&background=fddcca&color=e8734a'}" class="nb-rank-avatar">
                                    <div class="nb-rank-name">${p.name}</div>
                                    <div class="nb-rank-status">${isBomb ? '💥 踩雷' : '✅ 安全'} (猜${guesses}次)</div>
                                </div>`;
                            }).join('')}
                        </div>

                        ${nb.punishment ? `
                        <div class="nb-punishment-card">
                            <div class="nb-punishment-title">😈 惩罚环节</div>
                            <div class="nb-punishment-text">🎯 ${nb.loser ? nb.loser.name : '踩雷者'}的惩罚：${nb.punishment}</div>
                            ${nb.loserPunishReaction ? `<div class="nb-punishment-reaction">💬 ${nb.loser ? nb.loser.name : ''}："${nb.loserPunishReaction}"</div>` : ''}
                        </div>` : `
                        <div class="nb-punishment-card">
                            <div class="nb-punishment-title">😈 惩罚生成中...</div>
                            <div class="nb-punishment-text" style="text-align:center;">
                                <span class="nb-thinking-dots"><span></span><span></span><span></span></span>
                            </div>
                        </div>`}

                        ${nb.resultReactions && nb.resultReactions.length > 0 ? `
                        <div class="nb-reactions">
                            <div class="nb-reactions-title">💬 大家的反应</div>
                            ${nb.resultReactions.map(r => `
                                <div class="nb-reaction-item">
                                    <img src="${r.avatar || ''}" class="nb-reaction-avatar">
                                    <div class="nb-reaction-content">
                                        <div class="nb-reaction-name">${r.name}</div>
                                        <div class="nb-reaction-text">"${r.text}"</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>` : ''}

                        <div class="nb-result-btns">
                            <button class="nb-replay-btn" onclick="restartNumBomb()">
                                <i class="fas fa-redo"></i> 再来一局
                            </button>
                            <button class="nb-exit-btn" onclick="exitNumBombGame()">
                                <i class="fas fa-door-open"></i> 退出
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // 退出数字炸弹
        function exitNumBombGame() {
            const nb = gamesState.numBomb;
            if (nb && !nb.gameOver) {
                showConfirm('退出游戏', '确定要退出数字炸弹吗？当前游戏进度将丢失。', () => {
                    gamesState.numBomb = null;
                    gamesState.view = 'home';
                    clearSavedGamesState();
                    renderGamesHome();
                });
            } else {
                gamesState.numBomb = null;
                gamesState.view = 'home';
                clearSavedGamesState();
                renderGamesHome();
            }
        }

        // 再来一局
        function restartNumBomb() {
            const nb = gamesState.numBomb;
            if (!nb) return;
            // 保留上一局的玩家
            const playerIds = nb.players.map(p => p.id).filter(id => id !== 'user');
            gamesState._nbSelected = new Set(playerIds);
            gamesState._nbMode = nb.mode;
            gamesState._nbNumber = '';
            gamesState.numBomb = null;
            gamesState.view = 'numBombSetup';
            clearSavedGamesState();
            renderGamesHome();
        }

        // [FIX-记忆混乱] UNO游戏历史保存
        function saveUnoToHistory(uno, endReason) {
            if (!store.unoHistory) store.unoHistory = [];
            var userName = store.user.name || '用户';
            store.unoHistory.push({
                id: 'uno_' + Date.now(),
                time: Date.now(),
                endReason: endReason, // 'normal' | 'timeout'
                players: uno.players.map(function(p) { return { id: p.isUser ? '__user__' : (p.contact ? p.contact.id : p.id), name: p.isUser ? userName : p.name, isUser: p.isUser, score: p.score || 0 }; }),
                winner: uno.winner ? { id: uno.winner.isUser ? '__user__' : (uno.winner.contact ? uno.winner.contact.id : uno.winner.id), name: uno.winner.isUser ? userName : uno.winner.name, isUser: uno.winner.isUser } : null,
                initiator: uno.initiator || { id: '__user__', name: userName, isUser: true },
                duration: Date.now() - (uno.startTime || Date.now())
            });
            if (store.unoHistory.length > 50) {
                store.unoHistory = store.unoHistory.slice(-30);
            }
            // 更新成就统计
            if (!store.gameStats) store.gameStats = {};
            store.gameStats.unoGamesPlayed = (store.gameStats.unoGamesPlayed || 0) + 1;
            store.gameStats.gamesPlayed = (store.gameStats.gamesPlayed || 0) + 1;
            save();
        }

        // [FIX-记忆混乱] UNO全局记忆钩子
        window._unoBuildMemory = function(contactId) {
            if (!store.unoHistory) return '';
            var relevantGames = store.unoHistory.filter(function(game) {
                return game.players.some(function(p) { return p.id === contactId; });
            });
            if (relevantGames.length === 0) return '';
            var userName = store.user.name || '用户';
            var mem = '';
            var recent = relevantGames.slice(-5);
            mem += '\n[UNO游戏记录(你和' + userName + '一起玩过的UNO牌游戏): ';
            recent.forEach(function(game) {
                var winnerName = game.winner ? (game.winner.isUser ? userName : game.winner.name) : '未知';
                var playerNames = game.players.map(function(p) { return p.isUser ? userName : p.name; }).join('、');
                var initiatorName = game.initiator ? (game.initiator.isUser ? userName : game.initiator.name) : userName;
                mem += '(' + new Date(game.time).toLocaleDateString() + ' ';
                mem += '由' + initiatorName + '发起, ';
                mem += '参与:' + playerNames + ', ';
                mem += winnerName + '获胜';
                if (game.endReason === 'timeout') mem += '(时间到计分判定)';
                mem += '); ';
            });
            mem += ']';
            var myWins = relevantGames.filter(function(g) { return g.winner && g.winner.id === contactId; }).length;
            if (relevantGames.length >= 2) {
                mem += '\n[UNO统计: 共玩' + relevantGames.length + '局, ';
                mem += myWins > 0 ? '你赢了' + myWins + '次' : '你从未赢过';
                mem += ']';
            }
            return mem;
        };

        // 全局记忆钩子
        window._numBombBuildMemory = function(contactId) {
            if (!store.numBombHistory) return '';
            var relevantGames = store.numBombHistory.filter(function(game) {
                return game.players.some(function(p) { return p.id === contactId; });
            });
            if (relevantGames.length === 0) return '';
            var userName = store.user.name || '用户';
            var mem = '';
            var recent = relevantGames.slice(-5);
            mem += '\n[数字炸弹游戏记录(你和' + userName + '一起玩过的猜数字游戏): ';
            recent.forEach(function(game) {
                var loserName = game.loser ? game.loser.name : '未知';
                var playerNames = game.players.map(function(p) { return p.isUser ? userName : p.name; }).join('、');
                // [FIX-记忆混乱] 获取发起人名字
                var initiatorName = '';
                if (game.initiator) {
                    initiatorName = game.initiator.isUser ? userName : game.initiator.name;
                }
                mem += '(' + new Date(game.time).toLocaleDateString() + ' ';
                // [FIX-记忆混乱] 输出发起人信息
                if (initiatorName) mem += '由' + initiatorName + '发起, ';
                mem += '参与:' + playerNames + ', ';
                mem += '炸弹:' + game.bombNumber + ', ';
                mem += loserName + '踩雷';
                if (game.punishment) mem += ', 惩罚:"' + game.punishment.substring(0, 30) + '"';
                mem += '); ';
            });
            mem += ']';
            var myBombs = relevantGames.filter(function(g) { return g.loser && g.loser.id === contactId; }).length;
            if (relevantGames.length >= 2) {
                mem += '\n[数字炸弹统计: 共玩' + relevantGames.length + '局, ';
                mem += myBombs > 0 ? '你踩雷' + myBombs + '次' : '你从未踩雷';
                mem += ']';
            }
            return mem;
        };

        function markAllMailRead() {
            ensureMailbox();
            store.mailbox.forEach(m => { if (m.type === 'inbox') m.read = true; });
            save();
            renderMailList();
            updateMailBadge();
            closeMailboxMenu();
            showToast('已全部标记为已读');
        }

        function clearAllMail() {
            showConfirm('清空邮件', '确定要清空所有邮件吗？此操作不可恢复。', () => {
                store.mailbox = [];
                save();
                renderMailList();
                updateMailBadge();
                closeMailboxMenu();
                showToast('邮件已清空');
            });
        }

