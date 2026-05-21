// ============================================================
// ========== SHOP FRIENDS SECOND-HAND MARKET =================
// Stage 3: 首页"好友二手"Feed + App内咨询/出价/购买
// 所有交互封闭在购物App内，不污染微信聊天
// ============================================================
(function(){
    'use strict';

    var CATEGORY_EMOJI = {
        '衣服':'👕','美妆':'💄','食品':'🍪','鞋包':'👜',
        '数码':'📱','家居':'🏠','其他':'📦'
    };

    var CONDITION_LABEL = {
        'new':'全新','like_new':'几乎全新','used_good':'轻微使用','used_fair':'有使用痕迹'
    };

    var currentSHItem = null; // 当前浏览的二手商品
    var shConvId = null;      // 与某卖家的当前会话ID

    function _save() { if (typeof save === 'function') save(); }
    function _esc(s) { return (typeof escapeHtml === 'function') ? escapeHtml(s||'') : String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function _now() { return Date.now(); }

    function parseJSON(str) {
        if (!str) return null;
        try {
            var c = str.replace(/```(?:json|JSON)?\s*/g, '').replace(/```/g, '').trim();
            var m = c.match(/\{[\s\S]*\}/);
            if (m) return JSON.parse(m[0]);
        } catch(e) {}
        return null;
    }

    async function callShopAPI(messages, options) {
        if (typeof API === 'undefined' || !API.chatCompletion) return null;
        var runCall = function() {
            return API.chatCompletion(messages, {
                temperature: (options && options.temperature) || 0.9,
                max_tokens: (options && options.max_tokens) || 500
            });
        };
        var data;
        try {
            if (API.withScene) data = await API.withScene('shop', runCall);
            else data = await runCall();
        } catch(e) {
            console.warn('[friends-market] API err', e);
            return null;
        }
        if (data && data.choices && data.choices[0]) {
            return (data.choices[0].message && data.choices[0].message.content) || data.choices[0].text || '';
        }
        return null;
    }

    // ==================== 数据初始化 ====================
    function initFriendsMarket() {
        if (!store.friendsSecondHand) store.friendsSecondHand = [];
        if (!store.friendsSHConversations) store.friendsSHConversations = {}; // key=sellerId, value=会话
        if (!store.friendsSHOrders) store.friendsSHOrders = [];
    }

    // ==================== Feed 数据 ====================
    window.getFriendsSHFeed = function() {
        initFriendsMarket();
        // [FIX-已删除联系人] 防御性过滤：只显示当前联系人列表中存在的卖家商品
        var validIds = (store.contacts||[]).map(function(c){ return c.id; });
        return (store.friendsSecondHand||[]).filter(function(item){
            return validIds.indexOf(item.sellerId) >= 0;
        }).slice().sort(function(a,b){ return (b.createdAt||0) - (a.createdAt||0); });
    };

    // ==================== 刷新：生成联系人的二手商品 ====================
    window.refreshFriendsSH = async function() {
        initFriendsMarket();
        var contacts = (store.contacts||[]).filter(function(c){ return !c.isGroup && c.persona; });
        if (contacts.length === 0) {
            if (typeof toast === 'function') toast('请先添加有人设的联系人');
            return;
        }

        if (window._shRefreshing) {
            if (typeof toast === 'function') toast('⏳ 正在刷新...');
            return;
        }
        window._shRefreshing = true;
        _setShRefreshBtn(true);

        try {
            // 避免最近出过货的联系人再次出现
            var recent = (store.friendsSecondHand||[])
                .filter(function(item){ return (_now() - (item.createdAt||0)) < 30*60*1000; })
                .map(function(item){ return item.sellerId; });

            var candidates = contacts.filter(function(c){ return recent.indexOf(c.id) < 0; });
            if (candidates.length === 0) candidates = contacts;

            // 随机挑 3-5 人
            var pickCount = Math.min(candidates.length, 3 + Math.floor(Math.random()*3));
            var shuffled = candidates.slice().sort(function(){ return Math.random() - 0.5; });
            var picked = shuffled.slice(0, pickCount);

            var newItems = [];
            for (var i = 0; i < picked.length; i++) {
                var c = picked[i];
                try {
                    var item = await generateOneSHItem(c);
                    if (item) newItems.push(item);
                } catch(e) {
                    console.warn('[friends-market] gen err', e);
                }
            }

            if (newItems.length > 0) {
                // 添加到列表，控制总数不超过50条
                store.friendsSecondHand = newItems.concat(store.friendsSecondHand||[]).slice(0, 50);
                _save();
                if (typeof toast === 'function') toast('🔄 好友二手 +' + newItems.length);
            } else {
                if (typeof toast === 'function') toast('没有新内容');
            }

            renderFriendsSHFeed();

        } finally {
            window._shRefreshing = false;
            _setShRefreshBtn(false);
        }
    };

    async function generateOneSHItem(contact) {
        var aiCtx = (typeof getAiContext === 'function') ? getAiContext(contact) : ('你是' + contact.name + '。人设：' + contact.persona);
        var promptText = aiCtx + '\n\n'
                   + '【场景】你在闲鱼/转转这样的二手平台上挂了一件闲置物品\n'
                   + '【任务】根据你的人设(身份/收入/兴趣/生活场景)，想一件你会出售的物品\n'
                   + '例子：\n'
                   + '  - 学生党：旧教材、闲置球鞋、二手笔记本\n'
                   + '  - 爱美女生：穿过几次的衣服、试色过的口红\n'
                   + '  - 极客：淘汰的耳机/键盘/显示器\n'
                   + '  - 极简主义：整理出来的任何东西\n'
                   + '  - 网购狂：买错的/冲动消费的\n\n'
                   + '【输出JSON(仅一个对象)】{\n'
                   + '  "name":"物品名",\n'
                   + '  "category":"衣服|美妆|食品|鞋包|数码|家居|其他",\n'
                   + '  "condition":"new|like_new|used_good|used_fair",\n'
                   + '  "price":数字(二手价),\n'
                   + '  "originalPrice":数字(购入原价),\n'
                   + '  "desc":"用你自己口吻写的挂卖描述40-100字",\n'
                   + '  "reason":"为什么要卖(1句话，符合人设)"\n'
                   + '}\n\n'
                   + '⚠️ desc 和 reason 必须是「'+contact.name+'」的真实口吻，严禁OOC';

        var resp = await callShopAPI([{ role:'system', content: promptText }], { temperature: 0.95 });
        var data = parseJSON(resp);
        if (!data || !data.name) {
            // fallback
            data = {
                name: '闲置物品',
                category: '其他',
                condition: 'used_good',
                price: 20,
                originalPrice: 50,
                desc: '自用闲置，收走私聊~',
                reason: '家里放不下了'
            };
        }
        // 验证类目
        var validCats = ['衣服','美妆','食品','鞋包','数码','家居','其他'];
        if (validCats.indexOf(data.category) < 0) data.category = '其他';
        var validConds = ['new','like_new','used_good','used_fair'];
        if (validConds.indexOf(data.condition) < 0) data.condition = 'used_good';
        data.price = Math.max(0.1, parseFloat(data.price) || 10);
        data.originalPrice = Math.max(data.price, parseFloat(data.originalPrice) || data.price * 2);

        return {
            id: 'sh_' + _now() + '_' + Math.random().toString(36).slice(2,6),
            sellerId: contact.id,
            sellerName: contact.name,
            sellerAvatar: contact.avatar || '',
            name: data.name,
            category: data.category,
            condition: data.condition,
            price: data.price,
            originalPrice: data.originalPrice,
            desc: data.desc || '',
            reason: data.reason || '',
            status: 'on_sale', // on_sale | sold | off
            views: 0,
            createdAt: _now()
        };
    }

    function _setShRefreshBtn(loading) {
        var btn = document.getElementById('sh-refresh-btn');
        if (!btn) return;
        if (loading) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 刷新中...';
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> 刷新好友动态';
        }
    }

    // ==================== 渲染 Feed（在购物App首页使用） ====================
    window.renderFriendsSHFeed = function() {
        initFriendsMarket();
        var container = document.getElementById('sh-feed-container');
        if (!container) return;

        var items = window.getFriendsSHFeed();
        var listHtml = '';
        if (items.length === 0) {
            listHtml = '<div class="sh-empty">'
                     + '<i class="fas fa-box-open" style="font-size:40px;color:#ddd;"></i>'
                     + '<p style="color:#999;font-size:13px;margin-top:10px;">还没有好友挂卖物品</p>'
                     + '<p style="color:#aaa;font-size:11px;margin-top:6px;">点击上方"刷新"按钮，联系人会按照人设挂出二手物品</p>'
                     + '</div>';
        } else {
            listHtml = '<div class="sh-grid">' + items.map(renderSHItemCard).join('') + '</div>';
        }
        container.innerHTML = listHtml;
    };

    function renderSHItemCard(item) {
        var emoji = CATEGORY_EMOJI[item.category] || '📦';
        var condLabel = CONDITION_LABEL[item.condition] || '二手';
        var statusBadge = '';
        if (item.status === 'sold') statusBadge = '<div class="sh-sold-overlay">已售出</div>';
        else if (item.status === 'off') statusBadge = '<div class="sh-sold-overlay">已下架</div>';

        var avatarHtml = item.sellerAvatar
            ? '<img src="'+item.sellerAvatar+'">'
            : '<div class="sh-avatar-ph">'+(item.sellerName||'?').charAt(0)+'</div>';

        var discount = item.originalPrice > item.price
            ? '<span class="sh-discount">' + Math.round((item.price/item.originalPrice)*10) + '折</span>'
            : '';

        return '<div class="sh-card" onclick="openFriendsSHItem(\''+item.id+'\')">'
             + (statusBadge || '')
             + '<div class="sh-card-cover">'
             +   '<div class="sh-card-emoji">'+emoji+'</div>'
             +   '<div class="sh-card-cond">'+condLabel+'</div>'
             + '</div>'
             + '<div class="sh-card-body">'
             +   '<div class="sh-card-name">'+_esc(item.name)+'</div>'
             +   '<div class="sh-card-desc">'+_esc((item.desc||'').substring(0, 40))+'</div>'
             +   '<div class="sh-card-price-row">'
             +     '<span class="sh-card-price">¥'+Number(item.price).toFixed(0)+'</span>'
             +     (item.originalPrice > item.price ? '<span class="sh-card-original">¥'+Number(item.originalPrice).toFixed(0)+'</span>' : '')
             +     discount
             +   '</div>'
             +   '<div class="sh-card-seller">'
             +     '<div class="sh-card-avatar">'+avatarHtml+'</div>'
             +     '<span class="sh-card-seller-name">'+_esc(item.sellerName)+'</span>'
             +   '</div>'
             + '</div></div>';
    }

    // ==================== 点击商品打开详情 ====================
    window.openFriendsSHItem = function(itemId) {
        // [FIX-私聊卡死v3] 刷新期间禁止打开商品详情，防止数据竞争导致卡死
        if (window._shRefreshing) {
            if (typeof toast === 'function') toast('正在刷新，请稍候...');
            return;
        }
        initFriendsMarket();
        var item = (store.friendsSecondHand||[]).find(function(x){ return x.id === itemId; });
        if (!item) return;
        item.views = (item.views||0) + 1;
        _save();
        currentSHItem = item;
        renderSHDetailModal();
    };

    function renderSHDetailModal() {
        var item = currentSHItem;
        if (!item) return;
        var modalId = 'sh-detail-modal';
        var existing = document.getElementById(modalId);
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'sh-modal';
        modal.innerHTML = getSHDetailHTML(item);
        modal.onclick = function(e) { if (e.target === modal) closeSHDetail(); };
        document.body.appendChild(modal);
        requestAnimationFrame(function() { modal.classList.add('show'); });
    }

    window.closeSHDetail = function(cb) {
        var modal = document.getElementById('sh-detail-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(function() {
                if (modal && modal.parentNode) modal.remove();
                // [FIX-私聊卡死v2] 不再在 closeSHDetail 中清空 currentSHItem
                // 因为 openSHChat 的回调可能还需要用它来初始化会话
                // currentSHItem 改为在 renderSHChat 完成后或新的 detail 打开时清空
                if (typeof cb === 'function') cb();
                else currentSHItem = null; // 无回调时才清空（普通关闭）
            }, 220);
        } else {
            if (typeof cb === 'function') cb();
            else currentSHItem = null;
        }
    };

    function getSHDetailHTML(item) {
        var emoji = CATEGORY_EMOJI[item.category] || '📦';
        var condLabel = CONDITION_LABEL[item.condition] || '二手';
        var avatarHtml = item.sellerAvatar
            ? '<img src="'+item.sellerAvatar+'">'
            : '<div class="sh-avatar-ph">'+(item.sellerName||'?').charAt(0)+'</div>';

        var sold = (item.status === 'sold' || item.status === 'off');
        var actions = '';
        if (sold) {
            actions = '<div class="sh-detail-actions sh-detail-sold">'
                    + (item.status === 'sold' ? '✅ 已售出' : '⏹ 已下架')
                    + '</div>';
        } else {
            actions = '<div class="sh-detail-actions">'
                    + '<button class="sh-action-btn secondary" onclick="shAskSeller()"><i class="fas fa-comment"></i><span>咨询</span></button>'
                    + '<button class="sh-action-btn secondary" onclick="shMakeOffer()"><i class="fas fa-hand-holding-usd"></i><span>出价</span></button>'
                    + '<button class="sh-action-btn primary" onclick="shBuyDirect()"><i class="fas fa-shopping-bag"></i><span>直接购买</span></button>'
                    + '</div>';
        }

        return '<div class="sh-detail-sheet">'
             + '<div class="sh-detail-header">'
             +   '<div class="sh-detail-close" onclick="closeSHDetail()"><i class="fas fa-times"></i></div>'
             + '</div>'
             + '<div class="sh-detail-body">'
             +   '<div class="sh-detail-cover"><div class="sh-detail-emoji">'+emoji+'</div></div>'
             +   '<div class="sh-detail-title">'+_esc(item.name)+'</div>'
             +   '<div class="sh-detail-price-row">'
             +     '<span class="sh-detail-price">¥'+Number(item.price).toFixed(2)+'</span>'
             +     (item.originalPrice > item.price ? '<span class="sh-detail-original">原价¥'+Number(item.originalPrice).toFixed(2)+'</span>' : '')
             +   '</div>'
             +   '<div class="sh-detail-meta">'
             +     '<span class="sh-meta-tag">'+_esc(item.category)+'</span>'
             +     '<span class="sh-meta-tag">'+condLabel+'</span>'
             +     (item.views ? '<span class="sh-meta-view">'+item.views+' 人看过</span>' : '')
             +   '</div>'
             +   '<div class="sh-detail-section">'
             +     '<div class="sh-detail-sec-title">📝 商品描述</div>'
             +     '<div class="sh-detail-desc">'+_esc(item.desc)+'</div>'
             +   '</div>'
             +   (item.reason ? '<div class="sh-detail-section">'
             +     '<div class="sh-detail-sec-title">💭 出售原因</div>'
             +     '<div class="sh-detail-reason">'+_esc(item.reason)+'</div>'
             +   '</div>' : '')
             +   '<div class="sh-detail-section">'
             +     '<div class="sh-detail-sec-title">👤 卖家</div>'
             +     '<div class="sh-detail-seller">'
             +       '<div class="sh-detail-seller-avatar">'+avatarHtml+'</div>'
             +       '<div class="sh-detail-seller-info">'
             +         '<div class="sh-detail-seller-name">'+_esc(item.sellerName)+'</div>'
             +         '<div class="sh-detail-seller-sub">你的联系人</div>'
             +       '</div>'
             +     '</div>'
             +   '</div>'
             + '</div>'
             + actions
             + '</div>';
    }

    // ==================== 会话（App内，不进微信） ====================
    function getConv(sellerId, item) {
        if (!store.friendsSHConversations) store.friendsSHConversations = {};
        if (!store.friendsSHConversations[sellerId]) {
            store.friendsSHConversations[sellerId] = {
                sellerId: sellerId,
                itemId: item ? item.id : null,
                itemName: item ? item.name : '',
                messages: [],
                createdAt: _now(),
                updatedAt: _now()
            };
        } else if (item && store.friendsSHConversations[sellerId].itemId !== item.id) {
            // 切换商品：在当前对话里插入系统提示
            store.friendsSHConversations[sellerId].itemId = item.id;
            store.friendsSHConversations[sellerId].itemName = item.name;
            store.friendsSHConversations[sellerId].messages.push({
                role: 'system',
                text: '咨询商品：' + item.name + ' ¥' + item.price,
                time: _now()
            });
        }
        return store.friendsSHConversations[sellerId];
    }

    // ==================== 咨询卖家 ====================
    window.shAskSeller = function() {
        if (!currentSHItem) return;
        var item = currentSHItem;
        var sellerId = item.sellerId;
        getConv(sellerId, item);
        shConvId = sellerId;
        closeSHDetail(function() {
            openSHChat(sellerId);
        });
    };

    // ==================== 出价 ====================
    window.shMakeOffer = async function() {
        if (!currentSHItem) return;
        var item = currentSHItem;
        var sellerId = item.sellerId;
        var offer = window.prompt('你想出多少钱？（当前售价 ¥' + item.price + '）');
        if (offer === null) return;
        var amt = parseFloat(offer);
        if (isNaN(amt) || amt <= 0 || amt > item.price) {
            if (typeof toast === 'function') toast('出价需在 0 到 ¥' + item.price + ' 之间');
            return;
        }

        var conv = getConv(sellerId, item);
        conv.messages.push({
            role: 'me',
            text: '我出¥'+amt.toFixed(2)+'买这件「'+item.name+'」可以吗？',
            time: _now(),
            offerAmount: amt,
            relatedItemId: item.id
        });
        conv.updatedAt = _now();
        _save();
        shConvId = sellerId;
        closeSHDetail(function() {
            openSHChat(sellerId);
            // 让卖家根据人设和出价响应
            generateSellerOfferReply(item, amt);
        });
    };

    async function generateSellerOfferReply(item, offerAmount) {
        var seller = (store.contacts||[]).find(function(c){ return c.id === item.sellerId; });
        // [FIX-已删除联系人] 即使联系人被删除，也用商品里缓存的卖家信息构造虚拟seller
        if (!seller) {
            seller = { id: item.sellerId, name: item.sellerName || '卖家', avatar: item.sellerAvatar || '', persona: item._cachedPersona || '' };
        }
        var discountPct = Math.round((offerAmount/item.price)*100);

        var aiCtx = (typeof getAiContext === 'function' && seller.persona) ? getAiContext(seller) : ('你是' + seller.name);
        var promptText = aiCtx + '\n\n'
                   + '【场景】你在二手平台挂了「'+item.name+'」标价¥'+item.price+'\n'
                   + '买家('+(store.user.name||'用户')+')出价¥'+offerAmount+'(相当于标价的'+discountPct+'%)\n'
                   + '你挂卖的原因："'+(item.reason||'闲置')+'"\n'
                   + '【任务】根据你的人设决定是否接受这个出价\n'
                   + '  - 如果你很随意/想快速出掉：可能接受\n'
                   + '  - 如果你心疼东西/不差钱：可能拒绝或还价\n'
                   + '  - 如果你和买家关系好：可能大方接受甚至免费送\n'
                   + '【输出JSON(仅一个对象)】{\n'
                   + '  "decision":"accept|counter|reject",\n'
                   + '  "counterPrice":还价时的新价格(否则0),\n'
                   + '  "message":"你的回复话语(30-80字，你的真实口吻)"\n'
                   + '}';
        var resp = await callShopAPI([{role:'system',content:promptText}], {temperature:0.9});
        var data = parseJSON(resp) || { decision:'counter', counterPrice: item.price*0.9, message:'再加点呗~' };

        var conv = getConv(item.sellerId, item);
        conv.messages.push({
            role: 'seller',
            text: data.message || '我再想想',
            time: _now(),
            decision: data.decision,
            counterPrice: data.counterPrice || 0
        });
        conv.updatedAt = _now();
        _save();
        renderSHChat();
    }

    // ==================== 直接购买 ====================
    window.shBuyDirect = async function() {
        if (!currentSHItem) return;
        var item = currentSHItem;
        // [FIX-重复购买] 购买前检查商品状态
        if (item.status !== 'on_sale') {
            if (typeof toast === 'function') toast('该商品已售出，无法购买');
            return;
        }
        if (typeof showConfirm === 'function') {
            showConfirm('确认购买', '以 ¥'+item.price+' 购买「'+item.name+'」吗？', function() {
                doPurchase(item, item.price);
            });
        } else if (confirm('购买 ¥'+item.price+' 「'+item.name+'」？')) {
            doPurchase(item, item.price);
        }
    };

    async function doPurchase(item, finalPrice) {
        // [FIX-重复购买] 再次检查状态，防止并发/延迟调用
        if (item.status !== 'on_sale') {
            if (typeof toast === 'function') toast('该商品已售出，无法重复购买');
            return;
        }
        // 钱包扣款
        if (typeof store.walletBalance === 'number') {
            if (store.walletBalance < finalPrice) {
                if (typeof toast === 'function') toast('💰 余额不足，请先充值');
                return;
            }
            store.walletBalance -= finalPrice;
            // 记录钱包流水
            if (!store.walletHistory) store.walletHistory = [];
            store.walletHistory.unshift({
                id: 'wh_'+_now(),
                type: 'pay',
                amount: -finalPrice,
                desc: '二手购买·'+item.name,
                time: _now()
            });
        }

        // 标记售出
        item.status = 'sold';

        var orderId = 'shord_'+_now();
        var now = _now();

        // 创建订单（二手专用字段）
        var order = {
            id: orderId,
            source: 'secondhand',
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            sellerAvatar: item.sellerAvatar,
            itemId: item.id,
            itemName: item.name,
            itemCategory: item.category,
            price: finalPrice,
            status: 'waiting_ship',
            logistics: null,
            createdAt: now
        };
        if (!store.friendsSHOrders) store.friendsSHOrders = [];
        store.friendsSHOrders.unshift(order);

        // 同步写入统一订单列表（让"我的订单"页能看到）
        if (!store.shopOrders) store.shopOrders = [];
        var CATE_EMOJI = {'衣服':'👕','美妆':'💄','食品':'🍪','鞋包':'👜','数码':'📱','家居':'🏠','其他':'📦'};
        store.shopOrders.unshift({
            id: orderId,
            source: 'secondhand',
            items: [{
                name: item.name,
                price: finalPrice,
                qty: 1,
                image: '',
                category: item.category,
                emoji: CATE_EMOJI[item.category] || '📦'
            }],
            total: finalPrice,
            status: 'waiting_ship',
            payMethod: 'wallet',
            address: (store.shopAddresses || [])[0] || null,
            time: now,
            logistics: null,
            // 二手专属
            sellerId: item.sellerId,
            sellerName: item.sellerName,
            sellerAvatar: item.sellerAvatar
        });

        // 在会话里插入系统消息 & 卖家确认
        var conv = getConv(item.sellerId, item);
        conv.messages.push({ role:'system', text:'✅ 下单成功 ¥'+finalPrice, time:now });
        conv.updatedAt = now;
        _save();
        closeSHDetail();
        if (typeof toast === 'function') toast('✅ 下单成功，卖家准备发货');

        // 生成卖家确认 + 自动发货（静默）
        generateSellerShipConfirm(item, order);

        renderFriendsSHFeed();
    }

    // 快递公司前缀池
    var CARRIERS = ['SF','YT','ZT','YD','STO','EMS','JD','DB'];
    function _genTrackingNo() {
        var prefix = CARRIERS[Math.floor(Math.random()*CARRIERS.length)];
        return prefix + Date.now().toString().slice(-10) + Math.floor(Math.random()*1000);
    }

    function _genLogistics(trackingNo) {
        var now = _now();
        var carrier = trackingNo.replace(/[0-9]/g,'') || 'YAN';
        var CARRIER_NAME = {SF:'顺丰',YT:'圆通',ZT:'中通',YD:'韵达',STO:'申通',EMS:'EMS',JD:'京东',DB:'德邦'};
        return {
            trackingNo: trackingNo,
            carrier: (CARRIER_NAME[carrier]||carrier) + '快递',
            steps: [
                { text: '卖家已发货（单号 '+trackingNo+'）', time: now },
                { text: '快递员已上门揽收', time: now + 30000 },
                { text: '包裹已离开发货地仓库', time: now + 90000 },
                { text: '包裹到达转运中心', time: now + 180000 },
                { text: '包裹已到达您所在城市', time: now + 300000 },
                { text: '快递员正在派送', time: now + 420000 },
                { text: '已签收，感谢使用', time: now + 540000 }
            ],
            currentStep: 0
        };
    }

    // 更新统一订单里的物流和状态
    function _syncOrderStatus(orderId, status, logistics) {
        // 同步 friendsSHOrders
        var shOrd = (store.friendsSHOrders||[]).find(function(o){ return o.id === orderId; });
        if (shOrd) {
            shOrd.status = status;
            if (logistics) shOrd.logistics = logistics;
        }
        // 同步 shopOrders
        var shopOrd = (store.shopOrders||[]).find(function(o){ return o.id === orderId; });
        if (shopOrd) {
            shopOrd.status = status;
            if (logistics) shopOrd.logistics = logistics;
        }
    }

    async function generateSellerShipConfirm(item, order) {
        var seller = (store.contacts||[]).find(function(c){ return c.id === item.sellerId; });
        if (!seller) {
            // [FIX-购买流程] 即使找不到卖家也要完成发货
            _doShipFallback(item, order, null, '收到啦，马上给你发~');
            return;
        }

        var msg = '收到啦，我明天就发~'; // 兜底消息
        try {
            var aiCtx = (typeof getAiContext === 'function') ? getAiContext(seller) : ('你是' + seller.name);
            var promptText = aiCtx + '\n\n'
                       + '【场景】'+(store.user.name||'买家')+'刚在二手平台拍下了你挂卖的「'+item.name+'」(¥'+order.price+')\n'
                       + '【任务】根据你的人设，发一条确认消息(50-80字)，内容可以包括：\n'
                       + '  1. 感谢/意外/开心/不舍等反应\n'
                       + '  2. 什么时候发货\n'
                       + '  3. 可能的额外叮嘱或玩笑\n'
                       + '⚠️ 只输出对白原话，符合你的人设和与买家的关系';
            var resp = await callShopAPI([{role:'system',content:promptText}], {temperature:0.85});
            if (resp) msg = resp.trim().replace(/^[""「『]|[""」』]$/g,'').replace(/^\[.*?\]\s*:\s*/,'');
        } catch(e) {
            console.warn('[friends-market] AI确认消息失败，使用兜底:', e);
        }
        if (!msg) msg = '收到啦，我明天就发~';

        _doShipFallback(item, order, seller, msg);
    }

    // [FIX-购买流程] 统一发货逻辑：无论API成功与否都能完成发货
    function _doShipFallback(item, order, seller, msg) {
        var conv = getConv(item.sellerId, item);
        conv.messages.push({ role:'seller', text: msg, time:_now() });
        conv.updatedAt = _now();
        _save();

        // 延迟 2-5 秒后自动发货
        setTimeout(function() {
            var trackingNo = _genTrackingNo();
            var logistics = _genLogistics(trackingNo);
            _syncOrderStatus(order.id, 'shipped', logistics);

            conv.messages.push({ role:'system', text:'🚚 卖家已发货，单号 '+trackingNo, time:_now() });
            conv.updatedAt = _now();
            _save();

            var sellerName = seller ? seller.name : '卖家';
            if (typeof toast === 'function') toast('🚚 '+sellerName+' 已发货');
            if (shConvId === item.sellerId) renderSHChat();
            if (typeof renderShopOrders === 'function') renderShopOrders();

            // 启动物流推进（基于时间戳）
            _scheduleLogisticsAdvance(order.id);
        }, 2000 + Math.random() * 3000);
    }

    // [FIX-物流推进] 基于时间戳计算物流进度，页面刷新后也能恢复
    // 每步间隔15秒（演示用），但通过时间戳计算而非纯定时器
    var LOGISTICS_STEP_INTERVAL = 15000;

    function _calcLogisticsStep(logistics) {
        if (!logistics || !logistics.steps || logistics.steps.length === 0) return 0;
        // 用第一步的时间作为基准
        var baseTime = logistics.steps[0].time || 0;
        if (!baseTime) return logistics.currentStep || 0;
        var elapsed = _now() - baseTime;
        var step = Math.floor(elapsed / LOGISTICS_STEP_INTERVAL);
        return Math.min(step, logistics.steps.length - 1);
    }

    function _scheduleLogisticsAdvance(orderId) {
        var timer = setInterval(function() {
            var shopOrd = (store.shopOrders||[]).find(function(o){ return o.id === orderId; });
            if (!shopOrd || !shopOrd.logistics || !shopOrd.logistics.steps) { clearInterval(timer); return; }
            var lg = shopOrd.logistics;
            // [FIX] 基于时间戳计算当前步骤
            var newStep = _calcLogisticsStep(lg);
            if (newStep !== (lg.currentStep || 0)) {
                lg.currentStep = newStep;
                var shOrd = (store.friendsSHOrders||[]).find(function(o){ return o.id === orderId; });
                if (shOrd && shOrd.logistics) shOrd.logistics.currentStep = newStep;
            }
            if (lg.currentStep >= lg.steps.length - 1) {
                shopOrd.status = 'delivered';
                _syncOrderStatus(orderId, 'delivered', null);
                _save();
                if (typeof renderShopOrders === 'function') renderShopOrders();
                clearInterval(timer);
                return;
            }
            _save();
        }, LOGISTICS_STEP_INTERVAL);
    }

    // [FIX-物流恢复] 页面加载时恢复未完成订单的物流进度
    function _recoverPendingLogistics() {
        var orders = (store.shopOrders||[]).filter(function(o) {
            return o.source === 'secondhand' && o.status === 'shipped' && o.logistics;
        });
        orders.forEach(function(o) {
            var newStep = _calcLogisticsStep(o.logistics);
            o.logistics.currentStep = newStep;
            if (newStep >= (o.logistics.steps||[]).length - 1) {
                o.status = 'delivered';
                _syncOrderStatus(o.id, 'delivered', null);
            } else {
                _scheduleLogisticsAdvance(o.id);
            }
        });
        if (orders.length > 0) _save();
    }
    // 启动时恢复
    setTimeout(_recoverPendingLogistics, 2000);

    // 暴露物流推进给外部（主商城也可调用）
    window._shScheduleLogistics = _scheduleLogisticsAdvance;

    // ==================== 会话 UI ====================
    function openSHChat(sellerId) {
        shConvId = sellerId;
        // [FIX-私聊卡死v2] 确保会话存在，避免 renderSHChat 因 conv 为 undefined 而静默 return
        if (!store.friendsSHConversations) store.friendsSHConversations = {};
        if (!store.friendsSHConversations[sellerId]) {
            // 尝试从当前浏览的商品获取 item 信息
            var item = currentSHItem && currentSHItem.sellerId === sellerId ? currentSHItem : null;
            // [FIX-私聊卡死v2] 如果 currentSHItem 已被清空，从 store 中查找该卖家的商品
            if (!item) {
                item = (store.friendsSecondHand||[]).find(function(x){ return x.sellerId === sellerId; }) || null;
            }
            getConv(sellerId, item);
        }
        // [FIX-私聊卡死v2] 验证 seller 存在，否则提示用户
        var seller = (store.contacts||[]).find(function(c){ return c.id === sellerId; });
        if (!seller) {
            if (typeof toast === 'function') toast('找不到该卖家信息');
            currentSHItem = null;
            return;
        }
        renderSHChat();

        // [FIX-咨询没反应] 首次打开会话时自动生成卖家问候语
        var conv = (store.friendsSHConversations||{})[sellerId];
        if (conv && conv.messages.filter(function(m){ return m.role === 'seller'; }).length === 0) {
            generateSellerGreeting(conv, seller);
        }

        // [FIX-私聊卡死v2] chat 打开后清空 currentSHItem，避免残留引用
        currentSHItem = null;
    }

    // [FIX-咨询没反应] 卖家自动打招呼
    async function generateSellerGreeting(conv, seller) {
        var item = conv.itemId ? (store.friendsSecondHand||[]).find(function(x){return x.id===conv.itemId;}) : null;
        var aiCtx = (typeof getAiContext === 'function') ? getAiContext(seller) : ('你是' + seller.name);
        var itemInfo = item
            ? ('你挂卖的商品：'+item.name+' ¥'+item.price+'\\n挂卖原因：\"'+(item.reason||'')+'\"')
            : '你在二手平台';

        var promptText = aiCtx + '\n\n'
                   + '【场景】有人('+(store.user.name||'买家')+')在二手交易App上点了你挂卖的商品来咨询\n'
                   + itemInfo + '\n\n'
                   + '【任务】以「'+seller.name+'」的身份发一条打招呼/欢迎消息(15-50字)\n'
                   + '例如：问一下买家想了解什么、夸一下自己的宝贝、表示欢迎砍价等\n'
                   + '⚠️ 要求：\n'
                   + '1. 符合你的人设和口吻\n'
                   + '2. 自然热情但不机械\n'
                   + '3. 严禁AI腔\n'
                   + '4. 只输出一句对白';

        try {
            var resp = await callShopAPI([{role:'system',content:promptText}], {temperature:0.9, max_tokens:150});
            var greeting = (resp || '').trim().replace(/^[「『""]|[」』""]$/g,'').replace(/^\[.*?\]\s*:\s*/,'');
            if (!greeting) greeting = '嗨～看上什么了？随便问~';
        } catch(e) {
            var greeting = '嗨～看上什么了？随便问~';
        }

        conv.messages.push({ role:'seller', text: greeting, time: _now() });
        conv.updatedAt = _now();
        _save();
        renderSHChat();
    }

    function renderSHChat() {
        // [FIX-私聊卡死] shConvId 为空时防御性 return
        if (!shConvId) return;
        var modalId = 'sh-chat-modal';
        var existing = document.getElementById(modalId);
        if (existing) existing.remove();

        var conv = (store.friendsSHConversations||{})[shConvId];
        if (!conv) {
            if (typeof toast === 'function') toast('无法打开会话，请重试');
            return;
        }

        var seller = (store.contacts||[]).find(function(c){ return c.id === shConvId; });
        // [FIX-已删除联系人] 用会话中缓存的卖家名生成虚拟seller对象
        if (!seller) {
            var _convData = conv;
            var _shItem = _convData.itemId ? (store.friendsSecondHand||[]).find(function(x){return x.id===_convData.itemId;}) : null;
            seller = { id: shConvId, name: _shItem ? _shItem.sellerName : '卖家', avatar: _shItem ? _shItem.sellerAvatar : '' };
        }

        var modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'sh-modal';
        modal.innerHTML = getSHChatHTML(seller, conv);
        modal.onclick = function(e) { if (e.target === modal) closeSHChat(); };
        document.body.appendChild(modal);
        requestAnimationFrame(function() { modal.classList.add('show'); });
        setTimeout(function() {
            var el = document.getElementById('sh-chat-replies');
            if (el) el.scrollTop = el.scrollHeight;
        }, 50);
    }

    // 砍价成交后点击下单
    window.shAcceptOfferBuy = function(itemId, price) {
        var item = (store.friendsSecondHand||[]).find(function(x){ return x.id === itemId; });
        if (!item) return;
        if (item.status !== 'on_sale') {
            if (typeof toast === 'function') toast('该商品已售出');
            return;
        }
        closeSHChat();
        setTimeout(function() {
            if (typeof showConfirm === 'function') {
                showConfirm('确认购买', '以 ¥'+Number(price).toFixed(2)+' 购买「'+item.name+'」吗？', function() {
                    doPurchase(item, price);
                });
            } else if (confirm('购买 ¥'+Number(price).toFixed(2)+' 「'+item.name+'」？')) {
                doPurchase(item, price);
            }
        }, 300);
    };

    window.closeSHChat = function() {
        var modal = document.getElementById('sh-chat-modal');
        if (modal) modal.classList.remove('show');
        setTimeout(function() { if (modal) modal.remove(); }, 200);
        shConvId = null;
    };

    function getSHChatHTML(seller, conv) {
        var avatarHtml = seller.avatar
            ? '<img src="'+seller.avatar+'">'
            : '<div class="sh-avatar-ph">'+(seller.name||'?').charAt(0)+'</div>';

        var bubbles = (conv.messages||[]).map(function(m, idx) {
            if (m.role === 'system') return '<div class="merchant-bubble-sys">'+_esc(m.text)+'</div>';
            var isMe = (m.role === 'me');
            var cls = isMe ? 'merchant-bubble-me' : 'merchant-bubble-customer';
            var ava = isMe
                ? (store.shopUserAvatar ? '<img src="'+store.shopUserAvatar+'">' : (store.user.avatar ? '<img src="'+store.user.avatar+'">' : '<div class="merchant-msg-avatar-ph me">我</div>'))
                : (seller.avatar ? '<img src="'+seller.avatar+'">' : '<div class="merchant-msg-avatar-ph">'+(seller.name||'?').charAt(0)+'</div>');
            var extra = '';
            // 砍价成交按钮：卖家 accept 且商品还在售
            if (m.role === 'seller' && m.decision === 'accept') {
                var relItem = conv.itemId ? (store.friendsSecondHand||[]).find(function(x){return x.id===conv.itemId;}) : null;
                if (relItem && relItem.status === 'on_sale') {
                    var buyPrice = m.counterPrice || relItem.price;
                    extra = '<div style="margin-top:8px;">'
                          + '<button onclick="shAcceptOfferBuy(\''+conv.itemId+'\','+buyPrice+')" '
                          + 'style="padding:8px 16px;border:none;background:linear-gradient(135deg,#07c160,#06ad56);color:#fff;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;">'
                          + '💰 以 ¥'+Number(buyPrice).toFixed(2)+' 下单</button></div>';
                }
            }
            // 卖家还价按钮
            if (m.role === 'seller' && m.decision === 'counter' && m.counterPrice > 0) {
                var relItem2 = conv.itemId ? (store.friendsSecondHand||[]).find(function(x){return x.id===conv.itemId;}) : null;
                if (relItem2 && relItem2.status === 'on_sale') {
                    extra = '<div style="margin-top:8px;">'
                          + '<button onclick="shAcceptOfferBuy(\''+conv.itemId+'\','+m.counterPrice+')" '
                          + 'style="padding:6px 14px;border:1px solid #07c160;background:#fff;color:#07c160;border-radius:20px;font-size:12px;cursor:pointer;margin-right:6px;">'
                          + '✅ 接受 ¥'+Number(m.counterPrice).toFixed(2)+'</button>'
                          + '<button onclick="shMakeOffer()" '
                          + 'style="padding:6px 14px;border:1px solid #faad14;background:#fff;color:#faad14;border-radius:20px;font-size:12px;cursor:pointer;">'
                          + '🔄 再砍一刀</button></div>';
                }
            }
            return '<div class="merchant-bubble '+cls+'">'
                 + '<div class="merchant-bubble-avatar">'+ava+'</div>'
                 + '<div class="merchant-bubble-body">'+_esc(m.text)+extra+'</div>'
                 + '</div>';
        }).join('');

        // 商品快捷卡（当前关联）
        var item = conv.itemId ? (store.friendsSecondHand||[]).find(function(x){return x.id===conv.itemId;}) : null;
        var itemCard = '';
        if (item) {
            itemCard = '<div class="sh-chat-item-bar" onclick="openFriendsSHItem(\''+item.id+'\')">'
                     + '<div class="sh-chat-item-emoji">'+(CATEGORY_EMOJI[item.category]||'📦')+'</div>'
                     + '<div class="sh-chat-item-info">'
                     +   '<div class="sh-chat-item-name">'+_esc(item.name)+'</div>'
                     +   '<div class="sh-chat-item-price">¥'+Number(item.price).toFixed(2)+'</div>'
                     + '</div>'
                     + (item.status==='on_sale' ? '<span class="sh-chat-item-status">在售</span>' : '<span class="sh-chat-item-status sold">已售</span>')
                     + '</div>';
        }

        return '<div class="merchant-msg-sheet">'
             + '<div class="merchant-msg-sheet-header">'
             +   '<div class="merchant-msg-sheet-avatar">'+avatarHtml+'</div>'
             +   '<div class="merchant-msg-sheet-title">'
             +     '<div class="merchant-msg-sheet-name">'+_esc(seller.name)+'</div>'
             +     '<div class="merchant-msg-sheet-sub">二手交易 · 本页对话不进微信</div>'
             +   '</div>'
             +   '<div class="merchant-msg-sheet-close" onclick="closeSHChat()"><i class="fas fa-times"></i></div>'
             + '</div>'
             + itemCard
             + '<div id="sh-chat-replies" class="merchant-msg-replies">'+bubbles+'</div>'
             + '<div class="merchant-msg-input-wrap">'
             +   '<textarea id="sh-chat-input" rows="2" placeholder="和卖家聊聊..." onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();shSendMessage();}"></textarea>'
             +   '<button class="merchant-msg-send-btn" onclick="shSendMessage()"><i class="fas fa-paper-plane"></i></button>'
             + '</div>'
             + '</div>';
    }

    // [FIX-私聊卡死v3] 防止并发发送
    var _shSending = false;
    window.shSendMessage = async function() {
        if (_shSending) return; // 防止重复点击
        var input = document.getElementById('sh-chat-input');
        if (!input) return;
        var text = (input.value||'').trim();
        if (!text) return;
        var _savedConvId = shConvId; // 保存当前会话ID，防止异步期间被清空
        var conv = (store.friendsSHConversations||{})[_savedConvId];
        if (!conv) return;
        _shSending = true;
        input.value = '';
        input.disabled = true;

        conv.messages.push({ role:'me', text: text, time: _now() });
        conv.updatedAt = _now();
        _save();
        renderSHChat();

        // [FIX-私聊卡死v2] renderSHChat 重建了 DOM，旧 input 引用已失效
        // 需要在 AI 回复前禁用新的 input
        var freshInput = document.getElementById('sh-chat-input');
        if (freshInput) freshInput.disabled = true;

        // AI生成卖家回复（带超时保护，防止无限 pending 导致输入框卡死）
        try {
            var aiTimeout = new Promise(function(_, reject) {
                setTimeout(function(){ reject(new Error('AI_TIMEOUT')); }, 30000);
            });
            await Promise.race([generateSellerChatReply(conv), aiTimeout]);
        } catch(e) {
            console.warn('[friends-market] chat reply err/timeout', e);
            // 移除 typing dots
            var typingEl = document.getElementById('sh-typing');
            if (typingEl) typingEl.remove();
            if (e && e.message === 'AI_TIMEOUT') {
                if (typeof toast === 'function') toast('卖家暂时没回复，稍后再试');
            } else {
                // [FIX-私聊卡死v2] 非超时错误也提示用户
                if (typeof toast === 'function') toast('回复生成失败，请重试');
            }
        } finally {
            _shSending = false;
            // [FIX-私聊卡死v3] finally 保底恢复输入框，无论成功/失败/异常都确保不卡死
            // 如果用户已关闭聊天窗口（shConvId 被清空），不需要恢复
            var finalInput = document.getElementById('sh-chat-input');
            if (finalInput) {
                finalInput.disabled = false;
                finalInput.focus();
            }
        }
    };

    async function generateSellerChatReply(conv) {
        var seller = (store.contacts||[]).find(function(c){ return c.id === conv.sellerId; });
        // [FIX-已删除联系人] 即使联系人已删除也能用缓存的商品信息生成回复
        if (!seller) {
            var _fallbackItem = conv.itemId ? (store.friendsSecondHand||[]).find(function(x){return x.id===conv.itemId;}) : null;
            seller = { id: conv.sellerId, name: _fallbackItem ? _fallbackItem.sellerName : (conv.itemName ? '卖家' : '卖家'), avatar: _fallbackItem ? _fallbackItem.sellerAvatar : '', persona: '' };
        }
        var item = conv.itemId ? (store.friendsSecondHand||[]).find(function(x){return x.id===conv.itemId;}) : null;

        // 打字指示器
        var repliesEl = document.getElementById('sh-chat-replies');
        if (repliesEl) {
            var typing = document.createElement('div');
            typing.id = 'sh-typing';
            typing.className = 'merchant-bubble merchant-bubble-customer';
            typing.innerHTML = '<div class="merchant-bubble-avatar">'
                + (seller.avatar ? '<img src="'+seller.avatar+'">' : '<div class="merchant-msg-avatar-ph">'+(seller.name||'?').charAt(0)+'</div>')
                + '</div><div class="merchant-bubble-body"><span class="merchant-typing-dots"><span></span><span></span><span></span></span></div>';
            repliesEl.appendChild(typing);
            repliesEl.scrollTop = repliesEl.scrollHeight;
        }

        var aiCtx = (typeof getAiContext === 'function') ? getAiContext(seller) : ('你是' + seller.name);
        var convo = conv.messages.slice(-8).map(function(m) {
            if (m.role === 'me') return '[买家]: ' + m.text;
            if (m.role === 'seller') return '[你]: ' + m.text;
            if (m.role === 'system') return '[系统]: ' + m.text;
            return m.text;
        }).join('\n');

        var itemInfo = item
            ? ('你挂卖的商品：'+item.name+' ¥'+item.price+'\n挂卖原因："'+(item.reason||'')+'"')
            : '你们在聊二手交易';

        var promptText = aiCtx + '\n\n'
                   + '【场景】你在二手交易App和买家'+(store.user.name||'')+'聊天\n'
                   + itemInfo + '\n\n'
                   + '【之前的对话】\n' + convo + '\n\n'
                   + '【任务】以「'+seller.name+'」的身份自然续写一句回复(10-60字)\n'
                   + '⚠️ 要求：\n'
                   + '1. 符合你的人设和挂卖心态（急出/心疼/随意）\n'
                   + '2. 可能的话语：讲细节/讲价还价/答应/拒绝/八卦近况等\n'
                   + '3. 严禁AI腔，严禁"好的""没问题"这种机器感\n'
                   + '4. 只输出一句对白';

        var resp = await callShopAPI([{role:'system',content:promptText}], {temperature:0.9, max_tokens:200});
        var reply = (resp || '嗯~').trim().replace(/^[「『""]|[」』""]$/g,'').replace(/^\[.*?\]\s*:\s*/,'');
        if (!reply) reply = '嗯~';

        conv.messages.push({ role:'seller', text: reply, time: _now() });
        conv.updatedAt = _now();
        _save();
        renderSHChat();
    }

    // ==================== 启动 ====================
    if (typeof store !== 'undefined') {
        initFriendsMarket();
    } else {
        var _fmAttempt = 0;
        var c = setInterval(function() {
            _fmAttempt++;
            if (typeof store !== 'undefined') {
                clearInterval(c);
                initFriendsMarket();
            } else if (_fmAttempt > 50) {
                clearInterval(c);
                console.warn('[FriendsMarket] store 未就绪，放弃初始化');
            }
        }, 200);
    }

})();
