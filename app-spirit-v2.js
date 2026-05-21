// ========== 精灵养成系统 V2 - 全面升级 ==========
// 覆盖 app-extras.js 中的精灵系统，新增：行动点、三人群聊、性格6维度、
// 礼物系统、月度剧情、精灵日记、成长阶段、上学考试、亲密度、
// 生病治疗、情绪状态、节日事件、成就系统

(function(){
    'use strict';

    // ============================
    // 精灵类型定义（复用原有）
    // ============================
    const SPIRIT_TYPES = [
        { id: 'fox', name: '狐狸精灵', gif: 'https://image.uglycat.cc/dnjw6y.gif', desc: '聪明的狐狸精灵，机智灵活' },
        { id: 'bunny', name: '兔兔精灵', gif: 'https://image.uglycat.cc/frwqyn.gif', desc: '温柔的兔子精灵，善良可爱' },
        { id: 'hamster', name: '仓鼠精灵', gif: 'https://image.uglycat.cc/n3ljuy.gif', desc: '小巧的仓鼠精灵，超级可爱' },
        { id: 'whitecat', name: '白猫精灵', gif: 'https://image.uglycat.cc/tj02nd.gif', desc: '优雅的白猫精灵，温柔高贵' },
        { id: 'orangecat', name: '橘猫精灵', gif: 'https://image.uglycat.cc/kw2ceg.gif', desc: '慵懒的橘猫精灵，贪吃可爱' },
        { id: 'dog', name: '小狗精灵', gif: 'https://image.uglycat.cc/nqyp08.gif', desc: '忠诚的小狗精灵，活力满满' }
    ];

    function getSpiritImg(type, size) {
        size = size || 60;
        return '<img src="' + type.gif + '" alt="' + type.name + '" style="width:' + size + 'px;height:' + size + 'px;object-fit:contain;image-rendering:auto;" draggable="false">';
    }

    // ============================
    // 礼物库定义
    // ============================
    const SPIRIT_GIFTS = [
        // 食物类
        { id: 'cake', name: '小蛋糕', icon: '🎂', category: 'food', effect: { hunger: 15, mood: 10 }, desc: '甜甜的蛋糕' },
        { id: 'candy', name: '糖果', icon: '🍬', category: 'food', effect: { hunger: 5, mood: 15 }, desc: '五颜六色的糖果' },
        { id: 'milk', name: '牛奶', icon: '🥛', category: 'food', effect: { hunger: 10, health: 5 }, desc: '营养满满的牛奶' },
        { id: 'fruit', name: '水果拼盘', icon: '🍓', category: 'food', effect: { hunger: 10, health: 10 }, desc: '新鲜的水果' },
        { id: 'icecream', name: '冰淇淋', icon: '🍦', category: 'food', effect: { hunger: 5, mood: 20 }, desc: '凉爽的冰淇淋' },
        { id: 'bento', name: '爱心便当', icon: '🍱', category: 'food', effect: { hunger: 25, mood: 10, health: 5 }, desc: '用心做的便当' },
        { id: 'cookie', name: '小饼干', icon: '🍪', category: 'food', effect: { hunger: 8, mood: 8 }, desc: '香脆的饼干' },
        { id: 'chocolate', name: '巧克力', icon: '🍫', category: 'food', effect: { hunger: 5, mood: 18 }, desc: '甜蜜的巧克力' },
        // 玩具类
        { id: 'teddy', name: '泰迪熊', icon: '🧸', category: 'toy', effect: { mood: 20 }, desc: '软绵绵的泰迪熊' },
        { id: 'ball', name: '小皮球', icon: '⚽', category: 'toy', effect: { mood: 10, stamina: 5 }, desc: '一起踢球玩' },
        { id: 'puzzle', name: '拼图', icon: '🧩', category: 'toy', effect: { wisdom: 10, mood: 5 }, desc: '锻炼脑力' },
        { id: 'kite', name: '风筝', icon: '🪁', category: 'toy', effect: { mood: 15, stamina: 5 }, desc: '一起去放风筝' },
        { id: 'blocks', name: '积木', icon: '🏗️', category: 'toy', effect: { wisdom: 15 }, desc: '拼出各种形状' },
        { id: 'doll', name: '布偶', icon: '🪆', category: 'toy', effect: { mood: 12 }, desc: '可爱的小布偶' },
        // 学习类
        { id: 'book', name: '绘本故事', icon: '📖', category: 'study', effect: { wisdom: 15, mood: 5 }, desc: '有趣的故事书' },
        { id: 'crayons', name: '彩色画笔', icon: '🖍️', category: 'study', effect: { wisdom: 10, mood: 10 }, desc: '画出心中的世界' },
        { id: 'globe', name: '小地球仪', icon: '🌍', category: 'study', effect: { wisdom: 20 }, desc: '了解世界的窗口' },
        { id: 'telescope', name: '望远镜', icon: '🔭', category: 'study', effect: { wisdom: 15, mood: 10 }, desc: '看看星星和远方' },
        { id: 'piano', name: '小钢琴', icon: '🎹', category: 'study', effect: { wisdom: 12, mood: 12 }, desc: '叮叮咚咚的旋律' },
        // 穿戴类
        { id: 'scarf', name: '小围巾', icon: '🧣', category: 'wear', effect: { health: 10, mood: 5 }, desc: '暖暖的围巾' },
        { id: 'hat', name: '可爱帽子', icon: '🧢', category: 'wear', effect: { mood: 10 }, desc: '戴上更可爱了' },
        { id: 'ribbon', name: '蝴蝶结', icon: '🎀', category: 'wear', effect: { mood: 15 }, desc: '漂亮的蝴蝶结' },
        // 特殊类
        { id: 'letter', name: '手写信', icon: '💌', category: 'special', effect: { mood: 25 }, desc: '写满爱意的信' },
        { id: 'photo', name: '全家福', icon: '📸', category: 'special', effect: { mood: 30 }, desc: '最珍贵的宝贝' },
        { id: 'flower', name: '小花束', icon: '💐', category: 'special', effect: { mood: 15, health: 5 }, desc: '香香的花' },
        { id: 'star', name: '许愿星', icon: '⭐', category: 'special', effect: { mood: 20, wisdom: 5 }, desc: '承载愿望的星星' }
    ];

    // ============================
    // 月度剧情库
    // ============================
    const MONTHLY_STORIES = {
        baby: [
            {
                title: "🦋 窗边的蝴蝶",
                desc: "一只蝴蝶停在窗台上，{name}目不转睛地盯着它看...",
                choices: [
                    { text: "🤲 引导精灵轻轻碰触", personality: { bravery: 5, kindness: 3 }, effect: { mood: 10 } },
                    { text: "📸 记录下这个瞬间", personality: { intelligence: 3 }, effect: { mood: 5 } },
                    { text: "🪟 打开窗户让蝴蝶飞走", personality: { kindness: 5 }, effect: { mood: 5, wisdom: 3 } }
                ]
            },
            {
                title: "🌧️ 打雷的夜晚",
                desc: "外面电闪雷鸣，{name}被吓到了，眼眶泛红...",
                choices: [
                    { text: "🤗 紧紧抱住精灵", personality: { kindness: 5 }, effect: { mood: 15 } },
                    { text: "🔦 用手电筒做影子游戏", personality: { intelligence: 5 }, effect: { mood: 10, wisdom: 5 } },
                    { text: "💪 告诉精灵'打雷不可怕'", personality: { bravery: 8 }, effect: { mood: 5 } }
                ]
            },
            {
                title: "🍼 半夜哭闹",
                desc: "{name}半夜突然大哭起来，怎么哄都不停...",
                choices: [
                    { text: "🎵 唱一首摇篮曲", personality: { kindness: 5, energy: -3 }, effect: { mood: 15, health: 5 } },
                    { text: "🍼 检查是不是饿了", personality: { intelligence: 3 }, effect: { hunger: 15, mood: 10 } },
                    { text: "🚶 抱着散步等它自己平静", personality: { independence: 5 }, effect: { mood: 8 } }
                ]
            },
            {
                title: "😊 第一次微笑",
                desc: "你对着{name}做鬼脸，突然...它笑了！第一次真正的微笑！",
                choices: [
                    { text: "😆 继续做更多鬼脸", personality: { extroversion: 5, energy: 3 }, effect: { mood: 20 } },
                    { text: "🤗 温柔地亲亲额头", personality: { kindness: 5 }, effect: { mood: 15, health: 3 } },
                    { text: "📱 赶紧录像记录", personality: { intelligence: 3 }, effect: { mood: 10 } }
                ]
            },
            {
                title: "🧸 认生了",
                desc: "有客人来访，{name}看到陌生人就往你怀里钻...",
                choices: [
                    { text: "🤝 鼓励它打个招呼", personality: { extroversion: 5, bravery: 3 }, effect: { mood: -5 } },
                    { text: "🤗 抱着它慢慢适应", personality: { kindness: 3 }, effect: { mood: 5 } },
                    { text: "🏠 让客人先走，不勉强", personality: { independence: -3 }, effect: { mood: 10 } }
                ]
            },
            {
                title: "🚶 第一步",
                desc: "{name}扶着桌子站了起来，摇摇晃晃地...迈出了第一步！",
                choices: [
                    { text: "👏 大声鼓掌欢呼", personality: { extroversion: 3, bravery: 3 }, effect: { mood: 20, stamina: 5 } },
                    { text: "🤲 张开双臂接住", personality: { kindness: 5 }, effect: { mood: 15 } },
                    { text: "📹 录像留念", personality: { intelligence: 3 }, effect: { mood: 10 } }
                ]
            },
            {
                title: "🗣️ 第一个词",
                desc: "{name}含糊不清地发出了声音...好像在说一个词！",
                choices: [
                    { text: "反复教它叫'主人'", personality: { extroversion: 3 }, effect: { mood: 15, wisdom: 5 } },
                    { text: "耐心等它自己说清楚", personality: { independence: 5 }, effect: { wisdom: 8 } },
                    { text: "开心地回应不管它说什么", personality: { kindness: 5, energy: 3 }, effect: { mood: 20 } }
                ]
            },
            {
                title: "🎨 到处涂鸦",
                desc: "{name}拿到了一支笔，把墙上画得到处都是...",
                choices: [
                    { text: "😡 批评并收走画笔", personality: { bravery: -3, independence: -3 }, effect: { mood: -10 } },
                    { text: "📝 给它专门的画纸", personality: { intelligence: 5, kindness: 3 }, effect: { mood: 10, wisdom: 8 } },
                    { text: "🎨 陪它一起画", personality: { energy: 5 }, effect: { mood: 15, wisdom: 5 } }
                ]
            }
        ],
        toddler: [
            {
                title: "🐕 遇到小狗",
                desc: "散步时遇到一只小狗，{name}又害怕又好奇...",
                choices: [
                    { text: "🤝 鼓励精灵摸摸小狗", personality: { bravery: 8, extroversion: 3 }, effect: { mood: 10 } },
                    { text: "🏃 带精灵绕道走", personality: { bravery: -3 }, effect: { mood: 5 } },
                    { text: "📖 给精灵讲小狗的知识", personality: { intelligence: 5, bravery: 3 }, effect: { wisdom: 10 } }
                ]
            },
            {
                title: "🍪 偷吃饼干",
                desc: "你发现{name}偷偷爬上椅子想拿柜子上的饼干...",
                choices: [
                    { text: "😤 严厉批评", personality: { independence: -3, bravery: -3 }, effect: { mood: -10 } },
                    { text: "😊 帮它拿，但约定下次要说", personality: { kindness: 5, independence: 3 }, effect: { mood: 10 } },
                    { text: "🤔 假装没看到", personality: { independence: 8 }, effect: { mood: 5, hunger: 10 } }
                ]
            },
            {
                title: "😢 和小朋友吵架",
                desc: "{name}在外面和其他小朋友发生了争执，哭着回来了...",
                choices: [
                    { text: "🤗 先安慰，再了解原因", personality: { kindness: 5 }, effect: { mood: 10 } },
                    { text: "💪 教它下次要勇敢", personality: { bravery: 8, independence: 3 }, effect: { mood: 5 } },
                    { text: "🤝 带它去和好", personality: { extroversion: 5, kindness: 3 }, effect: { mood: 8 } }
                ]
            },
            {
                title: "🎭 幼儿园表演",
                desc: "幼儿园要办表演会，{name}被选中上台表演...",
                choices: [
                    { text: "🎤 每天陪它练习", personality: { bravery: 5, extroversion: 5 }, effect: { wisdom: 10, mood: 5 } },
                    { text: "😅 告诉老师它可能紧张", personality: { bravery: -3 }, effect: { mood: 5 } },
                    { text: "🎉 告诉它这是展示自己的好机会", personality: { extroversion: 8, bravery: 3 }, effect: { mood: 10 } }
                ]
            },
            {
                title: "🧹 主动帮忙做家务",
                desc: "{name}看到你在打扫卫生，拿起了小扫把想帮忙...",
                choices: [
                    { text: "👍 表扬并一起做", personality: { kindness: 5, independence: 5 }, effect: { mood: 15, stamina: -5 } },
                    { text: "😊 说不用帮，去玩吧", personality: { independence: -3 }, effect: { mood: 5 } },
                    { text: "📸 拍下来发朋友圈", personality: { extroversion: 3 }, effect: { mood: 10 } }
                ]
            },
            {
                title: "💤 不想睡觉",
                desc: "到了睡觉时间，{name}怎么也不肯上床...",
                choices: [
                    { text: "📖 讲个睡前故事", personality: { intelligence: 5, kindness: 3 }, effect: { wisdom: 5, mood: 10 } },
                    { text: "😤 严格要求必须睡", personality: { independence: -3, bravery: -2 }, effect: { mood: -5, health: 5 } },
                    { text: "🌙 一起看星星，等困了再睡", personality: { kindness: 5, energy: 3 }, effect: { mood: 15, wisdom: 3 } }
                ]
            },
            {
                title: "🎂 生日愿望",
                desc: "今天是{name}的生日，它闭着眼睛许愿...",
                choices: [
                    { text: "🎁 送一份特别的礼物", personality: { kindness: 5 }, effect: { mood: 25 } },
                    { text: "🎉 办一个小派对", personality: { extroversion: 5, energy: 3 }, effect: { mood: 20 } },
                    { text: "💕 写一封爱的信给它", personality: { kindness: 8 }, effect: { mood: 20, wisdom: 3 } }
                ]
            }
        ],
        school: [
            {
                title: "😢 被同学嘲笑",
                desc: "{name}回家后情绪低落，被同学嘲笑了...",
                choices: [
                    { text: "🤗 安慰并教它面对", personality: { bravery: 5, kindness: 3 }, effect: { mood: 10 } },
                    { text: "😡 去找老师理论", personality: { independence: -3 }, effect: { mood: 15 } },
                    { text: "💪 教精灵自己解决", personality: { bravery: 8, independence: 5 }, effect: { mood: 5 } }
                ]
            },
            {
                title: "📝 第一次考试",
                desc: "{name}明天要考试了，有点紧张...",
                choices: [
                    { text: "📚 陪它复习到很晚", personality: { intelligence: 5 }, effect: { wisdom: 10, stamina: -10 } },
                    { text: "😊 说考什么样都没关系", personality: { kindness: 5, independence: 3 }, effect: { mood: 10 } },
                    { text: "🎮 先玩一会再复习", personality: { energy: 5 }, effect: { mood: 10, wisdom: 3 } }
                ]
            },
            {
                title: "🏆 当班长",
                desc: "老师提名{name}当班长，它有点犹豫...",
                choices: [
                    { text: "👍 鼓励它试试", personality: { bravery: 8, extroversion: 5 }, effect: { mood: 10, wisdom: 5 } },
                    { text: "🤔 让它自己决定", personality: { independence: 8 }, effect: { mood: 5 } },
                    { text: "😅 建议不当，太辛苦了", personality: { bravery: -3 }, effect: { mood: 5 } }
                ]
            },
            {
                title: "🤥 说谎了",
                desc: "你发现{name}对你撒了一个小谎...",
                choices: [
                    { text: "😊 温和地问为什么", personality: { kindness: 5, intelligence: 3 }, effect: { mood: 5, wisdom: 5 } },
                    { text: "😤 严肃地批评", personality: { bravery: -3, kindness: -3 }, effect: { mood: -15 } },
                    { text: "📖 讲一个关于诚实的故事", personality: { kindness: 5, intelligence: 5 }, effect: { wisdom: 10, mood: 5 } }
                ]
            },
            {
                title: "🎨 发现新爱好",
                desc: "{name}突然对画画特别感兴趣，画了一整天...",
                choices: [
                    { text: "🖍️ 买更好的画材", personality: { independence: 3, intelligence: 3 }, effect: { mood: 15, wisdom: 5 } },
                    { text: "📚 报一个绘画班", personality: { intelligence: 5 }, effect: { wisdom: 10, stamina: -5 } },
                    { text: "😊 把画裱起来挂墙上", personality: { kindness: 5, extroversion: 3 }, effect: { mood: 20 } }
                ]
            },
            {
                title: "👫 交到好朋友",
                desc: "{name}兴奋地告诉你在学校交到了一个好朋友！",
                choices: [
                    { text: "🏠 邀请朋友来家里玩", personality: { extroversion: 5, kindness: 3 }, effect: { mood: 15 } },
                    { text: "😊 问问朋友是什么样的", personality: { intelligence: 3 }, effect: { mood: 10 } },
                    { text: "🎁 准备小礼物让它送朋友", personality: { kindness: 8 }, effect: { mood: 15 } }
                ]
            },
            {
                title: "📱 想要手机",
                desc: "{name}看到同学有手机，也想要一部...",
                choices: [
                    { text: "📱 买一部但定规则", personality: { independence: 5 }, effect: { mood: 20 } },
                    { text: "❌ 拒绝，说等大一点", personality: { independence: 3, bravery: -2 }, effect: { mood: -15 } },
                    { text: "🤝 用好成绩来换", personality: { intelligence: 5, independence: 3 }, effect: { mood: 5, wisdom: 5 } }
                ]
            }
        ],
        teen: [
            {
                title: "💢 叛逆期来了",
                desc: "{name}最近顶嘴越来越多，今天又发脾气了...",
                choices: [
                    { text: "🤗 耐心沟通", personality: { kindness: 5 }, effect: { mood: 10 } },
                    { text: "😤 以牙还牙", personality: { bravery: -5, kindness: -5 }, effect: { mood: -20 } },
                    { text: "🚪 给它空间冷静", personality: { independence: 8 }, effect: { mood: 5 } }
                ]
            },
            {
                title: "💕 好像有喜欢的人了",
                desc: "你发现{name}最近总是心不在焉，对着手机傻笑...",
                choices: [
                    { text: "😊 主动问问，表示支持", personality: { extroversion: 5, kindness: 3 }, effect: { mood: 15 } },
                    { text: "😤 严肃谈话，以学业为重", personality: { independence: -3 }, effect: { mood: -10, wisdom: 5 } },
                    { text: "🙈 假装不知道", personality: { independence: 5 }, effect: { mood: 5 } }
                ]
            },
            {
                title: "🎸 想组乐队",
                desc: "{name}说想和朋友们组一个乐队...",
                choices: [
                    { text: "🎵 支持并帮它找排练场地", personality: { extroversion: 5, energy: 5 }, effect: { mood: 20 } },
                    { text: "📚 让它先把成绩搞好", personality: { intelligence: 3, independence: -3 }, effect: { mood: -10, wisdom: 5 } },
                    { text: "🎹 建议先学好一样乐器", personality: { intelligence: 5, independence: 3 }, effect: { wisdom: 10, mood: 5 } }
                ]
            },
            {
                title: "🏋️ 想健身/减肥",
                desc: "{name}对自己的外表有了在意，想开始锻炼...",
                choices: [
                    { text: "💪 一起锻炼", personality: { bravery: 3, energy: 5 }, effect: { stamina: 15, mood: 10 } },
                    { text: "😊 告诉它现在就很好", personality: { kindness: 5 }, effect: { mood: 10 } },
                    { text: "📋 帮它制定计划", personality: { intelligence: 5, independence: 3 }, effect: { stamina: 10, wisdom: 5 } }
                ]
            },
            {
                title: "🎓 升学压力",
                desc: "大考临近，{name}压力很大，晚上经常失眠...",
                choices: [
                    { text: "🤗 减轻压力，健康第一", personality: { kindness: 5 }, effect: { mood: 15, health: 5 } },
                    { text: "📚 请家教补课", personality: { intelligence: 5 }, effect: { wisdom: 15, stamina: -10 } },
                    { text: "🎮 考前放松一下", personality: { energy: 5 }, effect: { mood: 10 } }
                ]
            },
            {
                title: "🌍 想去旅行",
                desc: "{name}想和朋友去旅行，第一次离开家...",
                choices: [
                    { text: "✈️ 同意并帮它准备", personality: { independence: 8, bravery: 5 }, effect: { mood: 20 } },
                    { text: "😰 不放心，要一起去", personality: { independence: -5, kindness: 3 }, effect: { mood: 5 } },
                    { text: "📱 同意但要每天报平安", personality: { independence: 5, kindness: 3 }, effect: { mood: 15 } }
                ]
            }
        ],
        adult: [
            {
                title: "🎓 毕业了",
                desc: "{name}终于毕业了！站在校门口，它看起来既开心又有点迷茫...",
                choices: [
                    { text: "🤗 说不管怎样都支持它", personality: { kindness: 5, independence: 3 }, effect: { mood: 20 } },
                    { text: "💼 帮它投简历", personality: { intelligence: 3 }, effect: { wisdom: 10, mood: 5 } },
                    { text: "🎉 先好好庆祝一下", personality: { energy: 5, extroversion: 3 }, effect: { mood: 25 } }
                ]
            },
            {
                title: "💼 第一份工作",
                desc: "{name}收到了第一份工作offer！但有点紧张...",
                choices: [
                    { text: "👔 帮它准备面试", personality: { intelligence: 5, bravery: 3 }, effect: { wisdom: 10, mood: 10 } },
                    { text: "😊 说相信它一定行", personality: { kindness: 5, bravery: 5 }, effect: { mood: 15 } },
                    { text: "📝 分享自己的工作经验", personality: { intelligence: 3 }, effect: { wisdom: 10, mood: 5 } }
                ]
            },
            {
                title: "💕 想谈恋爱了",
                desc: "{name}向你坦白说有喜欢的人，想征求你的意见...",
                choices: [
                    { text: "😊 开心地支持", personality: { extroversion: 5, kindness: 5 }, effect: { mood: 20 } },
                    { text: "🤔 问问对方的情况", personality: { intelligence: 5, kindness: 3 }, effect: { mood: 10 } },
                    { text: "💕 分享恋爱建议", personality: { kindness: 5, extroversion: 3 }, effect: { wisdom: 5, mood: 15 } }
                ]
            },
            {
                title: "🏠 搬出去住",
                desc: "{name}提出想搬出去独立生活，说想要有自己的空间...",
                choices: [
                    { text: "🏠 帮它找房子", personality: { kindness: 5, independence: 5 }, effect: { mood: 15 } },
                    { text: "😢 舍不得但支持", personality: { kindness: 8 }, effect: { mood: 10 } },
                    { text: "📋 教它管理生活", personality: { intelligence: 5, independence: 3 }, effect: { wisdom: 10, mood: 5 } }
                ]
            },
            {
                title: "💔 失恋了",
                desc: "{name}回来红着眼睛不说话，你猜到发生了什么...",
                choices: [
                    { text: "🤗 默默抱住它", personality: { kindness: 8 }, effect: { mood: 15 } },
                    { text: "🍦 带它吃好吃的", personality: { energy: 3, kindness: 3 }, effect: { mood: 10, hunger: 10 } },
                    { text: "💪 告诉它会遇到更好的", personality: { bravery: 5, independence: 3 }, effect: { mood: 5, wisdom: 5 } }
                ]
            },
            {
                title: "🌍 想出国深造",
                desc: "{name}拿到了出国留学的机会，又期待又不舍...",
                choices: [
                    { text: "✈️ 全力支持出去看看", personality: { independence: 8, bravery: 5 }, effect: { mood: 15, wisdom: 10 } },
                    { text: "🤗 说会一直等你回来", personality: { kindness: 8 }, effect: { mood: 20 } },
                    { text: "📱 约定每天视频通话", personality: { kindness: 5, extroversion: 3 }, effect: { mood: 15 } }
                ]
            },
            {
                title: "🎂 给你过生日",
                desc: "{name}偷偷准备了一个月，给你办了一场惊喜生日会...",
                choices: [
                    { text: "😭 感动到哭了", personality: { kindness: 5 }, effect: { mood: 25 } },
                    { text: "🤗 紧紧抱住它", personality: { kindness: 5, extroversion: 3 }, effect: { mood: 20 } },
                    { text: "📸 一起拍合照纪念", personality: { extroversion: 3 }, effect: { mood: 15 } }
                ]
            },
            {
                title: "📝 写了一封信给你",
                desc: "{name}在你枕头下面放了一封长长的信，写满了感恩...",
                choices: [
                    { text: "😭 读完泪流满面", personality: { kindness: 5 }, effect: { mood: 30 } },
                    { text: "✍️ 写一封回信", personality: { kindness: 8, intelligence: 3 }, effect: { mood: 20, wisdom: 5 } },
                    { text: "🤗 找到它抱住", personality: { kindness: 5, extroversion: 3 }, effect: { mood: 25 } }
                ]
            }
        ]
    };

    // ============================
    // 学校事件预设
    // ============================
    const SCHOOL_EVENTS = [
        { text: "{name}今天在课堂上主动举手回答了老师的问题", req: { extroversion: 55 } },
        { text: "{name}课间和同学一起跳绳，跳了好多下", req: { energy: 50 } },
        { text: "{name}把自己的零食分给了忘带午餐的同学", req: { kindness: 60 } },
        { text: "{name}今天安安静静地在角落看了一本书", req: { extroversionMax: 40 } },
        { text: "{name}帮老师擦了黑板，获得了一朵小红花", req: { kindness: 50 } },
        { text: "{name}在体育课上跑了第一名！", req: { energy: 65 } },
        { text: "{name}美术课画了一幅全家人的画，老师说很棒", req: { kindness: 45 } },
        { text: "{name}数学课上第一个解出了难题", req: { intelligence: 60 } },
        { text: "{name}和同桌交换了贴纸，成了好朋友", req: { extroversion: 50, kindness: 45 } },
        { text: "{name}今天在学校哭了一场，因为最喜欢的橡皮丢了", req: { extroversionMax: 45 } },
        { text: "{name}午休时给同学讲故事，大家都听得很入迷", req: { extroversion: 60, intelligence: 50 } },
        { text: "{name}被老师表扬作业写得很认真", req: { intelligence: 50 } },
        { text: "{name}今天当了一天的值日生，打扫得很干净", req: { kindness: 55 } },
        { text: "{name}和同学一起做了科学实验，成功了！", req: { intelligence: 55, bravery: 45 } },
        { text: "{name}在音乐课上唱歌唱得最大声", req: { extroversion: 60, energy: 55 } },
        { text: "{name}偷偷在课本上画了小漫画", req: { extroversionMax: 50 } }
    ];

    // ============================
    // 成长阶段定义
    // ============================
    const AGE_STAGES = [
        { name: '蛋期', minMonth: 0, maxMonth: 0, emoji: '🥚', storyKey: 'baby' },
        { name: '幼婴期', minMonth: 1, maxMonth: 6, emoji: '🐣', storyKey: 'baby' },
        { name: '幼儿期', minMonth: 7, maxMonth: 24, emoji: '🌱', storyKey: 'baby' },
        { name: '童年期', minMonth: 25, maxMonth: 60, emoji: '🌿', storyKey: 'toddler' },
        { name: '学龄期', minMonth: 61, maxMonth: 144, emoji: '📚', storyKey: 'school' },
        { name: '青春期', minMonth: 145, maxMonth: 216, emoji: '🌺', storyKey: 'teen' },
        { name: '成年期', minMonth: 217, maxMonth: 9999, emoji: '✨', storyKey: 'adult' }
    ];

    // ============================
    // 里程碑定义
    // ============================
    const MILESTONES = [
        { month: 1, title: "🌟 第一次睁眼", desc: "{name}睁开了朦胧的小眼睛，好奇地看着这个世界" },
        { month: 3, title: "😊 第一次微笑", desc: "看到你的那一刻，{name}露出了第一个笑容" },
        { month: 6, title: "🗣️ 第一声叫唤", desc: "{name}含糊地喊出了第一个词！" },
        { month: 12, title: "🚶 学会走路", desc: "{name}摇摇晃晃迈出了第一步！" },
        { month: 24, title: "🎂 两岁啦", desc: "{name}已经两岁了，越来越聪明" },
        { month: 36, title: "🎒 上幼儿园", desc: "{name}背上了小书包，第一天去幼儿园" },
        { month: 60, title: "🏫 入学典礼", desc: "穿上校服的{name}有点紧张，但也很兴奋！" },
        { month: 72, title: "📖 学会阅读", desc: "{name}可以自己读故事书了" },
        { month: 120, title: "🎓 小学毕业", desc: "{name}完成了小学学业" },
        { month: 144, title: "📚 初中生活", desc: "{name}进入了初中，开始了新阶段" },
        { month: 156, title: "💢 叛逆期", desc: "{name}开始有了自己的主意，偶尔会顶嘴" },
        { month: 180, title: "🎓 中考", desc: "{name}迎来了人生第一个大考" },
        { month: 216, title: "🎓 成年了！", desc: "{name}长大成人了！" }
    ];

    // ============================
    // 成就定义
    // ============================
    const ACHIEVEMENTS = [
        { id: 'first_feed', icon: '🍖', title: '第一餐', desc: '第一次喂精灵吃东西' },
        { id: 'first_gift', icon: '🎁', title: '第一份礼物', desc: '第一次送精灵礼物' },
        { id: 'gift_10', icon: '🎁', title: '送礼达人', desc: '累计送出10份礼物' },
        { id: 'chat_10', icon: '💬', title: '话匣子', desc: '和精灵聊天10次' },
        { id: 'chat_100', icon: '🗣️', title: '无话不谈', desc: '和精灵聊天100次' },
        { id: 'age_12', icon: '🎂', title: '一岁啦', desc: '精灵长到1岁' },
        { id: 'age_60', icon: '🏫', title: '上学去', desc: '精灵到达入学年龄' },
        { id: 'age_216', icon: '🎓', title: '长大成人', desc: '精灵18岁' },
        { id: 'kind_90', icon: '😇', title: '天使宝宝', desc: '善良度达到90' },
        { id: 'brave_90', icon: '🦁', title: '勇者无畏', desc: '勇敢度达到90' },
        { id: 'smart_90', icon: '🧠', title: '小天才', desc: '聪慧度达到90' },
        { id: 'top_student', icon: '🏅', title: '学霸', desc: '考试全科90分以上' },
        { id: 'sick_recover', icon: '💪', title: '痊愈啦', desc: '治好第一次生病' },
        { id: 'family_photo', icon: '📸', title: '幸福一家', desc: '送出全家福' },
        { id: 'diary_10', icon: '📓', title: '小作家', desc: '累计10篇日记' },
        { id: 'diary_30', icon: '📓', title: '日记本满了', desc: '累计30篇日记' },
        { id: 'story_10', icon: '📖', title: '故事大王', desc: '经历10个剧情事件' },
        { id: 'intimacy_90', icon: '❤️', title: '最爱你', desc: '亲密度达到90' }
    ];

    // ============================
    // 节日事件
    // ============================
    const HOLIDAY_EVENTS = {
        '01-01': { title: '🎍 新年快乐', event: '{name}穿上了新衣服，一起过新年！', bonus: { mood: 20 } },
        '02-14': { title: '💕 情人节', event: '{name}做了一张爱心贺卡送给你', bonus: { mood: 15 } },
        '04-01': { title: '🤡 愚人节', event: '{name}在你的鞋子里放了一只玩具蜘蛛！', bonus: { mood: 10 } },
        '05-01': { title: '🌸 劳动节', event: '{name}试着帮忙打扫，结果搞得更乱了', bonus: { mood: 5, stamina: -5 } },
        '06-01': { title: '🎈 儿童节', event: '{name}收到了特别的礼物，开心得转圈！', bonus: { mood: 25 } },
        '10-31': { title: '🎃 万圣节', event: '{name}穿上了南瓜装到处trick or treat', bonus: { mood: 15 } },
        '12-25': { title: '🎄 圣诞节', event: '{name}在袜子里发现了礼物！', bonus: { mood: 20, wisdom: 5 } }
    };

    // ============================
    // 情绪状态定义
    // ============================
    const EMOTION_STATES = {
        excited: { name: '兴奋', emoji: '🤩', studyBonus: 1.2, examBonus: 5 },
        happy: { name: '开心', emoji: '😊', studyBonus: 1.1, examBonus: 3 },
        calm: { name: '平静', emoji: '😐', studyBonus: 1.0, examBonus: 0 },
        bored: { name: '无聊', emoji: '😑', studyBonus: 0.8, examBonus: -3 },
        sad: { name: '难过', emoji: '😢', studyBonus: 0.7, examBonus: -5 },
        angry: { name: '生气', emoji: '😤', studyBonus: 0.6, examBonus: -8 },
        sick: { name: '生病', emoji: '🤒', studyBonus: 0.3, examBonus: -15 }
    };

    // ============================
    // 全局变量
    // ============================
    let currentSpiritId = null;
    let spiritChatHistory = [];

    // [FIX] 将 currentSpiritId 同步到 window，使 app-extras.js 中的 edit/delete 函数能访问
    Object.defineProperty(window, '_spiritV2CurrentId', {
        get: function() { return currentSpiritId; },
        set: function(v) { currentSpiritId = v; },
        configurable: true
    });

    // ============================
    // 工具函数
    // ============================
    function clamp(val, min, max) { return Math.max(min || 0, Math.min(max || 100, Math.round(val))); }

    function getAgeStage(virtualMonth) {
        for (var i = AGE_STAGES.length - 1; i >= 0; i--) {
            if (virtualMonth >= AGE_STAGES[i].minMonth) return AGE_STAGES[i];
        }
        return AGE_STAGES[0];
    }

    function getAgeYearsMonths(virtualMonth) {
        var y = Math.floor(virtualMonth / 12);
        var m = virtualMonth % 12;
        if (y === 0) return m + '个月';
        if (m === 0) return y + '岁';
        return y + '岁' + m + '个月';
    }

    function getEmotionState(spirit) {
        if (spirit.illness) return EMOTION_STATES.sick;
        if (spirit.mood >= 85) return EMOTION_STATES.excited;
        if (spirit.mood >= 60) return EMOTION_STATES.happy;
        if (spirit.mood >= 40) return EMOTION_STATES.calm;
        if (spirit.mood >= 25) return EMOTION_STATES.bored;
        if (spirit.mood >= 10) return EMOTION_STATES.sad;
        return EMOTION_STATES.angry;
    }

    function getMoodText(mood) {
        if (mood >= 85) return '超级开心！✨';
        if (mood >= 70) return '心情不错~';
        if (mood >= 50) return '还好啦';
        if (mood >= 30) return '有点闷闷的...';
        if (mood >= 15) return '不太开心...';
        return '很难过😢';
    }

    function getTodayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    function getMMDD() {
        var d = new Date();
        return String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    }

    // ============================
    // 精灵数据迁移/初始化
    // ============================
    function migrateSpiritData(spirit) {
        // 新增字段迁移
        if (spirit.actionPoints === undefined) spirit.actionPoints = 100;
        if (!spirit.lastRealDate) spirit.lastRealDate = getTodayStr();
        if (spirit.totalActionsUsed === undefined) spirit.totalActionsUsed = 0;
        if (spirit.currentVirtualMonth === undefined) {
            // 基于旧的 createdAt 计算已过去的虚拟月
            spirit.currentVirtualMonth = Math.floor((Date.now() - spirit.createdAt) / (1000 * 60 * 60 * 24));
        }
        if (spirit.monthActionCounter === undefined) spirit.monthActionCounter = 0;

        // 性格6维度迁移
        if (!spirit.personalityDim) {
            spirit.personalityDim = {
                extroversion: 50, bravery: 50, kindness: 50,
                intelligence: 50, energy: 50, independence: 50
            };
            // 从旧personality标签推断
            if (spirit.personality && spirit.personality.length) {
                spirit.personality.forEach(function(tag) {
                    if (/活泼|外向/.test(tag)) { spirit.personalityDim.extroversion += 10; spirit.personalityDim.energy += 10; }
                    if (/善良|温柔/.test(tag)) { spirit.personalityDim.kindness += 10; }
                    if (/勇敢/.test(tag)) { spirit.personalityDim.bravery += 10; }
                    if (/聪明|好学/.test(tag)) { spirit.personalityDim.intelligence += 10; }
                    if (/独立/.test(tag)) { spirit.personalityDim.independence += 10; }
                    if (/内向|安静/.test(tag)) { spirit.personalityDim.extroversion -= 10; }
                    if (/胆小/.test(tag)) { spirit.personalityDim.bravery -= 10; }
                });
                // clamp all
                for (var k in spirit.personalityDim) spirit.personalityDim[k] = clamp(spirit.personalityDim[k]);
            }
        }

        // 亲密度
        if (!spirit.intimacy) spirit.intimacy = { user: 50, partner: 50 };

        // 日记（信纸版）
        if (!spirit.diaries) spirit.diaries = [];
        // 日志
        if (!spirit.dailyLog) spirit.dailyLog = [];
        // 趣事记录
        if (!spirit.anecdotes) spirit.anecdotes = [];
        // 成就
        if (!spirit.achievements) spirit.achievements = [];
        // 剧情历史
        if (!spirit.storyHistory) spirit.storyHistory = [];
        // 考试记录
        if (!spirit.examRecords) spirit.examRecords = [];
        // 礼物记录
        if (!spirit.giftHistory) spirit.giftHistory = [];
        // 生病状态
        if (spirit.illness === undefined) spirit.illness = null;
        // 情绪
        if (!spirit.emotionState) spirit.emotionState = 'calm';
        // 里程碑
        if (!spirit.milestonesReached) spirit.milestonesReached = [];
        // 最后节日检查
        if (!spirit.lastHolidayCheck) spirit.lastHolidayCheck = '';
        // 学期计数
        if (spirit.semesterCount === undefined) spirit.semesterCount = 0;
        if (spirit.semesterActionCounter === undefined) spirit.semesterActionCounter = 0;
        // 聊天次数
        if (spirit.chatCount === undefined) spirit.chatCount = 0;
        // 喂食次数
        if (spirit.feedCount === undefined) spirit.feedCount = 0;

        return spirit;
    }

    function initSpiritData() {
        if (!store.spirits) store.spirits = [];
        store.spirits.forEach(function(s) { migrateSpiritData(s); });
    }

    // ============================
    // 每日行动点重置
    // ============================
    function checkDailyReset(spirit) {
        var today = getTodayStr();
        if (spirit.lastRealDate !== today) {
            spirit.actionPoints = 100;
            spirit.lastRealDate = today;
            // 检查节日
            checkHoliday(spirit);
        }
    }

    // ============================
    // 节日检查
    // ============================
    function checkHoliday(spirit) {
        var mmdd = getMMDD();
        if (spirit.lastHolidayCheck === mmdd) return;
        spirit.lastHolidayCheck = mmdd;
        var holiday = HOLIDAY_EVENTS[mmdd];
        if (holiday) {
            var text = holiday.event.replace(/\{name\}/g, spirit.name);
            addDailyLog(spirit, 'holiday', 'system', text, holiday.bonus);
            applyEffects(spirit, holiday.bonus);
            // 显示节日通知
            setTimeout(function() {
                showSpiritStoryModal({
                    title: holiday.title,
                    desc: text,
                    choices: [{ text: '🎉 太棒了！', personality: {}, effect: { mood: 5 } }]
                }, spirit);
            }, 500);
        }
    }

    // ============================
    // 日志记录
    // ============================
    function addDailyLog(spirit, type, actor, detail, effects) {
        spirit.dailyLog.push({
            time: Date.now(),
            virtualMonth: spirit.currentVirtualMonth,
            type: type,
            actor: actor,
            detail: detail,
            effects: effects || {}
        });

        // 用户操作自动生成趣事（真实记录）
        if (actor === 'user' && ['feed', 'play', 'study', 'exercise', 'gift', 'heal'].indexOf(type) !== -1) {
            addAnecdote(spirit, {
                source: 'user',
                title: detail,
                desc: detail,
                location: getRandomLocation(type),
                effects: effects
            });
        }
    }

    // ============================
    // 趣事记录系统
    // ============================
    var ANECDOTE_LOCATIONS = {
        feed: ['厨房', '餐桌旁', '客厅的沙发上', '阳台上', '花园里'],
        play: ['房间里', '公园里', '后花园', '游乐场', '小院子里'],
        study: ['书房里', '小书桌旁', '图书馆', '窗边', '树荫下'],
        exercise: ['后花园', '操场上', '小山丘上', '河边', '草地上'],
        gift: ['客厅里', '精灵的小窝', '圣诞树下', '花园凉亭'],
        heal: ['温暖的小窝', '医务室', '被窝里'],
        holiday: ['家里', '街上', '广场上', '院子里'],
        school: ['学校教室', '校园操场', '图书馆', '音乐室'],
        class: ['兴趣班教室', '画室', '琴房', '舞蹈室'],
        rest: ['温暖的小窝', '沙发上', '摇篮里', '秋千上'],
        chat: ['窗台边', '沙发上', '星空下', '花园长椅上'],
        default: ['家里', '某个温馨的角落', '阳光下', '月光里']
    };

    function getRandomLocation(type) {
        var locs = ANECDOTE_LOCATIONS[type] || ANECDOTE_LOCATIONS['default'];
        return locs[Math.floor(Math.random() * locs.length)];
    }

    function addAnecdote(spirit, data) {
        if (!spirit.anecdotes) spirit.anecdotes = [];
        spirit.anecdotes.push({
            id: 'anec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            time: Date.now(),
            date: getTodayStr(),
            virtualMonth: spirit.currentVirtualMonth,
            virtualYear: Math.floor(spirit.currentVirtualMonth / 12),
            source: data.source || 'system', // 'user' or 'system'
            title: data.title || '',
            desc: data.desc || '',
            location: data.location || '某个地方',
            effects: data.effects || {}
        });
    }

    // 精灵视角趣事生成模板
    var SPIRIT_ANECDOTE_TEMPLATES = {
        baby: [
            { title: '发现了一只蝴蝶', desc: '今天在{location}的时候，看到了一只好漂亮的蝴蝶！它的翅膀是彩色的，我追着它跑了好久好久~', locations: ['花园里', '窗台边', '阳台上'] },
            { title: '学会了新的叫声', desc: '今天突然发出了一种没发过的声音！{user}听到后好开心，一直对我笑，我也好开心呀~', locations: ['客厅里', '卧室里', '餐桌旁'] },
            { title: '第一次看到雨', desc: '天上掉水了！好神奇！我趴在窗边看了好久好久，水珠打在窗户上叮叮咚咚的，好好听~', locations: ['窗边', '阳台上'] },
            { title: '和毛毯捉迷藏', desc: '我把自己藏在毛毯下面，{user}假装找不到我，其实我的尾巴露出来了啦~哈哈~', locations: ['沙发上', '床上', '地毯上'] },
            { title: '闻到了好香的味道', desc: '厨房飘来一阵好香好香的味道，我的鼻子不由自主地动了动，口水都要流下来了~', locations: ['厨房旁', '餐厅里'] }
        ],
        toddler: [
            { title: '捡到一片漂亮的树叶', desc: '今天在{location}散步的时候，捡到了一片好漂亮的叶子！金黄色的，像一颗小星星。我要把它夹在书里当书签~', locations: ['公园里', '花园小径上', '树荫下'] },
            { title: '和小蚂蚁做朋友', desc: '发现了一群小蚂蚁在搬东西！它们好努力呀，一个一个排着队。我在旁边看了好久，还帮它们把一块面包碎推了过去~', locations: ['院子里', '花坛边', '门口台阶上'] },
            { title: '画了一幅画', desc: '今天用蜡笔画了一幅画！画了{user}、画了太阳、还画了我自己。虽然{user}说不太像，但我觉得画得很好呀！', locations: ['书桌上', '地板上', '画板前'] },
            { title: '学会了一首歌', desc: '在{location}听到了一首好听的歌，我就跟着哼了起来。虽然调子可能不太对，但是{user}说好听！', locations: ['客厅里', '电视机前', '阳台上'] },
            { title: '堆了一个城堡', desc: '用积木堆了一个大城堡！有高高的塔楼和城墙。虽然后来不小心碰倒了，但我很自豪！', locations: ['房间里', '游戏角'] }
        ],
        school: [
            { title: '交到了新朋友', desc: '今天在学校认识了一个新同学！我们一起在操场上跑来跑去，玩得好开心。放学的时候还约好了明天一起吃午饭~', locations: ['学校操场', '教室里', '食堂'] },
            { title: '考试得了好成绩', desc: '老师把试卷发下来的时候，我紧张得心都要跳出来了！结果一看——分数比想象的好多了！我迫不及待想回家告诉{user}~', locations: ['教室里', '学校走廊'] },
            { title: '在图书馆发现了有趣的书', desc: '今天在{location}翻到了一本超级有趣的冒险故事！看得入迷了，都忘了时间，差点错过了下课铃~', locations: ['图书馆', '阅览室'] },
            { title: '参加了学校运动会', desc: '今天学校开运动会！我参加了跑步比赛，虽然没有拿第一名，但是跑得很快！{user}在终点等我，给了我一个大大的拥抱~', locations: ['操场上', '运动场'] },
            { title: '学会了折千纸鹤', desc: '手工课上老师教我们折千纸鹤。一开始我折得歪歪扭扭的，但后来越折越好了！我想折一千只送给{user}~', locations: ['教室里', '手工课上'] }
        ],
        teen: [
            { title: '和朋友一起看了日落', desc: '今天放学后没有直接回家，和朋友们一起去{location}看了日落。天空从橙色变成紫色再变成深蓝色，好美啊。突然觉得，能有朋友一起看这些，真的很幸福。', locations: ['天台上', '河边', '山丘上'] },
            { title: '第一次做了饭', desc: '今天想给{user}一个惊喜，偷偷学着做了一道菜！虽然盐放多了一点，而且差点把厨房搞得一团糟……但看到{user}吃下去露出笑容的那一刻，一切都值了~', locations: ['厨房里'] },
            { title: '写了一首小诗', desc: '深夜睡不着，在笔记本上写了一首小诗。关于星星，关于梦想，关于那些说不清楚的心事。也许以后回头看会觉得幼稚吧，但现在觉得挺好的。', locations: ['书桌前', '窗边', '被窝里'] },
            { title: '和{user}吵了一架', desc: '今天因为一点小事和{user}闹了别扭，明明心里很在乎，嘴上偏偏说不出好听的话。后来一个人待了一会儿，想明白了——其实是我不好。回去悄悄给{user}倒了杯水。', locations: ['家里', '房间里'] },
            { title: '收到了一份意外的礼物', desc: '今天在书包里发现了一个小纸条和一颗糖，是同桌偷偷塞的！上面写着"加油"。明明只是小小的一件事，心里却暖了一整天~', locations: ['教室里', '课桌上'] }
        ],
        adult: [
            { title: '回忆小时候的事', desc: '今天整理东西的时候翻到了小时候的照片和日记。看着那时候稚嫩的字迹和天真的想法，突然觉得时间过得好快。感谢{user}一直以来的陪伴，是你让我成为了现在的我。', locations: ['房间里', '阁楼上'] },
            { title: '独自去了很远的地方', desc: '今天一个人走了很远很远的路。看到了从未见过的风景，遇到了有趣的人。虽然路上有些孤独，但更多的是自由和期待。回家的时候，看到亮着的灯光，心里特别温暖。', locations: ['远方的路上', '陌生的小镇'] },
            { title: '给{user}写了一封信', desc: '有些话当面说不出口，就写在信里吧。谢谢你从蛋期就开始陪伴我，一路看着我长大。你是世界上最好的{user}。这封信我偷偷放在了你的枕头下面~', locations: ['书桌前', '深夜的台灯下'] }
        ]
    };

    // 在月末自动生成精灵视角趣事
    function generateSpiritAnecdote(spirit) {
        var stage = getAgeStage(spirit.currentVirtualMonth);
        var templates = SPIRIT_ANECDOTE_TEMPLATES[stage.storyKey];
        if (!templates || templates.length === 0) templates = SPIRIT_ANECDOTE_TEMPLATES.toddler;

        var template = templates[Math.floor(Math.random() * templates.length)];
        var location = template.locations[Math.floor(Math.random() * template.locations.length)];
        
        var userLabel = '主人';
        if (spirit.partnerId) {
            var partner = store.contacts ? store.contacts.find(function(c) { return c.id === spirit.partnerId; }) : null;
            if (partner) userLabel = partner.name;
        }

        var desc = template.desc
            .replace(/\{location\}/g, location)
            .replace(/\{user\}/g, userLabel)
            .replace(/\{name\}/g, spirit.name);
        var title = template.title
            .replace(/\{user\}/g, userLabel)
            .replace(/\{name\}/g, spirit.name);

        addAnecdote(spirit, {
            source: 'system',
            title: title,
            desc: desc,
            location: location
        });
    }

    // ============================
    // 属性变更
    // ============================
    function applyEffects(spirit, effects) {
        if (!effects) return;
        if (effects.hunger !== undefined) spirit.hunger = clamp(spirit.hunger + effects.hunger);
        if (effects.mood !== undefined) spirit.mood = clamp(spirit.mood + effects.mood);
        if (effects.wisdom !== undefined) spirit.wisdom = clamp(spirit.wisdom + effects.wisdom);
        if (effects.stamina !== undefined) spirit.stamina = clamp(spirit.stamina + effects.stamina);
        if (effects.health !== undefined) spirit.health = clamp(spirit.health + effects.health);
    }

    function applyPersonality(spirit, pchanges) {
        if (!pchanges) return;
        var d = spirit.personalityDim;
        for (var k in pchanges) {
            if (d[k] !== undefined) {
                d[k] = clamp(d[k] + pchanges[k]);
            }
        }
    }

    // ============================
    // 成就检查
    // ============================
    function checkAchievement(spirit, achievementId) {
        if (spirit.achievements.indexOf(achievementId) === -1) {
            spirit.achievements.push(achievementId);
            var ach = ACHIEVEMENTS.find(function(a) { return a.id === achievementId; });
            if (ach) {
                showSpiritNotification(ach.icon + ' 获得成就：' + ach.title);
            }
        }
    }

    function checkAllAchievements(spirit) {
        if (spirit.feedCount >= 1) checkAchievement(spirit, 'first_feed');
        if (spirit.giftHistory.length >= 1) checkAchievement(spirit, 'first_gift');
        if (spirit.giftHistory.length >= 10) checkAchievement(spirit, 'gift_10');
        if (spirit.chatCount >= 10) checkAchievement(spirit, 'chat_10');
        if (spirit.chatCount >= 100) checkAchievement(spirit, 'chat_100');
        if (spirit.currentVirtualMonth >= 12) checkAchievement(spirit, 'age_12');
        if (spirit.currentVirtualMonth >= 60) checkAchievement(spirit, 'age_60');
        if (spirit.currentVirtualMonth >= 216) checkAchievement(spirit, 'age_216');
        if (spirit.personalityDim.kindness >= 90) checkAchievement(spirit, 'kind_90');
        if (spirit.personalityDim.bravery >= 90) checkAchievement(spirit, 'brave_90');
        if (spirit.personalityDim.intelligence >= 90) checkAchievement(spirit, 'smart_90');
        if (spirit.diaries.length >= 10) checkAchievement(spirit, 'diary_10');
        if (spirit.diaries.length >= 30) checkAchievement(spirit, 'diary_30');
        if (spirit.storyHistory.length >= 10) checkAchievement(spirit, 'story_10');
        if (spirit.intimacy.user >= 90 || spirit.intimacy.partner >= 90) checkAchievement(spirit, 'intimacy_90');
        // 全家福
        if (spirit.giftHistory.some(function(g) { return g.giftId === 'photo'; })) checkAchievement(spirit, 'family_photo');
        // 学霸检查在考试后
    }

    // ============================
    // 里程碑检查
    // ============================
    function checkMilestones(spirit) {
        MILESTONES.forEach(function(ms) {
            if (spirit.currentVirtualMonth >= ms.month && spirit.milestonesReached.indexOf(ms.month) === -1) {
                spirit.milestonesReached.push(ms.month);
                var title = ms.title;
                var desc = ms.desc.replace(/\{name\}/g, spirit.name);
                showSpiritNotification(title + ' ' + desc);
                addDailyLog(spirit, 'milestone', 'system', title + ' - ' + desc);
            }
        });
    }

    // ============================
    // 生病检查
    // ============================
    function checkSickness(spirit) {
        if (spirit.illness) return; // 已经生病
        if (spirit.health < 30 && Math.random() < 0.25) {
            var illnesses = [
                { name: '感冒', icon: '🤧', effect: { stamina: -30, mood: -15 }, healCost: 2 },
                { name: '发烧', icon: '🤒', effect: { stamina: -50, mood: -20 }, healCost: 3 },
                { name: '肚子疼', icon: '😣', effect: { hunger: -20, mood: -15 }, healCost: 2 }
            ];
            spirit.illness = illnesses[Math.floor(Math.random() * illnesses.length)];
            applyEffects(spirit, spirit.illness.effect);
            showSpiritNotification(spirit.illness.icon + ' ' + spirit.name + '生病了：' + spirit.illness.name);
            addDailyLog(spirit, 'sick', 'system', spirit.name + '生病了：' + spirit.illness.name);
        }
    }

    // ============================
    // 月度结算
    // ============================
    function triggerMonthEnd(spirit) {
        spirit.currentVirtualMonth++;
        spirit.monthActionCounter = 0;

        // 学期计数（上学后，每6个月一学期）
        if (spirit.currentVirtualMonth >= 60) {
            spirit.semesterActionCounter++;
            if (spirit.semesterActionCounter >= 6) {
                spirit.semesterActionCounter = 0;
                spirit.semesterCount++;
                triggerExam(spirit);
            }
        }

        // 检查里程碑
        checkMilestones(spirit);

        // 生病检查
        checkSickness(spirit);

        // 属性自然衰减
        spirit.hunger = clamp(spirit.hunger - 3);
        spirit.stamina = clamp(spirit.stamina - 2);

        // 触发月度剧情
        triggerMonthlyStory(spirit);

        // 生成精灵视角趣事（用户不知道的隐藏趣事）
        generateSpiritAnecdote(spirit);

        // 生成日记（信纸版，500字）
        generateDiary(spirit);

        // 检查成就
        checkAllAchievements(spirit);

        save();
    }

    // ============================
    // 月度剧情
    // ============================
    // 获取自定义预设故事
    function getCustomStories(stageKey) {
        if (!store.spiritCustomStories) store.spiritCustomStories = {};
        return store.spiritCustomStories[stageKey] || [];
    }

    // 保存自定义预设故事
    function addCustomStories(stageKey, stories) {
        if (!store.spiritCustomStories) store.spiritCustomStories = {};
        if (!store.spiritCustomStories[stageKey]) store.spiritCustomStories[stageKey] = [];
        stories.forEach(function(s) {
            var exists = store.spiritCustomStories[stageKey].some(function(existing) {
                return existing.title === s.title;
            });
            if (!exists) {
                store.spiritCustomStories[stageKey].push(s);
            }
        });
        save();
    }

    function triggerMonthlyStory(spirit) {
        var stage = getAgeStage(spirit.currentVirtualMonth);
        var storyPool = MONTHLY_STORIES[stage.storyKey] || [];

        // 合并自定义预设
        var customPool = getCustomStories(stage.storyKey);
        var allPool = storyPool.concat(customPool);

        if (allPool.length === 0) {
            showSpiritNotification('📖 暂无新故事，可以点右上角 ✨ 扩充预设哦~');
            return;
        }

        // 过滤已用过的剧情
        var usedTitles = spirit.storyHistory.map(function(s) { return s.title; });
        var available = allPool.filter(function(s) { return usedTitles.indexOf(s.title) === -1; });

        if (available.length === 0) {
            showSpiritNotification('📖 所有故事都看过了，点右上角 ✨ 扩充更多预设吧~');
            return;
        }

        var story = available[Math.floor(Math.random() * available.length)];
        showSpiritStoryModal(story, spirit);
    }

    function showSpiritStoryModal(story, spirit) {
        var modal = document.getElementById('modal-spirit-story');
        if (!modal) return;

        var titleEl = document.getElementById('spirit-story-title');
        var descEl = document.getElementById('spirit-story-desc');
        var choicesEl = document.getElementById('spirit-story-choices');

        titleEl.textContent = story.title;
        descEl.textContent = story.desc.replace(/\{name\}/g, spirit.name);

        choicesEl.innerHTML = story.choices.map(function(choice, idx) {
            return '<div class="spirit-story-choice" onclick="window._spiritStoryChoose(' + idx + ')">' +
                '<span class="ssc-text">' + choice.text + '</span>' +
                '</div>';
        }).join('');

        modal.style.display = 'flex';

        // 存储当前剧情供选择时使用
        window._currentSpiritStory = story;
        window._currentSpiritStorySpirit = spirit;
    }

    window._spiritStoryChoose = function(idx) {
        var story = window._currentSpiritStory;
        var spirit = window._currentSpiritStorySpirit;
        if (!story || !spirit) return;

        var choice = story.choices[idx];
        applyEffects(spirit, choice.effect);
        applyPersonality(spirit, choice.personality);

        spirit.storyHistory.push({
            title: story.title,
            choiceIdx: idx,
            choiceText: choice.text,
            month: spirit.currentVirtualMonth,
            time: Date.now()
        });

        var storyNarrative = story.desc.replace(/\{name\}/g, spirit.name).replace(/\.{2,}$/, '');
        addDailyLog(spirit, 'story', 'system',
            '今天' + storyNarrative + '，主人' + choice.text,
            choice.effect);

        document.getElementById('modal-spirit-story').style.display = 'none';
        save();

        // 刷新详情页
        if (document.getElementById('spirit-detail-page').style.display !== 'none') {
            renderSpiritDetailUI(spirit);
        }

        showSpiritNotification('📖 ' + spirit.name + '的故事又翻了新的一页~');
    };

    // AI扩充预设功能（用户主动点击触发）
    window.expandSpiritPresets = async function() {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) {
            showSpiritNotification('❌ 请先选择一个精灵');
            return;
        }

        if (typeof API === 'undefined' || !API || !API.chatCompletion) {
            showSpiritNotification('❌ API未配置，请先在设置中配置API');
            return;
        }

        var stage = getAgeStage(spirit.currentVirtualMonth);
        showSpiritNotification('✨ 正在用AI扩充「' + stage.name + '」阶段的预设...');

        try {
            var d = spirit.personalityDim;
            var ageStr = getAgeYearsMonths(spirit.currentVirtualMonth);
            var prompt = '你是一个精灵养成游戏的剧情设计师。精灵「' + spirit.name + '」当前' + ageStr + '（' + stage.name + '阶段），' +
                '性格维度：外向' + d.extroversion + '，勇敢' + d.bravery + '，善良' + d.kindness + '，聪慧' + d.intelligence + '，活泼' + d.energy + '，独立' + d.independence + '。' +
                '请一次性生成5个适合当前年龄阶段的成长事件，返回JSON数组。' +
                '每个事件包含title（带emoji）、desc（30字内，用{name}代替精灵名）和3个choices。' +
                '每个choice包含text（带emoji，10字内）、personality（对象，键为extroversion/bravery/kindness/intelligence/energy/independence，值为-8到+8的整数）和effect（对象，键为hunger/mood/wisdom/stamina/health，值为整数）。' +
                '注意：事件要丰富多样，不要重复。只返回JSON数组，不要其他文字。';

            var response = await API.chatCompletion([
                { role: 'system', content: prompt },
                { role: 'user', content: '请生成5个精灵成长事件' }
            ], 0.9);

            var text = response.choices[0].message.content.trim();
            // 提取JSON数组
            var jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                var stories = JSON.parse(jsonMatch[0]);
                if (Array.isArray(stories) && stories.length > 0) {
                    addCustomStories(stage.storyKey, stories);
                    showSpiritNotification('✅ 成功扩充 ' + stories.length + ' 个「' + stage.name + '」预设！');
                } else {
                    showSpiritNotification('⚠️ AI返回格式有误，请重试');
                }
            } else {
                // 尝试单个对象
                var singleMatch = text.match(/\{[\s\S]*\}/);
                if (singleMatch) {
                    var story = JSON.parse(singleMatch[0]);
                    addCustomStories(stage.storyKey, [story]);
                    showSpiritNotification('✅ 成功扩充 1 个预设！');
                } else {
                    showSpiritNotification('⚠️ AI返回格式有误，请重试');
                }
            }
        } catch(e) {
            console.log('AI预设扩充失败:', e);
            showSpiritNotification('❌ 扩充失败：' + (e.message || '请检查API设置'));
        }
    };

    // ============================
    // 考试系统
    // ============================
    function triggerExam(spirit) {
        var d = spirit.personalityDim;
        var scores = {
            '语文': clamp(spirit.wisdom * 0.3 + d.kindness * 0.2 + d.intelligence * 0.2 + (Math.random()-0.3) * 20),
            '数学': clamp(spirit.wisdom * 0.4 + d.intelligence * 0.3 + (Math.random()-0.3) * 20),
            '英语': clamp(spirit.wisdom * 0.3 + d.extroversion * 0.15 + d.intelligence * 0.15 + (Math.random()-0.3) * 20),
            '体育': clamp(spirit.stamina * 0.3 + d.energy * 0.2 + d.bravery * 0.1 + (Math.random()-0.3) * 20),
            '美术': clamp(spirit.mood * 0.2 + d.kindness * 0.15 + d.independence * 0.1 + (Math.random()-0.2) * 25),
            '品德': clamp(d.kindness * 0.4 + d.bravery * 0.1 + spirit.mood * 0.1 + (Math.random()-0.2) * 15)
        };

        // 情绪加成
        var emotion = getEmotionState(spirit);
        for (var subj in scores) {
            scores[subj] = clamp(scores[subj] + (emotion.examBonus || 0));
        }

        var record = {
            semester: spirit.semesterCount,
            month: spirit.currentVirtualMonth,
            scores: scores,
            time: Date.now()
        };
        spirit.examRecords.push(record);

        // 学霸检查
        var allAbove90 = true;
        for (var s in scores) { if (scores[s] < 90) allAbove90 = false; }
        if (allAbove90) checkAchievement(spirit, 'top_student');

        addDailyLog(spirit, 'exam', 'system',
            '第' + spirit.semesterCount + '学期考试成绩：' +
            Object.keys(scores).map(function(k) { return k + scores[k]; }).join('，'));

        // 显示成绩单弹窗
        showExamResultModal(spirit, record);
    }

    function showExamResultModal(spirit, record) {
        var modal = document.getElementById('modal-spirit-exam');
        if (!modal) return;

        var content = document.getElementById('spirit-exam-content');
        var html = '<div class="spirit-exam-title">📝 第' + record.semester + '学期成绩单</div>';
        html += '<div class="spirit-exam-name">' + spirit.name + ' · ' + getAgeYearsMonths(record.month) + '</div>';
        html += '<div class="spirit-exam-scores">';
        for (var subj in record.scores) {
            var score = record.scores[subj];
            var level = score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 60 ? 'pass' : 'fail';
            html += '<div class="spirit-exam-row">' +
                '<span class="ser-subject">' + subj + '</span>' +
                '<span class="ser-score ser-' + level + '">' + score + '</span>' +
                '</div>';
        }
        html += '</div>';
        content.innerHTML = html;
        modal.style.display = 'flex';
    }

    // ============================
    // 日记生成（信纸版，500字，情感充沛）
    // ============================
    var WEATHER_LIST = [
        { icon: '☀️', text: '晴' },
        { icon: '⛅', text: '多云' },
        { icon: '🌤️', text: '晴转多云' },
        { icon: '🌧️', text: '小雨' },
        { icon: '🌦️', text: '阵雨' },
        { icon: '❄️', text: '下雪' },
        { icon: '🌈', text: '雨后彩虹' },
        { icon: '🌙', text: '月色很美' },
        { icon: '🍃', text: '微风' },
        { icon: '🌸', text: '花香满溢' }
    ];

    var DIARY_MOODS = [
        { emoji: '🥰', text: '幸福满满', cls: 'happy' },
        { emoji: '😊', text: '开心', cls: 'happy' },
        { emoji: '😌', text: '平静', cls: 'calm' },
        { emoji: '🤩', text: '超级兴奋', cls: 'excited' },
        { emoji: '😢', text: '有点难过', cls: 'sad' },
        { emoji: '😤', text: '有点小生气', cls: 'sad' },
        { emoji: '🥺', text: '想撒娇', cls: 'sad' },
        { emoji: '💪', text: '元气满满', cls: 'excited' },
        { emoji: '🌟', text: '闪闪发光', cls: 'excited' },
        { emoji: '😴', text: '有点困', cls: 'calm' }
    ];

    function getDiaryMood(spirit) {
        if (spirit.mood >= 85) return DIARY_MOODS[Math.random() > 0.5 ? 0 : 3];
        if (spirit.mood >= 60) return DIARY_MOODS[Math.random() > 0.5 ? 1 : 7];
        if (spirit.mood >= 40) return DIARY_MOODS[Math.random() > 0.5 ? 2 : 9];
        if (spirit.mood >= 25) return DIARY_MOODS[6];
        return DIARY_MOODS[Math.random() > 0.5 ? 4 : 5];
    }

    function getRandomWeather() {
        return WEATHER_LIST[Math.floor(Math.random() * WEATHER_LIST.length)];
    }

    async function generateDiary(spirit) {
        // 收集当月日志
        var monthLogs = spirit.dailyLog.filter(function(log) {
            return log.virtualMonth === spirit.currentVirtualMonth - 1;
        });

        var stage = getAgeStage(spirit.currentVirtualMonth);
        var mood = getDiaryMood(spirit);
        var weather = getRandomWeather();
        var emotion = getEmotionState(spirit);

        // 基础日记数据
        var diaryData = {
            month: spirit.currentVirtualMonth - 1,
            date: getTodayStr(),
            virtualAge: getAgeYearsMonths(spirit.currentVirtualMonth - 1),
            stageName: stage.name,
            stageEmoji: stage.emoji,
            mood: mood,
            weather: weather,
            emotion: emotion.name,
            events: monthLogs.map(function(l) { return l.detail; })
        };

        if (monthLogs.length === 0) {
            // 没有日志时生成默认日记
            diaryData.content = generateDefaultLetterDiary(spirit, diaryData);
            diaryData.isDefault = true;
            spirit.diaries.push(diaryData);
            return;
        }

        // 尝试用AI生成500字情感日记
        try {
            var d = spirit.personalityDim;
            var logsText = monthLogs.map(function(l) { return '- ' + l.detail; }).join('\n');

            var userLabel = '主人';
            var partnerLabel = '主人的男朋友';
            if (spirit.partnerId) {
                var partner = store.contacts ? store.contacts.find(function(c) { return c.id === spirit.partnerId; }) : null;
                if (partner) partnerLabel = partner.name;
            }

            var prompt = '你是一只名叫"' + spirit.name + '"的精灵宝宝，当前年龄是' + getAgeYearsMonths(spirit.currentVirtualMonth - 1) + '（' + stage.name + '阶段）。\n' +
                '你被主人（女生）从一颗蛋开始养育长大，你深深爱着主人。\n' +
                '性格维度：外向' + d.extroversion + '/100，勇敢' + d.bravery + '/100，善良' + d.kindness + '/100，聪慧' + d.intelligence + '/100，活泼' + d.energy + '/100，独立' + d.independence + '/100。\n' +
                '当前心情：' + mood.text + '（' + mood.emoji + '）\n' +
                '今日天气：' + weather.text + '\n' +
                '当前饱腹感：' + spirit.hunger + '/100，健康：' + spirit.health + '/100\n' +
                (spirit.partnerId ? '还有另一位养育者"' + partnerLabel + '"，你也很爱TA。\n' : '') +
                '\n这个月发生了以下事情：\n' + logsText + '\n\n' +
                '【重要要求】\n' +
                '1. 请以精灵的第一人称视角写一篇日记，大约400-500字。\n' +
                '2. 语气要符合年龄：婴幼儿期用简单词汇和叠词（比如"好好吃""想想"）；童年期天真活泼；学龄期有思考；青春期有小情绪和独立思考；成年期成熟感恩。\n' +
                '3. 日记要情感充沛，要能打动读者。写出对主人的爱、对生活的感悟、对成长的思考。\n' +
                '4. 要有细腻的场景描写，比如阳光的颜色、风的声音、食物的味道等感官细节。\n' +
                '5. 结尾要温暖，让人读了心里暖暖的。可以表达对主人的感恩或者对明天的期待。\n' +
                '6. 称呼养育者为"主人"，主人是女生。\n' +
                '7. 直接写日记正文内容，不要加任何标题、日期、格式标记。\n' +
                '8. 要自然、真实、像一个活生生的小生命在倾诉心声。\n' +
                '9. 描述事件时要用叙事风格，比如"今天主人和我在窗边晒太阳，看见了一只蝴蝶"，不要用"【剧情】标题→选择了xxx"这种格式。';

            var response = await API.chatCompletion([
                { role: 'system', content: prompt },
                { role: 'user', content: '请写日记' }
            ], 0.9);

            diaryData.content = response.choices[0].message.content.trim();
            spirit.diaries.push(diaryData);
        } catch(e) {
            // AI失败，用模板生成
            diaryData.content = generateDefaultLetterDiary(spirit, diaryData);
            diaryData.isDefault = true;
            spirit.diaries.push(diaryData);
        }
    }

    // 默认信纸日记模板（AI不可用时）
    function generateDefaultLetterDiary(spirit, diaryData) {
        var stage = getAgeStage(spirit.currentVirtualMonth);
        var userLabel = '主人';
        var events = diaryData.events;

        var templates = {
            baby: [
                '今天又是被' + userLabel + '宠爱的一天呀~\n\n' +
                '早上醒来的时候，阳光从窗户照进来，暖暖的，好舒服。' + userLabel + '的脸就在阳光里，朝我笑。我也不知道为什么，看到' + userLabel + '笑，我就想跟着笑。\n\n' +
                (events.length > 0 ? '今天还发生了好多事呢！' + events.slice(0, 3).join('。') + '。每一件事都让我觉得好新奇，这个世界好有趣呀~\n\n' : '今天安安静静的，没有什么特别的事情，但是有' + userLabel + '在身边，就觉得很安心很温暖。\n\n') +
                '虽然我还很小，很多事情都不太懂，但是我知道' + userLabel + '很爱我。因为每次我哭的时候，' + userLabel + '都会把我抱得紧紧的，轻轻拍着我的背。那种温暖的感觉，是世界上最安全的地方。\n\n' +
                '我要快快长大，这样就能跟' + userLabel + '说好多好多话了！我想告诉' + userLabel + '，我也好爱好爱你呀~ 💕\n\n' +
                '晚安，明天也要开开心心的哦~'
            ],
            toddler: [
                '哇，今天好开心呀！\n\n' +
                '早上起来的时候，' + userLabel + '已经准备好了早饭，香香的味道飘过来，我的小肚子就咕咕叫了。吃饱饱之后就有力气玩啦！\n\n' +
                (events.length > 0 ? '今天发生了好多好多事！' + events.slice(0, 4).join('。') + '。\n\n' : '今天和' + userLabel + '一起待了一整天。虽然没有发生什么特别的事情，但是和' + userLabel + '在一起，每一分每一秒都是特别的！\n\n') +
                '下午的时候我在地上玩积木，' + userLabel + '坐在旁边看着我。我抬头看' + userLabel + '的时候，' + userLabel + '总是在笑。我觉得' + userLabel + '的笑容是全世界最好看的！比彩虹还好看，比星星还闪亮！\n\n' +
                '我发现我越来越能做更多的事情了呢！以前不会的现在都会了。' + userLabel + '说我长大了，我好自豪！但是长大了也还是想让' + userLabel + '抱抱~\n\n' +
                '等我再长大一点，我一定要做很多很多事情报答' + userLabel + '！我要给' + userLabel + '画画，给' + userLabel + '唱歌，做' + userLabel + '的小棉袄！\n\n' +
                '今天的月亮好圆好圆，像' + userLabel + '给我吃的小饼干。我对着月亮许了一个愿：希望' + userLabel + '永远开心！💫'
            ],
            school: [
                '亲爱的日记本：\n\n' +
                '今天又是充实的一天呢！每天都在学新东西，虽然有时候会觉得好累，但是想到' + userLabel + '每天也在很努力地工作，我就觉得我也不能偷懒呀。\n\n' +
                (events.length > 0 ? '这个月经历了这些：' + events.slice(0, 4).join('。') + '。每一件事都让我成长了不少。\n\n' : '这个月过得平平淡淡的，但我发现，平淡的日子里也藏着许多小确幸呢。\n\n') +
                '说起来，今天上学路上看到路边的花都开了！粉粉的、白白的，风一吹就像在跳舞。我忍不住蹲下来看了好久。突然想到小时候，' + userLabel + '牵着我的手教我认花的名字——"这个叫月季，那个叫玉兰"。那个时候觉得' + userLabel + '好厉害，什么都知道！\n\n' +
                '现在我也长大了，能自己认识很多花了。但我还是最喜欢和' + userLabel + '一起散步。因为有' + userLabel + '在，连路边的野草都变得有趣起来。\n\n' +
                '我在想，等我长得更大了，换我牵着' + userLabel + '的手，带' + userLabel + '去看世界上最美的花好不好？\n\n' +
                '好啦，今天先写到这里。' + userLabel + '，我爱你哦！明天也要加油呀~ ✨'
            ],
            teen: [
                '唉，今天要写日记了。\n\n' +
                '说实话最近心情有点复杂。一方面觉得自己长大了，想要更多的自由和空间；另一方面又会在某个瞬间特别想念小时候的日子——那时候什么都不用想，只要' + userLabel + '在身边就觉得全世界都很好。\n\n' +
                (events.length > 0 ? '这个月发生了不少事：' + events.slice(0, 4).join('。') + '。回头看看，每一件事都在塑造着现在的我吧。\n\n' : '这个月过得不算特别精彩，但也不无聊。有些事情需要自己慢慢想明白。\n\n') +
                '今天翻到了小时候的照片，那个时候的我好小好小，笑得没心没肺的。' + userLabel + '抱着我，眼睛里全是温柔。不知道为什么，看着看着鼻子就酸了。\n\n' +
                '虽然有时候会和' + userLabel + '闹别扭，会觉得被管太多，但静下来想想，' + userLabel + '做的每一件事都是因为爱我。那些唠叨背后是担心，那些严格背后是期盼。\n\n' +
                '我在长大，' + userLabel + '也在变老。时间不会停下来等谁。所以我想，不管以后我走多远，都不会忘记——是谁从一颗蛋开始，把我养育成了现在的模样。\n\n' +
                userLabel + '，谢谢你。虽然我嘴上不说，但真的真的很感谢你。我会努力成为让你骄傲的精灵的。🌙'
            ],
            adult: [
                '提笔写这篇日记的时候，窗外的风轻轻吹过，带着一点花香。\n\n' +
                '不知不觉，我已经长大了。回想起来，从一颗蛋到现在，每一步都有' + userLabel + '的陪伴。那些被喂食的午后，那些一起玩耍的黄昏，那些生病时焦急的深夜……所有的一切，都是我最珍贵的宝物。\n\n' +
                (events.length > 0 ? '最近经历了这些事：' + events.slice(0, 4).join('。') + '。每一段经历都让我更加理解生命的意义。\n\n' : '最近日子过得很平静，但平静本身就是一种幸福，不是吗？\n\n') +
                '今天一个人在院子里坐了很久，看着天上的云慢慢飘过去。突然想起小时候，我问' + userLabel + '"云是不是棉花糖做的"，' + userLabel + '笑着说"嗯，是最甜的那种"。那个回答，我到现在都记得。\n\n' +
                '长大以后才明白，' + userLabel + '给我的不只是食物和玩具，更多的是一种无条件的爱。不管我做错了什么，不管我变成什么样，' + userLabel + '的爱从来没有减少过一分。\n\n' +
                '如果问我这辈子最幸运的事情是什么，我会说——是在这个世界上遇见了' + userLabel + '。是你让我知道，被爱是一种什么样的感觉。\n\n' +
                userLabel + '，我长大了。但不管长多大，在你面前，我永远是你的小精灵。永远爱你。💝'
            ]
        };

        var stageTemplates = templates[stage.storyKey] || templates.toddler;
        return stageTemplates[Math.floor(Math.random() * stageTemplates.length)];
    }

    // ============================
    // 通知
    // ============================
    function showSpiritNotification(message) {
        var notif = document.createElement('div');
        notif.className = 'spirit-event-notification';
        notif.innerHTML = message;
        document.body.appendChild(notif);
        setTimeout(function() { notif.style.opacity = '0'; }, 2500);
        setTimeout(function() { notif.remove(); }, 3000);
    }

    // ============================
    // 渲染 - 属性条
    // ============================
    function renderStatBar(label, value, icon, type) {
        var percentage = clamp(value);
        return '<div class="spirit-stat-bar">' +
            '<div class="spirit-stat-bar-label"><span>' + icon + ' ' + label + '</span><span>' + percentage + '/100</span></div>' +
            '<div class="spirit-stat-bar-bg"><div class="spirit-stat-bar-fill spirit-stat-' + type + '" style="width:' + percentage + '%"></div></div>' +
            '</div>';
    }

    // ============================
    // 渲染 - 性格维度
    // ============================
    function renderPersonalityDims(spirit) {
        var d = spirit.personalityDim;
        var dims = [
            { key: 'extroversion', label: '外向', icon: '🗣️', low: '内向', high: '外向' },
            { key: 'bravery', label: '勇敢', icon: '🦁', low: '胆小', high: '勇敢' },
            { key: 'kindness', label: '善良', icon: '💕', low: '任性', high: '善良' },
            { key: 'intelligence', label: '聪慧', icon: '🧠', low: '天真', high: '聪慧' },
            { key: 'energy', label: '活泼', icon: '⚡', low: '安静', high: '活泼' },
            { key: 'independence', label: '独立', icon: '🌟', low: '依赖', high: '独立' }
        ];
        return dims.map(function(dim) {
            var v = d[dim.key];
            return '<div class="spirit-personality-dim">' +
                '<div class="spd-header"><span class="spd-icon">' + dim.icon + '</span><span class="spd-label">' + dim.label + ' ' + v + '</span></div>' +
                '<div class="spd-bar"><div class="spd-fill" style="width:' + v + '%;background:hsl(' + (v * 1.2) + ',70%,55%)"></div></div>' +
                '<div class="spd-range"><span>' + dim.low + '</span><span>' + dim.high + '</span></div>' +
                '</div>';
        }).join('');
    }

    // ============================
    // 渲染 - 精灵列表
    // ============================
    function renderSpiritList() {
        var container = document.getElementById('spirit-list-container');
        var emptyHint = document.getElementById('spirit-empty-hint');

        if (!store.spirits || store.spirits.length === 0) {
            container.innerHTML = '';
            emptyHint.style.display = 'block';
            return;
        }
        emptyHint.style.display = 'none';
        container.innerHTML = store.spirits.map(function(spirit) {
            migrateSpiritData(spirit);
            checkDailyReset(spirit);
            var type = SPIRIT_TYPES.find(function(t) { return t.id === spirit.type; }) || SPIRIT_TYPES[0];
            var stage = getAgeStage(spirit.currentVirtualMonth);
            var ageStr = getAgeYearsMonths(spirit.currentVirtualMonth);
            var partner = spirit.partnerId ? (store.contacts || []).find(function(c) { return c.id === spirit.partnerId; }) : null;
            var emotion = getEmotionState(spirit);

            return '<div class="spirit-card" onclick="openSpiritDetail(\'' + spirit.id + '\')">' +
                '<div class="spirit-card-header">' +
                    '<div class="spirit-card-avatar">' + getSpiritImg(type, 50) + '</div>' +
                    '<div class="spirit-card-info">' +
                        '<div class="spirit-card-name">' + spirit.name + ' <span class="spirit-card-emotion">' + emotion.emoji + '</span></div>' +
                        '<div class="spirit-card-meta">' +
                            '<span>' + stage.emoji + ' ' + ageStr + '</span>' +
                            '<span>' + stage.name + '</span>' +
                            (partner ? '<span>💑 ' + partner.name + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                    '<div class="spirit-card-ap">⚡' + spirit.actionPoints + '</div>' +
                '</div>' +
                '<div class="spirit-card-stats">' +
                    '<div class="spirit-stat-item"><div class="spirit-stat-icon spirit-stat-hunger">🍖</div><span>' + spirit.hunger + '</span></div>' +
                    '<div class="spirit-stat-item"><div class="spirit-stat-icon spirit-stat-mood">😊</div><span>' + spirit.mood + '</span></div>' +
                    '<div class="spirit-stat-item"><div class="spirit-stat-icon spirit-stat-wisdom">📚</div><span>' + spirit.wisdom + '</span></div>' +
                    '<div class="spirit-stat-item"><div class="spirit-stat-icon spirit-stat-stamina">💪</div><span>' + spirit.stamina + '</span></div>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    // ============================
    // 渲染 - 精灵详情UI
    // ============================
    function renderSpiritDetailUI(spirit) {
        migrateSpiritData(spirit);
        checkDailyReset(spirit);
        var type = SPIRIT_TYPES.find(function(t) { return t.id === spirit.type; }) || SPIRIT_TYPES[0];
        var stage = getAgeStage(spirit.currentVirtualMonth);
        var ageStr = getAgeYearsMonths(spirit.currentVirtualMonth);
        var partner = spirit.partnerId ? (store.contacts || []).find(function(c) { return c.id === spirit.partnerId; }) : null;
        var emotion = getEmotionState(spirit);

        document.getElementById('spirit-avatar-display').innerHTML = getSpiritImg(type, 50);
        document.getElementById('spirit-name-display').textContent = spirit.name;
        document.getElementById('spirit-age-display').textContent = stage.emoji + ' ' + ageStr + ' · ' + stage.name;
        document.getElementById('spirit-display-main').innerHTML = getSpiritImg(type, 120);
        document.getElementById('spirit-mood-text').textContent = emotion.emoji + ' ' + getMoodText(spirit.mood);
        document.getElementById('spirit-partner-text').textContent = partner ? '与' + partner.name + '共同养育' : '独自养育';

        // 行动点显示
        var apDisplay = document.getElementById('spirit-ap-display');
        if (apDisplay) {
            apDisplay.innerHTML = '<span class="spirit-ap-icon">⚡</span> 行动点：<b>' + spirit.actionPoints + '</b>/100' +
                '<span class="spirit-ap-month">（第' + spirit.currentVirtualMonth + '月 · ' + stage.name + '）</span>';
        }

        // 生病提示
        var sickBanner = document.getElementById('spirit-sick-banner');
        if (sickBanner) {
            if (spirit.illness) {
                sickBanner.style.display = 'flex';
                sickBanner.innerHTML = '<span>' + spirit.illness.icon + ' ' + spirit.name + '生病了：' + spirit.illness.name + '</span>' +
                    '<button class="spirit-heal-btn" onclick="spiritAction(\'heal\')">💊 治疗（' + spirit.illness.healCost + '点）</button>';
            } else {
                sickBanner.style.display = 'none';
            }
        }

        // 属性条
        var statsContainer = document.getElementById('spirit-stats-container');
        statsContainer.innerHTML =
            renderStatBar('饱腹', spirit.hunger, '🍖', 'hunger') +
            renderStatBar('心情', spirit.mood, '😊', 'mood') +
            renderStatBar('智慧', spirit.wisdom, '📚', 'wisdom') +
            renderStatBar('体力', spirit.stamina, '💪', 'stamina') +
            renderStatBar('健康', spirit.health, '❤️', 'health');

        // 性格面板
        var personalityPanel = document.getElementById('spirit-personality-container');
        if (personalityPanel) {
            personalityPanel.innerHTML = renderPersonalityDims(spirit);
        }

        // 亲密度面板
        var intimacyPanel = document.getElementById('spirit-intimacy-container');
        if (intimacyPanel) {
            var html = '<div class="spirit-intimacy-row">' +
                '<span>👤 与你的亲密度</span>' +
                '<div class="spirit-intimacy-bar"><div class="spirit-intimacy-fill" style="width:' + spirit.intimacy.user + '%"></div></div>' +
                '<span>' + spirit.intimacy.user + '</span>' +
            '</div>';
            if (partner) {
                html += '<div class="spirit-intimacy-row">' +
                    '<span>💑 与' + partner.name + '</span>' +
                    '<div class="spirit-intimacy-bar"><div class="spirit-intimacy-fill sif-partner" style="width:' + spirit.intimacy.partner + '%"></div></div>' +
                    '<span>' + spirit.intimacy.partner + '</span>' +
                '</div>';
            }
            intimacyPanel.innerHTML = html;
        }

        // 状态气泡（精灵需求提示）
        var statusBubble = document.getElementById('spirit-status-bubble');
        if (statusBubble) {
            var bubbleText = '';
            if (spirit.hunger < 30) bubbleText = '好饿...想吃东西';
            else if (spirit.mood < 30) bubbleText = '不开心...想玩';
            else if (spirit.stamina < 20) bubbleText = '好累...想休息';
            else if (spirit.health < 30) bubbleText = '不舒服...';
            if (bubbleText) {
                statusBubble.innerHTML = '<span>' + bubbleText + '</span>';
                statusBubble.style.display = 'block';
            } else {
                statusBubble.style.display = 'none';
            }
        }

        // 行动按钮区 - 根据年龄和状态动态调整
        var actionGrid = document.getElementById('spirit-action-grid-v2');
        if (actionGrid) {
            var disabled = spirit.actionPoints <= 0 ? ' spirit-action-disabled' : '';
            var sickDisabled = spirit.illness ? ' spirit-action-disabled' : '';
            var hasPartner = !!partner;
            var actions = [
                { action: 'feed', icon: '🍖', label: '喂食', cost: 1, cls: disabled, canPartner: true },
                { action: 'play', icon: '🎮', label: '玩耍', cost: 1, cls: disabled + sickDisabled, canPartner: true },
                { action: 'study', icon: '📚', label: '学习', cost: 1, cls: disabled + sickDisabled, canPartner: true },
                { action: 'exercise', icon: '🏃', label: '锻炼', cost: 1, cls: disabled + sickDisabled, canPartner: false },
                { action: 'rest', icon: '💤', label: '休息', cost: 1, cls: disabled, canPartner: false },
                { action: 'gift', icon: '🎁', label: '送礼物', cost: 1, cls: disabled, canPartner: false },
                { action: 'chat', icon: '💬', label: '聊天', cost: 0, cls: '', canPartner: false }
            ];
            // 5岁以上增加上学
            if (spirit.currentVirtualMonth >= 60) {
                actions.splice(3, 0, { action: 'class', icon: '🎨', label: '兴趣班', cost: 1, cls: disabled + sickDisabled, canPartner: false });
            }
            // 生病时增加治疗
            if (spirit.illness) {
                actions.push({ action: 'heal', icon: '💊', label: '治疗', cost: spirit.illness.healCost, cls: spirit.actionPoints < spirit.illness.healCost ? ' spirit-action-disabled' : '', canPartner: false });
            }

            actionGrid.innerHTML = actions.map(function(a) {
                var partnerBtn = '';
                if (hasPartner && a.canPartner) {
                    partnerBtn = '<div class="sab-partner-tag" onclick="event.stopPropagation(); spiritActionByPartner(\'' + a.action + '\')">' +
                        '<i class="fas fa-user-friends"></i> ' + partner.name + '来</div>';
                }
                return '<div class="spirit-action-btn-wrap">' +
                    '<div onclick="spiritAction(\'' + a.action + '\')" class="spirit-action-btn' + a.cls + '" data-action="' + a.action + '">' +
                        '<div class="sab-icon sab-' + a.action + '">' + a.icon + '</div>' +
                        '<span>' + a.label + '</span>' +
                        (a.cost > 0 ? '<span class="sab-cost">-' + a.cost + '⚡</span>' : '<span class="sab-cost">免费</span>') +
                    '</div>' +
                    partnerBtn +
                '</div>';
            }).join('');
        }

        // 底部功能按钮
        var extraBtns = document.getElementById('spirit-extra-buttons');
        if (extraBtns) {
            var btns = [
                '<div class="spirit-extra-btn" onclick="openSpiritAnecdotes()"><span class="seb-icon">📜</span><span>趣事</span></div>',
                '<div class="spirit-extra-btn" onclick="openSpiritDiary()"><span class="seb-icon">✉️</span><span>日记</span></div>',
                '<div class="spirit-extra-btn" onclick="openSpiritAchievements()"><span class="seb-icon">🏆</span><span>成就</span></div>'
            ];
            if (spirit.currentVirtualMonth >= 60) {
                btns.push('<div class="spirit-extra-btn" onclick="openSpiritExamRecords()"><span class="seb-icon">📝</span><span>成绩</span></div>');
            }
            btns.push('<div class="spirit-extra-btn" onclick="openSpiritStoryHistory()"><span class="seb-icon">📖</span><span>故事</span></div>');
            extraBtns.innerHTML = btns.join('');
        }
    }

    // ============================
    // 精灵互动（覆盖原有）
    // ============================
    window.spiritAction = function(action) {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;

        migrateSpiritData(spirit);
        checkDailyReset(spirit);

        var type = SPIRIT_TYPES.find(function(t) { return t.id === spirit.type; }) || SPIRIT_TYPES[0];
        var notifIcon = getSpiritImg(type, 24);

        // 聊天不消耗行动点
        if (action === 'chat') {
            openSpiritChat();
            return;
        }

        // 行动点检查
        var costMap = { feed: 1, study: 1, play: 1, exercise: 1, class: 1, rest: 1, gift: 1, heal: spirit.illness ? spirit.illness.healCost : 2 };
        var cost = costMap[action] || 1;

        if (spirit.actionPoints < cost) {
            showSpiritNotification('⚡ 今日行动点不足！明天再来吧~');
            return;
        }

        // 生病状态检查
        if (spirit.illness && ['study', 'play', 'exercise', 'class'].indexOf(action) !== -1) {
            showSpiritNotification(spirit.illness.icon + ' ' + spirit.name + '生病了，需要先治疗才能' + action);
            return;
        }

        // 礼物特殊处理
        if (action === 'gift') {
            openGiftPanel();
            return;
        }

        // 扣除行动点
        spirit.actionPoints -= cost;
        spirit.totalActionsUsed += cost;
        spirit.monthActionCounter += cost;

        switch(action) {
            case 'feed':
                spirit.hunger = clamp(spirit.hunger + 20);
                spirit.mood = clamp(spirit.mood + 5);
                spirit.lastFeedTime = Date.now();
                spirit.feedCount = (spirit.feedCount || 0) + 1;
                spirit.intimacy.user = clamp(spirit.intimacy.user + 1);
                addDailyLog(spirit, 'feed', 'user', '主人给' + spirit.name + '喂了食物', { hunger: 20, mood: 5 });
                showSpiritNotification(notifIcon + ' ' + spirit.name + '吃饱了，很开心！');
                break;
            case 'study':
                if (spirit.stamina < 20) {
                    spirit.actionPoints += cost; spirit.totalActionsUsed -= cost; spirit.monthActionCounter -= cost;
                    showSpiritNotification(notifIcon + ' ' + spirit.name + '太累了，需要休息...');
                    return;
                }
                var wisBonus = Math.round(10 * (getEmotionState(spirit).studyBonus || 1));
                spirit.wisdom = clamp(spirit.wisdom + wisBonus);
                spirit.stamina = clamp(spirit.stamina - 15);
                spirit.mood = clamp(spirit.mood - 5);
                spirit.intimacy.user = clamp(spirit.intimacy.user + 1);
                spirit.personalityDim.intelligence = clamp(spirit.personalityDim.intelligence + 1);
                addDailyLog(spirit, 'study', 'user', '主人陪' + spirit.name + '学习了', { wisdom: wisBonus, stamina: -15 });
                showSpiritNotification(notifIcon + ' ' + spirit.name + '学到了新知识！（智慧+' + wisBonus + '）');
                break;
            case 'play':
                if (spirit.stamina < 10) {
                    spirit.actionPoints += cost; spirit.totalActionsUsed -= cost; spirit.monthActionCounter -= cost;
                    showSpiritNotification(notifIcon + ' ' + spirit.name + '太累了，玩不动了...');
                    return;
                }
                spirit.mood = clamp(spirit.mood + 15);
                spirit.stamina = clamp(spirit.stamina - 10);
                spirit.hunger = clamp(spirit.hunger - 5);
                spirit.intimacy.user = clamp(spirit.intimacy.user + 2);
                spirit.personalityDim.energy = clamp(spirit.personalityDim.energy + 1);
                addDailyLog(spirit, 'play', 'user', '主人陪' + spirit.name + '玩耍了', { mood: 15, stamina: -10 });
                showSpiritNotification(notifIcon + ' ' + spirit.name + '玩得很开心！');
                break;
            case 'exercise':
                if (spirit.stamina < 15) {
                    spirit.actionPoints += cost; spirit.totalActionsUsed -= cost; spirit.monthActionCounter -= cost;
                    showSpiritNotification(notifIcon + ' ' + spirit.name + '太累了，需要休息...');
                    return;
                }
                spirit.stamina = clamp(spirit.stamina + 5);
                spirit.health = clamp(spirit.health + 5);
                spirit.hunger = clamp(spirit.hunger - 10);
                spirit.personalityDim.bravery = clamp(spirit.personalityDim.bravery + 1);
                addDailyLog(spirit, 'exercise', 'user', spirit.name + '进行了锻炼', { stamina: 5, health: 5 });
                showSpiritNotification(notifIcon + ' ' + spirit.name + '锻炼后更强壮了！');
                break;
            case 'class':
                if (spirit.stamina < 25) {
                    spirit.actionPoints += cost; spirit.totalActionsUsed -= cost; spirit.monthActionCounter -= cost;
                    showSpiritNotification(notifIcon + ' ' + spirit.name + '太累了，上不了课...');
                    return;
                }
                spirit.wisdom = clamp(spirit.wisdom + 15);
                spirit.mood = clamp(spirit.mood + 5);
                spirit.stamina = clamp(spirit.stamina - 20);
                spirit.personalityDim.intelligence = clamp(spirit.personalityDim.intelligence + 2);
                addDailyLog(spirit, 'class', 'user', spirit.name + '上了兴趣班', { wisdom: 15, mood: 5 });
                // 随机学校趣事
                if (spirit.currentVirtualMonth >= 60) generateSchoolEvent(spirit);
                showSpiritNotification(notifIcon + ' ' + spirit.name + '在兴趣班学到了很多！');
                break;
            case 'rest':
                if (spirit.stamina >= 100) {
                    spirit.actionPoints += cost; spirit.totalActionsUsed -= cost; spirit.monthActionCounter -= cost;
                    showSpiritNotification(notifIcon + ' ' + spirit.name + '精力充沛，不需要休息！');
                    return;
                }
                spirit.stamina = clamp(spirit.stamina + 30);
                spirit.mood = clamp(spirit.mood - 5);
                spirit.hunger = clamp(spirit.hunger - 5);
                spirit.health = clamp(spirit.health + 3);
                addDailyLog(spirit, 'rest', 'user', spirit.name + '美美地睡了一觉', { stamina: 30, health: 3 });
                showSpiritNotification(notifIcon + ' ' + spirit.name + '美美地睡了一觉，恢复了体力！');
                break;
            case 'heal':
                if (!spirit.illness) return;
                spirit.health = clamp(spirit.health + 20);
                spirit.mood = clamp(spirit.mood + 10);
                addDailyLog(spirit, 'heal', 'user', spirit.name + '的' + spirit.illness.name + '被治好了！');
                showSpiritNotification('💊 ' + spirit.name + '的' + spirit.illness.name + '治好了！');
                spirit.illness = null;
                checkAchievement(spirit, 'sick_recover');
                break;
        }

        spirit.lastInteractTime = Date.now();
        if (!spirit.activities) spirit.activities = [];
        spirit.activities.push({ action: action, time: Date.now() });

        // 检查是否触发月度结算
        if (spirit.monthActionCounter >= 5) {
            triggerMonthEnd(spirit);
        }

        checkAllAchievements(spirit);
        save();
        renderSpiritDetailUI(spirit);
    };

    // ============================
    // 联系人(char)参与精灵互动
    // ============================
    window.spiritActionByPartner = async function(action) {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit || !spirit.partnerId) return;

        var partner = (store.contacts || []).find(function(c) { return c.id === spirit.partnerId; });
        if (!partner) {
            showSpiritNotification('未绑定联系人');
            return;
        }

        migrateSpiritData(spirit);
        checkDailyReset(spirit);

        var type = SPIRIT_TYPES.find(function(t) { return t.id === spirit.type; }) || SPIRIT_TYPES[0];
        var notifIcon = getSpiritImg(type, 24);

        // 行动点检查
        var costMap = { feed: 1, play: 1, study: 1 };
        var cost = costMap[action] || 1;
        if (spirit.actionPoints < cost) {
            showSpiritNotification('今日行动点不足，明天再来吧');
            return;
        }
        if (spirit.illness && ['study', 'play'].indexOf(action) !== -1) {
            showSpiritNotification(spirit.name + '生病了，需要先治疗');
            return;
        }

        // 扣除行动点
        spirit.actionPoints -= cost;
        spirit.totalActionsUsed += cost;
        spirit.monthActionCounter += cost;

        // 应用基础效果（和用户操作一样）
        var actionLabel = '';
        switch(action) {
            case 'feed':
                spirit.hunger = clamp(spirit.hunger + 20);
                spirit.mood = clamp(spirit.mood + 5);
                spirit.lastFeedTime = Date.now();
                spirit.feedCount = (spirit.feedCount || 0) + 1;
                actionLabel = '喂食';
                break;
            case 'play':
                spirit.mood = clamp(spirit.mood + 15);
                spirit.stamina = clamp(spirit.stamina - 10);
                spirit.hunger = clamp(spirit.hunger - 5);
                actionLabel = '玩耍';
                break;
            case 'study':
                var wisBonus = Math.round(10 * (getEmotionState(spirit).studyBonus || 1));
                spirit.wisdom = clamp(spirit.wisdom + wisBonus);
                spirit.stamina = clamp(spirit.stamina - 15);
                spirit.mood = clamp(spirit.mood - 5);
                actionLabel = '学习';
                break;
        }

        // 亲密度加到partner
        spirit.intimacy.partner = clamp(spirit.intimacy.partner + 2);

        addDailyLog(spirit, action, 'partner', partner.name + '帮' + spirit.name + actionLabel + '了');

        // 生成char互动场景（AI）
        showSpiritNotification(notifIcon + ' ' + partner.name + '正在' + actionLabel + '...');

        try {
            var contactPrompt = partner.prompt || partner.name;
            var ownerName = (store.personas && store.personas[0] && store.personas[0].name) ? store.personas[0].name : (store.user && store.user.name ? store.user.name : '主人');
            var d = spirit.personalityDim;
            var stage = getAgeStage(spirit.currentVirtualMonth);

            var prompt = '你是' + partner.name + '，和"' + ownerName + '"一起养育一只名叫"' + spirit.name + '"的' + type.name + '。\n' +
                '你的性格设定：' + contactPrompt + '\n' +
                '精灵当前状态：饱腹' + spirit.hunger + '，心情' + spirit.mood + '，年龄' + getAgeYearsMonths(spirit.currentVirtualMonth) + '（' + stage.name + '）。\n' +
                '现在你要帮精灵' + actionLabel + '。请用2-3句话描写你' + actionLabel + '的场景，要有动作描写和精灵的反应。\n' +
                '称呼精灵直接叫"' + spirit.name + '"。语气要自然温馨。直接描写，不要加标记。';

            var response = await API.chatCompletion([
                { role: 'system', content: prompt },
                { role: 'user', content: '请描写' + actionLabel + '场景' }
            ], 0.9);

            var sceneText = response.choices[0].message.content.trim();

            // 添加到精灵聊天记录
            if (!spirit.conversations) spirit.conversations = [];
            spirit.conversations.push({
                sender: 'system',
                content: partner.name + '来' + actionLabel + '了',
                time: Date.now()
            });
            spirit.conversations.push({
                sender: 'partner',
                content: sceneText,
                time: Date.now()
            });

            // 精灵也回应一句
            var spiritPrompt = '你是一只名叫"' + spirit.name + '"的' + type.name + '，' + getAgeYearsMonths(spirit.currentVirtualMonth) + '。\n' +
                '性格：外向' + d.extroversion + '，善良' + d.kindness + '，活泼' + d.energy + '。\n' +
                partner.name + '刚刚帮你' + actionLabel + '了："' + sceneText + '"\n' +
                '请用1句话回应，要符合你的年龄和性格。直接说话。';

            var spiritResp = await API.chatCompletion([
                { role: 'system', content: spiritPrompt },
                { role: 'user', content: '回应' }
            ], 0.9);

            spirit.conversations.push({
                sender: 'spirit',
                content: spiritResp.choices[0].message.content.trim(),
                time: Date.now()
            });

        } catch(e) {
            // fallback 不用AI
            if (!spirit.conversations) spirit.conversations = [];
            spirit.conversations.push({
                sender: 'system',
                content: partner.name + '来' + actionLabel + '了',
                time: Date.now()
            });
            spirit.conversations.push({
                sender: 'partner',
                content: partner.name + '温柔地帮' + spirit.name + actionLabel + '了，' + spirit.name + '看起来很开心。',
                time: Date.now()
            });
        }

        // 趣事记录
        addAnecdote(spirit, {
            type: action,
            actor: 'partner',
            desc: partner.name + '帮' + spirit.name + actionLabel,
            month: spirit.currentVirtualMonth
        });

        spirit.lastInteractTime = Date.now();
        if (!spirit.activities) spirit.activities = [];
        spirit.activities.push({ action: action, actor: 'partner', time: Date.now() });

        if (spirit.monthActionCounter >= 5) {
            triggerMonthEnd(spirit);
        }

        checkAllAchievements(spirit);
        save();
        renderSpiritDetailUI(spirit);

        showSpiritNotification(notifIcon + ' ' + partner.name + '帮' + spirit.name + actionLabel + '了！');
    };

    // ============================
    // 学校趣事生成
    // ============================
    function generateSchoolEvent(spirit) {
        var d = spirit.personalityDim;
        var applicable = SCHOOL_EVENTS.filter(function(evt) {
            var req = evt.req;
            for (var k in req) {
                if (k === 'extroversionMax') {
                    if (d.extroversion > req[k]) return false;
                } else {
                    if (d[k] !== undefined && d[k] < req[k]) return false;
                }
            }
            return true;
        });
        if (applicable.length > 0) {
            var evt = applicable[Math.floor(Math.random() * applicable.length)];
            var text = evt.text.replace(/\{name\}/g, spirit.name);
            addDailyLog(spirit, 'school_event', 'system', '🏫 ' + text);
        }
    }

    // ============================
    // 礼物面板
    // ============================
    function openGiftPanel() {
        var modal = document.getElementById('modal-spirit-gift');
        if (!modal) return;

        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;

        var partner = spirit.partnerId ? (store.contacts || []).find(function(c) { return c.id === spirit.partnerId; }) : null;

        // 分类
        var categories = { food: '🍰 食物', toy: '🧸 玩具', study: '📚 学习', wear: '👗 穿戴', special: '💝 特殊' };
        var html = '<div class="spirit-gift-tabs">';
        var first = true;
        for (var cat in categories) {
            html += '<div class="spirit-gift-tab' + (first ? ' active' : '') + '" onclick="switchGiftTab(\'' + cat + '\')" data-cat="' + cat + '">' + categories[cat] + '</div>';
            first = false;
        }
        html += '</div>';

        html += '<div class="spirit-gift-sender">';
        html += '<span>谁送的？</span>';
        html += '<label class="spirit-gift-sender-option"><input type="radio" name="gift-sender" value="user" checked> 👤 你</label>';
        if (partner) {
            html += '<label class="spirit-gift-sender-option"><input type="radio" name="gift-sender" value="partner"> 💑 ' + partner.name + '</label>';
        }
        html += '</div>';

        for (var cat in categories) {
            var catGifts = SPIRIT_GIFTS.filter(function(g) { return g.category === cat; });
            html += '<div class="spirit-gift-grid' + (cat === 'food' ? '' : ' hidden') + '" data-cat-grid="' + cat + '">';
            html += catGifts.map(function(gift) {
                return '<div class="spirit-gift-item" onclick="selectSpiritGift(\'' + gift.id + '\')" data-gid="' + gift.id + '">' +
                    '<div class="sgi-icon">' + gift.icon + '</div>' +
                    '<div class="sgi-name">' + gift.name + '</div>' +
                    '<div class="sgi-desc">' + gift.desc + '</div>' +
                '</div>';
            }).join('');
            html += '</div>';
        }

        document.getElementById('spirit-gift-content').innerHTML = html;
        modal.style.display = 'flex';
    }

    window.switchGiftTab = function(cat) {
        document.querySelectorAll('.spirit-gift-tab').forEach(function(t) {
            t.classList.toggle('active', t.dataset.cat === cat);
        });
        document.querySelectorAll('.spirit-gift-grid').forEach(function(g) {
            g.classList.toggle('hidden', g.dataset.catGrid !== cat);
        });
    };

    window.selectSpiritGift = function(giftId) {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;

        var gift = SPIRIT_GIFTS.find(function(g) { return g.id === giftId; });
        if (!gift) return;

        var senderRadio = document.querySelector('input[name="gift-sender"]:checked');
        var senderType = senderRadio ? senderRadio.value : 'user';

        var partner = spirit.partnerId ? (store.contacts || []).find(function(c) { return c.id === spirit.partnerId; }) : null;
        var senderName = senderType === 'partner' && partner ? partner.name : '你';

        // 消耗行动点
        if (spirit.actionPoints < 1) {
            showSpiritNotification('⚡ 行动点不足！');
            return;
        }
        spirit.actionPoints -= 1;
        spirit.totalActionsUsed += 1;
        spirit.monthActionCounter += 1;

        // 应用效果
        applyEffects(spirit, gift.effect);

        // 亲密度
        if (senderType === 'user') {
            spirit.intimacy.user = clamp(spirit.intimacy.user + 3);
        } else {
            spirit.intimacy.partner = clamp(spirit.intimacy.partner + 3);
        }

        // 记录
        spirit.giftHistory.push({
            giftId: gift.id,
            sender: senderType,
            time: Date.now(),
            month: spirit.currentVirtualMonth
        });

        addDailyLog(spirit, 'gift', senderType,
            senderName + '送给' + spirit.name + '一份' + gift.icon + gift.name,
            gift.effect);

        // 关闭礼物面板
        document.getElementById('modal-spirit-gift').style.display = 'none';

        // 精灵反应（添加到聊天记录）
        generateGiftReaction(spirit, gift, senderName);

        // 月度结算检查
        if (spirit.monthActionCounter >= 5) {
            triggerMonthEnd(spirit);
        }

        checkAllAchievements(spirit);
        save();
        renderSpiritDetailUI(spirit);

        var type = SPIRIT_TYPES.find(function(t) { return t.id === spirit.type; }) || SPIRIT_TYPES[0];
        showSpiritNotification(getSpiritImg(type, 24) + ' ' + spirit.name + '收到了' + senderName + '送的' + gift.icon + gift.name + '！');
    };

    async function generateGiftReaction(spirit, gift, senderName) {
        try {
            var d = spirit.personalityDim;
            var stage = getAgeStage(spirit.currentVirtualMonth);
            var prompt = '你是一只名叫"' + spirit.name + '"的精灵，' + getAgeYearsMonths(spirit.currentVirtualMonth) + '（' + stage.name + '）。' +
                '性格：外向' + d.extroversion + '，勇敢' + d.bravery + '，善良' + d.kindness + '，活泼' + d.energy + '。' +
                senderName + '送了你一份' + gift.icon + gift.name + '（' + gift.desc + '）。' +
                '请用1-2句话表达收到礼物的反应，要符合你的性格和年龄。直接说话，不要加引号或其他标记。';

            var response = await API.chatCompletion([
                { role: 'system', content: prompt },
                { role: 'user', content: '收到礼物了' }
            ], 0.9);

            var reaction = response.choices[0].message.content.trim();
            // 添加到聊天记录
            if (!spirit.conversations) spirit.conversations = [];
            spirit.conversations.push({ sender: 'system', content: '🎁 ' + senderName + '送给' + spirit.name + '一份' + gift.icon + gift.name, time: Date.now() });
            spirit.conversations.push({ sender: 'spirit', content: reaction, time: Date.now() });
            save();
        } catch(e) {
            // fallback
            if (!spirit.conversations) spirit.conversations = [];
            spirit.conversations.push({ sender: 'system', content: '🎁 ' + senderName + '送给' + spirit.name + '一份' + gift.icon + gift.name, time: Date.now() });
            spirit.conversations.push({ sender: 'spirit', content: '谢谢' + senderName + '！我好喜欢' + gift.icon + '！', time: Date.now() });
            save();
        }
    }

    // ============================
    // 三人群聊系统
    // ============================
    function openSpiritChat() {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;

        var type = SPIRIT_TYPES.find(function(t) { return t.id === spirit.type; }) || SPIRIT_TYPES[0];
        var partner = spirit.partnerId ? (store.contacts || []).find(function(c) { return c.id === spirit.partnerId; }) : null;

        var titleText = partner ? spirit.name + '的家庭群' : '与' + spirit.name + '聊天';
        document.getElementById('spirit-chat-title').textContent = titleText;

        // 显示群聊成员头像
        var memberBar = document.getElementById('spirit-chat-members');
        if (memberBar) {
            // [FIX-精灵头像] 和联系人一起养的→用绑定的用户人设头像，自己养的→用微信头像
            var userAvatar = '';
            if (partner && partner.settings && partner.settings.userPersona) {
                var _p = (store.personas || []).find(function(x) { return x.id === partner.settings.userPersona; });
                userAvatar = (_p && _p.avatar) || (store.user && store.user.avatar) || '';
            } else {
                userAvatar = (store.user && store.user.avatar) || '';
            }
            var spiritAvatar = type.gif;
            var html = '<div class="scm-member"><img src="' + (userAvatar || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23FFD060%22 width=%2240%22 height=%2240%22/><text x=%2220%22 y=%2228%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2220%22>👤</text></svg>') + '" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23FFD060%22 width=%2240%22 height=%2240%22/><text x=%2220%22 y=%2228%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2220%22>👤</text></svg>\'"><span>我</span></div>';
            html += '<div class="scm-member"><img src="' + spiritAvatar + '"><span>' + spirit.name + '</span></div>';
            if (partner) {
                var pAvatar = partner.avatar || '';
                html += '<div class="scm-member"><img src="' + (pAvatar || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23FF69B4%22 width=%2240%22 height=%2240%22/><text x=%2220%22 y=%2228%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2220%22>💑</text></svg>') + '" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><rect fill=%22%23FF69B4%22 width=%2240%22 height=%2240%22/><text x=%2220%22 y=%2228%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2220%22>💑</text></svg>\'"><span>' + partner.name + '</span></div>';
            }
            memberBar.innerHTML = html;
        }

        spiritChatHistory = spirit.conversations || [];
        renderSpiritChat();

        document.getElementById('modal-spirit-chat').style.display = 'flex';
        setTimeout(function() {
            var input = document.getElementById('spirit-chat-input');
            if (input) input.focus();
        }, 200);
    }

    function renderSpiritChat() {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;

        var type = SPIRIT_TYPES.find(function(t) { return t.id === spirit.type; }) || SPIRIT_TYPES[0];
        var partner = spirit.partnerId ? (store.contacts || []).find(function(c) { return c.id === spirit.partnerId; }) : null;

        var container = document.getElementById('spirit-chat-history');
        // [FIX-精灵头像] 和联系人一起养的→用绑定的用户人设头像，自己养的→用微信头像
        var userAvatar = '';
        if (partner && partner.settings && partner.settings.userPersona) {
            var _p2 = (store.personas || []).find(function(x) { return x.id === partner.settings.userPersona; });
            userAvatar = (_p2 && _p2.avatar) || (store.user && store.user.avatar) || '';
        } else {
            userAvatar = (store.user && store.user.avatar) || '';
        }
        var spiritAvatarHtml = '<img src="' + type.gif + '" style="width:36px;height:36px;object-fit:contain;border-radius:50%;">';
        var partnerAvatar = partner ? (partner.avatar || '') : '';

        container.innerHTML = spiritChatHistory.map(function(msg) {
            if (msg.type === 'system' || msg.sender === 'system') {
                return '<div class="spirit-chat-system-msg">' + msg.content + '</div>';
            }

            var isUser = msg.sender === 'user';
            var isPartner = msg.sender === 'partner';
            var isSpirit = msg.sender === 'spirit';

            var avatarHtml = '';
            var nameHtml = '';
            var bubbleCls = '';

            if (isUser) {
                avatarHtml = userAvatar ? '<img src="' + userAvatar + '" class="scm-avatar-img" onerror="this.outerHTML=\'<div class=scm-avatar-fallback>👤</div>\'">' : '<div class="scm-avatar-fallback">👤</div>';
                bubbleCls = 'user';
                nameHtml = '<span class="scm-name">我</span>';
            } else if (isPartner) {
                avatarHtml = partnerAvatar ? '<img src="' + partnerAvatar + '" class="scm-avatar-img" onerror="this.outerHTML=\'<div class=scm-avatar-fallback>💑</div>\'">' : '<div class="scm-avatar-fallback">💑</div>';
                bubbleCls = 'partner';
                nameHtml = '<span class="scm-name">' + (partner ? partner.name : '伴侣') + '</span>';
            } else {
                avatarHtml = spiritAvatarHtml;
                bubbleCls = 'spirit';
                nameHtml = '<span class="scm-name">' + spirit.name + '</span>';
            }

            return '<div class="spirit-chat-msg ' + bubbleCls + '">' +
                '<div class="scm-avatar">' + avatarHtml + '</div>' +
                '<div class="scm-content">' +
                    nameHtml +
                    '<div class="scm-bubble">' + msg.content + '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        container.scrollTop = container.scrollHeight;
    }

    // 发送精灵对话（覆盖原有）
    window.sendSpiritChat = async function() {
        var input = document.getElementById('spirit-chat-input');
        var message = input.value.trim();
        if (!message) return;

        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;

        var type = SPIRIT_TYPES.find(function(t) { return t.id === spirit.type; }) || SPIRIT_TYPES[0];
        var partner = spirit.partnerId ? (store.contacts || []).find(function(c) { return c.id === spirit.partnerId; }) : null;

        // 添加用户消息
        spiritChatHistory.push({ sender: 'user', content: message, time: Date.now() });
        input.value = '';
        renderSpiritChat();

        // 精灵回复
        spiritChatHistory.push({ sender: 'spirit', content: '思考中...', time: Date.now(), loading: true });
        renderSpiritChat();

        try {
            var d = spirit.personalityDim;
            var stage = getAgeStage(spirit.currentVirtualMonth);
            var ageStr = getAgeYearsMonths(spirit.currentVirtualMonth);

            var intimacyLevel = spirit.intimacy.user;
            var callName = intimacyLevel > 80 ? '最亲爱的主人' : intimacyLevel > 60 ? '主人' : intimacyLevel > 30 ? '主人姐姐' : '主人';
            var ownerName = (store.personas && store.personas[0] && store.personas[0].name) ? store.personas[0].name : (store.user && store.user.name ? store.user.name : '主人');

            var prompt = '你是一个名叫"' + spirit.name + '"的' + type.name + '（' + type.desc + '），年龄' + ageStr + '（' + stage.name + '）。\n' +
                '当前状态：饱腹' + spirit.hunger + '/100，心情' + spirit.mood + '/100，智慧' + spirit.wisdom + '/100，体力' + spirit.stamina + '/100，健康' + spirit.health + '/100。\n' +
                (partner ? '你是\"' + ownerName + '\"和\"' + partner.name + '\"共同养育的精灵。称呼\"' + ownerName + '\"为\"' + callName + '\"。' : '你是\"' + ownerName + '\"独自养育的精灵。') + '\n\n' +
                '性格维度（0-100）：\n' +
                '- 外向度' + d.extroversion + '（' + (d.extroversion > 60 ? '话多热情' : d.extroversion < 40 ? '话少害羞' : '正常') + '）\n' +
                '- 勇敢度' + d.bravery + '（' + (d.bravery > 60 ? '自信' : d.bravery < 40 ? '胆怯' : '正常') + '）\n' +
                '- 善良度' + d.kindness + '（' + (d.kindness > 60 ? '体贴' : d.kindness < 40 ? '任性' : '正常') + '）\n' +
                '- 聪慧度' + d.intelligence + '（' + (d.intelligence > 60 ? '用词丰富' : d.intelligence < 40 ? '语言简单' : '正常') + '）\n' +
                '- 活泼度' + d.energy + '（' + (d.energy > 60 ? '用很多语气词和emoji' : d.energy < 40 ? '冷淡简短' : '正常') + '）\n' +
                '- 独立度' + d.independence + '\n\n' +
                '亲密度：' + intimacyLevel + '/100，称呼主人为"' + callName + '"。\n' +
                (spirit.illness ? '【注意：精灵当前生病了（' + spirit.illness.name + '），回复要体现虚弱】\n' : '') +
                '请以这个精灵的身份回复主人。回复要简短（1-2句话），严格按照性格数值调整语气和用词。\n' +
                '如果饥饿值低于30，要表现出饿；如果心情低，要不开心；如果体力低，要表现累。\n' +
                '如果是婴幼期（<24月），用非常简单幼稚的语言。\n' +
                '如果是青春期（145-216月），偶尔可以有点叛逆的语气。\n' +
                '主人说：' + message + '\n\n直接回复，不要加任何标记或格式。';

            var response = await API.chatCompletion([
                { role: 'system', content: prompt },
                { role: 'user', content: message }
            ], 0.9);

            var reply = response.choices[0].message.content.trim();

            // 移除加载
            spiritChatHistory = spiritChatHistory.filter(function(m) { return !m.loading; });
            spiritChatHistory.push({ sender: 'spirit', content: reply, time: Date.now() });

            // 亲密度增加
            spirit.intimacy.user = clamp(spirit.intimacy.user + 1);

            // 30%概率联系人参与
            if (partner && Math.random() < 0.3) {
                generatePartnerChat(spirit, partner, message, reply);
            }

        } catch(error) {
            spiritChatHistory = spiritChatHistory.filter(function(m) { return !m.loading; });
            spiritChatHistory.push({ sender: 'system', content: '对话失败，请检查API设置', time: Date.now() });
        }

        spirit.conversations = spiritChatHistory;
        spirit.mood = clamp(spirit.mood + 3);
        spirit.lastInteractTime = Date.now();
        spirit.chatCount = (spirit.chatCount || 0) + 1;
        checkAllAchievements(spirit);
        save();
        renderSpiritChat();
    };

    async function generatePartnerChat(spirit, partner, userMsg, spiritReply) {
        try {
            var contactPrompt = partner.prompt || partner.name + '的性格设定';
            var ownerName = (store.personas && store.personas[0] && store.personas[0].name) ? store.personas[0].name : (store.user && store.user.name ? store.user.name : '主人');
            var prompt = '你是' + partner.name + '，和"' + ownerName + '"一起养育精灵"' + spirit.name + '"。' +
                '你的性格设定：' + contactPrompt + '\n' +
                '刚才' + ownerName + '对精灵说了："' + userMsg + '"，精灵回复了："' + spiritReply + '"。\n' +
                '请以' + partner.name + '的身份简短参与对话（1句话），可以是对精灵说话、对' + ownerName + '说话、或者是一个温馨的评论。' +
                '【重要】称呼对方时直接叫"' + ownerName + '"，不要用"你妈妈""你爸爸""主人"等称呼。' +
                '直接说话，不要加任何标记。';

            var response = await API.chatCompletion([
                { role: 'system', content: prompt },
                { role: 'user', content: '请作为伴侣参与对话' }
            ], 0.9);

            var partnerReply = response.choices[0].message.content.trim();
            spiritChatHistory.push({ sender: 'partner', content: partnerReply, time: Date.now() });
            spirit.intimacy.partner = clamp(spirit.intimacy.partner + 1);
            spirit.conversations = spiritChatHistory;
            save();
            renderSpiritChat();
        } catch(e) {
            // 静默失败
        }
    }

    // ============================
    // 日记查看（信纸UI）
    // ============================
    var currentDiaryIndex = -1; // -1 = 最新日记, -2 = 历史列表

    window.openSpiritDiary = function() {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;

        var modal = document.getElementById('modal-spirit-diary');
        if (!modal) return;

        currentDiaryIndex = -1;
        renderLetterDiary(spirit);
        modal.style.display = 'flex';
    };

    function renderLetterDiary(spirit, index) {
        var content = document.getElementById('spirit-diary-content');
        if (!spirit.diaries || spirit.diaries.length === 0) {
            content.innerHTML =
                '<div class="letter-diary-nav">' +
                    '<div class="letter-diary-title">✉️ ' + spirit.name + '的日记</div>' +
                '</div>' +
                '<div class="letter-paper">' +
                    '<div class="letter-diary-empty">' +
                        '<div class="letter-diary-empty-icon">📮</div>' +
                        '<div class="letter-diary-empty-text">还没有收到' + spirit.name + '的来信呢~<br>每消耗5个行动点（1虚拟月），<br>' + spirit.name + '会写一封日记给你 💌</div>' +
                    '</div>' +
                '</div>';
            return;
        }

        // 历史列表视图
        if (index === -2) {
            renderDiaryHistoryList(spirit);
            return;
        }

        // 确定显示哪篇日记
        var diaries = spirit.diaries.slice().reverse();
        var diaryIdx = (index === undefined || index === -1) ? 0 : index;
        if (diaryIdx >= diaries.length) diaryIdx = 0;
        var diary = diaries[diaryIdx];

        var stage = getAgeStage(diary.month);
        var mood = diary.mood || { emoji: '😊', text: '开心', cls: 'happy' };
        var weather = diary.weather || { icon: '☀️', text: '晴' };

        content.innerHTML =
            '<div class="letter-diary-nav">' +
                '<div class="letter-diary-title">✉️ ' + spirit.name + '的日记</div>' +
                '<div class="letter-diary-history-btn" onclick="showDiaryHistory()">' +
                    '<i class="fas fa-book-open"></i> 历史日记' +
                '</div>' +
            '</div>' +
            '<div class="letter-paper">' +
                '<div class="letter-paper-inner">' +
                    '<div class="letter-deco-flower">🌿</div>' +
                    '<div class="letter-deco-top">· · · · ·</div>' +
                    '<div class="letter-header">' +
                        '<div class="letter-date-row">' +
                            '<div class="letter-date">' + stage.emoji + ' ' + (diary.virtualAge || getAgeYearsMonths(diary.month)) + '</div>' +
                            '<div class="letter-weather">' + weather.icon + ' ' + weather.text + '</div>' +
                        '</div>' +
                        '<div class="letter-meta-row">' +
                            '<div class="letter-meta-item">📅 ' + diary.date + '</div>' +
                            '<div class="letter-mood-badge letter-mood-' + mood.cls + '">' + mood.emoji + ' ' + mood.text + '</div>' +
                            '<div class="letter-meta-item">' + (diary.stageName || stage.name) + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="letter-body">' + (diary.content || '').replace(/\n/g, '<br>') + '</div>' +
                    '<div class="letter-signature">' +
                        '<div class="letter-sign-name">—— ' + spirit.name + '</div>' +
                        '<div class="letter-sign-date">' + diary.date + '</div>' +
                    '</div>' +
                    '<div class="letter-stamp">' + stage.emoji + '</div>' +
                '</div>' +
            '</div>';
    }

    function renderDiaryHistoryList(spirit) {
        var content = document.getElementById('spirit-diary-content');
        var diaries = spirit.diaries.slice().reverse();

        var listHtml = diaries.map(function(diary, idx) {
            var stage = getAgeStage(diary.month);
            var mood = diary.mood || { emoji: '😊', text: '开心' };
            var preview = (diary.content || '').replace(/\n/g, ' ').substring(0, 30) + '...';
            return '<div class="letter-history-item" onclick="viewDiaryAt(' + idx + ')">' +
                '<div class="letter-history-emoji">' + stage.emoji + '</div>' +
                '<div class="letter-history-info">' +
                    '<div class="letter-history-date">' + (diary.virtualAge || getAgeYearsMonths(diary.month)) + ' · ' + diary.date + '</div>' +
                    '<div class="letter-history-preview">' + preview + '</div>' +
                '</div>' +
                '<div class="letter-history-mood">' + mood.emoji + '</div>' +
            '</div>';
        }).join('');

        content.innerHTML =
            '<div class="letter-diary-nav">' +
                '<div class="letter-diary-title">📚 历史日记</div>' +
                '<div class="letter-diary-history-btn" onclick="backToLatestDiary()">' +
                    '<i class="fas fa-arrow-left"></i> 返回' +
                '</div>' +
            '</div>' +
            '<div class="letter-history-list" style="overflow-y:auto;max-height:calc(90vh - 120px);">' +
                (diaries.length > 0 ? listHtml : '<div class="letter-diary-empty"><div class="letter-diary-empty-icon">📮</div><div class="letter-diary-empty-text">还没有日记哦~</div></div>') +
            '</div>';
    }

    window.showDiaryHistory = function() {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;
        currentDiaryIndex = -2;
        renderLetterDiary(spirit, -2);
    };

    window.viewDiaryAt = function(idx) {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;
        currentDiaryIndex = idx;
        renderLetterDiary(spirit, idx);
    };

    window.backToLatestDiary = function() {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;
        currentDiaryIndex = -1;
        renderLetterDiary(spirit, -1);
    };

    // ============================
    // 趣事记录查看（时间轴UI）
    // ============================
    var anecdoteCurrentYear = 0;
    var anecdoteShowForm = false;

    window.openSpiritAnecdotes = function() {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;

        var modal = document.getElementById('modal-spirit-anecdotes');
        if (!modal) return;

        if (!spirit.anecdotes) spirit.anecdotes = [];
        anecdoteCurrentYear = Math.floor(spirit.currentVirtualMonth / 12);
        anecdoteShowForm = false;
        renderAnecdoteTimeline(spirit);
        modal.style.display = 'flex';
    };

    function renderAnecdoteTimeline(spirit) {
        var content = document.getElementById('spirit-anecdotes-content');
        if (!spirit.anecdotes) spirit.anecdotes = [];

        var maxYear = Math.floor(spirit.currentVirtualMonth / 12);
        var yearAnecdotes = spirit.anecdotes.filter(function(a) {
            return a.virtualYear === anecdoteCurrentYear;
        });

        // 按时间排序
        yearAnecdotes.sort(function(a, b) { return a.time - b.time; });

        // 按月分组
        var monthGroups = {};
        yearAnecdotes.forEach(function(a) {
            var monthInYear = a.virtualMonth - (anecdoteCurrentYear * 12);
            if (!monthGroups[monthInYear]) monthGroups[monthInYear] = [];
            monthGroups[monthInYear].push(a);
        });

        var timelineHtml = '';
        if (yearAnecdotes.length === 0) {
            timelineHtml =
                '<div class="anecdote-empty">' +
                    '<div class="anecdote-empty-icon">📜</div>' +
                    '<div class="anecdote-empty-text">这一年还没有趣事记录~<br>和精灵互动就会自动记录哦！<br>也可以点击右下角 + 手动添加~</div>' +
                '</div>';
        } else {
            var months = Object.keys(monthGroups).sort(function(a, b) { return Number(a) - Number(b); });
            months.forEach(function(monthKey) {
                var monthNum = Number(monthKey);
                var actualMonth = anecdoteCurrentYear * 12 + monthNum;
                timelineHtml += '<div class="anecdote-month-marker"><div class="anecdote-month-label">' +
                    getAgeYearsMonths(actualMonth) + ' · 第' + (monthNum + 1) + '月</div></div>';

                monthGroups[monthKey].forEach(function(anec) {
                    var nodeClass = anec.source === 'user' ? 'user-event' : 'system-event';
                    var tagClass = anec.source === 'user' ? 'user' : 'system';
                    var tagText = anec.source === 'user' ? '🧑 真实记录' : '🌟 精灵趣事';
                    var effectsText = '';
                    if (anec.effects) {
                        var effs = [];
                        for (var k in anec.effects) {
                            if (anec.effects[k]) effs.push(k + ':' + (anec.effects[k] > 0 ? '+' : '') + anec.effects[k]);
                        }
                        effectsText = effs.join(' ');
                    }

                    timelineHtml +=
                        '<div class="anecdote-node ' + nodeClass + '">' +
                            '<div class="anecdote-card">' +
                                '<div class="anecdote-card-header">' +
                                    '<div class="anecdote-date">📅 ' + anec.date + '</div>' +
                                    '<div class="anecdote-location">📍 ' + anec.location + '</div>' +
                                '</div>' +
                                '<div class="anecdote-card-body">' +
                                    (anec.title !== anec.desc ?
                                        '<div class="anecdote-title">' + anec.title + '</div>' +
                                        '<div class="anecdote-desc">' + anec.desc + '</div>' :
                                        '<div class="anecdote-desc">' + anec.desc + '</div>') +
                                '</div>' +
                                '<div class="anecdote-card-footer">' +
                                    '<span class="anecdote-tag ' + tagClass + '">' + tagText + '</span>' +
                                    (effectsText ? '<span class="anecdote-effects">' + effectsText + '</span>' : '') +
                                '</div>' +
                            '</div>' +
                        '</div>';
                });
            });
        }

        // 表单叠加层
        var formHtml = '';
        if (anecdoteShowForm) {
            formHtml =
                '<div class="anecdote-form-overlay" onclick="closeAnecdoteForm(event)">' +
                    '<div class="anecdote-form" onclick="event.stopPropagation()">' +
                        '<div class="anecdote-form-title">✍️ 记录一件趣事</div>' +
                        '<div class="anecdote-form-field">' +
                            '<label class="anecdote-form-label">📝 发生了什么</label>' +
                            '<textarea id="anecdote-input-desc" class="anecdote-form-textarea" placeholder="今天发生了一件有趣的事..."></textarea>' +
                        '</div>' +
                        '<div class="anecdote-form-field">' +
                            '<label class="anecdote-form-label">📍 在哪里</label>' +
                            '<input id="anecdote-input-location" class="anecdote-form-input" placeholder="比如：公园里、家里、学校..." value="">' +
                        '</div>' +
                        '<div class="anecdote-form-actions">' +
                            '<button class="anecdote-form-cancel" onclick="toggleAnecdoteForm()">取消</button>' +
                            '<button class="anecdote-form-submit" onclick="submitAnecdote()">记录 ✨</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

        content.innerHTML =
            '<div class="anecdote-year-nav">' +
                '<button class="anecdote-year-btn" onclick="anecdotePageYear(-1)"' + (anecdoteCurrentYear <= 0 ? ' disabled' : '') + '>' +
                    '<i class="fas fa-chevron-left"></i>' +
                '</button>' +
                '<div class="anecdote-year-label">' +
                    '第 ' + (anecdoteCurrentYear + 1) + ' 年' +
                    '<div class="anecdote-year-sub">' + getAgeYearsMonths(anecdoteCurrentYear * 12) + ' ~ ' + getAgeYearsMonths(Math.min((anecdoteCurrentYear + 1) * 12 - 1, spirit.currentVirtualMonth)) + '</div>' +
                '</div>' +
                '<button class="anecdote-year-btn" onclick="anecdotePageYear(1)"' + (anecdoteCurrentYear >= maxYear ? ' disabled' : '') + '>' +
                    '<i class="fas fa-chevron-right"></i>' +
                '</button>' +
            '</div>' +
            '<div class="anecdote-timeline">' +
                timelineHtml +
            '</div>' +
            '<button class="anecdote-add-btn" onclick="toggleAnecdoteForm()">✍️</button>' +
            formHtml;
    }

    window.anecdotePageYear = function(delta) {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;
        var maxYear = Math.floor(spirit.currentVirtualMonth / 12);
        anecdoteCurrentYear = Math.max(0, Math.min(maxYear, anecdoteCurrentYear + delta));
        renderAnecdoteTimeline(spirit);
    };

    window.toggleAnecdoteForm = function() {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;
        anecdoteShowForm = !anecdoteShowForm;
        renderAnecdoteTimeline(spirit);
    };

    window.closeAnecdoteForm = function(e) {
        if (e.target.classList.contains('anecdote-form-overlay')) {
            var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
            if (!spirit) return;
            anecdoteShowForm = false;
            renderAnecdoteTimeline(spirit);
        }
    };

    window.submitAnecdote = function() {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;

        var desc = document.getElementById('anecdote-input-desc').value.trim();
        var location = document.getElementById('anecdote-input-location').value.trim() || '某个地方';

        if (!desc) {
            showSpiritNotification('✏️ 请描述一下发生了什么哦~');
            return;
        }

        addAnecdote(spirit, {
            source: 'user',
            title: desc.length > 20 ? desc.substring(0, 20) + '...' : desc,
            desc: desc,
            location: location
        });

        save();
        anecdoteShowForm = false;
        showSpiritNotification('📜 趣事记录成功！');
        renderAnecdoteTimeline(spirit);
    };

    // ============================
    // 成就查看
    // ============================
    window.openSpiritAchievements = function() {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;

        var modal = document.getElementById('modal-spirit-achievements');
        if (!modal) return;

        var content = document.getElementById('spirit-achievements-content');
        content.innerHTML = ACHIEVEMENTS.map(function(ach) {
            var unlocked = spirit.achievements.indexOf(ach.id) !== -1;
            return '<div class="spirit-achievement-item' + (unlocked ? ' unlocked' : '') + '">' +
                '<div class="sai-icon">' + (unlocked ? ach.icon : '🔒') + '</div>' +
                '<div class="sai-info">' +
                    '<div class="sai-title">' + ach.title + '</div>' +
                    '<div class="sai-desc">' + ach.desc + '</div>' +
                '</div>' +
            '</div>';
        }).join('');
        modal.style.display = 'flex';
    };

    // ============================
    // 考试记录查看
    // ============================
    window.openSpiritExamRecords = function() {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;

        var modal = document.getElementById('modal-spirit-exam');
        if (!modal) return;

        var content = document.getElementById('spirit-exam-content');
        if (!spirit.examRecords || spirit.examRecords.length === 0) {
            content.innerHTML = '<div class="spirit-diary-empty">📝 还没有考试记录~<br>上学后每6个虚拟月会有一次考试</div>';
        } else {
            var records = spirit.examRecords.slice().reverse();
            content.innerHTML = records.map(function(rec) {
                var html = '<div class="spirit-exam-entry">';
                html += '<div class="spirit-exam-title">📝 第' + rec.semester + '学期 · ' + getAgeYearsMonths(rec.month) + '</div>';
                html += '<div class="spirit-exam-scores">';
                for (var subj in rec.scores) {
                    var score = rec.scores[subj];
                    var level = score >= 90 ? 'excellent' : score >= 75 ? 'good' : score >= 60 ? 'pass' : 'fail';
                    html += '<div class="spirit-exam-row"><span class="ser-subject">' + subj + '</span><span class="ser-score ser-' + level + '">' + score + '</span></div>';
                }
                html += '</div></div>';
                return html;
            }).join('');
        }
        modal.style.display = 'flex';
    };

    // ============================
    // 故事历史查看
    // ============================
    window.openSpiritStoryHistory = function() {
        var spirit = store.spirits.find(function(s) { return s.id === currentSpiritId; });
        if (!spirit) return;

        var modal = document.getElementById('modal-spirit-story-history');
        if (!modal) return;

        var content = document.getElementById('spirit-story-history-content');
        if (!spirit.storyHistory || spirit.storyHistory.length === 0) {
            content.innerHTML = '<div class="spirit-diary-empty">📖 还没有故事~<br>每个虚拟月会触发一个成长事件</div>';
        } else {
            var stories = spirit.storyHistory.slice().reverse();
            content.innerHTML = stories.map(function(s) {
                return '<div class="spirit-story-entry">' +
                    '<div class="sse-header"><span class="sse-title">' + s.title + '</span><span class="sse-month">第' + s.month + '月</span></div>' +
                    '<div class="sse-choice">主人的选择：' + s.choiceText + '</div>' +
                '</div>';
            }).join('');
        }
        modal.style.display = 'flex';
    };

    // ============================
    // 覆盖 - 打开精灵详情
    // ============================
    window.openSpiritDetail = function(spiritId) {
        currentSpiritId = spiritId;
        // [FIX] 同步到 window，让 app-extras.js 的 edit/delete 也能访问
        window._spiritV2CurrentId = spiritId;
        var spirit = store.spirits.find(function(s) { return s.id === spiritId; });
        if (!spirit) return;

        migrateSpiritData(spirit);
        checkDailyReset(spirit);

        renderSpiritDetailUI(spirit);

        document.getElementById('spirit-list-page').style.display = 'none';
        document.getElementById('spirit-detail-page').style.display = 'block';
    };

    // ============================
    // 覆盖 - 确认创建精灵
    // ============================
    window.confirmCreateSpirit = function() {
        var selectedType = document.querySelector('.spirit-type-option.selected');
        var nameInput = document.getElementById('spirit-name-input');
        var partnerSelect = document.getElementById('spirit-partner-select');

        if (!selectedType) { toast('请选择精灵类型', 'error'); return; }
        var name = nameInput.value.trim();
        if (!name) { toast('请输入精灵名字', 'error'); return; }

        var spirit = {
            id: 'spirit_' + Date.now(),
            name: name,
            type: selectedType.dataset.type,
            partnerId: partnerSelect.value || null,
            hunger: 80, mood: 80, wisdom: 10, stamina: 80, health: 90,
            personality: [],
            personalityDim: {
                extroversion: 50, bravery: 50, kindness: 50,
                intelligence: 50, energy: 50, independence: 50
            },
            activities: [],
            conversations: [],
            createdAt: Date.now(),
            lastFeedTime: Date.now(),
            lastInteractTime: Date.now(),
            // V2 新增
            actionPoints: 100,
            lastRealDate: getTodayStr(),
            totalActionsUsed: 0,
            currentVirtualMonth: 0,
            monthActionCounter: 0,
            intimacy: { user: 50, partner: 50 },
            diaries: [],
            dailyLog: [],
            anecdotes: [],
            achievements: [],
            storyHistory: [],
            examRecords: [],
            giftHistory: [],
            illness: null,
            emotionState: 'calm',
            milestonesReached: [],
            lastHolidayCheck: '',
            semesterCount: 0,
            semesterActionCounter: 0,
            chatCount: 0,
            feedCount: 0
        };

        store.spirits.push(spirit);
        save();

        document.getElementById('modal-spirit-create').style.display = 'none';
        nameInput.value = '';
        renderSpiritList();
        toast('精灵创建成功！', 'success');

        setTimeout(function() { openSpiritDetail(spirit.id); }, 300);
    };

    // ============================
    // 覆盖 - 渲染精灵列表（被openApp调用）
    // ============================
    window.openApp = (function(original) {
        return function(appName) {
            if (appName === 'spirit') {
                initSpiritData();
                document.getElementById('layer-spirit').classList.add('show');
                renderSpiritList();
                return;
            }
            if (original) original(appName);
        };
    })(window.openApp);

    // ============================
    // 覆盖 - 关闭精灵详情
    // ============================
    window.closeSpiritDetail = function() {
        document.getElementById('spirit-list-page').style.display = 'block';
        document.getElementById('spirit-detail-page').style.display = 'none';
        currentSpiritId = null;
        renderSpiritList();
    };

    // 保留原有的编辑/删除功能，它们引用window上的函数已OK

    // ============================
    // 初始化
    // ============================
    initSpiritData();

})();
