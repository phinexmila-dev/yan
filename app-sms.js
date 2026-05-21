// ===== SMS APP - 短信应用（完整重写） =====
// [SMS-FIX-1] callSmsAI 走 API.chatCompletion
// [SMS-FIX-2] 切号下拉定位 + 事件冒泡
// [SMS-FEAT-3] 拆分发送/生成按钮
// [SMS-FEAT-4] 消息状态机 + 失败重试
// [SMS-FEAT-5] 记忆互通（微信↔短信）
// [SMS-FEAT-6] 小号系统
// [SMS-FEAT-7] 主动来信
// [SMS-FEAT-8] 重新生成
// [SMS-FEAT-9] 系统短信
// [SMS-FEAT-10] 定时短信
// [SMS-FEAT-14] 草稿
// [SMS-FEAT-15] 搜索高亮
// [SMS-FEAT-16] 长消息折叠
// [SMS-FEAT-17] 转发/收藏
// [SMS-FEAT-18] 分页渲染
// [SMS-FEAT-19] 归档
// [SMS-FEAT-20] 未读红点
(function() {
'use strict';

// --- 数据初始化 ---
function ensureSmsData() {
    if (!store.smsApp) {
        store.smsApp = {
            accounts: [{
                id: 'sms_acc_main', name: '本机号码', phone: '138****8888',
                avatar: '', isDefault: true, signature: ''
            }],
            activeAccountId: 'sms_acc_main',
            conversations: { 'sms_acc_main': [] },
            settings: { notification: true, allowProactive: true, systemSendersEnabled: true },
            altMemory: {}, draft: {}, scheduledMessages: [],
            archivedMessages: {}, favorites: [],
            systemSenders: [
                { id: 'sys_10086', name: '10086', phone: '10086', type: 'carrier' },
                { id: 'sys_10010', name: '10010', phone: '10010', type: 'carrier' },
                { id: 'sys_95588', name: '工商银行', phone: '95588', type: 'bank' },
                { id: 'sys_95533', name: '建设银行', phone: '95533', type: 'bank' },
                { id: 'sys_1069', name: '快递通知', phone: '1069xxxx', type: 'logistics' }
            ],
            lastProactiveCheck: 0
        };
    }
    var aid = store.smsApp.activeAccountId;
    if (!store.smsApp.conversations[aid]) store.smsApp.conversations[aid] = [];
    if (!store.smsApp.altMemory) store.smsApp.altMemory = {};
    if (!store.smsApp.draft) store.smsApp.draft = {};
    if (!store.smsApp.scheduledMessages) store.smsApp.scheduledMessages = [];
    if (!store.smsApp.archivedMessages) store.smsApp.archivedMessages = {};
    if (!store.smsApp.favorites) store.smsApp.favorites = [];
    if (!store.smsApp.systemSenders) store.smsApp.systemSenders = [];
    if (!store.smsApp.settings) store.smsApp.settings = { notification: true, allowProactive: true };
}

function getActiveAccount() {
    ensureSmsData();
    return store.smsApp.accounts.find(function(a) { return a.id === store.smsApp.activeAccountId; }) || store.smsApp.accounts[0];
}
function getConversations() {
    ensureSmsData();
    return store.smsApp.conversations[store.smsApp.activeAccountId] || [];
}
function findConversation(contactId) {
    return getConversations().find(function(c) { return c.contactId === contactId; });
}
function getOrCreateConversation(contactId, opts) {
    ensureSmsData();
    opts = opts || {};
    var aid = store.smsApp.activeAccountId;
    var convs = store.smsApp.conversations[aid];
    // 如果有 fromPhone 则按 fromPhone 匹配
    var existing;
    if (opts.fromPhone) {
        existing = convs.find(function(c) { return c.contactId === contactId && c.fromPhone === opts.fromPhone; });
    }
    if (!existing) existing = convs.find(function(c) { return c.contactId === contactId && !c.fromPhone; });
    if (existing) return existing;
    var contact = (store.contacts || []).find(function(c) { return c.id === contactId; });
    var conv = {
        id: 'sms_conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        contactId: contactId,
        contactName: contact ? contact.name : (opts.displayName || '未知'),
        contactAvatar: contact ? (contact.avatar || '') : '',
        pinned: false, muted: false, unreadCount: 0,
        lastMessage: '', lastTime: Date.now(), messages: [],
        fromPhone: opts.fromPhone || null,
        altPhoneId: opts.altPhoneId || null,
        isSystemSender: opts.isSystemSender || false
    };
    convs.unshift(conv);
    return conv;
}

// --- 时间格式化 ---
function formatSmsTime(ts) {
    if (!ts) return '';
    var d = new Date(ts), now = new Date(), diff = now - d, mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return mins + '分钟前';
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (msgDay.getTime() === today.getTime()) return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
    var yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (msgDay.getTime() === yesterday.getTime()) return '昨天';
    var weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    if (msgDay > weekAgo) return ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()];
    return (d.getMonth()+1) + '/' + d.getDate();
}
function formatSmsChatTime(ts) {
    if (!ts) return '';
    var d = new Date(ts), now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var time = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
    if (msgDay.getTime() === today.getTime()) return '今天 ' + time;
    var yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (msgDay.getTime() === yesterday.getTime()) return '昨天 ' + time;
    return (d.getMonth()+1) + '月' + d.getDate() + '日 ' + time;
}
// [SMS-FIX-分句v3] 将AI回复拆分成多个短信气泡（修复分句断裂问题）
// v3改进：提高逗号分句阈值(10→25)、清洗首尾标点、保证最小气泡长度(5字)
function _splitSmsBubbles(text) {
    if (!text) return [text || ''];
    // 清洗辅助函数：去掉首尾多余的逗号/分号等标点，保留句末标点
    function _cleanBubble(s) {
        return s.replace(/^[，,、；;：:\s]+/, '').replace(/[，,、；;：:\s]+$/, '').trim();
    }
    // 先按换行符拆分
    var lines = text.split(/\n/).filter(function(s) { return s.trim(); });
    var bubbles = [];
    for (var li = 0; li < lines.length; li++) {
        var line = lines[li].trim();
        // 按句末标点拆分（保留标点在句尾）—— 包含省略号、波浪号等
        var raw = line.split(/([。！？\?!]+|\.{3}|…{1,3}|~+)/).filter(function(p) { return p; });
        var merged = [];
        for (var ri = 0; ri < raw.length; ri++) {
            if (/^[。！？\?!]+$|^\.{3}$|^…{1,3}$|^~+$/.test(raw[ri]) && merged.length > 0) {
                merged[merged.length - 1] += raw[ri];
            } else if (raw[ri].trim()) {
                merged.push(raw[ri].trim());
            }
        }
        // 如果整行没被拆分（merged<=1）且超过25字，按逗号拆
        if (merged.length <= 1 && line.length > 25) {
            var commaSplit = line.split(/([，,])/).filter(function(p) { return p; });
            if (commaSplit.length > 2) {
                merged = [];
                var cbuf = '';
                for (var ci = 0; ci < commaSplit.length; ci++) {
                    if (/^[，,]$/.test(commaSplit[ci]) && cbuf) {
                        cbuf += commaSplit[ci];
                    } else {
                        cbuf += commaSplit[ci];
                    }
                    // [FIX] 阈值从10提高到25，避免过度碎片化
                    if (cbuf.length >= 25 && ci < commaSplit.length - 1) {
                        var ctrimmed = _cleanBubble(cbuf);
                        if (ctrimmed && ctrimmed.length >= 5) {
                            merged.push(ctrimmed);
                        } else if (ctrimmed && merged.length > 0) {
                            // 太短的片段合并到上一个气泡
                            merged[merged.length - 1] += '，' + ctrimmed;
                        } else if (ctrimmed) {
                            merged.push(ctrimmed);
                        }
                        cbuf = '';
                    }
                }
                if (cbuf) {
                    var ctrimmed2 = _cleanBubble(cbuf);
                    if (ctrimmed2) {
                        // 尾部片段太短时合并到上一个
                        if (ctrimmed2.length < 5 && merged.length > 0) {
                            merged[merged.length - 1] += '，' + ctrimmed2;
                        } else {
                            merged.push(ctrimmed2);
                        }
                    }
                }
            }
        }
        // 超过60字的片段按逗号/分号再拆（阈值从50提高到60）
        for (var mi = 0; mi < merged.length; mi++) {
            var seg = merged[mi];
            if (seg.length <= 60) {
                bubbles.push(seg);
            } else {
                var sub = seg.split(/([，,；;])/).filter(function(p) { return p; });
                var subMerged = [];
                for (var si = 0; si < sub.length; si++) {
                    if (/^[，,；;]$/.test(sub[si]) && subMerged.length > 0) {
                        subMerged[subMerged.length - 1] += sub[si];
                    } else if (sub[si].trim()) {
                        subMerged.push(sub[si].trim());
                    }
                }
                if (subMerged.length > 1) {
                    // 合并过短片段（阈值40字）
                    var buf = '';
                    for (var bi = 0; bi < subMerged.length; bi++) {
                        if (buf.length + subMerged[bi].length <= 40) {
                            buf += subMerged[bi];
                        } else {
                            if (buf) {
                                var trimmed = _cleanBubble(buf);
                                if (trimmed) bubbles.push(trimmed);
                            }
                            buf = subMerged[bi];
                        }
                    }
                    if (buf) {
                        var trimmed2 = _cleanBubble(buf);
                        if (trimmed2) bubbles.push(trimmed2);
                    }
                } else {
                    bubbles.push(seg);
                }
            }
        }
    }
    // 最终清洗：去掉每个气泡首尾的残余逗号/分号
    var result = [];
    for (var fi = 0; fi < bubbles.length; fi++) {
        var cleaned = _cleanBubble(bubbles[fi]);
        if (cleaned) {
            // 太短的片段合并到上一个气泡
            if (cleaned.length < 5 && result.length > 0) {
                result[result.length - 1] += '，' + cleaned;
            } else {
                result.push(cleaned);
            }
        }
    }
    return result.length > 0 ? result : [text];
}
// [SMS-FEAT-15] 高亮工具
function smsHighlight(text, kw) {
    if (!kw) return text;
    var regex = new RegExp('(' + kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// --- 当前状态 ---
var smsCurrentView = 'list';
var smsActiveChatConvId = null;
var smsIsGenerating = false;
var smsAbortController = null; // [P2-1] 取消生成
var smsRenderedCount = 50;
var smsPageSize = 50;
var smsExpandedMsgIds = new Set(); // [P3-6] 长消息展开状态（内存，不持久化）
var _smsDraftTimer = null; // [P3-1] 草稿 debounce

// ===== 会话列表页 =====
function renderSmsApp() {
    ensureSmsData();
    smsCurrentView = 'list';
    var container = document.getElementById('sms-main-content');
    if (!container) return;
    var account = getActiveAccount();
    var convs = getConversations();
    convs.sort(function(a, b) {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.lastTime || 0) - (a.lastTime || 0);
    });
    // [SMS-FIX-2] .sms-nav-left 加 position:relative 让 dropdown 相对它定位
    var html = '<div class="sms-nav">';
    html += '<div class="sms-nav-left" style="position:relative;">';
    html += '<span class="sms-nav-back" onclick="exitApp()" style="margin-right:6px;"><i class="fas fa-chevron-left"></i></span>';
    html += '<div class="sms-account-switcher" onclick="smsToggleAccountDropdown(event)">';
    html += '<span class="sms-acc-dot"></span>';
    html += '<span>' + escapeHtml(account.name) + '</span>';
    html += '<i class="fas fa-chevron-down sms-acc-arrow"></i>';
    html += '</div>';
    // [SMS-FIX-2] dropdown 在 nav-left 内，onclick stopPropagation 防止冒泡关闭
    html += '<div class="sms-account-dropdown" id="sms-account-dropdown" onclick="event.stopPropagation()">';
    store.smsApp.accounts.forEach(function(acc) {
        var isActive = acc.id === store.smsApp.activeAccountId;
        html += '<div class="sms-account-dropdown-item ' + (isActive ? 'active' : '') + '" onclick="event.stopPropagation();smsSwitchAccount(\'' + acc.id + '\')">';
        html += '<span class="check">' + (isActive ? '<i class="fas fa-check"></i>' : '') + '</span>';
        html += '<span>' + escapeHtml(acc.name) + '</span>';
        html += '<span style="color:#8e8e93;font-size:12px;margin-left:auto;">' + escapeHtml(acc.phone) + '</span>';
        html += '</div>';
    });
    html += '</div></div>';
    html += '<div class="sms-nav-title">短信</div>';
    html += '<div class="sms-nav-right">';
    html += '<button class="sms-nav-btn" onclick="smsOpenAccounts()" title="号码管理"><i class="fas fa-sim-card"></i></button>';
    html += '<button class="sms-nav-btn" onclick="smsOpenNew()" title="新建短信"><i class="fas fa-pen-to-square"></i></button>';
    html += '</div></div>';
    html += '<div class="sms-search-bar"><input class="sms-search-input" placeholder="搜索短信..." oninput="smsSearchConv(this.value)"></div>';
    html += '<div class="sms-conv-list" id="sms-conv-list">';
    html += convs.length === 0
        ? '<div class="sms-empty"><i class="fas fa-comment-dots"></i><span>暂无短信</span></div>'
        : renderSmsConvList(convs);
    html += '</div>';
    container.innerHTML = html;
}

function renderSmsConvList(convs) {
    var html = '';
    convs.forEach(function(conv) {
        var contact = (store.contacts || []).find(function(c) { return c.id === conv.contactId; });
        if (contact) { conv.contactName = contact.name; conv.contactAvatar = contact.avatar || ''; }
        var name1 = (conv.contactName || '?')[0];
        var avatarHtml = conv.contactAvatar
            ? '<div class="sms-conv-avatar"><img src="' + conv.contactAvatar + '" onerror="this.parentElement.innerHTML=\'' + name1 + '\'"></div>'
            : '<div class="sms-conv-avatar">' + name1 + '</div>';
        // 小号来源标记
        var nameExtra = conv.fromPhone ? ' <span style="color:#8e8e93;font-size:11px;">(' + escapeHtml(conv.fromPhone) + ')</span>' : '';
        html += '<div class="sms-conv-item ' + (conv.pinned ? 'pinned' : '') + '" onclick="smsOpenChat(\'' + conv.id + '\')" oncontextmenu="smsConvContextMenu(event,\'' + conv.id + '\')">';
        if (conv.unreadCount > 0) html += '<div class="sms-conv-badge">' + (conv.unreadCount > 99 ? '99+' : conv.unreadCount) + '</div>';
        html += avatarHtml;
        html += '<div class="sms-conv-body"><div class="sms-conv-header">';
        html += '<span class="sms-conv-name">' + escapeHtml(conv.contactName || '未知') + nameExtra + '</span>';
        html += '<span class="sms-conv-time">' + formatSmsTime(conv.lastTime) + '</span>';
        html += '</div><div class="sms-conv-preview">' + escapeHtml(conv.lastMessage || '') + '</div></div></div>';
    });
    return html;
}

// [SMS-FEAT-15] 搜索（带高亮）
window.smsSearchConv = function(keyword) {
    var list = document.getElementById('sms-conv-list');
    if (!list) return;
    var convs = getConversations();
    if (!keyword || !keyword.trim()) {
        list.innerHTML = convs.length === 0
            ? '<div class="sms-empty"><i class="fas fa-comment-dots"></i><span>暂无短信</span></div>'
            : renderSmsConvList(convs);
        return;
    }
    var kw = keyword.trim().toLowerCase();
    var filtered = convs.filter(function(c) {
        if ((c.contactName || '').toLowerCase().includes(kw)) return true;
        if ((c.lastMessage || '').toLowerCase().includes(kw)) return true;
        return (c.messages || []).some(function(m) { return (m.content || '').toLowerCase().includes(kw); });
    });
    if (filtered.length === 0) {
        list.innerHTML = '<div class="sms-empty"><i class="fas fa-search"></i><span>未找到相关短信</span></div>';
        return;
    }
    var html = '';
    filtered.forEach(function(conv) {
        var contact = (store.contacts || []).find(function(c) { return c.id === conv.contactId; });
        if (contact) { conv.contactName = contact.name; conv.contactAvatar = contact.avatar || ''; }
        var name1 = (conv.contactName || '?')[0];
        var avatarHtml = conv.contactAvatar
            ? '<div class="sms-conv-avatar"><img src="' + conv.contactAvatar + '" onerror="this.parentElement.innerHTML=\'' + name1 + '\'"></div>'
            : '<div class="sms-conv-avatar">' + name1 + '</div>';
        html += '<div class="sms-conv-item ' + (conv.pinned ? 'pinned' : '') + '" onclick="smsOpenChat(\'' + conv.id + '\')">';
        if (conv.unreadCount > 0) html += '<div class="sms-conv-badge">' + (conv.unreadCount > 99 ? '99+' : conv.unreadCount) + '</div>';
        html += avatarHtml;
        html += '<div class="sms-conv-body"><div class="sms-conv-header">';
        html += '<span class="sms-conv-name">' + smsHighlight(escapeHtml(conv.contactName || '未知'), kw) + '</span>';
        html += '<span class="sms-conv-time">' + formatSmsTime(conv.lastTime) + '</span>';
        html += '</div><div class="sms-conv-preview">' + smsHighlight(escapeHtml(conv.lastMessage || ''), kw) + '</div></div></div>';
    });
    list.innerHTML = html;
};

// [SMS-FIX-2] 切号下拉 —— 用 mousedown capture 替代 once click，避免竞态
var _smsDropdownCloseHandler = null;
window.smsToggleAccountDropdown = function(e) {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    var dd = document.getElementById('sms-account-dropdown');
    if (!dd) return;
    if (dd.classList.contains('show')) { _smsCloseDropdown(); return; }
    dd.classList.add('show');
    // 清理旧监听
    if (_smsDropdownCloseHandler) document.removeEventListener('mousedown', _smsDropdownCloseHandler, true);
    _smsDropdownCloseHandler = function(evt) {
        var d2 = document.getElementById('sms-account-dropdown');
        if (d2 && !d2.contains(evt.target)) { _smsCloseDropdown(); }
    };
    // 下一帧绑定，避免本次点击立刻触发
    requestAnimationFrame(function() {
        document.addEventListener('mousedown', _smsDropdownCloseHandler, true);
    });
};
function _smsCloseDropdown() {
    var d2 = document.getElementById('sms-account-dropdown');
    if (d2) d2.classList.remove('show');
    if (_smsDropdownCloseHandler) { document.removeEventListener('mousedown', _smsDropdownCloseHandler, true); _smsDropdownCloseHandler = null; }
}
window.smsSwitchAccount = function(accId) {
    ensureSmsData();
    store.smsApp.activeAccountId = accId;
    if (!store.smsApp.conversations[accId]) store.smsApp.conversations[accId] = [];
    _smsCloseDropdown();
    renderSmsApp(); save();
};

// 会话右键菜单
window.smsConvContextMenu = function(e, convId) {
    e.preventDefault(); e.stopPropagation();
    var conv = getConversations().find(function(c) { return c.id === convId; });
    if (!conv) return;
    var items = [
        { icon: 'fa-thumbtack', label: conv.pinned ? '取消置顶' : '置顶', action: 'pin' },
        { icon: conv.unreadCount > 0 ? 'fa-envelope-open' : 'fa-envelope', label: conv.unreadCount > 0 ? '标记已读' : '标记未读', action: 'read' },
        { icon: 'fa-trash', label: '删除会话', action: 'delete', danger: true }
    ];
    showSmsContextMenu(e.clientX, e.clientY, items, function(action) {
        if (action === 'pin') { conv.pinned = !conv.pinned; renderSmsApp(); save(); }
        else if (action === 'read') { conv.unreadCount = conv.unreadCount > 0 ? 0 : 1; renderSmsApp(); save(); }
        else if (action === 'delete') {
            if (typeof showConfirm === 'function') {
                showConfirm('删除会话', '确定删除与 ' + escapeHtml(conv.contactName) + ' 的短信会话吗？', function() {
                    var aid = store.smsApp.activeAccountId;
                    store.smsApp.conversations[aid] = store.smsApp.conversations[aid].filter(function(c) { return c.id !== convId; });
                    renderSmsApp(); save();
                });
            }
        }
    });
};

// 通用右键菜单
function showSmsContextMenu(x, y, items, callback) {
    closeSmsContextMenu();
    var menu = document.createElement('div');
    menu.className = 'sms-context-menu'; menu.id = 'sms-context-menu-active';
    menu.innerHTML = items.map(function(item) {
        return '<div class="sms-context-menu-item ' + (item.danger ? 'danger' : '') + '" data-action="' + item.action + '">'
            + '<i class="fas ' + item.icon + '"></i><span>' + item.label + '</span></div>';
    }).join('');
    document.body.appendChild(menu);
    var mw = 160, mh = items.length * 44;
    menu.style.left = Math.min(x, window.innerWidth - mw - 10) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - mh - 10) + 'px';
    requestAnimationFrame(function() { menu.classList.add('show'); });
    menu.querySelectorAll('.sms-context-menu-item').forEach(function(el) {
        el.onclick = function() { callback(el.dataset.action); closeSmsContextMenu(); };
    });
    setTimeout(function() { document.addEventListener('click', closeSmsContextMenu, { once: true }); }, 50);
}
function closeSmsContextMenu() {
    var m = document.getElementById('sms-context-menu-active');
    if (m) m.remove();
}

// ===== 聊天详情页 =====
window.smsOpenChat = function(convId) {
    ensureSmsData();
    smsCurrentView = 'chat';
    smsActiveChatConvId = convId;
    smsRenderedCount = smsPageSize;
    var conv = getConversations().find(function(c) { return c.id === convId; });
    if (!conv) return;
    conv.unreadCount = 0;
    var account = getActiveAccount();
    var sublayer = document.getElementById('sms-sublayer-chat');
    if (!sublayer) return;

    var html = '<div class="sms-chat-container">';
    html += '<div class="sms-chat-nav">';
    html += '<div class="sms-chat-nav-left"><span class="sms-nav-back" onclick="smsCloseChat()"><i class="fas fa-chevron-left"></i></span></div>';
    html += '<div class="sms-chat-nav-center">';
    html += '<div class="sms-chat-contact-name">' + escapeHtml(conv.contactName || '未知') + '</div>';
    if (conv.fromPhone) html += '<div class="sms-chat-account-tag">' + escapeHtml(conv.fromPhone) + '</div>';
    else if (!account.isDefault) html += '<div class="sms-chat-account-tag">' + escapeHtml(account.name) + '</div>';
    html += '</div>';
    html += '<div class="sms-chat-nav-right"><button class="sms-nav-btn" onclick="smsChatMenu(\'' + convId + '\')"><i class="fas fa-ellipsis"></i></button></div>';
    html += '</div>';
    // 快速回复候选区 [P2-2] 改为按需生成，加触发按钮
    html += '<div class="sms-quick-replies-wrap" id="sms-quick-replies-wrap" style="display:none;">';
    html += '<div class="sms-quick-replies" id="sms-quick-replies"></div>';
    html += '</div>';
    // 消息区域
    html += '<div class="sms-messages" id="sms-messages-area">';
    html += renderSmsMessages(conv);
    html += '</div>';
    // [SMS-FEAT-3] 输入栏 —— 双按钮
    html += '<div class="sms-input-bar">';
    html += '<textarea class="sms-input-field" id="sms-input-field" placeholder="输入短信..." rows="1" oninput="smsAutoResize(this)"></textarea>';
    html += '<button class="sms-send-btn" id="sms-send-btn" onclick="smsSendMessage()" disabled title="发送"><i class="fas fa-arrow-up"></i></button>';
    html += '<button class="sms-generate-btn" id="sms-generate-btn" onclick="smsManualGenerate()" title="让TA回复"><i class="fas fa-wand-magic-sparkles"></i></button>';
    html += '</div></div>';

    sublayer.innerHTML = html;
    sublayer.classList.add('show');

    // [SMS-FEAT-14] 恢复草稿
    if (store.smsApp.draft && store.smsApp.draft[convId]) {
        var inp = document.getElementById('sms-input-field');
        if (inp) { inp.value = store.smsApp.draft[convId]; var btn = document.getElementById('sms-send-btn'); if (btn) btn.disabled = !inp.value.trim(); smsAutoResize(inp); }
    }
    // 绑定输入事件 + [P3-1] 草稿 debounce 自动保存
    var input = document.getElementById('sms-input-field');
    if (input) {
        input.addEventListener('input', function() {
            var btn = document.getElementById('sms-send-btn');
            if (btn) btn.disabled = !this.value.trim();
            // [P3-1] debounce 500ms 保存草稿
            var val = this.value;
            if (_smsDraftTimer) clearTimeout(_smsDraftTimer);
            _smsDraftTimer = setTimeout(function() {
                if (smsActiveChatConvId) {
                    if (val.trim()) store.smsApp.draft[smsActiveChatConvId] = val;
                    else delete store.smsApp.draft[smsActiveChatConvId];
                    save();
                }
            }, 500);
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (this.value.trim()) smsSendMessage(); }
        });
        // [SMS-FIX-键盘遮挡] input 获焦时滚动到底部，防止键盘遮挡最后一条消息
        input.addEventListener('focus', function() {
            setTimeout(smsScrollToBottom, 300);
        });
    }
    // [SMS-FIX-键盘遮挡] 监听 visualViewport 变化，键盘弹出时调整容器高度
    if (window.visualViewport) {
        // 先移除旧的监听（防止重复打开聊天时叠加）
        if (window._smsVVHandler) {
            window.visualViewport.removeEventListener('resize', window._smsVVHandler);
        }
        var _smsVVContainer = document.querySelector('.sms-chat-container');
        window._smsVVHandler = function() {
            if (_smsVVContainer) {
                _smsVVContainer.style.height = window.visualViewport.height + 'px';
            }
            smsScrollToBottom();
        };
        window.visualViewport.addEventListener('resize', window._smsVVHandler);
    }
    // [SMS-FEAT-18] 上滑加载
    var area = document.getElementById('sms-messages-area');
    if (area) {
        area.addEventListener('scroll', function() {
            if (this.scrollTop < 50 && conv.messages.length > smsRenderedCount) {
                var oldH = this.scrollHeight;
                smsRenderedCount += smsPageSize;
                this.innerHTML = renderSmsMessages(conv);
                this.scrollTop = this.scrollHeight - oldH;
            }
        });
    }
    smsScrollToBottom();
    save();
};

