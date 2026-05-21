/* ============================================================
   规则怪谈 — app-horror.js
   两种模式：论坛体规则怪谈 / 沉浸式探索规则怪谈
   所有故事内容通过 API.chatCompletion 动态生成
   ============================================================ */

// ---- 状态 ----
var horrorState = {
    view: 'home', // home | forum | explore
    games: [],    // 历史记录
    current: null // 当前游戏
};

function _initHorrorData() {
    if (!store.horror) store.horror = { games: [] };
    horrorState.games = store.horror.games || [];
}

// ---- 主页渲染 ----
function renderHorrorHome() {
    _initHorrorData();
    horrorState.view = 'home';
    horrorState.current = null;
    var area = document.getElementById('horror-content');
    if (!area) return;

    var historyHtml = '';
    var games = horrorState.games;
    if (games.length > 0) {
        var items = games.slice().reverse().slice(0, 20).map(function(g) {
            var statusCls = g.status === 'ongoing' ? 'ongoing' : g.status === 'won' ? 'won' : 'lost';
            var statusText = g.status === 'ongoing' ? '进行中' : g.status === 'won' ? '通关' : '失败';
            var modeText = g.mode === 'forum' ? '论坛体' : '沉浸探索';
            var roleText = g.role === 'lurker' ? '路人' : g.role === 'poster' ? '楼主' : '';
            var meta = modeText + (roleText ? ' · ' + roleText : '') + ' · ' + _horrorTimeAgo(g.createdAt);
            return '<div class="horror-history-item" onclick="horrorResumeGame(\'' + g.id + '\')">' +
                '<div class="horror-history-item-left">' +
                '<div class="horror-history-item-name">' + _horrorEsc(g.title || '未命名') + '</div>' +
                '<div class="horror-history-item-meta">' + meta + '</div>' +
                '</div>' +
                '<div class="horror-history-item-status ' + statusCls + '">' + statusText + '</div>' +
                '</div>';
        }).join('');
        historyHtml = '<div class="horror-history-section">' +
            '<div class="horror-history-title"><i class="fas fa-clock-rotate-left"></i> 历史记录</div>' +
            '<div class="horror-history-list">' + items + '</div></div>';
    }

    area.innerHTML =
        '<div class="horror-home">' +
        '<div class="horror-home-title">📜 规则怪谈</div>' +
        '<div class="horror-home-subtitle">每一条规则都可能是救命稻草，也可能是致命陷阱</div>' +
        '<div class="horror-mode-cards">' +
        '<div class="horror-mode-card" onclick="horrorStartForum()">' +
        '<div class="horror-mode-card-icon">💬</div>' +
        '<div class="horror-mode-card-name">论坛体怪谈</div>' +
        '<div class="horror-mode-card-desc">有人在深夜论坛发了一个帖子，讲述自己遇到的诡异经历。你可以选择当围观路人揭穿真相，或者当楼主隐藏秘密。</div>' +
        '</div>' +
        '<div class="horror-mode-card" onclick="horrorStartExplore()">' +
        '<div class="horror-mode-card-icon">🚪</div>' +
        '<div class="horror-mode-card-name">沉浸式探索</div>' +
        '<div class="horror-mode-card-desc">你将进入一个规则怪谈的世界。遵守规则，活下去。每一个选择都可能改变结局，每一条新发现的规则都暗藏玄机。</div>' +
        '</div>' +
        '</div>' +
        historyHtml +
        '</div>';
}

// ---- 工具函数 ----
function _horrorEsc(s) { return typeof escapeHtml === 'function' ? escapeHtml(s) : s.replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _horrorTimeAgo(ts) {
    if (!ts) return '';
    var diff = Date.now() - ts;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff/60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff/3600000) + '小时前';
    return Math.floor(diff/86400000) + '天前';
}
function _horrorGenId() { return 'hg_' + Date.now() + '_' + Math.random().toString(36).substr(2,6); }

function _horrorSave() {
    store.horror.games = horrorState.games;
    if (typeof save === 'function') save();
}

// 恢复游戏
function horrorResumeGame(id) {
    _initHorrorData();
    var game = horrorState.games.find(function(g) { return g.id === id; });
    if (!game) { toast('游戏不存在'); return; }
    horrorState.current = game;
    if (game.mode === 'forum') {
        horrorState.view = 'forum';
        _horrorRenderForum();
    } else {
        horrorState.view = 'explore';
        _horrorRenderExplore();
    }
}

// ============================================================
//  论坛体模式
// ============================================================
function horrorStartForum() {
    _initHorrorData();
    horrorState.view = 'forum-role-select';
    var area = document.getElementById('horror-content');
    area.innerHTML =
        '<div class="horror-role-select">' +
        '<div class="horror-role-select-title">选择你的身份</div>' +
        '<div class="horror-role-select-btns">' +
        '<div class="horror-role-btn" onclick="horrorCreateForum(\'lurker\')">' +
        '<div class="horror-role-btn-name">🔍 围观路人</div>' +
        '<div class="horror-role-btn-desc">你在深夜刷到了一个诡异的帖子。在有限的回合内，通过提问和分析，找出帖子背后的真相。</div>' +
        '</div>' +
        '<div class="horror-role-btn" onclick="horrorCreateForum(\'poster\')">' +
        '<div class="horror-role-btn-name">✍️ 发帖楼主</div>' +
        '<div class="horror-role-btn-desc">你经历了一件不可思议的事。在论坛上讲述你的故事，但要巧妙隐藏真相，不能说谎，却要让路人猜不到。</div>' +
        '</div>' +
        '</div>' +
        '</div>';
}

