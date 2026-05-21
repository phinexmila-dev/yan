// ============================================================
// app-openworld.js — 开放世界文游系统
// 大地图+回合制+视觉小说剧情+NPC+经济+天气+成就+随机事件
// 入口：openApp('map') → window._openWorld.init()
// ============================================================

(function() {
    'use strict';

    // ==================== 常量与配置 ====================

    var OW_VERSION = '1.3.0';
    var MAX_TURNS_PER_DAY = 20;
    var HOURS_PER_TURN = 1;
    var DAY_START_HOUR = 8;

    // 职业等级配置
    var JOB_LEVEL_CONFIG = {
        maxLevel: 5,
        expPerLevel: [0, 3, 8, 15, 25], // 每级所需累计打工次数
        incomeMultiplier: [1.0, 1.2, 1.5, 1.8, 2.2], // 收入倍率
        levelNames: ['新手', '熟练', '老手', '精英', '大师']
    };

    // 联系人心情系统
    var CONTACT_MOODS = {
        happy:   { name: '开心', emoji: '😊', relationMult: 1.3, desc: '今天心情很好，互动效果更佳' },
        normal:  { name: '普通', emoji: '😐', relationMult: 1.0, desc: '状态平稳' },
        tired:   { name: '疲惫', emoji: '😴', relationMult: 0.8, desc: '有点累，不太想说话' },
        sad:     { name: '难过', emoji: '😢', relationMult: 0.7, desc: '情绪低落，需要关心' },
        excited: { name: '兴奋', emoji: '🤩', relationMult: 1.5, desc: '超级亢奋，互动加成最高' },
        busy:    { name: '忙碌', emoji: '😤', relationMult: 0.6, desc: '很忙，不方便打扰' }
    };

    // 节日配置（月/日）
    var FESTIVALS = [
        { month: 1,  day: 1,  name: '元旦',   emoji: '🎊', eventId: 'festival_newyear' },
        { month: 2,  day: 14, name: '情人节', emoji: '💝', eventId: 'festival_valentine' },
        { month: 3,  day: 8,  name: '妇女节', emoji: '🌸', eventId: 'festival_womensday' },
        { month: 5,  day: 1,  name: '劳动节', emoji: '🎉', eventId: 'festival_labor' },
        { month: 5,  day: 20, name: '520',    emoji: '💕', eventId: 'festival_520' },
        { month: 6,  day: 1,  name: '儿童节', emoji: '🎈', eventId: 'festival_children' },
        { month: 7,  day: 7,  name: '七夕',   emoji: '🌌', eventId: 'festival_qixi' },
        { month: 10, day: 1,  name: '国庆节', emoji: '🇨🇳', eventId: 'festival_national' },
        { month: 11, day: 11, name: '双十一', emoji: '🛒', eventId: 'festival_1111' },
        { month: 12, day: 24, name: '平安夜', emoji: '🎄', eventId: 'festival_xmaseve' },
        { month: 12, day: 25, name: '圣诞节', emoji: '🎅', eventId: 'festival_xmas' }
    ];

    // 加载提示语轮播
    var LOADING_TIPS = [
        '💭 AI正在构建专属世界…',
        '🗺️ 正在绘制地图布局…',
        '🎭 正在设定NPC日程…',
        '🌤️ 正在决定今天的天气…',
        '💌 正在准备邂逅剧情…',
        '✨ 细节正在魔法般浮现…',
        '🏙️ 城市的角落逐渐成形…',
    ];

    // 世界主题背景图（预设，也可AI生成）
    var WORLD_THEMES = {
        ancient: {
            name: '古代', emoji: '🏯',
            bg: 'linear-gradient(135deg, #8B4513 0%, #D2691E 30%, #DEB887 60%, #F5DEB3 100%)',
            bgImg: '', // 可填图片URL（单张，兼容旧逻辑）
            bgImgs: [
                'https://s1.imagehub.cc/images/2026/04/12/a1f2914fe0d7551f2a009667b7eb2f1d.png',
                'https://s1.imagehub.cc/images/2026/04/12/c65fbc5f4b9f9084ba28533c339dab54.png',
                'https://s1.imagehub.cc/images/2026/04/12/f3d64abfeb9fa9aa5f1d8a646758168d.png',
                'https://s1.imagehub.cc/images/2026/04/12/97959acc4ea66f926621ec0f83635290.png',
                'https://s1.imagehub.cc/images/2026/04/12/3e61deb56960d127fb3311ad5c8bb19f.png'
            ],
            sceneBgImgs: [
                'https://s1.imagehub.cc/images/2026/04/12/80cd3877da0f2568ee1181a8487b2772.jpg',
                'https://s1.imagehub.cc/images/2026/04/12/591d857cdfb7fb3593b816c5c1831966.jpg',
                'https://s1.imagehub.cc/images/2026/04/12/ebd6df5f137309b12eb622d35ee82e14.jpg',
                'https://s1.imagehub.cc/images/2026/04/12/05f216900579393324cfaa1f6956ce16.jpg',
                'https://s1.imagehub.cc/images/2026/04/12/e488cced1c284d735c71f035b9a0c7af.jpg'
            ],
            locations: ['皇宫', '酒楼', '书院', '市集', '青楼', '镖局', '道观', '医馆', '官府', '城郊'],
            jobs: ['说书人', '摆摊小贩', '账房先生', '武馆教头', '客栈伙计'],
            color: '#8B4513', textColor: '#fff5e6'
        },
        modern: {
            name: '现代都市', emoji: '🏙️',
            bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #533483 100%)',
            bgImg: '',
            bgImgs: [
                'https://s1.imagehub.cc/images/2026/04/12/7aa85c968e9c1a980ade9f849bc7e564.png',
                'https://s1.imagehub.cc/images/2026/04/12/e5254a6a10fc8fb9b18f02ed3eb89fb7.png',
                'https://s1.imagehub.cc/images/2026/04/12/293e96aa00a05bf64a752cf6dd2fe3a5.png',
                'https://s1.imagehub.cc/images/2026/04/12/dc38aa0a9923a9252087696ed17f249e.png'
            ],
            sceneBgImgs: [],
            locations: ['写字楼', '咖啡馆', '商场', '公园', '健身房', '图书馆', '便利店', '餐厅', '夜店', '医院'],
            jobs: ['服务员', '家教', '程序员', '快递员', '收银员', '外卖骑手'],
            color: '#0f3460', textColor: '#e0e0ff'
        },
        campus: {
            name: '校园', emoji: '🎓',
            bg: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 40%, #CDDC39 70%, #FFC107 100%)',
            bgImg: '',
            bgImgs: [],
            sceneBgImgs: [],
            locations: ['教室', '图书馆', '操场', '食堂', '宿舍楼', '社团室', '体育馆', '校门口', '超市', '咖啡角'],
            jobs: ['图书馆管理员', '家教', '奶茶店兼职', '超市收银', '快递分拣'],
            color: '#388E3C', textColor: '#fff'
        },
        fantasy: {
            name: '仙侠', emoji: '🧙',
            bg: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 40%, #11998e 70%, #38ef7d 100%)',
            bgImg: '',
            bgImgs: [
                'https://s1.imagehub.cc/images/2026/04/12/230251a0b730786c7d26df1f60193e6a.png',
                'https://s1.imagehub.cc/images/2026/04/12/9e155c78dd33a1bd9de73136eeb84ec6.png',
                'https://s1.imagehub.cc/images/2026/04/12/82a540344bb9967268d4f6a26bdc9014.png',
                'https://s1.imagehub.cc/images/2026/04/12/7cece4d107a7f46d59b74df844242242.png',
                'https://s1.imagehub.cc/images/2026/04/12/5c80c174519b693912a7dbbb9a85f1db.png'
            ],
            sceneBgImgs: [],
            locations: ['魔法学院', '魔法商店', '冒险者公会', '森林神殿', '炼金工坊', '精灵村落', '龙窟入口', '古代遗迹', '港口码头', '皇家图书馆'],
            jobs: ['图书整理员', '魔法材料贩卖', '冒险者助手', '古籍抄录员', '酿造助手'],
            color: '#2d1b69', textColor: '#e0ffe8'
        },
        wuxia: {
            name: '武侠', emoji: '⚔️',
            bg: 'linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 40%, #8B0000 70%, #DC143C 100%)',
            bgImg: '',
            bgImgs: [],
            sceneBgImgs: [],
            locations: ['武林盟主府', '酒肆客栈', '山顶派门', '江湖集市', '镖局', '暗器铺', '秘境入口', '比武擂台', '古墓遗址', '渔村码头'],
            jobs: ['镖局镖师', '酒肆伙计', '说书人', '铁匠学徒', '药材采集'],
            color: '#8B0000', textColor: '#ffe4e1'
        }
    };

    // 天气配置
    var WEATHER_TYPES = {
        sunny:    { name: '晴天', emoji: '☀️', npcMult: 1.0, outdoorOpen: true, eventBonus: 0 },
        cloudy:   { name: '多云', emoji: '⛅', npcMult: 0.9, outdoorOpen: true, eventBonus: 0.02 },
        rain:     { name: '小雨', emoji: '🌧️', npcMult: 0.7, outdoorOpen: true, eventBonus: 0.05 },
        heavyrain:{ name: '大雨', emoji: '⛈️', npcMult: 0.4, outdoorOpen: false, eventBonus: 0.08 },
        snow:     { name: '下雪', emoji: '❄️', npcMult: 0.6, outdoorOpen: true, eventBonus: 0.06 },
        windy:    { name: '大风', emoji: '🌬️', npcMult: 0.8, outdoorOpen: true, eventBonus: 0.03 }
    };

    // 季节天气概率
    var SEASON_WEATHER = {
        spring: { sunny: 0.35, cloudy: 0.25, rain: 0.25, heavyrain: 0.05, snow: 0.02, windy: 0.08 },
        summer: { sunny: 0.40, cloudy: 0.20, rain: 0.15, heavyrain: 0.15, snow: 0.0, windy: 0.10 },
        autumn: { sunny: 0.30, cloudy: 0.30, rain: 0.20, heavyrain: 0.08, snow: 0.02, windy: 0.10 },
        winter: { sunny: 0.25, cloudy: 0.25, rain: 0.10, heavyrain: 0.05, snow: 0.25, windy: 0.10 }
    };

    // 关系阶段
    var RELATION_STAGES = ['陌生人', '认识', '朋友', '好友', '暧昧', '恋人', '挚爱'];
    var RELATION_THRESHOLDS = [0, 20, 50, 80, 110, 150, 200];

    // 成就稀有度中文映射
    var RARITY_ZH = { common: '普通', uncommon: '稀有', rare: '珍贵', epic: '史诗', legendary: '传说' };

    // 成就定义
    var ACHIEVEMENTS_DEF = [
        // 探索类
        { id: 'first_enter', name: '初来乍到', desc: '第一次进入大世界', icon: '🗺️', rarity: 'common', hidden: false, reward: { money: 100 } },
        { id: 'explorer', name: '探索者', desc: '访问所有地点至少一次', icon: '🧭', rarity: 'uncommon', hidden: false, reward: { money: 500 } },
        { id: 'hidden_finder', name: '发现者', desc: '找到一个隐藏地点', icon: '🔍', rarity: 'rare', hidden: false, reward: { money: 300 } },
        // 社交类
        { id: 'first_meet', name: '初次见面', desc: '在大世界中首次遇到联系人', icon: '👋', rarity: 'common', hidden: false, reward: { money: 200 } },
        { id: 'regular_visitor', name: '常客', desc: '在同一地点连续遇到联系人3次', icon: '☕', rarity: 'uncommon', hidden: false, reward: { money: 400 } },
        { id: 'telepathy', name: '心有灵犀', desc: '连续3天在同一地点偶遇联系人', icon: '💕', rarity: 'rare', hidden: false, reward: { money: 600, unlockEvent: 'telepathy_event' } },
        { id: 'social_butterfly', name: '社交达人', desc: '与5个不同NPC好感度达到50+', icon: '👥', rarity: 'uncommon', hidden: false, reward: { money: 500 } },
        { id: 'lovers', name: '命中注定', desc: '与联系人关系进展到恋人', icon: '💑', rarity: 'epic', hidden: false, reward: { money: 2000, unlockEvent: 'lovers_date_event' } },
        // 经济类
        { id: 'first_job', name: '打工人', desc: '第一次打工赚钱', icon: '💼', rarity: 'common', hidden: false, reward: { money: 100 } },
        { id: 'small_savings', name: '小有积蓄', desc: '存款达到¥10000', icon: '💰', rarity: 'uncommon', hidden: false, reward: { money: 1000 } },
        { id: 'car_owner', name: '有车一族', desc: '购买第一辆车', icon: '🚗', rarity: 'uncommon', hidden: false, reward: { unlockEvent: 'car_date_event' } },
        { id: 'homeowner', name: '安家落户', desc: '购买第一套房', icon: '🏠', rarity: 'rare', hidden: false, reward: { unlockEvent: 'home_invite_event' } },
        { id: 'rich', name: '富甲一方', desc: '存款达到¥100000', icon: '🤑', rarity: 'epic', hidden: false, reward: { money: 10000 } },
        // 剧情类
        { id: 'first_story', name: '故事开始', desc: '完成第一段剧情', icon: '📖', rarity: 'common', hidden: false, reward: { money: 100 } },
        { id: 'story_collector', name: '百态人生', desc: '触发30个不同事件', icon: '🎭', rarity: 'uncommon', hidden: false, reward: { money: 500 } },
        { id: 'lucky_one', name: '幸运儿', desc: '触发一个稀有随机事件', icon: '🎲', rarity: 'rare', hidden: false, reward: { money: 300 } },
        // 隐藏成就
        { id: 'rain_walk', name: '雨中漫步', desc: '大雨天连续探索3个户外地点', icon: '☂️', rarity: 'rare', hidden: true, reward: { money: 500, unlockEvent: 'rain_romance_event' } },
        { id: 'night_owl', name: '夜猫子', desc: '用完最后一个回合还在外面', icon: '🦉', rarity: 'uncommon', hidden: true, reward: { money: 200 } },
        { id: 'stalker', name: '如影随形', desc: '连续5回合去联系人所在地点', icon: '🕵️', rarity: 'rare', hidden: true, reward: { money: 300 } },
        { id: 'lucky_chain', name: '欧皇', desc: '连续触发3个随机事件', icon: '🍀', rarity: 'epic', hidden: true, reward: { money: 1000 } }
    ];

    // ==================== 状态 ====================

    var owState = {
        initialized: false,
        contactId: null,
        worldData: null,    // 从store.openWorlds[contactId]读取
        currentView: 'select', // select | loading | map | scene | dialog | shop | job | achievements
        dialogQueue: [],
        isDialogRunning: false,
        _currentSceneLocId: null,   // Fix10: 记录当前地点详情页的locId，商店返回用
        _shopFromScene: false,       // Fix10: 商店是否从地点详情页打开
        _dialogTotal: 0,             // 对话框总步数（用于进度指示）
        _dialogStepIndex: 0          // 当前步数
    };

    // ==================== 工具函数 ====================

    // 从联系人人设中提取性格标签（V2扩展版：30+标签池+语气类型识别）
    function extractPersonaTags(contact) {
        var persona = (contact.persona || '') + ' ' + (contact.name || '');
        var tags = [];
        var tagMap = [
            // 基础性格
            [/温柔|温和|体贴|细心|温暖|柔软|轻声/, '温柔体贴'],
            [/活泼|开朗|外向|爱笑|阳光|元气|精力充沛/, '活泼开朗'],
            [/内向|安静|沉默|腼腆|害羞|社恐|不善言辞/, '内敛安静'],
            [/傲娇|高冷|冷淡|冷漠|高傲|嘴硬|口是心非|别扭/, '傲娇高冷'],
            [/聪明|智慧|博学|学霸|才华|天才|机智/, '聪明才智'],
            [/可爱|萌|天真|纯真|单纯|呆萌|软萌/, '可爱纯真'],
            [/成熟|稳重|沉稳|老练|冷静|理性|克制/, '成熟稳重'],
            [/幽默|搞笑|风趣|逗趣|有趣|段子|贫嘴/, '幽默风趣'],
            [/独立|坚强|勇敢|果断|自信|强势|霸气/, '独立自信'],
            [/善良|热心|乐于助人|友善|亲切|暖心/, '善良热心'],
            [/神秘|深沉|复杂|难以捉摸|城府|腹黑/, '神秘深沉'],
            [/浪漫|感性|多愁善感|细腻|文艺|诗意/, '浪漫感性'],
            // 扩展性格
            [/毒舌|犀利|直白|嘴毒|刻薄|尖锐/, '毒舌犀利'],
            [/腹黑|心机|算计|表里不一|笑面虎/, '腹黑心机'],
            [/忠犬|专一|执着|死心塌地|粘人|占有/, '忠犬专一'],
            [/病娇|偏执|疯狂|极端|黑化|控制欲/, '病娇偏执'],
            [/懒|慵懒|佛系|随性|无所谓|躺平/, '慵懒随性'],
            [/暴躁|易怒|火爆|脾气|冲动|急性子/, '暴躁直率'],
            [/闷骚|外冷内热|表面冷漠|内心火热/, '闷骚反差'],
            [/话痨|碎碎念|唠叨|停不下来|爱说话/, '话痨健谈'],
            [/少言|惜字如金|话少|冷淡|不爱说话/, '寡言冷淡'],
            [/撒娇|黏人|依赖|小奶狗|小奶猫|软糯/, '撒娇黏人'],
            [/霸道|强势|控制|命令|不容拒绝|总裁/, '霸道强势'],
            [/天然|迟钝|呆|反应慢|天然呆|无自觉/, '天然呆萌'],
            [/妖艳|魅惑|勾引|撩|风情|妩媚|性感/, '妖艳魅惑'],
            [/正经|严肃|一本正经|认真|板正|规矩/, '正经严肃'],
            [/叛逆|不羁|自由|反骨|不服管|野/, '叛逆不羁'],
            [/忧郁|阴暗|悲观|消极|丧|emo/, '忧郁敏感'],
            [/奶凶|凶巴巴|嘴上凶|实际心软/, '奶凶反差'],
            [/大姐姐|姐姐|御姐|成熟女性|知性/, '御姐知性'],
            [/弟弟|学弟|年下|小狼狗|少年感/, '年下少年']
        ];
        tagMap.forEach(function(pair) {
            if (pair[0].test(persona)) tags.push(pair[1]);
        });
        return tags.slice(0, 4); // 最多4个标签
    }

    // 获取人设的"语气类型"（用于事件变体匹配）
    function getPersonaTone(contact) {
        var persona = (contact.persona || '').toLowerCase();
        var tags = extractPersonaTags(contact);
        var tagStr = tags.join(' ');
        // 按优先级匹配语气类型
        if (/傲娇|高冷|毒舌|闷骚|奶凶/.test(tagStr)) return 'tsundere';
        if (/温柔|善良|撒娇|黏人/.test(tagStr)) return 'gentle';
        if (/活泼|幽默|话痨|天然/.test(tagStr)) return 'cheerful';
        if (/霸道|强势|病娇|忠犬/.test(tagStr)) return 'dominant';
        if (/内敛|安静|寡言|忧郁/.test(tagStr)) return 'quiet';
        if (/成熟|正经|御姐|神秘/.test(tagStr)) return 'mature';
        // 从人设文本直接推断
        if (/傲娇|嘴硬|口是心非|哼|才不是/.test(persona)) return 'tsundere';
        if (/温柔|轻声|微笑|温暖/.test(persona)) return 'gentle';
        if (/哈哈|嘻嘻|活泼|笑/.test(persona)) return 'cheerful';
        return 'neutral'; // 默认中性
    }

    // 智能人设截取：优先提取说话风格/口头禅/语气相关段落，确保核心人设不丢失
    function smartPersonaExtract(persona, maxLen) {
        maxLen = maxLen || 800;
        if (!persona || persona.length <= maxLen) return persona || '';
        
        // 优先提取的关键段落（说话方式、口头禅、语气）
        var priorityPatterns = [
            /(?:说话|语气|口头禅|口癖|称呼|叫你|自称|用语|话风|语调|措辞|表达方式)[^\n]{0,200}/gi,
            /(?:喜欢说|常说|总是说|会说|口头禅是)[^\n]{0,150}/gi,
            /(?:性格|脾气|态度|对人|待人)[^\n]{0,200}/gi,
            /["「『][^"」』\n]{2,80}["」』]/g  // 引号内的示例对话
        ];
        
        var priorityText = '';
        priorityPatterns.forEach(function(pat) {
            var matches = persona.match(pat);
            if (matches) {
                priorityText += matches.join('\n') + '\n';
            }
        });
        
        // 去重
        priorityText = priorityText.substring(0, Math.floor(maxLen * 0.4));
        
        // 剩余空间填充人设开头部分
        var remaining = maxLen - priorityText.length;
        var headText = persona.substring(0, remaining);
        
        // 如果优先文本和头部有重叠，只用头部+补充
        if (priorityText.length < 50) {
            return persona.substring(0, maxLen);
        }
        
        return headText + '\n【说话风格摘要】' + priorityText;
    }

    // 获取联系人人设摘要（用于UI展示）
    function getPersonaSummary(contact) {
        var persona = contact.persona || '';
        if (!persona) return '';
        // 取前80字作为摘要
        var summary = persona.replace(/\n+/g, ' ').trim();
        return summary.length > 80 ? summary.substring(0, 80) + '…' : summary;
    }

    function owEl(id) { return document.getElementById(id); }
    function owToast(msg, type) {
        if (typeof toast === 'function') toast(msg, type || 'info');
        else console.log('[OW]', msg);
    }

    // ==================== 统一 UI 组件 V2 ====================

    /**
     * owModal — 统一弹窗工厂（浅色社交卡片风格）
     * @param {Object} opts
     *   title      {string}  标题文字
     *   icon       {string}  左侧emoji/图标（可选）
     *   content    {string}  HTML内容
     *   size       {string}  'sm'|'md'|'lg'  默认'md'
     *   buttons    {Array}   [{text,cls,onClick}] cls: 'primary'|'danger'|'secondary'|'ghost'
     *   closable   {boolean} 是否显示关闭按钮（默认true）
     *   id         {string}  overlay的id（可选，用于外部关闭）
     * @returns {HTMLElement} overlay元素
     */
    function owModal(opts) {
        var overlay = document.createElement('div');
        overlay.className = 'ow-modal-overlay';
        if (opts.id) overlay.id = opts.id;
        overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

        var closable = opts.closable !== false;
        var closeHtml = closable
            ? '<button class="ow-modal-close" onclick="this.closest(\'.ow-modal-overlay\').remove()">✕</button>'
            : '';

        var buttonsHtml = '';
        if (opts.buttons && opts.buttons.length > 0) {
            buttonsHtml = '<div class="ow-modal-footer">';
            opts.buttons.forEach(function(btn) {
                var cls = 'ow-modal-btn ow-modal-btn-' + (btn.cls || 'primary');
                var onclickAttr = btn.onClick ? ' onclick="' + btn.onClick + '"' : '';
                buttonsHtml += '<button class="' + cls + '"' + onclickAttr + '>' + btn.text + '</button>';
            });
            buttonsHtml += '</div>';
        }

        overlay.innerHTML =
            '<div class="ow-modal-card ow-modal-' + (opts.size || 'md') + '">' +
                '<div class="ow-modal-header">' +
                    (opts.icon ? '<span class="ow-modal-icon">' + opts.icon + '</span>' : '') +
                    '<span class="ow-modal-title">' + (opts.title || '') + '</span>' +
                    closeHtml +
                '</div>' +
                '<div class="ow-modal-body">' + (opts.content || '') + '</div>' +
                buttonsHtml +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function() {
            requestAnimationFrame(function() { overlay.classList.add('show'); });
        });
        return overlay;
    }

    /** owNotify — 顶部滑入通知条 */
    function owNotify(opts) {
        // opts: icon, title, desc, badge, badgeCls, duration
        var el = document.createElement('div');
        el.className = 'ow-notify';
        var badgeHtml = opts.badge
            ? '<span class="ow-notify-badge ' + (opts.badgeCls || 'ow-notify-badge-gold') + '">' + opts.badge + '</span>'
            : '';
        el.innerHTML =
            '<span class="ow-notify-icon">' + (opts.icon || '🔔') + '</span>' +
            '<div class="ow-notify-content">' +
                '<div class="ow-notify-title">' + (opts.title || '') + '</div>' +
                (opts.desc ? '<div class="ow-notify-desc">' + opts.desc + '</div>' : '') +
            '</div>' +
            badgeHtml;
        document.body.appendChild(el);
        setTimeout(function() { el.classList.add('show'); }, 60);
        var dur = opts.duration || 3500;
        setTimeout(function() {
            el.classList.remove('show');
            setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 450);
        }, dur);
        return el;
    }

    /** owToastV2 — 胶囊浮动提示 */
    function owToastV2(msg, type) {
        var el = document.createElement('div');
        el.className = 'ow-toast-v2 ow-toast-v2-' + (type || 'info');
        el.textContent = msg;
        document.body.appendChild(el);
        requestAnimationFrame(function() {
            requestAnimationFrame(function() { el.classList.add('show'); });
        });
        setTimeout(function() {
            el.classList.remove('show');
            setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 350);
        }, 2500);
    }
    // [优化] owSave 防抖：300ms 内多次调用只执行一次，减少 localStorage 写入压力
    var _owSaveTimer = null;
    function owSave() { if (typeof save === 'function') save(); }
    function owSaveLazy() {
        if (_owSaveTimer) clearTimeout(_owSaveTimer);
        _owSaveTimer = setTimeout(function() { _owSaveTimer = null; owSave(); }, 300);
    }
    function owRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function owRandInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function owEscape(s) {
        if (!s) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function owGetContact(cid) {
        return (store.contacts || []).find(function(c) { return c.id === cid; });
    }
    function owGetWorld(cid) {
        if (!store.openWorlds) store.openWorlds = {};
        return store.openWorlds[cid] || null;
    }
    function owSetWorld(cid, data) {
        if (!store.openWorlds) store.openWorlds = {};
        store.openWorlds[cid] = data;
        owSaveLazy(); // [优化] 使用防抖保存，避免高频写入
    }
    // 需要立即保存时使用（如退出前）
    function owSetWorldImmediate(cid, data) {
        if (!store.openWorlds) store.openWorlds = {};
        store.openWorlds[cid] = data;
        owSave();
    }

    // 推断世界观主题
    function inferWorldTheme(contact) {
        var persona = (contact.persona || '') + (contact.name || '');
        var wb = '';
        if (contact.settings && contact.settings.mountedWbIds && store.worldbooks) {
            var mwbs = store.worldbooks.filter(function(w) {
                return contact.settings.mountedWbIds.indexOf(w.id) >= 0;
            });
            wb = mwbs.map(function(w) { return w.content || ''; }).join(' ');
        }
        var text = (persona + wb).toLowerCase();
        if (/古代|皇|朝|江湖|侠|仙|妃|宫|唐|宋|明|清|汉|朝代/.test(text)) return 'ancient';
        if (/武侠|侠客|武林|门派|功夫|内力|剑法|刀法/.test(text)) return 'wuxia';
        if (/魔法|奇幻|精灵|魔王|勇者|异世界|魔界|龙/.test(text)) return 'fantasy';
        if (/学校|学生|高中|大学|同学|班级|教室|校园/.test(text)) return 'campus';
        return 'modern';
    }

    // 获取当前季节
    function getSeason(month) {
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    // 生成天气
    function generateWeather(world) {
        var month = world.currentMonth || 1;
        var season = getSeason(month);
        var probs = SEASON_WEATHER[season];
        var r = Math.random();
        var cum = 0;
        var keys = Object.keys(probs);
        for (var i = 0; i < keys.length; i++) {
            cum += probs[keys[i]];
            if (r < cum) return keys[i];
        }
        return 'sunny';
    }

    // 获取关系阶段名称
    function getRelationStage(progress) {
        var stage = 0;
        for (var i = RELATION_THRESHOLDS.length - 1; i >= 0; i--) {
            if (progress >= RELATION_THRESHOLDS[i]) { stage = i; break; }
        }
        return RELATION_STAGES[stage] || '陌生人';
    }

    // 格式化时间
    function formatTime(hour) {
        var h = Math.floor(hour) % 24;
        var period = h < 6 ? '深夜' : h < 12 ? '上午' : h < 14 ? '中午' : h < 18 ? '下午' : h < 22 ? '晚上' : '深夜';
        return period + ' ' + (h < 10 ? '0' + h : h) + ':00';
    }

    // 格式化金额
    function formatMoney(n) {
        if (n >= 10000) return '¥' + (n / 10000).toFixed(1) + '万';
        return '¥' + n;
    }

    // ==================== 数据初始化 ====================

    function initWorldData(contact, themeKey) {
        var theme = WORLD_THEMES[themeKey] || WORLD_THEMES.modern;
        var now = new Date();
        // 创建世界时一次性随机选定大地图背景图，后续复用，不再每次刷新
        var _bgImgs = theme.bgImgs || [];
        var _selectedBgImg = _bgImgs.length > 0 ? _bgImgs[Math.floor(Math.random() * _bgImgs.length)] : (theme.bgImg || '');
        return {
            contactId: contact.id,
            contactName: contact.name,
            themeKey: themeKey,
            createdAt: Date.now(),
            selectedBgImg: _selectedBgImg,   // 大地图背景图（固定）
            locationSceneBgImgs: {},          // locId -> sceneBgImg URL（首次进入地点时固定）
            // 游戏时间
            currentDay: 1,
            currentDayOfMonth: 1,   // Fix2: 月内第几天（1-30）
            currentMonth: now.getMonth() + 1,
            currentYear: now.getFullYear(),
            currentHour: DAY_START_HOUR,
            currentTurns: 0,
            maxTurnsPerDay: MAX_TURNS_PER_DAY,
            // 玩家状态
            playerMoney: 500,
            playerJob: null,
            playerJobLevel: 0,
            playerOwnedCar: null,
            playerOwnedHouse: null,
            playerLocation: 'home',
            // 联系人关系
            relationProgress: 0,
            relationStage: '陌生人',
            sharedMemories: [],
            // 天气
            weather: 'sunny',
            weatherHistory: [],
            // 地点
            locations: [],         // 由API生成后填充
            locationsGenerated: false,
            // NPC
            npcs: [],
            npcFavorability: {},   // npcId -> favorability
            // 事件缓存
            eventCache: {},        // locationId -> [events]
            triggeredEvents: [],   // 已触发事件id列表
            eventCount: 0,
            // 联系人日程
            contactSchedule: null, // 由API生成
            contactCurrentLocation: null,
            contactMetCount: 0,
            consecutiveMeetLocation: null,
            consecutiveMeetCount: 0,
            // 经济历史
            jobHistory: [],
            purchaseHistory: [],
            // 成就
            achievements: {},      // achievementId -> { unlocked, unlockedAt, progress }
            achievementProgress: {},
            // 随机事件
            randomEventCooldown: {},  // eventId -> lastTriggerDay
            consecutiveOutdoorRainCount: 0,
            consecutiveRandomEvents: 0,
            // 其他统计
            totalTurns: 0,
            totalDays: 0,
            locationsVisited: [],
            nightOwlChecked: false,
            // Fix6: NPC在场缓存（locId_day -> npcIds[]）
            npcLocationCache: {},
            // 职业等级系统
            jobLevelMap: {},       // jobId -> { level, exp }
            // 联系人心情（每天随机）
            contactMood: 'normal',
            contactMoodDay: 0,
            // 节日记录
            triggeredFestivals: [],
            // 记忆详情（带完整内容）
            memoryDetails: []      // [{day, title, content, location}]
        };
    }

    // ==================== API调用：生成世界 ====================

    async function generateWorldViaAPI(contact, themeKey) {
        var theme = WORLD_THEMES[themeKey] || WORLD_THEMES.modern;
        var persona = contact.persona || '一个普通人';
        var wbContent = '';
        if (contact.settings && contact.settings.mountedWbIds && store.worldbooks) {
            var mwbs = store.worldbooks.filter(function(w) {
                return contact.settings.mountedWbIds.indexOf(w.id) >= 0;
            });
            wbContent = mwbs.map(function(w) { return w.content || ''; }).join('\n').substring(0, 1000);
        }

        // 提取人设关键词用于地点生成
        var personaTags = extractPersonaTags(contact);

        var prompt = '你是一个游戏世界设计师。请为以下角色生成一个' + theme.name + '风格的大地图游戏世界配置。\n\n' +
            '【角色信息】\n' +
            '姓名：' + contact.name + '\n' +
            '人设：' + smartPersonaExtract(persona, 800) + '\n' +
            (personaTags.length > 0 ? '性格标签：' + personaTags.join('、') + '\n' : '') +
            (wbContent ? '世界书背景：' + wbContent + '\n' : '') +
            '\n【重要要求】\n' +
            '1. 地点必须符合角色的日常生活习惯和性格特点\n' +
            '2. 联系人日程要体现角色的职业/学业/生活规律\n' +
            '3. 地点描述要有角色专属的细节（比如角色喜欢的咖啡馆、常去的地方）\n' +
            '4. 至少1个隐藏地点（hidden:true），与角色有特殊关联\n\n' +
            '请生成一个JSON对象，包含以下字段（必须严格按JSON格式，不要有注释）：\n' +
            '{\n' +
            '  "locations": [ // 8-10个地点\n' +
            '    {\n' +
            '      "id": "loc_xxx", // 唯一ID\n' +
            '      "name": "地点名称",\n' +
            '      "icon": "emoji图标",\n' +
            '      "type": "simple或complex", // simple直接进剧情，complex显示子场景\n' +
            '      "isOutdoor": true或false,\n' +
            '      "posX": 10-90之间的数字, // 地图X坐标百分比\n' +
            '      "posY": 10-85之间的数字, // 地图Y坐标百分比\n' +
            '      "desc": "地点简介，结合角色特点写1-2句话",\n' +
            '      "hidden": false, // 是否隐藏地点\n' +
            '      "unlockCondition": null,\n' +
            '      "hasJob": true或false,\n' +
            '      "jobName": "打工名称（如果hasJob为true）",\n' +
            '      "jobIncome": 打工收入数字,\n' +
            '      "hasShop": true或false\n' +
            '    }\n' +
            '  ],\n' +
            '  "contactSchedule": {\n' +
            '    "workdays": {\n' +
            '      "8-12": "地点ID",\n' +
            '      "12-13": "地点ID",\n' +
            '      "13-18": "地点ID",\n' +
            '      "18-22": "地点ID",\n' +
            '      "22-24": "home"\n' +
            '    },\n' +
            '    "weekends": {\n' +
            '      "8-11": "地点ID",\n' +
            '      "11-14": "地点ID",\n' +
            '      "14-18": "地点ID",\n' +
            '      "18-22": "地点ID",\n' +
            '      "22-24": "home"\n' +
            '    }\n' +
            '  },\n' +
            '  "homeLocation": { "id": "loc_home", "name": "我的住所", "icon": "🏠", "posX": 85, "posY": 80 },\n' +
            '  "worldBgDesc": "一句话描述这个世界的氛围，体现角色特色"\n' +
            '}\n\n' +
            '注意：地点坐标要分散，不要太密集。地点和日程必须深度契合角色人设。';

        try {
            // [MOD] 不做超时限制
            var resp = await API.chatCompletion([
                    { role: 'system', content: '你是专业的游戏世界设计师，只输出JSON，不输出其他内容。' },
                    { role: 'user', content: prompt }
                ], { maxTokens: 2000 });

            var text = resp.content || resp;
            // 提取JSON
            var jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                var data = JSON.parse(jsonMatch[0]);
                return data;
            }
        } catch (e) {
            console.warn('[OW] generateWorldViaAPI error:', e);
        }
        return null;
    }

    // 生成地点事件缓存（首次访问）
    async function generateLocationEvents(world, locationId) {
        var loc = world.locations.find(function(l) { return l.id === locationId; });
        if (!loc) return [];

        var contact = owGetContact(world.contactId);
        if (!contact) return getDefaultEvents(loc, world);

        var persona = contact.persona || '';
        var relationStage = getRelationStage(world.relationProgress);
        var weather = WEATHER_TYPES[world.weather] || WEATHER_TYPES.sunny;
        var theme = WORLD_THEMES[world.themeKey] || WORLD_THEMES.modern;
        var isContactHere = world.contactCurrentLocation === locationId;

        var recentMemories = (world.sharedMemories || []).slice(-5).join('；');
        var personaTags = extractPersonaTags(contact);

        var prompt = '请为游戏地点"' + loc.name + '"生成5个随机事件，以JSON数组格式返回。\n\n' +
            '【世界背景】' + theme.name + '风格\n' +
            '【联系人】' + contact.name + '\n' +
            '【人设】' + smartPersonaExtract(persona, 500) + '\n' +
            (personaTags.length > 0 ? '【性格标签】' + personaTags.join('、') + '\n' : '') +
            '【当前关系】' + relationStage + '\n' +
            '【当前天气】' + weather.name + '\n' +
            '【近期共同记忆】' + (recentMemories || '暂无') + '\n' +
            '【联系人是否在此处】' + (isContactHere ? '是' : '否') + '\n\n' +
            '每个事件格式：\n' +
            '{\n' +
            '  "id": "evt_xxx",\n' +
            '  "title": "事件标题",\n' +
            '  "type": "dialogue或encounter或work或explore",\n' +
            '  "script": [\n' +
            '    {"type": "narration", "text": "旁白文字"},\n' +
            '    {"type": "dialogue", "speaker": "说话人名字", "text": "对话内容"},\n' +
            '    {"type": "choice", "options": [{"text": "选项文字", "effect": {"money": 0, "relation": 0}, "resultText": "选择后的结果描述"}]}\n' +
            '  ],\n' +
            '  "rewards": {"money": 0, "relation": 0},\n' +
            '  "cooldownDays": 3\n' +
            '}\n\n' +
            '要求：\n' +
            '1. 旁白要有画面感，对话必须符合联系人的性格人设，语气要一致\n' +
            '2. 每个事件有2-3个选项（最后一个script项为choice），选项要有差异化\n' +
            '3. 如果联系人在此处，至少有2个事件涉及与联系人的互动，对话要体现TA的性格\n' +
            '4. 如果有近期共同记忆，可以在事件中自然提及\n' +
            '5. 选项effect中relation表示关系进度变化（-5到+12），money表示金钱变化\n' +
            '6. 只返回JSON数组，不要有其他内容';

        try {
            // [MOD] 不做超时限制
            var resp = await API.chatCompletion([
                    { role: 'system', content: '你是游戏剧本作家，只输出JSON数组。' },
                    { role: 'user', content: prompt }
                ], { maxTokens: 3000 });

            var text = resp.content || resp;
            var jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                var events = JSON.parse(jsonMatch[0]);
                return events;
            }
        } catch (e) {
            console.warn('[OW] generateLocationEvents error:', e);
        }
        return getDefaultEvents(loc, world);
    }

    // 默认事件（API失败时的备用）
    function getDefaultEvents(loc, world) {
        var contact = owGetContact(world.contactId);
        var cname = contact ? contact.name : '神秘人';
        var theme = WORLD_THEMES[world.themeKey] || WORLD_THEMES.modern;
        var isContactHere = world.contactCurrentLocation === loc.id;

        var events = [
            {
                id: 'default_explore_' + loc.id,
                title: '探索' + loc.name,
                type: 'explore',
                script: [
                    { type: 'narration', text: '你来到了' + loc.name + '，四处打量着这个地方。' + loc.desc },
                    { type: 'narration', text: '这里有种独特的氛围，让你忍不住多停留了一会儿。' },
                    { type: 'choice', options: [
                        { text: '仔细探索一番', effect: { money: 0, relation: 1 } },
                        { text: '随便逛逛', effect: { money: 0, relation: 0 } }
                    ]}
                ],
                rewards: { money: 0, relation: 0 },
                cooldownDays: 1
            }
        ];

        if (isContactHere) {
            events.push({
                id: 'default_meet_' + loc.id + '_' + Date.now(),
                title: '偶遇' + cname,
                type: 'encounter',
                script: [
                    { type: 'narration', text: '正在探索时，你注意到一个熟悉的身影——' + cname + '也在这里！' },
                    { type: 'dialogue', speaker: cname, text: '…？你也来这里啊，真巧。' },
                    { type: 'choice', options: [
                        { text: '主动打招呼', effect: { money: 0, relation: 5 } },
                        { text: '装作没看见', effect: { money: 0, relation: -2 } },
                        { text: '微笑点头', effect: { money: 0, relation: 3 } }
                    ]}
                ],
                rewards: { money: 0, relation: 5 },
                cooldownDays: 0
            });
        }

        if (loc.hasJob) {
            events.push({
                id: 'default_job_' + loc.id,
                title: '在' + loc.name + '打工',
                type: 'work',
                script: [
                    { type: 'narration', text: '你来到' + loc.name + '询问是否需要帮手。' },
                    { type: 'dialogue', speaker: '负责人', text: '正好缺人手，你愿意来帮忙吗？工资' + (loc.jobIncome || 80) + '元/次。' },
                    { type: 'choice', options: [
                        { text: '接受工作', effect: { money: loc.jobIncome || 80, relation: 0 } },
                        { text: '婉拒', effect: { money: 0, relation: 0 } }
                    ]}
                ],
                rewards: { money: loc.jobIncome || 80, relation: 0 },
                cooldownDays: 1
            });
        }

        return events;
    }

    // 生成联系人互动剧情（当用户主动找联系人时）
    async function generateContactInteraction(world) {
        var contact = owGetContact(world.contactId);
        if (!contact) return null;

        var loc = world.locations.find(function(l) { return l.id === world.contactCurrentLocation; });
        var locName = loc ? loc.name : '某处';
        var relationStage = getRelationStage(world.relationProgress);
        var persona = contact.persona || '';
        var recentMemories = world.sharedMemories.slice(-5).join('；');
        var weather = WEATHER_TYPES[world.weather] || WEATHER_TYPES.sunny;
        var hour = world.currentHour;
        var timeStr = formatTime(hour);

        var personaTags = extractPersonaTags(contact);
        var moodKey = world.contactMood || 'normal';
        var mood = CONTACT_MOODS[moodKey] || CONTACT_MOODS.normal;

        var prompt = '请为一段"用户主动找联系人"的剧情生成对话脚本，以JSON数组返回（script格式）。\n\n' +
            '【联系人】' + contact.name + '\n' +
            '【完整人设】' + smartPersonaExtract(persona, 600) + '\n' +
            (personaTags.length > 0 ? '【性格标签】' + personaTags.join('、') + '\n' : '') +
            '【当前心情】' + mood.name + '（' + mood.desc + '）\n' +
            '【当前地点】' + locName + '\n' +
            '【当前时间】' + timeStr + '\n' +
            '【当前天气】' + weather.name + '\n' +
            '【关系阶段】' + relationStage + '（进度：' + world.relationProgress + '）\n' +
            '【近期共同记忆】' + (recentMemories || '暂无') + '\n\n' +
            '【重要】对话必须严格符合联系人的性格人设，语气、用词、反应都要体现TA的个性。\n' +
            '心情会影响TA的反应：' + mood.name + '状态下TA会' + getMoodBehaviorHint(moodKey, contact) + '\n\n' +
            '生成一段自然的偶遇对话（4-7个script项），包括：\n' +
            '- 旁白描述场景和氛围\n' +
            '- 联系人的对话（严格符合人设和当前心情）\n' +
            '- 可以有玩家的对话（speaker用"你"）\n' +
            '- 最后一个choice项（2-3个选项，影响relation：-5到+15，选项要有差异化）\n' +
            '- 每个选项要有resultText描述结果\n' +
            '格式：[{"type":"narration","text":"..."},{"type":"dialogue","speaker":"姓名","text":"..."},{"type":"choice","options":[{"text":"...","effect":{"relation":5},"resultText":"..."}]}]\n' +
            '只输出JSON数组。';

        try {
            // [MOD] 不做超时限制
            var resp = await API.chatCompletion([
                    { role: 'system', content: '你是游戏剧本作家，只输出JSON数组。' },
                    { role: 'user', content: prompt }
                ], { maxTokens: 1500 });

            var text = resp.content || resp;
            var jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.warn('[OW] generateContactInteraction error:', e);
        }

        // 备用（V2：根据人设语气类型选择变体对话）
        var tone = getPersonaTone(contact);
        var greetVariants = {
            tsundere: '哼，又是你啊…有什么事快说。',
            gentle: '是你呀，今天也来这里了？',
            cheerful: '哇！你也在这里！太巧了吧！',
            dominant: '你来了。',
            quiet: '……嗯。',
            mature: '哦？今天怎么想到来这里了？',
            neutral: '是你啊，来找我有什么事吗？'
        };
        var greeting = greetVariants[tone] || greetVariants.neutral;
        return [
            { type: 'narration', text: '你在' + locName + '找到了' + contact.name + '。' },
            { type: 'dialogue', speaker: contact.name, text: greeting },
            { type: 'choice', options: [
                { text: '只是路过，顺便打个招呼', effect: { relation: 3 } },
                { text: '想和你一起逛逛', effect: { relation: 6 } },
                { text: '没什么，走了', effect: { relation: -1 } }
            ]}
        ];
    }

    // 人设变体对话模板（用于随机事件中的 {{contact}} 对话替换）
    var TONE_DIALOGUE_VARIANTS = {
        // random_missed_call 的 resultText 变体
        missed_call_reply: {
            tsundere: '"谁、谁说我打给你了！手滑而已！……你要是不忙的话，也不是不能聊两句。"',
            gentle: '"嗯…就是想听听你的声音，没什么事。"',
            cheerful: '"哈哈我就是无聊了想找你玩！你在干嘛呀？"',
            dominant: '"我打给你你就该接。下次别让我等。"',
            quiet: '"……没事。就是……嗯。"',
            mature: '"只是想确认一下你今天还好。"',
            neutral: '"没啥，就是随便打打。"'
        },
        // random_old_photo 的 resultText 变体
        old_photo_reply: {
            tsundere: '"哼，那时候我才没有笑得那么开心……你记错了。"但TA存了那张照片。',
            gentle: '"当然记得呀，那天你还帮我系了鞋带呢…"TA的声音很轻很温柔。',
            cheerful: '"哈哈哈哈我记得！那天你还摔了一跤！笑死我了！"',
            dominant: '"你居然还留着。……我也有。"',
            quiet: '"……记得。"过了很久，TA又发来一条："那天很开心。"',
            mature: '"那是个很好的日子。我们应该再创造一些这样的回忆。"',
            neutral: '"当然记得，那天你还……"两个人聊了好久。'
        },
        // 深夜消息
        late_night_msg: {
            tsundere: '"才、才没有特意等你回消息！我只是睡不着而已！"',
            gentle: '"嗯…就是想和你说说话。今天有点想你。"',
            cheerful: '"你还没睡！太好了！我给你看个超搞笑的视频！"',
            dominant: '"怎么这么晚还不睡。明天不用早起吗。"',
            quiet: '"……还醒着吗。"',
            mature: '"夜深了还没休息？来，陪我聊会天。"',
            neutral: '"没事，就是想说说话……晚安。"'
        }
    };

    // 根据人设语气获取变体对话
    function getToneDialogue(variantKey, contact) {
        var tone = getPersonaTone(contact);
        var variants = TONE_DIALOGUE_VARIANTS[variantKey];
        if (!variants) return null;
        return variants[tone] || variants.neutral || null;
    }

    // 心情行为提示（用于prompt）— V2：结合人设语气类型给出更精准的行为描述
    function getMoodBehaviorHint(moodKey, contact) {
        var tone = contact ? getPersonaTone(contact) : 'neutral';
        // 基础心情描述
        var baseHints = {
            happy:   '心情很好，互动加成高',
            normal:  '状态平稳',
            tired:   '有些疲惫，回应简短',
            sad:     '情绪低落，需要关心',
            excited: '非常亢奋，互动加成最高',
            busy:    '很忙，不喜欢被打扰'
        };
        // 语气类型×心情 = 具体行为描述
        var toneHints = {
            tsundere: {
                happy: '嘴上还是不饶人，但语气明显软了，偶尔会不自觉地笑出来',
                normal: '一如既往地嘴硬，但不会真的拒绝互动',
                tired: '"别烦我……"虽然这么说，但没有真的走开',
                sad: '比平时更沉默，如果被关心会嘴硬说"谁要你管"但其实很感动',
                excited: '虽然很开心但死活不承认，"才、才没有很高兴！"',
                busy: '"没看到我很忙吗？"语气很冲，但如果你坚持留下来TA不会赶你走'
            },
            gentle: {
                happy: '笑容更多了，说话轻柔，会主动关心你',
                normal: '温和地回应，语气平静而温暖',
                tired: '虽然累了但还是会微笑，说话更轻更慢，"没事，就是有点困…"',
                sad: '眼眶微红但强撑微笑，"我没事的…"需要温柔的陪伴',
                excited: '眼睛亮亮的，会拉着你分享开心的事，语气里带着甜意',
                busy: '"抱歉，我现在有点忙…等我一下好吗？"温柔但确实分身乏术'
            },
            cheerful: {
                happy: '话特别多，笑声不断，会拉着你做各种事',
                normal: '依然活力满满，随时准备找乐子',
                tired: '难得安静下来，"今天好累啊~"会撒娇式地抱怨',
                sad: '试图用笑容掩饰，但明显没有平时那么有活力',
                excited: '简直要蹦起来，语速飞快，"天哪天哪你知道吗！"',
                busy: '"等等等等！我马上就好！"手忙脚乱但还是会抽空理你'
            },
            dominant: {
                happy: '心情好时会大方地夸你，甚至主动靠近',
                normal: '带着掌控感，说话简洁有力',
                tired: '不想被打扰，但如果是你的话…"过来，陪我坐一会"',
                sad: '不会轻易示弱，但沉默比平时多，需要你主动靠近',
                excited: '眼里有光，会拉着你一起做TA想做的事，不容拒绝',
                busy: '"现在不行。"简短而不容商量，但之后会主动找你'
            },
            quiet: {
                happy: '虽然不怎么说话，但会多看你几眼，嘴角微微上扬',
                normal: '安静地待着，偶尔回应一两个字',
                tired: '比平时更沉默，可能只是轻轻"嗯"一声',
                sad: '把自己缩起来，不说话，但如果你安静地陪着TA会慢慢靠近',
                excited: '难得话多了一点，虽然还是很简短但能感觉到开心',
                busy: '完全沉浸在自己的事里，可能根本没注意到你来了'
            },
            mature: {
                happy: '优雅地微笑，会用成熟的方式表达欣赏',
                normal: '从容淡定，对话有深度',
                tired: '"今天有点累了呢…"会自然地靠在你身边',
                sad: '不会哭，但眼神里有一丝脆弱，需要理解而非安慰',
                excited: '克制但眼里有光，"这确实是个好消息"',
                busy: '"稍等，我处理完这个。"专业而不失礼貌'
            },
            neutral: {
                happy: '更主动、更健谈，容易被逗笑',
                normal: '正常反应，不冷不热',
                tired: '有些心不在焉，回应简短，不太想多说话',
                sad: '情绪低落，需要关心和安慰，容易被温柔打动',
                excited: '非常亢奋，话多，反应夸张',
                busy: '很忙，回应简短甚至有些不耐烦'
            }
        };
        var toneMap = toneHints[tone] || toneHints.neutral;
        return toneMap[moodKey] || baseHints[moodKey] || '正常反应';
    }

    // ==================== 联系人行为AI ====================

    function updateContactLocation(world) {
        if (!world.contactSchedule) return;

        var hour = world.currentHour;
        var dayOfWeek = getDayOfWeek(world);
        var isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        var schedule = isWeekend ? world.contactSchedule.weekends : world.contactSchedule.workdays;

        if (!schedule) return;

        // [优化] 联系人行为AI增强：心情、天气、好感度影响位置选择
        var useSchedule = Math.random() < 0.8;
        var targetLocId = null;

        if (useSchedule && schedule) {
            var keys = Object.keys(schedule);
            for (var i = 0; i < keys.length; i++) {
                var range = keys[i].split('-');
                var start = parseInt(range[0]);
                var end = parseInt(range[1]);
                if (hour >= start && hour < end) {
                    targetLocId = schedule[keys[i]];
                    break;
                }
            }
        }

        if (!targetLocId || !useSchedule) {
            var availLocs = world.locations.filter(function(l) { return !l.hidden; });
            // [优化] 心情影响位置选择
            var moodKey = world.contactMood || 'normal';
            if (moodKey === 'sad' || moodKey === 'tired') {
                // 心情不好时偏好室内地点
                var indoorLocs = availLocs.filter(function(l) { return !l.isOutdoor; });
                if (indoorLocs.length > 0) availLocs = indoorLocs;
            }
            // [优化] 天气影响位置选择
            var weatherType = WEATHER_TYPES[world.weather];
            if (weatherType && !weatherType.outdoorOpen) {
                // 恶劣天气不去户外
                var shelterLocs = availLocs.filter(function(l) { return !l.isOutdoor; });
                if (shelterLocs.length > 0) availLocs = shelterLocs;
            }
            // [优化] 好感度高时更可能出现在玩家附近
            if (world.relationProgress >= 80 && world.playerLocation && world.playerLocation !== 'home' && Math.random() < 0.25) {
                targetLocId = world.playerLocation;
            } else if (availLocs.length > 0) {
                targetLocId = owRandom(availLocs).id;
            }
        }

        if (targetLocId) {
            world.contactCurrentLocation = targetLocId;
        }
    }

    function getDayOfWeek(world) {
        // 简单模拟：按天数循环
        return world.currentDay % 7;
    }

    // ==================== 回合推进 ====================

    function advanceTurn(world) {
        world.currentTurns++;
        world.totalTurns++;
        world.currentHour += HOURS_PER_TURN;

        // 更新联系人位置
        updateContactLocation(world);

        // 检查一天结束
        if (world.currentTurns >= world.maxTurnsPerDay || world.currentHour >= 24) {
            // 不强制结束，但提示
            world._dayEndWarning = world.currentTurns >= world.maxTurnsPerDay;
        }

        return world;
    }

    function nextDay(world) {
        world.currentDay++;
        world.totalDays++;
        world.currentTurns = 0;
        world.currentHour = DAY_START_HOUR;
        world._dayEndWarning = false;
        world.nightOwlChecked = false;
        world.consecutiveOutdoorRainCount = 0;

        // [优化] 每日数据清理：重置仅当天有效的缓存，防止存档膨胀
        world.todayExploreCount = {};
        world.npcLocationCache = {};
        // [优化] triggeredEvents 上限100条，防止长期游玩数组膨胀
        if (world.triggeredEvents && world.triggeredEvents.length > 100) {
            world.triggeredEvents = world.triggeredEvents.slice(-100);
        }

        // Fix2: 正确推进月内日期和月份
        if (!world.currentDayOfMonth) world.currentDayOfMonth = 1;
        world.currentDayOfMonth++;
        if (world.currentDayOfMonth > 30) {
            world.currentDayOfMonth = 1;
            world.currentMonth = (world.currentMonth % 12) + 1;
            if (world.currentMonth === 1) {
                world.currentYear++;
            }
        }

        // 生成新天气
        world.weather = generateWeather(world);
        world.weatherHistory.push(world.weather);
        if (world.weatherHistory.length > 30) world.weatherHistory.shift();

        // 更新联系人位置
        updateContactLocation(world);

        return world;
    }

    // ==================== 随机事件系统 ====================

    var RANDOM_EVENTS_POOL = [
        {
            id: 'random_early_sunrise',
            type: 'surprise',
            name: '清晨日出',
            probability: 0.07,
            conditions: {},
            script: [
                { type: 'narration', text: '清晨的空气格外清新，天边泛起了橙红色的霞光。' },
                { type: 'narration', text: '你不由自主地放慢了脚步，看着这一幕安静的日出。' },
                { type: 'choice', options: [
                    { text: '拍下这幕美景发给某人', effect: { relation: 4 }, resultText: '你选了一张最美的，默默发了出去。过了一会儿，收到了一个小心心。' },
                    { text: '独自欣赏，静静感受', effect: { relation: 1 }, resultText: '有些美好不需要分享，独享反而更珍贵。' }
                ]}
            ],
            cooldownDays: 5
        },
        {
            id: 'random_stray_cat',
            type: 'encounter',
            name: '街边流浪猫',
            probability: 0.09,
            conditions: {},
            script: [
                { type: 'narration', text: '街角一只橘色的流浪猫正蜷缩在纸箱里，对你歪了歪头。' },
                { type: 'choice', options: [
                    { text: '买了包猫粮喂它（花¥20）', effect: { money: -20, relation: 3 }, resultText: '猫咪大口大口地吃着，你莫名觉得心里软软的。', condition: { minMoney: 20 } },
                    { text: '蹲下来摸摸它', effect: { relation: 2 }, resultText: '它居然让你摸了，喉咙里还发出咕噜咕噜的声音。' },
                    { text: '拍了张照片继续走', effect: {}, resultText: '留下一张可爱的纪念，心情好了一点。' }
                ]}
            ],
            cooldownDays: 4
        },
        {
            id: 'random_missed_call',
            type: 'surprise',
            name: '未接来电',
            probability: 0.06,
            conditions: { minRelation: 30 },
            script: [
                { type: 'narration', text: '你掏出手机，发现有一个未接电话——是{{contact}}。' },
                { type: 'narration', text: '也不知道是什么事，你的心跳莫名加快了一下。' },
                { type: 'choice', options: [
                    { text: '立刻回拨过去', effect: { relation: 6 }, resultText: '电话接通，那头的声音有点意外，又有点高兴。' },
                    { text: '发条消息问发生了什么', effect: { relation: 3 }, resultText: '"没啥，就是随便打打。"你盯着这条回复看了好久。' },
                    { text: '假装没看到，等下再说', effect: { relation: -2 }, resultText: '你把手机揣了回去，心里有点过意不去。' }
                ]}
            ],
            cooldownDays: 10
        },
        {
            id: 'random_old_photo',
            type: 'surprise',
            name: '翻到旧照片',
            probability: 0.05,
            conditions: { minRelation: 50 },
            script: [
                { type: 'narration', text: '整理手机时，翻到了一张你们一起的旧照片。' },
                { type: 'narration', text: '那时候好像还没有现在这么熟，却笑得那么自然。' },
                { type: 'choice', options: [
                    { text: '把照片发给对方：你还记得这天吗', effect: { relation: 8 }, resultText: '"当然记得，那天你还……"两个人聊了好久。' },
                    { text: '悄悄设为手机壁纸', effect: { relation: 0 }, resultText: '你笑了笑，悄悄换上了。' }
                ]}
            ],
            cooldownDays: 14
        },
        {
            id: 'random_sudden_downpour',
            type: 'emergency',
            name: '突如其来的暴雨',
            probability: 0.10,
            conditions: { weather: 'heavyrain' },
            script: [
                { type: 'narration', text: '暴雨毫无预兆地倾盆而下，你被困在屋檐下动弹不得。' },
                { type: 'choice', options: [
                    { text: '给{{contact}}发消息说被困住了', effect: { relation: 5 }, resultText: '"真的假的，你怎么那么倒霉哈哈……要我去接你吗？"' },
                    { text: '硬着头皮冲出去', effect: { money: 0, relation: 0 }, resultText: '你被淋成了落汤鸡，但总算到了地方。' },
                    { text: '点了杯热饮，等雨停', effect: { money: -25 }, resultText: '¥25换了一段悠闲的雨天时光，还算值得。', condition: { minMoney: 25 } }
                ]}
            ],
            cooldownDays: 7
        },
        {
            id: 'random_kind_stranger',
            type: 'encounter',
            name: '好心陌生人',
            probability: 0.07,
            conditions: {},
            script: [
                { type: 'narration', text: '你不小心把东西撒了一地，一个陌生人蹲下来帮你捡。' },
                { type: 'dialogue', speaker: '陌生人', text: '没事的，都是小事～' },
                { type: 'choice', options: [
                    { text: '真诚道谢，聊了几句', effect: { relation: 2 }, resultText: '这世界上还是好人多，你心里暖暖的。' },
                    { text: '道谢后快步离开', effect: {}, resultText: '回头望了一眼，对方已经消失在人群里了。' }
                ]}
            ],
            cooldownDays: 5
        },
        {
            id: 'random_bonus_day',
            type: 'fortune',
            name: '意外奖金',
            probability: 0.05,
            conditions: {},
            script: [
                { type: 'narration', text: '手机收到一条通知——你之前参加的活动中奖了！' },
                { type: 'choice', options: [
                    { text: '接受奖品（+¥300）', effect: { money: 300 }, resultText: '¥300已到账，今天运气真不错！' },
                    { text: '捐给慈善机构', effect: { relation: 5 }, resultText: '你捐出去了，也许好事会回报你。' }
                ]}
            ],
            cooldownDays: 15
        },
        {
            id: 'random_found_money',
            type: 'fortune',
            name: '意外之财',
            probability: 0.08,
            conditions: {},
            script: [
                { type: 'narration', text: '路上，你发现地上有一个钱包…' },
                { type: 'choice', options: [
                    { text: '捡起来，找警察上交', effect: { money: 50, relation: 2 }, resultText: '你上交了钱包，警察说会联系失主。你心里挺高兴的。' },
                    { text: '捡起来，据为己有', effect: { money: 200, relation: -3 }, resultText: '钱包里有200元…但你总觉得心里有点不安。' },
                    { text: '不管它，继续走', effect: {}, resultText: '你假装没看见，继续走。' }
                ]}
            ],
            cooldownDays: 7
        },
        {
            id: 'random_bump_into_npc',
            type: 'encounter',
            name: '偶遇路人',
            probability: 0.10,
            conditions: {},
            script: [
                { type: 'narration', text: '前方有人在分发传单，看起来是附近新开的店在做宣传。' },
                { type: 'choice', options: [
                    { text: '接过来看看', effect: { money: 0 }, resultText: '是一张折扣券，下次购物可以用得上。' },
                    { text: '摆手拒绝', effect: {}, resultText: '你礼貌地摆摆手，继续前行。' }
                ]}
            ],
            cooldownDays: 3
        },
        {
            id: 'random_flash_sale',
            type: 'surprise',
            name: '限时特卖',
            probability: 0.06,
            conditions: {},
            script: [
                { type: 'narration', text: '附近一家店正在清仓特卖，商品只要平时的一半价格！' },
                { type: 'choice', options: [
                    { text: '进去扫货（花¥100）', effect: { money: -100 }, resultText: '你买了一堆实用的东西，感觉很划算！', condition: { minMoney: 100 } },
                    { text: '随便看看，不买', effect: {}, resultText: '光看不买，逛了一圈就出来了。' }
                ]}
            ],
            cooldownDays: 5
        },
        {
            id: 'random_rain_encounter',
            type: 'encounter',
            name: '雨中邂逅',
            probability: 0.12,
            conditions: { weather: 'rain', minRelation: 20 },
            script: [
                { type: 'narration', text: '雨突然下大了，你没带伞，只好躲在屋檐下。' },
                { type: 'narration', text: '这时，一把伞悄悄伸到了你头顶。' },
                { type: 'dialogue', speaker: '{{contact}}', text: '又没带伞？走，我送你一段。' },
                { type: 'choice', options: [
                    { text: '谢谢你，一起走吧', effect: { relation: 8 }, resultText: '你们撑着一把伞，在雨中慢慢走着，有说有笑。' },
                    { text: '不用了，我等雨停', effect: { relation: 1 }, resultText: '你婉拒了，但心里其实挺暖的。' },
                    { text: '(沉默地靠近，接过伞)', effect: { relation: 10 }, resultText: '两个人靠得很近，心跳不知为何加速了一些。' }
                ]}
            ],
            cooldownDays: 14
        },
        {
            id: 'random_pickpocket',
            type: 'emergency',
            name: '遭遇扒手',
            probability: 0.04,
            conditions: { minMoney: 100 },
            script: [
                { type: 'narration', text: '在拥挤的地方，你感觉口袋里有什么动了一下！' },
                { type: 'choice', options: [
                    { text: '迅速反应，抓住对方手腕', effect: { money: 0 }, resultText: '你反应够快，对方当场跑掉了，没有损失。' },
                    { text: '没来得及，被偷走了', effect: { money: -100 }, resultText: '等你反应过来，钱包已经被摸走了！损失了¥100。' }
                ]}
            ],
            cooldownDays: 14
        },
        {
            id: 'random_lucky_scratch',
            type: 'fortune',
            name: '中奖刮刮乐',
            probability: 0.03,
            conditions: {},
            script: [
                { type: 'narration', text: '你随手买了一张刮刮乐……' },
                { type: 'narration', text: '刮开一看——中了！虽然不多，但运气不错！' },
                { type: 'choice', options: [
                    { text: '好运来了，继续买一张', effect: { money: owRandInt(-50, 200) }, resultText: '运气这东西真说不准…' },
                    { text: '见好就收', effect: { money: 100 }, resultText: '拿着奖金，心情不错。' }
                ]}
            ],
            cooldownDays: 7
        },
        {
            id: 'random_snow_moment',
            type: 'surprise',
            name: '初雪',
            probability: 0.15,
            conditions: { weather: 'snow' },
            script: [
                { type: 'narration', text: '今冬的第一场雪，悄悄地落了下来。' },
                { type: 'narration', text: '大地披上了白色，整个世界安静得出奇。' },
                { type: 'choice', options: [
                    { text: '拍下这一刻', effect: { relation: 2 }, resultText: '你拍了几张照片，想着要分享给某人看。' },
                    { text: '伸手接住雪花', effect: { relation: 3 }, resultText: '雪花落在掌心，瞬间融化，像是什么短暂的美好。' }
                ]}
            ],
            cooldownDays: 30
        }
    ];

    // 节日事件池
    var FESTIVAL_EVENTS = {
        festival_valentine: {
            id: 'festival_valentine', type: 'festival', name: '情人节特别活动',
            script: [
                { type: 'narration', text: '今天是情人节，街上到处都是粉红色的装饰，空气里弥漫着玫瑰的香气。' },
                { type: 'narration', text: '你的手机震动了一下——是{{contact}}发来的消息。' },
                { type: 'dialogue', speaker: '{{contact}}', text: '今天是情人节……你有什么打算吗？' },
                { type: 'choice', options: [
                    { text: '约TA一起去看电影', effect: { relation: 15, money: -80 }, resultText: '两人并肩坐在黑暗的影院里，心跳比剧情还紧张。' },
                    { text: '送TA一束玫瑰', effect: { relation: 12, money: -60 }, resultText: '收到花的瞬间，TA的脸微微红了。' },
                    { text: '发一条"节日快乐"', effect: { relation: 5 }, resultText: '"谢谢……"TA回复得很快，但你总觉得少了点什么。' },
                    { text: '假装忘了这个节日', effect: { relation: -5 }, resultText: '你没有回复，手机屏幕慢慢暗了下去。' }
                ]}
            ], cooldownDays: 365
        },
        festival_qixi: {
            id: 'festival_qixi', type: 'festival', name: '七夕鹊桥会',
            script: [
                { type: 'narration', text: '七夕夜，星河璀璨，牛郎织女在鹊桥相会的传说让这个夜晚格外浪漫。' },
                { type: 'dialogue', speaker: '{{contact}}', text: '你知道吗，据说今晚许愿特别灵验……' },
                { type: 'choice', options: [
                    { text: '和TA一起仰望星空', effect: { relation: 12 }, resultText: '两人静静地躺在草地上，数着星星，谁也没有先开口。' },
                    { text: '问TA许了什么愿', effect: { relation: 8 }, resultText: '"不能说，说了就不灵了。"TA神秘地笑了笑。' },
                    { text: '悄悄许愿：希望和TA在一起', effect: { relation: 10 }, resultText: '你闭上眼睛，心里默默说出了那个名字。' }
                ]}
            ], cooldownDays: 365
        },
        festival_xmaseve: {
            id: 'festival_xmaseve', type: 'festival', name: '平安夜',
            script: [
                { type: 'narration', text: '平安夜，城市里亮起了无数彩灯，教堂的钟声悠远地传来。' },
                { type: 'dialogue', speaker: '{{contact}}', text: '平安夜快乐～你一个人吗？' },
                { type: 'choice', options: [
                    { text: '邀请TA一起去逛夜市', effect: { relation: 14, money: -50 }, resultText: '两人在灯火阑珊处漫步，苹果的香甜混着冬夜的冷意，格外温暖。' },
                    { text: '互赠平安果', effect: { relation: 10, money: -30 }, resultText: '你精心挑了一个最红的苹果，TA接过来，笑得很甜。' },
                    { text: '发语音说平安夜快乐', effect: { relation: 6 }, resultText: '"你的声音……好好听。"TA回了一条语音，你反复听了好几遍。' }
                ]}
            ], cooldownDays: 365
        },
        festival_520: {
            id: 'festival_520', type: 'festival', name: '520表白日',
            script: [
                { type: 'narration', text: '5月20日，"我爱你"的谐音日，朋友圈里全是秀恩爱的动态。' },
                { type: 'narration', text: '你盯着{{contact}}的头像，手指悬在屏幕上，迟迟没有按下去。' },
                { type: 'choice', options: [
                    { text: '鼓起勇气发"520"', effect: { relation: 18 }, resultText: '"……我也是。"TA的回复让你心跳漏了一拍。', condition: { minRelation: 80 } },
                    { text: '发一个爱心表情', effect: { relation: 8 }, resultText: 'TA回了一个同款爱心，你盯着看了很久。' },
                    { text: '什么都没发，默默关掉手机', effect: { relation: 0 }, resultText: '也许时机还没到……你这样安慰自己。' }
                ]}
            ], cooldownDays: 365
        },
        festival_newyear: {
            id: 'festival_newyear', type: 'festival', name: '元旦跨年',
            script: [
                { type: 'narration', text: '新年的钟声即将敲响，烟花在夜空中绽放，人群的欢呼声此起彼伏。' },
                { type: 'dialogue', speaker: '{{contact}}', text: '新年快乐！今年……谢谢你一直陪着我。' },
                { type: 'choice', options: [
                    { text: '新年快乐，希望我们……一直这样', effect: { relation: 15 }, resultText: '烟花在你们头顶炸开，那一刻，时间好像停住了。' },
                    { text: '许个愿吧，我们一起', effect: { relation: 12 }, resultText: '两人闭上眼睛，在烟花声中许下了各自的心愿。' },
                    { text: '新年快乐！明年也请多关照', effect: { relation: 8 }, resultText: '"当然。"TA笑着说，眼睛里有烟花的倒影。' }
                ]}
            ], cooldownDays: 365
        }
    };

    // 更多随机事件（追加到RANDOM_EVENTS_POOL）
    var EXTRA_RANDOM_EVENTS = [
        {
            id: 'random_music_busker',
            type: 'encounter', name: '街头艺人',
            probability: 0.08, conditions: {},
            script: [
                { type: 'narration', text: '街角有个年轻人在弹吉他，歌声清澈，路人纷纷驻足。' },
                { type: 'choice', options: [
                    { text: '停下来听完一首', effect: { relation: 2 }, resultText: '那首歌莫名让你想起了某个人。' },
                    { text: '投了点零钱', effect: { money: -10, relation: 3 }, resultText: '艺人朝你点头致谢，继续唱着。' },
                    { text: '拍了个视频发给{{contact}}', effect: { relation: 5 }, resultText: '"好好听！下次带我去。"TA回复道。' }
                ]}
            ], cooldownDays: 6
        },
        {
            id: 'random_coffee_spill',
            type: 'emergency', name: '咖啡洒了',
            probability: 0.06, conditions: {},
            script: [
                { type: 'narration', text: '一不小心，手里的咖啡洒在了衣服上，棕色的印迹格外显眼。' },
                { type: 'choice', options: [
                    { text: '赶紧去洗手间处理', effect: {}, resultText: '用纸巾擦了半天，好了一些，但还是有点痕迹。' },
                    { text: '给{{contact}}发消息吐槽', effect: { relation: 4 }, resultText: '"哈哈哈你也太倒霉了！"TA发来一串笑脸，你也忍不住笑了。' },
                    { text: '买件新衣服换上', effect: { money: -150 }, resultText: '¥150换了一件新衣服，意外地还挺好看。', condition: { minMoney: 150 } }
                ]}
            ], cooldownDays: 5
        },
        {
            id: 'random_dream_about_contact',
            type: 'surprise', name: '梦见了TA',
            probability: 0.07, conditions: { minRelation: 40 },
            script: [
                { type: 'narration', text: '昨晚做了个梦，梦里有{{contact}}的身影，醒来后细节已经模糊，只记得心情很好。' },
                { type: 'choice', options: [
                    { text: '发消息告诉TA', effect: { relation: 7 }, resultText: '"……真的假的。"TA沉默了一会儿，然后说："我也梦见你了。"' },
                    { text: '悄悄记在日记里', effect: { relation: 2 }, resultText: '有些事，放在心里就好。' },
                    { text: '假装什么都没发生', effect: {}, resultText: '你把这个梦压在心底，继续开始新的一天。' }
                ]}
            ], cooldownDays: 10
        },
        {
            id: 'random_shared_playlist',
            type: 'surprise', name: '歌单推荐',
            probability: 0.07, conditions: { minRelation: 30 },
            script: [
                { type: 'narration', text: '{{contact}}突然给你发来一个歌单，备注写着："最近一直在听，分享给你。"' },
                { type: 'choice', options: [
                    { text: '认真听完，逐一回复感受', effect: { relation: 9 }, resultText: '你们聊了好久，从音乐聊到了各自的故事。' },
                    { text: '收藏了，说"谢谢推荐"', effect: { relation: 4 }, resultText: '"喜欢就好。"TA简短地回了一句。' },
                    { text: '也给TA推荐一个你的歌单', effect: { relation: 7 }, resultText: '"哇，这首我也喜欢！"TA惊喜地回复。' }
                ]}
            ], cooldownDays: 12
        },
        {
            id: 'random_help_stranger',
            type: 'encounter', name: '帮助迷路的老人',
            probability: 0.06, conditions: {},
            script: [
                { type: 'narration', text: '一位老人站在路口，手里拿着地图，一脸茫然地四处张望。' },
                { type: 'choice', options: [
                    { text: '主动上前帮忙指路', effect: { relation: 3 }, resultText: '老人连声道谢，说你是个好孩子。心里暖暖的。' },
                    { text: '帮老人打车', effect: { money: -30, relation: 5 }, resultText: '老人感激地握住你的手，你觉得这¥30花得值。', condition: { minMoney: 30 } },
                    { text: '假装没看见', effect: { relation: -1 }, resultText: '走了几步，你回头看了一眼，老人还站在那里。' }
                ]}
            ], cooldownDays: 7
        },
        {
            id: 'random_late_night_text',
            type: 'surprise', name: '深夜消息',
            probability: 0.08, conditions: { minRelation: 50 },
            script: [
                { type: 'narration', text: '深夜十一点，手机突然亮了——是{{contact}}发来的消息："你睡了吗？"' },
                { type: 'choice', options: [
                    { text: '"没有，怎么了？"', effect: { relation: 10 }, resultText: '两人聊到了凌晨，说了很多平时不会说的话。' },
                    { text: '"刚要睡，有事吗？"', effect: { relation: 5 }, resultText: '"没事，就是想说说话……晚安。"你盯着这条消息，久久没有回复。' },
                    { text: '已读不回，假装睡着了', effect: { relation: -3 }, resultText: '第二天，TA没有再提起这件事。' }
                ]}
            ], cooldownDays: 14
        },
        {
            id: 'random_cooking_together',
            type: 'encounter', name: '一起做饭',
            probability: 0.06, conditions: { minRelation: 60 },
            script: [
                { type: 'narration', text: '{{contact}}说想学做一道菜，问你会不会做。' },
                { type: 'choice', options: [
                    { text: '说会，约TA一起做', effect: { relation: 14, money: -50 }, resultText: '厨房里笑声不断，菜虽然做得一般，但两人都说是最好吃的一顿。', condition: { minMoney: 50 } },
                    { text: '不会，但愿意一起学', effect: { relation: 10 }, resultText: '两个厨房小白凑在一起，结果出乎意料地还不错。' },
                    { text: '推荐TA看教程', effect: { relation: 3 }, resultText: '"好吧……"TA有点失望，但还是说了谢谢。' }
                ]}
            ], cooldownDays: 10
        }
    ];

    // ==================== 心情/节日/职业等级辅助函数 ====================

    // 生成/获取联系人今日心情
    function getContactMood(world) {
        if (!world.contactMoodDay || world.contactMoodDay !== world.currentDay) {
            var moodKeys = Object.keys(CONTACT_MOODS);
            // 关系越好，心情越可能好
            var weights = { happy: 20, normal: 30, tired: 15, sad: 10, excited: 10, busy: 15 };
            if (world.relationProgress >= 80) { weights.happy = 35; weights.excited = 20; weights.sad = 5; }
            if (world.relationProgress >= 150) { weights.happy = 40; weights.excited = 25; weights.busy = 5; }
            var total = Object.values(weights).reduce(function(a, b) { return a + b; }, 0);
            var r = Math.random() * total;
            var cum = 0;
            var picked = 'normal';
            for (var k in weights) {
                cum += weights[k];
                if (r < cum) { picked = k; break; }
            }
            world.contactMood = picked;
            world.contactMoodDay = world.currentDay;
        }
        return world.contactMood || 'normal';
    }

    // 检测今天是否是节日
    function getTodayFestival(world) {
        var month = world.currentMonth;
        var day = world.currentDayOfMonth;
        return FESTIVALS.find(function(f) { return f.month === month && f.day === day; }) || null;
    }

    // 获取职业等级信息
    function getJobLevel(world, jobId) {
        if (!world.jobLevelMap) world.jobLevelMap = {};
        if (!world.jobLevelMap[jobId]) world.jobLevelMap[jobId] = { level: 0, exp: 0 };
        return world.jobLevelMap[jobId];
    }

    // 打工后增加经验，返回是否升级
    function addJobExp(world, jobId) {
        var lvData = getJobLevel(world, jobId);
        lvData.exp++;
        var maxLv = JOB_LEVEL_CONFIG.maxLevel - 1;
        if (lvData.level < maxLv) {
            var needed = JOB_LEVEL_CONFIG.expPerLevel[lvData.level + 1];
            if (lvData.exp >= needed) {
                lvData.level++;
                return true; // 升级了
            }
        }
        return false;
    }

    // 计算打工实际收入（含等级加成）
    function calcJobIncome(world, baseIncome, jobId) {
        var lvData = getJobLevel(world, jobId || world.playerJob || 'waiter');
        var mult = JOB_LEVEL_CONFIG.incomeMultiplier[lvData.level] || 1.0;
        return Math.round(baseIncome * mult);
    }

    // 获取联系人下一个日程时间段（用于"预计停留"提示）
    function getContactNextScheduleSlot(world) {
        if (!world.contactSchedule) return null;
        var hour = world.currentHour;
        var dayOfWeek = getDayOfWeek(world);
        var isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        var schedule = isWeekend ? world.contactSchedule.weekends : world.contactSchedule.workdays;
        if (!schedule) return null;
        var keys = Object.keys(schedule);
        for (var i = 0; i < keys.length; i++) {
            var range = keys[i].split('-');
            var start = parseInt(range[0]);
            var end = parseInt(range[1]);
            if (hour >= start && hour < end) {
                return { locId: schedule[keys[i]], until: end };
            }
        }
        return null;
    }

    function checkRandomEvent(world) {
        var weather = world.weather;
        var relation = world.relationProgress;

        // 合并基础事件池 + 额外事件池
        var allEvents = RANDOM_EVENTS_POOL.concat(EXTRA_RANDOM_EVENTS);

        // 过滤可触发的事件
        var eligible = allEvents.filter(function(evt) {
            // 检查冷却
            var lastDay = world.randomEventCooldown[evt.id] || 0;
            if (world.currentDay - lastDay < evt.cooldownDays) return false;

            // 检查条件
            var cond = evt.conditions || {};
            if (cond.weather && cond.weather !== weather) return false;
            if (cond.minRelation && relation < cond.minRelation) return false;
            if (cond.minMoney && world.playerMoney < cond.minMoney) return false;

            return true;
        });

        if (eligible.length === 0) return null;

        // 计算总概率
        var totalProb = eligible.reduce(function(sum, e) { return sum + e.probability; }, 0);
        var roll = Math.random();

        // 基础触发概率15%，天气加成，心情加成
        var weatherBonus = (WEATHER_TYPES[weather] || WEATHER_TYPES.sunny).eventBonus || 0;
        var moodKey = getContactMood(world);
        var moodMult = CONTACT_MOODS[moodKey] ? CONTACT_MOODS[moodKey].relationMult : 1.0;
        // 心情好时事件概率略高，心情差时略低
        var moodBonus = (moodMult - 1.0) * 0.06;
        var triggerThreshold = 0.15 + weatherBonus + moodBonus;

        if (roll > triggerThreshold) return null;

        // 在已过滤事件中随机选一个
        var pick = Math.random() * totalProb;
        var cum = 0;
        for (var i = 0; i < eligible.length; i++) {
            cum += eligible[i].probability;
            if (pick <= cum) return eligible[i];
        }
        return eligible[eligible.length - 1];
    }

    // 检测节日事件（每天进入地图时调用一次）
    function checkFestivalEvent(world) {
        var festival = getTodayFestival(world);
        if (!festival) return null;
        if (!world.triggeredFestivals) world.triggeredFestivals = [];
        // 每个节日每年只触发一次（用 year_eventId 作key）
        var key = world.currentYear + '_' + festival.eventId;
        if (world.triggeredFestivals.indexOf(key) >= 0) return null;
        var evt = FESTIVAL_EVENTS[festival.eventId];
        if (!evt) return null;
        world.triggeredFestivals.push(key);
        return { festival: festival, event: evt };
    }

    // ==================== 成就系统 ====================

    function checkAndUnlockAchievements(world, trigger, data) {
        var unlocked = [];

        function tryUnlock(id) {
            if (world.achievements[id] && world.achievements[id].unlocked) return;
            var def = ACHIEVEMENTS_DEF.find(function(a) { return a.id === id; });
            if (!def) return;
            // Fix3: 同时记录解锁时的游戏天数
            world.achievements[id] = { unlocked: true, unlockedAt: Date.now(), unlockedDay: world.currentDay };

            // 给奖励
            if (def.reward) {
                if (def.reward.money) {
                    world.playerMoney += def.reward.money;
                }
            }

            unlocked.push(def);
        }

        // 根据触发类型检查
        switch (trigger) {
            case 'first_enter':
                tryUnlock('first_enter');
                break;
            case 'location_visit':
                var visitedCount = (world.locationsVisited || []).length;
                var totalLocs = world.locations ? world.locations.filter(function(l) { return !l.hidden; }).length : 0;
                if (visitedCount >= totalLocs && totalLocs > 0) tryUnlock('explorer');
                if (data && data.hidden) tryUnlock('hidden_finder');
                break;
            case 'contact_meet':
                if ((world.contactMetCount || 0) === 1) tryUnlock('first_meet');
                if ((world.consecutiveMeetCount || 0) >= 3) tryUnlock('regular_visitor');
                // 连续3回合去联系人所在地
                if ((world._consecutiveFollowCount || 0) >= 5) tryUnlock('stalker');
                break;
            case 'relation_change':
                if (getRelationStage(world.relationProgress) === '恋人') tryUnlock('lovers');
                break;
            case 'job_done':
                if ((world.jobHistory || []).length === 1) tryUnlock('first_job');
                break;
            case 'money_change':
                if (world.playerMoney >= 10000) tryUnlock('small_savings');
                if (world.playerMoney >= 100000) tryUnlock('rich');
                break;
            case 'car_bought':
                tryUnlock('car_owner');
                break;
            case 'house_bought':
                tryUnlock('homeowner');
                break;
            case 'event_triggered':
                world.eventCount = (world.eventCount || 0) + 1;
                if (world.eventCount === 1) tryUnlock('first_story');
                if (world.eventCount >= 30) tryUnlock('story_collector');
                if (data && data.rarity === 'rare') tryUnlock('lucky_one');
                break;
            case 'random_event':
                world.consecutiveRandomEvents = (world.consecutiveRandomEvents || 0) + 1;
                if (world.consecutiveRandomEvents >= 3) tryUnlock('lucky_chain');
                break;
            case 'rain_outdoor':
                world.consecutiveOutdoorRainCount = (world.consecutiveOutdoorRainCount || 0) + 1;
                if (world.consecutiveOutdoorRainCount >= 3) tryUnlock('rain_walk');
                break;
            case 'night_owl':
                if (!world.nightOwlChecked) {
                    world.nightOwlChecked = true;
                    tryUnlock('night_owl');
                }
                break;
            case 'npc_favorability':
                // 检查5个NPC好感度50+
                var highFavCount = Object.values(world.npcFavorability || {}).filter(function(v) { return v >= 50; }).length;
                if (highFavCount >= 5) tryUnlock('social_butterfly');
                break;
        }

        return unlocked;
    }

    // ==================== 商店与打工 ====================

    var SHOP_ITEMS = [
        { id: 'coffee', name: '咖啡', icon: '☕', price: 35, effect: { relation: 2 }, desc: '送给联系人，增进关系' },
        { id: 'flower', name: '鲜花', icon: '💐', price: 88, effect: { relation: 8 }, desc: '浪漫的礼物' },
        { id: 'cake', name: '蛋糕', icon: '🎂', price: 120, effect: { relation: 10 }, desc: '甜蜜的心意' },
        { id: 'jewelry', name: '精美首饰', icon: '💍', price: 500, effect: { relation: 20 }, desc: '精心挑选的礼物' },
        { id: 'car_basic', name: '代步车', icon: '🚗', price: 5000, type: 'property', subtype: 'car', desc: '解锁远郊地点，可以载联系人兜风', unlocks: ['far_locations'] },
        { id: 'car_sport', name: '跑车', icon: '🏎️', price: 50000, type: 'property', subtype: 'car', desc: '豪华座驾，大幅提升印象分', unlocks: ['far_locations'], relationBonus: 15 },
        { id: 'house_small', name: '小公寓', icon: '🏠', price: 50000, type: 'property', subtype: 'house', desc: '解锁"邀请回家"选项，触发同居剧情线' },
        { id: 'house_big', name: '大别墅', icon: '🏡', price: 200000, type: 'property', subtype: 'house', desc: '豪华住所，解锁专属剧情', relationBonus: 30 }
    ];

    var JOB_LIST = [
        { id: 'waiter', name: '服务员', icon: '🍽️', income: 50, desc: '餐厅/咖啡馆打工', available: true },
        { id: 'tutor', name: '家教', icon: '📚', income: 80, desc: '上门辅导中小学生', available: true },
        { id: 'programmer', name: '程序员', icon: '💻', income: 120, desc: '远程接单做开发', available: true },
        { id: 'delivery', name: '外卖骑手', icon: '🛵', income: 60, desc: '送外卖，体力消耗大', available: true },
        { id: 'cashier', name: '收银员', icon: '🏪', income: 45, desc: '超市/便利店收银', available: true },
        { id: 'freelancer', name: '自由职业', icon: '🎨', income: 0, incomeRandom: [30, 200], desc: '收入不稳定，但自由', available: true }
    ];

    // ==================== 主渲染函数 ====================

    function renderContainer(withTransition) {
        var el = owEl('map-content');
        if (!el) return;
        el.style.padding = '0';
        el.style.overflow = 'hidden';
        el.style.background = '#000';
        // 页面切换过渡动画
        if (withTransition !== false && owState._lastView && owState._lastView !== owState.currentView) {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.22s ease';
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    el.style.opacity = '1';
                });
            });
        }
        owState._lastView = owState.currentView;
        return el;
    }

    // 联系人选择页
    function renderContactSelect() {
        var el = renderContainer();
        if (!el) return;

        var contacts = (store.contacts || []).filter(function(c) { return !c.isGroup; });
        var html = '<div class="ow-select-page">';
        // [FIX-返回键] 联系人选择页顶部返回按钮
        html += '<div class="ow-select-back" onclick="closeLayer(\'layer-map\')"><i class="fas fa-chevron-left"></i></div>';
        html += '<div class="ow-select-header">';
        html += '<div class="ow-select-title">🗺️ 开放世界</div>';
        html += '<div class="ow-select-subtitle">选择一位联系人，进入TA的专属世界</div>';
        html += '</div>';
        html += '<div class="ow-select-list">';

        if (contacts.length === 0) {
            html += '<div class="ow-empty">还没有联系人，先去添加好友吧～</div>';
        } else {
            contacts.forEach(function(c) {
                var world = owGetWorld(c.id);
                var themeKey = world ? world.themeKey : inferWorldTheme(c);
                var theme = WORLD_THEMES[themeKey] || WORLD_THEMES.modern;
                var avatar = c.avatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent((c.name || '?')[0]) + '&background=random&size=80');
                var hasWorld = world && world.locationsGenerated;
                var personaTags = extractPersonaTags(c);
                var personaSummary = getPersonaSummary(c);

                html += '<div class="ow-contact-card" onclick="window._openWorld.enterWorld(\'' + c.id + '\')">';
                html += '<div class="ow-contact-card-bg" style="background:' + theme.bg + '"></div>';
                html += '<div class="ow-contact-card-content">';

                // 头像区域（带在线状态点）
                html += '<div class="ow-contact-avatar-wrap">';
                html += '<img class="ow-contact-avatar" src="' + owEscape(avatar) + '" onerror="this.src=\'https://ui-avatars.com/api/?name=?\&background=random\'">';
                if (hasWorld) {
                    var moodKey = world.contactMood || 'normal';
                    var mood = CONTACT_MOODS[moodKey] || CONTACT_MOODS.normal;
                    html += '<span class="ow-contact-mood-dot" title="' + mood.name + '">' + mood.emoji + '</span>';
                }
                html += '</div>';

                html += '<div class="ow-contact-info">';
                // 名字 + 主题标签
                html += '<div class="ow-contact-name-row">';
                html += '<span class="ow-contact-name">' + owEscape(c.remark || c.name) + '</span>';
                html += '<span class="ow-contact-theme-badge">' + theme.emoji + ' ' + theme.name + '</span>';
                html += '</div>';

                // 人设标签
                if (personaTags.length > 0) {
                    html += '<div class="ow-contact-persona-tags">';
                    personaTags.forEach(function(tag) {
                        html += '<span class="ow-persona-tag">' + owEscape(tag) + '</span>';
                    });
                    html += '</div>';
                } else if (personaSummary) {
                    html += '<div class="ow-contact-persona-summary">' + owEscape(personaSummary) + '</div>';
                }

                if (hasWorld) {
                    // 关系进度条
                    var relationStr = getRelationStage(world.relationProgress);
                    var stageIdx = RELATION_STAGES.indexOf(relationStr);
                    var curThresh = RELATION_THRESHOLDS[stageIdx] || 0;
                    var nextThresh = RELATION_THRESHOLDS[stageIdx + 1] || (curThresh + 50);
                    var relPct = Math.min(100, Math.round(((world.relationProgress - curThresh) / (nextThresh - curThresh)) * 100));

                    html += '<div class="ow-contact-stats">';
                    html += '<span class="ow-contact-relation-badge" data-stage="' + owEscape(relationStr) + '">💕 ' + owEscape(relationStr) + '</span>';
                    html += '<span class="ow-contact-stats-sep">·</span>';
                    html += '<span>第' + world.currentDay + '天</span>';
                    html += '<span class="ow-contact-stats-sep">·</span>';
                    html += '<span>' + formatMoney(world.playerMoney) + '</span>';
                    html += '</div>';
                    // 关系进度条
                    html += '<div class="ow-contact-rel-bar-wrap">';
                    html += '<div class="ow-contact-rel-bar" style="width:' + relPct + '%"></div>';
                    html += '</div>';
                } else {
                    html += '<div class="ow-contact-stats ow-new">✨ 点击创建专属世界</div>';
                }
                html += '</div>';
                html += '<div class="ow-contact-arrow"><i class="fas fa-chevron-right"></i></div>';
                html += '</div>';
                html += '</div>';
            });
        }

        html += '</div>';
        html += '</div>';
        el.innerHTML = html;
        owState.currentView = 'select';
    }

    // 加载/生成中界面（带进度条+提示词轮播）
    function renderLoading(msg) {
        var el = renderContainer();
        if (!el) return;
        el.innerHTML = '<div class="ow-loading-page">' +
            '<div class="ow-loading-spinner"></div>' +
            '<div class="ow-loading-text">' + (msg || '正在生成世界...') + '</div>' +
            '<div class="ow-loading-sub" id="ow-loading-sub-text">AI正在为你的联系人创造专属世界…</div>' +
            '<div class="ow-loading-bar-wrap"><div class="ow-loading-bar-inner"></div></div>' +
            '<div class="ow-loading-tips" id="ow-loading-tips-text">💡 每个世界都是独一无二的</div>' +
            '</div>';
        owState.currentView = 'loading';
        startLoadingTips();
    }

    var _loadingTipTimer = null;
    function startLoadingTips() {
        if (_loadingTipTimer) clearInterval(_loadingTipTimer);
        var idx = 0;
        _loadingTipTimer = setInterval(function() {
            idx = (idx + 1) % LOADING_TIPS.length;
            var el = document.getElementById('ow-loading-tips-text');
            if (el) el.textContent = LOADING_TIPS[idx];
            else { clearInterval(_loadingTipTimer); _loadingTipTimer = null; }
        }, 2800);
    }
    function stopLoadingTips() {
        if (_loadingTipTimer) { clearInterval(_loadingTipTimer); _loadingTipTimer = null; }
    }

    // 大地图界面
    function renderWorldMap(world) {
        if (!world) return;
        var el = renderContainer();
        if (!el) return;

        var theme = WORLD_THEMES[world.themeKey] || WORLD_THEMES.modern;
        var weather = WEATHER_TYPES[world.weather] || WEATHER_TYPES.sunny;
        var contact = owGetContact(world.contactId);
        var cname = contact ? (contact.remark || contact.name) : '联系人';
        var timeStr = formatTime(world.currentHour);
        var relationStage = getRelationStage(world.relationProgress);
        var turnsLeft = world.maxTurnsPerDay - world.currentTurns;

        // 关系进度条百分比
        var stageIdx = RELATION_STAGES.indexOf(relationStage);
        var curThresh = RELATION_THRESHOLDS[stageIdx] || 0;
        var nextThresh = RELATION_THRESHOLDS[stageIdx + 1] || (curThresh + 50);
        var relPct = Math.min(100, Math.round(((world.relationProgress - curThresh) / (nextThresh - curThresh)) * 100));

        // 回合进度条百分比
        var turnPct = Math.min(100, Math.round((world.currentTurns / world.maxTurnsPerDay) * 100));

        // 探索度
        var totalLocs = (world.locations || []).filter(function(l) { return !l.hidden; }).length;
        var visitedLocs = (world.locationsVisited || []).length;
        var explorePct = totalLocs > 0 ? Math.round((visitedLocs / totalLocs) * 100) : 0;

        // 联系人心情
        var moodKey = getContactMood(world);
        var mood = CONTACT_MOODS[moodKey] || CONTACT_MOODS.normal;

        // 节日
        var festival = getTodayFestival(world);

        // 背景（使用 world.selectedBgImg，首次创建世界时已固定，不再每次随机）
        var _bgUrl = world.selectedBgImg || theme.bgImg || '';
        // 旧存档兼容：如果 selectedBgImg 未存，则此时补选并存储
        if (!_bgUrl && theme.bgImgs && theme.bgImgs.length > 0) {
            _bgUrl = theme.bgImgs[Math.floor(Math.random() * theme.bgImgs.length)];
            world.selectedBgImg = _bgUrl;
            owSave();
        }
        var bgStyle = _bgUrl
            ? 'background-image:url(' + _bgUrl + ');background-size:cover;background-position:center;'
            : 'background:' + theme.bg + ';';

        // 时段色调叠加
        var hour = world.currentHour;
        var timeOverlayColor = '';
        if (hour >= 5 && hour < 8)   timeOverlayColor = 'rgba(255,160,60,0.18)';
        else if (hour >= 8 && hour < 11)  timeOverlayColor = 'rgba(200,230,255,0.10)';
        else if (hour >= 11 && hour < 14) timeOverlayColor = 'rgba(255,255,200,0.08)';
        else if (hour >= 14 && hour < 17) timeOverlayColor = 'rgba(255,220,100,0.10)';
        else if (hour >= 17 && hour < 20) timeOverlayColor = 'rgba(255,100,50,0.20)';
        else if (hour >= 20 && hour < 22) timeOverlayColor = 'rgba(80,60,120,0.25)';
        else                              timeOverlayColor = 'rgba(10,10,40,0.40)';

        var html = '<div class="ow-map-page" style="' + bgStyle + '">';
        html += '<div class="ow-time-overlay" style="background:' + timeOverlayColor + ';"></div>';
        if (world.weather === 'rain' || world.weather === 'heavyrain' || world.weather === 'snow' || world.weather === 'windy') {
            html += '<canvas class="ow-weather-canvas" id="ow-weather-canvas"></canvas>';
        }

        // 节日横幅
        if (festival) {
            html += '<div class="ow-festival-banner">' + festival.emoji + ' 今天是 <strong>' + festival.name + '</strong>！' + festival.emoji + '</div>';
        }

        // ── HUD 顶部（可折叠） ──
        var hudCollapsed = owState._hudCollapsed || false;
        var turnsColor = turnPct >= 90 ? '#ff4444' : turnPct >= 70 ? '#ff9800' : '#4caf50';

        // 折叠时：精简摘要条
        html += '<div class="ow-hud-top' + (hudCollapsed ? ' ow-hud-collapsed' : '') + '" id="ow-hud-top">';

        // 折叠摘要条（始终存在，折叠时显示）
        html += '<div class="ow-hud-summary" onclick="window._openWorld.toggleHud()">';
        html += '<span class="ow-hud-summary-item">⏳' + world.currentTurns + '/' + world.maxTurnsPerDay + '</span>';
        html += '<span class="ow-hud-summary-sep">·</span>';
        html += '<span class="ow-hud-summary-item ow-hud-money-val">💰' + formatMoney(world.playerMoney) + '</span>';
        html += '<span class="ow-hud-summary-sep">·</span>';
        html += '<span class="ow-hud-summary-item">' + mood.emoji + owEscape(cname) + '</span>';
        html += '<i class="fas fa-chevron-' + (hudCollapsed ? 'down' : 'up') + ' ow-hud-toggle-icon"></i>';
        html += '</div>';

        // 展开时的详细内容
        html += '<div class="ow-hud-detail">';

        // 左上：日期+角色+关系进度条
        html += '<div class="ow-hud-left">';
        html += '<div class="ow-hud-datetime">';
        html += '<span class="ow-hud-datetime-text">';
        html += world.currentYear + '年' + world.currentMonth + '月 第' + world.currentDay + '天　' + timeStr;
        html += '</span></div>';
        // 角色名牌（含心情）
        html += '<div class="ow-hud-contact" onclick="window._openWorld.showContactDetail()">';
        if (contact && contact.avatar) {
            html += '<img class="ow-hud-avatar" src="' + owEscape(contact.avatar) + '">';
        }
        html += '<div class="ow-hud-contact-info">';
        html += '<span class="ow-hud-cname">' + owEscape(cname) + ' <span class="ow-hud-mood-emoji" title="' + mood.desc + '">' + mood.emoji + '</span></span>';
        html += '<span class="ow-hud-relation">' + relationStage + '</span>';
        // 关系进度条（含数值提示）
        html += '<div class="ow-hud-rel-bar-wrap" title="' + world.relationProgress + '/' + nextThresh + '">';
        html += '<div class="ow-hud-rel-bar" style="width:' + relPct + '%"></div>';
        html += '<span class="ow-hud-rel-num">' + world.relationProgress + '/' + nextThresh + '</span>';
        html += '</div>';
        html += '</div></div>';
        html += '</div>'; // .ow-hud-left

        // 右上：资源栏 + 回合进度条 + 探索度
        html += '<div class="ow-hud-right">';
        html += '<div class="ow-hud-stats-row">';
        html += '<span class="ow-hud-stat"><span class="ow-hud-stat-emoji">' + weather.emoji + '</span>' + weather.name + '</span>';
        html += '<span class="ow-hud-stat-sep"></span>';
        html += '<span class="ow-hud-stat ow-hud-money-val">💰 ' + formatMoney(world.playerMoney) + '</span>';
        html += '</div>';
        // 回合进度条
        html += '<div class="ow-hud-turns-wrap">';
        html += '<span class="ow-hud-turns-label">⏳ ' + world.currentTurns + '/' + world.maxTurnsPerDay + '</span>';
        html += '<div class="ow-hud-turns-bar-wrap"><div class="ow-hud-turns-bar" style="width:' + turnPct + '%;background:' + turnsColor + ';"></div></div>';
        html += '</div>';
        // 探索度
        html += '<div class="ow-hud-explore">🗺️ 探索 ' + visitedLocs + '/' + totalLocs + ' (' + explorePct + '%)</div>';
        html += '</div>'; // .ow-hud-right

        html += '</div>'; // .ow-hud-detail
        html += '</div>'; // .ow-hud-top

        // ── 右侧悬浮按钮列 ──
        html += '<div class="ow-side-btns">';
        html += '<div class="ow-side-btn" onclick="window._openWorld.showStatus()" title="状态"><i class="fas fa-bars"></i></div>';
        html += '<div class="ow-side-btn" onclick="window._openWorld.goBack()" title="返回"><i class="fas fa-sign-out-alt"></i></div>';
        html += '</div>';

        // ── 地图主体 - 地点标签 ──
        html += '<div class="ow-map-body">';

        // 联系人位置提示（增加停留时间）
        if (world.contactCurrentLocation) {
            var contactLoc = world.locations.find(function(l) { return l.id === world.contactCurrentLocation; });
            if (contactLoc) {
                var nextSlot = getContactNextScheduleSlot(world);
                var untilStr = (nextSlot && nextSlot.locId === world.contactCurrentLocation)
                    ? '预计停留至 ' + nextSlot.until + ':00'
                    : '';
                html += '<div class="ow-contact-location-hint" id="ow-contact-hint" ontouchstart="window._openWorld._hintDragStart(event)" ontouchmove="window._openWorld._hintDragMove(event)" ontouchend="window._openWorld._hintDragEnd(event)">';
                html += '<span class="ow-hint-drag-handle">⋮⋮</span>';
                html += '<span>' + mood.emoji + ' ' + (contact ? owEscape(contact.name) : '联系人') + ' 在：' + contactLoc.icon + ' ' + owEscape(contactLoc.name);
                if (untilStr) html += ' <span class="ow-hint-until">(' + untilStr + ')</span>';
                html += '</span>';
                html += '<button class="ow-hint-goto-btn" onclick="window._openWorld.visitLocation(\'' + contactLoc.id + '\')">快速前往</button>';
                html += '</div>';
            }
        }

        // Fix2: 地点「牌匾」标签（回合耗尽时加禁用样式）
        var mapTurnsExhausted = world.currentTurns >= world.maxTurnsPerDay;
        // 统计每个地点的访问次数
        var visitCountMap = {};
        (world.locationVisitCount || []).forEach(function(entry) {
            visitCountMap[entry.locId] = (visitCountMap[entry.locId] || 0) + entry.count;
        });
        (world.locations || []).forEach(function(loc) {
            if (loc.hidden) return;

            var isContactHere = world.contactCurrentLocation === loc.id;
            var isPlayerHere = world.playerLocation === loc.id;
            var visited = (world.locationsVisited || []).indexOf(loc.id) >= 0;
            var isOutdoorClosed = loc.isOutdoor && !weather.outdoorOpen;
            var isDisabled = isOutdoorClosed;
            var visitCount = visitCountMap[loc.id] || 0;

            var classes = 'ow-location-btn';
            if (isContactHere) classes += ' ow-loc-contact-here';
            if (isPlayerHere) classes += ' ow-loc-player-here';
            if (!visited) classes += ' ow-loc-unvisited';
            if (isOutdoorClosed) classes += ' ow-loc-closed';
            if (mapTurnsExhausted && !isPlayerHere && !isContactHere) classes += ' ow-loc-turns-exhausted';

            var locClickable = !isDisabled && !(mapTurnsExhausted && !isPlayerHere && !isContactHere);
            html += '<div class="' + classes + '" ' +
                'style="left:' + loc.posX + '%;top:' + loc.posY + '%;" ' +
                (locClickable ? 'onclick="window._openWorld.visitLocation(\'' + loc.id + '\')"' : '') + '>';
            html += '<span class="ow-loc-icon">' + loc.icon + '</span>';
            html += '<span class="ow-loc-name">' + owEscape(loc.name) + '</span>';
            if (isContactHere) html += '<div class="ow-loc-contact-dot"></div>';
            if (isPlayerHere) html += '<div class="ow-loc-player-dot"><i class="fas fa-street-view"></i></div>';
            if (isOutdoorClosed) html += '<span class="ow-loc-closed-badge">暂停</span>';
            // 回合耗尽提示
            if (mapTurnsExhausted && !isPlayerHere && !isContactHere) html += '<span class="ow-loc-exhausted-tip">行动力不足</span>';
            // 访问次数角标（访问过才显示）
            if (visitCount > 0) html += '<div class="ow-loc-visit-badge">' + visitCount + '</div>';
            html += '</div>';
        });

        // 玩家家（固定在右下区域）
        var homeLoc = (world.locations && world.locations.find(function(l){ return l.id === 'loc_home'; }));
        var homePosX = homeLoc ? homeLoc.posX : 85;
        var homePosY = homeLoc ? homeLoc.posY : 78;
        html += '<div class="ow-location-btn ow-loc-home" style="left:' + homePosX + '%;top:' + homePosY + '%;" onclick="window._openWorld.visitLocation(\'home\')">';
        html += '<span class="ow-loc-icon">🏠</span>';
        html += '<span class="ow-loc-name">我的家</span>';
        html += '</div>';

        html += '</div>'; // .ow-map-body

        // ── 右下角操作按钮 ──
        html += '<div class="ow-map-actions">';
        if (turnsLeft <= 0 || world._dayEndWarning) {
            html += '<button class="ow-act-btn ow-act-primary" onclick="window._openWorld.nextDay()"><i class="fas fa-moon"></i> 休息·下一天</button>';
        } else {
            html += '<button class="ow-act-btn ow-act-home" onclick="window._openWorld.visitLocation(\'home\')"><i class="fas fa-home"></i> 回家</button>';
        }
        html += '<button class="ow-act-btn" onclick="window._openWorld.showAchievements()"><i class="fas fa-trophy"></i> 成就</button>';
        html += '<button class="ow-act-btn" onclick="window._openWorld.showScriptList()"><i class="fas fa-book"></i> 剧本</button>';
        html += '</div>';

        // 行动力耗尽警告
        if (world._dayEndWarning) {
            html += '<div class="ow-day-warning">今天的行动力已用尽，需要休息了…</div>';
        }

        html += '</div>'; // .ow-map-page
        el.innerHTML = html;
        owState.currentView = 'map';

        // 地点标签碰撞检测：渲染后自动调整重叠位置
        setTimeout(function() { _fixLocationOverlap(); }, 50);
    }

    // [优化] 地点标签碰撞检测函数 — 增加边界保护 + 多方向偏移
    function _fixLocationOverlap() {
        var mapBody = document.querySelector('.ow-map-body');
        if (!mapBody) return;
        var btns = mapBody.querySelectorAll('.ow-location-btn');
        if (btns.length < 2) return;
        var mapRect = mapBody.getBoundingClientRect();
        var rects = [];
        btns.forEach(function(btn) {
            var r = btn.getBoundingClientRect();
            rects.push({ el: btn, left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
        });
        // 碰撞检测与微调（最多2轮，防止无限循环）
        for (var pass = 0; pass < 2; pass++) {
            for (var i = 0; i < rects.length; i++) {
                for (var j = i + 1; j < rects.length; j++) {
                    var a = rects[i], b = rects[j];
                    var overlapX = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
                    var overlapY = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
                    if (overlapX > 0 && overlapY > 0) {
                        var curTop = parseFloat(b.el.style.top) || 50;
                        var curLeft = parseFloat(b.el.style.left) || 50;
                        // [优化] 优先向下偏移，但不超出地图底部(85%)
                        if (curTop + 6 <= 85) {
                            b.el.style.top = (curTop + 6) + '%';
                        } else if (curLeft + 12 <= 90) {
                            // 向右偏移
                            b.el.style.left = (curLeft + 12) + '%';
                        } else if (curTop - 6 >= 10) {
                            // 向上偏移
                            b.el.style.top = (curTop - 6) + '%';
                        }
                        // 更新rect（批量处理后只获取一次）
                        var newR = b.el.getBoundingClientRect();
                        rects[j] = { el: b.el, left: newR.left, top: newR.top, right: newR.right, bottom: newR.bottom, width: newR.width, height: newR.height };
                    }
                }
            }
        }
    }

    // 地点详情（complex类型）
    function renderLocationDetail(world, locId) {
        var loc = world.locations.find(function(l) { return l.id === locId; });
        if (!loc) return;

        // Fix10: 记录当前地点，供商店返回使用
        owState._currentSceneLocId = locId;
        owState._shopFromScene = false;

        var el = renderContainer();
        var contact = owGetContact(world.contactId);
        var isContactHere = world.contactCurrentLocation === locId;
        var weather = WEATHER_TYPES[world.weather] || WEATHER_TYPES.sunny;
        var theme = WORLD_THEMES[world.themeKey] || WORLD_THEMES.modern;
        var visited = (world.locationsVisited || []).indexOf(locId) >= 0;
        var timeStr = formatTime(world.currentHour);
        var turnsLeft = world.maxTurnsPerDay - world.currentTurns;
        var turnsExhausted = turnsLeft <= 0;

        var html = '<div class="ow-scene-page">';

        // ── 顶部标题栏 ──
        html += '<div class="ow-scene-header">';
        html += '<div class="ow-scene-back" onclick="window._openWorld.showMap()"><i class="fas fa-chevron-left"></i></div>';
        html += '<div class="ow-scene-title">' + loc.icon + ' ' + owEscape(loc.name) + '</div>';
        html += '</div>';

        // ── 氛围横幅 ──（场景背景图：每个地点首次进入时固定，之后复用）
        if (!world.locationSceneBgImgs) world.locationSceneBgImgs = {};
        var _sceneBgUrl = world.locationSceneBgImgs[locId] || '';
        if (!_sceneBgUrl && theme.sceneBgImgs && theme.sceneBgImgs.length > 0) {
            _sceneBgUrl = theme.sceneBgImgs[Math.floor(Math.random() * theme.sceneBgImgs.length)];
            world.locationSceneBgImgs[locId] = _sceneBgUrl;
            owSave();
        }
        var _sceneBannerStyle = _sceneBgUrl
            ? 'background-image:url(' + _sceneBgUrl + ');background-size:cover;background-position:center;'
            : 'background:' + theme.bg + ';';
        var _sceneBgLayerStyle = _sceneBgUrl
            ? 'background-image:url(' + _sceneBgUrl + ');background-size:cover;background-position:center;'
            : 'background:' + theme.bg + ';';
        html += '<div class="ow-scene-banner" style="' + _sceneBannerStyle + '">';
        html += '<div class="ow-scene-banner-bg" style="' + _sceneBgLayerStyle + '"></div>';
        html += '<span class="ow-scene-banner-icon">' + loc.icon + '</span>';
        html += '<div class="ow-scene-banner-tags">';
        if (loc.isOutdoor) html += '<span class="ow-scene-banner-tag">🌿 户外</span>';
        if (loc.hasShop)   html += '<span class="ow-scene-banner-tag">🛍️ 可购物</span>';
        if (loc.hasJob)    html += '<span class="ow-scene-banner-tag">💼 可打工</span>';
        html += '</div>';
        html += '</div>';

        // ── 地点描述 ──
        html += '<div class="ow-scene-desc">' + owEscape(loc.desc || ('这里是' + loc.name + '，充满了各种可能性。')) + '</div>';

        // ── 氛围状态条 ──
        // 今日在此地点的探索次数
        var todayExploreKey = locId + '_day' + world.currentDay;
        var todayExploreCount = (world.todayExploreCount || {})[todayExploreKey] || 0;

        html += '<div class="ow-scene-atmo">';
        html += '<span class="ow-scene-atmo-chip chip-weather">' + weather.emoji + ' ' + weather.name + '</span>';
        html += '<span class="ow-scene-atmo-chip chip-time">🕐 ' + timeStr + '</span>';
        if (loc.cost) html += '<span class="ow-scene-atmo-chip chip-cost">💸 消费约¥' + loc.cost + '</span>';
        if (visited)  html += '<span class="ow-scene-atmo-chip chip-visited">✅ 已探索</span>';
        if (todayExploreCount > 0) html += '<span class="ow-scene-atmo-chip chip-today">🔄 今日' + todayExploreCount + '次</span>';
        if (turnsExhausted) html += '<span class="ow-scene-atmo-chip" style="color:#e33;">⏰ 行动力耗尽</span>';
        if (loc.isOutdoor && !weather.outdoorOpen) html += '<span class="ow-scene-atmo-chip" style="color:#e33;">⛔ 今日关闭</span>';
        html += '</div>';

        // ── 联系人在场 ──
        if (isContactHere && contact) {
            html += '<div class="ow-scene-contact-here">';
            if (contact.avatar) {
                html += '<img class="ow-scene-contact-avatar" src="' + owEscape(contact.avatar) + '">';
            } else {
                html += '<div class="ow-scene-contact-avatar" style="background:#ffb3c6;display:flex;align-items:center;justify-content:center;font-size:18px;">👤</div>';
            }
            html += '<span>💕 ' + owEscape(contact.remark || contact.name) + ' 就在这里！</span>';
            html += '<button class="ow-scene-meet-btn" onclick="window._openWorld.meetContact(\'' + locId + '\')">去找TA</button>';
            html += '</div>';
        }

        // ── Fix6: 附近NPC（按地点+天数缓存，稳定不随机刷新） ──
        var npcCacheKey = locId + '_' + world.currentDay;
        if (!world.npcLocationCache) world.npcLocationCache = {};
        // 如果缓存不存在，生成并缓存
        if (!world.npcLocationCache[npcCacheKey]) {
            var allNPCs = world.npcs || [];
            var assignedNPCs = allNPCs.filter(function(n) { return n.currentLocation === locId; });
            var unassignedNPCs = allNPCs.filter(function(n) { return !n.currentLocation; });
            // 随机选取未分配NPC（每天固定）
            var seed = (world.currentDay * 31 + locId.length * 7) % 100;
            var extraNPCs = unassignedNPCs.filter(function(_, i) { return (i * 17 + seed) % 100 < 30; });
            var combined = assignedNPCs.concat(extraNPCs).slice(0, 4);
            world.npcLocationCache[npcCacheKey] = combined.map(function(n) { return n.id; });
        }
        var cachedNPCIds = world.npcLocationCache[npcCacheKey];
        var localNPCs = (world.npcs || []).filter(function(n) { return cachedNPCIds.indexOf(n.id) >= 0; });

        if (localNPCs.length > 0) {
            html += '<div class="ow-scene-npc-section">';
            html += '<div class="ow-scene-npc-title">当前在场</div>';
            html += '<div class="ow-scene-npc-list">';
            localNPCs.forEach(function(npc) {
                var fav = world.npcFavorability ? (world.npcFavorability[npc.id] || 0) : 0;
                var favPct = Math.min(100, fav);
                html += '<div class="ow-scene-npc-chip">';
                html += '<span>' + (npc.avatar || '🧑') + '</span>';
                html += '<span class="ow-scene-npc-name">' + owEscape(npc.name || '路人') + '</span>';
                if (fav > 0) {
                    html += '<span class="ow-scene-npc-fav-wrap">';
                    html += '<span class="ow-scene-npc-fav-bar-bg"><span class="ow-scene-npc-fav-bar" style="width:' + favPct + '%"></span></span>';
                    html += '<span class="ow-scene-npc-fav">❤' + fav + '</span>';
                    html += '</span>';
                }
                html += '</div>';
            });
            html += '</div></div>';
        }

        // ── 操作区 ──
        html += '<div class="ow-scene-actions">';
        html += '<div class="ow-scene-action-title">可以做什么</div>';

        // Fix11: 探索按钮回合耗尽时禁用
        if (turnsExhausted) {
            html += '<button class="ow-scene-action-btn ow-explore-btn ow-btn-disabled" disabled>';
            html += '<i class="fas fa-compass"></i>';
            html += '<span><span class="ow-btn-label">探索这里</span><span class="ow-btn-hint">今日行动力已用尽，明天再来</span></span>';
            html += '</button>';
        } else {
            html += '<button class="ow-scene-action-btn ow-explore-btn" onclick="window._openWorld.triggerLocationEvent(\'' + locId + '\')">';
            html += '<i class="fas fa-compass"></i>';
            html += '<span><span class="ow-btn-label">探索这里</span><span class="ow-btn-hint">消耗1回合，剩余' + turnsLeft + '回合</span></span>';
            html += '<i class="fas fa-chevron-right ow-btn-arrow"></i>';
            html += '</button>';
        }

        // Fix11: 打工按钮回合耗尽时禁用
        if (loc.hasJob) {
            var jobIncome = loc.jobIncome || 80;
            if (turnsExhausted) {
                html += '<button class="ow-scene-action-btn ow-job-btn ow-btn-disabled" disabled>';
                html += '<i class="fas fa-briefcase"></i>';
                html += '<span><span class="ow-btn-label">' + owEscape(loc.jobName || '打工') + '</span><span class="ow-btn-hint">今日行动力已用尽</span></span>';
                html += '</button>';
            } else {
                html += '<button class="ow-scene-action-btn ow-job-btn" onclick="window._openWorld.startJob(\'' + locId + '\')">';
                html += '<i class="fas fa-briefcase"></i>';
                html += '<span><span class="ow-btn-label">' + owEscape(loc.jobName || '打工') + '</span><span class="ow-btn-hint">+¥' + jobIncome + '，消耗1回合</span></span>';
                html += '<i class="fas fa-chevron-right ow-btn-arrow"></i>';
                html += '</button>';
            }
        }

        // 商店（不消耗回合，始终可用）
        if (loc.hasShop) {
            html += '<button class="ow-scene-action-btn ow-shop-btn" onclick="window._openWorld.openShopFromScene(\'' + locId + '\')">';
            html += '<i class="fas fa-shopping-bag"></i>';
            html += '<span><span class="ow-btn-label">逛商店</span><span class="ow-btn-hint">查看可购买的物品</span></span>';
            html += '<i class="fas fa-chevron-right ow-btn-arrow"></i>';
            html += '</button>';
        }

        html += '</div>';
        html += '</div>';

        el.innerHTML = html;
        owState.currentView = 'scene';
    }

    // ==================== 天气粒子系统 ====================
    var _weatherAnimId = null;
    function startWeatherParticles(weather) {
        stopWeatherParticles();
        var canvas = document.getElementById('ow-weather-canvas');
        if (!canvas) return;
        var ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth || window.innerWidth;
        canvas.height = canvas.offsetHeight || window.innerHeight;

        var particles = [];
        // [优化] 天气粒子按设备性能分级，低端机减半
        var _isMobileLowEnd = /Android/i.test(navigator.userAgent) && (navigator.hardwareConcurrency || 4) <= 4;
        var _particleScale = _isMobileLowEnd ? 0.5 : 1.0;
        var count = Math.round((weather === 'heavyrain' ? 120 : weather === 'rain' ? 70 : weather === 'snow' ? 60 : 40) * _particleScale);

        for (var i = 0; i < count; i++) {
            particles.push(makeParticle(canvas, weather, true));
        }

        function makeParticle(canvas, weather, random) {
            var p = {};
            p.x = Math.random() * canvas.width;
            p.y = random ? Math.random() * canvas.height : -10;
            if (weather === 'rain' || weather === 'heavyrain') {
                p.speed = 8 + Math.random() * 6;
                p.len = 14 + Math.random() * 10;
                p.opacity = 0.3 + Math.random() * 0.3;
                p.windX = (weather === 'heavyrain') ? 1.5 : 0.5;
            } else if (weather === 'snow') {
                p.speed = 0.8 + Math.random() * 1.2;
                p.radius = 1.5 + Math.random() * 2.5;
                p.opacity = 0.5 + Math.random() * 0.4;
                p.sway = Math.random() * Math.PI * 2;
                p.swaySpeed = 0.01 + Math.random() * 0.02;
            } else if (weather === 'windy') {
                p.speed = 4 + Math.random() * 5;
                p.len = 6 + Math.random() * 8;
                p.opacity = 0.15 + Math.random() * 0.2;
                p.y = Math.random() * canvas.height;
                p.windY = (Math.random() - 0.5) * 1.2;
            }
            return p;
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(function(p) {
                ctx.save();
                ctx.globalAlpha = p.opacity;
                if (weather === 'rain' || weather === 'heavyrain') {
                    ctx.strokeStyle = 'rgba(180,210,255,0.85)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + p.windX * 3, p.y + p.len);
                    ctx.stroke();
                    p.x += p.windX;
                    p.y += p.speed;
                    if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
                } else if (weather === 'snow') {
                    ctx.fillStyle = 'rgba(240,248,255,0.9)';
                    ctx.beginPath();
                    p.sway += p.swaySpeed;
                    ctx.arc(p.x + Math.sin(p.sway) * 2, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                    p.y += p.speed;
                    if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
                } else if (weather === 'windy') {
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + p.len, p.y + p.windY * 2);
                    ctx.stroke();
                    p.x += p.speed;
                    p.y += p.windY;
                    if (p.x > canvas.width) { p.x = -20; p.y = Math.random() * canvas.height; }
                }
                ctx.restore();
            });
            _weatherAnimId = requestAnimationFrame(draw);
        }
        draw();
    }

    function stopWeatherParticles() {
        if (_weatherAnimId) { cancelAnimationFrame(_weatherAnimId); _weatherAnimId = null; }
    }

    // ==================== 浮动效果数字 ====================
    function showFloatNumber(text, type) {
        var el = document.createElement('div');
        el.className = 'ow-float-number ow-float-' + (type || 'money');
        el.textContent = text;
        el.style.left = (30 + Math.random() * 40) + '%';
        el.style.top = '60%';
        document.body.appendChild(el);
        setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 1300);
    }

    // 剧情对话框（带打字机效果+角色立绘）
    function renderDialog(world, script, onComplete) {
        if (!script || script.length === 0) {
            if (onComplete) onComplete({});
            return;
        }

        stopLoadingTips();
        var el = renderContainer();
        var contact = owGetContact(world.contactId);
        var cname = contact ? (contact.remark || contact.name) : '联系人';
        var theme = WORLD_THEMES[world.themeKey] || WORLD_THEMES.modern;

        owState.dialogQueue = script.slice();
        owState.dialogIndex = 0;
        owState.dialogEffects = {};
        owState.dialogOnComplete = onComplete || function() {};
        owState._typingDone = true; // Fix9: 初始化为true，避免残留上一步状态
        // 计算非choice步骤总数（用于进度指示）
        owState._dialogTotal = script.filter(function(s) { return s.type !== 'choice'; }).length;
        owState._dialogStepIndex = 0;

        var _typingTimer = null;

        function typewriterEffect(el, text, speed) {
            if (_typingTimer) clearInterval(_typingTimer);
            el.textContent = '';
            var i = 0;
            owState._typingDone = false;
            _typingTimer = setInterval(function() {
                if (i < text.length) {
                    el.textContent += text[i];
                    i++;
                } else {
                    clearInterval(_typingTimer);
                    _typingTimer = null;
                    owState._typingDone = true;
                }
            }, speed || 30);
        }

        function renderCurrentStep() {
            if (owState.dialogIndex >= owState.dialogQueue.length) {
                owState.dialogOnComplete(owState.dialogEffects);
                return;
            }

            var step = owState.dialogQueue[owState.dialogIndex];
            // 替换联系人姓名占位符
            var stepText = (step.text || '').replace(/\{\{contact\}\}/g, cname);
            var stepSpeaker = (step.speaker || '').replace(/\{\{contact\}\}/g, cname);

            var html = '<div class="ow-dialog-page">';
            // 背景
            html += '<div class="ow-dialog-bg" style="background:' + theme.bg + ';opacity:0.28;"></div>';

            if (step.type === 'narration' || step.type === 'dialogue') {
                // 更新步骤计数
                owState._dialogStepIndex++;
                // 角色立绘（对话时显示联系人emoji/头像）
                if (step.type === 'dialogue') {
                    var charEmoji = contact && contact.avatar ? '' : '🧑';
                    if (contact && contact.avatar) {
                        html += '<img class="ow-dialog-character" style="font-size:0;width:80px;height:80px;border-radius:50%;object-fit:cover;bottom:175px;" src="' + owEscape(contact.avatar) + '" onerror="this.style.display=\'none\'">';
                    } else {
                        html += '<div class="ow-dialog-character">' + charEmoji + '</div>';
                    }
                }
                var isNarr = step.type === 'narration';
                html += '<div class="ow-dialog-box' + (isNarr ? ' ow-dialog-box-narr' : '') + '">';
                if (!isNarr && stepSpeaker) {
                    html += '<div class="ow-dialog-speaker">' + owEscape(stepSpeaker) + '</div>';
                }
                html += '<div class="ow-dialog-text' + (isNarr ? ' ow-dialog-narration' : '') + '" id="ow-dialog-typetext"></div>';
                // 进度指示器
                if (owState._dialogTotal > 1) {
                    html += '<div class="ow-dialog-progress">';
                    for (var pi = 0; pi < owState._dialogTotal; pi++) {
                        html += '<span class="ow-dialog-progress-dot' + (pi < owState._dialogStepIndex ? ' active' : '') + '"></span>';
                    }
                    html += '</div>';
                }
                html += '<div class="ow-dialog-continue" onclick="window._openWorld.dialogNext()"><span class="ow-dialog-next-text">点击继续 ▸</span></div>';
                html += '</div>';

            } else if (step.type === 'choice') {
                html += '<div class="ow-dialog-choices">';
                html += '<div class="ow-dialog-choice-title">— 请做出选择 —</div>';
                (step.options || []).forEach(function(opt, i) {
                    var effectHints = [];
                    var eff = opt.effect || {};
                    if (eff.money && eff.money > 0) effectHints.push('<span class="ow-eff-money">+¥' + eff.money + '</span>');
                    if (eff.money && eff.money < 0) effectHints.push('<span class="ow-eff-money-neg">¥' + eff.money + '</span>');
                    if (eff.relation && eff.relation > 0) effectHints.push('<span class="ow-eff-relation">❤️+' + eff.relation + '</span>');
                    if (eff.relation && eff.relation < 0) effectHints.push('<span class="ow-eff-relation-neg">❤️' + eff.relation + '</span>');

                    html += '<button class="ow-choice-btn" onclick="window._openWorld.dialogChoice(' + i + ')">';
                    html += owEscape(opt.text);
                    if (effectHints.length > 0) {
                        html += ' <span class="ow-choice-effects">' + effectHints.join('') + '</span>';
                    }
                    html += '</button>';
                });
                html += '</div>';
            }

            html += '</div>'; // .ow-dialog-page

            var mapEl = owEl('map-content');
            if (mapEl) mapEl.innerHTML = html;
            owState.currentView = 'dialog';

            // 打字机效果：渲染后启动
            if (step.type === 'narration' || step.type === 'dialogue') {
                var textEl = document.getElementById('ow-dialog-typetext');
                if (textEl) {
                    typewriterEffect(textEl, stepText, step.type === 'narration' ? 25 : 30);
                }
            }
        }

        window._openWorld._renderDialogStep = renderCurrentStep;
        renderCurrentStep();
    }

    // 状态面板
    function renderStatusPanel(world) {
        var el = renderContainer();
        var contact = owGetContact(world.contactId);
        var theme = WORLD_THEMES[world.themeKey] || WORLD_THEMES.modern;
        var relationStage = getRelationStage(world.relationProgress);
        var stageIdx = RELATION_STAGES.indexOf(relationStage);
        // Fix4: 进度条相对于当前阶段起点计算
        var currentThreshold = RELATION_THRESHOLDS[stageIdx] || 0;
        var nextThreshold = RELATION_THRESHOLDS[stageIdx + 1] || (currentThreshold + 50);
        var stageRange = nextThreshold - currentThreshold;
        var progress = Math.min(100, Math.round(((world.relationProgress - currentThreshold) / stageRange) * 100));

        var html = '<div class="ow-status-page">';
        html += '<div class="ow-status-header">';
        html += '<div class="ow-back-btn" onclick="window._openWorld.showMap()"><i class="fas fa-chevron-left"></i> 返回</div>';
        html += '<div class="ow-status-title">角色状态</div>';
        html += '</div>';

        // 玩家状态
        html += '<div class="ow-status-section">';
        html += '<div class="ow-status-section-title">📊 我的状态</div>';
        html += '<div class="ow-status-grid">';
        html += '<div class="ow-status-item"><span class="ow-si-label">💰 资产</span><span class="ow-si-value">' + formatMoney(world.playerMoney) + '</span></div>';

        // 职业选择入口（含等级显示）
        var currentJobObj = world.playerJob ? JOB_LIST.find(function(j) { return j.id === world.playerJob; }) : null;
        var jobName = currentJobObj ? currentJobObj.name : '无业';
        var jobLvData = world.playerJob ? getJobLevel(world, world.playerJob) : null;
        var jobLvName = jobLvData ? JOB_LEVEL_CONFIG.levelNames[jobLvData.level] : '';
        var jobLvNext = jobLvData ? JOB_LEVEL_CONFIG.expPerLevel[jobLvData.level + 1] : null;
        var jobExpPct = (jobLvData && jobLvNext) ? Math.min(100, Math.round((jobLvData.exp / jobLvNext) * 100)) : 100;
        html += '<div class="ow-status-item ow-status-item-clickable" onclick="window._openWorld.showJobSelect()">';
        html += '<span class="ow-si-label">💼 工作</span>';
        html += '<span class="ow-si-value">';
        html += jobName;
        if (jobLvData) {
            html += ' <span class="ow-job-lv-badge">Lv.' + jobLvData.level + ' ' + jobLvName + '</span>';
        }
        html += ' <span class="ow-si-change">更换</span></span>';
        html += '</div>';
        // 职业经验条
        if (jobLvData && jobLvNext) {
            html += '<div class="ow-job-exp-row">';
            html += '<span class="ow-job-exp-label">经验 ' + jobLvData.exp + '/' + jobLvNext + '</span>';
            html += '<div class="ow-job-exp-bar-wrap"><div class="ow-job-exp-bar" style="width:' + jobExpPct + '%"></div></div>';
            html += '</div>';
        }

        var carObj = world.playerOwnedCar ? SHOP_ITEMS.find(function(i) { return i.id === world.playerOwnedCar; }) : null;
        var houseObj = world.playerOwnedHouse ? SHOP_ITEMS.find(function(i) { return i.id === world.playerOwnedHouse; }) : null;
        html += '<div class="ow-status-item"><span class="ow-si-label">🚗 车辆</span><span class="ow-si-value">' + (carObj ? carObj.name : '无') + '</span></div>';
        html += '<div class="ow-status-item"><span class="ow-si-label">🏠 住所</span><span class="ow-si-value">' + (houseObj ? houseObj.name : '租房') + '</span></div>';
        html += '</div>';
        html += '</div>';

        // 关系状态
        if (contact) {
            html += '<div class="ow-status-section">';
            html += '<div class="ow-status-section-title">❤️ 与 ' + owEscape(contact.remark || contact.name) + ' 的关系</div>';
            html += '<div class="ow-relation-stage"><span class="ow-relation-stage-heart">❤️</span>' + owEscape(relationStage) + '</div>';
            // 关系进度条 + 阶段节点
            html += '<div class="ow-relation-bar-wrap">';
            html += '<div class="ow-relation-bar" style="width:0%" id="ow-rel-bar-anim"></div>';
            // 阶段节点标记
            for (var si = 1; si < RELATION_THRESHOLDS.length; si++) {
                var nodeThresh = RELATION_THRESHOLDS[si];
                var nodePct = Math.min(100, Math.round(((nodeThresh - currentThreshold) / stageRange) * 100));
                if (nodePct > 0 && nodePct < 100) {
                    html += '<div class="ow-rel-node" style="left:' + nodePct + '%" title="' + owEscape(RELATION_STAGES[si]) + '"></div>';
                }
            }
            html += '</div>';
            html += '<div class="ow-relation-progress"><span>' + world.relationProgress + ' / ' + nextThreshold + '</span><span class="ow-relation-progress-next">→ ' + owEscape(RELATION_STAGES[stageIdx + 1] || '最高阶段') + '</span></div>';
            // 关系阶段路线图
            html += '<div class="ow-relation-stages-row">';
            RELATION_STAGES.forEach(function(s, i) {
                var isReached = world.relationProgress >= (RELATION_THRESHOLDS[i] || 0);
                var isCurrent = s === relationStage;
                html += '<div class="ow-rel-stage-node' + (isReached ? ' reached' : '') + (isCurrent ? ' current' : '') + '">';
                html += '<div class="ow-rel-stage-dot"></div>';
                html += '<div class="ow-rel-stage-label">' + owEscape(s) + '</div>';
                html += '</div>';
            });
            html += '</div>';
            html += '</div>';
        }

        // 世界状态
        html += '<div class="ow-status-section">';
        html += '<div class="ow-status-section-title">🌍 世界状态</div>';
        html += '<div class="ow-status-grid">';
        var weather = WEATHER_TYPES[world.weather] || WEATHER_TYPES.sunny;
        html += '<div class="ow-status-item"><span class="ow-si-label">' + weather.emoji + ' 天气</span><span class="ow-si-value">' + weather.name + '</span></div>';
        html += '<div class="ow-status-item"><span class="ow-si-label">📅 第' + world.currentDay + '天</span><span class="ow-si-value">' + formatTime(world.currentHour) + '</span></div>';
        html += '<div class="ow-status-item"><span class="ow-si-label">⚡ 回合</span><span class="ow-si-value">' + world.currentTurns + '/' + world.maxTurnsPerDay + '</span></div>';
        html += '<div class="ow-status-item"><span class="ow-si-label">📍 已探索</span><span class="ow-si-value">' + (world.locationsVisited || []).length + '/' + (world.locations || []).length + '处</span></div>';
        html += '</div>';
        html += '</div>';

        // 共同记忆（时间轴样式）
        if (world.sharedMemories && world.sharedMemories.length > 0) {
            html += '<div class="ow-status-section">';
            html += '<div class="ow-status-section-title">💭 共同记忆 <span class="ow-mem-count">(' + world.sharedMemories.length + '条)</span></div>';
            html += '<div class="ow-memory-timeline">';
            world.sharedMemories.slice(-6).reverse().forEach(function(mem, idx) {
                var realIdx = world.sharedMemories.length - 1 - idx;
                html += '<div class="ow-memory-timeline-item" onclick="window._openWorld.showMemoryDetail(' + realIdx + ')">';
                html += '<div class="ow-mem-timeline-dot"></div>';
                html += '<div class="ow-mem-timeline-line"></div>';
                html += '<div class="ow-mem-timeline-content">';
                html += '<span class="ow-mem-text">' + owEscape(mem) + '</span>';
                html += '<i class="fas fa-chevron-right ow-mem-arrow"></i>';
                html += '</div>';
                html += '</div>';
            });
            html += '</div>';
            if (world.sharedMemories.length > 6) {
                html += '<div class="ow-memory-more">还有 ' + (world.sharedMemories.length - 6) + ' 条记忆…</div>';
            }
            html += '</div>';
        }

        html += '</div>'; // .ow-status-page
        el.innerHTML = html;
        owState.currentView = 'status';
        // 关系进度条入场动画
        setTimeout(function() {
            var bar = document.getElementById('ow-rel-bar-anim');
            if (bar) bar.style.width = progress + '%';
        }, 120);
    }

    // ==================== 职业选择面板 ====================

    function renderJobSelect(world) {
        var el = renderContainer();
        var html = '<div class="ow-job-select-page">';
        html += '<div class="ow-status-header">';
        html += '<div class="ow-back-btn" onclick="window._openWorld.showStatus()"><i class="fas fa-chevron-left"></i> 返回</div>';
        html += '<div class="ow-status-title">💼 选择职业</div>';
        html += '</div>';
        html += '<div class="ow-job-list-panel">';
        JOB_LIST.forEach(function(job) {
            var isCurrent = world.playerJob === job.id;
            var income = job.incomeRandom ? ('¥' + job.incomeRandom[0] + '~¥' + job.incomeRandom[1]) : ('+¥' + job.income + '/次');
            html += '<div class="ow-job-item ' + (isCurrent ? 'ow-job-item-active' : '') + '" onclick="window._openWorld.selectJob(\'' + job.id + '\')">';
            html += '<div class="ow-job-item-icon">' + job.icon + '</div>';
            html += '<div class="ow-job-item-info">';
            html += '<div class="ow-job-item-name">' + owEscape(job.name) + (isCurrent ? ' <span class="ow-job-current-badge">当前</span>' : '') + '</div>';
            html += '<div class="ow-job-item-desc">' + owEscape(job.desc) + '</div>';
            html += '<div class="ow-job-item-income">' + income + '</div>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';
        el.innerHTML = html;
        owState.currentView = 'jobselect';
    }

    // 成就面板
    function renderAchievements(world) {
        var el = renderContainer();

        var unlockedCount = Object.values(world.achievements || {}).filter(function(a) { return a.unlocked; }).length;

        var html = '<div class="ow-ach-page">';
        html += '<div class="ow-ach-header">';
        html += '<div class="ow-back-btn" onclick="window._openWorld.showMap()"><i class="fas fa-chevron-left"></i> 返回</div>';
        html += '<div class="ow-ach-title">🏆 成就 (' + unlockedCount + '/' + ACHIEVEMENTS_DEF.length + ')</div>';
        html += '</div>';

        html += '<div class="ow-ach-list">';
        ACHIEVEMENTS_DEF.forEach(function(def) {
            var achData = (world.achievements || {})[def.id];
            var unlocked = achData && achData.unlocked;
            var show = !def.hidden || unlocked;

            if (!show) {
                // 隐藏成就只显示问号
                html += '<div class="ow-ach-item ow-ach-hidden">';
                html += '<div class="ow-ach-icon">❓</div>';
                html += '<div class="ow-ach-info"><div class="ow-ach-name">???</div><div class="ow-ach-desc">隐藏成就</div></div>';
                html += '</div>';
                return;
            }

            html += '<div class="ow-ach-item ' + (unlocked ? 'ow-ach-unlocked' : 'ow-ach-locked') + ' ow-ach-rarity-' + def.rarity + '">';
            html += '<div class="ow-ach-icon">' + def.icon + '</div>';
            html += '<div class="ow-ach-info">';
            html += '<div class="ow-ach-name">' + owEscape(def.name) + '</div>';
            html += '<div class="ow-ach-desc">' + owEscape(def.desc) + '</div>';
            if (!unlocked && def.reward && def.reward.money) {
                html += '<div class="ow-ach-reward">奖励：¥' + def.reward.money + '</div>';
            }
            if (unlocked && achData) {
                // Fix3: 显示解锁时的游戏天数而非当前天数
                var unlockedDay = achData.unlockedDay || world.currentDay;
                html += '<div class="ow-ach-date">第' + unlockedDay + '天获得</div>';
            }
            html += '</div>';
            html += '<div class="ow-ach-rarity-badge">' + (RARITY_ZH[def.rarity] || def.rarity) + '</div>';
            html += '</div>';
        });
        html += '</div>';
        html += '</div>';

        el.innerHTML = html;
        owState.currentView = 'achievements';
    }

    // 商店界面
    function renderShop(world, locId) {
        var el = renderContainer();
        var loc = world.locations.find(function(l) { return l.id === locId; });

        var html = '<div class="ow-shop-page">';
        html += '<div class="ow-shop-header">';
        // Fix10: 从地点详情页打开时，返回地点详情；否则返回地图
        var shopBackFn = owState._shopFromScene && owState._currentSceneLocId
            ? 'window._openWorld.backToScene()'
            : 'window._openWorld.showMap()';
        html += '<div class="ow-back-btn" onclick="' + shopBackFn + '"><i class="fas fa-chevron-left"></i> 返回</div>';
        html += '<div class="ow-shop-title">🛒 ' + (loc ? owEscape(loc.name) : '商店') + '</div>';
        html += '<div class="ow-shop-money">' + formatMoney(world.playerMoney) + '</div>';
        html += '</div>';

        // 分类Tab
        var activeTab = owState._shopTab || 'gift';
        html += '<div class="ow-shop-tabs">';
        html += '<div class="ow-shop-tab ' + (activeTab === 'gift' ? 'active' : '') + '" onclick="window._openWorld.switchShopTab(\'gift\')">🎁 礼物</div>';
        html += '<div class="ow-shop-tab ' + (activeTab === 'car' ? 'active' : '') + '" onclick="window._openWorld.switchShopTab(\'car\')">🚗 车辆</div>';
        html += '<div class="ow-shop-tab ' + (activeTab === 'house' ? 'active' : '') + '" onclick="window._openWorld.switchShopTab(\'house\')">🏠 房产</div>';
        html += '</div>';

        // 按分类过滤商品
        var filteredItems = SHOP_ITEMS.filter(function(item) {
            if (activeTab === 'gift') return !item.type || item.type !== 'property';
            if (activeTab === 'car')  return item.type === 'property' && item.subtype === 'car';
            if (activeTab === 'house') return item.type === 'property' && item.subtype === 'house';
            return true;
        });

        html += '<div class="ow-shop-list">';
        filteredItems.forEach(function(item) {
            var canAfford = world.playerMoney >= item.price;
            var owned = (item.type === 'property' && item.subtype === 'car' && world.playerOwnedCar === item.id) ||
                       (item.type === 'property' && item.subtype === 'house' && world.playerOwnedHouse === item.id);
            var buyCount = (world.purchaseCount || {})[item.id] || 0;

            html += '<div class="ow-shop-item ' + (!canAfford && !owned ? 'ow-shop-item-disabled' : '') + '">';
            html += '<div class="ow-shop-item-icon">' + item.icon + '</div>';
            html += '<div class="ow-shop-item-info">';
            html += '<div class="ow-shop-item-name">' + owEscape(item.name) + (buyCount > 0 ? ' <span class="ow-shop-buy-count">×' + buyCount + '</span>' : '') + '</div>';
            html += '<div class="ow-shop-item-desc">' + owEscape(item.desc) + '</div>';
            if (item.effect && item.effect.relation) {
                html += '<div class="ow-shop-item-effect">💕 送给联系人 +❤️' + item.effect.relation + '</div>';
            }
            if (item.relationBonus) {
                html += '<div class="ow-shop-item-effect">关系 +❤️' + item.relationBonus + '</div>';
            }
            html += '</div>';
            html += '<div class="ow-shop-item-right">';
            html += '<div class="ow-shop-item-price">¥' + item.price.toLocaleString() + '</div>';
            if (owned) {
                html += '<div class="ow-shop-item-owned">✓ 已拥有</div>';
            } else if (canAfford) {
                html += '<button class="ow-shop-buy-btn" onclick="window._openWorld.buyItem(\'' + item.id + '\')">购买</button>';
            } else {
                html += '<div class="ow-shop-item-cantafford">余额不足</div>';
            }
            html += '</div>';
            html += '</div>';
        });
        if (filteredItems.length === 0) {
            html += '<div style="text-align:center;padding:40px;color:#aaa;font-size:14px;">暂无商品</div>';
        }
        html += '</div>';
        html += '</div>';

        el.innerHTML = html;
        owState.currentView = 'shop';
    }

    // 切换商店Tab
    function switchShopTab(tab) {
        owState._shopTab = tab;
        var world = owState.worldData;
        if (world) renderShop(world, owState._currentShopLocId || '');
    }

    // 成就解锁弹窗（V2通知条风格）
    function showAchievementUnlocked(achievement) {
        var desc = owEscape(achievement.name);
        if (achievement.reward && achievement.reward.money) {
            desc += ' · 奖励 +¥' + achievement.reward.money;
        }
        owNotify({
            icon: achievement.icon || '🏆',
            title: '🏆 成就解锁',
            desc: desc,
            badge: achievement.rarity === 'epic' ? '史诗' : achievement.rarity === 'rare' ? '稀有' : '',
            badgeCls: achievement.rarity === 'epic' ? 'ow-notify-badge-purple' : 'ow-notify-badge-gold',
            duration: 4000
        });
    }

    // 效果应用后浮动数字提示
    function showEffectNotification(effects) {
        if (!effects) return;
        if (effects.money && effects.money > 0) {
            showFloatNumber('+¥' + effects.money, 'money');
        } else if (effects.money && effects.money < 0) {
            showFloatNumber('¥' + effects.money, 'neg');
        }
        if (effects.relation && effects.relation > 0) {
            setTimeout(function() { showFloatNumber('❤️+' + effects.relation, 'relation'); }, 200);
        } else if (effects.relation && effects.relation < 0) {
            setTimeout(function() { showFloatNumber('❤️' + effects.relation, 'neg'); }, 200);
        }
    }

    // ==================== 核心操作函数 ====================

    // [FIX-世界观选择] 弹出世界观选择弹窗，让用户自行确认/更改
    function showThemeSelector(contact, inferredTheme) {
        return new Promise(function(resolve) {
            var themeKeys = Object.keys(WORLD_THEMES);
            var overlay = document.createElement('div');
            overlay.className = 'ow-modal-overlay';
            overlay.id = 'ow-theme-selector';
            var cardsHtml = '';
            themeKeys.forEach(function(key) {
                var t = WORLD_THEMES[key];
                var isInferred = key === inferredTheme;
                cardsHtml += '<div class="ow-theme-card' + (isInferred ? ' ow-theme-card-active' : '') + '" data-theme="' + key + '" onclick="document.querySelectorAll(\'.ow-theme-card\').forEach(function(c){c.classList.remove(\'ow-theme-card-active\')});this.classList.add(\'ow-theme-card-active\')">';
                cardsHtml += '<div class="ow-theme-card-preview" style="background:' + t.bg + '">';
                cardsHtml += '<span style="font-size:28px;">' + t.emoji + '</span>';
                cardsHtml += '</div>';
                cardsHtml += '<div class="ow-theme-card-name">' + t.name + '</div>';
                if (isInferred) cardsHtml += '<div class="ow-theme-card-hint">AI推荐</div>';
                cardsHtml += '</div>';
            });
            overlay.innerHTML =
                '<div class="ow-modal-card ow-modal-md" style="max-width:340px;width:90vw;">' +
                    '<div class="ow-modal-header">' +
                        '<span class="ow-modal-icon">🗺️</span>' +
                        '<span class="ow-modal-title">选择世界观</span>' +
                    '</div>' +
                    '<div class="ow-modal-body" style="padding:12px 16px;">' +
                        '<div style="color:#999;font-size:12px;margin-bottom:10px;">为 <b>' + owEscape(contact.remark || contact.name) + '</b> 选择世界观主题</div>' +
                        '<div class="ow-theme-grid">' + cardsHtml + '</div>' +
                    '</div>' +
                    '<div class="ow-modal-footer">' +
                        '<button class="ow-modal-btn ow-modal-btn-primary" id="ow-theme-confirm-btn">确认进入</button>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(overlay);
            requestAnimationFrame(function() {
                requestAnimationFrame(function() { overlay.classList.add('show'); });
            });
            document.getElementById('ow-theme-confirm-btn').addEventListener('click', function() {
                var active = overlay.querySelector('.ow-theme-card-active');
                var selected = active ? active.getAttribute('data-theme') : inferredTheme;
                overlay.classList.remove('show');
                setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 300);
                resolve(selected);
            });
        });
    }

    async function enterWorld(contactId) {
        owState.contactId = contactId;
        var contact = owGetContact(contactId);
        if (!contact) { owToast('找不到联系人', 'error'); return; }

        // [FIX-联系人选择页黑屏] 进入世界后才锁定横屏
        owLockLandscape();

        var world = owGetWorld(contactId);

        if (!world || !world.locationsGenerated) {
            // [FIX-世界观选择] 首次进入：让用户选择世界观，AI推荐作为默认选项
            var inferredTheme = inferWorldTheme(contact);
            var themeKey = await showThemeSelector(contact, inferredTheme);

            // 用户确认后开始生成
            renderLoading('正在为 ' + (contact.remark || contact.name) + ' 生成专属世界...');
            world = initWorldData(contact, themeKey);

            try {
                var apiData = await generateWorldViaAPI(contact, themeKey);
                if (apiData && apiData.locations) {
                    world.locations = apiData.locations;
                    if (apiData.homeLocation) {
                        // home已经内置，不需要添加到locations
                    }
                    world.contactSchedule = apiData.contactSchedule || null;
                    world.worldBgDesc = apiData.worldBgDesc || '';
                    world.locationsGenerated = true;
                } else {
                    // API失败，使用默认地点
                    var theme = WORLD_THEMES[themeKey];
                    world.locations = generateDefaultLocations(theme);
                    world.locationsGenerated = true;
                    world.contactSchedule = generateDefaultSchedule(world.locations);
                }
            } catch (e) {
                console.warn('[OW] World generation failed:', e);
                var theme2 = WORLD_THEMES[themeKey];
                world.locations = generateDefaultLocations(theme2);
                world.locationsGenerated = true;
                world.contactSchedule = generateDefaultSchedule(world.locations);
            }

            // 初始化天气
            world.weather = generateWeather(world);
            // 初始化联系人位置
            updateContactLocation(world);
            // 保存
            owSetWorld(contactId, world);

            // 检查成就：首次进入
            var newAchs = checkAndUnlockAchievements(world, 'first_enter', {});
            owSetWorld(contactId, world);
            newAchs.forEach(function(a) { setTimeout(function() { showAchievementUnlocked(a); }, 500); });
        }

        owState.worldData = world;
        stopLoadingTips();
        renderWorldMap(world);
        // 启动天气粒子
        setTimeout(function() {
            if (world.weather === 'rain' || world.weather === 'heavyrain' ||
                world.weather === 'snow' || world.weather === 'windy') {
                startWeatherParticles(world.weather);
            }
        }, 120);
        // 检测节日事件
        setTimeout(function() { triggerFestivalIfNeeded(world); }, 1500);
    }

    // 生成默认地点（API失败备用）
    function generateDefaultLocations(theme) {
        var defaultLocs = theme.locations || WORLD_THEMES.modern.locations;
        return defaultLocs.slice(0, 8).map(function(name, i) {
            var jobs = theme.jobs || WORLD_THEMES.modern.jobs;
            var hasJob = i < jobs.length;
            return {
                id: 'loc_' + i,
                name: name,
                icon: ['🏢', '☕', '🏪', '🌳', '🏋️', '📚', '🍜', '🎭', '🏥', '🎪'][i % 10],
                type: i % 3 === 0 ? 'complex' : 'simple',
                isOutdoor: i % 4 === 0,
                posX: 10 + (i % 4) * 22 + Math.random() * 5,
                posY: 15 + Math.floor(i / 4) * 35 + Math.random() * 10,
                desc: name + '，是这个世界里常见的地方。',
                hidden: false,
                unlockCondition: null,
                hasJob: hasJob,
                jobName: hasJob ? jobs[i] : null,
                jobIncome: [50, 80, 120, 60, 45, 70][i % 6],
                hasShop: i % 5 === 0
            };
        });
    }

    // 生成默认日程
    function generateDefaultSchedule(locations) {
        var firstLoc = locations[0] ? locations[0].id : 'loc_0';
        var secondLoc = locations[1] ? locations[1].id : firstLoc;
        return {
            workdays: {
                '8-12': firstLoc,
                '12-13': secondLoc,
                '13-18': firstLoc,
                '18-22': secondLoc,
                '22-24': 'home'
            },
            weekends: {
                '8-11': secondLoc,
                '11-14': secondLoc,
                '14-18': secondLoc,
                '18-22': firstLoc,
                '22-24': 'home'
            }
        };
    }

    // 访问地点（Fix1: 移动本身不扣回合，complex地点进详情不扣，只有探索/打工/simple事件才扣）
    async function visitLocation(locId) {
        var world = owState.worldData;
        if (!world) return;

        // 更新玩家位置（移动不消耗回合）
        world.playerLocation = locId;

        // 记录已访问
        if (locId !== 'home' && (world.locationsVisited || []).indexOf(locId) < 0) {
            if (!world.locationsVisited) world.locationsVisited = [];
            world.locationsVisited.push(locId);
            var loc = world.locations.find(function(l) { return l.id === locId; });
            var newAchs2 = checkAndUnlockAchievements(world, 'location_visit', { hidden: loc && loc.hidden });
            newAchs2.forEach(function(a) { setTimeout(function() { showAchievementUnlocked(a); }, 500); });
        }

        // 检查"跟踪"成就
        if (world.contactCurrentLocation === locId) {
            world._consecutiveFollowCount = (world._consecutiveFollowCount || 0) + 1;
        } else {
            world._consecutiveFollowCount = 0;
        }

        // 保存位置状态
        owSetWorld(world.contactId, world);
        continueLocationVisit(world, locId);
    }

    // Fix1: 实际行动时才扣回合（探索/打工/simple事件/随机事件）
    function consumeTurnAndCheck(world) {
        if (world.currentTurns >= world.maxTurnsPerDay) {
            owToast('今天的行动力已用尽，需要休息了', 'warning');
            return false;
        }
        advanceTurn(world);

        // 检查夜猫子成就
        if (world.currentTurns >= world.maxTurnsPerDay && world.playerLocation !== 'home') {
            var nightAchs = checkAndUnlockAchievements(world, 'night_owl', {});
            nightAchs.forEach(function(a) { showAchievementUnlocked(a); });
        }

        // 天气室外检查
        var locId = world.playerLocation;
        var weather = WEATHER_TYPES[world.weather];
        var loc3 = locId && locId !== 'home' ? world.locations.find(function(l) { return l.id === locId; }) : null;
        if (loc3 && loc3.isOutdoor && weather && world.weather === 'rain') {
            var rainAchs = checkAndUnlockAchievements(world, 'rain_outdoor', {});
            rainAchs.forEach(function(a) { showAchievementUnlocked(a); });
        }
        return true;
    }

    function continueLocationVisit(world, locId) {
        if (locId === 'home') {
            renderHomeScene(world);
            return;
        }

        var loc = world.locations.find(function(l) { return l.id === locId; });
        if (!loc) return;

        if (loc.type === 'complex') {
            // complex地点：进详情页不扣回合，探索/打工时才扣
            renderLocationDetail(world, locId);
        } else {
            // 简单地点：先扣回合再触发事件
            if (!consumeTurnAndCheck(world)) { showMap(); return; }
            owSetWorld(world.contactId, world);
            // 检查随机事件
            var randomEvt = checkRandomEvent(world);
            if (randomEvt) {
                world.randomEventCooldown[randomEvt.id] = world.currentDay;
                world.consecutiveRandomEvents = (world.consecutiveRandomEvents || 0) + 1;
                var rAchs = checkAndUnlockAchievements(world, 'random_event', {});
                owSetWorld(world.contactId, world);
                var rScript = randomEvt.script.map(function(s) {
                    var ct = owGetContact(world.contactId);
                    var cn = ct ? (ct.remark || ct.name) : '联系人';
                    s = Object.assign({}, s);
                    if (s.text) s.text = s.text.replace(/\{\{contact\}\}/g, cn);
                    if (s.speaker) s.speaker = s.speaker.replace(/\{\{contact\}\}/g, cn);
                    return s;
                });
                renderDialog(world, rScript, function(effects) {
                    applyEffects(world, effects);
                    owSetWorld(world.contactId, world);
                    rAchs.forEach(function(a) { showAchievementUnlocked(a); });
                    showEffectNotification(effects);
                    setTimeout(function() { triggerLocationEvent(locId); }, 300);
                });
                return;
            }
            world.consecutiveRandomEvents = 0;
            triggerLocationEvent(locId);
        }
    }

    // 触发地点事件（Fix1: 此函数本身不扣回合，由调用方负责）
    async function triggerLocationEvent(locId) {
        var world = owState.worldData;
        if (!world) return;

        var loc = world.locations.find(function(l) { return l.id === locId; });
        if (!loc) return;

        // Fix1: complex地点的探索在此扣回合
        if (loc.type === 'complex') {
            if (!consumeTurnAndCheck(world)) {
                renderLocationDetail(world, locId);
                return;
            }
            // 检查随机事件
            var randomEvt2 = checkRandomEvent(world);
            if (randomEvt2) {
                world.randomEventCooldown[randomEvt2.id] = world.currentDay;
                world.consecutiveRandomEvents = (world.consecutiveRandomEvents || 0) + 1;
                var rAchs2 = checkAndUnlockAchievements(world, 'random_event', {});
                owSetWorld(world.contactId, world);
                var rScript2 = randomEvt2.script.map(function(s) {
                    var ct = owGetContact(world.contactId);
                    var cn = ct ? (ct.remark || ct.name) : '联系人';
                    s = Object.assign({}, s);
                    if (s.text) s.text = s.text.replace(/\{\{contact\}\}/g, cn);
                    if (s.speaker) s.speaker = s.speaker.replace(/\{\{contact\}\}/g, cn);
                    return s;
                });
                renderDialog(world, rScript2, function(effects) {
                    applyEffects(world, effects);
                    owSetWorld(world.contactId, world);
                    rAchs2.forEach(function(a) { showAchievementUnlocked(a); });
                    showEffectNotification(effects);
                    setTimeout(function() { triggerLocationEvent(locId); }, 300);
                });
                return;
            }
            world.consecutiveRandomEvents = 0;
        }

        var contact = owGetContact(world.contactId);
        var isContactHere = world.contactCurrentLocation === locId;

        // 记录今日探索次数
        if (!world.todayExploreCount) world.todayExploreCount = {};
        var todayKey = locId + '_day' + world.currentDay;
        world.todayExploreCount[todayKey] = (world.todayExploreCount[todayKey] || 0) + 1;

        // 记录地点访问总次数（用于地图角标）
        if (!world.locationVisitCount) world.locationVisitCount = [];
        var existEntry = world.locationVisitCount.find(function(e) { return e.locId === locId; });
        if (existEntry) {
            existEntry.count++;
        } else {
            world.locationVisitCount.push({ locId: locId, count: 1 });
        }

        // 如果联系人在这里，优先触发联系人互动
        if (isContactHere && Math.random() < 0.7) {
            meetContact(locId);
            return;
        }

        // 获取或生成事件缓存
        if (!world.eventCache) world.eventCache = {};
        var cache = world.eventCache[locId];

        if (!cache || cache.length === 0) {
            // 首次或缓存空，调用API生成
            renderLoading('生成地点事件...');
            var events = await generateLocationEvents(world, locId);
            world.eventCache[locId] = events;
            owSetWorld(world.contactId, world);
        }

        cache = world.eventCache[locId] || [];

        // Fix8: 缓存上限20条，超出时删除最旧的
        if (cache.length > 20) {
            world.eventCache[locId] = cache.slice(cache.length - 20);
            cache = world.eventCache[locId];
        }

        // 找一个未播放的事件，或者20%概率重新生成
        var unplayed = cache.filter(function(e) {
            return (world.triggeredEvents || []).indexOf(e.id) < 0;
        });

        var selectedEvent = null;

        if (unplayed.length === 0 || Math.random() < 0.2) {
            // 缓存用完或触发刷新
            if (Math.random() < 0.5) {
                // 调API生成新事件
                var newEvents = await generateLocationEvents(world, locId);
                if (newEvents && newEvents.length > 0) {
                    var merged = (cache || []).concat(newEvents);
                    // Fix8: 合并后也限制上限
                    if (merged.length > 20) merged = merged.slice(merged.length - 20);
                    world.eventCache[locId] = merged;
                    owSetWorld(world.contactId, world);
                    unplayed = newEvents;
                }
            }
        }

        if (unplayed.length > 0) {
            selectedEvent = owRandom(unplayed);
        } else if (cache.length > 0) {
            selectedEvent = owRandom(cache);
        } else {
            selectedEvent = getDefaultEvents(loc, world)[0];
        }

        if (!selectedEvent) {
            owToast('此处暂无可用事件', 'info');
            showMap();
            return;
        }

        // 标记已触发
        if (!world.triggeredEvents) world.triggeredEvents = [];
        if (world.triggeredEvents.indexOf(selectedEvent.id) < 0) {
            world.triggeredEvents.push(selectedEvent.id);
        }

        world.eventCount = (world.eventCount || 0) + 1;
        var eventAchs = checkAndUnlockAchievements(world, 'event_triggered', { rarity: 'common' });
        owSetWorld(world.contactId, world);

        // 播放剧情
        renderDialog(world, selectedEvent.script, function(effects) {
            // 应用奖励
            var rewards = selectedEvent.rewards || {};
            var totalEffects = {
                money: (effects.money || 0) + (rewards.money || 0),
                relation: (effects.relation || 0) + (rewards.relation || 0)
            };

            // 合并选项effect
            if (effects.favorability) {
                applyFavorability(world, effects.favorability);
            }

            applyEffects(world, totalEffects);

            // 记忆
            if (selectedEvent.title) {
                world.sharedMemories = world.sharedMemories || [];
                if (isContactHere) {
                    // Fix7: 加游戏天数时间戳
                    world.sharedMemories.push('[第' + world.currentDay + '天] 在' + loc.name + '偶遇，触发了"' + selectedEvent.title + '"');
                }
                if (world.sharedMemories.length > 20) world.sharedMemories.shift();
            }

            owSetWorld(world.contactId, world);
            eventAchs.forEach(function(a) { showAchievementUnlocked(a); });
            showEffectNotification(totalEffects);

            setTimeout(function() { showMap(); }, 300);
        });
    }

    // 遇见联系人
    async function meetContact(locId) {
        var world = owState.worldData;
        if (!world) return;

        var contact = owGetContact(world.contactId);
        if (!contact) return;

        var loc = world.locations.find(function(l) { return l.id === locId; });
        var locName = loc ? loc.name : '某处';

        world.contactMetCount = (world.contactMetCount || 0) + 1;

        // 检查连续在同一地点遇见
        if (world.consecutiveMeetLocation === locId) {
            world.consecutiveMeetCount = (world.consecutiveMeetCount || 0) + 1;
        } else {
            world.consecutiveMeetLocation = locId;
            world.consecutiveMeetCount = 1;
        }

        var meetAchs = checkAndUnlockAchievements(world, 'contact_meet', {});

        // 生成互动剧情
        renderLoading('生成互动剧情...');
        var script = await generateContactInteraction(world);

        owSetWorld(world.contactId, world);
        meetAchs.forEach(function(a) { setTimeout(function() { showAchievementUnlocked(a); }, 500); });

        renderDialog(world, script, function(effects) {
            applyEffects(world, effects);

            // 记录共同记忆
            var relChange = effects.relation || 0;
            if (relChange > 0) {
                world.sharedMemories = world.sharedMemories || [];
                // Fix7: 加游戏天数时间戳
                world.sharedMemories.push('[第' + world.currentDay + '天] 在' + locName + '遇见了' + contact.name + '，关系增进了');
                if (world.sharedMemories.length > 20) world.sharedMemories.shift();
            }

            var relAchs = checkAndUnlockAchievements(world, 'relation_change', {});
            owSetWorld(world.contactId, world);
            relAchs.forEach(function(a) { showAchievementUnlocked(a); });
            showEffectNotification(effects);

            setTimeout(function() { showMap(); }, 300);
        });
    }

    // [优化] applyEffects 钩子系统：消除多层猴子补丁，改为注册式钩子
    var _applyEffectsHooks = [];
    function onApplyEffects(fn) { _applyEffectsHooks.push(fn); }

    // 应用效果（Fix4: 检测关系阶段升级 + 钩子化）
    function applyEffects(world, effects) {
        if (!effects) return;
        if (effects.money) {
            world.playerMoney = Math.max(0, (world.playerMoney || 0) + effects.money);
            checkAndUnlockAchievements(world, 'money_change', {});
        }
        if (effects.relation) {
            var oldStage = getRelationStage(world.relationProgress);
            world.relationProgress = Math.max(0, (world.relationProgress || 0) + effects.relation);
            var newStage = getRelationStage(world.relationProgress);
            world.relationStage = newStage;
            // Fix4: 关系阶段升级时显示专属弹窗
            if (newStage !== oldStage) {
                var stageIdx = RELATION_STAGES.indexOf(newStage);
                setTimeout(function() { showRelationUpgrade(newStage, stageIdx); }, 400);
            }
        }
        // [优化] 执行所有注册的钩子（替代猴子补丁链）
        for (var _hi = 0; _hi < _applyEffectsHooks.length; _hi++) {
            try { _applyEffectsHooks[_hi](world, effects); } catch(_he) { console.warn('[OW] applyEffects hook error:', _he); }
        }
        // [优化] HUD局部更新：效果应用后只更新数字，不重绘整个地图
        _updateHudValues(world);
    }

    // [优化] HUD局部更新函数：只更新金钱、回合等数字，避免 innerHTML 全量重绘
    function _updateHudValues(world) {
        if (!world || owState.currentView !== 'map') return;
        // 金钱
        var moneyEls = document.querySelectorAll('.ow-hud-money-val');
        var moneyStr = '💰 ' + formatMoney(world.playerMoney);
        moneyEls.forEach(function(el) { el.textContent = moneyStr; });
        // 回合
        var turnsLabel = document.querySelector('.ow-hud-turns-label');
        if (turnsLabel) turnsLabel.textContent = '⏳ ' + world.currentTurns + '/' + world.maxTurnsPerDay;
        var turnPct = Math.min(100, Math.round((world.currentTurns / world.maxTurnsPerDay) * 100));
        var turnsColor = turnPct >= 90 ? '#ff4444' : turnPct >= 70 ? '#ff9800' : '#4caf50';
        var turnsBar = document.querySelector('.ow-hud-turns-bar');
        if (turnsBar) { turnsBar.style.width = turnPct + '%'; turnsBar.style.background = turnsColor; }
        // 折叠摘要条
        var summaryItems = document.querySelectorAll('.ow-hud-summary-item');
        if (summaryItems.length >= 2) {
            summaryItems[0].textContent = '⏳' + world.currentTurns + '/' + world.maxTurnsPerDay;
            summaryItems[1].textContent = '💰' + formatMoney(world.playerMoney);
        }
        // 关系进度条
        var relationStage = getRelationStage(world.relationProgress);
        var stageIdx = RELATION_STAGES.indexOf(relationStage);
        var curThresh = RELATION_THRESHOLDS[stageIdx] || 0;
        var nextThresh = RELATION_THRESHOLDS[stageIdx + 1] || (curThresh + 50);
        var relPct = Math.min(100, Math.round(((world.relationProgress - curThresh) / (nextThresh - curThresh)) * 100));
        var relBar = document.querySelector('.ow-hud-rel-bar');
        if (relBar) relBar.style.width = relPct + '%';
        var relNum = document.querySelector('.ow-hud-rel-num');
        if (relNum) relNum.textContent = world.relationProgress + '/' + nextThresh;
        // 关系阶段文字
        var relLabel = document.querySelector('.ow-hud-relation');
        if (relLabel) relLabel.textContent = relationStage;
    }

    // Fix4: 关系阶段升级弹窗（V2卡片风格）
    function showRelationUpgrade(stageName, stageIdx) {
        var stageEmojis = ['👋', '😊', '🤝', '😄', '💓', '💑', '💞'];
        var emoji = stageEmojis[stageIdx] || '💕';

        owModal({
            title: '关系升级',
            icon: '💕',
            size: 'sm',
            content: '<div class="ow-modal-relation-upgrade">' +
                '<div class="ow-modal-relation-emoji">' + emoji + '</div>' +
                '<div class="ow-modal-relation-stage">' + owEscape(stageName) + '</div>' +
                '<div class="ow-modal-relation-sub">你们的关系更进一步了</div>' +
                '</div>',
            buttons: [{ text: '太好了！', cls: 'primary', onClick: "this.closest('.ow-modal-overlay').remove()" }]
        });
    }

    // 应用NPC好感度
    function applyFavorability(world, favData) {
        if (!favData || !world) return;
        if (!world.npcFavorability) world.npcFavorability = {};
        var npcId = favData.npcId || 'unknown';
        world.npcFavorability[npcId] = Math.min(100, Math.max(0, (world.npcFavorability[npcId] || 0) + (favData.value || 0)));
        checkAndUnlockAchievements(world, 'npc_favorability', {});
    }

    // 打工 — 消耗回合 + 职业等级系统
    function startJob(locId) {
        var world = owState.worldData;
        if (!world) return;

        if (!consumeTurnAndCheck(world)) {
            renderLocationDetail(world, locId);
            return;
        }
        owSetWorld(world.contactId, world);

        var loc = world.locations.find(function(l) { return l.id === locId; });
        if (!loc || !loc.hasJob) return;

        // 使用当前职业ID（优先用地点关联职业，否则用玩家选择职业）
        var jobId = world.playerJob || 'waiter';
        var baseIncome = loc.jobIncome || 80;
        var actualIncome = calcJobIncome(world, baseIncome, jobId);
        var jobJobName = loc.jobName || '打工';
        var lvData = getJobLevel(world, jobId);
        var lvName = JOB_LEVEL_CONFIG.levelNames[lvData.level] || '新手';
        var incomeBonus = actualIncome - baseIncome;

        var script = [
            { type: 'narration', text: '你来到' + loc.name + '，向负责人表示愿意帮忙。' },
            { type: 'dialogue', speaker: '负责人', text: '好啊，正好缺人手，' + jobJobName + '的工资是¥' + actualIncome + (incomeBonus > 0 ? '（含熟练加成+¥' + incomeBonus + '）' : '') + '，干完就给你结算。' },
            { type: 'narration', text: '你认认真真地完成了今天的工作，汗水没有白流。' },
            { type: 'choice', options: [
                { text: '辛苦一天，值得！', effect: { money: actualIncome, relation: 1 }, resultText: '工作结束，负责人满意地点点头，把工钱交到你手里。' },
                { text: '有点累，但还好', effect: { money: actualIncome }, resultText: '拿到工钱，今天的辛苦算是有了回报。' }
            ]}
        ];

        renderDialog(world, script, function(effects) {
            applyEffects(world, effects);
            world.jobHistory = world.jobHistory || [];
            world.jobHistory.push({ locId: locId, income: actualIncome, day: world.currentDay, jobId: jobId });

            // 增加职业经验，检测升级
            var leveledUp = addJobExp(world, jobId);
            if (leveledUp) {
                var newLvData = getJobLevel(world, jobId);
                var newLvName = JOB_LEVEL_CONFIG.levelNames[newLvData.level] || '熟练';
                setTimeout(function() {
                    showJobLevelUp(jobJobName, newLvData.level, newLvName);
                }, 600);
            }

            var jobAchs = checkAndUnlockAchievements(world, 'job_done', {});
            checkAndUnlockAchievements(world, 'money_change', {});
            owSetWorld(world.contactId, world);
            jobAchs.forEach(function(a) { showAchievementUnlocked(a); });
            showEffectNotification(effects);

            setTimeout(function() { showMap(); }, 300);
        });
    }

    // 职业升级提示（V2通知条风格）
    function showJobLevelUp(jobName, level, levelName) {
        owNotify({
            icon: '⬆️',
            title: '职业升级！',
            desc: owEscape(jobName) + ' · Lv.' + level + ' ' + owEscape(levelName) + ' · 收入×' + JOB_LEVEL_CONFIG.incomeMultiplier[level].toFixed(1),
            badge: 'Lv.' + level,
            badgeCls: 'ow-notify-badge-green',
            duration: 3500
        });
    }

    // Fix10: 选择职业
    function selectJob(jobId) {
        var world = owState.worldData;
        if (!world) return;
        var job = JOB_LIST.find(function(j) { return j.id === jobId; });
        if (!job) return;
        world.playerJob = jobId;
        owSetWorld(world.contactId, world);
        owToast('已切换职业：' + job.name, 'success');
        renderStatusPanel(world);
    }

    // 购买物品
    function buyItem(itemId) {
        var world = owState.worldData;
        if (!world) return;

        var item = SHOP_ITEMS.find(function(i) { return i.id === itemId; });
        if (!item) return;

        if (world.playerMoney < item.price) {
            owToast('余额不足', 'error');
            return;
        }

        world.playerMoney -= item.price;
        world.purchaseHistory = world.purchaseHistory || [];
        world.purchaseHistory.push({ itemId: itemId, price: item.price, day: world.currentDay });

        // 记录购买次数
        if (!world.purchaseCount) world.purchaseCount = {};
        world.purchaseCount[itemId] = (world.purchaseCount[itemId] || 0) + 1;

        // 礼物：触发赠送剧情
        if (item.effect && item.effect.relation) {
            var contact = owGetContact(world.contactId);
            var cname = contact ? (contact.remark || contact.name) : '联系人';
            var giftScript = [
                { type: 'narration', text: '你精心挑选了一份' + item.name + item.icon + '，准备送给' + cname + '。' },
                { type: 'dialogue', speaker: cname, text: '这是……给我的？谢谢你，我很喜欢。' },
                { type: 'choice', options: [
                    { text: '希望你喜欢', effect: { relation: item.effect.relation }, resultText: cname + '接过礼物，嘴角微微上扬，眼里有光。' },
                    { text: '只是随手买的', effect: { relation: Math.floor(item.effect.relation * 0.6) }, resultText: '"随手买的……"TA若有所思地看了你一眼。' }
                ]}
            ];
            checkAndUnlockAchievements(world, 'money_change', {});
            owSetWorld(world.contactId, world);
            renderDialog(world, giftScript, function(effects) {
                applyEffects(world, effects);
                world.sharedMemories = world.sharedMemories || [];
                world.sharedMemories.push('[第' + world.currentDay + '天] 送了' + cname + '一份' + item.name);
                if (world.sharedMemories.length > 20) world.sharedMemories.shift();
                var relAchs = checkAndUnlockAchievements(world, 'relation_change', {});
                owSetWorld(world.contactId, world);
                relAchs.forEach(function(a) { showAchievementUnlocked(a); });
                showEffectNotification(effects);
                setTimeout(function() { renderShop(world, owState._currentShopLocId || ''); }, 300);
            });
            return;
        }

        // 房产/车辆
        if (item.type === 'property') {
            if (item.subtype === 'car') {
                world.playerOwnedCar = itemId;
                var carAchs = checkAndUnlockAchievements(world, 'car_bought', {});
                carAchs.forEach(function(a) { showAchievementUnlocked(a); });
                owToast('购买成功！' + item.name + '已入手 🚗', 'success');
            } else if (item.subtype === 'house') {
                world.playerOwnedHouse = itemId;
                var houseAchs = checkAndUnlockAchievements(world, 'house_bought', {});
                houseAchs.forEach(function(a) { showAchievementUnlocked(a); });
                owToast('购房成功！' + item.name + ' 🏠', 'success');
            }
            if (item.relationBonus) {
                world.relationProgress += item.relationBonus;
                world.relationStage = getRelationStage(world.relationProgress);
            }
        } else {
            owToast('购买成功！' + item.name, 'success');
        }

        checkAndUnlockAchievements(world, 'money_change', {});
        owSetWorld(world.contactId, world);

        // 刷新商店界面
        setTimeout(function() {
            renderShop(world, owState._currentShopLocId || '');
        }, 300);
    }

    // Fix7 + Fix9: 主页场景（修正名称显示 + 邀请功能）
    function renderHomeScene(world) {
        var el = renderContainer();
        var contact = owGetContact(world.contactId);
        var theme = WORLD_THEMES[world.themeKey] || WORLD_THEMES.modern;
        var weather = WEATHER_TYPES[world.weather] || WEATHER_TYPES.sunny;
        var turnsLeft = world.maxTurnsPerDay - world.currentTurns;
        var timeStr = formatTime(world.currentHour);
        var relationStage = getRelationStage(world.relationProgress);

        // Fix7: 正确查找房产/车辆名称
        var houseObj = world.playerOwnedHouse ? SHOP_ITEMS.find(function(i) { return i.id === world.playerOwnedHouse; }) : null;
        var carObj   = world.playerOwnedCar   ? SHOP_ITEMS.find(function(i) { return i.id === world.playerOwnedCar;   }) : null;
        var roomEmoji = houseObj ? (world.playerOwnedHouse === 'house_big' ? '🏡' : '🏠') : '🛋️';
        var homeTitle = houseObj ? houseObj.name : '出租屋';
        var homeDesc = turnsLeft <= 0
            ? '今天已经跑了一整天，好累啊…该好好睡一觉了。'
            : '回到家，放松一下，整理一下今天的心情。';

        var html = '<div class="ow-home-scene">';

        // 顶部
        html += '<div class="ow-scene-header">';
        html += '<div class="ow-scene-back" onclick="window._openWorld.showMap()"><i class="fas fa-chevron-left"></i></div>';
        html += '<div class="ow-scene-title">🏠 ' + homeTitle + '</div>';
        html += '</div>';

        html += '<div class="ow-home-content">';

        // 房间主图
        html += '<div class="ow-home-room">' + roomEmoji + '</div>';
        html += '<div class="ow-home-desc">' + owEscape(homeDesc) + '</div>';

        // 今日状态信息条
        html += '<div class="ow-home-info-row">';
        html += '<span class="ow-home-info-chip">' + weather.emoji + ' ' + weather.name + '</span>';
        html += '<span class="ow-home-info-chip">🕐 ' + timeStr + '</span>';
        html += '<span class="ow-home-info-chip">💰 ' + formatMoney(world.playerMoney) + '</span>';
        if (contact) {
            html += '<span class="ow-home-info-chip">💕 ' + owEscape((contact.remark || contact.name)) + '·' + relationStage + '</span>';
        }
        html += '</div>';

        html += '<div class="ow-home-actions">';

        // 休息按钮（主要）
        if (turnsLeft <= 0) {
            html += '<button class="ow-home-btn ow-home-btn-primary" onclick="window._openWorld.nextDay()">';
            html += '<i class="fas fa-moon"></i> 睡觉，迎接新的一天';
            html += '</button>';
        } else {
            html += '<button class="ow-home-btn ow-home-btn-primary" onclick="window._openWorld.nextDay()">';
            html += '<i class="fas fa-moon"></i> 提前休息（剩' + turnsLeft + '回合）';
            html += '</button>';
        }

        // Fix9: 购房后显示"邀请联系人来家"按钮
        if (houseObj && contact) {
            var canInvite = world.relationProgress >= 50; // 朋友以上才能邀请
            html += '<button class="ow-home-btn ow-home-btn-invite' + (canInvite ? '' : ' ow-home-btn-disabled') + '" ' +
                (canInvite ? 'onclick="window._openWorld.inviteContactHome()"' : '') + '>';
            html += '<i class="fas fa-door-open"></i> 邀请' + owEscape(contact.remark || contact.name) + '来家';
            if (!canInvite) html += ' <span class="ow-home-btn-lock">🔒 需要朋友关系</span>';
            html += '</button>';
        }

        // Fix7: 正确显示资产名称
        if (houseObj) {
            html += '<div class="ow-home-asset-badge"><i class="fas fa-home"></i> ' + owEscape(houseObj.name) + '</div>';
        }
        if (carObj) {
            html += '<div class="ow-home-asset-badge"><i class="fas fa-car"></i> ' + owEscape(carObj.name) + '</div>';
        }

        // 查看状态
        html += '<button class="ow-home-btn" onclick="window._openWorld.showStatus()">';
        html += '<i class="fas fa-user-circle"></i> 查看角色状态';
        html += '</button>';

        // 查看成就
        html += '<button class="ow-home-btn" onclick="window._openWorld.showAchievements()">';
        html += '<i class="fas fa-trophy"></i> 查看成就';
        html += '</button>';

        html += '</div>';
        html += '</div>';
        html += '</div>';

        el.innerHTML = html;
        owState.currentView = 'home';
    }

    // Fix9: 邀请联系人来家（AI生成剧情）
    async function inviteContactHome() {
        var world = owState.worldData;
        if (!world) return;
        var contact = owGetContact(world.contactId);
        if (!contact) return;

        // 检查回合
        if (world.currentTurns >= world.maxTurnsPerDay) {
            owToast('今天行动力已用尽，明天再邀请吧', 'warning');
            return;
        }
        advanceTurn(world);
        owSetWorld(world.contactId, world);

        var houseObj = world.playerOwnedHouse ? SHOP_ITEMS.find(function(i) { return i.id === world.playerOwnedHouse; }) : null;
        var houseName = houseObj ? houseObj.name : '家';
        var relationStage = getRelationStage(world.relationProgress);
        var persona = contact.persona || '';
        var weather = WEATHER_TYPES[world.weather] || WEATHER_TYPES.sunny;

        renderLoading('生成邀约剧情...');

        var prompt = '请为"邀请联系人来家"场景生成一段剧情脚本（JSON数组）。\n\n' +
            '联系人：' + contact.name + '\n' +
            '人设：' + smartPersonaExtract(persona, 200) + '\n' +
            '住所：' + houseName + '\n' +
            '当前关系：' + relationStage + '\n' +
            '天气：' + weather.name + '\n\n' +
            '生成4-7个script项，包括：发出邀请的对话、联系人的反应、到家后的场景描述、互动选项。\n' +
            '格式：[{"type":"narration","text":"..."},{"type":"dialogue","speaker":"姓名","text":"..."},{"type":"choice","options":[{"text":"...","effect":{"relation":8}}]}]\n' +
            '只输出JSON数组。';

        var script;
        try {
            // [MOD] 不做超时限制
            var resp = await API.chatCompletion([
                    { role: 'system', content: '你是游戏剧本作家，只输出JSON数组。' },
                    { role: 'user', content: prompt }
                ], { maxTokens: 1500 });
            var text = resp.content || resp;
            var jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) script = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.warn('[OW] inviteContactHome error:', e);
        }

        // 备用剧情
        if (!script) {
            var cname = contact.remark || contact.name;
            script = [
                { type: 'narration', text: '你鼓起勇气，给' + cname + '发了一条消息，邀请TA来你家坐坐。' },
                { type: 'dialogue', speaker: cname, text: '你家啊……好啊，我一会儿过来。' },
                { type: 'narration', text: '不久后，' + cname + '出现在你门口，打量着你的' + houseName + '。' },
                { type: 'dialogue', speaker: cname, text: '还不错嘛，比我想象的要温馨。' },
                { type: 'choice', options: [
                    { text: '给TA泡杯茶', effect: { relation: 8 }, resultText: '两人坐在沙发上，聊着聊着，气氛越来越轻松。' },
                    { text: '带TA参观一下', effect: { relation: 6 }, resultText: '你带着TA逛了一圈，分享了每个角落的故事。' },
                    { text: '点外卖一起吃', effect: { relation: 10 }, resultText: '两人窝在沙发上等外卖，感觉像很久很久的老朋友。' }
                ]}
            ];
        }

        renderDialog(world, script, function(effects) {
            applyEffects(world, effects);
            world.sharedMemories = world.sharedMemories || [];
            // Fix7: 加游戏天数时间戳
            world.sharedMemories.push('[第' + world.currentDay + '天] 邀请了' + (contact.remark || contact.name) + '来' + houseName + '，度过了美好时光');
            if (world.sharedMemories.length > 20) world.sharedMemories.shift();
            var relAchs = checkAndUnlockAchievements(world, 'relation_change', {});
            owSetWorld(world.contactId, world);
            relAchs.forEach(function(a) { showAchievementUnlocked(a); });
            showEffectNotification(effects);
            setTimeout(function() { showMap(); }, 300);
        });
    }

    // 显示地图（渲染后启动天气粒子）
    function showMap() {
        var world = owState.worldData;
        if (!world) return;
        stopWeatherParticles();
        renderWorldMap(world);
        // 延迟一帧确保canvas已渲染
        setTimeout(function() {
            if (world.weather === 'rain' || world.weather === 'heavyrain' ||
                world.weather === 'snow' || world.weather === 'windy') {
                startWeatherParticles(world.weather);
            }
        }, 80);
    }

    // [优化] goNextDay 钩子系统：消除猴子补丁
    var _goNextDayHooks = [];
    function onNextDay(fn) { _goNextDayHooks.push(fn); }

    // 进入下一天（带过渡动画 + 钩子化）
    function goNextDay() {
        var world = owState.worldData;
        if (!world) return;

        // [优化] 执行所有注册的 nextDay 钩子（替代猴子补丁）
        for (var _nhi = 0; _nhi < _goNextDayHooks.length; _nhi++) {
            try { _goNextDayHooks[_nhi](world); } catch(_nhe) { console.warn('[OW] goNextDay hook error:', _nhe); }
        }

        // 过渡动画：先淡出
        var mapEl = owEl('map-content');
        if (mapEl) {
            mapEl.style.transition = 'opacity 0.4s ease';
            mapEl.style.opacity = '0';
        }

        setTimeout(function() {
            stopWeatherParticles();
            nextDay(world);
            owSetWorld(world.contactId, world);
            var w = WEATHER_TYPES[world.weather] || WEATHER_TYPES.sunny;
            owToast('第' + world.currentDay + '天 · ' + w.emoji + ' ' + w.name, 'info');

            renderWorldMap(world);

            // 淡入
            if (mapEl) {
                mapEl.style.opacity = '0';
                setTimeout(function() {
                    mapEl.style.opacity = '1';
                    setTimeout(function() {
                        mapEl.style.transition = '';
                    }, 450);
                }, 30);
            }

            // 启动天气粒子
            setTimeout(function() {
                if (world.weather === 'rain' || world.weather === 'heavyrain' ||
                    world.weather === 'snow' || world.weather === 'windy') {
                    startWeatherParticles(world.weather);
                }
            }, 100);
            // 检测节日事件
            setTimeout(function() { triggerFestivalIfNeeded(world); }, 1200);
        }, 380);
    }

    // 返回选择页
    function goBack() {
        if (owState.worldData) {
            // [优化] 退出时立即保存，不走 debounce
            owSetWorldImmediate(owState.worldData.contactId, owState.worldData);
        }
        owState.worldData = null;
        owState.contactId = null;
        // [FIX-横屏v8] 返回联系人选择页时保持横屏，不解除锁定
        // owUnlockLandscape(); // 整个地图app都横屏
        // [FIX-大地图返回白屏v4] 重置视图状态：将 _lastView 设为 null 而非 'select'
        // 这样 renderContainer 检测到 _lastView !== currentView 时不会触发过渡动画
        // （因为 withTransition 默认 true，但 _lastView=null 时条件 owState._lastView && ... 为 false）
        owState.currentView = 'select';
        owState._lastView = null;
        stopWeatherParticles();
        // [FIX-大地图返回白屏v4] 先强制清除容器的 opacity/transition 残留，再渲染
        var _mapEl = owEl('map-content');
        if (_mapEl) { _mapEl.style.opacity = ''; _mapEl.style.transition = ''; }
        renderContactSelect();
        // [FIX-大地图返回白屏v4] 渲染后再次确保可见（防止 renderContainer 内部又设了 opacity:0）
        if (_mapEl) { _mapEl.style.opacity = '1'; }
    }

    // 显示联系人状态（跳转到状态面板）
    function showContactStatus() {
        var world = owState.worldData;
        if (!world) return;
        renderStatusPanel(world);
    }

    // 联系人详情面板（点击HUD头像触发）
    function showContactDetail() {
        var world = owState.worldData;
        if (!world) return;
        var contact = owGetContact(world.contactId);
        if (!contact) return;

        var moodKey = getContactMood(world);
        var mood = CONTACT_MOODS[moodKey] || CONTACT_MOODS.normal;
        var relationStage = getRelationStage(world.relationProgress);
        var stageIdx = RELATION_STAGES.indexOf(relationStage);
        var curThresh = RELATION_THRESHOLDS[stageIdx] || 0;
        var nextThresh = RELATION_THRESHOLDS[stageIdx + 1] || (curThresh + 50);
        var relPct = Math.min(100, Math.round(((world.relationProgress - curThresh) / (nextThresh - curThresh)) * 100));

        // 联系人当前位置
        var curLoc = world.contactCurrentLocation
            ? world.locations.find(function(l) { return l.id === world.contactCurrentLocation; })
            : null;
        var nextSlot = getContactNextScheduleSlot(world);

        // 今日日程预览
        var dayOfWeek = getDayOfWeek(world);
        var isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        var schedule = world.contactSchedule
            ? (isWeekend ? world.contactSchedule.weekends : world.contactSchedule.workdays)
            : null;

        var el = renderContainer();
        var theme = WORLD_THEMES[world.themeKey] || WORLD_THEMES.modern;
        var cname = contact.remark || contact.name;

        var html = '<div class="ow-contact-detail-page">';
        html += '<div class="ow-scene-header">';
        html += '<div class="ow-scene-back" onclick="window._openWorld.showMap()"><i class="fas fa-chevron-left"></i></div>';
        html += '<div class="ow-scene-title">👤 ' + owEscape(cname) + '</div>';
        html += '</div>';

        // 头像+基本信息
        html += '<div class="ow-cd-hero" style="background:' + theme.bg + ';">';
        if (contact.avatar) {
            html += '<img class="ow-cd-avatar" src="' + owEscape(contact.avatar) + '">';
        } else {
            html += '<div class="ow-cd-avatar ow-cd-avatar-placeholder">👤</div>';
        }
        html += '<div class="ow-cd-info">';
        html += '<div class="ow-cd-name">' + owEscape(cname) + '</div>';
        html += '<div class="ow-cd-mood">' + mood.emoji + ' ' + mood.name + ' <span class="ow-cd-mood-desc">— ' + mood.desc + '</span></div>';
        html += '<div class="ow-cd-relation-stage">' + relationStage + '</div>';
        html += '<div class="ow-cd-rel-bar-wrap"><div class="ow-cd-rel-bar" style="width:' + relPct + '%"></div></div>';
        html += '<div class="ow-cd-rel-num">' + world.relationProgress + ' / ' + nextThresh + ' → ' + owEscape(RELATION_STAGES[stageIdx + 1] || '最高') + '</div>';
        html += '<div class="ow-cd-edit-fav" onclick="window._openWorld.showFavEditor()"><i class="fas fa-sliders-h"></i> 调整好感度</div>';
        html += '</div>';
        html += '</div>';

        // 人设标签 + 摘要
        var cdPersonaTags = extractPersonaTags(contact);
        var cdPersonaSummary = getPersonaSummary(contact);
        if (cdPersonaTags.length > 0 || cdPersonaSummary) {
            html += '<div class="ow-cd-section">';
            html += '<div class="ow-cd-section-title">✨ 性格特点</div>';
            if (cdPersonaTags.length > 0) {
                html += '<div class="ow-cd-persona-tags">';
                cdPersonaTags.forEach(function(tag) {
                    html += '<span class="ow-cd-persona-tag">' + owEscape(tag) + '</span>';
                });
                html += '</div>';
            }
            if (cdPersonaSummary) {
                html += '<div class="ow-cd-persona-summary">' + owEscape(cdPersonaSummary) + '</div>';
            }
            html += '</div>';
        }

        // 当前状态
        html += '<div class="ow-cd-section">';
        html += '<div class="ow-cd-section-title">📍 当前状态</div>';
        if (curLoc) {
            html += '<div class="ow-cd-status-row">';
            html += '<span class="ow-cd-status-icon">' + curLoc.icon + '</span>';
            html += '<span class="ow-cd-status-text">正在 <strong>' + owEscape(curLoc.name) + '</strong>';
            if (nextSlot && nextSlot.locId === world.contactCurrentLocation) {
                html += ' <span class="ow-cd-until">（预计停留至 ' + nextSlot.until + ':00）</span>';
            }
            html += '</span>';
            html += '<button class="ow-cd-goto-btn" onclick="window._openWorld.visitLocation(\'' + curLoc.id + '\')">前往</button>';
            html += '</div>';
        } else {
            html += '<div class="ow-cd-status-row"><span>位置未知</span></div>';
        }
        html += '</div>';

        // 今日日程
        if (schedule) {
            html += '<div class="ow-cd-section">';
            html += '<div class="ow-cd-section-title">📅 今日日程（' + (isWeekend ? '周末' : '工作日') + '）</div>';
            html += '<div class="ow-cd-schedule-list">';
            Object.keys(schedule).forEach(function(timeRange) {
                var locId = schedule[timeRange];
                var loc = locId === 'home' ? { name: '家', icon: '🏠' }
                    : world.locations.find(function(l) { return l.id === locId; });
                var isCurrent = (nextSlot && nextSlot.locId === locId && world.currentHour >= parseInt(timeRange.split('-')[0]));
                html += '<div class="ow-cd-schedule-item' + (isCurrent ? ' ow-cd-schedule-current' : '') + '">';
                html += '<span class="ow-cd-sched-time">' + timeRange.replace('-', ':00 - ') + ':00</span>';
                html += '<span class="ow-cd-sched-loc">' + (loc ? loc.icon + ' ' + owEscape(loc.name) : locId) + '</span>';
                if (isCurrent) html += '<span class="ow-cd-sched-now">现在</span>';
                html += '</div>';
            });
            html += '</div>';
            html += '</div>';
        }

        // 互动统计
        html += '<div class="ow-cd-section">';
        html += '<div class="ow-cd-section-title">📊 互动记录</div>';
        html += '<div class="ow-cd-stats-grid">';
        html += '<div class="ow-cd-stat"><span class="ow-cd-stat-val">' + (world.contactMetCount || 0) + '</span><span class="ow-cd-stat-label">相遇次数</span></div>';
        html += '<div class="ow-cd-stat"><span class="ow-cd-stat-val">' + (world.sharedMemories ? world.sharedMemories.length : 0) + '</span><span class="ow-cd-stat-label">共同记忆</span></div>';
        html += '<div class="ow-cd-stat"><span class="ow-cd-stat-val">' + world.currentDay + '</span><span class="ow-cd-stat-label">相识天数</span></div>';
        html += '</div>';
        html += '</div>';

        html += '<div class="ow-cd-actions">';
        html += '<button class="ow-cd-action-btn" onclick="window._openWorld.showStatus()"><i class="fas fa-chart-bar"></i> 查看完整状态</button>';
        html += '<button class="ow-cd-action-btn" onclick="window._openWorld.showFavLog()"><i class="fas fa-history"></i> 好感度日志</button>';
        html += '<button class="ow-cd-action-btn" onclick="window._openWorld.showFavEditor()"><i class="fas fa-edit"></i> 手动调整好感度</button>';
        html += '</div>';

        html += '</div>';
        el.innerHTML = html;
        owState.currentView = 'contactdetail';
    }

    // 记忆详情弹窗（V2统一风格）
    function showMemoryDetail(idx) {
        var world = owState.worldData;
        if (!world || !world.sharedMemories) return;
        var mem = world.sharedMemories[idx];
        if (!mem) return;

        owModal({
            title: '记忆详情',
            icon: '💭',
            size: 'sm',
            content: '<div style="color:#333;line-height:1.8;white-space:pre-wrap;">' + owEscape(mem) + '</div>',
            buttons: [{ text: '关闭', cls: 'secondary', onClick: "this.closest('.ow-modal-overlay').remove()" }]
        });
    }

    // 触发节日事件（在 enterWorld 和 nextDay 后调用）
    function triggerFestivalIfNeeded(world) {
        var result = checkFestivalEvent(world);
        if (!result) return;
        var festival = result.festival;
        var evt = result.event;
        owSetWorld(world.contactId, world);

        // 显示节日提示后触发剧情
        setTimeout(function() {
            owToast(festival.emoji + ' 今天是' + festival.name + '！', 'info');
            setTimeout(function() {
                var contact = owGetContact(world.contactId);
                var cname = contact ? (contact.remark || contact.name) : '联系人';
                var script = evt.script.map(function(s) {
                    s = Object.assign({}, s);
                    if (s.text) s.text = s.text.replace(/\{\{contact\}\}/g, cname);
                    if (s.speaker) s.speaker = s.speaker.replace(/\{\{contact\}\}/g, cname);
                    return s;
                });
                renderDialog(world, script, function(effects) {
                    applyEffects(world, effects);
                    world.sharedMemories = world.sharedMemories || [];
                    world.sharedMemories.push('[第' + world.currentDay + '天] ' + festival.name + '：' + evt.name);
                    if (world.sharedMemories.length > 20) world.sharedMemories.shift();
                    owSetWorld(world.contactId, world);
                    showEffectNotification(effects);
                    setTimeout(function() { showMap(); }, 300);
                });
            }, 1200);
        }, 500);
    }

    // 对话框：继续（支持打字机跳过）
    function dialogNext() {
        // 如果打字机还在进行，先跳到末尾
        if (!owState._typingDone) {
            var textEl = document.getElementById('ow-dialog-typetext');
            if (textEl && owState.dialogQueue[owState.dialogIndex]) {
                var step = owState.dialogQueue[owState.dialogIndex];
                var cname = '';
                var contact = owState.worldData ? owGetContact(owState.worldData.contactId) : null;
                if (contact) cname = contact.remark || contact.name;
                var fullText = (step.text || '').replace(/\{\{contact\}\}/g, cname);
                textEl.textContent = fullText;
                owState._typingDone = true;
                return;
            }
        }
        owState.dialogIndex++;
        if (window._openWorld._renderDialogStep) {
            window._openWorld._renderDialogStep();
        }
    }

    // 对话框：选择
    function dialogChoice(optionIndex) {
        var world = owState.worldData;
        var step = owState.dialogQueue[owState.dialogIndex];
        if (!step || step.type !== 'choice') return;

        var opt = (step.options || [])[optionIndex];
        if (!opt) return;

        // Fix5: 检查选项前置条件（如 minMoney）
        var cond = opt.condition || {};
        if (cond.minMoney && world && world.playerMoney < cond.minMoney) {
            owToast('金钱不足，无法选择此项', 'warning');
            return;
        }
        if (cond.minRelation && world && world.relationProgress < cond.minRelation) {
            owToast('关系不够，无法选择此项', 'warning');
            return;
        }

        // 累积效果
        var eff = opt.effect || {};
        owState.dialogEffects.money = (owState.dialogEffects.money || 0) + (eff.money || 0);
        owState.dialogEffects.relation = (owState.dialogEffects.relation || 0) + (eff.relation || 0);
        if (eff.favorability) owState.dialogEffects.favorability = eff.favorability;

        // 如果有结果文本，插入旁白
        if (opt.resultText) {
            owState.dialogQueue.splice(owState.dialogIndex + 1, 0, {
                type: 'narration',
                text: opt.resultText
            });
        }

        owState.dialogIndex++;
        if (window._openWorld._renderDialogStep) {
            window._openWorld._renderDialogStep();
        }
    }

    // ==================== 横屏管理 ====================

    var owLandscapeHint = null;

    function owLockLandscape() {
        // [FIX] 始终强制用CSS旋转方案铺满横屏，不做任何方向检测
        // ow-portrait-rotate 会让 #layer-map rotate(90deg) 填满整个视口
        document.documentElement.classList.add('ow-portrait-rotate');
    }

    function owUnlockLandscape() {
        owRemoveLandscapeHint();
        document.documentElement.classList.remove('ow-portrait-rotate');
    }

    function owFallbackLandscape() {
        // [已禁用] 不做任何方向检测
    }

    function owShowLandscapeHint() {
        if (!owLandscapeHint) {
            owLandscapeHint = document.createElement('div');
            owLandscapeHint.className = 'ow-landscape-hint';
            owLandscapeHint.innerHTML =
                '<div class="ow-landscape-hint-icon">📱</div>' +
                '<div class="ow-landscape-hint-text">请横屏游玩</div>' +
                '<div class="ow-landscape-hint-sub">旋转手机以获得最佳体验</div>';
            document.body.appendChild(owLandscapeHint);
        }
        owLandscapeHint.classList.add('show');
    }

    function owHideLandscapeHint() {
        if (owLandscapeHint) owLandscapeHint.classList.remove('show');
    }

    function owRemoveLandscapeHint() {
        if (owLandscapeHint) {
            owLandscapeHint.remove();
            owLandscapeHint = null;
        }
        if (owState._orientationListener) {
            window.removeEventListener('resize', owState._orientationListener);
            owState._orientationListener = null;
        }
    }

    // ==================== 主入口 ====================

    function init() {
        // 修改layer-map的标题
        var navTitle = document.querySelector('#layer-map .nav-title');
        if (navTitle) navTitle.textContent = '地图';

        // [FIX-联系人选择页黑屏] 联系人选择页不需要横屏旋转，
        // 横屏旋转延迟到 enterWorld() 真正进入世界地图后再执行
        // owLockLandscape(); ← 移到 enterWorld() 中

        renderContactSelect();
    }

    // [FIX-联系人选择页黑屏] 关闭地图layer时解除横屏锁定
    function cleanup() {
        owUnlockLandscape();
    }

    // ==================== HUD折叠/展开 ====================
    function toggleHud() {
        owState._hudCollapsed = !owState._hudCollapsed;
        var hudEl = document.getElementById('ow-hud-top');
        if (hudEl) {
            hudEl.classList.toggle('ow-hud-collapsed', owState._hudCollapsed);
            // 更新箭头图标
            var icon = hudEl.querySelector('.ow-hud-toggle-icon');
            if (icon) {
                icon.className = 'fas fa-chevron-' + (owState._hudCollapsed ? 'down' : 'up') + ' ow-hud-toggle-icon';
            }
        }
    }

    // ==================== 联系人位置横条拖动 ====================
    var _hintDragData = { startY: 0, startTop: 0, dragging: false, moved: false };
    function _hintDragStart(e) {
        var el = document.getElementById('ow-contact-hint');
        if (!el) return;
        _hintDragData.startY = e.touches[0].clientY;
        _hintDragData.startTop = parseInt(el.style.top) || el.getBoundingClientRect().top;
        _hintDragData.dragging = true;
        _hintDragData.moved = false;
        el.style.transition = 'none';
    }
    function _hintDragMove(e) {
        if (!_hintDragData.dragging) return;
        var el = document.getElementById('ow-contact-hint');
        if (!el) return;
        var dy = e.touches[0].clientY - _hintDragData.startY;
        if (Math.abs(dy) > 3) _hintDragData.moved = true;
        if (!_hintDragData.moved) return;
        e.preventDefault();
        var newTop = Math.max(5, Math.min(window.innerHeight - 50, _hintDragData.startTop + dy));
        el.style.top = newTop + 'px';
        el.style.transform = 'translateX(-50%)'; // 保持水平居中
    }
    function _hintDragEnd() {
        _hintDragData.dragging = false;
        var el = document.getElementById('ow-contact-hint');
        if (el) el.style.transition = 'top 0.15s ease';
    }

    // ==================== 剧本编辑器系统 ====================

    // 剧本标记语法解析器：将用户的简单标记转为 renderDialog 可用的 script 数组
    function parseScriptMarkup(text) {
        if (!text || !text.trim()) return [];
        var lines = text.split('\n');
        var script = [];
        var currentSection = null;
        var sections = {}; // 分支段落

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line) continue;

            // ## 分支标题
            if (/^##\s+(.+)/.test(line)) {
                currentSection = RegExp.$1.trim();
                if (!sections[currentSection]) sections[currentSection] = [];
                continue;
            }
            // # 章节标题（忽略，仅作注释）
            if (/^#\s+/.test(line)) continue;

            var target = currentSection ? sections[currentSection] : script;

            // [场景] 描述
            if (/^\[场景\]\s*(.+)/.test(line)) {
                target.push({ type: 'narration', text: RegExp.$1.trim() });
            }
            // [旁白] 描述
            else if (/^\[旁白\]\s*(.+)/.test(line)) {
                target.push({ type: 'narration', text: RegExp.$1.trim() });
            }
            // [角色名] 对话
            else if (/^\[(.+?)\]\s*(.+)/.test(line)) {
                var speaker = RegExp.$1.trim();
                var text2 = RegExp.$2.trim();
                if (speaker === '你' || speaker === '玩家') {
                    target.push({ type: 'dialogue', speaker: '你', text: text2 });
                } else {
                    target.push({ type: 'dialogue', speaker: speaker, text: text2 });
                }
            }
            // [选择] 开始选项块
            else if (/^\[选择\]/.test(line)) {
                var options = [];
                // 读取后续的 - 选项行
                while (i + 1 < lines.length) {
                    var nextLine = lines[i + 1].trim();
                    if (/^-\s+(.+)/.test(nextLine)) {
                        i++;
                        var optText = RegExp.$1.trim();
                        var effect = {};
                        var resultText = '';
                        // 解析 → 效果
                        if (/→\s*(.+)/.test(optText)) {
                            var afterArrow = RegExp.$1.trim();
                            optText = optText.replace(/→.*/, '').trim();
                            // 解析效果：好感+5, 金钱-10, 接"xxx"
                            var effMatch = afterArrow.match(/好感([+-]\d+)/);
                            if (effMatch) effect.relation = parseInt(effMatch[1]);
                            var moneyMatch = afterArrow.match(/金钱([+-]\d+)/);
                            if (moneyMatch) effect.money = parseInt(moneyMatch[1]);
                            var resultMatch = afterArrow.match(/接"(.+?)"/);
                            if (resultMatch) resultText = resultMatch[1];
                            // 如果没有特殊效果标记，整段作为resultText
                            if (!effMatch && !moneyMatch && !resultMatch) {
                                resultText = afterArrow;
                            }
                        }
                        options.push({ text: optText, effect: effect, resultText: resultText });
                    } else {
                        break;
                    }
                }
                if (options.length > 0) {
                    target.push({ type: 'choice', options: options });
                }
            }
        }
        return script;
    }

    // 剧本数据管理
    function getStories(world) {
        if (!world.userStories) world.userStories = [];
        return world.userStories;
    }

    function saveStory(world, story) {
        if (!world.userStories) world.userStories = [];
        var idx = world.userStories.findIndex(function(s) { return s.id === story.id; });
        if (idx >= 0) {
            world.userStories[idx] = story;
        } else {
            world.userStories.push(story);
        }
        owSetWorld(world.contactId, world);
    }

    function deleteStory(world, storyId) {
        if (!world.userStories) return;
        world.userStories = world.userStories.filter(function(s) { return s.id !== storyId; });
        owSetWorld(world.contactId, world);
    }

    // 剧本列表页
    function renderScriptList() {
        var world = owState.worldData;
        if (!world) return;
        var el = renderContainer();
        if (!el) return;

        var stories = getStories(world);
        var html = '<div class="ow-script-editor">';
        html += '<div class="ow-script-editor-header">';
        html += '<button class="ow-script-editor-back" onclick="window._openWorld.showMap()"><i class="fas fa-chevron-left"></i></button>';
        html += '<span class="ow-script-editor-title">📖 我的剧本</span>';
        html += '</div>';

        if (stories.length === 0) {
            html += '<div class="ow-script-empty">';
            html += '<div class="ow-script-empty-icon">📝</div>';
            html += '<div class="ow-script-empty-text">还没有剧本，点击右下角创建第一个吧</div>';
            html += '</div>';
        } else {
            html += '<div class="ow-script-list">';
            stories.forEach(function(s, idx) {
                var statusCls = s.status === 'active' ? 'active' : s.status === 'completed' ? 'done' : 'draft';
                var statusText = s.status === 'active' ? '已激活' : s.status === 'completed' ? '已完成' : '草稿';
                html += '<div class="ow-script-card" onclick="window._openWorld.editScript(\'' + s.id + '\')">';
                html += '<div class="ow-script-card-icon">' + (s.isMainLine ? '📕' : '📄') + '</div>';
                html += '<div class="ow-script-card-info">';
                html += '<div class="ow-script-card-title">' + owEscape(s.title || '未命名剧本') + '</div>';
                html += '<div class="ow-script-card-meta">' + (s.isMainLine ? '主线' : '支线') + ' · 第' + (s.order || idx + 1) + '章</div>';
                html += '</div>';
                html += '<span class="ow-script-card-status ow-script-card-status-' + statusCls + '">' + statusText + '</span>';
                html += '</div>';
            });
            html += '</div>';
        }

        html += '<button class="ow-script-fab" onclick="window._openWorld.newScript()">+</button>';
        html += '</div>';
        el.innerHTML = html;
        owState.currentView = 'scriptList';
    }

    // 新建剧本
    function newScript() {
        var world = owState.worldData;
        if (!world) return;
        var id = 'story_' + Date.now();
        var story = {
            id: id,
            title: '',
            rawText: '',
            compiledScript: [],
            triggerCondition: { minRelation: 0 },
            isMainLine: false,
            order: (world.userStories || []).length + 1,
            status: 'draft',
            lastEdited: Date.now()
        };
        saveStory(world, story);
        renderScriptEditor(story.id);
    }

    // 剧本编辑器页面
    function renderScriptEditor(storyId) {
        var world = owState.worldData;
        if (!world) return;
        var story = (world.userStories || []).find(function(s) { return s.id === storyId; });
        if (!story) return;

        var el = renderContainer();
        if (!el) return;

        owState._editingStoryId = storyId;

        var html = '<div class="ow-script-editor">';
        // 头部
        html += '<div class="ow-script-editor-header">';
        html += '<button class="ow-script-editor-back" onclick="window._openWorld.showScriptList()"><i class="fas fa-chevron-left"></i></button>';
        html += '<input class="ow-script-editor-title" style="border:none;outline:none;background:transparent;font-size:16px;font-weight:700;flex:1;" ' +
            'value="' + owEscape(story.title || '') + '" placeholder="输入剧本标题…" id="ow-script-title-input">';
        html += '<div class="ow-script-editor-actions">';
        html += '<button class="ow-script-action-btn ow-script-action-btn-ai" onclick="window._openWorld.showAiPanel()">🤖 AI</button>';
        html += '<button class="ow-script-action-btn ow-script-action-btn-preview" onclick="window._openWorld.previewScript()">▶ 预览</button>';
        html += '<button class="ow-script-action-btn ow-script-action-btn-save" onclick="window._openWorld.saveCurrentScript()">💾</button>';
        html += '</div></div>';

        // 编辑区
        html += '<textarea class="ow-script-textarea" id="ow-script-textarea" placeholder="' +
            '在这里写你的剧本…\\n\\n' +
            '语法示例：\\n' +
            '[场景] 咖啡馆，午后阳光\\n' +
            '[旁白] 你推开门，听到了风铃声。\\n' +
            '[小浪] 这个位子有人吗？\\n' +
            '[你] 没有，请坐。\\n' +
            '[选择]\\n' +
            '- 主动搭话 → 好感+5\\n' +
            '- 低头看书 → 好感+1' +
            '">' + owEscape(story.rawText || '') + '</textarea>';

        // 底部工具栏
        html += '<div class="ow-script-toolbar">';
        html += '<button class="ow-script-toolbar-btn" onclick="window._openWorld.insertTag(\'scene\')">🎬 场景</button>';
        html += '<button class="ow-script-toolbar-btn" onclick="window._openWorld.insertTag(\'narration\')">📝 旁白</button>';
        html += '<button class="ow-script-toolbar-btn" onclick="window._openWorld.insertTag(\'dialogue\')">💬 对话</button>';
        html += '<button class="ow-script-toolbar-btn" onclick="window._openWorld.insertTag(\'choice\')">🔀 选择</button>';
        html += '<button class="ow-script-toolbar-btn" onclick="window._openWorld.showConditionEditor()">⚙️ 触发条件</button>';
        html += '<button class="ow-script-toolbar-btn" style="color:#E91E63;" onclick="window._openWorld.toggleStoryStatus()">⚡ ' + (story.status === 'active' ? '停用' : '激活') + '</button>';
        html += '<button class="ow-script-toolbar-btn" style="color:#DC2626;" onclick="window._openWorld.deleteCurrentScript()">🗑️</button>';
        html += '</div>';

        html += '</div>';
        el.innerHTML = html;
        owState.currentView = 'scriptEditor';
    }

    // 插入标记标签
    function insertTag(type) {
        var ta = document.getElementById('ow-script-textarea');
        if (!ta) return;
        var insertMap = {
            scene: '\n[场景] ',
            narration: '\n[旁白] ',
            dialogue: '\n[角色名] ',
            choice: '\n[选择]\n- 选项一 → 好感+5\n- 选项二 → 好感+1\n'
        };
        var pos = ta.selectionStart || ta.value.length;
        var text = insertMap[type] || '';
        ta.value = ta.value.substring(0, pos) + text + ta.value.substring(pos);
        ta.focus();
        ta.selectionStart = ta.selectionEnd = pos + text.length;
    }

    // 保存当前剧本
    function saveCurrentScript() {
        var world = owState.worldData;
        if (!world || !owState._editingStoryId) return;
        var story = (world.userStories || []).find(function(s) { return s.id === owState._editingStoryId; });
        if (!story) return;

        var titleInput = document.getElementById('ow-script-title-input');
        var textarea = document.getElementById('ow-script-textarea');
        if (titleInput) story.title = titleInput.value.trim() || '未命名剧本';
        if (textarea) story.rawText = textarea.value;
        story.compiledScript = parseScriptMarkup(story.rawText);
        story.lastEdited = Date.now();
        saveStory(world, story);
        owToastV2('剧本已保存', 'success');
    }

    // 预览剧本（复用 renderDialog）
    function previewScript() {
        var world = owState.worldData;
        if (!world || !owState._editingStoryId) return;
        // 先保存
        saveCurrentScript();
        var story = (world.userStories || []).find(function(s) { return s.id === owState._editingStoryId; });
        if (!story || !story.compiledScript || story.compiledScript.length === 0) {
            owToastV2('剧本为空，无法预览', 'warning');
            return;
        }
        // 替换 {{contact}} 为联系人名
        var contact = owGetContact(world.contactId);
        var cname = contact ? (contact.remark || contact.name) : '联系人';
        var scriptCopy = JSON.parse(JSON.stringify(story.compiledScript));
        scriptCopy.forEach(function(item) {
            if (item.text) item.text = item.text.replace(/\{\{contact\}\}/g, cname);
            if (item.speaker && item.speaker !== '你') {
                // 如果speaker不是具体名字，替换为联系人名
                if (item.speaker === '联系人' || item.speaker === 'TA') item.speaker = cname;
            }
        });
        renderDialog(world, scriptCopy, function() {
            renderScriptEditor(owState._editingStoryId);
        });
    }

    // AI辅助面板
    function showAiPanel() {
        owModal({
            title: 'AI 剧本助手',
            icon: '🤖',
            size: 'md',
            content: '<div class="ow-script-ai-options">' +
                '<div class="ow-script-ai-option" onclick="window._openWorld.aiAssist(\'polish\')">' +
                '<span class="ow-script-ai-option-icon">🔧</span>' +
                '<div class="ow-script-ai-option-text"><div class="ow-script-ai-option-name">润色</div><div class="ow-script-ai-option-desc">保持剧情不变，补充场景描写和心理活动</div></div></div>' +
                '<div class="ow-script-ai-option" onclick="window._openWorld.aiAssist(\'expand\')">' +
                '<span class="ow-script-ai-option-icon">🌿</span>' +
                '<div class="ow-script-ai-option-text"><div class="ow-script-ai-option-name">扩写</div><div class="ow-script-ai-option-desc">补充旁白、分支选项和结果描写</div></div></div>' +
                '<div class="ow-script-ai-option" onclick="window._openWorld.aiAssist(\'generate\')">' +
                '<span class="ow-script-ai-option-icon">🧠</span>' +
                '<div class="ow-script-ai-option-text"><div class="ow-script-ai-option-name">从大纲生成</div><div class="ow-script-ai-option-desc">只写一句话概要，AI生成完整剧本</div></div></div>' +
                '</div>',
            buttons: [{ text: '取消', cls: 'secondary', onClick: "this.closest('.ow-modal-overlay').remove()" }]
        });
    }

    // AI辅助执行
    async function aiAssist(mode) {
        // 关闭面板
        var overlays = document.querySelectorAll('.ow-modal-overlay');
        overlays.forEach(function(o) { o.remove(); });

        var world = owState.worldData;
        if (!world) return;
        var contact = owGetContact(world.contactId);
        var persona = contact ? (contact.persona || '') : '';
        var textarea = document.getElementById('ow-script-textarea');
        if (!textarea) return;
        var currentText = textarea.value.trim();

        if (!currentText && mode !== 'generate') {
            owToastV2('请先写一些内容', 'warning');
            return;
        }

        owToastV2('AI正在处理…', 'info');

        var prompts = {
            polish: '你是视觉小说剧本润色助手。请润色以下剧本草稿，保持剧情走向不变，补充场景描写和心理活动。\n' +
                '【角色人设】' + smartPersonaExtract(persona, 400) + '\n' +
                '【要求】保持用户的标记格式（[场景][旁白][角色名][选择]），角色语气必须符合人设。\n\n' +
                '原始剧本：\n' + currentText,
            expand: '你是视觉小说剧本扩写助手。请扩写以下剧本，补充旁白、分支选项和结果描写。\n' +
                '【角色人设】' + smartPersonaExtract(persona, 400) + '\n' +
                '【要求】保持标记格式，选项要有差异化后果（用 → 好感+X 标注效果），角色语气符合人设。\n\n' +
                '原始剧本：\n' + currentText,
            generate: '你是视觉小说剧本生成助手。请根据以下大纲生成完整剧本。\n' +
                '【角色人设】' + smartPersonaExtract(persona, 400) + '\n' +
                '【格式要求】使用以下标记：\n[场景] 场景描述\n[旁白] 旁白文字\n[角色名] 对话内容\n[选择]\n- 选项文字 → 好感+X\n\n' +
                '【大纲】' + (currentText || '一次浪漫的偶遇')
        };

        try {
            var resp = await API.chatCompletion([
                { role: 'system', content: '你是专业的视觉小说剧本作家，只输出剧本标记格式内容。' },
                { role: 'user', content: prompts[mode] }
            ], { maxTokens: 2000 });

            var result = (resp.content || resp || '').trim();
            if (result) {
                textarea.value = result;
                owToastV2('AI处理完成', 'success');
            } else {
                owToastV2('AI返回为空', 'warning');
            }
        } catch (e) {
            console.warn('[OW Script] AI error:', e);
            owToastV2('AI处理失败', 'error');
        }
    }

    // 触发条件编辑器
    function showConditionEditor() {
        var world = owState.worldData;
        if (!world || !owState._editingStoryId) return;
        var story = (world.userStories || []).find(function(s) { return s.id === owState._editingStoryId; });
        if (!story) return;
        var cond = story.triggerCondition || {};

        var content = '<div style="margin-bottom:12px;color:#888;font-size:13px;">设置剧本触发条件（满足所有条件时可在地图中触发）</div>' +
            '<div class="ow-script-condition"><span class="ow-script-condition-label">好感≥</span><input class="ow-script-condition-input" type="number" id="ow-cond-relation" value="' + (cond.minRelation || 0) + '" min="0" max="250"></div>' +
            '<div class="ow-script-condition"><span class="ow-script-condition-label">天数≥</span><input class="ow-script-condition-input" type="number" id="ow-cond-day" value="' + (cond.minDay || 0) + '" min="0"></div>' +
            '<div class="ow-script-condition"><span class="ow-script-condition-label">地点</span><input class="ow-script-condition-input" type="text" id="ow-cond-location" value="' + owEscape(cond.location || '') + '" placeholder="留空=任意地点"></div>' +
            '<div style="margin-top:12px;"><label style="display:flex;align-items:center;gap:8px;font-size:14px;color:#333;cursor:pointer;">' +
            '<input type="checkbox" id="ow-cond-mainline" ' + (story.isMainLine ? 'checked' : '') + '> 标记为主线剧情</label></div>';

        owModal({
            title: '触发条件',
            icon: '⚙️',
            size: 'sm',
            id: 'ow-cond-overlay',
            content: content,
            buttons: [
                { text: '保存', cls: 'primary', onClick: "window._openWorld.saveCondition()" },
                { text: '取消', cls: 'secondary', onClick: "document.getElementById('ow-cond-overlay').remove()" }
            ]
        });
    }

    function saveCondition() {
        var world = owState.worldData;
        if (!world || !owState._editingStoryId) return;
        var story = (world.userStories || []).find(function(s) { return s.id === owState._editingStoryId; });
        if (!story) return;

        var relInput = document.getElementById('ow-cond-relation');
        var dayInput = document.getElementById('ow-cond-day');
        var locInput = document.getElementById('ow-cond-location');
        var mainlineInput = document.getElementById('ow-cond-mainline');

        story.triggerCondition = {
            minRelation: parseInt(relInput ? relInput.value : 0) || 0,
            minDay: parseInt(dayInput ? dayInput.value : 0) || 0,
            location: locInput ? locInput.value.trim() : ''
        };
        story.isMainLine = mainlineInput ? mainlineInput.checked : false;
        saveStory(world, story);

        var overlay = document.getElementById('ow-cond-overlay');
        if (overlay) overlay.remove();
        owToastV2('条件已保存', 'success');
        // 刷新编辑器工具栏
        renderScriptEditor(owState._editingStoryId);
    }

    // 切换剧本状态
    function toggleStoryStatus() {
        var world = owState.worldData;
        if (!world || !owState._editingStoryId) return;
        var story = (world.userStories || []).find(function(s) { return s.id === owState._editingStoryId; });
        if (!story) return;
        // 先保存当前内容
        saveCurrentScript();
        story.status = story.status === 'active' ? 'draft' : 'active';
        saveStory(world, story);
        owToastV2(story.status === 'active' ? '剧本已激活，将在满足条件时触发' : '剧本已停用', 'info');
        renderScriptEditor(owState._editingStoryId);
    }

    // 删除剧本
    function deleteCurrentScript() {
        var world = owState.worldData;
        if (!world || !owState._editingStoryId) return;
        owModal({
            title: '确认删除',
            icon: '⚠️',
            size: 'sm',
            content: '<div style="color:#666;">确定要删除这个剧本吗？此操作不可撤销。</div>',
            buttons: [
                { text: '删除', cls: 'danger', onClick: "window._openWorld.confirmDeleteScript()" },
                { text: '取消', cls: 'secondary', onClick: "this.closest('.ow-modal-overlay').remove()" }
            ]
        });
    }

    function confirmDeleteScript() {
        var world = owState.worldData;
        if (!world || !owState._editingStoryId) return;
        deleteStory(world, owState._editingStoryId);
        owState._editingStoryId = null;
        // 关闭弹窗
        var overlays = document.querySelectorAll('.ow-modal-overlay');
        overlays.forEach(function(o) { o.remove(); });
        owToastV2('剧本已删除', 'info');
        renderScriptList();
    }

    // 检查是否有可触发的用户剧本（在地图探索时调用）
    function checkUserStoryTrigger(world, locationId) {
        if (!world || !world.userStories) return null;
        var activeStories = world.userStories.filter(function(s) { return s.status === 'active'; });
        for (var i = 0; i < activeStories.length; i++) {
            var s = activeStories[i];
            var cond = s.triggerCondition || {};
            if (cond.minRelation && world.relationProgress < cond.minRelation) continue;
            if (cond.minDay && world.currentDay < cond.minDay) continue;
            if (cond.location && cond.location !== locationId) continue;
            // 检查是否已触发过
            if ((world.triggeredEvents || []).indexOf(s.id) >= 0) continue;
            // 满足条件，返回此剧本
            return s;
        }
        return null;
    }

    // ==================== 暴露API ====================

    window._openWorld = {
        init: init,
        cleanup: cleanup,
        enterWorld: enterWorld,
        visitLocation: visitLocation,
        triggerLocationEvent: triggerLocationEvent,
        meetContact: meetContact,
        startJob: startJob,
        selectJob: selectJob,           // Fix10
        buyItem: buyItem,
        inviteContactHome: inviteContactHome, // Fix9
        openShop: function(locId) {
            var world = owState.worldData;
            if (!world) return;
            owState._currentShopLocId = locId;
            owState._shopFromScene = false;
            renderShop(world, locId);
        },
        // Fix10: 从地点详情页打开商店
        openShopFromScene: function(locId) {
            var world = owState.worldData;
            if (!world) return;
            owState._currentShopLocId = locId;
            owState._shopFromScene = true;
            owState._currentSceneLocId = locId;
            renderShop(world, locId);
        },
        // Fix10: 商店返回地点详情
        backToScene: function() {
            var world = owState.worldData;
            if (!world) return;
            var locId = owState._currentSceneLocId;
            if (locId) {
                renderLocationDetail(world, locId);
            } else {
                showMap();
            }
        },
        showMap: showMap,
        showStatus: function() {
            var world = owState.worldData;
            if (world) renderStatusPanel(world);
        },
        showContactStatus: showContactStatus,
        showContactDetail: showContactDetail,
        showMemoryDetail: showMemoryDetail,
        showAchievements: function() {
            var world = owState.worldData;
            if (world) renderAchievements(world);
        },
        showJobSelect: function() {
            var world = owState.worldData;
            if (world) renderJobSelect(world);
        },
        nextDay: goNextDay,
        goBack: goBack,
        dialogNext: dialogNext,
        dialogChoice: dialogChoice,
        switchShopTab: switchShopTab,
        // HUD折叠
        toggleHud: toggleHud,
        // 联系人位置横条拖动
        _hintDragStart: _hintDragStart,
        _hintDragMove: _hintDragMove,
        _hintDragEnd: _hintDragEnd,
        // 内部工具（供渲染回调使用）
        _renderDialogStep: null,
        // Feature2: 好感度系统
        showFavEditor: showFavEditor,
        saveFavEdit: saveFavEdit,
        showFavLog: showFavLog,
        showNpcFavEditor: showNpcFavEditor,
        saveNpcFavEdit: saveNpcFavEdit,
        // 剧本编辑器
        showScriptList: renderScriptList,
        newScript: newScript,
        editScript: renderScriptEditor,
        saveCurrentScript: saveCurrentScript,
        previewScript: previewScript,
        showAiPanel: showAiPanel,
        aiAssist: aiAssist,
        insertTag: insertTag,
        showConditionEditor: showConditionEditor,
        saveCondition: saveCondition,
        toggleStoryStatus: toggleStoryStatus,
        deleteCurrentScript: deleteCurrentScript,
        confirmDeleteScript: confirmDeleteScript,
        checkUserStoryTrigger: checkUserStoryTrigger,
        // [FIX-地图白屏v4] 供 exitApp() 调用，重置内部状态防止下次打开时残留脏数据
        _resetState: function() {
            if (owState.worldData) {
                // [优化] 退出时立即保存，不走 debounce
                try { owSetWorldImmediate(owState.worldData.contactId, owState.worldData); } catch(_e) {}
            }
            owState.worldData = null;
            owState.contactId = null;
            owState.currentView = 'select';
            owState._lastView = null;
            stopWeatherParticles();
        }
    };

    // ==================== Feature2: 好感度系统完善 ====================

    // --- 2.1 用户手动修改好感度（V2统一弹窗）---
    function showFavEditor() {
        var world = owState.worldData;
        if (!world) return;
        var current = world.relationProgress || 0;
        var stage = getRelationStage(current);
        var presets = RELATION_STAGES.map(function(s, i) {
            return '<button class="ow-modal-preset-btn" onclick="document.getElementById(\'ow-fav-slider\').value=' + RELATION_THRESHOLDS[i] + ';document.getElementById(\'ow-fav-val\').textContent=' + RELATION_THRESHOLDS[i] + '">' + s + '(' + RELATION_THRESHOLDS[i] + ')</button>';
        }).join('');
        var content =
            '<div style="color:#888;font-size:13px;margin-bottom:12px;">当前：' + current + '（' + owEscape(stage) + '）</div>' +
            '<input type="range" min="0" max="250" value="' + current + '" id="ow-fav-slider" class="ow-modal-slider" ' +
            'oninput="document.getElementById(\'ow-fav-val\').textContent=this.value">' +
            '<div id="ow-fav-val" style="text-align:center;font-size:28px;font-weight:700;color:#E91E63;margin:8px 0;">' + current + '</div>' +
            '<div class="ow-modal-presets">' + presets + '</div>';
        owModal({
            title: '调整好感度',
            icon: '💕',
            size: 'sm',
            id: 'ow-fav-editor-overlay',
            content: content,
            buttons: [
                { text: '确认修改', cls: 'danger', onClick: "window._openWorld.saveFavEdit()" },
                { text: '取消', cls: 'secondary', onClick: "document.getElementById('ow-fav-editor-overlay').remove()" }
            ]
        });
    }

    function saveFavEdit() {
        var world = owState.worldData;
        if (!world) return;
        var slider = document.getElementById('ow-fav-slider');
        if (!slider) return;
        var val = parseInt(slider.value);
        var oldStage = getRelationStage(world.relationProgress);
        var oldVal = world.relationProgress;
        world.relationProgress = val;
        var newStage = getRelationStage(val);
        world.relationStage = newStage;
        // 记录日志
        addFavLog(world, val - oldVal, '手动调整');
        if (newStage !== oldStage) {
            var stageIdx = RELATION_STAGES.indexOf(newStage);
            setTimeout(function() { showRelationUpgrade(newStage, stageIdx); }, 400);
        }
        owSetWorld(world.contactId, world);
        var overlay = document.getElementById('ow-fav-editor-overlay');
        if (overlay) overlay.remove();
        owToastV2('好感度已修改为 ' + val, 'success');
        showContactDetail();
    }

    // --- 2.2 联系人自主好感度反应 ---
    // [优化] 改用钩子注册，消除猴子补丁链
    onApplyEffects(function(world, effects) {
        // 处理联系人自主反应
        if (effects && effects.contactReaction) {
            var cr = effects.contactReaction;
            var change = parseInt(cr.change) || 0;
            if (change !== 0) {
                world.relationProgress = Math.max(0, (world.relationProgress || 0) + change);
                addFavLog(world, change, cr.reason || '联系人反应');
                showContactReactionToast(change, cr.reason || '', cr.expression || '');
            }
        }
    });

    function showContactReactionToast(change, reason, expression) {
        var emoji = change > 5 ? '💕' : change > 0 ? '😊' : change > -5 ? '😐' : '😤';
        owNotify({
            icon: emoji,
            title: '对方好感度 ' + (change > 0 ? '+' : '') + change,
            desc: reason ? owEscape(reason) : '',
            badgeCls: change > 0 ? 'ow-notify-badge-pink' : '',
            duration: 3000
        });
    }

    // --- 2.3 好感度衰减机制 ---
    // [优化] 改用钩子注册，消除猴子补丁
    onNextDay(function(world) {
        // 检查是否有互动（当天回合数 > 0 表示有互动）
        var hadInteraction = (world.currentTurns || 0) > 0;
        if (!hadInteraction) {
            // 无互动衰减：每天 -1
            var decay = -1;
            if (world.relationProgress > 150) decay = -0.5; // 高好感衰减更慢
            if (world.relationProgress <= 0) decay = 0;
            if (decay !== 0) {
                world.relationProgress = Math.max(0, world.relationProgress + decay);
                addFavLog(world, decay, '长时间未互动');
            }
        }
        // 记录连续互动天数
        if (hadInteraction) {
            world._consecutiveInteractDays = (world._consecutiveInteractDays || 0) + 1;
            // 连续互动奖励：每3天+2
            if (world._consecutiveInteractDays % 3 === 0) {
                world.relationProgress = (world.relationProgress || 0) + 2;
                addFavLog(world, 2, '连续互动' + world._consecutiveInteractDays + '天奖励');
            }
        } else {
            world._consecutiveInteractDays = 0;
        }
        owSetWorld(world.contactId, world);
    });

    // --- 2.4 好感度日志系统 ---
    function addFavLog(world, change, reason) {
        if (!world._favLog) world._favLog = [];
        world._favLog.push({
            day: world.currentDay,
            hour: world.currentHour,
            change: change,
            reason: reason,
            newVal: world.relationProgress,
            time: Date.now()
        });
        // 最多保留50条
        if (world._favLog.length > 50) world._favLog = world._favLog.slice(-50);
    }

    function showFavLog() {
        var world = owState.worldData;
        if (!world) return;
        var logs = (world._favLog || []).slice().reverse();
        var logsHtml = logs.length === 0
            ? '<div style="text-align:center;color:#CCC;padding:30px;">暂无记录</div>'
            : logs.map(function(l) {
                var dotCls = l.change > 0 ? 'positive' : l.change < 0 ? 'negative' : 'neutral';
                var sign = l.change > 0 ? '+' : '';
                return '<div class="ow-modal-log-item">' +
                    '<div class="ow-modal-log-dot ' + dotCls + '"></div>' +
                    '<div class="ow-modal-log-content">' +
                    '<div class="ow-modal-log-reason">' + owEscape(l.reason) + ' <span style="color:#E91E63;font-weight:700;">' + sign + l.change + '</span></div>' +
                    '<div class="ow-modal-log-meta">第' + l.day + '天 ' + l.hour + ':00 · 好感度→' + l.newVal + '</div>' +
                    '</div></div>';
            }).join('');
        owModal({
            title: '好感度变化日志',
            icon: '📊',
            size: 'md',
            id: 'ow-favlog-overlay',
            content: logsHtml,
            buttons: [{ text: '关闭', cls: 'secondary', onClick: "document.getElementById('ow-favlog-overlay').remove()" }]
        });
    }

    // --- 2.5 里程碑事件触发 ---
    var FAV_MILESTONES = [
        { threshold: 30, name: '初识好感', desc: '对方开始对你产生好感', emoji: '😊', triggered: false },
        { threshold: 50, name: '朋友之上', desc: '你们的关系超越了普通朋友', emoji: '🤝', triggered: false },
        { threshold: 80, name: '心动时刻', desc: '对方的心跳开始加速', emoji: '💓', triggered: false },
        { threshold: 110, name: '暧昧升温', desc: '空气中弥漫着暧昧的气息', emoji: '🌸', triggered: false },
        { threshold: 150, name: '告白时刻', desc: '是时候表明心意了', emoji: '💝', triggered: false },
        { threshold: 200, name: '灵魂伴侣', desc: '你们已经是彼此最重要的人', emoji: '💞', triggered: false }
    ];

    function checkFavMilestones(world) {
        if (!world._favMilestonesTriggered) world._favMilestonesTriggered = [];
        var progress = world.relationProgress || 0;
        FAV_MILESTONES.forEach(function(m) {
            if (progress >= m.threshold && world._favMilestonesTriggered.indexOf(m.threshold) === -1) {
                world._favMilestonesTriggered.push(m.threshold);
                showMilestoneToast(m);
                // 记录到共同记忆
                world.sharedMemories = world.sharedMemories || [];
                world.sharedMemories.push('[第' + world.currentDay + '天] 里程碑：' + m.name + ' — ' + m.desc);
                if (world.sharedMemories.length > 20) world.sharedMemories.shift();
            }
        });
    }

    function showMilestoneToast(milestone) {
        owNotify({
            icon: milestone.emoji || '🌟',
            title: owEscape(milestone.name),
            desc: owEscape(milestone.desc),
            badge: '里程碑',
            badgeCls: 'ow-notify-badge-pink',
            duration: 4000
        });
    }

    // [优化] 里程碑检查改用钩子注册
    onApplyEffects(function(world, effects) {
        if (world) checkFavMilestones(world);
    });

    // --- 2.6 跨模块联动 ---
    // 暴露全局函数，让微信聊天等模块可以影响地图好感度
    window._owUpdateRelation = function(contactId, change, reason) {
        if (!store.openworld) return;
        var world = store.openworld[contactId];
        if (!world) return;
        var oldVal = world.relationProgress || 0;
        world.relationProgress = Math.max(0, oldVal + change);
        world.relationStage = getRelationStage(world.relationProgress);
        addFavLog(world, change, reason || '跨模块联动');
        if (typeof save === 'function') save();
    };

    // --- 2.7 NPC 好感度手动编辑（V2统一弹窗）---
    function showNpcFavEditor() {
        var world = owState.worldData;
        if (!world || !world.npcs || world.npcs.length === 0) {
            owToastV2('当前世界没有NPC', 'warning');
            return;
        }
        if (!world.npcFavorability) world.npcFavorability = {};
        var npcsHtml = world.npcs.map(function(npc) {
            var fav = world.npcFavorability[npc.id] || 0;
            return '<div class="ow-modal-fav-row">' +
                '<span class="ow-modal-fav-name">' + (npc.icon || '👤') + ' ' + owEscape(npc.name) + '</span>' +
                '<div class="ow-modal-fav-bar"><div class="ow-modal-fav-bar-fill" style="width:' + fav + '%" id="ow-npcbar-' + npc.id + '"></div></div>' +
                '<input type="number" min="0" max="100" value="' + fav + '" class="ow-modal-fav-input" ' +
                'id="ow-npcfav-' + npc.id + '" ' +
                'oninput="var v=Math.min(100,Math.max(0,parseInt(this.value)||0));var b=document.getElementById(\'ow-npcbar-' + npc.id + '\');if(b)b.style.width=v+\'%\'">' +
                '</div>';
        }).join('');
        owModal({
            title: 'NPC 好感度编辑',
            icon: '👥',
            size: 'md',
            id: 'ow-npcfav-overlay',
            content: npcsHtml,
            buttons: [
                { text: '保存全部', cls: 'primary', onClick: "window._openWorld.saveNpcFavEdit()" },
                { text: '取消', cls: 'secondary', onClick: "document.getElementById('ow-npcfav-overlay').remove()" }
            ]
        });
    }

    function saveNpcFavEdit() {
        var world = owState.worldData;
        if (!world) return;
        if (!world.npcFavorability) world.npcFavorability = {};
        (world.npcs || []).forEach(function(npc) {
            var slider = document.getElementById('ow-npcfav-' + npc.id);
            if (slider) {
                world.npcFavorability[npc.id] = parseInt(slider.value) || 0;
            }
        });
        owSetWorld(world.contactId, world);
        var overlay = document.getElementById('ow-npcfav-overlay');
        if (overlay) overlay.remove();
        owToast('NPC好感度已保存', 'info');
        checkAndUnlockAchievements(world, 'npc_favorability', {});
    }

})();