// [SMS-FEAT-4] 消息状态文字
function smsStatusText(status) {
    var map = { sending: '发送中...', sent: '已发送', delivered: '已送达', read: '已读', failed: '发送失败' };
    return map[status] || '';
}

function renderSmsMessages(conv) {
    var msgs = conv.messages || [];
    if (msgs.length === 0) return '<div class="sms-empty" style="padding:40px 20px;"><i class="fas fa-comment"></i><span>发送第一条短信吧</span></div>';
    // [SMS-FEAT-18] 分页
    var start = Math.max(0, msgs.length - smsRenderedCount);
    var visible = msgs.slice(start);
    var html = '';
    if (start > 0) html += '<div class="sms-load-more" style="text-align:center;padding:12px;color:#8e8e93;font-size:13px;">↑ 上滑加载更多</div>';
    var lastTime = 0;
    visible.forEach(function(m) {
        if (m.time - lastTime > 300000) html += '<div class="sms-time-divider">' + formatSmsChatTime(m.time) + '</div>';
        lastTime = m.time;
        // 系统消息（识破提示等）居中显示
        if (m.direction === 'system') {
            html += '<div class="sms-time-divider" style="color:#8e8e93;font-size:13px;padding:8px 20px;">' + escapeHtml(m.content) + '</div>';
            return;
        }
        var isOut = m.direction === 'out';
        html += '<div class="sms-msg-row ' + (isOut ? 'out' : 'in') + '">';
        if (!isOut && conv.contactAvatar) html += '<img class="sms-msg-avatar" src="' + conv.contactAvatar + '" onerror="this.style.display=\'none\'">';
        // [SMS-FIX-状态外移] 用 wrapper 包裹气泡+状态，状态放在气泡外部下方
        html += '<div class="sms-msg-wrapper">';
        // [SMS-FEAT-16] 长消息折叠（用内存 Set，不持久化）
        var content = m.content || '';
        var isTruncated = content.length > 300 && !smsExpandedMsgIds.has(m.id);
        var displayContent = isTruncated ? escapeHtml(content.substring(0, 300)) + '...' : escapeHtml(content);
        html += '<div class="sms-bubble ' + (isOut ? 'out' : 'in') + (m.status === 'failed' ? ' failed' : '') + '"'
            + ' oncontextmenu="smsMsgContextMenu(event,\'' + conv.id + '\',\'' + m.id + '\')"'
            + ' ontouchstart="smsBubbleTouchStart(event,\'' + conv.id + '\',\'' + m.id + '\')"'
            + ' ontouchend="smsBubbleTouchEnd()"'
            + ' ontouchmove="smsBubbleTouchMove()"'
            + ' ontouchcancel="smsBubbleTouchEnd()"'
            + '>';
        html += displayContent;
        if (isTruncated) html += '<div class="sms-expand-btn" onclick="event.stopPropagation();smsExpandMsg(\'' + conv.id + '\',\'' + m.id + '\')">展开全文</div>';
        html += '</div>'; // 关闭 sms-bubble
        // [SMS-FEAT-4] 状态（移到气泡外部、wrapper内部）
        if (isOut && m.status) {
            var statusClass = m.status === 'failed' ? ' sms-status-failed' : '';
            html += '<div class="sms-msg-status' + statusClass + '">';
            if (m.status === 'failed') html += '<i class="fas fa-exclamation-circle" onclick="event.stopPropagation();smsRetryMsg(\'' + conv.id + '\',\'' + m.id + '\')"></i> ';
            html += smsStatusText(m.status) + '</div>';
        }
        html += '</div></div>'; // 关闭 wrapper 和 row
    });
    return html;
}

