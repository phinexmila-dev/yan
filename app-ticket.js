// ===== 票夹功能 (Ticket Wallet) =====
// 依赖: store, save(), toast(), showConfirm(), closeLayer(), escapeHtml()
// 入口: openTicketWallet(), 从聊天界面加号菜单调用

(function() {
    'use strict';

    // ===== 常量 =====
    var TRANSPORT_MAP = {
        plane:     { icon: 'fas fa-plane',       label: '飞机',   color: 'plane',     carrier: '航空出行' },
        highspeed: { icon: 'fas fa-train',        label: '高铁',   color: 'highspeed', carrier: '中国铁路' },
        train:     { icon: 'fas fa-subway',       label: '火车',   color: 'train',     carrier: '铁路客运' },
        car:       { icon: 'fas fa-car',          label: '小轿车', color: 'car',       carrier: '公路出行' },
        bus:       { icon: 'fas fa-bus',          label: '公交车', color: 'bus',       carrier: '公交出行' },
        subway:    { icon: 'fas fa-subway',       label: '地铁',   color: 'subway',    carrier: '地铁出行' },
        walk:      { icon: 'fas fa-walking',      label: '步行',   color: 'walk',      carrier: '步行出行' }
    };

    var THEMES = ['default', 'pink', 'blue', 'vintage', 'golden'];
    var THEME_LABELS = { default: '默认', pink: '粉色', blue: '蓝色', vintage: '复古', golden: '金色' };

    // 常用城市列表
    var POPULAR_CITIES = [
        '北京','上海','广州','深圳','成都','杭州','重庆','武汉','西安','南京',
        '长沙','天津','苏州','郑州','青岛','大连','厦门','昆明','三亚','拉萨',
        '东京','首尔','曼谷','新加坡','巴黎','伦敦','纽约','悉尼','迪拜','罗马'
    ];

    // 站点名生成
    var STATION_MAP = {
        plane: { prefix: '', suffix: '机场' },
        highspeed: { prefix: '', suffix: '站' },
        train: { prefix: '', suffix: '站' },
        car: { prefix: '', suffix: '' },
        bus: { prefix: '', suffix: '汽车站' },
        subway: { prefix: '', suffix: '站' },
        walk: { prefix: '', suffix: '' }
    };

    // ===== 状态 =====
    var _twFilter = 'all';               // 当前交通工具筛选
    var _twContactFilter = null;          // 当前联系人筛选
    var _purchaseState = {                // 购票界面状态
        transport: 'highspeed',
        fromCity: '',
        fromStation: '',
        toCity: '',
        toStation: '',
        departureTime: '',
        arrivalTime: '',
        passengers: { user: true, contact: true },
        theme: 'default',
        notify: true,
        surprise: false,
        ipSwitch: false,
        remark: ''
    };
    var _meetingTracker = {};             // 见面检测追踪器

    // ===== 初始化 =====
    function _ensureWallet() {
        if (!store.ticketWallet) store.ticketWallet = {};
    }

    // ===== 工具函数 =====
    function _genId() {
        return 'ticket_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    function _genTicketNo(transport) {
        var prefixMap = {
            plane: 'CA', highspeed: 'G', train: 'K', car: 'Y',
            bus: 'B', subway: 'M', walk: 'W'
        };
        var prefix = prefixMap[transport] || 'T';
        var num = Math.floor(1000 + Math.random() * 9000);
        return prefix + num;
    }

    function _genSeat(transport) {
        if (transport === 'walk' || transport === 'car') return '--';
        var cars = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16'];
        var rows = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15'];
        var seats = ['A','B','C','D','F'];
        if (transport === 'plane') {
            return Math.floor(1 + Math.random() * 40) + seats[Math.floor(Math.random() * seats.length)];
        }
        if (transport === 'highspeed' || transport === 'train') {
            var seatType = transport === 'highspeed' ? '二等座' : '硬座';
            return seatType + ' ' + cars[Math.floor(Math.random() * cars.length)] + '车 ' +
                   rows[Math.floor(Math.random() * rows.length)] + seats[Math.floor(Math.random() * seats.length)];
        }
        if (transport === 'bus' || transport === 'subway') return '--';
        return '--';
    }

    function _genPrice(transport, dist) {
        var km = dist || 500;
        switch (transport) {
            case 'plane': return (km * 0.6 + Math.random() * 200 + 300).toFixed(0);
            case 'highspeed': return (km * 0.45 + Math.random() * 50).toFixed(0);
            case 'train': return (km * 0.15 + Math.random() * 30).toFixed(0);
            case 'car': return (km * 0.8 + Math.random() * 20).toFixed(0);
            case 'bus': return (2 + Math.random() * 5).toFixed(0);
            case 'subway': return (3 + Math.random() * 6).toFixed(0);
            case 'walk': return '0';
            default: return '0';
        }
    }

    function _genStation(city, transport) {
        var map = STATION_MAP[transport] || { prefix: '', suffix: '' };
        if (transport === 'car' || transport === 'walk') return '';
        return city + map.suffix;
    }

    function _formatDate(ts) {
        if (!ts) return '--';
        var d = new Date(ts);
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    function _formatTime(ts) {
        if (!ts) return '--';
        var d = new Date(ts);
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function _formatDuration(depTs, arrTs) {
        if (!depTs || !arrTs) return '';
        var diff = Math.abs(arrTs - depTs);
        var h = Math.floor(diff / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        if (h > 0) return h + 'h' + (m > 0 ? m + 'm' : '');
        return m + 'm';
    }

    function _getTransportInfo(type) {
        return TRANSPORT_MAP[type] || TRANSPORT_MAP.highspeed;
    }

    function _getAllTickets() {
        _ensureWallet();
        var all = [];
        Object.keys(store.ticketWallet).forEach(function(cid) {
            (store.ticketWallet[cid] || []).forEach(function(t) {
                all.push(t);
            });
        });
        all.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        return all;
    }

    function _getTicketsForContact(contactId) {
        _ensureWallet();
        return (store.ticketWallet[contactId] || []).slice().sort(function(a, b) {
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
    }

    function _getMeetCount(contactId) {
        _ensureWallet();
        return (store.ticketWallet[contactId] || []).length;
    }

    function _getContactsWithTickets() {
        _ensureWallet();
        var ids = [];
        Object.keys(store.ticketWallet).forEach(function(cid) {
            if (store.ticketWallet[cid] && store.ticketWallet[cid].length > 0) {
                ids.push(cid);
            }
        });
        return ids;
    }

    // ===== 条形码生成 =====
    function _genBarcodeHTML() {
        var bars = '';
        for (var i = 0; i < 40; i++) {
            var w = Math.random() > 0.5 ? 2 : 1;
            var h = 20 + Math.floor(Math.random() * 8);
            bars += '<span style="width:' + w + 'px;height:' + h + 'px;"></span>';
        }
        return bars;
    }

    // ===== 渲染票据卡片 =====
    function _renderTicketCard(ticket) {
        var info = _getTransportInfo(ticket.transport);
        var themeClass = ticket.style && ticket.style.theme && ticket.style.theme !== 'default'
            ? ' theme-' + ticket.style.theme : '';
        var contact = (store.contacts || []).find(function(c) { return c.id === ticket.contactId; });
        var contactName = contact ? contact.name : '未知';
        var meetCount = _getMeetCount(ticket.contactId);

        var passengersStr = (ticket.passengers || []).map(function(p) { return p.name; }).join(' / ');

        var html = '<div class="ticket-card' + themeClass + '" onclick="viewTicketDetail(\'' + ticket.id + '\')">';

        // DIY按钮
        html += '<div class="ticket-diy-btn" onclick="event.stopPropagation(); editTicketDIY(\'' + ticket.id + '\')" title="编辑"><i class="fas fa-pen"></i></div>';

        // 头部
        html += '<div class="ticket-header">';
        html += '<div class="ticket-header-left">';
        html += '<div class="ticket-transport-icon ' + info.color + '"><i class="' + info.icon + '"></i></div>';
        html += '<span class="ticket-transport-label">' + info.carrier + '</span>';
        html += '</div>';
        html += '<span class="ticket-no">' + (ticket.ticketNo || '') + '</span>';
        html += '</div>';

        // 主体 - 路线
        html += '<div class="ticket-body">';
        html += '<div class="ticket-route">';

        // 出发地
        html += '<div class="ticket-city">';
        html += '<div class="ticket-city-name">' + _esc(ticket.from.city) + '</div>';
        if (ticket.from.station) html += '<div class="ticket-station">' + _esc(ticket.from.station) + '</div>';
        html += '<div class="ticket-time">' + _formatTime(ticket.departureTime) + '</div>';
        html += '</div>';

        // 路线连线
        html += '<div class="ticket-route-line">';
        html += '<span class="route-transport-mini"><i class="' + info.icon + '" style="font-size:12px;color:#888;"></i></span>';
        html += '<div class="route-line"></div>';
        html += '<span class="route-duration">' + _formatDuration(ticket.departureTime, ticket.arrivalTime) + '</span>';
        html += '</div>';

        // 目的地
        html += '<div class="ticket-city">';
        html += '<div class="ticket-city-name">' + _esc(ticket.to.city) + '</div>';
        if (ticket.to.station) html += '<div class="ticket-station">' + _esc(ticket.to.station) + '</div>';
        html += '<div class="ticket-time">' + _formatTime(ticket.arrivalTime) + '</div>';
        html += '</div>';

        html += '</div>'; // ticket-route

        // 信息行
        html += '<div class="ticket-info-row">';
        html += '<div class="ticket-info-item"><span class="ticket-info-label">乘客</span><span class="ticket-info-value">' + _esc(passengersStr) + '</span></div>';
        html += '<div class="ticket-info-item"><span class="ticket-info-label">日期</span><span class="ticket-info-value">' + _formatDate(ticket.departureTime) + '</span></div>';
        html += '<div class="ticket-info-item"><span class="ticket-info-label">座位</span><span class="ticket-info-value">' + _esc(ticket.seatInfo || '--') + '</span></div>';
        html += '</div>';

        html += '</div>'; // ticket-body

        // 条形码
        html += '<div class="ticket-barcode">' + _genBarcodeHTML() + '</div>';

        // 底部
        html += '<div class="ticket-footer">';
        html += '<div class="ticket-meeting-info">';
        if (ticket.meetingDetected) {
            html += '<i class="fas fa-heart" style="color:#999;"></i>';
            html += '<span>与 ' + _esc(contactName) + ' 的第' + meetCount + '次见面</span>';
        } else {
            html += '<i class="fas fa-ticket-alt"></i>';
            html += '<span>' + _esc(contactName) + '</span>';
        }
        // IP地址标识
        if (ticket.ipSwitch && ticket.ipSwitch.enabled) {
            html += ' <span class="ticket-ip-badge"><i class="fas fa-map-pin"></i>IP: ' + _esc(ticket.ipSwitch.displayLocation || ticket.to.city) + '</span>';
        }
        html += '</div>';
        html += '<div class="ticket-diary-btn" onclick="event.stopPropagation(); openTicketDiary(\'' + ticket.id + '\')">';
        html += '<i class="fas fa-book"></i> ' + (ticket.diary ? '查看日记' : '生成日记');
        html += '</div>';
        html += '</div>';

        html += '</div>'; // ticket-card
        return html;
    }

    function _esc(str) {
        if (typeof escapeHtml === 'function') return escapeHtml(str || '');
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ===== 打开票夹主界面 =====
    window.openTicketWallet = function() {
        _ensureWallet();
        var layer = document.getElementById('layer-ticket-wallet');
        if (!layer) return toast('票夹界面未加载');
        layer.classList.add('show');
        _renderTicketWallet();
    };

    window.closeTicketWallet = function() {
        var layer = document.getElementById('layer-ticket-wallet');
        if (layer) layer.classList.remove('show');
    };

    // ===== 渲染票夹主界面 =====
    function _renderTicketWallet() {
        var container = document.getElementById('ticket-wallet-content');
        if (!container) return;

        _ensureWallet();
        var allTickets = _getAllTickets();

        // 筛选
        var filtered = allTickets;
        if (_twFilter !== 'all') {
            filtered = filtered.filter(function(t) { return t.transport === _twFilter; });
        }
        if (_twContactFilter) {
            filtered = filtered.filter(function(t) { return t.contactId === _twContactFilter; });
        }

        // 构建HTML
        var html = '';

        // 统计卡片
        var totalTickets = allTickets.length;
        var contactCount = _getContactsWithTickets().length;
        var planeCount = allTickets.filter(function(t) { return t.transport === 'plane'; }).length;
        var trainCount = allTickets.filter(function(t) { return t.transport === 'highspeed' || t.transport === 'train'; }).length;

        if (totalTickets > 0) {
            html += '<div class="ticket-stats-card">';
            html += '<div class="ticket-stats-row">';
            html += '<div class="ticket-stat-item"><div class="stat-num">' + totalTickets + '</div><div class="stat-label">总票数</div></div>';
            html += '<div class="ticket-stat-item"><div class="stat-num">' + contactCount + '</div><div class="stat-label">见过的人</div></div>';
            html += '<div class="ticket-stat-item"><div class="stat-num">' + planeCount + '</div><div class="stat-label">飞行次数</div></div>';
            html += '<div class="ticket-stat-item"><div class="stat-num">' + trainCount + '</div><div class="stat-label">铁路出行</div></div>';
            html += '</div></div>';
        }

        // 联系人筛选芯片
        var contactIds = _getContactsWithTickets();
        if (contactIds.length > 1) {
            html += '<div class="ticket-contact-filter" style="margin-bottom:12px; padding:0; background:transparent;">';
            html += '<div class="ticket-contact-chip' + (!_twContactFilter ? ' active' : '') + '" onclick="twFilterContact(null)">';
            html += '<span style="padding-left:8px;">全部</span></div>';
            contactIds.forEach(function(cid) {
                var c = (store.contacts || []).find(function(x) { return x.id === cid; });
                if (!c) return;
                var isActive = _twContactFilter === cid;
                html += '<div class="ticket-contact-chip' + (isActive ? ' active' : '') + '" onclick="twFilterContact(\'' + cid + '\')">';
                html += '<img src="' + (c.avatar || (typeof _ph === 'function' ? _ph(22) : '')) + '">';
                html += '<span>' + _esc(c.name) + ' (' + _getMeetCount(cid) + ')</span></div>';
            });
            html += '</div>';
        }

        // 票据列表
        if (filtered.length === 0) {
            html += '<div class="ticket-empty-state">';
            html += '<i class="fas fa-ticket-alt"></i>';
            if (totalTickets === 0) {
                html += '<p>票夹还是空的~<br>线下见面或手动购票后，这里会出现你的旅行票据</p>';
            } else {
                html += '<p>当前筛选条件下没有票据</p>';
            }
            html += '</div>';
        } else {
            filtered.forEach(function(t) {
                html += _renderTicketCard(t);
            });
        }

        container.innerHTML = html;
    }

    // 渲染筛选标签
    function _renderFilterBar() {
        var bar = document.getElementById('ticket-filter-bar');
        if (!bar) return;
        var filters = [
            { key: 'all', label: '全部' },
            { key: 'plane', label: '飞机' },
            { key: 'highspeed', label: '高铁' },
            { key: 'train', label: '火车' },
            { key: 'car', label: '汽车' },
            { key: 'subway', label: '地铁' },
            { key: 'walk', label: '步行' }
        ];
        bar.innerHTML = filters.map(function(f) {
            return '<div class="ticket-filter-tag' + (_twFilter === f.key ? ' active' : '') +
                   '" onclick="twFilterTransport(\'' + f.key + '\')">' + f.label + '</div>';
        }).join('');
    }

    // ===== 筛选操作 =====
    window.twFilterTransport = function(type) {
        _twFilter = type;
        _renderFilterBar();
        _renderTicketWallet();
    };

    window.twFilterContact = function(contactId) {
        _twContactFilter = contactId;
        _renderTicketWallet();
    };

    // ===== 票据详情 =====
    window.viewTicketDetail = function(ticketId) {
        var ticket = _findTicket(ticketId);
        if (!ticket) return toast('找不到该票据');

        var info = _getTransportInfo(ticket.transport);
        var contact = (store.contacts || []).find(function(c) { return c.id === ticket.contactId; });
        var contactName = contact ? contact.name : '未知';
        var passengersStr = (ticket.passengers || []).map(function(p) { return p.name; }).join(' / ');
        var meetCount = _getMeetCount(ticket.contactId);

        var overlay = document.getElementById('ticket-detail-overlay');
        if (!overlay) return;

        var html = '<div class="ticket-detail-card">';
        html += '<div class="ticket-detail-close" onclick="closeTicketDetail()"><i class="fas fa-times"></i></div>';

        // 票面详情
        html += '<div class="ticket-detail-ticket">';

        // 交通类型
        html += '<div class="ticket-detail-transport">';
        html += '<div class="td-icon ' + info.color + '"><i class="' + info.icon + '"></i></div>';
        html += '<div><div class="td-label">' + info.label + '</div>';
        html += '<div class="td-no">' + _esc(ticket.ticketNo || '') + '</div></div>';
        html += '</div>';

        // 路线
        html += '<div class="ticket-detail-route">';
        html += '<div class="td-city"><div class="td-city-name">' + _esc(ticket.from.city) + '</div>';
        if (ticket.from.station) html += '<div class="td-station">' + _esc(ticket.from.station) + '</div>';
        html += '<div class="td-time">' + _formatTime(ticket.departureTime) + '</div></div>';

        html += '<div class="td-route-middle">';
        html += '<div class="td-route-icon"><i class="' + info.icon + '" style="color:#666;"></i></div>';
        html += '<div class="td-route-line-wrap"><div class="td-route-dash"></div><span class="td-route-arrow">▸</span></div>';
        html += '<div class="td-duration">' + _formatDuration(ticket.departureTime, ticket.arrivalTime) + '</div>';
        html += '</div>';

        html += '<div class="td-city"><div class="td-city-name">' + _esc(ticket.to.city) + '</div>';
        if (ticket.to.station) html += '<div class="td-station">' + _esc(ticket.to.station) + '</div>';
        html += '<div class="td-time">' + _formatTime(ticket.arrivalTime) + '</div></div>';
        html += '</div>';

        // 详细信息
        html += '<div class="ticket-detail-info">';
        html += '<div class="td-info-item"><span class="td-info-label">乘客</span><span class="td-info-value">' + _esc(passengersStr) + '</span></div>';
        html += '<div class="td-info-item"><span class="td-info-label">日期</span><span class="td-info-value">' + _formatDate(ticket.departureTime) + '</span></div>';
        html += '<div class="td-info-item"><span class="td-info-label">座位</span><span class="td-info-value">' + _esc(ticket.seatInfo || '--') + '</span></div>';
        html += '<div class="td-info-item"><span class="td-info-label">票价</span><span class="td-info-value">¥' + _esc(ticket.price || '0') + '</span></div>';
        if (ticket.meetingDetected) {
            html += '<div class="td-info-item"><span class="td-info-label">见面</span><span class="td-info-value">';
            html += '<span class="ticket-meet-count"><i class="fas fa-heart"></i> 第' + meetCount + '次</span>';
            html += '</span></div>';
        }
        if (ticket.ipSwitch && ticket.ipSwitch.enabled) {
            html += '<div class="td-info-item"><span class="td-info-label">IP切换</span><span class="td-info-value">';
            html += '<span class="ticket-ip-badge"><i class="fas fa-map-pin"></i>' + _esc(ticket.ipSwitch.displayLocation || ticket.to.city) + '</span>';
            html += '</span></div>';
        }
        html += '</div>';

        // 备注
        if (ticket.remark) {
            html += '<div style="padding:10px 0; border-top:1px dashed #e5e5e5; margin-top:6px;">';
            html += '<div style="font-size:12px; color:#999; margin-bottom:4px;">备注</div>';
            html += '<div style="font-size:13px; color:#333;">' + _esc(ticket.remark) + '</div>';
            html += '</div>';
        }

        // 条形码
        html += '<div class="ticket-barcode" style="padding:10px 0;">' + _genBarcodeHTML() + '</div>';

        html += '</div>'; // ticket-detail-ticket

        // 操作按钮
        html += '<div class="ticket-detail-actions">';
        html += '<button class="td-action-btn primary" onclick="openTicketDiary(\'' + ticketId + '\'); closeTicketDetail();">';
        html += '<i class="fas fa-book"></i> ' + (ticket.diary ? '查看旅行日记' : '生成旅行日记') + '</button>';

        if (ticket.ipSwitch && ticket.ipSwitch.enabled) {
            html += '<button class="td-action-btn secondary" onclick="deactivateIPSwitch(\'' + ticketId + '\')"><i class="fas fa-map-marker-alt"></i> 关闭IP切换</button>';
        } else {
            html += '<button class="td-action-btn secondary" onclick="activateIPSwitch(\'' + ticketId + '\')"><i class="fas fa-map-marker-alt"></i> 切换IP到 ' + _esc(ticket.to.city) + '</button>';
        }

        html += '<button class="td-action-btn secondary" onclick="editTicketDIY(\'' + ticketId + '\'); closeTicketDetail();"><i class="fas fa-palette"></i> DIY编辑票面</button>';
        html += '<button class="td-action-btn danger" onclick="deleteTicket(\'' + ticketId + '\')"><i class="fas fa-trash-alt"></i> 删除票据</button>';
        html += '</div>';

        html += '</div>'; // ticket-detail-card

        overlay.innerHTML = html;
        overlay.classList.add('show');
    };

    window.closeTicketDetail = function() {
        var overlay = document.getElementById('ticket-detail-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(function() { overlay.innerHTML = ''; }, 300);
        }
    };

    function _getGradient(color) {
        return '#333';
    }

    // ===== 查找票据 =====
    function _findTicket(ticketId) {
        _ensureWallet();
        var found = null;
        Object.keys(store.ticketWallet).some(function(cid) {
            var t = (store.ticketWallet[cid] || []).find(function(x) { return x.id === ticketId; });
            if (t) { found = t; return true; }
            return false;
        });
        return found;
    }

    // ===== 删除票据 =====
    window.deleteTicket = function(ticketId) {
        if (typeof showConfirm === 'function') {
            showConfirm('删除票据', '确定要删除这张票据吗？此操作不可恢复。', function() {
                _doDeleteTicket(ticketId);
            });
        } else {
            if (confirm('确定要删除这张票据吗？')) _doDeleteTicket(ticketId);
        }
    };

    function _doDeleteTicket(ticketId) {
        _ensureWallet();
        Object.keys(store.ticketWallet).forEach(function(cid) {
            store.ticketWallet[cid] = (store.ticketWallet[cid] || []).filter(function(t) {
                return t.id !== ticketId;
            });
            if (store.ticketWallet[cid].length === 0) {
                delete store.ticketWallet[cid];
            }
        });
        save();
        closeTicketDetail();
        _renderTicketWallet();
        toast('票据已删除');
    }

    // ===== IP地址切换 =====
    window.activateIPSwitch = function(ticketId) {
        var ticket = _findTicket(ticketId);
        if (!ticket) return;
        ticket.ipSwitch = {
            enabled: true,
            displayLocation: ticket.to.city
        };
        // 设置全局IP显示
        if (!store.user) store.user = {};
        store.user.displayLocation = ticket.to.city;

        // 如果是双人票，联系人的显示位置也切换
        if (ticket.passengers && ticket.passengers.length > 1) {
            var contact = (store.contacts || []).find(function(c) { return c.id === ticket.contactId; });
            if (contact) {
                if (!contact.settings) contact.settings = {};
                contact.settings.displayLocation = ticket.to.city;
            }
        }

        save();
        closeTicketDetail();
        _renderTicketWallet();
        toast('IP属地已切换至 ' + ticket.to.city, 'success');
    };

    window.deactivateIPSwitch = function(ticketId) {
        var ticket = _findTicket(ticketId);
        if (!ticket) return;
        ticket.ipSwitch = { enabled: false, displayLocation: '' };

        // 清除全局IP
        if (store.user) store.user.displayLocation = null;

        // 清除联系人IP
        var contact = (store.contacts || []).find(function(c) { return c.id === ticket.contactId; });
        if (contact && contact.settings) {
            contact.settings.displayLocation = null;
        }

        save();
        closeTicketDetail();
        _renderTicketWallet();
        toast('IP属地已恢复');
    };

    // ===== 购票界面 =====
    window.openTicketPurchase = function() {
        var layer = document.getElementById('layer-ticket-purchase');
        if (!layer) return toast('购票界面未加载');

        // 初始化默认值
        var now = new Date();
        var dep = new Date(now.getTime() + 3600000); // 1小时后
        var arr = new Date(now.getTime() + 3600000 * 5); // 5小时后

        _purchaseState = {
            transport: 'highspeed',
            fromCity: '',
            fromStation: '',
            toCity: '',
            toStation: '',
            departureTime: _toDateTimeLocal(dep),
            arrivalTime: _toDateTimeLocal(arr),
            passengers: { user: true, contact: true },
            theme: 'default',
            notify: true,
            surprise: false,
            ipSwitch: false,
            remark: ''
        };

        layer.classList.add('show');
        _renderPurchaseForm();
    };

    window.closeTicketPurchase = function() {
        var layer = document.getElementById('layer-ticket-purchase');
        if (layer) layer.classList.remove('show');
    };

    function _toDateTimeLocal(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
               String(d.getDate()).padStart(2, '0') + 'T' +
               String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }

    function _renderPurchaseForm() {
        var container = document.getElementById('ticket-purchase-content');
        if (!container) return;

        var contact = null;
        if (typeof activeChatId !== 'undefined' && activeChatId) {
            contact = (store.contacts || []).find(function(c) { return c.id === activeChatId; });
        }
        var userName = (store.user && store.user.name) || '我';
        var contactName = contact ? contact.name : '联系人';
        var userAvatar = (store.user && store.user.avatar) || (typeof _ph === 'function' ? _ph(28) : '');
        var contactAvatar = contact ? (contact.avatar || (typeof _ph === 'function' ? _ph(28) : '')) : (typeof _ph === 'function' ? _ph(28) : '');

        var ps = _purchaseState;

        var html = '';

        // 1. 交通工具选择
        html += '<div class="tp-section">';
        html += '<div class="tp-section-title"><i class="fas fa-train"></i> 交通工具</div>';
        html += '<div class="tp-transport-grid">';
        var transports = ['plane','highspeed','train','car','bus','subway','walk'];
        transports.forEach(function(t) {
            var info = _getTransportInfo(t);
            html += '<div class="tp-transport-item' + (ps.transport === t ? ' selected' : '') +
                     '" onclick="tpSelectTransport(\'' + t + '\')">';
            html += '<span class="tp-icon"><i class="' + info.icon + '"></i></span>';
            html += '<span class="tp-label">' + info.label + '</span>';
            html += '</div>';
        });
        html += '</div></div>';

        // 2. 出发地 / 目的地
        html += '<div class="tp-section">';
        html += '<div class="tp-section-title"><i class="fas fa-map-marked-alt"></i> 地点</div>';
        html += '<div class="tp-location-card">';
        html += '<div class="tp-loc-row"><span class="tp-loc-dot from"></span>';
        html += '<input class="tp-loc-input" id="tp-from-city" value="' + _esc(ps.fromCity) + '" placeholder="出发城市" oninput="tpUpdateCity(\'from\', this.value)"></div>';
        html += '<div class="tp-loc-row"><span class="tp-loc-dot to"></span>';
        html += '<input class="tp-loc-input" id="tp-to-city" value="' + _esc(ps.toCity) + '" placeholder="到达城市" oninput="tpUpdateCity(\'to\', this.value)"></div>';
        html += '<div class="tp-loc-swap" onclick="tpSwapCities()" title="互换"><i class="fas fa-exchange-alt fa-rotate-90"></i></div>';
        html += '</div></div>';

        // 3. 时间
        html += '<div class="tp-section">';
        html += '<div class="tp-section-title"><i class="fas fa-clock"></i> 时间</div>';
        html += '<div class="tp-time-row">';
        html += '<div class="tp-time-input-wrap"><div class="tp-time-label">出发</div>';
        html += '<input class="tp-time-input" type="datetime-local" id="tp-dep-time" value="' + ps.departureTime + '" onchange="tpUpdateTime(\'dep\', this.value)"></div>';
        html += '<div class="tp-time-input-wrap"><div class="tp-time-label">到达</div>';
        html += '<input class="tp-time-input" type="datetime-local" id="tp-arr-time" value="' + ps.arrivalTime + '" onchange="tpUpdateTime(\'arr\', this.value)"></div>';
        html += '</div></div>';

        // 4. 乘客
        html += '<div class="tp-section">';
        html += '<div class="tp-section-title"><i class="fas fa-users"></i> 乘客</div>';
        html += '<div class="tp-passenger-list">';
        html += '<div class="tp-passenger-item">';
        html += '<input type="checkbox" ' + (ps.passengers.user ? 'checked' : '') + ' onchange="tpTogglePassenger(\'user\', this.checked)">';
        html += '<img class="tp-passenger-avatar" src="' + userAvatar + '">';
        html += '<span class="tp-passenger-name">' + _esc(userName) + '（我）</span>';
        html += '</div>';
        if (contact) {
            html += '<div class="tp-passenger-item">';
            html += '<input type="checkbox" ' + (ps.passengers.contact ? 'checked' : '') + ' onchange="tpTogglePassenger(\'contact\', this.checked)">';
            html += '<img class="tp-passenger-avatar" src="' + contactAvatar + '">';
            html += '<span class="tp-passenger-name">' + _esc(contactName) + '</span>';
            html += '</div>';
        }
        html += '</div></div>';

        // 5. 票面样式
        html += '<div class="tp-section">';
        html += '<div class="tp-section-title"><i class="fas fa-palette"></i> 票面样式</div>';
        html += '<div class="tp-theme-grid">';
        THEMES.forEach(function(t) {
            html += '<div class="tp-theme-item tp-theme-' + t + (ps.theme === t ? ' selected' : '') +
                     '" onclick="tpSelectTheme(\'' + t + '\')">';
            html += '<div class="tp-theme-preview"></div>';
            html += '<span>' + THEME_LABELS[t] + '</span>';
            html += '</div>';
        });
        html += '</div></div>';

        // 6. 选项
        html += '<div class="tp-section">';
        html += '<div class="tp-section-title"><i class="fas fa-cog"></i> 选项</div>';
        html += '<div class="tp-options">';

        html += '<div class="tp-option-row">';
        html += '<div><div class="tp-option-label">告知对方</div><div class="tp-option-desc">在聊天中发送通知</div></div>';
        html += '<div class="tp-toggle' + (ps.notify ? ' on' : '') + '" onclick="tpToggleOption(\'notify\', this)"></div>';
        html += '</div>';

        html += '<div class="tp-option-row">';
        html += '<div><div class="tp-option-label">惊喜模式</div><div class="tp-option-desc">不通知，给对方一个惊喜</div></div>';
        html += '<div class="tp-toggle' + (ps.surprise ? ' on' : '') + '" onclick="tpToggleOption(\'surprise\', this)"></div>';
        html += '</div>';

        html += '<div class="tp-option-row">';
        html += '<div><div class="tp-option-label">到达后切换IP</div><div class="tp-option-desc">显示IP属地在目的地</div></div>';
        html += '<div class="tp-toggle' + (ps.ipSwitch ? ' on' : '') + '" onclick="tpToggleOption(\'ipSwitch\', this)"></div>';
        html += '</div>';

        html += '</div></div>';

        // 7. 备注
        html += '<div class="tp-section">';
        html += '<div class="tp-section-title"><i class="fas fa-comment"></i> 备注</div>';
        html += '<textarea class="tp-remark-input" id="tp-remark" placeholder="写点什么..." oninput="_purchaseState.remark=this.value">' + _esc(ps.remark) + '</textarea>';
        html += '</div>';

        // 8. 购票按钮
        html += '<button class="tp-submit-btn" onclick="confirmPurchaseTicket()">';
        html += '<i class="fas fa-ticket-alt"></i> 确认购票</button>';

        container.innerHTML = html;
    }

    // ===== 购票表单交互 =====
    window.tpSelectTransport = function(type) {
        _purchaseState.transport = type;
        _renderPurchaseForm();
    };

    window.tpUpdateCity = function(which, val) {
        if (which === 'from') _purchaseState.fromCity = val;
        else _purchaseState.toCity = val;
    };

    window.tpSwapCities = function() {
        var tmp = _purchaseState.fromCity;
        _purchaseState.fromCity = _purchaseState.toCity;
        _purchaseState.toCity = tmp;
        _renderPurchaseForm();
    };

    window.tpUpdateTime = function(which, val) {
        if (which === 'dep') _purchaseState.departureTime = val;
        else _purchaseState.arrivalTime = val;
    };

    window.tpTogglePassenger = function(who, checked) {
        _purchaseState.passengers[who] = checked;
    };

    window.tpSelectTheme = function(theme) {
        _purchaseState.theme = theme;
        _renderPurchaseForm();
    };

    window.tpToggleOption = function(key, el) {
        _purchaseState[key] = !_purchaseState[key];
        if (el) el.classList.toggle('on');
        // 惊喜模式和告知互斥
        if (key === 'surprise' && _purchaseState.surprise) {
            _purchaseState.notify = false;
            _renderPurchaseForm();
        }
        if (key === 'notify' && _purchaseState.notify) {
            _purchaseState.surprise = false;
            _renderPurchaseForm();
        }
    };

    // 暴露 _purchaseState 给 oninput
    window._purchaseState = _purchaseState;

    // ===== 确认购票 =====
    window.confirmPurchaseTicket = function() {
        var ps = _purchaseState;
        if (!ps.fromCity.trim()) return toast('请输入出发城市');
        if (!ps.toCity.trim()) return toast('请输入到达城市');
        if (!ps.passengers.user && !ps.passengers.contact) return toast('请至少选择一位乘客');

        var contactId = (typeof activeChatId !== 'undefined') ? activeChatId : null;
        if (!contactId) return toast('请先打开聊天窗口');

        var contact = (store.contacts || []).find(function(c) { return c.id === contactId; });
        if (!contact) return toast('找不到联系人');

        var userName = (store.user && store.user.name) || '我';
        var contactName = contact.name || '联系人';

        var passengers = [];
        if (ps.passengers.user) passengers.push({ name: userName, role: 'user' });
        if (ps.passengers.contact) passengers.push({ name: contactName, role: 'contact' });

        var depTs = ps.departureTime ? new Date(ps.departureTime).getTime() : Date.now();
        var arrTs = ps.arrivalTime ? new Date(ps.arrivalTime).getTime() : (depTs + 18000000);

        var ticket = {
            id: _genId(),
            contactId: contactId,
            type: 'manual',
            transport: ps.transport,
            from: {
                city: ps.fromCity.trim(),
                station: _genStation(ps.fromCity.trim(), ps.transport),
                province: '',
                country: ''
            },
            to: {
                city: ps.toCity.trim(),
                station: _genStation(ps.toCity.trim(), ps.transport),
                province: '',
                country: ''
            },
            passengers: passengers,
            departureTime: depTs,
            arrivalTime: arrTs,
            createdAt: Date.now(),
            seatInfo: _genSeat(ps.transport),
            ticketNo: _genTicketNo(ps.transport),
            price: _genPrice(ps.transport, 500),
            style: { theme: ps.theme, bgImage: null, customCSS: '' },
            notifyPartner: ps.notify,
            surprise: ps.surprise,
            ipSwitch: {
                enabled: ps.ipSwitch,
                displayLocation: ps.ipSwitch ? ps.toCity.trim() : ''
            },
            diary: null,
            offlineSessionId: null,
            meetingDetected: false,
            remark: ps.remark.trim()
        };

        _ensureWallet();
        if (!store.ticketWallet[contactId]) store.ticketWallet[contactId] = [];
        store.ticketWallet[contactId].push(ticket);

        // IP切换立即生效
        if (ps.ipSwitch) {
            if (!store.user) store.user = {};
            store.user.displayLocation = ps.toCity.trim();
            if (passengers.length > 1 && contact) {
                if (!contact.settings) contact.settings = {};
                contact.settings.displayLocation = ps.toCity.trim();
            }
        }

        save();

        // 告知对方 - 在聊天中发送通知
        if (ps.notify && !ps.surprise) {
            _sendTicketNotification(contactId, ticket, contact);
        }
        // [2026-05-05] 惊喜模式 - 发送特殊惊喜气泡（不暴露具体票据信息）
        else if (ps.surprise) {
            _sendSurpriseNotification(contactId, ticket, contact);
        }

        closeTicketPurchase();
        _renderTicketWallet();

        var info = _getTransportInfo(ps.transport);
        toast('购票成功', 'success');
    };

    // ===== 发送票据通知到聊天（结构化卡片气泡） =====
    function _sendTicketNotification(contactId, ticket, contact) {
        if (!store.chats) store.chats = {};
        if (!store.chats[contactId]) store.chats[contactId] = [];

        var info = _getTransportInfo(ticket.transport);
        var passengersStr = (ticket.passengers || []).map(function(p) { return p.name; }).join('、');

        store.chats[contactId].push({
            sender: 'me',
            type: 'ticket-notify',
            content: '我买了' + info.label + '票，' + ticket.from.city + ' → ' + ticket.to.city,
            ticketId: ticket.id,
            transportIcon: info.icon,
            transportLabel: info.label,
            ticketNo: ticket.ticketNo || '',
            fromCity: ticket.from.city,
            fromStation: ticket.from.station || '',
            toCity: ticket.to.city,
            toStation: ticket.to.station || '',
            departureTime: ticket.departureTime,
            arrivalTime: ticket.arrivalTime,
            passengers: passengersStr,
            seat: ticket.seat || '',
            remark: ticket.remark || '',
            time: Date.now()
        });

        if (contact) contact.lastMsgTime = Date.now();
        save();

        // 刷新聊天界面（如果当前打开了这个聊天）
        if (typeof renderHistory === 'function' && typeof activeChatId !== 'undefined' && activeChatId === contactId) {
            renderHistory();
        }
    }

    // ===== 发送惊喜票据通知到聊天（特殊气泡） =====
    function _sendSurpriseNotification(contactId, ticket, contact) {
        if (!store.chats) store.chats = {};
        if (!store.chats[contactId]) store.chats[contactId] = [];

        var info = _getTransportInfo(ticket.transport);

        store.chats[contactId].push({
            sender: 'me',
            type: 'ticket-surprise',
            content: '给你准备了一个惊喜',
            ticketId: ticket.id,
            transportIcon: info.icon,
            transportLabel: info.label,
            fromCity: ticket.from.city,
            toCity: ticket.to.city,
            departureTime: ticket.departureTime,
            time: Date.now()
        });

        if (contact) contact.lastMsgTime = Date.now();
        save();

        // 刷新聊天界面
        if (typeof renderHistory === 'function' && typeof activeChatId !== 'undefined' && activeChatId === contactId) {
            renderHistory();
        }
    }

    // ===== 旅行日记 =====
    window.openTicketDiary = function(ticketId) {
        var ticket = _findTicket(ticketId);
        if (!ticket) return toast('找不到票据');

        var overlay = document.getElementById('ticket-diary-overlay');
        if (!overlay) return;

        if (ticket.diary && ticket.diary.content) {
            // 已有日记，直接显示
            _showDiaryContent(overlay, ticket);
        } else {
            // 生成日记
            _showDiaryLoading(overlay);
            _generateTripDiary(ticket).then(function() {
                _showDiaryContent(overlay, ticket);
            }).catch(function(e) {
                console.error('[ticket-diary] 生成失败:', e);
                overlay.innerHTML = '<div class="ticket-diary-card">' +
                    '<div class="ticket-diary-header"><h3><i class="fas fa-book"></i> 旅行日记</h3>' +
                    '<span class="diary-close" onclick="closeTicketDiary()"><i class="fas fa-times"></i></span></div>' +
                    '<div class="ticket-diary-content" style="color:#999;">日记生成失败，请稍后再试<br>' + _esc(e.message || '') + '</div></div>';
            });
        }
        overlay.classList.add('show');
    };

    window.closeTicketDiary = function() {
        var overlay = document.getElementById('ticket-diary-overlay');
        if (overlay) {
            overlay.classList.remove('show');
            setTimeout(function() { overlay.innerHTML = ''; }, 300);
        }
    };

    function _showDiaryLoading(overlay) {
        overlay.innerHTML = '<div class="ticket-diary-card">' +
            '<div class="ticket-diary-header"><h3><i class="fas fa-book"></i> 旅行日记</h3>' +
            '<span class="diary-close" onclick="closeTicketDiary()"><i class="fas fa-times"></i></span></div>' +
            '<div class="ticket-diary-loading"><i class="fas fa-spinner fa-spin" style="font-size:20px; margin-bottom:10px;"></i><br>正在为你撰写旅行日记...</div></div>';
    }

    function _showDiaryContent(overlay, ticket) {
        var contact = (store.contacts || []).find(function(c) { return c.id === ticket.contactId; });
        var contactName = contact ? contact.name : '未知';
        var info = _getTransportInfo(ticket.transport);

        var html = '<div class="ticket-diary-card">';
        html += '<div class="ticket-diary-header"><h3><i class="fas fa-book"></i> 旅行日记</h3>';
        html += '<span class="diary-close" onclick="closeTicketDiary()"><i class="fas fa-times"></i></span></div>';

        if (ticket.diary && ticket.diary.content) {
            html += '<div class="ticket-diary-content">' + _esc(ticket.diary.content) + '</div>';
            html += '<div class="ticket-diary-meta">';
            html += '<span>' + _esc(ticket.from.city) + ' → ' + _esc(ticket.to.city) + '</span>';
            html += '<span>' + (ticket.diary.generatedAt ? new Date(ticket.diary.generatedAt).toLocaleDateString('zh-CN') : '') + '</span>';
            html += '</div>';
        } else {
            html += '<div class="ticket-diary-content" style="color:#999;">暂无日记内容</div>';
        }

        html += '</div>';
        overlay.innerHTML = html;
    }

    async function _generateTripDiary(ticket) {
        var contact = (store.contacts || []).find(function(c) { return c.id === ticket.contactId; });
        if (!contact) throw new Error('联系人不存在');

        var contactName = contact.name || '对方';
        var info = _getTransportInfo(ticket.transport);

        // 收集相关时间段的聊天记录
        var chatSummary = '';
        var allChats = [];

        // 线下聊天记录
        if (store.offlineChats && store.offlineChats[ticket.contactId]) {
            allChats = allChats.concat(store.offlineChats[ticket.contactId]);
        }
        // 线上聊天记录
        if (store.chats && store.chats[ticket.contactId]) {
            allChats = allChats.concat(store.chats[ticket.contactId]);
        }

        // 筛选时间范围内的记录 (出发前1天 ~ 到达后1天)
        var timeStart = (ticket.departureTime || ticket.createdAt) - 86400000;
        var timeEnd = (ticket.arrivalTime || ticket.createdAt) + 86400000;
        var relevantChats = allChats.filter(function(m) {
            var t = m.time || 0;
            return t >= timeStart && t <= timeEnd;
        }).slice(-15);

        if (relevantChats.length > 0) {
            chatSummary = relevantChats.map(function(m) {
                var who = (m.sender === 'user' || m.sender === 'me') ? '我' : contactName;
                return who + ': ' + ((m.content || '') + '').substring(0, 80);
            }).join('\n');
        }

        var passengersStr = (ticket.passengers || []).map(function(p) { return p.name; }).join('、');

        var prompt = '请根据以下信息生成一篇温馨的旅行日记小结（150-250字），用第一人称写：\n\n' +
            '出行方式: ' + info.label + '\n' +
            '出发地: ' + ticket.from.city + (ticket.from.station ? ' ' + ticket.from.station : '') + '\n' +
            '目的地: ' + ticket.to.city + (ticket.to.station ? ' ' + ticket.to.station : '') + '\n' +
            '出发时间: ' + _formatDate(ticket.departureTime) + ' ' + _formatTime(ticket.departureTime) + '\n' +
            '同行人: ' + passengersStr + '\n';

        if (ticket.remark) prompt += '备注: ' + ticket.remark + '\n';

        if (chatSummary) {
            prompt += '\n见面期间的部分对话摘要:\n' + chatSummary + '\n';
        }

        prompt += '\n要求：写一段甜蜜温暖的旅行日记，记录出行过程中的小细节和见面的美好感受。语气自然，像是写在日记本上的随笔。不要使用markdown格式。';

        // 调用AI - 使用项目现有的API调用方式
        var diary = await _callAIForDiary(prompt);
        ticket.diary = { content: diary, generatedAt: Date.now() };
        save();
    }

    async function _callAIForDiary(prompt) {
        // [FIX-2026-05-05] 改用项目统一 API 模块，修复 store.system.apiUrl 字段名错误
        // 旧代码使用 store.system.apiUrl（不存在），导致永远回退到硬编码 OpenAI 地址
        // 且未走代理/副API路由，第三方站子用户必定失败
        if (typeof API === 'undefined' || !API || !API.chatCompletion) {
            throw new Error('API模块未就绪，请刷新页面后重试');
        }
        if (!store.system || !store.system.url || !store.system.key) {
            throw new Error('请先在设置中配置API地址和密钥');
        }

        var data = await API.chatCompletion([
            { role: 'system', content: '你是一个擅长写温馨旅行日记的作家。' },
            { role: 'user', content: prompt }
        ], { max_tokens: 800, temperature: 0.8 });

        var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!content) throw new Error('AI返回内容为空');
        return content.trim();
    }

    // ===== DIY编辑票面 =====
    window.editTicketDIY = function(ticketId) {
        var ticket = _findTicket(ticketId);
        if (!ticket) return toast('找不到票据');

        var info = _getTransportInfo(ticket.transport);

        // 使用简单的弹窗编辑
        var overlay = document.getElementById('ticket-detail-overlay');
        if (!overlay) return;

        var html = '<div class="ticket-detail-card" style="max-height:85vh;">';
        html += '<div class="ticket-detail-close" onclick="closeTicketDetail()"><i class="fas fa-times"></i></div>';

        html += '<div style="padding:20px;">';
        html += '<h3 style="font-size:17px; font-weight:600; margin-bottom:16px; display:flex; align-items:center; gap:6px;">';
        html += '<i class="fas fa-palette" style="color:#666;"></i> DIY编辑票面</h3>';

        // 出发地
        html += '<div style="margin-bottom:12px;">';
        html += '<div style="font-size:12px; color:#999; margin-bottom:4px;">出发城市</div>';
        html += '<input id="diy-from-city" value="' + _esc(ticket.from.city) + '" style="width:100%; padding:8px 12px; border:1px solid #e5e5e5; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box;">';
        html += '</div>';

        // 目的地
        html += '<div style="margin-bottom:12px;">';
        html += '<div style="font-size:12px; color:#999; margin-bottom:4px;">到达城市</div>';
        html += '<input id="diy-to-city" value="' + _esc(ticket.to.city) + '" style="width:100%; padding:8px 12px; border:1px solid #e5e5e5; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box;">';
        html += '</div>';

        // 车次/航班号
        html += '<div style="margin-bottom:12px;">';
        html += '<div style="font-size:12px; color:#999; margin-bottom:4px;">车次/航班号</div>';
        html += '<input id="diy-ticket-no" value="' + _esc(ticket.ticketNo || '') + '" style="width:100%; padding:8px 12px; border:1px solid #e5e5e5; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box;">';
        html += '</div>';

        // 出发时间
        html += '<div style="margin-bottom:12px;">';
        html += '<div style="font-size:12px; color:#999; margin-bottom:4px;">出发时间</div>';
        html += '<input id="diy-dep-time" type="datetime-local" value="' + (ticket.departureTime ? _toDateTimeLocal(new Date(ticket.departureTime)) : '') + '" style="width:100%; padding:8px 12px; border:1px solid #e5e5e5; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box;">';
        html += '</div>';

        // 到达时间
        html += '<div style="margin-bottom:12px;">';
        html += '<div style="font-size:12px; color:#999; margin-bottom:4px;">到达时间</div>';
        html += '<input id="diy-arr-time" type="datetime-local" value="' + (ticket.arrivalTime ? _toDateTimeLocal(new Date(ticket.arrivalTime)) : '') + '" style="width:100%; padding:8px 12px; border:1px solid #e5e5e5; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box;">';
        html += '</div>';

        // 座位
        html += '<div style="margin-bottom:12px;">';
        html += '<div style="font-size:12px; color:#999; margin-bottom:4px;">座位信息</div>';
        html += '<input id="diy-seat" value="' + _esc(ticket.seatInfo || '') + '" style="width:100%; padding:8px 12px; border:1px solid #e5e5e5; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box;">';
        html += '</div>';

        // 备注
        html += '<div style="margin-bottom:12px;">';
        html += '<div style="font-size:12px; color:#999; margin-bottom:4px;">备注</div>';
        html += '<input id="diy-remark" value="' + _esc(ticket.remark || '') + '" style="width:100%; padding:8px 12px; border:1px solid #e5e5e5; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box;">';
        html += '</div>';

        // 票面主题
        html += '<div style="margin-bottom:16px;">';
        html += '<div style="font-size:12px; color:#999; margin-bottom:8px;">票面主题</div>';
        html += '<div class="tp-theme-grid">';
        var currentTheme = (ticket.style && ticket.style.theme) || 'default';
        THEMES.forEach(function(t) {
            html += '<div class="tp-theme-item tp-theme-' + t + (currentTheme === t ? ' selected' : '') +
                     '" onclick="diySelectTheme(\'' + ticketId + '\', \'' + t + '\', this)">';
            html += '<div class="tp-theme-preview"></div>';
            html += '<span>' + THEME_LABELS[t] + '</span>';
            html += '</div>';
        });
        html += '</div></div>';

        // 保存按钮
        html += '<button class="tp-submit-btn" onclick="saveDIYTicket(\'' + ticketId + '\')">';
        html += '<i class="fas fa-check"></i> 保存修改</button>';

        html += '</div>'; // padding
        html += '</div>'; // ticket-detail-card

        overlay.innerHTML = html;
        overlay.classList.add('show');
    };

    window.diySelectTheme = function(ticketId, theme, el) {
        // 视觉切换
        var items = el.parentElement.querySelectorAll('.tp-theme-item');
        items.forEach(function(item) { item.classList.remove('selected'); });
        el.classList.add('selected');
        // 临时存储
        el.parentElement.setAttribute('data-selected-theme', theme);
    };

    window.saveDIYTicket = function(ticketId) {
        var ticket = _findTicket(ticketId);
        if (!ticket) return toast('找不到票据');

        var fromCity = document.getElementById('diy-from-city');
        var toCity = document.getElementById('diy-to-city');
        var ticketNo = document.getElementById('diy-ticket-no');
        var depTime = document.getElementById('diy-dep-time');
        var arrTime = document.getElementById('diy-arr-time');
        var seat = document.getElementById('diy-seat');
        var remark = document.getElementById('diy-remark');
        var themeGrid = document.querySelector('.tp-theme-grid');
        var selectedTheme = themeGrid ? (themeGrid.getAttribute('data-selected-theme') || ticket.style.theme) : ticket.style.theme;

        if (fromCity && fromCity.value.trim()) {
            ticket.from.city = fromCity.value.trim();
            ticket.from.station = _genStation(fromCity.value.trim(), ticket.transport);
        }
        if (toCity && toCity.value.trim()) {
            ticket.to.city = toCity.value.trim();
            ticket.to.station = _genStation(toCity.value.trim(), ticket.transport);
        }
        if (ticketNo) ticket.ticketNo = ticketNo.value.trim();
        if (depTime && depTime.value) ticket.departureTime = new Date(depTime.value).getTime();
        if (arrTime && arrTime.value) ticket.arrivalTime = new Date(arrTime.value).getTime();
        if (seat) ticket.seatInfo = seat.value.trim();
        if (remark) ticket.remark = remark.value.trim();
        if (!ticket.style) ticket.style = {};
        ticket.style.theme = selectedTheme;

        // 如果IP切换已激活，更新显示位置
        if (ticket.ipSwitch && ticket.ipSwitch.enabled && toCity && toCity.value.trim()) {
            ticket.ipSwitch.displayLocation = toCity.value.trim();
            if (store.user) store.user.displayLocation = toCity.value.trim();
        }

        save();
        closeTicketDetail();
        _renderTicketWallet();
        toast('票面已更新', 'success');
    };

    // ===== 见面检测系统 =====

    /**
     * 从线下模式的距离更新中检测是否发生见面
     * 需在 app-part3.js 的 STATUS 解析处调用
     */
    window.checkMeetingDetection = function(contactId, distStr) {
        if (!contactId) return;
        var dist = parseFloat(distStr);
        if (isNaN(dist) || dist < 0) return;

        // 初始化追踪器
        if (!_meetingTracker[contactId]) {
            _meetingTracker[contactId] = {
                lastDist: dist,
                initialDist: dist,
                distHistory: [dist],
                meetingDetected: false,
                sessionStart: Date.now()
            };
            return;
        }

        var tracker = _meetingTracker[contactId];
        tracker.lastDist = dist;
        tracker.distHistory.push(dist);

        // 见面判定条件:
        // 1. 距离 <= 1米
        // 2. 本次会话尚未触发过
        // 3. 初始距离 > 5米（排除一开始就很近的情况）
        if (dist <= 1 && !tracker.meetingDetected && tracker.initialDist > 5) {
            tracker.meetingDetected = true;
            _onMeetingDetected(contactId, tracker);
        }
    };

    /**
     * 重置见面检测追踪器（退出线下模式时调用）
     */
    window.resetMeetingTracker = function(contactId) {
        if (contactId) {
            delete _meetingTracker[contactId];
        } else {
            _meetingTracker = {};
        }
    };

    function _onMeetingDetected(contactId, tracker) {
        var contact = (store.contacts || []).find(function(c) { return c.id === contactId; });
        if (!contact) return;

        var initialDist = tracker.initialDist;
        var transport = _determineTransport(initialDist, contact);
        var info = _getTransportInfo(transport);

        // 猜测出发地和目的地
        var fromCity = (store.user && store.user.displayLocation) || '我的城市';
        var toCity = contact.settings && contact.settings.displayLocation ? contact.settings.displayLocation : (contact.name + '的城市');

        // 根据距离决定是否同城
        var distKm = initialDist / 1000;
        if (distKm < 50) {
            // 同城，使用同一城市
            fromCity = store.user && store.user.displayLocation ? store.user.displayLocation : '本市';
            toCity = fromCity;
        }

        var userName = (store.user && store.user.name) || '我';

        var now = Date.now();
        var travelMinutes = _estimateTravelTime(transport, distKm);
        var depTime = now - travelMinutes * 60000;

        var ticket = {
            id: _genId(),
            contactId: contactId,
            type: 'auto',
            transport: transport,
            from: {
                city: fromCity,
                station: _genStation(fromCity, transport),
                province: '', country: ''
            },
            to: {
                city: toCity,
                station: _genStation(toCity, transport),
                province: '', country: ''
            },
            passengers: [
                { name: userName, role: 'user' }
            ],
            departureTime: depTime,
            arrivalTime: now,
            createdAt: now,
            seatInfo: _genSeat(transport),
            ticketNo: _genTicketNo(transport),
            price: _genPrice(transport, distKm),
            style: { theme: 'default', bgImage: null, customCSS: '' },
            notifyPartner: false,
            surprise: false,
            ipSwitch: { enabled: false, displayLocation: '' },
            diary: null,
            offlineSessionId: tracker.sessionStart ? String(tracker.sessionStart) : null,
            meetingDetected: true,
            remark: ''
        };

        _ensureWallet();
        if (!store.ticketWallet[contactId]) store.ticketWallet[contactId] = [];
        store.ticketWallet[contactId].push(ticket);
        save();

        var meetCount = _getMeetCount(contactId);

        // 更新线下模式顶部UI
        _updateOfflineMeetingBadge(contactId, info, meetCount);

        toast('已和' + contact.name + '见面，票夹已收录（第' + meetCount + '次）', 'success');
    }

    function _determineTransport(initialDistMeters, contact) {
        var distKm = initialDistMeters / 1000;
        var persona = (contact.persona || '').toLowerCase();

        if (distKm < 3) return 'walk';
        if (distKm < 15) return 'subway';
        if (distKm < 50) return 'car';
        if (distKm < 500) return 'highspeed';

        // 远距离: 飞机 or 火车
        if (persona.indexOf('穷') >= 0 || persona.indexOf('省钱') >= 0 ||
            persona.indexOf('学生') >= 0 || persona.indexOf('拮据') >= 0 ||
            persona.indexOf('打工') >= 0) {
            return 'train';
        }
        return 'plane';
    }

    function _estimateTravelTime(transport, distKm) {
        switch (transport) {
            case 'walk': return Math.max(10, distKm * 12);
            case 'subway': return Math.max(15, distKm * 3);
            case 'bus': return Math.max(20, distKm * 4);
            case 'car': return Math.max(15, distKm * 1.5);
            case 'highspeed': return Math.max(30, distKm * 0.3 + 30);
            case 'train': return Math.max(60, distKm * 0.6 + 30);
            case 'plane': return Math.max(90, distKm * 0.1 + 90);
            default: return 60;
        }
    }

    // ===== 线下模式见面状态UI =====
    function _updateOfflineMeetingBadge(contactId, transportInfo, meetCount) {
        // 更新聊天嵌入式线下模式的见面状态
        var chatBadge = document.getElementById('chat-offline-meeting-badge');
        if (chatBadge) {
            chatBadge.innerHTML = '<i class="fas fa-check-circle"></i> 已见面 · ' +
                transportInfo.label +
                ' · <span class="ticket-meet-count">第' + meetCount + '次</span>';
            chatBadge.classList.add('show');
        }

        // 更新独立页面线下模式的见面状态
        var pageBadge = document.getElementById('offline-meeting-badge');
        if (pageBadge) {
            pageBadge.innerHTML = '<i class="fas fa-check-circle"></i> 已见面 · ' +
                transportInfo.label +
                ' · <span class="ticket-meet-count">第' + meetCount + '次</span>';
            pageBadge.classList.add('show');
        }
    }

    // ===== 从聊天界面加号菜单快捷入口 =====
    // [群聊适配] 支持可选的 isGroupAA 参数
    window.openTicketWalletFromChat = function(isGroupAA) {
        if (typeof closeExtMenu === 'function') closeExtMenu();
        if (isGroupAA && typeof activeChatId !== 'undefined') {
            // 群AA模式：记录群聊上下文
            window._ticketGroupAAContext = activeChatId;
        } else {
            window._ticketGroupAAContext = null;
        }
        openTicketWallet();
    };

    // ===== 数据导出兼容 =====
    // 在save时自动包含ticketWallet
    var _origSave = null;

    // 初始化：确保票夹数据结构
    function _initTicketWallet() {
        if (typeof store !== 'undefined') {
            _ensureWallet();
        }
    }

    // DOM就绪后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(_initTicketWallet, 500);
        });
    } else {
        setTimeout(_initTicketWallet, 500);
    }

    console.log('[ticket-wallet] 票夹模块已加载');
})();
