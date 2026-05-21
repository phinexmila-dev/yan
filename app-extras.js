// ========== GACHA MACHINE MODULE ==========
(function(){
    // --- Data Init ---
    function initGachaData(){
        if(!store.gacha) store.gacha = {};
        if(!store.gacha.history) store.gacha.history = [];
        if(!store.gacha.memorial) store.gacha.memorial = [];
        if(!store.gacha.rates) store.gacha.rates = { r:70, sr:20, ssr:8, sss:2 };
        if(!store.gacha.totalDraws) store.gacha.totalDraws = 0;
    }

    // --- Constants ---
    var SINGLE_COST = 5;
    var TEN_COST = 45;

    // --- Rarity Roll ---
    function rollRarity(){
        var rates = store.gacha.rates || { r:70, sr:20, ssr:8, sss:2 };
        var rand = Math.random() * 100;
        if(rand < rates.sss) return 'sss';
        if(rand < rates.sss + rates.ssr) return 'ssr';
        if(rand < rates.sss + rates.ssr + rates.sr) return 'sr';
        return 'r';
    }

    // --- R Tier: Random shop product ---
    function generateR(){
        var products = store.shopProducts || [];
        if(products.length === 0){
            return { rarity:'r', name:'神秘小礼物', desc:'一份来自扭蛋机的小惊喜', type:'item' };
        }
        var p = products[Math.floor(Math.random() * products.length)];
        return { rarity:'r', name:p.name, desc:p.desc || '来自商城的商品', type:'item', productId:p.id, price:p.price, image:p.images && p.images[0] };
    }

    // --- SR Tier: Wish Voucher ---
    var SR_VOUCHERS = [
        { name:'星光纪念券', desc:'承载着星辰的祝福，愿你的每一个心愿都能被温柔以待。这张纪念券记录了你与TA之间的一段珍贵缘分。' },
        { name:'月华纪念券', desc:'月光洒落的瞬间，时间仿佛静止。这张纪念券是你们共同回忆的见证。' },
        { name:'流萤纪念券', desc:'如同夏夜的萤火虫，微小却温暖。这份纪念承载着不期而遇的美好。' },
        { name:'晨露纪念券', desc:'清晨第一缕阳光下的露珠，纯净而珍贵。这张纪念券象征着新的开始。' },
        { name:'霜雪纪念券', desc:'冬日里的一片雪花，独一无二。这份纪念是寒冷中最温暖的存在。' },
        { name:'彩虹纪念券', desc:'雨后天晴的彩虹，短暂却绚烂。这张纪念券记录了一个值得铭记的瞬间。' },
        { name:'樱花纪念券', desc:'春风中飘落的花瓣，浪漫而短暂。这份纪念是你们故事中最美的一页。' },
        { name:'极光纪念券', desc:'北极光般梦幻的色彩，可遇不可求。这张纪念券是命运赠予的礼物。' }
    ];

    function generateSR(){
        var v = SR_VOUCHERS[Math.floor(Math.random() * SR_VOUCHERS.length)];
        return { rarity:'sr', name:v.name, desc:v.desc, type:'voucher' };
    }

    // --- SSR Tier: Character-themed item via API ---
    async function generateSSR(){
        var contacts = store.contacts || [];
        if(contacts.length === 0){
            return { rarity:'ssr', name:'角色专属物品', desc:'一件与角色息息相关的珍贵物品', type:'character_item' };
        }
        var contact = contacts[Math.floor(Math.random() * contacts.length)];
        if(!store.system.url || !store.system.key){
            // Fallback without API
            return { rarity:'ssr', name:contact.name + '的专属物品', desc:'一件与' + contact.name + '性格相关的珍贵物品，承载着独特的记忆。', type:'character_item', contactName:contact.name, contactAvatar:contact.avatar };
        }
        try {
            var persona = contact.persona || contact.name;
            var prompt = '你是一个创意物品生成器。根据以下角色人设，生成一个与该角色性格、职业、爱好高度相关的专属物品。\n\n角色人设：' + persona.substring(0,500) + '\n\n请用JSON格式回复，包含name(物品名称，简短)和desc(物品描述，100-150字，描述物品的外观、来历和对角色的意义)。只返回JSON，不要其他内容。';
            // [FIX-副API路由] 使用API.chatCompletion统一走场景路由，不再直接fetch
            var data = await API.chatCompletion([{role:'user', content:prompt}], { temperature:0.9, silent:true, scene:'gacha' });
            var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
            var jsonMatch = text.match(/\{[\s\S]*?\}/);
            if(jsonMatch){
                var obj = JSON.parse(jsonMatch[0]);
                return { rarity:'ssr', name:obj.name || (contact.name+'的专属物品'), desc:obj.desc || '一件珍贵的角色专属物品', type:'character_item', contactName:contact.name, contactAvatar:contact.avatar };
            }
        } catch(e){ console.warn('SSR generation API error:', e); if (typeof logApiError === 'function') logApiError('扭蛋SSR生成失败: ' + e.message, { source: 'gacha' }); }
        return { rarity:'ssr', name:contact.name + '的专属物品', desc:'一件与' + contact.name + '性格相关的珍贵物品，承载着独特的记忆与情感。', type:'character_item', contactName:contact.name, contactAvatar:contact.avatar };
    }

    // --- SSS Tier: Handwritten letter via API ---
    async function generateSSS(){
        var contacts = store.contacts || [];
        if(contacts.length === 0){
            return { rarity:'sss', name:'手写信', desc:'亲爱的，\n\n见字如面。提笔不知道说什么好，脑子里转了好多圈，最后还是决定就这样写下来，想到哪儿说到哪儿。\n\n最近一直记挂着你，也说不清楚为什么，就是会在某些奇怪的瞬间突然想起你来——比如今天下楼买东西，路过那家你说过想去的店，我停在门口站了好一会儿，最后还是一个人走开了。\n\n你最近还好吗？不用说一定很好，就是随便说说，我只是想知道。\n\n落款人敬上', type:'letter' };
        }
        var contact = contacts[Math.floor(Math.random() * contacts.length)];

        // 获取用户名
        var userName = (store.personas && store.personas[0] && store.personas[0].name) ? store.personas[0].name : (store.user && store.user.name ? store.user.name : '你');

        if(!store.system.url || !store.system.key){
            return { rarity:'sss', name:contact.name + '的手写信', desc: contact.name + ' 亲笔：\n\n' + userName + '，\n\n见字如面。提笔的时候外面正在下雨，噼里啪啦的，挺吵的，但反而让我静下来想写点什么。\n\n最近一直在想我们之间的一些事，有些话憋着没说，今天趁着这封信说出来。你知道吗，有时候我觉得我们很近，近到我以为什么都不用说；有时候又觉得很远，远到我不知道从哪儿开口。\n\n就这样吧，希望你看到这封信的时候心情还不错。我好着呢，你放心。\n\n' + contact.name + ' 写于此刻', type:'letter', contactName:contact.name, contactAvatar:contact.avatar };
        }
        try {
            var persona = contact.persona || contact.name;

            // 获取世界书内容
            var worldBookContent = '';
            try {
                if (contact.settings && contact.settings.mountedWbIds && Array.isArray(contact.settings.mountedWbIds) && store.worldbooks) {
                    var mountedBooks = store.worldbooks.filter(function(wb){ return contact.settings.mountedWbIds.includes(wb.id); });
                    if (mountedBooks.length > 0) worldBookContent = mountedBooks.map(function(wb){ return wb.content; }).join('\n');
                } else if (contact.settings && contact.settings.wb && store.worldbooks) {
                    var wb = store.worldbooks.find(function(w){ return w.id === contact.settings.wb; });
                    if (wb) worldBookContent = wb.content;
                }
            } catch(_wbErr) { console.warn('[worldbook] 扭蛋获取世界书失败:', _wbErr); }

            // 获取全局记忆
            var memoryContext = '';
            // [FIX-记忆互通] 信件生成也读取关系网和线下数据，确保App间记忆互通
            if (typeof buildContactGlobalMemory === 'function') {
                memoryContext = buildContactGlobalMemory(contact.id, { sections: ['memory', 'chat', 'offline', 'couple', 'relation'] });
            } else if (store.memorySummaries && store.memorySummaries[contact.id]) {
                var mems = store.memorySummaries[contact.id];
                if (mems.length > 0) memoryContext = mems.slice(-5).map(function(m){ return m.content; }).join('；');
            }

            // 获取最近聊天记录
            var chatHistory = '';
            var chatData = (store.chats || {})[contact.id];
            if(chatData && chatData.length > 0){
                var recent = chatData.slice(-15).filter(function(m){ return m.type === 'text'; });
                chatHistory = recent.map(function(m){ return (m.sender === 'me' ? userName : contact.name) + '：' + (m.content || '').substring(0,120); }).join('\n');
            }

            // [FIX-时间感知v7] 扭蛋手写信：检查时间感知开关，关闭时不注入时间段；开启虚拟时间时使用虚拟时间
            var _letterPercOn = store.perception && store.perception.master && (contact.settings ? contact.settings.enablePerception !== false : true);
            var timeHint = '';
            if (_letterPercOn) {
                var _lp = store.perception;
                var hour = (_lp.customTime && _lp.timeVal) ? parseInt((_lp.timeVal || '12:00').split(':')[0]) : new Date().getHours();
                timeHint = hour < 6 ? '凌晨' : hour < 9 ? '早晨' : hour < 12 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : hour < 22 ? '晚上' : '深夜';
            }

            var prompt = `你是${contact.name}，正在给${userName}手写一封信。这封信会被装裱起来，是你认真提笔写下的，不是打字发消息。

【━━━ 你的人设（写信时必须完全体现，每一句话都要符合这个角色）━━━】
${persona.substring(0, 1200)}
【━━━ 人设结束 ━━━】

${worldBookContent ? `【━━━ 世界观背景（最高优先级，信件内容必须符合此世界观）━━━】\n${worldBookContent.substring(0, 800)}\n【━━━ 世界观结束 ━━━】\n` : ''}
${memoryContext ? `【你和${userName}之间的记忆——请在信件中自然融入这些共同经历】\n${memoryContext.substring(0, 600)}\n` : ''}
${chatHistory ? `【最近聊天记录（参考你们的感情状态和近期话题）】\n${chatHistory}\n` : ''}

${timeHint ? `当前时间段：${timeHint}` : ''}

【手写信要求】
1. 信件必须完全体现你的人设性格——你的语气、用词习惯、表达方式都必须是这个角色独有的
2. 这是一封手写信，不是微信消息，语气要比平时更沉静、更有深度，像是经过思考之后提笔写下的
3. 结合你们之间的记忆和近期聊天，写出有具体情感依托的内容，不要写空洞的通用情话
4. ⚠️ 信件正文必须至少500个字，要有真实的情感厚度和生活细节，内容充实，层次丰富
5. 必须包含：① 当下的状态/此刻的场景 ② 某个与${userName}相关的回忆或感受 ③ 你想说但平时不好意思开口的话 ④ 对未来的某个期待或想法 ⑤ 符合你人设的落款
6. 用中文写作，纯文本，不要使用任何markdown格式
7. 落款用你的名字：${contact.name}

【活人感强化——这是一封真实的手写信，不是AI生成的模板】
- 允许出现：思绪飘散（"写到这里突然想到……"）、自我纠正（"不对，我想说的不是这个……"）、犹豫停顿（"怎么说呢……"）、情绪的起伏变化
- 必须提到至少两个具体的生活细节：今天发生的小事、窗外的天气/声音、手边的东西、某个突然想起的场景——让这封信有"此刻感"
- 情绪要有层次：不要全篇一个调子，可以从日常写到感慨，从回忆写到期待，从轻松写到认真
- 字数要足够——不是凑字数，而是因为提起笔来有很多话想说，越写越多
- ⚠️ 绝对禁止：① 排比句式 ② "首先/其次/最后"式列举 ③ 每段都以"我"开头 ④ 完美工整的句式结构 ⑤ 通用情话模板（"你是我最特别的存在"之类的空话）

请直接写出信件内容，不要加任何额外说明或格式标记。`;

            // [FIX-副API路由] 使用API.chatCompletion统一走场景路由，不再直接fetch
            var data = await API.chatCompletion([{role:'system', content:'你是一个在给挚友/爱人写手写信的真实的人，不是AI。请用第一人称，以角色身份认真写信。'},{role:'user', content:prompt}], { temperature:0.92, silent:true, scene:'gacha' });
            var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
            if(text.trim()){
                // 去除可能的markdown残留
                var cleaned = text.trim().replace(/```[\s\S]*?```/g, '').replace(/^#+\s/gm, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').trim();
                return { rarity:'sss', name:contact.name + '的手写信', desc:cleaned, type:'letter', contactName:contact.name, contactAvatar:contact.avatar };
            }
        } catch(e){ console.warn('SSS generation API error:', e); if (typeof logApiError === 'function') logApiError('扭蛋SSS手写信生成失败: ' + e.message, { source: 'gacha' }); }
        return { rarity:'sss', name:contact.name + '的手写信', desc: contact.name + ' 亲笔：\n\n' + ((store.personas && store.personas[0] && store.personas[0].name) ? store.personas[0].name : '你') + '，\n\n见字如面。今天提笔写这封信，其实酝酿了好久，就是不知道从哪儿开口。\n\n最近日子过得挺平常的，但越是平常，反而越容易在某个瞬间突然想起你——比如今天吃饭，点了你以前说过想吃的那道菜，一个人吃的，觉得有点奇怪。要是你在就好了，我们可以一起。\n\n有些话平时打字总觉得说不清楚，借着这封信说出来：我挺庆幸认识你的。不是客套，就是真实地觉得，有你在，好多事都不一样了。\n\n希望你看到这封信的时候一切都好。我这边也好，你放心。\n\n' + contact.name + ' 写', type:'letter', contactName:contact.name, contactAvatar:contact.avatar };
    }

    // --- Generate reward by rarity ---
    async function generateReward(rarity){
        switch(rarity){
            case 'r': return generateR();
            case 'sr': return generateSR();
            case 'ssr': return await generateSSR();
            case 'sss': return await generateSSS();
            default: return generateR();
        }
    }

    // --- Open Gacha Machine ---
    window.openGachaMachine = function(){
        initGachaData();
        document.getElementById('layer-gacha').classList.add('show');
        updateGachaUI();
    };

    // --- Update UI ---
    function updateGachaUI(){
        // Balance
        document.getElementById('gacha-balance-val').textContent = (store.user.balance || 0).toFixed(2);
        // Rates display
        var rates = store.gacha.rates || { r:70, sr:20, ssr:8, sss:2 };
        var rateTags = document.querySelectorAll('.gacha-rate-tag');
        if(rateTags.length >= 4){
            rateTags[0].textContent = 'R ' + rates.r + '%';
            rateTags[1].textContent = 'SR ' + rates.sr + '%';
            rateTags[2].textContent = 'SSR ' + rates.ssr + '%';
            rateTags[3].textContent = 'SSS ' + rates.sss + '%';
        }
        // Balls in dome
        renderGachaBalls();
        // History
        renderGachaHistory();
    }

    // [PERF] 缓存扭蛋球DOM，避免每次重新创建
    var _gachaBallsCreated = false;
    function renderGachaBalls(){
        var container = document.getElementById('gacha-balls-container');
        if(!container) return;
        // 只在首次或容器为空时创建扭蛋球
        if(_gachaBallsCreated && container.children.length > 0) {
            // 只重新随机位置，不重建DOM
            var balls = container.children;
            for(var i = 0; i < balls.length; i++){
                balls[i].style.left = (Math.random() * 80 + 5) + '%';
                balls[i].style.top = (Math.random() * 70 + 15) + '%';
            }
            return;
        }
        container.innerHTML = '';
        var rarities = ['r','r','r','r','r','r','sr','sr','sr','ssr','ssr','sss'];
        // [PERF] 使用DocumentFragment批量插入，减少回流
        var frag = document.createDocumentFragment();
        for(var i = 0; i < 15; i++){ // 从20个减少到15个
            var ball = document.createElement('div');
            ball.className = 'gacha-ball ' + rarities[Math.floor(Math.random() * rarities.length)];
            ball.style.position = 'absolute';
            ball.style.left = (Math.random() * 80 + 5) + '%';
            ball.style.top = (Math.random() * 70 + 15) + '%';
            ball.style.animationDelay = (Math.random() * 0.3) + 's';
            frag.appendChild(ball);
        }
        container.appendChild(frag);
        _gachaBallsCreated = true;
    }

    function renderGachaHistory(){
        var list = document.getElementById('gacha-history-list');
        if(!list) return;
        var history = (store.gacha.history || []).slice(-20).reverse();
        if(history.length === 0){
            list.innerHTML = '<div style="text-align:center; padding:30px; color:rgba(255,255,255,0.3); font-size:13px;">还没有抽奖记录</div>';
            return;
        }
        list.innerHTML = history.map(function(item){
            var rarityLabel = item.rarity.toUpperCase();
            var timeStr = new Date(item.time).toLocaleString('zh-CN', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
            return '<div class="gacha-history-item">' +
                '<span class="gacha-history-rarity ' + item.rarity + '">' + rarityLabel + '</span>' +
                '<span class="gacha-history-name">' + (item.name||'未知物品') + '</span>' +
                '<span class="gacha-history-time">' + timeStr + '</span>' +
                '</div>';
        }).join('');
    }

    // --- Draw ---
    var _gachaDrawing = false;
    window.gachaDraw = async function(count){
        if(_gachaDrawing) return; // 防止重复点击
        initGachaData();
        var cost = count === 10 ? TEN_COST : SINGLE_COST;
        if((store.user.balance || 0) < cost){
            return toast('余额不足，请先充值');
        }
        _gachaDrawing = true;
        // 禁用按钮
        var btns = document.querySelectorAll('.gacha-draw-btn');
        btns.forEach(function(b){ b.disabled = true; b.style.opacity = '0.5'; });

        // Deduct balance
        store.user.balance -= cost;
        store.bills = store.bills || [];
        store.bills.push({ type:'out', amt:cost, desc:'扭蛋机 x' + count, time:Date.now() });

        // [PERF] 立即更新余额显示
        var balEl = document.getElementById('gacha-balance-val');
        if(balEl) balEl.textContent = (store.user.balance || 0).toFixed(2);

        // Machine shake animation
        var machine = document.getElementById('gacha-capsule-machine');
        if(machine){
            machine.classList.add('drawing');
            setTimeout(function(){ machine.classList.remove('drawing'); }, 600);
        }

        // Generate rewards — 并行化API调用，大幅减少10连抽等待时间
        // [PERF] 对于R和SR级别使用同步生成，只有SSR/SSS需要异步API
        var rewardPromises = [];
        var rarities_drawn = [];
        for(var i = 0; i < count; i++){
            var rarity = rollRarity();
            rarities_drawn.push(rarity);
            rewardPromises.push(generateReward(rarity));
        }

        var results;
        try {
            results = await Promise.all(rewardPromises);
        } catch(e) {
            console.error('Gacha reward generation error:', e);
            // 回退到本地生成
            results = [];
            for(var i = 0; i < count; i++){
                if(rarities_drawn[i] === 'ssr'){
                    results.push({ rarity:'ssr', name:'角色专属物品', desc:'一件珍贵的角色专属物品', type:'character_item' });
                } else if(rarities_drawn[i] === 'sss'){
                    results.push({ rarity:'sss', name:'手写信', desc:'一封充满心意的手写信', type:'letter' });
                } else {
                    results.push(generateReward(rarities_drawn[i]));
                }
            }
            results = await Promise.all(results.map(function(r){ return Promise.resolve(r); }));
        }

        var now = Date.now();
        for(var i = 0; i < results.length; i++){
            results[i].time = now + i; // 保证唯一时间戳
            results[i].id = 'gacha_' + now + '_' + i + '_' + Math.random().toString(36).substr(2,6);
            store.gacha.history.push(results[i]);
            if(rarities_drawn[i] !== 'r'){
                store.gacha.memorial.push(results[i]);
            }
        }
        store.gacha.totalDraws = (store.gacha.totalDraws || 0) + count;
        save();

        // [PERF] 延迟UI更新，先显示结果动画
        // 等摇晃动画结束后再显示结果
        var showDelay = machine ? 500 : 0;
        setTimeout(function(){
            showGachaResults(results);
            // [PERF] 延迟更新历史列表，避免与结果动画同时渲染
            setTimeout(function(){
                updateGachaUI();
                // 恢复按钮
                _gachaDrawing = false;
                btns.forEach(function(b){ b.disabled = false; b.style.opacity = ''; });
            }, 300);
        }, showDelay);
    };

    // --- Show Results ---
    function showGachaResults(results){
        var overlay = document.getElementById('gacha-result-overlay');
        var container = document.getElementById('gacha-result-container');
        if(!overlay || !container) return;

        // 添加关闭按钮
        var closeBtnHtml = '<div class="gacha-result-close-btn" onclick="closeGachaResult()" style="position:absolute;top:8px;right:8px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;font-size:18px;color:rgba(255,255,255,0.7);">✕</div>';

        if(results.length === 1){
            // 单抽：直接渲染
            container.innerHTML = closeBtnHtml + renderResultCard(results[0], true) +
                '<div class="gacha-result-close-hint" onclick="closeGachaResult()">点击此处或空白处关闭</div>';
            overlay.style.display = 'flex';
        } else {
            // [PERF] 十连抽：使用requestAnimationFrame分批渲染，避免一次性DOM操作导致卡顿
            var gridDiv = document.createElement('div');
            gridDiv.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';
            container.innerHTML = closeBtnHtml;
            container.appendChild(gridDiv);
            overlay.style.display = 'flex';

            // 分批渲染卡片，每帧渲染2张
            var idx = 0;
            function renderBatch(){
                if(idx >= results.length){
                    // 所有卡片渲染完毕，添加关闭提示
                    var hint = document.createElement('div');
                    hint.className = 'gacha-result-close-hint';
                    hint.textContent = '点击此处或空白处关闭';
                    hint.onclick = function(){ closeGachaResult(); };
                    container.appendChild(hint);
                    return;
                }
                var batchEnd = Math.min(idx + 2, results.length);
                var frag = document.createDocumentFragment();
                for(var b = idx; b < batchEnd; b++){
                    var cardWrapper = document.createElement('div');
                    cardWrapper.innerHTML = renderResultCard(results[b], false);
                    // 为每张卡片添加递增的动画延迟
                    var card = cardWrapper.firstElementChild;
                    if(card) {
                        card.style.animationDelay = (b * 0.08) + 's';
                        frag.appendChild(card);
                    }
                }
                gridDiv.appendChild(frag);
                idx = batchEnd;
                requestAnimationFrame(renderBatch);
            }
            requestAnimationFrame(renderBatch);
        }
    }

    function renderResultCard(item, large){
        var rarityLabel = item.rarity.toUpperCase();
        var icon = '';
        switch(item.rarity){
            case 'r': icon = '🎁'; break;
            case 'sr': icon = '🌟'; break;
            case 'ssr': icon = '✨'; break;
            case 'sss': icon = '💌'; break;
        }
        var descText = item.desc || '';
        if(!large && descText.length > 60) descText = descText.substring(0,60) + '...';
        if(item.type === 'letter' && large){
            descText = '<div style="text-align:left; white-space:pre-wrap; font-style:italic; max-height:200px; overflow-y:auto; padding:10px; background:rgba(0,0,0,0.45); border-radius:10px; margin-top:8px; color:#fff; line-height:1.8; font-size:13px;">' + escapeHtml(item.desc) + '</div>';
        } else {
            descText = '<div class="gacha-result-desc">' + escapeHtml(descText) + '</div>';
        }
        var contactInfo = '';
        if(item.contactName){
            contactInfo = '<div style="font-size:12px; color:rgba(255,255,255,0.4); margin-top:6px;">来自 ' + escapeHtml(item.contactName) + '</div>';
        }
        var sizeStyle = large ? '' : 'style="padding:14px;"';
        return '<div class="gacha-result-card ' + item.rarity + '" ' + sizeStyle + '>' +
            '<div style="font-size:' + (large ? '36px' : '24px') + '; margin-bottom:8px;">' + icon + '</div>' +
            '<div class="gacha-result-rarity">' + rarityLabel + '</div>' +
            '<div class="gacha-result-name" style="font-size:' + (large ? '18px' : '13px') + ';">' + escapeHtml(item.name) + '</div>' +
            descText + contactInfo +
            '</div>';
    }

    function escapeHtml(str){
        if(!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    window.closeGachaResult = function(){
        document.getElementById('gacha-result-overlay').style.display = 'none';
    };

    // --- Memorial ---
    window.openGachaMemorial = function(){
        initGachaData();
        document.getElementById('layer-gacha-memorial').classList.add('show');
        switchMemorialTab('sr', document.querySelector('.memorial-tab.active') || document.querySelector('.memorial-tab'));
    };

    window.switchMemorialTab = function(tab, el){
        document.querySelectorAll('.memorial-tab').forEach(function(t){ t.classList.remove('active'); });
        if(el) el.classList.add('active');
        renderMemorialGrid(tab);
    };

    function renderMemorialGrid(filter){
        var grid = document.getElementById('memorial-grid');
        if(!grid) return;
        var items = (store.gacha && store.gacha.memorial) || [];
        if(filter && filter !== 'all'){
            items = items.filter(function(i){ return i.rarity === filter; });
        }
        if(items.length === 0){
            grid.innerHTML = '<div class="memorial-empty"><i class="fas fa-gem" style="color:rgba(255,215,0,0.3);"></i><div style="color:rgba(255,255,255,0.4); font-size:14px;">还没有收藏品</div><div style="color:rgba(255,255,255,0.2); font-size:12px; margin-top:4px;">去扭蛋机试试手气吧</div></div>';
            return;
        }
        grid.innerHTML = items.slice().reverse().map(function(item){
            var rarityLabel = item.rarity.toUpperCase();
            var dateStr = item.time ? new Date(item.time).toLocaleDateString('zh-CN') : '';
            return '<div class="memorial-card ' + item.rarity + '" onclick="showMemorialDetail(\'' + item.id + '\')">' +
                '<div class="memorial-card-rarity" style="display:inline-block; padding:2px 8px; border-radius:6px;">' + rarityLabel + '</div>' +
                '<div class="memorial-card-name">' + escapeHtml(item.name) + '</div>' +
                (item.contactName ? '<div class="memorial-card-from">来自 ' + escapeHtml(item.contactName) + '</div>' : '') +
                '<div class="memorial-card-date">' + dateStr + '</div>' +
                '</div>';
        }).join('');
    }

    window.showMemorialDetail = function(id){
        var items = (store.gacha && store.gacha.memorial) || [];
        var item = items.find(function(i){ return i.id === id; });
        if(!item) return;
        var content = document.getElementById('memorial-detail-content');
        if(!content) return;
        var rarityLabel = item.rarity.toUpperCase();
        var rarityColors = { sr:'#5dade2', ssr:'#f1c40f', sss:'#ff6b81' };
        var icon = item.rarity === 'sss' ? '💌' : item.rarity === 'ssr' ? '✨' : '🌟';
        var descHtml = '';
        if(item.type === 'letter'){
            descHtml = '<div class="memorial-detail-content" style="white-space:pre-wrap; font-style:italic; background:rgba(255,255,255,0.05); padding:16px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">' + escapeHtml(item.desc) + '</div>';
        } else {
            descHtml = '<div class="memorial-detail-content">' + escapeHtml(item.desc) + '</div>';
        }
        content.innerHTML =
            '<div style="text-align:center; font-size:40px; margin-bottom:10px;">' + icon + '</div>' +
            '<div class="memorial-detail-rarity" style="color:' + (rarityColors[item.rarity]||'#fff') + ';">' + rarityLabel + '</div>' +
            '<div class="memorial-detail-name">' + escapeHtml(item.name) + '</div>' +
            (item.contactName ? '<div class="memorial-detail-from">来自 ' + escapeHtml(item.contactName) + '</div>' : '') +
            descHtml +
            (item.time ? '<div class="memorial-detail-date">' + new Date(item.time).toLocaleString('zh-CN') + '</div>' : '');
        document.getElementById('modal-memorial-detail').style.display = 'flex';
    };

    // --- Contact Rate Adjustment Notification ---
    // Called from chat context when a character wants to adjust gacha rates
    window.triggerGachaRateAdjust = function(contactId, newRates, message){
        initGachaData();
        var contact = (store.contacts || []).find(function(c){ return c.id === contactId; });
        if(!contact) return;
        // Validate rates sum to 100
        var sum = (newRates.r||0) + (newRates.sr||0) + (newRates.ssr||0) + (newRates.sss||0);
        if(Math.abs(sum - 100) > 1) return;
        // Apply new rates
        store.gacha.rates = { r:newRates.r, sr:newRates.sr, ssr:newRates.ssr, sss:newRates.sss };
        save();
        // Show notification popup
        showGachaContactNotify(contact, message || (contact.name + ' 悄悄调整了扭蛋机的掉率...'));
    };

    function showGachaContactNotify(contact, message){
        var notify = document.getElementById('gacha-contact-notify');
        var inner = document.getElementById('gacha-notify-inner');
        if(!notify || !inner) return;
        inner.innerHTML =
            '<div style="display:flex; align-items:center; gap:12px; padding:14px 18px;">' +
            '<img class="gacha-notify-avatar" src="' + (contact.avatar || _ph(40)) + '">' +
            '<div class="gacha-notify-text"><span class="gacha-notify-name">' + escapeHtml(contact.name) + '</span> ' + escapeHtml(message) + '</div>' +
            '</div>';
        notify.style.display = 'block';
        setTimeout(function(){ notify.style.display = 'none'; }, 4000);
    }

    // --- Expose for chat AI to call rate adjustment ---
    // Format: window.triggerGachaRateAdjust(contactId, {r:60, sr:25, ssr:12, sss:3}, "我偷偷给你加了好运哦~")

})();
// ===== MAIL ENHANCEMENT: Templates, Stamps, Postage, Drift Bottle =====
(function() {
'use strict';

var LETTER_TEMPLATES = [
    { id:'vintage-parchment', name:'复古羊皮纸', bg:'linear-gradient(135deg,#f5e6c8,#e8d5a3,#f0deb8)', border:'2px solid #c9a84c', font:'"Georgia","Noto Serif SC",serif', color:'#3e2c0a', texture:'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(139,119,75,.08) 28px,rgba(139,119,75,.08) 29px)' },
    { id:'vintage-stationery', name:'复古信笺', bg:'linear-gradient(180deg,#faf6ee,#f5efe0)', border:'1px solid #d4c5a0', font:'"Georgia","Noto Serif SC",serif', color:'#4a3520', texture:'repeating-linear-gradient(0deg,transparent,transparent 30px,rgba(180,160,120,.12) 30px,rgba(180,160,120,.12) 31px)' },
    { id:'postcard', name:'明信片', bg:'linear-gradient(135deg,#fff9ed,#ffecd2)', border:'3px double #c9a84c', font:'"Courier New","Noto Serif SC",serif', color:'#5a4530', texture:'none' },
    { id:'white-paper', name:'素白纸', bg:'#fff', border:'1px solid #e0e0e0', font:'system-ui,sans-serif', color:'#333', texture:'none' },
    { id:'kraft-paper', name:'牛皮纸', bg:'linear-gradient(135deg,#c4a265,#b8956a,#d4b07a)', border:'2px solid #8b6914', font:'"Georgia","Noto Serif SC",serif', color:'#3a2a0a', texture:'repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(0,0,0,.02) 10px,rgba(0,0,0,.02) 20px)' }
];

var RED_STAMPS = [
    {id:'stamp-cat',name:'猫咪',emoji:'🐱'},{id:'stamp-dog',name:'小狗',emoji:'🐶'},
    {id:'stamp-fox',name:'狐狸',emoji:'🦊'},{id:'stamp-bird',name:'小鸟',emoji:'🐦'},
    {id:'stamp-rabbit',name:'兔子',emoji:'🐰'},{id:'stamp-bear',name:'小熊',emoji:'🐻'},
    {id:'stamp-panda',name:'熊猫',emoji:'🐼'},{id:'stamp-deer',name:'小鹿',emoji:'🦌'},
    {id:'stamp-butterfly',name:'蝴蝶',emoji:'🦋'},{id:'stamp-whale',name:'鲸鱼',emoji:'🐋'}
];

var POSTAGE_STAMPS = [
    {id:'post-sakura',name:'樱花',emoji:'🌸',color:'#ffb7c5'},
    {id:'post-mountain',name:'山峰',emoji:'🏔️',color:'#87ceeb'},
    {id:'post-moon',name:'明月',emoji:'🌙',color:'#ffd700'},
    {id:'post-star',name:'星辰',emoji:'⭐',color:'#4a90d9'},
    {id:'post-sun',name:'朝阳',emoji:'🌅',color:'#ff6b35'},
    {id:'post-wave',name:'海浪',emoji:'🌊',color:'#0077be'},
    {id:'post-bamboo',name:'竹林',emoji:'🎋',color:'#228b22'},
    {id:'post-maple',name:'红叶',emoji:'🍁',color:'#c0392b'},
    {id:'post-snow',name:'雪花',emoji:'❄️',color:'#b0d4f1'},
    {id:'post-rose',name:'玫瑰',emoji:'🌹',color:'#e74c3c'},
    {id:'post-lotus',name:'荷花',emoji:'🪷',color:'#f8a5c2'},
    {id:'post-crane',name:'仙鹤',emoji:'🦢',color:'#f0e6d3'},
    {id:'post-lantern',name:'灯笼',emoji:'🏮',color:'#e74c3c'},
    {id:'post-kite',name:'风筝',emoji:'🪁',color:'#3498db'},
    {id:'post-tea',name:'清茶',emoji:'🍵',color:'#8fbc8f'},
    {id:'post-ink',name:'水墨',emoji:'🖌️',color:'#2c3e50'},
    {id:'post-cloud',name:'祥云',emoji:'☁️',color:'#ecf0f1'},
    {id:'post-fish',name:'锦鲤',emoji:'🐟',color:'#e67e22'},
    {id:'post-bell',name:'风铃',emoji:'🔔',color:'#f39c12'},
    {id:'post-feather',name:'羽毛',emoji:'🪶',color:'#9b59b6'}
];

var selTpl = LETTER_TEMPLATES[0].id, selStamp = null, selPost = null;

function gt(id){return LETTER_TEMPLATES.find(function(x){return x.id===id;})||LETTER_TEMPLATES[0];}
function gs(id){return RED_STAMPS.find(function(x){return x.id===id;});}
function gp(id){return POSTAGE_STAMPS.find(function(x){return x.id===id;});}
function esc(s){return typeof escapeHtml==='function'?escapeHtml(s):s.replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c;});}
function ft(t){return typeof formatMailTime==='function'?formatMailTime(t):new Date(t).toLocaleString();}

function buildDeco(cid,sp){
    var b=document.getElementById(cid);if(!b)return;
    var h='<div class="deco-section"><div class="deco-label">信纸</div><div class="deco-scroll">';
    LETTER_TEMPLATES.forEach(function(t){
        h+='<div class="deco-item'+(selTpl===t.id?' selected':'')+'" onclick="selDeco(\'t\',\''+t.id+'\',\''+cid+'\','+(sp?1:0)+')" title="'+t.name+'"><div class="deco-preview-tpl" style="background:'+t.bg+';border:'+t.border+'"></div><span>'+t.name+'</span></div>';
    });
    h+='</div></div><div class="deco-section"><div class="deco-label">印章</div><div class="deco-scroll">';
    h+='<div class="deco-item'+(!selStamp?' selected':'')+'" onclick="selDeco(\'s\',\'\',\''+cid+'\','+(sp?1:0)+')"><div class="deco-preview-stamp none">✕</div><span>无</span></div>';
    RED_STAMPS.forEach(function(s){
        h+='<div class="deco-item'+(selStamp===s.id?' selected':'')+'" onclick="selDeco(\'s\',\''+s.id+'\',\''+cid+'\','+(sp?1:0)+')"><div class="deco-preview-stamp">'+s.emoji+'</div><span>'+s.name+'</span></div>';
    });
    h+='</div></div>';
    if(sp){
        h+='<div class="deco-section"><div class="deco-label">邮票</div><div class="deco-scroll">';
        h+='<div class="deco-item'+(!selPost?' selected':'')+'" onclick="selDeco(\'p\',\'\',\''+cid+'\',1)"><div class="deco-preview-post none">✕</div><span>无</span></div>';
        POSTAGE_STAMPS.forEach(function(p){
            h+='<div class="deco-item'+(selPost===p.id?' selected':'')+'" onclick="selDeco(\'p\',\''+p.id+'\',\''+cid+'\',1)"><div class="deco-preview-post" style="background:'+p.color+'">'+p.emoji+'</div><span>'+p.name+'</span></div>';
        });
        h+='</div></div>';
    }
    b.innerHTML=h;
}

window.selDeco=function(type,val,cid,sp){
    if(type==='t')selTpl=val;
    else if(type==='s')selStamp=val||null;
    else if(type==='p')selPost=val||null;
    buildDeco(cid,!!sp);
    applyTpl('mail-body');applyTpl('drift-compose-body');
};

function applyTpl(id){
    var t=gt(selTpl),el=document.getElementById(id);if(!el)return;
    el.style.background=t.bg;el.style.color=t.color;el.style.fontFamily=t.font;
    el.style.backgroundImage=(t.texture&&t.texture!=='none')?t.texture:'none';
}

// Enhanced compose
var _oc=window.openComposeMail;
window.openComposeMail=function(){
    selTpl=LETTER_TEMPLATES[0].id;selStamp=null;selPost=null;
    if(_oc)_oc();
    setTimeout(function(){buildDeco('mail-decoration-bar',true);applyTpl('mail-body');},60);
};

// Enhanced send
window.sendMail=function(){
    if(!mailComposeToId)return showToast('请选择收件人');
    var subj=document.getElementById('mail-subject').value.trim();
    var body=document.getElementById('mail-body').value.trim();
    if(!body)return showToast('请输入邮件内容');
    if(typeof ensureMailbox==='function')ensureMailbox();
    // 写信上限只针对联系人自动来信，不限制用户主动写信
    // if(!window._mailIsReply && typeof getMailDailyCount==='function'){
    //     var dc=getMailDailyCount(mailComposeToId);
    //     if(dc.count>=2)return showToast('今天给TA写的信已经够多了，明天再写吧。');
    //     incrementMailDailyCount(mailComposeToId);
    // }
    var isReplyMail = window._mailIsReply;
    var replyOriginal = window._mailReplyOriginal || null;
    window._mailIsReply=false;
    window._mailReplyOriginal=null;
    var mid='mail_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);
    var _toCtx=(store.contacts||[]).find(function(c){return c.id===mailComposeToId;});
    store.mailbox.push({id:mid,from:'__user__',to:mailComposeToId,subject:subj||'(无主题)',body:body,time:Date.now(),read:true,starred:false,type:'sent',template:selTpl,stamp:selStamp,postage:selPost,senderName:_toCtx?_toCtx.name:''});
    save();closeLayer('layer-mail-compose');showToast('邮件已发送');
    if(typeof renderMailList==='function')renderMailList();
    var ct=(store.contacts||[]).find(function(c){return c.id===mailComposeToId;});
    if(ct&&typeof generateAIMailReply==='function'){
        // 回复时传递原始邮件上下文，确保AI根据完整信件内容生成回复
        var origBody = isReplyMail && replyOriginal ? replyOriginal.body : '';
        setTimeout(function(){generateAIMailReply(ct,subj,body,origBody);},3000+Math.random()*7000);
    }
};

// Enhanced read
var _or=window.openReadMail;
window.openReadMail=function(id){
    if(_or)_or(id);
    setTimeout(function(){
        var m=(store.mailbox||[]).find(function(x){return x.id===id;});if(!m)return;
        var rc=document.getElementById('mail-read-content');if(!rc)return;
        var t=gt(m.template);
        rc.style.background=t.bg;rc.style.color=t.color;rc.style.fontFamily=t.font;
        rc.style.backgroundImage=(t.texture&&t.texture!=='none')?t.texture:'none';
        var os=document.getElementById('mail-read-stamp');if(os)os.remove();
        var op=document.getElementById('mail-read-postage');if(op)op.remove();
        if(m.stamp){var s=gs(m.stamp);if(s){var se=document.createElement('div');se.id='mail-read-stamp';se.className='mail-read-stamp';se.innerHTML='<span class="stamp-emoji">'+s.emoji+'</span>';rc.appendChild(se);}}
        if(m.postage){var p=gp(m.postage);if(p){var pe=document.createElement('div');pe.id='mail-read-postage';pe.className='mail-read-postage';pe.innerHTML='<span class="postage-emoji">'+p.emoji+'</span>';pe.style.background=p.color;rc.appendChild(pe);}}
    },60);
};

// ===== DRIFT BOTTLE =====
function ed(){if(!store.driftBottles)store.driftBottles=[];}

window.openDriftBottle=function(){ed();var ly=document.getElementById('layer-drift-bottle');if(ly)ly.classList.add('show');rdh();};
window.closeDriftBottle=function(){closeLayer('layer-drift-bottle');};

function rdh(){
    ed();var ct=document.getElementById('drift-bottle-content');if(!ct)return;
    var mc=store.driftBottles.filter(function(b){return b.from==='__user__';}).length;
    var pc=store.driftBottles.filter(function(b){return b.from!=='__user__'&&b.pickedByMe;}).length;
    ct.innerHTML='<div class="drift-ocean"><div class="drift-ocean-waves"></div><div class="drift-ocean-bottle" onclick="pickDriftBottle()"><div class="drift-bottle-icon">🍾</div><div class="drift-bottle-label">捡一个漂流瓶</div></div></div><div class="drift-actions-row"><div class="drift-action-btn" onclick="openDriftCompose()"><i class="fas fa-paper-plane"></i><span>投瓶</span></div><div class="drift-action-btn" onclick="viewMyDriftBottles()"><i class="fas fa-bottle-water"></i><span>我的瓶子 ('+mc+')</span></div><div class="drift-action-btn" onclick="viewPickedBottles()"><i class="fas fa-hand-holding-heart"></i><span>捡到的 ('+pc+')</span></div></div><div id="drift-bottle-list"></div>';
}

window.openDriftCompose=function(){
    selTpl=LETTER_TEMPLATES[0].id;selStamp=null;selPost=null;
    var ly=document.getElementById('layer-drift-compose');if(!ly)return;ly.classList.add('show');
    var ta=document.getElementById('drift-compose-body');if(ta)ta.value='';
    setTimeout(function(){buildDeco('drift-decoration-bar',false);applyTpl('drift-compose-body');},60);
};

window.sendDriftBottle=function(){
    var body=(document.getElementById('drift-compose-body').value||'').trim();
    if(!body)return showToast('请写点什么再投瓶吧');
    var bid='bottle_'+Date.now()+'_'+Math.random().toString(36).substr(2,6);
    ed();store.driftBottles.push({id:bid,from:'__user__',body:body,template:selTpl,stamp:selStamp,time:Date.now(),replies:[],pickedBy:null});
    save();closeLayer('layer-drift-compose');showToast('漂流瓶已投入大海 🌊');rdh();
    // 随机延迟后生成一条NPC/角色回复
    setTimeout(function(){generateBottleReply(bid);},3000+Math.random()*8000);
};

function generateBottleReply(bid){
    _currentApiScene = 'bottle';
    ed();var bot=store.driftBottles.find(function(b){return b.id===bid;});
    if(!bot||bot.from!=='__user__')return;
    // 每个瓶子只允许一条回复
    if(bot.replies&&bot.replies.length>0)return;
    var cts=(store.contacts||[]).filter(function(c){return!c.isGroup;});
    var isNpc=Math.random()>0.5||cts.length===0;
    var rName,rPersona,rId;
    if(isNpc){
        var ns=['远方的旅人','海边的诗人','山间的隐者','城市的梦想家','星空下的思考者','雨中的漫步者','花园里的园丁','深夜的读书人','清晨的跑步者','黄昏的画家'];
        rName=ns[Math.floor(Math.random()*ns.length)];rPersona='一个有着丰富内心世界的陌生人';rId='stranger_'+Math.random().toString(36).substr(2,6);
    }else{
        var c=cts[Math.floor(Math.random()*cts.length)];rName=c.name;rPersona=c.persona||'一个有个性的人';rId=c.id;
    }
    var sys='你是"'+rName+'"，人设：'+rPersona.substring(0,500)+'。\n你在海边捡到了一个漂流瓶，里面写着：\n"'+bot.body.substring(0,300)+'"\n\n请以你的身份写一段回复，真诚自然，符合你的人设性格，纯文字输出，100字以内。';
    API.chatCompletion([{role:'system',content:sys},{role:'user',content:'请回复这个漂流瓶'}],{temperature:0.85,silent:true,scene:'drift-bottle'}).then(function(d){
        var txt=d.choices[0].message.content.trim();
        bot.replies.push({from:rId,fromName:rName,body:txt,time:Date.now()});
        bot.pickedBy=rId;save();
        showToast('"'+rName+'"捡到了你的漂流瓶并回复了 🍾');
    }).catch(function(){
        var fbs=['你的文字让我想起了很多事情，谢谢你。','在这个世界上，能读到陌生人的心声，是一件很温暖的事。','希望写下这些字的你，此刻一切都好。','你的瓶子漂了很远才到我手里，感觉很奇妙。','读完你的话，我在海边坐了很久。'];
        bot.replies.push({from:rId,fromName:rName,body:fbs[Math.floor(Math.random()*fbs.length)],time:Date.now()});
        bot.pickedBy=rId;save();
        showToast('"'+rName+'"捡到了你的漂流瓶并回复了 🍾');
    });
}

window.pickDriftBottle=function(){
    ed();var list=document.getElementById('drift-bottle-list');if(!list)return;
    list.innerHTML='<div class="drift-loading"><div class="drift-loading-spinner"></div><span>正在捞瓶子...</span></div>';
    grb();
};

function grb(){
    var cts=(store.contacts||[]).filter(function(c){return !c.isGroup;});
    var us=Math.random()>0.5||cts.length===0;
    var sn,sp,si;
    if(us){var ns=['远方的旅人','海边的诗人','山间的隐者','城市的梦想家','星空下的思考者','雨中的漫步者','花园里的园丁','深夜的读书人','清晨的跑步者','黄昏的画家'];sn=ns[Math.floor(Math.random()*ns.length)];sp='一个有着丰富内心世界的陌生人';si='stranger_'+Math.random().toString(36).substr(2,6);}
    else{var c=cts[Math.floor(Math.random()*cts.length)];sn=c.name;sp=c.persona||'一个有个性的人';si=c.id;}
    var tps=['今天的心情','一个小秘密','对未来的期待','最近的感悟','一段回忆','想对陌生人说的话','此刻的风景','一首诗','一个故事片段','深夜的想法'];
    var tp=tps[Math.floor(Math.random()*tps.length)];
    var sys='你是"'+sn+'"，人设：'+sp+'。\n你正在写一个漂流瓶，主题是"'+tp+'"。\n要求：内容真情实感，随性而写，符合人设，不要俗套开头，纯文字输出。';
    API.chatCompletion([{role:'system',content:sys},{role:'user',content:'写一个漂流瓶'}],{temperature:0.9,silent:true,scene:'drift-bottle'}).then(function(d){
        var bb=d.choices[0].message.content.trim();
        var rt=LETTER_TEMPLATES[Math.floor(Math.random()*LETTER_TEMPLATES.length)];
        var rs=Math.random()>0.3?RED_STAMPS[Math.floor(Math.random()*RED_STAMPS.length)]:null;
        var bot={id:'bottle_'+Date.now()+'_'+Math.random().toString(36).substr(2,6),from:si,fromName:sn,body:bb,template:rt.id,stamp:rs?rs.id:null,time:Date.now()-Math.floor(Math.random()*86400000),replies:[],pickedByMe:true};
        ed();store.driftBottles.push(bot);save();spb(bot);
    }).catch(function(){
        var ms=['今天的云很好看，像是棉花糖铺满了天空。','有时候觉得，人和人之间的缘分就像这个瓶子。','深夜写下这些字的时候，窗外下着小雨。','你正在做的事情，比你想象的更有意义。加油。','刚刚吃了一碗很好吃的面，突然觉得生活其实挺好的。'];
        var bot={id:'bottle_'+Date.now(),from:'stranger',fromName:'远方的陌生人',body:ms[Math.floor(Math.random()*ms.length)],template:'vintage-parchment',stamp:null,time:Date.now(),replies:[],pickedByMe:true};
        ed();store.driftBottles.push(bot);save();spb(bot);
    });
}

function spb(bot){
    var t=gt(bot.template),s=bot.stamp?gs(bot.stamp):null;
    var list=document.getElementById('drift-bottle-list');if(!list)return;
    var rh='';
    if(bot.replies&&bot.replies.length>0){
        rh='<div class="drift-replies"><div class="drift-replies-title">对话记录</div>';
        bot.replies.forEach(function(r){rh+='<div class="drift-reply-item '+(r.from==='__user__'?'mine':'')+'"><div class="drift-reply-name">'+esc(r.fromName||'我')+'</div><div class="drift-reply-text">'+esc(r.body).replace(/\n/g,'<br>')+'</div><div class="drift-reply-time">'+ft(r.time)+'</div></div>';});
        rh+='</div>';
    }
    var sty='background:'+t.bg+';border:'+t.border+';color:'+t.color+';font-family:'+t.font+';';
    if(t.texture!=='none')sty+='background-image:'+t.texture+';';
    list.innerHTML='<div class="drift-picked-bottle" style="'+sty+'">'+(s?'<div class="drift-picked-stamp"><span class="stamp-emoji">'+s.emoji+'</span></div>':'')+'<div class="drift-picked-from">来自：'+esc(bot.fromName||'未知')+'</div><div class="drift-picked-body">'+esc(bot.body).replace(/\n/g,'<br>')+'</div><div class="drift-picked-time">'+ft(bot.time)+'</div><div class="drift-picked-actions"><button class="drift-reply-btn" onclick="replyDriftBottle(\''+bot.id+'\')"><i class="fas fa-reply"></i> 回复</button><button class="drift-discard-btn" onclick="discardDriftBottle(\''+bot.id+'\')"><i class="fas fa-times"></i> 扔回大海</button><button class="drift-refresh-btn" onclick="pickDriftBottle()"><i class="fas fa-sync-alt"></i> 换一个</button></div>'+rh+'</div>';
}

window.replyDriftBottle=function(bid){
    ed();var bot=store.driftBottles.find(function(b){return b.id===bid;});
    if(!bot)return showToast('瓶子找不到了');
    showPromptModal('写下你的回复：','',{multiline:true}).then(function(rt){if(!rt||!rt.trim())return;
    bot.replies.push({from:'__user__',fromName:'我',body:rt.trim(),time:Date.now()});
    save();spb(bot);showToast('回复已发送');
    setTimeout(function(){
        var sys='你是"'+(bot.fromName||'陌生人')+'"。有人回复了你的漂流瓶："'+bot.body.substring(0,200)+'"。请以你的身份回信，真诚自然，纯文字。';
        var ms=[{role:'system',content:sys}];
        bot.replies.forEach(function(r){ms.push({role:r.from==='__user__'?'user':'assistant',content:r.body});});
        API.chatCompletion(ms,{temperature:0.85,silent:true,scene:'drift-bottle'}).then(function(d){
            bot.replies.push({from:bot.from,fromName:bot.fromName||'陌生人',body:d.choices[0].message.content.trim(),time:Date.now()});
            save();var l=document.getElementById('drift-bottle-list');if(l)spb(bot);
            showToast('"'+(bot.fromName||'陌生人')+'"回复了你的漂流瓶');
        }).catch(function(){});
    },2000+Math.random()*5000);
    });
};

window.discardDriftBottle=function(bid){
    ed();var i=store.driftBottles.findIndex(function(b){return b.id===bid;});
    if(i>-1){store.driftBottles.splice(i,1);save();}
    showToast('瓶子已扔回大海');rdh();
};

window.viewMyDriftBottles=function(){
    ed();var list=document.getElementById('drift-bottle-list');if(!list)return;
    var my=store.driftBottles.filter(function(b){return b.from==='__user__';});
    if(!my.length){list.innerHTML='<div class="drift-empty"><i class="fas fa-bottle-water"></i><span>你还没有投过漂流瓶</span></div>';return;}
    var h='<div class="drift-list-title">我投出的瓶子</div>';
    my.forEach(function(b){
        h+='<div class="drift-list-item" onclick="showBottleDetail(\''+b.id+'\')"><div class="drift-list-preview">'+esc(b.body).substring(0,50)+'...</div><div class="drift-list-meta">'+ft(b.time)+' · '+(b.replies||[]).length+'条回复</div></div>';
    });
    list.innerHTML=h;
};

window.viewPickedBottles=function(){
    ed();var list=document.getElementById('drift-bottle-list');if(!list)return;
    var pk=store.driftBottles.filter(function(b){return b.from!=='__user__'&&b.pickedByMe;});
    if(!pk.length){list.innerHTML='<div class="drift-empty"><i class="fas fa-hand-holding-heart"></i><span>你还没有捡到过漂流瓶</span></div>';return;}
    var h='<div class="drift-list-title">捡到的瓶子</div>';
    pk.forEach(function(b){
        h+='<div class="drift-list-item" onclick="showBottleDetail(\''+b.id+'\')"><div class="drift-list-from">'+esc(b.fromName||'陌生人')+'</div><div class="drift-list-preview">'+esc(b.body).substring(0,50)+'...</div><div class="drift-list-meta">'+ft(b.time)+' · '+(b.replies||[]).length+'条回复</div></div>';
    });
    list.innerHTML=h;
};

window.showBottleDetail=function(bid){
    ed();var bot=store.driftBottles.find(function(b){return b.id===bid;});
    if(bot)spb(bot);
};

})();
// ==========================================
// 🏆 GAME ACHIEVEMENT & MEMORIAL HALL SYSTEM
// ==========================================

// --- Achievement Data Store ---
function ensureAchievementStore() {
    if (!store.achievements) store.achievements = {
        unlocked: {},
        custom: [],
        stats: {},
        titles: [],
        activeTitle: ''
    };
    if (!store.achievements.unlocked) store.achievements.unlocked = {};
    if (!store.achievements.custom) store.achievements.custom = [];
    if (!store.achievements.stats) store.achievements.stats = {};
    if (!store.achievements.titles) store.achievements.titles = [];
}

// --- Game-Only Preset Achievement Definitions ---
const ACHIEVEMENTS = [
    // 🎮 General Game Play
    { id: 'game_total', icon: '🎮', name: '游戏达人', desc: '累计游戏局数', category: 'general', stat: 'gamesPlayed', levels: [
        { threshold: 5, label: '🌱', title: '游戏萌新', reward: '称号：游戏萌新', rewardType: 'title' },
        { threshold: 20, label: '🌸', title: '游戏爱好者', reward: '称号：游戏爱好者', rewardType: 'title' },
        { threshold: 50, label: '🌟', title: '游戏小能手', reward: '称号：游戏小能手', rewardType: 'title' },
        { threshold: 100, label: '👑', title: '游戏王者', reward: '限定称号：游戏王者 👑', rewardType: 'limited_title' },
        { threshold: 200, label: '💎', title: '传说玩家', reward: '限定称号：传说玩家 💎', rewardType: 'limited_title' }
    ]},

    // 🎭 匿问我答 - Questions Asked
    { id: 'anon_ask', icon: '🎭', name: '好奇宝宝', desc: '匿名提问次数', category: 'anonQA', stat: 'anonQuestionsAsked', levels: [
        { threshold: 3, label: '❓', title: '小小提问者', reward: '称号：小小提问者', rewardType: 'title' },
        { threshold: 10, label: '🔍', title: '好奇心旺盛', reward: '称号：好奇心旺盛', rewardType: 'title' },
        { threshold: 30, label: '🧐', title: '灵魂拷问师', reward: '称号：灵魂拷问师', rewardType: 'title' },
        { threshold: 80, label: '🌈', title: '提问大魔王', reward: '限定称号：提问大魔王 🌈', rewardType: 'limited_title' }
    ]},

    // 🎭 匿问我答 - Answers Received
    { id: 'anon_answer', icon: '💬', name: '知心好友', desc: '收到回答次数', category: 'anonQA', stat: 'anonAnswersReceived', levels: [
        { threshold: 3, label: '💗', title: '初识知己', reward: '称号：初识知己', rewardType: 'title' },
        { threshold: 10, label: '💖', title: '心灵捕手', reward: '称号：心灵捕手', rewardType: 'title' },
        { threshold: 30, label: '💝', title: '知心姐姐', reward: '称号：知心姐姐', rewardType: 'title' },
        { threshold: 80, label: '✨', title: '灵魂知己', reward: '限定称号：灵魂知己 ✨', rewardType: 'limited_title' }
    ]},

    // 🎭 匿问我答 - Different contacts asked
    { id: 'anon_contacts', icon: '👥', name: '社交蝴蝶', desc: '向不同好友提问', category: 'anonQA', stat: 'anonDiffContacts', levels: [
        { threshold: 2, label: '🦋', title: '交友新手', reward: '称号：交友新手', rewardType: 'title' },
        { threshold: 5, label: '🌻', title: '社交达人', reward: '称号：社交达人', rewardType: 'title' },
        { threshold: 10, label: '🌍', title: '人缘之星', reward: '限定称号：人缘之星 🌍', rewardType: 'limited_title' }
    ]},

    // 🤔 你说我猜 - Rounds Played
    { id: 'guess_rounds', icon: '🤔', name: '猜词达人', desc: '你说我猜局数', category: 'guessWord', stat: 'guessRoundsPlayed', levels: [
        { threshold: 3, label: '🎲', title: '猜词新手', reward: '称号：猜词新手', rewardType: 'title' },
        { threshold: 15, label: '🎯', title: '猜词爱好者', reward: '称号：猜词爱好者', rewardType: 'title' },
        { threshold: 40, label: '🏅', title: '猜词高手', reward: '称号：猜词高手', rewardType: 'title' },
        { threshold: 100, label: '🏆', title: '猜词之神', reward: '限定称号：猜词之神 🏆', rewardType: 'limited_title' }
    ]},

    // 🤔 你说我猜 - User Correct Guesses
    { id: 'guess_user_correct', icon: '💡', name: '心有灵犀', desc: '猜对次数', category: 'guessWord', stat: 'guessUserCorrect', levels: [
        { threshold: 3, label: '⭐', title: '小机灵鬼', reward: '称号：小机灵鬼', rewardType: 'title' },
        { threshold: 10, label: '🌟', title: '默契搭档', reward: '称号：默契搭档', rewardType: 'title' },
        { threshold: 30, label: '💫', title: '读心术师', reward: '称号：读心术师', rewardType: 'title' },
        { threshold: 60, label: '🔮', title: '心灵感应者', reward: '限定称号：心灵感应者 🔮', rewardType: 'limited_title' }
    ]},

    // 🤔 你说我猜 - User Describe & Contact Guesses Correctly
    { id: 'guess_describe_win', icon: '🗣️', name: '表达大师', desc: '描述让对方猜对', category: 'guessWord', stat: 'guessDescribeWin', levels: [
        { threshold: 3, label: '📢', title: '小喇叭', reward: '称号：小喇叭', rewardType: 'title' },
        { threshold: 10, label: '🎤', title: '语言艺术家', reward: '称号：语言艺术家', rewardType: 'title' },
        { threshold: 30, label: '🎙️', title: '表达天才', reward: '限定称号：表达天才 🎙️', rewardType: 'limited_title' }
    ]},

    // 🤔 你说我猜 - Win Streaks
    { id: 'guess_streak', icon: '🔥', name: '连胜之星', desc: '连续猜对次数', category: 'guessWord', stat: 'guessWinStreak', levels: [
        { threshold: 3, label: '🔥', title: '三连胜', reward: '称号：三连胜', rewardType: 'title' },
        { threshold: 5, label: '💥', title: '五连杀', reward: '称号：五连杀', rewardType: 'title' },
        { threshold: 10, label: '🌋', title: '不可阻挡', reward: '限定称号：不可阻挡 🌋', rewardType: 'limited_title' }
    ]},

    // 🏆 Total Score
    { id: 'game_score', icon: '🏆', name: '积分收藏家', desc: '累计游戏得分', category: 'general', stat: 'gameTotalScore', levels: [
        { threshold: 10, label: '🥉', title: '铜牌选手', reward: '称号：铜牌选手', rewardType: 'title' },
        { threshold: 30, label: '🥈', title: '银牌选手', reward: '称号：银牌选手', rewardType: 'title' },
        { threshold: 80, label: '🥇', title: '金牌选手', reward: '称号：金牌选手', rewardType: 'title' },
        { threshold: 150, label: '💎', title: '钻石选手', reward: '限定称号：钻石选手 💎', rewardType: 'limited_title' }
    ]},

    // 🎪 First Time Achievements (one-shot)
    { id: 'first_anon', icon: '🎪', name: '初次匿问', desc: '第一次匿名提问', category: 'anonQA', stat: 'anonQuestionsAsked', levels: [
        { threshold: 1, label: '🎀', title: '匿问初体验', reward: '称号：匿问初体验', rewardType: 'title' }
    ]},
    { id: 'first_guess', icon: '🎡', name: '初次猜词', desc: '第一次玩你说我猜', category: 'guessWord', stat: 'guessRoundsPlayed', levels: [
        { threshold: 1, label: '🎠', title: '猜词初体验', reward: '称号：猜词初体验', rewardType: 'title' }
    ]},

    // 💣 Number Bomb
    { id: 'bomb_played', icon: '💣', name: '拆弹专家', desc: '数字炸弹游戏局数', category: 'general', stat: 'bombGamesPlayed', levels: [
        { threshold: 3, label: '🌱', title: '新手拆弹员', reward: '称号：新手拆弹员', rewardType: 'title' },
        { threshold: 10, label: '🌸', title: '拆弹达人', reward: '称号：拆弹达人', rewardType: 'title' },
        { threshold: 30, label: '🌟', title: '拆弹大师', reward: '称号：拆弹大师', rewardType: 'title' },
        { threshold: 50, label: '👑', title: '炸弹之王', reward: '限定称号：炸弹之王 👑', rewardType: 'limited_title' }
    ]},
    { id: 'bomb_survived', icon: '🛡️', name: '幸运之星', desc: '数字炸弹连续安全局数', category: 'general', stat: 'bombSurviveStreak', levels: [
        { threshold: 3, label: '🍀', title: '小幸运', reward: '称号：小幸运', rewardType: 'title' },
        { threshold: 7, label: '⭐', title: '福星高照', reward: '称号：福星高照', rewardType: 'title' },
        { threshold: 15, label: '🌟', title: '天选之人', reward: '限定称号：天选之人 🌟', rewardType: 'limited_title' }
    ]},
    { id: 'first_bomb', icon: '💥', name: '初次踩雷', desc: '第一次玩数字炸弹', category: 'general', stat: 'bombGamesPlayed', levels: [
        { threshold: 1, label: '💣', title: '炸弹初体验', reward: '称号：炸弹初体验', rewardType: 'title' }
    ]}
];

// --- Stat Tracking ---
function trackAchievementStat(statName, increment = 1) {
    ensureAchievementStore();
    if (!store.achievements.stats[statName]) store.achievements.stats[statName] = 0;
    store.achievements.stats[statName] += increment;
    checkAchievements(statName);
    save();
}

function setAchievementStat(statName, value) {
    ensureAchievementStore();
    store.achievements.stats[statName] = value;
    checkAchievements(statName);
    save();
}

// --- Check & Unlock ---
function checkAchievements(statName) {
    ensureAchievementStore();
    const allAchs = [...ACHIEVEMENTS, ...store.achievements.custom];

    allAchs.forEach(ach => {
        if (ach.stat !== statName) return;
        const currentVal = store.achievements.stats[statName] || 0;
        const currentUnlock = store.achievements.unlocked[ach.id];
        const currentLevel = currentUnlock ? currentUnlock.level : -1;

        for (let i = 0; i < ach.levels.length; i++) {
            if (i <= currentLevel) continue;
            if (currentVal >= ach.levels[i].threshold) {
                store.achievements.unlocked[ach.id] = {
                    level: i,
                    unlockedAt: Date.now(),
                    seen: false
                };
                const title = ach.levels[i].title;
                if (title && !store.achievements.titles.includes(title)) {
                    store.achievements.titles.push(title);
                }
                setTimeout(() => showAchievementCelebration(ach, i), 300);
            }
        }
    });
}

// --- Cute Celebration Popup ---
function showAchievementCelebration(ach, levelIdx) {
    const level = ach.levels[levelIdx];
    const levelNames = ['初级', '中级', '高级', '大师', '传说'];
    const levelColors = ['#ffd1dc', '#ffb7c5', '#ff9ecd', '#ff6fb7', '#e84393'];
    const isLimited = level.rewardType === 'limited_title';

    const overlay = document.createElement('div');
    overlay.className = 'ach-celebration-overlay';
    overlay.onclick = () => overlay.remove();

    overlay.innerHTML = `
        <div class="ach-celebration-card cute" onclick="event.stopPropagation()">
            <div class="ach-celebration-sparkles">
                <span class="ach-sparkle">✨</span>
                <span class="ach-sparkle">🌟</span>
                <span class="ach-sparkle">⭐</span>
                <span class="ach-sparkle">💫</span>
                <span class="ach-sparkle">🎉</span>
                <span class="ach-sparkle">🎀</span>
                <span class="ach-sparkle">💖</span>
                <span class="ach-sparkle">🌸</span>
            </div>
            <div class="ach-celebration-confetti"></div>
            <div class="ach-celebration-badge cute" style="background:${levelColors[levelIdx] || '#ffb7c5'}">
                <span class="ach-celebration-icon">${ach.icon}</span>
                <span class="ach-celebration-level-icon">${level.label}</span>
            </div>
            <div class="ach-celebration-title">🎉 成就解锁啦！</div>
            <div class="ach-celebration-name">${ach.name}</div>
            <div class="ach-celebration-level">${levelNames[levelIdx] || ''}·${level.title || ''}</div>
            <div class="ach-celebration-desc">${ach.desc} × ${level.threshold}</div>
            ${level.reward ? `<div class="ach-celebration-reward ${isLimited ? 'limited' : ''}">
                ${isLimited ? '🌈' : '🎁'} ${level.reward}
            </div>` : ''}
            <button class="ach-celebration-btn cute" onclick="this.closest('.ach-celebration-overlay').remove()">
                太棒啦！ 🥳✨
            </button>
        </div>
    `;

    document.getElementById('device').appendChild(overlay);
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 10000);
}

// --- Achievement Panel ---
function openAchievementPanel() {
    ensureAchievementStore();
    const allAchs = [...ACHIEVEMENTS, ...store.achievements.custom];

    let unlockedCount = 0;
    let totalLevels = 0;
    allAchs.forEach(a => {
        totalLevels += a.levels.length;
        const u = store.achievements.unlocked[a.id];
        if (u) unlockedCount += (u.level + 1);
    });

    const categories = [...new Set(allAchs.map(a => a.category))];
    const catLabels = {
        general: '🎮 综合',
        anonQA: '🎭 匿问我答',
        guessWord: '🤔 你说我猜',
        custom: '⭐ 自定义'
    };

    let html = `
        <div class="ach-panel-overlay" onclick="this.remove()">
            <div class="ach-panel cute" onclick="event.stopPropagation()">
                <div class="ach-panel-header cute">
                    <div class="ach-panel-title">🏆 成就墙</div>
                    <div class="ach-panel-close" onclick="this.closest('.ach-panel-overlay').remove()"><i class="fas fa-times"></i></div>
                </div>
                <div class="ach-panel-progress">
                    <div class="ach-progress-bar-bg cute">
                        <div class="ach-progress-bar-fill cute" style="width:${totalLevels > 0 ? (unlockedCount/totalLevels*100) : 0}%"></div>
                    </div>
                    <div class="ach-progress-text">${unlockedCount} / ${totalLevels} 已解锁 ✨</div>
                </div>
                <div class="ach-panel-tabs">
                    <div class="ach-tab active" onclick="filterAchTab('all', this)">全部</div>
                    ${categories.map(c => `<div class="ach-tab" onclick="filterAchTab('${c}', this)">${catLabels[c] || c}</div>`).join('')}
                </div>
                <div class="ach-panel-list" id="ach-panel-list">
                    ${renderAchievementList(allAchs, 'all')}
                </div>
                <div class="ach-panel-footer">
                    <button class="ach-custom-btn cute" onclick="openCreateCustomAchievement()">✨ 自定义成就</button>
                    <button class="ach-memorial-btn cute" onclick="this.closest('.ach-panel-overlay').remove(); openMemorialHall()">🏛 纪念馆</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('device').insertAdjacentHTML('beforeend', html);
}

function renderAchievementList(allAchs, filter) {
    ensureAchievementStore();
    let html = '';
    const filtered = filter === 'all' ? allAchs : allAchs.filter(a => a.category === filter);

    filtered.forEach(ach => {
        const unlock = store.achievements.unlocked[ach.id];
        const currentLevel = unlock ? unlock.level : -1;
        const currentVal = store.achievements.stats[ach.stat] || 0;
        const nextLevel = ach.levels[currentLevel + 1];
        const isMaxed = currentLevel >= ach.levels.length - 1;

        const progressPct = nextLevel ? Math.min(100, (currentVal / nextLevel.threshold) * 100) : 100;
        const progressText = nextLevel ? `${currentVal} / ${nextLevel.threshold}` : '已满级 ✅';

        html += `
            <div class="ach-item cute ${isMaxed ? 'maxed' : ''} ${currentLevel >= 0 ? 'unlocked' : 'locked'}">
                <div class="ach-item-icon">${ach.icon}</div>
                <div class="ach-item-info">
                    <div class="ach-item-name">${ach.name}</div>
                    <div class="ach-item-desc">${ach.desc}</div>
                    <div class="ach-item-levels">
                        ${ach.levels.map((l, i) => `<span class="ach-level-dot ${i <= currentLevel ? 'filled' : ''}" title="${l.title}">${l.label}</span>`).join('')}
                    </div>
                    <div class="ach-item-progress-bar cute">
                        <div class="ach-item-progress-fill cute" style="width:${progressPct}%"></div>
                    </div>
                    <div class="ach-item-progress-text">${progressText}</div>
                </div>
                ${ach._isCustom ? `<div class="ach-item-delete" onclick="deleteCustomAchievement('${ach.id}')"><i class="fas fa-trash-alt"></i></div>` : ''}
            </div>
        `;
    });

    if (filtered.length === 0) {
        html = '<div class="ach-empty-hint">🌸 暂无成就，快去玩游戏解锁吧～</div>';
    }
    return html;
}

function filterAchTab(category, el) {
    ensureAchievementStore();
    document.querySelectorAll('.ach-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    const allAchs = [...ACHIEVEMENTS, ...store.achievements.custom];
    document.getElementById('ach-panel-list').innerHTML = renderAchievementList(allAchs, category);
}

// --- Custom Achievement ---
function openCreateCustomAchievement() {
    const modalHtml = `
        <div class="modal-mask" id="modal-custom-ach" style="display:flex; z-index:10001;">
            <div class="modal-box cute-modal" style="max-width:340px;">
                <h3 style="text-align:center; color:#e17055;">✨ 创建游戏成就</h3>
                <div style="margin-top:15px; display:flex; flex-direction:column; gap:10px;">
                    <input id="cach-name" placeholder="成就名称" class="cute-input">
                    <input id="cach-desc" placeholder="成就描述" class="cute-input">
                    <input id="cach-icon" placeholder="图标 (emoji)" value="⭐" class="cute-input">
                    <div style="font-size:13px; color:#e17055; margin-top:5px;">🎯 等级设置（至少1级）</div>
                    <div id="cach-levels-list">
                        <div class="cach-level-row" style="display:flex; gap:8px; align-items:center;">
                            <input placeholder="目标数" type="number" value="10" class="cach-threshold cute-input" style="width:70px;">
                            <input placeholder="称号奖励" class="cach-title cute-input" style="flex:1;">
                        </div>
                    </div>
                    <button onclick="addCustomAchLevel()" class="cute-add-level-btn">+ 添加等级</button>
                </div>
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button onclick="document.getElementById('modal-custom-ach').remove()" class="cute-cancel-btn">取消</button>
                    <button onclick="saveCustomAchievement()" class="cute-confirm-btn">创建 🎉</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
}

function addCustomAchLevel() {
    const list = document.getElementById('cach-levels-list');
    const row = document.createElement('div');
    row.className = 'cach-level-row';
    row.style.cssText = 'display:flex; gap:8px; align-items:center;';
    row.innerHTML = `
        <input placeholder="目标数" type="number" class="cach-threshold cute-input" style="width:70px;">
        <input placeholder="称号奖励" class="cach-title cute-input" style="flex:1;">
        <span onclick="this.parentElement.remove()" style="color:#fa5151; cursor:pointer; padding:4px; font-size:16px;">✕</span>
    `;
    list.appendChild(row);
}

function saveCustomAchievement() {
    ensureAchievementStore();
    const name = document.getElementById('cach-name').value.trim();
    const desc = document.getElementById('cach-desc').value.trim();
    const icon = document.getElementById('cach-icon').value.trim() || '⭐';

    if (!name) return toast('请输入成就名称');

    const rows = document.querySelectorAll('#cach-levels-list .cach-level-row');
    const levels = [];
    const levelEmojis = ['🌱', '🌸', '🌟', '💫', '👑'];

    rows.forEach((row, i) => {
        const threshold = parseInt(row.querySelector('.cach-threshold').value) || 0;
        const title = row.querySelector('.cach-title').value.trim();
        if (threshold > 0) {
            levels.push({
                threshold,
                label: levelEmojis[i] || '⭐',
                title: title || `${name} Lv.${i+1}`,
                reward: title ? `称号：${title}` : '',
                rewardType: 'title'
            });
        }
    });

    if (levels.length === 0) return toast('请至少设置一个等级');
    levels.sort((a, b) => a.threshold - b.threshold);

    const achId = 'custom_' + Date.now();
    store.achievements.custom.push({
        id: achId, icon, name, desc,
        category: 'custom',
        stat: 'custom_' + achId,
        levels,
        _isCustom: true
    });

    save();
    document.getElementById('modal-custom-ach').remove();
    const panel = document.querySelector('.ach-panel-overlay');
    if (panel) { panel.remove(); openAchievementPanel(); }
    toast('自定义成就已创建！ 🎉');
}

function deleteCustomAchievement(achId) {
    ensureAchievementStore();
    store.achievements.custom = store.achievements.custom.filter(a => a.id !== achId);
    delete store.achievements.unlocked[achId];
    save();
    const panel = document.querySelector('.ach-panel-overlay');
    if (panel) { panel.remove(); openAchievementPanel(); }
    toast('已删除');
}

function incrementCustomAchievement(achId) {
    ensureAchievementStore();
    const ach = store.achievements.custom.find(a => a.id === achId);
    if (!ach) return;
    trackAchievementStat(ach.stat, 1);
}

// --- Memorial Hall (纪念馆) ---
function openMemorialHall() {
    ensureAchievementStore();
    const titles = store.achievements.titles || [];
    const activeTitle = store.achievements.activeTitle || '';

    const allAchs = [...ACHIEVEMENTS, ...store.achievements.custom];
    const rewards = [];
    const limitedRewards = [];

    allAchs.forEach(ach => {
        const unlock = store.achievements.unlocked[ach.id];
        if (!unlock) return;
        for (let i = 0; i <= unlock.level; i++) {
            const lvl = ach.levels[i];
            const item = {
                achName: ach.name,
                achIcon: ach.icon,
                level: i,
                label: lvl.label,
                title: lvl.title,
                reward: lvl.reward,
                rewardType: lvl.rewardType || 'title',
                unlockedAt: unlock.unlockedAt
            };
            rewards.push(item);
            if (lvl.rewardType === 'limited_title') limitedRewards.push(item);
        }
    });

    // Stats summary
    const stats = store.achievements.stats || {};
    const totalGames = (stats.gamesPlayed || 0);
    const totalScore = (stats.gameTotalScore || 0);
    const totalAnonQ = (stats.anonQuestionsAsked || 0);
    const totalGuessR = (stats.guessRoundsPlayed || 0);

    let html = `
        <div class="memorial-overlay cute" onclick="this.remove()">
            <div class="memorial-panel cute" onclick="event.stopPropagation()">
                <div class="memorial-header cute">
                    <div class="memorial-title">🏛 纪念馆</div>
                    <div class="memorial-close" onclick="this.closest('.memorial-overlay').remove()"><i class="fas fa-times"></i></div>
                </div>

                <div class="memorial-scroll">
                    <!-- Stats Banner -->
                    <div class="memorial-stats-banner">
                        <div class="memorial-stat-item">
                            <div class="memorial-stat-num">${totalGames}</div>
                            <div class="memorial-stat-label">总局数</div>
                        </div>
                        <div class="memorial-stat-item">
                            <div class="memorial-stat-num">${totalScore}</div>
                            <div class="memorial-stat-label">总积分</div>
                        </div>
                        <div class="memorial-stat-item">
                            <div class="memorial-stat-num">${totalAnonQ}</div>
                            <div class="memorial-stat-label">匿问</div>
                        </div>
                        <div class="memorial-stat-item">
                            <div class="memorial-stat-num">${totalGuessR}</div>
                            <div class="memorial-stat-label">猜词</div>
                        </div>
                    </div>

                    <!-- Active Title -->
                    <div class="memorial-section cute">
                        <div class="memorial-section-title">🎖 当前称号</div>
                        <div class="memorial-active-title">
                            ${activeTitle ? `<span class="memorial-title-badge active">${activeTitle}</span>` : '<span style="color:rgba(255,255,255,0.4); font-size:13px;">还没有佩戴称号哦～</span>'}
                        </div>
                    </div>

                    <!-- All Titles -->
                    <div class="memorial-section cute">
                        <div class="memorial-section-title">🏅 称号收藏 (${titles.length})</div>
                        <div class="memorial-titles-grid">
                            ${titles.length === 0 ? '<div style="color:rgba(255,255,255,0.4); font-size:13px; padding:10px;">快去玩游戏解锁称号吧～ 🌸</div>' :
                            titles.map(t => `
                                <div class="memorial-title-chip ${t === activeTitle ? 'active' : ''}" onclick="setActiveTitle('${t.replace(/'/g, "\\'")}')">
                                    ${t}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Limited Edition Rewards -->
                    ${limitedRewards.length > 0 ? `
                    <div class="memorial-section cute">
                        <div class="memorial-section-title">🌈 限定奖励</div>
                        <div class="memorial-rewards-grid">
                            ${limitedRewards.map(r => `
                                <div class="memorial-reward-card limited">
                                    <div class="memorial-reward-icon">${r.achIcon}</div>
                                    <div class="memorial-reward-label">${r.label}</div>
                                    <div class="memorial-reward-name">${r.title}</div>
                                    <div class="memorial-reward-from">来自：${r.achName}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- All Rewards Timeline -->
                    <div class="memorial-section cute">
                        <div class="memorial-section-title">📜 解锁记录 (${rewards.length})</div>
                        <div class="memorial-timeline">
                            ${rewards.length === 0 ? '<div style="color:rgba(255,255,255,0.4); font-size:13px; padding:10px;">暂无解锁记录</div>' :
                            rewards.sort((a,b) => b.unlockedAt - a.unlockedAt).map(r => `
                                <div class="memorial-timeline-item">
                                    <div class="memorial-timeline-dot ${r.rewardType === 'limited_title' ? 'limited' : ''}"></div>
                                    <div class="memorial-timeline-content">
                                        <div class="memorial-timeline-title">${r.achIcon} ${r.title}</div>
                                        <div class="memorial-timeline-sub">来自「${r.achName}」· ${new Date(r.unlockedAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('device').insertAdjacentHTML('beforeend', html);
}

function setActiveTitle(title) {
    ensureAchievementStore();
    if (store.achievements.activeTitle === title) {
        store.achievements.activeTitle = '';
        toast('已取消佩戴称号');
    } else {
        store.achievements.activeTitle = title;
        toast('已佩戴称号：' + title);
    }
    save();
    const overlay = document.querySelector('.memorial-overlay');
    if (overlay) { overlay.remove(); openMemorialHall(); }
}

// --- Floating Buttons (Right Corner) ---
function renderAchievementFloatButtons() {
    let group = document.getElementById('ach-float-group');
    if (group) group.remove();

    ensureAchievementStore();
    const hasNew = Object.values(store.achievements.unlocked).some(u => !u.seen);

    group = document.createElement('div');
    group.id = 'ach-float-group';
    group.className = 'ach-float-group';
    group.innerHTML = `
        <div class="ach-float-btn memorial-float" onclick="openMemorialHall()" title="纪念馆">
            🏛
        </div>
        <div class="ach-float-btn achievement-float" onclick="openAchievementPanel()" title="成就">
            🏆
            ${hasNew ? '<span class="ach-float-dot"></span>' : ''}
        </div>
    `;

    const device = document.getElementById('device');
    if (device) device.appendChild(group);
}

// --- Integration: Hook into Game Events ---
// Call these from the game code (app-part2.js) when events happen

function onAnonQuestionAsked(contactId) {
    trackAchievementStat('anonQuestionsAsked', 1);
    trackAchievementStat('gamesPlayed', 1);

    // Track unique contacts
    ensureAchievementStore();
    if (!store.achievements.stats._anonContactSet) store.achievements.stats._anonContactSet = [];
    if (!store.achievements.stats._anonContactSet.includes(contactId)) {
        store.achievements.stats._anonContactSet.push(contactId);
        setAchievementStat('anonDiffContacts', store.achievements.stats._anonContactSet.length);
    }
    save();
}

function onAnonAnswerReceived() {
    trackAchievementStat('anonAnswersReceived', 1);
}

function onGuessRoundStarted() {
    trackAchievementStat('guessRoundsPlayed', 1);
    trackAchievementStat('gamesPlayed', 1);
}

function onGuessUserCorrect() {
    trackAchievementStat('guessUserCorrect', 1);
    trackAchievementStat('gameTotalScore', 1);

    // Win streak
    ensureAchievementStore();
    if (!store.achievements.stats._currentStreak) store.achievements.stats._currentStreak = 0;
    store.achievements.stats._currentStreak += 1;
    const streak = store.achievements.stats._currentStreak;
    if (streak > (store.achievements.stats.guessWinStreak || 0)) {
        setAchievementStat('guessWinStreak', streak);
    }
    save();
}

function onGuessUserWrong() {
    ensureAchievementStore();
    store.achievements.stats._currentStreak = 0;
    save();
}

function onGuessDescribeWin() {
    trackAchievementStat('guessDescribeWin', 1);
    trackAchievementStat('gameTotalScore', 1);
}

// --- Init ---
function initAchievements() {
    ensureAchievementStore();
    renderAchievementFloatButtons();
}
// ==================== 地图大富翁 ====================
(function(){
    'use strict';
    var mapGameState = {
        active:false,contactId:null,contactName:'',contactAvatar:'',contactPersona:'',
        worldTheme:null,tiles:[],playerPos:0,playerGold:100,playerHP:100,playerMaxHP:100,
        playerItems:[],diceValue:0,isRolling:false,isMoving:false,turnCount:0,
        eventLog:[],npcMet:[],adventuresDone:[],mapGenerated:false
    };
    // --- Persistence helpers ---
    function saveGameState(){
        if(!mapGameState.active||!mapGameState.mapGenerated)return;
        // Save a serializable snapshot (strip theme functions, keep theme key)
        var snap=JSON.parse(JSON.stringify(mapGameState));
        snap.themeKey=getThemeKey(mapGameState.worldTheme);
        delete snap.worldTheme; // theme objects have no functions but keep it clean
        snap.isRolling=false;snap.isMoving=false;
        if(!store.mapGameSave)store.mapGameSave={};
        store.mapGameSave.current=snap;
        store.mapGameSave.savedAt=Date.now();
        save();
    }
    function getThemeKey(th){
        if(!th)return'cute';
        for(var k in THEMES){if(THEMES[k]===th)return k;}
        return'cute';
    }
    function loadGameState(){
        if(!store.mapGameSave||!store.mapGameSave.current)return false;
        var snap=store.mapGameSave.current;
        if(!snap.active||!snap.mapGenerated)return false;
        // Restore theme object from key
        var thKey=snap.themeKey||'cute';
        var th=THEMES[thKey]||THEMES.cute;
        for(var k in snap){if(k!=='themeKey')mapGameState[k]=snap[k];}
        mapGameState.worldTheme=th;
        mapGameState.isRolling=false;mapGameState.isMoving=false;
        return true;
    }
    function clearSavedGame(){
        if(store.mapGameSave)delete store.mapGameSave.current;
        save();
    }
    function saveGameHistory(s){
        if(!store.mapGameSave)store.mapGameSave={};
        if(!store.mapGameSave.history)store.mapGameSave.history=[];
        var score=s.playerGold+s.playerHP*2+s.npcMet.length*10+s.adventuresDone.length*25;
        var rank=score>=300?'S':score>=200?'A':score>=150?'B':score>=100?'C':'D';
        store.mapGameSave.history.push({
            contactId:s.contactId,contactName:s.contactName,contactAvatar:s.contactAvatar,
            themeKey:getThemeKey(s.worldTheme),themeName:s.worldTheme?s.worldTheme.name:'',
            themeEmoji:s.worldTheme?s.worldTheme.emoji:'',
            gold:s.playerGold,hp:s.playerHP,maxHP:s.playerMaxHP,
            npcCount:s.npcMet.length,adventureCount:s.adventuresDone.length,
            turnCount:s.turnCount,score:score,rank:rank,
            date:Date.now()
        });
        // Keep last 50 records
        if(store.mapGameSave.history.length>50)store.mapGameSave.history=store.mapGameSave.history.slice(-50);
        save();
    }
    var THEMES = {
        ancient:{name:'古风仙境',emoji:'🏯',bg:'linear-gradient(135deg,#2d1b69,#11998e)',mapBg:'#1a0a2e',
            tc:['#8B4513','#DAA520','#CD853F','#DEB887'],
            tt:['驿站','茶楼','武馆','药铺','书院','集市','密林','古庙','仙池'],
            npcs:['云游道士','江湖侠客','卖花姑娘','算命先生','隐世高人','神秘商人'],
            evts:['发现藏宝图','遇到山贼','偶遇仙鹤','发现温泉','古树许愿','月下对弈'],
            advs:['误入桃花源','龙宫探秘','天宫一日游','穿越时空裂缝']},
        modern:{name:'都市迷踪',emoji:'🏙️',bg:'linear-gradient(135deg,#0f0c29,#302b63)',mapBg:'#0a0a1a',
            tc:['#4A90D9','#5B6ABF','#7B68EE','#6495ED'],
            tt:['咖啡厅','商场','公园','电影院','图书馆','游乐场','美食街','天台','地铁站'],
            npcs:['街头艺人','外卖小哥','神秘占卜师','流浪猫','网红博主','便利店店员'],
            evts:['捡到钱包','偶遇明星','免费试吃','中了彩票','下起大雨','发现密室'],
            advs:['平行世界入口','时间倒流一天','变成透明人','梦境迷宫']},
        fantasy:{name:'奇幻大陆',emoji:'🐉',bg:'linear-gradient(135deg,#1a002e,#7b2ff7)',mapBg:'#0d001a',
            tc:['#9B59B6','#8E44AD','#6C3483','#A569BD'],
            tt:['精灵森林','矮人矿洞','魔法塔','龙巢','妖精集市','水晶湖','暗影谷','浮空岛'],
            npcs:['精灵弓手','矮人铁匠','魔法学徒','半龙战士','妖精商人','贤者'],
            evts:['获得魔法卷轴','遭遇史莱姆','发现魔法水晶','被施了变身术','学会新咒语'],
            advs:['进入龙之梦境','时空裂隙探险','神器试炼','异界来客']},
        scifi:{name:'星际航线',emoji:'🚀',bg:'linear-gradient(135deg,#000428,#004e92)',mapBg:'#000214',
            tc:['#00CED1','#20B2AA','#008B8B','#48D1CC'],
            tt:['空间站','星际港','实验室','能量塔','虫洞','废弃飞船','外星集市','全息酒吧'],
            npcs:['AI助手','星际商人','赏金猎人','外星学者','机械师','时间旅者'],
            evts:['发现新元素','遭遇太空海盗','收到神秘信号','引力异常','量子纠缠'],
            advs:['黑洞边缘探索','第四维度漫步','意识上传体验','平行宇宙穿越']},
        cute:{name:'梦幻糖果国',emoji:'🍭',bg:'linear-gradient(135deg,#ffecd2,#ff9a9e)',mapBg:'#fff0f5',
            tc:['#FF69B4','#FFB6C1','#FFA07A','#FFD700'],
            tt:['棉花糖云','巧克力河','饼干屋','果冻山','彩虹桥','星星湖','蘑菇村','糖果城堡'],
            npcs:['棉花糖兔','巧克力熊','草莓猫','蜂蜜蜂','薄荷鹿','彩虹鸟'],
            evts:['下起糖果雨','发现彩虹宝石','被花香包围','遇到会说话的花','找到魔法种子'],
            advs:['进入画中世界','月亮上的茶会','海底糖果宫殿','云端秘密花园']},
        martial:{name:'武林江湖',emoji:'⚔️',bg:'linear-gradient(135deg,#1c1c1c,#8B0000)',mapBg:'#0a0a0a',
            tc:['#8B0000','#B22222','#CD5C5C','#DC143C'],
            tt:['客栈','擂台','暗巷','悬崖','瀑布','竹林','铁匠铺','酒楼','藏经阁'],
            npcs:['蒙面剑客','醉拳老翁','毒娘子','少林武僧','丐帮弟子','镖师'],
            evts:['获得秘籍残页','被暗器偷袭','发现密室','比武招亲','习得新招式'],
            advs:['闯入魔教总坛','寻找屠龙宝刀','华山论剑','血战光明顶']}
    };
    function inferTheme(p){
        if(!p)return THEMES.cute;p=p.toLowerCase();
        if(/古代|古风|仙|道|唐|宋|明|清|皇|妃/.test(p))return THEMES.ancient;
        if(/武侠|江湖|门派|少林|武当|剑客/.test(p))return THEMES.martial;
        if(/魔法|精灵|龙|骑士|魔王|勇者|奇幻/.test(p))return THEMES.fantasy;
        if(/科幻|未来|机器人|太空|星际|赛博/.test(p))return THEMES.scifi;
        if(/可爱|萌|猫|兔|甜|糖|梦|童话/.test(p))return THEMES.cute;
        if(/现代|都市|学生|上班|咖啡/.test(p))return THEMES.modern;
        var k=Object.keys(THEMES);return THEMES[k[Math.floor(Math.random()*k.length)]];
    }
    function pick(a){return a[Math.floor(Math.random()*a.length)];}
    function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
    function tIcon(t){return{start:'🏠',goal:'🏆',normal:'🔹',npc:'👤',event:'⚡',shop:'🛒',treasure:'💎',trap:'💀',rest:'💤',adventure:'🌟'}[t]||'🔹';}
    function addLog(t){mapGameState.eventLog.push(t);if(mapGameState.eventLog.length>50)mapGameState.eventLog.shift();}
    function genTiles(theme,n){
        n=n||20;var tiles=[],types=['normal','npc','event','shop','treasure','trap','rest','adventure'],w=[30,15,20,10,8,7,5,5];
        for(var i=0;i<n;i++){var tp;
            if(i===0)tp='start';else if(i===n-1)tp='goal';
            else{var tot=100,r=Math.random()*tot;for(var j=0;j<types.length;j++){r-=w[j];if(r<=0){tp=types[j];break;}}}
            tiles.push({id:i,type:tp,name:i===0?'🏠 起点':(i===n-1?'🏆 终点':pick(theme.tt)),
                color:pick(theme.tc),visited:false,icon:tIcon(tp)});
        }return tiles;
    }
    function renderSelect(){
        var cs=store.contacts.filter(function(c){return!c.isGroup;}),el=document.getElementById('map-content');
        var hasSave=store.mapGameSave&&store.mapGameSave.current&&store.mapGameSave.current.active;
        var hasHistory=store.mapGameSave&&store.mapGameSave.history&&store.mapGameSave.history.length>0;
        var h='<div class="mgs-sel"><div class="mgs-back-btn" onclick="closeLayer(\'layer-map\')" style="position:absolute;top:12px;left:12px;z-index:10;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.85);font-size:16px;cursor:pointer"><i class="fas fa-chevron-left"></i></div><div class="mgs-hdr"><div style="font-size:48px">🗺️</div><h2>地图大富翁</h2><p style="color:#aaa;font-size:13px">选择一位好友，开启冒险之旅！</p>';
        // History button
        if(hasHistory){h+='<div style="margin-top:8px"><span onclick="window._mapGame.showHistory()" style="color:#5dade2;font-size:13px;cursor:pointer;border:1px solid #5dade2;padding:4px 14px;border-radius:16px;display:inline-block"><i class="fas fa-trophy" style="margin-right:4px"></i>历史记录</span></div>';}
        h+='</div>';
        // Resume saved game banner
        if(hasSave){
            var sv=store.mapGameSave.current;
            var savedTime=store.mapGameSave.savedAt?new Date(store.mapGameSave.savedAt).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';
            h+='<div class="mgs-resume-banner" onclick="window._mapGame.resumeGame()">'
            +'<div class="mgs-resume-left"><img class="mgs-resume-av" src="'+(sv.contactAvatar||_ph(40))+'">'
            +'<div><div style="font-weight:600;font-size:14px;color:#fff">继续上次冒险</div>'
            +'<div style="font-size:12px;color:rgba(255,255,255,0.6)">'+sv.contactName+' · 第'+sv.turnCount+'回合 · 💰'+sv.playerGold+' ❤️'+sv.playerHP+'</div>'
            +'<div style="font-size:11px;color:rgba(255,255,255,0.4)">'+savedTime+'</div></div></div>'
            +'<div style="color:#5dade2;font-size:13px;font-weight:600">继续 ▶</div></div>';
        }
        h+='<div class="mgs-grid">';
        if(!cs.length){h+='<div style="text-align:center;color:#999;padding:40px">还没有联系人哦~<br>先去微信添加好友吧</div>';}
        else{cs.forEach(function(c){var th=inferTheme(c.persona);
            h+='<div class="mgs-card" onclick="window._mapGame.startGame(\''+c.id+'\')">'
            +'<div class="mgs-card-bg" style="background:'+th.bg+'"></div>'
            +'<div class="mgs-card-ct"><img class="mgs-card-av" src="'+(c.avatar||_ph(60))+'">'
            +'<div class="mgs-card-nm">'+c.name+'</div>'
            +'<div class="mgs-card-th">'+th.emoji+' '+th.name+'</div></div></div>';
        });}
        h+='</div></div>';el.innerHTML=h;
    }
    function startGame(cid){
        var c=store.contacts.find(function(x){return x.id===cid;});if(!c)return;
        // If there's a saved game for a different contact, confirm overwrite
        var hasSave=store.mapGameSave&&store.mapGameSave.current&&store.mapGameSave.current.active;
        if(hasSave&&store.mapGameSave.current.contactId!==cid){
            if(!confirm('当前有未完成的冒险（'+store.mapGameSave.current.contactName+'），开始新游戏将覆盖存档。确定吗？'))return;
        }
        clearSavedGame();
        var th=inferTheme(c.persona);
        mapGameState={active:true,contactId:c.id,contactName:c.name,contactAvatar:c.avatar||_ph(60),
            contactPersona:c.persona||'',worldTheme:th,tiles:genTiles(th,20),playerPos:0,playerGold:100,
            playerHP:100,playerMaxHP:100,playerItems:[],diceValue:0,isRolling:false,isMoving:false,
            turnCount:0,eventLog:[],npcMet:[],adventuresDone:[],mapGenerated:true};
        mapGameState.tiles[0].visited=true;
        addLog('🎮 冒险开始！前往 '+c.name+' 的 '+th.emoji+th.name);
        saveGameState();
        renderBoard();
    }
    function resumeGame(){
        if(loadGameState()){
            addLog('🔄 继续上次的冒险...');
            renderBoard();
        }else{
            toast('没有可恢复的存档');
            renderSelect();
        }
    }
    function uav(){return(store.user&&store.user.avatar)?store.user.avatar:_ph(30);}
    function renderBoard(){
        var s=mapGameState,th=s.worldTheme,el=document.getElementById('map-content');
        var dk=th!==THEMES.cute,tc=dk?'#fff':'#333';
        var h='<div class="mgs-game" style="background:'+th.mapBg+';color:'+tc+'">'
        +'<div class="mgs-stat"><div class="mgs-stat-l"><img class="mgs-mini-av" src="'+uav()+'">'
        +'<div class="mgs-stat-info"><div class="mgs-hp"><div class="mgs-hp-fill" style="width:'+(s.playerHP/s.playerMaxHP*100)+'%"></div>'
        +'<span>❤️'+s.playerHP+'/'+s.playerMaxHP+'</span></div><div class="mgs-gold">💰 '+s.playerGold+'</div></div></div>'
        +'<div class="mgs-stat-r">'
        +'<span class="mgs-topbtn" onclick="window._mapGame.confirmNewGame()" title="新游戏" style="cursor:pointer;font-size:12px;padding:3px 8px;border:1px solid rgba(255,255,255,0.3);border-radius:10px;color:rgba(255,255,255,0.7);margin-right:4px">🔄 新游戏</span>'
        +'<span class="mgs-topbtn" onclick="window._mapGame.showHistory()" title="历史记录" style="cursor:pointer;font-size:12px;padding:3px 8px;border:1px solid rgba(255,255,255,0.3);border-radius:10px;color:rgba(255,255,255,0.7)">🏆</span>'
        +'<br><span class="mgs-turn">第'+s.turnCount+'回合</span>'
        +'<span class="mgs-thm" style="background:'+th.tc[0]+'33;color:'+th.tc[0]+'">'+th.emoji+th.name+'</span></div></div>'
        +'<div class="mgs-target"><img class="mgs-tgt-av" src="'+s.contactAvatar+'"><span>前往 <b>'+s.contactName+'</b> 的世界</span></div>'
        +'<div class="mgs-board-wrap" id="mgs-bw"><div class="mgs-board" id="mgs-board">'+renderTiles(s)+'</div></div>'
        +'<div class="mgs-log">'+(s.eventLog.length?'<div>'+s.eventLog[s.eventLog.length-1]+'</div>':'<div style="color:#aaa">🎲 摇骰子开始冒险吧！</div>')+'</div>'
        +'<div class="mgs-acts"><div class="mgs-abtn" onclick="window._mapGame.showItems()">🎒<br><small>背包</small>'
        +(s.playerItems.length?'<em class="mgs-badge">'+s.playerItems.length+'</em>':'')+'</div>'
        +'<div class="mgs-dice-wrap"><div class="mgs-dice'+(s.isRolling?' rolling':'')+'" id="mgs-dice" onclick="window._mapGame.rollDice()">'
        +(s.diceValue>0?dface(s.diceValue):'🎲')+'</div>'
        +'<div class="mgs-dice-lbl">'+(s.isRolling?'摇骰中...':(s.isMoving?'移动中...':'点击摇骰'))+'</div></div>'
        +'<div class="mgs-abtn" onclick="window._mapGame.showLog()">📜<br><small>日志</small></div></div></div>';
        el.innerHTML=h;
        setTimeout(function(){var t=document.getElementById('mgs-tile-'+s.playerPos);if(t)t.scrollIntoView({behavior:'smooth',block:'center'});},100);
    }
    function renderTiles(s){
        var h='',tiles=s.tiles,cols=5,av=uav();
        for(var i=0;i<tiles.length;i++){var t=tiles[i],isP=i===s.playerPos,isV=t.visited;
            var row=Math.floor(i/cols),rev=row%2===1,col=rev?(cols-1-i%cols):(i%cols);
            h+='<div class="mgs-tile'+(isP?' mgs-tile-act':'')+(isV?' mgs-tile-vis':'')+' mgs-tile-'+t.type+'"'
            +' style="--tc:'+t.color+';grid-column:'+(col+1)+';grid-row:'+(row+1)+'" id="mgs-tile-'+i+'">'
            +'<div class="mgs-tile-ic">'+t.icon+'</div><div class="mgs-tile-nm">'+t.name+'</div>'
            +(isP?'<div class="mgs-token"><img src="'+av+'" class="mgs-token-av"></div>':'')+'</div>';
        }return h;
    }
    function dface(v){return['','⚀','⚁','⚂','⚃','⚄','⚅'][v]||v;}
    function rollDice(){
        var s=mapGameState;if(s.isRolling||s.isMoving||!s.active)return;
        if(s.playerPos>=s.tiles.length-1){showEnd();return;}
        s.isRolling=true;s.turnCount++;renderBoard();var cnt=0;
        var iv=setInterval(function(){s.diceValue=Math.floor(Math.random()*6)+1;
            var el=document.getElementById('mgs-dice');if(el)el.textContent=dface(s.diceValue);cnt++;
            if(cnt>=10){clearInterval(iv);s.isRolling=false;s.diceValue=Math.floor(Math.random()*6)+1;
            addLog('🎲 掷出了 '+s.diceValue+' 点！');movePlayer(s.diceValue);}},80);
    }
    // Auto-save after each tile event settles
    function autoSave(){try{saveGameState();}catch(e){console.warn('Map game auto-save failed:',e);}}
    function movePlayer(steps){
        var s=mapGameState;s.isMoving=true;var moved=0;
        var iv=setInterval(function(){
            if(moved>=steps||s.playerPos>=s.tiles.length-1){clearInterval(iv);s.isMoving=false;
                s.tiles[s.playerPos].visited=true;renderBoard();
                setTimeout(function(){tileEvent(s.tiles[s.playerPos]);},300);return;}
            s.playerPos++;s.tiles[s.playerPos].visited=true;moved++;renderBoard();
        },350);
    }
    function eff(g,hp){var s=mapGameState;s.playerGold=clamp(s.playerGold+g,0,9999);s.playerHP=clamp(s.playerHP+hp,1,s.playerMaxHP);
        var t='';if(g)t+=(g>0?'+':'')+g+'💰 ';if(hp)t+=(hp>0?'+':'')+hp+'❤️';return t;}
    function tileEvent(tile){
        var s=mapGameState;
        if(tile.type==='goal'){showEnd();return;}
        if(tile.type==='normal'){addLog('🔹 路过'+tile.name+'，一切平静');}
        else if(tile.type==='npc'){var npc=pick(s.worldTheme.npcs);s.npcMet.push(npc);
            var os=[{t:'遇到了'+npc+'！送了你礼物',g:20,h:0},{t:npc+'向你发起挑战！你获胜了',g:30,h:-15},
            {t:npc+'教了你一招',g:0,h:10},{t:'和'+npc+'畅聊',g:10,h:5},{t:npc+'请你吃饭',g:-5,h:20}];
            var o=pick(os);var e=eff(o.g,o.h);addLog('👤 '+o.t+' '+e);popup('👤 NPC遭遇',o.t,e);}
        else if(tile.type==='event'){var ev=pick(s.worldTheme.evts);
            var es=[{g:25,h:0},{g:-15,h:0},{g:0,h:15},{g:0,h:-10},{g:15,h:10}];
            var e2=pick(es);var ef=eff(e2.g,e2.h);addLog('⚡ '+ev+' '+ef);popup('⚡ 随机事件',ev,ef);}
        else if(tile.type==='shop'){
            var items=[{n:'回复药水',c:15,e:'🧪',hp:30},{n:'大回复药水',c:30,e:'💊',hp:60},
            {n:'幸运符',c:20,e:'🍀',it:'lucky'},{n:'护身符',c:25,e:'🛡️',it:'shield'}];
            var it=pick(items);
            if(s.playerGold>=it.c){s.playerGold-=it.c;
                if(it.hp){s.playerHP=clamp(s.playerHP+it.hp,1,s.playerMaxHP);addLog('🛒 购买'+it.e+it.n+'！+'+it.hp+'❤️ -'+it.c+'💰');}
                else{s.playerItems.push({name:it.n,emoji:it.e,effect:it.it});addLog('🛒 购买'+it.e+it.n+'！-'+it.c+'💰');}
                popup('🛒 商店','购买了 '+it.e+it.n,'-'+it.c+'💰');
            }else{addLog('🛒 '+it.e+it.n+'('+it.c+'💰) 金币不足');popup('🛒 商店',it.e+it.n+' '+it.c+'💰','金币不足！');}}
        else if(tile.type==='treasure'){var gold=Math.floor(Math.random()*40)+20;
            var si=s.playerItems.findIndex(function(x){return x.effect==='shield';});
            if(Math.random()<0.3){if(si>=0){s.playerItems.splice(si,1);addLog('💎 宝箱陷阱！护身符挡住了');popup('💎 宝箱','陷阱！护身符保护了你','🛡️消耗');}
            else{var d=Math.floor(Math.random()*15)+10;eff(0,-d);addLog('💎 宝箱陷阱！-'+d+'❤️');popup('💎 宝箱','是陷阱！','-'+d+'❤️');}}
            else{eff(gold,0);addLog('💎 发现宝箱！+'+gold+'💰');popup('💎 宝箱','发现宝藏！','+'+gold+'💰');}}
        else if(tile.type==='trap'){var si2=s.playerItems.findIndex(function(x){return x.effect==='shield';});
            var li=s.playerItems.findIndex(function(x){return x.effect==='lucky';});
            if(li>=0&&Math.random()<0.5){s.playerItems.splice(li,1);var b=Math.floor(Math.random()*20)+10;eff(b,0);
                addLog('💀 陷阱！幸运符发动！+'+b+'💰');popup('🍀 幸运逆转','陷阱被化解！','+'+b+'💰');}
            else if(si2>=0){s.playerItems.splice(si2,1);addLog('💀 陷阱！护身符挡住了');popup('💀 陷阱','护身符保护了你','🛡️消耗');}
            else{var d2=Math.floor(Math.random()*20)+10,gl=Math.floor(Math.random()*15)+5;eff(-gl,-d2);
                addLog('💀 陷阱！-'+d2+'❤️ -'+gl+'💰');popup('💀 陷阱','掉入陷阱！','-'+d2+'❤️ -'+gl+'💰');}}
        else if(tile.type==='rest'){var hl=Math.floor(Math.random()*20)+15;eff(0,hl);addLog('💤 休息 +'+hl+'❤️');popup('💤 休息','好好休息了一番','+'+hl+'❤️');}
        else if(tile.type==='adventure'){var adv=pick(s.worldTheme.advs);s.adventuresDone.push(adv);
            var ag=Math.floor(Math.random()*30)+20,ah=Math.floor(Math.random()*20)-5;var ae=eff(ag,ah);
            addLog('🌟 奇遇：'+adv+'！'+ae);popup('🌟 特殊奇遇！',adv,ae);}
        autoSave();
        renderBoard();
    }
    function popup(title,text,extra){
        var old=document.getElementById('mgs-popup');if(old)old.remove();
        var d=document.createElement('div');d.id='mgs-popup';d.className='mgs-popup';
        d.innerHTML='<div class="mgs-popup-box"><div class="mgs-popup-title">'+title+'</div>'
        +'<div class="mgs-popup-text">'+text+'</div>'
        +(extra?'<div class="mgs-popup-extra">'+extra+'</div>':'')
        +'<div class="mgs-popup-btn" onclick="this.closest(\'.mgs-popup\').remove()">确定</div></div>';
        (document.getElementById('layer-map') || document.body).appendChild(d);
        setTimeout(function(){d.classList.add('show');},10);
    }
    function showEnd(){
        var s=mapGameState;s.active=false;
        saveGameHistory(s);
        clearSavedGame();
        var score=s.playerGold+s.playerHP*2+s.npcMet.length*10+s.adventuresDone.length*25;
        var rank=score>=300?'S':score>=200?'A':score>=150?'B':score>=100?'C':'D';
        var old=document.getElementById('mgs-popup');if(old)old.remove();
        var d=document.createElement('div');d.id='mgs-popup';d.className='mgs-popup';
        d.onclick=function(e){if(e.target===d)d.remove();};
        d.innerHTML='<div class="mgs-popup-box mgs-end">'
        +'<div class="mgs-popup-close" onclick="this.closest(\'.mgs-popup\').remove()" style="position:absolute;top:10px;right:14px;font-size:22px;color:#999;cursor:pointer;z-index:10;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(0,0,0,0.06);">&times;</div>'
        +'<div style="font-size:48px;margin-bottom:8px">🏆</div>'
        +'<div class="mgs-popup-title">冒险结束！</div>'
        +'<div class="mgs-popup-text">成功到达 <b>'+s.contactName+'</b> 的世界</div>'
        +'<div class="mgs-end-stats">'
        +'<div>💰 金币: '+s.playerGold+'</div>'
        +'<div>❤️ 生命: '+s.playerHP+'/'+s.playerMaxHP+'</div>'
        +'<div>👤 遇到NPC: '+s.npcMet.length+'</div>'
        +'<div>🌟 奇遇: '+s.adventuresDone.length+'</div>'
        +'<div>🎲 回合数: '+s.turnCount+'</div>'
        +'<div style="font-size:24px;margin-top:8px">评分: '+score+' ('+rank+')</div></div>'
        +'<div class="mgs-popup-btn" onclick="var p=this.closest(\'.mgs-popup\');if(p)p.remove();window._mapGame.backToSelect();">返回选择</div>'
        +'<div class="mgs-popup-btn" style="background:#4CAF50;margin-top:6px" onclick="var p=this.closest(\'.mgs-popup\');if(p)p.remove();window._mapGame.startGame(\''+s.contactId+'\');">再来一局</div></div>';
        (document.getElementById('layer-map') || document.body).appendChild(d);setTimeout(function(){d.classList.add('show');},10);
    }
    function showItems(){
        var s=mapGameState;
        var old=document.getElementById('mgs-popup');if(old)old.remove();
        var d=document.createElement('div');d.id='mgs-popup';d.className='mgs-popup';
        var itemsH='';
        if(!s.playerItems.length)itemsH='<div style="color:#aaa;text-align:center;padding:20px">背包空空如也~</div>';
        else s.playerItems.forEach(function(it,i){itemsH+='<div class="mgs-item">'+it.emoji+' '+it.name+'</div>';});
        d.innerHTML='<div class="mgs-popup-box"><div class="mgs-popup-title">🎒 背包</div>'
        +'<div class="mgs-items-list">'+itemsH+'</div>'
        +'<div class="mgs-popup-btn" onclick="this.closest(\'.mgs-popup\').remove()">关闭</div></div>';
        (document.getElementById('layer-map') || document.body).appendChild(d);setTimeout(function(){d.classList.add('show');},10);
    }
    function showLog(){
        var s=mapGameState;
        var old=document.getElementById('mgs-popup');if(old)old.remove();
        var d=document.createElement('div');d.id='mgs-popup';d.className='mgs-popup';
        var logH='';if(!s.eventLog.length)logH='<div style="color:#aaa;text-align:center">暂无日志</div>';
        else{var logs=s.eventLog.slice().reverse();logs.forEach(function(l){logH+='<div class="mgs-log-item">'+l+'</div>';});}
        d.innerHTML='<div class="mgs-popup-box"><div class="mgs-popup-title">📜 冒险日志</div>'
        +'<div class="mgs-log-list">'+logH+'</div>'
        +'<div class="mgs-popup-btn" onclick="this.closest(\'.mgs-popup\').remove()">关闭</div></div>';
        (document.getElementById('layer-map') || document.body).appendChild(d);setTimeout(function(){d.classList.add('show');},10);
    }
    function backToSelect(){
        // Save progress before leaving if game is active
        if(mapGameState.active&&mapGameState.mapGenerated){saveGameState();}
        mapGameState.active=false;mapGameState.mapGenerated=false;renderSelect();
    }
    function confirmNewGame(){
        if(!mapGameState.active)return backToSelect();
        if(confirm('确定要放弃当前冒险，开始新游戏吗？')){
            clearSavedGame();
            mapGameState.active=false;mapGameState.mapGenerated=false;
            renderSelect();
        }
    }
    function showHistory(){
        var records=(store.mapGameSave&&store.mapGameSave.history)||[];
        var old=document.getElementById('mgs-popup');if(old)old.remove();
        var d=document.createElement('div');d.id='mgs-popup';d.className='mgs-popup';
        var listH='';
        if(!records.length){listH='<div style="color:#aaa;text-align:center;padding:30px">暂无历史记录<br>完成一局冒险后会自动记录</div>';}
        else{records.slice().reverse().forEach(function(r){
            var dateStr=r.date?new Date(r.date).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';
            var rankColor={S:'#ff6b81',A:'#f1c40f',B:'#5dade2',C:'#2ecc71',D:'#95a5a6'}[r.rank]||'#aaa';
            listH+='<div style="display:flex;align-items:center;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.08);gap:10px">'
            +'<img src="'+(r.contactAvatar||_ph(36))+'" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0">'
            +'<div style="flex:1;min-width:0">'
            +'<div style="font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(r.themeEmoji||'')+' '+r.contactName+'</div>'
            +'<div style="font-size:11px;color:rgba(255,255,255,0.5)">'+dateStr+' · '+(r.themeName||'')+'</div>'
            +'<div style="font-size:11px;color:rgba(255,255,255,0.4)">💰'+r.gold+' ❤️'+r.hp+'/'+r.maxHP+' 🎲'+r.turnCount+'回合 👤'+r.npcCount+' 🌟'+r.adventureCount+'</div>'
            +'</div>'
            +'<div style="text-align:center;flex-shrink:0">'
            +'<div style="font-size:20px;font-weight:700;color:'+rankColor+'">'+r.rank+'</div>'
            +'<div style="font-size:10px;color:rgba(255,255,255,0.4)">'+r.score+'分</div></div></div>';
        });}
        d.innerHTML='<div class="mgs-popup-box" style="max-height:70vh;overflow-y:auto"><div class="mgs-popup-title">🏆 冒险历史</div>'
        +'<div style="max-height:50vh;overflow-y:auto">'+listH+'</div>'
        +'<div style="display:flex;gap:8px;margin-top:10px">'
        +(records.length?'<div class="mgs-popup-btn" style="background:#e74c3c;flex:1" onclick="window._mapGame.clearHistory()">清空记录</div>':'')
        +'<div class="mgs-popup-btn" style="flex:1" onclick="this.closest(\'.mgs-popup\').remove()">关闭</div></div></div>';
        (document.getElementById('layer-map') || document.body).appendChild(d);setTimeout(function(){d.classList.add('show');},10);
    }
    function clearHistory(){
        if(!confirm('确定要清空所有历史记录吗？'))return;
        if(store.mapGameSave)store.mapGameSave.history=[];
        save();
        var old=document.getElementById('mgs-popup');if(old)old.remove();
        showHistory();
        toast('历史记录已清空');
    }
    function openMapGame(){
        // Try to restore saved game first
        if(mapGameState.active&&mapGameState.mapGenerated){renderBoard();return;}
        if(loadGameState()){renderBoard();}
        else{renderSelect();}
    }
    // Auto-save on page unload
    window.addEventListener('beforeunload',function(){
        if(mapGameState.active&&mapGameState.mapGenerated){
            try{saveGameState();}catch(e){}
        }
    });
    // expose
    window._mapGame={startGame:startGame,rollDice:rollDice,showItems:showItems,showLog:showLog,backToSelect:backToSelect,openMapGame:openMapGame,renderSelect:renderSelect,resumeGame:resumeGame,confirmNewGame:confirmNewGame,showHistory:showHistory,clearHistory:clearHistory};
})();
// ========== BACKGROUND KEEP-ALIVE SYSTEM (ENHANCED v4 - Native Android Support) ==========
// 多重策略确保后台持续运行：
// ★★★ Android APK 模式：使用原生前台服务 (Foreground Service) + WakeLock ★★★
// --- Web/浏览器模式（降级策略）---
// 1. 静音音频 (Web Audio API + Audio Element)
// 2. Web Lock API (防止标签页被丢弃)
// 3. Screen Wake Lock API (阻止屏幕休眠)
// 4. Service Worker + 心跳 ping
// 5. 冗余定时器 (setTimeout链)
// 6. 专用 Web Worker 定时器 (不受后台节流)
// 7. BroadcastChannel 多标签同步
// 8. 周期性 fetch keepalive
// 9. 心跳监控 + 激进恢复
// 10. 全局通知统一走 SW showNotification（修复 Illegal constructor 错误）
// 11. IndexedDB 通知队列（页面冻结时 SW 可独立发送）
// 12. SW 自主后台巡检 + 持久化 push 模拟
// 用户需在设置中开启，开启后即使页面在后台也能保持联系人主动发消息

(function() {
    'use strict';

    const TAG = '[KeepAlive]';
    let isEnabled = false;
    let silentAudio = null;
    let silentAudioCtx = null;
    let webLockAbort = null;
    let redundantTimer = null;
    let heartbeatTimer = null;
    let wakeLock = null;
    let worker = null;
    let broadcastChannel = null;
    let swHeartbeatTimer = null;
    let fetchKeepAliveTimer = null;
    let recoveryAttempts = 0;

    // ★★★ 检测是否在 Capacitor 原生环境（Android APK）中运行 ★★★
    const isNativeApp = (function() {
        try {
            return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
        } catch(e) {
            return false;
        }
    })();

    const isAndroid = (function() {
        try {
            return isNativeApp && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'android';
        } catch(e) {
            return isNativeApp && /android/i.test(navigator.userAgent);
        }
    })();

    console.log(TAG, `平台检测: isNativeApp=${isNativeApp}, isAndroid=${isAndroid}`);

    // ★★★ Capacitor 原生插件引用 ★★★
    function getKeepAliveNative() {
        try {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.KeepAlive) {
                return window.Capacitor.Plugins.KeepAlive;
            }
        } catch(e) {}
        return null;
    }

    // ===== ★★★ Android 原生前台服务保活 ★★★ =====
    async function startNativeKeepAlive() {
        const plugin = getKeepAliveNative();
        if (!plugin) {
            console.warn(TAG, '原生 KeepAlive 插件不可用，降级到 Web 策略');
            return false;
        }

        try {
            // 1. 启动前台服务
            const result = await plugin.startKeepAlive();
            console.log(TAG, '★ 原生前台服务已启动:', result.message);

            // 2. 请求忽略电池优化（首次会弹对话框）
            try {
                const batteryResult = await plugin.isIgnoringBatteryOptimizations();
                if (!batteryResult.isIgnoring) {
                    console.log(TAG, '请求忽略电池优化...');
                    await plugin.requestIgnoreBatteryOptimization();
                } else {
                    console.log(TAG, '已处于忽略电池优化状态 ✓');
                }
            } catch(e) {
                console.warn(TAG, '电池优化检查失败:', e);
            }

            return true;
        } catch(e) {
            console.error(TAG, '启动原生前台服务失败:', e);
            return false;
        }
    }

    async function stopNativeKeepAlive() {
        const plugin = getKeepAliveNative();
        if (!plugin) return;

        try {
            await plugin.stopKeepAlive();
            console.log(TAG, '★ 原生前台服务已停止');
        } catch(e) {
            console.warn(TAG, '停止原生前台服务失败:', e);
        }
    }

    async function isNativeServiceRunning() {
        const plugin = getKeepAliveNative();
        if (!plugin) return false;

        try {
            const result = await plugin.isRunning();
            return result.running;
        } catch(e) {
            return false;
        }
    }

    // ===== ★★★ 原生通知发送（Android APK 专用）★★★ =====
    async function sendNativeNotificationAndroid(title, options = {}) {
        const plugin = getKeepAliveNative();
        if (!plugin) return false;

        try {
            await plugin.sendNativeNotification({
                title: title,
                body: options.body || '',
                tag: options.tag || 'yan-msg-' + Date.now(),
                chatId: (options.data && options.data.chatId) || ''
            });
            console.log(TAG, '原生通知已发送:', title);
            return true;
        } catch(e) {
            console.warn(TAG, '原生通知发送失败:', e);
            return false;
        }
    }

    // ===== 1. 静音音频播放（最可靠的后台保活方式）=====
    // ★ v8: Android 原生模式也启用静音音频！
    // 原因：虽然前台服务保持进程存活，但 WebView JS 引擎在后台仍会被节流
    // 静音音频能阻止 WebView 被系统挂起，确保 proactiveCheck 定时器正常执行
    function startSilentAudio() {

        try {
            // 方式A: Web Audio API 生成静音音频（无需外部文件）
            if (!silentAudioCtx || silentAudioCtx.state === 'closed') {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) {
                    console.warn(TAG, 'AudioContext not supported');
                    return startSilentAudioFallback();
                }
                silentAudioCtx = new AudioContext();
            }

            // 确保AudioContext处于运行状态
            if (silentAudioCtx.state === 'suspended') {
                silentAudioCtx.resume();
            }

            // 如果已经有振荡器在运行，不重复创建
            if (window._silentOscillator) {
                try {
                    // 检查是否还活着
                    if (silentAudioCtx.state === 'running') return;
                } catch(e) {}
            }

            // [FIX-嗡鸣] 使用全零 AudioBuffer 循环播放代替振荡器
            // 振荡器即使 gain 极低，在某些手机硬件上仍会因 AGC/共振产生可闻嗡鸣
            const sampleRate = silentAudioCtx.sampleRate;
            const bufferLen = sampleRate * 2; // 2秒静音buffer
            const silentBuffer = silentAudioCtx.createBuffer(1, bufferLen, sampleRate);
            // buffer 默认全零，无需写入数据

            const bufferSource = silentAudioCtx.createBufferSource();
            bufferSource.buffer = silentBuffer;
            bufferSource.loop = true;

            const gainNode = silentAudioCtx.createGain();
            gainNode.gain.value = 0.001; // 保险起见极低增益

            bufferSource.connect(gainNode);
            gainNode.connect(silentAudioCtx.destination);
            bufferSource.start();

            // 存储引用以便后续停止
            window._silentOscillator = bufferSource; // 复用变量名保持兼容
            window._silentGain = gainNode;

            console.log(TAG, '静音音频已启动 (Web Audio API)');
        } catch(e) {
            console.warn(TAG, 'Web Audio API failed, trying fallback:', e);
            startSilentAudioFallback();
        }
    }

    function startSilentAudioFallback() {
        if (isAndroid) return;

        try {
            // 方式B: 使用 <audio> 元素循环播放极短的静音数据
            if (silentAudio) {
                silentAudio.play().catch(() => {});
                return;
            }

            // 生成一个极短的WAV静音文件（base64编码）
            const silentWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            
            silentAudio = new Audio();
            silentAudio.src = silentWav;
            silentAudio.loop = true;
            silentAudio.volume = 0.001;
            silentAudio.setAttribute('playsinline', '');
            silentAudio.setAttribute('webkit-playsinline', '');
            
            const playPromise = silentAudio.play();
            if (playPromise) {
                playPromise.catch(e => {
                    console.warn(TAG, '静音音频播放失败（需要用户交互）:', e.message);
                });
            }

            console.log(TAG, '静音音频已启动 (Audio Element Fallback)');
        } catch(e) {
            console.warn(TAG, '静音音频Fallback也失败:', e);
        }
    }

    function stopSilentAudio() {
        try {
            if (window._silentOscillator) {
                window._silentOscillator.stop();
                window._silentOscillator.disconnect();
                window._silentOscillator = null;
            }
            if (window._silentGain) {
                window._silentGain.disconnect();
                window._silentGain = null;
            }
            if (silentAudioCtx) {
                silentAudioCtx.close().catch(() => {});
                silentAudioCtx = null;
            }
        } catch(e) {}

        try {
            if (silentAudio) {
                silentAudio.pause();
                silentAudio.src = '';
                silentAudio = null;
            }
        } catch(e) {}

        console.log(TAG, '静音音频已停止');
    }

    // ===== 2. Web Lock API（防止标签页被丢弃）=====
    function acquireWebLock() {
        if (isAndroid) return; // Android 原生不需要

        if (!navigator.locks) {
            console.warn(TAG, 'Web Locks API not supported');
            return;
        }

        // 如果已经有锁，不重复获取
        if (webLockAbort) return;

        webLockAbort = new AbortController();

        navigator.locks.request(
            'yan-keep-alive-lock',
            { signal: webLockAbort.signal },
            () => {
                console.log(TAG, 'Web Lock acquired');
                return new Promise((resolve) => {
                    webLockAbort.signal.addEventListener('abort', resolve);
                });
            }
        ).catch(e => {
            if (e.name !== 'AbortError') {
                console.warn(TAG, 'Web Lock failed:', e);
            }
        });
    }

    function releaseWebLock() {
        if (webLockAbort) {
            webLockAbort.abort();
            webLockAbort = null;
            console.log(TAG, 'Web Lock released');
        }
    }

    // ===== 3. Screen Wake Lock API（阻止屏幕休眠）=====
    async function acquireWakeLock() {
        if (isAndroid) return; // Android 原生通过 WakeLock 在 Service 中管理

        if (!('wakeLock' in navigator)) {
            console.warn(TAG, 'Screen Wake Lock API not supported');
            return;
        }

        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log(TAG, 'Wake Lock acquired');

            wakeLock.addEventListener('release', () => {
                console.log(TAG, 'Wake Lock was released');
                if (isEnabled && !document.hidden) {
                    acquireWakeLock();
                }
            });
        } catch(e) {
            console.warn(TAG, 'Wake Lock failed:', e.message);
        }
    }

    function releaseWakeLock() {
        if (wakeLock) {
            wakeLock.release().catch(() => {});
            wakeLock = null;
            console.log(TAG, 'Wake Lock released');
        }
    }

    // ===== 4. Service Worker 注册 + 心跳 ping =====
    async function registerServiceWorker() {
        // Android 原生中 SW 可能不完全支持，但仍可尝试注册
        if (!('serviceWorker' in navigator)) {
            console.warn(TAG, 'Service Worker not supported');
            return;
        }

        try {
            const reg = await navigator.serviceWorker.register('sw.js?v=20260329', { scope: '.' });
            console.log(TAG, 'Service Worker registered:', reg.scope);

            // 尝试注册 Periodic Background Sync
            if ('periodicSync' in reg) {
                try {
                    const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
                    if (status.state === 'granted') {
                        await reg.periodicSync.register('yan-keep-alive', {
                            minInterval: 60 * 1000
                        });
                        console.log(TAG, 'Periodic Sync registered');
                    }
                } catch(e) {
                    console.warn(TAG, 'Periodic Sync not available:', e.message);
                }
            }

            // ★ 监听 SW 消息
            navigator.serviceWorker.addEventListener('message', (event) => {
                const data = event.data;
                if (data && data.type === 'KEEP_ALIVE_PONG') {
                    window._lastSWPong = Date.now();
                }
                // [FIX] SW_EVENT和SW_TICK不再直接调用proactiveCheck
                // proactiveCheck已有主定时器和Worker统一触发，SW仅作为保活心跳
                if (data && (data.type === 'SW_EVENT' || data.type === 'SW_TICK')) {
                    window._lastSWTick = Date.now();
                }
                // ★ 通知点击事件 - 打开对应聊天
                if (data && data.type === 'NOTIFICATION_CLICK') {
                    const notifData = data.data || {};
                    if (notifData.chatId && typeof window.openChat === 'function') {
                        try { window.openChat(notifData.chatId); } catch(e) {}
                    }
                }
            });
        } catch(e) {
            console.warn(TAG, 'Service Worker registration failed:', e);
        }
    }

    // ★ SW心跳：定期向SW发送ping，保持SW活跃
    function startSWHeartbeat() {
        if (swHeartbeatTimer) return;
        
        window._lastSWPong = Date.now();
        
        swHeartbeatTimer = setInterval(() => {
            if (!isEnabled) return;
            try {
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ 
                        type: 'KEEP_ALIVE_PING',
                        timestamp: Date.now()
                    });
                    
                    // 检查SW是否响应（如果超过60秒没有pong，尝试重新注册）
                    if (Date.now() - (window._lastSWPong || 0) > 60000) {
                        console.warn(TAG, 'SW心跳超时，尝试重新注册');
                        registerServiceWorker();
                    }
                }
            } catch(e) {
                console.warn(TAG, 'SW heartbeat error:', e);
            }
        }, 15000); // 每15秒ping一次
        
        console.log(TAG, 'SW心跳已启动');
    }

    function stopSWHeartbeat() {
        if (swHeartbeatTimer) {
            clearInterval(swHeartbeatTimer);
            swHeartbeatTimer = null;
        }
    }

    // ===== 5. 冗余定时器（setTimeout链 + requestAnimationFrame混合）=====
    // ★ v6: 冗余定时器现在也直接触发proactiveCheck，确保后台也能发消息
    function startRedundantTimer() {
        let missedChecks = 0;
        let lastCheckTime = Date.now();

        function tick() {
            if (!isEnabled) return;

            const now = Date.now();
            const elapsed = now - lastCheckTime;
            lastCheckTime = now;

            // [PERF-发热v3] 前台时不需要冗余定时器触发proactiveCheck（主定时器已覆盖）
            // 只在后台时触发，减少前台CPU唤醒次数，降低发热
            if (document.hidden && typeof window.proactiveCheck === 'function') {
                try { window.proactiveCheck(); } catch(e) {}
            }

            if (elapsed > 20000) {
                missedChecks++;
                console.log(TAG, `定时器被节流，间隔=${Math.round(elapsed/1000)}s，累计miss=${missedChecks}`);
                // ★ 被节流时触发恢复机制
                recoverFromThrottling();
            }

            // ★ v6: 缩短间隔到8秒
            redundantTimer = setTimeout(tick, 8000);
        }

        redundantTimer = setTimeout(tick, 8000);
        console.log(TAG, '冗余定时器已启动 (v6增强)');
    }

    function stopRedundantTimer() {
        if (redundantTimer) {
            clearTimeout(redundantTimer);
            redundantTimer = null;
        }
        console.log(TAG, '冗余定时器已停止');
    }

    // ===== 6. ★ 专用 Web Worker 定时器（后台不被节流）=====
    // ★ v6: 缩短Worker间隔到5秒，Worker不受浏览器后台节流影响
    function startWorkerTimer() {
        if (worker) return;
        
        try {
            // ★ v6: Worker内部使用双重定时器（setInterval + setTimeout链），确保至少一个能工作
            const workerCode = `
                let timerId = null;
                let timeoutId = null;
                let interval = 5000; // ★ v6: 5秒

                function doTick() {
                    self.postMessage({ type: 'tick', timestamp: Date.now() });
                }

                function startTimeoutChain() {
                    timeoutId = setTimeout(function chain() {
                        doTick();
                        timeoutId = setTimeout(chain, interval);
                    }, interval);
                }

                self.onmessage = function(e) {
                    if (e.data.command === 'start') {
                        interval = e.data.interval || 5000;
                        if (timerId) clearInterval(timerId);
                        if (timeoutId) clearTimeout(timeoutId);
                        timerId = setInterval(doTick, interval);
                        startTimeoutChain();
                        doTick(); // 立即发送第一次
                    } else if (e.data.command === 'stop') {
                        if (timerId) { clearInterval(timerId); timerId = null; }
                        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
                    } else if (e.data.command === 'ping') {
                        self.postMessage({ type: 'pong', timestamp: Date.now() });
                    }
                };
            `;
            
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            worker = new Worker(url);
            URL.revokeObjectURL(url);
            
            worker.onmessage = function(e) {
                if (e.data.type === 'tick') {
                    window._lastWorkerTick = Date.now();
                    
                    // Worker tick 触发主动检查
                    if (typeof window.proactiveCheck === 'function') {
                        try {
                            window.proactiveCheck();
                        } catch(err) {
                            console.error(TAG, 'Worker tick proactiveCheck error:', err);
                        }
                    }
                    
                    // ★ v6: 如果队列有任务但没在处理，强制启动
                    if (window._autoMsgQueue && window._autoMsgQueue.length > 0 && !window._autoMsgProcessing) {
                        if (typeof window.processAutoMsgQueue === 'function') {
                            try { window.processAutoMsgQueue(); } catch(e) {}
                        }
                    }
                } else if (e.data.type === 'pong') {
                    window._lastWorkerPong = Date.now();
                }
            };
            
            worker.onerror = function(e) {
                console.error(TAG, 'Worker error:', e);
                worker = null;
                if (isEnabled) {
                    setTimeout(startWorkerTimer, 3000); // ★ v6: 更快重启
                }
            };
            
            // ★ v6: 启动 Worker 定时器，5秒间隔
            worker.postMessage({ command: 'start', interval: 5000 });
            
            console.log(TAG, '★ Web Worker 定时器已启动 (v6: 5秒间隔+双重定时器)');
        } catch(e) {
            console.warn(TAG, 'Web Worker 创建失败:', e);
        }
    }

    function stopWorkerTimer() {
        if (worker) {
            try {
                worker.postMessage({ command: 'stop' });
                worker.terminate();
            } catch(e) {}
            worker = null;
        }
        console.log(TAG, 'Web Worker 定时器已停止');
    }

    // ===== 7. ★ BroadcastChannel（多标签页同步）=====
    let broadcastHeartbeatTimer = null; // [FIX] 存储心跳定时器引用
    
    function startBroadcastChannel() {
        if (isAndroid) return; // Android 原生无需多标签同步
        if (broadcastChannel) return;
        
        try {
            if (!('BroadcastChannel' in window)) {
                console.warn(TAG, 'BroadcastChannel not supported');
                return;
            }
            
            broadcastChannel = new BroadcastChannel('yan-keepalive-channel');
            
            broadcastChannel.onmessage = (event) => {
                const data = event.data;
                if (data.type === 'heartbeat') {
                    // 收到其他标签页的心跳，说明至少有一个标签页活着
                    window._lastBroadcastHeartbeat = Date.now();
                }
                // [FIX] 移除 proactive_trigger 自动调用 proactiveCheck，
                // 避免多标签页互相触发造成冗余检查风暴
            };
            
            // [FIX] 定期广播心跳 - 存储定时器引用以便清理
            broadcastHeartbeatTimer = setInterval(() => {
                if (isEnabled && broadcastChannel) {
                    try {
                        broadcastChannel.postMessage({
                            type: 'heartbeat',
                            timestamp: Date.now(),
                            tabId: window._keepAliveTabId
                        });
                    } catch(e) {}
                }
            }, 20000);
            
            // 生成唯一标签页ID
            window._keepAliveTabId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            
            console.log(TAG, '★ BroadcastChannel 已启动');
        } catch(e) {
            console.warn(TAG, 'BroadcastChannel 创建失败:', e);
        }
    }

    function stopBroadcastChannel() {
        // [FIX] 清理心跳定时器，防止内存泄漏
        if (broadcastHeartbeatTimer) {
            clearInterval(broadcastHeartbeatTimer);
            broadcastHeartbeatTimer = null;
        }
        if (broadcastChannel) {
            try { broadcastChannel.close(); } catch(e) {}
            broadcastChannel = null;
        }
    }

    // ===== 8. ★ 周期性 fetch keepalive =====
    function startFetchKeepAlive() {
        if (fetchKeepAliveTimer) return;
        
        fetchKeepAliveTimer = setInterval(() => {
            if (!isEnabled) return;
            
            try {
                // 发一个轻量级的 HEAD 请求到当前页面（保持网络连接活跃）
                // 使用 keepalive 选项，即使页面关闭也能完成
                fetch('.', { 
                    method: 'HEAD', 
                    keepalive: true,
                    cache: 'no-store',
                    signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
                }).catch(() => {}); // 忽略网络错误
            } catch(e) {}
        }, 25000); // 每25秒一次
        
        console.log(TAG, '★ Fetch KeepAlive 已启动');
    }

    function stopFetchKeepAlive() {
        if (fetchKeepAliveTimer) {
            clearInterval(fetchKeepAliveTimer);
            fetchKeepAliveTimer = null;
        }
    }

    // ===== 9. 心跳检测（监控所有保活机制是否存活）=====
    // ★ v6: 心跳也直接触发proactiveCheck + 队列处理
    function startHeartbeat() {
        let lastHeartbeat = Date.now();

        heartbeatTimer = setInterval(() => {
            const now = Date.now();
            const gap = now - lastHeartbeat;
            lastHeartbeat = now;

            // [PERF-发热v3] 前台时不需要心跳触发proactiveCheck（主定时器已覆盖）
            // 只在后台时触发，减少前台CPU唤醒次数，降低发热
            if (document.hidden && typeof window.proactiveCheck === 'function') {
                try { window.proactiveCheck(); } catch(e) {}
            }

            // ★ v6: 检查队列是否卡住
            if (window._autoMsgQueue && window._autoMsgQueue.length > 0 && !window._autoMsgProcessing) {
                console.log(TAG, '★ v6 心跳发现队列有', window._autoMsgQueue.length, '个任务未处理，强制启动');
                if (typeof window.processAutoMsgQueue === 'function') {
                    try { window.processAutoMsgQueue(); } catch(e) {}
                }
            }

            // 如果心跳间隔超过预期的2倍（20秒），说明后台被节流
            if (gap > 20000) {
                console.warn(TAG, `心跳异常！间隔=${Math.round(gap/1000)}s，尝试恢复保活机制`);
                recoverFromThrottling();
            }

            // 记录保活状态
            window._keepAliveStatus = {
                enabled: isEnabled,
                isNativeApp: isNativeApp,
                isAndroid: isAndroid,
                nativeServiceRunning: isAndroid,
                lastHeartbeat: now,
                heartbeatGap: gap,
                silentAudio: !isAndroid && !!(window._silentOscillator || (silentAudio && !silentAudio.paused)),
                webLock: !isAndroid && !!webLockAbort,
                wakeLock: !isAndroid && !!wakeLock,
                redundantTimer: !!redundantTimer,
                workerAlive: !!(worker && window._lastWorkerTick && (now - window._lastWorkerTick < 20000)),
                swAlive: !!(window._lastSWPong && (now - window._lastSWPong < 60000)),
                broadcastChannel: !!broadcastChannel,
                recoveryAttempts: recoveryAttempts,
                queueLength: (window._autoMsgQueue || []).length,
                queueProcessing: !!window._autoMsgProcessing
            };

            // ★ Android 原生模式下异步检查服务状态
            if (isAndroid) {
                isNativeServiceRunning().then(running => {
                    if (window._keepAliveStatus) {
                        window._keepAliveStatus.nativeServiceRunning = running;
                    }
                    // 如果服务意外停止，重新启动
                    if (!running && isEnabled) {
                        console.warn(TAG, '原生前台服务意外停止，重新启动...');
                        startNativeKeepAlive();
                    }
                }).catch(() => {});
            }

        }, 10000);
    }

    function stopHeartbeat() {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }
    }

    // ===== ★ 节流恢复机制 =====
    function recoverFromThrottling() {
        recoveryAttempts++;
        console.log(TAG, `🔄 执行恢复机制 (第${recoveryAttempts}次)`);

        // ★ Android 原生模式：检查并重启前台服务
        if (isAndroid) {
            isNativeServiceRunning().then(running => {
                if (!running) {
                    console.warn(TAG, '原生服务未运行，重新启动');
                    startNativeKeepAlive();
                }
            }).catch(() => {});
        }
        
        // 策略1: 恢复/重启静音音频（仅 Web 模式）
        if (!isAndroid) {
            try {
                if (silentAudioCtx) {
                    if (silentAudioCtx.state === 'suspended') {
                        silentAudioCtx.resume();
                    }
                    if (silentAudioCtx.state === 'closed') {
                        silentAudioCtx = null;
                        startSilentAudio();
                    }
                } else {
                    startSilentAudio();
                }
            } catch(e) {
                console.warn(TAG, '恢复音频失败:', e);
            }
        }
        
        // 策略2: 检查Worker是否还活着
        if (worker) {
            try {
                worker.postMessage({ command: 'ping' });
            } catch(e) {
                console.warn(TAG, 'Worker可能已死，重启');
                worker = null;
                startWorkerTimer();
            }
        } else {
            startWorkerTimer();
        }
        
        // 策略3: 确保Web Lock还在（仅 Web 模式）
        if (!isAndroid && !webLockAbort) {
            acquireWebLock();
        }
        
        // 策略4: 尝试通过SW触发检查
        try {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ 
                    type: 'TRIGGER_CHECK',
                    timestamp: Date.now()
                });
            }
        } catch(e) {}
        
        // 策略5: 通过 BroadcastChannel 请求其他标签页帮忙（仅 Web 模式）
        if (!isAndroid && broadcastChannel) {
            try {
                broadcastChannel.postMessage({ type: 'proactive_trigger' });
            } catch(e) {}
        }
        
        // 策略6: 立即执行一次主动检查
        if (typeof window.proactiveCheck === 'function') {
            try { window.proactiveCheck(); } catch(e) {}
        }
    }

    // ===== 10. 页面可见性变化时恢复 =====
    function handleVisibilityChange() {
        if (!isEnabled) return;

        if (document.hidden) {
            console.log(TAG, '页面进入后台');

            // ★ v8: 所有平台都启动静音音频（WebView后台防节流）
            startSilentAudio();

            if (isAndroid) {
                // ★ Android 原生：确保前台服务在运行
                isNativeServiceRunning().then(running => {
                    if (!running) {
                        startNativeKeepAlive();
                    }
                }).catch(() => {});
            } else {
                // Web 模式：进入后台时确保所有保活机制运行
                acquireWebLock();
            }
            
            // [FIX-后台不发消息] 进入后台时立即执行一次proactiveCheck
            // 确保即将到期的auto_msg能及时入队，而不是等30秒后下次定时器才检查
            if (typeof window.proactiveCheck === 'function') {
                window._lastProactiveCheck = 0; // 重置防重入间隔
                try { window.proactiveCheck(); } catch(e) {}
            }
            
            // ★ 进入后台时向SW发送通知，让SW也启动定时器
            try {
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'PAGE_HIDDEN',
                        timestamp: Date.now()
                    });
                }
            } catch(e) {}
        } else {
            console.log(TAG, '页面回到前台');

            // ★ v8: 所有平台恢复音频上下文
            if (silentAudioCtx && silentAudioCtx.state === 'suspended') {
                silentAudioCtx.resume();
            }

            if (!isAndroid) {
                // Web 模式恢复
                acquireWakeLock();
            }

            // ★ v6: 回到前台时立即执行补偿检查 + 强制处理队列
            if (typeof window.proactiveCheck === 'function') {
                // 立即执行
                window._lastProactiveCheck = 0; // 重置间隔限制
                setTimeout(() => {
                    try { window.proactiveCheck(); } catch(e) {}
                }, 100);
                // 500ms后再执行一次
                setTimeout(() => {
                    window._lastProactiveCheck = 0;
                    try { window.proactiveCheck(); } catch(e) {}
                    // 如果队列有任务但没在处理，强制启动
                    if (window._autoMsgQueue && window._autoMsgQueue.length > 0 && !window._autoMsgProcessing) {
                        console.log(TAG, '★ v6 回到前台发现队列有', window._autoMsgQueue.length, '个待处理任务，强制启动');
                        if (typeof window.processAutoMsgQueue === 'function') {
                            try { window.processAutoMsgQueue(); } catch(e) {}
                        }
                    }
                }, 500);
                // 2秒后再检查一次
                setTimeout(() => {
                    if (window._autoMsgQueue && window._autoMsgQueue.length > 0 && !window._autoMsgProcessing) {
                        if (typeof window.processAutoMsgQueue === 'function') {
                            try { window.processAutoMsgQueue(); } catch(e) {}
                        }
                    }
                }, 2000);
            }
            // ★ 补发冻结期间的通知
            flushPendingNotifications();
            // ★ 通知SW页面恢复
            try {
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ 
                        type: 'PAGE_VISIBLE',
                        timestamp: Date.now()
                    });
                }
            } catch(e) {}
        }
    }

    // ===== 11. 请求通知权限 =====
    async function requestNotificationPermission() {
        // ★ Android 13+ 需要运行时权限 POST_NOTIFICATIONS
        // Capacitor 的 WebView 中 Notification API 可能不可用
        // 但原生通知不需要 Web Notification 权限

        if (!('Notification' in window)) {
            if (isAndroid) {
                console.log(TAG, 'Web Notification API 不可用，将使用原生通知');
                return true; // Android 原生通知不依赖 Web API
            }
            console.warn(TAG, 'Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') {
            console.warn(TAG, 'Notifications denied by user');
            return isAndroid; // Android 原生仍可发送通知
        }

        try {
            const result = await Notification.requestPermission();
            return result === 'granted' || isAndroid;
        } catch(e) {
            console.warn(TAG, 'Notification permission request failed:', e);
            return isAndroid;
        }
    }

    // ===== 主控制函数 =====
    async function enableKeepAlive() {
        if (isEnabled) return;
        isEnabled = true;
        recoveryAttempts = 0;

        console.log(TAG, '🟢 后台保活已开启 (Enhanced v8' + (isAndroid ? ' - Android Native+Audio Mode' : ' - Web Mode') + ')');

        // 请求通知权限
        await requestNotificationPermission();

        // ★ v8: 所有平台都启用静音音频（WebView后台防节流核心策略）
        startSilentAudio();

        if (isAndroid) {
            // ★★★ Android 原生模式：启动前台服务（核心保活机制）★★★
            const nativeStarted = await startNativeKeepAlive();
            if (nativeStarted) {
                console.log(TAG, '★ Android 原生前台服务保活已启动');
            } else {
                console.warn(TAG, '原生前台服务启动失败，降级到 Web 策略');
            }
        } else {
            // Web 浏览器模式：启动传统保活机制
            acquireWebLock();
            await acquireWakeLock();
            startBroadcastChannel();
        }

        // 以下策略在两种模式下都启用
        await registerServiceWorker();
        startRedundantTimer();
        startHeartbeat();
        startWorkerTimer();
        startSWHeartbeat();
        startFetchKeepAlive();

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // ★ 监听 freeze/resume 事件（Page Lifecycle API）
        document.addEventListener('freeze', handlePageFreeze);
        document.addEventListener('resume', handlePageResume);

        // 保存状态到localStorage
        localStorage.setItem('yan_keepalive_enabled', '1');

        // ★ v8: 所有平台都注册用户交互恢复音频（Android WebView 也需要）
        const resumeAudio = () => {
            if (isEnabled) {
                startSilentAudio();
                if (silentAudioCtx && silentAudioCtx.state === 'suspended') {
                    silentAudioCtx.resume();
                }
            }
        };
        document.addEventListener('click', resumeAudio, { once: false, passive: true });
        document.addEventListener('touchstart', resumeAudio, { once: false, passive: true });
        window._keepAliveResumeAudio = resumeAudio;

        if (typeof toast === 'function') {
            if (isAndroid) {
                toast('后台保活已开启 ✅ (原生服务+静音音频双保险)', 'success');
            } else {
                toast('后台保活已开启 ✅ (增强v8 + SW通知 + 应用内弹窗)', 'success');
            }
        }
    }

    function disableKeepAlive() {
        if (!isEnabled) return;
        isEnabled = false;

        console.log(TAG, '🔴 后台保活已关闭');

        // ★ Android 原生模式：停止前台服务
        if (isAndroid) {
            stopNativeKeepAlive();
        }

        // 停止所有保活机制
        stopSilentAudio();
        releaseWebLock();
        releaseWakeLock();
        stopRedundantTimer();
        stopHeartbeat();
        
        // ★ 停止新增机制
        stopWorkerTimer();
        stopSWHeartbeat();
        stopBroadcastChannel();
        stopFetchKeepAlive();

        // 移除事件监听
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        document.removeEventListener('freeze', handlePageFreeze);
        document.removeEventListener('resume', handlePageResume);
        
        if (window._keepAliveResumeAudio) {
            document.removeEventListener('click', window._keepAliveResumeAudio);
            document.removeEventListener('touchstart', window._keepAliveResumeAudio);
        }

        // 保存状态
        localStorage.setItem('yan_keepalive_enabled', '0');

        if (typeof toast === 'function') {
            toast('后台保活已关闭', 'info');
        }
    }

    // ===== ★ Page Lifecycle API 事件处理 =====
    function handlePageFreeze() {
        console.warn(TAG, '⚠️ 页面被冻结 (freeze)');
        // 页面被冻结前，尽可能通知 SW 接管定时器
        try {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({ 
                    type: 'PAGE_FROZEN',
                    timestamp: Date.now()
                });
            }
        } catch(e) {}
    }

    function handlePageResume() {
        console.log(TAG, '♻️ 页面从冻结中恢复 (resume)');
        // 页面恢复后，重新启动所有保活机制
        if (isEnabled) {
            if (isAndroid) {
                // Android 原生：检查前台服务
                isNativeServiceRunning().then(running => {
                    if (!running) startNativeKeepAlive();
                }).catch(() => {});
            } else {
                startSilentAudio();
                acquireWebLock();
            }
            startWorkerTimer();
            startSWHeartbeat();
            // 立即执行补偿检查
            if (typeof window.proactiveCheck === 'function') {
                setTimeout(() => {
                    try { window.proactiveCheck(); } catch(e) {}
                }, 500);
            }
        }
    }

    function isKeepAliveEnabled() {
        return isEnabled;
    }

    function getKeepAliveStatus() {
        return window._keepAliveStatus || {
            enabled: isEnabled,
            isNativeApp: isNativeApp,
            isAndroid: isAndroid,
            nativeServiceRunning: false,
            silentAudio: false,
            webLock: false,
            wakeLock: false,
            redundantTimer: false,
            workerAlive: false,
            swAlive: false,
            broadcastChannel: false,
            recoveryAttempts: 0
        };
    }

    // ===== 自动恢复：页面加载时检查是否之前开启了保活 =====
    function autoRestore() {
        const saved = localStorage.getItem('yan_keepalive_enabled');
        if (saved === '1') {
            console.log(TAG, '检测到之前开启了后台保活，自动恢复...');
            setTimeout(() => {
                enableKeepAlive();
            }, 2000);
        }
    }

    // ===== ★★★ v8: 应用内弹窗通知系统 ★★★ =====
    // 在前台时显示类似 iOS/微信风格的顶部弹窗通知
    // 解决：原生通知不稳定 / 后台通知被系统拦截 的问题
    let inAppNotifContainer = null;

    function _ensureInAppNotifContainer() {
        if (inAppNotifContainer && document.body.contains(inAppNotifContainer)) return inAppNotifContainer;
        
        inAppNotifContainer = document.createElement('div');
        inAppNotifContainer.id = 'yan-inapp-notif-container';
        inAppNotifContainer.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;pointer-events:none;display:flex;flex-direction:column;align-items:center;padding:8px 12px;gap:8px;';
        document.body.appendChild(inAppNotifContainer);

        if (!document.getElementById('yan-inapp-notif-style')) {
            const style = document.createElement('style');
            style.id = 'yan-inapp-notif-style';
            style.textContent = `
                .yan-inapp-notif {
                    pointer-events: auto;
                    width: 100%; max-width: 380px;
                    background: rgba(255,255,255,0.97); color: #333;
                    border-radius: 14px; padding: 12px 16px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.1);
                    display: flex; align-items: center; gap: 10px;
                    transform: translateY(-100%); opacity: 0;
                    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
                    cursor: pointer; user-select: none;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(0,0,0,0.06);
                }
                .yan-inapp-notif.show { transform: translateY(0); opacity: 1; }
                .yan-inapp-notif.hiding { transform: translateY(-100%); opacity: 0; }
                .yan-inapp-notif-avatar {
                    width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
                    background: linear-gradient(135deg, #07c160, #06ad56);
                    display: flex; align-items: center; justify-content: center;
                    color: #fff; font-size: 18px; font-weight: bold;
                    overflow: hidden;
                }
                .yan-inapp-notif-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .yan-inapp-notif-body { flex: 1; min-width: 0; }
                .yan-inapp-notif-title {
                    font-size: 15px; font-weight: 600; color: #1a1a1a;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .yan-inapp-notif-text {
                    font-size: 13px; color: #666; margin-top: 2px;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .yan-inapp-notif-time { font-size: 11px; color: #999; flex-shrink: 0; }
                @media (prefers-color-scheme: dark) {
                    .yan-inapp-notif {
                        background: rgba(44,44,46,0.97); color: #f0f0f0;
                        border-color: rgba(255,255,255,0.08);
                    }
                    .yan-inapp-notif-title { color: #f0f0f0; }
                    .yan-inapp-notif-text { color: #aaa; }
                }
            `;
            document.head.appendChild(style);
        }
        return inAppNotifContainer;
    }

    function showInAppNotification(title, options = {}) {
        try {
            const container = _ensureInAppNotifContainer();
            const notifEl = document.createElement('div');
            notifEl.className = 'yan-inapp-notif';
            
            let avatarHtml = '';
            if (options.icon && options.icon.startsWith('data:')) {
                avatarHtml = `<img src="${options.icon}" alt="">`;
            } else {
                avatarHtml = (title || 'Y').charAt(0);
            }

            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

            notifEl.innerHTML = `
                <div class="yan-inapp-notif-avatar">${avatarHtml}</div>
                <div class="yan-inapp-notif-body">
                    <div class="yan-inapp-notif-title">${_escHtml(title || 'YAN')}</div>
                    <div class="yan-inapp-notif-text">${_escHtml(options.body || '')}</div>
                </div>
                <div class="yan-inapp-notif-time">${timeStr}</div>
            `;

            // 点击弹窗打开对应聊天
            notifEl.addEventListener('click', () => {
                const chatId = options.data && options.data.chatId;
                if (chatId && typeof window.openChat === 'function') {
                    try { window.openChat(chatId); } catch(e) {}
                }
                _dismissInAppNotif(notifEl);
            });

            // 滑动关闭
            let touchStartX = 0;
            notifEl.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
            notifEl.addEventListener('touchend', (e) => {
                const dx = e.changedTouches[0].clientX - touchStartX;
                if (Math.abs(dx) > 80) {
                    notifEl.style.transform = `translateX(${dx > 0 ? '120%' : '-120%'})`;
                    notifEl.style.opacity = '0';
                    setTimeout(() => _dismissInAppNotif(notifEl), 300);
                }
            }, { passive: true });

            container.appendChild(notifEl);
            requestAnimationFrame(() => { requestAnimationFrame(() => { notifEl.classList.add('show'); }); });

            // 振动反馈
            try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch(e) {}

            // 播放提示音
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.frequency.value = 880; osc.type = 'sine';
                gain.gain.value = 0.15;
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                osc.start(); osc.stop(audioCtx.currentTime + 0.3);
                setTimeout(() => audioCtx.close().catch(() => {}), 500);
            } catch(e) {}

            // 5秒后自动消失
            setTimeout(() => _dismissInAppNotif(notifEl), 5000);

            // [FIX-弹窗限制] 最多显示1条应用内弹窗，超出移除之前的
            const allNotifs = container.querySelectorAll('.yan-inapp-notif');
            if (allNotifs.length > 1) {
                Array.from(allNotifs).slice(0, allNotifs.length - 1).forEach(n => _dismissInAppNotif(n));
            }

            console.log(TAG, '★ v8 应用内弹窗已显示:', title);
        } catch(e) {
            console.warn(TAG, '应用内弹窗显示失败:', e);
        }
    }

    function _dismissInAppNotif(el) {
        if (!el || !el.parentNode) return;
        el.classList.remove('show');
        el.classList.add('hiding');
        setTimeout(() => { try { el.parentNode.removeChild(el); } catch(e) {} }, 400);
    }

    function _escHtml(s) {
        if (!s) return '';
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ===== ★ 全局通知函数 =====
    // ★★★ v8: 原生通知 + 应用内弹窗 双保险 ★★★
    async function sendNotification(title, options = {}) {
        console.log(TAG, '★ sendNotification 被调用:', title);

        // ★ v8: 在前台时只显示应用内弹窗，不再叠加原生通知（避免弹窗过多）
        if (!document.hidden) {
            showInAppNotification(title, options);
            return true; // [FIX-弹窗限制] 前台时只用应用内弹窗，跳过原生通知
        }

        // ★ Android 原生优先（仅后台时触发）
        if (isAndroid) {
            const nativeResult = await sendNativeNotificationAndroid(title, options);
            if (nativeResult) return true;
            // 原生通知失败时降级
            console.warn(TAG, '原生通知失败，尝试 Web 通知');
        }

        if (!('Notification' in window)) return !document.hidden; // 前台已有弹窗
        if (Notification.permission !== 'granted') return !document.hidden;

        const notifOptions = {
            body: options.body || '',
            icon: options.icon || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='96' fill='%2307c160'/%3E%3Ctext x='256' y='380' font-size='340' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='bold'%3EY%3C/text%3E%3C/svg%3E",
            badge: options.badge || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='96' fill='%2307c160'/%3E%3Ctext x='256' y='380' font-size='340' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='bold'%3EY%3C/text%3E%3C/svg%3E",
            tag: options.tag || 'yan-msg-' + Date.now(),
            data: options.data || {},
            requireInteraction: options.requireInteraction || false,
            silent: options.silent === true,
            vibrate: options.vibrate || [200, 100, 200]
        };

        // ★ 优先通过 ServiceWorkerRegistration.showNotification()
        try {
            const reg = await navigator.serviceWorker.getRegistration();
            if (reg) {
                await reg.showNotification(title, notifOptions);
                console.log(TAG, '通知已通过 SW 发送:', title);
                return true;
            }
        } catch(e) {
            console.warn(TAG, 'SW showNotification 失败，尝试通过 postMessage:', e);
        }

        // ★ 备选：通过 postMessage 让 SW 显示通知
        try {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SHOW_NOTIFICATION',
                    title: title,
                    body: notifOptions.body,
                    icon: notifOptions.icon,
                    badge: notifOptions.badge,
                    tag: notifOptions.tag,
                    data: notifOptions.data
                });
                console.log(TAG, '通知已通过 SW postMessage 发送:', title);
                return true;
            }
        } catch(e) {
            console.warn(TAG, 'SW postMessage 通知也失败:', e);
        }

        // ★ 最后兜底：尝试 new Notification()
        try {
            new Notification(title, notifOptions);
            console.log(TAG, '通知已通过 new Notification 发送:', title);
            return true;
        } catch(e) {
            console.warn(TAG, '所有通知方式均失败:', e);
            return !document.hidden; // 前台至少有应用内弹窗
        }
    }

    // ===== ★ 通知队列（页面冻结时缓存，恢复后补发）=====
    let pendingNotifications = [];

    function queueNotification(title, options) {
        pendingNotifications.push({ title, options, time: Date.now() });
        // 尝试立即发送
        sendNotification(title, options);
    }

    function flushPendingNotifications() {
        if (pendingNotifications.length === 0) return;
        const now = Date.now();
        // 只发送5分钟内的通知
        const recent = pendingNotifications.filter(n => now - n.time < 300000);
        pendingNotifications = [];
        recent.forEach(n => {
            sendNotification(n.title, n.options);
        });
    }

    // ===== 暴露全局API =====
    window.KeepAlive = {
        enable: enableKeepAlive,
        disable: disableKeepAlive,
        isEnabled: isKeepAliveEnabled,
        getStatus: getKeepAliveStatus,
        toggle: function() {
            if (isEnabled) {
                disableKeepAlive();
            } else {
                enableKeepAlive();
            }
        },
        recover: recoverFromThrottling,
        // ★ v8: 暴露应用内弹窗
        showInAppNotif: showInAppNotification,
        // ★ v8: 测试通知
        testNotification: async function() {
            console.log(TAG, '★ v8 手动测试通知...');
            const result = await sendNotification('🔔 通知测试', {
                body: '如果你看到这条通知，说明通知功能正常工作！(v8双保险: 原生+弹窗)',
                tag: 'test-notif-' + Date.now(),
                data: {}
            });
            console.log(TAG, '★ 测试通知结果:', result);
            return result;
        },
        // ★ 暴露原生相关状态
        isNativeApp: isNativeApp,
        isAndroid: isAndroid,
        // ★ 请求忽略电池优化
        requestIgnoreBattery: async function() {
            const plugin = getKeepAliveNative();
            if (plugin) {
                try {
                    return await plugin.requestIgnoreBatteryOptimization();
                } catch(e) {
                    console.warn(TAG, '请求忽略电池优化失败:', e);
                    return { success: false, message: e.message };
                }
            }
            return { success: false, message: '非原生环境' };
        },
        // ★ 检查电池优化状态
        checkBatteryOptimization: async function() {
            const plugin = getKeepAliveNative();
            if (plugin) {
                try {
                    return await plugin.isIgnoringBatteryOptimizations();
                } catch(e) {
                    return { isIgnoring: false };
                }
            }
            return { isIgnoring: false };
        }
    };

    // ★ 暴露全局通知函数，供其他模块调用
    window.sendNotification = sendNotification;
    window.queueNotification = queueNotification;
    // ★ v8: 暴露应用内弹窗函数
    window.showInAppNotification = showInAppNotification;

    // 页面加载完成后自动恢复
    if (document.readyState === 'complete') {
        autoRestore();
    } else {
        window.addEventListener('load', autoRestore);
    }

})();


// ========== 精灵养成系统 SPIRIT SYSTEM ==========
(function(){
    'use strict';
    
    // 精灵类型定义（GIF动图形象）
    const SPIRIT_TYPES = [
        { id: 'fox', name: '狐狸精灵', gif: 'https://image.uglycat.cc/dnjw6y.gif', desc: '聪明的狐狸精灵，机智灵活' },
        { id: 'bunny', name: '兔兔精灵', gif: 'https://image.uglycat.cc/frwqyn.gif', desc: '温柔的兔子精灵，善良可爱' },
        { id: 'hamster', name: '仓鼠精灵', gif: 'https://image.uglycat.cc/n3ljuy.gif', desc: '小巧的仓鼠精灵，超级可爱' },
        { id: 'whitecat', name: '白猫精灵', gif: 'https://image.uglycat.cc/tj02nd.gif', desc: '优雅的白猫精灵，温柔高贵' },
        { id: 'orangecat', name: '橘猫精灵', gif: 'https://image.uglycat.cc/kw2ceg.gif', desc: '慵懒的橘猫精灵，贪吃可爱' },
        { id: 'dog', name: '小狗精灵', gif: 'https://image.uglycat.cc/nqyp08.gif', desc: '忠诚的小狗精灵，活力满满' }
    ];

    // 获取精灵图片HTML（替代原来的emoji）
    function getSpiritImg(type, size) {
        size = size || 60;
        return `<img src="${type.gif}" alt="${type.name}" style="width:${size}px;height:${size}px;object-fit:contain;image-rendering:auto;" draggable="false">`;
    }
    
    let currentSpiritId = null;
    let spiritChatHistory = [];
    
    // 初始化精灵数据
    function initSpiritData() {
        if (!store.spirits) store.spirits = [];
    }
    
    // [FIX] 精灵界面返回键：返回微信联系人界面而不是主界面
    window.closeSpiritToWxContacts = function() {
        // 关闭精灵layer
        document.getElementById('layer-spirit').classList.remove('show');
        // 确保微信layer显示
        document.getElementById('layer-wechat').classList.add('show');
        // 切换到联系人tab (idx=0)
        document.querySelectorAll('#layer-wechat .page').forEach(e => e.classList.remove('active'));
        document.getElementById('tab-contacts').classList.add('active');
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        // 激活第一个nav-tab（联系人）
        const navTabs = document.querySelectorAll('.nav-tab');
        if (navTabs[0]) navTabs[0].classList.add('active');
        if (typeof renderContacts === 'function') renderContacts();
    };

    // 打开精灵系统
    window.openApp = (function(original) {
        return function(appName) {
            if (appName === 'spirit') {
                initSpiritData();
                document.getElementById('layer-spirit').classList.add('show');
                renderSpiritList();
                return;
            }
            return original.apply(this, arguments);
        };
    })(window.openApp || function(){});
    
    // 渲染精灵列表
    function renderSpiritList() {
        const container = document.getElementById('spirit-list-container');
        const emptyHint = document.getElementById('spirit-empty-hint');
        
        if (!store.spirits || store.spirits.length === 0) {
            container.innerHTML = '';
            emptyHint.style.display = 'block';
            return;
        }
        
        emptyHint.style.display = 'none';
        container.innerHTML = store.spirits.map(spirit => {
            const type = SPIRIT_TYPES.find(t => t.id === spirit.type) || SPIRIT_TYPES[0];
            const age = Math.floor((Date.now() - spirit.createdAt) / (1000 * 60 * 60 * 24));
            const partner = spirit.partnerId ? store.contacts.find(c => c.id === spirit.partnerId) : null;
            
            return `
                <div class="spirit-card" onclick="openSpiritDetail('${spirit.id}')">
                    <div class="spirit-card-header">
                        <div class="spirit-card-avatar">${getSpiritImg(type, 50)}</div>
                        <div class="spirit-card-info">
                            <div class="spirit-card-name">${spirit.name}</div>
                            <div class="spirit-card-meta">
                                <span>${age}岁</span>
                                ${partner ? `<span>· 与${partner.name}共同养育</span>` : '<span>· 独自养育</span>'}
                            </div>
                        </div>
                    </div>
                    <div class="spirit-card-stats">
                        <div class="spirit-stat-item">
                            <div class="spirit-stat-icon spirit-stat-hunger">🍖</div>
                            <span>饱腹 ${spirit.hunger}/100</span>
                        </div>
                        <div class="spirit-stat-item">
                            <div class="spirit-stat-icon spirit-stat-mood">😊</div>
                            <span>心情 ${spirit.mood}/100</span>
                        </div>
                        <div class="spirit-stat-item">
                            <div class="spirit-stat-icon spirit-stat-wisdom">📚</div>
                            <span>智慧 ${spirit.wisdom}/100</span>
                        </div>
                        <div class="spirit-stat-item">
                            <div class="spirit-stat-icon spirit-stat-stamina">💪</div>
                            <span>体力 ${spirit.stamina}/100</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // 打开创建精灵弹窗
    window.openSpiritCreate = function() {
        const modal = document.getElementById('modal-spirit-create');
        const typeSelector = document.getElementById('spirit-type-selector');
        const partnerSelect = document.getElementById('spirit-partner-select');
        
        // 渲染精灵类型选择
        typeSelector.innerHTML = SPIRIT_TYPES.map(type => `
            <div class="spirit-type-option" data-type="${type.id}" onclick="selectSpiritType('${type.id}')">
                ${getSpiritImg(type, 40)}
                <span>${type.name}</span>
            </div>
        `).join('');
        
        // 渲染联系人选择
        partnerSelect.innerHTML = '<option value="">独自养育</option>' +
            store.contacts.filter(c => !c.isGroup).map(c =>
                `<option value="${c.id}">${c.name}</option>`
            ).join('');
        
        modal.style.display = 'flex';
    };
    
    // 选择精灵类型
    window.selectSpiritType = function(typeId) {
        document.querySelectorAll('.spirit-type-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.type === typeId);
        });
    };
    
    // 确认创建精灵
    window.confirmCreateSpirit = function() {
        const selectedType = document.querySelector('.spirit-type-option.selected');
        const nameInput = document.getElementById('spirit-name-input');
        const partnerSelect = document.getElementById('spirit-partner-select');
        
        if (!selectedType) {
            toast('请选择精灵类型', 'error');
            return;
        }
        
        const name = nameInput.value.trim();
        if (!name) {
            toast('请输入精灵名字', 'error');
            return;
        }
        
        const spirit = {
            id: 'spirit_' + Date.now(),
            name: name,
            type: selectedType.dataset.type,
            partnerId: partnerSelect.value || null,
            age: 0,
            hunger: 80,
            mood: 80,
            wisdom: 20,
            stamina: 60,
            health: 100,
            personality: [],
            activities: [],
            conversations: [],
            createdAt: Date.now(),
            lastFeedTime: Date.now(),
            lastInteractTime: Date.now()
        };
        
        store.spirits.push(spirit);
        save();
        
        document.getElementById('modal-spirit-create').style.display = 'none';
        nameInput.value = '';
        renderSpiritList();
        toast('精灵创建成功！', 'success');
        
        // 自动打开详情页
        setTimeout(() => openSpiritDetail(spirit.id), 300);
    };
    
    // 打开精灵详情
    window.openSpiritDetail = function(spiritId) {
        currentSpiritId = spiritId;
        const spirit = store.spirits.find(s => s.id === spiritId);
        if (!spirit) return;
        
        const type = SPIRIT_TYPES.find(t => t.id === spirit.type) || SPIRIT_TYPES[0];
        const age = Math.floor((Date.now() - spirit.createdAt) / (1000 * 60 * 60 * 24));
        const partner = spirit.partnerId ? store.contacts.find(c => c.id === spirit.partnerId) : null;
        
        // 更新显示
        document.getElementById('spirit-avatar-display').innerHTML = getSpiritImg(type, 50);
        document.getElementById('spirit-name-display').textContent = spirit.name;
        document.getElementById('spirit-age-display').textContent = `${age}岁 · ${getAgeStage(age)}`;
        document.getElementById('spirit-display-main').innerHTML = getSpiritImg(type, 120);
        document.getElementById('spirit-mood-text').textContent = getMoodText(spirit.mood);
        document.getElementById('spirit-partner-text').textContent = partner ? `与${partner.name}共同养育` : '独自养育';
        
        // 渲染属性条
        const statsContainer = document.getElementById('spirit-stats-container');
        statsContainer.innerHTML = `
            ${renderStatBar('饱腹', spirit.hunger, '🍖', 'hunger')}
            ${renderStatBar('心情', spirit.mood, '😊', 'mood')}
            ${renderStatBar('智慧', spirit.wisdom, '📚', 'wisdom')}
            ${renderStatBar('体力', spirit.stamina, '💪', 'stamina')}
            ${renderStatBar('健康', spirit.health, '❤️', 'health')}
        `;
        
        // 显示详情页
        document.getElementById('spirit-list-page').style.display = 'none';
        document.getElementById('spirit-detail-page').style.display = 'block';
        
        // 自动衰减检查
        checkSpiritDecay(spirit);
    };
    
    // 渲染属性条
    function renderStatBar(label, value, icon, type) {
        const percentage = Math.max(0, Math.min(100, value));
        return `
            <div class="spirit-stat-bar">
                <div class="spirit-stat-bar-label">
                    <span>${icon} ${label}</span>
                    <span>${Math.round(percentage)}/100</span>
                </div>
                <div class="spirit-stat-bar-bg">
                    <div class="spirit-stat-bar-fill spirit-stat-${type}" style="width:${percentage}%"></div>
                </div>
            </div>
        `;
    }
    
    // 获取年龄阶段
    function getAgeStage(age) {
        if (age === 0) return '刚出生';
        if (age < 3) return '幼年期';
        if (age < 7) return '少年期';
        if (age < 15) return '青年期';
        if (age < 30) return '成年期';
        return '成熟期';
    }
    
    // 获取心情文本
    function getMoodText(mood) {
        if (mood >= 90) return '超级开心！✨';
        if (mood >= 70) return '心情不错~';
        if (mood >= 50) return '还可以吧';
        if (mood >= 30) return '有点不开心...';
        return '很难过😢';
    }
    
    // 检查精灵属性衰减
    let _spiritDecayChecking = false;
    function checkSpiritDecay(spirit) {
        // [FIX] 防止递归调用导致无限循环和卡顿
        if (_spiritDecayChecking) return;
        _spiritDecayChecking = true;
        
        const now = Date.now();
        const hoursSinceLastFeed = (now - spirit.lastFeedTime) / (1000 * 60 * 60);
        const hoursSinceLastInteract = (now - spirit.lastInteractTime) / (1000 * 60 * 60);
        
        let updated = false;
        
        // 饥饿值每小时减少5
        if (hoursSinceLastFeed >= 1) {
            const decay = Math.floor(hoursSinceLastFeed) * 5;
            spirit.hunger = Math.max(0, spirit.hunger - decay);
            spirit.lastFeedTime = now;
            updated = true;
        }
        
        // 心情值每2小时减少3
        if (hoursSinceLastInteract >= 2) {
            const decay = Math.floor(hoursSinceLastInteract / 2) * 3;
            spirit.mood = Math.max(0, spirit.mood - decay);
            updated = true;
        }
        
        // [FIX] 饥饿影响健康 - 只在饥饿衰减发生时才扣健康，避免每次打开都扣
        if (updated && spirit.hunger < 30) {
            spirit.health = Math.max(0, spirit.health - Math.min(5, Math.floor(hoursSinceLastFeed)));
        }
        
        if (updated) {
            save();
            // [FIX] 不再递归调用openSpiritDetail，直接刷新UI
            _spiritDecayChecking = false;
            renderSpiritDetailUI(spirit);
            return;
        }
        _spiritDecayChecking = false;
    }
    
    // [FIX] 抽取精灵详情UI渲染，避免递归
    function renderSpiritDetailUI(spirit) {
        const type = SPIRIT_TYPES.find(t => t.id === spirit.type) || SPIRIT_TYPES[0];
        const age = Math.floor((Date.now() - spirit.createdAt) / (1000 * 60 * 60 * 24));
        const partner = spirit.partnerId ? store.contacts.find(c => c.id === spirit.partnerId) : null;

        document.getElementById('spirit-avatar-display').innerHTML = getSpiritImg(type, 50);
        document.getElementById('spirit-name-display').textContent = spirit.name;
        document.getElementById('spirit-age-display').textContent = `${age}岁 · ${getAgeStage(age)}`;
        document.getElementById('spirit-display-main').innerHTML = getSpiritImg(type, 120);
        document.getElementById('spirit-mood-text').textContent = getMoodText(spirit.mood);
        document.getElementById('spirit-partner-text').textContent = partner ? `与${partner.name}共同养育` : '独自养育';

        const statsContainer = document.getElementById('spirit-stats-container');
        statsContainer.innerHTML = `
            ${renderStatBar('饱腹', spirit.hunger, '🍖', 'hunger')}
            ${renderStatBar('心情', spirit.mood, '😊', 'mood')}
            ${renderStatBar('智慧', spirit.wisdom, '📚', 'wisdom')}
            ${renderStatBar('体力', spirit.stamina, '💪', 'stamina')}
            ${renderStatBar('健康', spirit.health, '❤️', 'health')}
        `;
    }
    
    // 精灵互动
    window.spiritAction = function(action) {
        const spirit = store.spirits.find(s => s.id === currentSpiritId);
        if (!spirit) return;
        
        const type = SPIRIT_TYPES.find(t => t.id === spirit.type) || SPIRIT_TYPES[0];
        
        var notifIcon = getSpiritImg(type, 24);
        switch(action) {
            case 'feed':
                spirit.hunger = Math.min(100, spirit.hunger + 20);
                spirit.mood = Math.min(100, spirit.mood + 5);
                spirit.lastFeedTime = Date.now();
                showSpiritNotification(`${notifIcon} ${spirit.name}吃饱了，很开心！`);
                break;
            case 'study':
                if (spirit.stamina < 20) {
                    showSpiritNotification(`${notifIcon} ${spirit.name}太累了，需要休息...`);
                    return;
                }
                spirit.wisdom = Math.min(100, spirit.wisdom + 10);
                spirit.stamina = Math.max(0, spirit.stamina - 15);
                spirit.mood = Math.max(0, spirit.mood - 5);
                showSpiritNotification(`${notifIcon} ${spirit.name}学到了新知识！`);
                break;
            case 'play':
                if (spirit.stamina < 10) {
                    showSpiritNotification(`${notifIcon} ${spirit.name}太累了，玩不动了...`);
                    return;
                }
                spirit.mood = Math.min(100, spirit.mood + 15);
                spirit.stamina = Math.max(0, spirit.stamina - 10);
                spirit.hunger = Math.max(0, spirit.hunger - 5);
                showSpiritNotification(`${notifIcon} ${spirit.name}玩得很开心！`);
                break;
            case 'exercise':
                if (spirit.stamina < 15) {
                    showSpiritNotification(`${notifIcon} ${spirit.name}太累了，需要休息...`);
                    return;
                }
                spirit.stamina = Math.min(100, spirit.stamina + 5);
                spirit.health = Math.min(100, spirit.health + 5);
                spirit.hunger = Math.max(0, spirit.hunger - 10);
                showSpiritNotification(`${notifIcon} ${spirit.name}锻炼后更强壮了！`);
                break;
            case 'class':
                if (spirit.stamina < 25) {
                    showSpiritNotification(`${notifIcon} ${spirit.name}太累了，上不了课...`);
                    return;
                }
                spirit.wisdom = Math.min(100, spirit.wisdom + 15);
                spirit.mood = Math.min(100, spirit.mood + 5);
                spirit.stamina = Math.max(0, spirit.stamina - 20);
                showSpiritNotification(`${notifIcon} ${spirit.name}在兴趣班学到了很多！`);
                break;
            case 'rest':
                if (spirit.stamina >= 100) {
                    showSpiritNotification(`${notifIcon} ${spirit.name}已经精力充沛，不需要休息！`);
                    return;
                }
                spirit.stamina = Math.min(100, spirit.stamina + 30);
                spirit.mood = Math.max(0, spirit.mood - 5);
                spirit.hunger = Math.max(0, spirit.hunger - 5);
                showSpiritNotification(`${notifIcon} ${spirit.name}美美地睡了一觉，恢复了体力！`);
                break;
            case 'chat':
                openSpiritChat();
                return;
        }
        
        spirit.lastInteractTime = Date.now();
        spirit.activities.push({ action, time: Date.now() });
        save();
        renderSpiritDetailUI(spirit); // [FIX] 直接刷新UI，不再触发衰减检查
    };
    
    // 显示精灵通知
    function showSpiritNotification(message) {
        const notif = document.createElement('div');
        notif.className = 'spirit-event-notification';
        notif.innerHTML = `<i class="fas fa-sparkles"></i> ${message}`;
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    }
    
    // 打开精灵对话
    function openSpiritChat() {
        const spirit = store.spirits.find(s => s.id === currentSpiritId);
        if (!spirit) return;
        
        const type = SPIRIT_TYPES.find(t => t.id === spirit.type) || SPIRIT_TYPES[0];
        document.getElementById('spirit-chat-title').textContent = `与${spirit.name}聊天`;
        
        spiritChatHistory = spirit.conversations || [];
        renderSpiritChat();
        
        document.getElementById('modal-spirit-chat').style.display = 'flex';
        document.getElementById('spirit-chat-input').focus();
    }
    
    // 渲染精灵对话
    function renderSpiritChat() {
        const container = document.getElementById('spirit-chat-history');
        container.innerHTML = spiritChatHistory.map(msg => {
            if (msg.type === 'system') {
                return `<div class="spirit-chat-bubble system">${msg.content}</div>`;
            }
            return `
                <div class="spirit-chat-bubble ${msg.sender}">
                    ${msg.content}
                </div>
            `;
        }).join('');
        container.scrollTop = container.scrollHeight;
    }
    
    // 发送精灵对话
    window.sendSpiritChat = async function() {
        const input = document.getElementById('spirit-chat-input');
        const message = input.value.trim();
        if (!message) return;
        
        const spirit = store.spirits.find(s => s.id === currentSpiritId);
        if (!spirit) return;
        
        const type = SPIRIT_TYPES.find(t => t.id === spirit.type) || SPIRIT_TYPES[0];
        const partner = spirit.partnerId ? store.contacts.find(c => c.id === spirit.partnerId) : null;
        
        // 添加用户消息
        spiritChatHistory.push({ sender: 'user', content: message, time: Date.now() });
        input.value = '';
        renderSpiritChat();
        
        // 添加加载提示
        spiritChatHistory.push({ sender: 'spirit', content: '思考中...', time: Date.now(), loading: true });
        renderSpiritChat();
        
        try {
            // 构建AI提示词
            const age = Math.floor((Date.now() - spirit.createdAt) / (1000 * 60 * 60 * 24));
            const prompt = `你是一个名叫"${spirit.name}"的${type.name}（${type.desc}），年龄${age}岁（${getAgeStage(age)}）。
当前状态：饱腹${spirit.hunger}/100，心情${spirit.mood}/100，智慧${spirit.wisdom}/100，体力${spirit.stamina}/100，健康${spirit.health}/100。
${partner ? `你是用户和${partner.name}共同养育的精灵。` : '你是用户独自养育的精灵。'}

性格特点：${spirit.personality.length > 0 ? spirit.personality.join('、') : '正在成长中'}

请以这个精灵的身份，用可爱、活泼的语气回复用户。回复要简短（1-2句话），符合精灵的年龄和性格。
如果饥饿值低于30，要表现出饿的样子；如果心情低，要表现出不开心；如果体力低，要表现出累的样子。

用户说：${message}

请直接回复，不要加任何标记或格式。`;
            
            const response = await API.chatCompletion([
                { role: 'system', content: prompt },
                { role: 'user', content: message }
            ], { temperature: 0.9, silent: true, scene: 'spirit' });
            
            const reply = response.choices[0].message.content.trim();
            
            // 移除加载提示，添加真实回复
            spiritChatHistory = spiritChatHistory.filter(m => !m.loading);
            spiritChatHistory.push({ sender: 'spirit', content: reply, time: Date.now() });
            
            // 根据对话内容更新性格
            updateSpiritPersonality(spirit, message, reply);
            
        } catch (error) {
            spiritChatHistory = spiritChatHistory.filter(m => !m.loading);
            spiritChatHistory.push({ sender: 'system', content: '对话失败，请检查API设置', time: Date.now() });
        }
        
        spirit.conversations = spiritChatHistory;
        spirit.mood = Math.min(100, spirit.mood + 3);
        spirit.lastInteractTime = Date.now();
        save();
        renderSpiritChat();
    };
    
    // 更新精灵性格
    function updateSpiritPersonality(spirit, userMsg, spiritReply) {
        const keywords = {
            '活泼': ['玩', '开心', '哈哈', '嘻嘻', '好玩'],
            '文静': ['安静', '看书', '学习', '思考'],
            '勇敢': ['不怕', '勇敢', '加油', '努力'],
            '温柔': ['谢谢', '关心', '温暖', '爱'],
            '调皮': ['嘿嘿', '捣蛋', '恶作剧', '偷偷'],
            '聪明': ['知道', '明白', '学会', '懂了'],
            '贪吃': ['吃', '好吃', '美味', '饿'],
            '懒惰': ['累', '休息', '睡觉', '不想动']
        };
        
        const combined = userMsg + spiritReply;
        for (const [trait, words] of Object.entries(keywords)) {
            if (words.some(w => combined.includes(w))) {
                if (!spirit.personality.includes(trait)) {
                    spirit.personality.push(trait);
                    if (spirit.personality.length > 5) {
                        spirit.personality.shift();
                    }
                }
            }
        }
    }
    
    // 关闭精灵详情
    window.closeSpiritDetail = function() {
        document.getElementById('spirit-list-page').style.display = 'block';
        document.getElementById('spirit-detail-page').style.display = 'none';
        currentSpiritId = null;
        renderSpiritList();
    };
    
    // 编辑精灵 - 使用自定义弹窗
    window.openSpiritEdit = function() {
        const sid = window._spiritV2CurrentId || currentSpiritId;
        const spirit = store.spirits.find(s => s.id === sid);
        if (!spirit) return;
        
        const modal = document.getElementById('modal-spirit-edit');
        const input = document.getElementById('spirit-edit-name-input');
        if (!modal || !input) return;
        input.value = spirit.name;
        modal.style.display = 'flex';
        setTimeout(() => input.focus(), 100);
    };
    
    // 确认编辑精灵名字
    window.confirmSpiritEditName = function() {
        const sid = window._spiritV2CurrentId || currentSpiritId;
        const spirit = store.spirits.find(s => s.id === sid);
        if (!spirit) return;
        
        const input = document.getElementById('spirit-edit-name-input');
        const newName = input ? input.value : '';
        if (newName && newName.trim()) {
            spirit.name = newName.trim();
            save();
            document.getElementById('modal-spirit-edit').style.display = 'none';
            openSpiritDetail(spirit.id);
            toast('修改成功', 'success');
        }
    };
    
    // 删除精灵确认 - 使用自定义弹窗
    window.removeSpiritConfirm = function() {
        const sid = window._spiritV2CurrentId || currentSpiritId;
        const spirit = store.spirits.find(s => s.id === sid);
        if (!spirit) return;
        
        const modal = document.getElementById('modal-spirit-delete');
        const nameText = document.getElementById('spirit-delete-name-text');
        if (!modal) return;
        if (nameText) nameText.textContent = `确定要解除与「${spirit.name}」的羁绊吗？这个操作无法撤销。`;
        modal.style.display = 'flex';
    };
    
    // 确认删除精灵
    window.confirmSpiritDelete = function() {
        const sid = window._spiritV2CurrentId || currentSpiritId;
        store.spirits = store.spirits.filter(s => s.id !== sid);
        save();
        document.getElementById('modal-spirit-delete').style.display = 'none';
        closeSpiritDetail();
        toast('已解除精灵', 'success');
    };
    
    // 初始化
    initSpiritData();
    
})();

// ========== LITERATURE SHARING SYSTEM ==========
// 同人文/书城内容转发给联系人 + AI读后感 + 片段分享 + 高亮分享 + 群聊讨论
(function(){
'use strict';

// --- 联系人选择器 ---
function showShareContactPicker(shareData) {
    var contacts = (store.contacts || []).filter(function(c) { return !c.isGroup; });
    var groups = (store.contacts || []).filter(function(c) { return c.isGroup; });
    var overlay = document.createElement('div');
    overlay.id = 'lit-share-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    var previewHtml = '';
    if (shareData.type === 'fanfic' || shareData.type === 'book') {
        var icon = shareData.type === 'fanfic' ? 'fa-feather-alt' : 'fa-book';
        previewHtml = '<div style="display:flex;gap:10px;align-items:center;padding:12px;background:rgba(255,255,255,0.05);border-radius:10px;margin-bottom:12px;">' +
            '<div style="width:40px;height:50px;border-radius:6px;background:' + (shareData.coverColor || '#2BAE85') + ';display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.8);font-size:16px;"><i class="fas ' + icon + '"></i></div>' +
            '<div><div style="font-weight:600;font-size:14px;color:#e0e0e0;">' + escapeHtml(shareData.title || '') + '</div>' +
            '<div style="font-size:11px;color:#888;margin-top:2px;">' + escapeHtml(shareData.author || '匿名') + ' · ' + (shareData.wordCount > 10000 ? (shareData.wordCount/10000).toFixed(1)+'万字' : (shareData.wordCount||0)+'字') + '</div></div></div>';
    } else if (shareData.type === 'fragment') {
        previewHtml = '<div style="padding:10px 12px;background:rgba(255,255,255,0.05);border-radius:10px;margin-bottom:12px;border-left:3px solid #e91e63;">' +
            '<div style="font-size:12px;color:#aaa;font-style:italic;line-height:1.6;">"' + escapeHtml((shareData.fragment || '').substring(0, 100)) + '..."</div>' +
            '<div style="font-size:11px;color:#666;text-align:right;margin-top:4px;">—— ' + escapeHtml(shareData.title || '') + '</div></div>';
    }

    var contactsHtml = contacts.map(function(c) {
        var av = c.avatar ? '<img src="' + escapeHtml(c.avatar) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">' : '<div style="width:36px;height:36px;border-radius:50%;background:#555;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;">' + escapeHtml((c.name||'?')[0]) + '</div>';
        return '<div class="lit-share-contact" onclick="window._litShare.doShare(\'' + c.id + '\',' + (c.isGroup ? 'true' : 'false') + ')">' + av + '<span>' + escapeHtml(c.name) + '</span></div>';
    }).join('');

    var groupsHtml = groups.length > 0 ? '<div style="font-size:12px;color:#888;padding:8px 0 4px;">群聊</div>' + groups.map(function(g) {
        var av = g.avatar ? '<img src="' + escapeHtml(g.avatar) + '" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">' : '<div style="width:36px;height:36px;border-radius:50%;background:#3498db;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;">群</div>';
        return '<div class="lit-share-contact" onclick="window._litShare.doShare(\'' + g.id + '\',true)">' + av + '<span>' + escapeHtml(g.name) + '</span></div>';
    }).join('') : '';

    overlay.innerHTML = '<div style="background:#1a1a2e;border-radius:20px 20px 0 0;width:100%;max-width:420px;max-height:75vh;display:flex;flex-direction:column;padding:16px 20px 24px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
        '<span style="font-size:16px;font-weight:700;color:#e0e0e0;">📤 分享给</span>' +
        '<button onclick="document.getElementById(\'lit-share-overlay\').remove()" style="background:none;border:none;color:#888;font-size:18px;cursor:pointer;">×</button></div>' +
        previewHtml +
        '<div style="max-height:50vh;overflow-y:auto;">' +
        '<div style="font-size:12px;color:#888;padding:0 0 4px;">联系人</div>' +
        contactsHtml + groupsHtml +
        '</div></div>';

    // 注入样式
    if (!document.getElementById('lit-share-style')) {
        var style = document.createElement('style');
        style.id = 'lit-share-style';
        style.textContent = '.lit-share-contact{display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:10px;cursor:pointer;transition:background 0.15s;}.lit-share-contact:active{background:rgba(255,255,255,0.08);}.lit-share-contact span{font-size:14px;color:#ccc;}';
        document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
    // 存储当前分享数据
    window._litShare._pendingData = shareData;
}

// --- 执行分享 ---
function doShare(contactId, isGroup) {
    var shareData = window._litShare._pendingData;
    if (!shareData) return;
    var overlay = document.getElementById('lit-share-overlay');
    if (overlay) overlay.remove();

    if (!store.chats) store.chats = {};
    if (!store.chats[contactId]) store.chats[contactId] = [];

    var msgType, msgContent;
    if (shareData.type === 'fragment') {
        msgType = 'shared-literature-fragment';
        msgContent = JSON.stringify({
            fragment: shareData.fragment,
            title: shareData.title,
            author: shareData.author,
            sourceType: shareData.sourceType,
            sourceId: shareData.sourceId
        });
    } else if (shareData.type === 'highlight') {
        msgType = 'shared-highlight';
        msgContent = JSON.stringify({
            text: shareData.text,
            note: shareData.note,
            color: shareData.color,
            title: shareData.title,
            position: shareData.position
        });
    } else {
        msgType = 'shared-literature';
        msgContent = JSON.stringify({
            sourceType: shareData.type,
            sourceId: shareData.id,
            title: shareData.title,
            author: shareData.author,
            excerpt: (shareData.fullContent || '').substring(0, 200),
            fullContent: shareData.fullContent,
            wordCount: shareData.wordCount,
            coverColor: shareData.coverColor || '#2BAE85',
            genre: shareData.genre || '',
            cpName: shareData.cpName || ''
        });
    }

    store.chats[contactId].push({
        sender: 'me',
        type: msgType,
        content: msgContent,
        time: Date.now()
    });
    if (typeof save === 'function') save();
    if (typeof toast === 'function') toast('已分享');

    // 触发AI读后感（非群聊时单人回复，群聊时多人讨论）
    if (shareData.type === 'fanfic' || shareData.type === 'book') {
        if (isGroup) {
            setTimeout(function() { generateGroupDiscussion(contactId, shareData); }, 2000);
        } else {
            setTimeout(function() { generateLiteratureReaction(contactId, shareData); }, 2000 + Math.random() * 3000);
        }
    }

    // 刷新聊天界面
    if (typeof renderMessages === 'function') {
        try { renderMessages(); } catch(e) {}
    }
}

// --- AI 读后感回复 ---
async function generateLiteratureReaction(contactId, shareData) {
    var contact = (store.contacts || []).find(function(c) { return c.id === contactId; });
    if (!contact) return;
    var persona = typeof getAiContext === 'function' ? getAiContext(contact) : ('你是' + contact.name + '。' + (contact.persona || ''));
    var userName = typeof getUserPersonaName === 'function' ? getUserPersonaName(contact, store.user.name || '用户') : '对方';

    var full = shareData.fullContent || shareData.excerpt || '';
    var contentForAI = full.length > 2000 ? full.substring(0, 1500) + '\n...(省略)...\n' + full.slice(-500) : full;

    var sysPrompt = persona + '\n\n' + userName + '给你分享了一篇' +
        (shareData.type === 'fanfic' ? '同人文' : '小说') + '。阅读后给出真实反应。' +
        '可以是喜欢、吐槽、感动、无语等，完全取决于你的人设和性格。回复1-3句，自然口语化。不要用任何标签。';
    var userPrompt = '标题：' + shareData.title + '\n作者：' + (shareData.author || '匿名') +
        (shareData.cpName ? '\nCP：' + shareData.cpName : '') +
        '\n类型：' + (shareData.genre || '') + '\n\n正文节选：\n' + contentForAI;

    try {
        if (typeof API === 'undefined' || !API || !API.chatCompletion) return;
        var data = await API.chatCompletion([
            { role: 'system', content: sysPrompt },
            { role: 'user', content: userPrompt }
        ], 0.85);
        var reply = (data.choices[0].message.content || '').trim();
        if (!reply) return;
        // 清理可能的标签
        reply = reply.replace(/\[.*?\]/g, '').trim();
        if (!reply) return;
        if (!store.chats[contactId]) store.chats[contactId] = [];
        store.chats[contactId].push({ sender: 'ai', type: 'text', content: reply, time: Date.now() });
        if (typeof save === 'function') save();
        if (typeof renderMessages === 'function') try { renderMessages(); } catch(e) {}
    } catch(e) { console.error('Literature reaction failed:', e); }
}

// --- 群聊多人讨论 ---
async function generateGroupDiscussion(groupId, shareData) {
    var group = (store.contacts || []).find(function(c) { return c.id === groupId; });
    if (!group || !group.isGroup) return;
    var members = (group.members || []).slice(0, 5);
    if (members.length === 0) return;

    var full = shareData.fullContent || shareData.excerpt || '';
    var contentForAI = full.length > 1500 ? full.substring(0, 1000) + '\n...(省略)...\n' + full.slice(-300) : full;

    var memberNames = members.map(function(mid) {
        var c = (store.contacts || []).find(function(x) { return x.id === mid; });
        return c ? c.name : '成员';
    }).join('、');

    var sysPrompt = '你需要模拟群聊中多个成员对一篇分享文章的讨论。群成员有：' + memberNames + '。' +
        '每个人根据自己的性格给出不同反应（有人喜欢、有人吐槽、有人分析等）。' +
        '输出格式：每条消息一行，格式为 [成员名]:内容。共3-6条消息，模拟真实群聊讨论节奏。';
    var userPrompt = '分享的文章：\n标题：' + shareData.title + '\n作者：' + (shareData.author || '匿名') +
        '\n类型：' + (shareData.genre || '') + '\n\n节选：\n' + contentForAI;

    try {
        if (typeof API === 'undefined' || !API || !API.chatCompletion) return;
        var data = await API.chatCompletion([
            { role: 'system', content: sysPrompt },
            { role: 'user', content: userPrompt }
        ], 0.9);
        var reply = (data.choices[0].message.content || '').trim();
        if (!reply) return;
        // 解析 [名字]:内容 格式
        var lines = reply.split('\n').filter(function(l) { return l.trim(); });
        var delay = 0;
        lines.forEach(function(line) {
            var match = line.match(/\[?([\u4e00-\u9fff\w]+)\]?\s*[:：]\s*(.*)/);
            if (!match) return;
            var name = match[1].trim();
            var content = match[2].trim().replace(/\[.*?\]/g, '');
            if (!content) return;
            var member = members.find(function(mid) {
                var c = (store.contacts || []).find(function(x) { return x.id === mid; });
                return c && c.name === name;
            });
            delay += 1500 + Math.random() * 2000;
            setTimeout(function() {
                if (!store.chats[groupId]) store.chats[groupId] = [];
                store.chats[groupId].push({
                    sender: 'ai',
                    type: 'text',
                    content: content,
                    time: Date.now(),
                    goSenderName: name,
                    goSenderId: member || ''
                });
                if (typeof save === 'function') save();
                if (typeof renderMessages === 'function') try { renderMessages(); } catch(e) {}
            }, delay);
        });
    } catch(e) { console.error('Group discussion failed:', e); }
}

// --- 联系人主动推荐 ---
async function contactRecommendLiterature(contactId) {
    var contact = (store.contacts || []).find(function(c) { return c.id === contactId; });
    if (!contact) return;
    // 从同人文库中找一篇符合联系人人设的文章
    var stories = (store.fanfic && store.fanfic.stories) ? store.fanfic.stories.filter(function(s) { return s.status === 'published' && s.content; }) : [];
    var books = store.books || [];
    var allItems = stories.map(function(s) { return { type: 'fanfic', id: s.id, title: s.title, author: s.author, genre: s.genre, wordCount: s.wordCount || (s.content||'').length, content: s.content, coverColor: s.coverColor, cpName: s.cpName }; })
        .concat(books.map(function(b) { return { type: 'book', id: b.id, title: b.name, author: b.author, wordCount: (b.content||'').length, content: b.content, coverColor: '#3498db' }; }));
    if (allItems.length === 0) return;

    // 随机选一篇
    var item = allItems[Math.floor(Math.random() * allItems.length)];
    var persona = typeof getAiContext === 'function' ? getAiContext(contact) : (contact.persona || '');
    var userName = typeof getUserPersonaName === 'function' ? getUserPersonaName(contact, store.user.name || '用户') : '你';

    // 先发推荐语
    try {
        if (typeof API === 'undefined' || !API || !API.chatCompletion) return;
        var data = await API.chatCompletion([
            { role: 'system', content: persona + '\n\n你发现了一篇有趣的文章想推荐给' + userName + '。用1-2句话自然地推荐，语气符合你的人设。不要用任何标签。' },
            { role: 'user', content: '推荐文章：' + item.title + '（' + (item.author || '匿名') + '）' }
        ], 0.85);
        var recMsg = (data.choices[0].message.content || '').trim().replace(/\[.*?\]/g, '');
        if (recMsg) {
            if (!store.chats[contactId]) store.chats[contactId] = [];
            store.chats[contactId].push({ sender: 'ai', type: 'text', content: recMsg, time: Date.now() });
        }
    } catch(e) {}

    // 再发分享卡片
    setTimeout(function() {
        if (!store.chats[contactId]) store.chats[contactId] = [];
        store.chats[contactId].push({
            sender: 'ai',
            type: 'shared-literature',
            content: JSON.stringify({
                sourceType: item.type,
                sourceId: item.id,
                title: item.title,
                author: item.author || '匿名',
                excerpt: (item.content || '').substring(0, 200),
                wordCount: item.wordCount,
                coverColor: item.coverColor || '#2BAE85',
                genre: item.genre || '',
                cpName: item.cpName || ''
            }),
            time: Date.now()
        });
        if (typeof save === 'function') save();
        if (typeof renderMessages === 'function') try { renderMessages(); } catch(e) {}
    }, 1000);
}

// --- 暴露全局接口 ---
window._litShare = {
    _pendingData: null,
    showPicker: showShareContactPicker,
    doShare: doShare,
    contactRecommend: contactRecommendLiterature
};

// 同人文分享入口
window.ffShareToContact = function(storyId) {
    var story = (store.fanfic && store.fanfic.stories) ? store.fanfic.stories.find(function(s) { return s.id === storyId; }) : null;
    if (!story) { if (typeof toast === 'function') toast('找不到文章'); return; }
    showShareContactPicker({
        type: 'fanfic', id: storyId,
        title: story.title, author: story.author || '匿名',
        fullContent: story.content || '',
        wordCount: story.wordCount || (story.content || '').length,
        coverColor: story.coverColor || '#2BAE85',
        genre: story.genre || '', cpName: story.cpName || ''
    });
};

// 同人文片段分享
window.ffShareFragment = function(storyId, fragment) {
    var story = (store.fanfic && store.fanfic.stories) ? store.fanfic.stories.find(function(s) { return s.id === storyId; }) : null;
    showShareContactPicker({
        type: 'fragment',
        fragment: fragment,
        title: story ? story.title : '未知',
        author: story ? (story.author || '匿名') : '匿名',
        sourceType: 'fanfic', sourceId: storyId
    });
};

// 书城分享入口
window.shareBookToContact = function(bookId) {
    var book = (store.books || []).find(function(b) { return b.id === bookId; });
    if (!book) { if (typeof toast === 'function') toast('找不到书籍'); return; }
    showShareContactPicker({
        type: 'book', id: bookId,
        title: book.name, author: book.author || '未知作者',
        fullContent: book.content || '',
        wordCount: (book.content || '').length,
        coverColor: '#3498db'
    });
};

// 书城片段分享
window.shareBookFragment = function(bookId, fragment) {
    var book = (store.books || []).find(function(b) { return b.id === bookId; });
    showShareContactPicker({
        type: 'fragment',
        fragment: fragment,
        title: book ? book.name : '未知',
        author: book ? (book.author || '未知') : '未知',
        sourceType: 'book', sourceId: bookId
    });
};

// 高亮/批注分享
window.shareHighlight = function(data) {
    showShareContactPicker({
        type: 'highlight',
        text: data.text,
        note: data.note || '',
        color: data.color || '#e91e63',
        title: data.title || '',
        position: data.position || ''
    });
};

})();
