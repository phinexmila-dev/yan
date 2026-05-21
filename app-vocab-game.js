// ========== VOCAB GAME MODULE ==========
// 和联系人一起背单词：卡片系统、拼写挑战、连连看、限时闪卡、PK对战、联系人出题/讲题、错题集
(function(){
'use strict';

// ==================== 艾宾浩斯复习间隔（分钟） ====================
var EBBINGHAUS = [5, 30, 720, 1440, 2880, 5760, 10080, 21600, 43200];

// ==================== 状态管理 ====================
var vgState = {
    view: 'home', // home|selectContact|selectBook|card|spell|match|flash|pk|contactQuiz|contactTeach|wrongBook
    contact: null,
    bookId: null,
    cardSession: null,
    spellSession: null,
    matchSession: null,
    flashSession: null,
    pkSession: null,
    chatMessages: [],
    wrongFilter: 'all',
    pendingGame: null // 从加号菜单进入时记录
};

// ==================== 数据初始化 ====================
function initVocabData() {
    if (!store.study) store.study = {};
    if (!store.study.vocabGame) store.study.vocabGame = {};
    var vg = store.study.vocabGame;
    if (!vg.wordBooks) vg.wordBooks = [];
    if (!vg.gameHistory) vg.gameHistory = [];
    if (!vg.wrongBook) vg.wrongBook = [];
    if (!vg.stats) vg.stats = { totalWords:0, masteredWords:0, todayNewWords:0, todayReviewWords:0, totalGamePlayed:0, winRate:0, streak:0, lastStudyDate:'' };
    if (!vg.settings) vg.settings = { dailyGoal:20, reviewMode:'ebbinghaus', autoPlayPronunciation:false, difficulty:'normal' };
    // 重置今日统计
    var today = new Date().toLocaleDateString();
    if (vg.stats.lastStudyDate !== today) {
        var yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
        if (vg.stats.lastStudyDate === yesterday.toLocaleDateString() && (vg.stats.todayNewWords + vg.stats.todayReviewWords) > 0) {
            vg.stats.streak = (vg.stats.streak||0) + 1;
        } else if (vg.stats.lastStudyDate && vg.stats.lastStudyDate !== yesterday.toLocaleDateString()) {
            vg.stats.streak = 0;
        }
        vg.stats.todayNewWords = 0;
        vg.stats.todayReviewWords = 0;
        vg.stats.lastStudyDate = today;
    }
    // [FIX-词书同步] 每次初始化都同步学习资料到词书，而不是只在词书为空时
    // buildWordBooksFromMaterials内部已有去重检查(sourceMatId)，不会重复添加
    buildWordBooksFromMaterials();
    // [FIX-词书同步] 清理已被删除的学习资料对应的词书
    _cleanupOrphanedWordBooks();
}

// ==================== 从现有学习资料构建词书 ====================
function buildWordBooksFromMaterials() {
    if (!store.study || !store.study.materials) return;
    var vg = store.study.vocabGame;
    store.study.materials.forEach(function(mat) {
        if (!mat.isEnglish) return;
        if (vg.wordBooks.find(function(b){ return b.sourceMatId === mat.id; })) return;
        var words = parseVocabFromContent(mat.content || '');
        if (words.length > 0) {
            vg.wordBooks.push({
                id: 'wb_' + mat.id,
                name: mat.name,
                sourceMatId: mat.id,
                words: words
            });
        }
    });
}

// [FIX-词书同步] 清理孤儿词书：当学习资料被删除后，对应的词书也应该被移除
function _cleanupOrphanedWordBooks() {
    if (!store.study || !store.study.vocabGame) return;
    var vg = store.study.vocabGame;
    var materialIds = (store.study.materials || []).map(function(m) { return m.id; });
    // 过滤掉sourceMatId对应的学习资料已不存在的词书
    var before = vg.wordBooks.length;
    vg.wordBooks = vg.wordBooks.filter(function(b) {
        // 没有sourceMatId的词书（用户手动创建的）保留
        if (!b.sourceMatId) return true;
        return materialIds.indexOf(b.sourceMatId) !== -1;
    });
    if (vg.wordBooks.length < before) {
        console.log('[词书同步] 清理了 ' + (before - vg.wordBooks.length) + ' 个孤儿词书');
    }
}

function parseVocabFromContent(content) {
    var lines = content.split('\n').filter(function(l){ return l.trim(); });
    var words = [];
    lines.forEach(function(line) {
        var m = line.match(/^(\w[\w\s-]*?)\s+(v\.|n\.|adj\.|adv\.|prep\.|conj\.|pron\.)\s+(.+)/);
        if (m) {
            words.push({
                word: m[1].trim(),
                pos: m[2].trim(),
                meaning: m[3].trim(),
                example: '',
                phonetic: '',
                status: 'new',
                familiarity: 0,
                nextReview: 0,
                reviewCount: 0,
                wrongCount: 0,
                lastReview: 0
            });
        }
    });
    return words;
}

// ==================== 艾宾浩斯算法 ====================
function getNextReviewTime(word) {
    var level = Math.min(word.reviewCount || 0, EBBINGHAUS.length - 1);
    var interval = EBBINGHAUS[level];
    var fam = word.familiarity || 0;
    var factor = fam >= 4 ? 1.5 : (fam <= 1 ? 0.7 : 1);
    return Date.now() + interval * 60000 * factor;
}

function getWordsForReview(book, count) {
    var now = Date.now();
    // 优先复习到期的
    var due = book.words.filter(function(w){ return w.status !== 'mastered' && w.nextReview > 0 && w.nextReview <= now; });
    // 然后新词
    var newW = book.words.filter(function(w){ return w.status === 'new'; });
    // 混合
    var result = [];
    due.sort(function(a,b){ return a.nextReview - b.nextReview; });
    result = result.concat(due.slice(0, Math.ceil(count * 0.6)));
    result = result.concat(newW.slice(0, count - result.length));
    if (result.length < count) {
        var learning = book.words.filter(function(w){ return w.status === 'learning' && result.indexOf(w) === -1; });
        result = result.concat(learning.slice(0, count - result.length));
    }
    return result.slice(0, count);
}

// ==================== 工具函数 ====================
function _esc(s) { return typeof escapeHtml === 'function' ? escapeHtml(s||'') : String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _ph(size) { return 'https://ui-avatars.com/api/?name=?&background=random&size='+(size||40); }
function _shuffle(arr) { var a = arr.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;} return a; }
function _getContact() { return vgState.contact; }
function _getBook() { var vg = store.study.vocabGame; return vg.wordBooks.find(function(b){ return b.id === vgState.bookId; }); }
function _contactAvatar(c) { return c && c.avatar ? c.avatar : _ph(40); }

// ==================== 主渲染入口 ====================
function renderVocabGame() {
    var area = document.getElementById('vocab-game-content');
    if (!area) return;
    initVocabData();

    switch(vgState.view) {
        case 'home': renderVGHome(area); break;
        case 'selectContact': renderVGContactSelect(area); break;
        case 'selectBook': renderVGBookSelect(area); break;
        case 'card': renderVGCard(area); break;
        case 'spell': renderVGSpell(area); break;
        case 'match': renderVGMatch(area); break;
        case 'flash': renderVGFlash(area); break;
        case 'pk': renderVGPK(area); break;
        case 'contactQuiz': renderVGContactQuiz(area); break;
        case 'contactTeach': renderVGContactTeach(area); break;
        case 'wrongBook': renderVGWrongBook(area); break;
        default: renderVGHome(area);
    }
}

// ==================== 首页 ====================
function renderVGHome(area) {
    initVocabData();
    var vg = store.study.vocabGame;
    var stats = vg.stats;
    var totalW = 0, masteredW = 0;
    vg.wordBooks.forEach(function(b){ b.words.forEach(function(w){ totalW++; if(w.status==='mastered') masteredW++; }); });
    stats.totalWords = totalW;
    stats.masteredWords = masteredW;

    area.innerHTML = '<div class="vg-scroll">'
        + '<div class="vg-home-hero"><h3>和TA一起背单词</h3><p>选择联系人，开始有趣的单词学习之旅</p>'
        + '<div class="vg-home-stats">'
        + '<div class="vg-home-stat"><div class="num">'+(stats.todayNewWords+stats.todayReviewWords)+'</div><div class="label">今日已学</div></div>'
        + '<div class="vg-home-stat"><div class="num">'+masteredW+'</div><div class="label">已掌握</div></div>'
        + '<div class="vg-home-stat"><div class="num">'+(stats.streak||0)+'</div><div class="label">连续天数</div></div>'
        + '<div class="vg-home-stat"><div class="num">'+totalW+'</div><div class="label">总词汇</div></div>'
        + '</div></div>'
        // 功能入口
        + '<div class="vg-menu-grid">'
        + '<div class="vg-menu-item" onclick="vgStartGame(\'card\')"><div class="vg-menu-icon vg-icon-card"><i class="fas fa-clone"></i></div><span>翻转卡片</span></div>'
        + '<div class="vg-menu-item" onclick="vgStartGame(\'spell\')"><div class="vg-menu-icon vg-icon-spell"><i class="fas fa-keyboard"></i></div><span>拼写挑战</span></div>'
        + '<div class="vg-menu-item" onclick="vgStartGame(\'match\')"><div class="vg-menu-icon vg-icon-match"><i class="fas fa-link"></i></div><span>连连看</span></div>'
        + '<div class="vg-menu-item" onclick="vgStartGame(\'flash\')"><div class="vg-menu-icon vg-icon-flash"><i class="fas fa-bolt"></i></div><span>限时闪卡</span></div>'
        + '<div class="vg-menu-item" onclick="vgStartGame(\'pk\')"><div class="vg-menu-icon vg-icon-pk"><i class="fas fa-trophy"></i></div><span>PK对战</span></div>'
        + '<div class="vg-menu-item" onclick="vgStartGame(\'contactQuiz\')"><div class="vg-menu-icon vg-icon-contact"><i class="fas fa-user-graduate"></i></div><span>TA来考我</span></div>'
        + '<div class="vg-menu-item" onclick="vgStartGame(\'contactTeach\')"><div class="vg-menu-icon vg-icon-teach"><i class="fas fa-chalkboard-teacher"></i></div><span>TA来讲题</span></div>'
        + '<div class="vg-menu-item" onclick="vgOpenWrongBook()"><div class="vg-menu-icon vg-icon-wrong"><i class="fas fa-times-circle"></i></div><span>错题集</span></div>'
        + '</div>'
        // 词书列表
        + '<div style="font-size:14px;font-weight:600;color:#333;margin-bottom:8px;"><i class="fas fa-book"></i> 我的词书</div>'
        + _renderBookList()
        + '</div>';
}

function _renderBookList() {
    var vg = store.study.vocabGame;
    if (vg.wordBooks.length === 0) return '<div class="vg-empty" style="text-align:center;padding:30px 20px;">' +
        '<div style="font-size:14px;color:#999;margin-bottom:14px;">还没有词书</div>' +
        '<button onclick="if(typeof exitApp===\'function\') exitApp(); if(typeof openApp===\'function\') openApp(\'study\');" style="padding:8px 20px;background:#333;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">去学习中心上传</button>' +
    '</div>';
    return '<div class="vg-book-list">' + vg.wordBooks.map(function(b){
        var total = b.words.length;
        var mastered = b.words.filter(function(w){return w.status==='mastered';}).length;
        var pct = total > 0 ? Math.round(mastered/total*100) : 0;
        return '<div class="vg-book-item" onclick="vgSelectBookDirect(\''+b.id+'\')">'
            + '<div class="vg-book-icon"><i class="fas fa-book"></i></div>'
            + '<div class="vg-book-info"><div class="vg-book-name">'+_esc(b.name)+'</div>'
            + '<div class="vg-book-meta">'+total+'词 · 已掌握'+mastered+'词 ('+pct+'%)</div>'
            + '<div class="vg-book-progress"><div class="vg-book-progress-bar" style="width:'+pct+'%"></div></div>'
            + '</div></div>';
    }).join('') + '</div>';
}

// ==================== 选择联系人 ====================
function renderVGContactSelect(area) {
    var contacts = store.contacts.filter(function(c){ return !c.isGroup; });
    area.innerHTML = '<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">选择学习伙伴</div></div>'
        + '<div class="vg-scroll"><div class="vg-contact-list">'
        + contacts.map(function(c){
            var avatar = _contactAvatar(c);
            return '<div class="vg-contact-item" onclick="vgPickContact(\''+c.id+'\')">'
                + '<img src="'+avatar+'" onerror="this.src=\''+_ph(42)+'\'">'
                + '<div><div class="name">'+_esc(c.remark||c.name)+'</div><div class="desc">'+ _esc((c.persona||'').substring(0,30)||'点击选择') +'</div></div></div>';
        }).join('')
        + '</div></div>';
}

function vgPickContact(cid) {
    vgState.contact = store.contacts.find(function(c){ return c.id === cid; });
    if (vgState.pendingGame) {
        vgState.view = 'selectBook';
        renderVocabGame();
    } else {
        vgState.view = 'selectBook';
        renderVocabGame();
    }
}

// ==================== 选择词书 ====================
function renderVGBookSelect(area) {
    initVocabData();
    var vg = store.study.vocabGame;
    area.innerHTML = '<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">选择词书</div></div>'
        + '<div class="vg-scroll">'
        + (vg.wordBooks.length === 0 ? '<div class="vg-empty" style="text-align:center;padding:30px 20px;"><div style="font-size:14px;color:#999;margin-bottom:14px;">还没有词书</div><button onclick="if(typeof exitApp===\'function\') exitApp(); if(typeof openApp===\'function\') openApp(\'study\');" style="padding:8px 20px;background:#333;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">去学习中心上传</button></div>' :
        '<div class="vg-book-list">' + vg.wordBooks.map(function(b){
            var total = b.words.length;
            var mastered = b.words.filter(function(w){return w.status==='mastered';}).length;
            var pct = total > 0 ? Math.round(mastered/total*100) : 0;
            return '<div class="vg-book-item" onclick="vgPickBook(\''+b.id+'\')">'
                + '<div class="vg-book-icon"><i class="fas fa-book"></i></div>'
                + '<div class="vg-book-info"><div class="vg-book-name">'+_esc(b.name)+'</div>'
                + '<div class="vg-book-meta">'+total+'词 · 已掌握'+mastered+'词 ('+pct+'%)</div>'
                + '<div class="vg-book-progress"><div class="vg-book-progress-bar" style="width:'+pct+'%"></div></div>'
                + '</div></div>';
        }).join('') + '</div>')
        + '</div>';
}

function vgPickBook(bid) {
    vgState.bookId = bid;
    var game = vgState.pendingGame || 'card';
    vgState.pendingGame = null;
    vgState.view = game;
    // 初始化对应游戏
    switch(game) {
        case 'card': initCardSession(); break;
        case 'spell': initSpellSession(); break;
        case 'match': initMatchSession(); break;
        case 'flash': initFlashSession(); break;
        case 'pk': initPKSession(); break;
        case 'contactQuiz': initContactQuiz(); break;
        case 'contactTeach': initContactTeach(); break;
    }
    renderVocabGame();
}

function vgSelectBookDirect(bid) {
    vgState.bookId = bid;
    vgState.view = 'card';
    vgState.contact = null;
    initCardSession();
    renderVocabGame();
}

// ==================== 通用游戏启动 ====================
function vgStartGame(game) {
    vgState.pendingGame = game;
    if (game === 'wrongBook') { vgOpenWrongBook(); return; }
    // 需要联系人的游戏
    var needContact = ['pk','contactQuiz','contactTeach'].indexOf(game) >= 0;
    if (needContact && !vgState.contact) {
        vgState.view = 'selectContact';
        renderVocabGame();
        return;
    }
    // 需要词书
    if (!vgState.bookId) {
        vgState.view = 'selectBook';
        renderVocabGame();
        return;
    }
    vgState.pendingGame = null;
    vgState.view = game;
    switch(game) {
        case 'card': initCardSession(); break;
        case 'spell': initSpellSession(); break;
        case 'match': initMatchSession(); break;
        case 'flash': initFlashSession(); break;
        case 'pk': initPKSession(); break;
        case 'contactQuiz': initContactQuiz(); break;
        case 'contactTeach': initContactTeach(); break;
    }
    renderVocabGame();
}

function vgBack() {
    // 清理定时器
    if (vgState.flashSession && vgState.flashSession.timer) { clearInterval(vgState.flashSession.timer); vgState.flashSession.timer = null; }
    if (vgState.matchSession && vgState.matchSession.timer) { clearInterval(vgState.matchSession.timer); vgState.matchSession.timer = null; }
    if (vgState.spellSession && vgState.spellSession.timer) { clearInterval(vgState.spellSession.timer); vgState.spellSession.timer = null; }

    if (vgState.view === 'selectContact' || vgState.view === 'selectBook' || vgState.view === 'wrongBook') {
        vgState.view = 'home';
        vgState.pendingGame = null;
    } else if (vgState.view === 'home') {
        // 退出单词游戏 - 关闭layer回到上一层
        var layer = document.getElementById('layer-vocab-game');
        if (layer) layer.classList.remove('show');
        return;
    } else {
        vgState.view = 'home';
    }
    renderVocabGame();
}

function vgOpenFromChat() {
    // 从聊天界面加号菜单进入
    if (typeof activeChatId !== 'undefined' && activeChatId) {
        var c = store.contacts.find(function(x){ return x.id === activeChatId; });
        if (c && !c.isGroup) {
            vgState.contact = c;
        }
    }
    vgState.view = 'home';
    var layer = document.getElementById('layer-vocab-game');
    if (layer) layer.classList.add('show');
    renderVocabGame();
}

function vgOpenFromStudy() {
    vgState.view = 'home';
    vgState.contact = null;
    var layer = document.getElementById('layer-vocab-game');
    if (layer) layer.classList.add('show');
    renderVocabGame();
}

// ==================== 单词卡片系统 ====================
function initCardSession() {
    var book = _getBook();
    if (!book) return;
    var vg = store.study.vocabGame;
    var count = vg.settings.dailyGoal || 20;
    var words = getWordsForReview(book, count);
    if (words.length === 0) words = book.words.slice(0, count);
    vgState.cardSession = { words: words, index: 0, known: 0, unknown: 0, flipped: false, done: false };
}

function renderVGCard(area) {
    var s = vgState.cardSession;
    if (!s || s.done) { renderCardReport(area); return; }
    if (s.index >= s.words.length) { s.done = true; renderCardReport(area); return; }
    var w = s.words[s.index];
    var c = _getContact();
    var flipClass = s.flipped ? ' flipped' : '';
    area.innerHTML = '<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div>'
        + '<div class="vg-nav-title">翻转卡片</div><div class="vg-nav-actions"></div></div>'
        + '<div class="vg-card-area vg-animate-in">'
        + '<div class="vg-card-counter">第 '+(s.index+1)+' / '+s.words.length+' 个</div>'
        + '<div class="vg-card-wrapper" onclick="vgFlipCard()">'
        + '<div class="vg-card-inner'+flipClass+'">'
        + '<div class="vg-card-front"><div class="vg-card-word">'+_esc(w.word)+'</div>'
        + (w.phonetic ? '<div class="vg-card-phonetic">'+_esc(w.phonetic)+'</div>' : '')
        + '<div class="vg-card-pos">'+_esc(w.pos)+'</div>'
        + '<div class="vg-card-hint">点击翻转查看释义</div></div>'
        + '<div class="vg-card-back"><div class="vg-card-meaning">'+_esc(w.meaning)+'</div>'
        + (w.example ? '<div class="vg-card-example">'+_esc(w.example)+'</div>' : '')
        + '<div class="vg-card-back-hint">选择你是否认识这个词</div></div>'
        + '</div></div>'
        + '<div class="vg-card-actions">'
        + '<button class="vg-card-btn vg-card-btn-wrong" onclick="vgCardAnswer(false)"><i class="fas fa-times"></i></button>'
        + '<button class="vg-card-btn vg-card-btn-sound" onclick="vgCardSpeak(\''+_esc(w.word)+'\')"><i class="fas fa-volume-up"></i></button>'
        + '<button class="vg-card-btn vg-card-btn-right" onclick="vgCardAnswer(true)"><i class="fas fa-check"></i></button>'
        + '</div>'
        + (c ? '<div class="vg-contact-bubble" id="vg-contact-comment"><img src="'+_contactAvatar(c)+'"><div class="text">加油！</div></div>' : '')
        + '</div>';
}

function vgFlipCard() {
    var s = vgState.cardSession; if (!s) return;
    s.flipped = !s.flipped;
    var inner = document.querySelector('.vg-card-inner');
    if (inner) inner.classList.toggle('flipped');
}

function vgCardAnswer(known) {
    var s = vgState.cardSession;
    if (!s || s.index >= s.words.length) return;
    var w = s.words[s.index]; var vg = store.study.vocabGame;
    if (known) {
        s.known++; w.familiarity = Math.min(5, (w.familiarity||0) + 1);
        if (w.familiarity >= 5) w.status = 'mastered'; else w.status = 'learning';
        w.reviewCount = (w.reviewCount||0) + 1; w.nextReview = getNextReviewTime(w); w.lastReview = Date.now();
        vg.stats.todayReviewWords++;
    } else {
        s.unknown++; w.familiarity = Math.max(0, (w.familiarity||0) - 1); w.status = 'learning';
        w.wrongCount = (w.wrongCount||0) + 1; w.nextReview = Date.now() + 300000; w.lastReview = Date.now();
        addToWrongBook(w, 'meaning', '', w.meaning, 'card'); vg.stats.todayNewWords++;
    }
    if (typeof save === 'function') save();
    s.index++; s.flipped = false; renderVocabGame();
}

function vgCardSpeak(word) {
    if ('speechSynthesis' in window) { var u = new SpeechSynthesisUtterance(word); u.lang='en-US'; u.rate=0.8; speechSynthesis.speak(u); }
}

function renderCardReport(area) {
    var s = vgState.cardSession;
    if (!s) { vgState.view='home'; renderVocabGame(); return; }
    var total = s.known + s.unknown; var pct = total > 0 ? Math.round(s.known/total*100) : 0;
    var vg = store.study.vocabGame;
    vg.gameHistory.push({id:'game_'+Date.now(),type:'card',contactId:vgState.contact?vgState.contact.id:'',score:{known:s.known,unknown:s.unknown},duration:0,time:Date.now()});
    vg.stats.totalGamePlayed++; if (typeof save === 'function') save();
    area.innerHTML = '<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">学习报告</div></div>'
        + '<div class="vg-scroll"><div class="vg-report vg-animate-in"><h3>本轮学习完成</h3>'
        + '<div class="vg-report-stats"><div class="vg-report-stat"><div class="num">'+s.known+'</div><div class="label">认识</div></div>'
        + '<div class="vg-report-stat"><div class="num">'+s.unknown+'</div><div class="label">不认识</div></div>'
        + '<div class="vg-report-stat"><div class="num">'+pct+'%</div><div class="label">正确率</div></div></div>'
        + '<div class="vg-report-bar"><div class="vg-report-bar-inner" style="width:'+pct+'%"></div></div>'
        + '<div class="vg-report-actions"><button class="vg-report-btn vg-report-btn-primary" onclick="vgState.cardSession=null;initCardSession();renderVocabGame();">再来一轮</button>'
        + '<button class="vg-report-btn vg-report-btn-secondary" onclick="vgBack()">返回</button></div></div></div>';
}

// ==================== 拼写挑战 ====================
function initSpellSession() {
    var book = _getBook(); if (!book) return;
    var words = _shuffle(book.words.filter(function(w){return w.word.length<=12;})).slice(0,10);
    if (words.length===0) words = book.words.slice(0,5);
    vgState.spellSession = {words:words,index:0,score:0,input:'',hintUsed:false,timeLeft:120,timer:null,done:false,results:[]};
    vgState.spellSession.timer = setInterval(function(){
        var ss=vgState.spellSession; if(!ss||ss.done) return; ss.timeLeft--;
        var el=document.getElementById('vg-spell-timer'); if(el) el.textContent=ss.timeLeft+'s';
        if(ss.timeLeft<=0){ss.done=true;clearInterval(ss.timer);ss.timer=null;renderVocabGame();}
    },1000);
}

function renderVGSpell(area) {
    var s=vgState.spellSession;
    if(!s||s.done){renderSpellReport(area);return;}
    if(s.index>=s.words.length){s.done=true;if(s.timer){clearInterval(s.timer);s.timer=null;}renderSpellReport(area);return;}
    var w=s.words[s.index]; var chars=[];
    for(var i=0;i<w.word.length;i++){var ch=s.input[i]||'';chars.push('<div class="vg-spell-char'+(i===s.input.length?' active':'')+'">'+_esc(ch)+'</div>');}
    var keys='QWERTYUIOPASDFGHJKLZXCVBNM'.split('');
    var kh=keys.map(function(k){return '<div class="vg-spell-key" onclick="vgSpellType(\''+k+'\')">'+k+'</div>';}).join('');
    kh+='<div class="vg-spell-key" onclick="vgSpellBackspace()" style="width:50px;font-size:12px;">⌫</div>';
    kh+='<div class="vg-spell-key" onclick="vgSpellSubmit()" style="width:60px;font-size:12px;background:#111;color:#fff;border-color:#111;">确认</div>';
    area.innerHTML='<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">拼写挑战</div></div>'
        +'<div class="vg-spell-area vg-animate-in"><div class="vg-spell-timer" id="vg-spell-timer">'+s.timeLeft+'s</div>'
        +'<div class="vg-spell-score">得分: '+s.score+' · 第'+(s.index+1)+'/'+s.words.length+'题</div>'
        +'<div class="vg-spell-meaning">'+_esc(w.meaning)+'</div><div class="vg-spell-pos">'+_esc(w.pos)+'</div>'
        +'<div class="vg-spell-input-row">'+chars.join('')+'</div>'
        +(!s.hintUsed?'<div style="text-align:center;margin-bottom:8px;"><button onclick="vgSpellHint()" style="padding:6px 16px;border:1px solid #ddd;border-radius:20px;background:#fff;color:#111;font-size:12px;cursor:pointer;">提示首字母</button></div>':'<div class="vg-spell-hint">提示: 首字母是 '+w.word[0].toUpperCase()+'</div>')
        +'<div class="vg-spell-keyboard">'+kh+'</div></div>';
}

function vgSpellType(k){var s=vgState.spellSession;if(!s||s.done)return;var w=s.words[s.index];if(s.input.length>=w.word.length)return;s.input+=k.toLowerCase();renderVocabGame();}
function vgSpellBackspace(){var s=vgState.spellSession;if(!s||s.done||!s.input.length)return;s.input=s.input.slice(0,-1);renderVocabGame();}
function vgSpellHint(){var s=vgState.spellSession;if(!s||s.done)return;s.hintUsed=true;if(!s.input.length)s.input=s.words[s.index].word[0].toLowerCase();renderVocabGame();}

function vgSpellSubmit() {
    var s=vgState.spellSession; if(!s||s.done) return;
    var w=s.words[s.index]; var correct=s.input.toLowerCase()===w.word.toLowerCase();
    s.results.push({word:w.word,meaning:w.meaning,userInput:s.input,correct:correct});
    if(correct){s.score+=s.hintUsed?5:10;w.familiarity=Math.min(5,(w.familiarity||0)+1);w.reviewCount=(w.reviewCount||0)+1;w.nextReview=getNextReviewTime(w);if(w.familiarity>=5)w.status='mastered';else w.status='learning';}
    else{w.wrongCount=(w.wrongCount||0)+1;w.familiarity=Math.max(0,(w.familiarity||0)-1);addToWrongBook(w,'spelling',s.input,w.word,'spell');}
    w.lastReview=Date.now();store.study.vocabGame.stats.todayReviewWords++;if(typeof save==='function')save();
    setTimeout(function(){s.index++;s.input='';s.hintUsed=false;renderVocabGame();},600);
}

function renderSpellReport(area) {
    var s=vgState.spellSession; if(!s){vgState.view='home';renderVocabGame();return;}
    var correct=s.results.filter(function(r){return r.correct;}).length; var total=s.results.length;
    var pct=total>0?Math.round(correct/total*100):0; var vg=store.study.vocabGame;
    vg.gameHistory.push({id:'game_'+Date.now(),type:'spell',contactId:vgState.contact?vgState.contact.id:'',score:{correct:correct,total:total,points:s.score},duration:120-s.timeLeft,time:Date.now()});
    vg.stats.totalGamePlayed++;if(typeof save==='function')save();
    var wl=s.results.filter(function(r){return !r.correct;});
    area.innerHTML='<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">拼写报告</div></div>'
        +'<div class="vg-scroll"><div class="vg-report vg-animate-in"><h3>拼写挑战结束</h3>'
        +'<div class="vg-report-stats"><div class="vg-report-stat"><div class="num">'+s.score+'</div><div class="label">得分</div></div>'
        +'<div class="vg-report-stat"><div class="num">'+correct+'/'+total+'</div><div class="label">正确</div></div>'
        +'<div class="vg-report-stat"><div class="num">'+pct+'%</div><div class="label">正确率</div></div></div>'
        +(wl.length>0?'<div style="text-align:left;margin-top:16px;"><div style="font-size:13px;font-weight:600;color:#111;margin-bottom:8px;">拼错的单词：</div>'+wl.map(function(r){return '<div style="padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;"><span style="color:#999;text-decoration:line-through;">'+_esc(r.userInput)+'</span> → <span style="color:#111;font-weight:600;">'+_esc(r.word)+'</span> <span style="color:#999;">'+_esc(r.meaning)+'</span></div>';}).join('')+'</div>':'')
        +'<div class="vg-report-actions"><button class="vg-report-btn vg-report-btn-primary" onclick="vgState.spellSession=null;initSpellSession();renderVocabGame();">再来一轮</button>'
        +'<button class="vg-report-btn vg-report-btn-secondary" onclick="vgBack()">返回</button></div></div></div>';
}

// ==================== 连连看 ====================
function initMatchSession() {
    var book=_getBook(); if(!book) return;
    var words=_shuffle(book.words).slice(0,6); if(words.length<3) words=book.words.slice(0,3);
    var left=_shuffle(words.map(function(w,i){return {id:i,text:w.word,type:'en',matched:false};}));
    var right=_shuffle(words.map(function(w,i){return {id:i,text:w.meaning,type:'cn',matched:false};}));
    vgState.matchSession={words:words,left:left,right:right,selectedLeft:null,selectedRight:null,matched:0,total:words.length,wrong:0,timeLeft:90,timer:null,done:false,score:0};
    vgState.matchSession.timer=setInterval(function(){var ms=vgState.matchSession;if(!ms||ms.done)return;ms.timeLeft--;var el=document.getElementById('vg-match-timer');if(el)el.textContent=ms.timeLeft+'s';if(ms.timeLeft<=0){ms.done=true;clearInterval(ms.timer);ms.timer=null;renderVocabGame();}},1000);
}

function renderVGMatch(area) {
    var s=vgState.matchSession;
    if(!s||s.done){renderMatchReport(area);return;}
    if(s.matched>=s.total){s.done=true;if(s.timer){clearInterval(s.timer);s.timer=null;}renderMatchReport(area);return;}
    area.innerHTML='<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">连连看</div></div>'
        +'<div class="vg-scroll vg-animate-in"><div class="vg-match-timer" id="vg-match-timer">'+s.timeLeft+'s</div>'
        +'<div class="vg-match-score">已配对: '+s.matched+'/'+s.total+' · 错误: '+s.wrong+'</div>'
        +'<div class="vg-match-columns"><div class="vg-match-col">'+s.left.map(function(item){
            var cls='vg-match-item'+(item.matched?' matched':'')+(s.selectedLeft===item.id?' selected':'');
            return '<div class="'+cls+'" onclick="vgMatchSelect(\'left\','+item.id+')">'+_esc(item.text)+'</div>';
        }).join('')+'</div><div class="vg-match-col">'+s.right.map(function(item){
            var cls='vg-match-item'+(item.matched?' matched':'')+(s.selectedRight===item.id?' selected':'');
            return '<div class="'+cls+'" onclick="vgMatchSelect(\'right\','+item.id+')">'+_esc(item.text)+'</div>';
        }).join('')+'</div></div></div>';
}

function vgMatchSelect(side,id) {
    var s=vgState.matchSession; if(!s||s.done) return;
    if(side==='left'){if(s.left.find(function(x){return x.id===id;}).matched)return;s.selectedLeft=id;}
    else{if(s.right.find(function(x){return x.id===id;}).matched)return;s.selectedRight=id;}
    if(s.selectedLeft!==null&&s.selectedRight!==null){
        if(s.selectedLeft===s.selectedRight){
            s.left.find(function(x){return x.id===s.selectedLeft;}).matched=true;
            s.right.find(function(x){return x.id===s.selectedRight;}).matched=true;
            s.matched++;s.score+=10;
            var w=s.words[s.selectedLeft];if(w){w.familiarity=Math.min(5,(w.familiarity||0)+1);w.reviewCount=(w.reviewCount||0)+1;w.nextReview=getNextReviewTime(w);w.lastReview=Date.now();if(w.familiarity>=5)w.status='mastered';else w.status='learning';}
        } else {
            s.wrong++;var ww=s.words[s.selectedLeft];if(ww){ww.wrongCount=(ww.wrongCount||0)+1;addToWrongBook(ww,'meaning','',ww.meaning,'match');}
        }
        s.selectedLeft=null;s.selectedRight=null;store.study.vocabGame.stats.todayReviewWords++;if(typeof save==='function')save();
    }
    renderVocabGame();
}

function renderMatchReport(area) {
    var s=vgState.matchSession; if(!s){vgState.view='home';renderVocabGame();return;}
    var vg=store.study.vocabGame;
    vg.gameHistory.push({id:'game_'+Date.now(),type:'match',contactId:vgState.contact?vgState.contact.id:'',score:{matched:s.matched,total:s.total,wrong:s.wrong,points:s.score},duration:90-s.timeLeft,time:Date.now()});
    vg.stats.totalGamePlayed++;if(typeof save==='function')save();
    area.innerHTML='<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">连连看报告</div></div>'
        +'<div class="vg-scroll"><div class="vg-report vg-animate-in"><h3>连连看结束</h3>'
        +'<div class="vg-report-stats"><div class="vg-report-stat"><div class="num">'+s.score+'</div><div class="label">得分</div></div>'
        +'<div class="vg-report-stat"><div class="num">'+s.matched+'/'+s.total+'</div><div class="label">配对</div></div>'
        +'<div class="vg-report-stat"><div class="num">'+s.wrong+'</div><div class="label">错误</div></div></div>'
        +'<div class="vg-report-actions"><button class="vg-report-btn vg-report-btn-primary" onclick="vgState.matchSession=null;initMatchSession();renderVocabGame();">再来一轮</button>'
        +'<button class="vg-report-btn vg-report-btn-secondary" onclick="vgBack()">返回</button></div></div></div>';
}

// ==================== 限时闪卡 ====================
function initFlashSession() {
    var book=_getBook(); if(!book) return;
    var words=_shuffle(book.words).slice(0,15); if(words.length<3) words=book.words.slice(0,3);
    // 生成题目：一半正确配对，一半错误配对
    var items=[];
    words.forEach(function(w){
        var correct=Math.random()>0.4;
        var meaning=correct?w.meaning:words[Math.floor(Math.random()*words.length)].meaning;
        if(!correct&&meaning===w.meaning){correct=true;} // 避免碰巧正确
        items.push({word:w.word,shownMeaning:meaning,correctMeaning:w.meaning,isCorrect:correct,wordObj:w});
    });
    vgState.flashSession={items:items,index:0,score:0,correct:0,wrong:0,timePerCard:3000,timer:null,timerStart:0,done:false};
}

function renderVGFlash(area) {
    var s=vgState.flashSession;
    if(!s||s.done){renderFlashReport(area);return;}
    if(s.index>=s.items.length){s.done=true;renderFlashReport(area);return;}
    var item=s.items[s.index];
    // 启动倒计时
    s.timerStart=Date.now();
    if(s.timer) clearInterval(s.timer);
    s.timer=setInterval(function(){
        var elapsed=Date.now()-s.timerStart;
        var pct=Math.max(0,100-elapsed/s.timePerCard*100);
        var bar=document.getElementById('vg-flash-timer-bar');
        if(bar) bar.style.width=pct+'%';
        if(elapsed>=s.timePerCard){clearInterval(s.timer);s.timer=null;vgFlashAnswer(null);}
    },50);
    area.innerHTML='<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">限时闪卡</div></div>'
        +'<div class="vg-flash-area vg-animate-in">'
        +'<div style="font-size:13px;color:#999;margin-bottom:8px;">第'+(s.index+1)+'/'+s.items.length+'题 · 正确:'+s.correct+' 错误:'+s.wrong+'</div>'
        +'<div class="vg-flash-card" id="vg-flash-card"><div class="vg-flash-word">'+_esc(item.word)+'</div><div class="vg-flash-meaning">'+_esc(item.shownMeaning)+'</div></div>'
        +'<div class="vg-flash-timer-bar"><div class="vg-flash-timer-inner" id="vg-flash-timer-bar" style="width:100%"></div></div>'
        +'<div style="font-size:13px;color:#999;margin-bottom:12px;">这个释义对吗？</div>'
        +'<div class="vg-flash-btns">'
        +'<button class="vg-flash-btn vg-flash-btn-wrong" onclick="vgFlashAnswer(false)"><i class="fas fa-times"></i></button>'
        +'<button class="vg-flash-btn vg-flash-btn-right" onclick="vgFlashAnswer(true)"><i class="fas fa-check"></i></button>'
        +'</div></div>';
}

function vgFlashAnswer(userSaysCorrect) {
    var s=vgState.flashSession; if(!s||s.done) return;
    if(s.timer){clearInterval(s.timer);s.timer=null;}
    var item=s.items[s.index];
    var isRight=(userSaysCorrect===item.isCorrect);
    if(userSaysCorrect===null) isRight=false; // 超时算错
    if(isRight){s.correct++;s.score+=10;item.wordObj.familiarity=Math.min(5,(item.wordObj.familiarity||0)+1);item.wordObj.reviewCount=(item.wordObj.reviewCount||0)+1;item.wordObj.nextReview=getNextReviewTime(item.wordObj);if(item.wordObj.familiarity>=5)item.wordObj.status='mastered';else item.wordObj.status='learning';}
    else{s.wrong++;item.wordObj.wrongCount=(item.wordObj.wrongCount||0)+1;item.wordObj.familiarity=Math.max(0,(item.wordObj.familiarity||0)-1);addToWrongBook(item.wordObj,'meaning','',item.wordObj.meaning,'flash');}
    item.wordObj.lastReview=Date.now();store.study.vocabGame.stats.todayReviewWords++;if(typeof save==='function')save();
    s.index++;
    setTimeout(function(){renderVocabGame();},300);
}

function renderFlashReport(area) {
    var s=vgState.flashSession; if(!s){vgState.view='home';renderVocabGame();return;}
    var total=s.correct+s.wrong; var pct=total>0?Math.round(s.correct/total*100):0;
    var vg=store.study.vocabGame;
    vg.gameHistory.push({id:'game_'+Date.now(),type:'flash',contactId:vgState.contact?vgState.contact.id:'',score:{correct:s.correct,wrong:s.wrong,points:s.score},duration:0,time:Date.now()});
    vg.stats.totalGamePlayed++;if(typeof save==='function')save();
    area.innerHTML='<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">闪卡报告</div></div>'
        +'<div class="vg-scroll"><div class="vg-report vg-animate-in"><h3>限时闪卡结束</h3>'
        +'<div class="vg-report-stats"><div class="vg-report-stat"><div class="num">'+s.score+'</div><div class="label">得分</div></div>'
        +'<div class="vg-report-stat"><div class="num">'+s.correct+'</div><div class="label">正确</div></div>'
        +'<div class="vg-report-stat"><div class="num">'+pct+'%</div><div class="label">正确率</div></div></div>'
        +'<div class="vg-report-actions"><button class="vg-report-btn vg-report-btn-primary" onclick="vgState.flashSession=null;initFlashSession();renderVocabGame();">再来一轮</button>'
        +'<button class="vg-report-btn vg-report-btn-secondary" onclick="vgBack()">返回</button></div></div></div>';
}

// ==================== PK对战 ====================
function initPKSession() {
    var book=_getBook(); if(!book) return;
    var c=_getContact(); if(!c) return;
    var words=_shuffle(book.words).slice(0,10); if(words.length<3) words=book.words.slice(0,3);
    var questions=words.map(function(w){
        var opts=[w.meaning];
        var others=book.words.filter(function(x){return x.word!==w.word;});
        others=_shuffle(others).slice(0,3);
        others.forEach(function(o){opts.push(o.meaning);});
        while(opts.length<4) opts.push('以上都不对');
        opts=_shuffle(opts);
        var correctIdx=opts.indexOf(w.meaning);
        return {word:w.word,meaning:w.meaning,options:opts,correctIdx:correctIdx,wordObj:w,userAnswer:-1,contactAnswer:-1,userCorrect:false,contactCorrect:false};
    });
    vgState.pkSession={questions:questions,index:0,userScore:0,contactScore:0,done:false,contact:c};
}

function renderVGPK(area) {
    var s=vgState.pkSession;
    if(!s||s.done){renderPKReport(area);return;}
    if(s.index>=s.questions.length){s.done=true;renderPKReport(area);return;}
    var q=s.questions[s.index]; var c=s.contact;
    area.innerHTML='<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">PK对战</div></div>'
        +'<div class="vg-scroll vg-animate-in"><div class="vg-pk-header">'
        +'<div class="vg-pk-player"><img src="'+_ph(40)+'"><div class="name">我</div><div class="score">'+s.userScore+'</div></div>'
        +'<div class="vg-pk-vs">VS</div>'
        +'<div class="vg-pk-player"><img src="'+_contactAvatar(c)+'"><div class="name">'+_esc(c.remark||c.name)+'</div><div class="score">'+s.contactScore+'</div></div>'
        +'</div>'
        +'<div class="vg-pk-round">第 '+(s.index+1)+' / '+s.questions.length+' 轮</div>'
        +'<div class="vg-pk-question"><div class="vg-pk-stem">"'+_esc(q.word)+'" 的意思是？</div>'
        +'<div class="vg-pk-options">'+q.options.map(function(opt,i){
            return '<div class="vg-pk-option" onclick="vgPKAnswer('+i+')">'+String.fromCharCode(65+i)+'. '+_esc(opt)+'</div>';
        }).join('')+'</div></div></div>';
}

function vgPKAnswer(idx) {
    var s=vgState.pkSession; if(!s||s.done) return;
    var q=s.questions[s.index];
    if(q.userAnswer>=0) return; // 已答过
    q.userAnswer=idx; q.userCorrect=(idx===q.correctIdx);
    // AI联系人答题（有概率答错）
    var difficulty=store.study.vocabGame.settings.difficulty||'normal';
    var aiCorrectRate=difficulty==='easy'?0.4:difficulty==='hard'?0.8:0.6;
    q.contactCorrect=Math.random()<aiCorrectRate;
    q.contactAnswer=q.contactCorrect?q.correctIdx:((q.correctIdx+1+Math.floor(Math.random()*3))%q.options.length);
    if(q.userCorrect) s.userScore+=10;
    if(q.contactCorrect) s.contactScore+=10;
    // 更新单词状态
    var w=q.wordObj;
    if(q.userCorrect){w.familiarity=Math.min(5,(w.familiarity||0)+1);w.reviewCount=(w.reviewCount||0)+1;w.nextReview=getNextReviewTime(w);if(w.familiarity>=5)w.status='mastered';else w.status='learning';}
    else{w.wrongCount=(w.wrongCount||0)+1;w.familiarity=Math.max(0,(w.familiarity||0)-1);addToWrongBook(w,'meaning','',w.meaning,'pk');}
    w.lastReview=Date.now();store.study.vocabGame.stats.todayReviewWords++;if(typeof save==='function')save();
    // 高亮选项
    var opts=document.querySelectorAll('.vg-pk-option');
    opts.forEach(function(el,i){if(i===q.correctIdx)el.classList.add('correct');else if(i===idx&&!q.userCorrect)el.classList.add('wrong');});
    var resultText=q.userCorrect?(q.contactCorrect?'平局！都答对了':'你答对了！TA答错了'):(q.contactCorrect?'TA答对了，你答错了':'都答错了...');
    var resultCls=q.userCorrect&&!q.contactCorrect?'win':(!q.userCorrect&&q.contactCorrect?'lose':'draw');
    var resultDiv=document.createElement('div');resultDiv.className='vg-pk-result '+resultCls;resultDiv.textContent=resultText;
    var qDiv=document.querySelector('.vg-pk-question');if(qDiv)qDiv.appendChild(resultDiv);
    setTimeout(function(){s.index++;renderVocabGame();},1200);
}

function renderPKReport(area) {
    var s=vgState.pkSession; if(!s){vgState.view='home';renderVocabGame();return;}
    var c=s.contact; var result=s.userScore>s.contactScore?'你赢了':(s.userScore<s.contactScore?'TA赢了':'平局');
    var vg=store.study.vocabGame;
    vg.gameHistory.push({id:'game_'+Date.now(),type:'pk',contactId:c?c.id:'',score:{user:s.userScore,contact:s.contactScore},duration:0,time:Date.now()});
    vg.stats.totalGamePlayed++;
    var totalGames=vg.gameHistory.filter(function(g){return g.type==='pk';}).length;
    var wins=vg.gameHistory.filter(function(g){return g.type==='pk'&&g.score.user>g.score.contact;}).length;
    vg.stats.winRate=totalGames>0?Math.round(wins/totalGames*100):0;
    if(typeof save==='function')save();
    area.innerHTML='<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">PK结果</div></div>'
        +'<div class="vg-scroll"><div class="vg-report vg-animate-in"><h3>'+result+'</h3>'
        +'<div class="vg-report-stats"><div class="vg-report-stat"><div class="num">'+s.userScore+'</div><div class="label">我的得分</div></div>'
        +'<div class="vg-report-stat"><div class="num">'+s.contactScore+'</div><div class="label">'+_esc(c?c.name:'TA')+'</div></div></div>'
        +'<div class="vg-report-actions"><button class="vg-report-btn vg-report-btn-primary" onclick="vgState.pkSession=null;initPKSession();renderVocabGame();">再来一局</button>'
        +'<button class="vg-report-btn vg-report-btn-secondary" onclick="vgBack()">返回</button></div></div></div>';
}

// ==================== 联系人出题（TA来考我） ====================
function initContactQuiz() {
    vgState.chatMessages = [];
    vgState.chatMessages.push({role:'system',text:'正在让'+(_getContact()?_getContact().name:'TA')+'出题...'});
}

function renderVGContactQuiz(area) {
    var c=_getContact(); if(!c){vgState.view='home';renderVocabGame();return;}
    var msgs=vgState.chatMessages;
    area.innerHTML='<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">'+_esc(c.name)+' 考你</div></div>'
        +'<div class="vg-chat-area"><div class="vg-chat-msgs" id="vg-chat-msgs">'
        +msgs.map(function(m){return '<div class="vg-chat-msg '+m.role+'">'+_esc(m.text)+'</div>';}).join('')
        +'</div><div class="vg-chat-input-bar"><input id="vg-chat-input" placeholder="输入你的答案..." onkeypress="if(event.key===\'Enter\')vgChatSend()"><button onclick="vgChatSend()">发送</button>'
        +'<button onclick="vgContactAsk()" style="background:#f0f0f0;color:#111;">出题</button></div></div>';
    var el=document.getElementById('vg-chat-msgs');if(el)el.scrollTop=el.scrollHeight;
    // 自动出第一题
    if(msgs.length<=1) setTimeout(function(){vgContactAsk();},500);
}

async function vgContactAsk() {
    var c=_getContact(); var book=_getBook();
    if(!c||!book) return;
    var words=_shuffle(book.words).slice(0,5);
    var wordList=words.map(function(w){return w.word+' '+w.pos+' '+w.meaning;}).join('\n');
    var persona=c.persona||'';
    var sysPrompt='你是'+c.name+'。'+(persona?'你的人设：'+persona+'。':'')
        +'请根据以下单词出一道选择题考用户。\n单词列表：\n'+wordList
        +'\n要求：1.出一道选择题(4选项A/B/C/D) 2.末尾标注[答案:X] 3.用你的语气提问 4.简洁明了';
    vgState.chatMessages.push({role:'system',text:c.name+'正在出题...'});
    renderVocabGame();
    try {
        var data=await API.chatCompletion([{role:'system',content:sysPrompt},{role:'user',content:'考我一题！'}],0.8,true);
        if(data&&data.choices&&data.choices[0]){
            var reply=data.choices[0].message.content;
            vgState.chatMessages.pop(); // 移除"正在出题"
            vgState.chatMessages.push({role:'contact',text:reply});
        }
    } catch(e) {
        vgState.chatMessages.pop();
        // 本地出题
        var w=words[0];
        var opts=[w.meaning];var others=_shuffle(book.words.filter(function(x){return x.word!==w.word;})).slice(0,3);
        others.forEach(function(o){opts.push(o.meaning);});opts=_shuffle(opts);
        var correctLetter=String.fromCharCode(65+opts.indexOf(w.meaning));
        var q='"'+w.word+'"的意思是？\nA. '+opts[0]+'\nB. '+opts[1]+'\nC. '+opts[2]+'\nD. '+(opts[3]||'以上都不对')+'\n[答案:'+correctLetter+']';
        vgState.chatMessages.push({role:'contact',text:q});
    }
    renderVocabGame();
}

function vgChatSend() {
    var input=document.getElementById('vg-chat-input');
    if(!input||!input.value.trim()) return;
    var text=input.value.trim(); input.value='';
    vgState.chatMessages.push({role:'user',text:text});
    // 检查是否是答案
    var lastQ=null;
    for(var i=vgState.chatMessages.length-1;i>=0;i--){
        if(vgState.chatMessages[i].role==='contact'){lastQ=vgState.chatMessages[i].text;break;}
    }
    if(lastQ){
        var ansMatch=lastQ.match(/\[答案[:：]\s*([A-Da-d])\]/);
        if(ansMatch){
            var correct=text.toUpperCase()===ansMatch[1].toUpperCase();
            store.study.vocabGame.stats.todayReviewWords++;
            if(correct) vgState.chatMessages.push({role:'system',text:'回答正确'});
            else vgState.chatMessages.push({role:'system',text:'回答错误，正确答案是 '+ansMatch[1].toUpperCase()});
            if(typeof save==='function')save();
        }
    }
    renderVocabGame();
}

// ==================== 联系人讲题（TA来讲题） ====================
function initContactTeach() {
    vgState.chatMessages=[];
    vgState.chatMessages.push({role:'system',text:'选择一个单词让'+(_getContact()?_getContact().name:'TA')+'讲解'});
}

function renderVGContactTeach(area) {
    var c=_getContact(); if(!c){vgState.view='home';renderVocabGame();return;}
    var book=_getBook();
    var msgs=vgState.chatMessages;
    // 如果还没选词，显示词列表
    if(msgs.length<=1&&book){
        var wordBtns=_shuffle(book.words).slice(0,12).map(function(w){
            return '<button onclick="vgTeachWord(\''+_esc(w.word)+'\')" style="padding:8px 14px;margin:4px;border:1px solid #ddd;border-radius:20px;background:#fff;font-size:13px;cursor:pointer;">'+_esc(w.word)+'</button>';
        }).join('');
        area.innerHTML='<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">'+_esc(c.name)+' 讲题</div></div>'
            +'<div class="vg-scroll"><div style="padding:16px;text-align:center;"><div style="font-size:14px;color:#666;margin-bottom:12px;">选择一个单词让'+_esc(c.name)+'讲解：</div>'
            +'<div style="display:flex;flex-wrap:wrap;justify-content:center;">'+wordBtns+'</div></div></div>';
        return;
    }
    area.innerHTML='<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">'+_esc(c.name)+' 讲题</div></div>'
        +'<div class="vg-chat-area"><div class="vg-chat-msgs" id="vg-chat-msgs">'
        +msgs.map(function(m){return '<div class="vg-chat-msg '+m.role+'">'+_esc(m.text)+'</div>';}).join('')
        +'</div><div class="vg-chat-input-bar"><input id="vg-chat-input" placeholder="追问..." onkeypress="if(event.key===\'Enter\')vgTeachChat()"><button onclick="vgTeachChat()">发送</button></div></div>';
    var el=document.getElementById('vg-chat-msgs');if(el)el.scrollTop=el.scrollHeight;
}

async function vgTeachWord(word) {
    var c=_getContact(); if(!c) return;
    vgState.chatMessages=[{role:'user',text:'请讲解单词: '+word}];
    vgState.chatMessages.push({role:'system',text:c.name+'正在准备讲解...'});
    renderVocabGame();
    var persona=c.persona||'';
    var sysPrompt='你是'+c.name+'。'+(persona?'你的人设：'+persona+'。':'')
        +'请用你的风格详细讲解英文单词"'+word+'"。包含：1.词性和释义 2.音标 3.词根词缀分析(如有) 4.常用搭配 5.例句 6.近义词辨析 7.记忆技巧。用你的语气讲解，可以加入鼓励或调侃。';
    try {
        var data=await API.chatCompletion([{role:'system',content:sysPrompt},{role:'user',content:'请讲解单词: '+word}],0.8,true);
        if(data&&data.choices&&data.choices[0]){
            vgState.chatMessages.pop();
            vgState.chatMessages.push({role:'contact',text:data.choices[0].message.content});
        }
    } catch(e) {
        vgState.chatMessages.pop();
        vgState.chatMessages.push({role:'contact',text:'这个词"'+word+'"嘛...让我想想怎么给你讲比较好理解。你先自己查查词典，回头我再给你详细说~'});
    }
    store.study.vocabGame.stats.todayReviewWords++;if(typeof save==='function')save();
    renderVocabGame();
}

async function vgTeachChat() {
    var input=document.getElementById('vg-chat-input');
    if(!input||!input.value.trim()) return;
    var text=input.value.trim(); input.value='';
    var c=_getContact(); if(!c) return;
    vgState.chatMessages.push({role:'user',text:text});
    vgState.chatMessages.push({role:'system',text:c.name+'正在回复...'});
    renderVocabGame();
    var persona=c.persona||'';
    var history=vgState.chatMessages.filter(function(m){return m.role!=='system';}).map(function(m){return {role:m.role==='user'?'user':'assistant',content:m.text};});
    try {
        var data=await API.chatCompletion([{role:'system',content:'你是'+c.name+'。'+(persona?'人设：'+persona+'。':'')+'你正在给用户讲解英文单词，请继续用你的风格回答。'}].concat(history),0.8,true);
        if(data&&data.choices&&data.choices[0]){
            vgState.chatMessages.pop();
            vgState.chatMessages.push({role:'contact',text:data.choices[0].message.content});
        }
    } catch(e) {
        vgState.chatMessages.pop();
        vgState.chatMessages.push({role:'contact',text:'嗯...这个问题我一时半会儿说不清楚，你可以换个角度问我~'});
    }
    renderVocabGame();
}

// ==================== 错题集 ====================
function addToWrongBook(wordObj,wrongType,wrongAnswer,correctAnswer,source) {
    initVocabData();
    var wb=store.study.vocabGame.wrongBook;
    // 避免重复
    var existing=wb.find(function(x){return x.word===wordObj.word&&!x.mastered;});
    if(existing){existing.wrongCount=(existing.wrongCount||0)+1;existing.lastWrongTime=Date.now();return;}
    wb.push({
        id:'wrong_'+Date.now()+'_'+Math.random().toString(36).substr(2,4),
        word:wordObj.word, meaning:wordObj.meaning, pos:wordObj.pos||'',
        wrongType:wrongType, wrongAnswer:wrongAnswer, correctAnswer:correctAnswer,
        source:source, contactId:vgState.contact?vgState.contact.id:'',
        note:'', tags:[], addTime:Date.now(), lastWrongTime:Date.now(),
        reviewCount:0, wrongCount:1, mastered:false
    });
}

function vgOpenWrongBook() {
    vgState.view='wrongBook'; vgState.wrongFilter='all'; renderVocabGame();
}

function renderVGWrongBook(area) {
    initVocabData();
    var wb=store.study.vocabGame.wrongBook.filter(function(w){return !w.mastered;});
    if(vgState.wrongFilter==='spelling') wb=wb.filter(function(w){return w.wrongType==='spelling';});
    else if(vgState.wrongFilter==='meaning') wb=wb.filter(function(w){return w.wrongType==='meaning';});

    // 分析
    var totalWrong=store.study.vocabGame.wrongBook.length;
    var spellingCount=store.study.vocabGame.wrongBook.filter(function(w){return w.wrongType==='spelling';}).length;
    var meaningCount=store.study.vocabGame.wrongBook.filter(function(w){return w.wrongType==='meaning';}).length;

    area.innerHTML='<div class="vg-nav"><div class="vg-nav-back" onclick="vgBack()"><i class="fas fa-chevron-left"></i></div><div class="vg-nav-title">错题集 ('+wb.length+')</div></div>'
        +'<div class="vg-scroll">'
        // 分析卡片
        +(totalWrong>0?'<div class="vg-analysis"><h4>薄弱分析</h4>'
            +'<div class="vg-analysis-bar"><div class="label">拼写</div><div class="bar"><div class="bar-inner" style="width:'+(totalWrong>0?Math.round(spellingCount/totalWrong*100):0)+'%;"></div></div><div class="count">'+spellingCount+'</div></div>'
            +'<div class="vg-analysis-bar"><div class="label">词义</div><div class="bar"><div class="bar-inner" style="width:'+(totalWrong>0?Math.round(meaningCount/totalWrong*100):0)+'%;"></div></div><div class="count">'+meaningCount+'</div></div>'
            +'</div>':'')
        // 筛选
        +'<div class="vg-filter-bar">'
        +'<button class="vg-filter-btn'+(vgState.wrongFilter==='all'?' active':'')+'" onclick="vgState.wrongFilter=\'all\';renderVocabGame();">全部</button>'
        +'<button class="vg-filter-btn'+(vgState.wrongFilter==='spelling'?' active':'')+'" onclick="vgState.wrongFilter=\'spelling\';renderVocabGame();">拼写错误</button>'
        +'<button class="vg-filter-btn'+(vgState.wrongFilter==='meaning'?' active':'')+'" onclick="vgState.wrongFilter=\'meaning\';renderVocabGame();">词义错误</button>'
        +'</div>'
        // 列表
        +(wb.length===0?'<div class="vg-empty">暂无错题，继续加油！</div>':
        '<div class="vg-wrong-list">'+wb.slice().reverse().map(function(w){
            var typeLabel=w.wrongType==='spelling'?'拼写':'词义';
            var typeCls='type-'+w.wrongType;
            return '<div class="vg-wrong-card"><div class="vg-wrong-word">'+_esc(w.word)+'</div>'
                +'<div class="vg-wrong-meaning">'+_esc(w.meaning)+'</div>'
                +'<div class="vg-wrong-detail"><span class="vg-wrong-tag '+typeCls+'">'+typeLabel+'</span>'
                +'<span class="vg-wrong-tag">错'+w.wrongCount+'次</span>'
                +'<span class="vg-wrong-tag">来源:'+_esc(w.source)+'</span></div>'
                +(w.note?'<div class="vg-wrong-note">'+_esc(w.note)+'</div>':'')
                +'<div class="vg-wrong-actions">'
                +'<button onclick="vgWrongNote(\''+w.id+'\')"><i class="fas fa-pen"></i> 笔记</button>'
                +'<button onclick="vgWrongMaster(\''+w.id+'\')"><i class="fas fa-check"></i> 已掌握</button>'
                +'<button onclick="vgWrongDelete(\''+w.id+'\')"><i class="fas fa-trash"></i></button>'
                +'</div></div>';
        }).join('')+'</div>')
        +(wb.length>0?'<div style="padding:12px 0;"><button class="vg-btn-primary" onclick="vgWrongPractice()">错题专项练习</button></div>':'')
        +'</div>';
}

function vgWrongNote(id) {
    var w=store.study.vocabGame.wrongBook.find(function(x){return x.id===id;});
    if(!w) return;
    var note=prompt('添加考点笔记',w.note||'');
    if(note===null) return;
    w.note=note.trim(); if(typeof save==='function')save(); renderVocabGame();
}

function vgWrongMaster(id) {
    var w=store.study.vocabGame.wrongBook.find(function(x){return x.id===id;});
    if(!w) return; w.mastered=true; if(typeof save==='function')save(); renderVocabGame();
    if(typeof showToast==='function') showToast('已标记为掌握');
}

function vgWrongDelete(id) {
    if(!confirm('删除这条错题记录？')) return;
    store.study.vocabGame.wrongBook=store.study.vocabGame.wrongBook.filter(function(x){return x.id!==id;});
    if(typeof save==='function')save(); renderVocabGame();
}

function vgWrongPractice() {
    var wb=store.study.vocabGame.wrongBook.filter(function(w){return !w.mastered;});
    if(wb.length===0){if(typeof showToast==='function')showToast('没有错题');return;}
    // 用错题生成卡片练习
    var book=_getBook();
    if(!book){if(typeof showToast==='function')showToast('请先选择词书');return;}
    var wrongWords=wb.map(function(w){return book.words.find(function(bw){return bw.word===w.word;});}).filter(Boolean);
    if(wrongWords.length===0){if(typeof showToast==='function')showToast('错题词汇不在当前词书中');return;}
    vgState.cardSession={words:wrongWords,index:0,known:0,unknown:0,flipped:false,done:false};
    vgState.view='card'; renderVocabGame();
}

// ==================== 全局暴露 ====================
window.renderVocabGame = renderVocabGame;
window.vgOpenFromChat = vgOpenFromChat;
window.vgOpenFromStudy = vgOpenFromStudy;
window.vgStartGame = vgStartGame;
window.vgBack = vgBack;
window.vgPickContact = vgPickContact;
window.vgPickBook = vgPickBook;
window.vgSelectBookDirect = vgSelectBookDirect;
window.vgFlipCard = vgFlipCard;
window.vgCardAnswer = vgCardAnswer;
window.vgCardSpeak = vgCardSpeak;
window.vgSpellType = vgSpellType;
window.vgSpellBackspace = vgSpellBackspace;
window.vgSpellHint = vgSpellHint;
window.vgSpellSubmit = vgSpellSubmit;
window.vgMatchSelect = vgMatchSelect;
window.vgFlashAnswer = vgFlashAnswer;
window.vgPKAnswer = vgPKAnswer;
window.vgContactAsk = vgContactAsk;
window.vgChatSend = vgChatSend;
window.vgTeachWord = vgTeachWord;
window.vgTeachChat = vgTeachChat;
window.vgOpenWrongBook = vgOpenWrongBook;
window.vgWrongNote = vgWrongNote;
window.vgWrongMaster = vgWrongMaster;
window.vgWrongDelete = vgWrongDelete;
window.vgWrongPractice = vgWrongPractice;
window.vgState = vgState;

})();

