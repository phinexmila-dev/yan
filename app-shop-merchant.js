// ============================================================
// ========== SHOP MERCHANT MODULE (商家系统) ==========
// Stage 1: 开店注册 + 店铺装修 + 商品上架（全新/二手）
// 所有商家相关功能挂在 store.myStore 下
// ============================================================
(function(){
    'use strict';

    // ==================== 常量 ====================
    var MERCHANT_CATEGORIES = ['综合','衣服','美妆','食品','鞋包','数码','家居','其他'];
    var PRODUCT_CONDITIONS = [
        { value: 'new',        label: '🏷️ 全新（吊牌未拆）', color: '#52c41a' },
        { value: 'like_new',   label: '💎 几乎全新',          color: '#1890ff' },
        { value: 'used_good',  label: '👍 轻微使用痕迹',       color: '#faad14' },
        { value: 'used_fair',  label: '⚠️ 有明显使用痕迹',      color: '#fa8c16' }
    ];
    var PRODUCT_TAGS = ['包邮','限时折扣','支持退换','正品保证','自用闲置','议价空间','7天无理由'];

    // 商家页面当前视图状态
    var merchantView = 'dashboard'; // dashboard | decorate | products | edit_product | messages
    var merchantEditingProductId = null;
    var merchantProductImagesBuffer = []; // 临时存放上架中的图片

    // ==================== 数据初始化 ====================
    function initMyStore() {
        if (!store.myStore) {
            store.myStore = {
                isOpen: false,
                name: '',
                avatar: '',
                banner: '',
                announcement: '欢迎光临~',
                category: '综合',
                credit: 100,
                totalSales: 0,
                totalRevenue: 0,
                followers: [],
                products: [],      // 商家自己上架的商品
                messages: [],      // 店铺消息（Stage 2 使用）
                createdAt: 0
            };
        }
        // 兼容字段补全
        var s = store.myStore;
        if (!s.products) s.products = [];
        if (!s.messages) s.messages = [];
        if (!s.followers) s.followers = [];
        if (s.credit === undefined) s.credit = 100;
        if (s.totalSales === undefined) s.totalSales = 0;
        if (s.totalRevenue === undefined) s.totalRevenue = 0;
    }

    function _save() { if (typeof save === 'function') save(); }
    function _esc(s) { return (typeof escapeHtml === 'function') ? escapeHtml(s||'') : String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // ==================== 入口：从购物App "我的" 进入 ====================
    window.shopOpenMerchant = function() {
        initMyStore();
        merchantView = store.myStore.isOpen ? 'dashboard' : 'register';
        renderMerchantLayer();
    };

    function renderMerchantLayer() {
        var layer = document.getElementById('layer-shop-merchant');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'layer-shop-merchant';
            layer.className = 'layer';
            layer.style.cssText = 'background:#f5f5f7;';
            document.body.appendChild(layer);
        }
        layer.innerHTML = getMerchantHTML();
        layer.classList.add('show');
    }

    window.shopCloseMerchant = function() {
        var layer = document.getElementById('layer-shop-merchant');
        if (layer) layer.classList.remove('show');
    };

    // ==================== 顶层布局 ====================
    function getMerchantHTML() {
        var s = store.myStore;
        if (!s.isOpen || merchantView === 'register') return getRegisterHTML();

        var titles = {
            dashboard: '我的店铺',
            decorate: '店铺装修',
            products: '商品管理',
            edit_product: merchantEditingProductId ? '编辑商品' : '上架新商品',
            messages: '店铺消息',
            orders: '订单管理'
        };
        var backAction = (merchantView === 'dashboard') ? 'shopCloseMerchant()' : 'merchantBack()';

        var body = '';
        switch (merchantView) {
            case 'dashboard':    body = renderDashboard();    break;
            case 'decorate':     body = renderDecorate();     break;
            case 'products':     body = renderProductsList(); break;
            case 'edit_product': body = renderProductEditor();break;
            case 'messages':     body = renderMessagesList(); break;
            case 'orders':       body = renderMerchantOrders(); break;
            default:             body = renderDashboard();
        }

        return '<div class="merchant-nav"><div class="merchant-nav-back" onclick="' + backAction + '"><i class="fas fa-chevron-left"></i></div>'
             + '<div class="merchant-nav-title">' + (titles[merchantView]||'') + '</div>'
             + '<div class="merchant-nav-right"></div></div>'
             + '<div class="merchant-body">' + body + '</div>';
    }

    window.merchantBack = function() {
        if (merchantView === 'edit_product') { merchantView = 'products'; merchantEditingProductId = null; merchantProductImagesBuffer = []; }
        else if (merchantView === 'decorate' || merchantView === 'products' || merchantView === 'messages' || merchantView === 'orders') merchantView = 'dashboard';
        else merchantView = 'dashboard';
        renderMerchantLayer();
    };

    // ==================== 注册开店页面 ====================
    function getRegisterHTML() {
        return '<div class="merchant-nav"><div class="merchant-nav-back" onclick="shopCloseMerchant()"><i class="fas fa-chevron-left"></i></div>'
             + '<div class="merchant-nav-title">申请开店</div><div class="merchant-nav-right"></div></div>'
             + '<div class="merchant-body merchant-register">'
             + '<div class="merchant-register-hero">'
             + '<div class="merchant-hero-icon">🏪</div>'
             + '<div class="merchant-hero-title">开启你的小店</div>'
             + '<div class="merchant-hero-desc">在YAN商城一键开店，上架你的闲置或全新商品<br>联系人会按照各自的人设来你店里逛逛/咨询/下单哦</div>'
             + '</div>'
             + '<div class="merchant-form">'
             + '<div class="merchant-form-row"><label>店铺名称</label><input id="merchant-reg-name" type="text" maxlength="20" placeholder="取一个有辨识度的店名"></div>'
             + '<div class="merchant-form-row"><label>主营类目</label><select id="merchant-reg-category">'
             + MERCHANT_CATEGORIES.map(function(c){ return '<option value="'+c+'">'+c+'</option>'; }).join('')
             + '</select></div>'
             + '<div class="merchant-form-row"><label>店铺简介</label><textarea id="merchant-reg-desc" rows="3" maxlength="60" placeholder="一句话介绍你的店铺风格"></textarea></div>'
             + '<button class="merchant-btn-primary" onclick="merchantSubmitRegister()">🚀 立即开店</button>'
             + '</div>'
             + '<div class="merchant-tip">开店后可以在「我的店铺」中装修、上架商品、处理顾客消息</div>'
             + '</div>';
    }

    window.merchantSubmitRegister = function() {
        var name = (document.getElementById('merchant-reg-name')||{}).value;
        var cat  = (document.getElementById('merchant-reg-category')||{}).value;
        var desc = (document.getElementById('merchant-reg-desc')||{}).value;
        name = (name||'').trim();
        if (!name) { if (typeof toast==='function') toast('请填写店铺名称'); return; }
        initMyStore();
        var s = store.myStore;
        s.isOpen = true;
        s.name = name;
        s.category = cat || '综合';
        s.announcement = (desc||'').trim() || '欢迎光临~';
        s.createdAt = Date.now();
        _save();
        if (typeof toast==='function') toast('✅ 店铺开通成功！');
        merchantView = 'dashboard';
        renderMerchantLayer();
    };

    // ==================== 仪表盘 ====================
    // [补丁4] 计算经营数据
    function _calcMerchantStats() {
        var s = store.myStore || {};
        var now = Date.now();
        var weekAgo = now - 7*24*60*60*1000;
        var msgs = s.messages || [];
        // 本周新增订单（任何 msg.action === 'buy' 且 createdAt 在 7 天内 或 order 里记录的）
        var weekOrders = 0;
        msgs.forEach(function(m){
            if ((m.action === 'buy' || m.orderId) && m.createdAt && m.createdAt >= weekAgo) weekOrders++;
        });
        // 待处理消息数（pending 状态）
        var pending = msgs.filter(function(m){ return m.status === 'pending'; }).length;
        // 好评率（基于所有商品的 reviews 或 msg.review）
        var totalReviews = 0, goodReviews = 0;
        (s.products||[]).forEach(function(p){
            (p.reviews||[]).forEach(function(r){
                totalReviews++;
                if ((r.rating||0) >= 4) goodReviews++;
            });
        });
        msgs.forEach(function(m){
            if (m.review && m.review.rating) {
                totalReviews++;
                if (m.review.rating >= 4) goodReviews++;
            }
        });
        var goodRate = totalReviews > 0 ? Math.round(goodReviews / totalReviews * 100) : 100;
        return { weekOrders: weekOrders, pending: pending, goodRate: goodRate, totalReviews: totalReviews };
    }

    function renderDashboard() {
        var s = store.myStore;
        var productCount = (s.products||[]).length;
        var onSaleCount = (s.products||[]).filter(function(p){ return p.status === 'active'; }).length;
        var unreadMsg = (s.messages||[]).filter(function(m){ return m.status === 'pending' && !m.read; }).length;
        var bizStats = _calcMerchantStats();

        var avatarHtml = s.avatar
            ? '<img src="'+s.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
            : '<i class="fas fa-store" style="font-size:28px;color:#ff4500;"></i>';

        var bannerStyle = s.banner
            ? 'background:url('+s.banner+') center/cover;'
            : 'background:linear-gradient(135deg,#ff4500,#ff6b35);';

        return '<div class="merchant-dashboard">'
             + '<div class="merchant-store-card">'
             + '<div class="merchant-store-banner" style="'+bannerStyle+'"></div>'
             + '<div class="merchant-store-info">'
             + '<div class="merchant-store-avatar" onclick="merchantEditAvatar()">'+avatarHtml+'</div>'
             + '<div class="merchant-store-meta">'
             + '<div class="merchant-store-name">'+_esc(s.name)+'</div>'
             + '<div class="merchant-store-sub">'+_esc(s.category)+' · 信用'+s.credit+'分</div>'
             + '<div class="merchant-store-announce">📢 '+_esc(s.announcement)+'</div>'
             + '</div></div></div>'
             // 核心数据
             + '<div class="merchant-stats">'
             + '<div class="merchant-stat"><div class="merchant-stat-v">'+s.totalSales+'</div><div class="merchant-stat-l">累计销量</div></div>'
             + '<div class="merchant-stat"><div class="merchant-stat-v">¥'+(s.totalRevenue||0).toFixed(0)+'</div><div class="merchant-stat-l">累计收入</div></div>'
             + '<div class="merchant-stat"><div class="merchant-stat-v">'+onSaleCount+'</div><div class="merchant-stat-l">在售商品</div></div>'
             + '<div class="merchant-stat"><div class="merchant-stat-v">'+(s.followers||[]).length+'</div><div class="merchant-stat-l">关注数</div></div>'
             + '</div>'
             // [补丁4] 本周经营数据
             + '<div class="merchant-stats merchant-stats-biz">'
             + '<div class="merchant-stat"><div class="merchant-stat-v" style="color:#07c160;">'+bizStats.weekOrders+'</div><div class="merchant-stat-l">本周订单</div></div>'
             + '<div class="merchant-stat"><div class="merchant-stat-v" style="color:#ff9500;">'+bizStats.goodRate+'%</div><div class="merchant-stat-l">好评率</div></div>'
             + '<div class="merchant-stat"><div class="merchant-stat-v" style="color:#fa5151;">'+bizStats.pending+'</div><div class="merchant-stat-l">待处理</div></div>'
             + '</div>'
             // 功能入口
             + '<div class="merchant-section-title">经营管理</div>'
             + '<div class="merchant-menu">'
             + '<div class="merchant-menu-item" onclick="merchantGoto(\'orders\')">'
             +   '<i class="fas fa-clipboard-list" style="color:#1890ff;"></i>'
             +   '<span>订单管理</span>'
             +   (_getMerchantPendingOrders() > 0 ? '<em class="merchant-badge">'+_getMerchantPendingOrders()+'</em>' : '')
             +   '<i class="fas fa-chevron-right merchant-chevron"></i>'
             + '</div>'
             + '<div class="merchant-menu-item" onclick="merchantGoto(\'messages\')">'
             +   '<i class="fas fa-comment-dots" style="color:#fa5151;"></i>'
             +   '<span>店铺消息</span>'
             +   (unreadMsg>0 ? '<em class="merchant-badge">'+unreadMsg+'</em>' : '')
             +   '<i class="fas fa-chevron-right merchant-chevron"></i>'
             + '</div>'
             + '<div class="merchant-menu-item" onclick="merchantGoto(\'products\')">'
             +   '<i class="fas fa-box-open" style="color:#ff4500;"></i>'
             +   '<span>商品管理</span>'
             +   '<span class="merchant-menu-hint">'+productCount+' 件商品</span>'
             +   '<i class="fas fa-chevron-right merchant-chevron"></i>'
             + '</div>'
             + '<div class="merchant-menu-item" onclick="merchantAddProduct()">'
             +   '<i class="fas fa-plus-circle" style="color:#07c160;"></i>'
             +   '<span>上架新商品</span>'
             +   '<i class="fas fa-chevron-right merchant-chevron"></i>'
             + '</div>'
             + '<div class="merchant-menu-item" onclick="merchantGoto(\'decorate\')">'
             +   '<i class="fas fa-palette" style="color:#9b59b6;"></i>'
             +   '<span>店铺装修</span>'
             +   '<i class="fas fa-chevron-right merchant-chevron"></i>'
             + '</div>'
             + '<div class="merchant-menu-item" onclick="merchantCloseStore()">'
             +   '<i class="fas fa-power-off" style="color:#999;"></i>'
             +   '<span>关闭店铺</span>'
             +   '<i class="fas fa-chevron-right merchant-chevron"></i>'
             + '</div>'
             + '</div>'
             + '</div>';
    }

    window.merchantGoto = function(view) {
        merchantView = view;
        merchantEditingProductId = null;
        merchantProductImagesBuffer = [];
        renderMerchantLayer();
    };

    window.merchantCloseStore = function() {
        if (typeof showConfirm === 'function') {
            showConfirm('关闭店铺', '关闭店铺后，你上架的商品将暂时下架。是否继续？', function() {
                store.myStore.isOpen = false;
                _save();
                if (typeof toast==='function') toast('店铺已关闭');
                shopCloseMerchant();
            });
        } else {
            if (confirm('确认关闭店铺？')) {
                store.myStore.isOpen = false;
                _save();
                shopCloseMerchant();
            }
        }
    };

    // ==================== 店铺装修 ====================
    function renderDecorate() {
        var s = store.myStore;
        var avatarHtml = s.avatar
            ? '<img src="'+s.avatar+'" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">'
            : '<i class="fas fa-image" style="font-size:24px;color:#ccc;"></i>';
        var bannerHtml = s.banner
            ? '<img src="'+s.banner+'" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">'
            : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#ccc;"><i class="fas fa-image" style="font-size:32px;"></i></div>';

        return '<div class="merchant-decorate">'
             + '<div class="merchant-form-row"><label>店铺头像</label>'
             +   '<div class="merchant-avatar-upload" onclick="merchantEditAvatar()">'+avatarHtml+'</div>'
             + '</div>'
             + '<div class="merchant-form-row"><label>店铺Banner</label>'
             +   '<div class="merchant-banner-upload" onclick="merchantEditBanner()">'+bannerHtml+'</div>'
             + '</div>'
             + '<div class="merchant-form-row"><label>店铺名称</label>'
             +   '<input id="merchant-dec-name" type="text" maxlength="20" value="'+_esc(s.name)+'">'
             + '</div>'
             + '<div class="merchant-form-row"><label>主营类目</label><select id="merchant-dec-category">'
             +   MERCHANT_CATEGORIES.map(function(c){ return '<option value="'+c+'" '+(c===s.category?'selected':'')+'>'+c+'</option>'; }).join('')
             + '</select></div>'
             + '<div class="merchant-form-row"><label>店铺公告</label>'
             +   '<textarea id="merchant-dec-announce" rows="3" maxlength="100">'+_esc(s.announcement)+'</textarea>'
             + '</div>'
             + '<button class="merchant-btn-primary" onclick="merchantSaveDecorate()">💾 保存装修</button>'
             + '</div>';
    }

    window.merchantSaveDecorate = function() {
        var s = store.myStore;
        var name = ((document.getElementById('merchant-dec-name')||{}).value||'').trim();
        var cat  = (document.getElementById('merchant-dec-category')||{}).value;
        var ann  = ((document.getElementById('merchant-dec-announce')||{}).value||'').trim();
        if (!name) { if (typeof toast==='function') toast('店铺名称不能为空'); return; }
        s.name = name;
        s.category = cat || '综合';
        s.announcement = ann || '欢迎光临~';
        _save();
        if (typeof toast==='function') toast('✅ 装修已保存');
        merchantView = 'dashboard';
        renderMerchantLayer();
    };

    window.merchantEditAvatar = function() {
        if (typeof openImgUploadModal === 'function') {
            openImgUploadModal('上传店铺头像', function(url) {
                store.myStore.avatar = url;
                _save();
                renderMerchantLayer();
            });
        } else {
            var url = prompt('请输入图片URL');
            if (url) { store.myStore.avatar = url; _save(); renderMerchantLayer(); }
        }
    };

    window.merchantEditBanner = function() {
        if (typeof openImgUploadModal === 'function') {
            openImgUploadModal('上传店铺Banner', function(url) {
                store.myStore.banner = url;
                _save();
                renderMerchantLayer();
            });
        } else {
            var url = prompt('请输入Banner URL');
            if (url) { store.myStore.banner = url; _save(); renderMerchantLayer(); }
        }
    };

    // ==================== 商品管理列表 ====================
    function renderProductsList() {
        var products = store.myStore.products || [];
        var listHtml = '';
        if (products.length === 0) {
            listHtml = '<div class="merchant-empty"><i class="fas fa-box-open" style="font-size:48px;color:#ddd;"></i><p>还没有商品，去上架一件吧</p></div>';
        } else {
            listHtml = products.map(function(p) { return renderProductCard(p); }).join('');
        }
        return '<div class="merchant-products">'
             + '<button class="merchant-btn-primary merchant-btn-fab" onclick="merchantAddProduct()"><i class="fas fa-plus"></i> 上架新商品</button>'
             + '<div class="merchant-product-list">' + listHtml + '</div>'
             + '</div>';
    }

    // [补丁2] 计算折扣百分比（二手且有原价时显示）
    function _calcDiscount(p) {
        var price = Number(p.price||0), orig = Number(p.originalPrice||0);
        if (p.condition === 'new') return 0;
        if (!orig || orig <= price) return 0;
        return Math.round((1 - price/orig) * 100);
    }

    function renderProductCard(p) {
        var img = (p.images && p.images[0]) || '';
        var imgHtml = img
            ? '<img src="'+img+'">'
            : '<div class="merchant-product-noimg"><i class="fas fa-image"></i></div>';
        var cond = PRODUCT_CONDITIONS.find(function(c){ return c.value === p.condition; }) || PRODUCT_CONDITIONS[0];
        var statusText = (p.status === 'sold_out') ? '已售罄' : (p.status === 'off_shelf') ? '已下架' : '在售';
        var statusColor = (p.status === 'sold_out') ? '#999' : (p.status === 'off_shelf') ? '#ccc' : '#07c160';
        // [补丁2] 折扣角标
        var discount = _calcDiscount(p);
        var discountHtml = discount > 0 ? '<div class="merchant-product-discount">-'+discount+'%</div>' : '';
        var origPriceHtml = (p.condition !== 'new' && p.originalPrice > p.price)
            ? '<span class="merchant-product-origprice">¥'+Number(p.originalPrice).toFixed(0)+'</span>'
            : '';

        return '<div class="merchant-product-card">'
             + '<div class="merchant-product-img">'+imgHtml+discountHtml+'</div>'
             + '<div class="merchant-product-info">'
             +   '<div class="merchant-product-name">'+_esc(p.name)+'</div>'
             +   '<div class="merchant-product-tags">'
             +     '<span class="merchant-tag" style="background:'+cond.color+'22;color:'+cond.color+';">'+cond.label+'</span>'
             +     '<span class="merchant-tag" style="background:#eee;color:#666;">'+_esc(p.category)+'</span>'
             +   '</div>'
             +   '<div class="merchant-product-row">'
             +     '<span class="merchant-product-price">¥'+Number(p.price||0).toFixed(2)+'</span>'
             +     origPriceHtml
             +     '<span class="merchant-product-stock">库存'+p.stock+' · 已售'+(p.sales||0)+'</span>'
             +   '</div>'
             +   '<div class="merchant-product-row">'
             +     '<span class="merchant-product-status" style="color:'+statusColor+';">● '+statusText+'</span>'
             +     '<div class="merchant-product-actions">'
             +       '<button onclick="merchantEditProduct(\''+p.id+'\')" class="merchant-mini-btn">编辑</button>'
             +       '<button onclick="merchantToggleProductStatus(\''+p.id+'\')" class="merchant-mini-btn">'+(p.status==='active'?'下架':'上架')+'</button>'
             +       '<button onclick="merchantDeleteProduct(\''+p.id+'\')" class="merchant-mini-btn merchant-mini-btn-del">删除</button>'
             +     '</div>'
             +   '</div>'
             + '</div></div>';
    }

    window.merchantAddProduct = function() {
        merchantEditingProductId = null;
        merchantProductImagesBuffer = [];
        merchantView = 'edit_product';
        renderMerchantLayer();
    };

    window.merchantEditProduct = function(id) {
        merchantEditingProductId = id;
        var p = (store.myStore.products||[]).find(function(x){ return x.id === id; });
        merchantProductImagesBuffer = p ? (p.images||[]).slice() : [];
        merchantView = 'edit_product';
        renderMerchantLayer();
    };

    window.merchantToggleProductStatus = function(id) {
        var p = (store.myStore.products||[]).find(function(x){ return x.id === id; });
        if (!p) return;
        p.status = (p.status === 'active') ? 'off_shelf' : 'active';
        _save();
        if (typeof toast==='function') toast(p.status==='active' ? '✅ 商品已上架' : '商品已下架');
        renderMerchantLayer();
    };

    window.merchantDeleteProduct = function(id) {
        var doDel = function() {
            store.myStore.products = (store.myStore.products||[]).filter(function(p){ return p.id !== id; });
            _save();
            if (typeof toast==='function') toast('已删除');
            renderMerchantLayer();
        };
        if (typeof showConfirm === 'function') showConfirm('删除商品', '确定要删除这个商品吗？', doDel);
        else if (confirm('确定删除？')) doDel();
    };

    // ==================== 商品编辑器 ====================
    function renderProductEditor() {
        var p = merchantEditingProductId
            ? (store.myStore.products||[]).find(function(x){ return x.id === merchantEditingProductId; })
            : null;
        var isNew = !p;
        var defaults = p || {
            name: '', desc: '', category: '衣服',
            condition: 'new', price: 0, originalPrice: 0,
            stock: 1, images: [], shipping: { free: true, fee: 0 },
            canBargain: false, tags: []
        };

        var condOptions = PRODUCT_CONDITIONS.map(function(c) {
            return '<option value="'+c.value+'" '+(c.value===defaults.condition?'selected':'')+'>'+c.label+'</option>';
        }).join('');
        var catOptions = MERCHANT_CATEGORIES.filter(function(c){ return c !== '综合'; })
            .map(function(c){ return '<option value="'+c+'" '+(c===defaults.category?'selected':'')+'>'+c+'</option>'; }).join('');
        var tagHtml = PRODUCT_TAGS.map(function(t) {
            var checked = (defaults.tags||[]).indexOf(t) >= 0;
            return '<label class="merchant-tag-option"><input type="checkbox" value="'+t+'" '+(checked?'checked':'')+'> '+t+'</label>';
        }).join('');

        var imgsHtml = merchantProductImagesBuffer.map(function(img, idx) {
            return '<div class="merchant-img-item">'
                 +   '<img src="'+img+'">'
                 +   '<div class="merchant-img-del" onclick="merchantRemoveImg('+idx+')"><i class="fas fa-times"></i></div>'
                 + '</div>';
        }).join('');
        if (merchantProductImagesBuffer.length < 9) {
            imgsHtml += '<div class="merchant-img-add" onclick="merchantAddImage()"><i class="fas fa-plus"></i><span>添加图片</span></div>';
        }

        return '<div class="merchant-editor">'
             + '<div class="merchant-section-title">商品图片</div>'
             + '<div class="merchant-img-grid">'+imgsHtml+'</div>'
             + '<div class="merchant-img-hint">最多9张，第一张为主图</div>'

             + '<div class="merchant-section-title">基本信息</div>'
             + '<div class="merchant-form-row"><label>商品名称</label>'
             +   '<input id="merchant-p-name" type="text" maxlength="50" value="'+_esc(defaults.name)+'" placeholder="输入商品名">'
             + '</div>'
             + '<div class="merchant-form-row"><label>商品描述</label>'
             +   '<textarea id="merchant-p-desc" rows="3" maxlength="300" placeholder="描述你的商品">'+_esc(defaults.desc)+'</textarea>'
             +   '<button class="merchant-btn-ai" onclick="merchantAIPolishDesc()"><i class="fas fa-magic"></i> AI帮我润色</button>'
             + '</div>'
             + '<div class="merchant-form-row"><label>商品类目</label>'
             +   '<select id="merchant-p-category">'+catOptions+'</select>'
             + '</div>'
             + '<div class="merchant-form-row"><label>商品状况</label>'
             +   '<select id="merchant-p-condition">'+condOptions+'</select>'
             + '</div>'
             // [补丁1] 二手专属：瑕疵说明
             + '<div class="merchant-form-row" id="merchant-flaw-row" style="display:'+(defaults.condition!=='new'?'block':'none')+';">'
             +   '<label>瑕疵说明 <span style="color:#fa5151;font-size:11px;">*二手必填</span></label>'
             +   '<textarea id="merchant-p-flaw" rows="2" maxlength="150" placeholder="如实描述：使用次数、刮痕、褪色等小瑕疵，让买家放心">'+_esc(defaults.flawDesc||'')+'</textarea>'
             + '</div>'

             + '<div class="merchant-section-title">价格库存</div>'
             + '<div class="merchant-form-row-h">'
             +   '<div class="merchant-half"><label>当前售价¥</label><input id="merchant-p-price" type="number" step="0.01" min="0" value="'+(defaults.price||0)+'"></div>'
             +   '<div class="merchant-half"><label>原价¥（选填）</label><input id="merchant-p-original" type="number" step="0.01" min="0" value="'+(defaults.originalPrice||0)+'"></div>'
             + '</div>'
             + '<div class="merchant-form-row"><label>库存数量</label>'
             +   '<input id="merchant-p-stock" type="number" min="1" max="9999" value="'+(defaults.stock||1)+'">'
             + '</div>'

             + '<div class="merchant-section-title">运费与设置</div>'
             + '<div class="merchant-form-row merchant-switch-row">'
             +   '<label>包邮</label>'
             +   '<label class="merchant-switch"><input id="merchant-p-shipfree" type="checkbox" '+((defaults.shipping&&defaults.shipping.free)?'checked':'')+'><span></span></label>'
             + '</div>'
             + '<div class="merchant-form-row" id="merchant-shipfee-row" style="display:'+((defaults.shipping&&defaults.shipping.free)?'none':'flex')+';">'
             +   '<label>运费¥</label>'
             +   '<input id="merchant-p-shipfee" type="number" step="0.01" min="0" value="'+((defaults.shipping&&defaults.shipping.fee)||0)+'">'
             + '</div>'
             + '<div class="merchant-form-row merchant-switch-row">'
             +   '<label>允许砍价</label>'
             +   '<label class="merchant-switch"><input id="merchant-p-bargain" type="checkbox" '+(defaults.canBargain?'checked':'')+'><span></span></label>'
             + '</div>'
             + '<div class="merchant-form-row"><label>商品标签</label>'
             +   '<div class="merchant-tag-grid">'+tagHtml+'</div>'
             + '</div>'

             + '<div class="merchant-editor-actions">'
             +   '<button class="merchant-btn-primary" onclick="merchantSaveProduct()">'+(isNew?'🚀 立即上架':'💾 保存修改')+'</button>'
             + '</div>'
             + '</div>';
    }

    // 包邮开关联动 + [补丁1] 商品状况切换瑕疵说明显示
    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'merchant-p-shipfree') {
            var row = document.getElementById('merchant-shipfee-row');
            if (row) row.style.display = e.target.checked ? 'none' : 'flex';
        }
        if (e.target && e.target.id === 'merchant-p-condition') {
            var flawRow = document.getElementById('merchant-flaw-row');
            if (flawRow) flawRow.style.display = (e.target.value !== 'new') ? 'block' : 'none';
        }
    });

    window.merchantAddImage = function() {
        if (typeof openImgUploadModal === 'function') {
            openImgUploadModal('添加商品图片', function(url) {
                if (merchantProductImagesBuffer.length < 9) {
                    merchantProductImagesBuffer.push(url);
                    renderMerchantLayer();
                }
            });
        } else {
            var url = prompt('请输入图片URL');
            if (url) { merchantProductImagesBuffer.push(url); renderMerchantLayer(); }
        }
    };

    window.merchantRemoveImg = function(idx) {
        merchantProductImagesBuffer.splice(idx, 1);
        renderMerchantLayer();
    };

    window.merchantSaveProduct = function() {
        var g = function(id) { var el = document.getElementById(id); return el ? el.value : ''; };
        var gC = function(id) { var el = document.getElementById(id); return el ? el.checked : false; };
        var name = (g('merchant-p-name')||'').trim();
        if (!name) { if (typeof toast==='function') toast('请填写商品名称'); return; }
        var price = parseFloat(g('merchant-p-price')) || 0;
        if (price <= 0) { if (typeof toast==='function') toast('请填写正确的售价'); return; }
        if (merchantProductImagesBuffer.length === 0) {
            if (typeof toast==='function') toast('至少上传1张商品图片');
            return;
        }
        // [补丁1] 二手商品必填瑕疵说明
        var condition = g('merchant-p-condition') || 'new';
        var flawDesc = (g('merchant-p-flaw')||'').trim();
        if (condition !== 'new' && !flawDesc) {
            if (typeof toast==='function') toast('二手商品需如实填写"瑕疵说明"，买家更放心');
            var flawEl = document.getElementById('merchant-p-flaw');
            if (flawEl) flawEl.focus();
            return;
        }

        // 收集勾选的标签
        var tags = [];
        document.querySelectorAll('.merchant-tag-option input[type="checkbox"]:checked').forEach(function(cb){ tags.push(cb.value); });

        var isNew = !merchantEditingProductId;
        var s = store.myStore;
        var product;
        if (isNew) {
            product = {
                id: 'prod_my_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
                sellerId: 'myself',
                sellerName: s.name,
                sellerAvatar: s.avatar,
                status: 'active',
                sales: 0, views: 0,
                reviews: [],
                createdAt: Date.now()
            };
            s.products.unshift(product);
        } else {
            product = s.products.find(function(p){ return p.id === merchantEditingProductId; });
            if (!product) { if (typeof toast==='function') toast('商品不存在'); return; }
        }

        product.name         = name;
        product.desc         = (g('merchant-p-desc')||'').trim();
        product.category     = g('merchant-p-category') || '其他';
        product.condition    = condition;
        product.flawDesc     = flawDesc;  // [补丁1] 瑕疵说明
        product.price        = price;
        product.originalPrice= parseFloat(g('merchant-p-original')) || 0;
        product.stock        = Math.max(1, parseInt(g('merchant-p-stock')) || 1);
        product.shipping     = { free: gC('merchant-p-shipfree'), fee: gC('merchant-p-shipfree') ? 0 : (parseFloat(g('merchant-p-shipfee')) || 0) };
        product.canBargain   = gC('merchant-p-bargain');
        product.tags         = tags;
        product.images       = merchantProductImagesBuffer.slice();

        _save();
        if (typeof toast==='function') toast(isNew ? '🎉 商品上架成功' : '✅ 修改已保存');
        merchantEditingProductId = null;
        merchantProductImagesBuffer = [];
        merchantView = 'products';
        renderMerchantLayer();
    };

    // ==================== AI 润色商品描述 ====================
    window.merchantAIPolishDesc = async function() {
        var nameEl = document.getElementById('merchant-p-name');
        var descEl = document.getElementById('merchant-p-desc');
        var condEl = document.getElementById('merchant-p-condition');
        var catEl  = document.getElementById('merchant-p-category');
        var priceEl= document.getElementById('merchant-p-price');
        if (!descEl) return;

        var name  = (nameEl && nameEl.value || '').trim();
        var desc  = (descEl.value || '').trim();
        var cond  = condEl ? condEl.value : 'new';
        var cat   = catEl ? catEl.value : '其他';
        var price = priceEl ? priceEl.value : 0;

        if (!name && !desc) { if (typeof toast==='function') toast('请先填写名称或描述的关键词'); return; }

        if (typeof API === 'undefined' || !API.chatCompletion) {
            if (typeof toast==='function') toast('API未配置');
            return;
        }

        descEl.disabled = true;
        var originalValue = descEl.value;
        descEl.value = '✨ AI润色中...';

        try {
            var condLabel = (PRODUCT_CONDITIONS.find(function(c){ return c.value===cond; })||{}).label || '全新';
            var prompt = '你是二手商品/闲鱼平台的文案助手。请把下面的商品信息润色成一段吸引人的商品描述，要求：\n'
                       + '1. 长度80-180字，适合电商商品详情展示\n'
                       + '2. 突出卖点、状况、使用场景\n'
                       + '3. 语气自然亲切，不要过度营销\n'
                       + '4. 直接输出描述正文，不要标题、不要引号、不要前缀（如"商品描述："）\n\n'
                       + '商品名称：' + name + '\n'
                       + '类目：' + cat + '\n'
                       + '状况：' + condLabel + '\n'
                       + '售价：¥' + price + '\n'
                       + '用户草稿：' + (desc || '（无）');

            var runCall = function() {
                return API.chatCompletion([{ role:'user', content: prompt }], { temperature: 0.8, max_tokens: 400 });
            };
            var data;
            if (API.withScene) data = await API.withScene('shop', runCall);
            else data = await runCall();

            var text = '';
            if (data && data.choices && data.choices[0]) {
                text = (data.choices[0].message && data.choices[0].message.content) || data.choices[0].text || '';
            }
            text = (text||'').trim().replace(/^[""「『]|[""」』]$/g,'').replace(/^商品描述[：:]\s*/,'');
            if (!text) throw new Error('AI未返回内容');
            descEl.value = text;
            if (typeof toast==='function') toast('✨ 润色完成');
        } catch (e) {
            descEl.value = originalValue;
            if (typeof toast==='function') toast('润色失败: ' + (e.message||'请重试'));
        } finally {
            descEl.disabled = false;
        }
    };

    // ==================== 店铺消息 ====================
    function renderMessagesList() {
        // 优先使用独立的 app-shop-merchant-msgs.js 模块的实现
        if (typeof window.renderMerchantMessagesList === 'function') {
            return window.renderMerchantMessagesList();
        }
        // fallback
        return '<div class="merchant-empty">'
             + '<i class="fas fa-comment-dots" style="font-size:48px;color:#ddd;"></i>'
             + '<p>消息模块加载中...</p>'
             + '</div>';
    }
    // 暴露 renderMerchantLayer 给 msgs 模块使用
    window.renderMerchantLayer = renderMerchantLayer;

    // ==================== 将我的商品混入首页（改写 renderShopProducts） ====================
    // 监听购物App商品渲染，把我的在售商品也加入展示
    function patchShopProductRender() {
        // 不直接改写，由 app-shop.js 已有的 shopCustomProducts 机制代为处理
        // 这里改为主动同步：每次保存后，将 myStore.products 的 active 商品同步到 shopCustomProducts
        // 使用独立的标记字段 fromMyStore，避免与旧自定义商品混淆
    }

    function syncMyProductsToShop() {
        if (!store.myStore) return;
        if (!store.shopCustomProducts) store.shopCustomProducts = [];
        // 先清除上一次由本店同步出去的商品
        store.shopCustomProducts = store.shopCustomProducts.filter(function(p){ return !p.__fromMyStore; });
        // 再加入当前在售商品
        var active = (store.myStore.products||[]).filter(function(p){ return p.status === 'active'; });
        active.forEach(function(p) {
            store.shopCustomProducts.push({
                id: p.id,
                name: p.name,
                desc: p.desc,
                price: p.price,
                originalPrice: p.originalPrice,
                category: p.category,
                condition: p.condition,
                images: p.images,
                seller: store.myStore.name,
                sellerAvatar: store.myStore.avatar,
                tags: p.tags,
                canBargain: p.canBargain,
                shipping: p.shipping,
                createdAt: p.createdAt,
                __fromMyStore: true
            });
        });
    }

    // ==================== 订单管理 ====================
    var ORDER_STATUS_LABELS = {
        waiting_ship: '待发货', shipped: '已发货', delivered: '已签收',
        completed: '已完成', reviewed: '已评价', refunding: '退款中', refunded: '已退款'
    };
    var ORDER_STATUS_COLORS = {
        waiting_ship: '#faad14', shipped: '#4facfe', delivered: '#52c41a',
        completed: '#999', reviewed: '#999', refunding: '#fa5151', refunded: '#bbb'
    };

    function _getMerchantPendingOrders() {
        var orders = _getMerchantOrders();
        return orders.filter(function(o) { return o.status === 'waiting_ship'; }).length;
    }

    function _getMerchantOrders() {
        // 从 shopOrders 中筛选出属于我的店铺的订单（source=merchant 或商品属于我的店铺）
        var myProducts = (store.myStore && store.myStore.products) ? store.myStore.products.map(function(p) { return p.id; }) : [];
        var allOrders = store.shopOrders || [];
        return allOrders.filter(function(o) {
            if (o.source === 'merchant') return true;
            // 检查订单中的商品是否属于我的店铺
            if (o.items && o.items.length > 0) {
                return o.items.some(function(item) { return myProducts.indexOf(item.productId) >= 0; });
            }
            return false;
        });
    }

    // [增强] 商家订单筛选状态
    var _merchantOrderFilter = 'all';
    window.merchantFilterOrders = function(filter) {
        _merchantOrderFilter = filter;
        renderMerchantLayer();
    };

    function renderMerchantOrders() {
        var allOrders = _getMerchantOrders();

        // 统计各状态数量
        var counts = { all: allOrders.length, waiting_ship: 0, shipped: 0, delivered: 0, completed: 0, reviewed: 0, refunding: 0, refunded: 0 };
        allOrders.forEach(function(o) { if (counts[o.status] !== undefined) counts[o.status]++; else counts[o.status] = 1; });

        // 筛选标签栏
        var filters = [
            { key: 'all', label: '全部', count: counts.all },
            { key: 'waiting_ship', label: '待发货', count: counts.waiting_ship || 0 },
            { key: 'shipped', label: '已发货', count: counts.shipped || 0 },
            { key: 'delivered', label: '已签收', count: (counts.delivered||0) + (counts.completed||0) },
            { key: 'reviewed', label: '已评价', count: counts.reviewed || 0 },
            { key: 'refunding', label: '售后', count: (counts.refunding||0) + (counts.refunded||0) }
        ];
        var filterHtml = '<div style="display:flex;gap:0;overflow-x:auto;padding:0 12px 10px;border-bottom:1px solid #f0f0f0;background:#fff;margin:-12px -12px 12px;">';
        filters.forEach(function(f) {
            var isActive = _merchantOrderFilter === f.key;
            filterHtml += '<div onclick="merchantFilterOrders(\'' + f.key + '\')" style="flex-shrink:0;padding:10px 14px;font-size:13px;cursor:pointer;border-bottom:2px solid ' + (isActive ? '#ff4500' : 'transparent') + ';color:' + (isActive ? '#ff4500' : '#666') + ';font-weight:' + (isActive ? '600' : '400') + ';white-space:nowrap;">'
                       + f.label + (f.count > 0 ? '<span style="font-size:11px;color:' + (isActive ? '#ff4500' : '#999') + ';margin-left:2px;">(' + f.count + ')</span>' : '')
                       + '</div>';
        });
        filterHtml += '</div>';

        // 按筛选条件过滤
        var orders = allOrders;
        if (_merchantOrderFilter !== 'all') {
            if (_merchantOrderFilter === 'delivered') {
                orders = allOrders.filter(function(o) { return o.status === 'delivered' || o.status === 'completed'; });
            } else if (_merchantOrderFilter === 'refunding') {
                orders = allOrders.filter(function(o) { return o.status === 'refunding' || o.status === 'refunded'; });
            } else {
                orders = allOrders.filter(function(o) { return o.status === _merchantOrderFilter; });
            }
        }

        if (allOrders.length === 0) {
            return '<div style="text-align:center;padding:60px 20px;color:#999;">'
                 + '<i class="fas fa-clipboard-list" style="font-size:48px;color:#ddd;margin-bottom:16px;display:block;"></i>'
                 + '<p style="font-size:15px;">暂无订单</p>'
                 + '<p style="font-size:12px;color:#bbb;margin-top:6px;">联系人来店里咨询下单后会在这里显示</p>'
                 + '</div>';
        }

        var html = '<div style="padding:12px;">' + filterHtml;

        if (orders.length === 0) {
            html += '<div style="text-align:center;padding:40px;color:#999;"><p>该分类暂无订单</p></div>';
            html += '</div>';
            return html;
        }

        // 待发货优先
        orders.sort(function(a, b) {
            var priority = { waiting_ship: 0, shipped: 1, delivered: 2, refunding: 3 };
            var pa = priority[a.status] !== undefined ? priority[a.status] : 9;
            var pb = priority[b.status] !== undefined ? priority[b.status] : 9;
            if (pa !== pb) return pa - pb;
            return (b.createdAt || b.time || 0) - (a.createdAt || a.time || 0);
        });

        orders.forEach(function(o) {
            var statusLabel = ORDER_STATUS_LABELS[o.status] || o.status;
            var statusColor = ORDER_STATUS_COLORS[o.status] || '#999';
            var itemNames = (o.items || []).map(function(i) { return _esc(i.name || ''); }).join('、');

            // 买家信息
            var buyerName = o.buyerName || '';
            var buyerContact = buyerName ? (store.contacts||[]).find(function(c){ return c.name === buyerName || c.id === o.buyerId; }) : null;
            var buyerAvatar = buyerContact && buyerContact.avatar
                ? '<img src="' + buyerContact.avatar + '" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">'
                : '<div style="width:28px;height:28px;border-radius:50%;background:#e0e0e0;display:flex;align-items:center;justify-content:center;font-size:12px;color:#666;">' + _esc((buyerName||'?').charAt(0)) + '</div>';
            var buyerHtml = buyerName
                ? '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' + buyerAvatar + '<span style="font-size:13px;color:#333;">' + _esc(buyerName) + '</span></div>'
                : '';

            // 时间
            var timeStr = '';
            if (o.time || o.createdAt) {
                var d = new Date(o.time || o.createdAt);
                timeStr = (d.getMonth()+1) + '/' + d.getDate() + ' ' + d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
            }

            var actionBtn = '';
            if (o.status === 'waiting_ship') {
                actionBtn = '<button onclick="event.stopPropagation();merchantShipOrder(\'' + o.id + '\')" style="font-size:12px;padding:6px 14px;border:none;background:linear-gradient(135deg,#07c160,#06ad56);color:#fff;border-radius:16px;cursor:pointer;font-weight:600;">📦 发货</button>';
            } else if (o.status === 'refunding') {
                actionBtn = '<button onclick="event.stopPropagation();merchantApproveRefund(\'' + o.id + '\')" style="font-size:12px;padding:6px 14px;border:1px solid #fa5151;background:#fff;color:#fa5151;border-radius:16px;cursor:pointer;">同意退款</button>';
            } else if (o.status === 'shipped' && o.logistics) {
                actionBtn = '<button onclick="event.stopPropagation();merchantViewLogistics(\'' + o.id + '\')" style="font-size:12px;padding:6px 14px;border:1px solid #1890ff;background:#fff;color:#1890ff;border-radius:16px;cursor:pointer;">📍 物流</button>';
            }

            // 物流简要信息
            var logisticsHint = '';
            if (o.logistics && o.logistics.trackingNo) {
                logisticsHint = '<div style="font-size:11px;color:#1890ff;margin-top:4px;"><i class="fas fa-truck" style="margin-right:4px;"></i>' + _esc(o.logistics.carrier || '') + ' ' + _esc(o.logistics.trackingNo) + '</div>';
            }

            html += '<div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">'
                  + buyerHtml
                  + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'
                  + '<span style="font-size:12px;color:#999;">' + timeStr + '</span>'
                  + '<span style="font-size:12px;color:' + statusColor + ';font-weight:600;">' + statusLabel + '</span>'
                  + '</div>'
                  + '<div style="font-size:14px;color:#333;margin-bottom:6px;">' + (itemNames || '商品') + '</div>'
                  + logisticsHint
                  + '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">'
                  + '<span style="font-size:15px;color:#fa5151;font-weight:600;">¥' + Number(o.total || 0).toFixed(2) + '</span>'
                  + actionBtn
                  + '</div>'
                  + (o.address ? '<div style="font-size:12px;color:#999;margin-top:8px;padding-top:8px;border-top:1px solid #f5f5f5;"><i class="fas fa-map-marker-alt" style="margin-right:4px;"></i>' + _esc((o.address.name || '') + ' ' + (o.address.phone || '') + ' ' + (o.address.address || '')) + '</div>' : '')
                  + (o.review ? '<div style="font-size:12px;color:#faad14;margin-top:6px;padding-top:6px;border-top:1px solid #f5f5f5;">⭐ ' + (o.review.stars||5) + '星 · ' + _esc(o.review.text||'') + '</div>' : '')
                  + '</div>';
        });
        html += '</div>';
        return html;
    }

    // 查看物流详情弹窗
    window.merchantViewLogistics = function(orderId) {
        var o = (store.shopOrders || []).find(function(x) { return x.id === orderId; });
        if (!o || !o.logistics) { if (typeof toast === 'function') toast('暂无物流信息'); return; }
        var lg = o.logistics;
        var stepsHtml = '';
        var steps = lg.steps || [];
        steps.forEach(function(s, i) {
            var isCurrent = i === (lg.currentStep || 0);
            var isPast = i <= (lg.currentStep || 0);
            stepsHtml += '<div style="display:flex;gap:10px;padding:8px 0;">'
                       + '<div style="display:flex;flex-direction:column;align-items:center;width:20px;">'
                       + '<div style="width:10px;height:10px;border-radius:50%;background:' + (isCurrent ? '#07c160' : isPast ? '#bbb' : '#e0e0e0') + ';flex-shrink:0;"></div>'
                       + (i < steps.length - 1 ? '<div style="width:1px;flex:1;background:#e0e0e0;margin:2px 0;"></div>' : '')
                       + '</div>'
                       + '<div style="flex:1;"><div style="font-size:13px;color:' + (isCurrent ? '#333' : '#999') + ';font-weight:' + (isCurrent ? '600' : '400') + ';">' + _esc(s.text) + '</div>'
                       + '<div style="font-size:11px;color:#bbb;margin-top:2px;">' + new Date(s.time).toLocaleString() + '</div></div></div>';
        });
        var html = '<div style="padding:16px;">'
                 + '<div style="font-size:14px;font-weight:600;margin-bottom:12px;">' + _esc(lg.carrier || '快递') + ' ' + _esc(lg.trackingNo || '') + '</div>'
                 + stepsHtml + '</div>';
        if (typeof showConfirm === 'function') {
            // 复用 showConfirm 的弹窗样式
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = '<div style="background:#fff;border-radius:16px;width:90%;max-width:360px;max-height:70vh;overflow-y:auto;">'
                              + '<div style="padding:16px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">'
                              + '<span style="font-size:16px;font-weight:600;">📦 物流详情</span>'
                              + '<span onclick="this.closest(\'div[style*=fixed]\').remove()" style="cursor:pointer;font-size:20px;color:#999;">×</span></div>'
                              + html + '</div>';
            document.body.appendChild(overlay);
        }
    };

    window.merchantShipOrder = function(orderId) {
        var o = (store.shopOrders || []).find(function(x) { return x.id === orderId; });
        if (!o || o.status !== 'waiting_ship') { if (typeof toast === 'function') toast('订单状态异常'); return; }

        if (typeof showConfirm === 'function') {
            showConfirm('确认发货', '确认为该订单发货吗？', function() {
                _doMerchantShip(o);
            });
        } else {
            _doMerchantShip(o);
        }
    };

    function _doMerchantShip(o) {
        var trackingNo = 'YAN' + Date.now().toString(36).toUpperCase();
        var now = Date.now();
        o.logistics = {
            carrier: 'YAN快递',
            trackingNo: trackingNo,
            currentStep: 0,
            steps: [
                { text: '商家已发货（单号 ' + trackingNo + '）', time: now },
                { text: '快递员已上门揽收', time: now + 30000 },
                { text: '包裹已离开发货地仓库', time: now + 90000 },
                { text: '包裹到达转运中心', time: now + 180000 },
                { text: '包裹正在派送中', time: now + 300000 },
                { text: '已签收', time: now + 420000 }
            ]
        };
        o.status = 'shipped';
        // 更新店铺销量
        if (store.myStore) {
            store.myStore.totalSales = (store.myStore.totalSales || 0) + (o.items ? o.items.length : 1);
            store.myStore.totalRevenue = (store.myStore.totalRevenue || 0) + (o.total || 0);
        }
        // [FIX-订单同步] 如果有关联消息，同步发货状态到消息系统
        _syncShopOrderToMsg(o, 'shipped', trackingNo);
        _save();
        if (typeof toast === 'function') toast('🚚 已发货！');
        renderMerchantLayer();
    }

    // [FIX-订单同步] shopOrders → merchant messages 反向同步工具
    function _syncShopOrderToMsg(o, newStatus, trackingNo) {
        if (!o.msgId || !store.myStore || !store.myStore.messages) return;
        var msg = store.myStore.messages.find(function(m) { return m.id === o.msgId; });
        if (!msg) return;
        if (newStatus === 'shipped' && trackingNo) {
            msg.orderStatus = 'shipping';
            msg.status = 'shipped';
            msg.trackingNo = trackingNo;
            msg.logistics = [
                { time: Date.now(), text: '商家已发货（单号 ' + trackingNo + '）' },
                { time: Date.now() + 1000, text: '快递员已上门揽收' }
            ];
        } else if (newStatus === 'refunded') {
            msg.status = 'refunded';
            msg.orderStatus = 'refunded';
        }
    }

    window.merchantApproveRefund = function(orderId) {
        var o = (store.shopOrders || []).find(function(x) { return x.id === orderId; });
        if (!o || o.status !== 'refunding') return;
        o.status = 'refunded';
        // 退款到买家钱包
        if (typeof store.walletBalance === 'number') {
            store.walletBalance += (o.total || 0);
            if (!store.walletHistory) store.walletHistory = [];
            store.walletHistory.unshift({ id: 'wh_' + Date.now(), type: 'refund', amount: o.total || 0, desc: '商家退款', time: Date.now() });
        }
        // [FIX-订单同步] 同步退款状态到消息系统
        _syncShopOrderToMsg(o, 'refunded');
        _save();
        if (typeof toast === 'function') toast('已同意退款 ¥' + Number(o.total || 0).toFixed(2));
        renderMerchantLayer();
    };

    // 重写 save 入口：每次保存后自动同步
    var _origSave = window.save;
    if (typeof _origSave === 'function' && !window._saveMerchantPatched) {
        window.save = function() {
            try { syncMyProductsToShop(); } catch(e) { console.warn('[merchant] sync err', e); }
            return _origSave.apply(this, arguments);
        };
        window._saveMerchantPatched = true;
    }

    // ==================== 启动时初始化 ====================
    if (typeof store !== 'undefined') {
        initMyStore();
        syncMyProductsToShop();
    } else {
        // 延迟初始化
        var _merchantAttempt = 0;
        var checkStore = setInterval(function() {
            _merchantAttempt++;
            if (typeof store !== 'undefined') {
                clearInterval(checkStore);
                initMyStore();
                syncMyProductsToShop();
            } else if (_merchantAttempt > 50) {
                clearInterval(checkStore);
                console.warn('[Merchant] store 未就绪，放弃初始化');
            }
        }, 200);
    }

    // 暴露常量给其他模块
    window.MERCHANT_PRODUCT_CONDITIONS = PRODUCT_CONDITIONS;
    window.MERCHANT_CATEGORIES = MERCHANT_CATEGORIES;
    window.initMyStore = initMyStore;
    window.syncMyProductsToShop = syncMyProductsToShop;

})();
