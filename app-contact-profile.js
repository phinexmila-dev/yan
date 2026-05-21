        // ===== 联系人个人主页系统 =====
        function openContactProfile(contactId) {
            const c = store.contacts.find(x => x.id === contactId);
            if (!c || c.isGroup) return;
            const displayName = c.remark || c.name;
            const sig = c.signature || '这个人很懒，什么都没写~';
            const status = c.status || '在线';
            const ip = c.settings?.aiRealCity || c.settings?.aiVirtualCity || '未知';
            const bgUrl = c.profileBg || '';
            const avatarUrl = c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((c.name||'?')[0])}&background=random`;

            // [FIX-朋友圈同步] 获取该联系人的朋友圈：优先用 contactId 匹配（精确），回退到 name 匹配（兼容旧数据）
            const moments = (store.moments || []).filter(m => m.contactId ? m.contactId === c.id : m.name === c.name).slice(-20).reverse();
            let momentsHtml = '';
            if (moments.length > 0) {
                momentsHtml = moments.map(m => {
                    const timeStr = m.time ? new Date(m.time).toLocaleDateString('zh-CN') : '';
                    const imgHtml = m.image ? `<img src="${m.image}" style="width:100%;max-height:200px;object-fit:cover;border-radius:6px;margin-top:8px;">` : '';
                    return `<div class="cp-moment-item">
                        <div class="cp-moment-text">${typeof escapeHtml==='function'?escapeHtml(m.content||''):m.content||''}</div>
                        ${imgHtml}
                        <div class="cp-moment-time">${timeStr}</div>
                    </div>`;
                }).join('');
            } else {
                momentsHtml = '<div style="text-align:center;padding:40px 0;color:#999;font-size:13px;">暂无动态</div>';
            }

            const html = `
                <div class="cp-container">
                    <div class="cp-header" style="${bgUrl ? 'background-image:url('+bgUrl+');background-size:cover;background-position:center;' : ''}">
                        <div class="cp-header-overlay"></div>
                        <div class="cp-nav">
                            <div class="cp-nav-btn" onclick="closeLayer('layer-contact-profile')"><i class="fas fa-chevron-left"></i></div>
                            <div class="cp-nav-btn" onclick="openShareContactCard('${c.id}')"><i class="fas fa-share-alt"></i></div>
                        </div>
                        <div class="cp-avatar-area">
                            <img class="cp-avatar" src="${avatarUrl}" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent((c.name||'?')[0])}&background=random&size=120';">
                        </div>
                    </div>
                    <div class="cp-info">
                        <div class="cp-name">${typeof escapeHtml==='function'?escapeHtml(displayName):displayName}</div>
                        ${c.remark && c.name !== c.remark ? '<div class="cp-realname">名字: '+( typeof escapeHtml==='function'?escapeHtml(c.name):c.name)+'</div>' : ''}
                        <div class="cp-status-badge"><span class="cp-status-dot"></span>${typeof escapeHtml==='function'?escapeHtml(status):status}</div>
                        <div class="cp-signature">${typeof escapeHtml==='function'?escapeHtml(sig):sig}</div>
                        <div class="cp-ip"><i class="fas fa-map-marker-alt"></i> IP属地: ${typeof escapeHtml==='function'?escapeHtml(ip):ip}</div>
                        ${c.remarkForMe ? '<div class="cp-remark-for-me"><i class="fas fa-tag"></i> TA对你的备注: '+(typeof escapeHtml==='function'?escapeHtml(c.remarkForMe):c.remarkForMe)+'</div>' : ''}
                    </div>
                    <div class="cp-actions">
                        <div class="cp-actions-primary">
                            <button class="cp-action-btn" onclick="closeLayer('layer-contact-profile');openChat('${c.id}')"><i class="fas fa-comment-dots"></i> 发消息</button>
                            <button class="cp-action-btn cp-action-edit" onclick="openEditContactProfile('${c.id}')"><i class="fas fa-edit"></i> 编辑资料</button>
                        </div>
                        <div class="cp-actions-secondary">
                            <button class="cp-action-btn cp-action-bg" onclick="uploadContactProfileBg('${c.id}')"><i class="fas fa-image"></i><span>背景</span></button>
                            <button class="cp-action-btn" onclick="openMemoirExport('${c.id}')"><i class="fas fa-download"></i><span>回忆录</span></button>
                            <button class="cp-action-btn cp-action-accent1" onclick="openSmsAltPhoneManager('${c.id}')"><i class="fas fa-phone-flip"></i><span>小号</span></button>
                            <button class="cp-action-btn cp-action-accent2" onclick="closeLayer('layer-contact-profile');openContactPhotoAlbum('${c.id}')"><i class="fas fa-images"></i><span>相册</span></button>
                        </div>
                    </div>
                    <div class="cp-section-title"><i class="fas fa-camera-retro"></i> TA的动态</div>
                    <div class="cp-moments">${momentsHtml}</div>
                </div>
            `;
            document.getElementById('contact-profile-content').innerHTML = html;
            document.getElementById('layer-contact-profile').classList.add('show');
        }
        window.openContactProfile = openContactProfile;

        // 上传联系人主页背景
        function uploadContactProfileBg(contactId) {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = 'image/*';
            input.onchange = function() {
                const file = this.files[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = function(e) {
                    const c = store.contacts.find(x => x.id === contactId);
                    if (c) { c.profileBg = e.target.result; save(); openContactProfile(contactId); toast('背景已更新'); }
                };
                reader.readAsDataURL(file);
            };
            input.click();
        }

        // 编辑联系人资料弹窗
        function openEditContactProfile(contactId) {
            const c = store.contacts.find(x => x.id === contactId);
            if (!c) return;
            const modal = document.createElement('div');
            modal.id = 'modal-edit-profile';
            modal.className = 'modal-mask';
            modal.style.cssText = 'z-index:10001;display:flex;';
            modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `<div class="modal-box" style="max-height:80vh;overflow-y:auto;">
                <h3 style="margin-bottom:15px;">编辑联系人资料</h3>
                <div style="margin-bottom:10px;"><label style="font-size:12px;color:#999;">名字（TA自己叫什么）</label><input id="ep-name" value="${c.name||''}" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:8px;margin-top:4px;"></div>
                <div style="margin-bottom:10px;"><label style="font-size:12px;color:#999;">你对TA的备注</label><input id="ep-remark" value="${c.remark||''}" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:8px;margin-top:4px;"></div>
                <div style="margin-bottom:10px;"><label style="font-size:12px;color:#999;">TA对你的备注</label><input id="ep-remark-for-me" value="${c.remarkForMe||''}" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:8px;margin-top:4px;"></div>
                <div style="margin-bottom:10px;"><label style="font-size:12px;color:#999;">个性签名</label><input id="ep-signature" value="${c.signature||''}" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:8px;margin-top:4px;"></div>
                <div style="margin-bottom:10px;"><label style="font-size:12px;color:#999;">状态</label>
                    <select id="ep-status" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:8px;margin-top:4px;">
                        <option value="在线" ${c.status==='在线'?'selected':''}>在线</option>
                        <option value="忙碌" ${c.status==='忙碌'?'selected':''}>忙碌</option>
                        <option value="离开" ${c.status==='离开'?'selected':''}>离开</option>
                        <option value="请勿打扰" ${c.status==='请勿打扰'?'selected':''}>请勿打扰</option>
                        <option value="隐身" ${c.status==='隐身'?'selected':''}>隐身</option>
                        ${c.status && !['在线','忙碌','离开','请勿打扰','隐身'].includes(c.status) ? '<option value="'+c.status+'" selected>'+c.status+'</option>' : ''}
                    </select>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:15px;">
                    <button onclick="this.closest('.modal-mask').remove()" style="padding:10px 20px;border:none;background:#f0f0f0;border-radius:8px;color:#666;">取消</button>
                    <button onclick="saveEditContactProfile('${c.id}')" style="padding:10px 20px;border:none;background:#333;color:#fff;border-radius:8px;">保存</button>
                </div>
            </div>`;
            document.getElementById('device').appendChild(modal);
        }

        function saveEditContactProfile(contactId) {
            const c = store.contacts.find(x => x.id === contactId);
            if (!c) return;
            const oldRemark = c.remark || '';
            c.name = document.getElementById('ep-name')?.value || c.name;
            c.remark = (document.getElementById('ep-remark')?.value || '').trim();
            c.remarkForMe = (document.getElementById('ep-remark-for-me')?.value || '').trim();
            c.signature = (document.getElementById('ep-signature')?.value || '').trim();
            c.status = document.getElementById('ep-status')?.value || '在线';
            save();
            const modal = document.getElementById('modal-edit-profile');
            if (modal) modal.remove();
            openContactProfile(contactId);
            toast('资料已更新');
            // 如果备注变了，联系人会知道并询问
            if (oldRemark !== c.remark && c.remark) {
                _notifyContactRemarkChanged(c, oldRemark, c.remark);
            }
        }

        // [FIX-弹窗符号] 通用的文本清洗函数，去除引号、括号、控制字符、零宽字符、孤立代理对
        // 用于备注、状态等需要展示在弹窗/UI的AI生成文本
        function _cleanRemarkText(text) {
            if (!text || typeof text !== 'string') return '';
            return text
                .replace(/["""''`《》「」【】\[\]\{\}\(\)（）\n\r\t]/g, '')   // 各种引号/括号/换行
                .replace(/[\x00-\x1f\x7f]/g, '')                                    // 控制字符
                .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD\u180E]/g, '')    // 零宽字符+BOM+软连字符
                .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')                // 孤立高代理项
                .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')               // 孤立低代理项
                .replace(/^[\s\-:：·•→←↑↓=+>\.。，,;；]+/, '')                    // 开头的特殊符号
                .replace(/[\s\-:：·•→←↑↓=+>\.。，,;；]+$/, '')                    // 结尾的特殊符号
                .trim();
        }
        window._cleanRemarkText = _cleanRemarkText;

        // 备注变更通知联系人（在聊天中插入系统消息+通过API生成符合人设的回复）
        function _notifyContactRemarkChanged(contact, oldRemark, newRemark) {
            if (!contact || !store.chats) return;
            const chatId = contact.id;
            if (!store.chats[chatId]) store.chats[chatId] = [];
            store.chats[chatId].push({
                sender: 'system', type: 'poke',
                content: `你将备注修改为「${newRemark}」`,
                time: Date.now()
            });
            save();
            // 延迟后通过API生成联系人的符合人设回复
            setTimeout(async () => {
                if (!store.chats[chatId]) store.chats[chatId] = [];
                const userName = typeof getUserPersonaName === 'function' ? getUserPersonaName(contact, store.user.name || '用户') : (store.user.name || '用户');
                const contextDesc = oldRemark
                    ? `${userName}把你的备注从「${oldRemark}」改成了「${newRemark}」`
                    : `${userName}给你设了备注「${newRemark}」`;
                try {
                    if (typeof API !== 'undefined' && API && API.chatCompletion && store.system && store.system.url && store.system.key) {
                        const aiCtx = typeof getAiContext === 'function' ? getAiContext(contact) : `你是${contact.name}。人设：${(contact.persona || '').substring(0, 300)}`;
                        const sysPrompt = aiCtx + `\n\n情境：${contextDesc}\n\n任务：以${contact.name}的身份，对备注变更做出自然反应。可以是好奇、开心、不满、调侃等，完全取决于你的人设和这个备注的含义。1-3句话，简短自然口语化。只输出回复文本，不要任何标签或格式。`;
                        // [FIX-副API路由] 使用options对象传参，支持副API场景路由（默认走主API chat场景，此处不指定scene，走默认路由）
                        const data = await API.chatCompletion([
                            { role: 'system', content: sysPrompt },
                            { role: 'user', content: contextDesc }
                        ], { temperature: store.system.temp || 0.7 });
                        let reply = (data.choices[0].message.content || '').trim();
                        reply = reply.replace(/\[HEARTBEAT:[\s\S]*?\]/gi, '').replace(/\[HEART:[\s\S]*?\]/gi, '').replace(/\[STICKER:[\s\S]*?\]/gi, '').trim();
                        if (reply) {
                            // [FIX-备注回复气泡] 使用postProcessReply拆分消息，遵循默认气泡规则
                            // 之前整条reply作为单条消息push，导致一长串文字挤在一个气泡里
                            let processedReply = reply;
                            if (typeof postProcessReply === 'function') {
                                const ppResult = postProcessReply(reply, contact);
                                processedReply = ppResult.reply;
                            }
                            const bubbles = processedReply.split('\n').filter(b => b.trim());
                            const baseTime = Date.now();
                            for (let bi = 0; bi < bubbles.length; bi++) {
                                store.chats[chatId].push({ sender: chatId, type: 'text', content: bubbles[bi].trim(), time: baseTime + bi * 100 });
                            }
                            contact.lastMsgTime = baseTime + (bubbles.length - 1) * 100;
                            save();
                            if (typeof activeChatId !== 'undefined' && activeChatId === chatId && typeof renderHistory === 'function') renderHistory();
                            if (typeof playNotificationSound === 'function') playNotificationSound(chatId);
                            return;
                        }
                    }
                } catch(e) {
                    console.warn('[remark] API回复失败:', e);
                }
                // [清理] API失败/不可用时不再伪造默认回复，直接失败
            }, 1500 + Math.random() * 2000);
        }

        // 分享联系人名片
        function openShareContactCard(contactId) {
            const c = store.contacts.find(x => x.id === contactId);
            if (!c) return;
            const otherContacts = store.contacts.filter(x => x.id !== contactId && !x.isGroup);
            if (otherContacts.length === 0) return toast('没有其他联系人可以分享');
            const modal = document.createElement('div');
            modal.className = 'modal-mask';
            modal.style.cssText = 'z-index:10002;display:flex;';
            modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
            let listHtml = otherContacts.map(oc => {
                const ocName = oc.remark || oc.name;
                return `<div class="cp-share-item" onclick="sendContactCard('${contactId}','${oc.id}');this.closest('.modal-mask').remove();">
                    <img src="${oc.avatar||_ph(40)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
                    <span>${typeof escapeHtml==='function'?escapeHtml(ocName):ocName}</span>
                </div>`;
            }).join('');
            modal.innerHTML = `<div class="modal-box"><h3>分享名片给</h3><div class="cp-share-list">${listHtml}</div>
                <div style="text-align:center;margin-top:12px;"><button onclick="this.closest('.modal-mask').remove()" style="padding:8px 20px;border:none;background:#f0f0f0;border-radius:8px;color:#666;">取消</button></div></div>`;
            document.getElementById('device').appendChild(modal);
        }

        function sendContactCard(sharedContactId, targetChatId) {
            const shared = store.contacts.find(x => x.id === sharedContactId);
            if (!shared) return;
            if (!store.chats[targetChatId]) store.chats[targetChatId] = [];
            store.chats[targetChatId].push({
                sender: 'me', type: 'contact_card',
                content: JSON.stringify({ id: shared.id, name: shared.name, avatar: shared.avatar, signature: shared.signature || '', remark: shared.remark || '' }),
                time: Date.now()
            });
            save();
            if (activeChatId === targetChatId) renderHistory();
            toast('名片已发送');
            closeLayer('layer-contact-profile');
        }

        // AI动态修改联系人状态和备注（在特定情境下调用）
        // [FIX-副API路由] 统一使用API.chatCompletion并带scene='status'，支持副API场景路由
        async function aiUpdateContactStatus(contactId, context) {
            const c = store.contacts.find(x => x.id === contactId);
            if (!c || !c.persona) return;
            if (typeof API === 'undefined' || !API || typeof API.chatCompletion !== 'function') return;
            try {
                const prompt = `你是${c.name}，人设：${(c.persona||'').substring(0,200)}。
当前情境：${context || '日常'}。
请根据你的人设和当前情境，生成一个新的状态（2-6个字，如"在听歌"、"写作业中"、"想你了"等）。
只输出状态文字，不要其他内容。`;
                const data = await API.chatCompletion(
                    [{ role: 'user', content: prompt }],
                    { temperature: 0.9, scene: 'status', silent: true }
                );
                const result = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
                if (result && result.trim()) {
                    c.status = _cleanRemarkText(result.trim()).substring(0, 20);
                    if (!c.status) return;
                    save();
                    // [FIX-状态同步v3] 同步更新 _aiStatusCache，防止 _updateChatStatus 读到旧缓存覆盖新状态
                    try {
                        if (typeof _aiStatusCache !== 'undefined') {
                            _aiStatusCache[c.id] = { text: c.status, color: '#22c55e', time: Date.now() };
                        }
                    } catch(e) {}
                    _showContactChangePopup(c.remark || c.name, '修改了状态为', c.status);
                    // [FIX-状态同步] 刷新当前聊天顶栏的状态栏
                    if (typeof activeChatId !== 'undefined' && activeChatId === c.id
                        && typeof _updateChatStatus === 'function') {
                        try { _updateChatStatus(c); } catch(e) {}
                    }
                    // [FIX-状态同步v2] 刷新联系人列表，让名字下面的状态也同步更新
                    try { if (typeof renderContacts === 'function') renderContacts(); } catch(e) {}
                }
            } catch(e) { console.warn('[aiUpdateStatus]', e); }
        }

        async function aiUpdateContactRemarkForMe(contactId, context) {
            const c = store.contacts.find(x => x.id === contactId);
            if (!c || !c.persona) return;
            if (typeof API === 'undefined' || !API || typeof API.chatCompletion !== 'function') return;
            // [FIX-备注频率] 冷却期限制：30分钟内不重复改备注
            const lastUpdate = c._lastRemarkForMeUpdateTime || 0;
            if (Date.now() - lastUpdate < 30 * 60 * 1000) {
                console.log('[aiUpdateRemark] 冷却期内，跳过备注更新');
                return;
            }
            try {
                const prompt = `你是${c.name}，人设：${(c.persona||'').substring(0,200)}。
当前情境：${context || '日常'}。用户之前的备注是「${c.remarkForMe || '无'}」。
请根据你的人设和当前情境，生成一个你想给用户的新备注（1-8个字，如"小笨蛋"、"宝贝"、"死党"等）。
只输出备注文字，不要其他内容。`;
                const data = await API.chatCompletion(
                    [{ role: 'user', content: prompt }],
                    { temperature: 0.9, scene: 'status', silent: true }
                );
                const result = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
                if (result && result.trim()) {
                    const cleaned = _cleanRemarkText(result.trim()).substring(0, 15);
                    if (!cleaned || cleaned === c.remarkForMe) return;
                    c.remarkForMe = cleaned;
                    c._lastRemarkForMeUpdateTime = Date.now();
                    save();
                    _showContactChangePopup(c.remark || c.name, '修改对你的备注为', c.remarkForMe);
                    // [FIX-备注同步] 如果联系人个人主页正在显示，刷新它以反映新备注
                    try {
                        var _cpLayer = document.getElementById('layer-contact-profile');
                        if (_cpLayer && _cpLayer.classList.contains('show') && typeof openContactProfile === 'function') {
                            openContactProfile(c.id);
                        }
                    } catch(e) {}
                }
            } catch(e) { console.warn('[aiUpdateRemark]', e); }
        }

        // 弹窗通知（导出为全局函数供其他模块调用）
        // [FIX-弹窗符号] 使用_cleanRemarkText彻底清洗控制字符、零宽字符和孤立代理对，防止尾部出现奇怪符号
        window._showContactChangePopup = function(contactName, action, value) {
            const cleanVal = _cleanRemarkText(value || '');
            if (!cleanVal) return; // 清洗后为空则不显示，避免出现「」空内容弹窗
            const cleanName = _cleanRemarkText(contactName || '') || '对方';
            const popup = document.createElement('div');
            popup.className = 'cp-change-popup';
            popup.innerHTML = `<div class="cp-change-popup-inner"><i class="fas fa-bell"></i> <b>${typeof escapeHtml==='function'?escapeHtml(cleanName):cleanName}</b> ${action}「${typeof escapeHtml==='function'?escapeHtml(cleanVal):cleanVal}」</div>`;
            document.getElementById('device').appendChild(popup);
            setTimeout(() => { popup.classList.add('cp-change-popup-show'); }, 10);
            setTimeout(() => { popup.classList.remove('cp-change-popup-show'); setTimeout(() => popup.remove(), 400); }, 3500);
        };
        // 保持局部引用兼容
        const _showContactChangePopup = window._showContactChangePopup;
        
        // ===== QQ风格可折叠分组联系人列表 =====
        var _contactGroupCollapseState = {}; // 内存中的折叠状态缓存
        var _isContactSearchActive = false;

        // 创建单个联系人列表项（复用逻辑）
        function _createContactItem(c) {
                const item = document.createElement('div');
                item.className = 'list-item';
                if (c.pinned) item.style.background = '#f0f0ff';

                // [FIX-iOS点击卡顿-2026-05-12] 使用fast-tap模式替代onclick
                // iOS的click事件在touchend后有~80-300ms延迟（即使有touch-action:manipulation）
                // 改用touchend直接触发openChat，消除点击延迟感
                var _itemTouchStartTime = 0;
                var _itemTouchMoved = false;
                item.ontouchstart = (e) => {
                    _itemTouchStartTime = Date.now();
                    _itemTouchMoved = false;
                    handleContactTouchStart(c.id, e);
                };
                item.ontouchmove = (e) => {
                    _itemTouchMoved = true;
                    handleContactTouchMove(e);
                };
                item.ontouchend = (e) => {
                    handleContactTouchEnd(e);
                    // fast-tap: 短按且未滑动 → 立即触发openChat
                    var elapsed = Date.now() - _itemTouchStartTime;
                    if (!_itemTouchMoved && elapsed < 300 && !isLongPress && !_blockLongPress) {
                        e.preventDefault(); // 阻止后续click事件（避免双重触发）
                        openChat(c.id);
                    }
                };
                // 桌面端保留click兜底
                item.onclick = (e) => {
                    // 如果已经通过touchend触发了，跳过
                    if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
                    if (!isLongPress) openChat(c.id);
                };
                item.onmousedown = (e) => handleContactMouseDown(c.id, e);
                item.onmouseup = handleContactMouseUp;
                item.oncontextmenu = (e) => e.preventDefault();

                // Avatar wrapper (for unread badge positioning)
                const avatarWrap = document.createElement('div');
                avatarWrap.style.cssText = 'position:relative; flex-shrink:0;';
                const avatar = document.createElement('img');
                avatar.src = c.avatar;
                avatar.className = 'avatar';
                // [FIX-头像显示] 微信内置浏览器图片加载失败时回退到文字头像
                avatar.onerror = function() {
                    this.onerror = null;
                    this.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent((c.name||'?')[0]) + '&background=random&size=80';
                };
                avatarWrap.appendChild(avatar);
                // 未读消息红点
                const unread = c.unreadCount || 0;
                if (unread > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'unread-badge';
                    badge.textContent = unread > 99 ? '99+' : unread;
                    avatarWrap.appendChild(badge);
                }
                item.appendChild(avatarWrap);

                // Content
                const content = document.createElement('div');
                content.className = 'list-content';

                // Title
                const title = document.createElement('div');
                title.className = 'list-title';
                title.style.cssText = 'display:flex; align-items:center; gap:8px;';
                
                // Use textContent for security and performance - 显示备注优先
                const nameSpan = document.createElement('span');
                nameSpan.textContent = c.remark || c.name;
                title.appendChild(nameSpan);

                if (c.isGroup) title.innerHTML += '<i class="fas fa-users" style="font-size:12px; color:#999;"></i>';
                if (c.pinned) title.innerHTML += '<i class="fas fa-thumbtack" style="font-size:12px; color:#ccc; margin-left:auto;"></i>';
                
                content.appendChild(title);

                // [FIX-状态同步v2] 联系人列表名字下方显示当前状态（非群聊且有状态时）
                if (!c.isGroup && c.status && typeof c.status === 'string' && c.status.trim() && c.status.trim().length >= 2) {
                    const statusLine = document.createElement('div');
                    statusLine.className = 'list-contact-status';
                    statusLine.style.cssText = 'font-size:11px; color:#10b981; margin-top:1px; display:flex; align-items:center; gap:3px; line-height:1.3; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;';
                    statusLine.innerHTML = '<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#10b981;flex-shrink:0;box-shadow:0 0 3px #10b981;"></span>' + (typeof escapeHtml === 'function' ? escapeHtml(c.status.trim()) : c.status.trim());
                    content.appendChild(statusLine);
                }

                // Subtitle
                // [PERF-返回卡顿] 优化：优先使用缓存的lastMsgText，避免每次遍历store.chats大数组
                let subText;
                const isReadPartner = store.readState && store.readState.active && store.readState.partnerId === c.id;
                if (isReadPartner) {
                    const rBook = (store.books || []).find(b => b.id === store.readState.bookId);
                    const rTotalLen = rBook ? (rBook.content || '').length : 0;
                    const rProgress = rBook && store.bookProgress ? (store.bookProgress[rBook.id] || 0) : 0;
                    const rPct = rTotalLen > 0 ? Math.round((rProgress / rTotalLen) * 100) : 0;
                    subText = '📖 一起读《' + (rBook ? rBook.name : '...') + '》' + (rPct > 0 ? ' ' + rPct + '%' : '');
                } else if (c._lastMsgText) {
                    // 使用缓存的最后消息文本（由_syncContactLastMsg维护）
                    subText = c._lastMsgText;
                } else {
                    // 回退：从store.chats取最后一条（仅在缓存未建立时）
                    const chatHistory = store.chats[c.id];
                    if (chatHistory && chatHistory.length > 0) {
                        subText = getMsgText(chatHistory[chatHistory.length - 1]);
                        c._lastMsgText = subText; // 顺便缓存
                        c.lastMsgTime = chatHistory[chatHistory.length - 1].time || c.lastMsgTime;
                    } else {
                        subText = c.isGroup ? `群聊` : (c.persona || '');
                    }
                }
                const sub = document.createElement('div');
                sub.className = 'list-sub';
                if (isReadPartner) sub.style.color = 'var(--primary)';
                sub.textContent = subText.substring(0, 22) + (subText.length > 22 ? '...' : '');
                content.appendChild(sub);

                item.appendChild(content);
                return item;
        }

        // 排序联系人（分组内排序）
        function _sortContacts(contacts) {
            return [...contacts].sort((a, b) => {
                if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                const lastMsgTimeA = a.lastMsgTime || 0;
                const lastMsgTimeB = b.lastMsgTime || 0;
                if (lastMsgTimeA !== lastMsgTimeB) return lastMsgTimeB - lastMsgTimeA;
                if (a.isGroup !== b.isGroup) return a.isGroup ? -1 : 1;
                return 0;
            });
        }

        // 渲染一个分组区域（Header + 联系人列表）
        function _renderGroupSection(fragment, groupId, groupName, contacts, isCollapsed) {
            const unreadTotal = contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

            // 分组Header
            const header = document.createElement('div');
            header.className = 'cg-header' + (isCollapsed ? ' cg-collapsed' : '');
            header.innerHTML = `
                <i class="fas fa-chevron-${isCollapsed ? 'right' : 'down'} cg-arrow"></i>
                <span class="cg-name">${groupName}</span>
                <span class="cg-count">${isCollapsed ? contacts.length : contacts.length}</span>
                ${unreadTotal > 0 ? '<span class="cg-unread">' + (unreadTotal > 99 ? '99+' : unreadTotal) + '</span>' : ''}
            `;
            header.onclick = (e) => { e.stopPropagation(); toggleGroupCollapse(groupId); };
            // 长按/右键可改名（仅非默认分组）
            if (groupId !== '__ungrouped__') {
                let _ghLongTimer = null;
                header.oncontextmenu = (e) => { e.preventDefault(); _showGroupRenameMenu(groupId, groupName, e); };
                header.ontouchstart = (e) => {
                    _ghLongTimer = setTimeout(() => { _showGroupRenameMenu(groupId, groupName, e); }, 600);
                };
                header.ontouchend = () => { clearTimeout(_ghLongTimer); };
                header.ontouchmove = () => { clearTimeout(_ghLongTimer); };
            }
            fragment.appendChild(header);

            // 分组内联系人（折叠时隐藏）
            if (!isCollapsed) {
                // [FIX-分组白色遮罩] 用容器包裹，与cg-header统一视觉层级
                const groupBody = document.createElement('div');
                groupBody.className = 'cg-body';
                const sorted = _sortContacts(contacts);
                sorted.forEach(c => {
                    groupBody.appendChild(_createContactItem(c));
                });
                fragment.appendChild(groupBody);
            }
        }

        function renderContacts() {
            // [PERF] 每次渲染联系人列表时重建联系人Map缓存
            if (typeof _buildContactMap === 'function' && store.contacts) {
                _buildContactMap(store.contacts);
            }
            const list = document.getElementById('contact-list');
            list.innerHTML = ''; // Clear previous content

            // === 渲染置顶消息区域 - 微信风格横幅 ===
            if (store.pinnedMsgs && store.pinnedMsgs.length > 0) {
                const pinnedContainer = document.createElement('div');
                pinnedContainer.className = 'pinned-msgs-container';
                store.pinnedMsgs.forEach(p => {
                    const pinnedItem = document.createElement('div');
                    pinnedItem.className = 'pinned-msg-item';
                    pinnedItem.onclick = () => { openChat(p.chatId); };
                    const displayContent = (p.content || '').substring(0, 40) + ((p.content || '').length > 40 ? '...' : '');
                    pinnedItem.innerHTML = `
                        <div class="pinned-msg-icon"><i class="fas fa-thumbtack"></i></div>
                        <div class="pinned-msg-body">
                            <div class="pinned-msg-text">${displayContent}</div>
                        </div>
                        <div class="pinned-msg-close" onclick="event.stopPropagation(); unpinMsg(${p.id})"><i class="fas fa-times"></i></div>
                    `;
                    pinnedContainer.appendChild(pinnedItem);
                });
                list.appendChild(pinnedContainer);
            }

            // Use a DocumentFragment for batch appending to improve performance
            const fragment = document.createDocumentFragment();

            const groups = store.contactGroups || [];
            const hasGroups = groups.length > 0;

            if (!hasGroups) {
                // === 无分组模式：保持原有扁平列表兼容 ===
                const sorted = _sortContacts(store.contacts);
                sorted.forEach(c => {
                    fragment.appendChild(_createContactItem(c));
                });
            } else {
                // === QQ风格分组模式 ===
                // 1. 收集已分组的联系人ID
                const assignedIds = new Set();
                groups.forEach(g => (g.contactIds || []).forEach(id => assignedIds.add(id)));

                // 2. 找出未分组的联系人
                const ungrouped = store.contacts.filter(c => !assignedIds.has(c.id));

                // 3. 初始化折叠状态（从store持久化或内存缓存读取）
                groups.forEach(g => {
                    if (_contactGroupCollapseState[g.id] === undefined) {
                        _contactGroupCollapseState[g.id] = g.collapsed || false;
                    }
                });
                if (_contactGroupCollapseState['__ungrouped__'] === undefined) {
                    _contactGroupCollapseState['__ungrouped__'] = false;
                }

                // 4. 渲染各自定义分组
                groups.forEach(g => {
                    const members = (g.contactIds || [])
                        .map(cid => store.contacts.find(x => x.id === cid))
                        .filter(Boolean);
                    const isCollapsed = _contactGroupCollapseState[g.id] || false;
                    _renderGroupSection(fragment, g.id, g.name, members, isCollapsed);
                });

                // 5. 渲染"未分组"（放在最后）
                if (ungrouped.length > 0) {
                    const isCollapsed = _contactGroupCollapseState['__ungrouped__'] || false;
                    _renderGroupSection(fragment, '__ungrouped__', '未分组联系人', ungrouped, isCollapsed);
                }

                // 6. 底部"管理分组"入口
                const manageBtn = document.createElement('div');
                manageBtn.className = 'cg-manage-btn';
                manageBtn.innerHTML = '<i class="fas fa-cog" style="margin-right:6px;"></i>管理分组';
                manageBtn.onclick = () => { if (typeof openContactGroups === 'function') openContactGroups(); };
                fragment.appendChild(manageBtn);
            }

            list.appendChild(fragment);
        }

        // 折叠/展开分组
        function toggleGroupCollapse(groupId) {
            const current = _contactGroupCollapseState[groupId] || false;
            _contactGroupCollapseState[groupId] = !current;
            // 持久化到store.contactGroups
            if (groupId !== '__ungrouped__' && store.contactGroups) {
                const g = store.contactGroups.find(x => x.id === groupId);
                if (g) { g.collapsed = !current; save(); }
            }
            renderContacts();
        }

        // 分组改名菜单
        function _showGroupRenameMenu(groupId, currentName, e) {
            // 使用简单prompt输入
            const newName = prompt('修改分组名称', currentName);
            if (newName && newName.trim() && newName.trim() !== currentName) {
                const g = (store.contactGroups || []).find(x => x.id === groupId);
                if (g) {
                    g.name = newName.trim();
                    save();
                    renderContacts();
                    if (typeof renderContactGroups === 'function') renderContactGroups();
                    toast('分组已重命名', 'success');
                }
            }
        }

        // 搜索相关函数
        function toggleContactSearch() {
            _isContactSearchActive = !_isContactSearchActive;
            const bar = document.getElementById('contact-search-bar');
            const contactList = document.getElementById('contact-list');
            if (_isContactSearchActive) {
                bar.style.display = 'block';
                contactList.style.paddingTop = '100px'; // 为搜索栏腾出空间
                setTimeout(() => { document.getElementById('contact-search-input').focus(); }, 100);
            } else {
                bar.style.display = 'none';
                contactList.style.paddingTop = '56px';
                clearContactSearch();
            }
        }

        function clearContactSearch() {
            const input = document.getElementById('contact-search-input');
            const results = document.getElementById('contact-search-results');
            if (input) input.value = '';
            if (results) results.innerHTML = '';
            // 恢复主列表显示
            const contactList = document.getElementById('contact-list');
            if (contactList) contactList.style.display = '';
        }

        function filterContactsBySearch(keyword) {
            const results = document.getElementById('contact-search-results');
            const contactList = document.getElementById('contact-list');
            if (!keyword || !keyword.trim()) {
                results.innerHTML = '';
                if (contactList) contactList.style.display = '';
                return;
            }

            const kw = keyword.toLowerCase().trim();
            const matched = (store.contacts || []).filter(c => {
                return (c.name || '').toLowerCase().includes(kw)
                    || (c.remark || '').toLowerCase().includes(kw)
                    || (c.persona || '').toLowerCase().includes(kw)
                    || (c.signature || '').toLowerCase().includes(kw);
            });

            // 隐藏主列表，只显示搜索结果
            if (contactList) contactList.style.display = 'none';

            if (matched.length === 0) {
                results.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#999;"><i class="fas fa-search" style="font-size:32px;display:block;margin-bottom:10px;opacity:0.3;"></i>未找到匹配的联系人</div>';
                return;
            }

            // 按分组归类搜索结果
            const groups = store.contactGroups || [];
            let html = '';
            matched.forEach(c => {
                // 找到联系人所在的分组名
                let groupLabel = '';
                for (const g of groups) {
                    if ((g.contactIds || []).includes(c.id)) {
                        groupLabel = g.name;
                        break;
                    }
                }
                const displayName = typeof escapeHtml === 'function' ? escapeHtml(c.remark || c.name) : (c.remark || c.name);
                const subInfo = c.signature || (c.persona ? c.persona.substring(0, 30) : '') || '';
                html += `<div class="list-item" onclick="clearContactSearch();toggleContactSearch();openChat('${c.id}');" style="cursor:pointer;">
                    <img src="${c.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent((c.name||'?')[0]) + '&background=random&size=80'}" class="avatar" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${encodeURIComponent((c.name||'?')[0])}&background=random&size=80';">
                    <div class="list-content">
                        <div class="list-title" style="display:flex;align-items:center;gap:6px;">
                            <span>${displayName}</span>
                            ${c.isGroup ? '<i class="fas fa-users" style="font-size:11px;color:#999;"></i>' : ''}
                            ${groupLabel ? '<span style="font-size:10px;color:#999;background:#f0f0f0;padding:1px 6px;border-radius:3px;margin-left:auto;">' + groupLabel + '</span>' : ''}
                        </div>
                        <div class="list-sub">${subInfo.substring(0, 30)}</div>
                    </div>
                </div>`;
            });
            results.innerHTML = html;
        }

        // --- GROUP CHAT ---
        function gotoAddGroup() {
            const layer = document.getElementById('layer-add-group');
            const list = document.getElementById('add-group-contact-list');
            
            const availableContacts = store.contacts.filter(c => !c.isGroup);
            
            selectedGroupContacts.clear();
            list.innerHTML = '';

            // [PERF-2026-04-22] 先拼接完整HTML再一次性写入，避免N次innerHTML+=导致N次重解析
            var _groupListHtml = '';
            availableContacts.forEach(c => {
                _groupListHtml += `
                    <div class="list-item" onclick="toggleGroupContactSelect(this, '${c.id}')">
                        <div style="width:24px; height:24px; border:1px solid #ccc; border-radius:4px; margin-right:15px; display:flex; justify-content:center; align-items:center;" class="checkbox-icon">
                            <i class="fas fa-check" style="color:var(--primary); display:none;"></i>
                        </div>
                        <img src="${c.avatar}" class="avatar">
                        <div class="list-content">
                            <div class="list-title">${c.name}</div>
                        </div>
                    </div>
                `;
            });
            list.innerHTML = _groupListHtml;
            
            layer.classList.add('show');
            document.getElementById('wx-add-menu').style.display = 'none';
        }

        function toggleGroupContactSelect(el, contactId) {
            const checkbox = el.querySelector('.checkbox-icon i');
            if (selectedGroupContacts.has(contactId)) {
                selectedGroupContacts.delete(contactId);
                checkbox.style.display = 'none';
                el.style.background = '#fff';
            } else {
                selectedGroupContacts.add(contactId);
                checkbox.style.display = 'block';
                el.style.background = '#f7f7f7';
            }
        }

        function gotoGroupSetup() {
            if (selectedGroupContacts.size < 1) {
                return toast("请至少选择一位联系人");
            }
            // Show selected members on setup page
            const memberIds = Array.from(selectedGroupContacts);
            const members = store.contacts.filter(c => memberIds.includes(c.id));
            const membersDiv = document.getElementById('group-setup-members');
            membersDiv.innerHTML = members.map(c => `
                <div style="display:flex; flex-direction:column; align-items:center; width:60px;">
                    <img src="${c.avatar}" style="width:40px; height:40px; border-radius:8px; object-fit:cover;">
                    <span style="font-size:11px; color:#666; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:60px;">${c.name}</span>
                </div>
            `).join('');
            // Reset group setup fields
            document.getElementById('new-group-name').value = '';
            const avatarImg = document.getElementById('new-group-avatar-img');
            avatarImg.style.display = 'none';
            avatarImg.src = '';
            document.getElementById('layer-group-setup').classList.add('show');
        }

        function confirmCreateGroup() {
            if (selectedGroupContacts.size < 1) {
                return toast("请至少选择一位联系人");
            }

            const memberIds = Array.from(selectedGroupContacts);
            const members = store.contacts.filter(c => memberIds.includes(c.id));
            const inputName = document.getElementById('new-group-name').value.trim();
            const groupName = inputName || `群聊 (${members.length + 1})`;
            const avatarImg = document.getElementById('new-group-avatar-img');
            const groupAvatar = (avatarImg.style.display !== 'none' && avatarImg.src) 
                ? avatarImg.src 
                : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(groupName.charAt(0)) + '&background=random&color=fff';

            const newGroup = {
                id: 'g' + Date.now(),
                name: groupName,
                avatar: groupAvatar,
                isGroup: true,
                members: memberIds,
                settings: {
                     historyInteroperability: false,
                     enablePerception: true,
                     memoryInterop: true,
                }
            };

            store.contacts.unshift(newGroup);
            save();
            renderContacts();
            closeLayer('layer-group-setup');
            closeLayer('layer-add-group');
            openChat(newGroup.id);
        }

        // --- CONTACT LONG PRESS ---
        function handleContactTouchStart(cid, e) {
            isLongPress = false;
            selectedContactId = cid;
            longPressTimer = setTimeout(() => { 
                isLongPress = true; 
                showContactMenu(e.touches[0].clientX, e.touches[0].clientY); 
            }, 500);
        }
        function handleContactTouchEnd() {
            clearTimeout(longPressTimer);
        }
        function handleContactTouchMove() {
            clearTimeout(longPressTimer);
        }
        function handleContactMouseDown(cid, e) {
            if(e.button !== 0) return; 
            isLongPress = false;
            selectedContactId = cid;
            clearTimeout(longPressTimer); // Prevent multiple timers
            longPressTimer = setTimeout(() => { 
                isLongPress = true; 
                showContactMenu(e.clientX, e.clientY); 
            }, 500);
        }
        function handleContactMouseUp() { 
            clearTimeout(longPressTimer);
        }
        
        function showContactMenu(x, y) {
            const menu = document.getElementById('contact-menu');
            const c = store.contacts.find(x=>x.id===selectedContactId);
            if(!c) return;
            
            document.getElementById('cm-pin').innerText = c.pinned ? "取消置顶" : "置顶聊天";
            
            menu.style.display = 'flex';
            
            // Measure first
            menu.style.visibility = 'hidden';
            menu.style.display = 'flex';
            const rect = menu.getBoundingClientRect();
            menu.style.visibility = 'visible';

            let finalX = x;
            let finalY = y;

            if (finalX + rect.width > window.innerWidth) {
                finalX = window.innerWidth - rect.width - 10;
            }
            if (finalX < 10) finalX = 10;

            if (finalY + rect.height > window.innerHeight) {
                finalY = window.innerHeight - rect.height - 10;
            }

            menu.style.left = finalX + 'px';
            menu.style.top = finalY + 'px';
        }
        
        function pinContact() {
            const c = store.contacts.find(x=>x.id===selectedContactId);
            if(c) {
                c.pinned = !c.pinned;
                save(); renderContacts();
                document.getElementById('contact-menu').style.display='none';
                isLongPress = false; // [FIX] 菜单操作后重置长按标记
            }
        }
        
        function deleteContact() {
            const contact = store.contacts.find(x => x.id === selectedContactId);
            if (!contact) return;
            document.getElementById('contact-menu').style.display = 'none';
            isLongPress = false; // [FIX] 菜单操作后重置长按标记
            showConfirm(
                `删除联系人`, 
                `确定要删除联系人 "${contact.name}" 吗？所有相关数据都将被清除。`,
                () => thoroughDeleteContact(selectedContactId)
            );
        }

        // --- 用户人设选择器（带头像+名字+备注） ---
        var _personaPlaceholderAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAARklEQVRoge3PQQ0AIAzAMPz/0VyxIsmCbtJ7pmf2dLwewJ+MhIyEjISMhIyEjISMhIyEjISMhIyEjISMhIyEjISMhIyE3gMYQAQydUQcqAAAAABJRU5ErkJggg==';
        function openUserPersonaSelector() {
            const currentVal = document.getElementById('edit-c-up')?.value || '';
            let listHtml = store.personas.map(p => {
                const isSelected = p.id === currentVal;
                const avatar = p.avatar || store.user.avatar || _personaPlaceholderAvatar;
                return `<div onclick="selectUserPersona('${p.id}')" class="ps-item ${isSelected ? 'active' : ''}">
                    <img class="ps-avatar" src="${avatar}" onerror="this.src='${_personaPlaceholderAvatar}'">
                    <div class="ps-info">
                        <div class="ps-name">${p.name}${isSelected ? ' <i class="fas fa-check"></i>' : ''}</div>
                        ${p.note ? '<div class="ps-note">' + p.note + '</div>' : ''}
                    </div>
                </div>`;
            }).join('');
            const mask = document.createElement('div');
            mask.id = 'persona-selector-mask';
            mask.className = 'ps-mask';
            mask.innerHTML = `<div class="ps-card">
                <div class="ps-head">
                    <div class="ps-title">选择身份</div>
                    <div class="ps-close" onclick="document.getElementById('persona-selector-mask')?.remove()"><i class="fas fa-times"></i></div>
                </div>
                <div class="ps-list">${listHtml || '<div class="ps-empty">暂无人设数据</div>'}</div>
            </div>`;
            mask.addEventListener('click', function(e) { if (e.target === mask) mask.remove(); });
            document.body.appendChild(mask);
        }

        function selectUserPersona(personaId) {
            const hiddenInput = document.getElementById('edit-c-up');
            if (hiddenInput) hiddenInput.value = personaId;
            const persona = store.personas.find(p => p.id === personaId);
            const displayEl = document.getElementById('user-persona-display');
            if (displayEl && persona) {
                const avatar = persona.avatar || store.user.avatar || _personaPlaceholderAvatar;
                displayEl.innerHTML = `<img src="${avatar}" style="width:32px; height:32px; border-radius:var(--avatar-radius, 8px); object-fit:cover; border:1px solid #eee;"><div style="text-align:right; line-height:1.3;"><div style="font-size:14px; color:#333;">${persona.name}</div>${persona.note ? '<div style="font-size:11px; color:#999;">' + persona.note + '</div>' : ''}</div>`;
            }
            document.getElementById('persona-selector-mask')?.remove();
        }

        // --- MSG LONG PRESS & MENU ---
        function openWorldBookSelector(skipInit) {
            const c = store.contacts.find(x => x.id === activeChatId);
            if (!c) return;

            const modal = document.getElementById('modal-wb-select');
            const listEl = document.getElementById('wb-select-list');
            const allWbs = store.worldbooks || [];
            
            // Initialize temp selection from stored settings (only on first open, not re-render)
            if (!skipInit) {
                tempSelectedWbIds = c.settings.mountedWbIds ? [...c.settings.mountedWbIds] : [];
                // For backward compatibility, if single wb is set, add it to the list
                if (c.settings.wb && !tempSelectedWbIds.includes(c.settings.wb)) {
                    tempSelectedWbIds.push(c.settings.wb);
                }
                // 保存原始选择，取消时恢复
                originalSelectedWbIds = [...tempSelectedWbIds];
            }

            if (allWbs.length === 0) {
                listEl.innerHTML = '<div style="text-align:center;padding:30px 20px;">' +
                    '<div style="font-size:14px;color:#999;margin-bottom:14px;">还没有世界书</div>' +
                    '<button onclick="document.getElementById(\'modal-wb-select\').style.display=\'none\'; if(typeof openApp===\'function\') openApp(\'worldbook\');" style="padding:8px 20px;background:#333;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">去创建世界书</button>' +
                '</div>';
                modal.style.display = 'flex';
                return;
            }

            // Group by category
            const categories = store.categories || [];
            const grouped = {};
            const uncategorized = [];
            allWbs.forEach(wb => {
                if (wb.cate && categories.includes(wb.cate)) {
                    if (!grouped[wb.cate]) grouped[wb.cate] = [];
                    grouped[wb.cate].push(wb);
                } else {
                    uncategorized.push(wb);
                }
            });

            // [FIX-全局世界书显示] 获取全局挂载的世界书ID [全局挂载范围] 按当前联系人精细过滤
            const _editingContactId = (typeof editingContactId !== 'undefined' && editingContactId) ? editingContactId : (typeof activeChatId !== 'undefined' ? activeChatId : '');
            const globalWbIds = (typeof getActiveGlobalWbIds === 'function' && _editingContactId)
                ? getActiveGlobalWbIds(_editingContactId)
                : (store.globalWbIds || []);

            // Global select all
            const allSelected = allWbs.every(wb => tempSelectedWbIds.some(id => String(id) === String(wb.id)));
            let html = '';
            
            // [FIX-全局世界书显示] 如果有全局挂载的世界书，显示提示
            if (globalWbIds.length > 0) {
                html += `<div style="padding:8px 12px; margin-bottom:8px; background:#fff8e1; border:1px solid #ffe082; border-radius:6px; font-size:12px; color:#f57f17; line-height:1.5;">
                    <i class="fas fa-globe" style="margin-right:4px;"></i> 标有 <span style="color:#ff9800; font-weight:bold;">🌐全局</span> 的世界书已在世界书管理中设为全局应用，无需在此单独勾选也会自动生效。
                </div>`;
            }
            
            html += `<div onclick="toggleWbSelectAll(this)" class="sticker-select-item" style="padding:10px; border:1px solid ${allSelected ? '#07c160' : '#ddd'}; border-radius:6px; cursor:pointer; background:${allSelected ? '#f0fff4' : '#f9f9f9'}; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-weight:bold;">
                <span>全选所有世界书</span>
                ${allSelected ? '<i class="fas fa-check" style="color:#07c160;"></i>' : ''}
            </div>`;

            // Render each category group
            categories.forEach(cateName => {
                const wbs = grouped[cateName];
                if (!wbs || wbs.length === 0) return;
                const cateAllSelected = wbs.every(wb => tempSelectedWbIds.some(id => String(id) === String(wb.id)));
                html += `<div style="margin-top:8px;">
                    <div onclick="toggleWbSelectCategory(this, '${cateName}')" class="sticker-select-item" style="padding:8px 10px; border:1px solid ${cateAllSelected ? '#07c160' : '#ccc'}; border-radius:6px; cursor:pointer; background:${cateAllSelected ? '#f0fff4' : '#f5f5f5'}; display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span style="font-weight:bold; color:#555;"><i class="fas fa-folder" style="margin-right:6px; color:#f0ad4e;"></i>${cateName} (${wbs.length})</span>
                        ${cateAllSelected ? '<i class="fas fa-check-double" style="color:#07c160;"></i>' : '<span style="font-size:12px; color:#999;">全选分类</span>'}
                    </div>`;
                wbs.forEach(wb => {
                    const isSelected = tempSelectedWbIds.some(id => String(id) === String(wb.id));
                    const isGlobal = globalWbIds.some(id => String(id) === String(wb.id));
                    html += `<div onclick="toggleWbSelect(this, '${wb.id}')" class="sticker-select-item" style="padding:10px 10px 10px 28px; border:1px solid ${isSelected ? '#07c160' : isGlobal ? '#ff9800' : '#ddd'}; border-radius:6px; cursor:pointer; background:${isGlobal && !isSelected ? '#fff8e1' : '#fff'}; display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span>${wb.name}${isGlobal ? ' <span style="font-size:11px; color:#ff9800; font-weight:bold;">🌐全局</span>' : ''}</span>
                        ${isSelected ? '<i class="fas fa-check" style="color:#07c160;"></i>' : isGlobal ? '<i class="fas fa-globe" style="color:#ff9800;"></i>' : ''}
                    </div>`;
                });
                html += `</div>`;
            });

            // Uncategorized
            if (uncategorized.length > 0) {
                if (categories.length > 0) {
                    html += `<div style="margin-top:8px; padding:4px 0; font-size:12px; color:#999; border-top:1px solid #eee;">未分类</div>`;
                }
                uncategorized.forEach(wb => {
                    const isSelected = tempSelectedWbIds.some(id => String(id) === String(wb.id));
                    const isGlobal = globalWbIds.some(id => String(id) === String(wb.id));
                    html += `<div onclick="toggleWbSelect(this, '${wb.id}')" class="sticker-select-item" style="padding:10px; border:1px solid ${isSelected ? '#07c160' : isGlobal ? '#ff9800' : '#ddd'}; border-radius:6px; cursor:pointer; background:${isGlobal && !isSelected ? '#fff8e1' : '#fff'}; display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span>${wb.name}${isGlobal ? ' <span style="font-size:11px; color:#ff9800; font-weight:bold;">🌐全局</span>' : ''}</span>
                        ${isSelected ? '<i class="fas fa-check" style="color:#07c160;"></i>' : isGlobal ? '<i class="fas fa-globe" style="color:#ff9800;"></i>' : ''}
                    </div>`;
                });
            }

            listEl.innerHTML = html;
            modal.style.display = 'flex';
        }

        function toggleWbSelect(el, wbId) {
            // 统一类型：移除匹配的ID（兼容string/number）
            const index = tempSelectedWbIds.findIndex(id => String(id) === String(wbId));
            if (index > -1) {
                tempSelectedWbIds.splice(index, 1);
            } else {
                tempSelectedWbIds.push(wbId);
            }
            // Re-render to update all checkmarks (global, category, individual)
            openWorldBookSelector(true);
        }

        function toggleWbSelectCategory(el, cateName) {
            const allWbs = store.worldbooks || [];
            const cateWbs = allWbs.filter(wb => wb.cate === cateName);
            const allSelected = cateWbs.every(wb => tempSelectedWbIds.some(id => String(id) === String(wb.id)));
            if (allSelected) {
                // Deselect all in this category
                cateWbs.forEach(wb => {
                    const idx = tempSelectedWbIds.findIndex(id => String(id) === String(wb.id));
                    if (idx > -1) tempSelectedWbIds.splice(idx, 1);
                });
            } else {
                // Select all in this category
                cateWbs.forEach(wb => {
                    if (!tempSelectedWbIds.some(id => String(id) === String(wb.id))) tempSelectedWbIds.push(wb.id);
                });
            }
            openWorldBookSelector(true);
        }

        function toggleWbSelectAll(el) {
            const allWbs = store.worldbooks || [];
            const allSelected = allWbs.every(wb => tempSelectedWbIds.some(id => String(id) === String(wb.id)));
            if (allSelected) {
                tempSelectedWbIds = [];
            } else {
                tempSelectedWbIds = allWbs.map(wb => wb.id);
            }
            openWorldBookSelector(true);
        }

        function saveChatWBSelection() {
            const c = store.contacts.find(x => x.id === activeChatId);
            if (c) {
                if (!c.settings) c.settings = {};
                c.settings.mountedWbIds = [...tempSelectedWbIds];
                c.settings.wb = ''; // Deprecate the old single selection
                save();
                // Force immediate save for critical setting to prevent data loss on refresh
                idb.set('AIChatOS_v8', store).catch(console.error);
                try {
                    localStorage.setItem('AIChatOS_v8_Core', JSON.stringify({
                        user: store.user,
                        theme: store.theme,
                        system: store.system,
                        contactsSettings: store.contacts.map(con => ({id: con.id, settings: con.settings, pinned: con.pinned}))
                    }));
                } catch(e) {}
                
                // [FIX-世界书挂载数量显示] 延迟重新渲染，确保数据已保存
                setTimeout(() => {
                    // [FIX-线下模式打字跳转v3] 线下模式（嵌入式+独立页面）挂载世界书后不打开聊天设置界面
                    // 否则layer-chat-settings会残留show状态，键盘弹出时z-index层级冲突导致跳转到聊天设置界面
                    // v3: 增加offlineContactId检测，覆盖独立页面线下模式（isOfflineInChat仅在嵌入式模式为true）
                    const _isAnyOfflineMode = (typeof isOfflineInChat !== 'undefined' && isOfflineInChat) ||
                        (typeof offlineContactId !== 'undefined' && offlineContactId);
                    if (_isAnyOfflineMode) {
                        // 强制移除layer-chat-settings的show状态，防止键盘弹起时z-index层级冲突
                        const _chatSettingsLayer = document.getElementById('layer-chat-settings');
                        if (_chatSettingsLayer) _chatSettingsLayer.classList.remove('show');
                        const offSettingsModal = document.getElementById('modal-offline-settings');
                        if (offSettingsModal) offSettingsModal.classList.add('show');
                        const _offWbCountEl = document.getElementById('offline-wb-count');
                        if (_offWbCountEl) {
                            // [FIX-世界书数量] 只计算实际存在的世界书
                            const _existWbIds = (store.worldbooks || []).map(wb => String(wb.id));
                            const _validCount = c.settings.mountedWbIds ? c.settings.mountedWbIds.filter(wid => _existWbIds.includes(String(wid))).length : 0;
                            _offWbCountEl.textContent = _validCount + '个';
                        }
                    } else {
                        openChatSettings(); // Re-render settings to show new count
                    }
                    toast("挂载成功");
                }, 50);
            }
            document.getElementById('modal-wb-select').style.display = 'none';
        }

        // [FIX-长按v3] 记录触摸起始坐标，用于touchmove容差判断
        var _msgTouchStartX = 0, _msgTouchStartY = 0;
        // [FIX-长按v4] 缓存最后触摸坐标，防止e.touches在setTimeout回调时已被释放
        var _msgLastTouchX = 0, _msgLastTouchY = 0;
        function handleMsgTouchStart(idx, e) {
            isLongPress = false;
            // 移除这里的 toggleSelectMsg，改为 click 处理
            // 仅保留长按菜单检测
            if(isMultiSelect) return;

            // [FIX-长按v3] 不再在touchstart时preventDefault，改为仅在长按触发后阻止
            // 原来的preventDefault会阻止聊天区域滚动（Bug5），导致长消息划不动
            // 原生长按菜单已通过bubble的contextmenu事件阻止（app-part1.js:14284）

            // [FIX-长按v3] 记录触摸起始坐标
            if (e.touches && e.touches[0]) {
                _msgTouchStartX = e.touches[0].clientX;
                _msgTouchStartY = e.touches[0].clientY;
                // [FIX-长按v4] 缓存坐标，setTimeout回调中e.touches可能已释放
                _msgLastTouchX = e.touches[0].clientX;
                _msgLastTouchY = e.touches[0].clientY;
            }

            selectedMsgIdx = idx;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                // [FIX-长按v4] 使用缓存坐标替代e.touches（可能已释放导致报错）
                showMsgMenu(_msgLastTouchX, _msgLastTouchY);
            }, 400); // [FIX-长按v4] 500ms→400ms，提高灵敏度
        }
        function handleMsgTouchEnd() {
            clearTimeout(longPressTimer);
        }
        function handleMsgTouchMove(e) {
            // [FIX-长按v3] 添加10px容差，手指微小抖动不取消长按
            if (e && e.touches && e.touches[0]) {
                var dx = e.touches[0].clientX - _msgTouchStartX;
                var dy = e.touches[0].clientY - _msgTouchStartY;
                if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                    clearTimeout(longPressTimer);
                }
            } else {
                clearTimeout(longPressTimer);
            }
        }
        function handleMsgMouseDown(idx, e) {
            if(isMultiSelect) return; // 点击选择由 onclick 处理

            if(e.button !== 0) return;
            isLongPress = false;
            selectedMsgIdx = idx;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                showMsgMenu(e.clientX, e.clientY);
            }, 400); // [FIX-长按v4] 500ms→400ms
        }
        function handleMsgMouseUp() {
            clearTimeout(longPressTimer);
        }

        // [FIX-菜单关闭v4] 全局菜单关闭监听器引用，用于移除
        var _msgMenuCloseHandler = null;
        function _removeMsgMenuCloseHandler() {
            if (_msgMenuCloseHandler) {
                document.removeEventListener('touchstart', _msgMenuCloseHandler, true);
                document.removeEventListener('click', _msgMenuCloseHandler, true);
                _msgMenuCloseHandler = null;
            }
        }

        function showMsgMenu(x, y) {
            // [FIX-菜单卡住v2] try-catch 防止异常导致 isLongPress 状态泄漏
            try {
                const menu = document.getElementById('msg-menu');
                if (!menu) { isLongPress = false; return; }

                menu.style.display = 'block';
                
                // Measure
                menu.style.visibility = 'hidden';
                menu.style.display = 'block';
                const rect = menu.getBoundingClientRect();
                menu.style.visibility = 'visible';

                let finalX = x - rect.width / 2;
                let finalY = y;

                if (finalX + rect.width > window.innerWidth) {
                    finalX = window.innerWidth - rect.width - 10;
                }
                if (finalX < 10) finalX = 10;

                if (finalY + rect.height > window.innerHeight) {
                    finalY = y - rect.height - 10;
                }

                menu.style.left = finalX + 'px';
                menu.style.top = finalY + 'px';

                // [FIX-菜单关闭v4] 先清除旧监听器，再注册新的持久监听器
                // 旧方案（v3）是一次性监听器，若首次触摸落在菜单内则监听器被消耗但菜单未关闭
                // 新方案：持久监听，直到菜单被关闭后才移除
                _removeMsgMenuCloseHandler();
                setTimeout(function() {
                    _msgMenuCloseHandler = function _closeMsgMenu(ev) {
                        var mm = document.getElementById('msg-menu');
                        if (!mm || mm.style.display === 'none') {
                            // 菜单已关闭，移除监听器
                            _removeMsgMenuCloseHandler();
                            return;
                        }
                        if (!mm.contains(ev.target)) {
                            mm.style.display = 'none';
                            isLongPress = false; // [FIX] 关闭菜单时重置长按状态
                            _removeMsgMenuCloseHandler();
                        }
                    };
                    document.addEventListener('touchstart', _msgMenuCloseHandler, true);
                    document.addEventListener('click', _msgMenuCloseHandler, true);
                }, 100);
            } catch(err) {
                console.error('[showMsgMenu] error:', err);
                isLongPress = false;
                if (typeof _blockLongPress !== 'undefined') _blockLongPress = false;
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }

        function menuPlayVoice() {
            playVoiceMessage(selectedMsgIdx);
            document.getElementById('msg-menu').style.display='none';
        }

        function sendPoke(targetMemberId) {
            closeExtMenu();
            if (!activeChatId) return;
            const c = store.contacts.find(x => x.id === activeChatId);
            if (!c) return;
            
            // [群聊拍一拍] 群聊中支持拍指定成员
            if (c.isGroup) {
                if (!targetMemberId) return; // 群聊必须指定目标成员
                const targetContact = store.contacts.find(x => x.id === targetMemberId);
                if (!targetContact) return;
                const personaId = c.settings?.userPersona;
                const persona = personaId && store.personas?.find(p => p.id === personaId);
                const myName = persona?.name || store.user?.name || store.user?.desktopName || '我';
                const targetName = (c.groupNicknames && c.groupNicknames[targetMemberId]) || targetContact.name;
                const suffix = targetContact.settings?.pokeSuffix || '';
                const pokeText = `${myName} 拍了拍 ${targetName}${suffix ? ' 的' + suffix : ''}`;
                if (!store.chats[activeChatId]) store.chats[activeChatId] = [];
                store.chats[activeChatId].push({
                    type: 'poke',
                    content: pokeText,
                    sender: 'me',
                    time: Date.now()
                });
                save();
                renderHistory();
                
                // 群聊拍一拍回拍（被拍的成员有概率回拍）
                const _gpChatId = activeChatId;
                const _gpTargetId = targetMemberId;
                setTimeout(() => {
                    if (Math.random() < 0.5) return;
                    const _gpTarget = store.contacts.find(x => x.id === _gpTargetId);
                    const _gpGroup = store.contacts.find(x => x.id === _gpChatId);
                    if (!_gpTarget || !_gpGroup) return;
                    const _gpTargetName = (_gpGroup.groupNicknames && _gpGroup.groupNicknames[_gpTargetId]) || _gpTarget.name;
                    const _gpPersonaId = _gpGroup.settings?.userPersona;
                    const _gpPersona = _gpPersonaId && store.personas?.find(p => p.id === _gpPersonaId);
                    const _gpMyName = (_gpPersona?.name) || store.user?.name || '我';
                    const _gpUserSuffix = _gpTarget.settings?.userPokeSuffix || '';
                    const _gpPokeBackText = `${_gpTargetName} 拍了拍 ${_gpMyName}${_gpUserSuffix ? ' 的' + _gpUserSuffix : ''}`;
                    if (!store.chats[_gpChatId]) store.chats[_gpChatId] = [];
                    store.chats[_gpChatId].push({
                        type: 'poke',
                        content: _gpPokeBackText,
                        sender: _gpTargetId,
                        time: Date.now()
                    });
                    save();
                    if (activeChatId === _gpChatId) renderHistory();
                }, 1500 + Math.random() * 3000);
                return;
            }
            
            const personaId = c.settings?.userPersona;
            const persona = personaId && store.personas?.find(p => p.id === personaId);
            const myName = persona?.name || store.user?.name || store.user?.desktopName || '我';
            const suffix = c.settings?.pokeSuffix || '';
            const pokeText = `${myName} 拍了拍 ${c.name}${suffix ? ' 的' + suffix : ''}`;
            if (!store.chats[activeChatId]) store.chats[activeChatId] = [];
            store.chats[activeChatId].push({
                type: 'poke',
                content: pokeText,
                sender: 'me',
                time: Date.now()
            });
            save();
            renderHistory();

            // 修复：联系人拍一拍回拍（用poke类型而非普通文本消息）
            const _pokeBackChatId = activeChatId;
            const _pokeBackDelay = 1500 + Math.random() * 3000; // 1.5~4.5秒后回拍
            setTimeout(() => {
                const _pc = store.contacts.find(x => x.id === _pokeBackChatId);
                if (!_pc || _pc.isGroup) return;
                // 随机50%概率回拍
                if (Math.random() < 0.5) return;
                const _pPersonaId = _pc.settings?.userPersona;
                const _pPersona = _pPersonaId && store.personas?.find(p => p.id === _pPersonaId);
                const _pMyName = (_pPersona?.name) || store.user?.name || '我';
                const _pUserSuffix = _pc.settings?.userPokeSuffix || '';
                const _pPokeBackText = `${_pc.name} 拍了拍 ${_pMyName}${_pUserSuffix ? ' 的' + _pUserSuffix : ''}`;
                if (!store.chats[_pokeBackChatId]) store.chats[_pokeBackChatId] = [];
                store.chats[_pokeBackChatId].push({
                    type: 'poke',
                    content: _pPokeBackText,
                    sender: _pokeBackChatId,
                    time: Date.now()
                });
                save();
                if (activeChatId === _pokeBackChatId) renderHistory();
            }, _pokeBackDelay);
        }

        function menuQuote() {
            const m = store.chats[activeChatId][selectedMsgIdx];
            if(!m) return;
            // [FIX-群聊引用名字] 群聊中使用实际发送者名字，而非群聊名字
            let _quoteSenderName;
            if (m.sender === 'me') {
                _quoteSenderName = '我';
            } else if (m.senderName) {
                // 群聊消息有senderName字段，直接使用
                _quoteSenderName = m.senderName;
            } else {
                // 私聊或旧消息，通过sender ID查找联系人名字
                const _qContact = store.contacts.find(c => c.id === m.sender);
                _quoteSenderName = _qContact ? _qContact.name : (store.contacts.find(c => c.id === activeChatId)?.name || '对方');
            }
            quoteContent = _quoteSenderName + ": " + getMsgText(m);
            document.getElementById('quote-text').innerText = quoteContent;
            document.getElementById('quote-preview').style.display = 'flex';
            document.getElementById('msg-menu').style.display='none';
        }

        function cancelQuote() {
            quoteContent = null;
            document.getElementById('quote-preview').style.display = 'none';
        }

        function menuCopy() {
            const m = store.chats[activeChatId][selectedMsgIdx];
            if(m) {
                const text = getMsgText(m);
                navigator.clipboard.writeText(text).then(()=>toast("已复制"));
            }
            document.getElementById('msg-menu').style.display='none';
        }

        function menuEdit() {
            const m = store.chats[activeChatId][selectedMsgIdx];
            if(m) {
                document.getElementById('msg-menu').style.display='none';
                // 使用内联编辑：查找对应的气泡元素
                var msgIdx = selectedMsgIdx;
                var bubbleEl = null;
                var editBtn = document.querySelector('.msg-edit-format-btn[data-idx="' + msgIdx + '"]');
                if (editBtn) {
                    var row = editBtn.closest('div[style*="display:flex"]');
                    bubbleEl = row ? row.querySelector('.bubble') : null;
                }
                if (bubbleEl && typeof startInlineEdit === 'function') {
                    startInlineEdit(msgIdx, bubbleEl);
                } else {
                    // 降级方案：如果找不到气泡，使用自定义弹窗编辑
                    if(m.type === 'location') {
                        const parts = m.content.split('|');
                        const title = parts[0] || '';
                        const detail = parts[1] || '';
                        showPromptModal("编辑位置标题:", title).then(function(newTitle) {
                            if(newTitle !== null && newTitle.trim()) {
                                showPromptModal("编辑具体地点:", detail).then(function(newDetail) {
                                    if(newDetail !== null && newDetail.trim()) {
                                        m.content = newTitle + '|' + newDetail;
                                        save(); renderHistory(false, true);
                                    }
                                });
                            }
                        });
                    } else {
                        showPromptModal("编辑消息:", m.content, {multiline: true}).then(function(newText) {
                            // [FIX-空白编辑] 不允许空白内容覆盖原消息
                            if(newText !== null && newText.trim() && newText !== m.content) {
                                m.content = newText;
                                if(m.type === 'voice') m.textVal = newText;
                                save(); renderHistory(false, true);
                            } else if(newText !== null && !newText.trim()) {
                                toast('内容不能为空，已保留原消息', 'warning');
                            }
                        });
                    }
                }
                return;
            }
            document.getElementById('msg-menu').style.display='none';
        }

        function menuSelect() {
            isMultiSelect = true;
            document.getElementById('chat-history').classList.add('multi-select-mode'); // 修复：为聊天记录添加模式类
            document.getElementById('chat-select-bar').style.display = 'flex';
            toggleSelectMsg(selectedMsgIdx);
            document.getElementById('msg-menu').style.display='none';
        }
        
        function toggleSelectMsg(idx) {
            if(selectedMsgs.has(idx)) selectedMsgs.delete(idx);
            else selectedMsgs.add(idx);
            // [FIX-多选不刷新] 强制完整渲染，确保选中/取消选中的阴影覆盖正确显示
            renderHistory(true, true);
        }

        function cancelSelect(keepScroll = false) {
            isMultiSelect = false;
            selectedMsgs.clear();
            document.getElementById('chat-history').classList.remove('multi-select-mode'); // 修复：移除模式类
            document.getElementById('chat-select-bar').style.display = 'none';
            // [FIX-多选不刷新] 强制完整渲染，确保取消多选后恢复正常显示
            renderHistory(keepScroll, true);
        }

        function forwardSelected() {
            if (selectedMsgs.size === 0) return toast('请先选择消息');
            // Collect selected messages in order
            const sorted = Array.from(selectedMsgs).sort((a, b) => a - b);
            forwardPendingMsgs = sorted.map(idx => ({ ...store.chats[activeChatId][idx], _idx: idx }));
            forwardSourceChatId = activeChatId;
            // Cancel multi-select mode first
            cancelSelect();
            // Show forward type selection
            document.getElementById('modal-forward-type').style.display = 'flex';
        }

        // [FIX-删除不彻底] 删除消息时同步清理memorySummaries中包含该消息内容的记忆条目
        function _cleanMemoryAfterDelete(contactId, deletedMsgs) {
            if (!store.memorySummaries || !store.memorySummaries[contactId] || !deletedMsgs || deletedMsgs.length === 0) return;
            // 提取被删消息的关键内容片段（用于匹配记忆）
            const keywords = [];
            deletedMsgs.forEach(m => {
                if (m.type === 'voice' && m.textVal) keywords.push(m.textVal.trim());
                else if (m.type === 'text' && m.content && m.content.length > 4) keywords.push(m.content.substring(0, 30).trim());
            });
            if (keywords.length === 0) return;
            const before = store.memorySummaries[contactId].length;
            store.memorySummaries[contactId] = store.memorySummaries[contactId].filter(mem => {
                const content = mem.content || '';
                return !keywords.some(kw => kw && content.includes(kw));
            });
            const removed = before - store.memorySummaries[contactId].length;
            if (removed > 0) console.log(`[FIX-删除不彻底] 清理了 ${removed} 条相关记忆`);
        }

        function deleteSelected() {
            if(selectedMsgs.size === 0) return;
            // 问题2修复：改用自定义确认框
            showConfirm("删除消息", `确定要删除 ${selectedMsgs.size} 条消息吗?`, () => {
                const sorted = Array.from(selectedMsgs).sort((a,b)=>b-a);
                // [FIX-删除不彻底] 先收集被删消息内容，再删除
                const deletedMsgs = sorted.map(idx => store.chats[activeChatId][idx]).filter(Boolean);
                sorted.forEach(idx => {
                    store.chats[activeChatId].splice(idx, 1);
                });
                _cleanMemoryAfterDelete(activeChatId, deletedMsgs);
                // [FIX-删除持久化] 立即写入数据库，防止刷新后消息复活
                _doSaveNow();
                // [FIX-删除跳顶] 重置渲染计数，确保完整重建DOM
                _lastRenderedMsgCount[activeChatId] = 0;
                cancelSelect(true);
                toast("删除成功");
            });
        }
        
        function menuDelete() {
             showConfirm("删除消息", "确定要删除这条消息吗?", () => {
                // [FIX-删除不彻底] 先收集被删消息内容
                const deletedMsg = store.chats[activeChatId] ? store.chats[activeChatId][selectedMsgIdx] : null;
                store.chats[activeChatId].splice(selectedMsgIdx, 1);
                if (deletedMsg) _cleanMemoryAfterDelete(activeChatId, [deletedMsg]);
                // [FIX-删除持久化] 立即写入数据库，防止刷新后消息复活
                _doSaveNow();
                renderHistory(true); // 修复：保持滚动位置
                toast("消息已删除");
             });
             document.getElementById('msg-menu').style.display='none';
        }

        function menuFavorite() {
            const m = store.chats[activeChatId] ? store.chats[activeChatId][selectedMsgIdx] : null;
            if (!m) return;
            if (!store.favorites) store.favorites = {};
            if (!store.favorites[activeChatId]) store.favorites[activeChatId] = [];
            const contact = store.contacts.find(c => c.id === activeChatId);
            const favItem = {
                id: Date.now(),
                chatId: activeChatId,
                contactName: contact ? contact.name : '未知',
                sender: m.sender,
                type: m.type,
                content: m.content,
                textVal: m.textVal || '',
                time: m.time || Date.now(),
                savedAt: Date.now()
            };
            store.favorites[activeChatId].push(favItem);
            save();
            toast('已收藏');
            document.getElementById('msg-menu').style.display = 'none';
        }

        async function menuTranslate() {
            document.getElementById('msg-menu').style.display = 'none';
            const m = store.chats[activeChatId] ? store.chats[activeChatId][selectedMsgIdx] : null;
            if (!m || !m.content) return;
            // [FIX-翻译] 使用 .msg-row 来定位，每个 msg-row 对应一条消息
            const rows = document.querySelectorAll('#chat-history .msg-row');
            const row = rows[selectedMsgIdx];
            if (!row) return;
            const bubbleEl = row.querySelector('.bubble, .bubble-transfer, .bubble-redpacket, .bubble-location, .bubble-merge-forward, .offline-text-block, .bubble-shared-post, .bubble-copay, .bubble-gift-delivery, .bubble-fav-product, .bubble-contact-card');
            if (!bubbleEl) return;
            const bubbleContainer = bubbleEl.parentElement;
            if (!bubbleContainer) return;
            // Find or create a translate button
            let btn = bubbleContainer.querySelector('.msg-translate-btn');
            if (!btn) {
                btn = document.createElement('span');
                btn.className = 'msg-translate-btn';
                btn.style.display = 'none';
                bubbleContainer.appendChild(btn);
            }
            await toggleTranslation(m.content, bubbleContainer, btn, selectedMsgIdx, bubbleEl);
        }

        function menuRecall() {
            const m = store.chats[activeChatId][selectedMsgIdx];
            if (!m) return;
            
            if (m.sender === 'me') {
                m.originalType = m.type;
                m.originalContent = m.content;
                m.type = 'recalled';
                m.content = '你撤回了一条消息';
            } else {
                // Allow recalling contact messages for simulation purposes
                m.originalType = m.type;
                m.originalContent = m.content;
                m.type = 'recalled';
                m.content = `对方撤回一条消息`;
            }
            m.recalled = true;
            
            save();
            renderHistory(true, true); // [FIX-撤回即时] 强制完整渲染，因为撤回不改变消息数量，增量渲染会跳过
            toast("消息已撤回");
            document.getElementById('msg-menu').style.display = 'none';
        }

        function menuPinMsg() {
            const m = store.chats[activeChatId] ? store.chats[activeChatId][selectedMsgIdx] : null;
            if (!m) return;
            if (!store.pinnedMsgs) store.pinnedMsgs = [];
            const contact = store.contacts.find(c => c.id === activeChatId);
            const msgText = getMsgText(m);
            // 检查是否已置顶相同内容
            const existing = store.pinnedMsgs.findIndex(p => p.chatId === activeChatId && p.msgIdx === selectedMsgIdx);
            if (existing > -1) {
                store.pinnedMsgs.splice(existing, 1);
                save(); renderContacts();
                toast('已取消置顶');
            } else {
                store.pinnedMsgs.push({
                    id: Date.now(),
                    chatId: activeChatId,
                    msgIdx: selectedMsgIdx,
                    contactName: contact ? contact.name : '未知',
                    contactAvatar: contact ? contact.avatar : '',
                    sender: m.sender,
                    content: msgText,
                    type: m.type || 'text',
                    time: m.time || Date.now(),
                    pinnedAt: Date.now()
                });
                save(); renderContacts();
                toast('已置顶到联系人页面');
            }
            document.getElementById('msg-menu').style.display = 'none';
        }

        function unpinMsg(pinnedId) {
            if (!store.pinnedMsgs) return;
            const idx = store.pinnedMsgs.findIndex(p => p.id === pinnedId);
            if (idx > -1) {
                store.pinnedMsgs.splice(idx, 1);
                save(); renderContacts();
                toast('已取消置顶');
            }
        }

        // --- FORWARD ---
        let forwardPendingMsgs = []; // messages to forward
        let forwardSourceChatId = null;

        function menuForward() {
            document.getElementById('msg-menu').style.display = 'none';
            const m = store.chats[activeChatId]?.[selectedMsgIdx];
            if (!m) return;
            forwardPendingMsgs = [{ ...m, _idx: selectedMsgIdx }];
            forwardSourceChatId = activeChatId;
            // Show forward type selection
            document.getElementById('modal-forward-type').style.display = 'flex';
        }

        function chooseForwardType(type) {
            document.getElementById('modal-forward-type').style.display = 'none';
            if (type === 'single') {
                // Single forward: select target contact
                showForwardContactSelector('single');
            } else if (type === 'merge') {
                // Merge forward: select target contact
                showForwardContactSelector('merge');
            }
        }

        function showForwardContactSelector(forwardType) {
            const list = document.getElementById('forward-contact-list');
            list.innerHTML = '';
            store.contacts.forEach(c => {
                if (c.id === forwardSourceChatId) return; // skip current chat
                const item = document.createElement('div');
                item.className = 'list-item';
                item.style.cursor = 'pointer';
                item.innerHTML = `
                    <img src="${c.avatar}" class="avatar">
                    <div class="list-content">
                        <div class="list-title">${c.name}</div>
                    </div>
                `;
                item.onclick = () => {
                    document.getElementById('modal-forward-contact').style.display = 'none';
                    executeForward(forwardType, c.id);
                };
                list.appendChild(item);
            });
            document.getElementById('modal-forward-contact').style.display = 'flex';
        }

        function executeForward(forwardType, targetChatId) {
            if (!store.chats[targetChatId]) store.chats[targetChatId] = [];

            if (forwardType === 'single') {
                // Forward each message individually
                forwardPendingMsgs.forEach(m => {
                    const fwd = {
                        sender: 'me',
                        type: m.type,
                        content: m.content,
                        time: new Date().toLocaleTimeString()
                    };
                    if (m.textVal) fwd.textVal = m.textVal;
                    store.chats[targetChatId].push(fwd);
                });
                save();
                toast('已转发');
            } else if (forwardType === 'merge') {
                // Build merge forward message
                const sourceContact = store.contacts.find(c => c.id === forwardSourceChatId);
                const sourceName = sourceContact ? sourceContact.name : '未知';
                const userName = store.user?.name || '我';

                // Collect participants
                const participantNames = new Set();
                const records = forwardPendingMsgs.map(m => {
                    let senderName;
                    if (m.sender === 'me') {
                        senderName = userName;
                    } else {
                        if (sourceContact?.isGroup) {
                            const sc = store.contacts.find(c => c.id === m.sender);
                            senderName = sc ? sc.name : '未知';
                        } else {
                            senderName = sourceName;
                        }
                    }
                    participantNames.add(senderName);
                    return {
                        sender: senderName,
                        type: m.type,
                        content: m.content,
                        textVal: m.textVal || null
                    };
                });

                const names = Array.from(participantNames);
                let title;
                if (names.length <= 2) {
                    title = names.join('和') + '的聊天记录';
                } else {
                    title = names.slice(0, 2).join('、') + '等人的聊天记录';
                }

                const mergeMsg = {
                    sender: 'me',
                    type: 'merge_forward',
                    content: title,
                    mergeRecords: records,
                    time: new Date().toLocaleTimeString()
                };
                store.chats[targetChatId].push(mergeMsg);
                save();
                toast('已合并转发');
            }

            // If target chat is currently open, refresh
            if (activeChatId === targetChatId) {
                renderHistory();
            }

            forwardPendingMsgs = [];
            forwardSourceChatId = null;
        }

        function showMergeForwardDetail(idx) {
            const m = store.chats[activeChatId]?.[idx];
            if (!m || m.type !== 'merge_forward' || !m.mergeRecords) return;

            const modal = document.createElement('div');
            modal.className = 'modal-mask';
            modal.style.display = 'flex';
            modal.style.zIndex = '9999';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            let recordsHtml = m.mergeRecords.map(r => {
                let contentStr = '';
                if (r.type === 'image') {
                    contentStr = `<img src="${r.content}" style="max-width:150px; border-radius:4px; margin-top:4px;">`;
                } else if (r.type === 'merge_forward') {
                    contentStr = `<span style="color:#576b95;">[聊天记录]</span>`;
                } else {
                    contentStr = `<span>${r.content || ''}</span>`;
                }
                return `<div style="padding:10px 0; border-bottom:1px solid #f0f0f0;">
                    <div style="font-size:13px; font-weight:600; color:#333; margin-bottom:4px;">${r.sender}</div>
                    <div style="font-size:14px; color:#555; line-height:1.5;">${contentStr}</div>
                </div>`;
            }).join('');

            modal.innerHTML = `<div class="modal-box" style="max-height:80vh; overflow-y:auto;">
                <h3 style="margin-bottom:15px;">${m.content}</h3>
                <div>${recordsHtml}</div>
                <div style="text-align:center; margin-top:15px; padding-top:10px; border-top:1px solid #eee; color:#999;" onclick="this.parentElement.parentElement.remove()">关闭</div>
            </div>`;
            document.getElementById('device').appendChild(modal);
        }

        function getMsgText(m) {
            if(m.type==='text') return m.content;
            if(m.type==='offline_text') return m.content;
            if(m.type==='go_offline_text') return m.content;
            if(m.type==='voice') return m.textVal || '[语音]';
            // [FIX-问题4] 添加语音通话记录类型，显示来电/去电方向
            if(m.type==='voice_call') return (m.duration === 0 || m.content === '未接来电') ? '[未接语音]' : `[📞 语音通话] ${m.sender !== 'me' ? '对方来电' : '你拨打的'} ${m.content}`;
            if(m.type==='video_call') return (m.duration === 0 || m.content === '未接来电') ? '[未接视频]' : `[📹 视频通话] ${m.sender !== 'me' ? '对方来电' : '你拨打的'} ${m.content}`;
            if(m.type==='image') return m.imgGenPrompt ? '[AI生图: ' + m.imgGenPrompt.substring(0, 30) + ']' : (m.fakeImgDesc ? '[图片] ' + m.fakeImgDesc : (m.stickerName ? '[表情]' : '[图片]'));
            if(m.type==='transfer') return '[转账]';
            if(m.type==='contact_card') {
                try { const cd = JSON.parse(m.content); return `[名片] ${cd.remark || cd.name}`; } catch(e) { return '[名片]'; }
            }
            if(m.type==='redpacket') return '[红包]';
            if(m.type==='shop_copay') {
                try { const cp = JSON.parse(m.content); return `[代付请求] ${cp.productName} ￥${cp.amount}`; } catch(e) { return '[代付请求]'; }
            }
            if(m.type==='food-gift') { const fo = m.foodOrder||{}; return `[外卖投喂] ${fo.name||'外卖'} - ${fo.shop||''} ¥${fo.price||0}`; }
            if(m.type==='food-gift-received') { const fo = m.foodOrder||{}; return `[收到外卖投喂] ${fo.name||'外卖'} - ${fo.shop||''} ¥${fo.price||0}`; }
            if(m.type==='food-proxy-pay') { const fo = m.foodOrder||{}; return `[外卖代付请求] ${fo.name||'外卖'} - ${fo.shop||''} ¥${fo.price||0}`; }
            if(m.type==='food-family-card') { const fo = m.foodOrder||{}; return `[亲属卡消费] ${fo.name||'外卖'} ¥${fo.price||0}`; }
            if(m.type==='food-receipt-share') { const fo = m.foodOrder||{}; return `[外卖小票] ${fo.name||'外卖'} ¥${fo.price||0}`; }
            if(m.type==='shop-receipt-share') { try { const sr = JSON.parse(m.content); return `[购物小票] ${sr.itemNames||'商品'} ¥${sr.total||0}`; } catch(e) { return '[购物小票]'; } }
            if(m.type==='location') return '[位置] ' + m.content;
            if(m.type==='shared_post') {
                try {
                    const p = JSON.parse(m.content);
                    return `[分享帖子] ${p.title || ''}: ${p.text || ''}（作者: ${p.author || '未知'}）`;
                } catch(e) { return '[分享帖子]'; }
            }
            if(m.type==='merge_forward') {
                // Return readable text so AI can read the content
                if (m.mergeRecords && m.mergeRecords.length > 0) {
                    const detail = m.mergeRecords.map(r => {
                        let ct = r.content || '';
                        if (r.type === 'image') ct = r.fakeImgDesc ? '[图片] ' + r.fakeImgDesc : (r.stickerName ? '[表情]' : '[图片]');
                        if (r.type === 'merge_forward') ct = '[聊天记录]';
                        return `${r.sender}: ${ct}`;
                    }).join('\n');
                    return `[合并转发: ${m.content}]\n${detail}`;
                }
                return '[聊天记录]';
            }
            // [FIX-反向查岗-方向标注] 处理反向查岗消息，给AI明确的方向说明
            if(m.type==='reverse-check-invite') {
                // 用户邀请联系人查看【用户自己的】手机
                return '[查手机邀请] 我主动邀请你来查看我的手机数据（聊天记录、相册等）。被查看的是我的手机，不是你的手机。';
            }
            if(m.type==='reverse-check-request') {
                // 联系人请求查看【用户的】手机
                return '[查手机请求] 你（' + (c ? c.name : '联系人') + '）想要查看我的手机。被查看的是我的手机，不是你的手机。你在翻看的是我手机里的数据。';
            }
            // 情侣空间特殊消息
            if(m.type==='couple-invite') return '[情侣空间邀请]';
            if(m.type==='couple-response') return m.accepted ? '[已开通情侣空间]' : '[婉拒了情侣空间邀请]';
            if(m.type==='couple-unbind-request') return '[解除情侣空间请求]';
            if(m.type==='couple-unbind-response') return m.accepted ? '[同意解除情侣空间]' : '[不愿解除情侣空间]';
            if(m.type==='couple-force-unbind') return '[强制解除情侣空间]';
            return m.content;
        }
        
        // Close menu on click elsewhere (Duplicate logic handled in window.onclick above, removing this listener)

        // ===== 联系人状态系统 =====
        var _statusTimer = null;
        var _phoneLockTimer = null;
        var _phoneLockShowing = false;

        // 状态灯颜色常量：绿=在线 黄=忙碌 红=离线/睡觉
        var STATUS_GREEN = '#10b981';
        var STATUS_YELLOW = '#f59e0b';
        var STATUS_RED = '#ef4444';
        var STATUS_GRAY = '#999';

        // AI生成状态缓存：{ contactId: { text, color, time } }
        var _aiStatusCache = {};
        var _aiStatusGenerating = {};
        // [FIX-状态开关绕过] 暴露缓存清理接口，供 app-phone-lock.js 关闭开关时清理
        try {
            window.clearContactAIStatusCache = function(cid) {
                if (cid) { delete _aiStatusCache[cid]; delete _aiStatusGenerating[cid]; }
                else { _aiStatusCache = {}; _aiStatusGenerating = {}; }
            };
        } catch(e){}
        
        // [FIX-自动调用API] 暴露全局函数，让app-part1.js在生成心声时可以同时更新状态缓存
        // [FIX-状态串联v2] 严格按contactId写入缓存并校验联系人存在，防止异步回调把A的状态写到B
        window._updateContactStatusFromHeart = function(contactId, heartStr) {
            if (!contactId || !heartStr) return;
            // [FIX-状态串联v2] 验证联系人存在且不是群聊
            var _targetContact = store.contacts && store.contacts.find(function(x){return x.id===contactId;});
            if (!_targetContact || _targetContact.isGroup) return;
            // 从心声格式解析状态：位置|穿着|状态|心声内容
            var parts = heartStr.split('|');
            if (parts.length >= 3) {
                var status = parts[2].trim(); // 状态部分
                // [FIX-状态栏乱码v2] 严格清洗状态文本，去除markdown标记、残留标签、特殊字符、零宽字符
                status = status
                    .replace(/[\*`_~#]/g, '')                    // 去除markdown标记
                    .replace(/\[[\s\S]*?\]/g, '')                // 去除方括号标签
                    .replace(/["""''「」【】《》\{\}\(\)（）]/g, '') // 去除各类引号和括号
                    .replace(/[\x00-\x1f\x7f\u200B-\u200F\u2028-\u202F\uFEFF\u00AD]/g, '') // 去除控制字符+零宽字符
                    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '') // 去除emoji
                    .replace(/^[\s\-:：·•→←↑↓=+>]+/, '')        // 去除开头的特殊符号
                    .replace(/[\s\-:：·•→←↑↓=+>]+$/, '')        // 去除结尾的特殊符号
                    .trim();
                // [FIX-状态栏乱码v2] 额外校验：状态文本必须包含至少1个中文/日文/韩文/英文字符
                var _hasValidChar = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7afa-zA-Z]/.test(status);
                if (status && status.length >= 2 && status.length <= 20 && _hasValidChar) {
                    _aiStatusCache[contactId] = {
                        text: status,
                        color: STATUS_GREEN,
                        time: Date.now()
                    };
                    // [FIX-状态持久化] 同步写到 contact.status，刷新/重开也能沿用上一次状态
                    try {
                        _targetContact.status = status;
                        if (typeof save === 'function') save();
                    } catch(e) {}
                    // [FIX-状态同步v2] 刷新联系人列表，让名字下面的状态也同步更新
                    try { if (typeof renderContacts === 'function') renderContacts(); } catch(e) {}
                    // 如果当前正在显示这个联系人的聊天，立即更新状态显示
                    if (typeof activeChatId !== 'undefined' && activeChatId === contactId) {
                        // [FIX-状态开关绕过] 异步回调二次检查开关，避免用户已关闭后仍回填
                        var _c_chk = (store.contacts || []).find(function(x){ return x.id === contactId; });
                        if (_c_chk && _c_chk.settings && _c_chk.settings.hideContactStatus) {
                            // 开关已关，不再回填 DOM
                        } else if (_c_chk && _c_chk.isGroup) {
                            // 群聊不显示个人状态
                        } else {
                            var el = document.getElementById('chat-title-status');
                            if (el) {
                                // [FIX-取消预设] 无论先前是否隐藏，都强制显示为本次生成的状态
                                el.innerHTML = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + STATUS_GREEN + ';margin-right:4px;flex-shrink:0;box-shadow:0 0 4px ' + STATUS_GREEN + ';"></span><span style="color:#888;">' + status + '</span>';
                                el.style.display = 'inline-flex';
                                el.style.alignItems = 'center';
                                el.style.gap = '3px';
                            }
                        }
                    }
                }
            }
        };

        function _pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

        // [清理] 基于人设关键词的离线状态池 _buildPersonaStatuses 已移除
        // [清理] 基于聊天上下文的情绪推断 _inferMoodFromChat 已移除
        // 状态灯现在只使用：1) 日程/课表 2) AI缓存状态，无兜底

        // AI异步生成状态（带缓存，5分钟一次）
        function _tryAIStatusGen(contact) {
            var cid = contact.id;
            var cached = _aiStatusCache[cid];
            if(cached && (Date.now() - cached.time < 300000)) return; // 5分钟缓存
            if(_aiStatusGenerating[cid]) return;
            if(!store.system || !store.system.key) return; // 无API key则跳过

            _aiStatusGenerating[cid] = true;
            var persona = contact.persona || '';
            var recentChat = '';
            var chats = store.chats && store.chats[cid];
            if(chats && chats.length > 0) {
                var last5 = chats.slice(-5).filter(function(m){ return m.type === 'text'; });
                recentChat = last5.map(function(m){ return (m.sender === 'me' ? '用户' : contact.name) + ': ' + (m.content || '').substring(0, 80); }).join('\n');
            }
            // [FIX-时间感知v7] 状态栏生成：检查时间感知开关，关闭时不注入时间段；开启虚拟时间时使用虚拟时间
            var _statusPercOn = store.perception && store.perception.master && (contact.settings ? contact.settings.enablePerception !== false : true);
            var timeHint = '';
            if (_statusPercOn) {
                var _sp = store.perception;
                var hour = (_sp.customTime && _sp.timeVal) ? parseInt((_sp.timeVal || '12:00').split(':')[0]) : new Date().getHours();
                timeHint = hour < 6 ? '凌晨' : hour < 9 ? '早晨' : hour < 12 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : hour < 22 ? '晚上' : '深夜';
            }

            // [FIX-副API路由] 状态生成也走副API场景路由（scene='status'）
            API.chatCompletion([
                { role: 'system', content: '你是状态生成器。根据角色人设和聊天上下文，生成一条简短的在线状态（8-15字），像真人的个性签名/状态栏。\n人设：' + persona.substring(0, 300) + (timeHint ? '\n当前时段：' + timeHint : '') + (recentChat ? '\n最近聊天：\n' + recentChat : '') + '\n\n要求：1.完全符合角色性格 2.自然不做作 3.只输出状态文字，不要引号和解释 4.可以结合最近聊天的情绪和话题' + (!timeHint ? ' 5.不要提及具体时间或时间段' : '') },
                { role: 'user', content: '生成一条状态' }
            ], { temperature: 0.95, maxTokens: 50, scene: 'status', silent: true }).then(function(data) {
                var text = ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim().replace(/^["'「]|["'」]$/g, '');
                // [FIX-状态栏乱码v2] 严格清洗AI生成的状态文本
                text = text
                    .replace(/[\*`_~#]/g, '')                    // 去除markdown标记
                    .replace(/\[[\s\S]*?\]/g, '')                // 去除方括号标签
                    .replace(/["""''「」【】《》\{\}\(\)（）]/g, '') // 去除各类引号和括号
                    .replace(/[\x00-\x1f\x7f\u200B-\u200F\u2028-\u202F\uFEFF\u00AD]/g, '') // 去除控制字符+零宽字符
                    .replace(/^[\s\-:：·•→←↑↓=+>\.。，,]+/, '') // 去除开头特殊符号
                    .replace(/[\s\-:：·•→←↑↓=+>\.。，,]+$/, '') // 去除结尾特殊符号
                    .trim()
                    .substring(0, 20);
                if(text && text.length >= 2) {
                    _aiStatusCache[cid] = { text: text, color: STATUS_GREEN, time: Date.now() };
                    // 如果当前还在这个聊天界面，立即更新显示
                    if(typeof activeChatId !== 'undefined' && activeChatId === cid) {
                        // [FIX-状态开关绕过] 异步回调二次检查开关与群聊标志
                        var _c_chk2 = (store.contacts || []).find(function(x){ return x.id === cid; });
                        if (_c_chk2 && _c_chk2.settings && _c_chk2.settings.hideContactStatus) {
                            // 开关已关，不回填
                        } else if (_c_chk2 && _c_chk2.isGroup) {
                            // 群聊不显示
                        } else {
                            var el = document.getElementById('chat-title-status');
                            if(el && el.style.display !== 'none') {
                                el.innerHTML = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + STATUS_GREEN + ';margin-right:4px;flex-shrink:0;box-shadow:0 0 4px ' + STATUS_GREEN + ';"></span><span style="color:#888;">' + text + '</span>';
                            }
                        }
                    }
                }
            }).catch(function(){}).finally(function(){ _aiStatusGenerating[cid] = false; });
        }

        function _updateChatStatus(contact) {
            var statusEl = document.getElementById('chat-title-status');
            if(!statusEl || !contact) return;
            
            // [FIX-群聊状态栏] 群聊不显示联系人状态栏（群聊没有单一联系人状态）
            if(contact.isGroup) {
                statusEl.style.display = 'none';
                statusEl.innerHTML = '';
                if(_statusTimer) { clearInterval(_statusTimer); _statusTimer = null; }
                return;
            }
            
            // [FIX-联系人状态开关] 如果用户在聊天设置中关闭了联系人状态显示，则隐藏
            if(contact.settings && contact.settings.hideContactStatus) {
                statusEl.style.display = 'none';
                statusEl.innerHTML = '';
                if(_statusTimer) { clearInterval(_statusTimer); _statusTimer = null; }
                return;
            }
            
            // [FIX-取消预设] 状态栏只显示 AI 生成的状态，没有就隐藏
            //   优先级: 1) 本次会话内的内存缓存 _aiStatusCache
            //          2) 上一次持久化到联系人对象的 contact.status（刷新后沿用）
            //   两者都没有 → 留空隐藏，不再用日程/课表/时段/人设等做预设
            var statusText = '';
            var dotColor = STATUS_GRAY;

            var cached = _aiStatusCache[contact.id];
            if (cached && cached.text) {
                statusText = cached.text;
                dotColor = cached.color || STATUS_GREEN;
            } else if (contact.status && typeof contact.status === 'string' && contact.status.trim()) {
                statusText = contact.status.trim();
                dotColor = STATUS_GREEN;
            }

            // [FIX-状态栏乱码v2] 最终渲染前再次清洗，确保不会有奇怪字符出现
            statusText = (statusText || '')
                .replace(/[\*`_~#]/g, '')
                .replace(/\[[\s\S]*?\]/g, '')
                .replace(/["""''「」【】《》\{\}\(\)（）]/g, '')
                .replace(/[\x00-\x1f\x7f\u200B-\u200F\u2028-\u202F\uFEFF\u00AD]/g, '')
                .replace(/^[\s\-:：·•→←↑↓=+>\.。，,]+/, '')
                .replace(/[\s\-:：·•→←↑↓=+>\.。，,]+$/, '')
                .trim();
            // [FIX-状态栏乱码v2] 如果清洗后只剩特殊字符或太短，不显示
            if (statusText.length < 2 || !/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7afa-zA-Z]/.test(statusText)) {
                statusText = '';
            }
            // 渲染：圆点 + 文字（无emoji）
            statusEl.innerHTML = '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + dotColor + ';margin-right:4px;flex-shrink:0;box-shadow:0 0 4px ' + dotColor + ';"></span><span style="color:#888;">' + statusText + '</span>';
            statusEl.style.display = statusText ? 'inline-flex' : 'none';
            statusEl.style.alignItems = 'center';
            statusEl.style.gap = '3px';

            // [FIX-取消预设] 删除 1 分钟轮询：状态仅由"生成回应"驱动，不再定时重绘
            if (_statusTimer) { clearInterval(_statusTimer); _statusTimer = null; }
        }
        
        function _getScheduleStatus(contact, now) {
            // 检查情侣空间的日程和课表
            if(!store.coupleSpaces) return null;
            var space = null;
            for(var i=0;i<store.coupleSpaces.length;i++) {
                if(store.coupleSpaces[i].partnerId === contact.id) {
                    space = store.coupleSpaces[i]; break;
                }
            }
            if(!space) return null;
            
            var hour = now.getHours();
            var dayOfWeek = now.getDay();
            var weekDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 转为0=周一
            
            // 检查课表
            if(space.timetable && space.timetable.courses) {
                var settings = space.timetable.settings || {};
                var periodTimes = [];
                if(typeof calcPeriodTimes === 'function') {
                    periodTimes = calcPeriodTimes(settings);
                }
                for(var ci=0;ci<space.timetable.courses.length;ci++) {
                    var course = space.timetable.courses[ci];
                    if(course.day === weekDay) {
                        // 简单时间匹配
                        var startPeriod = course.startPeriod || 1;
                        var approxStartHour = 8 + (startPeriod - 1);
                        var approxEndHour = approxStartHour + (course.duration || 1);
                        if(hour >= approxStartHour && hour < approxEndHour) {
                            return {text: '📚 上课中: ' + course.name, color: '#ef4444'};
                        }
                    }
                }
            }
            
            // 检查日程
            if(space.scheduleData) {
                var dk = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
                var todayEvents = space.scheduleData[dk];
                if(todayEvents && todayEvents.length > 0) {
                    for(var ei=0;ei<todayEvents.length;ei++) {
                        var ev = todayEvents[ei];
                        if(ev.time) {
                            var parts = ev.time.split(':');
                            var evHour = parseInt(parts[0]);
                            if(Math.abs(hour - evHour) <= 1) {
                                return {text: '📋 ' + (ev.title || '忙碌中'), color: '#f59e0b'};
                            }
                        }
                    }
                }
            }
                return null;
            }
    
            // ==================== 回忆录导出 ====================
            function openMemoirExport(contactId) {
                var c = store.contacts.find(function(x) { return x.id === contactId; });
                if (!c) return;
                var cName = c.remark || c.name;
    
                // 统计各类数据数量
                var offlineCount = (store.offlineChats && store.offlineChats[contactId]) ? store.offlineChats[contactId].length : 0;
                var diaryCount = (store.diaries && store.diaries[contactId]) ? store.diaries[contactId].length : 0;
                var coupleSpace = null;
                var coupleDiaryCount = 0;
                if (store.coupleSpaces) {
                    for (var k in store.coupleSpaces) {
                        var sp = store.coupleSpaces[k];
                        if (sp && sp.contactId === contactId) { coupleSpace = sp; coupleDiaryCount = (sp.diaries || []).length; break; }
                    }
                }
                var travelDiaryCount = 0;
                if (store.ticketWallet && store.ticketWallet[contactId]) {
                    var tickets = store.ticketWallet[contactId].tickets || [];
                    travelDiaryCount = tickets.filter(function(t) { return t.diary; }).length;
                }
                // [FIX-记忆丢失] 优先从新记忆系统获取记忆数量（包含归档），兜底用旧结构
                var memoryCount = 0;
                if (typeof window.MemorySystem === 'object' && window.MemorySystem && window.MemorySystem.Store) {
                    var _cpMem = window.MemorySystem.Store.getContactMem(contactId);
                    if (_cpMem) memoryCount = _cpMem.core.length + _cpMem.long.length + _cpMem.short.length + _cpMem.archive.length;
                }
                if (memoryCount === 0 && store.memorySummaries && store.memorySummaries[contactId]) {
                    memoryCount = store.memorySummaries[contactId].length;
                }
                var momentCount = (store.moments || []).filter(function(m) { return m.name === c.name; }).length;
                // 线上聊天记录数量
                var chatCount = (store.chats && store.chats[contactId]) ? store.chats[contactId].length : 0;

                // 心声记录数量（线上+线下）
                var heartCount = 0;
                var _hChats = store.chats && store.chats[contactId] ? store.chats[contactId] : [];
                for (var hi = 0; hi < _hChats.length; hi++) { if (_hChats[hi].heart && _hChats[hi].sender !== 'user' && _hChats[hi].sender !== 'me') heartCount++; }
                var _hOffline = store.offlineChats && store.offlineChats[contactId] ? store.offlineChats[contactId] : [];
                for (var hj = 0; hj < _hOffline.length; hj++) { if (_hOffline[hj].heart && _hOffline[hj].role !== 'user') heartCount++; }
    
                var modal = document.createElement('div');
                modal.id = 'modal-memoir-export';
                modal.className = 'modal-mask';
                modal.style.cssText = 'z-index:10002;display:flex;';
                modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
    
                modal.innerHTML = '<div style="background:#fff;border-radius:12px;width:90%;max-width:380px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;">'
                    + '<div style="padding:16px 18px;border-bottom:1px solid #e5e5e5;display:flex;justify-content:space-between;align-items:center;">'
                    + '<span style="font-size:16px;font-weight:600;color:#111;">导出回忆录</span>'
                    + '<i class="fas fa-times" style="color:#999;cursor:pointer;" onclick="document.getElementById(\'modal-memoir-export\').remove()"></i>'
                    + '</div>'
                    + '<div style="flex:1;overflow-y:auto;padding:16px;">'
                    + '<div style="font-size:12px;color:#999;margin-bottom:12px;">选择导出内容</div>'
                    + _memoirCheckbox('memoir-chk-chat', '线上聊天记录', chatCount + ' 条消息', chatCount > 0)
                    + _memoirCheckbox('memoir-chk-offline', '线下见面记录', offlineCount + ' 条对话', offlineCount > 0)
                    + _memoirCheckbox('memoir-chk-diary', '日记', diaryCount + ' 篇', diaryCount > 0)
                    + _memoirCheckbox('memoir-chk-couple', '情侣日记', coupleDiaryCount + ' 篇', coupleDiaryCount > 0)
                    + _memoirCheckbox('memoir-chk-travel', '旅行日记', travelDiaryCount + ' 篇', travelDiaryCount > 0)
                    + _memoirCheckbox('memoir-chk-memory', '记忆总结', memoryCount + ' 条', memoryCount > 0)
                    + _memoirCheckbox('memoir-chk-moments', '朋友圈动态', momentCount + ' 条', momentCount > 0)
                    + _memoirCheckbox('memoir-chk-heart', '💗 心声记录', heartCount + ' 条', heartCount > 0)
                    + '<div style="font-size:12px;color:#999;margin:16px 0 10px;">导出格式</div>'
                    + '<div style="display:flex;gap:8px;">'
                    + '<label class="memoir-radio-label"><input type="radio" name="memoir-format" value="txt" checked> 纯文本 .txt</label>'
                    + '<label class="memoir-radio-label"><input type="radio" name="memoir-format" value="md"> Markdown .md</label>'
                    + '<label class="memoir-radio-label"><input type="radio" name="memoir-format" value="html"> HTML</label>'
                    + '</div>'
                    + '</div>'
                    + '<div style="padding:12px 16px;border-top:1px solid #e5e5e5;">'
                    + '<button onclick="doMemoirExport(\'' + contactId + '\')" style="width:100%;padding:12px;background:#111;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;">导出并下载</button>'
                    + '</div>'
                    + '</div>';
                document.body.appendChild(modal);
            }
            window.openMemoirExport = openMemoirExport;
    
            function _memoirCheckbox(id, label, sub, hasData) {
                var disabled = !hasData;
                return '<label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0f0f0;cursor:' + (disabled ? 'default' : 'pointer') + ';opacity:' + (disabled ? '0.4' : '1') + ';">'
                    + '<input type="checkbox" id="' + id + '" ' + (hasData ? 'checked' : 'disabled') + ' style="width:16px;height:16px;accent-color:#111;">'
                    + '<div style="flex:1;"><div style="font-size:14px;color:#111;">' + label + '</div><div style="font-size:12px;color:#bbb;">' + sub + '</div></div>'
                    + '</label>';
            }
    
            function doMemoirExport(contactId) {
                var c = store.contacts.find(function(x) { return x.id === contactId; });
                if (!c) return;
                var cName = c.remark || c.name;
                var userName = (typeof getUserPersonaName === 'function' && c) ? getUserPersonaName(c, (store.user && store.user.name) || '我') : ((store.user && store.user.name) || '我');
    
                var formatEl = document.querySelector('input[name="memoir-format"]:checked');
                var format = formatEl ? formatEl.value : 'txt';
    
                var sections = [];
    
                // 线上聊天记录
                if (_memoirChecked('memoir-chk-chat') && store.chats && store.chats[contactId]) {
                    var onlineChats = store.chats[contactId];
                    var onlineLines = [];
                    for (var _ci = 0; _ci < onlineChats.length; _ci++) {
                        var msg = onlineChats[_ci];
                        if (!msg) continue;
                        // 过滤系统/隐藏消息
                        if (msg.system || msg.hidden) continue;
                        var time = msg.time ? new Date(msg.time).toLocaleString('zh-CN') : '';
                        var isUser = (msg.sender === 'user' || msg.sender === 'me');
                        var sender = isUser ? userName : cName;

                        // 按消息类型格式化，尽量兼容不同字段命名
                        var body = '';
                        var mtype = msg.type || '';
                        if (mtype === 'redpacket' || msg.redpacket) {
                            var rpBless = (msg.redpacket && (msg.redpacket.blessing || msg.redpacket.msg)) || msg.blessing || msg.content || '恭喜发财';
                            var rpAmt = (msg.redpacket && msg.redpacket.amount) || msg.amount || '';
                            body = '[红包]' + (rpAmt ? ' ¥' + rpAmt : '') + (rpBless ? ' ' + rpBless : '');
                        } else if (mtype === 'transfer' || msg.transfer) {
                            var tfAmt = (msg.transfer && msg.transfer.amount) || msg.amount || '';
                            var tfNote = (msg.transfer && msg.transfer.note) || msg.note || msg.content || '';
                            body = '[转账]' + (tfAmt ? ' ¥' + tfAmt : '') + (tfNote ? ' ' + tfNote : '');
                        } else if (mtype === 'image' || mtype === 'img' || msg.image || msg.imageUrl) {
                            body = '[图片]' + (msg.content && typeof msg.content === 'string' && msg.content.indexOf('data:') !== 0 ? ' ' + msg.content : '');
                        } else if (mtype === 'voice' || mtype === 'audio' || msg.voice) {
                            var vDur = msg.duration ? ' ' + msg.duration + '"' : '';
                            body = '[语音]' + vDur + (msg.text ? ' ' + msg.text : (msg.content && typeof msg.content === 'string' && msg.content.indexOf('data:') !== 0 ? ' ' + msg.content : ''));
                        } else if (mtype === 'sticker' || mtype === 'emoji' || msg.sticker) {
                            body = '[表情]' + (msg.stickerName ? ' ' + msg.stickerName : (msg.content && typeof msg.content === 'string' && msg.content.indexOf('data:') !== 0 ? ' ' + msg.content : ''));
                        } else if (mtype === 'video' || msg.video) {
                            body = '[视频]';
                        } else if (mtype === 'location' || msg.location) {
                            var locName = (msg.location && msg.location.name) || msg.content || '';
                            body = '[位置]' + (locName ? ' ' + locName : '');
                        } else if (mtype === 'file' || msg.file) {
                            body = '[文件]' + (msg.fileName ? ' ' + msg.fileName : '');
                        } else if (mtype === 'call' || msg.call) {
                            body = '[通话]' + (msg.content ? ' ' + msg.content : '');
                        } else if (mtype === 'quote' || msg.quote) {
                            var qContent = (msg.quote && msg.quote.content) || '';
                            body = (msg.content || '') + (qContent ? '\n  > ' + qContent : '');
                        } else {
                            // 普通文本：避免把 base64 dataURL 输出到文件里
                            var c0 = msg.content;
                            if (typeof c0 === 'string') {
                                if (c0.indexOf('data:image') === 0) body = '[图片]';
                                else if (c0.indexOf('data:audio') === 0) body = '[语音]';
                                else body = c0;
                            } else {
                                body = '';
                            }
                        }

                        onlineLines.push((time ? '[' + time + '] ' : '') + sender + ': ' + body);
                    }
                    if (onlineLines.length > 0) {
                        sections.push({ title: '线上聊天记录', content: onlineLines.join('\n') });
                    }
                }

                // 线下见面记录
                if (_memoirChecked('memoir-chk-offline') && store.offlineChats && store.offlineChats[contactId]) {
                    var chats = store.offlineChats[contactId];
                    var chatLines = chats.map(function(msg) {
                        var time = msg.time ? new Date(msg.time).toLocaleString('zh-CN') : '';
                        var sender = msg.role === 'user' ? userName : cName;
                        return (time ? '[' + time + '] ' : '') + sender + ': ' + (msg.content || '');
                    });
                    sections.push({ title: '线下见面记录', content: chatLines.join('\n') });
                }
    
                // 日记
                if (_memoirChecked('memoir-chk-diary') && store.diaries && store.diaries[contactId]) {
                    var diaries = store.diaries[contactId];
                    var diaryLines = diaries.map(function(d) {
                        var date = d.date ? new Date(d.date).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
                        var title = d.title || '';
                        return (date ? date : '') + (title ? ' — ' + title : '') + '\n' + (d.content || '');
                    });
                    sections.push({ title: '日记', content: diaryLines.join('\n\n') });
                }
    
                // 情侣日记
                if (_memoirChecked('memoir-chk-couple')) {
                    var coupleSpace = null;
                    if (store.coupleSpaces) {
                        for (var k in store.coupleSpaces) {
                            if (store.coupleSpaces[k] && store.coupleSpaces[k].contactId === contactId) { coupleSpace = store.coupleSpaces[k]; break; }
                        }
                    }
                    if (coupleSpace && coupleSpace.diaries && coupleSpace.diaries.length > 0) {
                        var cdLines = coupleSpace.diaries.map(function(d) {
                            var date = d.date ? new Date(d.date).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
                            return (date ? date : '') + (d.title ? ' — ' + d.title : '') + '\n' + (d.content || '');
                        });
                        sections.push({ title: '情侣日记', content: cdLines.join('\n\n') });
                    }
                }
    
                // 旅行日记
                if (_memoirChecked('memoir-chk-travel') && store.ticketWallet && store.ticketWallet[contactId]) {
                    var tickets = (store.ticketWallet[contactId].tickets || []).filter(function(t) { return t.diary; });
                    if (tickets.length > 0) {
                        var tLines = tickets.map(function(t) {
                            var route = (t.fromCity || '') + ' → ' + (t.toCity || '');
                            var info = t.transport ? '(' + t.transport + (t.ticketNo ? ' ' + t.ticketNo : '') + ')' : '';
                            return route + ' ' + info + '\n' + (t.diary || '');
                        });
                        sections.push({ title: '旅行日记', content: tLines.join('\n\n') });
                    }
                }
    
                // 记忆总结 - [FIX-记忆丢失] 优先从新记忆系统获取（包含归档），兜底用旧结构
                if (_memoirChecked('memoir-chk-memory')) {
                    var mems = [];
                    if (typeof window.MemorySystem === 'object' && window.MemorySystem && window.MemorySystem.Store) {
                        var _expMem = window.MemorySystem.Store.getContactMem(contactId);
                        if (_expMem) {
                            var _allMems = [].concat(_expMem.core, _expMem.long, _expMem.short, _expMem.archive);
                            mems = _allMems.map(function(m) {
                                return { date: m.createdAt, content: m.content, tier: m.tier, fictional: m.fictional };
                            });
                        }
                    }
                    if (mems.length === 0 && store.memorySummaries && store.memorySummaries[contactId]) {
                        mems = store.memorySummaries[contactId];
                    }
                    if (mems.length > 0) {
                        var memLines = mems.map(function(m) {
                            var date = m.date ? new Date(m.date).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
                            var tierLabel = m.tier ? ({core:'[核心]',long:'[长期]',short:'[短期]',archive:'[归档]'}[m.tier]||'') : '';
                            return (date ? date : '') + (tierLabel ? ' ' + tierLabel : '') + '\n' + (m.summary || m.content || '');
                        });
                        sections.push({ title: '记忆总结', content: memLines.join('\n\n') });
                    }
                }
    
                // 心声记录（线上+线下）
                if (_memoirChecked('memoir-chk-heart')) {
                    var heartItems = [];
                    // 线上聊天心声
                    var _expChats = store.chats && store.chats[contactId] ? store.chats[contactId] : [];
                    for (var _ei = 0; _ei < _expChats.length; _ei++) {
                        var _em = _expChats[_ei];
                        if (_em.heart && _em.sender !== 'user' && _em.sender !== 'me') {
                            heartItems.push({ heart: _em.heart, time: _em.time, source: '线上', content: _em.content });
                        }
                    }
                    // 线下聊天心声
                    var _expOffline = store.offlineChats && store.offlineChats[contactId] ? store.offlineChats[contactId] : [];
                    for (var _ej = 0; _ej < _expOffline.length; _ej++) {
                        var _om = _expOffline[_ej];
                        if (_om.heart && _om.role !== 'user') {
                            heartItems.push({ heart: _om.heart, time: _om.time, source: '线下', content: _om.content });
                        }
                    }
                    if (heartItems.length > 0) {
                        heartItems.sort(function(a, b) { return (a.time || 0) - (b.time || 0); });
                        var heartLines = heartItems.map(function(h) {
                            var time = h.time ? new Date(h.time).toLocaleString('zh-CN') : '';
                            var parts = (h.heart || '').split('|');
                            var loc = parts[0] ? parts[0].trim() : '';
                            var outfit = parts[1] ? parts[1].trim() : '';
                            var status = parts[2] ? parts[2].trim() : '';
                            var thought = parts.length >= 4 ? parts[3].trim() : (parts[0] || '').trim();
                            return (time ? '[' + time + '] ' : '') + '(' + h.source + ')\n'
                                + (loc ? '📍 ' + loc : '') + (outfit ? ' | 👕 ' + outfit : '') + (status ? ' | ' + status : '') + '\n'
                                + '💭 ' + thought;
                        });
                        sections.push({ title: '💗 心声记录', content: heartLines.join('\n\n') });
                    }
                }
    
                // 朋友圈
                if (_memoirChecked('memoir-chk-moments') && store.moments) {
                    var moments = store.moments.filter(function(m) { return m.name === c.name; });
                    if (moments.length > 0) {
                        var moLines = moments.map(function(m) {
                            var date = m.time ? new Date(m.time).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
                            return (date ? date : '') + '\n' + (m.content || '');
                        });
                        sections.push({ title: '朋友圈动态', content: moLines.join('\n\n') });
                    }
                }
    
                if (sections.length === 0) {
                    if (typeof toast === 'function') toast('没有选择任何内容');
                    return;
                }
    
                var output = '';
                var filename = '与' + cName + '的回忆录';
                var dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
                var mimeType = 'text/plain';
    
                if (format === 'txt') {
                    output = '与 ' + cName + ' 的回忆录\n导出时间：' + dateStr + '\n';
                    output += '────────────────────────\n\n';
                    sections.forEach(function(s) {
                        output += '[ ' + s.title + ' ]\n\n' + s.content + '\n\n────────────────────────\n\n';
                    });
                    filename += '.txt';
                    mimeType = 'text/plain;charset=utf-8';
                } else if (format === 'md') {
                    output = '# 与 ' + cName + ' 的回忆录\n> 导出时间：' + dateStr + '\n\n---\n\n';
                    sections.forEach(function(s) {
                        output += '## ' + s.title + '\n\n' + s.content + '\n\n---\n\n';
                    });
                    filename += '.md';
                    mimeType = 'text/markdown;charset=utf-8';
                } else if (format === 'html') {
                    output = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>与 ' + _htmlEsc(cName) + ' 的回忆录</title>'
                        + '<style>body{font-family:-apple-system,sans-serif;max-width:640px;margin:40px auto;padding:0 20px;color:#111;line-height:1.8;}'
                        + 'h1{font-size:22px;font-weight:600;margin-bottom:4px;}h2{font-size:16px;font-weight:600;margin-top:32px;padding-bottom:8px;border-bottom:1px solid #e5e5e5;}'
                        + '.meta{font-size:13px;color:#999;margin-bottom:24px;}pre{white-space:pre-wrap;font-family:inherit;font-size:14px;}'
                        + '@media print{body{margin:20px;}}</style></head><body>'
                        + '<h1>与 ' + _htmlEsc(cName) + ' 的回忆录</h1><div class="meta">导出时间：' + dateStr + '</div>';
                    sections.forEach(function(s) {
                        output += '<h2>' + _htmlEsc(s.title) + '</h2><pre>' + _htmlEsc(s.content) + '</pre>';
                    });
                    output += '</body></html>';
                    filename += '.html';
                    mimeType = 'text/html;charset=utf-8';
                }
    
                // 触发下载
                var blob = new Blob([output], { type: mimeType });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
    
                // 关闭弹窗
                var modal = document.getElementById('modal-memoir-export');
                if (modal) modal.remove();
                if (typeof toast === 'function') toast('导出成功');
            }
            window.doMemoirExport = doMemoirExport;
    
            function _memoirChecked(id) {
                var el = document.getElementById(id);
                return el && el.checked;
            }
    
            function _htmlEsc(str) {
                if (!str) return '';
                return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            }

        // [SMS-FEAT-6] 小号管理 UI（从联系人资料页入口）
        window.openSmsAltPhoneManager = function(contactId) {
            var c = store.contacts.find(function(x) { return x.id === contactId; });
            if (!c) return;
            if (!c.altPhones) c.altPhones = [];
            var mask = document.createElement('div');
            mask.className = 'modal-mask';
            mask.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
            mask.onclick = function(e) { if (e.target === mask) mask.remove(); };
            function render() {
                var phones = c.altPhones || [];
                var listHtml = phones.length === 0
                    ? '<div style="text-align:center;padding:30px 0;color:#999;font-size:13px;">暂无小号</div>'
                    : phones.map(function(p, i) {
                        return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f0f0f0;">'
                            + '<div style="flex:1;"><div style="font-size:14px;font-weight:500;">' + _htmlEsc(p.label || p.phone) + '</div>'
                            + '<div style="font-size:12px;color:#999;">' + _htmlEsc(p.phone) + ' · ' + _htmlEsc(p.purpose || '试探') + '</div></div>'
                            + '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:#666;"><input type="checkbox" ' + (p.enabled ? 'checked' : '') + ' onchange="smsToggleAltPhone(\'' + contactId + '\',' + i + ',this.checked)"> 启用</label>'
                            + '<button onclick="smsRemoveAltPhone(\'' + contactId + '\',' + i + ')" style="background:none;border:none;color:#ff3b30;font-size:14px;cursor:pointer;"><i class="fas fa-trash"></i></button>'
                            + '</div>';
                    }).join('');
                mask.innerHTML = '<div style="width:85%;max-width:400px;max-height:70vh;background:#fff;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;">'
                    + '<div style="padding:16px;text-align:center;border-bottom:1px solid #f0f0f0;font-weight:600;">短信小号管理 - ' + _htmlEsc(c.name) + '</div>'
                    + '<div style="padding:16px;overflow-y:auto;flex:1;">' + listHtml + '</div>'
                    + '<div style="padding:12px 16px;border-top:1px solid #f0f0f0;display:flex;gap:8px;">'
                    + '<button onclick="smsAddAltPhone(\'' + contactId + '\')" style="flex:1;padding:10px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;"><i class="fas fa-plus"></i> 添加小号</button>'
                    + '<button onclick="this.closest(\'.modal-mask\').remove()" style="padding:10px 16px;background:#f0f0f0;border:none;border-radius:8px;font-size:14px;cursor:pointer;">关闭</button>'
                    + '</div></div>';
            }
            render();
            document.body.appendChild(mask);
            window._smsAltPhoneMask = mask;
            window._smsAltPhoneRender = render;
        };
        window.smsAddAltPhone = function(contactId) {
            var c = store.contacts.find(function(x) { return x.id === contactId; });
            if (!c) return;
            if (!c.altPhones) c.altPhones = [];
            var phone = prompt('输入小号手机号（如 159****1234）：');
            if (!phone || !phone.trim()) return;
            var label = prompt('小号标签（如"工作号"，可留空）：') || '';
            var purpose = prompt('用途（如"试探""关心"，可留空）：') || '试探';
            c.altPhones.push({ id: 'alt_' + Date.now(), phone: phone.trim(), label: label.trim(), purpose: purpose.trim(), enabled: true });
            save();
            if (typeof toast === 'function') toast('小号已添加', 'success');
            if (window._smsAltPhoneRender) window._smsAltPhoneRender();
        };
        window.smsToggleAltPhone = function(contactId, idx, enabled) {
            var c = store.contacts.find(function(x) { return x.id === contactId; });
            if (!c || !c.altPhones || !c.altPhones[idx]) return;
            c.altPhones[idx].enabled = enabled;
            save();
        };
        window.smsRemoveAltPhone = function(contactId, idx) {
            var c = store.contacts.find(function(x) { return x.id === contactId; });
            if (!c || !c.altPhones) return;
            c.altPhones.splice(idx, 1);
            save();
            if (typeof toast === 'function') toast('已删除', 'success');
            if (window._smsAltPhoneRender) window._smsAltPhoneRender();
        };
    
