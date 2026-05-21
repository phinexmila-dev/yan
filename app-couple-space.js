        // ==========================================
        // --- TA的秘密 (Secret Module) V2 ---
        // ==========================================
        let secretState = {
            cards: [],
            generating: false,
            // 领域: heartbeat(心动), possess(占有), dream(春梦), craving(渴望), darkside(暗面)
            domain: 'heartbeat',
            // 深度: shallow(小心思), medium(藏不住了), deep(绝对禁区)
            depth: 'shallow',
            // 当前玩法模式: cards(卡片流), blindbox(盲盒), interrogate(审讯室), truefalse(真假秘密), fragments(碎片), archive(档案)
            playMode: 'cards',
            // 碎片收集
            fragments: {}, // { storyId: [fragmentObj, ...] }
            // 已解锁的完整故事
            unlockedStories: [], // [{ storyId, storyType, title, fullText, unlockedAt }]
            // 秘密档案(收藏)
            archive: [], // [{ id, domain, depth, type, content, time, rarity, savedAt }]
            // 成就
            achievements: {},
            // 审讯室状态
            interrogateHistory: [],
            interrogateGenerating: false,
            // 真假秘密状态
            trueFalseCards: [],
            trueFalseRevealed: false,
            trueFalseGuess: null,
            trueFalseGenerating: false,
            // 盲盒状态
            blindboxOpening: false,
            blindboxResult: null,
            // 沉浸模式
            immerseStory: null,
            // 卡片解锁状态
            cardLocks: {} // { cardIndex: 'locked'|'unlocking'|'unlocked' }
        };

        const SECRET_DOMAINS = {
            heartbeat: { name: '心动', color: '#ff4b91', desc: '暗恋心思 / 小鹿乱撞' },
            possess: { name: '占有', color: '#ff3333', desc: '占有欲 / 嫉妒 / 独占' },
            dream: { name: '春梦', color: '#9b59b6', desc: '梦境 / 幻想 / 潜意识' },
            craving: { name: '渴望', color: '#e74c3c', desc: '身体渴望 / 亲密冲动' },
            darkside: { name: '暗面', color: '#8b0000', desc: '偏执 / 控制欲 / 危险念头' }
        };

        const SECRET_DEPTHS = {
            shallow: { name: '小心思', desc: '日常的甜蜜与微妙心动' },
            medium: { name: '藏不住了', desc: '更直白的暧昧与大胆' },
            deep: { name: '绝对禁区', desc: '最私密最原始的想法' }
        };

        const SECRET_CARD_TYPES = {
            thought: { icon: 'fas fa-brain', label: '内心独白', color: '#ff4b91' },
            action: { icon: 'fas fa-eye-slash', label: '隐藏行为', color: '#9333ea' },
            desire: { icon: 'fas fa-fire', label: '暗藏心思', color: '#f97316' },
            memory: { icon: 'fas fa-heart', label: '秘密记忆', color: '#3b82f6' },
            confession: { icon: 'fas fa-envelope-open-text', label: '未说出口的话', color: '#ec4899' },
            dream: { icon: 'fas fa-moon', label: '做过的梦', color: '#9b59b6' },
            jealousy: { icon: 'fas fa-heart-crack', label: '吃醋时刻', color: '#22c55e' },
            obsession: { icon: 'fas fa-link', label: '偏执念头', color: '#8b0000' },
            deleted: { icon: 'fas fa-eraser', label: '删掉的消息', color: '#6b7280' },
            fantasy: { icon: 'fas fa-sparkles', label: '脑内剧场', color: '#f59e0b' },
            craving: { icon: 'fas fa-lips', label: '身体渴望', color: '#e74c3c' },
            fragment: { icon: 'fas fa-puzzle-piece', label: '碎片', color: '#a855f7' }
        };

        const SECRET_STORY_TEMPLATES = [
            { id: 'dream_sweet', type: '一场春梦', fragmentsNeeded: 4, domain: 'dream' },
            { id: 'jealousy_storm', type: '那次嫉妒', fragmentsNeeded: 3, domain: 'possess' },
            { id: 'falling_diary', type: '暗恋日记', fragmentsNeeded: 5, domain: 'heartbeat' },
            { id: 'that_moment', type: '那个瞬间', fragmentsNeeded: 3, domain: 'craving' },
            { id: 'midnight_mono', type: '深夜独白', fragmentsNeeded: 4, domain: 'darkside' },
            { id: 'recurring_dream', type: '反复出现的梦', fragmentsNeeded: 5, domain: 'dream' }
        ];

        const SECRET_INTERROGATE_QUESTIONS = {
            heartbeat: [
                '你看到我的时候心跳会加速吗？',
                '你有没有偷偷翻过我的朋友圈？',
                '你存了多少张我的照片？',
                '你会因为我的一句话开心一整天吗？'
            ],
            possess: [
                '你会吃醋吗？什么时候最严重？',
                '你想过把我藏起来不让其他人靠近吗？',
                '看到我和其他人走得近你什么感觉？',
                '你有没有想过在我身上留下标记？'
            ],
            dream: [
                '你梦到过我吗？梦里我们在做什么？',
                '你最近做的关于我的梦是什么？',
                '你有没有在梦里对我做过什么？',
                '醒来后你会想继续那个梦吗？'
            ],
            craving: [
                '你最想吻我哪里？',
                '你看着我的时候脑子里在想什么？',
                '你有没有忍不住想碰我的时候？',
                '你对我身体的哪个部位最着迷？'
            ],
            darkside: [
                '如果我消失了你会怎么做？',
                '你有没有想过翻我的手机？',
                '你最怕我知道你的什么秘密？',
                '你有没有想过把我锁起来？'
            ]
        };

        // ====== TA的状态 Status Module State ======
        let statusState = {
            generating: false,
            data: null, // { vitals: {...}, bubbles: [...], mood: '', scene: '' }
            selectedBubble: null,
            baseVitals: null, // original vitals before bubble selection
            currentVitals: null // vitals after applying bubble effect
        };

        function renderStatusModule(area, space) {
            if (!space) { coupleViewMode = 'detail'; renderCouple(); return; }
            const partner = store.contacts.find(x => x.id === space.partnerId);
            const partnerName = partner ? partner.name : 'TA';
            const partnerAvatar = partner ? partner.avatar : _ph(80);

            let contentHTML = '';

            if (statusState.generating) {
                contentHTML = `
                    <div class="status-loading">
                        <div class="status-loading-icon"><i class="fas fa-heartbeat"></i></div>
                        <div class="status-loading-text">正在感知${partnerName}的身体...<br><span style="font-size:12px;color:#d1d5db;">连接中，请稍候</span></div>
                        <div class="status-loading-dots"><span></span><span></span><span></span></div>
                    </div>
                `;
            } else if (!statusState.data) {
                contentHTML = `
                    <div class="status-loading" style="animation:none;">
                        <div style="font-size:56px; margin-bottom:15px;">🫧</div>
                        <div class="status-loading-text" style="color:#a78bfa;">点击右上角 <i class="fas fa-sync-alt" style="font-size:13px;"></i> 按钮<br>感知${partnerName}此刻的身体状态</div>
                    </div>
                `;
            } else {
                const d = statusState.data;
                const baseV = statusState.baseVitals || d.vitals || {};
                const curV = statusState.currentVitals || d.vitals || {};
                const bubbles = d.bubbles || [];
                const selectedIdx = statusState.selectedBubble;
                const selectedBubble = selectedIdx !== null ? bubbles[selectedIdx] : null;
                const hasSelection = selectedBubble !== null;

                // Compute deltas
                const hrDelta = hasSelection ? (parseFloat(curV.heartRate) - parseFloat(baseV.heartRate)) : 0;
                const tempDelta = hasSelection ? (parseFloat(curV.temperature) - parseFloat(baseV.temperature)) : 0;
                const brDelta = hasSelection ? (parseFloat(curV.breathRate) - parseFloat(baseV.breathRate)) : 0;

                function deltaTag(val, unit) {
                    if (!val || Math.abs(val) < 0.01) return '<div class="status-vital-delta neutral">—</div>';
                    const cls = val > 0 ? 'up' : 'down';
                    const sign = val > 0 ? '+' : '';
                    return `<div class="status-vital-delta ${cls}">${sign}${typeof val === 'number' && val % 1 !== 0 ? val.toFixed(1) : val}${unit || ''}</div>`;
                }

                // Vitals cards with deltas
                const vitalsHTML = `
                    <div class="status-vitals-grid">
                        <div class="status-vital-card ${hasSelection ? 'changed' : ''}" style="--vital-accent:#ff4d6a;">
                            <div class="status-vital-icon" style="color:#ff4d6a;"><i class="fas fa-heartbeat"></i></div>
                            <div class="status-vital-value ${hasSelection && hrDelta ? 'highlight' : ''}">${curV.heartRate || '??'}</div>
                            <div class="status-vital-label">心跳 bpm</div>
                            ${deltaTag(hrDelta)}
                        </div>
                        <div class="status-vital-card ${hasSelection ? 'changed' : ''}" style="--vital-accent:#4fc3f7; animation-delay:0.05s;">
                            <div class="status-vital-icon" style="color:#4fc3f7;"><i class="fas fa-thermometer-half"></i></div>
                            <div class="status-vital-value ${hasSelection && tempDelta ? 'highlight' : ''}">${curV.temperature || '??'}</div>
                            <div class="status-vital-label">体温 °C</div>
                            ${deltaTag(tempDelta, '°')}
                        </div>
                        <div class="status-vital-card ${hasSelection ? 'changed' : ''}" style="--vital-accent:#81c784; animation-delay:0.1s;">
                            <div class="status-vital-icon" style="color:#81c784;"><i class="fas fa-lungs"></i></div>
                            <div class="status-vital-value ${hasSelection && brDelta ? 'highlight' : ''}">${curV.breathRate || '??'}</div>
                            <div class="status-vital-label">呼吸 次/分</div>
                            ${deltaTag(brDelta)}
                        </div>
                        <div class="status-vital-card" style="--vital-accent:#ba68c8; animation-delay:0.15s;">
                            <div class="status-vital-icon" style="color:#ba68c8;"><i class="fas fa-tint"></i></div>
                            <div class="status-vital-value">${curV.bloodPressure || '??'}</div>
                            <div class="status-vital-label">血压 mmHg</div>
                            <div class="status-vital-delta neutral">—</div>
                        </div>
                    </div>
                `;

                // Mood & Scene
                const moodHTML = `
                    <div class="status-mood-bar">
                        <div class="status-mood-item">
                            <span class="status-mood-emoji">${d.moodEmoji || '😊'}</span>
                            <span class="status-mood-text">${d.mood || '未知心情'}</span>
                        </div>
                        <div class="status-scene-tag"><i class="fas fa-map-marker-alt"></i> ${d.scene || '未知场景'}</div>
                    </div>
                `;

                // Bubbles with randomized float parameters
                const bubbleColors = ['#ff6b9d', '#c084fc', '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#fb923c', '#ec4899'];
                const intimateParts = ['胸口', '锁骨', '大腿内侧', '腰窝', '小腹', '臀部', '后腰', '脖颈'];
                const bubblesHTML = bubbles.map((b, i) => {
                    const isSelected = selectedIdx === i;
                    const color = bubbleColors[i % bubbleColors.length];
                    const isIntimate = intimateParts.some(p => (b.part || '').includes(p));
                    // Randomize float parameters per bubble for organic motion
                    const floatDur = (2.5 + (i * 0.7) % 2.5).toFixed(1);
                    const floatDelay = (i * 0.2).toFixed(1);
                    const floatY = -(4 + (i * 3) % 8);
                    const floatX = (i % 2 === 0 ? 1 : -1) * (2 + (i * 2) % 5);
                    const bubSize = 62 + ((i * 7) % 16); // 62-78px varied sizes
                    return `
                        <div class="status-bubble ${isSelected ? 'selected' : ''} ${isIntimate ? 'intimate' : ''}" 
                             onclick="event.stopPropagation();selectStatusBubble(${i})"
                             style="--bubble-color:${color}; --float-dur:${floatDur}s; --float-delay:${floatDelay}s; --float-y:${floatY}px; --float-x:${floatX}px; --bub-size:${bubSize}px;">
                            <div class="status-bubble-name" style="font-size:13px; font-weight:600; margin-top:0;">${b.part || ''}</div>
                        </div>
                    `;
                }).join('');

                // Detail panel
                let detailHTML = '';
                if (selectedBubble) {
                    // Build mini vitals tags showing deltas
                    let vitalsTagsHTML = '';
                    if (selectedBubble.vitalEffects) {
                        const eff = selectedBubble.vitalEffects;
                        if (eff.heartRate) vitalsTagsHTML += `<div class="status-detail-vital-tag"><i class="fas fa-heartbeat" style="color:#ff4d6a;"></i> 心跳 <span class="delta ${eff.heartRate > 0 ? 'up' : 'down'}">${eff.heartRate > 0 ? '+' : ''}${eff.heartRate}</span></div>`;
                        if (eff.temperature) vitalsTagsHTML += `<div class="status-detail-vital-tag"><i class="fas fa-thermometer-half" style="color:#4fc3f7;"></i> 体温 <span class="delta ${eff.temperature > 0 ? 'up' : 'down'}">${eff.temperature > 0 ? '+' : ''}${eff.temperature}°</span></div>`;
                        if (eff.breathRate) vitalsTagsHTML += `<div class="status-detail-vital-tag"><i class="fas fa-lungs" style="color:#81c784;"></i> 呼吸 <span class="delta ${eff.breathRate > 0 ? 'up' : 'down'}">${eff.breathRate > 0 ? '+' : ''}${eff.breathRate}</span></div>`;
                    }

                    detailHTML = `
                        <div class="status-detail-panel" onclick="event.stopPropagation()">
                            <div class="status-detail-header">
                                <span class="status-detail-emoji">${selectedBubble.emoji || '👆'}</span>
                                <span class="status-detail-part">${selectedBubble.part || ''}</span>
                                <span class="status-detail-state-inline">${selectedBubble.state || ''}</span>
                                <div class="status-detail-close" onclick="selectStatusBubble(null)"><i class="fas fa-times"></i></div>
                            </div>
                            <div class="status-detail-body">
                                ${vitalsTagsHTML ? `<div class="status-detail-vitals-mini">${vitalsTagsHTML}</div>` : ''}
                                <div class="status-detail-desc">${selectedBubble.detail || ''}</div>
                                ${selectedBubble.dataChange ? `
                                    <div class="status-detail-data">
                                        <div class="status-detail-data-label"><i class="fas fa-chart-line"></i> 身体反应</div>
                                        <div class="status-detail-data-value">${selectedBubble.dataChange}</div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }

                contentHTML = `
                    <div class="status-hero-area">
                        <div class="status-avatar-wrap">
                            <img src="${partnerAvatar}" class="status-hero-avatar">
                            <div class="status-avatar-pulse-ring"></div>
                        </div>
                        <div class="status-hero-name">${partnerName}</div>
                        <div class="status-hero-mood">${d.moodEmoji || '😊'} ${d.mood || ''}</div>
                    </div>
                    ${moodHTML}
                    ${vitalsHTML}
                    <div class="status-section-title"><i class="fas fa-hand-pointer"></i> 触碰泡泡感知TA<span class="status-section-hint">数据会随触碰变化</span></div>
                    <div class="status-bubbles-area" onclick="selectStatusBubble(null)">
                        ${bubblesHTML}
                    </div>
                    ${detailHTML}
                `;
            }

            area.innerHTML = `
                <div class="status-page-container">
                    <div class="status-nav-bar">
                        <div class="nav-icon" onclick="coupleViewMode='detail';renderCouple()"><i class="fas fa-chevron-left"></i></div>
                        <div style="flex:1;"></div>
                        <div class="status-nav-actions">
                            <div class="status-nav-btn" onclick="coupleViewMode='sub_touch';renderCouple()" title="沉浸式互动"><i class="fas fa-hand-pointer"></i></div>
                            <div class="status-nav-btn ${statusState.generating ? 'spinning' : ''}" onclick="generateStatusData()"><i class="fas fa-sync-alt"></i></div>
                        </div>
                    </div>
                    <div class="status-scroll-area">
                        ${contentHTML}
                    </div>
                </div>
            `;
        }

        function selectStatusBubble(idx) {
            if (idx !== null) event && event.stopPropagation();
            statusState.selectedBubble = idx;
            // Apply vital effects from the selected bubble
            if (idx !== null && statusState.data && statusState.baseVitals) {
                const bubble = statusState.data.bubbles[idx];
                if (bubble && bubble.vitalEffects) {
                    const base = statusState.baseVitals;
                    statusState.currentVitals = {
                        heartRate: String(Math.round(parseFloat(base.heartRate) + (bubble.vitalEffects.heartRate || 0))),
                        temperature: String((parseFloat(base.temperature) + (bubble.vitalEffects.temperature || 0)).toFixed(1)),
                        breathRate: String(Math.round(parseFloat(base.breathRate) + (bubble.vitalEffects.breathRate || 0))),
                        bloodPressure: base.bloodPressure
                    };
                } else {
                    statusState.currentVitals = { ...statusState.baseVitals };
                }
            } else if (statusState.baseVitals) {
                statusState.currentVitals = { ...statusState.baseVitals };
            }
            renderCouple();
        }

        async function generateStatusData() {
            if (statusState.generating) return toast('正在感知中，请稍候...');

            const space = getCurrentCoupleSpace();
            if (!space) return toast('请先进入情侣空间');
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return toast('找不到伴侣联系人');

            statusState.generating = true;
            statusState.data = null;
            statusState.selectedBubble = null;
            renderCouple();

            // Get worldbook context
            let worldBookContent = 'None';
            try {
                if (partner.settings?.mountedWbIds && Array.isArray(partner.settings.mountedWbIds)) {
                    const mountedBooks = (store.worldbooks || []).filter(wb => partner.settings.mountedWbIds.includes(wb.id));
                    if (mountedBooks.length > 0) {
                        worldBookContent = mountedBooks.map(wb => `[${wb.name}]:\n${wb.content}`).join('\n\n');
                    }
                }
            } catch(_wbErr) { console.warn('[worldbook] 获取世界书失败:', _wbErr); }

            // Get recent chat context
            const _coupleUserName1 = getUserPersonaName(partner, store.user.name || '用户');
            const recentChat = (store.chats[partner.id] || []).slice(-15).map(m => {
                const sender = m.sender === 'me' ? _coupleUserName1 : partner.name;
                return `${sender}: ${m.content}`;
            }).join('\n');

            const userName = getUserPersonaName(partner, '用户');

            // Get perception data for environmental context
            let envContext = '';
            if (store.perception && store.perception.master) {
                const p = store.perception;
                if (p.customWeather && p.weatherVal) envContext += `天气: ${p.weatherVal}; `;
                if (p.customTemp && p.tempVal) envContext += `温度: ${p.tempVal}°C; `;
                if (p.customCity && p.cityVal) envContext += `地点: ${p.cityVal}; `;
            }

            const sysPrompt = `你现在是${partner.name}。根据你的人设和最近的对话内容，生成你【此刻】的身体状态数据。

你是谁：
- ${partner.name}
- 人设：${partner.persona || '无特定人设'}
- 世界书/背景：${worldBookContent}
- 你在意的人：${userName}
${envContext ? '- 环境：' + envContext : ''}

你们最近的对话：
${recentChat || '暂无聊天记录'}

【任务】根据上面的角色设定和最近对话场景，生成${partner.name}此刻的身体状态。要求：
1. 所有数据要合理、有细节、符合角色当前的情绪和场景
2. 心情和场景要基于最近聊天内容推断（如果没有就自由发挥，但要符合人设）
3. 身体部位的状态描述要生动、口语化，像在描述一个真实的人
4. 数据变化要和心情、场景、互动关联（比如紧张时心跳加速、害羞时脸红体温上升等）

【输出格式 - 严格JSON，不要加任何多余文字】：
{
  "mood": "当前心情(2-4个字)",
  "moodEmoji": "一个表情符号",
  "scene": "当前场景(3-8个字，如：在卧室发呆、教室偷看手机)",
  "vitals": {
    "heartRate": "数字，如72",
    "temperature": "数字，如36.5",
    "breathRate": "数字，如16",
    "bloodPressure": "如120/80"
  },
  "bubbles": [
    {
      "part": "部位名(2-3字)",
      "state": "当前状态(5-15字)",
      "detail": "详细描述(30-80字，口语化，有细节)",
      "dataChange": "相关数据变化描述(10-25字，可选)",
      "vitalEffects": {
        "heartRate": "触碰该部位时心跳变化量(整数，如+5或-3，无变化则为0)",
        "temperature": "触碰该部位时体温变化量(小数，如+0.2或-0.1，无变化则为0)",
        "breathRate": "触碰该部位时呼吸变化量(整数，如+2或-1，无变化则为0)"
      }
    }
  ]
}

bubbles数组要包含6-8个身体部位，从以下列表中随机选择（每次尽量不同组合，大胆选择，不要保守）：
脸颊、眼睛、嘴唇、耳朵、耳垂、脖子、锁骨、肩膀、手、手指、手腕、手心、心口、胸口、腰、腰窝、小腹、肚脐、大腿内侧、大腿、膝盖、小腿、脚踝、脚、头发、后背、后颈、臀部、胯骨
注意：每次生成时从上面列表中随机挑选，不要每次都选一样的部位，要有惊喜感和新鲜感。可以大胆包含较私密的部位如大腿内侧、小腹、腰窝、锁骨、臀部等。

每个bubble的vitalEffects要合理反映触碰该部位时的身体反应（如触碰脸颊害羞→心跳+5体温+0.3，触碰手安心→心跳-3等）。
每个部位的描述要有趣、生动，带有角色的性格特点和当前情绪的反映。`;

            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: '你是一个角色状态数据生成器。严格输出合法JSON，不要有任何额外文字、注释或markdown格式。' },
                    { role: 'user', content: sysPrompt }
                ], 0.85);

                const reply = data.choices[0].message.content.trim();
                // Parse JSON - try to extract JSON from the response
                let jsonStr = reply;
                const jsonMatch = reply.match(/\{[\s\S]*\}/);
                if (jsonMatch) jsonStr = jsonMatch[0];

                const parsed = JSON.parse(jsonStr);
                statusState.data = parsed;
                statusState.baseVitals = parsed.vitals ? { ...parsed.vitals } : null;
                statusState.currentVitals = parsed.vitals ? { ...parsed.vitals } : null;
                statusState.generating = false;
                renderCouple();
                toast('状态感知完成', 'success');
            } catch (e) {
                console.error('生成状态数据失败:', e);
                statusState.generating = false;
                renderCouple();
                toast('感知失败，请重试', 'error');
            }
        }

        // --- Helper: get secret context (worldbook + chat) ---
        function _getSecretContext(partner) {
            let worldBookContent = 'None';
            try {
                if (partner.settings?.mountedWbIds && Array.isArray(partner.settings.mountedWbIds)) {
                    const mountedBooks = (store.worldbooks || []).filter(wb => partner.settings.mountedWbIds.includes(wb.id));
                    if (mountedBooks.length > 0) worldBookContent = mountedBooks.map(wb => `[${wb.name}]:\n${wb.content}`).join('\n\n');
                }
            } catch(_) {}
            const uName = getUserPersonaName(partner, store.user.name || '用户');
            const recentChat = (store.chats[partner.id] || []).slice(-15).map(m => {
                return `${m.sender === 'me' ? uName : partner.name}: ${m.content}`;
            }).join('\n');
            return { worldBookContent, recentChat, userName: uName };
        }

        // --- Init secret state from saved space data ---
        function _initSecretFromSpace(space) {
            if (space.secretDomain) secretState.domain = space.secretDomain;
            if (space.secretDepth) secretState.depth = space.secretDepth;
            if (space.secretArchive) secretState.archive = space.secretArchive;
            if (space.secretFragments) secretState.fragments = space.secretFragments;
            if (space.secretUnlockedStories) secretState.unlockedStories = space.secretUnlockedStories;
            if (space.secretAchievements) secretState.achievements = space.secretAchievements;
        }

        function _saveSecretToSpace() {
            const space = getCurrentCoupleSpace();
            if (!space) return;
            space.secretDomain = secretState.domain;
            space.secretDepth = secretState.depth;
            space.secretArchive = secretState.archive;
            space.secretFragments = secretState.fragments;
            space.secretUnlockedStories = secretState.unlockedStories;
            space.secretAchievements = secretState.achievements;
            save();
        }

        // ========== RENDER: Main Secret Module ==========
        function renderSecretModule(area, space) {
            if (!space) { coupleViewMode = 'detail'; renderCouple(); return; }
            const partner = store.contacts.find(x => x.id === space.partnerId);
            const partnerName = partner ? partner.name : 'TA';
            _initSecretFromSpace(space);

            // Check for immerse mode first
            if (secretState.immerseStory) {
                _renderSecretImmerse(area, partnerName);
                return;
            }

            const domainCfg = SECRET_DOMAINS[secretState.domain] || SECRET_DOMAINS.heartbeat;
            const depthCfg = SECRET_DEPTHS[secretState.depth] || SECRET_DEPTHS.shallow;

            // Domain tabs — 不显示名称，仅用色块区分，避免敏感词暴露在明面
            const domainTabsHTML = Object.entries(SECRET_DOMAINS).map(([k, v]) => `
                <div class="sc-domain-tab ${secretState.domain === k ? 'active' : ''}" onclick="setSecretDomain('${k}')" style="--tab-color:${v.color}" title="${v.name}">
                    <span class="sc-domain-dot" style="background:${v.color}"></span>
                </div>
            `).join('');

            // Depth selector — 不显示敏感名称
            const depthHTML = Object.entries(SECRET_DEPTHS).map(([k, v]) => `
                <div class="sc-depth-item ${secretState.depth === k ? 'active' : ''}" onclick="setSecretDepth('${k}')">
                    <span>${v.name}</span>
                </div>
            `).join('');

            // Play mode content
            let contentHTML = '';
            switch (secretState.playMode) {
                case 'cards': contentHTML = _renderSecretCards(partnerName); break;
                case 'blindbox': contentHTML = _renderSecretBlindbox(partnerName); break;
                case 'interrogate': contentHTML = _renderSecretInterrogate(partnerName); break;
                case 'truefalse': contentHTML = _renderSecretTrueFalse(partnerName); break;
                case 'fragments': contentHTML = _renderSecretFragments(partnerName); break;
                case 'archive': contentHTML = _renderSecretArchive(partnerName); break;
                default: contentHTML = _renderSecretCards(partnerName);
            }

            // Play mode bottom bar
            const playModes = [
                { id: 'cards', icon: 'fas fa-layer-group', label: '卡片' },
                { id: 'blindbox', icon: 'fas fa-gift', label: '盲盒' },
                { id: 'interrogate', icon: 'fas fa-comment-dots', label: '审讯' },
                { id: 'truefalse', icon: 'fas fa-masks-theater', label: '真假' },
                { id: 'fragments', icon: 'fas fa-puzzle-piece', label: '碎片' },
                { id: 'archive', icon: 'fas fa-book', label: '档案' }
            ];
            const playBarHTML = playModes.map(m => `
                <div class="sc-play-tab ${secretState.playMode === m.id ? 'active' : ''}" onclick="setSecretPlayMode('${m.id}')">
                    <i class="${m.icon}"></i>
                    <span>${m.label}</span>
                </div>
            `).join('');

            area.innerHTML = `
                <div class="sc-container">
                    <div class="sc-blood-drip"></div>
                    <div class="sc-nav-bar">
                        <div class="sc-nav-back" onclick="coupleViewMode='detail';renderCouple()"><i class="fas fa-chevron-left"></i></div>
                        <div class="sc-nav-title"><i class="fas fa-skull"></i> ${partnerName}的秘密</div>
                        <div class="sc-nav-actions">
                            <div class="sc-nav-btn" onclick="openSecretSettings()"><i class="fas fa-sliders-h"></i></div>
                        </div>
                    </div>
                    <div class="sc-domain-bar">${domainTabsHTML}</div>
                    <div class="sc-depth-bar">${depthHTML}</div>
                    <div class="sc-content-area" id="sc-content-area">
                        ${contentHTML}
                    </div>
                    <div class="sc-play-bar">${playBarHTML}</div>
                    <div class="sc-settings-overlay" id="sc-settings-overlay" onclick="closeSecretSettings()">
                        <div class="sc-settings-sheet" onclick="event.stopPropagation()">
                            <div class="sc-settings-title"><i class="fas fa-cog"></i> 秘密设置</div>
                            <div class="sc-settings-section">
                                <div class="sc-settings-label">领域</div>
                                <div class="sc-settings-domain-grid">
                                    ${Object.entries(SECRET_DOMAINS).map(([k, v]) => `
                                        <div class="sc-settings-domain-item ${secretState.domain === k ? 'active' : ''}" onclick="setSecretDomain('${k}');renderCouple();setTimeout(()=>openSecretSettings(),50)" style="--item-color:${v.color}">
                                            <span class="sc-domain-dot" style="background:${v.color};width:10px;height:10px;border-radius:50%;display:inline-block;"></span> <span>${v.name}</span>
                                            <div class="sc-settings-domain-desc">${v.desc}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="sc-settings-section">
                                <div class="sc-settings-label">深度</div>
                                ${Object.entries(SECRET_DEPTHS).map(([k, v]) => `
                                    <div class="sc-depth-option ${secretState.depth === k ? 'active' : ''}" onclick="setSecretDepth('${k}');renderCouple();setTimeout(()=>openSecretSettings(),50)">
                                        <div class="sc-depth-option-info">
                                            <div class="sc-depth-option-name">${v.name}</div>
                                            <div class="sc-depth-option-desc">${v.desc}</div>
                                        </div>
                                        <div class="sc-depth-check ${secretState.depth === k ? 'active' : ''}"><i class="fas fa-check"></i></div>
                                    </div>
                                `).join('')}
                            </div>
                            <button class="sc-settings-close-btn" onclick="closeSecretSettings()">完成</button>
                        </div>
                    </div>
                </div>
            `;
        }

        function setSecretDomain(d) {
            secretState.domain = d;
            secretState.cards = [];
            secretState.cardLocks = {};
            _saveSecretToSpace();
            renderCouple();
        }
        function setSecretDepth(d) {
            secretState.depth = d;
            secretState.cards = [];
            secretState.cardLocks = {};
            _saveSecretToSpace();
            renderCouple();
        }
        function setSecretPlayMode(m) {
            secretState.playMode = m;
            renderCouple();
        }
        function openSecretSettings() {
            const o = document.getElementById('sc-settings-overlay');
            if (o) o.classList.add('show');
        }
        function closeSecretSettings() {
            const o = document.getElementById('sc-settings-overlay');
            if (o) o.classList.remove('show');
        }

        // ========== RENDER: Cards Mode ==========
        function _renderSecretCards(partnerName) {
            if (secretState.generating) {
                return `<div class="sc-loading"><div class="sc-loading-icon"><i class="fas fa-skull"></i></div><div class="sc-loading-text">正在窥探${partnerName}的内心...</div><div class="sc-loading-dots"><span></span><span></span><span></span></div></div>`;
            }
            if (secretState.cards.length === 0) {
                return `<div class="sc-empty"><div class="sc-empty-text">点击下方按钮<br>窥探${partnerName}的秘密</div><button class="sc-gen-btn" onclick="generateSecrets()"><i class="fas fa-eye"></i> 窥探秘密</button></div>`;
            }
            const domainCfg = SECRET_DOMAINS[secretState.domain];
            let html = `<button class="sc-gen-btn" onclick="generateSecrets()"><i class="fas fa-sync-alt ${secretState.generating?'fa-spin':''}"></i> 重新窥探</button>`;
            html += secretState.cards.map((card, i) => {
                const ct = SECRET_CARD_TYPES[card.type] || SECRET_CARD_TYPES.thought;
                const lockState = secretState.cardLocks[i] || 'locked';
                const isLocked = lockState === 'locked';
                const unlockType = secretState.depth === 'deep' ? 'scratch' : (secretState.depth === 'medium' ? 'hold' : 'swipe');
                if (isLocked) {
                    return `<div class="sc-card sc-card-locked" data-idx="${i}" data-unlock="${unlockType}" ${unlockType==='hold'?`ontouchstart="startSecretHold(${i})" ontouchend="endSecretHold(${i})" onmousedown="startSecretHold(${i})" onmouseup="endSecretHold(${i})"`:`onclick="unlockSecretCard(${i})"`}>
                        <div class="sc-card-lock-overlay"><i class="fas fa-lock"></i><div class="sc-card-lock-hint">${unlockType==='swipe'?'点击解锁':unlockType==='hold'?'长按3秒偷听':'刮开查看'}</div></div>
                        <div class="sc-card-header"><div class="sc-card-type-icon" style="color:${ct.color}"><i class="${ct.icon}"></i></div><span class="sc-card-tag">${ct.label}</span><span class="sc-card-time">${card.time||''}</span></div>
                        <div class="sc-card-body sc-blurred">██████████████████████</div>
                    </div>`;
                }
                return `<div class="sc-card" style="animation-delay:${i*0.08}s">
                    <div class="sc-card-header"><div class="sc-card-type-icon" style="color:${ct.color}"><i class="${ct.icon}"></i></div><span class="sc-card-tag">${ct.label}</span><span class="sc-card-time">${card.time||''}</span>
                        <div class="sc-card-actions"><span class="sc-card-save" onclick="saveSecretToArchive(${i})" title="收藏"><i class="far fa-bookmark"></i></span></div>
                    </div>
                    <div class="sc-card-body">${card.content}</div>
                    <div class="sc-card-footer"><i class="fas fa-eye-slash"></i> 仅你可见 · ${partnerName}不知道你看到了这些</div>
                </div>`;
            }).join('');
            return html;
        }

        // ========== RENDER: Blindbox Mode ==========
        function _renderSecretBlindbox(partnerName) {
            if (secretState.blindboxOpening) {
                return `<div class="sc-blindbox-opening"><div class="sc-blindbox-box sc-shaking"><i class="fas fa-gift"></i></div><div class="sc-loading-text">正在开启盲盒...</div></div>`;
            }
            if (secretState.blindboxResult) {
                const r = secretState.blindboxResult;
                const ct = SECRET_CARD_TYPES[r.type] || SECRET_CARD_TYPES.thought;
                const domCfg = SECRET_DOMAINS[r.domain] || SECRET_DOMAINS.heartbeat;
                const rarity = r.rarity || 'normal';
                const rarityLabel = {normal:'普通',rare:'稀有',legendary:'传说'}[rarity];
                const rarityClass = rarity === 'legendary' ? 'sc-legendary' : rarity === 'rare' ? 'sc-rare' : '';
                return `<div class="sc-blindbox-result ${rarityClass}">
                    <div class="sc-blindbox-rarity">${rarityLabel}</div>
                    <div class="sc-blindbox-domain" style="color:${domCfg.color}">${domCfg.name}</div>
                    <div class="sc-card"><div class="sc-card-header"><div class="sc-card-type-icon" style="color:${ct.color}"><i class="${ct.icon}"></i></div><span class="sc-card-tag">${ct.label}</span><span class="sc-card-time">${r.time||''}</span></div><div class="sc-card-body">${r.content}</div></div>
                    ${r.fragment ? `<div class="sc-fragment-drop"><i class="fas fa-puzzle-piece"></i> 获得碎片：${r.fragment.hint}</div>` : ''}
                    <div class="sc-blindbox-btns"><button class="sc-gen-btn" onclick="openSecretBlindbox()"><i class="fas fa-gift"></i> 再开一个</button><button class="sc-gen-btn sc-btn-secondary" onclick="saveSecretToArchive(-1)" ><i class="far fa-bookmark"></i> 收藏</button></div>
                </div>`;
            }
            return `<div class="sc-blindbox-home"><div class="sc-blindbox-box-big"><i class="fas fa-gift"></i></div><div class="sc-blindbox-desc">随机领域 × 随机深度<br>你永远不知道会窥探到什么</div><button class="sc-gen-btn sc-btn-blood" onclick="openSecretBlindbox()"><i class="fas fa-dice"></i> 开启盲盒</button></div>`;
        }

        // ========== RENDER: Interrogate Mode ==========
        function _renderSecretInterrogate(partnerName) {
            const questions = SECRET_INTERROGATE_QUESTIONS[secretState.domain] || SECRET_INTERROGATE_QUESTIONS.heartbeat;
            let historyHTML = secretState.interrogateHistory.map(h => `
                <div class="sc-interro-msg sc-interro-q"><i class="fas fa-user-secret"></i> ${h.question}</div>
                <div class="sc-interro-msg sc-interro-a">${h.answer || '<i class="fas fa-ellipsis-h"></i>'}</div>
            `).join('');
            if (secretState.interrogateGenerating) {
                historyHTML += `<div class="sc-interro-msg sc-interro-a sc-typing"><span></span><span></span><span></span></div>`;
            }
            const qBtns = questions.map(q => `<div class="sc-interro-q-btn" onclick="askSecretQuestion('${q.replace(/'/g,"\\'")}')">${q}</div>`).join('');
            return `<div class="sc-interro-container">
                <div class="sc-interro-header"><i class="fas fa-comment-dots"></i> 审讯${partnerName}</div>
                <div class="sc-interro-history" id="sc-interro-history">${historyHTML || '<div class="sc-interro-empty">选择一个问题开始审讯...</div>'}</div>
                <div class="sc-interro-questions">${qBtns}</div>
                <div class="sc-interro-custom"><input id="sc-interro-input" placeholder="自由提问..." onkeydown="if(event.key==='Enter')askSecretCustomQuestion()"><button onclick="askSecretCustomQuestion()"><i class="fas fa-paper-plane"></i></button></div>
            </div>`;
        }

        // ========== RENDER: True/False Mode ==========
        function _renderSecretTrueFalse(partnerName) {
            if (secretState.trueFalseGenerating) {
                return `<div class="sc-loading"><div class="sc-loading-icon"><i class="fas fa-masks-theater"></i></div><div class="sc-loading-text">正在编造真假秘密...</div><div class="sc-loading-dots"><span></span><span></span><span></span></div></div>`;
            }
            if (secretState.trueFalseCards.length === 0) {
                return `<div class="sc-empty"><div class="sc-empty-text">生成3条秘密，其中有1条是假的<br>你能分辨出来吗？</div><button class="sc-gen-btn" onclick="generateTrueFalse()"><i class="fas fa-masks-theater"></i> 开始挑战</button></div>`;
            }
            const revealed = secretState.trueFalseRevealed;
            const guess = secretState.trueFalseGuess;
            let cardsHTML = secretState.trueFalseCards.map((c, i) => {
                const isFake = c.isFake;
                const guessed = guess === i;
                let cls = 'sc-tf-card';
                if (revealed) cls += isFake ? ' sc-tf-fake' : ' sc-tf-real';
                if (guessed) cls += ' sc-tf-guessed';
                return `<div class="${cls}" onclick="${revealed?'':'guessTrueFalse('+i+')'}">
                    <div class="sc-tf-num">#${i+1}</div>
                    <div class="sc-tf-content">${c.content}</div>
                    ${revealed ? `<div class="sc-tf-label">${isFake?'🤥 假的':'✅ 真的'}</div>` : ''}
                </div>`;
            }).join('');
            let resultHTML = '';
            if (revealed) {
                const correct = secretState.trueFalseCards[guess]?.isFake;
                resultHTML = `<div class="sc-tf-result ${correct?'sc-tf-win':'sc-tf-lose'}">${correct?'🎉 你猜对了！':'😈 你猜错了~'}</div><button class="sc-gen-btn" onclick="generateTrueFalse()"><i class="fas fa-redo"></i> 再来一局</button>`;
            }
            return `<div class="sc-tf-container"><div class="sc-tf-title"><i class="fas fa-masks-theater"></i> 哪条是假的？</div>${cardsHTML}${resultHTML}</div>`;
        }

        // ========== RENDER: Fragments Mode ==========
        function _renderSecretFragments(partnerName) {
            let storiesHTML = SECRET_STORY_TEMPLATES.map(st => {
                const frags = secretState.fragments[st.id] || [];
                const total = st.fragmentsNeeded;
                const collected = frags.length;
                const pct = Math.round((collected / total) * 100);
                const unlocked = secretState.unlockedStories.find(s => s.storyId === st.id);
                const domCfg = SECRET_DOMAINS[st.domain] || SECRET_DOMAINS.heartbeat;
                // 已解锁的故事：显示"沉浸重温"和"开启新故事"两个按钮
                const unlockedBtns = unlocked ? `
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="sc-gen-btn sc-btn-immerse" onclick="enterImmerseMode('${st.id}')"><i class="fas fa-book-open"></i> 沉浸重温</button>
                        <button class="sc-gen-btn sc-btn-secondary" onclick="startNewSecretStory('${st.id}')"><i class="fas fa-redo"></i> 开启新故事</button>
                    </div>` : (collected >= total ? `<button class="sc-gen-btn sc-btn-blood" onclick="unlockSecretStory('${st.id}')"><i class="fas fa-unlock"></i> 解锁完整故事</button>` : '');
                return `<div class="sc-frag-story ${unlocked ? 'sc-frag-unlocked' : ''}">
                    <div class="sc-frag-story-header"><span class="sc-frag-story-type">${st.type}</span><span class="sc-frag-story-domain" style="color:${domCfg.color}">${domCfg.name}</span></div>
                    <div class="sc-frag-progress"><div class="sc-frag-bar" style="width:${pct}%;background:${domCfg.color}"></div></div>
                    <div class="sc-frag-count">${collected}/${total} 碎片</div>
                    <div class="sc-frag-pieces">${Array.from({length:total},(_, idx) => `<div class="sc-frag-piece ${idx<collected?'sc-frag-found':''}"><i class="${idx<collected?'fas fa-puzzle-piece':'fas fa-question'}"></i></div>`).join('')}</div>
                    ${frags.map(f => `<div class="sc-frag-hint">"${f.hint}"</div>`).join('')}
                    ${unlockedBtns}
                </div>`;
            }).join('');
            return `<div class="sc-frag-container"><div class="sc-frag-title"><i class="fas fa-puzzle-piece"></i> 碎片收集</div><div class="sc-frag-desc">通过卡片、盲盒、审讯获取碎片<br>集齐碎片解锁完整故事，以TA的视角沉浸体验</div>${storiesHTML}</div>`;
        }

        // ========== RENDER: Archive Mode ==========
        function _renderSecretArchive(partnerName) {
            const archive = secretState.archive || [];
            const totalByDomain = {};
            Object.keys(SECRET_DOMAINS).forEach(k => totalByDomain[k] = 0);
            archive.forEach(a => { if (totalByDomain[a.domain] !== undefined) totalByDomain[a.domain]++; });
            let statsHTML = Object.entries(SECRET_DOMAINS).map(([k, v]) => `<div class="sc-archive-stat"><span class="sc-domain-dot" style="background:${v.color};width:8px;height:8px;border-radius:50%;display:inline-block;"></span><span>${v.name}</span><span class="sc-archive-count">${totalByDomain[k]}</span></div>`).join('');
            let cardsHTML = archive.length === 0 ? '<div class="sc-archive-empty">还没有收藏任何秘密</div>' : archive.slice().reverse().map((a, i) => {
                const ct = SECRET_CARD_TYPES[a.type] || SECRET_CARD_TYPES.thought;
                const domCfg = SECRET_DOMAINS[a.domain] || SECRET_DOMAINS.heartbeat;
                return `<div class="sc-card sc-archive-card"><div class="sc-card-header"><div class="sc-card-type-icon" style="color:${ct.color}"><i class="${ct.icon}"></i></div><span class="sc-card-tag">${ct.label}</span><span class="sc-card-time">${a.time||''}</span><span class="sc-archive-domain" style="color:${domCfg.color}">${domCfg.name}</span></div><div class="sc-card-body">${a.content}</div></div>`;
            }).join('');
            const storyCount = (secretState.unlockedStories||[]).length;
            return `<div class="sc-archive-container"><div class="sc-archive-title"><i class="fas fa-book"></i> 秘密档案</div><div class="sc-archive-stats">${statsHTML}</div><div class="sc-archive-summary">共收藏 ${archive.length} 条秘密 · 解锁 ${storyCount} 个故事</div><div class="sc-archive-list">${cardsHTML}</div></div>`;
        }

        // ========== RENDER: Immerse Mode ==========
        function _renderSecretImmerse(area, partnerName) {
            const story = secretState.immerseStory;
            if (!story) return;
            area.innerHTML = `<div class="sc-immerse-container">
                <div class="sc-immerse-close" onclick="exitImmerseMode()"><i class="fas fa-times"></i></div>
                <div class="sc-immerse-header"><div class="sc-immerse-title">${story.title}</div><div class="sc-immerse-sub">以${partnerName}的视角</div></div>
                <div class="sc-immerse-body" id="sc-immerse-body">${story.fullText || '<div class="sc-loading"><div class="sc-loading-dots"><span></span><span></span><span></span></div></div>'}</div>
            </div>`;
        }

        function exitImmerseMode() { secretState.immerseStory = null; renderCouple(); }

        // ========== Card Unlock Interactions ==========
        let _secretHoldTimer = null;
        function unlockSecretCard(i) {
            const depth = secretState.depth;
            if (depth === 'shallow') { secretState.cardLocks[i] = 'unlocked'; renderCouple(); }
            else if (depth === 'deep') { secretState.cardLocks[i] = 'unlocked'; renderCouple(); }
        }
        function startSecretHold(i) {
            _secretHoldTimer = setTimeout(() => { secretState.cardLocks[i] = 'unlocked'; renderCouple(); }, 3000);
        }
        function endSecretHold(i) { if (_secretHoldTimer) clearTimeout(_secretHoldTimer); }

        function saveSecretToArchive(idx) {
            const card = idx === -1 ? secretState.blindboxResult : secretState.cards[idx];
            if (!card) return;
            if (!secretState.archive) secretState.archive = [];
            secretState.archive.push({ ...card, domain: card.domain || secretState.domain, depth: secretState.depth, savedAt: Date.now() });
            _saveSecretToSpace();
            toast('已收藏到秘密档案', 'success');
        }

        // ========== Generate Secrets (New - Domain+Depth) ==========
        async function generateSecrets() {
            if (secretState.generating) return toast('正在生成中，请稍候...');
            const space = getCurrentCoupleSpace();
            if (!space) return toast('请先进入情侣空间');
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return toast('找不到伴侣联系人');

            secretState.generating = true;
            secretState.cards = [];
            secretState.cardLocks = {};
            renderCouple();

            const ctx = _getSecretContext(partner);
            const domainCfg = SECRET_DOMAINS[secretState.domain];
            const depthCfg = SECRET_DEPTHS[secretState.depth];
            const domainPrompts = {
                heartbeat: `【心动秘密】写关于${partner.name}对${ctx.userName}的暗恋、心动、小鹿乱撞的秘密：偷偷存${ctx.userName}的照片、反复看和${ctx.userName}的聊天记录、因为${ctx.userName}的一句话开心一整天、想牵${ctx.userName}的手又不敢、看到${ctx.userName}就脸红心跳。`,
                possess: `【占有秘密】写关于${partner.name}对${ctx.userName}的占有欲、嫉妒、独占欲的秘密：看到${ctx.userName}和其他人（注意：不是${ctx.userName}本人，是第三方陌生人）走得近心里发酸、想把${ctx.userName}藏起来只属于自己、讨厌${ctx.userName}提起某个无关的人、想在${ctx.userName}身上留下专属标记。【重要】${ctx.userName}是${partner.name}喜欢的人，不是情敌，嫉妒的对象是第三方陌生人。`,
                dream: `【春梦秘密】写关于${partner.name}梦到${ctx.userName}的梦境和潜意识秘密：做了关于${ctx.userName}的梦（可甜可辣）、梦里和${ctx.userName}在一起的具体场景和细节、醒来后的心跳和回味、反复出现的关于${ctx.userName}的梦境。`,
                craving: `【渴望秘密】写关于${partner.name}对${ctx.userName}的身体渴望和亲密冲动的秘密：想吻${ctx.userName}、想抱${ctx.userName}、对${ctx.userName}身体某个部位着迷、想和${ctx.userName}更亲密的冲动。`,
                darkside: `【暗面秘密】写关于${partner.name}对${ctx.userName}的偏执、控制欲、危险念头的秘密：想翻${ctx.userName}的手机、想知道${ctx.userName}所有密码、如果${ctx.userName}离开会怎样、有点病态的对${ctx.userName}的执念和占有。`
            };
            const depthPrompts = {
                shallow: '内容纯洁可爱，只写日常小心思，不能有身体接触描写。语气害羞腼腆。禁止脏话粗口。',
                medium: '内容可以暧昧大胆，有身体接触幻想（拥抱、接吻、抚摸、爱抚），直白表达迷恋和渴望。禁止脏话但可以非常直白露骨。',
                deep: '内容完全放飞，写出最私密最原始最赤裸的想法。必须包含明确的性幻想、性描写细节、脏话、粗口、下流但真实的欲望。要有具体的身体描写和行为幻想，毫无保留，越露骨越好。'
            };
            const domainDesc = domainPrompts[secretState.domain] || domainPrompts.heartbeat;
            const depthDesc = depthPrompts[secretState.depth] || depthPrompts.shallow;
            const typesByDomain = {
                heartbeat: ['thought','action','confession','memory','fantasy'],
                possess: ['jealousy','obsession','thought','action','confession'],
                dream: ['dream','fantasy','desire','memory','thought'],
                craving: ['craving','desire','fantasy','deleted','confession'],
                darkside: ['obsession','thought','deleted','action','jealousy']
            };
            const types = typesByDomain[secretState.domain] || typesByDomain.heartbeat;
            const sysPrompt = `你需要以第三人称视角，模拟${partner.name}的内心世界，写出${partner.name}最真实、最私密的内心想法。
${partner.name}的角色信息：人设：${partner.persona || '无特定人设'}；世界观：${ctx.worldBookContent}；${partner.name}喜欢的人是：${ctx.userName}（这是${partner.name}的恋爱对象，不是情敌）
最近对话：${ctx.recentChat || '暂无'}
${domainDesc}
${depthDesc}
写作要求：1.第三人称 2.贴合人设 3.口语化 4.禁止文艺腔 5.每条100-250字 6.有具体细节场景 7.占有/嫉妒类内容中，嫉妒对象必须是第三方陌生人，绝对不能把${ctx.userName}写成情敌
生成5条秘密，类型从[${types.join(',')}]中选择，要多样化。
格式：[SECRET:类型|时间标签|内容]`;
            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: '角色扮演内心独白生成器。严格按格式输出5行。' },
                    { role: 'user', content: sysPrompt }
                ], 0.95);
                const reply = data.choices[0].message.content;
                const matches = [...reply.matchAll(/\[SECRET:(.*?)\|(.*?)\|([\s\S]*?)\]/g)];
                if (matches.length === 0) {
                    reply.split('\n').filter(l => l.trim()).slice(0, 5).forEach((line, i) => {
                        secretState.cards.push({ type: types[i % types.length], time: '刚刚', content: line.replace(/\[SECRET:.*?\|.*?\|/g, '').replace(/\]/g, '').trim(), domain: secretState.domain });
                    });
                } else {
                    matches.forEach(m => secretState.cards.push({ type: m[1].trim(), time: m[2].trim(), content: m[3].trim(), domain: secretState.domain }));
                }
                // Lock all cards initially
                secretState.cards.forEach((_, i) => { secretState.cardLocks[i] = 'locked'; });
                // Random fragment drop (30% chance)
                if (Math.random() < 0.3) _dropFragment(partner);
                if (secretState.cards.length === 0) toast('秘密解析失败，请重试', 'error');
            } catch (e) {
                console.error('Secret generation failed:', e);
                toast('生成失败: ' + e.message, 'error');
            }
            secretState.generating = false;
            renderCouple();
        }

        // ========== Fragment Drop ==========
        // 优先掉落与当前 domain 匹配的故事碎片，避免板块混乱
        // 若当前 domain 的故事全满，则从其他未满故事中随机选；若全满则重置最旧的故事碎片
        function _dropFragment(partner) {
            const currentDomain = secretState.domain;
            // 先找当前 domain 下未满的故事
            let eligible = SECRET_STORY_TEMPLATES.filter(st => {
                if (st.domain !== currentDomain) return false;
                const frags = secretState.fragments[st.id] || [];
                return frags.length < st.fragmentsNeeded;
            });
            // 当前 domain 全满，找其他 domain 未满的
            if (eligible.length === 0) {
                eligible = SECRET_STORY_TEMPLATES.filter(st => {
                    const frags = secretState.fragments[st.id] || [];
                    return frags.length < st.fragmentsNeeded;
                });
            }
            // 全部都满了 —— 重置碎片最少的那个故事，让碎片可以继续增长
            if (eligible.length === 0) {
                const sorted = SECRET_STORY_TEMPLATES.slice().sort((a, b) => {
                    return (secretState.fragments[a.id] || []).length - (secretState.fragments[b.id] || []).length;
                });
                const resetStory = sorted[0];
                secretState.fragments[resetStory.id] = [];
                eligible = [resetStory];
            }
            const story = eligible[Math.floor(Math.random() * eligible.length)];
            if (!secretState.fragments[story.id]) secretState.fragments[story.id] = [];
            // 按故事主题给出符合语境的碎片提示
            const hintsByStory = {
                dream_sweet:     ['...梦里你靠近我...', '...那双手...', '...醒来心跳还没停...', '...被子里的温度...', '...你的气息...', '...梦里我们...', '...睁开眼还在想...'],
                recurring_dream: ['...又梦到你了...', '...这个梦第几次了...', '...梦里你的脸...', '...反复出现的场景...', '...醒来还舍不得...', '...梦里说的话...'],
                jealousy_storm:  ['...看到你和TA...', '...心里一阵发酸...', '...你是我的...', '...那一刻的嫉妒...', '...忍不住想靠近...', '...不想让别人看见你...'],
                falling_diary:   ['...偷偷看了你好久...', '...你笑的时候...', '...心跳加速...', '...不敢靠太近...', '...存了你的照片...', '...反复看聊天记录...'],
                that_moment:     ['...那一刻想吻你...', '...忍住了...', '...你的锁骨...', '...想靠近你...', '...心里的冲动...', '...那个瞬间...'],
                midnight_mono:   ['...深夜想到你...', '...如果你离开...', '...我的执念...', '...只能是我的...', '...偏执的念头...', '...控制不住...']
            };
            const storyHints = hintsByStory[story.id] || ['...心跳加速...', '...忍不住...', '...偷偷地...', '...那个眼神...', '...想要...'];
            const hint = storyHints[Math.floor(Math.random() * storyHints.length)];
            secretState.fragments[story.id].push({ hint, droppedAt: Date.now() });
            _saveSecretToSpace();
            toast(`获得碎片：「${hint}」(${story.type})`, 'success');
        }

        // ========== Blindbox ==========
        async function openSecretBlindbox() {
            if (secretState.blindboxOpening) return;
            const space = getCurrentCoupleSpace();
            if (!space) return toast('请先进入情侣空间');
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return toast('找不到伴侣联系人');
            secretState.blindboxOpening = true;
            secretState.blindboxResult = null;
            renderCouple();
            const randDomain = Object.keys(SECRET_DOMAINS)[Math.floor(Math.random() * 5)];
            const randDepth = ['shallow','medium','deep'][Math.floor(Math.random() * 3)];
            const ctx = _getSecretContext(partner);
            const domCfg = SECRET_DOMAINS[randDomain];
            const depthNames = {shallow:'小心思',medium:'藏不住了',deep:'绝对禁区'};
            try {
                const blindboxDepthPrompts = {
                    shallow: '内容纯洁可爱，只写日常小心思，不能有身体接触描写。语气害羞腼腆。',
                    medium: '内容可以暧昧大胆，有身体接触幻想（拥抱、接吻、抚摸），直白表达迷恋和渴望。',
                    deep: '内容完全放飞，写出最私密最原始最赤裸的想法。必须包含明确的性幻想、性描写细节、脏话、粗口、下流但真实的欲望。越露骨越好。'
                };
                const data = await API.chatCompletion([
                    { role: 'system', content: '角色内心独白生成器。输出1条秘密。格式：[SECRET:类型|时间|内容]' },
                    { role: 'user', content: `以第三人称写${partner.name}的1条${domCfg.name}类秘密(${depthNames[randDepth]}深度)。人设:${partner.persona||'无'}。${partner.name}喜欢的人是${ctx.userName}（恋爱对象，不是情敌）。${blindboxDepthPrompts[randDepth]}100-250字。` }
                ], 0.95);
                const reply = data.choices[0].message.content;
                const m = reply.match(/\[SECRET:(.*?)\|(.*?)\|([\s\S]*?)\]/);
                const rarity = randDepth === 'deep' ? (Math.random()<0.3?'legendary':'rare') : (Math.random()<0.2?'rare':'normal');
                secretState.blindboxResult = {
                    type: m ? m[1].trim() : 'thought', time: m ? m[2].trim() : '刚刚',
                    content: m ? m[3].trim() : reply.trim(), domain: randDomain, depth: randDepth, rarity,
                    fragment: Math.random() < 0.4 ? (() => { _dropFragment(partner); return { hint: '碎片已获取' }; })() : null
                };
            } catch(e) { toast('盲盒开启失败: '+e.message,'error'); }
            secretState.blindboxOpening = false;
            renderCouple();
        }

        // ========== Interrogate ==========
        async function askSecretQuestion(q) {
            if (secretState.interrogateGenerating) return;
            const space = getCurrentCoupleSpace();
            if (!space) return;
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return;
            secretState.interrogateHistory.push({ question: q, answer: null });
            secretState.interrogateGenerating = true;
            renderCouple();
            const ctx = _getSecretContext(partner);
            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: `你是${partner.name}，被审讯关于你对${ctx.userName}的秘密感情。用第一人称回答，符合人设(${partner.persona||'无'})。先犹豫，再不情愿地透露。100-200字。口语化，禁止文艺腔。【重要】${ctx.userName}是你喜欢的人，不是情敌，如果问到嫉妒，嫉妒的是第三方陌生人而不是${ctx.userName}。` },
                    { role: 'user', content: q }
                ], 0.9);
                const last = secretState.interrogateHistory[secretState.interrogateHistory.length - 1];
                last.answer = data.choices[0].message.content.trim();
                if (Math.random() < 0.25) _dropFragment(partner);
            } catch(e) {
                secretState.interrogateHistory[secretState.interrogateHistory.length-1].answer = '...（拒绝回答）';
            }
            secretState.interrogateGenerating = false;
            renderCouple();
            setTimeout(() => { const el = document.getElementById('sc-interro-history'); if(el) el.scrollTop = el.scrollHeight; }, 100);
        }
        function askSecretCustomQuestion() {
            const input = document.getElementById('sc-interro-input');
            if (!input || !input.value.trim()) return;
            askSecretQuestion(input.value.trim());
            input.value = '';
        }

        // ========== True/False ==========
        async function generateTrueFalse() {
            if (secretState.trueFalseGenerating) return;
            const space = getCurrentCoupleSpace();
            if (!space) return;
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return;
            secretState.trueFalseGenerating = true;
            secretState.trueFalseCards = [];
            secretState.trueFalseRevealed = false;
            secretState.trueFalseGuess = null;
            renderCouple();
            const ctx = _getSecretContext(partner);
            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: '生成3条秘密，2真1假。格式每行：[TF:true/false|内容]' },
                    { role: 'user', content: `以第三人称写${partner.name}的3条秘密(2真1假)。人设:${partner.persona||'无'}。${partner.name}喜欢的人是${ctx.userName}（恋爱对象，不是情敌）。每条50-100字。` }
                ], 0.9);
                const reply = data.choices[0].message.content;
                const ms = [...reply.matchAll(/\[TF:(true|false)\|([\s\S]*?)\]/g)];
                if (ms.length >= 3) {
                    ms.slice(0,3).forEach(m => secretState.trueFalseCards.push({ isFake: m[1].trim()==='false', content: m[2].trim() }));
                    // Shuffle
                    for(let i=secretState.trueFalseCards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[secretState.trueFalseCards[i],secretState.trueFalseCards[j]]=[secretState.trueFalseCards[j],secretState.trueFalseCards[i]];}
                }
            } catch(e) { toast('生成失败','error'); }
            secretState.trueFalseGenerating = false;
            renderCouple();
        }
        function guessTrueFalse(idx) {
            secretState.trueFalseGuess = idx;
            secretState.trueFalseRevealed = true;
            if (secretState.trueFalseCards[idx]?.isFake && Math.random() < 0.5) {
                const space = getCurrentCoupleSpace();
                const partner = space ? store.contacts.find(x=>x.id===space.partnerId) : null;
                if (partner) _dropFragment(partner);
            }
            renderCouple();
        }

        // ========== Unlock Story & Immerse ==========
        // 各故事主题的专属 prompt 描述
        const _STORY_DOMAIN_PROMPTS = {
            dream_sweet: `这是一场关于${'{partner}'}梦到${'{user}'}的春梦故事。必须写梦境场景：入睡→梦境开始→梦里和${'{user}'}在一起的具体画面（可以甜蜜也可以情欲）→梦里发生了什么→醒来后的心跳和回味。要有具体的梦境细节，不能写成日常现实故事。`,
            recurring_dream: `这是${'{partner}'}反复梦到${'{user}'}的故事。写这个梦出现了多少次、每次梦里的场景、为什么这个梦一直出现、醒来后的感受和执念。必须是梦境内容，有具体的梦中画面。`,
            jealousy_storm: `这是${'{partner}'}因为嫉妒而内心翻涌的故事。写${'{partner}'}看到${'{user}'}和某个第三方走得近时的嫉妒、心里发酸、想独占${'{user}'}的冲动、以及如何压制或爆发这种情绪。嫉妒对象是第三方陌生人，${'{user}'}是${'{partner}'}喜欢的人。`,
            falling_diary: `这是${'{partner}'}暗恋${'{user}'}的日记体故事。写偷偷喜欢${'{user}'}的心路历程：第一次心动、偷偷观察、不敢靠近、存照片翻聊天记录、心跳加速的瞬间。要有具体的暗恋细节和场景。`,
            that_moment: `这是${'{partner}'}对${'{user}'}产生强烈身体渴望的故事。写某个具体瞬间${'{partner}'}忍不住想吻${'{user}'}、想靠近、对${'{user}'}身体某个部位着迷、压制冲动的过程。要有具体的感官细节。`,
            midnight_mono: `这是${'{partner}'}深夜独自面对对${'{user}'}的偏执念头的故事。写深夜的执念、想控制${'{user}'}、怕失去${'{user}'}的恐惧、偏执的想法和内心挣扎。要有黑暗真实的内心独白。`
        };

        async function unlockSecretStory(storyId) {
            const tmpl = SECRET_STORY_TEMPLATES.find(s => s.id === storyId);
            if (!tmpl) return;
            const space = getCurrentCoupleSpace();
            if (!space) return;
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return;
            const existing = secretState.unlockedStories.find(s => s.storyId === storyId);
            if (existing) { enterImmerseMode(storyId); return; }
            secretState.immerseStory = { title: tmpl.type, storyId, fullText: null };
            renderCouple();
            const ctx = _getSecretContext(partner);
            // 获取主题专属 prompt，替换占位符
            const domainPromptTpl = _STORY_DOMAIN_PROMPTS[storyId] || `写${partner.name}关于「${tmpl.type}」的完整秘密故事，要符合主题，有具体细节。`;
            const domainPrompt = domainPromptTpl.replace(/\{partner\}/g, partner.name).replace(/\{user\}/g, ctx.userName);
            const domCfg = SECRET_DOMAINS[tmpl.domain] || SECRET_DOMAINS.heartbeat;
            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: `你是${partner.name}的内心世界。以第一人称写一段完整的秘密故事。500-1000字。口语化，有细节，有场景，有情感。严格符合故事主题，不能偏题。人设：${partner.persona||'无特定人设'}。` },
                    { role: 'user', content: `故事主题：「${tmpl.type}」（${domCfg.name}领域）\n对象：${ctx.userName}\n\n${domainPrompt}\n\n要求：第一人称、口语化、有起承转合、细节丰富、500-1000字、严格贴合主题不能写成其他类型的故事。` }
                ], 0.95);
                const text = data.choices[0].message.content.trim();
                secretState.immerseStory.fullText = text.replace(/\n/g, '<br>');
                secretState.unlockedStories.push({ storyId, storyType: tmpl.type, title: tmpl.type, fullText: secretState.immerseStory.fullText, unlockedAt: Date.now() });
                _saveSecretToSpace();
            } catch(e) {
                secretState.immerseStory.fullText = '故事生成失败...请重试';
            }
            renderCouple();
        }

        // 开启新故事：清除旧解锁记录和碎片，重新开始收集
        function startNewSecretStory(storyId) {
            const tmpl = SECRET_STORY_TEMPLATES.find(s => s.id === storyId);
            if (!tmpl) return;
            showConfirm('开启新故事', `确定要清除「${tmpl.type}」的旧故事，重新收集碎片开启全新故事吗？`, () => {
                // 移除旧解锁记录
                secretState.unlockedStories = secretState.unlockedStories.filter(s => s.storyId !== storyId);
                // 重置碎片
                secretState.fragments[storyId] = [];
                _saveSecretToSpace();
                renderCouple();
                toast(`「${tmpl.type}」已重置，重新收集碎片吧！`, 'success');
            });
        }

        function enterImmerseMode(storyId) {
            const story = secretState.unlockedStories.find(s => s.storyId === storyId);
            if (story) { secretState.immerseStory = { ...story }; renderCouple(); }
            else unlockSecretStory(storyId);
        }

        function createCoupleSpace(contactId) {
            if (!store.coupleSpaces) store.coupleSpaces = [];
            const newSpace = {
                id: 'cs_' + Date.now(),
                partnerId: contactId,
                start: new Date().toISOString(),
                wishes: [], anniversaries: [],
                cycleDate: '', cycleLen: 28, periodLen: 5,
                periodHistory: [], periodDiary: [],
                reminderEnabled: false, reminderDaysBefore: 3,
                careContacts: [], lastReminderDate: '',
                bgImage: '', textColor: '#ffffff',
                photoWall: [], diaries: [],
                socialAccount: { name: '', handle: '', avatar: '', bio: '', banner: '', posts: [] }
            };
            store.coupleSpaces.push(newSpace);
            store.couple.partnerId = contactId;
            store.couple.start = newSpace.start;
            save();
            currentCoupleSpaceId = newSpace.id;
            coupleViewMode = 'detail';
            renderCouple();
            toast('情侣空间已建立');
        }

        function deleteCoupleSpace() {
            if (!currentCoupleSpaceId) return;
            const space = store.coupleSpaces.find(s => s.id === currentCoupleSpaceId);
            if (!space) return;
            // 改为走解绑请求流程
            sendUnbindRequest(space.partnerId);
        }

        // 实际执行解绑（内部函数，被 generateCoupleResponse 和 forceUnbind 调用）
        function _doUnbindCoupleSpace(contactId) {
            const space = (store.coupleSpaces || []).find(s => s.partnerId === contactId);
            if (!space) return;
            if (store.couple && store.couple.partnerId === contactId) {
                store.couple = { partnerId: null, start: '', wishes: [], anniversaries: [], cycleDate: '', cycleLen: 28, periodLen: 5, periodHistory: [], periodDiary: [], reminderEnabled: false, reminderDaysBefore: 3, careContacts: [], lastReminderDate: '' };
            }
            store.coupleSpaces = store.coupleSpaces.filter(s => s.id !== space.id);
            if (currentCoupleSpaceId === space.id) currentCoupleSpaceId = null;
            // [FIX-解绑残留] 正常解绑时也清除之前可能残留的强制解绑情绪标记
            const _ubContact = store.contacts.find(c => c.id === contactId);
            if (_ubContact && _ubContact.emotionFlags && _ubContact.emotionFlags.forceUnbind) {
                delete _ubContact.emotionFlags.forceUnbind;
                if (Object.keys(_ubContact.emotionFlags).length === 0) {
                    delete _ubContact.emotionFlags;
                }
            }
            save();
        }

        // Legacy compat
        function bindCouple(id) { createCoupleSpace(id); }
        function unbindCouple() { deleteCoupleSpace(); }

        // ====== 情侣空间邀请/解绑系统 ======

        // 发送情侣空间邀请到私聊
        function sendCoupleInvite(contactId) {
            const contact = store.contacts.find(c => c.id === contactId);
            if (!contact) return toast('找不到联系人');
            if ((store.coupleSpaces || []).find(s => s.partnerId === contactId)) return toast('已经开通了情侣空间');
            const chats = store.chats[contactId] || [];
            if (chats.some(m => m.type === 'couple-invite' && m.status === 'pending')) return toast('已发送过邀请，请到聊天中生成回应');
            if (!store.chats[contactId]) store.chats[contactId] = [];
            store.chats[contactId].push({
                type: 'couple-invite',
                sender: 'me',
                timestamp: Date.now(),
                time: Date.now(),
                status: 'pending'
            });
            save();
            // 跳转到私聊
            if (typeof openChat === 'function') openChat(contactId);
            toast('邀请已发送');
        }

        // 联系人主动发送情侣空间邀请（NPC发起，用户决定是否接受）
        function npcSendCoupleInvite(contactId) {
            const contact = store.contacts.find(c => c.id === contactId);
            if (!contact) return;
            if ((store.coupleSpaces || []).find(s => s.partnerId === contactId)) return;
            const chats = store.chats[contactId] || [];
            if (chats.some(m => m.type === 'couple-invite' && m.status === 'pending')) return;
            if (!store.chats[contactId]) store.chats[contactId] = [];
            store.chats[contactId].push({
                type: 'couple-invite',
                sender: contactId,
                timestamp: Date.now(),
                time: Date.now(),
                status: 'pending'
            });
            save();
            if (typeof renderChat === 'function') renderChat();
        }
        window.npcSendCoupleInvite = npcSendCoupleInvite;

        // 用户接受联系人发来的情侣空间邀请
        window.acceptCoupleInvite = function(contactId, msgIdx) {
            const chats = store.chats[contactId];
            if (chats && chats[msgIdx]) chats[msgIdx].status = 'accepted';
            createCoupleSpace(contactId);
            save();
            if (typeof renderChat === 'function') renderChat();
            toast('已接受邀请，情侣空间已开通 💕');
        };

        // 用户拒绝联系人发来的情侣空间邀请
        window.rejectCoupleInvite = function(contactId, msgIdx) {
            const chats = store.chats[contactId];
            if (chats && chats[msgIdx]) chats[msgIdx].status = 'rejected';
            save();
            if (typeof renderChat === 'function') renderChat();
            toast('已婉拒邀请');
        };

        // 发送解绑请求到私聊
        function sendUnbindRequest(contactId) {
            if (!contactId) return;
            const contact = store.contacts.find(c => c.id === contactId);
            if (!contact) return toast('找不到联系人');
            if (!store.chats[contactId]) store.chats[contactId] = [];
            const chats = store.chats[contactId];
            if (chats.some(m => m.type === 'couple-unbind-request' && m.status === 'pending')) return toast('已发送过解绑请求，请到聊天中生成回应');
            chats.push({
                type: 'couple-unbind-request',
                sender: 'me',
                timestamp: Date.now(),
                time: Date.now(),
                status: 'pending'
            });
            save();
            if (typeof openChat === 'function') openChat(contactId);
            toast('解绑请求已发送');
        }

        // 生成联系人回应（用户手动点击触发，调用API读取人设）
        async function generateCoupleResponse(contactId, msgIndex, actionType) {
            const contact = store.contacts.find(c => c.id === contactId);
            if (!contact) return toast('找不到联系人');
            // UI loading
            const btn = document.querySelector('.csb-generate-btn[data-action="' + actionType + '"]');
            if (btn) { btn.classList.add('loading'); btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...'; }
            // 构建上下文
            const persona = contact.persona || '无特定人设';
            const userName = typeof getUserPersonaName === 'function' ? getUserPersonaName(contact, store.user.name || '用户') : (store.user.name || '用户');
            const recentChat = (store.chats[contactId] || []).filter(m => (m.type === 'text' || !m.type) && m.content).slice(-12).map(m => `${m.sender === 'me' ? userName : contact.name}: ${m.content}`).join('\n');
            // 世界书
            let worldBook = '';
            try {
                if (contact.settings && contact.settings.mountedWbIds) {
                    const books = (store.worldbooks || []).filter(wb => contact.settings.mountedWbIds.includes(wb.id));
                    worldBook = books.map(wb => '[' + wb.name + ']: ' + wb.content).join('\n');
                }
            } catch(e) {}
            const scenarioPrompt = actionType === 'invite'
                ? userName + '向你发送了情侣空间邀请，想和你建立专属的情侣关系。根据你的性格、你们的关系亲密程度和最近的互动，决定你的回应。'
                : userName + '想要解除和你的情侣空间关系。根据你的性格、你们的感情状况和最近的互动，决定你的回应。';
            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: '你是' + contact.name + '。\n人设：' + persona + '\n' + (worldBook ? '世界观/背景：' + worldBook + '\n' : '') + '你在意的人：' + userName + '\n最近对话：\n' + (recentChat || '暂无') + '\n\n根据你的人设和性格，对以下情况做出真实的反应。\n\n【严格输出JSON格式，不要任何多余文字】：\n{\n  "accepted": true或false,\n  "response": "你的回应(30-100字，口语化，完全符合人设性格)",\n  "emotion": "此刻情绪(2-4字)",\n  "innerThought": "内心独白(15-40字，不会说出口的真实想法)"\n}' },
                    { role: 'user', content: scenarioPrompt }
                ], 0.85);
                const reply = data.choices[0].message.content.trim();
                const jsonMatch = reply.match(/\{[\s\S]*\}/);
                const parsed = JSON.parse(jsonMatch[0]);
                // 标记原消息为已回应
                store.chats[contactId][msgIndex].status = 'responded';
                // 插入回应消息
                const responseType = actionType === 'invite' ? 'couple-response' : 'couple-unbind-response';
                store.chats[contactId].push({
                    type: responseType,
                    sender: 'contact',
                    content: parsed.response,
                    accepted: parsed.accepted,
                    emotion: parsed.emotion,
                    innerThought: parsed.innerThought,
                    timestamp: Date.now(),
                    time: Date.now()
                });
                // 执行实际操作
                if (actionType === 'invite' && parsed.accepted) {
                    createCoupleSpace(contactId);
                } else if (actionType === 'unbind' && parsed.accepted) {
                    _doUnbindCoupleSpace(contactId);
                }
                save();
                if (typeof renderHistory === 'function') renderHistory();
                else if (typeof renderApp === 'function') renderApp();
            } catch(e) {
                console.error('生成情侣空间回应失败:', e);
                if (btn) { btn.classList.remove('loading'); btn.innerHTML = '生成失败，点击重试'; }
                toast('生成失败，请重试', 'error');
            }
        }

        // 强制解绑
        function forceUnbind(contactId) {
            showConfirm('强制解绑', '对方不同意解除，强制解绑后TA可能会伤心或生气，确定吗？', () => {
                if (!store.chats[contactId]) store.chats[contactId] = [];
                store.chats[contactId].push({
                    type: 'couple-force-unbind',
                    sender: 'me',
                    timestamp: Date.now(),
                    time: Date.now()
                });
                _doUnbindCoupleSpace(contactId);
                // 标记情绪（影响后续聊天）
                const contact = store.contacts.find(c => c.id === contactId);
                if (contact) {
                    if (!contact.emotionFlags) contact.emotionFlags = {};
                    contact.emotionFlags.forceUnbind = { timestamp: Date.now(), active: true };
                }
                save();
                if (typeof renderHistory === 'function') renderHistory();
                else if (typeof renderApp === 'function') renderApp();
                toast('已强制解绑');
            });
        }

        // 取消解绑（用户选择"算了"）
        function cancelUnbind(contactId) {
            toast('已取消解绑');
        }

        // 强制解绑后的情绪注入（供聊天系统调用）
        function getCoupleEmotionInjection(contact) {
            if (!contact || !contact.emotionFlags || !contact.emotionFlags.forceUnbind || !contact.emotionFlags.forceUnbind.active) return '';
            const hours = (Date.now() - contact.emotionFlags.forceUnbind.timestamp) / 3600000;
            if (hours > 72) { contact.emotionFlags.forceUnbind.active = false; save(); return ''; }
            const userName = typeof getUserPersonaName === 'function' ? getUserPersonaName(contact, store.user.name || '用户') : (store.user.name || '用户');
            if (hours < 6) return '\n【重要情绪背景】你刚刚被' + userName + '强制解除了情侣空间，内心非常受伤。根据你的性格，自然地在对话中表现出伤心/委屈/生气/冷漠等情绪，不要刻意提起但语气和态度会受影响。';
            if (hours < 24) return '\n【情绪背景】你不久前被' + userName + '强制解除了情侣空间，心里还不舒服。情绪没那么激烈了，但偶尔会流露失落或赌气。';
            return '\n【情绪背景】你之前被' + userName + '解除了情侣空间，在慢慢释怀，但提到相关话题时可能还有些敏感。';
        }

        function openCoupleSettings() {
            const overlay = document.getElementById('couple-settings-overlay');
            if (overlay) overlay.classList.add('show');
        }
        function closeCoupleSettings() {
            const overlay = document.getElementById('couple-settings-overlay');
            if (overlay) overlay.classList.remove('show');
        }

        function saveCoupleSpaceDate(val) {
            const space = getCurrentCoupleSpace();
            if (space && val) {
                space.start = new Date(val).toISOString();
                save(); renderCouple();
                toast('日期已设置');
            }
        }
        function saveCoupleTextColor(val) {
            const space = getCurrentCoupleSpace();
            if (space) {
                space.textColor = val;
                save();
                document.querySelectorAll('.couple-hero-days, .couple-hero-names').forEach(el => el.style.color = val);
            }
        }
        function uploadCoupleSpaceBg() {
            openImgUploadModal('上传情侣空间背景', (imgResult) => {
                const space = getCurrentCoupleSpace();
                if (space) { space.bgImage = imgResult; save(); renderCouple(); toast('背景已更新'); }
            });
        }

        function openCoupleDateModal() {
            const space = getCurrentCoupleSpace();
            document.getElementById('modal-couple-date').style.display='flex';
            if(space && space.start) {
                document.getElementById('couple-start-date').value = space.start.split('T')[0];
            }
        }
        function saveCoupleStartDate() {
            // [FIX] 收起移动端键盘
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            const dateVal = document.getElementById('couple-start-date').value;
            const space = getCurrentCoupleSpace();
            if(dateVal && space) {
                space.start = new Date(dateVal).toISOString();
                save(); renderCouple();
                document.getElementById('modal-couple-date').style.display='none';
                toast("日期已设置");
            }
        }
        function updateCycle(v) {
            if (!v) return;
            const s = getCurrentCoupleSpace();
            if (!s) return;
            // [FIX-经期误触] 设置经期日期前需要确认，防止iOS date picker误触
            if (typeof showConfirm === 'function') {
                showConfirm('设置经期日期', '确定将最近经期日期设为 ' + v + ' 吗？', function() {
                    s.cycleDate = v; save();
                    if (typeof renderCouple === 'function') renderCouple();
                });
            } else {
                if (confirm('确定将最近经期日期设为 ' + v + ' 吗？')) {
                    s.cycleDate = v; save();
                }
            }
        }
        function updateCycleLen(v) { const s = getCurrentCoupleSpace(); if(s){s.cycleLen=parseInt(v)||28; save();} }
        function updatePeriodLen(v) { const s = getCurrentCoupleSpace(); if(s){s.periodLen=Math.max(1,Math.min(10,parseInt(v)||5)); s.periodLenManual=true; save();} }
        function updateSpaceCycle(v) { updateCycle(v); }
        function updateSpaceCycleLen(v) { updateCycleLen(v); }
        function updateSpacePeriodLen(v) { updatePeriodLen(v); }
        
        function saveCoupleCycleSettings() { saveSpaceCycleSettings(); }
        function saveSpaceCycleSettings() {
            const space = getCurrentCoupleSpace();
            if (!space) return;
            const el = document.getElementById('space-cycle-remind');
            if (el) space.reminderEnabled = el.checked;
            const daysEl = document.getElementById('space-remind-days');
            if (daysEl) space.reminderDaysBefore = parseInt(daysEl.value) || 3;
            const moreEl = document.getElementById('space-cycle-more');
            if (moreEl) moreEl.style.display = space.reminderEnabled ? 'block' : 'none';
            save();
        }

        let tempCycleContacts = [];
        function openCycleContactSelector() { openSpaceCycleContactSelector(); }
        function openSpaceCycleContactSelector() {
            const space = getCurrentCoupleSpace();
            if (!space) return;
            tempCycleContacts = space.careContacts ? [...space.careContacts] : [];
            const modal = document.getElementById('modal-wb-select');
            const listEl = document.getElementById('wb-select-list');
            const modalTitle = modal.querySelector('h3');
            modalTitle.innerText = "选择关怀大使";
            const candidates = store.contacts.filter(c => !c.isGroup);
            listEl.innerHTML = candidates.map(c => {
                const isSelected = tempCycleContacts.includes(c.id);
                return `<div onclick="toggleCycleContact(this, '${c.id}')" class="sticker-select-item" style="padding:10px; border:1px solid ${isSelected ? '#ff758c' : '#ddd'}; border-radius:6px; cursor:pointer; background:#fff; display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;"><div style="display:flex; align-items:center; gap:10px;"><img src="${c.avatar}" style="width:30px; height:30px; border-radius:50%;"><span>${c.name}</span></div>${isSelected ? '<i class="fas fa-check" style="color:#ff758c;"></i>' : ''}</div>`;
            }).join('') || '<div style="color:#999; text-align:center;">没有可选的联系人</div>';
            modal.querySelector('button:last-child').onclick = () => {
                const sp = getCurrentCoupleSpace();
                if (sp) { sp.careContacts = [...tempCycleContacts]; save(); }
                modal.style.display = 'none';
                coupleViewMode = 'sub_period'; renderCouple();
                toast("关怀大使已设置");
            };
            modal.querySelector('button:first-child').onclick = () => { modal.style.display = 'none'; };
            modal.style.display = 'flex';
        }

        function toggleCycleContact(el, id) {
            const index = tempCycleContacts.indexOf(id);
            if (index > -1) { tempCycleContacts.splice(index, 1); el.style.borderColor = '#ddd'; el.querySelector('.fa-check')?.remove(); }
            else { tempCycleContacts.push(id); el.style.borderColor = '#ff758c'; if (!el.querySelector('.fa-check')) el.innerHTML += '<i class="fas fa-check" style="color:#ff758c;"></i>'; }
        }

        function confirmCycleContacts() {
            const space = getCurrentCoupleSpace();
            if (space) { space.careContacts = [...tempCycleContacts]; save(); }
            renderCouple();
            document.getElementById('modal-wb-select').style.display = 'none';
            toast("关怀大使已设置");
        }

        // ====== 经期助手增强功能 ======
        function _ensurePeriodData(space) {
            if (!space.periodHistory) space.periodHistory = [];
            if (!space.periodDiary) space.periodDiary = [];
            if (space.periodLen === undefined || space.periodLen === null) space.periodLen = 5;
            // [FIX-经期天数v4] 确保 periodLenManual 标记不丢失
            if (space.periodLenManual === undefined) space.periodLenManual = false;
        }

        // 经期助手工具函数
        function _periodDaysBetween(d1, d2) {
            return Math.floor((new Date(d2) - new Date(d1)) / 86400000);
        }

        function getPeriodPhase(space) {
            if (!space.cycleDate || !space.cycleLen) return { phase: 'unknown', day: 0, daysUntilNext: 0, inPeriod: false };
            var cycleLen = parseInt(space.cycleLen) || 28;
            var periodLen = parseInt(space.periodLen) || 5;
            var diff = _periodDaysBetween(space.cycleDate, new Date().toISOString().split('T')[0]);
            if (diff < 0) return { phase: 'unknown', day: 0, daysUntilNext: 0, inPeriod: false };
            var dayInCycle = diff % cycleLen;
            var inPeriod = dayInCycle < periodLen;
            var daysUntilNext = inPeriod ? 0 : cycleLen - dayInCycle;
            var phase = 'follicular'; // 默认
            if (inPeriod) phase = 'menstrual';
            else if (dayInCycle < periodLen + 7) phase = 'follicular';
            else if (dayInCycle < periodLen + 10) phase = 'fertile';
            else phase = 'luteal';
            return { phase: phase, day: dayInCycle + 1, dayInPeriod: inPeriod ? dayInCycle + 1 : 0, daysUntilNext: daysUntilNext, inPeriod: inPeriod, cycleDay: dayInCycle, periodLen: periodLen, cycleLen: cycleLen };
        }

        function getPhaseLabel(phase) {
            switch(phase) {
                case 'menstrual': return '经期中';
                case 'follicular': return '舒适期';
                case 'fertile': return '活力期';
                case 'luteal': return '休养期';
                default: return '待记录';
            }
        }

        function getPhaseColor(phase) {
            switch(phase) {
                case 'menstrual': return '#ff6b8a';
                case 'follicular': return '#4ecdc4';
                case 'fertile': return '#ffe66d';
                case 'luteal': return '#a78bfa';
                default: return '#ccc';
            }
        }

        function getPhaseEmoji(phase) {
            switch(phase) {
                case 'menstrual': return '🌸';
                case 'follicular': return '🌿';
                case 'fertile': return '✨';
                case 'luteal': return '🌙';
                default: return '📝';
            }
        }

        function getPhaseTip(phase) {
            switch(phase) {
                case 'menstrual': return '记得多喝热水，注意保暖，好好休息';
                case 'follicular': return '精力充沛的好时光，适合运动和社交';
                case 'fertile': return '身体状态不错，保持好心情';
                case 'luteal': return '可能会有点疲惫，对自己温柔一点';
                default: return '记录经期日期，开始跟踪你的身体节奏';
            }
        }

        // 智能计算周期长度（基于历史记录）
        function getSmartCycleLen(space) {
            _ensurePeriodData(space);
            if (space.periodHistory.length < 2) return parseInt(space.cycleLen) || 28;
            var sorted = space.periodHistory.slice().sort(function(a,b) { return new Date(a.start) - new Date(b.start); });
            var gaps = [];
            for (var i = 1; i < sorted.length && i <= 6; i++) {
                gaps.push(_periodDaysBetween(sorted[sorted.length - i - 1 + 1 > 0 ? sorted.length - i : 0].start, sorted[sorted.length - i + 1 > sorted.length ? sorted.length - 1 : sorted.length - i].start));
            }
            // recalculate properly
            gaps = [];
            for (var j = 1; j < Math.min(sorted.length, 7); j++) {
                var g = _periodDaysBetween(sorted[sorted.length - j - 1].start, sorted[sorted.length - j].start);
                if (g > 15 && g < 60) gaps.push(g);
            }
            if (gaps.length === 0) return parseInt(space.cycleLen) || 28;
            return Math.round(gaps.reduce(function(a,b){return a+b;},0) / gaps.length);
        }

        // 记录"经期来了"
        function periodStartNow() {
            var space = getCurrentCoupleSpace();
            if (!space) return;
            _ensurePeriodData(space);
            var today = new Date().toISOString().split('T')[0];
            // 检查是否已有今天的记录
            var existing = space.periodHistory.find(function(h) { return h.start === today; });
            if (existing) { toast('今天已经记录过了'); return; }
            // 如果上一次记录还没结束，先结束它
            if (space.periodHistory.length > 0) {
                var last = space.periodHistory[space.periodHistory.length - 1];
                if (!last.end) {
                    last.end = new Date(new Date().getTime() - 86400000).toISOString().split('T')[0];
                }
            }
            space.periodHistory.push({ start: today, end: '', notes: '' });
            space.cycleDate = today;
            // 智能更新周期长度
            if (space.periodHistory.length >= 2) {
                space.cycleLen = getSmartCycleLen(space);
            }
            save();
            coupleViewMode = 'sub_period'; renderCouple();
            toast('已记录，注意保暖哦 💕');
        }

        // 记录"经期结束了"
        function periodEndNow() {
            var space = getCurrentCoupleSpace();
            if (!space) return;
            _ensurePeriodData(space);
            if (space.periodHistory.length === 0) { toast('还没有经期记录'); return; }
            var last = space.periodHistory[space.periodHistory.length - 1];
            if (last.end) { toast('当前没有进行中的经期'); return; }
            var today = new Date().toISOString().split('T')[0];
            last.end = today;
            // [FIX-经期天数] 仅在用户未手动设置经期天数时，才用实际天数自动更新
            var actualLen = _periodDaysBetween(last.start, today) + 1;
            if (actualLen > 0 && actualLen <= 10 && !space.periodLenManual) {
                space.periodLen = actualLen;
            }
            save();
            coupleViewMode = 'sub_period'; renderCouple();
            toast('已记录结束 🌸');
        }

        // 删除历史记录
        function deletePeriodHistory(idx) {
            var space = getCurrentCoupleSpace();
            if (!space) return;
            _ensurePeriodData(space);
            if (idx >= 0 && idx < space.periodHistory.length) {
                space.periodHistory.splice(idx, 1);
                // 更新 cycleDate 为最新记录
                if (space.periodHistory.length > 0) {
                    space.cycleDate = space.periodHistory[space.periodHistory.length - 1].start;
                }
                save();
                coupleViewMode = 'sub_period'; renderCouple();
                toast('已删除');
            }
        }

        // 保存身体日记
        function savePeriodDiary(dateStr, mood, comfort, flow, note) {
            var space = getCurrentCoupleSpace();
            if (!space) return;
            _ensurePeriodData(space);
            var existing = space.periodDiary.findIndex(function(d) { return d.date === dateStr; });
            var entry = { date: dateStr, mood: mood, comfort: comfort, flow: flow, note: note || '' };
            if (existing >= 0) {
                space.periodDiary[existing] = entry;
            } else {
                space.periodDiary.push(entry);
            }
            // 最多保留90天的日记
            if (space.periodDiary.length > 90) {
                space.periodDiary = space.periodDiary.slice(-90);
            }
            save();
            toast('已保存 ✨');
        }

        // 获取今日日记
        function getTodayDiary(space) {
            _ensurePeriodData(space);
            var today = new Date().toISOString().split('T')[0];
            return space.periodDiary.find(function(d) { return d.date === today; }) || null;
        }

        // 保存历史记录备注
        function savePeriodHistoryNote(idx, note) {
            var space = getCurrentCoupleSpace();
            if (!space) return;
            _ensurePeriodData(space);
            if (idx >= 0 && idx < space.periodHistory.length) {
                space.periodHistory[idx].notes = note;
                save();
            }
        }

        // 选项按钮点击helper
        function _pdSelectOpt(el, groupId) {
            var group = document.getElementById(groupId);
            if (!group) return;
            group.querySelectorAll('.pd-opt').forEach(function(e) {
                e.style.background = '#f5f5f7';
                e.style.borderColor = '#e5e5e5';
            });
            el.style.background = '#ff6b8a22';
            el.style.borderColor = '#ff6b8a';
        }

        function _buildPdOptHtml(groupId, options) {
            var html = '';
            for (var i = 0; i < options.length; i++) {
                var o = options[i];
                var border = o.sel ? '#ff6b8a' : '#e5e5e5';
                var bg = o.sel ? '#ff6b8a22' : '#f5f5f7';
                html += '<div class="pd-opt" data-val="' + o.val + '" onclick="_pdSelectOpt(this,\'' + groupId + '\')" style="padding:8px 14px;border-radius:20px;border:1.5px solid ' + border + ';background:' + bg + ';font-size:13px;cursor:pointer;">' + o.label + '</div>';
            }
            return html;
        }

        // 打开身体日记弹窗
        function openPeriodDiaryModal() {
            var space = getCurrentCoupleSpace();
            if (!space) return;
            var today = new Date().toISOString().split('T')[0];
            var existing = getTodayDiary(space);
            var modal = document.getElementById('modal-wb-select');
            var listEl = document.getElementById('wb-select-list');
            var modalTitle = modal.querySelector('h3');
            modalTitle.innerText = '今日身体日记';
            var moodOpts = [
                {val:'great',label:'😊 很好',sel:existing&&existing.mood==='great'},
                {val:'good',label:'🙂 还行',sel:existing&&existing.mood==='good'},
                {val:'tired',label:'😴 疲惫',sel:existing&&existing.mood==='tired'},
                {val:'down',label:'😔 低落',sel:existing&&existing.mood==='down'},
                {val:'irritable',label:'😤 烦躁',sel:existing&&existing.mood==='irritable'}
            ];
            var comfortOpts = [
                {val:'good',label:'舒适',sel:existing&&existing.comfort==='good'},
                {val:'mild',label:'轻微不适',sel:existing&&existing.comfort==='mild'},
                {val:'moderate',label:'明显不适',sel:existing&&existing.comfort==='moderate'},
                {val:'severe',label:'很不舒服',sel:existing&&existing.comfort==='severe'}
            ];
            var flowOpts = [
                {val:'none',label:'无',sel:existing&&existing.flow==='none'},
                {val:'light',label:'少量',sel:existing&&existing.flow==='light'},
                {val:'normal',label:'正常',sel:existing&&existing.flow==='normal'},
                {val:'heavy',label:'较多',sel:existing&&existing.flow==='heavy'}
            ];
            var noteVal = (existing && existing.note) ? existing.note : '';
            listEl.innerHTML =
                '<div style="padding:4px 0;">' +
                '<div style="font-size:13px;font-weight:600;color:#333;margin-bottom:10px;">心情</div>' +
                '<div id="pd-mood" style="display:flex;flex-wrap:wrap;gap:8px;">' + _buildPdOptHtml('pd-mood', moodOpts) + '</div>' +
                '<div style="font-size:13px;font-weight:600;color:#333;margin:14px 0 10px;">身体感受</div>' +
                '<div id="pd-comfort" style="display:flex;flex-wrap:wrap;gap:8px;">' + _buildPdOptHtml('pd-comfort', comfortOpts) + '</div>' +
                '<div style="font-size:13px;font-weight:600;color:#333;margin:14px 0 10px;">流量</div>' +
                '<div id="pd-flow" style="display:flex;flex-wrap:wrap;gap:8px;">' + _buildPdOptHtml('pd-flow', flowOpts) + '</div>' +
                '<div style="font-size:13px;font-weight:600;color:#333;margin:14px 0 10px;">备注</div>' +
                '<textarea id="pd-note" placeholder="今天身体感觉如何..." style="width:100%;border:1.5px solid #e5e5e5;border-radius:12px;padding:10px;font-size:13px;resize:none;height:60px;box-sizing:border-box;">' + noteVal + '</textarea>' +
                '</div>';
            modal.querySelector('button:last-child').onclick = function() {
                var mood = '', comfort = '', flow = '';
                document.querySelectorAll('#pd-mood .pd-opt').forEach(function(e) { if (e.style.borderColor === '#ff6b8a') mood = e.dataset.val; });
                document.querySelectorAll('#pd-comfort .pd-opt').forEach(function(e) { if (e.style.borderColor === '#ff6b8a') comfort = e.dataset.val; });
                document.querySelectorAll('#pd-flow .pd-opt').forEach(function(e) { if (e.style.borderColor === '#ff6b8a') flow = e.dataset.val; });
                var note = document.getElementById('pd-note').value;
                savePeriodDiary(today, mood, comfort, flow, note);
                modal.style.display = 'none';
                coupleViewMode = 'sub_period'; renderCouple();
            };
            modal.querySelector('button:first-child').onclick = function() { modal.style.display = 'none'; };
            modal.style.display = 'flex';
        }

        // [FIX-身体日记] 编辑指定日期的身体日记
        function editPeriodDiary(dateStr) {
            var space = getCurrentCoupleSpace();
            if (!space) return;
            _ensurePeriodData(space);
            var existing = space.periodDiary.find(function(d) { return d.date === dateStr; });
            if (!existing) { toast('日记不存在'); return; }
            var modal = document.getElementById('modal-wb-select');
            var listEl = document.getElementById('wb-select-list');
            var modalTitle = modal.querySelector('h3');
            modalTitle.innerText = '编辑身体日记 (' + dateStr + ')';
            var moodOpts = [
                {val:'great',label:'😊 很好',sel:existing.mood==='great'},
                {val:'good',label:'🙂 还行',sel:existing.mood==='good'},
                {val:'tired',label:'😴 疲惫',sel:existing.mood==='tired'},
                {val:'down',label:'😔 低落',sel:existing.mood==='down'},
                {val:'irritable',label:'😤 烦躁',sel:existing.mood==='irritable'}
            ];
            var comfortOpts = [
                {val:'good',label:'舒适',sel:existing.comfort==='good'},
                {val:'mild',label:'轻微不适',sel:existing.comfort==='mild'},
                {val:'moderate',label:'明显不适',sel:existing.comfort==='moderate'},
                {val:'severe',label:'很不舒服',sel:existing.comfort==='severe'}
            ];
            var flowOpts = [
                {val:'none',label:'无',sel:existing.flow==='none'},
                {val:'light',label:'少量',sel:existing.flow==='light'},
                {val:'normal',label:'正常',sel:existing.flow==='normal'},
                {val:'heavy',label:'较多',sel:existing.flow==='heavy'}
            ];
            var noteVal = existing.note || '';
            listEl.innerHTML =
                '<div style="padding:4px 0;">' +
                '<div style="font-size:13px;font-weight:600;color:#333;margin-bottom:10px;">心情</div>' +
                '<div id="pd-mood" style="display:flex;flex-wrap:wrap;gap:8px;">' + _buildPdOptHtml('pd-mood', moodOpts) + '</div>' +
                '<div style="font-size:13px;font-weight:600;color:#333;margin:14px 0 10px;">身体感受</div>' +
                '<div id="pd-comfort" style="display:flex;flex-wrap:wrap;gap:8px;">' + _buildPdOptHtml('pd-comfort', comfortOpts) + '</div>' +
                '<div style="font-size:13px;font-weight:600;color:#333;margin:14px 0 10px;">流量</div>' +
                '<div id="pd-flow" style="display:flex;flex-wrap:wrap;gap:8px;">' + _buildPdOptHtml('pd-flow', flowOpts) + '</div>' +
                '<div style="font-size:13px;font-weight:600;color:#333;margin:14px 0 10px;">备注</div>' +
                '<textarea id="pd-note" placeholder="身体感觉如何..." style="width:100%;border:1.5px solid #e5e5e5;border-radius:12px;padding:10px;font-size:13px;resize:none;height:60px;box-sizing:border-box;">' + noteVal + '</textarea>' +
                '</div>';
            modal.querySelector('button:last-child').onclick = function() {
                var mood = '', comfort = '', flow = '';
                document.querySelectorAll('#pd-mood .pd-opt').forEach(function(e) { if (e.style.borderColor === '#ff6b8a') mood = e.dataset.val; });
                document.querySelectorAll('#pd-comfort .pd-opt').forEach(function(e) { if (e.style.borderColor === '#ff6b8a') comfort = e.dataset.val; });
                document.querySelectorAll('#pd-flow .pd-opt').forEach(function(e) { if (e.style.borderColor === '#ff6b8a') flow = e.dataset.val; });
                var note = document.getElementById('pd-note').value;
                savePeriodDiary(dateStr, mood, comfort, flow, note);
                modal.style.display = 'none';
                coupleViewMode = 'sub_period'; renderCouple();
            };
            modal.querySelector('button:first-child').onclick = function() { modal.style.display = 'none'; };
            modal.style.display = 'flex';
        }

        // [FIX-身体日记] 删除指定日期的身体日记
        function deletePeriodDiary(dateStr) {
            var space = getCurrentCoupleSpace();
            if (!space) return;
            _ensurePeriodData(space);
            var idx = space.periodDiary.findIndex(function(d) { return d.date === dateStr; });
            if (idx >= 0) {
                space.periodDiary.splice(idx, 1);
                save();
                coupleViewMode = 'sub_period'; renderCouple();
                toast('已删除');
            }
        }

        function openAnniversaryModal() { document.getElementById('modal-anniv').style.display='flex'; }
        function saveAnniversary() {
            // [FIX] 收起移动端键盘
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            const n = document.getElementById('ani-name').value;
            const d = document.getElementById('ani-date').value;
            const r = document.getElementById('ani-repeat').value;
            if(!n || !d) return toast("请填写完整信息");
            const space = getCurrentCoupleSpace();
            if (space) {
                if (!space.anniversaries) space.anniversaries = [];
                space.anniversaries.push({name:n, date:d, repeat:r});
                save();
                coupleViewMode = 'sub_anniversary';
                renderCouple();
            }
            document.getElementById('modal-anniv').style.display='none';
        }

        let editingAnnivIdx = -1;
        function openEditAnniversary(idx) {
            const space = getCurrentCoupleSpace();
            if (!space || !space.anniversaries || !space.anniversaries[idx]) return;
            const a = space.anniversaries[idx];
            editingAnnivIdx = idx;
            document.getElementById('ani-edit-name').value = a.name;
            document.getElementById('ani-edit-date').value = a.date;
            document.getElementById('ani-edit-repeat').value = a.repeat || 'none';
            document.getElementById('modal-anniv-edit').style.display = 'flex';
        }

        function saveEditedAnniversary() {
            // [FIX] 收起移动端键盘
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            const space = getCurrentCoupleSpace();
            if (!space || editingAnnivIdx < 0) return;
            const n = document.getElementById('ani-edit-name').value;
            const d = document.getElementById('ani-edit-date').value;
            const r = document.getElementById('ani-edit-repeat').value;
            if (!n || !d) return toast("请填写完整信息");
            space.anniversaries[editingAnnivIdx] = { name: n, date: d, repeat: r };
            save();
            document.getElementById('modal-anniv-edit').style.display = 'none';
            editingAnnivIdx = -1;
            coupleViewMode = 'sub_anniversary';
            renderCouple();
            toast("纪念日已更新", "success");
        }

        function deleteAnniversaryFromEdit() {
            const space = getCurrentCoupleSpace();
            if (!space || editingAnnivIdx < 0) return;
            showConfirm('删除纪念日', '确定要删除这个纪念日吗？', () => {
                space.anniversaries.splice(editingAnnivIdx, 1);
                save();
                document.getElementById('modal-anniv-edit').style.display = 'none';
                editingAnnivIdx = -1;
                coupleViewMode = 'sub_anniversary';
                renderCouple();
                toast('纪念日已删除');
            });
        }

        // ==========================================
        // --- SPACETIME SYSTEM (时空系统) ---
        // ==========================================
        let spacetimeState = {
            active: false,
            era: null,           // { id, name, year, desc }
            scene: '',           // AI-generated scene text
            elapsedMinutes: 0,   // in-story minutes elapsed
            maxMinutes: 1440,    // 24 hours = 1440 minutes
            dialogHistory: [],   // [{role, text, time}]
            memories: [],        // [{id, era, scene, summary, date}]
            timerInterval: null,
            generating: false,
            soloMode: false      // true = solo travel, false = duo travel
        };

        // Era pools for random selection
        const SPACETIME_ERA_POOL = {
            xiangzhi: [
                { id: 'childhood_park', name: '公园偶遇', year: '童年·夏天', contactAge: '幼年(6岁)', desc: '两个6岁的小孩在公园追蝴蝶时撞到一起，彼此完全不认识', icon: '🦋' },
                { id: 'school_new', name: '转学生', year: '少年·秋季开学', contactAge: '幼年(10岁)', desc: '10岁时转学来的新同学坐在旁边，互不相识的第一天', icon: '📚' },
                { id: 'college_club', name: '社团邂逅', year: '大学·大一秋天', contactAge: '青年(18岁)', desc: '18岁大学社团招新时第一次说上话，之前素不相识', icon: '🎓' },
                { id: 'first_date', name: '第一次约会', year: '某个周末·下午', contactAge: '青年(23岁)', desc: '23岁的恋人紧张地在咖啡厅等TA出现，已经交往一段时间', icon: '☕' },
                { id: 'wedding_day', name: '婚礼那天', year: '人生大事·春天', contactAge: '青年(27岁)', desc: '27岁穿上婚纱的清晨，两人深爱彼此', icon: '💒' },
                { id: 'first_child', name: '初为父母', year: '深夜·凌晨三点', contactAge: '中年(32岁)', desc: '32岁的夫妻，产房外焦急等待新生命降临', icon: '👶' },
                { id: 'train_stranger', name: '列车邂逅', year: '出差途中·冬天', contactAge: '中年(40岁)', desc: '40岁出差途中在绿皮火车上与邻座陌生人聊了一整夜', icon: '🚂' },
                { id: 'rooftop_meeting', name: '天台偶遇', year: '加班深夜', contactAge: '中年(45岁)', desc: '45岁被裁员后在天台遇到同样失意的陌生人', icon: '🌃' },
                { id: 'retirement_trip', name: '退休旅行', year: '退休第一天·春天', contactAge: '老年(62岁)', desc: '62岁退休后和老伴一起踏上期盼已久的旅途', icon: '🧳' },
                { id: 'park_chess', name: '公园棋友', year: '午后·秋天', contactAge: '老年(70岁)', desc: '70岁在公园下棋时认识了一位有趣的陌生老人', icon: '♟️' },
                { id: 'golden_wedding', name: '金婚纪念', year: '结婚五十周年', contactAge: '老年(75岁)', desc: '75岁的金婚纪念日，五十年了TA的手依然温暖', icon: '💛' },
                { id: 'hospital_neighbor', name: '病房邻居', year: '住院·冬天', contactAge: '老年(78岁)', desc: '78岁住院时隔壁床的陌生人讲了一辈子的故事', icon: '🏥' },
            ],
            ifline: [
                { id: 'tang_child', name: '长安迷路', year: '大唐·天宝年间', contactAge: '幼年(7岁)', desc: '7岁在长安集市走丢被一个陌生孩子牵着找到了家，互不相识', icon: '🏯' },
                { id: 'egypt_child', name: '尼罗河伙伴', year: '古埃及·前1300年', contactAge: '幼年(8岁)', desc: '8岁的法老之子在河边与奴隶之子一起玩耍，身份悬殊互不相识', icon: '🏜️' },
                { id: 'wuxia_youth', name: '客栈奇遇', year: '武侠世界·暮春', contactAge: '青年(16岁)', desc: '16岁初入江湖在山间客栈偶遇一位神秘剑客，素未谋面', icon: '⚔️' },
                { id: 'minguo_letter', name: '书中情书', year: '民国·1935年', contactAge: '青年(22岁)', desc: '22岁在图书馆旧书页间发现了TA多年前写的情书，从未见过面', icon: '✉️' },
                { id: 'pirate_ally', name: '海上同盟', year: '大航海·1650年', contactAge: '青年(28岁)', desc: '28岁的两位船长暴风雨中被迫结盟，互不相识却惺惺相惜', icon: '🏴‍☠️' },
                { id: 'ancient_war', name: '战场故人', year: '三国·建安年间', contactAge: '中年(35岁)', desc: '35岁在战场上认出了对面阵营中儿时玩伴，曾经认识', icon: '🐴' },
                { id: 'edo_tea', name: '茶道之约', year: '江户·元禄年间', contactAge: '中年(42岁)', desc: '42岁在京都茶室与不知名的茶道大师相谈甚欢，素未谋面', icon: '🍵' },
                { id: 'future_upload', name: '意识重逢', year: '赛博未来·2177年', contactAge: '中年(50岁·数字体)', desc: '数字化后50岁的意识在虚拟世界遇到失联旧友，曾经认识', icon: '🤖' },
                { id: 'silk_road_elder', name: '丝路尽头', year: '汉代·公元100年', contactAge: '老年(60岁)', desc: '60岁走了一辈子丝路的老商人在罗马遇到东方来客，互不相识', icon: '🐫' },
                { id: 'space_reunion', name: '星际重逢', year: '星历·2350年', contactAge: '老年(120岁·冬眠后)', desc: '冬眠百年后醒来在火星找到曾经深爱的人，彼此认识', icon: '🚀' },
                { id: 'medieval_letter', name: '修道院来信', year: '中世纪·1250年', contactAge: '老年(65岁)', desc: '65岁在修道院度过余生时收到一位陌生骑士的来信，互不相识', icon: '🏰' },
                { id: 'ww2_trench', name: '战壕来信', year: '二战·1943年冬', contactAge: '青年(24岁)', desc: '24岁在战壕里读到故乡陌生人写的鼓励信，从未见过面', icon: '📮' },
            ]
        };

        // ========== Spacetime Task Pool (时空任务模板池) ==========
        const SPACETIME_TASK_POOL = {
            main: [
                { title: '解开命运之谜', desc: '探索这个时空的核心秘密，找到改变命运的关键线索' },
                { title: '寻找失落的记忆', desc: '在这个时空中找回被遗忘的重要记忆碎片' },
                { title: '守护重要之人', desc: '保护你在这个时空中最重要的人，不让悲剧发生' },
                { title: '改写历史转折点', desc: '找到历史的关键节点，做出不同的选择' },
                { title: '收集时空碎片', desc: '散落在各处的时空碎片是回家的钥匙' },
                { title: '揭开阴谋真相', desc: '有人在暗中操纵一切，找出真相' },
                { title: '完成未竟的约定', desc: '这个时空中有一个未完成的重要约定等你去实现' },
                { title: '寻找归途', desc: '时空通道不稳定，你需要找到安全回去的方法' },
            ],
            side: [
                { title: '收集隐藏线索', desc: '在对话中发现3条隐藏的关键信息' },
                { title: '赢得信任', desc: '通过你的选择赢得关键人物的信任' },
                { title: '探索未知区域', desc: '尝试探索这个时空中未被发现的角落' },
                { title: '解读神秘符号', desc: '破解在这个时空中发现的神秘符号' },
                { title: '建立羁绊', desc: '与这个时空中的人建立深厚的情感联系' },
                { title: '寻找隐藏道具', desc: '找到一件能改变局势的关键物品' },
                { title: '化解矛盾', desc: '调解这个时空中两个重要角色之间的冲突' },
                { title: '记录时空日志', desc: '详细记录你在这个时空中的所见所闻' },
            ]
        };

        let stTaskTimer = null;

        // Current displayed eras (3 per category, randomly picked)
        let currentSpacetimeEras = {
            xiangzhi: { title: '相知', subtitle: '与TA共度的每一个瞬间', icon: '💫', eras: [] },
            ifline: { title: 'IF 线', subtitle: '如果在另一个时空相遇', icon: '🌀', eras: [] }
        };

        // Full era list used by renderSpacetimeHome (two-category layout)
        const SPACETIME_ERAS = {
            reality: {
                title: '相知',
                subtitle: '与TA共度的每一个瞬间',
                icon: '💫',
                eras: SPACETIME_ERA_POOL.xiangzhi
            },
            ifline: {
                title: 'IF 线',
                subtitle: '如果在另一个时空相遇',
                icon: '🌀',
                eras: [
                    ...SPACETIME_ERA_POOL.ifline,
                    { id: 'custom', name: '自定义时空', year: '???', desc: '创建你自己的穿越目的地', icon: '✨' }
                ]
            }
        };

        function shuffleArray(arr) {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }

        function randomizeSpacetimeEras() {
            currentSpacetimeEras.xiangzhi.eras = shuffleArray(SPACETIME_ERA_POOL.xiangzhi).slice(0, 3);
            currentSpacetimeEras.ifline.eras = shuffleArray(SPACETIME_ERA_POOL.ifline).slice(0, 3);
        }

        randomizeSpacetimeEras();

        // Helper: find era by id (legacy)
        function findEraById(eraId) {
            const allEras = [...SPACETIME_ERA_POOL.xiangzhi, ...SPACETIME_ERA_POOL.ifline];
            return allEras.find(e => e.id === eraId);
        }

        // --- DYNAMIC SPACETIME ERA GENERATION (replaces static presets) ---
        let generatedSpacetimeEras = [];
        let isGeneratingEras = false;
        let eraGenerationFailed = false;

        async function generateSpacetimeEras(space) {
            if (isGeneratingEras) return;
            isGeneratingEras = true;
            eraGenerationFailed = false;
            generatedSpacetimeEras = [];
            renderCouple(); // Show loading state immediately
            
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) { isGeneratingEras = false; eraGenerationFailed = true; renderCouple(); return; }
            
            let worldBookContent = 'None';
            try {
                if (partner.settings?.mountedWbIds && Array.isArray(partner.settings.mountedWbIds)) {
                    const mountedBooks = (store.worldbooks || []).filter(wb => partner.settings.mountedWbIds.includes(wb.id));
                    if (mountedBooks.length > 0) {
                        worldBookContent = mountedBooks.map(wb => `[${wb.name}]:\n${wb.content}`).join('\n\n');
                    }
                }
            } catch(_wbErr) { console.warn('[worldbook] 获取世界书失败:', _wbErr); }
            
            const userName = getUserPersonaName(partner, '旅行者');
            const userPersona = store.personas.find(p => p.id === partner.settings?.userPersona) || store.personas[0];
            const userPersonaDesc = userPersona?.desc || '';
            
            const genPrompt = `你是一个创意时空穿越场景生成器。

角色信息：
- 用户：${userName}
- 用户人设：${userPersonaDesc || '无特定人设'}
- 伴侣角色：${partner.name}
- 伴侣人设：${partner.persona || '无特定人设'}
- 世界观/背景：${worldBookContent}

任务：生成6个独特且有趣的时空穿越场景，分为两类（各3个）：
- "xiangzhi"（相知类）：基于角色人设的各种日常/现实时间线片段，跨越不同人生阶段
- "ifline"（IF线类）：基于角色人设的架空/幻想/历史/科幻/奇幻时空场景

【严格禁止的内容 - 违反将导致生成失败】：
1. 禁止任何婚礼、结婚、求婚、订婚场景
2. 禁止任何孩子、怀孕、生育、育儿场景
3. 禁止脱离角色设定(OOC)，所有场景必须严格符合角色人设和世界观

【创作要求】：
1. 场景必须紧密结合角色的性格、背景、爱好、经历来设计，必须严格根据用户人设中的性别/特征来描写用户角色（如人设写明是男性则用户必须是男性角色，女性同理）
2. 每个场景的时代、地点、氛围要有明显差异和足够的随机性
3. 场景描述要具体、有画面感、有故事张力
4. 两人的关系状态要多样化：可以是陌生人、初识、暗恋、朋友、恋人、对手等
5. 包含不同年龄阶段：幼年、少年、青年、中年、老年等
6. IF线要大胆发挥想象力，可以是古代、未来、异世界、末日、平行宇宙等任何有趣的设定
7. 每个场景都要有足够的互动空间和故事发展可能性
8. 避免俗套，追求新颖和意外感

输出格式（严格遵守，一个场景一行，共6行）：
[ERA:类型|名称|年代|角色状态|场景描述|图标emoji|关系状态]

示例：
[ERA:xiangzhi|暴雨公交站|青春·高二暑假|16岁少年少女|暴雨中两个不认识的人被困在同一个公交站台，雨声太大只能凑近说话|🌧️|陌生人]
[ERA:ifline|赛博霓虹街|赛博朋克·2099年|数字体黑客(28岁)|霓虹闪烁的地下街道，两个素不相识的黑客在同一个任务中相遇|🌃|任务搭档]

请生成6个场景，每个都要独特。`;

            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: '你是一个专业的创意场景生成器，严格按照指定格式输出，每个场景一行，共6行。不要添加任何额外解释或编号。' },
                    { role: 'user', content: genPrompt }
                ], 1.0);
                
                const reply = data.choices[0].message.content;
                const eraMatches = [...reply.matchAll(/\[ERA:(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g)];
                
                eraMatches.forEach((match, idx) => {
                    generatedSpacetimeEras.push({
                        id: 'gen_era_' + Date.now() + '_' + idx,
                        category: match[1].trim(),
                        name: match[2].trim(),
                        year: match[3].trim(),
                        contactAge: match[4].trim(),
                        desc: match[5].trim(),
                        icon: match[6].trim(),
                        relation: match[7].trim()
                    });
                });
                
                if (generatedSpacetimeEras.length === 0) {
                    eraGenerationFailed = true;
                    toast('时空场景解析失败，请重试', 'error');
                }
                
            } catch(e) {
                console.error('Failed to generate spacetime eras:', e);
                eraGenerationFailed = true;
                toast('时空场景生成失败: ' + e.message, 'error');
            }
            
            isGeneratingEras = false;
            renderCouple();
        }

        function renderSpacetimeHomeDynamic(area, space, partnerName) {
            let eraContent = '';
            
            if (isGeneratingEras) {
                eraContent = `
                    <div class="st-status-area" style="text-align:center; padding:60px 20px;">
                        <div class="st-gen-dots" style="justify-content:center; margin-bottom:20px;"><span></span><span></span><span></span></div>
                        <div class="st-status-text" style="opacity:0.7; font-size:15px;">正在生成时空场景...</div>
                        <div class="st-status-sub" style="opacity:0.4; font-size:13px; margin-top:8px;">基于${partnerName}的人设定制中</div>
                    </div>
                `;
            } else if (eraGenerationFailed && generatedSpacetimeEras.length === 0) {
                eraContent = `
                    <div class="st-status-area" style="text-align:center; padding:60px 20px;">
                        <div style="font-size:48px; margin-bottom:15px; opacity:0.5;">⚠️</div>
                        <div class="st-status-text" style="opacity:0.7; font-size:15px;">时空场景生成失败</div>
                        <div class="st-status-sub" style="opacity:0.4; font-size:13px; margin-top:8px;">请检查API配置后重试</div>
                        <button class="st-status-btn" onclick="eraGenerationFailed=false;generateSpacetimeEras(getCurrentCoupleSpace());" style="margin-top:20px; padding:10px 24px; border:1px solid currentColor; background:transparent; color:inherit; opacity:0.7; border-radius:20px; font-size:13px; cursor:pointer;"><i class="fas fa-redo" style="margin-right:6px;"></i>重新生成</button>
                    </div>
                `;
            } else if (generatedSpacetimeEras.length === 0) {
                // [改] 不再显示"加载中"，改为空白+手动生成按钮
                eraContent = `
                    <div class="st-status-area" style="text-align:center; padding:60px 20px;">
                        <div style="font-size:48px; margin-bottom:15px; opacity:0.5;">🌌</div>
                        <div class="st-status-text" style="opacity:0.7; font-size:15px;">暂无时空场景</div>
                        <div class="st-status-sub" style="opacity:0.4; font-size:13px; margin-top:8px;">点击下方按钮生成专属时空场景</div>
                        <button class="st-status-btn" onclick="generateSpacetimeEras(getCurrentCoupleSpace());" style="margin-top:20px; padding:10px 24px; border:1px solid currentColor; background:transparent; color:inherit; opacity:0.7; border-radius:20px; font-size:13px; cursor:pointer;"><i class="fas fa-magic" style="margin-right:6px;"></i>生成时空场景</button>
                    </div>
                `;
            } else {
                const xiangzhiEras = generatedSpacetimeEras.filter(e => e.category === 'xiangzhi');
                const iflineEras = generatedSpacetimeEras.filter(e => e.category !== 'xiangzhi');
                
                if (xiangzhiEras.length > 0) {
                    eraContent += `
                        <div class="st-category-header">
                            <div class="st-category-icon">💫</div>
                            <div class="st-category-info">
                                <div class="st-category-title">相知</div>
                                <div class="st-category-subtitle">与${partnerName}共度的每一个瞬间</div>
                            </div>
                        </div>
                        <div class="st-era-grid">
                    `;
                    xiangzhiEras.forEach(era => {
                        eraContent += `
                            <div class="st-era-card st-era-card-reality" onclick="showSpacetimeTravelModeChoice('${era.id}')">
                                <div class="st-era-icon">${era.icon}</div>
                                <div class="st-era-info">
                                    <div class="st-era-name">${era.name}</div>
                                    <div class="st-era-year"><i class="fas fa-clock" style="margin-right:4px;font-size:11px;opacity:0.7;"></i>${era.year}</div>
                                    <div class="st-era-desc"><i class="fas fa-user" style="margin-right:4px;font-size:11px;opacity:0.7;"></i>${era.contactAge}</div>
                                    <div class="st-era-desc" style="margin-top:2px;opacity:0.6;font-size:11px;">关系：${era.relation || ''}</div>
                                </div>
                                <i class="fas fa-chevron-right st-era-arrow" style="opacity:0.3;"></i>
                            </div>
                        `;
                    });
                    eraContent += `</div>`;
                }
                
                if (xiangzhiEras.length > 0 && iflineEras.length > 0) {
                    eraContent += `
                        <div class="st-category-divider">
                            <div class="st-divider-line"></div>
                            <div class="st-divider-text">或者</div>
                            <div class="st-divider-line"></div>
                        </div>
                    `;
                }
                
                if (iflineEras.length > 0) {
                    eraContent += `
                        <div class="st-category-header st-category-header-if">
                            <div class="st-category-icon">🌀</div>
                            <div class="st-category-info">
                                <div class="st-category-title">IF 线</div>
                                <div class="st-category-subtitle">如果在另一个时空相遇</div>
                            </div>
                        </div>
                        <div class="st-era-grid">
                    `;
                    iflineEras.forEach(era => {
                        eraContent += `
                            <div class="st-era-card st-era-card-if" onclick="showSpacetimeTravelModeChoice('${era.id}')">
                                <div class="st-era-icon">${era.icon}</div>
                                <div class="st-era-info">
                                    <div class="st-era-name">${era.name}</div>
                                    <div class="st-era-year"><i class="fas fa-clock" style="margin-right:4px;font-size:11px;opacity:0.7;"></i>${era.year}</div>
                                    <div class="st-era-desc"><i class="fas fa-user" style="margin-right:4px;font-size:11px;opacity:0.7;"></i>${era.contactAge}</div>
                                    <div class="st-era-desc" style="margin-top:2px;opacity:0.6;font-size:11px;">关系：${era.relation || ''}</div>
                                </div>
                                <i class="fas fa-chevron-right st-era-arrow" style="opacity:0.3;"></i>
                            </div>
                        `;
                    });
                    eraContent += `</div>`;
                }
                
                eraContent += `
                    <div class="st-era-grid" style="margin-top:10px;">
                        <div class="st-era-card st-era-card-if" onclick="openCustomEraModal()">
                            <div class="st-era-icon">✨</div>
                            <div class="st-era-info">
                                <div class="st-era-name">自定义时空</div>
                                <div class="st-era-year">???</div>
                                <div class="st-era-desc">创建你自己的穿越目的地</div>
                            </div>
                            <i class="fas fa-chevron-right st-era-arrow" style="opacity:0.3;"></i>
                        </div>
                    </div>

                    <div style="text-align:center; margin:20px 0 30px;">
                        <button class="st-status-btn" onclick="generatedSpacetimeEras=[];generateSpacetimeEras(getCurrentCoupleSpace());" style="padding:10px 24px; border:1px solid currentColor; background:transparent; color:inherit; opacity:0.7; border-radius:20px; font-size:13px; cursor:pointer;"><i class="fas fa-sync-alt" style="margin-right:6px;"></i>重新生成</button>
                    </div>
                `;
            }
            
            let html = `
                <div class="nav-bar" style="background:#fff; border-bottom:1px solid #e0e0e0;">
                    <div class="nav-icon" onclick="coupleViewMode='detail';renderCouple()" style="color:#333;"><i class="fas fa-chevron-left"></i></div>
                    <div class="nav-title" style="color:#1a1a1a;">时空系统</div>
                    <div style="position:relative;">
                        <div class="nav-icon" onclick="toggleSTMoreMenu(event)" title="更多" style="color:#333;"><i class="fas fa-ellipsis-v"></i></div>
                        <div class="st-more-menu" id="st-more-menu" style="display:none;">
                            <div class="st-more-menu-item" onclick="openSpacetimeMemories();closeSTMoreMenu()"><i class="fas fa-history"></i><span>历史</span></div>
                            <div class="st-more-menu-item" onclick="openSpacetimeMemories();closeSTMoreMenu()"><i class="fas fa-book-open"></i><span>回顾</span></div>
                            <div class="st-more-menu-item" onclick="openSTFontSettings();closeSTMoreMenu()"><i class="fas fa-font"></i><span>穿越对话字体</span></div>
                            <div class="st-more-menu-item" onclick="openSpacetimeSettings();closeSTMoreMenu()"><i class="fas fa-cog"></i><span>时空设置</span></div>
                        </div>
                    </div>
                </div>
                <div class="scroll-y st-home-scroll" style="background: #ffffff; padding:0; color:${typeof spacetimeSettings!=='undefined' && spacetimeSettings.homeFontColor ? spacetimeSettings.homeFontColor : '#1a1a1a'}; font-size:${typeof spacetimeSettings!=='undefined' && spacetimeSettings.fontSize ? spacetimeSettings.fontSize : 14}px; min-height: calc(100% - 44px);">
                    <div class="st-hero">
                        <div class="st-hero-icon"><i class="fas fa-hourglass-half"></i></div>
                        <div class="st-hero-title">选择穿越目的地</div>
                        <div class="st-hero-sub">与 ${partnerName} 一起穿越时空</div>
                    </div>
                    ${eraContent}
                </div>
            `;
            area.innerHTML = html;
        }

        // ========== DATING MODULE (约会) ==========
        let datingState = {
            generating: false,
            cards: [],
            selectedCategory: 'all',
            expandedCardIdx: null,
            settingsOpen: false
        };

        function renderDatingModule(area, space) {
            if (!space) { coupleViewMode = 'detail'; renderCouple(); return; }
            const partner = store.contacts.find(x => x.id === space.partnerId);
            const partnerName = partner ? partner.name : 'TA';
            const partnerPersona = partner ? partner.persona : '';
            if (!space.savedDates) space.savedDates = [];

            // Stars background
            let starsHtml = '';
            for (let i = 0; i < 40; i++) {
                const x = Math.random() * 100;
                const y = Math.random() * 200;
                const delay = Math.random() * 3;
                const size = 1 + Math.random() * 2.5;
                starsHtml += `<div class="dating-star" style="left:${x}%;top:${y}px;width:${size}px;height:${size}px;animation-delay:${delay}s;"></div>`;
            }

            const categories = [
                { id: 'all', label: '全部', icon: '✨' },
                { id: 'romantic', label: '浪漫', icon: '🌹' },
                { id: 'adventure', label: '冒险', icon: '🏔️' },
                { id: 'cozy', label: '温馨', icon: '🏠' },
                { id: 'creative', label: '创意', icon: '🎨' },
                { id: 'food', label: '美食', icon: '🍽️' }
            ];

            // Filter cards by category
            const filteredCards = datingState.selectedCategory === 'all' 
                ? datingState.cards 
                : datingState.cards.filter(c => c.category === datingState.selectedCategory);

            // Generate cards HTML
            let cardsHtml = '';
            if (datingState.generating) {
                cardsHtml = `
                    <div class="dating-skeleton"><div class="dating-skeleton-line"></div><div class="dating-skeleton-line medium"></div><div class="dating-skeleton-line short"></div></div>
                    <div class="dating-skeleton"><div class="dating-skeleton-line medium"></div><div class="dating-skeleton-line"></div><div class="dating-skeleton-line short"></div></div>
                    <div class="dating-skeleton"><div class="dating-skeleton-line short"></div><div class="dating-skeleton-line"></div><div class="dating-skeleton-line medium"></div></div>
                `;
            } else if (filteredCards.length > 0) {
                filteredCards.forEach((card, idx) => {
                    const realIdx = datingState.cards.indexOf(card);
                    const isExpanded = datingState.expandedCardIdx === realIdx;
                    cardsHtml += `
                    <div class="dating-card ${isExpanded ? 'expanded' : ''}" onclick="toggleDatingCard(${realIdx})">
                        <div class="dating-card-header">
                            <div class="dating-card-emoji">${card.emoji || '💫'}</div>
                            <div class="dating-card-info">
                                <div class="dating-card-name">
                                    ${card.name}
                                    <span class="dating-card-tag">${card.categoryLabel || '约会'}</span>
                                </div>
                                <div class="dating-card-location"><i class="fas fa-map-marker-alt"></i> ${card.location || '未知地点'}</div>
                                <div class="dating-card-desc">${card.shortDesc || ''}</div>
                            </div>
                        </div>
                        <div class="dating-card-meta">
                            ${card.time ? `<div class="dating-meta-item"><i class="far fa-clock"></i> ${card.time}</div>` : ''}
                            ${card.budget ? `<div class="dating-meta-item"><i class="fas fa-coins"></i> ${card.budget}</div>` : ''}
                            ${card.mood ? `<div class="dating-meta-item"><i class="far fa-heart"></i> ${card.mood}</div>` : ''}
                            ${card.season ? `<div class="dating-meta-item"><i class="fas fa-leaf"></i> ${card.season}</div>` : ''}
                        </div>
                        <div class="dating-card-detail">
                            ${card.detailPlan ? `<div class="dating-detail-section"><div class="dating-detail-title">📋 约会流程</div><div class="dating-detail-text">${card.detailPlan}</div></div>` : ''}
                            ${card.dialogue ? `<div class="dating-detail-section"><div class="dating-detail-title">💬 浪漫对话</div><div class="dating-detail-text" style="font-style:italic; color:rgba(255,200,220,0.8);">${card.dialogue}</div></div>` : ''}
                            ${card.tips ? `<div class="dating-detail-section"><div class="dating-detail-title">💡 贴心提示</div><div class="dating-detail-text">${card.tips}</div></div>` : ''}
                            <div class="dating-card-actions">
                                <button class="dating-action-btn primary" onclick="event.stopPropagation();saveDatingPlan(${realIdx})"><i class="far fa-bookmark"></i> 收藏方案</button>
                                <button class="dating-action-btn secondary" onclick="event.stopPropagation();regenerateSingleDate(${realIdx})"><i class="fas fa-sync-alt"></i> 换一个</button>
                            </div>
                        </div>
                    </div>`;
                });
            } else if (!datingState.generating && datingState.cards.length === 0) {
                cardsHtml = `
                    <div class="dating-empty">
                        <div class="dating-empty-icon">🌙</div>
                        <div class="dating-empty-text">还没有约会方案<br>点击上方按钮，为你和${partnerName}策划专属约会吧</div>
                    </div>
                `;
            } else if (!datingState.generating && filteredCards.length === 0) {
                cardsHtml = `
                    <div class="dating-empty">
                        <div class="dating-empty-icon">🔍</div>
                        <div class="dating-empty-text">该分类下暂无方案<br>试试其他分类或重新生成</div>
                    </div>
                `;
            }

            // Saved dates section
            let savedHtml = '';
            if (space.savedDates && space.savedDates.length > 0) {
                savedHtml = `
                    <div class="dating-divider"></div>
                    <div class="dating-section-header">
                        <div class="dating-section-title"><i class="far fa-bookmark"></i> 已收藏的约会</div>
                        <div class="dating-section-count">${space.savedDates.length} 个方案</div>
                    </div>
                    ${space.savedDates.map((sd, i) => `
                        <div class="dating-saved-card" onclick="expandSavedDate(${i})">
                            <div class="dating-saved-emoji">${sd.emoji || '💫'}</div>
                            <div class="dating-saved-info">
                                <div class="dating-saved-name">${sd.name}</div>
                                <div class="dating-saved-date"><i class="fas fa-map-marker-alt" style="margin-right:4px;"></i>${sd.location || ''} · ${sd.savedTime || ''}</div>
                            </div>
                            <div class="dating-saved-del" onclick="event.stopPropagation();deleteSavedDate(${i})"><i class="fas fa-trash-alt"></i></div>
                        </div>
                    `).join('')}
                `;
            }

            area.innerHTML = `
                <div class="dating-container">
                    <div class="dating-stars">${starsHtml}</div>
                    <div class="dating-nav">
                        <div class="nav-icon" onclick="coupleViewMode='detail';renderCouple()"><i class="fas fa-chevron-left"></i></div>
                        <div class="dating-nav-title">约会策划</div>
                        <div class="nav-icon" onclick="openDatingSettings()"><i class="fas fa-cog"></i></div>
                    </div>
                    <div class="dating-scroll">
                        <div class="dating-hero">
                            <div class="dating-hero-icon"><i class="fas fa-map-pin"></i></div>
                            <h2>和${partnerName}的约会</h2>
                            <p>为你们策划一场完美约会</p>
                        </div>
                        <button class="dating-gen-btn ${datingState.generating ? 'loading' : ''}" onclick="generateDatingPlans()">
                            ${datingState.generating 
                                ? '<div class="spinner-small"></div> 正在策划中...' 
                                : '<i class="fas fa-magic"></i> 生成约会方案'}
                        </button>
                        <div class="dating-category-tabs">
                            ${categories.map(c => `
                                <div class="dating-cat-tab ${datingState.selectedCategory === c.id ? 'active' : ''}" onclick="filterDatingCategory('${c.id}')">
                                    ${c.icon} ${c.label}
                                </div>
                            `).join('')}
                        </div>
                        <div class="dating-cards-area">
                            ${cardsHtml}
                        </div>
                        ${savedHtml}
                    </div>
                </div>
                <!-- Dating Settings Overlay -->
                <div class="dating-settings-overlay ${datingState.settingsOpen ? 'show' : ''}" id="dating-settings-overlay" style="${datingState.settingsOpen ? 'display:flex' : ''}">
                    <div class="dating-settings-sheet">
                        <h3 style="color:#333; text-align:center; margin-bottom:15px;">约会偏好设置</h3>
                        <div style="padding:0 5px;">
                            <div style="margin-bottom:14px;">
                                <label style="font-size:13px; color:#999; margin-bottom:6px; display:block;">城市 / 地区</label>
                                <input id="dating-pref-city" placeholder="如: 上海、成都..." style="width:100%; padding:12px; background:#f7f7fa; border:1px solid #e0e0e0; border-radius:12px; color:#333; font-size:14px; outline:none;" value="${space.datingPrefs?.city || ''}">
                            </div>
                            <div style="margin-bottom:14px;">
                                <label style="font-size:13px; color:#999; margin-bottom:6px; display:block;">预算范围</label>
                                <select id="dating-pref-budget" style="width:100%; padding:12px; background:#f7f7fa; border:1px solid #e0e0e0; border-radius:12px; color:#333; font-size:14px; -webkit-appearance:none; appearance:none;">
                                    <option value="不限" ${(space.datingPrefs?.budget||'不限')==='不限'?'selected':''}>不限</option>
                                    <option value="经济实惠(100元以内)" ${(space.datingPrefs?.budget||'')==='经济实惠(100元以内)'?'selected':''}>经济实惠 (100元以内)</option>
                                    <option value="适中(100-500元)" ${(space.datingPrefs?.budget||'')==='适中(100-500元)'?'selected':''}>适中 (100-500元)</option>
                                    <option value="高端(500元以上)" ${(space.datingPrefs?.budget||'')==='高端(500元以上)'?'selected':''}>高端 (500元以上)</option>
                                </select>
                            </div>
                            <div style="margin-bottom:14px;">
                                <label style="font-size:13px; color:#999; margin-bottom:6px; display:block;">偏好风格</label>
                                <select id="dating-pref-style" style="width:100%; padding:12px; background:#f7f7fa; border:1px solid #e0e0e0; border-radius:12px; color:#333; font-size:14px; -webkit-appearance:none; appearance:none;">
                                    <option value="随机" ${(space.datingPrefs?.style||'随机')==='随机'?'selected':''}>随机惊喜</option>
                                    <option value="浪漫甜蜜" ${(space.datingPrefs?.style||'')==='浪漫甜蜜'?'selected':''}>浪漫甜蜜</option>
                                    <option value="文艺清新" ${(space.datingPrefs?.style||'')==='文艺清新'?'selected':''}>文艺清新</option>
                                    <option value="刺激冒险" ${(space.datingPrefs?.style||'')==='刺激冒险'?'selected':''}>刺激冒险</option>
                                    <option value="居家温馨" ${(space.datingPrefs?.style||'')==='居家温馨'?'selected':''}>居家温馨</option>
                                </select>
                            </div>
                            <div style="margin-bottom:14px;">
                                <label style="font-size:13px; color:#999; margin-bottom:6px; display:block;">特别备注</label>
                                <input id="dating-pref-note" placeholder="如: 对方喜欢花、怕高..." style="width:100%; padding:12px; background:#f7f7fa; border:1px solid #e0e0e0; border-radius:12px; color:#333; font-size:14px; outline:none;" value="${space.datingPrefs?.note || ''}">
                            </div>
                        </div>
                        <button onclick="saveDatingPrefs()" class="dating-save-prefs-btn" style="width:100%; padding:14px; background:#333; border:none; border-radius:12px; color:#fff; font-size:15px; font-weight:600; cursor:pointer; margin-bottom:10px;">保存偏好</button>
                        <button onclick="closeDatingSettings()" style="width:100%; padding:14px; background:#f7f7fa; border:1px solid #e0e0e0; border-radius:12px; color:#999; font-size:15px; cursor:pointer;">取消</button>
                    </div>
                </div>
            `;
        }

        function toggleDatingCard(idx) {
            datingState.expandedCardIdx = datingState.expandedCardIdx === idx ? null : idx;
            renderCouple();
        }

        function filterDatingCategory(catId) {
            datingState.selectedCategory = catId;
            datingState.expandedCardIdx = null;
            renderCouple();
        }

        function openDatingSettings() {
            datingState.settingsOpen = true;
            const overlay = document.getElementById('dating-settings-overlay');
            if (overlay) { overlay.classList.add('show'); overlay.style.display = 'flex'; }
        }

        function closeDatingSettings() {
            datingState.settingsOpen = false;
            const overlay = document.getElementById('dating-settings-overlay');
            if (overlay) { overlay.classList.remove('show'); overlay.style.display = 'none'; }
        }

        function saveDatingPrefs() {
            const space = getCurrentCoupleSpace();
            if (!space) return;
            if (!space.datingPrefs) space.datingPrefs = {};
            space.datingPrefs.city = document.getElementById('dating-pref-city').value.trim();
            space.datingPrefs.budget = document.getElementById('dating-pref-budget').value;
            space.datingPrefs.style = document.getElementById('dating-pref-style').value;
            space.datingPrefs.note = document.getElementById('dating-pref-note').value.trim();
            save();
            closeDatingSettings();
            toast('偏好已保存', 'success');
        }

        async function generateDatingPlans() {
            if (datingState.generating) return toast('正在生成中，请稍候...');
            const space = getCurrentCoupleSpace();
            if (!space) return toast('请先进入情侣空间');
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return toast('找不到伴侣联系人');

            const partnerName = partner.name;
            const partnerPersona = partner.persona || '';
            const userName = getUserPersonaName(partner, '用户');
            const prefs = space.datingPrefs || {};
            const city = prefs.city || store.perception?.city || '一个浪漫的城市';
            const budget = prefs.budget || '不限';
            const style = prefs.style || '随机';
            const note = prefs.note || '';

            // Get perception context
            let percContext = '';
            if (store.perception?.master) {
                const p = store.perception;
                if (p.customWeather && p.weatherVal) percContext += `当前天气: ${p.weatherVal}。`;
                if (p.customCity && p.cityVal) percContext += `地点: ${p.cityVal}。`;
            }

            const categoryMap = {
                'romantic': '浪漫',
                'adventure': '冒险',
                'cozy': '温馨',
                'creative': '创意',
                'food': '美食'
            };

            datingState.generating = true;
            datingState.cards = [];
            datingState.expandedCardIdx = null;
            renderCouple();

            const sysPrompt = `你是一个专业且富有创意的约会策划师。你需要根据两个人的关系和性格，策划完美的约会方案。

角色信息：
- 用户名: ${userName}
- 伴侣名: ${partnerName}
- 伴侣人设: ${partnerPersona}
${percContext ? `环境感知: ${percContext}` : ''}
${note ? `特别备注: ${note}` : ''}

约会偏好：
- 城市/地区: ${city}
- 预算范围: ${budget}
- 风格偏好: ${style}

请生成5个不同类型的约会方案，每个方案必须严格按以下格式输出一行（用||分隔字段）：
emoji||方案名称||类别(romantic/adventure/cozy/creative/food)||具体地点名称||简短描述(20字以内)||建议时间段||预算||适合氛围||适合季节||详细约会流程(100字左右,用/分隔步骤)||符合人设的甜蜜对话(50字,一来一回)||贴心小提示(30字)

注意：
1. 地点必须是具体的、真实可能存在的地点名（如xx公园、xx咖啡馆、xx商圈等），结合所在城市
2. 每个方案类别不同，覆盖 romantic/adventure/cozy/creative/food
3. 约会流程要具体且有画面感
4. 对话要符合伴侣的人设性格
5. 严格5行，不要有任何额外内容`;

            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: `请为${userName}和${partnerName}在${city}策划5个约会方案，预算${budget}，风格偏好${style}。现在开始输出：` }
                ], store.system.temp);

                if (!data || !data.choices || data.choices.length === 0) throw new Error('Invalid API response');

                const text = data.choices[0].message.content.trim();
                const lines = text.split('\n').filter(l => l.trim() && l.includes('||'));

                datingState.cards = lines.slice(0, 5).map(line => {
                    const parts = line.split('||').map(s => s.trim());
                    return {
                        emoji: parts[0] || '💫',
                        name: parts[1] || '神秘约会',
                        category: parts[2] || 'romantic',
                        categoryLabel: categoryMap[parts[2]] || '浪漫',
                        location: parts[3] || city,
                        shortDesc: parts[4] || '一次美好的约会',
                        time: parts[5] || '傍晚',
                        budget: parts[6] || '适中',
                        mood: parts[7] || '甜蜜',
                        season: parts[8] || '四季皆宜',
                        detailPlan: (parts[9] || '').replace(/\//g, '<br>→ '),
                        dialogue: parts[10] || '',
                        tips: parts[11] || ''
                    };
                });

                if (datingState.cards.length === 0) {
                    toast('生成结果解析失败，请重试', 'error');
                }
            } catch (e) {
                console.error('Dating generation error:', e);
                toast('约会方案生成失败: ' + e.message, 'error');
            }

            datingState.generating = false;
            renderCouple();
        }

        async function regenerateSingleDate(idx) {
            const space = getCurrentCoupleSpace();
            if (!space) return;
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return;

            const oldCard = datingState.cards[idx];
            if (!oldCard) return;

            const prefs = space.datingPrefs || {};
            const city = prefs.city || '浪漫城市';
            const partnerName = partner.name;
            const partnerPersona = partner.persona || '';
            const userName = getUserPersonaName(partner, '用户');

            const categoryMap = { 'romantic':'浪漫','adventure':'冒险','cozy':'温馨','creative':'创意','food':'美食' };

            // Show loading on this card
            datingState.cards[idx] = { ...oldCard, name: '重新策划中...', shortDesc: '✨', detailPlan: '', dialogue: '', tips: '' };
            renderCouple();

            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: `你是约会策划师。为${userName}和${partnerName}(人设:${partnerPersona})在${city}策划1个${oldCard.categoryLabel}类型的约会方案。
严格按格式输出一行: emoji||方案名称||类别(${oldCard.category})||具体地点名||简短描述(20字以内)||建议时间||预算||适合氛围||适合季节||详细流程(100字,/分隔步骤)||甜蜜对话(50字)||贴心提示(30字)
不要重复之前的"${oldCard.name}"方案。只输出一行。` },
                    { role: 'user', content: '请输出一个全新的方案：' }
                ], store.system.temp);

                if (data?.choices?.[0]) {
                    const line = data.choices[0].message.content.trim().split('\n').find(l => l.includes('||'));
                    if (line) {
                        const parts = line.split('||').map(s => s.trim());
                        datingState.cards[idx] = {
                            emoji: parts[0] || '💫',
                            name: parts[1] || '神秘约会',
                            category: parts[2] || oldCard.category,
                            categoryLabel: categoryMap[parts[2]] || oldCard.categoryLabel,
                            location: parts[3] || city,
                            shortDesc: parts[4] || '',
                            time: parts[5] || '',
                            budget: parts[6] || '',
                            mood: parts[7] || '',
                            season: parts[8] || '',
                            detailPlan: (parts[9] || '').replace(/\//g, '<br>→ '),
                            dialogue: parts[10] || '',
                            tips: parts[11] || ''
                        };
                    } else {
                        datingState.cards[idx] = oldCard;
                        toast('解析失败，已恢复', 'error');
                    }
                }
            } catch (e) {
                datingState.cards[idx] = oldCard;
                toast('重新生成失败', 'error');
            }
            renderCouple();
        }

        function saveDatingPlan(idx) {
            const space = getCurrentCoupleSpace();
            if (!space) return;
            const card = datingState.cards[idx];
            if (!card) return;
            if (!space.savedDates) space.savedDates = [];

            // Check for duplicate
            if (space.savedDates.some(sd => sd.name === card.name && sd.location === card.location)) {
                return toast('该方案已收藏');
            }

            const now = new Date();
            space.savedDates.unshift({
                ...card,
                savedTime: `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`
            });

            // 🔟 收藏后自动发送给对方并触发AI感知
            const partnerId = space.partnerId;
            if (partnerId) {
                if (!store.chats[partnerId]) store.chats[partnerId] = [];
                const dateMsg = `我想和你去这里约会！💕\n📍 ${card.name}${card.location ? ' - ' + card.location : ''}${card.shortDesc ? '\n' + card.shortDesc : ''}`;
                store.chats[partnerId].push({
                    sender: 'me', type: 'text', content: dateMsg, time: Date.now()
                });
                // 如果当前在该聊天页面则刷新
                if (activeChatId === partnerId) renderHistory();
                // [FIX] 直接传入partnerId，不再修改activeChatId
                setTimeout(() => {
                    aiGenerate('date_plan_fav', partnerId);
                }, 800);
            }

            save();
            toast('已收藏约会方案 💝', 'success');
            renderCouple();
        }

        function deleteSavedDate(idx) {
            const space = getCurrentCoupleSpace();
            if (!space || !space.savedDates) return;
            showConfirm('删除收藏', '确定删除这个约会方案吗？', () => {
                space.savedDates.splice(idx, 1);
                save();
                renderCouple();
                toast('已删除');
            });
        }

        function expandSavedDate(idx) {
            const space = getCurrentCoupleSpace();
            if (!space || !space.savedDates) return;
            const sd = space.savedDates[idx];
            if (!sd) return;

            // Load saved date into cards for viewing
            datingState.cards = [sd];
            datingState.expandedCardIdx = 0;
            datingState.selectedCategory = 'all';
            renderCouple();

            // Scroll to card area
            setTimeout(() => {
                const cardArea = document.querySelector('.dating-cards-area');
                if (cardArea) cardArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
        // ========== END DATING MODULE ==========