// [SMS-FEAT-16] 展开长消息（改用内存 Set）
window.smsExpandMsg = function(convId, msgId) {
    var conv = getConversations().find(function(c) { return c.id === convId; });
    if (!conv) return;
    smsExpandedMsgIds.add(msgId);
    var area = document.getElementById('sms-messages-area');
    if (area) area.innerHTML = renderSmsMessages(conv);
};

function smsScrollToBottom() {
    setTimeout(function() { var area = document.getElementById('sms-messages-area'); if (area) area.scrollTop = area.scrollHeight; }, 50);
}
window.smsAutoResize = function(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; };

window.smsCloseChat = function() {
    // [SMS-FIX-键盘遮挡] 关闭聊天时移除 visualViewport 监听
    if (window.visualViewport && window._smsVVHandler) {
        window.visualViewport.removeEventListener('resize', window._smsVVHandler);
        window._smsVVHandler = null;
    }
    // 恢复容器高度
    var _c = document.querySelector('.sms-chat-container');
    if (_c) _c.style.height = '';
    // [SMS-FEAT-14] 保存草稿
    if (smsActiveChatConvId) {
        var inp = document.getElementById('sms-input-field');
        if (inp && inp.value.trim()) { store.smsApp.draft[smsActiveChatConvId] = inp.value; }
        else { delete store.smsApp.draft[smsActiveChatConvId]; }
    }
    smsCurrentView = 'list'; smsActiveChatConvId = null;
    var sublayer = document.getElementById('sms-sublayer-chat');
    if (sublayer) sublayer.classList.remove('show');
    renderSmsApp(); save();
};

// ===== 发送消息（仅入库上屏，不触发 AI）=====
window.smsSendMessage = function() {
    var input = document.getElementById('sms-input-field');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    var conv = getConversations().find(function(c) { return c.id === smsActiveChatConvId; });
    if (!conv) return;
    var msg = {
        id: 'smsg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        content: text, time: Date.now(), direction: 'out',
        status: 'sending', read: true
    };
    conv.messages.push(msg);
    conv.lastMessage = text; conv.lastTime = msg.time;
    input.value = ''; input.style.height = 'auto';
    var btn = document.getElementById('sms-send-btn'); if (btn) btn.disabled = true;
    // 清草稿
    delete store.smsApp.draft[conv.id];
    var area = document.getElementById('sms-messages-area');
    if (area) { area.innerHTML = renderSmsMessages(conv); smsScrollToBottom(); }
    // [FIX-小号身份泄露v3] 小号会话不存入全局记忆，防止信箱等app读到
    if (conv._isAltPhone && !conv._revealed) {
        _smsAltMemorySave(conv._altContactId || conv.contactId, text, 'out');
    } else {
        smsSaveToMemory(conv.contactId, text, 'out', conv);
    }
    save();
    // [SMS-FEAT-4] 模拟送达
    setTimeout(function() {
        msg.status = 'sent';
        if (area && smsActiveChatConvId === conv.id) area.innerHTML = renderSmsMessages(conv);
        save();
    }, 800);
    setTimeout(function() {
        msg.status = 'delivered';
        if (area && smsActiveChatConvId === conv.id) area.innerHTML = renderSmsMessages(conv);
        save();
    }, 2500);
};

// [SMS-FEAT-3] 手动触发 AI 生成回复 / [P2-1] 生成中再点=取消
window.smsManualGenerate = function() {
    if (smsIsGenerating) {
        // 取消生成
        if (smsAbortController) { try { smsAbortController.abort(); } catch(_e) {} }
        smsIsGenerating = false; smsAbortController = null;
        var typing = document.getElementById('sms-typing-indicator');
        if (typing) typing.remove();
        var genBtn = document.getElementById('sms-generate-btn');
        if (genBtn) { genBtn.disabled = false; genBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i>'; }
        if (typeof toast === 'function') toast('已取消生成', 'info');
        return;
    }
    var conv = getConversations().find(function(c) { return c.id === smsActiveChatConvId; });
    if (!conv) return;
    smsGenerateReply(conv);
};

// [SMS-FEAT-4] 失败重发
window.smsRetryMsg = function(convId, msgId) {
    var conv = getConversations().find(function(c) { return c.id === convId; });
    if (!conv) return;
    var msg = conv.messages.find(function(m) { return m.id === msgId; });
    if (!msg || msg.status !== 'failed') return;
    msg.status = 'sending';
    var area = document.getElementById('sms-messages-area');
    if (area) area.innerHTML = renderSmsMessages(conv);
    setTimeout(function() {
        msg.status = 'sent';
        if (area && smsActiveChatConvId === conv.id) area.innerHTML = renderSmsMessages(conv);
        save();
        setTimeout(function() { msg.status = 'delivered'; if (area && smsActiveChatConvId === conv.id) area.innerHTML = renderSmsMessages(conv); save(); }, 1500);
    }, 800);
};

// [SMS-FIX-长按] 移动端长按触发菜单（oncontextmenu 在部分 WebView 中不可靠）
var _smsLongPressTimer = null;
var _smsLongPressFired = false;
var _smsLongPressStartX = 0;
var _smsLongPressStartY = 0;
window.smsBubbleTouchStart = function(e, convId, msgId) {
    _smsLongPressFired = false;
    try {
        var t = e.touches && e.touches[0];
        if (t) { _smsLongPressStartX = t.clientX; _smsLongPressStartY = t.clientY; }
    } catch(_e) {}
    if (_smsLongPressTimer) clearTimeout(_smsLongPressTimer);
    _smsLongPressTimer = setTimeout(function() {
        _smsLongPressFired = true;
        // 用触摸位置构造一个伪事件传给菜单
        var fakeEvt = {
            preventDefault: function() {},
            stopPropagation: function() {},
            clientX: _smsLongPressStartX,
            clientY: _smsLongPressStartY
        };
        try { smsMsgContextMenu(fakeEvt, convId, msgId); } catch(_e) {}
    }, 450);
};
window.smsBubbleTouchEnd = function() {
    if (_smsLongPressTimer) { clearTimeout(_smsLongPressTimer); _smsLongPressTimer = null; }
};
window.smsBubbleTouchMove = function() {
    // 手指移动则取消长按（避免滚动时误触）
    if (_smsLongPressTimer) { clearTimeout(_smsLongPressTimer); _smsLongPressTimer = null; }
};

// 消息长按菜单
window.smsMsgContextMenu = function(e, convId, msgId) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    var conv = getConversations().find(function(c) { return c.id === convId; });
    if (!conv) return;
    var msg = conv.messages.find(function(m) { return m.id === msgId; });
    if (!msg) return;
    var items = [
        { icon: 'fa-copy', label: '复制', action: 'copy' },
        { icon: 'fa-share', label: '转发到微信', action: 'forward' },
        { icon: 'fa-star', label: '收藏', action: 'fav' }
    ];
    // [SMS-FEAT-8] AI 消息可重新生成
    if (msg.direction === 'in') items.push({ icon: 'fa-rotate', label: '重新生成', action: 'regen' });
    items.push({ icon: 'fa-trash', label: '删除', action: 'delete', danger: true });
    showSmsContextMenu(e.clientX, e.clientY, items, function(action) {
        if (action === 'copy') {
            if (navigator.clipboard) navigator.clipboard.writeText(msg.content).then(function() { if (typeof toast === 'function') toast('已复制', 'success'); });
        } else if (action === 'delete') {
            conv.messages = conv.messages.filter(function(m) { return m.id !== msgId; });
            var last = conv.messages[conv.messages.length - 1];
            conv.lastMessage = last ? last.content : ''; conv.lastTime = last ? last.time : conv.lastTime;
            var area = document.getElementById('sms-messages-area');
            if (area) area.innerHTML = renderSmsMessages(conv);
            save();
        } else if (action === 'regen') {
            // [SMS-FEAT-8] 删掉这条再重新生成
            conv.messages = conv.messages.filter(function(m) { return m.id !== msgId; });
            var area2 = document.getElementById('sms-messages-area');
            if (area2) area2.innerHTML = renderSmsMessages(conv);
            save();
            smsGenerateReply(conv);
        } else if (action === 'forward') {
            // [SMS-FEAT-17] 转发到微信
            smsForwardToChat(conv.contactId, msg.content);
        } else if (action === 'fav') {
            // [SMS-FEAT-17] 收藏
            if (!store.smsApp.favorites) store.smsApp.favorites = [];
            store.smsApp.favorites.push({ id: 'fav_' + Date.now(), content: msg.content, from: conv.contactName, time: msg.time });
            save();
            if (typeof toast === 'function') toast('已收藏', 'success');
        }
    });
};

// [SMS-FEAT-17] 转发到微信聊天
function smsForwardToChat(contactId, content) {
    if (!store.chats) store.chats = {};
    if (!store.chats[contactId]) store.chats[contactId] = [];
    store.chats[contactId].push({ sender: 'me', type: 'text', content: '[转发自短信] ' + content, time: Date.now() });
    save();
    if (typeof toast === 'function') toast('已转发到微信', 'success');
}

