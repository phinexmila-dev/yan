// ============================================================
// app-reconcile.js — 吵架反思 / 主动和解模块
// ------------------------------------------------------------
// 功能：
//   A. 主动和解：用户从聊天加号菜单按下「和好反思」→ AI 基于
//      人设 + 最近聊天 + 核心记忆 + 历史相似吵架 生成反思与道歉。
//   C. 自动反思：检测到"未解决冲突 + 冷却"后，在输入栏上方
//      浮出提示条，邀请用户发起反思。
//   档案：每次成功反思并"接受道歉"后，写入
//      contact.quarrelHistory[] 作为独立吵架档案，供下次召回。
//
// 依赖（全部 optional，缺失则降级）：
//   store / save() / toast() / showConfirm()   —— app-part1.js
//   API.chatCompletion()                       —— app-part1.js
//   window.MemorySystem                        —— app-memory-system.js
//   renderHistory() / scrollChatToBottom()     —— app-part1.js
//
// 全局导出：
//   window.openReconcileReflection()    加号菜单入口
//   window.ReconcileModule              { maybeShowHint, findSimilar, ... }
// ============================================================
(function () {
    'use strict';

    // ---------- 小工具 ----------
    function _uid(p) { return (p || 'rc_') + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
    function _esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function _toast(msg, type) { if (typeof toast === 'function') toast(msg, type); else if (type === 'error') console.warn(msg); }
    function _save() { if (typeof save === 'function') save(); }
    function _now() { return Date.now(); }

    // 情绪关键词（与 app-memory-system.js 对齐，独立一份避免硬依赖）
    const NEG_WORDS = ['生气', '讨厌', '烦', '气死', '可恶', '凭什么', '滚', '混蛋', '吵架', '分手',
        '难过', '伤心', '痛', '哭', '眼泪', '失望', '委屈', '寒心', '心碎', '够了',
        '别再', '不想', '算了', '随便你', '无所谓', '冷漠', '不理', '拉黑', '绝交'];
    const SORRY_WORDS = ['对不起', '抱歉', '错了', '我不该', '原谅', '原谅我', '是我不对'];
    const RECONCILE_WORDS = ['和好', '不吵了', '我也有错', '别生气了', '算我错'];

    // 冲突强度评分（单条消息）—— 0..1
    function _conflictScore(text) {
        if (!text || typeof text !== 'string') return 0;
        let hits = 0;
        for (const w of NEG_WORDS) if (text.includes(w)) hits++;
        const exMarks = (text.match(/[!！?？]/g) || []).length;
        let s = Math.min(1, hits * 0.25 + Math.min(exMarks, 5) * 0.08);
        // 全大写英文或带大量标点 →情绪化
        if (/[A-Z]{4,}/.test(text)) s += 0.1;
        return Math.max(0, Math.min(1, s));
    }

    // 提取关键词（简易版）
    function _keywords(text, max) {
        if (!text) return [];
        max = max || 8;
        // 优先用 MemorySystem 的分词
        if (window.MemorySystem && MemorySystem.MemoryKeyword && typeof MemorySystem.MemoryKeyword.extract === 'function') {
            try { return MemorySystem.MemoryKeyword.extract(text, max); } catch (e) { /* fallthrough */ }
        }
        // fallback：2-4 字中文 ngram
        const clean = String(text).replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, ' ').trim();
        const runs = clean.split(/\s+/).filter(Boolean);
        const freq = new Map();
        runs.forEach(run => {
            for (let len = 2; len <= 4; len++) {
                for (let i = 0; i + len <= run.length; i++) {
                    const g = run.slice(i, i + len);
                    if (/^(.)\1+$/.test(g)) continue;
                    freq.set(g, (freq.get(g) || 0) + 1);
                }
            }
        });
        return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, max).map(e => e[0]);
    }

    function _kwOverlap(a, b) {
        if (!a || !b || !a.length || !b.length) return 0;
        const sb = new Set(b);
        let hits = 0;
        for (const k of a) {
            if (sb.has(k)) { hits++; continue; }
            for (const y of b) {
                if (y.length >= 2 && k.length >= 2 && (y.includes(k) || k.includes(y))) { hits += 0.5; break; }
            }
        }
        return hits / Math.max(a.length, b.length);
    }

    // ---------- 冲突片段检测 ----------
    // 扫描聊天记录，找"连续"的情绪消息段；取最近 N 段
    function scanConflictSegments(messages, opts) {
        opts = opts || {};
        const minScore = opts.minScore || 0.25;
        const maxGap = opts.maxGap || 3;  // 允许段内最多 3 条"低情绪"穿插
        const scoreLen = opts.maxSegments || 3;
        const windowLookback = opts.windowLookback || 200; // 只看最近这么多条

        if (!messages || !messages.length) return [];
        const start = Math.max(0, messages.length - windowLookback);
        const segs = [];
        let cur = null;
        let gapCount = 0;

        for (let i = start; i < messages.length; i++) {
            const m = messages[i];
            if (!m || (m.type && m.type !== 'text' && m.type !== 'offline_text')) continue;
            const txt = String(m.content || '');
            const sc = _conflictScore(txt);

            if (sc >= minScore) {
                if (!cur) cur = { startIdx: i, endIdx: i, count: 0, scoreSum: 0, msgs: [] };
                cur.endIdx = i;
                cur.count++;
                cur.scoreSum += sc;
                cur.msgs.push({ idx: i, sender: m.sender, text: txt, time: m.time || 0, score: sc });
                gapCount = 0;
            } else if (cur) {
                gapCount++;
                if (gapCount > maxGap) {
                    if (cur.count >= 2) segs.push(cur);  // 至少 2 条才算"段"
                    cur = null; gapCount = 0;
                }
            }
        }
        if (cur && cur.count >= 2) segs.push(cur);

        // 最近的在前
        segs.reverse();
        return segs.slice(0, scoreLen);
    }

    // 判断冲突是否"已和解"（段后面出现道歉/和解词）
    function isSegmentResolved(messages, seg) {
        if (!messages || !seg) return false;
        const endIdx = seg.endIdx;
        const tail = messages.slice(endIdx + 1, endIdx + 1 + 30);
        for (const m of tail) {
            const t = String(m.content || '');
            if (SORRY_WORDS.some(w => t.includes(w)) || RECONCILE_WORDS.some(w => t.includes(w))) return true;
        }
        return false;
    }

    // ---------- quarrelHistory 档案 ----------
    function getQuarrelHistory(contact) {
        if (!contact) return [];
        if (!contact.quarrelHistory) contact.quarrelHistory = [];
        return contact.quarrelHistory;
    }

    function appendQuarrelRecord(contact, record) {
        const hist = getQuarrelHistory(contact);
        record.id = record.id || _uid('qh_');
        record.time = record.time || _now();
        hist.push(record);
        // 容量控制：保留最近 30 条
        if (hist.length > 30) hist.splice(0, hist.length - 30);
        _save();
        return record;
    }

    // 在档案里找相似吵架
    function findSimilarQuarrels(contact, currentKeywords, currentTrigger, limit) {
        limit = limit || 3;
        const hist = getQuarrelHistory(contact);
        if (!hist.length) return [];
        const curKw = currentKeywords || _keywords(currentTrigger || '', 10);
        const scored = hist.map(r => {
            const rKw = r.keywords || _keywords((r.trigger || '') + ' ' + (r.course || ''), 10);
            const kwSim = _kwOverlap(curKw, rKw);
            // 最近的吵架加权
            const ageDays = (_now() - (r.time || 0)) / 86400000;
            const recency = Math.exp(-ageDays / 60);  // 60 天半衰
            const score = kwSim * 0.8 + recency * 0.2;
            return { rec: r, score };
        }).sort((a, b) => b.score - a.score);
        return scored.slice(0, limit).filter(x => x.score > 0.15).map(x => x.rec);
    }

    // ---------- 人设/头像工具 ----------
    function _getStore() {
        // [FIX-window.store不存在] store 是 let 全局变量，不在 window 上；用 typeof 安全检测
        if (typeof store !== 'undefined' && store) return store;
        if (typeof window.__getAppStore === 'function') return window.__getAppStore();
        return null;
    }
    function _getContact(id) {
        var s = _getStore();
        if (!s || !Array.isArray(s.contacts) || !id) return null;
        // [FIX-未找到联系人] 使用宽松比较，避免 string/number 类型不匹配导致 === 失败
        return s.contacts.find(c => String(c.id) === String(id)) || null;
    }

    // [FIX-和好反思找不到联系人] 多路径获取当前聊天ID，增强鲁棒性
    function _resolveActiveChatId() {
        // 1. 优先使用官方 getter
        let aid = (typeof window.getActiveChatId === 'function') ? window.getActiveChatId() : null;
        if (aid && _getContact(aid)) return aid;

        // 2. fallback: 尝试从全局 activeChatId 读取（某些模块直接暴露）
        if (typeof window.activeChatId !== 'undefined' && window.activeChatId) {
            aid = window.activeChatId;
            if (_getContact(aid)) return aid;
        }

        // 3. fallback: 尝试从 offlineContactId 读取（线下模式）
        if (typeof window.offlineContactId !== 'undefined' && window.offlineContactId) {
            aid = window.offlineContactId;
            if (_getContact(aid)) return aid;
        }

        // 4. fallback: 从聊天层 DOM 推断
        try {
            const titleEl = document.getElementById('chat-title-name') || document.getElementById('chat-title');
            if (titleEl) {
                const name = titleEl.textContent.trim();
                if (name) {
                    const _s = _getStore();
                    const match = (_s && _s.contacts || []).find(c => c.name === name || c.remark === name);
                    if (match) return match.id;
                }
            }
        } catch (e) {}

        // 5. 如果 getActiveChatId 返回了值但联系人不存在，仍然返回该值（让调用方报错提示）
        return (typeof window.getActiveChatId === 'function') ? window.getActiveChatId() : null;
    }
    function _getUserNameAndAvatar(contact) {
        let userName = '我';
        let userAvatar = '';
        try {
            const _s = _getStore();
            const pid = contact && contact.settings && contact.settings.userPersona;
            const persona = pid && _s && Array.isArray(_s.personas) ? _s.personas.find(p => p.id === pid) : null;
            if (persona) {
                if (persona.name && !['默认', '用户', 'User', 'user', '默认用户'].includes(String(persona.name).trim())) userName = persona.name;
                if (persona.avatar) userAvatar = persona.avatar;
            }
            if (!userName || userName === '我') userName = (_s && _s.user && _s.user.name) || '我';
            if (!userAvatar) userAvatar = (_s && _s.user && _s.user.avatar) || '';
        } catch (e) { /* ignore */ }
        return { userName, userAvatar };
    }

    // ---------- 核心记忆召回（优先吵架相关） ----------
    function _recallCoreMemories(contactId) {
        if (!window.MemorySystem || !MemorySystem.MemoryStore) return [];
        try {
            const mem = MemorySystem.MemoryStore.getContactMem(contactId);
            if (!mem) return [];
            const list = [];
            (mem.core || []).forEach(m => list.push({ tier: 'core', text: m.content || m.summary || '', type: m.type }));
            // 追加少量长期记忆（偏情感）
            (mem.long || []).slice(-10).forEach(m => {
                const t = m.content || m.summary || '';
                if (!t) return;
                if (NEG_WORDS.some(w => t.includes(w)) || SORRY_WORDS.some(w => t.includes(w))) {
                    list.push({ tier: 'long', text: t, type: m.type });
                }
            });
            return list.slice(0, 20);
        } catch (e) { return []; }
    }

    // ---------- 构造反思 Prompt ----------
    function _buildReflectionMessages(ctx) {
        const { contact, userName, userTrigger, recentTexts, coreMems, similarQuarrels } = ctx;
        const persona = (contact.persona || '').substring(0, 800);

        const sysLines = [];
        sysLines.push(`你是「${contact.name}」。你正与「${userName}」发生了争执/冷战，现在由你本人来做一次真诚的自我反思。`);
        sysLines.push(`【你的人设】${persona || '（未设定）'}`);
        if (coreMems && coreMems.length) {
            sysLines.push('【刻在你心里的事（核心记忆 / 关键长期记忆）】');
            coreMems.forEach((m, i) => { sysLines.push(`  ${i + 1}. ${String(m.text).substring(0, 140)}`); });
        }
        if (similarQuarrels && similarQuarrels.length) {
            sysLines.push('【你们以前类似的吵架经历（供你参考是否重复犯错）】');
            similarQuarrels.forEach((q, i) => {
                sysLines.push(`  ${i + 1}. 起因：${(q.trigger || '').substring(0, 60)}；经过：${(q.course || '').substring(0, 80)}；最终如何和解：${(q.resolution || '').substring(0, 80)}`);
            });
        }
        sysLines.push('【最近的对话片段（可能包含冲突原话）】');
        sysLines.push(recentTexts || '（无）');
        if (userTrigger && userTrigger.trim()) {
            sysLines.push(`【${userName} 补充说明】${userTrigger.trim()}`);
        }

        sysLines.push('');
        sysLines.push('请你认真反思这次争执。分析必须符合你的人设性格（不要一味自责，也不能推卸责任）。');
        sysLines.push('严格只输出 JSON（不要任何其它文字、不要 markdown 代码块），字段如下：');
        sysLines.push('{');
        sysLines.push('  "trigger": "这次吵架的真正起因（一句话，<=40字）",');
        sysLines.push('  "course": "争执的经过概括（<=80字）",');
        sysLines.push('  "char_feelings": "你此刻真实的心情与委屈/在意的点（以你自己的口吻，<=120字）",');
        sysLines.push('  "char_wrongs": "你意识到自己哪里不对（具体行为，<=120字；若确实没错可写 '+ '\"我觉得这次不完全是我的错，但...\"' +'）",');
        sysLines.push(`  "user_triggers": "你理解到的 ${userName} 为什么会委屈/生气（不是指责，是共情，<=120字）",`);
        sysLines.push('  "similar_past": "是否想起以前类似的事？如果有，用一句话说它教给你什么（<=80字，没有就写 \"这次是新问题\"）",');
        sysLines.push('  "apology": "一段真诚的道歉话，完全用你的口吻，就像直接发给TA的微信消息一样，带你平时的语气词和标点（80-160字，不要出现 [] 或任何标签）",');
        sysLines.push('  "solution": "具体可执行的解决方案 / 约定（<=100字，要像真的约定，不要空话）",');
        sysLines.push('  "severity": 0~1之间的数字，表示这次吵架的严重程度');
        sysLines.push('}');

        return [
            { role: 'system', content: sysLines.join('\n') },
            { role: 'user', content: '请按要求输出 JSON。' }
        ];
    }

    // 解析 AI 返回 JSON（鲁棒版）
    function _parseReflectionJSON(raw) {
        if (!raw) return null;
        let s = String(raw).trim();
        // 去除 markdown 代码块
        s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
        // 抓第一个大括号块
        const first = s.indexOf('{');
        const last = s.lastIndexOf('}');
        if (first >= 0 && last > first) s = s.slice(first, last + 1);
        try {
            const obj = JSON.parse(s);
            return obj && typeof obj === 'object' ? obj : null;
        } catch (e) {
            // 宽松修复：尝试把单引号替换为双引号
            try { return JSON.parse(s.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":').replace(/'/g, '"')); }
            catch (e2) { console.warn('[Reconcile] JSON 解析失败:', e2, raw); return null; }
        }
    }

    // ---------- 组装最近聊天文本（供 AI 阅读） ----------
    function _buildRecentChatText(messages, userName, contactName, maxChars) {
        maxChars = maxChars || 2400;
        if (!messages || !messages.length) return '';
        const lines = [];
        // 从后往前取
        for (let i = messages.length - 1; i >= 0 && lines.length < 60; i--) {
            const m = messages[i];
            if (!m) continue;
            if (m.type && m.type !== 'text' && m.type !== 'offline_text' && m.type !== 'voice' && m.type !== 'audio') continue;
            const who = m.sender === 'me' ? userName : (m.senderName || contactName);
            let body = String(m.content || '').replace(/\s+/g, ' ').trim();
            if (!body) continue;
            if (body.length > 120) body = body.slice(0, 120) + '…';
            lines.push(`${who}: ${body}`);
        }
        lines.reverse();
        let out = lines.join('\n');
        if (out.length > maxChars) out = out.slice(-maxChars);
        return out;
    }

    // ============================================================
    // 主入口：打开反思弹窗
    // ============================================================
    window.openReconcileReflection = async function () {
        // [FIX-和好反思找不到联系人] 使用多路径解析，增强鲁棒性
        const _aid = _resolveActiveChatId();
        if (!_aid) {
            _toast('请先进入一个聊天', 'error'); return;
        }
        const contact = _getContact(_aid);
        if (!contact) { _toast('未找到联系人（id=' + _aid + '）', 'error'); return; }
        if (contact.isGroup) { _toast('和好反思只支持一对一聊天', 'error'); return; }

        const chatId = _aid;
        var _s = _getStore();
        const msgs = (_s && _s.chats && _s.chats[chatId]) || [];
        if (msgs.length < 2) {
            _toast('还没有足够的聊天记录可以反思', 'error'); return;
        }
        // API 预检
        if (typeof API === 'undefined' || !API || typeof API.chatCompletion !== 'function') {
            _toast('AI 接口不可用，请先配置 API', 'error'); return;
        }

        _renderReconcileModal({ contact, chatId });
    };

    // ---------- UI：弹窗（步骤1 简述 → 步骤2 反思中 → 步骤3 结果） ----------
    function _renderReconcileModal(ctx) {
        // 先关掉加号菜单浮层
        if (typeof closeExtMenu === 'function') { try { closeExtMenu(); } catch (e) {} }

        // 销毁旧的
        const old = document.getElementById('reconcile-modal');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'reconcile-modal';
        overlay.className = 'reconcile-modal-overlay';
        overlay.innerHTML = `
            <div class="reconcile-modal-box" role="dialog" aria-modal="true">
                <div class="reconcile-modal-header">
                    <span class="reconcile-modal-title"><i class="fas fa-dove"></i> 和好反思</span>
                    <span class="reconcile-modal-actions">
                        <span class="reconcile-modal-setting" data-rc-setting title="设置">
                            <i class="fas fa-cog"></i>
                        </span>
                        <span class="reconcile-modal-close" data-rc-close>&times;</span>
                    </span>
                </div>
                <div class="reconcile-modal-body" id="reconcile-body"></div>
            </div>`;
        document.body.appendChild(overlay);
        // 把 ctx 挂在 overlay 上，便于设置页返回后使用
        overlay._rcCtx = ctx;

        overlay.addEventListener('click', function (e) {
            // [和好反思-设置入口] 点击齿轮打开设置子屏
            if (e.target && e.target.closest && e.target.closest('[data-rc-setting]')) {
                _openReconcileSettings(overlay._rcCtx || ctx);
                return;
            }
            if (e.target === overlay || (e.target && e.target.hasAttribute && e.target.hasAttribute('data-rc-close'))) {
                _closeModal();
            }
        });

        _renderStepIntro(ctx);
    }

    // [和好反思-设置入口] 设置子屏：开关主动检测
    function _openReconcileSettings(ctx) {
        const body = document.getElementById('reconcile-body');
        if (!body) return;
        const s = _getStore();
        if (!s.system) s.system = {};
        if (!s.system.reconcile) s.system.reconcile = {};
        const cfg = s.system.reconcile;
        const autoOn = cfg.autoHint !== false; // 默认开

        // 保存上一屏，便于"返回"时还原
        if (body._rcPrevHTML == null) body._rcPrevHTML = body.innerHTML;

        body.innerHTML = `
            <div class="reconcile-settings">
                <div class="rc-set-row">
                    <div class="rc-set-label">
                        <div class="rc-set-title">主动检测冲突并提示</div>
                        <div class="rc-set-desc">开启后，当系统检测到未解决的冲突，会在输入栏上方浮出反思提示。<br>关闭后不会主动弹出，只能从聊天加号菜单的「和好反思」手动调用。</div>
                    </div>
                    <label class="rc-switch">
                        <input type="checkbox" id="rc-set-auto" ${autoOn ? 'checked' : ''}>
                        <span class="rc-slider"></span>
                    </label>
                </div>
                <div class="reconcile-actions">
                    <button class="rc-btn rc-btn-ghost" id="rc-set-cancel">返回</button>
                    <button class="rc-btn rc-btn-primary" id="rc-set-save">保存</button>
                </div>
            </div>`;

        const cancelBtn = document.getElementById('rc-set-cancel');
        if (cancelBtn) cancelBtn.onclick = function () {
            if (body._rcPrevHTML != null) {
                body.innerHTML = body._rcPrevHTML;
                body._rcPrevHTML = null;
            } else if (ctx) {
                _renderStepIntro(ctx);
            }
        };
        const saveBtn = document.getElementById('rc-set-save');
        if (saveBtn) saveBtn.onclick = function () {
            const el = document.getElementById('rc-set-auto');
            cfg.autoHint = !!(el && el.checked);
            try { _save(); } catch (e) {}
            if (!cfg.autoHint) {
                // 立即关掉当前的悬浮提示 + 停掉轮询
                _hideAutoHint();
                if (_autoTimer) { clearInterval(_autoTimer); _autoTimer = null; }
            } else {
                // 重新启动自动检测循环
                _startAutoLoop();
            }
            if (typeof _toast === 'function') _toast(cfg.autoHint ? '已开启主动检测' : '已关闭主动检测，只能手动调用', 'success');
            if (body._rcPrevHTML != null) {
                body.innerHTML = body._rcPrevHTML;
                body._rcPrevHTML = null;
            } else if (ctx) {
                _renderStepIntro(ctx);
            }
        };
    }

    function _closeModal() {
        const el = document.getElementById('reconcile-modal');
        if (el) el.remove();
    }

    // 步骤 1：让用户简述或跳过
    function _renderStepIntro(ctx) {
        const body = document.getElementById('reconcile-body');
        if (!body) return;
        const { contact } = ctx;
        body.innerHTML = `
            <div class="reconcile-intro">
                <div class="reconcile-avatar-row">
                    <img class="reconcile-avatar" src="${_esc(contact.avatar || '')}"
                         onerror="this.style.display='none'">
                    <div class="reconcile-intro-text">
                        <div class="reconcile-intro-title">和 ${_esc(contact.name)} 冷静聊聊吧</div>
                        <div class="reconcile-intro-desc">TA 会根据人设、最近的对话、对你们的核心记忆，以及类似的吵架经历，做一次真诚的自我反思。</div>
                    </div>
                </div>
                <label class="reconcile-label">（可选）你想让 TA 特别关注这次冲突的哪个点？</label>
                <textarea id="reconcile-user-trigger" class="reconcile-textarea" rows="3"
                    placeholder="例如：TA 答应了却没做到；TA 说话太冲伤到我；或者留空让 TA 自己判断"></textarea>
                <div class="reconcile-actions">
                    <button class="rc-btn rc-btn-ghost" data-rc-close>算了</button>
                    <button class="rc-btn rc-btn-primary" id="reconcile-start-btn">
                        <i class="fas fa-heart"></i> 开始反思
                    </button>
                </div>
            </div>`;
        const startBtn = document.getElementById('reconcile-start-btn');
        if (startBtn) startBtn.onclick = function () {
            const userTrigger = (document.getElementById('reconcile-user-trigger').value || '').trim();
            _doReflection(ctx, userTrigger);
        };
    }

    // 步骤 2：loading
    function _renderStepLoading() {
        const body = document.getElementById('reconcile-body');
        if (!body) return;
        body.innerHTML = `
            <div class="reconcile-loading">
                <div class="reconcile-spinner"></div>
                <div class="reconcile-loading-text" id="reconcile-loading-hint">正在翻看你们的聊天…</div>
            </div>`;
        // 文案轮播，让等待更有温度
        const hints = [
            '正在翻看你们的聊天…',
            '在 TA 心里找核心记忆…',
            '回想类似的吵架经历…',
            'TA 正在组织语言…',
            '认真想一想该怎么说…'
        ];
        let i = 0;
        const hintEl = document.getElementById('reconcile-loading-hint');
        const timer = setInterval(function () {
            if (!document.getElementById('reconcile-loading-hint')) { clearInterval(timer); return; }
            i = (i + 1) % hints.length;
            hintEl.textContent = hints[i];
        }, 1600);
    }

    // 步骤 3：结果卡片
    function _renderStepResult(ctx, result) {
        const body = document.getElementById('reconcile-body');
        if (!body) return;
        const { contact } = ctx;

        // 相似经历列表
        let simHtml = '';
        if (result._similarQuarrels && result._similarQuarrels.length) {
            simHtml = `<div class="rc-card rc-card-history">
                <div class="rc-card-title"><i class="fas fa-history"></i> 类似的过去</div>
                ${result._similarQuarrels.map(q => `
                    <div class="rc-history-item">
                        <div class="rc-history-trigger">· ${_esc((q.trigger || '').substring(0, 60))}</div>
                        <div class="rc-history-resolution">和解方式：${_esc((q.resolution || '').substring(0, 80))}</div>
                    </div>
                `).join('')}
            </div>`;
        }

        body.innerHTML = `
            <div class="reconcile-result">
                <div class="rc-card">
                    <div class="rc-card-title"><i class="fas fa-fire"></i> 这次为什么吵</div>
                    <div class="rc-card-text">${_esc(result.trigger || '—')}</div>
                </div>
                <div class="rc-card rc-card-feelings">
                    <div class="rc-card-title"><i class="fas fa-heart-broken"></i> ${_esc(contact.name)} 的心情</div>
                    <div class="rc-card-text">${_esc(result.char_feelings || '—')}</div>
                </div>
                <div class="rc-card rc-card-reflect">
                    <div class="rc-card-title"><i class="fas fa-seedling"></i> TA 意识到自己哪里不对</div>
                    <div class="rc-card-text">${_esc(result.char_wrongs || '—')}</div>
                </div>
                <div class="rc-card rc-card-empathy">
                    <div class="rc-card-title"><i class="fas fa-hands-helping"></i> TA 也理解你的委屈</div>
                    <div class="rc-card-text">${_esc(result.user_triggers || '—')}</div>
                </div>
                ${simHtml}
                <div class="rc-card rc-card-apology">
                    <div class="rc-card-title"><i class="fas fa-envelope-open-heart"></i> TA 想对你说</div>
                    <div class="rc-card-text rc-apology-text" id="rc-apology-text">${_esc(result.apology || '—')}</div>
                </div>
                <div class="rc-card rc-card-solution">
                    <div class="rc-card-title"><i class="fas fa-handshake"></i> 接下来的约定</div>
                    <div class="rc-card-text">${_esc(result.solution || '—')}</div>
                </div>

                <div class="reconcile-actions reconcile-actions-result">
                    <button class="rc-btn rc-btn-ghost" id="rc-btn-later">还没消气</button>
                    <button class="rc-btn rc-btn-secondary" id="rc-btn-regen">
                        <i class="fas fa-redo"></i> 重新想想
                    </button>
                    <button class="rc-btn rc-btn-primary" id="rc-btn-accept">
                        <i class="fas fa-paper-plane"></i> 让 TA 来道歉
                    </button>
                </div>
            </div>`;

        document.getElementById('rc-btn-later').onclick = function () {
            // 仅记录档案（未和解），不发消息
            _persistQuarrel(ctx, result, /*resolved*/false);
            _toast('已记录这次吵架，等你想谈了再来', 'success');
            _closeModal();
        };
        document.getElementById('rc-btn-regen').onclick = function () {
            _doReflection(ctx, ctx._userTrigger || '', /*regen*/true);
        };
        document.getElementById('rc-btn-accept').onclick = function () {
            _acceptApology(ctx, result);
        };
    }

    // ---------- 执行反思（调 AI） ----------
    async function _doReflection(ctx, userTrigger, isRegen) {
        ctx._userTrigger = userTrigger;
        _renderStepLoading();

        const { contact, chatId } = ctx;
        var _s2 = _getStore();
        const msgs = (_s2 && _s2.chats && _s2.chats[chatId]) || [];
        const { userName } = _getUserNameAndAvatar(contact);

        // 1) 最近对话文本
        const recentTexts = _buildRecentChatText(msgs, userName, contact.name, 2400);

        // 2) 抽取当前冲突关键词
        const segs = scanConflictSegments(msgs, { maxSegments: 1, windowLookback: 80, minScore: 0.2 });
        let curKw = [];
        let curTriggerGuess = '';
        if (segs.length) {
            const concat = segs[0].msgs.map(x => x.text).join(' ');
            curKw = _keywords(concat + ' ' + (userTrigger || ''), 12);
            curTriggerGuess = concat.slice(0, 200);
        } else {
            curKw = _keywords((userTrigger || '') + ' ' + recentTexts.slice(-600), 12);
        }

        // 3) 召回相似吵架档案
        const similar = findSimilarQuarrels(contact, curKw, curTriggerGuess, 3);

        // 4) 召回核心记忆
        const coreMems = _recallCoreMemories(contact.id);

        // 5) 构造 prompt 调用 AI
        const messages = _buildReflectionMessages({
            contact, userName, userTrigger, recentTexts, coreMems, similarQuarrels: similar
        });

        let resultObj = null;
        try {
            var _s3 = _getStore();
            const temp = (_s3 && _s3.system && typeof _s3.system.temp === 'number') ? _s3.system.temp : 0.85;
            const data = await API.chatCompletion(messages, { temperature: isRegen ? Math.min(1, temp + 0.15) : temp, scene: 'reconcile' });
            const raw = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
            resultObj = _parseReflectionJSON(raw);
            if (!resultObj) {
                // [清理] 模型没吐 JSON 兜底已移除：报错让用户重试，不再伪造 apology
                console.warn('[Reconcile] 模型未按JSON格式输出, 原文:', raw && raw.substring(0, 200));
                _toast('反思生成失败：模型未按要求输出，请重试', 'error');
                _renderStepIntro(ctx);
                return;
            }
        } catch (e) {
            console.error('[Reconcile] AI 调用失败:', e);
            _toast('反思失败：' + (e && e.message ? e.message : '网络错误'), 'error');
            _renderStepIntro(ctx);
            return;
        }

        // 附带相似档案以便 UI 展示
        resultObj._similarQuarrels = similar;
        resultObj._curKeywords = curKw;
        resultObj._curTriggerGuess = curTriggerGuess;
        resultObj._conflictSeg = segs[0] || null;

        _renderStepResult(ctx, resultObj);
    }

    // ---------- 接受道歉：发消息 + 写档案 + 写核心记忆 ----------
    async function _acceptApology(ctx, result) {
        const { contact, chatId } = ctx;
        if (!result || !result.apology) { _toast('没有可发送的道歉内容', 'error'); return; }

        // 1) 把道歉作为 AI 的新消息插入聊天
        try {
            var _s4 = _getStore();
            if (!_s4.chats[chatId]) _s4.chats[chatId] = [];
            const msg = {
                sender: 'ai',
                type: 'text',
                content: String(result.apology).trim(),
                time: _now(),
                _fromReconcile: true
            };
            _s4.chats[chatId].push(msg);

            // 更新会话预览时间/最后消息
            if (contact) {
                contact.lastMsg = (msg.content || '').slice(0, 30);
                contact.lastTime = msg.time;
                if (typeof contact.unread === 'number') contact.unread = (contact.unread || 0) + 1;
            }
        } catch (e) { console.warn('[Reconcile] 写入消息失败:', e); }

        // 2) 写 quarrelHistory
        _persistQuarrel(ctx, result, /*resolved*/true);

        // 3) 把"约定"写入核心记忆（如可用）
        try {
            if (window.MemorySystem && MemorySystem.MemoryStore && result.solution) {
                const memText = `【吵架后的约定 · 与${contact.name}】${String(result.solution).slice(0, 180)}`;
                MemorySystem.MemoryStore.addMemory(contact.id, {
                    content: memText,
                    summary: memText,
                    type: 'reconcile',
                    emotion: { type: 'love', score: 0.75, isCoreEvent: true },
                    strength: 1.0,
                    createdAt: _now(),
                    keywords: (result._curKeywords || []).slice(0, 8)
                }, 'core');
            }
        } catch (e) { console.warn('[Reconcile] 写入核心记忆失败:', e); }

        _save();

        // 4) 刷新聊天视图，滚到底
        try { if (typeof renderHistory === 'function') renderHistory(); } catch (e) {}
        try { if (typeof scrollChatToBottom === 'function') scrollChatToBottom(); } catch (e) {}
        try { if (typeof renderContacts === 'function') renderContacts(); } catch (e) {}

        _toast('TA 的道歉已经发给你啦 💌', 'success');
        _hideAutoHint();
        _closeModal();
    }

    function _persistQuarrel(ctx, result, resolved) {
        try {
            const rec = {
                time: _now(),
                trigger: result.trigger || '',
                course: result.course || '',
                resolution: resolved ? (result.solution || '') : '',
                charFeelings: result.char_feelings || '',
                charWrongs: result.char_wrongs || '',
                userTriggers: result.user_triggers || '',
                apology: result.apology || '',
                keywords: result._curKeywords || [],
                severity: typeof result.severity === 'number' ? result.severity : 0.5,
                resolved: !!resolved,
                msgRange: result._conflictSeg ? [result._conflictSeg.startIdx, result._conflictSeg.endIdx] : null
            };
            appendQuarrelRecord(ctx.contact, rec);
        } catch (e) { console.warn('[Reconcile] 写档案失败:', e); }
    }

    // ============================================================
    // C 方案：自动冲突检测 + 输入栏上方悬浮提示
    // ============================================================
    const AUTO_COOLDOWN_MS = 10 * 60 * 1000;  // [FIX-反思持续弹v2] 最后一条消息后冷却 10 分钟再提示（原3分钟太短）
    const AUTO_CHECK_INTERVAL_MS = 60 * 1000; // 每 60 秒检查一次
    const DISMISS_COOLDOWN_MS = 2 * 60 * 60 * 1000; // [FIX-反思持续弹v2] dismiss后该联系人静默2小时
    const COLD_TREATMENT_MS = 30 * 60 * 1000; // [FIX-反思持续弹v2] 冲突段后30分钟无新消息视为冷处理完毕
    let _autoTimer = null;
    let _lastHintChatId = null;

    function _isAutoEnabled() {
        // 可通过 store.system.reconcile.autoHint 控制；默认开
        try {
            var _s5 = _getStore();
            const cfg = _s5 && _s5.system && _s5.system.reconcile;
            if (cfg && typeof cfg.autoHint === 'boolean') return cfg.autoHint;
        } catch (e) {}
        return true;
    }

    function _checkAndMaybeShowHint() {
        try {
            if (!_isAutoEnabled()) { _hideAutoHint(); return; }
            // [FIX-和好反思找不到联系人] 使用多路径解析
            const _aid = _resolveActiveChatId();
            if (!_aid) { _hideAutoHint(); return; }

            // 聊天层是否可见
            const layer = document.getElementById('layer-chat');
            if (!layer || (layer.style.display !== 'flex' && layer.style.display !== 'block' && layer.offsetParent === null)) {
                _hideAutoHint(); return;
            }

            const contact = _getContact(_aid);
            if (!contact || contact.isGroup) { _hideAutoHint(); return; }

            var _s6 = _getStore();
            const msgs = (_s6 && _s6.chats && _s6.chats[_aid]) || [];
            if (msgs.length < 4) { _hideAutoHint(); return; }

            // 距最后消息 < 冷却：不提示
            const last = msgs[msgs.length - 1];
            if (last && last.time && (_now() - last.time) < AUTO_COOLDOWN_MS) { _hideAutoHint(); return; }

            // [FIX-反思持续弹v2] 如果该联系人最近被dismiss过，在冷却期内不再弹
            if (!contact._dismissedHints) contact._dismissedHints = [];
            var _lastDismissTime = 0;
            for (var _di = contact._dismissedHints.length - 1; _di >= 0; _di--) {
                var _dh = contact._dismissedHints[_di];
                var _dt = typeof _dh === 'object' ? (_dh.time || 0) : 0;
                if (_dt > _lastDismissTime) _lastDismissTime = _dt;
            }
            if (_lastDismissTime && (_now() - _lastDismissTime) < DISMISS_COOLDOWN_MS) { _hideAutoHint(); return; }

            // 最近 60 条里找冲突段（提高 minScore 阈值到 0.35，减少误触发）
            const segs = scanConflictSegments(msgs, { maxSegments: 1, windowLookback: 60, minScore: 0.35 });
            if (!segs.length) { _hideAutoHint(); return; }
            // [FIX-反思持续弹v2] 冲突段至少需要3条高情绪消息才触发（原为2条）
            if (segs[0].count < 3) { _hideAutoHint(); return; }
            // 最近一段 end 距今太久（> 2 小时）就不提示，避免老账新翻
            if (last && last.time && (_now() - last.time) > 2 * 60 * 60 * 1000) { _hideAutoHint(); return; }

            // [FIX-反思持续弹v2] 冷战冷处理判断：冲突段结束后超过30分钟没有新消息，
            // 视为用户已通过冷处理方式消化情绪，不再弹窗打扰
            const _segEndMsg = msgs[segs[0].endIdx];
            const _segEndTime2 = _segEndMsg && _segEndMsg.time ? _segEndMsg.time : 0;
            if (_segEndTime2 && last && last.time) {
                // 冲突段结束后的消息间隔
                const _timeSinceConflict = last.time - _segEndTime2;
                // 如果冲突段结束后已经过了30分钟，且之后没有新的高情绪消息，视为冷处理完毕
                if (_timeSinceConflict > COLD_TREATMENT_MS) {
                    // 检查冲突段之后是否还有高情绪消息
                    var _hasNewConflict = false;
                    for (var _ci = segs[0].endIdx + 1; _ci < msgs.length; _ci++) {
                        if (_conflictScore(String(msgs[_ci].content || '')) >= 0.35) { _hasNewConflict = true; break; }
                    }
                    if (!_hasNewConflict) { _hideAutoHint(); return; }
                }
            }

            // 冲突段是否已和解（段后出现道歉词）
            if (isSegmentResolved(msgs, segs[0])) {
                _hideAutoHint();
                // [FIX-反思持续弹] 和解后暂停自动检测1小时（原30分钟太短）
                if (_autoTimer) { clearInterval(_autoTimer); _autoTimer = null; }
                setTimeout(_startAutoLoop, 60 * 60 * 1000);
                return;
            }

            // [FIX-反思持续弹] 使用冲突段首尾消息的时间戳作为segKey（稳定不变）
            const seg = segs[0];
            const _segStartTime = msgs[seg.startIdx] && msgs[seg.startIdx].time || seg.startIdx;
            const _segEndTime = msgs[seg.endIdx] && msgs[seg.endIdx].time || seg.endIdx;
            const segKey = _aid + '_' + _segStartTime + '_' + _segEndTime;
            // 兼容旧的单值字段
            if (contact._lastDismissedHint === segKey) { _hideAutoHint(); return; }
            // [FIX-反思持续弹v2] dismiss记录改为带时间戳的对象数组
            var _isDismissed = contact._dismissedHints.some(function(d) {
                return (typeof d === 'string' && d === segKey) || (typeof d === 'object' && d.key === segKey);
            });
            if (_isDismissed) { _hideAutoHint(); return; }

            _showAutoHint(contact, segKey, _aid);
        } catch (e) { console.warn('[Reconcile] 自动检测出错:', e); }
    }

    function _showAutoHint(contact, segKey, _aid) {
        const inputBar = document.getElementById('chat-input-bar');
        if (!inputBar) return;

        let hint = document.getElementById('reconcile-auto-hint');
        if (hint) {
            hint.dataset.segKey = segKey;
            hint.style.display = 'flex';
            return;
        }

        hint = document.createElement('div');
        hint.id = 'reconcile-auto-hint';
        hint.className = 'reconcile-auto-hint';
        hint.dataset.segKey = segKey;
        hint.innerHTML = `
            <span class="rc-hint-icon">💭</span>
            <span class="rc-hint-text">冷静一下了吗？要不要让 <b>${_esc(contact.name)}</b> 先反思一下？</span>
            <button class="rc-hint-btn" id="rc-hint-open">反思</button>
            <button class="rc-hint-close" id="rc-hint-dismiss" aria-label="关闭">&times;</button>
        `;
        // 插到输入栏父节点，定位在其上方
        if (inputBar.parentNode) {
            inputBar.parentNode.insertBefore(hint, inputBar);
        } else {
            document.body.appendChild(hint);
        }

        document.getElementById('rc-hint-open').onclick = function () {
            _hideAutoHint();
            window.openReconcileReflection();
        };
        document.getElementById('rc-hint-dismiss').onclick = function () {
            _hideAutoHint();
            // [FIX-反思持续弹v2] 记录dismiss，带时间戳，支持冷却期判断
            try {
                const c = _getContact(_aid);
                if (c) {
                    if (!c._dismissedHints) c._dismissedHints = [];
                    // 兼容：清理旧的纯字符串格式
                    c._dismissedHints = c._dismissedHints.filter(function(d) { return typeof d === 'object'; });
                    c._dismissedHints.push({ key: segKey, time: _now() });
                    // 只保留最近10个，防止无限增长
                    if (c._dismissedHints.length > 10) c._dismissedHints = c._dismissedHints.slice(-10);
                    _save();
                }
            } catch (e) {}
        };
        _lastHintChatId = _aid;
    }

    function _hideAutoHint() {
        const hint = document.getElementById('reconcile-auto-hint');
        if (hint) hint.style.display = 'none';
    }

    function _startAutoLoop() {
        if (_autoTimer) return;
        // [和好反思-设置入口] 启动时也尊重开关：开关关闭则不启动轮询
        if (!_isAutoEnabled()) return;
        // 首次 10 秒后开始，避免初始化阶段误判
        setTimeout(function () {
            _checkAndMaybeShowHint();
            _autoTimer = setInterval(_checkAndMaybeShowHint, AUTO_CHECK_INTERVAL_MS);
        }, 10 * 1000);
    }

    // 切换聊天时隐藏旧提示
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') _checkAndMaybeShowHint();
    });

    // ---------- 暴露模块 API ----------
    window.ReconcileModule = {
        openReflection: window.openReconcileReflection,
        scanConflictSegments: scanConflictSegments,
        findSimilarQuarrels: findSimilarQuarrels,
        appendQuarrelRecord: appendQuarrelRecord,
        getQuarrelHistory: getQuarrelHistory,
        maybeShowHint: _checkAndMaybeShowHint,
        hideHint: _hideAutoHint,
        _internal: {
            parseJSON: _parseReflectionJSON,
            buildMessages: _buildReflectionMessages,
            conflictScore: _conflictScore,
            keywords: _keywords
        }
    };

    // 启动自动检测循环
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _startAutoLoop, { once: true });
    } else {
        _startAutoLoop();
    }

})();
