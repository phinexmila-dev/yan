// ============================================================
// 人格中枢模块 (Persona Brain)
// ============================================================
// 目标：让联系人像真人——有记忆、有关系、有行为逻辑、有情绪状态
//
// 子系统：
//   1. RelationPermeation  - 关系网渗透（让联系人自然提及身边人）
//   2. EventTimeline       - 事件时间线（聊天/见面/通话/日程统一轴）
//   3. StateMachine        - 状态机（心情/忙碌/签名动态变化）
//   4. MotivationEngine    - 动机引擎（后台主动行为触发）
//   5. PromptBuilder       - 统一prompt构建（裁剪+压缩）
//
// 设计原则：
//   - 纯本地JS计算，不调用API（除MotivationEngine触发时才调用）
//   - 输出紧凑，全部子系统合计控制在 ~200 tokens 以内
//   - 向下兼容现有数据结构（零迁移）
//   - 按需加载：每个子系统可单独启用/禁用
// ============================================================

(function(global) {
    'use strict';

    // ==================== 工具函数 ====================
    function _getStore() {
        if (typeof global.__getAppStore === 'function') {
            const s = global.__getAppStore();
            if (s && typeof s === 'object') return s;
        }
        return (typeof global.store === 'object' && global.store) ? global.store : null;
    }

    function _now() { return Date.now(); }

    function _safeSave() {
        try { if (typeof global.save === 'function') global.save(); } catch (e) {}
    }

    function _daysBetween(t1, t2) {
        return Math.abs(t2 - t1) / (1000 * 60 * 60 * 24);
    }

    function _clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function _formatDateLabel(ts) {
        if (!ts) return '';
        const now = Date.now();
        const diffD = Math.floor((now - ts) / (1000 * 60 * 60 * 24));
        if (diffD === 0) return '今天';
        if (diffD === 1) return '昨天';
        if (diffD === 2) return '前天';
        if (diffD < 7) return diffD + '天前';
        if (diffD < 30) return Math.floor(diffD / 7) + '周前';
        const d = new Date(ts);
        return (d.getMonth() + 1) + '/' + d.getDate();
    }

    // ==================== 1. 关系网渗透 ====================
    // 从 store.relationNetworks[contactId] 中提取"身边人"摘要
    // 输出示例：
    //   [身边人: 小张(同事,关系好), 妈妈(家人), 阿飞(发小,儿时好友)]
    //   你可以自然提起这些人，就像真人会提到朋友/家人一样。
    const RelationPermeation = {
        /**
         * 构建关系网渗透的 prompt 片段
         * @param {string} contactId
         * @param {object} options - { maxChars: 8, compact: true }
         * @returns {string}
         */
        buildPrompt(contactId, options) {
            options = options || {};
            const store = _getStore();
            if (!store || !contactId) return '';

            const rn = store.relationNetworks && store.relationNetworks[contactId];
            if (!rn || !rn.characters || rn.characters.length === 0) return '';

            // 过滤掉内置的 __user__ 和 __contact__，只保留真正的"身边人"
            const sidePeople = rn.characters.filter(c =>
                c && c.id !== '__user__' && c.id !== '__contact__' && c.name
            );
            if (sidePeople.length === 0) return '';

            const maxChars = options.maxChars || 8;
            const picked = sidePeople.slice(0, maxChars);

            // 提取每人的关键信息（名字+身份/关系），避免冗长
            const entries = picked.map(p => {
                const name = (p.name || '').substring(0, 10);
                const rel = (p.contactRelation || p.identity || '').substring(0, 10);
                return rel ? name + '(' + rel + ')' : name;
            }).filter(Boolean);

            if (entries.length === 0) return '';

            // 检查关系线，标记与联系人关系最密切的人（前3名）
            let closeNames = [];
            try {
                const relations = rn.relations || [];
                const contactCharId = '__contact__';
                const closenessMap = {};
                relations.forEach(r => {
                    if (!r) return;
                    const other = r.source === contactCharId ? r.target :
                                  r.target === contactCharId ? r.source : null;
                    if (other) {
                        closenessMap[other] = (closenessMap[other] || 0) + (Number(r.strength) || 1);
                    }
                });
                closeNames = Object.keys(closenessMap)
                    .sort((a, b) => closenessMap[b] - closenessMap[a])
                    .slice(0, 3)
                    .map(id => {
                        const p = sidePeople.find(c => c.id === id);
                        return p ? (p.name || '').substring(0, 10) : '';
                    })
                    .filter(Boolean);
            } catch (e) { /* noop */ }

            let prompt = '\n[身边人(真实存在于你的关系网中): ' + entries.join(', ') + ']';
            if (closeNames.length > 0) {
                prompt += '\n[最亲近的人: ' + closeNames.join(', ') + ']';
            }
            prompt += '\n(可在聊天/朋友圈中自然提及上述人物，就像真人会提到朋友/家人。禁止编造不在列表中的人物。)';

            return prompt;
        },

        /**
         * 获取联系人的关系网人物列表（供其他模块使用）
         */
        getSidePeople(contactId) {
            const store = _getStore();
            if (!store || !contactId) return [];
            const rn = store.relationNetworks && store.relationNetworks[contactId];
            if (!rn || !rn.characters) return [];
            return rn.characters.filter(c =>
                c && c.id !== '__user__' && c.id !== '__contact__' && c.name
            );
        },

        /**
         * 检查某个名字是否在关系网中（用于朋友圈等场景的合法性校验）
         */
        hasPerson(contactId, name) {
            if (!name) return false;
            const people = this.getSidePeople(contactId);
            return people.some(p => p.name && (p.name === name || p.name.includes(name) || name.includes(p.name)));
        }
    };

    // ==================== 2. 事件时间线 ====================
    // 统一的"交互时间线"：整合聊天/见面/通话/邮件/日程等事件
    // 数据源全部是 store 中现有的数据，不需要新增存储结构
    // 输出示例：
    //   [最近事件线: 3天前见过面 → 2天前微信聊过 → 昨天他打过电话]
    const EventTimeline = {
        /**
         * 收集联系人的所有交互事件（按时间排序）
         * 不改写任何数据，只读取汇总
         */
        collectEvents(contactId, options) {
            options = options || {};
            const store = _getStore();
            if (!store || !contactId) return [];
            const events = [];
            const maxDays = options.maxDays || 14;
            const cutoff = Date.now() - maxDays * 24 * 60 * 60 * 1000;

            // 1. 线上聊天（最近一次为一个事件）
            const onlineChats = (store.chats && store.chats[contactId]) || [];
            const lastOnline = onlineChats.filter(m =>
                m && m.time && m.time > cutoff && m.type !== 'offline_text' && m.type !== 'go_offline_text'
            ).pop();
            if (lastOnline) {
                events.push({
                    type: 'online',
                    time: lastOnline.time,
                    label: '微信聊天'
                });
            }

            // 2. 线下见面（最近一次为一个事件）
            const offlineChats = (store.offlineChats && store.offlineChats[contactId]) || [];
            const embeddedOffline = onlineChats.filter(m =>
                m && m.time && m.time > cutoff && (m.type === 'offline_text' || m.type === 'go_offline_text')
            );
            const allOffline = [...offlineChats, ...embeddedOffline].filter(m => m && m.time && m.time > cutoff);
            if (allOffline.length > 0) {
                const lastOffline = allOffline.reduce((a, b) => (a.time > b.time ? a : b));
                events.push({
                    type: 'offline',
                    time: lastOffline.time,
                    label: '见面'
                });
            }

            // 3. 通话记录（通话历史）
            if (store.callHistory && Array.isArray(store.callHistory)) {
                const calls = store.callHistory.filter(c =>
                    c && c.contactId === contactId && c.time && c.time > cutoff
                );
                if (calls.length > 0) {
                    const lastCall = calls.reduce((a, b) => (a.time > b.time ? a : b));
                    events.push({
                        type: 'call',
                        time: lastCall.time,
                        label: (lastCall.duration ? '通话(' + Math.floor(lastCall.duration / 60) + '分钟)' : '通话')
                    });
                }
            }

            // 4. 邮件往来
            if (store.mailbox && Array.isArray(store.mailbox)) {
                const mails = store.mailbox.filter(m =>
                    m && (m.from === contactId || m.to === contactId) && m.time && m.time > cutoff
                );
                if (mails.length > 0) {
                    const lastMail = mails.reduce((a, b) => (a.time > b.time ? a : b));
                    events.push({
                        type: 'mail',
                        time: lastMail.time,
                        label: '邮件往来'
                    });
                }
            }

            // 5. 日程中涉及此联系人的（如果日程数据关联了联系人）
            if (store.scheduleData) {
                try {
                    const todayStr = new Date().toISOString().split('T')[0];
                    Object.entries(store.scheduleData).forEach(([dateKey, list]) => {
                        if (!Array.isArray(list)) return;
                        list.forEach(item => {
                            if (item && item.contactId === contactId && item.time) {
                                if (item.time > cutoff || item.time > Date.now()) {
                                    events.push({
                                        type: 'schedule',
                                        time: item.time,
                                        label: (item.time > Date.now() ? '即将' : '已有') + '日程:' + ((item.title || '').substring(0, 12))
                                    });
                                }
                            }
                        });
                    });
                } catch (e) { /* noop */ }
            }

            // 按时间排序
            events.sort((a, b) => a.time - b.time);
            return events;
        },

        /**
         * 构建事件时间线的 prompt 片段
         */
        buildPrompt(contactId, options) {
            options = options || {};
            const events = this.collectEvents(contactId, { maxDays: options.maxDays || 14 });
            if (events.length === 0) return '';

            const maxEvents = options.maxEvents || 5;
            // 取最近的 N 条
            const recent = events.slice(-maxEvents);

            const lines = recent.map(e => _formatDateLabel(e.time) + e.label);

            // 检测连续事件（比如"见面后第二天微信聊"）来做关系提醒
            let hint = '';
            if (events.length >= 2) {
                const last = events[events.length - 1];
                const prev = events[events.length - 2];
                const gap = _daysBetween(prev.time, last.time);
                if (last.type === 'online' && prev.type === 'offline' && gap < 2) {
                    hint = '(你们刚刚见过面，后续聊天应自然带出见面的话题)';
                } else if (last.type === 'offline' && prev.type === 'online' && gap < 2) {
                    hint = '(你们见面前刚在线上聊过，可以延续之前的话题)';
                }
            }

            // 检查距上次互动多久
            const now = Date.now();
            const latestTime = events[events.length - 1].time;
            const silentDays = _daysBetween(latestTime, now);
            if (silentDays > 7) {
                hint = '(距上次互动已' + Math.floor(silentDays) + '天，久别重逢的语气会更自然)';
            }

            let prompt = '\n[最近事件线: ' + lines.join(' → ') + ']';
            if (hint) prompt += '\n' + hint;
            return prompt;
        },

        /**
         * 获取上次互动的时间戳
         */
        getLastInteractionTime(contactId) {
            const events = this.collectEvents(contactId, { maxDays: 30 });
            return events.length > 0 ? events[events.length - 1].time : 0;
        }
    };

    // ==================== 3. 状态机 ====================
    // 模拟联系人的心情/忙碌度/签名等动态状态
    // 数据存储在 store.personaStates[contactId] 中
    // 状态会随时间衰减（心情回归平静），也会被事件影响（生气的聊天 → 心情变差）
    const StateMachine = {
        /**
         * 确保状态对象存在并执行自然衰减
         */
        ensureState(contactId) {
            const store = _getStore();
            if (!store || !contactId) return null;
            if (!store.personaStates) store.personaStates = {};
            if (!store.personaStates[contactId]) {
                store.personaStates[contactId] = {
                    mood: 'calm',          // calm | happy | sad | angry | excited | tired | busy
                    moodIntensity: 0.3,    // 0.0~1.0
                    busy: 0.3,             // 0.0~1.0 (0=闲, 1=极忙)
                    energy: 0.7,           // 0.0~1.0
                    signature: '',         // 动态签名（可能同步到 contact.signature）
                    lastUpdatedAt: _now(),
                    lastMoodChange: _now()
                };
            }
            // 自然衰减：心情会随时间回归平静
            const st = store.personaStates[contactId];
            const hoursSince = (_now() - (st.lastUpdatedAt || _now())) / (1000 * 60 * 60);
            if (hoursSince > 1) {
                // 每小时衰减 5% 的强度
                st.moodIntensity = _clamp(st.moodIntensity - 0.05 * hoursSince, 0, 1);
                // 忙碌程度也会缓慢回归
                st.busy = _clamp(st.busy + (0.3 - st.busy) * 0.1 * hoursSince, 0, 1);
                // 能量在夜间衰减，白天恢复
                const hr = new Date().getHours();
                if (hr >= 22 || hr < 6) {
                    st.energy = _clamp(st.energy - 0.05 * hoursSince, 0.2, 1);
                } else {
                    st.energy = _clamp(st.energy + 0.05 * hoursSince, 0, 1);
                }
                // 强度衰减到一定阈值后心情回归平静
                if (st.moodIntensity < 0.2 && st.mood !== 'calm') {
                    st.mood = 'calm';
                    st.moodIntensity = 0.2;
                }
                st.lastUpdatedAt = _now();
            }
            return st;
        },

        /**
         * 更新心情（通常由对话分析/事件触发）
         */
        setMood(contactId, mood, intensity) {
            const st = this.ensureState(contactId);
            if (!st) return;
            st.mood = mood || 'calm';
            st.moodIntensity = _clamp(intensity !== undefined ? intensity : 0.6, 0, 1);
            st.lastMoodChange = _now();
            st.lastUpdatedAt = _now();
            _safeSave();
        },

        /**
         * 更新忙碌度（影响回复速度）
         */
        setBusy(contactId, busyLevel) {
            const st = this.ensureState(contactId);
            if (!st) return;
            st.busy = _clamp(busyLevel, 0, 1);
            st.lastUpdatedAt = _now();
            _safeSave();
        },

        /**
         * 获取当前状态描述（自然语言）
         */
        getStateDescription(contactId) {
            const st = this.ensureState(contactId);
            if (!st) return '';

            const moodLabels = {
                calm: '平静', happy: '开心', sad: '低落', angry: '生气',
                excited: '兴奋', tired: '疲惫', busy: '忙碌'
            };
            const moodLabel = moodLabels[st.mood] || '平静';

            const parts = [moodLabel];
            if (st.busy > 0.7) parts.push('很忙');
            else if (st.busy < 0.3) parts.push('清闲');

            if (st.energy < 0.3) parts.push('疲惫');
            else if (st.energy > 0.8) parts.push('精力充沛');

            return parts.join('/');
        },

        /**
         * 构建状态机的 prompt 片段（紧凑版）
         */
        buildPrompt(contactId, options) {
            options = options || {};
            const st = this.ensureState(contactId);
            if (!st) return '';
            // 只在心情不平静或忙碌异常时输出，避免浪费 token
            if (st.mood === 'calm' && st.busy > 0.2 && st.busy < 0.6 && st.energy > 0.4 && st.energy < 0.8) {
                return '';
            }
            const desc = this.getStateDescription(contactId);
            if (!desc) return '';
            return '\n[当前心境: ' + desc + '(会自然流露在对话语气中，但不要生硬宣告)]';
        },

        /**
         * 从记忆系统的情感分析结果直接更新心情
         * emotionType: joy/sadness/anger/surprise/fear/love/neutral
         * emotionScore: 0~1
         */
        applyEmotion(contactId, emotionType, emotionScore) {
            if (!contactId || !emotionType) return;
            const moodMap = {
                joy: 'happy',
                love: 'happy',
                sadness: 'sad',
                anger: 'angry',
                surprise: 'excited',
                fear: 'sad',
                neutral: null
            };
            const mapped = moodMap[emotionType];
            if (!mapped) return;
            const intensity = _clamp(emotionScore !== undefined ? emotionScore : 0.5, 0.3, 0.95);
            this.setMood(contactId, mapped, intensity);
        },

        /**
         * 根据一段文本内容推测心情变化（简单关键词启发式）
         */
        inferMoodFromText(contactId, text) {
            if (!text || typeof text !== 'string') return;
            const t = text.toLowerCase();
            // 关键词匹配
            const moodKeywords = {
                happy: ['开心', '高兴', '快乐', '哈哈', '棒', '爱你', '喜欢', '幸福', 'happy', '太好了'],
                sad: ['难过', '伤心', '哭', '呜', '失望', '委屈', '想哭', '难受', 'sad', '心碎'],
                angry: ['生气', '讨厌', '烦', '气', '滚', '吵架', '不理', '不想理', '算了', 'angry'],
                excited: ['激动', '兴奋', '期待', '超棒', '太棒了', '！！', 'excited'],
                tired: ['累', '困', '疲惫', '不想动', '没力气', 'tired'],
                busy: ['忙', '加班', '赶工', '没时间', '工作']
            };
            let bestMatch = null, bestCount = 0;
            Object.entries(moodKeywords).forEach(([mood, kws]) => {
                const count = kws.reduce((s, kw) => s + (t.includes(kw) ? 1 : 0), 0);
                if (count > bestCount) { bestCount = count; bestMatch = mood; }
            });
            if (bestMatch && bestCount > 0) {
                const intensity = _clamp(0.4 + bestCount * 0.15, 0.4, 0.9);
                this.setMood(contactId, bestMatch, intensity);
            }
        }
    };

    // ==================== 4. 动机引擎 ====================
    // 后台定时触发"主动联系"的时机判断
    // 不改写任何发送逻辑，只给出"现在该主动吗？为什么？"的决策
    const MotivationEngine = {
        /**
         * 检查联系人是否有主动联系的动机
         * @returns {object|null} { reason, urgency, preferredChannel, hint }
         */
        checkMotivation(contactId) {
            const store = _getStore();
            if (!store || !contactId) return null;
            const contact = (store.contacts || []).find(c => c.id === contactId);
            if (!contact || contact.isGroup) return null;

            const now = Date.now();
            const lastInteraction = EventTimeline.getLastInteractionTime(contactId);
            const silentDays = lastInteraction ? _daysBetween(lastInteraction, now) : 999;

            // 动机1：太久没联系（关系依赖）
            if (silentDays > 5 && silentDays < 30) {
                return {
                    reason: 'long_silence',
                    urgency: _clamp(silentDays / 30, 0.3, 0.8),
                    preferredChannel: 'chat',
                    hint: '已有' + Math.floor(silentDays) + '天没联系，想主动问候'
                };
            }

            // 动机2：刚见完面后续（见过面但没后续聊天）
            const events = EventTimeline.collectEvents(contactId, { maxDays: 3 });
            const lastEvent = events[events.length - 1];
            if (lastEvent && lastEvent.type === 'offline') {
                const hoursSinceOffline = (now - lastEvent.time) / (1000 * 60 * 60);
                // 见面后 6~24 小时内还没主动联系
                if (hoursSinceOffline > 6 && hoursSinceOffline < 24) {
                    // 检查是否在见面后已经聊过了
                    const onlineAfter = (store.chats[contactId] || []).some(m =>
                        m && m.time && m.time > lastEvent.time
                    );
                    if (!onlineAfter) {
                        return {
                            reason: 'post_meeting',
                            urgency: 0.6,
                            preferredChannel: 'chat',
                            hint: '今天见过面，想后续聊聊'
                        };
                    }
                }
            }

            // 动机3：节日/纪念日（基于 perception.festivals）
            if (store.perception && store.perception.festivals) {
                const todayStr = new Date().toISOString().slice(0, 10);
                const todayFest = store.perception.festivals.find(f => f && f.date === todayStr);
                if (todayFest) {
                    return {
                        reason: 'festival',
                        urgency: 0.7,
                        preferredChannel: 'chat',
                        hint: '今天是' + todayFest.name + '，想主动发个节日问候'
                    };
                }
            }

            // 动机4：记忆中的待办（比如"你说下周有考试"）
            try {
                if (global.MemorySystem && global.MemorySystem.Recall) {
                    const pendingKws = ['考试', '面试', '生日', '手术', '比赛', '答辩', '出差'];
                    const todayStr = new Date().toISOString().slice(0, 10);
                    const recalled = global.MemorySystem.Recall.recall(contactId, pendingKws.join(' '), {
                        maxResults: 5,
                        minRelevance: 0.2,
                        reinforce: false
                    });
                    for (const r of recalled) {
                        const c = r.memory && r.memory.content || '';
                        for (const kw of pendingKws) {
                            if (c.includes(kw)) {
                                return {
                                    reason: 'memory_followup',
                                    urgency: 0.5,
                                    preferredChannel: 'chat',
                                    hint: '记忆中提到过"' + kw + '"，想主动关心一下'
                                };
                            }
                        }
                    }
                }
            } catch (e) { /* noop */ }

            // 动机5：情侣空间纪念日临近（基于coupleSpaces）
            if (store.coupleSpaces && Array.isArray(store.coupleSpaces)) {
                const couple = store.coupleSpaces.find(s => s && s.partnerId === contactId);
                if (couple && couple.anniversaries) {
                    const todayMMDD = new Date().toISOString().slice(5, 10);
                    const upcoming = couple.anniversaries.find(a => {
                        if (!a || !a.date) return false;
                        return a.date.slice(5, 10) === todayMMDD;
                    });
                    if (upcoming) {
                        return {
                            reason: 'anniversary',
                            urgency: 0.9,
                            preferredChannel: 'chat',
                            hint: '今天是' + upcoming.name + '纪念日'
                        };
                    }
                }
            }

            return null;
        },

        /**
         * 批量检查所有联系人（后台任务调用）
         */
        scanAllContacts() {
            const store = _getStore();
            if (!store || !store.contacts) return [];
            const results = [];
            store.contacts.forEach(c => {
                if (!c || c.isGroup) return;
                const m = this.checkMotivation(c.id);
                if (m) results.push({ contactId: c.id, name: c.name, ...m });
            });
            // 按 urgency 排序
            results.sort((a, b) => (b.urgency || 0) - (a.urgency || 0));
            return results;
        }
    };

    // ==================== 5. 口癖/梗学习系统 ====================
    // 追踪user的高频用词、口癖、梗，让AI渐进式学习
    // 数据存储在 store.catchphraseData[contactId] 中
    // 设计理念：
    //   - 第1次出现：记录但不使用
    //   - 第2-3次出现：偶尔尝试使用，可能用得不太对（更可爱）
    //   - 第4次+：自然内化，正确使用
    const CatchphraseTracker = {
        // 默认配置
        _config: {
            maxPhrases: 20,          // 每个联系人最多追踪20个口癖
            minLength: 2,            // 最短2字
            maxLength: 10,           // 最长10字
            learnThreshold: 2,       // 出现2次开始尝试使用
            masterThreshold: 4,      // 出现4次视为已内化
            decayDays: 30            // 30天没出现则遗忘
        },

        /**
         * 确保数据结构存在
         */
        _ensureData(contactId) {
            const store = _getStore();
            if (!store || !contactId) return null;
            if (!store.catchphraseData) store.catchphraseData = {};
            if (!store.catchphraseData[contactId]) {
                store.catchphraseData[contactId] = {
                    phrases: [],     // [{text, count, firstSeen, lastSeen, stage}]
                    lastAnalyzed: 0
                };
            }
            return store.catchphraseData[contactId];
        },

        /**
         * 从user消息中提取潜在口癖/梗
         * 策略：提取重复出现的短语、语气词模式、网络用语
         */
        _extractCandidates(text) {
            if (!text || typeof text !== 'string' || text.length < 2) return [];
            const candidates = [];
            const clean = text.replace(/[\x00-\x1F]/g, '');

            // 1. 语气词/口癖模式（如"嘛""啦""呀""哈哈哈""绝了""离谱"等）
            const quirks = clean.match(/[哈嘿嘻呵]{2,}|[啊呀嘛啦呢吧哦噢嗯唔]{1,3}$|绝了|离谱|无语|笑死|救命|好家伙|蚌埠住了|绷不住|真的假的|我超|好好好|行行行|6{2,}|哭了|呜呜|嘤嘤|awsl|yyds|xswl|破防|上头|下头|整活|摆烂|卷|润|麻了|寄了|芜湖|好耶|啊这|确实|属于是|典中典|乐了|急了|我不理解|你说得对|有一说一|不是哥们/g) || [];
            quirks.forEach(q => {
                if (q.length >= this._config.minLength && q.length <= this._config.maxLength) {
                    candidates.push(q);
                }
            });

            // 2. 重复使用的表达模式（如"xxx的说""xxx捏""xxx了属于是"）
            const suffixPatterns = clean.match(/[\u4e00-\u9fa5]{1,4}(?:的说|捏|了属于是|就是说|真的会|我真的|说实话|怎么说呢|不会吧|好吧|算了|随便|无所谓)/g) || [];
            suffixPatterns.forEach(p => {
                // 只取后缀部分作为口癖
                const suffix = p.match(/(?:的说|捏|了属于是|就是说|真的会|我真的|说实话|怎么说呢|不会吧|好吧|算了|随便|无所谓)$/);
                if (suffix && suffix[0].length >= this._config.minLength) {
                    candidates.push(suffix[0]);
                }
            });

            // 3. 特殊称呼/昵称（如"宝""哥""姐""老公""老婆""笨蛋"等user对AI的称呼）
            const nicknames = clean.match(/宝[贝宝]?|老[公婆]|[小大]笨蛋|傻[子瓜蛋]|亲[爱]?|[哥姐弟妹]们?|崽[崽]?|bb|babe/g) || [];
            nicknames.forEach(n => {
                if (n.length >= this._config.minLength) candidates.push(n);
            });

            // 去重
            return [...new Set(candidates)];
        },

        /**
         * 分析user的消息，更新口癖追踪数据
         * @param {string} contactId
         * @param {string} userText - user发送的消息文本
         */
        analyze(contactId, userText) {
            const data = this._ensureData(contactId);
            if (!data) return;

            const candidates = this._extractCandidates(userText);
            if (candidates.length === 0) return;

            const now = _now();
            candidates.forEach(phrase => {
                const existing = data.phrases.find(p => p.text === phrase);
                if (existing) {
                    existing.count++;
                    existing.lastSeen = now;
                    // 更新阶段
                    if (existing.count >= this._config.masterThreshold) {
                        existing.stage = 'mastered';  // 已内化
                    } else if (existing.count >= this._config.learnThreshold) {
                        existing.stage = 'learning';  // 学习中
                    }
                } else {
                    // 新口癖，容量检查
                    if (data.phrases.length >= this._config.maxPhrases) {
                        // 淘汰最久没出现的
                        data.phrases.sort((a, b) => a.lastSeen - b.lastSeen);
                        data.phrases.shift();
                    }
                    data.phrases.push({
                        text: phrase,
                        count: 1,
                        firstSeen: now,
                        lastSeen: now,
                        stage: 'observed'  // 仅观察
                    });
                }
            });

            data.lastAnalyzed = now;
            _safeSave();
        },

        /**
         * 执行遗忘衰减（长时间没出现的口癖降级/移除）
         */
        decay(contactId) {
            const data = this._ensureData(contactId);
            if (!data || !data.phrases.length) return;

            const now = _now();
            const decayMs = this._config.decayDays * 24 * 60 * 60 * 1000;

            data.phrases = data.phrases.filter(p => {
                const age = now - p.lastSeen;
                if (age > decayMs) return false; // 超过30天没出现，遗忘
                // 超过15天没出现，降级
                if (age > decayMs / 2 && p.stage === 'mastered') {
                    p.stage = 'learning';
                }
                if (age > decayMs / 2 && p.stage === 'learning') {
                    p.stage = 'observed';
                }
                return true;
            });
        },

        /**
         * 构建口癖学习的 prompt 片段
         * @param {string} contactId
         * @returns {string}
         */
        buildPrompt(contactId) {
            const data = this._ensureData(contactId);
            if (!data || !data.phrases || data.phrases.length === 0) return '';

            // 先执行衰减
            this.decay(contactId);

            const learning = data.phrases.filter(p => p.stage === 'learning');
            const mastered = data.phrases.filter(p => p.stage === 'mastered');

            if (learning.length === 0 && mastered.length === 0) return '';

            let prompt = '\n[口癖学习';
            if (learning.length > 0) {
                prompt += ' | 学习中(偶尔尝试用,可以用得不太对): ' + learning.map(p => '"' + p.text + '"').join(' ');
            }
            if (mastered.length > 0) {
                prompt += ' | 已内化(自然使用): ' + mastered.map(p => '"' + p.text + '"').join(' ');
            }
            prompt += ']';
            prompt += '\n(学习中的口癖偶尔用错/用得生硬是正常的，这样更可爱。已内化的可以自然融入对话。)';

            return prompt;
        },

        /**
         * 获取某联系人的口癖数据（供外部查看）
         */
        getData(contactId) {
            const data = this._ensureData(contactId);
            return data ? data.phrases : [];
        }
    };

    // ==================== 6. 统一 Prompt 构建器 ====================
    // 整合前5个子系统的 prompt 输出，按需开启
    const PromptBuilder = {
        /**
         * 构建完整的"人格中枢"prompt 补充块
         * @param {string} contactId
         * @param {object} options - {
         *     relation: true|false,
         *     timeline: true|false,
         *     state: true|false,
         *     maxTokens: 200
         *   }
         * @returns {string}
         */
        buildPersonaPrompt(contactId, options) {
            options = options || {};
            const parts = [];

            // 默认全部启用（已经很紧凑）
            if (options.relation !== false) {
                const rp = RelationPermeation.buildPrompt(contactId, options);
                if (rp) parts.push(rp);
            }
            if (options.timeline !== false) {
                const tp = EventTimeline.buildPrompt(contactId, options);
                if (tp) parts.push(tp);
            }
            if (options.state !== false) {
                const sp = StateMachine.buildPrompt(contactId, options);
                if (sp) parts.push(sp);
            }
            // 口癖学习
            if (options.catchphrase !== false) {
                const cp = CatchphraseTracker.buildPrompt(contactId);
                if (cp) parts.push(cp);
            }

            if (parts.length === 0) return '';
            // 统一包装，让AI明确这是人格一致性要求
            return '\n--- 人格一致性(请自然体现,不要生硬宣告) ---' +
                   parts.join('') +
                   '\n--- 人格一致性结束 ---';
        }
    };

    // ==================== 导出 ====================
    global.PersonaBrain = {
        Relation: RelationPermeation,
        Timeline: EventTimeline,
        State: StateMachine,
        Motivation: MotivationEngine,
        Catchphrase: CatchphraseTracker,
        Prompt: PromptBuilder,
        // 便捷方法：一键获取完整 prompt
        buildPrompt: PromptBuilder.buildPersonaPrompt.bind(PromptBuilder)
    };

    console.log('[PersonaBrain] Initialized.');

})(typeof window !== 'undefined' ? window : this);
