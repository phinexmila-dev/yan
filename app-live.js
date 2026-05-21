// ============================================
// LIVE STREAMING MODULE - V2 ENHANCED
// 直播间模块：直播广场 + AI主播行为 + NPC系统 + 关系推进 + 弹幕 + 礼物 + 粉丝体系
// ============================================

(function() {
    'use strict';

    // ========== SVG 图标 ==========
    const SVG = {
        close: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        heart: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"/></svg>',
        heartFill: '<svg width="20" height="20" viewBox="0 0 20 20" fill="#ff4d6a"><path d="M10 17.5s-7-4.5-7-9a4.5 4.5 0 019 0 4.5 4.5 0 019 0c0 4.5-7 9-7 9z"/></svg>',
        gift: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="7" width="12" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M8 7v7M2 9h12" stroke="currentColor" stroke-width="1.5"/><path d="M8 7C8 7 6 5 5 4s0-3 1.5-2S8 4 8 4M8 7c0 0 2-2 3-3s0-3-1.5-2S8 4 8 4" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>',
        trophy: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5 2h6v5a3 3 0 01-6 0V2z" stroke="currentColor" stroke-width="1.5"/><path d="M5 4H3a1 1 0 00-1 1v1a2 2 0 002 2h1M11 4h2a1 1 0 011 1v1a2 2 0 01-2 2h-1M6 12h4M8 10v2" stroke="currentColor" stroke-width="1.5"/><rect x="5" y="12" width="6" height="1.5" rx="0.5" stroke="currentColor" stroke-width="1"/></svg>',
        send: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 1.5l-6 13-2.5-5.5L.5 6.5l14-5z"/></svg>',
        eye: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3C3 3 1 7 1 7s2 4 6 4 6-4 6-4-2-4-6-4z" stroke="currentColor" stroke-width="1.3"/><circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.3"/></svg>',
        live: '<svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#ff4d6a"/></svg>',
        search: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.5"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        refresh: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.5 8A5.5 5.5 0 118 2.5M8 2.5V0M8 2.5L10.5 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        fire: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1c0 3-3 4-3 7a4 4 0 008 0c0-2-1-3-2-4 0 2-1 3-2 3s-1-2-1-3c0-1 0-2 0-3z"/></svg>',
        palette: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><circle cx="6" cy="5.5" r="1" fill="currentColor"/><circle cx="10" cy="5.5" r="1" fill="currentColor"/><circle cx="4.5" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="10.5" r="1" fill="currentColor"/></svg>',
        cog: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
        poll: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="9" width="3" height="5" rx="0.5" stroke="currentColor" stroke-width="1.3"/><rect x="6.5" y="5" width="3" height="9" rx="0.5" stroke="currentColor" stroke-width="1.3"/><rect x="11" y="2" width="3" height="12" rx="0.5" stroke="currentColor" stroke-width="1.3"/></svg>',
        gamepad: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="8" rx="3" stroke="currentColor" stroke-width="1.3"/><circle cx="5" cy="8" r="1.5" stroke="currentColor" stroke-width="1"/><circle cx="11" cy="8" r="1.5" stroke="currentColor" stroke-width="1"/></svg>',
        envelope: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 4.5L8 9l6-4.5" stroke="currentColor" stroke-width="1.3"/></svg>',
        image: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" stroke-width="1.3"/><circle cx="5.5" cy="5.5" r="1.5" stroke="currentColor" stroke-width="1"/><path d="M2 12l3.5-4 2.5 3 2-2 4 3" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
        play: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M6 3.5l10 6.5-10 6.5V3.5z"/></svg>',
        history: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M8 4v4l3 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
        calendar: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
        check: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        plus: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        trash: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8l-.7 7.5a1 1 0 01-1 .9H4.7a1 1 0 01-1-.9L3 4zM2 4h10M5.5 2h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
        user: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.3"/><path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" stroke-width="1.3"/></svg>',
        chat: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 3h12a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 2.5V4a1 1 0 011-1z" stroke="currentColor" stroke-width="1.3"/></svg>',
        wechat: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5.5 3C3 3 1 4.8 1 7c0 1.2.6 2.2 1.6 3L2 12l2-1c.5.2 1 .3 1.5.3" stroke="currentColor" stroke-width="1.2"/><path d="M10.5 5.5c-2.8 0-5 2-5 4.3 0 2.4 2.2 4.3 5 4.3.6 0 1.2-.1 1.7-.3l1.8.7-.4-1.7c.8-.7 1.4-1.8 1.4-3 0-2.3-2.2-4.3-5-4.3z" stroke="currentColor" stroke-width="1.2"/></svg>',
        lock: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="5" width="8" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M4 5V3.5a2 2 0 014 0V5" stroke="currentColor" stroke-width="1.2"/></svg>',
        star: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2.2 4.5 5 .7-3.6 3.5.9 5L8 12.4 3.5 14.7l.9-5L.8 6.2l5-.7L8 1z"/></svg>',
        crown: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 12h12l1-7-3.5 3L8 2 4.5 8 1 5l1 7z"/></svg>',
        diamond: '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 14L1 6l2.5-4h9L15 6 8 14z"/></svg>',
        rocket: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1c-2 3-3 6-3 9l3 3 3-3c0-3-1-6-3-9z" stroke="currentColor" stroke-width="1.3" fill="currentColor" fill-opacity="0.15"/><circle cx="8" cy="7" r="1.5" stroke="currentColor" stroke-width="1"/></svg>',
        music: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12V4l7-2v8" stroke="currentColor" stroke-width="1.3"/><circle cx="4" cy="12" r="2" stroke="currentColor" stroke-width="1.3"/><circle cx="11" cy="10" r="2" stroke="currentColor" stroke-width="1.3"/></svg>',
        book: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2h5l1 1 1-1h5v11H9l-1 1-1-1H2V2z" stroke="currentColor" stroke-width="1.3"/><path d="M8 3v11" stroke="currentColor" stroke-width="1"/></svg>',
        broadcast: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.3"/><path d="M4.5 4.5a5 5 0 000 7M11.5 4.5a5 5 0 010 7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M2.5 2.5a8 8 0 000 11M13.5 2.5a8 8 0 010 11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
        coin: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="#c0a040" stroke-width="1.3"/><text x="7" y="10" text-anchor="middle" font-size="8" fill="#c0a040" font-weight="bold">$</text></svg>',
        info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M8 7v4M8 5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        arrowRight: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };

    // ========== 常量 ==========
    const LIVE_CATEGORIES = {
        all: '全部', chat: '聊天', game: '游戏', music: '音乐', daily: '日常', story: '故事'
    };

    const LIVE_GIFTS = {
        heart:    { name:'小心心', svg:'heart',    cost:1,    anim:'float' },
        rose:     { name:'玫瑰',   svg:'heartFill', cost:10,   anim:'float' },
        star:     { name:'星星',   svg:'star',     cost:50,   anim:'burst' },
        rocket:   { name:'火箭',   svg:'rocket',   cost:100,  anim:'fullscreen' },
        crown:    { name:'皇冠',   svg:'crown',    cost:500,  anim:'fullscreen' },
        firework: { name:'烟花',   svg:'fire',     cost:1000, anim:'fullscreen' },
        diamond:  { name:'钻石',   svg:'diamond',  cost:2000, anim:'fullscreen' },
        castle:   { name:'城堡',   svg:'trophy',   cost:5000, anim:'fullscreen' },
    };

    // ========== 充值档位 ==========
    const RECHARGE_PACKAGES = [
        { id:'pkg_6',   price:6,   coins:60,   bonus:0,   label:'60金币' },
        { id:'pkg_30',  price:30,  coins:300,  bonus:30,  label:'300金币', tag:'popular' },
        { id:'pkg_68',  price:68,  coins:680,  bonus:80,  label:'680金币' },
        { id:'pkg_128', price:128, coins:1280, bonus:200, label:'1280金币', tag:'popular' },
        { id:'pkg_328', price:328, coins:3280, bonus:660, label:'3280金币' },
        { id:'pkg_648', price:648, coins:6480, bonus:1500,label:'6480金币', tag:'first-buy' },
    ];
    const COIN_RATE = 10; // 1元 = 10金币

    function _giftIcon(key, size) {
        size = size || 24;
        const g = LIVE_GIFTS[key];
        if (!g) return '';
        const s = SVG[g.svg] || SVG.gift;
        return '<span class="live-svg-icon" style="width:'+size+'px;height:'+size+'px">'+s+'</span>';
    }

    const LIVE_THEMES = [
        { id:'default', name:'默认', bg:'#1a1a1a' },
        { id:'warm',    name:'暖光', bg:'#2d1b00' },
        { id:'cool',    name:'冷蓝', bg:'#0a1628' },
        { id:'dark',    name:'深黑', bg:'#0d0d0d' },
        { id:'slate',   name:'石板', bg:'#1e2a2a' },
        { id:'ash',     name:'灰烬', bg:'#1f1f1f' },
    ];

    const LIVE_ATMOSPHERE = [
        { id:'none', name:'无' },
        { id:'sakura', name:'🌸', emoji:'🌸' },
        { id:'snow', name:'❄️', emoji:'❄️' },
        { id:'stars', name:'✨', emoji:'⭐' },
        { id:'hearts', name:'💕', emoji:'❤️' },
        { id:'firefly', name:'🔥', emoji:'✨' },
        { id:'rain', name:'🌧️', emoji:'💧' },
        { id:'leaf', name:'🍃', emoji:'🍂' },
    ];

    const VIRTUAL_VIEWERS = ['路人甲','小可爱','夜猫子','吃瓜群众','追星少女','摸鱼达人','深夜食堂','快乐水','小确幸','月亮代表','星星眼','甜甜圈','大橘子','小太阳','棉花糖',
        '奶茶控','暴走萝莉','佛系青年','熬夜冠军','咸鱼翻身','柠檬精','干饭人','躺平大师','冲浪达人','小懒虫','社恐患者','话痨本痨','元气少女','沙雕网友','不想上班'];

    // ========== 弹幕表情包 ==========
    const DANMAKU_EMOJI = {
        '[开心]':'😄','[大笑]':'😂','[爱心]':'❤️','[生气]':'😡','[哭]':'😢',
        '[惊讶]':'😮','[酷]':'😎','[害羞]':'😳','[坏笑]':'😏','[呲牙]':'😁',
        '[思考]':'🤔','[可怜]':'🥺','[点赞]':'👍','[鼓掌]':'👏','[玫瑰]':'🌹',
        '[礼物]':'🎁','[庆祝]':'🎉','[火]':'🔥','[比心]':'🤟','[加油]':'💪',
        '[睡觉]':'😴','[吃瓜]':'🍉','[星星]':'⭐','[月亮]':'🌙','[太阳]':'☀️',
        '[666]':'6️⃣','[抱抱]':'🤗','[捂脸]':'🤦','[再见]':'👋','[OK]':'👌',
    };

    // ========== NPC 直播状态缓存 ==========
    var _npcViewerCache = {};      // npcId → viewers 缓存
    var _npcTitleCache = {};       // npcId → AI 生成的标题缓存
    var _npcStatusCache = {};      // npcId → AI 生成的状态描述缓存

    const FAN_LEVELS = [
        { level:1, name:'路人粉', minExp:0,    color:'#888',    perks:[] },
        { level:2, name:'铁粉',   minExp:100,  color:'#5bf',    perks:['colorDanmaku'] },
        { level:3, name:'真爱粉', minExp:500,  color:'#b388ff', perks:['colorDanmaku','entryNotice'] },
        { level:4, name:'守护者', minExp:2000, color:'#ffd700', perks:['colorDanmaku','entryNotice','entryEffect','superEmoji'] },
        { level:5, name:'至尊',   minExp:5000, color:'#ff4d6a', perks:['colorDanmaku','entryNotice','entryEffect','superEmoji','superDanmaku'] },
    ];

    const DANMAKU_COLORS = ['#fff','#ff4d6a','#5bf','#ffcc00','#66ff66','#ff88cc','#88ddff','#ffaa44'];

    // ========== NPC 池 ==========
    const NPC_POOL = [
        { id:'npc_linwan', name:'林晚晚', gender:'female', category:'music',
          persona:'独立音乐人，性格慵懒但对音乐极其认真。喜欢深夜弹吉他，说话慢悠悠的，偶尔冷不丁说出很有哲理的话。不喜欢太吵闹，但对真心喜欢音乐的人很温柔。',
          infoLayers:[
            { level:0, data:{ '年龄':'22', '城市':'成都', '爱好':'弹吉他、写歌' } },
            { level:1, data:{ '生日':'3月14日', '喜欢的食物':'火锅', '宠物':'橘猫叫橘子' } },
            { level:2, data:{ '梦想':'开一场自己的小型演唱会', '小秘密':'其实有轻微社恐' } },
            { level:3, data:{ '微信号':'linwanwan_music', '心里话':'觉得你很特别' } },
          ],
          liveActions:['轻轻拨动吉他弦，哼着不知名的旋律','低头调音，偶尔抬眼看弹幕','靠在椅背上，手指无意识敲着节拍','喝了一口温水，继续弹奏','闭眼沉浸在音乐中，嘴角微微上扬'],
          wechatThreshold:500, wechatAcceptRate:0.7 },
        { id:'npc_suye', name:'苏夜', gender:'male', category:'game',
          persona:'电竞选手退役后做游戏主播。性格直爽毒舌但心软，技术很强但经常因为聊天分心翻车。喜欢深夜直播，自称"夜行者"。',
          infoLayers:[
            { level:0, data:{ '年龄':'24', '城市':'上海', '爱好':'打游戏、看动漫' } },
            { level:1, data:{ '生日':'11月7日', '前战队':'StarLight', '最爱游戏':'英雄联盟' } },
            { level:2, data:{ '退役原因':'手腕伤了', '梦想':'开一家电竞馆' } },
            { level:3, data:{ '微信号':'suye_gaming', '心里话':'直播间里你是我最想见到的人' } },
          ],
          liveActions:['全神贯注盯着屏幕，手指飞速操作','突然靠回椅子，揉了揉手腕','喝了口可乐，擦了擦嘴','对着屏幕皱眉，似乎遇到强敌','伸了个懒腰，扭了扭脖子'],
          wechatThreshold:500, wechatAcceptRate:0.65 },
        { id:'npc_mianmian', name:'绵绵', gender:'female', category:'chat',
          persona:'大学生，性格甜美话多，喜欢分享日常和八卦。说话带点撒娇语气，对粉丝很热情。喜欢吃甜食，经常在直播间吃零食聊天。有点小迷糊但很可爱。',
          infoLayers:[
            { level:0, data:{ '年龄':'20', '城市':'杭州', '爱好':'追剧、吃甜食' } },
            { level:1, data:{ '生日':'6月21日', '专业':'新闻传播', '口头禅':'哎呀~' } },
            { level:2, data:{ '梦想':'当旅行博主', '小秘密':'其实是个路痴' } },
            { level:3, data:{ '微信号':'mianmian_sweet', '心里话':'每次看到你进直播间都好开心' } },
          ],
          liveActions:['嚼着小饼干，眼睛亮亮地看弹幕','双手托腮，歪头看着镜头','翻手机给大家看今天拍的照片','喝奶茶，吸管发出咕噜声','整理了一下头发，对镜头笑了笑'],
          wechatThreshold:400, wechatAcceptRate:0.8 },
        { id:'npc_chenmo', name:'沉默', gender:'male', category:'story',
          persona:'神秘的深夜故事主播，声音低沉有磁性。很少透露个人信息，喜欢讲悬疑故事和都市传说。对观众保持礼貌但有距离感，需要长时间互动才会敞开心扉。',
          infoLayers:[
            { level:0, data:{ '年龄':'?', '城市':'未知', '爱好':'读书、写故事' } },
            { level:1, data:{ '真实年龄':'27', '城市':'北京', '职业':'编剧' } },
            { level:2, data:{ '笔名':'夜行人', '代表作':'《深渊回声》', '小秘密':'故事都是根据真实经历改编' } },
            { level:3, data:{ '微信号':'chenmo_story', '心里话':'你是第一个让我想说真话的人' } },
          ],
          liveActions:['翻开一本旧书，清了清嗓子准备讲故事','端着黑咖啡，目光深邃地看着远方','手指轻敲桌面，似乎在构思故事','低声念了一段文字，声音在房间回荡','沉默了一会儿，似乎在回忆什么'],
          wechatThreshold:600, wechatAcceptRate:0.5 },
        { id:'npc_xiaoyao', name:'小遥', gender:'female', category:'daily',
          persona:'自由职业插画师，性格温柔安静。直播时经常一边画画一边聊天。说话轻声细语，很有耐心。喜欢猫和花，房间里总是很温馨。',
          infoLayers:[
            { level:0, data:{ '年龄':'25', '城市':'苏州', '爱好':'画画、养花' } },
            { level:1, data:{ '生日':'4月2日', '画风':'水彩风', '宠物':'两只猫叫团子和丸子' } },
            { level:2, data:{ '梦想':'办一次个人画展', '小秘密':'画画时会不自觉哼歌' } },
            { level:3, data:{ '微信号':'xiaoyao_art', '心里话':'想给你画一幅画' } },
          ],
          liveActions:['低头认真画着什么，画笔沙沙作响','抬头看弹幕，微微一笑继续画','用画笔蘸颜料，在调色盘上调色','把画举起来给大家看进度','轻轻吹了吹画纸，等颜料干'],
          wechatThreshold:450, wechatAcceptRate:0.75 },
        { id:'npc_afeng', name:'阿风', gender:'male', category:'music',
          persona:'街头歌手出身，性格豪爽大方。嗓音沙哑有故事感，喜欢唱民谣和摇滚。对生活很乐观，经常鼓励观众。',
          infoLayers:[
            { level:0, data:{ '年龄':'28', '城市':'重庆', '爱好':'唱歌、旅行' } },
            { level:1, data:{ '生日':'9月15日', '走过的城市':'30+', '最爱的歌':'《平凡之路》' } },
            { level:2, data:{ '梦想':'骑摩托车环游中国', '小秘密':'其实很怕孤独' } },
            { level:3, data:{ '微信号':'afeng_road', '心里话':'有机会一起去旅行吧' } },
          ],
          liveActions:['抱着吉他弹唱，声音沙哑而温暖','喝了口啤酒，擦了擦嘴笑了','调了调吉他弦，试了几个和弦','靠在墙上，随意拨弄琴弦','拍了拍吉他，准备唱下一首'],
          wechatThreshold:400, wechatAcceptRate:0.8 },
    ];

    // ========== 状态 ==========
    const liveState = {
        currentTab: 'all', searchVisible: false, searchQuery: '',
        inRoom: false, roomContactId: null, roomMode: 'ai_host',
        roomNpcId: null, roomDanmakuList: [], roomConversationHistory: [],
        aiSpeakTimer: null, virtualViewerTimer: null,
        viewerCount: 0, likeCount: 0,
        giftPanelOpen: false, decorPanelOpen: false, rankPanelOpen: false,
        selectedGift: 'heart', aiSpeaking: false,
        userStreamType: 'chat', userStreamTitle: '', userStreamInvited: [],
        giftCombo: { gift:null, count:0, timer:null, sender:'' },
        superDanmakuQueue: [], superDanmakuShowing: false,
        voteActive: false, voteData: null, voteTimer: null,
        miniGameActive: false, miniGameData: null, miniGameTimer: null,
        atmosphere: 'none', atmosphereTimer: null,
        fanExpTimer: null, watchStartTime: 0, danmakuColor: '#fff',
        plazaTab: 'live',
        hostActivity: '', hostActivityTimer: null,
        npcProfileOpen: false, npcProfileId: null,
        // 热度追踪
        heat: { danmakuRate:0, giftRate:0, recentDanmaku:0, recentGifts:0, heatLevel:'cold', heatTimer:null },
        // 里程碑追踪
        milestoneChecked: {},
        // 充值系统状态
        rechargeOpen: false,
        rechargeSelectedPkg: 'pkg_30',
        rechargeCustomMode: false,
        rechargeCustomAmount: '',
        rechargePayMethod: 'wallet', // wallet | wechat
        rechargeRecordsOpen: false,
    };
    window._liveState = liveState;

    // ========== AI辅助调用 ==========
    // [FIX-直播API兼容] 从API返回数据中提取回复文本
    // 兼容两种格式：data.reply（API内部简化字段）和 data.choices[0].message.content（标准OpenAI格式）
    function _extractReply(data) {
        if (!data) return '';
        if (data.reply) return data.reply;
        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            return data.choices[0].message.content;
        }
        if (data.choices && data.choices[0] && data.choices[0].text) {
            return data.choices[0].text;
        }
        return '';
    }
    function _liveAI(sysPrompt, userPrompt, callback, fallback) {
        if (typeof API!=='undefined' && API.chatCompletion) {
            window._currentApiScene = 'live';
            API.chatCompletion([{role:'system',content:sysPrompt},{role:'user',content:userPrompt}]).then(function(data){
                var reply = _extractReply(data);
                if (reply) { callback(reply.replace(/^["「]|["」]$/g,'').trim()); }
                else if (fallback) { console.warn('[live] API返回空数据, data:', JSON.stringify(data).substring(0, 200)); fallback(); }
            }).catch(function(err){ console.error('[live] API调用失败:', err); if (fallback) fallback(); });
        } else {
            console.warn('[live] API未初始化: API=' + (typeof API) + ', chatCompletion=' + (typeof API!=='undefined' ? typeof API.chatCompletion : 'N/A'));
            if (fallback) { fallback(); }
        }
    }
    function _liveAIWithHistory(sysPrompt, history, callback, fallback) {
        if (typeof API!=='undefined' && API.chatCompletion) {
            window._currentApiScene = 'live';
            var msgs = [{role:'system',content:sysPrompt}].concat(history);
            API.chatCompletion(msgs).then(function(data){
                var reply = _extractReply(data);
                if (reply) { callback(reply.replace(/^["「]|["」]$/g,'').trim()); }
                else if (fallback) fallback();
            }).catch(function(){ if (fallback) fallback(); });
        } else if (fallback) { fallback(); }
    }
    // 获取最近弹幕上下文
    function _getRecentContext(count) {
        count = count || 8;
        return liveState.roomDanmakuList.slice(-count).map(function(d){
            if (d.type==='system'||d.type==='gift') return '[系统] '+d.text;
            return (d.name||'')+'：'+d.text;
        }).join('\n');
    }
    // 获取当前主播信息
    function _getHostInfo() {
        if (liveState.roomNpcId) {
            var npc = NPC_POOL.find(function(n){return n.id===liveState.roomNpcId;});
            return npc ? { name:npc.name, persona:npc.persona, category:npc.category } : null;
        }
        if (liveState.roomContactId) {
            var c = (store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;});
            if (!c) return null;
            _ensureContactLiveRoom(c);
            return { name:c.remark||c.name, persona:c.persona||c.description||'', category:c.liveRoom.category||'chat' };
        }
        return null;
    }
    // 热度计算
    function _startHeatTracking() {
        if (liveState.heat.heatTimer) clearInterval(liveState.heat.heatTimer);
        liveState.heat = { danmakuRate:0, giftRate:0, recentDanmaku:0, recentGifts:0, heatLevel:'cold', heatTimer:null };
        liveState.heat.heatTimer = setInterval(function(){
            if (!liveState.inRoom) return;
            var now = Date.now();
            var recent = liveState.roomDanmakuList.filter(function(d){ return now-d.time<30000; });
            liveState.heat.recentDanmaku = recent.length;
            liveState.heat.danmakuRate = Math.round(recent.length/30*60); // 每分钟弹幕数
            var gifts = recent.filter(function(d){ return d.type==='gift'; });
            liveState.heat.recentGifts = gifts.length;
            liveState.heat.giftRate = gifts.length;
            // 热度等级
            var score = liveState.heat.danmakuRate + liveState.heat.giftRate*5;
            if (score >= 40) liveState.heat.heatLevel = 'fire';
            else if (score >= 20) liveState.heat.heatLevel = 'hot';
            else if (score >= 8) liveState.heat.heatLevel = 'warm';
            else liveState.heat.heatLevel = 'cold';
        }, 5000);
    }
    function _getHeatDesc() {
        var h = liveState.heat;
        if (h.heatLevel==='fire') return '直播间非常火爆，弹幕刷屏中';
        if (h.heatLevel==='hot') return '直播间很热闹，互动频繁';
        if (h.heatLevel==='warm') return '直播间氛围不错，有一些互动';
        return '直播间比较安静，需要活跃气氛';
    }

    // ========== Store 初始化 ==========
    function _ensureLiveStore() {
        if (!store.liveState) store.liveState = { activeStreams: [], activeNpcs: [], userStreaming: false, lastRefresh: 0 };
        if (!store.liveState.activeNpcs) store.liveState.activeNpcs = [];
        if (!store.liveHistory) store.liveHistory = [];
        if (!store.liveFans) store.liveFans = {};
        if (!store.liveSchedule) store.liveSchedule = [];
        if (!store.liveSignIn) store.liveSignIn = { lastDate:'', streak:0, totalCoins:0 };
        if (!store.npcRelations) store.npcRelations = {};
        // 新增：金币钱包
        if (typeof store.liveCoins === 'undefined') store.liveCoins = 100; // 初始100金币
        // 充值记录
        if (!store.liveRechargeHistory) store.liveRechargeHistory = [];
        // 首充标记
        if (typeof store.liveFirstRecharge === 'undefined') store.liveFirstRecharge = false;
        // 新增：自定义NPC持久化
        if (!store.customNpcs) store.customNpcs = [];
        // 恢复持久化的自定义NPC到内存池
        store.customNpcs.forEach(function(npc) {
            if (!NPC_POOL.find(function(n){ return n.id === npc.id; })) {
                NPC_POOL.push(npc);
            }
        });
        // 新增：关注列表
        if (!store.liveFollowed) store.liveFollowed = [];
        // 新增：NPC排行榜数据
        if (!store.npcGiftWalls) store.npcGiftWalls = {};
    }
    function _ensureContactLiveRoom(c) {
        if (!c.liveRoom) c.liveRoom = {
            background:'', title:'', category:'chat', description:'', theme:'default',
            totalLikes:0, totalGifts:0, isLive:false, atmosphere:'none', announcement:'',
            giftWall:[], schedule:null
        };
    }

    // ========== NPC 关系系统 ==========
    function _getNpcRelation(npcId) {
        _ensureLiveStore();
        if (!store.npcRelations[npcId]) {
            store.npcRelations[npcId] = {
                affinity:0, totalGifts:0, visitCount:0, danmakuCount:0,
                watchTime:0, unlockedLevel:0, addedWechat:false,
                lastVisit:0, privateChatHistory:[]
            };
        }
        return store.npcRelations[npcId];
    }
    function _addNpcAffinity(npcId, amount) {
        const rel = _getNpcRelation(npcId);
        rel.affinity = (rel.affinity||0) + amount;
        const thresholds = [0, 50, 150, 300];
        for (let i = thresholds.length-1; i >= 0; i--) {
            if (rel.affinity >= thresholds[i] && rel.unlockedLevel < i) rel.unlockedLevel = i;
        }
        if (typeof save === 'function') save();
    }
    function _getNpcRelLevel(npcId) {
        const rel = _getNpcRelation(npcId);
        if (rel.affinity >= 300) return { name:'亲密', color:'#ff4d6a' };
        if (rel.affinity >= 150) return { name:'熟悉', color:'#b388ff' };
        if (rel.affinity >= 50)  return { name:'了解', color:'#5bf' };
        return { name:'陌生', color:'#888' };
    }

    // ========== 粉丝系统 ==========
    function _getFanData(cid) {
        _ensureLiveStore();
        if (!store.liveFans[cid]) store.liveFans[cid] = { exp:0, totalGifts:0, watchTime:0, danmakuCount:0 };
        return store.liveFans[cid];
    }
    function _getFanLevel(exp) {
        let lv = FAN_LEVELS[0];
        for (let i = FAN_LEVELS.length-1; i >= 0; i--) { if (exp >= FAN_LEVELS[i].minExp) { lv = FAN_LEVELS[i]; break; } }
        return lv;
    }
    function _addFanExp(cid, amt) { if (!cid) return; const f = _getFanData(cid); f.exp = (f.exp||0)+amt; if (typeof save==='function') save(); }
    function _getFanBadgeHtml(cid) {
        if (!cid) return '';
        const f = _getFanData(cid); const lv = _getFanLevel(f.exp||0);
        if (lv.level <= 1) return '';
        return '<span class="live-fan-badge" style="background:'+lv.color+'20;color:'+lv.color+';border:1px solid '+lv.color+'40">Lv'+lv.level+' '+lv.name+'</span>';
    }
    function _hasPerk(cid, perk) { if (!cid) return false; const f=_getFanData(cid); return _getFanLevel(f.exp||0).perks.includes(perk); }
    function _startFanExpTimer() {
        if (liveState.fanExpTimer) clearInterval(liveState.fanExpTimer);
        liveState.watchStartTime = Date.now();
        liveState.fanExpTimer = setInterval(function() {
            if (!liveState.inRoom) return;
            if (liveState.roomContactId) { _addFanExp(liveState.roomContactId, 1); var f=_getFanData(liveState.roomContactId); f.watchTime=(f.watchTime||0)+1; }
            if (liveState.roomNpcId) { _addNpcAffinity(liveState.roomNpcId, 1); var r=_getNpcRelation(liveState.roomNpcId); r.watchTime=(r.watchTime||0)+1; }
            // 观看获币：每分钟获得1金币
            _ensureLiveStore();
            store.liveCoins = (store.liveCoins||0) + 1;
            if (typeof save==='function') save();
        }, 60000);
    }

    // ========== 工具函数 ==========
    function _esc(s) { return typeof escapeHtml==='function' ? escapeHtml(s||'') : (s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function _formatNum(n) { if (n>=10000) return (n/10000).toFixed(1)+'w'; if (n>=1000) return (n/1000).toFixed(1)+'k'; return n+''; }
    function _svgBtn(key, opts) {
        opts = opts||{};
        return '<div class="live-room-tool-btn '+(opts.cls||'')+'" onclick="'+(opts.onclick||'')+'" title="'+(opts.title||'')+'" style="color:'+(opts.color||'currentColor')+'">'+( SVG[key]||'')+'</div>';
    }

    // ========== 智能调度：谁在直播（含NPC）- API驱动 ==========
    function refreshLiveStreams() {
        _ensureLiveStore();
        var contacts = (store.contacts||[]).filter(function(c){ return !c.isGroup; });
        var liveCount = Math.min(contacts.length, 3 + Math.floor(Math.random()*4));
        var withBg = contacts.filter(function(c){ return c.liveRoom && c.liveRoom.background; });
        var recent = contacts.filter(function(c){ return c.lastMsgTime; }).sort(function(a,b){ return (b.lastMsgTime||0)-(a.lastMsgTime||0); });
        var pool = [];
        withBg.forEach(function(c){ if (!pool.find(function(x){return x.id===c.id;})) pool.push(c); });
        recent.slice(0,4).forEach(function(c){ if (!pool.find(function(x){return x.id===c.id;})) pool.push(c); });
        var rest = contacts.filter(function(c){ return !pool.find(function(x){return x.id===c.id;}); });
        for (var i=rest.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=rest[i]; rest[i]=rest[j]; rest[j]=t; }
        rest.forEach(function(c){ if (!pool.find(function(x){return x.id===c.id;})) pool.push(c); });
        var selected = pool.slice(0, liveCount);
        selected.forEach(function(c){ _ensureContactLiveRoom(c); c.liveRoom._viewersCache = 20+Math.floor(Math.random()*200); });
        store.liveState.activeStreams = selected.map(function(c){ return c.id; });

        // ---- API驱动的NPC上线调度 ----
        var hour = new Date().getHours();
        var timeSlot = hour >= 22 || hour < 6 ? '深夜' : hour >= 18 ? '晚间' : hour >= 12 ? '下午' : '上午';
        var npcNames = NPC_POOL.map(function(n){ return n.name+'('+n.category+')'; }).join('、');

        // 通过API决定谁在线+生成标题
        _liveAI(
            '当前时段：'+timeSlot+'（'+hour+'点）。以下是直播平台的主播列表：\n'+npcNames+'\n请根据时段合理选择哪些主播在线（深夜适合聊天/故事/音乐，白天适合游戏/日常等），并为在线主播各生成一个吸引人的直播标题。\n必须严格按JSON格式返回（不加其他文字）：\n{"online":[{"name":"主播名","title":"直播标题8-15字","status":"正在做什么10-20字"}]}',
            '安排直播',
            function(reply) {
                try {
                    var jsonStr = reply.match(/\{[\s\S]*\}/);
                    if (jsonStr) {
                        var result = JSON.parse(jsonStr[0]);
                        if (result.online && result.online.length > 0) {
                            var activeNpcs = [];
                            result.online.forEach(function(item) {
                                var npc = NPC_POOL.find(function(n){ return n.name === item.name; });
                                if (npc) {
                                    activeNpcs.push(npc.id);
                                    _npcTitleCache[npc.id] = item.title || (npc.name+'的直播间');
                                    _npcStatusCache[npc.id] = item.status || '';
                                    if (!_npcViewerCache[npc.id]) _npcViewerCache[npc.id] = 50+Math.floor(Math.random()*300);
                                }
                            });
                            if (activeNpcs.length > 0) {
                                store.liveState.activeNpcs = activeNpcs;
                                if (typeof save === 'function') save();
                                renderLivePlaza();
                                return;
                            }
                        }
                    }
                } catch(e) {}
                // JSON解析失败，走fallback
                _refreshNpcFallback();
            },
            function() { _refreshNpcFallback(); }
        );

        // 先设置fallback，不等API
        _refreshNpcFallback();
        store.liveState.lastRefresh = Date.now();
        if (typeof save === 'function') save();
    }

    // NPC刷新fallback（无API时）
    function _refreshNpcFallback() {
        var hour = new Date().getHours();
        var activeNpcs = [];
        NPC_POOL.forEach(function(npc) {
            var prob = 0.35;
            // 根据时段和NPC类型调整概率
            if (hour >= 22 || hour < 6) { // 深夜
                if (npc.category==='story'||npc.category==='music'||npc.category==='chat') prob = 0.6;
                else prob = 0.15;
            } else if (hour >= 18) { // 晚间
                prob = 0.5;
            } else if (hour < 12) { // 上午
                if (npc.category==='daily') prob = 0.5;
                else prob = 0.2;
            }
            // 关注的NPC更高概率在线
            if ((store.liveFollowed||[]).includes(npc.id)) prob = Math.min(prob + 0.3, 0.85);
            if (Math.random() < prob) activeNpcs.push(npc.id);
        });
        if (activeNpcs.length === 0 && NPC_POOL.length > 0) {
            activeNpcs.push(NPC_POOL[Math.floor(Math.random()*NPC_POOL.length)].id);
        }
        // 为没有缓存标题的NPC生成缓存
        activeNpcs.forEach(function(npcId) {
            if (!_npcViewerCache[npcId]) _npcViewerCache[npcId] = 50+Math.floor(Math.random()*300);
            if (!_npcTitleCache[npcId]) {
                var npc = NPC_POOL.find(function(n){return n.id===npcId;});
                if (npc) {
                    _npcTitleCache[npcId] = npc.name+'的直播间';
                    // 异步用AI生成标题
                    (function(nId, npc){
                        _liveAI('你是"'+npc.name+'"，人设：'+npc.persona+'。分类：'+npc.category+'。请生成一个有趣吸引人的直播间标题，8-15字，不要引号，符合人设。','生成标题',
                            function(r) { _npcTitleCache[nId] = r; renderLivePlaza(); }, null);
                    })(npcId, npc);
                }
            }
        });
        store.liveState.activeNpcs = activeNpcs;
    }

    // ========== 直播广场渲染 ==========
    window.renderLivePlaza = function() {
        _ensureLiveStore();
        if (!store.liveState.activeStreams.length || Date.now()-store.liveState.lastRefresh > 300000) refreshLiveStreams();
        var scroll = document.getElementById('live-plaza-scroll');
        if (!scroll) return;
        var html = '<div class="live-plaza-tabs">';
        html += '<div class="live-plaza-tab '+(liveState.plazaTab==='live'?'active':'')+'" onclick="livePlazaTab(\'live\')">'+SVG.live+' 直播</div>';
        html += '<div class="live-plaza-tab '+(liveState.plazaTab==='history'?'active':'')+'" onclick="livePlazaTab(\'history\')">'+SVG.history+' 回放</div>';
        html += '<div class="live-plaza-tab '+(liveState.plazaTab==='schedule'?'active':'')+'" onclick="livePlazaTab(\'schedule\')">'+SVG.calendar+' 预告</div>';
        html += '<div class="live-plaza-tab" onclick="liveGenerateNewNpc()" style="margin-left:auto;color:#b388ff">'+SVG.plus+' 新主播</div>';
        html += '<div class="live-plaza-tab" onclick="liveSignIn()" style="color:#c0a040">'+SVG.check+' 签到</div>';
        html += '</div>';
        // 金币余额栏
        _ensureLiveStore();
        html += '<div class="live-plaza-coins-bar">';
        html += '<div class="live-plaza-coins-info">'+SVG.coin+' <span class="live-plaza-coins-amount">'+store.liveCoins+'</span><span class="live-plaza-coins-label">金币</span></div>';
        html += '<div class="live-plaza-recharge-btn" onclick="liveOpenRecharge()">'+SVG.plus+' 充值</div>';
        html += '</div>';
        if (liveState.plazaTab==='history') html += _renderHistoryTab();
        else if (liveState.plazaTab==='schedule') html += _renderScheduleTab();
        else html += _renderLiveTab();
        scroll.innerHTML = html;
    };
    window.livePlazaTab = function(tab) { liveState.plazaTab = tab; renderLivePlaza(); };

    function _renderLiveTab() {
        var contacts = store.contacts||[];
        var liveIds = store.liveState.activeStreams||[];
        var liveContacts = liveIds.map(function(id){ return contacts.find(function(c){return c.id===id;}); }).filter(Boolean);
        var filtered = liveContacts;
        if (liveState.currentTab !== 'all') {
            filtered = liveContacts.filter(function(c){ _ensureContactLiveRoom(c); return c.liveRoom.category===liveState.currentTab; });
        }
        if (liveState.searchQuery) {
            var q = liveState.searchQuery.toLowerCase();
            filtered = filtered.filter(function(c){ return (c.name||'').toLowerCase().includes(q) || (c.liveRoom&&c.liveRoom.title||'').toLowerCase().includes(q); });
        }
        var html = '<div class="live-search-bar '+(liveState.searchVisible?'show':'')+'">';
        html += '<input placeholder="搜索主播或直播间" value="'+(liveState.searchQuery||'')+'" oninput="liveSearchInput(this.value)">';
        html += '</div><div class="live-tabs">';
        Object.keys(LIVE_CATEGORIES).forEach(function(k) {
            html += '<div class="live-tab '+(liveState.currentTab===k?'active':'')+'" onclick="liveSwitchTab(\''+k+'\')">'+LIVE_CATEGORIES[k]+'</div>';
        });
        html += '</div>';
        // NPC直播卡片
        var npcIds = store.liveState.activeNpcs||[];
        var npcFiltered = npcIds.map(function(id){ return NPC_POOL.find(function(n){return n.id===id;}); }).filter(Boolean);
        if (liveState.currentTab !== 'all') {
            npcFiltered = npcFiltered.filter(function(n){ return n.category===liveState.currentTab; });
        }
        if (liveState.searchQuery) {
            var sq = liveState.searchQuery.toLowerCase();
            npcFiltered = npcFiltered.filter(function(n){ return n.name.toLowerCase().includes(sq); });
        }
        var allCards = [];
        // NPC卡片（使用缓存的观众数）
        npcFiltered.forEach(function(npc) {
            var rel = _getNpcRelation(npc.id);
            var relLv = _getNpcRelLevel(npc.id);
            if (!_npcViewerCache[npc.id]) _npcViewerCache[npc.id] = 50+Math.floor(Math.random()*300);
            var viewers = _npcViewerCache[npc.id];
            allCards.push({ type:'npc', npc:npc, viewers:viewers, rel:rel, relLv:relLv });
        });
        // 联系人卡片
        filtered.forEach(function(c) {
            _ensureContactLiveRoom(c);
            allCards.push({ type:'contact', contact:c });
        });
        if (allCards.length === 0) {
            html += '<div class="live-empty"><div style="color:#444;margin-bottom:16px">'+SVG.broadcast+'</div><p>暂时没有直播<br>点击下方按钮开始你的直播吧</p></div>';
        } else {
            html += '<div class="live-grid">';
            allCards.forEach(function(card) {
                if (card.type === 'npc') {
                    var n = card.npc;
                    var initial = n.name[0]||'?';
                    html += '<div class="live-card" onclick="liveEnterNpcRoom(\''+n.id+'\')">';
                    var npcTitle = _npcTitleCache[n.id] || (n.name+'的直播间');
                    var isFollowed = (store.liveFollowed||[]).includes(n.id);
                    html += '<div class="live-card-gradient" style="background:'+( LIVE_THEMES[0].bg )+'"><div class="live-card-desc">'+_esc(npcTitle)+'</div></div>';
                    html += '<div class="live-card-top"><div class="live-badge">'+SVG.live+' NPC</div>';
                    html += '<div class="live-viewers">'+SVG.eye+' '+card.viewers+'</div></div>';
                    if (isFollowed) html += '<div class="live-card-follow-tag">已关注</div>';
                    html += '<div class="live-card-bottom"><div class="live-card-host">';
                    html += '<div class="live-card-avatar-placeholder">'+initial+'</div>';
                    html += '<div class="live-card-name">'+_esc(n.name)+'</div></div>';
                    html += '<div class="live-card-title" style="color:'+card.relLv.color+'">'+card.relLv.name+(_npcStatusCache[n.id]?' · '+_esc(_npcStatusCache[n.id]):'')+'</div>';
                    html += '<div class="live-card-category">'+( LIVE_CATEGORIES[n.category]||'聊天')+'</div>';
                    html += '</div></div>';
                } else {
                    var c = card.contact;
                    var lr = c.liveRoom;
                    var avatar = c.avatar || (window._ph?window._ph(56):'');
                    var viewers = lr._viewersCache || (20+Math.floor(Math.random()*200));
                    var title = lr.title || _generateLiveTitle(c);
                    var catLabel = LIVE_CATEGORIES[lr.category]||'聊天';
                    if (lr.background) {
                        html += '<div class="live-card" onclick="liveEnterRoom(\''+c.id+'\')">';
                        html += '<div class="live-card-bg" style="background-image:url(\''+lr.background+'\')"></div>';
                        html += '<div class="live-card-top"><div class="live-badge">'+SVG.live+' LIVE</div>';
                        html += '<div class="live-viewers">'+SVG.eye+' '+viewers+'</div></div>';
                        html += '<div class="live-card-bottom"><div class="live-card-host">';
                        html += '<img class="live-card-avatar" src="'+avatar+'" onerror="this.src=\''+(window._ph?window._ph(56):'')+'\'">';
                        html += '<div class="live-card-name">'+_esc(c.remark||c.name)+'</div></div>';
                        html += '<div class="live-card-title">'+_esc(title)+'</div>';
                        html += '<div class="live-card-category">'+catLabel+'</div></div></div>';
                    } else {
                        var theme = LIVE_THEMES.find(function(t){return t.id===(lr.theme||'default');})||LIVE_THEMES[0];
                        html += '<div class="live-card" onclick="liveEnterRoom(\''+c.id+'\')">';
                        html += '<div class="live-card-gradient" style="background:'+theme.bg+'"><div class="live-card-desc">'+_esc(lr.description||title)+'</div></div>';
                        html += '<div class="live-card-top"><div class="live-badge">'+SVG.live+' LIVE</div>';
                        html += '<div class="live-viewers">'+SVG.eye+' '+viewers+'</div></div>';
                        html += '<div class="live-card-bottom"><div class="live-card-host">';
                        html += '<img class="live-card-avatar" src="'+avatar+'" onerror="this.src=\''+(window._ph?window._ph(56):'')+'\'">';
                        html += '<div class="live-card-name">'+_esc(c.remark||c.name)+'</div></div>';
                        html += '<div class="live-card-category">'+catLabel+'</div></div></div>';
                    }
                }
            });
            html += '</div>';
        }
        return html;
    }

    function _renderHistoryTab() {
        _ensureLiveStore();
        var history = store.liveHistory||[];
        if (history.length===0) return '<div class="live-empty">'+SVG.history+'<p>暂无直播回放</p></div>';
        var html = '<div class="live-history-list">';
        history.slice().reverse().forEach(function(h, idx) {
            var realIdx = history.length-1-idx;
            var date = new Date(h.time);
            var dateStr = (date.getMonth()+1)+'/'+date.getDate()+' '+date.getHours()+':'+String(date.getMinutes()).padStart(2,'0');
            html += '<div class="live-history-item" onclick="liveViewReplay('+realIdx+')">';
            html += '<div class="live-history-avatar">'+(h.hostName?h.hostName[0]:'?')+'</div>';
            html += '<div class="live-history-info"><div class="live-history-name">'+_esc(h.hostName||'未知')+'</div>';
            html += '<div class="live-history-title">'+_esc(h.title||'直播回放')+'</div>';
            if (h.summary) html += '<div class="live-history-summary">'+_esc(h.summary)+'</div>';
            html += '<div class="live-history-meta">'+dateStr+' · '+(h.danmakuCount||0)+'条弹幕 · '+_formatNum(h.viewers||0)+'观看</div></div>';
            html += '<div style="color:#ff4d6a">'+SVG.play+'</div></div>';
        });
        return html+'</div>';
    }

    function _renderScheduleTab() {
        _ensureLiveStore();
        var schedules = store.liveSchedule||[];
        var html = '<div style="padding:10px 0"><div class="live-schedule-add" onclick="liveAddSchedule()">'+SVG.plus+' 添加直播预告</div></div>';
        if (schedules.length===0) return html+'<div class="live-empty">'+SVG.calendar+'<p>暂无直播预告</p></div>';
        html += '<div class="live-history-list">';
        schedules.forEach(function(s, idx) {
            var date = new Date(s.time);
            var dateStr = (date.getMonth()+1)+'月'+date.getDate()+'日 '+date.getHours()+':'+String(date.getMinutes()).padStart(2,'0');
            var isPast = Date.now() > s.time;
            html += '<div class="live-history-item '+(isPast?'past':'')+'">';
            html += '<div class="live-history-avatar" style="background:'+(isPast?'#555':'#ff4d6a')+'">'+(isPast?SVG.check:SVG.calendar)+'</div>';
            html += '<div class="live-history-info"><div class="live-history-name">'+_esc(s.hostName||'我')+'</div>';
            html += '<div class="live-history-title">'+_esc(s.title||'直播预告')+'</div>';
            html += '<div class="live-history-meta">'+dateStr+' · '+_esc(LIVE_CATEGORIES[s.category]||'聊天')+'</div></div>';
            html += '<div style="cursor:pointer;color:#666" onclick="event.stopPropagation();liveRemoveSchedule('+idx+')">'+SVG.trash+'</div></div>';
        });
        return html+'</div>';
    }

    function _generateLiveTitle(c) {
        // 如果已有AI缓存标题则用缓存
        if (c.liveRoom && c.liveRoom._aiTitle) return c.liveRoom._aiTitle;
        var fallback = (c.remark||c.name)+'的直播间';
        // 异步生成AI标题并缓存
        _liveAI(
            '你是"'+(c.remark||c.name)+'"的直播间标题生成器。人设：'+(c.persona||c.description||'活泼可爱')+'。直播分类：'+((c.liveRoom&&c.liveRoom.category)||'chat')+'。请生成一个有趣、吸引人的直播间标题，8-15字，不要引号，要符合人设风格。',
            '生成直播间标题',
            function(reply) {
                if (c.liveRoom) { c.liveRoom._aiTitle = reply; }
                // 精确匹配：用data属性标记对应联系人卡片
                var card = document.querySelector('.live-card-title[data-cid="'+c.id+'"]');
                if (card) card.textContent = reply;
                var sub = document.querySelector('.live-room-host-sub[data-cid="'+c.id+'"]');
                if (sub) sub.textContent = reply;
                // fallback：重新渲染广场
                if (!card && !sub) renderLivePlaza();
            }, null
        );
        return fallback;
    }

    window.liveSwitchTab = function(tab) { liveState.currentTab = tab; renderLivePlaza(); };
    window.liveSearchToggle = function() { liveState.searchVisible = !liveState.searchVisible; if (!liveState.searchVisible) liveState.searchQuery=''; renderLivePlaza(); };
    window.liveSearchInput = function(val) { liveState.searchQuery = val; renderLivePlaza(); };

    // ========== 签到（修复连续天数+金币系统）==========
    window.liveSignIn = function() {
        _ensureLiveStore();
        var today = new Date().toDateString();
        if (store.liveSignIn.lastDate===today) { if (typeof toast==='function') toast('今天已经签到过啦~ 💰余额：'+store.liveCoins+'金币'); return; }
        // 检查是否连续签到（昨天有签到才算连续）
        var yesterday = new Date(Date.now()-86400000).toDateString();
        if (store.liveSignIn.lastDate === yesterday) {
            store.liveSignIn.streak = (store.liveSignIn.streak||0)+1;
        } else {
            store.liveSignIn.streak = 1; // 断签重置
        }
        store.liveSignIn.lastDate = today;
        var coins = 5+Math.min(store.liveSignIn.streak,7)*2;
        store.liveSignIn.totalCoins = (store.liveSignIn.totalCoins||0)+coins;
        store.liveCoins = (store.liveCoins||0)+coins; // 加到钱包
        if (typeof save==='function') save();
        if (typeof toast==='function') toast('签到成功！连续'+store.liveSignIn.streak+'天，获得'+coins+'金币 💰余额：'+store.liveCoins);
    };

    // ========== 预告管理 ==========
    window.liveAddSchedule = function() {
        var title = prompt('直播标题：'); if (!title) return;
        var timeStr = prompt('直播时间（格式：2026-01-01 20:00）：'); if (!timeStr) return;
        var time = new Date(timeStr).getTime();
        if (isNaN(time)) { if (typeof toast==='function') toast('时间格式不对哦'); return; }
        _ensureLiveStore();
        var userName = (store.personas&&store.personas[0]&&store.personas[0].name)||'我';
        store.liveSchedule.push({ title:title, time:time, hostName:userName, category:'chat' });
        store.liveSchedule.sort(function(a,b){return a.time-b.time;});
        if (typeof save==='function') save();
        renderLivePlaza();
    };
    window.liveRemoveSchedule = function(idx) { _ensureLiveStore(); store.liveSchedule.splice(idx,1); if (typeof save==='function') save(); renderLivePlaza(); };

    // ========== 进入联系人直播间 ==========
    window.liveEnterRoom = function(contactId) {
        var c = (store.contacts||[]).find(function(x){return x.id===contactId;});
        if (!c) { if (typeof toast==='function') toast('找不到该联系人'); return; }
        _ensureContactLiveRoom(c);
        liveState.inRoom = true;
        liveState.roomContactId = contactId;
        liveState.roomNpcId = null;
        liveState.roomMode = 'ai_host';
        liveState.roomDanmakuList = [];
        liveState.roomConversationHistory = [];
        liveState.viewerCount = 20+Math.floor(Math.random()*180);
        liveState.likeCount = Math.floor(Math.random()*500);
        liveState.giftPanelOpen = false; liveState.decorPanelOpen = false; liveState.rankPanelOpen = false;
        liveState.aiSpeaking = false;
        liveState.giftCombo = { gift:null, count:0, timer:null, sender:'' };
        liveState.superDanmakuQueue = []; liveState.superDanmakuShowing = false;
        liveState.voteActive = false; liveState.voteData = null;
        liveState.miniGameActive = false; liveState.miniGameData = null;
        liveState.atmosphere = c.liveRoom.atmosphere||'none';
        liveState.danmakuColor = '#fff';
        liveState.hostActivity = '';
        try {
            renderLiveRoom();
            var container = document.getElementById('live-room-content');
            if (!container||!container.innerHTML||container.innerHTML.trim()==='') throw new Error('empty');
        } catch(e) { liveState.inRoom=false; liveState.roomContactId=null; if (typeof toast==='function') toast('直播间加载失败'); return; }
        requestAnimationFrame(function(){ document.getElementById('layer-live-room').classList.add('show'); });
        var userName = (store.personas&&store.personas[0]&&store.personas[0].name)||'你';
        if (_hasPerk(contactId,'entryEffect')) _addDanmaku('entry_effect',null,'* '+userName+' 驾到！欢迎守护者 *',_getFanLevel((_getFanData(contactId)).exp||0).color);
        else if (_hasPerk(contactId,'entryNotice')) _addDanmaku('system',null,userName+' 进入了直播间');
        else _addDanmaku('system',null,userName+' 进入了直播间');
        _startAIAutoSpeak(c);
        _startVirtualViewers();
        _startFanExpTimer();
        _startAtmosphere();
        _startHostActivity(c);
        _startHeatTracking();
        liveState._viewerTimer = setInterval(function(){
            liveState.viewerCount += Math.floor(Math.random()*7)-2;
            if (liveState.viewerCount<10) liveState.viewerCount=10;
            var el = document.getElementById('live-room-viewer-count');
            if (el) el.textContent = liveState.viewerCount;
        }, 8000);
        setTimeout(function(){
            if (!liveState.inRoom) return;
            if (Math.random()>0.5) setTimeout(function(){ if (liveState.inRoom) _aiStartVote(c); }, 30000+Math.random()*30000);
            if (Math.random()>0.6) setTimeout(function(){ if (liveState.inRoom) _aiStartMiniGame(c); }, 60000+Math.random()*30000);
        }, 5000);
    };

    // ========== 进入NPC直播间 ==========
    window.liveEnterNpcRoom = function(npcId) {
        var npc = NPC_POOL.find(function(n){return n.id===npcId;});
        if (!npc) return;
        var rel = _getNpcRelation(npcId);
        rel.visitCount = (rel.visitCount||0)+1;
        rel.lastVisit = Date.now();
        _addNpcAffinity(npcId, 2);
        liveState.inRoom = true;
        liveState.roomContactId = null;
        liveState.roomNpcId = npcId;
        liveState.roomMode = 'npc_host';
        liveState.roomDanmakuList = [];
        liveState.roomConversationHistory = [];
        liveState.viewerCount = 50+Math.floor(Math.random()*300);
        liveState.likeCount = Math.floor(Math.random()*800);
        liveState.giftPanelOpen = false; liveState.decorPanelOpen = false; liveState.rankPanelOpen = false;
        liveState.aiSpeaking = false;
        liveState.giftCombo = { gift:null, count:0, timer:null, sender:'' };
        liveState.superDanmakuQueue = []; liveState.superDanmakuShowing = false;
        liveState.voteActive = false; liveState.voteData = null;
        liveState.miniGameActive = false; liveState.miniGameData = null;
        liveState.atmosphere = 'none';
        liveState.danmakuColor = '#fff';
        liveState.hostActivity = '';
        try {
            _renderNpcRoom(npc);
            var container = document.getElementById('live-room-content');
            if (!container||!container.innerHTML||container.innerHTML.trim()==='') throw new Error('empty');
        } catch(e) { liveState.inRoom=false; liveState.roomNpcId=null; if (typeof toast==='function') toast('直播间加载失败'); return; }
        requestAnimationFrame(function(){ document.getElementById('layer-live-room').classList.add('show'); });
        var userName = (store.personas&&store.personas[0]&&store.personas[0].name)||'你';
        _addDanmaku('system',null,userName+' 进入了直播间');
        _startNpcAutoSpeak(npc);
        _startVirtualViewers();
        _startFanExpTimer();
        _startHostActivity(null, npc);
        _startHeatTracking();
        liveState._viewerTimer = setInterval(function(){
            liveState.viewerCount += Math.floor(Math.random()*7)-2;
            if (liveState.viewerCount<10) liveState.viewerCount=10;
            var el = document.getElementById('live-room-viewer-count');
            if (el) el.textContent = liveState.viewerCount;
        }, 8000);
    };

    // ========== 主播行为状态系统（全API）==========
    function _startHostActivity(contact, npc) {
        if (liveState.hostActivityTimer) clearInterval(liveState.hostActivityTimer);
        var source = npc || contact;
        if (!source) return;
        var name = npc ? npc.name : (contact.remark||contact.name);
        var persona = npc ? npc.persona : (contact.persona||contact.description||'');
        var cat = npc ? npc.category : (contact.liveRoom&&contact.liveRoom.category||'chat');
        var baseSys = '你是"'+name+'"，正在直播。人设：'+persona+'。直播分类：'+cat+'。';
        // 初始行为通过AI生成
        _liveAI(baseSys+'请用第三人称描述你现在正在做的一个动作或状态，10-20字，不要引号，要符合人设和直播分类。', '描述当前动作',
            function(reply) { liveState.hostActivity = reply; _updateHostActivityUI(); },
            function() { liveState.hostActivity = '准备中...'; _updateHostActivityUI(); }
        );
        liveState.hostActivityTimer = setInterval(function(){
            if (!liveState.inRoom) return;
            var heatInfo = _getHeatDesc();
            var recentCtx = _getRecentContext(5);
            var sysP = baseSys+'当前直播间氛围：'+heatInfo+'。最近弹幕：\n'+recentCtx+'\n请用第三人称描述你现在正在做的一个动作或状态，10-20字，不要引号，要符合人设、直播分类和当前氛围。不要重复上一个动作："'+liveState.hostActivity+'"';
            _liveAI(sysP, '描述当前动作',
                function(reply) { liveState.hostActivity = reply; _updateHostActivityUI(); },
                null
            );
        }, 15000+Math.random()*10000);
    }
    function _updateHostActivityUI() {
        var el = document.getElementById('live-host-activity');
        if (el) el.textContent = liveState.hostActivity;
    }

    // ========== 渲染联系人直播间 ==========
    function renderLiveRoom() {
        var container = document.getElementById('live-room-content');
        if (!container) return;
        var c = (store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;});
        if (!c) return;
        _ensureContactLiveRoom(c);
        var lr = c.liveRoom;
        var avatar = c.avatar || (window._ph?window._ph(56):'');
        var theme = LIVE_THEMES.find(function(t){return t.id===(lr.theme||'default');})||LIVE_THEMES[0];
        var title = lr.title || _generateLiveTitle(c);
        var fan = _getFanData(liveState.roomContactId);
        var fanLv = _getFanLevel(fan.exp||0);
        var bgHtml = lr.background
            ? '<div class="live-room-bg" style="background-image:url(\''+lr.background+'\')"></div><div class="live-room-bg-overlay"></div>'
            : '<div class="live-room-bg-default" style="background:'+theme.bg+'"></div>';
        container.innerHTML = '<div class="live-room">'
            +bgHtml
            +'<div class="live-atmosphere-layer" id="live-atmosphere-layer"></div>'
            +'<div class="live-super-danmaku-layer" id="live-super-danmaku-layer"></div>'
            +'<div class="live-room-header">'
            +'<div class="live-room-host-info">'
            +'<img class="live-room-host-avatar" src="'+avatar+'" onerror="this.src=\''+(window._ph?window._ph(56):'')+'\'">'
            +'<div><div class="live-room-host-name">'+_esc(c.remark||c.name)+'</div>'
            +'<div class="live-room-host-sub">'+_esc(title)+'</div></div></div>'
            +'<div style="display:flex;align-items:center;gap:8px;">'
            +'<div class="live-room-viewers" onclick="liveToggleRankPanel()"><span style="color:#c0a040">'+SVG.trophy+'</span> <span id="live-room-viewer-count">'+liveState.viewerCount+'</span></div>'
            +'<div class="live-room-close" onclick="liveExitRoom()">'+SVG.close+'</div>'
            +'</div></div>'
            +(lr.announcement?'<div class="live-announcement">'+SVG.broadcast+' '+_esc(lr.announcement)+'</div>':'')
            +'<div class="live-fan-bar"><span class="live-fan-badge-big" style="color:'+fanLv.color+'">Lv'+fanLv.level+' '+fanLv.name+'</span>'
            +'<span style="color:#888;font-size:11px">EXP: '+(fan.exp||0)+'/'+(FAN_LEVELS[fanLv.level]?FAN_LEVELS[fanLv.level].minExp:'∞')+'</span></div>'
            +'<div class="live-host-activity-bar" id="live-host-activity-bar"><span class="live-host-activity-dot"></span> <span id="live-host-activity">'+(liveState.hostActivity||'准备中...')+'</span></div>'
            +'<div class="live-danmaku-area" id="live-danmaku-area"></div>'
            +'<div id="live-interactive-area"></div>'
            +'<div class="live-combo-area" id="live-combo-area"></div>'
            +_buildToolbar()
            +'<div class="live-gift-panel" id="live-gift-panel"></div>'
            +'<div class="live-decor-panel" id="live-decor-panel"></div>'
            +'<div class="live-rank-panel" id="live-rank-panel"></div>'
            +'</div>';
        _renderDanmaku();
    }

    // ========== 渲染NPC直播间 ==========
    function _renderNpcRoom(npc) {
        var container = document.getElementById('live-room-content');
        if (!container) return;
        var rel = _getNpcRelation(npc.id);
        var relLv = _getNpcRelLevel(npc.id);
        var initial = npc.name[0]||'?';
        container.innerHTML = '<div class="live-room">'
            +'<div class="live-room-bg-default" style="background:#1a1a1a"></div>'
            +'<div class="live-atmosphere-layer" id="live-atmosphere-layer"></div>'
            +'<div class="live-super-danmaku-layer" id="live-super-danmaku-layer"></div>'
            +'<div class="live-room-header">'
            +'<div class="live-room-host-info" onclick="liveShowNpcProfile(\''+npc.id+'\')" style="cursor:pointer">'
            +'<div class="live-npc-avatar-circle">'+initial+'</div>'
            +'<div><div class="live-room-host-name">'+_esc(npc.name)+' <span style="font-size:11px;color:'+relLv.color+'">'+relLv.name+'</span></div>'
            +'<div class="live-room-host-sub">'+_esc(LIVE_CATEGORIES[npc.category]||'聊天')+'</div></div></div>'
            +'<div style="display:flex;align-items:center;gap:8px;">'
            +'<div class="live-room-viewers" onclick="liveToggleRankPanel()"><span style="color:#c0a040">'+SVG.trophy+'</span> <span id="live-room-viewer-count">'+liveState.viewerCount+'</span></div>'
            +'<div class="live-room-close" onclick="liveExitRoom()">'+SVG.close+'</div>'
            +'</div></div>'
            +'<div class="live-host-activity-bar" id="live-host-activity-bar"><span class="live-host-activity-dot"></span> <span id="live-host-activity">'+(liveState.hostActivity||'准备中...')+'</span></div>'
            +'<div class="live-danmaku-area" id="live-danmaku-area"></div>'
            +'<div id="live-interactive-area"></div>'
            +'<div class="live-combo-area" id="live-combo-area"></div>'
            +_buildNpcToolbar(npc)
            +'<div class="live-gift-panel" id="live-gift-panel"></div>'
            +'<div class="live-rank-panel" id="live-rank-panel"></div>'
            +'</div>';
        _renderDanmaku();
    }

    function _buildToolbar() {
        var cid = liveState.roomContactId;
        var html = '<div class="live-room-toolbar">';
        html += '<input class="live-room-input" id="live-danmaku-input" placeholder="说点什么..." onkeydown="if(event.key===\'Enter\'){liveSendDanmaku();event.preventDefault();}">';
        html += _svgBtn('send',{onclick:'liveSendDanmaku()',title:'发送弹幕'});
        if (_hasPerk(cid,'superDanmaku')) html += _svgBtn('fire',{onclick:'liveTriggerSuperDanmaku()',title:'超级弹幕',color:'#ff4d6a',cls:'live-super-danmaku-btn'});
        html += _svgBtn('palette',{onclick:'liveToggleDanmakuColor()',title:'弹幕颜色',color:liveState.danmakuColor});
        html += _svgBtn('heart',{onclick:'liveLike()',title:'点赞',color:'#ff4d6a'});
        html += _svgBtn('gift',{onclick:'liveToggleGiftPanel()',title:'送礼物',color:'#c0a040'});
        html += _svgBtn('trophy',{onclick:'liveToggleRankPanel()',title:'排行榜',color:'#c0a040'});
        html += _svgBtn('poll',{onclick:'liveRequestVote()',title:'请主播发起投票'});
        html += _svgBtn('gamepad',{onclick:'liveRequestMiniGame()',title:'请主播来个小游戏'});
        html += _svgBtn('envelope',{onclick:'liveRedPacketRain()',title:'红包雨',color:'#ff4444'});
        html += _svgBtn('info',{onclick:'liveShowStats()',title:'数据统计',color:'#5bf'});
        html += _svgBtn('cog',{onclick:'liveToggleDecorPanel()',title:'直播间设置'});
        html += '</div>';
        return html;
    }

    function _buildNpcToolbar(npc) {
        var html = '<div class="live-room-toolbar">';
        html += '<input class="live-room-input" id="live-danmaku-input" placeholder="说点什么... 试试[开心]" onkeydown="if(event.key===\'Enter\'){liveSendDanmaku();event.preventDefault();}">';
        html += _svgBtn('send',{onclick:'liveSendDanmaku()',title:'发送弹幕'});
        html += _svgBtn('palette',{onclick:'liveToggleDanmakuColor()',title:'弹幕颜色',color:liveState.danmakuColor});
        html += _svgBtn('heart',{onclick:'liveLike()',title:'点赞',color:'#ff4d6a'});
        html += _svgBtn('gift',{onclick:'liveToggleGiftPanel()',title:'送礼物',color:'#c0a040'});
        html += _svgBtn('trophy',{onclick:'liveToggleRankPanel()',title:'排行榜',color:'#c0a040'});
        html += _svgBtn('poll',{onclick:'liveRequestVote()',title:'请主播发起投票'});
        html += _svgBtn('gamepad',{onclick:'liveRequestMiniGame()',title:'请主播来个小游戏'});
        html += _svgBtn('user',{onclick:'liveShowNpcProfile(\''+npc.id+'\')',title:'主播资料',color:'#b388ff'});
        html += _svgBtn('star',{onclick:'liveToggleFollow(\''+npc.id+'\')',title:'关注',color:(store.liveFollowed||[]).includes(npc.id)?'#ff4d6a':'#888'});
        html += _svgBtn('envelope',{onclick:'liveRedPacketRain()',title:'红包雨',color:'#ff4444'});
        html += _svgBtn('info',{onclick:'liveShowStats()',title:'数据统计',color:'#5bf'});
        html += '</div>';
        return html;
    }

    // ========== 弹幕表情包渲染 ==========
    function _renderEmoji(text) {
        var escaped = _esc(text);
        // 替换 [xxx] 为 emoji
        Object.keys(DANMAKU_EMOJI).forEach(function(key) {
            var escapedKey = _esc(key);
            escaped = escaped.split(escapedKey).join('<span class="live-emoji">'+DANMAKU_EMOJI[key]+'</span>');
        });
        return escaped;
    }

    // ========== 弹幕系统（支持表情包）==========
    function _makeDanmakuHtml(d) {
        if (d.type==='system') return '<div class="live-danmaku-item live-danmaku-system">'+_renderEmoji(d.text)+'</div>';
        if (d.type==='entry_effect') return '<div class="live-danmaku-item live-danmaku-entry-effect" style="color:'+(d.color||'#ffd700')+'">'+_renderEmoji(d.text)+'</div>';
        if (d.type==='gift') return '<div class="live-danmaku-item live-danmaku-system" style="color:#c0a040;">'+SVG.gift+' '+_renderEmoji(d.text)+'</div>';
        if (d.type==='vote') return '<div class="live-danmaku-item live-danmaku-system" style="color:#5bf;">'+SVG.poll+' '+_renderEmoji(d.text)+'</div>';
        if (d.type==='game') return '<div class="live-danmaku-item live-danmaku-system" style="color:#66ff66;">'+SVG.gamepad+' '+_renderEmoji(d.text)+'</div>';
        var cls = d.type==='host'?'live-danmaku-host':d.type==='user'?'live-danmaku-user':'live-danmaku-virtual';
        var badge = (d.type==='user'&&liveState.roomContactId)?_getFanBadgeHtml(liveState.roomContactId):'';
        var tc = d.color&&d.color!=='#fff'?' style="color:'+d.color+'"':'';
        return '<div class="live-danmaku-item '+cls+'">'+badge+'<span class="live-danmaku-name">'+_esc(d.name||'')+':</span><span class="live-danmaku-text"'+tc+'>'+_renderEmoji(d.text)+'</span></div>';
    }
    function _addDanmaku(type,name,text,color) {
        var d = {type:type,name:name,text:text,color:color||'#fff',time:Date.now()};
        liveState.roomDanmakuList.push(d);
        if (liveState.roomDanmakuList.length>150) liveState.roomDanmakuList.shift();
        var area = document.getElementById('live-danmaku-area');
        if (!area) return;
        var div = document.createElement('div');
        div.innerHTML = _makeDanmakuHtml(d);
        if (div.firstChild) area.appendChild(div.firstChild);
        while (area.children.length>60) area.removeChild(area.firstChild);
        area.scrollTop = area.scrollHeight;
    }
    function _renderDanmaku() {
        var area = document.getElementById('live-danmaku-area');
        if (!area) return;
        var frag = document.createDocumentFragment();
        liveState.roomDanmakuList.forEach(function(d){
            var tmp = document.createElement('div');
            tmp.innerHTML = _makeDanmakuHtml(d);
            if (tmp.firstChild) frag.appendChild(tmp.firstChild);
        });
        area.textContent = '';
        area.appendChild(frag);
        area.scrollTop = area.scrollHeight;
    }

    // 弹幕颜色
    window.liveToggleDanmakuColor = function() {
        if (liveState.roomContactId && !_hasPerk(liveState.roomContactId,'colorDanmaku')) { if (typeof toast==='function') toast('铁粉(Lv2)以上才能使用彩色弹幕'); return; }
        var idx = DANMAKU_COLORS.indexOf(liveState.danmakuColor);
        liveState.danmakuColor = DANMAKU_COLORS[(idx+1)%DANMAKU_COLORS.length];
        if (typeof toast==='function') toast('弹幕颜色已切换');
    };

    // 超级弹幕
    window.liveSendSuperDanmaku = function(text) {
        if (liveState.roomContactId && !_hasPerk(liveState.roomContactId,'superDanmaku')) { if (typeof toast==='function') toast('至尊(Lv5)才能发超级弹幕'); return; }
        var userName = (store.personas&&store.personas[0]&&store.personas[0].name)||'我';
        liveState.superDanmakuQueue.push({name:userName,text:text,color:liveState.danmakuColor});
        _processSuperDanmaku();
    };
    window.liveTriggerSuperDanmaku = function() {
        var input = document.getElementById('live-danmaku-input');
        if (!input) return;
        var text = input.value.trim();
        if (!text) { if (typeof toast==='function') toast('请先输入弹幕内容'); return; }
        input.value = '';
        liveSendSuperDanmaku(text);
    };
    function _processSuperDanmaku() {
        if (liveState.superDanmakuShowing||liveState.superDanmakuQueue.length===0) return;
        liveState.superDanmakuShowing = true;
        var sd = liveState.superDanmakuQueue.shift();
        var layer = document.getElementById('live-super-danmaku-layer');
        if (!layer) { liveState.superDanmakuShowing=false; return; }
        layer.innerHTML = '<div class="live-super-danmaku" style="--sd-color:'+sd.color+'"><span class="live-super-danmaku-name">'+_esc(sd.name)+'</span><span class="live-super-danmaku-text">'+_esc(sd.text)+'</span></div>';
        setTimeout(function(){ layer.innerHTML=''; liveState.superDanmakuShowing=false; _processSuperDanmaku(); }, 4000);
    }

    // 用户发送弹幕
    window.liveSendDanmaku = function() {
        var input = document.getElementById('live-danmaku-input');
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        input.value = ''; input.focus();
        if (text.startsWith('/super ')||text.startsWith('/sc ')) { liveSendSuperDanmaku(text.replace(/^\/(super|sc)\s+/,'')); return; }
        if (liveState.miniGameActive&&liveState.miniGameData) _checkGameAnswer(text);
        if (liveState.voteActive&&liveState.voteData) { var num=parseInt(text); if (num>=1&&num<=liveState.voteData.options.length) { liveState.voteData.votes[num-1]=(liveState.voteData.votes[num-1]||0)+1; _renderVotePanel(); } }
        var userName = (store.personas&&store.personas[0]&&store.personas[0].name)||'我';
        _addDanmaku('user',userName,text,liveState.danmakuColor);
        liveState.likeCount += 1;
        if (liveState.roomContactId) { _addFanExp(liveState.roomContactId,2); var f=_getFanData(liveState.roomContactId); f.danmakuCount=(f.danmakuCount||0)+1; }
        if (liveState.roomNpcId) { _addNpcAffinity(liveState.roomNpcId,3); var r=_getNpcRelation(liveState.roomNpcId); r.danmakuCount=(r.danmakuCount||0)+1; }
        if (liveState.roomMode==='npc_host') _npcAIRespond(text);
        else _liveAIRespond(text);
    };

    // ========== AI主播回复（联系人，强化人设+热度感知）==========
    function _liveAIRespond(userMsg) {
        if (liveState.aiSpeaking||(liveState._lastAISpeakAt&&Date.now()-liveState._lastAISpeakAt<2000)) return;
        var c = (store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;});
        if (!c) return;
        liveState.roomConversationHistory.push({role:'user',content:userMsg});
        if (liveState.roomConversationHistory.length>20) liveState.roomConversationHistory = liveState.roomConversationHistory.slice(-16);
        liveState.aiSpeaking = true;
        var persona = c.persona||c.description||'';
        var heatInfo = _getHeatDesc();
        var sysPrompt = '你是"'+c.name+'"，正在直播间做主播。\n【人设（必须严格遵守，绝对不能脱离角色）】：'+(persona||'活泼开朗，喜欢和粉丝互动')
            +'\n【直播间氛围】：'+heatInfo+'（观众'+liveState.viewerCount+'人）'
            +'\n【规则】：1.用口语化、活泼的方式回复观众弹幕 2.回复简短（15-40字）3.像真实主播一样自然 4.可以用语气词 5.不要用引号包裹 6.直接回复内容不加前缀 7.绝对不能说出与人设矛盾的话 8.当前你正在：'+liveState.hostActivity
            +'\n9.根据直播间氛围调整语气：热闹时更兴奋，冷场时主动找话题';
        _liveAIWithHistory(sysPrompt, liveState.roomConversationHistory,
            function(reply) {
                liveState.aiSpeaking=false; liveState._lastAISpeakAt=Date.now();
                _addDanmaku('host',c.remark||c.name,reply);
                liveState.roomConversationHistory.push({role:'assistant',content:reply});
                _checkMilestone();
            },
            function() {
                liveState.aiSpeaking=false; liveState._lastAISpeakAt=Date.now();
                // fallback也走AI，只是用更简单的prompt
                _liveAI('你是直播间主播"'+(c.remark||c.name)+'"，人设：'+(persona||'活泼可爱')+'。用一句话回应观众，15字以内，口语化。','回应："'+userMsg+'"',
                    function(r){ _addDanmaku('host',c.remark||c.name,r); },
                    function(){ _addDanmaku('host',c.remark||c.name,'谢谢~'); }
                );
            }
        );
    }

    // ========== NPC主播回复（强化人设+好感度+热度感知）==========
    function _npcAIRespond(userMsg) {
        if (liveState.aiSpeaking||(liveState._lastAISpeakAt&&Date.now()-liveState._lastAISpeakAt<2000)) return;
        var npc = NPC_POOL.find(function(n){return n.id===liveState.roomNpcId;});
        if (!npc) return;
        var rel = _getNpcRelation(npc.id);
        var relLv = _getNpcRelLevel(npc.id);
        liveState.roomConversationHistory.push({role:'user',content:userMsg});
        if (liveState.roomConversationHistory.length>20) liveState.roomConversationHistory = liveState.roomConversationHistory.slice(-16);
        liveState.aiSpeaking = true;
        var warmth = relLv.name==='陌生'?'礼貌但保持距离':relLv.name==='了解'?'友好热情':relLv.name==='熟悉'?'亲切温暖，偶尔开玩笑':'非常亲密，语气温柔，会撒娇或关心对方';
        var heatInfo = _getHeatDesc();
        var sysPrompt = '你是"'+npc.name+'"，正在直播。\n【人设（必须严格遵守）】：'+npc.persona
            +'\n【与这位观众的关系】：'+relLv.name+'（好感度'+rel.affinity+'）\n【态度要求】：'+warmth
            +'\n【当前动作】：'+liveState.hostActivity
            +'\n【直播间氛围】：'+heatInfo+'（观众'+liveState.viewerCount+'人）'
            +'\n【规则】：1.回复15-40字 2.口语化自然 3.不用引号 4.符合人设 5.根据关系亲密度调整语气 6.根据氛围调整情绪';
        _liveAIWithHistory(sysPrompt, liveState.roomConversationHistory,
            function(reply) {
                liveState.aiSpeaking=false; liveState._lastAISpeakAt=Date.now();
                _addDanmaku('host',npc.name,reply);
                liveState.roomConversationHistory.push({role:'assistant',content:reply});
                // 好感度高时可能主动私聊
                if (rel.affinity>=300&&!rel.addedWechat&&Math.random()>0.85) {
                    setTimeout(function(){ if (liveState.inRoom) _addDanmaku('system',null,npc.name+'悄悄给你发了一条私信，点击主播头像查看'); }, 3000);
                }
                _checkMilestone();
            },
            function() {
                liveState.aiSpeaking=false; liveState._lastAISpeakAt=Date.now();
                _liveAI('你是"'+npc.name+'"，人设：'+npc.persona+'。用一句话回应观众，15字以内。','回应："'+userMsg+'"',
                    function(r){ _addDanmaku('host',npc.name,r); },
                    function(){ _addDanmaku('host',npc.name,'谢谢~'); }
                );
            }
        );
    }

    // ========== AI自动发言（全API+热度感知）==========
    function _startAIAutoSpeak(contact) {
        if (liveState.aiSpeakTimer) clearInterval(liveState.aiSpeakTimer);
        var name = contact.remark||contact.name;
        var persona = contact.persona||contact.description||'';
        // AI生成欢迎语
        setTimeout(function(){
            if (!liveState.inRoom) return;
            _liveAI('你是"'+name+'"，正在开始直播。人设：'+(persona||'活泼可爱')+'。请说一句开场欢迎语，15-30字，热情自然，不要引号，符合人设。','说开场白',
                function(reply) { _addDanmaku('host',name,reply); },
                function() { _addDanmaku('host',name,'大家好呀，欢迎来到我的直播间~'); }
            );
        }, 3000);
        liveState.aiSpeakTimer = setInterval(function(){
            if (!liveState.inRoom||liveState.aiSpeaking) return;
            if (liveState._lastAISpeakAt&&Date.now()-liveState._lastAISpeakAt<3000) return;
            liveState.aiSpeaking = true;
            var heatInfo = _getHeatDesc();
            var recentCtx = _getRecentContext(6);
            var sysPrompt = '你是"'+contact.name+'"，正在直播。\n【人设（必须严格遵守）】：'+(persona||'活泼可爱')
                +'。\n当前动作：'+liveState.hostActivity
                +'\n直播间氛围：'+heatInfo+'（观众'+liveState.viewerCount+'人）'
                +'\n最近弹幕：\n'+recentCtx
                +'\n请根据当前氛围和弹幕内容，自然地说一句话。冷场时主动找话题或提问互动，热闹时回应气氛。15-50字，口语化，不要引号，符合人设。不要重复之前说过的话。';
            _liveAI(sysPrompt, '请说一句',
                function(reply) { liveState.aiSpeaking=false; if (liveState.inRoom) _addDanmaku('host',name,reply); },
                function() { liveState.aiSpeaking=false; }
            );
        }, 12000+Math.random()*8000);
    }

    // NPC自动发言（全API+热度感知）
    function _startNpcAutoSpeak(npc) {
        if (liveState.aiSpeakTimer) clearInterval(liveState.aiSpeakTimer);
        // AI生成欢迎语
        setTimeout(function(){
            if (!liveState.inRoom) return;
            _liveAI('你是"'+npc.name+'"，正在开始直播。人设：'+npc.persona+'。请说一句开场欢迎语，15-30字，符合人设风格，不要引号。','说开场白',
                function(reply) { _addDanmaku('host',npc.name,reply); },
                function() { _addDanmaku('host',npc.name,'欢迎来到我的直播间~'); }
            );
        }, 2000);
        liveState.aiSpeakTimer = setInterval(function(){
            if (!liveState.inRoom||liveState.aiSpeaking) return;
            if (liveState._lastAISpeakAt&&Date.now()-liveState._lastAISpeakAt<3000) return;
            liveState.aiSpeaking = true;
            var heatInfo = _getHeatDesc();
            var recentCtx = _getRecentContext(6);
            var sysPrompt = '你是"'+npc.name+'"，正在直播。\n【人设（必须严格遵守）】：'+npc.persona
                +'\n当前动作：'+liveState.hostActivity
                +'\n直播间氛围：'+heatInfo+'（观众'+liveState.viewerCount+'人）'
                +'\n最近弹幕：\n'+recentCtx
                +'\n请根据当前氛围和弹幕内容，自然地说一句话。冷场时主动找话题，热闹时回应气氛。15-50字，口语化，不要引号，符合人设。不要重复之前说过的话。';
            _liveAI(sysPrompt, '请说一句',
                function(reply) { liveState.aiSpeaking=false; if (liveState.inRoom) _addDanmaku('host',npc.name,reply); },
                function() { liveState.aiSpeaking=false; }
            );
        }, 10000+Math.random()*8000);
    }

    // ========== 虚拟观众（AI批量预生成+缓存，大幅减少API调用）==========
    var _liveDanmakuCache = []; // [OPT-弹幕缓存] 批量预生成的弹幕缓存
    var _liveDanmakuFetching = false; // 是否正在获取中
    
    // [OPT-弹幕批量] 一次API调用生成20条弹幕存入缓存
    function _prefetchDanmakuBatch() {
        if (_liveDanmakuFetching || !liveState.inRoom) return;
        _liveDanmakuFetching = true;
        var host = _getHostInfo();
        var recentCtx = _getRecentContext(6);
        _liveAI(
            '你模拟一个直播间里20个不同观众发的弹幕。主播是"'+(host?host.name:'主播')+'"，正在做'+(host?host.category:'聊天')+'直播。\n最近弹幕：\n'+recentCtx+'\n\n请生成20条不同观众的弹幕，每行一条，1-15字，风格多样（有夸的、有吐槽的、有起哄的、有提问的、有简短的"666""哈哈哈"等）。不要引号，不要编号，不要前缀。',
            '批量生成弹幕',
            function(reply) {
                _liveDanmakuFetching = false;
                var lines = (reply||'').split('\n').filter(function(l){ return l.trim() && l.trim().length <= 20 && l.trim().length >= 1; });
                if (lines.length > 0) {
                    _liveDanmakuCache = _liveDanmakuCache.concat(lines.map(function(l){ return l.trim().replace(/^["「『]|["」』]$/g,''); }));
                    // 限制缓存上限
                    if (_liveDanmakuCache.length > 50) _liveDanmakuCache = _liveDanmakuCache.slice(-40);
                }
            },
            function() { _liveDanmakuFetching = false; }
        );
    }
    
    function _startVirtualViewers() {
        if (liveState.virtualViewerTimer) clearInterval(liveState.virtualViewerTimer);
        // [OPT-弹幕缓存] 启动时预拉取一批弹幕
        _prefetchDanmakuBatch();
        
        liveState.virtualViewerTimer = setInterval(function(){
            if (!liveState.inRoom) return;
            if (Math.random()>0.6) return;
            var viewer = VIRTUAL_VIEWERS[Math.floor(Math.random()*VIRTUAL_VIEWERS.length)];
            
            // [OPT-弹幕缓存] 从缓存取弹幕，不再每次调API
            if (_liveDanmakuCache.length > 0) {
                var dm = _liveDanmakuCache.shift();
                _addDanmaku('virtual', viewer, dm);
            } else {
                // 缓存为空时用本地预设兜底
                var fallbacks = ['666','哈哈哈','说得对','来了来了','加油','好棒','冲冲冲','支持','真的吗','笑死','太强了','冲！','awsl','好好好'];
                _addDanmaku('virtual', viewer, fallbacks[Math.floor(Math.random()*fallbacks.length)]);
            }
            
            // [OPT-弹幕缓存] 缓存快用完时预拉取下一批
            if (_liveDanmakuCache.length < 5 && !_liveDanmakuFetching) {
                _prefetchDanmakuBatch();
            }
            
            if (liveState.voteActive&&liveState.voteData&&Math.random()>0.5) { var oi=Math.floor(Math.random()*liveState.voteData.options.length); liveState.voteData.votes[oi]++; _renderVotePanel(); }
            if (Math.random()>0.85) { var gk=['heart','rose','star']; var gkey=gk[Math.floor(Math.random()*gk.length)]; var g=LIVE_GIFTS[gkey]; _addDanmaku('gift',null,viewer+' 送出了 '+g.name+' x1'); }
        }, 4000+Math.random()*6000);
    }

    // ========== 点赞 ==========
    window.liveLike = function() {
        liveState.likeCount++;
        var room = document.querySelector('.live-room');
        if (!room) return;
        var el = document.createElement('div');
        el.className = 'live-like-float';
        el.innerHTML = SVG.heartFill;
        el.style.right = (15+Math.random()*30)+'px';
        room.appendChild(el);
        setTimeout(function(){ el.remove(); }, 1600);
    };

    // ========== 礼物系统 ==========
    window.liveToggleGiftPanel = function() {
        liveState.giftPanelOpen = !liveState.giftPanelOpen;
        liveState.decorPanelOpen = false; liveState.rankPanelOpen = false;
        _renderGiftPanel();
        var dp=document.getElementById('live-decor-panel'); if(dp) dp.classList.remove('show');
        var rp=document.getElementById('live-rank-panel'); if(rp) rp.classList.remove('show');
    };
    function _renderGiftPanel() {
        var panel = document.getElementById('live-gift-panel');
        if (!panel) return;
        if (!liveState.giftPanelOpen) { panel.classList.remove('show'); return; }
        _ensureLiveStore();
        var selectedGiftCost = LIVE_GIFTS[liveState.selectedGift] ? LIVE_GIFTS[liveState.selectedGift].cost : 0;
        var insufficient = store.liveCoins < selectedGiftCost;
        var html = '<div class="live-gift-panel-title"><span>送礼物 <span style="color:#c0a040;font-size:12px">💰'+store.liveCoins+'币</span></span>';
        html += '<div style="display:flex;align-items:center;gap:8px">';
        html += '<div class="live-gift-recharge-btn" onclick="liveOpenRecharge()">'+SVG.coin+' 充值</div>';
        html += '<span class="live-gift-panel-close" onclick="liveToggleGiftPanel()">'+SVG.close+'</span>';
        html += '</div></div>';
        // 金币不足提示
        if (insufficient) {
            html += '<div class="live-gift-insufficient"><span>金币不足，需要'+selectedGiftCost+'币，还差'+(selectedGiftCost-store.liveCoins)+'币</span>';
            html += '<button class="live-gift-insufficient-btn" onclick="liveOpenRecharge()">去充值</button></div>';
        }
        html += '<div class="live-gift-grid">';
        Object.keys(LIVE_GIFTS).forEach(function(k) {
            var g = LIVE_GIFTS[k];
            var cantAfford = store.liveCoins < g.cost;
            html += '<div class="live-gift-item '+(liveState.selectedGift===k?'selected':'')+(cantAfford?' cant-afford':'')+'" onclick="liveSelectGift(\''+k+'\')">';
            html += '<div class="live-gift-icon">'+_giftIcon(k,30)+'</div>';
            html += '<div class="live-gift-name">'+g.name+'</div>';
            html += '<div class="live-gift-cost">'+g.cost+'币</div></div>';
        });
        html += '</div><button class="live-gift-send-btn" onclick="'+(insufficient?'liveOpenRecharge()':'liveSendGift()')+'">'+(insufficient?'充值后送出':'发送')+'</button>';
        panel.innerHTML = html; panel.classList.add('show');
    }
    window.liveSelectGift = function(key) { liveState.selectedGift = key; _renderGiftPanel(); };
    window.liveSendGift = function() {
        var gift = LIVE_GIFTS[liveState.selectedGift];
        if (!gift) return;
        _ensureLiveStore();
        // 金币扣费检查
        if (store.liveCoins < gift.cost) {
            if (typeof toast==='function') toast('金币不足！需要'+gift.cost+'币，当前余额：'+store.liveCoins+'币');
            liveOpenRecharge();
            return;
        }
        store.liveCoins -= gift.cost;
        // 记录消费到充值历史
        if (!store.liveRechargeHistory) store.liveRechargeHistory = [];
        var _hostNameForRecord = '';
        if (liveState.roomContactId) { var _c = (store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;}); if (_c) _hostNameForRecord = _c.remark||_c.name; }
        if (liveState.roomNpcId) { var _n = NPC_POOL.find(function(n){return n.id===liveState.roomNpcId;}); if (_n) _hostNameForRecord = _n.name; }
        store.liveRechargeHistory.push({ type:'spend', desc:'送出 '+gift.name+(_hostNameForRecord?' 给'+_hostNameForRecord:''), coins:gift.cost, time:Date.now() });
        var userName = (store.personas&&store.personas[0]&&store.personas[0].name)||'我';
        var hostName = '';
        if (liveState.roomContactId) {
            var c = (store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;});
            if (c) { _ensureContactLiveRoom(c); c.liveRoom.totalGifts=(c.liveRoom.totalGifts||0)+gift.cost; hostName=c.remark||c.name; _addFanExp(liveState.roomContactId,gift.cost*2); var f=_getFanData(liveState.roomContactId); f.totalGifts=(f.totalGifts||0)+gift.cost; if(!c.liveRoom.giftWall) c.liveRoom.giftWall=[]; var ex=c.liveRoom.giftWall.find(function(w){return w.name===userName;}); if(ex) ex.total+=gift.cost; else c.liveRoom.giftWall.push({name:userName,total:gift.cost}); c.liveRoom.giftWall.sort(function(a,b){return b.total-a.total;}); }
        }
        if (liveState.roomNpcId) {
            var npc = NPC_POOL.find(function(n){return n.id===liveState.roomNpcId;});
            if (npc) {
                hostName=npc.name; _addNpcAffinity(liveState.roomNpcId,gift.cost*2);
                var r=_getNpcRelation(liveState.roomNpcId); r.totalGifts=(r.totalGifts||0)+gift.cost;
                // NPC排行榜数据
                if (!store.npcGiftWalls) store.npcGiftWalls = {};
                if (!store.npcGiftWalls[liveState.roomNpcId]) store.npcGiftWalls[liveState.roomNpcId] = [];
                var npcWall = store.npcGiftWalls[liveState.roomNpcId];
                var nex = npcWall.find(function(w){return w.name===userName;});
                if (nex) nex.total+=gift.cost; else npcWall.push({name:userName,total:gift.cost});
                npcWall.sort(function(a,b){return b.total-a.total;});
            }
        }
        _addDanmaku('gift',null,userName+' 送出了 '+gift.name+' x1');
        _handleGiftCombo(gift,userName);
        if (gift.anim==='fullscreen') _showGiftFullscreen(gift);
        else { var room=document.querySelector('.live-room'); if(room){ for(var i=0;i<3;i++)(function(i){ setTimeout(function(){ var el=document.createElement('div'); el.className='live-like-float'; el.innerHTML=_giftIcon(liveState.selectedGift,32); el.style.right=(10+Math.random()*50)+'px'; room.appendChild(el); setTimeout(function(){el.remove();},1600); },i*200); })(i); } }
        // AI个性化感谢
        if (hostName) setTimeout(function(){
            if(!liveState.inRoom) return;
            var host = _getHostInfo();
            var fanInfo = '';
            if (liveState.roomContactId) { var f=_getFanData(liveState.roomContactId); var fl=_getFanLevel(f.exp||0); fanInfo='粉丝等级：'+fl.name+'(Lv'+fl.level+')，累计送礼：'+_formatNum(f.totalGifts||0)+'币'; }
            if (liveState.roomNpcId) { var r=_getNpcRelation(liveState.roomNpcId); var rl=_getNpcRelLevel(liveState.roomNpcId); fanInfo='关系：'+rl.name+'，好感度：'+r.affinity; }
            _liveAI(
                '你是主播"'+hostName+'"。人设：'+(host?host.persona:'活泼可爱')+'。\n观众"'+userName+'"送了你一个"'+gift.name+'"（价值'+gift.cost+'币）。'+fanInfo+'\n请用一句话感谢，15-30字，要根据礼物价值和粉丝等级调整感谢程度：便宜礼物轻松感谢，贵重礼物要更激动感动。口语化自然，不要引号，符合人设。',
                '感谢送礼',
                function(reply) { _addDanmaku('host',hostName,reply); },
                function() { _addDanmaku('host',hostName,'谢谢'+userName+'的'+gift.name+'~'); }
            );
        }, 1000+Math.random()*1000);
        liveState.giftPanelOpen = false; _renderGiftPanel();
        if (typeof save==='function') save();
    };
    function _handleGiftCombo(gift,sender) {
        var combo = liveState.giftCombo;
        if (combo.gift===liveState.selectedGift&&combo.sender===sender&&combo.timer) { combo.count++; clearTimeout(combo.timer); }
        else { combo.gift=liveState.selectedGift; combo.count=1; combo.sender=sender; }
        combo.timer = setTimeout(function(){ combo.gift=null; combo.count=0; combo.sender=''; var el=document.getElementById('live-combo-area'); if(el){el.classList.add('fade-out'); setTimeout(function(){el.innerHTML='';el.classList.remove('fade-out');},300);} }, 3000);
        _renderCombo(gift,combo.count,sender);
    }
    function _renderCombo(gift,count,sender) {
        var el = document.getElementById('live-combo-area');
        if (!el) return;
        var size = Math.min(24+count*4,60);
        var glow = count>=5?'live-combo-glow':'';
        el.innerHTML = '<div class="live-combo '+glow+'"><span class="live-combo-sender">'+_esc(sender)+'</span><span class="live-combo-gift">'+_giftIcon(liveState.selectedGift,28)+'</span><span class="live-combo-count" style="font-size:'+size+'px">x'+count+'</span></div>';
    }
    function _showGiftFullscreen(gift) {
        var room = document.querySelector('.live-room');
        if (!room) return;
        var el = document.createElement('div');
        el.className = 'live-gift-fullscreen';
        el.innerHTML = '<div style="text-align:center"><div class="live-gift-fullscreen-inner">'+_giftIcon(gift.svg,80)+'</div><div class="live-gift-fullscreen-text">'+gift.name+'</div></div>';
        room.appendChild(el);
        setTimeout(function(){ el.remove(); }, 2500);
    }

    // ========== 排行榜面板（修复：加关闭按钮+遮罩）==========
    window.liveToggleRankPanel = function() {
        liveState.rankPanelOpen = !liveState.rankPanelOpen;
        liveState.giftPanelOpen = false; liveState.decorPanelOpen = false;
        var gp=document.getElementById('live-gift-panel'); if(gp) gp.classList.remove('show');
        var dp=document.getElementById('live-decor-panel'); if(dp) dp.classList.remove('show');
        _renderRankPanel();
    };
    function _renderRankPanel() {
        var panel = document.getElementById('live-rank-panel');
        if (!panel) return;
        if (!liveState.rankPanelOpen) { panel.classList.remove('show'); return; }
        var wall = [];
        if (liveState.roomContactId) {
            var c = (store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;});
            if (c) { _ensureContactLiveRoom(c); wall = (c.liveRoom.giftWall||[]).slice(0,10); }
        }
        // 修复：NPC排行榜也显示数据
        if (liveState.roomNpcId) {
            _ensureLiveStore();
            wall = ((store.npcGiftWalls||{})[liveState.roomNpcId]||[]).slice(0,10);
        }
        var html = '<div class="live-gift-panel-title"><span>'+SVG.trophy+' 贡献排行榜</span><span class="live-gift-panel-close" onclick="liveToggleRankPanel()">'+SVG.close+'</span></div>';
        if (wall.length===0) html += '<div style="text-align:center;color:#888;padding:20px">暂无贡献记录</div>';
        else wall.forEach(function(w,i) {
            var medals = ['1st','2nd','3rd'];
            var medal = i<3?medals[i]:(i+1);
            var medalColor = i===0?'#c0a040':i===1?'#aaa':i===2?'#a06030':'#666';
            html += '<div class="live-rank-item"><span class="live-rank-medal" style="color:'+medalColor+'">'+medal+'</span><span class="live-rank-name">'+_esc(w.name)+'</span><span class="live-rank-value">'+_formatNum(w.total)+' 币</span></div>';
        });
        panel.innerHTML = html; panel.classList.add('show');
    }

    // ========== 点击空白关闭所有面板 ==========
    document.addEventListener('click', function(e) {
        if (!liveState.inRoom) return;
        var target = e.target;
        // 检查是否点击在面板内部或工具按钮上
        if (target.closest('.live-gift-panel')||target.closest('.live-rank-panel')||target.closest('.live-decor-panel')||target.closest('.live-room-tool-btn')||target.closest('.live-room-viewers')||target.closest('.live-npc-profile-overlay')) return;
        var anyOpen = liveState.giftPanelOpen||liveState.rankPanelOpen||liveState.decorPanelOpen;
        if (anyOpen) {
            liveState.giftPanelOpen=false; liveState.rankPanelOpen=false; liveState.decorPanelOpen=false;
            var gp=document.getElementById('live-gift-panel'); if(gp) gp.classList.remove('show');
            var rp=document.getElementById('live-rank-panel'); if(rp) rp.classList.remove('show');
            var dp=document.getElementById('live-decor-panel'); if(dp) dp.classList.remove('show');
        }
    });

    // ========== 装修面板 ==========
    window.liveToggleDecorPanel = function() {
        liveState.decorPanelOpen = !liveState.decorPanelOpen;
        liveState.giftPanelOpen = false; liveState.rankPanelOpen = false;
        var gp=document.getElementById('live-gift-panel'); if(gp) gp.classList.remove('show');
        var rp=document.getElementById('live-rank-panel'); if(rp) rp.classList.remove('show');
        _renderDecorPanel();
    };
    function _renderDecorPanel() {
        var panel = document.getElementById('live-decor-panel');
        if (!panel) return;
        if (!liveState.decorPanelOpen) { panel.classList.remove('show'); return; }
        var c = (store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;});
        if (!c) return;
        _ensureContactLiveRoom(c);
        var lr = c.liveRoom;
        var html = '<div class="live-decor-title"><span>直播间设置</span><span class="live-decor-close" onclick="liveToggleDecorPanel()">'+SVG.close+'</span></div>';
        html += '<div class="live-decor-section"><div class="live-decor-label">主题风格</div><div class="live-decor-themes">';
        LIVE_THEMES.forEach(function(t){ html += '<div class="live-decor-theme-item '+((lr.theme||'default')===t.id?'active':'')+'" style="background:'+t.bg+'" onclick="liveSetTheme(\''+t.id+'\')" title="'+t.name+'"></div>'; });
        html += '</div></div>';
        html += '<div class="live-decor-section"><div class="live-decor-label">氛围特效</div><div class="live-decor-themes">';
        LIVE_ATMOSPHERE.forEach(function(a){ html += '<div class="live-decor-theme-item '+(liveState.atmosphere===a.id?'active':'')+'" style="background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:12px;color:#ccc;width:56px;height:56px" onclick="liveSetAtmosphere(\''+a.id+'\')" title="'+a.name+'">'+a.name+'</div>'; });
        html += '</div></div>';
        html += '<div class="live-decor-section"><div class="live-decor-label">背景图片</div>';
        if (lr.background) html += '<div style="margin-bottom:8px;border-radius:8px;overflow:hidden;height:80px;background:url(\''+lr.background+'\') center/cover;position:relative;"><div style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.5);color:#fff;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer" onclick="liveClearBg()">'+SVG.close+'</div></div>';
        html += '<div class="live-decor-upload-btn" onclick="liveUploadBg()">'+SVG.image+' 上传背景图</div></div>';
        html += '<div class="live-decor-section"><div class="live-decor-label">直播标题</div><input class="live-decor-input" placeholder="输入直播标题" value="'+_esc(lr.title||'')+'" onchange="liveSetTitle(this.value)"></div>';
        html += '<div class="live-decor-section"><div class="live-decor-label">公告</div><input class="live-decor-input" placeholder="输入公告" value="'+_esc(lr.announcement||'')+'" onchange="liveSetAnnouncement(this.value)"></div>';
        html += '<div class="live-decor-section"><div class="live-decor-label">描述</div><input class="live-decor-input" placeholder="输入描述" value="'+_esc(lr.description||'')+'" onchange="liveSetDesc(this.value)"></div>';
        html += '<div class="live-decor-section"><div class="live-decor-label">分类</div><div class="live-decor-themes">';
        Object.keys(LIVE_CATEGORIES).forEach(function(k){ if(k==='all') return; html += '<div class="live-decor-theme-item '+((lr.category||'chat')===k?'active':'')+'" style="background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;width:auto;padding:6px 14px;height:auto" onclick="liveSetCategory(\''+k+'\')">'+LIVE_CATEGORIES[k]+'</div>'; });
        html += '</div></div>';
        panel.innerHTML = html; panel.classList.add('show');
    }
    window.liveSetTheme = function(id) { var c=(store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;}); if(!c) return; _ensureContactLiveRoom(c); c.liveRoom.theme=id; if(typeof save==='function') save(); renderLiveRoom(); setTimeout(function(){liveState.decorPanelOpen=true;_renderDecorPanel();},50); };
    window.liveSetTitle = function(v) { var c=(store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;}); if(!c) return; _ensureContactLiveRoom(c); c.liveRoom.title=v; if(typeof save==='function') save(); };
    window.liveSetDesc = function(v) { var c=(store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;}); if(!c) return; _ensureContactLiveRoom(c); c.liveRoom.description=v; if(typeof save==='function') save(); };
    window.liveSetAnnouncement = function(v) { var c=(store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;}); if(!c) return; _ensureContactLiveRoom(c); c.liveRoom.announcement=v; if(typeof save==='function') save(); renderLiveRoom(); setTimeout(function(){liveState.decorPanelOpen=true;_renderDecorPanel();},50); };
    window.liveSetCategory = function(cat) { var c=(store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;}); if(!c) return; _ensureContactLiveRoom(c); c.liveRoom.category=cat; if(typeof save==='function') save(); _renderDecorPanel(); };
    window.liveSetAtmosphere = function(id) { liveState.atmosphere=id; var c=(store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;}); if(c){_ensureContactLiveRoom(c);c.liveRoom.atmosphere=id;if(typeof save==='function') save();} _startAtmosphere(); _renderDecorPanel(); };
    window.liveUploadBg = function() { var input=document.createElement('input'); input.type='file'; input.accept='image/*'; input.onchange=function(){ var file=this.files[0]; if(!file) return; var reader=new FileReader(); reader.onload=function(e){ var c=(store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;}); if(!c) return; _ensureContactLiveRoom(c); c.liveRoom.background=e.target.result; if(typeof save==='function') save(); renderLiveRoom(); setTimeout(function(){liveState.decorPanelOpen=true;_renderDecorPanel();},50); }; reader.readAsDataURL(file); }; input.click(); };
    window.liveClearBg = function() { var c=(store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;}); if(!c) return; _ensureContactLiveRoom(c); c.liveRoom.background=''; if(typeof save==='function') save(); renderLiveRoom(); setTimeout(function(){liveState.decorPanelOpen=true;_renderDecorPanel();},50); };

    // ========== 氛围特效 ==========
    function _startAtmosphere() {
        if (liveState.atmosphereTimer) { clearInterval(liveState.atmosphereTimer); liveState.atmosphereTimer=null; }
        var layer = document.getElementById('live-atmosphere-layer');
        if (!layer) return; layer.innerHTML = '';
        if (liveState.atmosphere==='none') return;
        // 使用emoji替代纯文字字符
        var atmoItem = LIVE_ATMOSPHERE.find(function(a){return a.id===liveState.atmosphere;});
        var ch = atmoItem && atmoItem.emoji ? atmoItem.emoji : '✨';
        liveState.atmosphereTimer = setInterval(function(){
            if (!liveState.inRoom) return;
            if (layer.children.length>15) return;
            var p = document.createElement('div');
            p.className = 'live-atmo-particle';
            p.textContent = ch;
            p.style.left = Math.random()*100+'%';
            p.style.animationDuration = (3+Math.random()*4)+'s';
            p.style.fontSize = (14+Math.random()*18)+'px';
            p.style.opacity = 0.5+Math.random()*0.5;
            layer.appendChild(p);
            setTimeout(function(){ p.remove(); }, 7000);
        }, 350);
    }

    // ========== 投票系统（AI动态生成话题）==========
    function _aiStartVote(contact) {
        if (liveState.voteActive) return;
        var name = contact.remark||contact.name;
        var persona = contact.persona||contact.description||'';
        var cat = (contact.liveRoom&&contact.liveRoom.category)||'chat';
        var recentCtx = _getRecentContext(5);
        var heatInfo = _getHeatDesc();
        // AI生成投票话题
        _liveAI(
            '你是主播"'+name+'"，人设：'+(persona||'活泼可爱')+'，直播分类：'+cat+'。\n当前氛围：'+heatInfo+'\n最近弹幕：\n'+recentCtx+'\n请根据当前直播内容和氛围，生成一个有趣的投票话题。\n必须严格按以下JSON格式返回（不要加其他文字）：\n{"q":"投票问题","opts":["选项1","选项2","选项3","选项4"]}\n要求：问题要有趣、贴合当前话题，选项要好玩。',
            '生成投票话题',
            function(reply) {
                try {
                    // 尝试解析JSON
                    var jsonStr = reply.match(/\{[\s\S]*\}/);
                    if (jsonStr) {
                        var topic = JSON.parse(jsonStr[0]);
                        if (topic.q && topic.opts && topic.opts.length >= 2) {
                            _startVoteWithTopic(contact, name, topic);
                            return;
                        }
                    }
                } catch(e) {}
                // 解析失败用fallback
                _startVoteWithTopic(contact, name, {q:'你们觉得今天直播怎么样？',opts:['超棒！','还不错','一般般','再来一场']});
            },
            function() {
                _startVoteWithTopic(contact, name, {q:'你们觉得今天直播怎么样？',opts:['超棒！','还不错','一般般','再来一场']});
            }
        );
    }
    function _startVoteWithTopic(contact, name, topic) {
        liveState.voteActive = true;
        liveState.voteData = {question:topic.q,options:topic.opts,votes:topic.opts.map(function(){return 0;}),endTime:Date.now()+30000};
        _addDanmaku('host',name,'来投票啦！'+topic.q+' 点击选项或发数字1-'+topic.opts.length+'投票~');
        _addDanmaku('vote',null,'投票开始：'+topic.q);
        _renderVotePanel();
        var vc=0;
        var vTimer = setInterval(function(){ if(!liveState.voteActive||!liveState.inRoom){clearInterval(vTimer);return;} if(vc++>8) return; var idx=Math.floor(Math.random()*topic.opts.length); liveState.voteData.votes[idx]++; _renderVotePanel(); }, 2000+Math.random()*3000);
        liveState.voteTimer = setTimeout(function(){
            clearInterval(vTimer); liveState.voteActive=false;
            if (!liveState.voteData) return;
            var maxIdx=liveState.voteData.votes.indexOf(Math.max.apply(null,liveState.voteData.votes));
            var winner = liveState.voteData.options[maxIdx];
            _addDanmaku('vote',null,'投票结束！"'+winner+'" 获胜');
            // AI生成投票结果反应
            _liveAI('你是主播"'+name+'"，人设：'+(contact.persona||contact.description||'活泼可爱')+'。投票"'+liveState.voteData.question+'"结束了，"'+winner+'"获胜。请用一句话回应结果，15-30字，口语化，不要引号。','回应投票结果',
                function(r){ _addDanmaku('host',name,r); },
                function(){ _addDanmaku('host',name,'好的！大家选了"'+winner+'"~'); }
            );
            liveState.voteData=null; _renderVotePanel();
        }, 30000);
    }
    function _renderVotePanel() {
        var area = document.getElementById('live-interactive-area');
        if (!area) return;
        if (!liveState.voteActive||!liveState.voteData) { area.textContent=''; return; }
        var vd = liveState.voteData;
        var total = vd.votes.reduce(function(a,b){return a+b;},0)||1;
        var remaining = Math.max(0,Math.ceil((vd.endTime-Date.now())/1000));
        // 增量更新：如果面板已存在，只更新倒计时和百分比条，避免全量重建DOM导致闪屏
        var existingPanel = area.querySelector('.live-vote-panel');
        if (existingPanel) {
            var timerEl = existingPanel.querySelector('.live-vote-title span');
            if (timerEl) timerEl.textContent = remaining+'s';
            var bars = existingPanel.querySelectorAll('.live-vote-bar');
            var pcts = existingPanel.querySelectorAll('.live-vote-pct');
            vd.options.forEach(function(opt,i){
                var pct = Math.round(vd.votes[i]/total*100);
                if (bars[i]) bars[i].style.width = pct+'%';
                if (pcts[i]) pcts[i].textContent = pct+'%';
            });
            return;
        }
        // 首次创建面板
        var html = '<div class="live-vote-panel"><div class="live-vote-title">'+SVG.poll+' '+_esc(vd.question)+' <span style="color:#888;font-size:11px">'+remaining+'s</span></div>';
        vd.options.forEach(function(opt,i){
            var pct = Math.round(vd.votes[i]/total*100);
            html += '<div class="live-vote-option" onclick="liveVote('+i+')"><div class="live-vote-bar" style="width:'+pct+'%"></div><span class="live-vote-label">'+(i+1)+'. '+_esc(opt)+'</span><span class="live-vote-pct">'+pct+'%</span></div>';
        });
        area.innerHTML = html+'</div>';
    }
    window.liveVote = function(idx) { if(!liveState.voteActive||!liveState.voteData) return; liveState.voteData.votes[idx]++; _renderVotePanel(); };

    // ========== 小游戏（AI动态生成题目）==========
    function _aiStartMiniGame(contact) {
        if (liveState.miniGameActive) return;
        var name = contact.remark||contact.name;
        var persona = contact.persona||contact.description||'';
        var cat = (contact.liveRoom&&contact.liveRoom.category)||'chat';
        // AI生成小游戏
        _liveAI(
            '你是主播"'+name+'"，人设：'+(persona||'活泼可爱')+'，直播分类：'+cat+'。\n请生成一个适合直播间互动的小游戏题目。\n必须严格按以下JSON格式返回（不要加其他文字）：\n{"type":"riddle或guess或trivia","q":"题目描述","answer":"正确答案（1-4个字）","hint":"提示（可选）"}\n游戏类型可以是：脑筋急转弯、猜谜语、知识问答、成语接龙、歌词填空等。要有趣好玩。',
            '生成小游戏',
            function(reply) {
                try {
                    var jsonStr = reply.match(/\{[\s\S]*\}/);
                    if (jsonStr) {
                        var game = JSON.parse(jsonStr[0]);
                        if (game.q && game.answer) {
                            _startMiniGameWithData(contact, name, game);
                            return;
                        }
                    }
                } catch(e) {}
                // fallback
                var num = String(1+Math.floor(Math.random()*10));
                _startMiniGameWithData(contact, name, {type:'guess',q:'猜数字！1-10之间，猜猜是几？',answer:num});
            },
            function() {
                var num = String(1+Math.floor(Math.random()*10));
                _startMiniGameWithData(contact, name, {type:'guess',q:'猜数字！1-10之间，猜猜是几？',answer:num});
            }
        );
    }
    function _startMiniGameWithData(contact, name, game) {
        liveState.miniGameActive = true;
        liveState.miniGameData = {type:game.type||'riddle',q:game.q,answer:game.answer,hint:game.hint||'',startTime:Date.now(),winner:null};
        _addDanmaku('host',name,'小游戏时间！'+game.q);
        _addDanmaku('game',null,game.q);
        _renderGamePanel();
        // 虚拟观众AI猜答案
        setTimeout(function(){
            if(!liveState.miniGameActive||!liveState.inRoom) return;
            var v=VIRTUAL_VIEWERS[Math.floor(Math.random()*VIRTUAL_VIEWERS.length)];
            _liveAI('直播间小游戏题目："'+game.q+'"，正确答案是"'+game.answer+'"。你是观众"'+v+'"，请故意猜一个错误答案，1-6个字，不要引号。','猜答案',
                function(r){ if(liveState.inRoom) _addDanmaku('virtual',v,r); },
                function(){ _addDanmaku('virtual',v,'嗯...不知道'); }
            );
        }, 3000+Math.random()*3000);
        liveState.miniGameTimer = setTimeout(function(){
            if (!liveState.miniGameActive) return;
            liveState.miniGameActive=false;
            _addDanmaku('game',null,'时间到！答案是：'+liveState.miniGameData.answer);
            // AI生成结束语
            _liveAI('你是主播"'+name+'"，人设：'+(contact.persona||contact.description||'活泼可爱')+'。小游戏"'+game.q+'"没人猜对，答案是"'+game.answer+'"。请说一句结束语，15字以内，口语化，不要引号。','说结束语',
                function(r){ _addDanmaku('host',name,r); },
                function(){ _addDanmaku('host',name,'没人猜对，下次加油~'); }
            );
            liveState.miniGameData=null; _renderGamePanel();
        }, 20000);
    }
    function _checkGameAnswer(text) {
        if (!liveState.miniGameData||liveState.miniGameData.winner) return;
        var answer = liveState.miniGameData.answer;
        var correct = false;
        if (liveState.miniGameData.type==='rps') { var m={'石头':'剪刀','剪刀':'布','布':'石头'}; correct=m[text]===answer; }
        else correct = text.includes(answer)||answer.includes(text);
        if (correct) {
            var userName = (store.personas&&store.personas[0]&&store.personas[0].name)||'我';
            liveState.miniGameData.winner = userName;
            liveState.miniGameActive = false;
            if (liveState.miniGameTimer) { clearTimeout(liveState.miniGameTimer); liveState.miniGameTimer=null; }
            _addDanmaku('game',null,userName+' 答对了！答案是：'+answer);
            if (liveState.roomContactId) _addFanExp(liveState.roomContactId,20);
            if (liveState.roomNpcId) _addNpcAffinity(liveState.roomNpcId,20);
            liveState.miniGameData=null; _renderGamePanel();
        }
    }
    function _renderGamePanel() {
        var area = document.getElementById('live-interactive-area');
        if (!area) return;
        if (!liveState.miniGameActive||!liveState.miniGameData) { if(!liveState.voteActive) area.innerHTML=''; return; }
        var gd = liveState.miniGameData;
        var remaining = Math.max(0,Math.ceil((gd.startTime+20000-Date.now())/1000));
        area.innerHTML = '<div class="live-game-panel"><div class="live-game-title">'+SVG.gamepad+' '+_esc(gd.q)+' <span style="color:#888;font-size:11px">'+remaining+'s</span></div><div class="live-game-hint">在弹幕中输入你的答案！</div></div>';
    }

    // ========== 红包雨 ==========
    window.liveRedPacketRain = function() {
        var room = document.querySelector('.live-room');
        if (!room) return;
        _addDanmaku('system',null,'红包雨来啦！快点击领取！');
        for (var i=0;i<15;i++) (function(i){
            setTimeout(function(){
                var el = document.createElement('div');
                el.className = 'live-redpacket';
                el.innerHTML = SVG.envelope;
                el.style.left = Math.random()*90+'%';
                el.style.animationDelay = Math.random()*0.5+'s';
                el.onclick = function(){ var coins=1+Math.floor(Math.random()*10); this.textContent='+'+coins; this.classList.add('grabbed'); if(liveState.roomContactId) _addFanExp(liveState.roomContactId,coins); if(liveState.roomNpcId) _addNpcAffinity(liveState.roomNpcId,coins); setTimeout(function(){el.remove();},800); };
                room.appendChild(el);
                setTimeout(function(){ if(el.parentNode) el.remove(); }, 4000);
            }, i*200);
        })(i);
    };

    // ========== 观众发起投票/小游戏请求（修复：支持NPC房间）==========
    window.liveRequestVote = function() {
        if (liveState.voteActive) { if(typeof toast==='function') toast('投票进行中~'); return; }
        if (liveState.miniGameActive) { if(typeof toast==='function') toast('小游戏进行中~'); return; }
        // 支持NPC房间和联系人房间
        var source = null;
        if (liveState.roomContactId) {
            source = (store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;});
        } else if (liveState.roomNpcId) {
            var npc = NPC_POOL.find(function(n){return n.id===liveState.roomNpcId;});
            if (npc) source = { name:npc.name, remark:npc.name, persona:npc.persona, description:npc.persona, liveRoom:{ category:npc.category } };
        }
        if (!source) return;
        _addDanmaku('user',(store.personas&&store.personas[0]&&store.personas[0].name)||'我','主播发起个投票吧~');
        setTimeout(function(){ if(liveState.inRoom) _aiStartVote(source); }, 1200);
    };
    window.liveRequestMiniGame = function() {
        if (liveState.miniGameActive) { if(typeof toast==='function') toast('小游戏进行中~'); return; }
        if (liveState.voteActive) { if(typeof toast==='function') toast('投票进行中~'); return; }
        // 支持NPC房间和联系人房间
        var source = null;
        if (liveState.roomContactId) {
            source = (store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;});
        } else if (liveState.roomNpcId) {
            var npc = NPC_POOL.find(function(n){return n.id===liveState.roomNpcId;});
            if (npc) source = { name:npc.name, remark:npc.name, persona:npc.persona, description:npc.persona, liveRoom:{ category:npc.category } };
        }
        if (!source) return;
        _addDanmaku('user',(store.personas&&store.personas[0]&&store.personas[0].name)||'我','来个小游戏吧！');
        setTimeout(function(){ if(liveState.inRoom) _aiStartMiniGame(source); }, 1200);
    };

    // ========== NPC资料卡（探秘式信息解锁）==========
    window.liveShowNpcProfile = function(npcId) {
        var npc = NPC_POOL.find(function(n){return n.id===npcId;});
        if (!npc) return;
        var rel = _getNpcRelation(npcId);
        var relLv = _getNpcRelLevel(npcId);
        var initial = npc.name[0]||'?';
        var thresholds = [0,50,150,300];
        var nextThreshold = npc.wechatThreshold||500;
        var pct = Math.min(100, Math.round(rel.affinity/nextThreshold*100));
        var html = '<div class="live-npc-profile-overlay" onclick="if(event.target===this)liveCloseNpcProfile()">';
        html += '<div class="live-npc-profile">';
        html += '<div class="live-npc-profile-header">';
        html += '<div class="live-npc-profile-close" onclick="liveCloseNpcProfile()">'+SVG.close+'</div>';
        html += '<div class="live-npc-avatar-big">'+initial+'</div>';
        html += '<div class="live-npc-profile-name">'+_esc(npc.name)+'</div>';
        html += '<div class="live-npc-profile-rel" style="color:'+relLv.color+'">'+relLv.name+'</div>';
        html += '<div class="live-npc-profile-bar"><div class="live-npc-profile-bar-fill" style="width:'+pct+'%"></div></div>';
        html += '<div class="live-npc-profile-bar-label">好感度 '+rel.affinity+' / '+nextThreshold+'</div>';
        html += '</div>';
        // 信息层级
        npc.infoLayers.forEach(function(layer, idx) {
            var unlocked = rel.unlockedLevel >= idx;
            var levelNames = ['基础信息','了解','熟悉','亲密'];
            html += '<div class="live-npc-info-section">';
            html += '<div class="live-npc-info-title">'+(unlocked?SVG.check:SVG.lock)+' '+levelNames[idx];
            if (!unlocked) html += ' <span style="color:#666;font-size:11px">(好感度'+thresholds[idx]+'解锁)</span>';
            html += '</div>';
            if (unlocked) {
                Object.keys(layer.data).forEach(function(key) {
                    html += '<div class="live-npc-info-row"><span class="live-npc-info-key">'+_esc(key)+'</span><span class="live-npc-info-val">'+_esc(layer.data[key])+'</span></div>';
                });
            } else {
                html += '<div class="live-npc-info-locked">???</div>';
            }
            html += '</div>';
        });
        // 底部按钮
        html += '<div class="live-npc-profile-actions">';
        html += '<div class="live-npc-action-btn" onclick="liveNpcPrivateChat(\''+npcId+'\')">'+SVG.chat+' 私聊</div>';
        if (rel.addedWechat) {
            html += '<div class="live-npc-action-btn live-npc-action-done">'+SVG.wechat+' 已加微信</div>';
        } else if (rel.affinity >= (npc.wechatThreshold||500)) {
            html += '<div class="live-npc-action-btn live-npc-action-wechat" onclick="liveNpcRequestWechat(\''+npcId+'\')">'+SVG.wechat+' 请求加微信</div>';
        } else {
            html += '<div class="live-npc-action-btn live-npc-action-disabled" title="好感度不足">'+SVG.lock+' 加微信 (好感度'+(npc.wechatThreshold||500)+')</div>';
        }
        html += '</div></div></div>';
        // 移除旧的
        var old = document.querySelector('.live-npc-profile-overlay');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', html);
    };
    window.liveCloseNpcProfile = function() {
        var el = document.querySelector('.live-npc-profile-overlay');
        if (el) el.remove();
    };

    // ========== NPC私聊 ==========
    window.liveNpcPrivateChat = function(npcId) {
        var npc = NPC_POOL.find(function(n){return n.id===npcId;});
        if (!npc) return;
        var rel = _getNpcRelation(npcId);
        var relLv = _getNpcRelLevel(npcId);
        liveCloseNpcProfile();
        var initial = npc.name[0]||'?';
        var html = '<div class="live-npc-chat-overlay" onclick="if(event.target===this)liveCloseNpcChat()">';
        html += '<div class="live-npc-chat">';
        html += '<div class="live-npc-chat-header"><div class="live-npc-avatar-sm">'+initial+'</div><span>'+_esc(npc.name)+'</span><span style="color:'+relLv.color+';font-size:12px;margin-left:8px">'+relLv.name+'</span>';
        html += '<div class="live-npc-chat-close" onclick="liveCloseNpcChat()">'+SVG.close+'</div></div>';
        html += '<div class="live-npc-chat-messages" id="live-npc-chat-messages">';
        (rel.privateChatHistory||[]).forEach(function(m) {
            if (m.role==='user') html += '<div class="live-npc-msg live-npc-msg-user"><div class="live-npc-msg-bubble">'+_esc(m.content)+'</div></div>';
            else html += '<div class="live-npc-msg live-npc-msg-npc"><div class="live-npc-msg-bubble">'+_esc(m.content)+'</div></div>';
        });
        html += '</div>';
        html += '<div class="live-npc-chat-input-bar"><input class="live-npc-chat-input" id="live-npc-chat-input" placeholder="说点什么..." onkeydown="if(event.key===\'Enter\'){liveNpcSendMsg(\''+npcId+'\');event.preventDefault();}"><div class="live-npc-chat-send" onclick="liveNpcSendMsg(\''+npcId+'\')">'+SVG.send+'</div></div>';
        html += '</div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
        var msgArea = document.getElementById('live-npc-chat-messages');
        if (msgArea) msgArea.scrollTop = msgArea.scrollHeight;
    };
    window.liveCloseNpcChat = function() { var el=document.querySelector('.live-npc-chat-overlay'); if(el) el.remove(); };
    window.liveNpcSendMsg = function(npcId) {
        var input = document.getElementById('live-npc-chat-input');
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        var npc = NPC_POOL.find(function(n){return n.id===npcId;});
        if (!npc) return;
        var rel = _getNpcRelation(npcId);
        rel.privateChatHistory = rel.privateChatHistory||[];
        rel.privateChatHistory.push({role:'user',content:text});
        _addNpcAffinity(npcId, 5);
        // 渲染用户消息
        var msgArea = document.getElementById('live-npc-chat-messages');
        if (msgArea) { msgArea.insertAdjacentHTML('beforeend','<div class="live-npc-msg live-npc-msg-user"><div class="live-npc-msg-bubble">'+_esc(text)+'</div></div>'); msgArea.scrollTop=msgArea.scrollHeight; }
        // NPC回复
        if (typeof API!=='undefined'&&API.chatCompletion) {
            var relLv = _getNpcRelLevel(npcId);
            var warmth = relLv.name==='陌生'?'礼貌但保持距离':relLv.name==='了解'?'友好':relLv.name==='熟悉'?'亲切温暖':'非常亲密温柔';
            var sysP = '你是"'+npc.name+'"，正在和一个粉丝私聊。\n【人设】：'+npc.persona+'\n【关系】：'+relLv.name+'（好感度'+rel.affinity+'）\n【语气要求】：'+warmth+'\n回复20-60字，自然口语化，不用引号，符合人设。';
            var msgs = [{role:'system',content:sysP}];
            var hist = rel.privateChatHistory.slice(-10);
            hist.forEach(function(m){ msgs.push({role:m.role==='user'?'user':'assistant',content:m.content}); });
            window._currentApiScene = 'live';
            API.chatCompletion(msgs).then(function(data){
                if (data&&data.reply) {
                    var reply = data.reply.replace(/^[""]|[""]$/g,'').trim();
                    rel.privateChatHistory.push({role:'assistant',content:reply});
                    if (typeof save==='function') save();
                    var ma = document.getElementById('live-npc-chat-messages');
                    if (ma) { ma.insertAdjacentHTML('beforeend','<div class="live-npc-msg live-npc-msg-npc"><div class="live-npc-msg-bubble">'+_esc(reply)+'</div></div>'); ma.scrollTop=ma.scrollHeight; }
                }
            }).catch(function(){});
        } else {
            // fallback也尝试用AI
            var relLvFb = _getNpcRelLevel(npcId);
            _liveAI('你是"'+npc.name+'"，人设：'+npc.persona+'。关系：'+relLvFb.name+'。用一句话回复私聊，10-20字，口语化，不要引号。','回复："'+text+'"',
                function(aiReply) {
                    rel.privateChatHistory.push({role:'assistant',content:aiReply});
                    if (typeof save==='function') save();
                    var ma=document.getElementById('live-npc-chat-messages');
                    if(ma){ma.insertAdjacentHTML('beforeend','<div class="live-npc-msg live-npc-msg-npc"><div class="live-npc-msg-bubble">'+_esc(aiReply)+'</div></div>');ma.scrollTop=ma.scrollHeight;}
                },
                function() {
                    var reply = '嗯嗯~';
                    rel.privateChatHistory.push({role:'assistant',content:reply});
                    if (typeof save==='function') save();
                    setTimeout(function(){ var ma=document.getElementById('live-npc-chat-messages'); if(ma){ma.insertAdjacentHTML('beforeend','<div class="live-npc-msg live-npc-msg-npc"><div class="live-npc-msg-bubble">'+_esc(reply)+'</div></div>');ma.scrollTop=ma.scrollHeight;} },800);
                }
            );
        }
    };

    // ========== NPC加微信 ==========
    window.liveNpcRequestWechat = function(npcId) {
        var npc = NPC_POOL.find(function(n){return n.id===npcId;});
        if (!npc) return;
        var rel = _getNpcRelation(npcId);
        if (rel.addedWechat) { if(typeof toast==='function') toast('已经是微信好友了'); return; }
        if (rel.affinity < (npc.wechatThreshold||500)) { if(typeof toast==='function') toast('好感度不足'); return; }
        var accept = Math.random() < (npc.wechatAcceptRate||0.5);
        if (accept) {
            rel.addedWechat = true;
            if (typeof save==='function') save();
            // 添加到微信联系人
            if (store.contacts) {
                var exists = store.contacts.find(function(c){return c.id===npcId;});
                if (!exists) {
                    var wechatId = '';
                    npc.infoLayers.forEach(function(l){ if(l.data&&l.data['微信号']) wechatId=l.data['微信号']; });
                    store.contacts.push({
                        id: npcId, name: npc.name, remark: npc.name,
                        persona: npc.persona, description: npc.persona,
                        avatar: '', lastMsg: '我们已经是好友了~',
                        lastMsgTime: Date.now(), unread: 1,
                        wechatId: wechatId, isNpc: true,
                        chatHistory: [{role:'assistant',content:'你好呀~我们终于加上微信了，以后可以经常聊天了'}]
                    });
                    if (typeof save==='function') save();
                }
            }
            liveCloseNpcProfile();
            if (typeof toast==='function') toast(npc.name+'同意了你的好友请求！');
            // 刷新资料卡
            setTimeout(function(){ liveShowNpcProfile(npcId); }, 300);
        } else {
            if (typeof toast==='function') toast(npc.name+'：再了解一下彼此吧~');
        }
    };

    // ========== 用户开播 ==========
    window.liveUserStartStream = function() {
        var contacts = (store.contacts||[]).filter(function(c){return !c.isGroup;});
        if (contacts.length===0) { if(typeof toast==='function') toast('还没有联系人哦~'); return; }
        var html = '<div class="live-stream-setup" onclick="if(event.target===this)liveCloseSetup()">';
        html += '<div class="live-stream-setup-panel"><div class="live-setup-title">开始直播</div>';
        html += '<div class="live-setup-field"><div class="live-setup-label">直播标题</div><input class="live-setup-input" id="live-setup-title" placeholder="给直播起个名字吧~"></div>';
        html += '<div class="live-setup-field"><div class="live-setup-label">直播类型</div><div class="live-setup-types">';
        html += '<div class="live-setup-type active" onclick="liveSetupType(this,\'chat\')">'+SVG.chat+'<span>聊天</span></div>';
        html += '<div class="live-setup-type" onclick="liveSetupType(this,\'game\')">'+SVG.gamepad+'<span>游戏</span></div>';
        html += '<div class="live-setup-type" onclick="liveSetupType(this,\'music\')">'+SVG.music+'<span>音乐</span></div>';
        html += '<div class="live-setup-type" onclick="liveSetupType(this,\'story\')">'+SVG.book+'<span>故事</span></div>';
        html += '</div></div>';
        html += '<div class="live-setup-field"><div class="live-setup-label">邀请联系人连麦（可选，最多3人）</div><div class="live-setup-contacts" id="live-setup-contacts"></div></div>';
        html += '<button class="live-setup-go-btn" onclick="liveGoLive()">'+SVG.live+' 开始直播</button>';
        html += '<button class="live-setup-cancel" onclick="liveCloseSetup()">取消</button>';
        html += '</div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
        liveState.userStreamType = 'chat'; liveState.userStreamTitle = ''; liveState.userStreamInvited = [];
        var listEl = document.getElementById('live-setup-contacts');
        if (listEl) {
            var cHtml = '';
            contacts.slice(0,20).forEach(function(c){
                var av = c.avatar||(window._ph?window._ph(24):'');
                cHtml += '<div class="live-setup-contact" data-id="'+c.id+'" onclick="liveToggleInvite(this,\''+c.id+'\')">';
                cHtml += '<img src="'+av+'" onerror="this.src=\''+(window._ph?window._ph(24):'')+'\'">';
                cHtml += '<span>'+_esc(c.remark||c.name)+'</span></div>';
            });
            listEl.innerHTML = cHtml;
        }
    };
    window.liveSetupType = function(el,type) { liveState.userStreamType=type; document.querySelectorAll('.live-setup-type').forEach(function(e){e.classList.remove('active');}); el.classList.add('active'); };
    window.liveToggleInvite = function(el,cid) {
        var idx = liveState.userStreamInvited.indexOf(cid);
        if (idx>=0) { liveState.userStreamInvited.splice(idx,1); el.classList.remove('selected'); }
        else { if(liveState.userStreamInvited.length>=3){if(typeof toast==='function') toast('最多邀请3人');return;} liveState.userStreamInvited.push(cid); el.classList.add('selected'); }
    };
    window.liveGoLive = function() {
        var titleInput = document.getElementById('live-setup-title');
        liveState.userStreamTitle = titleInput?titleInput.value.trim():'';
        // 如果没输入标题，AI生成一个
        if (!liveState.userStreamTitle) {
            var userName = (store.personas&&store.personas[0]&&store.personas[0].name)||'我';
            liveState.userStreamTitle = userName+'的直播间';
            _liveAI('请为"'+userName+'"的'+LIVE_CATEGORIES[liveState.userStreamType]+'直播生成一个有趣的标题，8-15字，不要引号。','生成标题',
                function(r){ liveState.userStreamTitle=r; var el=document.querySelector('.live-room-host-sub'); if(el) el.textContent=r; }, null);
        }
        liveCloseSetup();
        liveState.inRoom=true; liveState.roomContactId=null; liveState.roomNpcId=null; liveState.roomMode='user_host';
        liveState.roomDanmakuList=[]; liveState.roomConversationHistory=[];
        liveState.viewerCount=5+Math.floor(Math.random()*30); liveState.likeCount=0;
        liveState.giftPanelOpen=false; liveState.decorPanelOpen=false; liveState.rankPanelOpen=false; liveState.atmosphere='none';
        try { _renderUserHostRoom(); var container=document.getElementById('live-room-content'); if(!container||!container.innerHTML||container.innerHTML.trim()==='') throw new Error('empty'); }
        catch(e) { liveState.inRoom=false; if(typeof toast==='function') toast('直播间加载失败'); return; }
        requestAnimationFrame(function(){ document.getElementById('layer-live-room').classList.add('show'); });
        _startVirtualViewers();
        _startHeatTracking();
        _startUserHostAIViewers();
        if (liveState.userStreamInvited.length>0) _startInvitedGuests();
        liveState._viewerTimer = setInterval(function(){ liveState.viewerCount+=Math.floor(Math.random()*5)-1; if(liveState.viewerCount<3) liveState.viewerCount=3; var el=document.getElementById('live-room-viewer-count'); if(el) el.textContent=liveState.viewerCount; }, 10000);
        _addDanmaku('system',null,'直播已开始，快和大家打个招呼吧~');
    };
    function _renderUserHostRoom() {
        var container = document.getElementById('live-room-content');
        if (!container) return;
        var userName = (store.personas&&store.personas[0]&&store.personas[0].name)||'我';
        var userAvatar = (store.personas&&store.personas[0]&&store.personas[0].avatar)||(window._ph?window._ph(56):'');
        var title = liveState.userStreamTitle||userName+'的直播间';
        container.innerHTML = '<div class="live-room"><div class="live-room-bg-default" style="background:#1a1a1a"></div>'
            +'<div class="live-atmosphere-layer" id="live-atmosphere-layer"></div>'
            +'<div class="live-super-danmaku-layer" id="live-super-danmaku-layer"></div>'
            +'<div class="live-room-header"><div class="live-room-host-info">'
            +'<img class="live-room-host-avatar" src="'+userAvatar+'" onerror="this.src=\''+(window._ph?window._ph(56):'')+'\'">'
            +'<div><div class="live-room-host-name">'+_esc(userName)+'</div>'
            +'<div class="live-room-host-sub">'+_esc(title)+'</div></div></div>'
            +'<div style="display:flex;align-items:center;gap:8px;">'
            +'<div class="live-room-viewers">'+SVG.eye+' <span id="live-room-viewer-count">'+liveState.viewerCount+'</span></div>'
            +'<div class="live-room-close" onclick="liveExitRoom()">'+SVG.close+'</div></div></div>'
            +'<div class="live-danmaku-area" id="live-danmaku-area"></div>'
            +'<div id="live-interactive-area"></div>'
            +'<div class="live-combo-area" id="live-combo-area"></div>'
            +'<div class="live-room-toolbar">'
            +'<input class="live-room-input" id="live-danmaku-input" placeholder="说点什么..." onkeydown="if(event.key===\'Enter\'){liveSendUserHostMsg();event.preventDefault();}">'
            +_svgBtn('send',{onclick:'liveSendUserHostMsg()',title:'发送'})
            +_svgBtn('heart',{onclick:'liveLike()',title:'点赞',color:'#ff4d6a'})
            +_svgBtn('envelope',{onclick:'liveRedPacketRain()',title:'红包雨',color:'#ff4444'})
            +_svgBtn('info',{onclick:'liveShowStats()',title:'数据统计',color:'#5bf'})
            +'</div><div class="live-gift-panel" id="live-gift-panel"></div></div>';
        _renderDanmaku();
    }
    window.liveSendUserHostMsg = function() {
        var input = document.getElementById('live-danmaku-input');
        if (!input) return;
        var text = input.value.trim(); if (!text) return;
        input.value = '';
        var userName = (store.personas&&store.personas[0]&&store.personas[0].name)||'我';
        _addDanmaku('host',userName,text);
        _triggerUserHostInteraction(text,userName);
    };
    function _triggerUserHostInteraction(userMsg,userName) {
        if (!liveState.inRoom||liveState.roomMode!=='user_host') return;
        if (liveState.userStreamInvited&&liveState.userStreamInvited.length>0) {
            var respondCount = Math.random()>0.5?Math.min(2,liveState.userStreamInvited.length):1;
            var shuffled = liveState.userStreamInvited.slice().sort(function(){return Math.random()-0.5;});
            shuffled.slice(0,respondCount).forEach(function(cid,i){
                var c = (store.contacts||[]).find(function(x){return x.id===cid;});
                if (!c) return;
                var delay = 1500+i*1200+Math.random()*2000;
                setTimeout(function(){
                    if (!liveState.inRoom) return;
                    if (typeof API!=='undefined'&&API.chatCompletion) {
                        var persona = c.persona||c.description||'';
                        var sysP = '你是"'+c.name+'"，在"'+userName+'"直播间连麦。人设：'+(persona||'友好热情')+'。主播说了："'+userMsg+'"，自然回应，15-40字，口语化，不用引号。';
                        window._currentApiScene = 'live';
                        API.chatCompletion([{role:'system',content:sysP},{role:'user',content:'请回应'}]).then(function(data){
                            if (data&&data.reply&&liveState.inRoom) _addDanmaku('user',c.remark||c.name,data.reply.replace(/^[""]|[""]$/g,'').trim());
                        }).catch(function(){
                            _liveAI('你是"'+c.name+'"，在连麦中。用3-8个字回应。不要引号。','回应',
                                function(r){ _addDanmaku('user',c.remark||c.name,r); },
                                function(){ _addDanmaku('user',c.remark||c.name,'说得对~'); }
                            );
                        });
                    } else {
                        _liveAI('你是"'+c.name+'"，在连麦中。人设：'+(c.persona||c.description||'友好')+'。主播说了："'+userMsg+'"，用一句话回应，10-25字，口语化，不要引号。','回应',
                            function(r){ _addDanmaku('user',c.remark||c.name,r); },
                            function(){ _addDanmaku('user',c.remark||c.name,'说得对~'); }
                        );
                    }
                }, delay);
            });
        }
        var vc = 1+Math.floor(Math.random()*3);
        for (var i=0;i<vc;i++) (function(i){
            setTimeout(function(){
                if(!liveState.inRoom) return;
                var v=VIRTUAL_VIEWERS[Math.floor(Math.random()*VIRTUAL_VIEWERS.length)];
                _liveAI('你是直播间观众"'+v+'"。主播说了："'+userMsg+'"。用1-8个字回应，像真实观众一样。不要引号。','回应',
                    function(r){ _addDanmaku('virtual',v,r); },
                    function(){ _addDanmaku('virtual',v,'666'); }
                );
            }, 800+i*1000+Math.random()*2000);
        })(i);
    }
    // ========== 用户开播：AI观众主动提问互动 ==========
    function _startUserHostAIViewers() {
        var _aiViewerTimer = setInterval(function(){
            if (!liveState.inRoom || liveState.roomMode!=='user_host') { clearInterval(_aiViewerTimer); return; }
            if (Math.random() > 0.4) return;
            var viewer = VIRTUAL_VIEWERS[Math.floor(Math.random()*VIRTUAL_VIEWERS.length)];
            var userName = (store.personas&&store.personas[0]&&store.personas[0].name)||'主播';
            var recentCtx = _getRecentContext(5);
            var streamType = LIVE_CATEGORIES[liveState.userStreamType]||'聊天';
            _liveAI(
                '你是直播间观众"'+viewer+'"。主播"'+userName+'"正在做'+streamType+'直播。\n最近弹幕：\n'+recentCtx+'\n请以观众身份向主播提一个问题或发一条互动弹幕，5-20字。要有趣、能引发主播回应。可以是：提问、分享、请求、吐槽等。不要引号。',
                '发一条互动弹幕',
                function(reply) { if (liveState.inRoom) _addDanmaku('virtual',viewer,reply); },
                function() {
                    var qs = ['主播今天吃了什么呀？','主播多大了？','主播平时有什么爱好？','第一次来，主播好~','主播唱首歌吧！'];
                    _addDanmaku('virtual',viewer,qs[Math.floor(Math.random()*qs.length)]);
                }
            );
        }, 8000+Math.random()*7000);
    }
    // ========== 连麦嘉宾间互动（修复定时器泄漏）==========
    function _startInvitedGuests() {
        if (!liveState._guestTimers) liveState._guestTimers = [];
        var guestNames = [];
        liveState.userStreamInvited.forEach(function(cid){
            var c = (store.contacts||[]).find(function(x){return x.id===cid;});
            if (!c) return;
            guestNames.push(c.remark||c.name);
            setTimeout(function(){ if(!liveState.inRoom) return; _addDanmaku('system',null,(c.remark||c.name)+' 加入了连麦'); }, 2000+Math.random()*2000);
            var guestTimer = setInterval(function(){
                if (!liveState.inRoom) { clearInterval(guestTimer); return; }
                var persona = c.persona||c.description||'';
                var recentCtx = _getRecentContext(4);
                var otherGuests = guestNames.filter(function(n){ return n!==(c.remark||c.name); });
                var guestInfo = otherGuests.length>0 ? '其他连麦嘉宾：'+otherGuests.join('、')+'。你可以和他们互动。' : '';
                _liveAI(
                    '你是"'+(c.remark||c.name)+'"，正在别人直播间连麦。人设：'+(persona||'友好')+'。'+guestInfo+'\n最近弹幕：\n'+recentCtx+'\n请根据上下文说一句话，15-40字，口语化，不要引号，可以回应主播、其他嘉宾或观众。',
                    '请说一句',
                    function(r){ if(liveState.inRoom) _addDanmaku('user',c.remark||c.name,r); },
                    function(){ _addDanmaku('user',c.remark||c.name,'大家好~'); }
                );
            }, 10000+Math.random()*10000);
            liveState._guestTimers.push(guestTimer); // 存储引用以便退出时清理
        });
    }
    window.liveCloseSetup = function() { var s=document.querySelector('.live-stream-setup'); if(s) s.remove(); };

    // ========== 回放 ==========
    window.liveViewReplay = function(idx) {
        _ensureLiveStore();
        var h = store.liveHistory[idx]; if (!h) return;
        var container = document.getElementById('live-room-content'); if (!container) return;
        var date = new Date(h.time);
        var dateStr = (date.getMonth()+1)+'/'+date.getDate()+' '+date.getHours()+':'+String(date.getMinutes()).padStart(2,'0');
        var html = '<div class="live-room"><div class="live-room-bg-default" style="background:#1a1a1a"></div>';
        html += '<div class="live-replay-bar">'+SVG.play+' 回放中 · '+_esc(h.hostName||'')+' · '+dateStr+'</div>';
        html += '<div class="live-room-header" style="top:28px"><div class="live-room-host-info"><div><div class="live-room-host-name">'+_esc(h.hostName||'未知')+'</div>';
        html += '<div class="live-room-host-sub">'+_esc(h.title||'直播回放')+'</div></div></div>';
        html += '<div class="live-room-close" onclick="liveExitReplay()">'+SVG.close+'</div></div>';
        html += '<div class="live-danmaku-area" id="live-danmaku-area" style="bottom:20px;top:90px;">';
        (h.danmaku||[]).forEach(function(d){
            if (d.type==='system') html += '<div class="live-danmaku-item live-danmaku-system">'+_esc(d.text)+'</div>';
            else if (d.type==='gift') html += '<div class="live-danmaku-item live-danmaku-system" style="color:#c0a040;">'+SVG.gift+' '+_esc(d.text)+'</div>';
            else { var cls=d.type==='host'?'live-danmaku-host':d.type==='user'?'live-danmaku-user':'live-danmaku-virtual'; html += '<div class="live-danmaku-item '+cls+'"><span class="live-danmaku-name">'+_esc(d.name||'')+':</span><span class="live-danmaku-text">'+_esc(d.text)+'</span></div>'; }
        });
        html += '</div></div>';
        container.innerHTML = html;
        requestAnimationFrame(function(){ document.getElementById('layer-live-room').classList.add('show'); });
        var area = document.getElementById('live-danmaku-area'); if(area) area.scrollTop=area.scrollHeight;
    };
    window.liveExitReplay = function() { document.getElementById('layer-live-room').classList.remove('show'); var c=document.getElementById('live-room-content'); if(c) c.innerHTML=''; };

    // ========== 刷新广场（增强：旋转动画+清缓存）==========
    window.liveRefreshPlaza = function() {
        // 刷新按钮旋转动画
        var icon = document.getElementById('live-refresh-icon');
        if (icon) { icon.classList.add('fa-spin'); setTimeout(function(){ icon.classList.remove('fa-spin'); }, 1500); }
        // 清除NPC标题/状态缓存，强制重新API生成
        _npcTitleCache = {};
        _npcStatusCache = {};
        _npcViewerCache = {};
        refreshLiveStreams(); renderLivePlaza();
        if (typeof toast==='function') toast('正在刷新直播列表...');
    };

    // ========== 退出直播间 ==========
    window.liveExitRoom = function() {
        if (liveState.roomDanmakuList.length>3) {
            _ensureLiveStore();
            var c = liveState.roomContactId?(store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;}):null;
            var npc = liveState.roomNpcId?NPC_POOL.find(function(n){return n.id===liveState.roomNpcId;}):null;
            var userName = (store.personas&&store.personas[0]&&store.personas[0].name)||'我';
            store.liveHistory.push({
                time:Date.now(),
                hostName:c?(c.remark||c.name):npc?npc.name:userName,
                title:c?(c.liveRoom&&c.liveRoom.title||''):npc?(npc.name+'的直播间'):(liveState.userStreamTitle||''),
                viewers:liveState.viewerCount, likes:liveState.likeCount,
                danmakuCount:liveState.roomDanmakuList.length,
                danmaku:liveState.roomDanmakuList.slice(-80),
                mode:liveState.roomMode
            });
            if (store.liveHistory.length>20) store.liveHistory=store.liveHistory.slice(-20);
            if (typeof save==='function') save();
            // 异步生成回放摘要
            _generateReplaySummary(store.liveHistory[store.liveHistory.length-1]);
        }
        liveState.inRoom=false; liveState.roomContactId=null; liveState.roomNpcId=null;
        liveState.roomDanmakuList=[]; liveState.roomConversationHistory=[];
        liveState.aiSpeaking=false; liveState._lastAISpeakAt=0;
        liveState.voteActive=false; liveState.voteData=null;
        liveState.miniGameActive=false; liveState.miniGameData=null;
        liveState.superDanmakuQueue=[]; liveState.superDanmakuShowing=false;
        liveState.hostActivity='';
        // 先清combo timer再重置combo对象
        if (liveState.giftCombo && liveState.giftCombo.timer) clearTimeout(liveState.giftCombo.timer);
        liveState.giftCombo={gift:null,count:0,timer:null,sender:''};
        if (liveState.aiSpeakTimer) { clearInterval(liveState.aiSpeakTimer); liveState.aiSpeakTimer=null; }
        if (liveState.virtualViewerTimer) { clearInterval(liveState.virtualViewerTimer); liveState.virtualViewerTimer=null; }
        if (liveState._viewerTimer) { clearInterval(liveState._viewerTimer); liveState._viewerTimer=null; }
        if (liveState.fanExpTimer) { clearInterval(liveState.fanExpTimer); liveState.fanExpTimer=null; }
        if (liveState.atmosphereTimer) { clearInterval(liveState.atmosphereTimer); liveState.atmosphereTimer=null; }
        if (liveState.hostActivityTimer) { clearInterval(liveState.hostActivityTimer); liveState.hostActivityTimer=null; }
        if (liveState.heat.heatTimer) { clearInterval(liveState.heat.heatTimer); liveState.heat.heatTimer=null; }
        if (liveState.voteTimer) { clearTimeout(liveState.voteTimer); liveState.voteTimer=null; }
        if (liveState.miniGameTimer) { clearTimeout(liveState.miniGameTimer); liveState.miniGameTimer=null; }
        // 清理连麦嘉宾定时器
        if (liveState._guestTimers) {
            liveState._guestTimers.forEach(function(t){ clearInterval(t); });
            liveState._guestTimers = [];
        }
        var atmoLayer = document.getElementById('live-atmosphere-layer'); if(atmoLayer) atmoLayer.innerHTML='';
        document.getElementById('layer-live-room').classList.remove('show');
        var container = document.getElementById('live-room-content'); if(container) container.innerHTML='';
        refreshLiveStreams(); renderLivePlaza();
    };

    // ========== 里程碑事件系统 ==========
    function _checkMilestone() {
        if (!liveState.inRoom) return;
        var host = _getHostInfo();
        if (!host) return;
        // NPC里程碑
        if (liveState.roomNpcId) {
            var rel = _getNpcRelation(liveState.roomNpcId);
            var npc = NPC_POOL.find(function(n){return n.id===liveState.roomNpcId;});
            if (!npc) return;
            var milestones = [
                { key:'npc_'+npc.id+'_50', threshold:50, event:'了解' },
                { key:'npc_'+npc.id+'_150', threshold:150, event:'熟悉' },
                { key:'npc_'+npc.id+'_300', threshold:300, event:'亲密' },
            ];
            milestones.forEach(function(m) {
                if (rel.affinity >= m.threshold && !liveState.milestoneChecked[m.key]) {
                    liveState.milestoneChecked[m.key] = true;
                    // AI生成里程碑事件
                    _liveAI(
                        '你是主播"'+npc.name+'"，人设：'+npc.persona+'。你和一位观众的关系刚刚升级到"'+m.event+'"。请用一句话表达你的感受，20-40字，要有情感，符合人设，不要引号。',
                        '表达关系升级的感受',
                        function(reply) {
                            _addDanmaku('system',null,'🎉 与'+npc.name+'的关系升级为【'+m.event+'】！');
                            setTimeout(function(){ if(liveState.inRoom) _addDanmaku('host',npc.name,reply); }, 1500);
                        },
                        function() { _addDanmaku('system',null,'🎉 与'+npc.name+'的关系升级为【'+m.event+'】！'); }
                    );
                }
            });
        }
        // 联系人粉丝等级里程碑
        if (liveState.roomContactId) {
            var fan = _getFanData(liveState.roomContactId);
            var fanLv = _getFanLevel(fan.exp||0);
            var c = (store.contacts||[]).find(function(x){return x.id===liveState.roomContactId;});
            if (!c) return;
            var fKey = 'fan_'+liveState.roomContactId+'_lv'+fanLv.level;
            if (fanLv.level >= 2 && !liveState.milestoneChecked[fKey]) {
                liveState.milestoneChecked[fKey] = true;
                _addDanmaku('system',null,'🎉 恭喜升级为 '+fanLv.name+'(Lv'+fanLv.level+')！');
                _liveAI(
                    '你是主播"'+(c.remark||c.name)+'"，人设：'+(c.persona||c.description||'活泼可爱')+'。一位粉丝刚升级到"'+fanLv.name+'"(Lv'+fanLv.level+')。请用一句话祝贺，15-30字，热情，不要引号。',
                    '祝贺粉丝升级',
                    function(reply) { setTimeout(function(){ if(liveState.inRoom) _addDanmaku('host',c.remark||c.name,reply); }, 1500); },
                    null
                );
            }
        }
    }

    // ========== 直播回放AI摘要 ==========
    function _generateReplaySummary(historyEntry) {
        if (!historyEntry || !historyEntry.danmaku || historyEntry.danmaku.length < 5) return;
        var danmakuText = historyEntry.danmaku.slice(-30).map(function(d){
            if (d.type==='system'||d.type==='gift') return '['+d.type+'] '+d.text;
            return (d.name||'')+'：'+d.text;
        }).join('\n');
        _liveAI(
            '请为以下直播回放生成一段简短的精彩摘要（50-100字）。包含：直播亮点、互动情况、氛围描述。不要引号。\n主播：'+historyEntry.hostName+'\n观众数：'+historyEntry.viewers+'\n弹幕数：'+historyEntry.danmakuCount+'\n弹幕内容：\n'+danmakuText,
            '生成直播摘要',
            function(reply) {
                historyEntry.summary = reply;
                if (typeof save==='function') save();
            }, null
        );
    }

    // ========== NPC动态生成（持久化修复）==========
    // [FIX-新主播生成v2] 简化JSON prompt + 增加重试 + 增加错误日志 + 补全缺失字段
    window.liveGenerateNewNpc = function() {
        if (typeof toast==='function') toast('正在生成新主播...');
        // [FIX-新主播生成v2] 大幅简化JSON结构，减少必填字段
        // 之前要求过于复杂的嵌套JSON(infoLayers/liveActions等)，小模型难以一次性输出正确格式
        var simplifiedPrompt = '请生成一个全新的直播间NPC主播角色。必须严格按以下JSON格式返回（不要加任何其他文字）：\n'
            + '{"name":"中文名2-3字","gender":"male或female","category":"chat或game或music或daily或story","persona":"30-60字人设描述，含性格和说话风格"}\n'
            + '要求：角色有特色，不要和已有NPC重复。已有NPC：'+NPC_POOL.map(function(n){return n.name;}).join('、');

        function _tryParseNpc(reply) {
            try {
                var jsonStr = reply.match(/\{[\s\S]*\}/);
                if (jsonStr) {
                    var npc = JSON.parse(jsonStr[0]);
                    if (npc.name && npc.persona) {
                        // 补全缺失字段（简化prompt后可能缺少的字段）
                        if (!npc.id) npc.id = 'npc_' + Date.now() + '_' + Math.floor(Math.random()*1000);
                        if (!npc.gender) npc.gender = Math.random() > 0.5 ? 'female' : 'male';
                        if (!npc.category) npc.category = ['chat','game','music','daily','story'][Math.floor(Math.random()*5)];
                        if (!npc.infoLayers) {
                            npc.infoLayers = [
                                {level:0, data:{'年龄': Math.floor(18+Math.random()*12)+'岁', '城市':'未知', '爱好':'直播'}},
                                {level:1, data:{'特长':'待发现'}},
                                {level:2, data:{'梦想':'成为人气主播'}},
                                {level:3, data:{'心里话':'谢谢关注我~'}}
                            ];
                        }
                        if (!npc.liveActions) npc.liveActions = ['正在直播','和观众聊天','看弹幕','唱歌','玩游戏'];
                        if (!npc.wechatThreshold) npc.wechatThreshold = 500;
                        if (!npc.wechatAcceptRate) npc.wechatAcceptRate = 0.7;
                        // 确保id唯一
                        if (NPC_POOL.find(function(n){return n.id===npc.id;})) npc.id = 'npc_'+Date.now();
                        return npc;
                    }
                }
            } catch(e) {
                console.error('[live] NPC JSON解析失败:', e.message, '原始回复:', reply.substring(0, 300));
            }
            return null;
        }

        function _onNpcSuccess(npc) {
            NPC_POOL.push(npc);
            _ensureLiveStore();
            if (!store.customNpcs) store.customNpcs = [];
            store.customNpcs.push(npc);
            if (typeof save==='function') save();
            if (typeof toast==='function') toast('🎉 新主播 '+npc.name+' 已上线！');
            refreshLiveStreams();
            renderLivePlaza();
        }

        _liveAI(
            simplifiedPrompt,
            '生成新NPC',
            function(reply) {
                var npc = _tryParseNpc(reply);
                if (npc) {
                    _onNpcSuccess(npc);
                    return;
                }
                // [FIX-新主播生成v2] 首次解析失败，自动重试一次（可能是模型输出了多余文字）
                console.warn('[live] 首次NPC生成解析失败，尝试重试...');
                if (typeof toast==='function') toast('格式解析失败，正在重试...');
                _liveAI(
                    '请只返回一个JSON对象，不要加任何其他文字。格式：{"name":"名字","gender":"female","category":"chat","persona":"人设描述"}',
                    '重新生成',
                    function(reply2) {
                        var npc2 = _tryParseNpc(reply2);
                        if (npc2) { _onNpcSuccess(npc2); }
                        else { if (typeof toast==='function') toast('生成失败，请重试'); }
                    },
                    function() { if (typeof toast==='function') toast('生成失败，请重试'); }
                );
            },
            function() {
                if (typeof API==='undefined' || !API.chatCompletion) {
                    if (typeof toast==='function') toast('请先配置API密钥（设置→API配置）');
                } else {
                    if (typeof toast==='function') toast('API调用失败，请检查网络或API配置');
                }
            }
        );
    };

    // ========== 关注系统 ==========
    window.liveToggleFollow = function(npcId) {
        _ensureLiveStore();
        if (!store.liveFollowed) store.liveFollowed = [];
        var idx = store.liveFollowed.indexOf(npcId);
        if (idx >= 0) {
            store.liveFollowed.splice(idx, 1);
            if (typeof toast==='function') toast('已取消关注');
        } else {
            store.liveFollowed.push(npcId);
            var npc = NPC_POOL.find(function(n){return n.id===npcId;});
            if (typeof toast==='function') toast('已关注 '+(npc?npc.name:'主播')+'！开播时会优先显示');
        }
        if (typeof save==='function') save();
        // 更新关注按钮颜色
        if (liveState.inRoom && liveState.roomNpcId) {
            var npc = NPC_POOL.find(function(n){return n.id===liveState.roomNpcId;});
            if (npc) _renderNpcRoom(npc);
        }
    };

    // ========== 用户开播数据统计面板 ==========
    window.liveShowStats = function() {
        if (!liveState.inRoom) return;
        var duration = Math.round((Date.now()-liveState.watchStartTime)/60000);
        var danmakuCount = liveState.roomDanmakuList.length;
        var hostMsgs = liveState.roomDanmakuList.filter(function(d){return d.type==='host';}).length;
        var userMsgs = liveState.roomDanmakuList.filter(function(d){return d.type==='user';}).length;
        var virtualMsgs = liveState.roomDanmakuList.filter(function(d){return d.type==='virtual';}).length;
        var giftMsgs = liveState.roomDanmakuList.filter(function(d){return d.type==='gift';}).length;
        var heatInfo = _getHeatDesc();
        var html = '<div class="live-npc-profile-overlay" onclick="if(event.target===this)this.remove()">';
        html += '<div class="live-npc-profile" style="max-height:60vh">';
        html += '<div class="live-npc-profile-header" style="padding-bottom:12px">';
        html += '<div class="live-npc-profile-close" onclick="this.closest(\'.live-npc-profile-overlay\').remove()">'+SVG.close+'</div>';
        html += '<div style="font-size:18px;font-weight:600;color:#f0f0f0;margin-bottom:4px">📊 直播数据</div>';
        html += '<div style="color:#888;font-size:12px">'+heatInfo+'</div>';
        html += '</div>';
        html += '<div class="live-npc-info-section">';
        html += '<div class="live-npc-info-row"><span class="live-npc-info-key">直播时长</span><span class="live-npc-info-val">'+duration+' 分钟</span></div>';
        html += '<div class="live-npc-info-row"><span class="live-npc-info-key">观众峰值</span><span class="live-npc-info-val">'+liveState.viewerCount+'</span></div>';
        html += '<div class="live-npc-info-row"><span class="live-npc-info-key">点赞数</span><span class="live-npc-info-val">'+liveState.likeCount+'</span></div>';
        html += '<div class="live-npc-info-row"><span class="live-npc-info-key">总弹幕</span><span class="live-npc-info-val">'+danmakuCount+'</span></div>';
        html += '<div class="live-npc-info-row"><span class="live-npc-info-key">主播发言</span><span class="live-npc-info-val">'+hostMsgs+'</span></div>';
        html += '<div class="live-npc-info-row"><span class="live-npc-info-key">观众互动</span><span class="live-npc-info-val">'+(userMsgs+virtualMsgs)+'</span></div>';
        html += '<div class="live-npc-info-row"><span class="live-npc-info-key">礼物数</span><span class="live-npc-info-val">'+giftMsgs+'</span></div>';
        html += '<div class="live-npc-info-row"><span class="live-npc-info-key">互动率</span><span class="live-npc-info-val">'+(danmakuCount>0?Math.round((userMsgs+virtualMsgs)/danmakuCount*100):0)+'%</span></div>';
        html += '</div></div></div>';
        var old = document.querySelector('.live-npc-profile-overlay');
        if (old) old.remove();
        document.body.insertAdjacentHTML('beforeend', html);
    };

    // ============================================
    // 充值系统 - RECHARGE SYSTEM
    // 完整的金币充值流程：充值面板 → 支付确认 → 到账动画
    // ============================================

    // 打开充值面板
    window.liveOpenRecharge = function() {
        _ensureLiveStore();
        liveState.rechargeOpen = true;
        liveState.rechargeCustomMode = false;
        liveState.rechargeCustomAmount = '';
        liveState.rechargeRecordsOpen = false;
        _renderRechargePanel();
    };

    // 关闭充值面板
    window.liveCloseRecharge = function() {
        liveState.rechargeOpen = false;
        var overlay = document.querySelector('.live-recharge-overlay');
        if (overlay) overlay.remove();
    };

    // 选择充值档位
    window.liveSelectPkg = function(pkgId) {
        liveState.rechargeSelectedPkg = pkgId;
        liveState.rechargeCustomMode = false;
        liveState.rechargeCustomAmount = '';
        _renderRechargePanel();
    };

    // 切换自定义金额模式
    window.liveToggleCustomRecharge = function() {
        liveState.rechargeCustomMode = !liveState.rechargeCustomMode;
        if (liveState.rechargeCustomMode) {
            liveState.rechargeSelectedPkg = null;
        }
        _renderRechargePanel();
        if (liveState.rechargeCustomMode) {
            setTimeout(function() {
                var inp = document.getElementById('live-recharge-custom-input');
                if (inp) inp.focus();
            }, 100);
        }
    };

    // 自定义金额输入
    window.liveCustomAmountInput = function(val) {
        liveState.rechargeCustomAmount = val;
        var coinsEl = document.getElementById('live-recharge-custom-coins');
        var amt = parseFloat(val);
        if (coinsEl) {
            if (!isNaN(amt) && amt > 0) {
                coinsEl.textContent = '可获得 ' + Math.floor(amt * COIN_RATE) + ' 金币';
                coinsEl.style.display = 'block';
            } else {
                coinsEl.style.display = 'none';
            }
        }
    };

    // 选择支付方式
    window.liveSelectPayMethod = function(method) {
        liveState.rechargePayMethod = method;
        _renderRechargePanel();
    };

    // 切换充值记录
    window.liveToggleRechargeRecords = function() {
        liveState.rechargeRecordsOpen = !liveState.rechargeRecordsOpen;
        _renderRechargePanel();
    };

    // 获取当前选择的充值信息
    function _getRechargeInfo() {
        if (liveState.rechargeCustomMode) {
            var amt = parseFloat(liveState.rechargeCustomAmount);
            if (isNaN(amt) || amt <= 0) return null;
            amt = Math.round(amt * 100) / 100; // 两位小数
            return { price: amt, coins: Math.floor(amt * COIN_RATE), bonus: 0, isCustom: true };
        }
        var pkg = RECHARGE_PACKAGES.find(function(p) { return p.id === liveState.rechargeSelectedPkg; });
        if (!pkg) return null;
        _ensureLiveStore();
        var bonus = pkg.bonus;
        // 首充双倍
        if (!store.liveFirstRecharge && pkg.tag === 'first-buy') {
            bonus = pkg.coins; // 首充翻倍
        }
        return { price: pkg.price, coins: pkg.coins, bonus: bonus, isCustom: false, pkg: pkg };
    }

    // 确认充值 → 弹出支付确认
    window.liveConfirmRecharge = function() {
        var info = _getRechargeInfo();
        if (!info) {
            if (typeof toast === 'function') toast('请选择充值金额');
            return;
        }
        _ensureLiveStore();
        // 检查钱包余额（如果是钱包支付）
        if (liveState.rechargePayMethod === 'wallet') {
            var walletBalance = (store.user && store.user.balance) || 0;
            if (walletBalance < info.price) {
                if (typeof toast === 'function') toast('钱包余额不足！当前余额 ¥' + walletBalance.toFixed(2));
                return;
            }
        }
        // 弹出支付确认对话框
        _showPayDialog(info);
    };

    // ========== 渲染充值面板 ==========
    function _renderRechargePanel() {
        // 移除旧面板
        var old = document.querySelector('.live-recharge-overlay');
        if (old) old.remove();
        if (!liveState.rechargeOpen) return;

        _ensureLiveStore();
        var walletBalance = (store.user && store.user.balance) || 0;

        var html = '<div class="live-recharge-overlay" onclick="if(event.target===this)liveCloseRecharge()">';
        html += '<div class="live-recharge-panel">';

        // 头部
        html += '<div class="live-recharge-header">';
        html += '<div class="live-recharge-title">充值中心</div>';
        html += '<div class="live-recharge-close" onclick="liveCloseRecharge()">' + SVG.close + '</div>';
        html += '</div>';

        if (liveState.rechargeRecordsOpen) {
            // 显示充值记录
            html += _renderRechargeRecords();
        } else {
            // 当前余额卡片
            html += '<div class="live-recharge-balance">';
            html += '<div class="live-recharge-balance-label">金币余额</div>';
            html += '<div class="live-recharge-balance-amount">' + SVG.coin + ' ' + store.liveCoins + '<small>金币</small></div>';
            html += '<div class="live-recharge-balance-wallet">' + SVG.diamond + ' 钱包余额：¥' + walletBalance.toFixed(2) + '</div>';
            html += '</div>';

            // 充值档位
            html += '<div class="live-recharge-section-title">' + SVG.coin + ' 选择充值金额</div>';
            html += '<div class="live-recharge-grid">';
            RECHARGE_PACKAGES.forEach(function(pkg) {
                var isSelected = liveState.rechargeSelectedPkg === pkg.id && !liveState.rechargeCustomMode;
                var tagClass = '';
                if (pkg.tag === 'popular') tagClass = ' popular';
                if (pkg.tag === 'first-buy' && !store.liveFirstRecharge) tagClass = ' first-buy';
                html += '<div class="live-recharge-card' + (isSelected ? ' selected' : '') + tagClass + '" onclick="liveSelectPkg(\'' + pkg.id + '\')">';
                html += '<div class="live-recharge-card-coins">' + pkg.coins + '<span class="live-recharge-card-coins-unit">金币</span></div>';
                html += '<div class="live-recharge-card-price">¥' + pkg.price + '</div>';
                if (pkg.bonus > 0) {
                    html += '<div class="live-recharge-card-bonus">赠送 +' + pkg.bonus + '金币</div>';
                }
                if (pkg.tag === 'first-buy' && !store.liveFirstRecharge) {
                    html += '<div class="live-recharge-card-bonus" style="color:#c0a040">首充额外 +' + pkg.coins + '</div>';
                }
                html += '</div>';
            });
            html += '</div>';

            // 自定义金额
            html += '<div class="live-recharge-custom">';
            if (liveState.rechargeCustomMode) {
                html += '<div class="live-recharge-custom-input-row">';
                html += '<input class="live-recharge-custom-input" id="live-recharge-custom-input" type="number" placeholder="输入金额（元）" value="' + (liveState.rechargeCustomAmount || '') + '" oninput="liveCustomAmountInput(this.value)">';
                html += '</div>';
                html += '<div class="live-recharge-custom-hint">1元 = ' + COIN_RATE + '金币，最低充值1元</div>';
                html += '<div class="live-recharge-custom-coins" id="live-recharge-custom-coins" style="display:' + (liveState.rechargeCustomAmount ? 'block' : 'none') + '">';
                var cAmt = parseFloat(liveState.rechargeCustomAmount);
                if (!isNaN(cAmt) && cAmt > 0) html += '可获得 ' + Math.floor(cAmt * COIN_RATE) + ' 金币';
                html += '</div>';
            } else {
                html += '<div class="live-recharge-custom-btn" onclick="liveToggleCustomRecharge()">' + SVG.plus + ' 自定义金额</div>';
            }
            html += '</div>';

            // 支付方式
            html += '<div class="live-recharge-section-title" style="margin-top:4px">' + SVG.diamond + ' 支付方式</div>';
            html += '<div class="live-recharge-pay-section" style="display:flex;flex-direction:column;gap:10px">';
            // 钱包支付
            html += '<div class="live-recharge-pay-method' + (liveState.rechargePayMethod === 'wallet' ? ' active' : '') + '" onclick="liveSelectPayMethod(\'wallet\')">';
            html += '<div class="live-recharge-pay-icon wallet">' + SVG.coin + '</div>';
            html += '<div class="live-recharge-pay-info"><div class="live-recharge-pay-name">YAN PAY 钱包</div>';
            html += '<div class="live-recharge-pay-desc">余额 ¥' + walletBalance.toFixed(2) + '</div></div>';
            html += '<div class="live-recharge-pay-check' + (liveState.rechargePayMethod === 'wallet' ? ' checked' : '') + '">' + (liveState.rechargePayMethod === 'wallet' ? SVG.check : '') + '</div>';
            html += '</div>';
            // 微信支付
            html += '<div class="live-recharge-pay-method' + (liveState.rechargePayMethod === 'wechat' ? ' active' : '') + '" onclick="liveSelectPayMethod(\'wechat\')">';
            html += '<div class="live-recharge-pay-icon wechat">' + SVG.wechat + '</div>';
            html += '<div class="live-recharge-pay-info"><div class="live-recharge-pay-name">微信支付</div>';
            html += '<div class="live-recharge-pay-desc">推荐</div></div>';
            html += '<div class="live-recharge-pay-check' + (liveState.rechargePayMethod === 'wechat' ? ' checked' : '') + '">' + (liveState.rechargePayMethod === 'wechat' ? SVG.check : '') + '</div>';
            html += '</div>';
            html += '</div>';

            // 确认按钮
            var info = _getRechargeInfo();
            html += '<div class="live-recharge-confirm-area">';
            if (info) {
                var totalCoins = info.coins + info.bonus;
                html += '<button class="live-recharge-confirm-btn" onclick="liveConfirmRecharge()">';
                html += '立即充值 <span class="price-tag">¥' + info.price + ' → ' + totalCoins + '金币</span></button>';
            } else {
                html += '<button class="live-recharge-confirm-btn" disabled>请选择充值金额</button>';
            }
            html += '</div>';
        }

        // 充值记录入口
        html += '<div class="live-recharge-history-link" onclick="liveToggleRechargeRecords()">' + (liveState.rechargeRecordsOpen ? '← 返回充值' : '查看充值记录 →') + '</div>';

        html += '</div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    }

    // ========== 充值记录渲染 ==========
    function _renderRechargeRecords() {
        _ensureLiveStore();
        var records = (store.liveRechargeHistory || []).slice().reverse();
        var html = '<div class="live-recharge-records">';
        html += '<div class="live-recharge-section-title" style="padding:0;margin-bottom:12px">' + SVG.history + ' 充值记录</div>';
        if (records.length === 0) {
            html += '<div style="text-align:center;padding:30px 0;color:#666">' + SVG.coin + '<br><br>暂无充值记录</div>';
        } else {
            records.forEach(function(r) {
                var date = new Date(r.time);
                var dateStr = (date.getMonth() + 1) + '/' + date.getDate() + ' ' + date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0');
                var isRecharge = r.type === 'recharge';
                html += '<div class="live-recharge-record-item">';
                html += '<div class="live-recharge-record-icon ' + (isRecharge ? 'income' : 'spend') + '">' + (isRecharge ? SVG.coin : SVG.gift) + '</div>';
                html += '<div class="live-recharge-record-info"><div class="live-recharge-record-desc">' + _esc(r.desc || '') + '</div>';
                html += '<div class="live-recharge-record-time">' + dateStr + '</div></div>';
                html += '<div class="live-recharge-record-amount ' + (isRecharge ? 'income' : 'spend') + '">' + (isRecharge ? '+' : '-') + r.coins + '金币</div>';
                html += '</div>';
            });
        }
        html += '</div>';
        return html;
    }

    // ========== 模拟微信支付对话框 ==========
    function _showPayDialog(info) {
        var old = document.querySelector('.live-pay-dialog-overlay');
        if (old) old.remove();

        var payMethodName = liveState.rechargePayMethod === 'wechat' ? '微信支付' : 'YAN PAY';
        var totalCoins = info.coins + info.bonus;

        var html = '<div class="live-pay-dialog-overlay">';
        html += '<div class="live-pay-dialog">';
        // 头部
        html += '<div class="live-pay-dialog-header">';
        html += '<div class="live-pay-dialog-header-title">' + payMethodName + '</div>';
        html += '<div class="live-pay-dialog-header-close" onclick="liveClosePayDialog()">' + SVG.close + '</div>';
        html += '<div class="live-pay-dialog-amount"><small>¥</small>' + info.price.toFixed(2) + '</div>';
        html += '<div class="live-pay-dialog-merchant">YAN直播 - 金币充值</div>';
        html += '</div>';
        // 密码输入区
        html += '<div class="live-pay-dialog-body" id="live-pay-dialog-body">';
        html += '<div class="live-pay-dialog-label">请输入支付密码</div>';
        html += '<div class="live-pay-dialog-dots" id="live-pay-dots">';
        for (var i = 0; i < 6; i++) {
            html += '<div class="live-pay-dialog-dot" id="live-pay-dot-' + i + '"></div>';
        }
        html += '</div></div>';
        // 数字键盘
        html += '<div class="live-pay-keypad" id="live-pay-keypad">';
        var keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'];
        keys.forEach(function(k) {
            if (k === '') {
                html += '<div class="live-pay-key empty"></div>';
            } else if (k === 'del') {
                html += '<div class="live-pay-key delete" onclick="livePayKeyPress(\'del\')"><svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M7 5l-5 6 5 6h13V5H7z" stroke="currentColor" stroke-width="1.5"/><path d="M12 8l4 4M16 8l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></div>';
            } else {
                html += '<div class="live-pay-key" onclick="livePayKeyPress(' + k + ')">' + k + '</div>';
            }
        });
        html += '</div>';
        html += '</div></div>';

        document.body.insertAdjacentHTML('beforeend', html);

        // 初始化密码状态
        window._livePayPassword = '';
        window._livePayInfo = info;
    }

    // 关闭支付对话框
    window.liveClosePayDialog = function() {
        var overlay = document.querySelector('.live-pay-dialog-overlay');
        if (overlay) overlay.remove();
        window._livePayPassword = '';
        window._livePayInfo = null;
    };

    // 数字键盘按键
    window.livePayKeyPress = function(key) {
        var pw = window._livePayPassword || '';
        if (key === 'del') {
            pw = pw.slice(0, -1);
        } else {
            if (pw.length >= 6) return;
            pw += '' + key;
        }
        window._livePayPassword = pw;

        // 更新密码点
        for (var i = 0; i < 6; i++) {
            var dot = document.getElementById('live-pay-dot-' + i);
            if (dot) {
                if (i < pw.length) {
                    dot.className = 'live-pay-dialog-dot filled';
                } else if (i === pw.length) {
                    dot.className = 'live-pay-dialog-dot active';
                } else {
                    dot.className = 'live-pay-dialog-dot';
                }
            }
        }

        // 输入6位后自动处理支付
        if (pw.length === 6) {
            setTimeout(function() {
                _processPayment(window._livePayInfo);
            }, 300);
        }
    };

    // ========== 处理支付 ==========
    function _processPayment(info) {
        if (!info) return;
        var body = document.getElementById('live-pay-dialog-body');
        var keypad = document.getElementById('live-pay-keypad');
        if (!body) return;

        // 显示处理中
        body.innerHTML = '<div class="live-pay-processing"><div class="live-pay-processing-spinner"></div><div class="live-pay-processing-text">支付处理中...</div></div>';
        if (keypad) keypad.style.display = 'none';

        // 模拟支付延迟
        setTimeout(function() {
            _ensureLiveStore();
            var totalCoins = info.coins + info.bonus;

            // 扣钱包余额
            if (liveState.rechargePayMethod === 'wallet') {
                if (store.user) {
                    store.user.balance = (store.user.balance || 0) - info.price;
                }
                // 记录到钱包账单
                if (!store.bills) store.bills = [];
                store.bills.push({
                    type: 'out',
                    amt: info.price,
                    desc: '直播充值 - ' + totalCoins + '金币',
                    time: Date.now()
                });
            }
            // 微信支付模式（模拟成功）不扣钱包余额

            // 加金币
            store.liveCoins = (store.liveCoins || 0) + totalCoins;

            // 首充标记
            if (!store.liveFirstRecharge) {
                store.liveFirstRecharge = true;
            }

            // 记录充值历史
            store.liveRechargeHistory.push({
                type: 'recharge',
                desc: '充值 ¥' + info.price + (info.bonus > 0 ? '（含赠送' + info.bonus + '）' : ''),
                coins: totalCoins,
                price: info.price,
                method: liveState.rechargePayMethod,
                time: Date.now()
            });

            if (typeof save === 'function') save();

            // 显示支付成功
            _showPaySuccess(info, totalCoins);

        }, 1200 + Math.random() * 800);
    }

    // ========== 支付成功动画 ==========
    function _showPaySuccess(info, totalCoins) {
        var body = document.getElementById('live-pay-dialog-body');
        if (!body) return;

        body.innerHTML = '<div class="live-pay-success">'
            + '<div class="live-pay-success-icon">' + SVG.check + '</div>'
            + '<div class="live-pay-success-text">支付成功</div>'
            + '<div class="live-pay-success-detail">¥' + info.price.toFixed(2) + '</div>'
            + '<div class="live-pay-success-coins">' + SVG.coin + ' +' + totalCoins + ' 金币到账</div>'
            + (info.bonus > 0 ? '<div style="color:#ff4d6a;font-size:12px;margin-top:4px">🎉 含赠送 ' + info.bonus + ' 金币</div>' : '')
            + '<button class="live-pay-success-btn" onclick="livePaySuccessDone()">完成</button>'
            + '</div>';

        // 金币飘落动画
        _showCoinRainEffect();

        // 播放音效提示
        if (typeof toast === 'function') toast('充值成功！+' + totalCoins + '金币 💰');
    }

    // 支付成功完成
    window.livePaySuccessDone = function() {
        liveClosePayDialog();
        liveCloseRecharge();
        // 刷新礼物面板（如果在直播间内）
        if (liveState.inRoom && liveState.giftPanelOpen) {
            _renderGiftPanel();
        }
        // 刷新广场（如果在广场）
        if (typeof renderLivePlaza === 'function') {
            try { renderLivePlaza(); } catch(e) {}
        }
    };

    // ========== 金币飘落特效 ==========
    function _showCoinRainEffect() {
        var container = document.createElement('div');
        container.className = 'live-coin-rain';
        document.body.appendChild(container);

        var coinEmojis = ['💰', '🪙', '✨', '💎', '⭐'];
        for (var i = 0; i < 20; i++) {
            (function(idx) {
                setTimeout(function() {
                    var coin = document.createElement('div');
                    coin.className = 'live-coin-particle';
                    coin.textContent = coinEmojis[Math.floor(Math.random() * coinEmojis.length)];
                    coin.style.left = (Math.random() * 100) + '%';
                    coin.style.animationDuration = (1 + Math.random() * 1.5) + 's';
                    coin.style.animationDelay = '0s';
                    coin.style.fontSize = (14 + Math.random() * 16) + 'px';
                    container.appendChild(coin);
                    setTimeout(function() { coin.remove(); }, 2500);
                }, idx * 80);
            })(i);
        }

        setTimeout(function() { container.remove(); }, 3000);
    }

    // ========== 直播间内金币余额徽章（在toolbar上显示） ==========
    window.liveGetCoinsDisplay = function() {
        _ensureLiveStore();
        return store.liveCoins;
    };

})();
