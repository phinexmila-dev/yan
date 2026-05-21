// ====== 情侣日历模块 (app-couple-calendar.js) ======
// 合并视图：日程 + 课表 + 经期 + 纪念日 + 节假日
// 入口：情侣空间 → 情侣日历
(function(){
    'use strict';

    // ====== 分类配置 ======
    const CC_TYPES = {
        schedule:    { icon:'fas fa-calendar-check', color:'#5b8def', name:'日程', dot:'#5b8def' },
        timetable:   { icon:'fas fa-book',           color:'#14b8a6', name:'课表', dot:'#14b8a6' },
        period:      { icon:'fas fa-venus',          color:'#ff6b8a', name:'经期', dot:'#ff6b8a' },
        anniversary: { icon:'far fa-heart',          color:'#ec4899', name:'纪念日', dot:'#ec4899' },
        holiday:     { icon:'fas fa-star',           color:'#f59e0b', name:'节假日', dot:'#f59e0b' },
        shared:      { icon:'fas fa-users',          color:'#8b5cf6', name:'共享', dot:'#8b5cf6' }
    };

    // ====== 状态 ======
    let ccYear = new Date().getFullYear();
    let ccMonth = new Date().getMonth();
    let ccSelectedDate = null;
    let ccFilters = { schedule:true, timetable:true, period:true, anniversary:true, holiday:true, shared:true };
    let ccAddFormOpen = false;
    let ccAddType = 'shared';

    // ====== 工具函数 ======
    function _sp() { return typeof getCurrentCoupleSpace === 'function' ? getCurrentCoupleSpace() : null; }
    function _pt(s) { return s ? (store.contacts || []).find(function(x){ return x.id === s.partnerId; }) : null; }
    function _pn(s) { var p = _pt(s); return p ? p.name : 'TA'; }
    function _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function _dk(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
    function _today() { return _dk(new Date()); }

    function _initCal(space) {
        if (!space.coupleCalendar) space.coupleCalendar = { sharedEvents:[], filters:{} };
        if (!space.coupleCalendar.sharedEvents) space.coupleCalendar.sharedEvents = [];
    }

    // ====== 数据聚合：获取某天的所有事件 ======
    function getEventsForDay(space, dateStr) {
        var events = [];
        var parts = dateStr.split('-').map(Number);
        var y = parts[0], m = parts[1], d = parts[2];

        // 1. 日程（从 app-schedule.js 的 scheduleData）
        if (ccFilters.schedule && space.scheduleData) {
            var dayEvents = space.scheduleData[dateStr] || [];
            dayEvents.forEach(function(ev) {
                events.push({ type:'schedule', time:ev.time||'', title:ev.title||ev.emoji||'', desc:ev.desc||'', emoji:ev.emoji||'', id:ev.id });
            });
        }

        // 2. 课表（从全局 store.userTimetable）
        if (ccFilters.timetable && typeof store !== 'undefined' && store.userTimetable && store.userTimetable.courses) {
            var dt = new Date(y, m-1, d);
            var dow = dt.getDay();
            var dayIdx = dow === 0 ? 6 : dow - 1;
            var isWeekend = dow === 0 || dow === 6;
            if (!isWeekend) {
                store.userTimetable.courses.forEach(function(c, idx) {
                    if (c.day === dayIdx) {
                        events.push({ type:'timetable', time:'第'+c.startPeriod+'-'+(c.startPeriod+c.duration-1)+'节', title:c.name, desc:c.location||'', color:c.color, courseIndex:idx });
                    }
                });
            }
        }

        // 3. 经期预测（使用可配置的经期天数和提醒天数）
        if (ccFilters.period && space.cycleDate && space.cycleLen) {
            var cycleStart = new Date(space.cycleDate);
            var cycleLen = parseInt(space.cycleLen) || 28;
            var periodLen = parseInt(space.periodLen) || 5;
            var reminderDays = parseInt(space.reminderDaysBefore) || 3;
            var target = new Date(y, m-1, d);
            var diff = Math.floor((target - cycleStart) / 86400000);
            if (diff >= 0) {
                var dayInCycle = diff % cycleLen;
                if (dayInCycle < periodLen) {
                    events.push({ type:'period', time:'', title:'经期第'+(dayInCycle+1)+'天', desc: dayInCycle===0?'经期开始':'记得好好休息', emoji:'🌸' });
                } else if (dayInCycle >= cycleLen - reminderDays) {
                    var daysLeft = cycleLen - dayInCycle;
                    events.push({ type:'period', time:'', title:'经期将至（'+daysLeft+'天后）', desc:'注意保暖，对自己温柔一点', emoji:'💕' });
                }
            }
        }

        // 4. 纪念日
        if (ccFilters.anniversary && space.anniversaries) {
            space.anniversaries.forEach(function(a) {
                if (!a.date) return;
                var ap = a.date.split('-').map(Number);
                var match = false;
                if (a.date === dateStr) match = true;
                if (a.repeat && a.repeat !== 'none' && ap[1] === m && ap[2] === d) match = true;
                if (match) {
                    var daysAgo = '';
                    if (a.date !== dateStr && a.repeat) {
                        var origYear = ap[0];
                        daysAgo = '第' + (y - origYear) + '年';
                    }
                    events.push({ type:'anniversary', time:daysAgo, title:a.name, desc:a.repeat==='yearly'?'每年重复':'', emoji:'💕' });
                }
            });
        }

        // 5. 节假日（复用 app-calendar.js 的数据）
        if (ccFilters.holiday && typeof getHolidaysForDate === 'function') {
            var holidays = getHolidaysForDate(dateStr);
            holidays.forEach(function(h) {
                events.push({ type:'holiday', time:'', title:h.name, desc:h.note||'', emoji:h.icon||'🎉' });
            });
        }

        // 6. 共享事件
        if (ccFilters.shared && space.coupleCalendar && space.coupleCalendar.sharedEvents) {
            space.coupleCalendar.sharedEvents.forEach(function(ev) {
                if (ev.date === dateStr) {
                    events.push({ type:'shared', time:ev.time||'', title:ev.title, desc:ev.desc||'', emoji:ev.emoji||'📌', id:ev.id, creator:ev.creator });
                }
            });
        }

        // 按时间排序
        events.sort(function(a, b) {
            if (a.time && b.time) return a.time.localeCompare(b.time);
            if (a.time) return -1;
            if (b.time) return 1;
            return 0;
        });

        return events;
    }

    // ====== 获取某月每天的事件类型集合（用于日历圆点） ======
    function getMonthDots(space, year, month) {
        var dots = {};
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        for (var d = 1; d <= daysInMonth; d++) {
            var ds = year+'-'+String(month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
            var evts = getEventsForDay(space, ds);
            if (evts.length > 0) {
                var types = {};
                evts.forEach(function(e){ types[e.type] = true; });
                dots[d] = Object.keys(types);
            }
        }
        return dots;
    }

    // ====== 主渲染入口 ======
    window.renderCoupleCalendarModule = function(area, space) {
        if (!space) { coupleViewMode = 'detail'; renderCouple(); return; }
        _initCal(space);
        var partnerName = _pn(space);
        var selectedDate = ccSelectedDate || _today();
        var events = getEventsForDay(space, selectedDate);
        var dots = getMonthDots(space, ccYear, ccMonth);

        // 构建日历网格
        var firstDay = new Date(ccYear, ccMonth, 1);
        var lastDay = new Date(ccYear, ccMonth + 1, 0);
        var startDow = firstDay.getDay();
        var daysInMonth = lastDay.getDate();
        var prevMonthDays = new Date(ccYear, ccMonth, 0).getDate();
        var todayStr = _today();
        var selParts = selectedDate.split('-').map(Number);

        var gridHTML = '';
        // 上月尾部
        for (var i = startDow - 1; i >= 0; i--) {
            gridHTML += '<div class="cc-day cc-other">' + (prevMonthDays - i) + '</div>';
        }
        // 本月
        for (var d = 1; d <= daysInMonth; d++) {
            var ds = ccYear+'-'+String(ccMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
            var isToday = ds === todayStr;
            var isSel = ds === selectedDate;
            var dayDots = dots[d] || [];
            var cls = 'cc-day';
            if (isToday) cls += ' cc-today';
            if (isSel) cls += ' cc-selected';
            var dotsHtml = dayDots.length > 0 ? '<div class="cc-dots">' + dayDots.slice(0, 3).map(function(t){
                return '<span class="cc-dot" style="background:' + (CC_TYPES[t] ? CC_TYPES[t].dot : '#999') + '"></span>';
            }).join('') + '</div>' : '';
            gridHTML += '<div class="' + cls + '" onclick="window._ccSelectDay(\'' + ds + '\')">' + d + dotsHtml + '</div>';
        }
        // 下月头部
        var total = startDow + daysInMonth;
        var rem = total % 7 === 0 ? 0 : 7 - (total % 7);
        for (var i = 1; i <= rem; i++) {
            gridHTML += '<div class="cc-day cc-other">' + i + '</div>';
        }

        // 筛选器
        var filterHTML = Object.keys(CC_TYPES).map(function(k) {
            var t = CC_TYPES[k];
            var active = ccFilters[k];
            return '<div class="cc-filter-tag ' + (active ? 'active' : '') + '" style="--tag-color:' + t.color + '" onclick="window._ccToggleFilter(\'' + k + '\')">'
                 + '<span class="cc-filter-dot" style="background:' + t.dot + '"></span>' + t.name + '</div>';
        }).join('');

        // 事件列表
        var eventsHTML = '';
        if (events.length === 0) {
            eventsHTML = '<div class="cc-no-events"><i class="far fa-calendar" style="font-size:32px;color:#ddd;margin-bottom:8px;"></i><div>这天没有事件</div></div>';
        } else {
            eventsHTML = events.map(function(ev) {
                var t = CC_TYPES[ev.type] || CC_TYPES.shared;
                var deleteBtn = (ev.type === 'shared' && ev.id) ? '<div class="cc-ev-del" onclick="event.stopPropagation();window._ccDeleteShared(\'' + ev.id + '\')"><i class="fas fa-times"></i></div>' : '';
                return '<div class="cc-event-item">'
                     + '<div class="cc-ev-stripe" style="background:' + t.color + '"></div>'
                     + '<div class="cc-ev-body">'
                     + '<div class="cc-ev-head">'
                     + (ev.emoji ? '<span class="cc-ev-emoji">' + ev.emoji + '</span>' : '')
                     + '<span class="cc-ev-title">' + _esc(ev.title) + '</span>'
                     + (ev.time ? '<span class="cc-ev-time">' + _esc(ev.time) + '</span>' : '')
                     + deleteBtn
                     + '</div>'
                     + (ev.desc ? '<div class="cc-ev-desc">' + _esc(ev.desc) + '</div>' : '')
                     + '<div class="cc-ev-tag" style="color:' + t.color + '"><i class="' + t.icon + '"></i> ' + t.name
                     + (ev.creator ? ' · ' + (ev.creator === 'user' ? '我' : _esc(partnerName)) : '') + '</div>'
                     + '</div></div>';
            }).join('');
        }

        // 添加共享事件表单
        var addFormHTML = '';
        if (ccAddFormOpen) {
            addFormHTML = '<div class="cc-add-form">'
                + '<div class="cc-add-title"><i class="fas fa-plus-circle"></i> 添加共享事件</div>'
                + '<input id="cc-add-event-title" type="text" placeholder="事件标题" maxlength="30">'
                + '<div class="cc-add-row">'
                + '<input id="cc-add-event-time" type="time" placeholder="时间（选填）">'
                + '<input id="cc-add-event-emoji" type="text" placeholder="emoji" maxlength="4" style="width:60px;text-align:center;" value="📌">'
                + '</div>'
                + '<input id="cc-add-event-desc" type="text" placeholder="备注（选填）" maxlength="50">'
                + '<div class="cc-add-actions">'
                + '<button class="cc-btn cc-btn-cancel" onclick="window._ccCloseAdd()">取消</button>'
                + '<button class="cc-btn cc-btn-save" onclick="window._ccSaveShared()">添加</button>'
                + '</div></div>';
        }

        var selLabel = selParts[1] + '月' + selParts[2] + '日';

        area.innerHTML = '<div class="cc-container">'
            + '<div class="cc-nav">'
            + '<div class="cc-nav-back" onclick="coupleViewMode=\'detail\';renderCouple()"><i class="fas fa-chevron-left"></i></div>'
            + '<div class="cc-nav-title">情侣日历</div>'
            + '<div class="cc-nav-actions">'
            + '<div class="cc-nav-btn" onclick="window._ccGoToday()" title="回到今天"><i class="fas fa-crosshairs"></i></div>'
            + '</div></div>'
            // 月份切换
            + '<div class="cc-month-bar">'
            + '<div class="cc-month-arrow" onclick="window._ccPrevMonth()"><i class="fas fa-chevron-left"></i></div>'
            + '<div class="cc-month-title">' + ccYear + '年' + (ccMonth + 1) + '月</div>'
            + '<div class="cc-month-arrow" onclick="window._ccNextMonth()"><i class="fas fa-chevron-right"></i></div>'
            + '</div>'
            // 星期头
            + '<div class="cc-weekdays"><div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div></div>'
            // 日历网格
            + '<div class="cc-grid">' + gridHTML + '</div>'
            // 筛选器
            + '<div class="cc-filters">' + filterHTML + '</div>'
            // 日期事件
            + '<div class="cc-events-header">'
            + '<span class="cc-events-date">' + selLabel + '</span>'
            + '<span class="cc-events-count">' + events.length + '个事件</span>'
            + '<button class="cc-add-btn" onclick="window._ccOpenAdd()"><i class="fas fa-plus"></i></button>'
            + '</div>'
            + '<div class="cc-events-list">' + eventsHTML + '</div>'
            + addFormHTML
            + '</div>';
    };

    // ====== 交互函数 ======
    window._ccSelectDay = function(ds) { ccSelectedDate = ds; renderCouple(); };
    window._ccPrevMonth = function() { ccMonth--; if (ccMonth < 0) { ccMonth = 11; ccYear--; } renderCouple(); };
    window._ccNextMonth = function() { ccMonth++; if (ccMonth > 11) { ccMonth = 0; ccYear++; } renderCouple(); };
    window._ccGoToday = function() { var now = new Date(); ccYear = now.getFullYear(); ccMonth = now.getMonth(); ccSelectedDate = _today(); renderCouple(); };
    window._ccToggleFilter = function(k) { ccFilters[k] = !ccFilters[k]; renderCouple(); };
    window._ccOpenAdd = function() { ccAddFormOpen = true; renderCouple(); };
    window._ccCloseAdd = function() { ccAddFormOpen = false; renderCouple(); };

    window._ccSaveShared = function() {
        var space = _sp();
        if (!space) return;
        _initCal(space);
        var title = ((document.getElementById('cc-add-event-title')||{}).value||'').trim();
        if (!title) { if (typeof toast === 'function') toast('请填写标题'); return; }
        var time = ((document.getElementById('cc-add-event-time')||{}).value||'').trim();
        var emoji = ((document.getElementById('cc-add-event-emoji')||{}).value||'📌').trim();
        var desc = ((document.getElementById('cc-add-event-desc')||{}).value||'').trim();
        var date = ccSelectedDate || _today();
        space.coupleCalendar.sharedEvents.push({
            id: 'cev_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
            title: title, time: time, emoji: emoji, desc: desc,
            date: date, creator: 'user', createdAt: Date.now()
        });
        if (typeof save === 'function') save();
        ccAddFormOpen = false;
        if (typeof toast === 'function') toast('已添加');
        renderCouple();
    };

    window._ccDeleteShared = function(id) {
        var space = _sp();
        if (!space || !space.coupleCalendar) return;
        space.coupleCalendar.sharedEvents = space.coupleCalendar.sharedEvents.filter(function(e){ return e.id !== id; });
        if (typeof save === 'function') save();
        renderCouple();
    };

    // 暴露数据聚合函数给生活中心调用
    window.getEventsForDay = getEventsForDay;
    window.getMonthDots = getMonthDots;

})();
