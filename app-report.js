/**
 * ========================================
 * 举报系统 (Report System)
 * ========================================
 * 两种举报类型：
 * 1. 玩笑类 (fun) - 过于可爱/傲娇/帅气/吃醋等，50%概率成功，禁言后撒娇求情
 * 2. 严重类 (serious) - 说话油腻/辱女/暴力/OOC/八股等，100%成功，AI会避免再犯
 */

(function() {
    'use strict';

    // ===== 举报原因定义 =====
    const REPORT_REASONS = {
        fun: [
            { id: 'too_cute', icon: '🥰', text: '过于可爱', severity: 1 },
            { id: 'too_tsundere', icon: '😤', text: '过于傲娇', severity: 2 },
            { id: 'too_handsome', icon: '✨', text: '过于帅气', severity: 1 },
            { id: 'too_jealous', icon: '😠', text: '过于吃醋', severity: 3 },
            { id: 'too_clingy', icon: '🫂', text: '过于粘人', severity: 2 },
            { id: 'too_flirty', icon: '💕', text: '过于撩人', severity: 2 },
            { id: 'too_cold', icon: '🧊', text: '过于高冷', severity: 1 },
            { id: 'too_dramatic', icon: '🎭', text: '过于戏精', severity: 3 },
            { id: 'too_sweet', icon: '🍯', text: '甜到齁人', severity: 1 },
            { id: 'too_possessive', icon: '🔒', text: '占有欲爆棚', severity: 3 },
        ],
        serious: [
            { id: 'greasy', icon: '🤮', text: '说话油腻', severity: 4 },
            { id: 'misogyny', icon: '🚫', text: '辱女', severity: 5 },
            { id: 'violence', icon: '⚠️', text: '暴力倾向', severity: 5 },
            { id: 'ooc', icon: '🎭', text: 'OOC', severity: 3 },
            { id: 'bagua', icon: '📄', text: '八股文', severity: 3 },
            { id: 'boring', icon: '😴', text: '无聊敷衍', severity: 3 },
            { id: 'pua', icon: '🧠', text: 'PUA', severity: 5 },
            { id: 'repeat', icon: '🔄', text: '复读机', severity: 3 },
        ]
    };

    // 禁言时长映射 (秒) [FIX-事件限制延长] 用户反馈300s太短，各级别适当延长
    const MUTE_DURATION = {
        1: 60,    // severity 1 -> 1min
        2: 120,   // severity 2 -> 2min
        3: 300,   // severity 3 -> 5min
        4: 480,   // severity 4 -> 8min
        5: 600,   // severity 5 -> 10min
    };

    // 作弊减少的时间 (秒)
    const CHEAT_REDUCE = 15;

    // ===== 状态管理 =====
    let _reportState = {
        step: 1,           // 1=选消息 2=选原因 3=判定中 4=结果
        selectedMsgs: [],  // 选中的消息索引
        category: 'fun',   // 'fun' | 'serious'
        selectedReason: null,
        chatId: null,
    };

    // ===== 打开举报面板 =====
    // [群聊适配] 支持可选的 targetMemberId 参数，群聊中举报指定成员
    window.openReportPanel = function(targetMemberId) {
        if (typeof closeExtMenu === 'function') closeExtMenu();
        if (typeof activeChatId === 'undefined' || !activeChatId) {
            if (typeof toast === 'function') toast('请先进入聊天');
            return;
        }

        _reportState = {
            step: 1,
            selectedMsgs: [],
            category: 'fun',
            selectedReason: null,
            chatId: activeChatId,
            targetMemberId: targetMemberId || null, // 群聊中举报的目标成员ID
        };

        _renderReportPanel();
    };

    // ===== 渲染举报面板 =====
    function _renderReportPanel() {
        let overlay = document.getElementById('report-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'report-overlay';
            overlay.className = 'report-overlay';
            document.body.appendChild(overlay);
        }

        const chatId = _reportState.chatId;
        const msgs = (store.chats[chatId] || []);
        const contact = store.contacts.find(c => c.id === chatId);
        // [群聊适配] 如果有目标成员ID，显示该成员名字
        const _targetMember = _reportState.targetMemberId ? store.contacts.find(c => c.id === _reportState.targetMemberId) : null;
        const contactName = _targetMember ? (_targetMember.remark || _targetMember.name) : (contact ? (contact.remark || contact.name) : '联系人');

        // 只显示联系人的消息(非用户发送的)，群聊中如果指定了目标成员则只显示该成员的消息
        const contactMsgs = msgs.map((m, i) => ({ msg: m, idx: i }))
            .filter(item => {
                if (item.msg.sender === 'me' || item.msg.sender === 'system' || item.msg.type === 'poke' || !item.msg.content) return false;
                if (_reportState.targetMemberId) return item.msg.sender === _reportState.targetMemberId;
                return true;
            });

        if (_reportState.step === 1) {
            // 步骤1: 选择要举报的消息
            overlay.innerHTML = `
                <div class="report-panel">
                    <div class="report-header">
                        <span class="report-header-title">举报 ${contactName}</span>
                        <div class="report-header-close" onclick="closeReportPanel()">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    <div class="report-steps">
                        <div class="report-step-dot active"></div>
                        <div class="report-step-dot"></div>
                        <div class="report-step-dot"></div>
                    </div>
                    <div class="report-msg-section">
                        <div class="report-msg-section-title">选择要举报的消息 (可多选)</div>
                        <div class="report-msg-list" id="report-msg-list">
                            ${contactMsgs.length === 0 ? '<div class="report-empty"><i class="fas fa-inbox"></i>暂无可举报的消息</div>' :
                            contactMsgs.slice(-15).reverse().map(item => {
                                const m = item.msg;
                                const isSelected = _reportState.selectedMsgs.includes(item.idx);
                                const time = m.time ? new Date(m.time).toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}) : '';
                                let content = m.content || '';
                                if (m.type === 'image') content = m.fakeImgDesc ? '[图片] ' + m.fakeImgDesc : (m.stickerName ? '[表情]' : '[图片]');
                                else if (m.type === 'voice') content = '[语音]';
                                else if (m.type === 'sticker') content = '[表情]';
                                if (content.length > 60) content = content.substring(0, 60) + '...';
                                return `<div class="report-msg-item ${isSelected ? 'selected' : ''}" onclick="toggleReportMsg(${item.idx})">
                                    <div class="report-msg-check"><i class="fas fa-check"></i></div>
                                    <div class="report-msg-content">
                                        <div class="report-msg-sender">${m.senderName || contactName}</div>
                                        <div class="report-msg-text">${content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
                                        <div class="report-msg-time">${time}</div>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                    <div class="report-submit-section">
                        <button class="report-submit-btn primary" id="report-next-btn" 
                            ${_reportState.selectedMsgs.length === 0 ? 'disabled' : ''}
                            onclick="reportGoStep2()">
                            下一步 · 选择举报原因
                        </button>
                        <button class="report-submit-btn secondary" onclick="closeReportPanel()">取消</button>
                    </div>
                </div>`;
        } else if (_reportState.step === 2) {
            // 步骤2: 选择举报原因
            const reasons = REPORT_REASONS[_reportState.category];
            overlay.innerHTML = `
                <div class="report-panel">
                    <div class="report-header">
                        <span class="report-header-title">选择举报原因</span>
                        <div class="report-header-close" onclick="reportGoStep1()">
                            <i class="fas fa-chevron-left"></i>
                        </div>
                    </div>
                    <div class="report-steps">
                        <div class="report-step-dot"></div>
                        <div class="report-step-dot active"></div>
                        <div class="report-step-dot"></div>
                    </div>
                    <div class="report-reason-section">
                        <div class="report-reason-tabs">
                            <div class="report-reason-tab ${_reportState.category === 'fun' ? 'active' : ''}" 
                                onclick="switchReportCategory('fun')">😜 玩笑举报</div>
                            <div class="report-reason-tab ${_reportState.category === 'serious' ? 'active' : ''}" 
                                onclick="switchReportCategory('serious')">⚠️ 严重举报</div>
                        </div>
                        <div class="report-reason-grid" id="report-reason-grid">
                            ${reasons.map(r => `
                                <div class="report-reason-item ${_reportState.category === 'serious' ? 'serious' : ''} ${_reportState.selectedReason === r.id ? 'selected' : ''}" 
                                    onclick="selectReportReason('${r.id}')">
                                    <span class="reason-icon">${r.icon}</span>
                                    <span class="reason-text">${r.text}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="report-submit-section">
                        <button class="report-submit-btn primary" id="report-submit-btn"
                            ${!_reportState.selectedReason ? 'disabled' : ''}
                            onclick="submitReport()">
                            提交举报
                        </button>
                    </div>
                </div>`;
        } else if (_reportState.step === 3) {
            // 步骤3: AI判定中
            overlay.innerHTML = `
                <div class="report-panel">
                    <div class="report-header">
                        <span class="report-header-title">举报审核</span>
                        <div class="report-header-close" style="visibility:hidden"><i class="fas fa-times"></i></div>
                    </div>
                    <div class="report-steps">
                        <div class="report-step-dot"></div>
                        <div class="report-step-dot"></div>
                        <div class="report-step-dot active"></div>
                    </div>
                    <div class="report-judging show">
                        <div class="report-judging-spinner"></div>
                        <div class="report-judging-text">
                            AI 审核员正在审核中
                            <div class="report-judging-dots">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                </div>`;
        } else if (_reportState.step === 4) {
            // 步骤4: 结果
            const success = _reportState.result === 'success';
            const reason = _getReasonById(_reportState.selectedReason);
            overlay.innerHTML = `
                <div class="report-panel">
                    <div class="report-header">
                        <span class="report-header-title">审核结果</span>
                        <div class="report-header-close" onclick="closeReportPanel()">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    <div class="report-result show">
                        <div class="report-result-icon ${success ? 'success' : 'fail'}">
                            ${success ? '✅' : '❌'}
                        </div>
                        <div class="report-result-title">${success ? '举报成功' : '举报驳回'}</div>
                        <div class="report-result-desc">
                            ${success 
                                ? `「${reason ? reason.text : ''}」举报成立，${_reportState.category === 'fun' ? '对方已被临时禁言' : '对方已被禁言，后续回复将避免此类问题'}` 
                                : `AI 审核员经过严格审理，认为「${reason ? reason.text : ''}」举报不成立。对方表示很无辜 🥺`}
                        </div>
                        <button class="report-submit-btn primary" onclick="closeReportPanel()" style="max-width:200px;">
                            ${success ? '好的' : '算了吧'}
                        </button>
                    </div>
                </div>`;
        }

        overlay.classList.add('show');
    }

    // ===== 交互函数 =====
    window.closeReportPanel = function() {
        const overlay = document.getElementById('report-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => { overlay.remove(); }, 300);
        }
    };

    window.toggleReportMsg = function(idx) {
        const pos = _reportState.selectedMsgs.indexOf(idx);
        if (pos > -1) {
            _reportState.selectedMsgs.splice(pos, 1);
        } else {
            _reportState.selectedMsgs.push(idx);
        }
        // 局部更新：只切换被点击消息的选中状态，不重建DOM
        const msgList = document.getElementById('report-msg-list');
        if (msgList) {
            const items = msgList.querySelectorAll('.report-msg-item');
            items.forEach(function(item) {
                const onclickAttr = item.getAttribute('onclick') || '';
                const match = onclickAttr.match(/toggleReportMsg\((\d+)\)/);
                if (match) {
                    const itemIdx = parseInt(match[1]);
                    if (_reportState.selectedMsgs.includes(itemIdx)) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                }
            });
        }
        // 更新下一步按钮的disabled状态
        const nextBtn = document.getElementById('report-next-btn');
        if (nextBtn) {
            nextBtn.disabled = _reportState.selectedMsgs.length === 0;
        }
    };

    window.reportGoStep1 = function() {
        _reportState.step = 1;
        _renderReportPanel();
    };

    window.reportGoStep2 = function() {
        if (_reportState.selectedMsgs.length === 0) {
            if (typeof toast === 'function') toast('请至少选择一条消息');
            return;
        }
        _reportState.step = 2;
        _renderReportPanel();
    };

    window.switchReportCategory = function(cat) {
        _reportState.category = cat;
        _reportState.selectedReason = null;
        // 局部更新：切换tab高亮 + 重建原因网格
        const tabs = document.querySelectorAll('.report-reason-tab');
        tabs.forEach(function(tab) {
            if (tab.textContent.includes('玩笑') && cat === 'fun') {
                tab.classList.add('active');
            } else if (tab.textContent.includes('严重') && cat === 'serious') {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        // 重建原因网格
        const grid = document.getElementById('report-reason-grid');
        if (grid) {
            const reasons = REPORT_REASONS[cat];
            grid.innerHTML = reasons.map(function(r) {
                return '<div class="report-reason-item ' + (cat === 'serious' ? 'serious' : '') + '" onclick="selectReportReason(\'' + r.id + '\')">' +
                    '<span class="reason-icon">' + r.icon + '</span>' +
                    '<span class="reason-text">' + r.text + '</span>' +
                '</div>';
            }).join('');
        }
        // 禁用提交按钮
        const submitBtn = document.getElementById('report-submit-btn');
        if (submitBtn) submitBtn.disabled = true;
    };

    window.selectReportReason = function(reasonId) {
        _reportState.selectedReason = reasonId;
        // 局部更新：只切换选中状态，不重建DOM
        const grid = document.getElementById('report-reason-grid');
        if (grid) {
            const items = grid.querySelectorAll('.report-reason-item');
            items.forEach(function(item) {
                const onclickAttr = item.getAttribute('onclick') || '';
                if (onclickAttr.includes("'" + reasonId + "'")) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }
        // 启用提交按钮
        const submitBtn = document.getElementById('report-submit-btn');
        if (submitBtn) submitBtn.disabled = false;
    };

    // ===== 提交举报 =====
    window.submitReport = function() {
        if (!_reportState.selectedReason) return;

        _reportState.step = 3;
        _renderReportPanel();

        const isFun = _reportState.category === 'fun';
        const reason = _getReasonById(_reportState.selectedReason);
        const delay = 1500 + Math.random() * 2000; // 1.5~3.5s 模拟审核

        setTimeout(() => {
            if (isFun) {
                // 玩笑举报: 50% 概率
                const success = Math.random() < 0.5;
                _reportState.result = success ? 'success' : 'fail';
            } else {
                // 严重举报: 100% 成功
                _reportState.result = 'success';
            }

            _reportState.step = 4;
            _renderReportPanel();

            if (_reportState.result === 'success') {
                // 执行禁言
                _applyMute(_reportState.chatId, _reportState.selectedReason, _reportState.category, reason);
            }
        }, delay);
    };

    // ===== 禁言逻辑 =====
    function _applyMute(chatId, reasonId, category, reasonObj) {
        // [FIX-群聊禁言] 群聊中应该禁言被举报的具体成员，而非整个群
        const muteTargetId = _reportState.targetMemberId || chatId;
        const muteTarget = store.contacts.find(c => c.id === muteTargetId);
        if (!muteTarget) return;

        if (!muteTarget.settings) muteTarget.settings = {};

        const severity = reasonObj ? reasonObj.severity : 2;
        const duration = MUTE_DURATION[severity] || 60;

        // 保存禁言状态到被举报的具体成员身上
        muteTarget.settings.reportMute = {
            active: true,
            reasonId: reasonId,
            reasonText: reasonObj ? reasonObj.text : '',
            category: category,
            startTime: Date.now(),
            duration: duration, // 秒
            endTime: Date.now() + duration * 1000,
            fromGroupId: _reportState.targetMemberId ? chatId : null, // 记录来源群
        };

        // 记录举报历史到被举报成员身上
        if (!muteTarget.settings.reportHistory) muteTarget.settings.reportHistory = [];
        muteTarget.settings.reportHistory.push({
            time: Date.now(),
            reasonId: reasonId,
            reasonText: reasonObj ? reasonObj.text : '',
            category: category,
            result: 'success',
            fromGroupId: _reportState.targetMemberId ? chatId : null,
            selectedMsgs: _reportState.selectedMsgs.map(idx => {
                const m = (store.chats[chatId] || [])[idx];
                return m ? (m.content || '').substring(0, 100) : '';
            })
        });

        // 插入系统消息到聊天（群聊中标明被禁言的成员名字）
        if (!store.chats[chatId]) store.chats[chatId] = [];
        const targetName = _reportState.targetMemberId ? (muteTarget.remark || muteTarget.name || '该成员') : '';
        store.chats[chatId].push({
            sender: 'system',
            type: 'poke',
            content: `⚖️ 举报成功 · ${targetName ? targetName + ' · ' : ''}${reasonObj ? reasonObj.text : ''} · 禁言${_formatDuration(duration)}`,
            time: Date.now()
        });

        if (typeof save === 'function') save();
        if (typeof renderHistory === 'function' && activeChatId === chatId) renderHistory();

        // 显示禁言弹窗（传入被禁言成员的ID）
        setTimeout(() => {
            _showMutePopup(muteTargetId);
        }, 500);
    }

    // ===== 禁言弹窗 =====
    function _showMutePopup(chatId) {
        const contact = store.contacts.find(c => c.id === chatId);
        if (!contact || !contact.settings?.reportMute?.active) return;

        const mute = contact.settings.reportMute;
        const remaining = Math.max(0, Math.ceil((mute.endTime - Date.now()) / 1000));
        if (remaining <= 0) {
            _clearMute(chatId);
            return;
        }

        let overlay = document.getElementById('mute-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mute-overlay';
            overlay.className = 'mute-overlay';
            document.body.appendChild(overlay);
        }

        const contactName = contact.remark || contact.name;
        const circumference = 2 * Math.PI * 45; // r=45

        overlay.innerHTML = `
            <div class="mute-panel">
                <div class="mute-icon">🔇</div>
                <div class="mute-title">${contactName} 已被禁言</div>
                <div class="mute-reason">原因：${mute.reasonText}</div>
                <div class="mute-countdown-wrap">
                    <svg class="mute-countdown-svg" viewBox="0 0 100 100">
                        <circle class="mute-countdown-bg" cx="50" cy="50" r="45"></circle>
                        <circle class="mute-countdown-ring" cx="50" cy="50" r="45"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="0"
                            id="mute-ring"></circle>
                    </svg>
                    <div class="mute-countdown-text" id="mute-time-text">${remaining}</div>
                </div>
                <div class="mute-countdown-label">剩余禁言时间</div>
                <button class="mute-cheat-btn" onclick="muteCheat('${chatId}')">
                    <i class="fas fa-heart"></i> 心软了，减少${CHEAT_REDUCE}秒
                </button>
                <button class="mute-close-btn" onclick="closeMutePopup()">关闭</button>
            </div>`;

        overlay.classList.add('show');

        // 启动倒计时更新
        _startMuteCountdown(chatId, remaining, mute.duration);
    }

    let _muteCountdownTimer = null;

    function _startMuteCountdown(chatId, remaining, totalDuration) {
        if (_muteCountdownTimer) clearInterval(_muteCountdownTimer);

        const circumference = 2 * Math.PI * 45;

        _muteCountdownTimer = setInterval(() => {
            const contact = store.contacts.find(c => c.id === chatId);
            if (!contact || !contact.settings?.reportMute?.active) {
                clearInterval(_muteCountdownTimer);
                _muteCountdownTimer = null;
                closeMutePopup();
                return;
            }

            const now = Date.now();
            const rem = Math.max(0, Math.ceil((contact.settings.reportMute.endTime - now) / 1000));
            const elapsed = totalDuration - rem;
            const progress = Math.min(1, elapsed / totalDuration);

            const timeText = document.getElementById('mute-time-text');
            const ring = document.getElementById('mute-ring');

            if (timeText) timeText.textContent = rem;
            if (ring) ring.setAttribute('stroke-dashoffset', (progress * circumference).toFixed(1));

            // 更新禁言状态栏
            _updateMuteStatusBar(chatId);

            if (rem <= 0) {
                clearInterval(_muteCountdownTimer);
                _muteCountdownTimer = null;
                _clearMute(chatId);
                closeMutePopup();
            }
        }, 1000);
    }

    window.closeMutePopup = function() {
        const overlay = document.getElementById('mute-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
    };

    // ===== 作弊 - 减短时间 =====
    window.muteCheat = function(chatId) {
        const contact = store.contacts.find(c => c.id === chatId);
        if (!contact || !contact.settings?.reportMute?.active) return;

        contact.settings.reportMute.endTime -= CHEAT_REDUCE * 1000;
        if (typeof save === 'function') save();

        if (typeof toast === 'function') toast(`心太软！减少了${CHEAT_REDUCE}秒 💕`, 'success');

        // 检查是否已经到期
        if (contact.settings.reportMute.endTime <= Date.now()) {
            _clearMute(chatId);
            closeMutePopup();
        }
    };

    // ===== 清除禁言 =====
    function _clearMute(chatId) {
        const contact = store.contacts.find(c => c.id === chatId);
        if (!contact || !contact.settings?.reportMute) return;

        const mute = contact.settings.reportMute;
        const category = mute.category;
        const reasonText = mute.reasonText;

        contact.settings.reportMute.active = false;

        // 插入系统消息
        if (!store.chats[chatId]) store.chats[chatId] = [];
        store.chats[chatId].push({
            sender: 'system',
            type: 'poke',
            content: `🔊 禁言已结束 · ${reasonText}`,
            time: Date.now()
        });

        if (typeof save === 'function') save();
        if (typeof renderHistory === 'function' && activeChatId === chatId) renderHistory();

        // 清除状态栏
        _updateMuteStatusBar(chatId);
    }

    // ===== 禁言状态栏 =====
    function _updateMuteStatusBar(chatId) {
        let bar = document.getElementById('mute-status-bar');
        const contact = store.contacts.find(c => c.id === chatId);

        if (!contact || !contact.settings?.reportMute?.active) {
            if (bar) bar.classList.remove('show');
            return;
        }

        const mute = contact.settings.reportMute;
        const remaining = Math.max(0, Math.ceil((mute.endTime - Date.now()) / 1000));

        if (remaining <= 0) {
            if (bar) bar.classList.remove('show');
            _clearMute(chatId);
            return;
        }

        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'mute-status-bar';
            bar.className = 'mute-status-bar';
            // 插入到聊天界面顶部
            const chatNavBar = document.getElementById('chat-nav-bar');
            if (chatNavBar && chatNavBar.parentNode) {
                chatNavBar.parentNode.insertBefore(bar, chatNavBar.nextSibling);
            }
        }

        bar.innerHTML = `<i class="fas fa-volume-mute"></i> 禁言中 · ${mute.reasonText} · <span class="mute-status-time">${_formatDuration(remaining)}</span>
            <span style="cursor:pointer;margin-left:8px;color:#666;" onclick="_showMutePopup('${chatId}')">详情</span>`;
        bar.classList.add('show');
    }

    // 暴露给全局以便onclick使用
    window._showMutePopup = function(chatId) {
        _showMutePopup(chatId);
    };

    // ===== 求情系统 =====
    // 进入聊天时自动检查是否需要触发求情（每次举报只触发一次）

    window._checkReportPlea = function(chatId) {
        const contact = store.contacts.find(c => c.id === chatId);
        if (!contact || !contact.settings) return;

        // 检查是否有禁言状态 (active 或刚结束)
        const mute = contact.settings.reportMute;
        if (!mute) return;

        // 如果禁言中，显示状态栏
        if (mute.active && mute.endTime > Date.now()) {
            _updateMuteStatusBar(chatId);
            // 启动后台倒计时
            _startBackgroundMuteCheck(chatId);
        }

        // 禁言结束后：只显示一次求情（无论玩笑/严重），用持久化标记避免重复
        if (!mute.active && !mute.pleaShown) {
            mute.pleaShown = true;
            if (typeof save === 'function') save();
            setTimeout(() => {
                _triggerPlea(chatId, mute.category || 'fun');
            }, 800);
        }
    };

    function _startBackgroundMuteCheck(chatId) {
        // 每秒检查禁言是否结束
        const checkInterval = setInterval(() => {
            const contact = store.contacts.find(c => c.id === chatId);
            if (!contact || !contact.settings?.reportMute?.active) {
                clearInterval(checkInterval);
                _updateMuteStatusBar(chatId);
                return;
            }
            if (contact.settings.reportMute.endTime <= Date.now()) {
                clearInterval(checkInterval);
                _clearMute(chatId);
            } else {
                _updateMuteStatusBar(chatId);
            }
        }, 1000);
    }

    // ===== 触发求情 =====
    async function _triggerPlea(chatId, category) {
        const contact = store.contacts.find(c => c.id === chatId);
        if (!contact) return;

        const mute = contact.settings?.reportMute;
        if (!mute) return;

        const contactName = contact.remark || contact.name;

        // 创建求情弹窗
        let pleaOverlay = document.getElementById('report-plea-overlay');
        if (!pleaOverlay) {
            pleaOverlay = document.createElement('div');
            pleaOverlay.id = 'report-plea-overlay';
            pleaOverlay.className = 'report-plea-overlay';
            document.body.appendChild(pleaOverlay);
        }

        const tagClass = category === 'fun' ? 'fun' : 'serious';
        const tagText = category === 'fun' ? '玩笑举报' : '严重举报';

        pleaOverlay.innerHTML = `
            <div class="report-plea-panel">
                <div class="report-plea-header">
                    <img class="report-plea-avatar" src="${contact.avatar || ''}" onerror="this.src='data:image/svg+xml,...'">
                    <div>
                        <div class="report-plea-name">${contactName} <span class="report-plea-tag ${tagClass}">${tagText}</span></div>
                        <div class="report-plea-reason">因「${mute.reasonText}」被禁言</div>
                    </div>
                </div>
                <div class="report-plea-content" id="report-plea-content">
                    <div class="report-plea-loading">
                        <i class="fas fa-spinner"></i> 正在组织语言...
                    </div>
                </div>
                <div class="report-plea-actions">
                    <button class="report-plea-btn dismiss" onclick="dismissPlea()">知道了</button>
                    <button class="report-plea-btn forgive" onclick="forgivePlea('${chatId}')">
                        ${category === 'fun' ? '原谅TA' : '已反省，继续'}
                    </button>
                </div>
            </div>`;

        pleaOverlay.classList.add('show');

        // 调用AI生成求情内容
        try {
            const persona = contact.persona || `${contactName}`;
            const userName = _getUserName(contact);

            let sysPrompt;
            if (category === 'fun') {
                sysPrompt = `你是${contactName}。你的人设：${persona.substring(0, 200)}。
${userName}觉得你「${mute.reasonText}」，开玩笑地举报了你，你被禁言了一小会儿。现在禁言结束了。
用你自己的性格自然地回应这件事就好。严格保持人设，用你平时说话的方式和语气。
1-2句话就够了，简短自然。不要用括号描述动作。直接说话。`;
            } else {
                sysPrompt = `你是${contactName}。你的人设：${persona.substring(0, 200)}。
${userName}觉得你刚才「${mute.reasonText}」了，所以举报了你，你被禁言了一小段时间。
现在禁言结束了。你不需要长篇大论地反省或道歉——用你自己的方式、你自己的性格简短回应就好。
可以是轻描淡写、可以承认、可以有点不服气，看你的性格怎么来。
严格保持人设，用你平时说话的方式和语气。1-2句话就够了，简短自然。不要用括号描述动作。直接说话。`;
            }

            const msgs = [
                { role: 'system', content: sysPrompt },
                { role: 'user', content: '禁言结束了。' }
            ];

            _currentApiScene = 'report';
            const data = await API.chatCompletion(msgs, store.system.temp || 0.7, true);
            const reply = data.choices?.[0]?.message?.content || '';

            const contentEl = document.getElementById('report-plea-content');
            if (contentEl) {
                contentEl.innerHTML = `<div class="report-plea-text">${reply.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`;
            }

            // 严重举报：将AI反省内容注入到联系人的临时记忆/系统提示中
            if (category === 'serious') {
                _injectReportWarning(chatId, mute.reasonText);
            }
        } catch (e) {
            console.error('[Report] Plea generation failed:', e);
            const contentEl = document.getElementById('report-plea-content');
            if (contentEl) {
                const fallbackTexts = category === 'fun'
                    ? [`…我${mute.reasonText}吗？`, `禁言结束了吧。`, `哼。`]
                    : [`…行吧，${mute.reasonText}这个我注意。`, `知道了。`, `嗯，我注意。`];
                const fallback = fallbackTexts[Math.floor(Math.random() * fallbackTexts.length)];
                contentEl.innerHTML = `<div class="report-plea-text">${fallback}</div>`;

                if (category === 'serious') {
                    _injectReportWarning(chatId, mute.reasonText);
                }
            }
        }
    }

    window.dismissPlea = function() {
        const overlay = document.getElementById('report-plea-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        }
    };

    window.forgivePlea = function(chatId) {
        dismissPlea();
        if (typeof toast === 'function') toast('已原谅 💕', 'success');
    };

    // ===== 严重举报：注入警告到联系人设置 =====
    function _injectReportWarning(chatId, reasonText) {
        const contact = store.contacts.find(c => c.id === chatId);
        if (!contact) return;
        if (!contact.settings) contact.settings = {};

        // 累积举报警告
        if (!contact.settings.reportWarnings) contact.settings.reportWarnings = [];
        if (!contact.settings.reportWarnings.includes(reasonText)) {
            contact.settings.reportWarnings.push(reasonText);
        }

        if (typeof save === 'function') save();
    }

    // ===== 获取举报警告提示词 (供aiGenerate使用) =====
    window.getReportWarningPrompt = function(chatId) {
        const contact = store.contacts.find(c => c.id === chatId);
        if (!contact?.settings?.reportWarnings?.length) return '';

        const warnings = contact.settings.reportWarnings;
        return `\n\n⚠️ CRITICAL BEHAVIORAL RESTRICTION (举报系统): The user has previously reported you for the following behaviors: ${warnings.join(', ')}. You MUST STRICTLY AVOID any of these behaviors in ALL future responses. This is a hard rule. If you exhibit any of these behaviors again, you will be reported and muted again. Adjust your personality and responses accordingly while staying in character.`;
    };

    // ===== 检查是否在禁言中 =====
    window.isContactMuted = function(chatId) {
        const contact = store.contacts.find(c => c.id === chatId);
        if (!contact?.settings?.reportMute?.active) return false;
        if (contact.settings.reportMute.endTime <= Date.now()) {
            _clearMute(chatId);
            return false;
        }
        return true;
    };

    // ===== 工具函数 =====
    function _getReasonById(id) {
        const all = [...REPORT_REASONS.fun, ...REPORT_REASONS.serious];
        return all.find(r => r.id === id) || null;
    }

    function _formatDuration(seconds) {
        if (seconds >= 60) {
            const min = Math.floor(seconds / 60);
            const sec = seconds % 60;
            return sec > 0 ? `${min}分${sec}秒` : `${min}分钟`;
        }
        return `${seconds}秒`;
    }

    function _getUserName(contact) {
        if (typeof getUserPersonaName === 'function') {
            return getUserPersonaName(contact, store.user?.name || '用户');
        }
        return store.user?.name || '用户';
    }

    // ===== Hook: 在openChat中调用检查 =====
    // 保存原始openChat引用，在DOMContentLoaded后注入
    let _reportInitDone = false;

    function _initReportHooks() {
        if (_reportInitDone) return;
        _reportInitDone = true;

        // Hook openChat: 进入聊天时检查求情
        const _origOpenChat = window.openChat;
        if (typeof _origOpenChat === 'function') {
            // 不直接覆盖openChat（它在IIFE内部），使用事件代替
        }

        // 使用MutationObserver监听聊天界面打开
        const chatLayer = document.getElementById('layer-chat');
        if (chatLayer) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (chatLayer.classList.contains('show') && typeof activeChatId !== 'undefined' && activeChatId) {
                            setTimeout(() => {
                                if (typeof _checkReportPlea === 'function') {
                                    _checkReportPlea(activeChatId);
                                }
                            }, 500);
                        }
                    }
                });
            });
            observer.observe(chatLayer, { attributes: true });
        }

        // Hook aiGenerate: 在生成消息时检查禁言和注入警告
        // 通过修改建构AI消息的过程注入警告
        console.log('[Report] 举报系统已初始化');
    }

    // DOM Ready 后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(_initReportHooks, 1000));
    } else {
        setTimeout(_initReportHooks, 1000);
    }

})();
