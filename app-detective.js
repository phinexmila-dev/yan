/* ============================================================
   迷雾追凶 — app-detective.js
   侦探推理破案游戏，类似明星大侦探/剧本杀
   所有案件内容通过 API.chatCompletion 动态生成
   UI 风格参考第五人格哥特侦探风
   ============================================================ */

// ---- 状态 ----
var detectiveState = {
    view: 'home',
    // views: home | selectContact | loading | intro | roleReveal | introduce |
    //        search | plotEvent | roundtable | vote | voteResult | defense |
    //        crossExamine | search2 | plotEvent2 | roundtable2 | closingStatement |
    //        finalVote | finalResult | truth
    games: [],
    current: null,
    _selectedContacts: new Set(),
    _introIndex: 0,
    _crossExamineCount: 0
};

function _initDetectiveData() {
    if (!store.detective) store.detective = { games: [] };
    detectiveState.games = store.detective.games || [];
}

function _detSave() {
    store.detective.games = detectiveState.games;
    if (typeof save === 'function') save();
}

// ---- 工具函数 ----
function _detEsc(s) {
    return typeof escapeHtml === 'function' ? escapeHtml(s) : (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _detTimeAgo(ts) {
    if (!ts) return '';
    var diff = Date.now() - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return Math.floor(diff / 86400000) + '天前';
}

function _detGenId() {
    return 'det_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function _detParseJSON(text) {
    text = (text || '').replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    var start = text.indexOf('{');
    var end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
        text = text.substring(start, end + 1);
    }
    return JSON.parse(text);
}

function _detGetAvatar(contact) {
    if (!contact) return '';
    if (contact.avatar && contact.avatar.startsWith('http')) {
        return '<img src="' + _detEsc(contact.avatar) + '" onerror="this.parentElement.textContent=\'👤\'">';
    }
    if (contact.avatar) return _detEsc(contact.avatar);
    return (contact.name || '?').charAt(0);
}

function _detGetUserAvatar() {
    if (store.user && store.user.avatar && store.user.avatar.startsWith('http')) {
        return '<img src="' + _detEsc(store.user.avatar) + '" onerror="this.parentElement.textContent=\'🧑\'">';
    }
    return '🧑';
}

function _detRender() {
    var v = detectiveState.view || 'home';
    var mapped = 'detective' + v.charAt(0).toUpperCase() + v.slice(1);
    gamesState.view = mapped;
    renderGamesHome();
}

// ========== 查看已知线索浮层 ==========
function _detShowCluesPanel() {
    var game = detectiveState.current;
    if (!game) return;
    var myRole = game.roles.find(function(r) { return r.isUser; });
    if (!myRole) return;
    var myClueIds = game.playerClues[myRole.id] || [];
    var pool1 = game.cluesPool.round1 || [];
    var pool2 = game.cluesPool.round2 || [];
    var myClues = myClueIds.map(function(cid) {
        return pool1.find(function(c) { return c.id === cid; })
            || pool2.find(function(c) { return c.id === cid; });
    }).filter(Boolean);
    // 剧情事件线索
    (game.plotEvents || []).forEach(function(pe) {
        if (pe.triggered && pe.chosenIndex >= 0 && pe.choices[pe.chosenIndex] && pe.choices[pe.chosenIndex].clue) {
            myClues.push({ description: pe.choices[pe.chosenIndex].clue, importance: 'high', location: '📌 ' + pe.title });
        }
    });
    var html = myClues.length === 0
        ? '<div style="text-align:center;color:#888;padding:30px 0;">还没有收集到线索</div>'
        : myClues.map(function(c) {
            var stars = c.importance === 'critical' ? '⭐⭐⭐' : c.importance === 'high' ? '⭐⭐' : c.importance === 'medium' ? '⭐' : '';
            return '<div class="det-clue-card" data-importance="' + c.importance + '">' +
                _detEsc(c.description) +
                '<div class="det-clue-location">📍 ' + _detEsc(c.location) + '</div>' +
                (stars ? '<div class="det-clue-stars">' + stars + '</div>' : '') +
            '</div>';
        }).join('');
    var overlay = document.createElement('div');
    overlay.id = 'det-clues-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = '<div style="background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:540px;max-height:75vh;display:flex;flex-direction:column;">' +
        '<div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e0e0e0;">' +
            '<span style="color:#e0e0e0;font-weight:700;font-size:16px;">📋 已收集线索（' + myClues.length + '）</span>' +
            '<button onclick="document.getElementById(\'det-clues-overlay\').remove()" style="background:#f0f0f0;border:none;color:#999;width:28px;height:28px;border-radius:50%;font-size:14px;cursor:pointer;">×</button>' +
        '</div>' +
        '<div style="overflow-y:auto;padding:16px 20px;-webkit-overflow-scrolling:touch;">' + html + '</div>' +
    '</div>';
    document.body.appendChild(overlay);
}

// ========== 主入口 ==========
function renderDetectiveMain(area) {
    _initDetectiveData();
    var v = detectiveState.view;

    var viewMap = {
        'home': _detRenderHome,
        'selectContact': _detRenderSelectContact,
        'loading': function(a) { _detRenderLoading(a, '案件正在浮出水面...'); },
        'intro': _detRenderIntro,
        'roleReveal': _detRenderRoleReveal,
        'introduce': _detRenderIntroduce,
        'search': _detRenderSearch,
        'search2': _detRenderSearch,
        'plotEvent': _detRenderPlotEvent,
        'plotEvent2': _detRenderPlotEvent,
        'roundtable': _detRenderRoundtable,
        'roundtable2': _detRenderRoundtable,
        'vote': function(a) { _detRenderVote(a, false); },
        'voteResult': _detRenderVoteResult,
        'defense': _detRenderDefense,
        'crossExamine': _detRenderCrossExamine,
        'closingStatement': _detRenderClosingStatement,
        'finalVote': function(a) { _detRenderVote(a, true); },
        'finalResult': _detRenderFinalResult,
        'truth': _detRenderTruth
    };

    var fn = viewMap[v] || _detRenderHome;
    fn(area);
}

// ========== 主页 ==========
function _detRenderHome(area) {
    detectiveState.view = 'home';
    detectiveState.current = null;

    var historyHtml = '';
    var games = detectiveState.games;
    if (games.length > 0) {
        var items = games.slice().reverse().slice(0, 20).map(function(g) {
            var statusCls = g.status === 'ongoing' ? 'ongoing' : g.status === 'solved' ? 'won' : 'lost';
            var statusText = g.status === 'ongoing' ? '调查中' : g.status === 'solved' ? '真相大白' : '凶手逃脱';
            return '<div class="det-history-item" onclick="detResumeGame(\'' + g.id + '\')" style="position:relative;">' +
                '<div>' +
                '<div class="det-history-name">' + (g.caseEmoji || '🔍') + ' ' + _detEsc(g.caseName || '未命名案件') + '</div>' +
                '<div class="det-history-meta">' + (g.phase || '') + ' · ' + _detTimeAgo(g.createdAt) + '</div>' +
                '</div>' +
                '<div class="det-history-status ' + statusCls + '">' + statusText + '</div>' +
                '<button class="det-delete-btn" onclick="event.stopPropagation(); detDeleteGame(\'' + g.id + '\');"><i class="fas fa-times"></i></button>' +
                '</div>';
        }).join('');
        historyHtml = '<div class="det-history-section">' +
            '<div class="det-history-title"><i class="fas fa-clock-rotate-left"></i> 案件档案</div>' +
            '<div class="det-history-list">' + items + '</div>' +
            '</div>';
    }

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="gamesState.view=\'home\'; renderGamesHome();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">🔍 迷雾追凶</div>' +
            '<div class="det-nav-right"></div>' +
        '</div>' +
        '<div class="det-scroll">' +
        '<div class="det-home">' +
            '<div class="det-home-header">' +
                '<div class="det-home-icon">🕵️</div>' +
                '<div class="det-home-title">迷雾追凶</div>' +
                '<div class="det-home-subtitle">每一个人都有秘密，但只有一个人是凶手</div>' +
            '</div>' +
            '<div class="det-start-btn" onclick="detectiveState.view=\'selectContact\'; detectiveState._selectedContacts=new Set(); _detRender();">' +
                '<i class="fas fa-play"></i> 开始新案件' +
            '</div>' +
            historyHtml +
        '</div>' +
        '</div></div></div>';
}

// ========== 恢复/删除游戏 ==========
function detResumeGame(id) {
    _initDetectiveData();
    var game = detectiveState.games.find(function(g) { return g.id === id; });
    if (!game) { if (typeof toast === 'function') toast('案件不存在'); return; }
    detectiveState.current = game;
    if (game.status !== 'ongoing') {
        detectiveState.view = 'truth';
    } else {
        detectiveState.view = game.phase || 'intro';
    }
    renderGamesHome();
}

function detDeleteGame(id) {
    if (!confirm('确定删除此案件档案？')) return;
    _initDetectiveData();
    detectiveState.games = detectiveState.games.filter(function(g) { return g.id !== id; });
    _detSave();
    renderGamesHome();
}

// ========== 选择联系人 ==========
function _detRenderSelectContact(area) {
    var contacts = store.contacts ? store.contacts.filter(function(c) { return !c.isGroup; }) : [];
    var selected = detectiveState._selectedContacts;
    var canConfirm = selected.size >= 2 && selected.size <= 5;

    var listHtml = contacts.length === 0 ?
        '<div style="text-align:center; color:#999; padding:40px; font-size:13px;">还没有联系人，先去添加好友吧～</div>' :
        contacts.map(function(c) {
            var isSel = selected.has(c.id);
            return '<div class="det-contact-item' + (isSel ? ' selected' : '') + '" onclick="detToggleContact(\'' + c.id + '\')">' +
                '<div class="det-contact-avatar">' + _detGetAvatar(c) + '</div>' +
                '<div class="det-contact-name">' + _detEsc(c.name) + '</div>' +
                '<div class="det-contact-check"><i class="fas fa-check"></i></div>' +
                '</div>';
        }).join('');

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="detectiveState.view=\'home\'; _detRender();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">邀请侦探</div>' +
            '<div class="det-nav-right"></div>' +
        '</div>' +
        '<div class="det-scroll">' +
        '<div class="det-select-page">' +
            '<div class="det-select-title">🎭 选择参与案件的联系人</div>' +
            '<div class="det-select-hint">选择 2-5 位好友，加上你一共 3-6 人参与推理（已选 ' + selected.size + '/5）</div>' +
            '<div class="det-contact-list">' + listHtml + '</div>' +
            '<button class="det-select-confirm" ' + (canConfirm ? '' : 'disabled') + ' onclick="detStartGame();">🔍 开始案件</button>' +
        '</div>' +
        '</div></div></div>';
}

function detToggleContact(cid) {
    var sel = detectiveState._selectedContacts;
    if (sel.has(cid)) {
        sel.delete(cid);
    } else {
        if (sel.size >= 5) { if (typeof toast === 'function') toast('最多邀请5位好友'); return; }
        sel.add(cid);
    }
    renderGamesHome();
}

// ========== 开始游戏 - 分步API生成案件 ==========
async function detStartGame() {
    _initDetectiveData();

    // ★ 显示全屏加载弹窗，告知用户AI正在生成案件
    var _detOld = document.getElementById('det-gen-overlay');
    if (_detOld) _detOld.remove();
    var _detLoadingOverlay = document.createElement('div');
    _detLoadingOverlay.id = 'det-gen-overlay';
    _detLoadingOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
        'background:rgba(0,0,0,0.88);display:flex;flex-direction:column;align-items:center;' +
        'justify-content:center;z-index:99999;color:#fff;font-family:sans-serif;';
    _detLoadingOverlay.innerHTML =
        '<div style="font-size:52px;margin-bottom:16px;animation:detPulse 1.5s ease-in-out infinite">🔍</div>' +
        '<div style="font-size:18px;font-weight:600;margin-bottom:10px">案件正在浮出水面...</div>' +
        '<div style="font-size:13px;color:#999;max-width:260px;text-align:center;line-height:1.6">' +
        'AI正在创作完整的推理剧本<br>包括角色、线索和剧情事件<br>请耐心等待</div>' +
        '<div style="margin-top:20px;width:200px;height:3px;background:#333;border-radius:2px;overflow:hidden">' +
        '<div style="width:30%;height:100%;background:linear-gradient(90deg,#666,#fff);border-radius:2px;' +
        'animation:detBar 2s ease-in-out infinite"></div></div>' +
        '<div style="margin-top:16px;font-size:11px;color:#555">通常需要 30-60 秒</div>' +
        '<style>@keyframes detPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.7}}' +
        '@keyframes detBar{0%{width:10%;margin-left:0}50%{width:40%;margin-left:30%}100%{width:10%;margin-left:90%}}</style>';
    document.body.appendChild(_detLoadingOverlay);

    detectiveState.view = 'loading';
    renderGamesHome();

    var contacts = [];
    detectiveState._selectedContacts.forEach(function(cid) {
        var c = store.contacts.find(function(x) { return x.id === cid; });
        if (c) contacts.push(c);
    });

    var playerCount = contacts.length + 1;
    var playerNames = [(store.user && store.user.name) || '我'];
    contacts.forEach(function(c) { playerNames.push(c.name); });

    // 创建游戏对象
    var game = {
        id: _detGenId(),
        status: 'ongoing',
        createdAt: Date.now(),
        phase: 'intro',
        caseName: '',
        caseEmoji: '',
        setting: '',
        backgroundStory: '',
        victim: null,
        timeline: [],
        roles: [],
        locations: [],
        cluesPool: { round1: [], round2: [] },
        round: 1,
        searchesLeft: 3,
        playerClues: {},
        introductions: [],
        roundtableLog: [],
        crossExamineLog: [],
        closingStatements: [],
        plotEvents: [],
        votes: {},
        finalVotes: {},
        topSuspect: null,
        truthRevealed: false,
        truthNarrative: '',
        playerContacts: contacts.map(function(c) { return { id: c.id, name: c.name }; }),
        userName: playerNames[0],
        _correctGuess: false,
        _chosenName: '',
        _murdererName: ''
    };

    try {
        _currentApiScene = 'detective';

        // ===== 第1次API调用：生成案件框架 =====
        var prompt1 = '你是一位顶级悬疑推理剧本创作大师。请为' + playerCount + '位玩家创作一个完整的侦探推理案件。\n\n' +
            '玩家名字：' + playerNames.join('、') + '\n' +
            '玩家人数：' + playerCount + '（其中随机1人是凶手）\n\n' +
            '要求：\n' +
            '1. 随机选择一个新颖的场景和时代背景（如庄园、列车、校园、邮轮、古堡、酒吧、医院、拍摄片场、深山寺庙、地下赌场、古董拍卖会等，越有创意越好）\n' +
            '2. 创作一个引人入胜的谋杀案件背景故事（200-400字），要有氛围感和悬疑感\n' +
            '3. 设计一个死者（含名字、身份、死因、死亡时间、最后出现场所）\n' +
            '4. 设计案件时间线（4-6个关键时间点）\n' +
            '5. 为每位玩家设计一个角色（恰好' + playerCount + '个角色），每人都有：\n' +
            '   - 角色名（有特色的名字）、公开身份、隐藏的秘密身份\n' +
            '   - 与死者的关系和犯案动机（每个人都要有动机，增加怀疑）\n' +
            '   - 声称的不在场证明 vs 真实行动（不一致）\n' +
            '   - 鲜明的性格特点和说话风格（20字内描述）\n' +
            '   - 身上的可疑痕迹或物证\n' +
            '   - 口头禅或独特的语言习惯（如"哼..."或"怎么可能..."之类）\n' +
            '6. 用murderIndex字段(0-based)指定第几号角色是凶手。凶手需要有凶器和具体作案过程\n' +
            '7. 其他人虽然不是凶手，但都有各自的秘密和可疑之处，不能太容易排除\n' +
            '8. 设计6-8个搜证地点（名字+emoji，与场景相关）\n' +
            '9. 设计两轮线索（每轮6-8条），分布在不同地点：\n' +
            '   - 第一轮：初步线索，有一些干扰项和误导\n' +
            '   - 第二轮：关键线索，认真分析可以锁定凶手\n' +
            '   - 每条线索标注重要度（critical/high/medium/low）\n' +
            '   - 确保有一条完整的证据链可以推理出凶手\n' +
            '10. 设计2-3个剧情事件（搜证时随机触发），每个事件有描述和选项，不同选项带来不同线索\n\n' +
            '请严格按以下JSON格式回复（不要有其他内容）：\n' +
            '{\n' +
            '  "caseName": "案件名称6-12字",\n' +
            '  "caseEmoji": "一个emoji",\n' +
            '  "setting": "场景一句话描述",\n' +
            '  "backgroundStory": "案件背景故事200-400字",\n' +
            '  "timeline": [\n' +
            '    {"time": "时间", "event": "事件描述"}\n' +
            '  ],\n' +
            '  "victim": {\n' +
            '    "name": "死者姓名",\n' +
            '    "identity": "死者身份",\n' +
            '    "causeOfDeath": "死因",\n' +
            '    "timeOfDeath": "死亡时间",\n' +
            '    "lastSeen": "最后出现场所"\n' +
            '  },\n' +
            '  "murderIndex": 0,\n' +
            '  "roles": [\n' +
            '    {\n' +
            '      "name": "角色名",\n' +
            '      "publicIdentity": "公开身份",\n' +
            '      "secretIdentity": "秘密身份50字内",\n' +
            '      "motive": "犯案动机",\n' +
            '      "alibi": "声称的不在场证明",\n' +
            '      "realActivity": "真实行动",\n' +
            '      "personality": "性格和说话风格20字内",\n' +
            '      "catchphrase": "口头禅或语言习惯",\n' +
            '      "secretClue": "身上的可疑痕迹",\n' +
            '      "weapon": "凶器（非凶手留空字符串）"\n' +
            '    }\n' +
            '  ],\n' +
            '  "locations": [\n' +
            '    {"name": "地点名", "emoji": "emoji"}\n' +
            '  ],\n' +
            '  "clues": {\n' +
            '    "round1": [\n' +
            '      {"location": "所在地点名", "description": "线索描述30-60字", "importance": "critical/high/medium/low"}\n' +
            '    ],\n' +
            '    "round2": [\n' +
            '      {"location": "所在地点名", "description": "线索描述30-60字", "importance": "critical/high/medium/low"}\n' +
            '    ]\n' +
            '  },\n' +
            '  "plotEvents": [\n' +
            '    {\n' +
            '      "title": "事件标题",\n' +
            '      "emoji": "emoji",\n' +
            '      "description": "事件描述50-80字",\n' +
            '      "choices": [\n' +
            '        {"text": "选项文本", "result": "选择结果描述", "clue": "获得的线索（可能为空字符串）"}\n' +
            '      ]\n' +
            '    }\n' +
            '  ]\n' +
            '}';

        var data = await API.chatCompletion([
            { role: 'system', content: '你是一个专业的悬疑推理剧本大师。只输出合法JSON，不要有任何额外文字或markdown格式。确保线索链完整，凶手可以被逻辑推理出来。角色数量必须恰好是' + playerCount + '个。' },
            { role: 'user', content: prompt1 }
        ], 0.95, true);

        var text = data.choices[0].message.content || '';
        var result = _detParseJSON(text);

        // 填充游戏数据
        game.caseName = result.caseName || '神秘案件';
        game.caseEmoji = result.caseEmoji || '🔍';
        game.setting = result.setting || '';
        game.backgroundStory = result.backgroundStory || '';
        game.victim = result.victim || { name: '未知', identity: '未知', causeOfDeath: '未知', timeOfDeath: '未知', lastSeen: '未知' };
        game.timeline = (result.timeline || []).map(function(t) {
            return { time: t.time || '', event: t.event || '' };
        });

        var murderIdx = typeof result.murderIndex === 'number' ? result.murderIndex : 0;
        var apiRoles = result.roles || [];

        // 确保角色数量正确
        while (apiRoles.length < playerCount) {
            apiRoles.push({
                name: '神秘人物' + apiRoles.length,
                publicIdentity: '身份不明',
                secretIdentity: '有着不可告人的秘密',
                motive: '不明',
                alibi: '声称当时在休息',
                realActivity: '行踪不明',
                personality: '沉默寡言',
                catchphrase: '...',
                secretClue: '无明显痕迹',
                weapon: ''
            });
        }
        if (murderIdx >= apiRoles.length) murderIdx = 0;

        // 绑定角色到玩家
        game.roles = apiRoles.slice(0, playerCount).map(function(r, i) {
            var isMurderer = (i === murderIdx);
            var contact = i > 0 ? contacts[i - 1] : null;
            return {
                id: 'role_' + i,
                name: r.name || ('角色' + i),
                publicIdentity: r.publicIdentity || '',
                secretIdentity: r.secretIdentity || '',
                isMurderer: isMurderer,
                motive: r.motive || '',
                alibi: r.alibi || '',
                realActivity: r.realActivity || '',
                personality: r.personality || '',
                catchphrase: r.catchphrase || '',
                secretClue: r.secretClue || '',
                weapon: isMurderer ? (r.weapon || '不明凶器') : '',
                isUser: (i === 0),
                contactId: contact ? contact.id : null,
                contactName: i === 0 ? game.userName : (contact ? contact.name : ''),
                contactAvatar: ''
            };
        });

        // 地点
        game.locations = (result.locations || []).map(function(loc, i) {
            return { id: 'loc_' + i, name: loc.name || ('地点' + i), emoji: loc.emoji || '📍', searched: false, searched2: false };
        });
        if (game.locations.length < 4) {
            game.locations.push({ id: 'loc_extra1', name: '走廊', emoji: '🚪', searched: false, searched2: false });
            game.locations.push({ id: 'loc_extra2', name: '花园', emoji: '🌿', searched: false, searched2: false });
        }

        // 线索
        var clues1 = (result.clues && result.clues.round1) || [];
        var clues2 = (result.clues && result.clues.round2) || [];
        game.cluesPool.round1 = clues1.map(function(c, i) {
            return { id: 'c1_' + i, location: c.location || '', description: c.description || '', importance: c.importance || 'medium', foundBy: null };
        });
        game.cluesPool.round2 = clues2.map(function(c, i) {
            return { id: 'c2_' + i, location: c.location || '', description: c.description || '', importance: c.importance || 'medium', foundBy: null };
        });

        // 剧情事件
        game.plotEvents = (result.plotEvents || []).map(function(pe, i) {
            return {
                id: 'pe_' + i,
                title: pe.title || '神秘事件',
                emoji: pe.emoji || '⚡',
                description: pe.description || '',
                choices: (pe.choices || []).map(function(ch) {
                    return { text: ch.text || '调查', result: ch.result || '', clue: ch.clue || '' };
                }),
                triggered: false,
                chosenIndex: -1
            };
        });

        // 初始化每个角色的线索收集
        game.roles.forEach(function(r) { game.playerClues[r.id] = []; });

        // 保存
        detectiveState.games.push(game);
        detectiveState.current = game;
        _detSave();

        // 移除加载弹窗
        var _ol = document.getElementById('det-gen-overlay');
        if (_ol) _ol.remove();

        // 进入案件介绍
        detectiveState.view = 'intro';
        game.phase = 'intro';
        _detSave();
        renderGamesHome();

    } catch (e) {
        // 移除加载弹窗
        var _ol2 = document.getElementById('det-gen-overlay');
        if (_ol2) _ol2.remove();

        console.error('[detective] 案件生成失败:', e);
        if (typeof toast === 'function') toast('案件生成失败，请检查API设置');
        detectiveState.view = 'home';
        renderGamesHome();
    }
}

// ========== 案件序章 ==========
function _detRenderIntro(area) {
    var game = detectiveState.current;
    if (!game) { detectiveState.view = 'home'; renderGamesHome(); return; }

    var v = game.victim || {};

    // 时间线HTML
    var timelineHtml = '';
    if (game.timeline && game.timeline.length > 0) {
        timelineHtml = '<div class="det-timeline-card">' +
            '<div class="det-timeline-title"><i class="fas fa-clock"></i> 案件时间线</div>' +
            '<div class="det-timeline-list">' +
            game.timeline.map(function(t) {
                return '<div class="det-timeline-item">' +
                    '<div class="det-timeline-dot"></div>' +
                    '<div class="det-timeline-time">' + _detEsc(t.time) + '</div>' +
                    '<div class="det-timeline-event">' + _detEsc(t.event) + '</div>' +
                    '</div>';
            }).join('') +
            '</div></div>';
    }

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="detectiveState.view=\'home\'; _detRender();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">' + _detEsc(game.caseName) + '</div>' +
            '<div class="det-nav-right"></div>' +
        '</div>' +
        '<div class="det-scroll">' +
        '<div class="det-intro">' +
            '<div class="det-intro-case-emoji">' + (game.caseEmoji || '🔍') + '</div>' +
            '<div class="det-intro-case-name">' + _detEsc(game.caseName) + '</div>' +
            '<div class="det-intro-setting">' + _detEsc(game.setting) + '</div>' +
            '<div class="det-file-card">' +
                '<div class="det-file-label"><i class="fas fa-book-open"></i> 案件档案</div>' +
                '<div class="det-file-text" id="det-story-text"></div>' +
            '</div>' +
            '<div class="det-victim-card">' +
                '<div class="det-victim-title"><i class="fas fa-skull"></i> 死者信息</div>' +
                '<div class="det-victim-info">' +
                    '<div class="det-victim-row"><div class="det-victim-label">姓名</div><div class="det-victim-value">' + _detEsc(v.name) + '</div></div>' +
                    '<div class="det-victim-row"><div class="det-victim-label">身份</div><div class="det-victim-value">' + _detEsc(v.identity) + '</div></div>' +
                    '<div class="det-victim-row"><div class="det-victim-label">死因</div><div class="det-victim-value">' + _detEsc(v.causeOfDeath) + '</div></div>' +
                    '<div class="det-victim-row"><div class="det-victim-label">时间</div><div class="det-victim-value">' + _detEsc(v.timeOfDeath) + '</div></div>' +
                    '<div class="det-victim-row"><div class="det-victim-label">地点</div><div class="det-victim-value">' + _detEsc(v.lastSeen) + '</div></div>' +
                '</div>' +
            '</div>' +
            timelineHtml +
            '<button class="det-action-btn" onclick="detectiveState.view=\'roleReveal\'; detectiveState.current.phase=\'roleReveal\'; _detSave(); renderGamesHome();">' +
                '<i class="fas fa-mask"></i> 查看你的身份' +
            '</button>' +
        '</div>' +
        '</div></div></div>';

    // 打字机效果
    _detTypewriter(document.getElementById('det-story-text'), game.backgroundStory || '案件详情加载中...');
}

function _detTypewriter(el, text, speed) {
    if (!el) return;
    speed = speed || 30;
    var i = 0;
    el.textContent = '';
    el.classList.add('det-typewriter-cursor');
    // 点击跳过
    var skipHandler = function() {
        clearInterval(timer);
        el.textContent = text;
        el.classList.remove('det-typewriter-cursor');
        el.removeEventListener('click', skipHandler);
    };
    el.addEventListener('click', skipHandler);
    var timer = setInterval(function() {
        if (i < text.length) {
            el.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
            el.classList.remove('det-typewriter-cursor');
            el.removeEventListener('click', skipHandler);
        }
    }, speed);
}

// ========== 角色揭示 ==========
function _detRenderRoleReveal(area) {
    var game = detectiveState.current;
    if (!game) return;

    var myRole = game.roles.find(function(r) { return r.isUser; });
    if (!myRole) myRole = game.roles[0];

    var othersHtml = game.roles.filter(function(r) { return !r.isUser; }).map(function(r) {
        var contact = r.contactId ? store.contacts.find(function(c) { return c.id === r.contactId; }) : null;
        var avatarHtml = contact ? _detGetAvatar(contact) : '👤';
        return '<div class="det-other-item">' +
            '<div class="det-other-avatar">' + avatarHtml + '</div>' +
            '<div class="det-other-info">' +
                '<div class="det-other-name">' + _detEsc(r.name) + '</div>' +
                '<div class="det-other-role">' + _detEsc(r.publicIdentity) + '</div>' +
                '<div class="det-other-player">扮演者：' + _detEsc(r.contactName) + '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    var goalHtml = myRole.isMurderer ?
        '<div class="det-role-goal evil">🔴 你是凶手！隐藏身份，转移怀疑，不要被投出来</div>' :
        '<div class="det-role-goal good">🎯 你是好人！找出隐藏的凶手，投票指认TA</div>';

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="detectiveState.view=\'intro\'; renderGamesHome();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">身份揭示</div>' +
            '<div class="det-nav-right"></div>' +
        '</div>' +
        '<div class="det-scroll">' +
        '<div class="det-role-section">' +
            '<div class="det-role-section-title">🎭 你的角色</div>' +
            '<div class="det-my-role-card' + (myRole.isMurderer ? ' is-murderer' : '') + '">' +
                '<div class="det-role-name">' + _detEsc(myRole.name) + '</div>' +
                '<div class="det-role-public">「' + _detEsc(myRole.publicIdentity) + '」</div>' +
                '<div class="det-role-divider"></div>' +
                '<div class="det-role-field">' +
                    '<div class="det-role-field-label">⚠️ 你的秘密</div>' +
                    '<div class="det-role-field-value">' + _detEsc(myRole.secretIdentity) + '</div>' +
                '</div>' +
                '<div class="det-role-field">' +
                    '<div class="det-role-field-label">📍 你对外声称</div>' +
                    '<div class="det-role-field-value">' + _detEsc(myRole.alibi) + '</div>' +
                '</div>' +
                '<div class="det-role-field">' +
                    '<div class="det-role-field-label">🔒 你的真实行动</div>' +
                    '<div class="det-role-field-value">' + _detEsc(myRole.realActivity) + '</div>' +
                '</div>' +
                (myRole.isMurderer ? '<div class="det-role-field"><div class="det-role-field-label">🗡️ 你的凶器</div><div class="det-role-field-value">' + _detEsc(myRole.weapon) + '</div></div>' : '') +
                '<div class="det-role-field">' +
                    '<div class="det-role-field-label">💭 你的动机</div>' +
                    '<div class="det-role-field-value">' + _detEsc(myRole.motive) + '</div>' +
                '</div>' +
                goalHtml +
            '</div>' +
            '<div class="det-role-section-title" style="margin-top:20px;">📢 所有人的公开身份</div>' +
            '<div class="det-others-list">' + othersHtml + '</div>' +
            '<button class="det-action-btn" onclick="_detGoToIntroduce();">' +
                '<i class="fas fa-microphone"></i> 进入自我介绍' +
            '</button>' +
        '</div>' +
        '</div></div></div>';
}

// ========== 自我介绍环节（新增） ==========
function _detGoToIntroduce() {
    var game = detectiveState.current;
    game.introductions = [];
    detectiveState._introIndex = 0;
    detectiveState.view = 'introduce';
    game.phase = 'introduce';
    _detSave();
    renderGamesHome();
    // 开始AI角色自我介绍
    _detStartIntroductions(game);
}

async function _detStartIntroductions(game) {
    var container = document.getElementById('det-intro-messages');
    if (!container) return;

    for (var i = 0; i < game.roles.length; i++) {
        var role = game.roles[i];
        if (role.isUser) {
            // 用户需要自己介绍 — 显示输入框提示
            var promptEl = document.getElementById('det-intro-user-prompt');
            if (promptEl) promptEl.style.display = 'block';
            // 等待用户输入后继续
            return;
        }

        // 显示"正在思考"
        container.innerHTML += '<div class="det-thinking" id="det-intro-thinking-' + role.id + '">' +
            '<span>' + _detEsc(role.name) + ' 正在准备自我介绍</span>' +
            '<span class="det-thinking-dots"><span>.</span><span>.</span><span>.</span></span>' +
            '</div>';
        container.scrollTop = container.scrollHeight;

        try {
            var intro = await _detGenerateIntroduction(game, role);
            var thinkEl = document.getElementById('det-intro-thinking-' + role.id);
            if (thinkEl) thinkEl.remove();

            game.introductions.push({ roleId: role.id, text: intro });
            _detSave();

            container = document.getElementById('det-intro-messages');
            if (container) {
                container.innerHTML += _detRenderIntroBubble(game, role, intro);
                container.scrollTop = container.scrollHeight;
            }
        } catch (e) {
            console.error('[detective] 自我介绍生成失败:', e);
            var thinkEl2 = document.getElementById('det-intro-thinking-' + role.id);
            if (thinkEl2) thinkEl2.remove();
            var fallback = '（' + role.name + '微微点头）大家好，我是' + role.publicIdentity + '。';
            game.introductions.push({ roleId: role.id, text: fallback });
            _detSave();
            container = document.getElementById('det-intro-messages');
            if (container) {
                container.innerHTML += _detRenderIntroBubble(game, role, fallback);
                container.scrollTop = container.scrollHeight;
            }
        }

        await new Promise(function(r) { setTimeout(r, 600); });
    }

    // 所有人都介绍完了，显示继续按钮
    var nextBtn = document.getElementById('det-intro-next-btn');
    if (nextBtn) nextBtn.style.display = 'block';
}

async function _detGenerateIntroduction(game, role) {
    _currentApiScene = 'detective';
    var prompt = '你正在参与一个侦探推理游戏。现在是自我介绍环节。\n\n' +
        '案件：' + game.caseName + '\n' +
        '死者：' + game.victim.name + '（' + game.victim.identity + '）\n\n' +
        '你的角色信息：\n' +
        '姓名：' + role.name + '\n' +
        '公开身份：' + role.publicIdentity + '\n' +
        '秘密身份：' + role.secretIdentity + '\n' +
        '性格：' + role.personality + '\n' +
        '口头禅：' + role.catchphrase + '\n' +
        '不在场证明：' + role.alibi + '\n' +
        (role.isMurderer ?
            '⚠️ 你是凶手！介绍要看似真诚但有1个不易察觉的矛盾。\n' :
            '你不是凶手。用公开身份做自然的自我介绍。\n') +
        '\n请以第一人称做自我介绍（60-100字）：\n' +
        '1. 介绍你的公开身份和与死者的关系\n' +
        '2. 简要声明你的不在场证明\n' +
        '3. 表达对案件的态度\n' +
        '4. 完全符合你的性格特点，使用你的口头禅\n' +
        '\n直接输出自我介绍文本，不要JSON格式。';

    var data = await API.chatCompletion([
        { role: 'system', content: '你是角色扮演大师。直接输出角色的自我介绍文本，不要任何额外格式。完全沉浸在角色中。' },
        { role: 'user', content: prompt }
    ], 0.85, true);

    return (data.choices[0].message.content || '').trim();
}

function _detRenderIntroBubble(game, role, text) {
    var contact = role.contactId ? store.contacts.find(function(c) { return c.id === role.contactId; }) : null;
    var avatarHtml = role.isUser ? _detGetUserAvatar() : (contact ? _detGetAvatar(contact) : '👤');

    return '<div class="det-intro-bubble' + (role.isUser ? ' is-user' : '') + '">' +
        '<div class="det-intro-bubble-header">' +
            '<div class="det-intro-bubble-avatar">' + avatarHtml + '</div>' +
            '<div class="det-intro-bubble-info">' +
                '<div class="det-intro-bubble-name">' + _detEsc(role.name) + '</div>' +
                '<div class="det-intro-bubble-identity">「' + _detEsc(role.publicIdentity) + '」</div>' +
            '</div>' +
        '</div>' +
        '<div class="det-intro-bubble-text">' + _detEsc(text) + '</div>' +
    '</div>';
}

function _detRenderIntroduce(area) {
    var game = detectiveState.current;
    if (!game) return;

    var messagesHtml = game.introductions.map(function(entry) {
        var role = game.roles.find(function(r) { return r.id === entry.roleId; });
        if (!role) return '';
        return _detRenderIntroBubble(game, role, entry.text);
    }).join('');

    // 检查用户是否已经介绍过
    var myRole = game.roles.find(function(r) { return r.isUser; });
    var userIntroduced = game.introductions.some(function(e) { return e.roleId === myRole.id; });
    var allDone = game.introductions.length >= game.roles.length;

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="detectiveState.view=\'roleReveal\'; renderGamesHome();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">📢 自我介绍</div>' +
            '<div class="det-nav-right"></div>' +
        '</div>' +
        '<div class="det-roundtable">' +
            '<div class="det-roundtable-title">各位请依次表明身份</div>' +
            '<div id="det-intro-messages" class="det-messages-container">' + messagesHtml + '</div>' +
            '<div class="det-input-area" id="det-intro-user-prompt" style="' + (userIntroduced ? 'display:none;' : '') + '">' +
                '<div style="color:#333; font-size:12px; margin-bottom:8px; text-align:center;">轮到你了！以「' + _detEsc(myRole.name) + '」的身份做自我介绍</div>' +
                '<input class="det-input-field" id="det-intro-user-input" placeholder="以角色身份介绍自己..." />' +
                '<button class="det-input-send" onclick="detUserIntroduce();"><i class="fas fa-paper-plane"></i></button>' +
            '</div>' +
            '<button class="det-action-btn" id="det-intro-next-btn" style="margin-top:16px; ' + (allDone ? '' : 'display:none;') + '" onclick="_detGoToSearch();">' +
                '<i class="fas fa-magnifying-glass"></i> 开始第一轮搜证' +
            '</button>' +
        '</div>' +
        '</div></div>';
}

async function detUserIntroduce() {
    var input = document.getElementById('det-intro-user-input');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    input.value = '';

    var game = detectiveState.current;
    var myRole = game.roles.find(function(r) { return r.isUser; });

    game.introductions.push({ roleId: myRole.id, text: text });
    _detSave();

    var container = document.getElementById('det-intro-messages');
    if (container) {
        container.innerHTML += _detRenderIntroBubble(game, myRole, text);
        container.scrollTop = container.scrollHeight;
    }

    // 隐藏输入框
    var promptEl = document.getElementById('det-intro-user-prompt');
    if (promptEl) promptEl.style.display = 'none';

    // 继续剩下的AI角色介绍
    await _detContinueIntroductions(game);
}

async function _detContinueIntroductions(game) {
    var container = document.getElementById('det-intro-messages');
    if (!container) return;

    var doneIds = game.introductions.map(function(e) { return e.roleId; });

    for (var i = 0; i < game.roles.length; i++) {
        var role = game.roles[i];
        if (doneIds.indexOf(role.id) >= 0) continue;
        if (role.isUser) continue;

        container.innerHTML += '<div class="det-thinking" id="det-intro-thinking-' + role.id + '">' +
            '<span>' + _detEsc(role.name) + ' 正在准备自我介绍</span>' +
            '<span class="det-thinking-dots"><span>.</span><span>.</span><span>.</span></span>' +
            '</div>';
        container.scrollTop = container.scrollHeight;

        try {
            var intro = await _detGenerateIntroduction(game, role);
            var thinkEl = document.getElementById('det-intro-thinking-' + role.id);
            if (thinkEl) thinkEl.remove();
            game.introductions.push({ roleId: role.id, text: intro });
            _detSave();
            container = document.getElementById('det-intro-messages');
            if (container) {
                container.innerHTML += _detRenderIntroBubble(game, role, intro);
                container.scrollTop = container.scrollHeight;
            }
        } catch (e) {
            console.error('[detective] 介绍生成失败:', e);
            var thinkEl2 = document.getElementById('det-intro-thinking-' + role.id);
            if (thinkEl2) thinkEl2.remove();
            var fb = '（' + role.name + '点了点头）我是' + role.publicIdentity + '。';
            game.introductions.push({ roleId: role.id, text: fb });
            _detSave();
            container = document.getElementById('det-intro-messages');
            if (container) {
                container.innerHTML += _detRenderIntroBubble(game, role, fb);
                container.scrollTop = container.scrollHeight;
            }
        }

        await new Promise(function(r) { setTimeout(r, 600); });
    }

    // 显示继续按钮
    var nextBtn = document.getElementById('det-intro-next-btn');
    if (nextBtn) nextBtn.style.display = 'block';
}

// ========== 搜证环节 ==========
function _detGoToSearch() {
    var game = detectiveState.current;
    game.searchesLeft = 3;
    if (game.round === 1) {
        detectiveState.view = 'search';
        game.phase = 'search';
    } else {
        detectiveState.view = 'search2';
        game.phase = 'search2';
    }
    // AI 自动搜证
    _detAISearch(game);
    _detSave();
    renderGamesHome();
}

function _detRenderSearch(area) {
    var game = detectiveState.current;
    if (!game) return;
    var isRound2 = (game.round === 2);
    var searchedKey = isRound2 ? 'searched2' : 'searched';

    var locsHtml = game.locations.map(function(loc) {
        var isSearched = loc[searchedKey];
        return '<div class="det-loc-item' + (isSearched ? ' searched' : '') + '" onclick="detSearchLocation(\'' + loc.id + '\')">' +
            '<div class="det-loc-emoji">' + (loc.emoji || '📍') + '</div>' +
            '<div class="det-loc-name">' + _detEsc(loc.name) + '</div>' +
            (isSearched ? '<div class="det-loc-badge">已搜</div>' : '') +
        '</div>';
    }).join('');

    // 已收集的线索
    var myRole = game.roles.find(function(r) { return r.isUser; });
    var myClueIds = game.playerClues[myRole.id] || [];
    var pool = isRound2 ? game.cluesPool.round2 : game.cluesPool.round1;
    var myClues = myClueIds.map(function(cid) {
        var found = pool.find(function(c) { return c.id === cid; });
        if (!found) {
            // 也检查另一个池
            var otherPool = isRound2 ? game.cluesPool.round1 : game.cluesPool.round2;
            found = otherPool.find(function(c) { return c.id === cid; });
        }
        return found;
    }).filter(Boolean);

    // 也加上剧情事件获得的线索
    var eventClues = [];
    (game.plotEvents || []).forEach(function(pe) {
        if (pe.triggered && pe.chosenIndex >= 0 && pe.choices[pe.chosenIndex] && pe.choices[pe.chosenIndex].clue) {
            eventClues.push({ description: pe.choices[pe.chosenIndex].clue, importance: 'high', location: '📌 ' + pe.title });
        }
    });

    var allMyClues = myClues.concat(eventClues);

    var cluesHtml = allMyClues.length === 0 ?
        '<div class="det-no-clues">还没有发现任何线索，选择地点开始搜证</div>' :
        allMyClues.map(function(c) {
            var stars = c.importance === 'critical' ? '⭐⭐⭐' : c.importance === 'high' ? '⭐⭐' : c.importance === 'medium' ? '⭐' : '';
            return '<div class="det-clue-card" data-importance="' + c.importance + '">' +
                _detEsc(c.description) +
                '<div class="det-clue-location">📍 ' + _detEsc(c.location) + '</div>' +
                (stars ? '<div class="det-clue-stars">' + stars + '</div>' : '') +
            '</div>';
        }).join('');

    var canProceed = game.searchesLeft <= 0;

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="detectiveState.view=\'roleReveal\'; renderGamesHome();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">🔍 第' + game.round + '轮搜证</div>' +
            '<div class="det-nav-right"></div>' +
        '</div>' +
        '<div class="det-scroll">' +
        '<div class="det-search-page">' +
            '<div class="det-search-header">' +
                '<div class="det-search-round">选择搜查地点</div>' +
                '<div class="det-search-remain">剩余 <span>' + game.searchesLeft + '</span> 次</div>' +
            '</div>' +
            '<div class="det-locations">' + locsHtml + '</div>' +
            '<div id="det-search-result"></div>' +
            '<div class="det-collected-section">' +
                '<div class="det-collected-title">📋 已收集线索（' + allMyClues.length + '）</div>' +
                cluesHtml +
            '</div>' +
            (canProceed ?
                '<button class="det-action-btn" onclick="_detCheckPlotEvent();">' +
                    '<i class="fas fa-comments"></i> 继续' +
                '</button>' : '') +
        '</div>' +
        '</div></div></div>';
}

function detSearchLocation(locId) {
    var game = detectiveState.current;
    if (!game || game.searchesLeft <= 0) return;

    var isRound2 = (game.round === 2);
    var searchedKey = isRound2 ? 'searched2' : 'searched';
    var loc = game.locations.find(function(l) { return l.id === locId; });
    if (!loc || loc[searchedKey]) return;

    loc[searchedKey] = true;
    game.searchesLeft--;

    // 搜索该地点的线索
    var pool = isRound2 ? game.cluesPool.round2 : game.cluesPool.round1;
    var locClues = pool.filter(function(c) { return c.location === loc.name && !c.foundBy; });
    var found = [];
    locClues.forEach(function(c) {
        var chance = c.importance === 'critical' ? 0.9 : c.importance === 'high' ? 0.75 : c.importance === 'medium' ? 0.6 : 0.4;
        if (Math.random() < chance) {
            c.foundBy = 'user';
            found.push(c);
            var myRole = game.roles.find(function(r) { return r.isUser; });
            game.playerClues[myRole.id].push(c.id);
        }
    });

    _detSave();

    // 显示搜索结果
    var resultEl = document.getElementById('det-search-result');
    if (resultEl) {
        if (found.length === 0) {
            resultEl.innerHTML = '<div class="det-search-result-card empty">' +
                '<div class="det-search-result-icon">🔎</div>' +
                '<div>' + _detEsc(loc.name) + '没有发现有价值的线索</div>' +
                '</div>';
        } else {
            resultEl.innerHTML = found.map(function(c) {
                return '<div class="det-search-result-card found">' +
                    '<div class="det-search-result-icon">✨</div>' +
                    '<div><strong>发现线索！</strong><br>' + _detEsc(c.description) + '</div>' +
                '</div>';
            }).join('');
        }
    }

    setTimeout(function() { renderGamesHome(); }, 1800);
}

// AI 角色自动搜证
function _detAISearch(game) {
    var isRound2 = (game.round === 2);
    var pool = isRound2 ? game.cluesPool.round2 : game.cluesPool.round1;

    game.roles.forEach(function(role) {
        if (role.isUser) return;
        var numSearches = 2 + Math.floor(Math.random() * 2);
        var availableClues = pool.filter(function(c) { return !c.foundBy; });
        for (var i = 0; i < numSearches && availableClues.length > 0; i++) {
            var idx = Math.floor(Math.random() * availableClues.length);
            var clue = availableClues[idx];
            var chance = clue.importance === 'critical' ? 0.5 : clue.importance === 'high' ? 0.6 : 0.7;
            if (role.isMurderer && (clue.importance === 'critical' || clue.importance === 'high')) {
                chance = 0.2;
            }
            if (Math.random() < chance) {
                clue.foundBy = role.id;
                game.playerClues[role.id].push(clue.id);
                availableClues.splice(idx, 1);
            }
        }
    });
}

// ========== 剧情事件（新增） ==========
function _detCheckPlotEvent() {
    var game = detectiveState.current;
    var isRound2 = (game.round === 2);

    // 查找未触发的剧情事件
    var availableEvents = (game.plotEvents || []).filter(function(pe) { return !pe.triggered; });

    if (availableEvents.length > 0 && Math.random() < 0.7) {
        // 触发一个事件
        var event = availableEvents[Math.floor(Math.random() * availableEvents.length)];
        game._currentPlotEvent = event.id;
        detectiveState.view = isRound2 ? 'plotEvent2' : 'plotEvent';
        game.phase = detectiveState.view;
        _detSave();
        renderGamesHome();
    } else {
        // 直接进入复盘
        _detGoToRoundtable();
    }
}

function _detRenderPlotEvent(area) {
    var game = detectiveState.current;
    if (!game) return;

    var eventId = game._currentPlotEvent;
    var event = (game.plotEvents || []).find(function(pe) { return pe.id === eventId; });
    if (!event) { _detGoToRoundtable(); return; }

    var choicesHtml = event.choices.map(function(ch, idx) {
        return '<button class="det-plot-choice" onclick="detChoosePlotEvent(\'' + eventId + '\', ' + idx + ');">' +
            '<span class="det-plot-choice-icon">▸</span> ' + _detEsc(ch.text) +
        '</button>';
    }).join('');

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="renderGamesHome();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">⚡ 突发事件</div>' +
            '<div class="det-nav-right"></div>' +
        '</div>' +
        '<div class="det-scroll">' +
        '<div class="det-plot-page">' +
            '<div class="det-plot-event-card">' +
                '<div class="det-plot-emoji">' + (event.emoji || '⚡') + '</div>' +
                '<div class="det-plot-title">' + _detEsc(event.title) + '</div>' +
                '<div class="det-plot-desc">' + _detEsc(event.description) + '</div>' +
            '</div>' +
            '<div class="det-plot-choices-title">你选择...</div>' +
            '<div class="det-plot-choices">' + choicesHtml + '</div>' +
        '</div>' +
        '</div></div></div>';
}

function detChoosePlotEvent(eventId, choiceIdx) {
    var game = detectiveState.current;
    var event = (game.plotEvents || []).find(function(pe) { return pe.id === eventId; });
    if (!event) return;

    event.triggered = true;
    event.chosenIndex = choiceIdx;
    var choice = event.choices[choiceIdx];

    _detSave();

    // 显示结果
    var area = document.querySelector('.det-plot-choices');
    if (area) {
        area.innerHTML = '<div class="det-plot-result">' +
            '<div class="det-plot-result-title">📋 结果</div>' +
            '<div class="det-plot-result-text">' + _detEsc(choice.result) + '</div>' +
            (choice.clue ? '<div class="det-plot-result-clue">💡 获得线索：' + _detEsc(choice.clue) + '</div>' : '') +
        '</div>' +
        '<button class="det-action-btn" style="margin-top:16px;" onclick="_detGoToRoundtable();">' +
            '<i class="fas fa-comments"></i> 进入复盘讨论' +
        '</button>';
    }
}

// ========== 复盘讨论 ==========
function _detGoToRoundtable() {
    var game = detectiveState.current;
    if (game.round === 1) {
        detectiveState.view = 'roundtable';
        game.phase = 'roundtable';
    } else {
        detectiveState.view = 'roundtable2';
        game.phase = 'roundtable2';
    }
    game.roundtableLog = game.roundtableLog || [];
    _detSave();
    _detStartRoundtable(game);
}

async function _detStartRoundtable(game) {
    renderGamesHome();

    for (var i = 0; i < game.roles.length; i++) {
        var role = game.roles[i];
        if (role.isUser) continue;

        var container = document.getElementById('det-roundtable-messages');
        if (container) {
            container.innerHTML += '<div class="det-thinking" id="det-thinking-' + role.id + '">' +
                '<span>' + _detEsc(role.name) + ' 正在思考</span>' +
                '<span class="det-thinking-dots"><span>.</span><span>.</span><span>.</span></span>' +
            '</div>';
            container.scrollTop = container.scrollHeight;
        }

        try {
            var speech = await _detGenerateSpeech(game, role);
            var thinkEl = document.getElementById('det-thinking-' + role.id);
            if (thinkEl) thinkEl.remove();
            game.roundtableLog.push({
                roleId: role.id,
                text: speech.speech || '',
                cluesShown: speech.cluesShown || []
            });
            _detSave();
            container = document.getElementById('det-roundtable-messages');
            if (container) {
                container.innerHTML += _detRenderSpeechBubble(game, role, speech);
                container.scrollTop = container.scrollHeight;
            }
        } catch (e) {
            console.error('[detective] 发言生成失败:', e);
            var thinkEl2 = document.getElementById('det-thinking-' + role.id);
            if (thinkEl2) thinkEl2.remove();
            game.roundtableLog.push({
                roleId: role.id,
                text: '（' + role.name + '沉默了一会儿）我...暂时没什么想说的。',
                cluesShown: []
            });
            _detSave();
            container = document.getElementById('det-roundtable-messages');
            if (container) {
                container.innerHTML += _detRenderSpeechBubble(game, role, { speech: '（沉默）我暂时没什么想说的。', cluesShown: [] });
                container.scrollTop = container.scrollHeight;
            }
        }

        await new Promise(function(r) { setTimeout(r, 500); });
    }
}

async function _detGenerateSpeech(game, role) {
    _currentApiScene = 'detective';
    var isRound2 = (game.round === 2);
    var pool = isRound2 ? game.cluesPool.round2 : game.cluesPool.round1;
    var myClueIds = game.playerClues[role.id] || [];
    var myClues = myClueIds.map(function(cid) {
        return pool.find(function(c) { return c.id === cid; });
    }).filter(Boolean);

    var prevSpeech = game.roundtableLog.slice(-8).map(function(entry) {
        var r = game.roles.find(function(x) { return x.id === entry.roleId; });
        return (r ? r.name : '???') + '说：' + entry.text;
    }).join('\n');

    var prompt = '你正在参与一个侦探推理游戏的第' + game.round + '轮复盘讨论。\n\n' +
        '案件：' + game.caseName + '\n' +
        '死者：' + game.victim.name + '（' + game.victim.identity + '），死因：' + game.victim.causeOfDeath + '\n\n' +
        '===== 你的角色信息 =====\n' +
        '姓名：' + role.name + '\n' +
        '公开身份：' + role.publicIdentity + '\n' +
        '秘密身份：' + role.secretIdentity + '\n' +
        '性格：' + role.personality + '\n' +
        '口头禅：' + role.catchphrase + '\n' +
        (role.isMurderer ?
            '⚠️ 你是凶手！你用' + role.weapon + '杀害了死者。你需要巧妙掩饰自己的罪行，转移怀疑到其他人身上。不要太刻意，要自然。偶尔可以主动提出一些误导性的推理。\n' :
            '你不是凶手。你有自己的秘密（' + role.secretIdentity + '）要隐藏，但你也想找出真凶。\n') +
        '你声称的不在场证明：' + role.alibi + '\n' +
        '你实际做的事：' + role.realActivity + '\n\n' +
        '===== 你找到的线索 =====\n' +
        (myClues.length > 0 ? myClues.map(function(c) { return '- [' + c.location + '] ' + c.description; }).join('\n') : '没有找到线索') + '\n\n' +
        (prevSpeech ? '===== 之前的发言 =====\n' + prevSpeech + '\n\n' : '') +
        '请以你的角色身份发言（60-120字）。要求：\n' +
        '1. 选择性地展示你找到的线索（可以不全部展示）\n' +
        '2. 如果有人之前发言了，要对他们的发言做出回应或质疑\n' +
        '3. 完全符合你的性格特点和说话风格，使用你的口头禅\n' +
        (role.isMurderer ? '4. 巧妙转移怀疑，可以适度攻击其他可疑的人\n' : '4. 表达你的推理和怀疑方向\n') +
        '\n请严格按JSON格式回复：{"speech": "你的发言内容", "cluesShown": ["你展示的线索描述（原文）"]}';

    var data = await API.chatCompletion([
        { role: 'system', content: '你是角色扮演大师。只输出合法JSON，不要有任何额外内容。完全沉浸在角色中。' },
        { role: 'user', content: prompt }
    ], 0.85, true);

    return _detParseJSON(data.choices[0].message.content);
}

function _detRenderSpeechBubble(game, role, speech) {
    var contact = role.contactId ? store.contacts.find(function(c) { return c.id === role.contactId; }) : null;
    var avatarHtml = role.isUser ? _detGetUserAvatar() : (contact ? _detGetAvatar(contact) : '👤');
    var clueTagsHtml = (speech.cluesShown || []).map(function(cs) {
        return '<span class="det-speech-clue-tag">📎 ' + _detEsc(cs).substring(0, 40) + '</span>';
    }).join('');

    return '<div class="det-speech-bubble' + (role.isUser ? ' is-user' : '') + '">' +
        '<div class="det-speech-header">' +
            '<div class="det-speech-avatar">' + avatarHtml + '</div>' +
            '<div class="det-speech-name">' + _detEsc(role.name) +
                '<span class="det-speech-player">（' + _detEsc(role.contactName) + '）</span>' +
            '</div>' +
        '</div>' +
        '<div class="det-speech-content">' + _detEsc(speech.speech || '') + '</div>' +
        (clueTagsHtml ? '<div class="det-speech-clues">' + clueTagsHtml + '</div>' : '') +
    '</div>';
}

function _detRenderRoundtable(area) {
    var game = detectiveState.current;
    if (!game) return;
    var isRound2 = (game.round === 2);

    var messagesHtml = game.roundtableLog.map(function(entry) {
        var role = game.roles.find(function(r) { return r.id === entry.roleId; });
        if (!role) return '';
        return _detRenderSpeechBubble(game, role, { speech: entry.text, cluesShown: entry.cluesShown });
    }).join('');

    var nextPhase = isRound2 ? 'closingStatement' : 'vote';
    var nextLabel = isRound2 ? '📜 进入最后陈词' : '🗳️ 进入侦探投票';
    var nextIcon = isRound2 ? 'scroll' : 'vote-yea';

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="renderGamesHome();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">💬 第' + game.round + '轮复盘</div>' +
            '<div class="det-nav-right"><div onclick="_detShowCluesPanel()" style="cursor:pointer;font-size:13px;color:#666;">📋 线索</div></div>' +
        '</div>' +
        '<div class="det-roundtable">' +
            '<div class="det-roundtable-title">圆桌复盘讨论</div>' +
            '<div id="det-roundtable-messages" class="det-messages-container">' + messagesHtml + '</div>' +
            '<div class="det-input-area">' +
                '<input class="det-input-field" id="det-user-input" placeholder="输入你的推理或质疑..." />' +
                '<button class="det-input-send" onclick="detUserSpeak();"><i class="fas fa-paper-plane"></i></button>' +
            '</div>' +
            '<button class="det-action-btn" style="margin-top:16px;" onclick="_detGoToNextFromRoundtable(\'' + nextPhase + '\');">' +
                '<i class="fas fa-' + nextIcon + '"></i> ' + nextLabel +
            '</button>' +
        '</div>' +
        '</div></div>';
}

function _detGoToNextFromRoundtable(nextPhase) {
    var game = detectiveState.current;
    detectiveState.view = nextPhase;
    game.phase = nextPhase;
    _detSave();
    renderGamesHome();
}

// 用户发言
async function detUserSpeak() {
    var input = document.getElementById('det-user-input');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    input.value = '';

    var game = detectiveState.current;
    var myRole = game.roles.find(function(r) { return r.isUser; });

    game.roundtableLog.push({ roleId: myRole.id, text: text, cluesShown: [] });
    _detSave();

    var container = document.getElementById('det-roundtable-messages');
    if (container) {
        container.innerHTML += _detRenderSpeechBubble(game, myRole, { speech: text, cluesShown: [] });
        container.scrollTop = container.scrollHeight;
    }

    // 检测是否质疑了某个人
    var targetRole = null;
    game.roles.forEach(function(r) {
        if (!r.isUser && text.indexOf(r.name) >= 0) {
            targetRole = r;
        }
    });

    if (targetRole) {
        container = document.getElementById('det-roundtable-messages');
        if (container) {
            container.innerHTML += '<div class="det-thinking" id="det-respond-thinking">' +
                '<span>' + _detEsc(targetRole.name) + ' 正在回应</span>' +
                '<span class="det-thinking-dots"><span>.</span><span>.</span><span>.</span></span>' +
            '</div>';
            container.scrollTop = container.scrollHeight;
        }

        try {
            var response = await _detGenerateResponse(game, targetRole, text);
            var thinkEl = document.getElementById('det-respond-thinking');
            if (thinkEl) thinkEl.remove();
            game.roundtableLog.push({ roleId: targetRole.id, text: response, cluesShown: [] });
            _detSave();
            container = document.getElementById('det-roundtable-messages');
            if (container) {
                container.innerHTML += _detRenderSpeechBubble(game, targetRole, { speech: response, cluesShown: [] });
                container.scrollTop = container.scrollHeight;
            }
        } catch (e) {
            var thinkEl2 = document.getElementById('det-respond-thinking');
            if (thinkEl2) thinkEl2.remove();
            console.error('[detective] 回应失败:', e);
        }
    }
}

async function _detGenerateResponse(game, targetRole, question) {
    _currentApiScene = 'detective';
    var prompt = '你是' + targetRole.name + '（' + targetRole.publicIdentity + '）。\n' +
        '秘密身份：' + targetRole.secretIdentity + '\n' +
        '性格：' + targetRole.personality + '\n' +
        '口头禅：' + targetRole.catchphrase + '\n' +
        (targetRole.isMurderer ? '你是凶手，用' + targetRole.weapon + '作案。要巧妙回避关键问题，但不能明显撒谎。\n' : '你不是凶手，但你有秘密（' + targetRole.secretIdentity + '）。\n') +
        '你的不在场证明：' + targetRole.alibi + '\n' +
        '你实际做的事：' + targetRole.realActivity + '\n\n' +
        '有人这样说：「' + question + '」\n\n' +
        '请用1-3句话回应（40-80字），完全符合你的性格。使用你的口头禅。' +
        (targetRole.isMurderer ? '回避关键问题，但不要明显撒谎。可以反问或转移话题。' : '如果被冤枉可以表达不满，也可以适当透露一些信息自证。');

    var data = await API.chatCompletion([
        { role: 'system', content: '你是角色扮演大师。只输出纯文本回复内容，不要JSON，不要引号，不要角色名前缀。' },
        { role: 'user', content: prompt }
    ], 0.85, true);

    return (data.choices[0].message.content || '').trim();
}

// ========== 投票环节 ==========
function _detRenderVote(area, isFinal) {
    var game = detectiveState.current;
    if (!game) return;

    var voteMap = isFinal ? (game.finalVotes || {}) : (game.votes || {});
    var myRole = game.roles.find(function(r) { return r.isUser; });
    var myVote = voteMap[myRole.id] || null;

    var voteCounts = {};
    game.roles.forEach(function(r) { voteCounts[r.id] = 0; });
    Object.keys(voteMap).forEach(function(voterId) {
        var targetId = voteMap[voterId];
        if (voteCounts[targetId] !== undefined) voteCounts[targetId]++;
    });

    var listHtml = game.roles.filter(function(r) { return !r.isUser; }).map(function(r) {
        var contact = r.contactId ? store.contacts.find(function(c) { return c.id === r.contactId; }) : null;
        var avatarHtml = contact ? _detGetAvatar(contact) : '👤';
        var isSelected = (myVote === r.id);
        var count = voteCounts[r.id] || 0;
        return '<div class="det-vote-item' + (isSelected ? ' selected' : '') + '" onclick="detCastVote(\'' + r.id + '\', ' + isFinal + ')">' +
            '<div class="det-vote-avatar">' + avatarHtml + '</div>' +
            '<div class="det-vote-info">' +
                '<div class="det-vote-name">' + _detEsc(r.name) + '</div>' +
                '<div class="det-vote-identity">' + _detEsc(r.publicIdentity) + '</div>' +
            '</div>' +
            '<div class="det-vote-count">' + (count > 0 ? count + '票' : '') + '</div>' +
        '</div>';
    }).join('');

    var title = isFinal ? '⚖️ 最终裁决' : '🗳️ 侦探投票';
    var subtitle = isFinal ? '所有证据已收集完毕，请投出决定性的一票' : '初步投票不会淘汰任何人，最高票者需要额外自辩';

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="renderGamesHome();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">' + title + '</div>' +
            '<div class="det-nav-right"><div onclick="_detShowCluesPanel()" style="cursor:pointer;font-size:13px;color:#666;">📋 线索</div></div>' +
        '</div>' +
        '<div class="det-scroll">' +
        '<div class="det-vote-page">' +
            '<div class="det-vote-title">' + title + '</div>' +
            '<div class="det-vote-subtitle">' + subtitle + '</div>' +
            '<div class="det-vote-list">' + listHtml + '</div>' +
            '<button class="det-vote-confirm" ' + (myVote ? '' : 'disabled') + ' onclick="detConfirmVote(' + isFinal + ');">' +
                '🔒 确认投票' +
            '</button>' +
        '</div>' +
        '</div></div></div>';
}

function detCastVote(targetId, isFinal) {
    var game = detectiveState.current;
    var myRole = game.roles.find(function(r) { return r.isUser; });
    if (isFinal) {
        game.finalVotes[myRole.id] = targetId;
    } else {
        game.votes[myRole.id] = targetId;
    }
    _detSave();
    renderGamesHome();
}

async function detConfirmVote(isFinal) {
    var game = detectiveState.current;

    // AI 角色智能投票 — 通过API
    detectiveState.view = 'loading';
    renderGamesHome();

    try {
        _currentApiScene = 'detective';
        var rolesInfo = game.roles.map(function(r) {
            return r.name + '（' + r.publicIdentity + '）';
        }).join('、');

        var discussionSummary = game.roundtableLog.slice(-10).map(function(e) {
            var r = game.roles.find(function(x) { return x.id === e.roleId; });
            return (r ? r.name : '?') + '：' + e.text;
        }).join('\n');

        var prompt = '侦探推理游戏中，现在是' + (isFinal ? '最终投票' : '初次投票') + '环节。\n\n' +
            '案件：' + game.caseName + '\n' +
            '参与角色：' + rolesInfo + '\n\n' +
            '讨论摘要：\n' + discussionSummary + '\n\n' +
            '请为以下每个AI角色决定投票目标（不能投自己，必须投其他角色）：\n';

        game.roles.forEach(function(role) {
            if (role.isUser) return;
            var voteMap = isFinal ? game.finalVotes : game.votes;
            if (voteMap[role.id]) return;

            prompt += '\n' + role.name + '（' + (role.isMurderer ? '凶手，需要误导投票' : '无辜者，想找出凶手') + '）：\n' +
                '- 性格：' + role.personality + '\n' +
                '- 找到的线索数：' + (game.playerClues[role.id] || []).length + '\n';
        });

        prompt += '\n请用JSON格式回复每个角色的投票：{"votes": {"角色名": "投票目标角色名"}}';

        var data = await API.chatCompletion([
            { role: 'system', content: '你是推理游戏裁判。根据讨论内容和角色立场决定投票。只输出合法JSON。' },
            { role: 'user', content: prompt }
        ], 0.8, true);

        var result = _detParseJSON(data.choices[0].message.content);
        var aiVotes = result.votes || {};

        // 应用AI投票
        game.roles.forEach(function(role) {
            if (role.isUser) return;
            var voteMap = isFinal ? game.finalVotes : game.votes;
            if (voteMap[role.id]) return;

            var voteName = aiVotes[role.name];
            var targetRole = voteName ? game.roles.find(function(r) { return r.name === voteName && r.id !== role.id; }) : null;

            if (!targetRole) {
                // 随机投票作为后备
                var candidates = game.roles.filter(function(r) { return r.id !== role.id; });
                targetRole = candidates[Math.floor(Math.random() * candidates.length)];
            }

            voteMap[role.id] = targetRole.id;
        });

    } catch (e) {
        console.error('[detective] AI投票失败，使用随机投票:', e);
        // 随机投票后备
        game.roles.forEach(function(role) {
            if (role.isUser) return;
            var voteMap = isFinal ? game.finalVotes : game.votes;
            if (voteMap[role.id]) return;
            var candidates = game.roles.filter(function(r) { return r.id !== role.id; });
            var target = candidates[Math.floor(Math.random() * candidates.length)];
            voteMap[role.id] = target.id;
        });
    }

    _detSave();

    if (isFinal) {
        detectiveState.view = 'finalResult';
        game.phase = 'finalResult';
    } else {
        // 找出最高票
        var voteCounts = {};
        game.roles.forEach(function(r) { voteCounts[r.id] = 0; });
        Object.keys(game.votes).forEach(function(vid) {
            var tid = game.votes[vid];
            if (voteCounts[tid] !== undefined) voteCounts[tid]++;
        });
        var maxVotes = 0;
        var topId = null;
        Object.keys(voteCounts).forEach(function(rid) {
            if (voteCounts[rid] > maxVotes) {
                maxVotes = voteCounts[rid];
                topId = rid;
            }
        });
        game.topSuspect = topId;
        detectiveState.view = 'voteResult';
        game.phase = 'voteResult';
    }
    _detSave();
    renderGamesHome();
}

// ========== 投票结果 ==========
function _detRenderVoteResult(area) {
    var game = detectiveState.current;
    if (!game) return;

    var voteCounts = {};
    game.roles.forEach(function(r) { voteCounts[r.id] = 0; });
    Object.keys(game.votes).forEach(function(vid) {
        var tid = game.votes[vid];
        if (voteCounts[tid] !== undefined) voteCounts[tid]++;
    });

    var totalVotes = Object.keys(game.votes).length || 1;

    var barsHtml = game.roles.map(function(r) {
        var count = voteCounts[r.id] || 0;
        var pct = Math.round((count / totalVotes) * 100);
        var isTop = (r.id === game.topSuspect);
        return '<div class="det-vote-bar-item">' +
            '<div class="det-vote-bar-name">' + _detEsc(r.name) + '</div>' +
            '<div class="det-vote-bar-track">' +
                '<div class="det-vote-bar-fill' + (isTop ? ' top' : '') + '" style="width:' + pct + '%;"></div>' +
            '</div>' +
            '<div class="det-vote-bar-count">' + count + '</div>' +
        '</div>';
    }).join('');

    var topRole = game.roles.find(function(r) { return r.id === game.topSuspect; });
    var topName = topRole ? topRole.name : '未知';

    // 显示每个人投票详情
    var voteDetailHtml = '<div class="det-vote-detail-section">' +
        '<div class="det-vote-detail-title">📊 投票详情</div>';
    game.roles.forEach(function(voter) {
        var targetId = game.votes[voter.id];
        var target = game.roles.find(function(r) { return r.id === targetId; });
        if (target) {
            voteDetailHtml += '<div class="det-vote-detail-row">' +
                '<span class="det-vote-detail-voter">' + _detEsc(voter.name) + '</span>' +
                '<span class="det-vote-detail-arrow">→</span>' +
                '<span class="det-vote-detail-target">' + _detEsc(target.name) + '</span>' +
            '</div>';
        }
    });
    voteDetailHtml += '</div>';

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="renderGamesHome();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">投票结果</div>' +
            '<div class="det-nav-right"><div onclick="_detShowCluesPanel()" style="cursor:pointer;font-size:13px;color:#666;">📋 线索</div></div>' +
        '</div>' +
        '<div class="det-scroll">' +
        '<div class="det-vote-result">' +
            '<div class="det-vote-result-title">🗳️ 初投票结果</div>' +
            barsHtml +
            voteDetailHtml +
            '<div class="det-vote-suspect-announce">' +
                '最高嫌疑人：<strong>' + _detEsc(topName) + '</strong>，需要进行自辩' +
            '</div>' +
            '<button class="det-action-btn" onclick="_detGoToDefense();">' +
                '<i class="fas fa-microphone"></i> 听取自辩' +
            '</button>' +
        '</div>' +
        '</div></div></div>';
}

// ========== 自辩 ==========
async function _detGoToDefense() {
    var game = detectiveState.current;
    detectiveState.view = 'defense';
    game.phase = 'defense';
    _detSave();
    renderGamesHome();

    var topRole = game.roles.find(function(r) { return r.id === game.topSuspect; });
    if (!topRole) return;

    // 如果被怀疑的是用户自己
    if (topRole.isUser) {
        var defenseEl = document.getElementById('det-defense-content');
        if (defenseEl) {
            defenseEl.innerHTML = '<div class="det-defense-user-prompt">' +
                '<div style="color:#333; font-size:14px; margin-bottom:12px; text-align:center;">⚠️ 你被票为最高嫌疑人！请为自己辩护</div>' +
                '<textarea class="det-defense-textarea" id="det-defense-user-text" placeholder="为自己辩护..."></textarea>' +
                '<button class="det-action-btn" onclick="detUserDefense();">提交自辩</button>' +
            '</div>';
        }
        return;
    }

    var defenseEl = document.getElementById('det-defense-content');
    if (defenseEl) {
        defenseEl.innerHTML = '<div class="det-thinking"><span>' + _detEsc(topRole.name) + ' 正在准备自辩</span><span class="det-thinking-dots"><span>.</span><span>.</span><span>.</span></span></div>';
    }

    try {
        _currentApiScene = 'detective';
        var prompt = '你正在参与一个侦探推理游戏。你是' + topRole.name + '（' + topRole.publicIdentity + '）。\n' +
            '在刚才的初投票中，你获得了最多的怀疑票，被认为最可疑。\n\n' +
            '案件：' + game.caseName + '\n' +
            '死者：' + game.victim.name + '\n\n' +
            '你的秘密：' + topRole.secretIdentity + '\n' +
            '你声称的不在场证明：' + topRole.alibi + '\n' +
            '你实际做的事：' + topRole.realActivity + '\n' +
            '你的性格：' + topRole.personality + '\n' +
            '口头禅：' + topRole.catchphrase + '\n' +
            (topRole.isMurderer ?
                '⚠️ 你确实是凶手！你必须为自己辩护。要有说服力，但辩护中需要有1-2个不太明显的逻辑漏洞，给玩家推理的线索。\n' :
                '你不是凶手。你被冤枉了，但你有自己的秘密不想暴露。可以适当透露一些秘密来自证清白。\n') +
            '\n之前的讨论摘要：\n' +
            game.roundtableLog.slice(-6).map(function(e) {
                var r = game.roles.find(function(x) { return x.id === e.roleId; });
                return (r ? r.name : '?') + '：' + e.text;
            }).join('\n') +
            '\n\n请为自己辩护（80-150字）。完全符合角色性格，使用口头禅。\n' +
            'JSON格式：{"defense": "辩护内容", "revealedSecret": "为自证而透露的秘密信息（没有则为空字符串）"}';

        var data = await API.chatCompletion([
            { role: 'system', content: '你是角色扮演大师。只输出合法JSON。' },
            { role: 'user', content: prompt }
        ], 0.85, true);

        var result = _detParseJSON(data.choices[0].message.content);
        var defense = result.defense || '我没什么好说的...';
        var revealed = result.revealedSecret || '';

        if (defenseEl) {
            defenseEl.innerHTML =
                '<div class="det-defense-bubble">' +
                    '<div class="det-defense-label">🎤 ' + _detEsc(topRole.name) + ' 的自辩</div>' +
                    '<div class="det-speech-content">' + _detEsc(defense) + '</div>' +
                    (revealed ? '<div class="det-defense-revealed">💡 透露的信息：' + _detEsc(revealed) + '</div>' : '') +
                '</div>';
        }
    } catch (e) {
        console.error('[detective] 自辩生成失败:', e);
        if (defenseEl) {
            defenseEl.innerHTML = '<div class="det-defense-bubble"><div class="det-speech-content">（' + _detEsc(topRole.name) + '低下了头，沉默不语）</div></div>';
        }
    }
}

function detUserDefense() {
    var textarea = document.getElementById('det-defense-user-text');
    if (!textarea) return;
    var text = textarea.value.trim();
    if (!text) return;

    var game = detectiveState.current;
    var defenseEl = document.getElementById('det-defense-content');
    if (defenseEl) {
        defenseEl.innerHTML =
            '<div class="det-defense-bubble">' +
                '<div class="det-defense-label">🎤 你的自辩</div>' +
                '<div class="det-speech-content">' + _detEsc(text) + '</div>' +
            '</div>';
    }
}

function _detRenderDefense(area) {
    var game = detectiveState.current;
    if (!game) return;

    var topRole = game.roles.find(function(r) { return r.id === game.topSuspect; });
    var topName = topRole ? topRole.name : '未知';

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="renderGamesHome();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">自辩环节</div>' +
            '<div class="det-nav-right"><div onclick="_detShowCluesPanel()" style="cursor:pointer;font-size:13px;color:#666;">📋 线索</div></div>' +
        '</div>' +
        '<div class="det-scroll">' +
        '<div style="padding:20px 16px;">' +
            '<div class="det-roundtable-title">⚖️ ' + _detEsc(topName) + ' 的自辩</div>' +
            '<div id="det-defense-content"></div>' +
            '<button class="det-action-btn" style="margin-top:20px;" onclick="_detGoToCrossExamine();">' +
                '<i class="fas fa-comments"></i> 进入交叉质证' +
            '</button>' +
        '</div>' +
        '</div></div></div>';
}

// ========== 交叉质证（新增） ==========
function _detGoToCrossExamine() {
    var game = detectiveState.current;
    game.crossExamineLog = [];
    detectiveState._crossExamineCount = 0;
    detectiveState.view = 'crossExamine';
    game.phase = 'crossExamine';
    _detSave();
    renderGamesHome();
    // 开始AI质证
    _detStartCrossExamine(game);
}

async function _detStartCrossExamine(game) {
    var container = document.getElementById('det-cross-messages');
    if (!container) return;

    var topRole = game.roles.find(function(r) { return r.id === game.topSuspect; });
    if (!topRole) return;

    // AI角色中随机选一个提问
    var questioners = game.roles.filter(function(r) { return !r.isUser && r.id !== topRole.id; });
    if (questioners.length === 0) return;

    var questioner = questioners[Math.floor(Math.random() * questioners.length)];

    container.innerHTML += '<div class="det-thinking" id="det-cross-thinking-q">' +
        '<span>' + _detEsc(questioner.name) + ' 正在提出质疑</span>' +
        '<span class="det-thinking-dots"><span>.</span><span>.</span><span>.</span></span>' +
    '</div>';
    container.scrollTop = container.scrollHeight;

    try {
        _currentApiScene = 'detective';
        var qPrompt = '你是' + questioner.name + '（' + questioner.publicIdentity + '），性格：' + questioner.personality + '，口头禅：' + questioner.catchphrase + '。\n' +
            '在侦探游戏中，' + topRole.name + '被投为最可疑的人，TA刚做了自辩。\n\n' +
            '讨论中的信息：\n' +
            game.roundtableLog.slice(-4).map(function(e) {
                var r = game.roles.find(function(x) { return x.id === e.roleId; });
                return (r ? r.name : '?') + '：' + e.text;
            }).join('\n') +
            '\n\n请对' + topRole.name + '提出一个尖锐的质疑问题（30-60字），完全符合你的性格和口头禅。\n直接输出问题文本。';

        var qData = await API.chatCompletion([
            { role: 'system', content: '角色扮演。直接输出质疑问题文本，不要格式。' },
            { role: 'user', content: qPrompt }
        ], 0.85, true);

        var question = (qData.choices[0].message.content || '').trim();
        var qThink = document.getElementById('det-cross-thinking-q');
        if (qThink) qThink.remove();

        game.crossExamineLog.push({ roleId: questioner.id, type: 'question', text: question });
        _detSave();

        container = document.getElementById('det-cross-messages');
        if (container) {
            container.innerHTML += _detRenderCrossBubble(game, questioner, question, 'question');
            container.scrollTop = container.scrollHeight;
        }

        // 被质证者回答
        await new Promise(function(r) { setTimeout(r, 800); });

        if (!topRole.isUser) {
            container = document.getElementById('det-cross-messages');
            if (container) {
                container.innerHTML += '<div class="det-thinking" id="det-cross-thinking-a">' +
                    '<span>' + _detEsc(topRole.name) + ' 正在回答</span>' +
                    '<span class="det-thinking-dots"><span>.</span><span>.</span><span>.</span></span>' +
                '</div>';
                container.scrollTop = container.scrollHeight;
            }

            var answer = await _detGenerateResponse(game, topRole, question);
            var aThink = document.getElementById('det-cross-thinking-a');
            if (aThink) aThink.remove();

            game.crossExamineLog.push({ roleId: topRole.id, type: 'answer', text: answer });
            _detSave();

            container = document.getElementById('det-cross-messages');
            if (container) {
                container.innerHTML += _detRenderCrossBubble(game, topRole, answer, 'answer');
                container.scrollTop = container.scrollHeight;
            }
        }

        detectiveState._crossExamineCount = 1;

    } catch (e) {
        console.error('[detective] 交叉质证失败:', e);
        var qThink2 = document.getElementById('det-cross-thinking-q');
        if (qThink2) qThink2.remove();
    }

    // 显示用户追问按钮
    var userArea = document.getElementById('det-cross-user-area');
    if (userArea) userArea.style.display = 'block';
}

function _detRenderCrossBubble(game, role, text, type) {
    var contact = role.contactId ? store.contacts.find(function(c) { return c.id === role.contactId; }) : null;
    var avatarHtml = role.isUser ? _detGetUserAvatar() : (contact ? _detGetAvatar(contact) : '👤');
    var typeClass = type === 'question' ? 'cross-question' : 'cross-answer';

    return '<div class="det-cross-bubble ' + typeClass + '">' +
        '<div class="det-speech-header">' +
            '<div class="det-speech-avatar">' + avatarHtml + '</div>' +
            '<div class="det-speech-name">' + _detEsc(role.name) +
                '<span class="det-cross-type">' + (type === 'question' ? '质疑' : '回应') + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="det-speech-content">' + _detEsc(text) + '</div>' +
    '</div>';
}

function _detRenderCrossExamine(area) {
    var game = detectiveState.current;
    if (!game) return;

    var topRole = game.roles.find(function(r) { return r.id === game.topSuspect; });
    var topName = topRole ? topRole.name : '未知';

    var messagesHtml = game.crossExamineLog.map(function(entry) {
        var role = game.roles.find(function(r) { return r.id === entry.roleId; });
        if (!role) return '';
        return _detRenderCrossBubble(game, role, entry.text, entry.type);
    }).join('');

    var canAsk = detectiveState._crossExamineCount < 3;

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="renderGamesHome();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">❓ 交叉质证</div>' +
            '<div class="det-nav-right"><div onclick="_detShowCluesPanel()" style="cursor:pointer;font-size:13px;color:#666;">📋 线索</div></div>' +
        '</div>' +
        '<div class="det-roundtable">' +
            '<div class="det-roundtable-title">对 ' + _detEsc(topName) + ' 的交叉质证</div>' +
            '<div class="det-cross-hint">最多可追问3轮（已进行 ' + detectiveState._crossExamineCount + '/3）</div>' +
            '<div id="det-cross-messages" class="det-messages-container">' + messagesHtml + '</div>' +
            '<div class="det-input-area" id="det-cross-user-area" style="' + (canAsk ? '' : 'display:none;') + '">' +
                '<input class="det-input-field" id="det-cross-user-input" placeholder="向' + _detEsc(topName) + '追问..." />' +
                '<button class="det-input-send" onclick="detUserCrossExamine();"><i class="fas fa-paper-plane"></i></button>' +
            '</div>' +
            '<button class="det-action-btn" style="margin-top:16px;" onclick="_detGoToRound2();">' +
                '<i class="fas fa-magnifying-glass"></i> 进入第二轮搜证' +
            '</button>' +
        '</div>' +
        '</div></div>';
}

async function detUserCrossExamine() {
    var input = document.getElementById('det-cross-user-input');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    input.value = '';

    var game = detectiveState.current;
    var myRole = game.roles.find(function(r) { return r.isUser; });
    var topRole = game.roles.find(function(r) { return r.id === game.topSuspect; });

    game.crossExamineLog.push({ roleId: myRole.id, type: 'question', text: text });
    _detSave();

    var container = document.getElementById('det-cross-messages');
    if (container) {
        container.innerHTML += _detRenderCrossBubble(game, myRole, text, 'question');
        container.scrollTop = container.scrollHeight;
    }

    detectiveState._crossExamineCount++;

    if (topRole && !topRole.isUser) {
        container = document.getElementById('det-cross-messages');
        if (container) {
            container.innerHTML += '<div class="det-thinking" id="det-cross-thinking-ua">' +
                '<span>' + _detEsc(topRole.name) + ' 正在回答</span>' +
                '<span class="det-thinking-dots"><span>.</span><span>.</span><span>.</span></span>' +
            '</div>';
            container.scrollTop = container.scrollHeight;
        }

        try {
            var answer = await _detGenerateResponse(game, topRole, text);
            var thinkEl = document.getElementById('det-cross-thinking-ua');
            if (thinkEl) thinkEl.remove();
            game.crossExamineLog.push({ roleId: topRole.id, type: 'answer', text: answer });
            _detSave();
            container = document.getElementById('det-cross-messages');
            if (container) {
                container.innerHTML += _detRenderCrossBubble(game, topRole, answer, 'answer');
                container.scrollTop = container.scrollHeight;
            }
        } catch (e) {
            console.error('[detective] 质证回答失败:', e);
            var thinkEl2 = document.getElementById('det-cross-thinking-ua');
            if (thinkEl2) thinkEl2.remove();
        }
    }

    // 如果达到上限，隐藏输入
    if (detectiveState._crossExamineCount >= 3) {
        var userArea = document.getElementById('det-cross-user-area');
        if (userArea) userArea.style.display = 'none';
    }
}

// ========== 第二轮 ==========
function _detGoToRound2() {
    var game = detectiveState.current;
    game.round = 2;
    game.searchesLeft = 3;
    game.roundtableLog = [];
    detectiveState.view = 'search2';
    game.phase = 'search2';
    _detAISearch(game);
    _detSave();
    renderGamesHome();
}

// ========== 最后陈词（新增） ==========
function _detRenderClosingStatement(area) {
    var game = detectiveState.current;
    if (!game) return;

    var statementsHtml = (game.closingStatements || []).map(function(entry) {
        var role = game.roles.find(function(r) { return r.id === entry.roleId; });
        if (!role) return '';
        var contact = role.contactId ? store.contacts.find(function(c) { return c.id === role.contactId; }) : null;
        var avatarHtml = role.isUser ? _detGetUserAvatar() : (contact ? _detGetAvatar(contact) : '👤');
        return '<div class="det-closing-bubble">' +
            '<div class="det-speech-header">' +
                '<div class="det-speech-avatar">' + avatarHtml + '</div>' +
                '<div class="det-speech-name">' + _detEsc(role.name) + '</div>' +
            '</div>' +
            '<div class="det-speech-content">' + _detEsc(entry.text) + '</div>' +
            (entry.suspect ? '<div class="det-closing-suspect">🎯 怀疑对象：' + _detEsc(entry.suspect) + '</div>' : '') +
        '</div>';
    }).join('');

    var myRole = game.roles.find(function(r) { return r.isUser; });
    var userDone = (game.closingStatements || []).some(function(e) { return e.roleId === myRole.id; });
    var allDone = (game.closingStatements || []).length >= game.roles.length;

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="renderGamesHome();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">📜 最后陈词</div>' +
            '<div class="det-nav-right"><div onclick="_detShowCluesPanel()" style="cursor:pointer;font-size:13px;color:#666;">📋 线索</div></div>' +
        '</div>' +
        '<div class="det-roundtable">' +
            '<div class="det-roundtable-title">每人发表最后陈词</div>' +
            '<div class="det-closing-hint">表明你认为谁是凶手，以及你的推理依据</div>' +
            '<div id="det-closing-messages" class="det-messages-container">' + statementsHtml + '</div>' +
            '<div class="det-input-area" id="det-closing-user-prompt" style="' + (userDone ? 'display:none;' : '') + '">' +
                '<div style="color:#333; font-size:12px; margin-bottom:8px; text-align:center;">你的最后陈词 — 你认为谁是凶手？</div>' +
                '<input class="det-input-field" id="det-closing-user-input" placeholder="我认为凶手是..." />' +
                '<button class="det-input-send" onclick="detUserClosingStatement();"><i class="fas fa-paper-plane"></i></button>' +
            '</div>' +
            '<button class="det-action-btn" id="det-closing-next-btn" style="margin-top:16px; ' + (allDone ? '' : 'display:none;') + '" onclick="detectiveState.view=\'finalVote\'; detectiveState.current.phase=\'finalVote\'; _detSave(); renderGamesHome();">' +
                '<i class="fas fa-gavel"></i> 进入最终投票' +
            '</button>' +
        '</div>' +
        '</div></div>';

    // 开始AI发言
    if (!userDone && (game.closingStatements || []).length === 0) {
        _detStartClosingStatements(game);
    }
}

async function _detStartClosingStatements(game) {
    var container = document.getElementById('det-closing-messages');
    if (!container) return;

    for (var i = 0; i < game.roles.length; i++) {
        var role = game.roles[i];
        if (role.isUser) {
            // 等待用户输入
            var promptEl = document.getElementById('det-closing-user-prompt');
            if (promptEl) promptEl.style.display = 'block';
            return;
        }

        var done = (game.closingStatements || []).some(function(e) { return e.roleId === role.id; });
        if (done) continue;

        container.innerHTML += '<div class="det-thinking" id="det-closing-thinking-' + role.id + '">' +
            '<span>' + _detEsc(role.name) + ' 正在思考最后陈词</span>' +
            '<span class="det-thinking-dots"><span>.</span><span>.</span><span>.</span></span>' +
        '</div>';
        container.scrollTop = container.scrollHeight;

        try {
            var stmt = await _detGenerateClosingStatement(game, role);
            var thinkEl = document.getElementById('det-closing-thinking-' + role.id);
            if (thinkEl) thinkEl.remove();

            game.closingStatements.push({ roleId: role.id, text: stmt.statement, suspect: stmt.suspect });
            _detSave();

            container = document.getElementById('det-closing-messages');
            if (container) {
                var contact = role.contactId ? store.contacts.find(function(c) { return c.id === role.contactId; }) : null;
                var avatarHtml = contact ? _detGetAvatar(contact) : '👤';
                container.innerHTML += '<div class="det-closing-bubble">' +
                    '<div class="det-speech-header">' +
                        '<div class="det-speech-avatar">' + avatarHtml + '</div>' +
                        '<div class="det-speech-name">' + _detEsc(role.name) + '</div>' +
                    '</div>' +
                    '<div class="det-speech-content">' + _detEsc(stmt.statement) + '</div>' +
                    (stmt.suspect ? '<div class="det-closing-suspect">🎯 怀疑对象：' + _detEsc(stmt.suspect) + '</div>' : '') +
                '</div>';
                container.scrollTop = container.scrollHeight;
            }
        } catch (e) {
            console.error('[detective] 陈词生成失败:', e);
            var thinkEl2 = document.getElementById('det-closing-thinking-' + role.id);
            if (thinkEl2) thinkEl2.remove();
            game.closingStatements.push({ roleId: role.id, text: '我保留意见。', suspect: '' });
            _detSave();
        }

        await new Promise(function(r) { setTimeout(r, 600); });
    }

    // 全部完成
    var nextBtn = document.getElementById('det-closing-next-btn');
    if (nextBtn) nextBtn.style.display = 'block';
}

async function _detGenerateClosingStatement(game, role) {
    _currentApiScene = 'detective';
    var allCluesText = '';
    var pool1 = game.cluesPool.round1;
    var pool2 = game.cluesPool.round2;
    var myClueIds = game.playerClues[role.id] || [];
    var myClues = myClueIds.map(function(cid) {
        return pool1.find(function(c) { return c.id === cid; }) || pool2.find(function(c) { return c.id === cid; });
    }).filter(Boolean);

    allCluesText = myClues.map(function(c) { return '- ' + c.description; }).join('\n');

    var prompt = '侦探推理游戏，现在是最后陈词环节。\n\n' +
        '案件：' + game.caseName + '\n' +
        '你是：' + role.name + '（' + role.publicIdentity + '），性格：' + role.personality + '，口头禅：' + role.catchphrase + '\n' +
        (role.isMurderer ? '⚠️ 你是凶手！你需要嫁祸给其他人。\n' : '你不是凶手。\n') +
        '\n你收集到的线索：\n' + (allCluesText || '无') +
        '\n\n讨论中的关键信息：\n' +
        game.roundtableLog.slice(-6).map(function(e) {
            var r = game.roles.find(function(x) { return x.id === e.roleId; });
            return (r ? r.name : '?') + '：' + e.text;
        }).join('\n') +
        '\n\n请发表最后陈词（40-80字），说明你认为谁是凶手以及理由。\n' +
        'JSON格式：{"statement": "最后陈词内容", "suspect": "你怀疑的角色名"}';

    var data = await API.chatCompletion([
        { role: 'system', content: '角色扮演大师。只输出合法JSON。' },
        { role: 'user', content: prompt }
    ], 0.85, true);

    return _detParseJSON(data.choices[0].message.content);
}

async function detUserClosingStatement() {
    var input = document.getElementById('det-closing-user-input');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    input.value = '';

    var game = detectiveState.current;
    var myRole = game.roles.find(function(r) { return r.isUser; });

    // 尝试提取怀疑对象
    var suspect = '';
    game.roles.forEach(function(r) {
        if (!r.isUser && text.indexOf(r.name) >= 0) {
            suspect = r.name;
        }
    });

    game.closingStatements.push({ roleId: myRole.id, text: text, suspect: suspect });
    _detSave();

    // 隐藏输入
    var promptEl = document.getElementById('det-closing-user-prompt');
    if (promptEl) promptEl.style.display = 'none';

    var container = document.getElementById('det-closing-messages');
    if (container) {
        container.innerHTML += '<div class="det-closing-bubble">' +
            '<div class="det-speech-header">' +
                '<div class="det-speech-avatar">' + _detGetUserAvatar() + '</div>' +
                '<div class="det-speech-name">' + _detEsc(myRole.name) + '</div>' +
            '</div>' +
            '<div class="det-speech-content">' + _detEsc(text) + '</div>' +
            (suspect ? '<div class="det-closing-suspect">🎯 怀疑对象：' + _detEsc(suspect) + '</div>' : '') +
        '</div>';
        container.scrollTop = container.scrollHeight;
    }

    // 继续剩下的AI
    await _detContinueClosingStatements(game);
}

async function _detContinueClosingStatements(game) {
    var container = document.getElementById('det-closing-messages');
    if (!container) return;

    var doneIds = (game.closingStatements || []).map(function(e) { return e.roleId; });

    for (var i = 0; i < game.roles.length; i++) {
        var role = game.roles[i];
        if (doneIds.indexOf(role.id) >= 0) continue;
        if (role.isUser) continue;

        container.innerHTML += '<div class="det-thinking" id="det-closing-thinking-' + role.id + '">' +
            '<span>' + _detEsc(role.name) + ' 正在思考</span>' +
            '<span class="det-thinking-dots"><span>.</span><span>.</span><span>.</span></span>' +
        '</div>';
        container.scrollTop = container.scrollHeight;

        try {
            var stmt = await _detGenerateClosingStatement(game, role);
            var thinkEl = document.getElementById('det-closing-thinking-' + role.id);
            if (thinkEl) thinkEl.remove();
            game.closingStatements.push({ roleId: role.id, text: stmt.statement, suspect: stmt.suspect });
            _detSave();

            container = document.getElementById('det-closing-messages');
            if (container) {
                var contact = role.contactId ? store.contacts.find(function(c) { return c.id === role.contactId; }) : null;
                var avatarHtml = contact ? _detGetAvatar(contact) : '👤';
                container.innerHTML += '<div class="det-closing-bubble">' +
                    '<div class="det-speech-header">' +
                        '<div class="det-speech-avatar">' + avatarHtml + '</div>' +
                        '<div class="det-speech-name">' + _detEsc(role.name) + '</div>' +
                    '</div>' +
                    '<div class="det-speech-content">' + _detEsc(stmt.statement) + '</div>' +
                    (stmt.suspect ? '<div class="det-closing-suspect">🎯 怀疑对象：' + _detEsc(stmt.suspect) + '</div>' : '') +
                '</div>';
                container.scrollTop = container.scrollHeight;
            }
        } catch (e) {
            console.error('[detective] 陈词生成失败:', e);
            var thinkEl2 = document.getElementById('det-closing-thinking-' + role.id);
            if (thinkEl2) thinkEl2.remove();
            game.closingStatements.push({ roleId: role.id, text: '我保留意见。', suspect: '' });
            _detSave();
        }

        await new Promise(function(r) { setTimeout(r, 600); });
    }

    var nextBtn = document.getElementById('det-closing-next-btn');
    if (nextBtn) nextBtn.style.display = 'block';
}

// ========== 最终投票结果 ==========
function _detRenderFinalResult(area) {
    var game = detectiveState.current;
    if (!game) return;

    var voteCounts = {};
    game.roles.forEach(function(r) { voteCounts[r.id] = 0; });
    Object.keys(game.finalVotes).forEach(function(vid) {
        var tid = game.finalVotes[vid];
        if (voteCounts[tid] !== undefined) voteCounts[tid]++;
    });

    var maxVotes = 0;
    var chosenId = null;
    Object.keys(voteCounts).forEach(function(rid) {
        if (voteCounts[rid] > maxVotes) {
            maxVotes = voteCounts[rid];
            chosenId = rid;
        }
    });

    var chosenRole = game.roles.find(function(r) { return r.id === chosenId; });
    var murderer = game.roles.find(function(r) { return r.isMurderer; });
    var correctGuess = chosenRole && chosenRole.isMurderer;

    game.status = correctGuess ? 'solved' : 'failed';
    game._correctGuess = correctGuess;
    game._chosenName = chosenRole ? chosenRole.name : '无';
    game._murdererName = murderer ? murderer.name : '无';
    _detSave();

    var totalVotes = Object.keys(game.finalVotes).length || 1;
    var barsHtml = game.roles.map(function(r) {
        var count = voteCounts[r.id] || 0;
        var pct = Math.round((count / totalVotes) * 100);
        var isChosen = (r.id === chosenId);
        return '<div class="det-vote-bar-item">' +
            '<div class="det-vote-bar-name">' + _detEsc(r.name) + '</div>' +
            '<div class="det-vote-bar-track">' +
                '<div class="det-vote-bar-fill' + (isChosen ? ' top' : '') + '" style="width:' + pct + '%;"></div>' +
            '</div>' +
            '<div class="det-vote-bar-count">' + count + '</div>' +
        '</div>';
    }).join('');

    // 投票详情
    var voteDetailHtml = '<div class="det-vote-detail-section">' +
        '<div class="det-vote-detail-title">📊 投票详情</div>';
    game.roles.forEach(function(voter) {
        var targetId = game.finalVotes[voter.id];
        var target = game.roles.find(function(r) { return r.id === targetId; });
        if (target) {
            voteDetailHtml += '<div class="det-vote-detail-row">' +
                '<span class="det-vote-detail-voter">' + _detEsc(voter.name) + '</span>' +
                '<span class="det-vote-detail-arrow">→</span>' +
                '<span class="det-vote-detail-target">' + _detEsc(target.name) + '</span>' +
            '</div>';
        }
    });
    voteDetailHtml += '</div>';

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="renderGamesHome();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">最终裁决</div>' +
            '<div class="det-nav-right"><div onclick="_detShowCluesPanel()" style="cursor:pointer;font-size:13px;color:#666;">📋 线索</div></div>' +
        '</div>' +
        '<div class="det-scroll">' +
        '<div class="det-vote-result">' +
            '<div class="det-result-banner">' +
                '<div class="det-result-icon">' + (correctGuess ? '🏆' : '😈') + '</div>' +
                '<div class="det-result-text ' + (correctGuess ? 'win' : 'lose') + '">' +
                    (correctGuess ? '真 相 大 白' : '凶 手 逃 脱') +
                '</div>' +
                '<div class="det-result-murderer">' +
                    (correctGuess ? '你们成功找出了凶手：' + _detEsc(murderer.name) :
                        '你们投给了' + _detEsc(game._chosenName) + '，但真凶是' + _detEsc(murderer.name) + '！') +
                '</div>' +
            '</div>' +
            '<div style="margin:20px 0;">' + barsHtml + '</div>' +
            voteDetailHtml +
            '<button class="det-action-btn" onclick="_detGoToTruth();">' +
                '<i class="fas fa-book-open"></i> 揭示完整真相' +
            '</button>' +
        '</div>' +
        '</div></div></div>';
}

// ========== 真相揭示 ==========
async function _detGoToTruth() {
    var game = detectiveState.current;
    detectiveState.view = 'truth';
    game.phase = 'truth';
    _detSave();
    renderGamesHome();

    if (!game.truthNarrative) {
        var narrativeEl = document.getElementById('det-truth-narrative-text');
        if (narrativeEl) {
            narrativeEl.innerHTML = '<div class="det-thinking"><span>真相正在揭露</span><span class="det-thinking-dots"><span>.</span><span>.</span><span>.</span></span></div>';
        }

        try {
            _currentApiScene = 'detective';
            var murderer = game.roles.find(function(r) { return r.isMurderer; });
            var correctGuess = game._correctGuess;

            var prompt = '侦探推理游戏结束了。请生成一段戏剧化的真相揭示叙述。\n\n' +
                '案件：' + game.caseName + '\n' +
                '死者：' + game.victim.name + '（' + game.victim.identity + '），死因：' + game.victim.causeOfDeath + '\n' +
                '真凶：' + murderer.name + '（' + murderer.publicIdentity + '）\n' +
                '凶器：' + murderer.weapon + '\n' +
                '作案动机：' + murderer.motive + '\n' +
                '真实行动：' + murderer.realActivity + '\n' +
                '凶手身上的痕迹：' + murderer.secretClue + '\n' +
                '玩家' + (correctGuess ? '正确找出了凶手' : '投票失误，凶手逃脱了') + '\n\n' +
                '每个角色的真实秘密：\n' +
                game.roles.map(function(r) {
                    return r.name + '（' + r.publicIdentity + '）：' + r.secretIdentity + '。真实行动：' + r.realActivity + (r.isMurderer ? ' 【凶手】' : '');
                }).join('\n') +
                '\n\n要求：\n' +
                '1. 用200-350字的叙述文揭示完整真相\n' +
                '2. 先描述凶手的完整作案过程和动机\n' +
                '3. 然后揭露其他角色的秘密\n' +
                '4. 说明关键线索是如何串联指向凶手的\n' +
                (correctGuess ? '5. 以真相大白的胜利基调结尾\n' : '5. 以迷雾未散的遗憾基调结尾\n') +
                '\nJSON格式：{"narrative": "真相叙述文本"}';

            var data = await API.chatCompletion([
                { role: 'system', content: '你是悬疑推理叙述大师。只输出合法JSON。创造令人震撼的真相揭示叙述。' },
                { role: 'user', content: prompt }
            ], 0.9, true);

            var result = _detParseJSON(data.choices[0].message.content);
            game.truthNarrative = result.narrative || '真相已经大白...';
            _detSave();

            narrativeEl = document.getElementById('det-truth-narrative-text');
            if (narrativeEl) {
                narrativeEl.textContent = '';
                _detTypewriter(narrativeEl, game.truthNarrative, 25);
            }
        } catch (e) {
            console.error('[detective] 真相生成失败:', e);
            game.truthNarrative = '真相隐没在迷雾之中...（生成失败）';
            _detSave();
            narrativeEl = document.getElementById('det-truth-narrative-text');
            if (narrativeEl) {
                narrativeEl.textContent = game.truthNarrative;
            }
        }
    }
}

function _detRenderTruth(area) {
    var game = detectiveState.current;
    if (!game) return;

    // [FIX-闪退] 防御性检查：旧版存档可能缺少关键字段
    if (!game.roles || !Array.isArray(game.roles)) {
        area.innerHTML = '<div class="det-page"><div class="det-fog"></div><div class="det-content-layer">' +
            '<div class="det-nav"><div class="det-nav-back" onclick="detectiveState.view=\'home\'; _detRender();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">真相揭示</div><div class="det-nav-right"></div></div>' +
            '<div class="det-scroll"><div style="text-align:center; padding:60px 20px; color:#999;">' +
            '<div style="font-size:48px; margin-bottom:16px;">📂</div>' +
            '<div style="font-size:15px;">该案件档案数据不完整，无法查看真相</div>' +
            '<div class="det-back-btn" onclick="detectiveState.view=\'home\'; _detRender();" style="margin-top:24px;">🏠 返回大厅</div>' +
            '</div></div></div></div>';
        return;
    }

    var murderer = game.roles.find(function(r) { return r.isMurderer; });
    var correctGuess = game._correctGuess || (game.status === 'solved');

    // 角色秘密列表
    var secretsHtml = game.roles.map(function(r) {
        var contact = r.contactId ? store.contacts.find(function(c) { return c.id === r.contactId; }) : null;
        var avatarHtml = r.isUser ? _detGetUserAvatar() : (contact ? _detGetAvatar(contact) : '👤');
        return '<div class="det-secret-item' + (r.isMurderer ? ' is-murderer' : '') + '">' +
            '<div class="det-secret-avatar">' + avatarHtml + '</div>' +
            '<div class="det-secret-info">' +
                '<div class="det-secret-name ' + (r.isMurderer ? 'murderer' : 'innocent') + '">' +
                    _detEsc(r.name) +
                    '<span class="det-secret-badge ' + (r.isMurderer ? 'bad' : 'good') + '">' + (r.isMurderer ? '🔴 凶手' : '🟢 无辜') + '</span>' +
                '</div>' +
                '<div class="det-secret-text">公开身份：' + _detEsc(r.publicIdentity) + '</div>' +
                '<div class="det-secret-text">秘密身份：' + _detEsc(r.secretIdentity) + '</div>' +
                '<div class="det-secret-text">真实行动：' + _detEsc(r.realActivity) + '</div>' +
                (r.isMurderer ? '<div class="det-secret-text" style="color:#333;">凶器：' + _detEsc(r.weapon) + '</div>' : '') +
            '</div>' +
        '</div>';
    }).join('');

    // 评分
    var score = _detCalculateScore(game);

    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="detectiveState.view=\'home\'; _detRender();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">真相揭示</div>' +
            '<div class="det-nav-right"><div onclick="_detShowCluesPanel()" style="cursor:pointer;font-size:13px;color:#666;">📋 线索</div></div>' +
        '</div>' +
        '<div class="det-scroll">' +
        '<div class="det-truth-page">' +
            '<div class="det-result-banner">' +
                '<div class="det-result-icon">' + (correctGuess ? '🏆' : '💀') + '</div>' +
                '<div class="det-result-text ' + (correctGuess ? 'win' : 'lose') + '">' +
                    (correctGuess ? '真 相 大 白' : '凶 手 逃 脱') +
                '</div>' +
            '</div>' +
            '<div class="det-truth-narrative">' +
                '<div class="det-truth-narrative-title">📖 完整真相</div>' +
                '<div id="det-truth-narrative-text">' + _detEsc(game.truthNarrative || '') + '</div>' +
            '</div>' +
            '<div class="det-role-section-title">🎭 所有角色的秘密</div>' +
            '<div class="det-secrets-list">' + secretsHtml + '</div>' +
            '<div class="det-score-card">' +
                '<div class="det-score-header">🏆 推理评分</div>' +
                '<div class="det-score-grade">' + score.grade + '</div>' +
                '<div class="det-score-title-text">' + score.title + '</div>' +
                '<div class="det-score-details">' +
                    '<div class="det-score-item">找出凶手<span>' + (correctGuess ? '✅ 正确' : '❌ 错误') + '</span></div>' +
                    '<div class="det-score-item">收集线索<span>' + score.cluesFound + '</span></div>' +
                    '<div class="det-score-item">参与讨论<span>' + score.discussions + '次</span></div>' +
                    '<div class="det-score-item">综合得分<span>' + score.total + '分</span></div>' +
                '</div>' +
            '</div>' +
            '<div class="det-back-btn" onclick="detectiveState.view=\'home\'; _detRender();">🏠 返回大厅</div>' +
        '</div>' +
        '</div></div></div>';

    if (!game.truthNarrative) {
        _detGoToTruth();
    }
}

function _detCalculateScore(game) {
    // [FIX-闪退] 防御性检查：旧版存档可能缺少关键字段
    if (!game || !game.roles || !Array.isArray(game.roles)) {
        return { grade: '?', title: '数据异常', total: 0, cluesFound: '0/0', discussions: 0 };
    }
    var correctGuess = game._correctGuess || (game.status === 'solved');
    var myRole = game.roles.find(function(r) { return r.isUser; });
    if (!myRole) {
        return { grade: '?', title: '数据异常', total: 0, cluesFound: '0/0', discussions: 0 };
    }
    var myClues = (game.playerClues && game.playerClues[myRole.id]) ? game.playerClues[myRole.id] : [];
    var round1 = (game.cluesPool && game.cluesPool.round1) ? game.cluesPool.round1 : [];
    var round2 = (game.cluesPool && game.cluesPool.round2) ? game.cluesPool.round2 : [];
    var totalClues = round1.length + round2.length;
    var userSpeaks = game.roundtableLog ? game.roundtableLog.filter(function(e) { return e.roleId === myRole.id; }).length : 0;

    // 额外分数
    var crossExamineBonus = (game.crossExamineLog || []).filter(function(e) { return e.roleId === myRole.id; }).length * 5;
    var closingBonus = (game.closingStatements || []).some(function(e) { return e.roleId === myRole.id; }) ? 5 : 0;

    var total = 0;
    if (correctGuess) total += 40;
    total += Math.min(Math.round((myClues.length / Math.max(totalClues, 1)) * 25), 25);
    total += Math.min(userSpeaks * 5, 15);
    total += Math.min(crossExamineBonus, 10);
    total += closingBonus;

    // 初投就投对额外加分
    if (correctGuess && game.votes && myRole) {
        var myVote = game.votes[myRole.id];
        var murderer = game.roles.find(function(r) { return r.isMurderer; });
        if (murderer && myVote === murderer.id) total += 5;
    }

    var grade, title;
    if (total >= 90) { grade = 'S'; title = '名侦探'; }
    else if (total >= 75) { grade = 'A+'; title = '高级侦探'; }
    else if (total >= 60) { grade = 'A'; title = '侦探'; }
    else if (total >= 45) { grade = 'B'; title = '见习侦探'; }
    else if (total >= 30) { grade = 'C'; title = '吃瓜群众'; }
    else { grade = 'D'; title = '迷雾中的迷路者'; }

    return {
        grade: grade,
        title: title,
        total: total,
        cluesFound: myClues.length + '/' + totalClues,
        discussions: userSpeaks
    };
}

// ========== Loading ==========
function _detRenderLoading(area, msg) {
    area.innerHTML =
        '<div class="det-page">' +
        '<div class="det-fog"></div>' +
        '<div class="det-content-layer">' +
        '<div class="det-nav">' +
            '<div class="det-nav-back" onclick="detectiveState.view=\'home\'; _detRender();"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="det-nav-title">🔍 迷雾追凶</div>' +
            '<div class="det-nav-right"></div>' +
        '</div>' +
        '<div class="det-loading">' +
            '<div class="det-loading-spinner"></div>' +
            '<span>' + _detEsc(msg || '加载中...') + '</span>' +
        '</div>' +
        '</div></div>';
}