// 聊天页菜单
window.smsChatMenu = function(convId) {
    var conv = getConversations().find(function(c) { return c.id === convId; });
    if (!conv) return;
    var items = [
        { icon: 'fa-thumbtack', label: conv.pinned ? '取消置顶' : '置顶会话', action: 'pin' },
        { icon: 'fa-volume-xmark', label: conv.muted ? '取消免打扰' : '消息免打扰', action: 'mute' },
        { icon: 'fa-broom', label: '清空聊天记录', action: 'clear', danger: false },
        { icon: 'fa-trash', label: '删除会话', action: 'delete', danger: true }
    ];
    // [P2-3] 小号会话加"识破身份"选项
    if (conv._isAltPhone && conv._altContactId) {
        var realContact = (store.contacts || []).find(function(c) { return c.id === conv._altContactId; });
        if (realContact) {
            items.splice(2, 0, { icon: 'fa-mask', label: '识破身份（' + realContact.name + '的小号）', action: 'reveal' });
        }
    }
    var _menuBtn = document.querySelector('.sms-chat-nav-right .sms-nav-btn');
    var _rect = _menuBtn ? _menuBtn.getBoundingClientRect() : null;
    var _mx = _rect ? (_rect.right - 160) : (window.innerWidth - 170);
    var _my = _rect ? (_rect.bottom + 6) : 56;
    showSmsContextMenu(_mx, _my, items, function(action) {
        if (action === 'pin') { conv.pinned = !conv.pinned; save(); }
        else if (action === 'mute') { conv.muted = !conv.muted; save(); }
        else if (action === 'reveal') { smsRevealAltPhone(conv); }
        else if (action === 'clear') {
            if (typeof showConfirm === 'function') {
                showConfirm('清空记录', '确定清空与 ' + escapeHtml(conv.contactName) + ' 的所有短信吗？', function() {
                    conv.messages = []; conv.lastMessage = '';
                    var area = document.getElementById('sms-messages-area');
                    if (area) area.innerHTML = renderSmsMessages(conv);
                    save();
                });
            }
        } else if (action === 'delete') {
            if (typeof showConfirm === 'function') {
                showConfirm('删除会话', '确定删除此会话吗？', function() {
                    var aid = store.smsApp.activeAccountId;
                    store.smsApp.conversations[aid] = store.smsApp.conversations[aid].filter(function(c) { return c.id !== convId; });
                    smsCloseChat(); save();
                });
            }
        }
    });
};

