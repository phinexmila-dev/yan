// === PAOPAO MODULE: 泡泡 - 明星模拟器 ===
(function(){
'use strict';

function escapeHtml(str){
    if(!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ====== 姓氏字库（大幅扩充） ======
var PP_SURNAMES = [
    '王','李','张','刘','陈','杨','赵','黄','周','吴','徐','孙','胡','朱','高',
    '林','何','郭','马','罗','梁','宋','郑','谢','韩','唐','冯','于','董','萧',
    '程','曹','袁','邓','许','傅','沈','曾','彭','吕','苏','卢','蒋','蔡','贾',
    '丁','魏','薛','叶','阎','余','潘','杜','戴','夏','钟','汪','田','任','姜',
    '范','方','石','姚','谭','廖','邹','熊','金','陆','郝','孔','白','崔','康',
    '毛','邱','秦','江','史','顾','侯','邵','孟','龙','万','段','章','钱','汤',
    '尹','易','黎','常','武','乔','贺','赖','龚','文','温','别','庄','晏','柴',
    '瞿','阚','闫','欧阳','上官','司马','诸葛','慕容','东方','独孤','南宫',
    '颜','季','祝','花','蓝','景','穆','霍','裴','甘','柳','褚','桑','闻','池',
    '楚','凤','云','燕','安','商','容','严','纪','席','单','童','游','聂','戚'
];

// ====== 名字单字库（用于组合生成更多名字） ======
var PP_SINGLE_CHARS_FEMALE = [
    '琪','涵','菲','欣','雅','曦','桐','宁','瑶','怡','韵','萱','若','嫣','婷',
    '静','瑾','灵','晴','月','颖','溪','芊','琳','清','沐','念','如','初','雪',
    '安','锦','玲','琉','芙','云','霓','薇','映','兰','梦','诗','语','心','芷',
    '可','乐','馨','慧','碧','知','依','澜','瑟','珑','璃','蓉','裳','章',
    '妍','霏','璇','瑜','蕊','黛','婉','珊','幽','荷','岚','凝','雯','筱','柔',
    '悠','纤','绮','翎','鸢','彤','茜','薰','樱','葵','铃','绫','瞳','蝶','羽'
];
var PP_SINGLE_CHARS_MALE = [
    '宇','轩','辉','远','然','染','辰','飞','博','泽','墨','霖','阳','行','竹',
    '鹤','文','熙','宸','渊','靖','衿','扬','树','华','云','风','沐','诺','卿',
    '澜','山','深','轩','和','雨','恒','安','南','瑾','白','鸿','承','渊','北',
    '舒','笙','霄','尘','鸿','致','弘','哲','苍','泽','烨','磊','鹏','焱','祺',
    '懿','涛','磊','洋','鑫','昊','煜','城','天','尧','逸','凌','朗','峰','瀚',
    '翊','珩','琅','羡','策','骁','铮','澈','晏','屹','奕','赫','楷','旭','枫'
];

// ====== 名字字库（组合名 - 大幅扩充） ======
var PP_GIVEN_NAMES_FEMALE = [
    '梦琪','思涵','艺菲','雨涵','嘉欣','雅琪','晨曦','雨桐','佳宁','梦瑶',
    '思怡','诗韵','婉儿','清韵','紫萱','若曦','语嫣','心怡','芷若','雪婷',
    '静怡','可欣','乐瑶','灵犀','诗晴','雨萱','婧瑶','馨月','颖欣','若溪',
    '芊芊','晴岚','慧琳','碧瑶','安宁','沐晴','清欢','知夏','念卿','如意',
    '初晴','暮雪','长安','流年','浅笑','微凉','素颜','倾城','半夏','南歌',
    '锦瑟','画眉','玲珑','琉璃','芙蓉','桃夭','云裳','霓裳','采薇','湘灵',
    '映雪','含章','佩兰','婉清','幼薇','织梦','瑾萱','依然','念念','安澜',
    '妍姿','霏雨','璇玑','瑜珥','蕊寒','黛玉','珊瑚','幽兰','荷月','岚烟',
    '凝露','雯媛','筱竹','柔嘉','悠然','纤云','绮罗','翎羽','鸢尾','彤霞',
    '茜草','薰衣','樱落','葵阳','铃兰','绫雪','瞳影','蝶舞','羽翼','星汐',
    '月棠','云锦','霜华','玉笙','琼枝','瑶台','凤歌','鹤归','燕语','雁行',
    '芷兮','青鸾','白露','朝颜','夕照','苏暖','楚楚','沅芷','澧兰','锦书'
];

var PP_GIVEN_NAMES_MALE = [
    '天宇','子轩','明辉','思远','浩然','墨染','星辰','逸飞','博远','泽宇',
    '子墨','瑞霖','晨阳','景行','修竹','鹤轩','文博','俊熙','宸宇','睿渊',
    '靖宇','子衿','清扬','玉树','风华','凌云','长风','沐阳','一诺','少卿',
    '君澜','远山','云深','明轩','清和','时雨','之恒','亦安','司南','怀瑾',
    '慕白','书鸿','承宇','知远','临渊','北辰','望舒','长卿','南笙','如是',
    '九霄','逸尘','鸿远','致远','弘文','哲瀚','擎苍','伟泽','烨磊','鹏飞',
    '昊焱','煜祺','嘉懿','煜城','博涛','天磊','绍辉','泽洋','鑫鹏','昊天',
    '翊铭','珩轩','琅华','羡之','策马','骁勇','铮然','澈明','晏清','屹立',
    '奕辰','赫然','楷瑞','旭东','枫林','朗逸','峰回','瀚海','凌霄','若谷',
    '予安','霁月','松岳','竹韵','兰亭','梧桐','砚池','墨白','棠序','鸿渐',
    '允恪','怀远','思齐','敬之','润泽','谦益','守正','弘毅','笃行','慎独',
    '子默','清辞','青峰','玄烨','凤鸣','龙吟','虎啸','鹰扬','麒麟','骐骥'
];

// ====== 随机生成姓名（混合策略：预设名+字库组合） ======
function ppRandomName(gender) {
    var surname = PP_SURNAMES[Math.floor(Math.random() * PP_SURNAMES.length)];
    var r = Math.random();
    if(r < 0.4) {
        // 40%概率使用预设的组合名
        var namePool = gender === 'male' ? PP_GIVEN_NAMES_MALE : PP_GIVEN_NAMES_FEMALE;
        return surname + namePool[Math.floor(Math.random() * namePool.length)];
    } else if(r < 0.7) {
        // 30%概率使用单字库组合双字名
        var charPool = gender === 'male' ? PP_SINGLE_CHARS_MALE : PP_SINGLE_CHARS_FEMALE;
        var c1 = charPool[Math.floor(Math.random() * charPool.length)];
        var c2 = charPool[Math.floor(Math.random() * charPool.length)];
        while(c2 === c1) c2 = charPool[Math.floor(Math.random() * charPool.length)];
        return surname + c1 + c2;
    } else {
        // 30%概率使用单字名
        var charPool = gender === 'male' ? PP_SINGLE_CHARS_MALE : PP_SINGLE_CHARS_FEMALE;
        return surname + charPool[Math.floor(Math.random() * charPool.length)];
    }
}

// ====== 经纪人名字池（大幅扩充） ======
var MANAGER_NAMES = [
    '王梦琪','李思涵','张天宇','陈艺菲','刘子轩','赵雨涵','黄嘉欣','周明辉',
    '吴思远','孙雅琪','林浩然','杨晨曦','郑雨桐','何佳宁','马天翔','高梦瑶',
    '罗思怡','谢星辰','唐诗韵','韩墨染','冯靖宇','于子衿','董清扬','萧玉树',
    '程风华','曹凌云','袁长风','邓沐阳','许一诺','傅少卿','沈君澜','曾远山',
    '苏锦年','顾清和','季怀瑾','白景行','容止','温如言','裴珩','霍北辰',
    '陆知远','江城子','卫青峰','秦朗逸','乔峰回','楚瀚海','燕凌霄','安若谷',
    '池予安','景霁月','穆松岳','花竹韵','蓝兰亭','褚梧桐','柳砚池','桑墨白'
];

var MANAGER_TITLES = [
    '金牌经纪人','资深经纪人','明星经纪人','新锐经纪人','全能经纪人',
    '顶级经纪人','知名经纪人','人气经纪人'
];

var ASSISTANT_NAMES = [
    '小叶','小周','小陈','小林','小杨','小赵','小孙','小吴',
    '小刘','小张','小王','小李','小黄','小郑','小马','小高',
    '小沈','小曾','小苏','小蒋','小谢','小韩','小唐','小冯',
    '小许','小卢','小魏','小薛','小方','小田','小金','小潘'
];

var ASSISTANT_TITLES = [
    '贴心助理','全能助理','专业助理','高效助理','超级助理',
    '金牌助理','暖心助理','机灵助理'
];

// ====== 经纪人/助理特质 ======
var MANAGER_TRAITS = [
    {trait:'人脉广', desc:'圈内人脉极广，能拿到优质资源', bonus:'资源+'},
    {trait:'商业嗅觉敏锐', desc:'精准把握商业合作机会', bonus:'商务+'},
    {trait:'谈判高手', desc:'为艺人争取最佳待遇', bonus:'收益+'},
    {trait:'危机处理', desc:'擅长处理公关危机', bonus:'口碑+'},
    {trait:'战略眼光', desc:'长远规划艺人发展路线', bonus:'发展+'},
    {trait:'媒体关系好', desc:'与各大媒体保持良好关系', bonus:'曝光+'},
];

var ASSISTANT_TRAITS = [
    {trait:'细心周到', desc:'照顾艺人日常起居', bonus:'状态+'},
    {trait:'效率极高', desc:'行程安排井井有条', bonus:'效率+'},
    {trait:'摄影技术好', desc:'随时拍出高质量照片', bonus:'形象+'},
    {trait:'社交达人', desc:'粉丝互动管理得当', bonus:'粉丝+'},
    {trait:'时尚品味', desc:'穿搭造型建议到位', bonus:'时尚+'},
    {trait:'情绪管理', desc:'善于调节艺人情绪', bonus:'心态+'},
];

// ====== 联系人消息模板（大幅扩充，减少重复） ======
var CONTACT_GREETINGS = [
    '今天过得怎么样呀？','在忙什么呢？','想你了~','刚看了你的新作品，太棒了！',
    '今天天气真好，一起出去走走？','你最近好像瘦了，要注意身体哦','晚上一起吃饭吗？',
    '我给你买了你最爱的奶茶🧋','刚才在想你...','今天的你也好好看！',
    '工作辛苦了，给你捏捏肩~','看到路边的花想到了你🌸','你的笑容是我最好的治愈💕',
    '今天拍摄顺利吗？','你昨天发的微博好好看','我看了你的最新采访，好有魅力啊',
    '刚才在超市看到你代言的产品了！','朋友都说你最近越来越好看了','今天的天气好适合拍照啊',
    '给你发个好看的风景图~','刚才梦到你了hh','你有没有在听什么好歌推荐一下',
    '我今天做了新菜，想给你尝尝','你的新发型好好看！','在追你演的那部剧，太入戏了',
    '别太累了，注意休息呀','我攒了好久的话想和你说~','今天是个特别的日子呢',
    '看你的照片就觉得好治愈','我也好想去你拍戏的那个城市','我把你的歌设成铃声了',
    '最近有没有什么开心的事分享一下~','你上次推荐的那家店好好吃！','想和你一起看日落🌅',
    '你知道吗，我今天被表扬了！想第一个告诉你','刚打完球，好累但好开心',
    '最近发现了一家宝藏火锅店，下次带你去','你有没有看最近那个很火的综艺？',
    '天冷了记得穿暖和一点！','今天心情有点down，能和你聊聊吗',
    '分享一首我最近在循环的歌~','周末有空吗？想约你出来',
    '刚看到一个搞笑视频想到了你哈哈','你上次说的那本书我买了！正在看',
    '你猜我今天遇到了什么好事','好想吃草莓蛋糕啊🍰','今天在地铁上看到你的广告了！好帅好美',
    '我把你的照片给我妈看了，她说你很好看hh','你最近有没有运动啊？一起跑步呀',
    '我攒了好久的勇气才敢发这条消息','你知道你的微笑有多治愈吗','今天加班好累，看看你的照片就好了',
    '又到周末了！有什么计划吗','这个天气好适合窝在家里看电影','我妈做了好吃的，给你留了一份',
    '你有推荐的电影/电视剧吗？好无聊','下雨了，你带伞了吗☔','分享一下我新养的小植物🌱',
    '你是不是又熬夜了？早点睡呀','今天路过你之前拍戏的那个地方，好怀念',
    '考试/面试终于结束了！解放啦','我学了一个新的菜谱，下次做给你吃',
    '有个好消息想告诉你！','我终于抢到你的演唱会门票了！！！',
    '你的新综艺好搞笑，看了好几遍','想问你一个很重要的事情...你吃饭了吗？😂',
    '今天看了一个关于你的采访合集，眼眶湿了','我把你的台词抄在了本子上，太好了',
    '你知道吗，追你这段时间我变得积极了好多','好想和你一起去旅行呀','刚买了你代言的那个产品，真的好用！',
    '你有没有什么减压的方式推荐？','今天同事问我手机壁纸是谁，我超自豪地介绍了你',
    '你说过的那句话我一直记着呢','好久没来找你聊天了，最近太忙了','今天特别想你，也不知道为什么',
    '我给你画了一幅画！虽然画得不太好hh','最近在学你之前说喜欢的那个乐器',
    '你相信缘分吗？我觉得遇见你就是最好的缘分','帮你数了一下，你今天已经发了三条微博了',
    '刚才看到星星了，第一个想到的就是你⭐','我梦到你给我签名了，醒来好失落😂'
];

// ====== 初始化数据 ======
function init(){
    if(!store.paopao) store.paopao = {};
    var d = store.paopao;
    if(!d.fans) d.fans = 5000;
    if(!d.tier) d.tier = '十八线';
    if(!d.stageName) d.stageName = store.user?.name || '小星星';
    if(!d.works) d.works = [];
    if(!d.blogPosts) d.blogPosts = []; // [FIX] 现在由个人资料页展示
    if(!d.chatMessages) d.chatMessages = [];
    if(!d.activeFans) d.activeFans = 8;
    if(!d.totalInteractions) d.totalInteractions = 0; // [FIX] 现在在用户发消息时累加
    if(!d.completedActivities) d.completedActivities = [];
    if(d.lastVisit === undefined) d.lastVisit = Date.now();
    // 联系人系统（关联微信联系人）
    if(!d.contacts) d.contacts = [];
    if(!d.contactChats) d.contactChats = {};
    // 经纪人和助理
    if(!d.manager) d.manager = null;
    if(!d.assistant) d.assistant = null;
    // 工作模式
    if(!d.workMode) d.workMode = '';
    if(!d.companyName) d.companyName = '';
    // 经济实力
    if(!d.money) d.money = 10000;
    // 挂载的表情包分类ID列表
    if(!d.mountedStickerCateIds) d.mountedStickerCateIds = [];
    // 用户上次发消息时间戳（用于判断是否预设滚动模式）
    if(!d.lastUserMsgTime) d.lastUserMsgTime = 0;
    // 群聊预设消息自动滚动开关（默认关闭，用户开启后才会自动弹预设/随机消息）
    if(typeof d.autoScrollEnabled === 'undefined') d.autoScrollEnabled = false;
    // 用户个人信息
    if(!d.gender) d.gender = ''; // 'male' or 'female' or ''
    if(!d.age) d.age = '';
    if(!d.avatar) d.avatar = ''; // base64 头像
    if(!d.setupComplete) d.setupComplete = false; // 是否完成初始设置
    // ====== 属性系统 ======
    if(!d.attrs) d.attrs = null; // {acting, looks, wisdom, rhythm, charm, talent, social}
    if(!d.backstory) d.backstory = ''; // 人生经历
    // ====== 新增：功能页面数据 ======
    if(!d.activeJobs) d.activeJobs = []; // 正在进行的工作 [{id, type, name, desc, stars, duration, startTime, progress, status}]
    if(!d.jobHistory) d.jobHistory = []; // 已完成的工作历史（现在由ppCompleteJob写入）
    if(!d.pendingEvent) d.pendingEvent = null; // 待处理的特殊事件
    if(!d.eventHistory) d.eventHistory = []; // 事件历史
    if(!d.activitySubTab) d.activitySubTab = 'tongGao'; // 功能页子tab: tongGao/zongYi/daiYan/blog/customBlog
    if(!d.cachedOffers) d.cachedOffers = {}; // 缓存的API生成内容 {tongGao:[], zongYi:[], daiYan:[], blog:[]}
    if(!d.lastOfferTime) d.lastOfferTime = {}; // 上次生成时间
    // ====== 获奖系统 ======
    if(!d.awards) d.awards = []; // 已获得的奖项 [{name, category, work, date, ceremony}]
    if(!d.awardNominations) d.awardNominations = []; // 提名 [{name, category, work, date, ceremony, status:'nominated'/'won'/'lost'}]
    if(!d.lastAwardCheck) d.lastAwardCheck = 0; // 上次检查奖项时间
    // ====== 热搜系统 ======
    if(!d.hotSearchHistory) d.hotSearchHistory = []; // 热搜历史
    if(!d.lastHotSearchTime) d.lastHotSearchTime = 0;
    if(!d.cachedHotSearch) d.cachedHotSearch = null; // 缓存的热搜数据
    // ====== 微博热搜系统（仿真版） ======
    if(!d.weiboHotCache) d.weiboHotCache = null; // 微博热搜榜缓存 {generatedAt, items:[]}
    if(!d.weiboTopicCache) d.weiboTopicCache = {}; // 话题详情缓存 {rank: detailData}
    if(!d.weiboSearchHistory) d.weiboSearchHistory = []; // 微博搜索历史
    if(!d.weiboLastBuyTime) d.weiboLastBuyTime = 0; // 上次买热搜时间
    if(!d.weiboLastRemoveTime) d.weiboLastRemoveTime = 0; // 上次撤热搜时间
    // ====== 自定义博客历史 ======
    if(!d.customBlogHistory) d.customBlogHistory = []; // 自定义博客历史 [{id, type, text, imageDesc, date, stats:{likes,comments,reposts}, commentList:[]}]
    // ====== 拍摄系统 ======
    if(d.currentShootingJob === undefined) d.currentShootingJob = null; // 当前正在拍摄的工作
    if(d.isShootingMinimized === undefined) d.isShootingMinimized = false; // 是否小窗模式
    // ====== 特别关心系统 ======
    if(!d.specialCareIds) d.specialCareIds = []; // 特别关心的联系人ID列表
    if(!d.adminIds) d.adminIds = []; // 设为管理员的联系人ID列表
    if(!d.pinnedIds) d.pinnedIds = []; // 置顶的联系人ID列表（消息列表中置顶显示）
    // ====== 财务流水 ======
    if(!d.financeLog) d.financeLog = []; // [{id, type:'income'|'expense', amount, category, desc, date}]
    // ====== 粉丝档案系统 ======
    if(!d.fanProfiles) d.fanProfiles = {}; // {fanName: {id, name, joinTime, level, type, loyalty, stats:{messages,dataWork,antiBlack,checkin,likes,reposts}, mood, color}}
    // ====== NPC明星系统 ======
    if(!d.npcStars) d.npcStars = []; // NPC明星列表
}

// ====== 粉丝档案管理 ======
var FAN_COLORS = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#e91e63','#00bcd4','#ff5722','#795548','#607d8b'];
var FAN_TYPES = ['普通粉','数据组','反黑组','前线组','站姐','后援会'];
var FAN_MOODS = ['开心','激动','平静','期待','感动'];

function ppGetOrCreateFanProfile(fanName) {
    var d = store.paopao;
    if (!d.fanProfiles) d.fanProfiles = {};
    if (!fanName) return null;
    
    var key = fanName.trim();
    if (d.fanProfiles[key]) {
        // 更新活跃时间
        d.fanProfiles[key].lastActive = Date.now();
        d.fanProfiles[key].stats.messages = (d.fanProfiles[key].stats.messages || 0) + 1;
        return d.fanProfiles[key];
    }
    
    // 创建新粉丝档案
    var profile = {
        id: 'fan_' + Date.now() + '_' + Math.random().toString(36).substr(2,4),
        name: key,
        joinTime: Date.now() - Math.floor(Math.random() * 86400000 * 30), // 随机入坑时间（最近30天内）
        level: Math.floor(Math.random() * 3) + 1, // 1-3级
        type: FAN_TYPES[Math.floor(Math.random() * FAN_TYPES.length)],
        loyalty: Math.floor(Math.random() * 30) + 60, // 60-90
        color: FAN_COLORS[Math.floor(Math.random() * FAN_COLORS.length)],
        stats: {
            messages: 1,
            dataWork: Math.floor(Math.random() * 20),
            antiBlack: Math.floor(Math.random() * 10),
            checkin: Math.floor(Math.random() * 15),
            likes: Math.floor(Math.random() * 50),
            reposts: Math.floor(Math.random() * 30)
        },
        mood: FAN_MOODS[Math.floor(Math.random() * FAN_MOODS.length)],
        lastActive: Date.now(),
        isBlackFan: false
    };
    d.fanProfiles[key] = profile;
    return profile;
}

function ppShowFanProfile(fanName) {
    if (!fanName) return;
    var profile = ppGetOrCreateFanProfile(fanName);
    if (!profile) return;
    
    var d = store.paopao;
    var titleWord = ppGetTitle();
    var fanAge = Math.floor((Date.now() - profile.joinTime) / 86400000);
    var levelStars = '';
    for (var i = 0; i < Math.min(profile.level, 10); i++) levelStars += '⭐';
    
    var moodEmoji = {'开心':'😊','激动':'🤩','平静':'😌','期待':'🥰','感动':'🥺'}[profile.mood] || '😊';
    
    var overlay = document.createElement('div');
    overlay.className = 'pp-fan-profile-overlay';
    // [FIX-粉丝弹窗透明] 先设置为不可见，等DOM插入后再添加show类触发过渡动画
    overlay.style.opacity = '0';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    
    overlay.innerHTML = '<div class="pp-fan-profile-card">' +
        '<div class="pp-fan-profile-header" style="background:' + profile.color + ';">' +
            '<div class="pp-fan-profile-avatar" style="background:' + profile.color + ';">' + (profile.name || '?').charAt(0) + '</div>' +
            '<div class="pp-fan-profile-name">' + escapeHtml(profile.name) + '</div>' +
            '<div class="pp-fan-profile-badge">' + escapeHtml(profile.type) + '</div>' +
        '</div>' +
        '<div class="pp-fan-profile-body">' +
            '<div class="pp-fan-profile-row"><span>粉籍等级</span><span>' + levelStars + ' Lv.' + profile.level + '</span></div>' +
            '<div class="pp-fan-profile-row"><span>粉龄</span><span>' + fanAge + '天</span></div>' +
            '<div class="pp-fan-profile-row"><span>当前心情</span><span>' + moodEmoji + ' ' + profile.mood + '</span></div>' +
            '<div class="pp-fan-profile-row"><span>忠诚度</span><span>' + profile.loyalty + '%</span></div>' +
            '<div class="pp-fan-profile-section-title">📊 数据贡献</div>' +
            '<div class="pp-fan-profile-stats">' +
                '<div class="pp-fan-stat"><div class="pp-fan-stat-num">' + (profile.stats.messages||0) + '</div><div class="pp-fan-stat-label">发言</div></div>' +
                '<div class="pp-fan-stat"><div class="pp-fan-stat-num">' + (profile.stats.likes||0) + '</div><div class="pp-fan-stat-label">点赞</div></div>' +
                '<div class="pp-fan-stat"><div class="pp-fan-stat-num">' + (profile.stats.reposts||0) + '</div><div class="pp-fan-stat-label">转发</div></div>' +
                '<div class="pp-fan-stat"><div class="pp-fan-stat-num">' + (profile.stats.checkin||0) + '</div><div class="pp-fan-stat-label">签到</div></div>' +
            '</div>' +
            '<div class="pp-fan-profile-section-title">🛡️ 反黑记录</div>' +
            '<div class="pp-fan-profile-stats">' +
                '<div class="pp-fan-stat"><div class="pp-fan-stat-num">' + (profile.stats.antiBlack||0) + '</div><div class="pp-fan-stat-label">反黑</div></div>' +
                '<div class="pp-fan-stat"><div class="pp-fan-stat-num">' + (profile.stats.dataWork||0) + '</div><div class="pp-fan-stat-label">做数据</div></div>' +
            '</div>' +
        '</div>' +
        '<div class="pp-fan-profile-actions">' +
            '<button class="pp-fan-action-btn" onclick="ppFanAction(\'thank\',\'' + escapeHtml(profile.name) + '\')"><i class="fas fa-heart"></i> 感谢</button>' +
            '<button class="pp-fan-action-btn" onclick="ppFanAction(\'gift\',\'' + escapeHtml(profile.name) + '\')"><i class="fas fa-gift"></i> 送礼</button>' +
            (profile.isBlackFan ? '<button class="pp-fan-action-btn pp-fan-action-danger" onclick="ppFanAction(\'unblock\',\'' + escapeHtml(profile.name) + '\')"><i class="fas fa-undo"></i> 解封</button>' :
            '<button class="pp-fan-action-btn pp-fan-action-danger" onclick="ppFanAction(\'block\',\'' + escapeHtml(profile.name) + '\')"><i class="fas fa-ban"></i> 拉黑</button>') +
        '</div>' +
        '<button class="pp-fan-profile-close" onclick="this.closest(\'.pp-fan-profile-overlay\').remove()">关闭</button>' +
    '</div>';
    
    document.body.appendChild(overlay);
    // [FIX-粉丝弹窗透明] 使用双重rAF确保浏览器完成布局后再触发过渡
    // 单次rAF在某些设备上时序不够，导致opacity过渡直接跳到终态(透明)
    overlay.offsetHeight; // 强制同步布局
    requestAnimationFrame(function() {
        requestAnimationFrame(function() {
            overlay.classList.add('show');
            overlay.style.opacity = ''; // 移除内联opacity，让CSS .show规则接管
        });
    });
}
window.ppShowFanProfile = ppShowFanProfile;

window.ppFanAction = function(action, fanName) {
    var d = store.paopao;
    var profile = d.fanProfiles ? d.fanProfiles[fanName] : null;
    if (!profile) return;
    
    if (action === 'thank') {
        profile.loyalty = Math.min(100, (profile.loyalty||0) + 5);
        profile.mood = '感动';
        showPpResult('💕 已感谢', '你感谢了' + escapeHtml(fanName) + '，TA的忠诚度提升了！', true);
    } else if (action === 'gift') {
        d.money = Math.max(0, (d.money||0) - 100);
        profile.loyalty = Math.min(100, (profile.loyalty||0) + 10);
        profile.level = Math.min(10, (profile.level||1) + 1);
        profile.mood = '激动';
        showPpResult('🎁 已送礼', '你送了' + escapeHtml(fanName) + '一份小礼物，TA升级了！', true);
    } else if (action === 'block') {
        profile.isBlackFan = true;
        profile.loyalty = 0;
        showPpResult('🚫 已拉黑', escapeHtml(fanName) + '已被标记为黑粉', false);
    } else if (action === 'unblock') {
        profile.isBlackFan = false;
        profile.loyalty = 30;
        showPpResult('✅ 已解封', escapeHtml(fanName) + '已被解除拉黑', true);
    }
    save();
    // 关闭弹窗
    document.querySelectorAll('.pp-fan-profile-overlay').forEach(function(el) { el.remove(); });
};

// ====== 性别感知称呼 ======
function ppGetTitle(){
    var d = store.paopao;
    return d.gender === 'male' ? '哥哥' : '姐姐';
}

// ====== 性别感知角色名 ======
function ppGetGenderedRole(role){
    var d = store.paopao;
    var isMale = d.gender === 'male';
    // 根据性别替换角色称呼
    if(role === '女主角' || role === '男主角') return isMale ? '男主角' : '女主角';
    if(role === '第二女主' || role === '第二男主') return isMale ? '第二男主' : '第二女主';
    return role;
}

// ====== 随机属性生成 ======
var PP_ATTR_NAMES = {
    acting: '演技', looks: '颜值', wisdom: '智慧',
    rhythm: '乐感', charm: '魅力', talent: '才华', social: '人缘'
};
var PP_ATTR_ICONS = {
    acting: '🎭', looks: '✨', wisdom: '🧠',
    rhythm: '🎵', charm: '💫', talent: '🎨', social: '🤝'
};

function ppRandomAttrs(){
    var attrs = {};
    var keys = ['acting','looks','wisdom','rhythm','charm','talent','social'];
    // 总点数池：350-550之间（平均每项50-78）
    var totalPool = 350 + Math.floor(Math.random() * 200);
    var remaining = totalPool;
    for(var i = 0; i < keys.length; i++){
        if(i === keys.length - 1){
            attrs[keys[i]] = Math.max(10, Math.min(100, remaining));
        } else {
            var avg = remaining / (keys.length - i);
            var val = Math.floor(avg + (Math.random() - 0.5) * 40);
            val = Math.max(10, Math.min(100, val));
            attrs[keys[i]] = val;
            remaining -= val;
        }
    }
    return attrs;
}

// ====== 随机人生经历生成 ======
var PP_BACKSTORIES_FEMALE = [
    '从小在艺术世家长大，5岁学舞蹈，12岁登上央视舞台，是全校公认的文艺骨干。高考时以艺术特长生身份考入顶级表演学院，大学期间就被星探发掘。',
    '普通工薪家庭出身，长相甜美被同学称为"校花"。大学时期参加选秀节目意外走红，从此踏入演艺圈，虽然起步晚但天赋异禀。',
    '童星出道，3岁拍广告，6岁出演第一部电视剧。虽然童年缺少玩耍时间，但积累了丰富的表演经验，转型成人演员后演技获得业内认可。',
    '海归学霸，在国外名校攻读传媒专业。回国后机缘巧合进入娱乐圈，凭借独特的气质和扎实的专业功底迅速崭露头角。',
    '网红转型，最初在短视频平台分享日常获得百万粉丝。后被经纪公司看中签约培养，经过专业训练后正式出道。',
    '舞蹈生出身，从小练习芭蕾和现代舞，身姿优雅。在一次舞蹈大赛中被导演看中，邀请出演舞蹈题材电影，一炮而红。',
    '音乐世家的千金，从小学习钢琴和声乐。参加音乐选秀获得冠军后跨界发展，演戏唱歌两不误，被称为"全能艺人"。',
    '从小就是班上最受欢迎的女孩，性格开朗爱表演。大学时被星探在街头发掘，试镜后直接获得女主角色，一部戏就打开了知名度。',
    '家境优渥的乖乖女，父母本希望她学医。却偷偷报名了表演培训班，最终说服家人支持自己的演艺梦想，凭实力出道。',
    '运动员转型，曾是省队体操运动员。因伤退役后转向演艺事业，运动员的自律和拼搏精神让她在圈内脱颖而出。'
];

var PP_BACKSTORIES_MALE = [
    '从小在艺术世家长大，5岁学乐器，12岁组建乐队，是全校公认的才艺之星。高考时以艺术特长生身份考入顶级表演学院，大学期间就被星探发掘。',
    '普通工薪家庭出身，阳光帅气被同学称为"校草"。大学时期参加选秀节目意外走红，从此踏入演艺圈，虽然起步晚但天赋异禀。',
    '童星出道，3岁拍广告，6岁出演第一部电视剧。虽然童年缺少玩耍时间，但积累了丰富的表演经验，转型成人演员后演技获得业内认可。',
    '海归学霸，在国外名校攻读传媒专业。回国后机缘巧合进入娱乐圈，凭借独特的气质和扎实的专业功底迅速崭露头角。',
    '网红转型，最初在短视频平台分享日常获得百万粉丝。后被经纪公司看中签约培养，经过专业训练后正式出道。',
    '体育生出身，从小练习武术和体能，身材健硕。在一次武术表演中被导演看中，邀请出演动作题材电影，一炮而红。',
    '音乐世家出身，从小学习吉他和声乐。参加音乐选秀获得冠军后跨界发展，演戏唱歌两不误，被称为"全能艺人"。',
    '从小就是班上最受欢迎的男孩，性格阳光爱表演。大学时被星探在街头发掘，试镜后直接获得男主角色，一部戏就打开了知名度。',
    '家境优渥的好学生，父母本希望他学金融。却偷偷报名了表演培训班，最终说服家人支持自己的演艺梦想，凭实力出道。',
    '运动员转型，曾是省队游泳运动员。因伤退役后转向演艺事业，运动员的自律和拼搏精神让他在圈内脱颖而出。'
];

function ppRandomBackstory(gender){
    var pool = gender === 'male' ? PP_BACKSTORIES_MALE : PP_BACKSTORIES_FEMALE;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ====== 初始设置弹窗 ======
function ppShowSetupModal(){
    var d = store.paopao;
    // 生成初始随机属性和经历
    window._ppSetupAttrs = ppRandomAttrs();
    window._ppSetupGender = d.gender || 'female';
    window._ppSetupBackstory = ppRandomBackstory(window._ppSetupGender);
    window._ppSetupAvatar = d.avatar || '';
    window._ppSetupName = d.stageName || '';

    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay pp-setup-overlay';
    overlay.id = 'pp-setup-overlay';
    overlay.style.cssText = 'z-index:9999;';
    
    overlay.innerHTML = ppBuildSetupHTML();
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
    
    setTimeout(function(){
        var nameInput = document.getElementById('pp-setup-name');
        if(nameInput) nameInput.focus();
    }, 200);
}

function ppBuildSetupHTML(){
    var attrs = window._ppSetupAttrs;
    var gender = window._ppSetupGender;
    var backstory = window._ppSetupBackstory;
    var avatar = window._ppSetupAvatar;
    var name = window._ppSetupName;
    
    var avatarHtml = avatar ?
        '<img src="' + avatar + '" class="pp-setup-avatar-img" onclick="ppSetupUploadAvatar()">' :
        '<div class="pp-setup-avatar-placeholder" onclick="ppSetupUploadAvatar()"><i class="fas fa-camera"></i><span>上传头像</span></div>';
    
    var attrKeys = ['acting','looks','wisdom','rhythm','charm','talent','social'];
    var attrsHtml = attrKeys.map(function(k){
        var val = attrs[k];
        var colorClass = val >= 80 ? 'pp-attr-excellent' : (val >= 60 ? 'pp-attr-good' : (val >= 40 ? 'pp-attr-normal' : 'pp-attr-low'));
        return '<div class="pp-setup-attr-item">' +
            '<div class="pp-setup-attr-label">' + PP_ATTR_ICONS[k] + ' ' + PP_ATTR_NAMES[k] + '</div>' +
            '<div class="pp-setup-attr-bar-wrap">' +
                '<div class="pp-setup-attr-bar ' + colorClass + '" style="width:' + val + '%"></div>' +
            '</div>' +
            '<div class="pp-setup-attr-val">' + val + '</div>' +
        '</div>';
    }).join('');
    
    // 计算总评
    var total = 0;
    attrKeys.forEach(function(k){ total += attrs[k]; });
    var avgScore = Math.round(total / attrKeys.length);
    var ratingText = avgScore >= 80 ? '天选之子 ⭐' : (avgScore >= 65 ? '天赋出众 🌟' : (avgScore >= 50 ? '潜力不错 💪' : '大器晚成 🌱'));
    
    return '<div class="pp-setup-modal">' +
        '<div class="pp-setup-close-btn" onclick="ppCloseSetupModal()" style="position:absolute;top:12px;right:14px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,0.06);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;font-size:16px;color:#999;"><i class="fas fa-times"></i></div>' +
        '<div class="pp-setup-title">✨ 创建你的明星角色 ✨</div>' +
        '<div class="pp-setup-subtitle">填写基本信息，开启你的演艺之路</div>' +
        
        // 头像区域
        '<div class="pp-setup-avatar-area">' + avatarHtml + '</div>' +
        
        // 名字
        '<div class="pp-setup-field">' +
            '<label class="pp-setup-label">艺名</label>' +
            '<input type="text" class="pp-setup-input" id="pp-setup-name" placeholder="给自己取个响亮的艺名吧~" value="' + escapeHtml(name) + '">' +
        '</div>' +
        
        // 性别选择
        '<div class="pp-setup-field">' +
            '<label class="pp-setup-label">性别</label>' +
            '<div class="pp-setup-gender-row">' +
                '<div class="pp-setup-gender-btn' + (gender === 'female' ? ' active' : '') + '" id="pp-setup-gender-female" onclick="ppSetupSelectGender(\'female\')">' +
                    '👩 女生' +
                '</div>' +
                '<div class="pp-setup-gender-btn' + (gender === 'male' ? ' active' : '') + '" id="pp-setup-gender-male" onclick="ppSetupSelectGender(\'male\')">' +
                    '👨 男生' +
                '</div>' +
            '</div>' +
        '</div>' +
        
        // 分隔线
        '<div class="pp-setup-divider"></div>' +
        
        // 随机属性
        '<div class="pp-setup-section">' +
            '<div class="pp-setup-section-header">' +
                '<span>🎲 随机属性</span>' +
                '<div class="pp-setup-reroll-btn" onclick="ppSetupRerollAttrs()"><i class="fas fa-dice"></i> 重新随机</div>' +
            '</div>' +
            '<div class="pp-setup-rating">综合评价：' + ratingText + ' (均分' + avgScore + ')</div>' +
            '<div class="pp-setup-attrs" id="pp-setup-attrs">' + attrsHtml + '</div>' +
        '</div>' +
        
        // 人生经历
        '<div class="pp-setup-section">' +
            '<div class="pp-setup-section-header">' +
                '<span>📖 人生经历</span>' +
                '<div class="pp-setup-reroll-btn" onclick="ppSetupRerollBackstory()"><i class="fas fa-dice"></i> 换一个</div>' +
            '</div>' +
            '<div class="pp-setup-backstory" id="pp-setup-backstory">' + escapeHtml(backstory) + '</div>' +
        '</div>' +
        
        // 一键全部重刷
        '<div class="pp-setup-reroll-all" onclick="ppSetupRerollAll()">' +
            '<i class="fas fa-sync-alt"></i> 全部重新随机' +
        '</div>' +
        
        // 确认按钮
        '<div class="pp-setup-confirm-btn" onclick="ppConfirmSetup()">确认出道 🌟</div>' +
    '</div>';
}

// 设置弹窗：上传头像
window.ppSetupUploadAvatar = function(){
    var fi = document.createElement('input');
    fi.type = 'file';
    fi.accept = 'image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico';
    fi.onchange = function(){
        if(!fi.files || !fi.files[0]) return;
        var reader = new FileReader();
        reader.onload = function(e){
            window._ppSetupAvatar = e.target.result;
            // 更新头像显示
            var avatarArea = document.querySelector('.pp-setup-avatar-area');
            if(avatarArea){
                avatarArea.innerHTML = '<img src="' + e.target.result + '" class="pp-setup-avatar-img" onclick="ppSetupUploadAvatar()">';
            }
        };
        reader.readAsDataURL(fi.files[0]);
    };
    fi.click();
};

// 设置弹窗：选择性别
window.ppSetupSelectGender = function(gender){
    window._ppSetupGender = gender;
    var femaleBtn = document.getElementById('pp-setup-gender-female');
    var maleBtn = document.getElementById('pp-setup-gender-male');
    if(femaleBtn){
        femaleBtn.className = 'pp-setup-gender-btn' + (gender === 'female' ? ' active' : '');
    }
    if(maleBtn){
        maleBtn.className = 'pp-setup-gender-btn' + (gender === 'male' ? ' active' : '');
    }
    // 性别变了，重新生成人生经历
    window._ppSetupBackstory = ppRandomBackstory(gender);
    var bsEl = document.getElementById('pp-setup-backstory');
    if(bsEl) bsEl.textContent = window._ppSetupBackstory;
};

// 设置弹窗：重刷属性
window.ppSetupRerollAttrs = function(){
    // 先保存当前名字
    var curNameInput = document.getElementById('pp-setup-name');
    if(curNameInput) window._ppSetupName = curNameInput.value;
    window._ppSetupAttrs = ppRandomAttrs();
    // 重新渲染
    var overlay = document.getElementById('pp-setup-overlay');
    if(overlay) overlay.innerHTML = ppBuildSetupHTML();
};

// 设置弹窗：重刷经历
window.ppSetupRerollBackstory = function(){
    window._ppSetupBackstory = ppRandomBackstory(window._ppSetupGender);
    var bsEl = document.getElementById('pp-setup-backstory');
    if(bsEl) bsEl.textContent = window._ppSetupBackstory;
};

// 设置弹窗：全部重刷
window.ppSetupRerollAll = function(){
    // 先保存当前名字
    var curNameInput = document.getElementById('pp-setup-name');
    if(curNameInput) window._ppSetupName = curNameInput.value;
    window._ppSetupAttrs = ppRandomAttrs();
    window._ppSetupBackstory = ppRandomBackstory(window._ppSetupGender);
    var overlay = document.getElementById('pp-setup-overlay');
    if(overlay) overlay.innerHTML = ppBuildSetupHTML();
};

// 关闭设置弹窗（退出）
window.ppCloseSetupModal = function(){
    var overlay = document.getElementById('pp-setup-overlay');
    if(overlay) overlay.remove();
    // 退出泡泡app
    if(typeof exitApp === 'function') exitApp();
};

// 确认设置
window.ppConfirmSetup = function(){
    var nameInput = document.getElementById('pp-setup-name');
    var name = nameInput ? nameInput.value.trim() : '';
    if(!name){
        showPpResult('⚠️ 请填写艺名', '给自己取个响亮的艺名吧~', false);
        return;
    }
    if(!window._ppSetupGender){
        showPpResult('⚠️ 请选择性别', '请选择你的性别~', false);
        return;
    }
    
    var d = store.paopao;
    d.stageName = name;
    d.gender = window._ppSetupGender;
    d.avatar = window._ppSetupAvatar || '';
    d.attrs = window._ppSetupAttrs;
    d.backstory = window._ppSetupBackstory;
    d.setupComplete = true;
    save();
    
    // 移除弹窗
    var overlay = document.getElementById('pp-setup-overlay');
    if(overlay) overlay.remove();
    
    // 重新渲染
    ppRenderTab();
    showPpResult('🎉 出道成功！', '欢迎来到演艺圈，' + escapeHtml(name) + '！\n你的明星之路正式开始了~', true);
};


// ====== 自定义确认弹窗（替代confirm） ======
function ppConfirmDialog(title, message, onConfirm){
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.innerHTML = '<div class="pp-settings-modal" style="text-align:center;">' +
        '<div class="pp-modal-title">' + title + '</div>' +
        '<div class="pp-modal-subtitle" style="margin-bottom:20px;">' + message + '</div>' +
        '<div class="pp-modal-actions">' +
            '<button class="pp-modal-btn pp-modal-btn-cancel" id="pp-confirm-cancel">取消</button>' +
            '<button class="pp-modal-btn pp-modal-btn-confirm" id="pp-confirm-ok" style="background:#c75050;">确认</button>' +
        '</div>' +
    '</div>';
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
    
    // [FIX] 点击遮罩关闭
    overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
    // [FIX] ESC键关闭
    var escHandler = function(e){ if(e.key === 'Escape'){ overlay.remove(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
    document.getElementById('pp-confirm-cancel').onclick = function(){ overlay.remove(); document.removeEventListener('keydown', escHandler); };
    document.getElementById('pp-confirm-ok').onclick = function(){ overlay.remove(); document.removeEventListener('keydown', escHandler); onConfirm(); };
}

// ====== 自定义输入弹窗（替代prompt） ======
function ppPromptDialog(title, placeholder, defaultVal, onConfirm){
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.innerHTML = '<div class="pp-settings-modal">' +
        '<div class="pp-modal-title">' + title + '</div>' +
        '<div class="pp-modal-field">' +
            '<input type="text" class="pp-modal-input" id="pp-prompt-input" placeholder="' + escapeHtml(placeholder) + '" value="' + escapeHtml(defaultVal || '') + '" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:15px;outline:none;box-sizing:border-box;">' +
        '</div>' +
        '<div class="pp-modal-actions">' +
            '<button class="pp-modal-btn pp-modal-btn-cancel" id="pp-prompt-cancel">取消</button>' +
            '<button class="pp-modal-btn pp-modal-btn-confirm" id="pp-prompt-ok">确认</button>' +
        '</div>' +
    '</div>';
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
    
    var input = document.getElementById('pp-prompt-input');
    setTimeout(function(){ if(input) input.focus(); }, 100);
    // [FIX] 点击遮罩关闭
    overlay.addEventListener('click', function(e){ if(e.target === overlay) overlay.remove(); });
    // [FIX] ESC键关闭
    var escHandler = function(e){ if(e.key === 'Escape'){ overlay.remove(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
    document.getElementById('pp-prompt-cancel').onclick = function(){ overlay.remove(); document.removeEventListener('keydown', escHandler); };
    document.getElementById('pp-prompt-ok').onclick = function(){
        var val = input ? input.value : '';
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
        if(val && val.trim()) onConfirm(val.trim());
    };
    if(input) input.onkeydown = function(e){
        if(e.key === 'Enter'){
            var val = input.value;
            overlay.remove();
            document.removeEventListener('keydown', escHandler);
            if(val && val.trim()) onConfirm(val.trim());
        }
    };
}

// ====== 粉丝名字池（大幅扩充） ======
var FAN_NAMES = [
    '小甜饼🍪','追星少女✨','月亮姐姐🌙','彩虹糖🌈','奶茶控🧋',
    '向日葵🌻','棉花糖☁️','小确幸💕','星星眼⭐','樱花妹🌸',
    '暴风哭泣😭','冲鸭🦆','泡泡糖🫧','小太阳☀️','蜜桃味🍑',
    '草莓熊🍓','柠檬精🍋','奶黄包🥟','布丁酱🍮','芒果干🥭',
    '小饼干🍪','珍珠奶茶🧋','巧克力🍫','棒棒糖🍭','冰淇淋🍦',
    '甜甜圈🍩','马卡龙💗','提拉米苏🎂','抹茶味🍵','焦糖味🍬',
    '仙女棒✨','魔法少女🪄','水晶球🔮','彩云追月🌤️','流星雨🌠',
    '银河系🌌','北极星⭐','萤火虫🪲','蒲公英🌾','四叶草🍀',
    '薄荷糖🍬','椰子水🥥','蓝莓酱🫐','荔枝冰🧊','桂花糕🌼',
    '玫瑰露🌹','茉莉花🌿','薰衣草💜','风信子💙','小奶猫🐱',
    '爱做梦💭','甜蜜蜜🍯','暖宝宝🧸','软糯糯🍡','奶酪包🧀',
    '蛋黄酥🥮','杨枝甘露🥤','芝士蛋糕🎂','糯米团子🍙','红豆沙🫘',
    '西瓜味🍉','葡萄紫🍇','小鹿斑比🦌','蝴蝶结🎀','彩虹桥🌈',
    '星河漫步🌌','花仙子🧚','精灵梦💫','佛系少女🧘','追剧狂人📺',
    '吃货本尊🍔','旅行青蛙🐸','猫奴本奴🐈','手帐控📓','音乐发烧友🎵',
    '电影迷🎬','养花达人🌺','拼图爱好者🧩','摸鱼高手🐟','干饭人🍚'
];

// ====== 动态生成粉丝名字（避免重复，策略更多样） ======
function ppGetFanName() {
    var r = Math.random();
    if (r < 0.2) {
        // 20%：形容词+名词+emoji
        var prefixes = ['追星的','爱笑的','温柔的','可爱的','甜甜的','软萌的','元气','开心的','幸福的','安静的','文艺的','认真的','勤劳的','浪漫的','洒脱的','迷人的','率真的','热情的','善良的','活泼的','俏皮的','爽朗的','淡定的','乖巧的','认怂的','佛系','慵懒的','呆萌的','高冷的','优雅的'];
        var suffixes = ['小可爱','宝宝','少女','女孩','妹妹','同学','小朋友','仙女','天使','精灵','甜心','公主','闺蜜','学姐','达人','少年','萌新','老粉','铁粉','小透明','路人甲','吃瓜群众'];
        var emojis = ['💕','✨','🌸','🌙','⭐','🎀','💫','🌻','🍀','🌈','💗','🧸','🎵','🌺','💎','🦋','🌷','🍒','🎶','🐾','🌟','🎪','🏵️','🪷'];
        return prefixes[Math.floor(Math.random()*prefixes.length)] + suffixes[Math.floor(Math.random()*suffixes.length)] + emojis[Math.floor(Math.random()*emojis.length)];
    } else if (r < 0.35) {
        // 15%：网名风格
        var netNames = [
            '今天也要加油鸭','干饭不积极思想有问题','一只小透明','追星废物本废',
            '永远十八岁','人间烟火气','不想上班星人','快乐就好啦','早睡早起做不到',
            '奶茶续命中','社恐在线挣扎','摸鱼一级选手','考试别来找我','又馋又懒',
            '假装很酷','嘴硬心软的猫','退堂鼓表演艺术家','人间清醒','不太灵光的灯泡',
            '被窝封印术师','碳水爱好者','咸鱼本鱼','躺平第一名','外向型社恐',
            '熬夜冠军争夺者','减肥未遂的吃货','学术废柴','打工人打工魂','理想与现实的差距',
            '人间不值得但甜点值得','半夜emo的小孩','快乐的咸鱼','有梦想的蜗牛','努力的小笨蛋',
            '天选做梦家','无情的追剧机器','甲方克星','月光族代言人','计划表的叛徒'
        ];
        return netNames[Math.floor(Math.random()*netNames.length)];
    } else if (r < 0.5) {
        // 15%：姓名式昵称
        var surname = PP_SURNAMES[Math.floor(Math.random()*PP_SURNAMES.length)];
        var nameEnds = ['同学','小姐','先生','宝','子','er','的fan','的小迷弟','的小迷妹','家的','大大'];
        return surname + nameEnds[Math.floor(Math.random()*nameEnds.length)];
    }
    // 50%：使用预设池
    return FAN_NAMES[Math.floor(Math.random()*FAN_NAMES.length)];
}

// ====== 大幅扩充的粉丝消息预设 ======
// 分类：夸夸、分享生活、日常闲聊、追星互动、表情包/语气词
var FAN_MSG_PRAISE = [
    '姐姐好美啊啊啊！','今天也是爱姐姐的一天💕','姐姐太好看了叭',
    '我宣布姐姐是世界上最美的人','天哪姐姐太绝了','姐姐的穿搭好好看！',
    '姐姐笑起来好治愈','全世界最好的姐姐！','姐姐今天也辛苦了',
    '姐姐的眼睛会发光✨','实名制表白姐姐！','今天又被姐姐的美貌暴击了',
    '姐姐的声音也太苏了吧','看到姐姐就开心！','姐姐是我的精神支柱',
    '啊啊啊啊姐姐太可了','姐姐唱歌好好听','追星追到姐姐真的太幸运了',
    '第一次追星就追到了最好的人','从路人到粉丝只用了一秒钟',
    '刚看了姐姐的自拍，心动了！','姐姐的每一面都好喜欢',
    '被姐姐的气质折服了','姐姐就是行走的画报！','姐姐的颜值是天花板级别',
    '你是我见过最好看的明星，没有之一','姐姐的侧脸绝了！',
    '今天的姐姐也闪闪发光✨','姐姐真的越来越好看了',
    '每次看到姐姐都有心动的感觉','姐姐的美貌我要安利全世界',
    '姐姐是人间芭比本人吧','仙女下凡也不过如此','姐姐简直是神颜',
    '我愿称之为绝世容颜','姐姐真的好有魅力啊','太好看了吧我要哭了',
    '姐姐美到我截了一百张图','这张图我能看一万遍','姐姐怎么可以这么完美',
];

var FAN_MSG_LIFE_SHARE = [
    '姐妹们！我今天被老板骂了😭有没有人安慰我','刚吃了一顿火锅，太爽了🔥',
    '今天下雨忘带伞了，整个人都湿透了😩','有人一起拼奶茶吗🧋',
    '我的猫今天又把杯子打碎了...','分享一下今天的午餐🍱看起来还不错吧',
    '减肥第三天...好想吃炸鸡😢','今天终于把作业写完了！','周末有人出来玩吗',
    '刚追完一部剧好好看啊，推荐给大家','我今天在路上看到一只好可爱的柯基！',
    '考试考砸了😭求安慰','今天买了新衣服！好开心~','工作好累啊想躺平',
    '有没有人推荐好吃的外卖','刚去看了电影，结尾哭得稀里哗啦',
    '今天去图书馆自习了一天！很充实','室友打呼噜，我今晚怕是睡不着了',
    '好想出去旅游啊，有推荐的地方吗','今天做了一道新菜，成功了！🎉',
    '最近开始学吉他了，手指好疼','闺蜜给我寄了一箱零食！好幸福',
    '今天发工资了！虽然不多但还是开心','健身第一天，浑身酸痛',
    '刚才差点在公交车上睡过站😂','我妈又催我找对象了...大家有同感吗',
    '今天在公园看到好美的日落🌅','好想回家吃妈妈做的菜啊',
    '养了一棵多肉，希望它能活下去🌵','今天在超市遇到打折，囤了好多东西',
    '下班路上听了一首歌好好听，分享给你们','刚理了新发型，你们觉得怎么样',
    '今天去了一家网红店，味道还行吧','好想养只猫，但是房东不让😭',
    '最近沉迷拼图无法自拔','今天DIY做了个手机壳，还挺好看的',
    '有人一起打游戏吗！','天气好热啊，我要变成烤鸡了🔥',
    '今天去了海边，心情超好！🏖️','分享一个我常去的宝藏咖啡店☕',
];

var FAN_MSG_DAILY_CHAT = [
    '姐姐什么时候营业呀','姐姐今天吃了什么呀','好想见到姐姐本人哦',
    '姐姐加油！我们永远支持你','姐姐新剧什么时候播呀','期待姐姐的新作品！',
    '今天天气好好，想姐姐了','姐姐记得吃饭哦🍚','求姐姐翻牌子🙏',
    '姐姐快发自拍呀！','日常打卡，爱姐姐第365天','姐姐什么时候上综艺呀',
    '想看姐姐演古装！','姐姐的新歌循环了一百遍了','冲啊！为姐姐打call📣',
    '好想和姐姐一起吃火锅','追星使我快乐，姐姐使我心动',
    '呜呜姐姐太好了吧','我不允许有人没看过姐姐的剧','追姐姐追到停不下来',
    '姐姐什么时候开演唱会','姐姐生日我要去接机！','在忙什么呢姐姐',
    '我给姐姐画了同人图！','刚入坑，请多指教💕','大家今天都做了什么呀',
    '好久没见姐姐了，好想她','姐姐最近有什么新动态吗','姐姐的行程表谁有啊',
    '我攒钱准备去看姐姐的演唱会！','有没有同城的姐妹一起线下面基呀',
    '大家有没有姐姐的周边推荐','追星路上有你们真好💕','打卡第100天！',
];

var FAN_MSG_INTERACTION = [
    '我给姐姐做了应援手幅！','今天做了姐姐同款妆容','我把姐姐的照片设成壁纸了',
    '刚安利了三个朋友入坑！','帮姐姐做了数据，大家一起冲！','超话签到第88天',
    '新专辑已经循环播放了','帮姐姐打了投票，大家加油！','我写了一篇姐姐的安利文',
    '刚去评论区帮姐姐控评了','我在攒钱买姐姐的代言','今天给姐姐的微博点了999个赞',
    '大家记得去看姐姐的直播啊','我给姐姐剪了一个混剪视频','准备好了应援物，等姐姐的活动',
    '反黑组集合！保护我们的姐姐','姐姐的新歌MV大家看了吗？','一起去给姐姐的专辑刷评分！',
    '我画了一幅姐姐的同人','做了表情包大家拿去用吧','谁有姐姐高清无水印的图',
];

var FAN_MSG_EMOJI_MOOD = [
    '啊啊啊啊啊啊！！！','我可以！！！','绝了绝了绝了','救命','哭了',
    '呜呜呜呜','嘿嘿嘿','冲冲冲！！','yyds!!!','太绝了吧',
    '谁懂啊！','我不行了','好家伙','笑死我了hhhh','蹲一个',
    '真的假的？！','太离谱了','麻了','破防了','泰裤辣',
    '我直接好家伙','6666666','啊这...','可以可以','老天爷',
    '我裂开了','好好好','行行行','离谱到家了','牛的牛的',
    '太上头了','暴风哭泣💦','死了死了','谁家姐姐这么好看啊',
    'respect！','直接磕到了','血赚！','我的妈呀','哈哈哈哈哈哈',
    '这也太好笑了吧','DNA动了','回来了！都回来了！','蚌埠住了',
    '鸡皮疙瘩起来了','家人们谁懂','笑不活了','寄！','嘎嘎嘎',
    '上头了上头了','这波赢麻了','格局打开了','赢！','通通拿下',
    '燃起来了🔥','心态崩了hh','淦！','完美','这就是实力',
    '天花板！','好绝好绝','家人们冲啊','疯狂打call📣','开心开心',
    '今天也是美好的一天','早安！冲！','晚安宝贝们','困了💤',
];

// ====== 问答互动类消息 ======
var FAN_MSG_QUESTIONS = [
    '姐姐最喜欢什么颜色？','有没有什么推荐的书籍呀？','姐姐平时都怎么保养皮肤的？',
    '姐姐下一部作品是什么类型的呀？','你们觉得姐姐更适合古装还是现代装？',
    '大家最喜欢姐姐哪部作品？','姐姐小时候的梦想是什么呀？',
    '有人知道姐姐用什么牌子的口红吗？','姐姐的MBTI是什么呀？',
    '你们追星多久了？','今天是入坑第几天的宝宝？来报个到',
    '姐姐生日你们准备了什么应援呀？','大家都是从哪部作品入坑的？',
    '有人一起去看演唱会吗？组个队','你们都是几零后的粉丝呀？',
    '大家觉得姐姐最帅的瞬间是哪个？','姐姐的偶像是谁呀？好好奇',
    '猜猜姐姐下一条微博会发什么？','大家每天会花多少时间追星？',
    '你们手机壁纸是姐姐的照片吗？','有没有人做过姐姐的粉丝画？',
];

// 合并所有预设
var FAN_MESSAGES_ALL = FAN_MSG_PRAISE.concat(FAN_MSG_LIFE_SHARE, FAN_MSG_DAILY_CHAT, FAN_MSG_INTERACTION, FAN_MSG_EMOJI_MOOD, FAN_MSG_QUESTIONS);

// 替换消息中的"姐姐"为性别感知称呼
function ppReplaceTitle(text){
    var t = ppGetTitle();
    return text.replace(/姐姐/g, t);
}

// ====== 用户发消息后的回应预设（按行为分类） ======
var FAN_REACTIONS_TO_USER = [
    '啊啊啊姐姐回复我了！！！','天哪姐姐看到我了！','呜呜呜好开心',
    '姐姐太宠粉了吧','我死了，姐姐居然回我了','截图截图！！',
    '羡慕被翻牌的姐妹','哭了，姐姐真好','今天运气也太好了吧',
    '啊啊啊啊啊啊！！！','我可以！！！','好幸福，姐姐最好了',
    '天哪天哪天哪！','录屏了录屏了！','我要把这条消息裱起来',
    '呜呜呜终于被翻牌了','这就是追星的意义啊','我哭了我真的哭了',
    '姐姐也太暖了吧','好想给姐姐一个拥抱','感动到语无伦次',
    '幸福来得太突然了','我要发朋友圈嘚瑟一下','今天是被翻牌的幸运儿',
];

// 用户发伪装图片后的预设
var FAN_REACTIONS_TO_FAKE_IMG = [
    '姐姐发图啦！！！','好好看啊啊啊','截图截图！我要保存',
    '天哪也太美了','这是什么绝世美颜','救命好好看',
    '姐姐这张图也太绝了','哇！又有素材了','请问姐姐是天使吗',
    '这张图可以当壁纸了','绝了绝了！','好美好美好美',
    '我愿称之为最佳图片','新壁纸get！','啊啊啊我的心脏',
];

// 用户发真实图片后的预设
var FAN_REACTIONS_TO_REAL_IMG = [
    '姐姐晒图了！','好真实的感觉，喜欢','这也太好看了吧',
    '生图也这么能打','果然本人更好看','请问是仙女吗？',
    '看到姐姐的照片就好开心','截了截了！','太爱这张了',
];

// 用户发语音后的预设
var FAN_REACTIONS_TO_VOICE = [
    '姐姐发语音了！！','啊啊啊姐姐的声音！','好苏好苏好苏',
    '单循环了！','姐姐声音也太好听了吧','耳朵要怀孕了',
    '呜呜呜想听更多','要录屏保存！','好治愈的声音啊',
    '百听不厌','姐姐可以做ASMR了','这声音谁顶得住啊',
];

// 用户发表情包后的预设
var FAN_REACTIONS_TO_STICKER = [
    '哈哈哈姐姐好可爱','这个表情包太搞了','姐姐也玩表情包吗哈哈',
    '笑死我了😂','姐姐太接地气了','哈哈哈哈哈救命',
    '这个表情包我要了','谁还说姐姐高冷来着','可爱到犯规了',
    '姐姐太有梗了','这个我截图了hhhh','反差萌！',
];

// 用户引用回复后的预设
var FAN_REACTIONS_TO_QUOTE = [
    '姐姐在cue我们！','被回复的姐妹好幸福','哇姐姐好认真地回复',
    '太暖了吧','这互动也太甜了','姐姐这么仔细看我们的消息吗',
    '姐姐太用心了','被引用的那位姐妹要起飞了吧','好贴心',
    '这就是为什么我追的姐姐是最好的','太真实的互动了','暖哭了',
];

// ====== 伪装图片URL列表（占位图） ======
var FAKE_IMAGE_URLS = [
    '📷 [自拍.jpg]','📸 [今日OOTD.jpg]','🌸 [风景.jpg]','🎨 [插画.jpg]',
    '☕ [下午茶.jpg]','🎂 [甜品.jpg]','🌆 [城市夜景.jpg]','🐱 [猫咪.jpg]',
    '📱 [截屏分享.jpg]','🎵 [歌单截图.jpg]','🌈 [彩虹.jpg]','🏖️ [海边.jpg]',
];

// ====== 伪装语音预设 ======
var FAKE_VOICE_TEXTS = [
    '🎤 [语音 3″]','🎤 [语音 5″]','🎤 [语音 2″]','🎤 [语音 8″]',
    '🎤 [语音 4″]','🎤 [语音 6″]','🎤 [语音 10″]','🎤 [语音 7″]',
];

// ====== 综艺选项 ======
var VARIETY_SHOWS = [
    {name:'向往的生活', desc:'田园治愈类综艺，展现真实自我', fans:[800,1500], icon:'🏡'},
    {name:'浪姐', desc:'姐姐们的舞台竞演', fans:[1500,3000], icon:'💃'},
    {name:'跑男', desc:'户外竞技真人秀', fans:[1000,2500], icon:'🏃'},
    {name:'王牌对王牌', desc:'游戏互动综艺', fans:[800,2000], icon:'🃏'},
    {name:'心动的信号', desc:'恋爱观察类综艺', fans:[600,1800], icon:'💘'},
    {name:'密室大逃脱', desc:'烧脑推理综艺', fans:[700,1600], icon:'🔑'},
    {name:'你好星期六', desc:'轻松娱乐综艺', fans:[500,1200], icon:'🎪'},
    {name:'披荆斩棘', desc:'热血竞演舞台', fans:[1200,2800], icon:'⚔️'},
];

// ====== 电视剧选项（性别感知） ======
var TV_DRAMAS_FEMALE = [
    {name:'古装仙侠剧', desc:'饰演灵动仙女，仙气飘飘', fans:[2000,5000], icon:'🧚'},
    {name:'都市甜宠剧', desc:'饰演霸道女总裁', fans:[1500,4000], icon:'💼'},
    {name:'悬疑推理剧', desc:'饰演天才女刑警', fans:[1800,4500], icon:'🔍'},
    {name:'年代情感剧', desc:'饰演坚韧女性角色', fans:[1000,3000], icon:'📺'},
    {name:'校园青春剧', desc:'饰演学霸校花', fans:[1200,3500], icon:'🎓'},
    {name:'谍战剧', desc:'饰演地下女特工', fans:[1500,3800], icon:'🕵️'},
    {name:'科幻大片', desc:'饰演未来女战士', fans:[2500,6000], icon:'🚀'},
    {name:'武侠动作剧', desc:'饰演江湖侠女', fans:[1800,4200], icon:'⚔️'},
];
var TV_DRAMAS_MALE = [
    {name:'古装仙侠剧', desc:'饰演仙门天才弟子', fans:[2000,5000], icon:'🧚'},
    {name:'都市商战剧', desc:'饰演霸道总裁', fans:[1500,4000], icon:'💼'},
    {name:'悬疑推理剧', desc:'饰演天才刑警', fans:[1800,4500], icon:'🔍'},
    {name:'年代情感剧', desc:'饰演热血男儿', fans:[1000,3000], icon:'📺'},
    {name:'校园青春剧', desc:'饰演学霸校草', fans:[1200,3500], icon:'🎓'},
    {name:'谍战剧', desc:'饰演地下工作者', fans:[1500,3800], icon:'🕵️'},
    {name:'科幻大片', desc:'饰演未来战士', fans:[2500,6000], icon:'🚀'},
    {name:'武侠动作剧', desc:'饰演江湖大侠', fans:[1800,4200], icon:'⚔️'},
];
function ppGetTVDramas(){
    return store.paopao && store.paopao.gender === 'male' ? TV_DRAMAS_MALE : TV_DRAMAS_FEMALE;
}

// ====== Blog选项 ======
var BLOG_OPTIONS = [
    {
        type:'发自拍',
        choices:[
            {name:'精修美照', desc:'专业摄影师拍摄的精修图', fans:[300,800], icon:'📸'},
            {name:'素颜日常', desc:'自然真实的日常自拍', fans:[200,600], icon:'🤳'},
            {name:'穿搭分享', desc:'今日OOTD展示', fans:[250,700], icon:'👗'},
        ]
    },
    {
        type:'发文案',
        choices:[
            {name:'心灵鸡汤', desc:'分享正能量感悟', fans:[100,400], icon:'💭'},
            {name:'日常碎碎念', desc:'分享生活小确幸', fans:[150,500], icon:'📝'},
            {name:'深夜感悟', desc:'夜深人静时的思考', fans:[200,600], icon:'🌙'},
        ]
    },
    {
        type:'宣传剧组',
        choices:[
            {name:'片场花絮', desc:'分享拍摄幕后故事', fans:[400,1000], icon:'🎬'},
            {name:'角色海报', desc:'发布新角色定妆照', fans:[500,1200], icon:'🖼️'},
            {name:'杀青感言', desc:'分享杀青的喜悦与不舍', fans:[300,900], icon:'🎉'},
        ]
    },
    {
        type:'互动粉丝',
        choices:[
            {name:'粉丝抽奖', desc:'送出签名周边', fans:[600,1500], icon:'🎁'},
            {name:'Q&A问答', desc:'回答粉丝提问', fans:[400,1000], icon:'❓'},
            {name:'直播预告', desc:'预告直播时间', fans:[300,800], icon:'📢'},
        ]
    },
];

// ====== 等级计算 ======
function calcTier(fans){
    if(fans >= 50000000) return '超一线顶流';
    if(fans >= 20000000) return '一线明星';
    if(fans >= 10000000) return '准一线';
    if(fans >= 5000000) return '二线明星';
    if(fans >= 2000000) return '三线明星';
    if(fans >= 1000000) return '四线明星';
    if(fans >= 500000) return '五线明星';
    if(fans >= 100000) return '小有名气';
    if(fans >= 50000) return '崭露头角';
    if(fans >= 10000) return '出道新人';
    return '十八线';
}

function formatFans(n){
    if(n >= 100000000) return (n/100000000).toFixed(1)+'亿';
    if(n >= 10000) return (n/10000).toFixed(1)+'万';
    return n.toString();
}

// ====== 当前Tab和子页面 ======
var activeTab = 'bubble';
var bubbleSubPage = 'list'; // 'list'=消息列表, 'groupChat'=群聊, 'contacts'=联系人列表, 'contactChat'=联系人聊天, 'settings'=设置, 'stickerMount'=表情包挂载
var currentContactId = null; // 当前聊天的联系人ID
var ppQuotedMsg = null; // 当前引用的消息
var ppShowSpecialOnly = false; // 是否只显示特别关心

// ====== 渲染主页 ======
window.renderPaopaoHome = function(){
    init();
    var el = document.getElementById('paopao-content');
    if(!el) return;
    
    var d = store.paopao;
    d.tier = calcTier(d.fans);
    
    // 根据粉丝数计算活跃粉丝数
    d.activeFans = Math.max(5, Math.floor(Math.sqrt(d.fans / 100)));
    if(d.activeFans > 200) d.activeFans = 200;
    
    var tabs = [
        {k:'bubble', i:'fa-comment-dots', l:'消息'},
        {k:'discover', i:'fa-compass', l:'发现'},
        {k:'activity', i:'fa-star', l:'功能'},
        {k:'profile', i:'fa-user', l:'我的'}
    ];
    
    el.innerHTML = '<div class="pp-app">' +
        '<div class="pp-nav-bar">' +
            '<div class="pp-nav-back" onclick="exitApp()"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="pp-nav-title">泡泡</div>' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
                '<div class="pp-nav-fans"><i class="fas fa-heart"></i> ' + formatFans(d.fans) + '</div>' +
                '<div class="pp-nav-archive-btn" onclick="ppOpenArchiveMenu()" style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;opacity:0.8;"><i class="fas fa-save"></i></div>' +
            '</div>' +
        '</div>' +
        '<div class="pp-content" id="pp-tab-content"></div>' +
        '<div class="pp-bottom-nav">' +
            tabs.map(function(t){
                return '<div class="pp-bottom-item' + (activeTab===t.k?' active':'') + '" onclick="ppSwitchTab(\'' + t.k + '\',this)">' +
                    '<i class="fas ' + t.i + '"></i><span>' + t.l + '</span></div>';
            }).join('') +
        '</div>' +
    '</div>';
    
    ppRenderTab();
    
    // 恢复进行中工作的定时器
    ppResumeJobTimers();
    
    // 检查是否需要初始设置
    if(!d.setupComplete){
        setTimeout(function(){ ppShowSetupModal(); }, 300);
        return; // 先完成设置再处理其他
    }
    
    // 检查是否有待处理的事件
    if(d.pendingEvent){
        setTimeout(function(){ ppShowEventPopup(d.pendingEvent); }, 500);
    }
};

// ====== Tab切换 ======
window.ppSwitchTab = function(tab, el){
    activeTab = tab;
    if(tab === 'bubble') bubbleSubPage = 'list';
    if(tab === 'discover') _weiboDiscoverSubPage = 'main';
    var items = document.querySelectorAll('.pp-bottom-item');
    items.forEach(function(it){ it.classList.remove('active'); });
    if(el) el.classList.add('active');
    else {
        // 通过tab标识匹配底部栏项
        var tabOrder = ['bubble','discover','activity','profile'];
        var idx = tabOrder.indexOf(tab);
        if(idx >= 0 && items[idx]) items[idx].classList.add('active');
    }
    ppRenderTab();
};

function ppRenderTab(){
    var area = document.getElementById('pp-tab-content');
    if(!area) return;

    // 群聊/联系人聊天页面时隐藏顶部泡泡导航栏和底部tab栏
    var ppNavBar = document.querySelector('.pp-nav-bar');
    var ppBottomNav = document.querySelector('.pp-bottom-nav');
    var isSubChat = (activeTab === 'bubble' && (bubbleSubPage === 'groupChat' || bubbleSubPage === 'contactChat'));
    if(ppNavBar) ppNavBar.style.display = isSubChat ? 'none' : '';
    if(ppBottomNav) ppBottomNav.style.display = isSubChat ? 'none' : '';

    if(activeTab === 'bubble') ppRenderBubble(area);
    else if(activeTab === 'discover') ppRenderDiscover(area);
    else if(activeTab === 'activity') ppRenderActivity(area);
    else if(activeTab === 'profile') ppRenderProfile(area);
}

// ====== 第一个页面：消息（微信风格消息列表） ======
function ppRenderBubble(area){
    if(bubbleSubPage === 'groupChat') return ppRenderGroupChat(area);
    if(bubbleSubPage === 'contacts') return ppRenderContactsList(area);
    if(bubbleSubPage === 'contactChat') return ppRenderContactChat(area);
    if(bubbleSubPage === 'settings') return ppRenderSettings(area);
    if(bubbleSubPage === 'stickerMount') return ppRenderStickerMount(area);
    // 默认：消息列表
    ppRenderMessageList(area);
}

// ====== 消息列表搜索状态 ======
var ppMsgSearchQuery = '';

// ====== 消息列表（类似微信首页） ======
function ppRenderMessageList(area){
    var d = store.paopao;
    var onlineCount = d.activeFans + Math.floor(Math.random() * 5);
    var pinnedIds = d.pinnedIds || [];
    var searchQ = (ppMsgSearchQuery || '').trim().toLowerCase();
    var hasSearch = !!searchQ;

    // 辅助：判断文本是否匹配搜索
    function matchSearch(name, preview) {
        if (!hasSearch) return true;
        var n = (name || '').toLowerCase();
        var p = (preview || '').toLowerCase();
        return n.indexOf(searchQ) >= 0 || p.indexOf(searchQ) >= 0;
    }

    // 获取群聊最后一条消息
    var lastGroupMsg = d.chatMessages.length > 0 ? d.chatMessages[d.chatMessages.length-1] : null;
    var lastGroupText = lastGroupMsg ? (lastGroupMsg.isMe ? '我: ' : (lastGroupMsg.name ? lastGroupMsg.name.replace(/[^\u4e00-\u9fa5a-zA-Z]/g,'').substring(0,3) + ': ' : '')) + (lastGroupMsg.text || lastGroupMsg.mediaType || '') : '暂无消息';
    if(lastGroupText.length > 24) lastGroupText = lastGroupText.substring(0,24) + '...';

    // 构建一个联系人卡片HTML（通用函数）
    function buildContactItemHtml(c) {
        var chatMsgs = d.contactChats[c.id] || [];
        var lastMsg = chatMsgs.length > 0 ? chatMsgs[chatMsgs.length-1] : null;
        var preview = lastMsg ? (lastMsg.isMe ? '我: ' : '') + (lastMsg.text || lastMsg.mediaType || '') : '还没有消息，去打个招呼吧~';
        if(preview.length > 24) preview = preview.substring(0,24) + '...';
        var unread = c.unread || 0;
        var isSpecialCare = (d.specialCareIds || []).indexOf(c.id) >= 0;
        var isAdmin = (d.adminIds || []).indexOf(c.id) >= 0;
        var isPinned = pinnedIds.indexOf(c.id) >= 0;

        // 搜索过滤
        if (!matchSearch(c.name, preview)) return '';

        var wxContact = (store.contacts || []).find(function(wx){ return wx.id === c.wxContactId; });
        var avatarHtml = wxContact && wxContact.avatar ?
            '<img src="' + escapeHtml(wxContact.avatar) + '" class="pp-msg-avatar pp-msg-avatar-wx">' :
            '<div class="pp-msg-avatar pp-msg-avatar-contact">' + (c.name||'?').charAt(0) + '</div>';

        var badgeHtml = '';
        if(isSpecialCare) badgeHtml += '<span class="pp-msg-special-badge">💖</span>';
        if(isAdmin) badgeHtml += '<span class="pp-msg-admin-badge">🛡️</span>';

        var cls = 'pp-msg-item';
        if (isSpecialCare) cls += ' pp-msg-item-special';
        if (isPinned) cls += ' pinned';

        return '<div class="' + cls + '" data-contact-id="' + c.id + '" ' +
               'onclick="ppOpenContactChat(\'' + c.id + '\')" ' +
               'oncontextmenu="return ppShowMsgItemMenu(event,\'' + c.id + '\')" ' +
               'ontouchstart="ppMsgItemTouchStart(event,\'' + c.id + '\')" ' +
               'ontouchend="ppMsgItemTouchEnd()" ' +
               'ontouchmove="ppMsgItemTouchEnd()">' +
            avatarHtml +
            '<div class="pp-msg-info">' +
                '<div class="pp-msg-name">' + escapeHtml(c.name) + badgeHtml +
                    (c.relation ? ' <span class="pp-msg-relation">' + escapeHtml(c.relation) + '</span>' : '') +
                '</div>' +
                '<div class="pp-msg-preview">' + escapeHtml(preview) + '</div>' +
            '</div>' +
            (unread > 0 ? '<div class="pp-msg-badge">' + unread + '</div>' : '') +
        '</div>';
    }

    // 置顶联系人 + 普通联系人（双排序：先置顶，再特别关心）
    var pinnedItems = '';
    var normalItems = '';
    if(d.contacts && d.contacts.length > 0){
        var sortedContacts = d.contacts.slice().sort(function(a, b){
            var aPinned = pinnedIds.indexOf(a.id) >= 0 ? 1 : 0;
            var bPinned = pinnedIds.indexOf(b.id) >= 0 ? 1 : 0;
            if (aPinned !== bPinned) return bPinned - aPinned;
            var aSpecial = (d.specialCareIds || []).indexOf(a.id) >= 0 ? 1 : 0;
            var bSpecial = (d.specialCareIds || []).indexOf(b.id) >= 0 ? 1 : 0;
            return bSpecial - aSpecial;
        });
        sortedContacts.forEach(function(c){
            var html = buildContactItemHtml(c);
            if (pinnedIds.indexOf(c.id) >= 0) pinnedItems += html;
            else normalItems += html;
        });
    }

    // 经纪人和助理消息（置顶逻辑）
    var staffItems = '';
    if(d.manager){
        var mgrName = d.manager.name;
        var mgrPreview = '有新的工作安排~';
        if (matchSearch(mgrName, mgrPreview)) {
            var isMgrPinned = pinnedIds.indexOf('manager') >= 0;
            var mgrCls = 'pp-msg-item' + (isMgrPinned ? ' pinned' : '');
            var mgrHtml = '<div class="' + mgrCls + '" ' +
                'onclick="ppOpenContactChat(\'manager\')" ' +
                'oncontextmenu="return ppShowMsgItemMenu(event,\'manager\')" ' +
                'ontouchstart="ppMsgItemTouchStart(event,\'manager\')" ' +
                'ontouchend="ppMsgItemTouchEnd()" ' +
                'ontouchmove="ppMsgItemTouchEnd()">' +
                '<div class="pp-msg-avatar pp-msg-avatar-manager">经</div>' +
                '<div class="pp-msg-info">' +
                    '<div class="pp-msg-name">' + escapeHtml(mgrName) + ' <span class="pp-msg-relation">经纪人</span></div>' +
                    '<div class="pp-msg-preview">' + mgrPreview + '</div>' +
                '</div>' +
            '</div>';
            if (isMgrPinned) pinnedItems = mgrHtml + pinnedItems;
            else staffItems += mgrHtml;
        }
    }
    if(d.assistant){
        var asstName = d.assistant.name;
        var asstPreview = '行程已安排好啦！';
        if (matchSearch(asstName, asstPreview)) {
            var isAsstPinned = pinnedIds.indexOf('assistant') >= 0;
            var asstCls = 'pp-msg-item' + (isAsstPinned ? ' pinned' : '');
            var asstHtml = '<div class="' + asstCls + '" ' +
                'onclick="ppOpenContactChat(\'assistant\')" ' +
                'oncontextmenu="return ppShowMsgItemMenu(event,\'assistant\')" ' +
                'ontouchstart="ppMsgItemTouchStart(event,\'assistant\')" ' +
                'ontouchend="ppMsgItemTouchEnd()" ' +
                'ontouchmove="ppMsgItemTouchEnd()">' +
                '<div class="pp-msg-avatar pp-msg-avatar-assistant">助</div>' +
                '<div class="pp-msg-info">' +
                    '<div class="pp-msg-name">' + escapeHtml(asstName) + ' <span class="pp-msg-relation">助理</span></div>' +
                    '<div class="pp-msg-preview">' + asstPreview + '</div>' +
                '</div>' +
            '</div>';
            if (isAsstPinned) pinnedItems = asstHtml + pinnedItems;
            else staffItems += asstHtml;
        }
    }

    // 群聊条目（也支持置顶）
    var groupItemHtml = '';
    if (!ppShowSpecialOnly && matchSearch('粉丝群', lastGroupText)) {
        var isGroupPinned = pinnedIds.indexOf('__group__') >= 0;
        var groupCls = 'pp-msg-item' + (isGroupPinned ? ' pinned' : '');
        groupItemHtml = '<div class="' + groupCls + '" ' +
            'onclick="ppOpenGroupChat()" ' +
            'oncontextmenu="return ppShowMsgItemMenu(event,\'__group__\')" ' +
            'ontouchstart="ppMsgItemTouchStart(event,\'__group__\')" ' +
            'ontouchend="ppMsgItemTouchEnd()" ' +
            'ontouchmove="ppMsgItemTouchEnd()">' +
            '<div class="pp-msg-avatar pp-msg-avatar-group"><i class="fas fa-users"></i></div>' +
            '<div class="pp-msg-info">' +
                '<div class="pp-msg-name">粉丝群 <span class="pp-msg-online">' + onlineCount + '人在线</span></div>' +
                '<div class="pp-msg-preview">' + escapeHtml(lastGroupText) + '</div>' +
            '</div>' +
            (isGroupPinned ? '' : '<div class="pp-msg-badge-dot"></div>') +
        '</div>';
        if (isGroupPinned) pinnedItems = groupItemHtml + pinnedItems;
    }

    var hasSpecialCare = (d.specialCareIds || []).length > 0;
    var specialFilterBtn = hasSpecialCare ?
        '<div class="pp-msg-action-btn' + (ppShowSpecialOnly ? ' pp-filter-active' : '') + '" onclick="ppToggleSpecialFilter()" title="特别关心"><i class="fas fa-star"></i></div>' : '';

    // 特别关心过滤模式：只显示特别关心的
    var bodyContent = '';
    if (ppShowSpecialOnly) {
        var specialItems = '';
        if (d.contacts && d.contacts.length > 0) {
            d.contacts.forEach(function(c){
                var isSpecialCare = (d.specialCareIds || []).indexOf(c.id) >= 0;
                if (!isSpecialCare) return;
                specialItems += buildContactItemHtml(c);
            });
        }
        bodyContent = specialItems || '<div class="pp-empty-hint" style="padding:32px 16px;">还没有设置特别关心的联系人~<br>在联系人详情中可以设置特别关心哦</div>';
    } else {
        // 搜索结果空态
        if (hasSearch && !pinnedItems && !staffItems && !normalItems && !groupItemHtml) {
            bodyContent = '<div class="pp-empty-hint" style="padding:40px 16px;"><i class="far fa-search" style="font-size:22px; opacity:0.3; display:block; margin-bottom:8px;"></i>没有找到「' + escapeHtml(searchQ) + '」相关的联系人</div>';
        } else {
            bodyContent = pinnedItems + (pinnedItems && (staffItems || groupItemHtml || normalItems) ? '<div class="pp-msg-divider"></div>' : '') +
                          (pinnedIds.indexOf('__group__') >= 0 ? '' : groupItemHtml) +
                          staffItems + normalItems;
        }
    }

    area.innerHTML = '<div class="pp-msg-list-page">' +
        '<div class="pp-msg-list-header">' +
            '<div class="pp-msg-list-title">' + (ppShowSpecialOnly ? '特别关心' : '消息') + '</div>' +
            '<div class="pp-msg-list-actions">' +
                '<div class="pp-msg-action-btn" onclick="ppToggleMsgSearch()" title="搜索"><i class="fas fa-search"></i></div>' +
                specialFilterBtn +
                '<div class="pp-msg-action-btn" onclick="ppGoToContacts()" title="联系人"><i class="fas fa-user-friends"></i></div>' +
                '<div class="pp-msg-action-btn" onclick="ppGoToStickerMount()" title="表情"><i class="fas fa-smile"></i></div>' +
                '<div class="pp-msg-action-btn" onclick="ppGoToSettings()" title="设置"><i class="fas fa-cog"></i></div>' +
            '</div>' +
        '</div>' +
        // 搜索栏（按需显示）
        '<div id="pp-msg-search-wrap" class="pp-search-bar" style="display:' + (hasSearch || window._ppMsgSearchOpen ? 'block' : 'none') + '; margin:0 12px 10px;">' +
            '<i class="fas fa-search pp-search-icon"></i>' +
            '<input type="text" id="pp-msg-search-input" class="pp-search-input" placeholder="搜索联系人/消息" value="' + escapeHtml(searchQ) + '">' +
            (searchQ ? '<button class="pp-search-clear" onclick="ppClearMsgSearch()"><i class="fas fa-times-circle"></i></button>' : '') +
        '</div>' +
        '<div class="pp-msg-list">' + bodyContent + '</div>' +
    '</div>';

    // 挂载搜索输入事件
    setTimeout(function(){
        var input = document.getElementById('pp-msg-search-input');
        if (input) {
            input.oninput = function(){
                ppMsgSearchQuery = this.value;
                // 防抖：重新渲染整个列表
                clearTimeout(window._ppMsgSearchTimer);
                window._ppMsgSearchTimer = setTimeout(function(){
                    var area = document.getElementById('pp-tab-content');
                    if (area) ppRenderMessageList(area);
                    // 保持输入框焦点
                    setTimeout(function(){
                        var inp = document.getElementById('pp-msg-search-input');
                        if (inp) {
                            inp.focus();
                            var len = inp.value.length;
                            try { inp.setSelectionRange(len, len); } catch(e){}
                        }
                    }, 10);
                }, 180);
            };
            if (window._ppMsgSearchOpen && !searchQ) input.focus();
        }
    }, 20);
}

// 打开/关闭搜索栏
window.ppToggleMsgSearch = function(){
    window._ppMsgSearchOpen = !window._ppMsgSearchOpen;
    if (!window._ppMsgSearchOpen) {
        ppMsgSearchQuery = '';
    }
    var area = document.getElementById('pp-tab-content');
    if (area) ppRenderMessageList(area);
};
window.ppClearMsgSearch = function(){
    ppMsgSearchQuery = '';
    window._ppMsgSearchOpen = true;
    var area = document.getElementById('pp-tab-content');
    if (area) ppRenderMessageList(area);
};

// ====== 消息列表项右键/长按菜单 ======
window._ppMsgLongPressTimer = null;
window.ppMsgItemTouchStart = function(e, contactId){
    // 避免选中文本
    if (e.touches && e.touches.length > 1) return;
    clearTimeout(window._ppMsgLongPressTimer);
    var touch = e.touches ? e.touches[0] : e;
    var x = touch.clientX, y = touch.clientY;
    window._ppMsgLongPressTimer = setTimeout(function(){
        // 触发震动（如果支持）
        try { if (navigator.vibrate) navigator.vibrate(30); } catch(_){}
        ppShowMsgItemMenuAt(contactId, x, y);
    }, 450);
};
window.ppMsgItemTouchEnd = function(){
    clearTimeout(window._ppMsgLongPressTimer);
};

window.ppShowMsgItemMenu = function(e, contactId){
    if (e && e.preventDefault) e.preventDefault();
    var x = (e.clientX) || (e.touches && e.touches[0] && e.touches[0].clientX) || 100;
    var y = (e.clientY) || (e.touches && e.touches[0] && e.touches[0].clientY) || 100;
    ppShowMsgItemMenuAt(contactId, x, y);
    return false;
};

function ppShowMsgItemMenuAt(contactId, x, y){
    // 移除已有菜单
    var old = document.getElementById('pp-msg-item-menu');
    if (old) old.remove();

    var d = store.paopao;
    var pinnedIds = d.pinnedIds || (d.pinnedIds = []);
    var isPinned = pinnedIds.indexOf(contactId) >= 0;
    var isSpecialCare = (d.specialCareIds || []).indexOf(contactId) >= 0;

    var menu = document.createElement('div');
    menu.id = 'pp-msg-item-menu';
    menu.style.cssText = 'position:fixed; z-index:9999; background:#fff; border-radius:14px; box-shadow:0 8px 32px rgba(0,0,0,0.15); border:1px solid rgba(0,0,0,0.06); min-width:160px; overflow:hidden; animation:ppScaleIn 0.15s ease;';

    var items = [];
    items.push({
        icon: isPinned ? 'fa-thumbtack' : 'fa-thumbtack',
        text: isPinned ? '取消置顶' : '置顶聊天',
        action: function(){ ppToggleMsgPin(contactId); }
    });
    // 群聊/经纪人/助理不能设置特别关心
    if (contactId !== '__group__' && contactId !== 'manager' && contactId !== 'assistant') {
        items.push({
            icon: isSpecialCare ? 'fa-star' : 'fa-star',
            text: isSpecialCare ? '取消特别关心' : '特别关心',
            action: function(){ ppToggleSpecialCare(contactId); }
        });
        items.push({
            icon: 'fa-check-circle',
            text: '标为已读',
            action: function(){ ppMarkAsRead(contactId); }
        });
    }
    items.push({
        icon: 'fa-trash-alt',
        text: '清空聊天记录',
        danger: true,
        action: function(){ ppClearChatHistory(contactId); }
    });

    menu.innerHTML = items.map(function(it){
        var style = 'display:flex; align-items:center; gap:10px; padding:11px 16px; cursor:pointer; font-size:13px; color:' + (it.danger ? '#c33' : '#222') + '; transition:background 0.15s;';
        return '<div class="pp-menu-item" style="' + style + '" data-act="' + items.indexOf(it) + '">' +
            '<i class="fas ' + it.icon + '" style="font-size:12px; width:14px; text-align:center; opacity:0.7;"></i>' +
            '<span>' + it.text + '</span>' +
        '</div>';
    }).join('<div style="height:1px; background:#f2f2f2;"></div>');

    // 定位（避免溢出屏幕）
    var maxX = window.innerWidth - 180;
    var maxY = window.innerHeight - (items.length * 44 + 20);
    x = Math.min(x, maxX);
    y = Math.min(y, maxY);
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    var ppApp = document.querySelector('.pp-app');
    if (ppApp) ppApp.appendChild(menu);
    else document.body.appendChild(menu);

    // 绑定点击
    menu.querySelectorAll('.pp-menu-item').forEach(function(el){
        el.onclick = function(ev){
            ev.stopPropagation();
            var idx = parseInt(el.getAttribute('data-act'));
            menu.remove();
            if (items[idx]) items[idx].action();
        };
        el.onmouseenter = function(){ el.style.background = '#f5f5f5'; };
        el.onmouseleave = function(){ el.style.background = 'transparent'; };
    });

    // 点击外部关闭
    setTimeout(function(){
        var closeHandler = function(ev){
            if (!menu.contains(ev.target)) {
                menu.remove();
                document.removeEventListener('click', closeHandler);
                document.removeEventListener('touchstart', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
        document.addEventListener('touchstart', closeHandler);
    }, 50);
}

window.ppToggleMsgPin = function(contactId){
    var d = store.paopao;
    if (!d.pinnedIds) d.pinnedIds = [];
    var idx = d.pinnedIds.indexOf(contactId);
    if (idx >= 0) d.pinnedIds.splice(idx, 1);
    else d.pinnedIds.unshift(contactId); // 最新置顶的在最前面
    save();
    ppRenderTab();
};

window.ppToggleSpecialCare = function(contactId){
    var d = store.paopao;
    if (!d.specialCareIds) d.specialCareIds = [];
    var idx = d.specialCareIds.indexOf(contactId);
    if (idx >= 0) d.specialCareIds.splice(idx, 1);
    else d.specialCareIds.push(contactId);
    save();
    ppRenderTab();
};

window.ppMarkAsRead = function(contactId){
    var d = store.paopao;
    if (contactId === '__group__' || contactId === 'manager' || contactId === 'assistant') return;
    var c = (d.contacts || []).find(function(x){ return x.id === contactId; });
    if (c) { c.unread = 0; save(); ppRenderTab(); }
};

window.ppClearChatHistory = function(contactId){
    ppConfirmDialog('清空聊天记录', '确定要清空与此联系人的所有聊天记录吗？该操作无法撤销。', function(){
        var d = store.paopao;
        if (contactId === '__group__') {
            d.chatMessages = [];
        } else if (contactId === 'manager' || contactId === 'assistant') {
            // staff聊天记录清空（如有）
            if (d.contactChats && d.contactChats[contactId]) d.contactChats[contactId] = [];
        } else if (d.contactChats) {
            d.contactChats[contactId] = [];
        }
        save();
        ppRenderTab();
        showPpResult('已清空', '聊天记录已清空', true);
    });
};

// ====== 打开群聊 ======
window.ppOpenGroupChat = function(){
    bubbleSubPage = 'groupChat';
    ppQuotedMsg = null;
    ppRenderTab();
};

// ====== 打开联系人列表 ======
window.ppGoToContacts = function(){
    bubbleSubPage = 'contacts';
    ppRenderTab();
};

// ====== 打开设置 ======
window.ppGoToSettings = function(){
    bubbleSubPage = 'settings';
    ppRenderTab();
};

// ====== 打开表情包挂载 ======
window.ppGoToStickerMount = function(){
    bubbleSubPage = 'stickerMount';
    ppRenderTab();
};

// ====== 切换特别关心过滤 ======
window.ppToggleSpecialFilter = function(){
    ppShowSpecialOnly = !ppShowSpecialOnly;
    ppRenderTab();
};

// ====== 打开联系人聊天 ======
window.ppOpenContactChat = function(contactId){
    currentContactId = contactId;
    bubbleSubPage = 'contactChat';
    ppQuotedMsg = null;
    var d = store.paopao;
    // 清除未读
    if(contactId !== 'manager' && contactId !== 'assistant'){
        var c = d.contacts.find(function(x){ return x.id === contactId; });
        if(c) c.unread = 0;
        save();
    }
    ppRenderTab();
};

// ====== 返回消息列表 ======
window.ppBackToMsgList = function(){
    bubbleSubPage = 'list';
    ppQuotedMsg = null;
    if(fanMsgTimer){ clearInterval(fanMsgTimer); fanMsgTimer = null; }
    ppRenderTab();
};

// ====== 群聊页面 ======
function ppRenderGroupChat(area){
    var d = store.paopao;
    
    // 自动生成一些初始消息
    if(d.chatMessages.length === 0){
        for(var i = 0; i < 15; i++){
            d.chatMessages.push(generateFanMessage(Date.now() - (15-i)*60000));
        }
        save();
    }
    
    var onlineCount = d.activeFans + Math.floor(Math.random() * 5);
    
    // [FIX-群聊滚动开关] 顶部添加自动滚动开关
    // [FIX-按钮可见性] 使用绝对定位固定在 header 右上角，不受 flex 布局影响
    var autoScrollOn = !!d.autoScrollEnabled;
    var autoScrollBtnBg = autoScrollOn ? '#ff6b9d' : '#bbb';
    var autoScrollBtnTitle = autoScrollOn ? '自动滚动已开启（点击关闭）' : '自动滚动已关闭（点击开启）';
    area.innerHTML = '<div class="pp-bubble-page">' +
        '<div class="pp-bubble-header pp-bubble-header-top" style="position:relative;">' +
            '<div class="pp-bubble-back" onclick="ppBackToMsgList()"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="pp-bubble-header-info">' +
                '<div class="pp-bubble-title"><i class="fas fa-users"></i> 粉丝群 (' + onlineCount + '人在线)</div>' +
                '<div class="pp-bubble-subtitle">' + formatFans(d.fans) + ' 粉丝 · ' + d.tier + '</div>' +
            '</div>' +
            '<div class="pp-bubble-autoscroll-btn" onclick="event.stopPropagation();ppToggleAutoScroll();" title="' + autoScrollBtnTitle + '" ' +
                'style="position:absolute;right:12px;top:50%;transform:translateY(-50%);z-index:5;' +
                'background:' + autoScrollBtnBg + ';color:#fff;padding:6px 10px;border-radius:14px;font-size:11px;' +
                'cursor:pointer;user-select:none;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;' +
                'box-shadow:0 2px 6px rgba(0,0,0,0.15);">' +
                '<i class="fas ' + (autoScrollOn ? 'fa-comment-dots' : 'fa-comment-slash') + '" style="font-size:11px;"></i>' +
                '<span>' + (autoScrollOn ? '自动' : '静音') + '</span>' +
            '</div>' +
        '</div>' +
        '<div class="pp-chat-list" id="pp-chat-list">' +
            d.chatMessages.map(function(msg){
                return renderChatMsg(msg);
            }).join('') +
        '</div>' +
        // 引用回复区
        '<div class="pp-quote-bar" id="pp-quote-bar" style="display:none;">' +
            '<div class="pp-quote-content" id="pp-quote-content"></div>' +
            '<div class="pp-quote-close" onclick="ppClearQuote()"><i class="fas fa-times"></i></div>' +
        '</div>' +
        // 多媒体按钮栏
        '<div class="pp-media-bar">' +
            '<div class="pp-media-btn" onclick="ppSendFakeImage()" title="伪装图片"><i class="fas fa-image"></i><span>伪装图</span></div>' +
            '<div class="pp-media-btn" onclick="ppSendRealImage()" title="真实图片"><i class="fas fa-camera"></i><span>真实图</span></div>' +
            '<div class="pp-media-btn" onclick="ppSendFakeVoice()" title="伪装语音"><i class="fas fa-microphone"></i><span>语音</span></div>' +
        '</div>' +
        '<div class="pp-chat-input-area">' +
            '<div class="pp-chat-emoji-btn" onclick="ppSendSticker()" title="表情包"><i class="far fa-smile"></i></div>' +
            '<input type="text" class="pp-chat-input" id="pp-chat-input" placeholder="回复粉丝消息..." onkeydown="if(event.key===\'Enter\')ppSendReply()">' +
            '<button class="pp-chat-send-btn" onclick="ppSendReply()"><i class="fas fa-paper-plane"></i></button>' +
        '</div>' +
    '</div>';
    
    // 绑定长按事件
    setTimeout(function(){
        ppBindLongPress();
        var chatList = document.getElementById('pp-chat-list');
        if(chatList) chatList.scrollTop = chatList.scrollHeight;
    }, 100);
    
    // 自动接收新消息（受 autoScrollEnabled 开关控制，关闭时内部会直接 return）
    startFanMessageTimer();
}

// [FIX-群聊滚动开关] 切换预设消息自动滚动
window.ppToggleAutoScroll = function(){
    var d = store.paopao;
    d.autoScrollEnabled = !d.autoScrollEnabled;
    save();
    if(typeof toast === 'function') {
        toast(d.autoScrollEnabled ? '已开启自动滚动' : '已关闭自动滚动');
    }
    // [FIX-卡死] 必须用 ppRenderTab()，它会正确操作 pp-tab-content；
    // 绝不能把群聊HTML写进 paopao-content（那是 layer 外壳，会干掉 nav/tab 栏导致退不出）
    if(bubbleSubPage === 'groupChat' && typeof ppRenderTab === 'function') {
        ppRenderTab();
    }
    // 根据开关状态启停定时器
    if(d.autoScrollEnabled){
        if(typeof startFanMessageTimer === 'function') startFanMessageTimer();
    } else {
        if(fanMsgTimer){ clearInterval(fanMsgTimer); fanMsgTimer = null; }
    }
};

function renderChatMsg(msg){
    var quoteHtml = '';
    if(msg.quotedText){
        quoteHtml = '<div class="pp-chat-quote-ref"><i class="fas fa-reply"></i> ' + escapeHtml(msg.quotedName || '') + ': ' + escapeHtml(msg.quotedText).substring(0,30) + '</div>';
    }
    
    // 确定消息内容显示
    var contentHtml = '';
    if(msg.mediaType === 'fake_image'){
        if(msg.imageUrl){
            // 伪装图片带真实图片：显示图片+描述标签
            contentHtml = '<div class="pp-chat-fake-img-wrap" onclick="ppShowBigImg(\'' + escapeHtml(msg.imageUrl).replace(/'/g, "\\'") + '\')">' +
                '<img src="' + escapeHtml(msg.imageUrl) + '" class="pp-chat-img-msg">' +
                '<div class="pp-chat-fake-img-label"><i class="fas fa-image"></i> ' + escapeHtml(msg.fakeImgDesc || msg.text || '[图片]') + '</div>' +
            '</div>';
        } else {
            contentHtml = '<div class="pp-chat-media-msg"><i class="fas fa-image"></i> ' + escapeHtml(msg.text || '[图片]') + '</div>';
        }
    } else if(msg.mediaType === 'real_image' && msg.imageUrl){
        contentHtml = '<img src="' + escapeHtml(msg.imageUrl) + '" class="pp-chat-img-msg" onclick="ppShowBigImg(this.src)">';
    } else if(msg.mediaType === 'voice'){
        var voiceId = 'pp-voice-' + (msg.time || Math.random());
        var voiceDur = msg.voiceDuration || '';
        var voiceTextVal = msg.voiceText || '';
        if(msg.isMe && voiceTextVal){
            // 用户发的伪装语音：可播放TTS
            contentHtml = '<div class="pp-chat-voice-msg pp-chat-voice-playable" id="' + voiceId + '" onclick="ppPlayVoice(\'' + voiceId + '\',\'' + escapeHtml(voiceTextVal).replace(/'/g, "\\'") + '\')" data-voice-text="' + escapeHtml(voiceTextVal) + '">' +
                '<i class="fas fa-volume-up"></i> ' +
                '<span class="pp-voice-wave"><span></span><span></span><span></span></span>' +
                '<span class="pp-voice-sec">' + (voiceDur || '') + '</span>' +
            '</div>';
        } else {
            contentHtml = '<div class="pp-chat-voice-msg"><i class="fas fa-volume-up"></i> ' + escapeHtml(msg.text || '[语音]') + '</div>';
        }
    } else if(msg.mediaType === 'sticker' && msg.stickerUrl){
        if(msg.stickerUrl.length <= 4){
            contentHtml = '<div class="pp-chat-sticker-emoji">' + msg.stickerUrl + '</div>';
        } else {
            contentHtml = '<img src="' + escapeHtml(msg.stickerUrl) + '" class="pp-chat-sticker-msg">';
        }
    } else {
        contentHtml = escapeHtml(msg.text);
    }
    
    var msgId = 'pp-msg-' + (msg.time || Math.random());
    
    if(msg.isMe){
        return '<div class="pp-chat-msg pp-chat-msg-me" id="' + msgId + '" data-msgtime="' + (msg.time||'') + '" data-msgname="' + escapeHtml(store.paopao.stageName||'我') + '" data-msgtext="' + escapeHtml(msg.text||'') + '">' +
            '<div class="pp-chat-avatar-me">' + (store.paopao.stageName||'我').charAt(0) + '</div>' +
            '<div class="pp-chat-bubble-me">' + quoteHtml + contentHtml + '</div>' +
        '</div>';
    } else {
        var fanNameSafe = escapeHtml((msg.name||'粉丝')).replace(/'/g, "\\'");
        var blackFanClass = msg.isBlackFan ? ' pp-chat-msg-blackfan' : '';
        var blackAvatarClass = msg.isBlackFan ? ' pp-avatar-blackfan' : '';
        var blackBubbleClass = msg.isBlackFan ? ' pp-bubble-blackfan' : '';
        var blackTag = msg.isBlackFan ? '<span class="pp-blackfan-tag">⚠</span>' : '';
        return '<div class="pp-chat-msg pp-chat-msg-fan' + blackFanClass + '" id="' + msgId + '" data-msgtime="' + (msg.time||'') + '" data-msgname="' + escapeHtml(msg.name||'') + '" data-msgtext="' + escapeHtml(msg.text||'') + '">' +
            '<div class="pp-chat-avatar-fan pp-fan-avatar-clickable' + blackAvatarClass + '" onclick="event.stopPropagation();ppShowFanProfile(\'' + fanNameSafe + '\')">' + (msg.name||'粉').charAt(0) + '</div>' +
            '<div class="pp-chat-fan-info">' +
                '<div class="pp-chat-fan-name">' + escapeHtml(msg.name||'粉丝') + blackTag + '</div>' +
                '<div class="pp-chat-bubble-fan' + blackBubbleClass + '">' + quoteHtml + contentHtml + '</div>' +
            '</div>' +
        '</div>';
    }
}

// ====== 长按引用回复 ======
// 使用标记防止重复绑定事件监听器
var _ppLongPressBound = false;

function ppBindLongPress(){
    var chatList = document.getElementById('pp-chat-list');
    if(!chatList) return;
    
    // 防止重复绑定：只绑定一次
    if(chatList._ppLongPressBound) return;
    chatList._ppLongPressBound = true;
    
    var longPressTimer = null;
    var startX = 0, startY = 0;
    var longPressTriggered = false;
    
    chatList.addEventListener('touchstart', function(e){
        var msgEl = e.target.closest('.pp-chat-msg');
        if(!msgEl) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        longPressTriggered = false;
        longPressTimer = setTimeout(function(){
            longPressTriggered = true;
            // 触发振动反馈（如果支持）
            if(navigator.vibrate) navigator.vibrate(50);
            ppShowQuoteMenu(msgEl, e.touches[0].clientX, e.touches[0].clientY);
        }, 500);
    }, {passive: true});
    
    chatList.addEventListener('touchmove', function(e){
        if(!longPressTimer) return;
        var dx = Math.abs(e.touches[0].clientX - startX);
        var dy = Math.abs(e.touches[0].clientY - startY);
        if(dx > 10 || dy > 10){
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }, {passive: true});
    
    chatList.addEventListener('touchend', function(e){
        if(longPressTimer){ clearTimeout(longPressTimer); longPressTimer = null; }
        // 如果触发了长按，阻止后续的点击事件
        if(longPressTriggered){
            longPressTriggered = false;
            e.preventDefault();
        }
    });
    
    // 桌面端右键
    chatList.addEventListener('contextmenu', function(e){
        var msgEl = e.target.closest('.pp-chat-msg');
        if(!msgEl) return;
        e.preventDefault();
        ppShowQuoteMenu(msgEl, e.clientX, e.clientY);
    });
}

function ppShowQuoteMenu(msgEl, x, y){
    // 移除旧菜单
    var oldMenu = document.querySelector('.pp-quote-menu');
    if(oldMenu) oldMenu.remove();
    
    var msgName = msgEl.getAttribute('data-msgname') || (msgEl.classList.contains('pp-chat-msg-me') ? (store.paopao.stageName||'我') : '粉丝');
    var msgText = msgEl.getAttribute('data-msgtext') || '';
    if(!msgText){
        var bubbleEl = msgEl.querySelector('.pp-chat-bubble-fan') || msgEl.querySelector('.pp-chat-bubble-me');
        if(bubbleEl) msgText = bubbleEl.textContent || '';
    }
    
    // 存储到临时变量，避免引号转义问题
    window._ppQuoteMenuData = { name: msgName, text: msgText.substring(0, 50) };
    
    var menu = document.createElement('div');
    menu.className = 'pp-quote-menu';
    
    var menuItem = document.createElement('div');
    menuItem.className = 'pp-quote-menu-item';
    menuItem.innerHTML = '<i class="fas fa-reply"></i> 引用回复';
    menuItem.onclick = function(e){
        e.stopPropagation();
        var data = window._ppQuoteMenuData;
        if(data) ppSetQuote(data.name, data.text);
        menu.remove();
    };
    menu.appendChild(menuItem);
    
    menu.style.position = 'fixed';
    menu.style.left = Math.min(x, window.innerWidth - 140) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 50) + 'px';
    menu.style.zIndex = '999';
    
    // 添加到 pp-app 容器内，确保在正确的层级中
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(menu);
    else document.body.appendChild(menu);
    
    // 点击其他地方关闭
    setTimeout(function(){
        var closeHandler = function(evt){
            if(!menu.contains(evt.target)){
                menu.remove();
                document.removeEventListener('click', closeHandler);
                document.removeEventListener('touchstart', closeHandler);
            }
        };
        document.addEventListener('click', closeHandler);
        document.addEventListener('touchstart', closeHandler);
    }, 100);
}

window.ppSetQuote = function(name, text){
    ppQuotedMsg = {name: name, text: text};
    var bar = document.getElementById('pp-quote-bar');
    var content = document.getElementById('pp-quote-content');
    if(bar && content){
        content.innerHTML = '<strong>' + escapeHtml(name) + '</strong>: ' + escapeHtml(text);
        bar.style.display = 'flex';
    }
    // 聚焦输入框
    var input = document.getElementById('pp-chat-input') || document.getElementById('pp-contact-chat-input');
    if(input) input.focus();
    
    // 移除菜单
    var oldMenu = document.querySelector('.pp-quote-menu');
    if(oldMenu) oldMenu.remove();
};

window.ppClearQuote = function(){
    ppQuotedMsg = null;
    var bar = document.getElementById('pp-quote-bar');
    if(bar) bar.style.display = 'none';
};

// ====== 动态生成粉丝消息文本（减少重复感，大幅提升概率） ======
function ppDynamicFanMsg(){
    var r = Math.random();
    // [FIX] 时间段感知：凌晨/早上/午休/晚上不同用语
    var hour = new Date().getHours();
    if(r < 0.08) {
        if(hour >= 0 && hour < 6) {
            var lateNight = ['睡不着来冒个泡','夜猫子报到🌙','失眠了，来看看群里','凌晨的群好安静啊','半夜偷偷追星','大家都睡了吗？','夜深了还在想姐姐','熬夜冠军就是我'];
            return lateNight[Math.floor(Math.random()*lateNight.length)];
        } else if(hour >= 6 && hour < 9) {
            var morning = ['早安！新的一天从追星开始☀️','早起打卡~','起床第一件事就是来群里','早上好呀大家','今天也要元气满满！','早安，今天也要支持姐姐💪'];
            return morning[Math.floor(Math.random()*morning.length)];
        } else if(hour >= 12 && hour < 14) {
            var noon = ['午休时间来冒泡~','吃完饭了来逛逛','午饭时间到！','中午好呀，摸鱼来了','午休刷一会儿就睡','边吃饭边看群消息'];
            return noon[Math.floor(Math.random()*noon.length)];
        } else if(hour >= 22 && hour < 24) {
            var night = ['晚安前来签个到🌙','睡前必须来看一眼','今天结束了，晚安~','一天结束了，来群里放松下','晚安晚安，明天继续追星','睡前打卡✨'];
            return night[Math.floor(Math.random()*night.length)];
        }
    }
    // 45%概率动态拼接消息（提高比例减少重复）
    if(r < 0.15) {
        // 动态拼接：感叹词+内容
        var exclaims = ['啊啊啊','天哪','我的天','哇塞','好厉害','太棒了','绝了','救命','妈耶','我滴天','不是吧','我靠','wooo','omg','天呐'];
        var contents = [
            '姐姐也太好看了吧！','这个也太绝了吧！','我真的好喜欢！',
            '今天也好美呀！','被美到了！','心动了心动了！',
            '怎么可以这么好看！','我被圈粉了！','不行了受不了了！',
            '这颜值是真实存在的吗！','又被暴击了！','好想见面啊！',
            '完全被拿捏了！','这是什么神仙颜值！','我的心脏受不了了！',
            '每次看到都好激动！','太绝了太绝了！','美哭了真的！',
        ];
        return exclaims[Math.floor(Math.random()*exclaims.length)] + '！' + contents[Math.floor(Math.random()*contents.length)];
    } else if(r < 0.30) {
        // 动态拼接：话题+评论
        var topics = [
            '刚看了姐姐的最新动态，','今天翻到姐姐之前的视频，','朋友给我安利了姐姐，',
            '午休的时候刷到姐姐的照片，','上课偷偷看姐姐的采访，','走路的时候听姐姐的歌，',
            '下班回家第一件事就是看姐姐的更新，','睡前必须看一眼姐姐的照片，',
            '和同事聊起姐姐，','给妈妈看了姐姐的节目，',
            '等车的时候刷到了姐姐的视频，','吃饭的时候看了姐姐的直播回放，',
            '跑步的时候听了姐姐的歌，','洗澡的时候单曲循环姐姐的新歌，',
        ];
        var comments = [
            '真的太治愈了','心情瞬间好了','笑了一整天','怎么可以这么优秀',
            '根本停不下来','越看越喜欢','简直是宝藏','每次都有新惊喜',
            '感觉又爱上了','完全被征服了','直接入坑了hh','好开心',
            '太上头了','笑到不行','被治愈到了','整个人都精神了',
        ];
        return topics[Math.floor(Math.random()*topics.length)] + comments[Math.floor(Math.random()*comments.length)] + ['！','～','❤️','💕','✨','🌟','😊','🥰','😭','🤩'][Math.floor(Math.random()*10)];
    } else if(r < 0.45) {
        // 新增：日常生活类动态拼接（让群聊更自然）
        var lifeStarters = [
            '今天上班好累啊','刚吃完饭','下班了终于','周末终于到了',
            '今天天气好好','好想出去玩','在家无聊','刚运动完',
            '午休时间到','今天考试完了','加班到现在','刚下课',
            '堵车堵了好久','今天心情超好','刚和朋友逛完街','外面好冷啊',
        ];
        var lifeEnders = [
            '，来群里逛逛','，上来冒个泡','，看看大家在聊什么','，刷一会儿就睡',
            '，顺便看看有没有新消息','，签个到~','，来找找组织','，来看看热闹',
            '，冒泡！','，路过打卡','，我来啦~','，大家好呀',
        ];
        return lifeStarters[Math.floor(Math.random()*lifeStarters.length)] + lifeEnders[Math.floor(Math.random()*lifeEnders.length)];
    }
    // 55%使用预设池（带防重复）
    return null;
}

// ====== 群聊自动消息防重复 ======
var _ppRecentAutoMsgs = [];
var _PP_AUTO_MSG_RECENT_MAX = 15;
// [FIX] 根据粉丝基数动态调整防重复窗口
function ppGetAutoMsgRecentMax(){
    var d = store.paopao;
    if(d && d.fans > 100000) return 30;
    if(d && d.fans > 10000) return 20;
    return _PP_AUTO_MSG_RECENT_MAX;
}

// ====== 生成粉丝消息（带防重复） ======
function generateFanMessage(timestamp){
    var d = store.paopao;
    var msgPool = FAN_MESSAGES_ALL;
    
    // 是否掺杂随机伪装图片/语音/表情包
    // [FIX-伪装图概率] 降低伪装图概率 6%→2%，伪装语音保持 4%(0.02-0.06)
    var rand = Math.random();
    if(rand < 0.02){
        // 随机伪装图片
        return {
            name: ppGetFanName(),
            text: FAKE_IMAGE_URLS[Math.floor(Math.random()*FAKE_IMAGE_URLS.length)],
            mediaType: 'fake_image',
            time: timestamp || Date.now(),
            isMe: false
        };
    } else if(rand < 0.06){
        // 随机伪装语音
        return {
            name: ppGetFanName(),
            text: FAKE_VOICE_TEXTS[Math.floor(Math.random()*FAKE_VOICE_TEXTS.length)],
            mediaType: 'voice',
            time: timestamp || Date.now(),
            isMe: false
        };
    } else if(rand < 0.11 && d.mountedStickerCateIds && d.mountedStickerCateIds.length > 0){
        // 随机表情包（从挂载的表情包中选择）
        var sticker = ppGetRandomMountedSticker();
        if(sticker){
            return {
                name: ppGetFanName(),
                text: '[表情]',
                mediaType: 'sticker',
                stickerUrl: sticker.url,
                time: timestamp || Date.now(),
                isMe: false
            };
        }
    }
    
    // 尝试动态生成（提高概率到45%以减少重复感）
    var dynamicText = ppDynamicFanMsg();
    var msgText;
    if(dynamicText){
        msgText = ppReplaceTitle(dynamicText);
    } else {
        // 从预设池中选择，带防重复
        var available = msgPool.filter(function(m){ return _ppRecentAutoMsgs.indexOf(m) === -1; });
        if(available.length === 0){
            _ppRecentAutoMsgs = [];
            available = msgPool.slice();
        }
        var chosen = available[Math.floor(Math.random()*available.length)];
        _ppRecentAutoMsgs.push(chosen);
        var _maxRecent = ppGetAutoMsgRecentMax();
        if(_ppRecentAutoMsgs.length > _maxRecent) _ppRecentAutoMsgs.shift();
        msgText = ppReplaceTitle(chosen);
    }
    
    return {
        name: ppGetFanName(),
        text: msgText,
        time: timestamp || Date.now(),
        isMe: false
    };
}

// ====== 黑粉系统 ======
var BLACK_FAN_MESSAGES = [
    '就这水平也能当明星？','演技尬到脚趾抠地','买热搜买的吧','路人表示真的欣赏不来',
    '粉丝滤镜太厚了吧','资源咖实锤','有这资源给谁不火','营销号别洗了',
    '对家粉来看看你们偶像的黑料','呵呵，不过如此','塌房预定','迟早翻车',
    '这也能吹？','审美降级了吧','就这？','别尬吹了好吗',
    '路人真的无感','同行都看不下去了吧','有本事别删评论啊','控评也救不了'
];
var BLACK_FAN_NAMES = ['路人甲','清醒的人','实话实说','理性看待','不吹不黑','真相帝','吃瓜看戏','对家粉丝','前粉丝','脱粉回踩'];
var BLACK_FAN_TYPES = ['rival','hater','ex_fan']; // 对家粉、路人黑、脱粉回踩

function ppShouldTriggerBlackFan() {
    var d = store.paopao;
    // 基础概率：5%
    var prob = 0.05;
    // 粉丝越多概率越高
    if (d.fans > 50000) prob += 0.03;
    if (d.fans > 200000) prob += 0.05;
    if (d.fans > 1000000) prob += 0.05;
    // 有对家NPC时概率更高
    if (d.npcStars && d.npcStars.some(function(s) { return s.relationship === 'rival'; })) {
        prob += 0.05;
    }
    // 最近有争议事件时概率激增
    if (d.pendingEvent && d.pendingEvent.type === 'scandal') prob += 0.15;
    // [FIX] 与热搜情绪联动：最近有负面热搜时黑粉概率↑
    if (d.weiboHotCache && d.weiboHotCache.items) {
        var negSelfCount = d.weiboHotCache.items.filter(function(it){
            return it.isSelf && it.topic && (/翻车|争议|塌房|黑料|撕|怼|骂|丑闻|出轨|抄袭/).test(it.topic);
        }).length;
        prob += negSelfCount * 0.08;
    }
    return Math.random() < prob;
}

function generateBlackFanMessage(timestamp) {
    var d = store.paopao;
    var blackType = BLACK_FAN_TYPES[Math.floor(Math.random() * BLACK_FAN_TYPES.length)];
    var name = BLACK_FAN_NAMES[Math.floor(Math.random() * BLACK_FAN_NAMES.length)];
    var text = BLACK_FAN_MESSAGES[Math.floor(Math.random() * BLACK_FAN_MESSAGES.length)];
    
    // [FIX] 对家粉特殊消息 + 降低NPC好感度
    if (blackType === 'rival' && d.npcStars) {
        var rival = d.npcStars.find(function(s) { return s.relationship === 'rival'; });
        if (rival) {
            var rivalMsgs = [
                rival.name + '比你强多了','去看看' + rival.name + '的作品吧，差距太大了',
                rival.name + '粉丝路过，你们偶像不行','论实力' + rival.name + '甩你偶像几条街'
            ];
            text = rivalMsgs[Math.floor(Math.random() * rivalMsgs.length)];
            name = rival.name + '的粉丝';
            // [FIX] 对家黑粉出现时降低对家好感度
            rival.friendliness = Math.max(0, (rival.friendliness || 50) - 1);
        }
    }
    
    // [FIX] 路人黑：伤害更大（掉粉更多），但不影响NPC关系
    if (blackType === 'hater') {
        var haterMsgs = [
            '路人真心觉得不行','不是黑，客观评价真的差','路人缘太差了吧','普通观众表示看不下去','这业务能力也好意思出道？'
        ];
        text = haterMsgs[Math.floor(Math.random() * haterMsgs.length)];
        name = '路人' + Math.floor(Math.random()*999);
    }
    
    // 脱粉回踩
    if (blackType === 'ex_fan') {
        var exMsgs = [
            '曾经的粉丝表示真的失望了','脱粉了，再也不追了','以前觉得很好，现在看清了',
            '脱粉回踩，不后悔','粉了这么久结果是这样的人'
        ];
        text = exMsgs[Math.floor(Math.random() * exMsgs.length)];
    }
    
    // 创建黑粉档案
    if (d.fanProfiles) {
        if (!d.fanProfiles[name]) {
            d.fanProfiles[name] = {
                id: 'fan_black_' + Date.now(),
                name: name,
                joinTime: Date.now(),
                level: 1,
                type: '黑粉',
                loyalty: 0,
                color: '#333',
                stats: { messages: 1, dataWork: 0, antiBlack: 0, checkin: 0, likes: 0, reposts: 0 },
                mood: '恶意',
                lastActive: Date.now(),
                isBlackFan: true,
                blackFanType: blackType
            };
        }
    }
    // [FIX] 黑粉出现时，随机给一个非黑粉增加antiBlack统计（模拟反黑组行为）
    if(d.fanProfiles){
        var goodFans = Object.keys(d.fanProfiles).filter(function(k){ return !d.fanProfiles[k].isBlackFan; });
        if(goodFans.length > 0){
            var defender = d.fanProfiles[goodFans[Math.floor(Math.random()*goodFans.length)]];
            defender.stats = defender.stats || {};
            defender.stats.antiBlack = (defender.stats.antiBlack||0) + 1;
            if(Math.random() < 0.2) defender.mood = '激动'; // 反黑后情绪激动
        }
    }
    
    return {
        name: name,
        text: text,
        time: timestamp || Date.now(),
        isMe: false,
        isBlackFan: true,
        blackFanType: blackType
    };
}

// 修改原始generateFanMessage，注入黑粉概率
var _origGenerateFanMessage = generateFanMessage;
generateFanMessage = function(timestamp) {
    if (ppShouldTriggerBlackFan()) {
        return generateBlackFanMessage(timestamp);
    }
    return _origGenerateFanMessage(timestamp);
};

// ====== 获取随机挂载表情包 ======
function ppGetRandomMountedSticker(){
    var d = store.paopao;
    if(!d.mountedStickerCateIds || d.mountedStickerCateIds.length === 0) return null;
    var allStickers = [];
    d.mountedStickerCateIds.forEach(function(cid){
        var cate = (store.stickerCategories || []).find(function(sc){ return sc.id === cid; });
        if(cate && cate.stickers){
            cate.stickers.forEach(function(s){
                allStickers.push(s);
            });
        }
    });
    if(allStickers.length === 0) return null;
    return allStickers[Math.floor(Math.random() * allStickers.length)];
}

// ====== 管理员消息生成 ======
function ppGenerateAdminMessage(){
    var d = store.paopao;
    if(!d.adminIds || d.adminIds.length === 0) return null;
    var adminId = d.adminIds[Math.floor(Math.random() * d.adminIds.length)];
    var adminContact = d.contacts.find(function(c){ return c.id === adminId; });
    if(!adminContact) return null;
    
    var adminMsgs = [
        '大家注意群规哦，文明发言～','欢迎新来的小伙伴们！记得遵守群规~',
        '提醒一下，不要刷屏哦，给其他人发言的机会','有什么问题可以@我哦',
        '大家有序发言，不要刷太快啦~','新来的宝宝们记得看置顶群规呀',
        '维护好群内环境，人人有责💪','请不要发广告哦~违规会被踢出群的',
        '大家好，我是管理员，有事找我就好~','今天又来值班啦，大家好！',
        '来来来，签到的举个手🙋','管理员在线，有问题随时问',
        '大家不要吵架哦，和和气气的~','温馨提示：不要发送不当言论',
        '打卡打卡！今天也是美好的一天','安利一下，大家去超话签到了吗',
        '帮忙维护一下秩序，谢谢大家配合','大家记得去给新剧打分评论哦！',
        '有人@我吗？管理员上线了~','欢迎各位粉丝宝宝，我会帮大家维护群的',
        '不要吵不要吵，安静看消息~','大家克制一点，别刷屏太快了hh',
        '今天的值班管理员是我！','帮忙顶一下，别让消息沉了'
    ];
    
    return {
        name: '🛡️' + adminContact.name,
        text: adminMsgs[Math.floor(Math.random() * adminMsgs.length)],
        time: Date.now(),
        isMe: false,
        isAdmin: true
    };
}

var fanMsgTimer = null;
var ppApiBatchCounter = 0; // 用于追踪API批量生成计数
var _ppUserHasSentMsg = false; // 标记用户是否发过消息（用于区分预设/API模式）
var _ppApiReplyPlaying = false; // 标记是否正在播放API回复组

function startFanMessageTimer(){
    if(fanMsgTimer) clearInterval(fanMsgTimer);
    var d = store.paopao;
    // [FIX-群聊滚动开关] 用户关闭自动滚动时不启动定时器
    if(!d.autoScrollEnabled) { fanMsgTimer = null; return; }
    // 粉丝越多，消息越频繁
    var interval = Math.max(2000, 8000 - Math.floor(Math.sqrt(d.fans / 100)) * 50);
    if(interval < 2000) interval = 2000;
    
    fanMsgTimer = setInterval(function(){
        if(bubbleSubPage !== 'groupChat') return;
        // [FIX-群聊滚动开关] 运行期间开关被关闭时立即停止
        if(!store.paopao.autoScrollEnabled) { clearInterval(fanMsgTimer); fanMsgTimer = null; return; }
        var chatList = document.getElementById('pp-chat-list');
        if(!chatList) return;
        
        // ★ 核心逻辑：用户发过消息 → 优先播放缓存的API回复组（与用户消息相关）
        if(_ppUserHasSentMsg && _ppApiReplyCache && _ppApiReplyCache.length > 0 && _ppApiReplyCacheIdx < _ppApiReplyCache.length - 1){
            if(!_ppApiReplyPlaying){
                if(ppPlayNextCachedGroup()){
                    return; // 正在播放缓存组，跳过预设消息
                }
            } else {
                return; // 上一组还在播放中，等待
            }
        }
        
        // ★ 用户未发消息 或 API缓存已播完 → 使用预设消息
        // 15%概率让管理员发管理消息
        var newMsg;
        if(Math.random() < 0.15 && d.adminIds && d.adminIds.length > 0){
            newMsg = ppGenerateAdminMessage();
        }
        if(!newMsg) newMsg = generateFanMessage();
        d.chatMessages.push(newMsg);
        if(d.chatMessages.length > 200) d.chatMessages = d.chatMessages.slice(-150);
        
        chatList.insertAdjacentHTML('beforeend', renderChatMsg(newMsg));
        // 重新绑定长按
        ppBindLongPress();
        chatList.scrollTop = chatList.scrollHeight;
        
        // ★ 只在用户未发过消息时才用API批量生成随机群聊消息（增加真实感）
        // 用户发过消息后不再生成随机内容，全部由用户消息触发的API回复接管
        if(!_ppUserHasSentMsg){
            ppApiBatchCounter++;
            // [OPT-降频] 从每5周期调一次改为每12周期调一次，配合每次生成更多条数
            if(ppApiBatchCounter % 12 === 0 && window.API && API.chatCompletion){
                ppApiRandomGroupChat();
            }
        }
    }, interval);
}

// ====== API批量生成群聊消息（增强自然感+去重） ======
function ppApiRandomGroupChat(){
    if(!window.API || !API.chatCompletion) return;
    _currentApiScene = 'paopao';
    var d = store.paopao;
    var titleWord = ppGetTitle();
    
    // 获取最近几条消息作为上下文
    var recentMsgs = d.chatMessages.slice(-8).map(function(m){
        return (m.isMe ? '【明星】' : '【' + (m.name||'粉丝') + '】') + ': ' + (m.text||'');
    }).join('\n');
    
    // 收集最近的粉丝消息用于去重
    var recentTexts = d.chatMessages.slice(-12).filter(function(m){ return !m.isMe; }).map(function(m){ return m.text||''; });
    var dedupeHint = recentTexts.length > 0 ?
        '\n⚠️ 注意不要重复最近已有的消息内容：' + recentTexts.slice(-5).map(function(t){ return '"' + t.substring(0,20) + '"'; }).join('、') : '';
    
    var topics = ['分享日常生活','讨论明星的新作品','互相安利好物','聊天气和心情','讨论最近的热点话题',
        '分享美食','讨论追星趣事','聊周末计划','吐槽工作学习','分享最近追的剧',
        '讨论最近的音乐','聊旅行计划','交流穿搭','聊宠物','讨论运动健身'];
    var randomTopic = topics[Math.floor(Math.random()*topics.length)];
    
    var sysPrompt = '你模拟一个粉丝群里的真实群聊。明星叫' + (d.stageName||titleWord) + '（称呼用"' + titleWord + '"）。' +
        '粉丝们正在群里' + randomTopic + '。请生成10-15条自然的群聊消息。' +
        '每行格式：粉丝名|消息内容。' +
        '\n⚠️ 核心要求——模拟真实的多人群聊：' +
        '\n1. 消息之间要有对话逻辑！后面的消息是对前面消息的回应。粉丝A说了什么，粉丝B要接A的话（赞同/反驳/吐槽/追问），而不是各说各的。' +
        '\n2. 必须有至少一组"对话链"：2-3条消息是同一个话题的来回讨论，不是每条都在说不同的事。' +
        '\n3. 同一个粉丝可以出现多次（真实群聊中一个人会连发好几条，或者过一会儿再接话）。' +
        '\n4. 每条5-30字，口语化、接地气。不同人说话风格要有差异——有人爱用emoji，有人纯文字，有人爱打省略号…有人说话很冲，有人温柔。' +
        '\n5. 不要都在夸明星！要有日常闲聊：吐槽自己的生活、讨论别的事、互相开玩笑。大约一半的消息应该和明星无关。' +
        '\n6. 偶尔有人打岔或跑题很正常——比如别人在讨论明星，突然有人说"啊我外卖到了先走了"。' +
        '\n7. 可以偶尔有人@前面说话的粉丝名字来回应。' +
        dedupeHint;
    
    API.chatCompletion([
        {role:'system', content: sysPrompt},
        {role:'user', content: '最近群聊：\n' + recentMsgs + '\n\n请生成自然的群聊消息：'}
    ], 0.95, true).then(function(data){
        if(!data || !data.choices || !data.choices[0]) return;
        var reply = (data.choices[0].message.content || '').trim();
        var lines = reply.split('\n').filter(function(l){ return l.trim(); });
        
        var chatList = document.getElementById('pp-chat-list');
        lines.forEach(function(line, idx){
            var parts = line.split('|');
            var fanName, fanText;
            // [FIX-粉丝名字错乱] 如果没有 | 分隔符，整行就是消息文本，用随机粉丝名
            if(parts.length >= 2 && parts[1].trim()){
                fanName = parts[0].trim();
                fanText = parts.slice(1).join('|').trim(); // 支持消息内容中含 |
            } else {
                fanName = ppGetFanName();
                fanText = line.trim();
            }
            // 清理可能的格式前缀
            fanName = fanName.replace(/^\d+[\.\)、]\s*/,'').replace(/^粉丝\s*/,'');
            fanText = fanText.replace(/^[:：]\s*/,'');
            // [FIX-粉丝名字错乱] 名字过长(>10字)说明AI没按格式输出，名字实际是消息内容
            if(fanName.length > 10) { fanText = fanName; fanName = ppGetFanName(); }
            if(!fanText || fanText.length > 60 || fanText.length < 2) return;
            
            setTimeout(function(){
                if(bubbleSubPage !== 'groupChat') return;
                var aiMsg = {
                    name: fanName || ppGetFanName(),
                    text: fanText,
                    time: Date.now(),
                    isMe: false
                };
                d.chatMessages.push(aiMsg);
                if(d.chatMessages.length > 100) d.chatMessages = d.chatMessages.slice(-80);
                if(chatList){
                    chatList.insertAdjacentHTML('beforeend', renderChatMsg(aiMsg));
                    ppBindLongPress();
                    chatList.scrollTop = chatList.scrollHeight;
                }
            }, 500 + idx * 1200 + Math.random() * 800);
        });
    }).catch(function(){});
}

// ====== 发送文字回复 ======
window.ppSendReply = function(){
    var input = document.getElementById('pp-chat-input');
    if(!input || !input.value.trim()) return;
    
    var d = store.paopao;
    var msg = {
        text: input.value.trim(),
        time: Date.now(),
        isMe: true
    };
    
    // 附加引用信息
    if(ppQuotedMsg){
        msg.quotedName = ppQuotedMsg.name;
        msg.quotedText = ppQuotedMsg.text;
    }
    
    d.chatMessages.push(msg);
    d.lastUserMsgTime = Date.now();
    // [FIX] 累加总互动次数
    d.totalInteractions = (d.totalInteractions || 0) + 1;
    
    var chatList = document.getElementById('pp-chat-list');
    if(chatList){
        chatList.insertAdjacentHTML('beforeend', renderChatMsg(msg));
        ppBindLongPress();
        chatList.scrollTop = chatList.scrollHeight;
    }
    input.value = '';
    ppClearQuote();
    
    // 回复后粉丝互动增加（totalInteractions已在上方累加）
    var bonusFans = Math.floor(Math.random() * 50) + 10;
    // [FIX] 经纪人特质差异化：不同特质给不同加成
    if(d.manager){
        var mBonus = 1 + d.manager.bonus / 100;
        if(d.manager.trait === '人脉广') mBonus += 0.15; // 资源加成→涨粉更多
        if(d.manager.trait === '谈价高手') d.money = (d.money||0) + Math.floor(Math.random()*200); // 额外收入
        if(d.manager.trait === '危机公关') bonusFans = Math.max(bonusFans, 20); // 保底涨粉
        bonusFans = Math.floor(bonusFans * mBonus);
    }
    // [FIX] 随机给在线粉丝增加stats（likes/reposts/checkin）
    if(d.fanProfiles){
        var fanKeys = Object.keys(d.fanProfiles);
        if(fanKeys.length > 0){
            var rk = fanKeys[Math.floor(Math.random()*fanKeys.length)];
            var fp = d.fanProfiles[rk];
            if(fp && !fp.isBlackFan){
                fp.stats = fp.stats || {};
                fp.stats.likes = (fp.stats.likes||0) + 1;
                if(Math.random() < 0.3) fp.stats.reposts = (fp.stats.reposts||0) + 1;
                if(Math.random() < 0.2) fp.stats.checkin = (fp.stats.checkin||0) + 1;
                // [FIX] mood随互动变化
                var positiveMoods = ['开心','激动','期待'];
                if(Math.random() < 0.3) fp.mood = positiveMoods[Math.floor(Math.random()*positiveMoods.length)];
            }
        }
    }
    d.fans += bonusFans;
    d.tier = calcTier(d.fans);
    save();
    
    // 更新顶部粉丝数
    var fansEl = document.querySelector('.pp-nav-fans');
    if(fansEl) fansEl.innerHTML = '<i class="fas fa-heart"></i> ' + formatFans(d.fans);
    
    // ★ 标记用户已发过消息，后续定时器将优先播放API缓存回复
    _ppUserHasSentMsg = true;
    // 清除旧的API回复缓存，准备接收新的
    _ppApiReplyCache = [];
    _ppApiReplyCacheIdx = 0;
    _ppApiReplyPlaying = false;
    
    // 群聊回复：全部走API生成与用户消息相关的回复（10组×10条），无API时降级到预设
    if(window.API && API.chatCompletion){
        // 有API时：调用API生成10组×10条全部与用户消息相关的回复
        ppTryApiMixedReply(msg.text);
    } else {
        // 无API时：使用预设回复
        var reactions = ppQuotedMsg ? FAN_REACTIONS_TO_QUOTE : FAN_REACTIONS_TO_USER;
        ppTriggerFanReactions(reactions, 2 + Math.floor(Math.random()*2), true);
    }
};

// ====== 群聊预设回复防重复缓存 ======
var _ppRecentGroupReplies = [];
var _PP_GROUP_RECENT_MAX = 10;

// ====== 触发粉丝回应（带防重复） ======
function ppTriggerFanReactions(reactionPool, count, doReplace){
    var d = store.paopao;
    var chatList = document.getElementById('pp-chat-list');
    // 复制一份池子用于去重选择
    var poolCopy = reactionPool.slice();
    for(var i = 0; i < count; i++){
        (function(delay, idx){
            setTimeout(function(){
                if(bubbleSubPage !== 'groupChat') return;
                // 从去重后的池子中选择
                var available = poolCopy.filter(function(r){ return _ppRecentGroupReplies.indexOf(r) === -1; });
                if(available.length === 0){
                    _ppRecentGroupReplies = [];
                    available = poolCopy.slice();
                }
                var rawText = available[Math.floor(Math.random()*available.length)];
                // 记录已用
                _ppRecentGroupReplies.push(rawText);
                if(_ppRecentGroupReplies.length > _PP_GROUP_RECENT_MAX) _ppRecentGroupReplies.shift();
                
                var reactionMsg = {
                    name: ppGetFanName(),
                    text: doReplace ? ppReplaceTitle(rawText) : rawText,
                    time: Date.now(),
                    isMe: false
                };
                d.chatMessages.push(reactionMsg);
                if(chatList){
                    chatList.insertAdjacentHTML('beforeend', renderChatMsg(reactionMsg));
                    ppBindLongPress();
                    chatList.scrollTop = chatList.scrollHeight;
                }
            }, delay);
        })(800 + Math.random()*1500 + i * 1200, i);
    }
}

// ====== 调用API生成群聊回复（10组×10条，与用户消息相关） ======
var _ppApiReplyCache = []; // 缓存API生成的回复组
var _ppApiReplyCacheIdx = 0; // 当前使用到哪一组

function ppTryApiMixedReply(userText){
    if(!window.API || !API.chatCompletion) return;
    _currentApiScene = 'paopao';
    var d = store.paopao;
    
    // 构建最近群聊上下文（精简，只取最近6条）
    var recentMsgs = d.chatMessages.slice(-6).map(function(m){
        return (m.isMe ? '明星' : (m.name||'粉丝')) + ': ' + (m.text||'');
    }).join('\n');
    
    var titleWord = ppGetTitle();
    // 生成10组×10条评论的prompt（大批量API响应）
    var sysPrompt = '模拟粉丝群。明星「' + (d.stageName||titleWord) + '」（称呼"' + titleWord + '"）刚说了话。' +
        '你需要生成10组粉丝群聊回复，每组10条消息。所有消息都必须与明星刚说的内容直接相关。' +
        '\n\n格式要求：' +
        '\n- 用"---"分隔每一组' +
        '\n- 每行格式：粉丝名|回复内容' +
        '\n- 每组10条消息' +
        '\n\n内容要求：' +
        '\n1. 所有回复必须围绕明星刚说的话展开，针对明星说的具体内容做出反应' +
        '\n2. 每组有不同的讨论角度和氛围——有的组热烈欢呼，有的组认真讨论，有的组搞笑接梗，有的组感动催泪' +
        '\n3. 粉丝间要互相接话、聊起来，不全都直接回复明星' +
        '\n4. 每条3-25字，口语化，风格各异（有人爱用emoji，有人纯文字，有人爱打省略号）' +
        '\n5. 同一粉丝可在不同条出现多次（像真实群聊那样一个人连发几条）' +
        '\n6. 偶尔有人打岔——比如"啊我外卖到了先走了"，但大部分消息要与明星说的话相关' +
        '\n7. 像真人群聊，自然、有情感、有个性差异';
    
    API.chatCompletion([
        {role:'system', content: sysPrompt},
        {role:'user', content: '明星刚刚说的话：「' + userText + '」\n\n最近群聊上下文：\n' + recentMsgs + '\n\n请根据明星说的「' + userText + '」生成粉丝群聊回复：'}
    ], 0.95, true).then(function(data){
        if(!data || !data.choices || !data.choices[0]) return;
        var reply = (data.choices[0].message.content || '').trim();
        
        // 解析10组消息
        var groups = reply.split('---').filter(function(g){ return g.trim(); });
        
        // 将每组解析为消息数组
        var parsedGroups = [];
        groups.forEach(function(group){
            var lines = group.trim().split('\n').filter(function(l){ return l.trim(); });
            var msgs = [];
            lines.forEach(function(line){
                var parts = line.split('|');
                var fanName, fanText;
                // [FIX-粉丝名字错乱] 如果没有 | 分隔符，整行就是消息文本
                if(parts.length >= 2 && parts[1].trim()){
                    fanName = parts[0].trim();
                    fanText = parts.slice(1).join('|').trim();
                } else {
                    fanName = ppGetFanName();
                    fanText = line.trim();
                }
                fanName = fanName.replace(/^\d+[\.\\)、]\s*/,'').replace(/^粉丝\s*/,'');
                fanText = fanText.replace(/^[:：]\s*/,'');
                // [FIX-粉丝名字错乱] 名字过长说明格式错误
                if(fanName.length > 10) { fanText = fanName; fanName = ppGetFanName(); }
                if(!fanText || fanText.length < 2 || fanText.length > 60) return;
                msgs.push({name: fanName, text: fanText});
            });
            if(msgs.length > 0) parsedGroups.push(msgs);
        });
        
        if(parsedGroups.length === 0) return;
        
        // 缓存所有组，先播放第一组
        _ppApiReplyCache = parsedGroups;
        _ppApiReplyCacheIdx = 0;
        
        // 立即播放第一组
        ppPlayApiReplyGroup(0);
        
    }).catch(function(){
        // API失败时静默降级，触发预设回复
        ppTriggerFanReactions(FAN_REACTIONS_TO_USER, 3, true);
    });
}

// ====== 播放一组API生成的回复（带播放状态管理+去重） ======
function ppPlayApiReplyGroup(groupIdx){
    if(!_ppApiReplyCache || groupIdx >= _ppApiReplyCache.length) return;
    _ppApiReplyPlaying = true;
    var d = store.paopao;
    var group = _ppApiReplyCache[groupIdx];
    var chatList = document.getElementById('pp-chat-list');
    var totalMsgs = group.length;
    var playedCount = 0;
    
    // [FIX-重复消息] 收集最近20条消息用于去重
    var recentTexts = d.chatMessages.slice(-20).map(function(m){ return (m.text||'').trim().toLowerCase(); });
    
    group.forEach(function(msgData, idx){
        setTimeout(function(){
            if(bubbleSubPage !== 'groupChat'){
                _ppApiReplyPlaying = false;
                return;
            }
            // [FIX-重复消息] 跳过与最近消息重复的内容
            var normalizedText = (msgData.text||'').trim().toLowerCase();
            if(recentTexts.indexOf(normalizedText) !== -1){
                playedCount++;
                if(playedCount >= totalMsgs) _ppApiReplyPlaying = false;
                return;
            }
            recentTexts.push(normalizedText);
            var aiMsg = {
                name: msgData.name || ppGetFanName(),
                text: msgData.text,
                time: Date.now(),
                isMe: false
            };
            d.chatMessages.push(aiMsg);
            if(d.chatMessages.length > 200) d.chatMessages = d.chatMessages.slice(-150);
            if(chatList){
                chatList.insertAdjacentHTML('beforeend', renderChatMsg(aiMsg));
                ppBindLongPress();
                chatList.scrollTop = chatList.scrollHeight;
            }
            playedCount++;
            // 当这一组全部播完，标记为非播放状态
            if(playedCount >= totalMsgs){
                _ppApiReplyPlaying = false;
            }
        }, 600 + idx * 800 + Math.random() * 500);
    });
}

// ====== 获取下一组缓存的API回复（由定时器调用） ======
function ppPlayNextCachedGroup(){
    if(_ppApiReplyPlaying) return false; // 上一组还在播放中
    _ppApiReplyCacheIdx++;
    if(_ppApiReplyCacheIdx < _ppApiReplyCache.length){
        ppPlayApiReplyGroup(_ppApiReplyCacheIdx);
        return true;
    }
    // 所有组播完，重置用户发消息标记（回到预设模式，等待用户下次发消息）
    _ppUserHasSentMsg = false;
    return false;
}

// ====== 发送伪装图片（和微信一样：输入描述 + 从本地选择真实图片） ======
window.ppSendFakeImage = function(){
    var d = store.paopao;
    
    // 弹出输入描述的弹窗
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.innerHTML = '<div class="pp-settings-modal">' +
        '<div class="pp-modal-title">📷 伪装图片</div>' +
        '<div class="pp-modal-subtitle">输入图片描述文字（对方看到的），然后选择本地真实图片</div>' +
        '<div class="pp-modal-field">' +
            '<input type="text" class="pp-modal-input" id="pp-fake-img-desc" placeholder="例如：今天的自拍、下午茶、风景照..." style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:15px;outline:none;box-sizing:border-box;">' +
        '</div>' +
        '<div class="pp-modal-actions">' +
            '<button class="pp-modal-btn pp-modal-btn-cancel" id="pp-fake-img-cancel">取消</button>' +
            '<button class="pp-modal-btn pp-modal-btn-confirm" id="pp-fake-img-select">选择图片</button>' +
        '</div>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
    
    document.getElementById('pp-fake-img-cancel').onclick = function(){ overlay.remove(); };
    document.getElementById('pp-fake-img-select').onclick = function(){
        var descInput = document.getElementById('pp-fake-img-desc');
        var desc = descInput ? descInput.value.trim() : '';
        if(!desc){
            descInput.style.borderColor = '#e74c3c';
            descInput.placeholder = '请输入图片描述！';
            return;
        }
        
        // 选择本地图片
        var fi = document.createElement('input');
        fi.type = 'file';
        fi.accept = 'image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico';
        fi.onchange = function(){
            if(!fi.files || !fi.files[0]) return;
            var reader = new FileReader();
            reader.onload = function(e){
                overlay.remove();
                
                var msg = {
                    text: '📷 [' + desc + ']',
                    mediaType: 'fake_image',
                    fakeImgDesc: desc,
                    imageUrl: e.target.result, // 真实图片数据
                    time: Date.now(),
                    isMe: true
                };
                if(ppQuotedMsg){
                    msg.quotedName = ppQuotedMsg.name;
                    msg.quotedText = ppQuotedMsg.text;
                }
                d.chatMessages.push(msg);
                d.lastUserMsgTime = Date.now();
                save();
                
                var chatList = document.getElementById('pp-chat-list');
                if(chatList){
                    chatList.insertAdjacentHTML('beforeend', renderChatMsg(msg));
                    ppBindLongPress();
                    chatList.scrollTop = chatList.scrollHeight;
                }
                ppClearQuote();
                
                ppTriggerFanReactions(FAN_REACTIONS_TO_FAKE_IMG, 2, true);
            };
            reader.readAsDataURL(fi.files[0]);
        };
        fi.click();
    };
    
    setTimeout(function(){
        var descInput = document.getElementById('pp-fake-img-desc');
        if(descInput) descInput.focus();
    }, 100);
};

// ====== 发送真实图片 ======
window.ppSendRealImage = function(){
    // 创建文件选择器
    var fi = document.createElement('input');
    fi.type = 'file';
    fi.accept = 'image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico';
    fi.onchange = function(){
        if(!fi.files || !fi.files[0]) return;
        var reader = new FileReader();
        reader.onload = function(e){
            var d = store.paopao;
            var msg = {
                text: '[图片]',
                mediaType: 'real_image',
                imageUrl: e.target.result,
                time: Date.now(),
                isMe: true
            };
            if(ppQuotedMsg){
                msg.quotedName = ppQuotedMsg.name;
                msg.quotedText = ppQuotedMsg.text;
            }
            d.chatMessages.push(msg);
            d.lastUserMsgTime = Date.now();
            save();
            
            var chatList = document.getElementById('pp-chat-list');
            if(chatList){
                chatList.insertAdjacentHTML('beforeend', renderChatMsg(msg));
                ppBindLongPress();
                chatList.scrollTop = chatList.scrollHeight;
            }
            ppClearQuote();
            
            ppTriggerFanReactions(FAN_REACTIONS_TO_REAL_IMG, 2, true);
        };
        reader.readAsDataURL(fi.files[0]);
    };
    fi.click();
};

// ====== 发送伪装语音（和微信一样：输入文字转语音） ======
window.ppSendFakeVoice = function(){
    var d = store.paopao;
    
    // 弹出输入文字的弹窗
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.innerHTML = '<div class="pp-settings-modal">' +
        '<div class="pp-modal-title">🎤 伪装语音</div>' +
        '<div class="pp-modal-subtitle">输入文字内容，将自动转换为语音消息</div>' +
        '<div class="pp-modal-field">' +
            '<textarea class="pp-modal-textarea" id="pp-voice-text-input" placeholder="输入要转成语音的文字..." rows="3" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:15px;outline:none;box-sizing:border-box;resize:none;font-family:inherit;"></textarea>' +
        '</div>' +
        '<div class="pp-modal-actions">' +
            '<button class="pp-modal-btn pp-modal-btn-cancel" id="pp-voice-cancel">取消</button>' +
            '<button class="pp-modal-btn pp-modal-btn-confirm" id="pp-voice-send">发送语音</button>' +
        '</div>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
    
    document.getElementById('pp-voice-cancel').onclick = function(){ overlay.remove(); };
    document.getElementById('pp-voice-send').onclick = function(){
        var textInput = document.getElementById('pp-voice-text-input');
        var text = textInput ? textInput.value.trim() : '';
        if(!text){
            textInput.style.borderColor = '#e74c3c';
            textInput.placeholder = '请输入语音文字内容！';
            return;
        }
        overlay.remove();
        
        // 计算语音时长（和微信一样：每3个字约1秒）
        var sec = Math.min(60, Math.max(1, Math.ceil(text.length / 3)));
        
        var msg = {
            text: '🎤 [语音 ' + sec + '″]',
            mediaType: 'voice',
            voiceText: text,
            voiceDuration: sec + '″',
            time: Date.now(),
            isMe: true
        };
        if(ppQuotedMsg){
            msg.quotedName = ppQuotedMsg.name;
            msg.quotedText = ppQuotedMsg.text;
        }
        d.chatMessages.push(msg);
        d.lastUserMsgTime = Date.now();
        save();
        
        var chatList = document.getElementById('pp-chat-list');
        if(chatList){
            chatList.insertAdjacentHTML('beforeend', renderChatMsg(msg));
            ppBindLongPress();
            chatList.scrollTop = chatList.scrollHeight;
        }
        ppClearQuote();
        
        ppTriggerFanReactions(FAN_REACTIONS_TO_VOICE, 2, true);
    };
    
    setTimeout(function(){
        var textInput = document.getElementById('pp-voice-text-input');
        if(textInput) textInput.focus();
    }, 100);
};

// ====== 播放伪装语音（调用TTS API） ======
window.ppPlayVoice = function(voiceId, text){
    var voiceEl = document.getElementById(voiceId);
    if(!voiceEl) return;
    
    // 如果正在播放，停止
    if(voiceEl.classList.contains('pp-voice-playing')){
        var audio = document.getElementById('pp-tts-audio');
        if(audio){ audio.pause(); audio.currentTime = 0; }
        voiceEl.classList.remove('pp-voice-playing');
        return;
    }
    
    // 停止其他正在播放的语音
    document.querySelectorAll('.pp-voice-playing').forEach(function(el){ el.classList.remove('pp-voice-playing'); });
    
    voiceEl.classList.add('pp-voice-playing');
    
    // 尝试使用TTS API
    if(window.API && API.textToSpeech){
        API.textToSpeech(text, 'male-qn-qingse', 'zh').then(function(result){
            if(result === '__BROWSER_TTS_DONE__'){
                voiceEl.classList.remove('pp-voice-playing');
                return;
            }
            if(!result) {
                voiceEl.classList.remove('pp-voice-playing');
                return;
            }
            var url = URL.createObjectURL(result);
            var audio = document.getElementById('pp-tts-audio');
            if(!audio){
                audio = document.createElement('audio');
                audio.id = 'pp-tts-audio';
                document.body.appendChild(audio);
            }
            audio.src = url;
            audio.onended = function(){
                voiceEl.classList.remove('pp-voice-playing');
            };
            audio.onerror = function(){
                voiceEl.classList.remove('pp-voice-playing');
            };
            audio.play().catch(function(){
                voiceEl.classList.remove('pp-voice-playing');
            });
        }).catch(function(){
            voiceEl.classList.remove('pp-voice-playing');
            // 降级使用浏览器内置语音
            ppBrowserTTS(text, voiceEl);
        });
    } else {
        // 没有API时使用浏览器内置语音
        ppBrowserTTS(text, voiceEl);
    }
};

// ====== 浏览器内置语音合成降级 ======
function ppBrowserTTS(text, voiceEl){
    if('speechSynthesis' in window){
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 1.0;
        utterance.onend = function(){ voiceEl.classList.remove('pp-voice-playing'); };
        utterance.onerror = function(){ voiceEl.classList.remove('pp-voice-playing'); };
        speechSynthesis.speak(utterance);
    } else {
        voiceEl.classList.remove('pp-voice-playing');
    }
}

// ====== 发送表情包 ======
window.ppSendSticker = function(){
    var d = store.paopao;
    if(!d.mountedStickerCateIds || d.mountedStickerCateIds.length === 0){
        showPpResult('💡 提示', '还没有挂载表情包哦~\n请在消息首页右上角的😊按钮中挂载微信表情包图库', false);
        return;
    }
    
    // 显示/隐藏表情包选择面板（微信风格）
    ppToggleStickerPanelWechat();
};

// ====== 微信风格表情包面板 ======
var _ppStickerPanelVisible = false;
var _ppCurrentStickerCateIdx = 0;

function ppToggleStickerPanelWechat(){
    var oldPanel = document.querySelector('.pp-sticker-panel-wechat');
    if(oldPanel){
        oldPanel.remove();
        _ppStickerPanelVisible = false;
        return;
    }
    _ppStickerPanelVisible = true;
    ppBuildStickerPanelWechat();
}

function ppBuildStickerPanelWechat(){
    var d = store.paopao;
    var allCates = (store.stickerCategories || []).filter(function(sc){
        return (d.mountedStickerCateIds || []).indexOf(sc.id) !== -1;
    });
    
    if(allCates.length === 0){
        showPpResult('💡 提示', '挂载的表情包分类中没有表情~', false);
        _ppStickerPanelVisible = false;
        return;
    }
    
    // 确保当前选中的分类索引有效
    if(_ppCurrentStickerCateIdx >= allCates.length) _ppCurrentStickerCateIdx = 0;
    
    // 构建所有分类的表情包数据（带全局索引）
    var globalStickers = [];
    var cateStartIndices = [];
    allCates.forEach(function(cate){
        cateStartIndices.push(globalStickers.length);
        (cate.stickers || []).forEach(function(s){
            globalStickers.push(s);
        });
    });
    window._ppStickerList = globalStickers;
    
    // 构建分类tab栏（可横向滚动）
    var tabsHtml = allCates.map(function(cate, idx){
        var firstSticker = (cate.stickers && cate.stickers.length > 0) ? cate.stickers[0] : null;
        var tabPreview = '';
        if(firstSticker){
            if(firstSticker.type === 'emoji'){
                tabPreview = '<span class="pp-sticker-tab-emoji">' + firstSticker.url + '</span>';
            } else {
                tabPreview = '<img class="pp-sticker-tab-img" src="' + escapeHtml(firstSticker.url) + '">';
            }
        } else {
            tabPreview = '<i class="far fa-smile"></i>';
        }
        return '<div class="pp-sticker-tab' + (idx === _ppCurrentStickerCateIdx ? ' active' : '') + '" onclick="ppSwitchStickerCate(' + idx + ')" title="' + escapeHtml(cate.name) + '">' + tabPreview + '</div>';
    }).join('');
    
    // 构建所有分类的表情包内容（每个分类一个section，全部放在滚动区域中）
    var allSectionsHtml = '';
    allCates.forEach(function(cate, cateIdx){
        var stickersInCate = cate.stickers || [];
        var startIdx = cateStartIndices[cateIdx];
        
        var gridHtml = stickersInCate.map(function(s, localIdx){
            var globalIdx = startIdx + localIdx;
            if(s.type === 'emoji'){
                return '<div class="pp-sticker-item" onclick="ppSelectSticker(' + globalIdx + ')">' + s.url + '</div>';
            } else {
                return '<div class="pp-sticker-item" onclick="ppSelectSticker(' + globalIdx + ')"><img src="' + escapeHtml(s.url) + '"></div>';
            }
        }).join('');
        
        allSectionsHtml += '<div class="pp-sticker-section" data-cate-idx="' + cateIdx + '" id="pp-sticker-section-' + cateIdx + '">' +
            '<div class="pp-sticker-cate-name">' + escapeHtml(cate.name) + ' (' + stickersInCate.length + ')</div>' +
            '<div class="pp-sticker-grid-wechat">' + gridHtml + '</div>' +
        '</div>';
    });
    
    // 移除旧面板
    var oldPanel = document.querySelector('.pp-sticker-panel-wechat');
    if(oldPanel) oldPanel.remove();
    
    var panel = document.createElement('div');
    panel.className = 'pp-sticker-panel-wechat';
    
    panel.innerHTML =
        '<div class="pp-sticker-content-area" id="pp-sticker-content-area">' +
            allSectionsHtml +
        '</div>' +
        '<div class="pp-sticker-tabs-bar" id="pp-sticker-tabs-bar">' + tabsHtml + '</div>';
    
    // 插入到输入框区域的下方（而不是浮在上面）
    var inputArea = document.querySelector('.pp-chat-input-area');
    if(inputArea && inputArea.parentNode){
        inputArea.parentNode.insertBefore(panel, inputArea.nextSibling);
    } else {
        var ppApp = document.querySelector('.pp-bubble-page') || document.querySelector('.pp-app');
        if(ppApp) ppApp.appendChild(panel);
    }
    
    // 滚动到当前选中分类
    var targetSection = document.getElementById('pp-sticker-section-' + _ppCurrentStickerCateIdx);
    if(targetSection){
        var contentArea = document.getElementById('pp-sticker-content-area');
        if(contentArea){
            setTimeout(function(){
                targetSection.scrollIntoView({behavior: 'smooth', block: 'start'});
            }, 50);
        }
    }
    
    // 绑定滚动监听：滚动时自动高亮对应分类tab
    ppBindStickerScrollSync(panel, allCates.length);
}

// ====== 切换表情包分类（点击tab时滚动到对应section） ======
window.ppSwitchStickerCate = function(idx){
    _ppCurrentStickerCateIdx = idx;
    var targetSection = document.getElementById('pp-sticker-section-' + idx);
    var contentArea = document.getElementById('pp-sticker-content-area');
    if(targetSection && contentArea){
        // 暂时禁用滚动监听，避免滚动过程中tab频繁切换
        contentArea._ppScrollSyncDisabled = true;
        targetSection.scrollIntoView({behavior: 'smooth', block: 'start'});
        setTimeout(function(){
            contentArea._ppScrollSyncDisabled = false;
        }, 500);
    }
    // 更新tab高亮
    var tabs = document.querySelectorAll('.pp-sticker-tab');
    tabs.forEach(function(tab, i){
        tab.classList.toggle('active', i === idx);
    });
    // 确保tab栏中当前tab可见
    var tabsBar = document.getElementById('pp-sticker-tabs-bar');
    var activeTab = tabs[idx];
    if(tabsBar && activeTab){
        var tabLeft = activeTab.offsetLeft;
        var tabWidth = activeTab.offsetWidth;
        var barWidth = tabsBar.offsetWidth;
        var scrollLeft = tabsBar.scrollLeft;
        if(tabLeft < scrollLeft){
            tabsBar.scrollTo({left: tabLeft - 10, behavior: 'smooth'});
        } else if(tabLeft + tabWidth > scrollLeft + barWidth){
            tabsBar.scrollTo({left: tabLeft + tabWidth - barWidth + 10, behavior: 'smooth'});
        }
    }
};

// ====== 滚动同步：上下滚动时自动高亮对应分类tab ======
function ppBindStickerScrollSync(panel, totalCates){
    var contentArea = panel.querySelector('.pp-sticker-content-area');
    if(!contentArea) return;
    
    contentArea.addEventListener('scroll', function(){
        if(contentArea._ppScrollSyncDisabled) return;
        
        // 找到当前可见的section
        var sections = contentArea.querySelectorAll('.pp-sticker-section');
        var scrollTop = contentArea.scrollTop;
        var currentIdx = 0;
        
        for(var i = 0; i < sections.length; i++){
            // 判断section顶部是否在可见区域内（加一点偏移量）
            if(sections[i].offsetTop - contentArea.offsetTop <= scrollTop + 60){
                currentIdx = i;
            }
        }
        
        if(currentIdx !== _ppCurrentStickerCateIdx){
            _ppCurrentStickerCateIdx = currentIdx;
            // 更新tab高亮
            var tabs = contentArea.parentNode.querySelectorAll('.pp-sticker-tab');
            tabs.forEach(function(tab, i){
                tab.classList.toggle('active', i === currentIdx);
            });
            // 确保tab栏中当前tab可见
            var tabsBar = contentArea.parentNode.querySelector('.pp-sticker-tabs-bar');
            var activeTab = tabs[currentIdx];
            if(tabsBar && activeTab){
                var tabLeft = activeTab.offsetLeft;
                var tabWidth = activeTab.offsetWidth;
                var barWidth = tabsBar.offsetWidth;
                var scrollLeftVal = tabsBar.scrollLeft;
                if(tabLeft < scrollLeftVal){
                    tabsBar.scrollTo({left: tabLeft - 10, behavior: 'smooth'});
                } else if(tabLeft + tabWidth > scrollLeftVal + barWidth){
                    tabsBar.scrollTo({left: tabLeft + tabWidth - barWidth + 10, behavior: 'smooth'});
                }
            }
        }
    }, {passive: true});
}

window.ppSelectSticker = function(idx){
    var s = window._ppStickerList ? window._ppStickerList[idx] : null;
    if(!s) return;
    
    var d = store.paopao;
    var msg = {
        text: '[表情]',
        mediaType: 'sticker',
        stickerUrl: s.url,
        time: Date.now(),
        isMe: true
    };
    if(ppQuotedMsg){
        msg.quotedName = ppQuotedMsg.name;
        msg.quotedText = ppQuotedMsg.text;
    }
    d.chatMessages.push(msg);
    d.lastUserMsgTime = Date.now();
    save();
    
    var chatList = document.getElementById('pp-chat-list');
    if(chatList){
        chatList.insertAdjacentHTML('beforeend', renderChatMsg(msg));
        ppBindLongPress();
        chatList.scrollTop = chatList.scrollHeight;
    }
    ppClearQuote();
    
    // 关闭面板（兼容新旧两种面板）
    var panel = document.querySelector('.pp-sticker-panel-wechat') || document.querySelector('.pp-sticker-panel');
    if(panel) panel.remove();
    _ppStickerPanelVisible = false;
    
    ppTriggerFanReactions(FAN_REACTIONS_TO_STICKER, 1 + Math.floor(Math.random()*2), true);
};

// ====== 显示大图 ======
window.ppShowBigImg = function(src){
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.style.cursor = 'pointer';
    // [FIX] 禁用背景滚动
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    overlay.onclick = function(){ overlay.remove(); document.body.style.overflow = prevOverflow; };
    // [FIX] 阻止触摸穿透滚动
    overlay.addEventListener('touchmove', function(e){ e.preventDefault(); }, {passive: false});
    overlay.innerHTML = '<img src="' + escapeHtml(src) + '" style="max-width:90%;max-height:85vh;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.3);">';
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
};

// ====== 联系人列表页面 ======
function ppRenderContactsList(area){
    var d = store.paopao;
    
    var contactCards = '';
    if(d.contacts.length === 0){
        contactCards = '<div class="pp-empty-hint">还没有联系人哦~<br>去设置中关联微信联系人吧！</div>';
    } else {
        d.contacts.forEach(function(c){
            // 从微信联系人获取头像
            var wxContact = (store.contacts || []).find(function(wx){ return wx.id === c.wxContactId; });
            var avatarHtml = wxContact && wxContact.avatar ?
                '<img src="' + escapeHtml(wxContact.avatar) + '" class="pp-contact-avatar pp-contact-avatar-wx">' :
                '<div class="pp-contact-avatar">' + (c.name||'?').charAt(0) + '</div>';
            
            contactCards += '<div class="pp-contact-card" onclick="ppOpenContactChat(\'' + c.id + '\')">' +
                avatarHtml +
                '<div class="pp-contact-info">' +
                    '<div class="pp-contact-name">' + escapeHtml(c.name) + '</div>' +
                    '<div class="pp-contact-relation">' + escapeHtml(c.relation || '粉丝') + '</div>' +
                '</div>' +
                '<i class="fas fa-chevron-right pp-contact-arrow"></i>' +
            '</div>';
        });
    }
    
    // 经纪人和助理卡片
    var staffCards = '';
    if(d.manager){
        staffCards += '<div class="pp-contact-card" onclick="ppOpenContactChat(\'manager\')">' +
            '<div class="pp-contact-avatar pp-avatar-manager">经</div>' +
            '<div class="pp-contact-info">' +
                '<div class="pp-contact-name">' + escapeHtml(d.manager.name) + '</div>' +
                '<div class="pp-contact-relation">经纪人 · ' + escapeHtml(d.manager.title) + '</div>' +
            '</div>' +
            '<i class="fas fa-chevron-right pp-contact-arrow"></i>' +
        '</div>';
    }
    if(d.assistant){
        staffCards += '<div class="pp-contact-card" onclick="ppOpenContactChat(\'assistant\')">' +
            '<div class="pp-contact-avatar pp-avatar-assistant">助</div>' +
            '<div class="pp-contact-info">' +
                '<div class="pp-contact-name">' + escapeHtml(d.assistant.name) + '</div>' +
                '<div class="pp-contact-relation">助理 · ' + escapeHtml(d.assistant.title) + '</div>' +
            '</div>' +
            '<i class="fas fa-chevron-right pp-contact-arrow"></i>' +
        '</div>';
    }
    
    area.innerHTML = '<div class="pp-contacts-page">' +
        '<div class="pp-contacts-header">' +
            '<div class="pp-contacts-back" onclick="ppBackToMsgList()"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="pp-contacts-title">联系人</div>' +
            '<div class="pp-contacts-settings" onclick="ppGoToSettings()"><i class="fas fa-cog"></i></div>' +
        '</div>' +
        (staffCards ? '<div class="pp-contacts-section-title">工作团队</div>' + staffCards : '') +
        '<div class="pp-contacts-section-title">我的粉丝</div>' +
        contactCards +
    '</div>';
}

// ====== 联系人聊天页面 ======
function ppRenderContactChat(area){
    var d = store.paopao;
    var contact = null;
    var chatKey = currentContactId;
    
    if(currentContactId === 'manager' && d.manager){
        contact = {name: d.manager.name, relation: '经纪人'};
    } else if(currentContactId === 'assistant' && d.assistant){
        contact = {name: d.assistant.name, relation: '助理'};
    } else {
        contact = d.contacts.find(function(c){ return c.id === currentContactId; });
    }
    
    if(!contact) { ppBackToMsgList(); return; }
    
    if(!d.contactChats[chatKey]) d.contactChats[chatKey] = [];
    var msgs = d.contactChats[chatKey];
    
    // 如果没有消息，生成初始消息
    if(msgs.length === 0){
        var greetIdx = Math.floor(Math.random() * CONTACT_GREETINGS.length);
        msgs.push({
            name: contact.name,
            text: CONTACT_GREETINGS[greetIdx],
            time: Date.now() - 60000,
            isMe: false
        });
        save();
    }
    
    // 获取微信联系人头像
    var wxContact = null;
    if(currentContactId !== 'manager' && currentContactId !== 'assistant'){
        var ppContact = d.contacts.find(function(c){ return c.id === currentContactId; });
        if(ppContact && ppContact.wxContactId){
            wxContact = (store.contacts || []).find(function(wx){ return wx.id === ppContact.wxContactId; });
        }
    }
    
    area.innerHTML = '<div class="pp-bubble-page">' +
        '<div class="pp-bubble-header pp-bubble-header-top">' +
            '<div class="pp-bubble-back" onclick="ppBackToMsgList()"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="pp-bubble-header-info">' +
                '<div class="pp-bubble-title">' + escapeHtml(contact.name) + '</div>' +
                '<div class="pp-bubble-subtitle">' + escapeHtml(contact.relation || '') + '</div>' +
            '</div>' +
            (currentContactId !== 'manager' && currentContactId !== 'assistant' ?
                '<div class="pp-bubble-detail-btn" onclick="ppShowContactDetail(\'' + currentContactId + '\')"><i class="fas fa-info-circle"></i></div>' : '') +
        '</div>' +
        '<div class="pp-chat-list" id="pp-contact-chat-list">' +
            msgs.map(function(msg){
                return renderContactChatMsg(msg, contact, wxContact);
            }).join('') +
        '</div>' +
        '<div class="pp-chat-input-area">' +
            '<input type="text" class="pp-chat-input" id="pp-contact-chat-input" placeholder="发消息给' + escapeHtml(contact.name) + '..." onkeydown="if(event.key===\'Enter\')ppSendContactReply()">' +
            '<button class="pp-chat-send-btn" onclick="ppSendContactReply()"><i class="fas fa-paper-plane"></i></button>' +
        '</div>' +
    '</div>';
    
    setTimeout(function(){
        var chatList = document.getElementById('pp-contact-chat-list');
        if(chatList) chatList.scrollTop = chatList.scrollHeight;
    }, 100);
}

function renderContactChatMsg(msg, contact, wxContact){
    if(msg.isMe){
        return '<div class="pp-chat-msg pp-chat-msg-me">' +
            '<div class="pp-chat-avatar-me">' + (store.paopao.stageName||'我').charAt(0) + '</div>' +
            '<div class="pp-chat-bubble-me">' + escapeHtml(msg.text) + '</div>' +
        '</div>';
    } else {
        var avatarHtml = wxContact && wxContact.avatar ?
            '<img src="' + escapeHtml(wxContact.avatar) + '" class="pp-chat-avatar-fan pp-chat-avatar-wx-img">' :
            '<div class="pp-chat-avatar-fan pp-avatar-dream">' + (msg.name||contact.name||'?').charAt(0) + '</div>';
        return '<div class="pp-chat-msg pp-chat-msg-fan">' +
            avatarHtml +
            '<div class="pp-chat-fan-info">' +
                '<div class="pp-chat-bubble-fan">' + escapeHtml(msg.text) + '</div>' +
            '</div>' +
        '</div>';
    }
}

// ====== 联系人发消息 ======
window.ppSendContactReply = function(){
    var input = document.getElementById('pp-contact-chat-input');
    if(!input || !input.value.trim()) return;
    
    var d = store.paopao;
    var chatKey = currentContactId;
    if(!d.contactChats[chatKey]) d.contactChats[chatKey] = [];
    var msgs = d.contactChats[chatKey];
    
    var contact = null;
    var ppContact = null;
    if(currentContactId === 'manager' && d.manager){
        contact = {name: d.manager.name, relation: '经纪人'};
    } else if(currentContactId === 'assistant' && d.assistant){
        contact = {name: d.assistant.name, relation: '助理'};
    } else {
        ppContact = d.contacts.find(function(c){ return c.id === currentContactId; });
        contact = ppContact;
    }
    if(!contact) return;
    
    var msg = { text: input.value.trim(), time: Date.now(), isMe: true };
    msgs.push(msg);
    
    // 获取微信联系人头像
    var wxContact = null;
    if(ppContact && ppContact.wxContactId){
        wxContact = (store.contacts || []).find(function(wx){ return wx.id === ppContact.wxContactId; });
    }
    
    var chatList = document.getElementById('pp-contact-chat-list');
    if(chatList){
        chatList.insertAdjacentHTML('beforeend', renderContactChatMsg(msg, contact, wxContact));
        chatList.scrollTop = chatList.scrollHeight;
    }
    input.value = '';
    save();
    
    // ====== 核心回复策略分流 ======
    // 有API时全部走API生成回复，确保回复与用户消息相关
    // 无API时降级到智能预设回复
    var isWxLinked = !!(ppContact && ppContact.wxContactId);
    
    if(isWxLinked && window.API && API.chatCompletion){
        // 微信关联联系人：调用API，使用微信人设
        ppApiWxContactReply(currentContactId, ppContact, msgs, chatList, wxContact);
    } else if(window.API && API.chatCompletion){
        // 非微信联系人：全部走API，确保回复与用户消息相关
        ppApiContactReply(currentContactId, ppContact || contact, msgs, chatList, wxContact);
    } else {
        // 无API时使用智能预设回复
        ppSmartPresetContactReply(currentContactId, contact, msgs, chatList, wxContact);
    }
};

// ====== 最近使用的预设回复缓存（防重复） ======
var _ppRecentPresetReplies = {};
var _PP_RECENT_REPLY_MAX = 8; // 记住最近8条，避免短期重复

function ppPickNonRepeatingReply(replies, contactId){
    if(!_ppRecentPresetReplies[contactId]) _ppRecentPresetReplies[contactId] = [];
    var recent = _ppRecentPresetReplies[contactId];
    // 过滤掉最近用过的
    var available = replies.filter(function(r){ return recent.indexOf(r) === -1; });
    // 如果全部用过了，清空历史重新来
    if(available.length === 0){
        _ppRecentPresetReplies[contactId] = [];
        available = replies.slice();
    }
    var chosen = available[Math.floor(Math.random() * available.length)];
    // 记录已用
    recent.push(chosen);
    if(recent.length > _PP_RECENT_REPLY_MAX) recent.shift();
    return chosen;
}

// ====== API驱动的微信关联联系人回复（严格使用微信人设） ======
function ppApiWxContactReply(contactId, contactObj, msgs, chatList, wxContact){
    _currentApiScene = 'paopao';
    var d = store.paopao;
    var contactName = contactObj.name || '联系人';
    var titleWord = ppGetTitle();
    
    // 获取微信联系人的完整人设
    var wxC = contactObj.wxContactId ? (store.contacts || []).find(function(wx){ return wx.id === contactObj.wxContactId; }) : null;
    var persona = wxC ? (wxC.persona || '') : '';
    var reasonText = contactObj.fanReason ? ('粉上明星的原因: ' + contactObj.fanReason) : '';
    
    // 获取最近聊天中TA用过的回复（用于去重）
    var recentReplies = msgs.slice(-6).filter(function(m){ return !m.isMe; }).map(function(m){ return m.text; });
    var dedupeInstruction = recentReplies.length > 0 ?
        '\n⚠️ 去重要求：你最近说过的话包括：' + recentReplies.map(function(r){ return '"' + r + '"'; }).join('、') + '。这次回复必须和这些内容完全不同，不能有相似的句式或意思。' : '';
    
    // 构建强化人设的系统提示
    var roleDesc = '【身份声明】你是「' + contactName + '」。' +
        (persona ? '\n【━━━ 人设核心（绝对优先）━━━】\n' + persona.substring(0, 800) + '\n【━━━ 人设核心结束 ━━━】\n' +
        '以上是你的完整人设。你的说话方式、性格、思维模式、用词习惯全部由人设决定。每次回复前先想：「这个角色会怎么说？」' : '') +
        (reasonText ? '\n' + reasonText : '') +
        '\n\n【场景】你是明星「' + (d.stageName||'用户') + '」的粉丝，正在和明星私聊。' +
        '\n【回复要求】' +
        '\n1. 严格按照人设的说话风格、性格特点来回复，保持角色一致性' +
        '\n2. 回复要自然真实，像真人聊天，有情感起伏' +
        '\n3. 简短回复（10-40字），纯文字输出' +
        '\n4. 回复必须与对方说的话相关，不能答非所问' +
        '\n5. 称呼明星时用"' + titleWord + '"' +
        '\n6. 体现粉丝对明星的喜爱，但方式要符合你的人设性格（活泼的就热情，内敛的就含蓄）' +
        dedupeInstruction;
    
    // 构建聊天历史
    var chatHistory = msgs.slice(-10).map(function(m){
        return (m.isMe ? '【明星' + (d.stageName||'') + '】' : '【' + contactName + '】') + ': ' + m.text;
    }).join('\n');
    
    API.chatCompletion([
        {role:'system', content: roleDesc},
        {role:'user', content: chatHistory + '\n\n请以「' + contactName + '」的身份回复：'}
    ], 0.85, true).then(function(data){
        if(!data || !data.choices || !data.choices[0]) {
            ppSmartPresetContactReply(contactId, contactObj, msgs, chatList, wxContact);
            return;
        }
        var replyText = (data.choices[0].message.content || '').trim();
        // 清理可能的格式前缀
        replyText = replyText.replace(/^【[^】]*】[:：]\s*/,'').replace(/^\[[^\]]*\][:：]?\s*/,'');
        if(!replyText) {
            ppSmartPresetContactReply(contactId, contactObj, msgs, chatList, wxContact);
            return;
        }
        
        setTimeout(function(){
            var replyMsg = {
                name: contactName,
                text: replyText,
                time: Date.now(),
                isMe: false
            };
            msgs.push(replyMsg);
            save();
            if(chatList){
                chatList.insertAdjacentHTML('beforeend', renderContactChatMsg(replyMsg, contactObj, wxContact));
                chatList.scrollTop = chatList.scrollHeight;
            }
        }, 800 + Math.random() * 1500);
    }).catch(function(){
        // API失败降级到智能预设
        ppSmartPresetContactReply(contactId, contactObj, msgs, chatList, wxContact);
    });
}

// ====== API驱动的非微信联系人回复（经纪人/助理/普通粉丝） ======
function ppApiContactReply(contactId, contactObj, msgs, chatList, wxContact){
    _currentApiScene = 'paopao';
    var d = store.paopao;
    var contactName = contactObj.name || '联系人';
    var roleDesc = '';
    var titleWord = ppGetTitle();
    
    // 获取最近聊天中TA用过的回复（用于去重）
    var recentReplies = msgs.slice(-6).filter(function(m){ return !m.isMe; }).map(function(m){ return m.text; });
    var dedupeInstruction = recentReplies.length > 0 ?
        '\n⚠️ 去重要求：你最近说过的话包括：' + recentReplies.map(function(r){ return '"' + r + '"'; }).join('、') + '。这次回复必须和这些内容完全不同，换一种表达方式和话题角度。' : '';
    
    // 获取用户最后一条消息用于上下文关联
    var lastUserMsg = '';
    for(var mi = msgs.length - 1; mi >= 0; mi--){
        if(msgs[mi].isMe){ lastUserMsg = msgs[mi].text; break; }
    }
    var contextHint = lastUserMsg ? '\n⚠️ 上下文要求：你的回复必须与对方说的"' + lastUserMsg.substring(0,50) + '"相关，不能答非所问。' : '';
    
    if(contactId === 'manager' && d.manager){
        contactName = d.manager.name;
        roleDesc = '你是明星（' + (d.stageName||'用户') + '）的经纪人。你叫' + d.manager.name + '，是一位' + (d.manager.title||'经纪人') + '。' +
            '你的特点是' + (d.manager.trait||'专业') + '（' + (d.manager.traitDesc||'') + '）。' +
            '请以专业但亲切的经纪人语气回复。要求：1.自然真实 2.简短回复（10-50字） 3.纯文字输出 4.体现专业性和对艺人的关心 5.偶尔可以提及工作安排、资源、行程等 6.回复必须与对方的话题相关' +
            contextHint + dedupeInstruction;
    } else if(contactId === 'assistant' && d.assistant){
        contactName = d.assistant.name;
        roleDesc = '你是明星（' + (d.stageName||'用户') + '）的专属助理。你叫' + d.assistant.name + '，是一位' + (d.assistant.title||'助理') + '。' +
            '你的特点是' + (d.assistant.trait||'细心') + '（' + (d.assistant.traitDesc||'') + '）。' +
            '请以贴心、活泼的助理语气回复。要求：1.自然真实 2.简短回复（10-50字） 3.纯文字输出 4.体现对艺人的照顾和关心 5.偶尔可以提及日程、准备事项等 6.回复必须与对方的话题相关' +
            contextHint + dedupeInstruction;
    } else {
        // 普通联系人（粉丝，无微信人设）
        var reasonText = contactObj.fanReason ? ('粉上用户的原因: ' + contactObj.fanReason) : '';
        roleDesc = '你是' + contactName + '，一个普通粉丝。' +
            (reasonText ? reasonText + '。' : '') +
            '你是明星（' + (d.stageName||'用户') + '）的粉丝。请以粉丝身份回复明星的消息。' +
            '要求：1.自然真实 2.简短回复（10-40字） 3.纯文字输出 4.体现粉丝对明星的喜爱和尊重 5.称呼明星时用"' + titleWord + '" 6.回复必须与对方的话题相关' +
            contextHint + dedupeInstruction;
    }
    
    // 构建聊天历史
    var chatHistory = msgs.slice(-10).map(function(m){
        return (m.isMe ? '【明星】' : '【' + contactName + '】') + ': ' + m.text;
    }).join('\n');
    
    API.chatCompletion([
        {role:'system', content: roleDesc},
        {role:'user', content: chatHistory + '\n\n请回复：'}
    ], 0.85, true).then(function(data){
        if(!data || !data.choices || !data.choices[0]) {
            ppSmartPresetContactReply(contactId, contactObj, msgs, chatList, wxContact);
            return;
        }
        var replyText = (data.choices[0].message.content || '').trim();
        // 清理可能的格式前缀
        replyText = replyText.replace(/^【[^】]*】[:：]\s*/,'').replace(/^\[[^\]]*\][:：]?\s*/,'');
        if(!replyText) {
            ppSmartPresetContactReply(contactId, contactObj, msgs, chatList, wxContact);
            return;
        }
        
        setTimeout(function(){
            var replyMsg = {
                name: contactName,
                text: replyText,
                time: Date.now(),
                isMe: false
            };
            msgs.push(replyMsg);
            save();
            if(chatList){
                chatList.insertAdjacentHTML('beforeend', renderContactChatMsg(replyMsg, contactObj, wxContact));
                chatList.scrollTop = chatList.scrollHeight;
            }
        }, 800 + Math.random() * 1500);
    }).catch(function(){
        // API失败降级到智能预设
        ppSmartPresetContactReply(contactId, contactObj, msgs, chatList, wxContact);
    });
}

// ====== 智能预设联系人回复（上下文关联+防重复） ======
function ppSmartPresetContactReply(contactId, contact, msgs, chatList, wxContact){
    setTimeout(function(){
        // 获取用户最后一条消息，用于上下文关联选择
        var lastUserMsg = '';
        for(var mi = msgs.length - 1; mi >= 0; mi--){
            if(msgs[mi].isMe){ lastUserMsg = msgs[mi].text; break; }
        }
        var lowerMsg = (lastUserMsg || '').toLowerCase();
        
        var replies = [];
        if(contactId === 'manager'){
            // 根据用户消息上下文选择相关的经纪人回复
            var managerBase = [
                '好的，我这就去安排！','放心交给我吧~','已经帮你谈好了，条件很不错哦！',
                '有个新的资源你看看感不感兴趣？','最近有几个品牌想找你合作','档期我帮你调整一下',
                '下周有个活动需要你出席~','合同条款我再帮你看看','这个机会很难得，建议接！',
                '我已经联系好对方了，明天开会讨论','收到！我马上去落实','你先休息，剩下的我来搞定',
                '这个项目的合同我看过了，没什么问题','有个品牌方点名要你','最近的热度不错，趁热打铁',
                '明天有个时尚活动的邀请，你要去吗？','已经帮你推掉了那个不合适的通告',
                '你的新作品反响很好，已经有新的合作找来了','我觉得这个剧本很适合你',
                '刚跟导演聊完，他对你印象非常好','今年的规划我重新调整了一下，你看看',
                '别担心，公关那边我已经处理好了','年底有几个颁奖典礼的邀请函到了'
            ];
            // 上下文相关回复
            if(lowerMsg.match(/累|辛苦|休息|困|睡/)) replies = ['你先好好休息，工作的事交给我','辛苦了！明天的行程我帮你调轻松一点','注意身体最重要，工作可以调整','给你调了个晚一点的通告时间'];
            else if(lowerMsg.match(/谢|感谢|辛苦你/)) replies = ['这是我应该做的~','都是我分内的事，不用客气','看到你越来越好就是最大的回报','一起加油！咱们团队最强'];
            else if(lowerMsg.match(/工作|通告|拍|戏|剧|项目/)) replies = ['这个项目我帮你仔细看过了，很适合你','已经在和对方谈了，条件不错','档期上没问题，我帮你安排','这个机会真的很不错，建议把握住'];
            else if(lowerMsg.match(/钱|收入|工资|报酬|费/)) replies = ['这个价格我再帮你谈谈','财务那边在处理了，放心','报酬已经打过来了，你查查看','这次的合同条件比上次好了不少'];
            else replies = managerBase;
        } else if(contactId === 'assistant'){
            var assistantBase = [
                '好的~已经记下了！','明天的行程已经安排好了','给你准备了你爱喝的奶茶🧋',
                '车已经在楼下等了~','今天的衣服已经搭配好了','通告我帮你确认一下',
                '已经帮你订好餐了~','化妆师已经在路上了','行李都帮你收拾好了！',
                '保温杯已经帮你装好热水了~','你的护肤品快用完了，我明天去买',
                '今天天气有点冷，给你多带了件外套','你的充电器我放包里了',
                '明天要早起哦，我设好闹钟了','给你买了你上次说想吃的零食',
                '下午的行程改了，我重新安排了车','你说想看的那本书我帮你买到了',
                '回酒店的路上帮你点了外卖，到酒店应该就到了','今天拍摄的花絮我都帮你存好了',
                '你的粉丝在楼下接机，要不要下去打个招呼？','防晒霜和墨镜都在包里',
                '帮你把这周所有的行程整理好了，发你看看','休息室已经准备好了，你先去补个妆'
            ];
            if(lowerMsg.match(/饿|吃|饭|餐|外卖|美食/)) replies = ['已经帮你点好外卖了，马上到~','你想吃什么？我去帮你买','附近有一家评分很高的餐厅，要不要试试？','给你买了你最爱的甜品🍰'];
            else if(lowerMsg.match(/累|困|睡|休息/)) replies = ['休息室已经准备好了，你先休息一下吧','给你调好了空调温度，先睡一会儿','明天的行程我帮你延后了半小时','帮你泡了一杯热茶放桌上了~'];
            else if(lowerMsg.match(/冷|热|天气|下雨/)) replies = ['给你多带了一件外套在包里~','伞已经帮你准备好了☂️','已经让司机把车内空调调好了','天气预报看了，记得做好防晒'];
            else if(lowerMsg.match(/行程|安排|明天|日程/)) replies = ['已经帮你整理好了，我发你看看','明天上午有一个采访，下午是拍摄','后面几天的行程我重新调整了，更合理了','帮你和几个不重要的约推迟了，留出休息时间'];
            else replies = assistantBase;
        } else {
            var t = ppGetTitle();
            var fanBase = [
                '嗯嗯~' + t + '说得对！','今天也辛苦了' + t + '！','你最近的作品我都看了~',
                '什么时候有空一起出去玩呀？','给你比个心❤️','你是我见过最好看的人！',
                '看到你发的消息好开心~','永远支持你！','好期待你的新作品',
                '我跟朋友说了你的事，他们都好羡慕我~',t + '加油！我们一直在',
                '你的每一个作品我都看了！','等你的新剧💕','一直关注着你哦',
                '哈哈哈好搞笑','嗯嗯我也这么觉得~','太有道理了！',
                '真的假的！那也太棒了吧','期待期待，好想看','你说的好有道理',
                t + '今天心情怎么样呀？','看到你就觉得开心','你永远是最棒的！',
                '收到收到！我都记住了','嘻嘻，' + t + '太可爱了','我一定去支持你的新作品！',
                '你说什么我都觉得有道理','好想见到' + t + '本人啊','刚才还在和朋友聊你呢',
                '你知道吗，我追你已经好久了','每天都在等你的更新','你今天也好好看啊！',
                '我永远支持你，不管发生什么','你开心就好~','真的好喜欢你啊' + t
            ];
            // 粉丝的上下文关联回复
            if(lowerMsg.match(/谢|感谢|谢谢/)) replies = ['不用谢~能和' + t + '聊天我就超开心了','这是我应该做的嘛','看到' + t + '回复我真的好激动！','嘿嘿被' + t + '感谢了好幸福~'];
            else if(lowerMsg.match(/累|辛苦|困|睡/)) replies = [t + '辛苦了！注意休息呀','心疼' + t + '💕 一定要好好休息','早点睡吧，明天又是新的一天','工作再忙也要注意身体呀' + t];
            else if(lowerMsg.match(/开心|高兴|快乐|哈哈|嘻嘻/)) replies = ['看到' + t + '开心我也好开心！','哈哈哈' + t + '的笑容太治愈了！','开心的' + t + '最好看了~','你开心就好！我们永远支持你'];
            else if(lowerMsg.match(/作品|新歌|新剧|电影|综艺|演唱会/)) replies = ['超级期待！到时候一定去支持','预告已经看了好多遍了！','一定会去看的，加油' + t + '！','已经等不及了！什么时候出呀'];
            else if(lowerMsg.match(/吃|饭|美食|甜/)) replies = ['看起来好好吃！' + t + '带我去呀','你也要好好吃饭呀~','这个安利了！下次我也去试试','给' + t + '也推荐一家我最近发现的宝藏店~'];
            else if(lowerMsg.match(/[?？]|吗|呢|什么|怎么|为什么|哪/)) replies = ['让我想想...嗯嗯确实是这样的','我觉得都可以，' + t + '决定就好~','哇这个问题好有趣，我觉得...','嗯嗯我也在想这个问题呢'];
            else replies = fanBase;
        }
        
        // 使用防重复选择
        var chosenText = ppPickNonRepeatingReply(replies, contactId);
        
        var replyMsg = {
            name: contact.name,
            text: chosenText,
            time: Date.now(),
            isMe: false
        };
        msgs.push(replyMsg);
        save();
        if(chatList){
            chatList.insertAdjacentHTML('beforeend', renderContactChatMsg(replyMsg, contact, wxContact));
            chatList.scrollTop = chatList.scrollHeight;
        }
    }, 1000 + Math.random()*2000);
}

// ====== 联系人详情 ======
window.ppShowContactDetail = function(contactId){
    var d = store.paopao;
    var contact = d.contacts.find(function(c){ return c.id === contactId; });
    if(!contact) return;
    
    var wxContact = contact.wxContactId ? (store.contacts || []).find(function(wx){ return wx.id === contact.wxContactId; }) : null;
    var avatarHtml = wxContact && wxContact.avatar ?
        '<img src="' + escapeHtml(wxContact.avatar) + '" class="pp-detail-avatar pp-detail-avatar-wx">' :
        '<div class="pp-detail-avatar">' + (contact.name||'?').charAt(0) + '</div>';
    
    var isSpecialCare = (d.specialCareIds || []).indexOf(contactId) >= 0;
    var isAdmin = (d.adminIds || []).indexOf(contactId) >= 0;
    
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.innerHTML = '<div class="pp-contact-detail-box">' +
        '<div class="pp-detail-close" onclick="this.closest(\'.pp-result-overlay\').remove()"><i class="fas fa-times"></i></div>' +
        avatarHtml +
        '<div class="pp-detail-name">' + escapeHtml(contact.name) +
            (isSpecialCare ? ' <span class="pp-special-care-badge">💖 特别关心</span>' : '') +
            (isAdmin ? ' <span class="pp-admin-badge">🛡️ 管理员</span>' : '') +
        '</div>' +
        '<div class="pp-detail-relation">' + escapeHtml(contact.relation || '粉丝') + '</div>' +
        (contact.fanReason ?
            '<div class="pp-detail-story-section">' +
                '<div class="pp-detail-story-title"><i class="fas fa-heart"></i> 粉上原因</div>' +
                '<div class="pp-detail-story-text">' + escapeHtml(contact.fanReason) + '</div>' +
            '</div>' : '') +
        // 特别关心和管理员按钮
        '<div class="pp-detail-toggles">' +
            '<div class="pp-detail-toggle ' + (isSpecialCare ? 'active' : '') + '" onclick="ppToggleSpecialCare(\'' + contactId + '\');this.closest(\'.pp-result-overlay\').remove()" style="pointer-events:auto;">' +
                '<i class="fas fa-star"></i> ' + (isSpecialCare ? '取消特别关心' : '设为特别关心') +
            '</div>' +
            '<div class="pp-detail-toggle ' + (isAdmin ? 'active' : '') + '" onclick="ppToggleAdmin(\'' + contactId + '\');this.closest(\'.pp-result-overlay\').remove()" style="pointer-events:auto;">' +
                '<i class="fas fa-shield-alt"></i> ' + (isAdmin ? '取消管理员' : '设为管理员') +
            '</div>' +
        '</div>' +
        '<div class="pp-detail-actions">' +
            '<button class="pp-detail-btn" onclick="ppEditFanReason(\'' + contactId + '\');this.closest(\'.pp-result-overlay\').remove()" style="pointer-events:auto;"><i class="fas fa-pen"></i> 编辑原因</button>' +
            '<button class="pp-detail-btn pp-detail-btn-danger" onclick="this.closest(\'.pp-result-overlay\').remove();ppDeleteContact(\'' + contactId + '\')" style="pointer-events:auto;"><i class="fas fa-trash"></i> 删除</button>' +
        '</div>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
};

// ====== 特别关心切换 ======
window.ppToggleSpecialCare = function(contactId){
    var d = store.paopao;
    if(!d.specialCareIds) d.specialCareIds = [];
    var idx = d.specialCareIds.indexOf(contactId);
    if(idx >= 0){
        d.specialCareIds.splice(idx, 1);
        showPpResult('💔 已取消', '已取消特别关心', true);
    } else {
        d.specialCareIds.push(contactId);
        showPpResult('💖 已设置', '已设为特别关心，TA的消息将置顶显示', true);
    }
    save();
    ppRenderTab();
};

// ====== 管理员切换 ======
window.ppToggleAdmin = function(contactId){
    var d = store.paopao;
    if(!d.adminIds) d.adminIds = [];
    var idx = d.adminIds.indexOf(contactId);
    if(idx >= 0){
        d.adminIds.splice(idx, 1);
        showPpResult('🛡️ 已取消', '已取消管理员权限', true);
    } else {
        d.adminIds.push(contactId);
        showPpResult('🛡️ 已设置', '已设为粉丝群管理员，TA将帮你管理粉丝群', true);
    }
    save();
    ppRenderTab();
};

// ====== 编辑粉上原因 ======
window.ppEditFanReason = function(contactId){
    var d = store.paopao;
    var contact = d.contacts.find(function(c){ return c.id === contactId; });
    if(!contact) return;
    
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.innerHTML = '<div class="pp-settings-modal">' +
        '<div class="pp-modal-title">编辑 ' + escapeHtml(contact.name) + ' 的粉上原因</div>' +
        '<div class="pp-modal-subtitle">描述TA为什么成为你的粉丝~</div>' +
        '<textarea class="pp-modal-textarea" id="pp-reason-input" placeholder="例如：在综艺节目中看到了我的才艺表演，被圈粉了...">' + escapeHtml(contact.fanReason || '') + '</textarea>' +
        '<div class="pp-modal-actions">' +
            '<button class="pp-modal-btn pp-modal-btn-cancel" onclick="this.closest(\'.pp-result-overlay\').remove()">取消</button>' +
            '<button class="pp-modal-btn pp-modal-btn-confirm" onclick="ppSaveFanReason(\'' + contactId + '\')">保存</button>' +
        '</div>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
};

window.ppSaveFanReason = function(contactId){
    var d = store.paopao;
    var contact = d.contacts.find(function(c){ return c.id === contactId; });
    if(!contact) return;
    var input = document.getElementById('pp-reason-input');
    if(input) contact.fanReason = input.value.trim();
    save();
    var overlay = input ? input.closest('.pp-result-overlay') : null;
    if(overlay) overlay.remove();
    showPpResult('✅ 保存成功', contact.name + '的粉上原因已更新！', true);
};

// ====== 删除联系人 ======
window.ppDeleteContact = function(contactId){
    var d = store.paopao;
    var contact = d.contacts.find(function(c){ return c.id === contactId; });
    var contactName = contact ? contact.name : '这位联系人';
    ppConfirmDialog('⚠️ 确认删除', '确定要删除 ' + escapeHtml(contactName) + ' 吗？删除后聊天记录也会清空。', function(){
        d.contacts = d.contacts.filter(function(c){ return c.id !== contactId; });
        delete d.contactChats[contactId];
        // [FIX] 级联清理：特别关心、置顶、粉丝档案、防重复缓存
        if(d.specialCareIds) d.specialCareIds = d.specialCareIds.filter(function(id){ return id !== contactId; });
        if(d.pinnedIds) d.pinnedIds = d.pinnedIds.filter(function(id){ return id !== contactId; });
        if(d.fanProfiles && contact && contact.name) delete d.fanProfiles[contact.name];
        if(_ppRecentPresetReplies) delete _ppRecentPresetReplies[contactId];
        save();
        ppBackToMsgList();
        showPpResult('✅ 已删除', contactName + ' 已从联系人列表中移除', true);
    });
};

// ====== 设置页面 ======
function ppRenderSettings(area){
    var d = store.paopao;
    
    // 工作模式显示
    var workModeText = '未选择';
    if(d.workMode === 'solo') workModeText = '🏢 个人工作室';
    else if(d.workMode === 'company') workModeText = '🏙️ 签约公司' + (d.companyName ? ' · ' + d.companyName : '');
    
    // 经纪人信息
    var managerInfo = d.manager ? 
        '<div class="pp-setting-staff-card">' +
            '<div class="pp-staff-avatar">经</div>' +
            '<div class="pp-staff-info">' +
                '<div class="pp-staff-name">' + escapeHtml(d.manager.name) + '</div>' +
                '<div class="pp-staff-title">' + escapeHtml(d.manager.title) + '</div>' +
                '<div class="pp-staff-trait">' + escapeHtml(d.manager.trait) + ' · ' + escapeHtml(d.manager.traitDesc) + '</div>' +
                '<div class="pp-staff-bonus">加成：涨粉效率 +' + d.manager.bonus + '%</div>' +
            '</div>' +
            '<div class="pp-staff-fire" onclick="event.stopPropagation();ppFireStaff(\'manager\')"><i class="fas fa-times-circle"></i></div>' +
        '</div>' :
        '<div class="pp-setting-item pp-setting-clickable" onclick="ppPickManager()">' +
            '<span><i class="fas fa-user-tie"></i> 选择经纪人</span>' +
            '<i class="fas fa-chevron-right"></i>' +
        '</div>';
    
    // 助理信息
    var assistantInfo = d.assistant ?
        '<div class="pp-setting-staff-card">' +
            '<div class="pp-staff-avatar pp-staff-avatar-asst">助</div>' +
            '<div class="pp-staff-info">' +
                '<div class="pp-staff-name">' + escapeHtml(d.assistant.name) + '</div>' +
                '<div class="pp-staff-title">' + escapeHtml(d.assistant.title) + '</div>' +
                '<div class="pp-staff-trait">' + escapeHtml(d.assistant.trait) + ' · ' + escapeHtml(d.assistant.traitDesc) + '</div>' +
                '<div class="pp-staff-bonus">加成：互动效率 +' + d.assistant.bonus + '%</div>' +
            '</div>' +
            '<div class="pp-staff-fire" onclick="event.stopPropagation();ppFireStaff(\'assistant\')"><i class="fas fa-times-circle"></i></div>' +
        '</div>' :
        '<div class="pp-setting-item pp-setting-clickable" onclick="ppPickAssistant()">' +
            '<span><i class="fas fa-user-check"></i> 选择助理</span>' +
            '<i class="fas fa-chevron-right"></i>' +
        '</div>';
    
    // 已关联的联系人列表
    var linkedContactsHtml = '';
    if(d.contacts.length > 0){
        linkedContactsHtml = d.contacts.map(function(c){
            return '<div class="pp-setting-item">' +
                '<span>' + escapeHtml(c.name) + (c.fanReason ? ' · ' + escapeHtml(c.fanReason.substring(0,15)) + '...' : '') + '</span>' +
                '<span class="pp-setting-value" style="cursor:pointer;color:#c75050;padding:8px 12px;pointer-events:auto;" onclick="event.stopPropagation();ppDeleteContact(\'' + c.id + '\')"><i class="fas fa-trash"></i> 删除</span>' +
            '</div>';
        }).join('');
    }
    
    area.innerHTML = '<div class="pp-settings-page">' +
        '<div class="pp-contacts-header">' +
            '<div class="pp-contacts-back" onclick="ppBackToMsgList()"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="pp-contacts-title">设置</div>' +
            '<div style="width:36px"></div>' +
        '</div>' +
        
        // 关联微信联系人
        '<div class="pp-settings-section">' +
            '<div class="pp-settings-section-title">关联微信联系人</div>' +
            '<div class="pp-setting-item pp-setting-clickable" onclick="ppAddWxContact()">' +
                '<span><i class="fas fa-user-plus"></i> 从微信联系人中选择</span>' +
                '<i class="fas fa-chevron-right"></i>' +
            '</div>' +
            '<div class="pp-setting-hint">从微信联系人列表中选择，关联后TA将成为你的粉丝❤️<br>可以填写TA粉上你的原因</div>' +
            linkedContactsHtml +
        '</div>' +
        
        // 工作团队
        '<div class="pp-settings-section">' +
            '<div class="pp-settings-section-title">工作团队</div>' +
            managerInfo +
            assistantInfo +
        '</div>' +
        
        // NPC明星管理
        '<div class="pp-settings-section">' +
            '<div class="pp-settings-section-title">🌟 娱乐圈关系</div>' +
            '<div class="pp-setting-item pp-setting-clickable" onclick="ppManageNpcStars()">' +
                '<span><i class="fas fa-users"></i> NPC明星管理</span>' +
                '<span class="pp-setting-value">' + ((d.npcStars||[]).length > 0 ? (d.npcStars.length + '位') : '未设置') + ' <i class="fas fa-chevron-right"></i></span>' +
            '</div>' +
            '<div class="pp-setting-hint">添加对家、CP、好友等NPC明星，让娱乐圈更真实</div>' +
            ppRenderNpcStarsList() +
        '</div>' +
        
        // 工作模式
        '<div class="pp-settings-section">' +
            '<div class="pp-settings-section-title">工作模式</div>' +
            '<div class="pp-setting-item">' +
                '<span><i class="fas fa-briefcase"></i> 当前模式</span>' +
                '<span class="pp-setting-value">' + workModeText + '</span>' +
            '</div>' +
            '<div class="pp-work-mode-btns">' +
                '<button class="pp-work-mode-btn' + (d.workMode==='solo'?' active':'') + '" onclick="ppSetWorkMode(\'solo\')">' +
                    '<i class="fas fa-home"></i><span>个人工作室</span>' +
                '</button>' +
                '<button class="pp-work-mode-btn' + (d.workMode==='company'?' active':'') + '" onclick="ppSetWorkMode(\'company\')">' +
                    '<i class="fas fa-building"></i><span>签约公司</span>' +
                '</button>' +
            '</div>' +
        '</div>' +
        
        // 当前状态
        '<div class="pp-settings-section">' +
            '<div class="pp-settings-section-title">当前状态</div>' +
            '<div class="pp-setting-item">' +
                '<span><i class="fas fa-star"></i> 名气等级</span>' +
                '<span class="pp-setting-value">' + d.tier + '</span>' +
            '</div>' +
            '<div class="pp-setting-item">' +
                '<span><i class="fas fa-heart"></i> 粉丝数量</span>' +
                '<span class="pp-setting-value">' + formatFans(d.fans) + '</span>' +
            '</div>' +
            '<div class="pp-setting-item">' +
                '<span><i class="fas fa-coins"></i> 经济实力</span>' +
                '<span class="pp-setting-value">¥' + formatFans(d.money) + '</span>' +
            '</div>' +
        '</div>' +
    '</div>';
}

// ====== NPC明星列表渲染 ======
function ppRenderNpcStarsList() {
    var d = store.paopao;
    if (!d.npcStars || d.npcStars.length === 0) return '';
    var relIcons = {rival:'⚔️',cp:'💕',friend:'🤝',senior:'👑',junior:'🌱'};
    var relNames = {rival:'对家',cp:'CP',friend:'好友',senior:'前辈',junior:'后辈'};
    return d.npcStars.map(function(star) {
        return '<div class="pp-setting-item" style="padding:8px 12px;">' +
            '<span>' + (relIcons[star.relationship]||'⭐') + ' ' + escapeHtml(star.name) +
            ' <span style="font-size:11px;color:#999;">(' + (relNames[star.relationship]||'其他') + ' · ' + star.tier + ')</span></span>' +
            '<span style="display:flex;gap:8px;">' +
                '<span class="pp-setting-value" style="cursor:pointer;color:#999;padding:4px 8px;" onclick="event.stopPropagation();ppViewNpcStar(\'' + star.id + '\')"><i class="fas fa-eye"></i></span>' +
                '<span class="pp-setting-value" style="cursor:pointer;color:#c75050;padding:4px 8px;" onclick="event.stopPropagation();ppDeleteNpcStar(\'' + star.id + '\')"><i class="fas fa-trash"></i></span>' +
            '</span>' +
        '</div>';
    }).join('');
}

// ====== NPC明星管理弹窗 ======
window.ppManageNpcStars = function() {
    var d = store.paopao;
    if (!d.npcStars) d.npcStars = [];
    
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) { overlay.remove(); ppRenderTab(); } };
    
    var relOptions = '<option value="rival">⚔️ 对家（竞争对手）</option>' +
        '<option value="cp">💕 CP对象</option>' +
        '<option value="friend">🤝 好友明星</option>' +
        '<option value="senior">👑 前辈</option>' +
        '<option value="junior">🌱 后辈</option>';
    
    var tierOptions = ['十八线','十线','八线','五线','三线','二线','一线','顶流'].map(function(t) {
        return '<option value="' + t + '">' + t + '</option>';
    }).join('');
    
    // 联系人选择列表
    var contactOptions = '<option value="">-- 不关联联系人 --</option>';
    (store.contacts || []).filter(function(c) { return !c.isGroup; }).forEach(function(c) {
        contactOptions += '<option value="' + c.id + '">' + escapeHtml(c.name || '未命名') + '</option>';
    });
    
    overlay.innerHTML = '<div class="pp-pick-modal" style="max-height:80vh;">' +
        '<div class="pp-pick-title"><i class="fas fa-star"></i> 添加NPC明星</div>' +
        '<div class="pp-pick-subtitle">添加娱乐圈中的其他明星角色</div>' +
        '<div style="padding:12px;">' +
            '<div style="margin-bottom:10px;">' +
                '<label style="font-size:12px;color:#999;display:block;margin-bottom:4px;">名字 *</label>' +
                '<input type="text" id="pp-npc-name" placeholder="NPC明星名字" style="width:100%;padding:8px 10px;border:1px solid #eee;border-radius:8px;font-size:14px;box-sizing:border-box;">' +
            '</div>' +
            '<div style="margin-bottom:10px;">' +
                '<label style="font-size:12px;color:#999;display:block;margin-bottom:4px;">关系类型</label>' +
                '<select id="pp-npc-relation" style="width:100%;padding:8px 10px;border:1px solid #eee;border-radius:8px;font-size:14px;box-sizing:border-box;">' + relOptions + '</select>' +
            '</div>' +
            '<div style="margin-bottom:10px;">' +
                '<label style="font-size:12px;color:#999;display:block;margin-bottom:4px;">咖位</label>' +
                '<select id="pp-npc-tier" style="width:100%;padding:8px 10px;border:1px solid #eee;border-radius:8px;font-size:14px;box-sizing:border-box;">' + tierOptions + '</select>' +
            '</div>' +
            '<div style="margin-bottom:10px;">' +
                '<label style="font-size:12px;color:#999;display:block;margin-bottom:4px;">关联联系人（可选）</label>' +
                '<select id="pp-npc-contact" style="width:100%;padding:8px 10px;border:1px solid #eee;border-radius:8px;font-size:14px;box-sizing:border-box;">' + contactOptions + '</select>' +
            '</div>' +
            '<div style="display:flex;gap:8px;margin-top:16px;">' +
                '<button onclick="this.closest(\'.pp-result-overlay\').remove();ppRenderTab();" style="flex:1;padding:10px;border:1px solid #eee;border-radius:8px;background:#fff;font-size:14px;cursor:pointer;">取消</button>' +
                '<button onclick="ppSaveNpcStar()" style="flex:1;padding:10px;border:none;border-radius:8px;background:#8a6b78;color:#fff;font-size:14px;cursor:pointer;">添加</button>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
    overlay.offsetHeight;
    requestAnimationFrame(function() { overlay.style.opacity = '1'; });
};

window.ppSaveNpcStar = function() {
    var d = store.paopao;
    if (!d.npcStars) d.npcStars = [];
    
    var name = (document.getElementById('pp-npc-name')?.value || '').trim();
    if (!name) { showPpResult('💡 提示', '请输入NPC明星名字', false); return; }
    
    var relationship = document.getElementById('pp-npc-relation')?.value || 'rival';
    var tier = document.getElementById('pp-npc-tier')?.value || '五线';
    var linkedContactId = document.getElementById('pp-npc-contact')?.value || '';
    
    var tierFansMap = {'十八线':5000,'十线':20000,'八线':80000,'五线':300000,'三线':1000000,'二线':5000000,'一线':20000000,'顶流':50000000};
    
    var star = {
        id: 'npc_star_' + Date.now(),
        name: name,
        linkedContactId: linkedContactId,
        tier: tier,
        fans: tierFansMap[tier] || 300000,
        relationship: relationship,
        friendliness: relationship === 'rival' ? 20 : (relationship === 'cp' ? 70 : 50),
        events: [],
        createdAt: Date.now()
    };
    
    d.npcStars.push(star);
    save();
    
    // 关闭弹窗
    document.querySelectorAll('.pp-result-overlay').forEach(function(el) { el.remove(); });
    
    var relNames = {rival:'对家',cp:'CP',friend:'好友',senior:'前辈',junior:'后辈'};
    showPpResult('⭐ 已添加', name + '已加入娱乐圈，关系：' + (relNames[relationship]||'其他'), true);
    
    setTimeout(function() { ppRenderTab(); }, 1500);
};

window.ppDeleteNpcStar = function(starId) {
    var d = store.paopao;
    if (!d.npcStars) return;
    d.npcStars = d.npcStars.filter(function(s) { return s.id !== starId; });
    save();
    ppRenderTab();
};

window.ppViewNpcStar = function(starId) {
    var d = store.paopao;
    var star = (d.npcStars || []).find(function(s) { return s.id === starId; });
    if (!star) return;
    
    var relIcons = {rival:'⚔️',cp:'💕',friend:'🤝',senior:'👑',junior:'🌱'};
    var relNames = {rival:'对家',cp:'CP对象',friend:'好友明星',senior:'前辈',junior:'后辈'};
    
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    
    overlay.innerHTML = '<div class="pp-pick-modal" style="max-height:70vh;">' +
        '<div class="pp-pick-title">' + (relIcons[star.relationship]||'⭐') + ' ' + escapeHtml(star.name) + '</div>' +
        '<div style="padding:12px;">' +
            '<div class="pp-setting-item"><span>关系</span><span class="pp-setting-value">' + (relNames[star.relationship]||'其他') + '</span></div>' +
            '<div class="pp-setting-item"><span>咖位</span><span class="pp-setting-value">' + star.tier + '</span></div>' +
            '<div class="pp-setting-item"><span>粉丝数</span><span class="pp-setting-value">' + formatFans(star.fans) + '</span></div>' +
            '<div class="pp-setting-item"><span>好感度</span><span class="pp-setting-value">' + (star.friendliness||50) + '%</span></div>' +
            (star.linkedContactId ? '<div class="pp-setting-item"><span>关联联系人</span><span class="pp-setting-value">已关联</span></div>' : '') +
            // [FIX] 显示NPC事件历史
            (star.events && star.events.length > 0 ?
                '<div style="margin-top:12px;border-top:1px solid #eee;padding-top:10px;">' +
                    '<div style="font-size:13px;font-weight:600;margin-bottom:8px;">📋 互动记录</div>' +
                    star.events.slice(-5).reverse().map(function(ev){
                        return '<div style="font-size:12px;color:#666;padding:4px 0;border-bottom:1px solid #f5f5f5;">' +
                            escapeHtml(ev.desc || '') +
                            '<span style="float:right;color:#999;font-size:11px;">' + (ev.date ? new Date(ev.date).toLocaleDateString('zh-CN') : '') + '</span>' +
                        '</div>';
                    }).join('') +
                '</div>' : '') +
            '<div style="margin-top:12px;text-align:center;">' +
                '<button onclick="this.closest(\'.pp-result-overlay\').remove();" style="padding:10px 32px;border:1px solid #eee;border-radius:8px;background:#fff;font-size:14px;cursor:pointer;">关闭</button>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
    overlay.offsetHeight;
    requestAnimationFrame(function() { overlay.style.opacity = '1'; });
};

// ====== 从微信联系人选择 ======
window.ppAddWxContact = function(){
    var wxContacts = store.contacts || [];
    if(wxContacts.length === 0){
        showPpResult('💡 提示', '微信app中还没有联系人哦~\n请先在微信中创建联系人', false);
        return;
    }
    
    var d = store.paopao;
    // 过滤已关联的
    var alreadyLinked = d.contacts.map(function(c){ return c.wxContactId; });
    var available = wxContacts.filter(function(wx){ return !alreadyLinked.includes(wx.id); });
    
    if(available.length === 0){
        showPpResult('💡 提示', '所有微信联系人都已关联了~', false);
        return;
    }
    
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.innerHTML = '<div class="pp-pick-modal">' +
        '<div class="pp-pick-title"><i class="fas fa-address-book"></i> 选择微信联系人</div>' +
        '<div class="pp-pick-subtitle">选择一位联系人关联为你的粉丝</div>' +
        '<div class="pp-wx-contact-list">' +
            available.map(function(wx){
                return '<div class="pp-wx-contact-item" onclick="ppSelectWxContact(\'' + wx.id + '\')">' +
                    (wx.avatar ? '<img src="' + escapeHtml(wx.avatar) + '" class="pp-wx-contact-avatar">' :
                        '<div class="pp-wx-contact-avatar-placeholder">' + (wx.name||'?').charAt(0) + '</div>') +
                    '<div class="pp-wx-contact-name">' + escapeHtml(wx.name) + '</div>' +
                    '<i class="fas fa-plus-circle pp-wx-contact-add"></i>' +
                '</div>';
            }).join('') +
        '</div>' +
        '<button class="pp-modal-btn pp-modal-btn-cancel" style="margin-top:12px;width:100%;" onclick="this.closest(\'.pp-result-overlay\').remove()">取消</button>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
};

window.ppSelectWxContact = function(wxId){
    var wxContact = (store.contacts || []).find(function(wx){ return wx.id === wxId; });
    if(!wxContact) return;
    
    // 关闭联系人选择弹窗
    document.querySelectorAll('.pp-result-overlay').forEach(function(el){ el.remove(); });
    
    // 弹出填写粉上原因的弹窗
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.innerHTML = '<div class="pp-settings-modal">' +
        '<div class="pp-modal-title">关联 ' + escapeHtml(wxContact.name) + '</div>' +
        '<div class="pp-modal-subtitle">填写TA粉上你的原因（选填）</div>' +
        '<div class="pp-modal-field">' +
            '<label>粉上原因</label>' +
            '<textarea class="pp-modal-textarea" id="pp-fan-reason-input" placeholder="例如：看了我在综艺上的表现后被圈粉了...\n或者：一直关注我的社交媒体，喜欢我的性格..."></textarea>' +
        '</div>' +
        '<input type="hidden" id="pp-wx-id-input" value="' + wxId + '">' +
        '<div class="pp-modal-actions">' +
            '<button class="pp-modal-btn pp-modal-btn-cancel" onclick="this.closest(\'.pp-result-overlay\').remove()">取消</button>' +
            '<button class="pp-modal-btn pp-modal-btn-confirm" onclick="ppConfirmWxContact()">确认关联</button>' +
        '</div>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
};

window.ppConfirmWxContact = function(){
    var wxIdInput = document.getElementById('pp-wx-id-input');
    var reasonInput = document.getElementById('pp-fan-reason-input');
    if(!wxIdInput) return;
    
    var wxId = wxIdInput.value;
    var wxContact = (store.contacts || []).find(function(wx){ return wx.id === wxId; });
    if(!wxContact) return;
    
    var d = store.paopao;
    var newContact = {
        id: 'contact_' + Date.now(),
        wxContactId: wxId,
        name: wxContact.name,
        relation: '粉丝',
        fanReason: reasonInput ? reasonInput.value.trim() : '',
        addedAt: Date.now(),
        unread: 1
    };
    
    d.contacts.push(newContact);
    
    // 自动生成TA发来的第一条消息
    d.contactChats[newContact.id] = [{
        name: wxContact.name,
        text: '终于等到你关注我了！我一直都是你的粉丝，好开心终于能和你聊天了～💕',
        time: Date.now(),
        isMe: false
    }];
    
    save();
    document.querySelectorAll('.pp-result-overlay').forEach(function(el){ el.remove(); });
    showPpResult('🎉 关联成功', wxContact.name + ' 已成为你的粉丝联系人！', true);
    ppRenderTab();
};

// ====== 表情包挂载页面 ======
function ppRenderStickerMount(area){
    var d = store.paopao;
    var allCates = store.stickerCategories || [];
    var mountedIds = d.mountedStickerCateIds || [];
    
    var cateListHtml = '';
    if(allCates.length === 0){
        cateListHtml = '<div class="pp-empty-hint">微信表情包图库中还没有表情分类~<br>请先在微信app中添加表情包</div>';
    } else {
        cateListHtml = allCates.map(function(cate){
            var isMounted = mountedIds.includes(cate.id);
            var count = cate.stickers ? cate.stickers.length : 0;
            return '<div class="pp-sticker-mount-item ' + (isMounted ? 'mounted' : '') + '" onclick="ppToggleStickerCate(\'' + cate.id + '\')">' +
                '<div class="pp-sticker-mount-info">' +
                    '<div class="pp-sticker-mount-name">' + escapeHtml(cate.name) + '</div>' +
                    '<div class="pp-sticker-mount-count">' + count + '个表情</div>' +
                '</div>' +
                '<div class="pp-sticker-mount-toggle">' +
                    (isMounted ? '<i class="fas fa-check-circle" style="color:#4caf50;font-size:22px;"></i>' : '<i class="far fa-circle" style="color:#ccc;font-size:22px;"></i>') +
                '</div>' +
            '</div>';
        }).join('');
    }
    
    area.innerHTML = '<div class="pp-settings-page">' +
        '<div class="pp-contacts-header">' +
            '<div class="pp-contacts-back" onclick="ppBackToMsgList()"><i class="fas fa-chevron-left"></i></div>' +
            '<div class="pp-contacts-title">挂载表情包</div>' +
            '<div style="width:36px"></div>' +
        '</div>' +
        '<div class="pp-settings-section">' +
            '<div class="pp-settings-section-title">微信表情包图库</div>' +
            '<div class="pp-setting-hint">选择要挂载到泡泡的表情包分类<br>挂载后，你可以在群聊中发送表情包，粉丝也会随机发送表情包</div>' +
            cateListHtml +
        '</div>' +
        '<div class="pp-settings-section">' +
            '<div class="pp-setting-hint" style="text-align:center;padding:16px;">当前已挂载 <strong style="color:#8a6b78;">' + mountedIds.length + '</strong> 个分类</div>' +
        '</div>' +
    '</div>';
}

window.ppToggleStickerCate = function(cateId){
    var d = store.paopao;
    if(!d.mountedStickerCateIds) d.mountedStickerCateIds = [];
    var idx = d.mountedStickerCateIds.indexOf(cateId);
    if(idx >= 0){
        d.mountedStickerCateIds.splice(idx, 1);
    } else {
        d.mountedStickerCateIds.push(cateId);
    }
    save();
    ppRenderTab();
};

// ====== 工作模式选择 ======
window.ppSetWorkMode = function(mode){
    var d = store.paopao;
    if(mode === 'company'){
        ppPromptDialog('签约公司', '输入你要签约的公司名称', d.companyName || '星辉娱乐', function(companyName){
            d.companyName = companyName;
            d.workMode = mode;
            save();
            ppRenderTab();
            showPpResult('✅ 设置成功', '你已签约 ' + d.companyName + '！将获得更多资源支持~', true);
        });
    } else {
        d.workMode = mode;
        save();
        ppRenderTab();
        showPpResult('✅ 设置成功', '你已选择开设个人工作室！自由度更高~', true);
    }
};

// ====== 解雇经纪人/助理 ======
window.ppFireStaff = function(type){
    var d = store.paopao;
    var name = type === 'manager' ? (d.manager ? d.manager.name : '') : (d.assistant ? d.assistant.name : '');
    ppConfirmDialog('⚠️ 确认解除合作', '确定要解除与 ' + escapeHtml(name) + ' 的合作吗？', function(){
        if(type === 'manager') d.manager = null;
        else d.assistant = null;
        delete d.contactChats[type];
        save();
        ppRenderTab();
        showPpResult('👋 已解除合作', name + ' 已离开你的团队', true);
    });
};

// ====== 经纪人匹配系统 ======
window.ppPickManager = function(){
    var d = store.paopao;
    var qualityScore = calcQualityScore(d);
    
    var candidates = [];
    for(var i = 0; i < 3; i++){
        candidates.push(generateManagerCandidate(qualityScore, i));
    }
    
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.innerHTML = '<div class="pp-pick-modal">' +
        '<div class="pp-pick-title"><i class="fas fa-user-tie"></i> 挑选经纪人</div>' +
        '<div class="pp-pick-subtitle">根据你的名气和实力，为你匹配了以下候选人</div>' +
        '<div class="pp-pick-cards">' +
            candidates.map(function(c, idx){
                var stars = '';
                for(var s = 0; s < 5; s++) stars += s < c.stars ? '⭐' : '☆';
                return '<div class="pp-pick-card" onclick="ppConfirmManager(' + idx + ')">' +
                    '<div class="pp-pick-avatar">经</div>' +
                    '<div class="pp-pick-name">' + escapeHtml(c.name) + '</div>' +
                    '<div class="pp-pick-stars">' + stars + '</div>' +
                    '<div class="pp-pick-title-text">' + escapeHtml(c.title) + '</div>' +
                    '<div class="pp-pick-trait"><i class="fas fa-gem"></i> ' + escapeHtml(c.trait) + '</div>' +
                    '<div class="pp-pick-trait-desc">' + escapeHtml(c.traitDesc) + '</div>' +
                    '<div class="pp-pick-bonus">涨粉加成 +' + c.bonus + '%</div>' +
                '</div>';
            }).join('') +
        '</div>' +
        '<button class="pp-modal-btn pp-modal-btn-cancel" style="margin-top:12px;width:100%;" onclick="this.closest(\'.pp-result-overlay\').remove()">暂不选择</button>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    
    window._ppManagerCandidates = candidates;
};

window.ppConfirmManager = function(idx){
    var d = store.paopao;
    var c = window._ppManagerCandidates[idx];
    if(!c) return;
    
    d.manager = {
        name: c.name,
        title: c.title,
        trait: c.trait,
        traitDesc: c.traitDesc,
        bonus: c.bonus,
        stars: c.stars,
        hiredAt: Date.now()
    };
    
    d.contactChats['manager'] = [{
        name: c.name,
        text: '你好！我是你的新经纪人 ' + c.name + '，以后你的事业就交给我吧！我会尽全力为你争取最好的资源💪',
        time: Date.now(),
        isMe: false
    }];
    
    save();
    document.querySelectorAll('.pp-result-overlay').forEach(function(el){ el.remove(); });
    showPpResult('🎉 签约成功', '恭喜！' + c.name + ' 已成为你的经纪人！\n涨粉加成 +' + c.bonus + '%', true);
    ppRenderTab();
};

// ====== 助理匹配系统 ======
window.ppPickAssistant = function(){
    var d = store.paopao;
    var qualityScore = calcQualityScore(d);
    
    var candidates = [];
    for(var i = 0; i < 3; i++){
        candidates.push(generateAssistantCandidate(qualityScore, i));
    }
    
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.innerHTML = '<div class="pp-pick-modal">' +
        '<div class="pp-pick-title"><i class="fas fa-user-check"></i> 挑选助理</div>' +
        '<div class="pp-pick-subtitle">根据你的名气和实力，为你匹配了以下候选人</div>' +
        '<div class="pp-pick-cards">' +
            candidates.map(function(c, idx){
                var stars = '';
                for(var s = 0; s < 5; s++) stars += s < c.stars ? '⭐' : '☆';
                return '<div class="pp-pick-card pp-pick-card-asst" onclick="ppConfirmAssistant(' + idx + ')">' +
                    '<div class="pp-pick-avatar pp-pick-avatar-asst">助</div>' +
                    '<div class="pp-pick-name">' + escapeHtml(c.name) + '</div>' +
                    '<div class="pp-pick-stars">' + stars + '</div>' +
                    '<div class="pp-pick-title-text">' + escapeHtml(c.title) + '</div>' +
                    '<div class="pp-pick-trait"><i class="fas fa-gem"></i> ' + escapeHtml(c.trait) + '</div>' +
                    '<div class="pp-pick-trait-desc">' + escapeHtml(c.traitDesc) + '</div>' +
                    '<div class="pp-pick-bonus">互动加成 +' + c.bonus + '%</div>' +
                '</div>';
            }).join('') +
        '</div>' +
        '<button class="pp-modal-btn pp-modal-btn-cancel" style="margin-top:12px;width:100%;" onclick="this.closest(\'.pp-result-overlay\').remove()">暂不选择</button>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    
    window._ppAssistantCandidates = candidates;
};

window.ppConfirmAssistant = function(idx){
    var d = store.paopao;
    var c = window._ppAssistantCandidates[idx];
    if(!c) return;
    
    d.assistant = {
        name: c.name,
        title: c.title,
        trait: c.trait,
        traitDesc: c.traitDesc,
        bonus: c.bonus,
        stars: c.stars,
        hiredAt: Date.now()
    };
    
    d.contactChats['assistant'] = [{
        name: c.name,
        text: '你好呀！我是' + c.name + '，以后就是你的专属助理啦～有什么需要随时叫我！😊',
        time: Date.now(),
        isMe: false
    }];
    
    save();
    document.querySelectorAll('.pp-result-overlay').forEach(function(el){ el.remove(); });
    showPpResult('🎉 雇佣成功', '恭喜！' + c.name + ' 已成为你的助理！\n互动加成 +' + c.bonus + '%', true);
    ppRenderTab();
};

// ====== 质量分计算 ======
function calcQualityScore(d){
    var tierScores = {
        '十八线':2, '出道新人':5, '崭露头角':8, '小有名气':12,
        '五线明星':16, '四线明星':20, '三线明星':25, '二线明星':30,
        '准一线':34, '一线明星':37, '超一线顶流':40
    };
    var fameScore = tierScores[d.tier] || 2;
    var fanScore = Math.min(30, Math.floor(Math.log10(Math.max(d.fans, 1)) * 5));
    var moneyScore = Math.min(30, Math.floor(Math.log10(Math.max(d.money, 1)) * 5));
    return fameScore + fanScore + moneyScore;
}

// ====== 生成经纪人候选人 ======
function generateManagerCandidate(qualityScore, index){
    var baseStars = Math.max(1, Math.min(5, Math.floor(qualityScore / 20) + 1));
    var starVariation = [-1, 0, 1];
    var stars = Math.max(1, Math.min(5, baseStars + starVariation[index]));
    
    var baseBonus = stars * 5 + Math.floor(Math.random() * (stars * 3));
    
    var nameIdx = Math.floor(Math.random() * MANAGER_NAMES.length);
    var titleIdx = Math.floor(Math.random() * MANAGER_TITLES.length);
    var traitIdx = Math.floor(Math.random() * MANAGER_TRAITS.length);
    
    if(stars >= 4) titleIdx = Math.min(titleIdx, 2);
    if(stars >= 5) titleIdx = 0;
    
    return {
        name: MANAGER_NAMES[nameIdx],
        title: MANAGER_TITLES[titleIdx],
        trait: MANAGER_TRAITS[traitIdx].trait,
        traitDesc: MANAGER_TRAITS[traitIdx].desc,
        bonus: baseBonus,
        stars: stars
    };
}

// ====== 生成助理候选人 ======
function generateAssistantCandidate(qualityScore, index){
    var baseStars = Math.max(1, Math.min(5, Math.floor(qualityScore / 20) + 1));
    var starVariation = [-1, 0, 1];
    var stars = Math.max(1, Math.min(5, baseStars + starVariation[index]));
    
    var baseBonus = stars * 4 + Math.floor(Math.random() * (stars * 3));
    
    var nameIdx = Math.floor(Math.random() * ASSISTANT_NAMES.length);
    var titleIdx = Math.floor(Math.random() * ASSISTANT_TITLES.length);
    var traitIdx = Math.floor(Math.random() * ASSISTANT_TRAITS.length);
    
    if(stars >= 4) titleIdx = Math.min(titleIdx, 2);
    if(stars >= 5) titleIdx = 0;
    
    return {
        name: ASSISTANT_NAMES[nameIdx],
        title: ASSISTANT_TITLES[titleIdx],
        trait: ASSISTANT_TRAITS[traitIdx].trait,
        traitDesc: ASSISTANT_TRAITS[traitIdx].desc,
        bonus: baseBonus,
        stars: stars
    };
}

// ====== 第二个页面：功能（四个导航栏） ======
var ppActivitySubTab = 'tongGao'; // tongGao/zongYi/daiYan/blog

function ppRenderActivity(area){
    var d = store.paopao;
    var tabs = [
        {k:'tongGao', icon:'fa-clapperboard', label:'接通告'},
        {k:'zongYi', icon:'fa-tv', label:'接综艺'},
        {k:'daiYan', icon:'fa-gem', label:'接代言'},
        {k:'blog', icon:'fa-pen-fancy', label:'发博客'},
        {k:'customBlog', icon:'fa-edit', label:'自定义博客'}
    ];
    
    // 正在拍摄的工作
    var shootingJob = d.currentShootingJob;
    var shootingBarHtml = '';
    if(shootingJob){
        var typeIcon = shootingJob.type === 'tongGao' ? '🎬' : shootingJob.type === 'zongYi' ? '📺' : '💎';
        var typeLabel = shootingJob.type === 'tongGao' ? '拍摄中' : shootingJob.type === 'zongYi' ? '录制中' : '拍摄中';
        var shootPct = shootingJob.shootingDays > 0 ? Math.floor((shootingJob.currentDay / shootingJob.shootingDays) * 100) : 0;
        shootingBarHtml = '<div class="pp-shooting-bar" onclick="ppResumeShooting()">' +
            '<div class="pp-shooting-bar-icon">' + typeIcon + '</div>' +
            '<div class="pp-shooting-bar-info">' +
                '<div class="pp-shooting-bar-name">' + escapeHtml(shootingJob.name) + ' ' + typeLabel + '</div>' +
                '<div class="pp-shooting-bar-progress">' +
                    '<div class="pp-shooting-bar-fill" style="width:' + shootPct + '%"></div>' +
                '</div>' +
                '<div class="pp-shooting-bar-text">进度 ' + shootingJob.currentDay + '/' + shootingJob.shootingDays + ' 场</div>' +
            '</div>' +
            '<i class="fas fa-play-circle" style="margin-left:auto;font-size:20px;color:#8a6b78;"></i>' +
        '</div>';
    }
    
    area.innerHTML = '<div class="pp-activity-page">' +
        // 正在拍摄的工作条
        shootingBarHtml +
        // 四个导航标签
        '<div class="pp-func-tabs">' +
            tabs.map(function(t){
                return '<div class="pp-func-tab' + (ppActivitySubTab===t.k?' active':'') + '" onclick="ppSwitchFuncTab(\'' + t.k + '\')">' +
                    '<i class="fas ' + t.icon + '"></i><span>' + t.label + '</span>' +
                '</div>';
            }).join('') +
        '</div>' +
        // 内容区
        '<div id="pp-func-content" class="pp-func-content"></div>' +
    '</div>';
    
    ppRenderFuncContent();
}

window.ppSwitchFuncTab = function(tab){
    ppActivitySubTab = tab;
    var tabs = document.querySelectorAll('.pp-func-tab');
    tabs.forEach(function(t){ t.classList.remove('active'); });
    var clicked = document.querySelector('.pp-func-tab[onclick*="' + tab + '"]');
    if(clicked) clicked.classList.add('active');
    ppRenderFuncContent();
};

function ppRenderFuncContent(){
    var area = document.getElementById('pp-func-content');
    if(!area) return;
    if(ppActivitySubTab === 'tongGao') ppRenderTongGao(area);
    else if(ppActivitySubTab === 'zongYi') ppRenderZongYi(area);
    else if(ppActivitySubTab === 'daiYan') ppRenderDaiYan(area);
    else if(ppActivitySubTab === 'blog') ppRenderBlog(area);
    else if(ppActivitySubTab === 'customBlog') ppRenderCustomBlog(area);
}

// ====== 通用：渲染星级 ======
function ppRenderStars(n){
    var s = '';
    for(var i = 0; i < 5; i++){
        if(i < n) s += '<i class="fas fa-star" style="color:#ffc107;"></i>';
        else s += '<i class="far fa-star" style="color:#ddd;"></i>';
    }
    return s;
}

// ====== 通用：渲染加载中（带超时提示） ======
var _ppLoadingTimeouts = {};
function ppRenderLoading(area, text, retryFn){
    var loadingId = 'pp-loading-' + Date.now();
    area.innerHTML = '<div class="pp-loading-area" id="' + loadingId + '">' +
        '<div class="pp-loading-spinner"></div>' +
        '<div class="pp-loading-text">' + (text || '正在为你寻找资源...') + '</div>' +
    '</div>';
    // [FIX] 20秒超时提示
    if(_ppLoadingTimeouts[loadingId]) clearTimeout(_ppLoadingTimeouts[loadingId]);
    _ppLoadingTimeouts[loadingId] = setTimeout(function(){
        var el = document.getElementById(loadingId);
        if(el){
            var textEl = el.querySelector('.pp-loading-text');
            if(textEl) textEl.innerHTML = '网络较慢，请稍候...' + (retryFn ? '<br><button onclick="(' + retryFn.toString() + ')()" style="margin-top:10px;padding:6px 18px;border:1.5px solid #ccc;border-radius:8px;background:#fff;font-size:14px;cursor:pointer;">点击重试</button>' : '');
        }
        delete _ppLoadingTimeouts[loadingId];
    }, 20000);
}

// ====== 通用：API调用生成内容 ======
function ppGenerateOffers(type, callback){
    _currentApiScene = 'paopao';
    var d = store.paopao;
    var tierText = d.tier || '十八线';
    var fansText = formatFans(d.fans);
    var stageName = d.stageName || '小星星';
    var genderText = d.gender === 'male' ? '男艺人' : '女艺人';
    
    // 检查缓存（5分钟内不重复生成）
    var cached = d.cachedOffers && d.cachedOffers[type];
    var lastTime = d.lastOfferTime && d.lastOfferTime[type];
    if(cached && cached.length > 0 && lastTime && (Date.now() - lastTime < 300000)){
        callback(cached);
        return;
    }
    
    var prompts = {
        tongGao: '你是娱乐圈经纪人AI。当前艺人信息：艺名"' + stageName + '"，咖位"' + tierText + '"，粉丝数' + fansText + '，' + genderText + '。\n请根据该艺人的咖位等级，随机生成3个影视通告（电影或电视剧）供选择。要求：\n1. 每个通告包含：作品名称（原创名字，不要用已有作品）、类型（电影/电视剧）、角色描述（20字内）、拍摄周期（X个月）、剧本星级（1-5星，咖位越高越可能拿到高星级项目）、预计片酬（数字）\n2. 三个选项难度和收益要有差异\n3. 咖位低的给小制作，咖位高的给大制作\n严格按以下JSON格式输出，不要其他文字：\n[{"name":"作品名","type":"电影/电视剧","role":"角色描述","duration":"3个月","stars":4,"pay":500000}]',
        
        zongYi: '你是娱乐圈经纪人AI。当前艺人信息：艺名"' + stageName + '"，咖位"' + tierText + '"，粉丝数' + fansText + '，' + genderText + '。\n请根据该艺人的咖位等级，随机生成3个综艺节目通告供选择。要求：\n1. 每个综艺包含：节目名称（原创名字）、节目类型（真人秀/访谈/竞技/观察等）、节目描述（20字内）、录制周期（X期，每期X天）、节目星级（1-5星）、预计片酬（数字）\n2. 三个选项难度和收益要有差异\n3. 咖位低的给网综小节目，咖位高的给卫视大综艺\n严格按以下JSON格式输出，不要其他文字：\n[{"name":"节目名","type":"真人秀","desc":"节目描述","schedule":"12期，每期2天","stars":3,"pay":300000}]',
        
        daiYan: '你是娱乐圈经纪人AI。当前艺人信息：艺名"' + stageName + '"，咖位"' + tierText + '"，粉丝数' + fansText + '，' + genderText + '。\n请根据该艺人的咖位等级，随机生成3个品牌代言机会供选择。要求：\n1. 每个代言包含：品牌名称（原创品牌名）、代言类型（全球代言人/品牌大使/品牌挚友/活动推广等）、品牌描述（20字内）、合约周期（X个月或X年）、品牌星级（1-5星）、代言费（数字）\n2. 三个选项档次和收益要有差异\n3. 咖位低的给小品牌，咖位高的给国际大牌\n严格按以下JSON格式输出，不要其他文字：\n[{"name":"品牌名","type":"品牌大使","desc":"品牌描述","duration":"1年","stars":4,"pay":2000000}]',
        
        blog: '你是娱乐圈社交媒体AI。当前艺人信息：艺名"' + stageName + '"，咖位"' + tierText + '"，粉丝数' + fansText + '，' + genderText + '。\n请随机生成3种博客/微博发布选项供选择。每个选项代表一种不同的发博策略。要求：\n1. 每个选项包含：标题（发博主题）、内容描述（30字内描述发什么）、预计效果描述（可能涨粉/掉粉/引发争议等）\n2. 三个选项风格要有差异（正面/中性/有风险的都要有）\n3. 结合艺人当前咖位和粉丝量设计\n严格按以下JSON格式输出，不要其他文字：\n[{"title":"发博主题","desc":"内容描述","effect":"可能的效果描述"}]'
    };
    
    var prompt = prompts[type];
    if(!prompt){
        callback([]);
        return;
    }
    
    if(!window.API || !API.chatCompletion){
        // 无API时使用本地随机生成
        var localItems = ppLocalGenerate(type);
        if(!d.cachedOffers) d.cachedOffers = {};
        if(!d.lastOfferTime) d.lastOfferTime = {};
        d.cachedOffers[type] = localItems;
        d.lastOfferTime[type] = Date.now();
        save();
        callback(localItems);
        return;
    }
    
    API.chatCompletion([
        {role:'system', content: prompt},
        {role:'user', content:'请生成3个选项'}
    ], 0.9).then(function(data){
        var text = (data.choices[0].message.content || '').trim();
        try {
            // 尝试提取JSON
            var jsonMatch = text.match(/\[[\s\S]*\]/);
            if(jsonMatch){
                var items = JSON.parse(jsonMatch[0]);
                if(Array.isArray(items) && items.length > 0){
                    // 缓存结果
                    if(!d.cachedOffers) d.cachedOffers = {};
                    if(!d.lastOfferTime) d.lastOfferTime = {};
                    d.cachedOffers[type] = items;
                    d.lastOfferTime[type] = Date.now();
                    save();
                    callback(items);
                    return;
                }
            }
        } catch(e){
            console.error('泡泡App JSON解析失败:', e, text);
        }
        // 解析失败使用本地生成
        var fallbackItems = ppLocalGenerate(type);
        if(!d.cachedOffers) d.cachedOffers = {};
        if(!d.lastOfferTime) d.lastOfferTime = {};
        d.cachedOffers[type] = fallbackItems;
        d.lastOfferTime[type] = Date.now();
        save();
        callback(fallbackItems);
    }).catch(function(err){
        console.error('泡泡App API调用失败:', err);
        var fallbackItems = ppLocalGenerate(type);
        if(!d.cachedOffers) d.cachedOffers = {};
        if(!d.lastOfferTime) d.lastOfferTime = {};
        d.cachedOffers[type] = fallbackItems;
        d.lastOfferTime[type] = Date.now();
        save();
        callback(fallbackItems);
    });
}

// ====== 本地随机生成（API不可用时的fallback） ======
function ppLocalGenerate(type){
    var d = store.paopao;
    var tier = d.tier || '十八线';
    var baseStars = tier === '超一线顶流' ? 4 : tier === '一线明星' ? 3 : tier === '准一线' ? 3 : tier === '二线明星' ? 2 : tier === '三线明星' ? 2 : 1;
    
    if(type === 'tongGao'){
        // 大幅扩充剧本名称池，增加随机性
        var names = [
            // 电影名称池
            ['破晓之光','星河入梦','长安如故','风起苍岚','镜中人','雪落山城','月下追忆','青云志','天涯客','九州缥缈',
             '无间行者','深海迷踪','烈火英雄','飞驰人生','悬崖之上','满江红','消失的她','孤注一掷','热辣滚烫',
             '第二十条','流浪星球','逆行者','暗影追踪','冰雪危机','极速营救','刺客信条','凤凰令','天机密码',
             '盗梦空间','龙门飞甲','画皮','倩女幽魂','西游伏妖','封神演义','山海经','聊斋新编','鬼吹灯',
             '最后的棋手','一步之遥','无名之辈','驴得水','暴裂无声','心迷宫','路边野餐','江湖儿女'],
            // 电视剧名称池
            ['都市丽人','甜蜜暴击','恋爱先生','我的前半生','欢乐颂','你好旧时光','致青春','何以笙箫默','微微一笑','暗恋橘生淮南',
             '琅琊榜','庆余年','知否知否','苍兰诀','长相思','与凤行','墨雨云间','花间令','永安梦华录',
             '锦绣未央','扶摇','楚乔传','三生三世','香蜜沉沉','陈情令','山河令','镇魂','烈火军校',
             '小欢喜','三十而已','都挺好','人世间','觉醒年代','风吹半夏','去有风的地方','以家人之名',
             '一闪一闪亮星星','遇见王沥川','最好的我们','你是我的荣耀','杉杉来了','亲爱的热爱的']
        ];
        var isMale = d.gender === 'male';
        var roles = isMale ? ['男主角','重要配角','特别出演','客串角色','第二男主','反派角色','男配角','友情出演','神秘人物'] : ['女主角','重要配角','特别出演','客串角色','第二女主','反派角色','女配角','友情出演','神秘人物'];
        var types = ['电影','电视剧'];
        // 随机生成角色描述增加随机性
        var roleDescs = isMale ?
            ['外冷内热的霸总','温柔学霸','热血少年','腹黑反派','痞帅警探','沉默军人','天才医生','落魄王子','神秘黑客','侠义江湖客'] :
            ['元气少女','高冷学姐','温婉千金','独立女强人','古灵精怪的邻家女孩','冷艳杀手','天才女科学家','落难公主','神秘女特工','侠女'];
        var result = [];
        for(var i = 0; i < 3; i++){
            var tIdx = Math.floor(Math.random()*2);
            var starVal = Math.min(5, Math.max(1, baseStars + Math.floor(Math.random()*3) - 1));
            var dur = Math.floor(Math.random()*5) + 2;
            var pay = Math.floor((starVal * 50000 + Math.random()*200000) * (1 + d.fans/1000000));
            // 50%概率使用详细角色描述代替简单角色名
            var roleStr = Math.random() < 0.5 ? roles[Math.floor(Math.random()*roles.length)] : roleDescs[Math.floor(Math.random()*roleDescs.length)];
            result.push({
                name: names[tIdx][Math.floor(Math.random()*names[tIdx].length)],
                type: types[tIdx],
                role: roleStr,
                duration: dur + '个月',
                stars: starVal,
                pay: Math.floor(pay)
            });
        }
        return result;
    }
    if(type === 'zongYi'){
        var shows = ['星光大道','快乐向前冲','梦想舞台','极限挑战','奔跑吧少年','向往的田园','密室逃脱','心动信号','脱口秀大会','演员请就位',
            '青春环游记','萌探探探案','大侦探','声生不息','歌手当打之年','这就是街舞','乘风破浪','创造营',
            '中餐厅','花儿与少年','妻子的浪漫旅行','五十公里桃花坞','你好生活','朋友请听好',
            '王牌对王牌','哈哈哈哈哈','快乐再出发','毛雪汪','很高兴认识你','一路向前',
            '披荆斩棘','闪光的乐队','天赐的声音','蒙面歌王','超级演说家','我是特优声'];
        var showTypes = ['真人秀','竞技','观察','访谈','选秀','户外','美食','旅行','音乐','推理','恋爱','脱口秀'];
        var showDescs = ['展现你的才艺面','考验你的智商和反应力','记录真实的生活状态','和明星朋友们一起旅行',
            '挑战你的极限','分享美食与生活','推理解谜的烧脑之旅','寻找心动的信号','释放你的音乐才华',
            '展现幽默感和口才','体验不一样的人生','和搭档默契配合'];
        var result = [];
        for(var i = 0; i < 3; i++){
            var starVal = Math.min(5, Math.max(1, baseStars + Math.floor(Math.random()*3) - 1));
            var eps = Math.floor(Math.random()*10) + 4;
            var pay = Math.floor((starVal * 30000 + Math.random()*150000) * (1 + d.fans/2000000));
            result.push({
                name: shows[Math.floor(Math.random()*shows.length)],
                type: showTypes[Math.floor(Math.random()*showTypes.length)],
                desc: showDescs[Math.floor(Math.random()*showDescs.length)],
                schedule: eps + '期，每期' + (Math.floor(Math.random()*2)+1) + '天',
                stars: starVal,
                pay: Math.floor(pay)
            });
        }
        return result;
    }
    if(type === 'daiYan'){
        var brands = ['星辰美妆','云端科技','青禾食品','锦绣服饰','珀莱雅','悦诗风吟','完美日记','花西子','自然堂','百雀羚','耐驰运动','飞鸿电子','优雅时光','璀璨珠宝','梦境香氛',
            '月光宝盒','蔚蓝之海','凤凰涅槃','丝路臻品','玉兰春色','碧波洗护','鹿晗同款','薇诺娜','半亩花田','橘朵',
            '戴尔科技','小米有品','vivo','OPPO','索尼影像','乐高积木','阿迪达斯','匹克体育','安踏','特步',
            '蒂芙尼','卡地亚','宝格丽','香奈儿','迪奥','古驰','路易威登','爱马仕','巴黎世家','普拉达'];
        var bTypes = ['全球代言人','品牌大使','品牌挚友','活动推广大使','产品体验官','亚太区代言人','品牌形象大使'];
        var brandDescs = ['高端护肤','潮流时尚','健康食品','数码科技','运动户外','奢侈珠宝','美妆彩妆','汽车座驾','电子产品','家居生活','饮品饮料','手表腕表'];
        var result = [];
        for(var i = 0; i < 3; i++){
            var starVal = Math.min(5, Math.max(1, baseStars + Math.floor(Math.random()*3) - 1));
            var durMonths = [3,6,12,24][Math.floor(Math.random()*4)];
            var pay = Math.floor((starVal * 100000 + Math.random()*500000) * (1 + d.fans/500000));
            result.push({
                name: brands[Math.floor(Math.random()*brands.length)],
                type: bTypes[Math.min(Math.floor(Math.random()*bTypes.length), starVal-1)],
                desc: brandDescs[Math.floor(Math.random()*brandDescs.length)] + '品牌',
                duration: durMonths >= 12 ? (durMonths/12) + '年' : durMonths + '个月',
                stars: starVal,
                pay: Math.floor(pay)
            });
        }
        return result;
    }
    if(type === 'blog'){
        var options = [
            {title:'晒自拍美照', desc:'发一组精修自拍，展现最美的自己', effect:'预计涨粉，粉丝互动增加'},
            {title:'分享日常生活', desc:'记录今天的美好瞬间和心情', effect:'拉近与粉丝的距离'},
            {title:'发表态度观点', desc:'对当下热点话题发表看法', effect:'可能引发争议，有风险也有机遇'},
            {title:'宣传新作品', desc:'为即将上映/播出的作品造势', effect:'提升作品关注度'},
            {title:'深夜感性文案', desc:'深夜发一段感性的文字', effect:'可能引发粉丝担心，也可能涨好感'},
            {title:'晒健身/美食', desc:'分享健康生活方式', effect:'正面形象加分，稳定涨粉'}
        ];
        return shuffleArr(options).slice(0,3);
    }
    return [];
}

function shuffleArr(arr){
    var a = arr.slice();
    for(var i = a.length - 1; i > 0; i--){
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
}

// ====== 渲染接通告页面 ======
function ppRenderTongGao(area){
    ppRenderLoading(area, '正在为你物色通告资源...');
    ppGenerateOffers('tongGao', function(items){
        if(!items || items.length === 0){
            area.innerHTML = '<div class="pp-empty-hint">暂时没有通告资源，请稍后再试</div>';
            return;
        }
        area.innerHTML = '<div class="pp-offer-list">' +
            items.map(function(item, idx){
                var attrReqHtml = ppRenderAttrReqHtml(item, 'tongGao');
                return '<div class="pp-offer-card">' +
                    '<div class="pp-offer-header">' +
                        '<span class="pp-offer-type-badge pp-offer-type-' + (item.type === '电影' ? 'movie' : 'drama') + '">' + (item.type || '影视') + '</span>' +
                        '<span class="pp-offer-stars">' + ppRenderStars(item.stars || 3) + '</span>' +
                    '</div>' +
                    '<div class="pp-offer-name">' + escapeHtml(item.name || '未命名作品') + '</div>' +
                    '<div class="pp-offer-role"><i class="fas fa-user-tag"></i> ' + escapeHtml(item.role || '待定角色') + '</div>' +
                    '<div class="pp-offer-meta">' +
                        '<span><i class="fas fa-calendar"></i> ' + escapeHtml(item.duration || '3个月') + '</span>' +
                        '<span><i class="fas fa-coins"></i> ¥' + formatFans(item.pay || 0) + '</span>' +
                    '</div>' +
                    attrReqHtml +
                    '<div class="pp-offer-actions">' +
                        '<button type="button" class="pp-offer-btn pp-offer-btn-reject" onclick="event.stopPropagation();ppRejectOffer(\'tongGao\',' + idx + ')"><i class="fas fa-times"></i> 拒绝</button>' +
                        '<button type="button" class="pp-offer-btn pp-offer-btn-accept" onclick="event.stopPropagation();ppAcceptOffer(\'tongGao\',' + idx + ')"><i class="fas fa-check"></i> 接下</button>' +
                    '</div>' +
                '</div>';
            }).join('') +
        '</div>' +
        '<div class="pp-refresh-btn" onclick="ppRefreshOffers(\'tongGao\')"><i class="fas fa-sync-alt"></i> 换一批</div>';
    });
}

// ====== 渲染接综艺页面 ======
function ppRenderZongYi(area){
    ppRenderLoading(area, '正在为你寻找综艺资源...');
    ppGenerateOffers('zongYi', function(items){
        if(!items || items.length === 0){
            area.innerHTML = '<div class="pp-empty-hint">暂时没有综艺资源，请稍后再试</div>';
            return;
        }
        area.innerHTML = '<div class="pp-offer-list">' +
            items.map(function(item, idx){
                var attrReqHtml = ppRenderAttrReqHtml(item, 'zongYi');
                return '<div class="pp-offer-card pp-offer-card-variety">' +
                    '<div class="pp-offer-header">' +
                        '<span class="pp-offer-type-badge pp-offer-type-variety">' + escapeHtml(item.type || '综艺') + '</span>' +
                        '<span class="pp-offer-stars">' + ppRenderStars(item.stars || 3) + '</span>' +
                    '</div>' +
                    '<div class="pp-offer-name">' + escapeHtml(item.name || '未命名节目') + '</div>' +
                    '<div class="pp-offer-role"><i class="fas fa-info-circle"></i> ' + escapeHtml(item.desc || '精彩综艺') + '</div>' +
                    '<div class="pp-offer-meta">' +
                        '<span><i class="fas fa-calendar"></i> ' + escapeHtml(item.schedule || '待定') + '</span>' +
                        '<span><i class="fas fa-coins"></i> ¥' + formatFans(item.pay || 0) + '</span>' +
                    '</div>' +
                    attrReqHtml +
                    '<div class="pp-offer-actions">' +
                        '<button type="button" class="pp-offer-btn pp-offer-btn-reject" onclick="event.stopPropagation();ppRejectOffer(\'zongYi\',' + idx + ')"><i class="fas fa-times"></i> 拒绝</button>' +
                        '<button type="button" class="pp-offer-btn pp-offer-btn-accept" onclick="event.stopPropagation();ppAcceptOffer(\'zongYi\',' + idx + ')"><i class="fas fa-check"></i> 接下</button>' +
                    '</div>' +
                '</div>';
            }).join('') +
        '</div>' +
        '<div class="pp-refresh-btn" onclick="ppRefreshOffers(\'zongYi\')"><i class="fas fa-sync-alt"></i> 换一批</div>';
    });
}

// ====== 渲染接代言页面 ======
function ppRenderDaiYan(area){
    ppRenderLoading(area, '正在为你匹配品牌代言...');
    ppGenerateOffers('daiYan', function(items){
        if(!items || items.length === 0){
            area.innerHTML = '<div class="pp-empty-hint">暂时没有代言机会，请稍后再试</div>';
            return;
        }
        area.innerHTML = '<div class="pp-offer-list">' +
            items.map(function(item, idx){
                var attrReqHtml = ppRenderAttrReqHtml(item, 'daiYan');
                return '<div class="pp-offer-card pp-offer-card-endorse">' +
                    '<div class="pp-offer-header">' +
                        '<span class="pp-offer-type-badge pp-offer-type-endorse">' + escapeHtml(item.type || '代言') + '</span>' +
                        '<span class="pp-offer-stars">' + ppRenderStars(item.stars || 3) + '</span>' +
                    '</div>' +
                    '<div class="pp-offer-name">' + escapeHtml(item.name || '未命名品牌') + '</div>' +
                    '<div class="pp-offer-role"><i class="fas fa-tag"></i> ' + escapeHtml(item.desc || '品牌合作') + '</div>' +
                    '<div class="pp-offer-meta">' +
                        '<span><i class="fas fa-calendar"></i> ' + escapeHtml(item.duration || '待定') + '</span>' +
                        '<span><i class="fas fa-coins"></i> ¥' + formatFans(item.pay || 0) + '</span>' +
                    '</div>' +
                    attrReqHtml +
                    '<div class="pp-offer-actions">' +
                        '<button type="button" class="pp-offer-btn pp-offer-btn-reject" onclick="event.stopPropagation();ppRejectOffer(\'daiYan\',' + idx + ')"><i class="fas fa-times"></i> 拒绝</button>' +
                        '<button type="button" class="pp-offer-btn pp-offer-btn-accept" onclick="event.stopPropagation();ppAcceptOffer(\'daiYan\',' + idx + ')"><i class="fas fa-check"></i> 接下</button>' +
                    '</div>' +
                '</div>';
            }).join('') +
        '</div>' +
        '<div class="pp-refresh-btn" onclick="ppRefreshOffers(\'daiYan\')"><i class="fas fa-sync-alt"></i> 换一批</div>';
    });
}

// ====== 渲染发博客页面 ======
function ppRenderBlog(area){
    ppRenderLoading(area, '正在为你策划博客内容...');
    ppGenerateOffers('blog', function(items){
        if(!items || items.length === 0){
            area.innerHTML = '<div class="pp-empty-hint">暂时没有灵感，请稍后再试</div>';
            return;
        }
        area.innerHTML = '<div class="pp-offer-list">' +
            items.map(function(item, idx){
                return '<div class="pp-offer-card pp-offer-card-blog">' +
                    '<div class="pp-offer-header">' +
                        '<span class="pp-offer-type-badge pp-offer-type-blog"><i class="fas fa-pen"></i> 博客</span>' +
                    '</div>' +
                    '<div class="pp-offer-name">' + escapeHtml(item.title || '发博客') + '</div>' +
                    '<div class="pp-offer-role"><i class="fas fa-align-left"></i> ' + escapeHtml(item.desc || '') + '</div>' +
                    '<div class="pp-offer-effect"><i class="fas fa-chart-line"></i> ' + escapeHtml(item.effect || '未知效果') + '</div>' +
                    '<div class="pp-offer-actions">' +
                        '<button type="button" class="pp-offer-btn pp-offer-btn-reject" onclick="event.stopPropagation();ppRejectOffer(\'blog\',' + idx + ')"><i class="fas fa-times"></i> 不发</button>' +
                        '<button type="button" class="pp-offer-btn pp-offer-btn-accept" onclick="event.stopPropagation();ppAcceptBlog(' + idx + ')"><i class="fas fa-paper-plane"></i> 发布</button>' +
                    '</div>' +
                '</div>';
            }).join('') +
        '</div>' +
        '<div class="pp-refresh-btn" onclick="ppRefreshOffers(\'blog\')"><i class="fas fa-sync-alt"></i> 换灵感</div>';
    });
}

// ====== 刷新offers ======
window.ppRefreshOffers = function(type){
    var d = store.paopao;
    if(d.cachedOffers) delete d.cachedOffers[type];
    if(d.lastOfferTime) delete d.lastOfferTime[type];
    save();
    ppRenderFuncContent();
};

// ====== 拒绝offer ======
window.ppRejectOffer = function(type, idx){
    var d = store.paopao;
    var items = d.cachedOffers && d.cachedOffers[type];
    if(!items || !items[idx]) return;
    var name = items[idx].name || items[idx].title || '该项目';
    showPpResult('❌ 已拒绝', '你拒绝了「' + name + '」', false);
    // 从缓存中移除该项
    items.splice(idx, 1);
    save();
    setTimeout(function(){ ppRenderFuncContent(); }, 800);
};

// ====== 计算offer的属性需求 ======
function ppCalcAttrRequirement(item){
    var stars = item.stars || 3;
    // 星级越高属性要求越高：1星=0, 2星=20, 3星=35, 4星=55, 5星=75
    var baseReq = stars <= 1 ? 0 : stars === 2 ? 20 : stars === 3 ? 35 : stars === 4 ? 55 : 75;
    // 根据类型确定主要需求属性
    var req = {};
    var type = item._offerType || 'tongGao';
    if(type === 'tongGao'){
        req.acting = baseReq;
        if(stars >= 4) req.charm = Math.floor(baseReq * 0.6);
        if(stars >= 5) req.looks = Math.floor(baseReq * 0.5);
    } else if(type === 'zongYi'){
        req.charm = baseReq;
        if(stars >= 3) req.social = Math.floor(baseReq * 0.7);
        if(stars >= 5) req.talent = Math.floor(baseReq * 0.5);
    } else { // daiYan
        req.looks = baseReq;
        if(stars >= 3) req.charm = Math.floor(baseReq * 0.7);
        if(stars >= 5) req.social = Math.floor(baseReq * 0.5);
    }
    return req;
}

// 检查属性是否满足要求
function ppCheckAttrRequirement(req){
    var d = store.paopao;
    if(!d.attrs || !req) return {met: true, details: []};
    var met = true;
    var details = [];
    for(var k in req){
        if(req[k] > 0 && d.attrs[k] !== undefined){
            var isMet = d.attrs[k] >= req[k];
            if(!isMet) met = false;
            details.push({attr: k, required: req[k], current: d.attrs[k], met: isMet});
        }
    }
    return {met: met, details: details};
}

// 渲染属性需求HTML
function ppRenderAttrReqHtml(item, type){
    item._offerType = type;
    var req = ppCalcAttrRequirement(item);
    var check = ppCheckAttrRequirement(req);
    if(check.details.length === 0) return '';
    
    var html = '<div class="pp-offer-attr-req">';
    html += '<div class="pp-offer-attr-req-title">' + (check.met ? '✅' : '⚠️') + ' 属性要求</div>';
    check.details.forEach(function(d){
        html += '<span class="pp-attr-req-item ' + (d.met ? 'met' : 'unmet') + '">' +
            PP_ATTR_ICONS[d.attr] + PP_ATTR_NAMES[d.attr] + ' ' + d.current + '/' + d.required +
        '</span>';
    });
    html += '</div>';
    return html;
}

// ====== 接受offer（通告/综艺/代言） ======
window.ppAcceptOffer = function(type, idx){
    var d = store.paopao;
    if(!d.activeJobs) d.activeJobs = [];
    var items = d.cachedOffers && d.cachedOffers[type];
    if(!items || !items[idx]) return;
    var item = items[idx];
    
    // 检查是否已有正在进行的通告（一个通告结束前不能接另一个）
    if(d.currentShootingJob){
        showPpResult('⚠️ 通告进行中', '「' + d.currentShootingJob.name + '」还在拍摄中，完成后才能接新通告', false);
        return;
    }
    
    // 检查属性要求（星级>=4时严格检查，低星级只提示）
    item._offerType = type;
    var req = ppCalcAttrRequirement(item);
    var check = ppCheckAttrRequirement(req);
    if(!check.met && (item.stars || 3) >= 4){
        var unmetList = check.details.filter(function(d){ return !d.met; }).map(function(d){
            return PP_ATTR_NAMES[d.attr] + '(' + d.current + '/' + d.required + ')';
        }).join('、');
        showPpResult('⚠️ 属性不足', '你的 ' + unmetList + ' 不满足这个大制作的要求！\n需要继续提升属性才能接下这个项目。', false);
        return;
    }
    
    // 解析工期
    var durationDays = 30; // 默认30天
    var durStr = item.duration || item.schedule || '1个月';
    var mMatch = durStr.match(/(\d+)\s*个?月/);
    var yMatch = durStr.match(/(\d+)\s*年/);
    var dMatch = durStr.match(/(\d+)\s*天/);
    var eMatch = durStr.match(/(\d+)\s*期/);
    if(yMatch) durationDays = parseInt(yMatch[1]) * 365;
    else if(mMatch) durationDays = parseInt(mMatch[1]) * 30;
    else if(eMatch && dMatch) durationDays = parseInt(eMatch[1]) * parseInt(dMatch[1]);
    else if(eMatch) durationDays = parseInt(eMatch[1]) * 2;
    else if(dMatch) durationDays = parseInt(dMatch[1]);
    
    // 为了游戏体验，缩短拍摄天数（但每天是一个场景）
    var shootingDays = Math.max(3, Math.min(10, Math.ceil(durationDays / 5)));
    
    var job = {
        id: 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2,4),
        type: type,
        name: item.name || item.title || '未命名',
        desc: item.role || item.desc || '',
        stars: item.stars || 3,
        duration: durStr,
        durationDays: durationDays,
        shootingDays: shootingDays, // 实际拍摄天数（场景数）
        currentDay: 0, // 当前拍摄第几天
        pay: item.pay || 0,
        startTime: Date.now(),
        status: 'shooting', // shooting/completed
        synopsis: '', // 剧本简述
        scenes: [], // 已完成的场景
        attrChanges: {}, // 累计属性变化
        fansChanges: 0, // 累计粉丝变化
        originalItem: item
    };
    
    // 设置当前拍摄工作
    d.currentShootingJob = job;
    
    // 从缓存中移除
    items.splice(idx, 1);
    save();
    
    // 进入拍摄页面
    ppEnterShootingPage(job);
};

// ====== 拍摄页面系统 ======
var ppShootingTimer = null;
var ppShootingCountdown = 0; // 当前场景倒计时（秒）

// 进入拍摄页面
function ppEnterShootingPage(job){
    var d = store.paopao;
    d.isShootingMinimized = false; // 进入拍摄页面，清除小窗标记
    // [FIX-弹窗重复] 进入拍摄页面时清除所有残留弹窗和触发锁
    _ppSceneTriggering = false;
    if(_ppSceneTriggerTimeout){ clearTimeout(_ppSceneTriggerTimeout); _ppSceneTriggerTimeout = null; }
    var existingScene = document.getElementById('pp-shooting-scene-popup');
    if(existingScene) existingScene.remove();
    var existingEvent = document.getElementById('pp-shooting-event-popup');
    if(existingEvent) existingEvent.remove();
    var area = document.getElementById('pp-tab-content');
    if(!area) return;
    
    // 如果是第一次进入（currentDay === 0），先生成剧本简述
    if(job.currentDay === 0 && !job.synopsis){
        ppRenderShootingPage(area, job, true); // 显示加载状态
        ppGenerateSynopsis(job, function(synopsis){
            job.synopsis = synopsis;
            d.currentShootingJob = job;
            save();
            ppRenderShootingPage(area, job, false);
            // 自动触发第一场戏
            setTimeout(function(){ ppTriggerShootingScene(job); }, 1500);
        });
    } else {
        ppRenderShootingPage(area, job, false);
        // 如果还没完成，触发当天的戏
        if(job.currentDay < job.shootingDays){
            setTimeout(function(){ ppTriggerShootingScene(job); }, 800);
        }
    }
}

// 渲染拍摄页面
function ppRenderShootingPage(area, job, isLoading){
    var d = store.paopao;
    var typeIcon = job.type === 'tongGao' ? '🎬' : job.type === 'zongYi' ? '📺' : '💎';
    var typeLabel = job.type === 'tongGao' ? '拍摄中' : job.type === 'zongYi' ? '录制中' : '拍摄中';
    var progressPct = job.shootingDays > 0 ? Math.floor((job.currentDay / job.shootingDays) * 100) : 0;
    var remainDays = job.shootingDays - job.currentDay;
    
    // 属性显示
    var attrsHtml = '';
    if(d.attrs){
        var attrKeys = ['acting','looks','wisdom','rhythm','charm','talent','social'];
        attrsHtml = '<div class="pp-shooting-attrs">' +
            attrKeys.map(function(k){
                var val = d.attrs[k] || 0;
                var change = (job.attrChanges && job.attrChanges[k]) || 0;
                var changeHtml = change !== 0 ? '<span class="pp-attr-change ' + (change > 0 ? 'positive' : 'negative') + '">' + (change > 0 ? '+' : '') + change + '</span>' : '';
                return '<div class="pp-shooting-attr-item">' +
                    '<span class="pp-shooting-attr-icon">' + PP_ATTR_ICONS[k] + '</span>' +
                    '<span class="pp-shooting-attr-name">' + PP_ATTR_NAMES[k] + '</span>' +
                    '<span class="pp-shooting-attr-val">' + val + changeHtml + '</span>' +
                '</div>';
            }).join('') +
        '</div>';
    }
    
    // 场景历史
    var scenesHtml = '';
    if(job.scenes && job.scenes.length > 0){
        scenesHtml = '<div class="pp-shooting-history">' +
            '<div class="pp-shooting-history-title"><i class="fas fa-history"></i> 已完成场景</div>' +
            job.scenes.map(function(s, idx){
                return '<div class="pp-shooting-history-item">' +
                    '<div class="pp-shooting-history-day">第' + (idx+1) + '场</div>' +
                    '<div class="pp-shooting-history-desc">' + escapeHtml(s.title || '') + '</div>' +
                    '<div class="pp-shooting-history-choice">' + escapeHtml(s.choice || '') + '</div>' +
                    '<div class="pp-shooting-history-result ' + (s.isPositive ? 'positive' : 'negative') + '">' + escapeHtml(s.resultText || '') + '</div>' +
                '</div>';
            }).join('') +
        '</div>';
    }
    
    // 粉丝变化显示
    var fansChangeHtml = '';
    if(job.fansChanges && job.fansChanges !== 0){
        fansChangeHtml = '<div class="pp-shooting-fans-change ' + (job.fansChanges > 0 ? 'positive' : 'negative') + '">' +
            '<i class="fas fa-heart"></i> 粉丝变化: ' + (job.fansChanges > 0 ? '+' : '') + formatFans(job.fansChanges) +
        '</div>';
    }
    
    area.innerHTML = '<div class="pp-shooting-page">' +
        // 顶部栏
        '<div class="pp-shooting-header">' +
            '<div class="pp-shooting-back" onclick="ppExitShooting()"><i class="fas fa-compress"></i></div>' +
            '<div class="pp-shooting-title">' + typeIcon + ' ' + escapeHtml(job.name) + ' ' + typeLabel + '</div>' +
            '<div class="pp-shooting-stars">' + ppRenderStars(job.stars || 3) + '</div>' +
        '</div>' +
        
        // 进度和倒计时
        '<div class="pp-shooting-progress-area">' +
            '<div class="pp-shooting-progress-bar">' +
                '<div class="pp-shooting-progress-fill" style="width:' + progressPct + '%"></div>' +
            '</div>' +
            '<div class="pp-shooting-progress-info">' +
                '<span>进度: ' + job.currentDay + '/' + job.shootingDays + ' 场</span>' +
                '<span>剩余: ' + remainDays + ' 场</span>' +
            '</div>' +
            '<div class="pp-shooting-countdown" id="pp-shooting-countdown"></div>' +
        '</div>' +
        
        // 属性面板
        attrsHtml +
        
        // 粉丝变化
        fansChangeHtml +
        
        // 剧本简述
        (job.synopsis ? '<div class="pp-shooting-synopsis">' +
            '<div class="pp-shooting-synopsis-title"><i class="fas fa-scroll"></i> 剧本简述</div>' +
            '<div class="pp-shooting-synopsis-text">' + escapeHtml(job.synopsis) + '</div>' +
        '</div>' : '') +
        
        // 加载状态
        (isLoading ? '<div class="pp-shooting-loading">' +
            '<div class="pp-loading-spinner"></div>' +
            '<div class="pp-loading-text">正在生成剧本...</div>' +
        '</div>' : '') +
        
        // 场景历史
        scenesHtml +
        
        // 片酬信息
        '<div class="pp-shooting-pay">' +
            '<i class="fas fa-coins"></i> 预计片酬: ¥' + formatFans(job.pay || 0) +
            ' · 工期: ' + escapeHtml(job.duration || '') +
        '</div>' +
        
        // 完成状态
        (job.currentDay >= job.shootingDays ? '<div class="pp-shooting-complete-area">' +
            '<div class="pp-shooting-complete-text">🎉 拍摄已全部完成！</div>' +
            '<button class="pp-shooting-complete-btn" onclick="ppFinishShooting()"><i class="fas fa-flag-checkered"></i> 杀青！</button>' +
        '</div>' : '') +
    '</div>';
}

// 生成剧本简述
function ppGenerateSynopsis(job, callback){
    _currentApiScene = 'paopao';
    var d = store.paopao;
    var typeText = job.type === 'tongGao' ? '影视作品' : job.type === 'zongYi' ? '综艺节目' : '品牌代言';
    var typeContext = '';
    if(job.type === 'tongGao'){
        typeContext = '类型：影视拍摄。作品名「' + job.name + '」，角色描述：' + (job.desc || '未知') + '，拍摄周期' + job.duration + '。请生成这部影视作品的剧情大纲/简述（100字以内），包括主要剧情走向和角色定位。';
    } else if(job.type === 'zongYi'){
        typeContext = '类型：综艺录制。节目名「' + job.name + '」，节目描述：' + (job.desc || '综艺节目') + '，录制周期' + job.duration + '。请生成这个综艺节目的节目概要/简述（100字以内），包括节目形式和艺人在节目中的定位。';
    } else {
        typeContext = '类型：品牌代言。品牌名「' + job.name + '」，品牌描述：' + (job.desc || '品牌合作') + '，合约周期' + job.duration + '。请生成这个代言合作的简述（100字以内），包括品牌调性和代言任务安排。';
    }
    
    if(!window.API || !API.chatCompletion){
        // 本地生成
        callback(ppLocalSynopsis(job));
        return;
    }
    
    API.chatCompletion([
        {role:'system', content:'你是娱乐圈模拟器剧本生成器。艺人「' + d.stageName + '」正在参与一个新项目。' + typeContext + '\n直接输出简述文本，不要JSON格式，不要多余的话。'},
        {role:'user', content:'请生成简述'}
    ], 0.9).then(function(data){
        var text = (data.choices[0].message.content || '').trim();
        if(text.length > 10){
            callback(text.substring(0, 200));
        } else {
            callback(ppLocalSynopsis(job));
        }
    }).catch(function(){
        callback(ppLocalSynopsis(job));
    });
}

// 本地生成剧本简述
function ppLocalSynopsis(job){
    if(job.type === 'tongGao'){
        var synopses = [
            '这是一部关于青春与梦想的故事。主角在逆境中成长，经历友情、爱情的考验，最终找到自己的人生方向。你将饰演' + (job.desc || '核心角色') + '，在跌宕起伏的剧情中展现精湛演技。',
            '一部悬疑烧脑大作，多条故事线交织，真相层层揭开。你饰演的角色有着不为人知的秘密，每一场戏都是心理博弈。',
            '都市情感大剧，讲述现代人在爱情与事业间的抉择。你的角色性格鲜明，从青涩到成熟的蜕变将是最大看点。',
            '古装传奇巨制，还原波澜壮阔的历史画卷。你饰演的角色肩负重任，在权谋与情义之间寻找平衡。',
            '温馨治愈系作品，以细腻的情感描写见长。你饰演的角色善良温暖，用真心感化身边的每一个人。'
        ];
        return synopses[Math.floor(Math.random() * synopses.length)];
    } else if(job.type === 'zongYi'){
        var synopses = [
            '一档充满欢笑与感动的综艺节目「' + job.name + '」。你将作为常驻嘉宾参与录制，每期都有不同的主题挑战，考验你的应变能力和综艺感。',
            '全新真人秀「' + job.name + '」即将开录！节目设置了各种趣味环节和互动游戏，你需要展现真实的自己，和其他嘉宾碰撞出火花。',
            '「' + job.name + '」是一档深受观众喜爱的综艺。你将在节目中展示才艺、参与游戏，与其他明星展开趣味竞技。',
            '沉浸式体验综艺「' + job.name + '」，你将体验不同的生活场景，从中感悟人生。节目注重情感共鸣和正能量传递。'
        ];
        return synopses[Math.floor(Math.random() * synopses.length)];
    } else {
        var synopses = [
            '「' + job.name + '」品牌看中了你的气质与影响力，希望通过这次合作提升品牌形象。你需要参与广告拍摄、品牌活动、社交媒体推广等一系列商务活动。',
            '作为「' + job.name + '」的代言人，你将成为品牌的形象担当。合作期间需要出席发布会、拍摄宣传片，并在社交媒体上进行品牌推广。',
            '「' + job.name + '」是一个注重品质的品牌，与你的个人形象高度契合。这次代言将包括平面广告、TVC拍摄和线下活动等。'
        ];
        return synopses[Math.floor(Math.random() * synopses.length)];
    }
}

// 触发拍摄场景（每天一场戏）
var _ppSceneTriggering = false; // [FIX-弹窗重复] 防重复触发锁
var _ppSceneTriggerTimeout = null; // [FIX] 锁超时兜底计时器
function ppTriggerShootingScene(job){
    _currentApiScene = 'paopao';
    var d = store.paopao;
    if(!d.currentShootingJob || job.currentDay >= job.shootingDays) return;
    
    // [FIX-弹窗重复] 如果正在触发中或已有弹窗显示，不再重复触发
    if(_ppSceneTriggering) return;
    var existingPopup = document.getElementById('pp-shooting-scene-popup') || document.getElementById('pp-shooting-event-popup');
    if(existingPopup) return;
    _ppSceneTriggering = true;
    // [MOD] 不做超时限制
    
    var dayNum = job.currentDay + 1;
    var typeText = job.type === 'tongGao' ? '影视' : job.type === 'zongYi' ? '综艺' : '商务';
    
    if(!window.API || !API.chatCompletion){
        ppShowShootingScenePopup(job, ppLocalShootingScene(job, dayNum));
        return;
    }
    
    // API生成场景
    var attrInfo = '';
    if(d.attrs){
        attrInfo = '艺人属性：演技' + (d.attrs.acting||50) + '、颜值' + (d.attrs.looks||50) + '、智慧' + (d.attrs.wisdom||50) + '、乐感' + (d.attrs.rhythm||50) + '、魅力' + (d.attrs.charm||50) + '、才华' + (d.attrs.talent||50) + '、人缘' + (d.attrs.social||50) + '。';
    }
    
    var scenePrompt = '';
    if(job.type === 'tongGao'){
        scenePrompt = '你是影视拍摄模拟器。艺人「' + d.stageName + '」正在拍摄「' + job.name + '」（' + job.desc + '）的第' + dayNum + '/' + job.shootingDays + '场戏。' + attrInfo + '\n请生成今天拍摄的一个场景事件，需要艺人做出选择。要符合影视拍摄的场景（如：对手戏表演方式、危险动作戏处理、和导演意见分歧、NG重拍策略等）。\n提供3个选项，每个选项会影响艺人的属性值（acting/looks/wisdom/rhythm/charm/talent/social中选1-2个）和粉丝量。';
    } else if(job.type === 'zongYi'){
        scenePrompt = '你是综艺录制模拟器。艺人「' + d.stageName + '」正在录制「' + job.name + '」（' + job.desc + '）的第' + dayNum + '/' + job.shootingDays + '期节目。' + attrInfo + '\n请生成今天录制的一个场景事件，需要艺人做出选择。要符合综艺节目的特点（如：游戏环节策略、才艺展示、搞笑互动、和其他嘉宾的配合等偏娱乐的场景）。\n提供3个选项，每个选项会影响艺人的属性值和粉丝量。';
    } else {
        scenePrompt = '你是品牌代言模拟器。艺人「' + d.stageName + '」正在为「' + job.name + '」（' + job.desc + '）进行第' + dayNum + '/' + job.shootingDays + '天的代言活动。' + attrInfo + '\n请生成今天活动的一个场景事件，需要艺人做出选择。要符合商务代言的特点（如：广告拍摄风格选择、品牌活动发言、社交媒体推广策略、商务谈判等偏商务的场景）。\n提供3个选项，每个选项会影响艺人的属性值和粉丝量。';
    }
    
    scenePrompt += '\n严格按以下JSON格式输出，不要其他文字：\n{"title":"场景标题15字内","desc":"场景描述50字内","options":[{"text":"选项描述20字内","attrChanges":{"acting":5,"charm":-3},"fansChange":500,"resultDesc":"选择后的结果描述30字内"},{"text":"选项2","attrChanges":{"looks":3},"fansChange":-200,"resultDesc":"结果描述"},{"text":"选项3","attrChanges":{"wisdom":2,"social":4},"fansChange":300,"resultDesc":"结果描述"}]}\nattrChanges中的key必须是acting/looks/wisdom/rhythm/charm/talent/social之一，值可正可负。fansChange可正可负。';
    
    API.chatCompletion([
        {role:'system', content: scenePrompt},
        {role:'user', content:'请生成第' + dayNum + '场的场景事件'}
    ], 0.95).then(function(data){
        var text = (data.choices[0].message.content || '').trim();
        try {
            var jsonMatch = text.match(/\{[\s\S]*\}/);
            if(jsonMatch){
                var scene = JSON.parse(jsonMatch[0]);
                if(scene.title && scene.options && scene.options.length >= 2){
                    ppShowShootingScenePopup(job, scene);
                    return;
                }
            }
        } catch(e){ console.error('拍摄场景JSON解析失败', e); }
        ppShowShootingScenePopup(job, ppLocalShootingScene(job, dayNum));
    }).catch(function(){
        ppShowShootingScenePopup(job, ppLocalShootingScene(job, dayNum));
    });
}

// 本地生成拍摄场景
function ppLocalShootingScene(job, dayNum){
    var d = store.paopao;
    var baseFans = Math.floor(d.fans * 0.005) + 200;
    
    if(job.type === 'tongGao'){
        var scenes = [
            {
                title: '🎬 重要对手戏', desc: '今天要拍一场和对手演员的感情爆发戏，导演要求一条过。你打算怎么处理？',
                options: [
                    {text: '全力投入情感，真情流露', attrChanges:{acting:5,charm:2}, fansChange: baseFans, resultDesc:'表演感人至深，全场鼓掌！'},
                    {text: '用技巧控制表演节奏', attrChanges:{acting:3,wisdom:3}, fansChange: Math.floor(baseFans*0.7), resultDesc:'表演精准到位，导演满意。'},
                    {text: '即兴发挥，加入自己的理解', attrChanges:{talent:4,acting:2}, fansChange: Math.floor(baseFans*1.2), resultDesc:'即兴发挥出彩，被称赞有灵气！'}
                ]
            },
            {
                title: '🎭 角色理解分歧', desc: '你对角色的理解和导演不同，导演要求你按他的方式来演。你要怎么办？',
                options: [
                    {text: '完全听从导演指导', attrChanges:{social:4}, fansChange: Math.floor(baseFans*0.5), resultDesc:'你的配合度获得好评。'},
                    {text: '委婉表达自己的想法', attrChanges:{wisdom:3,acting:2}, fansChange: baseFans, resultDesc:'导演采纳了你的建议，效果更好！'},
                    {text: '坚持自己的表演方式', attrChanges:{talent:5}, fansChange: -Math.floor(baseFans*0.3), resultDesc:'虽然和导演起了小摩擦，但表演有自己的风格。'}
                ]
            },
            {
                title: '💥 危险动作戏', desc: '今天有一场危险的打斗/追逐戏，可以选择用替身或自己上。',
                options: [
                    {text: '亲自上阵', attrChanges:{acting:6,charm:3}, fansChange: Math.floor(baseFans*1.5), resultDesc:'敬业精神令人敬佩，引发热议！'},
                    {text: '用替身，专注表情表演', attrChanges:{acting:2,looks:2}, fansChange: Math.floor(baseFans*0.5), resultDesc:'安全完成拍摄，效果不错。'},
                    {text: '和武术指导讨论安全方案后亲自拍', attrChanges:{wisdom:3,acting:4}, fansChange: baseFans, resultDesc:'既保证了安全又展现了敬业态度。'}
                ]
            },
            {
                title: '😰 连续NG', desc: '今天拍一场重要的哭戏，你已经NG了好几次，大家都在等你。',
                options: [
                    {text: '深呼吸，调整情绪再来', attrChanges:{acting:4,wisdom:2}, fansChange: baseFans, resultDesc:'终于进入状态，哭戏感染了所有人。'},
                    {text: '请求休息十分钟', attrChanges:{social:-1,acting:3}, fansChange: Math.floor(baseFans*0.3), resultDesc:'休息后状态好了很多，顺利完成。'},
                    {text: '回忆伤心往事引发真实情感', attrChanges:{acting:6,charm:2}, fansChange: Math.floor(baseFans*1.3), resultDesc:'真实的眼泪感动了全场！'}
                ]
            },
            {
                title: '📸 片场来访客', desc: '今天有媒体记者来片场探班采访，导演让你接受采访。',
                options: [
                    {text: '热情配合，展现亲和力', attrChanges:{social:4,charm:3}, fansChange: Math.floor(baseFans*1.2), resultDesc:'你的采访表现自然得体，好感度UP！'},
                    {text: '简短回答，尽快回去拍戏', attrChanges:{acting:2}, fansChange: Math.floor(baseFans*0.3), resultDesc:'敬业形象加分，但互动感不足。'},
                    {text: '分享幕后趣事，活跃气氛', attrChanges:{social:3,talent:2}, fansChange: baseFans, resultDesc:'你的分享让大家开怀大笑，路人好感UP！'}
                ]
            }
        ];
        return scenes[Math.floor(Math.random() * scenes.length)];
    } else if(job.type === 'zongYi'){
        var scenes = [
            {
                title: '🎮 游戏环节', desc: '今天的游戏环节需要你和搭档配合完成挑战，你打算怎么表现？',
                options: [
                    {text: '认真竞技，全力争胜', attrChanges:{rhythm:3,acting:2}, fansChange: baseFans, resultDesc:'你的认真态度和实力让观众印象深刻！'},
                    {text: '搞笑互动，制造综艺效果', attrChanges:{charm:4,social:3}, fansChange: Math.floor(baseFans*1.3), resultDesc:'你的搞笑天赋大爆发，笑点不断！'},
                    {text: '配合搭档，当好绿叶', attrChanges:{social:5}, fansChange: Math.floor(baseFans*0.6), resultDesc:'你的团队精神获得好评。'}
                ]
            },
            {
                title: '🎤 才艺展示', desc: '节目中需要你即兴展示一个才艺，你选择展示什么？',
                options: [
                    {text: '唱一首拿手歌曲', attrChanges:{rhythm:5,charm:2}, fansChange: Math.floor(baseFans*1.2), resultDesc:'歌声太美了，全场沉醉！'},
                    {text: '跳一段舞蹈', attrChanges:{looks:3,rhythm:3}, fansChange: baseFans, resultDesc:'舞姿优美，获得阵阵掌声！'},
                    {text: '讲一个搞笑故事', attrChanges:{social:4,wisdom:2}, fansChange: Math.floor(baseFans*0.8), resultDesc:'故事逗得大家捧腹大笑！'}
                ]
            },
            {
                title: '😂 整蛊环节', desc: '节目组安排了一个整蛊环节，你被其他嘉宾恶搞了！你怎么反应？',
                options: [
                    {text: '大方接受，配合节目效果', attrChanges:{charm:5,social:3}, fansChange: Math.floor(baseFans*1.5), resultDesc:'你的大度和幽默感圈了一大波粉！'},
                    {text: '假装生气，制造反转效果', attrChanges:{acting:4,talent:2}, fansChange: baseFans, resultDesc:'你的演技太逼真了，反转效果拉满！'},
                    {text: '现场报复回去', attrChanges:{social:2,charm:2}, fansChange: Math.floor(baseFans*0.7), resultDesc:'你的反击也很搞笑，互动效果不错！'}
                ]
            },
            {
                title: '💬 访谈环节', desc: '主持人问了一个关于你私生活的敏感问题，你怎么回答？',
                options: [
                    {text: '巧妙回避，转移话题', attrChanges:{wisdom:5,social:2}, fansChange: Math.floor(baseFans*0.8), resultDesc:'高情商回答获得好评！'},
                    {text: '坦诚分享，展现真实一面', attrChanges:{charm:4,social:3}, fansChange: Math.floor(baseFans*1.3), resultDesc:'你的坦诚打动了观众！'},
                    {text: '用幽默化解尴尬', attrChanges:{talent:3,charm:3}, fansChange: baseFans, resultDesc:'你的幽默感让全场笑翻！'}
                ]
            }
        ];
        return scenes[Math.floor(Math.random() * scenes.length)];
    } else { // daiYan
        var scenes = [
            {
                title: '📷 广告拍摄', desc: '今天要拍品牌广告大片，摄影师给了几种风格方案，你选哪种？',
                options: [
                    {text: '高冷时尚风格', attrChanges:{looks:5,charm:2}, fansChange: baseFans, resultDesc:'你的高冷气质完美诠释了品牌调性！'},
                    {text: '亲和自然风格', attrChanges:{social:3,charm:4}, fansChange: Math.floor(baseFans*1.2), resultDesc:'亲和力满满，消费者好感度大增！'},
                    {text: '提出自己的创意方案', attrChanges:{talent:4,wisdom:2}, fansChange: Math.floor(baseFans*0.8), resultDesc:'你的创意让品牌方眼前一亮！'}
                ]
            },
            {
                title: '🎙️ 品牌发布会', desc: '品牌新品发布会上你需要上台发言，你准备怎么表现？',
                options: [
                    {text: '背好台本，专业发言', attrChanges:{wisdom:4,social:2}, fansChange: Math.floor(baseFans*0.7), resultDesc:'发言稳重专业，品牌方很满意。'},
                    {text: '脱稿演讲，展现个人魅力', attrChanges:{charm:5,talent:3}, fansChange: Math.floor(baseFans*1.5), resultDesc:'你的个人魅力征服了全场！'},
                    {text: '和粉丝互动为主', attrChanges:{social:5,charm:2}, fansChange: Math.floor(baseFans*1.2), resultDesc:'粉丝们热情高涨，品牌曝光度UP！'}
                ]
            },
            {
                title: '📱 社交媒体推广', desc: '品牌要求你在社交媒体上发一条推广，你打算怎么做？',
                options: [
                    {text: '精心修图，高质量文案', attrChanges:{looks:3,talent:3}, fansChange: baseFans, resultDesc:'图文精美，获得大量转发点赞！'},
                    {text: '拍一个创意短视频', attrChanges:{talent:5,rhythm:2}, fansChange: Math.floor(baseFans*1.3), resultDesc:'短视频创意十足，播放量暴涨！'},
                    {text: '直播带货展示产品', attrChanges:{social:4,charm:3}, fansChange: Math.floor(baseFans*1.1), resultDesc:'直播效果很好，销量和口碑双丰收！'}
                ]
            },
            {
                title: '🤝 商务谈判', desc: '品牌方想续约并提高合作等级，但条件有变化，你怎么应对？',
                options: [
                    {text: '让经纪人全权处理', attrChanges:{wisdom:3}, fansChange: Math.floor(baseFans*0.5), resultDesc:'经纪人谈下了不错的条件。'},
                    {text: '亲自出席，展现诚意', attrChanges:{social:4,charm:3}, fansChange: baseFans, resultDesc:'你的诚意打动了品牌方，合作升级！'},
                    {text: '提出双赢的创新合作方案', attrChanges:{wisdom:5,talent:2}, fansChange: Math.floor(baseFans*1.2), resultDesc:'创新方案获得一致好评，品牌方刮目相看！'}
                ]
            }
        ];
        return scenes[Math.floor(Math.random() * scenes.length)];
    }
}

// 显示拍摄场景弹窗
function ppShowShootingScenePopup(job, scene){
    var d = store.paopao;
    var dayNum = job.currentDay + 1;
    var typeLabel = job.type === 'tongGao' ? '拍戏' : job.type === 'zongYi' ? '录制' : '活动';
    
    // [FIX-弹窗重复] 先移除所有已存在的拍摄相关弹窗，防止重复弹出
    var existingScene = document.getElementById('pp-shooting-scene-popup');
    if(existingScene) existingScene.remove();
    var existingEvent = document.getElementById('pp-shooting-event-popup');
    if(existingEvent) existingEvent.remove();
    // 移除可能残留的结果弹窗
    var existingResults = document.querySelectorAll('.pp-result-overlay:not(.pp-shooting-scene-overlay):not(.pp-shooting-event-overlay)');
    existingResults.forEach(function(el){ el.remove(); });
    
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay pp-shooting-scene-overlay';
    overlay.id = 'pp-shooting-scene-popup';
    overlay.innerHTML = '<div class="pp-shooting-scene-box">' +
        '<div class="pp-shooting-scene-header">' +
            '<span class="pp-shooting-scene-day">第' + dayNum + '场 ' + typeLabel + '</span>' +
            '<span class="pp-shooting-scene-total">' + dayNum + '/' + job.shootingDays + '</span>' +
        '</div>' +
        '<div class="pp-shooting-scene-title">' + escapeHtml(scene.title || '今日场景') + '</div>' +
        '<div class="pp-shooting-scene-desc">' + escapeHtml(scene.desc || '') + '</div>' +
        '<div class="pp-shooting-scene-options">' +
            (scene.options || []).map(function(opt, idx){
                // 显示属性变化预览
                var previewHtml = '';
                if(opt.attrChanges){
                    var changes = [];
                    for(var k in opt.attrChanges){
                        if(PP_ATTR_NAMES[k]){
                            var v = opt.attrChanges[k];
                            changes.push(PP_ATTR_ICONS[k] + (v > 0 ? '+' + v : v));
                        }
                    }
                    if(changes.length > 0) previewHtml += '<span class="pp-scene-preview-attrs">' + changes.join(' ') + '</span>';
                }
                if(opt.fansChange){
                    previewHtml += '<span class="pp-scene-preview-fans ' + (opt.fansChange > 0 ? 'positive' : 'negative') + '">' +
                        '<i class="fas fa-heart"></i> ' + (opt.fansChange > 0 ? '+' : '') + formatFans(opt.fansChange) + '</span>';
                }
                
                return '<div class="pp-shooting-scene-option" onclick="ppChooseShootingOption(' + idx + ')">' +
                    '<div class="pp-shooting-option-text">' + escapeHtml(opt.text || '选项' + (idx+1)) + '</div>' +
                    (previewHtml ? '<div class="pp-shooting-option-preview">' + previewHtml + '</div>' : '') +
                '</div>';
            }).join('') +
        '</div>' +
    '</div>';
    
    // 保存场景数据供选择时使用
    window._ppCurrentScene = scene;
    _ppSceneTriggering = false; // [FIX-弹窗重复] 弹窗已显示，解除触发锁
    if(_ppSceneTriggerTimeout){ clearTimeout(_ppSceneTriggerTimeout); _ppSceneTriggerTimeout = null; }
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
}

// 选择拍摄场景选项
window.ppChooseShootingOption = function(idx){
    var d = store.paopao;
    var job = d.currentShootingJob;
    if(!job) return;
    var scene = window._ppCurrentScene;
    if(!scene || !scene.options || !scene.options[idx]) return;
    
    var opt = scene.options[idx];
    
    // 应用属性变化
    if(opt.attrChanges && d.attrs){
        for(var k in opt.attrChanges){
            if(d.attrs[k] !== undefined){
                var change = opt.attrChanges[k] || 0;
                d.attrs[k] = Math.max(0, Math.min(100, d.attrs[k] + change));
                // 记录累计变化
                if(!job.attrChanges) job.attrChanges = {};
                job.attrChanges[k] = (job.attrChanges[k] || 0) + change;
            }
        }
    }
    
    // 应用粉丝变化
    var fansChange = opt.fansChange || 0;
    d.fans = Math.max(0, d.fans + fansChange);
    d.tier = calcTier(d.fans);
    job.fansChanges = (job.fansChanges || 0) + fansChange;
    
    // 记录场景
    var isPositive = fansChange >= 0;
    var resultText = (opt.resultDesc || '场景已完成');
    if(fansChange !== 0){
        resultText += ' | 粉丝' + (fansChange > 0 ? '+' : '') + formatFans(fansChange);
    }
    if(opt.attrChanges){
        var changeTexts = [];
        for(var k in opt.attrChanges){
            if(PP_ATTR_NAMES[k]){
                var v = opt.attrChanges[k];
                changeTexts.push(PP_ATTR_NAMES[k] + (v > 0 ? '+' + v : v));
            }
        }
        if(changeTexts.length > 0) resultText += ' | ' + changeTexts.join(' ');
    }
    
    if(!job.scenes) job.scenes = [];
    job.scenes.push({
        day: job.currentDay + 1,
        title: scene.title || '',
        desc: scene.desc || '',
        choice: opt.text || '',
        resultText: resultText,
        isPositive: isPositive,
        attrChanges: opt.attrChanges || {},
        fansChange: fansChange
    });
    
    // 推进天数
    job.currentDay++;
    d.currentShootingJob = job;
    save();
    
    // 关闭弹窗
    var popup = document.getElementById('pp-shooting-scene-popup');
    if(popup) popup.remove();
    window._ppCurrentScene = null;
    
    // 更新粉丝显示
    var fansEl = document.querySelector('.pp-nav-fans');
    if(fansEl) fansEl.innerHTML = '<i class="fas fa-heart"></i> ' + formatFans(d.fans);
    
    // 显示结果提示
    showPpResult(
        isPositive ? '✅ 第' + job.currentDay + '场完成' : '⚠️ 第' + job.currentDay + '场完成',
        resultText,
        isPositive
    );
    
    // [FIX-弹窗重复] 刷新拍摄页面（仅在未小窗时触发下一场）
    // 延迟需确保结果弹窗（3秒自动消失）先消失后，再触发下一场弹窗
    var area = document.getElementById('pp-tab-content');
    if(area && !d.isShootingMinimized){
        setTimeout(function(){
            ppRenderShootingPage(area, job, false);
            // 如果还有场景，尝试触发随机事件或下一场
            if(job.currentDay < job.shootingDays){
                // 拍摄过程中有概率触发随机事件（20%概率）
                if(Math.random() < 0.2 && !d.pendingEvent){
                    setTimeout(function(){ ppTriggerShootingRandomEvent(job); }, 800);
                } else {
                    setTimeout(function(){ ppTriggerShootingScene(job); }, 1000);
                }
            }
        }, 3200);
    } else if(area){
        // 小窗模式下只更新页面不触发新场景
        setTimeout(function(){
            ppRenderShootingPage(area, job, false);
        }, 1500);
    }
};

// 小窗退出拍摄页面（回到其他界面，但通告不中断，不触发随机事件）
window.ppExitShooting = function(){
    var d = store.paopao;
    // 不清除currentShootingJob，只是回到功能页
    d.isShootingMinimized = true; // 标记小窗模式，不触发随机事件
    save();
    activeTab = 'activity';
    var items = document.querySelectorAll('.pp-bottom-item');
    items.forEach(function(it){ it.classList.remove('active'); });
    // 手动高亮功能tab
    var activityBtn = document.querySelector('.pp-bottom-item:nth-child(2)');
    if(activityBtn) activityBtn.classList.add('active');
    ppRenderTab();
};

// 杀青（完成拍摄）
window.ppFinishShooting = function(){
    var d = store.paopao;
    var job = d.currentShootingJob;
    if(!job) return;
    
    // 记录到工作历史
    if(!d.jobHistory) d.jobHistory = [];
    var totalFansChange = job.fansChanges || 0;
    
    // 根据表现评定结果
    var avgAttrGain = 0;
    var attrCount = 0;
    if(job.attrChanges){
        for(var k in job.attrChanges){
            avgAttrGain += job.attrChanges[k];
            attrCount++;
        }
    }
    
    // 属性加成：制作越大（星级越高），属性满足度越高，涨粉和爆火概率越大
    var stars = job.stars || 3;
    var attrBonus = 1.0; // 属性加成系数
    if(d.attrs){
        var mainAttr = job.type === 'tongGao' ? 'acting' : job.type === 'zongYi' ? 'charm' : 'looks';
        var mainVal = d.attrs[mainAttr] || 50;
        // 主属性越高，加成越大（最高2倍）
        attrBonus = 0.5 + (mainVal / 100) * 1.5;
        // 高星级项目属性加成效果更明显
        attrBonus = 1 + (attrBonus - 1) * (stars / 3);
    }
    // 星级加成：星级越高基础倍率越大
    var starMultiplier = 0.5 + stars * 0.4; // 1星=0.9, 3星=1.7, 5星=2.5
    
    var resultText = '';
    var resultEmoji = '';
    var bonusFans = 0;
    var bonusMoney = job.pay || 0;
    
    // 爆火概率：高星级+高属性=更高爆火率
    var fireChance = Math.min(0.6, 0.05 + stars * 0.06 + (attrBonus - 1) * 0.15);
    var goodChance = fireChance + Math.min(0.35, 0.15 + stars * 0.04);
    var roll = Math.random();
    
    if(roll < fireChance || (avgAttrGain > 15 && totalFansChange > 3000)){
        resultText = '🔥 大爆！作品口碑炸裂，全网热议！';
        resultEmoji = '🔥';
        bonusFans = Math.floor((d.fans * 0.08 + 8000) * starMultiplier * attrBonus);
        bonusMoney += Math.floor(bonusMoney * 0.8);
    } else if(roll < goodChance || (avgAttrGain > 5 && totalFansChange > 1000)){
        resultText = '✨ 小火，口碑不错，收获好评！';
        resultEmoji = '✨';
        bonusFans = Math.floor((d.fans * 0.03 + 3000) * starMultiplier * attrBonus);
        bonusMoney += Math.floor(bonusMoney * 0.3);
    } else if(roll < 0.85 || avgAttrGain >= 0){
        resultText = '😊 中规中矩，顺利杀青。';
        resultEmoji = '😊';
        bonusFans = Math.floor((d.fans * 0.01 + 800) * starMultiplier);
    } else {
        resultText = '😔 表现欠佳，反响平平...';
        resultEmoji = '😔';
        bonusFans = -Math.floor(d.fans * 0.01 + 500);
    }
    
    d.fans = Math.max(0, d.fans + bonusFans);
    d.money = Math.max(0, d.money + bonusMoney);
    d.tier = calcTier(d.fans);
    
    // 添加到作品/活动历史
    if(job.type === 'tongGao'){
        d.works.push({name: job.name, type: 'drama', fans: totalFansChange + bonusFans, date: Date.now(), result: resultText});
    } else {
        d.completedActivities.push({name: job.name, type: job.type, fans: totalFansChange + bonusFans, date: Date.now(), result: resultText});
    }
    
    d.jobHistory.push({
        name: job.name,
        type: job.type,
        stars: job.stars,
        result: resultText,
        fansChange: totalFansChange + bonusFans,
        moneyChange: bonusMoney,
        date: Date.now()
    });
    
    // 保存job引用（用于生成故事）
    var finishedJob = JSON.parse(JSON.stringify(job));
    
    // 清除当前拍摄工作
    d.currentShootingJob = null;
    d.isShootingMinimized = false;
    save();
    
    // 显示杀青结果
    var finalText = resultText + '\n片酬：¥' + formatFans(bonusMoney);
    if(bonusFans > 0) finalText += '\n杀青涨粉 +' + formatFans(bonusFans);
    else if(bonusFans < 0) finalText += '\n杀青掉粉 -' + formatFans(Math.abs(bonusFans));
    finalText += '\n拍摄期间总粉丝变化: ' + (totalFansChange >= 0 ? '+' : '') + formatFans(totalFansChange);
    
    showPpResult(resultEmoji + ' 「' + finishedJob.name + '」杀青！', finalText, bonusFans >= 0);
    
    // 更新粉丝显示
    var fansEl = document.querySelector('.pp-nav-fans');
    if(fansEl) fansEl.innerHTML = '<i class="fas fa-heart"></i> ' + formatFans(d.fans);
    
    // 生成500字剧本总结故事
    setTimeout(function(){
        ppGenerateWrapStory(finishedJob, resultText);
    }, 3000);
    
    // 回到功能页
    setTimeout(function(){ ppExitShooting(); }, 2500);
};

// ====== 杀青后生成500字剧本总结小故事 ======
function ppGenerateWrapStory(job, resultText){
    _currentApiScene = 'paopao';
    var d = store.paopao;
    var typeText = job.type === 'tongGao' ? '影视作品' : job.type === 'zongYi' ? '综艺节目' : '品牌代言';
    
    // 收集场景信息
    var scenesSummary = '';
    if(job.scenes && job.scenes.length > 0){
        scenesSummary = job.scenes.map(function(s, i){
            return '第' + (i+1) + '场：' + (s.title||'') + '，选择了「' + (s.choice||'') + '」，' + (s.resultText||'');
        }).join('；');
    }
    
    if(window.API && API.chatCompletion){
        var prompt = '你是一位优秀的故事编辑。请为以下' + typeText + '写一个500字左右的总结小故事，像一个完整的小说梗概/剧情回顾。\n\n' +
            '作品名称：「' + job.name + '」\n' +
            '类型：' + typeText + '\n' +
            '艺人：' + d.stageName + '（' + (d.gender === 'male' ? '男' : '女') + '）\n' +
            '角色/描述：' + (job.desc || '未知') + '\n' +
            '星级：' + (job.stars||3) + '星\n' +
            '剧本简述：' + (job.synopsis || '') + '\n' +
            '拍摄过程中的场景记录：' + scenesSummary + '\n' +
            '最终结果：' + resultText + '\n\n' +
            '要求：\n1. 写成一个有起承转合的完整小故事\n2. 字数控制在450-550字\n3. 要融入拍摄过程中的选择和事件\n4. 如果是影视作品，写这部作品讲述的故事梗概；如果是综艺，写参与综艺的体验故事；如果是代言，写代言合作的经历故事\n5. 文笔优美，有画面感\n6. 直接输出故事文本，不要标题和其他格式';
        
        API.chatCompletion([
            {role:'system', content: prompt},
            {role:'user', content:'请生成500字总结故事'}
        ], 0.9).then(function(data){
            var text = (data.choices[0].message.content || '').trim();
            if(text.length > 100){
                ppShowWrapStoryPopup(job, text);
            } else {
                ppShowWrapStoryPopup(job, ppLocalWrapStory(job, resultText));
            }
        }).catch(function(){
            ppShowWrapStoryPopup(job, ppLocalWrapStory(job, resultText));
        });
    } else {
        ppShowWrapStoryPopup(job, ppLocalWrapStory(job, resultText));
    }
}

// 本地生成杀青总结故事
function ppLocalWrapStory(job, resultText){
    var d = store.paopao;
    var name = d.stageName || '小星星';
    var gender = d.gender === 'male' ? '他' : '她';
    var jobName = job.name || '未命名';
    var desc = job.desc || '一个重要角色';
    var synopsis = job.synopsis || '';
    
    if(job.type === 'tongGao'){
        var stories = [
            '从接到「' + jobName + '」剧本的那一刻起，' + name + '就知道这将是一段不平凡的旅程。' + gender + '饰演的是' + desc + '，一个充满矛盾和挣扎的角色。\n\n' +
            '开拍的第一天，' + name + '站在片场，面对着摄像机镜头，心中涌起一股莫名的紧张。但随着导演一声"开始"，' + gender + '仿佛化身为角色本身，将所有的情感倾注在每一个眼神、每一句台词之中。' + (synopsis ? '\n\n' + synopsis + '\n\n' : '\n\n') +
            '拍摄期间，' + name + '经历了无数次的挑战。有时候一场戏要拍十几遍才能达到导演的要求，有时候为了一个完美的镜头要在寒风中站上几个小时。但' + gender + '从未放弃，每一次NG都让' + gender + '更加深入地理解角色。\n\n' +
            '让' + name + '印象最深的是一场关键的情感爆发戏。那天' + gender + '完全沉浸在角色的世界里，泪水不受控制地流下，全场工作人员都被' + gender + '的表演打动了。导演喊"卡"之后，片场响起了热烈的掌声。\n\n' +
            '杀青那天，' + name + '站在片场，回望这段旅程——' + resultText + '。' + gender + '知道，这部作品将成为' + gender + '演艺生涯中浓墨重彩的一笔。不管未来会面对怎样的挑战，这段经历都会成为' + gender + '最珍贵的回忆。' + gender + '轻轻地拥抱了剧组的每一个人，带着不舍和感激，踏上了新的征程。',
            
            '「' + jobName + '」的故事，始于一个平凡而又特别的清晨。' + name + '坐在化妆间里，看着镜中逐渐变化的自己，从一个普通人蜕变成了故事中的' + desc + '。\n\n' +
            '这个角色，与' + name + '有着某种奇妙的共鸣。' + gender + '在表演中找到了角色内心深处的声音，用自己的方式诠释着每一个瞬间。' + (synopsis ? synopsis + '\n\n' : '') +
            '拍摄的日子既充实又漫长。每天凌晨的早起，深夜的收工，无数次的排练和修改。' + name + '却乐在其中，因为' + gender + '能感受到自己在每一天都在成长。\n\n' +
            '有一场戏让所有人都记忆犹新——那是一场需要极大情感张力的对手戏。' + name + '和对手演员在无数次的磨合后，终于找到了最佳的表演节奏。镜头记录下了那个震撼人心的瞬间。\n\n' +
            '从第一场到最后一场，' + name + '经历了' + job.shootingDays + '场戏的磨砺。' + resultText + '。当杀青的那一刻真正到来时，' + name + '的眼眶不禁湿润了。这不只是一部作品的结束，更是一段人生经历的完成。' + gender + '知道，最好的自己永远在下一个角色里。'
        ];
        return stories[Math.floor(Math.random() * stories.length)];
    } else if(job.type === 'zongYi'){
        return '接到「' + jobName + '」的邀请时，' + name + '既兴奋又忐忑。这是一档' + (desc||'充满挑战的综艺节目') + '，' + gender + '将要在镜头前展现最真实的自己。\n\n' +
            '第一天录制，' + name + '有些放不开。面对其他经验丰富的嘉宾，' + gender + '显得有些拘谨。但随着节目的推进，' + gender + '逐渐找到了自己的节奏。' + (synopsis ? '\n\n' + synopsis + '\n\n' : '\n\n') +
            '最难忘的是其中一期的挑战环节。' + name + '被要求完成一个看似不可能的任务，所有人都以为' + gender + '会放弃。但' + name + '咬紧牙关，拿出了全部的勇气和智慧，最终出色地完成了挑战。那一刻，全场响起了雷鸣般的掌声。\n\n' +
            '在综艺舞台上，' + name + '学会了如何在镜头前做真实的自己。' + gender + '发现，观众喜欢的不是完美无缺的偶像，而是有血有肉、有欢笑有泪水的真实人。\n\n' +
            '录制结束那天，' + name + '和节目组的工作人员一一拥抱告别。' + resultText + '。这段综艺之旅不仅给' + gender + '带来了粉丝和关注，更让' + gender + '收获了珍贵的友谊和成长。\n\n' +
            '回首这段经历，' + name + '感慨万千。' + gender + '知道，这个舞台见证了' + gender + '的蜕变，也让无数观众记住了那个勇敢、真诚的' + gender + '。未来还有更大的舞台等着' + gender + '去闪耀。';
    } else {
        return '与「' + jobName + '」的缘分，始于一次偶然的机会。品牌方看中了' + name + '身上那份独特的气质，这正是他们品牌所追求的精神内核。\n\n' +
            '第一天来到拍摄基地，' + name + '被精心布置的场景所震撼。' + (desc||'这是一个注重品质的品牌') + '，每一个细节都追求完美。' + gender + '知道，自己需要用最好的状态来诠释品牌精神。' + (synopsis ? '\n\n' + synopsis + '\n\n' : '\n\n') +
            '广告拍摄的过程既专业又有趣。摄影师用镜头捕捉着' + name + '最自然的表情和姿态，' + gender + '在镜头前展现出了惊人的表现力。一组组照片被拍下来，每一张都充满了故事感和感染力。\n\n' +
            '最让' + name + '感动的是品牌方的诚意。他们不仅仅把' + gender + '当作一个代言人，更是当作品牌精神的传递者。双方在合作中建立了深厚的信任和默契。\n\n' +
            resultText + '。这次代言合作让' + name + '对商业合作有了更深的理解——好的代言不只是站在那里微笑，而是要真正理解品牌、感受品牌、成为品牌的一部分。\n\n' +
            '带着这段美好的合作经历，' + name + '的商业价值也在不断攀升。' + gender + '期待着未来能遇到更多志同道合的品牌伙伴，一起创造更多精彩的故事。';
    }
}

// 显示杀青故事弹窗
function ppShowWrapStoryPopup(job, story){
    var typeIcon = job.type === 'tongGao' ? '🎬' : job.type === 'zongYi' ? '📺' : '💎';
    var typeLabel = job.type === 'tongGao' ? '作品回顾' : job.type === 'zongYi' ? '节目回顾' : '合作回顾';
    
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay pp-story-overlay';
    overlay.id = 'pp-story-popup';
    overlay.innerHTML = '<div class="pp-story-box">' +
        '<div class="pp-story-header">' +
            '<span class="pp-story-icon">' + typeIcon + '</span>' +
            '<span class="pp-story-title">「' + escapeHtml(job.name) + '」' + typeLabel + '</span>' +
        '</div>' +
        '<div class="pp-story-content">' + escapeHtml(story).replace(/\n/g, '<br>') + '</div>' +
        '<div class="pp-story-footer">' +
            '<div class="pp-story-stars">' + ppRenderStars(job.stars || 3) + '</div>' +
            '<button class="pp-story-close-btn" onclick="document.getElementById(\'pp-story-popup\').remove()"><i class="fas fa-check"></i> 收录到作品集</button>' +
        '</div>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
    
    // 保存故事到作品历史
    var d = store.paopao;
    if(d.jobHistory && d.jobHistory.length > 0){
        d.jobHistory[d.jobHistory.length - 1].story = story;
        save();
    }
}

// 恢复拍摄（如果有正在进行的拍摄工作，在功能页显示入口）
function ppHasActiveShooting(){
    var d = store.paopao;
    return d.currentShootingJob && d.currentShootingJob.status === 'shooting';
}

// 从功能页重新进入拍摄（恢复拍摄，清除小窗模式）
window.ppResumeShooting = function(){
    var d = store.paopao;
    if(!d.currentShootingJob) return;
    d.isShootingMinimized = false; // 恢复拍摄，清除小窗标记
    save();
    ppEnterShootingPage(d.currentShootingJob);
};

// ====== 接受博客 ======
window.ppAcceptBlog = function(idx){
    var d = store.paopao;
    var items = d.cachedOffers && d.cachedOffers['blog'];
    if(!items || !items[idx]) return;
    var item = items[idx];
    
    // 博客立即产生效果，通过API生成结果
    ppGenerateBlogResult(item, function(result){
        var fansChange = result.fansChange || 0;
        var moneyChange = result.moneyChange || 0;
        
        d.fans = Math.max(0, d.fans + fansChange);
        d.money = Math.max(0, d.money + moneyChange);
        d.tier = calcTier(d.fans);
        
        d.blogPosts.push({
            title: item.title || '博客',
            likes: Math.floor(Math.abs(fansChange) * (Math.random() * 3 + 1)),
            comments: Math.floor(Math.abs(fansChange) * (Math.random() * 0.5 + 0.1)),
            reposts: Math.floor(Math.abs(fansChange) * (Math.random() * 0.3 + 0.05)),
            date: Date.now()
        });
        
        // 从缓存中移除
        items.splice(idx, 1);
        save();
        
        var resultText = result.description || '博客已发布';
        if(fansChange > 0) resultText += '\n涨粉 +' + formatFans(fansChange);
        else if(fansChange < 0) resultText += '\n掉粉 -' + formatFans(Math.abs(fansChange));
        if(moneyChange > 0) resultText += '，收入 +¥' + formatFans(moneyChange);
        
        showPpResult(fansChange >= 0 ? '📝 发布成功' : '📝 效果不佳', resultText, fansChange >= 0);
        
        var fansEl = document.querySelector('.pp-nav-fans');
        if(fansEl) fansEl.innerHTML = '<i class="fas fa-heart"></i> ' + formatFans(d.fans);
        
        setTimeout(function(){ ppRenderFuncContent(); }, 1500);
    });
};

// ====== 生成博客结果 ======
function ppGenerateBlogResult(item, callback){
    _currentApiScene = 'paopao';
    var d = store.paopao;
    var tierText = d.tier || '十八线';
    
    if(!window.API || !API.chatCompletion){
        // 本地随机生成
        var r = Math.random();
        var fansBase = Math.floor(d.fans * 0.01) + 100;
        if(r < 0.6){
            callback({fansChange: Math.floor(fansBase * (Math.random()+0.5)), moneyChange: Math.floor(Math.random()*5000), description:'博客反响不错！'});
        } else if(r < 0.85){
            callback({fansChange: Math.floor(fansBase * (Math.random()*3+1)), moneyChange: Math.floor(Math.random()*20000), description:'博客火了！引发热议！'});
        } else {
            callback({fansChange: -Math.floor(fansBase * (Math.random()*0.5+0.2)), moneyChange: 0, description:'博客引发争议，部分粉丝脱粉...'});
        }
        return;
    }
    
    API.chatCompletion([
        {role:'system', content:'你是娱乐圈模拟器。艺人「' + d.stageName + '」（咖位：' + tierText + '，粉丝：' + formatFans(d.fans) + '）刚刚发了一条博客：「' + (item.title||'') + ' - ' + (item.desc||'') + '」。\n请生成博客发布后的结果。要求随机性强，可能火爆也可能翻车。\n严格按以下JSON格式输出，不要其他文字：\n{"fansChange":1000,"moneyChange":5000,"description":"结果描述20字以内"}\nfansChange可以是正数（涨粉）或负数（掉粉）'},
        {role:'user', content:'请生成结果'}
    ], 0.95).then(function(data){
        var text = (data.choices[0].message.content || '').trim();
        try {
            var jsonMatch = text.match(/\{[\s\S]*\}/);
            if(jsonMatch){
                var result = JSON.parse(jsonMatch[0]);
                callback(result);
                return;
            }
        } catch(e){}
        // fallback
        var fansBase = Math.floor(d.fans * 0.01) + 100;
        callback({fansChange: Math.floor(fansBase * Math.random()), moneyChange: Math.floor(Math.random()*5000), description:'博客已发布'});
    }).catch(function(){
        var fansBase = Math.floor(d.fans * 0.01) + 100;
        callback({fansChange: Math.floor(fansBase * Math.random()), moneyChange: Math.floor(Math.random()*5000), description:'博客已发布'});
    });
}

// ====== 工作进度定时器 ======
var ppJobTimers = {};

function ppStartJobTimer(jobId){
    if(ppJobTimers[jobId]) return;
    ppJobTimers[jobId] = setInterval(function(){
        var d = store.paopao;
        if(!d.activeJobs) return;
        var job = d.activeJobs.find(function(j){ return j.id === jobId; });
        if(!job){
            clearInterval(ppJobTimers[jobId]);
            delete ppJobTimers[jobId];
            return;
        }
        
        var elapsed = Date.now() - job.startTime;
        job.progress = Math.min(100, Math.floor((elapsed / job.durationMs) * 100));
        
        // 随机触发特殊事件（每次检查有5%概率）
        if(job.status === 'active' && Math.random() < 0.05 && !d.pendingEvent){
            ppTriggerRandomEvent(job);
        }
        
        // 工作完成
        if(job.progress >= 100){
            job.status = 'completed';
            clearInterval(ppJobTimers[jobId]);
            delete ppJobTimers[jobId];
            ppCompleteJob(job);
        }
        
        save();
        // 更新UI（如果正在查看进行中工作）
        var activeJobsPanel = document.getElementById('pp-active-jobs-panel');
        if(activeJobsPanel){
            ppRenderActiveJobsContent(activeJobsPanel);
        }
    }, 2000); // 每2秒检查一次
}

// ====== 恢复所有活跃工作的定时器 ======
function ppResumeJobTimers(){
    var d = store.paopao;
    if(!d.activeJobs) return;
    d.activeJobs.forEach(function(job){
        if(job.status === 'active'){
            // 更新进度
            var elapsed = Date.now() - job.startTime;
            job.progress = Math.min(100, Math.floor((elapsed / job.durationMs) * 100));
            if(job.progress >= 100){
                job.status = 'completed';
                ppCompleteJob(job);
            } else {
                ppStartJobTimer(job.id);
            }
        }
    });
}

// ====== 触发随机特殊事件 ======
function ppTriggerRandomEvent(job){
    _currentApiScene = 'paopao';
    var d = store.paopao;
    
    if(!window.API || !API.chatCompletion){
        // 本地生成事件
        ppTriggerLocalEvent(job);
        return;
    }
    
    var typeText = job.type === 'tongGao' ? '影视通告' : job.type === 'zongYi' ? '综艺节目' : '品牌代言';
    
    API.chatCompletion([
        {role:'system', content:'你是娱乐圈模拟器事件生成器。艺人「' + d.stageName + '」（咖位：' + d.tier + '，粉丝：' + formatFans(d.fans) + '）正在拍摄/录制「' + job.name + '」（' + typeText + '）。\n请生成一个随机特殊事件，并提供3个选项让用户选择。事件可以是正面的（被导演赏识、获奖提名等）也可以是负面的（黑料曝光、片场事故、绯闻等）。\n严格按以下JSON格式输出：\n{"title":"事件标题","desc":"事件描述50字内","options":[{"text":"选项1描述","fansChange":1000,"moneyChange":5000,"extraDesc":"选择后的结果描述"},{"text":"选项2描述","fansChange":-500,"moneyChange":0,"extraDesc":"选择后的结果描述"},{"text":"选项3描述","fansChange":200,"moneyChange":2000,"extraDesc":"选择后的结果描述"}]}\nfansChange可正可负，体现不同选择的后果。'},
        {role:'user', content:'请生成一个随机事件'}
    ], 0.95).then(function(data){
        var text = (data.choices[0].message.content || '').trim();
        try {
            var jsonMatch = text.match(/\{[\s\S]*\}/);
            if(jsonMatch){
                var evt = JSON.parse(jsonMatch[0]);
                if(evt.title && evt.options && evt.options.length >= 2){
                    d.pendingEvent = {
                        id: 'evt_' + Date.now(),
                        jobId: job.id,
                        jobName: job.name,
                        title: evt.title,
                        desc: evt.desc || '',
                        options: evt.options.slice(0,3),
                        time: Date.now()
                    };
                    save();
                    ppShowEventPopup(d.pendingEvent);
                    return;
                }
            }
        } catch(e){ console.error('事件JSON解析失败', e); }
        // fallback
        ppTriggerLocalEvent(job);
    }).catch(function(){
        ppTriggerLocalEvent(job);
    });
}

// ====== 本地生成特殊事件 ======
function ppTriggerLocalEvent(job){
    var d = store.paopao;
    var events = [
        {
            title: '🎬 导演赏识', desc: '导演对你的表演非常满意，想给你加戏！',
            options: [
                {text: '欣然接受加戏', fansChange: Math.floor(d.fans*0.02)+500, moneyChange: 20000, extraDesc:'你的戏份增加了，表现获得好评！'},
                {text: '婉拒，保持原定计划', fansChange: 0, moneyChange: 0, extraDesc:'你选择专注原有角色，稳扎稳打。'},
                {text: '提出对剧本的修改建议', fansChange: Math.floor(d.fans*0.01)+200, moneyChange: 5000, extraDesc:'导演采纳了你的部分建议，合作愉快。'}
            ]
        },
        {
            title: '📰 突发黑料', desc: '有营销号爆出你的"黑料"，虽然是捏造的，但正在发酵...',
            options: [
                {text: '立刻发声明澄清', fansChange: Math.floor(d.fans*0.005)+100, moneyChange: -5000, extraDesc:'声明得当，粉丝力挺，路人好感度提升。'},
                {text: '冷处理，不予回应', fansChange: -Math.floor(d.fans*0.01)-200, moneyChange: 0, extraDesc:'舆论持续发酵，掉了一波粉...'},
                {text: '让经纪人私下处理', fansChange: -Math.floor(d.fans*0.003)-50, moneyChange: -10000, extraDesc:'花钱公关搞定了，但付出了一些代价。'}
            ]
        },
        {
            title: '🌟 意外走红', desc: '你在片场的一段花絮视频被粉丝传到网上，突然火了！',
            options: [
                {text: '趁热打铁发更多花絮', fansChange: Math.floor(d.fans*0.03)+1000, moneyChange: 10000, extraDesc:'花絮系列大受欢迎，涨了一大波粉！'},
                {text: '低调处理，专注工作', fansChange: Math.floor(d.fans*0.005)+200, moneyChange: 0, extraDesc:'热度逐渐消退，但留下了好印象。'},
                {text: '开直播与粉丝互动', fansChange: Math.floor(d.fans*0.02)+800, moneyChange: 15000, extraDesc:'直播效果爆棚，粉丝粘性大增！'}
            ]
        },
        {
            title: '😰 档期冲突', desc: '另一个大项目突然邀请你，但和当前工作有档期冲突...',
            options: [
                {text: '拒绝新项目，遵守合约', fansChange: Math.floor(d.fans*0.005)+100, moneyChange: 0, extraDesc:'你的职业操守获得业内好评。'},
                {text: '尝试协调两边档期', fansChange: -Math.floor(d.fans*0.005)-100, moneyChange: 30000, extraDesc:'虽然很累，但两边都照顾到了。'},
                {text: '和当前剧组商量请假', fansChange: -Math.floor(d.fans*0.01)-200, moneyChange: 50000, extraDesc:'剧组有些不满，但新项目收益不错。'}
            ]
        },
        {
            title: '🏆 获奖提名', desc: '你的表演获得了一个奖项的提名！',
            options: [
                {text: '认真准备颁奖典礼', fansChange: Math.floor(d.fans*0.02)+500, moneyChange: 5000, extraDesc:'典礼上的表现很出色，获得关注！'},
                {text: '低调对待，继续拍戏', fansChange: Math.floor(d.fans*0.005)+100, moneyChange: 0, extraDesc:'你的谦逊态度获得了好评。'},
                {text: '借机宣传当前作品', fansChange: Math.floor(d.fans*0.015)+400, moneyChange: 20000, extraDesc:'提名带动了作品热度，效果不错！'}
            ]
        },
        {
            title: '💔 绯闻曝光', desc: '有狗仔拍到你和某人约饭的照片，绯闻四起...',
            options: [
                {text: '迅速发微博否认', fansChange: -Math.floor(d.fans*0.005)-100, moneyChange: -3000, extraDesc:'否认后热度降低，但仍有质疑。'},
                {text: '不回应，让它自然消散', fansChange: -Math.floor(d.fans*0.008)-200, moneyChange: 0, extraDesc:'绯闻持续了几天后逐渐被遗忘。'},
                {text: '幽默回应化解尴尬', fansChange: Math.floor(d.fans*0.01)+300, moneyChange: 5000, extraDesc:'你的高情商回应反而圈了一波粉！'}
            ]
        }
    ];
    
    var evt = events[Math.floor(Math.random()*events.length)];
    d.pendingEvent = {
        id: 'evt_' + Date.now(),
        jobId: job.id,
        jobName: job.name,
        title: evt.title,
        desc: evt.desc,
        options: evt.options,
        time: Date.now()
    };
    save();
    ppShowEventPopup(d.pendingEvent);
}

// ====== 显示事件弹窗 ======
function ppShowEventPopup(evt){
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay pp-event-overlay';
    overlay.id = 'pp-event-popup';
    overlay.innerHTML = '<div class="pp-event-box">' +
        '<div class="pp-event-title">' + escapeHtml(evt.title || '特殊事件') + '</div>' +
        '<div class="pp-event-job">📍 相关工作：' + escapeHtml(evt.jobName || '') + '</div>' +
        '<div class="pp-event-desc">' + escapeHtml(evt.desc || '') + '</div>' +
        '<div class="pp-event-options">' +
            (evt.options || []).map(function(opt, idx){
                return '<div class="pp-event-option" onclick="ppChooseEventOption(' + idx + ')">' +
                    '<div class="pp-event-option-text">' + escapeHtml(opt.text || '选项' + (idx+1)) + '</div>' +
                '</div>';
            }).join('') +
        '</div>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
}

// ====== 选择事件选项 ======
window.ppChooseEventOption = function(idx){
    var d = store.paopao;
    if(!d.pendingEvent) return;
    var evt = d.pendingEvent;
    var opt = evt.options && evt.options[idx];
    if(!opt) return;
    
    var fansChange = opt.fansChange || 0;
    var moneyChange = opt.moneyChange || 0;
    
    d.fans = Math.max(0, d.fans + fansChange);
    d.money = Math.max(0, d.money + moneyChange);
    d.tier = calcTier(d.fans);
    
    // 记录事件历史
    if(!d.eventHistory) d.eventHistory = [];
    d.eventHistory.push({
        title: evt.title,
        choice: opt.text,
        result: opt.extraDesc || '',
        fansChange: fansChange,
        time: Date.now()
    });
    
    d.pendingEvent = null;
    save();
    
    // 关闭弹窗
    var popup = document.getElementById('pp-event-popup');
    if(popup) popup.remove();
    
    var resultText = (opt.extraDesc || '事件已处理');
    if(fansChange > 0) resultText += '\n粉丝 +' + formatFans(fansChange);
    else if(fansChange < 0) resultText += '\n粉丝 -' + formatFans(Math.abs(fansChange));
    if(moneyChange > 0) resultText += '，收入 +¥' + formatFans(moneyChange);
    else if(moneyChange < 0) resultText += '，支出 -¥' + formatFans(Math.abs(moneyChange));
    
    showPpResult(fansChange >= 0 ? '✅ 事件处理' : '⚠️ 事件处理', resultText, fansChange >= 0);
    
    var fansEl = document.querySelector('.pp-nav-fans');
    if(fansEl) fansEl.innerHTML = '<i class="fas fa-heart"></i> ' + formatFans(d.fans);
};

// ====== 工作完成处理 ======
function ppCompleteJob(job){
    var d = store.paopao;
    
    // 通过API生成完成结果
    if(window.API && API.chatCompletion){
        var typeText = job.type === 'tongGao' ? '影视作品' : job.type === 'zongYi' ? '综艺节目' : '品牌代言';
        API.chatCompletion([
            {role:'system', content:'你是娱乐圈模拟器。艺人「' + d.stageName + '」（咖位：' + d.tier + '，粉丝：' + formatFans(d.fans) + '）刚刚完成了' + typeText + '「' + job.name + '」（' + (job.stars||3) + '星级项目）。\n请随机生成作品播出/上线后的结果，可能是大爆、小火、平淡、或扑街。结果要有随机性。\n严格按JSON格式输出：\n{"result":"爆了/小火/平淡/扑街","fansChange":50000,"moneyChange":100000,"description":"结果描述30字内"}\nfansChange可正可负。'},
            {role:'user', content:'请生成结果'}
        ], 0.95).then(function(data){
            var text = (data.choices[0].message.content || '').trim();
            try {
                var jsonMatch = text.match(/\{[\s\S]*\}/);
                if(jsonMatch){
                    var result = JSON.parse(jsonMatch[0]);
                    ppApplyJobResult(job, result);
                    return;
                }
            } catch(e){}
            ppApplyJobResult(job, ppLocalJobResult(job));
        }).catch(function(){
            ppApplyJobResult(job, ppLocalJobResult(job));
        });
    } else {
        ppApplyJobResult(job, ppLocalJobResult(job));
    }
}

// ====== 本地生成工作结果 ======
function ppLocalJobResult(job){
    var d = store.paopao;
    var r = Math.random();
    var baseFans = Math.floor(d.fans * 0.05) + 1000;
    var starMultiplier = (job.stars || 3) * 0.5;
    
    if(r < 0.15){
        // 大爆
        var fans = Math.floor(baseFans * starMultiplier * (3 + Math.random()*5));
        return {result:'爆了', fansChange: fans, moneyChange: Math.floor(fans*5), description:'作品大爆！全网讨论热度拉满！'};
    } else if(r < 0.4){
        // 小火
        var fans = Math.floor(baseFans * starMultiplier * (1 + Math.random()*2));
        return {result:'小火', fansChange: fans, moneyChange: Math.floor(fans*3), description:'作品口碑不错，稳定涨粉。'};
    } else if(r < 0.75){
        // 平淡
        var fans = Math.floor(baseFans * starMultiplier * (0.3 + Math.random()*0.7));
        return {result:'平淡', fansChange: fans, moneyChange: Math.floor(fans*1.5), description:'反响平平，但也算完成任务。'};
    } else {
        // 扑街
        var fans = -Math.floor(baseFans * (0.2 + Math.random()*0.5));
        return {result:'扑街', fansChange: fans, moneyChange: 0, description:'作品扑街了...口碑崩塌。'};
    }
}

// ====== 应用工作结果 ======
function ppApplyJobResult(job, result){
    var d = store.paopao;
    var fansChange = result.fansChange || 0;
    var moneyChange = result.moneyChange || 0;
    
    d.fans = Math.max(0, d.fans + fansChange);
    var totalIncome = moneyChange + (job.pay || 0);
    d.money = Math.max(0, d.money + totalIncome);
    d.tier = calcTier(d.fans);

    // 记录财务流水
    if (totalIncome > 0) {
        ppRecordFinance('income', totalIncome, job.type === 'tongGao' ? '通告' : (job.type === 'zongYi' ? '综艺' : '代言'), '「' + job.name + '」');
    } else if (totalIncome < 0) {
        ppRecordFinance('expense', -totalIncome, '工作亏损', '「' + job.name + '」');
    }
    
    // 添加到作品/活动历史
    if(job.type === 'tongGao'){
        d.works.push({name: job.name, type: 'drama', fans: fansChange, date: Date.now(), result: result.result});
    } else {
        d.completedActivities.push({name: job.name, type: job.type, fans: fansChange, date: Date.now(), result: result.result});
    }
    
    // 记录到工作历史
    if(!d.jobHistory) d.jobHistory = [];
    d.jobHistory.push({
        name: job.name,
        type: job.type,
        stars: job.stars,
        result: result.result,
        fansChange: fansChange,
        moneyChange: moneyChange + (job.pay || 0),
        date: Date.now()
    });
    
    // [FIX] 推送NPC事件：完成工作时更新相关NPC好感度
    if(d.npcStars && d.npcStars.length > 0){
        d.npcStars.forEach(function(star){
            if(!star.events) star.events = [];
            if(star.relationship === 'rival'){
                // 对家：你的成功降低对家好感
                if(fansChange > 0) star.friendliness = Math.max(0, (star.friendliness||50) - 2);
                star.events.push({type:'work', desc:'你完成了「'+job.name+'」，'+result.result, date:Date.now()});
            } else if(star.relationship === 'cp' || star.relationship === 'friend'){
                // CP/好友：你的成功提升好感
                if(fansChange > 0) star.friendliness = Math.min(100, (star.friendliness||50) + 3);
                star.events.push({type:'work', desc:'你完成了「'+job.name+'」，'+result.result, date:Date.now()});
            }
            // 只保留最近20条事件
            if(star.events.length > 20) star.events = star.events.slice(-20);
        });
    }
    // 从activeJobs中移除
    d.activeJobs = (d.activeJobs || []).filter(function(j){ return j.id !== job.id; });
    save();
    
    // 显示结果弹窗
    var resultEmoji = result.result === '爆了' ? '🔥' : result.result === '小火' ? '✨' : result.result === '平淡' ? '😐' : '💔';
    var isPositive = fansChange >= 0;
    
    var resultText = (result.description || '工作已完成') + '\n片酬：¥' + formatFans(job.pay || 0);
    if(fansChange > 0) resultText += '\n涨粉 +' + formatFans(fansChange);
    else if(fansChange < 0) resultText += '\n掉粉 -' + formatFans(Math.abs(fansChange));
    if(moneyChange > 0) resultText += '，额外收入 +¥' + formatFans(moneyChange);
    
    showPpResult(resultEmoji + ' 「' + job.name + '」' + (result.result || '完成'), resultText, isPositive);
    
    var fansEl = document.querySelector('.pp-nav-fans');
    if(fansEl) fansEl.innerHTML = '<i class="fas fa-heart"></i> ' + formatFans(d.fans);
    
    // 触发意外事件的概率
    setTimeout(function(){
        if(Math.random() < 0.3){
            ppTriggerSurpriseEvent();
        }
    }, 3000);
}

// ====== 泡泡app意外事件（不依赖于工作） ======
function ppTriggerSurpriseEvent(){
    _currentApiScene = 'paopao';
    var d = store.paopao;
    if(d.pendingEvent) return; // 已有事件待处理
    
    if(!window.API || !API.chatCompletion){
        ppTriggerLocalSurprise();
        return;
    }
    
    API.chatCompletion([
        {role:'system', content:'你是娱乐圈模拟器。艺人「' + d.stageName + '」（咖位：' + d.tier + '，粉丝：' + formatFans(d.fans) + '）在日常生活中遇到了一个意外事件。\n请生成一个随机的意外事件（如：被某导演赏识、突然的黑料、被拍到约会、获奖、综艺表现出圈等）。提供3个选项让用户选择。\n严格按JSON格式输出：\n{"title":"事件标题","desc":"事件描述50字内","options":[{"text":"选项1","fansChange":1000,"moneyChange":0,"extraDesc":"结果描述"},{"text":"选项2","fansChange":-500,"moneyChange":5000,"extraDesc":"结果描述"},{"text":"选项3","fansChange":200,"moneyChange":2000,"extraDesc":"结果描述"}]}'},
        {role:'user', content:'请生成意外事件'}
    ], 0.95).then(function(data){
        var text = (data.choices[0].message.content || '').trim();
        try {
            var jsonMatch = text.match(/\{[\s\S]*\}/);
            if(jsonMatch){
                var evt = JSON.parse(jsonMatch[0]);
                if(evt.title && evt.options){
                    d.pendingEvent = {
                        id: 'surprise_' + Date.now(),
                        jobId: null,
                        jobName: '日常生活',
                        title: evt.title,
                        desc: evt.desc || '',
                        options: evt.options.slice(0,3),
                        time: Date.now()
                    };
                    save();
                    ppShowEventPopup(d.pendingEvent);
                    return;
                }
            }
        } catch(e){}
        ppTriggerLocalSurprise();
    }).catch(function(){
        ppTriggerLocalSurprise();
    });
}

function ppTriggerLocalSurprise(){
    var d = store.paopao;
    var surprises = [
        {
            title: '🎥 大导演来电', desc: '知名导演看到了你之前的作品，主动联系你，想让你出演新戏！',
            options: [
                {text: '激动接受', fansChange: Math.floor(d.fans*0.03)+800, moneyChange: 50000, extraDesc:'与大导演合作，事业迎来转折点！'},
                {text: '谨慎考虑后答应', fansChange: Math.floor(d.fans*0.02)+500, moneyChange: 30000, extraDesc:'经过深思熟虑，你接下了这个好机会。'},
                {text: '因档期问题婉拒', fansChange: -Math.floor(d.fans*0.005)-100, moneyChange: 0, extraDesc:'虽然可惜，但你选择了信守承诺。'}
            ]
        },
        {
            title: '🔥 热搜突袭', desc: '你莫名其妙上了热搜，原来是之前的一段采访被翻出来了！',
            options: [
                {text: '趁热度发微博互动', fansChange: Math.floor(d.fans*0.02)+600, moneyChange: 10000, extraDesc:'你的互动获得好评，热度转化为粉丝！'},
                {text: '保持沉默观望', fansChange: Math.floor(d.fans*0.005)+100, moneyChange: 0, extraDesc:'热度慢慢消退，没有太大影响。'},
                {text: '让团队控评引导舆论', fansChange: Math.floor(d.fans*0.01)+300, moneyChange: -5000, extraDesc:'舆论被成功引导，整体正面。'}
            ]
        },
        {
            title: '🎁 品牌赠礼', desc: '一个知名品牌主动送来了一大箱礼物，希望你在社交媒体上分享！',
            options: [
                {text: '开心分享到微博', fansChange: Math.floor(d.fans*0.01)+200, moneyChange: 20000, extraDesc:'粉丝们很羡慕，品牌很满意！'},
                {text: '私下使用不公开', fansChange: 0, moneyChange: 0, extraDesc:'你选择低调，品牌也理解。'},
                {text: '退回礼物表示独立', fansChange: Math.floor(d.fans*0.008)+150, moneyChange: -5000, extraDesc:'你的态度获得业内尊重。'}
            ]
        }
    ];
    
    var evt = surprises[Math.floor(Math.random()*surprises.length)];
    d.pendingEvent = {
        id: 'surprise_' + Date.now(),
        jobId: null,
        jobName: '日常生活',
        title: evt.title,
        desc: evt.desc,
        options: evt.options,
        time: Date.now()
    };
    save();
    ppShowEventPopup(d.pendingEvent);
}

// ====== 拍摄过程中的随机事件（预设+API混合，小窗不触发） ======
function ppTriggerShootingRandomEvent(job){
    var d = store.paopao;
    if(d.isShootingMinimized) return; // 小窗不触发
    if(d.pendingEvent) return; // 已有事件待处理
    // [FIX-弹窗重复] 已有弹窗显示时不再触发新事件
    var existingPopup = document.getElementById('pp-shooting-scene-popup') || document.getElementById('pp-shooting-event-popup');
    if(existingPopup) return;
    
    // 50%概率用预设，50%概率尝试API生成
    if(!window.API || !API.chatCompletion || Math.random() < 0.5){
        ppTriggerLocalShootingEvent(job);
    } else {
        ppTriggerAPIShootingEvent(job);
    }
}

// 本地预设拍摄随机事件（大幅扩充）
function ppTriggerLocalShootingEvent(job){
    var d = store.paopao;
    var baseFans = Math.floor(d.fans * 0.01) + 300;
    var isTongGao = job.type === 'tongGao';
    var isZongYi = job.type === 'zongYi';
    
    // 通用事件池（所有类型通告都可能触发）
    var commonEvents = [
        {
            title: '🔥 路透照曝光', desc: '有粉丝偷拍到你的工作路透照并发到网上，引发热议！',
            options: [
                {text: '官方放出高清工作照', fansChange: Math.floor(baseFans*2)+500, moneyChange: 0, extraDesc:'官方路透效果更好，热度飙升！'},
                {text: '要求删除路透，保持神秘', fansChange: -Math.floor(baseFans*0.3), moneyChange: 0, extraDesc:'虽然热度降了，但保住了作品悬念。'},
                {text: '在社交媒体上幽默回应', fansChange: Math.floor(baseFans*1.5)+300, moneyChange: 3000, extraDesc:'你的幽默回应让话题持续发酵！'}
            ]
        },
        {
            title: '😷 身体不适', desc: '连续高强度工作让你感到身体不适，需要做出选择...',
            options: [
                {text: '坚持工作，吃药硬撑', fansChange: Math.floor(baseFans*0.5), moneyChange: 0, extraDesc:'敬业精神令人敬佩，但身体需要注意。', attrChanges:{charm:2}},
                {text: '请假休息一天', fansChange: -Math.floor(baseFans*0.5), moneyChange: -5000, extraDesc:'休息过后状态恢复，但进度有所延误。'},
                {text: '看完医生后继续', fansChange: Math.floor(baseFans*0.3), moneyChange: -3000, extraDesc:'医生说没大碍，你安心继续工作。', attrChanges:{wisdom:2}}
            ]
        },
        {
            title: '📱 粉丝送饭', desc: '粉丝组织了应援送来了丰盛的食物和应援物资！',
            options: [
                {text: '开心收下并录视频感谢', fansChange: Math.floor(baseFans*1.8)+400, moneyChange: 0, extraDesc:'感谢视频被广泛传播，粉丝粘性增强！', attrChanges:{social:3}},
                {text: '收下并与全组工作人员分享', fansChange: Math.floor(baseFans*1.2)+200, moneyChange: 0, extraDesc:'你的大方获得剧组好评。', attrChanges:{social:2,charm:1}},
                {text: '婉拒并劝粉丝不要破费', fansChange: Math.floor(baseFans*0.5), moneyChange: 0, extraDesc:'虽然有粉丝小失落，但你的态度获得路人好感。', attrChanges:{wisdom:2}}
            ]
        },
        {
            title: '🌟 前辈指点', desc: '一位业内前辈主动找你聊天，给你分享了宝贵经验。',
            options: [
                {text: '虚心求教，认真学习', fansChange: Math.floor(baseFans*0.5), moneyChange: 0, extraDesc:'前辈的指导让你受益匪浅！', attrChanges:{acting:3,wisdom:2}},
                {text: '请前辈吃饭以表感谢', fansChange: Math.floor(baseFans*0.3), moneyChange: -8000, extraDesc:'你的真诚打动了前辈，获得了一位好朋友。', attrChanges:{social:4}},
                {text: '分享自己的一些看法交流', fansChange: Math.floor(baseFans*0.8), moneyChange: 0, extraDesc:'前辈对你刮目相看，称你有想法！', attrChanges:{talent:3,charm:1}}
            ]
        },
        {
            title: '🎲 临时改剧本', desc: '导演/编导突然大幅修改了今天的内容安排！',
            options: [
                {text: '快速适应，展现专业素养', fansChange: Math.floor(baseFans*1.2)+200, moneyChange: 5000, extraDesc:'你的应变能力让导演大加赞赏！', attrChanges:{acting:2,wisdom:2}},
                {text: '和导演讨论修改方案', fansChange: Math.floor(baseFans*0.8), moneyChange: 0, extraDesc:'你的建议被部分采纳，效果不错。', attrChanges:{talent:2,social:1}},
                {text: '默默接受但内心不满', fansChange: -Math.floor(baseFans*0.3), moneyChange: 0, extraDesc:'虽然完成了任务，但情绪影响了发挥。'}
            ]
        },
        {
            title: '💰 商务邀约', desc: '你在工作期间收到了一个商务活动邀约！',
            options: [
                {text: '在不影响工作的前提下接受', fansChange: Math.floor(baseFans*0.5), moneyChange: 30000, extraDesc:'抽空完成了商务活动，收益不错。'},
                {text: '全部拒绝，专心当前工作', fansChange: Math.floor(baseFans*0.3), moneyChange: 0, extraDesc:'你的专注获得了团队好评。', attrChanges:{charm:1}},
                {text: '让经纪人谈更好的条件', fansChange: Math.floor(baseFans*0.2), moneyChange: 50000, extraDesc:'经纪人谈下了更好的价格！'}
            ]
        },
        {
            title: '🤝 偶遇同行好友', desc: '在工作场地偶遇了圈内好友，对方提议合作！',
            options: [
                {text: '合拍一段互动视频', fansChange: Math.floor(baseFans*2)+500, moneyChange: 0, extraDesc:'两人互动的视频在网上爆火！', attrChanges:{social:3}},
                {text: '私下聚餐叙旧', fansChange: Math.floor(baseFans*0.3), moneyChange: -5000, extraDesc:'和好友聊天让你心情大好，工作状态更佳。', attrChanges:{charm:2}},
                {text: '合拍一组时尚大片', fansChange: Math.floor(baseFans*1.5)+300, moneyChange: 10000, extraDesc:'双人大片质感满分，登上时尚杂志！', attrChanges:{looks:2}}
            ]
        },
        {
            title: '🎭 即兴表演挑战', desc: '有人提议来一次即兴表演/才艺挑战！',
            options: [
                {text: '大胆接受挑战', fansChange: Math.floor(baseFans*1.5)+200, moneyChange: 0, extraDesc:'你的即兴表现惊艳全场！', attrChanges:{talent:3,acting:2}},
                {text: '有准备地参与', fansChange: Math.floor(baseFans*0.8), moneyChange: 0, extraDesc:'稳定发挥，中规中矩。', attrChanges:{acting:1}},
                {text: '委婉拒绝', fansChange: -Math.floor(baseFans*0.2), moneyChange: 0, extraDesc:'虽然没参与，但也没什么影响。'}
            ]
        },
        {
            title: '📸 狗仔跟拍', desc: '发现有狗仔一直在跟拍你的日常行踪！',
            options: [
                {text: '坦然面对，展现良好形象', fansChange: Math.floor(baseFans*1)+200, moneyChange: 0, extraDesc:'你的从容淡定获得好评。', attrChanges:{charm:2}},
                {text: '让助理出面交涉', fansChange: -Math.floor(baseFans*0.2), moneyChange: -3000, extraDesc:'助理成功劝退狗仔，但花了点代价。'},
                {text: '主动打招呼化解尴尬', fansChange: Math.floor(baseFans*1.5)+300, moneyChange: 0, extraDesc:'你的高情商上了热搜！', attrChanges:{social:3,charm:2}}
            ]
        },
        {
            title: '🏅 获得行业认可', desc: '业内权威人士公开称赞了你的工作态度和专业能力！',
            options: [
                {text: '谦虚回应，感谢认可', fansChange: Math.floor(baseFans*1.5)+400, moneyChange: 10000, extraDesc:'你的谦逊让更多人关注到你！', attrChanges:{social:2,charm:2}},
                {text: '发长文分享心路历程', fansChange: Math.floor(baseFans*2)+600, moneyChange: 5000, extraDesc:'真情实感的分享打动了无数人！', attrChanges:{charm:3}},
                {text: '低调处理不做回应', fansChange: Math.floor(baseFans*0.5), moneyChange: 0, extraDesc:'你选择用实力说话。', attrChanges:{wisdom:2}}
            ]
        },
        {
            title: '💥 意外受伤', desc: '工作中不小心受了轻伤，需要处理...',
            options: [
                {text: '简单处理后继续', fansChange: Math.floor(baseFans*1)+200, moneyChange: 0, extraDesc:'敬业精神感动了所有人！', attrChanges:{charm:3}},
                {text: '去医院检查确保无碍', fansChange: -Math.floor(baseFans*0.3), moneyChange: -5000, extraDesc:'检查后确认无碍，安心回归。', attrChanges:{wisdom:2}},
                {text: '休息观察一下', fansChange: -Math.floor(baseFans*0.5), moneyChange: 0, extraDesc:'休息后感觉好多了。'}
            ]
        },
        {
            title: '🎵 才艺被发掘', desc: '别人无意中发现了你的隐藏才艺！',
            options: [
                {text: '大方展示', fansChange: Math.floor(baseFans*2)+500, moneyChange: 0, extraDesc:'隐藏技能曝光，圈粉无数！', attrChanges:{talent:4}},
                {text: '害羞地小秀一下', fansChange: Math.floor(baseFans*1.2)+200, moneyChange: 0, extraDesc:'反差萌让人觉得你好可爱！', attrChanges:{charm:3}},
                {text: '保持神秘感', fansChange: Math.floor(baseFans*0.3), moneyChange: 0, extraDesc:'你选择把惊喜留到合适的时机。'}
            ]
        }
    ];
    
    // 影视通告专属事件
    var tongGaoEvents = [
        {
            title: '🎬 导演给你加了吻戏', desc: '导演临时决定给你加一场吻戏，你怎么应对？',
            options: [
                {text: '专业对待，投入表演', fansChange: Math.floor(baseFans*2)+500, moneyChange: 0, extraDesc:'吻戏花絮被疯传，你的专业度获得赞誉！', attrChanges:{acting:3,charm:2}},
                {text: '要求使用借位拍摄', fansChange: Math.floor(baseFans*0.5), moneyChange: 0, extraDesc:'借位效果也不错，导演表示理解。', attrChanges:{acting:1}},
                {text: '和对手演员商量后配合', fansChange: Math.floor(baseFans*1.5)+300, moneyChange: 0, extraDesc:'两人默契配合，CP感爆棚！', attrChanges:{social:2,charm:3}}
            ]
        },
        {
            title: '🎥 片花曝光', desc: '制作方提前放出了包含你镜头的片花！',
            options: [
                {text: '转发宣传', fansChange: Math.floor(baseFans*2)+600, moneyChange: 5000, extraDesc:'片花反响热烈，期待值拉满！', attrChanges:{charm:2}},
                {text: '在评论区和粉丝互动', fansChange: Math.floor(baseFans*1.5)+300, moneyChange: 0, extraDesc:'你的互动让粉丝更加期待！', attrChanges:{social:3}},
                {text: '低调围观网友评价', fansChange: Math.floor(baseFans*0.5), moneyChange: 0, extraDesc:'评价总体正面，你暗自欣慰。'}
            ]
        },
        {
            title: '😤 和对手演员不合', desc: '你和一位对手演员在表演理念上产生了分歧...',
            options: [
                {text: '主动沟通，寻求共识', fansChange: Math.floor(baseFans*0.8), moneyChange: 0, extraDesc:'沟通后关系缓和，合作更默契了。', attrChanges:{social:4,wisdom:2}},
                {text: '各演各的，互不干涉', fansChange: -Math.floor(baseFans*0.3), moneyChange: 0, extraDesc:'虽然气氛有些尴尬，但工作没受太大影响。'},
                {text: '让导演来协调', fansChange: Math.floor(baseFans*0.3), moneyChange: 0, extraDesc:'导演出面调和后情况好转。', attrChanges:{wisdom:1}}
            ]
        },
        {
            title: '📝 剧本大改', desc: '编剧半夜发来了大幅修改的剧本，你的角色有重大变化！',
            options: [
                {text: '通宵背词，完美适应', fansChange: Math.floor(baseFans*1.5)+300, moneyChange: 0, extraDesc:'你的敬业精神和适应力令人佩服！', attrChanges:{acting:3,wisdom:1}},
                {text: '按自己理解即兴发挥', fansChange: Math.floor(baseFans*1.2)+200, moneyChange: 0, extraDesc:'即兴发挥出了意想不到的效果！', attrChanges:{talent:4}},
                {text: '和编剧导演详细讨论', fansChange: Math.floor(baseFans*0.8), moneyChange: 0, extraDesc:'讨论后找到了更好的呈现方式。', attrChanges:{wisdom:3,social:1}}
            ]
        }
    ];
    
    // 综艺专属事件
    var zongYiEvents = [
        {
            title: '😂 综艺名场面', desc: '节目中发生了一个超搞笑的意外，你的反应被拍了下来！',
            options: [
                {text: '放开自我，制造更多笑点', fansChange: Math.floor(baseFans*2.5)+600, moneyChange: 0, extraDesc:'名场面诞生！你的综艺感被疯狂点赞！', attrChanges:{charm:4,social:2}},
                {text: '保持优雅地微笑', fansChange: Math.floor(baseFans*0.5), moneyChange: 0, extraDesc:'你的淡定反应也蛮可爱的。', attrChanges:{charm:1}},
                {text: '用自嘲化解尴尬', fansChange: Math.floor(baseFans*2)+400, moneyChange: 0, extraDesc:'自嘲功力一流，圈粉无数！', attrChanges:{social:3,talent:2}}
            ]
        },
        {
            title: '🏆 挑战赛获胜', desc: '你在节目的挑战赛中拿到了第一名！',
            options: [
                {text: '开心庆祝，感谢队友', fansChange: Math.floor(baseFans*1.5)+300, moneyChange: 10000, extraDesc:'你的团队精神和实力获得双赞！', attrChanges:{social:3,charm:2}},
                {text: '谦虚地说运气好', fansChange: Math.floor(baseFans*1)+200, moneyChange: 5000, extraDesc:'谦虚的态度让人好感度UP！', attrChanges:{charm:2}},
                {text: '霸气宣言下次还要赢', fansChange: Math.floor(baseFans*2)+400, moneyChange: 8000, extraDesc:'霸气侧漏，综艺效果拉满！', attrChanges:{charm:3}}
            ]
        },
        {
            title: '💬 被问敏感话题', desc: '节目中被其他嘉宾突然问到了很敏感的私人问题！',
            options: [
                {text: '机智转移话题', fansChange: Math.floor(baseFans*1)+200, moneyChange: 0, extraDesc:'高情商操作获得满堂彩！', attrChanges:{wisdom:4,social:2}},
                {text: '坦诚回答一部分', fansChange: Math.floor(baseFans*1.5)+300, moneyChange: 0, extraDesc:'适度的坦诚让观众觉得你很真实！', attrChanges:{charm:3}},
                {text: '直接说不方便回答', fansChange: -Math.floor(baseFans*0.3), moneyChange: 0, extraDesc:'虽然有点尴尬，但保护了隐私。'}
            ]
        }
    ];
    
    // 代言专属事件
    var daiYanEvents = [
        {
            title: '📊 竞品挖角', desc: '竞争品牌开出了更高的价码想要挖你！',
            options: [
                {text: '忠于当前品牌', fansChange: Math.floor(baseFans*0.8), moneyChange: 0, extraDesc:'品牌方对你的忠诚度非常满意！', attrChanges:{charm:2,social:2}},
                {text: '让经纪人跟当前品牌谈涨价', fansChange: Math.floor(baseFans*0.3), moneyChange: 50000, extraDesc:'品牌方同意了涨价，你的商业价值UP！'},
                {text: '考虑跳槽到竞品', fansChange: -Math.floor(baseFans*0.5), moneyChange: 80000, extraDesc:'虽然赚了更多，但口碑有些受损。'}
            ]
        },
        {
            title: '🛍️ 产品翻车', desc: '你代言的产品被曝出质量问题！',
            options: [
                {text: '发声明要求品牌整改', fansChange: Math.floor(baseFans*1)+200, moneyChange: -10000, extraDesc:'你的责任感获得消费者好评！', attrChanges:{wisdom:3,charm:2}},
                {text: '保持沉默等事态发展', fansChange: -Math.floor(baseFans*1)-300, moneyChange: 0, extraDesc:'沉默被解读为默认，口碑受损...'},
                {text: '私下督促品牌方解决', fansChange: Math.floor(baseFans*0.5), moneyChange: -5000, extraDesc:'品牌方积极整改，事件逐渐平息。', attrChanges:{wisdom:2}}
            ]
        },
        {
            title: '📈 代言效果爆表', desc: '品牌方告诉你，你代言以来销量翻了好几倍！',
            options: [
                {text: '趁热追加社交媒体推广', fansChange: Math.floor(baseFans*2)+500, moneyChange: 30000, extraDesc:'追加推广让效果更上一层楼！', attrChanges:{charm:3}},
                {text: '要求提高代言费', fansChange: Math.floor(baseFans*0.3), moneyChange: 80000, extraDesc:'品牌方爽快同意涨价！'},
                {text: '建议品牌方回馈消费者', fansChange: Math.floor(baseFans*1.5)+300, moneyChange: 10000, extraDesc:'品牌回馈活动大获好评，你的形象更加正面！', attrChanges:{social:2,charm:2}}
            ]
        }
    ];
    
    // 根据类型选择事件池
    var eventPool = commonEvents.slice();
    if(isTongGao) eventPool = eventPool.concat(tongGaoEvents);
    if(isZongYi) eventPool = eventPool.concat(zongYiEvents);
    if(!isTongGao && !isZongYi) eventPool = eventPool.concat(daiYanEvents);
    
    var evt = eventPool[Math.floor(Math.random()*eventPool.length)];
    d.pendingEvent = {
        id: 'shooting_evt_' + Date.now(),
        jobId: job.id,
        jobName: job.name,
        title: evt.title,
        desc: evt.desc,
        options: evt.options,
        time: Date.now()
    };
    save();
    ppShowShootingEventPopup(d.pendingEvent, job);
}

// API生成拍摄随机事件
function ppTriggerAPIShootingEvent(job){
    _currentApiScene = 'paopao';
    var d = store.paopao;
    var typeText = job.type === 'tongGao' ? '影视通告拍摄' : job.type === 'zongYi' ? '综艺节目录制' : '品牌代言活动';
    var attrInfo = '';
    if(d.attrs){
        attrInfo = '艺人属性：演技' + (d.attrs.acting||50) + '、颜值' + (d.attrs.looks||50) + '、智慧' + (d.attrs.wisdom||50) + '、乐感' + (d.attrs.rhythm||50) + '、魅力' + (d.attrs.charm||50) + '、才华' + (d.attrs.talent||50) + '、人缘' + (d.attrs.social||50) + '。';
    }
    
    API.chatCompletion([
        {role:'system', content:'你是娱乐圈模拟器随机事件生成器。艺人「' + d.stageName + '」（咖位：' + d.tier + '，粉丝：' + formatFans(d.fans) + '）正在进行' + typeText + '「' + job.name + '」（' + (job.desc||'') + '），当前进度' + job.currentDay + '/' + job.shootingDays + '。' + attrInfo + '\n请生成一个随机突发事件，要有戏剧性和随机性。事件类型可以是：人际关系、突发状况、媒体曝光、粉丝互动、商业机遇、情感故事、竞争对手、社交媒体、行业事件等等。不要和常见的拍戏/录制场景重复。\n提供3个选项，每个选项的后果差异要大。可以包含属性变化（attrChanges对象，key为acting/looks/wisdom/rhythm/charm/talent/social之一）。\n严格按JSON输出：\n{"title":"🎯 事件标题","desc":"事件描述50字内","options":[{"text":"选项描述","fansChange":1000,"moneyChange":0,"extraDesc":"结果描述30字内","attrChanges":{"charm":3}},{"text":"选项2","fansChange":-500,"moneyChange":5000,"extraDesc":"结果","attrChanges":{}},{"text":"选项3","fansChange":300,"moneyChange":2000,"extraDesc":"结果","attrChanges":{"social":2}}]}'},
        {role:'user', content:'请生成一个随机突发事件'}
    ], 0.98).then(function(data){
        var text = (data.choices[0].message.content || '').trim();
        try {
            var jsonMatch = text.match(/\{[\s\S]*\}/);
            if(jsonMatch){
                var evt = JSON.parse(jsonMatch[0]);
                if(evt.title && evt.options && evt.options.length >= 2){
                    d.pendingEvent = {
                        id: 'shooting_evt_' + Date.now(),
                        jobId: job.id,
                        jobName: job.name,
                        title: evt.title,
                        desc: evt.desc || '',
                        options: evt.options.slice(0,3),
                        time: Date.now()
                    };
                    save();
                    ppShowShootingEventPopup(d.pendingEvent, job);
                    return;
                }
            }
        } catch(e){ console.error('拍摄随机事件JSON解析失败', e); }
        // fallback到本地
        ppTriggerLocalShootingEvent(job);
    }).catch(function(){
        ppTriggerLocalShootingEvent(job);
    });
}

// 显示拍摄过程随机事件弹窗（事件完成后继续触发下一场场景）
function ppShowShootingEventPopup(evt, job){
    // [FIX-弹窗重复] 先移除所有已存在的拍摄相关弹窗，防止重复弹出
    var existingScene = document.getElementById('pp-shooting-scene-popup');
    if(existingScene) existingScene.remove();
    var existingEvent = document.getElementById('pp-shooting-event-popup');
    if(existingEvent) existingEvent.remove();
    // 移除可能残留的结果弹窗
    var existingResults = document.querySelectorAll('.pp-result-overlay:not(.pp-shooting-scene-overlay):not(.pp-shooting-event-overlay)');
    existingResults.forEach(function(el){ el.remove(); });
    
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay pp-event-overlay pp-shooting-event-overlay';
    overlay.id = 'pp-shooting-event-popup';
    overlay.innerHTML = '<div class="pp-event-box">' +
        '<div class="pp-event-title">' + escapeHtml(evt.title || '突发事件') + '</div>' +
        '<div class="pp-event-job">📍 ' + escapeHtml(evt.jobName || '') + ' · 拍摄中</div>' +
        '<div class="pp-event-desc">' + escapeHtml(evt.desc || '') + '</div>' +
        '<div class="pp-event-options">' +
            (evt.options || []).map(function(opt, idx){
                // 显示属性变化预览
                var previewHtml = '';
                if(opt.attrChanges){
                    var changes = [];
                    for(var k in opt.attrChanges){
                        if(PP_ATTR_NAMES[k]){
                            var v = opt.attrChanges[k];
                            changes.push(PP_ATTR_ICONS[k] + (v > 0 ? '+' + v : v));
                        }
                    }
                    if(changes.length > 0) previewHtml += '<span class="pp-scene-preview-attrs">' + changes.join(' ') + '</span>';
                }
                if(opt.fansChange){
                    previewHtml += '<span class="pp-scene-preview-fans ' + (opt.fansChange > 0 ? 'positive' : 'negative') + '">' +
                        '<i class="fas fa-heart"></i> ' + (opt.fansChange > 0 ? '+' : '') + formatFans(opt.fansChange) + '</span>';
                }
                return '<div class="pp-event-option" onclick="ppChooseShootingEventOption(' + idx + ')">' +
                    '<div class="pp-event-option-text">' + escapeHtml(opt.text || '选项' + (idx+1)) + '</div>' +
                    (previewHtml ? '<div class="pp-shooting-option-preview">' + previewHtml + '</div>' : '') +
                '</div>';
            }).join('') +
        '</div>' +
    '</div>';
    
    // 保存事件job引用
    window._ppShootingEventJob = job;
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
}

// 选择拍摄过程随机事件选项
window.ppChooseShootingEventOption = function(idx){
    var d = store.paopao;
    if(!d.pendingEvent) return;
    var evt = d.pendingEvent;
    var opt = evt.options && evt.options[idx];
    if(!opt) return;
    
    var fansChange = opt.fansChange || 0;
    var moneyChange = opt.moneyChange || 0;
    
    d.fans = Math.max(0, d.fans + fansChange);
    d.money = Math.max(0, d.money + moneyChange);
    d.tier = calcTier(d.fans);
    
    // 应用属性变化
    if(opt.attrChanges && d.attrs){
        for(var k in opt.attrChanges){
            if(d.attrs[k] !== undefined){
                d.attrs[k] = Math.max(0, Math.min(100, d.attrs[k] + (opt.attrChanges[k] || 0)));
            }
        }
    }
    
    // 累计到工作的fansChanges
    var job = window._ppShootingEventJob || d.currentShootingJob;
    if(job){
        job.fansChanges = (job.fansChanges || 0) + fansChange;
        if(opt.attrChanges){
            if(!job.attrChanges) job.attrChanges = {};
            for(var k in opt.attrChanges){
                job.attrChanges[k] = (job.attrChanges[k] || 0) + (opt.attrChanges[k] || 0);
            }
        }
        d.currentShootingJob = job;
    }
    
    // 记录事件历史
    if(!d.eventHistory) d.eventHistory = [];
    d.eventHistory.push({
        title: evt.title,
        choice: opt.text,
        result: opt.extraDesc || '',
        fansChange: fansChange,
        time: Date.now()
    });
    
    d.pendingEvent = null;
    save();
    
    // 关闭弹窗
    var popup = document.getElementById('pp-shooting-event-popup');
    if(popup) popup.remove();
    window._ppShootingEventJob = null;
    
    var resultText = (opt.extraDesc || '事件已处理');
    if(fansChange > 0) resultText += '\n粉丝 +' + formatFans(fansChange);
    else if(fansChange < 0) resultText += '\n粉丝 -' + formatFans(Math.abs(fansChange));
    if(moneyChange > 0) resultText += '，收入 +¥' + formatFans(moneyChange);
    else if(moneyChange < 0) resultText += '，支出 -¥' + formatFans(Math.abs(moneyChange));
    
    showPpResult(fansChange >= 0 ? '✅ 事件处理' : '⚠️ 事件处理', resultText, fansChange >= 0);
    
    var fansEl = document.querySelector('.pp-nav-fans');
    if(fansEl) fansEl.innerHTML = '<i class="fas fa-heart"></i> ' + formatFans(d.fans);
    
    // [FIX-弹窗重复] 事件处理完后继续触发下一场拍摄场景
    // 延迟需确保结果弹窗（3秒自动消失）先消失后，再触发下一场弹窗
    if(job && job.currentDay < job.shootingDays && !d.isShootingMinimized){
        setTimeout(function(){
            var area = document.getElementById('pp-tab-content');
            if(area){
                ppRenderShootingPage(area, job, false);
                setTimeout(function(){ ppTriggerShootingScene(job); }, 1000);
            }
        }, 3200);
    }
};

// ====== 显示进行中的工作 ======
window.ppShowActiveJobs = function(){
    var area = document.getElementById('pp-tab-content');
    if(!area) return;
    var d = store.paopao;
    
    area.innerHTML = '<div class="pp-activity-page">' +
        '<div class="pp-section-title"><i class="fas fa-arrow-left" onclick="ppSwitchTab(\'activity\')" style="cursor:pointer;margin-right:8px;"></i> 进行中的工作</div>' +
        '<div id="pp-active-jobs-panel"></div>' +
    '</div>';
    
    ppRenderActiveJobsContent(document.getElementById('pp-active-jobs-panel'));
};

function ppRenderActiveJobsContent(panel){
    if(!panel) return;
    var d = store.paopao;
    var jobs = d.activeJobs || [];
    
    if(jobs.length === 0){
        panel.innerHTML = '<div class="pp-empty-hint">目前没有进行中的工作</div>';
        return;
    }
    
    panel.innerHTML = jobs.map(function(job){
        var elapsed = Date.now() - job.startTime;
        var progress = Math.min(100, Math.floor((elapsed / job.durationMs) * 100));
        job.progress = progress;
        
        var typeIcon = job.type === 'tongGao' ? '🎬' : job.type === 'zongYi' ? '📺' : '💎';
        var typeLabel = job.type === 'tongGao' ? '通告' : job.type === 'zongYi' ? '综艺' : '代言';
        var statusText = progress >= 100 ? '✅ 已完成' : '🔄 进行中';
        
        // 计算剩余时间
        var remainMs = Math.max(0, job.durationMs - elapsed);
        var remainSec = Math.floor(remainMs / 1000);
        var remainMin = Math.floor(remainSec / 60);
        var remainText = remainMin > 0 ? remainMin + '分' + (remainSec%60) + '秒' : remainSec + '秒';
        
        return '<div class="pp-active-job-card">' +
            '<div class="pp-active-job-header">' +
                '<span class="pp-active-job-type">' + typeIcon + ' ' + typeLabel + '</span>' +
                '<span class="pp-active-job-status">' + statusText + '</span>' +
            '</div>' +
            '<div class="pp-active-job-name">' + escapeHtml(job.name) + '</div>' +
            '<div class="pp-active-job-desc">' + escapeHtml(job.desc || '') + '</div>' +
            '<div class="pp-active-job-stars">星级：' + ppRenderStars(job.stars || 3) + '</div>' +
            '<div class="pp-active-job-progress">' +
                '<div class="pp-progress-bar">' +
                    '<div class="pp-progress-fill" style="width:' + progress + '%;background:' + (progress >= 100 ? '#4caf50' : '#8a6b78') + ';"></div>' +
                '</div>' +
                '<div class="pp-progress-text">' + progress + '% · 剩余 ' + remainText + '</div>' +
            '</div>' +
            '<div class="pp-active-job-meta">' +
                '<span>工期：' + escapeHtml(job.duration || '') + '</span>' +
                '<span>片酬：¥' + formatFans(job.pay || 0) + '</span>' +
            '</div>' +
        '</div>';
    }).join('');
}

// ====== 自定义博客系统 ======
// 博客文案预设池（大量预设，减少重复）
var PP_BLOG_TEXT_PRESETS = [
    '今天的阳光真好，心情也跟着好起来了☀️','努力的人运气都不会太差，加油💪','感恩每一个遇见，感恩每一段旅程✨',
    '生活不止眼前的苟且，还有诗和远方🌸','做自己就好，不必在意别人的眼光','今天又是元气满满的一天！',
    '愿你眼中有星辰，心中有山海🌌','不负韶华，不负自己','每一个不曾起舞的日子，都是对生命的辜负',
    '保持热爱，奔赴山海🏔️','温柔且坚定，勇敢且自由','生活总会给你答案，但不会马上告诉你一切',
    '慢慢来，比较快','你要悄悄努力，然后惊艳所有人','今天的云很好看，分享给你们☁️',
    '人生就是一场修行，走过的路都算数','星光不问赶路人，岁月不负有心人⭐','用力生活，才能被生活善待',
    '日子很长，但快乐要及时','你要相信，好的总在后头','做一个温暖的人，自带光芒',
    '今天的夕阳好美呀🌅','希望今天的我比昨天更好一点点','世间美好与你环环相扣💕',
    '好好吃饭，好好睡觉，好好生活','愿我们都能成为更好的自己','今天也要开开心心的呀',
    '分享今日份的小确幸~','生活明朗，万物可爱🌻','不辜负每一场花开，不忽略每一个善意',
    '愿你成为自己的太阳☀️','岁月静好，现世安稳','做最好的自己，遇见最好的你',
    '人生海海，山山而川','生活是自己的，尽情打扮尽情可爱','你的坚持终将美好✨',
    '每天进步一点点，就是成功的开始','今日份快乐已签收📬','时光不老，我们不散',
    '往后余生，只愿快乐','做一个向阳而生的人🌻','路虽远，行则将至',
    '你要开心，这是我的使命','认真生活，就是最好的模样','今天又是被粉丝暖到的一天💖'
];

var PP_BLOG_IMAGE_DESC_PRESETS = [
    '📷 [精修自拍.jpg]','📷 [今日穿搭OOTD.jpg]','📷 [工作花絮照.jpg]','📷 [片场随拍.jpg]',
    '📷 [杂志大片花絮.jpg]','📷 [活动现场照.jpg]','📷 [路透生图.jpg]','📷 [私服街拍.jpg]',
    '📷 [素颜自拍.jpg]','📷 [健身打卡照.jpg]','📷 [美食分享.jpg]','📷 [旅行随手拍.jpg]',
    '📷 [演唱会舞台照.jpg]','📷 [录制花絮.jpg]','📷 [化妆间自拍.jpg]','📷 [剧照预告.jpg]',
    '📷 [海边度假照.jpg]','📷 [日落随手拍.jpg]','📷 [与粉丝合影.jpg]','📷 [时尚硬照.jpg]',
    '📷 [生活碎片.jpg]','📷 [宠物合照.jpg]','📷 [新发型展示.jpg]','📷 [深夜食堂.jpg]',
    '📷 [封面大片.jpg]','📷 [颁奖典礼红毯照.jpg]','📷 [候机随拍.jpg]','📷 [练习室照片.jpg]',
    '📷 [广告拍摄花絮.jpg]','📷 [代言海报.jpg]','📷 [签约仪式照片.jpg]','📷 [公益活动照.jpg]'
];

// 评论预设池
var PP_GOOD_COMMENTS = [
    '太好看了吧！！！','永远支持你❤️','又被美到了','今日份快乐源泉','最好看的人发博了！',
    '每天都在变好看是怎么回事','世界上怎么会有这么好看的人','我可以！！','绝了绝了绝了',
    '好喜欢这种风格！','文笔好好','姐姐/哥哥太有感觉了','被治愈了~','笑容好温暖',
    '一直都在，永远支持','追你追得好幸福','看到你发博就开心','每张图都是壁纸级别',
    '颜值天花板','气质拿捏了','宝藏明星！','真的太优秀了','我要把这条微博收藏起来',
    '文案太戳了🥺','原来追星是这种感觉','全世界最好的你','拍得好美！','超有氛围感',
    '日常被你的美貌暴击','你就是我的光✨','每次发博都不失望','审美在线！',
    '快发新作品！等不及了','这也太甜了吧','高级感溢出屏幕了','今天也是心动的一天',
    '我的手机壁纸要换了','太绝太美太可了','你说的都对','看完心情好好~',
    '请继续保持！','我愿意为你打call一万年','质感太好了','好想见你本人啊'
];

var PP_BAD_COMMENTS = [
    '感觉有点刻意了','这文案也太矫情了吧','审美疲劳了...','又是营销又是立人设',
    '能不能来点真实的','卖惨有意思吗','总感觉哪里怪怪的','这是什么滤镜修的',
    '说的比唱的好听','人设要崩了吧','有点装了','路人表示看不下去',
    '这不就是炒作吗','有本事拿作品说话','纯纯蹭热度','尴尬到脚趾扣地',
    '这话说的好假','网友的眼睛是雪亮的','别再立人设了求求了','这么作吗',
    '真的很没诚意','图修得都变形了','演技不行就别发感悟了','何不食肉糜',
    '大可不必','这种文案我一秒出十条','说点人话行不行','又开始了...',
    '有完没完','装什么装','谁信啊','就这？','求求了别再发了','太假了'
];

var PP_CONTROLLED_COMMENTS = [
    '哇好棒哦👏👏','今天也好看！加油！','永远支持[爱心][爱心][爱心]','冲冲冲！一起加油💪',
    '数据组已就位！姐妹们转发起来','来了来了！控评开始','大家快来转评赞！',
    '排队打卡，今天也要为ta冲数据','文案已备好，大家复制发就行','今日份安利，大家帮忙扩散',
    '超话签到第N天！每日打卡','反黑+控评+数据三位一体','已转已评已赞✅',
    '优质评论顶上去！大家帮忙点赞','日常安利我家宝贝','#话题#冲热搜大家帮忙发',
    '数据女工在线营业💼','今天的KPI是300转发，冲！','控评模板在群里，大家照着发',
    '别回复黑评！只发正面内容','统一口径：我们家XX最棒','第一！速度占领评论区',
    '每人转发三次，评论两条，点赞必须','今天的转发目标已完成80%了加油！',
    '数据不能落下，每条博都要做','营业时间到！全员出动'
];

// 渲染自定义博客页面
function ppRenderCustomBlog(area){
    var d = store.paopao;
    area.innerHTML = '<div class="pp-custom-blog-page">' +
        '<div class="pp-custom-blog-title">✍️ 自定义博客</div>' +
        '<div class="pp-custom-blog-subtitle">选择你想发布的博客类型</div>' +
        
        '<div class="pp-custom-blog-options">' +
            // 选项1：纯文字
            '<div class="pp-custom-blog-option" onclick="ppOpenCustomBlogEditor(\'text\')">' +
                '<div class="pp-custom-blog-option-icon">📝</div>' +
                '<div class="pp-custom-blog-option-info">' +
                    '<div class="pp-custom-blog-option-title">发送文字</div>' +
                    '<div class="pp-custom-blog-option-desc">发布一条纯文字博客，分享你的心情和想法</div>' +
                '</div>' +
                '<i class="fas fa-chevron-right" style="color:#ccc;"></i>' +
            '</div>' +
            
            // 选项2：文字伪装图片
            '<div class="pp-custom-blog-option" onclick="ppOpenCustomBlogEditor(\'fakeImage\')">' +
                '<div class="pp-custom-blog-option-icon">🖼️</div>' +
                '<div class="pp-custom-blog-option-info">' +
                    '<div class="pp-custom-blog-option-title">文字伪装图片</div>' +
                    '<div class="pp-custom-blog-option-desc">发送文字描述的伪装图片，展现你的视觉创意</div>' +
                '</div>' +
                '<i class="fas fa-chevron-right" style="color:#ccc;"></i>' +
            '</div>' +
            
            // 选项3：文案+文字伪装图片
            '<div class="pp-custom-blog-option" onclick="ppOpenCustomBlogEditor(\'textAndImage\')">' +
                '<div class="pp-custom-blog-option-icon">📸</div>' +
                '<div class="pp-custom-blog-option-info">' +
                    '<div class="pp-custom-blog-option-title">文案 + 文字伪装图片</div>' +
                    '<div class="pp-custom-blog-option-desc">图文并茂，文案配伪装图片效果更佳</div>' +
                '</div>' +
                '<i class="fas fa-chevron-right" style="color:#ccc;"></i>' +
            '</div>' +
        '</div>' +
        
        // 博客历史
        (d.customBlogHistory && d.customBlogHistory.length > 0 ?
            '<div class="pp-custom-blog-history-title">📋 发布历史</div>' +
            '<div class="pp-custom-blog-history">' +
                d.customBlogHistory.slice(-5).reverse().map(function(blog, idx){
                    var realIdx = d.customBlogHistory.length - 1 - idx;
                    var typeLabel = blog.type === 'text' ? '📝 纯文字' : blog.type === 'fakeImage' ? '🖼️ 伪装图片' : '📸 图文博客';
                    var preview = (blog.text || blog.imageDesc || '').substring(0, 30) + ((blog.text || blog.imageDesc || '').length > 30 ? '...' : '');
                    return '<div class="pp-custom-blog-history-item" onclick="ppShowBlogDetail(' + realIdx + ')">' +
                        '<div class="pp-custom-blog-history-type">' + typeLabel + '</div>' +
                        '<div class="pp-custom-blog-history-preview">' + escapeHtml(preview) + '</div>' +
                        '<div class="pp-custom-blog-history-stats">' +
                            '<span>❤️ ' + formatFans(blog.stats.likes) + '</span>' +
                            '<span>💬 ' + formatFans(blog.stats.comments) + '</span>' +
                            '<span>🔄 ' + formatFans(blog.stats.reposts) + '</span>' +
                        '</div>' +
                    '</div>';
                }).join('') +
            '</div>' : ''
        ) +
    '</div>';
}

// 打开自定义博客编辑器
window.ppOpenCustomBlogEditor = function(type){
    var d = store.paopao;
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay pp-blog-editor-overlay';
    overlay.id = 'pp-blog-editor-overlay';
    
    var textAreaHtml = '';
    var imageSelectHtml = '';
    
    if(type === 'text' || type === 'textAndImage'){
        textAreaHtml = '<div class="pp-blog-editor-field">' +
            '<label class="pp-blog-editor-label">✏️ 博客文案</label>' +
            '<textarea class="pp-blog-editor-textarea" id="pp-blog-text-input" placeholder="写点什么吧~" rows="4"></textarea>' +
            '<div class="pp-blog-editor-presets" id="pp-blog-text-presets">' +
                '<div class="pp-blog-editor-preset-title">💡 参考文案（点击使用）</div>' +
                '<div class="pp-blog-editor-preset-list">' +
                    shuffleArr(PP_BLOG_TEXT_PRESETS).slice(0, 6).map(function(t, i){
                        return '<div class="pp-blog-editor-preset-item" onclick="ppUseBlogPreset(\'text\',' + i + ')" data-text="' + escapeHtml(t) + '">' + escapeHtml(t.substring(0, 25)) + (t.length > 25 ? '...' : '') + '</div>';
                    }).join('') +
                '</div>' +
                '<div class="pp-blog-editor-preset-refresh" onclick="ppRefreshBlogPresets(\'text\')"><i class="fas fa-sync-alt"></i> 换一批</div>' +
            '</div>' +
        '</div>';
    }
    
    if(type === 'fakeImage' || type === 'textAndImage'){
        imageSelectHtml = '<div class="pp-blog-editor-field">' +
            '<label class="pp-blog-editor-label">🖼️ 选择伪装图片</label>' +
            '<div class="pp-blog-editor-image-grid" id="pp-blog-image-grid">' +
                shuffleArr(PP_BLOG_IMAGE_DESC_PRESETS).slice(0, 6).map(function(img, i){
                    return '<div class="pp-blog-editor-image-item" onclick="ppSelectBlogImage(this,' + i + ')" data-desc="' + escapeHtml(img) + '">' +
                        '<div class="pp-blog-editor-image-icon">' + img.split(' ')[0] + '</div>' +
                        '<div class="pp-blog-editor-image-name">' + escapeHtml(img.replace(/📷 /, '')) + '</div>' +
                    '</div>';
                }).join('') +
            '</div>' +
            '<div class="pp-blog-editor-preset-refresh" onclick="ppRefreshBlogPresets(\'image\')"><i class="fas fa-sync-alt"></i> 换一批图片</div>' +
            '<div class="pp-blog-editor-custom-image">' +
                '<label class="pp-blog-editor-label">或自定义图片描述</label>' +
                '<input type="text" class="pp-blog-editor-input" id="pp-blog-custom-image" placeholder="例如：📷 [海边日落.jpg]">' +
            '</div>' +
        '</div>';
    }
    
    overlay.innerHTML = '<div class="pp-blog-editor-modal">' +
        '<div class="pp-blog-editor-header">' +
            '<div class="pp-blog-editor-close" onclick="this.closest(\'.pp-result-overlay\').remove()"><i class="fas fa-times"></i></div>' +
            '<div class="pp-blog-editor-title">' +
                (type === 'text' ? '📝 发送文字博客' : type === 'fakeImage' ? '🖼️ 发送伪装图片' : '📸 发送图文博客') +
            '</div>' +
        '</div>' +
        textAreaHtml +
        imageSelectHtml +
        '<div class="pp-blog-editor-actions">' +
            '<button class="pp-blog-editor-btn pp-blog-editor-btn-cancel" onclick="this.closest(\'.pp-result-overlay\').remove()">取消</button>' +
            '<button class="pp-blog-editor-btn pp-blog-editor-btn-send" onclick="ppSendCustomBlog(\'' + type + '\')"><i class="fas fa-paper-plane"></i> 发布</button>' +
        '</div>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
    
    window._ppSelectedBlogImage = '';
    window._ppBlogEditorType = type;
};

// 选择博客伪装图片
window.ppSelectBlogImage = function(el, idx){
    document.querySelectorAll('.pp-blog-editor-image-item').forEach(function(item){
        item.classList.remove('selected');
    });
    el.classList.add('selected');
    window._ppSelectedBlogImage = el.getAttribute('data-desc') || '';
    var customInput = document.getElementById('pp-blog-custom-image');
    if(customInput) customInput.value = '';
};

// 使用预设文案
window.ppUseBlogPreset = function(type, idx){
    if(type === 'text'){
        var items = document.querySelectorAll('.pp-blog-editor-preset-item');
        if(items[idx]){
            var textarea = document.getElementById('pp-blog-text-input');
            if(textarea) textarea.value = items[idx].getAttribute('data-text') || '';
        }
    }
};

// 刷新预设
window.ppRefreshBlogPresets = function(type){
    if(type === 'text'){
        var presetList = document.querySelector('.pp-blog-editor-preset-list');
        if(presetList){
            presetList.innerHTML = shuffleArr(PP_BLOG_TEXT_PRESETS).slice(0, 6).map(function(t, i){
                return '<div class="pp-blog-editor-preset-item" onclick="ppUseBlogPreset(\'text\',' + i + ')" data-text="' + escapeHtml(t) + '">' + escapeHtml(t.substring(0, 25)) + (t.length > 25 ? '...' : '') + '</div>';
            }).join('');
        }
    } else if(type === 'image'){
        var grid = document.getElementById('pp-blog-image-grid');
        if(grid){
            grid.innerHTML = shuffleArr(PP_BLOG_IMAGE_DESC_PRESETS).slice(0, 6).map(function(img, i){
                return '<div class="pp-blog-editor-image-item" onclick="ppSelectBlogImage(this,' + i + ')" data-desc="' + escapeHtml(img) + '">' +
                    '<div class="pp-blog-editor-image-icon">' + img.split(' ')[0] + '</div>' +
                    '<div class="pp-blog-editor-image-name">' + escapeHtml(img.replace(/📷 /, '')) + '</div>' +
                '</div>';
            }).join('');
        }
    }
};

// 发送自定义博客
window.ppSendCustomBlog = function(type){
    var d = store.paopao;
    var text = '';
    var imageDesc = '';
    
    if(type === 'text' || type === 'textAndImage'){
        var textarea = document.getElementById('pp-blog-text-input');
        text = textarea ? textarea.value.trim() : '';
        if(!text && type === 'text'){
            showPpResult('⚠️ 请输入内容', '博客文案不能为空哦~', false);
            return;
        }
    }
    
    if(type === 'fakeImage' || type === 'textAndImage'){
        var customInput = document.getElementById('pp-blog-custom-image');
        var customVal = customInput ? customInput.value.trim() : '';
        if(customVal){
            imageDesc = customVal;
        } else if(window._ppSelectedBlogImage){
            imageDesc = window._ppSelectedBlogImage;
        }
        if(!imageDesc){
            showPpResult('⚠️ 请选择图片', '请选择一张伪装图片或自定义图片描述~', false);
            return;
        }
    }
    
    if(type === 'textAndImage' && !text && !imageDesc){
        showPpResult('⚠️ 请输入内容', '请至少填写文案或选择图片~', false);
        return;
    }
    
    // 关闭编辑器
    var editorOverlay = document.getElementById('pp-blog-editor-overlay');
    if(editorOverlay) editorOverlay.remove();
    
    // 计算博客数据（基于粉丝数、咖位、随机性）
    var fansBase = Math.max(100, Math.floor(d.fans * 0.005));
    var tierMultiplier = d.tier === '超一线顶流' ? 10 : d.tier === '一线明星' ? 7 : d.tier === '准一线' ? 5 : d.tier === '二线明星' ? 3.5 : d.tier === '三线明星' ? 2.5 : d.tier === '四线明星' ? 1.8 : d.tier === '五线明星' ? 1.3 : 1;
    var typeMultiplier = type === 'textAndImage' ? 1.5 : type === 'fakeImage' ? 1.2 : 1;
    var randomFactor = 0.5 + Math.random() * 2;
    
    var baseLikes = Math.floor(fansBase * tierMultiplier * typeMultiplier * randomFactor);
    var baseComments = Math.floor(baseLikes * (0.05 + Math.random() * 0.15));
    var baseReposts = Math.floor(baseLikes * (0.02 + Math.random() * 0.08));
    
    // 涨粉效果
    var fansChange = Math.floor(baseLikes * (0.01 + Math.random() * 0.05));
    // 小概率掉粉（如果是争议内容）
    if(Math.random() < 0.1){
        fansChange = -Math.floor(fansBase * 0.3 * Math.random());
        baseComments = Math.floor(baseComments * 2); // 争议内容评论更多
    }
    
    // 生成评论列表
    var commentList = ppGenerateBlogComments(baseLikes, baseComments, d);
    
    var blogPost = {
        id: 'cblog_' + Date.now(),
        type: type,
        text: text,
        imageDesc: imageDesc,
        date: Date.now(),
        stats: {
            likes: baseLikes,
            comments: baseComments,
            reposts: baseReposts
        },
        commentList: commentList,
        fansChange: fansChange
    };
    
    d.customBlogHistory.push(blogPost);
    d.fans = Math.max(0, d.fans + fansChange);
    d.tier = calcTier(d.fans);
    // [FIX] 发博客时随机给粉丝增加likes/reposts统计
    if(d.fanProfiles){
        var fKeys = Object.keys(d.fanProfiles);
        var likeCount = Math.min(fKeys.length, Math.floor(baseLikes / 500) + 1);
        for(var fi = 0; fi < likeCount && fi < fKeys.length; fi++){
            var fp = d.fanProfiles[fKeys[Math.floor(Math.random()*fKeys.length)]];
            if(fp && !fp.isBlackFan){
                fp.stats = fp.stats || {};
                fp.stats.likes = (fp.stats.likes||0) + Math.floor(Math.random()*3) + 1;
                if(Math.random() < 0.3) fp.stats.reposts = (fp.stats.reposts||0) + 1;
            }
        }
    }
    d.blogPosts.push({
        title: text ? text.substring(0, 20) : (imageDesc ? imageDesc.substring(0, 20) : '自定义博客'),
        likes: baseLikes,
        comments: baseComments,
        reposts: baseReposts,
        date: Date.now()
    });
    save();
    
    // 更新粉丝数显示
    var fansEl = document.querySelector('.pp-nav-fans');
    if(fansEl) fansEl.innerHTML = '<i class="fas fa-heart"></i> ' + formatFans(d.fans);
    
    // 显示博客详情弹窗
    ppShowBlogDetailPopup(blogPost);
};

// 生成博客评论列表
function ppGenerateBlogComments(likes, commentCount, d){
    var comments = [];
    var totalComments = Math.min(Math.max(8, commentCount), 30); // 显示8-30条评论
    
    for(var i = 0; i < totalComments; i++){
        var r = Math.random();
        var commentType, commentText;
        
        if(r < 0.55){
            // 55%好评
            commentType = 'good';
            commentText = ppReplaceTitle(PP_GOOD_COMMENTS[Math.floor(Math.random() * PP_GOOD_COMMENTS.length)]);
        } else if(r < 0.75){
            // 20%恶评
            commentType = 'bad';
            commentText = PP_BAD_COMMENTS[Math.floor(Math.random() * PP_BAD_COMMENTS.length)];
        } else {
            // 25%控评
            commentType = 'controlled';
            commentText = ppReplaceTitle(PP_CONTROLLED_COMMENTS[Math.floor(Math.random() * PP_CONTROLLED_COMMENTS.length)]);
        }
        
        comments.push({
            name: ppGetFanName(),
            text: commentText,
            type: commentType,
            likes: Math.floor(Math.random() * likes * 0.01),
            time: Math.floor(Math.random() * 3600) + '秒前'
        });
    }
    
    return comments;
}

// 显示博客详情弹窗
function ppShowBlogDetailPopup(blog){
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay pp-blog-detail-overlay';
    overlay.id = 'pp-blog-detail-overlay';
    
    var d = store.paopao;
    var avatarHtml = d.avatar ?
        '<img src="' + d.avatar + '" class="pp-blog-detail-avatar">' :
        '<div class="pp-blog-detail-avatar-placeholder">' + (d.stageName||'星').charAt(0) + '</div>';
    
    var contentHtml = '';
    if(blog.text){
        contentHtml += '<div class="pp-blog-detail-text">' + escapeHtml(blog.text) + '</div>';
    }
    if(blog.imageDesc){
        contentHtml += '<div class="pp-blog-detail-image">' +
            '<div class="pp-blog-detail-image-box">' +
                '<i class="fas fa-image"></i>' +
                '<span>' + escapeHtml(blog.imageDesc) + '</span>' +
            '</div>' +
        '</div>';
    }
    
    // 评论分类标签
    var commentFilterHtml = '<div class="pp-blog-comment-filters">' +
        '<div class="pp-blog-comment-filter active" onclick="ppFilterBlogComments(\'all\',this)">全部</div>' +
        '<div class="pp-blog-comment-filter" onclick="ppFilterBlogComments(\'good\',this)">🌟 好评</div>' +
        '<div class="pp-blog-comment-filter" onclick="ppFilterBlogComments(\'bad\',this)">👎 恶评</div>' +
        '<div class="pp-blog-comment-filter" onclick="ppFilterBlogComments(\'controlled\',this)">🛡️ 控评</div>' +
    '</div>';
    
    // 评论列表
    var commentsHtml = '<div class="pp-blog-comments-list" id="pp-blog-comments-list">';
    if(blog.commentList && blog.commentList.length > 0){
        blog.commentList.forEach(function(c){
            var typeClass = c.type === 'good' ? 'pp-comment-good' : c.type === 'bad' ? 'pp-comment-bad' : 'pp-comment-controlled';
            var typeTag = c.type === 'good' ? '<span class="pp-comment-tag pp-comment-tag-good">好评</span>' :
                          c.type === 'bad' ? '<span class="pp-comment-tag pp-comment-tag-bad">恶评</span>' :
                          '<span class="pp-comment-tag pp-comment-tag-controlled">控评</span>';
            commentsHtml += '<div class="pp-blog-comment-item ' + typeClass + '" data-type="' + c.type + '">' +
                '<div class="pp-blog-comment-header">' +
                    '<span class="pp-blog-comment-name">' + escapeHtml(c.name) + '</span>' +
                    typeTag +
                    '<span class="pp-blog-comment-time">' + c.time + '</span>' +
                '</div>' +
                '<div class="pp-blog-comment-text">' + escapeHtml(c.text) + '</div>' +
                '<div class="pp-blog-comment-actions">' +
                    '<span><i class="fas fa-heart"></i> ' + c.likes + '</span>' +
                    '<span><i class="fas fa-reply"></i> 回复</span>' +
                '</div>' +
            '</div>';
        });
    }
    commentsHtml += '</div>';
    
    var fansChangeHtml = '';
    if(blog.fansChange > 0){
        fansChangeHtml = '<div class="pp-blog-detail-fans-change pp-fans-up">📈 涨粉 +' + formatFans(blog.fansChange) + '</div>';
    } else if(blog.fansChange < 0){
        fansChangeHtml = '<div class="pp-blog-detail-fans-change pp-fans-down">📉 掉粉 -' + formatFans(Math.abs(blog.fansChange)) + '</div>';
    }
    
    overlay.innerHTML = '<div class="pp-blog-detail-modal">' +
        '<div class="pp-blog-detail-close" onclick="this.closest(\'.pp-result-overlay\').remove()"><i class="fas fa-times"></i></div>' +
        
        // 博客内容区
        '<div class="pp-blog-detail-content">' +
            '<div class="pp-blog-detail-user">' +
                avatarHtml +
                '<div class="pp-blog-detail-user-info">' +
                    '<div class="pp-blog-detail-username">' + escapeHtml(d.stageName || '小星星') + '</div>' +
                    '<div class="pp-blog-detail-time">刚刚</div>' +
                '</div>' +
            '</div>' +
            contentHtml +
        '</div>' +
        
        // 数据统计
        '<div class="pp-blog-detail-stats">' +
            '<div class="pp-blog-detail-stat">' +
                '<i class="fas fa-retweet" style="color:#00b894;"></i>' +
                '<span class="pp-blog-detail-stat-num">' + formatFans(blog.stats.reposts) + '</span>' +
                '<span class="pp-blog-detail-stat-label">转发</span>' +
            '</div>' +
            '<div class="pp-blog-detail-stat">' +
                '<i class="fas fa-comment" style="color:#6c5ce7;"></i>' +
                '<span class="pp-blog-detail-stat-num">' + formatFans(blog.stats.comments) + '</span>' +
                '<span class="pp-blog-detail-stat-label">评论</span>' +
            '</div>' +
            '<div class="pp-blog-detail-stat">' +
                '<i class="fas fa-heart" style="color:#ff6b81;"></i>' +
                '<span class="pp-blog-detail-stat-num">' + formatFans(blog.stats.likes) + '</span>' +
                '<span class="pp-blog-detail-stat-label">点赞</span>' +
            '</div>' +
        '</div>' +
        
        fansChangeHtml +
        
        // 评论区
        '<div class="pp-blog-detail-comment-section">' +
            '<div class="pp-blog-detail-comment-title">💬 评论区 (' + (blog.commentList ? blog.commentList.length : 0) + '条)</div>' +
            commentFilterHtml +
            commentsHtml +
        '</div>' +
        
        '<div class="pp-blog-detail-done-btn" onclick="this.closest(\'.pp-result-overlay\').remove();ppRenderFuncContent();">知道了</div>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
}

// 查看历史博客详情
window.ppShowBlogDetail = function(idx){
    var d = store.paopao;
    if(!d.customBlogHistory || !d.customBlogHistory[idx]) return;
    ppShowBlogDetailPopup(d.customBlogHistory[idx]);
};

// 过滤评论
window.ppFilterBlogComments = function(type, el){
    document.querySelectorAll('.pp-blog-comment-filter').forEach(function(f){ f.classList.remove('active'); });
    if(el) el.classList.add('active');
    
    document.querySelectorAll('.pp-blog-comment-item').forEach(function(item){
        if(type === 'all'){
            item.style.display = '';
        } else {
            item.style.display = item.getAttribute('data-type') === type ? '' : 'none';
        }
    });
};

// ====== 获奖系统 ======
var PP_AWARD_CEREMONIES = [
    {name: '金鹰奖', prestige: 5, icon: '🏆'},
    {name: '白玉兰奖', prestige: 5, icon: '🏵️'},
    {name: '金鸡奖', prestige: 5, icon: '🐔'},
    {name: '百花奖', prestige: 5, icon: '🌸'},
    {name: '华表奖', prestige: 4, icon: '🏛️'},
    {name: '金马奖', prestige: 5, icon: '🐴'},
    {name: '金像奖', prestige: 5, icon: '🎬'},
    {name: '飞天奖', prestige: 4, icon: '🕊️'},
    {name: '春燕奖', prestige: 3, icon: '🐦'},
    {name: '华鼎奖', prestige: 3, icon: '🏅'},
    {name: '金凤凰奖', prestige: 3, icon: '🦅'},
    {name: '微博之夜', prestige: 2, icon: '📱'},
    {name: '星光大赏', prestige: 2, icon: '⭐'},
    {name: '亚洲影视大奖', prestige: 4, icon: '🌏'},
    {name: '国际电影节', prestige: 5, icon: '🎞️'},
    {name: '青年电影节', prestige: 3, icon: '🌱'},
    {name: '网络剧盛典', prestige: 2, icon: '💻'},
    {name: '年度盛典', prestige: 2, icon: '🎊'},
    {name: '影响力盛典', prestige: 3, icon: '💫'},
    {name: '品质盛典', prestige: 3, icon: '💎'}
];

var PP_AWARD_CATEGORIES = [
    {name: '最佳男主角', gender: 'male', type: 'lead', minTier: '三线明星'},
    {name: '最佳女主角', gender: 'female', type: 'lead', minTier: '三线明星'},
    {name: '最佳男配角', gender: 'male', type: 'support', minTier: '五线明星'},
    {name: '最佳女配角', gender: 'female', type: 'support', minTier: '五线明星'},
    {name: '最佳新人奖', gender: 'any', type: 'newcomer', minTier: '十八线'},
    {name: '最佳人气奖', gender: 'any', type: 'popular', minTier: '四线明星'},
    {name: '最具潜力奖', gender: 'any', type: 'potential', minTier: '出道新人'},
    {name: '最佳演技奖', gender: 'any', type: 'acting', minTier: '二线明星'},
    {name: '最佳突破奖', gender: 'any', type: 'breakthrough', minTier: '五线明星'},
    {name: '年度最佳艺人', gender: 'any', type: 'best_artist', minTier: '准一线'},
    {name: '最受欢迎演员', gender: 'any', type: 'most_popular', minTier: '三线明星'},
    {name: '最佳荧幕搭档', gender: 'any', type: 'best_duo', minTier: '四线明星'},
    {name: '年度话题人物', gender: 'any', type: 'topic', minTier: '二线明星'},
    {name: '最佳跨界艺人', gender: 'any', type: 'crossover', minTier: '三线明星'},
    {name: '最佳综艺表现', gender: 'any', type: 'variety_best', minTier: '四线明星'},
    {name: '最佳银幕形象', gender: 'any', type: 'screen_image', minTier: '三线明星'}
];

var PP_TIER_ORDER = ['十八线','出道新人','崭露头角','小有名气','五线明星','四线明星','三线明星','二线明星','准一线','一线明星','超一线顶流'];

function ppGetTierIndex(tier){
    return PP_TIER_ORDER.indexOf(tier);
}

// 检查并生成奖项提名
function ppCheckAwards(){
    var d = store.paopao;
    if(!d.works || d.works.length === 0) return [];
    
    // 每次进入页面检查一次（冷却30秒）
    if(Date.now() - (d.lastAwardCheck || 0) < 30000 && d.awardNominations && d.awardNominations.length > 0) return d.awardNominations;
    
    var currentTierIdx = ppGetTierIndex(d.tier);
    var nominations = d.awardNominations ? d.awardNominations.filter(function(n){ return n.status !== 'pending'; }) : [];
    
    // 根据作品和咖位生成新的提名
    var maxNewNominations = Math.min(3, Math.max(1, Math.floor(d.works.length * 0.3)));
    var newCount = 0;
    
    for(var i = 0; i < d.works.length && newCount < maxNewNominations; i++){
        var work = d.works[i];
        // 每个作品只有一定概率获得提名
        if(Math.random() > 0.4) continue;
        
        // 选择合适的奖项类别
        var eligibleCategories = PP_AWARD_CATEGORIES.filter(function(cat){
            if(cat.gender !== 'any' && cat.gender !== d.gender) return false;
            var minTierIdx = ppGetTierIndex(cat.minTier);
            return currentTierIdx >= minTierIdx;
        });
        
        if(eligibleCategories.length === 0) continue;
        
        var category = eligibleCategories[Math.floor(Math.random() * eligibleCategories.length)];
        var ceremony = PP_AWARD_CEREMONIES[Math.floor(Math.random() * PP_AWARD_CEREMONIES.length)];
        
        // 检查是否已有相同提名
        var hasSame = nominations.some(function(n){
            return n.category === category.name && n.ceremony === ceremony.name && n.work === work.name;
        });
        if(hasSame) continue;
        
        // 计算获奖概率（基于咖位、作品热度、奖项等级）
        var winChance = 0.1 + (currentTierIdx / PP_TIER_ORDER.length) * 0.4;
        if(ceremony.prestige >= 4) winChance *= 0.6; // 高含金量奖项更难获得
        if(work.fans > d.fans * 0.1) winChance += 0.1; // 热门作品加成
        var won = Math.random() < winChance;
        
        nominations.push({
            category: category.name,
            ceremony: ceremony.name,
            ceremonyIcon: ceremony.icon,
            work: work.name,
            date: Date.now() - Math.floor(Math.random() * 30 * 86400000),
            status: won ? 'won' : (Math.random() < 0.5 ? 'nominated' : 'lost'),
            prestige: ceremony.prestige
        });
        newCount++;
    }
    
    // 新人如果没有作品但已出道，也有机会获得新人奖提名
    if(currentTierIdx >= 1 && currentTierIdx <= 4 && nominations.length === 0){
        var ceremony = PP_AWARD_CEREMONIES[Math.floor(Math.random() * PP_AWARD_CEREMONIES.length)];
        var won = Math.random() < 0.3;
        nominations.push({
            category: '最佳新人奖',
            ceremony: ceremony.name,
            ceremonyIcon: ceremony.icon,
            work: d.stageName + '的出道之路',
            date: Date.now(),
            status: won ? 'won' : 'nominated',
            prestige: ceremony.prestige
        });
    }
    
    d.awardNominations = nominations;
    d.lastAwardCheck = Date.now();
    // [FIX] 将获奖的提名同步写入 d.awards（回忆录读取此字段）
    var newWon = nominations.filter(function(n){ return n.status === 'won'; });
    if(newWon.length > 0){
        if(!d.awards) d.awards = [];
        newWon.forEach(function(w){
            // 去重：同一奖项+同一作品不重复写入
            var exists = d.awards.some(function(a){ return a.ceremony === w.ceremony && a.category === w.category && a.work === w.work; });
            if(!exists){
                d.awards.push({ name: w.ceremony + ' ' + w.category, ceremony: w.ceremony, category: w.category, work: w.work, date: w.date });
            }
        });
    }
    save();
    return nominations;
}

// 渲染获奖系统页面
function ppRenderAwards(){
    var d = store.paopao;
    var nominations = ppCheckAwards();
    
    var wonAwards = nominations.filter(function(n){ return n.status === 'won'; });
    var nominatedAwards = nominations.filter(function(n){ return n.status === 'nominated'; });
    var lostAwards = nominations.filter(function(n){ return n.status === 'lost'; });
    
    var html = '<div class="pp-awards-page">' +
        '<div class="pp-awards-summary">' +
            '<div class="pp-awards-summary-item">' +
                '<div class="pp-awards-summary-num">' + wonAwards.length + '</div>' +
                '<div class="pp-awards-summary-label">🏆 获奖</div>' +
            '</div>' +
            '<div class="pp-awards-summary-item">' +
                '<div class="pp-awards-summary-num">' + nominatedAwards.length + '</div>' +
                '<div class="pp-awards-summary-label">🎯 提名中</div>' +
            '</div>' +
            '<div class="pp-awards-summary-item">' +
                '<div class="pp-awards-summary-num">' + lostAwards.length + '</div>' +
                '<div class="pp-awards-summary-label">😢 惜败</div>' +
            '</div>' +
        '</div>';
    
    if(wonAwards.length > 0){
        html += '<div class="pp-awards-section-title">🏆 获得的奖项</div>';
        wonAwards.forEach(function(award){
            html += '<div class="pp-award-card pp-award-won">' +
                '<div class="pp-award-icon">' + (award.ceremonyIcon || '🏆') + '</div>' +
                '<div class="pp-award-info">' +
                    '<div class="pp-award-ceremony">' + escapeHtml(award.ceremony) + '</div>' +
                    '<div class="pp-award-category">' + escapeHtml(award.category) + '</div>' +
                    '<div class="pp-award-work">作品：' + escapeHtml(award.work) + '</div>' +
                '</div>' +
                '<div class="pp-award-badge">🏆 获奖</div>' +
            '</div>';
        });
    }
    
    if(nominatedAwards.length > 0){
        html += '<div class="pp-awards-section-title">🎯 提名中的奖项</div>';
        nominatedAwards.forEach(function(award){
            html += '<div class="pp-award-card pp-award-nominated">' +
                '<div class="pp-award-icon">' + (award.ceremonyIcon || '🎯') + '</div>' +
                '<div class="pp-award-info">' +
                    '<div class="pp-award-ceremony">' + escapeHtml(award.ceremony) + '</div>' +
                    '<div class="pp-award-category">' + escapeHtml(award.category) + '</div>' +
                    '<div class="pp-award-work">作品：' + escapeHtml(award.work) + '</div>' +
                '</div>' +
                '<div class="pp-award-badge pp-award-badge-nominated">🎯 提名</div>' +
            '</div>';
        });
    }
    
    if(lostAwards.length > 0){
        html += '<div class="pp-awards-section-title">📋 历史提名</div>';
        lostAwards.forEach(function(award){
            html += '<div class="pp-award-card pp-award-lost">' +
                '<div class="pp-award-icon">' + (award.ceremonyIcon || '📋') + '</div>' +
                '<div class="pp-award-info">' +
                    '<div class="pp-award-ceremony">' + escapeHtml(award.ceremony) + '</div>' +
                    '<div class="pp-award-category">' + escapeHtml(award.category) + '</div>' +
                    '<div class="pp-award-work">作品：' + escapeHtml(award.work) + '</div>' +
                '</div>' +
                '<div class="pp-award-badge pp-award-badge-lost">惜败</div>' +
            '</div>';
        });
    }
    
    if(nominations.length === 0){
        html += '<div class="pp-empty-hint">暂无奖项提名<br>多参加拍摄，提升咖位后会有更多获奖机会！</div>';
    }
    
    html += '<div class="pp-refresh-btn" onclick="ppRefreshAwards()"><i class="fas fa-sync-alt"></i> 刷新奖项</div>';
    html += '</div>';
    
    return html;
}

window.ppRefreshAwards = function(){
    var d = store.paopao;
    d.lastAwardCheck = 0;
    d.awardNominations = [];
    save();
    ppRenderTab();
};

// ====== 微博热搜系统（仿真版）======
var _weiboDiscoverSubPage = 'main'; // main / search / topicDetail
var _weiboSearchQuery = '';
var _weiboCurrentTopicRank = null;
var _weiboGenerating = false;
var _weiboTopicGenerating = false;

// ====== 发现页主渲染 ======
function ppRenderDiscover(area){
    if(!area) return;
    if(_weiboDiscoverSubPage === 'search') return ppRenderWeiboSearch(area);
    if(_weiboDiscoverSubPage === 'topicDetail') return ppRenderWeiboTopicDetail(area);
    var d = store.paopao;
    var cache = d.weiboHotCache;
    var timeStr = cache ? new Date(cache.generatedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}) : '';

    var html = '<div class="pp-weibo-discover">';
    // 搜索栏
    html += '<div class="pp-wb-search-bar" onclick="ppWeiboOpenSearch()">' +
        '<i class="fas fa-search"></i><span>搜索微博内容、话题...</span></div>';

    // 标题+刷新
    html += '<div class="pp-wb-header">' +
        '<div class="pp-wb-header-left"><i class="fas fa-fire" style="color:#ff3b30"></i> 微博热搜</div>' +
        '<div class="pp-wb-header-right">' +
            (timeStr ? '<span class="pp-wb-time">更新于 '+timeStr+'</span>' : '') +
            '<div class="pp-wb-refresh-btn" onclick="ppWeiboRefreshHotList()"><i class="fas fa-sync-alt"></i> 刷新</div>' +
        '</div></div>';

    if(_weiboGenerating){
        html += '<div class="pp-wb-loading"><div class="pp-wb-loading-spinner"></div><div>正在生成热搜榜...</div></div>';
    } else if(!cache || !cache.items || cache.items.length === 0){
        html += '<div class="pp-wb-empty">' +
            '<i class="fas fa-fire-alt" style="font-size:36px;opacity:0.2;margin-bottom:12px;display:block;"></i>' +
            '还没有热搜数据<br><span style="font-size:12px;color:var(--pp-text-4);">点击上方「刷新」按钮生成热搜榜</span></div>';
    } else {
        // 与我相关的热搜提示
        var selfItems = cache.items.filter(function(h){ return h.isSelf; });
        if(selfItems.length > 0){
            html += '<div class="pp-wb-self-banner" onclick="ppWeiboGoTopic('+selfItems[0].rank+')">' +
                '<div class="pp-wb-self-banner-tag">与我相关</div>' +
                '<div class="pp-wb-self-banner-topic">' + escapeHtml(selfItems[0].topic) + '</div>' +
                '<div class="pp-wb-self-banner-heat">热度 ' + escapeHtml(selfItems[0].heat||'') + ' · 排名 #' + selfItems[0].rank + '</div>' +
            '</div>';
        }
        // 热搜列表
        html += '<div class="pp-wb-hot-list">';
        cache.items.forEach(function(item){
            if(item.isAd){
                html += '<div class="pp-wb-hot-item pp-wb-hot-ad" onclick="ppWeiboGoTopic('+item.rank+')">' +
                    '<div class="pp-wb-hot-rank-ad">广告</div>' +
                    '<div class="pp-wb-hot-body">' +
                        '<div class="pp-wb-hot-topic">' + escapeHtml(item.topic) + ' <span class="pp-wb-tag pp-wb-tag-rec">荐</span></div>' +
                    '</div></div>';
                return;
            }
            var rankClass = item.rank <= 3 ? ' pp-wb-rank-top'+item.rank : '';
            var selfClass = item.isSelf ? ' pp-wb-item-self' : '';
            var tagHtml = '';
            if(item.tag === '爆') tagHtml = '<span class="pp-wb-tag pp-wb-tag-boom">爆</span>';
            else if(item.tag === '沸') tagHtml = '<span class="pp-wb-tag pp-wb-tag-boil">沸</span>';
            else if(item.tag === '热') tagHtml = '<span class="pp-wb-tag pp-wb-tag-hot">热</span>';
            else if(item.tag === '新') tagHtml = '<span class="pp-wb-tag pp-wb-tag-new">新</span>';
            var trendHtml = '';
            if(item.trend === 'up') trendHtml = '<i class="fas fa-arrow-up pp-wb-trend-up"></i>';
            else if(item.trend === 'down') trendHtml = '<i class="fas fa-arrow-down pp-wb-trend-down"></i>';
            else trendHtml = '<i class="fas fa-minus pp-wb-trend-flat"></i>';

            html += '<div class="pp-wb-hot-item'+selfClass+'" onclick="ppWeiboGoTopic('+item.rank+')">' +
                '<div class="pp-wb-hot-rank'+rankClass+'">' + item.rank + '</div>' +
                '<div class="pp-wb-hot-body">' +
                    '<div class="pp-wb-hot-topic">' + escapeHtml(item.topic) + ' ' + tagHtml + '</div>' +
                    '<div class="pp-wb-hot-meta">' +
                        '<span>' + escapeHtml(item.heat||'') + '</span>' +
                        (item.summary ? '<span class="pp-wb-hot-summary">' + escapeHtml(item.summary).substring(0,20) + '</span>' : '') +
                        trendHtml +
                    '</div>' +
                '</div></div>';
        });
        html += '</div>';
    }

    // 热搜运营面板
    if(cache && cache.items && cache.items.length > 0){
        html += '<div class="pp-wb-ops-panel">' +
            '<div class="pp-wb-ops-title"><i class="fas fa-tools"></i> 热搜运营</div>' +
            '<div class="pp-wb-ops-btns">' +
                '<div class="pp-wb-ops-btn" onclick="ppWeiboBuyHot()"><div class="pp-wb-ops-icon">💰</div><div class="pp-wb-ops-name">买热搜</div><div class="pp-wb-ops-cost">¥5万起</div></div>' +
                '<div class="pp-wb-ops-btn" onclick="ppWeiboRemoveHot()"><div class="pp-wb-ops-icon">🚫</div><div class="pp-wb-ops-name">撤热搜</div><div class="pp-wb-ops-cost">¥8万</div></div>' +
                '<div class="pp-wb-ops-btn" onclick="ppWeiboControlComments()"><div class="pp-wb-ops-icon">🛡️</div><div class="pp-wb-ops-name">控评</div><div class="pp-wb-ops-cost">¥2万</div></div>' +
            '</div></div>';
    }

    html += '</div>';
    area.innerHTML = html;
}

// ====== API生成热搜榜 ======
var _ppWeiboRefreshCooldown = 0; // [FIX] 刷新冷却时间戳
window.ppWeiboRefreshHotList = async function(){
    if(_weiboGenerating) return;
    // [FIX] 60秒冷却防止狂刷API
    var now = Date.now();
    if(now - _ppWeiboRefreshCooldown < 60000){
        var sec = Math.ceil((60000 - (now - _ppWeiboRefreshCooldown)) / 1000);
        if(typeof toast === 'function') toast('冷却中，' + sec + '秒后可刷新');
        return;
    }
    if(!window.API || !API.chatCompletion){
        if(typeof toast === 'function') toast('请先配置API');
        return;
    }
    _currentApiScene = 'paopao';
    _weiboGenerating = true;
    _ppWeiboRefreshCooldown = now;
    var d = store.paopao;
    var area = document.getElementById('pp-tab-content');
    if(area) ppRenderDiscover(area);

    var stageName = d.stageName || '小星星';
    var tier = d.tier || '素人';
    var fans = formatFans(d.fans);
    var tierIdx = ppGetTierIndex(tier);
    var genderText = d.gender === 'male' ? '男艺人' : '女艺人';

    var prompt = '你是微博热搜榜模拟器。请生成一份完整的50条微博热搜榜。\n\n' +
        '玩家信息：艺名「'+stageName+'」，'+genderText+'，咖位「'+tier+'」，粉丝数'+fans+'。\n\n' +
        '要求：\n' +
        '1. 生成50条热搜，风格完全模拟真实微博热搜\n' +
        '2. 根据咖位安排'+Math.min(5,Math.max(0,Math.floor(tierIdx*0.5)))+'~'+Math.min(5,Math.max(1,Math.floor(tierIdx*0.5)+1))+'条与玩家相关的热搜（含玩家艺名）\n' +
        '3. 每条包含：rank(排名1-50)、topic(话题)、heat(热度如"2.3亿"/"356.8万")、tag(爆/沸/热/新/null)、trend(up/down/stable)、category(entertainment/social/sports/tech/gaming)、isSelf(是否与玩家相关true/false)、isAd(是否广告)、summary(一句话摘要15字内)\n' +
        '4. 话题类型多样：明星八卦、社会新闻、综艺、体育、搞笑、科技、游戏等\n' +
        '5. 前3名必须有"爆"或"沸"标签\n' +
        '6. 第5位和第15位设为广告(isAd:true)\n' +
        '7. 与玩家相关的热搜排名：顶流1-5名，一线1-10名，二三线5-20名，新人25-50名\n\n' +
        '严格只输出JSON数组，不要markdown代码块，不要其他文字：\n' +
        '[{"rank":1,"topic":"话题","heat":"2.3亿","tag":"爆","trend":"up","category":"entertainment","isSelf":false,"isAd":false,"summary":"摘要"}]';

    try {
        var data = await API.chatCompletion([
            {role:'system', content: prompt},
            {role:'user', content: '生成热搜榜'}
        ], {temperature: 0.95, scene: 'paopao'});

        var reply = (data.choices[0].message.content || '').trim();
        var jsonMatch = reply.match(/\[[\s\S]*\]/);
        if(jsonMatch){
            var items = JSON.parse(jsonMatch[0]);
            // 确保数据完整性
            items.forEach(function(it,i){
                if(!it.rank) it.rank = i+1;
                if(!it.heat) it.heat = Math.floor(Math.random()*500+10)+'万';
                if(!it.trend) it.trend = 'stable';
                if(!it.category) it.category = 'entertainment';
                if(it.isSelf === undefined) it.isSelf = false;
                if(it.isAd === undefined) it.isAd = false;
            });
            d.weiboHotCache = { generatedAt: Date.now(), items: items };
            d.weiboTopicCache = {}; // 刷新热搜时清空话题缓存
            save();
            if(typeof toast === 'function') toast('热搜榜已更新');
        } else {
            throw new Error('JSON解析失败');
        }
    } catch(e){
        console.error('[weibo] 热搜生成失败:', e);
        if(typeof toast === 'function') toast('热搜生成失败，请重试');
    } finally {
        _weiboGenerating = false;
        area = document.getElementById('pp-tab-content');
        if(area && activeTab === 'discover') ppRenderDiscover(area);
    }
};

// ====== 话题详情页 ======
window.ppWeiboGoTopic = function(rank){
    _weiboCurrentTopicRank = rank;
    _weiboDiscoverSubPage = 'topicDetail';
    var area = document.getElementById('pp-tab-content');
    if(area) ppRenderWeiboTopicDetail(area);
};

window.ppWeiboBackToDiscover = function(){
    _weiboDiscoverSubPage = 'main';
    _weiboCurrentTopicRank = null;
    var area = document.getElementById('pp-tab-content');
    if(area) ppRenderDiscover(area);
};

function ppRenderWeiboTopicDetail(area){
    var d = store.paopao;
    var rank = _weiboCurrentTopicRank;
    if(!d.weiboHotCache || !rank){ ppWeiboBackToDiscover(); return; }
    var item = d.weiboHotCache.items.find(function(h){ return h.rank === rank; });
    if(!item){ ppWeiboBackToDiscover(); return; }

    var detail = d.weiboTopicCache[rank];
    var html = '<div class="pp-wb-topic-page">';
    html += '<div class="pp-wb-topic-header">' +
        '<div class="pp-wb-topic-back" onclick="ppWeiboBackToDiscover()"><i class="fas fa-chevron-left"></i></div>' +
        '<div class="pp-wb-topic-headtitle">话题详情</div>' +
    '</div>';

    // 话题信息
    var tagHtml = '';
    if(item.tag === '爆') tagHtml = '<span class="pp-wb-tag pp-wb-tag-boom">爆</span>';
    else if(item.tag === '沸') tagHtml = '<span class="pp-wb-tag pp-wb-tag-boil">沸</span>';
    else if(item.tag === '热') tagHtml = '<span class="pp-wb-tag pp-wb-tag-hot">热</span>';
    else if(item.tag === '新') tagHtml = '<span class="pp-wb-tag pp-wb-tag-new">新</span>';

    html += '<div class="pp-wb-topic-hero">' +
        '<div class="pp-wb-topic-title"># ' + escapeHtml(item.topic) + ' #' + tagHtml + '</div>' +
        '<div class="pp-wb-topic-stats">' +
            '<span><i class="fas fa-fire" style="color:#ff3b30"></i> 热度 ' + escapeHtml(item.heat||'') + '</span>' +
            '<span><i class="fas fa-chart-line"></i> 排名 #' + item.rank + '</span>' +
            (item.isSelf ? '<span style="color:#c4302b;font-weight:600;">· 与我相关</span>' : '') +
        '</div></div>';

    if(_weiboTopicGenerating){
        html += '<div class="pp-wb-loading"><div class="pp-wb-loading-spinner"></div><div>正在加载话题详情...</div></div>';
    } else if(!detail){
        html += '<div class="pp-wb-topic-loadhint">' +
            '<div onclick="ppWeiboLoadTopic('+rank+')" class="pp-wb-topic-loadbtn">' +
                '<i class="fas fa-download"></i> 加载话题详情' +
            '</div>' +
            '<div style="font-size:11px;color:var(--pp-text-4);margin-top:10px;">点击通过AI生成完整话题页（微博流+热评+趋势）</div>' +
        '</div>';
    } else {
        // 24h热度趋势
        if(detail.trendData && detail.trendData.length > 0){
            var maxVal = Math.max.apply(null, detail.trendData);
            if(maxVal <= 0) maxVal = 1;
            html += '<div class="pp-wb-trend-chart">' +
                '<div class="pp-wb-trend-chart-title">24小时热度趋势</div>' +
                '<div class="pp-wb-trend-bars">';
            detail.trendData.forEach(function(v){
                var h = Math.max(4, Math.floor((v/maxVal)*100));
                html += '<div class="pp-wb-trend-bar" style="height:'+h+'%"></div>';
            });
            html += '</div>' +
                '<div class="pp-wb-trend-axis"><span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span><span>现在</span></div>' +
            '</div>';
        }
        // 导语
        if(detail.intro){
            html += '<div class="pp-wb-topic-section">' +
                '<div class="pp-wb-topic-section-title"><i class="fas fa-newspaper"></i> 导语</div>' +
                '<div class="pp-wb-topic-intro">' + escapeHtml(detail.intro) + '</div>' +
            '</div>';
        }
        // 微博流
        if(detail.weibos && detail.weibos.length > 0){
            html += '<div class="pp-wb-topic-section">' +
                '<div class="pp-wb-topic-section-title"><i class="fas fa-stream"></i> 热门微博</div>';
            detail.weibos.forEach(function(w){
                var badgeHtml = '';
                if(w.badge === 'blue') badgeHtml = '<span class="pp-wb-badge pp-wb-badge-blue">蓝V</span>';
                else if(w.badge === 'gold') badgeHtml = '<span class="pp-wb-badge pp-wb-badge-gold">金V</span>';
                else if(w.badge === 'orange') badgeHtml = '<span class="pp-wb-badge pp-wb-badge-orange">橙V</span>';
                var avatarChar = (w.name||'微').charAt(0);
                html += '<div class="pp-wb-card">' +
                    '<div class="pp-wb-card-header">' +
                        '<div class="pp-wb-card-avatar">' + escapeHtml(avatarChar) + '</div>' +
                        '<div class="pp-wb-card-author">' +
                            '<div class="pp-wb-card-name">' + escapeHtml(w.name||'匿名用户') + ' ' + badgeHtml + '</div>' +
                            '<div class="pp-wb-card-time">' + escapeHtml(w.time||'刚刚') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="pp-wb-card-text">' + escapeHtml(w.content||'') + '</div>' +
                    '<div class="pp-wb-card-actions">' +
                        '<div class="pp-wb-card-action"><i class="far fa-thumbs-up"></i> ' + formatFans(w.likes||0) + '</div>' +
                        '<div class="pp-wb-card-action"><i class="far fa-comment"></i> ' + formatFans(w.comments||0) + '</div>' +
                        '<div class="pp-wb-card-action"><i class="fas fa-retweet"></i> ' + formatFans(w.reposts||0) + '</div>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';
        }
        // 热评
        if(detail.hotComments && detail.hotComments.length > 0){
            html += '<div class="pp-wb-topic-section">' +
                '<div class="pp-wb-topic-section-title"><i class="fas fa-fire-alt"></i> 热门评论</div>' +
                '<div class="pp-wb-hot-comments">';
            detail.hotComments.forEach(function(c){
                html += '<div class="pp-wb-hot-comment">' +
                    '<div class="pp-wb-hot-comment-name">' + escapeHtml(c.name||'网友') + '</div>' +
                    '<div class="pp-wb-hot-comment-text">' + escapeHtml(c.content||'') + '</div>' +
                    '<div class="pp-wb-hot-comment-like"><i class="far fa-thumbs-up"></i> ' + (c.likes||0) + '</div>' +
                '</div>';
            });
            html += '</div></div>';
        }
        // 我的操作
        if(detail.actions && detail.actions.length > 0){
            html += '<div class="pp-wb-my-actions">' +
                '<div class="pp-wb-my-actions-title">我的操作</div>' +
                '<div class="pp-wb-my-actions-btns">';
            detail.actions.forEach(function(a){
                html += '<div class="pp-wb-my-action-btn" onclick="ppWeiboTopicAction(\''+escapeHtml(a.key)+'\','+rank+')">' +
                    '<i class="fas ' + (a.icon||'fa-circle') + '"></i> ' + escapeHtml(a.label||'') +
                '</div>';
            });
            html += '</div></div>';
        }
    }
    html += '</div>';
    area.innerHTML = html;
}

window.ppWeiboLoadTopic = async function(rank){
    if(_weiboTopicGenerating) return;
    if(!window.API || !API.chatCompletion){ if(typeof toast === 'function') toast('请先配置API'); return; }
    _currentApiScene = 'paopao';
    _weiboTopicGenerating = true;
    var d = store.paopao;
    var area = document.getElementById('pp-tab-content');
    if(area) ppRenderWeiboTopicDetail(area);

    var item = d.weiboHotCache.items.find(function(h){ return h.rank === rank; });
    if(!item){ _weiboTopicGenerating = false; return; }
    var stageName = d.stageName || '小星星';
    var genderHint = d.gender === 'male' ? '男艺人' : '女艺人';

    var prompt = '你是微博话题详情页模拟器。为以下热搜话题生成完整的话题详情页数据。\n\n' +
        '热搜话题：#'+item.topic+'#\n' +
        '排名：第'+item.rank+'名\n' +
        '热度：'+(item.heat||'')+'\n' +
        '分类：'+(item.category||'entertainment')+'\n' +
        '摘要：'+(item.summary||'')+'\n' +
        '是否与玩家艺人「'+stageName+'」（'+genderHint+'）相关：'+(item.isSelf?'是':'否')+'\n\n' +
        '生成要求：\n' +
        '1. intro：话题导语(50-100字新闻摘要)\n' +
        '2. weibos：6-8条模拟微博。账号类型包括：官方工作室/蓝V媒体/金V大V/橙V博主/普通用户/粉丝。每条含name(账号名)、badge(blue/gold/orange/none)、content(30-100字内容，风格符合账号类型)、likes/comments/reposts(数字)、time(如"3小时前")\n' +
        '3. hotComments：10条热门评论，网友昵称风格多样，评论内容要切题\n' +
        '4. trendData：6个数字，代表今日0:00/4:00/8:00/12:00/16:00/20:00的热度值（相对数字即可）\n' +
        '5. actions：3-4个玩家可执行操作。' + (item.isSelf ?
            'key从repost/comment/clap/ignore中选，label如"转发感谢"/"发表感言"/"回怼黑评"/"低调不回应"，icon用fa-retweet/fa-comment/fa-fire/fa-eye-slash' :
            'key从ride/discuss/ignore中选，label如"蹭热度"/"发表看法"/"不参与"，icon用fa-bolt/fa-comment-dots/fa-eye-slash') +
        '\n\n严格只输出JSON，不要markdown，不要其他文字：\n' +
        '{"intro":"","weibos":[{"name":"","badge":"","content":"","likes":0,"comments":0,"reposts":0,"time":""}],"hotComments":[{"name":"","content":"","likes":0}],"trendData":[],"actions":[{"key":"","label":"","icon":""}]}';

    try {
        var data = await API.chatCompletion([
            {role:'system', content: prompt},
            {role:'user', content: '生成话题详情'}
        ], {temperature: 0.9, scene: 'paopao'});
        var reply = (data.choices[0].message.content || '').trim();
        var jsonMatch = reply.match(/\{[\s\S]*\}/);
        if(jsonMatch){
            var detail = JSON.parse(jsonMatch[0]);
            d.weiboTopicCache[rank] = detail;
            save();
        } else { throw new Error('JSON解析失败'); }
    } catch(e){
        console.error('[weibo] 话题详情生成失败:', e);
        if(typeof toast === 'function') toast('加载失败，请重试');
    } finally {
        _weiboTopicGenerating = false;
        area = document.getElementById('pp-tab-content');
        if(area && activeTab === 'discover' && _weiboDiscoverSubPage === 'topicDetail') ppRenderWeiboTopicDetail(area);
    }
};

// ====== 话题页互动操作 ======
window.ppWeiboTopicAction = function(actionKey, rank){
    var d = store.paopao;
    var item = d.weiboHotCache && d.weiboHotCache.items.find(function(h){return h.rank===rank;});
    if(!item) return;
    var baseFans = Math.max(100, Math.floor(d.fans * 0.001));
    var fansChange = 0, moneyChange = 0, title = '', desc = '', positive = true;

    if(actionKey === 'repost'){
        fansChange = Math.floor(Math.random()*500) + 200 + baseFans;
        title = '📢 转发感谢';
        desc = '你转发了热搜话题并感谢了粉丝的支持，粉丝们很开心！涨粉 +' + formatFans(fansChange);
    } else if(actionKey === 'comment'){
        fansChange = Math.floor(Math.random()*300) + 100 + baseFans;
        title = '💬 已发表感言';
        desc = '你对话题发表了感言，获得了广泛好评！涨粉 +' + formatFans(fansChange);
    } else if(actionKey === 'clap'){
        if(Math.random() > 0.4){
            fansChange = Math.floor(Math.random()*800) + 300 + baseFans*2;
            title = '🔥 霸气回怼';
            desc = '你的回怼被粉丝疯狂转发，路人被圈粉！涨粉 +' + formatFans(fansChange);
        } else {
            fansChange = -(Math.floor(Math.random()*400) + 100);
            title = '😅 翻车了';
            desc = '回怼引发了更大争议，路人反感...掉粉 ' + formatFans(fansChange);
            positive = false;
        }
    } else if(actionKey === 'ride'){
        if(Math.random() > 0.5){
            fansChange = Math.floor(Math.random()*400) + 100 + baseFans;
            title = '⚡ 蹭热度成功';
            desc = '你成功蹭上了这个热搜，获得了曝光！涨粉 +' + formatFans(fansChange);
        } else {
            fansChange = -(Math.floor(Math.random()*200) + 50);
            title = '😬 被嘲强行蹭热度';
            desc = '网友吐槽你强行蹭热度...掉粉 ' + formatFans(fansChange);
            positive = false;
        }
    } else if(actionKey === 'discuss'){
        fansChange = Math.floor(Math.random()*200) + 50;
        title = '💭 发表了看法';
        desc = '你对话题发表了看法，获得了一些关注。涨粉 +' + formatFans(fansChange);
    } else if(actionKey === 'ignore'){
        title = '🤫 不参与讨论';
        desc = '你选择低调，没有掺和这个话题。';
    }

    d.fans = Math.max(0, d.fans + fansChange);
    if(moneyChange) d.money = Math.max(0, d.money + moneyChange);
    save();

    if(typeof showPpResult === 'function') showPpResult(title, desc, positive);
    else if(typeof toast === 'function') toast(title + ' ' + desc);
};

// ====== 搜索系统 ======
window.ppWeiboOpenSearch = function(){
    _weiboDiscoverSubPage = 'search';
    _weiboSearchQuery = '';
    var area = document.getElementById('pp-tab-content');
    if(area) ppRenderWeiboSearch(area);
    setTimeout(function(){
        var inp = document.getElementById('pp-wb-search-input');
        if(inp) inp.focus();
    }, 100);
};

window.ppWeiboSearchInput = function(val){
    _weiboSearchQuery = val;
};

window.ppWeiboSearchSubmit = async function(){
    var q = (_weiboSearchQuery || '').trim();
    if(!q){ if(typeof toast === 'function') toast('请输入搜索内容'); return; }
    if(!window.API || !API.chatCompletion){ if(typeof toast === 'function') toast('请先配置API'); return; }
    _currentApiScene = 'paopao';
    var d = store.paopao;

    // 记录搜索历史
    var history = d.weiboSearchHistory || [];
    var idx = history.indexOf(q);
    if(idx >= 0) history.splice(idx, 1);
    history.unshift(q);
    if(history.length > 10) history = history.slice(0, 10);
    d.weiboSearchHistory = history;
    save();

    var area = document.getElementById('pp-tab-content');
    var resultBox = document.getElementById('pp-wb-search-result');
    if(resultBox) resultBox.innerHTML = '<div class="pp-wb-loading"><div class="pp-wb-loading-spinner"></div><div>搜索中...</div></div>';

    var stageName = d.stageName || '小星星';
    var genderHint = d.gender === 'male' ? '男艺人' : '女艺人';
    var prompt = '你是微博搜索结果模拟器。用户搜索了"'+q+'"。玩家艺名「'+stageName+'」（'+genderHint+'）。\n' +
        '请生成搜索结果：\n' +
        '1. topics：3-5条相关热搜话题，含topic和heat\n' +
        '2. weibos：3-5条相关微博，含name(用户名)、badge(blue/gold/orange/none)、content(30-80字)、likes(数字)、time(时间描述)\n' +
        '3. users：2-3个相关用户，含name、badge(blue/gold/orange/none)、desc(个人简介)、followers(粉丝数如"12.3万")\n\n' +
        '严格只输出JSON：\n' +
        '{"topics":[{"topic":"","heat":""}],"weibos":[{"name":"","badge":"","content":"","likes":0,"time":""}],"users":[{"name":"","badge":"","desc":"","followers":""}]}';

    try {
        var data = await API.chatCompletion([
            {role:'system', content: prompt},
            {role:'user', content: '搜索: ' + q}
        ], {temperature: 0.9, scene: 'paopao'});
        var reply = (data.choices[0].message.content || '').trim();
        var jsonMatch = reply.match(/\{[\s\S]*\}/);
        if(jsonMatch){
            var result = JSON.parse(jsonMatch[0]);
            _renderWeiboSearchResult(result, q);
        } else { throw new Error('JSON解析失败'); }
    } catch(e){
        console.error('[weibo] 搜索失败:', e);
        if(resultBox) resultBox.innerHTML = '<div class="pp-wb-empty">搜索失败，请重试</div>';
    }
};

function _renderWeiboSearchResult(result, query){
    var box = document.getElementById('pp-wb-search-result');
    if(!box) return;
    var html = '';
    if(result.topics && result.topics.length > 0){
        html += '<div class="pp-wb-search-section"><div class="pp-wb-search-section-title">相关话题</div>';
        result.topics.forEach(function(t){
            html += '<div class="pp-wb-search-topic"><i class="fas fa-hashtag" style="color:#ff9500"></i> ' +
                escapeHtml(t.topic) + ' <span class="pp-wb-search-heat">' + escapeHtml(t.heat||'') + '</span></div>';
        });
        html += '</div>';
    }
    if(result.weibos && result.weibos.length > 0){
        html += '<div class="pp-wb-search-section"><div class="pp-wb-search-section-title">相关微博</div>';
        result.weibos.forEach(function(w){
            var badgeHtml = '';
            if(w.badge === 'blue') badgeHtml = '<span class="pp-wb-badge pp-wb-badge-blue">V</span>';
            else if(w.badge === 'gold') badgeHtml = '<span class="pp-wb-badge pp-wb-badge-gold">V</span>';
            else if(w.badge === 'orange') badgeHtml = '<span class="pp-wb-badge pp-wb-badge-orange">V</span>';
            html += '<div class="pp-wb-card">' +
                '<div class="pp-wb-card-header">' +
                    '<div class="pp-wb-card-avatar">' + escapeHtml((w.name||'微').charAt(0)) + '</div>' +
                    '<div class="pp-wb-card-author">' +
                        '<div class="pp-wb-card-name">' + escapeHtml(w.name||'') + ' ' + badgeHtml + '</div>' +
                        '<div class="pp-wb-card-time">' + escapeHtml(w.time||'') + '</div>' +
                    '</div></div>' +
                '<div class="pp-wb-card-text">' + escapeHtml(w.content||'') + '</div>' +
                '<div class="pp-wb-card-actions">' +
                    '<div class="pp-wb-card-action"><i class="far fa-thumbs-up"></i> ' + formatFans(w.likes||0) + '</div>' +
                '</div></div>';
        });
        html += '</div>';
    }
    if(result.users && result.users.length > 0){
        html += '<div class="pp-wb-search-section"><div class="pp-wb-search-section-title">相关用户</div>';
        result.users.forEach(function(u){
            var badgeHtml = '';
            if(u.badge === 'blue') badgeHtml = '<span class="pp-wb-badge pp-wb-badge-blue">蓝V</span>';
            else if(u.badge === 'gold') badgeHtml = '<span class="pp-wb-badge pp-wb-badge-gold">金V</span>';
            else if(u.badge === 'orange') badgeHtml = '<span class="pp-wb-badge pp-wb-badge-orange">橙V</span>';
            html += '<div class="pp-wb-search-user">' +
                '<div class="pp-wb-search-user-avatar">' + escapeHtml((u.name||'用').charAt(0)) + '</div>' +
                '<div class="pp-wb-search-user-body">' +
                    '<div class="pp-wb-search-user-name">' + escapeHtml(u.name||'') + ' ' + badgeHtml + '</div>' +
                    '<div class="pp-wb-search-user-desc">' + escapeHtml(u.desc||'') + '</div>' +
                    '<div class="pp-wb-search-user-fans">粉丝 ' + escapeHtml(u.followers||'0') + '</div>' +
                '</div></div>';
        });
        html += '</div>';
    }
    if(!html) html = '<div class="pp-wb-empty">没有找到"' + escapeHtml(query) + '"的结果</div>';
    box.innerHTML = html;
}

window.ppWeiboSearchCancel = function(){
    _weiboDiscoverSubPage = 'main';
    _weiboSearchQuery = '';
    var area = document.getElementById('pp-tab-content');
    if(area) ppRenderDiscover(area);
};

window.ppWeiboSearchByTag = function(tag){
    _weiboSearchQuery = tag;
    var inp = document.getElementById('pp-wb-search-input');
    if(inp) inp.value = tag;
    ppWeiboSearchSubmit();
};

window.ppWeiboClearSearchHistory = function(){
    var d = store.paopao;
    d.weiboSearchHistory = [];
    save();
    var area = document.getElementById('pp-tab-content');
    if(area) ppRenderWeiboSearch(area);
};

function ppRenderWeiboSearch(area){
    var d = store.paopao;
    var history = d.weiboSearchHistory || [];
    var cache = d.weiboHotCache;

    var html = '<div class="pp-wb-search-page">';
    // 搜索栏
    html += '<div class="pp-wb-search-top">' +
        '<div class="pp-wb-search-input-wrap">' +
            '<i class="fas fa-search"></i>' +
            '<input id="pp-wb-search-input" type="text" placeholder="搜索微博内容、话题..." ' +
                'oninput="ppWeiboSearchInput(this.value)" ' +
                'onkeydown="if(event.key===\'Enter\')ppWeiboSearchSubmit()" />' +
        '</div>' +
        '<div class="pp-wb-search-cancel" onclick="ppWeiboSearchCancel()">取消</div>' +
    '</div>';

    // 搜索结果区
    html += '<div id="pp-wb-search-result">';
    // 默认内容：搜索历史+大家在搜
    if(history.length > 0){
        html += '<div class="pp-wb-search-section">' +
            '<div class="pp-wb-search-section-title">' +
                '<span>搜索历史</span>' +
                '<span class="pp-wb-search-clear" onclick="ppWeiboClearSearchHistory()"><i class="far fa-trash-alt"></i> 清空</span>' +
            '</div>' +
            '<div class="pp-wb-search-tags">';
        history.forEach(function(h){
            html += '<div class="pp-wb-search-tag" onclick="ppWeiboSearchByTag(\''+escapeHtml(h).replace(/'/g,"\\'")+'\')">' + escapeHtml(h) + '</div>';
        });
        html += '</div></div>';
    }
    if(cache && cache.items && cache.items.length > 0){
        html += '<div class="pp-wb-search-section"><div class="pp-wb-search-section-title">大家都在搜</div>';
        cache.items.slice(0, 10).forEach(function(it){
            if(it.isAd) return;
            html += '<div class="pp-wb-search-topic" onclick="ppWeiboSearchByTag(\''+escapeHtml(it.topic).replace(/'/g,"\\'")+'\')">' +
                '<span class="pp-wb-search-rank">'+it.rank+'</span> ' +
                escapeHtml(it.topic) + ' <span class="pp-wb-search-heat">' + escapeHtml(it.heat||'') + '</span>' +
            '</div>';
        });
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    area.innerHTML = html;
}

// ====== 热搜运营：买热搜 ======
window.ppWeiboBuyHot = function(){
    var d = store.paopao;
    if(Date.now() - (d.weiboLastBuyTime||0) < 3600000){
        var remainMin = Math.ceil((3600000 - (Date.now() - d.weiboLastBuyTime)) / 60000);
        if(typeof toast === 'function') toast('冷却中，还需等待'+remainMin+'分钟');
        return;
    }

    // 弹出档位选择
    var tiers = [
        { name: '普通推广', cost: 50000,   rankRange: [20,50], successRate: 0.9,  desc: '推到20-50名' },
        { name: '热门推荐', cost: 200000,  rankRange: [10,20], successRate: 0.75, desc: '推到10-20名' },
        { name: '冲榜前十', cost: 500000,  rankRange: [4,10],  successRate: 0.5,  desc: '冲到前10，有翻车风险' },
        { name: '冲榜前三', cost: 1500000, rankRange: [1,3],   successRate: 0.25, desc: '冲到前3，翻车概率极高' }
    ];

    var overlay = document.createElement('div');
    overlay.className = 'pp-wb-ops-overlay';
    overlay.onclick = function(e){ if(e.target===overlay) overlay.remove(); };
    var panelHtml = '<div class="pp-wb-ops-panel-modal">' +
        '<div class="pp-wb-ops-modal-title">💰 买热搜</div>' +
        '<div class="pp-wb-ops-modal-desc">当前余额：¥' + formatFans(d.money||0) + '</div>' +
        '<div class="pp-wb-ops-tiers">';
    tiers.forEach(function(t,i){
        var canAfford = (d.money||0) >= t.cost;
        panelHtml += '<div class="pp-wb-ops-tier' + (canAfford?'':' disabled') + '" ' +
            (canAfford?'onclick="ppWeiboDoBuyHot('+i+')"':'') + '>' +
            '<div class="pp-wb-ops-tier-name">' + t.name + '</div>' +
            '<div class="pp-wb-ops-tier-desc">' + t.desc + '</div>' +
            '<div class="pp-wb-ops-tier-meta">¥' + formatFans(t.cost) + ' · 成功率' + Math.floor(t.successRate*100) + '%</div>' +
        '</div>';
    });
    panelHtml += '</div>' +
        '<button class="pp-wb-ops-modal-close" onclick="this.closest(\'.pp-wb-ops-overlay\').remove()">取消</button>' +
    '</div>';
    overlay.innerHTML = panelHtml;
    document.body.appendChild(overlay);
};

window._weiboBuyTiers = [
    { name: '普通推广', cost: 50000,   rankRange: [20,50], successRate: 0.9 },
    { name: '热门推荐', cost: 200000,  rankRange: [10,20], successRate: 0.75 },
    { name: '冲榜前十', cost: 500000,  rankRange: [4,10],  successRate: 0.5 },
    { name: '冲榜前三', cost: 1500000, rankRange: [1,3],   successRate: 0.25 }
];

window.ppWeiboDoBuyHot = async function(tierIdx){
    document.querySelectorAll('.pp-wb-ops-overlay').forEach(function(o){ o.remove(); });
    if(!window.API || !API.chatCompletion){ if(typeof toast === 'function') toast('请先配置API'); return; }
    _currentApiScene = 'paopao';
    var d = store.paopao;
    var tier = window._weiboBuyTiers[tierIdx];
    if(!tier || (d.money||0) < tier.cost) return;

    d.money -= tier.cost;
    // [FIX] 买热搜费用写入财务流水
    if(window.ppRecordFinance) ppRecordFinance('expense', tier.cost, '热搜运营', '买热搜·' + tier.name);
    d.weiboLastBuyTime = Date.now();
    save();

    if(typeof toast === 'function') toast('正在运作热搜...');

    var stageName = d.stageName || '小星星';
    var genderHint = d.gender === 'male' ? '男艺人' : '女艺人';
    var success = Math.random() < tier.successRate;
    var prompt = '你是娱乐圈公关模拟器。'+genderHint+'「'+stageName+'」花费¥'+formatFans(tier.cost)+'购买了热搜（'+tier.name+'），' +
        '目标排名'+tier.rankRange[0]+'-'+tier.rankRange[1]+'名。结果：'+(success?'成功':'翻车被曝光买热搜')+'。\n\n' +
        '请生成结果数据：\n' +
        '- topic: 买的热搜话题（需包含艺人名）\n' +
        '- newRank: 实际排名（'+(success?tier.rankRange[0]+'-'+tier.rankRange[1]:'跌到榜外或曝光时更差')+'）\n' +
        '- heat: 热度值（如"2.3亿"）\n' +
        '- fansChange: 粉丝变化（成功+'+(success?'2000-20000':'负数-3000到-15000')+'）\n' +
        '- description: 结果描述(30字内)\n' +
        '- publicReaction: 网友反应（'+(success?'好评':'吐槽买热搜/掉粉')+'，20字内）\n\n' +
        '严格输出JSON:{"topic":"","newRank":0,"heat":"","fansChange":0,"description":"","publicReaction":""}';

    try {
        var data = await API.chatCompletion([
            {role:'system', content: prompt},
            {role:'user', content: '生成结果'}
        ], {temperature: 0.9, scene: 'paopao'});
        var reply = (data.choices[0].message.content || '').trim();
        var m = reply.match(/\{[\s\S]*\}/);
        if(m){
            var r = JSON.parse(m[0]);
            d.fans = Math.max(0, d.fans + (r.fansChange||0));
            save();
            // 把结果热搜加入榜单
            if(success && d.weiboHotCache && d.weiboHotCache.items){
                d.weiboHotCache.items.unshift({
                    rank: r.newRank || tier.rankRange[0],
                    topic: r.topic || '#'+stageName+'#',
                    heat: r.heat || '1000万',
                    tag: r.newRank<=3?'爆':(r.newRank<=10?'热':'新'),
                    trend: 'up', category:'entertainment',
                    isSelf: true, isAd: false,
                    summary: r.description || ''
                });
                // 重新排序
                d.weiboHotCache.items.sort(function(a,b){return a.rank-b.rank;});
                if(d.weiboHotCache.items.length > 50) d.weiboHotCache.items = d.weiboHotCache.items.slice(0,50);
                save();
            }
            var title = success ? '✅ 热搜运作成功' : '⚠️ 买热搜翻车！';
            var desc = (r.description||'') + (r.publicReaction?'\n网友：'+r.publicReaction:'') +
                '\n粉丝变化：'+(r.fansChange>=0?'+':'')+formatFans(r.fansChange||0);
            if(typeof showPpResult === 'function') showPpResult(title, desc, success);
            var area = document.getElementById('pp-tab-content');
            if(area && activeTab==='discover') ppRenderDiscover(area);
        }
    } catch(e){
        console.error('[weibo] 买热搜失败:', e);
        if(typeof toast === 'function') toast('操作失败');
    }
};

// ====== 热搜运营：撤热搜 ======
window.ppWeiboRemoveHot = function(){
    var d = store.paopao;
    if(Date.now() - (d.weiboLastRemoveTime||0) < 7200000){
        var remainMin = Math.ceil((7200000 - (Date.now() - d.weiboLastRemoveTime)) / 60000);
        if(typeof toast === 'function') toast('冷却中，还需等待'+remainMin+'分钟');
        return;
    }
    if((d.money||0) < 80000){
        if(typeof toast === 'function') toast('余额不足，需¥8万');
        return;
    }
    if(!d.weiboHotCache || !d.weiboHotCache.items){
        if(typeof toast === 'function') toast('没有热搜可撤');
        return;
    }
    // 选择要撤的热搜（优先自己相关的负面话题）
    var overlay = document.createElement('div');
    overlay.className = 'pp-wb-ops-overlay';
    overlay.onclick = function(e){ if(e.target===overlay) overlay.remove(); };
    var h = '<div class="pp-wb-ops-panel-modal">' +
        '<div class="pp-wb-ops-modal-title">🚫 撤热搜</div>' +
        '<div class="pp-wb-ops-modal-desc">选择要撤下的热搜（费用¥8万，成功率60%）</div>' +
        '<div class="pp-wb-ops-remove-list">';
    d.weiboHotCache.items.slice(0, 20).forEach(function(it){
        if(it.isAd) return;
        var selfTag = it.isSelf ? ' <span style="color:#c4302b;font-weight:600;">(我)</span>' : '';
        h += '<div class="pp-wb-ops-remove-item" onclick="ppWeiboDoRemoveHot('+it.rank+')">' +
            '<span class="pp-wb-ops-remove-rank">'+it.rank+'</span>' +
            '<span class="pp-wb-ops-remove-topic">'+escapeHtml(it.topic)+selfTag+'</span>' +
        '</div>';
    });
    h += '</div><button class="pp-wb-ops-modal-close" onclick="this.closest(\'.pp-wb-ops-overlay\').remove()">取消</button></div>';
    overlay.innerHTML = h;
    document.body.appendChild(overlay);
};

window.ppWeiboDoRemoveHot = async function(rank){
    document.querySelectorAll('.pp-wb-ops-overlay').forEach(function(o){ o.remove(); });
    if(!window.API || !API.chatCompletion){ if(typeof toast === 'function') toast('请先配置API'); return; }
    _currentApiScene = 'paopao';
    var d = store.paopao;
    if((d.money||0) < 80000) return;
    var item = d.weiboHotCache.items.find(function(h){return h.rank===rank;});
    if(!item) return;

    d.money -= 80000;
    // [FIX] 撤热搜费用写入财务流水
    if(window.ppRecordFinance) ppRecordFinance('expense', 80000, '热搜运营', '撤热搜·' + (item.topic||''));
    d.weiboLastRemoveTime = Date.now();
    save();
    if(typeof toast === 'function') toast('正在运作撤热搜...');

    var success = Math.random() < 0.6;
    var stageName = d.stageName || '小星星';
    var genderHint = d.gender === 'male' ? '男艺人' : '女艺人';
    var prompt = '你是娱乐圈公关模拟器。'+genderHint+'「'+stageName+'」花¥8万撤下热搜"'+item.topic+'"（排名#'+item.rank+'），结果：'+(success?'成功撤下':'撤搜失败反而让话题发酵')+'。\n\n' +
        '生成结果：\n' +
        '- description: 结果描述(30字内)\n' +
        '- fansChange: 粉丝变化（成功0-500，失败-2000到-8000）\n' +
        '- publicReaction: 网友反应(20字内)\n\n' +
        '严格输出JSON:{"description":"","fansChange":0,"publicReaction":""}';

    try {
        var data = await API.chatCompletion([
            {role:'system', content: prompt},
            {role:'user', content: '生成结果'}
        ], {temperature: 0.9, scene: 'paopao'});
        var reply = (data.choices[0].message.content || '').trim();
        var m = reply.match(/\{[\s\S]*\}/);
        if(m){
            var r = JSON.parse(m[0]);
            d.fans = Math.max(0, d.fans + (r.fansChange||0));
            if(success){
                // 从榜单移除
                d.weiboHotCache.items = d.weiboHotCache.items.filter(function(x){return x.rank!==rank;});
                delete d.weiboTopicCache[rank];
            } else {
                // 失败：话题热度提升（排名前移）
                var idx = d.weiboHotCache.items.findIndex(function(x){return x.rank===rank;});
                if(idx > 0){
                    var swap = d.weiboHotCache.items[idx-1];
                    d.weiboHotCache.items[idx-1] = d.weiboHotCache.items[idx];
                    d.weiboHotCache.items[idx] = swap;
                    d.weiboHotCache.items[idx-1].rank = rank-1;
                    d.weiboHotCache.items[idx].rank = rank;
                }
            }
            save();
            var title = success ? '✅ 撤热搜成功' : '⚠️ 撤搜失败';
            var desc = (r.description||'') + (r.publicReaction?'\n网友：'+r.publicReaction:'') +
                '\n粉丝变化：'+(r.fansChange>=0?'+':'')+formatFans(r.fansChange||0);
            if(typeof showPpResult === 'function') showPpResult(title, desc, success);
            var area = document.getElementById('pp-tab-content');
            if(area && activeTab==='discover') ppRenderDiscover(area);
        }
    } catch(e){
        console.error('[weibo] 撤热搜失败:', e);
        if(typeof toast === 'function') toast('操作失败');
    }
};

// ====== 热搜运营：控评 ======
window.ppWeiboControlComments = async function(){
    var d = store.paopao;
    if((d.money||0) < 20000){ if(typeof toast === 'function') toast('余额不足，需¥2万'); return; }
    if(!window.API || !API.chatCompletion){ if(typeof toast === 'function') toast('请先配置API'); return; }
    _currentApiScene = 'paopao';

    d.money -= 20000;
    // [FIX] 控评费用写入财务流水
    if(window.ppRecordFinance) ppRecordFinance('expense', 20000, '热搜运营', '控评费用');
    save();
    if(typeof toast === 'function') toast('正在安排粉丝控评...');

    var success = Math.random() < 0.7;
    var stageName = d.stageName || '小星星';
    var prompt = '你是娱乐圈粉丝运营模拟器。艺人「'+stageName+'」花¥2万安排粉丝控评，结果：'+(success?'成功，评论区好评如潮':'失败，被反控评或被发现是水军')+'。\n\n' +
        '生成结果JSON：{"description":"结果描述30字内","fansChange":数字(成功500-2000，失败-1000到-3000),"publicReaction":"网友反应20字内"}';

    try {
        var data = await API.chatCompletion([
            {role:'system', content: prompt},
            {role:'user', content: '生成结果'}
        ], {temperature: 0.9, scene: 'paopao'});
        var reply = (data.choices[0].message.content || '').trim();
        var m = reply.match(/\{[\s\S]*\}/);
        if(m){
            var r = JSON.parse(m[0]);
            d.fans = Math.max(0, d.fans + (r.fansChange||0));
            save();
            var title = success ? '✅ 控评成功' : '⚠️ 控评翻车';
            var desc = (r.description||'') + (r.publicReaction?'\n网友：'+r.publicReaction:'') +
                '\n粉丝变化：'+(r.fansChange>=0?'+':'')+formatFans(r.fansChange||0);
            if(typeof showPpResult === 'function') showPpResult(title, desc, success);
        }
    } catch(e){
        console.error('[weibo] 控评失败:', e);
        if(typeof toast === 'function') toast('操作失败');
    }
};

// ====== 热搜系统(旧) ======
var PP_HOT_SEARCH_TOPICS = [
    // 通用热搜
    '某流量明星翻车现场','#国产剧崛起#','今日份快乐源泉','某品牌官宣新代言人','周末去哪玩',
    '#春日穿搭分享#','某综艺名场面','今天你追剧了吗','#电影票房破亿#','明星恋情曝光',
    '某选秀节目争议','#音乐节来了#','今日限定快乐','某品牌打折季','年度最佳电影提名',
    '#健身打卡#','某明星素颜照','今年最火综艺','#读书分享#','某偶像团体出道',
    '#旅行vlog#','某影视剧翻拍','今日份甜蜜暴击','某品牌联名','年末颁奖季',
    '#美食探店#','某明星机场穿搭','今晚追什么剧','#摄影大赛#','某歌手新专辑',
    '#减肥食谱#','某演员转型','今日份社死现场','某品牌抽奖','年度十大影视',
    '#手工DIY#','某主持人金句','今天吃什么','#宠物日常#','某导演新作',
    '全网热议话题','某明星公益活动','今日份治愈','某品牌暴雷','年度最受欢迎',
    '#职场吐槽#','某演员演技','今晚不想加班','某品牌上新','最新电影排片'
];

// 通用（性别中性）热搜模板
var PP_HOT_SEARCH_SELF_TEMPLATES_COMMON = [
    '{name}新剧官宣','{name}路透生图','{name}机场穿搭','{name}新歌MV',
    '{name}综艺名场面','{name}采访金句','{name}最新自拍','{name}代言官宣',
    '{name}生日快乐','{name}新造型','{name}粉丝破{fans}','{name}热搜第一',
    '#为{name}打call#','#{name}加油#','{name}获奖感言','{name}新作品预告',
    '{name}直播cut','{name}与粉丝互动','{name}片场花絮','{name}时尚大片',
    '{name}演技炸裂','{name}舞台表演','{name}接受采访','{name}录制现场',
    '{name}最新动态','{name}超话互动','{name}工作室声明','{name}新闻发布会',
    '{name}红毯造型','{name}杀青庆祝','{name}开机仪式','{name}慈善公益',
    '{name}封面大片','{name}同框合影','{name}最新行程','{name}粉丝见面会',
    '{name}新代言','{name}品牌活动','{name}获提名','{name}深夜发文',
    '{name}与XX合作','看{name}的人都说好','{name}实力圈粉','{name}人气爆棚'
];
// 女艺人专属热搜模板
var PP_HOT_SEARCH_SELF_TEMPLATES_FEMALE = [
    '{name}仙女造型','{name}闺蜜合照','{name}美妆教程','{name}姐姐太美了',
    '{name}新剧女主路透','{name}绝美古装','{name}少女感','{name}神仙颜值',
    '{name}姐姐好飒','{name}女王气场','{name}甜美日常','#姐姐{name}超话#',
    '{name}妆容教学','{name}私服穿搭好绝','{name}小仙女本人','{name}温柔到犯规'
];
// 男艺人专属热搜模板
var PP_HOT_SEARCH_SELF_TEMPLATES_MALE = [
    '{name}帅到犯规','{name}健身日常','{name}型男穿搭','{name}哥哥太帅了',
    '{name}新剧男主路透','{name}古装扮相','{name}荷尔蒙爆棚','{name}少年感',
    '{name}哥哥好A','{name}男友力爆棚','{name}硬汉形象','#哥哥{name}超话#',
    '{name}西装造型好绝','{name}运动日常','{name}酷盖本人','{name}温柔到犯规'
];
// 根据性别获取热搜模板
function ppGetHotSearchSelfTemplates(){
    var d = store.paopao;
    var extra = d.gender === 'male' ? PP_HOT_SEARCH_SELF_TEMPLATES_MALE : PP_HOT_SEARCH_SELF_TEMPLATES_FEMALE;
    return PP_HOT_SEARCH_SELF_TEMPLATES_COMMON.concat(extra);
}
// 兼容旧引用
var PP_HOT_SEARCH_SELF_TEMPLATES = PP_HOT_SEARCH_SELF_TEMPLATES_COMMON;

function ppGenerateHotSearch(){
    var d = store.paopao;
    var stageName = d.stageName || '小星星';
    var tierIdx = ppGetTierIndex(d.tier);
    
    // 生成50条热搜
    var hotList = [];
    var usedTopics = {};
    
    // 先生成与自己相关的热搜（排名根据咖位决定）
    var selfCount = Math.min(5, Math.max(1, Math.floor(tierIdx * 0.5) + 1));
    var selfTemplates = shuffleArr(ppGetHotSearchSelfTemplates().slice());
    
    for(var i = 0; i < selfCount; i++){
        if(i >= selfTemplates.length) break;
        var topic = selfTemplates[i]
            .replace(/\{name\}/g, stageName)
            .replace(/\{fans\}/g, formatFans(d.fans));
        
        // 新人热搜排名低，顶流排名高
        var baseRank;
        if(tierIdx >= 9) baseRank = Math.floor(Math.random() * 5) + 1; // 超一线：1-5
        else if(tierIdx >= 7) baseRank = Math.floor(Math.random() * 10) + 1; // 一线/准一线：1-10
        else if(tierIdx >= 5) baseRank = Math.floor(Math.random() * 15) + 5; // 二三线：5-20
        else if(tierIdx >= 3) baseRank = Math.floor(Math.random() * 20) + 10; // 四五线：10-30
        else baseRank = Math.floor(Math.random() * 20) + 25; // 新人：25-45
        
        var heat = Math.floor((50 - baseRank + 1) * 10000 * (0.5 + Math.random()));
        var hotTag = '';
        if(baseRank <= 3 && tierIdx >= 7) hotTag = '爆';
        else if(baseRank <= 10 && tierIdx >= 5) hotTag = '热';
        else if(baseRank <= 20) hotTag = '新';
        
        hotList.push({
            rank: baseRank,
            topic: topic,
            heat: heat,
            isSelf: true,
            tag: hotTag
        });
    }
    
    // 填充其他热搜
    var otherTopics = shuffleArr(PP_HOT_SEARCH_TOPICS.slice());
    var otherIdx = 0;
    for(var rank = 1; rank <= 50; rank++){
        var hasThis = hotList.some(function(h){ return h.rank === rank; });
        if(hasThis) continue;
        if(otherIdx >= otherTopics.length) otherIdx = 0;
        var heat = Math.floor((50 - rank + 1) * 10000 * (0.5 + Math.random()));
        var hotTag = '';
        if(rank <= 3) hotTag = '爆';
        else if(rank <= 10) hotTag = '热';
        else if(Math.random() < 0.3) hotTag = '新';
        
        hotList.push({
            rank: rank,
            topic: otherTopics[otherIdx],
            heat: heat,
            isSelf: false,
            tag: hotTag
        });
        otherIdx++;
    }
    
    // 按排名排序
    hotList.sort(function(a, b){ return a.rank - b.rank; });
    
    // 确保排名连续
    for(var i = 0; i < hotList.length; i++){
        hotList[i].rank = i + 1;
    }
    
    return hotList;
}

// 渲染热搜页面
function ppRenderHotSearch(){
    var d = store.paopao;
    
    // 缓存30秒
    if(!d.cachedHotSearch || Date.now() - (d.lastHotSearchTime || 0) > 30000){
        d.cachedHotSearch = ppGenerateHotSearch();
        d.lastHotSearchTime = Date.now();
        save();
    }
    
    var hotList = d.cachedHotSearch;
    var selfItems = hotList.filter(function(h){ return h.isSelf; });
    
    var html = '<div class="pp-hot-search-page">';
    
    // 自己相关的热搜摘要
    if(selfItems.length > 0){
        html += '<div class="pp-hot-search-self-section">' +
            '<div class="pp-hot-search-self-title">🔥 与我相关的热搜</div>';
        selfItems.forEach(function(item){
            var tagHtml = item.tag === '爆' ? '<span class="pp-hot-tag pp-hot-tag-boom">爆</span>' :
                          item.tag === '热' ? '<span class="pp-hot-tag pp-hot-tag-hot">热</span>' :
                          item.tag === '新' ? '<span class="pp-hot-tag pp-hot-tag-new">新</span>' : '';
            html += '<div class="pp-hot-search-self-item" onclick="ppShowHotDetail(' + item.rank + ')" style="cursor:pointer;">' +
                '<div class="pp-hot-rank pp-hot-rank-self">' + item.rank + '</div>' +
                '<div class="pp-hot-topic">' + escapeHtml(item.topic) + tagHtml + '</div>' +
                '<div class="pp-hot-heat">' + formatFans(item.heat) + '</div>' +
            '</div>';
        });
        html += '</div>';
    } else {
        html += '<div class="pp-hot-search-self-section">' +
            '<div class="pp-hot-search-self-title">🔥 与我相关的热搜</div>' +
            '<div class="pp-empty-hint" style="padding:12px;">暂时没有与你相关的热搜<br>提升咖位和活跃度后会更容易上热搜！</div>' +
        '</div>';
    }
    
    // 全部热搜列表
    html += '<div class="pp-hot-search-all-title">📊 热搜榜</div>' +
        '<div class="pp-hot-search-list">';
    
    hotList.slice(0, 30).forEach(function(item){
        var rankClass = item.rank <= 3 ? 'pp-hot-rank-top' : '';
        var selfClass = item.isSelf ? 'pp-hot-item-self' : '';
        var tagHtml = item.tag === '爆' ? '<span class="pp-hot-tag pp-hot-tag-boom">爆</span>' :
                      item.tag === '热' ? '<span class="pp-hot-tag pp-hot-tag-hot">热</span>' :
                      item.tag === '新' ? '<span class="pp-hot-tag pp-hot-tag-new">新</span>' : '';
        
        html += '<div class="pp-hot-search-item ' + selfClass + '" onclick="ppShowHotDetail(' + item.rank + ')" style="cursor:pointer;">' +
            '<div class="pp-hot-rank ' + rankClass + '">' + item.rank + '</div>' +
            '<div class="pp-hot-topic">' + escapeHtml(item.topic) + tagHtml + '</div>' +
            '<div class="pp-hot-heat">' + formatFans(item.heat) + '</div>' +
        '</div>';
    });
    
    html += '</div>';
    html += '<div class="pp-refresh-btn" onclick="ppRefreshHotSearch()"><i class="fas fa-sync-alt"></i> 刷新热搜</div>';
    html += '</div>';
    
    return html;
}

window.ppRefreshHotSearch = function(){
    var d = store.paopao;
    d.cachedHotSearch = null;
    d.lastHotSearchTime = 0;
    save();
    ppRenderTab();
};

// ====== 热搜详情弹窗 ======
var HOT_COMMENT_POSITIVE = [
    '太厉害了吧！','实力说话！','路人被圈粉了','一直支持！','期待更多作品',
    '真的好优秀','越来越好了','实至名归','好喜欢啊','冲冲冲！'
];
var HOT_COMMENT_NEGATIVE = [
    '就这？','不太行吧...','路人表示无感','有点尬','营销过度了吧',
    '不感兴趣','一般般','没什么特别的','过度炒作','呵呵'
];
var HOT_COMMENT_NEUTRAL = [
    '吃瓜群众路过','看看热闹','不明觉厉','围观一下','有意思',
    '这个话题好火','来了来了','前排占座','哈哈哈哈','？？？'
];

window.ppShowHotDetail = function(rank) {
    var d = store.paopao;
    if (!d.cachedHotSearch) return;
    var item = d.cachedHotSearch.find(function(h) { return h.rank === rank; });
    if (!item) return;
    
    var tagHtml = item.tag === '爆' ? '<span class="pp-hot-tag pp-hot-tag-boom">爆</span>' :
                  item.tag === '热' ? '<span class="pp-hot-tag pp-hot-tag-hot">热</span>' :
                  item.tag === '新' ? '<span class="pp-hot-tag pp-hot-tag-new">新</span>' : '';
    
    // 生成模拟新闻摘要
    var newsText = item.isSelf ?
        (d.stageName || '我') + '相关话题"' + item.topic + '"登上热搜第' + item.rank + '位，引发网友热议。目前热度' + formatFans(item.heat) + '，持续上升中。' :
        '话题"' + item.topic + '"今日登上热搜榜第' + item.rank + '位，热度达' + formatFans(item.heat) + '，引发广泛讨论。';
    
    // 生成随机评论
    var comments = [];
    var commentCount = 5 + Math.floor(Math.random() * 4);
    for (var i = 0; i < commentCount; i++) {
        var pool = Math.random() < 0.5 ? HOT_COMMENT_POSITIVE : (Math.random() < 0.5 ? HOT_COMMENT_NEGATIVE : HOT_COMMENT_NEUTRAL);
        var fanNames = ['小太阳','追星少女','路人甲','吃瓜群众','微博用户' + Math.floor(Math.random()*999),'热心网友','不愿透露姓名的粉丝','理性讨论','今天也要加油','快乐星球'];
        comments.push({
            name: fanNames[Math.floor(Math.random() * fanNames.length)],
            text: pool[Math.floor(Math.random() * pool.length)]
        });
    }
    
    var commentsHtml = comments.map(function(c) {
        return '<div class="pp-hot-detail-comment">' +
            '<div class="pp-hot-detail-comment-name">' + escapeHtml(c.name) + '</div>' +
            escapeHtml(c.text) +
        '</div>';
    }).join('');
    
    // 根据是否与自己相关，显示不同的操作按钮
    var actionsHtml = '';
    if (item.isSelf) {
        actionsHtml = '<div class="pp-hot-detail-actions">' +
            '<div class="pp-hot-detail-action-btn" onclick="ppHotDetailAction(\'repost\',' + rank + ')"><i class="fas fa-retweet"></i> 转发感谢</div>' +
            '<div class="pp-hot-detail-action-btn" onclick="ppHotDetailAction(\'comment\',' + rank + ')"><i class="fas fa-comment"></i> 发表感言</div>' +
            '<div class="pp-hot-detail-action-btn" onclick="ppHotDetailAction(\'ignore\',' + rank + ')"><i class="fas fa-eye-slash"></i> 低调不回应</div>' +
            '<div class="pp-hot-detail-action-btn" onclick="ppHotDetailAction(\'clap\',' + rank + ')"><i class="fas fa-fire"></i> 回怼黑评</div>' +
        '</div>';
    } else {
        actionsHtml = '<div class="pp-hot-detail-actions">' +
            '<div class="pp-hot-detail-action-btn" onclick="ppHotDetailAction(\'ride\',' + rank + ')"><i class="fas fa-bolt"></i> 蹭热度</div>' +
            '<div class="pp-hot-detail-action-btn" onclick="ppHotDetailAction(\'discuss\',' + rank + ')"><i class="fas fa-comment-dots"></i> 发表看法</div>' +
            '<div class="pp-hot-detail-action-btn" onclick="ppHotDetailAction(\'ignore\',' + rank + ')"><i class="fas fa-eye-slash"></i> 不参与</div>' +
        '</div>';
    }
    
    var overlay = document.createElement('div');
    overlay.className = 'pp-hot-detail-overlay';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    
    overlay.innerHTML = '<div class="pp-hot-detail-panel">' +
        '<div class="pp-hot-detail-header">' +
            '<div class="pp-hot-detail-topic">#' + escapeHtml(item.topic) + '#</div>' +
            '<div class="pp-hot-detail-meta">' +
                '<span>热度 ' + formatFans(item.heat) + '</span>' +
                '<span>排名 #' + item.rank + '</span>' +
                tagHtml +
                (item.isSelf ? '<span style="color:#e74c3c;font-weight:600;">与我相关</span>' : '') +
            '</div>' +
        '</div>' +
        '<div class="pp-hot-detail-body">' +
            '<div class="pp-hot-detail-section">' +
                '<div class="pp-hot-detail-section-title">📰 相关动态</div>' +
                '<div class="pp-hot-detail-news">' + escapeHtml(newsText) + '</div>' +
            '</div>' +
            '<div class="pp-hot-detail-section">' +
                '<div class="pp-hot-detail-section-title">💬 网友热评</div>' +
                commentsHtml +
            '</div>' +
        '</div>' +
        actionsHtml +
        '<button class="pp-hot-detail-close" onclick="this.closest(\'.pp-hot-detail-overlay\').remove()">关闭</button>' +
    '</div>';
    
    document.body.appendChild(overlay);
    overlay.offsetHeight;
    requestAnimationFrame(function() { overlay.classList.add('show'); });
};

window.ppHotDetailAction = function(action, rank) {
    var d = store.paopao;
    var item = d.cachedHotSearch ? d.cachedHotSearch.find(function(h) { return h.rank === rank; }) : null;
    if (!item) return;
    
    var fansChange = 0;
    var title = '', desc = '', positive = true;
    
    if (action === 'repost') {
        fansChange = Math.floor(Math.random() * 500) + 200;
        title = '📢 已转发感谢';
        desc = '你转发了热搜话题并感谢粉丝，粉丝们很开心！涨粉 +' + fansChange;
    } else if (action === 'comment') {
        fansChange = Math.floor(Math.random() * 300) + 100;
        title = '💬 已发表感言';
        desc = '你对热搜话题发表了感言，获得了好评！涨粉 +' + fansChange;
    } else if (action === 'clap') {
        var success = Math.random() > 0.4;
        if (success) {
            fansChange = Math.floor(Math.random() * 800) + 300;
            title = '🔥 回怼成功';
            desc = '你霸气回怼了黑评，粉丝们疯狂打call！涨粉 +' + fansChange;
        } else {
            fansChange = -(Math.floor(Math.random() * 300) + 100);
            title = '😅 翻车了';
            desc = '回怼引发了更大争议...掉粉 ' + fansChange;
            positive = false;
        }
    } else if (action === 'ride') {
        var success2 = Math.random() > 0.5;
        if (success2) {
            fansChange = Math.floor(Math.random() * 400) + 100;
            title = '⚡ 蹭热度成功';
            desc = '你成功蹭到了热度，获得了曝光！涨粉 +' + fansChange;
        } else {
            fansChange = -(Math.floor(Math.random() * 200) + 50);
            title = '😬 蹭热度翻车';
            desc = '被网友吐槽强行蹭热度...掉粉 ' + fansChange;
            positive = false;
        }
    } else if (action === 'discuss') {
        fansChange = Math.floor(Math.random() * 200) + 50;
        title = '💭 已发表看法';
        desc = '你对话题发表了看法，获得了一些关注。涨粉 +' + fansChange;
    } else if (action === 'ignore') {
        title = '🤫 选择低调';
        desc = '你选择了不参与，保持了神秘感。';
        fansChange = 0;
    }
    
    d.fans = Math.max(0, (d.fans || 0) + fansChange);
    save();
    
    // 关闭详情弹窗
    document.querySelectorAll('.pp-hot-detail-overlay').forEach(function(el) { el.remove(); });
    
    showPpResult(title, desc, positive);
};

// ====== 结果弹窗 ======
function showPpResult(title, desc, isPositive){
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.innerHTML = '<div class="pp-result-box ' + (isPositive?'pp-result-positive':'pp-result-negative') + '">' +
        '<div class="pp-result-title">' + title + '</div>' +
        '<div class="pp-result-desc">' + desc + '</div>' +
        '<div class="pp-result-tier">当前等级：' + store.paopao.tier + ' · ' + formatFans(store.paopao.fans) + ' 粉丝</div>' +
        '<button class="pp-result-btn" onclick="this.closest(\'.pp-result-overlay\').remove()">确定</button>' +
    '</div>';
    
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);
    
    setTimeout(function(){ if(overlay.parentNode) overlay.remove(); }, 3000);
}

// ====== 第三个页面：个人资料 ======
function ppRenderProfile(area){
    var d = store.paopao;
    d.tier = calcTier(d.fans);
    
    var totalLikes = 0, totalComments = 0, totalReposts = 0;
    d.blogPosts.forEach(function(p){
        totalLikes += p.likes || 0;
        totalComments += p.comments || 0;
        totalReposts += p.reposts || 0;
    });
    
    var tierThresholds = [0, 10000, 50000, 100000, 500000, 1000000, 2000000, 5000000, 10000000, 20000000, 50000000];
    var tierNames = ['十八线','出道新人','崭露头角','小有名气','五线明星','四线明星','三线明星','二线明星','准一线','一线明星','超一线顶流'];
    var currentIdx = 0;
    for(var i = tierThresholds.length - 1; i >= 0; i--){
        if(d.fans >= tierThresholds[i]){ currentIdx = i; break; }
    }
    var nextThreshold = currentIdx < tierThresholds.length - 1 ? tierThresholds[currentIdx+1] : tierThresholds[currentIdx];
    var currentThreshold = tierThresholds[currentIdx];
    var progress = nextThreshold > currentThreshold ? Math.min(100, ((d.fans - currentThreshold) / (nextThreshold - currentThreshold)) * 100) : 100;
    var nextTierName = currentIdx < tierNames.length - 1 ? tierNames[currentIdx+1] : '已达顶峰';
    
    // 头像显示
    var avatarHtml = d.avatar ?
        '<img src="' + d.avatar + '" class="pp-profile-avatar pp-profile-avatar-img" onclick="ppUploadAvatar()" style="cursor:pointer;object-fit:cover;">' :
        '<div class="pp-profile-avatar" onclick="ppUploadAvatar()" style="cursor:pointer;position:relative;">' + (d.stageName||'星').charAt(0) + '<div style="position:absolute;bottom:-2px;right:-2px;background:#8a6b78;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;border:2px solid rgba(255,255,255,0.5);"><i class="fas fa-camera" style="font-size:9px;"></i></div></div>';
    
    // 性别和年龄显示
    var genderAgeText = '';
    if(d.gender === 'male') genderAgeText += '👨 男生';
    else if(d.gender === 'female') genderAgeText += '👩 女生';
    if(d.age) genderAgeText += (genderAgeText ? ' · ' : '') + d.age + '岁';
    
    area.innerHTML = '<div class="pp-profile-page">' +
        '<div class="pp-profile-card">' +
            avatarHtml +
            '<div class="pp-profile-name">' + escapeHtml(d.stageName||'小星星') + '</div>' +
            (genderAgeText ? '<div style="font-size:13px;opacity:0.85;margin-bottom:6px;">' + genderAgeText + '</div>' : '') +
            '<div class="pp-profile-tier-badge">' + d.tier + '</div>' +
            '<div class="pp-profile-edit" onclick="ppEditProfile()"><i class="fas fa-pen"></i> 编辑资料</div>' +
        '</div>' +
        
        '<div class="pp-stats-grid">' +
            '<div class="pp-stat-item">' +
                '<div class="pp-stat-value">' + formatFans(d.fans) + '</div>' +
                '<div class="pp-stat-label">粉丝数</div>' +
            '</div>' +
            '<div class="pp-stat-item">' +
                '<div class="pp-stat-value">' + d.works.length + '</div>' +
                '<div class="pp-stat-label">代表作</div>' +
            '</div>' +
            '<div class="pp-stat-item">' +
                '<div class="pp-stat-value">' + d.blogPosts.length + '</div>' +
                '<div class="pp-stat-label">Blog</div>' +
            '</div>' +
            '<div class="pp-stat-item" style="cursor:pointer" onclick="ppOpenFinancePage()">' +
                '<div class="pp-stat-value">¥' + formatFans(d.money) + '</div>' +
                '<div class="pp-stat-label">资产</div>' +
            '</div>' +
        '</div>' +

        // 新增：核心功能入口行
        '<div class="pp-feature-row" style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-bottom:14px;">' +
            '<div class="pp-feature-card" onclick="ppOpenFinancePage()" style="background:#fff; border:1px solid rgba(0,0,0,0.06); border-radius:16px; padding:14px 8px; text-align:center; cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,0.04);">' +
                '<i class="fas fa-wallet" style="font-size:18px; color:#111; margin-bottom:6px; display:block;"></i>' +
                '<div style="font-size:11px; color:#222; font-weight:500;">流水</div>' +
            '</div>' +
            '<div class="pp-feature-card" onclick="ppOpenFanLeaderboard()" style="background:#fff; border:1px solid rgba(0,0,0,0.06); border-radius:16px; padding:14px 8px; text-align:center; cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,0.04);">' +
                '<i class="fas fa-trophy" style="font-size:18px; color:#111; margin-bottom:6px; display:block;"></i>' +
                '<div style="font-size:11px; color:#222; font-weight:500;">粉丝榜</div>' +
            '</div>' +
            '<div class="pp-feature-card" onclick="ppOpenWorkTimeline()" style="background:#fff; border:1px solid rgba(0,0,0,0.06); border-radius:16px; padding:14px 8px; text-align:center; cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,0.04);">' +
                '<i class="fas fa-stream" style="font-size:18px; color:#111; margin-bottom:6px; display:block;"></i>' +
                '<div style="font-size:11px; color:#222; font-weight:500;">时间线</div>' +
            '</div>' +
            '<div class="pp-feature-card" onclick="ppOpenMemoryBook()" style="background:#fff; border:1px solid rgba(0,0,0,0.06); border-radius:16px; padding:14px 8px; text-align:center; cursor:pointer; box-shadow:0 2px 10px rgba(0,0,0,0.04);">' +
                '<i class="fas fa-book" style="font-size:18px; color:#111; margin-bottom:6px; display:block;"></i>' +
                '<div style="font-size:11px; color:#222; font-weight:500;">回忆录</div>' +
            '</div>' +
        '</div>' +
        
        '<div class="pp-section-card">' +
            '<div class="pp-section-header"><i class="fas fa-chart-line"></i> 等级进度</div>' +
            '<div class="pp-tier-progress">' +
                '<div class="pp-tier-bar">' +
                    '<div class="pp-tier-fill" style="width:' + progress.toFixed(1) + '%"></div>' +
                '</div>' +
                '<div class="pp-tier-info">' +
                    '<span>' + d.tier + '</span>' +
                    '<span>下一级：' + nextTierName + ' (' + formatFans(nextThreshold) + '粉)</span>' +
                '</div>' +
            '</div>' +
        '</div>' +
        
        // 属性面板
        (d.attrs ? '<div class="pp-section-card">' +
            '<div class="pp-section-header"><i class="fas fa-sparkles"></i> 个人属性</div>' +
            '<div class="pp-profile-attrs">' +
                ['acting','looks','wisdom','rhythm','charm','talent','social'].map(function(k){
                    var val = d.attrs[k] || 0;
                    var colorClass = val >= 80 ? 'pp-attr-excellent' : (val >= 60 ? 'pp-attr-good' : (val >= 40 ? 'pp-attr-normal' : 'pp-attr-low'));
                    return '<div class="pp-profile-attr-item">' +
                        '<div class="pp-profile-attr-label">' + PP_ATTR_ICONS[k] + ' ' + PP_ATTR_NAMES[k] + '</div>' +
                        '<div class="pp-profile-attr-bar-wrap">' +
                            '<div class="pp-profile-attr-bar ' + colorClass + '" style="width:' + val + '%"></div>' +
                        '</div>' +
                        '<div class="pp-profile-attr-val">' + val + '</div>' +
                    '</div>';
                }).join('') +
            '</div>' +
        '</div>' : '') +
        
        // 人生经历
        (d.backstory ? '<div class="pp-section-card">' +
            '<div class="pp-section-header"><i class="fas fa-book-open"></i> 人生经历</div>' +
            '<div class="pp-profile-backstory">' + escapeHtml(d.backstory) + '</div>' +
        '</div>' : '') +
        
        '<div class="pp-section-card">' +
            '<div class="pp-section-header"><i class="fas fa-chart-bar"></i> Blog数据</div>' +
            '<div class="pp-blog-stats">' +
                '<div class="pp-blog-stat"><i class="fas fa-heart" style="color:#ff6b81"></i> ' + formatFans(totalLikes) + ' 点赞</div>' +
                '<div class="pp-blog-stat"><i class="fas fa-comment" style="color:#6c5ce7"></i> ' + formatFans(totalComments) + ' 评论</div>' +
                '<div class="pp-blog-stat"><i class="fas fa-retweet" style="color:#00b894"></i> ' + formatFans(totalReposts) + ' 转发</div>' +
            '</div>' +
        '</div>' +
        
        // 获奖系统
        '<div class="pp-section-card">' +
            '<div class="pp-section-header"><i class="fas fa-award"></i> 获奖荣誉</div>' +
            ppRenderAwards() +
        '</div>' +
        
        // 热搜入口（旧热搜系统已移至发现页）
        '<div class="pp-section-card pp-section-card-linkable" onclick="ppSwitchTab(\'discover\',null)" style="cursor:pointer;">' +
            '<div class="pp-section-header"><i class="fas fa-fire"></i> 微博热搜 <i class="fas fa-chevron-right" style="float:right;font-size:12px;opacity:0.5;margin-top:4px;"></i></div>' +
            '<div style="padding:8px 2px 4px;font-size:13px;color:var(--pp-text-3);">前往「发现」查看微博热搜榜、话题详情、热搜运营</div>' +
        '</div>' +
        
        '<div class="pp-section-card">' +
            '<div class="pp-section-header"><i class="fas fa-trophy"></i> 代表作品</div>' +
            (d.works.length > 0 ? 
                '<div class="pp-works-list">' +
                    d.works.map(function(w){
                        return '<div class="pp-work-item">' +
                            '<div class="pp-work-icon">' + (w.type==='drama'?'🎬':'🎪') + '</div>' +
                            '<div class="pp-work-info">' +
                                '<div class="pp-work-name">' + escapeHtml(w.name) + '</div>' +
                                '<div class="pp-work-fans">涨粉 +' + formatFans(w.fans) + '</div>' +
                            '</div>' +
                        '</div>';
                    }).join('') +
                '</div>' :
                '<div class="pp-empty-hint">还没有代表作，去参加活动吧！</div>'
            ) +
        '</div>' +
        
        '<div class="pp-section-card">' +
            '<div class="pp-section-header"><i class="fas fa-history"></i> 最近活动</div>' +
            (d.completedActivities.length > 0 ?
                '<div class="pp-works-list">' +
                    d.completedActivities.slice(-5).reverse().map(function(a){
                        return '<div class="pp-work-item">' +
                            '<div class="pp-work-icon">🎪</div>' +
                            '<div class="pp-work-info">' +
                                '<div class="pp-work-name">' + escapeHtml(a.name) + '</div>' +
                                '<div class="pp-work-fans">涨粉 +' + formatFans(a.fans) + '</div>' +
                            '</div>' +
                        '</div>';
                    }).join('') +
                '</div>' :
                '<div class="pp-empty-hint">还没有参加过活动</div>'
            ) +
        '</div>' +
    '</div>';
}

// ====== 修改艺名 ======
window.ppEditName = function(){
    var d = store.paopao;
    ppPromptDialog('修改艺名', '输入你的艺名', d.stageName || '', function(newName){
        d.stageName = newName;
        save();
        ppRenderTab();
        var nameEls = document.querySelectorAll('.pp-profile-name');
        nameEls.forEach(function(el){ el.textContent = d.stageName; });
    });
};

// ====== 上传头像 ======
window.ppUploadAvatar = function(){
    var fi = document.createElement('input');
    fi.type = 'file';
    fi.accept = 'image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico';
    fi.onchange = function(){
        if(!fi.files || !fi.files[0]) return;
        var reader = new FileReader();
        reader.onload = function(e){
            var d = store.paopao;
            d.avatar = e.target.result;
            save();
            ppRenderTab();
            showPpResult('✅ 头像更新', '头像已成功更新！', true);
        };
        reader.readAsDataURL(fi.files[0]);
    };
    fi.click();
};

// ====== 编辑个人信息（名字、年龄、性别） ======
window.ppEditProfile = function(){
    var d = store.paopao;
    window._ppSelectedGender = d.gender || '';
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.innerHTML = '<div class="pp-settings-modal">' +
        '<div class="pp-modal-title"><i class="fas fa-user-edit"></i> 编辑个人信息</div>' +
        '<div class="pp-modal-field">' +
            '<label style="display:block;font-size:13px;color:#999;margin-bottom:4px;">艺名</label>' +
            '<input type="text" class="pp-modal-input" id="pp-edit-name" value="' + escapeHtml(d.stageName || '') + '" placeholder="输入你的艺名" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:15px;outline:none;box-sizing:border-box;margin-bottom:12px;">' +
        '</div>' +
        '<div class="pp-modal-field">' +
            '<label style="display:block;font-size:13px;color:#999;margin-bottom:4px;">年龄</label>' +
            '<input type="number" class="pp-modal-input" id="pp-edit-age" value="' + escapeHtml(d.age || '') + '" placeholder="输入你的年龄" min="1" max="99" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:15px;outline:none;box-sizing:border-box;margin-bottom:12px;">' +
        '</div>' +
        '<div class="pp-modal-field">' +
            '<label style="display:block;font-size:13px;color:#999;margin-bottom:8px;">性别</label>' +
            '<div class="pp-gender-selector" style="display:flex;gap:10px;">' +
                '<div class="pp-gender-btn' + (d.gender === 'female' ? ' active' : '') + '" id="pp-gender-female" onclick="ppSelectGender(\'female\')" style="flex:1;padding:10px;border-radius:10px;text-align:center;cursor:pointer;border:1.5px solid ' + (d.gender === 'female' ? '#8a6b78' : '#ddd') + ';background:' + (d.gender === 'female' ? '#f5f0f3' : '#fff') + ';font-size:14px;transition:all 0.2s;">' +
                    '👩 女生' +
                '</div>' +
                '<div class="pp-gender-btn' + (d.gender === 'male' ? ' active' : '') + '" id="pp-gender-male" onclick="ppSelectGender(\'male\')" style="flex:1;padding:10px;border-radius:10px;text-align:center;cursor:pointer;border:1.5px solid ' + (d.gender === 'male' ? '#7a85a0' : '#ddd') + ';background:' + (d.gender === 'male' ? '#f0f2f5' : '#fff') + ';font-size:14px;transition:all 0.2s;">' +
                    '👨 男生' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="pp-modal-field">' +
            '<label style="display:block;font-size:13px;color:#999;margin-bottom:4px;">人生经历</label>' +
            '<textarea class="pp-modal-input" id="pp-edit-backstory" placeholder="输入你的人生经历..." style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:14px;outline:none;box-sizing:border-box;margin-bottom:12px;min-height:80px;resize:vertical;font-family:inherit;line-height:1.5;">' + escapeHtml(d.backstory || '') + '</textarea>' +
        '</div>' +
        '<div class="pp-modal-actions">' +
            '<button class="pp-modal-btn pp-modal-btn-cancel" onclick="this.closest(\'.pp-result-overlay\').remove()">取消</button>' +
            '<button class="pp-modal-btn pp-modal-btn-confirm" onclick="ppSaveProfile()">保存</button>' +
        '</div>' +
    '</div>';
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
};

window._ppSelectedGender = '';
window.ppSelectGender = function(gender){
    window._ppSelectedGender = gender;
    var femaleBtn = document.getElementById('pp-gender-female');
    var maleBtn = document.getElementById('pp-gender-male');
    if(femaleBtn){
        femaleBtn.style.borderColor = gender === 'female' ? '#8a6b78' : '#ddd';
        femaleBtn.style.background = gender === 'female' ? '#f5f0f3' : '#fff';
    }
    if(maleBtn){
        maleBtn.style.borderColor = gender === 'male' ? '#7a85a0' : '#ddd';
        maleBtn.style.background = gender === 'male' ? '#f0f2f5' : '#fff';
    }
};

window.ppSaveProfile = function(){
    var d = store.paopao;
    var nameInput = document.getElementById('pp-edit-name');
    var ageInput = document.getElementById('pp-edit-age');
    var backstoryInput = document.getElementById('pp-edit-backstory');
    
    if(nameInput && nameInput.value.trim()){
        d.stageName = nameInput.value.trim();
    }
    if(ageInput && ageInput.value){
        d.age = ageInput.value;
    }
    if(window._ppSelectedGender){
        d.gender = window._ppSelectedGender;
    }
    if(backstoryInput){
        d.backstory = backstoryInput.value.trim();
    }
    
    save();
    document.querySelectorAll('.pp-result-overlay').forEach(function(el){ el.remove(); });
    ppRenderTab();
    showPpResult('✅ 保存成功', '个人信息已更新！', true);
};

// ====== 存档管理系统 ======
// [FIX-存档] 使用 IndexedDB 存储存档数据，避免 localStorage 5MB 限制导致存档失败
var _ppArchiveDB = null;
var _ppArchiveDBReady = null;

function ppGetArchiveDB(){
    if(_ppArchiveDBReady) return _ppArchiveDBReady;
    _ppArchiveDBReady = new Promise(function(resolve){
        try {
            var request = indexedDB.open('PP_Archives_DB', 1);
            request.onupgradeneeded = function(e){
                var db = e.target.result;
                if(!db.objectStoreNames.contains('archives')){
                    db.createObjectStore('archives', {keyPath: 'id'});
                }
            };
            request.onsuccess = function(e){
                _ppArchiveDB = e.target.result;
                resolve(_ppArchiveDB);
            };
            request.onerror = function(){
                console.warn('PP Archive IndexedDB open failed, falling back to localStorage');
                resolve(null);
            };
        } catch(e){
            console.warn('IndexedDB not available for archives:', e);
            resolve(null);
        }
    });
    return _ppArchiveDBReady;
}

// 从 IndexedDB 读取存档列表
function ppLoadArchives(callback){
    ppGetArchiveDB().then(function(db){
        if(!db){
            // fallback to localStorage
            try {
                var archives = JSON.parse(localStorage.getItem('pp_archives') || '[]');
                callback(archives);
            } catch(e){ callback([]); }
            return;
        }
        try {
            var tx = db.transaction('archives', 'readonly');
            var store_arc = tx.objectStore('archives');
            var req = store_arc.get('pp_archive_list');
            req.onsuccess = function(){
                var result = req.result;
                callback(result ? (result.data || []) : []);
            };
            req.onerror = function(){
                // fallback
                try {
                    callback(JSON.parse(localStorage.getItem('pp_archives') || '[]'));
                } catch(e){ callback([]); }
            };
        } catch(e){
            try {
                callback(JSON.parse(localStorage.getItem('pp_archives') || '[]'));
            } catch(e2){ callback([]); }
        }
    });
}

// 保存存档列表到 IndexedDB
function ppSaveArchives(archives, onSuccess, onError){
    ppGetArchiveDB().then(function(db){
        if(!db){
            // fallback to localStorage
            try {
                localStorage.setItem('pp_archives', JSON.stringify(archives));
                if(onSuccess) onSuccess();
            } catch(e){
                console.error('存档保存失败(localStorage):', e);
                if(onError) onError(e);
            }
            return;
        }
        try {
            var tx = db.transaction('archives', 'readwrite');
            var store_arc = tx.objectStore('archives');
            store_arc.put({id: 'pp_archive_list', data: archives});
            tx.oncomplete = function(){
                // 同时尝试清除旧的 localStorage 存档数据以释放空间
                try { localStorage.removeItem('pp_archives'); } catch(e){}
                if(onSuccess) onSuccess();
            };
            tx.onerror = function(e){
                console.error('存档保存失败(IndexedDB):', e);
                // fallback to localStorage
                try {
                    localStorage.setItem('pp_archives', JSON.stringify(archives));
                    if(onSuccess) onSuccess();
                } catch(e2){
                    if(onError) onError(e2);
                }
            };
        } catch(e){
            try {
                localStorage.setItem('pp_archives', JSON.stringify(archives));
                if(onSuccess) onSuccess();
            } catch(e2){
                if(onError) onError(e2);
            }
        }
    });
}

// [FIX-存档] 裁剪存档数据，减少体积
function ppTrimArchiveData(data){
    var trimmed = JSON.parse(JSON.stringify(data));
    // 限制群聊消息数量
    if(trimmed.chatMessages && trimmed.chatMessages.length > 30){
        trimmed.chatMessages = trimmed.chatMessages.slice(-30);
    }
    // 限制私聊消息数量
    if(trimmed.contactChats){
        var keys = Object.keys(trimmed.contactChats);
        for(var i = 0; i < keys.length; i++){
            var msgs = trimmed.contactChats[keys[i]];
            if(msgs && msgs.length > 20){
                trimmed.contactChats[keys[i]] = msgs.slice(-20);
            }
        }
    }
    // 限制博客帖子
    if(trimmed.blogPosts && trimmed.blogPosts.length > 20){
        trimmed.blogPosts = trimmed.blogPosts.slice(-20);
    }
    // 限制工作历史
    if(trimmed.jobHistory && trimmed.jobHistory.length > 15){
        trimmed.jobHistory = trimmed.jobHistory.slice(-15);
    }
    return trimmed;
}

// 迁移旧的 localStorage 存档到 IndexedDB
(function ppMigrateArchives(){
    try {
        var oldData = localStorage.getItem('pp_archives');
        if(oldData){
            var archives = JSON.parse(oldData);
            if(archives && archives.length > 0){
                ppGetArchiveDB().then(function(db){
                    if(!db) return;
                    try {
                        var tx = db.transaction('archives', 'readwrite');
                        var store_arc = tx.objectStore('archives');
                        // 先检查是否已有数据
                        var req = store_arc.get('pp_archive_list');
                        req.onsuccess = function(){
                            if(!req.result || !req.result.data || req.result.data.length === 0){
                                // IndexedDB 没有数据，迁移过去
                                store_arc.put({id: 'pp_archive_list', data: archives});
                                console.log('PP Archives migrated to IndexedDB:', archives.length);
                            }
                        };
                    } catch(e){ console.warn('Archive migration failed:', e); }
                });
            }
        }
    } catch(e){}
})();

window.ppOpenArchiveMenu = function(){
    var overlay = document.createElement('div');
    overlay.className = 'pp-result-overlay';
    overlay.onclick = function(e){ if(e.target === overlay) overlay.remove(); };

    // 显示加载中
    overlay.innerHTML = '<div class="pp-settings-modal" style="text-align:center;padding:40px;"><div style="font-size:14px;color:#999;">加载存档中...</div></div>';
    var ppApp = document.querySelector('.pp-app');
    if(ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);

    ppLoadArchives(function(archives){
        var archiveListHtml = archives.length > 0 ? archives.map(function(a, idx){
            var date = new Date(a.time).toLocaleString('zh-CN');
            return '<div class="pp-archive-item" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #f0f0f0;">' +
                '<div style="flex:1;">' +
                    '<div style="font-size:14px;font-weight:500;">' + escapeHtml(a.name || ('存档' + (idx+1))) + '</div>' +
                    '<div style="font-size:12px;color:#999;margin-top:2px;">' + escapeHtml(a.stageName || '未知') + ' · ' + escapeHtml(a.tier || '') + ' · 粉丝 ' + formatFans(a.fans || 0) + '</div>' +
                    '<div style="font-size:11px;color:#bbb;margin-top:2px;">' + date + '</div>' +
                '</div>' +
                '<div style="display:flex;gap:6px;">' +
                    '<button onclick="event.stopPropagation();ppDoLoadArchive(' + idx + ')" style="padding:6px 12px;border:none;border-radius:8px;background:#8a6b78;color:#fff;font-size:12px;cursor:pointer;">读取</button>' +
                    '<button onclick="event.stopPropagation();ppDoDeleteArchive(' + idx + ')" style="padding:6px 12px;border:none;border-radius:8px;background:#e74c3c;color:#fff;font-size:12px;cursor:pointer;">删除</button>' +
                '</div>' +
            '</div>';
        }).join('') : '<div style="text-align:center;padding:20px;color:#999;font-size:13px;">暂无存档</div>';

        overlay.innerHTML = '<div class="pp-settings-modal" style="max-height:80vh;overflow-y:auto;">' +
            '<div class="pp-modal-title"><i class="fas fa-save"></i> 存档管理</div>' +
            '<div style="display:flex;gap:8px;margin-bottom:16px;">' +
                '<button onclick="ppDoSaveArchive()" style="flex:1;padding:10px;border:none;border-radius:10px;background:#8a6b78;color:#fff;font-size:14px;cursor:pointer;"><i class="fas fa-download"></i> 存档</button>' +
                '<button onclick="ppDoNewArchive()" style="flex:1;padding:10px;border:none;border-radius:10px;background:#e67e22;color:#fff;font-size:14px;cursor:pointer;"><i class="fas fa-plus"></i> 新建存档</button>' +
            '</div>' +
            '<div style="font-size:13px;color:#666;margin-bottom:8px;font-weight:500;">已有存档：</div>' +
            '<div id="pp-archive-list" style="border:1px solid #f0f0f0;border-radius:10px;overflow:hidden;">' +
                archiveListHtml +
            '</div>' +
            '<div class="pp-modal-actions" style="margin-top:16px;">' +
                '<button class="pp-modal-btn pp-modal-btn-cancel" onclick="this.closest(\'.pp-result-overlay\').remove()">关闭</button>' +
            '</div>' +
        '</div>';
    });
};

// 存档当前数据
window.ppDoSaveArchive = function(){
    var d = store.paopao;
    if(!d || !d.stageName){
        showPpResult('⚠️ 无法存档', '当前没有可存档的数据', false);
        return;
    }
    // [FIX-存档] 裁剪数据减少体积
    var archiveData = ppTrimArchiveData(d);

    ppLoadArchives(function(archives){
        archives.push({
            name: '存档 ' + (archives.length + 1),
            stageName: d.stageName || '未知',
            tier: d.tier || '',
            fans: d.fans || 0,
            time: Date.now(),
            data: archiveData
        });
        ppSaveArchives(archives, function(){
            // 关闭并重新打开菜单刷新列表
            document.querySelectorAll('.pp-result-overlay').forEach(function(el){ el.remove(); });
            showPpResult('✅ 存档成功', '已保存当前进度：' + escapeHtml(d.stageName) + ' (' + escapeHtml(d.tier || '') + ')', true);
        }, function(err){
            showPpResult('❌ 存档失败', '存储空间可能已满，请删除一些旧存档后重试。\n错误：' + (err.message || err), false);
        });
    });
};

// 新建存档（重新开始）
window.ppDoNewArchive = function(){
    ppConfirmDialog('⚠️ 新建存档', '确定要重新开始吗？\n当前进度将不会自动保存，请先手动存档！\n新建存档会重置所有数据，包括人物、粉丝、作品等。', function(){
        // 重置paopao数据
        store.paopao = null;
        save();
        document.querySelectorAll('.pp-result-overlay').forEach(function(el){ el.remove(); });
        // 重新渲染泡泡app（会进入出道流程）
        var el = document.getElementById('layer-paopao');
        if(el){
            var contentEl = el.querySelector('.layer-content') || el;
            if(typeof renderPaopao === 'function') renderPaopao(contentEl);
            else if(typeof window.openApp === 'function'){
                el.classList.remove('show');
                setTimeout(function(){ window.openApp('paopao'); }, 200);
            }
        }
    });
};

// 读取存档
window.ppDoLoadArchive = function(idx){
    ppLoadArchives(function(archives){
        if(idx < 0 || idx >= archives.length) return;
        var archive = archives[idx];
        ppConfirmDialog('📂 读取存档', '确定要读取存档「' + escapeHtml(archive.name) + '」吗？\n当前进度将被覆盖！', function(){
            store.paopao = JSON.parse(JSON.stringify(archive.data));
            save();
            document.querySelectorAll('.pp-result-overlay').forEach(function(el){ el.remove(); });
            // 重新渲染
            ppRenderTab();
            // 更新导航栏粉丝数
            var fansEl = document.querySelector('.pp-nav-fans');
            if(fansEl) fansEl.innerHTML = '<i class="fas fa-heart"></i> ' + formatFans(store.paopao.fans);
            showPpResult('✅ 读取成功', '已恢复存档：' + escapeHtml(archive.stageName) + ' (' + escapeHtml(archive.tier || '') + ')', true);
        });
    });
};

// 删除存档
window.ppDoDeleteArchive = function(idx){
    ppLoadArchives(function(archives){
        if(idx < 0 || idx >= archives.length) return;
        var archive = archives[idx];
        ppConfirmDialog('🗑️ 删除存档', '确定要删除存档「' + escapeHtml(archive.name) + '」吗？\n此操作不可撤销！', function(){
            archives.splice(idx, 1);
            ppSaveArchives(archives, function(){
                document.querySelectorAll('.pp-result-overlay').forEach(function(el){ el.remove(); });
                showPpResult('✅ 已删除', '存档已删除', true);
            }, function(){
                showPpResult('❌ 删除失败', '请重试', false);
            });
        });
    });
};

// ====== 清理计时器 ======
var _origExitApp = window.exitApp;
if(typeof _origExitApp === 'function'){
    // 不覆盖
}
var ppObserver = new MutationObserver(function(mutations){
    mutations.forEach(function(m){
        if(m.type === 'attributes' && m.attributeName === 'class'){
            var layer = document.getElementById('layer-paopao');
            if(layer && !layer.classList.contains('show') && !layer.classList.contains('active')){
                if(fanMsgTimer){ clearInterval(fanMsgTimer); fanMsgTimer = null; }
                // 清理工作定时器
                Object.keys(ppJobTimers).forEach(function(k){
                    clearInterval(ppJobTimers[k]);
                    delete ppJobTimers[k];
                });
                // [FIX] 统一清理所有残留定时器
                if(ppShootingTimer){ clearInterval(ppShootingTimer); ppShootingTimer = null; }
                if(window._ppMsgLongPressTimer){ clearTimeout(window._ppMsgLongPressTimer); window._ppMsgLongPressTimer = null; }
                if(_ppSceneTriggerTimeout){ clearTimeout(_ppSceneTriggerTimeout); _ppSceneTriggerTimeout = null; }
                _ppSceneTriggering = false;
            }
        }
    });
});
setTimeout(function(){
    var layer = document.getElementById('layer-paopao');
    if(layer) ppObserver.observe(layer, {attributes: true});
}, 1000);

// =====================================================================
// ====== 【新增功能】财务流水 + 粉丝榜 + 工作时间线 + 回忆录 + 趋势 + 关系网 ======
// =====================================================================

// ---------- 财务流水工具函数 ----------
window.ppRecordFinance = function(type, amount, category, desc){
    if (!amount || amount <= 0) return;
    var d = store.paopao;
    if (!d.financeLog) d.financeLog = [];
    d.financeLog.unshift({
        id: 'fin_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        type: type, // 'income' | 'expense'
        amount: Math.round(amount),
        category: category || '其他',
        desc: desc || '',
        date: Date.now()
    });
    // 保留最近200条
    if (d.financeLog.length > 200) d.financeLog = d.financeLog.slice(0, 200);
    save();
};

// ---------- 财务明细页 ----------
var ppFinanceFilter = 'all'; // all | income | expense | 30d | 7d
window.ppOpenFinancePage = function(){
    var d = store.paopao;
    // 补记初始资产（仅首次）
    if (!d.financeLog || d.financeLog.length === 0) {
        if ((d.money || 0) > 0) {
            ppRecordFinance('income', d.money, '初始资产', '出道起始资金');
        }
    }
    ppShowFullPage('finance', ppRenderFinancePage);
};

function ppRenderFinancePage(container){
    var d = store.paopao;
    var logs = (d.financeLog || []).slice();
    var now = Date.now();
    var DAY = 86400000;

    // 过滤
    if (ppFinanceFilter === 'income') logs = logs.filter(function(l){ return l.type === 'income'; });
    else if (ppFinanceFilter === 'expense') logs = logs.filter(function(l){ return l.type === 'expense'; });
    else if (ppFinanceFilter === '7d') logs = logs.filter(function(l){ return now - l.date <= 7 * DAY; });
    else if (ppFinanceFilter === '30d') logs = logs.filter(function(l){ return now - l.date <= 30 * DAY; });

    // 汇总
    var totalIncome = 0, totalExpense = 0;
    (d.financeLog || []).forEach(function(l){
        if (l.type === 'income') totalIncome += l.amount;
        else totalExpense += l.amount;
    });

    // 过滤后汇总（用于显示）
    var filterIncome = 0, filterExpense = 0;
    logs.forEach(function(l){
        if (l.type === 'income') filterIncome += l.amount;
        else filterExpense += l.amount;
    });

    // 按日期分组
    var grouped = {};
    logs.forEach(function(l){
        var dt = new Date(l.date);
        var key = dt.getFullYear() + '-' + (dt.getMonth()+1) + '-' + dt.getDate();
        if (!grouped[key]) grouped[key] = { label: ppFormatDate(l.date), items: [] };
        grouped[key].items.push(l);
    });

    var groupsHtml = '';
    Object.keys(grouped).forEach(function(k){
        var g = grouped[k];
        groupsHtml += '<div style="padding:12px 4px 6px; font-size:11px; color:#999; letter-spacing:1px;">' + g.label + '</div>';
        g.items.forEach(function(l){
            var iconMap = { '通告': 'fa-film', '综艺': 'fa-tv', '代言': 'fa-star', '工作亏损': 'fa-chart-line', '送礼': 'fa-gift', '初始资产': 'fa-piggy-bank', '日常': 'fa-shopping-bag' };
            var icon = iconMap[l.category] || (l.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up');
            groupsHtml += '<div class="pp-finance-item">' +
                '<div class="pp-finance-item-icon"><i class="fas ' + icon + '"></i></div>' +
                '<div class="pp-finance-item-info">' +
                    '<div class="pp-finance-item-title">' + escapeHtml(l.category) + (l.desc ? ' · ' + escapeHtml(l.desc) : '') + '</div>' +
                    '<div class="pp-finance-item-sub">' + new Date(l.date).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }) + '</div>' +
                '</div>' +
                '<div class="pp-finance-item-amount ' + l.type + '">¥' + formatFans(l.amount) + '</div>' +
            '</div>';
        });
    });

    container.innerHTML = ppFullPageHeader('资产流水') +
        '<div class="pp-finance-page">' +
            '<div class="pp-finance-summary">' +
                '<div class="pp-finance-summary-label">当前资产</div>' +
                '<div class="pp-finance-summary-amount">¥' + formatFans(d.money) + '</div>' +
                '<div class="pp-finance-summary-row">' +
                    '<div class="pp-finance-summary-cell">' +
                        '<div class="pp-finance-summary-cell-label">累计收入</div>' +
                        '<div class="pp-finance-summary-cell-val">+¥' + formatFans(totalIncome) + '</div>' +
                    '</div>' +
                    '<div class="pp-finance-summary-cell">' +
                        '<div class="pp-finance-summary-cell-label">累计支出</div>' +
                        '<div class="pp-finance-summary-cell-val">−¥' + formatFans(totalExpense) + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="pp-finance-filters">' +
                ['all', 'income', 'expense', '7d', '30d'].map(function(f){
                    var label = { all: '全部', income: '收入', expense: '支出', '7d': '7天', '30d': '30天' }[f];
                    return '<div class="pp-finance-filter' + (ppFinanceFilter === f ? ' active' : '') + '" onclick="ppSetFinanceFilter(\'' + f + '\')">' + label + '</div>';
                }).join('') +
            '</div>' +
            (logs.length === 0 ?
                '<div class="pp-empty-hint" style="padding:40px 16px; background:#fff; border-radius:16px; border:1px solid rgba(0,0,0,0.06);"><i class="far fa-folder-open" style="font-size:28px; opacity:0.2; display:block; margin-bottom:8px;"></i>暂无流水记录</div>' :
                groupsHtml) +
        '</div>';
}
window.ppSetFinanceFilter = function(f){
    ppFinanceFilter = f;
    var c = document.getElementById('pp-fullpage-content');
    if (c) ppRenderFinancePage(c);
};

// ---------- 粉丝排行榜 ----------
window.ppOpenFanLeaderboard = function(){
    ppShowFullPage('fanleaderboard', ppRenderFanLeaderboard);
};

function ppRenderFanLeaderboard(container){
    var d = store.paopao;
    var profiles = d.fanProfiles || {};
    var keys = Object.keys(profiles);

    // 计算综合得分 = 忠诚度*0.4 + 等级*10 + 发言*0.3 + 数据*0.5 + 反黑*1 + 点赞*0.2 + 转发*0.3 + 签到*0.5
    var list = keys.map(function(k){
        var p = profiles[k];
        var stats = p.stats || {};
        var score = (p.loyalty || 0) * 0.4
            + (p.level || 1) * 10
            + (stats.messages || 0) * 0.3
            + (stats.dataWork || 0) * 0.5
            + (stats.antiBlack || 0) * 1
            + (stats.likes || 0) * 0.2
            + (stats.reposts || 0) * 0.3
            + (stats.checkin || 0) * 0.5;
        return {
            name: p.name,
            level: p.level,
            type: p.type,
            loyalty: p.loyalty,
            joinTime: p.joinTime,
            isBlackFan: p.isBlackFan,
            score: Math.round(score)
        };
    }).filter(function(f){ return !f.isBlackFan; })
      .sort(function(a, b){ return b.score - a.score; });

    var top = list.slice(0, 100);
    var html = ppFullPageHeader('粉丝排行榜') +
        '<div class="pp-leaderboard-page">' +
            '<div class="pp-lb-header">' +
                '<div class="pp-lb-header-label">贡献榜</div>' +
                '<div class="pp-lb-header-count">' + list.length + '</div>' +
                '<div class="pp-lb-header-sub">位活跃粉丝 · 按综合贡献排名</div>' +
            '</div>';

    if (top.length === 0) {
        html += '<div class="pp-empty-hint" style="padding:60px 20px; background:#fff; border-radius:16px; border:1px solid rgba(0,0,0,0.06);"><i class="far fa-users" style="font-size:32px; opacity:0.25; display:block; margin-bottom:10px;"></i>还没有粉丝上榜<br><span style="font-size:11px;">在群聊中和粉丝互动可以获得粉丝档案</span></div>';
    } else {
        top.forEach(function(f, idx){
            var rank = idx + 1;
            var rankCls = rank === 1 ? 'top1' : (rank === 2 ? 'top2' : (rank === 3 ? 'top3' : ''));
            var fanAge = Math.floor((Date.now() - f.joinTime) / 86400000);
            html += '<div class="pp-lb-item" onclick="ppShowFanProfile(\'' + escapeHtml(f.name).replace(/'/g,'&#39;') + '\')" style="cursor:pointer;">' +
                '<div class="pp-lb-rank ' + rankCls + '">' + rank + '</div>' +
                '<div class="pp-lb-avatar">' + (f.name || '?').charAt(0) + '</div>' +
                '<div class="pp-lb-info">' +
                    '<div class="pp-lb-name">' + escapeHtml(f.name) + '</div>' +
                    '<div class="pp-lb-sub">' + escapeHtml(f.type || '普通粉') + ' · Lv.' + f.level + ' · 粉龄' + fanAge + '天</div>' +
                '</div>' +
                '<div class="pp-lb-score">' + f.score + '</div>' +
            '</div>';
        });
    }
    html += '</div>';
    container.innerHTML = html;
}

// ---------- 工作时间线 ----------
window.ppOpenWorkTimeline = function(){
    ppShowFullPage('timeline', ppRenderWorkTimeline);
};

function ppRenderWorkTimeline(container){
    var d = store.paopao;
    var history = (d.jobHistory || []).slice().reverse(); // 最新在前
    var active = d.activeJobs || [];

    var html = ppFullPageHeader('工作时间线') + '<div class="pp-timeline-page">';

    if (active.length === 0 && history.length === 0) {
        html += '<div class="pp-empty-hint" style="padding:60px 20px; background:#fff; border-radius:16px; border:1px solid rgba(0,0,0,0.06);"><i class="far fa-calendar" style="font-size:32px; opacity:0.25; display:block; margin-bottom:10px;"></i>还没有工作记录<br><span style="font-size:11px;">接工作后这里会显示时间线</span></div>';
    } else {
        // 进行中
        active.forEach(function(j){
            var typeLabel = { tongGao: '通告', zongYi: '综艺', daiYan: '代言', blog: '博客' }[j.type] || j.type;
            html += '<div class="pp-timeline-item">' +
                '<div class="pp-timeline-dot active"><i class="fas fa-play" style="font-size:11px;"></i></div>' +
                '<div class="pp-timeline-body">' +
                    '<div class="pp-timeline-title">' + escapeHtml(j.name) + '</div>' +
                    '<div class="pp-timeline-date">' + typeLabel + ' · ' + (j.stars ? '⭐'.repeat(Math.min(j.stars, 5)) : '') + ' · 进行中</div>' +
                    (j.desc ? '<div class="pp-timeline-desc">' + escapeHtml(j.desc) + '</div>' : '') +
                '</div>' +
            '</div>';
        });

        // 已完成
        history.forEach(function(h){
            var typeLabel = { tongGao: '通告', zongYi: '综艺', daiYan: '代言', blog: '博客' }[h.type] || h.type;
            var resultEmoji = h.result === '爆了' ? '🔥' : h.result === '小火' ? '✨' : h.result === '平淡' ? '😐' : '💔';
            var dateStr = new Date(h.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' });
            var desc = '';
            if ((h.fansChange || 0) > 0) desc += '涨粉 +' + formatFans(h.fansChange);
            else if ((h.fansChange || 0) < 0) desc += '掉粉 ' + formatFans(h.fansChange);
            if (h.moneyChange) desc += (desc ? ' · ' : '') + '收益 ¥' + formatFans(h.moneyChange);
            html += '<div class="pp-timeline-item">' +
                '<div class="pp-timeline-dot done"><i class="fas fa-check" style="font-size:11px;"></i></div>' +
                '<div class="pp-timeline-body">' +
                    '<div class="pp-timeline-title">' + resultEmoji + ' ' + escapeHtml(h.name) + '</div>' +
                    '<div class="pp-timeline-date">' + typeLabel + ' · ' + dateStr + ' · ' + escapeHtml(h.result || '完成') + '</div>' +
                    (desc ? '<div class="pp-timeline-desc">' + desc + '</div>' : '') +
                '</div>' +
            '</div>';
        });
    }
    html += '</div>';
    container.innerHTML = html;
}

// ---------- 演艺回忆录 ----------
window.ppOpenMemoryBook = function(){
    ppShowFullPage('memorybook', ppRenderMemoryBook);
};

function ppRenderMemoryBook(container){
    var d = store.paopao;
    var entries = [];

    // 1. 作品入库
    (d.works || []).forEach(function(w){
        entries.push({
            type: 'work',
            title: '代表作《' + w.name + '》',
            desc: w.result ? '评价：' + w.result : '',
            extra: w.fans > 0 ? '带来 ' + formatFans(w.fans) + ' 新粉' : '',
            date: w.date
        });
    });
    // 2. 活动
    (d.completedActivities || []).forEach(function(a){
        entries.push({
            type: 'activity',
            title: '参与「' + a.name + '」',
            desc: a.result ? '结果：' + a.result : '',
            extra: (a.fans > 0 ? '+' + formatFans(a.fans) + '粉' : ''),
            date: a.date
        });
    });
    // 3. 获奖
    (d.awards || []).forEach(function(aw){
        entries.push({
            type: 'award',
            title: '🏆 获得「' + aw.name + '」',
            desc: (aw.ceremony ? aw.ceremony + ' · ' : '') + (aw.category || ''),
            extra: aw.work ? '凭《' + aw.work + '》' : '',
            date: aw.date
        });
    });
    // 4. 热搜记录
    (d.hotSearchHistory || []).forEach(function(h){
        entries.push({
            type: 'hot',
            title: '🔥 登上热搜「' + h.topic + '」',
            desc: '排名第' + h.rank + '位',
            extra: h.heat ? '热度 ' + formatFans(h.heat) : '',
            date: h.date
        });
    });
    // 5. 事件
    (d.eventHistory || []).slice(-20).forEach(function(e){
        entries.push({
            type: 'event',
            title: e.title || e.name || '特殊事件',
            desc: e.desc || '',
            extra: '',
            date: e.date
        });
    });

    // [FIX] 回忆录去重：同类型+同标题视为重复
    var seen = {};
    entries = entries.filter(function(e){
        var key = e.type + '|' + e.title;
        if(seen[key]) return false;
        seen[key] = true;
        return true;
    });
    // 按时间倒序
    entries.sort(function(a, b){ return (b.date || 0) - (a.date || 0); });

    var html = ppFullPageHeader('演艺回忆录') +
        '<div class="pp-timeline-page">';

    if (entries.length === 0) {
        html += '<div class="pp-empty-hint" style="padding:60px 20px; background:#fff; border-radius:16px; border:1px solid rgba(0,0,0,0.06);"><i class="far fa-book" style="font-size:32px; opacity:0.25; display:block; margin-bottom:10px;"></i>回忆录还是一片空白<br><span style="font-size:11px;">继续演艺之路，精彩时刻会被记录在这里</span></div>';
    } else {
        var iconMap = { work: 'fa-film', activity: 'fa-microphone', award: 'fa-trophy', hot: 'fa-fire', event: 'fa-star' };
        entries.forEach(function(e){
            html += '<div class="pp-timeline-item">' +
                '<div class="pp-timeline-dot done"><i class="fas ' + (iconMap[e.type] || 'fa-circle') + '" style="font-size:11px;"></i></div>' +
                '<div class="pp-timeline-body">' +
                    '<div class="pp-timeline-title">' + escapeHtml(e.title) + '</div>' +
                    '<div class="pp-timeline-date">' + (e.date ? new Date(e.date).toLocaleDateString('zh-CN') : '') + (e.extra ? ' · ' + escapeHtml(e.extra) : '') + '</div>' +
                    (e.desc ? '<div class="pp-timeline-desc">' + escapeHtml(e.desc) + '</div>' : '') +
                '</div>' +
            '</div>';
        });
    }
    html += '</div>';
    container.innerHTML = html;
}

// ---------- 全屏子页面容器（通用） ----------
function ppShowFullPage(id, renderFn){
    // 关闭已有
    var old = document.getElementById('pp-fullpage-overlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'pp-fullpage-overlay';
    overlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:#f5f5f5; z-index:200; display:flex; flex-direction:column; animation:ppSlideInRight 0.28s cubic-bezier(0.16,1,0.3,1);';
    overlay.innerHTML = '<div id="pp-fullpage-content" style="flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; padding-bottom:40px;"></div>';

    var ppApp = document.querySelector('.pp-app');
    if (ppApp) ppApp.appendChild(overlay);
    else document.body.appendChild(overlay);

    // 注入滑入动画（若尚未注入）
    if (!document.getElementById('pp-fullpage-style')) {
        var s = document.createElement('style');
        s.id = 'pp-fullpage-style';
        s.textContent = '@keyframes ppSlideInRight { from { transform: translateX(100%); opacity: 0.6; } to { transform: translateX(0); opacity: 1; } }';
        document.head.appendChild(s);
    }

    renderFn(document.getElementById('pp-fullpage-content'));
}
window.ppCloseFullPage = function(){
    var o = document.getElementById('pp-fullpage-overlay');
    if (o) {
        o.style.animation = 'ppSlideInRight 0.22s cubic-bezier(0.16,1,0.3,1) reverse';
        setTimeout(function(){ if (o.parentNode) o.remove(); }, 220);
    }
};

// 全屏页顶栏HTML
function ppFullPageHeader(title){
    return '<div style="display:flex; align-items:center; padding:14px 16px 10px; background:#f5f5f5; position:sticky; top:0; z-index:5;">' +
        '<div onclick="ppCloseFullPage()" style="width:38px; height:38px; background:#fff; border-radius:50%; box-shadow:0 2px 10px rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.06); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#111;"><i class="fas fa-chevron-left"></i></div>' +
        '<div style="flex:1; margin-left:14px; font-size:18px; font-weight:700; color:#111; letter-spacing:-0.2px;">' + escapeHtml(title) + '</div>' +
    '</div>';
}

// 格式化日期为"今天/昨天/前天/mm月dd日"
function ppFormatDate(ts){
    var now = Date.now();
    var DAY = 86400000;
    var d1 = new Date(ts);
    var d2 = new Date(now);
    d1.setHours(0,0,0,0);
    d2.setHours(0,0,0,0);
    var diff = Math.round((d2 - d1) / DAY);
    if (diff === 0) return '今天';
    if (diff === 1) return '昨天';
    if (diff === 2) return '前天';
    var dt = new Date(ts);
    var isSameYear = dt.getFullYear() === new Date().getFullYear();
    if (isSameYear) return (dt.getMonth()+1) + '月' + dt.getDate() + '日';
    return dt.getFullYear() + '年' + (dt.getMonth()+1) + '月' + dt.getDate() + '日';
}

// ---------- [P2] 热搜趋势可视化 ----------
// 在个人资料的"热搜"区块补一个图表入口
window.ppOpenHotTrend = function(){
    ppShowFullPage('hottrend', ppRenderHotTrend);
};

function ppRenderHotTrend(container){
    var d = store.paopao;
    var history = (d.hotSearchHistory || []).slice();
    // 按时间升序
    history.sort(function(a, b){ return a.date - b.date; });

    // 最近30天数据
    var now = Date.now();
    var recent = history.filter(function(h){ return now - h.date <= 30 * 86400000; });

    var html = ppFullPageHeader('热搜趋势') + '<div style="padding:14px;">';

    if (recent.length < 2) {
        html += '<div class="pp-empty-hint" style="padding:60px 20px; background:#fff; border-radius:16px; border:1px solid rgba(0,0,0,0.06);"><i class="far fa-chart-bar" style="font-size:32px; opacity:0.25; display:block; margin-bottom:10px;"></i>近30天热搜数据不足<br><span style="font-size:11px;">上榜更多次就能看到趋势图</span></div>';
    } else {
        // SVG 折线图
        var W = 320, H = 160, PAD = 30;
        var ranks = recent.map(function(h){ return h.rank || 50; });
        var minR = Math.min.apply(null, ranks), maxR = Math.max.apply(null, ranks);
        // 排名越小越好，所以反转Y
        var points = recent.map(function(h, i){
            var x = PAD + (i / (recent.length - 1)) * (W - PAD * 2);
            var y = PAD + ((h.rank - minR) / Math.max(1, maxR - minR)) * (H - PAD * 2);
            return { x: x, y: y, rank: h.rank, topic: h.topic, date: h.date };
        });
        var polyline = points.map(function(p){ return p.x + ',' + p.y; }).join(' ');

        var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%; height:auto; display:block;">';
        // 网格
        svg += '<line x1="' + PAD + '" y1="' + PAD + '" x2="' + (W-PAD) + '" y2="' + PAD + '" stroke="#eee" stroke-width="1"/>';
        svg += '<line x1="' + PAD + '" y1="' + (H-PAD) + '" x2="' + (W-PAD) + '" y2="' + (H-PAD) + '" stroke="#eee" stroke-width="1"/>';
        // Y轴标签
        svg += '<text x="5" y="' + (PAD + 4) + '" font-size="9" fill="#999">#' + minR + '</text>';
        svg += '<text x="5" y="' + (H - PAD + 4) + '" font-size="9" fill="#999">#' + maxR + '</text>';
        // 折线
        svg += '<polyline points="' + polyline + '" fill="none" stroke="#111" stroke-width="2" stroke-linejoin="round"/>';
        // 圆点
        points.forEach(function(p){
            svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="3" fill="#111"/>';
        });
        svg += '</svg>';

        html += '<div style="background:#fff; border-radius:18px; padding:18px; border:1px solid rgba(0,0,0,0.06); box-shadow:0 2px 10px rgba(0,0,0,0.04); margin-bottom:14px;">' +
            '<div style="font-size:11px; color:#999; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px;">近30天排名走势</div>' +
            '<div style="font-size:22px; font-weight:700; color:#111; letter-spacing:-0.3px; margin-bottom:14px;">上榜 ' + recent.length + ' 次 · 最高 #' + minR + '</div>' +
            svg +
        '</div>';

        // 最近热搜列表
        html += '<div style="font-size:11px; color:#999; letter-spacing:1.5px; text-transform:uppercase; padding:0 4px 8px;">最近上榜</div>';
        recent.slice(-10).reverse().forEach(function(h){
            html += '<div class="pp-finance-item" style="margin-bottom:8px;">' +
                '<div class="pp-finance-item-icon"><i class="fas fa-fire"></i></div>' +
                '<div class="pp-finance-item-info">' +
                    '<div class="pp-finance-item-title">' + escapeHtml(h.topic || '未命名话题') + '</div>' +
                    '<div class="pp-finance-item-sub">' + new Date(h.date).toLocaleDateString('zh-CN') + (h.heat ? ' · 热度 ' + formatFans(h.heat) : '') + '</div>' +
                '</div>' +
                '<div class="pp-finance-item-amount" style="color:#111;">#' + h.rank + '</div>' +
            '</div>';
        });
    }
    html += '</div>';
    container.innerHTML = html;
}

// ---------- [P2] NPC明星关系网（简化版） ----------
window.ppOpenNpcRelations = function(){
    ppShowFullPage('npcrelations', ppRenderNpcRelations);
};

function ppRenderNpcRelations(container){
    var d = store.paopao;
    var npcs = (d.npcStars || []).slice();

    var html = ppFullPageHeader('圈内关系') + '<div style="padding:14px;">';

    if (npcs.length === 0) {
        html += '<div class="pp-empty-hint" style="padding:60px 20px; background:#fff; border-radius:16px; border:1px solid rgba(0,0,0,0.06);"><i class="far fa-users" style="font-size:32px; opacity:0.25; display:block; margin-bottom:10px;"></i>还没有认识的同行<br><span style="font-size:11px;">参与更多活动可以结识NPC明星</span></div>';
    } else {
        // 按关系类别分组
        var groupedByRel = { '好友': [], '合作伙伴': [], '竞争对手': [], '未定义': [] };
        npcs.forEach(function(n){
            var rel = n.relation || '未定义';
            if (!groupedByRel[rel]) groupedByRel[rel] = [];
            groupedByRel[rel].push(n);
        });

        Object.keys(groupedByRel).forEach(function(relKey){
            if (groupedByRel[relKey].length === 0) return;
            html += '<div style="font-size:11px; color:#999; letter-spacing:1.5px; text-transform:uppercase; padding:12px 4px 8px;">' + relKey + ' (' + groupedByRel[relKey].length + ')</div>';
            groupedByRel[relKey].forEach(function(n){
                html += '<div class="pp-finance-item" style="margin-bottom:8px;">' +
                    '<div class="pp-finance-item-icon" style="border-radius:50%; background:#111; color:#fff;">' + (n.name || '?').charAt(0) + '</div>' +
                    '<div class="pp-finance-item-info">' +
                        '<div class="pp-finance-item-title">' + escapeHtml(n.name) + '</div>' +
                        '<div class="pp-finance-item-sub">' + escapeHtml(n.tier || '新人') + (n.specialty ? ' · ' + escapeHtml(n.specialty) : '') + '</div>' +
                    '</div>' +
                    '<div style="font-size:11px; color:#999;">好感 ' + (n.friendliness || 50) + '</div>' +
                '</div>';
            });
        });
    }
    html += '</div>';
    container.innerHTML = html;
}

// ---------- 在粉丝送礼处注入财务记录（通过monkey-patch原ppFanAction） ----------
(function(){
    var _origFanAction = window.ppFanAction;
    if (typeof _origFanAction === 'function') {
        window.ppFanAction = function(action, fanName){
            if (action === 'gift') {
                ppRecordFinance('expense', 100, '送礼', '给粉丝「' + fanName + '」送礼');
            }
            return _origFanAction.apply(this, arguments);
        };
    }
})();

// =====================================================================
// ---------- [P2] 粉丝应援/打榜事件系统 ----------
// 每日自动生成1个应援活动，玩家可选择参与获得粉丝增长+回忆录记录
// =====================================================================

var SUPPORT_EVENT_TEMPLATES = [
    { type: 'birthday', title: '{name}生日应援', icon: 'fa-birthday-cake', desc: '粉丝自发组织应援活动，为你庆祝生日', reward: { fans: 2000, money: 0, love: 10 }, cost: { time: 2, money: 500 }, flavor: '粉丝包下了地铁站广告位，给你刷满了应援海报！' },
    { type: 'ranking', title: '打榜冲#1', icon: 'fa-chart-line', desc: '新作品上线，粉丝发起打榜活动冲榜', reward: { fans: 1500, money: 200, love: 8 }, cost: { time: 3, money: 0 }, flavor: '数据组全员加班打榜，新作登上榜首！' },
    { type: 'antiblack', title: '反黑行动', icon: 'fa-shield-alt', desc: '出现黑子恶意攻击，反黑组紧急集结', reward: { fans: 800, money: 0, love: 15 }, cost: { time: 1, money: 0 }, flavor: '反黑组连夜举报控评，舆论迅速扭转！' },
    { type: 'charity', title: '粉丝公益', icon: 'fa-hands-helping', desc: '以你名义发起的公益捐款活动', reward: { fans: 3000, money: -1000, love: 20 }, cost: { time: 2, money: 1000 }, flavor: '以你的名义捐赠了希望小学，感动众人！' },
    { type: 'album', title: '应援打榜周', icon: 'fa-music', desc: '音乐平台数据大战，冲击年度榜单', reward: { fans: 2500, money: 500, love: 12 }, cost: { time: 4, money: 300 }, flavor: '粉丝集体购买专辑打榜，数据亮眼！' },
    { type: 'meeting', title: '粉丝见面会', icon: 'fa-heart', desc: '组织小规模粉丝见面会，近距离互动', reward: { fans: 1200, money: -500, love: 25 }, cost: { time: 3, money: 500 }, flavor: '见面会现场粉丝们哭着拥抱，暖到不行！' },
    { type: 'support_package', title: '后援会应援', icon: 'fa-gift', desc: '后援会为你的新剧准备了应援物资', reward: { fans: 1000, money: 0, love: 18 }, cost: { time: 1, money: 0 }, flavor: '后援会送来了冬日暖心应援便当和暖宝宝！' },
    { type: 'trend', title: '控评冲热搜', icon: 'fa-fire', desc: '积极话题发酵中，需要粉丝控评冲搜', reward: { fans: 1800, money: 100, love: 10 }, cost: { time: 2, money: 0 }, flavor: '话题冲上热搜前三，好评如潮！' },
    { type: 'data_war', title: '专辑数据战', icon: 'fa-crown', desc: '新专辑首日销量争夺，粉丝开启冲刺模式', reward: { fans: 2200, money: 800, love: 14 }, cost: { time: 3, money: 200 }, flavor: '首日销量破百万，粉丝举旗欢呼！' },
    { type: 'fanclub', title: '后援会周年', icon: 'fa-users', desc: '后援会成立周年纪念，粉丝自发庆祝', reward: { fans: 500, money: 0, love: 30 }, cost: { time: 1, money: 0 }, flavor: '后援会用你所有作品剪了一条周年vlog，太戳了！' }
];

// 生成/刷新今日应援
window.ppEnsureDailySupport = function(){
    var d = store.paopao;
    if (!d.supportEvents) d.supportEvents = { today: null, history: [] };
    var now = Date.now();
    var today = new Date(); today.setHours(0,0,0,0);

    // 已有今日事件且未过期
    if (d.supportEvents.today && d.supportEvents.today.date >= today.getTime()) {
        return d.supportEvents.today;
    }

    // 生成今日应援（只有达到出道粉丝量才触发）
    if ((d.fans || 0) < 3000) return null;

    var tpl = SUPPORT_EVENT_TEMPLATES[Math.floor(Math.random() * SUPPORT_EVENT_TEMPLATES.length)];
    var evt = {
        id: 'sup_' + now,
        type: tpl.type,
        title: tpl.title.replace('{name}', d.stageName || '你'),
        icon: tpl.icon,
        desc: tpl.desc,
        flavor: tpl.flavor,
        reward: Object.assign({}, tpl.reward),
        cost: Object.assign({}, tpl.cost),
        date: now,
        status: 'pending' // pending | joined | ignored
    };
    d.supportEvents.today = evt;
    save();
    return evt;
};

// 响应应援
window.ppJoinSupport = function(){
    var d = store.paopao;
    var evt = d.supportEvents && d.supportEvents.today;
    if (!evt || evt.status !== 'pending') return;

    var costMoney = evt.cost.money || 0;
    if (costMoney > 0 && (d.money || 0) < costMoney) {
        showPpResult('资金不足', '参与此次应援需要 ¥' + formatFans(costMoney) + '，当前资产不足。', false);
        return;
    }

    // 扣除成本
    if (costMoney > 0) {
        d.money = Math.max(0, d.money - costMoney);
        ppRecordFinance('expense', costMoney, '应援', evt.title);
    }

    // 应用奖励
    var reward = evt.reward;
    if (reward.fans > 0) d.fans = Math.max(0, d.fans + reward.fans);
    if (reward.money > 0) {
        d.money += reward.money;
        ppRecordFinance('income', reward.money, '应援', evt.title);
    } else if (reward.money < 0) {
        d.money = Math.max(0, d.money + reward.money);
        ppRecordFinance('expense', -reward.money, '应援', evt.title);
    }
    // 提升所有粉丝的忠诚度和档案
    if (reward.love > 0 && d.fanProfiles) {
        Object.keys(d.fanProfiles).forEach(function(k){
            var p = d.fanProfiles[k];
            if (p.isBlackFan) return;
            p.loyalty = Math.min(100, (p.loyalty || 0) + Math.floor(reward.love / 2));
            p.stats = p.stats || {};
            p.stats.dataWork = (p.stats.dataWork || 0) + 3;
        });
    }

    evt.status = 'joined';
    evt.joinedAt = Date.now();

    if (!d.supportEvents.history) d.supportEvents.history = [];
    d.supportEvents.history.unshift(evt);
    if (d.supportEvents.history.length > 30) d.supportEvents.history = d.supportEvents.history.slice(0, 30);

    // 加入回忆录（通过 eventHistory）
    if (!d.eventHistory) d.eventHistory = [];
    d.eventHistory.push({
        title: '💝 ' + evt.title,
        desc: evt.flavor,
        date: Date.now()
    });

    save();

    // 显示结果弹窗
    var rewardLines = [];
    if (reward.fans > 0) rewardLines.push('粉丝 +' + formatFans(reward.fans));
    if (reward.money > 0) rewardLines.push('收入 +¥' + formatFans(reward.money));
    if (reward.money < 0) rewardLines.push('支出 ¥' + formatFans(-reward.money));
    if (reward.love > 0) rewardLines.push('粉丝忠诚度 +' + reward.love);

    showPpResult('💝 应援成功', evt.flavor + '\n\n' + rewardLines.join(' · '), true);
    ppRenderTab();
};

// 忽略应援
window.ppIgnoreSupport = function(){
    var d = store.paopao;
    var evt = d.supportEvents && d.supportEvents.today;
    if (!evt) return;
    evt.status = 'ignored';
    save();
    ppRenderTab();
};

// 在消息列表顶部插入应援卡片（通过 patch ppRenderMessageList 后置注入）
(function(){
    var origRender = window.ppRenderMessageList || null;
})();

// 渲染今日应援卡片HTML（供ppRenderMessageList调用）
window.ppGetSupportCardHtml = function(){
    var evt = ppEnsureDailySupport();
    if (!evt || evt.status === 'ignored') return '';
    if (evt.status === 'joined') {
        return '<div style="margin:8px 12px 0; padding:12px 14px; background:#fff; border-radius:16px; border:1px solid rgba(0,0,0,0.06); box-shadow:0 2px 10px rgba(0,0,0,0.04); display:flex; align-items:center; gap:12px;">' +
            '<div style="width:36px; height:36px; background:#111; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center;"><i class="fas fa-check"></i></div>' +
            '<div style="flex:1;">' +
                '<div style="font-size:13px; color:#111; font-weight:600;">今日应援已完成</div>' +
                '<div style="font-size:11px; color:#999; margin-top:2px;">' + escapeHtml(evt.title) + '</div>' +
            '</div>' +
        '</div>';
    }
    // pending
    var rewardText = [];
    if (evt.reward.fans > 0) rewardText.push('+' + formatFans(evt.reward.fans) + '粉');
    if (evt.reward.money > 0) rewardText.push('+¥' + formatFans(evt.reward.money));
    if (evt.reward.love > 0) rewardText.push('♥' + evt.reward.love);
    var costText = evt.cost.money > 0 ? '成本 ¥' + formatFans(evt.cost.money) : '免费参与';

    return '<div style="margin:8px 12px 0; padding:14px; background:#111; color:#fff; border-radius:18px; box-shadow:0 4px 16px rgba(0,0,0,0.12); position:relative; overflow:hidden;">' +
        '<div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">' +
            '<i class="fas ' + evt.icon + '" style="font-size:16px;"></i>' +
            '<div style="font-size:13px; font-weight:600; flex:1;">今日应援 · ' + escapeHtml(evt.title) + '</div>' +
            '<div style="font-size:10px; opacity:0.7; padding:2px 8px; background:rgba(255,255,255,0.15); border-radius:999px;">限时</div>' +
        '</div>' +
        '<div style="font-size:12px; opacity:0.85; line-height:1.5; margin-bottom:10px;">' + escapeHtml(evt.desc) + '</div>' +
        '<div style="font-size:11px; opacity:0.75; margin-bottom:12px;">奖励 ' + rewardText.join(' · ') + ' · ' + costText + '</div>' +
        '<div style="display:flex; gap:8px;">' +
            '<button onclick="ppJoinSupport()" style="flex:1; padding:9px; background:#fff; color:#111; border:none; border-radius:999px; font-size:13px; font-weight:600; cursor:pointer;">立即参与</button>' +
            '<button onclick="ppIgnoreSupport()" style="padding:9px 16px; background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.3); border-radius:999px; font-size:12px; cursor:pointer;">忽略</button>' +
        '</div>' +
    '</div>';
};

// ---------- 将应援卡片注入到消息列表（通过DOM post-hook） ----------
(function(){
    var _origRenderMsg = window.ppRenderMessageList;
    // 由于 ppRenderMessageList 是局部函数不在 window 上，改用 MutationObserver 注入
    // 每次 pp-msg-list 被渲染时，在前面插入应援卡片
    var injectTimer = null;
    function tryInject(){
        var list = document.querySelector('.pp-msg-list-page .pp-msg-list');
        if (!list) return;
        if (list.querySelector('.pp-support-injected')) return;
        // 如果有搜索激活或特别关心模式，不注入
        if (window._ppMsgSearchOpen || (window.ppShowSpecialOnly === true)) return;
        var html = window.ppGetSupportCardHtml ? ppGetSupportCardHtml() : '';
        if (!html) return;
        var wrap = document.createElement('div');
        wrap.className = 'pp-support-injected';
        wrap.innerHTML = html;
        list.parentNode.insertBefore(wrap, list);
    }
    // 监听 pp-tab-content 变化
    var obs = new MutationObserver(function(){
        clearTimeout(injectTimer);
        injectTimer = setTimeout(tryInject, 30);
    });
    setTimeout(function(){
        var tab = document.getElementById('pp-tab-content');
        if (tab) obs.observe(tab, { childList: true, subtree: true });
    }, 1500);
})();

})();
