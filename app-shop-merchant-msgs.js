// ============================================================
// ========== SHOP MERCHANT MESSAGES & CUSTOMER AI ============
// Stage 2: 店铺消息页 + 联系人顾客行为（咨询/下单/砍价/退货）
// 所有交互 100% 封闭在购物App内，不同步到微信聊天记录
// ============================================================
(function(){
    'use strict';

    // ==================== 常量 ====================
    var ACTION_META = {
        inquiry:    { icon:'fa-comment-dots',  color:'#1890ff', label:'咨询' },
        buy:        { icon:'fa-shopping-bag',  color:'#07c160', label:'下单' },
        bargain:    { icon:'fa-hand-holding-usd', color:'#faad14', label:'砍价' },
        complaint:  { icon:'fa-exclamation-triangle', color:'#fa5151', label:'售后' }
    };

    var ORDER_STATUS_META = {
        pending_pay:   { label:'待付款',  color:'#faad14', icon:'fa-hourglass-start' },
        waiting_ship:  { label:'待发货',  color:'#1890ff', icon:'fa-box' },
        shipping:      { label:'配送中',  color:'#52c41a', icon:'fa-truck' },
        delivered:     { label:'已送达',  color:'#13c2c2', icon:'fa-check-circle' },
        reviewed:      { label:'已评价',  color:'#888',    icon:'fa-star' },
        refunding:     { label:'退款中',  color:'#fa8c16', icon:'fa-undo' },
        refunded:      { label:'已退款',  color:'#999',    icon:'fa-hand-holding-usd' },
        closed:        { label:'已关闭',  color:'#ccc',    icon:'fa-ban' }
    };

    var currentMsgId = null;  // 当前打开会话的ID

    function _save() { if (typeof save === 'function') save(); }
    function _esc(s) { return (typeof escapeHtml === 'function') ? escapeHtml(s||'') : String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function _now() { return Date.now(); }

    // ==================== 工具：从 AI 返回文本中解析 JSON ====================
    function parseJSON(str) {
        if (!str) return null;
        try {
            var clean = str.replace(/```(?:json|JSON)?\s*/g, '').replace(/```/g, '').trim();
            var m = clean.match(/\{[\s\S]*\}/);
            if (m) return JSON.parse(m[0]);
        } catch(e) {}
        try {
            var m2 = str.match(/\{[\s\S]*\}/);
            if (m2) {
                var fixed = m2[0].replace(/,\s*([}\]])/g,'$1').replace(/'/g,'"');
                return JSON.parse(fixed);
            }
        } catch(e2) {}
        return null;
    }

    // ==================== 调用 API ====================
    async function callShopAPI(messages, options) {
        if (typeof API === 'undefined' || !API.chatCompletion) return null;
        var runCall = function() {
            return API.chatCompletion(messages, {
                temperature: (options && options.temperature) || 0.85,
                max_tokens: (options && options.max_tokens) || 600
            });
        };
        var data;
        try {
            if (API.withScene) data = await API.withScene('shop', runCall);
            else data = await runCall();
        } catch(e) {
            console.warn('[merchant-msgs] API err', e);
            return null;
        }
        if (data && data.choices && data.choices[0]) {
            return (data.choices[0].message && data.choices[0].message.content) || data.choices[0].text || '';
        }
        return null;
    }

    // ==================== 人设-商品 契合度匹配 ====================
    // 基于人设描述 + 商品类目的关键词打分
    var CATEGORY_KEYWORDS = {
        '衣服':   ['时尚','穿搭','潮流','小红书','ootd','衣服','girl','美女','学生','少女','时髦'],
        '美妆':   ['美妆','化妆','口红','护肤','种草','小红书','爱美','女','精致','girl'],
        '食品':   ['吃货','美食','零食','甜品','奶茶','吃','饿','零嘴','馋'],
        '鞋包':   ['潮流','运动','球鞋','包','名牌','穿搭','潮人'],
        '数码':   ['数码','极客','电脑','手机','程序','游戏','gamer','技术','码农'],
        '家居':   ['家','生活','宅','居家','精致','整洁','装饰'],
        '其他':   []
    };

    function scorePersonaFit(contact, products) {
        if (!contact || !contact.persona) return 0;
        var p = (contact.persona || '').toLowerCase();
        var score = 1; // 基础分
        products.forEach(function(prod) {
            var cat = prod.category || '其他';
            var words = CATEGORY_KEYWORDS[cat] || [];
            words.forEach(function(w) {
                if (p.indexOf(w.toLowerCase()) >= 0) score += 2;
            });
            // 价格契合度（便宜商品对学生党友好）
            if (prod.price <= 50 && /学生|穷|抠|省钱/.test(p)) score += 1;
            if (prod.price >= 500 && /富|土豪|土味|挥霍|败家|奢/.test(p)) score += 2;
        });
        // 随机扰动，让每次挑选结果不同
        score += Math.random() * 2;
        return score;
    }

    function pickByPersonaFit(contacts, products) {
        if (!contacts.length) return null;
        if (!products.length) return contacts[Math.floor(Math.random()*contacts.length)];
        var scored = contacts.map(function(c) {
            return { contact: c, score: scorePersonaFit(c, products) };
        });
        scored.sort(function(a,b){ return b.score - a.score; });
        // 从 top 3 中随机选一个
        var top = scored.slice(0, Math.min(3, scored.length));
        return top[Math.floor(Math.random()*top.length)].contact;
    }

    // ==================== 刷新：模拟顾客上门 ====================
    window.merchantRefreshCustomers = async function() {
        var s = store.myStore;
        if (!s || !s.isOpen) return;
        var activeProducts = (s.products||[]).filter(function(p){ return p.status === 'active' && p.stock > 0; });
        if (activeProducts.length === 0) {
            if (typeof toast === 'function') toast('请先上架至少一件商品');
            return;
        }
        var contacts = (store.contacts||[]).filter(function(c){ return !c.isGroup && c.persona; });
        if (contacts.length === 0) {
            if (typeof toast === 'function') toast('请先添加有人设的联系人');
            return;
        }

        // 防抖：避免连点
        if (window._merchantRefreshing) {
            if (typeof toast === 'function') toast('⏳ 顾客正在路上...');
            return;
        }
        window._merchantRefreshing = true;
        _setRefreshBtn(true);

        try {
            // 挑选顾客
            var customer = pickByPersonaFit(contacts, activeProducts);
            if (!customer) return;

            // [补丁5] 防重复：24小时内来过的+最近5个顾客都排除
            var DAY_MS = 24*60*60*1000;
            var recentCustomersSet = {};
            (s.messages||[]).forEach(function(m){
                if ((_now() - m.createdAt) < DAY_MS) recentCustomersSet[m.customerId] = true;
            });
            // 再加上最近 5 个顾客（不管时间）
            var sortedByTime = (s.messages||[]).slice().sort(function(a,b){ return b.createdAt - a.createdAt; });
            for (var _ri=0; _ri<Math.min(5, sortedByTime.length); _ri++) {
                recentCustomersSet[sortedByTime[_ri].customerId] = true;
            }
            if (recentCustomersSet[customer.id] && contacts.length > 1) {
                // 从未在窗口内的联系人里优先选
                var others = contacts.filter(function(c){ return !recentCustomersSet[c.id]; });
                if (others.length > 0) {
                    customer = pickByPersonaFit(others, activeProducts);
                }
                // 如果所有人都在窗口内，则允许最老一位再来
            }

            // 构造商品清单文本
            var pList = activeProducts.slice(0, 8).map(function(p, i){
                var cond = (window.MERCHANT_PRODUCT_CONDITIONS || []).find(function(c){ return c.value === p.condition; });
                return (i+1)+'. [id:'+p.id+'] ' + p.name + ' ¥' + p.price
                     + (cond ? ' ('+cond.label.replace(/^[🏷💎👍⚠️]\s?/,'')+')' : '')
                     + (p.canBargain ? ' 可议价' : '')
                     + ' - ' + (p.desc||'').substring(0, 40);
            }).join('\n');

            // getAiContext
            var aiCtx = (typeof getAiContext === 'function') ? getAiContext(customer) : ('你是' + customer.name + '。人设：' + customer.persona);
            var userName = (typeof getUserPersonaName === 'function') ? getUserPersonaName(customer, store.user.name||'用户') : (store.user.name||'用户');

            var prompt = aiCtx + '\n\n'
                       + '【场景】你正在购物App里刷到了'+userName+'开的店「'+s.name+'」\n'
                       + '店铺公告："' + (s.announcement||'') + '"\n'
                       + '在售商品列表：\n' + pList + '\n\n'
                       + '【任务】根据你的人设(兴趣/消费力/性格/和'+userName+'的关系)，\n'
                       + '从下面4种顾客行为中选最贴合你人设的一种，给店主发消息：\n'
                       + '  - inquiry 咨询（问商品细节/尺码/材质/真伪等）\n'
                       + '  - buy 下单购买（选中商品，可能要求小优惠）\n'
                       + '  - bargain 砍价（商品必须标"可议价"才能砍）\n'
                       + '  - complaint 售后投诉（没买过的商品不能投诉，这是新顾客请不要选这个）\n\n'
                       + '⚠️ 必须：\n'
                       + '1. message 用「'+customer.name+'」真实口吻说话，符合人设\n'
                       + '2. 选一件具体的商品（productId必须从列表里挑一个）\n'
                       + '3. 如果是bargain，offerPrice必须小于商品原价\n'
                       + '4. 严禁OOC，严禁AI腔\n\n'
                       + '【输出JSON(只输出这一个对象)】{"action":"inquiry|buy|bargain","productId":"商品ID","productName":"商品名","message":"你的原话20-80字","offerPrice":数字或null,"qty":1}';

            var resp = await callShopAPI([{ role:'system', content: prompt }], { temperature: 0.9, max_tokens: 400 });
            var result = parseJSON(resp) || null;

            if (!result || !result.action || !result.productId) {
                // fallback
                var prod = activeProducts[Math.floor(Math.random()*activeProducts.length)];
                result = {
                    action: 'inquiry',
                    productId: prod.id,
                    productName: prod.name,
                    message: '在吗，这件' + prod.name + '还有吗？能给我详细讲讲吗？',
                    offerPrice: null,
                    qty: 1
                };
            }
            // 验证 productId 是否真实存在
            var targetProduct = activeProducts.find(function(p){ return p.id === result.productId; });
            if (!targetProduct) {
                targetProduct = activeProducts[0];
                result.productId = targetProduct.id;
                result.productName = targetProduct.name;
            }

            // 防止砍价乱来
            if (result.action === 'bargain' && !targetProduct.canBargain) {
                result.action = 'inquiry';
                result.offerPrice = null;
            }
            if (result.action === 'bargain' && (!result.offerPrice || result.offerPrice >= targetProduct.price)) {
                result.offerPrice = Math.round(targetProduct.price * (0.6 + Math.random()*0.3) * 100) / 100;
            }

            // 入库
            var msg = {
                id: 'shopmsg_' + _now() + '_' + Math.random().toString(36).slice(2,6),
                customerId: customer.id,
                customerName: customer.name,
                customerAvatar: customer.avatar || '',
                action: result.action,
                productId: targetProduct.id,
                productName: targetProduct.name,
                productPrice: targetProduct.price,
                productImage: (targetProduct.images && targetProduct.images[0]) || '',
                offerPrice: result.offerPrice,
                qty: result.qty || 1,
                status: 'pending',  // pending | dealing | shipped | done | refunding | refunded | closed
                read: false,        // [补丁3] 新增未读标识，区别于 status
                // 会话流
                replies: [
                    { role:'customer', text: result.message || '你好', time: _now() }
                ],
                // 订单相关（只在 action=buy 或 砍价成功后）
                orderId: null,
                orderStatus: null,
                trackingNo: null,
                logistics: [],
                review: null,
                createdAt: _now(),
                updatedAt: _now()
            };
            s.messages = s.messages || [];
            s.messages.unshift(msg);
            _save();

            if (typeof toast === 'function') {
                var mt = ACTION_META[result.action] || {};
                toast('🔔 ' + customer.name + ' ' + (mt.label||'来了') + '了');
            }

            // 刷新页面
            if (typeof renderMerchantLayer === 'function') renderMerchantLayer();
            else if (typeof window.renderMerchantLayer === 'function') window.renderMerchantLayer();

        } finally {
            window._merchantRefreshing = false;
            _setRefreshBtn(false);
        }
    };

    function _setRefreshBtn(loading) {
        var btn = document.getElementById('merchant-refresh-btn');
        if (!btn) return;
        if (loading) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 顾客正在路上...';
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-store"></i> 看看谁来我店里';
        }
    }

    // ==================== 渲染店铺消息列表 ====================
    window.renderMerchantMessagesList = function() {
        var s = store.myStore;
        if (!s) return '';
        var msgs = (s.messages||[]).slice();
        // 按更新时间排序
        msgs.sort(function(a,b){ return (b.updatedAt||b.createdAt) - (a.updatedAt||a.createdAt); });

        var pendingCount = msgs.filter(function(m){ return m.status === 'pending'; }).length;
        var dealingCount = msgs.filter(function(m){ return ['dealing','shipped','refunding'].indexOf(m.status)>=0; }).length;

        var listHtml = '';
        if (msgs.length === 0) {
            listHtml = '<div class="merchant-empty">'
                     + '<i class="fas fa-comment-dots" style="font-size:48px;color:#ddd;"></i>'
                     + '<p>还没有顾客消息</p>'
                     + '<p style="color:#999;font-size:12px;">点击上方「看看谁来我店里」<br>联系人会按照自己的人设来找你</p>'
                     + '</div>';
        } else {
            listHtml = '<div class="merchant-msg-list">' + msgs.map(renderMsgListItem).join('') + '</div>';
        }

        return '<div class="merchant-msgs">'
             + '<div class="merchant-msg-header">'
             + '<div class="merchant-msg-stats">'
             +   '<span class="merchant-msg-stat"><i class="fas fa-bell" style="color:#fa5151;"></i> 待处理 '+pendingCount+'</span>'
             +   '<span class="merchant-msg-stat"><i class="fas fa-tasks" style="color:#1890ff;"></i> 处理中 '+dealingCount+'</span>'
             + '</div>'
             + '<button id="merchant-refresh-btn" class="merchant-btn-refresh" onclick="merchantRefreshCustomers()">'
             +   '<i class="fas fa-store"></i> 看看谁来我店里'
             + '</button>'
             + '<div class="merchant-msg-hint">💡 点击按钮，系统会根据商品和联系人人设，让最合适的联系人来你店里</div>'
             + '</div>'
             + listHtml
             + '</div>';
    };

    function renderMsgListItem(m) {
        var meta = ACTION_META[m.action] || { icon:'fa-comment', color:'#888', label:'消息' };
        var avatar = m.customerAvatar
            ? '<img src="'+m.customerAvatar+'">'
            : '<div class="merchant-msg-avatar-ph">'+(m.customerName||'?').charAt(0)+'</div>';
        var lastReply = m.replies && m.replies.length ? m.replies[m.replies.length-1] : null;
        var preview = lastReply ? lastReply.text : '';
        preview = preview.length > 40 ? preview.substring(0, 40)+'...' : preview;
        var time = _formatTime(m.updatedAt || m.createdAt);
        var statusBadge = '';
        if (m.status === 'pending') statusBadge = '<span class="merchant-msg-badge pending">待回复</span>';
        else if (m.status === 'dealing') statusBadge = '<span class="merchant-msg-badge dealing">处理中</span>';
        else if (m.status === 'shipped') statusBadge = '<span class="merchant-msg-badge shipped">已发货</span>';
        else if (m.status === 'done') statusBadge = '<span class="merchant-msg-badge done">已完成</span>';
        else if (m.status === 'refunding') statusBadge = '<span class="merchant-msg-badge refunding">退款中</span>';
        else if (m.status === 'refunded') statusBadge = '<span class="merchant-msg-badge refunded">已退款</span>';
        else if (m.status === 'closed') statusBadge = '<span class="merchant-msg-badge closed">已关闭</span>';

        var priceInfo = '';
        if (m.action === 'bargain' && m.offerPrice) priceInfo = ' · 出价¥'+m.offerPrice;
        else if (m.action === 'buy') priceInfo = ' · ¥'+m.productPrice;

        // [补丁3] 未读红点
        var unreadDot = (m.read === false) ? '<span class="merchant-msg-unread-dot"></span>' : '';
        var itemCls = 'merchant-msg-item' + ((m.read === false) ? ' is-unread' : '');

        return '<div class="'+itemCls+'" onclick="merchantOpenMsg(\''+m.id+'\')">'
             + '<div class="merchant-msg-avatar">'+avatar + unreadDot +'</div>'
             + '<div class="merchant-msg-body">'
             +   '<div class="merchant-msg-row1">'
             +     '<span class="merchant-msg-name">'+_esc(m.customerName)+'</span>'
             +     '<span class="merchant-msg-time">'+time+'</span>'
             +   '</div>'
             +   '<div class="merchant-msg-row2">'
             +     '<span class="merchant-msg-action" style="background:'+meta.color+'22;color:'+meta.color+';">'
             +       '<i class="fas '+meta.icon+'"></i> '+meta.label
             +     '</span>'
             +     '<span class="merchant-msg-product">'+_esc(m.productName||'')+priceInfo+'</span>'
             +   '</div>'
             +   '<div class="merchant-msg-preview">'+_esc(preview)+'</div>'
             + '</div>'
             + '<div class="merchant-msg-side">'+statusBadge+'</div>'
             + '</div>';
    }

    function _formatTime(ts) {
        if (!ts) return '';
        var diff = _now() - ts;
        if (diff < 60*1000) return '刚刚';
        if (diff < 60*60*1000) return Math.floor(diff/60000) + '分前';
        if (diff < 24*60*60*1000) return Math.floor(diff/3600000) + '小时前';
        if (diff < 7*24*60*60*1000) return Math.floor(diff/86400000) + '天前';
        var d = new Date(ts);
        return (d.getMonth()+1)+'-'+d.getDate();
    }

    // ==================== 打开某条消息会话 ====================
    window.merchantOpenMsg = function(msgId) {
        currentMsgId = msgId;
        // [补丁3] 打开即标记已读
        var _m = _getMsg(msgId);
        if (_m && _m.read === false) { _m.read = true; _save(); }
        renderMsgDetailModal();
    };

    function _getMsg(id) {
        return ((store.myStore||{}).messages||[]).find(function(m){ return m.id === id; });
    }

    function renderMsgDetailModal() {
        var m = _getMsg(currentMsgId);
        if (!m) return;
        var modalId = 'merchant-msg-modal';
        var existing = document.getElementById(modalId);
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'merchant-msg-modal';
        modal.innerHTML = getMsgDetailHTML(m);
        modal.onclick = function(e) { if (e.target === modal) closeMsgModal(); };
        document.body.appendChild(modal);
        requestAnimationFrame(function() { modal.classList.add('show'); });

        // 自动滚到底
        setTimeout(function() {
            var replies = document.getElementById('merchant-msg-replies');
            if (replies) replies.scrollTop = replies.scrollHeight;
        }, 50);

        // 消息打开后若状态还是 pending，不自动改变(只有玩家回复后才变 dealing)
    }

    function closeMsgModal() {
        var modal = document.getElementById('merchant-msg-modal');
        if (modal) modal.classList.remove('show');
        setTimeout(function() { if (modal) modal.remove(); }, 200);
    }
    window.merchantCloseMsgModal = closeMsgModal;

    function getMsgDetailHTML(m) {
        var meta = ACTION_META[m.action] || {};
        var avatarHtml = m.customerAvatar
            ? '<img src="'+m.customerAvatar+'">'
            : '<div class="merchant-msg-avatar-ph">'+(m.customerName||'?').charAt(0)+'</div>';

        // 会话气泡
        var bubblesHtml = (m.replies||[]).map(function(r, idx) {
            var isMe = (r.role === 'me');
            var avatar = isMe
                ? (store.myStore.avatar ? '<img src="'+store.myStore.avatar+'">' : '<div class="merchant-msg-avatar-ph me">我</div>')
                : (m.customerAvatar ? '<img src="'+m.customerAvatar+'">' : '<div class="merchant-msg-avatar-ph">'+(m.customerName||'?').charAt(0)+'</div>');
            var cls = isMe ? 'merchant-bubble-me' : 'merchant-bubble-customer';
            // 特殊消息：系统提示
            if (r.role === 'system') {
                return '<div class="merchant-bubble-sys">'+_esc(r.text)+'</div>';
            }
            return '<div class="merchant-bubble '+cls+'">'
                 + '<div class="merchant-bubble-avatar">'+avatar+'</div>'
                 + '<div class="merchant-bubble-body">'+_esc(r.text)+'</div>'
                 + '</div>';
        }).join('');

        // 商品卡片（顶部固定）
        var productCard = '<div class="merchant-msg-product-card">'
            + (m.productImage ? '<img src="'+m.productImage+'">' : '<div class="merchant-msg-product-noimg"><i class="fas fa-image"></i></div>')
            + '<div class="merchant-msg-product-info">'
            +   '<div class="merchant-msg-product-name">'+_esc(m.productName)+'</div>'
            +   '<div class="merchant-msg-product-price">¥'+Number(m.productPrice||0).toFixed(2)+'</div>'
            + '</div>'
            + '<span class="merchant-msg-product-tag" style="background:'+meta.color+'22;color:'+meta.color+';">'
            +   '<i class="fas '+meta.icon+'"></i> '+meta.label
            + '</span>'
            + '</div>';

        // 底部动作区：根据 status 变化
        var actionArea = renderActionArea(m);

        // 输入区
        var inputArea = '';
        if (['pending','dealing','refunding'].indexOf(m.status) >= 0) {
            inputArea = '<div class="merchant-msg-input-wrap">'
                      + '<textarea id="merchant-msg-input" rows="2" placeholder="回复顾客..." onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();merchantSendReply();}"></textarea>'
                      + '<button class="merchant-msg-send-btn" onclick="merchantSendReply()"><i class="fas fa-paper-plane"></i></button>'
                      + '</div>';
        }

        return '<div class="merchant-msg-sheet">'
             + '<div class="merchant-msg-sheet-header">'
             +   '<div class="merchant-msg-sheet-avatar">'+avatarHtml+'</div>'
             +   '<div class="merchant-msg-sheet-title">'
             +     '<div class="merchant-msg-sheet-name">'+_esc(m.customerName)+'</div>'
             +     '<div class="merchant-msg-sheet-sub">'+_formatTime(m.createdAt)+'发起</div>'
             +   '</div>'
             +   '<div class="merchant-msg-sheet-close" onclick="merchantCloseMsgModal()"><i class="fas fa-times"></i></div>'
             + '</div>'
             + productCard
             + '<div id="merchant-msg-replies" class="merchant-msg-replies">' + bubblesHtml + '</div>'
             + actionArea
             + inputArea
             + '</div>';
    }

    // ==================== 动作区（按 action + status 决定） ====================
    function renderActionArea(m) {
        // 对话阶段（pending / dealing）
        if (m.status === 'pending' || m.status === 'dealing') {
            if (m.action === 'bargain') {
                return '<div class="merchant-msg-actions">'
                     + '<div class="merchant-msg-offer">顾客出价 <b style="color:#fa5151;">¥'+Number(m.offerPrice||0).toFixed(2)+'</b>（原价 ¥'+Number(m.productPrice||0).toFixed(2)+'）</div>'
                     + '<div class="merchant-msg-btns">'
                     +   '<button class="merchant-msg-btn accept" onclick="merchantAcceptBargain()">✅ 同意成交</button>'
                     +   '<button class="merchant-msg-btn counter" onclick="merchantCounterBargain()">🤝 还价</button>'
                     +   '<button class="merchant-msg-btn reject" onclick="merchantRejectBargain()">❌ 拒绝</button>'
                     + '</div></div>';
            }
            if (m.action === 'buy') {
                return '<div class="merchant-msg-actions">'
                     + '<div class="merchant-msg-btns">'
                     +   '<button class="merchant-msg-btn accept" onclick="merchantAcceptOrder()">📦 确认接单</button>'
                     +   '<button class="merchant-msg-btn reject" onclick="merchantRejectOrder()">❌ 谢绝订单</button>'
                     + '</div></div>';
            }
            if (m.action === 'complaint') {
                return '<div class="merchant-msg-actions">'
                     + '<div class="merchant-msg-btns">'
                     +   '<button class="merchant-msg-btn accept" onclick="merchantAcceptRefund()">✅ 同意退款</button>'
                     +   '<button class="merchant-msg-btn counter" onclick="merchantOfferCompensation()">🎁 补偿协商</button>'
                     +   '<button class="merchant-msg-btn reject" onclick="merchantRejectRefund()">❌ 拒绝退款</button>'
                     + '</div></div>';
            }
            // inquiry 咨询只需要继续对话，无特殊按钮
            return '<div class="merchant-msg-actions">'
                 + '<div class="merchant-msg-btns">'
                 +   '<button class="merchant-msg-btn counter" onclick="merchantPushBuy()">💡 推荐购买</button>'
                 +   '<button class="merchant-msg-btn reject" onclick="merchantCloseConversation()">⏹ 结束对话</button>'
                 + '</div></div>';
        }
        // 待发货
        if (m.status === 'dealing' && m.orderId) {
            // 已转为订单，等待发货
            return '<div class="merchant-msg-actions">'
                 + '<div class="merchant-msg-btns">'
                 +   '<button class="merchant-msg-btn accept" onclick="merchantShipOrder()">🚚 发货</button>'
                 + '</div></div>';
        }
        if (m.status === 'shipped') {
            return '<div class="merchant-msg-actions">'
                 + '<div class="merchant-msg-info">📦 已发货，物流单号：<b>'+(m.trackingNo||'')+'</b></div>'
                 + '<div class="merchant-msg-btns">'
                 +   '<button class="merchant-msg-btn counter" onclick="merchantAdvanceLogistics()">⏩ 推进物流</button>'
                 + '</div></div>';
        }
        if (m.status === 'done') {
            return '<div class="merchant-msg-actions merchant-msg-actions-done">'
                 + '<div class="merchant-msg-info">✅ 订单已完成</div>'
                 + (m.review
                     ? '<div class="merchant-review"><div class="merchant-review-stars">'+renderStars(m.review.rating)+'</div><div class="merchant-review-text">'+_esc(m.review.comment||'')+'</div></div>'
                     : '<button class="merchant-msg-btn counter" onclick="merchantRequestReview()">⭐ 催促评价</button>'
                   )
                 + '</div>';
        }
        if (m.status === 'refunded') {
            return '<div class="merchant-msg-actions">'
                 + '<div class="merchant-msg-info">💸 已退款 ¥'+Number(m.productPrice||0).toFixed(2)+'</div>'
                 + '</div>';
        }
        if (m.status === 'closed') {
            return '<div class="merchant-msg-actions"><div class="merchant-msg-info">对话已关闭</div></div>';
        }
        return '';
    }

    function renderStars(rating) {
        var html = '';
        for (var i = 1; i <= 5; i++) {
            html += '<i class="fas fa-star" style="color:'+(i<=rating?'#faad14':'#e5e5e5')+';"></i>';
        }
        return html;
    }

    // ==================== 玩家发送回复 ====================
    window.merchantSendReply = async function() {
        var input = document.getElementById('merchant-msg-input');
        if (!input) return;
        var text = (input.value||'').trim();
        if (!text) return;
        var m = _getMsg(currentMsgId);
        if (!m) return;
        input.value = '';
        input.disabled = true;

        // 追加我的消息
        m.replies.push({ role:'me', text: text, time: _now() });
        if (m.status === 'pending') m.status = 'dealing';
        m.updatedAt = _now();
        _save();
        renderMsgDetailModal();

        // 调 AI 生成顾客续写
        await generateCustomerReply(m);
        input.disabled = false;
        var newInput = document.getElementById('merchant-msg-input');
        if (newInput) newInput.focus();
    };

    async function generateCustomerReply(m, extraInstruction) {
        var customer = (store.contacts||[]).find(function(c){ return c.id === m.customerId; });
        if (!customer) return;

        // 显示"正在输入"提示
        var repliesEl = document.getElementById('merchant-msg-replies');
        if (repliesEl) {
            var typing = document.createElement('div');
            typing.id = 'merchant-typing-indicator';
            typing.className = 'merchant-bubble merchant-bubble-customer';
            typing.innerHTML = '<div class="merchant-bubble-avatar">'
                + (customer.avatar ? '<img src="'+customer.avatar+'">' : '<div class="merchant-msg-avatar-ph">'+(customer.name||'?').charAt(0)+'</div>')
                + '</div><div class="merchant-bubble-body"><span class="merchant-typing-dots"><span></span><span></span><span></span></span></div>';
            repliesEl.appendChild(typing);
            repliesEl.scrollTop = repliesEl.scrollHeight;
        }

        var aiCtx = (typeof getAiContext === 'function') ? getAiContext(customer) : ('你是' + customer.name + '。人设：' + customer.persona);
        var meta = ACTION_META[m.action] || {};
        // 拼出会话历史
        var convo = m.replies.slice(-8).map(function(r) {
            if (r.role === 'me') return '[店主]: ' + r.text;
            if (r.role === 'customer') return '[你('+customer.name+')]: ' + r.text;
            if (r.role === 'system') return '[系统]: ' + r.text;
            return r.text;
        }).join('\n');

        var extraCtx = '';
        if (m.action === 'bargain') extraCtx = '这次你是来砍价的，商品原价¥'+m.productPrice+'，你出价¥'+m.offerPrice+'。';
        else if (m.action === 'buy') extraCtx = '这次你要买「'+m.productName+'」，单价¥'+m.productPrice+'，数量'+m.qty+'件。';
        else if (m.action === 'complaint') extraCtx = '这次你对购买过的「'+m.productName+'」有意见，提出退货/售后。';
        else if (m.action === 'inquiry') extraCtx = '这次你来咨询「'+m.productName+'」。';

        var prompt = aiCtx + '\n\n'
                   + '【场景】你在购物App店铺「'+store.myStore.name+'」和店主'
                   + ((typeof getUserPersonaName==='function')?getUserPersonaName(customer, store.user.name||'用户'):(store.user.name||'店主'))
                   + '聊天。' + extraCtx + '\n\n'
                   + '【之前的对话】\n' + convo + '\n\n'
                   + '【任务】以「'+customer.name+'」的身份自然续写一句话回复。\n'
                   + (extraInstruction ? ('【特殊情境】'+extraInstruction+'\n') : '')
                   + '⚠️ 要求：\n'
                   + '1. 10-60字，口语化，符合你的人设和情绪\n'
                   + '2. 可能的反应：继续追问/犹豫/下决心买/放弃/生气/缠着店主/感谢等，由人设决定\n'
                   + '3. 严禁OOC，严禁AI腔，严禁"好的""没问题"这种机器感回复\n'
                   + '4. 只输出一句话对白，不要前缀和引号';

        var resp = await callShopAPI([{ role:'system', content: prompt }], { temperature: 0.9, max_tokens: 200 });
        var reply = (resp || '').trim().replace(/^[「『""]|[」』""]$/g,'').replace(/^\[.*?\][：:]\s*/,'');
        if (!reply) reply = '嗯，我再想想...';

        m.replies.push({ role:'customer', text: reply, time: _now() });
        m.updatedAt = _now();
        _save();
        renderMsgDetailModal();
    }

    // ==================== 砍价：同意 ====================
    window.merchantAcceptBargain = async function() {
        var m = _getMsg(currentMsgId);
        if (!m || m.action !== 'bargain') return;
        // 写入系统消息
        m.replies.push({ role:'system', text:'你同意以 ¥'+Number(m.offerPrice).toFixed(2)+' 成交' });
        m.replies.push({ role:'me', text:'行，就按这个价成交吧。' });
        // 创建订单
        convertToOrder(m, m.offerPrice);
        m.updatedAt = _now();
        _save();
        renderMsgDetailModal();
        await generateCustomerReply(m, '店主同意了你的砍价出价，你很开心/满意/意外，回复一句话表示成交确认');
    };

    window.merchantCounterBargain = async function() {
        var m = _getMsg(currentMsgId);
        if (!m) return;
        var input = prompt('还价多少钱？（当前¥'+m.productPrice+'，顾客出¥'+m.offerPrice+'）');
        if (input === null) return;
        var counter = parseFloat(input);
        if (isNaN(counter) || counter <= 0) return;
        if (counter < m.offerPrice) { alert('还价不能低于顾客出价'); return; }
        m.replies.push({ role:'me', text:'¥'+counter.toFixed(2)+'怎么样？' });
        m.offerPrice = counter; // 暂存新价
        m.updatedAt = _now();
        _save();
        renderMsgDetailModal();
        await generateCustomerReply(m, '店主还价到¥'+counter+'，根据你的人设和预算判断是接受还是继续砍，或者放弃走人');
    };

    window.merchantRejectBargain = async function() {
        var m = _getMsg(currentMsgId);
        if (!m) return;
        m.replies.push({ role:'me', text:'不好意思，这个价格没法卖~' });
        m.updatedAt = _now();
        _save();
        renderMsgDetailModal();
        await generateCustomerReply(m, '店主直接拒绝了你的砍价，根据你的人设反应：可能生气走人/再加点价/按原价买/嘲讽');
    };

    // ==================== 下单：确认/拒绝 ====================
    window.merchantAcceptOrder = async function() {
        var m = _getMsg(currentMsgId);
        if (!m || m.action !== 'buy') return;
        convertToOrder(m, m.productPrice);
        m.replies.push({ role:'system', text:'订单已创建，等待发货' });
        m.replies.push({ role:'me', text:'好的，已帮你下单，尽快发货！' });
        m.updatedAt = _now();
        _save();
        renderMsgDetailModal();
        await generateCustomerReply(m, '店主接单成功，你表达感谢/期待/催发货');
    };

    window.merchantRejectOrder = async function() {
        var m = _getMsg(currentMsgId);
        if (!m) return;
        m.status = 'closed';
        m.replies.push({ role:'me', text:'不好意思，这件暂时不能卖~' });
        m.updatedAt = _now();
        _save();
        renderMsgDetailModal();
        await generateCustomerReply(m, '店主拒绝了你的订单，根据人设生气/无奈/失望');
    };

    // ==================== 转为订单 ====================
    function convertToOrder(m, finalPrice) {
        var s = store.myStore;
        var orderId = 'order_' + _now() + '_' + Math.random().toString(36).slice(2,6);
        m.orderId = orderId;
        m.orderStatus = 'waiting_ship';
        m.status = 'dealing';
        m.finalPrice = finalPrice;
        // 扣库存
        var prod = (s.products||[]).find(function(p){ return p.id === m.productId; });
        if (prod) {
            prod.stock = Math.max(0, prod.stock - (m.qty||1));
            if (prod.stock === 0) prod.status = 'sold_out';
        }
        // [FIX-订单同步] 同步写入 store.shopOrders，让买家侧订单管理页也能看到
        if (!store.shopOrders) store.shopOrders = [];
        var customerContact = (store.contacts||[]).find(function(c){ return c.id === m.customerId; });
        store.shopOrders.unshift({
            id: orderId,
            source: 'merchant',
            sellerName: s.name || '我的店铺',
            items: [{
                productId: m.productId,
                name: m.productName || '商品',
                price: finalPrice,
                qty: m.qty || 1,
                image: prod && prod.images ? prod.images[0] : '',
                emoji: prod ? prod.emoji : ''
            }],
            total: finalPrice * (m.qty || 1),
            status: 'waiting_ship',
            payMethod: 'wallet',
            buyerName: m.customerName || (customerContact ? customerContact.name : '顾客'),
            buyerId: m.customerId,
            address: _generateMerchantOrderAddress(customerContact),
            time: Date.now(),
            createdAt: Date.now(),
            msgId: m.id,
            logistics: null
        });
        _save();
    }

    // 为商家订单生成模拟收货地址
    function _generateMerchantOrderAddress(contact) {
        var cities = ['北京市朝阳区','上海市浦东新区','广州市天河区','深圳市南山区','杭州市西湖区','成都市武侯区','南京市鼓楼区','武汉市洪山区'];
        var streets = ['幸福路','和平大道','中山路','建设路','人民路','解放路','文化路','科技路'];
        var city = cities[Math.floor(Math.random()*cities.length)];
        var street = streets[Math.floor(Math.random()*streets.length)];
        var num = Math.floor(Math.random()*200)+1;
        var name = contact ? contact.name : '顾客';
        return {
            name: name,
            phone: '1' + (Math.floor(Math.random()*9)+1) + Math.random().toString().slice(2,11),
            address: city + street + num + '号'
        };
    }

    // ==================== 订单状态同步工具 ====================
    // [FIX-订单同步] 将消息侧的订单状态变更同步到 store.shopOrders
    function _syncOrderToShop(m, updates) {
        if (!m || !m.orderId) return;
        var shopOrder = (store.shopOrders||[]).find(function(o){ return o.id === m.orderId; });
        if (!shopOrder) return;
        for (var key in updates) {
            if (updates.hasOwnProperty(key)) {
                shopOrder[key] = updates[key];
            }
        }
    }

    // ==================== 发货 ====================
    // [补丁6] 随机快递公司前缀，真实感更强
    var _COURIERS = ['YTO','ZTO','STO','SF','YD','JT'];
    var _COURIER_NAMES = {YTO:'圆通',ZTO:'中通',STO:'申通',SF:'顺丰',YD:'韵达',JT:'极兔'};
    window.merchantShipOrder = function() {
        var m = _getMsg(currentMsgId);
        if (!m || !m.orderId) return;
        var prefix = _COURIERS[Math.floor(Math.random()*_COURIERS.length)];
        var trackingNo = prefix + _now().toString().slice(-9) + Math.floor(Math.random()*100);
        m.trackingNo = trackingNo;
        m.orderStatus = 'shipping';
        m.status = 'shipped';
        // [补丁6] 发货时预置 3 条物流轨迹：已揽收→仓库已发出→正在运输
        var now = _now();
        m.logistics = [
            { time: now,         text: '商家已发货（单号 '+trackingNo+'）' },
            { time: now + 1000,  text: '快递员已上门揽收' },
            { time: now + 2000,  text: '包裹已离开【发货地仓库】' }
        ];
        m.replies.push({ role:'system', text:'已发货，物流单号 '+trackingNo });
        m.replies.push({ role:'me', text:'宝贝已发出~ 单号 '+trackingNo+'，注意查收！' });
        m.updatedAt = _now();
        // [FIX-订单同步] 发货状态同步到 shopOrders
        var carrierName = (_COURIER_NAMES[prefix]||prefix) + '快递';
        _syncOrderToShop(m, {
            status: 'shipped',
            logistics: {
                carrier: carrierName,
                trackingNo: trackingNo,
                currentStep: 0,
                steps: [
                    { text: '商家已发货（单号 '+trackingNo+'）', time: now },
                    { text: '快递员已上门揽收', time: now + 30000 },
                    { text: '包裹已离开发货地仓库', time: now + 90000 },
                    { text: '包裹到达转运中心', time: now + 180000 },
                    { text: '包裹正在派送中', time: now + 300000 },
                    { text: '已签收，感谢使用', time: now + 420000 }
                ]
            }
        });
        _save();
        renderMsgDetailModal();
        if (typeof toast==='function') toast('🚚 已发货');
    };

    // ==================== 推进物流 ====================
    var LOGISTICS_STEPS = [
        '包裹已被揽件，正在打包',
        '包裹已到达中转仓',
        '包裹正在运输途中',
        '包裹到达本地分拣中心',
        '包裹派送中，配送员正在联系收件人',
        '包裹已签收，感谢使用'
    ];

    window.merchantAdvanceLogistics = async function() {
        var m = _getMsg(currentMsgId);
        if (!m || !m.logistics) return;
        var step = m.logistics.length - 1; // 已发货算step0
        if (step >= LOGISTICS_STEPS.length) {
            // 完成送达，生成顾客评价
            if (typeof toast==='function') toast('📦 已送达，生成评价中...');
            m.orderStatus = 'delivered';
            m.status = 'done';
            m.updatedAt = _now();
            // [FIX-订单同步] 送达状态同步
            _syncOrderToShop(m, { status: 'delivered' });
            _save();
            renderMsgDetailModal();
            await generateCustomerReview(m);
            return;
        }
        m.logistics.push({ time: _now(), text: LOGISTICS_STEPS[step] });
        if (step === LOGISTICS_STEPS.length - 1) {
            m.orderStatus = 'delivered';
            m.status = 'done';
            m.replies.push({ role:'system', text:'📦 包裹已签收' });
            m.replies.push({ role:'customer', text:'收到啦~' });
            // [FIX-订单同步] 送达状态同步
            _syncOrderToShop(m, { status: 'delivered' });
        } else {
            // [FIX-订单同步] 物流推进同步
            _syncOrderToShop(m, { status: 'shipped' });
        }
        m.updatedAt = _now();
        _save();
        renderMsgDetailModal();
    };

    // ==================== 顾客评价 ====================
    async function generateCustomerReview(m) {
        var customer = (store.contacts||[]).find(function(c){ return c.id === m.customerId; });
        if (!customer) return;
        var aiCtx = (typeof getAiContext === 'function') ? getAiContext(customer) : ('你是' + customer.name);
        var prompt = aiCtx + '\n\n'
                   + '【场景】你从「'+store.myStore.name+'」买的「'+m.productName+'」(¥'+m.finalPrice+')刚到货\n'
                   + '【任务】根据你的人设和用后感受，写一条评价\n'
                   + '【输出JSON(仅一个对象)】{"rating":1到5,"comment":"评价文字20-80字，你的口吻"}';
        var resp = await callShopAPI([{ role:'system', content: prompt }], { temperature:0.9, max_tokens:200 });
        var review = parseJSON(resp);
        if (!review) review = { rating: 5, comment: '收到了，还不错~' };
        review.rating = Math.max(1, Math.min(5, parseInt(review.rating)||5));
        review.time = _now();
        m.review = review;
        m.orderStatus = 'reviewed';
        // 店铺销量 / 收入 / 信用分更新
        var s = store.myStore;
        s.totalSales = (s.totalSales||0) + (m.qty||1);
        s.totalRevenue = (s.totalRevenue||0) + (m.finalPrice||0);
        // 评分影响信用分
        s.credit = Math.max(0, Math.min(150, (s.credit||100) + (review.rating - 3) * 1));
        // 商品累计销量
        var prod = (s.products||[]).find(function(p){ return p.id === m.productId; });
        if (prod) {
            prod.sales = (prod.sales||0) + (m.qty||1);
            if (!prod.reviews) prod.reviews = [];
            prod.reviews.push({
                customerId: m.customerId, customerName: m.customerName,
                customerAvatar: m.customerAvatar,
                rating: review.rating, comment: review.comment, time: review.time
            });
        }
        m.replies.push({ role:'customer', text: review.comment });
        m.replies.push({ role:'system', text:'顾客已评价 '+review.rating+'星' });
        m.updatedAt = _now();
        // [FIX-订单同步] 评价完成同步
        _syncOrderToShop(m, {
            status: 'reviewed',
            review: { stars: review.rating, text: review.comment }
        });
        _save();
        renderMsgDetailModal();
    }

    window.merchantRequestReview = async function() {
        var m = _getMsg(currentMsgId);
        if (!m) return;
        m.replies.push({ role:'me', text:'亲，方便给个评价吗~' });
        _save();
        renderMsgDetailModal();
        await generateCustomerReply(m, '店主催促你评价，根据人设决定现在就评还是敷衍一下');
        // 再生成正式评价
        await generateCustomerReview(m);
    };

    // ==================== 售后 / 退货 ====================
    window.merchantAcceptRefund = async function() {
        var m = _getMsg(currentMsgId);
        if (!m) return;
        m.status = 'refunded';
        m.orderStatus = 'refunded';
        m.replies.push({ role:'me', text:'好的，已发起退款，很抱歉影响您的购物体验' });
        var refundAmt = Number(m.finalPrice||m.productPrice||0);
        m.replies.push({ role:'system', text:'已退款 ¥'+refundAmt.toFixed(2) });
        // 退钱 / 减信用
        var s = store.myStore;
        s.totalRevenue = Math.max(0, (s.totalRevenue||0) - refundAmt);
        s.credit = Math.max(0, (s.credit||100) - 2);
        m.updatedAt = _now();
        // [FIX-订单同步] 退款状态同步到 shopOrders，并退款到买家钱包
        _syncOrderToShop(m, { status: 'refunded' });
        // 退款到买家钱包（模拟）
        if (typeof store.walletBalance === 'number') {
            store.walletBalance += refundAmt;
            if (!store.walletHistory) store.walletHistory = [];
            store.walletHistory.unshift({ id: 'wh_' + Date.now(), type: 'refund', amount: refundAmt, desc: '商家退款·' + (m.productName||''), time: Date.now() });
        }
        _save();
        renderMsgDetailModal();
        await generateCustomerReply(m, '店主同意退款，你的反应(宽容/仍不满/道谢等)');
    };

    window.merchantOfferCompensation = async function() {
        var m = _getMsg(currentMsgId);
        if (!m) return;
        var input = prompt('要补偿多少钱？（例如 5、10、20）', '10');
        if (input === null) return;
        var amt = parseFloat(input);
        if (isNaN(amt) || amt < 0) return;
        m.replies.push({ role:'me', text:'非常抱歉，我补偿你¥'+amt.toFixed(2)+'，可以吗？' });
        m.updatedAt = _now();
        _save();
        renderMsgDetailModal();
        await generateCustomerReply(m, '店主提出补偿¥'+amt+'，根据人设接受/继续要求退货/嫌少');
    };

    window.merchantRejectRefund = async function() {
        var m = _getMsg(currentMsgId);
        if (!m) return;
        m.replies.push({ role:'me', text:'不好意思，这个情况我们不支持退货~' });
        m.updatedAt = _now();
        _save();
        renderMsgDetailModal();
        await generateCustomerReply(m, '店主拒绝退款，你的反应(生气/威胁差评/妥协/破口大骂)');
    };

    // ==================== 咨询阶段辅助按钮 ====================
    window.merchantPushBuy = async function() {
        var m = _getMsg(currentMsgId);
        if (!m) return;
        m.replies.push({ role:'me', text:'要不现在下单吧，今天下单给你优惠~' });
        m.updatedAt = _now();
        _save();
        renderMsgDetailModal();
        await generateCustomerReply(m, '店主推荐你马上下单，根据人设决定：下单/犹豫/砍价/放弃');
    };

    window.merchantCloseConversation = function() {
        var m = _getMsg(currentMsgId);
        if (!m) return;
        m.status = 'closed';
        m.replies.push({ role:'system', text:'对话已关闭' });
        m.updatedAt = _now();
        _save();
        renderMsgDetailModal();
    };

    // ==================== 覆写 renderMessagesList 提供给 merchant 模块使用 ====================
    // Stage 1 中的 renderMessagesList 是占位符，这里在 app-shop-merchant.js 的作用域外
    // 我们通过暴露 renderMerchantMessagesList 让 merchant 模块的 renderMessagesList 调用
    // 需要在 app-shop-merchant.js 中调用这个函数。以下为 monkey-patch
    // 原模块的 renderMessagesList 函数并未导出到window,所以这里直接在merchant渲染时注入

    // ==================== Patch Stage 1: renderMessagesList ====================
    // 覆写 getMerchantHTML 在 messages 视图下的 body 输出
    (function patchMerchantRender() {
        var attempt = 0;
        var timer = setInterval(function() {
            attempt++;
            if (attempt > 50) { clearInterval(timer); return; }
            if (typeof window.renderMerchantLayer !== 'function') return;
            // 通过 hook MutationObserver 方式太复杂，这里用简单的：
            // 当 layer 渲染完成后，如果 merchant-body 里出现 "Stage 2 上线后" 就替换
            // 但这样会有闪烁，更好方案：merchant-module 的 renderMessagesList 应该直接调用 window.renderMerchantMessagesList
            // 已在 app-shop-merchant.js 里暴露占位 renderMessagesList，改用事件驱动
            clearInterval(timer);
        }, 100);
    })();

})();