async function horrorCreateForum(role) {
    _currentApiScene = 'horror';
    _initHorrorData();
    var area = document.getElementById('horror-content');
    area.innerHTML = '<div class="horror-loading"><i class="fas fa-spinner fa-spin"></i><span>正在生成诡异故事...</span></div>';

    var game = {
        id: _horrorGenId(),
        mode: 'forum',
        role: role,
        status: 'ongoing',
        createdAt: Date.now(),
        title: '',
        truth: '',
        boardName: '',
        opContent: '',
        opName: '',
        opAvatar: '',
        replies: [],
        round: 0,
        maxRounds: role === 'lurker' ? 8 : 10,
        forumUsers: [],
        revealed: false,
        deepTheme: ''
    };

    try {
        var themeTypes = ['四维空间', '灵异事件', '物理怪物', '平行世界', '时间循环', '意识异常'];
        var humanThemes = ['亲情的羁绊与牺牲', '友情的背叛与救赎', '爱情的执念与放手', '人性的善恶边界', '现代社会的孤独与疏离', '记忆与遗忘的意义', '自我认同的迷失'];
        var randomTheme = themeTypes[Math.floor(Math.random() * themeTypes.length)];
        var randomHuman = humanThemes[Math.floor(Math.random() * humanThemes.length)];

        var prompt = '你是一个规则怪谈故事创作大师。请创作一个论坛体规则怪谈故事。\n\n' +
            '恐怖类型：' + randomTheme + '\n' +
            '深层主题：' + randomHuman + '\n\n' +
            '要求：\n' +
            '1. 创作一个发在深夜论坛上的帖子，楼主讲述自己遇到的诡异经历\n' +
            '2. 故事要有一个隐藏的真相，表面恐怖但深层要触及人性\n' +
            '3. 帖子内容要像真实的网络发帖风格，口语化，有情绪\n' +
            '4. 要细思极恐，同时要有温情的一面\n' +
            '5. 生成3-5个论坛用户角色（不同性格：有聪明的分析者、有看热闹的、有恐惧的、有质疑的、有共情的）\n\n' +
            '请严格按以下JSON格式回复（不要有其他内容）：\n' +
            '{\n' +
            '  "title": "帖子标题（吸引眼球的标题）",\n' +
            '  "boardName": "论坛板块名（如：灵异事件、都市传说等）",\n' +
            '  "opName": "楼主昵称",\n' +
            '  "opAvatar": "一个emoji作为头像",\n' +
            '  "opContent": "楼主的帖子正文（300-500字，要有恐怖氛围但也要有人情味）",\n' +
            '  "truth": "故事的真相（150-200字，揭示恐怖背后的真实原因和人性主题）",\n' +
            '  "deepTheme": "一句话总结深层主题",\n' +
            '  "forumUsers": [\n' +
            '    {"name": "用户昵称", "avatar": "emoji头像", "personality": "性格描述（如：理性分析型/看热闹型/胆小型/质疑型/共情型）"}\n' +
            '  ]\n' +
            '}';

        var data = await API.chatCompletion([
            { role: 'system', content: '你是一个专业的规则怪谈故事创作者。只输出合法JSON，不要有任何额外文字或markdown格式。' },
            { role: 'user', content: prompt }
        ], 0.95, true);

        var text = data.choices[0].message.content || '';
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        var result = JSON.parse(text);

        game.title = result.title || '深夜怪谈';
        game.boardName = result.boardName || '灵异事件';
        game.opName = result.opName || '匿名用户';
        game.opAvatar = result.opAvatar || '👤';
        game.opContent = result.opContent || '';
        game.truth = result.truth || '';
        game.deepTheme = result.deepTheme || '';
        game.forumUsers = (result.forumUsers || []).slice(0, 5);

        if (game.forumUsers.length < 3) {
            game.forumUsers = [
                { name: '深夜不睡觉', avatar: '🦉', personality: '理性分析型，喜欢找逻辑漏洞' },
                { name: '吃瓜群众', avatar: '🍉', personality: '看热闹型，喜欢起哄' },
                { name: '胆小如鼠', avatar: '🐭', personality: '胆小型，容易被吓到' },
                { name: '较真侠', avatar: '🧐', personality: '质疑型，什么都不信' },
                { name: '温柔的风', avatar: '🌸', personality: '共情型，关心楼主' }
            ];
        }

    } catch(e) {
        console.error('Horror forum creation failed:', e);
        toast('故事生成失败，请检查API设置', 'error');
        renderHorrorHome();
        return;
    }

    horrorState.current = game;
    horrorState.games.push(game);
    _horrorSave();

    // 生成初始回复
    horrorState.view = 'forum';
    _horrorRenderForum();
    _horrorGenerateInitialReplies(game);
}

