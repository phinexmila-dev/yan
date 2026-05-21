// ============================================
// PENGUIN VIDEO MODULE - 企鹅视频
// AI驱动的协作式互动剧场
// 功能：NPC捏造 · 剧本工坊 · 放映厅 · 弹幕 · 一起看 · 演绎模式 · 狗血转折
// ============================================

(function() {
    'use strict';

    // ========== SVG 图标库 ==========
    const PV_SVG = {
        back: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        play: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M6 3.5l10 6.5-10 6.5V3.5z"/></svg>',
        pause: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="4" height="12" rx="1"/><rect x="9" y="2" width="4" height="12" rx="1"/></svg>',
        stop: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="3" width="10" height="10" rx="1.5"/></svg>',
        next: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3 3l7 5-7 5V3zM11 3h2v10h-2V3z"/></svg>',
        prev: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13 13L6 8l7-5v10zM5 13H3V3h2v10z"/></svg>',
        danmaku: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M4 6h8M4 8.5h5M4 11h6" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.6"/></svg>',
        cast: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.5" stroke="currentColor" stroke-width="1.3"/><circle cx="11" cy="6" r="2" stroke="currentColor" stroke-width="1.3"/><path d="M1 13c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" stroke-width="1.3"/><path d="M10 13c0-2 1.5-3.5 3.5-3.5" stroke="currentColor" stroke-width="1.3"/></svg>',
        script: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.3"/><path d="M10 2v3h3M5 7h6M5 9.5h4M5 12h5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>',
        twist: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8c0-3.3 2.7-6 6-6M14 8c0 3.3-2.7 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 2l2 2-2 2M8 14l-2-2 2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        together: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.3"/><path d="M6 14h4M8 11v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="5.5" cy="7" r="1" fill="currentColor"/><circle cx="10.5" cy="7" r="1" fill="currentColor"/></svg>',
        pen: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
        star: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1l2.2 4.5 5 .7-3.6 3.5.9 5L8 12.4 3.5 14.7l.9-5L.8 6.2l5-.7L8 1z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
        people: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" stroke-width="1.3"/></svg>',
        search: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        plus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        close: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        trash: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8l-.7 7.5a1 1 0 01-1 .9H4.7a1 1 0 01-1-.9L3 4zM2 4h10M5.5 2h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
        heart: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z" stroke="currentColor" stroke-width="1.3"/></svg>',
        fire: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1c0 3-3 4-3 7a4 4 0 008 0c0-2-1-3-2-4 0 2-1 3-2 3s-1-2-1-3c0-1 0-2 0-3z"/></svg>',
        cog: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
        send: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 1.5l-6 13-2.5-5.5L.5 6.5l14-5z"/></svg>',
        film: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 5h12M2 11h12M5 2v12M11 2v12" stroke="currentColor" stroke-width="1"/></svg>',
        eye: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3C3 3 1 7 1 7s2 4 6 4 6-4 6-4-2-4-6-4z" stroke="currentColor" stroke-width="1.3"/><circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.3"/></svg>',
        bookmark: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2h8a1 1 0 011 1v11l-5-3-5 3V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.3"/></svg>',
        magic: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 15l9-9M7 3l1.5 1.5M12 2l-1 3 3-1-1.5-1.5L12 2zM3 7l1-3 1.5 1.5L3 7zM10 10l3-1-1.5-1.5L10 10z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        theater: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 22h8M12 18v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M7 9a1 1 0 100-2 1 1 0 000 2zM17 9a1 1 0 100-2 1 1 0 000 2zM9 13c0 0 1.5 2 3 2s3-2 3-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
        arrow: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        check: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        refresh: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 8A5.5 5.5 0 118 2.5M8 2.5V0M8 2.5L10.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        copy: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" stroke-width="1.3"/><path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" stroke="currentColor" stroke-width="1.3"/></svg>',
        more: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="12" cy="8" r="1.5"/></svg>',
        expand: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 6l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        collapse: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 10l5-5 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };

    // ========== 常量 ==========
    const PV_GENRES = {
        romance: '言情', xianxia: '仙侠', urban: '都市', ancient: '古装',
        suspense: '悬疑', comedy: '喜剧', fantasy: '奇幻', scifi: '科幻',
        campus: '校园', war: '战争', family: '家庭', dogblood: '狗血'
    };

    const PV_GENRE_ICONS = {
        romance: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 21s-8-5-8-10.5a5.5 5.5 0 0111 0 5.5 5.5 0 0111 0c0 5.5-8 10.5-8 10.5z" stroke="currentColor" stroke-width="1.5"/></svg>',
        xianxia: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7z" stroke="currentColor" stroke-width="1.5"/></svg>',
        urban: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 21V7l6-4v18M9 3l6 4v14M15 7l6 4v10" stroke="currentColor" stroke-width="1.5"/></svg>',
        ancient: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 21h16M6 21V11l6-7 6 7v10M10 21v-5h4v5" stroke="currentColor" stroke-width="1.5"/></svg>',
        suspense: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v5M12 16v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        comedy: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M8 9v.5M16 9v.5M8 14c0 2 2 3.5 4 3.5s4-1.5 4-3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        fantasy: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2C8 6 4 9 4 13a8 8 0 0016 0c0-4-4-7-8-11z" stroke="currentColor" stroke-width="1.5"/></svg>',
        scifi: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><ellipse cx="12" cy="12" rx="4" ry="10" stroke="currentColor" stroke-width="1"/></svg>',
        campus: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3L2 9l10 6 10-6-10-6zM4 10v6l8 5 8-5v-6" stroke="currentColor" stroke-width="1.5"/></svg>',
        war: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2v4M12 6l-6 4v6l6 4 6-4v-6l-6-4z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
        family: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="6" r="3" stroke="currentColor" stroke-width="1.3"/><circle cx="16" cy="6" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M4 20c0-3 2-5 4.5-5h7c2.5 0 4.5 2 4.5 5" stroke="currentColor" stroke-width="1.3"/></svg>',
        dogblood: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2c-2 4-6 6-6 10a6 6 0 1012 0c0-4-4-6-6-10z" stroke="currentColor" stroke-width="1.5"/><path d="M12 18v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    };

    const PV_DOGBLOOD_TEMPLATES = [
        { name: '失忆梗', keywords: ['失忆','忘记','不记得'], desc: '关键角色突然失忆，遗忘了一切' },
        { name: '身世之谜', keywords: ['亲生','身世','血缘'], desc: '意外发现角色间的血缘关系' },
        { name: '假死局', keywords: ['死亡','坠崖','爆炸'], desc: '以为死去的角色其实还活着' },
        { name: '替身梗', keywords: ['替身','相似','双胞胎'], desc: '角色其实是某人的替身' },
        { name: '误会分手', keywords: ['误会','分手','离开'], desc: '因为一个巨大的误会而分道扬镳' },
        { name: '复仇归来', keywords: ['复仇','回来','三年后'], desc: '消失多年的角色带着秘密归来' },
        { name: '契约恋爱', keywords: ['合同','契约','交易'], desc: '两人因为利益达成恋爱协议' },
        { name: '三角纠葛', keywords: ['喜欢','两个人','选择'], desc: '出现第三者搅局的感情风暴' },
    ];

    // ========== 数据初始化 ==========
    function pvInit() {
        if (!store.penguinVideo) store.penguinVideo = {};
        if (!store.penguinVideo.dramas) store.penguinVideo.dramas = [];
        if (!store.penguinVideo.following) store.penguinVideo.following = [];
        if (!store.penguinVideo.watchRooms) store.penguinVideo.watchRooms = [];
        if (!store.penguinVideo.performances) store.penguinVideo.performances = [];
        if (!store.penguinVideo.history) store.penguinVideo.history = [];
        if (!store.penguinVideo.reviews) store.penguinVideo.reviews = [];
        if (!store.penguinVideo.collections) store.penguinVideo.collections = [];
        if (!store.penguinVideo.branches) store.penguinVideo.branches = [];
        if (!store.penguinVideo.settings) store.penguinVideo.settings = {
            defaultGenre: 'romance',
            autoGenerateDanmaku: true,
            danmakuDensity: 'normal',
            npcResponseStyle: 'dramatic',
        };
    }

    // ========== 辅助函数 ==========
    function pvId() {
        return 'pv_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    }

    function pvEscapeRegex(str) {
        return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function pvRandomColor() {
        var h = Math.floor(Math.random() * 360);
        var s = Math.floor(Math.random() * 30 + 50);
        var l = Math.floor(Math.random() * 20 + 35);
        return 'hsl(' + h + ',' + s + '%,' + l + '%)';
    }

    function pvToast(msg) {
        var el = document.createElement('div');
        el.className = 'pv-toast';
        el.textContent = msg;
        document.getElementById('layer-penguin-video').appendChild(el);
        setTimeout(function() { el.remove(); }, 2200);
    }

    function pvEsc(s) {
        if (!s) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function pvGetContact(id) {
        return (store.contacts || []).find(function(c) { return c.id === id; });
    }

    function pvGetContactName(id) {
        var c = pvGetContact(id);
        return c ? (c.remark || c.name) : '未知';
    }

    function pvGetContactAvatar(id) {
        var c = pvGetContact(id);
        return c && c.avatar ? '<img src="' + pvEsc(c.avatar) + '">' : PV_SVG.people;
    }

    function pvGetCastMember(drama, castId) {
        return (drama.cast || []).find(function(c) { return c.id === castId; });
    }

    function pvGetCastDisplay(drama, castId) {
        var m = pvGetCastMember(drama, castId);
        if (!m) return { name: '旁白', avatar: '' };
        return { name: m.name, avatar: m.avatar || '' };
    }

    // ========== 状态管理 ==========
    var pvState = {
        view: 'home',        // home | detail | theater | perform | casting | wizard | settings | npc-edit | script-edit | twist | search | history | reviews | collections | branches | relations | recap | export
        tab: 'recommend',    // recommend | hot | following | mine
        currentDramaId: null,
        currentEpIndex: 0,
        currentSceneIndex: 0,
        theaterPlaying: false,
        theaterSpeed: 1,
        theaterTimer: null,
        theaterQueue: [],
        theaterQueueIndex: 0,
        danmakuEnabled: true,
        danmakuTimers: [],
        watchRoom: null,
        performMode: false,
        performUserRole: null,
        performPartnerRoles: {},
        wizardStep: 0,
        wizardData: {},
        editingNpcId: null,
        editingEpIndex: null,
        pivotState: null,
        filterGenre: null,
        searchQuery: '',
    };

    // ========== 渲染入口 ==========
    window.renderPenguinVideo = function() {
        pvInit();
        pvRender();
    };

    function pvRender() {
        var layer = document.getElementById('layer-penguin-video');
        if (!layer) return;
        var content = document.getElementById('pv-content');
        if (!content) {
            layer.innerHTML = '<div class="pv-app" id="pv-content" style="display:flex;flex-direction:column;height:100%;"></div>';
            content = document.getElementById('pv-content');
        }

        switch (pvState.view) {
            case 'home': pvRenderHome(content); break;
            case 'detail': pvRenderDetail(content); break;
            case 'theater': pvRenderTheater(content); break;
            case 'perform': pvRenderPerform(content); break;
            case 'casting': pvRenderCasting(content); break;
            case 'wizard': pvRenderWizard(content); break;
            case 'settings': pvRenderSettings(content); break;
            case 'npc-edit': pvRenderNpcEdit(content); break;
            case 'script-edit': pvRenderScriptEdit(content); break;
            case 'twist': pvRenderTwist(content); break;
            case 'search': pvRenderSearch(content); break;
            case 'history': pvRenderHistory(content); break;
            case 'reviews': pvRenderReviews(content); break;
            case 'collections': pvRenderCollections(content); break;
            case 'branches': pvRenderBranches(content); break;
            case 'relations': pvRenderRelations(content); break;
            case 'recap': pvRenderRecap(content); break;
            case 'export': pvRenderExport(content); break;
            default: pvRenderHome(content);
        }
    }

    // ========== 首页 ==========
    function pvRenderHome(el) {
        pvStopTheater();
        var dramas = store.penguinVideo.dramas || [];
        var following = store.penguinVideo.following || [];

        var html = '';
        // 导航栏
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="exitApp()">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">企鹅视频</div>';
        html += '<div class="pv-nav-actions">';
        html += '<button class="pv-nav-btn" onclick="pvGo(\'search\')" title="搜索">' + PV_SVG.search + '</button>';
        html += '<button class="pv-nav-btn" onclick="pvGo(\'history\')" title="历史">' + PV_SVG.eye + '</button>';
        html += '<button class="pv-nav-btn" onclick="pvGo(\'collections\')" title="收藏夹">' + PV_SVG.bookmark + '</button>';
        html += '<button class="pv-nav-btn" onclick="pvGo(\'settings\')" title="设置">' + PV_SVG.cog + '</button>';
        html += '</div></div>';

        // 标签页
        html += '<div class="pv-tabs">';
        ['recommend','hot','following','mine'].forEach(function(t) {
            var names = { recommend:'推荐', hot:'热播', following:'追剧', mine:'我的' };
            html += '<button class="pv-tab' + (pvState.tab === t ? ' active' : '') + '" onclick="pvSwitchTab(\'' + t + '\')">' + names[t] + '</button>';
        });
        html += '</div>';

        // 内容区
        html += '<div class="pv-scroll" id="pv-home-scroll">';

        if (pvState.tab === 'recommend') {
            html += pvRenderRecommend(dramas);
        } else if (pvState.tab === 'hot') {
            html += pvRenderHot(dramas);
        } else if (pvState.tab === 'following') {
            html += pvRenderFollowing(following, dramas);
        } else if (pvState.tab === 'mine') {
            html += pvRenderMine(dramas);
        }

        html += '</div>';

        // FAB创建按钮
        html += '<button class="pv-fab" onclick="pvStartWizard()" title="创作新剧">' + PV_SVG.plus + '</button>';

        el.innerHTML = html;
    }

    function pvRenderRecommend(dramas) {
        var html = '';

        // 一起看入口
        html += '<div class="pv-section">';
        html += '<div class="pv-section-header">';
        html += '<div class="pv-section-title">和TA一起看</div>';
        html += '</div>';
        html += '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
        var contacts = (store.contacts || []).slice(0, 6);
        if (contacts.length === 0) {
            html += '<div style="color:var(--pv-text3);font-size:13px;padding:10px;">还没有联系人，先去微信添加吧</div>';
        }
        contacts.forEach(function(c) {
            html += '<div style="display:flex;flex-direction:column;align-items:center;width:60px;cursor:pointer;" onclick="pvQuickWatch(\'' + c.id + '\')">';
            html += '<div style="width:44px;height:44px;border-radius:50%;overflow:hidden;background:var(--pv-card);border:1px solid var(--pv-border);display:flex;align-items:center;justify-content:center;">';
            if (c.avatar) html += '<img src="' + pvEsc(c.avatar) + '" style="width:100%;height:100%;object-fit:cover;">';
            else html += '<span style="color:var(--pv-text3);">' + PV_SVG.people + '</span>';
            html += '</div>';
            html += '<span style="font-size:11px;color:var(--pv-text);margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60px;">' + pvEsc(c.remark || c.name) + '</span>';
            html += '</div>';
        });
        html += '</div></div>';

        // 我的剧集
        if (dramas.length > 0) {
            html += '<div class="pv-section">';
            html += '<div class="pv-section-header"><div class="pv-section-title">我的作品</div>';
            html += '<div class="pv-section-more" onclick="pvSwitchTab(\'mine\')">查看全部 ' + PV_SVG.arrow + '</div></div>';
            html += '<div class="pv-hscroll">';
            dramas.slice(0, 8).forEach(function(d) {
                html += pvRenderDramaHCard(d);
            });
            html += '</div></div>';
        }

        // 热门剧本模板
        html += '<div class="pv-section">';
        html += '<div class="pv-section-header"><div class="pv-section-title">热门狗血模板</div></div>';
        html += '<div class="pv-hscroll">';
        PV_DOGBLOOD_TEMPLATES.forEach(function(t, i) {
            html += '<div class="pv-hscroll-card" onclick="pvCreateFromTemplate(' + i + ')">';
            html += '<div class="pv-hscroll-cover" style="background:var(--pv-accent2);">';
            html += '<div style="text-align:center;color:rgba(255,255,255,0.8);font-size:12px;padding:10px;">' + PV_SVG.magic + '<div style="margin-top:8px;">' + pvEsc(t.name) + '</div></div>';
            html += '</div>';
            html += '<div class="pv-hscroll-title">' + pvEsc(t.name) + '</div>';
            html += '<div class="pv-hscroll-sub">' + pvEsc(t.desc) + '</div>';
            html += '</div>';
        });
        html += '</div></div>';

        // 快速开始
        if (dramas.length === 0) {
            html += '<div class="pv-empty">';
            html += PV_SVG.theater;
            html += '<div class="pv-empty-text">还没有剧集，创作你的第一部吧</div>';
            html += '<button class="pv-empty-btn" onclick="pvStartWizard()">开始创作</button>';
            html += '</div>';
        }

        // 按类型浏览
        html += '<div class="pv-section">';
        html += '<div class="pv-section-header"><div class="pv-section-title">按类型浏览</div></div>';
        html += '<div class="pv-genre-grid">';
        Object.keys(PV_GENRES).forEach(function(g) {
            html += '<div class="pv-genre-item" onclick="pvFilterByGenre(\'' + g + '\')">';
            html += '<div class="pv-genre-icon">' + (PV_GENRE_ICONS[g] || PV_SVG.film) + '</div>';
            html += PV_GENRES[g];
            html += '</div>';
        });
        html += '</div></div>';

        html += '<div style="height:80px;"></div>';
        return html;
    }

    function pvRenderHot(dramas) {
        if (dramas.length === 0) {
            return '<div class="pv-empty">' + PV_SVG.fire + '<div class="pv-empty-text">暂无热播剧集</div><button class="pv-empty-btn" onclick="pvStartWizard()">创建第一部</button></div>';
        }
        var sorted = dramas.slice().sort(function(a, b) {
            var sa = (a.episodes || []).reduce(function(s, ep) { return s + (ep.scenes || []).length; }, 0);
            var sb = (b.episodes || []).reduce(function(s, ep) { return s + (ep.scenes || []).length; }, 0);
            return sb - sa;
        });
        var html = '';
        sorted.forEach(function(d, i) {
            var epCount = (d.episodes || []).length;
            var sceneCount = (d.episodes || []).reduce(function(s, ep) { return s + (ep.scenes || []).length; }, 0);
            html += '<div class="pv-rank-item" onclick="pvOpenDrama(\'' + d.id + '\')">';
            html += '<div class="pv-rank-num' + (i < 3 ? ' top' + (i + 1) : '') + '">' + (i + 1) + '</div>';
            html += '<div class="pv-rank-cover">';
            if (d.cover) html += '<img src="' + pvEsc(d.cover) + '">';
            else html += '<span style="color:rgba(255,255,255,0.4);">' + PV_SVG.film + '</span>';
            html += '</div>';
            html += '<div class="pv-rank-info">';
            html += '<div class="pv-rank-title">' + pvEsc(d.title) + '</div>';
            html += '<div class="pv-rank-meta">' + (PV_GENRES[d.genre] || '其他') + ' · ' + epCount + '集 · ' + sceneCount + '个场景</div>';
            html += '</div>';
            html += '<div class="pv-rank-heat">' + PV_SVG.fire + ' ' + sceneCount + '</div>';
            html += '</div>';
        });
        html += '<div style="height:80px;"></div>';
        return html;
    }

    function pvRenderFollowing(following, dramas) {
        if (following.length === 0) {
            return '<div class="pv-empty">' + PV_SVG.bookmark + '<div class="pv-empty-text">还没有追剧</div><button class="pv-empty-btn" onclick="pvSwitchTab(\'recommend\')">去发现</button></div>';
        }
        var html = '';
        following.forEach(function(f) {
            var d = dramas.find(function(x) { return x.id === f.dramaId; });
            if (!d) return;
            var epCount = (d.episodes || []).length;
            var progress = f.progress || 0;
            html += '<div class="pv-follow-item" onclick="pvOpenDrama(\'' + d.id + '\')">';
            html += '<div class="pv-follow-cover">';
            if (d.cover) html += '<img src="' + pvEsc(d.cover) + '">';
            else html += PV_SVG.film;
            html += '</div>';
            html += '<div class="pv-follow-info">';
            html += '<div class="pv-follow-title">' + pvEsc(d.title) + '</div>';
            html += '<div class="pv-follow-ep">看到第' + ((f.lastEp || 0) + 1) + '集 · 共' + epCount + '集</div>';
            html += '<div class="pv-follow-progress-bar"><div class="pv-follow-progress-fill" style="width:' + (progress * 100) + '%;"></div></div>';
            html += '</div></div>';
        });
        html += '<div style="height:80px;"></div>';
        return html;
    }

    function pvRenderMine(dramas) {
        var filtered = dramas;
        if (pvState.filterGenre) {
            filtered = dramas.filter(function(d) { return d.genre === pvState.filterGenre; });
        }
        var html = '';
        // 类型过滤标签
        if (pvState.filterGenre) {
            html += '<div style="padding:8px 12px;display:flex;align-items:center;gap:6px;">';
            html += '<span style="font-size:12px;color:var(--pv-text2);">筛选:</span>';
            html += '<span style="font-size:12px;color:var(--pv-accent);background:rgba(233,69,96,0.08);padding:2px 8px;border-radius:10px;">' + (PV_GENRES[pvState.filterGenre] || pvState.filterGenre) + '</span>';
            html += '<button style="background:none;border:none;color:var(--pv-text3);cursor:pointer;font-size:12px;" onclick="pvClearFilter()">清除</button>';
            html += '</div>';
        }
        if (filtered.length === 0) {
            return html + '<div class="pv-empty">' + PV_SVG.pen + '<div class="pv-empty-text">' + (pvState.filterGenre ? '该类型下暂无剧集' : '还没有创作') + '</div><button class="pv-empty-btn" onclick="pvStartWizard()">开始创作</button></div>';
        }
        html += '<div class="pv-drama-grid">';
        filtered.forEach(function(d) {
            html += pvRenderDramaCard(d);
        });
        html += '</div><div style="height:80px;"></div>';
        return html;
    }

    function pvRenderDramaCard(d) {
        var epCount = (d.episodes || []).length;
        var statusText = d.status === 'completed' ? '已完结' : d.status === 'draft' ? '草稿' : '连载中';
        var html = '<div class="pv-drama-card" onclick="pvOpenDrama(\'' + d.id + '\')">';
        html += '<div class="pv-drama-cover">';
        if (d.cover) html += '<img src="' + pvEsc(d.cover) + '">';
        else html += '<div class="pv-drama-cover-placeholder">' + PV_SVG.film + '<span>暂无封面</span></div>';
        html += '<div class="pv-drama-badge">' + statusText + '</div>';
        html += '</div>';
        html += '<div class="pv-drama-info">';
        html += '<div class="pv-drama-title">' + pvEsc(d.title) + '</div>';
        html += '<div class="pv-drama-meta">' + (PV_GENRES[d.genre] || '') + ' · ' + epCount + '集</div>';
        if (d.tags && d.tags.length) {
            html += '<div class="pv-drama-tags">';
            d.tags.slice(0, 3).forEach(function(t) { html += '<span class="pv-drama-tag">' + pvEsc(t) + '</span>'; });
            html += '</div>';
        }
        html += '</div></div>';
        return html;
    }

    function pvRenderDramaHCard(d) {
        var html = '<div class="pv-hscroll-card" onclick="pvOpenDrama(\'' + d.id + '\')">';
        html += '<div class="pv-hscroll-cover">';
        if (d.cover) html += '<img src="' + pvEsc(d.cover) + '">';
        else html += PV_SVG.film;
        html += '</div>';
        html += '<div class="pv-hscroll-title">' + pvEsc(d.title) + '</div>';
        html += '<div class="pv-hscroll-sub">' + ((d.episodes || []).length) + '集</div>';
        html += '</div>';
        return html;
    }

    // ========== 剧集详情页 ==========
    function pvRenderDetail(el) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) { pvState.view = 'home'; pvRender(); return; }

        var epCount = (drama.episodes || []).length;
        var castCount = (drama.cast || []).length;

        var html = '';
        // 导航
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'home\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">' + pvEsc(drama.title) + '</div>';
        html += '<div class="pv-nav-actions">';
        html += '<button class="pv-nav-btn" onclick="pvDeleteDrama(\'' + drama.id + '\')" title="删除">' + PV_SVG.trash + '</button>';
        html += '<button class="pv-nav-btn" onclick="pvShowDramaMore(\'' + drama.id + '\')" title="更多">' + PV_SVG.more + '</button>';
        html += '</div></div>';

        html += '<div class="pv-scroll">';

        // 详情头部
        html += '<div class="pv-detail-header">';
        html += '<div class="pv-detail-cover">';
        if (drama.cover) html += '<img src="' + pvEsc(drama.cover) + '">';
        else html += PV_SVG.film;
        html += '</div>';
        html += '<div class="pv-detail-info">';
        html += '<div class="pv-detail-title">' + pvEsc(drama.title) + '</div>';
        if (drama.genre) html += '<div class="pv-detail-genre">' + (PV_GENRES[drama.genre] || drama.genre) + '</div>';
        if (drama.synopsis) html += '<div class="pv-detail-synopsis">' + pvEsc(drama.synopsis) + '</div>';
        html += '<div class="pv-detail-stats">';
        html += '<div class="pv-detail-stat">' + PV_SVG.film + ' ' + epCount + '集</div>';
        html += '<div class="pv-detail-stat">' + PV_SVG.cast + ' ' + castCount + '角色</div>';
        html += '</div>';
        html += '</div></div>';

        // 动作栏
        html += '<div class="pv-detail-actions">';
        if (epCount > 0) {
            html += '<button class="pv-action-btn primary" onclick="pvStartTheater(\'' + drama.id + '\', 0)">' + PV_SVG.play + ' 播放</button>';
            html += '<button class="pv-action-btn secondary" onclick="pvStartWatchTogether(\'' + drama.id + '\')">' + PV_SVG.together + ' 一起看</button>';
            html += '<button class="pv-action-btn secondary" onclick="pvStartCasting(\'' + drama.id + '\')">' + PV_SVG.cast + ' 演绎</button>';
        } else {
            html += '<button class="pv-action-btn primary" onclick="pvAddEpisode(\'' + drama.id + '\')">' + PV_SVG.plus + ' 添加第一集</button>';
        }
        html += '</div>';

        // 扩展功能快捷栏
        var isFollowing = (store.penguinVideo.following || []).some(function(f) { return f.dramaId === drama.id; });
        html += '<div class="pv-feature-bar">';
        html += '<button class="pv-feature-btn' + (isFollowing ? ' active' : '') + '" onclick="pvToggleFollow(\'' + drama.id + '\')" title="追剧">';
        html += '<span class="pv-feature-icon">' + PV_SVG.bookmark + '</span><span class="pv-feature-label">' + (isFollowing ? '已追' : '追剧') + '</span></button>';
        html += '<button class="pv-feature-btn" onclick="pvAddToCollection(\'' + drama.id + '\')" title="收藏">';
        html += '<span class="pv-feature-icon">' + PV_SVG.heart + '</span><span class="pv-feature-label">收藏</span></button>';
        html += '<button class="pv-feature-btn" onclick="pvOpenReviews(\'' + drama.id + '\')" title="短评">';
        html += '<span class="pv-feature-icon">' + PV_SVG.star + '</span><span class="pv-feature-label">短评</span></button>';
        html += '<button class="pv-feature-btn" onclick="pvOpenRelations(\'' + drama.id + '\')" title="关系">';
        html += '<span class="pv-feature-icon">' + PV_SVG.people + '</span><span class="pv-feature-label">关系</span></button>';
        html += '<button class="pv-feature-btn" onclick="pvOpenBranches(\'' + drama.id + '\')" title="分支">';
        html += '<span class="pv-feature-icon">' + PV_SVG.twist + '</span><span class="pv-feature-label">分支</span></button>';
        html += '<button class="pv-feature-btn" onclick="pvOpenRecap(\'' + drama.id + '\')" title="回顾">';
        html += '<span class="pv-feature-icon">' + PV_SVG.eye + '</span><span class="pv-feature-label">回顾</span></button>';
        html += '<button class="pv-feature-btn" onclick="pvOpenExport(\'' + drama.id + '\')" title="导出">';
        html += '<span class="pv-feature-icon">' + PV_SVG.send + '</span><span class="pv-feature-label">导出</span></button>';
        html += '</div>';

        // 角色列表
        html += '<div class="pv-cast-section">';
        html += '<div class="pv-cast-title">角色表 (' + castCount + ')</div>';
        html += '<div class="pv-cast-list">';
        (drama.cast || []).forEach(function(c) {
            html += '<div class="pv-cast-item" onclick="pvEditNpc(\'' + drama.id + '\', \'' + c.id + '\')">';
            html += '<div class="pv-cast-avatar' + (c.playedBy === 'user' ? ' user-played' : c.playedBy ? ' contact-played' : '') + '">';
            if (c.avatar) html += '<img src="' + pvEsc(c.avatar) + '">';
            else html += PV_SVG.people;
            html += '</div>';
            html += '<div class="pv-cast-name">' + pvEsc(c.name) + '</div>';
            html += '<div class="pv-cast-role">' + (c.role === 'lead' ? '主角' : c.role === 'supporting' ? '配角' : '群演') + '</div>';
            html += '</div>';
        });
        // 添加角色
        html += '<div class="pv-cast-item" onclick="pvEditNpc(\'' + drama.id + '\', null)">';
        html += '<div class="pv-cast-add">' + PV_SVG.plus + '</div>';
        html += '<div class="pv-cast-name">添加角色</div>';
        html += '<div class="pv-cast-role"></div>';
        html += '</div>';
        html += '</div></div>';

        // 章节列表
        html += '<div class="pv-episodes">';
        html += '<div class="pv-episodes-title">章节列表 (' + epCount + ')';
        html += '<button class="pv-btn pv-btn-sm pv-btn-ai" onclick="pvAiGenerateEpisode(\'' + drama.id + '\')">' + PV_SVG.magic + ' AI生成新集</button>';
        html += '</div>';
        (drama.episodes || []).forEach(function(ep, idx) {
            var sceneCount = (ep.scenes || []).length;
            html += '<div class="pv-ep-item">';
            html += '<div class="pv-ep-num">' + (idx + 1) + '</div>';
            html += '<div class="pv-ep-info" onclick="pvEditScript(\'' + drama.id + '\', ' + idx + ')">';
            html += '<div class="pv-ep-title">' + pvEsc(ep.title || ('第' + (idx + 1) + '集')) + '</div>';
            html += '<div class="pv-ep-scenes">' + sceneCount + '个场景' + (ep.generated ? '' : ' · 待生成') + '</div>';
            html += '</div>';
            html += '<div class="pv-ep-actions">';
            html += '<button class="pv-ep-btn" onclick="pvStartTheater(\'' + drama.id + '\', ' + idx + ')" title="播放">' + PV_SVG.play + '</button>';
            html += '<button class="pv-ep-btn" onclick="pvEditScript(\'' + drama.id + '\', ' + idx + ')" title="编辑">' + PV_SVG.pen + '</button>';
            html += '<button class="pv-ep-btn" onclick="pvDeleteEpisode(\'' + drama.id + '\', ' + idx + ')" title="删除">' + PV_SVG.trash + '</button>';
            html += '</div></div>';
        });
        // 手动添加章节
        html += '<div class="pv-ep-item" onclick="pvAddEpisode(\'' + drama.id + '\')" style="justify-content:center;color:var(--pv-text3);cursor:pointer;">';
        html += PV_SVG.plus + ' <span style="margin-left:6px;">添加新章节</span>';
        html += '</div>';
        html += '</div>';

        html += '<div style="height:30px;"></div>';
        html += '</div>';

        el.innerHTML = html;
    }

    // ========== 创作向导 ==========
    function pvRenderWizard(el) {
        var step = pvState.wizardStep;
        var data = pvState.wizardData;
        var totalSteps = 4;

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'home\')">' + PV_SVG.close + '</div>';
        html += '<div class="pv-nav-title">创作新剧</div>';
        html += '<div class="pv-nav-actions"></div></div>';

        // 进度条
        html += '<div class="pv-wizard-progress">';
        for (var i = 0; i < totalSteps; i++) {
            html += '<div class="pv-wizard-dot' + (i < step ? ' done' : i === step ? ' current' : '') + '"></div>';
        }
        html += '</div>';

        html += '<div class="pv-scroll" style="padding:16px;">';

        if (step === 0) {
            // 步骤1：选择类型
            html += '<div style="font-size:18px;font-weight:700;color:var(--pv-text);margin-bottom:16px;">选择剧集类型</div>';
            html += '<div class="pv-genre-grid">';
            Object.keys(PV_GENRES).forEach(function(g) {
                html += '<div class="pv-genre-item' + (data.genre === g ? ' selected' : '') + '" onclick="pvWizardSelectGenre(\'' + g + '\')">';
                html += '<div class="pv-genre-icon">' + (PV_GENRE_ICONS[g] || PV_SVG.film) + '</div>';
                html += PV_GENRES[g];
                html += '</div>';
            });
            html += '</div>';
        } else if (step === 1) {
            // 步骤2：基本信息
            html += '<div style="font-size:18px;font-weight:700;color:var(--pv-text);margin-bottom:16px;">填写基本信息</div>';
            html += '<div class="pv-form-group">';
            html += '<label class="pv-form-label">剧名</label>';
            html += '<input class="pv-input" id="pv-wizard-title" value="' + pvEsc(data.title || '') + '" placeholder="给你的剧取个名字">';
            html += '</div>';
            html += '<div class="pv-form-group">';
            html += '<label class="pv-form-label">简介</label>';
            html += '<textarea class="pv-textarea" id="pv-wizard-synopsis" placeholder="简单描述一下剧情...">' + pvEsc(data.synopsis || '') + '</textarea>';
            html += '</div>';
            html += '<div class="pv-form-group">';
            html += '<label class="pv-form-label">标签 (逗号分隔)</label>';
            html += '<input class="pv-input" id="pv-wizard-tags" value="' + pvEsc((data.tags || []).join(',')) + '" placeholder="如：古装,虐恋,权谋">';
            html += '</div>';
            html += '<button class="pv-btn pv-btn-ai pv-btn-full" onclick="pvWizardAiSuggest()" style="margin-top:8px;">' + PV_SVG.magic + ' AI帮我想</button>';
        } else if (step === 2) {
            // 步骤3：角色设定
            html += '<div style="font-size:18px;font-weight:700;color:var(--pv-text);margin-bottom:8px;">设定角色</div>';
            html += '<div class="pv-form-hint" style="margin-bottom:16px;">至少添加2个角色。你也可以先跳过，之后再添加。</div>';

            (data.cast || []).forEach(function(c, idx) {
                html += '<div class="pv-casting-card">';
                html += '<div class="pv-casting-avatar">' + PV_SVG.people + '</div>';
                html += '<div class="pv-casting-info">';
                html += '<div class="pv-casting-name">' + pvEsc(c.name) + '</div>';
                html += '<div class="pv-casting-role-tag">' + (c.role === 'lead' ? '主角' : '配角') + '</div>';
                html += '</div>';
                html += '<button class="pv-btn pv-btn-sm pv-btn-secondary" onclick="pvWizardRemoveCast(' + idx + ')">' + PV_SVG.trash + '</button>';
                html += '</div>';
            });

            html += '<div style="display:flex;gap:8px;margin-top:12px;">';
            html += '<button class="pv-btn pv-btn-secondary" style="flex:1;" onclick="pvWizardAddCastManual()">' + PV_SVG.plus + ' 手动添加</button>';
            html += '<button class="pv-btn pv-btn-ai" style="flex:1;" onclick="pvWizardAiCast()">' + PV_SVG.magic + ' AI推荐角色</button>';
            html += '</div>';
        } else if (step === 3) {
            // 步骤4：确认并生成
            html += '<div style="font-size:18px;font-weight:700;color:var(--pv-text);margin-bottom:16px;">确认并生成</div>';
            html += '<div style="background:var(--pv-card);border:1px solid var(--pv-border);border-radius:var(--pv-radius);padding:16px;margin-bottom:16px;">';
            html += '<div style="font-size:16px;font-weight:600;color:var(--pv-text);margin-bottom:8px;">' + pvEsc(data.title || '未命名') + '</div>';
            html += '<div style="font-size:12px;color:var(--pv-accent);margin-bottom:6px;">' + (PV_GENRES[data.genre] || '') + '</div>';
            if (data.synopsis) html += '<div style="font-size:13px;color:var(--pv-text2);line-height:1.5;margin-bottom:8px;">' + pvEsc(data.synopsis) + '</div>';
            html += '<div style="font-size:12px;color:var(--pv-text3);">角色: ' + (data.cast || []).map(function(c) { return pvEsc(c.name); }).join('、') + '</div>';
            html += '</div>';

            html += '<div class="pv-form-group">';
            html += '<label class="pv-form-label">第一集标题 (可选)</label>';
            html += '<input class="pv-input" id="pv-wizard-ep1-title" value="" placeholder="如：初遇">';
            html += '</div>';

            html += '<div class="pv-form-group">';
            html += '<label class="pv-form-label">第一集要求 (可选)</label>';
            html += '<textarea class="pv-textarea" id="pv-wizard-ep1-req" placeholder="对第一集的剧情有什么要求？如：两人在雨中偶遇..."></textarea>';
            html += '</div>';

            html += '<button class="pv-btn pv-btn-primary pv-btn-full" onclick="pvWizardFinish(true)" style="margin-bottom:8px;">' + PV_SVG.magic + ' 创建并AI生成第一集</button>';
            html += '<button class="pv-btn pv-btn-secondary pv-btn-full" onclick="pvWizardFinish(false)">仅创建空剧集</button>';
        }

        html += '</div>';

        // 底部按钮
        html += '<div style="padding:12px 16px;border-top:1px solid var(--pv-border);display:flex;gap:10px;">';
        if (step > 0) html += '<button class="pv-btn pv-btn-secondary" style="flex:1;" onclick="pvWizardPrev()">上一步</button>';
        if (step < totalSteps - 1) html += '<button class="pv-btn pv-btn-primary" style="flex:1;" onclick="pvWizardNext()">下一步</button>';
        html += '</div>';

        el.innerHTML = html;
    }

    // ========== NPC编辑 ==========
    function pvRenderNpcEdit(el) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) { pvGo('home'); return; }
        var npc = pvState.editingNpcId ? pvGetCastMember(drama, pvState.editingNpcId) : null;
        var isNew = !npc;

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'detail\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">' + (isNew ? '添加角色' : '编辑角色') + '</div>';
        html += '<div class="pv-nav-actions">';
        if (!isNew) html += '<button class="pv-nav-btn" onclick="pvDeleteNpc(\'' + drama.id + '\',\'' + npc.id + '\')" title="删除">' + PV_SVG.trash + '</button>';
        html += '</div></div>';

        html += '<div class="pv-scroll" style="padding:16px;">';

        html += '<div class="pv-form-group">';
        html += '<label class="pv-form-label">角色名</label>';
        html += '<input class="pv-input" id="pv-npc-name" value="' + pvEsc(npc ? npc.name : '') + '" placeholder="角色名字">';
        html += '</div>';

        html += '<div class="pv-form-group">';
        html += '<label class="pv-form-label">定位</label>';
        html += '<select class="pv-select" id="pv-npc-role">';
        html += '<option value="lead"' + (npc && npc.role === 'lead' ? ' selected' : '') + '>主角</option>';
        html += '<option value="supporting"' + (npc && npc.role === 'supporting' ? ' selected' : '') + '>配角</option>';
        html += '<option value="extra"' + (npc && npc.role === 'extra' ? ' selected' : '') + '>群演</option>';
        html += '</select></div>';

        html += '<div class="pv-form-group">';
        html += '<label class="pv-form-label">人设描述</label>';
        html += '<textarea class="pv-textarea" id="pv-npc-persona" style="min-height:120px;" placeholder="角色的性格、背景、外貌、说话风格...">' + pvEsc(npc ? npc.persona : '') + '</textarea>';
        html += '<button class="pv-btn pv-btn-sm pv-btn-ai" onclick="pvAiGenPersona()" style="margin-top:6px;">' + PV_SVG.magic + ' AI生成人设</button>';
        html += '</div>';

        html += '<div class="pv-form-group">';
        html += '<label class="pv-form-label">语气风格</label>';
        html += '<input class="pv-input" id="pv-npc-voice" value="' + pvEsc(npc ? npc.voiceStyle : '') + '" placeholder="如：冷酷、温柔、毒舌...">';
        html += '</div>';

        html += '<div class="pv-form-group">';
        html += '<label class="pv-form-label">扮演者</label>';
        html += '<select class="pv-select" id="pv-npc-playedby">';
        html += '<option value="">AI演绎</option>';
        html += '<option value="user"' + (npc && npc.playedBy === 'user' ? ' selected' : '') + '>我来演</option>';
        (store.contacts || []).forEach(function(c) {
            html += '<option value="' + c.id + '"' + (npc && npc.playedBy === c.id ? ' selected' : '') + '>' + pvEsc(c.remark || c.name) + ' (AI模拟)</option>';
        });
        html += '</select>';
        html += '<div class="pv-form-hint">选择联系人后，AI会根据联系人的人设来演绎该角色</div>';
        html += '</div>';

        html += '</div>';

        html += '<div style="padding:12px 16px;border-top:1px solid var(--pv-border);">';
        html += '<button class="pv-btn pv-btn-primary pv-btn-full" onclick="pvSaveNpc()">' + (isNew ? '添加角色' : '保存修改') + '</button>';
        html += '</div>';

        el.innerHTML = html;
    }

    // ========== 剧本编辑器 ==========
    function pvRenderScriptEdit(el) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) { pvGo('home'); return; }
        var epIdx = pvState.editingEpIndex;
        var ep = (drama.episodes || [])[epIdx];
        if (!ep) { pvGo('detail'); return; }

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'detail\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">' + pvEsc(ep.title || ('第' + (epIdx + 1) + '集')) + '</div>';
        html += '<div class="pv-nav-actions">';
        html += '<button class="pv-nav-btn" onclick="pvAiExpandEpisode(\'' + drama.id + '\',' + epIdx + ')" title="AI扩写">' + PV_SVG.magic + '</button>';
        html += '<button class="pv-nav-btn" onclick="pvAddScene(\'' + drama.id + '\',' + epIdx + ')" title="添加场景">' + PV_SVG.plus + '</button>';
        html += '</div></div>';

        html += '<div class="pv-scroll">';

        // 标题编辑
        html += '<div style="padding:12px 16px;">';
        html += '<input class="pv-input" id="pv-ep-title" value="' + pvEsc(ep.title || '') + '" placeholder="章节标题" onchange="pvUpdateEpTitle(\'' + drama.id + '\',' + epIdx + ')">';
        html += '</div>';

        var scenes = ep.scenes || [];
        if (scenes.length === 0) {
            html += '<div class="pv-empty">';
            html += PV_SVG.script;
            html += '<div class="pv-empty-text">还没有场景</div>';
            html += '<div style="display:flex;gap:8px;">';
            html += '<button class="pv-empty-btn" onclick="pvAddScene(\'' + drama.id + '\',' + epIdx + ')">手动添加</button>';
            html += '<button class="pv-btn pv-btn-ai" onclick="pvAiGenerateScenes(\'' + drama.id + '\',' + epIdx + ')">' + PV_SVG.magic + ' AI生成</button>';
            html += '</div></div>';
        }

        scenes.forEach(function(scene, sIdx) {
            html += '<div class="pv-scene-card">';
            html += '<div class="pv-scene-header">';
            html += '<div class="pv-scene-num">场景 ' + (sIdx + 1) + '</div>';
            html += '<div class="pv-scene-setting">' + pvEsc(scene.setting || '未设定场景') + '</div>';
            html += '<button style="background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;" onclick="pvEditScene(\'' + drama.id + '\',' + epIdx + ',' + sIdx + ')">' + PV_SVG.pen + '</button>';
            html += '<button style="background:none;border:none;color:rgba(255,255,255,0.5);cursor:pointer;" onclick="pvDeleteScene(\'' + drama.id + '\',' + epIdx + ',' + sIdx + ')">' + PV_SVG.trash + '</button>';
            html += '</div>';
            html += '<div class="pv-scene-body">';
            if (scene.direction) {
                html += '<div class="pv-scene-direction">' + pvEsc(scene.direction) + '</div>';
            }
            (scene.dialogues || []).forEach(function(d) {
                var castInfo = pvGetCastDisplay(drama, d.castId);
                html += '<div class="pv-dialogue">';
                html += '<div class="pv-dialogue-avatar">';
                if (castInfo.avatar) html += '<img src="' + pvEsc(castInfo.avatar) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
                else html += pvEsc(castInfo.name).charAt(0);
                html += '</div>';
                html += '<div class="pv-dialogue-content">';
                html += '<div class="pv-dialogue-name">' + pvEsc(castInfo.name) + '</div>';
                if (d.action) html += '<div class="pv-dialogue-action">' + pvEsc(d.action) + '</div>';
                html += '<div class="pv-dialogue-line">' + pvRenderPivotText(d.line, scene.pivotWords, drama.id, epIdx, sIdx) + '</div>';
                html += '</div></div>';
            });

            // 转折点提示
            if (scene.pivotWords && scene.pivotWords.length > 0) {
                html += '<div style="margin-top:8px;padding:8px 10px;background:rgba(233,69,96,0.05);border-radius:var(--pv-radius-sm);border:1px dashed rgba(233,69,96,0.3);">';
                html += '<div style="font-size:11px;color:var(--pv-accent);font-weight:600;margin-bottom:4px;">' + PV_SVG.twist + ' 转折点</div>';
                html += '<div style="font-size:12px;color:var(--pv-text2);">';
                scene.pivotWords.forEach(function(p) {
                    html += '<span style="margin-right:8px;">「' + pvEsc(p.original) + '」</span>';
                });
                html += '</div></div>';
            }

            html += '</div></div>';
        });

        html += '<div style="padding:16px;">';
        html += '<button class="pv-btn pv-btn-secondary pv-btn-full" onclick="pvAddScene(\'' + drama.id + '\',' + epIdx + ')">' + PV_SVG.plus + ' 添加场景</button>';
        html += '</div>';

        html += '<div style="height:30px;"></div>';
        html += '</div>';

        el.innerHTML = html;
    }

    function pvRenderPivotText(line, pivotWords, dramaId, epIdx, sIdx) {
        if (!line) return '';
        if (!pivotWords || pivotWords.length === 0) return pvEsc(line);

        var result = pvEsc(line);
        pivotWords.forEach(function(pw) {
            var escaped = pvEsc(pw.original);
            var safeRegex = pvEscapeRegex(escaped);
            result = result.replace(new RegExp(safeRegex, 'g'),
                '<span class="pv-pivot-word" onclick="event.stopPropagation();pvOpenPivot(\'' + dramaId + '\',' + epIdx + ',' + sIdx + ',\'' + pvEsc(pw.original).replace(/'/g, "\\'") + '\')">' + escaped + '</span>'
            );
        });
        return result;
    }

    // ========== 放映厅 ==========
    function pvRenderTheater(el) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) { pvGo('home'); return; }
        var ep = (drama.episodes || [])[pvState.currentEpIndex];
        if (!ep) { pvGo('detail'); return; }

        var html = '';
        // 顶部
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvExitTheater()">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">' + pvEsc(drama.title) + ' · ' + pvEsc(ep.title || ('第' + (pvState.currentEpIndex + 1) + '集')) + '</div>';
        html += '<div class="pv-nav-actions">';
        html += '<button class="pv-nav-btn' + (pvState.danmakuEnabled ? ' active' : '') + '" onclick="pvToggleDanmaku()" title="弹幕" style="' + (pvState.danmakuEnabled ? 'color:var(--pv-accent);' : '') + '">' + PV_SVG.danmaku + '</button>';
        html += '<button class="pv-nav-btn" onclick="pvOpenTwistFromTheater()" title="改写命运">' + PV_SVG.twist + '</button>';
        html += '</div></div>';

        // 弹幕飘过区
        html += '<div class="pv-danmaku-zone" id="pv-danmaku-zone"></div>';

        // 剧情内容区
        html += '<div class="pv-theater-content" id="pv-theater-content">';
        // 场景标题
        var scene = (ep.scenes || [])[pvState.currentSceneIndex];
        if (scene) {
            html += '<div class="pv-theater-scene-title">';
            html += '<div class="pv-theater-scene-bracket">—— 场景 ' + (pvState.currentSceneIndex + 1) + ' ——</div>';
            html += pvEsc(scene.setting || '');
            html += '</div>';
        }
        // 已渲染的内容
        html += '<div id="pv-theater-rendered"></div>';
        // 加载提示
        html += '<div id="pv-theater-loading" style="display:none;">';
        html += '<div class="pv-loading"><div class="pv-loading-dots"><span></span><span></span><span></span></div> 剧情展开中...</div>';
        html += '</div>';
        html += '</div>';

        // 同看成员栏
        if (pvState.watchRoom) {
            html += '<div class="pv-watch-members" id="pv-watch-members">';
            html += '<div class="pv-watch-member pv-watch-member-online" title="我">';
            if (store.user.desktopAvatar) html += '<img src="' + pvEsc(store.user.desktopAvatar) + '">';
            else html += '我';
            html += '</div>';
            (pvState.watchRoom.members || []).forEach(function(mid) {
                var c = pvGetContact(mid);
                html += '<div class="pv-watch-member pv-watch-member-online" title="' + pvEsc(c ? (c.remark || c.name) : '?') + '">';
                if (c && c.avatar) html += '<img src="' + pvEsc(c.avatar) + '">';
                else html += pvEsc(c ? (c.remark || c.name).charAt(0) : '?');
                html += '</div>';
            });
            var totalScenes = (ep.scenes || []).length;
            html += '<div class="pv-watch-progress">进度 ' + (pvState.currentSceneIndex + 1) + '/' + totalScenes + '</div>';
            html += '</div>';
        }

        // 播放控制条
        html += '<div class="pv-playback-ctrl">';
        html += '<button class="pv-playback-btn" onclick="pvTheaterPrevScene()" title="上一场景">' + PV_SVG.prev + '</button>';
        if (pvState.theaterPlaying) {
            html += '<button class="pv-playback-btn main" onclick="pvTheaterPause()" title="暂停">' + PV_SVG.pause + '</button>';
        } else {
            html += '<button class="pv-playback-btn main" onclick="pvTheaterResume()" title="播放">' + PV_SVG.play + '</button>';
        }
        html += '<button class="pv-playback-btn" onclick="pvTheaterNextScene()" title="下一场景">' + PV_SVG.next + '</button>';
        html += '<button class="pv-speed-btn" onclick="pvCycleSpeed()">' + pvState.theaterSpeed + 'x</button>';
        html += '</div>';

        // 弹幕输入栏
        html += '<div class="pv-theater-bar">';
        html += '<input class="pv-danmaku-input" id="pv-danmaku-input" placeholder="发条弹幕..." onkeydown="if(event.key===\'Enter\'){event.preventDefault();pvSendDanmaku();}">';
        html += '<button class="pv-send-btn" onclick="pvSendDanmaku()">' + PV_SVG.send + '</button>';
        html += '</div>';

        el.innerHTML = html;

        // 开始播放
        if (!pvState.theaterPlaying && pvState.theaterQueue.length === 0) {
            pvStartPlaying();
        }
    }

    // ========== 演绎模式 ==========
    function pvRenderPerform(el) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) { pvGo('home'); return; }
        var ep = (drama.episodes || [])[pvState.currentEpIndex];
        if (!ep) { pvGo('detail'); return; }

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvExitTheater()">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">演绎模式 · ' + pvEsc(ep.title || ('第' + (pvState.currentEpIndex + 1) + '集')) + '</div>';
        html += '<div class="pv-nav-actions">';
        html += '<button class="pv-nav-btn" onclick="pvOpenTwistFromTheater()" title="改写命运">' + PV_SVG.twist + '</button>';
        html += '</div></div>';

        // 弹幕
        html += '<div class="pv-danmaku-zone" id="pv-danmaku-zone"></div>';

        // 剧情内容
        html += '<div class="pv-theater-content" id="pv-theater-content" style="flex:1;">';
        var scene = (ep.scenes || [])[pvState.currentSceneIndex];
        if (scene) {
            html += '<div class="pv-theater-scene-title">';
            html += '<div class="pv-theater-scene-bracket">—— 演绎中 ——</div>';
            html += pvEsc(scene.setting || '');
            html += '</div>';
        }
        html += '<div id="pv-theater-rendered"></div>';
        html += '<div id="pv-theater-loading" style="display:none;">';
        html += '<div class="pv-loading"><div class="pv-loading-dots"><span></span><span></span><span></span></div> NPC思考中...</div>';
        html += '</div>';
        html += '</div>';

        // 演绎输入区
        html += '<div class="pv-perform-input-area">';
        var userChar = pvState.performUserRole ? pvGetCastMember(drama, pvState.performUserRole) : null;
        if (userChar) {
            html += '<div class="pv-perform-hint">' + PV_SVG.cast + ' 你正在扮演: ' + pvEsc(userChar.name) + '</div>';
            // 剧本台词提示
            if (scene && scene.dialogues) {
                var nextUserLine = scene.dialogues.find(function(d) { return d.castId === pvState.performUserRole; });
                if (nextUserLine) {
                    html += '<div class="pv-perform-script-line">剧本台词: ' + pvEsc(nextUserLine.line) + '</div>';
                }
            }
        }
        html += '<textarea class="pv-perform-textarea" id="pv-perform-input" placeholder="输入你的台词或动作...（留空则按剧本演）"></textarea>';
        html += '<div class="pv-perform-actions" style="margin-top:8px;">';
        html += '<button class="pv-btn pv-btn-secondary" style="flex:1;" onclick="pvPerformFollowScript()">按剧本演</button>';
        html += '<button class="pv-btn pv-btn-primary" style="flex:1;" onclick="pvPerformImprovise()">即兴发挥</button>';
        html += '</div>';
        html += '</div>';

        el.innerHTML = html;

        // 开始演绎
        if (pvState.theaterQueue.length === 0) {
            pvStartPerforming();
        }
    }

    // ========== 选角界面 ==========
    function pvRenderCasting(el) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) { pvGo('home'); return; }

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'detail\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">选角</div>';
        html += '<div class="pv-nav-actions"></div></div>';

        html += '<div class="pv-scroll">';
        html += '<div class="pv-casting">';

        html += '<div style="font-size:14px;color:var(--pv-text2);margin-bottom:16px;">为每个角色分配扮演者。选择"我来演"可以亲自演绎，选择联系人则由AI模拟其风格。</div>';

        (drama.cast || []).forEach(function(c) {
            html += '<div class="pv-casting-card">';
            html += '<div class="pv-casting-avatar">';
            if (c.avatar) html += '<img src="' + pvEsc(c.avatar) + '">';
            else html += PV_SVG.people;
            html += '</div>';
            html += '<div class="pv-casting-info">';
            html += '<div class="pv-casting-name">' + pvEsc(c.name) + '</div>';
            html += '<div class="pv-casting-role-tag">' + (c.role === 'lead' ? '主角' : c.role === 'supporting' ? '配角' : '群演') + '</div>';
            html += '</div>';
            html += '<div class="pv-casting-assign">';
            html += '<select class="pv-casting-select" id="pv-cast-assign-' + c.id + '">';
            html += '<option value="">AI演绎</option>';
            html += '<option value="user"' + (pvState.performUserRole === c.id ? ' selected' : '') + '>我来演</option>';
            (store.contacts || []).forEach(function(ct) {
                var sel = pvState.performPartnerRoles[ct.id] === c.id ? ' selected' : '';
                html += '<option value="contact:' + ct.id + '"' + sel + '>' + pvEsc(ct.remark || ct.name) + '</option>';
            });
            html += '</select></div></div>';
        });

        html += '<div style="margin-top:16px;">';
        html += '<div style="font-size:14px;font-weight:600;color:var(--pv-text);margin-bottom:8px;">选择章节</div>';
        html += '<select class="pv-select" id="pv-cast-episode">';
        (drama.episodes || []).forEach(function(ep, idx) {
            html += '<option value="' + idx + '">' + pvEsc(ep.title || ('第' + (idx + 1) + '集')) + '</option>';
        });
        html += '</select></div>';

        html += '</div></div>';

        html += '<div style="padding:12px 16px;border-top:1px solid var(--pv-border);">';
        html += '<button class="pv-btn pv-btn-primary pv-btn-full" onclick="pvStartPerformMode()">开始演绎</button>';
        html += '</div>';

        el.innerHTML = html;
    }

    // ========== 一起看 - 邀请界面 ==========
    function pvRenderInvite(el, dramaId) {
        var html = '';
        html += '<div class="pv-modal-mask" onclick="pvCloseModal()">';
        html += '<div class="pv-modal" onclick="event.stopPropagation()">';
        html += '<div class="pv-modal-header">';
        html += '<div class="pv-modal-title">邀请一起看</div>';
        html += '<button class="pv-modal-close" onclick="pvCloseModal()">' + PV_SVG.close + '</button>';
        html += '</div>';
        html += '<div class="pv-modal-body">';
        html += '<div class="pv-invite-panel" id="pv-invite-list">';

        var contacts = store.contacts || [];
        if (contacts.length === 0) {
            html += '<div style="text-align:center;color:var(--pv-text3);padding:20px;">暂无联系人</div>';
        }
        contacts.forEach(function(c) {
            html += '<div class="pv-invite-contact" onclick="pvToggleInvite(\'' + c.id + '\')">';
            html += '<div class="pv-invite-avatar">';
            if (c.avatar) html += '<img src="' + pvEsc(c.avatar) + '">';
            else html += PV_SVG.people;
            html += '</div>';
            html += '<div class="pv-invite-name">' + pvEsc(c.remark || c.name) + '</div>';
            html += '<div class="pv-invite-check" id="pv-invite-ck-' + c.id + '">' + '</div>';
            html += '</div>';
        });

        html += '</div>';

        // 选集
        html += '<div style="padding:0 16px 16px;">';
        html += '<div class="pv-form-label">从第几集开始</div>';
        var drama = pvGetDrama(dramaId);
        html += '<select class="pv-select" id="pv-invite-ep">';
        if (drama) {
            (drama.episodes || []).forEach(function(ep, idx) {
                html += '<option value="' + idx + '">' + pvEsc(ep.title || ('第' + (idx + 1) + '集')) + '</option>';
            });
        }
        html += '</select></div>';

        html += '</div>';
        html += '<div class="pv-modal-footer">';
        html += '<button class="pv-btn pv-btn-secondary" style="flex:1;" onclick="pvCloseModal()">取消</button>';
        html += '<button class="pv-btn pv-btn-primary" style="flex:1;" onclick="pvConfirmWatchTogether(\'' + dramaId + '\')">' + PV_SVG.together + ' 开始一起看</button>';
        html += '</div></div></div>';
        return html;
    }

    // ========== 狗血转折界面 ==========
    function pvRenderTwist(el) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) { pvGo('home'); return; }
        var ep = (drama.episodes || [])[pvState.currentEpIndex];
        if (!ep) { pvGo('detail'); return; }
        var scene = (ep.scenes || [])[pvState.currentSceneIndex];

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'theater\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">改写命运</div>';
        html += '<div class="pv-nav-actions"></div></div>';

        html += '<div class="pv-scroll">';

        html += '<div class="pv-twist-panel">';
        html += '<div class="pv-twist-title">' + PV_SVG.twist + ' 蝴蝶效应</div>';
        html += '<div class="pv-twist-desc">修改剧本中的关键词，让剧情走向发生翻天覆地的变化。只需改动几个字，命运就此改写。</div>';
        html += '</div>';

        // 当前场景文本
        if (scene) {
            html += '<div style="padding:16px;">';
            html += '<div style="font-size:14px;font-weight:600;color:var(--pv-text);margin-bottom:8px;">当前场景: ' + pvEsc(scene.setting || '') + '</div>';
            html += '<div class="pv-twist-original" id="pv-twist-text">';

            // 渲染可替换词
            (scene.dialogues || []).forEach(function(d) {
                var castInfo = pvGetCastDisplay(drama, d.castId);
                html += '<div style="margin-bottom:6px;">';
                html += '<strong style="color:var(--pv-accent);">' + pvEsc(castInfo.name) + ':</strong> ';
                if (d.action) html += '<em style="color:var(--pv-text3);">(' + pvEsc(d.action) + ')</em> ';
                html += pvRenderTwistableText(d.line, scene.pivotWords || []);
                html += '</div>';
            });

            html += '</div>';

            // 转折点列表
            if (scene.pivotWords && scene.pivotWords.length > 0) {
                html += '<div style="font-size:14px;font-weight:600;color:var(--pv-text);margin-bottom:10px;">可修改的关键词:</div>';
                scene.pivotWords.forEach(function(pw, pidx) {
                    html += '<div style="background:var(--pv-card);border:1px solid var(--pv-border);border-radius:var(--pv-radius);padding:12px;margin-bottom:8px;">';
                    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">';
                    html += '<span style="font-size:14px;font-weight:600;color:var(--pv-accent);">「' + pvEsc(pw.original) + '」</span>';
                    html += '<span style="font-size:11px;color:var(--pv-text3);">' + pvEsc(pw.impact || '') + '</span>';
                    html += '</div>';
                    html += '<div style="display:flex;gap:6px;flex-wrap:wrap;">';
                    (pw.alternatives || []).forEach(function(alt) {
                        html += '<button class="pv-btn pv-btn-sm pv-btn-secondary" onclick="pvApplyTwist(' + pvState.currentEpIndex + ',' + pvState.currentSceneIndex + ',' + pidx + ',\'' + pvEsc(alt).replace(/'/g, "\\'") + '\')">' + pvEsc(alt) + '</button>';
                    });
                    html += '</div>';
                    html += '<div style="display:flex;gap:6px;margin-top:8px;">';
                    html += '<input class="pv-input" id="pv-twist-custom-' + pidx + '" placeholder="自定义替换词..." style="flex:1;">';
                    html += '<button class="pv-btn pv-btn-sm pv-btn-primary" onclick="pvApplyCustomTwist(' + pvState.currentEpIndex + ',' + pvState.currentSceneIndex + ',' + pidx + ')">替换</button>';
                    html += '</div></div>';
                });
            }

            // 狗血模板
            html += '<div style="font-size:14px;font-weight:600;color:var(--pv-text);margin:16px 0 10px;">或者直接使用狗血套路:</div>';
            PV_DOGBLOOD_TEMPLATES.forEach(function(t, idx) {
                html += '<div style="display:flex;align-items:center;padding:10px 12px;background:var(--pv-card);border:1px solid var(--pv-border);border-radius:var(--pv-radius);margin-bottom:6px;cursor:pointer;" onclick="pvApplyDogbloodTemplate(' + idx + ')">';
                html += '<div style="flex:1;">';
                html += '<div style="font-size:14px;font-weight:500;color:var(--pv-text);">' + pvEsc(t.name) + '</div>';
                html += '<div style="font-size:12px;color:var(--pv-text3);">' + pvEsc(t.desc) + '</div>';
                html += '</div>';
                html += '<span style="color:var(--pv-text3);">' + PV_SVG.arrow + '</span>';
                html += '</div>';
            });

            html += '</div>';
        }

        html += '<div style="height:30px;"></div>';
        html += '</div>';

        el.innerHTML = html;
    }

    function pvRenderTwistableText(line, pivotWords) {
        if (!line) return '';
        var result = pvEsc(line);
        pivotWords.forEach(function(pw) {
            var escaped = pvEsc(pw.original);
            var safeRegex = pvEscapeRegex(escaped);
            result = result.replace(new RegExp(safeRegex, 'g'),
                '<span class="pv-pivot-word" style="cursor:default;">' + escaped + '</span>'
            );
        });
        return result;
    }

    // ========== 设置页 ==========
    function pvRenderSettings(el) {
        var s = store.penguinVideo.settings || {};
        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'home\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">企鹅视频设置</div>';
        html += '<div class="pv-nav-actions"></div></div>';

        html += '<div class="pv-scroll">';
        html += '<div class="pv-settings-group">';

        html += '<div class="pv-settings-item">';
        html += '<div><div class="pv-settings-label">默认剧集类型</div>';
        html += '<div class="pv-settings-desc">新建剧集时的默认类型</div></div>';
        html += '<select class="pv-select" style="width:auto;" id="pv-set-genre" onchange="pvSaveSetting(\'defaultGenre\',this.value)">';
        Object.keys(PV_GENRES).forEach(function(g) {
            html += '<option value="' + g + '"' + (s.defaultGenre === g ? ' selected' : '') + '>' + PV_GENRES[g] + '</option>';
        });
        html += '</select></div>';

        html += '<div class="pv-settings-item">';
        html += '<div><div class="pv-settings-label">自动生成弹幕</div>';
        html += '<div class="pv-settings-desc">观看时AI自动生成联系人弹幕</div></div>';
        html += '<div class="switch"><input type="checkbox" id="pv-set-auto-danmaku"' + (s.autoGenerateDanmaku !== false ? ' checked' : '') + ' onchange="pvSaveSetting(\'autoGenerateDanmaku\',this.checked)"><span class="slider"></span></div>';
        html += '</div>';

        html += '<div class="pv-settings-item">';
        html += '<div><div class="pv-settings-label">弹幕密度</div>';
        html += '<div class="pv-settings-desc">每个场景生成的弹幕数量</div></div>';
        html += '<select class="pv-select" style="width:auto;" id="pv-set-density" onchange="pvSaveSetting(\'danmakuDensity\',this.value)">';
        html += '<option value="sparse"' + (s.danmakuDensity === 'sparse' ? ' selected' : '') + '>稀疏</option>';
        html += '<option value="normal"' + (s.danmakuDensity === 'normal' || !s.danmakuDensity ? ' selected' : '') + '>正常</option>';
        html += '<option value="dense"' + (s.danmakuDensity === 'dense' ? ' selected' : '') + '>密集</option>';
        html += '</select></div>';

        html += '<div class="pv-settings-item">';
        html += '<div><div class="pv-settings-label">NPC演绎风格</div>';
        html += '<div class="pv-settings-desc">AI生成NPC台词的风格</div></div>';
        html += '<select class="pv-select" style="width:auto;" id="pv-set-style" onchange="pvSaveSetting(\'npcResponseStyle\',this.value)">';
        html += '<option value="dramatic"' + (s.npcResponseStyle === 'dramatic' ? ' selected' : '') + '>戏剧化</option>';
        html += '<option value="realistic"' + (s.npcResponseStyle === 'realistic' ? ' selected' : '') + '>写实</option>';
        html += '<option value="comedic"' + (s.npcResponseStyle === 'comedic' ? ' selected' : '') + '>搞笑</option>';
        html += '</select></div>';

        html += '</div></div>';

        el.innerHTML = html;
    }

    // ========== 导航函数 ==========
    window.pvGo = function(view) {
        pvStopTheater();
        pvState.view = view;
        pvRender();
    };

    window.pvSwitchTab = function(tab) {
        pvState.tab = tab;
        pvRender();
    };

    window.pvOpenDrama = function(id) {
        pvState.currentDramaId = id;
        pvState.view = 'detail';
        pvRender();
    };

    window.pvFilterByGenre = function(genre) {
        pvState.filterGenre = genre;
        pvState.tab = 'mine';
        pvRender();
        pvToast('显示 ' + (PV_GENRES[genre] || genre) + ' 类型');
    };

    window.pvClearFilter = function() {
        pvState.filterGenre = null;
        pvRender();
    };

    // ========== 创作向导逻辑 ==========
    window.pvStartWizard = function() {
        pvState.view = 'wizard';
        pvState.wizardStep = 0;
        pvState.wizardData = {
            genre: store.penguinVideo.settings.defaultGenre || 'romance',
            title: '',
            synopsis: '',
            tags: [],
            cast: [],
        };
        pvRender();
    };

    window.pvWizardSelectGenre = function(g) {
        pvState.wizardData.genre = g;
        pvRender();
    };

    window.pvWizardNext = function() {
        var data = pvState.wizardData;
        if (pvState.wizardStep === 0 && !data.genre) {
            pvToast('请选择剧集类型');
            return;
        }
        if (pvState.wizardStep === 1) {
            data.title = (document.getElementById('pv-wizard-title') || {}).value || '';
            data.synopsis = (document.getElementById('pv-wizard-synopsis') || {}).value || '';
            var tagsStr = (document.getElementById('pv-wizard-tags') || {}).value || '';
            data.tags = tagsStr.split(/[,，]/).map(function(s) { return s.trim(); }).filter(Boolean);
            if (!data.title.trim()) {
                pvToast('请输入剧名');
                return;
            }
        }
        pvState.wizardStep++;
        pvRender();
    };

    window.pvWizardPrev = function() {
        if (pvState.wizardStep === 1) {
            pvState.wizardData.title = (document.getElementById('pv-wizard-title') || {}).value || pvState.wizardData.title;
            pvState.wizardData.synopsis = (document.getElementById('pv-wizard-synopsis') || {}).value || pvState.wizardData.synopsis;
        }
        pvState.wizardStep--;
        pvRender();
    };

    window.pvWizardAiSuggest = async function() {
        if (!store.system || !store.system.url || !store.system.key) {
            alert('⚠️ 请先在设置中配置API接口（URL和Key），才能使用AI生成功能');
            return;
        }
        var genre = pvState.wizardData.genre;
        if (window.aiModal) window.aiModal.loading('AI 正在生成剧集推荐...');
        try {
            var prompt = '你是一个专业的电视剧策划人。请为一部' + (PV_GENRES[genre] || '言情') + '类型的电视剧提供创意。输出JSON：{"title":"剧名","synopsis":"100字以内的简介","tags":["标签1","标签2","标签3"]}。只返回JSON。';
            var data = await API.chatCompletion([{role:'user',content:prompt}], {temperature:0.9, silent:false, scene:'penguin-video'});
            var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
            var json = text.match(/\{[\s\S]*?\}/);
            if (json) {
                var obj = JSON.parse(json[0]);
                if (obj.title) document.getElementById('pv-wizard-title').value = obj.title;
                if (obj.synopsis) document.getElementById('pv-wizard-synopsis').value = obj.synopsis;
                if (obj.tags) document.getElementById('pv-wizard-tags').value = obj.tags.join(',');
                if (window.aiModal) window.aiModal.success('AI 推荐完成');
            } else {
                if (window.aiModal) window.aiModal.fail('AI 返回格式异常');
            }
        } catch(e) {
            console.warn('[PenguinVideo] AI suggest error:', e);
            if (window.aiModal) window.aiModal.fail('AI 生成失败');
        }
    };

    window.pvWizardAddCastManual = function() {
        var name = prompt('角色名字:');
        if (!name || !name.trim()) return;
        var role = confirm('是主角吗？（取消=配角）') ? 'lead' : 'supporting';
        pvState.wizardData.cast.push({
            id: pvId(),
            name: name.trim(),
            role: role,
            persona: '',
            voiceStyle: '',
            playedBy: null,
            avatar: '',
        });
        pvRender();
    };

    window.pvWizardRemoveCast = function(idx) {
        pvState.wizardData.cast.splice(idx, 1);
        pvRender();
    };

    window.pvWizardAiCast = async function() {
        if (!store.system || !store.system.url || !store.system.key) {
            alert('⚠️ 请先在设置中配置API接口（URL和Key），才能使用AI生成功能');
            return;
        }
        var data = pvState.wizardData;
        if (window.aiModal) window.aiModal.loading('AI 正在推荐角色...');
        try {
            var prompt = '你是一个专业编剧。为一部"' + (PV_GENRES[data.genre] || '言情') + '"类型的电视剧《' + (data.title || '未命名') + '》(' + (data.synopsis || '无') + ')推荐3-4个角色。输出JSON数组：[{"name":"角色名","role":"lead或supporting","persona":"50字以内人设","voiceStyle":"语气风格"}]。只返回JSON数组。';
            var resp = await API.chatCompletion([{role:'user',content:prompt}], {temperature:0.9, silent:false, scene:'penguin-video'});
            var text = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '';
            var json = text.match(/\[[\s\S]*?\]/);
            if (json) {
                var arr = JSON.parse(json[0]);
                arr.forEach(function(c) {
                    data.cast.push({
                        id: pvId(),
                        name: c.name || '未命名',
                        role: c.role || 'supporting',
                        persona: c.persona || '',
                        voiceStyle: c.voiceStyle || '',
                        playedBy: null,
                        avatar: '',
                    });
                });
                pvRender();
                if (window.aiModal) window.aiModal.success('已添加 ' + arr.length + ' 个角色');
            } else {
                if (window.aiModal) window.aiModal.fail('AI 返回格式异常');
            }
        } catch(e) {
            console.warn('[PenguinVideo] AI cast error:', e);
            if (window.aiModal) window.aiModal.fail('AI 推荐失败');
        }
    };

    window.pvWizardFinish = async function(generateFirst) {
        var data = pvState.wizardData;
        if (!data.title) data.title = '未命名剧集';

        var drama = {
            id: pvId(),
            title: data.title,
            cover: '',
            genre: data.genre || 'romance',
            tags: data.tags || [],
            synopsis: data.synopsis || '',
            status: 'ongoing',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cast: data.cast || [],
            episodes: [],
            viewSettings: {
                speed: 1,
                bgm: '',
                fontSize: 15,
                fontColor: '#1a1a1a',
                danmakuEnabled: true,
                danmakuOpacity: 0.8,
            },
        };

        store.penguinVideo.dramas.push(drama);

        if (generateFirst) {
            var ep1Title = (document.getElementById('pv-wizard-ep1-title') || {}).value || '第一集';
            var ep1Req = (document.getElementById('pv-wizard-ep1-req') || {}).value || '';

            drama.episodes.push({
                id: pvId(),
                title: ep1Title,
                scenes: [],
                generated: false,
                content: '',
            });
            save();

            pvState.currentDramaId = drama.id;
            pvState.view = 'detail';
            pvRender();
            pvToast('剧集已创建，正在AI生成第一集...');

            await pvDoGenerateScenes(drama.id, 0, ep1Req);
        } else {
            save();
            pvState.currentDramaId = drama.id;
            pvState.view = 'detail';
            pvRender();
            pvToast('剧集已创建');
        }
    };

    window.pvCreateFromTemplate = function(idx) {
        var tpl = PV_DOGBLOOD_TEMPLATES[idx];
        if (!tpl) return;
        pvState.wizardData = {
            genre: 'dogblood',
            title: '',
            synopsis: tpl.desc,
            tags: tpl.keywords.slice(),
            cast: [],
        };
        pvState.wizardStep = 1;
        pvState.view = 'wizard';
        pvRender();
    };

    // ========== 剧集CRUD ==========
    function pvGetDrama(id) {
        return (store.penguinVideo.dramas || []).find(function(d) { return d.id === id; });
    }

    window.pvDeleteDrama = function(id) {
        if (!confirm('确定删除这部剧集？')) return;
        store.penguinVideo.dramas = (store.penguinVideo.dramas || []).filter(function(d) { return d.id !== id; });
        store.penguinVideo.following = (store.penguinVideo.following || []).filter(function(f) { return f.dramaId !== id; });
        save();
        pvState.view = 'home';
        pvRender();
        pvToast('已删除');
    };

    window.pvShowDramaMore = function(id) {
        // 简单的更多菜单
        var drama = pvGetDrama(id);
        if (!drama) return;
        var choices = ['编辑标题/简介', '更改状态', '生成封面(AI)'];
        var choice = prompt('选择操作:\n1. 编辑标题/简介\n2. 更改状态(' + drama.status + ')\n3. AI生成封面');
        if (choice === '1') {
            var newTitle = prompt('剧名:', drama.title);
            if (newTitle !== null) drama.title = newTitle;
            var newSyn = prompt('简介:', drama.synopsis);
            if (newSyn !== null) drama.synopsis = newSyn;
            drama.updatedAt = Date.now();
            save();
            pvRender();
        } else if (choice === '2') {
            var statuses = ['draft','ongoing','completed'];
            var current = statuses.indexOf(drama.status);
            var next = (current + 1) % statuses.length;
            drama.status = statuses[next];
            drama.updatedAt = Date.now();
            save();
            pvRender();
            pvToast('状态已改为: ' + (drama.status === 'draft' ? '草稿' : drama.status === 'completed' ? '已完结' : '连载中'));
        } else if (choice === '3') {
            pvGenerateCover(id);
        }
    };

    async function pvGenerateCover(dramaId) {
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        pvToast('正在AI生成封面...');
        try {
            var imgPrompt = 'TV drama poster for "' + drama.title + '", ' + (drama.genre || 'romance') + ' genre, ' + (drama.synopsis || '').substring(0, 100) + ', cinematic, professional poster design';
            if (typeof callImgGenAPI === 'function') {
                var url = await callImgGenAPI(imgPrompt);
                if (url) {
                    drama.cover = url;
                    drama.updatedAt = Date.now();
                    save();
                    pvRender();
                    pvToast('封面已生成');
                    return;
                }
            }
            pvToast('封面生成失败(未配置图片API)');
        } catch(e) {
            console.warn('[PenguinVideo] Cover gen error:', e);
            pvToast('封面生成失败');
        }
    }

    // ========== 章节CRUD ==========
    window.pvAddEpisode = function(dramaId) {
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        var epNum = (drama.episodes || []).length + 1;
        var title = prompt('章节标题:', '第' + epNum + '集');
        if (title === null) return;
        if (!drama.episodes) drama.episodes = [];
        drama.episodes.push({
            id: pvId(),
            title: title || ('第' + epNum + '集'),
            scenes: [],
            generated: false,
            content: '',
        });
        drama.updatedAt = Date.now();
        save();
        pvRender();
    };

    window.pvDeleteEpisode = function(dramaId, epIdx) {
        if (!confirm('确定删除这一集？')) return;
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        drama.episodes.splice(epIdx, 1);
        drama.updatedAt = Date.now();
        save();
        pvRender();
    };

    window.pvUpdateEpTitle = function(dramaId, epIdx) {
        var drama = pvGetDrama(dramaId);
        if (!drama || !drama.episodes[epIdx]) return;
        var input = document.getElementById('pv-ep-title');
        if (input) {
            drama.episodes[epIdx].title = input.value;
            drama.updatedAt = Date.now();
            save();
        }
    };

    window.pvAiGenerateEpisode = async function(dramaId) {
        if (!store.system || !store.system.url || !store.system.key) {
            alert('⚠️ 请先在设置中配置API接口（URL和Key），才能使用AI生成功能');
            return;
        }
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        var epNum = (drama.episodes || []).length + 1;
        if (!drama.episodes) drama.episodes = [];
        drama.episodes.push({
            id: pvId(),
            title: '第' + epNum + '集',
            scenes: [],
            generated: false,
            content: '',
        });
        drama.updatedAt = Date.now();
        save();
        pvRender();
        pvToast('正在AI生成第' + epNum + '集...');
        await pvDoGenerateScenes(dramaId, epNum - 1, '');
    };

    // ========== 场景CRUD ==========
    window.pvAddScene = function(dramaId, epIdx) {
        var drama = pvGetDrama(dramaId);
        if (!drama || !drama.episodes[epIdx]) return;
        var setting = prompt('场景设定(地点/氛围):', '');
        if (setting === null) return;
        if (!drama.episodes[epIdx].scenes) drama.episodes[epIdx].scenes = [];
        drama.episodes[epIdx].scenes.push({
            id: pvId(),
            setting: setting || '未设定场景',
            direction: '',
            dialogues: [],
            pivotWords: [],
        });
        drama.updatedAt = Date.now();
        save();
        pvRender();
    };

    window.pvEditScene = function(dramaId, epIdx, sIdx) {
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        var scene = drama.episodes[epIdx] && drama.episodes[epIdx].scenes[sIdx];
        if (!scene) return;
        var newSetting = prompt('场景设定:', scene.setting);
        if (newSetting === null) return;
        scene.setting = newSetting;
        var newDirection = prompt('场景方向/旁白:', scene.direction);
        if (newDirection !== null) scene.direction = newDirection;
        drama.updatedAt = Date.now();
        save();
        pvRender();
    };

    window.pvDeleteScene = function(dramaId, epIdx, sIdx) {
        if (!confirm('确定删除这个场景？')) return;
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        drama.episodes[epIdx].scenes.splice(sIdx, 1);
        drama.updatedAt = Date.now();
        save();
        pvRender();
    };

    window.pvEditScript = function(dramaId, epIdx) {
        pvState.currentDramaId = dramaId;
        pvState.editingEpIndex = epIdx;
        pvState.view = 'script-edit';
        pvRender();
    };

    // ========== NPC CRUD ==========
    window.pvEditNpc = function(dramaId, npcId) {
        pvState.currentDramaId = dramaId;
        pvState.editingNpcId = npcId;
        pvState.view = 'npc-edit';
        pvRender();
    };

    window.pvSaveNpc = function() {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) return;

        var name = (document.getElementById('pv-npc-name') || {}).value || '';
        var role = (document.getElementById('pv-npc-role') || {}).value || 'supporting';
        var persona = (document.getElementById('pv-npc-persona') || {}).value || '';
        var voice = (document.getElementById('pv-npc-voice') || {}).value || '';
        var playedBy = (document.getElementById('pv-npc-playedby') || {}).value || null;

        if (!name.trim()) { pvToast('请输入角色名'); return; }

        if (!drama.cast) drama.cast = [];

        if (pvState.editingNpcId) {
            var npc = pvGetCastMember(drama, pvState.editingNpcId);
            if (npc) {
                npc.name = name;
                npc.role = role;
                npc.persona = persona;
                npc.voiceStyle = voice;
                npc.playedBy = playedBy || null;
            }
        } else {
            drama.cast.push({
                id: pvId(),
                name: name,
                avatar: '',
                persona: persona,
                role: role,
                voiceStyle: voice,
                playedBy: playedBy || null,
            });
        }

        drama.updatedAt = Date.now();
        save();
        pvState.view = 'detail';
        pvRender();
        pvToast('角色已保存');
    };

    window.pvDeleteNpc = function(dramaId, npcId) {
        if (!confirm('确定删除这个角色？')) return;
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        drama.cast = (drama.cast || []).filter(function(c) { return c.id !== npcId; });
        drama.updatedAt = Date.now();
        save();
        pvState.view = 'detail';
        pvRender();
        pvToast('角色已删除');
    };

    window.pvAiGenPersona = async function() {
        if (!store.system || !store.system.url || !store.system.key) {
            alert('⚠️ 请先在设置中配置API接口（URL和Key），才能使用AI生成功能');
            return;
        }
        var name = (document.getElementById('pv-npc-name') || {}).value || '';
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) return;
        if (window.aiModal) window.aiModal.loading('AI 正在生成人设...');
        try {
            var prompt = '你是一个专业的剧本角色设定师。为电视剧《' + (drama.title || '') + '》(' + (PV_GENRES[drama.genre] || '言情') + '类型)中名为"' + (name || '未命名') + '"的角色生成完整人设。包含：性格特点、外貌描述、背景故事、说话风格、小癖好。要求有反差感和深度，150字以内。只返回人设描述文本。';
            var resp = await API.chatCompletion([{role:'user',content:prompt}], {temperature:0.9, silent:false, scene:'penguin-video'});
            var text = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '';
            if (text) {
                var textarea = document.getElementById('pv-npc-persona');
                if (textarea) textarea.value = text.trim();
                if (window.aiModal) window.aiModal.success('人设已生成');
            } else {
                if (window.aiModal) window.aiModal.fail('AI 返回内容为空');
            }
        } catch(e) {
            console.warn('[PenguinVideo] Persona gen error:', e);
            if (window.aiModal) window.aiModal.fail('人设生成失败');
        }
    };

    // ========== AI生成剧本场景 ==========
    async function pvDoGenerateScenes(dramaId, epIdx, requirement) {
        var drama = pvGetDrama(dramaId);
        if (!drama || !drama.episodes[epIdx]) return;
        var ep = drama.episodes[epIdx];

        var castList = (drama.cast || []).map(function(c) {
            return c.name + '(' + (c.role === 'lead' ? '主角' : '配角') + '): ' + (c.persona || '无').substring(0, 100);
        }).join('\n');

        var prevSummary = '';
        if (epIdx > 0 && drama.episodes[epIdx - 1]) {
            var prevEp = drama.episodes[epIdx - 1];
            var lastScenes = (prevEp.scenes || []).slice(-2);
            prevSummary = lastScenes.map(function(s) {
                return s.setting + ': ' + (s.dialogues || []).map(function(d) {
                    var ci = pvGetCastDisplay(drama, d.castId);
                    return ci.name + '说"' + (d.line || '').substring(0, 30) + '"';
                }).join(', ');
            }).join(' → ');
        }

        // [FIX-剧情丢失v2] 收集本集已有场景的摘要，让AI续写而非重新创作
        var existingSummary = '';
        var existingScenes = ep.scenes || [];
        if (existingScenes.length > 0) {
            existingSummary = existingScenes.map(function(s, i) {
                var dialogueSum = (s.dialogues || []).slice(0, 4).map(function(d) {
                    var ci = pvGetCastDisplay(drama, d.castId);
                    return ci.name + (d.action ? '(' + d.action + ')' : '') + ':"' + (d.line || '').substring(0, 40) + '"';
                }).join(' / ');
                return '场景' + (i + 1) + ' [' + (s.setting || '未知') + ']: ' + dialogueSum;
            }).join('\n');
        }

        try {
            var prompt = '你是一个专业编剧。为电视剧《' + drama.title + '》(' + (PV_GENRES[drama.genre] || '言情') + '类型)生成第' + (epIdx + 1) + '集的剧本。\n\n';
            prompt += '角色列表:\n' + (castList || '暂无角色') + '\n\n';
            if (prevSummary) prompt += '上集剧情: ' + prevSummary + '\n\n';
            if (existingSummary) prompt += '本集已有剧情(请在此基础上续写，不要重复已有内容):\n' + existingSummary + '\n\n';
            prompt += '本集标题: ' + (ep.title || '第' + (epIdx + 1) + '集') + '\n';
            if (requirement) prompt += '特殊要求: ' + requirement + '\n';
            prompt += '\n请生成3-5个' + (existingScenes.length > 0 ? '后续' : '') + '场景。输出格式为JSON数组:\n';
            prompt += '[{"setting":"场景地点和氛围","direction":"导演指示/旁白","dialogues":[{"castId":"角色ID(就用角色名)","line":"台词","action":"动作描写"}],"pivotWords":[{"original":"可以被替换的关键词","alternatives":["替换选项1","替换选项2","替换选项3"],"impact":"替换后对剧情的影响"}]}]\n';
            prompt += '每个场景至少3-5句对话。pivotWords标记出可以触发剧情转折的关键词(每个场景1-2个)。只返回JSON数组。';

            var resp = await API.chatCompletion([{role:'user', content:prompt}], {temperature:0.85, silent:false, scene:'penguin-video'});
            var text = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '';
            var jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                var scenes = JSON.parse(jsonMatch[0]);
                // 将角色名映射回castId
                scenes.forEach(function(scene) {
                    (scene.dialogues || []).forEach(function(d) {
                        var cast = (drama.cast || []).find(function(c) { return c.name === d.castId || c.id === d.castId; });
                        if (cast) d.castId = cast.id;
                        else {
                            // 如果找不到匹配的角色，用名字当ID
                            var newCast = {
                                id: pvId(),
                                name: d.castId || '路人',
                                avatar: '',
                                persona: '',
                                role: 'extra',
                                voiceStyle: '',
                                playedBy: null,
                            };
                            drama.cast.push(newCast);
                            d.castId = newCast.id;
                        }
                    });
                    if (!scene.id) scene.id = pvId();
                });
                // [FIX-剧情丢失] 如果已有场景，追加而非覆盖，保留之前的剧情
                if (ep.scenes && ep.scenes.length > 0) {
                    ep.scenes = ep.scenes.concat(scenes);
                } else {
                    ep.scenes = scenes;
                }
                ep.generated = true;
                drama.updatedAt = Date.now();
                save();
                pvRender();
                if (window.aiModal) window.aiModal.success('剧本生成完成');
            } else {
                if (window.aiModal) window.aiModal.fail('AI 返回格式异常');
            }
        } catch(e) {
            console.warn('[PenguinVideo] Script gen error:', e);
            if (window.aiModal) window.aiModal.fail('剧本生成失败: ' + (e.message || ''));
        }
    }

    window.pvAiGenerateScenes = async function(dramaId, epIdx) {
        if (!store.system || !store.system.url || !store.system.key) {
            alert('⚠️ 请先在设置中配置API接口（URL和Key），才能使用AI生成功能');
            return;
        }
        if (window.aiModal) window.aiModal.loading('AI 正在生成场景...');
        await pvDoGenerateScenes(dramaId, epIdx, '');
    };

    window.pvAiExpandEpisode = async function(dramaId, epIdx) {
        var drama = pvGetDrama(dramaId);
        if (!drama || !drama.episodes[epIdx]) return;
        var ep = drama.episodes[epIdx];
        var scenes = ep.scenes || [];
        if (scenes.length === 0) {
            pvToast('请先添加场景');
            return;
        }

        if (window.aiModal) window.aiModal.loading('AI 正在扩写剧本...');
        try {
            var existingContent = scenes.map(function(s, i) {
                return '场景' + (i + 1) + ' [' + s.setting + ']: ' + (s.dialogues || []).map(function(d) {
                    var ci = pvGetCastDisplay(drama, d.castId);
                    return ci.name + (d.action ? '(' + d.action + ')' : '') + ':"' + d.line + '"';
                }).join(' / ');
            }).join('\n');

            var prompt = '你是一个专业编剧。以下是电视剧《' + drama.title + '》第' + (epIdx + 1) + '集的现有场景:\n\n' + existingContent + '\n\n请将每个场景的对话扩写得更丰富(增加更多心理描写、环境渲染、对话细节)，并在合适的位置插入1-2个新场景。输出完整的JSON数组格式(同之前的格式)。只返回JSON数组。';

            var resp = await API.chatCompletion([{role:'user', content:prompt}], {temperature:0.85, silent:false, scene:'penguin-video'});
            var text = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '';
            var jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                var expanded = JSON.parse(jsonMatch[0]);
                expanded.forEach(function(scene) {
                    (scene.dialogues || []).forEach(function(d) {
                        var cast = (drama.cast || []).find(function(c) { return c.name === d.castId || c.id === d.castId; });
                        if (cast) {
                            d.castId = cast.id;
                        } else {
                            // 自动创建新角色（与pvDoGenerateScenes一致）
                            var newCast = {
                                id: pvId(),
                                name: d.castId || '路人',
                                avatar: '',
                                persona: '',
                                role: 'extra',
                                voiceStyle: '',
                                playedBy: null,
                            };
                            drama.cast.push(newCast);
                            d.castId = newCast.id;
                        }
                    });
                    if (!scene.id) scene.id = pvId();
                });
                // [FIX-剧情丢失v3] 扩写不再直接覆盖：保留原有场景，仅追加AI新增的场景
                // 通过对比id/setting过滤掉AI重新输出的已有场景，只取真正新增的部分
                var existingIds = new Set((ep.scenes || []).map(function(s) { return s.id; }));
                var existingSettings = new Set((ep.scenes || []).map(function(s) { return s.setting; }));
                var newOnly = expanded.filter(function(s) {
                    return !existingIds.has(s.id) && !existingSettings.has(s.setting);
                });
                // 同时用AI扩写的对话更新已有场景（丰富内容）
                expanded.forEach(function(expScene) {
                    var match = (ep.scenes || []).find(function(orig) {
                        return orig.setting === expScene.setting || orig.id === expScene.id;
                    });
                    if (match && expScene.dialogues && expScene.dialogues.length > (match.dialogues || []).length) {
                        match.dialogues = expScene.dialogues;
                        if (expScene.direction) match.direction = expScene.direction;
                        if (expScene.pivotWords) match.pivotWords = expScene.pivotWords;
                    }
                });
                // 追加真正新增的场景
                if (newOnly.length > 0) {
                    ep.scenes = (ep.scenes || []).concat(newOnly);
                }
                drama.updatedAt = Date.now();
                save();
                pvRender();
                if (window.aiModal) window.aiModal.success('扩写完成');
            } else {
                if (window.aiModal) window.aiModal.fail('AI 返回格式异常');
            }
        } catch(e) {
            console.warn('[PenguinVideo] Expand error:', e);
            if (window.aiModal) window.aiModal.fail('扩写失败');
        }
    };

    // ========== 放映厅逻辑 ==========
    window.pvStartTheater = function(dramaId, epIdx) {
        pvState.currentDramaId = dramaId;
        pvState.currentEpIndex = epIdx;
        pvState.currentSceneIndex = 0;
        pvState.theaterPlaying = false;
        pvState.theaterQueue = [];
        pvState.theaterQueueIndex = 0;
        pvState.performMode = false;
        pvState.view = 'theater';
        pvRender();
    };

    function pvStartPlaying() {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) return;
        var ep = drama.episodes[pvState.currentEpIndex];
        if (!ep || !ep.scenes || ep.scenes.length === 0) {
            pvToast('没有场景可播放');
            return;
        }

        pvState.theaterPlaying = true;
        // 不重置 currentSceneIndex，由调用方（pvStartTheater/pvTheaterPrevScene/pvTheaterNextScene）负责设置
        pvPlayScene();
    }

    function pvUpdateProgress() {
        var dramaId = pvState.currentDramaId;
        if (!dramaId) return;
        var following = store.penguinVideo.following || [];
        var f = following.find(function(x) { return x.dramaId === dramaId; });
        if (!f) {
            // 自动添加到追剧列表
            f = { dramaId: dramaId, lastEp: 0, lastScene: 0, progress: 0 };
            following.push(f);
            store.penguinVideo.following = following;
        }
        f.lastEp = pvState.currentEpIndex;
        f.lastScene = pvState.currentSceneIndex;
        var drama = pvGetDrama(dramaId);
        if (drama) {
            var totalScenes = (drama.episodes || []).reduce(function(s, ep) { return s + (ep.scenes || []).length; }, 0);
            var watchedScenes = 0;
            for (var i = 0; i < pvState.currentEpIndex; i++) {
                watchedScenes += ((drama.episodes[i] || {}).scenes || []).length;
            }
            watchedScenes += pvState.currentSceneIndex + 1;
            f.progress = totalScenes > 0 ? Math.min(1, watchedScenes / totalScenes) : 0;
        }
        save();

        // 记录观看历史
        pvAddHistory(dramaId, pvState.currentEpIndex, pvState.currentSceneIndex);
    }

    function pvAddHistory(dramaId, epIdx, sceneIdx) {
        var history = store.penguinVideo.history || [];
        // 去重：同一剧集只保留最新记录
        history = history.filter(function(h) { return h.dramaId !== dramaId; });
        history.unshift({
            dramaId: dramaId,
            epIdx: epIdx,
            sceneIdx: sceneIdx,
            time: Date.now(),
        });
        // 最多保留50条
        if (history.length > 50) history = history.slice(0, 50);
        store.penguinVideo.history = history;
    }

    function pvPlayScene() {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) return;
        var ep = drama.episodes[pvState.currentEpIndex];
        if (!ep) return;
        var scene = (ep.scenes || [])[pvState.currentSceneIndex];
        if (!scene) {
            pvToast('本集播放完毕');
            pvState.theaterPlaying = false;
            pvUpdateProgress();
            pvRender();
            return;
        }

        // 构建渲染队列
        pvState.theaterQueue = [];
        pvState.theaterQueueIndex = 0;

        // 场景标题
        pvState.theaterQueue.push({
            type: 'scene-title',
            content: scene.setting || '场景 ' + (pvState.currentSceneIndex + 1),
        });

        // 旁白
        if (scene.direction) {
            pvState.theaterQueue.push({
                type: 'narration',
                content: scene.direction,
            });
        }

        // 对话
        (scene.dialogues || []).forEach(function(d) {
            var castInfo = pvGetCastDisplay(drama, d.castId);
            pvState.theaterQueue.push({
                type: 'dialogue',
                castId: d.castId,
                name: castInfo.name,
                avatar: castInfo.avatar,
                action: d.action || '',
                line: d.line || '',
            });
        });

        // 渲染场景头
        var contentEl = document.getElementById('pv-theater-content');
        var renderedEl = document.getElementById('pv-theater-rendered');
        if (renderedEl) renderedEl.innerHTML = '';

        // 更新场景标题
        if (contentEl) {
            var titleEl = contentEl.querySelector('.pv-theater-scene-title');
            if (titleEl) {
                titleEl.innerHTML = '<div class="pv-theater-scene-bracket">—— 场景 ' + (pvState.currentSceneIndex + 1) + ' ——</div>' + pvEsc(scene.setting || '');
            }
        }

        // 开始逐条渲染
        pvRenderNextInQueue();

        // 生成弹幕
        if (pvState.danmakuEnabled && store.penguinVideo.settings.autoGenerateDanmaku !== false) {
            pvGenerateDanmaku(drama, scene);
        }
    }

    function pvRenderNextInQueue() {
        if (!pvState.theaterPlaying) return;
        if (pvState.theaterQueueIndex >= pvState.theaterQueue.length) {
            // [FIX-场景跳转] 当前场景播完 → 自动播放下一场景
            pvUpdateProgress();
            var drama = pvGetDrama(pvState.currentDramaId);
            var ep = drama && drama.episodes[pvState.currentEpIndex];
            var maxScene = ep ? (ep.scenes || []).length - 1 : 0;
            if (pvState.currentSceneIndex < maxScene) {
                // 还有下一场景，延迟后自动播放
                pvState.currentSceneIndex++;
                pvState.theaterQueue = [];
                pvState.theaterQueueIndex = 0;
                pvState.theaterTimer = setTimeout(function() {
                    pvPlayScene();
                    // 更新场景标题和进度UI（不重建整个放映厅，保留弹幕区）
                    var contentEl = document.getElementById('pv-theater-content');
                    if (contentEl) {
                        var titleEl = contentEl.querySelector('.pv-theater-scene-title');
                        var newScene = ep.scenes[pvState.currentSceneIndex];
                        if (titleEl && newScene) {
                            titleEl.innerHTML = '<div class="pv-theater-scene-bracket">—— 场景 ' + (pvState.currentSceneIndex + 1) + ' ——</div>' + pvEsc(newScene.setting || '');
                        }
                    }
                    // 更新进度显示
                    var progressEl = document.querySelector('.pv-watch-progress');
                    if (progressEl && ep) {
                        progressEl.textContent = '进度 ' + (pvState.currentSceneIndex + 1) + '/' + (ep.scenes || []).length;
                    }
                }, 1500);
            } else {
                // 本集所有场景播完，检查是否有下一集
                var maxEp = drama ? (drama.episodes || []).length - 1 : 0;
                if (pvState.currentEpIndex < maxEp) {
                    pvState.currentEpIndex++;
                    pvState.currentSceneIndex = 0;
                    pvState.theaterQueue = [];
                    pvState.theaterQueueIndex = 0;
                    // [FIX-跨集播放] 重置theaterPlaying为false，让pvRenderTheater能触发pvStartPlaying
                    pvState.theaterPlaying = false;
                    pvState.theaterTimer = setTimeout(function() {
                        pvToast('自动播放下一集: ' + (drama.episodes[pvState.currentEpIndex].title || '第' + (pvState.currentEpIndex + 1) + '集'));
                        pvRender();
                    }, 2000);
                } else {
                    pvToast('全剧播放完毕 🎬');
                    pvState.theaterPlaying = false;
                    pvRender();
                }
            }
            return;
        }

        var item = pvState.theaterQueue[pvState.theaterQueueIndex];
        pvState.theaterQueueIndex++;

        var renderedEl = document.getElementById('pv-theater-rendered');
        if (!renderedEl) return;

        var speed = pvState.theaterSpeed;
        var delay = Math.max(500, 2000 / speed);

        if (item.type === 'scene-title') {
            // 已在外部渲染
            delay = 500 / speed;
        } else if (item.type === 'narration') {
            var div = document.createElement('div');
            div.className = 'pv-theater-narration';
            div.style.opacity = '0';
            div.textContent = item.content;
            renderedEl.appendChild(div);
            requestAnimationFrame(function() { div.style.opacity = '1'; div.style.transition = 'opacity 0.5s'; });
            delay = Math.max(1000, 3000 / speed);
        } else if (item.type === 'dialogue') {
            var div = document.createElement('div');
            div.className = 'pv-theater-dialogue';
            div.innerHTML = '<div class="pv-theater-avatar">' +
                (item.avatar ? '<img src="' + pvEsc(item.avatar) + '">' : pvEsc(item.name).charAt(0)) +
                '</div>' +
                '<div class="pv-theater-bubble">' +
                '<div class="pv-theater-speaker">' + pvEsc(item.name) + '</div>' +
                (item.action ? '<div class="pv-theater-action">' + pvEsc(item.action) + '</div>' : '') +
                '<div class="pv-theater-line">' + pvEsc(item.line) + '</div>' +
                '</div>';
            renderedEl.appendChild(div);
            delay = Math.max(800, (item.line.length * 80 + 1000) / speed);
        }

        // 自动滚动
        var contentEl = document.getElementById('pv-theater-content');
        if (contentEl) contentEl.scrollTop = contentEl.scrollHeight;

        pvState.theaterTimer = setTimeout(pvRenderNextInQueue, delay);
    }

    window.pvTheaterPause = function() {
        pvState.theaterPlaying = false;
        clearTimeout(pvState.theaterTimer);
        pvRender();
    };

    window.pvTheaterResume = function() {
        pvState.theaterPlaying = true;
        // 保留已渲染内容和弹幕，只更新按钮状态
        var renderedEl = document.getElementById('pv-theater-rendered');
        var savedHtml = renderedEl ? renderedEl.innerHTML : '';
        var danmakuZone = document.getElementById('pv-danmaku-zone');
        var savedDanmaku = danmakuZone ? danmakuZone.innerHTML : '';
        pvRender();
        renderedEl = document.getElementById('pv-theater-rendered');
        if (renderedEl && savedHtml) renderedEl.innerHTML = savedHtml;
        danmakuZone = document.getElementById('pv-danmaku-zone');
        if (danmakuZone && savedDanmaku) danmakuZone.innerHTML = savedDanmaku;
        pvRenderNextInQueue();
    };

    window.pvTheaterNextScene = function() {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) return;
        var ep = drama.episodes[pvState.currentEpIndex];
        if (!ep) return;
        var maxScene = (ep.scenes || []).length - 1;
        if (pvState.currentSceneIndex < maxScene) {
            pvState.currentSceneIndex++;
            clearTimeout(pvState.theaterTimer);
            // [FIX-场景切换] 先置false让pvRenderTheater能触发pvStartPlaying
            pvState.theaterPlaying = false;
            pvState.theaterQueue = [];
            pvState.theaterQueueIndex = 0;
            pvUpdateProgress();
            pvRender();
        } else {
            // 下一集
            var maxEp = (drama.episodes || []).length - 1;
            if (pvState.currentEpIndex < maxEp) {
                pvState.currentEpIndex++;
                pvState.currentSceneIndex = 0;
                clearTimeout(pvState.theaterTimer);
                // [FIX-跨集切换] 先置false让pvRenderTheater能触发pvStartPlaying
                pvState.theaterPlaying = false;
                pvState.theaterQueue = [];
                pvState.theaterQueueIndex = 0;
                pvUpdateProgress();
                pvRender();
                pvToast('下一集: ' + (drama.episodes[pvState.currentEpIndex].title || ''));
            } else {
                pvUpdateProgress();
                pvToast('已经是最后了');
            }
        }
    };

    window.pvTheaterPrevScene = function() {
        if (pvState.currentSceneIndex > 0) {
            pvState.currentSceneIndex--;
            clearTimeout(pvState.theaterTimer);
            // [FIX-场景切换] 先置false让pvRenderTheater能触发pvStartPlaying
            pvState.theaterPlaying = false;
            pvState.theaterQueue = [];
            pvState.theaterQueueIndex = 0;
            pvRender();
        } else if (pvState.currentEpIndex > 0) {
            pvState.currentEpIndex--;
            var drama = pvGetDrama(pvState.currentDramaId);
            var ep = drama && drama.episodes[pvState.currentEpIndex];
            pvState.currentSceneIndex = ep ? Math.max(0, (ep.scenes || []).length - 1) : 0;
            clearTimeout(pvState.theaterTimer);
            // [FIX-跨集切换] 先置false让pvRenderTheater能触发pvStartPlaying
            pvState.theaterPlaying = false;
            pvState.theaterQueue = [];
            pvState.theaterQueueIndex = 0;
            pvRender();
        } else {
            pvToast('已经是第一个了');
        }
    };

    window.pvCycleSpeed = function() {
        var speeds = [0.5, 1, 1.5, 2, 3];
        var idx = speeds.indexOf(pvState.theaterSpeed);
        pvState.theaterSpeed = speeds[(idx + 1) % speeds.length];
        var btn = document.querySelector('.pv-speed-btn');
        if (btn) btn.textContent = pvState.theaterSpeed + 'x';
        pvToast('播放速度: ' + pvState.theaterSpeed + 'x');
    };

    window.pvExitTheater = function() {
        pvStopTheater();
        pvState.view = 'detail';
        pvRender();
    };

    function pvStopTheater() {
        pvState.theaterPlaying = false;
        clearTimeout(pvState.theaterTimer);
        pvState.theaterQueue = [];
        pvState.theaterQueueIndex = 0;
        // 清除弹幕定时器
        pvState.danmakuTimers.forEach(function(t) { clearTimeout(t); });
        pvState.danmakuTimers = [];
    }

    window.pvToggleDanmaku = function() {
        pvState.danmakuEnabled = !pvState.danmakuEnabled;
        var zone = document.getElementById('pv-danmaku-zone');
        if (zone) zone.style.display = pvState.danmakuEnabled ? '' : 'none';
        pvToast(pvState.danmakuEnabled ? '弹幕已开' : '弹幕已关');
    };

    // ========== 弹幕系统 ==========
    window.pvSendDanmaku = function() {
        var input = document.getElementById('pv-danmaku-input');
        if (!input || !input.value.trim()) return;
        pvShowDanmaku(store.user.desktopName || '我', input.value.trim(), '#333');
        input.value = '';
    };

    function pvShowDanmaku(sender, text, color) {
        var zone = document.getElementById('pv-danmaku-zone');
        if (!zone || !pvState.danmakuEnabled) return;

        var el = document.createElement('div');
        el.className = 'pv-danmaku-item';
        el.style.top = Math.floor(Math.random() * 60) + 'px';
        el.style.color = color || 'var(--pv-text)';
        el.style.animationDuration = (5 + Math.random() * 3) + 's';
        el.innerHTML = '<span class="pv-danmaku-sender">' + pvEsc(sender) + '</span>' + pvEsc(text);
        zone.appendChild(el);
        el.addEventListener('animationend', function() { el.remove(); });
    }

    async function pvGenerateDanmaku(drama, scene) {
        if (!pvState.watchRoom || !pvState.watchRoom.members || pvState.watchRoom.members.length === 0) {
            // 没有同看成员，不生成弹幕
            // 但如果设置了自动弹幕，为所有联系人生成
            if (store.penguinVideo.settings.autoGenerateDanmaku && (store.contacts || []).length > 0) {
                var contacts = (store.contacts || []).slice(0, 3);
                pvGenerateDanmakuForContacts(drama, scene, contacts);
            }
            return;
        }

        var contacts = pvState.watchRoom.members.map(function(id) { return pvGetContact(id); }).filter(Boolean);
        pvGenerateDanmakuForContacts(drama, scene, contacts);
    }

    async function pvGenerateDanmakuForContacts(drama, scene, contacts) {
        if (!contacts || contacts.length === 0) return;
        var sceneContent = (scene.dialogues || []).map(function(d) {
            var ci = pvGetCastDisplay(drama, d.castId);
            return ci.name + (d.action ? '(' + d.action + ')' : '') + ':"' + d.line + '"';
        }).join(' ');

        var density = store.penguinVideo.settings.danmakuDensity || 'normal';
        var count = density === 'sparse' ? 1 : density === 'dense' ? 3 : 2;

        for (var i = 0; i < contacts.length; i++) {
            var c = contacts[i];
            try {
                var prompt = '你正在扮演' + (c.remark || c.name) + '和朋友一起看电视剧。' +
                    (c.persona ? '你的性格: ' + c.persona.substring(0, 200) : '') +
                    '\n当前剧情: ' + sceneContent.substring(0, 500) +
                    '\n请生成' + count + '条看剧时的即时弹幕反应。像真实的人在弹幕里说话(简短、口语化)。每条不超过15个字。' +
                    '输出JSON数组: [{"text":"弹幕内容","delay":秒数(1-8)}]。只返回JSON数组。';

                var resp = await API.chatCompletion([{role:'user', content:prompt}], {temperature:0.95, silent:false, scene:'penguin-video'});
                var text = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '';
                var jsonMatch = text.match(/\[[\s\S]*?\]/);
                if (jsonMatch) {
                    var items = JSON.parse(jsonMatch[0]);
                    items.forEach(function(item) {
                        var delay = (item.delay || Math.random() * 5 + 1) * 1000;
                        var timer = setTimeout(function() {
                            pvShowDanmaku(c.remark || c.name, item.text || '', pvRandomColor());
                        }, delay);
                        pvState.danmakuTimers.push(timer);

                        // 保存弹幕到同看房间
                        if (pvState.watchRoom) {
                            if (!pvState.watchRoom.danmakuHistory) pvState.watchRoom.danmakuHistory = [];
                            pvState.watchRoom.danmakuHistory.push({
                                sender: c.id,
                                text: item.text,
                                time: Date.now() + delay,
                            });
                        }
                    });
                }
            } catch(e) {
                console.warn('[PenguinVideo] Danmaku gen error for', c.name, e);
            }
        }
    }

    // ========== 一起看 ==========
    var pvInviteSelected = [];

    window.pvStartWatchTogether = function(dramaId) {
        pvInviteSelected = [];
        var el = document.getElementById('pv-content');
        if (!el) return;
        el.insertAdjacentHTML('beforeend', pvRenderInvite(el, dramaId));
    };

    window.pvQuickWatch = function(contactId) {
        // 快速和某联系人一起看
        var dramas = store.penguinVideo.dramas || [];
        if (dramas.length === 0) {
            pvToast('还没有剧集，先创建一部吧');
            pvStartWizard();
            return;
        }
        // 选最新的剧
        var latest = dramas[dramas.length - 1];
        pvInviteSelected = [contactId];
        pvState.currentDramaId = latest.id;
        pvState.currentEpIndex = 0;
        pvState.currentSceneIndex = 0;
        pvState.watchRoom = {
            id: pvId(),
            dramaId: latest.id,
            hostId: 'user',
            members: [contactId],
            currentEp: 0,
            currentScene: 0,
            danmakuHistory: [],
            reactions: [],
            status: 'playing',
        };
        store.penguinVideo.watchRooms.push(pvState.watchRoom);
        save();
        pvState.view = 'theater';
        pvState.theaterPlaying = false;
        pvState.theaterQueue = [];
        pvState.theaterQueueIndex = 0;
        pvRender();
        pvToast('已创建同看房间');
    };

    window.pvToggleInvite = function(contactId) {
        var idx = pvInviteSelected.indexOf(contactId);
        if (idx >= 0) pvInviteSelected.splice(idx, 1);
        else pvInviteSelected.push(contactId);

        // 更新UI
        var ck = document.getElementById('pv-invite-ck-' + contactId);
        if (ck) {
            if (pvInviteSelected.indexOf(contactId) >= 0) {
                ck.className = 'pv-invite-check checked';
                ck.innerHTML = PV_SVG.check;
            } else {
                ck.className = 'pv-invite-check';
                ck.innerHTML = '';
            }
        }
    };

    window.pvCloseModal = function() {
        var mask = document.querySelector('.pv-modal-mask');
        if (mask) mask.remove();
    };

    window.pvConfirmWatchTogether = function(dramaId) {
        if (pvInviteSelected.length === 0) {
            pvToast('请选择至少一个联系人');
            return;
        }
        var epSel = document.getElementById('pv-invite-ep');
        var epIdx = epSel ? parseInt(epSel.value) || 0 : 0;

        pvState.currentDramaId = dramaId;
        pvState.currentEpIndex = epIdx;
        pvState.currentSceneIndex = 0;
        pvState.watchRoom = {
            id: pvId(),
            dramaId: dramaId,
            hostId: 'user',
            members: pvInviteSelected.slice(),
            currentEp: epIdx,
            currentScene: 0,
            danmakuHistory: [],
            reactions: [],
            status: 'playing',
        };
        store.penguinVideo.watchRooms.push(pvState.watchRoom);
        save();

        pvCloseModal();
        pvState.view = 'theater';
        pvState.theaterPlaying = false;
        pvState.theaterQueue = [];
        pvState.theaterQueueIndex = 0;
        pvRender();

        // 生成入场弹幕
        pvState.watchRoom.members.forEach(function(mid) {
            var c = pvGetContact(mid);
            if (!c) return;
            setTimeout(function() {
                pvShowDanmaku(c.remark || c.name, '来啦来啦~', '');
            }, Math.random() * 2000 + 500);
        });

        pvToast('同看房间已创建');
    };

    // ========== 演绎模式 ==========
    window.pvStartCasting = function(dramaId) {
        pvState.currentDramaId = dramaId;
        pvState.performUserRole = null;
        pvState.performPartnerRoles = {};
        pvState.view = 'casting';
        pvRender();
    };

    window.pvStartPerformMode = function() {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) return;

        // 收集选角信息
        pvState.performUserRole = null;
        pvState.performPartnerRoles = {};

        (drama.cast || []).forEach(function(c) {
            var sel = document.getElementById('pv-cast-assign-' + c.id);
            if (!sel) return;
            var val = sel.value;
            if (val === 'user') {
                pvState.performUserRole = c.id;
            } else if (val && val.startsWith('contact:')) {
                var contactId = val.replace('contact:', '');
                pvState.performPartnerRoles[contactId] = c.id;
            }
        });

        var epSel = document.getElementById('pv-cast-episode');
        pvState.currentEpIndex = epSel ? parseInt(epSel.value) || 0 : 0;
        pvState.currentSceneIndex = 0;
        pvState.theaterPlaying = false;
        pvState.theaterQueue = [];
        pvState.theaterQueueIndex = 0;
        pvState.performMode = true;
        pvState.view = 'perform';

        // 创建同看房间用于弹幕
        var memberIds = Object.keys(pvState.performPartnerRoles);
        if (memberIds.length > 0) {
            pvState.watchRoom = {
                id: pvId(),
                dramaId: pvState.currentDramaId,
                hostId: 'user',
                members: memberIds,
                currentEp: pvState.currentEpIndex,
                currentScene: 0,
                danmakuHistory: [],
                reactions: [],
                status: 'playing',
            };
        }

        pvRender();
    };

    function pvStartPerforming() {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) return;
        var ep = drama.episodes[pvState.currentEpIndex];
        if (!ep || !ep.scenes || ep.scenes.length === 0) return;

        var scene = ep.scenes[pvState.currentSceneIndex];
        if (!scene) return;

        // 渲染场景开头
        pvState.theaterQueue = [];
        pvState.theaterQueueIndex = 0;

        if (scene.direction) {
            pvState.theaterQueue.push({ type: 'narration', content: scene.direction });
        }

        // 找到第一个需要用户输入的对话之前的NPC对话
        var dialogues = scene.dialogues || [];
        for (var i = 0; i < dialogues.length; i++) {
            var d = dialogues[i];
            if (d.castId === pvState.performUserRole) {
                // 到了用户的台词，停下等待输入
                break;
            }
            var castInfo = pvGetCastDisplay(drama, d.castId);
            pvState.theaterQueue.push({
                type: 'dialogue',
                castId: d.castId,
                name: castInfo.name,
                avatar: castInfo.avatar,
                action: d.action || '',
                line: d.line || '',
            });
        }

        pvState.theaterPlaying = true;
        pvRenderNextInQueue();
    }

    window.pvPerformFollowScript = function() {
        pvPerformSendLine(null); // null = 按剧本演
    };

    window.pvPerformImprovise = function() {
        var input = document.getElementById('pv-perform-input');
        var line = input ? input.value.trim() : '';
        if (!line) {
            pvToast('请输入你的台词');
            return;
        }
        pvPerformSendLine(line);
    };

    async function pvPerformSendLine(customLine) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) return;
        var ep = drama.episodes[pvState.currentEpIndex];
        if (!ep) return;
        var scene = (ep.scenes || [])[pvState.currentSceneIndex];
        if (!scene) return;

        var userChar = pvState.performUserRole ? pvGetCastMember(drama, pvState.performUserRole) : null;
        var renderedEl = document.getElementById('pv-theater-rendered');

        // 渲染用户的台词
        var userLine = customLine;
        if (!userLine && userChar) {
            // 按剧本
            var scriptLine = (scene.dialogues || []).find(function(d) { return d.castId === pvState.performUserRole; });
            userLine = scriptLine ? scriptLine.line : '...';
        }

        if (userChar && renderedEl) {
            var div = document.createElement('div');
            div.className = 'pv-theater-dialogue';
            div.innerHTML = '<div class="pv-theater-avatar">' + pvEsc(userChar.name).charAt(0) + '</div>' +
                '<div class="pv-theater-bubble">' +
                '<div class="pv-theater-speaker" style="color:var(--pv-success);">' + pvEsc(userChar.name) + ' (你)</div>' +
                '<div class="pv-theater-line">' + pvEsc(userLine) + '</div></div>';
            renderedEl.appendChild(div);
        }

        // 清空输入
        var input = document.getElementById('pv-perform-input');
        if (input) input.value = '';

        // 显示加载
        var loadingEl = document.getElementById('pv-theater-loading');
        if (loadingEl) loadingEl.style.display = '';

        // AI生成后续NPC反应
        try {
            var sceneContext = (scene.dialogues || []).map(function(d) {
                var ci = pvGetCastDisplay(drama, d.castId);
                return ci.name + ': ' + d.line;
            }).join('\n');

            var npcList = (drama.cast || []).filter(function(c) {
                return c.id !== pvState.performUserRole;
            }).map(function(c) {
                var partnerContactId = Object.keys(pvState.performPartnerRoles).find(function(k) { return pvState.performPartnerRoles[k] === c.id; });
                var partnerContact = partnerContactId ? pvGetContact(partnerContactId) : null;
                return c.name + '(' + (c.persona || '').substring(0, 80) + ')' +
                    (partnerContact ? ' [由' + (partnerContact.remark || partnerContact.name) + '的风格演绎]' : '');
            }).join('\n');

            var isImprov = customLine !== null;
            var prompt = '你正在导演一部电视剧的现场拍摄。\n' +
                '剧本场景: ' + (scene.setting || '') + '\n' +
                '原始剧本:\n' + sceneContext + '\n\n' +
                '当前角色分配:\n' +
                (userChar ? '用户扮演 ' + userChar.name + '，刚才说了: "' + userLine + '"' + (isImprov ? '（这是即兴发挥，偏离了剧本）' : '') : '') + '\n' +
                '其他NPC:\n' + npcList + '\n\n' +
                '请继续推进剧情。每个NPC都要有反应。' + (isImprov ? '注意：用户即兴发挥了，其他角色要根据这个新的输入做出合理反应，剧情可以偏离原来的走向。' : '') +
                '\n输出JSON: {"narration":"旁白描写","dialogues":[{"name":"角色名","action":"动作","line":"台词"}]}。只返回JSON。';

            var resp = await API.chatCompletion([{role:'user', content:prompt}], {temperature:0.85, silent:false, scene:'penguin-video'});
            var text = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '';
            var jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                var result = JSON.parse(jsonMatch[0]);
                if (loadingEl) loadingEl.style.display = 'none';

                // 渲染旁白
                if (result.narration && renderedEl) {
                    var narDiv = document.createElement('div');
                    narDiv.className = 'pv-theater-narration';
                    narDiv.textContent = result.narration;
                    renderedEl.appendChild(narDiv);
                }

                // 渲染NPC对话
                (result.dialogues || []).forEach(function(d, dIdx) {
                    setTimeout(function() {
                        if (!renderedEl) return;
                        var div = document.createElement('div');
                        div.className = 'pv-theater-dialogue';
                        div.innerHTML = '<div class="pv-theater-avatar">' + pvEsc(d.name || '?').charAt(0) + '</div>' +
                            '<div class="pv-theater-bubble">' +
                            '<div class="pv-theater-speaker">' + pvEsc(d.name || 'NPC') + '</div>' +
                            (d.action ? '<div class="pv-theater-action">' + pvEsc(d.action) + '</div>' : '') +
                            '<div class="pv-theater-line">' + pvEsc(d.line || '') + '</div></div>';
                        renderedEl.appendChild(div);
                        var contentEl = document.getElementById('pv-theater-content');
                        if (contentEl) contentEl.scrollTop = contentEl.scrollHeight;
                    }, (dIdx + 1) * 1500);
                });

                var contentEl = document.getElementById('pv-theater-content');
                if (contentEl) contentEl.scrollTop = contentEl.scrollHeight;
            }
        } catch(e) {
            console.warn('[PenguinVideo] Perform error:', e);
            if (loadingEl) loadingEl.style.display = 'none';
            pvToast('NPC反应生成失败');
        }
    }

    // ========== 狗血转折 ==========
    window.pvOpenPivot = function(dramaId, epIdx, sIdx, originalWord) {
        pvState.currentDramaId = dramaId;
        pvState.currentEpIndex = epIdx;
        pvState.currentSceneIndex = sIdx;
        pvState.view = 'twist';
        pvRender();
    };

    window.pvOpenTwistFromTheater = function() {
        pvStopTheater();
        pvState.view = 'twist';
        pvRender();
    };

    window.pvApplyTwist = async function(epIdx, sIdx, pivotIdx, replacement) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) return;
        var scene = drama.episodes[epIdx] && drama.episodes[epIdx].scenes[sIdx];
        if (!scene) return;
        var pw = (scene.pivotWords || [])[pivotIdx];
        if (!pw) return;

        var original = pw.original;
        if (window.aiModal) window.aiModal.loading('AI 正在改写命运...');

        // 替换文本
        var safeOriginal = pvEscapeRegex(original);
        (scene.dialogues || []).forEach(function(d) {
            if (d.line) d.line = d.line.replace(new RegExp(safeOriginal, 'g'), replacement);
        });
        if (scene.direction) scene.direction = scene.direction.replace(new RegExp(safeOriginal, 'g'), replacement);

        // 更新转折点记录
        pw.original = replacement;

        // AI重新生成后续剧情
        try {
            var context = (scene.dialogues || []).map(function(d) {
                var ci = pvGetCastDisplay(drama, d.castId);
                return ci.name + (d.action ? '(' + d.action + ')' : '') + ': ' + d.line;
            }).join('\n');

            var prompt = '你是一个擅长狗血剧的编剧。在电视剧《' + drama.title + '》中，用户将剧本中的关键词做了修改:\n' +
                '原来: "' + original + '" → 改为: "' + replacement + '"\n' +
                '修改后的当前场景:\n' + context + '\n\n' +
                '请基于这个改动，为接下来的2-3个场景重新编写剧情走向。改动虽小但剧情要有翻天覆地的变化（蝴蝶效应）。\n' +
                '输出JSON数组: [{"setting":"场景地点","direction":"旁白","dialogues":[{"castId":"角色名","line":"台词","action":"动作"}],"pivotWords":[{"original":"关键词","alternatives":["替换1","替换2"],"impact":"影响"}]}]。只返回JSON数组。';

            var resp = await API.chatCompletion([{role:'user', content:prompt}], {temperature:0.9, silent:false, scene:'penguin-video'});
            var text = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '';
            var jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                var newScenes = JSON.parse(jsonMatch[0]);
                newScenes.forEach(function(s) {
                    (s.dialogues || []).forEach(function(d) {
                        var cast = (drama.cast || []).find(function(c) { return c.name === d.castId || c.id === d.castId; });
                        if (cast) d.castId = cast.id;
                    });
                    if (!s.id) s.id = pvId();
                });

                // 替换当前场景之后的所有场景
                var ep = drama.episodes[epIdx];
                ep.scenes = ep.scenes.slice(0, sIdx + 1).concat(newScenes);
                drama.updatedAt = Date.now();
                save();
                pvRender();
                if (window.aiModal) window.aiModal.success('命运已改写，剧情发生了翻天覆地的变化');
            } else {
                if (window.aiModal) window.aiModal.fail('AI 返回格式异常');
            }
        } catch(e) {
            console.warn('[PenguinVideo] Twist error:', e);
            drama.updatedAt = Date.now();
            save();
            pvRender();
            if (window.aiModal) window.aiModal.fail('剧情改写失败');
        }
    };

    window.pvApplyCustomTwist = function(epIdx, sIdx, pivotIdx) {
        var input = document.getElementById('pv-twist-custom-' + pivotIdx);
        if (!input || !input.value.trim()) {
            pvToast('请输入替换词');
            return;
        }
        pvApplyTwist(epIdx, sIdx, pivotIdx, input.value.trim());
    };

    window.pvApplyDogbloodTemplate = async function(tplIdx) {
        var tpl = PV_DOGBLOOD_TEMPLATES[tplIdx];
        if (!tpl) return;
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) return;
        var ep = drama.episodes[pvState.currentEpIndex];
        if (!ep) return;

        if (window.aiModal) window.aiModal.loading('AI 正在注入狗血套路: ' + tpl.name + '...');

        try {
            var castNames = (drama.cast || []).map(function(c) { return c.name; }).join('、');
            var currentContent = ((ep.scenes || []).slice(-2)).map(function(s) {
                return s.setting + ': ' + (s.dialogues || []).map(function(d) {
                    var ci = pvGetCastDisplay(drama, d.castId);
                    return ci.name + ':"' + d.line + '"';
                }).join(' ');
            }).join(' → ');

            var prompt = '你是一个狗血编剧。在电视剧《' + drama.title + '》中，需要注入"' + tpl.name + '"的套路。\n' +
                '角色: ' + castNames + '\n' +
                '当前剧情: ' + currentContent.substring(0, 500) + '\n' +
                '狗血套路描述: ' + tpl.desc + '\n关键词: ' + tpl.keywords.join(',') + '\n\n' +
                '请生成2-3个新场景，将这个狗血套路完美融入现有剧情中。要够狗血、够抓马、够让观众尖叫。\n' +
                '输出JSON数组格式(同之前)。只返回JSON数组。';

            var resp = await API.chatCompletion([{role:'user', content:prompt}], {temperature:0.95, silent:false, scene:'penguin-video'});
            var text = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '';
            var jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                var newScenes = JSON.parse(jsonMatch[0]);
                newScenes.forEach(function(s) {
                    (s.dialogues || []).forEach(function(d) {
                        var cast = (drama.cast || []).find(function(c) { return c.name === d.castId || c.id === d.castId; });
                        if (cast) d.castId = cast.id;
                    });
                    if (!s.id) s.id = pvId();
                });

                // 追加到当前集
                ep.scenes = (ep.scenes || []).concat(newScenes);
                drama.updatedAt = Date.now();
                save();
                if (window.aiModal) window.aiModal.success(tpl.name + ' 已注入');
                // 回到放映厅播放新内容
                pvState.currentSceneIndex = (ep.scenes || []).length - newScenes.length;
                pvState.view = 'theater';
                pvState.theaterPlaying = false;
                pvState.theaterQueue = [];
                pvState.theaterQueueIndex = 0;
                pvRender();
            }
        } catch(e) {
            console.warn('[PenguinVideo] Dogblood error:', e);
            if (window.aiModal) window.aiModal.fail('注入失败');
        }
    };

    // ========== 设置保存 ==========
    window.pvSaveSetting = function(key, value) {
        if (!store.penguinVideo.settings) store.penguinVideo.settings = {};
        store.penguinVideo.settings[key] = value;
        save();
    };

    // ========== 追剧功能 ==========
    window.pvToggleFollow = function(dramaId) {
        var following = store.penguinVideo.following || [];
        var idx = following.findIndex(function(f) { return f.dramaId === dramaId; });
        if (idx >= 0) {
            following.splice(idx, 1);
            pvToast('已取消追剧');
        } else {
            following.push({ dramaId: dramaId, lastEp: 0, lastScene: 0, progress: 0 });
            pvToast('已添加到追剧列表');
        }
        store.penguinVideo.following = following;
        save();
        pvRender();
    };

    // ========== 新功能：剧集搜索 ==========
    function pvRenderSearch(el) {
        var query = pvState.searchQuery || '';
        var dramas = store.penguinVideo.dramas || [];

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'home\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">搜索</div>';
        html += '<div class="pv-nav-actions"></div></div>';

        html += '<div class="pv-search-bar">';
        html += '<div class="pv-search-input-wrap">';
        html += '<span class="pv-search-icon">' + PV_SVG.search + '</span>';
        html += '<input id="pv-search-input" placeholder="搜索剧名、标签、角色..." value="' + pvEsc(query) + '" oninput="pvDoSearch(this.value)">';
        if (query) html += '<button style="background:none;border:none;color:var(--pv-text3);cursor:pointer;" onclick="pvClearSearch()">' + PV_SVG.close + '</button>';
        html += '</div></div>';

        html += '<div class="pv-scroll">';

        if (!query) {
            // 显示热门标签和最近搜索
            html += '<div class="pv-section">';
            html += '<div class="pv-section-title" style="padding:0 16px;">所有类型</div>';
            html += '<div class="pv-genre-grid" style="padding:12px;">';
            Object.keys(PV_GENRES).forEach(function(g) {
                html += '<div class="pv-genre-item" onclick="pvFilterByGenre(\'' + g + '\');pvGo(\'home\')">';
                html += '<div class="pv-genre-icon">' + (PV_GENRE_ICONS[g] || PV_SVG.film) + '</div>';
                html += PV_GENRES[g];
                html += '</div>';
            });
            html += '</div></div>';
        } else {
            var lowerQuery = query.toLowerCase();
            var results = dramas.filter(function(d) {
                if ((d.title || '').toLowerCase().indexOf(lowerQuery) >= 0) return true;
                if ((d.synopsis || '').toLowerCase().indexOf(lowerQuery) >= 0) return true;
                if ((d.tags || []).some(function(t) { return t.toLowerCase().indexOf(lowerQuery) >= 0; })) return true;
                if ((d.cast || []).some(function(c) { return (c.name || '').toLowerCase().indexOf(lowerQuery) >= 0; })) return true;
                return false;
            });

            if (results.length === 0) {
                html += '<div class="pv-empty">' + PV_SVG.search + '<div class="pv-empty-text">没有找到相关剧集</div></div>';
            } else {
                html += '<div style="padding:8px 16px;font-size:12px;color:var(--pv-text3);">找到 ' + results.length + ' 部剧集</div>';
                html += '<div class="pv-drama-grid">';
                results.forEach(function(d) {
                    html += pvRenderDramaCard(d);
                });
                html += '</div>';
            }
        }

        html += '<div style="height:30px;"></div></div>';
        el.innerHTML = html;

        // 自动聚焦
        setTimeout(function() {
            var input = document.getElementById('pv-search-input');
            if (input && !query) input.focus();
        }, 100);
    }

    window.pvDoSearch = function(query) {
        pvState.searchQuery = query;
        // 不调用整个 pvRender 避免输入框失焦
        var dramas = store.penguinVideo.dramas || [];
        var lowerQuery = (query || '').toLowerCase();

        // 找到滚动区
        var scrollEl = document.querySelector('.pv-scroll');
        if (!scrollEl) { pvRender(); return; }

        if (!query) {
            pvRender();
            return;
        }

        var results = dramas.filter(function(d) {
            if ((d.title || '').toLowerCase().indexOf(lowerQuery) >= 0) return true;
            if ((d.synopsis || '').toLowerCase().indexOf(lowerQuery) >= 0) return true;
            if ((d.tags || []).some(function(t) { return t.toLowerCase().indexOf(lowerQuery) >= 0; })) return true;
            if ((d.cast || []).some(function(c) { return (c.name || '').toLowerCase().indexOf(lowerQuery) >= 0; })) return true;
            return false;
        });

        var html = '';
        if (results.length === 0) {
            html += '<div class="pv-empty">' + PV_SVG.search + '<div class="pv-empty-text">没有找到相关剧集</div></div>';
        } else {
            html += '<div style="padding:8px 16px;font-size:12px;color:var(--pv-text3);">找到 ' + results.length + ' 部剧集</div>';
            html += '<div class="pv-drama-grid">';
            results.forEach(function(d) {
                html += pvRenderDramaCard(d);
            });
            html += '</div>';
        }
        html += '<div style="height:30px;"></div>';
        scrollEl.innerHTML = html;
    };

    window.pvClearSearch = function() {
        pvState.searchQuery = '';
        pvRender();
    };

    // ========== 新功能：观看历史 ==========
    function pvRenderHistory(el) {
        var history = store.penguinVideo.history || [];
        var dramas = store.penguinVideo.dramas || [];

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'home\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">观看历史</div>';
        html += '<div class="pv-nav-actions">';
        if (history.length > 0) html += '<button class="pv-nav-btn" onclick="pvClearHistory()" title="清空">' + PV_SVG.trash + '</button>';
        html += '</div></div>';

        html += '<div class="pv-scroll">';

        if (history.length === 0) {
            html += '<div class="pv-empty">' + PV_SVG.eye + '<div class="pv-empty-text">还没有观看记录</div></div>';
        } else {
            history.forEach(function(h) {
                var d = dramas.find(function(x) { return x.id === h.dramaId; });
                if (!d) return;
                var ep = (d.episodes || [])[h.epIdx];
                var timeStr = pvFormatTime(h.time);
                html += '<div class="pv-follow-item" onclick="pvOpenDramaFromHistory(\'' + d.id + '\',' + h.epIdx + ',' + h.sceneIdx + ')">';
                html += '<div class="pv-follow-cover">';
                if (d.cover) html += '<img src="' + pvEsc(d.cover) + '">';
                else html += PV_SVG.film;
                html += '</div>';
                html += '<div class="pv-follow-info">';
                html += '<div class="pv-follow-title">' + pvEsc(d.title) + '</div>';
                html += '<div class="pv-follow-ep">看到第' + ((h.epIdx || 0) + 1) + '集 第' + ((h.sceneIdx || 0) + 1) + '场 · ' + (ep ? pvEsc(ep.title || '') : '') + '</div>';
                html += '<div style="font-size:11px;color:var(--pv-text3);margin-top:4px;">' + timeStr + '</div>';
                html += '</div></div>';
            });
        }

        html += '<div style="height:30px;"></div></div>';
        el.innerHTML = html;
    }

    function pvFormatTime(timestamp) {
        var diff = Date.now() - timestamp;
        var m = Math.floor(diff / 60000);
        if (m < 1) return '刚刚';
        if (m < 60) return m + '分钟前';
        var h = Math.floor(m / 60);
        if (h < 24) return h + '小时前';
        var d = Math.floor(h / 24);
        if (d < 7) return d + '天前';
        var date = new Date(timestamp);
        return (date.getMonth() + 1) + '月' + date.getDate() + '日';
    }

    window.pvOpenDramaFromHistory = function(dramaId, epIdx, sceneIdx) {
        pvState.currentDramaId = dramaId;
        pvState.currentEpIndex = epIdx || 0;
        pvState.currentSceneIndex = sceneIdx || 0;
        pvState.theaterPlaying = false;
        pvState.theaterQueue = [];
        pvState.theaterQueueIndex = 0;
        pvState.view = 'theater';
        pvRender();
    };

    window.pvClearHistory = function() {
        if (!confirm('确定清空所有观看记录？')) return;
        store.penguinVideo.history = [];
        save();
        pvRender();
        pvToast('历史已清空');
    };

    // ========== 新功能：短评系统 ==========
    function pvRenderReviews(el) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) { pvGo('home'); return; }
        var reviews = (store.penguinVideo.reviews || []).filter(function(r) { return r.dramaId === drama.id; });
        reviews.sort(function(a, b) { return b.time - a.time; });

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'detail\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">短评 · ' + pvEsc(drama.title) + '</div>';
        html += '<div class="pv-nav-actions"></div></div>';

        html += '<div class="pv-scroll">';

        // 添加新评论
        html += '<div style="padding:16px;border-bottom:1px solid var(--pv-border);">';
        html += '<div class="pv-form-group">';
        html += '<label class="pv-form-label">写一条短评</label>';
        html += '<textarea class="pv-textarea" id="pv-review-input" placeholder="说说你对这部剧的看法...(最多200字)" maxlength="200" style="min-height:60px;"></textarea>';
        html += '</div>';
        html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">';
        html += '<span style="font-size:13px;color:var(--pv-text2);">评分:</span>';
        html += '<select class="pv-select" id="pv-review-rating" style="width:auto;">';
        html += '<option value="5">★★★★★ 神剧</option>';
        html += '<option value="4">★★★★☆ 推荐</option>';
        html += '<option value="3" selected>★★★☆☆ 还行</option>';
        html += '<option value="2">★★☆☆☆ 一般</option>';
        html += '<option value="1">★☆☆☆☆ 差评</option>';
        html += '</select></div>';
        html += '<button class="pv-btn pv-btn-primary pv-btn-full" onclick="pvSubmitReview(\'' + drama.id + '\')">' + PV_SVG.send + ' 发布短评</button>';
        html += '</div>';

        // 评论列表
        if (reviews.length === 0) {
            html += '<div class="pv-empty" style="padding:40px 20px;">' + PV_SVG.heart + '<div class="pv-empty-text">还没有短评，写下第一条吧</div></div>';
        } else {
            html += '<div style="padding:0 16px;font-size:13px;color:var(--pv-text3);margin:12px 0;">共 ' + reviews.length + ' 条短评</div>';
            reviews.forEach(function(r) {
                html += '<div style="padding:12px 16px;border-bottom:1px solid var(--pv-border);">';
                html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">';
                html += '<span style="font-size:14px;font-weight:600;color:var(--pv-text);">' + pvEsc(r.author || '我') + '</span>';
                var stars = '';
                for (var i = 0; i < 5; i++) stars += i < (r.rating || 0) ? '★' : '☆';
                html += '<span style="color:var(--pv-warn);font-size:13px;">' + stars + '</span>';
                html += '<span style="font-size:11px;color:var(--pv-text3);margin-left:auto;">' + pvFormatTime(r.time) + '</span>';
                html += '</div>';
                html += '<div style="font-size:14px;color:var(--pv-text);line-height:1.6;">' + pvEsc(r.content) + '</div>';
                if (r.author === '我' || !r.author) {
                    html += '<button style="background:none;border:none;color:var(--pv-text3);cursor:pointer;font-size:12px;margin-top:6px;" onclick="pvDeleteReview(\'' + r.id + '\')">' + PV_SVG.trash + ' 删除</button>';
                }
                html += '</div>';
            });
        }

        // AI生成联系人短评
        html += '<div style="padding:16px;">';
        html += '<button class="pv-btn pv-btn-ai pv-btn-full" onclick="pvAiGenReviews(\'' + drama.id + '\')">' + PV_SVG.magic + ' AI 模拟联系人短评</button>';
        html += '</div>';

        html += '<div style="height:30px;"></div></div>';
        el.innerHTML = html;
    }

    window.pvSubmitReview = function(dramaId) {
        var content = (document.getElementById('pv-review-input') || {}).value || '';
        var rating = parseInt((document.getElementById('pv-review-rating') || {}).value) || 3;
        if (!content.trim()) { pvToast('请输入评论内容'); return; }
        if (!store.penguinVideo.reviews) store.penguinVideo.reviews = [];
        store.penguinVideo.reviews.push({
            id: pvId(),
            dramaId: dramaId,
            author: '我',
            content: content.trim(),
            rating: rating,
            time: Date.now(),
        });
        save();
        pvRender();
        pvToast('短评已发布');
    };

    window.pvDeleteReview = function(reviewId) {
        if (!confirm('确定删除这条短评？')) return;
        store.penguinVideo.reviews = (store.penguinVideo.reviews || []).filter(function(r) { return r.id !== reviewId; });
        save();
        pvRender();
    };

    window.pvAiGenReviews = async function(dramaId) {
        if (!store.system || !store.system.url || !store.system.key) {
            alert('⚠️ 请先在设置中配置API接口');
            return;
        }
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        var contacts = (store.contacts || []).slice(0, 3);
        if (contacts.length === 0) { pvToast('需要先添加联系人'); return; }

        if (window.aiModal) window.aiModal.loading('AI 模拟短评中...');
        try {
            var ctxList = contacts.map(function(c, i) {
                return (i + 1) + '. ' + (c.remark || c.name) + (c.persona ? '（' + c.persona.substring(0, 80) + '）' : '');
            }).join('\n');

            var prompt = '你正在模拟以下联系人对电视剧《' + drama.title + '》(' + (PV_GENRES[drama.genre] || '') + ')的短评：\n' + ctxList + '\n\n' +
                '剧情简介: ' + (drama.synopsis || '无').substring(0, 200) + '\n\n' +
                '请为每个人生成一条符合其性格的短评(50字以内,口语化,可有不同观点)。\n' +
                '输出JSON数组: [{"name":"姓名","content":"短评","rating":1-5}]。只返回JSON数组。';

            var resp = await API.chatCompletion([{role:'user', content:prompt}], {temperature:0.95, silent:false, scene:'penguin-video'});
            var text = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '';
            var jsonMatch = text.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
                var items = JSON.parse(jsonMatch[0]);
                if (!store.penguinVideo.reviews) store.penguinVideo.reviews = [];
                items.forEach(function(item) {
                    store.penguinVideo.reviews.push({
                        id: pvId(),
                        dramaId: dramaId,
                        author: item.name,
                        content: item.content,
                        rating: item.rating || 3,
                        time: Date.now() - Math.random() * 86400000,
                    });
                });
                save();
                pvRender();
                if (window.aiModal) window.aiModal.success('已生成 ' + items.length + ' 条短评');
            } else {
                if (window.aiModal) window.aiModal.fail('AI 返回格式异常');
            }
        } catch(e) {
            console.warn('[PenguinVideo] AI reviews error:', e);
            if (window.aiModal) window.aiModal.fail('生成失败');
        }
    };

    window.pvOpenReviews = function(dramaId) {
        pvState.currentDramaId = dramaId;
        pvState.view = 'reviews';
        pvRender();
    };

    // ========== 新功能：收藏夹 ==========
    function pvRenderCollections(el) {
        var collections = store.penguinVideo.collections || [];
        var dramas = store.penguinVideo.dramas || [];

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'home\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">收藏夹</div>';
        html += '<div class="pv-nav-actions">';
        html += '<button class="pv-nav-btn" onclick="pvCreateCollection()" title="新建收藏夹">' + PV_SVG.plus + '</button>';
        html += '</div></div>';

        html += '<div class="pv-scroll">';

        if (collections.length === 0) {
            html += '<div class="pv-empty">' + PV_SVG.bookmark + '<div class="pv-empty-text">还没有收藏夹</div><button class="pv-empty-btn" onclick="pvCreateCollection()">创建第一个</button></div>';
        } else {
            collections.forEach(function(col) {
                var dramaIds = col.dramaIds || [];
                var colDramas = dramaIds.map(function(id) { return dramas.find(function(d) { return d.id === id; }); }).filter(Boolean);
                html += '<div style="padding:12px 16px;border-bottom:1px solid var(--pv-border);">';
                html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">';
                html += '<div>';
                html += '<div style="font-size:15px;font-weight:600;color:var(--pv-text);">' + pvEsc(col.name) + '</div>';
                html += '<div style="font-size:11px;color:var(--pv-text3);margin-top:2px;">' + colDramas.length + '部 · ' + pvFormatTime(col.createdAt || Date.now()) + '</div>';
                html += '</div>';
                html += '<div style="display:flex;gap:4px;">';
                html += '<button class="pv-ep-btn" onclick="pvRenameCollection(\'' + col.id + '\')" title="重命名">' + PV_SVG.pen + '</button>';
                html += '<button class="pv-ep-btn" onclick="pvDeleteCollection(\'' + col.id + '\')" title="删除">' + PV_SVG.trash + '</button>';
                html += '</div></div>';

                if (colDramas.length === 0) {
                    html += '<div style="font-size:13px;color:var(--pv-text3);padding:8px 0;">空空如也</div>';
                } else {
                    html += '<div class="pv-hscroll">';
                    colDramas.forEach(function(d) {
                        html += '<div class="pv-hscroll-card" onclick="pvOpenDrama(\'' + d.id + '\')">';
                        html += '<div class="pv-hscroll-cover">';
                        if (d.cover) html += '<img src="' + pvEsc(d.cover) + '">';
                        else html += PV_SVG.film;
                        html += '</div>';
                        html += '<div class="pv-hscroll-title">' + pvEsc(d.title) + '</div>';
                        html += '</div>';
                    });
                    html += '</div>';
                }

                html += '</div>';
            });
        }

        html += '<div style="height:30px;"></div></div>';
        el.innerHTML = html;
    }

    window.pvCreateCollection = function() {
        var name = prompt('收藏夹名称:');
        if (!name || !name.trim()) return;
        if (!store.penguinVideo.collections) store.penguinVideo.collections = [];
        store.penguinVideo.collections.push({
            id: pvId(),
            name: name.trim(),
            dramaIds: [],
            createdAt: Date.now(),
        });
        save();
        pvRender();
        pvToast('已创建');
    };

    window.pvRenameCollection = function(colId) {
        var col = (store.penguinVideo.collections || []).find(function(c) { return c.id === colId; });
        if (!col) return;
        var name = prompt('新名称:', col.name);
        if (!name || !name.trim()) return;
        col.name = name.trim();
        save();
        pvRender();
    };

    window.pvDeleteCollection = function(colId) {
        if (!confirm('确定删除该收藏夹？')) return;
        store.penguinVideo.collections = (store.penguinVideo.collections || []).filter(function(c) { return c.id !== colId; });
        save();
        pvRender();
        pvToast('已删除');
    };

    window.pvAddToCollection = function(dramaId) {
        var collections = store.penguinVideo.collections || [];
        if (collections.length === 0) {
            pvCreateCollection();
            return;
        }
        var names = collections.map(function(c, i) { return (i + 1) + '. ' + c.name + (c.dramaIds && c.dramaIds.indexOf(dramaId) >= 0 ? ' ✓' : ''); }).join('\n');
        var input = prompt('选择收藏夹（输入数字）:\n' + names + '\n0. 新建收藏夹');
        if (input === null) return;
        var idx = parseInt(input);
        if (idx === 0) {
            var name = prompt('新收藏夹名称:');
            if (!name || !name.trim()) return;
            var newCol = { id: pvId(), name: name.trim(), dramaIds: [dramaId], createdAt: Date.now() };
            collections.push(newCol);
            store.penguinVideo.collections = collections;
            save();
            pvToast('已收藏到「' + name + '」');
            return;
        }
        if (isNaN(idx) || idx < 1 || idx > collections.length) return;
        var col = collections[idx - 1];
        if (!col.dramaIds) col.dramaIds = [];
        if (col.dramaIds.indexOf(dramaId) >= 0) {
            col.dramaIds = col.dramaIds.filter(function(id) { return id !== dramaId; });
            pvToast('已从「' + col.name + '」移出');
        } else {
            col.dramaIds.push(dramaId);
            pvToast('已收藏到「' + col.name + '」');
        }
        save();
    };

    // ========== 新功能：分支剧情/平行宇宙 ==========
    function pvRenderBranches(el) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) { pvGo('home'); return; }
        var branches = (store.penguinVideo.branches || []).filter(function(b) { return b.parentDramaId === drama.id; });

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'detail\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">平行宇宙 · ' + pvEsc(drama.title) + '</div>';
        html += '<div class="pv-nav-actions"></div></div>';

        html += '<div class="pv-scroll">';

        html += '<div class="pv-twist-panel">';
        html += '<div class="pv-twist-title">' + PV_SVG.twist + ' 平行宇宙</div>';
        html += '<div class="pv-twist-desc">从任意场景创建分支，让剧情走向不同的可能性。每个分支都是独立的"平行宇宙"，可以单独观看和发展。</div>';
        html += '</div>';

        html += '<div style="padding:16px;">';
        html += '<button class="pv-btn pv-btn-primary pv-btn-full" onclick="pvCreateBranch(\'' + drama.id + '\')">' + PV_SVG.plus + ' 从当前进度创建新分支</button>';
        html += '</div>';

        if (branches.length === 0) {
            html += '<div class="pv-empty">' + PV_SVG.twist + '<div class="pv-empty-text">还没有分支宇宙</div></div>';
        } else {
            html += '<div style="padding:0 16px 8px;font-size:13px;color:var(--pv-text2);">已有 ' + branches.length + ' 个分支宇宙</div>';
            branches.forEach(function(b) {
                var branchDrama = pvGetDrama(b.branchDramaId);
                if (!branchDrama) return;
                html += '<div class="pv-follow-item" onclick="pvOpenDrama(\'' + branchDrama.id + '\')">';
                html += '<div class="pv-follow-cover" style="background:linear-gradient(135deg,var(--pv-accent),var(--pv-accent2));">';
                html += '<span style="color:#fff;font-size:18px;font-weight:700;">分支</span>';
                html += '</div>';
                html += '<div class="pv-follow-info">';
                html += '<div class="pv-follow-title">' + pvEsc(branchDrama.title) + '</div>';
                html += '<div class="pv-follow-ep">分支点: 第' + ((b.fromEpIdx || 0) + 1) + '集 第' + ((b.fromSceneIdx || 0) + 1) + '场</div>';
                if (b.description) html += '<div style="font-size:11px;color:var(--pv-text3);margin-top:4px;">' + pvEsc(b.description) + '</div>';
                html += '</div>';
                html += '<button class="pv-ep-btn" onclick="event.stopPropagation();pvDeleteBranch(\'' + b.id + '\')" title="删除">' + PV_SVG.trash + '</button>';
                html += '</div>';
            });
        }

        html += '<div style="height:30px;"></div></div>';
        el.innerHTML = html;
    }

    window.pvOpenBranches = function(dramaId) {
        pvState.currentDramaId = dramaId;
        pvState.view = 'branches';
        pvRender();
    };

    window.pvCreateBranch = async function(dramaId) {
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        var description = prompt('描述这个分支（如：男主选择离开 / 真相被揭露 / ...）：', '');
        if (description === null) return;
        var fromEpIdx = pvState.currentEpIndex || 0;
        var fromSceneIdx = pvState.currentSceneIndex || 0;

        // 创建新剧集（分支宇宙）
        var branchDrama = JSON.parse(JSON.stringify(drama));
        branchDrama.id = pvId();
        branchDrama.title = drama.title + ' · ' + (description || '分支');
        branchDrama.createdAt = Date.now();
        branchDrama.updatedAt = Date.now();
        // 截断到分支点
        branchDrama.episodes = (branchDrama.episodes || []).slice(0, fromEpIdx + 1);
        if (branchDrama.episodes[fromEpIdx]) {
            branchDrama.episodes[fromEpIdx] = JSON.parse(JSON.stringify(branchDrama.episodes[fromEpIdx]));
            branchDrama.episodes[fromEpIdx].scenes = (branchDrama.episodes[fromEpIdx].scenes || []).slice(0, fromSceneIdx + 1);
            // 重新生成新ID
            branchDrama.episodes[fromEpIdx].scenes.forEach(function(s) { s.id = pvId(); });
            branchDrama.episodes[fromEpIdx].id = pvId();
        }

        store.penguinVideo.dramas.push(branchDrama);

        if (!store.penguinVideo.branches) store.penguinVideo.branches = [];
        store.penguinVideo.branches.push({
            id: pvId(),
            parentDramaId: drama.id,
            branchDramaId: branchDrama.id,
            fromEpIdx: fromEpIdx,
            fromSceneIdx: fromSceneIdx,
            description: description || '',
            createdAt: Date.now(),
        });
        save();
        pvToast('分支宇宙已创建，正在AI生成新剧情...');

        // AI 生成分支后续
        if (store.system && store.system.url && store.system.key && description) {
            try {
                var lastScene = (branchDrama.episodes[fromEpIdx].scenes || [])[fromSceneIdx];
                if (lastScene) {
                    var ctx = (lastScene.dialogues || []).map(function(d) {
                        var ci = pvGetCastDisplay(branchDrama, d.castId);
                        return ci.name + ': ' + d.line;
                    }).join('\n');
                    var castNames = (branchDrama.cast || []).map(function(c) { return c.name; }).join('、');
                    var prompt = '你是编剧。剧本《' + drama.title + '》在第' + (fromEpIdx + 1) + '集第' + (fromSceneIdx + 1) + '场出现了分支：\n' +
                        '当前场景: ' + (lastScene.setting || '') + '\n' +
                        ctx + '\n\n' +
                        '分支走向: ' + description + '\n' +
                        '角色: ' + castNames + '\n\n' +
                        '请为这个分支宇宙生成2-3个新场景，让剧情按这个新方向发展。\n' +
                        '输出JSON数组(同剧本格式)。只返回JSON数组。';

                    var resp = await API.chatCompletion([{role:'user', content:prompt}], {temperature:0.95, silent:false, scene:'penguin-video'});
                    var text = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '';
                    var jsonMatch = text.match(/\[[\s\S]*\]/);
                    if (jsonMatch) {
                        var newScenes = JSON.parse(jsonMatch[0]);
                        newScenes.forEach(function(s) {
                            (s.dialogues || []).forEach(function(d) {
                                var cast = (branchDrama.cast || []).find(function(c) { return c.name === d.castId || c.id === d.castId; });
                                if (cast) d.castId = cast.id;
                                else {
                                    var newCast = { id: pvId(), name: d.castId || '路人', avatar: '', persona: '', role: 'extra', voiceStyle: '', playedBy: null };
                                    branchDrama.cast.push(newCast);
                                    d.castId = newCast.id;
                                }
                            });
                            if (!s.id) s.id = pvId();
                        });
                        branchDrama.episodes[fromEpIdx].scenes = branchDrama.episodes[fromEpIdx].scenes.concat(newScenes);
                        save();
                    }
                }
            } catch(e) {
                console.warn('[PenguinVideo] Branch AI error:', e);
            }
        }

        pvState.currentDramaId = branchDrama.id;
        pvState.view = 'detail';
        pvRender();
    };

    window.pvDeleteBranch = function(branchId) {
        if (!confirm('确定删除该分支宇宙？')) return;
        var branch = (store.penguinVideo.branches || []).find(function(b) { return b.id === branchId; });
        if (branch) {
            // 同时删除分支剧集
            store.penguinVideo.dramas = (store.penguinVideo.dramas || []).filter(function(d) { return d.id !== branch.branchDramaId; });
        }
        store.penguinVideo.branches = (store.penguinVideo.branches || []).filter(function(b) { return b.id !== branchId; });
        save();
        pvRender();
        pvToast('已删除');
    };

    // ========== 新功能：角色关系图谱 ==========
    function pvRenderRelations(el) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) { pvGo('home'); return; }
        var cast = drama.cast || [];
        var relations = drama.relations || [];

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'detail\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">角色关系</div>';
        html += '<div class="pv-nav-actions">';
        html += '<button class="pv-nav-btn" onclick="pvAiAnalyzeRelations(\'' + drama.id + '\')" title="AI分析">' + PV_SVG.magic + '</button>';
        html += '</div></div>';

        html += '<div class="pv-scroll">';

        if (cast.length === 0) {
            html += '<div class="pv-empty">' + PV_SVG.people + '<div class="pv-empty-text">还没有角色</div></div>';
        } else {
            // 角色网格视图（简化版关系图）
            html += '<div style="padding:16px;">';
            html += '<div class="pv-form-hint" style="margin-bottom:12px;">点击两个角色之间的连线查看关系，长按角色编辑。</div>';

            // 角色头像环形布局
            html += '<div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;padding:16px;background:var(--pv-card);border-radius:var(--pv-radius);">';
            cast.forEach(function(c) {
                html += '<div style="text-align:center;cursor:pointer;" onclick="pvShowRelationsForCast(\'' + drama.id + '\',\'' + c.id + '\')">';
                html += '<div class="pv-cast-avatar" style="width:60px;height:60px;margin:0 auto 6px;">';
                if (c.avatar) html += '<img src="' + pvEsc(c.avatar) + '">';
                else html += pvEsc(c.name).charAt(0);
                html += '</div>';
                html += '<div style="font-size:12px;color:var(--pv-text);max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + pvEsc(c.name) + '</div>';
                html += '<div style="font-size:10px;color:var(--pv-text3);">' + (c.role === 'lead' ? '主角' : c.role === 'supporting' ? '配角' : '群演') + '</div>';
                html += '</div>';
            });
            html += '</div></div>';

            // 关系列表
            html += '<div style="padding:0 16px 16px;">';
            html += '<div style="font-size:14px;font-weight:600;color:var(--pv-text);margin-bottom:10px;">关系列表 (' + relations.length + ')';
            html += '<button class="pv-btn pv-btn-sm pv-btn-secondary" style="margin-left:10px;" onclick="pvAddRelation(\'' + drama.id + '\')">' + PV_SVG.plus + ' 添加</button>';
            html += '</div>';

            if (relations.length === 0) {
                html += '<div style="text-align:center;color:var(--pv-text3);font-size:13px;padding:20px;">还没有定义关系，点击右上角的魔棒让 AI 自动分析</div>';
            } else {
                relations.forEach(function(r, idx) {
                    var castA = pvGetCastMember(drama, r.fromId);
                    var castB = pvGetCastMember(drama, r.toId);
                    if (!castA || !castB) return;
                    var color = pvRelationColor(r.type);
                    html += '<div style="display:flex;align-items:center;padding:10px 12px;background:var(--pv-card);border:1px solid var(--pv-border);border-radius:var(--pv-radius);margin-bottom:6px;gap:10px;">';
                    html += '<span style="font-size:13px;font-weight:500;color:var(--pv-text);">' + pvEsc(castA.name) + '</span>';
                    html += '<span style="font-size:11px;color:#fff;background:' + color + ';padding:2px 8px;border-radius:10px;">' + pvEsc(r.type) + '</span>';
                    html += '<span style="font-size:13px;font-weight:500;color:var(--pv-text);">' + pvEsc(castB.name) + '</span>';
                    if (r.note) html += '<span style="font-size:11px;color:var(--pv-text3);margin-left:auto;">' + pvEsc(r.note) + '</span>';
                    html += '<button class="pv-ep-btn" style="margin-left:auto;" onclick="pvDeleteRelation(\'' + drama.id + '\',' + idx + ')">' + PV_SVG.trash + '</button>';
                    html += '</div>';
                });
            }
            html += '</div>';
        }

        html += '<div style="height:30px;"></div></div>';
        el.innerHTML = html;
    }

    function pvRelationColor(type) {
        var map = {
            '恋人': '#e94560',
            '夫妻': '#e94560',
            '前任': '#9d4edd',
            '父子': '#3a86ff',
            '父女': '#3a86ff',
            '母子': '#3a86ff',
            '母女': '#3a86ff',
            '兄妹': '#06a77d',
            '兄弟': '#06a77d',
            '姐妹': '#06a77d',
            '朋友': '#fb8500',
            '闺蜜': '#fb8500',
            '兄弟会': '#fb8500',
            '敌人': '#d62828',
            '仇人': '#d62828',
            '同事': '#6c757d',
            '上下级': '#6c757d',
            '师徒': '#7209b7',
        };
        return map[type] || '#6c757d';
    }

    window.pvOpenRelations = function(dramaId) {
        pvState.currentDramaId = dramaId;
        pvState.view = 'relations';
        pvRender();
    };

    window.pvShowRelationsForCast = function(dramaId, castId) {
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        var c = pvGetCastMember(drama, castId);
        if (!c) return;
        var rels = (drama.relations || []).filter(function(r) { return r.fromId === castId || r.toId === castId; });
        if (rels.length === 0) {
            pvToast(c.name + ' 还没有关系记录');
            return;
        }
        var lines = rels.map(function(r) {
            var other = r.fromId === castId ? r.toId : r.fromId;
            var oc = pvGetCastMember(drama, other);
            return (oc ? oc.name : '?') + ' - ' + r.type + (r.note ? ' (' + r.note + ')' : '');
        }).join('\n');
        alert(c.name + ' 的关系:\n' + lines);
    };

    window.pvAddRelation = function(dramaId) {
        var drama = pvGetDrama(dramaId);
        if (!drama || !drama.cast || drama.cast.length < 2) { pvToast('需要至少2个角色'); return; }
        var names = drama.cast.map(function(c, i) { return (i + 1) + '. ' + c.name; }).join('\n');
        var fromIdx = parseInt(prompt('选择第一个角色（数字）:\n' + names));
        if (isNaN(fromIdx) || fromIdx < 1 || fromIdx > drama.cast.length) return;
        var toIdx = parseInt(prompt('选择第二个角色（数字）:\n' + names));
        if (isNaN(toIdx) || toIdx < 1 || toIdx > drama.cast.length || toIdx === fromIdx) return;
        var type = prompt('关系类型（如：恋人、朋友、敌人、父子、师徒...）:');
        if (!type || !type.trim()) return;
        var note = prompt('备注（可选）:', '');
        if (!drama.relations) drama.relations = [];
        drama.relations.push({
            fromId: drama.cast[fromIdx - 1].id,
            toId: drama.cast[toIdx - 1].id,
            type: type.trim(),
            note: note || '',
        });
        drama.updatedAt = Date.now();
        save();
        pvRender();
    };

    window.pvDeleteRelation = function(dramaId, idx) {
        if (!confirm('确定删除该关系？')) return;
        var drama = pvGetDrama(dramaId);
        if (!drama || !drama.relations) return;
        drama.relations.splice(idx, 1);
        drama.updatedAt = Date.now();
        save();
        pvRender();
    };

    window.pvAiAnalyzeRelations = async function(dramaId) {
        if (!store.system || !store.system.url || !store.system.key) {
            alert('⚠️ 请先在设置中配置API接口');
            return;
        }
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        if (!drama.cast || drama.cast.length < 2) { pvToast('需要至少2个角色'); return; }
        if (window.aiModal) window.aiModal.loading('AI 正在分析角色关系...');
        try {
            var castInfo = drama.cast.map(function(c) {
                return c.name + '(' + (c.role === 'lead' ? '主角' : '配角') + '): ' + (c.persona || '').substring(0, 80);
            }).join('\n');

            var sceneText = '';
            (drama.episodes || []).slice(0, 2).forEach(function(ep) {
                (ep.scenes || []).slice(0, 3).forEach(function(s) {
                    (s.dialogues || []).forEach(function(d) {
                        var ci = pvGetCastDisplay(drama, d.castId);
                        sceneText += ci.name + ':"' + (d.line || '').substring(0, 30) + '" ';
                    });
                });
            });

            var prompt = '你是剧本分析师。分析电视剧《' + drama.title + '》中角色之间的关系。\n' +
                '角色:\n' + castInfo + '\n\n' +
                '剧情片段: ' + sceneText.substring(0, 800) + '\n\n' +
                '请输出关系JSON数组: [{"fromName":"角色1","toName":"角色2","type":"关系(如:恋人/朋友/敌人/父子)","note":"简短备注"}]\n' +
                '只返回JSON数组。';

            var resp = await API.chatCompletion([{role:'user', content:prompt}], {temperature:0.7, silent:false, scene:'penguin-video'});
            var text = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '';
            var jsonMatch = text.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
                var rels = JSON.parse(jsonMatch[0]);
                if (!drama.relations) drama.relations = [];
                rels.forEach(function(r) {
                    var fromCast = drama.cast.find(function(c) { return c.name === r.fromName; });
                    var toCast = drama.cast.find(function(c) { return c.name === r.toName; });
                    if (fromCast && toCast) {
                        // 去重：相同两个角色的关系覆盖
                        drama.relations = drama.relations.filter(function(x) {
                            return !(x.fromId === fromCast.id && x.toId === toCast.id);
                        });
                        drama.relations.push({
                            fromId: fromCast.id,
                            toId: toCast.id,
                            type: r.type || '关联',
                            note: r.note || '',
                        });
                    }
                });
                drama.updatedAt = Date.now();
                save();
                pvRender();
                if (window.aiModal) window.aiModal.success('已分析 ' + rels.length + ' 个关系');
            } else {
                if (window.aiModal) window.aiModal.fail('AI 返回格式异常');
            }
        } catch(e) {
            console.warn('[PenguinVideo] Relations error:', e);
            if (window.aiModal) window.aiModal.fail('分析失败');
        }
    };

    // ========== 新功能：剧情回顾/前情提要 ==========
    function pvRenderRecap(el) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) { pvGo('home'); return; }

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'detail\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">剧情回顾</div>';
        html += '<div class="pv-nav-actions">';
        html += '<button class="pv-nav-btn" onclick="pvAiGenRecap(\'' + drama.id + '\')" title="AI生成">' + PV_SVG.magic + '</button>';
        html += '</div></div>';

        html += '<div class="pv-scroll">';
        html += '<div style="padding:16px;">';

        // 剧集概览
        html += '<div style="background:var(--pv-card);border:1px solid var(--pv-border);border-radius:var(--pv-radius);padding:14px;margin-bottom:14px;">';
        html += '<div style="font-size:16px;font-weight:700;color:var(--pv-text);margin-bottom:6px;">' + pvEsc(drama.title) + '</div>';
        html += '<div style="font-size:12px;color:var(--pv-accent);margin-bottom:8px;">' + (PV_GENRES[drama.genre] || '') + '</div>';
        if (drama.synopsis) html += '<div style="font-size:13px;color:var(--pv-text2);line-height:1.6;">' + pvEsc(drama.synopsis) + '</div>';
        html += '</div>';

        // 各集摘要
        (drama.episodes || []).forEach(function(ep, idx) {
            html += '<div style="margin-bottom:14px;">';
            html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">';
            html += '<div class="pv-ep-num">' + (idx + 1) + '</div>';
            html += '<div style="font-size:14px;font-weight:600;color:var(--pv-text);">' + pvEsc(ep.title || ('第' + (idx + 1) + '集')) + '</div>';
            html += '</div>';
            if (ep.recap) {
                html += '<div style="font-size:13px;color:var(--pv-text2);line-height:1.6;padding:10px 12px;background:var(--pv-card);border-radius:var(--pv-radius);border-left:3px solid var(--pv-accent);">';
                html += pvEsc(ep.recap);
                html += '</div>';
            } else {
                html += '<div style="font-size:13px;color:var(--pv-text3);padding:10px 12px;background:var(--pv-card);border-radius:var(--pv-radius);">';
                html += '暂无摘要 ';
                html += '<button class="pv-btn pv-btn-sm pv-btn-ai" onclick="pvAiGenEpRecap(\'' + drama.id + '\',' + idx + ')">' + PV_SVG.magic + ' AI生成</button>';
                html += '</div>';
            }
            html += '</div>';
        });

        html += '</div>';
        html += '<div style="height:30px;"></div></div>';
        el.innerHTML = html;
    }

    window.pvOpenRecap = function(dramaId) {
        pvState.currentDramaId = dramaId;
        pvState.view = 'recap';
        pvRender();
    };

    window.pvAiGenRecap = async function(dramaId) {
        if (!store.system || !store.system.url || !store.system.key) {
            alert('⚠️ 请先在设置中配置API接口');
            return;
        }
        var drama = pvGetDrama(dramaId);
        if (!drama || !drama.episodes || drama.episodes.length === 0) return;
        if (window.aiModal) window.aiModal.loading('AI 正在生成所有集数摘要...');
        try {
            for (var i = 0; i < drama.episodes.length; i++) {
                await pvDoGenEpRecap(drama, i);
            }
            save();
            pvRender();
            if (window.aiModal) window.aiModal.success('全部摘要已生成');
        } catch(e) {
            console.warn('[PenguinVideo] Recap error:', e);
            if (window.aiModal) window.aiModal.fail('生成失败');
        }
    };

    window.pvAiGenEpRecap = async function(dramaId, epIdx) {
        if (!store.system || !store.system.url || !store.system.key) {
            alert('⚠️ 请先在设置中配置API接口');
            return;
        }
        var drama = pvGetDrama(dramaId);
        if (!drama || !drama.episodes[epIdx]) return;
        if (window.aiModal) window.aiModal.loading('AI 正在生成摘要...');
        try {
            await pvDoGenEpRecap(drama, epIdx);
            save();
            pvRender();
            if (window.aiModal) window.aiModal.success('已生成');
        } catch(e) {
            console.warn('[PenguinVideo] Ep recap error:', e);
            if (window.aiModal) window.aiModal.fail('生成失败');
        }
    };

    async function pvDoGenEpRecap(drama, epIdx) {
        var ep = drama.episodes[epIdx];
        if (!ep || !(ep.scenes || []).length) return;
        var sceneText = (ep.scenes || []).map(function(s, i) {
            var d = (s.dialogues || []).map(function(x) {
                var ci = pvGetCastDisplay(drama, x.castId);
                return ci.name + ':"' + (x.line || '').substring(0, 40) + '"';
            }).join(' ');
            return '场景' + (i + 1) + '[' + s.setting + ']: ' + d;
        }).join('\n');

        var prompt = '请为电视剧《' + drama.title + '》第' + (epIdx + 1) + '集生成一段100字以内的剧情摘要(适合作"前情提要")，要求精炼地概括本集核心事件：\n' + sceneText.substring(0, 1500) + '\n\n只返回摘要文本，不要任何前缀。';
        var resp = await API.chatCompletion([{role:'user', content:prompt}], {temperature:0.6, silent:true, scene:'penguin-video'});
        var text = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content || '';
        if (text) ep.recap = text.trim();
    }

    // ========== 新功能：导出/分享 ==========
    function pvRenderExport(el) {
        var drama = pvGetDrama(pvState.currentDramaId);
        if (!drama) { pvGo('home'); return; }

        var html = '';
        html += '<div class="pv-nav">';
        html += '<div class="pv-nav-back" onclick="pvGo(\'detail\')">' + PV_SVG.back + '</div>';
        html += '<div class="pv-nav-title">导出/分享</div>';
        html += '<div class="pv-nav-actions"></div></div>';

        html += '<div class="pv-scroll" style="padding:16px;">';

        html += '<div style="background:var(--pv-card);border:1px solid var(--pv-border);border-radius:var(--pv-radius);padding:14px;margin-bottom:14px;">';
        html += '<div style="font-size:16px;font-weight:700;color:var(--pv-text);margin-bottom:6px;">' + pvEsc(drama.title) + '</div>';
        html += '<div style="font-size:12px;color:var(--pv-text3);">' + (PV_GENRES[drama.genre] || '') + ' · ' + (drama.episodes || []).length + '集 · ' + (drama.cast || []).length + '角色</div>';
        html += '</div>';

        html += '<div style="display:grid;gap:10px;">';

        html += '<button class="pv-btn pv-btn-primary pv-btn-full" onclick="pvExportText(\'' + drama.id + '\')">';
        html += PV_SVG.script + ' 导出剧本（文本）';
        html += '</button>';

        html += '<button class="pv-btn pv-btn-secondary pv-btn-full" onclick="pvExportJSON(\'' + drama.id + '\')">';
        html += PV_SVG.copy + ' 导出原始数据（JSON）';
        html += '</button>';

        html += '<button class="pv-btn pv-btn-ai pv-btn-full" onclick="pvCopyShareLink(\'' + drama.id + '\')">';
        html += PV_SVG.send + ' 复制剧集摘要';
        html += '</button>';

        html += '<button class="pv-btn pv-btn-secondary pv-btn-full" onclick="pvShareToContact(\'' + drama.id + '\')">';
        html += PV_SVG.people + ' 分享给联系人';
        html += '</button>';

        html += '</div>';

        // 预览区
        html += '<div style="margin-top:20px;">';
        html += '<div style="font-size:14px;font-weight:600;color:var(--pv-text);margin-bottom:8px;">导出预览</div>';
        html += '<pre id="pv-export-preview" style="background:var(--pv-card);border:1px solid var(--pv-border);border-radius:var(--pv-radius);padding:12px;font-size:11px;color:var(--pv-text2);line-height:1.5;max-height:300px;overflow-y:auto;white-space:pre-wrap;word-break:break-word;font-family:monospace;">' + pvEsc(pvBuildExportText(drama).substring(0, 1200)) + '...</pre>';
        html += '</div>';

        html += '<div style="height:30px;"></div></div>';
        el.innerHTML = html;
    }

    window.pvOpenExport = function(dramaId) {
        pvState.currentDramaId = dramaId;
        pvState.view = 'export';
        pvRender();
    };

    function pvBuildExportText(drama) {
        var text = '《' + drama.title + '》\n';
        text += '类型: ' + (PV_GENRES[drama.genre] || '其他') + '\n';
        if (drama.tags && drama.tags.length) text += '标签: ' + drama.tags.join('、') + '\n';
        if (drama.synopsis) text += '简介: ' + drama.synopsis + '\n';
        text += '\n---\n\n';

        text += '【角色表】\n';
        (drama.cast || []).forEach(function(c) {
            text += '· ' + c.name + ' (' + (c.role === 'lead' ? '主角' : c.role === 'supporting' ? '配角' : '群演') + ')\n';
            if (c.persona) text += '  ' + c.persona + '\n';
        });
        text += '\n---\n\n';

        (drama.episodes || []).forEach(function(ep, epIdx) {
            text += '【第' + (epIdx + 1) + '集 · ' + (ep.title || '') + '】\n\n';
            (ep.scenes || []).forEach(function(scene, sIdx) {
                text += '◇ 场景' + (sIdx + 1) + ': ' + (scene.setting || '') + '\n';
                if (scene.direction) text += '  (' + scene.direction + ')\n';
                (scene.dialogues || []).forEach(function(d) {
                    var ci = pvGetCastDisplay(drama, d.castId);
                    text += '  ' + ci.name + ': ';
                    if (d.action) text += '[' + d.action + '] ';
                    text += '"' + d.line + '"\n';
                });
                text += '\n';
            });
            text += '---\n\n';
        });
        return text;
    }

    window.pvExportText = function(dramaId) {
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        var text = pvBuildExportText(drama);
        // 复制到剪贴板
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function() {
                pvToast('剧本已复制到剪贴板');
            }).catch(function() {
                pvShowExportTextDialog(text);
            });
        } else {
            pvShowExportTextDialog(text);
        }
    };

    function pvShowExportTextDialog(text) {
        var html = '<div class="pv-modal-mask" onclick="pvCloseModal()">';
        html += '<div class="pv-modal" onclick="event.stopPropagation()">';
        html += '<div class="pv-modal-header"><div class="pv-modal-title">导出剧本</div>';
        html += '<button class="pv-modal-close" onclick="pvCloseModal()">' + PV_SVG.close + '</button></div>';
        html += '<div class="pv-modal-body">';
        html += '<textarea readonly style="width:100%;min-height:300px;border:1px solid var(--pv-border);padding:10px;border-radius:var(--pv-radius);font-family:monospace;font-size:12px;" onclick="this.select()">' + pvEsc(text) + '</textarea>';
        html += '<div style="font-size:12px;color:var(--pv-text3);margin-top:8px;">点击文本框全选后复制</div>';
        html += '</div></div></div>';
        var layer = document.getElementById('layer-penguin-video');
        if (layer) layer.insertAdjacentHTML('beforeend', html);
    }

    window.pvExportJSON = function(dramaId) {
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        var json = JSON.stringify(drama, null, 2);
        if (navigator.clipboard) {
            navigator.clipboard.writeText(json).then(function() {
                pvToast('JSON已复制到剪贴板');
            }).catch(function() {
                pvShowExportTextDialog(json);
            });
        } else {
            pvShowExportTextDialog(json);
        }
    };

    window.pvCopyShareLink = function(dramaId) {
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        var summary = '推荐一部好剧《' + drama.title + '》！\n类型: ' + (PV_GENRES[drama.genre] || '') + '\n' +
            (drama.synopsis ? '简介: ' + drama.synopsis + '\n' : '') +
            '主要角色: ' + (drama.cast || []).filter(function(c) { return c.role === 'lead'; }).map(function(c) { return c.name; }).join('、') +
            '\n共 ' + (drama.episodes || []).length + ' 集';
        if (navigator.clipboard) {
            navigator.clipboard.writeText(summary).then(function() {
                pvToast('摘要已复制');
            }).catch(function() {
                alert(summary);
            });
        } else {
            alert(summary);
        }
    };

    window.pvShareToContact = function(dramaId) {
        var drama = pvGetDrama(dramaId);
        if (!drama) return;
        var contacts = store.contacts || [];
        if (contacts.length === 0) { pvToast('暂无联系人'); return; }
        var names = contacts.map(function(c, i) { return (i + 1) + '. ' + (c.remark || c.name); }).join('\n');
        var idx = parseInt(prompt('选择联系人（数字）:\n' + names));
        if (isNaN(idx) || idx < 1 || idx > contacts.length) return;
        var contact = contacts[idx - 1];
        var summary = '推荐一部好剧《' + drama.title + '》！' + (drama.synopsis ? ' ' + drama.synopsis.substring(0, 50) + '...' : '');

        // 模拟一条消息发给联系人
        if (!contact.messages) contact.messages = [];
        contact.messages.push({
            role: 'user',
            content: summary,
            time: Date.now(),
            type: 'text',
        });
        if (typeof save === 'function') save();
        pvToast('已分享给 ' + (contact.remark || contact.name));
    };

})();
