// ========== FOOD DELIVERY APP MODULE ==========
// 外卖App：所有内容通过API生成（商家/菜品/优惠券/拼好饭等）
// 支持：给联系人点外卖 & 联系人给用户点外卖
(function(){
    'use strict';

    // ==================== 数据初始化 ====================
    function initFoodDeliveryData() {
        if (!store.foodDelivery) store.foodDelivery = {};
        if (!store.foodDelivery.sections) store.foodDelivery.sections = getDefaultSections();
        if (!store.foodDelivery.orders) store.foodDelivery.orders = [];
        if (!store.foodDelivery.healthLog) store.foodDelivery.healthLog = [];
        if (!store.foodDelivery.preferences) store.foodDelivery.preferences = { spicy: '中辣', diet: '无限制', allergies: '', budget: '15-30', favorite: '' };
        if (!store.foodDelivery.customFoods) store.foodDelivery.customFoods = [];
        if (store.foodDelivery.customPrompt === undefined) store.foodDelivery.customPrompt = '';
        if (!store.foodDelivery.worldbookId) store.foodDelivery.worldbookId = '';
        if (!store.foodDelivery._recentActivity) store.foodDelivery._recentActivity = [];
        if (!store.foodDelivery.giftOrders) store.foodDelivery.giftOrders = []; // 送给好友/好友送来的外卖
        if (!store.foodDelivery.receivedOrders) store.foodDelivery.receivedOrders = []; // 收到的外卖
        // ==================== 购物车数据结构 ====================
        if (!store.foodDelivery.cart) store.foodDelivery.cart = []; // 购物车：按店铺分组
        if (store.foodDelivery.cartExpireHours === undefined) store.foodDelivery.cartExpireHours = 24;
    }

    function getDefaultSections() {
        return [
            { id: 's1', name: '美食', emoji: '🍔', pref: '各类美食' },
            { id: 's2', name: '甜点饮品', emoji: '🧋', pref: '奶茶甜品' },
            { id: 's3', name: '超市便利', emoji: '🏪', pref: '零食饮料' },
            { id: 's4', name: '蔬菜水果', emoji: '🍎', pref: '新鲜果蔬' },
            { id: 's5', name: '夜宵', emoji: '🌙', pref: '烧烤炸鸡' },
            { id: 's6', name: '拼好饭', emoji: '🍱', pref: '实惠套餐' },
            { id: 's7', name: '快餐简餐', emoji: '🍜', pref: '面条盖饭' },
            { id: 's8', name: '火锅烤肉', emoji: '🥘', pref: '火锅烤肉' },
            { id: 's9', name: '西餐', emoji: '🍝', pref: '意面披萨' },
            { id: 's10', name: '早餐', emoji: '🥞', pref: '包子豆浆' }
        ];
    }

    function _fdSave() { if (typeof save === 'function') save(); }
    function _loading() { return '<div class="fd-ai-loading"><div class="fd-dot"></div><div class="fd-dot"></div><div class="fd-dot"></div><span>AI生成中...</span></div>'; }

    // ==================== 调用系统API（支持副API场景）====================
    async function callAPI(messages, options) {
        // 优先使用统一API模块（支持副API场景）
        if (typeof API !== 'undefined' && API.withScene && API.chatCompletion) {
            try {
                var result = await API.withScene('fooddelivery', async function() {
                    var data = await API.chatCompletion(messages, {
                        temperature: (options && options.temperature) || 0.8,
                        max_tokens: (options && options.max_tokens) || 800
                    });
                    if (data && data.choices && data.choices[0]) {
                        return (data.choices[0].message && data.choices[0].message.content) || data.choices[0].text || '';
                    }
                    return null;
                });
                return result;
            } catch(e) { console.warn('[外卖API-统一模块]', e); }
        }
        // 降级：直接调用（兼容旧版本）
        if (!store.system || !store.system.url || !store.system.key) return null;
        try {
            var _base = store.system.url.trim().replace(/\/+$/, '');
            var _suffixes = ['/chat/completions', '/completions', '/models', '/embeddings', '/images/generations', '/audio/transcriptions'];
            for (var _si = 0; _si < _suffixes.length; _si++) { if (_base.toLowerCase().endsWith(_suffixes[_si])) { _base = _base.slice(0, -_suffixes[_si].length); break; } }
            var url = _base.replace(/\/+$/, '') + '/chat/completions';
            var body = {
                model: store.system.model || 'gpt-4o-mini',
                messages: messages,
                temperature: (options && options.temperature) || 0.8,
                max_tokens: (options && options.max_tokens) || 800
            };
            var finalUrl = url;
            if (store.system.corsProxy) finalUrl = store.system.corsProxy.replace(/\/+$/, '') + '/' + url;
            var resp = await fetch(finalUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + store.system.key },
                body: JSON.stringify(body)
            });
            var data = await resp.json();
            if (data.choices && data.choices[0]) return (data.choices[0].message && data.choices[0].message.content) || data.choices[0].text || '';
        } catch(e) { console.warn('[外卖API]', e); }
        return null;
    }

    function parseJSON(str) {
        if (!str) return null;
        try {
            var m = str.match(/\[[\s\S]*\]/);
            if (m) return JSON.parse(m[0]);
            var m2 = str.match(/\{[\s\S]*\}/);
            if (m2) return JSON.parse(m2[0]);
        } catch(e) {}
        return null;
    }

    // ==================== AI生成：拼好饭 ====================
    var _fdPinHistory = []; // 记录最近拼好饭菜品，避免重复
    async function aiGeneratePinFoods(prefs) {
        var prefStr = prefs ? '用户偏好:辣度=' + (prefs.spicy||'') + ',饮食=' + (prefs.diet||'') + ',喜欢=' + (prefs.favorite||'') + ',预算=' + (prefs.budget||'15-30') + '元' : '';
        var avoidStr = '';
        if (_fdPinHistory.length > 0) {
            avoidStr = '\n注意：不要生成以下已推荐过的菜品：' + _fdPinHistory.slice(-10).join('、') + '。请推荐完全不同的菜品。';
        }
        var mealTypes = ['快餐汉堡','面食粉丝','盖浇饭','小吃零食','饮品甜点','粥品','饺子馄饨','烤串炸鸡','煲仔饭','卤味熟食','包子馒头','凉皮凉面'];
        var randomMeal = mealTypes[Math.floor(Math.random() * mealTypes.length)];
        var randomSeed = Math.floor(Math.random() * 99999);
        var userCustom = (store.foodDelivery.customPrompt || '').trim();
        var customStr = userCustom ? '\n用户自定义要求：' + userCustom : '';
        var prompt = '你是外卖平台"拼好饭"板块的推荐引擎(随机种子:' + randomSeed + ')。请生成6个拼好饭推荐菜品(价格便宜,6-15元),风格偏向"' + randomMeal + '"但也可以有其他类型。要求店铺名称多样化,不要重复。' + prefStr + avoidStr + customStr + '\n返回JSON数组:[{"name":"菜品名","emoji":"食物emoji","price":数字,"shop":"店铺名"}]\n只返回JSON,不要其他文字。';
        var resp = await callAPI([{role:'user',content:prompt}], {temperature:1.0, max_tokens:500});
        var arr = parseJSON(resp);
        if (arr && arr.length > 0) {
            arr.forEach(function(f) { if (f.name) _fdPinHistory.push(f.name); });
            if (_fdPinHistory.length > 20) _fdPinHistory = _fdPinHistory.slice(-20);
            return arr;
        }
        // 降级：多组不同的fallback随机选择
        var fallbackSets = [
            [{name:'鸡柳套餐',emoji:'🍗',price:13.79,shop:'鸡柳大人'},{name:'抹茶波波',emoji:'🧋',price:6.21,shop:'沪上阿姨'},{name:'甜辣鸡块',emoji:'🍗',price:10.33,shop:'华莱士'},{name:'薯条鸡米花',emoji:'🍟',price:10.25,shop:'华莱士'},{name:'鸡排堡套餐',emoji:'🍔',price:7.90,shop:'华莱士'}],
            [{name:'酸辣粉',emoji:'🍜',price:9.90,shop:'嗨吃家'},{name:'手抓饼',emoji:'🫓',price:7.50,shop:'台湾手抓饼'},{name:'烤冷面',emoji:'🍽️',price:8.00,shop:'东北烤冷面'},{name:'关东煮',emoji:'🍢',price:11.50,shop:'罗森便利'},{name:'蛋炒饭',emoji:'🍚',price:9.00,shop:'炒饭哥'}],
            [{name:'鸡蛋灌饼',emoji:'🥞',price:6.00,shop:'早餐铺子'},{name:'冰粉',emoji:'🍧',price:5.50,shop:'成都冰粉'},{name:'煎饺',emoji:'🥟',price:8.80,shop:'四海游龙'},{name:'热干面',emoji:'🍜',price:9.90,shop:'蔡林记'},{name:'豆花',emoji:'🍲',price:7.00,shop:'豆花庄'}]
        ];
        return fallbackSets[Math.floor(Math.random() * fallbackSets.length)];
    }

    // ==================== AI生成：优惠券/红包 ====================
    async function aiGenerateCoupons() {
        var prompt = '你是外卖平台优惠券系统。请生成3张虚拟外卖优惠券。每张包含amount(金额数字)、threshold(满多少可用)、expiry(失效时间描述)。\n返回JSON数组:[{"amount":19,"threshold":48,"expiry":"23:59失效"}]\n只返回JSON。';
        var resp = await callAPI([{role:'user',content:prompt}], {temperature:0.9, max_tokens:300});
        var arr = parseJSON(resp);
        return arr || [
            {amount:19,threshold:48,expiry:'23:59失效'},
            {amount:15,threshold:38,expiry:'23:59失效'},
            {amount:8,threshold:20,expiry:'新人专享'}
        ];
    }

    // ==================== AI生成：附近商家 ====================
    var _fdShopHistory = []; // 记录最近生成的商家名，避免重复
    async function aiGenerateShops(category, count) {
        var n = count || 5;
        var prefStr = store.foodDelivery.preferences ? '用户喜欢:' + (store.foodDelivery.preferences.favorite||'各类美食') + ',预算:' + (store.foodDelivery.preferences.budget||'15-30') + '元' : '';
        var avoidStr = '';
        if (_fdShopHistory.length > 0) {
            avoidStr = '\n重要：不要生成以下已推荐过的商家：' + _fdShopHistory.slice(-10).join('、') + '。请推荐完全不同的店铺。';
        }
        var shopStyles = ['连锁品牌','私房小店','网红新店','老字号','异国料理','校园周边','社区小馆','深夜食堂','轻食简餐','地方风味'];
        var randomStyle = shopStyles[Math.floor(Math.random() * shopStyles.length)];
        var randomSeed = Math.floor(Math.random() * 99999);
        var userCustom = (store.foodDelivery.customPrompt || '').trim();
        var customStr = userCustom ? '\n用户自定义要求：' + userCustom : '';
        var prompt = '你是外卖平台商家推荐系统(随机种子:' + randomSeed + ')。请为"' + (category||'美食') + '"类别生成' + n + '个虚拟外卖商家,风格偏向"' + randomStyle + '"。要求：店名要有创意且不雷同,涵盖不同价位和风格。' + prefStr + avoidStr + customStr + '\n每个商家包含:name(店名),emoji(一个代表性食物emoji),rating(评分3.5-5.0),monthlySales(月售如"800+"),deliveryTime(配送时间如"30分钟"),deliveryFee(如"免配送费"),minOrder(起送价如"¥15起送"),tags(标签数组如["满减","新客减4"])。\n返回JSON数组。只返回JSON,不要其他文字。';
        var resp = await callAPI([{role:'user',content:prompt}], {temperature:1.0, max_tokens:800});
        var arr = parseJSON(resp);
        if (arr && arr.length > 0) {
            arr.forEach(function(s,i){
                if(!s.id) s.id = 'shop_' + Date.now() + '_' + i;
                if(!s.categories) s.categories = [];
                if(s.name) _fdShopHistory.push(s.name);
            });
            if (_fdShopHistory.length > 20) _fdShopHistory = _fdShopHistory.slice(-20);
            return arr;
        }
        // 降级：多组不同的fallback随机选择
        var fallbackSets = [
            [{id:'s1',name:'黄焖鸡米饭',emoji:'🍛',rating:'4.5',monthlySales:'800+',deliveryTime:'30分钟',deliveryFee:'免配送费',minOrder:'¥15起送',tags:['满减'],categories:[]},
             {id:'s2',name:'张亮麻辣烫',emoji:'🥘',rating:'4.3',monthlySales:'1200+',deliveryTime:'25分钟',deliveryFee:'配送费¥3',minOrder:'¥10起送',tags:['新客减4'],categories:[]},
             {id:'s3',name:'蜜雪冰城',emoji:'🧋',rating:'4.6',monthlySales:'2000+',deliveryTime:'20分钟',deliveryFee:'免配送费',minOrder:'¥8起送',tags:['准时达'],categories:[]}],
            [{id:'s4',name:'兰州拉面',emoji:'🍜',rating:'4.4',monthlySales:'600+',deliveryTime:'25分钟',deliveryFee:'配送费¥2',minOrder:'¥12起送',tags:['满15减3'],categories:[]},
             {id:'s5',name:'肯德基',emoji:'🍔',rating:'4.7',monthlySales:'3000+',deliveryTime:'28分钟',deliveryFee:'配送费¥5',minOrder:'¥20起送',tags:['品牌直送'],categories:[]},
             {id:'s6',name:'杨国福麻辣烫',emoji:'🌶️',rating:'4.2',monthlySales:'900+',deliveryTime:'35分钟',deliveryFee:'免配送费',minOrder:'¥18起送',tags:['新客立减'],categories:[]}],
            [{id:'s7',name:'沙县小吃',emoji:'🥟',rating:'4.1',monthlySales:'1500+',deliveryTime:'20分钟',deliveryFee:'免配送费',minOrder:'¥8起送',tags:['超值套餐'],categories:[]},
             {id:'s8',name:'一点点奶茶',emoji:'🧋',rating:'4.8',monthlySales:'2500+',deliveryTime:'22分钟',deliveryFee:'配送费¥3',minOrder:'¥10起送',tags:['第二杯半价'],categories:[]},
             {id:'s9',name:'真功夫',emoji:'🍚',rating:'4.3',monthlySales:'700+',deliveryTime:'30分钟',deliveryFee:'免配送费',minOrder:'¥15起送',tags:['营养蒸品'],categories:[]}]
        ];
        return fallbackSets[Math.floor(Math.random() * fallbackSets.length)];
    }

    // ==================== AI生成：商家菜单 ====================
    async function aiGenerateShopMenu(shopName, shopEmoji) {
        var prompt = '你是外卖平台"' + shopName + '"(' + shopEmoji + ')的菜单生成系统。请为这家店生成完整菜单，分3-4个类别，每个类别4-5个菜品。\n格式:[{"name":"🔥热销套餐","items":[{"name":"菜品名","emoji":"食物emoji","price":数字,"originalPrice":数字,"sales":"月售200","desc":"一句描述"}]}]\n只返回JSON数组。价格合理(5-40元)。';
        var resp = await callAPI([{role:'user',content:prompt}], {temperature:0.9, max_tokens:1200});
        var arr = parseJSON(resp);
        if (arr && arr.length > 0) {
            arr.forEach(function(cat){
                if(cat.items) cat.items.forEach(function(item){
                    if(!item.id) item.id = 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
                    if(!item.emoji) item.emoji = '🍽️';
                    if(!item.originalPrice) item.originalPrice = (parseFloat(item.price||15) * 1.3).toFixed(2);
                    if(!item.sales) item.sales = '月售' + Math.floor(Math.random()*500+50);
                    if(!item.desc) item.desc = '精选食材，美味可口';
                });
            });
            return arr;
        }
        return [{name:'🔥推荐',items:[
            {id:'i1',name:'招牌套餐',emoji:'🍛',price:18.8,originalPrice:25,sales:'月售500',desc:'店长推荐'},
            {id:'i2',name:'经典小食',emoji:'🍟',price:9.9,originalPrice:15,sales:'月售300',desc:'酥脆可口'},
            {id:'i3',name:'饮品',emoji:'🥤',price:6,originalPrice:8,sales:'月售200',desc:'冰爽解渴'}
        ]}];
    }

    // ==================== AI生成：搜索结果 ====================
    var _fdSearchHistory = []; // 记录最近搜索结果，避免重复
    async function aiGenerateFoods(query, prefs) {
        var prefStr = prefs ? '用户偏好:辣度=' + (prefs.spicy||'') + ',饮食限制=' + (prefs.diet||'') + ',过敏=' + (prefs.allergies||'无') + ',预算=' + (prefs.budget||'15-30') + '元,喜欢=' + (prefs.favorite||'') : '';
        // 收集最近出现过的菜品名，要求避免重复
        var avoidStr = '';
        if (_fdSearchHistory.length > 0) {
            var recentNames = _fdSearchHistory.slice(-15);
            avoidStr = '\n重要：请不要生成以下已出现过的菜品(必须全部不同)：' + recentNames.join('、') + '。请生成全新的、不同类型的菜品。';
        }
        // 增加随机风味关键词，让每次结果更多样
        var flavorHints = ['地方特色','创意融合','网红爆款','经典老店','异国风情','家常风味','健康轻食','街头小吃','深夜美食','人气必点','季节限定','私房秘制'];
        var randomFlavor = flavorHints[Math.floor(Math.random() * flavorHints.length)];
        var randomSeed = Math.floor(Math.random() * 99999);
        var userCustom = (store.foodDelivery.customPrompt || '').trim();
        var customStr = userCustom ? '\n用户自定义要求：' + userCustom : '';
        var prompt = '你是外卖平台搜索引擎(随机种子:' + randomSeed + ')。用户搜索了"' + query + '"，请严格围绕这个搜索词，生成8个与"' + query + '"高度相关的外卖菜品推荐。'
            + '\n要求：1.所有结果必须与搜索词"' + query + '"直接相关 2.菜品种类要丰富多样(不同店铺、不同做法、不同价位) 3.风格偏向"' + randomFlavor + '" 4.店铺名要多样化，使用不同的虚拟品牌名 5.价格在5-50元之间合理分布'
            + prefStr + avoidStr + customStr
            + '\n返回JSON数组(8个):[{"name":"菜品名","emoji":"食物emoji","shop":"店铺名","price":数字,"desc":"一句话特色描述"}]\n只返回JSON,不要任何其他文字。';
        var resp = await callAPI([{role:'user',content:prompt}], {temperature:1.0, max_tokens:800});
        var arr = parseJSON(resp);
        if (arr && arr.length > 0) {
            // 记录这次生成的菜品名，用于下次避免重复
            arr.forEach(function(f) { if (f.name) _fdSearchHistory.push(f.name); });
            // 只保留最近30条记录
            if (_fdSearchHistory.length > 30) _fdSearchHistory = _fdSearchHistory.slice(-30);
            return arr;
        }
        // 降级：基于搜索词生成不同的fallback
        var fallbacks = [
            [{name:query+'套餐',emoji:'🍱',shop:'美味'+query+'馆',price:18.8,desc:'招牌'+query},{name:'秘制'+query,emoji:'🍛',shop:'老字号',price:22.5,desc:'独家秘方'},{name:query+'拌饭',emoji:'🍚',shop:'拌饭王',price:15.9,desc:'搭配'+query+'超好吃'}],
            [{name:'香辣'+query,emoji:'🌶️',shop:'川味坊',price:19.9,desc:'麻辣鲜香'},{name:query+'盖浇饭',emoji:'🍛',shop:'快餐之家',price:16.5,desc:'实惠大碗'},{name:'清蒸'+query,emoji:'🍽️',shop:'鲜味轩',price:25.0,desc:'原汁原味'}],
            [{name:query+'便当',emoji:'🍱',shop:'便当达人',price:14.9,desc:'营养均衡'},{name:'炭烤'+query,emoji:'🔥',shop:'烤味研究所',price:28.0,desc:'炭火慢烤'},{name:query+'小食',emoji:'🍢',shop:'街角小店',price:12.0,desc:'休闲小食'}]
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // ==================== 状态管理 ====================
    var fdCurrentTab = 'home';
    var fdCurrentShop = null;
    var fdSearchResults = null;
    var fdSelectedPayMethod = 'self';
    var fdDeliverTo = 'self'; // 'self' 或 联系人id
    var fdOrderForContact = null; // 当前正在给谁点外卖(联系人对象)
    var _fdHomeLoaded = false; // [FIX-外卖刷新] 标记首页内容是否已加载过
    var _fdCachedCoupons = null; // 缓存优惠券
    var _fdCachedPinFoods = null; // 缓存拼好饭
    var _fdCachedShops = null; // 缓存附近商家
    var _fdCartVisible = false; // 购物车弹窗是否显示

    // ==================== 购物车核心函数 ====================
    // 清理过期购物车数据
    function fdCleanExpiredCart() {
        var cart = store.foodDelivery.cart || [];
        var expireMs = (store.foodDelivery.cartExpireHours || 24) * 60 * 60 * 1000;
        var now = Date.now();
        store.foodDelivery.cart = cart.filter(function(shopCart) {
            return (now - (shopCart.addTime || 0)) < expireMs;
        });
    }

    // 添加菜品到购物车
    window.fdAddToCart = function(shopInfo, item) {
        initFoodDeliveryData();
        fdCleanExpiredCart();
        var cart = store.foodDelivery.cart;
        var shopId = shopInfo.id || shopInfo.name;
        var existing = cart.find(function(sc) { return sc.shopId === shopId; });
        
        if (existing) {
            // 店铺已存在，查找菜品
            var existingItem = existing.items.find(function(i) { return i.itemId === item.id || i.name === item.name; });
            if (existingItem) {
                existingItem.qty++;
            } else {
                existing.items.push({
                    itemId: item.id || 'item_' + Date.now(),
                    name: item.name,
                    emoji: item.emoji || '🍽️',
                    price: parseFloat(item.price) || 0,
                    originalPrice: item.originalPrice,
                    qty: 1,
                    options: item.options || [],
                    desc: item.desc || ''
                });
            }
            existing.addTime = Date.now();
        } else {
            // 新店铺
            cart.push({
                shopId: shopId,
                shopName: shopInfo.name,
                shopEmoji: shopInfo.emoji || '🍽️',
                shopInfo: {
                    deliveryFee: parseFloat(shopInfo.deliveryFee) || 0,
                    minOrder: parseFloat((shopInfo.minOrder || '').replace(/[^0-9.]/g, '')) || 0,
                    deliveryTime: shopInfo.deliveryTime || '30分钟',
                    rating: shopInfo.rating
                },
                items: [{
                    itemId: item.id || 'item_' + Date.now(),
                    name: item.name,
                    emoji: item.emoji || '🍽️',
                    price: parseFloat(item.price) || 0,
                    originalPrice: item.originalPrice,
                    qty: 1,
                    options: item.options || [],
                    desc: item.desc || ''
                }],
                addTime: Date.now()
            });
        }
        _fdSave();
        fdUpdateCartUI();
        toast('✅ 已加入购物车');
    };

    // 从购物车移除菜品
    window.fdRemoveFromCart = function(shopId, itemId) {
        var cart = store.foodDelivery.cart || [];
        var shopCart = cart.find(function(sc) { return sc.shopId === shopId; });
        if (!shopCart) return;
        shopCart.items = shopCart.items.filter(function(i) { return i.itemId !== itemId && i.name !== itemId; });
        // 如果店铺没有菜品了，移除整个店铺
        if (shopCart.items.length === 0) {
            store.foodDelivery.cart = cart.filter(function(sc) { return sc.shopId !== shopId; });
        }
        _fdSave();
        fdUpdateCartUI();
        if (_fdCartVisible) fdRenderCartPopup();
    };

    // 更新购物车菜品数量
    window.fdUpdateCartQty = function(shopId, itemId, delta) {
        var cart = store.foodDelivery.cart || [];
        var shopCart = cart.find(function(sc) { return sc.shopId === shopId; });
        if (!shopCart) return;
        var item = shopCart.items.find(function(i) { return i.itemId === itemId || i.name === itemId; });
        if (!item) return;
        item.qty = Math.max(0, item.qty + delta);
        if (item.qty === 0) {
            fdRemoveFromCart(shopId, itemId);
            return;
        }
        _fdSave();
        fdUpdateCartUI();
        if (_fdCartVisible) fdRenderCartPopup();
    };

    // 清空某店铺购物车
    window.fdClearShopCart = function(shopId) {
        store.foodDelivery.cart = (store.foodDelivery.cart || []).filter(function(sc) { return sc.shopId !== shopId; });
        _fdSave();
        fdUpdateCartUI();
        if (_fdCartVisible) fdRenderCartPopup();
    };

    // 清空整个购物车
    window.fdClearAllCart = function() {
        store.foodDelivery.cart = [];
        _fdSave();
        fdUpdateCartUI();
        if (_fdCartVisible) fdRenderCartPopup();
        toast('购物车已清空');
    };

    // 获取购物车总金额
    function fdGetCartTotal() {
        var cart = store.foodDelivery.cart || [];
        return cart.reduce(function(sum, sc) {
            return sum + sc.items.reduce(function(s, i) { return s + (i.price * i.qty); }, 0);
        }, 0);
    }

    // 获取购物车商品总数
    function fdGetCartCount() {
        var cart = store.foodDelivery.cart || [];
        return cart.reduce(function(sum, sc) {
            return sum + sc.items.reduce(function(s, i) { return s + i.qty; }, 0);
        }, 0);
    }

    // 获取某店铺购物车商品数
    function fdGetShopCartCount(shopId) {
        var cart = store.foodDelivery.cart || [];
        var shopCart = cart.find(function(sc) { return sc.shopId === shopId; });
        if (!shopCart) return 0;
        return shopCart.items.reduce(function(s, i) { return s + i.qty; }, 0);
    }

    // 获取某店铺购物车金额
    function fdGetShopCartTotal(shopId) {
        var cart = store.foodDelivery.cart || [];
        var shopCart = cart.find(function(sc) { return sc.shopId === shopId; });
        if (!shopCart) return 0;
        return shopCart.items.reduce(function(s, i) { return s + (i.price * i.qty); }, 0);
    }

    // 更新购物车UI（底部栏徽章等）
    function fdUpdateCartUI() {
        var count = fdGetCartCount();
        var badge = document.getElementById('fd-cart-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
        // 更新商家详情页底部购物栏
        var shopCartBar = document.getElementById('fd-shop-cart-bar');
        if (shopCartBar && fdCurrentShop) {
            var shopId = fdCurrentShop.id || fdCurrentShop.name;
            var shopCount = fdGetShopCartCount(shopId);
            var shopTotal = fdGetShopCartTotal(shopId);
            var minOrder = parseFloat((fdCurrentShop.minOrder || '').replace(/[^0-9.]/g, '')) || 0;
            var diff = Math.max(0, minOrder - shopTotal);
            shopCartBar.innerHTML = fdRenderShopCartBar(shopCount, shopTotal, minOrder, diff);
        }
    }

    // 渲染店铺底部购物栏
    function fdRenderShopCartBar(count, total, minOrder, diff) {
        var canCheckout = diff <= 0 && count > 0;
        return '<div class="fd-shop-cart-left" onclick="fdToggleCartPopup()">'
            + '<div class="fd-shop-cart-icon"><i class="fas fa-shopping-cart"></i>'
            + (count > 0 ? '<span class="fd-shop-cart-badge">' + count + '</span>' : '') + '</div>'
            + '<div class="fd-shop-cart-info">'
            + '<div class="fd-shop-cart-total">¥' + total.toFixed(2) + '</div>'
            + (diff > 0 ? '<div class="fd-shop-cart-tip">还差¥' + diff.toFixed(2) + '起送</div>' : '<div class="fd-shop-cart-tip">已满足起送</div>')
            + '</div></div>'
            + '<button class="fd-shop-cart-checkout' + (canCheckout ? '' : ' disabled') + '" onclick="' + (canCheckout ? 'fdCheckoutCurrentShop()' : '') + '">'
            + (count > 0 ? '去结算 (' + count + ')' : '购物车是空的') + '</button>';
    }

    // 切换购物车弹窗
    window.fdToggleCartPopup = function() {
        _fdCartVisible = !_fdCartVisible;
        if (_fdCartVisible) {
            fdRenderCartPopup();
        } else {
            var popup = document.getElementById('fd-cart-popup');
            if (popup) popup.remove();
        }
    };

    // 渲染购物车弹窗
    function fdRenderCartPopup() {
        var existing = document.getElementById('fd-cart-popup');
        if (existing) existing.remove();
        
        var cart = store.foodDelivery.cart || [];
        if (cart.length === 0) {
            toast('购物车是空的');
            _fdCartVisible = false;
            return;
        }

        var h = '<div class="fd-cart-popup" id="fd-cart-popup">';
        h += '<div class="fd-cart-popup-mask" onclick="fdToggleCartPopup()"></div>';
        h += '<div class="fd-cart-popup-content">';
        h += '<div class="fd-cart-popup-header">';
        h += '<span class="fd-cart-popup-title">🛒 购物车</span>';
        h += '<span class="fd-cart-popup-clear" onclick="fdClearAllCart()"><i class="fas fa-trash-alt"></i> 清空</span>';
        h += '</div>';
        h += '<div class="fd-cart-popup-body">';

        cart.forEach(function(shopCart) {
            var shopTotal = shopCart.items.reduce(function(s, i) { return s + (i.price * i.qty); }, 0);
            h += '<div class="fd-cart-shop-group">';
            h += '<div class="fd-cart-shop-header">';
            h += '<span class="fd-cart-shop-name">' + shopCart.shopEmoji + ' ' + shopCart.shopName + '</span>';
            h += '<span class="fd-cart-shop-clear" onclick="fdClearShopCart(\'' + shopCart.shopId + '\')">清空</span>';
            h += '</div>';

            shopCart.items.forEach(function(item) {
                h += '<div class="fd-cart-item">';
                h += '<div class="fd-cart-item-emoji">' + item.emoji + '</div>';
                h += '<div class="fd-cart-item-info">';
                h += '<div class="fd-cart-item-name">' + item.name + '</div>';
                h += '<div class="fd-cart-item-price">¥' + item.price.toFixed(2) + '</div>';
                h += '</div>';
                h += '<div class="fd-cart-item-qty">';
                h += '<button class="fd-cart-qty-btn" onclick="fdUpdateCartQty(\'' + shopCart.shopId + '\',\'' + (item.itemId || item.name) + '\',-1)">−</button>';
                h += '<span>' + item.qty + '</span>';
                h += '<button class="fd-cart-qty-btn" onclick="fdUpdateCartQty(\'' + shopCart.shopId + '\',\'' + (item.itemId || item.name) + '\',1)">+</button>';
                h += '</div>';
                h += '</div>';
            });

            h += '<div class="fd-cart-shop-footer">';
            h += '<span>小计: ¥' + shopTotal.toFixed(2) + '</span>';
            var minOrder = shopCart.shopInfo.minOrder || 0;
            if (shopTotal < minOrder) {
                h += '<span class="fd-cart-shop-tip">还差¥' + (minOrder - shopTotal).toFixed(2) + '起送</span>';
            } else {
                h += '<button class="fd-cart-shop-checkout" onclick="fdCheckoutShop(\'' + shopCart.shopId + '\')">结算</button>';
            }
            h += '</div>';
            h += '</div>';
        });

        h += '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', h);
    }

    // 结算当前店铺购物车
    window.fdCheckoutCurrentShop = function() {
        if (!fdCurrentShop) return;
        var shopId = fdCurrentShop.id || fdCurrentShop.name;
        fdCheckoutShop(shopId);
    };

    // 结算指定店铺购物车
    window.fdCheckoutShop = function(shopId) {
        var cart = store.foodDelivery.cart || [];
        var shopCart = cart.find(function(sc) { return sc.shopId === shopId; });
        if (!shopCart || shopCart.items.length === 0) return toast('购物车是空的');

        var minOrder = shopCart.shopInfo.minOrder || 0;
        var total = shopCart.items.reduce(function(s, i) { return s + (i.price * i.qty); }, 0);
        if (total < minOrder) return toast('未达起送价 ¥' + minOrder);

        // 关闭购物车弹窗
        _fdCartVisible = false;
        var popup = document.getElementById('fd-cart-popup');
        if (popup) popup.remove();

        // 打开结算页面
        fdOpenCheckout(shopCart);
    };

    // 打开结算页面
    function fdOpenCheckout(shopCart) {
        var contacts = (store.contacts || []).filter(function(c) { return !c.isGroup; });
        var total = shopCart.items.reduce(function(s, i) { return s + (i.price * i.qty); }, 0);
        var deliveryFee = shopCart.shopInfo.deliveryFee || 0;
        var grandTotal = total + deliveryFee;

        var h = '<div class="fd-pay-overlay" onclick="this.remove()">';
        h += '<div class="fd-pay-sheet fd-checkout-sheet" onclick="event.stopPropagation()">';
        h += '<div class="fd-pay-header"><h3>确认订单</h3>';
        h += '<div class="fd-pay-close" onclick="this.closest(\'.fd-pay-overlay\').remove()"><i class="fas fa-times"></i></div></div>';

        // 店铺信息
        h += '<div class="fd-checkout-shop">';
        h += '<span class="fd-checkout-shop-emoji">' + shopCart.shopEmoji + '</span>';
        h += '<span class="fd-checkout-shop-name">' + shopCart.shopName + '</span>';
        h += '<span class="fd-checkout-shop-time"><i class="fas fa-clock"></i> ' + shopCart.shopInfo.deliveryTime + '</span>';
        h += '</div>';

        // 菜品列表
        h += '<div class="fd-checkout-items">';
        shopCart.items.forEach(function(item) {
            h += '<div class="fd-checkout-item">';
            h += '<span class="fd-checkout-item-emoji">' + item.emoji + '</span>';
            h += '<span class="fd-checkout-item-name">' + item.name + '</span>';
            h += '<span class="fd-checkout-item-qty">x' + item.qty + '</span>';
            h += '<span class="fd-checkout-item-price">¥' + (item.price * item.qty).toFixed(2) + '</span>';
            h += '</div>';
        });
        h += '</div>';

        // 费用明细
        h += '<div class="fd-checkout-fees">';
        h += '<div class="fd-checkout-fee-row"><span>商品小计</span><span>¥' + total.toFixed(2) + '</span></div>';
        h += '<div class="fd-checkout-fee-row"><span>配送费</span><span>' + (deliveryFee > 0 ? '¥' + deliveryFee.toFixed(2) : '免配送费') + '</span></div>';
        h += '<div class="fd-checkout-fee-row total"><span>合计</span><span>¥' + grandTotal.toFixed(2) + '</span></div>';
        h += '</div>';

        // 配送给谁
        h += '<div class="fd-deliver-to-section">';
        h += '<div class="fd-deliver-to-title"><i class="fas fa-map-marker-alt"></i> 配送给谁</div>';
        h += '<div class="fd-deliver-to-option' + (fdDeliverTo === 'self' ? ' active' : '') + '" onclick="fdSelectDeliverTo(this,\'self\')">';
        h += '<div class="fd-deliver-to-icon">🙋</div><div class="fd-deliver-to-info"><div class="fd-deliver-to-name">送给自己</div></div>';
        h += '<div class="fd-deliver-to-check">' + (fdDeliverTo === 'self' ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>') + '</div></div>';
        if (contacts.length > 0) {
            h += '<div class="fd-deliver-to-expand" onclick="fdExpandDeliverContacts(this)"><i class="fas fa-user-plus"></i> 送给好友 <i class="fas fa-chevron-down fd-deliver-arrow"></i></div>';
            h += '<div class="fd-deliver-contacts-list" style="display:none;">';
            contacts.forEach(function(c) {
                h += '<div class="fd-deliver-to-option" onclick="fdSelectDeliverTo(this,\'' + c.id + '\')">';
                h += '<div class="fd-deliver-to-icon">' + (c.avatar ? '<img src="' + c.avatar + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">' : '👤') + '</div>';
                h += '<div class="fd-deliver-to-info"><div class="fd-deliver-to-name">送给 ' + c.name + '</div></div>';
                h += '<div class="fd-deliver-to-check"><i class="far fa-circle"></i></div></div>';
            });
            h += '</div>';
        }
        h += '</div>';

        // 支付方式
        h += '<div class="fd-pay-methods">';
        h += '<div class="fd-pay-category"><div class="fd-pay-category-header" onclick="fdTogglePayCategory(this)">';
        h += '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">💰</span><span style="font-weight:600;">自己支付</span></div>';
        h += '<i class="fas fa-chevron-down fd-pay-cat-arrow"></i></div>';
        h += '<div class="fd-pay-category-body show">';
        h += '<div class="fd-pay-method selected" onclick="fdSelectPayMethod(this,\'self\')">';
        h += '<div class="fd-pay-method-icon" style="background:#e8f5e9;color:#4caf50;">💳</div>';
        h += '<div class="fd-pay-method-info"><div class="fd-pay-method-name">余额支付</div><div class="fd-pay-method-desc">使用账户余额</div></div>';
        h += '<div class="fd-pay-method-check"><i class="fas fa-check"></i></div></div></div></div>';

        if (contacts.length > 0) {
            h += '<div class="fd-pay-category"><div class="fd-pay-category-header" onclick="fdTogglePayCategory(this)">';
            h += '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">👥</span><span style="font-weight:600;">好友代付</span></div>';
            h += '<i class="fas fa-chevron-right fd-pay-cat-arrow"></i></div>';
            h += '<div class="fd-pay-category-body">';
            contacts.forEach(function(c) {
                h += '<div class="fd-pay-method" onclick="fdSelectPayMethod(this,\'proxy_' + c.id + '\')">';
                h += '<div class="fd-pay-method-icon" style="background:#fff3e0;color:#ff9800;">👤</div>';
                h += '<div class="fd-pay-method-info"><div class="fd-pay-method-name">' + c.name + '</div><div class="fd-pay-method-desc">发送代付请求</div></div>';
                h += '<div class="fd-pay-method-check"></div></div>';
            });
            h += '</div></div>';
        }
        h += '</div>';

        h += '<button class="fd-pay-submit" onclick="fdConfirmCartPay(\'' + shopCart.shopId + '\',' + grandTotal + ')">确认支付 ¥' + grandTotal.toFixed(2) + '</button>';
        h += '</div></div>';

        document.body.insertAdjacentHTML('beforeend', h);
    }

    // 确认购物车支付
    window.fdConfirmCartPay = function(shopId, grandTotal) {
        var cart = store.foodDelivery.cart || [];
        var shopCart = cart.find(function(sc) { return sc.shopId === shopId; });
        if (!shopCart) return toast('购物车不存在');

        var deliverToContact = null;
        if (fdDeliverTo && fdDeliverTo !== 'self') {
            deliverToContact = (store.contacts || []).find(function(x) { return x.id === fdDeliverTo; });
        }

        // 创建订单
        var order = {
            id: 'order_' + Date.now(),
            shopId: shopId,
            shopName: shopCart.shopName,
            shopEmoji: shopCart.shopEmoji,
            items: shopCart.items.map(function(i) { return { name: i.name, emoji: i.emoji, price: i.price, qty: i.qty }; }),
            total: shopCart.items.reduce(function(s, i) { return s + (i.price * i.qty); }, 0),
            deliveryFee: shopCart.shopInfo.deliveryFee || 0,
            grandTotal: grandTotal,
            time: Date.now(),
            payMethod: fdSelectedPayMethod,
            deliverTo: fdDeliverTo,
            deliverToName: deliverToContact ? deliverToContact.name : '自己',
            isGift: !!deliverToContact,
            // 兼容旧格式
            name: shopCart.items.map(function(i) { return i.name; }).join('、'),
            emoji: shopCart.shopEmoji,
            price: grandTotal,
            shop: shopCart.shopName
        };

        store.foodDelivery.orders.push(order);

        // 记录健康日志（只有送给自己时）
        if (!deliverToContact) {
            shopCart.items.forEach(function(item) {
                store.foodDelivery.healthLog.push({
                    id: 'meal_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    name: item.name,
                    emoji: item.emoji,
                    calories: null,
                    time: Date.now(),
                    mealType: getMealType(),
                    source: 'order'
                });
            });
        }

        // 清空该店铺购物车
        store.foodDelivery.cart = cart.filter(function(sc) { return sc.shopId !== shopId; });

        var ov = document.querySelector('.fd-pay-overlay');
        if (ov) ov.remove();

        // 处理支付
        if (fdSelectedPayMethod === 'self') {
            if (deliverToContact) {
                sendGiftOrder(deliverToContact, order);
                toast('🎁 已给 ' + deliverToContact.name + ' 下单！');
            } else {
                toast('🎉 下单成功！');
            }
            // 扣减余额
            if (typeof store.user.balance === 'number') {
                store.user.balance = Math.max(0, store.user.balance - grandTotal);
            }
            if (!store.bills) store.bills = [];
            store.bills.push({
                type: 'out',
                desc: (deliverToContact ? '外卖(送给' + deliverToContact.name + ') - ' : '外卖 - ') + shopCart.shopName,
                amt: grandTotal,
                time: Date.now()
            });
            recordFoodOrder(order);
        } else if (fdSelectedPayMethod.indexOf('proxy_') === 0) {
            sendProxyPayRequest(fdSelectedPayMethod.replace('proxy_', ''), order);
        } else if (fdSelectedPayMethod.indexOf('family_') === 0) {
            handleFamilyCardPay(fdSelectedPayMethod.replace('family_', ''), order);
        }

        fdSelectedPayMethod = 'self';
        if (deliverToContact) {
            fdOrderForContact = null;
            fdDeliverTo = 'self';
        }
        _fdSave();
        fdUpdateCartUI();

        // 显示小票
        setTimeout(function() { fdShowReceipt(order.id); }, 500);
    };

    // ==================== 给联系人点外卖入口 ====================
    // 从聊天界面或其他地方直接进入给指定联系人点外卖
    window.renderFoodDeliveryForContact = function(contactId) {
        var c = (store.contacts || []).find(function(x){ return x.id === contactId; });
        if (!c) return;
        initFoodDeliveryData();
        fdOrderForContact = c;
        fdDeliverTo = c.id;
        fdCurrentTab = 'home';
        fdCurrentShop = null;
        fdSearchResults = null;
        // 打开外卖App layer
        if (typeof openApp === 'function') {
            openApp('fooddelivery');
        }
        setTimeout(function(){ renderFoodDelivery(); }, 100);
    };

    // ==================== 主渲染入口 ====================
    window.renderFoodDeliveryHome = function() {
        initFoodDeliveryData();
        // [FIX-外卖刷新] 如果已经加载过首页，再次进入时保持上次的状态，不重新生成
        if (_fdHomeLoaded) {
            // 只重置必要的导航状态，保持缓存的首页数据
            fdCurrentTab = 'home';
            fdCurrentShop = null;
            fdSearchResults = null;
            // 不重置 fdOrderForContact 和 fdDeliverTo，保留上次状态
            renderFoodDelivery();
            return;
        }
        // 第一次进入，完全初始化
        fdCurrentTab = 'home';
        fdCurrentShop = null;
        fdSearchResults = null;
        fdOrderForContact = null;
        fdDeliverTo = 'self';
        renderFoodDelivery();
    };

    function renderFoodDelivery() {
        var layer = document.getElementById('layer-fooddelivery');
        if (!layer) return;
        var container = layer.querySelector('.fd-container');
        if (!container) container = layer;

        var html = '';
        // 顶部导航
        html += '<div class="fd-navbar"><div class="fd-nav-left">';
        html += '<div class="fd-nav-btn" onclick="exitApp()"><i class="fas fa-chevron-left"></i></div>';
        var navTitle = '外卖';
        if (fdOrderForContact) navTitle = '给 ' + fdOrderForContact.name + ' 点外卖 🎁';
        html += '<div class="fd-nav-title">' + navTitle + '</div></div><div class="fd-nav-right">';
        // 给好友点外卖按钮
        html += '<div class="fd-nav-btn" onclick="fdShowOrderForFriend()" title="给好友点外卖"><i class="fas fa-gift"></i></div>';
        html += '<div class="fd-nav-btn" onclick="fdOpenSettings()" title="设置"><i class="fas fa-cog"></i></div>';
        html += '<div class="fd-nav-btn" onclick="fdRefreshHome()" title="刷新"><i class="fas fa-sync-alt"></i></div>';
        html += '</div></div>';

        // 如果正在给好友点外卖，显示横幅提示
        if (fdOrderForContact) {
            html += '<div class="fd-gift-banner">';
            html += '<div class="fd-gift-banner-left"><i class="fas fa-gift"></i> 正在给 <strong>' + fdOrderForContact.name + '</strong> 点外卖</div>';
            html += '<div class="fd-gift-banner-right" onclick="fdCancelOrderForContact()">取消</div>';
            html += '</div>';
        }

        if (fdCurrentTab === 'home') {
            html += '<div class="fd-search-bar" style="width:100%;box-sizing:border-box;overflow:hidden;"><div class="fd-search-input-wrap" style="min-width:0;overflow:hidden;"><i class="fas fa-search"></i>';
            html += '<input type="text" id="fd-search-input" placeholder="搜索美食、商家" style="min-width:0;width:0;" onkeydown="if(event.key===\'Enter\')fdSearch()"></div>';
            html += '<button class="fd-search-btn" style="flex-shrink:0;white-space:nowrap;" onclick="fdSearch()">搜索</button></div>';
        }

        html += '<div class="fd-scroll-content" id="fd-scroll-content">';
        if (fdCurrentTab === 'home') {
            if (fdSearchResults) {
                html += renderSearchResults();
            } else {
                html += renderHomeContentSkeleton();
            }
        } else if (fdCurrentTab === 'health') {
            html += renderHealthPage();
        } else if (fdCurrentTab === 'profile') {
            html += renderProfilePage();
        }
        html += '</div>';

        html += '<div class="fd-bottom-tabs">';
        html += '<div class="fd-bottom-tab ' + (fdCurrentTab==='home'?'active':'') + '" onclick="fdSwitchTab(\'home\')"><i class="fas fa-home"></i><span>首页</span></div>';
        html += '<div class="fd-bottom-tab ' + (fdCurrentTab==='health'?'active':'') + '" onclick="fdSwitchTab(\'health\')"><i class="fas fa-heartbeat"></i><span>健康饮食</span></div>';
        html += '<div class="fd-bottom-tab ' + (fdCurrentTab==='profile'?'active':'') + '" onclick="fdSwitchTab(\'profile\')"><i class="fas fa-user"></i><span>我的</span></div>';
        html += '</div>';

        container.innerHTML = html;

        // [FIX-自动调用API] 首页不再自动加载AI内容，改为显示静态内容
        // 只有用户点击刷新按钮时才调用API
        if (fdCurrentTab === 'home' && !fdSearchResults) {
            // 如果有缓存，显示缓存内容；否则显示静态提示
            if (_fdHomeLoaded && _fdCachedCoupons && _fdCachedPinFoods && _fdCachedShops) {
                loadHomeContentAsync(); // 有缓存时直接渲染，不调用API
            } else {
                renderStaticHomePlaceholder(); // 无缓存时显示静态内容
            }
        }
    }

    // ==================== 选择给哪个好友点外卖 ====================
    window.fdShowOrderForFriend = function() {
        var contacts = (store.contacts || []).filter(function(c){ return !c.isGroup; });
        if (!contacts.length) return toast('暂无联系人');

        var h = '<div class="fd-pay-overlay" onclick="this.remove()">';
        h += '<div class="fd-pay-sheet" onclick="event.stopPropagation()">';
        h += '<div class="fd-gift-sheet-inner">';

        // 固定头部：标题 + 关闭按钮
        h += '<div class="fd-pay-header"><h3>🎁 给谁点外卖？</h3>';
        h += '<div class="fd-pay-close" onclick="this.closest(\'.fd-pay-overlay\').remove()"><i class="fas fa-times"></i></div></div>';

        // 搜索框
        h += '<div class="fd-gift-search-wrap" style="position:relative;">';
        h += '<i class="fas fa-search"></i>';
        h += '<input type="text" id="fd-gift-search" placeholder="搜索联系人..." oninput="fdFilterGiftContacts(this.value)">';
        h += '</div>';

        // 可滚动的联系人列表区域
        h += '<div class="fd-gift-contact-scroll" id="fd-gift-contact-scroll">';

        // 给自己
        h += '<div class="fd-gift-contact-item' + (!fdOrderForContact ? ' active' : '') + '" onclick="fdSetOrderForSelf()">';
        h += '<div class="fd-gift-contact-avatar">🙋</div>';
        h += '<div class="fd-gift-contact-info"><div class="fd-gift-contact-name">给自己点</div><div class="fd-gift-contact-desc">外卖配送到自己的地址</div></div>';
        if (!fdOrderForContact) h += '<i class="fas fa-check-circle" style="color:#ff4500;font-size:18px;"></i>';
        h += '</div>';

        // 联系人列表
        h += '<div class="fd-gift-contact-divider">选择好友 (' + contacts.length + ')</div>';
        contacts.forEach(function(c) {
            var isActive = fdOrderForContact && fdOrderForContact.id === c.id;
            h += '<div class="fd-gift-contact-item' + (isActive ? ' active' : '') + '" data-name="' + (c.name || '').toLowerCase() + '" onclick="fdSetOrderForContact(\'' + c.id + '\')">';
            h += '<div class="fd-gift-contact-avatar">' + (c.avatar ? '<img src="' + c.avatar + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">' : '👤') + '</div>';
            h += '<div class="fd-gift-contact-info"><div class="fd-gift-contact-name">' + c.name + '</div><div class="fd-gift-contact-desc">给TA点外卖，送到TA那里</div></div>';
            if (isActive) h += '<i class="fas fa-check-circle" style="color:#ff4500;font-size:18px;"></i>';
            h += '</div>';
        });
        h += '</div>'; // fd-gift-contact-scroll

        // 底部取消按钮
        h += '<div class="fd-gift-bottom-bar">';
        h += '<button class="fd-gift-cancel-btn" onclick="this.closest(\'.fd-pay-overlay\').remove()">取消</button>';
        h += '</div>';

        h += '</div></div></div>'; // fd-gift-sheet-inner, fd-pay-sheet, fd-pay-overlay
        document.body.insertAdjacentHTML('beforeend', h);
    };

    // 搜索过滤联系人
    window.fdFilterGiftContacts = function(keyword) {
        var scroll = document.getElementById('fd-gift-contact-scroll');
        if (!scroll) return;
        var kw = (keyword || '').toLowerCase().trim();
        var items = scroll.querySelectorAll('.fd-gift-contact-item[data-name]');
        items.forEach(function(el) {
            var name = el.getAttribute('data-name') || '';
            el.style.display = (!kw || name.indexOf(kw) > -1) ? '' : 'none';
        });
    };

    window.fdSetOrderForSelf = function() {
        fdOrderForContact = null;
        fdDeliverTo = 'self';
        var ov = document.querySelector('.fd-pay-overlay'); if(ov) ov.remove();
        renderFoodDelivery();
        toast('📍 外卖将配送到自己的地址');
    };

    window.fdSetOrderForContact = function(contactId) {
        var c = (store.contacts || []).find(function(x){ return x.id === contactId; });
        if (!c) return;
        fdOrderForContact = c;
        fdDeliverTo = c.id;
        var ov = document.querySelector('.fd-pay-overlay'); if(ov) ov.remove();
        renderFoodDelivery();
        toast('🎁 正在给 ' + c.name + ' 点外卖');
    };

    window.fdCancelOrderForContact = function() {
        fdOrderForContact = null;
        fdDeliverTo = 'self';
        renderFoodDelivery();
        toast('已取消给好友点外卖');
    };

    // ==================== 首页骨架 ====================
    function renderHomeContentSkeleton() {
        var html = '';
        var sections = store.foodDelivery.sections || getDefaultSections();
        // 分类图标（静态，不需要API）
        html += '<div class="fd-category-grid">';
        sections.forEach(function(sec) {
            html += '<div class="fd-category-item" onclick="fdOpenCategory(\'' + sec.id + '\',\'' + sec.name.replace(/'/g,"\\'") + '\')">';
            html += '<div class="fd-category-icon">' + sec.emoji + '</div>';
            html += '<div class="fd-category-name">' + sec.name + '</div></div>';
        });
        html += '</div>';
        // 优惠券占位
        html += '<div id="fd-coupons-area">' + _loading() + '</div>';
        // 拼好饭占位
        html += '<div id="fd-pin-area">' + _loading() + '</div>';
        // 附近商家占位
        html += '<div id="fd-nearby-area">' + _loading() + '</div>';
        return html;
    }

    // ==================== 异步加载首页内容 ====================
    async function loadHomeContentAsync() {
        var coupons, pinFoods, shops;
        
        // [FIX-外卖刷新] 如果有缓存数据，直接使用缓存，不再调用API
        if (_fdHomeLoaded && _fdCachedCoupons && _fdCachedPinFoods && _fdCachedShops) {
            coupons = _fdCachedCoupons;
            pinFoods = _fdCachedPinFoods;
            shops = _fdCachedShops;
        } else {
            var prefs = store.foodDelivery.preferences;
            // 每次刷新随机选择一个商家分类，使首页内容更多样
            var homeCategories = ['美食','快餐简餐','甜点饮品','夜宵','火锅烤肉','西餐','面食粉丝','炸鸡汉堡','日韩料理','东南亚美食','粥品小吃','地方特色'];
            var randomCategory = homeCategories[Math.floor(Math.random() * homeCategories.length)];
            // 并行请求
            var results = await Promise.all([
                aiGenerateCoupons(),
                aiGeneratePinFoods(prefs),
                aiGenerateShops(randomCategory, 6)
            ]);
            coupons = results[0];
            pinFoods = results[1];
            shops = results[2];
            
            // [FIX-外卖刷新] 缓存结果
            _fdCachedCoupons = coupons;
            _fdCachedPinFoods = pinFoods;
            _fdCachedShops = shops;
            _fdHomeLoaded = true;
        }

        // 渲染优惠券
        var couponArea = document.getElementById('fd-coupons-area');
        if (couponArea) {
            var ch = '<div class="fd-coupon-bar">';
            (coupons || []).forEach(function(c) {
                ch += '<div class="fd-coupon-item"><div class="fd-coupon-amount"><small>¥</small>' + c.amount + '</div>';
                ch += '<div class="fd-coupon-desc">满' + c.threshold + '可用 · ' + (c.expiry||'限时') + '</div></div>';
            });
            ch += '</div>';
            couponArea.innerHTML = ch;
        }

        // 渲染拼好饭
        var pinArea = document.getElementById('fd-pin-area');
        if (pinArea) {
            var ph = '<div class="fd-pin-section"><div class="fd-pin-header">';
            ph += '<div class="fd-pin-title">🍱 拼好饭精选 <span class="fd-pin-badge">0起送 0配送</span></div>';
            ph += '<div class="fd-pin-more" onclick="fdOpenCategory(\'s6\',\'拼好饭\')">更多 ›</div></div>';
            ph += '<div class="fd-pin-list">';
            (pinFoods || []).forEach(function(f) {
                var n = (f.name||'').replace(/'/g,"\\'");
                var s = (f.shop||'').replace(/'/g,"\\'");
                ph += '<div class="fd-pin-card" onclick="fdQuickOrder(\'' + n + '\',\'' + (f.emoji||'🍽️') + '\',' + (f.price||10) + ',\'' + s + '\')">';
                ph += '<div class="fd-pin-card-img">' + (f.emoji||'🍽️') + '</div>';
                ph += '<div class="fd-pin-card-info"><div class="fd-pin-card-name">' + f.name + '</div>';
                ph += '<div class="fd-pin-card-price">¥' + (typeof f.price==='number'?f.price.toFixed(2):f.price) + '</div></div></div>';
            });
            ph += '</div></div>';
            pinArea.innerHTML = ph;
        }

        // 渲染附近商家
        var nearbyArea = document.getElementById('fd-nearby-area');
        if (nearbyArea) {
            nearbyArea.innerHTML = renderShopList(shops);
        }
    }

    function renderShopList(shops) {
        var html = '<div class="fd-nearby-section"><div class="fd-nearby-header">';
        html += '<div class="fd-nearby-tab active">附近商家</div>';
        html += '<div class="fd-nearby-tab">特价外卖</div></div>';
        (shops || []).forEach(function(shop) {
            var shopJson = encodeURIComponent(JSON.stringify(shop));
            html += '<div class="fd-shop-card" onclick="fdOpenShop(\'' + shopJson + '\')">';
            html += '<div class="fd-shop-logo">' + (shop.emoji||'🍽️') + '</div>';
            html += '<div class="fd-shop-info"><div class="fd-shop-name">' + shop.name + '</div>';
            html += '<div class="fd-shop-meta"><span class="fd-shop-rating">★ ' + (shop.rating||'4.5') + '</span><span>' + (shop.monthlySales||'500+') + '</span><span>' + (shop.deliveryTime||'30分钟') + '</span></div>';
            html += '<div class="fd-shop-meta"><span>' + (shop.minOrder||'¥15起送') + '</span><span>' + (shop.deliveryFee||'免配送费') + '</span></div>';
            var tags = shop.tags || [];
            if (tags.length) html += '<div class="fd-shop-tags">' + tags.map(function(t){ return '<span class="fd-shop-tag">' + t + '</span>'; }).join('') + '</div>';
            html += '</div></div>';
        });
        html += '</div>';
        return html;
    }

    // ==================== 搜索 ====================
    window.fdSearch = async function() {
        var input = document.getElementById('fd-search-input');
        if (!input) return;
        var query = input.value.trim();
        if (!query) { fdSearchResults = null; renderFoodDelivery(); return; }

        var content = document.getElementById('fd-scroll-content');
        if (content) content.innerHTML = _loading();

        var results = await aiGenerateFoods(query, store.foodDelivery.preferences);
        fdSearchResults = { query: query, results: results };
        renderFoodDelivery();
        setTimeout(function() { var inp = document.getElementById('fd-search-input'); if (inp) inp.value = query; }, 50);
    };

    function renderSearchResults() {
        if (!fdSearchResults) return '';
        var html = '<div style="padding:12px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">';
        html += '<span style="font-size:15px;font-weight:600;">「' + fdSearchResults.query + '」的搜索结果</span>';
        html += '<span style="font-size:13px;color:#ff4500;cursor:pointer;" onclick="fdClearSearch()">清除</span></div></div>';
        html += '<div class="fd-food-grid">';
        (fdSearchResults.results || []).forEach(function(f) {
            var n = (f.name||'').replace(/'/g,"\\'");
            var s = (f.shop||'').replace(/'/g,"\\'");
            html += '<div class="fd-food-card" onclick="fdQuickOrder(\'' + n + '\',\'' + (f.emoji||'🍔') + '\',' + (f.price||15) + ',\'' + s + '\')">';
            html += '<div class="fd-food-card-img">' + (f.emoji||'🍔') + '</div>';
            html += '<div class="fd-food-card-body"><div class="fd-food-card-name">' + f.name + '</div>';
            html += '<div class="fd-food-card-shop">' + (f.shop||'') + '</div>';
            html += '<div class="fd-food-card-price">¥' + (typeof f.price==='number'?f.price.toFixed(2):f.price) + '</div></div></div>';
        });
        html += '</div>';
        return html;
    }

    window.fdClearSearch = function() { fdSearchResults = null; renderFoodDelivery(); };

    // ==================== 分类页面 ====================
    window.fdOpenCategory = async function(secId, secName) {
        var sec = (store.foodDelivery.sections || []).find(function(s){ return s.id === secId; });
        var catName = secName || (sec ? sec.name : '美食');
        var catEmoji = sec ? sec.emoji : '🍽️';
        var content = document.getElementById('fd-scroll-content');
        if (!content) return;

        content.innerHTML = '<div style="padding:12px 12px 4px;display:flex;align-items:center;gap:8px;">'
            + '<span style="font-size:20px;">' + catEmoji + '</span>'
            + '<span style="font-size:16px;font-weight:700;">' + catName + '</span>'
            + '<span style="font-size:12px;color:#999;margin-left:auto;cursor:pointer;" onclick="renderFoodDelivery()">← 返回</span></div>'
            + _loading();

        var shops = await aiGenerateShops(catName, 6);
        if (content) {
            var html = '<div style="padding:12px 12px 4px;display:flex;align-items:center;gap:8px;">'
                + '<span style="font-size:20px;">' + catEmoji + '</span>'
                + '<span style="font-size:16px;font-weight:700;">' + catName + '</span>'
                + '<span style="font-size:12px;color:#999;margin-left:auto;cursor:pointer;" onclick="renderFoodDelivery()">← 返回</span></div>';
            html += renderShopList(shops);
            content.innerHTML = html;
        }
    };

    // ==================== 商家详情页 ====================
    window.fdOpenShop = async function(shopDataStr) {
        try { fdCurrentShop = JSON.parse(decodeURIComponent(shopDataStr)); } catch(e) { return; }
        var content = document.getElementById('fd-scroll-content');
        if (!content) return;

        // [FIX-商家详情遮挡] 隐藏搜索栏和底部Tab栏，商家详情页不需要它们
        var searchBar = document.querySelector('.fd-search-bar');
        if (searchBar) searchBar.style.display = 'none';
        var bottomTabs = document.querySelector('.fd-bottom-tabs');
        if (bottomTabs) bottomTabs.style.display = 'none';

        // 先渲染骨架
        var shop = fdCurrentShop;
        var html = '<div class="fd-shop-detail">';
        html += '<div class="fd-shop-detail-header"><div class="fd-shop-detail-nav">';
        html += '<div class="fd-nav-btn" onclick="fdCloseShop()"><i class="fas fa-chevron-left"></i></div>';
        html += '<div style="display:flex;gap:10px;"><div class="fd-nav-btn"><i class="fas fa-search"></i></div><div class="fd-nav-btn"><i class="fas fa-star"></i></div></div></div>';
        html += '<div class="fd-shop-detail-info"><div class="fd-shop-detail-logo">' + (shop.emoji||'🍽️') + '</div>';
        html += '<div class="fd-shop-detail-text"><h3>' + shop.name + '</h3>';
        html += '<p>★ ' + (shop.rating||'4.5') + ' · ' + (shop.monthlySales||'') + ' · ' + (shop.deliveryTime||'') + '</p>';
        html += '<p>' + (shop.minOrder||'') + ' · ' + (shop.deliveryFee||'') + '</p></div></div></div>';
        html += '<div class="fd-shop-detail-tabs"><div class="fd-shop-detail-tab active">点菜</div>';
        html += '<div class="fd-shop-detail-tab">超优惠</div><div class="fd-shop-detail-tab">评价</div><div class="fd-shop-detail-tab">商家</div></div>';
        html += '<div class="fd-shop-detail-body"><div class="fd-menu-sidebar" id="fd-menu-sidebar">' + _loading() + '</div>';
        html += '<div class="fd-menu-content" id="fd-menu-content">' + _loading() + '</div></div>';
        // 底部购物车栏
        var shopId = shop.id || shop.name;
        var shopCount = fdGetShopCartCount(shopId);
        var shopTotal = fdGetShopCartTotal(shopId);
        var minOrder = parseFloat((shop.minOrder || '').replace(/[^0-9.]/g, '')) || 0;
        var diff = Math.max(0, minOrder - shopTotal);
        html += '<div class="fd-shop-cart-bar" id="fd-shop-cart-bar">' + fdRenderShopCartBar(shopCount, shopTotal, minOrder, diff) + '</div>';
        html += '</div>';
        content.innerHTML = html;

        // 异步加载菜单
        var categories = await aiGenerateShopMenu(shop.name, shop.emoji || '🍽️');
        // 注入自定义菜品作为额外分类
        var customFoods = (store.foodDelivery && store.foodDelivery.customFoods) || [];
        if (customFoods.length > 0) {
            var customCat = { name: '自定义', items: customFoods.map(function(cf) {
                return { id: cf.id, name: cf.name, emoji: cf.emoji || '🍽️', price: cf.price, desc: cf.desc || '', sales: '自定义', originalPrice: null };
            })};
            categories = (categories || []).concat([customCat]);
        }
        shop.categories = categories;

        var sidebar = document.getElementById('fd-menu-sidebar');
        var menuContent = document.getElementById('fd-menu-content');
        if (!sidebar || !menuContent) return;

        var sideHtml = '';
        (categories || []).forEach(function(cat, i) {
            sideHtml += '<div class="fd-menu-sidebar-item ' + (i===0?'active':'') + '" onclick="fdScrollToCategory(' + i + ',this)">' + cat.name + '</div>';
        });
        sidebar.innerHTML = sideHtml;

        var menuHtml = '';
        var shopNameEsc = shop.name.replace(/'/g,"\\'");
        var shopInfoForCart = {
            id: shop.id || shop.name,
            name: shop.name,
            emoji: shop.emoji || '🍽️',
            deliveryFee: shop.deliveryFee,
            minOrder: shop.minOrder,
            deliveryTime: shop.deliveryTime,
            rating: shop.rating
        };
        (categories || []).forEach(function(cat, i) {
            menuHtml += '<div class="fd-menu-category-title" id="fd-cat-' + i + '">' + cat.name + '</div>';
            (cat.items || []).forEach(function(item) {
                var itemId = item.id || 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
                menuHtml += '<div class="fd-menu-item"><div class="fd-menu-item-img">' + (item.emoji||'🍽️') + '</div>';
                menuHtml += '<div class="fd-menu-item-info"><div class="fd-menu-item-name">' + item.name + '</div>';
                menuHtml += '<div class="fd-menu-item-desc">' + (item.desc||'') + '</div>';
                menuHtml += '<div class="fd-menu-item-sales">' + (item.sales||'') + '</div>';
                menuHtml += '<div class="fd-menu-item-bottom"><div class="fd-menu-item-price">¥' + item.price;
                if (item.originalPrice) menuHtml += ' <small style="text-decoration:line-through;color:#ccc;">¥' + item.originalPrice + '</small>';
                menuHtml += '</div>';
                menuHtml += '<button class="fd-menu-item-add" onclick="event.stopPropagation();fdAddItemFromMenu(\'' + itemId + '\',\'' + (item.name||'').replace(/'/g,"\\'") + '\',\'' + (item.emoji||'🍽️') + '\',' + (item.price||15) + ',' + (item.originalPrice||0) + ',\'' + (item.desc||'').replace(/'/g,"\\'") + '\')">+</button>';
                menuHtml += '</div></div></div>';
            });
        });
        menuContent.innerHTML = menuHtml;
        // 更新购物车UI
        fdUpdateCartUI();
    };

    // 从菜单添加到购物车
    window.fdAddItemFromMenu = function(itemId, name, emoji, price, originalPrice, desc) {
        if (!fdCurrentShop) return toast('店铺信息丢失');
        var shopInfo = {
            id: fdCurrentShop.id || fdCurrentShop.name,
            name: fdCurrentShop.name,
            emoji: fdCurrentShop.emoji || '🍽️',
            deliveryFee: fdCurrentShop.deliveryFee,
            minOrder: fdCurrentShop.minOrder,
            deliveryTime: fdCurrentShop.deliveryTime,
            rating: fdCurrentShop.rating
        };
        var item = {
            id: itemId,
            name: name,
            emoji: emoji,
            price: price,
            originalPrice: originalPrice || null,
            desc: desc || ''
        };
        fdAddToCart(shopInfo, item);
    };

    window.fdCloseShop = function() { fdCurrentShop = null; renderFoodDelivery(); };
    window.fdScrollToCategory = function(idx, el) {
        var t = document.getElementById('fd-cat-' + idx);
        if (t) t.scrollIntoView({ behavior: 'smooth' });
        document.querySelectorAll('.fd-menu-sidebar-item').forEach(function(e){ e.classList.remove('active'); });
        if (el) el.classList.add('active');
    };

    // ==================== 下单/支付 ====================
    window.fdQuickOrder = function(name, emoji, price, shop) {
        var contacts = (store.contacts || []).filter(function(c){ return !c.isGroup; });
        var payHtml = '<div class="fd-pay-overlay" onclick="this.remove()">';
        payHtml += '<div class="fd-pay-sheet" onclick="event.stopPropagation()">';
        payHtml += '<div class="fd-pay-header"><h3>确认订单</h3>';
        payHtml += '<div class="fd-pay-close" onclick="this.closest(\'.fd-pay-overlay\').remove()"><i class="fas fa-times"></i></div></div>';
        payHtml += '<div class="fd-pay-item-preview"><div class="fd-pay-item-emoji">' + emoji + '</div>';
        payHtml += '<div class="fd-pay-item-detail"><h4>' + name + '</h4><p>' + shop + '</p></div></div>';
        payHtml += '<div class="fd-pay-total">¥' + (typeof price==='number'?price.toFixed(2):price) + '</div>';

        // === 配送地址选择 ===
        payHtml += '<div class="fd-deliver-to-section">';
        payHtml += '<div class="fd-deliver-to-title"><i class="fas fa-map-marker-alt"></i> 配送给谁</div>';
        // 送给自己
        payHtml += '<div class="fd-deliver-to-option' + (fdDeliverTo === 'self' ? ' active' : '') + '" onclick="fdSelectDeliverTo(this,\'self\')">';
        payHtml += '<div class="fd-deliver-to-icon">🙋</div>';
        payHtml += '<div class="fd-deliver-to-info"><div class="fd-deliver-to-name">送给自己</div></div>';
        payHtml += '<div class="fd-deliver-to-check">' + (fdDeliverTo === 'self' ? '<i class="fas fa-check-circle"></i>' : '<i class="far fa-circle"></i>') + '</div></div>';
        // 送给好友
        if (fdOrderForContact) {
            var fc = fdOrderForContact;
            payHtml += '<div class="fd-deliver-to-option active" onclick="fdSelectDeliverTo(this,\'' + fc.id + '\')">';
            payHtml += '<div class="fd-deliver-to-icon">🎁</div>';
            payHtml += '<div class="fd-deliver-to-info"><div class="fd-deliver-to-name">送给 ' + fc.name + '</div><div class="fd-deliver-to-desc">外卖将送到TA那里</div></div>';
            payHtml += '<div class="fd-deliver-to-check"><i class="fas fa-check-circle"></i></div></div>';
        }
        // 快速选好友
        if (contacts.length > 0) {
            payHtml += '<div class="fd-deliver-to-expand" onclick="fdExpandDeliverContacts(this)"><i class="fas fa-user-plus"></i> 送给其他好友 <i class="fas fa-chevron-down fd-deliver-arrow"></i></div>';
            payHtml += '<div class="fd-deliver-contacts-list" style="display:none;">';
            contacts.forEach(function(c) {
                if (fdOrderForContact && fdOrderForContact.id === c.id) return;
                payHtml += '<div class="fd-deliver-to-option" onclick="fdSelectDeliverTo(this,\'' + c.id + '\')">';
                payHtml += '<div class="fd-deliver-to-icon">' + (c.avatar ? '<img src="' + c.avatar + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">' : '👤') + '</div>';
                payHtml += '<div class="fd-deliver-to-info"><div class="fd-deliver-to-name">送给 ' + c.name + '</div></div>';
                payHtml += '<div class="fd-deliver-to-check"><i class="far fa-circle"></i></div></div>';
            });
            payHtml += '</div>';
        }
        payHtml += '</div>';

        payHtml += '<div class="fd-pay-methods">';

        // === 类别1: 自己支付 ===
        payHtml += '<div class="fd-pay-category">';
        payHtml += '<div class="fd-pay-category-header" onclick="fdTogglePayCategory(this)">';
        payHtml += '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">💰</span><span style="font-weight:600;">自己支付</span></div>';
        payHtml += '<i class="fas fa-chevron-down fd-pay-cat-arrow"></i></div>';
        payHtml += '<div class="fd-pay-category-body show">';
        payHtml += '<div class="fd-pay-method selected" onclick="fdSelectPayMethod(this,\'self\')">';
        payHtml += '<div class="fd-pay-method-icon" style="background:#e8f5e9;color:#4caf50;">💳</div>';
        payHtml += '<div class="fd-pay-method-info"><div class="fd-pay-method-name">余额支付</div><div class="fd-pay-method-desc">使用账户余额</div></div>';
        payHtml += '<div class="fd-pay-method-check"><i class="fas fa-check"></i></div></div>';
        payHtml += '</div></div>';

        // === 类别2: 好友代付 ===
        if (contacts.length > 0) {
            payHtml += '<div class="fd-pay-category">';
            payHtml += '<div class="fd-pay-category-header" onclick="fdTogglePayCategory(this)">';
            payHtml += '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">👥</span><span style="font-weight:600;">好友代付</span><span style="font-size:11px;color:#999;">(' + contacts.length + '位好友)</span></div>';
            payHtml += '<i class="fas fa-chevron-right fd-pay-cat-arrow"></i></div>';
            payHtml += '<div class="fd-pay-category-body">';
            contacts.forEach(function(c) {
                payHtml += '<div class="fd-pay-method" onclick="fdSelectPayMethod(this,\'proxy_' + c.id + '\')">';
                payHtml += '<div class="fd-pay-method-icon" style="background:#fff3e0;color:#ff9800;">👤</div>';
                payHtml += '<div class="fd-pay-method-info"><div class="fd-pay-method-name">' + c.name + '</div><div class="fd-pay-method-desc">发送代付请求</div></div>';
                payHtml += '<div class="fd-pay-method-check"></div></div>';
            });
            payHtml += '</div></div>';
        }

        // === 类别3: 亲属卡 ===
        if (contacts.length > 0) {
            payHtml += '<div class="fd-pay-category">';
            payHtml += '<div class="fd-pay-category-header" onclick="fdTogglePayCategory(this)">';
            payHtml += '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;">💳</span><span style="font-weight:600;">亲属卡支付</span><span style="font-size:11px;color:#999;">(' + contacts.length + '张卡)</span></div>';
            payHtml += '<i class="fas fa-chevron-right fd-pay-cat-arrow"></i></div>';
            payHtml += '<div class="fd-pay-category-body">';
            contacts.forEach(function(c) {
                payHtml += '<div class="fd-pay-method" onclick="fdSelectPayMethod(this,\'family_' + c.id + '\')">';
                payHtml += '<div class="fd-pay-method-icon" style="background:#e3f2fd;color:#2196f3;">💳</div>';
                payHtml += '<div class="fd-pay-method-info"><div class="fd-pay-method-name">' + c.name + '的亲属卡</div><div class="fd-pay-method-desc">消费通知将发送给' + c.name + '</div></div>';
                payHtml += '<div class="fd-pay-method-check"></div></div>';
            });
            payHtml += '</div></div>';
        }

        payHtml += '</div><button class="fd-pay-submit" onclick="fdConfirmPay(\'' + name.replace(/'/g,"\\'") + '\',\'' + emoji + '\',' + (typeof price==='number'?price:parseFloat(price)||15) + ',\'' + shop.replace(/'/g,"\\'") + '\')">确认支付</button></div></div>';
        document.body.insertAdjacentHTML('beforeend', payHtml);
    };

    // === 配送地址展开/收起 ===
    window.fdExpandDeliverContacts = function(el) {
        var list = el.nextElementSibling;
        var arrow = el.querySelector('.fd-deliver-arrow');
        if (list.style.display === 'none') {
            list.style.display = 'block';
            if (arrow) arrow.className = 'fas fa-chevron-up fd-deliver-arrow';
        } else {
            list.style.display = 'none';
            if (arrow) arrow.className = 'fas fa-chevron-down fd-deliver-arrow';
        }
    };

    window.fdSelectDeliverTo = function(el, target) {
        fdDeliverTo = target;
        // 更新UI
        document.querySelectorAll('.fd-deliver-to-option').forEach(function(e){
            e.classList.remove('active');
            var ck = e.querySelector('.fd-deliver-to-check');
            if (ck) ck.innerHTML = '<i class="far fa-circle"></i>';
        });
        el.classList.add('active');
        var ck = el.querySelector('.fd-deliver-to-check');
        if (ck) ck.innerHTML = '<i class="fas fa-check-circle"></i>';
    };

    window.fdTogglePayCategory = function(header) {
        var body = header.nextElementSibling;
        var arrow = header.querySelector('.fd-pay-cat-arrow');
        if (body.classList.contains('show')) {
            body.classList.remove('show');
            if (arrow) { arrow.className = 'fas fa-chevron-right fd-pay-cat-arrow'; }
        } else {
            body.classList.add('show');
            if (arrow) { arrow.className = 'fas fa-chevron-down fd-pay-cat-arrow'; }
        }
    };

    window.fdSelectPayMethod = function(el, method) {
        fdSelectedPayMethod = method;
        document.querySelectorAll('.fd-pay-method').forEach(function(e){ e.classList.remove('selected'); });
        el.classList.add('selected');
    };

    window.fdConfirmPay = function(name, emoji, price, shop) {
        var deliverToContact = null;
        if (fdDeliverTo && fdDeliverTo !== 'self') {
            deliverToContact = (store.contacts||[]).find(function(x){return x.id===fdDeliverTo;});
        }

        var order = {
            id: 'order_'+Date.now(),
            name: name,
            emoji: emoji,
            price: price,
            shop: shop,
            time: Date.now(),
            payMethod: fdSelectedPayMethod,
            deliverTo: fdDeliverTo,
            deliverToName: deliverToContact ? deliverToContact.name : '自己',
            isGift: !!deliverToContact
        };

        store.foodDelivery.orders.push(order);

        // 只有送给自己才记录健康日志
        if (!deliverToContact) {
            store.foodDelivery.healthLog.push({ id:'meal_'+Date.now(), name:name, emoji:emoji, calories:null, time:Date.now(), mealType:getMealType(), source:'order' });
        }

        var ov = document.querySelector('.fd-pay-overlay'); if(ov) ov.remove();

        if (fdSelectedPayMethod === 'self') {
            if (deliverToContact) {
                // 送给好友
                sendGiftOrder(deliverToContact, order);
                toast('🎁 已给 ' + deliverToContact.name + ' 下单！' + name);
            } else {
                toast('🎉 下单成功！' + name);
            }
            // [FIX-外卖扣款] 自己付款时扣减余额并记录账单
            if (typeof store.user.balance === 'number') {
                store.user.balance = Math.max(0, store.user.balance - price);
            }
            if (!store.bills) store.bills = [];
            store.bills.push({
                type: 'out',
                desc: (deliverToContact ? '外卖(送给' + deliverToContact.name + ') - ' : '外卖 - ') + name + '(' + shop + ')',
                amt: price,
                time: Date.now()
            });
            recordFoodOrder(order);
        }
        else if (fdSelectedPayMethod.indexOf('proxy_')===0) {
            sendProxyPayRequest(fdSelectedPayMethod.replace('proxy_',''), order);
        }
        else if (fdSelectedPayMethod.indexOf('family_')===0) {
            handleFamilyCardPay(fdSelectedPayMethod.replace('family_',''), order);
        }

        fdSelectedPayMethod = 'self';
        // 如果是给好友点外卖模式，下单后自动退出该模式
        if (deliverToContact) {
            fdOrderForContact = null;
            fdDeliverTo = 'self';
        }
        _fdSave();

        // 下单成功后延迟弹出小票
        setTimeout(function() {
            fdShowReceipt(order.id);
        }, 500);
    };

    function getMealType() {
        var h = new Date().getHours();
        if (h>=5&&h<10) return '早餐'; if (h>=10&&h<14) return '午餐';
        if (h>=14&&h<17) return '下午茶'; if (h>=17&&h<21) return '晚餐'; return '夜宵';
    }

    // ==================== 送外卖给好友 ====================
    function sendGiftOrder(contact, order) {
        if (!contact) return;
        var bubble = '<div class="fd-gift-bubble"><div class="fd-gift-bubble-header"><i class="fas fa-gift"></i> 给你点了外卖！</div>'
            + '<div class="fd-gift-bubble-body"><div class="fd-gift-bubble-item"><div class="fd-gift-bubble-emoji">' + order.emoji + '</div>'
            + '<div class="fd-gift-bubble-info"><div class="fd-gift-bubble-name">' + order.name + '</div>'
            + '<div style="font-size:11px;color:#999;">' + order.shop + '</div>'
            + '<div class="fd-gift-bubble-price">¥' + (typeof order.price==='number'?order.price.toFixed(2):order.price) + '</div></div></div></div>'
            + '<div class="fd-gift-bubble-footer"><div class="fd-gift-bubble-status">🛵 骑手正在取餐中...</div></div></div>';

        if(!store.chats) store.chats = {};
        if(!store.chats[contact.id]) store.chats[contact.id] = [];
        store.chats[contact.id].push({
            sender: 'me',
            content: '给你点了外卖~ 🎁 快来看看吧！\n[外卖投喂] ' + order.name + ' - ' + order.shop + ' ¥' + order.price,
            time: Date.now(),
            type: 'food-gift',
            foodOrder: order
        });

        // 记录到 giftOrders
        store.foodDelivery.giftOrders.push({
            id: order.id,
            direction: 'sent', // 我送出去的
            contactId: contact.id,
            contactName: contact.name,
            name: order.name,
            emoji: order.emoji,
            price: order.price,
            shop: order.shop,
            time: Date.now(),
            status: 'delivering'
        });

        recordFoodOrder(order, 'gift_sent', contact.name);
        _fdSave();
    }

    // ==================== 联系人给用户点外卖 ====================
    // 这个功能由联系人主动触发，通过聊天消息发起
    // [FIX-外卖上下文] 新增chatContext参数，接收聊天上下文以精准点餐
    window.fdContactOrderForMe = function(contactId, chatContext) {
        var c = (store.contacts||[]).find(function(x){return x.id===contactId;});
        if (!c) return toast('联系人不存在');
        initFoodDeliveryData();

        // 生成外卖，传入聊天上下文
        _fdGenerateContactGift(c, chatContext || '');
    };

    async function _fdGenerateContactGift(contact, chatContext) {
        toast('🎁 ' + contact.name + ' 正在给你挑外卖...');

        // [FIX-外卖上下文] 根据聊天上下文生成精准的外卖，不再随机
        var prompt = '';
        if (chatContext && chatContext.trim()) {
            prompt = '你是外卖平台下单系统。根据以下聊天记录，判断联系人想给用户点什么外卖，必须严格按照聊天中提到的店铺和菜品来生成。\n\n聊天记录:\n' + chatContext.substring(0, 500) + '\n\n请根据聊天内容中提到的具体店铺/菜品生成订单。如果聊天中提到了"蜜雪冰城"就必须是蜜雪冰城的菜品，提到了"奶茶"就必须是奶茶。\n返回JSON:{\"name\":\"菜品名\",\"emoji\":\"食物emoji\",\"price\":数字(10-35元),\"shop\":\"店铺名(必须与聊天中提到的一致)\",\"message\":\"一句温馨的送餐留言\"}\n只返回JSON。';
        } else {
            prompt = '你是外卖平台推荐系统。请为用户挑选1个适合的外卖菜品作为礼物。\n返回JSON:{\"name\":\"菜品名\",\"emoji\":\"食物emoji\",\"price\":数字(10-35元),\"shop\":\"店铺名\",\"message\":\"一句温馨的送餐留言\"}\n只返回JSON。';
        }
        var resp = await callAPI([{role:'user',content:prompt}], {temperature: chatContext ? 0.3 : 0.95, max_tokens:200});
        var item = null;
        if (resp) {
            try {
                var m2 = resp.match(/\{[\s\S]*\}/);
                if (m2) item = JSON.parse(m2[0]);
            } catch(e) {}
        }
        if (!item) {
            item = {name:'奶茶', emoji:'🧋', price:12.9, shop:'蜜雪冰城', message:'天气冷了，喝杯奶茶暖暖吧~'};
        }

        var order = {
            id: 'recv_' + Date.now(),
            name: item.name,
            emoji: item.emoji,
            price: item.price,
            shop: item.shop,
            time: Date.now(),
            fromContactId: contact.id,
            fromContactName: contact.name,
            message: item.message || '给你点了好吃的~'
        };

        // 在聊天中显示
        var bubble = '<div class="fd-gift-bubble received"><div class="fd-gift-bubble-header"><i class="fas fa-gift"></i> 给你点了外卖！</div>'
            + '<div class="fd-gift-bubble-body"><div class="fd-gift-bubble-item"><div class="fd-gift-bubble-emoji">' + order.emoji + '</div>'
            + '<div class="fd-gift-bubble-info"><div class="fd-gift-bubble-name">' + order.name + '</div>'
            + '<div style="font-size:11px;color:#999;">' + order.shop + '</div>'
            + '<div class="fd-gift-bubble-price">¥' + (typeof order.price==='number'?order.price.toFixed(2):order.price) + '</div></div></div>'
            + '<div class="fd-gift-bubble-msg">' + (order.message||'') + '</div></div>'
            + '<div class="fd-gift-bubble-footer"><div class="fd-gift-bubble-status">🛵 骑手正在取餐中...</div>'
            + '<div class="fd-gift-bubble-btn-row">'
            + '<div class="fd-gift-bubble-btn" onclick="fdThankContact(\'' + contact.id + '\')">💕 谢谢</div>'
            + '<div class="fd-gift-bubble-btn" onclick="fdReturnGift(\'' + contact.id + '\')">🎁 回请TA</div>'
            + '</div></div></div>';

        if(!store.chats) store.chats = {};
        if(!store.chats[contact.id]) store.chats[contact.id] = [];
        store.chats[contact.id].push({
            sender: contact.id,
            content: (order.message || '给你点了好吃的~') + '\n[外卖投喂] ' + order.name + ' - ' + order.shop + ' ¥' + order.price,
            time: Date.now(),
            type: 'food-gift-received',
            foodOrder: order
        });

        // 记录到receivedOrders和giftOrders
        store.foodDelivery.receivedOrders.push(order);
        store.foodDelivery.giftOrders.push({
            id: order.id,
            direction: 'received', // 收到的
            contactId: contact.id,
            contactName: contact.name,
            name: order.name,
            emoji: order.emoji,
            price: order.price,
            shop: order.shop,
            time: Date.now(),
            message: order.message,
            status: 'delivering'
        });

        // 记录到健康日志
        store.foodDelivery.healthLog.push({
            id: 'meal_'+Date.now(),
            name: order.name,
            emoji: order.emoji,
            calories: null,
            time: Date.now(),
            mealType: getMealType(),
            source: 'gift_from_' + contact.name
        });

        recordFoodOrder(order, 'gift_received', contact.name);
        _fdSave();

        toast('🎁 ' + contact.name + ' 给你点了 ' + order.emoji + order.name + '！');

        // 如果当前在聊天界面，刷新
        if (typeof renderHistory === 'function') {
            try { renderHistory(); } catch(e) {}
        }
    }

    // 感谢联系人
    window.fdThankContact = function(contactId) {
        var c = (store.contacts||[]).find(function(x){return x.id===contactId;});
        if (!c) return;
        if (!store.chats) store.chats = {};
        if (!store.chats[contactId]) store.chats[contactId] = [];
        store.chats[contactId].push({
            sender: 'me',
            content: '谢谢你给我点的外卖！好感动~ 💕🥰',
            time: Date.now()
        });
        _fdSave();
        toast('💕 已发送感谢消息');
        if (typeof renderHistory === 'function') {
            try { renderHistory(); } catch(e) {}
        }
    };

    // 回请联系人
    window.fdReturnGift = function(contactId) {
        var c = (store.contacts||[]).find(function(x){return x.id===contactId;});
        if (!c) return;
        // 进入给这个联系人点外卖的模式
        window.renderFoodDeliveryForContact(contactId);
    };

    // ==================== 代付功能 ====================
    function sendProxyPayRequest(contactId, order) {
        var c = (store.contacts||[]).find(function(x){return x.id===contactId;}); if(!c) return toast('联系人不存在');
        var deliverText = order.isGift ? ('（送给' + order.deliverToName + '）') : '';
        var bubble = '<div class="fd-proxy-pay-bubble"><div class="fd-proxy-pay-bubble-header"><i class="fas fa-utensils"></i> 外卖代付请求' + deliverText + '</div><div class="fd-proxy-pay-bubble-body"><div class="fd-proxy-pay-bubble-item"><div class="fd-proxy-pay-bubble-emoji">' + order.emoji + '</div><div class="fd-proxy-pay-bubble-info"><div class="fd-proxy-pay-bubble-name">' + order.name + '</div><div style="font-size:11px;color:#999;">' + order.shop + '</div><div class="fd-proxy-pay-bubble-price">¥' + (typeof order.price==='number'?order.price.toFixed(2):order.price) + '</div></div></div></div><div class="fd-proxy-pay-bubble-footer"><div class="fd-proxy-pay-bubble-btn">忽略</div><div class="fd-proxy-pay-bubble-btn accept">帮TA付款</div></div></div>';
        if(!store.chats) store.chats={};
        if(!store.chats[contactId]) store.chats[contactId]=[];
        store.chats[contactId].push({sender:'me',content:'帮我付一下外卖嘛~ 🥺\n[外卖代付] '+order.name+' - '+order.shop+' ¥'+order.price + deliverText,time:Date.now(),type:'food-proxy-pay',foodOrder:order});
        toast('已向 '+c.name+' 发送代付请求！'); recordFoodOrder(order,'proxy',c.name); _fdSave();
    }

    function handleFamilyCardPay(contactId, order) {
        var c = (store.contacts||[]).find(function(x){return x.id===contactId;}); if(!c) return toast('联系人不存在');
        var deliverText = order.isGift ? ('，送给' + order.deliverToName) : '';
        toast('🎉 已使用 '+c.name+' 的亲属卡支付 ¥'+order.price);
        if(!store.chats) store.chats={};
        if(!store.chats[contactId]) store.chats[contactId]=[];
        store.chats[contactId].push({sender:'system',content:'[亲属卡消费提醒] 你的亲属卡被使用了 ¥'+order.price+'，消费内容：'+order.name+'（'+order.shop+'）' + deliverText,time:Date.now(),type:'food-family-card',foodOrder:order});
        recordFoodOrder(order,'family',c.name); _fdSave();

        // 如果是送给好友的，也发送通知
        if (order.isGift && order.deliverTo !== contactId) {
            var deliverContact = (store.contacts||[]).find(function(x){return x.id===order.deliverTo;});
            if (deliverContact) sendGiftOrder(deliverContact, order);
        }
    }

    function recordFoodOrder(order, payType, contactName) {
        store.foodDelivery._recentActivity.push({
            type: 'order',
            name: order.name,
            shop: order.shop,
            price: order.price,
            emoji: order.emoji,
            time: Date.now(),
            payType: payType||'self',
            contactName: contactName||'',
            isGift: order.isGift||false,
            deliverToName: order.deliverToName||'自己'
        });
        if (store.foodDelivery._recentActivity.length > 30) store.foodDelivery._recentActivity = store.foodDelivery._recentActivity.slice(-30);
    }

    // ==================== 健康饮食页面 ====================
    function renderHealthPage() {
        var log = store.foodDelivery.healthLog || [];
        var today = new Date().toDateString();
        var todayMeals = log.filter(function(m){ return new Date(m.time).toDateString()===today; });
        var totalCal = todayMeals.reduce(function(s,m){ return s+(m.calories||0); },0);

        var html = '<div class="fd-health-container">';
        html += '<div class="fd-health-card"><h3>📊 今日饮食统计</h3><div class="fd-health-summary">';
        html += '<div class="fd-health-stat"><div class="fd-health-stat-num">' + todayMeals.length + '</div><div class="fd-health-stat-label">餐数</div></div>';
        html += '<div class="fd-health-stat"><div class="fd-health-stat-num">' + (totalCal||'?') + '</div><div class="fd-health-stat-label">卡路里</div></div>';
        html += '<div class="fd-health-stat"><div class="fd-health-stat-num">' + (todayMeals.length>0?'已记录':'未记录') + '</div><div class="fd-health-stat-label">状态</div></div></div></div>';

        var mealTypes = ['早餐','午餐','下午茶','晚餐','夜宵'];
        var icons = {'早餐':'🌅','午餐':'☀️','下午茶':'🫖','晚餐':'🌆','夜宵':'🌙'};
        mealTypes.forEach(function(type) {
            var meals = todayMeals.filter(function(m){ return m.mealType===type; });
            html += '<div class="fd-health-card"><h3>' + (icons[type]||'🍽️') + ' ' + type + '</h3>';
            meals.forEach(function(m) {
                var sourceTag = '';
                if (m.source && m.source.indexOf('gift_from_') === 0) {
                    sourceTag = ' <span class="fd-gift-tag">🎁 ' + m.source.replace('gift_from_','') + '送的</span>';
                }
                html += '<div class="fd-meal-entry"><div class="fd-meal-entry-emoji">' + (m.emoji||'🍽️') + '</div>';
                html += '<div class="fd-meal-entry-info"><div class="fd-meal-entry-name">' + m.name + sourceTag + '</div>';
                html += '<div class="fd-meal-entry-cal">' + (m.calories?m.calories+' 卡':'热量未填写') + '</div></div>';
                html += '<div class="fd-meal-entry-delete" onclick="fdDeleteMeal(\'' + m.id + '\')"><i class="fas fa-trash-alt"></i></div></div>';
            });
            html += '<div class="fd-add-meal-btn" onclick="fdAddMeal(\'' + type + '\')"><i class="fas fa-plus"></i> 添加' + type + '记录</div></div>';
        });

        html += '<div class="fd-health-card"><h3>🤖 AI健康分析</h3><div id="fd-ai-analysis-result"></div>';
        html += '<button style="width:100%;padding:12px;background:#ff4500;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px;" onclick="fdAiAnalyze()">' + (todayMeals.length>0?'分析今日饮食':'请先添加餐食记录') + '</button>';
        html += '<button style="width:100%;padding:12px;background:#0284c7;color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px;" onclick="fdAiCalcCalories()">🔥 AI自动计算热量</button></div></div>';
        return html;
    }

    window.fdAddMeal = function(mealType) {
        var h = '<div class="fd-add-meal-overlay" onclick="this.remove()"><div class="fd-add-meal-modal" onclick="event.stopPropagation()"><h3>添加' + mealType + '记录</h3>';
        h += '<div class="fd-form-group"><label>食物名称</label><input type="text" id="fd-meal-name" placeholder="例：黄焖鸡米饭"></div>';
        h += '<div class="fd-form-group"><label>食物Emoji</label><input type="text" id="fd-meal-emoji" placeholder="🍛" maxlength="4"></div>';
        h += '<div class="fd-form-group"><label>热量（可选，可让AI计算）</label><input type="number" id="fd-meal-calories" placeholder="例：500"></div>';
        h += '<div class="fd-form-group"><label>描述</label><input type="text" id="fd-meal-photo-desc" placeholder="描述你吃的什么"></div>';
        h += '<div class="fd-form-actions"><button class="fd-btn-cancel" onclick="this.closest(\'.fd-add-meal-overlay\').remove()">取消</button>';
        h += '<button class="fd-btn-primary" onclick="fdSaveMeal(\'' + mealType + '\')">保存</button></div></div></div>';
        document.body.insertAdjacentHTML('beforeend', h);
    };

    window.fdSaveMeal = function(mealType) {
        var n = (document.getElementById('fd-meal-name')||{}).value; if(!n||!n.trim()) return toast('请输入食物名称'); n=n.trim();
        var e = ((document.getElementById('fd-meal-emoji')||{}).value||'').trim()||'🍽️';
        var cal = parseInt((document.getElementById('fd-meal-calories')||{}).value)||null;
        var desc = ((document.getElementById('fd-meal-photo-desc')||{}).value||'').trim();
        store.foodDelivery.healthLog.push({id:'meal_'+Date.now(),name:n,emoji:e,calories:cal,time:Date.now(),mealType:mealType,source:'manual',photoDesc:desc});
        store.foodDelivery._recentActivity.push({type:'eat',name:n,emoji:e,calories:cal,time:Date.now(),mealType:mealType});
        var ov=document.querySelector('.fd-add-meal-overlay'); if(ov) ov.remove();
        _fdSave(); toast('✅ 已记录：'+n); renderFoodDelivery();
    };

    window.fdDeleteMeal = function(id) {
        store.foodDelivery.healthLog = store.foodDelivery.healthLog.filter(function(m){return m.id!==id;});
        _fdSave(); renderFoodDelivery();
    };

    window.fdAiAnalyze = async function() {
        var log = store.foodDelivery.healthLog||[];
        var today = new Date().toDateString();
        var meals = log.filter(function(m){return new Date(m.time).toDateString()===today;});
        if(!meals.length) return toast('请先添加今日餐食记录');
        var el = document.getElementById('fd-ai-analysis-result');
        if(el) el.innerHTML = _loading();
        var mealStr = meals.map(function(m){return m.name+'('+(m.calories||'未知')+'卡)';}).join(', ');
        var prompt = '你是营养健康顾问。用户今天饮食：'+mealStr+'\n分析：1.总热量估算 2.营养均衡度(1-10) 3.好处 4.潜在风险 5.下一餐建议 6.改善方法\n中文，200字以内，语气亲切。';
        var resp = await callAPI([{role:'user',content:prompt}],{temperature:0.7,max_tokens:500});
        var result = resp || '暂时无法分析';
        if(el) el.innerHTML = '<div class="fd-ai-advice"><div class="fd-ai-advice-title"><i class="fas fa-robot"></i> AI健康顾问</div><div class="fd-ai-advice-content">' + result.replace(/\n/g,'<br>') + '</div></div>';
        store.foodDelivery._lastAnalysis = {time:Date.now(),meals:meals.map(function(m){return m.name;}).join(', '),result:result};
        _fdSave();
    };

    window.fdAiCalcCalories = async function() {
        var log = store.foodDelivery.healthLog||[];
        var today = new Date().toDateString();
        var meals = log.filter(function(m){return new Date(m.time).toDateString()===today && !m.calories;});
        if(!meals.length) return toast('没有需要计算热量的餐食');
        toast('🔥 正在计算热量...');
        var prompt = '估算以下食物热量(卡路里)，返回JSON:[{"name":"食物名","calories":数字}]\n' + meals.map(function(m){return m.name;}).join(', ') + '\n只返回JSON。';
        var resp = await callAPI([{role:'user',content:prompt}],{temperature:0.5,max_tokens:300});
        var arr = parseJSON(resp);
        if(arr) { arr.forEach(function(r){ var m=meals.find(function(x){return x.name===r.name;}); if(m) m.calories=r.calories; }); _fdSave(); toast('✅ 热量计算完成'); renderFoodDelivery(); }
        else toast('热量计算失败');
    };

    // ==================== 个人主页 ====================
    function renderProfilePage() {
        var orders = store.foodDelivery.orders||[];
        var totalSpent = orders.reduce(function(s,o){return s+(parseFloat(o.price)||0);},0);
        var html = '<div class="fd-profile-container"><div class="fd-profile-header">';
        html += '<div class="fd-profile-avatar">😋</div><div class="fd-profile-name">' + (store.userName||'美食家') + '</div>';
        html += '<div style="font-size:13px;opacity:0.8;margin-top:4px;">共下单 ' + orders.length + ' 次 · 总消费 ¥' + totalSpent.toFixed(2) + '</div></div>';

        // [骑手系统] 顶部醒目入口
        var riderP = (store.foodDelivery && store.foodDelivery.riderProfile) || {};
        var riderEntryHint = '';
        var riderEntryClass = '';
        if (riderP.isRider) {
            riderEntryHint = '今日 ' + (riderP.todayOrders||0) + ' 单 · ¥' + (riderP.todayIncome||0).toFixed(1);
            riderEntryClass = 'fd-rider-entry';
        } else {
            riderEntryHint = '注册接单';
            riderEntryClass = 'fd-rider-entry';
        }
        html += '<div class="fd-profile-section"><div class="fd-profile-section-title">🛵 骑手系统</div>';
        html += '<div class="fd-profile-cell '+riderEntryClass+'" onclick="fdOpenRider()"><div class="fd-profile-cell-left"><i class="fas fa-motorcycle" style="color:#ee0979;"></i><span>'+(riderP.isRider?'骑手工作台':'成为骑手')+'</span></div><span class="fd-rider-entry-badge">'+riderEntryHint+'</span><i class="fas fa-chevron-right" style="color:#ccc;"></i></div></div>';

        // 外卖互送记录
        var giftOrders = store.foodDelivery.giftOrders || [];
        if (giftOrders.length > 0) {
            html += '<div class="fd-profile-section"><div class="fd-profile-section-title" style="display:flex;align-items:center;justify-content:space-between;">🎁 外卖互送记录<span style="font-size:11px;color:#ff3b30;cursor:pointer;font-weight:400;" onclick="event.stopPropagation();fdClearAllGiftOrders()"><i class="fas fa-trash-alt" style="margin-right:3px;"></i>清空</span></div>';
            var recentGifts = giftOrders.slice(-5).reverse();
            recentGifts.forEach(function(g) {
                var d = new Date(g.time);
                var dirIcon = g.direction === 'sent' ? '📤' : '📥';
                var dirText = g.direction === 'sent' ? '送给 ' + g.contactName : g.contactName + ' 送来';
                html += '<div class="fd-profile-cell" style="position:relative;"><div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;"><div class="fd-profile-cell-left"><span style="font-size:24px;">' + g.emoji + '</span><div><div style="font-size:14px;font-weight:600;">' + g.name + '</div><div style="font-size:11px;color:#999;">' + dirIcon + ' ' + dirText + ' · ' + (d.getMonth()+1) + '/' + d.getDate() + '</div></div></div><div style="text-align:right;"><div style="font-size:14px;font-weight:700;color:#ff4500;">¥' + g.price + '</div><div style="font-size:11px;color:#999;">' + g.shop + '</div></div></div><div onclick="event.stopPropagation();fdDeleteGiftOrder(\'' + g.id + '\')" style="padding:8px 10px;color:#ff3b30;font-size:16px;cursor:pointer;flex-shrink:0;" title="删除"><i class="fas fa-trash-alt"></i></div></div>';
            });
            html += '</div>';
        }

        html += '<div class="fd-profile-section"><div class="fd-profile-section-title" style="display:flex;align-items:center;justify-content:space-between;">📋 最近订单' + (orders.length > 0 ? '<span style="font-size:11px;color:#ff3b30;cursor:pointer;font-weight:400;" onclick="event.stopPropagation();fdClearAllOrders()"><i class="fas fa-trash-alt" style="margin-right:3px;"></i>清空全部</span>' : '') + '</div>';
        var recent = orders.slice(-5).reverse();
        if(!recent.length) html += '<div style="text-align:center;color:#999;padding:20px;">暂无订单</div>';
        else recent.forEach(function(o){ var d=new Date(o.time);
            var pl = o.payMethod==='self'?'自付':(o.payMethod&&o.payMethod.indexOf('proxy_')===0)?'代付':'亲属卡';
            var deliverInfo = o.isGift ? ' · 🎁送给' + o.deliverToName : '';
            html += '<div class="fd-profile-cell" style="cursor:pointer;position:relative;"><div onclick="fdShowReceipt(\'' + o.id + '\')" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;"><div class="fd-profile-cell-left"><span style="font-size:24px;">'+o.emoji+'</span><div><div style="font-size:14px;font-weight:600;">'+o.name+'</div><div style="font-size:11px;color:#999;">'+o.shop+' · '+(d.getMonth()+1)+'/'+d.getDate() + deliverInfo + '</div></div></div><div style="text-align:right;"><div style="font-size:14px;font-weight:700;color:#ff4500;">¥'+o.price+'</div><div style="font-size:11px;color:#999;">'+pl+' · <span style="color:#ff4500;">🧾小票</span></div></div></div><div onclick="event.stopPropagation();fdDeleteOrder(\'' + o.id + '\')" style="padding:8px 10px;color:#ff3b30;font-size:16px;cursor:pointer;flex-shrink:0;" title="删除"><i class="fas fa-trash-alt"></i></div></div>';
        });
        html += '</div>';
        var p = store.foodDelivery.preferences||{};
        html += '<div class="fd-profile-section"><div class="fd-profile-section-title">⚙️ 饮食偏好</div>';
        html += '<div class="fd-profile-cell" onclick="fdEditPreferences()"><div class="fd-profile-cell-left"><i class="fas fa-pepper-hot" style="color:#ff4500;"></i><span>辣度：'+(p.spicy||'中辣')+'</span></div><i class="fas fa-chevron-right" style="color:#ccc;"></i></div>';
        html += '<div class="fd-profile-cell" onclick="fdEditPreferences()"><div class="fd-profile-cell-left"><i class="fas fa-leaf" style="color:#4caf50;"></i><span>限制：'+(p.diet||'无限制')+'</span></div><i class="fas fa-chevron-right" style="color:#ccc;"></i></div>';
        html += '<div class="fd-profile-cell" onclick="fdEditPreferences()"><div class="fd-profile-cell-left"><i class="fas fa-wallet" style="color:#ff9800;"></i><span>预算：'+(p.budget||'15-30')+'元</span></div><i class="fas fa-chevron-right" style="color:#ccc;"></i></div>';
        html += '</div>';
        var cfCount = (store.foodDelivery.customFoods||[]).length;
        html += '<div class="fd-profile-section"><div class="fd-profile-section-title">🍳 自定义菜品</div>';
        html += '<div class="fd-profile-cell" onclick="fdOpenCustomFoods()"><div class="fd-profile-cell-left"><i class="fas fa-utensils" style="color:#333;"></i><span>'+(cfCount>0?cfCount+' 个自定义菜品':'点击添加自定义菜品')+'</span></div><i class="fas fa-chevron-right" style="color:#ccc;"></i></div></div>';
        html += '<div class="fd-profile-section"><div class="fd-profile-section-title">✏️ 自定义提示词</div>';
        var cpVal = (store.foodDelivery.customPrompt||'').trim();
        html += '<div class="fd-profile-cell" onclick="fdEditCustomPrompt()"><div class="fd-profile-cell-left"><i class="fas fa-magic" style="color:#9c27b0;"></i><span>'+(cpVal ? '已设置：'+cpVal.substring(0,20)+(cpVal.length>20?'...':'') : '点击设置（影响AI生成方向）')+'</span></div><i class="fas fa-chevron-right" style="color:#ccc;"></i></div></div>';
        html += '<div class="fd-profile-section"><div class="fd-profile-section-title">📖 关联世界书</div>';
        // [FIX-世界书键名] 使用store.worldbooks(小写b)匹配世界书模块，并显示世界书名称
        var _wbId = store.foodDelivery.worldbookId;
        var _wbName = '';
        if (_wbId) {
            var _wbList = store.worldbooks || store.worldBooks || [];
            var _wbObj = _wbList.find(function(w){ return String(w.id) === String(_wbId); });
            _wbName = _wbObj ? ('已关联: ' + (_wbObj.name || '未命名')) : '已关联（世界书可能已删除）';
        }
        html += '<div class="fd-profile-cell" onclick="fdLinkWorldbook()"><div class="fd-profile-cell-left"><i class="fas fa-book"></i><span>'+(_wbName || '点击关联')+'</span></div><i class="fas fa-chevron-right" style="color:#ccc;"></i></div></div></div>';
        return html;
    }

    // ==================== 设置/板块管理 ====================
    window.fdOpenSettings = function() {
        var secs = store.foodDelivery.sections||getDefaultSections();
        var h = '<div class="fd-settings-overlay" onclick="this.remove()"><div class="fd-settings-sheet" onclick="event.stopPropagation()">';
        h += '<div class="fd-settings-header"><h3>板块管理</h3><div class="fd-pay-close" onclick="this.closest(\'.fd-settings-overlay\').remove()"><i class="fas fa-times"></i></div></div>';
        h += '<div style="margin-bottom:12px;"><button style="width:100%;padding:10px;background:#ff4500;color:#fff;border:none;border-radius:10px;font-size:14px;cursor:pointer;" onclick="fdAddSection()">+ 新增板块</button></div>';
        secs.forEach(function(s,i){
            h += '<div class="fd-section-card"><div class="fd-section-card-info"><div class="fd-section-card-emoji">'+s.emoji+'</div><div class="fd-section-card-text"><h4>'+s.name+'</h4><p>偏好：'+(s.pref||'未设定')+'</p></div></div>';
            h += '<div class="fd-section-card-actions"><button class="fd-section-card-btn edit" onclick="fdEditSection('+i+')"><i class="fas fa-pen"></i></button><button class="fd-section-card-btn delete" onclick="fdDeleteSection('+i+')"><i class="fas fa-trash"></i></button></div></div>';
        });
        h += '</div></div>';
        document.body.insertAdjacentHTML('beforeend', h);
    };

    window.fdAddSection = function() { var ov=document.querySelector('.fd-settings-overlay'); if(ov) ov.remove(); _fdShowSectionModal(-1,'','',''); };
    window.fdEditSection = function(i) { var s=store.foodDelivery.sections[i]; if(!s) return; var ov=document.querySelector('.fd-settings-overlay'); if(ov) ov.remove(); _fdShowSectionModal(i,s.name,s.emoji,s.pref||''); };

    function _fdShowSectionModal(idx, name, emoji, pref) {
        var t = idx===-1?'新增板块':'编辑板块';
        var h = '<div class="fd-add-meal-overlay" onclick="this.remove()"><div class="fd-add-meal-modal" onclick="event.stopPropagation()"><h3>'+t+'</h3>';
        h += '<div class="fd-form-group"><label>板块名称</label><input type="text" id="fd-sec-name" value="'+name+'" placeholder="例：韩式料理"></div>';
        h += '<div class="fd-form-group"><label>Emoji</label><input type="text" id="fd-sec-emoji" value="'+emoji+'" placeholder="🍜" maxlength="4"></div>';
        h += '<div class="fd-form-group"><label>餐食偏好</label><input type="text" id="fd-sec-pref" value="'+pref+'" placeholder="例：石锅拌饭"></div>';
        h += '<div class="fd-form-actions"><button class="fd-btn-cancel" onclick="this.closest(\'.fd-add-meal-overlay\').remove()">取消</button>';
        h += '<button class="fd-btn-primary" onclick="fdSaveSection('+idx+')">保存</button></div></div></div>';
        document.body.insertAdjacentHTML('beforeend', h);
    }

    window.fdSaveSection = function(idx) {
        var n=((document.getElementById('fd-sec-name')||{}).value||'').trim(); if(!n) return toast('请输入板块名称');
        var e=((document.getElementById('fd-sec-emoji')||{}).value||'').trim()||'🍽️';
        var p=((document.getElementById('fd-sec-pref')||{}).value||'').trim();
        if(idx===-1) store.foodDelivery.sections.push({id:'s_'+Date.now(),name:n,emoji:e,pref:p});
        else { store.foodDelivery.sections[idx].name=n; store.foodDelivery.sections[idx].emoji=e; store.foodDelivery.sections[idx].pref=p; }
        var ov=document.querySelector('.fd-add-meal-overlay'); if(ov) ov.remove();
        _fdSave(); toast('✅ 板块已保存'); renderFoodDelivery();
    };

    window.fdDeleteSection = function(i) {
        if(confirm('确定删除？')) { store.foodDelivery.sections.splice(i,1); _fdSave(); var ov=document.querySelector('.fd-settings-overlay'); if(ov) ov.remove(); fdOpenSettings(); }
    };

    // ==================== 订单删除 ====================
    window.fdDeleteOrder = function(orderId) {
        if(confirm('确定删除这条订单记录吗？')) {
            store.foodDelivery.orders = (store.foodDelivery.orders||[]).filter(function(o){ return o.id !== orderId; });
            _fdSave(); toast('订单已删除'); renderFoodDelivery();
        }
    };
    window.fdClearAllOrders = function() {
        if(confirm('确定清空全部订单记录吗？此操作不可撤销！')) {
            store.foodDelivery.orders = [];
            _fdSave(); toast('已清空所有订单'); renderFoodDelivery();
        }
    };
    window.fdDeleteGiftOrder = function(orderId) {
        if(confirm('确定删除这条互送记录吗？')) {
            store.foodDelivery.giftOrders = (store.foodDelivery.giftOrders||[]).filter(function(g){ return g.id !== orderId; });
            _fdSave(); toast('记录已删除'); renderFoodDelivery();
        }
    };
    window.fdClearAllGiftOrders = function() {
        if(confirm('确定清空全部互送记录吗？')) {
            store.foodDelivery.giftOrders = [];
            _fdSave(); toast('已清空互送记录'); renderFoodDelivery();
        }
    };

    // ==================== 偏好编辑 ====================
    window.fdEditPreferences = function() {
        var p = store.foodDelivery.preferences||{};
        var h = '<div class="fd-add-meal-overlay" onclick="this.remove()"><div class="fd-add-meal-modal" onclick="event.stopPropagation()"><h3>饮食偏好</h3>';
        h += '<div class="fd-form-group"><label>辣度</label><select id="fd-pref-spicy">';
        ['不辣','微辣','中辣','特辣'].forEach(function(o){h+='<option'+(p.spicy===o?' selected':'')+'>'+o+'</option>';});
        h += '</select></div>';
        h += '<div class="fd-form-group"><label>饮食限制</label><select id="fd-pref-diet">';
        ['无限制','素食','清真','低糖','低脂'].forEach(function(o){h+='<option'+(p.diet===o?' selected':'')+'>'+o+'</option>';});
        h += '</select></div>';
        h += '<div class="fd-form-group"><label>过敏食物</label><input type="text" id="fd-pref-allergy" value="'+(p.allergies||'')+'" placeholder="例：花生、海鲜"></div>';
        h += '<div class="fd-form-group"><label>预算（元）</label><input type="text" id="fd-pref-budget" value="'+(p.budget||'15-30')+'" placeholder="15-30"></div>';
        h += '<div class="fd-form-group"><label>喜欢的食物</label><input type="text" id="fd-pref-fav" value="'+(p.favorite||'')+'" placeholder="炸鸡、奶茶"></div>';
        h += '<div class="fd-form-actions"><button class="fd-btn-cancel" onclick="this.closest(\'.fd-add-meal-overlay\').remove()">取消</button>';
        h += '<button class="fd-btn-primary" onclick="fdSavePreferences()">保存</button></div></div></div>';
        document.body.insertAdjacentHTML('beforeend', h);
    };

    window.fdSavePreferences = function() {
        store.foodDelivery.preferences = {
            spicy:(document.getElementById('fd-pref-spicy')||{}).value||'中辣',
            diet:(document.getElementById('fd-pref-diet')||{}).value||'无限制',
            allergies:((document.getElementById('fd-pref-allergy')||{}).value||'').trim(),
            budget:((document.getElementById('fd-pref-budget')||{}).value||'15-30').trim(),
            favorite:((document.getElementById('fd-pref-fav')||{}).value||'').trim()
        };
        var ov=document.querySelector('.fd-add-meal-overlay'); if(ov) ov.remove();
        _fdSave(); toast('✅ 偏好已保存'); renderFoodDelivery();
    };

    // ==================== 自定义提示词编辑 ====================
    window.fdEditCustomPrompt = function() {
        var cur = store.foodDelivery.customPrompt || '';
        var h = '<div class="fd-add-meal-overlay" onclick="this.remove()"><div class="fd-add-meal-modal" onclick="event.stopPropagation()"><h3>✏️ 自定义提示词</h3>';
        h += '<div style="font-size:12px;color:#999;margin-bottom:10px;line-height:1.5;">设置后，刷新外卖页面时AI会按照你的提示词方向生成内容。<br>例如：只推荐日式料理 / 不要出现奶茶 / 多推荐素食</div>';
        h += '<div class="fd-form-group"><label>提示词内容</label><textarea id="fd-custom-prompt-input" rows="4" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:10px;font-size:14px;resize:vertical;" placeholder="例：只推荐韩式料理和日式料理，价格控制在20元以内">' + (cur||'').replace(/</g,'&lt;') + '</textarea></div>';
        h += '<div class="fd-form-actions"><button class="fd-btn-cancel" onclick="this.closest(\'.fd-add-meal-overlay\').remove()">取消</button>';
        h += '<button class="fd-btn-cancel" style="color:#fa5151;" onclick="fdClearCustomPrompt()">清除</button>';
        h += '<button class="fd-btn-primary" onclick="fdSaveCustomPrompt()">保存</button></div></div></div>';
        document.body.insertAdjacentHTML('beforeend', h);
    };

    window.fdSaveCustomPrompt = function() {
        var val = ((document.getElementById('fd-custom-prompt-input')||{}).value||'').trim();
        store.foodDelivery.customPrompt = val;
        var ov = document.querySelector('.fd-add-meal-overlay'); if(ov) ov.remove();
        // 清除首页缓存，让下次刷新使用新提示词
        _fdHomeLoaded = false; _fdCachedCoupons = null; _fdCachedPinFoods = null; _fdCachedShops = null;
        _fdSave(); toast('✅ 自定义提示词已保存'); renderFoodDelivery();
    };

    window.fdClearCustomPrompt = function() {
        store.foodDelivery.customPrompt = '';
        var ov = document.querySelector('.fd-add-meal-overlay'); if(ov) ov.remove();
        _fdHomeLoaded = false; _fdCachedCoupons = null; _fdCachedPinFoods = null; _fdCachedShops = null;
        _fdSave(); toast('已清除自定义提示词'); renderFoodDelivery();
    };

    // ==================== 世界书关联 ====================
    window.fdLinkWorldbook = function() {
        // [FIX-世界书键名] 世界书模块使用store.worldbooks(小写b)，此处须保持一致
        var wbs = store.worldbooks||store.worldBooks||[]; if(!wbs.length) { if(typeof openApp==='function') { toast('还没有世界书，去创建一个吧'); setTimeout(function(){ openApp('worldbook'); }, 500); } else { toast('还没有世界书'); } return; }
        var h = '<div class="fd-settings-overlay" onclick="this.remove()"><div class="fd-settings-sheet" onclick="event.stopPropagation()">';
        h += '<div class="fd-settings-header"><h3>关联世界书</h3><div class="fd-pay-close" onclick="this.closest(\'.fd-settings-overlay\').remove()"><i class="fas fa-times"></i></div></div>';
        wbs.forEach(function(wb){ var linked=store.foodDelivery.worldbookId===wb.id;
            h += '<div class="fd-section-card" onclick="fdSetWorldbook(\''+wb.id+'\')" style="cursor:pointer;'+(linked?'border:2px solid #ff4500;':'')+'"><div class="fd-section-card-info"><div class="fd-section-card-emoji">📖</div><div class="fd-section-card-text"><h4>'+(wb.name||'未命名')+'</h4><p>'+(linked?'✅ 已关联':'点击关联')+'</p></div></div></div>';
        });
        h += '</div></div>';
        document.body.insertAdjacentHTML('beforeend', h);
    };

    window.fdSetWorldbook = function(id) { store.foodDelivery.worldbookId=id; var ov=document.querySelector('.fd-settings-overlay'); if(ov) ov.remove(); _fdSave(); toast('✅ 已关联'); renderFoodDelivery(); };

    // ==================== 从聊天界面点外卖 ====================
    window.fdOrderFromChat = function() {
        // 从聊天界面的加号菜单调用，给当前聊天的联系人点外卖
        if (typeof activeChatId !== 'undefined' && activeChatId) {
            var c = (store.contacts || []).find(function(x){ return x.id === activeChatId; });
            if (c && !c.isGroup) {
                window.renderFoodDeliveryForContact(activeChatId);
                return;
            }
        }
        // 如果不在聊天界面或者是群聊，直接打开外卖首页
        if (typeof openApp === 'function') {
            openApp('fooddelivery');
        }
        if (typeof renderFoodDeliveryHome === 'function') {
            setTimeout(function(){ renderFoodDeliveryHome(); }, 100);
        }
    };

    // ==================== 外卖订单小票 ====================
    window.fdShowReceipt = function(orderId) {
        var o = (store.foodDelivery && store.foodDelivery.orders || []).find(function(x){ return x.id === orderId; });
        if (!o) {
            // 也从giftOrders中查找
            o = (store.foodDelivery && store.foodDelivery.giftOrders || []).find(function(x){ return x.id === orderId; });
        }
        if (!o) return toast('订单不存在');

        var modal = document.getElementById('modal-fd-receipt');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-fd-receipt';
            modal.className = 'modal';
            modal.innerHTML = '<div class="modal-overlay" onclick="this.parentElement.style.display=\'none\'"></div>'
                + '<div class="modal-box shop-receipt-box">'
                + '<div class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #f0f0f0;">'
                + '<span style="font-size:16px;font-weight:600;">外卖订单小票</span>'
                + '<span class="modal-close" onclick="document.getElementById(\'modal-fd-receipt\').style.display=\'none\'" style="font-size:22px;color:#999;cursor:pointer;padding:0 4px;line-height:1;">×</span>'
                + '</div><div id="fd-receipt-content"></div></div>';
            document.body.appendChild(modal);
        }

        var content = document.getElementById('fd-receipt-content');
        var d = new Date(o.time);
        var orderTime = d.getFullYear()+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getDate()).padStart(2,'0')+' '+d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0')+':'+d.getSeconds().toString().padStart(2,'0');

        var payMethodStr = '余额支付';
        if (o.payMethod && o.payMethod.indexOf('proxy_') === 0) {
            var proxyContact = (store.contacts||[]).find(function(x){ return x.id === o.payMethod.replace('proxy_',''); });
            payMethodStr = '好友代付' + (proxyContact ? ' (' + proxyContact.name + ')' : '');
        } else if (o.payMethod && o.payMethod.indexOf('family_') === 0) {
            var familyContact = (store.contacts||[]).find(function(x){ return x.id === o.payMethod.replace('family_',''); });
            payMethodStr = '亲属卡支付' + (familyContact ? ' (' + familyContact.name + ')' : '');
        }

        var deliverStr = o.isGift ? '🎁 送给 ' + (o.deliverToName || o.contactName || '') : '📍 送给自己';

        content.innerHTML = '<div class="shop-receipt">'
            + '<div class="receipt-header"><div class="receipt-logo"><i class="fas fa-utensils"></i></div><div class="receipt-shop-name">' + (o.shop || '外卖商家') + '</div><div class="receipt-divider-dashed"></div></div>'
            + '<div class="receipt-section">'
            + '<div class="receipt-row"><span class="receipt-label">订单编号</span><span class="receipt-value">' + (o.id||'').replace('order_','').replace('recv_','') + '</span></div>'
            + '<div class="receipt-row"><span class="receipt-label">下单时间</span><span class="receipt-value">' + orderTime + '</span></div>'
            + '<div class="receipt-row"><span class="receipt-label">支付方式</span><span class="receipt-value">' + payMethodStr + '</span></div>'
            + '<div class="receipt-row"><span class="receipt-label">配送信息</span><span class="receipt-value">' + deliverStr + '</span></div>'
            + '</div>'
            + '<div class="receipt-divider-dashed"></div>'
            + '<div class="receipt-section"><div class="receipt-section-title">菜品明细</div>'
            + '<div class="receipt-item"><span class="receipt-item-name">' + (o.emoji||'🍽️') + ' ' + (o.name||'菜品') + '</span><span class="receipt-item-qty">x1</span><span class="receipt-item-price">¥' + Number(o.price||0).toFixed(2) + '</span></div>'
            + '</div>'
            + '<div class="receipt-divider-dashed"></div>'
            + '<div class="receipt-total"><span>合计</span><span class="receipt-total-price">¥' + Number(o.price||0).toFixed(2) + '</span></div>'
            + '<div style="padding:12px 16px;">'
            + '<button onclick="fdShareReceiptToContact(\'' + o.id + '\')" style="width:100%;padding:10px;background:#ff4500;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;"><i class="fas fa-share-alt" style="margin-right:6px;"></i>分享小票给好友</button>'
            + '</div>'
            + '<div class="receipt-footer"><div class="receipt-barcode">|||||| |||| ||||| |||| ||||||</div><div class="receipt-thanks">感谢您的订购 🛵</div></div>'
            + '</div>';
        modal.style.display = 'flex';
    };

    // ==================== 分享外卖小票给联系人 ====================
    window.fdShareReceiptToContact = function(orderId) {
        var o = (store.foodDelivery && store.foodDelivery.orders || []).find(function(x){ return x.id === orderId; });
        if (!o) {
            o = (store.foodDelivery && store.foodDelivery.giftOrders || []).find(function(x){ return x.id === orderId; });
        }
        if (!o) return toast('订单不存在');

        // 关闭小票弹窗
        var modal = document.getElementById('modal-fd-receipt');
        if (modal) modal.style.display = 'none';

        var contacts = (store.contacts || []).filter(function(c){ return !c.isGroup; });
        if (!contacts.length) return toast('暂无联系人');

        var h = '<div class="fd-pay-overlay" onclick="this.remove()">';
        h += '<div class="fd-pay-sheet" onclick="event.stopPropagation()">';
        h += '<div class="fd-pay-header"><h3>🧾 分享小票给谁？</h3>';
        h += '<div class="fd-pay-close" onclick="this.closest(\'.fd-pay-overlay\').remove()"><i class="fas fa-times"></i></div></div>';
        contacts.forEach(function(c) {
            h += '<div class="fd-gift-contact-item" onclick="fdDoShareReceipt(\'' + orderId + '\',\'' + c.id + '\')">';
            h += '<div class="fd-gift-contact-avatar">' + (c.avatar ? '<img src="' + c.avatar + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">' : '👤') + '</div>';
            h += '<div class="fd-gift-contact-info"><div class="fd-gift-contact-name">' + c.name + '</div><div class="fd-gift-contact-desc">发送外卖小票</div></div>';
            h += '</div>';
        });
        h += '</div></div>';
        document.body.insertAdjacentHTML('beforeend', h);
    };

    window.fdDoShareReceipt = function(orderId, contactId) {
        var o = (store.foodDelivery && store.foodDelivery.orders || []).find(function(x){ return x.id === orderId; });
        if (!o) {
            o = (store.foodDelivery && store.foodDelivery.giftOrders || []).find(function(x){ return x.id === orderId; });
        }
        if (!o) return toast('订单不存在');

        var c = (store.contacts || []).find(function(x){ return x.id === contactId; });
        if (!c) return toast('联系人不存在');

        if (!store.chats) store.chats = {};
        if (!store.chats[contactId]) store.chats[contactId] = [];
        store.chats[contactId].push({
            sender: 'me',
            type: 'food-receipt-share',
            content: '给你看看我的外卖小票~ 🧾\n' + o.emoji + ' ' + o.name + ' - ' + o.shop + ' ¥' + o.price,
            time: Date.now(),
            foodOrder: o
        });

        var ov = document.querySelector('.fd-pay-overlay');
        if (ov) ov.remove();

        _fdSave();
        toast('🧾 已分享小票给 ' + c.name);

        // 如果当前在聊天界面，刷新
        if (typeof renderHistory === 'function' && typeof activeChatId !== 'undefined' && activeChatId === contactId) {
            try { renderHistory(); } catch(e) {}
        }
    };

    // ==================== Tab/刷新 ====================
    window.fdSwitchTab = function(tab) { fdCurrentTab=tab; fdCurrentShop=null; fdSearchResults=null; renderFoodDelivery(); };
    window.fdRefreshHome = function() {
        fdSearchResults=null; fdCurrentShop=null;
        // [FIX-外卖刷新] 清除首页缓存，强制重新从API生成
        _fdHomeLoaded = false;
        _fdCachedCoupons = null;
        _fdCachedPinFoods = null;
        _fdCachedShops = null;
        // 清除历史记录缓存，确保刷新后内容完全不同
        if (typeof _fdPinHistory !== 'undefined') _fdPinHistory.length = 0;
        if (typeof _fdShopHistory !== 'undefined') _fdShopHistory.length = 0;
        if (typeof _fdSearchHistory !== 'undefined') _fdSearchHistory.length = 0;
        renderFoodDelivery();
        // [FIX-自动调用API] 只有点击刷新按钮才调用API
        loadHomeContentAsync();
        toast('🔄 正在AI生成内容...');
    };

    // [FIX-自动调用API] 静态首页内容，不调用API
    function renderStaticHomePlaceholder() {
        var sections = store.foodDelivery.sections || getDefaultSections();
        
        // 渲染优惠券区域 - 静态默认优惠券
        var couponArea = document.getElementById('fd-coupons-area');
        if (couponArea) {
            var defaultCoupons = [
                {amount:15, threshold:30, expiry:'限时'},
                {amount:10, threshold:25, expiry:'新人专享'},
                {amount:5, threshold:15, expiry:'通用券'}
            ];
            var ch = '<div class="fd-coupon-bar">';
            defaultCoupons.forEach(function(c) {
                ch += '<div class="fd-coupon-item"><div class="fd-coupon-amount"><small>¥</small>' + c.amount + '</div>';
                ch += '<div class="fd-coupon-desc">满' + c.threshold + '可用 · ' + c.expiry + '</div></div>';
            });
            ch += '</div>';
            couponArea.innerHTML = ch;
        }
        
        // 渲染拼好饭区域 - 提示用户刷新
        var pinArea = document.getElementById('fd-pin-area');
        if (pinArea) {
            var ph = '<div class="fd-pin-section"><div class="fd-pin-header">';
            ph += '<div class="fd-pin-title">🍱 拼好饭精选 <span class="fd-pin-badge">0起送 0配送</span></div>';
            ph += '<div class="fd-pin-more" onclick="fdOpenCategory(\'s6\',\'拼好饭\')">更多 ›</div></div>';
            ph += '<div style="text-align:center;padding:30px 20px;color:#888;">';
            ph += '<i class="fas fa-sync-alt" style="font-size:24px;color:#ff4500;margin-bottom:10px;display:block;"></i>';
            ph += '点击右上角 <strong style="color:#ff4500;">🔄 刷新</strong> 按钮<br>AI将为你生成今日推荐';
            ph += '</div></div>';
            pinArea.innerHTML = ph;
        }
        
        // 渲染附近商家区域 - 提示用户刷新
        var nearbyArea = document.getElementById('fd-nearby-area');
        if (nearbyArea) {
            var nh = '<div class="fd-nearby-section"><div class="fd-nearby-header">';
            nh += '<div class="fd-nearby-tab active">附近商家</div>';
            nh += '<div class="fd-nearby-tab">特价外卖</div></div>';
            nh += '<div style="text-align:center;padding:40px 20px;color:#888;">';
            nh += '<i class="fas fa-store" style="font-size:28px;color:#ff4500;margin-bottom:12px;display:block;"></i>';
            nh += '点击 <strong style="color:#ff4500;">刷新</strong> 按钮获取附近商家<br><span style="font-size:12px;">AI将根据你的偏好推荐</span>';
            nh += '</div></div>';
            nearbyArea.innerHTML = nh;
        }
    }

    // ==================== 全局记忆系统 ====================
    // [FIX-外卖记忆隔离] 外卖记忆按联系人隔离，不再让所有联系人看到用户给别人点外卖的记录
    window._foodDeliveryBuildMemory = function(contactId) {
        if (!store.foodDelivery) return '';
        var mem = '';
        var act = store.foodDelivery._recentActivity||[];
        // [FIX-外卖记忆隔离] 过滤_recentActivity：只保留与当前联系人相关的活动，或用户自己独立的（不涉及任何联系人的）
        var filteredAct = act.filter(function(a) {
            if (a.type === 'order') {
                // 如果订单涉及某个联系人（代付/亲属卡/送礼），只有该联系人能看到
                if (a.payType === 'proxy' || a.payType === 'family' || a.payType === 'gift_sent' || a.payType === 'gift_received') {
                    return a.contactId === contactId;
                }
                // 如果是送礼订单，只有被送的联系人能看到
                if (a.isGift && a.deliverTo) {
                    return a.deliverTo === contactId;
                }
                // 用户自己独立点的外卖（不涉及任何联系人），所有人都不显示具体记录
                // 这类信息通过下面的健康饮食概况间接体现
                return false;
            }
            // 饮食记录(eat)不涉及隐私，但也不需要暴露给联系人
            return false;
        });
        var last5 = filteredAct.slice(-5);
        if (last5.length) {
            mem += '\n[与你相关的外卖活动: ';
            last5.forEach(function(a) {
                if (a.type==='order') {
                    mem += a.emoji+'点了'+a.name+'('+a.shop+',¥'+a.price;
                    if(a.payType==='proxy') mem+=',你代付';
                    if(a.payType==='family') mem+=',用你的亲属卡';
                    if(a.payType==='gift_sent') mem+=',送给你';
                    if(a.payType==='gift_received') mem+=',你送的';
                    if(a.isGift && a.deliverTo === contactId) mem+=',配送给你';
                    mem+='), ';
                }
            });
            mem += ']';
        }
        // [FIX-外卖记忆隔离] 饮食分析只保留笼统的健康状况提示，不暴露具体订单
        // 移除 _lastAnalysis 的全局注入（里面可能包含具体菜品信息）
        // 与该联系人相关的外卖消费（代付/亲属卡）
        var co = (store.foodDelivery.orders||[]).filter(function(o){return o.payMethod==='proxy_'+contactId||o.payMethod==='family_'+contactId;});
        if (co.length) { var r=co.slice(-3); mem+='\n[与你相关的外卖消费: '+r.map(function(o){return o.name+'¥'+o.price+'('+(o.payMethod.indexOf('proxy')===0?'你代付':'你的亲属卡')+')';}).join(', ')+']'; }
        // 与该联系人的互送外卖记录
        var giftOrders = (store.foodDelivery.giftOrders||[]).filter(function(g){ return g.contactId === contactId; });
        if (giftOrders.length) {
            var recentGifts = giftOrders.slice(-5);
            mem += '\n[与你互送外卖: ';
            recentGifts.forEach(function(g) {
                if (g.direction === 'sent') mem += '我送了'+g.emoji+g.name+'给你(¥'+g.price+'), ';
                else mem += '你送了'+g.emoji+g.name+'给我(¥'+g.price+'), ';
            });
            mem += ']';
        }
        // 收到的外卖（来自该联系人）
        var recvFromContact = (store.foodDelivery.receivedOrders||[]).filter(function(o){ return o.fromContactId === contactId; });
        if (recvFromContact.length) {
            var lastRecv = recvFromContact.slice(-3);
            mem += '\n[你送给我的外卖: ' + lastRecv.map(function(o){ return o.emoji+o.name+'('+o.shop+',¥'+o.price+')'; }).join(', ') + ']';
        }
        // 送给该联系人的外卖
        var sentToContact = (store.foodDelivery.orders||[]).filter(function(o){ return o.isGift && o.deliverTo === contactId; });
        if (sentToContact.length) {
            var lastSent = sentToContact.slice(-3);
            mem += '\n[我送给你的外卖: ' + lastSent.map(function(o){ return o.emoji+o.name+'('+o.shop+',¥'+o.price+')'; }).join(', ') + ']';
        }
        // [FIX-外卖记忆隔离] 健康饮食概况：只显示笼统的健康状态，不暴露具体菜品
        var hl = store.foodDelivery.healthLog||[];
        var td = new Date().toDateString();
        var tm = hl.filter(function(m){return new Date(m.time).toDateString()===td;});
        if (tm.length) {
            var tc = tm.reduce(function(s,m){return s+(m.calories||0);},0);
            var junk = tm.some(function(m){return /炸鸡|薯条|可乐|汉堡|烧烤|啤酒|泡面/.test(m.name);});
            var healthy = tm.some(function(m){return /沙拉|水果|蔬菜|粥|牛奶|酸奶|全麦/.test(m.name);});
            if(junk&&!healthy) mem+='\n[⚠️用户今天饮食不太健康，你应该关心TA]';
            else if(healthy) mem+='\n[✅用户今天饮食健康]';
            if(tc>2500) mem+='\n[⚠️热量偏高]';
            else if(tc>0&&tc<800&&tm.length>=2) mem+='\n[⚠️热量偏低，可能在节食]';
            // [FIX-外卖记忆隔离] 投喂记录只显示来自当前联系人的
            var giftMeals = tm.filter(function(m){ return m.source === 'gift_from_' + contactId; });
            if (giftMeals.length) {
                mem += '\n[今天你送的外卖投喂: ' + giftMeals.map(function(m){ return m.emoji + m.name; }).join(', ') + ']';
            }
        }
        return mem;
    };

    // ==================== 自定义菜品管理 ====================
    window.fdOpenCustomFoods = function() {
        initFoodDeliveryData();
        var items = store.foodDelivery.customFoods || [];
        var listHtml = '';
        if (items.length === 0) {
            listHtml = '<div style="text-align:center;padding:40px 0;color:#bbb;font-size:14px;">还没有自定义菜品<br>添加后会出现在所有商家菜单中</div>';
        } else {
            listHtml = items.map(function(f) {
                return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f0f0f0;">'
                    + '<div style="font-size:28px;width:40px;text-align:center;flex-shrink:0;">' + (f.emoji||'🍽️') + '</div>'
                    + '<div style="flex:1;min-width:0;">'
                    + '<div style="font-size:14px;color:#111;font-weight:500;">' + (f.name||'') + '</div>'
                    + '<div style="font-size:12px;color:#999;">¥' + Number(f.price||0).toFixed(0) + (f.desc ? ' · ' + f.desc : '') + '</div>'
                    + '</div>'
                    + '<div style="display:flex;gap:6px;flex-shrink:0;">'
                    + '<button onclick="fdEditCustomFood(\'' + f.id + '\')" style="border:1px solid #ddd;background:#fff;color:#333;padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer;">编辑</button>'
                    + '<button onclick="fdDeleteCustomFood(\'' + f.id + '\')" style="border:1px solid #ddd;background:#fff;color:#999;padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer;">删除</button>'
                    + '</div></div>';
            }).join('');
        }

        var h = '<div class="fd-add-meal-overlay" onclick="this.remove()"><div class="fd-add-meal-modal" onclick="event.stopPropagation()" style="max-height:80vh;display:flex;flex-direction:column;">';
        h += '<h3 style="margin:0 0 12px;">自定义菜品</h3>';
        h += '<div style="flex:1;overflow-y:auto;">' + listHtml + '</div>';
        h += '<button onclick="fdAddCustomFood()" style="width:100%;padding:10px;margin-top:12px;border:1px dashed #ccc;background:#fff;color:#333;border-radius:8px;font-size:14px;cursor:pointer;">+ 添加菜品</button>';
        h += '</div></div>';
        var el = document.createElement('div');
        el.innerHTML = h;
        document.body.appendChild(el.firstChild);
    };

    window.fdAddCustomFood = function() { _fdCustomFoodForm(null); };

    window.fdEditCustomFood = function(id) {
        var item = (store.foodDelivery.customFoods||[]).find(function(f){ return f.id === id; });
        if (!item) return;
        _fdCustomFoodForm(item);
    };

    function _fdCustomFoodForm(existing) {
        var isEdit = !!existing;
        var emojis = ['🍜','🍛','🍲','🍱','🍣','🍔','🍕','🌮','🥗','🍝','🍰','🧁','🍩','🥤','🍺','🍽️','🥘','🍗','🥟','🍤'];
        var emojiHtml = emojis.map(function(e) {
            var sel = existing && existing.emoji === e;
            return '<span class="fd-emoji-pick' + (sel ? ' active' : '') + '" onclick="this.parentElement.querySelectorAll(\'.fd-emoji-pick\').forEach(function(x){x.classList.remove(\'active\')});this.classList.add(\'active\');document.getElementById(\'fd-cf-emoji\').value=\'' + e + '\';">' + e + '</span>';
        }).join('');

        var h = '<div class="fd-add-meal-overlay" onclick="this.remove()"><div class="fd-add-meal-modal" onclick="event.stopPropagation()">';
        h += '<h3>' + (isEdit ? '编辑菜品' : '添加菜品') + '</h3>';
        h += '<input type="hidden" id="fd-cf-emoji" value="' + (existing ? existing.emoji || '🍽️' : '🍽️') + '">';
        h += (isEdit ? '<input type="hidden" id="fd-cf-edit-id" value="' + existing.id + '">' : '');
        h += '<div style="font-size:12px;color:#999;margin-bottom:6px;">选择图标</div>';
        h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">' + emojiHtml + '</div>';
        h += '<input id="fd-cf-name" value="' + (existing ? (existing.name||'').replace(/"/g,'&quot;') : '') + '" placeholder="菜品名称" style="width:100%;padding:10px 12px;border:none;border-bottom:1px solid #ddd;font-size:14px;outline:none;margin-bottom:10px;box-sizing:border-box;">';
        h += '<input id="fd-cf-price" type="number" value="' + (existing ? existing.price || '' : '') + '" placeholder="价格" style="width:100%;padding:10px 12px;border:none;border-bottom:1px solid #ddd;font-size:14px;outline:none;margin-bottom:10px;box-sizing:border-box;">';
        h += '<input id="fd-cf-desc" value="' + (existing ? (existing.desc||'').replace(/"/g,'&quot;') : '') + '" placeholder="描述（可选）" style="width:100%;padding:10px 12px;border:none;border-bottom:1px solid #ddd;font-size:14px;outline:none;margin-bottom:14px;box-sizing:border-box;">';
        h += '<div style="display:flex;gap:10px;">';
        h += '<button onclick="this.closest(\'.fd-add-meal-overlay\').remove()" style="flex:1;padding:10px;border:1px solid #ddd;background:#fff;color:#333;border-radius:8px;font-size:14px;cursor:pointer;">取消</button>';
        h += '<button onclick="fdSaveCustomFood()" style="flex:1;padding:10px;border:none;background:#111;color:#fff;border-radius:8px;font-size:14px;cursor:pointer;">保存</button>';
        h += '</div></div></div>';
        // 先关闭列表弹窗
        var ov = document.querySelector('.fd-add-meal-overlay');
        if (ov) ov.remove();
        var el = document.createElement('div');
        el.innerHTML = h;
        document.body.appendChild(el.firstChild);
    }

    window.fdSaveCustomFood = function() {
        var name = ((document.getElementById('fd-cf-name')||{}).value||'').trim();
        var price = parseFloat((document.getElementById('fd-cf-price')||{}).value) || 0;
        var emoji = ((document.getElementById('fd-cf-emoji')||{}).value||'🍽️');
        var desc = ((document.getElementById('fd-cf-desc')||{}).value||'').trim();
        var editId = ((document.getElementById('fd-cf-edit-id')||{}).value||'');

        if (!name) { toast('请输入菜品名称'); return; }
        initFoodDeliveryData();

        if (editId) {
            var item = store.foodDelivery.customFoods.find(function(f){ return f.id === editId; });
            if (item) { item.name = name; item.price = price; item.emoji = emoji; item.desc = desc; }
        } else {
            store.foodDelivery.customFoods.push({ id: 'cf_' + Date.now(), name: name, price: price, emoji: emoji, desc: desc });
        }
        _fdSave();
        var ov = document.querySelector('.fd-add-meal-overlay');
        if (ov) ov.remove();
        fdOpenCustomFoods();
        toast(editId ? '已更新' : '已添加');
    };

    window.fdDeleteCustomFood = function(id) {
        if (!confirm('删除这个自定义菜品？')) return;
        initFoodDeliveryData();
        store.foodDelivery.customFoods = store.foodDelivery.customFoods.filter(function(f){ return f.id !== id; });
        _fdSave();
        var ov = document.querySelector('.fd-add-meal-overlay');
        if (ov) ov.remove();
        fdOpenCustomFoods();
        toast('已删除');
    };

})();