function _horrorRenderForum() {
    var game = horrorState.current;
    if (!game) { renderHorrorHome(); return; }
    var area = document.getElementById('horror-content');

    var roleTag = game.role === 'lurker'
        ? '<span class="horror-forum-role-tag role-lurker">🔍 你是路人 — 找出真相</span>'
        : '<span class="horror-forum-role-tag role-poster">✍️ 你是楼主 — 隐藏真相</span>';
    var roundInfo = '<span class="horror-forum-round-info">回合 ' + game.round + '/' + game.maxRounds + '</span>';

    var repliesHtml = game.replies.map(function(r, i) {
        var isOp = r.isOp;
        var nameClass = isOp ? 'horror-reply-name op-name' : 'horror-reply-name';
        var opTag = isOp ? ' <span class="horror-forum-op-tag">楼主</span>' : '';
        var quoteHtml = r.quoteName ? '<div class="horror-reply-quote">回复 ' + _horrorEsc(r.quoteName) + '：' + _horrorEsc((r.quoteContent||'').substring(0,60)) + '...</div>' : '';
        var replyBtn = '';
        if (game.status === 'ongoing') {
            replyBtn = '<div class="horror-reply-action" onclick="horrorForumReplyTo(' + i + ')"><i class="fas fa-reply"></i> 回复</div>';
        }
        return '<div class="horror-reply' + (isOp ? ' is-op' : '') + '">' +
            '<div class="horror-reply-header">' +
            '<div class="horror-reply-avatar">' + (r.avatar || '👤') + '</div>' +
            '<div class="' + nameClass + '">' + _horrorEsc(r.name) + opTag + '</div>' +
            '<div class="horror-reply-floor">#' + (i + 2) + '</div>' +
            '</div>' +
            quoteHtml +
            '<div class="horror-reply-content">' + _horrorEsc(r.content) + '</div>' +
            '<div class="horror-reply-actions">' + replyBtn + '</div>' +
            '</div>';
    }).join('');

    var inputHtml = '';
    if (game.status === 'ongoing') {
        var placeholder = game.role === 'lurker' ? '分析帖子内容，提出你的看法或问题...' : '以楼主身份回复（记住：不能说谎，但要隐藏真相）...';
        inputHtml = '<div class="horror-forum-input-bar">' +
            '<textarea class="horror-forum-input" id="horror-forum-input" placeholder="' + placeholder + '" rows="1" oninput="this.style.height=\'auto\';this.style.height=Math.min(this.scrollHeight,80)+\'px\'"></textarea>' +
            '<button class="horror-forum-send-btn" id="horror-forum-send" onclick="horrorForumSend()"><i class="fas fa-paper-plane"></i></button>' +
            '</div>';
    }

    var endingHtml = '';
    if (game.status !== 'ongoing' && game.revealed) {
        var icon = game.status === 'won' ? '🎉' : '💀';
        var title = game.status === 'won' ? '真相大白' : '游戏结束';
        endingHtml = '<div class="horror-truth-reveal">' +
            '<div class="horror-truth-reveal-title">' + icon + ' ' + title + '</div>' +
            '<div class="horror-truth-reveal-content">' + _horrorEsc(game.truth) + '\n\n💭 ' + _horrorEsc(game.deepTheme || '') + '</div>' +
            '</div>';
    }

    area.innerHTML =
        '<div class="horror-forum">' +
        '<div class="horror-forum-role-bar">' + roleTag + roundInfo + '</div>' +
        '<div class="horror-forum-header">' +
        '<div class="horror-forum-board-name">📋 ' + _horrorEsc(game.boardName) + '</div>' +
        '<div class="horror-forum-post-title">' + _horrorEsc(game.title) + '</div>' +
        '<div class="horror-forum-post-meta"><span>👁 ' + (Math.floor(Math.random()*500)+100) + '</span><span>💬 ' + (game.replies.length + 1) + '</span></div>' +
        '</div>' +
        '<div class="horror-forum-body" id="horror-forum-body">' +
        '<div class="horror-forum-op">' +
        '<div class="horror-forum-op-avatar">' + (game.opAvatar || '👤') + '</div>' +
        '<div class="horror-forum-op-name">' + _horrorEsc(game.opName) + ' <span class="horror-forum-op-tag">楼主</span></div>' +
        '<div class="horror-forum-op-content">' + _horrorEsc(game.opContent) + '</div>' +
        '</div>' +
        repliesHtml +
        '<div id="horror-forum-typing"></div>' +
        endingHtml +
        '</div>' +
        inputHtml +
        '</div>';

    // 滚动到底部
    setTimeout(function() {
        var body = document.getElementById('horror-forum-body');
        if (body) body.scrollTop = body.scrollHeight;
    }, 100);
}

// 论坛回复目标
var _horrorReplyTarget = null;
function horrorForumReplyTo(idx) {
    var game = horrorState.current;
    if (!game) return;
    var r = game.replies[idx];
    _horrorReplyTarget = { idx: idx, name: r.name, content: r.content };
    var input = document.getElementById('horror-forum-input');
    if (input) {
        input.placeholder = '回复 ' + r.name + '...';
        input.focus();
    }
}

