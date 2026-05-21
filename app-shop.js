        // ========== SHOP APP ==========
        const SHOP_CATEGORIES = ['推荐', '衣服', '美妆', '食品', '鞋包'];
        let shopActiveCate = '推荐';
        let shopRefreshing = false;
        let shopActiveTab = 'home';

        // ===== 每个类别20张随机商品图片 =====
        const SHOP_CATEGORY_IMAGES = {
            '衣服': Array.from({length:20}, (_,i) => `https://picsum.photos/seed/cloth${i+1}/400/400`),
            '美妆': Array.from({length:20}, (_,i) => `https://picsum.photos/seed/beauty${i+1}/400/400`),
            '食品': Array.from({length:20}, (_,i) => `https://picsum.photos/seed/food${i+1}/400/400`),
            '鞋包': Array.from({length:20}, (_,i) => `https://picsum.photos/seed/bag${i+1}/400/400`)
        };
        function getRandomProductImage(category) {
            const pool = SHOP_CATEGORY_IMAGES[category] || SHOP_CATEGORY_IMAGES['衣服'];
            return pool[Math.floor(Math.random() * pool.length)];
        }

        function renderShop() {
            shopActiveCate = '推荐';
            shopActiveTab = 'home';
            if (!store.shopProducts) store.shopProducts = [];
            if (!store.shopCart) store.shopCart = [];
            if (!store.shopOrders) store.shopOrders = [];
            if (!store.shopAddresses) store.shopAddresses = [];
            if (!store.shopFavorites) store.shopFavorites = [];
            if (!store.shopCustomProducts) store.shopCustomProducts = [];
            if (store.shopCustomPrompt === undefined) store.shopCustomPrompt = '';
            renderShopCategories();
            renderShopProducts();
            updateCartBadge();
            shopSwitchTab('home');
        }

        function shopSwitchTab(tab) {
            shopActiveTab = tab;
            ['home','cart','orders','me'].forEach(t => {
                const el = document.getElementById('shop-tab-' + t);
                if (el) { el.classList.remove('active'); el.style.display = 'none'; }
            });
            const searchPanel = document.getElementById('shop-search-panel');
            if (searchPanel) searchPanel.style.display = 'none';

            const activeEl = document.getElementById('shop-tab-' + tab);
            if (activeEl) { activeEl.classList.add('active'); activeEl.style.display = 'block'; }

            document.querySelectorAll('.shop-bottom-tab').forEach((el, i) => {
                const tabs = ['home','cart','orders','me'];
                el.classList.toggle('active', tabs[i] === tab);
            });

            const titles = { home: '购物', cart: '购物车', orders: '我的订单', me: '我的' };
            const titleEl = document.getElementById('shop-nav-title');
            if (titleEl) titleEl.textContent = titles[tab] || '购物';

            if (tab === 'cart') renderShopCart();
            if (tab === 'orders') renderShopOrders();
            if (tab === 'home') {
                renderShopProducts();
                updateCartBadge();
                // [好友二手] 渲染Feed
                if (typeof renderFriendsSHFeed === 'function') {
                    try { renderFriendsSHFeed(); } catch(e) { console.warn(e); }
                }
            }
            if (tab === 'me') renderShopMe();
        }

        function shopShowSearch() {
            ['home','cart','orders','me'].forEach(t => {
                const el = document.getElementById('shop-tab-' + t);
                if (el) el.style.display = 'none';
            });
            const panel = document.getElementById('shop-search-panel');
            if (panel) { panel.style.display = 'block'; }
            const input = document.getElementById('shop-search-input');
            if (input) { input.value = ''; input.focus(); }
            shopRenderSearchResults('');
        }

        function shopHideSearch() {
            const panel = document.getElementById('shop-search-panel');
            if (panel) panel.style.display = 'none';
            shopSwitchTab(shopActiveTab || 'home');
        }

        function shopRenderSearchResults(query) {
            const container = document.getElementById('shop-search-results');
            if (!container) return;
            let products = (store.shopProducts || []).slice();
            if (query) {
                const q = query.toLowerCase();
                products = products.filter(p => (p.name||'').toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q));
            }
            if (products.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:40px; color:#999;"><i class="fas fa-search" style="font-size:36px; color:#ddd; margin-bottom:12px; display:block;"></i><p>${query ? '没有找到相关商品' : '输入关键词搜索'}</p></div>`;
                return;
            }
            container.innerHTML = products.map(p => {
                const img = (p.images && p.images[0]) || '';
                return `<div class="shop-search-card" onclick="openShopDetail('${p.id}')">
                    <div class="shop-search-card-img">${img ? `<img src="${img}">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f5f5f5;"><i class="fas fa-image" style="font-size:24px;color:#ddd;"></i></div>`}</div>
                    <div class="shop-search-card-info">
                        <div class="shop-search-card-name">${escapeHtml(p.name||'')}</div>
                        <div class="shop-search-card-meta">${escapeHtml(p.desc||'')}</div>
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">
                            <div class="shop-search-card-price">¥${Number(p.price||0).toFixed(2)}</div>
                            <div style="display:flex;gap:6px;">
                                <button onclick="event.stopPropagation();addToCart('${p.id}')" class="shop-search-btn" style="font-size:12px;padding:4px 10px;border-radius:12px;"><i class="fas fa-cart-plus"></i></button>
                                <button onclick="event.stopPropagation();shopBuyNow('${p.id}')" class="shop-search-btn" style="font-size:12px;padding:4px 10px;border-radius:12px;">购买</button>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        // Search via API - generate products matching query
        async function shopDoSearch() {
            const input = document.getElementById('shop-search-input');
            const query = (input ? input.value : '').trim();
            if (!query) {
                shopRenderSearchResults('');
                return;
            }
            // 确保搜索面板可见
            ['home','cart','orders','me'].forEach(t => {
                const el = document.getElementById('shop-tab-' + t);
                if (el) el.style.display = 'none';
            });
            const panel = document.getElementById('shop-search-panel');
            if (panel) panel.style.display = 'block';

            // First try local filter
            const localResults = (store.shopProducts || []).filter(p => {
                const q = query.toLowerCase();
                return (p.name||'').toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q);
            });
            if (localResults.length > 0) {
                shopRenderSearchResults(query);
                return;
            }
            // No local results - call API to generate matching products
            const url = store.system?.url;
            const key = store.system?.key;
            if (!url || !key) {
                toast('请先配置API');
                shopRenderSearchResults(query);
                return;
            }
            const container = document.getElementById('shop-search-results');
            if (container) container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:#4facfe;"></i><p style="margin-top:8px;">正在搜索...</p></div>';

            const SHOP_IMG_MAP = {
                '衣服': ['dress','jacket','tshirt','sweater','coat','jeans','hoodie','shirt','blouse','skirt','cardigan','vest'],
                '美妆': ['lipstick','perfume','skincare','makeup','cream','serum','mascara','foundation','blush','eyeshadow','nail-polish','moisturizer'],
                '食品': ['chocolate','snack','cookie','candy','tea','coffee','fruit','cake','bread','cheese','honey','nuts'],
                '鞋包': ['sneakers','handbag','boots','heels','backpack','wallet','sandals','loafers','clutch','tote','satchel','crossbody']
            };
            function getSearchImg(category) {
                return getRandomProductImage(category);
            }

            const shopCustom = (store.shopCustomPrompt || '').trim();
            const shopCustomStr = shopCustom ? '\n用户自定义要求：' + shopCustom : '';
            const prompt = `用户搜索"${query}"，请生成6个与此搜索相关的商品，返回JSON数组，每个商品包含name(商品名)、price(价格数字)、desc(一句话描述)、category(类别，必须从以下选择：衣服、美妆、食品、鞋包)。${shopCustomStr}\n只返回JSON数组，不要其他文字。不要用markdown代码块包裹。不要包含image字段。`;

            try {
                // 使用副API场景（如果配置了shop场景）
                const data = await (API.withScene ? API.withScene('shop', () => API.chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.9 })) : API.chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.9 }));
                if (!data || !data.choices || !data.choices[0]) throw new Error('API返回格式异常');
                let text = (data.choices[0].message && data.choices[0].message.content) || '';
                text = text.replace(/```[\s\S]*?```/g, function(m) {
                    return m.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?\s*```$/, '');
                });
                text = text.replace(/```(?:json|JSON)?\s*/gi, '').replace(/```\s*/g, '').trim();
                const match = text.match(/\[[\s\S]*?\](?=[^[\]]*$)/) || text.match(/\[[\s\S]*\]/);
                if (!match) throw new Error('未找到JSON数组');
                let items;
                let jsonStr = match[0];
                try {
                    items = JSON.parse(jsonStr);
                } catch (e) {
                    let fixed = jsonStr.replace(/,\s*([}\]])/g, '$1').replace(/'/g, '"').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
                    try { items = JSON.parse(fixed); } catch(e2) {
                        const objMatches = jsonStr.match(/\{[^{}]*\}/g);
                        if (objMatches && objMatches.length > 0) {
                            items = objMatches.map(o => { try { return JSON.parse(o.replace(/'/g, '"').replace(/,\s*}/g, '}')); } catch(e3) { return null; } }).filter(Boolean);
                        }
                        if (!items || items.length === 0) throw new Error('数据解析失败');
                    }
                }
                if (!Array.isArray(items) || items.length === 0) throw new Error('返回数据为空');

                items.forEach(item => {
                    const itemCat = SHOP_CATEGORIES.includes(item.category) ? item.category : '衣服';
                    store.shopProducts.push({
                        id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        name: item.name || '商品',
                        price: Number(item.price) || 9.9,
                        desc: item.desc || '',
                        category: itemCat,
                        images: [getSearchImg(itemCat)],
                        seller: 'YAN商城',
                        sellerAvatar: '',
                        fav: false,
                        createdAt: Date.now()
                    });
                });
                save();
                shopRenderSearchResults(query);
                toast('找到 ' + items.length + ' 个相关商品');
            } catch (e) {
                console.error('Shop search error:', e);
                toast('搜索失败: ' + (e.message || '请重试'));
                shopRenderSearchResults(query);
            }
        }

        function renderShopCategories() {
            const el = document.getElementById('shop-categories');
            if (!el) return;
            el.innerHTML = SHOP_CATEGORIES.map(c =>
                `<div onclick="setShopCategory('${c}')" class="shop-cate-chip ${shopActiveCate === c ? 'active' : ''}">${c}</div>`
            ).join('');
        }

        function setShopCategory(c) {
            shopActiveCate = c;
            window.shopActiveCate = c;
            renderShopCategories();
            renderShopProducts();
        }

        function renderShopProducts() {
            const grid = document.getElementById('shop-product-grid');
            const empty = document.getElementById('shop-empty');
            const search = (document.getElementById('shop-search-input')?.value || '').toLowerCase();
            let products = (store.shopProducts || []).slice();

            // 混入用户自定义商品
            var customs = (store.shopCustomProducts || []).map(function(cp) {
                return Object.assign({}, cp, { isCustom: true });
            });
            products = products.concat(customs);

            if (shopActiveCate !== '推荐') {
                products = products.filter(p => p.category === shopActiveCate);
            }
            if (search) {
                products = products.filter(p => (p.name || '').toLowerCase().includes(search) || (p.desc || '').toLowerCase().includes(search));
            }

            // 打乱自定义商品的位置（不完全排序，让自定义商品随机散布）
            products.sort((a, b) => {
                if (a.isCustom && !b.isCustom) return Math.random() > 0.5 ? -1 : 1;
                if (!a.isCustom && b.isCustom) return Math.random() > 0.5 ? -1 : 1;
                return (b.createdAt || 0) - (a.createdAt || 0);
            });

            if (products.length === 0) {
                grid.innerHTML = '';
                empty.style.display = '';
                return;
            }
            empty.style.display = 'none';

            grid.innerHTML = products.map(p => {
                const img = (p.images && p.images[0]) || '';
                const isFav = (store.shopFavorites || []).includes(p.id);
                return `<div class="shop-card" onclick="openShopDetail('${p.id}')">
                    <div class="shop-card-img-wrap">
                        ${img ? `<img src="${img}" alt="${escapeHtml(p.name||'')}">` : `<div class="shop-card-img-placeholder"><i class="fas fa-image"></i></div>`}
                        <div class="shop-card-fav" onclick="event.stopPropagation();shopToggleFav('${p.id}')"><i class="${isFav ? 'fas' : 'far'} fa-heart" style="color:${isFav ? '#ff4d4f' : 'rgba(0,0,0,0.3)'}"></i></div>
                    </div>
                    <div class="shop-card-info">
                        <div class="shop-card-name">${escapeHtml(p.name || '')}</div>
                        <div class="shop-card-desc">${escapeHtml(p.desc || '')}</div>
                        <div class="shop-card-bottom">
                            <div class="shop-card-price">¥${Number(p.price || 0).toFixed(2)}</div>
                            <button class="shop-card-cart-btn" onclick="event.stopPropagation();addToCart('${p.id}')"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        function filterShopProducts() {
            renderShopProducts();
        }

        // API refresh - generate products via configured LLM
        async function shopRefreshProducts() {
            if (shopRefreshing) {
                // 安全机制：如果超过30秒还在刷新状态，强制重置
                if (window._shopRefreshStart && Date.now() - window._shopRefreshStart > 30000) {
                    shopRefreshing = false;
                    console.warn('shopRefreshProducts: force reset stale lock');
                } else {
                    return;
                }
            }
            const url = store.system && store.system.url;
            const key = store.system && store.system.key;
            const model = store.system && store.system.model;
            if (!url || !key) return toast('请先在设置中配置API');

            shopRefreshing = true;
            window._shopRefreshStart = Date.now();
            const fab = document.querySelector('.shop-fab-refresh');
            if (fab) fab.classList.add('spinning');

            const catLabel = shopActiveCate === '推荐' ? '各类热门' : shopActiveCate;
            const SHOP_IMG_MAP = {
                '衣服': ['dress','jacket','tshirt','sweater','coat','jeans','hoodie','shirt','blouse','skirt','cardigan','vest'],
                '美妆': ['lipstick','perfume','skincare','makeup','cream','serum','mascara','foundation','blush','eyeshadow','nail-polish','moisturizer'],
                '食品': ['chocolate','snack','cookie','candy','tea','coffee','fruit','cake','bread','cheese','honey','nuts'],
                '鞋包': ['sneakers','handbag','boots','heels','backpack','wallet','sandals','loafers','clutch','tote','satchel','crossbody']
            };
            function getShopImg(category) {
                return getRandomProductImage(category);
            }
            const shopCustom2 = (store.shopCustomPrompt || '').trim();
            const shopCustomStr2 = shopCustom2 ? '\n用户自定义要求：' + shopCustom2 : '';
            const prompt = `你是一个电商商品数据生成器。请生成6个${catLabel}类商品的JSON数组，每个商品包含name(商品名)、price(价格数字)、desc(一句话描述)、category(分类，从以下选择：衣服、美妆、食品、鞋包)。${shopCustomStr2}\n只返回JSON数组，不要其他文字。不要用markdown代码块包裹。不要包含image字段。`;

            try {
                // 使用副API场景（如果配置了shop场景）
                const data = await (API.withScene ? API.withScene('shop', () => API.chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.9 })) : API.chatCompletion([{ role: 'user', content: prompt }], { temperature: 0.9 }));
                if (!data || !data.choices || !data.choices[0]) throw new Error('API返回格式异常');
                let text = (data.choices[0].message && data.choices[0].message.content) || '';
                // Strip markdown code fences robustly
                text = text.replace(/```[\s\S]*?```/g, function(m) {
                    return m.replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?\s*```$/, '');
                });
                text = text.replace(/```(?:json|JSON)?\s*/gi, '').replace(/```\s*/g, '').trim();
                // Extract JSON array from response (use non-greedy inner match)
                const match = text.match(/\[[\s\S]*?\](?=[^[\]]*$)/) || text.match(/\[[\s\S]*\]/);
                if (!match) throw new Error('无法解析数据：未找到JSON数组');
                let items;
                let jsonStr = match[0];
                try {
                    items = JSON.parse(jsonStr);
                } catch (parseErr) {
                    try {
                        // Fix trailing commas, single quotes, unescaped newlines
                        let fixed = jsonStr
                            .replace(/,\s*([}\]])/g, '$1')
                            .replace(/'/g, '"')
                            .replace(/\n/g, '\\n')
                            .replace(/\t/g, '\\t');
                        items = JSON.parse(fixed);
                    } catch (parseErr2) {
                        try {
                            // Last resort: extract individual objects and rebuild array
                            const objMatches = jsonStr.match(/\{[^{}]*\}/g);
                            if (objMatches && objMatches.length > 0) {
                                items = objMatches.map(o => {
                                    try { return JSON.parse(o.replace(/'/g, '"').replace(/,\s*}/g, '}')); }
                                    catch(e) { return null; }
                                }).filter(Boolean);
                                if (items.length === 0) throw new Error('无法解析任何商品数据');
                            } else {
                                throw new Error('JSON格式异常');
                            }
                        } catch (parseErr3) {
                            throw new Error('数据解析失败: ' + parseErr.message);
                        }
                    }
                }
                if (!Array.isArray(items) || items.length === 0) throw new Error('返回数据为空或格式错误');

                items.forEach(item => {
                    const itemCat = SHOP_CATEGORIES.includes(item.category) ? item.category : '衣服';
                    store.shopProducts.push({
                        id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        name: item.name || '商品',
                        price: Number(item.price) || 9.9,
                        desc: item.desc || '',
                        category: itemCat,
                        images: [getShopImg(itemCat)],
                        seller: 'YAN商城',
                        sellerAvatar: '',
                        fav: false,
                        createdAt: Date.now()
                    });
                });
                save();
                renderShopProducts();
                toast('已刷新 ' + items.length + ' 个商品');
            } catch (e) {
                console.error('Shop refresh error:', e);
                toast('刷新失败: ' + (e.message || '网络错误'));
            } finally {
                shopRefreshing = false;
                window._shopRefreshStart = 0;
                if (fab) fab.classList.remove('spinning');
            }
        }

        function openShopDetail(id) {
            const p = (store.shopProducts || []).find(x => x.id === id);
            if (!p) return;
            const content = document.getElementById('shop-detail-content');
            const inCart = (store.shopCart || []).find(c => c.productId === id);
            const isFav = (store.shopFavorites || []).includes(id);

            const _catColors = {'衣服':'#667eea','美妆':'#f093fb','食品':'#4facfe','鞋包':'#43e97b'};
            const _bgColor = _catColors[p.category] || '#667eea';
            const _catEmoji = p.category==='衣服'?'👗':p.category==='美妆'?'💄':p.category==='食品'?'🍰':p.category==='鞋包'?'👜':'🛍️';

            content.innerHTML = `
                <div style="position:relative;">
                    <div style="width:100%; aspect-ratio:1; background:linear-gradient(135deg,${_bgColor}22,${_bgColor}11); display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <div style="font-size:72px; margin-bottom:12px;">${_catEmoji}</div>
                        <div style="font-size:16px; color:#666; font-weight:500;">${escapeHtml(p.category || '商品')}</div>
                    </div>
                    <div onclick="shopToggleFav('${id}');openShopDetail('${id}')" style="position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <i class="${isFav?'fas':'far'} fa-heart" style="color:${isFav?'#ff4d4f':'#999'};font-size:16px;"></i>
                    </div>
                    <div onclick="document.getElementById('modal-shop-detail').style.display='none'" style="position:absolute;top:12px;left:12px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                        <i class="fas fa-times" style="color:#333;font-size:16px;"></i>
                    </div>
                </div>
                <div style="padding:20px;">
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-size:24px; color:#fa5151; font-weight:700;">¥${Number(p.price || 0).toFixed(2)}</span>
                        <span style="font-size:12px;color:#999;text-decoration:line-through;">¥${(Number(p.price||0)*1.5).toFixed(2)}</span>
                        <span style="font-size:11px;color:#fff;background:#fa5151;padding:1px 6px;border-radius:3px;">省¥${(Number(p.price||0)*0.5).toFixed(2)}</span>
                    </div>
                    <div style="font-size:16px; font-weight:600; margin-top:10px; color:#222; line-height:1.4;">${escapeHtml(p.name || '')}</div>
                    <div style="font-size:13px; color:#888; margin-top:8px; line-height:1.6;">${escapeHtml(p.desc || '暂无描述')}</div>

                    <div style="margin-top:16px;padding:14px;background:#fafafa;border-radius:12px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <div style="width:36px;height:36px;border-radius:50%;background:#eee;display:flex;align-items:center;justify-content:center;">
                                ${p.sellerAvatar ? `<img src="${p.sellerAvatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : `<i class="fas fa-store" style="color:#999;font-size:14px;"></i>`}
                            </div>
                            <div style="flex:1;">
                                <div style="font-size:14px;font-weight:500;color:#333;">${escapeHtml(p.seller || 'YAN商城')}</div>
                                <div style="font-size:11px;color:#999;">官方自营 · 正品保障</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top:16px;padding:12px 14px;background:#f0faf0;border-radius:10px;font-size:12px;color:#52c41a;">
                        <i class="fas fa-truck"></i> 包邮 · 预计3-5天送达 · 7天无理由退换
                    </div>

                    <div style="display:flex; gap:10px; margin-top:20px;">
                        <button onclick="addToCart('${id}')" style="flex:1; padding:14px; border:2px solid #fa5151; background:#fff; color:#fa5151; border-radius:12px; font-size:14px; font-weight:600;">
                            <i class="fas fa-cart-plus"></i> ${inCart ? '已加购' : '加购物车'}
                        </button>
                        <button onclick="shopBuyNow('${id}')" style="flex:1; padding:14px; border:none; background:linear-gradient(135deg,#fa5151,#ff6b6b); color:#fff; border-radius:12px; font-size:14px; font-weight:600;">
                            立即购买
                        </button>
                    </div>
                    <div style="text-align:center;margin-top:12px;">
                        <span onclick="shopCopayFromDetail('${id}')" style="color:#576b95;font-size:13px;cursor:pointer;"><i class="fas fa-user-friends"></i> 找好友代付</span>
                    </div>
                </div>
            `;
            document.getElementById('modal-shop-detail').style.display = 'flex';
        }

        function addToCart(id) {
            if (!store.shopCart) store.shopCart = [];
            const existing = store.shopCart.find(c => c.productId === id);
            if (existing) {
                existing.qty++;
            } else {
                store.shopCart.push({ productId: id, qty: 1 });
            }
            save();
            updateCartBadge();
            renderShopProducts();
            toast('已加入购物车');
        }

        function removeFromCart(id) {
            if (!store.shopCart) return;
            store.shopCart = store.shopCart.filter(c => c.productId !== id);
            save();
            updateCartBadge();
            if (shopActiveTab === 'cart') renderShopCart();
        }

        function updateCartQty(id, delta) {
            const item = (store.shopCart || []).find(c => c.productId === id);
            if (!item) return;
            item.qty = Math.max(1, item.qty + delta);
            save();
            updateCartBadge();
            if (shopActiveTab === 'cart') renderShopCart();
        }

        function updateCartBadge() {
            const badge = document.getElementById('shop-tab-cart-badge');
            const count = (store.shopCart || []).reduce((s, c) => s + c.qty, 0);
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? '' : 'none';
            }
        }

        function shopToggleFav(id) {
            if (!store.shopFavorites) store.shopFavorites = [];
            const idx = store.shopFavorites.indexOf(id);
            if (idx >= 0) {
                store.shopFavorites.splice(idx, 1);
                toast('已取消收藏');
            } else {
                store.shopFavorites.push(id);
                toast('已收藏');
                // [FIX-v2] 不再群发收藏消息给所有联系人
                // 联系人会在聊天时主动读取用户收藏的商品并提起话题
                // 收藏信息存储在 store.shopFavorites 中，联系人通过 getShopFavContext() 获取
            }
            save();
            renderShopProducts();
        }

        // [NEW] 联系人主动读取用户收藏商品的上下文（供AI聊天时使用）
        window.getShopFavContext = function(contactId) {
            const favIds = store.shopFavorites || [];
            if (favIds.length === 0) return '';
            const favProducts = favIds.slice(-5).map(fid => (store.shopProducts || []).find(p => p.id === fid)).filter(Boolean);
            if (favProducts.length === 0) return '';
            const favList = favProducts.map(p => `「${p.name}」(¥${p.price})`).join('、');
            return `\n[用户最近收藏的商品: ${favList}] (你可以在合适的时机自然地提起这些商品，比如问用户是否要买、推荐搭配等，但不要每次都提，要自然随意)`;
        };

        function shopBuyNow(id) {
            const p = (store.shopProducts || []).find(x => x.id === id);
            if (!p) return;
            document.getElementById('modal-shop-detail').style.display = 'none';
            openShopCheckout([{ productId: id, qty: 1, price: p.price, name: p.name, image: (p.images&&p.images[0])||'' }]);
        }

        function shopCopayFromDetail(id) {
            const p = (store.shopProducts || []).find(x => x.id === id);
            if (!p) return;
            document.getElementById('modal-shop-detail').style.display = 'none';
            shopCopay([{ productId: id, qty: 1, price: p.price, name: p.name, image: (p.images&&p.images[0])||'' }]);
        }

        // ===== CART PAGE =====
        function renderShopCart() {
            const page = document.getElementById('shop-cart-page');
            if (!page) return;
            const cart = store.shopCart || [];
            if (cart.length === 0) {
                page.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#999;">
                    <i class="fas fa-shopping-cart" style="font-size:48px;color:#ddd;margin-bottom:16px;"></i>
                    <p style="font-size:15px;">购物车是空的</p>
                    <p style="font-size:12px;color:#bbb;margin-top:6px;">去首页逛逛吧</p>
                    <button onclick="shopSwitchTab('home')" style="margin-top:16px;padding:10px 24px;border:none;background:linear-gradient(135deg,#fa5151,#ff6b6b);color:#fff;border-radius:20px;font-size:14px;">去逛逛</button>
                </div>`;
                return;
            }

            let total = 0;
            let html = '';
            cart.forEach(item => {
                const p = (store.shopProducts || []).find(x => x.id === item.productId);
                if (!p) return;
                const subtotal = (p.price || 0) * item.qty;
                total += subtotal;
                const img = (p.images && p.images[0]) || '';
                html += `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;margin:8px 12px;background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
                    <div style="width:56px;height:56px;border-radius:8px;overflow:hidden;background:#f5f5f5;flex-shrink:0;">
                        ${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><i class="fas fa-image" style="color:#ddd;"></i></div>`}
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(p.name || '')}</div>
                        <div style="font-size:14px;color:#fa5151;font-weight:600;margin-top:3px;">¥${Number(p.price || 0).toFixed(2)}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <button onclick="updateCartQty('${item.productId}',-1)" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;border-radius:6px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
                        <span style="font-size:14px;min-width:20px;text-align:center;">${item.qty}</span>
                        <button onclick="updateCartQty('${item.productId}',1)" style="width:24px;height:24px;border:1px solid #ddd;background:#fff;border-radius:6px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>
                    </div>
                    <div onclick="removeFromCart('${item.productId}')" style="padding:6px;cursor:pointer;color:#ccc;"><i class="fas fa-trash-alt" style="font-size:13px;"></i></div>
                </div>`;
            });

            html += `<div class="shop-cart-footer">
                <div class="shop-cart-total">合计: <span style="color:#fa5151;font-size:20px;font-weight:700;">¥${total.toFixed(2)}</span></div>
                <button class="shop-cart-checkout-btn" onclick="checkoutCart()">结算 (${cart.reduce((s,c)=>s+c.qty,0)})</button>
            </div>`;
            page.innerHTML = html;
        }

        function checkoutCart() {
            const cart = store.shopCart || [];
            if (cart.length === 0) return toast('购物车是空的');
            const items = cart.map(item => {
                const p = (store.shopProducts || []).find(x => x.id === item.productId);
                if (!p) return null;
                return { productId: item.productId, qty: item.qty, price: p.price, name: p.name, image: (p.images && p.images[0]) || '' };
            }).filter(Boolean);
            if (items.length === 0) return toast('商品不存在');
            openShopCheckout(items);
        }

        function openShopCheckout(items) {
            const content = document.getElementById('shop-checkout-content');
            if (!content) return;
            const total = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
            const addr = (store.shopAddresses || [])[0];
            const addrHtml = addr
                ? `<div style="padding:14px;background:#f9f9f9;border-radius:10px;margin-bottom:16px;">
                    <div style="font-weight:600;font-size:14px;">${escapeHtml(addr.name)} ${escapeHtml(addr.phone)}</div>
                    <div style="font-size:13px;color:#666;margin-top:4px;">${escapeHtml(addr.address)}</div>
                   </div>`
                : `<div onclick="shopShowAddress()" style="padding:14px;background:#fff3e0;border-radius:10px;margin-bottom:16px;cursor:pointer;text-align:center;color:#e67e22;">
                    <i class="fas fa-plus"></i> 添加收货地址
                   </div>`;

            let itemsHtml = items.map(i => `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f5f5f5;">
                <div style="width:50px;height:50px;border-radius:8px;overflow:hidden;background:#f5f5f5;flex-shrink:0;">
                    ${i.image ? `<img src="${i.image}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;"><i class="fas fa-image" style="color:#ddd;"></i></div>`}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(i.name || '')}</div>
                    <div style="font-size:13px;color:#999;margin-top:2px;">×${i.qty || 1}</div>
                </div>
                <div style="font-size:14px;color:#fa5151;font-weight:600;">¥${(Number(i.price || 0) * (i.qty || 1)).toFixed(2)}</div>
            </div>`).join('');

            content.innerHTML = `
                <div style="font-size:13px;color:#999;margin-bottom:8px;">收货地址</div>
                ${addrHtml}
                <div style="font-size:13px;color:#999;margin-bottom:8px;">商品信息</div>
                <div style="background:#fff;border-radius:10px;padding:0 12px;margin-bottom:16px;">${itemsHtml}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-top:1px solid #f0f0f0;">
                    <span style="font-size:14px;color:#666;">合计</span>
                    <span style="font-size:22px;color:#fa5151;font-weight:700;">¥${total.toFixed(2)}</span>
                </div>
                <div style="font-size:13px;color:#999;margin-bottom:8px;margin-top:16px;">支付方式</div>
                <div id="shop-pay-method-area" style="margin-bottom:16px;">
                    <label onclick="document.querySelectorAll('.shop-pay-radio').forEach(r=>r.checked=false);this.querySelector('input').checked=true;" style="display:flex;align-items:center;padding:12px;background:#f9f9f9;border-radius:10px;margin-bottom:6px;cursor:pointer;">
                        <input type="radio" name="shop-pay-method" value="self" class="shop-pay-radio" checked style="margin-right:10px;accent-color:#fa5151;">
                        <i class="fas fa-wallet" style="color:#fa5151;margin-right:8px;font-size:16px;"></i>
                        <span style="flex:1;font-size:14px;">自付 (钱包支付)</span>
                    </label>
                    <label onclick="document.querySelectorAll('.shop-pay-radio').forEach(r=>r.checked=false);this.querySelector('input').checked=true;toggleFamilyCardSelect();" style="display:flex;align-items:center;padding:12px;background:#f9f9f9;border-radius:10px;margin-bottom:6px;cursor:pointer;">
                        <input type="radio" name="shop-pay-method" value="familyCard" class="shop-pay-radio" style="margin-right:10px;accent-color:#576b95;">
                        <i class="fas fa-users" style="color:#576b95;margin-right:8px;font-size:16px;"></i>
                        <span style="flex:1;font-size:14px;">亲属卡支付</span>
                    </label>
                    <div id="family-card-select" style="display:none;margin-left:36px;margin-bottom:6px;"></div>
                    <label onclick="document.querySelectorAll('.shop-pay-radio').forEach(r=>r.checked=false);this.querySelector('input').checked=true;toggleFamilyCardSelect();" style="display:flex;align-items:center;padding:12px;background:#f9f9f9;border-radius:10px;margin-bottom:6px;cursor:pointer;">
                        <input type="radio" name="shop-pay-method" value="gift" class="shop-pay-radio" style="margin-right:10px;accent-color:#f59e0b;">
                        <i class="fas fa-gift" style="color:#f59e0b;margin-right:8px;font-size:16px;"></i>
                        <span style="flex:1;font-size:14px;">送礼 (购买后赠送好友)</span>
                    </label>
                    <label onclick="document.querySelectorAll('.shop-pay-radio').forEach(r=>r.checked=false);this.querySelector('input').checked=true;toggleFamilyCardSelect();" style="display:flex;align-items:center;padding:12px;background:#f9f9f9;border-radius:10px;margin-bottom:6px;cursor:pointer;">
                        <input type="radio" name="shop-pay-method" value="copay" class="shop-pay-radio" style="margin-right:10px;accent-color:#576b95;">
                        <i class="fas fa-user-friends" style="color:#576b95;margin-right:8px;font-size:16px;"></i>
                        <span style="flex:1;font-size:14px;">好友代付</span>
                    </label>
                </div>
                <div style="display:flex;gap:10px;">
                    <button onclick="shopCheckoutPay(${JSON.stringify(items).replace(/"/g,'&quot;')}, ${total})" style="flex:1;padding:14px;border:none;background:linear-gradient(135deg,#fa5151,#ff6b6b);color:#fff;border-radius:12px;font-size:15px;font-weight:600;">确认支付 ¥${total.toFixed(2)}</button>
                </div>
            `;
            document.getElementById('modal-shop-checkout').style.display = 'flex';
        }

        function shopPayNow(items, total) {
            document.getElementById('modal-shop-checkout').style.display = 'none';
            // [FIX-支付流程] 钱包扣款：确保walletBalance已初始化
            if (typeof store.walletBalance !== 'number') store.walletBalance = 0;
            if (store.walletBalance < total) {
                // [FIX-支付引导] 余额不足时弹出引导弹窗，提供充值入口
                const _deficit = (total - store.walletBalance).toFixed(2);
                const _balanceStr = store.walletBalance.toFixed(2);
                const _overlay = document.createElement('div');
                _overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
                _overlay.innerHTML = '<div style="background:#fff;border-radius:16px;padding:24px;width:85%;max-width:340px;text-align:center;">'
                    + '<div style="font-size:40px;margin-bottom:12px;">💰</div>'
                    + '<div style="font-size:16px;font-weight:600;color:#333;margin-bottom:8px;">余额不足</div>'
                    + '<div style="font-size:13px;color:#999;margin-bottom:16px;">当前余额 ¥' + _balanceStr + '，还需 ¥' + _deficit + '</div>'
                    + '<div style="display:flex;gap:10px;">'
                    + '<button id="_shop_pay_cancel" style="flex:1;padding:12px;border:1px solid #ddd;background:#f5f5f5;color:#666;border-radius:10px;font-size:14px;cursor:pointer;">取消</button>'
                    + '<button id="_shop_pay_recharge" style="flex:1;padding:12px;border:none;background:linear-gradient(135deg,#fa5151,#ff6b6b);color:#fff;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">去充值</button>'
                    + '</div></div>';
                document.body.appendChild(_overlay);
                _overlay.querySelector('#_shop_pay_cancel').onclick = function() { _overlay.remove(); };
                _overlay.querySelector('#_shop_pay_recharge').onclick = function() {
                    _overlay.remove();
                    // 跳转到钱包页面
                    if (typeof openApp === 'function') { openApp('wallet'); }
                    else if (typeof openLayer === 'function') { openLayer('layer-wallet'); }
                    else { toast('请前往钱包充值', 'info'); }
                };
                return;
            }
            store.walletBalance -= total;
            if (!store.walletHistory) store.walletHistory = [];
            store.walletHistory.unshift({
                id: 'wh_' + Date.now(),
                type: 'pay',
                amount: -total,
                desc: '商城购物·' + items.map(i=>i.name).join(',').substring(0,20),
                time: Date.now()
            });
            if (!store.shopOrders) store.shopOrders = [];
            const order = {
                id: 'order_' + Date.now(),
                source: 'mall',
                items: items,
                total: total,
                status: 'waiting_ship',
                payMethod: 'wallet',
                address: (store.shopAddresses || [])[0] || null,
                time: Date.now(),
                logistics: null
            };
            store.shopOrders.unshift(order);
            // 清空购物车中已购买的商品
            items.forEach(i => {
                store.shopCart = (store.shopCart || []).filter(c => c.productId !== i.productId);
            });
            save();
            updateCartBadge();
            toast('支付成功！');
            shopSwitchTab('orders');
            // 延迟自动发货（模拟商家处理）
            const _ordId = order.id;
            setTimeout(function() {
                const o = (store.shopOrders||[]).find(x => x.id === _ordId);
                if (o && o.status === 'waiting_ship') {
                    o.logistics = generateLogistics();
                    o.status = 'shipped';
                    save();
                    if (typeof renderShopOrders === 'function') renderShopOrders();
                    toast('🚚 商家已发货');
                    // 启动物流推进
                    _scheduleMallLogistics(_ordId);
                }
            }, 3000 + Math.random() * 4000);
        }

        function generateLogistics() {
            const now = Date.now();
            const CARRIERS = ['SF','YT','ZT','YD','STO','EMS','JD'];
            const CARRIER_NAME = {SF:'顺丰',YT:'圆通',ZT:'中通',YD:'韵达',STO:'申通',EMS:'EMS',JD:'京东'};
            const prefix = CARRIERS[Math.floor(Math.random()*CARRIERS.length)];
            const trackingNo = prefix + now.toString().slice(-10) + Math.floor(Math.random()*1000);
            const steps = [
                { text: '商家已发货（单号 '+trackingNo+'）', time: now },
                { text: '快递员已上门揽收', time: now + 30000 },
                { text: '包裹已到达转运中心', time: now + 90000 },
                { text: '包裹运输中', time: now + 180000 },
                { text: '包裹已到达您所在城市', time: now + 300000 },
                { text: '快递员正在派送', time: now + 420000 },
                { text: '已签收，感谢使用', time: now + 540000 }
            ];
            return { trackingNo: trackingNo, steps: steps, carrier: (CARRIER_NAME[prefix]||prefix)+'快递', currentStep: 0 };
        }

        // 主商城物流自动推进
        function _scheduleMallLogistics(orderId) {
            const stepInterval = 15000;
            const timer = setInterval(function() {
                const o = (store.shopOrders||[]).find(x => x.id === orderId);
                if (!o || !o.logistics || !o.logistics.steps) { clearInterval(timer); return; }
                const lg = o.logistics;
                const cur = lg.currentStep || 0;
                if (cur >= lg.steps.length - 1) {
                    o.status = 'delivered';
                    save();
                    if (typeof renderShopOrders === 'function') renderShopOrders();
                    clearInterval(timer);
                    return;
                }
                lg.currentStep = cur + 1;
                if (lg.currentStep >= lg.steps.length - 1) {
                    o.status = 'delivered';
                }
                save();
            }, stepInterval);
        }

        // ===== 好友代付 =====
        function shopCopay(items) {
            document.getElementById('modal-shop-checkout').style.display = 'none';
            const contacts = (store.contacts || []).filter(c => !c.isGroup);
            const list = document.getElementById('shop-copay-content');
            if (!list) return;
            const total = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);

            let html = `<div style="padding:16px;">
                <div style="text-align:center;margin-bottom:16px;">
                    <div style="font-size:24px;color:#fa5151;font-weight:700;">¥${total.toFixed(2)}</div>
                    <div style="font-size:12px;color:#999;margin-top:4px;">选择好友帮你付款</div>
                </div>`;

            if (contacts.length === 0) {
                html += `<div style="text-align:center;padding:30px;color:#999;">暂无联系人</div>`;
            } else {
                contacts.forEach(c => {
                    html += `<div onclick="shopSendCopay('${c.id}', ${JSON.stringify(items).replace(/"/g,'&quot;')}, ${total})" style="display:flex;align-items:center;padding:12px;background:#f9f9f9;border-radius:12px;margin-bottom:8px;cursor:pointer;">
                        <img src="${c.avatar || _ph(40)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:12px;">
                        <span style="font-size:15px;flex:1;">${escapeHtml(c.name)}</span>
                        <i class="fas fa-chevron-right" style="color:#ccc;"></i>
                    </div>`;
                });
            }
            html += `</div>`;
            list.innerHTML = html;
            document.getElementById('modal-shop-copay').style.display = 'flex';
        }

        function shopSendCopay(contactId, items, total) {
            document.getElementById('modal-shop-copay').style.display = 'none';
            const contact = (store.contacts || []).find(c => c.id === contactId);
            if (!contact) return toast('联系人不存在');

            // 创建代付订单
            if (!store.shopOrders) store.shopOrders = [];
            const order = {
                id: 'order_' + Date.now(),
                items: items,
                total: total,
                status: 'pending_copay',
                payMethod: 'copay',
                copayContactId: contactId,
                copayContactName: contact.name,
                address: (store.shopAddresses || [])[0] || null,
                time: Date.now(),
                logistics: null
            };
            store.shopOrders.unshift(order);

            // 发送代付消息到聊天
            if (!store.chats[contactId]) store.chats[contactId] = [];
            const itemNames = items.map(i => i.name).join('、');
            store.chats[contactId].push({
                sender: 'me',
                type: 'copay_request',
                content: JSON.stringify({
                    orderId: order.id,
                    items: items,
                    total: total,
                    itemNames: itemNames
                }),
                time: Date.now()
            });

            // 清空购物车
            items.forEach(i => {
                store.shopCart = (store.shopCart || []).filter(c => c.productId !== i.productId);
            });
            save();
            updateCartBadge();
            toast(`已向 ${contact.name} 发送代付请求，等待代付...`);

            // ===== 自动模拟联系人代付（联系人直接帮忙付款） =====
            const _copayContactId = contactId;
            const _copayOrderId = order.id;
            const _copayTotal = total;
            const _copayItemNames = itemNames;
            const _copayContactName = contact.name;
            setTimeout(function() {
                // 找到刚才发送的代付请求消息并标记为已付
                const chatMsgs = store.chats[_copayContactId];
                if (chatMsgs) {
                    for (let ci = chatMsgs.length - 1; ci >= 0; ci--) {
                        const msg = chatMsgs[ci];
                        if (msg.type === 'copay_request' && msg.sender === 'me' && msg.status !== 'paid') {
                            try {
                                const cpData = JSON.parse(msg.content);
                                if (cpData.orderId === _copayOrderId) {
                                    cpData.done = true;
                                    msg.content = JSON.stringify(cpData);
                                    msg.status = 'paid';
                                    break;
                                }
                            } catch(e) {}
                        }
                    }
                }

                // 更新订单状态为待发货
                const copayOrder = (store.shopOrders || []).find(function(o) { return o.id === _copayOrderId; });
                if (copayOrder) {
                    copayOrder.status = 'waiting_ship';
                    copayOrder.copayPaidTime = Date.now();
                    // 延迟自动发货
                    setTimeout(function() {
                        const co = (store.shopOrders||[]).find(function(x){ return x.id === _copayOrderId; });
                        if (co && co.status === 'waiting_ship') {
                            co.logistics = generateLogistics();
                            co.status = 'shipped';
                            save();
                            if (typeof renderShopOrders === 'function') renderShopOrders();
                            _scheduleMallLogistics(_copayOrderId);
                        }
                    }, 3000 + Math.random() * 3000);
                }

                // 联系人发送代付成功消息
                if (!store.chats[_copayContactId]) store.chats[_copayContactId] = [];
                store.chats[_copayContactId].push({
                    sender: 'ai',
                    type: 'text',
                    content: '💰 已帮你付款啦～¥' + Number(_copayTotal).toFixed(2) + '（' + _copayItemNames + '），记得查收哦！',
                    time: Date.now()
                });

                save();
                if (typeof renderHistory === 'function' && activeChatId === _copayContactId) renderHistory();
                if (typeof renderShopOrders === 'function') renderShopOrders();
                toast(_copayContactName + ' 已帮你代付 ¥' + Number(_copayTotal).toFixed(2));
            }, 1500 + Math.random() * 2000); // 1.5-3.5秒后模拟代付完成

            shopSwitchTab('orders');
        }

        // ===== 统一状态映射 =====
        const ORDER_STATUS_MAP = {
            pending_pay: '待付款', waiting_ship: '待发货', paid: '已支付',
            pending_copay: '待代付', shipped: '已发货', delivered: '已签收',
            completed: '已完成', reviewed: '已评价', refunding: '退款中',
            refunded: '已退款', cancelled: '已取消'
        };
        const ORDER_STATUS_COLOR = {
            pending_pay: '#faad14', waiting_ship: '#1890ff', paid: '#07c160',
            pending_copay: '#e67e22', shipped: '#4facfe', delivered: '#52c41a',
            completed: '#999', reviewed: '#999', refunding: '#fa5151',
            refunded: '#ccc', cancelled: '#ccc'
        };

        // ===== 订单页 =====
        function renderShopOrders() {
            const page = document.getElementById('shop-orders-page');
            if (!page) return;
            // 推进所有订单物流
            _advanceAllLogistics();
            const orders = store.shopOrders || [];
            if (orders.length === 0) {
                page.innerHTML = `<div style="text-align:center;padding:60px 20px;color:#999;">
                    <i class="fas fa-receipt" style="font-size:48px;color:#ddd;margin-bottom:16px;"></i>
                    <p style="font-size:15px;">暂无订单</p>
                </div>`;
                return;
            }
            page.innerHTML = orders.map(o => {
                const itemsPreview = (o.items || []).map(i => escapeHtml(i.name || '')).join('、');
                const d = new Date(o.time);
                const timeStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
                const srcBadge = o.source === 'secondhand'
                    ? '<span style="font-size:10px;background:#fff3e0;color:#e65100;padding:1px 6px;border-radius:4px;margin-right:4px;">二手</span>'
                    : (o.source === 'merchant' ? '<span style="font-size:10px;background:#e8f5e9;color:#2e7d32;padding:1px 6px;border-radius:4px;margin-right:4px;">店铺</span>' : '');
                // 操作按钮
                let actionBtn = '';
                if (o.status === 'delivered') {
                    actionBtn = `<button onclick="event.stopPropagation();shopConfirmReceipt('${o.id}')" style="font-size:11px;padding:4px 10px;border:1px solid #07c160;background:#fff;color:#07c160;border-radius:12px;cursor:pointer;">确认收货</button>`;
                } else if (o.status === 'completed') {
                    actionBtn = `<button onclick="event.stopPropagation();shopReviewOrder('${o.id}')" style="font-size:11px;padding:4px 10px;border:1px solid #faad14;background:#fff;color:#faad14;border-radius:12px;cursor:pointer;">去评价</button>`;
                }
                return `<div class="shop-order-card" onclick="openShopOrderDetail('${o.id}')">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <span style="font-size:12px;color:#999;">${srcBadge}${timeStr}</span>
                        <span style="font-size:12px;color:${ORDER_STATUS_COLOR[o.status] || '#999'};font-weight:600;">${ORDER_STATUS_MAP[o.status] || o.status}</span>
                    </div>
                    <div style="font-size:14px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${o.sellerName ? '🏷️ '+escapeHtml(o.sellerName)+': ' : ''}${itemsPreview}</div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
                        <span style="font-size:16px;color:#fa5151;font-weight:700;">¥${Number(o.total || 0).toFixed(2)}</span>
                        <div style="display:flex;gap:6px;align-items:center;">
                            ${o.payMethod === 'copay' ? `<span style="font-size:11px;color:#576b95;"><i class="fas fa-user-friends"></i> ${escapeHtml(o.copayContactName || '好友')}代付</span>` : ''}
                            ${actionBtn}
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        // 物流推进（打开订单页时 lazy check）
        function _advanceAllLogistics() {
            const now = Date.now();
            (store.shopOrders || []).forEach(function(o) {
                if (!o.logistics || !o.logistics.steps) return;
                if (o.status === 'delivered' || o.status === 'completed' || o.status === 'reviewed') return;
                const lg = o.logistics;
                const steps = lg.steps;
                // 按 step.time 推进
                let newStep = lg.currentStep || 0;
                for (let i = newStep + 1; i < steps.length; i++) {
                    if (now >= steps[i].time) newStep = i;
                }
                if (newStep !== (lg.currentStep || 0)) {
                    lg.currentStep = newStep;
                    if (newStep >= steps.length - 1) {
                        o.status = 'delivered';
                    } else if (o.status === 'waiting_ship') {
                        o.status = 'shipped';
                    }
                    save();
                }
            });
        }

        function openShopOrderDetail(orderId) {
            const o = (store.shopOrders || []).find(x => x.id === orderId);
            if (!o) return;
            const content = document.getElementById('shop-order-detail-content');
            if (!content) return;
            const d = new Date(o.time);
            const timeStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;

            let itemsHtml = (o.items || []).map(i => `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f5f5f5;">
                <div style="width:50px;height:50px;border-radius:8px;overflow:hidden;background:#f5f5f5;flex-shrink:0;">
                    ${i.image ? `<img src="${i.image}" style="width:100%;height:100%;object-fit:cover;">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">${i.emoji ? `<span style="font-size:24px;">${i.emoji}</span>` : `<i class="fas fa-image" style="color:#ddd;"></i>`}</div>`}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:14px;">${escapeHtml(i.name || '')}</div>
                    <div style="font-size:12px;color:#999;">×${i.qty || 1}</div>
                </div>
                <div style="color:#fa5151;font-weight:600;">¥${(Number(i.price||0)*(i.qty||1)).toFixed(2)}</div>
            </div>`).join('');

            // 卖家信息（二手订单）
            let sellerHtml = '';
            if (o.source === 'secondhand' && o.sellerName) {
                const sellerAva = o.sellerAvatar
                    ? `<img src="${o.sellerAvatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">`
                    : `<div style="width:32px;height:32px;border-radius:50%;background:#e0e0e0;display:flex;align-items:center;justify-content:center;font-size:14px;">${escapeHtml((o.sellerName||'?').charAt(0))}</div>`;
                sellerHtml = `<div style="padding:10px 14px;background:#fff8e1;border-radius:10px;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
                    ${sellerAva}
                    <div>
                        <div style="font-size:14px;font-weight:600;">${escapeHtml(o.sellerName)}</div>
                        <div style="font-size:11px;color:#999;">二手卖家</div>
                    </div>
                </div>`;
            }

            // 操作按钮区
            let actionsHtml = '';
            if (o.status === 'delivered') {
                actionsHtml = `<button onclick="shopConfirmReceipt('${o.id}')" style="width:100%;padding:12px;border:none;background:linear-gradient(135deg,#07c160,#06ad56);color:#fff;border-radius:10px;font-size:14px;font-weight:600;margin-top:8px;">✅ 确认收货</button>`;
            } else if (o.status === 'completed') {
                actionsHtml = `<button onclick="shopReviewOrder('${o.id}')" style="width:100%;padding:12px;border:none;background:linear-gradient(135deg,#faad14,#f59e0b);color:#fff;border-radius:10px;font-size:14px;font-weight:600;margin-top:8px;">⭐ 评价订单</button>`;
            } else if (o.status === 'reviewed' && o.review) {
                actionsHtml = `<div style="padding:12px;background:#f9f9f9;border-radius:10px;margin-top:8px;">
                    <div style="font-size:13px;color:#999;margin-bottom:4px;">我的评价</div>
                    <div style="font-size:14px;">${'⭐'.repeat(o.review.stars||5)} ${escapeHtml(o.review.text||'')}</div>
                </div>`;
            }
            // 退款按钮（待发货/已发货/已签收 可退）
            if (['waiting_ship','shipped','delivered'].indexOf(o.status) >= 0) {
                actionsHtml += `<button onclick="shopRefundOrder('${o.id}')" style="width:100%;padding:12px;border:1px solid #fa5151;background:#fff;color:#fa5151;border-radius:10px;font-size:14px;margin-top:8px;">💸 申请退款</button>`;
            }
            if (o.status === 'refunding') {
                actionsHtml += `<div style="padding:12px;background:#fff0f0;border-radius:10px;margin-top:8px;text-align:center;color:#fa5151;font-size:14px;">退款处理中...</div>`;
            }
            if (o.status === 'refunded') {
                actionsHtml += `<div style="padding:12px;background:#f5f5f5;border-radius:10px;margin-top:8px;text-align:center;color:#999;font-size:14px;">已退款 ¥${Number(o.total||0).toFixed(2)}</div>`;
            }

            content.innerHTML = `
                ${sellerHtml}
                <div style="padding:14px;background:#f9f9f9;border-radius:10px;margin-bottom:16px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-size:13px;color:#999;">订单编号</span>
                        <span style="font-size:13px;color:#333;">${o.id}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-size:13px;color:#999;">下单时间</span>
                        <span style="font-size:13px;color:#333;">${timeStr}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-size:13px;color:#999;">订单状态</span>
                        <span style="font-size:13px;color:${ORDER_STATUS_COLOR[o.status]||'#07c160'};font-weight:600;">${ORDER_STATUS_MAP[o.status] || o.status}</span>
                    </div>
                    ${o.source === 'secondhand' ? `<div style="display:flex;justify-content:space-between;margin-top:6px;">
                        <span style="font-size:13px;color:#999;">订单类型</span>
                        <span style="font-size:13px;color:#e65100;font-weight:600;">🏷️ 好友二手</span>
                    </div>` : ''}
                    ${o.payMethod === 'copay' ? `<div style="display:flex;justify-content:space-between;margin-top:6px;">
                        <span style="font-size:13px;color:#999;">支付方式</span>
                        <span style="font-size:13px;color:#576b95;font-weight:600;"><i class="fas fa-user-friends" style="margin-right:4px;"></i>${escapeHtml(o.copayContactName || '好友')}代付</span>
                    </div>` : ''}
                </div>
                ${o.address ? `<div style="padding:12px;background:#f0faf0;border-radius:10px;margin-bottom:16px;font-size:13px;">
                    <div style="font-weight:600;">${escapeHtml(o.address.name || '')} ${escapeHtml(o.address.phone || '')}</div>
                    <div style="color:#666;margin-top:4px;">${escapeHtml(o.address.address || '')}</div>
                </div>` : ''}
                <div style="background:#fff;border-radius:10px;padding:0 12px;margin-bottom:16px;">${itemsHtml}</div>
                <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:16px;">
                    <span>合计</span>
                    <span style="color:#fa5151;font-weight:700;">¥${Number(o.total||0).toFixed(2)}</span>
                </div>
                ${o.logistics ? `<button onclick="openShopLogistics('${o.id}')" style="width:100%;padding:12px;border:1px solid #4facfe;background:#fff;color:#4facfe;border-radius:10px;font-size:14px;margin-top:8px;"><i class="fas fa-truck"></i> 查看物流</button>` : ''}
                ${actionsHtml}
            `;
            document.getElementById('modal-shop-order-detail').style.display = 'flex';
        }

        function openShopLogistics(orderId) {
            const o = (store.shopOrders || []).find(x => x.id === orderId);
            if (!o || !o.logistics) return toast('暂无物流信息');
            const content = document.getElementById('shop-logistics-content');
            if (!content) return;
            const lg = o.logistics;
            const curStep = lg.currentStep || 0;
            // 只显示到当前推进步骤
            let visibleSteps = (lg.steps || []).slice(0, curStep + 1);
            let stepsHtml = visibleSteps.map((step, idx) => {
                const d = new Date(step.time);
                const timeStr = `${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
                const isFirst = idx === visibleSteps.length - 1; // 最新的高亮
                return `<div style="display:flex;gap:12px;padding:12px 0;${idx < visibleSteps.length - 1 ? 'border-left:2px solid #e0e0e0;margin-left:6px;padding-left:18px;' : 'margin-left:6px;padding-left:18px;'}position:relative;">
                    <div style="position:absolute;left:-7px;top:14px;width:14px;height:14px;border-radius:50%;background:${isFirst ? '#4facfe' : '#e0e0e0'};"></div>
                    <div>
                        <div style="font-size:14px;color:${isFirst ? '#333' : '#999'};font-weight:${isFirst ? '600' : '400'};">${escapeHtml(step.text)}</div>
                        <div style="font-size:12px;color:#bbb;margin-top:2px;">${timeStr}</div>
                    </div>
                </div>`;
            }).reverse().join('');

            content.innerHTML = `
                <div style="padding:14px;background:#f0f7ff;border-radius:10px;margin-bottom:16px;">
                    <div style="font-size:13px;color:#666;">承运商: ${escapeHtml(lg.carrier || 'YAN快递')}</div>
                    <div style="font-size:13px;color:#666;margin-top:4px;">运单号: ${escapeHtml(lg.trackingNo || '')}</div>
                </div>
                <div style="padding:0 8px;">${stepsHtml}</div>
            `;
            document.getElementById('modal-shop-logistics').style.display = 'flex';
        }

        // ===== 确认收货 =====
        function shopConfirmReceipt(orderId) {
            const o = (store.shopOrders || []).find(x => x.id === orderId);
            if (!o) return;
            if (typeof showConfirm === 'function') {
                showConfirm('确认收货', '确认已收到商品？', function() {
                    _doConfirmReceipt(o);
                });
            } else if (confirm('确认已收到商品？')) {
                _doConfirmReceipt(o);
            }
        }
        function _doConfirmReceipt(o) {
            o.status = 'completed';
            o.completedAt = Date.now();
            // 同步二手订单
            if (o.source === 'secondhand') {
                const shOrd = (store.friendsSHOrders||[]).find(x => x.id === o.id);
                if (shOrd) shOrd.status = 'completed';
            }
            save();
            toast('✅ 已确认收货');
            renderShopOrders();
            // 关闭详情弹窗
            const modal = document.getElementById('modal-shop-order-detail');
            if (modal) modal.style.display = 'none';
        }
        window.shopConfirmReceipt = shopConfirmReceipt;

        // ===== 评价订单 =====
        function shopReviewOrder(orderId) {
            const o = (store.shopOrders || []).find(x => x.id === orderId);
            if (!o) return;
            // 关闭详情弹窗
            const detailModal = document.getElementById('modal-shop-order-detail');
            if (detailModal) detailModal.style.display = 'none';

            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.cssText = 'display:flex;position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;';
            modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

            let starHtml = '';
            for (let i = 1; i <= 5; i++) {
                starHtml += `<span class="shop-review-star" data-star="${i}" onclick="document.querySelectorAll('.shop-review-star').forEach(s=>{s.style.color=parseInt(s.dataset.star)<=${i}?'#faad14':'#ddd'});document.getElementById('shop-review-stars').value=${i}" style="font-size:28px;color:${i<=5?'#faad14':'#ddd'};cursor:pointer;padding:0 4px;">★</span>`;
            }

            modal.innerHTML = `<div style="background:#fff;border-radius:16px;padding:20px;width:90%;max-width:360px;">
                <div style="font-size:16px;font-weight:600;text-align:center;margin-bottom:16px;">⭐ 评价订单</div>
                <div style="text-align:center;margin-bottom:12px;">${starHtml}</div>
                <input type="hidden" id="shop-review-stars" value="5">
                <textarea id="shop-review-text" rows="3" placeholder="说说你的感受..." style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;resize:none;box-sizing:border-box;margin-bottom:12px;"></textarea>
                <div style="display:flex;gap:10px;">
                    <button onclick="this.closest('.modal').remove()" style="flex:1;padding:12px;border:1px solid #ddd;background:#fff;border-radius:8px;font-size:14px;">取消</button>
                    <button onclick="shopSubmitReview('${orderId}')" style="flex:1;padding:12px;border:none;background:linear-gradient(135deg,#faad14,#f59e0b);color:#fff;border-radius:8px;font-size:14px;font-weight:600;">提交评价</button>
                </div>
            </div>`;
            document.body.appendChild(modal);
        }
        function shopSubmitReview(orderId) {
            const o = (store.shopOrders || []).find(x => x.id === orderId);
            if (!o) return;
            const stars = parseInt(document.getElementById('shop-review-stars').value) || 5;
            const text = (document.getElementById('shop-review-text').value || '').trim() || '好评';
            o.review = { stars: stars, text: text, time: Date.now() };
            o.status = 'reviewed';
            // 同步二手订单
            if (o.source === 'secondhand') {
                const shOrd = (store.friendsSHOrders||[]).find(x => x.id === o.id);
                if (shOrd) { shOrd.status = 'reviewed'; shOrd.review = o.review; }
            }
            save();
            const modal = document.querySelector('.modal');
            if (modal) modal.remove();
            toast('⭐ 评价成功');
            renderShopOrders();
        }
        window.shopReviewOrder = shopReviewOrder;
        window.shopSubmitReview = shopSubmitReview;

        // ===== 申请退款 =====
        function shopRefundOrder(orderId) {
            const o = (store.shopOrders || []).find(x => x.id === orderId);
            if (!o) return;
            if (typeof showConfirm === 'function') {
                showConfirm('申请退款', '确定要申请退款 ¥'+Number(o.total||0).toFixed(2)+' 吗？', function() {
                    _doRefund(o);
                });
            } else if (confirm('确定要申请退款 ¥'+Number(o.total||0).toFixed(2)+' 吗？')) {
                _doRefund(o);
            }
        }
        function _doRefund(o) {
            o.status = 'refunding';
            save();
            toast('💸 退款申请已提交');
            renderShopOrders();
            // 关闭详情弹窗
            const modal = document.getElementById('modal-shop-order-detail');
            if (modal) modal.style.display = 'none';

            // 模拟 2-4 秒后退款成功
            const _refundId = o.id;
            setTimeout(function() {
                const ro = (store.shopOrders||[]).find(x => x.id === _refundId);
                if (ro && ro.status === 'refunding') {
                    ro.status = 'refunded';
                    ro.refundedAt = Date.now();
                    // 退回钱包
                    if (typeof store.walletBalance === 'number') {
                        store.walletBalance += Number(ro.total || 0);
                        if (!store.walletHistory) store.walletHistory = [];
                        store.walletHistory.unshift({
                            id: 'wh_' + Date.now(),
                            type: 'refund',
                            amount: Number(ro.total || 0),
                            desc: '退款·' + (ro.items||[]).map(i=>i.name).join(',').substring(0,20),
                            time: Date.now()
                        });
                    }
                    // 同步二手订单
                    if (ro.source === 'secondhand') {
                        const shOrd = (store.friendsSHOrders||[]).find(x => x.id === ro.id);
                        if (shOrd) shOrd.status = 'refunded';
                        // 恢复商品为在售
                        const shItem = (store.friendsSecondHand||[]).find(function(x) {
                            return (ro.items||[]).some(function(i){ return i.name === x.name; }) && x.sellerId === ro.sellerId;
                        });
                        if (shItem) shItem.status = 'on_sale';
                    }
                    save();
                    if (typeof renderShopOrders === 'function') renderShopOrders();
                    toast('✅ 退款成功，¥'+Number(ro.total||0).toFixed(2)+' 已退回');
                }
            }, 2000 + Math.random() * 2000);
        }
        window.shopRefundOrder = shopRefundOrder;

        // ===== 我的页面 =====
        function renderShopMe() {
            const nameEl = document.getElementById('shop-me-name');
            const avatarEl = document.getElementById('shop-me-avatar');
            if (nameEl) nameEl.textContent = store.user?.name || '用户';
            // [FIX-头像优先级] 用户自己上传的购物头像优先级最高，其次才是微信头像
            const shopAvatar = store.shopUserAvatar || store.user?.avatar;
            if (avatarEl && shopAvatar) {
                avatarEl.innerHTML = `<img src="${shopAvatar}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
            }
            // [商家系统] 更新"我的店铺"入口状态
            const merchantHint = document.getElementById('shop-merchant-entry-hint');
            if (merchantHint && store.myStore) {
                if (store.myStore.isOpen) {
                    const productCount = (store.myStore.products || []).length;
                    const unreadMsg = (store.myStore.messages || []).filter(m => m.status === 'pending').length;
                    merchantHint.textContent = unreadMsg > 0
                        ? (unreadMsg + ' 条新消息')
                        : (productCount + ' 件商品');
                    merchantHint.style.background = unreadMsg > 0 ? '#fa5151' : '#ff4500';
                } else {
                    merchantHint.textContent = '开店卖货';
                    merchantHint.style.background = '#ff4500';
                }
            }
        }

        // ===== 自定义提示词 =====
        window.shopEditCustomPrompt = function() {
            var cur = store.shopCustomPrompt || '';
            var h = '<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;" onclick="this.remove()">';
            h += '<div style="background:#fff;border-radius:14px;padding:20px;width:90%;max-width:360px;" onclick="event.stopPropagation()">';
            h += '<h3 style="margin:0 0 8px;font-size:16px;">✏️ 自定义提示词</h3>';
            h += '<div style="font-size:12px;color:#999;margin-bottom:12px;line-height:1.5;">设置后，刷新商品时AI会按照你的提示词方向生成内容。<br>例如：只推荐国潮品牌 / 价格控制在50元以内 / 多推荐二次元周边</div>';
            h += '<textarea id="shop-custom-prompt-input" rows="4" style="width:100%;border:1px solid #ddd;border-radius:8px;padding:10px;font-size:14px;resize:vertical;box-sizing:border-box;" placeholder="例如：多推荐可爱风格的商品，价格在30元以内">' + escapeHtml(cur) + '</textarea>';
            h += '<div style="display:flex;gap:8px;margin-top:12px;">';
            h += '<button onclick="this.closest(\'div[style*=fixed]\').remove()" style="flex:1;padding:10px;border:1px solid #ddd;border-radius:8px;background:#fff;font-size:14px;cursor:pointer;">取消</button>';
            h += '<button onclick="shopClearCustomPrompt()" style="padding:10px 14px;border:1px solid #fdd;border-radius:8px;background:#fff;color:#fa5151;font-size:14px;cursor:pointer;">清除</button>';
            h += '<button onclick="shopSaveCustomPrompt()" style="flex:1;padding:10px;border:none;border-radius:8px;background:#ff4500;color:#fff;font-size:14px;cursor:pointer;">保存</button>';
            h += '</div></div></div>';
            document.body.insertAdjacentHTML('beforeend', h);
        };

        window.shopSaveCustomPrompt = function() {
            var val = ((document.getElementById('shop-custom-prompt-input')||{}).value||'').trim();
            store.shopCustomPrompt = val;
            var ov = document.querySelector('div[style*="fixed"][style*="z-index:9999"]'); if(ov) ov.remove();
            store.shopProducts = []; // 清除缓存，让下次刷新使用新提示词
            save(); toast('✅ 自定义提示词已保存');
            var hint = document.getElementById('shop-custom-prompt-hint');
            if(hint) hint.textContent = val ? '已设置' : '影响AI生成方向';
        };

        window.shopClearCustomPrompt = function() {
            store.shopCustomPrompt = '';
            var ov = document.querySelector('div[style*="fixed"][style*="z-index:9999"]'); if(ov) ov.remove();
            store.shopProducts = [];
            save(); toast('已清除自定义提示词');
            var hint = document.getElementById('shop-custom-prompt-hint');
            if(hint) hint.textContent = '影响AI生成方向';
        };

        // ===== 收货地址管理 =====
        function shopEditAvatar() {
            uploadImg('shop-me-avatar-edit');
        }
        window.shopEditAvatar = shopEditAvatar;

        // 处理商店头像上传回调
        const _origUploadImgCb = window._shopAvatarUploadCb;
        window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'shop-avatar-uploaded') {
                const el = document.getElementById('shop-me-avatar');
                if (el) {
                    el.innerHTML = '<img src="' + e.data.url + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
                    store.shopUserAvatar = e.data.url;
                    saveStore();
                }
            }
        });

        function shopEditName() {
            const current = document.getElementById('shop-me-name').textContent || '';
            showPromptModal('修改用户名', current).then(function(newName) {
                if (newName !== null && newName.trim()) {
                    document.getElementById('shop-me-name').textContent = newName.trim();
                    store.user.name = newName.trim();
                    save();
                    // [FIX-名字覆盖] 不再将购物用户名同步到主界面，主界面使用独立的desktopName
                    // 同步更新微信"我的"界面名字
                    const myNameEl = document.getElementById('my-name');
                    if (myNameEl) myNameEl.innerText = newName.trim();
                    toast('用户名已更新');
                }
            });
        }
        window.shopEditName = shopEditName;

        function shopShowAddress() {
            const addresses = store.shopAddresses || [];
            let html = `<div style="padding:16px;">
                <div style="font-size:16px;font-weight:600;margin-bottom:16px;">收货地址</div>`;

            if (addresses.length === 0) {
                html += `<div style="text-align:center;padding:30px;color:#999;">暂无地址</div>`;
            } else {
                addresses.forEach((addr, idx) => {
                    html += `<div style="padding:14px;background:#f9f9f9;border-radius:10px;margin-bottom:10px;position:relative;">
                        <div style="font-weight:600;font-size:14px;">${escapeHtml(addr.name || '')} ${escapeHtml(addr.phone || '')}</div>
                        <div style="font-size:13px;color:#666;margin-top:4px;">${escapeHtml(addr.address || '')}</div>
                        <div style="position:absolute;top:10px;right:10px;display:flex;gap:8px;">
                            <span onclick="shopEditAddress(${idx})" style="font-size:12px;color:#576b95;cursor:pointer;"><i class="fas fa-edit"></i></span>
                            <span onclick="shopDeleteAddress(${idx})" style="font-size:12px;color:#fa5151;cursor:pointer;"><i class="fas fa-trash"></i></span>
                        </div>
                    </div>`;
                });
            }

            html += `<div onclick="shopAddAddress()" style="padding:14px;background:#f0f7ff;border-radius:10px;text-align:center;color:#576b95;cursor:pointer;margin-top:10px;">
                <i class="fas fa-plus"></i> 添加新地址
            </div></div>`;

            const modal = document.getElementById('modal-shop-copay');
            const list = modal.querySelector('.modal-body') || document.getElementById('shop-copay-list');
            if (list) {
                list.innerHTML = html;
                modal.style.display = 'flex';
            } else {
                // Fallback: use checkout modal
                const content = document.getElementById('shop-checkout-content');
                if (content) {
                    content.innerHTML = html;
                    document.getElementById('modal-shop-checkout').style.display = 'flex';
                }
            }
        }

        function shopAddAddress() {
            // [FIX-问题2] 使用模态框代替prompt，避免输入框无法弹出的问题
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.cssText = 'display:flex;position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;';
            modal.innerHTML = `
                <div style="background:#fff;border-radius:16px;padding:20px;width:90%;max-width:360px;box-shadow:0 8px 30px rgba(0,0,0,0.2);">
                    <div style="font-size:16px;font-weight:600;margin-bottom:16px;text-align:center;">添加收货地址</div>
                    <div style="margin-bottom:12px;">
                        <div style="font-size:13px;color:#666;margin-bottom:6px;">收货人姓名</div>
                        <input id="shop-addr-name" type="text" placeholder="请输入姓名" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom:12px;">
                        <div style="font-size:13px;color:#666;margin-bottom:6px;">手机号</div>
                        <input id="shop-addr-phone" type="tel" placeholder="请输入手机号" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom:16px;">
                        <div style="font-size:13px;color:#666;margin-bottom:6px;">详细地址</div>
                        <textarea id="shop-addr-address" placeholder="请输入详细地址" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;min-height:60px;resize:vertical;box-sizing:border-box;"></textarea>
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button onclick="this.closest('.modal').remove()" style="flex:1;padding:12px;border:1px solid #ddd;background:#fff;border-radius:8px;font-size:14px;cursor:pointer;">取消</button>
                        <button onclick="confirmShopAddAddress()" style="flex:1;padding:12px;border:none;background:#07c160;color:#fff;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">确认</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            setTimeout(() => document.getElementById('shop-addr-name').focus(), 100);
        }
        
        function confirmShopAddAddress() {
            const name = document.getElementById('shop-addr-name').value.trim();
            const phone = document.getElementById('shop-addr-phone').value.trim();
            const address = document.getElementById('shop-addr-address').value.trim();
            if (!name) return toast('请输入收货人姓名', 'error');
            if (!phone) return toast('请输入手机号', 'error');
            if (!address) return toast('请输入详细地址', 'error');
            if (!store.shopAddresses) store.shopAddresses = [];
            store.shopAddresses.push({ name, phone, address });
            save();
            document.querySelector('.modal').remove();
            toast('地址已添加');
            shopShowAddress();
        }
        window.confirmShopAddAddress = confirmShopAddAddress;

        function shopEditAddress(idx) {
            const addr = (store.shopAddresses || [])[idx];
            if (!addr) return;
            // [FIX-问题2] 使用模态框代替prompt，避免输入框无法弹出的问题
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.cssText = 'display:flex;position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;';
            modal.innerHTML = `
                <div style="background:#fff;border-radius:16px;padding:20px;width:90%;max-width:360px;box-shadow:0 8px 30px rgba(0,0,0,0.2);">
                    <div style="font-size:16px;font-weight:600;margin-bottom:16px;text-align:center;">编辑收货地址</div>
                    <div style="margin-bottom:12px;">
                        <div style="font-size:13px;color:#666;margin-bottom:6px;">收货人姓名</div>
                        <input id="shop-edit-addr-name" type="text" value="${escapeHtml(addr.name || '')}" placeholder="请输入姓名" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom:12px;">
                        <div style="font-size:13px;color:#666;margin-bottom:6px;">手机号</div>
                        <input id="shop-edit-addr-phone" type="tel" value="${escapeHtml(addr.phone || '')}" placeholder="请输入手机号" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;">
                    </div>
                    <div style="margin-bottom:16px;">
                        <div style="font-size:13px;color:#666;margin-bottom:6px;">详细地址</div>
                        <textarea id="shop-edit-addr-address" placeholder="请输入详细地址" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;min-height:60px;resize:vertical;box-sizing:border-box;">${escapeHtml(addr.address || '')}</textarea>
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button onclick="this.closest('.modal').remove()" style="flex:1;padding:12px;border:1px solid #ddd;background:#fff;border-radius:8px;font-size:14px;cursor:pointer;">取消</button>
                        <button onclick="confirmShopEditAddress(${idx})" style="flex:1;padding:12px;border:none;background:#07c160;color:#fff;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">确认</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            setTimeout(() => document.getElementById('shop-edit-addr-name').focus(), 100);
        }
        
        function confirmShopEditAddress(idx) {
            const addr = (store.shopAddresses || [])[idx];
            if (!addr) return;
            const name = document.getElementById('shop-edit-addr-name').value.trim();
            const phone = document.getElementById('shop-edit-addr-phone').value.trim();
            const address = document.getElementById('shop-edit-addr-address').value.trim();
            if (!name) return toast('请输入收货人姓名', 'error');
            if (!phone) return toast('请输入手机号', 'error');
            if (!address) return toast('请输入详细地址', 'error');
            addr.name = name;
            addr.phone = phone;
            addr.address = address;
            save();
            document.querySelector('.modal').remove();
            toast('地址已更新');
            shopShowAddress();
        }
        window.confirmShopEditAddress = confirmShopEditAddress;

        function shopDeleteAddress(idx) {
            if (!confirm('确定删除此地址？')) return;
            store.shopAddresses.splice(idx, 1);
            save();
            toast('地址已删除');
            shopShowAddress();
        }

        function shopShowFavorites() {
            const favIds = store.shopFavorites || [];
            const products = favIds.map(id => (store.shopProducts || []).find(p => p.id === id)).filter(Boolean);
            if (products.length === 0) return toast('暂无收藏');
            // Switch to home tab and filter
            shopSwitchTab('home');
            const grid = document.getElementById('shop-product-grid');
            const empty = document.getElementById('shop-empty');
            if (products.length === 0) {
                grid.innerHTML = '';
                empty.style.display = '';
                return;
            }
            empty.style.display = 'none';
            const _catColors = {'衣服':'#667eea','美妆':'#f093fb','食品':'#4facfe','鞋包':'#43e97b'};
            grid.innerHTML = products.map(p => {
                const _bgColor = _catColors[p.category] || '#667eea';
                const _catEmoji = p.category==='衣服'?'👗':p.category==='美妆'?'💄':p.category==='食品'?'🍰':p.category==='鞋包'?'👜':'🛍️';
                return `<div class="shop-card" onclick="openShopDetail('${p.id}')">
                    <div class="shop-card-img-wrap">
                        <div style="width:100%;height:100%;background:linear-gradient(135deg,${_bgColor}22,${_bgColor}11);display:flex;flex-direction:column;align-items:center;justify-content:center;">
                            <div style="font-size:36px;">${_catEmoji}</div>
                            <div style="font-size:11px;color:#888;margin-top:4px;">${escapeHtml(p.category || '商品')}</div>
                        </div>
                        <div class="shop-card-fav" onclick="event.stopPropagation();shopToggleFav('${p.id}')"><i class="fas fa-heart" style="color:#ff4d4f;"></i></div>
                    </div>
                    <div class="shop-card-info">
                        <div class="shop-card-name">${escapeHtml(p.name || '')}</div>
                        <div class="shop-card-bottom">
                            <div class="shop-card-price">¥${Number(p.price || 0).toFixed(2)}</div>
                            <button class="shop-card-cart-btn" onclick="event.stopPropagation();addToCart('${p.id}')"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        // Expose shop functions to global scope
        window.renderShop = renderShop;
        window.setShopCategory = setShopCategory;
        window.filterShopProducts = filterShopProducts;
        window.openShopDetail = openShopDetail;
        window.addToCart = addToCart;
        window.removeFromCart = removeFromCart;
        window.updateCartQty = updateCartQty;
        window.openShopCart = function() { shopSwitchTab('cart'); };
        window.checkoutCart = checkoutCart;
        window.shopRefreshProducts = shopRefreshProducts;
        window.shopSwitchTab = shopSwitchTab;
        window.shopShowSearch = shopShowSearch;
        window.shopHideSearch = shopHideSearch;
        window.shopRenderSearchResults = shopRenderSearchResults;
        window.shopBuyNow = shopBuyNow;
        window.shopCopayFromDetail = shopCopayFromDetail;
        window.shopToggleFav = shopToggleFav;
        window.updateCartBadge = updateCartBadge;
        window.shopPayNow = shopPayNow;
        window.shopCopay = shopCopay;
        window.shopSendCopay = shopSendCopay;
        window.openShopCheckout = openShopCheckout;
        window.openShopOrderDetail = openShopOrderDetail;
        window.openShopLogistics = openShopLogistics;
        window.shopShowAddress = shopShowAddress;
        window.shopAddAddress = shopAddAddress;
        window.shopEditAddress = shopEditAddress;
        window.shopDeleteAddress = shopDeleteAddress;
        window.shopDoSearch = shopDoSearch;
        // Toggle family card selection dropdown
        function toggleFamilyCardSelect() {
            const radios = document.querySelectorAll('.shop-pay-radio');
            let isFamilyCard = false;
            radios.forEach(r => { if (r.checked && r.value === 'familyCard') isFamilyCard = true; });
            
            const selectDiv = document.getElementById('family-card-select');
            if (!selectDiv) return;
            
            if (isFamilyCard) {
                const availableCards = getAvailableFamilyCardsForPayment();
                if (availableCards.length === 0) {
                    selectDiv.innerHTML = '<div style="padding:8px;font-size:12px;color:#999;">暂无可用亲属卡</div>';
                } else {
                    let html = '<select id="selected-family-card" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:8px;font-size:13px;">';
                    availableCards.forEach(fc => {
                        const c = store.contacts.find(x => x.id === fc.contactId);
                        const name = c ? c.name : '未知';
                        const remaining = (fc.limit - (fc.used || 0)).toFixed(2);
                        html += `<option value="${fc.id}">${name}的亲属卡 (剩余¥${remaining})</option>`;
                    });
                    html += '</select>';
                    selectDiv.innerHTML = html;
                }
                selectDiv.style.display = 'block';
            } else {
                selectDiv.style.display = 'none';
            }
        }

        // shopCheckoutPay: handles payment method selection from checkout modal
        function shopCheckoutPay(items, total) {
            const radios = document.querySelectorAll('.shop-pay-radio');
            let method = 'self';
            radios.forEach(r => { if (r.checked) method = r.value; });

            if (method === 'self') {
                // 自付
                shopPayNow(items, total);
            } else if (method === 'familyCard') {
                // 亲属卡支付
                shopPayWithFamilyCard(items, total);
            } else if (method === 'gift') {
                // 送礼 - 选择好友
                document.getElementById('modal-shop-checkout').style.display = 'none';
                shopGiftTo(items, total);
            } else if (method === 'copay') {
                // 好友代付
                document.getElementById('modal-shop-checkout').style.display = 'none';
                shopCopay(items);
            }
        }

        function shopPayWithFamilyCard(items, total) {
            const selectEl = document.getElementById('selected-family-card');
            if (!selectEl) return toast('请选择亲属卡');
            const fcId = selectEl.value;
            const fc = (store.familyCards || []).find(x => x.id === fcId);
            if (!fc) return toast('亲属卡不存在');
            
            const remaining = fc.limit - (fc.used || 0);
            if (remaining < total) {
                return toast(`亲属卡余额不足，剩余¥${remaining.toFixed(2)}`);
            }

            // 扣除亲属卡额度
            fc.used = (fc.used || 0) + total;

            document.getElementById('modal-shop-checkout').style.display = 'none';
            if (!store.shopOrders) store.shopOrders = [];
            const order = {
                id: 'order_' + Date.now(),
                source: 'mall',
                items: items,
                total: total,
                status: 'waiting_ship',
                payMethod: 'familyCard',
                familyCardId: fcId,
                familyCardContactId: fc.contactId,
                address: (store.shopAddresses || [])[0] || null,
                time: Date.now(),
                logistics: null
            };
            store.shopOrders.unshift(order);
            // 延迟自动发货
            const _fcOrdId = order.id;
            setTimeout(function() {
                const fo = (store.shopOrders||[]).find(x => x.id === _fcOrdId);
                if (fo && fo.status === 'waiting_ship') {
                    fo.logistics = generateLogistics();
                    fo.status = 'shipped';
                    save();
                    if (typeof renderShopOrders === 'function') renderShopOrders();
                    _scheduleMallLogistics(_fcOrdId);
                }
            }, 3000 + Math.random() * 3000);
            
            // 清空购物车中已购买的商品
            items.forEach(i => {
                store.shopCart = (store.shopCart || []).filter(c => c.productId !== i.productId);
            });

            // 通知亲属卡持有人
            const c = store.contacts.find(x => x.id === fc.contactId);
            if (c) {
                if (!store.chats[fc.contactId]) store.chats[fc.contactId] = [];
                const itemNames = items.map(i => i.name).join('、');
                store.chats[fc.contactId].push({
                    sender: 'me',
                    type: 'text',
                    content: `💳 我使用了你的亲属卡支付 ¥${total.toFixed(2)} (${itemNames})`,
                    time: Date.now()
                });
            }

            save();
            updateCartBadge();
            toast('亲属卡支付成功！');
            shopSwitchTab('orders');
        }

        window.toggleFamilyCardSelect = toggleFamilyCardSelect;
        window.shopPayWithFamilyCard = shopPayWithFamilyCard;

        // 送礼功能：选择好友后下单并发送礼物消息
        function shopGiftTo(items, total) {
            const contacts = (store.contacts || []).filter(c => !c.isGroup);
            const list = document.getElementById('shop-copay-content');
            if (!list) return;

            let html = `<div style="padding:16px;">
                <div style="text-align:center;margin-bottom:16px;">
                    <div style="font-size:20px;">🎁</div>
                    <div style="font-size:18px;font-weight:600;color:#333;margin-top:4px;">选择送礼对象</div>
                    <div style="font-size:13px;color:#999;margin-top:4px;">¥${total.toFixed(2)}</div>
                </div>`;

            if (contacts.length === 0) {
                html += `<div style="text-align:center;padding:30px;color:#999;">暂无联系人</div>`;
            } else {
                contacts.forEach(c => {
                    html += `<div onclick="shopSendGift('${c.id}', ${JSON.stringify(items).replace(/"/g,'&quot;')}, ${total})" style="display:flex;align-items:center;padding:12px;background:#f9f9f9;border-radius:12px;margin-bottom:8px;cursor:pointer;">
                        <img src="${c.avatar || _ph(40)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:12px;">
                        <span style="font-size:15px;flex:1;">${escapeHtml(c.name)}</span>
                        <i class="fas fa-gift" style="color:#f59e0b;"></i>
                    </div>`;
                });
            }
            html += `</div>`;
            list.innerHTML = html;
            document.getElementById('modal-shop-copay').style.display = 'flex';
        }

        function shopSendGift(contactId, items, total) {
            document.getElementById('modal-shop-copay').style.display = 'none';
            const contact = (store.contacts || []).find(c => c.id === contactId);
            if (!contact) return toast('联系人不存在');

            if (!store.shopOrders) store.shopOrders = [];
            const order = {
                id: 'order_' + Date.now(),
                source: 'mall',
                items: items,
                total: total,
                status: 'waiting_ship',
                payMethod: 'gift',
                giftContactId: contactId,
                giftContactName: contact.name,
                address: (store.shopAddresses || [])[0] || null,
                time: Date.now(),
                logistics: null
            };
            store.shopOrders.unshift(order);
            // 延迟自动发货
            const _giftOrdId = order.id;
            setTimeout(function() {
                const go = (store.shopOrders||[]).find(x => x.id === _giftOrdId);
                if (go && go.status === 'waiting_ship') {
                    go.logistics = generateLogistics();
                    go.status = 'shipped';
                    save();
                    if (typeof renderShopOrders === 'function') renderShopOrders();
                    _scheduleMallLogistics(_giftOrdId);
                }
            }, 3000 + Math.random() * 3000);

            // 发送礼物消息到聊天
            if (!store.chats[contactId]) store.chats[contactId] = [];
            const itemNames = items.map(i => i.name).join('、');
            store.chats[contactId].push({
                sender: 'me',
                type: 'text',
                content: `🎁 送你一份礼物：${itemNames}，请查收～`,
                time: Date.now()
            });

            items.forEach(i => {
                store.shopCart = (store.shopCart || []).filter(c => c.productId !== i.productId);
            });
            save();
            updateCartBadge();
            toast(`已将礼物送给 ${contact.name} 🎁`);
            shopSwitchTab('orders');
        }

        window.shopCheckoutPay = shopCheckoutPay;
        window.shopGiftTo = shopGiftTo;
        window.shopSendGift = shopSendGift;
        window.shopShowFavorites = shopShowFavorites;
        window.renderShopCart = renderShopCart;
        window.renderShopOrders = renderShopOrders;
        window.renderShopMe = renderShopMe;

        // ========== PAGE 2 INTERACTIVE FUNCTIONS ==========
        
        function getPage2Data() {
            if (!store.page2) store.page2 = { photo: '', album: '', miniAvatar: '', miniText: '', square: '', lyrics: [] };
            return store.page2;
        }

        // [FIX-壁纸掉图] page2图片上传后同时写入独立IDB key，确保持久化
        // [FIX-掉图v2] 增强：写入后读回校验，失败时重试，与save()中的逻辑对齐
        // [FIX-掉图v5] 添加写入锁，防止与_doSaveNow中的page2 IDB写入并发竞态
        var _p2IdbWriting = false; // 全局写入锁
        window._p2IdbWriting = false; // 暴露给app-part1.js检查
        function _p2SaveImagesToIdb() {
            try {
                if (_p2IdbWriting) {
                    console.log('[P2] page2 IDB写入锁生效，跳过本次（等待上次完成）');
                    return;
                }
                _p2IdbWriting = true;
                window._p2IdbWriting = true;
                var p2 = getPage2Data();
                var p2Imgs = { photo: p2.photo || '', album: p2.album || '', square: p2.square || '', miniAvatar: p2.miniAvatar || '' };
                var _db = (typeof idb !== 'undefined' && idb && typeof idb.set === 'function') ? idb :
                          (typeof __getAppIdb === 'function' ? __getAppIdb() : null);
                if (_db && typeof _db.set === 'function') {
                    // 写入 + 读回校验，失败时重试一次
                    _db.set('AIChatOS_v8_Page2_Images', p2Imgs).then(function() {
                        return _db.get('AIChatOS_v8_Page2_Images');
                    }).then(function(verify) {
                        if (!verify || typeof verify !== 'object' ||
                            (!verify.photo && !verify.album && !verify.square && !verify.miniAvatar)) {
                            console.warn('[P2] page2图片写入校验失败，重试一次');
                            return _db.set('AIChatOS_v8_Page2_Images', p2Imgs);
                        }
                    }).catch(function(e) {
                        console.warn('[P2] page2图片独立IDB写入失败:', e);
                        // 重试一次
                        try { _db.set('AIChatOS_v8_Page2_Images', p2Imgs).catch(function(){}); } catch(e2) {}
                    }).finally(function() {
                        _p2IdbWriting = false;
                        window._p2IdbWriting = false;
                    });
                } else {
                    _p2IdbWriting = false;
                    window._p2IdbWriting = false;
                }
            } catch(e) {
                console.warn('[P2] _p2SaveImagesToIdb error:', e);
                _p2IdbWriting = false;
                window._p2IdbWriting = false;
            }
        }

        function p2UploadPhoto() {
            openImgUploadModal('上传封面图片', function(imgUrl) {
                const p2 = getPage2Data();
                p2.photo = imgUrl;
                // [FIX-掉图v4] 先写独立IDB key（关键路径），再触发去抖save
                // 不再同时调用save+_doSaveNow+_p2SaveImagesToIdb，消除竞态
                _p2SaveImagesToIdb();
                save();
                const img = document.getElementById('p2-photo-img');
                const placeholder = document.getElementById('p2-photo-placeholder');
                if (img && placeholder) {
                    img.src = imgUrl;
                    img.style.display = 'block';
                    placeholder.style.display = 'none';
                }
            });
        }

        function p2UploadAlbum() {
            openImgUploadModal('上传专辑封面', function(imgUrl) {
                const p2 = getPage2Data();
                p2.album = imgUrl;
                // [FIX-掉图v4] 先写独立IDB key，再触发去抖save
                _p2SaveImagesToIdb();
                save();
                const disc = document.getElementById('p2-album-disc');
                if (disc) {
                    disc.style.backgroundImage = `url(${imgUrl})`;
                    disc.style.backgroundSize = 'cover';
                    disc.style.backgroundPosition = 'center';
                    const icon = disc.querySelector('i');
                    if (icon) icon.style.display = 'none';
                }
            });
        }

        function p2UploadMiniAvatar(e) {
            if (e) e.stopPropagation();
            openImgUploadModal('上传头像', function(imgUrl) {
                const p2 = getPage2Data();
                p2.miniAvatar = imgUrl;
                // [FIX-掉图v4] 先写独立IDB key，再触发去抖save
                _p2SaveImagesToIdb();
                save();
                const img = document.getElementById('p2-mini-avatar-img');
                const placeholder = document.getElementById('p2-mini-avatar-placeholder');
                if (img && placeholder) {
                    img.src = imgUrl;
                    img.style.display = 'block';
                    placeholder.style.display = 'none';
                }
            });
        }

        function p2UploadSquare() {
            openImgUploadModal('上传图片', function(imgUrl) {
                const p2 = getPage2Data();
                p2.square = imgUrl;
                // [FIX-掉图v4] 先写独立IDB key，再触发去抖save
                _p2SaveImagesToIdb();
                save();
                const img = document.getElementById('p2-square-img');
                const placeholder = document.getElementById('p2-square-placeholder');
                if (img && placeholder) {
                    img.src = imgUrl;
                    img.style.display = 'block';
                    placeholder.style.display = 'none';
                }
            });
        }

        // Save lyrics when user edits them
        function p2SaveLyrics() {
            const p2 = getPage2Data();
            const lines = document.querySelectorAll('.p2-lyric-line');
            p2.lyrics = Array.from(lines).map(el => el.innerText.trim());
            save();
        }

        // Save mini widget text
        function p2SaveMiniText() {
            const p2 = getPage2Data();
            const el = document.querySelector('.p2-mini-text');
            if (el) {
                p2.miniText = el.innerText.trim();
                save();
            }
        }

        // Restore page 2 data on load
        function restorePage2Data() {
            const p2 = getPage2Data();
            
            // [FIX-壁纸掉图] 辅助函数：检查值是否为有效图片数据（排除占位符）
            function _isValidImg(v) { return v && v !== '__EXT__' && v.length > 10; }
            
            // Restore photo
            if (_isValidImg(p2.photo)) {
                const img = document.getElementById('p2-photo-img');
                const placeholder = document.getElementById('p2-photo-placeholder');
                if (img && placeholder) {
                    img.src = p2.photo;
                    img.style.display = 'block';
                    placeholder.style.display = 'none';
                }
            }
            
            // Restore album disc
            if (_isValidImg(p2.album)) {
                const disc = document.getElementById('p2-album-disc');
                if (disc) {
                    disc.style.backgroundImage = `url(${p2.album})`;
                    disc.style.backgroundSize = 'cover';
                    disc.style.backgroundPosition = 'center';
                    const icon = disc.querySelector('i');
                    if (icon) icon.style.display = 'none';
                }
            }
            
            // Restore mini avatar
            if (_isValidImg(p2.miniAvatar)) {
                const img = document.getElementById('p2-mini-avatar-img');
                const placeholder = document.getElementById('p2-mini-avatar-placeholder');
                if (img && placeholder) {
                    img.src = p2.miniAvatar;
                    img.style.display = 'block';
                    placeholder.style.display = 'none';
                }
            }
            
            // Restore mini text
            if (p2.miniText) {
                const el = document.querySelector('.p2-mini-text');
                if (el) el.innerText = p2.miniText;
            }
            
            // Restore square
            if (_isValidImg(p2.square)) {
                const img = document.getElementById('p2-square-img');
                const placeholder = document.getElementById('p2-square-placeholder');
                if (img && placeholder) {
                    img.src = p2.square;
                    img.style.display = 'block';
                    placeholder.style.display = 'none';
                }
            }
            
            // Restore lyrics (including empty strings - user may have intentionally cleared them)
            if (p2.lyrics && p2.lyrics.length > 0) {
                const lines = document.querySelectorAll('.p2-lyric-line');
                p2.lyrics.forEach((text, i) => {
                    if (lines[i]) lines[i].innerText = (text !== undefined && text !== null) ? text : '';
                });
            }
        }

        // Bind blur events for auto-saving editable content
        function initPage2Events() {
            // Lyrics auto-save on blur
            document.querySelectorAll('.p2-lyric-line').forEach(el => {
                el.addEventListener('blur', p2SaveLyrics);
            });
            // Mini text auto-save on blur
            const miniText = document.querySelector('.p2-mini-text');
            if (miniText) {
                miniText.addEventListener('blur', p2SaveMiniText);
            }
        }

        // Expose page 2 functions
        window.p2UploadPhoto = p2UploadPhoto;
        window.p2UploadAlbum = p2UploadAlbum;
        window.p2UploadMiniAvatar = p2UploadMiniAvatar;
        window.p2UploadSquare = p2UploadSquare;

        // Init page 2 after DOM ready
        setTimeout(function() {
            restorePage2Data();
            initPage2Events();
        }, 1500);

        // ========== END PAGE 2 ==========

        // ========== 自定义商品管理 ==========
        function shopOpenCustomProducts() {
            if (!store.shopCustomProducts) store.shopCustomProducts = [];
            // [商家系统] 排除由"我的店铺"同步过来的商品(那些由商家模块管理)
            var items = store.shopCustomProducts.filter(function(p){ return !p.__fromMyStore; });
            var modal = document.createElement('div');
            modal.id = 'modal-shop-custom';
            modal.className = 'modal-mask';
            modal.style.cssText = 'z-index:10002;display:flex;';
            modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

            var listHtml = '';
            if (items.length === 0) {
                listHtml = '<div style="text-align:center;padding:40px 0;color:#bbb;font-size:14px;">还没有自定义商品<br>点击下方按钮添加</div>';
            } else {
                listHtml = items.map(function(p) {
                    var imgHtml = (p.images && p.images[0])
                        ? '<img src="' + p.images[0] + '" style="width:48px;height:48px;border-radius:6px;object-fit:cover;flex-shrink:0;">'
                        : '<div style="width:48px;height:48px;border-radius:6px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-image" style="color:#ccc;"></i></div>';
                    return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f0f0f0;">'
                        + imgHtml
                        + '<div style="flex:1;min-width:0;">'
                        + '<div style="font-size:14px;color:#111;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (typeof escapeHtml==='function'?escapeHtml(p.name):p.name) + '</div>'
                        + '<div style="font-size:12px;color:#999;">¥' + Number(p.price||0).toFixed(2) + ' · ' + (p.category||'') + '</div>'
                        + '</div>'
                        + '<div style="display:flex;gap:8px;flex-shrink:0;">'
                        + '<button onclick="shopEditCustomProduct(\'' + p.id + '\')" style="border:1px solid #ddd;background:#fff;color:#333;padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer;">编辑</button>'
                        + '<button onclick="shopDeleteCustomProduct(\'' + p.id + '\')" style="border:1px solid #ddd;background:#fff;color:#999;padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer;">删除</button>'
                        + '</div></div>';
                }).join('');
            }

            modal.innerHTML = '<div style="background:#fff;border-radius:12px;width:90%;max-width:400px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;">'
                + '<div style="padding:16px 18px;border-bottom:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:center;">'
                + '<span style="font-size:16px;font-weight:600;color:#111;">自定义商品</span>'
                + '<i class="fas fa-times" style="color:#999;cursor:pointer;" onclick="document.getElementById(\'modal-shop-custom\').remove()"></i>'
                + '</div>'
                + '<div style="flex:1;overflow-y:auto;padding:0 16px;">' + listHtml + '</div>'
                + '<div style="padding:12px 16px;border-top:1px solid #e5e5e5;">'
                + '<button onclick="shopAddCustomProduct()" style="width:100%;padding:10px;border:1px dashed #ccc;background:#fff;color:#333;border-radius:8px;font-size:14px;cursor:pointer;">+ 添加商品</button>'
                + '</div></div>';
            document.body.appendChild(modal);
        }
        window.shopOpenCustomProducts = shopOpenCustomProducts;

        function shopAddCustomProduct() {
            _shopCustomProductForm(null);
        }
        window.shopAddCustomProduct = shopAddCustomProduct;

        function shopEditCustomProduct(id) {
            if (!store.shopCustomProducts) return;
            var item = store.shopCustomProducts.find(function(p) { return p.id === id; });
            if (!item) return;
            _shopCustomProductForm(item);
        }
        window.shopEditCustomProduct = shopEditCustomProduct;

        function _shopCustomProductForm(existing) {
            var isEdit = !!existing;
            var modal = document.createElement('div');
            modal.id = 'modal-shop-custom-form';
            modal.className = 'modal-mask';
            modal.style.cssText = 'z-index:10003;display:flex;';
            modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

            var cats = ['衣服','美妆','食品','鞋包'];
            var catHtml = cats.map(function(c) {
                var sel = existing && existing.category === c;
                return '<div class="shop-custom-cat-chip' + (sel ? ' active' : '') + '" onclick="this.parentElement.querySelectorAll(\'.shop-custom-cat-chip\').forEach(function(e){e.classList.remove(\'active\')});this.classList.add(\'active\');document.getElementById(\'shop-custom-cat-val\').value=\'' + c + '\';">' + c + '</div>';
            }).join('');

            modal.innerHTML = '<div style="background:#fff;border-radius:12px;width:90%;max-width:380px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;">'
                + '<div style="padding:16px 18px;border-bottom:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:center;">'
                + '<span style="font-size:16px;font-weight:600;color:#111;">' + (isEdit ? '编辑商品' : '添加商品') + '</span>'
                + '<i class="fas fa-times" style="color:#999;cursor:pointer;" onclick="document.getElementById(\'modal-shop-custom-form\').remove()"></i>'
                + '</div>'
                + '<div style="flex:1;overflow-y:auto;padding:16px;">'
                + '<div id="shop-custom-img-area" onclick="shopCustomUploadImg()" style="width:100%;height:120px;border:1px dashed #ccc;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;margin-bottom:14px;">'
                + (existing && existing.images && existing.images[0] ? '<img src="' + existing.images[0] + '" style="width:100%;height:100%;object-fit:cover;">' : '<div style="text-align:center;color:#bbb;font-size:13px;"><i class="fas fa-camera" style="font-size:24px;display:block;margin-bottom:6px;"></i>上传图片（可选）</div>')
                + '</div>'
                + '<input type="hidden" id="shop-custom-img-val" value="' + (existing && existing.images && existing.images[0] ? existing.images[0] : '') + '">'
                + '<input type="hidden" id="shop-custom-cat-val" value="' + (existing ? existing.category || '衣服' : '衣服') + '">'
                + (isEdit ? '<input type="hidden" id="shop-custom-edit-id" value="' + existing.id + '">' : '')
                + '<div style="margin-bottom:12px;"><div style="font-size:12px;color:#999;margin-bottom:4px;">名称</div><input id="shop-custom-name" value="' + (existing ? (existing.name||'').replace(/"/g,'&quot;') : '') + '" placeholder="商品名称" style="width:100%;padding:10px 12px;border:none;border-bottom:1px solid #ddd;font-size:14px;outline:none;box-sizing:border-box;"></div>'
                + '<div style="margin-bottom:12px;"><div style="font-size:12px;color:#999;margin-bottom:4px;">价格</div><input id="shop-custom-price" type="number" value="' + (existing ? existing.price || '' : '') + '" placeholder="0.00" style="width:100%;padding:10px 12px;border:none;border-bottom:1px solid #ddd;font-size:14px;outline:none;box-sizing:border-box;"></div>'
                + '<div style="margin-bottom:12px;"><div style="font-size:12px;color:#999;margin-bottom:4px;">分类</div><div style="display:flex;gap:8px;flex-wrap:wrap;">' + catHtml + '</div></div>'
                + '<div style="margin-bottom:12px;"><div style="font-size:12px;color:#999;margin-bottom:4px;">描述</div><textarea id="shop-custom-desc" placeholder="一句话描述" style="width:100%;padding:10px 12px;border:none;border-bottom:1px solid #ddd;font-size:14px;outline:none;resize:none;height:60px;box-sizing:border-box;">' + (existing ? (existing.desc||'') : '') + '</textarea></div>'
                + '</div>'
                + '<div style="padding:12px 16px;border-top:1px solid #e5e5e5;display:flex;gap:10px;">'
                + '<button onclick="document.getElementById(\'modal-shop-custom-form\').remove()" style="flex:1;padding:10px;border:1px solid #ddd;background:#fff;color:#333;border-radius:8px;font-size:14px;cursor:pointer;">取消</button>'
                + '<button onclick="shopSaveCustomProduct()" style="flex:1;padding:10px;border:none;background:#111;color:#fff;border-radius:8px;font-size:14px;cursor:pointer;">保存</button>'
                + '</div></div>';
            document.body.appendChild(modal);
        }

        function shopCustomUploadImg() {
            var input = document.createElement('input');
            input.type = 'file'; input.accept = 'image/*';
            input.onchange = function() {
                var file = this.files[0]; if (!file) return;
                var reader = new FileReader();
                reader.onload = function(e) {
                    var imgVal = document.getElementById('shop-custom-img-val');
                    var imgArea = document.getElementById('shop-custom-img-area');
                    if (imgVal) imgVal.value = e.target.result;
                    if (imgArea) imgArea.innerHTML = '<img src="' + e.target.result + '" style="width:100%;height:100%;object-fit:cover;">';
                };
                reader.readAsDataURL(file);
            };
            input.click();
        }
        window.shopCustomUploadImg = shopCustomUploadImg;

        function shopSaveCustomProduct() {
            var name = (document.getElementById('shop-custom-name') || {}).value || '';
            var price = parseFloat((document.getElementById('shop-custom-price') || {}).value) || 0;
            var category = (document.getElementById('shop-custom-cat-val') || {}).value || '衣服';
            var desc = (document.getElementById('shop-custom-desc') || {}).value || '';
            var img = (document.getElementById('shop-custom-img-val') || {}).value || '';
            var editId = (document.getElementById('shop-custom-edit-id') || {}).value || '';

            if (!name.trim()) { toast('请输入商品名称'); return; }

            if (!store.shopCustomProducts) store.shopCustomProducts = [];

            if (editId) {
                var item = store.shopCustomProducts.find(function(p) { return p.id === editId; });
                if (item) {
                    item.name = name.trim();
                    item.price = price;
                    item.category = category;
                    item.desc = desc.trim();
                    if (img) item.images = [img];
                }
            } else {
                store.shopCustomProducts.push({
                    id: 'cprod_' + Date.now(),
                    name: name.trim(),
                    price: price,
                    desc: desc.trim(),
                    category: category,
                    images: img ? [img] : [],
                    seller: '自定义',
                    sellerAvatar: '',
                    fav: false,
                    isCustom: true,
                    createdAt: Date.now()
                });
            }
            save();
            // 关闭表单弹窗，刷新列表弹窗
            var formModal = document.getElementById('modal-shop-custom-form');
            if (formModal) formModal.remove();
            var listModal = document.getElementById('modal-shop-custom');
            if (listModal) listModal.remove();
            shopOpenCustomProducts();
            renderShopProducts();
            toast(editId ? '已更新' : '已添加');
        }
        window.shopSaveCustomProduct = shopSaveCustomProduct;

        function shopDeleteCustomProduct(id) {
            if (!confirm('删除这个自定义商品？')) return;
            if (!store.shopCustomProducts) return;
            // [商家系统] 保护来自"我的店铺"的商品(这些应该在商家页面里删除)
            var target = store.shopCustomProducts.find(function(p){ return p.id === id; });
            if (target && target.__fromMyStore) {
                if (typeof toast === 'function') toast('这是店铺商品，请到「我的店铺 > 商品管理」删除');
                return;
            }
            store.shopCustomProducts = store.shopCustomProducts.filter(function(p) { return p.id !== id; });
            save();
            var listModal = document.getElementById('modal-shop-custom');
            if (listModal) listModal.remove();
            shopOpenCustomProducts();
            renderShopProducts();
            toast('已删除');
        }
        window.shopDeleteCustomProduct = shopDeleteCustomProduct;

