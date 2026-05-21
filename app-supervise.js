        // Auto-restore on load
        setTimeout(restoreReadState, 1000);

        // ========== SUPERVISE SYSTEM ==========
        let svCurrentTab = 'home';
        let svTimerInterval = null;
        let svTimerRemaining = 0;
        let svTimerRunning = false;
        let svCurrentSessionType = 'focus'; // focus | break
        let svSessionCount = 0;
        let svCurrentTaskId = null;
        let svFocusRemaining = 0;
        let svFocusTotal = 0;
        let svIsFocusing = false;
        let svIsPaused = false;
        // [鼓励话语] 监督模式专注期间，每5-8分钟显示鼓励话语
        let svEncourageNextTime = 0; // 下次显示鼓励的剩余秒数
        let svEncourageMsg = ''; // 当前显示的鼓励消息
        let svEncourageFading = false; // 消息是否正在淡出
        let svEncourageGenerating = false; // 是否正在生成AI鼓励

        const SV_CATEGORIES = {
            study: { icon: '📚', name: '学习' },
            work: { icon: '💼', name: '工作' },
            exercise: { icon: '🏃', name: '锻炼' },
            read: { icon: '📖', name: '阅读' },
            code: { icon: '💻', name: '编程' },
            art: { icon: '🎨', name: '创作' },
            meditate: { icon: '🧘', name: '冥想' },
            other: { icon: '✨', name: '其他' }
        };

        const SV_QUOTES = [
            "专注是通往卓越的唯一道路",
            "每一次专注都是对未来的投资",
            "坚持的力量超乎你的想象",
            "今天的努力是明天的收获",
            "不积跬步，无以至千里",
            "专注当下，未来可期",
            "自律给我自由",
            "把每一分钟都用在刀刃上",
            "你的努力，时间都看得见",
            "保持专注，保持热爱"
        ];

        const SV_ACHIEVEMENTS_DEF = [
            { id: 'first_focus', name: '初次专注', icon: '🌱', desc: '完成第一次专注', condition: s => s.totalSessions >= 1 },
            { id: 'focus_10', name: '专注达人', icon: '🔥', desc: '累计完成10次专注', condition: s => s.totalSessions >= 10 },
            { id: 'focus_50', name: '专注大师', icon: '💎', desc: '累计完成50次专注', condition: s => s.totalSessions >= 50 },
            { id: 'focus_100', name: '专注传奇', icon: '👑', desc: '累计完成100次专注', condition: s => s.totalSessions >= 100 },
            { id: 'hours_5', name: '五小时里程碑', icon: '⏰', desc: '累计专注5小时', condition: s => s.totalFocusMinutes >= 300 },
            { id: 'hours_24', name: '一整天', icon: '🌍', desc: '累计专注24小时', condition: s => s.totalFocusMinutes >= 1440 },
            { id: 'streak_3', name: '三天连续', icon: '🔗', desc: '连续3天专注', condition: s => s.currentStreak >= 3 },
            { id: 'streak_7', name: '一周坚持', icon: '🏅', desc: '连续7天专注', condition: s => s.currentStreak >= 7 },
            { id: 'streak_30', name: '月度冠军', icon: '🏆', desc: '连续30天专注', condition: s => s.currentStreak >= 30 },
            { id: 'daily_goal', name: '日标达成', icon: '🎯', desc: '单日完成目标次数', condition: (s, sv) => { const today = new Date().toDateString(); const todaySessions = (sv.sessions || []).filter(x => x.completed && new Date(x.endTime).toDateString() === today).length; return todaySessions >= sv.settings.dailyGoal; } }
        ];

        function getSV() {
            if (!store.supervise) {
                store.supervise = JSON.parse(JSON.stringify(DB.supervise));
            }
            return store.supervise;
        }

        function renderSupervise() {
            // 优先使用嵌入到学习App中的容器
            const area = document.getElementById('supervise-content-embedded') || document.getElementById('supervise-content');
            if (!area) return;
            const sv = getSV();
            if (svCurrentTab === 'home') renderSVHome(area, sv);
            else if (svCurrentTab === 'history') renderSVHistory(area, sv);
            else if (svCurrentTab === 'stats') renderSVStats(area, sv);
        }

        function renderSVHome(area, sv) {
            const today = new Date().toDateString();
            const todaySessions = (sv.sessions || []).filter(s => s.completed && s.type === 'focus' && new Date(s.endTime).toDateString() === today);
            const todayMinutes = todaySessions.reduce((a, s) => a + (s.duration || 0), 0);
            const dailyGoal = sv.settings.dailyGoal || 4;
            const dailyPct = Math.min(100, Math.round((todaySessions.length / dailyGoal) * 100));

            // Weekly data
            const weekData = getWeeklyData(sv);

            // Supervisors
            const supervisors = (sv.supervisors || []).map(s => {
                const c = store.contacts.find(x => x.id === s.contactId);
                return c ? { ...s, name: c.name, avatar: c.avatar || `https://ui-avatars.com/api/?name=${(c.name||'?')[0]}&background=667eea&color=fff` } : null;
            }).filter(Boolean);

            // Active tasks
            const tasks = (sv.tasks || []).filter(t => t.status === 'active');

            area.innerHTML = `
                <div class="sv-home">
                    <div class="sv-home-header">
                        <div class="sv-header-top">
                            <div class="sv-header-back" onclick="exitApp()">
                                <i class="fas fa-chevron-left" style="color:#fff; font-size:16px;"></i>
                            </div>
                            <div style="font-size:18px; font-weight:600;">监督系统</div>
                            <div class="sv-header-actions">
                                <div class="sv-header-action-btn" onclick="openSVAchievements()"><i class="fas fa-trophy" style="color:#fff; font-size:14px;"></i></div>
                                <div class="sv-header-action-btn" onclick="openFocusSettings()"><i class="fas fa-cog" style="color:#fff; font-size:14px;"></i></div>
                            </div>
                        </div>
                        <div style="margin-top:18px; position:relative; z-index:2;">
                            <div style="font-size:28px; font-weight:700;">今日专注</div>
                            <div style="display:flex; align-items:baseline; gap:8px; margin-top:6px;">
                                <span style="font-size:36px; font-weight:200;">${todayMinutes}</span>
                                <span style="font-size:14px; opacity:0.7;">分钟</span>
                                ${sv.stats.currentStreak > 0 ? `<span class="sv-streak-badge" style="margin-left:auto;"><i class="fas fa-fire"></i> ${sv.stats.currentStreak}天</span>` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Stats Cards -->
                    <div class="sv-stats-row">
                        <div class="sv-stat-card">
                            <div class="sv-stat-value">${todaySessions.length}/${dailyGoal}</div>
                            <div class="sv-stat-label">今日次数</div>
                        </div>
                        <div class="sv-stat-card">
                            <div class="sv-stat-value">${sv.stats.totalSessions || 0}</div>
                            <div class="sv-stat-label">累计专注</div>
                        </div>
                        <div class="sv-stat-card">
                            <div class="sv-stat-value">${Math.floor((sv.stats.totalFocusMinutes || 0) / 60)}h</div>
                            <div class="sv-stat-label">总时长</div>
                        </div>
                    </div>

                    <div class="scroll-y" style="padding-bottom:80px;">
                        <!-- Today Progress -->
                        <div class="sv-today-section">
                            <div class="sv-today-progress">
                                <div class="sv-progress-header">
                                    <div class="sv-progress-title">今日目标进度</div>
                                    <div class="sv-progress-count">${dailyPct}%</div>
                                </div>
                                <div class="sv-progress-bar-bg">
                                    <div class="sv-progress-bar-fill" style="width:${dailyPct}%"></div>
                                </div>
                                <div class="sv-progress-detail">
                                    <span>已完成 ${todaySessions.length} 次</span>
                                    <span>目标 ${dailyGoal} 次</span>
                                </div>
                            </div>
                        </div>

                        <!-- Weekly Chart -->
                        <div class="sv-today-section" style="padding-top:0;">
                            <div class="sv-section-header">
                                <div class="sv-section-title">本周概览</div>
                                <div class="sv-section-more" onclick="svCurrentTab='stats';renderSupervise()">查看更多</div>
                            </div>
                            <div class="sv-today-progress">
                                <div class="sv-weekly-chart">
                                    ${weekData.map((d, i) => {
                                        const maxMin = Math.max(...weekData.map(x => x.minutes), 1);
                                        const h = Math.max(4, (d.minutes / maxMin) * 80);
                                        const isToday = d.date === today;
                                        return `<div class="sv-chart-bar-wrap">
                                            <div class="sv-chart-bar ${isToday ? 'today' : ''}" style="height:${h}px;"></div>
                                            <div class="sv-chart-label">${d.label}</div>
                                        </div>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>

                        <!-- Supervisors -->
                        <div class="sv-today-section" style="padding-top:0;">
                            <div class="sv-section-header">
                                <div class="sv-section-title">我的监督人</div>
                            </div>
                            <div class="sv-supervisors-scroll">
                                <div class="sv-supervisor-card" onclick="openAddSupervisor()">
                                    <div class="sv-supervisor-add"><i class="fas fa-plus"></i></div>
                                    <div class="sv-supervisor-name">添加</div>
                                </div>
                                ${supervisors.map(s => `
                                    <div class="sv-supervisor-card" onclick="showSupervisorOptions('${s.contactId}')">
                                        <div class="sv-supervisor-avatar-wrap">
                                            <img class="sv-supervisor-avatar" src="${s.avatar}">
                                            <div class="sv-supervisor-status" style="background:${s.active ? '#4cd137' : '#ccc'};"></div>
                                        </div>
                                        <div class="sv-supervisor-name">${s.name}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Tasks -->
                        <div class="sv-tasks-section">
                            <div class="sv-section-header">
                                <div class="sv-section-title">进行中的任务</div>
                                <div class="sv-section-more" onclick="svCurrentTab='history';renderSupervise()">全部任务</div>
                            </div>
                            ${tasks.length === 0 ? `
                                <div class="sv-empty">
                                    <div class="sv-empty-icon">📋</div>
                                    <div class="sv-empty-text">还没有任务<br>创建一个任务开始专注吧</div>
                                    <button class="sv-empty-btn" onclick="openAddTask()">创建任务</button>
                                </div>
                            ` : tasks.map(t => {
                                const cat = SV_CATEGORIES[t.category] || SV_CATEGORIES.other;
                                const pct = t.totalSessions > 0 ? Math.round((t.completedSessions / t.totalSessions) * 100) : 0;
                                const supervisor = t.supervisorId ? store.contacts.find(c => c.id === t.supervisorId) : null;
                                return `
                                    <div class="sv-task-card" onclick="openTaskDetail('${t.id}')">
                                        <div class="sv-task-icon ${t.category}">${cat.icon}</div>
                                        <div class="sv-task-info">
                                            <div class="sv-task-name">${t.title}</div>
                                            <div class="sv-task-meta">
                                                <span>${cat.name}</span>
                                                <span>${t.completedSessions}/${t.totalSessions}次</span>
                                                ${supervisor ? `<span>👁 ${supervisor.name}</span>` : ''}
                                            </div>
                                            <div class="sv-task-progress-mini" style="margin-top:6px;">
                                                <div class="sv-task-progress-mini-fill" style="width:${pct}%"></div>
                                            </div>
                                        </div>
                                        <div class="sv-task-play-btn" onclick="event.stopPropagation();startFocusForTask('${t.id}')">
                                            <i class="fas fa-play"></i>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Tabs -->
                    <div class="sv-tabs" style="position:absolute; bottom:0; left:0; right:0; background:#fff; z-index:50;">
                        <div class="sv-tab ${svCurrentTab === 'home' ? 'active' : ''}" onclick="svCurrentTab='home';renderSupervise()"><i class="fas fa-home" style="font-size:16px;"></i><div style="font-size:11px; margin-top:2px;">首页</div></div>
                        <div class="sv-tab ${svCurrentTab === 'history' ? 'active' : ''}" onclick="svCurrentTab='history';renderSupervise()"><i class="fas fa-list" style="font-size:16px;"></i><div style="font-size:11px; margin-top:2px;">任务</div></div>
                        <div class="sv-tab ${svCurrentTab === 'stats' ? 'active' : ''}" onclick="svCurrentTab='stats';renderSupervise()"><i class="fas fa-chart-bar" style="font-size:16px;"></i><div style="font-size:11px; margin-top:2px;">统计</div></div>
                    </div>

                    <!-- FAB -->
                    <div class="sv-fab" style="bottom:70px;" onclick="openAddTask()">
                        <i class="fas fa-plus"></i>
                    </div>
                </div>
            `;
        }

        function renderSVHistory(area, sv) {
            const allTasks = sv.tasks || [];
            const activeTasks = allTasks.filter(t => t.status === 'active');
            const completedTasks = allTasks.filter(t => t.status === 'completed');
            const pausedTasks = allTasks.filter(t => t.status === 'paused');
            area.innerHTML = `
                <div class="sv-home">
                    <div style="background:#fff; padding:50px 20px 15px; border-bottom:1px solid #f0f0f5; flex-shrink:0;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="font-size:20px; font-weight:700; color:#1a1a2e;">全部任务</div>
                            <div style="font-size:13px; color:#667eea; cursor:pointer;" onclick="openAddTask()"><i class="fas fa-plus" style="margin-right:4px;"></i>新建</div>
                        </div>
                    </div>
                    <div class="scroll-y" style="padding-bottom:60px;">
                        ${activeTasks.length > 0 ? '<div style="padding:15px 20px 5px; font-size:13px; color:#999; font-weight:600;">进行中 (' + activeTasks.length + ')</div>' + activeTasks.map(t => renderSVTaskItem(t)).join('') : ''}
                        ${pausedTasks.length > 0 ? '<div style="padding:15px 20px 5px; font-size:13px; color:#999; font-weight:600;">已暂停 (' + pausedTasks.length + ')</div>' + pausedTasks.map(t => renderSVTaskItem(t)).join('') : ''}
                        ${completedTasks.length > 0 ? '<div style="padding:15px 20px 5px; font-size:13px; color:#999; font-weight:600;">已完成 (' + completedTasks.length + ')</div>' + completedTasks.map(t => renderSVTaskItem(t)).join('') : ''}
                        ${allTasks.length === 0 ? '<div class="sv-empty"><div class="sv-empty-icon">📋</div><div class="sv-empty-text">还没有任何任务</div><button class="sv-empty-btn" onclick="openAddTask()">创建任务</button></div>' : ''}
                    </div>
                    <div class="sv-tabs" style="position:absolute; bottom:0; left:0; right:0; background:#fff; z-index:50;">
                        <div class="sv-tab ${svCurrentTab === 'home' ? 'active' : ''}" onclick="svCurrentTab='home';renderSupervise()"><i class="fas fa-home" style="font-size:16px;"></i><div style="font-size:11px; margin-top:2px;">首页</div></div>
                        <div class="sv-tab ${svCurrentTab === 'history' ? 'active' : ''}" onclick="svCurrentTab='history';renderSupervise()"><i class="fas fa-list" style="font-size:16px;"></i><div style="font-size:11px; margin-top:2px;">任务</div></div>
                        <div class="sv-tab ${svCurrentTab === 'stats' ? 'active' : ''}" onclick="svCurrentTab='stats';renderSupervise()"><i class="fas fa-chart-bar" style="font-size:16px;"></i><div style="font-size:11px; margin-top:2px;">统计</div></div>
                    </div>
                </div>
            `;
        }

        function renderSVTaskItem(t) {
            const cat = SV_CATEGORIES[t.category] || SV_CATEGORIES.other;
            const pct = t.totalSessions > 0 ? Math.round((t.completedSessions / t.totalSessions) * 100) : 0;
            const statusLabel = t.status === 'completed' ? '<span style="color:#4caf50; font-size:12px;">✓ 已完成</span>' : t.status === 'paused' ? '<span style="color:#ff9800; font-size:12px;">⏸ 暂停</span>' : '';
            return '<div class="sv-history-item" onclick="openTaskDetail(\'' + t.id + '\')" style="cursor:pointer;"><div class="sv-history-icon ' + t.category + '">' + cat.icon + '</div><div class="sv-history-info"><div class="sv-history-title">' + t.title + ' ' + statusLabel + '</div><div class="sv-history-time">' + cat.name + ' · ' + t.completedSessions + '/' + t.totalSessions + '次 · ' + pct + '%</div></div><div class="sv-history-duration"><i class="fas fa-chevron-right" style="color:#ccc;"></i></div></div>';
        }

        let svStatsPeriod = 'week'; // 'week' or 'month'

        function getMonthlyData(sv) {
            const result = [];
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const d = new Date(year, month, day);
                const dateStr = d.toDateString();
                const daySessions = (sv.sessions || []).filter(s => s.completed && s.type === 'focus' && new Date(s.endTime).toDateString() === dateStr);
                const mins = daySessions.reduce((a, s) => a + (s.duration || 0), 0);
                result.push({ date: dateStr, day: day, minutes: mins, sessions: daySessions.length });
            }
            return result;
        }

        function getCategoryStats(sv, periodSessions) {
            const catMap = {};
            periodSessions.forEach(s => {
                const task = (sv.tasks || []).find(t => t.id === s.taskId);
                const catKey = task ? task.category : 'other';
                if (!catMap[catKey]) catMap[catKey] = { minutes: 0, sessions: 0 };
                catMap[catKey].minutes += (s.duration || 0);
                catMap[catKey].sessions += 1;
            });
            return Object.entries(catMap).map(([key, val]) => {
                const cat = SV_CATEGORIES[key] || SV_CATEGORIES.other;
                return { key, icon: cat.icon, name: cat.name, ...val };
            }).sort((a, b) => b.minutes - a.minutes);
        }

        function renderSVStats(area, sv) {
            const weekData = getWeeklyData(sv);
            const monthData = getMonthlyData(sv);
            const isWeek = svStatsPeriod === 'week';
            const dailyGoal = sv.settings.dailyGoal || 4;
            const today = new Date().toDateString();

            // --- Overall totals ---
            const totalHours = Math.floor((sv.stats.totalFocusMinutes || 0) / 60);
            const totalMins = (sv.stats.totalFocusMinutes || 0) % 60;

            // --- Period sessions ---
            const now = new Date();
            let periodStart, periodLabel;
            if (isWeek) {
                periodStart = new Date(now); periodStart.setDate(periodStart.getDate() - 6); periodStart.setHours(0,0,0,0);
                periodLabel = '本周';
            } else {
                periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
                periodLabel = (now.getMonth() + 1) + '月';
            }
            const periodSessions = (sv.sessions || []).filter(s => s.completed && s.type === 'focus' && new Date(s.endTime) >= periodStart);
            const periodMinutes = periodSessions.reduce((a, s) => a + (s.duration || 0), 0);
            const periodHours = Math.floor(periodMinutes / 60);
            const periodMins = periodMinutes % 60;
            const periodCount = periodSessions.length;

            // --- Completion rate ---
            const periodData = isWeek ? weekData : monthData;
            const daysWithGoalMet = periodData.filter(d => d.sessions >= dailyGoal).length;
            const totalPeriodDays = isWeek ? 7 : periodData.length;
            const pastDays = isWeek ? 7 : Math.min(now.getDate(), totalPeriodDays);
            const completionRate = pastDays > 0 ? Math.round((daysWithGoalMet / pastDays) * 100) : 0;

            // --- Average daily ---
            const avgDailyMins = pastDays > 0 ? Math.round(periodMinutes / pastDays) : 0;
            const avgDailySessions = pastDays > 0 ? (periodCount / pastDays).toFixed(1) : '0';

            // --- Category breakdown ---
            const catStats = getCategoryStats(sv, periodSessions);
            const catTotalMins = catStats.reduce((a, c) => a + c.minutes, 0) || 1;

            // --- Chart ---
            const chartData = isWeek ? weekData : monthData;
            const maxChartMin = Math.max(...chartData.map(x => x.minutes), 1);

            let chartHtml = '';
            if (isWeek) {
                chartData.forEach(d => {
                    const h = Math.max(4, (d.minutes / maxChartMin) * 100);
                    const isToday = d.date === today;
                    const goalMet = d.sessions >= dailyGoal;
                    chartHtml += '<div class="sv-chart-bar-wrap">' +
                        '<div style="font-size:10px; color:' + (goalMet ? '#4cd137' : '#667eea') + '; font-weight:600;">' + d.minutes + 'm</div>' +
                        '<div class="sv-chart-bar ' + (isToday ? 'today' : '') + '" style="height:' + h + 'px;' + (goalMet ? 'background:linear-gradient(180deg,#4cd137,#44bd32);' : '') + '"></div>' +
                        '<div class="sv-chart-label">' + d.label + '</div>' +
                        (goalMet ? '<div style="font-size:8px; color:#4cd137;">✓</div>' : '') +
                        '</div>';
                });
            } else {
                // Monthly: show compact bars for each day
                chartData.forEach(d => {
                    const h = Math.max(2, (d.minutes / maxChartMin) * 60);
                    const isToday = d.date === today;
                    const goalMet = d.sessions >= dailyGoal;
                    const isPast = new Date(d.date) <= now;
                    chartHtml += '<div style="display:flex; flex-direction:column; align-items:center; flex:1; min-width:0;">' +
                        '<div style="width:' + (isPast ? '6' : '4') + 'px; height:' + h + 'px; border-radius:3px; background:' +
                        (goalMet ? 'linear-gradient(180deg,#4cd137,#44bd32)' : isToday ? 'linear-gradient(180deg,#667eea,#764ba2)' : isPast ? '#c8d6e5' : '#eee') + ';"></div>' +
                        (d.day % 5 === 0 || d.day === 1 ? '<div style="font-size:8px; color:#999; margin-top:2px;">' + d.day + '</div>' : '') +
                        '</div>';
                });
            }

            // --- Category bars ---
            let catHtml = '';
            if (catStats.length === 0) {
                catHtml = '<div style="text-align:center; padding:20px; color:#bbb; font-size:13px;">暂无分类数据</div>';
            } else {
                catStats.forEach(c => {
                    const pct = Math.round((c.minutes / catTotalMins) * 100);
                    const catColors = { study: '#667eea', work: '#f59e0b', exercise: '#10b981', read: '#8b5cf6', code: '#3b82f6', art: '#ec4899', meditate: '#14b8a6', other: '#6b7280' };
                    const color = catColors[c.key] || '#6b7280';
                    catHtml += '<div style="margin-bottom:12px;">' +
                        '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
                        '<div style="display:flex; align-items:center; gap:6px;"><span style="font-size:16px;">' + c.icon + '</span><span style="font-size:13px; font-weight:500; color:#333;">' + c.name + '</span></div>' +
                        '<div style="font-size:12px; color:#666;">' + c.minutes + '分钟 · ' + c.sessions + '次 · ' + pct + '%</div>' +
                        '</div>' +
                        '<div style="height:8px; background:#f0f0f5; border-radius:4px; overflow:hidden;">' +
                        '<div style="height:100%; width:' + pct + '%; background:' + color + '; border-radius:4px; transition:width 0.3s;"></div>' +
                        '</div></div>';
                });
            }

            // --- Recent sessions ---
            const recentSessions = periodSessions.slice(-8).reverse();
            let recentHtml = '';
            recentSessions.forEach(s => {
                const task = (sv.tasks || []).find(t => t.id === s.taskId);
                const cat = task ? (SV_CATEGORIES[task.category] || SV_CATEGORIES.other) : SV_CATEGORIES.other;
                const d = new Date(s.endTime);
                recentHtml += '<div class="sv-history-item"><div class="sv-history-icon ' + (task ? task.category : 'other') + '">' + cat.icon + '</div><div class="sv-history-info"><div class="sv-history-title">' + (task ? task.title : '未知任务') + '</div><div class="sv-history-time">' + d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0, 5) + '</div></div><div class="sv-history-duration">' + (s.duration || 0) + '分钟</div></div>';
            });
            if (!recentHtml) recentHtml = '<div class="sv-empty"><div class="sv-empty-text">暂无记录</div></div>';

            // --- Completion rate ring SVG ---
            const ringR = 40;
            const ringC = 2 * Math.PI * ringR;
            const ringOffset = ringC - (completionRate / 100) * ringC;
            const ringColor = completionRate >= 80 ? '#4cd137' : completionRate >= 50 ? '#f59e0b' : '#667eea';

            area.innerHTML = '<div class="sv-home">' +
                // Header
                '<div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); padding:50px 20px 24px; color:#fff; flex-shrink:0;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
                '<div style="font-size:20px; font-weight:700;">数据统计</div>' +
                '<div style="display:flex; gap:6px;">' +
                '<div onclick="svStatsPeriod=\'week\';renderSupervise()" style="padding:5px 14px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; ' + (isWeek ? 'background:#fff; color:#667eea;' : 'background:rgba(255,255,255,0.2); color:rgba(255,255,255,0.8);') + '">本周</div>' +
                '<div onclick="svStatsPeriod=\'month\';renderSupervise()" style="padding:5px 14px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; ' + (!isWeek ? 'background:#fff; color:#667eea;' : 'background:rgba(255,255,255,0.2); color:rgba(255,255,255,0.8);') + '">本月</div>' +
                '</div></div>' +
                // Top stat cards
                '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">' +
                '<div style="background:rgba(255,255,255,0.12); border-radius:14px; padding:14px; text-align:center;"><div style="font-size:26px; font-weight:700;">' + periodHours + 'h' + periodMins + 'm</div><div style="font-size:11px; opacity:0.7; margin-top:3px;">' + periodLabel + '专注时长</div></div>' +
                '<div style="background:rgba(255,255,255,0.12); border-radius:14px; padding:14px; text-align:center;"><div style="font-size:26px; font-weight:700;">' + periodCount + '</div><div style="font-size:11px; opacity:0.7; margin-top:3px;">' + periodLabel + '专注次数</div></div>' +
                '<div style="background:rgba(255,255,255,0.12); border-radius:14px; padding:14px; text-align:center;"><div style="font-size:26px; font-weight:700;">' + totalHours + 'h' + totalMins + 'm</div><div style="font-size:11px; opacity:0.7; margin-top:3px;">累计总时长</div></div>' +
                '<div style="background:rgba(255,255,255,0.12); border-radius:14px; padding:14px; text-align:center;"><div style="font-size:26px; font-weight:700;">' + (sv.stats.longestStreak || 0) + '天</div><div style="font-size:11px; opacity:0.7; margin-top:3px;">最长连续</div></div>' +
                '</div></div>' +

                '<div class="scroll-y" style="padding-bottom:60px;">' +

                // Completion rate section
                '<div class="sv-today-section">' +
                '<div class="sv-section-title">' + periodLabel + '目标完成率</div>' +
                '<div style="display:flex; align-items:center; gap:20px; margin-top:14px; padding:16px; background:#fff; border-radius:16px; border:1px solid #f0f0f5;">' +
                '<div style="position:relative; width:100px; height:100px; flex-shrink:0;">' +
                '<svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + ringR + '" fill="none" stroke="#f0f0f5" stroke-width="7"/>' +
                '<circle cx="50" cy="50" r="' + ringR + '" fill="none" stroke="' + ringColor + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + ringC + '" stroke-dashoffset="' + ringOffset + '" transform="rotate(-90 50 50)"/></svg>' +
                '<div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center;"><div style="font-size:22px; font-weight:700; color:' + ringColor + ';">' + completionRate + '%</div></div>' +
                '</div>' +
                '<div style="flex:1;">' +
                '<div style="font-size:13px; color:#666; margin-bottom:8px;">每日目标: <b style="color:#333;">' + dailyGoal + '次</b>专注</div>' +
                '<div style="font-size:13px; color:#666; margin-bottom:4px;">达标天数: <b style="color:' + ringColor + ';">' + daysWithGoalMet + '</b> / ' + pastDays + ' 天</div>' +
                '<div style="font-size:13px; color:#666; margin-bottom:4px;">日均时长: <b style="color:#333;">' + avgDailyMins + '</b> 分钟</div>' +
                '<div style="font-size:13px; color:#666;">日均次数: <b style="color:#333;">' + avgDailySessions + '</b> 次</div>' +
                '</div></div></div>' +

                // Chart section
                '<div class="sv-today-section" style="padding-top:0;">' +
                '<div class="sv-section-title">' + periodLabel + (isWeek ? '每日' : '每日') + '专注时长</div>' +
                '<div class="sv-today-progress" style="margin-top:12px;">' +
                '<div class="sv-weekly-chart" style="height:' + (isWeek ? '120' : '80') + 'px; ' + (!isWeek ? 'gap:1px;' : '') + '">' + chartHtml + '</div>' +
                '<div style="display:flex; justify-content:space-between; margin-top:8px; font-size:10px; color:#aaa;">' +
                '<span><span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:linear-gradient(180deg,#4cd137,#44bd32); margin-right:3px;"></span>达标</span>' +
                '<span><span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:linear-gradient(180deg,#667eea,#764ba2); margin-right:3px;"></span>今日</span>' +
                '<span><span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:#c8d6e5; margin-right:3px;"></span>未达标</span>' +
                '</div></div></div>' +

                // Category breakdown
                '<div class="sv-today-section" style="padding-top:0;">' +
                '<div class="sv-section-title">' + periodLabel + '分类统计</div>' +
                '<div style="margin-top:12px; padding:14px; background:#fff; border-radius:16px; border:1px solid #f0f0f5;">' + catHtml + '</div>' +
                '</div>' +

                // Recent records
                '<div class="sv-today-section" style="padding-top:0;">' +
                '<div class="sv-section-title">' + periodLabel + '专注记录</div>' +
                '<div style="margin-top:12px;">' + recentHtml + '</div>' +
                '</div>' +

                '</div>' +
                // Bottom tabs
                '<div class="sv-tabs" style="position:absolute; bottom:0; left:0; right:0; background:#fff; z-index:50;">' +
                '<div class="sv-tab ' + (svCurrentTab === 'home' ? 'active' : '') + '" onclick="svCurrentTab=\'home\';renderSupervise()"><i class="fas fa-home" style="font-size:16px;"></i><div style="font-size:11px; margin-top:2px;">首页</div></div>' +
                '<div class="sv-tab ' + (svCurrentTab === 'history' ? 'active' : '') + '" onclick="svCurrentTab=\'history\';renderSupervise()"><i class="fas fa-list" style="font-size:16px;"></i><div style="font-size:11px; margin-top:2px;">任务</div></div>' +
                '<div class="sv-tab ' + (svCurrentTab === 'stats' ? 'active' : '') + '" onclick="svCurrentTab=\'stats\';renderSupervise()"><i class="fas fa-chart-bar" style="font-size:16px;"></i><div style="font-size:11px; margin-top:2px;">统计</div></div>' +
                '</div></div>';
        }

        // Helper: get weekly data
        function getWeeklyData(sv) {
            const days = ['日','一','二','三','四','五','六'];
            const result = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toDateString();
                const daySessions = (sv.sessions || []).filter(s => s.completed && s.type === 'focus' && new Date(s.endTime).toDateString() === dateStr);
                const mins = daySessions.reduce((a, s) => a + (s.duration || 0), 0);
                result.push({ date: dateStr, label: days[d.getDay()], minutes: mins, sessions: daySessions.length });
            }
            return result;
        }

        // Add supervisor
        function openAddSupervisor() {
            const list = document.getElementById('supervisor-contact-list');
            const sv = getSV();
            const existingIds = (sv.supervisors || []).map(s => s.contactId);
            const contacts = store.contacts.filter(c => !c.isGroup && !existingIds.includes(c.id));
            list.innerHTML = contacts.length === 0 ? '<div style="padding:20px; text-align:center; color:#999;">没有可添加的联系人</div>' :
                contacts.map(c => {
                    const avatar = c.avatar || 'https://ui-avatars.com/api/?name=' + (c.name || '?')[0] + '&background=667eea&color=fff';
                    return '<div class="sv-contact-item" onclick="addSupervisor(\'' + c.id + '\')"><img src="' + avatar + '"><div class="sv-contact-item-name">' + c.name + '</div><div class="sv-contact-item-check"><i class="fas fa-plus" style="font-size:12px; color:#667eea;"></i></div></div>';
                }).join('');
            document.getElementById('modal-add-supervisor').style.display = 'flex';
        }

        function addSupervisor(contactId) {
            const sv = getSV();
            if (!sv.supervisors) sv.supervisors = [];
            if (sv.supervisors.find(s => s.contactId === contactId)) return toast('已添加');
            sv.supervisors.push({ contactId: contactId, addedAt: Date.now(), active: true });
            save();
            document.getElementById('modal-add-supervisor').style.display = 'none';
            renderSupervise();
            toast('已添加监督人');
        }

        function showSupervisorOptions(contactId) {
            const sv = getSV();
            const sup = sv.supervisors.find(s => s.contactId === contactId);
            const contact = store.contacts.find(c => c.id === contactId);
            if (!sup || !contact) return;
            showConfirm('监督人: ' + contact.name, '选择操作', function() {
                sv.supervisors = sv.supervisors.filter(s => s.contactId !== contactId);
                save();
                renderSupervise();
                toast('已移除监督人');
            });
        }

        // Add Task
        function openAddTask() {
            const sv = getSV();
            const sel = document.getElementById('sv-task-supervisor');
            sel.innerHTML = '<option value="">无监督人</option>';
            (sv.supervisors || []).forEach(s => {
                const c = store.contacts.find(x => x.id === s.contactId);
                if (c) sel.innerHTML += '<option value="' + c.id + '">' + c.name + '</option>';
            });
            document.getElementById('sv-task-title').value = '';
            document.getElementById('sv-task-category').value = 'study';
            document.getElementById('sv-task-total').value = '8';
            document.getElementById('modal-add-task').style.display = 'flex';
        }

        function addSuperviseTask() {
            const title = document.getElementById('sv-task-title').value.trim();
            if (!title) return toast('请输入任务名称');
            const category = document.getElementById('sv-task-category').value;
            const total = parseInt(document.getElementById('sv-task-total').value) || 8;
            const supervisorId = document.getElementById('sv-task-supervisor').value || null;
            const sv = getSV();
            if (!sv.tasks) sv.tasks = [];
            sv.tasks.push({
                id: 'task_' + Date.now(),
                title: title,
                category: category,
                duration: sv.settings.focusDuration,
                completedSessions: 0,
                totalSessions: total,
                createdAt: Date.now(),
                status: 'active',
                supervisorId: supervisorId,
                logs: []
            });
            save();
            document.getElementById('modal-add-task').style.display = 'none';
            renderSupervise();
            toast('任务已创建');
        }

        // Task Detail
        function openTaskDetail(taskId) {
            const sv = getSV();
            const task = (sv.tasks || []).find(t => t.id === taskId);
            if (!task) return;
            const cat = SV_CATEGORIES[task.category] || SV_CATEGORIES.other;
            const pct = task.totalSessions > 0 ? Math.round((task.completedSessions / task.totalSessions) * 100) : 0;
            const supervisor = task.supervisorId ? store.contacts.find(c => c.id === task.supervisorId) : null;
            const totalMins = (task.logs || []).reduce((a, l) => a + (l.duration || 0), 0);

            let logsHtml = '';
            (task.logs || []).slice(-10).reverse().forEach(l => {
                const d = new Date(l.time);
                logsHtml += '<div class="sv-detail-log-item"><div class="sv-detail-log-time">' + d.toLocaleTimeString().slice(0, 5) + '</div><div class="sv-detail-log-text">' + l.text + '</div></div>';
            });

            const content = document.getElementById('task-detail-content');
            content.innerHTML = '<div class="sv-detail-header"><div class="sv-detail-icon ' + task.category + '">' + cat.icon + '</div><div class="sv-detail-info"><div class="sv-detail-name">' + task.title + '</div><div class="sv-detail-category">' + cat.name + (supervisor ? ' · 监督人: ' + supervisor.name : '') + '</div></div></div>' +
                '<div class="sv-detail-progress"><div class="sv-detail-progress-header"><div class="sv-detail-progress-label">完成进度</div><div class="sv-detail-progress-pct">' + pct + '%</div></div><div class="sv-detail-bar-bg"><div class="sv-detail-bar-fill" style="width:' + pct + '%"></div></div></div>' +
                '<div class="sv-detail-stats"><div class="sv-detail-stat"><div class="sv-detail-stat-val">' + task.completedSessions + '/' + task.totalSessions + '</div><div class="sv-detail-stat-label">完成次数</div></div><div class="sv-detail-stat"><div class="sv-detail-stat-val">' + totalMins + 'm</div><div class="sv-detail-stat-label">总时长</div></div></div>' +
                (logsHtml ? '<div class="sv-detail-log"><div class="sv-detail-log-title">最近记录</div>' + logsHtml + '</div>' : '') +
                '<div class="sv-detail-actions">' +
                (task.status === 'active' ? '<button class="sv-detail-btn sv-detail-btn-primary" onclick="startFocusForTask(\'' + task.id + '\');document.getElementById(\'modal-task-detail\').style.display=\'none\'"><i class="fas fa-play" style="margin-right:6px;"></i>开始专注</button>' : '') +
                (task.status === 'active' ? '<button class="sv-detail-btn sv-detail-btn-secondary" onclick="pauseTask(\'' + task.id + '\')">暂停</button>' : '') +
                (task.status === 'paused' ? '<button class="sv-detail-btn sv-detail-btn-primary" onclick="resumeTask(\'' + task.id + '\')">恢复</button>' : '') +
                '<button class="sv-detail-btn sv-detail-btn-danger" onclick="deleteTask(\'' + task.id + '\')">删除</button>' +
                '</div>';
            document.getElementById('modal-task-detail').style.display = 'flex';
        }

        function pauseTask(taskId) {
            const sv = getSV();
            const task = (sv.tasks || []).find(t => t.id === taskId);
            if (task) { task.status = 'paused'; save(); }
            document.getElementById('modal-task-detail').style.display = 'none';
            renderSupervise();
            toast('任务已暂停');
        }

        function resumeTask(taskId) {
            const sv = getSV();
            const task = (sv.tasks || []).find(t => t.id === taskId);
            if (task) { task.status = 'active'; save(); }
            document.getElementById('modal-task-detail').style.display = 'none';
            renderSupervise();
            toast('任务已恢复');
        }

        function deleteTask(taskId) {
            showConfirm('删除任务', '确定要删除这个任务吗？', function() {
                const sv = getSV();
                sv.tasks = (sv.tasks || []).filter(t => t.id !== taskId);
                save();
                document.getElementById('modal-task-detail').style.display = 'none';
                renderSupervise();
                toast('任务已删除');
            });
        }

        // Focus Timer
        function startFocusForTask(taskId) {
            svCurrentTaskId = taskId;
            const sv = getSV();
            const task = (sv.tasks || []).find(t => t.id === taskId);
            if (!task) return;
            svFocusRemaining = (task.duration || sv.settings.focusDuration) * 60;
            svFocusTotal = svFocusRemaining;
            svIsFocusing = true;
            svIsPaused = false;
            // [鼓励话语] 初始化：第一次鼓励在5-8分钟后
            svEncourageNextTime = svFocusTotal - (300 + Math.floor(Math.random() * 180)); // 5-8分钟后的剩余秒数
            svEncourageMsg = '';
            svEncourageFading = false;
            svEncourageGenerating = false;
            renderFocusTimer(task);
        }

        // [FIX-番茄钟闪烁] 追踪上一次鼓励消息内容，用于判断是否需要重建气泡DOM
        let _svLastEncourageMsg = '';

        function renderFocusTimer(task) {
            const area = document.getElementById('supervise-content-embedded') || document.getElementById('supervise-content');
            if (!area) return;
            const cat = SV_CATEGORIES[task.category] || SV_CATEGORIES.other;
            const mins = Math.floor(svFocusRemaining / 60);
            const secs = svFocusRemaining % 60;
            const pct = svFocusTotal > 0 ? ((svFocusTotal - svFocusRemaining) / svFocusTotal) * 100 : 0;
            const circumference = 2 * Math.PI * 120;
            const offset = circumference - (pct / 100) * circumference;

            // [FIX-番茄钟闪烁] 检测是否已有完整DOM结构，有则局部更新，避免每秒重建导致闪烁
            const existingTimer = area.querySelector('.sv-focus-time');
            if (existingTimer) {
                // --- 局部更新：只修改变化的部分 ---
                existingTimer.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
                // 更新SVG进度
                const progressCircle = area.querySelector('.sv-focus-circle-wrap svg circle:nth-child(2)');
                if (progressCircle) {
                    progressCircle.setAttribute('stroke-dashoffset', offset);
                }
                // 更新状态文字
                const statusEl = area.querySelector('#sv-focus-status-text');
                if (statusEl) statusEl.textContent = svIsPaused ? '已暂停' : '专注中...';
                // 更新控制按钮（暂停/继续切换）
                const ctrlWrap = area.querySelector('.sv-focus-controls');
                if (ctrlWrap) {
                    const firstBtn = ctrlWrap.querySelector('.sv-focus-btn:first-child');
                    if (firstBtn) {
                        if (svIsPaused) {
                            firstBtn.setAttribute('onclick', 'resumeFocus()');
                            firstBtn.innerHTML = '<i class="fas fa-play"></i>';
                        } else {
                            firstBtn.setAttribute('onclick', 'pauseFocus()');
                            firstBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        }
                    }
                }
                // [鼓励话语] 局部更新：只在消息内容变化时操作DOM
                const encourageContainer = area.querySelector('#sv-encourage-container');
                if (encourageContainer) {
                    if (svEncourageMsg && svEncourageMsg !== _svLastEncourageMsg) {
                        // 新消息到来，插入气泡
                        const supervisor = task.supervisorId ? store.contacts.find(c => c.id === task.supervisorId) : null;
                        const senderName = supervisor ? supervisor.name : '监督助手';
                        const senderAvatar = supervisor ? (supervisor.avatar || '') : '';
                        const avatarHtml = senderAvatar
                            ? '<img src="' + senderAvatar + '" style="width:28px; height:28px; border-radius:50%; object-fit:cover; margin-right:8px; flex-shrink:0;">'
                            : '<div style="width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); display:flex; align-items:center; justify-content:center; margin-right:8px; flex-shrink:0; color:#fff; font-size:12px;"><i class="fas fa-heart"></i></div>';
                        encourageContainer.innerHTML = '<div id="sv-encourage-bubble" style="margin-top:16px; padding:10px 14px; background:linear-gradient(135deg,#f0f2ff,#e8ecff); border-radius:16px; max-width:280px; display:flex; align-items:flex-start; animation:svEncourageIn 0.5s ease-out;">' +
                            avatarHtml +
                            '<div style="flex:1; min-width:0;">' +
                            '<div style="font-size:11px; color:#667eea; font-weight:600; margin-bottom:2px;">' + senderName + '</div>' +
                            '<div style="font-size:13px; color:#333; line-height:1.5;">' + svEncourageMsg + '</div>' +
                            '</div></div>';
                        _svLastEncourageMsg = svEncourageMsg;
                    } else if (svEncourageFading) {
                        // 淡出
                        const bubble = encourageContainer.querySelector('#sv-encourage-bubble');
                        if (bubble) { bubble.style.opacity = '0'; bubble.style.transition = 'opacity 0.8s'; }
                    } else if (!svEncourageMsg && _svLastEncourageMsg) {
                        // 消息已清除
                        encourageContainer.innerHTML = '';
                        _svLastEncourageMsg = '';
                    }
                }
            } else {
                // --- 首次渲染：构建完整DOM ---
                _svLastEncourageMsg = '';
                let encourageHtml = '';
                if (svEncourageMsg) {
                    const supervisor = task.supervisorId ? store.contacts.find(c => c.id === task.supervisorId) : null;
                    const senderName = supervisor ? supervisor.name : '监督助手';
                    const senderAvatar = supervisor ? (supervisor.avatar || '') : '';
                    const avatarHtml = senderAvatar
                        ? '<img src="' + senderAvatar + '" style="width:28px; height:28px; border-radius:50%; object-fit:cover; margin-right:8px; flex-shrink:0;">'
                        : '<div style="width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); display:flex; align-items:center; justify-content:center; margin-right:8px; flex-shrink:0; color:#fff; font-size:12px;"><i class="fas fa-heart"></i></div>';
                    encourageHtml = '<div id="sv-encourage-bubble" style="margin-top:16px; padding:10px 14px; background:linear-gradient(135deg,#f0f2ff,#e8ecff); border-radius:16px; max-width:280px; display:flex; align-items:flex-start; animation:svEncourageIn 0.5s ease-out;">' +
                        avatarHtml +
                        '<div style="flex:1; min-width:0;">' +
                        '<div style="font-size:11px; color:#667eea; font-weight:600; margin-bottom:2px;">' + senderName + '</div>' +
                        '<div style="font-size:13px; color:#333; line-height:1.5;">' + svEncourageMsg + '</div>' +
                        '</div></div>';
                    _svLastEncourageMsg = svEncourageMsg;
                }

                area.innerHTML = '<style>@keyframes svEncourageIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }</style>' +
                    '<div class="sv-focus-screen" style="position:relative;">' +
                    '<div style="position:absolute; top:16px; right:16px; z-index:10;">' +
                    '<div onclick="openFocusTimerSettings()" style="width:36px; height:36px; border-radius:50%; background:rgba(102,126,234,0.12); display:flex; align-items:center; justify-content:center; cursor:pointer;">' +
                    '<i class="fas fa-cog" style="color:#667eea; font-size:16px;"></i>' +
                    '</div></div>' +
                    '<div class="sv-focus-task-name">' + cat.icon + ' ' + task.title + '</div>' +
                    '<div class="sv-focus-circle-wrap">' +
                    '<svg width="280" height="280" viewBox="0 0 280 280">' +
                    '<circle cx="140" cy="140" r="120" fill="none" stroke="#f0f0f5" stroke-width="8"/>' +
                    '<circle cx="140" cy="140" r="120" fill="none" stroke="url(#svGrad)" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + circumference + '" stroke-dashoffset="' + offset + '" transform="rotate(-90 140 140)"/>' +
                    '<defs><linearGradient id="svGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#667eea"/><stop offset="100%" style="stop-color:#764ba2"/></linearGradient></defs>' +
                    '</svg>' +
                    '<div class="sv-focus-time">' + String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0') + '</div>' +
                    '</div>' +
                    '<div class="sv-focus-controls">' +
                    (svIsPaused ?
                        '<div class="sv-focus-btn" onclick="resumeFocus()"><i class="fas fa-play"></i></div>' :
                        '<div class="sv-focus-btn" onclick="pauseFocus()"><i class="fas fa-pause"></i></div>') +
                    '<div class="sv-focus-btn sv-focus-btn-stop" onclick="stopFocus()"><i class="fas fa-stop"></i></div>' +
                    '</div>' +
                    '<div id="sv-focus-status-text" style="color:#999; font-size:13px; margin-top:20px;">' + (svIsPaused ? '已暂停' : '专注中...') + '</div>' +
                    '<div id="sv-encourage-container">' + encourageHtml + '</div>' +
                    '</div>';
            }

            // [FIX-番茄钟闪烁v2] 每次设置新定时器前必须清除旧的
            // 否则外部调用 renderFocusTimer（如 resumeFocus/pauseFocus）会创建新定时器链
            // 而旧的定时器链仍在运行，导致多条并行链同时 tick，UI 每秒被更新多次产生闪烁
            if (svTimerInterval) { clearTimeout(svTimerInterval); svTimerInterval = null; }
            if (svIsFocusing && !svIsPaused) {
                svTimerInterval = setTimeout(function() {
                    svFocusRemaining--;
                    if (svFocusRemaining <= 0) {
                        completeFocus();
                    } else {
                        // [鼓励话语] 检查是否到了显示鼓励的时间
                        if (svFocusRemaining <= svEncourageNextTime && svEncourageNextTime > 0 && !svEncourageGenerating) {
                            triggerEncourageMessage(task);
                        }
                        // [鼓励话语] 消息显示15秒后开始淡出
                        if (svEncourageMsg && !svEncourageFading) {
                            const elapsed = svEncourageNextTime - svFocusRemaining;
                            if (elapsed > 15) {
                                svEncourageFading = true;
                                // 淡出后1秒清除消息
                                setTimeout(function() { svEncourageMsg = ''; svEncourageFading = false; }, 1000);
                            }
                        }
                        renderFocusTimer(task);
                    }
                }, 1000);
            }
        }

        function pauseFocus() {
            svIsPaused = true;
            clearTimeout(svTimerInterval);
            const sv = getSV();
            const task = (sv.tasks || []).find(t => t.id === svCurrentTaskId);
            if (task) renderFocusTimer(task);
        }

        function resumeFocus() {
            svIsPaused = false;
            const sv = getSV();
            const task = (sv.tasks || []).find(t => t.id === svCurrentTaskId);
            if (task) renderFocusTimer(task);
        }

        function stopFocus() {
            showConfirm('放弃专注', '确定要放弃本次专注吗？', function() {
                clearTimeout(svTimerInterval);
                svIsFocusing = false;
                svIsPaused = false;
                svCurrentTaskId = null;
                renderSupervise();
            });
        }

        function completeFocus() {
            clearTimeout(svTimerInterval);
            svIsFocusing = false;
            svIsPaused = false;
            const sv = getSV();
            const task = (sv.tasks || []).find(t => t.id === svCurrentTaskId);
            const duration = Math.round(svFocusTotal / 60);

            if (task) {
                task.completedSessions = (task.completedSessions || 0) + 1;
                if (task.completedSessions >= task.totalSessions) {
                    task.status = 'completed';
                }
                if (!task.logs) task.logs = [];
                task.logs.push({ time: Date.now(), text: '完成专注 ' + duration + '分钟', duration: duration });
            }

            if (!sv.sessions) sv.sessions = [];
            sv.sessions.push({
                id: 'sess_' + Date.now(),
                taskId: svCurrentTaskId,
                type: 'focus',
                duration: duration,
                startTime: Date.now() - svFocusTotal * 1000,
                endTime: Date.now(),
                completed: true
            });

            sv.stats.totalSessions = (sv.stats.totalSessions || 0) + 1;
            sv.stats.totalFocusMinutes = (sv.stats.totalFocusMinutes || 0) + duration;

            const today = new Date().toDateString();
            let todayData = sv.stats.weeklyData.find(d => d.date === today);
            if (!todayData) {
                todayData = { date: today, minutes: 0, sessions: 0 };
                sv.stats.weeklyData.push(todayData);
            }
            todayData.minutes += duration;
            todayData.sessions += 1;

            updateStreak(sv);
            save();
            svCurrentTaskId = null;

            const area = document.getElementById('supervise-content-embedded') || document.getElementById('supervise-content');
            if (area) {
                area.innerHTML = '<div class="sv-focus-screen">' +
                    '<div style="font-size:60px; margin-bottom:20px;">🎉</div>' +
                    '<div style="font-size:22px; font-weight:700; color:#1a1a2e; margin-bottom:8px;">专注完成！</div>' +
                    '<div style="color:#999; font-size:14px; margin-bottom:30px;">本次专注 ' + duration + ' 分钟</div>' +
                    '<button class="sv-empty-btn" onclick="renderSupervise()">返回首页</button>' +
                    '</div>';
            }
        }

        // ========== 鼓励话语系统 ==========
        // [鼓励话语] 内置鼓励话语库（当无监督人或API不可用时使用）
        const SV_ENCOURAGE_PHRASES = [
            '你做得很棒！继续保持这个状态💪',
            '加油！每一分钟的专注都在让你变得更好✨',
            '坚持住，你比想象中更优秀！🌟',
            '休息一下眼睛，深呼吸，然后继续冲！😊',
            '你的努力终会有回报的，相信自己💖',
            '专注的你真的很帅/美！继续加油~🔥',
            '时间在流逝，但你的每一秒都没有浪费！⏰',
            '距离目标又近了一步，别放弃！🎯',
            '累了就伸个懒腰，然后继续前进吧！💫',
            '你现在的努力，未来的你会感谢的！🌈',
            '保持这个节奏，胜利就在前方！🏆',
            '每一次坚持都是对自己最好的投资📈',
            '你已经专注了这么久，太厉害了！👏',
            '喝口水，调整呼吸，你可以的！💧',
            '专注是一种超能力，而你正在使用它！🦸',
        ];

        async function triggerEncourageMessage(task) {
            if (svEncourageGenerating) return;
            svEncourageGenerating = true;

            const sv = getSV();
            const supervisor = task.supervisorId ? store.contacts.find(c => c.id === task.supervisorId) : null;
            const elapsedMins = Math.round((svFocusTotal - svFocusRemaining) / 60);

            // 尝试使用AI生成鼓励消息（如果有监督人且API可用）
            if (supervisor && store.system?.key && store.system?.url) {
                try {
                    const prompt = `你是${supervisor.name}，作为好友的学习监督人。对方正在专注做"${task.title}"，已经专注了${elapsedMins}分钟。请用温暖鼓励的语气说一句鼓励的话（15-35字），像朋友间的关心和打气。要自然、活泼，可以用emoji。不要加前缀或引号。`;
                    const data = await API.chatCompletion([
                        { role: 'system', content: getAiContext(supervisor) },
                        { role: 'user', content: prompt }
                    ], { max_tokens: 100 });
                    const reply = (data?.choices?.[0]?.message?.content || '').trim();
                    if (reply && reply.length > 2) {
                        svEncourageMsg = reply;
                    } else {
                        // AI返回空，使用内置话语
                        svEncourageMsg = SV_ENCOURAGE_PHRASES[Math.floor(Math.random() * SV_ENCOURAGE_PHRASES.length)];
                    }
                } catch (e) {
                    console.warn('[鼓励话语] AI生成失败，使用内置话语:', e.message);
                    svEncourageMsg = SV_ENCOURAGE_PHRASES[Math.floor(Math.random() * SV_ENCOURAGE_PHRASES.length)];
                }
            } else {
                // 没有监督人或API，使用内置话语
                svEncourageMsg = SV_ENCOURAGE_PHRASES[Math.floor(Math.random() * SV_ENCOURAGE_PHRASES.length)];
            }

            svEncourageFading = false;
            // 设置下一次鼓励时间：5-8分钟后
            svEncourageNextTime = svFocusRemaining - (300 + Math.floor(Math.random() * 180));
            if (svEncourageNextTime < 60) svEncourageNextTime = 0; // 如果剩余不到1分钟就不再鼓励了
            svEncourageGenerating = false;
        }

        function updateStreak(sv) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toDateString();
            const hasToday = sv.stats.weeklyData.some(d => d.date === todayStr && d.sessions > 0);
            if (!hasToday) return;

            let streak = 1;
            for (let i = 1; i < 365; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dStr = d.toDateString();
                const hasDay = sv.stats.weeklyData.some(x => x.date === dStr && x.sessions > 0);
                if (hasDay) streak++;
                else break;
            }
            sv.stats.currentStreak = streak;
            if (streak > (sv.stats.longestStreak || 0)) {
                sv.stats.longestStreak = streak;
            }
        }

        // Settings
        function openSVSettings() {
            const sv = getSV();
            document.getElementById('sv-focus-duration').value = sv.settings.focusDuration;
            document.getElementById('sv-break-duration').value = sv.settings.shortBreak;
            document.getElementById('sv-daily-goal').value = sv.settings.dailyGoal;
            document.getElementById('sv-notify-supervisor').checked = sv.settings.notifySupervisor;
            document.getElementById('modal-sv-settings').style.display = 'flex';
        }

        function saveSVSettings() {
            const sv = getSV();
            sv.settings.focusDuration = parseInt(document.getElementById('sv-focus-duration').value) || 25;
            sv.settings.shortBreak = parseInt(document.getElementById('sv-break-duration').value) || 5;
            sv.settings.dailyGoal = parseInt(document.getElementById('sv-daily-goal').value) || 4;
            sv.settings.notifySupervisor = document.getElementById('sv-notify-supervisor').checked;
            save();
            document.getElementById('modal-sv-settings').style.display = 'none';
            renderSupervise();
            toast('设置已保存');
        }

        // ========== ACHIEVEMENTS ==========
        function openSVAchievements() {
            const sv = getSV();
            const list = document.getElementById('sv-achievements-list');
            if (!list) return;
            const stats = sv.stats || {};
            let html = '<div style="padding:20px 16px 10px;"><div style="font-size:18px; font-weight:700; color:#1a1a2e; margin-bottom:4px;">🏆 成就</div><div style="font-size:13px; color:#999; margin-bottom:16px;">完成专注解锁成就</div>';
            SV_ACHIEVEMENTS_DEF.forEach(a => {
                const unlocked = a.condition(stats, sv);
                html += `<div style="display:flex; align-items:center; gap:12px; padding:14px; margin-bottom:8px; background:${unlocked ? 'linear-gradient(135deg,#f8f9ff,#eef1ff)' : '#f9f9f9'}; border-radius:14px; border:1px solid ${unlocked ? '#667eea33' : '#f0f0f0'}; opacity:${unlocked ? '1' : '0.6'};">
                    <div style="font-size:28px; width:44px; text-align:center;">${a.icon}</div>
                    <div style="flex:1;">
                        <div style="font-size:14px; font-weight:600; color:${unlocked ? '#1a1a2e' : '#999'};">${a.name}</div>
                        <div style="font-size:12px; color:#999; margin-top:2px;">${a.desc}</div>
                    </div>
                    ${unlocked ? '<div style="color:#667eea; font-size:14px;"><i class="fas fa-check-circle"></i></div>' : '<div style="color:#ddd; font-size:14px;"><i class="fas fa-lock"></i></div>'}
                </div>`;
            });
            html += '</div>';
            list.innerHTML = html;
            document.getElementById('modal-sv-achievements').style.display = 'flex';
        }

        // ========== FOCUS SETTINGS (alias for openSVSettings) ==========
        function openFocusSettings() {
            openSVSettings();
        }

        // ========== FOCUS TIMER IN-SESSION SETTINGS ==========
        function openFocusTimerSettings() {
            // Pause timer while adjusting
            const wasPaused = svIsPaused;
            if (!svIsPaused) pauseFocus();

            const currentMins = Math.ceil(svFocusRemaining / 60);
            showPromptModal('调整剩余专注时长（分钟）:', String(currentMins)).then(function(input) {
                if (input !== null && input.trim() !== '') {
                    const newMins = parseInt(input);
                    if (!isNaN(newMins) && newMins > 0 && newMins <= 180) {
                        svFocusRemaining = newMins * 60;
                        svFocusTotal = Math.max(svFocusTotal, svFocusRemaining);
                        toast('已调整为 ' + newMins + ' 分钟');
                    } else {
                        toast('请输入1-180之间的数字', 'error');
                    }
                }

                // Resume if it wasn't paused before
                if (!wasPaused) resumeFocus();
                else {
                    const sv = getSV();
                    const task = (sv.tasks || []).find(t => t.id === svCurrentTaskId);
                    if (task) renderFocusTimer(task);
                }
            });
        }

        // ========== MOOD DIARY / CHECK-IN NOTES ==========
        function openMoodDiary() {
            const sv = getSV();
            if (!sv.moodDiary) sv.moodDiary = [];
            renderMoodDiaryList();
            document.getElementById('modal-mood-diary').style.display = 'flex';
        }

        function renderMoodDiaryList() {
            const sv = getSV();
            const entries = (sv.moodDiary || []).slice().reverse();
            const list = document.getElementById('mood-diary-list');
            if (!list) return;
            if (entries.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding:40px 20px; color:#bbb;"><div style="font-size:36px; margin-bottom:10px;">📝</div><div>还没有心情记录</div><div style="font-size:12px; margin-top:6px;">完成专注后可以记录心情</div></div>';
                return;
            }
            list.innerHTML = entries.map(e => {
                const d = new Date(e.time);
                const timeStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
                const moodEmojis = { great: '😄', good: '🙂', okay: '😐', tired: '😩', bad: '😢' };
                const moodLabels = { great: '很棒', good: '不错', okay: '一般', tired: '疲惫', bad: '低落' };
                const emoji = moodEmojis[e.mood] || '🙂';
                const label = moodLabels[e.mood] || e.mood;
                const task = e.taskName || '';
                return `<div style="padding:14px; margin-bottom:8px; background:#fff; border-radius:14px; border:1px solid #f0f0f5;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:22px;">${emoji}</span>
                            <span style="font-size:14px; font-weight:600; color:#333;">${label}</span>
                            ${task ? `<span style="font-size:11px; color:#667eea; background:#f0f2ff; padding:2px 8px; border-radius:10px;">${escapeHtml(task)}</span>` : ''}
                        </div>
                        <span style="font-size:12px; color:#aaa;">${timeStr}</span>
                    </div>
                    ${e.note ? `<div style="font-size:13px; color:#555; line-height:1.6; padding:8px 10px; background:#fafafa; border-radius:10px;">${escapeHtml(e.note)}</div>` : ''}
                    ${e.supervisorReply ? `<div style="margin-top:8px; padding:8px 10px; background:#f0f7ff; border-radius:10px; border-left:3px solid #667eea;">
                        <div style="font-size:11px; color:#667eea; margin-bottom:4px;">💬 监督人回复</div>
                        <div style="font-size:13px; color:#444;">${escapeHtml(e.supervisorReply)}</div>
                    </div>` : ''}
                </div>`;
            }).join('');
        }

        function openAddMoodEntry(taskId) {
            const sv = getSV();
            const task = taskId ? (sv.tasks || []).find(t => t.id === taskId) : null;
            document.getElementById('mood-entry-task-name').textContent = task ? task.title : '日常记录';
            document.getElementById('mood-entry-task-id').value = taskId || '';
            document.getElementById('mood-entry-note').value = '';
            // Reset mood selection
            document.querySelectorAll('.mood-option').forEach(el => el.classList.remove('selected'));
            document.getElementById('mood-entry-selected').value = 'good';
            const defaultBtn = document.querySelector('.mood-option[data-mood="good"]');
            if (defaultBtn) defaultBtn.classList.add('selected');
            document.getElementById('modal-add-mood').style.display = 'flex';
        }

        function selectMoodOption(el) {
            document.querySelectorAll('.mood-option').forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
            document.getElementById('mood-entry-selected').value = el.dataset.mood;
        }

        async function saveMoodEntry() {
            const sv = getSV();
            if (!sv.moodDiary) sv.moodDiary = [];
            const mood = document.getElementById('mood-entry-selected').value || 'good';
            const note = document.getElementById('mood-entry-note').value.trim();
            const taskId = document.getElementById('mood-entry-task-id').value;
            const task = taskId ? (sv.tasks || []).find(t => t.id === taskId) : null;

            const entry = {
                id: 'mood_' + Date.now(),
                mood: mood,
                note: note,
                taskId: taskId || null,
                taskName: task ? task.title : '',
                time: Date.now(),
                supervisorReply: ''
            };

            sv.moodDiary.push(entry);
            save();
            document.getElementById('modal-add-mood').style.display = 'none';
            toast('心情已记录 ' + (mood === 'great' ? '😄' : mood === 'good' ? '🙂' : mood === 'okay' ? '😐' : mood === 'tired' ? '😩' : '😢'));

            // Generate supervisor reply if there's a supervisor
            if (task && task.supervisorId) {
                const contact = store.contacts.find(c => c.id === task.supervisorId);
                if (contact && store.system?.key) {
                    try {
                        const moodLabels = { great: '很棒', good: '不错', okay: '一般', tired: '疲惫', bad: '低落' };
                        const prompt = `你是${contact.name}，作为好友的学习监督人。对方刚完成了一次专注（任务：${task.title}），心情是"${moodLabels[mood] || mood}"${note ? '，备注："' + note + '"' : ''}。请用温暖鼓励的语气回复一句话（15-30字），像朋友间的关心。不要加前缀。`;
                        const data = await API.chatCompletion([
                            { role: 'system', content: prompt },
                            { role: 'user', content: '请回复' }
                        ]);
                        const reply = (data.choices[0].message.content || '').trim().substring(0, 60);
                        if (reply) {
                            entry.supervisorReply = reply;
                            save();
                            if (document.getElementById('modal-mood-diary').style.display === 'flex') {
                                renderMoodDiaryList();
                            }
                        }
                    } catch (e) {
                        console.warn('Supervisor reply failed:', e);
                    }
                }
            }
        }

        // ========== STUDY ROOM / FOCUS MODE ==========
        let studyRoomTimer = null;
        let studyRoomRemaining = 0;
        let studyRoomTotal = 0;
        let studyRoomPaused = false;
        let studyRoomTaskId = null;

        const STUDY_ROOM_MESSAGES = [
            '你做到了！每一次专注都是成长 🌱',
            '太棒了！坚持就是胜利 💪',
            '又完成一次专注，你真的很厉害 ✨',
            '休息一下吧，你值得的 ☕',
            '专注的你最有魅力 🌟',
            '一步一个脚印，你在变得更好 🎯',
            '今天的努力，明天的你会感谢 🌈',
            '保持这个节奏，你会到达想去的地方 🚀',
            '每一分钟的专注都不会被辜负 💎',
            '你的坚持，是最好的自律 🏅'
        ];

        function openStudyRoom(taskId) {
            const sv = getSV();
            studyRoomTaskId = taskId || null;
            const duration = sv.settings.focusDuration || 25;
            studyRoomTotal = duration * 60;
            studyRoomRemaining = studyRoomTotal;
            studyRoomPaused = false;

            const task = taskId ? (sv.tasks || []).find(t => t.id === taskId) : null;
            document.getElementById('study-room-task-label').textContent = task ? task.title : '自由专注';

            renderStudyRoomTimer();
            document.getElementById('modal-study-room').style.display = 'flex';
            startStudyRoomTimer();
        }

        function renderStudyRoomTimer() {
            const mins = Math.floor(studyRoomRemaining / 60);
            const secs = studyRoomRemaining % 60;
            document.getElementById('study-room-time').textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');

            const pct = studyRoomTotal > 0 ? ((studyRoomTotal - studyRoomRemaining) / studyRoomTotal) * 100 : 0;
            const progressEl = document.getElementById('study-room-progress');
            if (progressEl) progressEl.style.width = pct + '%';

            const pauseBtn = document.getElementById('study-room-pause-btn');
            if (pauseBtn) {
                pauseBtn.innerHTML = studyRoomPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
            }
        }

        function startStudyRoomTimer() {
            if (studyRoomTimer) clearInterval(studyRoomTimer);
            studyRoomTimer = setInterval(() => {
                if (studyRoomPaused) return;
                studyRoomRemaining--;
                renderStudyRoomTimer();
                if (studyRoomRemaining <= 0) {
                    clearInterval(studyRoomTimer);
                    studyRoomTimer = null;
                    completeStudyRoom();
                }
            }, 1000);
        }

        function toggleStudyRoomPause() {
            studyRoomPaused = !studyRoomPaused;
            renderStudyRoomTimer();
        }

        function exitStudyRoom() {
            if (studyRoomRemaining > 0 && studyRoomRemaining < studyRoomTotal) {
                showConfirm('退出自习室', '确定要退出吗？本次专注将不会被记录。', () => {
                    clearInterval(studyRoomTimer);
                    studyRoomTimer = null;
                    document.getElementById('modal-study-room').style.display = 'none';
                });
            } else {
                clearInterval(studyRoomTimer);
                studyRoomTimer = null;
                document.getElementById('modal-study-room').style.display = 'none';
            }
        }

        function completeStudyRoom() {
            const sv = getSV();
            const duration = Math.round(studyRoomTotal / 60);
            const task = studyRoomTaskId ? (sv.tasks || []).find(t => t.id === studyRoomTaskId) : null;

            // Record session
            if (task) {
                task.completedSessions = (task.completedSessions || 0) + 1;
                if (task.completedSessions >= task.totalSessions) task.status = 'completed';
                if (!task.logs) task.logs = [];
                task.logs.push({ time: Date.now(), text: '自习室完成 ' + duration + '分钟', duration: duration });
            }

            if (!sv.sessions) sv.sessions = [];
            sv.sessions.push({
                id: 'sess_' + Date.now(),
                taskId: studyRoomTaskId,
                type: 'focus',
                duration: duration,
                startTime: Date.now() - studyRoomTotal * 1000,
                endTime: Date.now(),
                completed: true,
                source: 'study_room'
            });

            sv.stats.totalSessions = (sv.stats.totalSessions || 0) + 1;
            sv.stats.totalFocusMinutes = (sv.stats.totalFocusMinutes || 0) + duration;

            const today = new Date().toDateString();
            let todayData = sv.stats.weeklyData.find(d => d.date === today);
            if (!todayData) {
                todayData = { date: today, minutes: 0, sessions: 0 };
                sv.stats.weeklyData.push(todayData);
            }
            todayData.minutes += duration;
            todayData.sessions += 1;
            updateStreak(sv);
            save();

            // Show completion message
            const msg = STUDY_ROOM_MESSAGES[Math.floor(Math.random() * STUDY_ROOM_MESSAGES.length)];
            const roomContent = document.getElementById('study-room-content');
            if (roomContent) {
                roomContent.innerHTML = `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; padding:40px 20px;">
                        <div style="font-size:64px; margin-bottom:20px;">🎉</div>
                        <div style="font-size:22px; font-weight:700; color:#1a1a2e; margin-bottom:12px;">专注完成！</div>
                        <div style="font-size:15px; color:#667eea; margin-bottom:8px;">${duration} 分钟</div>
                        <div style="font-size:14px; color:#666; line-height:1.6; max-width:260px; margin-bottom:30px; padding:16px; background:#f8f9ff; border-radius:14px;">${msg}</div>
                        <div style="display:flex; gap:10px;">
                            <button onclick="document.getElementById('modal-study-room').style.display='none';openAddMoodEntry('${studyRoomTaskId || ''}')" style="padding:12px 24px; border:1px solid #667eea; background:#fff; color:#667eea; border-radius:12px; font-size:14px; cursor:pointer;">📝 记录心情</button>
                            <button onclick="document.getElementById('modal-study-room').style.display='none';renderSupervise()" style="padding:12px 24px; border:none; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border-radius:12px; font-size:14px; cursor:pointer;">完成</button>
                        </div>
                    </div>
                `;
            }
        }

        // Expose supervise functions
        window.openSVAchievements = openSVAchievements;
        window.openFocusSettings = openFocusSettings;
        window.openMoodDiary = openMoodDiary;
        window.openAddMoodEntry = openAddMoodEntry;
        window.selectMoodOption = selectMoodOption;
        window.saveMoodEntry = saveMoodEntry;
        window.openStudyRoom = openStudyRoom;
        window.toggleStudyRoomPause = toggleStudyRoomPause;
        window.exitStudyRoom = exitStudyRoom;
        window.pauseFocus = pauseFocus;
        window.resumeFocus = resumeFocus;
        window.stopFocus = stopFocus;
        window.startFocusForTask = startFocusForTask;
        window.renderMoodDiaryList = renderMoodDiaryList;
        // [FIX] 补充暴露被HTML onclick引用的supervise函数
        window.addSuperviseTask = addSuperviseTask;
        window.saveSVSettings = saveSVSettings;

        // [FIX] 创建HTML中引用但JS中缺失的专注模式函数
        // confirmExitFocus: 专注模式退出确认
        window.confirmExitFocus = function() {
            if (typeof svIsFocusing !== 'undefined' && svIsFocusing) {
                showConfirm('退出专注', '正在专注中，确定要退出吗？', function() {
                    if (typeof stopFocus === 'function') {
                        clearTimeout(svTimerInterval);
                        svIsFocusing = false;
                        svIsPaused = false;
                        svCurrentTaskId = null;
                    }
                    document.getElementById('modal-focus-session').style.display = 'none';
                    renderSupervise();
                });
            } else {
                document.getElementById('modal-focus-session').style.display = 'none';
                renderSupervise();
            }
        };

        // toggleFocusTimer: 切换专注计时器 播放/暂停
        window.toggleFocusTimer = function() {
            if (typeof svIsPaused !== 'undefined' && svIsPaused) {
                resumeFocus();
            } else {
                pauseFocus();
            }
        };

        // skipFocusSession: 跳过当前专注阶段
        window.skipFocusSession = function() {
            if (typeof svIsFocusing !== 'undefined' && svIsFocusing) {
                showConfirm('跳过', '确定跳过本次专注？', function() {
                    clearTimeout(svTimerInterval);
                    svFocusRemaining = 0;
                    if (typeof completeFocus === 'function') {
                        completeFocus();
                    } else {
                        svIsFocusing = false;
                        svIsPaused = false;
                        renderSupervise();
                    }
                });
            }
        };

        // resetFocusSession: 重置当前专注计时
        window.resetFocusSession = function() {
            if (typeof svIsFocusing !== 'undefined' && svIsFocusing && typeof svCurrentTaskId !== 'undefined') {
                showConfirm('重置', '确定重置计时器？', function() {
                    clearTimeout(svTimerInterval);
                    svFocusRemaining = svFocusTotal;
                    svIsPaused = true;
                    var sv = getSV();
                    var task = (sv.tasks || []).find(function(t) { return t.id === svCurrentTaskId; });
                    if (task && typeof renderFocusTimer === 'function') {
                        renderFocusTimer(task);
                    }
                });
            }
        };

        // saveFocusSettings: 保存专注设置
        // [FIX-监督时间] modal-focus-settings 的 input ID 与 modal-sv-settings 不同
        // 需要从正确的 input 元素读取值，而不是简单代理到 saveSVSettings
        window.saveFocusSettings = function() {
            var sv = getSV();
            // 从 modal-focus-settings 的 input 读取值
            var focusEl = document.getElementById('sv-set-focus');
            var shortEl = document.getElementById('sv-set-short');
            var dailyGoalEl = document.getElementById('sv-set-daily-goal');
            
            if (focusEl) sv.settings.focusDuration = parseInt(focusEl.value) || sv.settings.focusDuration || 25;
            if (shortEl) sv.settings.shortBreak = parseInt(shortEl.value) || sv.settings.shortBreak || 5;
            if (dailyGoalEl) sv.settings.dailyGoal = parseInt(dailyGoalEl.value) || sv.settings.dailyGoal || 4;
            
            // 同步更新 modal-sv-settings 中的 input 值，保持两个弹窗一致
            var svFocusDurEl = document.getElementById('sv-focus-duration');
            var svBreakDurEl = document.getElementById('sv-break-duration');
            var svDailyGoalEl2 = document.getElementById('sv-daily-goal');
            if (svFocusDurEl) svFocusDurEl.value = sv.settings.focusDuration;
            if (svBreakDurEl) svBreakDurEl.value = sv.settings.shortBreak;
            if (svDailyGoalEl2) svDailyGoalEl2.value = sv.settings.dailyGoal;
            
            save();
            document.getElementById('modal-focus-settings').style.display = 'none';
            renderSupervise();
            toast('专注设置已保存');
        };