// ===== AI 回复生成 =====
async function smsGenerateReply(conv) {
    if (smsIsGenerating) return;
    smsIsGenerating = true;
    var contact = (store.contacts || []).find(function(c) { return c.id === conv.contactId; });
    if (!contact) { smsIsGenerating = false; if (typeof toast === 'function') toast('找不到联系人', 'error'); return; }
    // [P1-2] 前置检查 API 是否可用，不可用则在会话内插入系统提示气泡
    if (typeof API === 'undefined' || !API || !API.chatCompletion || !store.system || !store.system.url || !store.system.key) {
        smsIsGenerating = false;
        var area0 = document.getElementById('sms-messages-area');
        if (area0) {
            var tipHtml = '<div class="sms-msg-row in"><div class="sms-bubble system-tip" style="background:#f2f2f7;color:#8e8e93;font-size:13px;border-radius:12px;padding:10px 14px;cursor:pointer;" onclick="if(typeof openSettings===\'function\')openSettings()">';
            tipHtml += '<i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>未配置 API，无法生成回复。点击前往设置</div></div>';
            area0.insertAdjacentHTML('beforeend', tipHtml);
            smsScrollToBottom();
        }
        return;
    }
    // [P2-1] 更新生成按钮为"取消"状态
    var genBtn = document.getElementById('sms-generate-btn');
    if (genBtn) { genBtn.disabled = false; genBtn.innerHTML = '<i class="fas fa-stop"></i>'; genBtn.title = '取消生成'; }
    // 显示打字指示器
    var area = document.getElementById('sms-messages-area');
    if (area) {
        var typingHtml = '<div class="sms-msg-row in" id="sms-typing-indicator">';
        if (conv.contactAvatar) typingHtml += '<img class="sms-msg-avatar" src="' + conv.contactAvatar + '">';
        typingHtml += '<div class="sms-typing"><div class="sms-typing-dot"></div><div class="sms-typing-dot"></div><div class="sms-typing-dot"></div></div></div>';
        area.insertAdjacentHTML('beforeend', typingHtml);
        smsScrollToBottom();
    }
    // [P2-1] 创建 AbortController
    smsAbortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
    try {
        var msgs = buildSmsPrompt(contact, getActiveAccount(), conv);
        var reply = await callSmsAI(msgs, contact);
        // 如果已被取消，不处理结果
        if (!smsIsGenerating) return;
        // 移除打字指示器
        var typing = document.getElementById('sms-typing-indicator');
        if (typing) typing.remove();
        // [SMS-FIX-分句] 像微信一样将AI回复拆分成多个气泡
        var replyTrimmed = reply.trim();
        var smsBubbles = _splitSmsBubbles(replyTrimmed);
        var baseTime = Date.now();
        var fullContent = '';
        smsBubbles.forEach(function(text, idx) {
            var replyMsg = {
                id: 'smsg_' + baseTime + '_' + idx + '_' + Math.random().toString(36).substr(2, 4),
                content: text, time: baseTime + idx * 200, direction: 'in', read: true
            };
            conv.messages.push(replyMsg);
            fullContent = text;
        });
        conv.lastMessage = fullContent; conv.lastTime = baseTime + (smsBubbles.length - 1) * 200;
        // [P3-3] 标记所有已发出的用户消息为已读（兼容 sent/delivered）
        conv.messages.forEach(function(m) { if (m.direction === 'out' && (m.status === 'delivered' || m.status === 'sent')) m.status = 'read'; });
        if (area && smsActiveChatConvId === conv.id) { area.innerHTML = renderSmsMessages(conv); smsScrollToBottom(); }
        // [FIX-小号身份泄露v3] 小号会话不存入全局记忆
        if (conv._isAltPhone && !conv._revealed) {
            _smsAltMemorySave(conv._altContactId || conv.contactId, replyTrimmed, 'in');
        } else {
            smsSaveToMemory(conv.contactId, replyTrimmed, 'in', conv);
        }
        // [SMS-FEAT-CROSSAPP] 用户用非默认账号（小号）发短信时，记录跨app事件
        // 让联系人在微信私聊中有概率主动提及收到陌生短信
        var _curAccForCross = getActiveAccount();
        if (_curAccForCross && !_curAccForCross.isDefault && !conv._revealed) {
            var _lastUserSmsMsg = '';
            for (var _ui = conv.messages.length - 1; _ui >= 0; _ui--) {
                if (conv.messages[_ui].direction === 'out') { _lastUserSmsMsg = conv.messages[_ui].content || ''; break; }
            }
            _smsRecordCrossAppEvent(conv.contactId, conv, _lastUserSmsMsg, replyTrimmed);
        }
        save();
        // 异步预生成快速回复候选（仅开关开启时）
        if (!store.smsApp.settings.disableAutoQuickReply) smsGenerateQuickReplies(conv, contact);
    } catch (err) {
        console.error('[SMS] AI回复失败:', err);
        var typing2 = document.getElementById('sms-typing-indicator');
        if (typing2) typing2.remove();
        // [P1-2] 在会话内显示错误气泡而不只是 toast
        if (area && smsActiveChatConvId === conv.id) {
            var errHtml = '<div class="sms-msg-row in"><div class="sms-bubble system-tip" style="background:#e8e8e8;color:#1a1a1a;font-size:13px;border-radius:12px;padding:10px 14px;">';
            errHtml += '<i class="fas fa-times-circle" style="margin-right:6px;"></i>' + escapeHtml(err.message || '生成失败') + '</div></div>';
            area.insertAdjacentHTML('beforeend', errHtml);
            smsScrollToBottom();
        }
    }
    smsIsGenerating = false; smsAbortController = null;
    if (genBtn) { genBtn.disabled = false; genBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i>'; genBtn.title = '让TA回复'; }
}

// [SMS-FIX-1] 真实调用 API.chatCompletion
async function callSmsAI(messages, contact) {
    if (typeof API === 'undefined' || !API || !API.chatCompletion) throw new Error('API 模块未就绪');
    if (!store.system || !store.system.url || !store.system.key) throw new Error('请先在设置中配置 API 地址与密钥');
    var data = await API.chatCompletion(messages, {
        temperature: (store.system && store.system.temp) || 0.75,
        scene: 'sms', maxTokens: 600
    });
    var reply = '';
    try { reply = (data.choices[0].message.content || '').trim(); } catch(_e) {}
    if (!reply) throw new Error('AI 返回为空');
    return reply.replace(/\[HEARTBEAT:[\s\S]*?\]/gi, '').replace(/\[HEART:[\s\S]*?\]/gi, '').replace(/\[STICKER:[\s\S]*?\]/gi, '').trim();
}

// [SMS-FEAT-ALT-MEMORY] 小号模式记忆脱敏：三级分类（保留/脱敏/丢弃）
// 第一级：不含身份词 → 直接保留原文
// 第二级：含身份词但可脱敏 → 替换用户名/关系词为模糊词后保留
// 第三级：核心关系记忆（整句主题就是描述与用户的关系）→ 丢弃
var _coreRelPattern = /(和|跟|与|给|被|让|陪|带).{0,8}(用户|老公|老婆|男朋友|女朋友|男友|女友|伴侣|恋人|爱人|丈夫|妻子|另一半|心上人|对象|宝贝|亲爱的).{0,12}(吵架|分手|复合|表白|在一起|约会|亲亲|拥抱|牵手|结婚|同居|告白|求婚|纪念日|情人节|撒娇|哄|道歉|冷战|和好|甜蜜|暧昧|暗恋|喜欢你|爱你|想你|等你|接你|送你回家)/;
var _relationReplaceWords = /(用户|老公|老婆|男朋友|女朋友|男友|女友|伴侣|恋人|爱人|丈夫|妻子|另一半|心上人|对象|宝贝|亲爱的)/g;

function _sanitizeMemoryForAlt(text, identityRegex, userNameForFilter) {
    if (!text || typeof text !== 'string') return null;
    // 第一级：完全安全 → 直接返回
    if (!identityRegex.test(text)) return text;
    // [FIX-小号身份泄露v4] 核心关系记忆不再直接丢弃，而是做深度脱敏
    // 把亲密关系词替换为模糊称呼，保留事件本身（让AI知道自己的社交圈）
    var cleaned = text;
    if (userNameForFilter && userNameForFilter.length > 0) {
        cleaned = cleaned.replace(new RegExp(userNameForFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '某人');
    }
    cleaned = cleaned.replace(_relationReplaceWords, '某人');
    // "给某人""和某人" → "给朋友""和朋友"（更自然）
    cleaned = cleaned.replace(/(给|和|跟|与|陪|带|送)某人/g, '$1朋友');
    // 对核心关系事件做额外脱敏：把亲密动作模糊化
    if (_coreRelPattern.test(cleaned)) {
        cleaned = cleaned.replace(/(表白|在一起|约会|亲亲|拥抱|牵手|结婚|同居|告白|求婚|纪念日|情人节|撒娇|哄|冷战|和好|甜蜜|暧昧|暗恋|喜欢你|爱你|想你)/g, '相处');
    }
    // 如果脱敏后仍然含有身份词（可能是用户昵称等），再检查一次
    if (identityRegex.test(cleaned)) return null;
    return cleaned;
}

// [SMS-FEAT-ALT-MEMORY] 记忆分类：判断记忆条目的类型
function _classifySmsMemory(content) {
    if (!content || typeof content !== 'string') return 'unknown';
    // relationship: 关系定义性事件
    if (_coreRelPattern.test(content)) return 'relationship';
    if (/(是我的|是我男|是我女|我们在一起|我们是|我男朋友|我女朋友|我老公|我老婆|我对象|我伴侣)/.test(content)) return 'relationship';
    // interaction: 与用户的互动（含"用户"或常见互动动词+关系词）
    if (/(用户|老公|老婆|男朋友|女朋友|男友|女友|伴侣|恋人|爱人|丈夫|妻子|另一半|对象)/.test(content)) return 'interaction';
    // self: 角色自身状态/偏好/日常
    return 'self';
}

// [SMS-FEAT-5] 构建 prompt（结合人设 + 记忆 + 微信聊天互通）
// [FIX-小号身份泄露] 当用户使用小号（非默认账号）发送短信给联系人时，
// 必须视作"陌生号码"：不提供两人关系描述、不提供微信近况、不提供共同记忆，
// 否则 AI 会立刻从上下文推断出对方就是熟人/用户本人
function buildSmsPrompt(contact, account, conv) {
    var isKnown = account.isDefault;
    // [FIX-小号身份泄露v2] canLeakIdentity 提前计算，决定 persona 是否使用完整上下文
    var canLeakIdentity = !!isKnown || !!(conv && conv._revealed);
    var persona = '';
    if (canLeakIdentity) {
        // 熟人或已识破身份：使用完整上下文（含世界书、关系、记忆）
        if (typeof getAiContext === 'function') persona = getAiContext(contact);
        else persona = '你是' + contact.name + '。' + (contact.persona || '');
    } else {
        // [FIX-小号身份泄露v2] 小号/陌生人模式：使用"净化版"人设
        // 1) 不调用 getAiContext（它会把世界书、用户关系、伴侣身份等全塞进来）
        // 2) 对 contact.persona 做关键词剥离，去除与用户的关系描述、真实姓名暗示
        var rawPersona = (contact.persona || '') + '';
        // [OPT-小号清洗v3] 更激进的人设清洗：扩大关系词库 + 隐晦表述过滤
        var relationPatterns = /(用户|老公|老婆|男朋友|女朋友|男友|女友|伴侣|恋人|未婚夫|未婚妻|对象|男主|女主|爱人|丈夫|妻子|另一半|心上人|挚爱|最爱的人|最重要的人|最亲近的人|那个人|总是陪你|一直陪伴|你和(他|她|TA|ta|主人|主)|你们是|你们的关系|你的(男|女|恋|爱)|和你的|跟你的|喜欢的人|暗恋|表白|在一起|交往|约会|同居|结婚)/;
        var cleanedLines = rawPersona.split(/\n+/).filter(function(line) {
            var t = (line || '').trim();
            if (!t) return false;
            return !relationPatterns.test(t);
        });
        // 再次整体剥离常见句式（扩大匹配范围）
        var cleanedPersona = cleanedLines.join('\n')
            .replace(/[^。！？\n]*?(用户|男朋友|女朋友|老公|老婆|伴侣|恋人|爱人|丈夫|妻子|另一半|最重要的人|最爱的人|心上人|喜欢的人)[^。！？\n]*?[。！？]/g, '')
            .trim();
        persona = '你是' + contact.name + '。\n' + (cleanedPersona || '保持你的基础性格。');
    }
    // [FIX-小号身份泄露v2] 小号模式下不能把用户的人设名暴露给 AI
    var userName = canLeakIdentity
        ? ((typeof getUserPersonaName === 'function') ? getUserPersonaName(contact, store.user ? store.user.name : '用户') : (store.user && store.user.name) || '用户')
        : '对方';
    // 系统 prompt
    var sysContent = persona + '\n\n【短信场景】\n你正在通过手机短信聊天。\n像真人发短信一样，每句话分开发送（用换行分隔不同的句子），每句话简短自然，不要把所有话合在一段里。\n';
    if (isKnown) {
        sysContent += '对方是你认识的人：「' + userName + '」。你们之间的关系和你人设中描述的一样，你当然认识' + userName + '。\n';
        sysContent += '你要像平时和' + userName + '聊天一样自然地回复短信，体现你们的真实关系（恋人/朋友/家人等，取决于人设）。\n';
    } else if (conv.fromPhone) {
        // 联系人被用户标记的小号（小号来信），这里 isKnown=false 仍可能出现，保持旧逻辑
        sysContent += '这是一个来自 ' + conv.fromPhone + ' 的号码发来的短信。\n';
    } else {
        // [FIX-小号身份泄露v4] 用户用自己的小号给 AI 发短信的典型分支
        // 策略升级：AI 保留自己的社交记忆（认识谁、有什么朋友），但不认识这个陌生号码
        // 即"我当然认识xxx，但你是谁？"而不是"我不认识任何人"
        sysContent += '对方是一个陌生号码(' + (account.phone || '未知') + ')发来的短信。\n';
        sysContent += '你【不认识】这个号码的主人，对方对你而言是一个陌生人。\n';
        sysContent += '重要规则（必须严格遵守）：\n';
        sysContent += '- 你有自己的生活和社交圈，你当然认识你生活中的朋友、家人等人。如果对方问你"认不认识某某人"，而那个人确实在你的记忆中出现过，你可以承认认识，但要对陌生人保持适当的警惕（比如"我认识，怎么了？你是谁？""你怎么知道ta的？"）\n';
        sysContent += '- 绝对不要猜测、暗示、点破【发短信的这个人】可能是你认识的某个人\n';
        sysContent += '- 不要称呼对方为任何具体的名字、昵称、代称（不能叫宝贝、老公、老婆等），只能用"你"\n';
        sysContent += '- 不要主动向陌生人透露你的亲密关系细节（比如不要主动说"我有男/女朋友叫xxx"），但如果对方直接问起某个你认识的人，你可以简单确认认识，不需要详细说明关系\n';
        sysContent += '- 即使对方问"你是xxx的男朋友吗""你是xxx的女朋友吗"这类直接涉及你亲密关系的问题：\n';
        sysContent += '  → 不要向陌生人确认或否认你的感情状态，可以反问"你到底是谁？为什么问这个？"\n';
        sysContent += '- 即使对方语气、内容让你觉得眼熟，也不要把对方当成你认识的人\n';
        sysContent += '- 你的反应应符合一个普通人收到陌生号码短信时的正常态度（好奇/警惕/冷淡都可以，取决于你的性格）\n';
        sysContent += '- 核心原则：你是一个有正常社交生活的人，你认识你该认识的人；但你不认识这个给你发短信的陌生号码，对陌生人保持警惕\n';
    }
    // [FIX-小号身份泄露] 只有 isKnown 或已识破小号 时才能注入熟人上下文
    // canLeakIdentity 已在函数顶部计算
    if (canLeakIdentity) {
        // [SMS-FEAT-5] 微信聊天近况
        var wxRecent = [];
        if (store.chats && store.chats[conv.contactId]) {
            var wxMsgs = store.chats[conv.contactId];
            wxRecent = (Array.isArray(wxMsgs) ? wxMsgs : []).slice(-10);
        }
        if (wxRecent.length > 0) {
            sysContent += '\n【微信近况（跨渠道上下文）】\n';
            wxRecent.forEach(function(m) {
                var who = (m.sender === 'me' || m.sender === 'user') ? userName : contact.name;
                sysContent += who + '(微信): ' + ((m.content || '') + '').substring(0, 100) + '\n';
            });
        }
        // 记忆
        var memories = [];
        if (store.memorySummaries && store.memorySummaries[conv.contactId]) memories = store.memorySummaries[conv.contactId].slice(-15);
        // 语义检索
        var semantic = [];
        try {
            if (window.MemorySystem && window.MemorySystem.Search) {
                var lastUserMsg = '';
                for (var i = conv.messages.length - 1; i >= 0; i--) { if (conv.messages[i].direction === 'out') { lastUserMsg = conv.messages[i].content; break; } }
                if (lastUserMsg) semantic = window.MemorySystem.Search.query(conv.contactId, lastUserMsg, 5) || [];
            }
        } catch(_e) {}
        if (memories.length > 0 || semantic.length > 0) {
            sysContent += '\n【记忆参考】\n';
            memories.forEach(function(m) { sysContent += '- ' + ((m.content || '') + '').substring(0, 150) + '\n'; });
            semantic.forEach(function(s) { sysContent += '- [语义] ' + ((s.content || '') + '').substring(0, 150) + '\n'; });
        }
        // [SMS-NPC] 注入关系网NPC上下文，让联系人在短信中偶尔提到身边的人
        var npcList = [];
        try {
            var rnData = store.relationNetworks && store.relationNetworks[conv.contactId];
            if (rnData && rnData.characters) {
                var contactCharId = '';
                var cChar = rnData.characters.find(function(ch) { return ch.role === 'contact'; });
                if (cChar) contactCharId = cChar.id;
                var rnRels = rnData.relations || [];
                rnData.characters.forEach(function(npc) {
                    if (npc.role !== 'npc') return;
                    var relLabel = '';
                    if (contactCharId) {
                        var rel = rnRels.find(function(r) {
                            return (r.from === contactCharId && r.to === npc.id) || (r.from === npc.id && r.to === contactCharId);
                        });
                        if (rel) relLabel = rel.label || '';
                    }
                    npcList.push(npc.name + (relLabel ? '(' + relLabel + ')' : ''));
                });
            }
        } catch(_npcErr) {}
        if (npcList.length > 0) {
            sysContent += '\n【你身边的人】\n' + npcList.join('、') + '\n';
            sysContent += '在短信中偶尔可以自然地提到他们（如"我妈催我回家""刚和XX吃完饭"），但不要每条都提，自然就好。\n';
        }
    } else {
        // [FIX-短信记忆v3] 小号模式：三级记忆分类（保留/脱敏/丢弃）
        // 保留角色自身的日常、偏好、性格记忆，脱敏含用户身份的互动记忆，丢弃核心关系记忆
        var _userNameForFilter = (store.user && store.user.name) || '';
        var _userPersonaName = '';
        try { if (typeof getUserPersonaName === 'function') _userPersonaName = getUserPersonaName(contact, '') || ''; } catch(_e2) {}
        // 构建身份关键词过滤正则（用户名、昵称、关系词）
        var _identityWords = ['用户', '老公', '老婆', '男朋友', '女朋友', '男友', '女友', '伴侣', '恋人', '爱人', '丈夫', '妻子', '另一半', '心上人', '对象', '宝贝', '亲爱的'];
        if (_userNameForFilter) _identityWords.push(_userNameForFilter);
        if (_userPersonaName && _userPersonaName !== _userNameForFilter) _identityWords.push(_userPersonaName);
        var _identityRegex = new RegExp(_identityWords.filter(function(w) { return w && w.length > 0; }).map(function(w) {
            return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }).join('|'), 'i');
        // 合并用户名用于脱敏替换
        var _altUserName = _userPersonaName || _userNameForFilter || '';

        // [v3] 三级分类处理记忆条目
        var _altMemories = [];
        if (store.memorySummaries && store.memorySummaries[conv.contactId]) {
            var _rawMemos = store.memorySummaries[conv.contactId].slice(-30);
            _rawMemos.forEach(function(m) {
                var text = (m.content || '') + '';
                // 优先按 tag 过滤（如果有分类标签）
                // [FIX-小号身份泄露v4] relationship 记忆不再直接丢弃，改为脱敏处理
                // 这样 AI 能知道自己认识谁，但不会暴露亲密关系的具体性质
                if (m.memType === 'self' || m.memType === 'world') {
                    _altMemories.push({ content: text }); // 自身记忆 → 直接保留
                    return;
                }
                // relationship / interaction / 无标签 → 统一走脱敏函数
                var sanitized = _sanitizeMemoryForAlt(text, _identityRegex, _altUserName);
                if (sanitized) _altMemories.push({ content: sanitized });
            });
            _altMemories = _altMemories.slice(-12);
        }
        // 语义检索（同样走脱敏）
        var _altSemantic = [];
        try {
            if (window.MemorySystem && window.MemorySystem.Search) {
                var _altLastMsg = '';
                for (var _ai = conv.messages.length - 1; _ai >= 0; _ai--) { if (conv.messages[_ai].direction === 'out') { _altLastMsg = conv.messages[_ai].content; break; } }
                if (_altLastMsg) {
                    var _rawSemantic = window.MemorySystem.Search.query(conv.contactId, _altLastMsg, 10) || [];
                    _rawSemantic.forEach(function(s) {
                        var sText = (s.content || '') + '';
                        var sSanitized = _sanitizeMemoryForAlt(sText, _identityRegex, _altUserName);
                        if (sSanitized) _altSemantic.push({ content: sSanitized });
                    });
                    _altSemantic = _altSemantic.slice(0, 5);
                }
            }
        } catch(_e3) {}
        if (_altMemories.length > 0 || _altSemantic.length > 0) {
            sysContent += '\n【你的日常记忆】\n';
            sysContent += '以下是你自己生活中的真实记忆片段，这些都是你真正经历过的事情和认识的人。\n';
            _altMemories.forEach(function(m) { sysContent += '- ' + (m.content + '').substring(0, 150) + '\n'; });
            _altSemantic.forEach(function(s) { sysContent += '- ' + (s.content + '').substring(0, 150) + '\n'; });
            sysContent += '重要：以上记忆是你真实的生活经历，记忆中提到的人你当然认识。但是，不要把当前发短信的陌生人与记忆中的任何人画等号，也不要主动向陌生人详细透露你的私人关系。\n';
        }
    }
    sysContent += '\n【短信风格要求】\n- 像真实短信一样简短、口语化\n- 可以有省略、口语缩写\n- 不要用表情包、贴纸\n- 每次只回复1条短信，不要太长\n- 严格保持人设，不要OOC\n- 只输出短信内容本身，不要加引号或前缀\n';
    // [FIX-短信人设v1] 强化人设风格保持：提取人设中的说话风格特征，单独注入
    sysContent += '【重要：保持你的说话风格】\n';
    sysContent += '- 短信虽然简短，但必须体现你独特的说话方式、口癖、语气词和用词习惯\n';
    sysContent += '- 如果你人设中有特定的称呼方式、口头禅、说话习惯（如喜欢用某些语气词、特定的表达方式），在短信中也要自然地使用\n';
    sysContent += '- 你的性格特点（温柔/傲娇/活泼/冷淡等）要在短信的语气和措辞中体现出来\n';
    sysContent += '- 不要因为是短信就变成一个没有个性的通用回复机器\n';
    // 构建 messages 数组
    var msgs = [{ role: 'system', content: sysContent }];
    var recentMsgs = (conv.messages || []).slice(-20);
    recentMsgs.forEach(function(m) {
        var role = m.direction === 'out' ? 'user' : 'assistant';
        msgs.push({ role: role, content: m.content });
    });
    // 如果最后一条不是 user，加一个空 user 触发
    if (msgs.length > 1 && msgs[msgs.length - 1].role !== 'user') {
        msgs.push({ role: 'user', content: '（请回复）' });
    }
    return msgs;
}

// [P2-2] 快速回复候选 —— 改为按需：AI 回复后只显示"快速回复"按钮，点击才调 API
function smsShowQuickReplyTrigger(conv) {
    var wrap = document.getElementById('sms-quick-replies-wrap');
    if (!wrap || smsActiveChatConvId !== conv.id) return;
    // 检查最后一条是否是 AI 消息
    var lastMsg = conv.messages[conv.messages.length - 1];
    if (!lastMsg || lastMsg.direction !== 'in') return;
    wrap.style.display = 'flex';
    var qrDiv = document.getElementById('sms-quick-replies');
    if (qrDiv) {
        qrDiv.innerHTML = '<div class="sms-quick-reply-item sms-qr-trigger" onclick="smsLoadQuickReplies()"><i class="fas fa-lightbulb" style="margin-right:4px;"></i>快速回复</div>';
    }
}
// 替代原来的 smsGenerateQuickReplies —— 现在只在用户点击时调用
async function smsGenerateQuickReplies(conv, contact) {
    // 只显示触发按钮，不自动调 API
    smsShowQuickReplyTrigger(conv);
}
window.smsLoadQuickReplies = async function() {
    var conv = getConversations().find(function(c) { return c.id === smsActiveChatConvId; });
    if (!conv) return;
    var contact = (store.contacts || []).find(function(c) { return c.id === conv.contactId; });
    if (!contact) return;
    var qrDiv = document.getElementById('sms-quick-replies');
    if (!qrDiv) return;
    qrDiv.innerHTML = '<div class="sms-quick-reply-item" style="opacity:0.5;"><i class="fas fa-spinner fa-spin"></i> 生成中...</div>';
    try {
        var lastAiMsg = '';
        for (var i = conv.messages.length - 1; i >= 0; i--) { if (conv.messages[i].direction === 'in') { lastAiMsg = conv.messages[i].content; break; } }
        if (!lastAiMsg) { qrDiv.innerHTML = ''; return; }
        var prompt = '你是用户，对方(' + contact.name + ')刚发来短信："' + lastAiMsg.substring(0, 200) + '"\n请生成3个简短的回复候选（每个不超过20字），用|分隔。只输出候选，不要编号。';
        var data = await API.chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.9, scene: 'sms', maxTokens: 200, silent: true });
        var text = (data.choices[0].message.content || '').trim();
        var candidates = text.split('|').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0 && s.length < 50; }).slice(0, 3);
        if (candidates.length > 0 && smsActiveChatConvId === conv.id) {
            qrDiv.innerHTML = candidates.map(function(c) {
                return '<div class="sms-quick-reply-item" onclick="smsUseQuickReply(this)">' + escapeHtml(c) + '</div>';
            }).join('');
        } else { qrDiv.innerHTML = ''; }
    } catch(_e) { qrDiv.innerHTML = ''; }
};
window.smsUseQuickReply = function(el) {
    var text = el.textContent || el.innerText;
    var input = document.getElementById('sms-input-field');
    if (input) { input.value = text; var btn = document.getElementById('sms-send-btn'); if (btn) btn.disabled = false; input.focus(); }
    var wrap = document.getElementById('sms-quick-replies-wrap');
    if (wrap) wrap.style.display = 'none';
};