// 发送回复
async function horrorForumSend() {
    var game = horrorState.current;
    if (!game || game.status !== 'ongoing') return;
    var input = document.getElementById('horror-forum-input');
    var text = (input.value || '').trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';

    var sendBtn = document.getElementById('horror-forum-send');
    if (sendBtn) sendBtn.disabled = true;

    game.round++;

    // 添加用户回复
    var userReply = {
        name: game.role === 'poster' ? game.opName : '我',
        avatar: game.role === 'poster' ? game.opAvatar : '🙂',
        isOp: game.role === 'poster',
        content: text,
        quoteName: _horrorReplyTarget ? _horrorReplyTarget.name : null,
        quoteContent: _horrorReplyTarget ? _horrorReplyTarget.content : null,
        isUser: true
    };
    game.replies.push(userReply);
    _horrorReplyTarget = null;
    _horrorSave();
    _horrorRenderForum();

    // 显示typing
    _horrorShowTyping();

    // 检查是否到达最大回合
    if (game.round >= game.maxRounds) {
        await _horrorForumFinale(game, text);
        return;
    }

    // 生成NPC回复
    await _horrorGenerateForumReplies(game, text);

    if (sendBtn) sendBtn.disabled = false;
}

function _horrorShowTyping() {
    var el = document.getElementById('horror-forum-typing');
    if (el) {
        el.innerHTML = '<div class="horror-typing"><span>有人正在回复</span><div class="horror-typing-dots"><span></span><span></span><span></span></div></div>';
    }
}
function _horrorHideTyping() {
    var el = document.getElementById('horror-forum-typing');
    if (el) el.innerHTML = '';
}

async function _horrorGenerateInitialReplies(game) {
    _currentApiScene = 'horror';
    _horrorShowTyping();
    try {
        var usersDesc = game.forumUsers.map(function(u) { return u.name + '(' + u.personality + ')'; }).join('、');
        var prompt = '你正在模拟一个深夜论坛的回帖场景。\n\n' +
            '帖子标题：' + game.title + '\n' +
            '帖子内容：' + game.opContent + '\n' +
            '故事真相（用户看不到）：' + game.truth + '\n\n' +
            '论坛用户：' + usersDesc + '\n\n' +
            '请生成2-3条初始回帖。要求：\n' +
            '1. 每个回帖者性格鲜明，说话风格不同\n' +
            '2. 有人好奇追问，有人质疑，有人害怕，有人看热闹\n' +
            '3. 回帖要像真实网友，口语化，可以有网络用语\n' +
            '4. 不要直接揭示真相，但可以有人隐约触及\n' +
            '5. 每条回帖50-120字\n\n' +
            '请严格按JSON数组格式回复：\n' +
            '[{"name":"用户名","avatar":"emoji","content":"回帖内容","quoteName":null,"quoteContent":null}]';

        var data = await API.chatCompletion([
            { role: 'system', content: '你是论坛回帖模拟器。只输出合法JSON数组，不要有任何额外文字。模拟真实网友的多样化回复风格。' },
            { role: 'user', content: prompt }
        ], 0.9, true);

        var text = data.choices[0].message.content || '';
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        var replies = JSON.parse(text);

        if (Array.isArray(replies)) {
            replies.forEach(function(r) {
                game.replies.push({
                    name: r.name || '匿名',
                    avatar: r.avatar || '👤',
                    isOp: false,
                    content: r.content || '',
                    quoteName: r.quoteName || null,
                    quoteContent: r.quoteContent || null,
                    isUser: false
                });
            });
        }
    } catch(e) {
        console.error('Horror initial replies failed:', e);
    }
    _horrorHideTyping();
    _horrorSave();
    _horrorRenderForum();
}

async function _horrorGenerateForumReplies(game, userText) {
    _currentApiScene = 'horror';
    try {
        var recentReplies = game.replies.slice(-8).map(function(r) {
            return (r.isUser ? '[玩家]' : '[' + r.name + ']') + ': ' + r.content;
        }).join('\n');

        var usersDesc = game.forumUsers.map(function(u) { return u.name + '(' + u.personality + ')'; }).join('、');

        var roleContext = game.role === 'lurker'
            ? '玩家是路人，正在试图找出真相。根据玩家的发言，NPC们应该有不同反应——有人附和，有人反驳，有人提供新线索。'
            : '玩家是楼主，正在隐藏真相。NPC们应该继续追问、质疑或讨论，试图接近真相。';

        var prompt = '继续模拟论坛回帖。\n\n' +
            '帖子标题：' + game.title + '\n' +
            '故事真相（用户看不到）：' + game.truth + '\n' +
            '当前回合：' + game.round + '/' + game.maxRounds + '\n' +
            roleContext + '\n\n' +
            '最近对话：\n' + recentReplies + '\n\n' +
            '论坛用户：' + usersDesc + '\n\n' +
            '请生成1-3条回帖。要求：\n' +
            '1. 回应玩家的发言，推进讨论\n' +
            '2. 随着回合推进，讨论应该越来越深入\n' +
            '3. 有人可能引用之前的回复进行讨论\n' +
            '4. 保持每个角色的性格一致性\n' +
            '5. 如果接近最后几轮，气氛应该更紧张\n' +
            '6. 每条50-150字，口语化\n\n' +
            '请严格按JSON数组格式回复：\n' +
            '[{"name":"用户名","avatar":"emoji","content":"回帖内容","quoteName":"被引用者名字或null","quoteContent":"被引用内容或null"}]';

        var data = await API.chatCompletion([
            { role: 'system', content: '你是论坛回帖模拟器。只输出合法JSON数组。模拟真实多样化的网友回复。' },
            { role: 'user', content: prompt }
        ], 0.9, true);

        var text = data.choices[0].message.content || '';
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        var replies = JSON.parse(text);

        if (Array.isArray(replies)) {
            // 逐条延迟添加，模拟真实回帖
            for (var i = 0; i < replies.length; i++) {
                await new Promise(function(resolve) { setTimeout(resolve, 800 + Math.random() * 1200); });
                var r = replies[i];
                game.replies.push({
                    name: r.name || '匿名',
                    avatar: r.avatar || '👤',
                    isOp: false,
                    content: r.content || '',
                    quoteName: r.quoteName || null,
                    quoteContent: r.quoteContent || null,
                    isUser: false
                });
                _horrorSave();
                _horrorRenderForum();
            }
        }
    } catch(e) {
        console.error('Horror forum replies failed:', e);
    }
    _horrorHideTyping();
}

