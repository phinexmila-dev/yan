// ============================================================
// ========== FOOD DELIVERY · RIDER SYSTEM (骑手系统) ==========
// Stage 4: 骑手注册 + 工作台 UI (无成就系统)
// Stage 5: 订单池刷新 + 配送流程 + 评价API
// 所有订单/催单/评价通过手动按钮调用API生成
// ============================================================
(function(){
    'use strict';

    var VEHICLE_META = {
        bicycle:    { icon:'🚲', label:'自行车' },
        ebike:      { icon:'🛵', label:'电动车' },
        motorcycle: { icon:'🏍️', label:'摩托车' }
    };

    var AREA_OPTIONS = ['校园','商圈','住宅区','郊区','全城通达'];

    // [外卖补丁1+2] 配送费动态计算 + 时段加成
    function _calcFeeBreakdown(distance) {
        var d = Math.max(0.3, parseFloat(distance) || 1);
        var base = 4 + d * 1.2;                    // 基础 = 4 + 距离×1.2
        var hour = new Date().getHours();
        var multiplier = 1;
        var tags = [];
        if (hour >= 22 || hour < 6)  { multiplier *= 1.3; tags.push({icon:'🌙', text:'夜间 x1.3', color:'#5b8def'}); }
        else if ((hour >= 11 && hour < 13) || (hour >= 17 && hour < 19)) {
            multiplier *= 1.15; tags.push({icon:'⚡', text:'高峰 x1.15', color:'#ff9500'});
        }
        if (d > 3) { multiplier *= 1.2; tags.push({icon:'📍', text:'远单 x1.2', color:'#a855f7'}); }
        var day = new Date().getDay();
        if (day === 0 || day === 6) { multiplier *= 1.1; tags.push({icon:'📅', text:'周末 x1.1', color:'#ec4899'}); }
        var fee = Math.round(base * multiplier * 10) / 10;
        return { fee: fee, tags: tags, multiplier: multiplier };
    }

    // 订单池排序偏好（按收入/距离）
    var _riderSortBy = 'income';  // 'income' | 'distance'
    window.riderSetSortBy = function(mode) {
        _riderSortBy = (mode === 'distance') ? 'distance' : 'income';
        renderRiderLayer();
    };

    var LOGISTICS_STEPS_RIDER = [
        { key: 'heading_store',  label: '前往商家',    hint: '准备到店取餐' },
        { key: 'at_store',       label: '到店取餐',    hint: '已到商家，等出餐' },
        { key: 'picked_up',      label: '取餐完成',    hint: '餐品已取，出发配送' },
        { key: 'delivering',     label: '配送中',      hint: '正在送往用户' },
        { key: 'arriving',       label: '即将送达',    hint: '还有2分钟到达' },
        { key: 'delivered',      label: '已送达',      hint: '等待用户确认' }
    ];

    var currentRiderView = 'dashboard'; // dashboard | pool | current | history | income
    var currentOrderIdInView = null;

    function _save() { if (typeof save === 'function') save(); }
    function _esc(s) { return (typeof escapeHtml === 'function') ? escapeHtml(s||'') : String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function _now() { return Date.now(); }

    function parseJSON(str) {
        if (!str) return null;
        try {
            var c = (str||'').replace(/```(?:json|JSON)?\s*/g, '').replace(/```/g, '').trim();
            var m = c.match(/\[[\s\S]*\]/);
            if (m) return JSON.parse(m[0]);
            var m2 = c.match(/\{[\s\S]*\}/);
            if (m2) return JSON.parse(m2[0]);
        } catch(e) {}
        return null;
    }

    async function callFDAPI(messages, options) {
        if (typeof API === 'undefined' || !API.chatCompletion) return null;
        var runCall = function() {
            return API.chatCompletion(messages, {
                temperature: (options && options.temperature) || 0.9,
                max_tokens: (options && options.max_tokens) || 800
            });
        };
        var data;
        try {
            if (API.withScene) data = await API.withScene('fooddelivery', runCall);
            else data = await runCall();
        } catch(e) {
            console.warn('[rider] API err', e);
            return null;
        }
        if (data && data.choices && data.choices[0]) {
            return (data.choices[0].message && data.choices[0].message.content) || data.choices[0].text || '';
        }
        return null;
    }

    // ==================== 数据初始化 ====================
    function initRider() {
        if (!store.foodDelivery) store.foodDelivery = {};
        if (!store.foodDelivery.riderProfile) {
            store.foodDelivery.riderProfile = {
                isRider: false,
                name: '',
                avatar: '',
                vehicle: 'ebike',
                area: '校园',
                todayDate: '',
                todayOrders: 0,
                todayIncome: 0,
                totalOrders: 0,
                totalIncome: 0,
                goodReviews: 0,
                badReviews: 0,
                reviews: [],
                orderPool: [],
                currentOrder: null,
                history: []
            };
        }
        // 校验今日统计是否需要重置
        var today = new Date();
        var todayKey = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        var p = store.foodDelivery.riderProfile;
        if (p.todayDate !== todayKey) {
            p.todayDate = todayKey;
            p.todayOrders = 0;
            p.todayIncome = 0;
        }
        // 兼容字段补全
        if (!p.reviews) p.reviews = [];
        if (!p.orderPool) p.orderPool = [];
        if (!p.history) p.history = [];
    }

    // ==================== 入口 ====================
    window.fdOpenRider = function() {
        initRider();
        var p = store.foodDelivery.riderProfile;
        currentRiderView = p.isRider ? (p.currentOrder ? 'current' : 'dashboard') : 'register';
        renderRiderLayer();
    };

    function renderRiderLayer() {
        var layer = document.getElementById('layer-rider');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'layer-rider';
            layer.className = 'layer';
            layer.style.cssText = 'background:#f5f5f7;';
            var device = document.getElementById('device');
            (device || document.body).appendChild(layer);
        }
        layer.innerHTML = getRiderHTML();
        layer.classList.add('show');
    }
    window.renderRiderLayer = renderRiderLayer;

    window.fdCloseRider = function() {
        var layer = document.getElementById('layer-rider');
        if (layer) layer.classList.remove('show');
    };

    // ==================== 顶层布局 ====================
    function getRiderHTML() {
        initRider();
        var p = store.foodDelivery.riderProfile;
        if (!p.isRider || currentRiderView === 'register') return getRegisterHTML();

        var titles = {
            dashboard: '骑手工作台',
            pool:      '订单大厅',
            current:   '当前订单',
            history:   '我的订单',
            income:    '收入统计',
            settings:  '骑手设置'
        };
        var backAction = (currentRiderView === 'dashboard') ? 'fdCloseRider()' : 'riderBack()';
        var body;
        switch (currentRiderView) {
            case 'dashboard': body = renderRiderDashboard(); break;
            case 'pool':      body = renderOrderPool(); break;
            case 'current':   body = renderCurrentOrder(); break;
            case 'history':   body = renderRiderHistory(); break;
            case 'income':    body = renderRiderIncome(); break;
            case 'settings':  body = renderRiderSettings(); break;
            default:          body = renderRiderDashboard();
        }

        return '<div class="rider-nav">'
             + '<div class="rider-nav-back" onclick="'+backAction+'"><i class="fas fa-chevron-left"></i></div>'
             + '<div class="rider-nav-title">'+(titles[currentRiderView]||'')+'</div>'
             + '<div class="rider-nav-right"></div>'
             + '</div>'
             + '<div class="rider-body">'+body+'</div>';
    }

    window.riderBack = function() {
        if (currentRiderView === 'current' && store.foodDelivery.riderProfile.currentOrder) {
            // 正在配送时，返回不清除当前订单
            currentRiderView = 'dashboard';
        } else {
            currentRiderView = 'dashboard';
        }
        renderRiderLayer();
    };

    window.riderGoto = function(view) {
        currentRiderView = view;
        renderRiderLayer();
    };

    // ==================== 注册页面 ====================
    function getRegisterHTML() {
        var vehicleOptions = Object.keys(VEHICLE_META).map(function(k){
            var v = VEHICLE_META[k];
            return '<label class="rider-vehicle-option">'
                 +   '<input type="radio" name="rider-vehicle" value="'+k+'" '+(k==='ebike'?'checked':'')+'>'
                 +   '<span class="rider-vehicle-card">'
                 +     '<span class="rider-vehicle-icon">'+v.icon+'</span>'
                 +     '<span class="rider-vehicle-label">'+v.label+'</span>'
                 +   '</span>'
                 + '</label>';
        }).join('');

        var areaOptions = AREA_OPTIONS.map(function(a){
            return '<option value="'+a+'">'+a+'</option>';
        }).join('');

        return '<div class="rider-nav">'
             + '<div class="rider-nav-back" onclick="fdCloseRider()"><i class="fas fa-chevron-left"></i></div>'
             + '<div class="rider-nav-title">成为骑手</div>'
             + '<div class="rider-nav-right"></div></div>'
             + '<div class="rider-body rider-register">'
             + '<div class="rider-hero">'
             +   '<div class="rider-hero-icon">🛵</div>'
             +   '<div class="rider-hero-title">加入YAN骑手</div>'
             +   '<div class="rider-hero-desc">注册后即可在「骑手大厅」刷新订单<br>联系人会按照人设点外卖，你负责配送~</div>'
             + '</div>'
             + '<div class="rider-form">'
             + '<div class="rider-form-row"><label>骑手昵称</label>'
             +   '<input id="rider-reg-name" type="text" maxlength="20" placeholder="留空默认使用你的昵称" value="'+(store.user.name||'')+'">'
             + '</div>'
             + '<div class="rider-form-row"><label>交通工具</label>'
             +   '<div class="rider-vehicle-grid">'+vehicleOptions+'</div>'
             + '</div>'
             + '<div class="rider-form-row"><label>主要配送区域</label>'
             +   '<select id="rider-reg-area">'+areaOptions+'</select>'
             + '</div>'
             + '<button class="rider-btn-primary" onclick="riderSubmitRegister()">🚀 立即上岗</button>'
             + '</div>'
             + '<div class="rider-tip">上岗后无等级/徽章体系，只记录你的订单和收入</div>'
             + '</div>';
    }

    window.riderSubmitRegister = function() {
        var name = ((document.getElementById('rider-reg-name')||{}).value||'').trim() || (store.user.name||'骑手');
        var vehicleInput = document.querySelector('input[name="rider-vehicle"]:checked');
        var vehicle = vehicleInput ? vehicleInput.value : 'ebike';
        var area = (document.getElementById('rider-reg-area')||{}).value || '校园';

        var p = store.foodDelivery.riderProfile;
        p.isRider = true;
        p.name = name;
        p.vehicle = vehicle;
        p.area = area;
        p.avatar = store.user.avatar || '';
        _save();
        if (typeof toast==='function') toast('✅ 上岗成功，去刷新订单吧！');
        currentRiderView = 'dashboard';
        renderRiderLayer();
    };

    // ==================== 工作台 ====================
    function renderRiderDashboard() {
        var p = store.foodDelivery.riderProfile;
        var v = VEHICLE_META[p.vehicle] || VEHICLE_META.ebike;
        var goodRate = (p.goodReviews + p.badReviews) > 0
            ? Math.round(p.goodReviews / (p.goodReviews + p.badReviews) * 100)
            : 100;
        var poolCount = (p.orderPool||[]).filter(function(o){ return o.status === 'waiting'; }).length;
        var hasCurrent = !!p.currentOrder;

        var avatarHtml = p.avatar
            ? '<img src="'+p.avatar+'">'
            : '<div class="rider-avatar-ph">'+(p.name||'?').charAt(0)+'</div>';

        return '<div class="rider-dashboard">'
             // 骑手卡片
             + '<div class="rider-card">'
             + '<div class="rider-card-avatar">'+avatarHtml+'</div>'
             + '<div class="rider-card-info">'
             +   '<div class="rider-card-name">'+_esc(p.name)+' '+v.icon+'</div>'
             +   '<div class="rider-card-sub">'+v.label+' · '+_esc(p.area)+'</div>'
             + '</div>'
             + '<div class="rider-card-edit" onclick="riderGoto(\'settings\')"><i class="fas fa-cog"></i></div>'
             + '</div>'
             // 今日数据
             + '<div class="rider-section-title">📊 今日数据</div>'
             + '<div class="rider-stats">'
             + '<div class="rider-stat"><div class="rider-stat-v rider-income">¥'+(p.todayIncome||0).toFixed(1)+'</div><div class="rider-stat-l">今日收入</div></div>'
             + '<div class="rider-stat"><div class="rider-stat-v">'+(p.todayOrders||0)+'</div><div class="rider-stat-l">今日单数</div></div>'
             + '<div class="rider-stat"><div class="rider-stat-v">'+goodRate+'%</div><div class="rider-stat-l">好评率</div></div>'
             + '<div class="rider-stat"><div class="rider-stat-v">'+(p.totalOrders||0)+'</div><div class="rider-stat-l">累计单数</div></div>'
             + '</div>'
             // 当前订单提示
             + (hasCurrent
                 ? '<div class="rider-current-alert" onclick="riderGoto(\'current\')">'
                   + '<i class="fas fa-truck-fast"></i>'
                   + '<div class="rider-current-text">'
                   +   '<div class="rider-current-title">当前有配送任务</div>'
                   +   '<div class="rider-current-sub">'+_esc(p.currentOrder.shopName)+' → '+_esc(p.currentOrder.customerName)+'</div>'
                   + '</div>'
                   + '<i class="fas fa-chevron-right"></i>'
                 + '</div>'
                 : '')
             // 功能菜单
             + '<div class="rider-section-title">经营管理</div>'
             + '<div class="rider-menu">'
             + '<div class="rider-menu-item" onclick="riderGoto(\'pool\')">'
             +   '<i class="fas fa-list-alt" style="color:#ff6b35;"></i>'
             +   '<span>订单大厅</span>'
             +   (poolCount>0 ? '<em class="rider-badge">'+poolCount+'</em>' : '<span class="rider-menu-hint">刷新查看订单</span>')
             +   '<i class="fas fa-chevron-right rider-chevron"></i>'
             + '</div>'
             + '<div class="rider-menu-item" onclick="riderGoto(\'history\')">'
             +   '<i class="fas fa-history" style="color:#1890ff;"></i>'
             +   '<span>订单历史</span>'
             +   '<span class="rider-menu-hint">'+(p.history||[]).length+' 单</span>'
             +   '<i class="fas fa-chevron-right rider-chevron"></i>'
             + '</div>'
             + '<div class="rider-menu-item" onclick="riderGoto(\'income\')">'
             +   '<i class="fas fa-sack-dollar" style="color:#07c160;"></i>'
             +   '<span>收入统计</span>'
             +   '<span class="rider-menu-hint">¥'+(p.totalIncome||0).toFixed(1)+'</span>'
             +   '<i class="fas fa-chevron-right rider-chevron"></i>'
             + '</div>'
             + '<div class="rider-menu-item" onclick="riderGoto(\'settings\')">'
             +   '<i class="fas fa-cog" style="color:#9b59b6;"></i>'
             +   '<span>骑手设置</span>'
             +   '<i class="fas fa-chevron-right rider-chevron"></i>'
             + '</div>'
             + '<div class="rider-menu-item" onclick="riderQuit()">'
             +   '<i class="fas fa-sign-out-alt" style="color:#999;"></i>'
             +   '<span>退出骑手</span>'
             +   '<i class="fas fa-chevron-right rider-chevron"></i>'
             + '</div>'
             + '</div>'
             + '</div>';
    }

    window.riderQuit = function() {
        var doQuit = function() {
            store.foodDelivery.riderProfile.isRider = false;
            _save();
            if (typeof toast==='function') toast('已退出骑手');
            fdCloseRider();
        };
        if (typeof showConfirm === 'function') {
            showConfirm('退出骑手', '退出后你的收入和订单记录会保留。确认退出？', doQuit);
        } else if (confirm('确认退出骑手？')) doQuit();
    };

    // ==================== 订单大厅 ====================
    function renderOrderPool() {
        var p = store.foodDelivery.riderProfile;
        var pool = (p.orderPool||[]).filter(function(o){ return o.status === 'waiting'; });

        // [补丁3] 按排序偏好重排
        pool = pool.slice().sort(function(a, b) {
            if (_riderSortBy === 'distance') {
                return parseFloat(a.distance||99) - parseFloat(b.distance||99);
            }
            var incomeA = (a.deliveryFee||0) + (a.tip||0);
            var incomeB = (b.deliveryFee||0) + (b.tip||0);
            return incomeB - incomeA;  // 收入降序
        });

        var listHtml = '';
        if (pool.length === 0) {
            listHtml = '<div class="rider-empty">'
                     + '<i class="fas fa-concierge-bell" style="font-size:48px;color:#ddd;"></i>'
                     + '<p>订单大厅暂时没单</p>'
                     + '<p style="color:#999;font-size:12px;margin-top:6px;">点击下方按钮，召唤新订单</p>'
                     + '</div>';
        } else {
            listHtml = '<div class="rider-pool-list">'+ pool.map(renderPoolOrderCard).join('') +'</div>';
        }

        var hasCurrent = !!p.currentOrder;

        // [补丁3] 排序切换
        var sortTabs = '<div class="rider-pool-sort">'
                     + '<span class="rider-pool-sort-label">排序：</span>'
                     + '<button class="rider-pool-sort-btn '+(_riderSortBy==='income'?'active':'')+'" onclick="riderSetSortBy(\'income\')">💰 收入优先</button>'
                     + '<button class="rider-pool-sort-btn '+(_riderSortBy==='distance'?'active':'')+'" onclick="riderSetSortBy(\'distance\')">📍 距离优先</button>'
                     + '</div>';

        return '<div class="rider-pool">'
             + (hasCurrent ? '<div class="rider-pool-warn">⚠️ 你有正在配送的订单，完成后才能接新单</div>' : '')
             + '<button id="rider-refresh-btn" class="rider-btn-refresh" onclick="riderRefreshPool()">'
             +   '<i class="fas fa-sync-alt"></i> 刷新订单池'
             + '</button>'
             + '<div class="rider-pool-hint">💡 每次刷新调用 AI 根据联系人人设生成新订单。联系人订单会标记🔔</div>'
             + (pool.length > 1 ? sortTabs : '')
             + listHtml
             + '</div>';
    }

    function renderPoolOrderCard(o) {
        var p = store.foodDelivery.riderProfile;
        var hasCurrent = !!p.currentOrder;
        var itemsText = (o.items||[]).map(function(i){ return i.name+'×'+(i.qty||1); }).join(', ');
        var badge = o.isContact ? '<span class="rider-pool-contact-badge">🔔 联系人</span>' : '';
        var total = (o.deliveryFee||0) + (o.tip||0);

        // [补丁2] 时段加成标签（根据订单创建时间的 multiplier）
        var bonusTags = (o.bonusTags && o.bonusTags.length)
            ? '<div class="rider-pool-bonus">' + o.bonusTags.map(function(t){
                return '<span class="rider-pool-bonus-tag" style="background:'+t.color+'22;color:'+t.color+';">'+t.icon+' '+t.text+'</span>';
              }).join('') + '</div>'
            : '';

        return '<div class="rider-pool-card">'
             + '<div class="rider-pool-head">'
             +   '<div class="rider-pool-shop">🏪 '+_esc(o.shopName)+'</div>'
             +   badge
             + '</div>'
             + '<div class="rider-pool-items">'+_esc(itemsText)+'</div>'
             + '<div class="rider-pool-row">'
             +   '<span class="rider-pool-customer">→ '+_esc(o.customerName)+' · '+_esc(o.address||'')+'</span>'
             + '</div>'
             + (o.deliveryNote ? '<div class="rider-pool-note">📝 '+_esc(o.deliveryNote)+'</div>' : '')
             + bonusTags
             + '<div class="rider-pool-foot">'
             +   '<div class="rider-pool-fee">'
             +     '<span class="rider-pool-price">¥'+total.toFixed(1)+'</span>'
             +     '<span class="rider-pool-detail">配送 ¥'+(o.deliveryFee||0)+(o.tip>0?' + 小费 ¥'+o.tip:'')+'</span>'
             +   '</div>'
             +   '<div class="rider-pool-distance">📍 '+(o.distance||'?')+'km</div>'
             +   '<button class="rider-pool-accept" '+(hasCurrent?'disabled':'')+' onclick="riderAcceptOrder(\''+o.orderId+'\')">接单</button>'
             + '</div>'
             + '</div>';
    }

    // ==================== 刷新订单池（Stage 5 接入） ====================
    window.riderRefreshPool = async function() {
        initRider();
        if (window._riderRefreshing) {
            if (typeof toast==='function') toast('⏳ 正在刷新...');
            return;
        }
        window._riderRefreshing = true;
        _setRiderRefreshBtn(true);
        try {
            var p = store.foodDelivery.riderProfile;
            var contacts = (store.contacts||[]).filter(function(c){ return !c.isGroup && c.persona; });

            // 清理过期订单（超过10分钟的 waiting 订单自动失效）
            var expireMs = 10 * 60 * 1000;
            p.orderPool = (p.orderPool||[]).filter(function(o) {
                return o.status !== 'waiting' || (_now() - o.createTime) < expireMs;
            });

            var newOrders = [];

            // 1) 生成 1-2 个联系人订单（按人设）
            if (contacts.length > 0) {
                var contactCount = Math.random() < 0.5 ? 1 : 2;
                contactCount = Math.min(contactCount, contacts.length);
                var picked = contacts.slice().sort(function(){ return Math.random()-0.5; }).slice(0, contactCount);
                for (var i = 0; i < picked.length; i++) {
                    try {
                        var o = await generateContactOrder(picked[i]);
                        if (o) newOrders.push(o);
                    } catch(e) { console.warn('[rider] contact order err', e); }
                }
            }

            // 2) 生成 2-3 个匿名订单
            var anonCount = 2 + Math.floor(Math.random()*2);
            try {
                var anons = await generateAnonymousOrders(anonCount);
                if (anons && anons.length) newOrders = newOrders.concat(anons);
            } catch(e) { console.warn('[rider] anon orders err', e); }

            if (newOrders.length > 0) {
                p.orderPool = newOrders.concat(p.orderPool);
                if (p.orderPool.length > 30) p.orderPool = p.orderPool.slice(0, 30);
                _save();
                if (typeof toast==='function') toast('📋 +' + newOrders.length + ' 个新订单');
            } else {
                if (typeof toast==='function') toast('暂时没有新订单');
            }
            renderRiderLayer();
        } finally {
            window._riderRefreshing = false;
            _setRiderRefreshBtn(false);
        }
    };

    function _setRiderRefreshBtn(loading) {
        var btn = document.getElementById('rider-refresh-btn');
        if (!btn) return;
        if (loading) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 刷新中...';
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> 刷新订单池';
        }
    }

    async function generateContactOrder(contact) {
        var aiCtx = (typeof getAiContext === 'function') ? getAiContext(contact) : ('你是' + contact.name);
        var hour = new Date().getHours();
        var mealType = hour < 10 ? '早餐' : hour < 14 ? '午餐' : hour < 18 ? '下午茶' : hour < 22 ? '晚餐' : '夜宵';

        var prefStr = '';
        var prefs = store.foodDelivery && store.foodDelivery.preferences;
        if (prefs && prefs.favorite) prefStr = '。你的喜好：'+prefs.favorite;

        var prompt = aiCtx + '\n\n'
                   + '【场景】现在'+hour+'点,你饿了想点'+mealType+'外卖'+prefStr+'\n'
                   + '【任务】根据你的人设(口味/预算/性格/偏好)，生成你会下的一份外卖订单\n'
                   + '【输出JSON(仅一个对象)】{\n'
                   + '  "shopName":"商家名(虚构或真实连锁都行，符合你人设品味)",\n'
                   + '  "items":[{"name":"菜品","price":数字,"qty":1或2}],\n'
                   + '  "totalPrice":数字,\n'
                   + '  "deliveryNote":"给骑手的备注(符合你性格:挑剔/社恐/热情/随和)",\n'
                   + '  "address":"符合你生活场景的地址(宿舍楼/公司/家),30字内",\n'
                   + '  "tip":0到5之间数字(看你大方程度)\n'
                   + '}\n⚠️ 严格符合人设，不要OOC';

        var resp = await callFDAPI([{role:'system',content:prompt}], {temperature:0.9, max_tokens:400});
        var data = parseJSON(resp);
        if (!data || !data.shopName) {
            data = {
                shopName: '本地小馆',
                items: [{name:'招牌套餐', price:20, qty:1}],
                totalPrice: 20,
                deliveryNote: '',
                address: '宿舍楼下',
                tip: 0
            };
        }
        // [补丁1+2] 距离 + 动态配送费 + 加成标签
        var _dist = (0.3 + Math.random()*3).toFixed(1);
        var _fb = _calcFeeBreakdown(_dist);
        return {
            orderId: 'rord_' + _now() + '_' + contact.id,
            customerId: contact.id,
            customerName: contact.name,
            customerAvatar: contact.avatar || '',
            isContact: true,
            shopName: data.shopName || '未知商家',
            items: data.items || [{name:'套餐',price:20,qty:1}],
            totalPrice: parseFloat(data.totalPrice) || 20,
            deliveryNote: data.deliveryNote || '',
            address: data.address || '',
            tip: Math.max(0, Math.min(10, parseFloat(data.tip)||0)),
            distance: _dist,
            deliveryFee: _fb.fee,         // [补丁1] 动态计算
            bonusTags: _fb.tags,          // [补丁2] 加成标签
            status: 'waiting',
            createTime: _now(),
            urges: [],
            logistics: [],
            review: null
        };
    }

    async function generateAnonymousOrders(count) {
        var prompt = '生成'+count+'个匿名外卖订单（虚构的路人用户），要求：\n'
                   + '1. 每单包含shopName(商家名)、items([{name,price,qty}])、totalPrice、deliveryNote(可空)、address、tip(0或3或5)、customerName(虚构昵称如"小龙虾爱好者")\n'
                   + '2. 订单类型多样：早餐/午餐/晚餐/宵夜/奶茶等\n'
                   + '3. 价格合理(10-60元之间)\n'
                   + '4. 备注风格多样（挑剔/热情/空）\n'
                   + '【输出】一个JSON数组\n';
        var resp = await callFDAPI([{role:'system',content:prompt}], {temperature:1, max_tokens:1000});
        var arr = parseJSON(resp) || [];
        if (!Array.isArray(arr) || arr.length === 0) {
            // fallback
            arr = [
                { shopName:'华莱士', items:[{name:'鸡排堡套餐',price:19.9,qty:1}], totalPrice:19.9, deliveryNote:'少盐', address:'科技园A座', tip:3, customerName:'匿名用户A' },
                { shopName:'蜜雪冰城', items:[{name:'珍珠奶茶',price:7,qty:2}], totalPrice:14, deliveryNote:'冰的', address:'阳光花园3号楼', tip:0, customerName:'匿名用户B' }
            ];
        }
        return arr.map(function(o, i) {
            // [补丁1+2]
            var _dist = (0.3 + Math.random()*4).toFixed(1);
            var _fb = _calcFeeBreakdown(_dist);
            return {
                orderId: 'rord_' + _now() + '_anon_' + i + '_' + Math.random().toString(36).slice(2,5),
                customerId: null,
                customerName: o.customerName || '匿名用户',
                customerAvatar: '',
                isContact: false,
                shopName: o.shopName || '商家',
                items: o.items || [{name:'套餐',price:20,qty:1}],
                totalPrice: parseFloat(o.totalPrice) || 20,
                deliveryNote: o.deliveryNote || '',
                address: o.address || '',
                tip: Math.max(0, Math.min(10, parseFloat(o.tip)||0)),
                distance: _dist,
                deliveryFee: _fb.fee,         // [补丁1]
                bonusTags: _fb.tags,          // [补丁2]
                status: 'waiting',
                createTime: _now(),
                urges: [],
                logistics: [],
                review: null
            };
        });
    }

    // ==================== 接单 ====================
    window.riderAcceptOrder = function(orderId) {
        var p = store.foodDelivery.riderProfile;
        if (p.currentOrder) {
            if (typeof toast==='function') toast('请先完成当前订单');
            return;
        }
        var order = (p.orderPool||[]).find(function(o){ return o.orderId === orderId; });
        if (!order) return;
        order.status = 'accepted';
        order.acceptTime = _now();
        order.currentStep = 0;
        order.logistics = [{ step:-1, label:'已接单', time: _now() }];
        p.currentOrder = order;
        // 从订单池中移除
        p.orderPool = p.orderPool.filter(function(o){ return o.orderId !== orderId; });
        _save();
        if (typeof toast==='function') toast('✅ 接单成功，去取餐吧！');
        currentRiderView = 'current';
        renderRiderLayer();
    };

    // ==================== 当前订单页 ====================
    function renderCurrentOrder() {
        var p = store.foodDelivery.riderProfile;
        var o = p.currentOrder;
        if (!o) {
            return '<div class="rider-empty"><i class="fas fa-check-circle" style="font-size:48px;color:#ddd;"></i><p>当前没有配送中的订单</p></div>';
        }

        var itemsHtml = (o.items||[]).map(function(i) {
            return '<div class="rider-cur-item"><span>'+_esc(i.name)+' ×'+(i.qty||1)+'</span><span>¥'+(i.price||0)+'</span></div>';
        }).join('');

        // 配送进度
        var step = o.currentStep || 0;
        var progress = Math.min(100, (step / (LOGISTICS_STEPS_RIDER.length - 1)) * 100);
        var stepsHtml = LOGISTICS_STEPS_RIDER.map(function(s, idx) {
            var cls = idx < step ? 'done' : (idx === step ? 'active' : '');
            return '<div class="rider-step '+cls+'">'
                 + '<div class="rider-step-dot"></div>'
                 + '<div class="rider-step-label">'+s.label+'</div>'
                 + '</div>';
        }).join('');

        // 催单显示
        var urgesHtml = '';
        if (o.urges && o.urges.length > 0) {
            urgesHtml = '<div class="rider-urges"><div class="rider-urges-title">🔔 用户催单</div>'
                      + o.urges.map(function(u) {
                          var t = new Date(u.time);
                          return '<div class="rider-urge-item">'
                               + '<span>'+_esc(u.text)+'</span>'
                               + '<span class="rider-urge-time">'+t.getHours()+':'+String(t.getMinutes()).padStart(2,'0')+'</span>'
                               + '</div>';
                        }).join('')
                      + '</div>';
        }

        // 操作按钮
        var actionBtn = '';
        if (step < LOGISTICS_STEPS_RIDER.length - 1) {
            var next = LOGISTICS_STEPS_RIDER[step + 1] || LOGISTICS_STEPS_RIDER[LOGISTICS_STEPS_RIDER.length - 1];
            actionBtn = '<button class="rider-cur-action" onclick="riderAdvanceStep()">'
                      + (step === -1 || step === 0 ? '🚴 出发去商家' : '⏭ ' + next.label)
                      + '</button>';
        } else if (o.logistics.length && o.logistics[o.logistics.length-1].step === LOGISTICS_STEPS_RIDER.length - 1) {
            // 已送达，等评价
            actionBtn = '<button class="rider-cur-action rider-cur-action-done" onclick="riderCompleteOrder()">'
                      + '✅ 完成订单'
                      + '</button>';
        }

        // 联系人可以催单提示
        var urgeBtn = '';
        if (o.isContact && step >= 1 && step < 5) {
            urgeBtn = '<button class="rider-urge-btn" onclick="riderTriggerUrge()">🔔 模拟用户催单(测试)</button>';
        }

        var customerAvatar = o.customerAvatar
            ? '<img src="'+o.customerAvatar+'">'
            : '<div class="rider-avatar-ph">'+(o.customerName||'?').charAt(0)+'</div>';

        return '<div class="rider-current">'
             // 订单卡片
             + '<div class="rider-cur-card">'
             + '<div class="rider-cur-shop"><i class="fas fa-store"></i> '+_esc(o.shopName)+'</div>'
             + '<div class="rider-cur-items">'+itemsHtml+'</div>'
             + '<div class="rider-cur-fees">'
             +   '<div>订单金额：¥'+Number(o.totalPrice||0).toFixed(2)+'</div>'
             +   '<div>配送费：¥'+Number(o.deliveryFee||0).toFixed(2)+(o.tip>0?' + 小费¥'+o.tip:'')+'</div>'
             + '</div>'
             + '</div>'
             // 用户信息
             + '<div class="rider-cur-customer">'
             + '<div class="rider-cur-customer-avatar">'+customerAvatar+'</div>'
             + '<div class="rider-cur-customer-info">'
             +   '<div class="rider-cur-customer-name">'+_esc(o.customerName)+(o.isContact?' <span class="rider-contact-tag">🔔</span>':'')+'</div>'
             +   '<div class="rider-cur-customer-addr">📍 '+_esc(o.address||'')+'</div>'
             + '</div>'
             + '<div class="rider-cur-distance">'+(o.distance||'?')+'km</div>'
             + '</div>'
             + (o.deliveryNote ? '<div class="rider-cur-note">📝 '+_esc(o.deliveryNote)+'</div>' : '')
             // 配送进度条
             + '<div class="rider-section-title">📍 配送进度</div>'
             + '<div class="rider-progress">'
             +   '<div class="rider-progress-bar"><div class="rider-progress-fill" style="width:'+progress+'%;"></div></div>'
             +   '<div class="rider-steps">'+stepsHtml+'</div>'
             + '</div>'
             + urgesHtml
             + '<div class="rider-cur-actions">' + actionBtn + urgeBtn + '</div>'
             // 评价（如果有）
             + (o.review ? renderOrderReview(o.review) : '')
             + '</div>';
    }

    function renderOrderReview(review) {
        var stars = '';
        for (var i = 1; i <= 5; i++) {
            stars += '<i class="fas fa-star" style="color:'+(i<=review.rating?'#faad14':'#e5e5e5')+';"></i>';
        }
        var tagsHtml = (review.tags||[]).map(function(t) {
            return '<span class="rider-review-tag">'+_esc(t)+'</span>';
        }).join('');
        return '<div class="rider-review-box">'
             + '<div class="rider-section-title">⭐ 用户评价</div>'
             + '<div class="rider-review-card">'
             +   '<div class="rider-review-stars">'+stars+'</div>'
             +   (tagsHtml ? '<div class="rider-review-tags">'+tagsHtml+'</div>' : '')
             +   '<div class="rider-review-comment">'+_esc(review.comment||'')+'</div>'
             + '</div>'
             + '</div>';
    }

    // ==================== 推进配送步骤（Stage 5） ====================
    window.riderAdvanceStep = async function() {
        var p = store.foodDelivery.riderProfile;
        var o = p.currentOrder;
        if (!o) return;
        var nextStep = (o.currentStep || 0) + 1;
        // 边界检查
        if (nextStep >= LOGISTICS_STEPS_RIDER.length) return;

        var stepInfo = LOGISTICS_STEPS_RIDER[nextStep];
        o.currentStep = nextStep;
        o.logistics.push({ step: nextStep, label: stepInfo.label, time: _now() });

        // 到达"已送达"时，触发评价生成（Stage 5）
        if (nextStep === LOGISTICS_STEPS_RIDER.length - 1) {
            _save();
            renderRiderLayer();
            if (typeof toast==='function') toast('📦 送达，正在生成评价...');
            await generateReview(o);
            return;
        }

        // 配送中(step=3)有概率触发用户催单（仅联系人）
        if (o.isContact && nextStep === 3 && Math.random() < 0.45) {
            _save();
            renderRiderLayer();
            generateContactUrge(o); // 异步，不阻塞
            return;
        }

        _save();
        renderRiderLayer();
    };

    window.riderTriggerUrge = async function() {
        var p = store.foodDelivery.riderProfile;
        var o = p.currentOrder;
        if (!o || !o.isContact) return;
        generateContactUrge(o);
    };

    async function generateContactUrge(order) {
        var contact = (store.contacts||[]).find(function(c){ return c.id === order.customerId; });
        if (!contact) return;
        var elapsed = Math.floor((_now() - order.acceptTime) / 60000);

        // [补丁4] 30% 概率是"加小费快点"特殊催单
        var isTipUrge = Math.random() < 0.3 && elapsed >= 15;

        var aiCtx = (typeof getAiContext === 'function') ? getAiContext(contact) : ('你是' + contact.name);
        var prompt;
        if (isTipUrge) {
            prompt = aiCtx + '\n\n'
                   + '【场景】你'+elapsed+'分钟前点的外卖还没到，你决定加小费让骑手快点\n'
                   + '【任务】根据你的人设（大方/焦急/着急吃），发一条带加小费的催单：\n'
                   + '⚠️ 10-35字，必须提到"加X元小费快点"，符合你口吻，只输出文本';
        } else {
            prompt = aiCtx + '\n\n'
                   + '【场景】你'+elapsed+'分钟前点的外卖(「'+order.shopName+'」-「'+order.items[0].name+'」)还没送到\n'
                   + '骑手是你的朋友/熟人'+(store.user.name||'')+'\n'
                   + '【任务】根据你的人设，发一条催单消息：\n'
                   + '  - 急性子直接催 / 佛系默默问 / 社恐客气 / 撒娇抱怨肚子饿\n'
                   + '⚠️ 10-40字，符合你真实口吻，只输出一句话';
        }

        var resp = await callFDAPI([{role:'system',content:prompt}], {temperature:0.9, max_tokens:150});
        var msg = (resp || '还要多久呀？').trim().replace(/^[""「『]|[""」』]$/g,'');
        if (!msg) msg = '还要多久呀？';

        order.urges = order.urges || [];
        var urgeEntry = { text: msg, time: _now() };
        if (isTipUrge) {
            // 从文本中提取金额，如 3-10 元
            var mTip = msg.match(/加\s*(\d+)\s*[块元]/) || msg.match(/(\d+)\s*[块元]/);
            var tipBonus = mTip ? Math.min(15, Math.max(2, parseInt(mTip[1])||5)) : (3 + Math.floor(Math.random()*5));
            urgeEntry.type = 'tip';
            urgeEntry.bonus = tipBonus;
            order.tip = (order.tip || 0) + tipBonus;  // 实际追加到订单小费
        }
        order.urges.push(urgeEntry);
        _save();
        renderRiderLayer();
        if (typeof toast==='function') {
            if (isTipUrge) toast('💰 ' + contact.name + ' 加了 ¥' + urgeEntry.bonus + ' 小费催单');
            else toast(' ' + contact.name + ' 发来催单');
        }
    }

    // ==================== 生成评价（Stage 5） ====================
    async function generateReview(order) {
        var review;
        if (order.isContact) {
            var contact = (store.contacts||[]).find(function(c){ return c.id === order.customerId; });
            if (contact) {
                var totalMin = Math.floor((_now() - order.createTime) / 60000);
                var aiCtx = (typeof getAiContext === 'function') ? getAiContext(contact) : ('你是' + contact.name);
                var prompt = aiCtx + '\n\n'
                           + '【场景】你点的外卖「'+order.shopName+'-'+order.items[0].name+'」刚送到\n'
                           + '总共用了'+totalMin+'分钟，骑手是你的朋友/熟人'+(store.user.name||'')+'\n'
                           + '【任务】根据你的人设，给这次送餐写个评价\n'
                           + '【输出JSON】{\n'
                           + '  "rating":1-5,\n'
                           + '  "tags":["送餐快","态度好","包装完好","准时达","贴心骑手","包装破损","态度差","超时"中选2-4个],\n'
                           + '  "comment":"20字内评语，你自己的口吻"\n'
                           + '}';
                var resp = await callFDAPI([{role:'system',content:prompt}], {temperature:0.9, max_tokens:300});
                review = parseJSON(resp);
            }
        }
        if (!review || typeof review.rating !== 'number') {
            // 匿名订单或 AI 失败：用启发式
            var rating = 4 + (Math.random() > 0.7 ? 1 : 0);
            if (Math.random() < 0.1) rating = 3;
            review = {
                rating: rating,
                tags: ['送餐快','态度好'],
                comment: rating >= 4 ? '很快就到了，谢谢骑手~' : '还行吧，下次加油'
            };
        }
        review.rating = Math.max(1, Math.min(5, parseInt(review.rating)||5));
        review.time = _now();
        order.review = review;
        _save();
        renderRiderLayer();
    }

    // ==================== 完成订单（结算收入） ====================
    window.riderCompleteOrder = function() {
        var p = store.foodDelivery.riderProfile;
        var o = p.currentOrder;
        if (!o) return;
        // 结算
        var income = (o.deliveryFee || 0) + (o.tip || 0);
        p.todayIncome = (p.todayIncome || 0) + income;
        p.todayOrders = (p.todayOrders || 0) + 1;
        p.totalIncome = (p.totalIncome || 0) + income;
        p.totalOrders = (p.totalOrders || 0) + 1;
        if (o.review) {
            if (o.review.rating >= 4) p.goodReviews = (p.goodReviews||0) + 1;
            else p.badReviews = (p.badReviews||0) + 1;
            p.reviews = p.reviews || [];
            p.reviews.unshift({
                orderId: o.orderId,
                customerId: o.customerId,      // [补丁5] 保留给申诉用
                customerName: o.customerName,
                customerAvatar: o.customerAvatar,
                shopName: o.shopName,
                isContact: o.isContact,        // [补丁5]
                rating: o.review.rating,
                tags: o.review.tags,
                comment: o.review.comment,
                time: o.review.time || _now(),
                appealed: false                 // [补丁5] 申诉状态
            });
            if (p.reviews.length > 100) p.reviews = p.reviews.slice(0, 100);
        }
        o.status = 'completed';
        o.completeTime = _now();
        o.income = income;
        p.history = p.history || [];
        p.history.unshift(o);
        if (p.history.length > 50) p.history = p.history.slice(0, 50);
        p.currentOrder = null;
        _save();
        if (typeof toast==='function') toast('💰 已完成，收入 +¥' + income.toFixed(1));

        // [补丁6] 里程碑鼓励（今日10/20单 · 累计100/500/1000单）
        setTimeout(function() {
            var milestones = [];
            if (p.todayOrders === 5)  milestones.push('🎯 今日已完成 5 单，状态不错！');
            if (p.todayOrders === 10) milestones.push('🔥 今日 10 单达成，你是战神！');
            if (p.todayOrders === 20) milestones.push('👑 今日 20 单！今晚加鸡腿！');
            if (p.totalOrders === 100)  milestones.push('🏆 累计 100 单！新手骑手 → 铜牌骑手');
            if (p.totalOrders === 500)  milestones.push('🏆 累计 500 单！铜牌 → 银牌骑手');
            if (p.totalOrders === 1000) milestones.push('🏆 累计 1000 单！银牌 → 金牌骑手');
            milestones.forEach(function(m, i) {
                setTimeout(function(){ if(typeof toast==='function') toast(m); }, (i+1) * 700);
            });
        }, 600);

        currentRiderView = 'dashboard';
        renderRiderLayer();
    };

    // [补丁5] 差评申诉
    window.riderAppealReview = function(reviewIdx) {
        var p = store.foodDelivery.riderProfile;
        var r = (p.reviews||[])[reviewIdx];
        if (!r) return;
        if (r.appealed) { if (typeof toast==='function') toast('该评价已申诉过'); return; }
        if (r.rating >= 4) { if (typeof toast==='function') toast('只有低于 4 星的评价可申诉'); return; }

        var reason = prompt('请填写申诉理由（例如：买家恶意差评 / 商家出餐慢非骑手责任 / 天气原因超时 等）：');
        if (!reason || !reason.trim()) return;

        r.appealed = true;
        r.appealReason = reason.trim();

        // 本地 50% 判定 + 理由长度/关键词加权
        var approveProb = 0.5;
        if (/天气|暴雨|大雪|台风/.test(reason)) approveProb += 0.15;
        if (/商家|出餐|等太久/.test(reason)) approveProb += 0.15;
        if (/恶意|故意|索赔/.test(reason))    approveProb += 0.1;
        if (reason.length < 8) approveProb -= 0.2;
        approveProb = Math.max(0.1, Math.min(0.9, approveProb));

        var approved = Math.random() < approveProb;

        setTimeout(function() {
            if (approved) {
                r.appealResult = 'approved';
                // 恢复：减掉的差评 + 1 好评 - 1 差评
                p.badReviews  = Math.max(0, (p.badReviews||0) - 1);
                p.goodReviews = (p.goodReviews||0) + 1;
                r.rating = 5;
                r.comment = '[已申诉成功·原差评撤销] ' + r.comment;
                if (typeof toast==='function') toast('✅ 申诉成功！差评已撤销，信用已恢复');
            } else {
                r.appealResult = 'rejected';
                if (typeof toast==='function') toast('❌ 申诉未通过，请继续加油');
            }
            _save();
            renderRiderLayer();
        }, 1500);

        _save();
        renderRiderLayer();
        if (typeof toast==='function') toast('📨 申诉已提交，平台审核中...');
    };

    // ==================== 订单历史 ====================
    function renderRiderHistory() {
        var p = store.foodDelivery.riderProfile;
        var history = p.history || [];
        if (history.length === 0) {
            return '<div class="rider-empty"><i class="fas fa-history" style="font-size:48px;color:#ddd;"></i><p>暂无订单历史</p></div>';
        }
        return '<div class="rider-history">' + history.map(function(o) {
            var items = (o.items||[]).map(function(i){ return i.name; }).join('、');
            var d = new Date(o.completeTime || o.createTime);
            var timeStr = (d.getMonth()+1)+'/'+d.getDate()+' '+d.getHours()+':'+String(d.getMinutes()).padStart(2,'0');
            var reviewStr = '';
            if (o.review) {
                var stars = '';
                for (var i = 1; i <= 5; i++) stars += (i<=o.review.rating ? '⭐' : '☆');
                reviewStr = '<div class="rider-hist-review">'+stars+' '+_esc(o.review.comment||'')+'</div>';
            }
            return '<div class="rider-hist-card">'
                 + '<div class="rider-hist-head">'
                 +   '<span class="rider-hist-shop">'+_esc(o.shopName)+'</span>'
                 +   '<span class="rider-hist-time">'+timeStr+'</span>'
                 + '</div>'
                 + '<div class="rider-hist-items">'+_esc(items)+'</div>'
                 + '<div class="rider-hist-row">'
                 +   '<span>→ '+_esc(o.customerName)+(o.isContact?' 🔔':'')+'</span>'
                 +   '<span class="rider-hist-income">+¥'+Number(o.income||0).toFixed(1)+'</span>'
                 + '</div>'
                 + reviewStr
                 + '</div>';
        }).join('') + '</div>';
    }

    // ==================== 收入统计 ====================
    function renderRiderIncome() {
        var p = store.foodDelivery.riderProfile;
        var avgIncome = p.totalOrders > 0 ? (p.totalIncome / p.totalOrders) : 0;
        var goodRate = (p.goodReviews + p.badReviews) > 0
            ? Math.round(p.goodReviews / (p.goodReviews + p.badReviews) * 100)
            : 100;

        return '<div class="rider-income-page">'
             + '<div class="rider-income-hero">'
             +   '<div class="rider-income-label">累计收入</div>'
             +   '<div class="rider-income-big">¥'+(p.totalIncome||0).toFixed(2)+'</div>'
             +   '<div class="rider-income-sub">'+(p.totalOrders||0)+' 单 · 均单 ¥'+avgIncome.toFixed(1)+'</div>'
             + '</div>'
             + '<div class="rider-income-grid">'
             +   '<div class="rider-income-cell"><div class="rider-income-cell-v">¥'+(p.todayIncome||0).toFixed(1)+'</div><div class="rider-income-cell-l">今日收入</div></div>'
             +   '<div class="rider-income-cell"><div class="rider-income-cell-v">'+(p.todayOrders||0)+'</div><div class="rider-income-cell-l">今日单数</div></div>'
             +   '<div class="rider-income-cell"><div class="rider-income-cell-v">'+goodRate+'%</div><div class="rider-income-cell-l">好评率</div></div>'
             +   '<div class="rider-income-cell"><div class="rider-income-cell-v">'+(p.goodReviews||0)+'</div><div class="rider-income-cell-l">好评数</div></div>'
             + '</div>'
             + '<div class="rider-section-title">⭐ 最近评价</div>'
             + ((p.reviews||[]).length === 0
                 ? '<div class="rider-empty" style="padding:30px;"><p style="color:#999;">还没有评价</p></div>'
                 : '<div class="rider-review-list">' + p.reviews.slice(0, 10).map(function(r, idx) {
                     var stars = '';
                     for (var i = 1; i <= 5; i++) stars += '<i class="fas fa-star" style="color:'+(i<=r.rating?'#faad14':'#e5e5e5')+';"></i>';
                     // [补丁5] 低分评价显示申诉按钮
                     var appealHtml = '';
                     if (r.rating <= 3 && !r.appealed) {
                         appealHtml = '<button class="rider-appeal-btn" onclick="riderAppealReview('+idx+')"><i class="fas fa-shield-alt"></i> 申诉</button>';
                     } else if (r.appealed) {
                         if (r.appealResult === 'approved') appealHtml = '<span class="rider-appeal-tag approved">✓ 申诉成功</span>';
                         else if (r.appealResult === 'rejected') appealHtml = '<span class="rider-appeal-tag rejected">✗ 申诉未通过</span>';
                         else appealHtml = '<span class="rider-appeal-tag pending">⏳ 审核中</span>';
                     }
                     return '<div class="rider-review-item">'
                          + '<div class="rider-review-item-head">'
                          +   '<span class="rider-review-item-name">'+_esc(r.customerName)+'</span>'
                          +   '<span class="rider-review-item-stars">'+stars+'</span>'
                          + '</div>'
                          + (r.tags && r.tags.length ? '<div class="rider-review-tags">'+r.tags.map(function(t){return '<span class="rider-review-tag">'+_esc(t)+'</span>';}).join('')+'</div>' : '')
                          + '<div class="rider-review-item-comment">'+_esc(r.comment||'')+'</div>'
                          + (appealHtml ? '<div class="rider-review-item-foot">'+appealHtml+'</div>' : '')
                          + '</div>';
                   }).join('') + '</div>'
               )
             + '</div>';
    }

    // ==================== 骑手设置 ====================
    function renderRiderSettings() {
        var p = store.foodDelivery.riderProfile;
        var vehicleOptions = Object.keys(VEHICLE_META).map(function(k){
            var v = VEHICLE_META[k];
            return '<option value="'+k+'" '+(k===p.vehicle?'selected':'')+'>'+v.icon+' '+v.label+'</option>';
        }).join('');
        var areaOptions = AREA_OPTIONS.map(function(a){
            return '<option value="'+a+'" '+(a===p.area?'selected':'')+'>'+a+'</option>';
        }).join('');

        return '<div class="rider-settings">'
             + '<div class="rider-form-row"><label>骑手昵称</label>'
             +   '<input id="rider-s-name" type="text" maxlength="20" value="'+_esc(p.name)+'">'
             + '</div>'
             + '<div class="rider-form-row"><label>交通工具</label>'
             +   '<select id="rider-s-vehicle">'+vehicleOptions+'</select>'
             + '</div>'
             + '<div class="rider-form-row"><label>配送区域</label>'
             +   '<select id="rider-s-area">'+areaOptions+'</select>'
             + '</div>'
             + '<button class="rider-btn-primary" onclick="riderSaveSettings()">💾 保存设置</button>'
             + '</div>';
    }

    window.riderSaveSettings = function() {
        var p = store.foodDelivery.riderProfile;
        var g = function(id) { var el = document.getElementById(id); return el ? el.value : ''; };
        p.name = (g('rider-s-name')||'').trim() || p.name || '骑手';
        p.vehicle = g('rider-s-vehicle') || p.vehicle;
        p.area = g('rider-s-area') || p.area;
        _save();
        if (typeof toast==='function') toast('✅ 设置已保存');
        currentRiderView = 'dashboard';
        renderRiderLayer();
    };

    // ==================== 启动 ====================
    if (typeof store !== 'undefined') {
        initRider();
    } else {
        var _riderAttempt = 0;
        var c = setInterval(function() {
            _riderAttempt++;
            if (typeof store !== 'undefined') {
                clearInterval(c);
                initRider();
            } else if (_riderAttempt > 50) {
                clearInterval(c);
                console.warn('[Rider] store 未就绪，放弃初始化');
            }
        }, 200);
    }

})();