// ===== 记忆系统集成 =====
// [FIX-小号身份泄露v3] 小号会话的记忆存入独立的 altMemory 池，不进入全局 memorySummaries
// 这样信箱、论坛、朋友圈等其他app的 buildContactGlobalMemory 就读不到小号相关内容
function _smsAltMemorySave(contactId, content, direction) {
    if (!contactId || !content) return;
    if (!store.smsApp) ensureSmsData();
    if (!store.smsApp.altMemory) store.smsApp.altMemory = {};
    if (!store.smsApp.altMemory[contactId]) store.smsApp.altMemory[contactId] = [];
    store.smsApp.altMemory[contactId].push({
        id: 'altmemo_' + Date.now(),
        content: '[小号短信' + (direction === 'out' ? '发出' : '收到') + '] ' + (content + '').substring(0, 200),
        time: Date.now()
    });
    // 限制条数
    if (store.smsApp.altMemory[contactId].length > 50) {
        store.smsApp.altMemory[contactId] = store.smsApp.altMemory[contactId].slice(-40);
    }
}

// [SMS-FEAT-CROSSAPP] 小号短信跨app事件记录
// 当用户用小号给联系人发短信且收到AI回复后，记录事件到 crossAppEvents 队列
// 联系人在微信私聊中会有概率主动提及"收到了陌生号码的短信"
function _smsRecordCrossAppEvent(contactId, conv, userMsg, aiReply) {
    if (!contactId || !conv) return;
    ensureSmsData();
    if (!store.smsApp.crossAppEvents) store.smsApp.crossAppEvents = [];
    // 获取小号号码
    var altPhone = '';
    var account = getActiveAccount();
    if (account && !account.isDefault) altPhone = account.phone || '未知号码';
    if (!altPhone && conv.fromPhone) altPhone = conv.fromPhone;
    if (!altPhone) altPhone = '陌生号码';
    // 摘要：取用户最后一条消息和AI回复的前30字
    var userSummary = (userMsg || '').substring(0, 30);
    var aiSummary = (aiReply || '').substring(0, 30);
    store.smsApp.crossAppEvents.push({
        id: 'sms_cross_' + Date.now(),
        contactId: contactId,
        altPhone: altPhone,
        userMsgSummary: userSummary,
        aiReplySummary: aiSummary,
        time: Date.now(),
        mentioned: false  // 是否已在微信中提及
    });
    // 限制队列长度
    if (store.smsApp.crossAppEvents.length > 20) {
        store.smsApp.crossAppEvents = store.smsApp.crossAppEvents.slice(-15);
    }
    save();
}

// [SMS-FEAT-CROSSAPP] 供 app-part1.js 调用：获取某联系人未提及的小号短信事件
window.getSmsAltCrossAppEvents = function(contactId) {
    if (!store.smsApp || !store.smsApp.crossAppEvents) return [];
    return store.smsApp.crossAppEvents.filter(function(e) {
        return e.contactId === contactId && !e.mentioned;
    });
};

// [SMS-FEAT-CROSSAPP] 供 app-part1.js 调用：标记事件为已提及
window.markSmsAltEventMentioned = function(eventId) {
    if (!store.smsApp || !store.smsApp.crossAppEvents) return;
    var evt = store.smsApp.crossAppEvents.find(function(e) { return e.id === eventId; });
    if (evt) { evt.mentioned = true; save(); }
};

// [FIX-记忆重构v3] smsSaveToMemory 增加第4参数 convContext，携带小号/身份信息
// 修复：小号发的短信在记忆中变成用户大名的问题
function smsSaveToMemory(contactId, content, direction, convContext) {
    if (!contactId || !content) return;
    if (!store.memorySummaries) store.memorySummaries = {};
    if (!store.memorySummaries[contactId]) store.memorySummaries[contactId] = [];
    var contact = (store.contacts || []).find(function(c) { return c.id === contactId; });
    var contactName = contact ? contact.name : '联系人';

    // [FIX-记忆重构v3] 身份感知：检测是否为小号/已识破小号场景
    var isAltPhone = !!(convContext && convContext._isAltPhone);
    var isRevealed = !!(convContext && convContext._revealed);
    var altPhoneNum = (convContext && convContext.fromPhone) || '';

    var userName;
    if (isAltPhone && !isRevealed) {
        // 小号未识破：不暴露用户真实身份，用号码代替
        userName = altPhoneNum || '陌生号码';
    } else if (isAltPhone && isRevealed) {
        // 小号已识破：标注是通过小号联系的
        var realName = (store.user && store.user.name) || '用户';
        if (typeof getUserPersonaName === 'function' && contact) realName = getUserPersonaName(contact, realName);
        userName = realName + '(小号' + (altPhoneNum ? altPhoneNum : '') + ')';
    } else {
        // 正常主号
        userName = (store.user && store.user.name) || '用户';
        if (typeof getUserPersonaName === 'function' && contact) userName = getUserPersonaName(contact, userName);
    }

    var dirLabel = direction === 'in' ? contactName + '给' + userName + '发了短信' : userName + '给' + contactName + '发了短信';
    var memoId = 'memo_sms_' + Date.now();
    var memoContent = '[短信] ' + dirLabel + '：' + (content + '').substring(0, 200);
    var memType = _classifySmsMemory(memoContent);
    var memo = { id: memoId, date: Date.now(), content: memoContent, source: 'sms', memType: memType };
    store.memorySummaries[contactId].push(memo);
    // [FIX-记忆重构v3] 通过 Pipeline 写入时传入身份上下文
    try {
        if (window.MemorySystem && window.MemorySystem.Pipeline) {
            window.MemorySystem.Pipeline.addManual(contactId, memo.content, {
                tags: ['sms', memType],
                channel: 'sms',
                scene: '短信',
                eventTime: Date.now(),
                isAltPhone: isAltPhone,
                altPhoneNumber: altPhoneNum || null
            });
        }
    } catch(_e) {}
    if (store.memorySummaries[contactId].length > 100) store.memorySummaries[contactId] = store.memorySummaries[contactId].slice(-80);
}

// ===== 新建短信页 =====
window.smsOpenNew = function() {
    smsCurrentView = 'new';
    var sublayer = document.getElementById('sms-sublayer-new');
    if (!sublayer) return;
    var account = getActiveAccount();
    var contacts = (store.contacts || []).filter(function(c) { return !c.isGroup; });
    var html = '<div class="sms-new-container">';
    html += '<div class="sms-nav"><div class="sms-nav-left"><span class="sms-nav-back" onclick="smsCloseNew()"><i class="fas fa-chevron-left"></i></span></div>';
    html += '<div class="sms-nav-title">新短信</div><div class="sms-nav-right"></div></div>';
    html += '<div class="sms-new-section"><div class="sms-new-section-label">发送身份</div>';
    html += '<div class="sms-new-account-select" onclick="smsNewPickAccount()">';
    html += '<span class="sms-acc-dot" style="width:8px;height:8px;border-radius:50%;background:#1a1a1a;flex-shrink:0;"></span>';
    html += '<span class="sms-new-account-name" id="sms-new-acc-name">' + escapeHtml(account.name) + '</span>';
    html += '<span class="sms-new-account-phone">' + escapeHtml(account.phone) + '</span>';
    html += '<i class="fas fa-chevron-right" style="color:#c7c7cc;font-size:12px;"></i></div></div>';
    html += '<div class="sms-new-section"><div class="sms-new-section-label">收件人</div>';
    html += '<input class="sms-contact-search" placeholder="搜索联系人..." oninput="smsFilterContacts(this.value)"></div>';
    // [P3-4] 输入陌生号码入口
    html += '<div class="sms-new-section" style="padding:0 16px 8px;">';
    html += '<div class="sms-stranger-entry" onclick="smsNewStranger()" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f9f9f9;border-radius:12px;cursor:pointer;">';
    html += '<i class="fas fa-phone-alt" style="color:#8e8e93;"></i>';
    html += '<span style="font-size:14px;color:#1a1a1a;">输入陌生号码发短信</span>';
    html += '<i class="fas fa-chevron-right" style="color:#c7c7cc;font-size:12px;margin-left:auto;"></i>';
    html += '</div></div>';
    html += '<div class="sms-contact-list" id="sms-new-contact-list">' + renderSmsContactList(contacts) + '</div></div>';
    sublayer.innerHTML = html;
    sublayer.classList.add('show');
};
function renderSmsContactList(contacts) {
    if (contacts.length === 0) return '<div class="sms-empty" style="padding:40px;"><i class="fas fa-user-slash"></i><span>暂无联系人</span></div>';
    var html = '';
    contacts.forEach(function(c) {
        var av = c.avatar
            ? '<div class="sms-contact-avatar"><img src="' + c.avatar + '" onerror="this.parentElement.innerHTML=\'' + (c.name||'?')[0] + '\'"></div>'
            : '<div class="sms-contact-avatar">' + (c.name||'?')[0] + '</div>';
        html += '<div class="sms-contact-item" onclick="smsSelectContact(\'' + c.id + '\')">' + av + '<span class="sms-contact-name">' + escapeHtml(c.name||'未知') + '</span></div>';
    });
    return html;
}
window.smsFilterContacts = function(kw) {
    var list = document.getElementById('sms-new-contact-list');
    if (!list) return;
    var contacts = (store.contacts || []).filter(function(c) { return !c.isGroup; });
    if (kw && kw.trim()) { var k = kw.trim().toLowerCase(); contacts = contacts.filter(function(c) { return (c.name||'').toLowerCase().includes(k); }); }
    list.innerHTML = renderSmsContactList(contacts);
};
window.smsSelectContact = function(contactId) {
    var conv = findConversation(contactId);
    if (!conv) { conv = getOrCreateConversation(contactId); save(); }
    smsCloseNew();
    smsOpenChat(conv.id);
};
window.smsCloseNew = function() {
    smsCurrentView = 'list';
    var sublayer = document.getElementById('sms-sublayer-new');
    if (sublayer) sublayer.classList.remove('show');
};
// [P3-4] 给陌生号码发短信
window.smsNewStranger = function() {
    var phone = prompt('输入手机号码：');
    if (!phone || !phone.trim()) return;
    phone = phone.trim();
    // 创建一个临时会话
    ensureSmsData();
    var aid = store.smsApp.activeAccountId;
    var convs = store.smsApp.conversations[aid];
    // 检查是否已有该号码的会话
    var existing = convs.find(function(c) { return c.contactName === phone || c.fromPhone === phone; });
    if (existing) { smsCloseNew(); smsOpenChat(existing.id); return; }
    var conv = {
        id: 'sms_conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        contactId: 'stranger_' + phone, contactName: phone, contactAvatar: '',
        pinned: false, muted: false, unreadCount: 0,
        lastMessage: '', lastTime: Date.now(), messages: [],
        fromPhone: null, altPhoneId: null, isSystemSender: false
    };
    convs.unshift(conv);
    save();
    smsCloseNew();
    smsOpenChat(conv.id);
};
window.smsNewPickAccount = function() {
    var accounts = store.smsApp.accounts || [];
    var items = accounts.map(function(acc) {
        return { icon: acc.id === store.smsApp.activeAccountId ? 'fa-check-circle' : 'fa-circle', label: acc.name + ' (' + acc.phone + ')', action: acc.id };
    });
    showSmsContextMenu(window.innerWidth / 2, 200, items, function(accId) {
        store.smsApp.activeAccountId = accId;
        if (!store.smsApp.conversations[accId]) store.smsApp.conversations[accId] = [];
        var acc = store.smsApp.accounts.find(function(a) { return a.id === accId; });
        var el = document.getElementById('sms-new-acc-name');
        if (el && acc) el.textContent = acc.name;
        save();
    });
};

