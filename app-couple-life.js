// ====== 情侣生活中心 (app-couple-life.js) ======
// 统一入口: 日历 | 账本 | 经期 | 纪念日 | 课表
// UI: 黑白极简, 底部Tab导航
(function(){
    'use strict';

    // ====== 状态 ======
    var lifeTab = 'calendar'; // calendar | ledger | period | anniversary | timetable
    var lifeAddFormOpen = false;
    var lifeAddType = 'schedule'; // schedule | shared
    var lifeEditingEvent = null; // {type, id} 正在编辑的事件

    // ====== SVG图标 ======
    var LIFE_ICONS = {
        back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
        calendar: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        ledger: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
        period: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
        anniversary: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        timetable: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
        plus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        chevronLeft: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
        chevronRight: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
        x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        target: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>'
    };

    // ====== 工具 ======
    function _sp() { return typeof getCurrentCoupleSpace === 'function' ? getCurrentCoupleSpace() : null; }
    function _pt(s) { return s ? (store.contacts || []).find(function(x){ return x.id === s.partnerId; }) : null; }
    function _pn(s) { var p = _pt(s); return p ? p.name : 'TA'; }
    function _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function _dk(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
    function _today() { return _dk(new Date()); }

    // ====== Tab渲染 ======
    var LIFE_TABS = [
        { id: 'calendar', icon: 'calendar', label: '日历' },
        { id: 'ledger', icon: 'ledger', label: '账本' },
        { id: 'period', icon: 'period', label: '经期' },
        { id: 'anniversary', icon: 'anniversary', label: '纪念日' },
        { id: 'timetable', icon: 'timetable', label: '课表' }
    ];

    function buildTabBar() {
        return '<div class="cl-tab-bar">' + LIFE_TABS.map(function(t) {
            var active = lifeTab === t.id ? ' active' : '';
            return '<div class="cl-tab' + active + '" onclick="window._lifeSetTab(\'' + t.id + '\')">'
                + '<div class="cl-tab-icon">' + LIFE_ICONS[t.icon] + '</div>'
                + '<div class="cl-tab-label">' + t.label + '</div>'
                + '</div>';
        }).join('') + '</div>';
    }

    // ====== 主渲染入口 ======
    window.renderCoupleLifeModule = function(area, space) {
        if (!space) { coupleViewMode = 'detail'; renderCouple(); return; }
        var partnerName = _pn(space);

        // 顶栏
        var topBar = '<div class="cl-topbar">'
            + '<div class="cl-topbar-back" onclick="coupleViewMode=\'detail\';renderCouple()">' + LIFE_ICONS.back + '</div>'
            + '<div class="cl-topbar-title">生活中心</div>'
            + '<div class="cl-topbar-actions"></div>'
            + '</div>';

        // Tab内容
        var body = '';
        switch(lifeTab) {
            case 'calendar': body = buildCalendarTab(space, partnerName); break;
            case 'ledger': body = buildLedgerTab(space, partnerName); break;
            case 'period': body = buildPeriodTab(space, partnerName); break;
            case 'anniversary': body = buildAnniversaryTab(space, partnerName); break;
            case 'timetable': body = buildTimetableTab(space, partnerName); break;
        }

        // 弹窗 overlay（添加/编辑事件）
        var modalHTML = '';
        if (lifeAddFormOpen) {
            modalHTML = buildAddModal(space);
        }

        area.innerHTML = '<div class="cl-page">'
            + topBar
            + '<div class="cl-body">' + body + '</div>'
            + buildTabBar()
            + modalHTML
            + '</div>';
    };

    // ====== 添加/编辑事件弹窗 ======
    function buildAddModal(space) {
        var selectedDate = calSelectedDate || _today();
        var editData = { time:'', title:'', desc:'' };
        var formTitle = '添加事件';
        if (lifeEditingEvent) {
            formTitle = '编辑事件';
            if (lifeEditingEvent.type === 'schedule') {
                var schData = space.scheduleData && space.scheduleData[selectedDate] || [];
                var found = schData.find(function(x){ return String(x.id) === String(lifeEditingEvent.id); });
                if (found) { editData.time = found.time||''; editData.title = found.title||''; editData.desc = found.desc||''; }
            } else if (lifeEditingEvent.type === 'shared') {
                var sharedEvts = (space.coupleCalendar && space.coupleCalendar.sharedEvents) || [];
                var found2 = sharedEvts.find(function(x){ return x.id === lifeEditingEvent.id; });
                if (found2) { editData.time = found2.time||''; editData.title = found2.title||''; editData.desc = found2.desc||''; }
            }
        }
        return '<div class="cl-modal-overlay" onclick="window._lifeCloseForm()">'
            + '<div class="cl-modal-panel" onclick="event.stopPropagation()">'
            + '<div class="cl-modal-header">'
            + '<span class="cl-modal-title">' + formTitle + '</span>'
            + '<span class="cl-modal-close" onclick="window._lifeCloseForm()">' + LIFE_ICONS.x + '</span>'
            + '</div>'
            + (!lifeEditingEvent ? '<div class="cl-add-type-bar">'
                + '<span class="cl-add-type-btn' + (lifeAddType==='schedule'?' active':'') + '" onclick="window._lifeSetAddType(\'schedule\')">日程</span>'
                + '<span class="cl-add-type-btn' + (lifeAddType==='shared'?' active':'') + '" onclick="window._lifeSetAddType(\'shared\')">共享事件</span>'
                + '</div>' : '')
            + '<input id="cl-add-title" class="cl-add-input" placeholder="标题" value="' + _esc(editData.title) + '"/>'
            + '<input id="cl-add-time" class="cl-add-input" type="time" value="' + _esc(editData.time) + '"/>'
            + '<input id="cl-add-desc" class="cl-add-input" placeholder="备注（可选）" value="' + _esc(editData.desc) + '"/>'
            + '<button class="cl-add-save-btn" onclick="window._lifeSaveEvent()">保存</button>'
            + '</div></div>';
    }

    // ====== 日历Tab ======
    // 复用 app-couple-calendar.js 的数据聚合逻辑
    var calYear = new Date().getFullYear();
    var calMonth = new Date().getMonth();
    var calSelectedDate = null;

    function buildCalendarTab(space, partnerName) {
        // 初始化日历数据
        if (!space.coupleCalendar) space.coupleCalendar = { sharedEvents:[] };
        var selectedDate = calSelectedDate || _today();
        var events = typeof getEventsForDay === 'function' ? getEventsForDay(space, selectedDate) : [];

        // 构建月历
        var firstDay = new Date(calYear, calMonth, 1);
        var daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        var startDow = firstDay.getDay();
        var prevMonthDays = new Date(calYear, calMonth, 0).getDate();
        var todayStr = _today();
        var selParts = selectedDate.split('-').map(Number);

        // 获取月份dots
        var dots = {};
        if (typeof getMonthDots === 'function') {
            // 需要从 couple-calendar 模块访问
            for (var d = 1; d <= daysInMonth; d++) {
                var ds = calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
                var dayEvents = typeof getEventsForDay === 'function' ? getEventsForDay(space, ds) : [];
                if (dayEvents.length > 0) dots[d] = true;
            }
        }

        var gridHTML = '';
        // 上月
        for (var i = startDow - 1; i >= 0; i--) {
            gridHTML += '<div class="cl-cal-day cl-cal-other">' + (prevMonthDays - i) + '</div>';
        }
        // 本月
        for (var d = 1; d <= daysInMonth; d++) {
            var ds = calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
            var cls = 'cl-cal-day';
            if (ds === todayStr) cls += ' cl-cal-today';
            if (ds === selectedDate) cls += ' cl-cal-selected';
            var dotHTML = dots[d] ? '<span class="cl-cal-dot"></span>' : '';
            gridHTML += '<div class="' + cls + '" onclick="window._lifeSelectDay(\'' + ds + '\')">' + d + dotHTML + '</div>';
        }
        // 下月
        var total = startDow + daysInMonth;
        var rem = total % 7 === 0 ? 0 : 7 - (total % 7);
        for (var i = 1; i <= rem; i++) {
            gridHTML += '<div class="cl-cal-day cl-cal-other">' + i + '</div>';
        }

        // 事件列表
        var eventsHTML = '';
        if (events.length === 0) {
            eventsHTML = '<div class="cl-empty">这天没有事件</div>';
        } else {
            events.forEach(function(ev) {
                var typeName = ev.type === 'schedule' ? '日程' : ev.type === 'timetable' ? '课表' : ev.type === 'period' ? '经期' : ev.type === 'anniversary' ? '纪念日' : ev.type === 'holiday' ? '节假日' : '共享';
                var actionBtns = '';
                if (ev.type === 'schedule' && ev.id) {
                    actionBtns = '<div class="cl-event-actions">'
                        + '<span onclick="event.stopPropagation();window._lifeEditSchedule(\'' + String(ev.id) + '\')" style="cursor:pointer;color:#999;font-size:12px;padding:2px 6px;">编辑</span>'
                        + '<span onclick="event.stopPropagation();window._lifeDeleteSchedule(\'' + String(ev.id) + '\')" style="cursor:pointer;color:#ff4444;font-size:12px;padding:2px 6px;">删除</span>'
                        + '</div>';
                } else if (ev.type === 'shared' && ev.id) {
                    actionBtns = '<div class="cl-event-actions">'
                        + '<span onclick="event.stopPropagation();window._lifeEditShared(\'' + String(ev.id) + '\')" style="cursor:pointer;color:#999;font-size:12px;padding:2px 6px;">编辑</span>'
                        + '<span onclick="event.stopPropagation();window._lifeDeleteShared(\'' + String(ev.id) + '\')" style="cursor:pointer;color:#ff4444;font-size:12px;padding:2px 6px;">删除</span>'
                        + '</div>';
                } else if (ev.type === 'timetable' && ev.courseIndex !== undefined) {
                    actionBtns = '<div class="cl-event-actions">'
                        + '<span onclick="event.stopPropagation();window._lifeEditTimetable(' + ev.courseIndex + ')" style="cursor:pointer;color:#999;font-size:12px;padding:2px 6px;">编辑</span>'
                        + '<span onclick="event.stopPropagation();window._lifeDeleteTimetable(' + ev.courseIndex + ')" style="cursor:pointer;color:#ff4444;font-size:12px;padding:2px 6px;">删除</span>'
                        + '</div>';
                }
                eventsHTML += '<div class="cl-event-item">'
                    + '<div class="cl-event-stripe"></div>'
                    + '<div class="cl-event-body">'
                    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;">'
                    + '<div class="cl-event-title">' + _esc(ev.title) + '</div>'
                    + actionBtns
                    + '</div>'
                    + (ev.time ? '<div class="cl-event-time">' + _esc(ev.time) + '</div>' : '')
                    + (ev.desc ? '<div class="cl-event-desc">' + _esc(ev.desc) + '</div>' : '')
                    + '<div class="cl-event-tag">' + typeName + '</div>'
                    + '</div></div>';
            });
        }

        var selLabel = selParts[1] + '月' + selParts[2] + '日';

        return '<div class="cl-cal-section">'
            // 月份切换
            + '<div class="cl-cal-month-bar">'
            + '<div class="cl-cal-month-arrow" onclick="window._lifeCalPrev()">' + LIFE_ICONS.chevronLeft + '</div>'
            + '<div class="cl-cal-month-title">' + calYear + '年' + (calMonth + 1) + '月</div>'
            + '<div class="cl-cal-month-arrow" onclick="window._lifeCalNext()">' + LIFE_ICONS.chevronRight + '</div>'
            + '<div class="cl-cal-today-btn" onclick="window._lifeCalToday()">' + LIFE_ICONS.target + '</div>'
            + '</div>'
            // 星期头
            + '<div class="cl-cal-weekdays"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>'
            // 日历网格
            + '<div class="cl-cal-grid">' + gridHTML + '</div>'
            + '</div>'
            // 事件头（含添加按钮）
            + '<div class="cl-events-header">'
            + '<span class="cl-events-date">' + selLabel + '</span>'
            + '<span class="cl-events-count">' + events.length + '个事件</span>'
            + '<span class="cl-events-add-btn" onclick="window._lifeOpenAdd()">' + LIFE_ICONS.plus + '</span>'
            + '</div>'
            // 事件列表
            + '<div class="cl-events-list">' + eventsHTML + '</div>';
    }

    // ====== 账本Tab ======
    function buildLedgerTab(space, partnerName) {
        // 直接调用原有模块的渲染
        var tempDiv = document.createElement('div');
        if (typeof renderCoupleLedgerModule === 'function') {
            renderCoupleLedgerModule(tempDiv, space);
            // 去掉原有的导航栏，用我们的
            var content = tempDiv.innerHTML;
            // 移除原有的cl-nav导航（但保留记账按钮功能）
            content = content.replace(/<div class="cl-nav">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i, '');
            // 在顶部添加独立的记账按钮
            var addBtnHTML = '<div style="display:flex;justify-content:flex-end;padding:10px 16px 0;">'
                + '<button onclick="window._clOpenAdd()" style="display:flex;align-items:center;gap:5px;padding:7px 16px;border:1.5px solid #222;background:#222;color:#fff;border-radius:8px;font-size:13px;cursor:pointer;">'
                + LIFE_ICONS.plus + ' 记一笔</button></div>';
            return '<div class="cl-sub-content">' + addBtnHTML + content + '</div>';
        }
        return '<div class="cl-empty">账本模块未加载</div>';
    }

    // ====== 经期Tab ======
    function buildPeriodTab(space, partnerName) {
        if (typeof renderPeriodModule === 'function') {
            return '<div class="cl-sub-content cl-sub-scroll">' + renderPeriodModule(space) + '</div>';
        }
        return '<div class="cl-empty">经期模块未加载</div>';
    }

    // ====== 纪念日Tab ======
    function buildAnniversaryTab(space, partnerName) {
        if (typeof renderAnniversaryModule === 'function') {
            return '<div class="cl-sub-content cl-sub-scroll">' + renderAnniversaryModule(space) + '</div>';
        }
        return '<div class="cl-empty">纪念日模块未加载</div>';
    }

    // ====== 课表Tab ======
    function buildTimetableTab(space, partnerName) {
        var tempDiv = document.createElement('div');
        if (typeof renderScheduleModule === 'function') {
            renderScheduleModule(tempDiv, space);
            var content = tempDiv.innerHTML;
            return '<div class="cl-sub-content">' + content + '</div>';
        }
        return '<div class="cl-empty">课表模块未加载</div>';
    }

    // ====== 交互 ======
    window._lifeSetTab = function(tab) {
        lifeTab = tab;
        renderCouple();
    };

    window._lifeSelectDay = function(ds) {
        calSelectedDate = ds;
        renderCouple();
    };

    window._lifeCalPrev = function() {
        calMonth--;
        if (calMonth < 0) { calMonth = 11; calYear--; }
        renderCouple();
    };

    window._lifeCalNext = function() {
        calMonth++;
        if (calMonth > 11) { calMonth = 0; calYear++; }
        renderCouple();
    };

    window._lifeCalToday = function() {
        var now = new Date();
        calYear = now.getFullYear();
        calMonth = now.getMonth();
        calSelectedDate = _today();
        renderCouple();
    };

    // ====== 事件增删改交互 ======
    window._lifeOpenAdd = function() {
        lifeAddFormOpen = true;
        lifeEditingEvent = null;
        lifeAddType = 'schedule';
        renderCouple();
    };

    window._lifeCloseForm = function() {
        lifeAddFormOpen = false;
        lifeEditingEvent = null;
        renderCouple();
    };

    window._lifeSetAddType = function(type) {
        lifeAddType = type;
        renderCouple();
    };

    // 保存事件（新增或编辑）
    window._lifeSaveEvent = function() {
        var space = _sp();
        if (!space) return;
        var selectedDate = calSelectedDate || _today();
        var title = ((document.getElementById('cl-add-title')||{}).value||'').trim();
        if (!title) { if (typeof toast === 'function') toast('请填写标题'); return; }
        var time = ((document.getElementById('cl-add-time')||{}).value||'').trim();
        var desc = ((document.getElementById('cl-add-desc')||{}).value||'').trim();

        if (lifeEditingEvent) {
            // 编辑模式
            if (lifeEditingEvent.type === 'schedule') {
                if (!space.scheduleData) space.scheduleData = {};
                var dayItems = space.scheduleData[selectedDate] || [];
                var item = dayItems.find(function(x){ return String(x.id) === String(lifeEditingEvent.id); });
                if (item) { item.time = time; item.title = title; item.desc = desc; }
            } else if (lifeEditingEvent.type === 'shared') {
                if (space.coupleCalendar && space.coupleCalendar.sharedEvents) {
                    var ev = space.coupleCalendar.sharedEvents.find(function(x){ return x.id === lifeEditingEvent.id; });
                    if (ev) { ev.time = time; ev.title = title; ev.desc = desc; }
                }
            }
            if (typeof toast === 'function') toast('已更新');
        } else {
            // 新增模式
            if (lifeAddType === 'schedule') {
                if (!space.scheduleData) space.scheduleData = {};
                if (!space.scheduleData[selectedDate]) space.scheduleData[selectedDate] = [];
                space.scheduleData[selectedDate].push({
                    id: Date.now() + Math.random(),
                    time: time, title: title, desc: desc,
                    autoGenerated: false, stickers: {me:[],partner:[]}, done: false
                });
            } else {
                if (!space.coupleCalendar) space.coupleCalendar = { sharedEvents:[] };
                if (!space.coupleCalendar.sharedEvents) space.coupleCalendar.sharedEvents = [];
                space.coupleCalendar.sharedEvents.push({
                    id: 'cev_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
                    title: title, time: time, emoji: '📌', desc: desc,
                    date: selectedDate, creator: 'user', createdAt: Date.now()
                });
            }
            if (typeof toast === 'function') toast('已添加');
        }
        if (typeof save === 'function') save();
        lifeAddFormOpen = false;
        lifeEditingEvent = null;
        renderCouple();
    };

    // 编辑日程事件
    window._lifeEditSchedule = function(id) {
        lifeEditingEvent = { type: 'schedule', id: id };
        lifeAddFormOpen = true;
        lifeAddType = 'schedule';
        renderCouple();
    };

    // 删除日程事件
    window._lifeDeleteSchedule = function(id) {
        var space = _sp();
        if (!space) return;
        var selectedDate = calSelectedDate || _today();
        if (space.scheduleData && space.scheduleData[selectedDate]) {
            space.scheduleData[selectedDate] = space.scheduleData[selectedDate].filter(function(x){
                return String(x.id) !== String(id);
            });
        }
        if (typeof save === 'function') save();
        if (typeof toast === 'function') toast('已删除');
        renderCouple();
    };

    // 编辑共享事件
    window._lifeEditShared = function(id) {
        lifeEditingEvent = { type: 'shared', id: id };
        lifeAddFormOpen = true;
        lifeAddType = 'shared';
        renderCouple();
    };

    // 删除共享事件
    window._lifeDeleteShared = function(id) {
        var space = _sp();
        if (!space || !space.coupleCalendar) return;
        space.coupleCalendar.sharedEvents = space.coupleCalendar.sharedEvents.filter(function(e){ return e.id !== id; });
        if (typeof save === 'function') save();
        if (typeof toast === 'function') toast('已删除');
        renderCouple();
    };

    // 编辑课表事件 - 跳转到课表Tab并打开编辑界面
    window._lifeEditTimetable = function(idx) {
        lifeTab = 'timetable';
        if (typeof window._ttEditCourse === 'function') {
            window._ttEditCourse(idx);
        } else {
            renderCouple();
        }
    };

    // 删除课表事件
    window._lifeDeleteTimetable = function(idx) {
        var tt = (typeof store !== 'undefined' && store.userTimetable) ? store.userTimetable : null;
        if (!tt || !tt.courses) return;
        if (idx >= 0 && idx < tt.courses.length) {
            tt.courses.splice(idx, 1);
            if (typeof save === 'function') save();
            if (typeof toast === 'function') toast('课程已删除');
            renderCouple();
        }
    };

})();