// 论坛体结局
async function _horrorForumFinale(game, lastText) {
    _currentApiScene = 'horror';
    _horrorShowTyping();
    try {
        var recentReplies = game.replies.slice(-10).map(function(r) {
            return (r.isUser ? '[玩家]' : '[' + r.name + ']') + ': ' + r.content;
        }).join('\n');

        var judgePrompt = '';
        if (game.role === 'lurker') {
            judgePrompt = '玩家是路人，最后一条发言是："' + lastText + '"\n' +
                '故事真相是：' + game.truth + '\n\n' +
                '请判断玩家是否猜到了真相的核心（不需要完全一致，抓住关键点即可）。\n' +
                '同时生成最终的论坛回复（其他用户的反应）和真相揭示。';
        } else {
            judgePrompt = '玩家是楼主，一直在隐藏真相。\n' +
                '故事真相是：' + game.truth + '\n\n' +
                '请根据对话记录判断：路人们是否发现了真相？\n' +
                '如果路人没发现，楼主（玩家）获胜；如果路人发现了，楼主失败。\n' +
                '同时生成最终的论坛回复和真相揭示。';
        }

        var prompt = '论坛怪谈游戏进入最终回合。\n\n' +
            '帖子标题：' + game.title + '\n' +
            '最近对话：\n' + recentReplies + '\n\n' +
            judgePrompt + '\n\n' +
            '请严格按JSON格式回复：\n' +
            '{\n' +
            '  "playerWon": true或false,\n' +
            '  "finalReplies": [{"name":"用户名","avatar":"emoji","content":"最终回帖"}],\n' +
            '  "epilogue": "结局描述（100-200字，揭示真相后的感悟，要有温情和深度）"\n' +
            '}';

        var data = await API.chatCompletion([
            { role: 'system', content: '你是规则怪谈游戏裁判。只输出合法JSON。公正判断玩家是否达成目标。' },
            { role: 'user', content: prompt }
        ], 0.7, true);

        var text = data.choices[0].message.content || '';
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        var result = JSON.parse(text);

        if (Array.isArray(result.finalReplies)) {
            result.finalReplies.forEach(function(r) {
                game.replies.push({
                    name: r.name || '匿名', avatar: r.avatar || '👤',
                    isOp: false, content: r.content || '', isUser: false
                });
            });
        }

        game.status = result.playerWon ? 'won' : 'lost';
        game.revealed = true;
        if (result.epilogue) game.truth = game.truth + '\n\n📖 ' + result.epilogue;

    } catch(e) {
        console.error('Horror forum finale failed:', e);
        game.status = 'lost';
        game.revealed = true;
    }

    _horrorHideTyping();
    _horrorSave();
    _horrorRenderForum();
}