// ===== 小号管理页 =====
window.smsOpenAccounts = function() {
    smsCurrentView = 'accounts';
    var sublayer = document.getElementById('sms-sublayer-accounts');
    if (!sublayer) return;
    renderSmsAccountsPage(sublayer);
    sublayer.classList.add('show');
};
function renderSmsAccountsPage(sublayer) {
    ensureSmsData();
    var accounts = store.smsApp.accounts || [];
    var html = '<div class="sms-nav"><div class="sms-nav-left"><span class="sms-nav-back" onclick="smsCloseAccounts()"><i class="fas fa-chevron-left"></i></span></div>';
    html += '<div class="sms-nav-title">号码管理</div><div class="sms-nav-right"></div></div>';
    html += '<div class="sms-accounts-list">';
    accounts.forEach(function(acc) {
        var isActive = acc.id === store.smsApp.activeAccountId;
        var avContent = acc.avatar ? '<img src="' + acc.avatar + '" onerror="this.parentElement.innerHTML=\'' + (acc.name||'?')[0] + '\'">' : (acc.name||'?')[0];
        html += '<div class="sms-account-card ' + (isActive ? 'active' : '') + '">';
        html += '<div class="sms-account-card-avatar">' + avContent + '</div>';
        html += '<div class="sms-account-card-info"><div class="sms-account-card-name">' + escapeHtml(acc.name) + '</div>';
        html += '<div class="sms-account-card-phone">' + escapeHtml(acc.phone) + '</div></div>';
        if (acc.isDefault) html += '<span class="sms-account-card-badge">默认</span>';
        html += '<div class="sms-account-card-actions">';
        html += '<button onclick="event.stopPropagation();smsEditAccount(\'' + acc.id + '\')" title="编辑"><i class="fas fa-pen"></i></button>';
        if (!acc.isDefault) html += '<button onclick="event.stopPropagation();smsDeleteAccount(\'' + acc.id + '\')" title="删除"><i class="fas fa-trash"></i></button>';
        html += '</div></div>';
    });
    html += '<button class="sms-add-account-btn" onclick="smsAddAccount()"><i class="fas fa-plus"></i> 添加新号码</button></div>';
    sublayer.innerHTML = html;
}
window.smsCloseAccounts = function() {
    smsCurrentView = 'list';
    var sublayer = document.getElementById('sms-sublayer-accounts');
    if (sublayer) sublayer.classList.remove('show');
    renderSmsApp();
};
window.smsAddAccount = function() {
    showSmsModal('添加新号码', { name: '', phone: '', signature: '' }, function(data) {
        if (!data.name.trim()) return toast('请输入号码名称', 'error');
        if (!data.phone.trim()) return toast('请输入手机号', 'error');
        var newAcc = { id: 'sms_acc_' + Date.now(), name: data.name.trim(), phone: data.phone.trim(), avatar: '', isDefault: false, signature: data.signature.trim() };
        store.smsApp.accounts.push(newAcc);
        store.smsApp.conversations[newAcc.id] = [];
        var sublayer = document.getElementById('sms-sublayer-accounts');
        if (sublayer) renderSmsAccountsPage(sublayer);
        save(); toast('号码已添加', 'success');
    });
};
window.smsEditAccount = function(accId) {
    var acc = store.smsApp.accounts.find(function(a) { return a.id === accId; });
    if (!acc) return;
    showSmsModal('编辑号码', { name: acc.name, phone: acc.phone, signature: acc.signature || '' }, function(data) {
        if (!data.name.trim()) return toast('请输入号码名称', 'error');
        acc.name = data.name.trim(); acc.phone = data.phone.trim() || acc.phone; acc.signature = data.signature.trim();
        var sublayer = document.getElementById('sms-sublayer-accounts');
        if (sublayer) renderSmsAccountsPage(sublayer);
        save(); toast('已更新', 'success');
    });
};
window.smsDeleteAccount = function(accId) {
    var acc = store.smsApp.accounts.find(function(a) { return a.id === accId; });
    if (!acc || acc.isDefault) return;
    if (typeof showConfirm === 'function') {
        showConfirm('删除号码', '确定删除 "' + escapeHtml(acc.name) + '" 吗？', function() {
            store.smsApp.accounts = store.smsApp.accounts.filter(function(a) { return a.id !== accId; });
            delete store.smsApp.conversations[accId];
            if (store.smsApp.activeAccountId === accId) store.smsApp.activeAccountId = store.smsApp.accounts[0].id;
            var sublayer = document.getElementById('sms-sublayer-accounts');
            if (sublayer) renderSmsAccountsPage(sublayer);
            save(); toast('已删除', 'success');
        });
    }
};
function showSmsModal(title, data, onSave) {
    var overlay = document.createElement('div');
    overlay.className = 'sms-modal-overlay'; overlay.id = 'sms-modal-overlay';
    // [OPT-主题隔离] 强制 light 主题，防止深色主题覆盖输入框样式导致白字白底
    overlay.setAttribute('data-theme', 'light');
    overlay.innerHTML = '<div class="sms-modal">'
        + '<div class="sms-modal-title">' + title + '</div>'
        + '<div class="sms-modal-field"><label>名称</label><input id="sms-modal-name" value="' + escapeHtml(data.name||'') + '" placeholder="例如：工作号"></div>'
        + '<div class="sms-modal-field"><label>手机号</label><input id="sms-modal-phone" value="' + escapeHtml(data.phone||'') + '" placeholder="例如：159****6666"></div>'
        + '<div class="sms-modal-field"><label>签名（可选）</label><input id="sms-modal-sig" value="' + escapeHtml(data.signature||'') + '" placeholder="个性签名"></div>'
        + '<div class="sms-modal-actions">'
        + '<button class="sms-modal-btn secondary" onclick="smsCloseModal()">取消</button>'
        + '<button class="sms-modal-btn primary" onclick="smsModalSave()">保存</button>'
        + '</div></div>';
    // 点击遮罩关闭
    overlay.addEventListener('click', function(e) { if (e.target === overlay) smsCloseModal(); });
    // [FIX-弹窗层级v2] 始终append到body，配合z-index:99999确保在所有layer之上
    // 之前append到layer-sms内部会受限于layer的stacking context，某些设备上弹窗被遮挡
    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('show'); });
    // 输入框focus时滚动到可视区域，防止被键盘遮挡
    setTimeout(function() {
        var inputs = overlay.querySelectorAll('input');
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('focus', function() {
                var self = this;
                setTimeout(function() { self.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 300);
            });
        }
    }, 100);
    window._smsModalCallback = onSave;
}
window.smsModalSave = function() {
    var name = (document.getElementById('sms-modal-name')||{}).value||'';
    var phone = (document.getElementById('sms-modal-phone')||{}).value||'';
    var sig = (document.getElementById('sms-modal-sig')||{}).value||'';
    if (window._smsModalCallback) window._smsModalCallback({ name: name, phone: phone, signature: sig });
    smsCloseModal();
};
window.smsCloseModal = function() {
    var overlay = document.getElementById('sms-modal-overlay');
    if (overlay) { overlay.classList.remove('show'); setTimeout(function() { overlay.remove(); }, 300); }
    window._smsModalCallback = null;
};

// ===== [SMS-FEAT-7] 主动来信 + [P3-2] 节流（每联系人≥2h + 夜间降频）=====
function smsProactiveCheck() {
    ensureSmsData();
    if (!store.smsApp.settings.allowProactive) return;
    var now = Date.now();
    if (now - (store.smsApp.lastProactiveCheck || 0) < 300000) return; // 5分钟全局冷却
    store.smsApp.lastProactiveCheck = now;
    var contacts = (store.contacts || []).filter(function(c) { return !c.isGroup; });
    if (contacts.length === 0) return;
    // [P3-2] 夜间降频：23:00-7:00 概率降到 2%，白天 15%
    var hour = new Date().getHours();
    var isNight = hour >= 23 || hour < 7;
    var prob = isNight ? 0.02 : 0.15;
    if (Math.random() > prob) return;
    var contact = contacts[Math.floor(Math.random() * contacts.length)];
    // [P3-2] 每联系人间隔≥2小时
    if (!store.smsApp._lastProactivePerContact) store.smsApp._lastProactivePerContact = {};
    var lastTime = store.smsApp._lastProactivePerContact[contact.id] || 0;
    if (now - lastTime < 7200000) return; // 2小时
    store.smsApp._lastProactivePerContact[contact.id] = now;
    smsProactiveSend(contact);
}
async function smsProactiveSend(contact) {
    if (!contact || smsIsGenerating) return;
    if (typeof API === 'undefined' || !API || !API.chatCompletion || !store.system || !store.system.key) return;
    try {
        // [FIX-短信人设v1] 主动来信使用完整人设上下文（含世界书、关系、记忆），而非简陋拼接
        var persona = typeof getAiContext === 'function' ? getAiContext(contact) : (contact.persona || '');
        var userName = typeof getUserPersonaName === 'function' ? getUserPersonaName(contact, (store.user && store.user.name) || '用户') : '对方';
        var sysContent = persona + '\n\n【短信场景 - 主动来信】\n';
        sysContent += '你想主动给' + userName + '发一条短信。\n';
        // 注入记忆上下文，让主动来信内容更贴合近期互动
        var _proMemories = [];
        if (store.memorySummaries && store.memorySummaries[contact.id]) {
            _proMemories = store.memorySummaries[contact.id].slice(-8);
        }
        if (_proMemories.length > 0) {
            sysContent += '\n【你们最近的互动记忆（参考话题）】\n';
            _proMemories.forEach(function(m) { sysContent += '- ' + ((m.content || '') + '').substring(0, 120) + '\n'; });
        }
        // 注入微信近况
        var _proWxMsgs = [];
        if (store.chats && store.chats[contact.id]) {
            _proWxMsgs = (Array.isArray(store.chats[contact.id]) ? store.chats[contact.id] : []).slice(-6);
        }
        if (_proWxMsgs.length > 0) {
            sysContent += '\n【微信近况】\n';
            _proWxMsgs.forEach(function(m) {
                var who = (m.sender === 'me' || m.sender === 'user') ? userName : contact.name;
                sysContent += who + ': ' + ((m.content || '') + '').substring(0, 80) + '\n';
            });
        }
        // 注入关系网NPC
        var _proNpcList = [];
        try {
            var _proRnData = store.relationNetworks && store.relationNetworks[contact.id];
            if (_proRnData && _proRnData.characters) {
                var _proCChar = _proRnData.characters.find(function(ch) { return ch.role === 'contact'; });
                var _proCCharId = _proCChar ? _proCChar.id : '';
                _proRnData.characters.forEach(function(npc) {
                    if (npc.role !== 'npc') return;
                    var relLabel = '';
                    if (_proCCharId) {
                        var rel = (_proRnData.relations || []).find(function(r) {
                            return (r.from === _proCCharId && r.to === npc.id) || (r.from === npc.id && r.to === _proCCharId);
                        });
                        if (rel) relLabel = rel.label || '';
                    }
                    _proNpcList.push(npc.name + (relLabel ? '(' + relLabel + ')' : ''));
                });
            }
        } catch(_npcErr) {}
        if (_proNpcList.length > 0) {
            sysContent += '\n【你身边的人】' + _proNpcList.join('、') + '\n';
        }
        var hour = new Date().getHours();
        var timeDesc = hour < 6 ? '凌晨' : hour < 9 ? '早上' : hour < 12 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : hour < 22 ? '晚上' : '深夜';
        sysContent += '\n现在是' + timeDesc + '。根据你的性格、你们的关系和最近的互动，写一条自然的主动短信。\n';
        sysContent += '【要求】\n- 内容要贴合你的人设和说话风格（口癖、语气词、称呼方式都要保持）\n- 可以是分享日常、关心对方、撒娇、吐槽、聊近期话题等，取决于你的性格\n- 不超过30字\n- 只输出短信内容本身\n';
        var data = await API.chatCompletion([{ role: 'system', content: sysContent }, { role: 'user', content: '请发一条短信' }], { temperature: 0.9, scene: 'sms', maxTokens: 100, silent: true });
        var text = (data.choices[0].message.content || '').trim();
        if (!text) return;
        ensureSmsData();
        var aid = store.smsApp.activeAccountId;
        var conv = getOrCreateConversation(contact.id);
        // [SMS-FIX-分句v2] 主动来信也走分句逻辑
        var proBubbles = _splitSmsBubbles(text);
        var proBaseTime = Date.now();
        proBubbles.forEach(function(btext, bi) {
            var msg = { id: 'smsg_' + proBaseTime + '_' + bi + '_' + Math.random().toString(36).substr(2, 4), content: btext, time: proBaseTime + bi * 200, direction: 'in', read: false };
            conv.messages.push(msg);
        });
        conv.lastMessage = proBubbles[proBubbles.length - 1]; conv.lastTime = proBaseTime + (proBubbles.length - 1) * 200; conv.unreadCount = (conv.unreadCount || 0) + proBubbles.length;
        smsSaveToMemory(contact.id, text, 'in', conv);
        save();
        // [SMS-FEAT-20] 触发未读红点
        smsUpdateBadge();
        if (smsActiveChatConvId === conv.id) {
            var area = document.getElementById('sms-messages-area');
            if (area) { area.innerHTML = renderSmsMessages(conv); smsScrollToBottom(); }
        }
    } catch(_e) { console.error('[SMS] 主动来信失败:', _e); }
}

