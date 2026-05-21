        // ==========================================
        // --- CALENDAR SYSTEM (日历系统) ---
        // ==========================================

        // Calendar state
        let calendarState = {
            year: new Date().getFullYear(),
            month: new Date().getMonth(), // 0-indexed
            selectedDate: null // 'YYYY-MM-DD'
        };

        // Built-in holidays database
        const BUILTIN_HOLIDAYS = [
            { name: '元旦', month: 1, day: 1, icon: '🎉', type: 'holiday' },
            { name: '情人节', month: 2, day: 14, icon: '💕', type: 'holiday' },
            { name: '妇女节', month: 3, day: 8, icon: '🌸', type: 'holiday' },
            { name: '植树节', month: 3, day: 12, icon: '🌳', type: 'holiday' },
            { name: '愚人节', month: 4, day: 1, icon: '🤡', type: 'holiday' },
            { name: '劳动节', month: 5, day: 1, icon: '💪', type: 'holiday' },
            { name: '青年节', month: 5, day: 4, icon: '🔥', type: 'holiday' },
            { name: '母亲节', month: 5, day: 0, icon: '🌹', type: 'holiday', weekday: { week: 2, day: 0 } }, // 5月第2个周日
            { name: '儿童节', month: 6, day: 1, icon: '🧒', type: 'holiday' },
            { name: '父亲节', month: 6, day: 0, icon: '👔', type: 'holiday', weekday: { week: 3, day: 0 } }, // 6月第3个周日
            { name: '建党节', month: 7, day: 1, icon: '🇨🇳', type: 'holiday' },
            { name: '七夕', month: 8, day: 0, icon: '🌌', type: 'holiday', lunar: true, lunarMonth: 7, lunarDay: 7 },
            { name: '建军节', month: 8, day: 1, icon: '⭐', type: 'holiday' },
            { name: '教师节', month: 9, day: 10, icon: '📚', type: 'holiday' },
            { name: '国庆节', month: 10, day: 1, icon: '🇨🇳', type: 'holiday' },
            { name: '万圣节', month: 10, day: 31, icon: '🎃', type: 'holiday' },
            { name: '光棍节', month: 11, day: 11, icon: '🛒', type: 'holiday' },
            { name: '感恩节', month: 11, day: 0, icon: '🦃', type: 'holiday', weekday: { week: 4, day: 4 } }, // 11月第4个周四
            { name: '平安夜', month: 12, day: 24, icon: '🌟', type: 'holiday' },
            { name: '圣诞节', month: 12, day: 25, icon: '🎄', type: 'holiday' },
            { name: '跨年夜', month: 12, day: 31, icon: '🎆', type: 'holiday' },
            // 农历节日用近似公历日期（每年会变，这里给出大致范围提示）
            { name: '春节', month: 1, day: 29, icon: '🧧', type: 'holiday', note: '农历正月初一，日期每年不同' },
            { name: '除夕', month: 1, day: 28, icon: '🏮', type: 'holiday', note: '农历腊月三十，日期每年不同' },
            { name: '元宵节', month: 2, day: 12, icon: '🏮', type: 'holiday', note: '农历正月十五，日期每年不同' },
            { name: '端午节', month: 6, day: 10, icon: '🐉', type: 'holiday', note: '农历五月初五，日期每年不同' },
            { name: '中秋节', month: 9, day: 17, icon: '🥮', type: 'holiday', note: '农历八月十五，日期每年不同' },
            { name: '重阳节', month: 10, day: 11, icon: '🏔️', type: 'holiday', note: '农历九月初九，日期每年不同' },
        ];

        // Get the actual date for weekday-based holidays (e.g., Mother's Day = 2nd Sunday of May)
        function getWeekdayHolidayDate(year, month, weekNum, weekDay) {
            const firstDay = new Date(year, month - 1, 1);
            let firstTarget = firstDay.getDay() <= weekDay
                ? 1 + (weekDay - firstDay.getDay())
                : 1 + (7 - firstDay.getDay() + weekDay);
            return firstTarget + (weekNum - 1) * 7;
        }

        // Get holidays for a specific month/year
        function getHolidaysForMonth(year, month) {
            // month is 0-indexed here
            const displayMonth = month + 1; // 1-indexed for matching
            const results = [];

            BUILTIN_HOLIDAYS.forEach(h => {
                if (h.month !== displayMonth) return;
                let day = h.day;
                if (h.weekday) {
                    day = getWeekdayHolidayDate(year, displayMonth, h.weekday.week, h.weekday.day);
                }
                if (day > 0) {
                    results.push({ ...h, day, dateStr: `${year}-${String(displayMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}` });
                }
            });

            return results;
        }

        // Get holidays for a specific date string 'YYYY-MM-DD'
        function getHolidaysForDate(dateStr) {
            const [y, m, d] = dateStr.split('-').map(Number);
            const monthHolidays = getHolidaysForMonth(y, m - 1);
            // Filter out hidden holidays
            const hidden = store.perception.hiddenHolidays || [];
            return monthHolidays.filter(h => h.day === d && !hidden.includes(h.name));
        }

        // Get custom special days for a specific date
        function getSpecialDaysForDate(dateStr) {
            if (!store.perception.specialDays) store.perception.specialDays = [];
            const [ty, tm, td] = dateStr.split('-').map(Number);
            return store.perception.specialDays.filter(s => {
                if (s.date === dateStr) return true;
                if (s.repeat) {
                    const [sy, sm, sd] = s.date.split('-').map(Number);
                    return sm === tm && sd === td;
                }
                return false;
            });
        }

        // Get all events for a specific date
        function getEventsForDate(dateStr) {
            const holidays = getHolidaysForDate(dateStr);
            const specials = getSpecialDaysForDate(dateStr);
            return { holidays, specials };
        }

        function renderCalendar() {
            const grid = document.getElementById('calendar-grid');
            const titleEl = document.getElementById('cal-month-title');
            const eventsEl = document.getElementById('calendar-events');
            if (!grid || !titleEl) return;

            const { year, month } = calendarState;
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

            // Use custom date if perception has one
            let displayYear = year;
            let displayMonth = month;
            if (store.perception.customDate && store.perception.dateVal) {
                const parts = store.perception.dateVal.split('-');
                if (parts.length >= 2) {
                    // Only override if calendar hasn't been manually navigated
                    // We use calendarState as the source of truth for navigation
                }
            }

            titleEl.textContent = `${displayYear}年${displayMonth + 1}月`;

            // Calculate calendar grid
            const firstDayOfMonth = new Date(displayYear, displayMonth, 1);
            const lastDayOfMonth = new Date(displayYear, displayMonth + 1, 0);
            const startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun
            const daysInMonth = lastDayOfMonth.getDate();
            const daysInPrevMonth = new Date(displayYear, displayMonth, 0).getDate();

            // Get holidays for this month
            const monthHolidays = getHolidaysForMonth(displayYear, displayMonth);
            // Filter out hidden holidays for calendar dot display
            const hidden = store.perception.hiddenHolidays || [];
            const visibleHolidays = monthHolidays.filter(h => !hidden.includes(h.name));
            const specialDays = (store.perception.specialDays || []).filter(s => {
                const [sy, sm] = s.date.split('-').map(Number);
                if (sy === displayYear && sm === displayMonth + 1) return true;
                if (s.repeat && sm === displayMonth + 1) return true;
                return false;
            });

            // Build holiday/special lookup by day number
            const holidayDays = new Set(visibleHolidays.map(h => h.day));
            const specialDayNums = new Set(specialDays.map(s => parseInt(s.date.split('-')[2])));

            let html = '';
            // Previous month trailing days
            for (let i = startDayOfWeek - 1; i >= 0; i--) {
                const d = daysInPrevMonth - i;
                html += `<div class="cal-day other-month">${d}</div>`;
            }

            // Current month days
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${displayYear}-${String(displayMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === calendarState.selectedDate;
                const hasHoliday = holidayDays.has(d);
                const hasSpecial = specialDayNums.has(d);

                let classes = 'cal-day';
                if (isToday) classes += ' today';
                if (isSelected) classes += ' selected';
                if (hasHoliday && hasSpecial) classes += ' has-both';
                else if (hasHoliday) classes += ' has-holiday';
                else if (hasSpecial) classes += ' has-special';

                const dot = (hasHoliday || hasSpecial) ? '<div class="cal-dot"></div>' : '';
                html += `<div class="${classes}" onclick="selectCalendarDate('${dateStr}')">${d}${dot}</div>`;
            }

            // Next month leading days
            const totalCells = startDayOfWeek + daysInMonth;
            const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
            for (let i = 1; i <= remaining; i++) {
                html += `<div class="cal-day other-month">${i}</div>`;
            }

            grid.innerHTML = html;

            // Render events for selected date or today
            const targetDate = calendarState.selectedDate || todayStr;
            renderCalendarEvents(targetDate);
        }

        function renderCalendarEvents(dateStr) {
            const eventsEl = document.getElementById('calendar-events');
            if (!eventsEl) return;

            const { holidays, specials } = getEventsForDate(dateStr);
            const [y, m, d] = dateStr.split('-').map(Number);
            const dateLabel = `${m}月${d}日`;

            if (holidays.length === 0 && specials.length === 0) {
                eventsEl.innerHTML = `<div class="cal-no-events">${dateLabel} 暂无事件</div>`;
                return;
            }

            let html = '';
            holidays.forEach(h => {
                html += `<div class="cal-event-item">
                    <div class="cal-event-dot holiday"></div>
                    <div class="cal-event-info">
                        <div class="cal-event-name">${h.icon} ${h.name}</div>
                        <div class="cal-event-date">${dateLabel}${h.note ? ' · ' + h.note : ''}</div>
                    </div>
                    <div class="cal-event-actions">
                        <i class="fas fa-edit" onclick="editHoliday('${dateStr}', '${h.name}')"></i>
                        <i class="fas fa-trash" onclick="deleteHoliday('${h.name}')"></i>
                    </div>
                </div>`;
            });

            specials.forEach((s, i) => {
                html += `<div class="cal-event-item">
                    <div class="cal-event-dot special"></div>
                    <div class="cal-event-info">
                        <div class="cal-event-name">${s.icon || '⭐'} ${s.name}</div>
                        <div class="cal-event-date">${dateLabel}${s.note ? ' · ' + s.note : ''}</div>
                    </div>
                    <div class="cal-event-actions">
                        <i class="fas fa-edit" onclick="editSpecialDay(${i}, '${dateStr}')"></i>
                        <i class="fas fa-trash" onclick="deleteSpecialDay('${s.id}')"></i>
                    </div>
                </div>`;
            });

            eventsEl.innerHTML = html;
        }

        function selectCalendarDate(dateStr) {
            calendarState.selectedDate = dateStr;
            renderCalendar();
            // Open date detail dialog
            openDateDetailDialog(dateStr);
        }

        function openDateDetailDialog(dateStr) {
            const [y, m, d] = dateStr.split('-').map(Number);
            const dateLabel = `${y}年${m}月${d}日`;
            const { holidays, specials } = getEventsForDate(dateStr);

            let holidayHtml = '';
            if (holidays.length > 0) {
                holidayHtml = `<div style="margin-bottom:12px;">
                    <div style="font-size:12px; color:#999; margin-bottom:6px;">📅 节日</div>
                    ${holidays.map(h => `<div style="display:flex; align-items:center; padding:8px 10px; background:#fff5f5; border-radius:8px; margin-bottom:4px;">
                        <span style="font-size:18px; margin-right:8px;">${h.icon}</span>
                        <span style="flex:1; font-size:14px; color:#333;">${h.name}</span>
                        ${h.note ? `<span style="font-size:11px; color:#999; margin-right:4px;">${h.note}</span>` : ''}
                        <span style="font-size:16px; color:#576b95; cursor:pointer; margin-left:8px;" onclick="editHoliday('${dateStr}', '${h.name}')"><i class="fas fa-edit"></i></span>
                        <span style="font-size:16px; color:#fa5151; cursor:pointer; margin-left:8px;" onclick="deleteHoliday('${h.name}');document.getElementById('modal-date-detail')?.remove();"><i class="fas fa-trash"></i></span>
                    </div>`).join('')}
                </div>`;
            }

            let specialHtml = '';
            if (specials.length > 0) {
                specialHtml = `<div style="margin-bottom:12px;">
                    <div style="font-size:12px; color:#999; margin-bottom:6px;">⭐ 特殊日子</div>
                    ${specials.map(s => `<div style="display:flex; align-items:center; padding:8px 10px; background:#fff8e1; border-radius:8px; margin-bottom:4px;">
                        <span style="font-size:18px; margin-right:8px;">${s.icon || '⭐'}</span>
                        <span style="flex:1; font-size:14px; color:#333;">${s.name}</span>
                        <span style="font-size:16px; color:#576b95; cursor:pointer; margin-left:8px;" onclick="editSpecialDayById('${s.id}')"><i class="fas fa-edit"></i></span>
                        <span style="font-size:16px; color:#fa5151; cursor:pointer; margin-left:8px;" onclick="deleteSpecialDay('${s.id}');document.getElementById('modal-date-detail')?.remove();"><i class="fas fa-trash"></i></span>
                    </div>`).join('')}
                </div>`;
            }

            let emptyHtml = '';
            if (holidays.length === 0 && specials.length === 0) {
                emptyHtml = `<div style="text-align:center; color:#ccc; padding:20px 0; font-size:14px;">这一天暂无事件</div>`;
            }

            const modalHtml = `
                <div class="modal-mask" id="modal-date-detail" style="display:flex;" onclick="if(event.target===this)this.remove()">
                    <div class="modal-box" style="max-width:340px; border-radius:16px; padding:20px;">
                        <div style="text-align:center; margin-bottom:15px;">
                            <div style="font-size:18px; font-weight:600; color:#333;">${dateLabel}</div>
                        </div>
                        ${holidayHtml}
                        ${specialHtml}
                        ${emptyHtml}
                        <button onclick="document.getElementById('modal-date-detail')?.remove(); openAddSpecialDayForDate('${dateStr}')" style="width:100%; padding:11px; border:none; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border-radius:10px; font-size:14px; cursor:pointer; margin-top:5px;">
                            <i class="fas fa-plus" style="margin-right:6px;"></i>添加特殊日子
                        </button>
                        <div style="text-align:center; margin-top:10px;">
                            <span onclick="document.getElementById('modal-date-detail')?.remove()" style="color:#999; font-size:13px; cursor:pointer;">关闭</span>
                        </div>
                    </div>
                </div>
            `;
            // Remove existing modal if any
            document.getElementById('modal-date-detail')?.remove();
            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
        }

        function openAddSpecialDayForDate(dateStr) {
            // Pre-fill the date in the add special day dialog
            const modalHtml = `
                <div class="modal-mask" id="modal-add-special-day" style="display:flex;">
                    <div class="modal-box">
                        <h3 style="margin-bottom:15px;">✨ 添加特殊日子</h3>
                        <div class="group-box">
                            <div class="form-cell">
                                <span class="form-label">名称</span>
                                <input id="special-day-name" class="form-val" placeholder="如：纪念日、生日..." style="text-align:right;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">日期</span>
                                <input id="special-day-date" type="date" class="form-val" value="${dateStr}" style="text-align:right;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">图标</span>
                                <input id="special-day-icon" class="form-val" placeholder="如：🎂 💕 🌟" value="⭐" style="text-align:right; width:60px;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">备注</span>
                                <input id="special-day-note" class="form-val" placeholder="可选" style="text-align:right;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">每年重复</span>
                                <label class="switch"><input type="checkbox" id="special-day-repeat" checked><span class="slider"></span></label>
                            </div>
                            <div class="form-cell">
                                <span class="form-label">节日问候</span>
                                <label class="switch"><input type="checkbox" id="special-day-greet"><span class="slider"></span></label>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; margin-top:15px;">
                            <button onclick="document.getElementById('modal-add-special-day').remove()" style="flex:1; padding:10px; border:none; background:#eee; border-radius:8px;">取消</button>
                            <button onclick="confirmAddSpecialDay()" style="flex:1; padding:10px; border:none; background:var(--primary); color:#fff; border-radius:8px;">添加</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
        }

        function editSpecialDayById(id) {
            const s = (store.perception.specialDays || []).find(x => x.id === id);
            if (!s) return;

            document.getElementById('modal-date-detail')?.remove();

            const modalHtml = `
                <div class="modal-mask" id="modal-edit-special-day" style="display:flex;">
                    <div class="modal-box">
                        <h3 style="margin-bottom:15px;">✏️ 编辑特殊日子</h3>
                        <div class="group-box">
                            <div class="form-cell">
                                <span class="form-label">名称</span>
                                <input id="edit-sd-name" class="form-val" value="${s.name}" style="text-align:right;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">日期</span>
                                <input id="edit-sd-date" type="date" class="form-val" value="${s.date}" style="text-align:right;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">图标</span>
                                <input id="edit-sd-icon" class="form-val" value="${s.icon || '⭐'}" style="text-align:right; width:60px;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">备注</span>
                                <input id="edit-sd-note" class="form-val" value="${s.note || ''}" style="text-align:right;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">每年重复</span>
                                <label class="switch"><input type="checkbox" id="edit-sd-repeat" ${s.repeat ? 'checked' : ''}><span class="slider"></span></label>
                            </div>
                            <div class="form-cell">
                                <span class="form-label">节日问候</span>
                                <label class="switch"><input type="checkbox" id="edit-sd-greet" ${s.greet ? 'checked' : ''}><span class="slider"></span></label>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; margin-top:15px;">
                            <button onclick="document.getElementById('modal-edit-special-day').remove()" style="flex:1; padding:10px; border:none; background:#eee; border-radius:8px;">取消</button>
                            <button onclick="confirmEditSpecialDay('${id}')" style="flex:1; padding:10px; border:none; background:var(--primary); color:#fff; border-radius:8px;">保存</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
        }

        function confirmEditSpecialDay(id) {
            const target = (store.perception.specialDays || []).find(x => x.id === id);
            if (!target) return;

            const name = document.getElementById('edit-sd-name').value.trim();
            if (!name) return toast('请输入名称');

            target.name = name;
            target.date = document.getElementById('edit-sd-date').value;
            target.icon = document.getElementById('edit-sd-icon').value.trim() || '⭐';
            target.note = document.getElementById('edit-sd-note').value.trim();
            target.repeat = document.getElementById('edit-sd-repeat').checked;
            target.greet = document.getElementById('edit-sd-greet').checked;

            save();
            document.getElementById('modal-edit-special-day').remove();
            renderCalendar();
            toast('已更新');
        }

        function calendarPrevMonth() {
            calendarState.month--;
            if (calendarState.month < 0) {
                calendarState.month = 11;
                calendarState.year--;
            }
            calendarState.selectedDate = null;
            renderCalendar();
        }

        function calendarNextMonth() {
            calendarState.month++;
            if (calendarState.month > 11) {
                calendarState.month = 0;
                calendarState.year++;
            }
            calendarState.selectedDate = null;
            renderCalendar();
        }

        function calendarGoToday() {
            const now = new Date();
            calendarState.year = now.getFullYear();
            calendarState.month = now.getMonth();
            calendarState.selectedDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
            renderCalendar();
        }

        function openAddSpecialDay() {
            const selectedDate = calendarState.selectedDate || `${calendarState.year}-${String(calendarState.month+1).padStart(2,'0')}-01`;

            const modalHtml = `
                <div class="modal-mask" id="modal-add-special-day" style="display:flex;">
                    <div class="modal-box">
                        <h3 style="margin-bottom:15px;">✨ 添加特殊日子</h3>
                        <div class="group-box">
                            <div class="form-cell">
                                <span class="form-label">名称</span>
                                <input id="special-day-name" class="form-val" placeholder="如：纪念日、生日..." style="text-align:right;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">日期</span>
                                <input id="special-day-date" type="date" class="form-val" value="${selectedDate}" style="text-align:right;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">图标</span>
                                <input id="special-day-icon" class="form-val" placeholder="如：🎂 💕 🌟" value="⭐" style="text-align:right; width:60px;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">备注</span>
                                <input id="special-day-note" class="form-val" placeholder="可选" style="text-align:right;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">每年重复</span>
                                <label class="switch"><input type="checkbox" id="special-day-repeat" checked><span class="slider"></span></label>
                            </div>
                            <div class="form-cell">
                                <span class="form-label">节日问候</span>
                                <label class="switch"><input type="checkbox" id="special-day-greet"><span class="slider"></span></label>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; margin-top:15px;">
                            <button onclick="document.getElementById('modal-add-special-day').remove()" style="flex:1; padding:10px; border:none; background:#eee; border-radius:8px;">取消</button>
                            <button onclick="confirmAddSpecialDay()" style="flex:1; padding:10px; border:none; background:var(--primary); color:#fff; border-radius:8px;">添加</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
        }

        function confirmAddSpecialDay() {
            const name = document.getElementById('special-day-name').value.trim();
            const date = document.getElementById('special-day-date').value;
            const icon = document.getElementById('special-day-icon').value.trim() || '⭐';
            const note = document.getElementById('special-day-note').value.trim();
            const repeat = document.getElementById('special-day-repeat').checked;
            const greet = document.getElementById('special-day-greet').checked;

            if (!name) return toast('请输入名称');
            if (!date) return toast('请选择日期');

            if (!store.perception.specialDays) store.perception.specialDays = [];
            store.perception.specialDays.push({
                id: 'sd_' + Date.now(),
                name, date, icon, note, repeat, greet
            });
            save();
            document.getElementById('modal-add-special-day').remove();
            renderCalendar();
            toast('特殊日子已添加');
        }

        function editSpecialDay(idx, dateStr) {
            const specials = getSpecialDaysForDate(dateStr);
            const s = specials[idx];
            if (!s) return;
            editSpecialDayById(s.id);
        }

        function deleteSpecialDay(id) {
            showConfirm('删除特殊日子', '确定要删除吗？', () => {
                store.perception.specialDays = (store.perception.specialDays || []).filter(s => s.id !== id);
                save();
                // Close any open date detail modal so stale data doesn't persist
                document.getElementById('modal-date-detail')?.remove();
                renderCalendar();
                // Also refresh the events list for the selected date
                if (calendarState.selectedDate) {
                    renderCalendarEvents(calendarState.selectedDate);
                }
                toast('已删除');
            });
        }

        function editHoliday(dateStr, holidayName) {
            const holiday = BUILTIN_HOLIDAYS.find(h => h.name === holidayName);
            if (!holiday) return toast('找不到该节日');

            document.getElementById('modal-date-detail')?.remove();

            const modalHtml = `
                <div class="modal-mask" id="modal-edit-holiday" style="display:flex;">
                    <div class="modal-box">
                        <h3 style="margin-bottom:15px;">✏️ 编辑节日</h3>
                        <div class="group-box">
                            <div class="form-cell">
                                <span class="form-label">名称</span>
                                <input id="edit-hd-name" class="form-val" value="${holiday.name}" style="text-align:right;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">日期</span>
                                <input id="edit-hd-date" type="date" class="form-val" value="${dateStr}" style="text-align:right;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">图标</span>
                                <input id="edit-hd-icon" class="form-val" value="${holiday.icon || '🎉'}" style="text-align:right; width:60px;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">备注</span>
                                <input id="edit-hd-note" class="form-val" value="${holiday.note || ''}" style="text-align:right;">
                            </div>
                            <div class="form-cell">
                                <span class="form-label">每年重复</span>
                                <label class="switch"><input type="checkbox" id="edit-hd-repeat" checked><span class="slider"></span></label>
                            </div>
                            <div class="form-cell">
                                <span class="form-label">节日问候</span>
                                <label class="switch"><input type="checkbox" id="edit-hd-greet" checked><span class="slider"></span></label>
                            </div>
                        </div>
                        <div style="font-size:12px; color:#999; padding:0 5px; margin-top:8px;">编辑后将转为自定义特殊日子，原节日将被隐藏</div>
                        <div style="display:flex; gap:10px; margin-top:15px;">
                            <button onclick="document.getElementById('modal-edit-holiday').remove()" style="flex:1; padding:10px; border:none; background:#eee; border-radius:8px;">取消</button>
                            <button onclick="confirmEditHoliday('${holidayName}')" style="flex:1; padding:10px; border:none; background:var(--primary); color:#fff; border-radius:8px;">保存</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
        }

        function confirmEditHoliday(originalName) {
            const name = document.getElementById('edit-hd-name').value.trim();
            if (!name) return toast('请输入名称');
            const date = document.getElementById('edit-hd-date').value;
            if (!date) return toast('请选择日期');

            // Hide the original holiday
            if (!store.perception.hiddenHolidays) store.perception.hiddenHolidays = [];
            if (!store.perception.hiddenHolidays.includes(originalName)) {
                store.perception.hiddenHolidays.push(originalName);
            }

            // Create a custom special day as replacement
            if (!store.perception.specialDays) store.perception.specialDays = [];
            store.perception.specialDays.push({
                id: 'sd_' + Date.now(),
                name: name,
                date: date,
                icon: document.getElementById('edit-hd-icon').value.trim() || '🎉',
                note: document.getElementById('edit-hd-note').value.trim(),
                repeat: document.getElementById('edit-hd-repeat').checked,
                greet: document.getElementById('edit-hd-greet').checked
            });

            save();
            document.getElementById('modal-edit-holiday').remove();
            renderCalendar();
            toast('已保存为自定义日子');
        }

        function deleteHoliday(holidayName) {
            showConfirm('隐藏节日', `确定要隐藏「${holidayName}」吗？可在日历设置中恢复。`, () => {
                if (!store.perception.hiddenHolidays) store.perception.hiddenHolidays = [];
                if (!store.perception.hiddenHolidays.includes(holidayName)) {
                    store.perception.hiddenHolidays.push(holidayName);
                }
                save();
                renderCalendar();
                toast('已隐藏');
            });
        }

        function openCalendarSettings() {
            const greetEnabled = store.perception.calendarGreetEnabled !== false;
            const modalHtml = `
                <div class="modal-mask" id="modal-calendar-settings" style="display:flex;">
                    <div class="modal-box">
                        <h3 style="margin-bottom:15px;"><i class="fas fa-cog" style="margin-right:6px;"></i>日历设置</h3>
                        <div class="group-box">
                            <div class="form-cell">
                                <span class="form-label">节日自动问候</span>
                                <label class="switch"><input type="checkbox" id="cal-greet-toggle" ${greetEnabled ? 'checked' : ''}><span class="slider"></span></label>
                            </div>
                            <div class="form-cell" style="flex-direction:column; align-items:stretch;">
                                <span class="form-label" style="margin-bottom:6px;">问候说明</span>
                                <div style="font-size:12px; color:#888; line-height:1.6;">
                                    开启后，当日期为节日或你标记的特殊日子时，联系人会在聊天中自动发送节日问候消息。
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; margin-top:15px;">
                            <button onclick="document.getElementById('modal-calendar-settings').remove()" style="flex:1; padding:10px; border:none; background:#eee; border-radius:8px;">取消</button>
                            <button onclick="saveCalendarSettings()" style="flex:1; padding:10px; border:none; background:var(--primary); color:#fff; border-radius:8px;">保存</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
        }

        function saveCalendarSettings() {
            store.perception.calendarGreetEnabled = document.getElementById('cal-greet-toggle').checked;
            save();
            document.getElementById('modal-calendar-settings').remove();
            toast('日历设置已保存');
        }

        // --- Holiday Auto-Greeting System ---
        function checkAndSendHolidayGreetings() {
            if (!store.perception.master) return;
            if (store.perception.calendarGreetEnabled === false) return;

            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

            // Avoid sending multiple times per day
            if (store.perception._lastGreetDate === todayStr) return;

            const { holidays, specials } = getEventsForDate(todayStr);
            const greetableSpecials = specials.filter(s => s.greet);
            const allEvents = [...holidays, ...greetableSpecials];

            if (allEvents.length === 0) return;

            // Mark as sent for today
            store.perception._lastGreetDate = todayStr;
            save();

            // Send greetings from contacts
            const contacts = (store.contacts || []).filter(c => !c.isGroup);
            if (contacts.length === 0) return;

            const eventNames = allEvents.map(e => `${e.icon || ''} ${e.name}`).join('、');

            contacts.forEach(contact => {
                // Only greet from contacts that have chat history or are pinned
                const hasHistory = store.chats && store.chats[contact.id] && store.chats[contact.id].length > 0;
                const isPinned = contact.pinned;
                if (!hasHistory && !isPinned) return;

                // Random chance (not all contacts greet every time)
                if (Math.random() > 0.4) return;

                // Generate greeting asynchronously
                setTimeout(() => {
                    generateHolidayGreeting(contact, eventNames, todayStr);
                }, 2000 + Math.random() * 10000);
            });
        }

        async function generateHolidayGreeting(contact, eventNames, dateStr) {
            try {
                const userName = getUserPersonaName(contact, '你');
                const data = await API.chatCompletion([
                    { role: 'system', content: `你是${contact.name}。人设：${contact.persona || '一个朋友'}。今天是${eventNames}。请给${userName}发一条简短的节日问候消息（10-30字），要符合你的性格和说话风格。只输出消息内容，不要任何标签。` },
                    { role: 'user', content: '发送节日问候' }
                ], 0.85);

                const greeting = (data.choices[0].message.content || '').trim().substring(0, 60);
                if (!greeting) return;

                // Add to chat history as an AI message
                if (!store.chats[contact.id]) store.chats[contact.id] = [];
                store.chats[contact.id].push({
                    sender: 'ai',
                    type: 'text',
                    content: greeting,
                    time: Date.now()
                });
                save();

            } catch(e) {
                console.error('Holiday greeting failed for', contact.name, e);
            }
        }

        // Run greeting check on load (with delay)
        setTimeout(() => {
            try { checkAndSendHolidayGreetings(); } catch(e) { console.error('Greeting check error:', e); }
        }, 5000);

        function selectClimate(c) {
            store.perception.climateVal = c; 
            save(); 
            renderPerception(); 
            document.getElementById('modal-picker').style.display='none';
        }
        function picker(type) {
            if(type==='climate') {
                const opts = ['热带雨林','热带草原','热带沙漠','亚热带季风','地中海','温带海洋','温带季风','温带大陆','极地'];
                const p = document.getElementById('modal-picker');
                const l = document.getElementById('picker-list');
                document.getElementById('picker-title').innerText = "选择气候";
                l.innerHTML = opts.map(o=>`<div class="list-item" onclick="selectClimate('${o}')">${o}</div>`).join('');
                p.style.display='flex';
            }}

        // --- CHECK PHONE LANGUAGE DETECTION ---
        // [新增] 从联系人persona/settings中检测语言，用于外语联系人查手机生成外语内容
        function detectContactLanguage(contact) {
            if (!contact) return { lang: 'zh', langName: '中文', langNameEn: 'Chinese', isForeign: false, locale: 'CN' };
            // 优先使用手动设置的语言
            if (contact.settings && contact.settings.phoneLanguage) {
                var manual = contact.settings.phoneLanguage;
                var map = {
                    'ja': { lang:'ja', langName:'日语', langNameEn:'Japanese', isForeign:true, locale:'JP' },
                    'ko': { lang:'ko', langName:'韩语', langNameEn:'Korean', isForeign:true, locale:'KR' },
                    'en': { lang:'en', langName:'英语', langNameEn:'English', isForeign:true, locale:'US' },
                    'fr': { lang:'fr', langName:'法语', langNameEn:'French', isForeign:true, locale:'FR' },
                    'ru': { lang:'ru', langName:'俄语', langNameEn:'Russian', isForeign:true, locale:'RU' },
                    'es': { lang:'es', langName:'西班牙语', langNameEn:'Spanish', isForeign:true, locale:'ES' },
                    'de': { lang:'de', langName:'德语', langNameEn:'German', isForeign:true, locale:'DE' },
                    'th': { lang:'th', langName:'泰语', langNameEn:'Thai', isForeign:true, locale:'TH' },
                    'it': { lang:'it', langName:'意大利语', langNameEn:'Italian', isForeign:true, locale:'IT' },
                    'pt': { lang:'pt', langName:'葡萄牙语', langNameEn:'Portuguese', isForeign:true, locale:'BR' },
                    'ar': { lang:'ar', langName:'阿拉伯语', langNameEn:'Arabic', isForeign:true, locale:'SA' },
                    'zh': { lang:'zh', langName:'中文', langNameEn:'Chinese', isForeign:false, locale:'CN' }
                };
                if (map[manual]) return map[manual];
            }
            // [FIX-全英文] 自动检测：从persona和名字推断，但需要至少命中2个关键词才判定为外语
            // 之前只要命中1个就判定，导致人设里随便提一句"会说英语"就全变英文
            var p = ((contact.persona || '') + ' ' + (contact.name || '')).toLowerCase();
            var langRules = [
                { keys:['日本','japanese','日语','东京','大阪','にほん','京都','横浜','anime','漫画家','声优'], strongKeys:['日本人','日本出身','来自日本','住在日本','日本籍'], lang:'ja', langName:'日语', langNameEn:'Japanese', locale:'JP' },
                { keys:['韩国','korean','韩语','首尔','한국','釜山','k-pop','kpop','偶像练习生'], strongKeys:['韩国人','来自韩国','住在韩国','韩国籍'], lang:'ko', langName:'韩语', langNameEn:'Korean', locale:'KR' },
                { keys:['美国','american','english','英国','british','英语','纽约','伦敦','洛杉矶','加州','texas','london','new york'], strongKeys:['美国人','英国人','来自美国','来自英国','住在美国','住在英国','美国籍','英国籍'], lang:'en', langName:'英语', langNameEn:'English', locale:'US' },
                { keys:['法国','french','法语','巴黎','français','marseille','lyon'], strongKeys:['法国人','来自法国','住在法国','法国籍'], lang:'fr', langName:'法语', langNameEn:'French', locale:'FR' },
                { keys:['俄罗斯','russian','俄语','莫斯科','圣彼得堡','москва'], strongKeys:['俄罗斯人','来自俄罗斯','住在俄罗斯'], lang:'ru', langName:'俄语', langNameEn:'Russian', locale:'RU' },
                { keys:['西班牙','spanish','西语','墨西哥','马德里','barcelona'], strongKeys:['西班牙人','来自西班牙','住在西班牙'], lang:'es', langName:'西班牙语', langNameEn:'Spanish', locale:'ES' },
                { keys:['德国','german','德语','柏林','慕尼黑','berlin','münchen'], strongKeys:['德国人','来自德国','住在德国','德国籍'], lang:'de', langName:'德语', langNameEn:'German', locale:'DE' },
                { keys:['泰国','thai','泰语','曼谷','清迈','bangkok'], strongKeys:['泰国人','来自泰国','住在泰国'], lang:'th', langName:'泰语', langNameEn:'Thai', locale:'TH' },
                { keys:['意大利','italian','意语','罗马','米兰','roma','milano'], strongKeys:['意大利人','来自意大利','住在意大利'], lang:'it', langName:'意大利语', langNameEn:'Italian', locale:'IT' },
                { keys:['葡萄牙','巴西','portuguese','brazilian','里斯本','圣保罗'], strongKeys:['葡萄牙人','巴西人','来自巴西','来自葡萄牙'], lang:'pt', langName:'葡萄牙语', langNameEn:'Portuguese', locale:'BR' },
                { keys:['阿拉伯','arabic','迪拜','沙特','阿联酋','dubai'], strongKeys:['阿拉伯人','来自沙特','来自迪拜'], lang:'ar', langName:'阿拉伯语', langNameEn:'Arabic', locale:'SA' }
            ];
            for (var i = 0; i < langRules.length; i++) {
                var rule = langRules[i];
                // 强关键词：命中1个即可判定（如"日本人"、"来自美国"）
                var hasStrong = (rule.strongKeys || []).some(function(k) { return p.indexOf(k) > -1; });
                if (hasStrong) {
                    return { lang: rule.lang, langName: rule.langName, langNameEn: rule.langNameEn, isForeign: true, locale: rule.locale };
                }
                // 弱关键词：需要命中至少2个才判定（防止"会说英语"就全变英文）
                var matchCount = rule.keys.reduce(function(count, k) { return count + (p.indexOf(k) > -1 ? 1 : 0); }, 0);
                if (matchCount >= 2) {
                    return { lang: rule.lang, langName: rule.langName, langNameEn: rule.langNameEn, isForeign: true, locale: rule.locale };
                }
            }
            return { lang: 'zh', langName: '中文', langNameEn: 'Chinese', isForeign: false, locale: 'CN' };
        }
        window._detectContactLanguage = detectContactLanguage;

        // 本地化配置：不同语言的运营商、银行、平台等
        var PHONE_LOCALE_CONFIG = {
            'JP': {
                carriers: ['docomo','au','SoftBank'],
                banks: ['三菱UFJ銀行','みずほ銀行','三井住友銀行','ゆうちょ銀行'],
                platforms: ['Amazon.co.jp','楽天市場','メルカリ','Yahoo!ショッピング'],
                deliveries: ['ヤマト運輸','佐川急便','日本郵便'],
                searchEngine: 'Google/Yahoo! Japan',
                chatApp: 'LINE',
                currency: '¥',
                smsExamples: '例: [SMS:10:30|docomo|今月のデータ使用量は8.5GBです|service|true]'
            },
            'KR': {
                carriers: ['SKT','KT','LG U+'],
                banks: ['국민은행','신한은행','하나은행','우리은행'],
                platforms: ['쿠팡','네이버쇼핑','11번가','G마켓'],
                deliveries: ['CJ대한통운','한진택배','롯데택배'],
                searchEngine: 'Naver/Google',
                chatApp: 'KakaoTalk',
                currency: '₩',
                smsExamples: '예: [SMS:10:30|국민은행|고객님의 계좌에서 50,000원이 출금되었습니다|bank|true]'
            },
            'US': {
                carriers: ['AT&T','Verizon','T-Mobile'],
                banks: ['Chase','Bank of America','Wells Fargo','Citibank'],
                platforms: ['Amazon','Walmart','Target','eBay'],
                deliveries: ['UPS','FedEx','USPS'],
                searchEngine: 'Google',
                chatApp: 'iMessage/WhatsApp',
                currency: '$',
                smsExamples: 'e.g. [SMS:10:30|Chase|Your account ending in 8888 had a transaction of $50.00|bank|true]'
            },
            'FR': {
                carriers: ['Orange','SFR','Bouygues','Free'],
                banks: ['BNP Paribas','Société Générale','Crédit Agricole'],
                platforms: ['Amazon.fr','Cdiscount','Fnac','Vinted'],
                deliveries: ['La Poste','Chronopost','DPD'],
                searchEngine: 'Google',
                chatApp: 'WhatsApp/Messenger',
                currency: '€',
                smsExamples: 'ex: [SMS:10:30|Orange|Votre forfait data est à 80% de consommation|service|true]'
            },
            'RU': {
                carriers: ['МТС','Билайн','Мегафон','Tele2'],
                banks: ['Сбербанк','ВТБ','Тинькофф','Альфа-Банк'],
                platforms: ['Wildberries','Ozon','Яндекс.Маркет'],
                deliveries: ['СДЭК','Почта России','Boxberry'],
                searchEngine: 'Яндекс/Google',
                chatApp: 'Telegram/WhatsApp',
                currency: '₽',
                smsExamples: 'напр: [SMS:10:30|Сбербанк|Списание 5000₽ с карты *8888|bank|true]'
            },
            'DE': {
                carriers: ['Telekom','Vodafone','O2'],
                banks: ['Deutsche Bank','Commerzbank','Sparkasse'],
                platforms: ['Amazon.de','Otto','Zalando','eBay.de'],
                deliveries: ['DHL','Hermes','DPD'],
                searchEngine: 'Google',
                chatApp: 'WhatsApp',
                currency: '€',
                smsExamples: 'z.B. [SMS:10:30|Deutsche Bank|Abbuchung von 50,00€ von Konto *8888|bank|true]'
            },
            'ES': {
                carriers: ['Movistar','Vodafone','Orange'],
                banks: ['Santander','BBVA','CaixaBank'],
                platforms: ['Amazon.es','El Corte Inglés','AliExpress'],
                deliveries: ['Correos','SEUR','MRW'],
                searchEngine: 'Google',
                chatApp: 'WhatsApp',
                currency: '€',
                smsExamples: 'ej: [SMS:10:30|BBVA|Cargo de 50,00€ en cuenta *8888|bank|true]'
            },
            'TH': {
                carriers: ['AIS','DTAC','TrueMove H'],
                banks: ['กสิกรไทย','ไทยพาณิชย์','กรุงเทพ','กรุงไทย'],
                platforms: ['Shopee','Lazada','JD Central'],
                deliveries: ['Kerry Express','Flash Express','Thailand Post'],
                searchEngine: 'Google',
                chatApp: 'LINE',
                currency: '฿',
                smsExamples: 'เช่น: [SMS:10:30|กสิกรไทย|บัญชี *8888 ถูกหักเงิน 500 บาท|bank|true]'
            },
            'CN': {
                carriers: ['10086','10010','10000'],
                banks: ['工商银行','建设银行','招商银行','农业银行'],
                platforms: ['淘宝','京东','拼多多','抖音商城'],
                deliveries: ['菜鸟驿站','顺丰','中通','韵达'],
                searchEngine: '百度/Google',
                chatApp: '微信',
                currency: '¥',
                smsExamples: '例: [SMS:10:30|95588|您尾号8888的储蓄卡于4月15日支出500.00元|bank|true]'
            }
        };
        // 默认兜底
        ['IT','BR','SA'].forEach(function(loc) {
            if (!PHONE_LOCALE_CONFIG[loc]) PHONE_LOCALE_CONFIG[loc] = PHONE_LOCALE_CONFIG['US'];
        });

        // [优化-免费翻译] 按需翻译函数：改用Google Translate免费API，不消耗LLM额度
        async function translatePhoneItem(itemKey, originalText) {
            if (!store.phoneData) return originalText;
            if (!store.phoneData._translations) store.phoneData._translations = {};
            if (store.phoneData._translations[itemKey]) return store.phoneData._translations[itemKey];
            try {
                // 使用免费Google Translate代理（与聊天翻译相同）
                var resp = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: originalText, target: 'zh-CN' })
                });
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var data = await resp.json();
                var result = (data.translated || '').trim() || '[翻译失败]';
                store.phoneData._translations[itemKey] = result;
                save();
                return result;
            } catch(e) {
                console.error('翻译失败:', e);
                return '[翻译失败]';
            }
        }
        window.translatePhoneItem = translatePhoneItem;

        // 点击翻译按钮的处理
        window.togglePhoneTranslation = async function(btn, itemKey, originalText) {
            var tlEl = btn.nextElementSibling;
            if (tlEl && tlEl.classList.contains('phone-tl-text')) {
                tlEl.classList.toggle('show');
                if (tlEl.classList.contains('show') && tlEl.textContent === '翻译中...') {
                    var result = await translatePhoneItem(itemKey, originalText);
                    tlEl.textContent = result;
                }
                return;
            }
        };

        // [批量翻译] 查手机页面级批量翻译：一次翻译当前菜单页面所有内容
        window.batchTranslatePhonePage = async function(btnEl) {
            if (!store.phoneData) return;
            if (!store.phoneData._translations) store.phoneData._translations = {};
            // 收集当前页面所有未翻译的项
            var allBtns = document.querySelectorAll('.phone-tl-btn');
            var needTranslate = [];
            var btnMap = []; // {btn, tlEl, itemKey, originalText}
            allBtns.forEach(function(b) {
                var tlEl = b.nextElementSibling;
                if (!tlEl || !tlEl.classList.contains('phone-tl-text')) return;
                var onclick = b.getAttribute('onclick') || '';
                var match = onclick.match(/togglePhoneTranslation\(this,'([^']+)','([^']+)'\)/);
                if (!match) return;
                var itemKey = match[1];
                var originalText = match[2].replace(/\\n/g, '\n').replace(/\\'/g, "'");
                // 跳过已有缓存的
                if (store.phoneData._translations[itemKey]) {
                    tlEl.textContent = store.phoneData._translations[itemKey];
                    tlEl.classList.add('show');
                    return;
                }
                needTranslate.push({ btn: b, tlEl: tlEl, itemKey: itemKey, originalText: originalText });
            });
            if (needTranslate.length === 0) {
                // 全部已缓存，直接展开所有
                allBtns.forEach(function(b) {
                    var tlEl = b.nextElementSibling;
                    if (tlEl && tlEl.classList.contains('phone-tl-text')) tlEl.classList.add('show');
                });
                if (typeof toast === 'function') toast('全部已翻译（缓存）');
                return;
            }
            // 显示loading
            if (btnEl) { btnEl.textContent = '翻译中...'; btnEl.disabled = true; }
            needTranslate.forEach(function(item) {
                item.tlEl.textContent = '翻译中...';
                item.tlEl.classList.add('show');
            });
            try {
                // 合并所有文本为1次API调用
                var SEPARATOR = '\n⟦⟧\n';
                var texts = needTranslate.map(function(item) { return item.originalText; });
                var combined = texts.join(SEPARATOR);
                var resp = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: combined, target: 'zh-CN', batch: true })
                });
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var data = await resp.json();
                var translated = data.translated || '';
                var parts = translated.split(/⟦⟧|⟦ ⟧|\[⟧\]|⟦\]|【⟧】/);
                // 写入缓存并显示
                for (var i = 0; i < needTranslate.length; i++) {
                    var result = (parts[i] || '').trim() || '[翻译失败]';
                    store.phoneData._translations[needTranslate[i].itemKey] = result;
                    needTranslate[i].tlEl.textContent = result;
                }
                save();
                if (typeof toast === 'function') toast('翻译完成（' + needTranslate.length + '条）');
            } catch(e) {
                console.error('批量翻译失败:', e);
                needTranslate.forEach(function(item) { item.tlEl.textContent = '[翻译失败]'; });
                if (typeof toast === 'function') toast('翻译失败: ' + (e.message || '网络错误'));
            } finally {
                if (btnEl) { btnEl.textContent = '📖 一键翻译本页'; btnEl.disabled = false; }
            }
        };

        // [批量翻译] 在查手机页面顶部注入"一键翻译本页"按钮（仅外语联系人显示）
        function _injectPhoneBatchTranslateBtn(containerId) {
            if (!store.phoneData || !store.phoneData._langInfo || !store.phoneData._langInfo.isForeign) return;
            var container = document.getElementById(containerId);
            if (!container) return;
            // 避免重复注入
            if (container.querySelector('.phone-batch-tl-btn')) return;
            var btn = document.createElement('div');
            btn.className = 'phone-batch-tl-btn';
            btn.style.cssText = 'text-align:center;padding:8px 0 4px;';
            btn.innerHTML = '<button onclick="batchTranslatePhonePage(this)" style="padding:6px 18px;border:1px solid #666;background:rgba(255,255,255,0.08);color:#aaa;border-radius:16px;font-size:12px;cursor:pointer;"><i class="fas fa-language" style="margin-right:4px;"></i>📖 一键翻译本页</button>';
            container.insertBefore(btn, container.firstChild);
        }

        // 渲染带翻译的内容项
        function renderWithTranslation(originalText, itemKey, inlineTl) {
            if (!store.phoneData._langInfo || !store.phoneData._langInfo.isForeign) return escapeHtml(originalText);
            // 如果AI生成时已内联翻译 [TL:xxx]
            if (inlineTl) {
                return '<span>' + escapeHtml(originalText) + '</span>' +
                    '<div class="phone-tl-btn" onclick="this.nextElementSibling.classList.toggle(\'show\')">' +
                    '<i class="fas fa-language"></i> 译</div>' +
                    '<div class="phone-tl-text">' + escapeHtml(inlineTl) + '</div>';
            }
            // 按需翻译模式
            var safeKey = (itemKey || '').replace(/'/g, "\\'");
            var safeText = (originalText || '').replace(/'/g, "\\'").replace(/\n/g, '\\n');
            return '<span>' + escapeHtml(originalText) + '</span>' +
                '<div class="phone-tl-btn" onclick="togglePhoneTranslation(this,\'' + safeKey + '\',\'' + safeText + '\')">' +
                '<i class="fas fa-language"></i> 译</div>' +
                '<div class="phone-tl-text">翻译中...</div>';
        }
        window._renderWithTranslation = renderWithTranslation;

        // --- CHECK PHONE DEEP CONTEXT ---
        // [新增] 构建查手机的深度上下文，关联人设、聊天记录、全局记忆
        function buildPhoneContext(contactId) {
            const contact = (store.contacts || []).find(c => c.id === contactId);
            if (!contact) return { chatTopics: '', memoryHighlights: '', existingData: '', deceasedHints: '' };
            const userName = (typeof getUserPersonaName === 'function')
                ? getUserPersonaName(contact, store.user.name || '用户')
                : (store.user.name || '用户');
            // 1. 最近聊天记录摘要
            let chatTopics = '';
            const chats = (store.chats && store.chats[contactId]) || [];
            const recent = chats.slice(-20);
            if (recent.length > 0) {
                chatTopics = recent.map(m => {
                    const sender = m.sender === 'me' ? userName : contact.name;
                    return sender + ': ' + ((m.content || '') + '').substring(0, 50);
                }).join('\n');
            }
            // 2. 全局记忆关键事件（增加到600字符以包含更多关键信息）
            let memoryHighlights = '';
            if (typeof buildContactGlobalMemory === 'function') {
                try {
                    const rawMem = buildContactGlobalMemory(contactId, { sections: ['memory', 'relation', 'couple'] });
                    if (rawMem) memoryHighlights = rawMem.substring(0, 600);
                } catch(_) {}
            }
            // [FIX-已故人物] 3. 从人设和记忆中提取已故/去世相关信息
            let deceasedHints = '';
            try {
                const persona = (contact.persona || '').toLowerCase();
                const memLower = (memoryHighlights || '').toLowerCase();
                const chatLower = chatTopics.toLowerCase();
                const allText = persona + ' ' + memLower + ' ' + chatLower;
                // 检测去世/死亡相关关键词
                const deathKeywords = ['去世', '过世', '离世', '死了', '死亡', '不在了', '走了', '天堂', '逝世', '亡故',
                    'passed away', 'died', 'death', 'deceased', 'lost', 'heaven', 'rest in peace', 'rip',
                    '丧事', '葬礼', '追悼', '忌日', '周年祭'];
                const familyKeywords = ['母亲', '妈妈', '妈', '父亲', '爸爸', '爸', '爷爷', '奶奶', '外公', '外婆',
                    '哥哥', '姐姐', '弟弟', '妹妹', '叔叔', '阿姨', '舅舅',
                    'mother', 'mom', 'father', 'dad', 'grandfather', 'grandmother', 'brother', 'sister'];
                const foundDeathRefs = [];
                for (const dk of deathKeywords) {
                    const idx = allText.indexOf(dk);
                    if (idx >= 0) {
                        // 在死亡关键词附近查找家庭成员关键词
                        const nearby = allText.substring(Math.max(0, idx - 30), Math.min(allText.length, idx + 30));
                        for (const fk of familyKeywords) {
                            if (nearby.includes(fk)) {
                                foundDeathRefs.push(fk);
                            }
                        }
                    }
                }
                if (foundDeathRefs.length > 0) {
                    deceasedHints = '⚠️ DECEASED PERSONS (DO NOT generate as contacts): ' + [...new Set(foundDeathRefs)].join(', ');
                }
            } catch(_) {}
            // 4. 已生成的手机数据（交叉引用）
            let existingData = '';
            if (store.phoneData && Array.isArray(store.phoneData.contacts) && store.phoneData.contacts.length > 0) {
                existingData += '通讯录: ' + store.phoneData.contacts.map(c => c.name).join('、') + '\n';
            }
            if (store.phoneData && Array.isArray(store.phoneData.memo) && store.phoneData.memo.length > 0) {
                existingData += '备忘录: ' + store.phoneData.memo.map(m => m.title).join('、') + '\n';
            }
            if (store.phoneData && Array.isArray(store.phoneData.sms) && store.phoneData.sms.length > 0) {
                existingData += '短信发件人: ' + [...new Set(store.phoneData.sms.map(s => s.sender))].join('、') + '\n';
            }
            return { userName, persona: contact.persona || '', chatTopics, memoryHighlights, existingData, deceasedHints };
        }

        // [FIX-类型守卫v9] 统一归一化函数：将所有应为数组的 phoneData 字段强制转为 Array
        // 解决持久化数据被污染为对象（如 {"0":{...}} ）时 .map/.filter 报 TypeError 的问题
        function _normalizePhoneDataArrays(pd) {
            if (!pd) return;
            var arrayFields = ['contacts', 'memo', 'usage', 'search', 'shopping', 'interests', 'sms', 'photos', 'calllog', 'location', 'deleted'];
            for (var i = 0; i < arrayFields.length; i++) {
                var key = arrayFields[i];
                if (pd[key] && !Array.isArray(pd[key])) {
                    // 尝试将类数组对象转为真数组
                    try {
                        var vals = Object.values(pd[key]);
                        pd[key] = vals.length > 0 ? vals : [];
                    } catch(_e) {
                        pd[key] = [];
                    }
                    console.warn('[PhoneData] 归一化字段 ' + key + ' 从对象转为数组');
                } else if (!pd[key]) {
                    pd[key] = [];
                }
            }
        }

        // [FIX-数据完整性v1] 深度校验并修复 phoneData 结构，防止持久化数据损坏导致后续流程崩溃
        function _validateAndRepairPhoneData(pd, contactName) {
            if (!pd || typeof pd !== 'object') return false;
            var repaired = false;
            // 1. chats 必须是纯对象（非数组/null/其他类型）
            if (!pd.chats || typeof pd.chats !== 'object' || Array.isArray(pd.chats)) {
                console.warn('[PhoneData] chats字段类型异常(' + typeof pd.chats + ')，重置为空对象. 联系人:', contactName);
                pd.chats = {};
                repaired = true;
            }
            // 2. chats 中每个 key 的值必须是有效数组，且数组元素必须有 content 字段
            if (pd.chats) {
                var chatKeys = Object.keys(pd.chats);
                for (var i = 0; i < chatKeys.length; i++) {
                    var ck = chatKeys[i];
                    var chatArr = pd.chats[ck];
                    if (!Array.isArray(chatArr)) {
                        console.warn('[PhoneData] chats["' + ck + '"]不是数组，删除. 联系人:', contactName);
                        delete pd.chats[ck];
                        repaired = true;
                    } else {
                        // 过滤掉损坏的消息条目（缺少 content 或 content 非字符串）
                        var validMsgs = chatArr.filter(function(msg) {
                            return msg && typeof msg === 'object' && (typeof msg.content === 'string' || typeof msg.sender === 'string');
                        });
                        if (validMsgs.length < chatArr.length) {
                            console.warn('[PhoneData] chats["' + ck + '"]有' + (chatArr.length - validMsgs.length) + '条损坏消息，已清理. 联系人:', contactName);
                            pd.chats[ck] = validMsgs;
                            repaired = true;
                        }
                    }
                }
            }
            // 3. contacts 数组中每个元素必须有 name 字段
            if (Array.isArray(pd.contacts)) {
                var validContacts = pd.contacts.filter(function(c) {
                    return c && typeof c === 'object' && typeof c.name === 'string' && c.name.trim().length > 0;
                });
                if (validContacts.length < pd.contacts.length) {
                    console.warn('[PhoneData] contacts有' + (pd.contacts.length - validContacts.length) + '条损坏条目，已清理. 联系人:', contactName);
                    pd.contacts = validContacts;
                    repaired = true;
                }
            }
            // 4. _langInfo 如果存在但格式错误就删除
            if (pd._langInfo && typeof pd._langInfo !== 'object') {
                delete pd._langInfo;
                repaired = true;
            }
            // 5. assets 字段如果不是对象也不是 null，重置
            if (pd.assets !== null && pd.assets !== undefined && typeof pd.assets !== 'object') {
                pd.assets = null;
                repaired = true;
            }
            // 6. manager 字段如果不是对象也不是 null，重置
            if (pd.manager !== null && pd.manager !== undefined && typeof pd.manager !== 'object') {
                pd.manager = null;
                repaired = true;
            }
            if (repaired) {
                console.warn('[PhoneData] 联系人"' + contactName + '"的手机数据已修复');
            }
            return true;
        }

        // [FIX-清除缓存v1] 清除指定联系人的查手机缓存数据，解决数据损坏后无法恢复的问题
        function clearPhoneDataForContact(name) {
            if (!name) return;
            if (store.phoneDataMap && store.phoneDataMap[name]) {
                delete store.phoneDataMap[name];
                // 如果当前正在查看该联系人，也重置 store.phoneData
                if (activeCheckPhoneContactName === name) {
                    store.phoneData = { contacts:[], memo:[], usage:[], search:[], chats:{}, shopping:[], interests:[], assets:null, sms:[], photos:[], calllog:[], location:[], deleted:[], manager:null };
                    store.phoneDataMap[name] = store.phoneData;
                }
                save();
                toast('已清除 ' + name + ' 的手机缓存数据，可重新生成');
            } else {
                toast('该联系人没有缓存数据');
            }
        }

        // --- CHECK PHONE CORE ---
        async function aiGeneratePhone(type, context, skipLoading) {
            if (!skipLoading) document.getElementById('loading').style.display = 'block';
            // 记录发起请求时的联系人名，用于防止切换联系人后数据错乱
            const requestForContact = activeCheckPhoneContactName;
            try {
                let sysPrompt = "You are a system generating realistic content for a simulated 'Phone Check' game.";
                let prompt = "";
                let targetName = activeCheckPhoneContactName || "Someone";
                
                let targetC = null;
                if (activeCheckPhoneContactName) {
                    targetC = store.contacts.find(x => x.name === activeCheckPhoneContactName);
                } else if (store.couple.partnerId) {
                    targetC = store.contacts.find(x => x.id === store.couple.partnerId);
                }
                
                let worldBookContent = 'None';
                if (targetC) {
                    sysPrompt += ` Target Persona: ${targetC.name}, ${targetC.persona}.`;
                    targetName = targetC.name;
                    
                    // Add Worldbook context
                    try {
                        if (targetC.settings?.mountedWbIds && Array.isArray(targetC.settings.mountedWbIds)) {
                            const mountedBooks = (store.worldbooks || []).filter(wb => targetC.settings.mountedWbIds.includes(wb.id));
                            if (mountedBooks.length > 0) {
                                worldBookContent = mountedBooks.map(wb => `[${wb.name}]:\n${wb.content}`).join('\n\n');
                            }
                        }
                    } catch(_wbErr) { console.warn('[worldbook] 获取世界书失败:', _wbErr); }
                }

            const userName = getUserPersonaName(targetC, store.user.name || '用户');
            
            // [新增] 语言检测 + 本地化配置
            const _langInfo = detectContactLanguage(targetC);
            // [FIX-引用同步v7] 确保 phoneData 通过 phoneDataMap 引用，不会脱钩产生孤立对象
            if (!store.phoneDataMap) store.phoneDataMap = {};
            if (!store.phoneDataMap[requestForContact]) {
                store.phoneDataMap[requestForContact] = { contacts:[], memo:[], usage:[], search:[], chats:{}, shopping:[], interests:[], assets:null, sms:[], photos:[], calllog:[], location:[], deleted:[], manager:null };
            }
            // [FIX-数据完整性v1] 在 AI 生成前校验并修复已有数据，防止损坏数据导致后续流程崩溃
            _normalizePhoneDataArrays(store.phoneDataMap[requestForContact]);
            _validateAndRepairPhoneData(store.phoneDataMap[requestForContact], requestForContact);
            store.phoneData = store.phoneDataMap[requestForContact];
            store.phoneData._langInfo = _langInfo;
            const _locale = PHONE_LOCALE_CONFIG[_langInfo.locale] || PHONE_LOCALE_CONFIG['CN'];
            const _isForeign = _langInfo.isForeign;
            const _langEn = _langInfo.langNameEn;
            const _langZh = _langInfo.langName;
            // 动态语言指令：外语联系人用外语生成+附带中文翻译标签
            const _langInstruction = _isForeign
                ? `Use ${_langEn} as the PRIMARY language for ALL generated content (this character is a native ${_langEn} speaker living in a ${_langEn}-speaking country). ALL names, places, brands, services must be authentic to that locale. After EACH tagged item, append a [TL:中文翻译] tag with Chinese translation of the content. The chat app on their phone would be ${_locale.chatApp}, NOT WeChat.`
                : 'Use Chinese.';
            const _localeSmsHint = _isForeign
                ? `Use local carriers (${_locale.carriers.join('/')}), banks (${_locale.banks.join('/')}), delivery services (${_locale.deliveries.join('/')}). Currency: ${_locale.currency}. ${_locale.smsExamples}`
                : '';
            const _localeShopHint = _isForeign
                ? `Use local platforms (${_locale.platforms.join('/')}). Currency: ${_locale.currency}.`
                : '';
            
            // [新增-深度关联] 构建查手机深度上下文
            // [FIX-防御v1] buildPhoneContext 可能因持久化数据损坏抛异常，包裹 try-catch 防止整个生成流程中断
            let _phoneCtx = { chatTopics: '', memoryHighlights: '', existingData: '', deceasedHints: '' };
            if (targetC) {
                try {
                    _phoneCtx = buildPhoneContext(targetC.id);
                } catch(_ctxErr) {
                    console.warn('[CheckPhone] buildPhoneContext失败，使用空上下文. 联系人:', requestForContact, '错误:', _ctxErr?.message || _ctxErr);
                }
            }
            let _deepContextBlock = '';
            if (_phoneCtx.chatTopics) {
                _deepContextBlock += `\n\n[RECENT CHAT HISTORY between ${targetName} and ${userName} - USE these topics as reference]:\n${_phoneCtx.chatTopics.substring(0, 500)}`;
            }
            // [FIX-已故人物] 注入已故人物警告到上下文
            if (_phoneCtx.deceasedHints) {
                _deepContextBlock += `\n\n${_phoneCtx.deceasedHints}`;
            }
            if (_phoneCtx.memoryHighlights) {
                _deepContextBlock += `\n\n[KEY MEMORIES & RELATIONSHIP]:\n${_phoneCtx.memoryHighlights.substring(0, 350)}`;
            }
            if (_phoneCtx.existingData) {
                _deepContextBlock += `\n\n[ALREADY GENERATED PHONE DATA - cross-reference for consistency]:\n${_phoneCtx.existingData.substring(0, 250)}`;
            }
            
            // [FIX-prompt过长] 限制世界书和深度上下文块的长度，防止特定联系人数据过大
            const _safeWorldBook = (worldBookContent || 'None').substring(0, 800);
            const _safeDeepCtx = (_deepContextBlock || '').substring(0, 1200);
            const userRelatedContext = `Your responses must feel authentic to the character you are playing, not like a machine. You must read the character's persona, world book, and chat history to inform your reply. World Book Context: ${_safeWorldBook}. IMPORTANT: At least one or two of the generated items MUST be related to "${userName}" (the user playing the game). For example, a chat log with "${userName}" should be included.${_safeDeepCtx}

CRITICAL DEEP-LINKING RULES:
1. ALL generated content must be consistent with ${targetName}'s persona (personality, job, hobbies, speech style)
2. If recent chats mention specific events/plans/topics (e.g. travel, argument, date), these MUST appear in the generated data
3. Cross-reference: memos can mention contacts, search history can relate to chat topics, SMS can reference recent events
4. ${targetName}'s social circle should match their persona background`;

            if(type === 'contacts') prompt = `Generate 8 realistic contact names for ${targetName}'s phone. These should be people in ${targetName}'s life (e.g. ${_isForeign ? 'Mom, Boss, Colleague, Delivery guy' : 'Mom, Boss, Colleague, Delivery'}). Do NOT include "${userName}" as a contact (the user/player will be added separately). Ensure NO contact is named "${targetName}" (the phone owner) or "Me" or "我" or "${userName}". The contacts should be appropriate for ${targetName}'s persona (age, gender, role) and cultural background. ${_langInstruction} ${userRelatedContext}

CRITICAL: If the character's backstory, memories, or chat history mentions that a family member or friend has PASSED AWAY, DIED, or is DECEASED, do NOT generate that person as a contact. Dead people should NOT appear in the phone's contact list. Check the persona and memory context carefully for any mentions of death, passing, or loss before generating family contacts.

Format: [CONTACT:Name]${_isForeign ? ' [TL:中文翻译]' : ''}`;
            
            if(type === 'chat') {
                if (context === userName) return true;
                // 根据联系人名称推断关系类型，确保生成内容符合人设
                const relationshipHints = {
                    '妈': '母子/母女关系，语气亲切温暖，聊家常、关心健康饮食、叮嘱注意身体',
                    '爸': '父子/父女关系，语气稳重关怀，聊工作生活、给予建议鼓励',
                    '母亲': '母子/母女关系，语气亲切温暖，聊家常、关心健康饮食',
                    '父亲': '父子/父女关系，语气稳重关怀，聊工作生活',
                    'Mom': '母子/母女关系，语气亲切温暖',
                    'Dad': '父子/父女关系，语气稳重关怀',
                    '老板': '上下级工作关系，语气正式礼貌，聊工作任务进度',
                    'Boss': '上下级工作关系，语气正式礼貌',
                    '同事': '同事关系，语气随和，聊工作和日常',
                    '老师': '师生关系，语气尊敬有礼',
                    '闺蜜': '好友关系，语气亲密随意，聊八卦日常',
                    '兄弟': '好友/兄弟关系，语气豪爽直接',
                    '哥': '兄弟/兄妹关系，语气亲近',
                    '姐': '姐弟/姐妹关系，语气亲近',
                    '弟': '兄弟/姐弟关系，语气关爱',
                    '妹': '兄妹/姐妹关系，语气关爱',
                    '室友': '室友关系，聊生活琐事',
                    '外卖': '服务关系，简短沟通',
                    '快递': '服务关系，简短沟通',
                    '医生': '医患关系，聊健康问题',
                };
                let relationshipDesc = '';
                for (const [keyword, desc] of Object.entries(relationshipHints)) {
                    if (context.includes(keyword)) {
                        relationshipDesc = desc;
                        break;
                    }
                }
                const relationshipGuide = relationshipDesc
                    ? `\n\nIMPORTANT RELATIONSHIP CONTEXT: "${context}" is ${relationshipDesc}. The chat tone and content MUST match this relationship. Do NOT generate romantic, flirtatious, or ambiguous content for non-romantic relationships. ${targetName} should speak to ${context} in a way that is appropriate for their relationship.`
                    : `\n\nIMPORTANT: Infer the likely relationship between ${targetName} and "${context}" from the contact name. The chat tone MUST match the inferred relationship (e.g., family=warm/caring, boss=formal/polite, friend=casual). Do NOT default to romantic or ambiguous tone. ${targetName} should speak appropriately for the relationship.`;
                
                prompt = `Generate a realistic ${_isForeign ? _locale.chatApp : 'WeChat'} chat log on ${targetName}'s phone between ${targetName} ('Me') and '${context}' (Them). 8-15 messages. The content must reflect ${targetName}'s persona and their specific relationship with ${context}.${relationshipGuide}\nAvoid mentioning ${userName}. ${_langInstruction} Format: [MSG:Time|Sender|Content]${_isForeign ? ' [TL:中文翻译]' : ''}`;
            }

            // [FIX-批量聊天v7] 新增 batch_chats：一次API调用生成所有联系人的聊天记录
            if(type === 'batch_chats') {
                const contactNames = (context || '').split(',').map(n => n.trim()).filter(Boolean);
                if (contactNames.length === 0) {
                    if (!skipLoading) document.getElementById('loading').style.display = 'none';
                    return true;
                }
                prompt = `Generate realistic ${_isForeign ? _locale.chatApp : 'WeChat'} chat logs on ${targetName}'s phone for ALL of the following contacts in ONE response. For each contact, generate 8-12 messages.

Contacts to generate chats for: ${contactNames.join(', ')}

CRITICAL FORMAT: Use [CHAT_START:ContactName] and [CHAT_END:ContactName] to wrap each contact's chat log. Inside each section, use [MSG:Time|Sender|Content] format. The "Sender" should be either "Me" (for ${targetName}) or the contact's name.

Example:
[CHAT_START:Mom]
[MSG:09:15|Mom|今天记得吃早饭]
[MSG:09:16|Me|知道了妈]
[MSG:09:20|Mom|晚上回来吃饭吗]
[CHAT_END:Mom]
[CHAT_START:Boss]
[MSG:10:00|Boss|报告交了没？]
[MSG:10:02|Me|马上发您]
[CHAT_END:Boss]

IMPORTANT RULES:
1. Each contact's chat tone and content MUST match the likely relationship (family=warm, boss=formal, friend=casual, delivery=brief)
2. ${targetName} speaks as "Me" in all chats
3. Do NOT generate romantic/ambiguous content for non-romantic relationships
4. Avoid mentioning ${userName}
5. Generate for ALL ${contactNames.length} contacts, do not skip any
${_langInstruction} ${userRelatedContext}`;
            }
            
            if(type === 'memo') prompt = `Generate 8 realistic phone memos for ${targetName}. Use FIRST PERSON perspective (as ${targetName}). When mentioning ${userName}, use their name "${userName}".

IMPORTANT REQUIREMENTS:
- Each memo Content MUST be 200-600 characters long, detailed and realistic
- Date format MUST be time only (e.g. "14:30", "09:15"), NO year/month/day
- CRITICAL: Do NOT use square brackets [ ] inside the Content field! Use parentheses () or other punctuation instead. The brackets are used as format delimiters and will break parsing if used inside content.
- ${_langInstruction}
- Format: [MEMO:Title|Time|Content]${_isForeign ? ' [TL:标题中文翻译|内容中文翻译]' : ''}
- Each [MEMO:...] tag MUST be on a single line, do NOT break it across multiple lines

The memos MUST cover diverse types like a real person's notes app:
1. To-do lists / plans
2. Shopping lists
3. Random notes / inspiration
4. Account/password reminders
5. Schedule reminders
6. Study/work notes
7. Emotional diary / feelings
8. Recipes / life tips

Make each memo feel authentic - include specific details, numbers, names. Some memos should be messy/casual like real quick notes, others more organized like lists.${_isForeign ? ' All content must be in ' + _langEn + ' as this is a native speaker.' : ''}`;
            
            if(type === 'search') prompt = `Generate 8 realistic browser search histories for ${targetName}. Use THIRD PERSON perspective for descriptions if needed. Include recent timestamps (last 24h). Each search result MUST include a full article content (200-400 characters) that the user clicked and read. ${_langInstruction}${_isForeign ? ' Use ' + (_locale.searchEngine || 'Google') + ' as the search engine context.' : ''} Format: [SEARCH:Time|Query|ResultTitle|ResultDesc|ClickReason|ArticleContent]${_isForeign ? ' [TL:查询翻译|标题翻译|描述翻译]' : ''}. The ArticleContent should be a realistic full article snippet that ${targetName} would have read.`;
            
            if(type === 'usage') prompt = `Generate a daily digital footprint timeline for ${targetName}. Use THIRD PERSON perspective. e.g. "${targetName} opened ${_isForeign ? _locale.chatApp : 'WeChat'}", "${targetName} charged the phone". Do NOT use "I" or "Me". 8-12 items. ${_langInstruction} Format: [USE:Time|Type(App/Sys)|Description]${_isForeign ? ' [TL:中文翻译]' : ''}`;
            
            if(type === 'shopping') prompt = `Generate shopping data for ${targetName}. Include TWO categories:
1. Today's purchases (2-4 items, things bought today): [SHOP:ItemName|Platform|Price|Reason]${_isForeign ? ' [TL:物品翻译|平台|价格|原因翻译]' : ''}
2. Favorites/wishlist (2-4 items, things saved/favorited but not yet bought): [FAV:ItemName|Platform|Price|Reason]${_isForeign ? ' [TL:物品翻译|平台|价格|原因翻译]' : ''}
Based on their persona and interests. ${userRelatedContext} ${_langInstruction} ${_localeShopHint}`;
            
            if(type === 'interests') prompt = `Generate 8-12 interest keywords or tags for ${targetName}, derived from their recent chats and browsing. ${userRelatedContext} ${_langInstruction} Format: [INT:Keyword|Heat(1-10)|Evidence]${_isForeign ? ' [TL:关键词翻译|证据翻译]' : ''}`;

            if(type === 'assets') prompt = `Generate a comprehensive financial asset profile for ${targetName} based on their persona. Include ALL of the following categories. ${_langInstruction} Be realistic based on the character's background and locale.${_isForeign ? ' Use local banks (' + _locale.banks.join('/') + '), local stock markets, local currency (' + _locale.currency + '), and local addresses.' : ''}

Format requirements (use EXACTLY these tags):
1. Wallet balance: [WALLET:BalanceAmount]
2. Stock holdings (2-4 stocks): [STOCK:StockName|Shares|CurrentPrice|ProfitOrLoss]
3. Fund/financial products (1-3): [FUND:FundName|Type|InvestedAmount|CurrentValue]
4. Bank cards (2-4 cards): [CARD:BankName|CardType|LastFourDigits|Balance]
5. Real estate (0-3 properties): [HOUSE:Address|Type|Area(sqm)|EstimatedValue]
6. Vehicles (0-2 cars): [CAR:Brand|Model|Year|EstimatedValue]${_isForeign ? '\n\nAfter ALL asset data, add: [TL_ASSETS:资产中文摘要（银行名、地址等关键信息的翻译）]' : ''}`;

            if(type === 'sms') prompt = `Generate 15-20 realistic SMS messages for ${targetName}'s phone inbox. ${_langInstruction}

Generate a MIX of these SMS types to simulate a real phone:
1. Personal messages (3-5): from contacts in their phone (friends, family, colleagues)
2. Bank/financial SMS (2-3): account notifications, transactions
3. Delivery/logistics SMS (2-3): package tracking, pickup codes
4. Verification codes (1-2): OTP codes from apps
5. Spam/marketing SMS (2-3): loan offers, real estate ads
6. Platform notifications (2-3): food delivery, ride-hailing, subscriptions
7. Carrier SMS (1): data usage, plan changes

${_isForeign ? 'LOCALE REQUIREMENTS: ' + _localeSmsHint : ''}
Each SMS must feel authentic. Personal messages should reflect ${targetName}'s social circle and persona.
${userRelatedContext}

Format: [SMS:Time|Sender|Content|Type(personal/bank/delivery/verification/spam/promotion/service)|Read(true/false)]${_isForeign ? ' [TL:发件人翻译|内容中文翻译]' : ''}
${_isForeign ? '' : `Example:
[SMS:10:30|95588|您尾号8888的储蓄卡于4月15日支出500.00元，余额12580.00元|bank|true]
[SMS:09:15|妈妈|今天降温了记得多穿点，别感冒了|personal|true]
[SMS:14:22|1065XXXX|恭喜您！您已获得最高20万借款额度，点击领取|spam|false]`}`;

            if(type === 'photos') prompt = `Generate 8-12 realistic photo descriptions from ${targetName}'s phone gallery. These are photos taken or saved recently. ${_langInstruction} ${userRelatedContext}

Include a MIX of photo types:
1. Selfies (1-2): mirror selfies, with friends, casual
2. Food photos (1-2): meals, cafe visits, cooking
3. Scenery/travel (1-2): landscapes, city views
4. Screenshots (1-2): funny chats, memes, articles
5. Random life (2-3): pets, objects, workspace, outfit
6. People (1-2): group photo, couple photo, family

Format: [PHOTO:Time|Type(selfie/food/scenery/screenshot/life/people)|Description|Location]${_isForeign ? ' [TL:描述翻译|地点翻译]' : ''}`;

            if(type === 'calllog') prompt = `Generate 10-15 realistic phone call log entries for ${targetName}. ${_langInstruction} ${userRelatedContext}

Include a MIX of call types:
1. Incoming answered (3-5): from contacts
2. Outgoing (3-4): to contacts, services
3. Missed calls (2-3): important ones
4. Rejected (1-2): spam or awkward contacts

Some calls should be to/from contacts in their phone. Include call duration in seconds (0 for missed/rejected).

Format: [CALL:Time|Name|Type(incoming/outgoing/missed/rejected)|DurationSeconds]${_isForeign ? ' [TL:名字翻译]' : ''}`;

            if(type === 'location') prompt = `Generate 6-10 location history entries for ${targetName}'s recent day. These are places visited today based on GPS data. ${_langInstruction} ${userRelatedContext}

Include realistic locations matching their persona:
1. Home (1): morning/evening
2. Work/school (1-2): daytime
3. Transit (1-2): commute
4. Leisure (1-2): cafe, restaurant, gym, park
5. Errands (1-2): convenience store, pharmacy, mall

Format: [LOC:Time|PlaceName|Category(home/work/transit/food/shopping/leisure/other)|Address|DurationMinutes]${_isForeign ? ' [TL:地名翻译|地址翻译]' : ''}`;

            if(type === 'deleted') prompt = `Generate 4-6 recently deleted items from ${targetName}'s phone. These are things they INTENTIONALLY deleted - each should hint at something they want to hide or feel embarrassed about. ${_langInstruction} ${userRelatedContext}

Include a MIX of deleted types:
1. Deleted chat messages (1-2): messages they regret sending or received
2. Deleted photos (1-2): unflattering selfies, screenshots of embarrassing searches, photos with certain people
3. Deleted memos/notes (1): private thoughts, plans they changed their mind about
4. Deleted search history (1): embarrassing or suspicious searches

Each item should make the reader curious about WHY it was deleted. Some should relate to "${userName}".

Format: [DEL:Type(chat/photo/memo/search)|DeletedTime|OriginalTime|Preview|PossibleReason]${_isForeign ? ' [TL:预览翻译|原因翻译]' : ''}`;

            if(type === 'manager') prompt = `Generate a comprehensive phone manager/system report for ${targetName}'s phone. ${_langInstruction}

Generate ALL of the following:
1. Storage: [STORAGE:UsedGB|TotalGB]
2. Storage breakdown by category (5-7 items): [STORAGE_CAT:Category|SizeGB|FileCount]
   Categories: Apps, Photos, Videos, Music, Documents, Cache, System, Other
3. Battery info: [BATTERY:CurrentPercent|ScreenOnTimeMinutes|EstimatedRemainingMinutes]
4. Top 5 apps by usage time today: [APP_TIME:AppName|MinutesToday|Category]
5. Top 5 apps by storage: [APP_SIZE:AppName|SizeMB]
6. RAM usage: [RAM:UsedGB|TotalGB]
7. Network usage today: [NETWORK:WiFiMB|MobileMB]

Make values realistic for the character's lifestyle. A gamer would have large game apps, a photographer would have huge photo storage, etc.
${userRelatedContext}`;

                // [FIX-prompt长度] 限制prompt总长度，防止特定联系人数据过大导致API请求失败
                const _maxPromptLen = 6000;
                if (prompt.length > _maxPromptLen) {
                    console.warn('[CheckPhone] prompt过长(' + prompt.length + '字)，截断到' + _maxPromptLen);
                    prompt = prompt.substring(0, _maxPromptLen) + '\n...[内容过长已自动精简]';
                }
                if (sysPrompt.length > 2000) {
                    console.warn('[CheckPhone] sysPrompt过长(' + sysPrompt.length + '字)，截断到2000');
                    sysPrompt = sysPrompt.substring(0, 2000) + '\n...[内容过长已自动精简]';
                }
                const data = await API.chatCompletion([{role:'system', content:sysPrompt}, {role:'user', content:prompt}], { scene: 'checkphone' });
                // [FIX-TypeError] 使用 Array.isArray 严格检查 choices，防止非数组对象的 .length 引发 TypeError
                if (!data || !Array.isArray(data.choices) || data.choices.length === 0) {
                    console.error('[CheckPhone] API返回结构异常:', JSON.stringify(data || {}).substring(0, 300));
                    throw new Error("API_PARSE_ERROR");
                }
                const _rawContent = data.choices[0].message.content;
                if (!_rawContent || _rawContent.trim().length === 0) {
                    console.error('[CheckPhone] API返回空内容');
                    throw new Error("API_EMPTY_RESPONSE");
                }
                // Post-process: replace {{user}} templates with actual userName
                const text = _rawContent.replace(/\{\{user\}\}/gi, userName);

                // 检查联系人是否已切换，如果已切换则丢弃过期数据
                if (requestForContact !== activeCheckPhoneContactName) {
                    console.log('Phone data discarded: contact switched during generation');
                    if (!skipLoading) document.getElementById('loading').style.display = 'none';
                    return false;
                }

                // [FIX-竞态安全v7] 所有数据写入使用 phoneDataMap[requestForContact] 而非 store.phoneData
                // 这样即使 store.phoneData 在异步期间被切换引用，数据也写到正确的联系人下
                const _targetPD = store.phoneDataMap[requestForContact];
                if (!_targetPD) {
                    console.warn('[CheckPhone] phoneDataMap[' + requestForContact + '] 不存在，丢弃数据');
                    if (!skipLoading) document.getElementById('loading').style.display = 'none';
                    return false;
                }
                // [FIX-归一化v10] 异步API返回后再次归一化，防止等待期间数据被并发操作篡改/清除导致字段undefined
                _normalizePhoneDataArrays(_targetPD);

                if(type === 'contacts') {
                    _targetPD.contacts = Array.from(text.matchAll(/\[CONTACT:(.*?)\]/g), m => ({name: m[1].trim()}));
                    // [FIX-容错解析v6] 标准格式匹配失败时，尝试宽松匹配（逐行提取看起来像联系人名的内容）
                    if (!Array.isArray(_targetPD.contacts) || _targetPD.contacts.length === 0) {
                        console.warn('[CheckPhone] 标准CONTACT格式解析失败，尝试宽松匹配。原文:', text.substring(0, 200));
                        // 宽松匹配1: CONTACT: Name（无方括号）
                        const _looseMatches = Array.from(text.matchAll(/CONTACT\s*[:：]\s*(.+)/gi), m => ({name: m[1].replace(/[\[\]]/g, '').trim()}));
                        if (_looseMatches.length > 0) {
                            _targetPD.contacts = _looseMatches;
                        } else {
                            // 宽松匹配2: 编号列表格式（如 "1. 妈妈" "- Boss"）
                            const _listMatches = Array.from(text.matchAll(/(?:^|\n)\s*(?:\d+[\.\)、]|-|•)\s*(.{1,20})/g), m => ({name: m[1].trim()}));
                            if (_listMatches.length >= 3) {
                                _targetPD.contacts = _listMatches;
                            }
                        }
                    }
                    // [FIX-类型守卫v7] 确保 contacts 一定是数组
                    if (!Array.isArray(_targetPD.contacts)) _targetPD.contacts = [];
                    // [FIX-重复用户] 在数据层面过滤掉与用户名相同的条目（真实用户条目会在renderPhoneContacts中手动置顶添加）
                    if (userName) {
                        _targetPD.contacts = _targetPD.contacts.filter(c => {
                            const n = (c.name || '').trim();
                            if (n === userName || n === targetName || n === '我' || n === 'Me' || n === '用户' || n === 'User') return false;
                            // 模糊匹配变体名
                            if (userName.length >= 2 && (n.includes(userName) || userName.includes(n))) return false;
                            return true;
                        });
                    }
                    if(_targetPD.contacts.length===0) {
                        console.warn('[CheckPhone] 联系人解析最终为空，使用兜底数据');
                        _targetPD.contacts = [{name:'Mom'},{name:'Ex'},{name:'Boss'}];
                    }
                }
                if(type === 'chat') {
                    if (!_targetPD.chats) _targetPD.chats = {};
                    _targetPD.chats[context] = Array.from(text.matchAll(/\[MSG:(.*?)\|(.*?)\|(.*?)\]/g), m => ({time:m[1], sender:m[2], content:m[3]}));
                    // [FIX-容错解析v6] 聊天记录标准格式匹配失败时，尝试宽松匹配
                    if (!_targetPD.chats[context] || _targetPD.chats[context].length === 0) {
                        console.warn('[CheckPhone] 标准MSG格式解析失败，尝试宽松匹配');
                        // 宽松匹配: "时间 名字: 内容" 或 "名字 时间 内容"
                        const _looseMsgs = Array.from(text.matchAll(/(?:^|\n)\s*(\d{1,2}:\d{2})\s*[|\s]\s*(.+?)\s*[|\s]\s*(.+)/g), m => ({time:m[1], sender:m[2].trim(), content:m[3].trim()}));
                        if (_looseMsgs.length > 0) {
                            _targetPD.chats[context] = _looseMsgs;
                        }
                    }
                }
                // [FIX-批量聊天v7] 新增 batch_chats 类型：一次API调用生成所有联系人的聊天记录
                if(type === 'batch_chats') {
                    if (!_targetPD.chats) _targetPD.chats = {};
                    const _knownContacts = (Array.isArray(_targetPD.contacts) ? _targetPD.contacts : []).map(c => c.name);
                    // 按 [CHAT_START:Name] ... [CHAT_END:Name] 分段解析
                    const chatSections = text.matchAll(/\[CHAT_START:(.*?)\]([\s\S]*?)\[CHAT_END:\1\]/gi);
                    let _parsedCount = 0;
                    for (const section of chatSections) {
                        const contactName = section[1].trim();
                        const chatBlock = section[2];
                        const msgs = Array.from(chatBlock.matchAll(/\[MSG:(.*?)\|(.*?)\|(.*?)\]/g), m => ({time:m[1], sender:m[2], content:m[3]}));
                        if (msgs.length > 0) {
                            _targetPD.chats[contactName] = msgs;
                            _parsedCount++;
                        }
                    }
                    // [FIX-批量聊天v8] 多层宽松兜底，大幅提高解析成功率
                    if (_parsedCount < _knownContacts.length) {
                        console.warn('[CheckPhone] 标准CHAT_START/END格式只解析到 ' + _parsedCount + '/' + _knownContacts.length + '，尝试多层宽松匹配');
                        // 兜底1: 尝试 "===Name===" 或 "---Name---" 或 "## Name" 分隔符
                        if (_parsedCount === 0) {
                            for (const cn of _knownContacts) {
                                if (_targetPD.chats[cn] && _targetPD.chats[cn].length > 0) continue;
                                // 尝试找到该联系人名出现的区域，提取其附近的 [MSG] 标签
                                const escapedName = cn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const sectionRegex = new RegExp('(?:===\\s*' + escapedName + '\\s*===|---+\\s*' + escapedName + '\\s*---*|#{1,3}\\s*' + escapedName + '\\s*$|\\[CHAT_START:\\s*' + escapedName + '\\s*\\])', 'im');
                                const sectionMatch = sectionRegex.exec(text);
                                if (sectionMatch) {
                                    const startIdx = sectionMatch.index + sectionMatch[0].length;
                                    // 找到下一个联系人分隔符或文本结尾
                                    const remainText = text.substring(startIdx);
                                    const nextSep = remainText.search(/(?:===\s*.+?\s*===|---+\s*.+?\s*---*|#{1,3}\s*.+\s*$|\[CHAT_START:)/m);
                                    const blockText = nextSep > 0 ? remainText.substring(0, nextSep) : remainText;
                                    const msgs = Array.from(blockText.matchAll(/\[MSG:(.*?)\|(.*?)\|(.*?)\]/g), m => ({time:m[1], sender:m[2], content:m[3]}));
                                    if (msgs.length > 0) {
                                        _targetPD.chats[cn] = msgs;
                                        _parsedCount++;
                                    }
                                }
                            }
                        }
                        // 兜底2: 直接按 [MSG] 全局提取，按 sender 名匹配联系人分组
                        if (_parsedCount < _knownContacts.length) {
                            const allMsgs = Array.from(text.matchAll(/\[MSG:(.*?)\|(.*?)\|(.*?)\]/g), m => ({time:m[1], sender:m[2].trim(), content:m[3]}));
                            if (allMsgs.length > 0) {
                                // 按 sender 归属到联系人
                                const _grouped = {};
                                for (const msg of allMsgs) {
                                    const senderName = msg.sender;
                                    if (/^me$/i.test(senderName)) continue; // "Me" 不能决定归属
                                    const matched = _knownContacts.find(cn => cn === senderName || cn.includes(senderName) || senderName.includes(cn));
                                    if (matched && !_targetPD.chats[matched]) {
                                        if (!_grouped[matched]) _grouped[matched] = [];
                                        _grouped[matched].push(msg);
                                    }
                                }
                                // 把 "Me" 消息分配给它前后最近的联系人消息组
                                let lastMapped = null;
                                for (const msg of allMsgs) {
                                    if (/^me$/i.test(msg.sender)) {
                                        if (lastMapped && _grouped[lastMapped]) _grouped[lastMapped].push(msg);
                                    } else {
                                        const matched = _knownContacts.find(cn => cn === msg.sender || cn.includes(msg.sender) || msg.sender.includes(cn));
                                        if (matched) lastMapped = matched;
                                    }
                                }
                                // 按时间排序并写入
                                for (const [cn, msgs] of Object.entries(_grouped)) {
                                    msgs.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
                                    _targetPD.chats[cn] = msgs;
                                    _parsedCount++;
                                }
                            }
                        }
                        // 兜底3: 无 [MSG] 标签，尝试按 "时间 sender: content" 纯文本格式解析
                        if (_parsedCount < _knownContacts.length) {
                            const _textMsgs = Array.from(text.matchAll(/(\d{1,2}:\d{2})\s*[|\s]\s*(.+?)\s*[:|：]\s*(.+)/g), m => ({time:m[1], sender:m[2].trim(), content:m[3].trim()}));
                            if (_textMsgs.length > 0) {
                                let _curContact = null;
                                let _curMsgs = [];
                                for (const msg of _textMsgs) {
                                    const matched = _knownContacts.find(cn => cn === msg.sender || cn.includes(msg.sender) || msg.sender.includes(cn));
                                    if (matched && matched !== _curContact) {
                                        if (_curContact && _curMsgs.length > 0 && !_targetPD.chats[_curContact]) {
                                            _targetPD.chats[_curContact] = _curMsgs;
                                            _parsedCount++;
                                        }
                                        _curContact = matched;
                                        _curMsgs = [msg];
                                    } else {
                                        _curMsgs.push(msg);
                                    }
                                }
                                if (_curContact && _curMsgs.length > 0 && !_targetPD.chats[_curContact]) {
                                    _targetPD.chats[_curContact] = _curMsgs;
                                    _parsedCount++;
                                }
                            }
                        }
                        console.log('[CheckPhone] 批量聊天最终解析: ' + _parsedCount + '/' + _knownContacts.length + ' 个联系人');
                    }
                }
                if(type === 'memo') {
                    // [FIX-备忘录v2] 使用 [\s\S] 替代 . 以匹配多行内容，用前瞻确保 ] 不在内容中间截断
                    _targetPD.memo = Array.from(text.matchAll(/\[MEMO:([^|\]]*)\|([^|\]]*)\|([\s\S]*?)\](?=\s*(?:\[MEMO:|\[TL:|\s*$))/g), m => ({title:m[1].trim(), date:m[2].trim(), content:m[3].trim()}));
                    // 兜底：如果前瞻匹配数量不足，回退到逐行匹配单行备忘录
                    if (_targetPD.memo.length < 3) {
                        console.warn('[CheckPhone] 备忘录前瞻解析只得到 ' + _targetPD.memo.length + ' 条，尝试宽松解析');
                        const _memoFallback = Array.from(text.matchAll(/\[MEMO:(.*?)\|(.*?)\|(.*?)\]/g), m => ({title:m[1].trim(), date:m[2].trim(), content:m[3].trim()}));
                        if (_memoFallback.length > _targetPD.memo.length) {
                            _targetPD.memo = _memoFallback;
                        }
                    }
                    // 兜底2: 尝试无标签纯文本解析（标题\n内容 格式）
                    if (_targetPD.memo.length < 3) {
                        const _memoLines = text.split(/\n/).filter(l => l.trim());
                        const _parsedMemos = [];
                        for (let li = 0; li < _memoLines.length; li++) {
                            // 匹配 "标题 | 时间" 或 "# 标题" 等格式
                            const _hdrMatch = _memoLines[li].match(/^(?:#\s*)?(.+?)\s*[|｜]\s*(\d{1,2}:\d{2})/);
                            if (_hdrMatch) {
                                let _body = '';
                                while (li + 1 < _memoLines.length && !_memoLines[li + 1].match(/^(?:#\s*)?(.+?)\s*[|｜]\s*\d{1,2}:\d{2}/) && !_memoLines[li + 1].match(/^\[MEMO:/)) {
                                    li++;
                                    _body += (_body ? '\n' : '') + _memoLines[li].trim();
                                }
                                _parsedMemos.push({ title: _hdrMatch[1].trim(), date: _hdrMatch[2], content: _body || _hdrMatch[1].trim() });
                            }
                        }
                        if (_parsedMemos.length > _targetPD.memo.length) {
                            _targetPD.memo = _parsedMemos;
                        }
                    }
                }
                if(type === 'search') {
                    _targetPD.search = Array.from(text.matchAll(/\[SEARCH:(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g), m => ({time:m[1], query:m[2], resultTitle:m[3], resultDesc:m[4], clickReason:m[5], articleContent:m[6]}));
                    if(_targetPD.search.length === 0) {
                        _targetPD.search = Array.from(text.matchAll(/\[SEARCH:(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g), m => ({time:m[1], query:m[2], resultTitle:m[3], resultDesc:m[4], clickReason:m[5], articleContent:''}));
                    }
                    if(_targetPD.search.length === 0) {
                        _targetPD.search = Array.from(text.matchAll(/\[SEARCH:(.*?)\|(.*?)\]/g), m => ({time:m[1], query:m[2], resultTitle:'搜索结果', resultDesc:'无详细预览', clickReason:'未知', articleContent:''}));
                    }
                }
                if(type === 'usage') {
                    _targetPD.usage = Array.from(text.matchAll(/\[USE:(.*?)\|(.*?)\|(.*?)\]/g), m => ({time:m[1], type:m[2], desc:m[3]}));
                }
                if(type === 'shopping') {
                    _targetPD.shopping = Array.from(text.matchAll(/\[SHOP:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g), m => ({item:m[1], platform:m[2], price:m[3], reason:m[4], type:'purchase'}));
                    const favs = Array.from(text.matchAll(/\[FAV:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g), m => ({item:m[1], platform:m[2], price:m[3], reason:m[4], type:'favorite'}));
                    _targetPD.shopping = [..._targetPD.shopping, ...favs];
                }
                if(type === 'interests') {
                    _targetPD.interests = Array.from(text.matchAll(/\[INT:(.*?)\|(.*?)\|(.*?)\]/g), m => ({keyword:m[1], heat:parseInt(m[2]), evidence:m[3]}));
                }
                if(type === 'assets') {
                    const assets = { wallet: 0, stocks: [], funds: [], cards: [], houses: [], cars: [] };
                    // [FIX-资产全0] 增强钱包余额解析：去除货币符号、逗号等干扰字符
                    // [FIX-资产全0v5] 支持欧洲数字格式（1.234,56 → 1234.56）
                    function _parseAssetNum(raw) {
                        if (!raw) return 0;
                        var s = (raw + '').replace(/[¥$€£₩₽฿\s]/g, '').trim();
                        // 检测欧洲格式：最后一个分隔符是逗号且后面只有1-2位数字
                        if (/\d+\.\d{3}[,]\d{1,2}$/.test(s)) {
                            s = s.replace(/\./g, '').replace(',', '.');
                        } else {
                            s = s.replace(/,/g, '');
                        }
                        return parseFloat(s) || 0;
                    }
                    const walletMatch = text.match(/\[WALLET:(.*?)\]/);
                    if(walletMatch) {
                        assets.wallet = _parseAssetNum(walletMatch[1]);
                    }
                    // [FIX-资产全0] 使用更宽松的正则，允许字段内容包含空格和特殊字符
                    assets.stocks = Array.from(text.matchAll(/\[STOCK:([^|\]]+)\|([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/g), m => ({name:m[1].trim(), shares:m[2].trim(), price:_parseAssetNum(m[3]), profit:m[4].trim()}));
                    assets.funds = Array.from(text.matchAll(/\[FUND:([^|\]]+)\|([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/g), m => ({name:m[1].trim(), type:m[2].trim(), invested:m[3].trim(), current:m[4].trim()}));
                    assets.cards = Array.from(text.matchAll(/\[CARD:([^|\]]+)\|([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/g), m => ({bank:m[1].trim(), type:m[2].trim(), lastFour:m[3].trim(), balance:_parseAssetNum(m[4])}));
                    assets.houses = Array.from(text.matchAll(/\[HOUSE:([^|\]]+)\|([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/g), m => ({address:m[1].trim(), type:m[2].trim(), area:m[3].trim(), value:_parseAssetNum(m[4])}));
                    assets.cars = Array.from(text.matchAll(/\[CAR:([^|\]]+)\|([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/g), m => ({brand:m[1].trim(), model:m[2].trim(), year:m[3].trim(), value:_parseAssetNum(m[4])}));
                    // [FIX-资产全0v5] 增强兜底：如果标签解析全空，尝试从自然语言中提取资产信息
                    if (assets.wallet === 0 && assets.stocks.length === 0 && assets.cards.length === 0 && assets.houses.length === 0 && assets.cars.length === 0) {
                        // 兜底1：从纯文本中提取钱包余额
                        const numMatch = text.match(/(?:余额|balance|wallet|钱包)[^\d]*?([\d,.]+)/i);
                        if (numMatch) assets.wallet = _parseAssetNum(numMatch[1]);
                        // 兜底2：尝试提取银行卡信息
                        const cardMatches = text.matchAll(/(?:银行|bank|card)[^\n]*?(\d{4})[^\n]*?([\d,.]+)/gi);
                        for (const cm of cardMatches) {
                            assets.cards.push({bank:'银行', type:'储蓄卡', lastFour:cm[1], balance:_parseAssetNum(cm[2])});
                        }
                        // 兜底3：如果仍然全空，设置一个合理的默认钱包余额避免全0
                        if (assets.wallet === 0 && assets.cards.length === 0) {
                            // 从文本中找任何看起来像金额的数字
                            const anyAmount = text.match(/([\d,]+\.?\d*)\s*(?:元|¥|\$|€|₩|won|yen|dollar)/i);
                            if (anyAmount) assets.wallet = _parseAssetNum(anyAmount[1]);
                        }
                    }
                    _targetPD.assets = assets;
                }
                if(type === 'sms') {
                    _targetPD.sms = Array.from(
                        text.matchAll(/\[SMS:(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g),
                        m => ({ time: m[1], sender: m[2], content: m[3], type: m[4], read: m[5] === 'true' })
                    );
                    if(!Array.isArray(_targetPD.sms) || _targetPD.sms.length === 0) {
                        _targetPD.sms = [
                            { time: '10:30', sender: '95588', content: '您尾号8888的储蓄卡余额变动提醒', type: 'bank', read: true },
                            { time: '09:00', sender: '10086', content: '您本月已使用流量8.5GB，剩余1.5GB', type: 'service', read: true },
                            { time: '14:00', sender: '菜鸟驿站', content: '您有一个包裹待取，取件码 3-2-5168', type: 'delivery', read: false }
                        ];
                    }
                }
                if(type === 'photos') {
                    _targetPD.photos = Array.from(
                        text.matchAll(/\[PHOTO:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g),
                        m => ({ time: m[1], type: m[2], description: m[3], location: m[4] })
                    );
                    if(!Array.isArray(_targetPD.photos) || _targetPD.photos.length === 0) {
                        // 宽松匹配
                        _targetPD.photos = Array.from(
                            text.matchAll(/PHOTO\s*[:：]\s*(.*?)\|(.*?)\|(.*?)\|(.*)/gi),
                            m => ({ time: m[1].trim(), type: m[2].trim(), description: m[3].trim(), location: m[4].trim() })
                        );
                    }
                }
                if(type === 'calllog') {
                    _targetPD.calllog = Array.from(
                        text.matchAll(/\[CALL:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g),
                        m => ({ time: m[1], name: m[2], type: m[3], duration: parseInt(m[4]) || 0 })
                    );
                }
                if(type === 'location') {
                    _targetPD.location = Array.from(
                        text.matchAll(/\[LOC:(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g),
                        m => ({ time: m[1], place: m[2], category: m[3], address: m[4], duration: parseInt(m[5]) || 0 })
                    );
                }
                if(type === 'deleted') {
                    _targetPD.deleted = Array.from(
                        text.matchAll(/\[DEL:(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]/g),
                        m => ({ type: m[1], deletedTime: m[2], originalTime: m[3], preview: m[4], reason: m[5] })
                    );
                }
                if(type === 'manager') {
                    var mgr = { storage: { used: 0, total: 0 }, categories: [], battery: { percent: 0, screenOn: 0, remaining: 0 }, appTime: [], appSize: [], ram: { used: 0, total: 0 }, network: { wifi: 0, mobile: 0 } };
                    var storageMatch = text.match(/\[STORAGE:([\d.]+)\|([\d.]+)\]/);
                    if (storageMatch) { mgr.storage.used = parseFloat(storageMatch[1]); mgr.storage.total = parseFloat(storageMatch[2]); }
                    mgr.categories = Array.from(text.matchAll(/\[STORAGE_CAT:([^|\]]+)\|([\d.]+)\|(\d+)\]/g), m => ({ name: m[1].trim(), size: parseFloat(m[2]), count: parseInt(m[3]) }));
                    var battMatch = text.match(/\[BATTERY:(\d+)\|(\d+)\|(\d+)\]/);
                    if (battMatch) { mgr.battery.percent = parseInt(battMatch[1]); mgr.battery.screenOn = parseInt(battMatch[2]); mgr.battery.remaining = parseInt(battMatch[3]); }
                    mgr.appTime = Array.from(text.matchAll(/\[APP_TIME:([^|\]]+)\|(\d+)\|([^|\]]+)\]/g), m => ({ name: m[1].trim(), minutes: parseInt(m[2]), category: m[3].trim() }));
                    mgr.appSize = Array.from(text.matchAll(/\[APP_SIZE:([^|\]]+)\|([\d.]+)\]/g), m => ({ name: m[1].trim(), sizeMB: parseFloat(m[2]) }));
                    var ramMatch = text.match(/\[RAM:([\d.]+)\|([\d.]+)\]/);
                    if (ramMatch) { mgr.ram.used = parseFloat(ramMatch[1]); mgr.ram.total = parseFloat(ramMatch[2]); }
                    var netMatch = text.match(/\[NETWORK:([\d.]+)\|([\d.]+)\]/);
                    if (netMatch) { mgr.network.wifi = parseFloat(netMatch[1]); mgr.network.mobile = parseFloat(netMatch[2]); }
                    _targetPD.manager = mgr;
                }
                
                save();
                if (!skipLoading) document.getElementById('loading').style.display = 'none';
                return true;
            } catch(e) {
                // [FIX-错误诊断v7] 捕获完整错误信息，包括非标准Error对象（如 throw {} 导致 e.message 为 undefined）
                var _errMsg = '';
                if (e instanceof Error) {
                    _errMsg = e.message || e.toString();
                } else if (typeof e === 'string') {
                    _errMsg = e;
                } else {
                    try { _errMsg = JSON.stringify(e) || String(e); } catch(_) { _errMsg = String(e); }
                }
                console.error("[CheckPhone] aiGeneratePhone Error:", _errMsg, "\n  Type:", type, "\n  Contact:", requestForContact, "\n  Stack:", e?.stack || 'N/A');
                if (!skipLoading) document.getElementById('loading').style.display = 'none';
                // [FIX-错误分类v6] 区分错误类型，返回具体错误信息而非统一的false
                if (_errMsg === 'API_PARSE_ERROR') return { error: 'parse', msg: 'API返回格式异常，请检查API配置' };
                if (_errMsg === 'API_EMPTY_RESPONSE') return { error: 'empty', msg: 'API返回了空内容，请检查API配额或模型设置' };
                if (_errMsg && (_errMsg.includes('fetch') || _errMsg.includes('network') || _errMsg.includes('Failed') || _errMsg.includes('timeout') || _errMsg.includes('ECONNREFUSED'))) {
                    return { error: 'network', msg: '网络连接失败，请检查网络或API地址' };
                }
                // [FIX-数据损坏自愈v1] 如果是数据结构相关错误（TypeError等），尝试清除该联系人的损坏缓存
                if (_errMsg && (_errMsg.includes('TypeError') || _errMsg.includes('is not a function') || _errMsg.includes('Cannot read prop') || _errMsg.includes('undefined is not'))) {
                    console.warn('[CheckPhone] 检测到数据结构错误，尝试重置联系人缓存:', requestForContact);
                    if (requestForContact && store.phoneDataMap && store.phoneDataMap[requestForContact]) {
                        store.phoneDataMap[requestForContact] = { contacts:[], memo:[], usage:[], search:[], chats:{}, shopping:[], interests:[], assets:null, sms:[], photos:[], calllog:[], location:[], deleted:[], manager:null };
                        store.phoneData = store.phoneDataMap[requestForContact];
                        save();
                    }
                    return { error: 'data_corrupted', msg: '数据异常已自动修复，请重新点击刷新生成' };
                }
                return { error: 'unknown', msg: '生成失败: ' + (_errMsg || '未知错误').substring(0, 80) };
            }
        }

        // New Check Phone Entry Point
        function selectCheckPhoneContact() {
            const list = document.getElementById('checkphone-contact-list');
            // Problem 5: Filter out group chats
            const privateContacts = store.contacts.filter(c => !c.isGroup);
            // [FIX-特殊字符v1] 联系人名中可能含单引号、反斜杠等特殊字符，必须转义防止 onclick handler 语法错误
            list.innerHTML = privateContacts.map(c => {
                var safeName = (c.name || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
                return `<div class="cp-contact-item" onclick="startCheckPhone('${safeName}')">
                    <img src="${c.avatar}" class="cp-contact-avatar">
                    <span class="cp-contact-name">${c.name}</span>
                    <i class="fas fa-chevron-right" style="color:#555; font-size:12px;"></i>
                </div>`;
            }).join('');
            if (privateContacts.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding: 20px; color: #666;">没有可用的私聊联系人</div>';
            }
            document.getElementById('modal-checkphone-contact').style.display = 'flex';
        }

        function _cpUpdateClock() {
            const now = new Date();
            const hm = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
            const el1 = document.getElementById('cp-clock-small');
            if (el1) el1.textContent = hm;
            const el2 = document.getElementById('cp-big-clock');
            if (el2) el2.textContent = hm;
            const weekNames = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
            const dateStr = `${now.getMonth()+1}月${now.getDate()}日 ${weekNames[now.getDay()]}`;
            const el3 = document.getElementById('cp-date-text');
            if (el3) el3.textContent = dateStr;
        }

        function startCheckPhone(name) {
            activeCheckPhoneContactName = name;
            document.getElementById('modal-checkphone-contact').style.display = 'none';
            document.getElementById('checkphone-container').innerHTML = `
                 <div class="cp-clock-area">
                     <div class="cp-big-time" id="cp-big-clock">22:30</div>
                     <div class="cp-date-line" id="cp-date-text">3月24日 星期一</div>
                 </div>
                 <div class="cp-owner-label">${name} 的手机 <span onclick="event.stopPropagation();showConfirm('确定清除该联系人的所有手机缓存数据？清除后需要重新生成。',function(){clearPhoneDataForContact('${name.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}');startCheckPhone('${name.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}');})" style="font-size:10px;color:#666;margin-left:6px;cursor:pointer;opacity:0.6;" title="清除缓存">🗑️</span></div>
                 <div class="cp-app-grid cp-app-grid-v2">
                    <div class="cp-app-icon" onclick="openPhoneFunc('contacts')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                        <span>通讯录</span>
                    </div>
                    <div class="cp-app-icon" onclick="openPhoneFunc('memo')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
                        <span>备忘录</span>
                    </div>
                    <div class="cp-app-icon" onclick="openPhoneFunc('search')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
                        <span>搜索记录</span>
                    </div>
                    <div class="cp-app-icon" onclick="openPhoneFunc('usage')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></div>
                        <span>使用简报</span>
                    </div>
                    <div class="cp-app-icon" onclick="openPhoneFunc('shopping')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>
                        <span>购物车</span>
                    </div>
                    <div class="cp-app-icon" onclick="openPhoneFunc('interests')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
                        <span>兴趣雷达</span>
                    </div>
                    <div class="cp-app-icon" onclick="openPhoneFunc('assets')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
                        <span>资产</span>
                    </div>
                    <div class="cp-app-icon" onclick="openPhoneFunc('sms')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
                        <span>短信</span>
                    </div>
                    <div class="cp-app-icon" onclick="openPhoneFunc('photos')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                        <span>相册</span>
                    </div>
                    <div class="cp-app-icon" onclick="openPhoneFunc('calllog')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                        <span>通话</span>
                    </div>
                    <div class="cp-app-icon" onclick="openPhoneFunc('location')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                        <span>足迹</span>
                    </div>
                    <div class="cp-app-icon" onclick="openPhoneFunc('deleted')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>
                        <span>最近删除</span>
                    </div>
                    <div class="cp-app-icon" onclick="openPhoneFunc('manager')">
                        <div class="cp-app-icon-box"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                        <span>手机管家</span>
                    </div>
                 </div>
                 <div class="cp-dock">
                    <div class="cp-dock-icon" onclick="openPhoneFunc('contacts')"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
                    <div class="cp-dock-icon" onclick="openPhoneFunc('sms')"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
                    <div class="cp-dock-icon" onclick="selectCheckPhoneContact()"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></div>
                 </div>
            `;
            _cpUpdateClock();
            // [FIX-缓存隔离] 按联系人名隔离查手机数据，切换联系人不再残留上一个人的缓存
            if (!store.phoneDataMap) store.phoneDataMap = {};
            if (!store.phoneDataMap[name]) {
                store.phoneDataMap[name] = { contacts: [], memo: [], usage: [], search: [], chats: {}, shopping: [], interests: [], assets: null, sms: [], photos: [], calllog: [], location: [], deleted: [], manager: null };
            }
            // 兼容旧数据：确保新字段存在
            var _pd = store.phoneDataMap[name];
            if (!_pd.photos) _pd.photos = [];
            if (!_pd.calllog) _pd.calllog = [];
            if (!_pd.location) _pd.location = [];
            if (!_pd.deleted) _pd.deleted = [];
            if (!_pd.manager) _pd.manager = null;
            // [FIX-类型守卫v9] 统一归一化：持久化数据可能被污染为非数组对象，强制修正
            _normalizePhoneDataArrays(_pd);
            // [FIX-数据完整性v1] 深度校验并修复持久化数据结构
            _validateAndRepairPhoneData(_pd, name);
            store.phoneData = store.phoneDataMap[name];
            
            // [FIX-语言提示v5] 检测到外语联系人时显示语言提示，引导用户设置
            try {
                const _cpContact = store.contacts.find(c => c.name === name);
                if (_cpContact) {
                    const _cpLang = detectContactLanguage(_cpContact);
                    if (_cpLang.isForeign) {
                        const _hasManualLang = _cpContact.settings && _cpContact.settings.phoneLanguage;
                        const _langTip = _hasManualLang
                            ? `🌐 语言: ${_cpLang.langName}（手动设置）`
                            : `🌐 自动检测: ${_cpLang.langName}（如有误，可在聊天设置→查手机语言中修改）`;
                        const _tipEl = document.createElement('div');
                        _tipEl.style.cssText = 'text-align:center;padding:6px 12px;font-size:11px;color:#aaa;background:rgba(255,255,255,0.05);border-radius:8px;margin:0 20px 8px;';
                        _tipEl.innerHTML = _langTip;
                        const _ownerLabel = document.querySelector('.cp-owner-label');
                        if (_ownerLabel) _ownerLabel.after(_tipEl);
                    }
                }
            } catch(_) {}
        }

        function exitCheckPhone() {
            _clearLongPressState();
            if (typeof _blockLongPress !== 'undefined') _blockLongPress = false;
            
            activeCheckPhoneContactName = null;
            document.getElementById('checkphone-container').innerHTML = `
                 <div class="cp-select-prompt">
                     <i class="fas fa-lock" style="font-size:36px; color:#555; margin-bottom:16px;"></i>
                     <div style="color:#888; font-size:14px; margin-bottom:20px;">请先选择要查看的联系人</div>
                     <button onclick="selectCheckPhoneContact()" class="cp-select-btn">选择联系人</button>
                 </div>
            `;
            exitApp();
        }

        async function openPhoneFunc(type) {
             if(!activeCheckPhoneContactName) return toast("请先选择联系人");

             // [FIX-phoneData防御] 确保 store.phoneData 存在，防止 TypeError: can't access property "length"
             if (!store.phoneData) {
                 if (store.phoneDataMap && store.phoneDataMap[activeCheckPhoneContactName]) {
                     store.phoneData = store.phoneDataMap[activeCheckPhoneContactName];
                 } else {
                     store.phoneData = { contacts:[], memo:[], usage:[], search:[], chats:{}, shopping:[], interests:[], assets:null, sms:[], photos:[], calllog:[], location:[], deleted:[], manager:null };
                     if (!store.phoneDataMap) store.phoneDataMap = {};
                     store.phoneDataMap[activeCheckPhoneContactName] = store.phoneData;
                 }
              }
              // [FIX-类型守卫v9] 每次打开功能面板时归一化数组字段，防止持久化数据污染导致 .map/.filter 报错
              _normalizePhoneDataArrays(store.phoneData);
             // [FIX-phoneData字段兼容v2] 确保所有子字段都存在且类型正确（防止持久化数据污染导致 .map is not a function）
             if (!Array.isArray(store.phoneData.contacts)) store.phoneData.contacts = [];
             if (!Array.isArray(store.phoneData.memo)) store.phoneData.memo = [];
             if (!Array.isArray(store.phoneData.usage)) store.phoneData.usage = [];
             if (!Array.isArray(store.phoneData.search)) store.phoneData.search = [];
             if (!store.phoneData.chats || typeof store.phoneData.chats !== 'object' || Array.isArray(store.phoneData.chats)) store.phoneData.chats = {};
             if (!Array.isArray(store.phoneData.shopping)) store.phoneData.shopping = [];
             if (!Array.isArray(store.phoneData.interests)) store.phoneData.interests = [];
             if (!Array.isArray(store.phoneData.sms)) store.phoneData.sms = [];
             if (!Array.isArray(store.phoneData.photos)) store.phoneData.photos = [];
             if (!Array.isArray(store.phoneData.calllog)) store.phoneData.calllog = [];
             if (!Array.isArray(store.phoneData.location)) store.phoneData.location = [];
             if (!Array.isArray(store.phoneData.deleted)) store.phoneData.deleted = [];

             const layerMap = {
                 contacts: 'layer-phone-contacts',
                 chat_list: 'layer-phone-chat',
                 memo: 'layer-phone-memo',
                 search: 'layer-phone-search',
                 usage: 'layer-phone-usage',
                 shopping: 'layer-phone-shopping',
                 interests: 'layer-phone-interests',
                 assets: 'layer-phone-assets',
                 sms: 'layer-phone-sms',
                 photos: 'layer-phone-photos',
                 calllog: 'layer-phone-calllog',
                 location: 'layer-phone-location',
                 deleted: 'layer-phone-deleted',
                 manager: 'layer-phone-manager'
             };
             
             if(type === 'chat_list') {
                 const _phoneTarget = store.contacts.find(c => c.name === activeCheckPhoneContactName);
                 openPhoneChat(getUserPersonaName(_phoneTarget, store.user.name || '用户'));
                 return;
             }

             // [改] 不再自动生成，没数据时显示空白+手动刷新按钮，有缓存则直接显示
             const _phoneEmptyContainerMap = {
                contacts: 'phone-contacts-list',
                memo: 'phone-memo-list',
                search: 'phone-search-list',
                usage: 'phone-usage-content',
                shopping: 'phone-shopping-list',
                interests: 'phone-interests-content',
                assets: 'phone-assets-content',
                sms: 'phone-sms-list',
                photos: 'phone-photos-content',
                calllog: 'phone-calllog-content',
                location: 'phone-location-content',
                deleted: 'phone-deleted-content',
                manager: 'phone-manager-content'
            };

             function _renderPhoneEmpty(containerId, dataType) {
                 const el = document.getElementById(containerId);
                 if (el) el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:#888;">
                     <i class="fas fa-inbox" style="font-size:36px;margin-bottom:16px;opacity:0.4;"></i>
                     <div style="font-size:14px;margin-bottom:20px;">暂无数据，点击刷新生成</div>
                     <button onclick="refreshPhoneData('${dataType}')" style="padding:10px 28px;border:1px solid #666;background:transparent;color:#ccc;border-radius:20px;font-size:13px;cursor:pointer;"><i class="fas fa-sync-alt" style="margin-right:6px;"></i>刷新生成</button>
                 </div>`;
             }

             if(type === 'contacts') {
                 if(!Array.isArray(store.phoneData.contacts) || store.phoneData.contacts.length === 0) {
                     _renderPhoneEmpty('phone-contacts-list', 'contacts');
                 } else {
                     renderPhoneContacts();
                 }
             }
             else if(type === 'memo') {
                 if(!Array.isArray(store.phoneData.memo) || store.phoneData.memo.length === 0) _renderPhoneEmpty('phone-memo-list', 'memo');
                 else renderPhoneMemos();
             }
             else if(type === 'search') {
                 if(!Array.isArray(store.phoneData.search) || store.phoneData.search.length === 0) _renderPhoneEmpty('phone-search-list', 'search');
                 else renderPhoneSearch();
             }
             else if(type === 'usage') {
                 if(!Array.isArray(store.phoneData.usage) || store.phoneData.usage.length === 0) _renderPhoneEmpty('phone-usage-content', 'usage');
                 else renderPhoneUsage();
             }
             else if(type === 'shopping') {
                 if(!Array.isArray(store.phoneData.shopping) || store.phoneData.shopping.length === 0) _renderPhoneEmpty('phone-shopping-list', 'shopping');
                 else renderPhoneShopping();
             }
             else if(type === 'interests') {
                 if(!Array.isArray(store.phoneData.interests) || store.phoneData.interests.length === 0) _renderPhoneEmpty('phone-interests-content', 'interests');
                 else renderPhoneInterests();
             }
             else if(type === 'assets') {
                 if(!store.phoneData.assets) _renderPhoneEmpty('phone-assets-content', 'assets');
                 else renderPhoneAssets();
             }
             else if(type === 'sms') {
                 if(!Array.isArray(store.phoneData.sms) || store.phoneData.sms.length === 0) _renderPhoneEmpty('phone-sms-list', 'sms');
                 else renderPhoneSMS();
             }
             else if(type === 'photos') {
                 if(!Array.isArray(store.phoneData.photos) || store.phoneData.photos.length === 0) _renderPhoneEmpty('phone-photos-content', 'photos');
                 else renderPhonePhotos();
             }
             else if(type === 'calllog') {
                 if(!Array.isArray(store.phoneData.calllog) || store.phoneData.calllog.length === 0) _renderPhoneEmpty('phone-calllog-content', 'calllog');
                 else renderPhoneCallLog();
             }
             else if(type === 'location') {
                 if(!Array.isArray(store.phoneData.location) || store.phoneData.location.length === 0) _renderPhoneEmpty('phone-location-content', 'location');
                 else renderPhoneLocation();
             }
             else if(type === 'deleted') {
                 if(!Array.isArray(store.phoneData.deleted) || store.phoneData.deleted.length === 0) _renderPhoneEmpty('phone-deleted-content', 'deleted');
                 else renderPhoneDeleted();
             }
             else if(type === 'manager') {
                 if(!store.phoneData.manager) _renderPhoneEmpty('phone-manager-content', 'manager');
                 else renderPhoneManager();
             }

             // 数据加载完成后再显示面板
             const el = document.getElementById(layerMap[type]);
             if(el) el.classList.add('show');
        }

        // [进度弹窗] 显示/更新/关闭查手机刷新进度弹窗
        function _showPhoneRefreshModal(step, total, text, isError) {
            var modal = document.getElementById('phone-refresh-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'phone-refresh-modal';
                modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;';
                modal.innerHTML = '<div id="phone-refresh-modal-box" style="background:#2a2a2a;border-radius:16px;padding:28px 24px;width:280px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.4);">' +
                    '<div id="phone-refresh-spinner" style="margin:0 auto 16px;width:36px;height:36px;border:3px solid rgba(255,255,255,0.15);border-top-color:#07c160;border-radius:50%;animation:phone-refresh-spin 0.8s linear infinite;"></div>' +
                    '<div id="phone-refresh-step" style="font-size:12px;color:#07c160;margin-bottom:6px;font-weight:bold;"></div>' +
                    '<div id="phone-refresh-text" style="font-size:14px;color:#ddd;line-height:1.6;"></div>' +
                    '<div id="phone-refresh-bar-wrap" style="margin-top:14px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">' +
                        '<div id="phone-refresh-bar" style="height:100%;background:#07c160;border-radius:2px;transition:width 0.4s ease;width:0%;"></div>' +
                    '</div>' +
                    '<button id="phone-refresh-close-btn" onclick="document.getElementById(\'phone-refresh-modal\').remove()" style="display:none;margin-top:16px;padding:8px 24px;background:#07c160;color:#fff;border:none;border-radius:20px;font-size:13px;cursor:pointer;">关闭</button>' +
                '</div>';
                // 注入动画
                if (!document.getElementById('phone-refresh-spin-style')) {
                    var styleEl = document.createElement('style');
                    styleEl.id = 'phone-refresh-spin-style';
                    styleEl.textContent = '@keyframes phone-refresh-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}';
                    document.head.appendChild(styleEl);
                }
                document.body.appendChild(modal);
            }
            var stepEl = document.getElementById('phone-refresh-step');
            var textEl = document.getElementById('phone-refresh-text');
            var barEl = document.getElementById('phone-refresh-bar');
            var spinnerEl = document.getElementById('phone-refresh-spinner');
            var closeBtn = document.getElementById('phone-refresh-close-btn');
            if (stepEl) stepEl.textContent = isError ? '❌ 出错了' : (step + '/' + total);
            if (textEl) textEl.innerHTML = text;
            if (barEl) barEl.style.width = (step / total * 100) + '%';
            if (isError) {
                if (spinnerEl) spinnerEl.style.cssText = 'margin:0 auto 16px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:28px;';
                if (spinnerEl) spinnerEl.innerHTML = '😥';
                if (barEl) barEl.style.background = '#fa5151';
                if (closeBtn) closeBtn.style.display = 'inline-block';
                if (closeBtn) closeBtn.style.background = '#fa5151';
            }
        }
        function _closePhoneRefreshModal() {
            var modal = document.getElementById('phone-refresh-modal');
            if (modal) modal.remove();
        }
        function _phoneRefreshModalDone() {
            var spinnerEl = document.getElementById('phone-refresh-spinner');
            if (spinnerEl) {
                spinnerEl.style.cssText = 'margin:0 auto 16px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:28px;';
                spinnerEl.innerHTML = '✅';
            }
            var stepEl = document.getElementById('phone-refresh-step');
            if (stepEl) stepEl.textContent = '完成';
            var barEl = document.getElementById('phone-refresh-bar');
            if (barEl) barEl.style.width = '100%';
            var closeBtn = document.getElementById('phone-refresh-close-btn');
            if (closeBtn) closeBtn.style.display = 'inline-block';
            setTimeout(_closePhoneRefreshModal, 1500);
        }

        async function refreshPhoneData(type) {
             // [进度弹窗v2] contacts类型使用进度弹窗，其他类型使用通用loading
             const _useProgressModal = (type === 'contacts');
             if (_useProgressModal) {
                 _showPhoneRefreshModal(1, 2, '正在调用 API 生成联系人列表...', false);
             } else {
                 document.getElementById('loading').style.display = 'block';
             }
             try {
             // [FIX-刷新安全v7] 刷新前备份旧数据，生成失败时恢复，避免丢失已有数据
             var _oldContacts = null, _oldChats = null;
             if(type === 'contacts' && store.phoneData) {
                 _oldContacts = Array.isArray(store.phoneData.contacts) ? [...store.phoneData.contacts] : null;
                 _oldChats = store.phoneData.chats ? Object.assign({}, store.phoneData.chats) : null;
                 // 刷新联系人时清空聊天记录缓存（成功后生效）
                 store.phoneData.chats = {};
             }
             // [FIX-loading外控v7] 所有aiGeneratePhone调用都用skipLoading=true
             const result = await aiGeneratePhone(type, undefined, true);
             // [FIX-错误分类v6] result 为 true 表示成功，为对象表示失败（含错误详情）
             const success = (result === true);
             if(success) {
                 if(type==='contacts') {
                     renderPhoneContacts();
                     // [FIX-批量聊天v7] 刷新联系人后，用1次API调用批量生成所有联系人的聊天记录（最多2次总调用）
                     const _contactsToGen = (Array.isArray(store.phoneData.contacts) ? store.phoneData.contacts : []).filter(c => c.name);
                     if (_contactsToGen.length > 0) {
                         // [进度弹窗v2] 更新弹窗到第2步
                         _showPhoneRefreshModal(2, 2, '联系人已生成 ✓<br>正在批量生成聊天记录...<br><span style="font-size:11px;color:#999;">(' + _contactsToGen.length + ' 个联系人)</span>', false);
                         // 将所有联系人名用逗号拼接，作为 batch_chats 的 context 参数
                         const _allNames = _contactsToGen.map(c => c.name).join(',');
                         const _batchResult = await aiGeneratePhone('batch_chats', _allNames, true);
                         if (_batchResult === true) {
                             save();
                             renderPhoneContacts();
                             // [进度弹窗v2] 全部完成
                             _phoneRefreshModalDone();
                         } else {
                             console.warn('[CheckPhone] 批量聊天记录生成失败:', _batchResult);
                             // 批量失败不影响联系人列表，只提示聊天部分失败
                             save();
                             renderPhoneContacts();
                             const _batchErrMsg = (_batchResult && _batchResult.msg) ? _batchResult.msg : '聊天记录生成失败';
                             _showPhoneRefreshModal(2, 2, '联系人已刷新 ✓<br>但聊天记录生成失败：<br><span style="color:#fa9d53;">' + _batchErrMsg + '</span>', true);
                         }
                     } else {
                         // 没有联系人需要生成聊天，直接完成
                         _phoneRefreshModalDone();
                     }
                 }
                 if(type==='memo') renderPhoneMemos();
                 if(type==='search') renderPhoneSearch();
                 if(type==='usage') renderPhoneUsage();
                 if(type==='shopping') renderPhoneShopping();
                 if(type==='interests') renderPhoneInterests();
                 if(type==='assets') renderPhoneAssets();
                 if(type==='sms') renderPhoneSMS();
                 if(type==='photos') renderPhonePhotos();
                 if(type==='calllog') renderPhoneCallLog();
                 if(type==='location') renderPhoneLocation();
                 if(type==='deleted') renderPhoneDeleted();
                 if(type==='manager') renderPhoneManager();
             } else {
                 // [FIX-数据自愈v1] 如果返回的是数据损坏错误，不恢复旧数据（已被重置），直接提示用户重试
                 if (result && result.error === 'data_corrupted') {
                     const _autoFixMsg = result.msg || '数据已自动修复，请重新生成';
                     if (_useProgressModal) {
                         _showPhoneRefreshModal(1, 2, '⚠️ ' + _autoFixMsg, true);
                     } else {
                         toast(_autoFixMsg, 'info');
                     }
                 } else {
                     // [FIX-刷新安全v7] 生成失败时恢复旧数据
                     if(type === 'contacts' && store.phoneData) {
                         if (_oldContacts) store.phoneData.contacts = _oldContacts;
                         if (_oldChats) store.phoneData.chats = _oldChats;
                     }
                     // [FIX-错误分类v6] 精准错误提示，不再笼统说"网络问题"
                     const _errMsg = (result && result.msg) ? result.msg : '生成失败，请重试';
                     if (_useProgressModal) {
                         _showPhoneRefreshModal(1, 2, '生成联系人失败：<br><span style="color:#fa9d53;">' + _errMsg + '</span>', true);
                     } else {
                         toast(_errMsg, 'error');
                     }
                 }
             }
             } finally {
                 // [FIX-loading外控v7] 无论成功失败，最终都关闭loading（非contacts类型）
                 if (!_useProgressModal) {
                     document.getElementById('loading').style.display = 'none';
                 }
             }
        }

        function renderPhoneContacts() {
             const l = document.getElementById('phone-contacts-list');
             const _targetContact = store.contacts.find(c => c.name === activeCheckPhoneContactName);
             const userName = getUserPersonaName(_targetContact, store.user.name || '用户');
             // [FIX-类型守卫v7] 确保 contacts 一定是数组，防止 .map is not a function
             let contacts = Array.isArray(store.phoneData.contacts) ? store.phoneData.contacts : [];
             
             // 1. [FIX-重复用户] 过滤掉生成的联系人中可能重复出现的"我"、当前用户名、以及被查看者自己
             // 收集所有人设名字（它们都代表同一个用户），用于更全面的过滤
             const ownerName = activeCheckPhoneContactName;
             const allPersonaNames = new Set();
             allPersonaNames.add(userName);
             allPersonaNames.add(ownerName);
             allPersonaNames.add('我');
             allPersonaNames.add('Me');
             allPersonaNames.add('用户');
             allPersonaNames.add('User');
             if (store.user.name) allPersonaNames.add(store.user.name);
             if (store.personas && Array.isArray(store.personas)) {
                 store.personas.forEach(p => { if (p.name) allPersonaNames.add(p.name); });
             }
             contacts = contacts.filter(c => {
                 const trimmedName = (c.name || '').trim();
                 if (!trimmedName) return false;
                 // 精确匹配过滤
                 if (allPersonaNames.has(trimmedName)) return false;
                 // 模糊匹配：如果联系人名字包含用户名或用户名包含联系人名字（处理变体名如"小明❤️"）
                 if (userName && userName.length >= 2 && (trimmedName.includes(userName) || userName.includes(trimmedName))) return false;
                 return true;
             });
             
             // 2. 去重
             const uniqueContacts = [];
             const seen = new Set();
             contacts.forEach(c => {
                 if (!seen.has(c.name)) {
                     seen.add(c.name);
                     uniqueContacts.push(c);
                 }
             });
             
             // 3. 将真实用户(User)置顶，作为唯一真实入口
             // 获取用户在该联系人聊天中绑定的人设头像（真实头像）
             const userPersonaId = _targetContact?.settings?.userPersona;
             const userPersona = userPersonaId ? store.personas.find(p => p.id === userPersonaId) : null;
             const userAvatarInChat = userPersona?.avatar || store.user.avatar || '';
             
             // 获取或生成AI备注（联系人对用户的备注）
             const userRemark = _targetContact?._phoneRemark || '';
             
             const finalContacts = [{name: userName, isReal: true, avatar: userAvatarInChat, remark: userRemark}, ...uniqueContacts];
             
             l.innerHTML = finalContacts.map(c => {
                 // 转义名字中的特殊字符，防止onclick handler被破坏
                 const safeName = c.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                 if (c.isReal) {
                     // 真实用户：显示绑定的聊天头像和AI生成的备注
                     const avatarHtml = c.avatar
                         ? `<img src="${c.avatar}" class="avatar" style="width:40px;height:40px;border-radius:8px;object-fit:cover;">`
                         : `<div class="avatar" style="background:#07c160; display:flex; justify-content:center; align-items:center; color:#fff; font-weight:bold;">${c.name[0]}</div>`;
                     // 备注作为主显示名，无二级文字
                     const displayName = c.remark || c.name;
                     return `<div class="list-item" onclick="openPhoneChat('${safeName}')" style="position:relative;">
                        ${avatarHtml}
                        <div class="list-content">
                            <div class="list-title">${displayName}</div>
                        </div>
                        ${!c.remark ? `<div onclick="event.stopPropagation();generatePhoneRemark()" style="font-size:11px; color:#576b95; padding:4px 8px; border:1px solid #576b95; border-radius:12px; cursor:pointer; margin-right:8px;">生成备注</div>` : `<div onclick="event.stopPropagation();generatePhoneRemark()" style="font-size:11px; color:#999; padding:4px 8px; cursor:pointer; margin-right:4px;" title="重新生成备注"><i class="fas fa-sync-alt" style="font-size:10px;"></i></div>`}
                        <i class="fas fa-chevron-right" style="color:#ddd;"></i>
                     </div>`;
                 }
                 const hasChat = store.phoneData.chats && store.phoneData.chats[c.name];
                 return `<div class="list-item" onclick="openPhoneChat('${safeName}')">
                    <div class="avatar" style="background:#ccc; display:flex; justify-content:center; align-items:center; color:#fff; font-weight:bold;">${c.name[0]}</div>
                    <div class="list-content"><div class="list-title">${c.name}</div>${hasChat ? '' : '<div class="list-sub" style="font-size:11px;color:#bbb;">点击查看聊天记录</div>'}</div>
                    <i class="fas fa-chevron-right" style="color:#ddd;"></i>
                 </div>`;
             }).join('');
             
             // 如果还没有备注，自动生成一次
             if (_targetContact && !_targetContact._phoneRemark) {
                 generatePhoneRemark();
             }
             _injectPhoneBatchTranslateBtn('phone-contacts-list');
       }
        
        // AI生成联系人对用户的备注（基于人设和记忆）
        async function generatePhoneRemark() {
            const _targetContact = store.contacts.find(c => c.name === activeCheckPhoneContactName);
            if (!_targetContact) return;
            
            const userName = getUserPersonaName(_targetContact, store.user.name || '用户');
            const persona = _targetContact.persona || '';
            
            // [OPT] 生成手机备注只需要记忆和聊天上下文
            let memoryContext = '';
            if (typeof buildContactGlobalMemory === 'function') {
                memoryContext = buildContactGlobalMemory(_targetContact.id, { sections: ['memory', 'chat'] });
            }
            
            // 获取最近聊天记录作为参考
            let chatContext = '';
            const chats = store.chats?.[_targetContact.id];
            if (chats && chats.length > 0) {
                const recentMsgs = chats.slice(-10).filter(m => m.type === 'text').map(m => `${m.sender === 'me' ? userName : _targetContact.name}: ${m.content}`).join('\n');
                chatContext = '\n最近聊天: ' + recentMsgs.substring(0, 300);
            }
            
            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: `你是${_targetContact.name}。人设: ${persona}${memoryContext}${chatContext}\n\n请为你手机通讯录里的"${userName}"生成一个备注名。这个备注应该体现你们的关系和你对${userName}的称呼习惯。只输出备注名本身（2-8个字），不要解释。例如："小宝贝❤️"、"死鬼"、"亲爱的"、"笨蛋老公"等。` },
                    { role: 'user', content: '请生成备注名' }
                ]);
                const remark = (data.choices[0].message.content || '').trim().replace(/["""]/g, '').substring(0, 12);
                _targetContact._phoneRemark = remark;
                save();
                renderPhoneContacts();
            } catch(e) {
                console.error('生成备注失败:', e);
            }
        }

        async function openPhoneChat(name) {
             document.getElementById('phone-chat-title').innerText = name;
             
            const targetC = store.contacts.find(c => c.name === activeCheckPhoneContactName); // The contact whose phone is being checked.
            const userName = getUserPersonaName(targetC, store.user.name || '用户');
            const isUserChat = name === userName;

            if (isUserChat) {
                // 读取真实聊天记录
                renderPhoneChat(name, true, targetC.id);
                
                // 触发AI评论：随机选择一条最近的消息进行评论
                const realChats = store.chats[targetC.id] || [];
                if (realChats.length > 0 && Math.random() > 0.3) { // 70%概率触发评论
                    const recentMsgs = realChats.slice(-10).filter(m => m.type === 'text' && m.content);
                    if (recentMsgs.length > 0) {
                        const randomMsg = recentMsgs[Math.floor(Math.random() * recentMsgs.length)];
                        const msgPreview = randomMsg.content.substring(0, 50);
                        const sender = randomMsg.sender === 'me' ? userName : targetC.name;
                        setTimeout(() => {
                            triggerPhoneComment('聊天记录', `${sender}: ${msgPreview}`, activeCheckPhoneContactName);
                        }, 1500);
                    }
                }
            } else {
                // Generate fake chat for other contacts.
                if(!store.phoneData.chats) store.phoneData.chats = {};
                // [FIX-聊天空白] 检查缓存是否为空数组（之前正则解析失败会缓存空数组，导致永远显示空白）
                if(!store.phoneData.chats[name] || (Array.isArray(store.phoneData.chats[name]) && store.phoneData.chats[name].length === 0)) {
                    // [FIX-批量聊天v8] 改为批量生成所有缺失聊天的联系人，而非逐个生成（1次API代替N次）
                    const _allPhoneContacts = (Array.isArray(store.phoneData.contacts) ? store.phoneData.contacts : []).filter(c => c.name);
                    const _missingChatNames = _allPhoneContacts.filter(c => !store.phoneData.chats[c.name] || (Array.isArray(store.phoneData.chats[c.name]) && store.phoneData.chats[c.name].length === 0)).map(c => c.name);
                    let success = false;
                    if (_missingChatNames.length > 1) {
                        // 多个联系人缺失聊天，用batch_chats一次生成
                        console.log('[CheckPhone] 发现 ' + _missingChatNames.length + ' 个联系人缺少聊天记录，使用batch_chats批量生成');
                        toast('正在批量生成聊天记录...', 'info');
                        const _batchResult = await aiGeneratePhone('batch_chats', _missingChatNames.join(','));
                        success = (_batchResult === true) && store.phoneData.chats[name] && store.phoneData.chats[name].length > 0;
                    }
                    // 批量生成后该联系人仍无数据，或只缺1个人，单独生成
                    if (!success && (!store.phoneData.chats[name] || (Array.isArray(store.phoneData.chats[name]) && store.phoneData.chats[name].length === 0))) {
                        let _chatResult = await aiGeneratePhone('chat', name);
                        success = (_chatResult === true);
                    }
                    if(!success) {
                        toast('聊天记录生成失败，请稍后重试', 'error');
                        // [FIX-聊天空白v5] 即使失败也显示面板，展示空状态而非无反应
                        document.getElementById('layer-phone-chat').classList.add('show');
                        const h = document.getElementById('phone-chat-history');
                        if (h) h.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#999;font-size:14px;">聊天记录加载失败<br><button onclick="openPhoneChat(\'' + name.replace(/'/g, "\\'") + '\')" style="margin-top:12px;padding:8px 20px;border:1px solid #666;background:transparent;color:#ccc;border-radius:16px;font-size:13px;cursor:pointer;">重试</button></div>';
                        return;
                    }
                    // 如果生成后仍然为空，说明解析失败，清除缓存以便下次重试
                    if (store.phoneData.chats[name] && store.phoneData.chats[name].length === 0) {
                        delete store.phoneData.chats[name];
                        toast('聊天记录解析失败，请重试');
                        document.getElementById('layer-phone-chat').classList.add('show');
                        const h = document.getElementById('phone-chat-history');
                        if (h) h.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#999;font-size:14px;">聊天记录解析失败<br><button onclick="openPhoneChat(\'' + name.replace(/'/g, "\\'") + '\')" style="margin-top:12px;padding:8px 20px;border:1px solid #666;background:transparent;color:#ccc;border-radius:16px;font-size:13px;cursor:pointer;">重试</button></div>';
                        return;
                    }
                }
                renderPhoneChat(name, false, null);
            }
            // 数据加载完成后再显示面板
            document.getElementById('layer-phone-chat').classList.add('show');
        }

        function renderPhoneChat(name, isRealHistory, realContactId) {
            const h = document.getElementById('phone-chat-history');
            if (!h) return;
            h.innerHTML = '';

            const msgs = isRealHistory ? (store.chats[realContactId] || []) : (store.phoneData.chats[name] || []);

            // 在“查手机”视图中：
            // Owner = 手机的主人（被查看的联系人） => 消息显示在右边 (class 'me')
            // Other = 对话的另一方（如果是真实历史，就是User；如果是虚拟历史，就是虚拟联系人） => 消息显示在左边
            
            const ownerName = activeCheckPhoneContactName;
            const ownerContact = store.contacts.find(c => c.name === ownerName);
            const ownerAvatarSrc = ownerContact?.avatar || `https://ui-avatars.com/api/?name=${(ownerName || '我')[0]}&background=95ec69&color=fff`;
            
            // 对方的头像（如果是User，用绑定的人设头像；否则生成）
            let otherAvatarSrc;
            if (isRealHistory) {
                // 使用用户在该联系人聊天中绑定的人设头像
                const userPersonaId = ownerContact?.settings?.userPersona;
                const userPersona = userPersonaId ? store.personas.find(p => p.id === userPersonaId) : null;
                otherAvatarSrc = userPersona?.avatar || store.user.avatar || `https://ui-avatars.com/api/?name=${(store.user.name || '我')[0]}&background=ddd&color=fff`;
            } else {
                otherAvatarSrc = `https://ui-avatars.com/api/?name=${name[0]}&background=ddd&color=fff`;
            }

            msgs.forEach(m => {
                let isOwnerSender = false; // 是否是手机主人发送的消息（右侧）

                if (isRealHistory) {
                    // 真实历史数据结构：
                    // sender === 'me'  -> 是User发的 -> 在查手机视角，这是“对方”，应在左边 (isOwnerSender = false)
                    // sender === 'ai'  -> 是联系人发的 -> 在查手机视角，这是“主人”，应在右边 (isOwnerSender = true)
                    // 所以需要反转逻辑
                    if (m.sender !== 'me') {
                        isOwnerSender = true;
                    }
                } else {
                    // 虚拟历史数据结构：
                    // 通常生成的格式是 Sender = 'Me'/'我'/'主人名' 表示主人发送
                    // Sender = 'Mom'/'Boss' 等表示对方发送
                    const s = m.sender.toLowerCase();
                    if (s === 'me' || s === '我' || s === ownerName.toLowerCase()) {
                        isOwnerSender = true;
                    }
                }
                
                // 时间显示（简单处理，避免过多重复）
                // 实际项目中可以增加判断，只在间隔较久时显示时间
                const timeDiv = document.createElement('div');
                timeDiv.className = 'phone-chat-time';
                // 处理时间格式，兼容真实时间戳和生成的时间字符串
                let timeDisplay = m.time;
                if (typeof m.time === 'number') {
                    const d = new Date(m.time);
                    timeDisplay = `${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`;
                }
                timeDiv.innerText = timeDisplay;
                h.appendChild(timeDiv);

                const row = document.createElement('div');
                row.className = 'msg-row' + (isOwnerSender ? ' me' : '');

                const avatar = document.createElement('img');
                avatar.className = 'avatar';
                avatar.src = isOwnerSender ? ownerAvatarSrc : otherAvatarSrc;
                
                const bubble = document.createElement('div');
                bubble.className = 'bubble';
                // 处理特殊消息类型文本
                if (m.type === 'image') bubble.innerText = m.fakeImgDesc ? '[图片] ' + m.fakeImgDesc : (m.stickerName ? '[表情]' : '[图片]');
                else if (m.type === 'voice') bubble.innerText = '[语音]';
                else if (m.type === 'location') bubble.innerText = '[位置]';
                else if (m.type === 'transfer') bubble.innerText = '[转账]';
                else if (m.type === 'redpacket') bubble.innerText = '[红包]';
                else bubble.innerText = m.content;
                
                // 组装DOM
                // 注意：CSS样式 .msg-row.me 会自动处理 flex-direction: row-reverse
                row.appendChild(avatar);
                row.appendChild(bubble);
                
                h.appendChild(row);
            });
            
            // 确保滚动到底部
            setTimeout(() => {
                if (h) h.scrollTop = h.scrollHeight;
            }, 100);
        }

        function renderPhoneMemos() {
             const l = document.getElementById('phone-memo-list');
             // [FIX-类型守卫v8] 强制归一化为数组，防止持久化数据污染导致 .map is not a function
             if (!Array.isArray(store.phoneData.memo)) store.phoneData.memo = [];
             const _memoArr = store.phoneData.memo;
             l.innerHTML = _memoArr.map((m,i) =>
                 `<div class="memo-item" onclick="openMemoDetail(${i})">
                    <div class="memo-title">${renderWithTranslation(m.title, 'memo_title_'+i)}</div>
                    <div class="memo-date">${m.date}</div>
                    <div style="font-size:13px; color:#666; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; margin-top:5px;">${renderWithTranslation(m.content, 'memo_content_'+i)}</div>
                 </div>`
             ).join('');
             _injectPhoneBatchTranslateBtn('phone-memo-list');
        }

        function openMemoDetail(idx) {
             const m = store.phoneData.memo[idx];
             document.getElementById('memo-det-title').innerHTML = renderWithTranslation(m.title, 'memo_det_title_'+idx);
             document.getElementById('memo-det-date').innerText = m.date;
             document.getElementById('memo-det-content').innerHTML = renderWithTranslation(m.content, 'memo_det_content_'+idx);
             document.getElementById('phone-memo-detail').style.display = 'flex';
             
             // 触发AI评论：对备忘录内容进行评论
             if (Math.random() > 0.4 && activeCheckPhoneContactName) { // 60%概率触发
                 const contentPreview = m.content.substring(0, 80);
                 setTimeout(() => {
                     triggerPhoneComment('备忘录', `标题：${m.title}\n内容：${contentPreview}`, activeCheckPhoneContactName);
                 }, 1000);
             }
        }

        function renderPhoneSearch() {
             const l = document.getElementById('phone-search-list');
             // [FIX-类型守卫v8] 强制归一化为数组
             if (!Array.isArray(store.phoneData.search)) store.phoneData.search = [];
             const searchArr = store.phoneData.search;
             if(searchArr.length === 0) {
                 l.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">暂无搜索记录</div>';
                 return;
             }
             
             const previewEl = document.getElementById('preview-search');
             if(previewEl) previewEl.innerText = `最近24小时搜索了${searchArr.length}条内容`;

             // [FIX-搜索引擎] 根据语言显示对应的搜索引擎
             const _searchEngine = (store.phoneData._langInfo && store.phoneData._langInfo.isForeign)
                 ? (PHONE_LOCALE_CONFIG[store.phoneData._langInfo.locale] || {}).searchEngine || 'Google'
                 : '百度搜索';
             l.innerHTML = searchArr.map((s, i) =>
                 `<div class="browser-item" onclick="toggleSearchExpand(${i})">
                    <div class="browser-header">
                        <div class="browser-icon"><i class="fas fa-search"></i></div>
                        <div class="browser-info">
                            <div class="browser-query">${renderWithTranslation(s.query, 'search_q_'+i)}</div>
                            <div class="browser-url">${_searchEngine} · ${s.time}</div>
                        </div>
                        <i class="fas fa-chevron-down" style="color:#ddd; font-size:12px; transition:transform 0.2s;" id="search-arrow-${i}"></i>
                    </div>
                    <div class="search-expand-panel" id="search-panel-${i}" onclick="event.stopPropagation()">
                        <div class="search-res-title">${renderWithTranslation(s.resultTitle || '搜索结果加载中...', 'search_title_'+i)}</div>
                        <div class="search-res-desc">${renderWithTranslation(s.resultDesc || '...', 'search_desc_'+i)}</div>
                        <div class="search-ai-note"><i class="fas fa-mouse-pointer"></i> ${renderWithTranslation(s.clickReason || '点击了此结果', 'search_reason_'+i)}</div>
                        <div class="search-read-btn" onclick="event.stopPropagation();openSearchArticle(${i})"><i class="fas fa-book-open"></i> 查看完整文章</div>
                    </div>
                 </div>`
             ).join('');
             _injectPhoneBatchTranslateBtn('phone-search-list');
        }

        function openSearchArticle(idx) {
            const s = store.phoneData.search[idx];
            if(!s) return;
            document.getElementById('search-article-title').textContent = s.resultTitle || '文章详情';
            const contentEl = document.getElementById('search-article-content');
            let articleHtml = `<div style="font-size:20px; font-weight:bold; color:#222; margin-bottom:12px;">${s.resultTitle}</div>`;
            articleHtml += `<div style="font-size:12px; color:#999; margin-bottom:16px;">来源：百度搜索 · ${s.time}</div>`;
            articleHtml += `<div style="font-size:12px; color:#576b95; margin-bottom:16px; padding:8px 12px; background:#f0f3f7; border-radius:8px;"><i class="fas fa-search"></i> 搜索关键词：${s.query}</div>`;
            if(s.articleContent) {
                articleHtml += `<div style="font-size:15px; line-height:1.8; color:#333; white-space:pre-wrap;">${s.articleContent}</div>`;
            } else {
                articleHtml += `<div style="font-size:15px; line-height:1.8; color:#333;">${s.resultDesc || '暂无详细内容'}</div>`;
            }
            articleHtml += `<div style="margin-top:20px; padding:12px; background:#f9f9f9; border-radius:8px; font-size:13px; color:#888;"><i class="fas fa-info-circle"></i> ${s.clickReason}</div>`;
            contentEl.innerHTML = articleHtml;
            document.getElementById('layer-phone-search-article').classList.add('show');
        }

        function toggleSearchExpand(idx) {
            const panel = document.getElementById(`search-panel-${idx}`);
            const arrow = document.getElementById(`search-arrow-${idx}`);
            const isHidden = panel.style.display === 'none' || panel.style.display === '';
            
            // Close others
            document.querySelectorAll('.search-expand-panel').forEach(p => p.style.display = 'none');
            document.querySelectorAll('[id^="search-arrow-"]').forEach(a => a.style.transform = 'rotate(0deg)');
            
            if(isHidden) {
                panel.style.display = 'block';
                arrow.style.transform = 'rotate(180deg)';
                
                // 触发AI评论：对搜索记录进行评论
                if (Math.random() > 0.5 && activeCheckPhoneContactName && store.phoneData.search[idx]) {
                    const s = store.phoneData.search[idx];
                    setTimeout(() => {
                        triggerPhoneComment('搜索记录', `搜索：${s.query}\n原因：${s.clickReason}`, activeCheckPhoneContactName);
                    }, 800);
                }
            }
        }
        
        function renderPhoneUsage() {
            const container = document.getElementById('phone-usage-content');
            // [FIX-类型守卫v10] 先尝试用Object.values恢复数据，再兜底为空数组
            _normalizePhoneDataArrays(store.phoneData);
            if (!Array.isArray(store.phoneData.usage)) store.phoneData.usage = [];
            if(store.phoneData.usage.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">暂无使用数据</div>';
                return;
            }

            // [FIX-屏幕时间] 使用确定性计算，避免每次渲染随机变化
            const appEvents = store.phoneData.usage.filter(u => u.type === 'App');
            const hours = Math.floor(appEvents.length * 0.5) + 1;
            // 用联系人名的charCode生成稳定的分钟数
            const _nameHash = (activeCheckPhoneContactName || 'x').split('').reduce((s,c) => s + c.charCodeAt(0), 0);
            const stableMinutes = (_nameHash * 7 + appEvents.length * 13) % 59;
            
            const previewEl = document.getElementById('preview-usage');
            if(previewEl) previewEl.innerText = `今日屏幕使用时长：${hours}小时${stableMinutes}分`;

            let html = `
                <div class="timeline-container">
            `;
            
            store.phoneData.usage.forEach((u, uIdx) => {
                let icon = 'circle';
                if(u.type === 'App') icon = 'mobile-alt';
                if(u.type === 'Sys') icon = 'cog';
                if(u.desc.includes('充电')) icon = 'bolt';
                if(u.desc.includes('Wi-Fi')) icon = 'wifi';
                
                html += `
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-time">${u.time}</div>
                        <div class="timeline-content">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <i class="fas fa-${icon}" style="color:var(--primary); opacity:0.7;"></i>
                                <span>${renderWithTranslation(u.desc, 'usage_'+uIdx)}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
            container.innerHTML = html;
            _injectPhoneBatchTranslateBtn('phone-usage-content');
        }

        function renderPhoneShopping() {
            const l = document.getElementById('phone-shopping-list');
            // [FIX-类型守卫v10] 先尝试用Object.values恢复数据，再兜底为空数组
            _normalizePhoneDataArrays(store.phoneData);
            const _shopArr = Array.isArray(store.phoneData.shopping) ? store.phoneData.shopping : [];
            if(_shopArr.length === 0) {
                l.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">购物车空空如也</div>';
                return;
            }
            
            const purchases = _shopArr.filter(s => s.type === 'purchase' || !s.type);
            const favorites = _shopArr.filter(s => s.type === 'favorite');
            
            const previewEl = document.getElementById('preview-shopping');
            if(previewEl) previewEl.innerText = `今日购买${purchases.length}件 · 收藏${favorites.length}件`;

            let html = '';
            if(purchases.length > 0) {
                html += `<div class="shop-section-title"><i class="fas fa-shopping-bag" style="color:#fa5151;"></i> 今日购买</div>`;
                html += purchases.map((s, si) => `
                    <div class="shopping-card">
                        <div class="shop-icon" style="background:#fff2f0;"><i class="fas fa-shopping-bag" style="color:#fa5151;"></i></div>
                        <div class="shop-info">
                            <div class="shop-title">${renderWithTranslation(s.item, 'shop_item_'+si)}</div>
                            <div class="shop-meta">
                                <span><i class="fas fa-store-alt"></i> ${s.platform}</span>
                                <span style="color:#fa5151; font-weight:bold;">${s.price}</span>
                            </div>
                            <div class="shop-note">${renderWithTranslation(s.reason, 'shop_reason_'+si)}</div>
                        </div>
                    </div>
                `).join('');
            }
            if(favorites.length > 0) {
                html += `<div class="shop-section-title" style="margin-top:16px;"><i class="far fa-heart" style="color:#ff6b81;"></i> 收藏夹</div>`;
                html += favorites.map((s, fi) => `
                    <div class="shopping-card" style="border-left:3px solid #ff6b81;">
                        <div class="shop-icon" style="background:#fff0f3;"><i class="far fa-heart" style="color:#ff6b81;"></i></div>
                        <div class="shop-info">
                            <div class="shop-title">${renderWithTranslation(s.item, 'fav_item_'+fi)}</div>
                            <div class="shop-meta">
                                <span><i class="fas fa-store-alt"></i> ${s.platform}</span>
                                <span style="color:#fa5151; font-weight:bold;">${s.price}</span>
                            </div>
                            <div class="shop-note">${renderWithTranslation(s.reason, 'fav_reason_'+fi)}</div>
                        </div>
                    </div>
                `).join('');
            }
            l.innerHTML = html;
            _injectPhoneBatchTranslateBtn('phone-shopping-list');
            
            // 触发AI评论
            // [FIX-类型守卫v9] 使用已归一化的 _shopArr 而非 store.phoneData.shopping，防止 .length 在非数组上报错
            if (Math.random() > 0.5 && activeCheckPhoneContactName && _shopArr.length > 0) {
                const randomItem = _shopArr[Math.floor(Math.random() * _shopArr.length)];
                setTimeout(() => {
                    triggerPhoneComment('购物记录', `商品：${randomItem.item}\n原因：${randomItem.reason}`, activeCheckPhoneContactName);
                }, 1200);
            }
        }

        function renderPhoneInterests() {
            const c = document.getElementById('phone-interests-content');
            // [FIX-类型守卫v8] 强制归一化为数组
            if (!Array.isArray(store.phoneData.interests)) store.phoneData.interests = [];
            if(store.phoneData.interests.length === 0) {
                c.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">暂无数据</div>';
                return;
            }

            const previewEl = document.getElementById('preview-interests');
            if(previewEl) {
                const topKw = store.phoneData.interests.slice(0,2).map(k=>k.keyword).join('、');
                previewEl.innerText = `近期高频词：${topKw}`;
            }

            let html = `<div class="interest-cloud">`;
            store.phoneData.interests.forEach((int, i) => {
                const isHot = int.heat > 7;
                html += `<div class="interest-tag ${isHot ? 'hot' : ''}" onclick="toggleInterestEvidence(${i})">
                    ${renderWithTranslation(int.keyword, 'int_kw_'+i)} ${isHot ? '<i class="fas fa-fire"></i>' : ''}
                </div>`;
            });
            html += `</div><div id="interest-evidence-area" class="interest-evidence"></div>`;
            
            c.innerHTML = html;
            _injectPhoneBatchTranslateBtn('phone-interests-content');
        }

        function toggleInterestEvidence(idx) {
            const area = document.getElementById('interest-evidence-area');
            const int = store.phoneData.interests[idx];
            area.innerHTML = `
                <div style="font-weight:bold; margin-bottom:5px; color:#333;">关联线索：</div>
                <div class="evidence-box">"${renderWithTranslation(int.evidence, 'int_ev_'+idx)}"</div>
            `;
            area.style.display = 'block';
            
            // 触发AI评论：对兴趣关键词进行评论
            if (Math.random() > 0.4 && activeCheckPhoneContactName) {
                setTimeout(() => {
                    triggerPhoneComment('兴趣雷达', `关键词：${int.keyword}\n热度：${int.heat}/10\n线索：${int.evidence}`, activeCheckPhoneContactName);
                }, 800);
            }
        }

        // --- ASSETS RENDER ---
        function renderPhoneAssets() {
            const c = document.getElementById('phone-assets-content');
            const a = store.phoneData.assets;
            if(!a) {
                c.innerHTML = '<div style="text-align:center; padding:40px 20px; color:#999; font-size:14px;">暂无资产数据</div>';
                return;
            }
            // [FIX-货币符号] 根据语言使用正确的货币符号
            const _assetCurrency = (store.phoneData._langInfo && store.phoneData._langInfo.isForeign)
                ? (PHONE_LOCALE_CONFIG[store.phoneData._langInfo.locale] || {}).currency || '¥'
                : '¥';
            let html = '<div style="padding:4px 0;">';
            html += `<div class="asset-section">
                <div class="asset-section-header"><i class="fas fa-wallet" style="color:#1a1a1a;"></i> 钱包余额</div>
                <div class="asset-wallet-balance">${_assetCurrency} ${Number(a.wallet).toLocaleString('zh-CN', {minimumFractionDigits:2})}</div>
            </div>`;
            if(a.stocks && a.stocks.length > 0) {
                html += `<div class="asset-section">
                    <div class="asset-section-header"><i class="fas fa-chart-line" style="color:#1a1a1a;"></i> 股票持仓</div>`;
                a.stocks.forEach((s, si) => {
                    const isUp = s.profit && s.profit.trim().startsWith('+');
                    html += `<div class="asset-item">
                        <div class="asset-item-name">${renderWithTranslation(s.name, 'stock_'+si)}</div>
                        <div class="asset-item-detail">${s.shares}股 × ${_assetCurrency}${s.price}</div>
                        <div class="asset-item-value ${isUp ? 'up' : 'down'}">${s.profit}</div>
                    </div>`;
                });
                html += `</div>`;
            }
            if(a.funds && a.funds.length > 0) {
                html += `<div class="asset-section">
                    <div class="asset-section-header"><i class="fas fa-piggy-bank" style="color:#1a1a1a;"></i> 理财/基金</div>`;
                a.funds.forEach((f, fi) => {
                    html += `<div class="asset-item">
                        <div class="asset-item-name">${renderWithTranslation(f.name, 'fund_'+fi)} <span style="font-size:11px; color:#bbb; font-weight:400;">${f.type}</span></div>
                        <div class="asset-item-detail">投入 ${f.invested} → 当前 ${f.current}</div>
                    </div>`;
                });
                html += `</div>`;
            }
            if(a.cards && a.cards.length > 0) {
                html += `<div class="asset-section">
                    <div class="asset-section-header"><i class="fas fa-credit-card" style="color:#1a1a1a;"></i> 银行卡 (${a.cards.length}张)</div>`;
                a.cards.forEach((cd, ci) => {
                    html += `<div class="asset-card-item">
                        <div class="asset-card-bank">${renderWithTranslation(cd.bank, 'card_'+ci)}</div>
                        <div class="asset-card-type">${cd.type} **** ${cd.lastFour}</div>
                        <div class="asset-card-balance">${_assetCurrency} ${cd.balance}</div>
                    </div>`;
                });
                html += `</div>`;
            }
            if(a.houses && a.houses.length > 0) {
                html += `<div class="asset-section">
                    <div class="asset-section-header"><i class="fas fa-home" style="color:#1a1a1a;"></i> 房产 (${a.houses.length}套)</div>`;
                a.houses.forEach((h, hi) => {
                    html += `<div class="asset-house-item">
                        <div class="asset-house-addr">${renderWithTranslation(h.address, 'house_'+hi)}</div>
                        <div class="asset-house-info">${h.type} · ${h.area}㎡</div>
                        <div class="asset-house-value">估值 ${_assetCurrency}${h.value}</div>
                    </div>`;
                });
                html += `</div>`;
            }
            if(a.cars && a.cars.length > 0) {
                html += `<div class="asset-section">
                    <div class="asset-section-header"><i class="fas fa-car" style="color:#1a1a1a;"></i> 车辆 (${a.cars.length}辆)</div>`;
                a.cars.forEach((car, cri) => {
                    html += `<div class="asset-car-item">
                        <div class="asset-car-brand">${renderWithTranslation(car.brand + ' ' + car.model, 'car_'+cri)}</div>
                        <div class="asset-car-info">${car.year}年 · 估值 ${_assetCurrency}${car.value}</div>
                    </div>`;
                });
                html += `</div>`;
            }
            html += '</div>';
            c.innerHTML = html;
            _injectPhoneBatchTranslateBtn('phone-assets-content');
        }

        // --- SMS RENDER (iOS Messages 风格) ---
        function renderPhoneSMS() {
            const l = document.getElementById('phone-sms-list');
            // [FIX-类型守卫v8] 强制归一化为数组
            if (!Array.isArray(store.phoneData.sms)) store.phoneData.sms = [];
            const smsList = store.phoneData.sms;
            if (smsList.length === 0) {
                l.innerHTML = '<div style="text-align:center; padding:40px; color:#8e8e93; font-size:14px;">暂无短信</div>';
                return;
            }
            const typeLabels = { personal: '个人', bank: '银行', delivery: '快递', verification: '验证码', spam: '骚扰', promotion: '营销', service: '服务' };
            l.innerHTML = smsList.map((s, i) => `
                <div class="sms-item ${s.read ? '' : 'sms-unread'}" onclick="openSmsDetail(${i})">
                    ${!s.read ? '<div class="sms-unread-dot"></div>' : ''}
                    <div class="sms-avatar">${(s.sender || '?')[0]}</div>
                    <div class="sms-body">
                        <div class="sms-header">
                            <span class="sms-sender">${renderWithTranslation(s.sender, 'sms_sender_'+i)}</span>
                            <span class="sms-time">${s.time}</span>
                        </div>
                        <div class="sms-preview">${renderWithTranslation((s.content || '').substring(0, 40) + ((s.content || '').length > 40 ? '...' : ''), 'sms_preview_'+i)}</div>
                    </div>
                    <i class="fas fa-chevron-right sms-chevron"></i>
                </div>
            `).join('');
            _injectPhoneBatchTranslateBtn('phone-sms-list');
        }

        function openSmsDetail(idx) {
            const sms = (store.phoneData.sms || [])[idx];
            if (!sms) return;
            sms.read = true;
            const detailEl = document.getElementById('sms-detail-content');
            detailEl.innerHTML = `
                <div class="sms-detail-header">${renderWithTranslation(sms.sender, 'sms_det_sender_'+idx)}</div>
                <div class="sms-time-divider">${sms.time}</div>
                <div class="sms-detail-bubbles">
                    <div class="sms-bubble-left">${renderWithTranslation(sms.content, 'sms_det_content_'+idx)}</div>
                </div>
            `;
            document.getElementById('layer-phone-sms-detail').classList.add('show');
            // 触发AI评论
            if (Math.random() > 0.5 && activeCheckPhoneContactName) {
                setTimeout(() => {
                    triggerPhoneComment('短信', `来自${sms.sender}的短信：${sms.content}`, activeCheckPhoneContactName);
                }, 800);
            }
            renderPhoneSMS();
        }

        // ========== [NEW] PHOTOS RENDER ==========
        function renderPhonePhotos() {
            const c = document.getElementById('phone-photos-content');
            // [FIX-类型守卫v8] 强制归一化为数组
            if (!Array.isArray(store.phoneData.photos)) store.phoneData.photos = [];
            const photos = store.phoneData.photos;
            if (photos.length === 0) { c.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">暂无照片</div>'; return; }
            const typeIcons = { selfie: 'fa-camera', food: 'fa-utensils', scenery: 'fa-mountain', screenshot: 'fa-mobile-alt', life: 'fa-leaf', people: 'fa-users' };
            const typeBg = { selfie: '#f0f0f0', food: '#f5f5f0', scenery: '#f0f5f0', screenshot: '#eef0f5', life: '#f5f0f0', people: '#f0f0f5' };
            c.innerHTML = '<div class="cp-photos-grid">' + photos.map((p, i) => {
                const icon = typeIcons[p.type] || 'fa-image';
                const bg = typeBg[p.type] || '#f0f0f0';
                return `<div class="cp-photo-card" onclick="cpOpenPhotoDetail(${i})">
                    <div class="cp-photo-thumb" style="background:${bg};">
                        <i class="fas ${icon}" style="font-size:28px;color:#999;"></i>
                    </div>
                    <div class="cp-photo-meta">
                        <span class="cp-photo-time">${p.time}</span>
                        <span class="cp-photo-loc">${renderWithTranslation(p.location || '', 'photo_loc_'+i)}</span>
                    </div>
                </div>`;
            }).join('') + '</div>';
            _injectPhoneBatchTranslateBtn('phone-photos-content');
        }
        window.cpOpenPhotoDetail = function(idx) {
            const p = (store.phoneData.photos || [])[idx];
            if (!p) return;
            var overlay = document.createElement('div');
            overlay.className = 'cp-photo-overlay';
            overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
            var typeLabel = { selfie: '自拍', food: '美食', scenery: '风景', screenshot: '截图', life: '日常', people: '合照' };
            overlay.innerHTML = `<div class="cp-photo-detail">
                <div class="cp-photo-detail-close" onclick="this.closest('.cp-photo-overlay').remove()"><i class="fas fa-times"></i></div>
                <div class="cp-photo-detail-img"><i class="fas fa-${p.type === 'selfie' ? 'camera' : p.type === 'food' ? 'utensils' : p.type === 'scenery' ? 'mountain' : p.type === 'screenshot' ? 'mobile-alt' : p.type === 'people' ? 'users' : 'leaf'}" style="font-size:60px;color:#bbb;"></i></div>
                <div class="cp-photo-detail-info">
                    <div style="font-size:11px;color:#999;margin-bottom:6px;">${p.time} · ${typeLabel[p.type] || p.type}</div>
                    <div style="font-size:14px;color:#333;line-height:1.6;">${renderWithTranslation(p.description, 'photo_desc_'+idx)}</div>
                    <div style="font-size:12px;color:#999;margin-top:8px;"><i class="fas fa-map-marker-alt"></i> ${renderWithTranslation(p.location || '未知地点', 'photo_loc2_'+idx)}</div>
                </div>
            </div>`;
            document.body.appendChild(overlay);
            if (Math.random() > 0.4 && activeCheckPhoneContactName) {
                setTimeout(function() { triggerPhoneComment('相册', '照片：' + p.description.substring(0, 60), activeCheckPhoneContactName); }, 1000);
            }
        };

        // ========== [NEW] CALL LOG RENDER ==========
        function renderPhoneCallLog() {
            const c = document.getElementById('phone-calllog-content');
            // [FIX-类型守卫v8] 强制归一化为数组
            if (!Array.isArray(store.phoneData.calllog)) store.phoneData.calllog = [];
            const calls = store.phoneData.calllog;
            if (calls.length === 0) { c.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">暂无通话记录</div>'; return; }
            const typeConfig = {
                incoming: { icon: 'fa-phone', color: '#333', label: '来电' },
                outgoing: { icon: 'fa-phone', color: '#666', label: '去电' },
                missed: { icon: 'fa-phone-slash', color: '#e74c3c', label: '未接' },
                rejected: { icon: 'fa-phone-slash', color: '#999', label: '已拒' }
            };
            c.innerHTML = '<div class="cp-calllog-list">' + calls.map((cl, i) => {
                const cfg = typeConfig[cl.type] || typeConfig.incoming;
                const durStr = cl.duration > 0 ? (cl.duration >= 60 ? Math.floor(cl.duration / 60) + '分' + (cl.duration % 60) + '秒' : cl.duration + '秒') : '';
                return `<div class="cp-call-item">
                    <div class="cp-call-icon" style="color:${cfg.color};"><i class="fas ${cfg.icon}"></i></div>
                    <div class="cp-call-info">
                        <div class="cp-call-name" style="color:${cl.type === 'missed' ? '#e74c3c' : '#333'};">${renderWithTranslation(cl.name, 'call_name_'+i)}</div>
                        <div class="cp-call-meta">${cfg.label}${durStr ? ' · ' + durStr : ''}</div>
                    </div>
                    <div class="cp-call-time">${cl.time}</div>
                </div>`;
            }).join('') + '</div>';
            _injectPhoneBatchTranslateBtn('phone-calllog-content');
        }

        // ========== [NEW] LOCATION RENDER ==========
        function renderPhoneLocation() {
            const c = document.getElementById('phone-location-content');
            // [FIX-类型守卫v8] 强制归一化为数组
            if (!Array.isArray(store.phoneData.location)) store.phoneData.location = [];
            const locs = store.phoneData.location;
            if (locs.length === 0) { c.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">暂无足迹数据</div>'; return; }
            const catIcons = { home: 'fa-home', work: 'fa-briefcase', transit: 'fa-bus', food: 'fa-utensils', shopping: 'fa-shopping-bag', leisure: 'fa-coffee', other: 'fa-map-pin' };
            c.innerHTML = '<div class="cp-loc-timeline">' + locs.map((loc, i) => {
                const icon = catIcons[loc.category] || 'fa-map-pin';
                const durStr = loc.duration > 0 ? (loc.duration >= 60 ? Math.floor(loc.duration / 60) + 'h' + (loc.duration % 60 > 0 ? (loc.duration % 60) + 'm' : '') : loc.duration + 'min') : '';
                return `<div class="cp-loc-item">
                    <div class="cp-loc-dot"><i class="fas ${icon}"></i></div>
                    <div class="cp-loc-body">
                        <div class="cp-loc-header">
                            <span class="cp-loc-name">${renderWithTranslation(loc.place, 'loc_name_'+i)}</span>
                            <span class="cp-loc-time">${loc.time}</span>
                        </div>
                        <div class="cp-loc-addr">${renderWithTranslation(loc.address, 'loc_addr_'+i)}</div>
                        ${durStr ? '<div class="cp-loc-dur">停留 ' + durStr + '</div>' : ''}
                    </div>
                </div>`;
            }).join('') + '</div>';
            _injectPhoneBatchTranslateBtn('phone-location-content');
        }

        // ========== [NEW] RECENTLY DELETED RENDER ==========
        function renderPhoneDeleted() {
            const c = document.getElementById('phone-deleted-content');
            // [FIX-类型守卫v8] 强制归一化为数组
            if (!Array.isArray(store.phoneData.deleted)) store.phoneData.deleted = [];
            const dels = store.phoneData.deleted;
            if (dels.length === 0) { c.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">暂无已删除项</div>'; return; }
            const typeIcons = { chat: 'fa-comment-slash', photo: 'fa-image', memo: 'fa-sticky-note', search: 'fa-search' };
            const typeLabels = { chat: '聊天消息', photo: '照片', memo: '备忘录', search: '搜索记录' };
            c.innerHTML = '<div class="cp-deleted-list">' + dels.map((d, i) => {
                const icon = typeIcons[d.type] || 'fa-trash';
                return `<div class="cp-deleted-item" onclick="cpToggleDeletedDetail(${i})">
                    <div class="cp-deleted-icon"><i class="fas ${icon}"></i></div>
                    <div class="cp-deleted-body">
                        <div class="cp-deleted-type">${typeLabels[d.type] || d.type}</div>
                        <div class="cp-deleted-preview">${renderWithTranslation(d.preview, 'del_prev_'+i)}</div>
                        <div class="cp-deleted-meta">删除于 ${d.deletedTime} · 原始时间 ${d.originalTime}</div>
                    </div>
                    <div class="cp-deleted-recover">已恢复</div>
                </div>
                <div class="cp-deleted-reason" id="cp-del-reason-${i}" style="display:none;">
                    <div style="font-size:12px;color:#999;margin-bottom:4px;">可能原因：</div>
                    <div style="font-size:13px;color:#555;">${renderWithTranslation(d.reason, 'del_reason_'+i)}</div>
                </div>`;
            }).join('') + '</div>';
            _injectPhoneBatchTranslateBtn('phone-deleted-content');
            if (Math.random() > 0.3 && activeCheckPhoneContactName && dels.length > 0) {
                var rd = dels[Math.floor(Math.random() * dels.length)];
                setTimeout(function() { triggerPhoneComment('最近删除', '被删除的' + (typeLabels[rd.type] || '内容') + '：' + rd.preview.substring(0, 40), activeCheckPhoneContactName); }, 1200);
            }
        }
        window.cpToggleDeletedDetail = function(idx) {
            var el = document.getElementById('cp-del-reason-' + idx);
            if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
        };

        // ========== [NEW] PHONE MANAGER RENDER ==========
        function renderPhoneManager() {
            const c = document.getElementById('phone-manager-content');
            const mgr = store.phoneData.manager;
            if (!mgr) { c.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">暂无数据</div>'; return; }
            
            const usedPct = mgr.storage.total > 0 ? Math.round(mgr.storage.used / mgr.storage.total * 100) : 0;
            const battPct = mgr.battery.percent || 0;
            const screenH = Math.floor((mgr.battery.screenOn || 0) / 60);
            const screenM = (mgr.battery.screenOn || 0) % 60;
            const ramPct = mgr.ram.total > 0 ? Math.round(mgr.ram.used / mgr.ram.total * 100) : 0;

            // SVG环形进度条生成函数
            function ringSVG(pct, size, label, sub) {
                var r = (size - 8) / 2, cx = size / 2, cy = size / 2;
                var circ = 2 * Math.PI * r;
                var offset = circ * (1 - pct / 100);
                return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#eee" stroke-width="6"/>
                    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#333" stroke-width="6" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" style="transition:stroke-dashoffset 0.8s;"/>
                    <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="18" font-weight="700" fill="#111">${label}</text>
                    <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="10" fill="#999">${sub}</text>
                </svg>`;
            }

            let html = '<div class="cp-mgr-page">';
            
            // 三个圆环指标
            html += '<div class="cp-mgr-rings">';
            html += '<div class="cp-mgr-ring-item">' + ringSVG(usedPct, 100, usedPct + '%', '存储') + '<div class="cp-mgr-ring-sub">' + mgr.storage.used.toFixed(1) + '/' + mgr.storage.total + 'GB</div></div>';
            html += '<div class="cp-mgr-ring-item">' + ringSVG(battPct, 100, battPct + '%', '电量') + '<div class="cp-mgr-ring-sub">亮屏' + screenH + 'h' + screenM + 'm</div></div>';
            html += '<div class="cp-mgr-ring-item">' + ringSVG(ramPct, 100, ramPct + '%', '内存') + '<div class="cp-mgr-ring-sub">' + mgr.ram.used.toFixed(1) + '/' + mgr.ram.total + 'GB</div></div>';
            html += '</div>';

            // 存储分类
            if (mgr.categories.length > 0) {
                html += '<div class="cp-mgr-section"><div class="cp-mgr-section-title">存储占用明细</div>';
                var maxSize = Math.max(...mgr.categories.map(c => c.size));
                mgr.categories.forEach(function(cat) {
                    var barW = maxSize > 0 ? Math.round(cat.size / maxSize * 100) : 0;
                    html += '<div class="cp-mgr-bar-row"><span class="cp-mgr-bar-label">' + cat.name + '</span><div class="cp-mgr-bar-track"><div class="cp-mgr-bar-fill" style="width:' + barW + '%;"></div></div><span class="cp-mgr-bar-val">' + cat.size.toFixed(1) + 'GB</span></div>';
                });
                html += '</div>';
            }

            // App使用时长
            if (mgr.appTime.length > 0) {
                html += '<div class="cp-mgr-section"><div class="cp-mgr-section-title">今日App使用时长</div>';
                mgr.appTime.forEach(function(app, i) {
                    var h = Math.floor(app.minutes / 60), m = app.minutes % 60;
                    var timeStr = h > 0 ? h + 'h ' + m + 'min' : m + 'min';
                    html += '<div class="cp-mgr-app-row"><span class="cp-mgr-app-rank">' + (i + 1) + '</span><span class="cp-mgr-app-name">' + app.name + '</span><span class="cp-mgr-app-cat">' + app.category + '</span><span class="cp-mgr-app-time">' + timeStr + '</span></div>';
                });
                html += '</div>';
            }

            // App存储占用
            if (mgr.appSize.length > 0) {
                html += '<div class="cp-mgr-section"><div class="cp-mgr-section-title">App存储占用 Top5</div>';
                mgr.appSize.forEach(function(app) {
                    var sizeStr = app.sizeMB >= 1024 ? (app.sizeMB / 1024).toFixed(1) + 'GB' : Math.round(app.sizeMB) + 'MB';
                    html += '<div class="cp-mgr-app-row"><span class="cp-mgr-app-name" style="flex:1;">' + app.name + '</span><span class="cp-mgr-app-time">' + sizeStr + '</span></div>';
                });
                html += '</div>';
            }

            // 网络使用
            html += '<div class="cp-mgr-section"><div class="cp-mgr-section-title">今日流量</div>';
            html += '<div class="cp-mgr-net-row"><span>Wi-Fi</span><span>' + mgr.network.wifi.toFixed(0) + ' MB</span></div>';
            html += '<div class="cp-mgr-net-row"><span>移动数据</span><span>' + mgr.network.mobile.toFixed(0) + ' MB</span></div>';
            html += '</div>';

            html += '</div>';
            c.innerHTML = html;
        }

        // ========== [ENHANCED] 使用简报 v2 ==========
        // 保留原有 renderPhoneUsage 用于时间线，增加仪表盘头部
        var _origRenderPhoneUsage = renderPhoneUsage;
        renderPhoneUsage = function() {
            const container = document.getElementById('phone-usage-content');
            // [FIX-类型守卫v10] 先尝试用Object.values恢复数据，再兜底为空数组
            _normalizePhoneDataArrays(store.phoneData);
            if (!Array.isArray(store.phoneData.usage)) store.phoneData.usage = [];
            if(store.phoneData.usage.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">暂无使用数据</div>';
                return;
            }

            const appEvents = store.phoneData.usage.filter(u => u.type === 'App');
            const sysEvents = store.phoneData.usage.filter(u => u.type === 'Sys');
            const _nameHash = (activeCheckPhoneContactName || 'x').split('').reduce((s,c) => s + c.charCodeAt(0), 0);
            const totalMin = appEvents.length * 30 + 60 + (_nameHash % 30);
            const hours = Math.floor(totalMin / 60);
            const mins = totalMin % 60;
            const pickups = 15 + (_nameHash % 25);

            // 简易环形图
            function usageRing(pct, size, label, sub) {
                var r = (size - 8) / 2, cx = size / 2, cy = size / 2;
                var circ = 2 * Math.PI * r;
                var offset = circ * (1 - Math.min(pct, 100) / 100);
                return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#f0f0f0" stroke-width="5"/>
                    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#333" stroke-width="5" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})" style="transition:stroke-dashoffset 0.6s;"/>
                    <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="16" font-weight="700" fill="#111">${label}</text>
                    <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="9" fill="#999">${sub}</text>
                </svg>`;
            }

            // 从usage事件中提取App使用排名
            const appCounts = {};
            appEvents.forEach(u => {
                const _desc = (u.desc || u.description || '');
                const appName = _desc.replace(/.*(?:打开|使用|浏览|opened|used)\s*/i, '').replace(/\s*(?:并|and|,).*/i, '').trim().substring(0, 15) || 'App';
                appCounts[appName] = (appCounts[appName] || 0) + 1;
            });
            const topApps = Object.entries(appCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const maxCount = topApps.length > 0 ? topApps[0][1] : 1;

            let dashHtml = '<div class="cp-usage-dashboard">';
            // 统计卡片
            dashHtml += '<div class="cp-usage-stats">';
            dashHtml += '<div class="cp-usage-stat-card">' + usageRing(Math.min(totalMin / 600 * 100, 100), 90, hours + 'h' + mins + 'm', '屏幕时间') + '</div>';
            dashHtml += '<div class="cp-usage-stat-card">' + usageRing(Math.min(pickups / 50 * 100, 100), 90, pickups + '', '拿起次数') + '</div>';
            dashHtml += '<div class="cp-usage-stat-card">' + usageRing(Math.min(appEvents.length / 12 * 100, 100), 90, appEvents.length + '', 'App启动') + '</div>';
            dashHtml += '</div>';

            // App使用排行
            if (topApps.length > 0) {
                dashHtml += '<div class="cp-usage-rank"><div class="cp-usage-rank-title">App使用排行</div>';
                topApps.forEach(function(pair, i) {
                    var w = Math.round(pair[1] / maxCount * 100);
                    dashHtml += '<div class="cp-usage-rank-row"><span class="cp-usage-rank-num">' + (i + 1) + '</span><span class="cp-usage-rank-name">' + pair[0] + '</span><div class="cp-usage-rank-bar"><div class="cp-usage-rank-fill" style="width:' + w + '%;"></div></div></div>';
                });
                dashHtml += '</div>';
            }

            // 24小时热力图
            dashHtml += '<div class="cp-usage-heatmap"><div class="cp-usage-rank-title">24小时活跃度</div><div class="cp-heatmap-grid">';
            for (var hr = 0; hr < 24; hr++) {
                var active = store.phoneData.usage.filter(u => { var t = parseInt(u.time || '0'); return t === hr; }).length;
                var level = active === 0 ? 0 : active === 1 ? 1 : active === 2 ? 2 : 3;
                dashHtml += '<div class="cp-heatmap-cell cp-heat-' + level + '" title="' + hr + ':00"><span>' + hr + '</span></div>';
            }
            dashHtml += '</div></div>';
            dashHtml += '</div>';

            // 详细时间线（原有逻辑）
            dashHtml += '<div class="cp-usage-timeline-title">详细足迹</div>';
            let tlHtml = '<div class="timeline-container">';
            store.phoneData.usage.forEach((u, uIdx) => {
                let icon = 'circle';
                const _uDesc = (u.desc || u.description || '');
                const _uTime = (u.time || '');
                if(u.type === 'App') icon = 'mobile-alt';
                if(u.type === 'Sys') icon = 'cog';
                if(_uDesc.includes('充电')) icon = 'bolt';
                if(_uDesc.includes('Wi-Fi')) icon = 'wifi';
                tlHtml += `<div class="timeline-item"><div class="timeline-dot"></div><div class="timeline-time">${_uTime}</div><div class="timeline-content"><div style="display:flex;align-items:center;gap:8px;"><i class="fas fa-${icon}" style="color:#555;opacity:0.7;"></i><span>${renderWithTranslation(_uDesc, 'usage_'+uIdx)}</span></div></div></div>`;
            });
            tlHtml += '</div>';

            container.innerHTML = dashHtml + tlHtml;
            _injectPhoneBatchTranslateBtn('phone-usage-content');
        };

        // ========== [ENHANCED] 兴趣雷达 v2 ==========
        var _origRenderPhoneInterests = renderPhoneInterests;
        renderPhoneInterests = function() {
            const c = document.getElementById('phone-interests-content');
            const interests = Array.isArray(store.phoneData.interests) ? store.phoneData.interests : [];
            if(interests.length === 0) {
                c.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">暂无数据</div>';
                return;
            }

            const maxHeat = Math.max(...interests.map(i => i.heat || 0), 1);

            // SVG雷达图
            function radarSVG(data) {
                var n = Math.min(data.length, 8);
                if (n < 3) n = 3;
                var items = data.slice(0, n);
                var size = 220, cx = size / 2, cy = size / 2, maxR = 80;
                var svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
                // 绘制3层网格
                for (var lv = 1; lv <= 3; lv++) {
                    var r = maxR * lv / 3;
                    var pts = [];
                    for (var j = 0; j < n; j++) {
                        var angle = (Math.PI * 2 / n) * j - Math.PI / 2;
                        pts.push((cx + r * Math.cos(angle)).toFixed(1) + ',' + (cy + r * Math.sin(angle)).toFixed(1));
                    }
                    svg += `<polygon points="${pts.join(' ')}" fill="none" stroke="#e0e0e0" stroke-width="0.8"/>`;
                }
                // 绘制轴线
                for (var j = 0; j < n; j++) {
                    var angle = (Math.PI * 2 / n) * j - Math.PI / 2;
                    svg += `<line x1="${cx}" y1="${cy}" x2="${(cx + maxR * Math.cos(angle)).toFixed(1)}" y2="${(cy + maxR * Math.sin(angle)).toFixed(1)}" stroke="#e0e0e0" stroke-width="0.5"/>`;
                }
                // 绘制数据多边形
                var dataPts = [];
                for (var j = 0; j < n; j++) {
                    var angle = (Math.PI * 2 / n) * j - Math.PI / 2;
                    var val = (items[j].heat || 0) / 10;
                    var r2 = maxR * Math.max(val, 0.1);
                    dataPts.push((cx + r2 * Math.cos(angle)).toFixed(1) + ',' + (cy + r2 * Math.sin(angle)).toFixed(1));
                }
                svg += `<polygon points="${dataPts.join(' ')}" fill="rgba(0,0,0,0.08)" stroke="#333" stroke-width="1.5"/>`;
                // 数据点 + 标签
                for (var j = 0; j < n; j++) {
                    var angle = (Math.PI * 2 / n) * j - Math.PI / 2;
                    var val = (items[j].heat || 0) / 10;
                    var r2 = maxR * Math.max(val, 0.1);
                    var px = cx + r2 * Math.cos(angle), py = cy + r2 * Math.sin(angle);
                    svg += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="#333"/>`;
                    var lx = cx + (maxR + 18) * Math.cos(angle), ly = cy + (maxR + 18) * Math.sin(angle);
                    var anchor = Math.abs(Math.cos(angle)) < 0.3 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
                    var kw = (items[j].keyword || '').substring(0, 6);
                    svg += `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="${anchor}" font-size="10" fill="#666">${kw}</text>`;
                }
                svg += '</svg>';
                return svg;
            }

            // AI画像总结（基于已有数据）
            var topKws = interests.slice(0, 3).map(i => i.keyword).join('、');
            var avgHeat = (interests.reduce((s, i) => s + (i.heat || 0), 0) / interests.length).toFixed(1);

            let html = '<div class="cp-interest-page">';
            // 雷达图
            html += '<div class="cp-interest-radar">' + radarSVG(interests) + '</div>';
            // AI画像
            html += '<div class="cp-interest-summary"><div class="cp-interest-summary-title">兴趣画像</div>';
            html += '<div class="cp-interest-summary-text">近期最关注：' + topKws + '（平均热度 ' + avgHeat + '/10）</div></div>';

            // 分类标签云
            html += '<div class="cp-interest-tags">';
            interests.forEach(function(int, i) {
                var isHot = int.heat > 7;
                var heatBar = Math.round((int.heat || 0) / 10 * 100);
                html += `<div class="cp-interest-tag-v2 ${isHot ? 'hot' : ''}" onclick="toggleInterestEvidence(${i})">
                    <div class="cp-itag-kw">${renderWithTranslation(int.keyword, 'int_kw_'+i)}</div>
                    <div class="cp-itag-bar"><div class="cp-itag-bar-fill" style="width:${heatBar}%;"></div></div>
                    <div class="cp-itag-heat">${int.heat}/10</div>
                </div>`;
            });
            html += '</div>';
            html += '<div id="interest-evidence-area" class="interest-evidence"></div>';
            html += '</div>';

            c.innerHTML = html;
            _injectPhoneBatchTranslateBtn('phone-interests-content');
        };

        // --- BUBBLE CUSTOMIZATION ---
        function updateBubblePreview() {
            const bubbleSize = document.getElementById('bubble-size-slider').value;
            const bubblePadding = document.getElementById('bubble-padding-slider').value;
            const bubbleSpacing = document.getElementById('bubble-spacing-slider').value;
            const bubbleGap = document.getElementById('bubble-gap-slider').value;
            const avatarSize = document.getElementById('avatar-size-slider').value;
            const avatarRadius = document.getElementById('avatar-radius-slider').value;
            const bubbleFontSize = document.getElementById('bubble-font-size-slider')?.value || 15;
            
            // Update value displays
            document.getElementById('bubble-size-val').innerText = bubbleSize + 'px';
            document.getElementById('bubble-padding-val').innerText = bubblePadding + 'px';
            document.getElementById('bubble-spacing-val').innerText = bubbleSpacing;
            document.getElementById('bubble-gap-val').innerText = bubbleGap + 'px';
            document.getElementById('avatar-size-val').innerText = avatarSize + 'px';
            document.getElementById('avatar-radius-val').innerText = avatarRadius + 'px';
            if (document.getElementById('bubble-font-size-val')) {
                document.getElementById('bubble-font-size-val').innerText = bubbleFontSize + 'px';
            }
            
            // [FIX-头像圆角实时预览] 直接更新所有头像元素的内联样式，确保立即生效
            // 1. 更新预览区域的所有头像及其容器
            const previewAvatars = document.querySelectorAll('#bubble-preview-area .avatar');
            previewAvatars.forEach(avatar => {
                avatar.style.width = avatarSize + 'px';
                avatar.style.height = avatarSize + 'px';
                avatar.style.borderRadius = avatarRadius + 'px';
                // 同步更新头像容器大小，防止溢出或错位
                if (avatar.parentElement && avatar.parentElement.style.position === 'relative') {
                    avatar.parentElement.style.width = avatarSize + 'px';
                    avatar.parentElement.style.height = avatarSize + 'px';
                }
            });
            
            // 2. 更新预览区域的气泡
            const previewBubbles = document.querySelectorAll('#bubble-preview-area .bubble');
            previewBubbles.forEach(bubble => {
                bubble.style.maxWidth = bubbleSize + 'px';
                bubble.style.padding = bubblePadding + 'px ' + (bubblePadding * 1.4) + 'px';
                bubble.style.lineHeight = bubbleSpacing;
                bubble.style.fontSize = bubbleFontSize + 'px';
            });
            
            // 2.5 实时更新预览区域的气泡垂直间距（msg-row margin-bottom）
            const previewRows = document.querySelectorAll('#bubble-preview-area .msg-row');
            previewRows.forEach(row => {
                row.style.marginBottom = bubbleGap + 'px';
            });
            
            // 2.6 同时实时更新所有CSS变量，让聊天界面也能即时看到效果
            const _root = document.documentElement.style;
            _root.setProperty('--bubble-size', bubbleSize + 'px');
            _root.setProperty('--bubble-padding', bubblePadding + 'px ' + (bubblePadding * 1.4) + 'px');
            _root.setProperty('--bubble-spacing', bubbleSpacing);
            _root.setProperty('--bubble-gap', bubbleGap + 'px');
            _root.setProperty('--bubble-font-size', bubbleFontSize + 'px');
            _root.setProperty('--avatar-size', avatarSize + 'px');
            _root.setProperty('--avatar-radius', avatarRadius + 'px');
            
            // 3. 使用动态样式标签更新全局所有元素（强制覆盖自定义CSS中的硬编码值）
            let styleEl = document.getElementById('avatar-preview-override');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'avatar-preview-override';
                document.head.appendChild(styleEl);
            }
            // 使用 !important 确保优先级最高
            // [FIX-预览隔离] 预览CSS选择器限定在 #bubble-preview-area 内
            // 防止预览样式污染聊天界面的气泡（全局 .bubble 选择器会在返回聊天后残留）
            styleEl.innerHTML = `
                /* 气泡样式实时预览 - 仅限预览区域 */
                #bubble-preview-area .bubble {
                    max-width: ${bubbleSize}px !important;
                    padding: ${bubblePadding}px ${Math.round(bubblePadding * 1.4)}px !important;
                    line-height: ${bubbleSpacing} !important;
                    font-size: ${bubbleFontSize}px !important;
                }
                #bubble-preview-area .msg-row {
                    margin-bottom: ${bubbleGap}px !important;
                }
                /* 美化预览区域头像 */
                #bubble-preview-area .avatar {
                    width: ${avatarSize}px !important;
                    height: ${avatarSize}px !important;
                    border-radius: ${avatarRadius}px !important;
                }
                /* 聊天界面头像 */
                #layer-chat .avatar,
                #layer-chat .avatar-wrapper-chat .avatar,
                #layer-chat .msg-row .avatar {
                    width: ${avatarSize}px !important;
                    height: ${avatarSize}px !important;
                    border-radius: ${avatarRadius}px !important;
                }
                /* 联系人列表头像 */
                #contact-list .list-item .avatar {
                    width: ${avatarSize}px !important;
                    height: ${avatarSize}px !important;
                    border-radius: ${avatarRadius}px !important;
                }
                /* 我的页面头像 */
                #tab-me #my-avatar {
                    border-radius: ${avatarRadius}px !important;
                }
            `;
            
            // 4. 同时更新 CSS 变量
            const root = document.documentElement.style;
            root.setProperty('--avatar-size', avatarSize + 'px');
            root.setProperty('--avatar-radius', avatarRadius + 'px');
        }
        
        function applyBubbleStyles() {
            const bubbleSize = document.getElementById('bubble-size-slider').value;
            const bubblePadding = document.getElementById('bubble-padding-slider').value;
            const bubbleSpacing = document.getElementById('bubble-spacing-slider').value;
            const bubbleGap = document.getElementById('bubble-gap-slider').value;
            const avatarSize = document.getElementById('avatar-size-slider').value;
            const avatarRadius = document.getElementById('avatar-radius-slider').value;
            const bubbleFontSize = document.getElementById('bubble-font-size-slider')?.value || 15;
            
            // [FIX-头像圆角应用] 移除临时预览样式标签，让正式的CSS变量生效
            const previewStyleEl = document.getElementById('avatar-preview-override');
            if (previewStyleEl) {
                previewStyleEl.remove();
            }
            
            // Apply to CSS variables
            const root = document.documentElement.style;
            root.setProperty('--bubble-size', bubbleSize + 'px');
            root.setProperty('--bubble-padding', bubblePadding + 'px ' + (bubblePadding * 1.4) + 'px');
            root.setProperty('--bubble-spacing', bubbleSpacing);
            root.setProperty('--bubble-gap', bubbleGap + 'px');
            root.setProperty('--bubble-font-size', bubbleFontSize + 'px');
            root.setProperty('--avatar-size', avatarSize + 'px');
            root.setProperty('--avatar-radius', avatarRadius + 'px');
            
            // [FIX-滑条不生效] 注入高优先级样式，强制覆盖自定义CSS中可能存在的硬编码值
            let bubbleOverride = document.getElementById('bubble-slider-override');
            if (!bubbleOverride) {
                bubbleOverride = document.createElement('style');
                bubbleOverride.id = 'bubble-slider-override';
                document.head.appendChild(bubbleOverride);
            }
            bubbleOverride.innerHTML = `
                /* 滑条设置强制覆盖 */
                .bubble {
                    max-width: ${bubbleSize}px !important;
                    padding: ${bubblePadding}px ${Math.round(bubblePadding * 1.4)}px !important;
                    line-height: ${bubbleSpacing} !important;
                    font-size: ${bubbleFontSize}px !important;
                }
                .msg-row {
                    margin-bottom: ${bubbleGap}px !important;
                }
                .avatar {
                    width: ${avatarSize}px !important;
                    height: ${avatarSize}px !important;
                    border-radius: ${avatarRadius}px !important;
                }
                #layer-chat .avatar-wrapper-chat .avatar,
                #layer-chat .msg-row .avatar {
                    width: ${avatarSize}px !important;
                    height: ${avatarSize}px !important;
                    border-radius: ${avatarRadius}px !important;
                }
                #contact-list .list-item .avatar {
                    width: ${avatarSize}px !important;
                    height: ${avatarSize}px !important;
                    border-radius: ${avatarRadius}px !important;
                }
                #tab-me #my-avatar {
                    border-radius: ${avatarRadius}px !important;
                }
            `;
            
            // [FIX-CSS覆盖] 确保用户自定义CSS的<style>标签始终在bubble-slider-override之后
            _moveCustomStylesToEnd();
            // [FIX-气泡应用还原] _moveCustomStylesToEnd会把custom-style-bubble移到末尾，
            // 如果其中有!important规则会覆盖滑条设置。所以必须把bubble-slider-override重新移到最末尾
            if (bubbleOverride && bubbleOverride.parentNode) {
                document.head.appendChild(bubbleOverride);
            }
            
            // Save to store
            if (!store.bubbleStyles) store.bubbleStyles = {};
            store.bubbleStyles = {
                size: bubbleSize,
                padding: bubblePadding,
                spacing: bubbleSpacing,
                bubbleGap: bubbleGap,
                bubbleFontSize: bubbleFontSize,
                avatarSize: avatarSize,
                avatarRadius: avatarRadius
            };
            save();
            
            toast('样式已应用', 'success');
        }
        
        function resetBubbleStyles() {
            // Reset slider values to defaults
            const sizeSlider = document.getElementById('bubble-size-slider');
            const paddingSlider = document.getElementById('bubble-padding-slider');
            const spacingSlider = document.getElementById('bubble-spacing-slider');
            const gapSlider = document.getElementById('bubble-gap-slider');
            const fontSizeSlider = document.getElementById('bubble-font-size-slider');
            const avatarSizeSlider = document.getElementById('avatar-size-slider');
            const avatarRadiusSlider = document.getElementById('avatar-radius-slider');
            if (sizeSlider) sizeSlider.value = 240;
            if (paddingSlider) paddingSlider.value = 10;
            if (spacingSlider) spacingSlider.value = 1.5;
            if (gapSlider) gapSlider.value = 0;
            if (fontSizeSlider) fontSizeSlider.value = 15;
            if (avatarSizeSlider) avatarSizeSlider.value = 48;
            if (avatarRadiusSlider) avatarRadiusSlider.value = 8;
            
            // [FIX-CSS残留] 清除动态覆盖style标签，避免!important样式残留
            const bubbleOverride = document.getElementById('bubble-slider-override');
            if (bubbleOverride) bubbleOverride.innerHTML = '';
            const avatarPreview = document.getElementById('avatar-preview-override');
            if (avatarPreview) avatarPreview.remove();
            
            // [FIX-CSS残留] 重置CSS变量为默认值
            const root = document.documentElement.style;
            root.removeProperty('--bubble-size');
            root.removeProperty('--bubble-padding');
            root.removeProperty('--bubble-spacing');
            root.removeProperty('--bubble-gap');
            root.removeProperty('--bubble-font-size');
            root.removeProperty('--avatar-size');
            root.removeProperty('--avatar-radius');
            root.removeProperty('--bubble-border');
            root.removeProperty('--bubble-border-me');
            root.removeProperty('--bubble-border-other');
            root.removeProperty('--bubble-radius');
            root.removeProperty('--bubble-left');
            root.removeProperty('--bubble-right');
            
            // [FIX-CSS残留] 清除store中的bubbleStyles数据
            if (store.bubbleStyles) {
                delete store.bubbleStyles;
            }
            save();
            
            // 更新预览显示
            if (typeof updateBubblePreview === 'function') updateBubblePreview();
            
            toast('已重置为默认样式', 'info');
        }
        
        function loadBubbleStyles() {
            if (store.bubbleStyles) {
                const root = document.documentElement.style;
                const bs = store.bubbleStyles;
                const bSize = bs.size || 240;
                const bPadding = bs.padding || 10;
                const bSpacing = bs.spacing || '1.5';
                const bGap = bs.bubbleGap || 0;
                const bFontSize = bs.bubbleFontSize || 15;
                const aSize = bs.avatarSize || 48;
                const aRadius = bs.avatarRadius != null ? bs.avatarRadius : 8;
                
                root.setProperty('--bubble-size', bSize + 'px');
                root.setProperty('--bubble-padding', bPadding + 'px ' + (bPadding * 1.4) + 'px');
                root.setProperty('--bubble-spacing', bSpacing);
                root.setProperty('--bubble-gap', bGap + 'px');
                root.setProperty('--bubble-font-size', bFontSize + 'px');
                root.setProperty('--avatar-size', aSize + 'px');
                root.setProperty('--avatar-radius', aRadius + 'px');
                
                // [FIX-滑条不生效] 页面加载时也注入覆盖样式，确保自定义CSS中的硬编码值被覆盖
                let bubbleOverride = document.getElementById('bubble-slider-override');
                if (!bubbleOverride) {
                    bubbleOverride = document.createElement('style');
                    bubbleOverride.id = 'bubble-slider-override';
                    document.head.appendChild(bubbleOverride);
                }
                bubbleOverride.innerHTML = `
                    .bubble {
                        max-width: ${bSize}px !important;
                        padding: ${bPadding}px ${Math.round(bPadding * 1.4)}px !important;
                        line-height: ${bSpacing} !important;
                        font-size: ${bFontSize}px !important;
                    }
                    .msg-row {
                        margin-bottom: ${bGap}px !important;
                    }
                    .avatar {
                        width: ${aSize}px !important;
                        height: ${aSize}px !important;
                        border-radius: ${aRadius}px !important;
                    }
                    #layer-chat .avatar-wrapper-chat .avatar,
                    #layer-chat .msg-row .avatar {
                        width: ${aSize}px !important;
                        height: ${aSize}px !important;
                        border-radius: ${aRadius}px !important;
                    }
                    #contact-list .list-item .avatar {
                        width: ${aSize}px !important;
                        height: ${aSize}px !important;
                        border-radius: ${aRadius}px !important;
                    }
                    #tab-me #my-avatar {
                        border-radius: ${aRadius}px !important;
                    }
                `;
                // [FIX-CSS覆盖] 确保用户自定义CSS的<style>标签始终在bubble-slider-override之后
                _moveCustomStylesToEnd();
                // [FIX-气泡应用还原] 同applyBubbleStyles：把bubble-slider-override重新移到最末尾
                // 防止自定义CSS中的!important规则覆盖滑条设置
                if (bubbleOverride && bubbleOverride.parentNode) {
                    document.head.appendChild(bubbleOverride);
                }
            }
        }

        // [FIX-滑条不生效] 暴露气泡美化函数到全局作用域，确保HTML中的oninput事件能调用
        window.updateBubblePreview = updateBubblePreview;
        window.applyBubbleStyles = applyBubbleStyles;
        window.resetBubbleStyles = resetBubbleStyles;

        // ========== [FIX-缺失函数] triggerPhoneComment ==========
        // 用户浏览查手机内容时，手机主人(联系人)以浮动气泡发表AI评论
        var _phoneCommentCooldown = 0;
        async function triggerPhoneComment(contentType, contentSummary, contactName) {
            if (!contactName) return;
            // [FIX-查手机冒话] 全局开关：关闭后联系人不会在查手机时冒话
            if (store.phoneCommentDisabled) return;
            // 冷却机制：避免短时间内连续触发
            var now = Date.now();
            if (now - _phoneCommentCooldown < 8000) return;
            _phoneCommentCooldown = now;

            var contact = store.contacts.find(function(c) { return c.name === contactName; });
            if (!contact) return;

            var persona = contact.persona || '';
            var userName = (typeof getUserPersonaName === 'function')
                ? getUserPersonaName(contact, store.user.name || '用户')
                : (store.user.name || '用户');

            // 构建记忆上下文（如果可用）
            var memCtx = '';
            if (typeof buildContactGlobalMemory === 'function') {
                try { memCtx = buildContactGlobalMemory(contact.id, { sections: ['memory'], maxLength: 200 }); } catch(_) {}
            }

            try {
                var data = await API.chatCompletion([
                    { role: 'system', content: '你是' + contactName + '。人设: ' + persona.substring(0, 300) + (memCtx ? '\n记忆: ' + memCtx : '') + '\n\n' + userName + '正在偷看你的手机！TA刚刚查看了你的【' + contentType + '】。你发现了，请用一句话（15-40字）做出反应。反应要符合你的人设性格（可以生气/害羞/调侃/解释/撒谎/威胁等）。只输出反应文字，不要加引号或解释。' },
                    { role: 'user', content: '你发现' + userName + '正在看你的' + contentType + '：\n' + contentSummary.substring(0, 100) }
                ], { scene: 'checkphone_comment' });

                var comment = (data.choices[0].message.content || '').trim().replace(/^["'""]|["'""]$/g, '').substring(0, 60);
                if (!comment) return;

                // 创建浮动评论气泡
                var bubble = document.createElement('div');
                bubble.className = 'cp-comment-bubble';
                bubble.innerHTML = '<div class="cp-comment-avatar">' +
                    (contact.avatar ? '<img src="' + contact.avatar + '" onerror="this.parentElement.textContent=\'' + contactName[0] + '\'">' : contactName[0]) +
                    '</div><div class="cp-comment-text">' + escapeHtml(comment) + '</div>';
                document.body.appendChild(bubble);

                // 动画入场
                requestAnimationFrame(function() { bubble.classList.add('show'); });

                // 自动消失
                setTimeout(function() {
                    bubble.classList.remove('show');
                    bubble.classList.add('hide');
                    setTimeout(function() { if (bubble.parentNode) bubble.parentNode.removeChild(bubble); }, 400);
                }, 4500);
            } catch(e) {
                console.warn('[PhoneComment] 生成评论失败:', e);
            }
        }
        window.triggerPhoneComment = triggerPhoneComment;