// ============================================================
//  沉浸式探索模式
// ============================================================
async function horrorStartExplore() {
    _currentApiScene = 'horror';
    _initHorrorData();
    var area = document.getElementById('horror-content');
    area.innerHTML = '<div class="horror-loading"><i class="fas fa-spinner fa-spin"></i><span>正在构建规则世界...</span></div>';

    var game = {
        id: _horrorGenId(),
        mode: 'explore',
        role: 'explorer',
        status: 'ongoing',
        createdAt: Date.now(),
        title: '',
        setting: '',
        rules: [],
        narrative: [],
        choices: [],
        round: 0,
        maxRounds: 15,
        health: 100,
        sanity: 100,
        discoveredRules: 0,
        totalRules: 0,
        truth: '',
        deepTheme: '',
        rulesVisible: false,
        ending: null,
        _hiddenRules: []
    };

    try {
        var themeTypes = ['四维空间异变', '灵异事件', '物理怪物入侵', '时间循环', '意识陷阱', '平行世界交错'];
        var humanThemes = ['亲情的牺牲与守护', '友情的考验', '爱情的执念', '人性的善恶抉择', '社会冷漠与温暖', '记忆与身份认同'];
        var settings = ['废弃医院', '深夜便利店', '老旧居民楼', '末班地铁', '雨夜校园', '荒野旅馆', '地下停车场', '深山寺庙'];
        var randomTheme = themeTypes[Math.floor(Math.random() * themeTypes.length)];
        var randomHuman = humanThemes[Math.floor(Math.random() * humanThemes.length)];
        var randomSetting = settings[Math.floor(Math.random() * settings.length)];

        var prompt = '你是规则怪谈世界的构建者。请创建一个沉浸式规则怪谈场景。\n\n' +
            '恐怖类型：' + randomTheme + '\n' +
            '场景：' + randomSetting + '\n' +
            '深层主题：' + randomHuman + '\n\n' +
            '要求：\n' +
            '1. 创建一个引人入胜的开场叙述（200-300字），第二人称视角\n' +
            '2. 设计5-8条规则，其中初始给出3条，其余需探索发现\n' +
            '3. 有些规则互相矛盾（暗示有真假规则）\n' +
            '4. 规则要细思极恐但也暗含温情\n' +
            '5. 设计3个初始选择\n\n' +
            '请严格按JSON格式回复：\n' +
            '{\n' +
            '  "title": "场景标题",\n' +
            '  "setting": "场景描述（50字）",\n' +
            '  "narrative": "开场叙述（第二人称，200-300字）",\n' +
            '  "initialRules": [{"id":1,"text":"规则内容","isTrue":true,"hint":"暗示"}],\n' +
            '  "hiddenRules": [{"id":4,"text":"隐藏规则","isTrue":true,"hint":"暗示","trigger":"触发条件"}],\n' +
            '  "choices": [{"text":"选择描述","risk":"low/medium/high"}],\n' +
            '  "truth": "终极真相（150-200字）",\n' +
            '  "deepTheme": "一句话深层主题"\n' +
            '}';

        var data = await API.chatCompletion([
            { role: 'system', content: '你是规则怪谈世界构建大师。只输出合法JSON，不要有任何额外文字或markdown格式。' },
            { role: 'user', content: prompt }
        ], 0.95, true);

        var text = data.choices[0].message.content || '';
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        var result = JSON.parse(text);

        game.title = result.title || '未知空间';
        game.setting = result.setting || '';
        game.narrative = [{ type: 'narration', text: result.narrative || '' }];
        game.truth = result.truth || '';
        game.deepTheme = result.deepTheme || '';

        game.rules = (result.initialRules || []).map(function(r) {
            return { id: r.id, text: r.text, isTrue: r.isTrue, hint: r.hint, discovered: true };
        });
        game.discoveredRules = game.rules.length;

        game._hiddenRules = (result.hiddenRules || []).map(function(r) {
            return { id: r.id, text: r.text, isTrue: r.isTrue, hint: r.hint, trigger: r.trigger, discovered: false };
        });
        game.totalRules = game.rules.length + game._hiddenRules.length;

        game.choices = (result.choices || []).map(function(c) {
            return { text: c.text, risk: c.risk || 'medium' };
        });

    } catch(e) {
        console.error('Horror explore creation failed:', e);
        toast('世界构建失败，请检查API设置', 'error');
        renderHorrorHome();
        return;
    }

    horrorState.current = game;
    horrorState.games.push(game);
    _horrorSave();
    horrorState.view = 'explore';
    _horrorRenderExplore();
}

function _horrorRenderExplore() {
    var game = horrorState.current;
    if (!game) { renderHorrorHome(); return; }
    var area = document.getElementById('horror-content');

    var narrativeHtml = game.narrative.map(function(n) {
        if (n.type === 'narration') {
            return '<div class="horror-explore-narrative">' + _horrorEsc(n.text) + '</div>';
        } else if (n.type === 'event') {
            return '<div class="horror-explore-event"><div class="horror-explore-event-title">⚠️ ' + _horrorEsc(n.title || '突发事件') + '</div><div class="horror-explore-event-desc">' + _horrorEsc(n.text) + '</div></div>';
        } else if (n.type === 'rule-found') {
            return '<div class="horror-explore-event" style="border-color:#ccc;"><div class="horror-explore-event-title" style="color:#666;">📜 发现新规则</div><div class="horror-explore-event-desc">' + _horrorEsc(n.text) + '</div></div>';
        }
        return '';
    }).join('');

    var rulesCount = game.rules.filter(function(r) { return r.discovered; }).length;
    var rulesBtnHtml = '<div class="horror-rules-btn" onclick="horrorToggleRules()"><i class="fas fa-scroll"></i> 规则 <span class="badge">' + rulesCount + '</span></div>';

    var rulesPanelHtml = '<div class="horror-rules-panel' + (game.rulesVisible ? ' show' : '') + '" id="horror-rules-panel"><div class="horror-rules-panel-title">📜 已知规则</div>';
    game.rules.forEach(function(r) {
        if (r.discovered) {
            var cls = r._contradicts ? ' contradicts' : '';
            var newCls = r._isNew ? ' new-rule' : '';
            rulesPanelHtml += '<div class="horror-rule-item' + cls + newCls + '"><span class="horror-rule-item-num">规则' + r.id + '：</span>' + _horrorEsc(r.text) + '</div>';
            if (r._isNew) r._isNew = false;
        }
    });
    rulesPanelHtml += '</div>';

    var choicesHtml = '';
    if (game.choices.length > 0 && game.status === 'ongoing') {
        choicesHtml = '<div class="horror-choices"><div class="horror-choices-title">你的选择：</div>';
        game.choices.forEach(function(c, i) {
            choicesHtml += '<button class="horror-choice-btn" onclick="horrorMakeChoice(' + i + ')">' + _horrorEsc(c.text) + '</button>';
        });
        choicesHtml += '</div>';
    }

    var statusHtml = '<div class="horror-status-bar">' +
        '<div class="horror-status-item">❤️ ' + game.health + '</div>' +
        '<div class="horror-status-item">🧠 ' + game.sanity + '</div>' +
        '<div class="horror-status-item">📜 ' + game.discoveredRules + '/' + game.totalRules + '</div>' +
        '<div class="horror-status-item">🔄 ' + game.round + '/' + game.maxRounds + '</div></div>';

    var endingHtml = '';
    if (game.ending) {
        var eIcon = game.status === 'won' ? '🌅' : '💀';
        endingHtml = '<div class="horror-ending">' +
            '<div class="horror-ending-icon">' + eIcon + '</div>' +
            '<div class="horror-ending-title">' + _horrorEsc(game.ending.title || '结局') + '</div>' +
            '<div class="horror-ending-desc">' + _horrorEsc(game.ending.desc || '') + '</div>' +
            '<div class="horror-truth-reveal" style="margin:0 0 16px;text-align:left;"><div class="horror-truth-reveal-title">💡 真相</div>' +
            '<div class="horror-truth-reveal-content">' + _horrorEsc(game.truth) + '\n\n💭 ' + _horrorEsc(game.deepTheme || '') + '</div></div>' +
            '<div><button class="horror-ending-btn" onclick="renderHorrorHome()">返回首页</button>' +
            '<button class="horror-ending-btn secondary" onclick="horrorStartExplore()">再来一局</button></div></div>';
    }

    area.innerHTML = '<div class="horror-explore">' + rulesBtnHtml + rulesPanelHtml +
        '<div class="horror-explore-scene" id="horror-explore-scene">' + narrativeHtml +
        '<div id="horror-explore-loading"></div></div>' +
        choicesHtml + statusHtml + endingHtml + '</div>';

    setTimeout(function() {
        var scene = document.getElementById('horror-explore-scene');
        if (scene) scene.scrollTop = scene.scrollHeight;
    }, 100);
}