// [SMS-FEAT-9] 系统短信
function smsSystemMessage() {
    ensureSmsData();
    if (!store.smsApp.settings.systemSendersEnabled) return;
    if (Math.random() > 0.1) return; // 10% 概率
    var senders = store.smsApp.systemSenders || [];
    if (senders.length === 0) return;
    var sender = senders[Math.floor(Math.random() * senders.length)];
    var templates = {
        carrier: ['【' + sender.name + '】您本月已使用流量8.5GB，剩余1.5GB。', '【' + sender.name + '】尊敬的用户，您的话费余额为58.60元。'],
        bank: ['【' + sender.name + '】您尾号8888的储蓄卡于' + new Date().getHours() + ':' + new Date().getMinutes().toString().padStart(2,'0') + '收入人民币2000.00元，余额12580.00元。'],
        logistics: ['【菜鸟驿站】您的快递已到达XX驿站，取件码：6-8-1234，请及时领取。']
    };
    var pool = templates[sender.type] || templates.carrier;
    var text = pool[Math.floor(Math.random() * pool.length)];
    var aid = store.smsApp.activeAccountId;
    var conv = getOrCreateConversation('sys_' + sender.id, { displayName: sender.name, isSystemSender: true });
    var msg = { id: 'smsg_sys_' + Date.now(), content: text, time: Date.now(), direction: 'in', read: false };
    conv.messages.push(msg);
    conv.lastMessage = text; conv.lastTime = msg.time; conv.unreadCount = (conv.unreadCount || 0) + 1;
    save();
    smsUpdateBadge();
}

// [SMS-FEAT-10] 定时短信检查
function smsCheckScheduled() {
    ensureSmsData();
    var now = Date.now();
    var queue = store.smsApp.scheduledMessages || [];
    var remaining = [];
    queue.forEach(function(item) {
        if (item.sendAt <= now) {
            var conv = getOrCreateConversation(item.contactId);
            var msg = { id: 'smsg_' + Date.now() + '_' + Math.random().toString(36).substr(2,4), content: item.content, time: Date.now(), direction: 'out', status: 'sent', read: true };
            conv.messages.push(msg);
            conv.lastMessage = item.content; conv.lastTime = msg.time;
            smsSaveToMemory(item.contactId, item.content, 'out', conv);
        } else {
            remaining.push(item);
        }
    });
    store.smsApp.scheduledMessages = remaining;
    save();
}

// [SMS-FEAT-19] 归档（超500条截断）
function smsArchiveOldMessages() {
    ensureSmsData();
    var limit = 500;
    Object.keys(store.smsApp.conversations).forEach(function(aid) {
        (store.smsApp.conversations[aid] || []).forEach(function(conv) {
            if (conv.messages && conv.messages.length > limit) {
                var archived = conv.messages.splice(0, conv.messages.length - limit);
                if (!store.smsApp.archivedMessages[conv.id]) store.smsApp.archivedMessages[conv.id] = [];
                store.smsApp.archivedMessages[conv.id] = store.smsApp.archivedMessages[conv.id].concat(archived).slice(-1000);
            }
        });
    });
}

// [SMS-FEAT-20] 未读红点
function smsUpdateBadge() {
    var total = 0;
    ensureSmsData();
    Object.keys(store.smsApp.conversations).forEach(function(aid) {
        (store.smsApp.conversations[aid] || []).forEach(function(conv) { total += (conv.unreadCount || 0); });
    });
    // 更新桌面图标红点（如果有 updateAppBadge 函数）
    if (typeof updateAppBadge === 'function') updateAppBadge('sms', total);
    // 尝试更新桌面图标
    var icons = document.querySelectorAll('[data-app="sms"] .app-badge, .app-icon-badge[data-app="sms"]');
    icons.forEach(function(el) {
        if (total > 0) { el.textContent = total > 99 ? '99+' : total; el.style.display = ''; }
        else { el.style.display = 'none'; }
    });
}

// [SMS-FEAT-6] 小号试探（联系人用陌生号码发短信）
async function smsAltPhoneProbe(contact) {
    if (!contact || !contact.altPhones || contact.altPhones.length === 0) return;
    var enabled = contact.altPhones.filter(function(p) { return p.enabled; });
    if (enabled.length === 0) return;
    var altPhone = enabled[Math.floor(Math.random() * enabled.length)];
    if (typeof API === 'undefined' || !API || !API.chatCompletion || !store.system || !store.system.key) return;
    try {
        var persona = typeof getAiContext === 'function' ? getAiContext(contact) : (contact.persona || '');
        var userName = typeof getUserPersonaName === 'function' ? getUserPersonaName(contact, (store.user && store.user.name) || '用户') : '对方';
        var prompt = persona + '\n\n你现在要用一个【小号】(' + altPhone.phone + ')给' + userName + '发短信。\n目的：' + (altPhone.purpose || '试探') + '\n要求：\n- 虽然你在扮演陌生人，但行为逻辑符合你的底层性格\n- 不要主动暴露自己是' + contact.name + '\n- 只输出短信内容，不超过30字';
        var data = await API.chatCompletion([{ role: 'system', content: prompt }, { role: 'user', content: '发一条短信' }], { temperature: 0.9, scene: 'sms', maxTokens: 100, silent: true });
        var text = (data.choices[0].message.content || '').trim();
        if (!text) return;
        ensureSmsData();
        var conv = getOrCreateConversation(contact.id, { fromPhone: altPhone.phone, altPhoneId: altPhone.id, displayName: altPhone.phone });
        conv.contactName = altPhone.label || altPhone.phone;
        // [SMS-FIX-分句v2] 小号来信也走分句逻辑
        var altBubbles = _splitSmsBubbles(text);
        var altBaseTime = Date.now();
        altBubbles.forEach(function(btext, bi) {
            var msg = { id: 'smsg_alt_' + altBaseTime + '_' + bi, content: btext, time: altBaseTime + bi * 200, direction: 'in', read: false };
            conv.messages.push(msg);
        });
        conv.lastMessage = altBubbles[altBubbles.length - 1]; conv.lastTime = altBaseTime + (altBubbles.length - 1) * 200; conv.unreadCount = (conv.unreadCount || 0) + altBubbles.length;
        // 小号记忆独立
        if (!store.smsApp.altMemory[contact.id]) store.smsApp.altMemory[contact.id] = [];
        store.smsApp.altMemory[contact.id].push({ id: 'altmemo_' + Date.now(), content: '[小号短信] ' + contact.name + '用' + altPhone.phone + '发：' + text, time: Date.now() });
        save();
        // [P2-3] 标记会话为小号来源，方便识破
        conv._isAltPhone = true;
        conv._altContactId = contact.id;
        conv._altPhoneId = altPhone.id;
        smsUpdateBadge();
    } catch(_e) { console.error('[SMS] 小号试探失败:', _e); }
}

// ===== 后台定时器 =====
var _smsTimerId = null;
function smsStartBackgroundTasks() {
    if (_smsTimerId) return;
    _smsTimerId = setInterval(function() {
        try {
            smsProactiveCheck();
            smsSystemMessage();
            smsCheckScheduled();
            smsArchiveOldMessages();
            // 小号试探（低概率）
            if (Math.random() < 0.05) {
                var contacts = (store.contacts || []).filter(function(c) { return !c.isGroup && c.altPhones && c.altPhones.length > 0; });
                if (contacts.length > 0) smsAltPhoneProbe(contacts[Math.floor(Math.random() * contacts.length)]);
            }
        } catch(_e) { console.error('[SMS] 后台任务错误:', _e); }
    }, 60000); // 每分钟检查
}

// ===== 暴露全局入口 =====
window.renderSmsApp = function() { renderSmsApp(); smsStartBackgroundTasks(); };
window.ensureSmsData = ensureSmsData;
// 供主聊天 prompt 读取短信记录
window.getSmsRecentMessages = function(contactId, count) {
    ensureSmsData();
    count = count || 10;
    var result = [];
    // [FIX-小号身份泄露] 只读取默认账号（大号）的会话，排除小号会话，防止小号消息泄露到信箱等场景
    var defaultAcc = (store.smsApp.accounts || []).find(function(a) { return a.isDefault; });
    var defaultAid = defaultAcc ? defaultAcc.id : (store.smsApp.accounts[0] && store.smsApp.accounts[0].id);
    if (!defaultAid || !store.smsApp.conversations[defaultAid]) return result;
    (store.smsApp.conversations[defaultAid] || []).forEach(function(conv) {
        // [FIX-小号泄露v4] 排除：用户小号会话(_isAltPhone) + 联系人小号来信(fromPhone且未识破)
        if (conv.contactId === contactId && !conv._isAltPhone && !(conv.fromPhone && !conv._revealed)) {
            result = result.concat(conv.messages || []);
        }
    });
    result.sort(function(a, b) { return (a.time || 0) - (b.time || 0); });
    return result.slice(-count);
};

// [P2-3] 识破小号身份 —— 合并小号记忆到主记忆池，更新会话标题
function smsRevealAltPhone(conv) {
    if (!conv._isAltPhone || !conv._altContactId) return;
    var contact = (store.contacts || []).find(function(c) { return c.id === conv._altContactId; });
    if (!contact) return;
    // 合并小号记忆到主记忆池
    var altMemos = (store.smsApp.altMemory && store.smsApp.altMemory[conv._altContactId]) || [];
    if (altMemos.length > 0) {
        if (!store.memorySummaries) store.memorySummaries = {};
        if (!store.memorySummaries[conv._altContactId]) store.memorySummaries[conv._altContactId] = [];
        altMemos.forEach(function(m) {
            store.memorySummaries[conv._altContactId].push({
                id: m.id, date: m.time, content: m.content + '（已识破）', source: 'sms-alt-revealed'
            });
        });
        // 清空小号独立记忆
        delete store.smsApp.altMemory[conv._altContactId];
    }
    // 更新会话标题，标记为已识破
    conv.contactName = contact.name + '（小号已识破）';
    conv._revealed = true;
    // 在会话内插入系统提示
    var sysMsg = {
        id: 'smsg_sys_' + Date.now(), content: '[ 身份识破 ] 你识破了这个号码的真实身份：' + contact.name + ' 的小号',
        time: Date.now(), direction: 'system', read: true
    };
    conv.messages.push(sysMsg);
    conv.lastMessage = sysMsg.content; conv.lastTime = sysMsg.time;
    save();
    // 刷新 UI
    var area = document.getElementById('sms-messages-area');
    if (area && smsActiveChatConvId === conv.id) { area.innerHTML = renderSmsMessages(conv); smsScrollToBottom(); }
    // 更新标题
    var nameEl = document.querySelector('.sms-chat-contact-name');
    if (nameEl) nameEl.textContent = conv.contactName;
    if (typeof toast === 'function') toast('身份已识破！小号记忆已合并', 'success');
}

// [P3-8] 桌面红点 —— 在 renderSmsApp 后自动更新
window.smsGetUnreadTotal = function() {
    ensureSmsData();
    var total = 0;
    Object.keys(store.smsApp.conversations).forEach(function(aid) {
        (store.smsApp.conversations[aid] || []).forEach(function(conv) { total += (conv.unreadCount || 0); });
    });
    return total;
};

})();
