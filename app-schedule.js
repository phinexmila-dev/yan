// ===== 日程 & 课表模块 (app-schedule.js) =====
(function(){
    'use strict';

    // ---- 心情贴纸库 ----
    var MOOD_STICKERS = [
        {emoji:'😊', label:'开心'}, {emoji:'😍', label:'心动'}, {emoji:'🥰', label:'甜蜜'},
        {emoji:'😂', label:'大笑'}, {emoji:'🤗', label:'温暖'}, {emoji:'😎', label:'酷'},
        {emoji:'😢', label:'难过'}, {emoji:'😭', label:'大哭'}, {emoji:'😤', label:'生气'},
        {emoji:'😡', label:'愤怒'}, {emoji:'😰', label:'焦虑'}, {emoji:'😱', label:'惊吓'},
        {emoji:'🥺', label:'委屈'}, {emoji:'😴', label:'困了'}, {emoji:'🤒', label:'生病'},
        {emoji:'🤔', label:'思考'}, {emoji:'😋', label:'好吃'}, {emoji:'🥳', label:'庆祝'},
        {emoji:'💪', label:'加油'}, {emoji:'❤️', label:'爱你'}, {emoji:'💔', label:'心碎'},
        {emoji:'🌈', label:'彩虹'}, {emoji:'⭐', label:'闪亮'}, {emoji:'🔥', label:'火热'}
    ];

    // 课表颜色预设
    var TT_COLORS = ['#ff6b8a','#5b8def','#43c6ac','#f7971e','#a855f7','#ec4899','#14b8a6','#f59e0b','#6366f1','#ef4444','#8b5cf6','#06b6d4'];

    // 当前状态
    var schTab = 'schedule';
    var schSelectedDate = new Date();
    var schShowAddForm = false;
    var schEditingId = null;
    var stickerPickerTarget = null;
    var ttCurrentWeek = 1;
    var ttShowSettings = false;
    var ttEditingCourse = null;
    var ttShowImport = false;

    // 悬浮球状态
    var _schFloatBallVisible = false;
    var _schFloatBallReacting = false;
    var _schFloatBallReaction = '';
    var _schFloatBallContactName = '';

    // 日程AI生成状态
    var _schGeneratingPlan = false;
    var _schGeneratedDates = {}; // 记录已经用AI生成过的日期

    // 日期工具
    function dateKey(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
    function isSameDay(a,b) { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
    function getWeekDays(d) {
        var day = d.getDay(); var diff = d.getDate() - day + (day===0?-6:1);
        var mon = new Date(d); mon.setDate(diff);
        return Array.from({length:7}, function(_,i){ var dd=new Date(mon); dd.setDate(mon.getDate()+i); return dd; });
    }
    var WEEKDAY_LABELS = ['一','二','三','四','五','六','日'];
    var WEEKDAY_FULL = ['周一','周二','周三','周四','周五','周六','周日'];

    function getScheduleData(space) {
        if(!space.scheduleData) space.scheduleData = {};
        return space.scheduleData;
    }
    // [FIX-课表分离] 课表是用户自己的，不跟联系人/couple space绑定
    function getTimetableData(space) {
        // 迁移：如果旧的space.timetable有数据，迁移到store.userTimetable
        if (space && space.timetable && space.timetable.courses && space.timetable.courses.length > 0 && typeof store !== 'undefined') {
            if (!store.userTimetable || !store.userTimetable.courses || store.userTimetable.courses.length === 0) {
                store.userTimetable = space.timetable;
                console.log('[课表分离] 已将课表数据从couple space迁移到全局store');
            }
            // 迁移后清除旧数据
            delete space.timetable;
        }
        if (typeof store !== 'undefined') {
            if(!store.userTimetable) store.userTimetable = { courses:[], settings: getDefaultTTSettings(), semesterStart:'' };
            if(!store.userTimetable.settings) store.userTimetable.settings = getDefaultTTSettings();
            return store.userTimetable;
        }
        // fallback
        if(!space.timetable) space.timetable = { courses:[], settings: getDefaultTTSettings(), semesterStart:'' };
        if(!space.timetable.settings) space.timetable.settings = getDefaultTTSettings();
        return space.timetable;
    }
    function getDefaultTTSettings() {
        return {
            totalWeeks: 20,
            periodsPerDay: 12,
            morningStart: '08:00',
            afternoonStart: '14:00',
            eveningStart: '19:00',
            periodDuration: 45,
            breakDuration: 10,
            bigBreakAfter: [2,4],
            bigBreakDuration: 20,
            periodTimes: []
        };
    }

    function calcPeriodTimes(settings) {
        if(settings.periodTimes && settings.periodTimes.length >= settings.periodsPerDay) {
            return settings.periodTimes.slice(0, settings.periodsPerDay);
        }
        var times = [];
        var sections = [
            {start: settings.morningStart||'08:00', count:4},
            {start: settings.afternoonStart||'14:00', count:4},
            {start: settings.eveningStart||'19:00', count:4}
        ];
        var idx = 0;
        for(var s=0; s<sections.length; s++) {
            var sec = sections[s];
            var parts = sec.start.split(':');
            var h = parseInt(parts[0]), m = parseInt(parts[1]);
            for(var i=0; i<sec.count && idx<settings.periodsPerDay; i++,idx++) {
                var startStr = String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
                m += (settings.periodDuration||45);
                if(m>=60){h+=Math.floor(m/60);m%=60;}
                var endStr = String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
                times.push({start:startStr, end:endStr});
                var brk = (settings.bigBreakAfter||[]).indexOf(idx+1)>=0 ? (settings.bigBreakDuration||20) : (settings.breakDuration||10);
                m += brk;
                if(m>=60){h+=Math.floor(m/60);m%=60;}
            }
        }
        return times;
    }

    // ===== 获取联系人信息工具函数 =====
    function _getPartnerInfo(space) {
        var partner = (typeof store!=='undefined' && store.contacts) ? store.contacts.find(function(x){return x.id===space.partnerId;}) : null;
        return partner;
    }

    function _getPartnerName(space) {
        var partner = _getPartnerInfo(space);
        return partner ? partner.name : 'TA';
    }

    function _getPartnerAvatar(space) {
        var partner = _getPartnerInfo(space);
        return partner ? (partner.avatar || '') : '';
    }

    function _getPartnerPersona(space) {
        var partner = _getPartnerInfo(space);
        return partner ? (partner.persona || '') : '';
    }

    // ===== 基于联系人人设用AI生成每日计划 =====
    async function autoGenerateDailyPlan(space, dateStr) {
        var data = getScheduleData(space);
        if(!data[dateStr]) data[dateStr] = [];
        // 已有自动生成的就不再生成
        if(data[dateStr].some(function(it){return it.autoGenerated;})) return;

        var partner = _getPartnerInfo(space);
        var partnerName = partner ? partner.name : 'TA';
        var partnerPersona = partner ? (partner.persona || '') : '';

        // 如果有人设，用AI生成符合角色的日程
        if(partnerPersona && typeof API !== 'undefined' && API.chatCompletion && !_schGeneratingPlan && !_schGeneratedDates[dateStr]) {
            _currentApiScene = 'schedule';
            _schGeneratingPlan = true;
            _schGeneratedDates[dateStr] = true;

            // 显示悬浮球加载状态
            _showFloatBallLoading(space, '正在生成' + partnerName + '的日程...');

            try {
                var d = new Date(dateStr);
                var dayOfWeek = d.getDay();
                var isWeekend = dayOfWeek===0||dayOfWeek===6;
                var dayLabel = isWeekend ? '周末' : '工作日/上学日';
                var weekdayName = ['周日','周一','周二','周三','周四','周五','周六'][dayOfWeek];

                // 获取课表信息（工作日可能有课）
                var courseInfo = '';
                var tt = getTimetableData(space);
                if(tt.courses && tt.courses.length > 0 && !isWeekend) {
                    var todayDayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    var todayCourses = tt.courses.filter(function(c) {
                        return c.day === todayDayIdx && c.weeks && c.weeks.indexOf(ttCurrentWeek) >= 0;
                    }).sort(function(a,b){ return a.startPeriod - b.startPeriod; });
                    if(todayCourses.length > 0) {
                        courseInfo = '\n今天的课程安排：' + todayCourses.map(function(c) {
                            return c.name + '(第' + c.startPeriod + '-' + (c.startPeriod+c.duration-1) + '节' + (c.location ? '，'+c.location : '') + ')';
                        }).join('、');
                    }
                }

                var sysPrompt = '你是一个日程生成器。根据角色的人设和背景生成TA在' + dateStr + '(' + weekdayName + '，' + dayLabel + ')这一天的日程安排。\n\n' +
                    '角色名：' + partnerName + '\n' +
                    '角色人设：' + partnerPersona.substring(0, 600) + '\n' +
                    courseInfo + '\n\n' +
                    '【要求】\n' +
                    '1. 必须完全基于角色人设生成，包括TA的职业、爱好、性格、生活习惯等\n' +
                    '2. 不能OOC，日程必须符合人物设定的底色\n' +
                    '3. 如果角色是学生，工作日要包含上课安排；如果是上班族，要有工作时间\n' +
                    '4. 要体现角色的个人特色和习惯\n' +
                    '5. 生成6-8条日程，每条一行\n' +
                    '6. 严格按以下格式输出，不要有其他任何内容：\n' +
                    'HH:MM|emoji标题|简短描述\n' +
                    '例如：08:00|📚去图书馆自习|准备明天的考试\n' +
                    '时间必须按从早到晚排序。';

                var data2 = await API.chatCompletion([
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: '请为' + partnerName + '生成' + dateStr + '的日程安排。' }
                ], { temperature: 0.8, maxTokens: 500 });

                var reply = (data2 && data2.choices && data2.choices[0] && data2.choices[0].message) ? data2.choices[0].message.content : '';

                if(reply) {
                    var lines = reply.split('\n').filter(function(l) { return l.trim() && l.indexOf('|') > 0; });
                    var schedData = getScheduleData(space);
                    if(!schedData[dateStr]) schedData[dateStr] = [];

                    for(var i = 0; i < lines.length; i++) {
                        var parts = lines[i].split('|');
                        if(parts.length >= 2) {
                            var time = parts[0].trim();
                            var title = parts[1].trim();
                            var desc = parts.length >= 3 ? parts[2].trim() : '';

                            // 验证时间格式
                            if(!/^\d{1,2}:\d{2}$/.test(time)) continue;

                            schedData[dateStr].push({
                                id: Date.now() + Math.random() + i,
                                time: time,
                                title: title,
                                desc: desc,
                                autoGenerated: true,
                                stickers: {me:[], partner:[]},
                                done: false
                            });
                        }
                    }
                    if(typeof save==='function') save();

                    // 载入记忆数据库
                    _saveScheduleToMemory(space, dateStr, schedData[dateStr]);
                }
            } catch(ex) {
                console.error('[Schedule] AI生成日程失败:', ex);
                // 回退到默认生成
                _generateDefaultPlan(space, dateStr);
            }

            _schGeneratingPlan = false;
            _hideFloatBallLoading();

            if(typeof renderCouple === 'function') renderCouple();
            return;
        }

        // 没有人设或没有API的情况下用默认生成
        if(!data[dateStr].some(function(it){return it.autoGenerated;})) {
            _generateDefaultPlan(space, dateStr);
        }
    }

    // 默认日程生成（无API时的回退方案）
    function _generateDefaultPlan(space, dateStr) {
        var data = getScheduleData(space);
        if(!data[dateStr]) data[dateStr] = [];
        if(data[dateStr].some(function(it){return it.autoGenerated;})) return;

        var partner = _getPartnerInfo(space);
        var partnerName = partner ? partner.name : 'TA';
        var d = new Date(dateStr);
        var dayOfWeek = d.getDay();
        var isWeekend = dayOfWeek===0||dayOfWeek===6;
        var plans = [];

        if(isWeekend) {
            plans.push({time:'09:00', title:'☀️ '+partnerName+'的懒觉时间', desc:partnerName+'今天可以睡个懒觉~'});
            plans.push({time:'10:30', title:'🧹 '+partnerName+'整理房间', desc:partnerName+'可能会整理一下自己的小窝'});
            plans.push({time:'12:00', title:'🍳 '+partnerName+'的午餐', desc:partnerName+'该吃午饭啦，记得关心一下~'});
            plans.push({time:'14:00', title:'🎮 '+partnerName+'的休闲时光', desc:partnerName+'下午可能在看剧、玩游戏或者看书'});
            plans.push({time:'17:00', title:'🚶 '+partnerName+'出去逛逛', desc:partnerName+'可能会出门散散步或者逛街'});
            plans.push({time:'19:00', title:'🍽️ '+partnerName+'的晚餐', desc:partnerName+'该吃晚饭了'});
            plans.push({time:'22:00', title:'🌙 '+partnerName+'准备休息', desc:partnerName+'差不多该睡觉啦，给TA说晚安吧~'});
        } else {
            plans.push({time:'07:00', title:'⏰ '+partnerName+'起床啦', desc:partnerName+'开始新的一天，可以给TA发个早安~'});
            plans.push({time:'08:00', title:'📚 '+partnerName+'上课/工作', desc:partnerName+'开始上午的学习或工作了'});
            plans.push({time:'10:00', title:'☕ '+partnerName+'课间休息', desc:partnerName+'现在应该在休息，可以聊两句~'});
            plans.push({time:'12:00', title:'🍱 '+partnerName+'的午餐', desc:partnerName+'该吃午饭了，提醒TA按时吃饭~'});
            plans.push({time:'13:30', title:'😴 '+partnerName+'午休', desc:partnerName+'可能在午睡，别打扰TA哦'});
            plans.push({time:'14:00', title:'📖 '+partnerName+'下午课程', desc:partnerName+'开始下午的学习或工作'});
            plans.push({time:'18:00', title:'🏠 '+partnerName+'下课/下班', desc:partnerName+'今天辛苦了，可以问问TA今天怎么样~'});
            plans.push({time:'19:00', title:'🍽️ '+partnerName+'的晚餐', desc:partnerName+'该吃晚饭啦'});
            plans.push({time:'21:00', title:'📱 '+partnerName+'的自由时间', desc:partnerName+'现在应该有空，可以一起聊聊天~'});
            plans.push({time:'23:00', title:'🌙 '+partnerName+'该休息了', desc:partnerName+'差不多该睡觉了，说晚安吧~'});
        }
        for(var i=0;i<plans.length;i++){
            var p = plans[i];
            data[dateStr].push({
                id: Date.now() + Math.random() + i,
                time: p.time, title: p.title, desc: p.desc,
                autoGenerated: true, stickers:{me:[],partner:[]}, done:false
            });
        }
        if(typeof save==='function') save();
    }

    // ===== 载入记忆数据库 =====
    function _saveScheduleToMemory(space, dateStr, items) {
        try {
            if(!store || !store.memorySummaries) return;
            var partnerId = space.partnerId;
            if(!partnerId) return;
            if(!store.memorySummaries[partnerId]) store.memorySummaries[partnerId] = [];

            // 检查是否已有该日期的日程记忆
            var existIdx = store.memorySummaries[partnerId].findIndex(function(m) {
                return m.content && m.content.indexOf('[日程:' + dateStr + ']') >= 0;
            });

            var autoItems = items.filter(function(it) { return it.autoGenerated; });
            var userItems = items.filter(function(it) { return !it.autoGenerated; });

            var memContent = '[日程:' + dateStr + '] ';
            if(autoItems.length > 0) {
                memContent += 'TA的日程：' + autoItems.map(function(it) {
                    return it.time + ' ' + it.title;
                }).join('；');
            }
            if(userItems.length > 0) {
                memContent += ' | 用户的日程：' + userItems.map(function(it) {
                    return it.time + ' ' + it.title;
                }).join('；');
            }

            // 心情贴纸记录
            var moodItems = items.filter(function(it) {
                return it.stickers && ((it.stickers.me && it.stickers.me.length > 0) || (it.stickers.partner && it.stickers.partner.length > 0));
            });
            if(moodItems.length > 0) {
                memContent += ' | 心情标记：' + moodItems.map(function(it) {
                    var moods = [];
                    if(it.stickers.me && it.stickers.me.length) moods.push('用户对"' + it.title + '"的心情:' + it.stickers.me.join(''));
                    if(it.stickers.partner && it.stickers.partner.length) moods.push('TA对"' + it.title + '"的心情:' + it.stickers.partner.join(''));
                    return moods.join('，');
                }).join('；');
            }

            if(existIdx >= 0) {
                store.memorySummaries[partnerId][existIdx].content = memContent;
                store.memorySummaries[partnerId][existIdx].date = dateStr;
            } else {
                store.memorySummaries[partnerId].push({
                    id: 'sch_' + Date.now(),
                    date: dateStr,
                    content: memContent
                });
            }

            if(typeof save === 'function') save();
        } catch(e) {
            console.error('[Schedule] 保存记忆失败:', e);
        }
    }

    // 课表载入记忆
    function _saveTimetableToMemory(space) {
        try {
            if(!store || !store.memorySummaries) return;
            var partnerId = space.partnerId;
            if(!partnerId) return;
            if(!store.memorySummaries[partnerId]) store.memorySummaries[partnerId] = [];

            var tt = getTimetableData(space);
            if(!tt.courses || tt.courses.length === 0) return;

            var existIdx = store.memorySummaries[partnerId].findIndex(function(m) {
                return m.content && m.content.indexOf('[课表信息]') >= 0;
            });

            var coursesByDay = {};
            tt.courses.forEach(function(c) {
                if(!coursesByDay[c.day]) coursesByDay[c.day] = [];
                coursesByDay[c.day].push(c);
            });

            var memContent = '[课表信息] ';
            for(var day = 0; day < 7; day++) {
                if(coursesByDay[day] && coursesByDay[day].length > 0) {
                    var sorted = coursesByDay[day].sort(function(a,b){ return a.startPeriod - b.startPeriod; });
                    memContent += WEEKDAY_FULL[day] + '：' + sorted.map(function(c) {
                        return c.name + '(第' + c.startPeriod + '-' + (c.startPeriod+c.duration-1) + '节' + (c.location ? '，'+c.location : '') + ')';
                    }).join('、') + '；';
                }
            }

            if(existIdx >= 0) {
                store.memorySummaries[partnerId][existIdx].content = memContent;
            } else {
                store.memorySummaries[partnerId].push({
                    id: 'tt_' + Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    content: memContent
                });
            }

            if(typeof save === 'function') save();
        } catch(e) {
            console.error('[Schedule] 保存课表记忆失败:', e);
        }
    }

    // ===== 悬浮球相关 =====
    function _showFloatBallLoading(space, msg) {
        _schFloatBallContactName = _getPartnerName(space);
        var el = document.getElementById('sch-float-ball-tip');
        if(el) {
            el.innerHTML = '<div class="sch-fb-tip-loading"><span class="sch-fb-tip-name">' +
                _schFloatBallContactName + '</span> <span class="sch-fb-tip-text">' + (msg || '正在查看你的日程...') + '</span>' +
                '<div class="sch-fb-tip-dots"><span></span><span></span><span></span></div></div>';
            el.classList.add('show');
        }
    }

    function _hideFloatBallLoading() {
        var el = document.getElementById('sch-float-ball-tip');
        if(el) {
            setTimeout(function() { el.classList.remove('show'); }, 800);
        }
    }

    function _showFloatBallReaction(space, reaction) {
        _schFloatBallReaction = reaction;
        var el = document.getElementById('sch-float-ball-tip');
        if(el) {
            el.innerHTML = '<div class="sch-fb-tip-reaction"><span class="sch-fb-tip-name">' +
                _schFloatBallContactName + ':</span> <span class="sch-fb-tip-msg">' + reaction + '</span></div>';
            el.classList.add('show');
            // 自动隐藏
            setTimeout(function() { el.classList.remove('show'); }, 5000);
        }
    }

    // [FIX-悬浮球加速] 悬浮球反应（调用API）- 只用人设+当前情景，精简prompt加速
    async function _triggerFloatBallReaction(space, context) {
        if(!space || _schFloatBallReacting) return;
        var partner = _getPartnerInfo(space);
        if(!partner || !partner.persona) return;
        if(typeof API === 'undefined' || !API.chatCompletion) return;

        _schFloatBallReacting = true;
        _schFloatBallContactName = partner.name;

        // [FIX-思考弹窗] 显示明确的思考中弹窗提示用户
        _showFloatBallLoading(space, partner.name + '正在思考...');
        toast(partner.name + ' 正在查看你的日程...', 'info');

        try {
            // [FIX-加速] 只传人设核心+当前情景，不传多余内容
            var _schUserName = (typeof getUserPersonaName === 'function') ? getUserPersonaName(partner, (store.user && store.user.name) || '用户') : ((store.user && store.user.name) || '用户');
            var sysPrompt = '你是' + partner.name + '。人设：' + partner.persona.substring(0, 200) +
                '\n用1句话对' + _schUserName + '的日程变化做出反应，符合人设语气，不加格式标记。';

            var data = await API.chatCompletion([
                { role: 'system', content: sysPrompt },
                { role: 'user', content: context }
            ], { temperature: 0.9, maxTokens: 60 });

            var reply = (data && data.choices && data.choices[0] && data.choices[0].message) ? data.choices[0].message.content : '';
            if(reply) {
                reply = reply.replace(/^["'"']/,'').replace(/["'"']$/,'').trim();
                _showFloatBallReaction(space, reply);
            } else {
                _hideFloatBallLoading();
            }
        } catch(e) {
            console.error('[Schedule] 悬浮球反应失败:', e);
            _hideFloatBallLoading();
            toast('悬浮球反应失败', 'error');
        }

        _schFloatBallReacting = false;
    }

    // ===== 渲染悬浮球 =====
    function _renderScheduleFloatBall(space) {
        // 移除旧的
        var old = document.getElementById('sch-float-ball-wrap');
        if(old) old.remove();

        if(!space) return;
        var avatar = _getPartnerAvatar(space);
        var name = _getPartnerName(space);

        // 构建悬浮球内容：有头像用头像，没头像用名字首字母
        var ballContent = '';
        if(avatar && avatar.indexOf('placeholder') < 0) {
            ballContent = '<img src="' + avatar + '" alt="' + name + '" onerror="this.parentElement.innerHTML=\'<div class=sch-fb-initial>' + (name.charAt(0) || 'T') + '</div>\'">';
        } else {
            ballContent = '<div class="sch-fb-initial">' + (name.charAt(0) || 'T') + '</div>';
        }

        var wrap = document.createElement('div');
        wrap.id = 'sch-float-ball-wrap';
        wrap.innerHTML = '<div id="sch-float-ball-tip" class="sch-fb-tip"></div>' +
            '<div id="sch-float-ball" class="sch-float-ball" title="' + name + '">' +
                ballContent +
            '</div>';
        document.body.appendChild(wrap);
        _schFloatBallVisible = true;

        // [FIX-悬浮球拖动] 添加拖动功能
        _initSchFloatBallDrag(wrap);
    }

    // [FIX-悬浮球拖动] 拖动功能实现
    function _initSchFloatBallDrag(wrap) {
        var ball = document.getElementById('sch-float-ball');
        if(!ball) return;

        var isDragging = false;
        var hasMoved = false;
        var startX, startY, wrapStartX, wrapStartY;
        var DRAG_THRESHOLD = 8;

        function onStart(e) {
            var touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            var rect = wrap.getBoundingClientRect();
            wrapStartX = rect.left;
            wrapStartY = rect.top;
            isDragging = true;
            hasMoved = false;
            wrap.style.transition = 'none';
        }

        function onMove(e) {
            if(!isDragging) return;
            var touch = e.touches ? e.touches[0] : e;
            var dx = touch.clientX - startX;
            var dy = touch.clientY - startY;
            if(!hasMoved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
            hasMoved = true;
            e.preventDefault();
            var newX = Math.max(0, Math.min(window.innerWidth - 60, wrapStartX + dx));
            var newY = Math.max(0, Math.min(window.innerHeight - 60, wrapStartY + dy));
            wrap.style.left = newX + 'px';
            wrap.style.top = newY + 'px';
            wrap.style.bottom = 'auto';
            wrap.style.right = 'auto';
        }

        function onEnd() {
            isDragging = false;
            wrap.style.transition = '';
        }

        ball.addEventListener('touchstart', onStart, {passive: true});
        ball.addEventListener('mousedown', onStart);
        document.addEventListener('touchmove', onMove, {passive: false});
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchend', onEnd);
        document.addEventListener('mouseup', onEnd);
    }

    function _removeScheduleFloatBall() {
        var el = document.getElementById('sch-float-ball-wrap');
        if(el) el.remove();
        _schFloatBallVisible = false;
    }

    // ===== 主渲染入口 =====
    window.renderScheduleModule = function(area, space) {
        if(!space) { coupleViewMode='detail'; renderCouple(); return; }
        var dk = dateKey(schSelectedDate);

        // 异步生成日程（不阻塞渲染）
        var data = getScheduleData(space);
        if(!data[dk] || !data[dk].some(function(it){return it.autoGenerated;})) {
            autoGenerateDailyPlan(space, dk);
        }

        var html = '<div class="schedule-container">' +
            '<div class="nav-bar">' +
                '<div class="nav-icon" onclick="coupleViewMode=\'detail\';renderCouple()"><i class="fas fa-chevron-left"></i></div>' +
                '<div class="nav-title">日程 & 课表</div>' +
                '<div class="nav-icon"></div>' +
            '</div>' +
            '<div class="schedule-tabs">' +
                '<div class="schedule-tab '+(schTab==='schedule'?'active':'')+'" onclick="window._schSwitchTab(\'schedule\')">📅 日程</div>' +
                '<div class="schedule-tab '+(schTab==='timetable'?'active':'')+'" onclick="window._schSwitchTab(\'timetable\')">📋 课表</div>' +
            '</div>' +
            '<div style="flex:1;display:flex;flex-direction:column;overflow:hidden;position:relative;">' +
                (schTab==='schedule' ? renderScheduleTab(space) : renderTimetableTab(space)) +
            '</div>' +
        '</div>';
        area.innerHTML = html;

        // 渲染悬浮球
        _renderScheduleFloatBall(space);
    };

    window._schSwitchTab = function(tab) { schTab=tab; renderCouple(); };

    // ===== 清理悬浮球（当离开日程页面时） =====
    var _origRenderCouple = null;
    function _hookRenderCouple() {
        if(_origRenderCouple) return;
        if(typeof window.renderCouple === 'function') {
            // 不能直接覆盖renderCouple，用MutationObserver监听
        }
        // 使用interval检查是否还在日程页面
        setInterval(function() {
            var schContainer = document.querySelector('.schedule-container');
            if(!schContainer && _schFloatBallVisible) {
                _removeScheduleFloatBall();
            }
        }, 1000);
    }
    _hookRenderCouple();

    // ===== 日程Tab =====
    function renderScheduleTab(space) {
        var today = new Date();
        var weekDays = getWeekDays(schSelectedDate);
        var dk = dateKey(schSelectedDate);
        var data = getScheduleData(space);
        var items = (data[dk]||[]).slice().sort(function(a,b){return (a.time||'').localeCompare(b.time||'');});
        var monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

        var weekHtml = '';
        for(var i=0;i<weekDays.length;i++){
            var d = weekDays[i];
            var isToday = isSameDay(d, today);
            var isSel = isSameDay(d, schSelectedDate);
            var hasEv = (data[dateKey(d)]||[]).length>0;
            weekHtml += '<div class="sch-week-day '+(isToday?'today':'')+' '+(isSel?'selected':'')+' '+(hasEv?'has-event':'')+'" onclick="window._schSelectDate(\''+dateKey(d)+'\')">'+
                '<div class="sch-wd-label">'+WEEKDAY_LABELS[i]+'</div>' +
                '<div class="sch-wd-num">'+d.getDate()+'</div>' +
            '</div>';
        }

        var html = '<div class="sch-cal-header">' +
            '<div class="sch-cal-arrows"><i class="fas fa-chevron-left" onclick="window._schPrevWeek()"></i></div>' +
            '<div class="sch-cal-title">'+schSelectedDate.getFullYear()+'年'+monthNames[schSelectedDate.getMonth()]+'</div>' +
            '<div class="sch-cal-arrows"><i class="fas fa-chevron-right" onclick="window._schNextWeek()"></i></div>' +
        '</div>' +
        '<div class="sch-week-strip">' + weekHtml + '</div>';

        if(schShowAddForm) {
            var editing = schEditingId ? items.find(function(x){return String(x.id)==String(schEditingId);}) : null;
            html += '<div class="sch-add-form">' +
                '<input id="sch-add-time" type="time" value="'+(editing?editing.time:'09:00')+'">' +
                '<input id="sch-add-title" placeholder="日程标题" value="'+(editing?editing.title.replace(/"/g,'&quot;'):'')+'">' +
                '<textarea id="sch-add-desc" placeholder="描述（可选）">'+(editing?editing.desc:'')+'</textarea>' +
                '<div class="sch-add-btns">' +
                    '<button class="sch-btn-cancel" onclick="window._schCancelAdd()">取消</button>' +
                    '<button class="sch-btn-save" onclick="window._schSaveItem()">保存</button>' +
                '</div>' +
            '</div>';
        }

        // AI生成中提示
        if(_schGeneratingPlan) {
            html += '<div class="sch-generating"><div style="font-size:13px;color:#999;margin-bottom:8px;">🤖 正在为TA生成个性化日程...</div>' +
                '<div class="sch-gen-dots"><span></span><span></span><span></span></div></div>';
        }

        html += '<div class="sch-list">';
        if(items.length===0 && !_schGeneratingPlan) {
            html += '<div class="sch-empty"><i class="far fa-calendar-check"></i>今天还没有日程</div>';
        } else {
            for(var j=0;j<items.length;j++){
                var item = items[j];
                var myStickers = (item.stickers&&item.stickers.me)||[];
                var partnerStickers = (item.stickers&&item.stickers.partner)||[];
                var stickerHtml = '';
                for(var si=0;si<myStickers.length;si++) stickerHtml += '<span class="sch-sticker mine" title="我">'+myStickers[si]+'</span>';
                for(var pi=0;pi<partnerStickers.length;pi++) stickerHtml += '<span class="sch-sticker partner" title="TA">'+partnerStickers[pi]+'</span>';

                html += '<div class="sch-item" style="'+(item.done?'opacity:.5;':'')+'">' +
                    '<div class="sch-item-actions">' +
                        '<i class="far fa-smile" title="贴心情" onclick="window._schOpenSticker(\''+String(item.id)+'\',\'me\')"></i>' +
                        '<i class="fas fa-user-friends" title="TA贴心情" onclick="window._schOpenSticker(\''+String(item.id)+'\',\'partner\')"></i>' +
                        '<i class="fas fa-pen" title="编辑" onclick="window._schEditItem(\''+String(item.id)+'\')"></i>' +
                        '<i class="fas fa-trash-alt" onclick="window._schDeleteItem(\''+String(item.id)+'\')"></i>' +
                        '<i class="fas fa-'+(item.done?'undo':'check')+'" onclick="window._schToggleDone(\''+String(item.id)+'\')"></i>' +
                    '</div>' +
                    '<div class="sch-item-header">' +
                        '<span class="sch-item-time">'+(item.time||'')+'</span>' +
                        '<span class="sch-item-badge '+(item.autoGenerated?'auto':'manual')+'">'+(item.autoGenerated?'TA的日常':'我的日程')+'</span>' +
                    '</div>' +
                    '<div class="sch-item-title">'+item.title+'</div>' +
                    (item.desc?'<div class="sch-item-desc">'+item.desc+'</div>':'') +
                    '<div class="sch-item-stickers">'+stickerHtml+'</div>' +
                '</div>';
            }
        }
        html += '</div>';
        if(!schShowAddForm) {
            html += '<div class="sch-fab" onclick="window._schShowAdd()"><i class="fas fa-plus"></i></div>';
        }
        return html;
    }

    // 日程操作
    window._schPrevWeek = function(){ schSelectedDate.setDate(schSelectedDate.getDate()-7); renderCouple(); };
    window._schNextWeek = function(){ schSelectedDate.setDate(schSelectedDate.getDate()+7); renderCouple(); };
    window._schSelectDate = function(dk){ schSelectedDate=new Date(dk+'T00:00:00'); renderCouple(); };
    window._schShowAdd = function(){ schShowAddForm=true; schEditingId=null; renderCouple(); };
    window._schCancelAdd = function(){ schShowAddForm=false; schEditingId=null; renderCouple(); };

    window._schSaveItem = function(){
        var space = getCurrentCoupleSpace(); if(!space) return;
        var dk = dateKey(schSelectedDate);
        var data = getScheduleData(space);
        if(!data[dk]) data[dk]=[];
        var time = document.getElementById('sch-add-time').value;
        var title = document.getElementById('sch-add-title').value.trim();
        var desc = document.getElementById('sch-add-desc').value.trim();
        if(!title){ toast('请输入标题'); return; }
        if(schEditingId) {
            var item = data[dk].find(function(x){return String(x.id)==String(schEditingId);});
            if(item){ item.time=time; item.title=title; item.desc=desc; }
        } else {
            data[dk].push({ id:Date.now()+Math.random(), time:time, title:title, desc:desc, autoGenerated:false, stickers:{me:[],partner:[]}, done:false });
        }
        schShowAddForm=false; schEditingId=null;
        save(); renderCouple(); toast('已保存');

        // 载入记忆
        _saveScheduleToMemory(space, dk, data[dk]);

        // 触发悬浮球反应
        _triggerFloatBallReaction(space, '用户添加了一条日程：' + time + ' ' + title + (desc ? '（' + desc + '）' : ''));
    };

    window._schEditItem = function(id){ schEditingId=id; schShowAddForm=true; renderCouple(); };

    window._schDeleteItem = function(id){
        var space = getCurrentCoupleSpace(); if(!space) return;
        var dk = dateKey(schSelectedDate);
        var data = getScheduleData(space);
        if(data[dk]) data[dk]=data[dk].filter(function(x){return String(x.id)!=String(id);});
        save(); renderCouple(); toast('已删除');
        _saveScheduleToMemory(space, dk, data[dk] || []);
    };

    window._schToggleDone = function(id){
        var space = getCurrentCoupleSpace(); if(!space) return;
        var dk = dateKey(schSelectedDate);
        var data = getScheduleData(space);
        var item = (data[dk]||[]).find(function(x){return String(x.id)==String(id);});
        if(item) item.done=!item.done;
        save(); renderCouple();
    };

    // ===== 贴纸选择器（使用索引避免emoji特殊字符问题） =====
    window._schOpenSticker = function(itemId, who){
        stickerPickerTarget = {itemId: String(itemId), who: who};

        // 移除已存在的
        var exist = document.getElementById('sticker-picker-overlay');
        if(exist) exist.remove();

        var overlay = document.createElement('div');
        overlay.className = 'sticker-picker-overlay';
        overlay.id = 'sticker-picker-overlay';
        overlay.addEventListener('click', function(e){ if(e.target===overlay) window._schCloseSticker(); });

        var gridEl = document.createElement('div');
        gridEl.className = 'sticker-picker-grid';

        // 使用DOM事件绑定而非onclick字符串，避免emoji特殊字符问题
        for(var i=0;i<MOOD_STICKERS.length;i++){
            (function(idx){
                var s = MOOD_STICKERS[idx];
                var itemEl = document.createElement('div');
                itemEl.className = 'sticker-picker-item';
                itemEl.innerHTML = s.emoji + '<span class="sticker-picker-label">' + s.label + '</span>';
                itemEl.addEventListener('click', function(e){
                    e.stopPropagation();
                    window._schPickStickerByIndex(idx);
                });
                gridEl.appendChild(itemEl);
            })(i);
        }

        var pickerEl = document.createElement('div');
        pickerEl.className = 'sticker-picker';
        pickerEl.innerHTML = '<div class="sticker-picker-title">'+(who==='me'?'选择你的心情':'选择TA的心情')+'</div>';
        pickerEl.appendChild(gridEl);

        var closeBtn = document.createElement('div');
        closeBtn.className = 'sticker-picker-close';
        closeBtn.textContent = '关闭';
        closeBtn.addEventListener('click', function(){ window._schCloseSticker(); });
        pickerEl.appendChild(closeBtn);

        overlay.appendChild(pickerEl);
        document.body.appendChild(overlay);

        // 添加动画
        requestAnimationFrame(function() {
            overlay.classList.add('show');
        });
    };

    // 通过索引选择贴纸，避免emoji字符传递问题
    window._schPickStickerByIndex = function(stickerIdx){
        if(!stickerPickerTarget) return;
        if(stickerIdx < 0 || stickerIdx >= MOOD_STICKERS.length) return;
        var emoji = MOOD_STICKERS[stickerIdx].emoji;
        var moodLabel = MOOD_STICKERS[stickerIdx].label;

        var space = getCurrentCoupleSpace(); if(!space) return;
        var dk = dateKey(schSelectedDate);
        var data = getScheduleData(space);
        // 使用字符串比较确保ID匹配
        var item = (data[dk]||[]).find(function(x){return String(x.id)==String(stickerPickerTarget.itemId);});
        if(item){
            if(!item.stickers) item.stickers={me:[],partner:[]};
            if(!item.stickers[stickerPickerTarget.who]) item.stickers[stickerPickerTarget.who] = [];
            var arr = item.stickers[stickerPickerTarget.who];
            var idx = arr.indexOf(emoji);
            if(idx>=0) arr.splice(idx,1); else arr.push(emoji);

            // 载入记忆
            _saveScheduleToMemory(space, dk, data[dk]);

            // 触发悬浮球反应
            var who = stickerPickerTarget.who === 'me' ? '用户' : 'TA';
            _triggerFloatBallReaction(space, who + '在日程"' + item.title + '"上贴了心情贴纸：' + emoji + '(' + moodLabel + ')');
        }
        save(); window._schCloseSticker(); renderCouple();
    };

    // 兼容旧调用
    window._schPickSticker = function(emoji){
        for(var i=0;i<MOOD_STICKERS.length;i++){
            if(MOOD_STICKERS[i].emoji === emoji) {
                window._schPickStickerByIndex(i);
                return;
            }
        }
    };

    window._schCloseSticker = function(){
        stickerPickerTarget=null;
        var el=document.getElementById('sticker-picker-overlay');
        if(el) {
            el.classList.remove('show');
            setTimeout(function() { if(el.parentNode) el.remove(); }, 200);
        }
    };

    // ===== 课表Tab =====
    function renderTimetableTab(space) {
        var tt = getTimetableData(space);
        var settings = tt.settings;
        var periodTimes = calcPeriodTimes(settings);
        var today = new Date();
        var todayDay = today.getDay();

        if(ttShowImport) return renderImportView(space);
        if(ttShowSettings) return renderTTSettings(space);
        if(ttEditingCourse!==null) return renderCourseEdit(space);

        // 计算当前周
        if(tt.semesterStart) {
            var semStart = new Date(tt.semesterStart);
            var diffMs = today - semStart;
            var diffWeeks = Math.floor(diffMs/(7*24*60*60*1000));
            if(diffWeeks>=0 && diffWeeks<settings.totalWeeks) ttCurrentWeek = diffWeeks+1;
        }

        // 工具栏
        var html = '<div class="tt-toolbar">' +
            '<div class="tt-tool-btn" onclick="window._ttShowImport()"><i class="fas fa-file-excel"></i> 导入Excel</div>' +
            '<div class="tt-tool-btn" onclick="window._ttAddCourse()"><i class="fas fa-plus"></i> 添加课程</div>' +
            '<div class="tt-tool-btn" onclick="window._ttOpenSettings()"><i class="fas fa-cog"></i> 设置</div>' +
        '</div>';

        // 周选择
        html += '<div class="tt-week-nav">' +
            '<div class="tt-week-arrows"><i class="fas fa-chevron-left" onclick="window._ttPrevWeek()"></i></div>' +
            '<div class="tt-week-label">第 '+ttCurrentWeek+' 周</div>' +
            '<div class="tt-week-arrows"><i class="fas fa-chevron-right" onclick="window._ttNextWeek()"></i></div>' +
        '</div>';

        // 课表网格
        html += '<div class="tt-container"><div class="tt-grid" style="grid-template-rows:auto repeat('+settings.periodsPerDay+',1fr);">';

        // 顶部表头
        html += '<div class="tt-corner"></div>';
        for(var d=0;d<7;d++){
            var isToday = (d+1===todayDay || (d===6 && todayDay===0));
            html += '<div class="tt-day-header '+(isToday?'today':'')+'">'+WEEKDAY_FULL[d]+'</div>';
        }

        // 每一节课
        for(var p=0;p<settings.periodsPerDay;p++){
            var pt = periodTimes[p];
            var timeLabel = pt ? pt.start : (p+1)+'';
            // 分区标记
            var sectionLabel = '';
            if(p===0) sectionLabel = '上午';
            else if(settings.afternoonStart && pt && pt.start >= settings.afternoonStart && (p===0 || !periodTimes[p-1] || periodTimes[p-1].start < settings.afternoonStart)) sectionLabel = '下午';
            else if(settings.eveningStart && pt && pt.start >= settings.eveningStart && (p===0 || !periodTimes[p-1] || periodTimes[p-1].start < settings.eveningStart)) sectionLabel = '晚上';

            html += '<div class="tt-period-label" title="'+(pt?pt.start+'-'+pt.end:'')+'">'+(p+1)+'<br><span style="font-size:9px;">'+timeLabel+'</span></div>';

            for(var day=0;day<7;day++){
                // 找这个格子对应的课程
                var coursesHere = tt.courses.filter(function(c){
                    return c.day===day && c.startPeriod<=p+1 && (c.startPeriod+c.duration-1)>=p+1 && c.weeks && c.weeks.indexOf(ttCurrentWeek)>=0;
                });
                var cellHtml = '';
                if(coursesHere.length>0 && coursesHere[0].startPeriod===p+1) {
                    var c = coursesHere[0];
                    var cellH = c.duration * 55;
                    var colorIdx = tt.courses.indexOf(c) % TT_COLORS.length;
                    var bgColor = c.color || TT_COLORS[colorIdx];
                    cellHtml = '<div class="tt-course-block" style="top:0;height:'+cellH+'px;background:'+bgColor+';" onclick="window._ttEditCourse('+tt.courses.indexOf(c)+')">' +
                        '<div class="tt-course-name">'+c.name+'</div>' +
                        '<div class="tt-course-loc">'+(c.location||'')+'</div>' +
                    '</div>';
                }
                html += '<div class="tt-cell">'+cellHtml+'</div>';
            }
        }

        html += '</div></div>';
        return html;
    }

    // 课表操作
    window._ttPrevWeek = function(){ if(ttCurrentWeek>1) ttCurrentWeek--; renderCouple(); };
    window._ttNextWeek = function(){
        var space = getCurrentCoupleSpace(); if(!space) return;
        var tt = getTimetableData(space);
        if(ttCurrentWeek<tt.settings.totalWeeks) ttCurrentWeek++;
        renderCouple();
    };
    window._ttShowImport = function(){ ttShowImport=true; renderCouple(); };
    window._ttOpenSettings = function(){ ttShowSettings=true; renderCouple(); };
    window._ttCloseSettings = function(){ ttShowSettings=false; renderCouple(); };
    window._ttAddCourse = function(){ _ttFormDraft=null; ttEditingCourse = -1; renderCouple(); };
    window._ttEditCourse = function(idx){ _ttFormDraft=null; ttEditingCourse = idx; renderCouple(); };
    window._ttCloseEdit = function(){ _ttFormDraft=null; ttEditingCourse = null; renderCouple(); };

    // ===== 课表设置 =====
    function renderTTSettings(space) {
        var tt = getTimetableData(space);
        var s = tt.settings;
        var periodTimes = calcPeriodTimes(s);

        var periodTimesHtml = '';
        for(var i=0;i<s.periodsPerDay;i++){
            var pt = (s.periodTimes && s.periodTimes[i]) || periodTimes[i] || {start:'',end:''};
            var label = '';
            if(i===0) label = '【上午】';
            if(i===4) label = '【下午】';
            if(i===8) label = '【晚上】';
            periodTimesHtml += (label ? '<div style="font-size:12px;color:#ff6b8a;font-weight:600;margin:8px 0 4px;">'+label+'</div>' : '') +
                '<div class="tt-settings-row">' +
                    '<label>第'+(i+1)+'节</label>' +
                    '<input type="time" id="tt-pt-start-'+i+'" value="'+pt.start+'">' +
                    '<span>~</span>' +
                    '<input type="time" id="tt-pt-end-'+i+'" value="'+pt.end+'">' +
                '</div>';
        }

        return '<div style="flex:1;overflow-y:auto;padding:16px;background:#f5f5f7;">' +
            '<div style="background:#fff;border-radius:16px;padding:16px;margin-bottom:12px;">' +
                '<div style="font-size:15px;font-weight:600;color:#333;margin-bottom:12px;">基本设置</div>' +
                '<div class="tt-settings-row"><label>学期开始</label><input type="date" id="tt-sem-start" value="'+(tt.semesterStart||'')+'"></div>' +
                '<div class="tt-settings-row"><label>总周数</label><input type="number" id="tt-total-weeks" value="'+s.totalWeeks+'" min="1" max="30"></div>' +
                '<div class="tt-settings-row"><label>每日节数</label><input type="number" id="tt-periods" value="'+s.periodsPerDay+'" min="1" max="16"></div>' +
            '</div>' +
            '<div style="background:#fff;border-radius:16px;padding:16px;margin-bottom:12px;">' +
                '<div style="font-size:15px;font-weight:600;color:#333;margin-bottom:12px;">时间设置</div>' +
                '<div class="tt-settings-row"><label>上午开始</label><input type="time" id="tt-morning" value="'+s.morningStart+'"></div>' +
                '<div class="tt-settings-row"><label>下午开始</label><input type="time" id="tt-afternoon" value="'+s.afternoonStart+'"></div>' +
                '<div class="tt-settings-row"><label>晚上开始</label><input type="time" id="tt-evening" value="'+s.eveningStart+'"></div>' +
                '<div class="tt-settings-row"><label>每节时长</label><input type="number" id="tt-duration" value="'+s.periodDuration+'" min="1" max="120"> 分钟</div>' +
                '<div class="tt-settings-row"><label>课间休息</label><input type="number" id="tt-break" value="'+s.breakDuration+'" min="1" max="60"> 分钟</div>' +
                '<div class="tt-settings-row"><label>大课间时长</label><input type="number" id="tt-bigbreak" value="'+s.bigBreakDuration+'" min="1" max="60"> 分钟</div>' +
            '</div>' +
            '<div style="background:#fff;border-radius:16px;padding:16px;margin-bottom:12px;">' +
                '<div style="font-size:15px;font-weight:600;color:#333;margin-bottom:12px;">每节课具体时间 <span style="font-size:11px;color:#999;">（可选，覆盖自动计算）</span></div>' +
                periodTimesHtml +
            '</div>' +
            '<div style="display:flex;gap:8px;margin-top:12px;">' +
                '<button onclick="window._ttCloseSettings()" style="flex:1;padding:12px;border:1px solid #ddd;border-radius:12px;background:#fff;font-size:14px;cursor:pointer;">取消</button>' +
                '<button onclick="window._ttSaveSettings()" style="flex:1;padding:12px;border:none;border-radius:12px;background:#ff6b8a;color:#fff;font-size:14px;cursor:pointer;">保存</button>' +
            '</div>' +
        '</div>';
    }

    window._ttSaveSettings = function(){
        var space = getCurrentCoupleSpace(); if(!space) return;
        var tt = getTimetableData(space);
        tt.semesterStart = document.getElementById('tt-sem-start').value;
        var s = tt.settings;
        s.totalWeeks = parseInt(document.getElementById('tt-total-weeks').value)||20;
        s.periodsPerDay = parseInt(document.getElementById('tt-periods').value)||12;
        s.morningStart = document.getElementById('tt-morning').value||'08:00';
        s.afternoonStart = document.getElementById('tt-afternoon').value||'14:00';
        s.eveningStart = document.getElementById('tt-evening').value||'19:00';
        s.periodDuration = parseInt(document.getElementById('tt-duration').value)||45;
        s.breakDuration = parseInt(document.getElementById('tt-break').value)||10;
        s.bigBreakDuration = parseInt(document.getElementById('tt-bigbreak').value)||20;
        // 保存自定义时间
        s.periodTimes = [];
        for(var i=0;i<s.periodsPerDay;i++){
            var startEl = document.getElementById('tt-pt-start-'+i);
            var endEl = document.getElementById('tt-pt-end-'+i);
            if(startEl && endEl && startEl.value && endEl.value) {
                s.periodTimes.push({start:startEl.value, end:endEl.value});
            } else {
                s.periodTimes.push(null);
            }
        }
        // 清理null
        var hasCustom = s.periodTimes.some(function(x){return x!==null;});
        if(!hasCustom) s.periodTimes = [];
        else {
            var auto = calcPeriodTimes({morningStart:s.morningStart,afternoonStart:s.afternoonStart,eveningStart:s.eveningStart,periodDuration:s.periodDuration,breakDuration:s.breakDuration,bigBreakAfter:s.bigBreakAfter,bigBreakDuration:s.bigBreakDuration,periodsPerDay:s.periodsPerDay,periodTimes:[]});
            for(var j=0;j<s.periodTimes.length;j++){
                if(!s.periodTimes[j]) s.periodTimes[j] = auto[j]||{start:'',end:''};
            }
        }
        save(); ttShowSettings=false; renderCouple(); toast('设置已保存');
    };

    // ===== 课程编辑 =====
    function renderCourseEdit(space) {
        var tt = getTimetableData(space);
        var isNew = ttEditingCourse === -1;
        var course = isNew ? {name:'',location:'',teacher:'',day:0,startPeriod:1,duration:2,weeks:[],color:''} : tt.courses[ttEditingCourse];
        if(!course) { ttEditingCourse=null; _ttFormDraft=null; renderCouple(); return ''; }

        // [FIX-课表卡住] 如果有保存的表单草稿，用草稿值替代原始数据
        var formName = course.name;
        var formLoc = course.location || '';
        var formTeacher = course.teacher || '';
        var formDay = course.day;
        var formStartP = course.startPeriod;
        var formDur = course.duration;
        if(_ttFormDraft) {
            formName = _ttFormDraft.name;
            formLoc = _ttFormDraft.loc;
            formTeacher = _ttFormDraft.teacher;
            formDay = parseInt(_ttFormDraft.day) || 0;
            formStartP = parseInt(_ttFormDraft.startP) || 1;
            formDur = parseInt(_ttFormDraft.dur) || 2;
        }

        // 对于新课程，从_tempWeeks获取周数；对于编辑，从course.weeks获取
        var activeWeeks = isNew ? _tempWeeks : (course.weeks || []);
        var weekChips = '';
        for(var w=1;w<=tt.settings.totalWeeks;w++){
            var active = activeWeeks.indexOf(w)>=0;
            weekChips += '<div class="tt-ce-week-chip '+(active?'active':'')+'" onclick="window._ttToggleWeek('+w+')">'+w+'</div>';
        }

        var dayOptions = '';
        for(var d=0;d<7;d++){
            dayOptions += '<option value="'+d+'" '+(formDay===d?'selected':'')+'>'+WEEKDAY_FULL[d]+'</option>';
        }

        // 确定当前颜色
        var currentColor = isNew ? (_tempColor || '') : (course.color || '');
        var colorDots = '';
        for(var ci=0;ci<TT_COLORS.length;ci++){
            var sel = currentColor===TT_COLORS[ci];
            colorDots += '<div class="tt-color-dot '+(sel?'selected':'')+'" style="background:'+TT_COLORS[ci]+';" onclick="window._ttPickColor(\''+TT_COLORS[ci]+'\')"></div>';
        }

        return '<div style="flex:1;overflow-y:auto;padding:16px;background:#f5f5f7;">' +
            '<div style="background:#fff;border-radius:16px;padding:16px;">' +
                '<div style="font-size:16px;font-weight:600;color:#333;margin-bottom:16px;text-align:center;">'+(isNew?'添加课程':'编辑课程')+'</div>' +
                '<div class="tt-ce-row"><label>课程名称</label><input id="tt-ce-name" value="'+formName.replace(/"/g,'&quot;')+'"></div>' +
                '<div class="tt-ce-row"><label>上课地点</label><input id="tt-ce-loc" value="'+formLoc.replace(/"/g,'&quot;')+'"></div>' +
                '<div class="tt-ce-row"><label>教师</label><input id="tt-ce-teacher" value="'+formTeacher.replace(/"/g,'&quot;')+'"></div>' +
                '<div class="tt-ce-row"><label>星期</label><select id="tt-ce-day">'+dayOptions+'</select></div>' +
                '<div class="tt-ce-row"><label>开始节次</label><input id="tt-ce-start" type="number" value="'+formStartP+'" min="1" max="'+tt.settings.periodsPerDay+'"></div>' +
                '<div class="tt-ce-row"><label>持续节数</label><input id="tt-ce-dur" type="number" value="'+formDur+'" min="1" max="6"></div>' +
                '<div class="tt-ce-row"><label>颜色</label><div class="tt-color-row">'+colorDots+'</div></div>' +
                '<div class="tt-ce-row"><label>上课周数 <span style="font-size:11px;color:#999;">（点击选择）</span></label>' +
                    '<div class="tt-ce-weeks" id="tt-ce-weeks">'+weekChips+'</div>' +
                    '<div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap;">' +
                        '<button onclick="window._ttWeeksAll()" style="font-size:11px;padding:3px 8px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;">全选</button>' +
                        '<button onclick="window._ttWeeksOdd()" style="font-size:11px;padding:3px 8px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;">单周</button>' +
                        '<button onclick="window._ttWeeksEven()" style="font-size:11px;padding:3px 8px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;">双周</button>' +
                        '<button onclick="window._ttWeeksClear()" style="font-size:11px;padding:3px 8px;border:1px solid #ddd;border-radius:8px;background:#fff;cursor:pointer;">清空</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;margin-top:12px;">' +
                '<button onclick="window._ttCloseEdit()" style="flex:1;padding:12px;border:1px solid #ddd;border-radius:12px;background:#fff;font-size:14px;cursor:pointer;">取消</button>' +
                (!isNew?'<button onclick="window._ttDeleteCourse()" style="padding:12px 16px;border:none;border-radius:12px;background:#ff4444;color:#fff;font-size:14px;cursor:pointer;">删除</button>':'') +
                '<button onclick="window._ttSaveCourse()" style="flex:1;padding:12px;border:none;border-radius:12px;background:#ff6b8a;color:#fff;font-size:14px;cursor:pointer;">保存</button>' +
            '</div>' +
        '</div>';
    }

    // 临时周数选择状态
    var _tempWeeks = [];
    var _tempColor = '';
    // [FIX-课表卡住] 临时表单状态，防止renderCouple()重建DOM时丢失输入
    var _ttFormDraft = null; // {name, loc, teacher, day, startP, dur}

    // [FIX-课表卡住] 保存当前课程编辑表单的输入值到临时状态
    function _ttSaveFormDraft() {
        var nameEl = document.getElementById('tt-ce-name');
        if(!nameEl) return; // 表单不存在则不保存
        _ttFormDraft = {
            name: nameEl.value,
            loc: (document.getElementById('tt-ce-loc')||{}).value || '',
            teacher: (document.getElementById('tt-ce-teacher')||{}).value || '',
            day: (document.getElementById('tt-ce-day')||{}).value || '0',
            startP: (document.getElementById('tt-ce-start')||{}).value || '1',
            dur: (document.getElementById('tt-ce-dur')||{}).value || '2'
        };
    }

    window._ttToggleWeek = function(w){
        _ttSaveFormDraft(); // [FIX-课表卡住] 保存表单状态
        var space = getCurrentCoupleSpace(); if(!space) return;
        var tt = getTimetableData(space);
        var isNew = ttEditingCourse === -1;
        var course = isNew ? null : tt.courses[ttEditingCourse];
        if(isNew) {
            var idx = _tempWeeks.indexOf(w);
            if(idx>=0) _tempWeeks.splice(idx,1); else _tempWeeks.push(w);
        } else if(course) {
            if(!course.weeks) course.weeks=[];
            var idx2 = course.weeks.indexOf(w);
            if(idx2>=0) course.weeks.splice(idx2,1); else course.weeks.push(w);
        }
        renderCouple();
    };

    window._ttPickColor = function(color){
        _ttSaveFormDraft(); // [FIX-课表卡住] 保存表单状态
        var space = getCurrentCoupleSpace(); if(!space) return;
        var tt = getTimetableData(space);
        if(ttEditingCourse===-1) { _tempColor=color; }
        else if(tt.courses[ttEditingCourse]) { tt.courses[ttEditingCourse].color=color; }
        renderCouple();
    };

    window._ttWeeksAll = function(){ _setWeeksHelper(function(w){return true;}); };
    window._ttWeeksOdd = function(){ _setWeeksHelper(function(w){return w%2===1;}); };
    window._ttWeeksEven = function(){ _setWeeksHelper(function(w){return w%2===0;}); };
    window._ttWeeksClear = function(){ _setWeeksHelper(function(){return false;}); };

    function _setWeeksHelper(fn) {
        _ttSaveFormDraft(); // [FIX-课表卡住] 保存表单状态
        var space = getCurrentCoupleSpace(); if(!space) return;
        var tt = getTimetableData(space);
        var totalW = tt.settings.totalWeeks;
        var weeks = [];
        for(var w=1;w<=totalW;w++) if(fn(w)) weeks.push(w);
        if(ttEditingCourse===-1) { _tempWeeks=weeks; }
        else if(tt.courses[ttEditingCourse]) { tt.courses[ttEditingCourse].weeks=weeks; }
        renderCouple();
    }

    window._ttSaveCourse = function(){
        var space = getCurrentCoupleSpace(); if(!space) return;
        var tt = getTimetableData(space);
        var name = document.getElementById('tt-ce-name').value.trim();
        if(!name){ toast('请输入课程名称'); return; }
        var loc = document.getElementById('tt-ce-loc').value.trim();
        var teacher = document.getElementById('tt-ce-teacher').value.trim();
        var day = parseInt(document.getElementById('tt-ce-day').value);
        var startP = parseInt(document.getElementById('tt-ce-start').value)||1;
        var dur = parseInt(document.getElementById('tt-ce-dur').value)||2;

        if(ttEditingCourse===-1) {
            tt.courses.push({name:name, location:loc, teacher:teacher, day:day, startPeriod:startP, duration:dur, weeks:_tempWeeks.slice(), color:_tempColor||TT_COLORS[tt.courses.length%TT_COLORS.length]});
            _tempWeeks=[]; _tempColor='';
        } else {
            var c = tt.courses[ttEditingCourse];
            c.name=name; c.location=loc; c.teacher=teacher; c.day=day; c.startPeriod=startP; c.duration=dur;
        }
        _ttFormDraft=null; // [FIX-课表卡住] 清除表单草稿
        save(); ttEditingCourse=null; renderCouple(); toast('已保存');

        // 课表保存到记忆
        _saveTimetableToMemory(space);
    };

    window._ttDeleteCourse = function(){
        _ttFormDraft=null; // [FIX-课表卡住] 清除表单草稿
        var space = getCurrentCoupleSpace(); if(!space) return;
        var tt = getTimetableData(space);
        if(ttEditingCourse>=0 && ttEditingCourse<tt.courses.length) {
            tt.courses.splice(ttEditingCourse, 1);
            save(); ttEditingCourse=null; renderCouple(); toast('已删除');
            _saveTimetableToMemory(space);
        }
    };

    // ===== Excel 导入 =====
    function renderImportView(space) {
        return '<div style="flex:1;overflow-y:auto;padding:16px;background:#f5f5f7;">' +
            '<div class="tt-import-zone" onclick="document.getElementById(\'tt-excel-input\').click()">' +
                '<i class="fas fa-file-excel"></i>' +
                '<p>点击上传Excel课表文件 (.xlsx / .xls / .csv)</p>' +
                '<p style="font-size:11px;color:#bbb;margin-top:8px;">支持智能识别课程名、教室、周数等信息</p>' +
            '</div>' +
            '<input type="file" id="tt-excel-input" accept=".xlsx,.xls,.csv" style="display:none;" onchange="window._ttHandleExcel(this)">' +
            '<div style="background:#fff;border-radius:14px;padding:14px;margin-top:12px;">' +
                '<div style="font-size:14px;font-weight:600;color:#333;margin-bottom:8px;">📋 导入说明</div>' +
                '<div style="font-size:12px;color:#888;line-height:1.8;">' +
                    '1. 支持标准课表Excel格式<br>' +
                    '2. 第一行为星期标题（周一~周日）<br>' +
                    '3. 第一列为节次（第1节、第2节...）<br>' +
                    '4. 自动识别格式：课程名@教室(1-16周)<br>' +
                    '5. 也支持：课程名\\n教室\\n1-8周单周 等格式<br>' +
                    '6. 智能识别单周、双周、指定周数范围<br>' +
                    '7. 支持多种课表导出格式（超级课程表、WakeUp等）<br>' +
                '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px;margin-top:12px;">' +
                '<button onclick="window._ttCloseImport()" style="flex:1;padding:12px;border:1px solid #ddd;border-radius:12px;background:#fff;font-size:14px;cursor:pointer;">返回</button>' +
            '</div>' +
        '</div>';
    }

    window._ttCloseImport = function(){ ttShowImport=false; renderCouple(); };

    window._ttHandleExcel = function(input){
        var file = input.files[0];
        if(!file) return;
        var reader = new FileReader();
        var isCSV = file.name.toLowerCase().endsWith('.csv');

        reader.onload = async function(e){
            try {
                var data;
                if(isCSV) {
                    data = parseCSV(e.target.result);
                } else {
                    data = parseExcelBinary(new Uint8Array(e.target.result));
                }
                if(data && data.length>0) {
                    // [FIX-AI解析课表] 先尝试用AI解析Excel数据，AI只作为工具，没有人设
                    var aiParsed = false;
                    if(typeof API !== 'undefined' && API.chatCompletion) {
                        toast('正在用AI智能解析课表...', 'info');
                        try {
                            aiParsed = await _aiParseExcelTimetable(data);
                        } catch(aiErr) {
                            console.warn('[课表AI解析] AI解析失败，回退到本地解析:', aiErr);
                        }
                    }
                    if(!aiParsed) {
                        importTimetableFromData(data);
                    }
                    toast('导入成功！', 'success');
                } else {
                    toast('未能解析课表数据', 'error');
                }
            } catch(ex) {
                console.error('Excel import error:', ex);
                toast('导入失败: '+ex.message, 'error');
            }
        };

        if(isCSV) reader.readAsText(file);
        else reader.readAsArrayBuffer(file);
        input.value = '';
    };

    // [FIX-AI解析课表] 用AI解析Excel课表数据（AI只作为工具，没有人设）
    async function _aiParseExcelTimetable(data) {
        // 将二维数组转为文本表格
        var tableText = '';
        var maxRows = Math.min(data.length, 30); // 限制行数避免token过多
        for(var i = 0; i < maxRows; i++) {
            var row = data[i];
            if(!row) continue;
            tableText += row.map(function(cell) { return String(cell || '').substring(0, 50); }).join(' | ') + '\n';
        }
        if(!tableText.trim()) return false;

        var sysPrompt = '你是一个课表解析工具。用户上传了一个Excel课表文件，请分析其中的课程信息。\n\n' +
            '【任务】从以下表格数据中提取所有课程信息。\n' +
            '【输出格式】严格按JSON数组输出，每个课程一个对象：\n' +
            '[{"name":"课程名","day":0,"startPeriod":1,"duration":2,"location":"教室","weeks":[1,2,3...],"teacher":"教师名"}]\n' +
            '其中day: 0=周一,1=周二,...,6=周日; startPeriod从1开始; weeks是上课周数数组。\n' +
            '如果无法确定某个字段，可以省略。weeks默认为[1,2,3,...,16]。\n' +
            '只输出JSON数组，不要有其他任何文字。';

        var result = await API.chatCompletion([
            { role: 'system', content: sysPrompt },
            { role: 'user', content: '以下是课表数据：\n' + tableText }
        ], { temperature: 0.1, maxTokens: 2000 });

        var reply = (result && result.choices && result.choices[0] && result.choices[0].message) ? result.choices[0].message.content : '';
        if(!reply) return false;

        // 提取JSON
        var jsonMatch = reply.match(/\[[\s\S]*\]/);
        if(!jsonMatch) return false;

        try {
            var courses = JSON.parse(jsonMatch[0]);
            if(!Array.isArray(courses) || courses.length === 0) return false;

            var tt = getTimetableData(null);
            var colorIdx = tt.courses.length;

            courses.forEach(function(c) {
                if(!c.name) return;
                tt.courses.push({
                    name: c.name,
                    day: typeof c.day === 'number' ? c.day : 0,
                    startPeriod: c.startPeriod || 1,
                    duration: c.duration || 2,
                    location: c.location || '',
                    teacher: c.teacher || '',
                    weeks: c.weeks || Array.from({length:16}, function(_,i){return i+1;}),
                    color: TT_COLORS[colorIdx++ % TT_COLORS.length]
                });
            });

            save();
            ttShowImport = false;
            renderCouple();
            console.log('[课表AI解析] 成功导入', courses.length, '门课程');
            return true;
        } catch(parseErr) {
            console.warn('[课表AI解析] JSON解析失败:', parseErr);
            return false;
        }
    }

    // CSV解析
    function parseCSV(text) {
        var lines = text.split('\n');
        var result = [];
        for(var i=0;i<lines.length;i++){
            var line = lines[i].trim();
            if(!line) continue;
            // 简单CSV解析
            var cells = [];
            var inQuote = false;
            var cell = '';
            for(var j=0;j<line.length;j++){
                var ch = line[j];
                if(ch==='"') { inQuote=!inQuote; }
                else if((ch===','||ch==='\t') && !inQuote) { cells.push(cell.trim()); cell=''; }
                else { cell+=ch; }
            }
            cells.push(cell.trim());
            result.push(cells);
        }
        return result;
    }

    // 简单Excel二进制解析（使用内置方式，兼容基本xlsx）
    function parseExcelBinary(uint8arr) {
        // 尝试使用SheetJS如果可用
        if(typeof XLSX !== 'undefined') {
            var wb = XLSX.read(uint8arr, {type:'array'});
            var ws = wb.Sheets[wb.SheetNames[0]];
            return XLSX.utils.sheet_to_json(ws, {header:1});
        }
        // 简单fallback：尝试解析为文本
        var text = '';
        for(var i=0;i<uint8arr.length;i++){
            var c = uint8arr[i];
            if(c>=32 && c<127) text+=String.fromCharCode(c);
            else if(c===10||c===13) text+='\n';
            else text+=' ';
        }
        // 尝试CSV格式解析
        return parseCSV(text);
    }

    // 从二维数组导入课表（增强版识别v2）
    function importTimetableFromData(data) {
        var space = getCurrentCoupleSpace(); if(!space) return;
        var tt = getTimetableData(space);

        console.log('[课表导入] 原始数据行数:', data.length);
        if(data.length > 0) console.log('[课表导入] 第一行:', JSON.stringify(data[0]));

        // 尝试找到标题行（含有"周一"或"Monday"或"星期"）
        var headerRow = -1;
        for(var i=0;i<Math.min(data.length,15);i++){
            var row = data[i];
            if(!row) continue;
            var rowText = row.join(' ');
            if(/周一|周二|星期一|星期二|Monday|Mon/.test(rowText)) {
                headerRow = i; break;
            }
        }
        if(headerRow===-1) {
            // 更宽泛的匹配：包含多个"一二三四五"
            for(var i2=0;i2<Math.min(data.length,15);i2++){
                var row2 = data[i2];
                if(!row2) continue;
                var rowText2 = row2.join(' ');
                var dayCount = 0;
                if(/一/.test(rowText2)) dayCount++;
                if(/二/.test(rowText2)) dayCount++;
                if(/三/.test(rowText2)) dayCount++;
                if(/四/.test(rowText2)) dayCount++;
                if(/五/.test(rowText2)) dayCount++;
                if(dayCount >= 3 && row2.length >= 5) {
                    headerRow = i2; break;
                }
            }
        }
        if(headerRow===-1) headerRow = 0;
        console.log('[课表导入] 标题行:', headerRow, data[headerRow]);

        // 找出列对应的星期
        var dayMap = {};
        var headerCells = data[headerRow]||[];
        for(var ci=0;ci<headerCells.length;ci++){
            var cell = String(headerCells[ci]||'').trim();
            if(/周一|星期一|Monday|Mon/.test(cell)) dayMap[ci]=0;
            else if(/周二|星期二|Tuesday|Tue/.test(cell)) dayMap[ci]=1;
            else if(/周三|星期三|Wednesday|Wed/.test(cell)) dayMap[ci]=2;
            else if(/周四|星期四|Thursday|Thu/.test(cell)) dayMap[ci]=3;
            else if(/周五|星期五|Friday|Fri/.test(cell)) dayMap[ci]=4;
            else if(/周六|星期六|Saturday|Sat/.test(cell)) dayMap[ci]=5;
            else if(/周日|周天|星期日|星期天|Sunday|Sun/.test(cell)) dayMap[ci]=6;
        }
        // 单字匹配（仅当上面没匹配到时）
        if(Object.keys(dayMap).length < 3) {
            dayMap = {};
            for(var ci2=0;ci2<headerCells.length;ci2++){
                var cell2 = String(headerCells[ci2]||'').trim();
                if(/^一$/.test(cell2)) dayMap[ci2]=0;
                else if(/^二$/.test(cell2)) dayMap[ci2]=1;
                else if(/^三$/.test(cell2)) dayMap[ci2]=2;
                else if(/^四$/.test(cell2)) dayMap[ci2]=3;
                else if(/^五$/.test(cell2)) dayMap[ci2]=4;
                else if(/^六$/.test(cell2)) dayMap[ci2]=5;
                else if(/^日$|^七$/.test(cell2)) dayMap[ci2]=6;
            }
        }

        // 如果没识别到星期，假设从第2列开始为周一~周五（或更多）
        if(Object.keys(dayMap).length===0) {
            var maxDayCols = Math.min(headerCells.length, 8);
            for(var k=1;k<maxDayCols;k++) dayMap[k]=k-1;
        }
        console.log('[课表导入] 星期映射:', JSON.stringify(dayMap));

        // 解析课程内容 - 增强版v2
        var newCourses = [];
        var colorIdx = 0;
        var courseColorMap = {};
        var _periodTracker = {}; // 跟踪每列的当前节次

        for(var ri=headerRow+1;ri<data.length;ri++){
            var row3 = data[ri];
            if(!row3) continue;

            // 跳过全空行
            var rowContent = row3.join('').replace(/\s/g,'');
            if(!rowContent) continue;

            // 第一列可能是节次信息
            var periodNum = 0;
            var firstCell = String(row3[0]||'').trim();

            // 检查第一列是否是"上午""下午""晚上"等分区标记，跳过
            if(/^(上午|下午|晚上|morning|afternoon|evening)$/i.test(firstCell)) continue;

            // 增强节次识别：匹配各种格式
            var periodMatch = firstCell.match(/第?\s*(\d+)\s*[-~到]\s*(\d+)\s*[节课]/) ||
                              firstCell.match(/第?\s*(\d+)\s*[节课]/) ||
                              firstCell.match(/^(\d+)\s*[-~]\s*(\d+)\s*$/) ||
                              firstCell.match(/^(\d+)\s*$/) ||
                              firstCell.match(/^(\d+)[、,.]/) ||
                              firstCell.match(/(\d+)/);
            if(periodMatch) {
                periodNum = parseInt(periodMatch[1]);
                // 如果是范围格式如"1-2"，记录duration
                var _periodEnd = periodMatch[2] ? parseInt(periodMatch[2]) : 0;
            }
            if(!periodNum || periodNum > 20) periodNum = ri - headerRow;

            for(var colIdx in dayMap) {
                var dayVal = dayMap[colIdx];
                var content = String(row3[colIdx]||'').trim();

                // 过滤空内容
                if(!content) continue;
                // 过滤明显的占位符
                if(/^[-—\/\\]$/.test(content) || content==='无' || content==='空' || content==='null' || content==='undefined') continue;
                // 过滤纯1-2位数字（节次号）
                if(/^\d{1,2}$/.test(content)) continue;
                // 过滤纯时间格式（如 08:00-08:45）
                if(/^\d{1,2}:\d{2}\s*[-~]\s*\d{1,2}:\d{2}$/.test(content)) continue;
                // 过滤表头关键字
                if(/^(节次|时间|节|课|period|time|备注|说明)$/i.test(content)) continue;
                // 过滤星期标记（防止标题行下面还有子标题）
                if(/^(周[一二三四五六日天]|星期[一二三四五六日天])$/.test(content)) continue;
                // 过滤上下午标记
                if(/^(上午|下午|晚上|午休|课间)$/.test(content)) continue;

                console.log('[课表导入] 解析单元格 [行'+ri+',列'+colIdx+',周'+(dayVal+1)+',第'+periodNum+'节]:', content.substring(0,50));

                // 解析课程信息（增强版v2）
                var parsed = parseCourseCell(content);
                if(parsed.length === 0) {
                    // 如果标准解析失败，尝试直接把内容当课程名
                    var fallbackName = content.replace(/\n/g,' ').replace(/\s+/g,' ').trim();
                    if(fallbackName.length >= 2 && fallbackName.length <= 30 && !_isNotCourseName(fallbackName)) {
                        parsed = [{name: fallbackName, location:'', teacher:'', weeks:[], duration:1}];
                    }
                }

                for(var pi=0;pi<parsed.length;pi++){
                    var p = parsed[pi];
                    if(!p.name) continue;

                    // 清理课程名称
                    p.name = p.name.replace(/^\s*[-·•]\s*/, '').trim();
                    if(!p.name || p.name.length < 2) continue;

                    // 过滤明显不是课程名的内容
                    if(_isNotCourseName(p.name)) continue;

                    // 课程名太长
                    if(p.name.length > 30) continue;

                    // 分配颜色
                    if(!courseColorMap[p.name]) {
                        courseColorMap[p.name] = TT_COLORS[colorIdx % TT_COLORS.length];
                        colorIdx++;
                    }

                    // 检查是否已存在同一课程在同一时间段（防止重复）
                    var exists = newCourses.some(function(nc) {
                        return nc.name === p.name && nc.day === dayVal && nc.startPeriod === periodNum;
                    });
                    if(exists) continue;

                    // 如果节次是范围格式（如1-2），自动设置duration
                    var autoDuration = p.duration || 1;
                    if(_periodEnd && _periodEnd > periodNum) {
                        autoDuration = Math.max(autoDuration, _periodEnd - periodNum + 1);
                    }

                    newCourses.push({
                        name: p.name,
                        location: p.location||'',
                        teacher: p.teacher||'',
                        day: dayVal,
                        startPeriod: periodNum,
                        duration: autoDuration,
                        weeks: p.weeks.length>0 ? p.weeks : generateDefaultWeeks(tt.settings.totalWeeks),
                        color: courseColorMap[p.name]
                    });
                    console.log('[课表导入] ✓ 识别课程:', p.name, '周'+(dayVal+1), '第'+periodNum+'节');
                }
            }
        }

        // 合并相邻节次的同一课程
        newCourses = _mergeAdjacentCourses(newCourses);

        console.log('[课表导入] 共识别课程数:', newCourses.length);
        if(newCourses.length>0) {
            tt.courses = tt.courses.concat(newCourses);
            save();
            // 保存课表到记忆
            _saveTimetableToMemory(space);
            toast('成功导入 ' + newCourses.length + ' 门课程！', 'success');
        } else {
            toast('未能识别到课程，请检查文件格式', 'error');
        }
        ttShowImport = false;
        renderCouple();
    }

    // 判断是否不是课程名（宽松版v2）
    function _isNotCourseName(name) {
        // 纯数字
        if(/^\d+$/.test(name)) return true;
        // 时间格式
        if(/^\d{1,2}:\d{2}/.test(name)) return true;
        // 节次标记
        if(/^第?\d+[-~]?\d*[节课]$/.test(name)) return true;
        // 星期标记
        if(/^(周[一二三四五六日天]|星期[一二三四五六日天])$/.test(name)) return true;
        // 上下午
        if(/^(上午|下午|晚上|午休|课间|早上|中午)$/.test(name)) return true;
        // 纯标点或特殊字符（不含中文和字母）
        if(/^[^\u4e00-\u9fa5A-Za-z]+$/.test(name)) return true;
        // 只有1个字
        if(name.length <= 1) return true;
        return false;
    }

    // 合并相邻节次的同一课程
    function _mergeAdjacentCourses(courses) {
        if(!courses || courses.length === 0) return courses;

        // 按天、名称、开始节次排序
        courses.sort(function(a, b) {
            if(a.day !== b.day) return a.day - b.day;
            if(a.name !== b.name) return a.name.localeCompare(b.name);
            return a.startPeriod - b.startPeriod;
        });

        var merged = [];
        var i = 0;
        while(i < courses.length) {
            var current = Object.assign({}, courses[i]);
            // 往后看，合并同名、同天、相邻节次的课
            while(i + 1 < courses.length &&
                  courses[i+1].name === current.name &&
                  courses[i+1].day === current.day &&
                  courses[i+1].startPeriod === current.startPeriod + current.duration) {
                current.duration += courses[i+1].duration;
                // 如果后面的课有地点但前面没有，补上
                if(!current.location && courses[i+1].location) current.location = courses[i+1].location;
                if(!current.teacher && courses[i+1].teacher) current.teacher = courses[i+1].teacher;
                i++;
            }
            merged.push(current);
            i++;
        }
        return merged;
    }

    function generateDefaultWeeks(total) {
        var w = [];
        for(var i=1;i<=total;i++) w.push(i);
        return w;
    }

    // ===== 增强版课程单元格解析 =====
    function parseCourseCell(text) {
        var results = [];
        // 清理文本
        text = text.replace(/\r/g, '').trim();
        if(!text) return results;

        // 先检测是否整个单元格就是一门课程的多行信息
        var lines = text.split(/\n/).filter(function(s){return s.trim();});

        // 如果只有一行，直接解析
        if(lines.length <= 1) {
            var parsed = _parseSingleCourseSegment(text);
            if(parsed && parsed.name && !_isNotCourseName(parsed.name)) {
                results.push(parsed);
            }
            return results;
        }

        // 多行内容：先尝试分组为多门课程
        // 典型格式是每门课程由：课程名\n教室\n周数 组成（2-4行一组）
        // 先检测是否有多门课程的分界线（通常是空行或者课程名行）
        var courseGroups = _splitIntoCourseGroups(lines);

        for(var gi = 0; gi < courseGroups.length; gi++) {
            var group = courseGroups[gi];
            var combinedResult = _tryParseMultilineAsOneCourse(group);
            if(combinedResult && combinedResult.name && !_isNotCourseName(combinedResult.name)) {
                results.push(combinedResult);
            }
        }

        return results;
    }

    // 将多行内容拆分为多个课程组
    function _splitIntoCourseGroups(lines) {
        // 如果行数<=4，可能就是一门课的多行信息
        if(lines.length <= 4) {
            return [lines];
        }

        // 超过4行，尝试检测分组模式
        // 常见：每组2-4行，可能有空行分隔或者通过内容特征判断
        var groups = [];
        var currentGroup = [];

        for(var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if(!line) {
                // 空行作为分隔
                if(currentGroup.length > 0) {
                    groups.push(currentGroup);
                    currentGroup = [];
                }
                continue;
            }

            // 如果当前组已有课程名(>0行)，且新行看起来像另一门课程名（长度>4的中文，不是地点/周数/教师）
            if(currentGroup.length >= 2) {
                var isNewCourse = _looksLikeCourseName(line) && !_looksLikeLocation(line) && !_looksLikeWeekInfo(line) && !_looksLikeTeacher(line);
                if(isNewCourse) {
                    groups.push(currentGroup);
                    currentGroup = [line];
                    continue;
                }
            }

            currentGroup.push(line);
        }

        if(currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        return groups.length > 0 ? groups : [lines];
    }

    // 辅助判断函数
    function _looksLikeCourseName(s) {
        s = s.trim();
        // 课程名通常包含中文，长度>=2
        if(s.length < 2) return false;
        if(/[\u4e00-\u9fa5]/.test(s) && s.length >= 2 && s.length <= 30) {
            // 不是纯数字、不是地点、不是周数
            if(/^\d+$/.test(s)) return false;
            if(_looksLikeLocation(s)) return false;
            if(_looksLikeWeekInfo(s)) return false;
            return true;
        }
        // 英文课程名
        if(/^[A-Z]/.test(s) && s.length >= 3 && !/^\d/.test(s.charAt(1))) return true;
        return false;
    }

    function _looksLikeLocation(s) {
        s = s.trim();
        if(/^[A-Za-z]?\d{1,4}[-#]?\d{0,4}$/.test(s)) return true;
        if(/[楼栋室号馆堂]/.test(s)) return true;
        if(/^(教[学室]|实验|多媒体|语音|机房|综合|阶梯|图书|体育)/.test(s)) return true;
        if(/^[A-Za-z]\d/.test(s) && s.length <= 10) return true;
        if(/^[A-Z]-?\d/.test(s)) return true;
        return false;
    }

    function _looksLikeWeekInfo(s) {
        s = s.trim();
        if(/\d+.*周|周.*\d+|[单双]周|第\d+.*周/.test(s)) return true;
        // 纯粹的数字范围如"1-16"也可能是周数
        if(/^\d+-\d+$/.test(s)) return true;
        return false;
    }

    function _looksLikeTeacher(s) {
        s = s.trim();
        // 2-4个汉字，无数字和特殊字符
        // 但必须排除常见课程关键字，避免把"高数""英语""体育"等误判为教师名
        if(/^[\u4e00-\u9fa5]{2,4}$/.test(s)) {
            // 含有课程相关字的不是教师名
            if(/[课学院系语数理化物生政史地法经管文体音美计机程设工建电信网导论概原英德日韩俄哲思修军育习技术入门基础高等线性离散概率统计力热光微积分代几何拓扑算法结构编译操作原理数据库图形智能]/.test(s)) return false;
            // 只有3-4个字且以常见姓氏开头才可能是教师
            if(s.length >= 3) {
                if(/^[赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万柯管卢莫房裘干解应宗丁宣邓郁单杭洪包诸左石崔吉钮龚程邢裴陆荣翁荀羊惠甄曲家封储靳汲邴糜松井段富巫乌焦巴弓牧山谷车侯蓬全郗班仰秋仲伊宫宁仇栾暴甘厉戎祖武符刘景詹束龙叶幸司韶郜黎薄印宿白怀蒲邰从鄂索咸赖卓蔺屠蒙池乔胥能苍双闻莘党翟谭贡劳姬申扶冉宰郦雍桑桂濮牛寿通边扈燕冀浦尚农温别庄晏柴瞿阎充慕连茹习宦艾鱼容向古易慎戈廖庾居衡步都耿满弘匡国寇广禄东欧沃越隆师巩聂晁勾敖融冷辛阚那简饶空曾沙养鞠须丰巢关查后荆红游竺权逯盖益桓公]/.test(s)) return true;
            }
            // 2个字的太容易误判，不当教师名
            return false;
        }
        return false;
    }

    // 尝试将多行解析为一门课程
    function _tryParseMultilineAsOneCourse(lines) {
        var name = '', location = '', teacher = '', weeks = [], duration = 1;

        for(var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if(!line) continue;

            // 先尝试从整行提取内嵌信息（如"高数(1-16周)"）
            var weekInLine = line.match(/[(（]([^)）]*\d+[^)）]*周[^)）]*)[)）]/);
            if(weekInLine) {
                weeks = parseWeekStr(weekInLine[1]);
                line = line.replace(/[(（][^)）]*\d+[^)）]*周[^)）]*[)）]/, '').trim();
                if(!line) continue;
            }

            var locInLine = line.match(/[@＠](.+?)$/);
            if(locInLine) {
                location = locInLine[1].trim();
                line = line.replace(/[@＠].+$/, '').trim();
                if(!line) continue;
            }

            // 检测是否是周数信息
            if(_looksLikeWeekInfo(line) && !_looksLikeCourseName(line)) {
                weeks = parseWeekStr(line);
                continue;
            }

            // 检测是否是教室/地点
            if(_looksLikeLocation(line)) {
                location = line;
                continue;
            }

            // 检测是否是教师名
            if(_looksLikeTeacher(line) && name) {
                teacher = line;
                continue;
            }

            // 检测持续节数
            var durMatch = line.match(/连(\d+)节|(\d+)节连|(\d+)学时/);
            if(durMatch) {
                duration = parseInt(durMatch[1] || durMatch[2] || durMatch[3]);
                if(duration > 6) duration = Math.ceil(duration / 45);
                continue;
            }

            // 其余视为课程名
            if(!name) {
                name = line;
            }
        }

        // 清理课程名
        if(name) {
            name = name.replace(/^\d+\.\s*/, '');
            name = name.replace(/\s+/g, ' ').trim();
        }

        if(name && !_isNotCourseName(name)) {
            return { name: name, location: location, teacher: teacher, weeks: weeks, duration: duration };
        }
        return null;
    }

    // 解析单个课程段落（单行格式）
    function _parseSingleCourseSegment(seg) {
        var name = '', location = '', teacher = '', weeks = [], duration = 1;

        // 格式1: 课程名@教室(1-16周)
        var m1 = seg.match(/^(.+?)[@＠](.+?)[(（](.+?周.*?)[)）]/);
        if(m1) {
            name = m1[1].trim();
            location = m1[2].trim();
            weeks = parseWeekStr(m1[3]);
        }
        // 格式2: 课程名(1-16周) 教室
        else {
            var m2 = seg.match(/^(.+?)[(（]([^)）]*\d+[^)）]*周[^)）]*)[)）]\s*(.*)/);
            if(m2) {
                name = m2[1].trim();
                weeks = parseWeekStr(m2[2]);
                location = (m2[3]||'').trim();
            }
            // 格式3: 课程名{教室}[1-16周] 或 课程名[教室](周数)
            else {
                var m3 = seg.match(/^(.+?)[{｛](.+?)[}｝](?:\[(.+?)\])?/);
                if(m3) {
                    name = m3[1].trim();
                    location = m3[2].trim();
                    if(m3[3]) weeks = parseWeekStr(m3[3]);
                }
                // 格式4: 课程名(非周数内容) - 括号内不含"周"字就不当周数
                else {
                    var m4 = seg.match(/^(.+?)[(（]([^)）]+)[)）]\s*(.*)/);
                    if(m4) {
                        name = m4[1].trim();
                        var parenContent = m4[2].trim();
                        // 判断括号内是周数还是其他信息
                        if(/\d/.test(parenContent) && /周|单|双/.test(parenContent)) {
                            weeks = parseWeekStr(parenContent);
                        } else {
                            // 可能是附加信息，附加到课程名
                            name = name + '(' + parenContent + ')';
                        }
                        location = (m4[3]||'').trim();
                    }
                    // 格式5: 纯文本，尝试空格分隔
                    else {
                        name = seg;
                        // 尝试从中提取地点
                        var spParts = seg.split(/\s+/);
                        if(spParts.length >= 2) {
                            name = spParts[0];
                            for(var spi = 1; spi < spParts.length; spi++) {
                                if(_looksLikeWeekInfo(spParts[spi])) {
                                    weeks = parseWeekStr(spParts[spi]);
                                } else if(_looksLikeLocation(spParts[spi])) {
                                    location = spParts[spi];
                                } else if(_looksLikeTeacher(spParts[spi]) && !teacher) {
                                    teacher = spParts[spi];
                                } else {
                                    // 可能是课程名的一部分
                                    name += ' ' + spParts[spi];
                                }
                            }
                        }
                    }
                }
            }
        }

        // 从名称中提取持续节数
        var durMatch = seg.match(/连(\d+)节|(\d+)节连/);
        if(durMatch) duration = parseInt(durMatch[1]||durMatch[2]);

        // 清理课程名
        if(name) {
            name = name.replace(/^\d+\.\s*/, '');
            name = name.replace(/\s+/g, ' ').trim();
        }

        if(name && !_isNotCourseName(name)) return {name:name, location:location, teacher:teacher, weeks:weeks, duration:duration};
        return null;
    }

    // 增强版解析周数字符串
    function parseWeekStr(str) {
        var weeks = [];
        if(!str) return weeks;
        str = str.replace(/周/g,'').replace(/第/g,'').trim();

        // 单周/双周
        var isOdd = /单/.test(str);
        var isEven = /双/.test(str);
        str = str.replace(/[单双]/g,'').trim();

        // 匹配范围: 1-16, 1,3,5,7 或混合
        var ranges = str.split(/[,，、\s]+/);
        for(var i=0;i<ranges.length;i++){
            var r = ranges[i].trim();
            if(!r) continue;
            var rangeMatch = r.match(/(\d+)\s*[-~—至到]\s*(\d+)/);
            if(rangeMatch) {
                var from = parseInt(rangeMatch[1]);
                var to = parseInt(rangeMatch[2]);
                if(from > 0 && to > 0 && to >= from && to <= 30) {
                    for(var w=from;w<=to;w++){
                        if(isOdd && w%2===0) continue;
                        if(isEven && w%2===1) continue;
                        weeks.push(w);
                    }
                }
            } else if(/^\d+$/.test(r)) {
                var w2 = parseInt(r);
                if(w2 > 0 && w2 <= 30) {
                    if(isOdd && w2%2===0) continue;
                    if(isEven && w2%2===1) continue;
                    weeks.push(w2);
                }
            }
        }
        return weeks;
    }

})();