function horrorToggleRules() {
    var game = horrorState.current;
    if (!game) return;
    game.rulesVisible = !game.rulesVisible;
    var panel = document.getElementById('horror-rules-panel');
    if (panel) {
        if (game.rulesVisible) panel.classList.add('show');
        else panel.classList.remove('show');
    }
}

async function horrorMakeChoice(idx) {
    _currentApiScene = 'horror';
    var game = horrorState.current;
    if (!game || game.status !== 'ongoing') return;
    var choice = game.choices[idx];
    if (!choice) return;

    game.round++;
    game.choices = [];
    game.narrative.push({ type: 'narration', text: '\n▸ 你选择了：' + choice.text });
    _horrorRenderExplore();

    var loadEl = document.getElementById('horror-explore-loading');
    if (loadEl) loadEl.innerHTML = '<div class="horror-loading"><i class="fas fa-spinner fa-spin"></i><span>命运正在展开...</span></div>';

    try {
        var narrativeHistory = game.narrative.slice(-6).map(function(n) {
            return n.type === 'event' ? '[事件] ' + (n.title || '') + ': ' + n.text : n.text;
        }).join('\n').substring(0, 1500);

        var knownRules = game.rules.filter(function(r) { return r.discovered; }).map(function(r) {
            return '规则' + r.id + '：' + r.text;
        }).join('\n');

        var hiddenRulesInfo = (game._hiddenRules || []).filter(function(r) { return !r.discovered; }).map(function(r) {
            return '隐藏规则' + r.id + '：' + r.text + '（触发：' + r.trigger + '）';
        }).join('\n');

        var prompt = '你是规则怪谈叙述者。玩家做出了选择，请继续推进故事。\n\n' +
            '场景：' + game.title + ' - ' + game.setting + '\n' +
            '真相：' + game.truth + '\n深层主题：' + game.deepTheme + '\n' +
            '回合：' + game.round + '/' + game.maxRounds + '\n' +
            '玩家状态：生命' + game.health + ' 理智' + game.sanity + '\n\n' +
            '已知规则：\n' + knownRules + '\n\n' +
            '未发现规则：\n' + (hiddenRulesInfo || '无') + '\n\n' +
            '近期叙述：\n' + narrativeHistory + '\n\n' +
            '玩家选择：' + choice.text + '（风险：' + choice.risk + '）\n\n' +
            '请生成后果。要求：\n' +
            '1. 后果叙述（第二人称，150-250字，有氛围感）\n' +
            '2. 可能的随机事件（遇到人、危急时刻等，概率50%）\n' +
            '3. 是否发现新规则（根据隐藏规则触发条件判断）\n' +
            '4. 生命/理智变化（-20到+10之间）\n' +
            '5. 新的2-3个选择\n' +
            '6. 接近最后几轮要推向高潮\n\n' +
            'JSON格式回复：\n' +
            '{"narration":"后果叙述","event":{"title":"事件标题","text":"事件描述"}或null,' +
            '"newRule":{"id":数字,"text":"新规则"}或null,' +
            '"healthChange":数字,"sanityChange":数字,' +
            '"choices":[{"text":"选择","risk":"low/medium/high"}]}';

        var data = await API.chatCompletion([
            { role: 'system', content: '你是规则怪谈叙述大师。只输出合法JSON。创造紧张刺激又有深度的叙事。' },
            { role: 'user', content: prompt }
        ], 0.9, true);

        var text = data.choices[0].message.content || '';
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        var result = JSON.parse(text);

        if (result.narration) {
            game.narrative.push({ type: 'narration', text: result.narration });
        }
        if (result.event) {
            game.narrative.push({ type: 'event', title: result.event.title, text: result.event.text });
        }
        if (result.newRule) {
            var newRule = {
                id: result.newRule.id || (game.rules.length + 1),
                text: result.newRule.text, isTrue: true, discovered: true, _isNew: true
            };
            game.rules.push(newRule);
            game.discoveredRules++;
            game.narrative.push({ type: 'rule-found', text: '规则' + newRule.id + '：' + newRule.text });
            if (game._hiddenRules) {
                game._hiddenRules = game._hiddenRules.filter(function(r) { return r.id !== newRule.id; });
            }
            game.rulesVisible = true;
        }

        game.health = Math.max(0, Math.min(100, game.health + (result.healthChange || 0)));
        game.sanity = Math.max(0, Math.min(100, game.sanity + (result.sanityChange || 0)));

        game.choices = (result.choices || []).map(function(c) {
            return { text: c.text, risk: c.risk || 'medium' };
        });

        if (game.health <= 0 || game.sanity <= 0) {
            await _horrorExploreEnding(game, 'death');
        } else if (game.round >= game.maxRounds) {
            await _horrorExploreEnding(game, 'final');
        }

    } catch(e) {
        console.error('Horror explore choice failed:', e);
        game.narrative.push({ type: 'narration', text: '（一阵眩晕袭来，你的意识模糊了一瞬...）' });
        game.choices = [
            { text: '继续前进', risk: 'medium' },
            { text: '原地观察', risk: 'low' }
        ];
    }

    if (loadEl) loadEl.innerHTML = '';
    _horrorSave();
    _horrorRenderExplore();
}

