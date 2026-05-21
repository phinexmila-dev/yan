        // ===== 红包系统 =====
        let _rpCurrentMsgIdx = -1;
        let _rpSelectedType = 'random'; // random, equal, exclusive
        let _rpCoverData = null;

        function showTransferOrRedpacket() {
            document.getElementById('modal-transfer-or-redpacket').style.display = 'flex';
        }

        function openRedpacketSend() {
            const currentChat = store.contacts.find(c => c.id === activeChatId);
            const isGroup = currentChat?.isGroup;
            const modal = document.getElementById('modal-redpacket-send');
            
            // Reset form
            document.getElementById('rp-amount').value = '';
            document.getElementById('rp-greeting').value = '';
            _rpSelectedType = 'random';
            _rpCoverData = null;
            document.getElementById('rp-cover-icon').style.display = '';
            document.getElementById('rp-cover-preview').style.backgroundImage = '';
            
            if (isGroup) {
                document.getElementById('rp-send-title').textContent = '发群红包';
                document.getElementById('rp-type-selector').style.display = 'block';
                document.getElementById('rp-count-row').style.display = 'block';
                document.getElementById('rp-max-hint').textContent = '(最高5200元)';
                document.getElementById('rp-count').value = '';
                // Reset type selector
                document.querySelectorAll('.rp-type-btn').forEach(b => b.classList.remove('active'));
                document.querySelector('.rp-type-btn[data-type="random"]').classList.add('active');
                document.getElementById('rp-exclusive-target').style.display = 'none';
                // Populate member list for exclusive
                const select = document.getElementById('rp-target-select');
                select.innerHTML = '';
                (currentChat.members || []).forEach(memberId => {
                    const member = store.contacts.find(c => c.id === memberId);
                    if (member) {
                        const opt = document.createElement('option');
                        opt.value = memberId;
                        opt.textContent = (currentChat.groupNicknames && currentChat.groupNicknames[memberId]) || member.name;
                        select.appendChild(opt);
                    }
                });
            } else {
                document.getElementById('rp-send-title').textContent = '发红包';
                document.getElementById('rp-type-selector').style.display = 'none';
                document.getElementById('rp-count-row').style.display = 'none';
                document.getElementById('rp-max-hint').textContent = '(最高520元)';
                document.getElementById('rp-exclusive-target').style.display = 'none';
            }
            
            modal.style.display = 'flex';
        }

        function selectRpType(type) {
            _rpSelectedType = type;
            document.querySelectorAll('.rp-type-btn').forEach(b => b.classList.remove('active'));
            document.querySelector(`.rp-type-btn[data-type="${type}"]`).classList.add('active');
            
            if (type === 'exclusive') {
                document.getElementById('rp-exclusive-target').style.display = 'block';
                document.getElementById('rp-count-row').style.display = 'none';
            } else {
                document.getElementById('rp-exclusive-target').style.display = 'none';
                document.getElementById('rp-count-row').style.display = 'block';
            }
        }

        function handleRpCoverUpload(input) {
            if (!input.files || !input.files[0]) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                _rpCoverData = e.target.result;
                const preview = document.getElementById('rp-cover-preview');
                preview.style.backgroundImage = `url(${_rpCoverData})`;
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                document.getElementById('rp-cover-icon').style.display = 'none';
            };
            reader.readAsDataURL(input.files[0]);
        }

        function confirmSendRedpacket() {
            const currentChat = store.contacts.find(c => c.id === activeChatId);
            const isGroup = currentChat?.isGroup;
            const amount = parseFloat(document.getElementById('rp-amount').value);
            const greeting = document.getElementById('rp-greeting').value.trim() || '恭喜发财，大吉大利';
            const maxAmt = isGroup ? 5200 : 520;
            
            if (!amount || amount <= 0) return showToast('请输入有效金额', 'error');
            if (amount > maxAmt) return showToast(`金额不能超过${maxAmt}元`, 'error');
            if (store.user.balance < amount) return showToast('余额不足', 'error');
            
            let rpData = {
                id: 'rp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                amount: amount,
                greeting: greeting,
                cover: _rpCoverData || null,
                senderName: store.user.name || '我',
                sendTime: Date.now(),
                claimed: [], // { userId, userName, amount, time }
            };
            
            if (isGroup) {
                const count = _rpSelectedType === 'exclusive' ? 1 : parseInt(document.getElementById('rp-count').value);
                if (!count || count <= 0) return showToast('请输入红包个数', 'error');
                if (_rpSelectedType !== 'exclusive' && count > (currentChat.members?.length || 1) + 1) {
                    return showToast('红包个数不能超过群成员数', 'error');
                }
                rpData.type = _rpSelectedType; // random, equal, exclusive
                rpData.totalCount = count;
                rpData.remaining = amount;
                if (_rpSelectedType === 'exclusive') {
                    rpData.targetId = document.getElementById('rp-target-select').value;
                    rpData.targetName = document.getElementById('rp-target-select').selectedOptions[0]?.textContent || '';
                    rpData.totalCount = 1;
                }
            } else {
                rpData.type = 'private';
                rpData.totalCount = 1;
                rpData.remaining = amount;
            }
            
            // Deduct balance
            store.user.balance -= amount;
            store.bills.push({ type: 'out', amt: amount, desc: `发红包${isGroup ? '(群)' : ''}`, time: Date.now() });
            
            // Store redpacket data
            if (!store.redpackets) store.redpackets = {};
            store.redpackets[rpData.id] = rpData;
            
            // Send as message
            if (!store.chats[activeChatId]) store.chats[activeChatId] = [];
            const msgObj = {
                sender: 'me',
                type: 'redpacket',
                content: rpData.id,
                rpGreeting: greeting,
                rpAmount: amount,
                rpType: rpData.type,
                rpCover: rpData.cover,
                time: Date.now()
            };
            store.chats[activeChatId].push(msgObj);
            
            save();
            renderHistory();
            _lastRenderedMsgCount[activeChatId] = store.chats[activeChatId].length;
            document.getElementById('modal-redpacket-send').style.display = 'none';
            showToast('红包已发出', 'success');
            
            // Auto scroll
            const hist = document.getElementById('chat-history');
            if (hist) setTimeout(() => hist.scrollTop = hist.scrollHeight, 100);
            
            // AI auto-claim in private chat after a short delay
            if (!isGroup) {
                setTimeout(() => {
                    _aiClaimRedpacket(activeChatId, rpData.id, activeChatId);
                }, 1500 + Math.random() * 2000);
            } else {
                // Group chat: AI members auto-claim
                setTimeout(() => {
                    _aiGroupClaimRedpacket(activeChatId, rpData.id);
                }, 1000 + Math.random() * 1500);
            }
        }

        // AI自动领取私聊红包
        function _aiClaimRedpacket(chatId, rpId, contactId) {
            if (!store.redpackets || !store.redpackets[rpId]) return;
            const rp = store.redpackets[rpId];
            if (rp.claimed.length >= rp.totalCount) return;
            
            const contact = store.contacts.find(c => c.id === contactId);
            if (!contact) return;
            
            const claimAmt = rp.remaining;
            rp.claimed.push({
                userId: contactId,
                userName: contact.name,
                amount: claimAmt,
                time: Date.now()
            });
            rp.remaining = 0;
            
            save();
            renderHistory();
        }

        // AI群聊自动领取红包（模拟多人抢红包）
        function _aiGroupClaimRedpacket(chatId, rpId) {
            if (!store.redpackets || !store.redpackets[rpId]) return;
            const rp = store.redpackets[rpId];
            const group = store.contacts.find(c => c.id === chatId);
            if (!group || !group.isGroup) return;
            
            let eligibleMembers = [...(group.members || [])];
            
            // 专属红包只有目标能领
            if (rp.type === 'exclusive') {
                eligibleMembers = eligibleMembers.filter(id => id === rp.targetId);
            }
            
            // 随机排序
            eligibleMembers.sort(() => Math.random() - 0.5);
            
            // 模拟依次抢红包
            let delay = 0;
            const maxClaim = Math.min(eligibleMembers.length, rp.totalCount - rp.claimed.length);
            
            for (let i = 0; i < maxClaim; i++) {
                delay += 800 + Math.random() * 2000;
                const memberId = eligibleMembers[i];
                setTimeout(() => {
                    if (!store.redpackets[rpId] || rp.remaining <= 0) return;
                    if (rp.claimed.find(c => c.userId === memberId)) return;
                    
                    const member = store.contacts.find(c => c.id === memberId);
                    if (!member) return;
                    
                    let claimAmt;
                    if (rp.type === 'equal') {
                        claimAmt = Math.round((rp.amount / rp.totalCount) * 100) / 100;
                    } else if (rp.type === 'exclusive') {
                        claimAmt = rp.remaining;
                    } else {
                        // 拼手气随机分配
                        const remainCount = rp.totalCount - rp.claimed.length;
                        if (remainCount === 1) {
                            claimAmt = Math.round(rp.remaining * 100) / 100;
                        } else {
                            const maxSingle = rp.remaining - (remainCount - 1) * 0.01;
                            claimAmt = Math.round((Math.random() * maxSingle * 0.8 + 0.01) * 100) / 100;
                            claimAmt = Math.min(claimAmt, rp.remaining - (remainCount - 1) * 0.01);
                            claimAmt = Math.max(claimAmt, 0.01);
                        }
                    }
                    
                    rp.remaining = Math.round((rp.remaining - claimAmt) * 100) / 100;
                    rp.claimed.push({
                        userId: memberId,
                        userName: (group.groupNicknames && group.groupNicknames[memberId]) || member.name,
                        amount: claimAmt,
                        time: Date.now()
                    });
                    
                    save();
                    if (chatId === activeChatId) renderHistory();
                }, delay);
            }
        }

        // 用户点击红包
        function onRedpacketClick(idx) {
            if (!store.chats[activeChatId]) return;
            const m = store.chats[activeChatId][idx];
            if (!m || m.type !== 'redpacket') return;
            
            const rpId = m.content;
            if (!store.redpackets) store.redpackets = {};
            const rp = store.redpackets[rpId];
            
            if (!rp) {
                showToast('红包数据不存在', 'error');
                return;
            }
            
            const isMeSender = m.sender === 'me';
            const currentChat = store.contacts.find(c => c.id === activeChatId);
            const isGroup = currentChat?.isGroup;
            
            // 检查用户是否已领过
            const myClaim = rp.claimed.find(c => c.userId === '__me__');
            
            // 如果是自己发的红包，或者已经领过，显示详情
            if (isMeSender || myClaim) {
                showRedpacketDetail(rpId, m.sender);
                return;
            }
            
            // 检查红包是否已被领完
            if (rp.claimed.length >= rp.totalCount || rp.remaining <= 0) {
                showToast('红包已被领完', 'info');
                showRedpacketDetail(rpId, m.sender);
                return;
            }
            
            // 专属红包检查
            if (rp.type === 'exclusive' && !isGroup) {
                // Private chat, user can claim
            } else if (rp.type === 'exclusive' && isGroup) {
                // 群聊专属红包 - 这里用户可以领（模拟为用户本人）
            }
            
            // 显示开红包界面
            _rpCurrentMsgIdx = idx;
            const senderContact = m.sender === 'me' ? null : store.contacts.find(c => c.id === (isGroup ? m.sender : activeChatId));
            // 修复：我的头像应跟随人设而非微信头像
            let senderAvatar;
            if (m.sender === 'me') {
                const _rpContact = store.contacts.find(c => c.id === activeChatId);
                const _rpPersonaId = _rpContact?.settings?.userPersona;
                const _rpPersona = _rpPersonaId ? (store.personas || []).find(p => p.id === _rpPersonaId) : null;
                senderAvatar = (_rpPersona?.avatar) || store.user.avatar || _ph(50);
            } else {
                senderAvatar = senderContact?.avatar || _ph(50);
            }
            // 修复：发红包给联系人时显示挂载的人设名称
            let senderName;
            if (m.sender === 'me') {
                const _rpContact = store.contacts.find(c => c.id === activeChatId);
                const _rpPersonaId = _rpContact?.settings?.userPersona;
                const _rpPersona = _rpPersonaId ? (store.personas || []).find(p => p.id === _rpPersonaId) : null;
                senderName = (_rpPersona ? _rpPersona.name : null) || store.user.name || '我';
            } else {
                senderName = senderContact?.name || '未知';
            }
            
            document.getElementById('rp-open-avatar').src = senderAvatar;
            document.getElementById('rp-open-sender').textContent = senderName + '的红包';
            document.getElementById('rp-open-greeting').textContent = rp.greeting;
            document.getElementById('rp-open-btn').style.display = 'flex';
            document.getElementById('rp-open-status').style.display = 'none';
            
            // Apply cover if exists
            const topEl = document.getElementById('rp-open-top');
            if (rp.cover) {
                topEl.style.backgroundImage = `url(${rp.cover})`;
                topEl.style.backgroundSize = 'cover';
                topEl.style.backgroundPosition = 'center';
            } else {
                topEl.style.backgroundImage = '';
            }
            
            document.getElementById('modal-redpacket-open').style.display = 'flex';
        }

        // 用户领取红包
        function claimRedpacket() {
            if (_rpCurrentMsgIdx === -1) return;
            const m = store.chats[activeChatId][_rpCurrentMsgIdx];
            if (!m) return;
            
            const rpId = m.content;
            const rp = store.redpackets[rpId];
            if (!rp) return;
            
            if (rp.claimed.find(c => c.userId === '__me__')) {
                showToast('你已经领过了', 'info');
                document.getElementById('modal-redpacket-open').style.display = 'none';
                showRedpacketDetail(rpId, m.sender);
                return;
            }
            
            if (rp.remaining <= 0 || rp.claimed.length >= rp.totalCount) {
                showToast('红包已被领完', 'info');
                document.getElementById('modal-redpacket-open').style.display = 'none';
                return;
            }
            
            // Calculate claim amount
            let claimAmt;
            const currentChat = store.contacts.find(c => c.id === activeChatId);
            const isGroup = currentChat?.isGroup;
            
            if (!isGroup || rp.type === 'private') {
                claimAmt = rp.remaining;
            } else if (rp.type === 'equal') {
                claimAmt = Math.round((rp.amount / rp.totalCount) * 100) / 100;
            } else if (rp.type === 'exclusive') {
                claimAmt = rp.remaining;
            } else {
                // 拼手气
                const remainCount = rp.totalCount - rp.claimed.length;
                if (remainCount === 1) {
                    claimAmt = Math.round(rp.remaining * 100) / 100;
                } else {
                    const maxSingle = rp.remaining - (remainCount - 1) * 0.01;
                    claimAmt = Math.round((Math.random() * maxSingle * 0.8 + 0.01) * 100) / 100;
                    claimAmt = Math.min(claimAmt, rp.remaining - (remainCount - 1) * 0.01);
                    claimAmt = Math.max(claimAmt, 0.01);
                }
            }
            
            rp.remaining = Math.round((rp.remaining - claimAmt) * 100) / 100;
            rp.claimed.push({
                userId: '__me__',
                userName: store.user.name || '我',
                amount: claimAmt,
                time: Date.now()
            });
            
            // Add to user balance
            store.user.balance += claimAmt;
            store.bills.push({ type: 'in', amt: claimAmt, desc: '领取红包', time: Date.now() });
            
            save();
            
            // Animate open
            document.getElementById('rp-open-btn').style.display = 'none';
            document.getElementById('rp-open-status').style.display = 'block';
            document.getElementById('rp-open-status').innerHTML = `<div style="font-size:24px; color:#e74c3c; font-weight:bold;">¥${claimAmt.toFixed(2)}</div><div style="margin-top:5px;">已存入零钱</div>`;
            
            showToast(`领取了 ¥${claimAmt.toFixed(2)}`, 'success');
            renderHistory();
            
            // 延迟后显示详情
            setTimeout(() => {
                document.getElementById('modal-redpacket-open').style.display = 'none';
                showRedpacketDetail(rpId, m.sender);
            }, 1500);
        }

        // 显示红包详情
        function showRedpacketDetail(rpId, senderId) {
            const rp = store.redpackets[rpId];
            if (!rp) return;
            
            const currentChat = store.contacts.find(c => c.id === activeChatId);
            const isGroup = currentChat?.isGroup;
            const isMeSender = senderId === 'me';
            
            // Sender info
            let senderAvatar, senderName;
            if (isMeSender) {
                // 修复：红包详情头像也跟随人设
                const _rdContact = store.contacts.find(c => c.id === activeChatId);
                const _rdPersonaId = _rdContact?.settings?.userPersona;
                const _rdPersona = _rdPersonaId ? (store.personas || []).find(p => p.id === _rdPersonaId) : null;
                senderAvatar = (_rdPersona?.avatar) || store.user.avatar || _ph(50);
                senderName = (_rdPersona ? _rdPersona.name : null) || store.user.name || '我';
            } else {
                const senderContact = isGroup ? store.contacts.find(c => c.id === senderId) : store.contacts.find(c => c.id === activeChatId);
                senderAvatar = senderContact?.avatar || _ph(50);
                senderName = senderContact?.name || '未知';
            }
            
            document.getElementById('rp-detail-avatar').src = senderAvatar;
            document.getElementById('rp-detail-sender').textContent = senderName + '的红包';
            document.getElementById('rp-detail-greeting').textContent = rp.greeting;
            
            // My claim amount
            const myClaim = rp.claimed.find(c => c.userId === '__me__');
            if (myClaim) {
                document.getElementById('rp-detail-my-amt').innerHTML = `¥${myClaim.amount.toFixed(2)}`;
            } else if (isMeSender) {
                document.getElementById('rp-detail-my-amt').innerHTML = `¥${rp.amount.toFixed(2)}<div style="font-size:12px; opacity:0.8; margin-top:2px;">发出的红包</div>`;
            } else {
                document.getElementById('rp-detail-my-amt').textContent = '';
            }
            
            // Summary
            const claimedCount = rp.claimed.length;
            const totalCount = rp.totalCount;
            const claimedAmt = rp.claimed.reduce((sum, c) => sum + c.amount, 0);
            let summaryText = `已领 ${claimedCount}/${totalCount} 个，共 ¥${claimedAmt.toFixed(2)}`;
            if (rp.remaining > 0 && claimedCount < totalCount) {
                summaryText += ` | 剩余 ¥${rp.remaining.toFixed(2)}`;
            } else if (claimedCount >= totalCount) {
                summaryText += ' | 已领完';
            }
            document.getElementById('rp-detail-summary').textContent = summaryText;
            
            // Claim list
            const listEl = document.getElementById('rp-detail-list');
            let listHtml = '';
            // Sort by time
            const sortedClaims = [...rp.claimed].sort((a, b) => a.time - b.time);
            
            // Find lucky king (highest amount) for random type in group
            let luckyKingId = null;
            if (isGroup && rp.type === 'random' && rp.claimed.length >= rp.totalCount) {
                let maxAmt = 0;
                rp.claimed.forEach(c => {
                    if (c.amount > maxAmt) {
                        maxAmt = c.amount;
                        luckyKingId = c.userId;
                    }
                });
            }
            
            sortedClaims.forEach(claim => {
                const isLucky = claim.userId === luckyKingId;
                let avatar = _ph(40);
                if (claim.userId === '__me__') {
                    avatar = store.user.avatar || avatar;
                } else {
                    const cc = store.contacts.find(c => c.id === claim.userId);
                    if (cc) avatar = cc.avatar || avatar;
                }
                
                const timeStr = new Date(claim.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                listHtml += `<div style="display:flex; align-items:center; padding:10px 0; border-bottom:1px solid #f5f5f5;">
                    <img src="${avatar}" style="width:36px; height:36px; border-radius:50%; margin-right:10px; object-fit:cover;">
                    <div style="flex:1;">
                        <div style="font-size:14px; font-weight:500;">${claim.userName}${isLucky ? ' <span style="color:#e67e22; font-size:12px;">👑 手气最佳</span>' : ''}</div>
                        <div style="font-size:11px; color:#aaa;">${timeStr}</div>
                    </div>
                    <div style="font-size:15px; font-weight:bold; color:#333;">¥${claim.amount.toFixed(2)}</div>
                </div>`;
            });
            listEl.innerHTML = listHtml || '<div style="text-align:center; color:#ccc; padding:20px;">暂无领取记录</div>';
            
            // Lucky king display for group random
            const luckyEl = document.getElementById('rp-detail-lucky-king');
            if (luckyKingId && isGroup && rp.type === 'random') {
                const luckyName = rp.claimed.find(c => c.userId === luckyKingId)?.userName || '未知';
                luckyEl.style.display = 'block';
                luckyEl.innerHTML = `👑 ${luckyName} 是手气最佳！`;
            } else {
                luckyEl.style.display = 'none';
            }
            
            document.getElementById('modal-redpacket-detail').style.display = 'flex';
        }

        // ===== 心声卡片 HTML 构建器（私聊/群聊/线上/线下共用） =====
        function _heartCardHTML(opts) {
            // opts: { name, avatar, desc, heartData[], historyFn, isGroup?, members?[], switchFn?, refreshFn? }
            const hd = opts.heartData || [];
            const loc = hd[0] || '', outfit = hd[1] || '', status = hd[2] || '';
            const thought = (hd[3] || '无想法').replace(/\|+$/g, '');
            const _needTrans = typeof shouldShowTranslateBtn === 'function' && shouldShowTranslateBtn(thought);
            const avatarUrl = opts.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent((opts.name||'?')[0]) + '&background=e8e8ea&color=0a0a0a&size=120';
            const histFn = opts.historyFn || 'openHeartHistory()';

            let html = '<div class="heart-popup-card">';
            // 头部
            html += `<div class="heart-popup-head">
                <img class="heart-popup-avatar" src="${avatarUrl}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent((opts.name||'?')[0])}&background=e8e8ea&color=0a0a0a&size=120'">
                <div class="heart-popup-info">
                    <div class="heart-popup-name">${opts.name || '未知'}</div>
                    <div class="heart-popup-sub">${opts.desc || ''}</div>
                </div>
                <div class="heart-popup-head-actions">`;
            // [FIX-刷新按钮位置] 群聊刷新按钮移到右上角（与关闭按钮并列）
            if (opts.isGroup && opts.refreshFn) {
                html += `<div class="heart-popup-refresh" onclick="${opts.refreshFn};document.getElementById('modal-thought').style.display='none';" title="刷新心声"><i class="fas fa-sync-alt"></i></div>`;
            }
            html += `<div class="heart-popup-close" onclick="document.getElementById('modal-thought').style.display='none'"><i class="fas fa-times"></i></div>
                </div>
            </div>`;
            // 群聊成员 Tab
            if (opts.isGroup && opts.members && opts.members.length > 1) {
                const sfn = opts.switchFn || 'switchGroupHeart';
                html += '<div class="heart-popup-members">';
                opts.members.forEach((m, i) => {
                    html += `<div class="heart-popup-member-tab ${i === 0 ? 'active' : ''}" data-idx="${i}" onclick="${sfn}(${i})">
                        <img src="${m.avatar}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent((m.name||'?')[0])}&background=e8e8ea&color=0a0a0a&size=80'">
                        <span class="mname">${m.name}</span>
                    </div>`;
                });
                html += '</div>';
            }
            // 状态栏
            if (loc || outfit || status) {
                html += '<div class="heart-popup-meta" id="heart-popup-tags">';
                if (loc) html += `<div class="heart-popup-meta-row"><i class="fas fa-map-marker-alt"></i><span class="label">位置</span><span class="value">${loc}</span><span class="heart-tag-translated"></span></div>`;
                if (outfit) html += `<div class="heart-popup-meta-row"><i class="fas fa-tshirt"></i><span class="label">穿着</span><span class="value">${outfit}</span><span class="heart-tag-translated"></span></div>`;
                if (status) html += `<div class="heart-popup-meta-row"><i class="fas fa-circle" style="font-size:8px;"></i><span class="label">状态</span><span class="value">${status}</span><span class="heart-tag-translated"></span></div>`;
                html += '</div>';
            }
            // 心声正文
            html += `<div class="heart-popup-body"><span class="thought-quote">${thought}</span>`;
            if (_needTrans) {
                html += `<div class="heart-translate-toggle" id="heart-popup-toggle" onclick="onHeartPopupTranslate(this)"><i class="fas fa-chevron-down"></i> 翻译</div><div class="heart-translation-area" id="heart-popup-trans-area"></div>`;
            }
            html += '</div>';
            // 底部按钮
            html += `<div class="heart-popup-foot">
                <button class="heart-popup-btn" onclick="${histFn}">HISTORY</button>`;
            // [FIX-刷新按钮位置] 刷新按钮已移到右上角，底部不再重复
            // [群聊心声导出] 群聊额外加"导出"按钮
            if (opts.isGroup && opts.exportFn) {
                html += `<button class="heart-popup-btn" onclick="${opts.exportFn}" style="color:#07c160;"><i class="fas fa-download"></i> 导出</button>`;
            }
            html += `<button class="heart-popup-btn primary" onclick="document.getElementById('modal-thought').style.display='none'">CLOSE</button>
            </div>`;
            html += '</div>';
            return { html, thought };
        }

        function showThought() {
            // [FIX-心声弹窗分裂] 打开心声弹窗前主动收起键盘
            // 键盘打开状态下，modal-thought全屏但底层layer只占visibleHeight，
            // 导致"上半阴影+心声、下半正常"的视觉分裂
            try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch(_) {}

            const currentChat = store.contacts.find(c => c.id === activeChatId);
            const isGroup = currentChat?.isGroup;

            if (isGroup) {
                showGroupThought();
            } else {
                const msgs = store.chats[activeChatId]||[];
                let lastMsg = null;
                for(let i=msgs.length-1; i>=0; i--) {
                    if(msgs[i].heart) { lastMsg = msgs[i]; break; }
                }
                if(lastMsg && lastMsg.heart) {
                    const heartData = typeof normalizeHeartData === 'function' ? normalizeHeartData(lastMsg.heart) : lastMsg.heart.split('|');
                    const contact = currentChat || {};
                    const desc = contact.desc ? contact.desc.substring(0, 40) : '';
                    window._heartPopupData = { loc: heartData[0]||'未知', outfit: heartData[1]||'未知', status: heartData[2]||'未知', thought: (heartData[3]||'无想法').replace(/\|+$/g,'') };
                    const card = _heartCardHTML({
                        name: contact.name || '未知',
                        avatar: contact.avatar,
                        desc: desc,
                        heartData: heartData,
                        historyFn: 'openHeartHistory()'
                    });
                    document.getElementById('thought-text').innerHTML = card.html;
                    document.getElementById('modal-thought').style.display = 'flex';
                } else {
                    toast("暂无心声记录");
                }
            }
        }

        // [NEW-群聊心声] 群聊多人心声弹窗
        function showGroupThought() {
            const msgs = store.chats[activeChatId] || [];
            const memberHearts = {};
            for (let i = msgs.length - 1; i >= 0 && i >= msgs.length - 30; i--) {
                const m = msgs[i];
                if (m.heart && m.sender && m.sender !== 'me' && m.sender !== 'user' && m.sender !== 'system') {
                    if (!memberHearts[m.sender]) {
                        const contact = store.contacts.find(c => c.id === m.sender);
                        memberHearts[m.sender] = {
                            name: m.senderName || contact?.name || '未知',
                            avatar: contact?.avatar || _ph(40),
                            heart: m.heart,
                            time: m.time
                        };
                    }
                }
            }
            const members = Object.values(memberHearts);
            if (members.length === 0) {
                // [重构-心声分离] 无心声时直接触发刷新
                if (typeof refreshGroupHeartsManual === 'function') {
                    refreshGroupHeartsManual(activeChatId);
                } else {
                    toast("暂无群聊心声记录，请点击刷新");
                }
                return;
            }
            members.sort((a, b) => (b.time || 0) - (a.time || 0));
            window._groupHeartMembers = members;

            // 用第一个成员渲染卡片
            const first = members[0];
            const hd = typeof normalizeHeartData === 'function' ? normalizeHeartData(first.heart) : first.heart.split('|');
            const groupContact = store.contacts.find(c => c.id === activeChatId);
            const card = _heartCardHTML({
                name: first.name,
                avatar: first.avatar,
                desc: groupContact ? groupContact.name : '群聊',
                heartData: hd,
                historyFn: 'openHeartHistory()',
                isGroup: true,
                members: members,
                switchFn: 'switchGroupHeart',
                refreshFn: "refreshGroupHeartsManual('" + activeChatId + "')",
                exportFn: "openGroupHeartExport('" + activeChatId + "')"
            });
            document.getElementById('thought-text').innerHTML = card.html;
            document.getElementById('modal-thought').style.display = 'flex';
        }

        // [NEW-群聊心声] Tab切换
        function switchGroupHeart(idx) {
            const members = window._groupHeartMembers;
            if (!members || !members[idx]) return;
            // 更新 tab 样式
            document.querySelectorAll('.heart-popup-member-tab').forEach(t => {
                const isActive = parseInt(t.dataset.idx) === idx;
                t.classList.toggle('active', isActive);
            });
            // 重建卡片内容（头部+状态+心声）
            const m = members[idx];
            const hd = typeof normalizeHeartData === 'function' ? normalizeHeartData(m.heart) : m.heart.split('|');
            const loc = hd[0]||'', outfit = hd[1]||'', status = hd[2]||'';
            const thought = (hd[3]||'无想法').replace(/\|+$/g,'');
            const _needTrans = typeof shouldShowTranslateBtn === 'function' && shouldShowTranslateBtn(thought);
            // 更新头部
            const headAvatar = document.querySelector('.heart-popup-avatar');
            const headName = document.querySelector('.heart-popup-name');
            if (headAvatar) { headAvatar.src = m.avatar; headAvatar.onerror = function(){ this.src='https://ui-avatars.com/api/?name='+encodeURIComponent((m.name||'?')[0])+'&background=e8e8ea&color=0a0a0a&size=120'; }; }
            if (headName) headName.textContent = m.name;
            // 更新状态栏
            let metaHtml = '';
            if (loc || outfit || status) {
                if (loc) metaHtml += `<div class="heart-popup-meta-row"><i class="fas fa-map-marker-alt"></i><span class="label">位置</span><span class="value">${loc}</span></div>`;
                if (outfit) metaHtml += `<div class="heart-popup-meta-row"><i class="fas fa-tshirt"></i><span class="label">穿着</span><span class="value">${outfit}</span></div>`;
                if (status) metaHtml += `<div class="heart-popup-meta-row"><i class="fas fa-circle" style="font-size:8px;"></i><span class="label">状态</span><span class="value">${status}</span></div>`;
            }
            const metaEl = document.querySelector('.heart-popup-meta');
            if (metaEl) metaEl.innerHTML = metaHtml;
            // 更新心声
            let bodyHtml = `<span class="thought-quote">${thought}</span>`;
            if (_needTrans) bodyHtml += `<div class="heart-translate-toggle" id="heart-popup-toggle" onclick="onHeartPopupTranslate(this)"><i class="fas fa-chevron-down"></i> 翻译</div><div class="heart-translation-area" id="heart-popup-trans-area"></div>`;
            const bodyEl = document.querySelector('.heart-popup-body');
            if (bodyEl) bodyEl.innerHTML = bodyHtml;
            window._heartPopupData = { loc, outfit, status, thought };
        }

        function openHeartHistory() {
            document.getElementById('modal-thought').style.display = 'none';
            // 恢复添加按钮为聊天模式
            const addBtn = document.querySelector('#modal-heart-history .fa-plus-circle');
            if (addBtn) addBtn.parentElement.setAttribute('onclick', 'addHeartHistoryItem()');
            renderHeartHistory();
            document.getElementById('modal-heart-history').style.display = 'flex';
        }

        function renderHeartHistory() {
            const list = document.getElementById('heart-history-list');
            list.innerHTML = '';
            const msgs = store.chats[activeChatId] || [];
            const heartMsgs = msgs.map((m, i) => ({m, i})).filter(item => item.m.heart).reverse();
            const currentChat = store.contacts.find(c => c.id === activeChatId);
            const isGroup = currentChat?.isGroup;

            if (heartMsgs.length === 0) {
                list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">暂无历史记录</div>';
                return;
            }

            list.innerHTML = heartMsgs.map(item => {
                const { m, i } = item;
                const heartData = typeof normalizeHeartData === 'function' ? normalizeHeartData(m.heart) : m.heart.split('|');
                const timeStr = new Date(m.time).toLocaleString();
                const loc = heartData[0] || '';
                const outfit = heartData[1] || '';
                const status = heartData[2] || '';
                const thoughtText = (heartData[3] || '').replace(/\|+$/g, '');
                const _needTrans = typeof shouldShowTranslateBtn === 'function' && shouldShowTranslateBtn(thoughtText);

                // 获取成员信息（群聊/私聊通用）
                let memberName = '', memberAvatar = '';
                if (isGroup && m.sender && m.sender !== 'me' && m.sender !== 'user') {
                    const mc = (typeof _getContact === 'function') ? _getContact(m.sender) : store.contacts.find(c => c.id === m.sender);
                    memberName = m.senderName || mc?.name || '未知';
                    memberAvatar = mc?.avatar || '';
                } else {
                    memberName = currentChat?.name || '未知';
                    memberAvatar = currentChat?.avatar || '';
                }
                if (!memberAvatar) memberAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent((memberName||'?')[0]) + '&background=e8e8ea&color=0a0a0a&size=120';

                let html = `<div class="heart-history-card" onclick="editHeartHistoryItem(${i})">`;
                // 头部
                html += `<div class="heart-popup-head hh-head">
                    <img class="heart-popup-avatar hh-avatar" src="${memberAvatar}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent((memberName||'?')[0])}&background=e8e8ea&color=0a0a0a&size=120'">
                    <div class="heart-popup-info">
                        <div class="heart-popup-name hh-name">${memberName}</div>
                        <div class="heart-popup-sub">${timeStr}</div>
                    </div>
                    <div class="hh-actions">
                        <i class="fas fa-edit" onclick="event.stopPropagation();editHeartHistoryItem(${i})"></i>
                        <i class="fas fa-trash" onclick="event.stopPropagation();deleteHeartHistoryItem(${i})"></i>
                    </div>
                </div>`;
                // 状态标签
                if (loc || outfit || status) {
                    html += '<div class="heart-popup-meta hh-meta">';
                    if (loc) html += `<div class="heart-popup-meta-row"><i class="fas fa-map-marker-alt"></i><span class="label">位置</span><span class="value">${loc}</span><span class="heart-tag-translated"></span></div>`;
                    if (outfit) html += `<div class="heart-popup-meta-row"><i class="fas fa-tshirt"></i><span class="label">穿着</span><span class="value">${outfit}</span><span class="heart-tag-translated"></span></div>`;
                    if (status) html += `<div class="heart-popup-meta-row"><i class="fas fa-circle" style="font-size:8px;"></i><span class="label">状态</span><span class="value">${status}</span><span class="heart-tag-translated"></span></div>`;
                    html += '</div>';
                }
                // 心声正文
                html += `<div class="heart-popup-body hh-body"><span class="thought-quote">${thoughtText}</span>`;
                if (_needTrans) {
                    html += `<div class="heart-translate-toggle" onclick="event.stopPropagation();(function(el){var a=document.getElementById('heart-hist-trans-${i}');var t=el.closest('.heart-history-card').querySelector('.heart-popup-meta');if(t&&!t.dataset.tagsDone){t.dataset.tagsDone='1';translateHeartTags(t,'${(loc).replace(/'/g,"\\'")}','${(outfit).replace(/'/g,"\\'")}','${(status).replace(/'/g,"\\'")}');}toggleHeartTranslation(el,a,${JSON.stringify(thoughtText).replace(/'/g,"\\'")},'hist-${i}');})(this)"><i class="fas fa-chevron-down"></i> 翻译</div><div class="heart-translation-area" id="heart-hist-trans-${i}"></div>`;
                }
                html += '</div></div>';
                return html;
            }).join('');
        }

        let editingHeartMsgIdx = null;

        function editHeartHistoryItem(idx) {
            const m = store.chats[activeChatId][idx];
            if (!m || !m.heart) return;
            
            editingHeartMsgIdx = idx;
            document.getElementById('heart-edit-title').innerText = "编辑心声";
            
            const parts = m.heart.split('|');
            document.getElementById('heart-loc').value = parts[0] || '';
            document.getElementById('heart-outfit').value = parts[1] || '';
            document.getElementById('heart-status').value = parts[2] || '';
            if (parts.length > 4) {
                 document.getElementById('heart-thought').value = (parts[3] || '').replace(/\|+$/g, '');
            } else {
                 document.getElementById('heart-thought').value = parts[3] || '';
            }
            
            document.getElementById('modal-heart-edit').style.display = 'flex';
        }

        function saveHeartEdit() {
            // [FIX] 收起移动端键盘
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            const loc = document.getElementById('heart-loc').value.trim();
            const outfit = document.getElementById('heart-outfit').value.trim();
            const status = document.getElementById('heart-status').value.trim();
            const thought = document.getElementById('heart-thought').value.trim();
            
            if(!loc && !outfit && !status && !thought) return toast("请至少填写一项内容");
            
            const heartStr = `${loc}|${outfit}|${status}|${thought}`;
            
            if (editingHeartMsgIdx !== null) {
                const m = store.chats[activeChatId][editingHeartMsgIdx];
                if (m) {
                    m.heart = heartStr;
                    toast("修改成功");
                }
            } else {
                if(!store.chats[activeChatId]) store.chats[activeChatId] = [];
                store.chats[activeChatId].push({
                    sender: 'ai',
                    type: 'text',
                    content: ' ', 
                    heart: heartStr,
                    time: Date.now(),
                    isHidden: true 
                });
                toast("添加成功");
            }
            
            save();
            renderHeartHistory();
            document.getElementById('modal-heart-edit').style.display = 'none';
        }

        function deleteHeartHistoryItem(idx) {
            showConfirm("删除心声", "确定删除这条心声吗? (消息本身不会被删除)", () => {
                const m = store.chats[activeChatId][idx];
                if (m) {
                    delete m.heart;
                    save();
                    renderHeartHistory();
                    toast("已删除");
                }
            });
        }

        function addHeartHistoryItem() {
            if (!activeChatId) return toast("请先进入聊天");
            editingHeartMsgIdx = null;
            document.getElementById('heart-edit-title').innerText = "添加心声";
            document.getElementById('heart-loc').value = '';
            document.getElementById('heart-outfit').value = '';
            document.getElementById('heart-status').value = '';
            document.getElementById('heart-thought').value = '';
            document.getElementById('modal-heart-edit').style.display = 'flex';
        }
        
        // --- CONTACTS ---
        // --- 获取联系人显示名称（备注优先） ---
        function getContactDisplayName(c) {
            if (!c) return '未知';
            return c.remark || c.name || '未知';
        }
        function getContactDisplayNameById(contactId) {
            const c = store.contacts.find(x => x.id === contactId);
            return getContactDisplayName(c);
        }

        function openContactModal() {
            var _contactModal = document.getElementById('modal-contact');
            // [FIX-iOS点击] 清除可能残留的阻断样式
            _contactModal.style.pointerEvents = '';
            _contactModal.style.visibility = '';
            if (_contactModal.style.zIndex === '-1') _contactModal.style.zIndex = '';
            _contactModal.style.display = 'flex';
            document.getElementById('new-contact-name').value = '';
            document.getElementById('new-contact-persona').value = '';
            document.getElementById('new-contact-img').src = '';
            document.getElementById('new-contact-img').style.display='none';
            const remarkEl = document.getElementById('new-contact-remark');
            const remarkForMeEl = document.getElementById('new-contact-remark-for-me');
            const sigEl = document.getElementById('new-contact-signature');
            if (remarkEl) remarkEl.value = '';
            if (remarkForMeEl) remarkForMeEl.value = '';
            if (sigEl) sigEl.value = '';
            // [性别] 重置
            const gSel = document.getElementById('new-contact-gender');
            const gCustom = document.getElementById('new-contact-gender-custom');
            if (gSel) gSel.value = '';
            if (gCustom) { gCustom.value = ''; gCustom.style.display = 'none'; }
        }
        // [性别] 新建联系人 select 切换
        window._onNewContactGenderChange = function() {
            const sel = document.getElementById('new-contact-gender');
            const cust = document.getElementById('new-contact-gender-custom');
            if (!sel || !cust) return;
            cust.style.display = (sel.value === '__custom__') ? 'block' : 'none';
            if (sel.value !== '__custom__') cust.value = '';
        };
        function createContact() {
            // [FIX] 收起移动端键盘
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            const name = document.getElementById('new-contact-name').value;
            const persona = document.getElementById('new-contact-persona').value;
            const img = document.getElementById('new-contact-img').src;
            const remark = (document.getElementById('new-contact-remark')?.value || '').trim();
            const remarkForMe = (document.getElementById('new-contact-remark-for-me')?.value || '').trim();
            const signature = (document.getElementById('new-contact-signature')?.value || '').trim();
            if(!name) return toast("请输入名字");

            // [性别] 读取
            let genderVal = '';
            const gSel = document.getElementById('new-contact-gender');
            const gCustom = document.getElementById('new-contact-gender-custom');
            if (gSel) {
                if (gSel.value === '__custom__') {
                    genderVal = (gCustom?.value || '').trim();
                } else {
                    genderVal = gSel.value || '';
                }
            }

            const defaultStatuses = ['在线', '忙碌', '离开', '请勿打扰', '隐身'];
            const randomStatus = defaultStatuses[Math.floor(Math.random() * defaultStatuses.length)];
            
            store.contacts.push({
                id: 'c'+Date.now(), name, avatar: img || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
                persona: persona,
                remark: remark || '',
                remarkForMe: remarkForMe || '',
                signature: signature || '',
                gender: genderVal || '',
                status: randomStatus,
                profileBg: '',
                settings: {
                    autoMsg: false, autoMsgInterval: 30, autoMoment: false, autoDiary: false, diaryTime: '22:00', time: '', wb: '', userPersona: 'p1', bg: '', stickerGallery: '',
                    enablePerception: true, userVirtualCity: '', userRealCity: '', aiVirtualCity: '', aiRealCity: '',
                    memoryInterop: true
                },
                pinned: false
            });
            // 🏆 Track contact added for achievements
            if (typeof trackAchievementStat === 'function') trackAchievementStat('contactsAdded');
            save(); renderContacts(); document.getElementById('modal-contact').style.display='none';
        }

