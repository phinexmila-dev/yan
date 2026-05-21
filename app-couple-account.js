// ====== 情侣账号模块 (app-couple-account.js) ======
// 底部Tab导航切换三大功能：照片墙 | 情侣日记 | 社交账号
// UI规范：黑白灰、圆角、SVG图标、无emoji无渐变
// 联系人主动性：联系人会主动上传照片、写日记、评论、发帖，基于人设和情景

(function() {
    'use strict';

    // ====== SVG 图标库 ======
    const SVG = {
        back: '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>',
        x: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        plus: '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        edit: '<svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
        trash: '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
        refresh: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>',
        upload: '<svg viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>',
        users: '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
        wand: '<svg viewBox="0 0 24 24"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h0"/><path d="M17.8 6.2L19 5"/><path d="M11 6.2L9.7 5"/><path d="M11 11.8L9.7 13"/><line x1="12" y1="22" x2="2" y2="12"/></svg>',
        image: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        images: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
        book: '<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>',
        at: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/></svg>',
        heart: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>',
        heartFill: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="currentColor"/></svg>',
        msg: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
        repeat: '<svg viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
        more: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
        note: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        sticky: '<svg viewBox="0 0 24 24"><path d="M15.5 3H5a2 2 0 00-2 2v14c0 1.1.9 2 2 2h14a2 2 0 002-2V8.5L15.5 3z"/><polyline points="14 3 14 9 20 9"/></svg>',
        settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
        robot: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>',
        pen: '<svg viewBox="0 0 24 24"><line x1="17" y1="10" x2="3" y2="24"/><path d="M15 2l7 7-10 10H5v-7L15 2z"/></svg>',
        check: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
        send: '<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
        sleep: '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></svg>',
        camera: '<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>',
        clip: '<svg viewBox="0 0 24 24"><path d="M12 2L8 6h3v6H8l4 4 4-4h-3V6h3L12 2z" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="4" y="16" width="16" height="2" rx="1" fill="currentColor" opacity="0.3"/></svg>',
    };

    // ====== 状态 ======
    let caTab = 'photowall'; // photowall | diary | social
    let pwEditing = false;
    let pwPreviewIdx = -1;
    let pwLayout = 'clothesline'; // clothesline(晾衣绳夹子) | grid(网格)
    let diaryEditorOpen = false;
    let diaryEditingId = null;
    let diaryEditorMode = 'solo';
    let socialComposeOpen = false;
    let socialComposeWho = 'user';
    let socialCommentingPostId = null;
    let socialMenuPostId = null;
    let socialSettingsOpen = false;
    let socialComposeImages = [];
    let socialComposeDraft = ''; // [FIX-AI代写丢失] 保存发帖编辑器中的文本，防止renderCouple()重建DOM后丢失
    let aiCommentsGenerating = {};
    let _autoActionFired = false;
    let _autoActionTimer = null;
    let caAutoSettingsOpen = false;

    // ====== 工具 ======
    function _sp() { return typeof getCurrentCoupleSpace === 'function' ? getCurrentCoupleSpace() : null; }
    function _pt(s) { return s ? store.contacts.find(x => x.id === s.partnerId) : null; }
    function _un(p) { return typeof getUserPersonaName === 'function' ? getUserPersonaName(p, store.user.name || '用户') : (store.user.name || '用户'); }
    function _ua(p) { return typeof getUserPersonaAvatar === 'function' ? getUserPersonaAvatar(p) : (store.user.avatar || _ph(50)); }
    function _pn(p) { return p ? p.name : 'TA'; }
    function _pa(p) { return p ? (p.avatar || _ph(50)) : _ph(50); }
    // [FIX-性别称谓v2] 从人设描述中检测性别，计分制：统计男/女关键词命中数，取多的一方
    // 移除了"她/他/cute/美丽/帅"等容易在描述第三方时误判的词
    function _detectGender(personaDesc) {
        if (!personaDesc) return '';
        const femaleRe = /女[性生孩友王]|girl|female|小姐|姐姐|妹妹|公主|女王|少女|女孩|姑娘|夫人|老婆|媳妇|母亲|妈妈|嫂子|婶|阿姨|太太|lady|queen|princess|woman|wife|girlfriend|daughter|sister|miss|mrs/gi;
        const maleRe = /男[性生孩友]|boy|male|先生|哥哥|弟弟|王子|少年|男孩|小伙|老公|丈夫|父亲|爸爸|叔叔|伯伯|大爷|man|king|prince|husband|boyfriend|son|brother/gi;
        const fCount = (personaDesc.match(femaleRe) || []).length;
        const mCount = (personaDesc.match(maleRe) || []).length;
        if (fCount === 0 && mCount === 0) return '';
        if (fCount > mCount) return '女';
        if (mCount > fCount) return '男';
        return ''; // 平局不猜测
    }
    // [FIX-性别称谓] 根据性别返回代词
    function _pronoun(gender) { return gender === '女' ? '她' : gender === '男' ? '他' : 'TA'; }
    // [FIX-性别称谓] 获取联系人和用户的性别信息
    // 优先使用情侣账号设置中手动指定的性别，其次用contact.gender字段，最后从persona检测
    function _getGenderInfo(partner) {
        const ud = _getUD(partner);
        const pd = partner ? (partner.persona || '') : '';
        const space = _sp();
        const ac = space ? (space.socialAccount || {}) : {};
        // 用户性别：优先用账号设置中手动指定的，其次从persona检测
        const userGender = ac.userGender || _detectGender(ud);
        // 联系人性别：优先用账号设置中手动指定的，其次用contact.gender字段，最后从persona检测
        const partnerGender = ac.partnerGender || ((partner && partner.gender) ? (partner.gender === '女' || /女|female/i.test(partner.gender) ? '女' : '男') : _detectGender(pd));
        return { userGender, partnerGender, ud, pd };
    }
    function _ago(ts) {
        const d = Date.now() - ts;
        if (d < 60000) return '刚刚';
        if (d < 3600000) return Math.floor(d/60000) + '分钟前';
        if (d < 86400000) return Math.floor(d/3600000) + '小时前';
        if (d < 2592000000) return Math.floor(d/86400000) + '天前';
        return new Date(ts).toLocaleDateString('zh-CN');
    }
    function _fdate(ts) { return new Date(ts).toLocaleDateString('zh-CN', {year:'numeric',month:'long',day:'numeric'}); }
    function _init(s) {
        if (!s.photoWall) s.photoWall = [];
        if (!s.diaries) s.diaries = [];
        if (!s.socialAccount) s.socialAccount = { name:'', handle:'', avatar:'', bio:'', posts:[] };
        if (!s.autoSettings) s.autoSettings = { autoPhoto:false, autoDiary:false, autoPost:false, autoComment:false, frequency:'medium' };
    }
    function _esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
    function _upd() { return typeof getUserPersonaName === 'function' ? '' : ''; }
    function _getUD(p) {
        if (p && p.settings && p.settings.userPersona) {
            const persona = store.personas.find(pp => pp.id === p.settings.userPersona);
            if (persona && persona.desc) return persona.desc;
        }
        return store.personas[0]?.desc || '';
    }

    // ====== 主入口 ======
    window.renderCoupleAccountModule = function(area, space) {
        if (!space) { coupleViewMode = 'detail'; renderCouple(); return; }
        _init(space);
        const p = _pt(space);
        // 底部Tab导航 + 内容区
        let bodyHTML = '';
        switch(caTab) {
            case 'photowall': bodyHTML = _buildPW(space, p); break;
            case 'diary': bodyHTML = _buildDiary(space, p); break;
            case 'social': bodyHTML = _buildSocial(space, p); break;
        }
        area.innerHTML = `
            <div class="ca-page">
                <div class="ca-top-bar">
                    <div class="ca-back" onclick="coupleViewMode='detail';renderCouple()">${SVG.back}</div>
                    <div class="ca-title">情侣账号</div>
                    <div class="ca-settings-btn" onclick="window._caOpenAutoSet()">${SVG.settings}</div>
                </div>
                <div class="ca-body" id="ca-body">${bodyHTML}</div>
                <div class="ca-tab-bar">
                    <div class="ca-tab ${caTab==='photowall'?'active':''}" onclick="window._caTab('photowall')">
                        ${SVG.images}<span class="ca-tab-label">照片墙</span>
                    </div>
                    <div class="ca-tab ${caTab==='diary'?'active':''}" onclick="window._caTab('diary')">
                        ${SVG.book}<span class="ca-tab-label">日记</span>
                    </div>
                    <div class="ca-tab ${caTab==='social'?'active':''}" onclick="window._caTab('social')">
                        ${SVG.at}<span class="ca-tab-label">社交号</span>
                    </div>
                </div>
            </div>
            ${_buildAutoSettings(space, p)}
        `;
    };

    window._caTab = function(tab) { caTab = tab; renderCouple(); };

    // ====== 自动行为设置面板 ======
    function _buildAutoSettings(space, partner) {
        if (!caAutoSettingsOpen) return '';
        _init(space);
        const as = space.autoSettings;
        const pn = partner ? _pn(partner) : 'TA';
        return `<div class="ca-autoset-overlay show" onclick="window._caCloseAutoSet()">
            <div class="ca-autoset-card" onclick="event.stopPropagation()">
                <div class="ca-autoset-title">${SVG.settings} ${pn}的主动行为设置</div>
                <div class="ca-autoset-desc">控制${pn}是否会自动在情侣账号中做这些事</div>
                <div class="ca-autoset-item">
                    <label><input type="checkbox" id="ca-as-photo" ${as.autoPhoto?'checked':''}> 自动生图放相册</label>
                    <span class="ca-autoset-hint">需要开启AI生图功能</span>
                </div>
                <div class="ca-autoset-item">
                    <label><input type="checkbox" id="ca-as-diary" ${as.autoDiary?'checked':''}> 自动写情侣日记</label>
                </div>
                <div class="ca-autoset-item">
                    <label><input type="checkbox" id="ca-as-post" ${as.autoPost?'checked':''}> 自动发帖</label>
                </div>
                <div class="ca-autoset-item">
                    <label><input type="checkbox" id="ca-as-comment" ${as.autoComment?'checked':''}> 自动留言/评论</label>
                </div>
                <div class="ca-autoset-freq">
                    <div class="ca-autoset-freq-label">频率</div>
                    <div class="ca-autoset-freq-btns">
                        <div class="ca-autoset-freq-btn ${as.frequency==='high'?'active':''}" onclick="window._caSetFreq('high')">高频</div>
                        <div class="ca-autoset-freq-btn ${as.frequency==='medium'?'active':''}" onclick="window._caSetFreq('medium')">中频</div>
                        <div class="ca-autoset-freq-btn ${as.frequency==='low'?'active':''}" onclick="window._caSetFreq('low')">低频</div>
                    </div>
                    <div class="ca-autoset-freq-hint">${{high:'约30分钟~1小时触发一次',medium:'约2~4小时触发一次',low:'约6~12小时触发一次'}[as.frequency]||''}</div>
                </div>
                <div class="ca-autoset-btns">
                    <button class="ca-autoset-btn cancel" onclick="window._caCloseAutoSet()">取消</button>
                    <button class="ca-autoset-btn save" onclick="window._caSaveAutoSet()">保存</button>
                </div>
            </div>
        </div>`;
    }

    window._caOpenAutoSet = function() { caAutoSettingsOpen = true; renderCouple(); };
    window._caCloseAutoSet = function() { caAutoSettingsOpen = false; renderCouple(); };
    window._caSetFreq = function(f) {
        const s = _sp(); if(!s) return; _init(s);
        s.autoSettings.frequency = f; renderCouple();
    };
    window._caSaveAutoSet = function() {
        const s = _sp(); if(!s) return; _init(s);
        s.autoSettings.autoPhoto = !!document.getElementById('ca-as-photo')?.checked;
        s.autoSettings.autoDiary = !!document.getElementById('ca-as-diary')?.checked;
        s.autoSettings.autoPost = !!document.getElementById('ca-as-post')?.checked;
        s.autoSettings.autoComment = !!document.getElementById('ca-as-comment')?.checked;
        // frequency already set by _caSetFreq
        save(); caAutoSettingsOpen = false; renderCouple(); toast('设置已保存');
    };

    // ====== 频率到冷却时间的映射 ======
    function _getCD(frequency) {
        switch(frequency) {
            case 'high':   return { photo: 1800000, diary: 2400000, post: 3000000, comment: 600000 };   // 30m/40m/50m/10m
            case 'low':    return { photo: 21600000, diary: 28800000, post: 43200000, comment: 7200000 }; // 6h/8h/12h/2h
            default:       return { photo: 7200000, diary: 10800000, post: 14400000, comment: 1800000 };  // 2h/3h/4h/30m
        }
    }

    // ====== 联系人主动行为系统 ======
    async function _partnerAutoActions(space, partner) {
        if (!partner || !space) return;
        _currentApiScene = 'couple';
        _init(space);
        const as = space.autoSettings;
        // 如果所有自动行为都关了，直接返回
        if (!as.autoPhoto && !as.autoDiary && !as.autoPost && !as.autoComment) return;

        if (!space._autoLog) space._autoLog = {};
        const now = Date.now();
        const log = space._autoLog;
        const pn = _pn(partner);
        const cd = _getCD(as.frequency);

        // 收集可执行的动作
        const actions = [];

        // 1. 主动AI生图放相册（需要imgGen开启 + 用户开启autoPhoto）
        if (as.autoPhoto && store.imgGen?.enabled && (!log.lastPhoto || now - log.lastPhoto > cd.photo)) {
            actions.push({ type: 'photo', weight: 25 });
        }
        // 2. 主动写日记
        if (as.autoDiary && (!log.lastDiary || now - log.lastDiary > cd.diary)) {
            actions.push({ type: 'diary', weight: 35 });
        }
        // 3. 主动发帖
        if (as.autoPost && (!log.lastPost || now - log.lastPost > cd.post)) {
            actions.push({ type: 'post', weight: 30 });
        }
        // 4. 主动评论用户日记
        const userDiaryNoComment = (space.diaries||[]).find(d => d.author === 'user' && (!d.stickers || !d.stickers.find(s => s.author === 'partner')));
        if (as.autoComment && userDiaryNoComment && (!log.lastComment || now - log.lastComment > cd.comment)) {
            actions.push({ type: 'comment', weight: 40 });
        }

        if (actions.length === 0) return;

        // 加权随机选1-2个动作
        const totalWeight = actions.reduce((s, a) => s + a.weight, 0);
        const picked = [];
        const maxActions = Math.random() < 0.3 ? 2 : 1; // 30%概率做两件事

        for (let i = 0; i < maxActions && actions.length > 0; i++) {
            let r = Math.random() * totalWeight;
            for (let j = 0; j < actions.length; j++) {
                r -= actions[j].weight;
                if (r <= 0) {
                    picked.push(actions[j]);
                    actions.splice(j, 1);
                    break;
                }
            }
        }

        // 依次执行
        for (const act of picked) {
            try {
                switch (act.type) {
                    case 'photo':
                        log.lastPhoto = now;
                        save();
                        await _autoPartnerGenPhoto(space, partner);
                        break;
                    case 'diary':
                        log.lastDiary = now;
                        save();
                        await _autoPartnerWriteDiary(space, partner);
                        break;
                    case 'post':
                        log.lastPost = now;
                        save();
                        await _autoPartnerMakePost(space, partner);
                        break;
                    case 'comment':
                        log.lastComment = now;
                        save();
                        await _partnerAutoComment(space, partner);
                        break;
                }
                // 动作间隔2-4秒，模拟真实感
                await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
            } catch (e) { console.error('联系人主动行为失败:', act.type, e); }
        }
    }

    // 联系人主动AI生图
    async function _autoPartnerGenPhoto(space, partner) {
        if (!store.imgGen?.enabled) return;
        const pn = _pn(partner), un = _un(partner), ud = _getUD(partner);
        const rc = (store.chats[partner.id]||[]).slice(-15).map(m=>(m.sender==='me'?un:pn)+': '+(m.content||'').substring(0,60)).join('\n');
        toast(pn+'突然想画一张图给你...');
        try {
            const pr = await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${partner.persona||'无'}）。你想主动给伴侣${un}画一张图放到你们的情侣相册里。根据最近聊天内容和你的性格，想一个适合的画面。要求：
1. 符合${pn}的性格和审美
2. 和你们最近的互动相关
3. 输出格式：第一行是英文画图prompt（详细描述画面，适合AI生图），第二行是中文备注说明（20字以内）
4. 只输出这两行`},
                {role:'user',content:`最近聊天：\n${rc||'暂无'}\n\n想一个画面吧。`}
            ], 0.9);
            const lines = pr.choices[0].message.content.trim().split('\n').filter(l=>l.trim());
            const imgPrompt = lines[0] || 'A romantic couple illustration, warm colors';
            const caption = lines[1] || pn+'画的';
            const imgUrl = await callImgGenAPI(imgPrompt);
            if (imgUrl) {
                _init(space);
                space.photoWall.push({ id:'pw_'+Date.now(), src:imgUrl, uploader:'partner', time:Date.now(), caption:caption, aiGenerated:true, imgPrompt:imgPrompt });
                save(); renderCouple(); toast(pn+'画了一张图放进了你们的相册');
            }
        } catch(e) { console.error('联系人自动生图失败:', e); }
    }

    // 联系人主动写日记（自动版）
    async function _autoPartnerWriteDiary(space, partner) {
        const pn = _pn(partner), un = _un(partner), ud = _getUD(partner);
        const rc = (store.chats[partner.id]||[]).slice(-20).map(m=>(m.sender==='me'?un:pn)+': '+(m.content||'').substring(0,80)).join('\n');
        const ed = (space.diaries||[]).slice(-3).map(d=>(d.content||'').substring(0,50)).join('; ');
        toast(pn+'偷偷写了一篇日记...');
        try {
            const r = await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${partner.persona||'无'}）。你要主动写一篇情侣日记，记录和伴侣${un}（人设：${ud||'无'}）的恋爱日常。要求：
1. 完全符合${pn}的性格、语气和说话方式，不能OOC
2. 从${pn}的视角来写，记录你们之间发生的事
3. 语气自然，可以撒娇、吐槽、甜蜜等
4. 200-400字，有细节画面感
5. 根据最近聊天内容写，不要和已有日记重复
6. 已有日记摘要：${ed||'无'}
7. 只输出日记内容`},
                {role:'user',content:`最近聊天：\n${rc||'暂无聊天记录'}\n\n请写一篇日记。`}
            ], 0.9);
            const ct = r.choices[0].message.content.trim();
            _init(space);
            space.diaries.push({id:'dy_'+Date.now(), author:'partner', content:ct, mode:'solo', time:Date.now(), stickers:[]});
            save(); renderCouple(); toast(pn+'写了一篇新日记，快去看看~');
        } catch(e) { console.error('联系人自动写日记失败:', e); }
    }

    // 联系人主动发帖（自动版）
    async function _autoPartnerMakePost(space, partner) {
        const pn = _pn(partner), un = _un(partner), ud = _getUD(partner);
        const rc = (store.chats[partner.id]||[]).slice(-10).map(m=>(m.sender==='me'?un:pn)+': '+(m.content||'').substring(0,50)).join('\n');
        toast(pn+'在你们的情侣号发了一条新帖子~');
        try {
            const r = await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${partner.persona||'无'}）。你要主动在你和伴侣${un}的情侣社交账号上发一条帖子。注意这是你们两个人共用的账号，不是你自己的账号。要求：
1. 完全符合${pn}的性格和说话方式，不能OOC
2. 分享你们的恋爱日常，可以是甜蜜、日常、吐槽、秀恩爱等
3. 可以@${un}或提到${un}
4. 根据最近聊天内容来写
5. 50-200字，语气自然
6. 只输出帖子内容`},
                {role:'user',content:`最近聊天：\n${rc||'暂无'}\n发一条帖子。`}
            ], 0.95);
            const ct = r.choices[0].message.content.trim();
            _init(space); const ac = space.socialAccount; if(!ac.posts) ac.posts = [];
            const np = {id:'po_'+Date.now(), content:ct, images:[], postedBy:'partner', time:Date.now(), likes:Math.floor(Math.random()*50)+5, reposts:Math.floor(Math.random()*10), comments:[], userLiked:false};
            ac.posts.push(np); save(); renderCouple();
            // 自动生成网友评论
            setTimeout(()=>{ window._snGenCmts(np.id); }, 2000);
            // 联系人自己也评论
            setTimeout(()=>{ _partnerAutoReplyPost(space, np.id); }, 4000);
        } catch(e) { console.error('联系人自动发帖失败:', e); }
    }


    // ============================================================
    //  1. 照片墙 - 晾衣绳夹子样式
    // ============================================================
    function _buildPW(space, partner) {
        const photos = space.photoWall || [];
        const un = _un(partner), pn = _pn(partner);
        let grid = '';
        if (photos.length > 0) {
            // 晾衣绳夹子样式：照片像被可爱的小夹子夹着挂在绳子上
            grid = `<div class="pw-clothesline">`;
            // 每行3张照片一条绳子
            const rowSize = 3;
            for (let r = 0; r < Math.ceil(photos.length / rowSize); r++) {
                grid += `<div class="pw-rope-row">`;
                grid += `<div class="pw-rope"></div>`;
                grid += `<div class="pw-rope-photos">`;
                for (let c = r * rowSize; c < Math.min((r + 1) * rowSize, photos.length); c++) {
                    const ph = photos[c];
                    const tiltDeg = (c % 5 - 2) * 4; // 随机倾斜 -8到8度
                    grid += `<div class="pw-hanging-photo" style="transform:rotate(${tiltDeg}deg)" onclick="window._pwPrev(${c})">
                        <div class="pw-clip"></div>
                        <div class="pw-clip-string"></div>
                        <div class="pw-photo-frame">
                            <img src="${ph.src}" loading="lazy">
                            <div class="pw-photo-tag">${ph.uploader==='user'?un:pn}</div>
                            <div class="pw-photo-del" onclick="event.stopPropagation();window._pwDel(${c})">${SVG.x}</div>
                        </div>
                    </div>`;
                }
                grid += `</div></div>`;
            }
            grid += '</div>';
        } else {
            grid = `<div class="pw-empty">${SVG.images}<p>还没有照片<br>上传第一张开始记录</p></div>`;
        }
        return `<div class="pw-wrap">
            <div class="pw-stat"><div class="pw-stat-num">${photos.length}</div><div class="pw-stat-label">张照片</div></div>
            <div class="pw-toolbar">
                <button class="ca-btn primary" onclick="window._pwUp('user')">${SVG.upload} 上传</button>
                <button class="ca-btn" onclick="window._pwPartnerUp()">${SVG.camera} ${pn}上传</button>
                <button class="ca-btn" onclick="window._pwPartnerAiGen()">${SVG.wand} ${pn}生图</button>
                <button class="ca-btn sm" onclick="window._pwTogEdit()">${pwEditing?SVG.check:SVG.edit}</button>
            </div>
            ${grid}
        </div>
        ${_buildPwPreview(photos, partner)}`;
    }

    function _buildPwPreview(photos, partner) {
        if (pwPreviewIdx < 0 || pwPreviewIdx >= photos.length) return '';
        const ph = photos[pwPreviewIdx];
        const un = _un(partner), pn = _pn(partner);
        return `<div class="pw-preview show">
            <div class="pw-preview-close" onclick="window._pwClosePrev()">${SVG.x}</div>
            <img class="main" src="${ph.src}">
            <div class="pw-preview-meta">
                <div class="name">${ph.uploader==='user'?un:pn}</div>
                <div>${_fdate(ph.time)}</div>
                ${ph.caption?'<div class="cap">'+_esc(ph.caption)+'</div>':''}
            </div>
            <div class="pw-preview-btns">
                <button class="pw-preview-btn" onclick="window._pwCaption(${pwPreviewIdx})">${SVG.edit} 备注</button>
                <button class="pw-preview-btn del" onclick="window._pwDel(${pwPreviewIdx})">${SVG.trash} 删除</button>
            </div>
        </div>`;
    }

    window._pwTogEdit = function() { pwEditing = !pwEditing; renderCouple(); };
    window._pwPrev = function(i) { if(pwEditing)return; pwPreviewIdx=i; renderCouple(); };
    window._pwClosePrev = function() { pwPreviewIdx=-1; renderCouple(); };

    window._pwUp = function(who) {
        openImgUploadModal('上传照片', (img) => {
            const s = _sp(); if(!s) return; _init(s);
            s.photoWall.push({ id:'pw_'+Date.now(), src:img, uploader:who, time:Date.now(), caption:'', aiGenerated:false });
            save(); renderCouple(); toast('已添加');
        });
    };
    // 联系人上传 - 弹出上传弹窗让用户代联系人上传真实照片
    window._pwPartnerUp = function() {
        const s = _sp(); if(!s) return; const p = _pt(s);
        openImgUploadModal(_pn(p)+'上传照片', (img) => {
            _init(s);
            s.photoWall.push({ id:'pw_'+Date.now(), src:img, uploader:'partner', time:Date.now(), caption:'', aiGenerated:false });
            save(); renderCouple(); toast(_pn(p)+'的照片已添加');
        });
    };

    // 联系人AI生图并放入相册
    window._pwPartnerAiGen = async function() {
        const s = _sp(); if(!s) return; const p = _pt(s); if(!p) return toast('找不到联系人');
        if(!store.imgGen?.enabled) return toast('请先在设置中开启AI生图功能', 'error');
        const pn = _pn(p), un = _un(p), ud = _getUD(p);
        const rc = (store.chats[p.id]||[]).slice(-15).map(m=>(m.sender==='me'?un:pn)+': '+(m.content||'').substring(0,60)).join('\n');
        toast(pn+'正在构思要画什么...');
        try {
            // 先让联系人决定画什么
            const pr = await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${p.persona||'无'}）。你想给伴侣${un}画一张图放到你们的情侣相册里。根据最近聊天内容和你的性格，想一个适合的画面。要求：
1. 符合${pn}的性格和审美
2. 和你们最近的互动相关
3. 输出格式：第一行是英文画图prompt（详细描述画面，适合AI生图），第二行是中文备注说明（20字以内，解释为什么画这个）
4. 只输出这两行`},
                {role:'user',content:`最近聊天：\n${rc||'暂无'}\n\n想一个画面吧。`}
            ], 0.9);
            const lines = pr.choices[0].message.content.trim().split('\n').filter(l=>l.trim());
            const imgPrompt = lines[0] || 'A romantic couple illustration, warm colors, soft lighting';
            const caption = lines[1] || pn+'画的';
            toast(pn+'正在画图...');
            // 调用AI生图
            const imgUrl = await callImgGenAPI(imgPrompt);
            if(imgUrl) {
                _init(s);
                s.photoWall.push({ id:'pw_'+Date.now(), src:imgUrl, uploader:'partner', time:Date.now(), caption:caption, aiGenerated:true, imgPrompt:imgPrompt });
                save(); renderCouple(); toast(pn+'画了一张图放进相册了');
            } else { toast('生图失败，请检查生图设置','error'); }
        } catch(e) { console.error('联系人AI生图失败:',e); toast(pn+'画图失败了','error'); }
    };

    window._pwDel = function(i) {
        showConfirm('删除照片','确定删除这张照片吗？',()=>{
            const s=_sp();if(!s)return; s.photoWall.splice(i,1); pwPreviewIdx=-1; save(); renderCouple(); toast('已删除');
        });
    };
    window._pwCaption = function(i) {
        const s=_sp();if(!s)return; const ph=s.photoWall[i];
        showPromptModal('编辑备注:', ph.caption||'').then(function(v) {
            if(v!==null){ph.caption=v;save();renderCouple();}
        });
    };

    // ============================================================
    //  2. 情侣日记
    //  联系人主动写日记、主动评论；一起写日记有发送按钮
    // ============================================================
    function _buildDiary(space, partner) {
        const ds = space.diaries||[];
        const un = _un(partner), pn = _pn(partner);
        const uav = _ua(partner), pav = _pa(partner);
        let list = '';
        if (ds.length > 0) {
            ds.slice().reverse().forEach(d => {
                const isC = d.mode==='collab';
                const aav = d.author==='user'?uav:pav;
                const an = d.author==='user'?un:pn;
                let body = '';
                if(isC && d.sections){
                    d.sections.forEach(sec => {
                        const cls = sec.author==='user'?'user':'partner';
                        const nm = sec.author==='user'?un:pn;
                        body += `<div class="dy-section ${cls}"><div class="dy-section-name">${nm}</div>${_esc(sec.content)}</div>`;
                    });
                } else { body = _esc(d.content||''); }
                // 便签（可拖动、可编辑）
                let stks = '';
                if(d.stickers && d.stickers.length > 0){
                    stks = '<div class="dy-stickers">';
                    d.stickers.forEach((st,si)=>{
                        const sn = st.author==='user'?un:pn;
                        const posStyle = (st.x != null && st.y != null) ? 'left:'+st.x+'px;top:'+st.y+'px;position:absolute;' : '';
                        stks += `<div class="dy-sticker" data-did="${d.id}" data-si="${si}" style="${posStyle}"
                            onmousedown="window._dyStkDragStart(event)" ontouchstart="window._dyStkDragStart(event)">
                            <span class="dy-sticker-who">${sn}</span>
                            <div class="dy-sticker-text">${_esc(st.text)}</div>
                            <div class="dy-sticker-actions">
                                <div class="dy-sticker-edit" onclick="event.stopPropagation();window._dyEditStk('${d.id}',${si})" title="编辑">${SVG.edit}</div>
                                <div class="dy-sticker-rm" onclick="event.stopPropagation();window._dyDelStk('${d.id}',${si})" title="删除">${SVG.x}</div>
                            </div>
                        </div>`;
                    });
                    stks += '</div>';
                }
                // 联系人写的日记显示重新生成按钮
                const isPartnerDiary = d.author==='partner';
                const regenBtn = isPartnerDiary ? `<div class="dy-act" onclick="window._dyRegenPartner('${d.id}')">${SVG.refresh} 重新生成</div>` : '';
                list += `<div class="dy-card">
                    <div class="dy-card-head">
                        <img class="dy-card-avatar" src="${aav}">
                        <div class="dy-card-info">
                            <div class="dy-card-author">${an}${isC?'<span class="dy-collab-tag">'+SVG.pen+' 合写</span>':''}</div>
                            <div class="dy-card-date">${_fdate(d.time)}</div>
                        </div>
                    </div>
                    <div class="dy-card-body">${body}${stks}</div>
                    <div class="dy-card-acts">
                        <div class="dy-act" onclick="window._dyStk('${d.id}','user')">${SVG.sticky} 我留言</div>
                        <div class="dy-act" onclick="window._dyPartnerStk('${d.id}')">${SVG.msg} 手动生成留言</div>
                        ${regenBtn}
                        <div class="dy-act" onclick="window._dyEdit('${d.id}')">${SVG.edit}</div>
                        <div class="dy-act" onclick="window._dyDel('${d.id}')">${SVG.trash}</div>
                    </div>
                </div>`;
            });
        } else {
            list = `<div class="dy-empty">${SVG.book}<p>还没有日记<br>写下第一篇恋爱日记吧</p></div>`;
        }
        return `<div class="dy-wrap">
            <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;">
                <button class="ca-btn" onclick="window._dyNew()">${SVG.plus} 写日记</button>
                <button class="ca-btn" onclick="window._dyPartnerWrite()">${SVG.pen} ${pn}写日记</button>
                <button class="ca-btn" onclick="window._dyAiWrite()">${SVG.sleep} 偷个小懒</button>
            </div>
            <div class="dy-list">${list}</div>
        </div>${_buildDyEditor(space, partner)}`;
    }

    function _buildDyEditor(space, partner) {
        if(!diaryEditorOpen) return '';
        const un=_un(partner), pn=_pn(partner);
        const ex = diaryEditingId?(space.diaries||[]).find(d=>d.id===diaryEditingId):null;
        const ct = ex?(ex.content||''):'';
        const cp = ex&&ex.sections&&ex.sections.length>1?ex.sections[1].content:'';
        return `<div class="dy-editor-overlay show" onclick="window._dyCloseEd()">
            <div class="dy-editor-sheet" onclick="event.stopPropagation()">
                <div class="dy-editor-header">
                    <div class="dy-editor-header-left" onclick="window._dyCloseEd()">${SVG.x}</div>
                    <div class="dy-editor-title">${ex?'编辑日记':'写新日记'}</div>
                    <button class="dy-editor-save-top" onclick="window._dySave()">保存</button>
                </div>
                <div class="dy-editor-tabs">
                    <div class="dy-editor-tab ${diaryEditorMode==='solo'?'active':''}" onclick="window._dyMode('solo')">独自写</div>
                    <div class="dy-editor-tab ${diaryEditorMode==='collab'?'active':''}" onclick="window._dyMode('collab')">一起写</div>
                </div>
                ${diaryEditorMode==='solo'?`
                    <textarea class="dy-editor-ta" id="dy-ta" placeholder="记录今天的恋爱日常...不超过500字" maxlength="500">${_esc(ct).replace(/<br>/g,'\n')}</textarea>
                    <div class="dy-counter" id="dy-cnt">${ct.length}/500</div>
                `:`
                    <div style="font-size:12px;color:#666;margin-bottom:4px;">${un} 的部分：</div>
                    <textarea class="dy-editor-ta" id="dy-ta-u" placeholder="${un}写的部分..." maxlength="500" style="min-height:100px;">${_esc(ct).replace(/<br>/g,'\n')}</textarea>
                    <div class="dy-collab-send-row">
                        <button class="dy-collab-send-btn" onclick="window._dyCollabSend()">
                            ${SVG.send} 发送给${pn}接着写
                        </button>
                    </div>
                    <div style="font-size:12px;color:#999;margin:8px 0 4px;">${pn} 的部分：</div>
                    <textarea class="dy-editor-ta" id="dy-ta-p" placeholder="${pn}接着写的内容会显示在这里..." maxlength="500" style="min-height:100px;" readonly>${_esc(cp).replace(/<br>/g,'\n')}</textarea>
                `}
            </div>
        </div>`;
    }

    window._dyNew = function() { diaryEditingId=null; diaryEditorMode='solo'; diaryEditorOpen=true; renderCouple();
        setTimeout(()=>{ const t=document.getElementById('dy-ta'); if(t){t.focus();t.oninput=()=>{const c=document.getElementById('dy-cnt');if(c){c.textContent=t.value.length+'/500';c.className='dy-counter'+(t.value.length>500?' over':'');}};} },100);
    };
    window._dyMode = function(m) { diaryEditorMode=m; renderCouple(); };
    window._dyCloseEd = function() { diaryEditorOpen=false; diaryEditingId=null; renderCouple(); };

    // 一起写日记 - 用户写完点发送，联系人API接着写
    window._dyCollabSend = async function() {
        const s=_sp();if(!s)return;const p=_pt(s);if(!p)return toast('找不到联系人');
        const tu=document.getElementById('dy-ta-u');if(!tu)return;
        const txu=tu.value.trim();if(!txu)return toast('请先写你的部分');
        const pn=_pn(p),un=_un(p),ud=_getUD(p);
        toast(pn+'正在接着写...');
        try{
            const rc=(store.chats[p.id]||[]).slice(-10).map(m=>(m.sender==='me'?un:pn)+': '+(m.content||'').substring(0,60)).join('\n');
            const r=await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${p.persona||'无'}）。你的伴侣${un}（人设：${ud||'无'}）正在和你一起写情侣日记，TA已经写好了TA的部分。现在轮到你接着写你的部分。要求：
1. 符合你(${pn})的性格和说话方式，不能OOC
2. 和${un}写的内容自然衔接，但是从你的视角来记录
3. 语气亲密自然，可以有撒娇、吐槽等
4. 100-300字
5. 只输出你的日记内容`},
                {role:'user',content:`${un}写的部分：\n${txu}\n\n最近聊天参考：\n${rc||'暂无'}\n\n现在请你(${pn})接着写你的部分。`}
            ],0.9);
            const rp=r.choices[0].message.content.trim();
            const tp=document.getElementById('dy-ta-p');
            if(tp){tp.value=rp;}
            toast(pn+'写好了');
        }catch(e){toast(pn+'写日记失败','error');}
    };

    window._dySave = function() {
        const s=_sp();if(!s)return;_init(s);const p=_pt(s);
        if(diaryEditorMode==='solo'){
            const t=document.getElementById('dy-ta');if(!t)return;const tx=t.value.trim();
            if(!tx)return toast('内容不能为空'); if(tx.length>500)return toast('超过500字限制');
            if(diaryEditingId){const d=s.diaries.find(x=>x.id===diaryEditingId);if(d){d.content=tx;d.mode='solo';d.sections=null;}}
            else{s.diaries.push({id:'dy_'+Date.now(),author:'user',content:tx,mode:'solo',time:Date.now(),stickers:[]});}
        } else {
            const tu=document.getElementById('dy-ta-u'),tp=document.getElementById('dy-ta-p');if(!tu||!tp)return;
            const txu=tu.value.trim(),txp=tp.value.trim();
            if(!txu&&!txp)return toast('至少写一段');if(txu.length>500||txp.length>500)return toast('每段不超过500字');
            if(diaryEditingId){const d=s.diaries.find(x=>x.id===diaryEditingId);if(d){d.mode='collab';d.content=txu;d.sections=[{author:'user',content:txu},{author:'partner',content:txp}];}}
            else{s.diaries.push({id:'dy_'+Date.now(),author:'user',content:txu,mode:'collab',sections:[{author:'user',content:txu},{author:'partner',content:txp}],time:Date.now(),stickers:[]});}
        }
        save();diaryEditorOpen=false;diaryEditingId=null;renderCouple();toast('日记已保存');
    };
    window._dyEdit = function(id) { const s=_sp();if(!s)return;const d=(s.diaries||[]).find(x=>x.id===id);if(!d)return;diaryEditingId=id;diaryEditorMode=d.mode||'solo';diaryEditorOpen=true;renderCouple(); };
    window._dyDel = function(id) { showConfirm('删除日记','确定？',()=>{const s=_sp();if(!s)return;s.diaries=(s.diaries||[]).filter(x=>x.id!==id);save();renderCouple();toast('已删除');}); };
    window._dyStk = function(did,who) {
        showPromptModal('写一条留言:', '', {multiline: true}).then(function(tx) {
            if(!tx||!tx.trim())return;
            const s=_sp();if(!s)return;const d=(s.diaries||[]).find(x=>x.id===did);if(!d)return;
            if(!d.stickers)d.stickers=[];d.stickers.push({author:who,text:tx.trim(),time:Date.now()});save();renderCouple();toast('留言已贴上');
            // 用户留言后，联系人主动回复用户的留言
            if(who==='user') {
                setTimeout(()=>{ _partnerReplyToUserSticker(s, did, tx.trim()); }, 2000);
            }
        });
    };
    window._dyDelStk = function(did,si) { const s=_sp();if(!s)return;const d=(s.diaries||[]).find(x=>x.id===did);if(!d||!d.stickers)return;d.stickers.splice(si,1);save();renderCouple(); };

    // 编辑便签留言
    window._dyEditStk = function(did,si) {
        const s=_sp();if(!s)return;
        const d=(s.diaries||[]).find(x=>x.id===did);if(!d||!d.stickers||!d.stickers[si])return;
        const st=d.stickers[si];
        showPromptModal('编辑留言:', st.text, {multiline: true}).then(function(tx) {
            if(tx===null)return; // 取消
            if(!tx.trim()){toast('留言不能为空');return;}
            st.text=tx.trim();
            save();renderCouple();toast('留言已更新');
        });
    };

    // 便签拖动逻辑（支持 touch 和 mouse）
    let _stkDrag = null; // { el, did, si, startX, startY, origX, origY, moved }
    window._dyStkDragStart = function(e) {
        // 不拦截按钮点击（编辑、删除）
        if(e.target.closest('.dy-sticker-edit')||e.target.closest('.dy-sticker-rm')||e.target.closest('.dy-sticker-actions'))return;
        const stkEl = e.target.closest('.dy-sticker');
        if(!stkEl) return;
        const did = stkEl.dataset.did;
        const si = parseInt(stkEl.dataset.si);
        const touch = e.touches ? e.touches[0] : e;
        const rect = stkEl.parentElement.getBoundingClientRect();
        const stkRect = stkEl.getBoundingClientRect();
        _stkDrag = {
            el: stkEl,
            did: did,
            si: si,
            startX: touch.clientX,
            startY: touch.clientY,
            origX: stkRect.left - rect.left,
            origY: stkRect.top - rect.top,
            moved: false
        };
        stkEl.style.zIndex = '10';
        stkEl.style.transition = 'none';
        // 如果便签还没有绝对定位，先设置
        if(stkEl.style.position !== 'absolute') {
            stkEl.style.position = 'absolute';
            stkEl.style.left = _stkDrag.origX + 'px';
            stkEl.style.top = _stkDrag.origY + 'px';
        }
        // 不在这里preventDefault，让click事件正常触发
    };
    document.addEventListener('mousemove', function(e){_dyStkDragMove(e);});
    document.addEventListener('touchmove', function(e){_dyStkDragMove(e);}, {passive:false});
    function _dyStkDragMove(e) {
        if(!_stkDrag) return;
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - _stkDrag.startX;
        const dy = touch.clientY - _stkDrag.startY;
        if(Math.abs(dx)>3||Math.abs(dy)>3) _stkDrag.moved = true;
        if(_stkDrag.moved){
            _stkDrag.el.style.left = (_stkDrag.origX + dx) + 'px';
            _stkDrag.el.style.top = (_stkDrag.origY + dy) + 'px';
            if(e.cancelable) e.preventDefault();
        }
    }
    document.addEventListener('mouseup', function(e){_dyStkDragEnd(e);});
    document.addEventListener('touchend', function(e){_dyStkDragEnd(e);});
    function _dyStkDragEnd(e) {
        if(!_stkDrag) return;
        const drag = _stkDrag;
        _stkDrag = null;
        drag.el.style.zIndex = '';
        drag.el.style.transition = '';
        if(drag.moved) {
            // 保存位置到数据
            const s=_sp();if(!s)return;
            const d=(s.diaries||[]).find(x=>x.id===drag.did);
            if(d&&d.stickers&&d.stickers[drag.si]){
                d.stickers[drag.si].x = parseInt(drag.el.style.left)||0;
                d.stickers[drag.si].y = parseInt(drag.el.style.top)||0;
                save();
            }
        }
    }

    // 手动生成联系人留言（原AI留言，改为"手动生成留言"）
    window._dyPartnerStk = async function(did) {
        const s=_sp();if(!s)return;const p=_pt(s);if(!p)return toast('找不到联系人');
        const d=(s.diaries||[]).find(x=>x.id===did);if(!d)return;
        const pn=_pn(p),un=_un(p);
        const dc=d.mode==='collab'&&d.sections?d.sections.map(sec=>(sec.author==='user'?un:pn)+': '+sec.content).join('\n'):d.content;
        toast(pn+'正在写留言...');
        try{
            const r=await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${p.persona||'无'}）。伴侣${un}的日记上需要你写一条便签留言。要求：
1. 符合${pn}的性格和说话方式，不能OOC
2. 语气自然亲密，可以是夸赞、吐槽、撒娇、表达爱意
3. 要根据日记内容来回应，不能牛头不对马嘴
4. 20-50字
5. 只输出留言内容`},
                {role:'user',content:`日记内容：\n${dc}`}
            ],0.85);
            const rp=r.choices[0].message.content.trim();if(!d.stickers)d.stickers=[];
            d.stickers.push({author:'partner',text:rp,time:Date.now()});save();renderCouple();toast(pn+'的留言已贴上');
        }catch(e){toast('留言生成失败','error');}
    };

    // 联系人主动写日记
    window._dyPartnerWrite = async function() {
        const s=_sp();if(!s)return;const p=_pt(s);if(!p)return toast('找不到联系人');
        const pn=_pn(p),un=_un(p),ud=_getUD(p);
        const rc=(store.chats[p.id]||[]).slice(-20).map(m=>(m.sender==='me'?un:pn)+': '+(m.content||'').substring(0,80)).join('\n');
        const ed=(s.diaries||[]).slice(-3).map(d=>(d.content||'').substring(0,50)).join('; ');
        toast(pn+'正在写日记...');
        try{
            const r=await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${p.persona||'无'}）。你要主动写一篇情侣日记，记录和伴侣${un}（人设：${ud||'无'}）的恋爱日常。要求：
1. 完全符合${pn}的性格、语气和说话方式，不能OOC
2. 从${pn}的视角来写，记录你们之间发生的事
3. 语气自然，可以撒娇、吐槽、甜蜜等，符合角色性格
4. 200-400字，有细节画面感
5. 根据最近聊天内容写，不要和已有日记重复
6. 已有日记摘要：${ed||'无'}
7. 只输出日记内容`},
                {role:'user',content:`最近聊天：\n${rc||'暂无聊天记录'}\n\n请写一篇日记。`}
            ],0.9);
            const ct=r.choices[0].message.content.trim();_init(s);
            s.diaries.push({id:'dy_'+Date.now(),author:'partner',content:ct,mode:'solo',time:Date.now(),stickers:[]});
            save();renderCouple();toast(pn+'写了一篇日记');
            // 联系人写完日记后主动留言评论
            setTimeout(()=>{ _partnerAutoComment(s, p); }, 2000);
        }catch(e){toast(pn+'写日记失败','error');}
    };

    // 重新生成联系人日记
    window._dyRegenPartner = async function(id) {
        const s=_sp();if(!s)return;const p=_pt(s);if(!p)return toast('找不到联系人');
        const d=(s.diaries||[]).find(x=>x.id===id);if(!d||d.author!=='partner')return toast('只能重新生成联系人的日记');
        const pn=_pn(p),un=_un(p),ud=_getUD(p);
        const rc=(store.chats[p.id]||[]).slice(-20).map(m=>(m.sender==='me'?un:pn)+': '+(m.content||'').substring(0,80)).join('\n');
        const ed=(s.diaries||[]).filter(x=>x.id!==id).slice(-3).map(x=>(x.content||'').substring(0,50)).join('; ');
        toast('正在重新生成...');
        try{
            const r=await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${p.persona||'无'}）。重新写一篇情侣日记，记录和伴侣${un}（人设：${ud||'无'}）的恋爱日常。要求：
1. 完全符合${pn}的性格和说话方式，不能OOC
2. 从${pn}的视角来写
3. 200-400字，语气自然亲密
4. 不要和已有日记重复。已有日记：${ed||'无'}
5. 只输出日记内容`},
                {role:'user',content:`最近聊天：\n${rc||'暂无'}\n\n重新写一篇不一样的日记。`}
            ],0.95);
            const ct=r.choices[0].message.content.trim();
            d.content=ct;d.time=Date.now();d.stickers=[];
            save();renderCouple();toast('已重新生成');
        }catch(e){toast('重新生成失败','error');}
    };

    // 偷个小懒 - 原AI帮写功能
    window._dyAiWrite = async function() {
        const s=_sp();if(!s)return;const p=_pt(s);if(!p)return toast('找不到联系人');
        const pn=_pn(p),un=_un(p),ud=_getUD(p);
        const rc=(store.chats[p.id]||[]).slice(-20).map(m=>(m.sender==='me'?un:pn)+': '+(m.content||'').substring(0,80)).join('\n');
        const ed=(s.diaries||[]).slice(-3).map(d=>(d.content||'').substring(0,50)).join('; ');
        toast('正在帮你偷个小懒...');
        try{
            const r=await API.chatCompletion([{role:'system',content:`帮${un}写一篇情侣日记。要求：记录恋爱日常，朴实自然，不像邮件那么正式，200-500字，语气温暖但不肉麻，根据聊天内容写，有细节画面感，不要和已有日记重复。已有日记摘要：${ed||'无'}。用户人设：${un}(${ud||'无'})。伴侣：${pn}(${p.persona||'无'})。只输出日记内容。`},{role:'user',content:`最近聊天：\n${rc||'暂无聊天记录'}`}],0.9);
            const ct=r.choices[0].message.content.trim();_init(s);
            s.diaries.push({id:'dy_'+Date.now(),author:'user',content:ct,mode:'solo',time:Date.now(),stickers:[]});
            save();renderCouple();toast('日记已生成');
        }catch(e){toast('生成失败','error');}
    };

    // 联系人主动评论用户日记（自动触发）
    async function _partnerAutoComment(space, partner) {
        if(!partner)return;
        const ds=space.diaries||[];
        // 找最近一篇用户写的日记，还没有联系人留言的
        const userDiary = ds.slice().reverse().find(d=>d.author==='user'&&(!d.stickers||d.stickers.length===0||!d.stickers.find(s=>s.author==='partner')));
        if(!userDiary)return;
        const pn=_pn(partner),un=_un(partner);
        const dc=userDiary.content||'';
        try{
            const r=await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${partner.persona||'无'}）。伴侣${un}写了一篇恋爱日记，你要主动给这篇日记写一条便签留言。要求：
1. 符合${pn}的性格和说话方式，不能OOC
2. 根据日记内容来回应，体现你看了日记后的真实反应
3. 可以是夸赞、吐槽、撒娇、心疼、表达爱意等
4. 20-50字
5. 只输出留言内容`},
                {role:'user',content:`日记内容：\n${dc}`}
            ],0.85);
            const rp=r.choices[0].message.content.trim();
            if(!userDiary.stickers)userDiary.stickers=[];
            userDiary.stickers.push({author:'partner',text:rp,time:Date.now()});
            save();renderCouple();
        }catch(e){console.error('联系人自动留言失败:',e);}
    }

    // 联系人回复用户在日记上的留言
    // [FIX-性别称谓] 使用正确的性别代词替代"TA"
    async function _partnerReplyToUserSticker(space, diaryId, userStickerText) {
        const p = _pt(space); if(!p) return;
        const d = (space.diaries||[]).find(x=>x.id===diaryId); if(!d) return;
        const pn = _pn(p), un = _un(p);
        const gi = _getGenderInfo(p);
        const uPr = _pronoun(gi.userGender);
        const dc = d.content || '';
        try {
            const r = await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${p.persona||'无'}）。${un}在一篇情侣日记上写了一条留言，你要回复${uPr}。要求：
1. 用${pn}的语气回复，符合角色性格
2. 针对${un}说的话来回复，要有具体回应
3. 语气亲密自然，可以撒娇、吐槽、表达爱意
4. 10-35字
5. 只输出回复内容，不要加引号`},
                {role:'user',content:`日记内容：${dc.substring(0,200)}\n${un}的留言：${userStickerText}\n用${pn}的语气回复${uPr}。`}
            ], 0.85);
            const rp = r.choices[0].message.content.trim();
            if(!d.stickers) d.stickers = [];
            d.stickers.push({author:'partner', text:rp, time:Date.now()});
            save(); renderCouple();
        } catch(e) { console.error('联系人回复留言失败:', e); }
    }

    // ============================================================
    //  3. 社交账号
    // ============================================================
    function _buildSocial(space, partner) {
        const ac=space.socialAccount||{};
        const ps=ac.posts||[];
        const un=_un(partner),pn=_pn(partner),uav=_ua(partner),pav=_pa(partner);
        const an=ac.name||(un+'&'+pn);
        const ah=ac.handle||('@'+un.replace(/\s/g,''));
        const aav=ac.avatar||uav;
        const ab=ac.bio||'恋爱日常分享号';
        const tl=ps.reduce((s,p)=>s+(p.likes||0),0);
        const tc=ps.reduce((s,p)=>s+((p.comments||[]).length),0);

        let feed='';
        if(ps.length>0){
            ps.slice().reverse().forEach(po=>{feed+=_buildPost(po,ac,partner,un,pn,uav,pav);});
        } else { feed=`<div class="csn-empty">${SVG.at}<p>还没有帖子<br>发一条帖子分享日常吧</p></div>`; }

        return `<div class="csn-wrap">
            <div class="csn-profile">
                <div class="csn-profile-row">
                    <img class="csn-profile-av" src="${aav}">
                    <div class="csn-profile-text">
                        <div class="csn-profile-name">${an}</div>
                        <div class="csn-profile-handle">${ah}</div>
                        <div class="csn-profile-bio">${_esc(ab)}</div>
                    </div>
                    <button class="csn-profile-edit" onclick="window._snOpenSet()">编辑</button>
                </div>
                <div class="csn-profile-stats">
                    <div class="csn-profile-stat"><strong>${ps.length}</strong> 帖子</div>
                    <div class="csn-profile-stat"><strong>${tl}</strong> 获赞</div>
                    <div class="csn-profile-stat"><strong>${tc}</strong> 评论</div>
                </div>
            </div>
            <div class="csn-feed">${feed}</div>
            <div class="csn-fab-group">
                <button class="csn-fab" onclick="window._snOpenComp()">${SVG.plus}</button>
                <button class="csn-fab secondary" onclick="window._snPartnerPost()">${SVG.pen} ${pn}发帖</button>
            </div>
        </div>
        ${_buildComposeOvl(space,partner)}${_buildPostMenu()}${_buildSnSettings(space,partner)}`;
    }

    function _buildPost(po, ac, partner, un, pn, uav, pav) {
        const aav=ac.avatar||uav;
        const an=ac.name||(un+'&'+pn);
        const ah=ac.handle||('@'+un);
        const wl=po.postedBy==='user'?un:pn;
        const liked=po.userLiked||false;
        let imgs='';
        if(po.images&&po.images.length>0){
            const cc=po.images.length===1?'c1':po.images.length===2?'c2':po.images.length===3?'c3':'c4';
            imgs=`<div class="csn-post-imgs ${cc}">`+po.images.map(im=>`<img src="${im}" onclick="window._snPrevImg(this.src)">`).join('')+'</div>';
        }
        let cmts='';
        if(po.comments&&po.comments.length>0){
            cmts='<div class="csn-comments">';
            po.comments.forEach((c,ci)=>{
                const ca=c.isAi?_netizenAv(c.name):(c.who==='user'?uav:(c.who==='partner'?pav:aav));
                const badge=c.type?`<span class="csn-badge">${_badgeLbl(c.type)}</span>`:'';
                cmts+=`<div class="csn-cmt ${c.replyTo?'csn-cmt-reply':''}">
                    <img class="csn-cmt-av" src="${ca}">
                    <div class="csn-cmt-body">
                        <div class="csn-cmt-name">${_esc(c.name)} ${badge} <span class="csn-cmt-time">${_ago(c.time)}</span></div>
                        <div class="csn-cmt-text">${c.replyTo?'<span style="color:#888;">回复 @'+_esc(c.replyTo)+'</span> ':''}${_esc(c.text)}</div>
                        <div class="csn-cmt-acts">
                            <span onclick="window._snReplyCmt('${po.id}',${ci})">回复</span>
                            <span onclick="window._snLikeCmt('${po.id}',${ci})">${c.likes||0} 赞</span>
                        </div>
                    </div>
                </div>`;
            });
            cmts+='</div>';
        }
        const gen=aiCommentsGenerating[po.id];
        const seed=parseInt((po.id||'').replace(/\D/g,'').slice(-6))||1;
        const views=Math.max((po.likes||0)*10+((po.comments||[]).length)*5,Math.floor(seed%10000)+100);

        return `<div class="csn-post" id="post-${po.id}">
            <div class="csn-post-head">
                <img class="csn-post-av" src="${aav}">
                <div class="csn-post-meta">
                    <div class="csn-post-name">${an}</div>
                    <div class="csn-post-sub">${ah} · ${_ago(po.time)} <span class="csn-who-tag">${wl}发的</span></div>
                </div>
                <div class="csn-post-more" onclick="window._snPostMenu('${po.id}')">${SVG.more}</div>
            </div>
            <div class="csn-post-content">${_esc(po.content)}</div>
            ${imgs}
            <div class="csn-post-stats">
                <span><strong>${po.likes||0}</strong> 赞</span>
                <span><strong>${(po.comments||[]).length}</strong> 评论</span>
                <span><strong>${po.reposts||0}</strong> 转发</span>
                <span><strong>${views}</strong> 浏览</span>
            </div>
            <div class="csn-post-acts">
                <div class="csn-post-act" onclick="window._snCmt('${po.id}')">${SVG.msg} 评论</div>
                <div class="csn-post-act" onclick="window._snRepost('${po.id}')">${SVG.repeat} 转发</div>
                <div class="csn-post-act ${liked?'liked':''}" onclick="window._snLike('${po.id}')">${liked?SVG.heartFill:SVG.heart} 赞</div>
            </div>
            ${cmts}
            ${gen?`<div class="csn-ai-dots"><div class="dots"><span></span><span></span><span></span></div> 网友围观中...</div>`:''}
            <button class="csn-gen-btn" onclick="window._snGenCmts('${po.id}')" ${gen?'disabled':''}>
                ${gen?'<span class="spin">'+SVG.refresh+'</span> 生成中...':SVG.wand+' 生成网友评论'}
            </button>
            ${socialCommentingPostId===po.id?`<div class="csn-cmt-input">
                <input type="text" id="csn-ci-${po.id}" placeholder="写评论..." onkeydown="if(event.key==='Enter')window._snSendCmt('${po.id}')">
                <button onclick="window._snSendCmt('${po.id}')">发送</button>
            </div>`:''}
        </div>`;
    }

    function _netizenAv(name) {
        const cs=['aaa','888','666','999','bbb','777','555','ccc'];
        const h=name.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${cs[h%cs.length]}&color=fff&size=40`;
    }
    function _badgeLbl(t) { return {bless:'祝福',cp:'嗑CP',funny:'搞笑',jealous:'柠檬精'}[t]||''; }

    // 发帖
    function _buildComposeOvl(space, partner) {
        if(!socialComposeOpen)return '';
        const un=_un(partner),pn=_pn(partner);
        let imgs='';
        if(socialComposeImages.length>0){
            imgs='<div class="csn-compose-imgs">';
            socialComposeImages.forEach((im,i)=>{imgs+=`<div class="csn-compose-img-item"><img src="${im}"><div class="csn-compose-img-rm" onclick="window._snRmCompImg(${i})">${SVG.x}</div></div>`;});
            imgs+='</div>';
        }
        return `<div class="csn-compose-overlay show" onclick="window._snCloseComp()">
            <div class="csn-compose-sheet" onclick="event.stopPropagation()">
                <div class="csn-compose-head">
                    <div class="csn-compose-cancel" onclick="window._snCloseComp()">取消</div>
                    <div class="csn-compose-title">发帖</div>
                    <button class="csn-compose-submit" onclick="window._snSubmitPost()">发布</button>
                </div>
                <div class="csn-compose-who">
                    <div class="csn-compose-who-btn ${socialComposeWho==='user'?'active':''}" onclick="window._snSetWho('user')">${un} 发</div>
                    <div class="csn-compose-who-btn ${socialComposeWho==='partner'?'active':''}" onclick="window._snSetWho('partner')">${pn} 发</div>
                </div>
                <textarea class="csn-compose-ta" id="csn-ct" placeholder="分享你们的恋爱日常..." oninput="window._snSyncDraft(this)">${socialComposeDraft?socialComposeDraft.replace(/</g,'&lt;'):''}</textarea>
                ${imgs}
                <div class="csn-compose-tools">
                    <div class="csn-compose-tool" onclick="window._snAddCompImg()">${SVG.image} 图片</div>
                    <div class="csn-compose-tool" onclick="window._snAiDraft()">${SVG.robot} AI代写</div>
                </div>
            </div>
        </div>`;
    }

    function _buildPostMenu() {
        if(!socialMenuPostId)return '';
        return `<div class="csn-menu-overlay show" onclick="window._snCloseMenu()">
            <div class="csn-menu" onclick="event.stopPropagation()">
                <div class="csn-menu-item" onclick="window._snEditPost('${socialMenuPostId}')">${SVG.edit} 编辑</div>
                <div class="csn-menu-item" onclick="window._snRefreshCmts('${socialMenuPostId}')">${SVG.refresh} 重新生成评论</div>
                <div class="csn-menu-item danger" onclick="window._snDelPost('${socialMenuPostId}')">${SVG.trash} 删除</div>
                <div class="csn-menu-cancel" onclick="window._snCloseMenu()">取消</div>
            </div>
        </div>`;
    }

    function _buildSnSettings(space, partner) {
        if(!socialSettingsOpen)return '';
        const ac=space.socialAccount||{};
        const un=_un(partner),pn=_pn(partner);
        const aav=ac.avatar||_ua(partner);
        return `<div class="csn-settings-overlay show" onclick="window._snCloseSet()">
            <div class="csn-settings-card" onclick="event.stopPropagation()">
                <h3>账号设置</h3>
                <div class="csn-settings-av-row">
                    <img src="${aav}" id="csn-sav-img">
                    <button onclick="window._snChgAv()">更换头像</button>
                    <button onclick="window._snOrigAv()">用原头像</button>
                </div>
                <div class="csn-settings-field"><label>账号名称</label><input type="text" id="csn-s-name" value="${ac.name||''}" placeholder="给账号取个名字"></div>
                <div class="csn-settings-field"><label>账号ID</label><input type="text" id="csn-s-handle" value="${ac.handle||''}" placeholder="@yourhandle"></div>
                <div class="csn-settings-field"><label>个人简介</label><input type="text" id="csn-s-bio" value="${ac.bio||''}" placeholder="恋爱日常分享号"></div>
                <div class="csn-settings-gender-section">
                    <label class="csn-settings-gender-title">性别设定 <span class="csn-settings-gender-hint">（影响评论区的代词称呼）</span></label>
                    <div class="csn-settings-gender-row">
                        <div class="csn-settings-gender-item">
                            <span class="csn-settings-gender-name">${un}（用户）</span>
                            <div class="csn-settings-gender-btns" id="csn-g-user">
                                <button class="${ac.userGender==='男'?'active':''}" onclick="window._snSetGender('user','男')">男</button>
                                <button class="${ac.userGender==='女'?'active':''}" onclick="window._snSetGender('user','女')">女</button>
                                <button class="${!ac.userGender?'active':''}" onclick="window._snSetGender('user','')">自动</button>
                            </div>
                        </div>
                        <div class="csn-settings-gender-item">
                            <span class="csn-settings-gender-name">${pn}（联系人）</span>
                            <div class="csn-settings-gender-btns" id="csn-g-partner">
                                <button class="${ac.partnerGender==='男'?'active':''}" onclick="window._snSetGender('partner','男')">男</button>
                                <button class="${ac.partnerGender==='女'?'active':''}" onclick="window._snSetGender('partner','女')">女</button>
                                <button class="${!ac.partnerGender?'active':''}" onclick="window._snSetGender('partner','')">自动</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="csn-settings-name-btns">
                    <button onclick="window._snAiName()">${SVG.wand} AI取名</button>
                    <button onclick="window._snPtName()">${SVG.users} ${pn}取名</button>
                </div>
                <div class="csn-settings-btns">
                    <button class="s-cancel" onclick="window._snCloseSet()">取消</button>
                    <button class="s-save" onclick="window._snSaveSet()">保存</button>
                </div>
            </div>
        </div>`;
    }

    // ===== 社交操作 =====
    // [FIX-发帖空白] 实时同步textarea内容到状态变量，防止renderCouple()重建DOM后丢失
    window._snSyncDraft = function(ta) { if(ta) socialComposeDraft = ta.value; };
    window._snOpenComp = function() { socialComposeOpen=true;socialComposeImages=[];socialComposeWho='user';socialComposeDraft='';renderCouple(); };
    // [FIX-移动端穿透点击] 图片上传弹窗关闭后400ms内忽略overlay点击，防止移动端touch穿透
    window._snCloseProtected = false;
    window._snCloseComp = function() { if(window._snCloseProtected)return; socialComposeOpen=false;socialComposeImages=[];socialComposeDraft='';renderCouple(); };
    // [FIX-AI代写丢失] 切换发帖人时，先保存textarea内容到状态变量，再重新渲染
    window._snSetWho = function(w) { var ta=document.getElementById('csn-ct');if(ta)socialComposeDraft=ta.value;socialComposeWho=w;renderCouple(); };
    // [FIX-AI代写丢失] 添加/删除图片时也保存textarea内容
    // [FIX-移动端图片bug] 添加图片后优先局部DOM更新，避免renderCouple()全量重建导致移动端发帖弹窗消失
    // 移动端本地上传时，文件选择器会让WebView进入后台，回来后renderCouple()可能找不到couple-content-area
    function _snUpdateCompImgs() {
        var sheet = document.querySelector('.csn-compose-sheet');
        if (!sheet) {
            // 发帖弹窗DOM不存在（移动端后台恢复后可能被清理），用renderCouple重建
            renderCouple();
            return;
        }
        // 移除旧的图片容器
        var old = sheet.querySelector('.csn-compose-imgs');
        if (old) old.remove();
        // 如果有图片，在textarea和tools之间插入新的图片容器
        if (socialComposeImages.length > 0) {
            var imgsDiv = document.createElement('div');
            imgsDiv.className = 'csn-compose-imgs';
            socialComposeImages.forEach(function(im, i) {
                imgsDiv.innerHTML += '<div class="csn-compose-img-item"><img src="' + im + '"><div class="csn-compose-img-rm" onclick="window._snRmCompImg(' + i + ')">' + SVG.x + '</div></div>';
            });
            // 插入到textarea之后、tools之前
            var tools = sheet.querySelector('.csn-compose-tools');
            if (tools) {
                tools.parentNode.insertBefore(imgsDiv, tools);
            } else {
                sheet.appendChild(imgsDiv);
            }
        }
    }
    window._snAddCompImg = function() { var ta=document.getElementById('csn-ct');if(ta)socialComposeDraft=ta.value;openImgUploadModal('添加图片',(im)=>{socialComposeImages.push(im);_snUpdateCompImgs();}); };
    window._snRmCompImg = function(i) { var ta=document.getElementById('csn-ct');if(ta)socialComposeDraft=ta.value;socialComposeImages.splice(i,1);_snUpdateCompImgs(); };

    // [FIX-AI代写方向] 打开方向输入对话框
    window._snAiDraft = function() {
        const s=_sp();if(!s)return;const p=_pt(s);if(!p)return;
        // 先保存当前textarea内容到状态，防止dialog打开导致renderCouple重建DOM丢失
        const _ta0=document.getElementById('csn-ct');if(_ta0)socialComposeDraft=_ta0.value;
        _snShowAiDirectionDialog();
    };

    // [FIX-AI代写方向] 显示方向输入对话框
    function _snShowAiDirectionDialog() {
        // 移除可能残留的旧弹窗
        const _old=document.getElementById('csn-ai-dir-overlay');
        if(_old) _old.remove();
        const overlay=document.createElement('div');
        overlay.id='csn-ai-dir-overlay';
        overlay.className='csn-compose-overlay show';
        overlay.style.zIndex='100010';
        overlay.innerHTML=`<div class="csn-compose-sheet" onclick="event.stopPropagation()" style="max-height:60vh;">
            <div class="csn-compose-head">
                <div class="csn-compose-cancel" id="csn-ai-dir-cancel">取消</div>
                <div class="csn-compose-title">AI代写</div>
                <button class="csn-compose-submit" id="csn-ai-dir-ok">生成</button>
            </div>
            <div style="padding:12px 16px 6px;font-size:13px;color:#666;">告诉AI你想写什么方向的帖子（可留空，由AI自由发挥）：</div>
            <textarea class="csn-compose-ta" id="csn-ai-dir-input" placeholder="比如：写一条关于今天约会的帖子/吐槽对方不回消息/分享一起做饭的日常..." style="min-height:100px;max-height:180px;"></textarea>
            <div style="padding:4px 16px 16px;font-size:12px;color:#999;">留空将根据最近聊天自动生成</div>
        </div>`;
        overlay.onclick=function(){_snCloseAiDirDialog();};
        document.body.appendChild(overlay);
        setTimeout(()=>{const inp=document.getElementById('csn-ai-dir-input');if(inp)inp.focus();},50);
        document.getElementById('csn-ai-dir-cancel').onclick=function(e){e.stopPropagation();_snCloseAiDirDialog();};
        document.getElementById('csn-ai-dir-ok').onclick=function(e){
            e.stopPropagation();
            const inp=document.getElementById('csn-ai-dir-input');
            const direction=inp?inp.value.trim():'';
            _snCloseAiDirDialog();
            _snAiDraftGenerate(direction);
        };
    }

    function _snCloseAiDirDialog() {
        const ov=document.getElementById('csn-ai-dir-overlay');
        if(ov) ov.remove();
    }

    // [FIX-AI代写方向] 实际调用API生成帖子（接受方向参数）
    async function _snAiDraftGenerate(direction) {
        const s=_sp();if(!s)return;const p=_pt(s);if(!p)return;
        const un=_un(p),pn=_pn(p),ud=_getUD(p);const who=socialComposeWho;
        const rc=(store.chats[p.id]||[]).slice(-10).map(m=>(m.sender==='me'?un:pn)+': '+(m.content||'').substring(0,50)).join('\n');
        toast(direction?'AI正在按方向写帖子...':'AI正在写帖子...');
        try{
            const userMsg=direction
                ? `最近聊天：\n${rc||'暂无'}\n\n【用户希望的方向/主题】：${direction}\n\n请严格按上述方向来写，但保持角色口吻自然，不要机械复述方向描述。`
                : `最近聊天：\n${rc||'暂无'}\n写一条帖子。`;
            const r=await API.chatCompletion([
                {role:'system',content:`模拟${who==='user'?un:pn}在社交媒体发帖。要求：
1. 完全符合${who==='user'?un+'(人设:'+ud+')':pn+'(人设:'+p.persona+')'}的性格和说话方式
2. 分享恋爱日常，语气自然随意
3. 50-200字，可以加少量表情
4. 根据最近聊天内容和情景来写，不能OOC
5. 如果用户指定了方向/主题，必须围绕该方向来写
6. 只输出帖子内容，不要加引号、前缀、解释`},
                {role:'user',content:userMsg}
            ],0.95);
            const ct=r.choices[0].message.content.trim();
            // [FIX-AI代写丢失] 同时更新状态变量和DOM，确保内容不会因重新渲染而丢失
            socialComposeDraft=ct;
            const ta=document.getElementById('csn-ct');if(ta)ta.value=ct;
            toast('帖子已生成');
        }catch(e){toast('AI代写失败','error');}
    }

    window._snSubmitPost = function() {
        // [FIX-发帖空白] 优先从DOM读取最新值，同时同步到状态变量；回退到状态变量
        const ta=document.getElementById('csn-ct');
        if(ta && ta.value) socialComposeDraft = ta.value; // 确保最新内容已同步
        const ct=(ta && ta.value ? ta.value : socialComposeDraft).trim();
        if(!ct&&socialComposeImages.length===0)return toast('请输入内容或添加图片');
        const s=_sp();if(!s)return;_init(s);const ac=s.socialAccount;if(!ac.posts)ac.posts=[];
        const np={id:'po_'+Date.now(),content:ct,images:[...socialComposeImages],postedBy:socialComposeWho,time:Date.now(),likes:Math.floor(Math.random()*50)+5,reposts:Math.floor(Math.random()*10),comments:[],userLiked:false};
        ac.posts.push(np);save();socialComposeOpen=false;socialComposeImages=[];socialComposeDraft='';renderCouple();toast('帖子已发布');
        // 发帖后自动生成评论 + 联系人主动回复
        setTimeout(()=>{window._snGenCmts(np.id);},1500);
        setTimeout(()=>{_partnerAutoReplyPost(s, np.id);},3000);
    };

    // 联系人主动发帖
    window._snPartnerPost = async function() {
        const s=_sp();if(!s)return;const p=_pt(s);if(!p)return toast('找不到联系人');
        const un=_un(p),pn=_pn(p),ud=_getUD(p);
        const rc=(store.chats[p.id]||[]).slice(-10).map(m=>(m.sender==='me'?un:pn)+': '+(m.content||'').substring(0,50)).join('\n');
        toast(pn+'正在发帖...');
        try{
            const r=await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${p.persona||'无'}）。你要主动在你和伴侣${un}的情侣社交账号上发一条帖子。要求：
1. 完全符合${pn}的性格和说话方式，不能OOC
2. 分享你们的恋爱日常，可以是甜蜜、日常、吐槽、秀恩爱等
3. 根据最近聊天内容来写
4. 50-200字，语气自然
5. 只输出帖子内容`},
                {role:'user',content:`最近聊天：\n${rc||'暂无'}\n发一条帖子。`}
            ],0.95);
            const ct=r.choices[0].message.content.trim();
            _init(s);const ac=s.socialAccount;if(!ac.posts)ac.posts=[];
            const np={id:'po_'+Date.now(),content:ct,images:[],postedBy:'partner',time:Date.now(),likes:Math.floor(Math.random()*50)+5,reposts:Math.floor(Math.random()*10),comments:[],userLiked:false};
            ac.posts.push(np);save();renderCouple();
            // 联系人发帖后提醒用户
            toast(pn+'在你们的情侣号发了一条新帖子，快去看看~');
            setTimeout(()=>{window._snGenCmts(np.id);},1500);
            // 联系人也会自己评论自己的帖子（补充说明）
            setTimeout(()=>{_partnerAutoReplyPost(s, np.id);},3500);
        }catch(e){toast(pn+'发帖失败','error');}
    };

    // 联系人主动回复帖子评论
    // [FIX-性别称谓+NPC优化] 使用正确性别代词，改进prompt减少人机感
    async function _partnerAutoReplyPost(space, postId) {
        const p=_pt(space);if(!p)return;
        const ac=space.socialAccount;const po=(ac.posts||[]).find(pp=>pp.id===postId);if(!po)return;
        const pn=_pn(p),un=_un(p);
        const gi=_getGenderInfo(p);
        const uPr=_pronoun(gi.userGender);
        // 联系人针对帖子内容发表评论
        try{
            const postBy=po.postedBy==='user'?un:pn;
            const r=await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${p.persona||'无'}）。在你和伴侣${un}的情侣社交账号上，${postBy}刚发了一条新帖子。你要在评论区留言。要求：
1. 完全用${pn}的语气说话，符合角色性格
2. 仔细读帖子内容，针对帖子说的事情来评论
3. ${po.postedBy==='user'?`这是${un}发的帖子，你可以接${uPr}的话、吐槽${uPr}、或撒娇回应`:`这是你自己发的帖子，可以补充一句或自我吐槽`}
4. 10-35字，像日常聊天一样随意自然
5. 不要写"好的"、"收到"之类敷衍的话
6. 只输出评论内容，不要加引号`},
                {role:'user',content:`帖子内容：${(po.content||'').substring(0,200)}`}
            ],0.9);
            const rp=r.choices[0].message.content.trim();
            if(!po.comments)po.comments=[];
            po.comments.push({name:pn,text:rp,who:'partner',isAi:false,time:Date.now(),likes:Math.floor(Math.random()*20),replyTo:null});
            save();renderCouple();
        }catch(e){console.error('联系人自动评论失败:',e);}
    }

    window._snLike = function(pid) { const s=_sp();if(!s)return;const po=(s.socialAccount.posts||[]).find(p=>p.id===pid);if(!po)return;if(po.userLiked){po.likes=Math.max(0,(po.likes||0)-1);po.userLiked=false;}else{po.likes=(po.likes||0)+1;po.userLiked=true;}save();renderCouple(); };
    window._snCmt = function(pid) { socialCommentingPostId=socialCommentingPostId===pid?null:pid;renderCouple();if(socialCommentingPostId)setTimeout(()=>{const i=document.getElementById('csn-ci-'+pid);if(i)i.focus();},100); };
    window._snSendCmt = function(pid, replyTo) {
        const i=document.getElementById('csn-ci-'+pid);if(!i)return;const tx=i.value.trim();if(!tx)return;
        const s=_sp();if(!s)return;const p=_pt(s);const po=(s.socialAccount.posts||[]).find(pp=>pp.id===pid);if(!po)return;if(!po.comments)po.comments=[];
        po.comments.push({name:_un(p),text:tx,who:'user',isAi:false,time:Date.now(),likes:0,replyTo:replyTo||null});
        socialCommentingPostId=null;save();renderCouple();
        // 用户评论后联系人主动回复
        setTimeout(()=>{_partnerAutoReplyToUserComment(s, pid, tx);},2000);
    };

    // 联系人主动回复用户的评论
    // [FIX-性别称谓+NPC优化] 使用正确性别代词，改进prompt减少人机感
    async function _partnerAutoReplyToUserComment(space, postId, userComment) {
        const p=_pt(space);if(!p)return;
        const ac=space.socialAccount;const po=(ac.posts||[]).find(pp=>pp.id===postId);if(!po)return;
        const pn=_pn(p),un=_un(p);
        const gi=_getGenderInfo(p);
        const uPr=_pronoun(gi.userGender);
        try{
            const r=await API.chatCompletion([
                {role:'system',content:`你是${pn}（人设：${p.persona||'无'}）。${un}在你们的情侣帖子下写了一条评论，你要回复${uPr}。要求：
1. 用${pn}的语气回复，符合角色性格
2. 针对${un}说的话来回复，要有具体回应
3. 像情侣间聊天一样自然，可以撒娇、吐槽、接话
4. 8-25字，简短有趣
5. 只输出回复内容，不要加引号`},
                {role:'user',content:`帖子：${(po.content||'').substring(0,150)}\n${un}说：${userComment}\n用${pn}的语气回复${uPr}。`}
            ],0.85);
            const rp=r.choices[0].message.content.trim();
            if(!po.comments)po.comments=[];
            po.comments.push({name:pn,text:rp,who:'partner',isAi:false,time:Date.now(),likes:Math.floor(Math.random()*10),replyTo:un});
            save();renderCouple();
        }catch(e){console.error('联系人回复评论失败:',e);}
    }

    window._snReplyCmt = function(pid,ci) {
        const s=_sp();if(!s)return;const po=(s.socialAccount.posts||[]).find(p=>p.id===pid);if(!po||!po.comments[ci])return;
        const rt=po.comments[ci].name;socialCommentingPostId=pid;renderCouple();
        setTimeout(()=>{const i=document.getElementById('csn-ci-'+pid);if(i){i.placeholder='回复 @'+rt+'...';i.focus();i.onkeydown=e=>{if(e.key==='Enter')window._snSendCmt(pid,rt)};}},100);
    };
    window._snLikeCmt = function(pid,ci) { const s=_sp();if(!s)return;const po=(s.socialAccount.posts||[]).find(p=>p.id===pid);if(!po||!po.comments[ci])return;po.comments[ci].likes=(po.comments[ci].likes||0)+1;save();renderCouple(); };
    window._snRepost = function(pid) { const s=_sp();if(!s)return;const po=(s.socialAccount.posts||[]).find(p=>p.id===pid);if(!po)return;po.reposts=(po.reposts||0)+1;save();renderCouple();toast('已转发'); };

    window._snPostMenu = function(pid) { socialMenuPostId=pid;renderCouple(); };
    window._snCloseMenu = function() { socialMenuPostId=null;renderCouple(); };
    window._snDelPost = function(pid) { showConfirm('删除帖子','确定？',()=>{const s=_sp();if(!s)return;s.socialAccount.posts=(s.socialAccount.posts||[]).filter(p=>p.id!==pid);socialMenuPostId=null;save();renderCouple();toast('已删除');}); };
    window._snEditPost = function(pid) { const s=_sp();if(!s)return;const po=(s.socialAccount.posts||[]).find(p=>p.id===pid);if(!po)return;showPromptModal('编辑帖子:',po.content,{multiline:true}).then(function(nc){if(nc!==null){po.content=nc;socialMenuPostId=null;save();renderCouple();}}); };
    window._snRefreshCmts = function(pid) { showConfirm('重新生成评论','清除AI评论并重新生成？',()=>{const s=_sp();if(!s)return;const po=(s.socialAccount.posts||[]).find(p=>p.id===pid);if(!po)return;po.comments=(po.comments||[]).filter(c=>!c.isAi);socialMenuPostId=null;save();renderCouple();window._snGenCmts(pid);}); };

    // AI评论生成 - 根据帖子内容生成相关评论
    // [FIX-性别称谓+NPC优化] 重写评论生成，使用正确性别代词，提升评论质量
    window._snGenCmts = async function(pid) {
        const s=_sp();if(!s)return;const p=_pt(s);if(!p)return;const ac=s.socialAccount;const po=(ac.posts||[]).find(pp=>pp.id===pid);if(!po)return;
        if(aiCommentsGenerating[pid])return;aiCommentsGenerating[pid]=true;renderCouple();
        const un=_un(p),pn=_pn(p);
        const gi=_getGenderInfo(p);
        const an=ac.name||(un+'&'+pn);const by=po.postedBy==='user'?un:pn;
        // [FIX-性别称谓] 使用检测到的性别生成正确代词
        const uPronoun = _pronoun(gi.userGender);
        const pPronoun = _pronoun(gi.partnerGender);
        const uGenderLabel = gi.userGender ? `(${gi.userGender}性)` : '';
        const pGenderLabel = gi.partnerGender ? `(${gi.partnerGender}性)` : '';
        const genderCtx = `${un}${uGenderLabel}和${pn}${pGenderLabel}是情侣。提到${un}时用代词"${uPronoun}"，提到${pn}时用代词"${pPronoun}"。`;
        // [FIX-性别称谓] 使用正确的代词生成柠檬精例子
        const jealousDir = `柠檬精评论方向：网友羡慕${pn}命好，居然能和${un}在一起。网友想"抢"的是${un}（用户），不是${pn}。提到${un}时必须用"${uPronoun}"，提到${pn}时必须用"${pPronoun}"。例如："${pn}也太命好了吧，${un}这样的居然被你拐走了"、"${pn}你不要${uPronoun}了记得告诉我"、"天哪${un}居然有对象了我不活了"`;
        // [FIX-NPC优化] 获取帖子简要上下文，让评论更有针对性
        const postSnippet = (po.content || '').substring(0, 300);
        const existingCmtCount = (po.comments || []).filter(c => !c.isAi).length;
        const existingCmtCtx = existingCmtCount > 0 ? `（已有${existingCmtCount}条真人评论，新生成的评论不要和已有评论重复）` : '';
        // [关联联系人互评] 从关系网获取已关联联系人的身份信息，影响评论风格
        let relationCtx = '';
        try {
            // [FIX-关系网隔离] 使用按联系人隔离的关系网数据
            const _coupleRN = (store.relationNetworks && store.relationNetworks[typeof activeChatId !== 'undefined' ? activeChatId : '']) || store.relationNetwork;
            if (_coupleRN && _coupleRN.characters) {
                const linkedChars = _coupleRN.characters.filter(c => c.linkedContactId && c.linkedContactRole);
                if (linkedChars.length > 0) {
                    let relDescs = linkedChars.map(c => {
                        const linkedContact = (store.contacts || []).find(ct => ct.id === c.linkedContactId);
                        const linkedName = linkedContact ? linkedContact.name : c.name;
                        return `"${c.name}"是${un}和${pn}的${c.linkedContactRole}（关联联系人：${linkedName}）`;
                    }).join('；');
                    relationCtx = `\n【人物关系背景】以下是${un}和${pn}社交圈中的重要人物：${relDescs}。请让1-2条评论由这些角色以其身份（如情敌、好朋友等）的语气来写，用角色名字作为网名或网名的一部分。例如情敌会酸溜溜地评论，好朋友会捧场或吐槽，竞争对手会暗自比较等。`;
                }
            }
        } catch(e) { console.warn('获取关系网信息失败:', e); }
        try{
            const r=await API.chatCompletion([
                {role:'system',content:`模拟真实社交媒体评论区。为情侣号帖子生成3-5条网友评论。
账号：${an}（${un}和${pn}的情侣号）。${genderCtx}
发帖人：${by}。${existingCmtCtx}${relationCtx}

【铁律】
1. 每条评论必须针对帖子具体内容！引用帖子里的细节来评论，不许写万能评论。
2. ${jealousDir}
3. 代词：${un}→"${uPronoun}"，${pn}→"${pPronoun}"，不能搞混。
4. 类型分配：funny(吐槽/玩梗)、jealous(柠檬精)、cp(嗑CP)、roast(损友式调侃)、random(跑题/自说自话) 至少各1条，不需要bless祝福类。

【反人机规则——最重要！】
- 绝对禁止：\"太棒了\"\"好喜欢\"\"真的很\"\"好幸福\"\"加油\"\"支持\"\"好好珍惜\"\"羡慕\"这种万能废话
- 绝对禁止：每条评论都是完整通顺的句子，真人评论经常是半句话、缩写、打字错误
- 绝对禁止：排比句、\"首先其次\"、\"作为XX我觉得\"等AI腔
- 必须做到：
  * 至少1条只有1-5个字（比如\"啊？\"\"救命\"\"？？？\"\"笑死\"\"我裂开\"）
  * 至少1条故意打错字或用谐音梗（比如\"绝绝子\"\"yyds\"\"栓Q\"\"6\"）
  * 至少1条跑题或只关注某个不重要的细节（比如帖子秀恩爱但评论只问\"背景那个餐厅叫啥\"）
  * 评论长短极度不均：最短1字，最长不超过30字
  * 有的评论没有标点，有的全是感叹号或问号
  * 网名要接地气：用日常吐槽式（如\"上班摸鱼第一人\"\"减肥从明天开始\"\"论文还没写完\"），不要用\"XX观察员\"\"XX鉴赏家\"这种刻意的网名

输出格式：JSON数组
[{"name":"网名","text":"评论内容","type":"funny|jealous|cp|roast|random","likes":数字,"replyTo":"被回复的网名或null"}]
只输出JSON。`},
                {role:'user',content:`帖子内容：${postSnippet}\n${po.images&&po.images.length>0?'(配了'+po.images.length+'张图)':'(纯文字帖)'}`}
            ],0.95);
            const rp=r.choices[0].message.content.trim();let js=rp;const jm=rp.match(/\[[\s\S]*\]/);if(jm)js=jm[0];
            const cmts=JSON.parse(js);
            if(Array.isArray(cmts)){if(!po.comments)po.comments=[];
                cmts.forEach((c,i)=>{po.comments.push({name:c.name||'网友'+i,text:c.text||'',type:c.type||'',isAi:true,who:'netizen',time:Date.now()-(cmts.length-i)*120000+Math.random()*60000,likes:c.likes||Math.floor(Math.random()*100),replyTo:c.replyTo||null});});
                save();}
        }catch(e){console.error('AI评论生成失败:',e);toast('评论生成失败','error');}
        aiCommentsGenerating[pid]=false;renderCouple();
    };

    window._snPrevImg = function(src) {
        const o=document.createElement('div');o.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
        o.onclick=()=>o.remove();const im=document.createElement('img');im.src=src;im.style.cssText='max-width:95%;max-height:90vh;object-fit:contain;border-radius:6px;';
        o.appendChild(im);document.body.appendChild(o);
    };

    // 设置
    window._snOpenSet = function() { socialSettingsOpen=true;renderCouple(); };
    window._snCloseSet = function() { socialSettingsOpen=false;renderCouple(); };
    // [性别设定] 临时存储性别选择，点击按钮时即时更新UI
    let _tempUserGender = null;
    let _tempPartnerGender = null;
    window._snSetGender = function(who, gender) {
        const s=_sp();if(!s)return;_init(s);const ac=s.socialAccount;
        if(who==='user') { ac.userGender=gender; _tempUserGender=gender; }
        else { ac.partnerGender=gender; _tempPartnerGender=gender; }
        // 更新按钮active状态（不重新渲染整个页面，避免丢失其他输入）
        const container = document.getElementById(who==='user'?'csn-g-user':'csn-g-partner');
        if(container) {
            container.querySelectorAll('button').forEach(btn => {
                const val = btn.textContent === '男' ? '男' : btn.textContent === '女' ? '女' : '';
                btn.className = val === gender ? 'active' : '';
            });
        }
        save();
    };
    window._snSaveSet = function() {
        const s=_sp();if(!s)return;_init(s);const ac=s.socialAccount;
        const n=document.getElementById('csn-s-name'),h=document.getElementById('csn-s-handle'),b=document.getElementById('csn-s-bio');
        if(n)ac.name=n.value.trim();if(h)ac.handle=h.value.trim();if(b)ac.bio=b.value.trim();
        // 性别已在 _snSetGender 中即时保存，这里无需额外处理
        socialSettingsOpen=false;_tempUserGender=null;_tempPartnerGender=null;save();renderCouple();toast('已保存');
    };
    window._snChgAv = function() { openImgUploadModal('设置头像',(im)=>{const s=_sp();if(!s)return;_init(s);s.socialAccount.avatar=im;save();const pr=document.getElementById('csn-sav-img');if(pr)pr.src=im;toast('头像已更新');}); };
    window._snOrigAv = function() { const s=_sp();if(!s)return;const p=_pt(s);_init(s);s.socialAccount.avatar=_ua(p);save();const pr=document.getElementById('csn-sav-img');if(pr)pr.src=_ua(p);toast('已使用原头像'); };
    window._snAiName = async function() {
        const s=_sp();if(!s)return;const p=_pt(s);if(!p)return;
        toast('AI正在取名...');
        try{const r=await API.chatCompletion([{role:'system',content:'为情侣社交媒体共用账号取名字和ID。名字2-10字，ID英文/拼音@开头。格式：名字|@id。只输出一行。'},{role:'user',content:`情侣：${_un(p)}和${_pn(p)}`}],0.95);
            const pts=r.choices[0].message.content.trim().split('|');if(pts.length>=2){const n=document.getElementById('csn-s-name'),h=document.getElementById('csn-s-handle');if(n)n.value=pts[0].trim();if(h)h.value=pts[1].trim();toast('AI取名完成');}
        }catch(e){toast('取名失败','error');}
    };
    window._snPtName = async function() {
        const s=_sp();if(!s)return;const p=_pt(s);if(!p)return;
        const pn=_pn(p);toast(pn+'正在想名字...');
        try{const r=await API.chatCompletion([{role:'system',content:`你是${pn}(人设:${p.persona||'无'})。伴侣${_un(p)}要和你一起注册情侣共用账号。用你的性格取名字和ID。格式：名字|@id。只输出一行。`},{role:'user',content:`取名吧~`}],0.9);
            const pts=r.choices[0].message.content.trim().split('|');if(pts.length>=2){const n=document.getElementById('csn-s-name'),h=document.getElementById('csn-s-handle');if(n)n.value=pts[0].trim();if(h)h.value=pts[1].trim();toast(pn+'取好名字了');}
        }catch(e){toast('取名失败','error');}
    };

    // 记忆钩子
    window._coupleAccountBuildMemory = function(contactId) {
        let mem='';if(!store.coupleSpaces)return mem;
        store.coupleSpaces.forEach(sp=>{
            if(sp.partnerId!==contactId)return;_init(sp);
            if(sp.photoWall.length>0){mem+=`\n[情侣照片墙: 共${sp.photoWall.length}张照片`;const rc=sp.photoWall.slice(-3);rc.forEach(ph=>{if(ph.caption)mem+=`, "${ph.caption}"`;});mem+=']';}
            if(sp.diaries.length>0){const rd=sp.diaries.slice(-2);mem+=`\n[情侣日记: 共${sp.diaries.length}篇。最近：`;rd.forEach(d=>{mem+=`"${(d.content||'').substring(0,60)}..."`;if(d.stickers&&d.stickers.length>0)mem+=`(${d.stickers.length}条留言)`;});mem+=']';}
            const ac=sp.socialAccount;if(ac.posts&&ac.posts.length>0){mem+=`\n[情侣社交账号"${ac.name||'情侣号'}": ${ac.posts.length}条帖子。最近：`;ac.posts.slice(-2).forEach(p=>{mem+=`"${(p.content||'').substring(0,40)}..."(${(p.comments||[]).length}条评论)`;});mem+=']';}
        });
        return mem;
    };

    // ====== 全局前台自动触发系统 ======
    // 只要应用在前台，就定期检查所有情侣空间，让联系人主动行动
    // 不需要进入情侣账号页面
    let _globalAutoRunning = false;
    let _globalAutoInterval = null;

    async function _globalCoupleAutoCheck() {
        // 页面在后台不执行
        if (document.hidden) return;
        // 防止并发
        if (_globalAutoRunning) return;
        // 确保store已加载
        if (!window.store || !store.coupleSpaces || store.coupleSpaces.length === 0) return;
        
        // [FIX-自动调用API] 总开关检查：遍历所有情侣空间，如果没有任何一个开启了自动行为，直接返回
        var hasAnyAutoEnabled = store.coupleSpaces.some(function(sp) {
            if (!sp || !sp.autoSettings) return false;
            var as = sp.autoSettings;
            return as.autoPhoto || as.autoDiary || as.autoPost || as.autoComment;
        });
        if (!hasAnyAutoEnabled) return;

        _globalAutoRunning = true;
        try {
            for (const space of store.coupleSpaces) {
                if (!space || !space.partnerId) continue;
                const partner = store.contacts ? store.contacts.find(c => c.id === space.partnerId) : null;
                if (!partner) continue;
                _init(space);
                await _partnerAutoActions(space, partner);
            }
        } catch(e) {
            console.error('[couple-auto] 全局自动检查失败:', e);
        }
        _globalAutoRunning = false;
    }

    // 启动全局定时器：每5分钟检查一次
    function _startGlobalAutoTimer() {
        if (_globalAutoInterval) return;
        // 首次延迟30秒启动（等应用完全加载）
        setTimeout(() => {
            _globalCoupleAutoCheck();
            _globalAutoInterval = setInterval(_globalCoupleAutoCheck, 5 * 60 * 1000);
        }, 30000);
    }

    // 页面回到前台时也触发一次检查
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // 回到前台延迟5秒检查，避免和其他回前台逻辑冲突
            setTimeout(_globalCoupleAutoCheck, 5000);
        }
    });

    // DOM加载完成后启动
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        _startGlobalAutoTimer();
    } else {
        document.addEventListener('DOMContentLoaded', _startGlobalAutoTimer);
    }

})();