async function _horrorExploreEnding(game, reason) {
    _currentApiScene = 'horror';
    try {
        var narrativeSummary = game.narrative.slice(-8).map(function(n) { return n.text; }).join('\n').substring(0, 1200);
        var knownRules = game.rules.filter(function(r) { return r.discovered; }).map(function(r) {
            return '规则' + r.id + '：' + r.text;
        }).join('\n');

        var prompt = '规则怪谈探索即将结束。\n\n' +
            '场景：' + game.title + '\n真相：' + game.truth + '\n深层主题：' + game.deepTheme + '\n' +
            '结束原因：' + (reason === 'death' ? (game.health <= 0 ? '生命值归零' : '理智值归零') : '到达最终回合') + '\n' +
            '玩家状态：生命' + game.health + ' 理智' + game.sanity + '\n' +
            '发现规则：' + game.discoveredRules + '/' + game.totalRules + '\n\n' +
            '经过摘要：\n' + narrativeSummary + '\n\n已知规则：\n' + knownRules + '\n\n' +
            '请生成结局。要求：\n' +
            '1. 存活且发现大部分规则→好结局\n' +
            '2. 死亡或理智归零→坏结局但有深意\n' +
            '3. 要揭示深层主题，有温情和思考\n' +
            '4. 细思极恐又感到温暖\n\n' +
            'JSON格式：{"title":"结局标题","desc":"结局描述（200-300字）","won":true或false}';

        var data = await API.chatCompletion([
            { role: 'system', content: '你是规则怪谈结局创作者。只输出合法JSON。创造令人难忘的结局。' },
            { role: 'user', content: prompt }
        ], 0.8, true);

        var text = data.choices[0].message.content || '';
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        var result = JSON.parse(text);

        game.ending = { title: result.title || '结局', desc: result.desc || '' };
        game.status = result.won ? 'won' : 'lost';
        game.choices = [];

    } catch(e) {
        console.error('Horror ending failed:', e);
        game.ending = { title: '故事结束', desc: '你的冒险到此为止了...' };
        game.status = reason === 'death' ? 'lost' : 'won';
        game.choices = [];
    }
}

// ---- 从游戏app打开怪谈 ----
function openHorrorFromGames() {
    var el = document.getElementById('layer-horror');
    if (el) {
        el.classList.add('show');
        if (typeof renderHorrorHome === 'function') renderHorrorHome();
    }
}

// [FIX-游戏返回] 智能返回：子页面→怪谈首页，首页→游戏菜单
function horrorGoBack() {
    if (horrorState.view === 'home') {
        // 已在怪谈首页 → 返回游戏菜单
        closeHorrorToGames();
    } else {
        // 在子页面（论坛/探索/角色选择等）→ 返回怪谈首页
        renderHorrorHome();
    }
}

// ---- 关闭怪谈并返回游戏app ----
function closeHorrorToGames() {
    // 重置怪谈状态
    horrorState.view = 'home';
    horrorState.current = null;
    // 清空内容防止白屏
    var content = document.getElementById('horror-content');
    if (content) content.innerHTML = '';
    // 关闭怪谈layer
    var el = document.getElementById('layer-horror');
    if (el) {
        el.classList.remove('show');
        el.style.display = '';
    }
    // 确保游戏layer仍然可见
    var gamesLayer = document.getElementById('layer-games');
    if (gamesLayer && !gamesLayer.classList.contains('show')) {
        gamesLayer.classList.add('show');
    }
    // 重新渲染游戏首页
    if (typeof renderGamesHome === 'function') {
        gamesState.view = 'home';
        renderGamesHome();
    }
}
