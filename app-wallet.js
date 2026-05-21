        // ===== WALLET SYSTEM =====
        let walletView = 'main'; // main, bills, familyCards, familyCardDetail, sendFamilyCard, requestFamilyCard

        function openWallet() {
            document.getElementById('layer-wallet').classList.add('show');
            if (!store.familyCards) store.familyCards = [];
            if (!store.familyCardRequests) store.familyCardRequests = [];
            walletView = 'main';
            renderWallet();
        }

        function renderWallet() {
            const area = document.getElementById('wallet-main-content');
            if (!area) return;
            switch(walletView) {
                case 'main': renderWalletMain(area); break;
                case 'bills': renderWalletBills(area); break;
                case 'familyCards': renderWalletFamilyCards(area); break;
                case 'sendFamilyCard': renderSendFamilyCard(area); break;
                case 'requestFamilyCard': renderRequestFamilyCard(area); break;
                default: renderWalletMain(area); break;
            }
        }

        function renderWalletMain(area) {
            const balance = (store.user.balance || 0).toFixed(2);
            const userName = store.user.name || '用户';
            const billCount = (store.bills || []).length;
            const familyCardCount = (store.familyCards || []).filter(fc => fc.active).length;

            // 初始化或获取固定的银行卡尾号
            if (!store.user.cardLastFour) {
                store.user.cardLastFour = Math.floor(1000 + Math.random() * 9000).toString();
                save();
            }

            area.innerHTML = `
                <div style="padding:20px 16px 0;">
                    <!-- 黑卡：点击弹出编辑姓名+尾号 -->
                    <div class="wallet-black-card" onclick="editCardInfo()" style="cursor:pointer;">
                        <div class="wallet-card-chip"></div>
                        <div class="wallet-card-logo">YAN PAY</div>
                        <div class="wallet-card-balance-label">账户余额</div>
                        <div class="wallet-card-balance">¥ ${balance}</div>
                        <div class="wallet-card-bottom">
                            <div class="wallet-card-holder">${userName}</div>
                            <div class="wallet-card-number">**** **** **** ${store.user.cardLastFour}</div>
                        </div>
                        <div class="wallet-card-shine"></div>
                    </div>

                    <!-- 充值按钮 -->
                    <button class="wallet-recharge-btn" onclick="openCustomInput('recharge')" style="background:#000;color:#fff;">
                        <i class="fas fa-plus-circle" style="margin-right:8px;"></i>充值
                    </button>

                    <!-- 账单导航 -->
                    <div class="wallet-nav-item" onclick="walletView='bills';renderWallet()">
                        <div class="wallet-nav-icon" style="background:transparent;"><i class="fas fa-receipt" style="color:#262626;font-size:22px;"></i></div>
                        <div class="wallet-nav-info">
                            <div class="wallet-nav-title">账单</div>
                            <div class="wallet-nav-desc">共 ${billCount} 条记录</div>
                        </div>
                        <i class="fas fa-chevron-right" style="color:#ccc;"></i>
                    </div>

                    <!-- 亲属卡导航 -->
                    <div class="wallet-nav-item" onclick="walletView='familyCards';renderWallet()">
                        <div class="wallet-nav-icon" style="background:transparent;"><i class="fas fa-users" style="color:#262626;font-size:22px;"></i></div>
                        <div class="wallet-nav-info">
                            <div class="wallet-nav-title">亲属卡</div>
                            <div class="wallet-nav-desc">${familyCardCount} 张有效亲属卡</div>
                        </div>
                        <i class="fas fa-chevron-right" style="color:#ccc;"></i>
                    </div>
                </div>
            `;
        }

        function editCardInfo() {
            const currentName = store.user.name || '用户';
            const currentCard = store.user.cardLastFour || '';
            // 创建编辑弹窗
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;';
            modal.innerHTML = `
                <div style="background:#fff;border-radius:16px;padding:24px 20px;width:80%;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
                    <div style="font-size:17px;font-weight:600;text-align:center;margin-bottom:20px;color:#1a1a1a;">编辑银行卡信息</div>
                    <div style="margin-bottom:14px;">
                        <div style="font-size:13px;color:#666;margin-bottom:6px;">持卡人姓名</div>
                        <input id="edit-card-name" type="text" value="${currentName}" maxlength="20" style="width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:8px;padding:10px 12px;font-size:15px;outline:none;">
                    </div>
                    <div style="margin-bottom:20px;">
                        <div style="font-size:13px;color:#666;margin-bottom:6px;">银行卡尾号（4位数字）</div>
                        <input id="edit-card-number" type="number" value="${currentCard}" maxlength="4" style="width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:8px;padding:10px 12px;font-size:15px;outline:none;" placeholder="请输入4位数字">
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button id="edit-card-cancel" style="flex:1;padding:11px;border:1px solid #ddd;background:#fff;border-radius:8px;font-size:15px;cursor:pointer;color:#666;">取消</button>
                        <button id="edit-card-confirm" style="flex:1;padding:11px;border:none;background:#000;color:#fff;border-radius:8px;font-size:15px;cursor:pointer;">保存</button>
                    </div>
                </div>
            `;
            document.getElementById('device').appendChild(modal);
            document.getElementById('edit-card-cancel').onclick = () => modal.remove();
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            document.getElementById('edit-card-confirm').onclick = () => {
                const newName = document.getElementById('edit-card-name').value.trim();
                const newNumber = document.getElementById('edit-card-number').value.trim();
                if (!newName) return toast('姓名不能为空');
                if (!/^\d{4}$/.test(newNumber)) return toast('请输入4位数字尾号');
                store.user.name = newName;
                store.user.cardLastFour = newNumber;
                save();
                modal.remove();
                renderWallet();
                toast('银行卡信息已更新');
            };
        }

        function editCardNumber() {
            editCardInfo();
        }

        function renderWalletBills(area) {
            const bills = (store.bills || []).slice().reverse();
            let billsHtml = '';
            if (bills.length === 0) {
                billsHtml = '<div style="text-align:center;padding:60px 20px;color:#999;"><i class="fas fa-receipt" style="font-size:48px;color:#ddd;margin-bottom:16px;display:block;"></i>暂无账单记录</div>';
            } else {
                billsHtml = bills.map(b => {
                    const isIncome = b.type === 'in';
                    const sign = isIncome ? '+' : '-';
                    const color = isIncome ? '#07c160' : '#fa5151';
                    const icon = isIncome ? 'fa-arrow-down' : 'fa-arrow-up';
                    const timeStr = b.time ? new Date(b.time).toLocaleString('zh-CN', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
                    return `<div class="wallet-bill-item">
                        <div class="wallet-bill-icon ${isIncome ? 'income' : 'expense'}"><i class="fas ${icon}"></i></div>
                        <div class="wallet-bill-info">
                            <div class="wallet-bill-desc">${b.desc || '未知交易'}</div>
                            <div class="wallet-bill-time">${timeStr}</div>
                        </div>
                        <div class="wallet-bill-amount" style="color:${color};">${sign}¥${Number(b.amt).toFixed(2)}</div>
                    </div>`;
                }).join('');
            }

            area.innerHTML = `
                <div class="wallet-sub-nav">
                    <div class="nav-icon" onclick="walletView='main';renderWallet()"><i class="fas fa-chevron-left"></i></div>
                    <div class="nav-title">账单</div>
                    <div class="nav-icon"></div>
                </div>
                <div style="padding:0 16px 20px;">
                    ${billsHtml}
                </div>
            `;
        }

        function renderWalletFamilyCards(area) {
            const myCards = (store.familyCards || []).filter(fc => fc.active);
            const receivedCards = (store.familyCards || []).filter(fc => fc.type === 'received' && fc.active);
            const givenCards = (store.familyCards || []).filter(fc => fc.type === 'given' && fc.active);
            const pendingRequests = (store.familyCardRequests || []).filter(r => r.status === 'pending');

            let html = `
                <div class="wallet-sub-nav">
                    <div class="nav-icon" onclick="walletView='main';renderWallet()"><i class="fas fa-chevron-left"></i></div>
                    <div class="nav-title">亲属卡</div>
                    <div class="nav-icon"></div>
                </div>
                <div style="padding:0 16px 20px;">
                    <!-- 操作按钮 -->
                    <div style="display:flex;gap:10px;margin-bottom:20px;">
                        <button class="wallet-fc-action-btn" onclick="walletView='sendFamilyCard';renderWallet()">
                            <i class="fas fa-gift"></i> 赠送亲属卡
                        </button>
                        <button class="wallet-fc-action-btn request" onclick="walletView='requestFamilyCard';renderWallet()">
                            <i class="fas fa-hand-holding-heart"></i> 索要亲属卡
                        </button>
                    </div>
            `;

            // 待处理请求
            if (pendingRequests.length > 0) {
                html += `<div class="wallet-section-title">待处理的请求</div>`;
                pendingRequests.forEach((req, idx) => {
                    const c = store.contacts.find(x => x.id === req.contactId);
                    const name = c ? c.name : '未知';
                    const avatar = c ? (c.avatar || _ph(40)) : _ph(40);
                    if (req.direction === 'incoming') {
                        // 别人给你的亲属卡（待接受）
                        html += `<div class="wallet-fc-request-item">
                            <img src="${avatar}" class="wallet-fc-avatar">
                            <div class="wallet-fc-req-info">
                                <div class="wallet-fc-req-name">${name} 赠送给你亲属卡</div>
                                <div class="wallet-fc-req-limit">额度: ¥${Number(req.limit || 0).toFixed(2)}/周</div>
                            </div>
                            <div style="display:flex;gap:6px;">
                                <button onclick="acceptFamilyCardRequest(${idx})" style="padding:6px 14px;border:none;background:#07c160;color:#fff;border-radius:6px;font-size:12px;">接受</button>
                                <button onclick="declineFamilyCardRequest(${idx})" style="padding:6px 14px;border:none;background:#eee;color:#666;border-radius:6px;font-size:12px;">拒绝</button>
                            </div>
                        </div>`;
                    } else {
                        // 你索要的亲属卡（等待对方回复）
                        html += `<div class="wallet-fc-request-item">
                            <img src="${avatar}" class="wallet-fc-avatar">
                            <div class="wallet-fc-req-info">
                                <div class="wallet-fc-req-name">向 ${name} 索要亲属卡</div>
                                <div class="wallet-fc-req-limit" style="color:#f59e0b;">等待对方同意...</div>
                            </div>
                        </div>`;
                    }
                });
            }

            // 我赠出的亲属卡
            if (givenCards.length > 0) {
                html += `<div class="wallet-section-title">我赠出的亲属卡</div>`;
                givenCards.forEach((fc, idx) => {
                    const c = store.contacts.find(x => x.id === fc.contactId);
                    const name = c ? c.name : '未知';
                    const avatar = c ? (c.avatar || _ph(40)) : _ph(40);
                    const globalIdx = store.familyCards.indexOf(fc);
                    html += `<div class="wallet-fc-card given">
                        <div class="wallet-fc-card-header">
                            <img src="${avatar}" class="wallet-fc-avatar">
                            <div class="wallet-fc-card-info">
                                <div class="wallet-fc-card-name">${name}</div>
                                <div class="wallet-fc-card-type">赠出</div>
                            </div>
                            <div class="wallet-fc-card-limit">¥${Number(fc.limit || 0).toFixed(2)}<span>/周</span></div>
                        </div>
                        <div class="wallet-fc-card-footer">
                            <span>已使用: ¥${Number(fc.used || 0).toFixed(2)}</span>
                            <div style="display:flex;gap:8px;">
                                <span onclick="editFamilyCardLimit(${globalIdx})" style="color:#576b95;cursor:pointer;"><i class="fas fa-edit"></i> 改额度</span>
                                <span onclick="revokeFamilyCard(${globalIdx})" style="color:#fa5151;cursor:pointer;"><i class="fas fa-times"></i> 停用</span>
                            </div>
                        </div>
                    </div>`;
                });
            }

            // 我收到的亲属卡
            if (receivedCards.length > 0) {
                html += `<div class="wallet-section-title">我收到的亲属卡</div>`;
                receivedCards.forEach((fc, idx) => {
                    const c = store.contacts.find(x => x.id === fc.contactId);
                    const name = c ? c.name : '未知';
                    const avatar = c ? (c.avatar || _ph(40)) : _ph(40);
                    const globalIdx = store.familyCards.indexOf(fc);
                    html += `<div class="wallet-fc-card received">
                        <div class="wallet-fc-card-header">
                            <img src="${avatar}" class="wallet-fc-avatar">
                            <div class="wallet-fc-card-info">
                                <div class="wallet-fc-card-name">${name}</div>
                                <div class="wallet-fc-card-type received">来自</div>
                            </div>
                            <div class="wallet-fc-card-limit">¥${Number(fc.limit || 0).toFixed(2)}<span>/周</span></div>
                        </div>
                        <div class="wallet-fc-card-footer">
                            <span>已使用: ¥${Number(fc.used || 0).toFixed(2)}</span>
                            <div style="display:flex;gap:8px;">
                                <span onclick="editReceivedFamilyCardLimit(${globalIdx})" style="color:#576b95;cursor:pointer;"><i class="fas fa-edit"></i> 改额度</span>
                                <span onclick="deleteReceivedFamilyCard(${globalIdx})" style="color:#fa5151;cursor:pointer;"><i class="fas fa-trash"></i> 删除</span>
                            </div>
                        </div>
                    </div>`;
                });
            }

            if (myCards.length === 0 && pendingRequests.length === 0) {
                html += `<div style="text-align:center;padding:40px 20px;color:#999;">
                    <i class="fas fa-users" style="font-size:48px;color:#ddd;margin-bottom:16px;display:block;"></i>
                    暂无亲属卡<br><span style="font-size:12px;">赠送或索要亲属卡，可让亲友使用你的额度消费</span>
                </div>`;
            }

            html += `</div>`;
            area.innerHTML = html;
        }

        function renderSendFamilyCard(area) {
            const contacts = (store.contacts || []).filter(c => !c.isGroup);
            let listHtml = contacts.length === 0
                ? '<div style="text-align:center;padding:30px;color:#999;">暂无联系人</div>'
                : contacts.map(c => {
                    const avatar = c.avatar || _ph(40);
                    const alreadyGiven = (store.familyCards || []).some(fc => fc.contactId === c.id && fc.type === 'given' && fc.active);
                    return `<div class="wallet-fc-contact-item ${alreadyGiven ? 'disabled' : ''}" onclick="${alreadyGiven ? '' : "sendFamilyCardTo('"+c.id+"')"}">
                        <img src="${avatar}" class="wallet-fc-avatar">
                        <span style="flex:1;font-size:15px;">${c.name}</span>
                        ${alreadyGiven ? '<span style="font-size:12px;color:#999;">已赠送</span>' : '<i class="fas fa-chevron-right" style="color:#ccc;"></i>'}
                    </div>`;
                }).join('');

            area.innerHTML = `
                <div class="wallet-sub-nav">
                    <div class="nav-icon" onclick="walletView='familyCards';renderWallet()"><i class="fas fa-chevron-left"></i></div>
                    <div class="nav-title">赠送亲属卡</div>
                    <div class="nav-icon"></div>
                </div>
                <div style="padding:0 16px 20px;">
                    <div style="font-size:13px;color:#999;margin-bottom:12px;">选择要赠送亲属卡的联系人</div>
                    ${listHtml}
                </div>
            `;
        }

        function renderRequestFamilyCard(area) {
            const contacts = (store.contacts || []).filter(c => !c.isGroup);
            let listHtml = contacts.length === 0
                ? '<div style="text-align:center;padding:30px;color:#999;">暂无联系人</div>'
                : contacts.map(c => {
                    const avatar = c.avatar || _ph(40);
                    const alreadyRequested = (store.familyCardRequests || []).some(r => r.contactId === c.id && r.direction === 'outgoing' && r.status === 'pending');
                    const alreadyHave = (store.familyCards || []).some(fc => fc.contactId === c.id && fc.type === 'received' && fc.active);
                    const disabled = alreadyRequested || alreadyHave;
                    const hint = alreadyHave ? '已拥有' : (alreadyRequested ? '已申请' : '');
                    return `<div class="wallet-fc-contact-item ${disabled ? 'disabled' : ''}" onclick="${disabled ? '' : "requestFamilyCardFrom('"+c.id+"')"}">
                        <img src="${avatar}" class="wallet-fc-avatar">
                        <span style="flex:1;font-size:15px;">${c.name}</span>
                        ${hint ? '<span style="font-size:12px;color:#999;">'+hint+'</span>' : '<i class="fas fa-chevron-right" style="color:#ccc;"></i>'}
                    </div>`;
                }).join('');

            area.innerHTML = `
                <div class="wallet-sub-nav">
                    <div class="nav-icon" onclick="walletView='familyCards';renderWallet()"><i class="fas fa-chevron-left"></i></div>
                    <div class="nav-title">索要亲属卡</div>
                    <div class="nav-icon"></div>
                </div>
                <div style="padding:0 16px 20px;">
                    <div style="font-size:13px;color:#999;margin-bottom:12px;">选择要索要亲属卡的联系人</div>
                    ${listHtml}
                </div>
            `;
        }

        function sendFamilyCardTo(contactId) {
            const c = store.contacts.find(x => x.id === contactId);
            if (!c) return;
            showPromptModal('设置赠送给「' + c.name + '」的亲属卡周额度 (元):', '500').then(function(limitStr) {
            if (!limitStr) return;
            const limit = parseFloat(limitStr);
            if (isNaN(limit) || limit <= 0) return toast('请输入有效金额');

            const fcId = 'fc_' + Date.now();
            if (!store.familyCards) store.familyCards = [];
            store.familyCards.push({
                id: fcId,
                contactId: contactId,
                type: 'given',
                limit: limit,
                used: 0,
                active: true,
                createdAt: Date.now()
            });

            // 使用专用亲属卡气泡（黑金风格）
            if (!store.chats[contactId]) store.chats[contactId] = [];
            store.chats[contactId].push({
                sender: 'me',
                type: 'family-card-sent',
                content: '',
                familyCard: {
                    direction: 'user_to_contact',
                    contactId: contactId,
                    contactName: c.name,
                    limit: limit,
                    requestId: fcId,
                    status: 'pending'
                },
                time: Date.now()
            });

            // 自动模拟对方接受 - 稍后联系人会主动给你亲属卡
            setTimeout(() => {
                // 更新sent气泡状态为accepted
                const chatArr = store.chats[contactId] || [];
                const sentMsg = chatArr.find(m => m.type === 'family-card-sent' && m.familyCard && m.familyCard.requestId === fcId);
                if (sentMsg) sentMsg.familyCard.status = 'accepted';
                simulateContactGiveFamilyCard(contactId);
            }, 3000 + Math.random() * 5000);

            save();
            toast(`已赠送亲属卡给 ${c.name}`);
            walletView = 'familyCards';
            renderWallet();

            // [FIX-亲属卡] 赠送后安排联系人首次消费（1-24小时后）
            scheduleFamilyCardSpending(contactId);
            });
        }

        function requestFamilyCardFrom(contactId) {
            const c = store.contacts.find(x => x.id === contactId);
            if (!c) return;

            const reqId = 'fcr_' + Date.now();
            if (!store.familyCardRequests) store.familyCardRequests = [];
            store.familyCardRequests.push({
                id: reqId,
                contactId: contactId,
                direction: 'outgoing',
                status: 'pending',
                time: Date.now()
            });

            // 使用专用亲属卡气泡
            if (!store.chats[contactId]) store.chats[contactId] = [];
            store.chats[contactId].push({
                sender: 'me',
                type: 'family-card-sent',
                content: '',
                familyCard: {
                    direction: 'user_request',
                    contactId: contactId,
                    contactName: c.name,
                    limit: 0,
                    requestId: reqId,
                    status: 'pending'
                },
                time: Date.now()
            });

            // 模拟联系人同意并赠送
            setTimeout(() => {
                const reqIdx = store.familyCardRequests.findIndex(r => r.id === reqId);
                if (reqIdx >= 0) {
                    store.familyCardRequests[reqIdx].status = 'approved';
                    const randomLimit = [200, 300, 500, 800, 1000][Math.floor(Math.random() * 5)];
                    const fcId = 'fc_' + Date.now();
                    if (!store.familyCards) store.familyCards = [];
                    store.familyCards.push({
                        id: fcId,
                        contactId: contactId,
                        type: 'received',
                        limit: randomLimit,
                        used: 0,
                        active: true,
                        createdAt: Date.now()
                    });

                    // 更新之前的sent气泡状态
                    const chatArr = store.chats[contactId] || [];
                    const sentMsg = chatArr.find(m => m.familyCard && m.familyCard.requestId === reqId);
                    if (sentMsg) {
                        sentMsg.familyCard.status = 'accepted';
                        sentMsg.familyCard.limit = randomLimit;
                    }

                    // 添加accepted气泡
                    store.chats[contactId].push({
                        sender: 'ai',
                        type: 'family-card-accepted',
                        content: '',
                        familyCard: {
                            direction: 'contact_to_user',
                            contactId: contactId,
                            contactName: c.name,
                            limit: randomLimit,
                            requestId: fcId,
                            status: 'accepted'
                        },
                        time: Date.now()
                    });
                    save();
                    renderWallet();
                    if (typeof renderHistory === 'function' && typeof activeChatId !== 'undefined' && activeChatId === contactId) renderHistory();
                    toast(`${c.name} 已同意并赠送亲属卡`);
                }
            }, 2000 + Math.random() * 4000);

            save();
            toast(`已向 ${c.name} 索要亲属卡`);
            walletView = 'familyCards';
            renderWallet();
        }

        function simulateContactGiveFamilyCard(contactId) {
            const c = store.contacts.find(x => x.id === contactId);
            if (!c) return;
            // 联系人主动给你亲属卡作为回礼
            const alreadyHave = (store.familyCards || []).some(fc => fc.contactId === contactId && fc.type === 'received' && fc.active);
            if (alreadyHave) return;

            const randomLimit = [200, 300, 500, 800][Math.floor(Math.random() * 4)];
            const fcId = 'fc_recv_' + Date.now();
            const reqId = 'fcr_recv_' + Date.now();
            if (!store.familyCards) store.familyCards = [];
            store.familyCards.push({
                id: fcId,
                contactId: contactId,
                type: 'received',
                limit: randomLimit,
                used: 0,
                active: true,
                createdAt: Date.now()
            });

            if (!store.chats[contactId]) store.chats[contactId] = [];
            // 使用专用亲属卡邀请气泡（联系人→用户方向）
            store.chats[contactId].push({
                sender: 'ai',
                type: 'family-card-invite',
                content: '',
                familyCard: {
                    direction: 'contact_to_user',
                    contactId: contactId,
                    contactName: c.name,
                    limit: randomLimit,
                    requestId: reqId,
                    status: 'accepted' // 自动接受（回礼场景）
                },
                time: Date.now()
            });
            save();
            renderWallet();
            if (typeof renderHistory === 'function' && typeof activeChatId !== 'undefined' && activeChatId === contactId) renderHistory();
        }

        // [FIX-iOS兼容] 修改额度改用idx+id双重校验，防止索引漂移
        function editFamilyCardLimit(idx) {
            const fc = store.familyCards[idx];
            if (!fc) return;
            const fcId = fc.id; // 保存id用于回调中重新查找
            const c = store.contacts.find(x => x.id === fc.contactId);
            const name = c ? c.name : '未知';
            showPromptModal('修改赠送给「' + name + '」的亲属卡周额度:', String(fc.limit)).then(function(newLimit) {
                if (!newLimit) return;
                // [FIX-iOS] 兼容全角数字输入
                newLimit = newLimit.replace(/[０-９]/g, function(c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
                const limit = parseFloat(newLimit);
                if (isNaN(limit) || limit <= 0) return toast('请输入有效金额');
                // [FIX-iOS] 回调中重新通过id查找，避免数组变动导致idx失效
                const target = store.familyCards.find(x => x.id === fcId) || store.familyCards[idx];
                if (!target) return toast('亲属卡不存在');
                target.limit = limit;
                save();
                renderWallet();
                toast('额度已修改');
            });
        }

        function revokeFamilyCard(idx) {
            const fc = store.familyCards[idx];
            if (!fc) return;
            const c = store.contacts.find(x => x.id === fc.contactId);
            const name = c ? c.name : '未知';
            if (confirm(`确定停用赠送给「${name}」的亲属卡吗？`)) {
                fc.active = false;
                save();
                renderWallet();
                toast('亲属卡已停用');
            }
        }

        // [FIX-iOS兼容] 同上
        function editReceivedFamilyCardLimit(idx) {
            const fc = store.familyCards[idx];
            if (!fc) return;
            const fcId = fc.id;
            const c = store.contacts.find(x => x.id === fc.contactId);
            const name = c ? c.name : '未知';
            showPromptModal('修改来自「' + name + '」的亲属卡周额度:', String(fc.limit)).then(function(newLimit) {
                if (!newLimit) return;
                newLimit = newLimit.replace(/[０-９]/g, function(c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
                const limit = parseFloat(newLimit);
                if (isNaN(limit) || limit <= 0) return toast('请输入有效金额');
                const target = store.familyCards.find(x => x.id === fcId) || store.familyCards[idx];
                if (!target) return toast('亲属卡不存在');
                target.limit = limit;
                save();
                renderWallet();
                toast('额度已修改');
            });
        }

        function deleteReceivedFamilyCard(idx) {
            const fc = store.familyCards[idx];
            if (!fc) return;
            const c = store.contacts.find(x => x.id === fc.contactId);
            const name = c ? c.name : '未知';
            if (confirm(`确定删除来自「${name}」的亲属卡吗？`)) {
                store.familyCards.splice(idx, 1);
                save();
                renderWallet();
                toast('亲属卡已删除');
            }
        }

        // ===== [NEW] 亲属卡气泡操作处理函数 =====
        function acceptFamilyCardBubble(reqId, msgIdx) {
            const chatId = typeof activeChatId !== 'undefined' ? activeChatId : null;
            if (!chatId) return;
            const chatArr = store.chats[chatId] || [];
            const msg = chatArr[msgIdx];
            if (!msg || !msg.familyCard) return;
            if (msg.familyCard.status !== 'pending') return toast('该邀请已处理');

            // 接受亲属卡
            msg.familyCard.status = 'accepted';
            const contactId = msg.familyCard.contactId;
            const limit = msg.familyCard.limit || 500;
            const c = store.contacts.find(x => x.id === contactId);

            // 创建received类型的亲属卡
            const fcId = 'fc_accept_' + Date.now();
            if (!store.familyCards) store.familyCards = [];
            store.familyCards.push({
                id: fcId,
                contactId: contactId,
                type: 'received',
                limit: limit,
                used: 0,
                active: true,
                createdAt: Date.now()
            });

            save();
            if (typeof renderHistory === 'function') renderHistory();
            renderWallet();
            toast('已接受亲属卡');
        }

        function declineFamilyCardBubble(reqId, msgIdx) {
            const chatId = typeof activeChatId !== 'undefined' ? activeChatId : null;
            if (!chatId) return;
            const chatArr = store.chats[chatId] || [];
            const msg = chatArr[msgIdx];
            if (!msg || !msg.familyCard) return;
            if (msg.familyCard.status !== 'pending') return toast('该邀请已处理');

            msg.familyCard.status = 'declined';
            save();
            if (typeof renderHistory === 'function') renderHistory();
            toast('已拒绝亲属卡');
        }

        function acceptFamilyCardRequest(idx) {
            const req = (store.familyCardRequests || []).filter(r => r.status === 'pending')[idx];
            if (!req || req.direction !== 'incoming') return;
            showPromptModal('设置亲属卡周额度 (元):', '500').then(function(limitStr) {
            if (!limitStr) return;
            const limit = parseFloat(limitStr);
            if (isNaN(limit) || limit <= 0) return toast('请输入有效金额');
            req.status = 'approved';
            if (!store.familyCards) store.familyCards = [];
            store.familyCards.push({
                id: 'fc_' + Date.now(),
                contactId: req.contactId,
                type: 'given',
                limit: limit,
                used: 0,
                active: true,
                createdAt: Date.now()
            });
            save();
            renderWallet();
            toast('已接受并开通亲属卡');
            });
        }

        function declineFamilyCardRequest(idx) {
            const pending = (store.familyCardRequests || []).filter(r => r.status === 'pending');
            const req = pending[idx];
            if (!req) return;
            req.status = 'declined';
            save();
            renderWallet();
            toast('已拒绝');
        }

        // Get available family cards for payment (received ones with remaining balance)
        function getAvailableFamilyCardsForPayment() {
            return (store.familyCards || []).filter(fc => fc.type === 'received' && fc.active && (fc.limit - (fc.used || 0)) > 0);
        }

        // ===== [FIX-亲属卡优化] 联系人消费模拟 + 通知 + 周刷新 =====

        // 周刷新：检查并重置已过一周的亲属卡额度
        function checkFamilyCardWeeklyReset() {
            if (!store.familyCards || store.familyCards.length === 0) return;
            const now = Date.now();
            const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
            let changed = false;
            store.familyCards.forEach(fc => {
                if (!fc.active) return;
                if (!fc.lastResetTime) fc.lastResetTime = fc.createdAt || now;
                if (now - fc.lastResetTime >= ONE_WEEK) {
                    fc.used = 0;
                    fc.lastResetTime = now;
                    changed = true;
                }
            });
            if (changed) save();
        }

        // 模拟联系人使用亲属卡消费（通过API生成符合人设的购买）
        async function simulateContactFamilyCardSpending(contactId) {
            const fc = (store.familyCards || []).find(f => f.contactId === contactId && f.type === 'given' && f.active);
            if (!fc) return;
            const remaining = fc.limit - (fc.used || 0);
            if (remaining <= 0) return;
            const c = store.contacts.find(x => x.id === contactId);
            if (!c) return;

            const userName = typeof getUserPersonaName === 'function' ? getUserPersonaName(c, store.user.name || '用户') : (store.user.name || '用户');
            // 消费金额随机：剩余额度的5%-30%，最少1元最多200元
            const maxSpend = Math.min(remaining, 200);
            const minSpend = Math.max(1, remaining * 0.05);
            const spendAmt = Math.round((minSpend + Math.random() * (maxSpend - minSpend)) * 100) / 100;

            let itemName = '日用品';
            let itemDesc = `${c.name}使用亲属卡消费`;

            try {
                if (typeof API !== 'undefined' && API && API.chatCompletion && store.system && store.system.url && store.system.key) {
                    const persona = (c.persona || '').substring(0, 300);
                    const prompt = `你是${c.name}。人设：${persona}\n\n你有一张${userName}给你的亲属卡，剩余额度¥${remaining.toFixed(2)}。你现在要用这张卡买一样东西（花费约¥${spendAmt.toFixed(2)}）。\n\n请根据你的人设和性格，选择一个你会买的东西。要求：\n1. 完全符合你的人设（比如喜欢什么、需要什么）\n2. 价格合理，接近¥${spendAmt.toFixed(2)}\n3. 只输出JSON格式：{"item":"商品名","price":${spendAmt.toFixed(2)},"reason":"一句话说明为什么买"}\n4. 不要输出其他任何内容`;
                    const data = await API.chatCompletion([
                        { role: 'system', content: prompt }
                    ], 0.9);
                    let reply = (data.choices[0].message.content || '').trim();
                    // 清理markdown代码块
                    reply = reply.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
                    try {
                        const parsed = JSON.parse(reply);
                        if (parsed.item) itemName = parsed.item;
                        if (parsed.price && !isNaN(parsed.price)) {
                            // 使用AI建议的价格，但不超过剩余额度
                            const aiPrice = Math.min(parseFloat(parsed.price), remaining);
                            if (aiPrice > 0) fc.used = (fc.used || 0) + aiPrice;
                            else fc.used = (fc.used || 0) + spendAmt;
                        } else {
                            fc.used = (fc.used || 0) + spendAmt;
                        }
                        if (parsed.reason) itemDesc = parsed.reason;
                    } catch(pe) {
                        fc.used = (fc.used || 0) + spendAmt;
                    }
                } else {
                    fc.used = (fc.used || 0) + spendAmt;
                }
            } catch(e) {
                console.warn('[familyCard] AI消费生成失败:', e);
                fc.used = (fc.used || 0) + spendAmt;
            }

            const actualSpend = Math.round((fc.used - (fc.used - spendAmt > 0 ? fc.used - spendAmt : 0)) * 100) / 100 || spendAmt;

            // 添加账单记录
            if (!store.bills) store.bills = [];
            store.bills.push({
                type: 'out',
                desc: `亲属卡消费 - ${c.name}购买${itemName}`,
                amt: actualSpend,
                time: Date.now()
            });

            // 在聊天中通知用户
            if (!store.chats[contactId]) store.chats[contactId] = [];
            store.chats[contactId].push({
                sender: 'system', type: 'poke',
                content: `💳 ${c.name}使用亲属卡消费了 ¥${actualSpend.toFixed(2)}（${itemName}）`,
                time: Date.now()
            });

            // 联系人发一条关于购买的消息（通过API）
            try {
                if (typeof API !== 'undefined' && API && API.chatCompletion && store.system && store.system.url && store.system.key) {
                    const aiCtx = typeof getAiContext === 'function' ? getAiContext(c) : `你是${c.name}。人设：${(c.persona || '').substring(0, 300)}`;
                    const thankPrompt = aiCtx + `\n\n情境：你刚用${userName}给你的亲属卡买了「${itemName}」，花了¥${actualSpend.toFixed(2)}。${itemDesc ? '原因：' + itemDesc : ''}\n\n任务：以${c.name}的身份给${userName}发一条消息，告诉TA你买了什么。可以是感谢、撒娇、炫耀、分享等，完全取决于你的人设。1-2句话，简短自然。只输出回复文本。`;
                    const data2 = await API.chatCompletion([
                        { role: 'system', content: thankPrompt },
                        { role: 'user', content: `你用亲属卡买了${itemName}` }
                    ], store.system.temp || 0.7);
                    let thankReply = (data2.choices[0].message.content || '').trim();
                    thankReply = thankReply.replace(/\[HEARTBEAT:[\s\S]*?\]/gi, '').replace(/\[HEART:[\s\S]*?\]/gi, '').replace(/\[STICKER:[\s\S]*?\]/gi, '').trim();
                    if (thankReply) {
                        store.chats[contactId].push({ sender: contactId, type: 'text', content: thankReply, time: Date.now() });
                    }
                }
            } catch(e2) {
                console.warn('[familyCard] AI感谢消息生成失败:', e2);
            }

            c.lastMsgTime = Date.now();
            save();
            if (typeof activeChatId !== 'undefined' && activeChatId === contactId && typeof renderHistory === 'function') renderHistory();
            if (typeof playNotificationSound === 'function') playNotificationSound(contactId);

            // 随机安排下一次消费（6-48小时后）
            scheduleFamilyCardSpending(contactId);
        }

        // 安排下一次亲属卡消费
        function scheduleFamilyCardSpending(contactId) {
            const fc = (store.familyCards || []).find(f => f.contactId === contactId && f.type === 'given' && f.active);
            if (!fc) return;
            const remaining = fc.limit - (fc.used || 0);
            if (remaining <= 0) return;
            // 6-48小时后随机消费一次
            const delay = (6 + Math.random() * 42) * 60 * 60 * 1000;
            // 存储下次消费时间，以便页面刷新后恢复
            fc.nextSpendTime = Date.now() + delay;
            save();
            setTimeout(() => {
                simulateContactFamilyCardSpending(contactId);
            }, delay);
        }

        // 页面加载时恢复所有待执行的亲属卡消费计划
        function restoreFamilyCardSpendingSchedules() {
            if (!store.familyCards) return;
            const now = Date.now();
            store.familyCards.forEach(fc => {
                if (!fc.active || fc.type !== 'given') return;
                const remaining = fc.limit - (fc.used || 0);
                if (remaining <= 0) return;
                if (fc.nextSpendTime) {
                    if (fc.nextSpendTime <= now) {
                        // 已过期，立即执行（延迟几秒避免页面加载卡顿）
                        setTimeout(() => simulateContactFamilyCardSpending(fc.contactId), 5000 + Math.random() * 10000);
                    } else {
                        // 未过期，按剩余时间安排
                        const remainDelay = fc.nextSpendTime - now;
                        setTimeout(() => simulateContactFamilyCardSpending(fc.contactId), remainDelay);
                    }
                } else {
                    // 没有计划，安排一次新的
                    scheduleFamilyCardSpending(fc.contactId);
                }
            });
        }

        // 页面加载时执行周刷新检查和恢复消费计划
        setTimeout(() => {
            checkFamilyCardWeeklyReset();
            restoreFamilyCardSpendingSchedules();
        }, 3000);

        window.openWallet = openWallet;
        window.renderWallet = renderWallet;
        window.sendFamilyCardTo = sendFamilyCardTo;
        window.requestFamilyCardFrom = requestFamilyCardFrom;
        window.editFamilyCardLimit = editFamilyCardLimit;
        window.revokeFamilyCard = revokeFamilyCard;
        window.editReceivedFamilyCardLimit = editReceivedFamilyCardLimit;
        window.deleteReceivedFamilyCard = deleteReceivedFamilyCard;
        window.acceptFamilyCardRequest = acceptFamilyCardRequest;
        window.declineFamilyCardRequest = declineFamilyCardRequest;
        window.acceptFamilyCardBubble = acceptFamilyCardBubble;
        window.declineFamilyCardBubble = declineFamilyCardBubble;
        window.getAvailableFamilyCardsForPayment = getAvailableFamilyCardsForPayment;
        window.checkFamilyCardWeeklyReset = checkFamilyCardWeeklyReset;
        window.simulateContactFamilyCardSpending = simulateContactFamilyCardSpending;
        window.simulateContactGiveFamilyCard = simulateContactGiveFamilyCard;

        // --- PERSONA MGMT ---
        function openPersonaMgmt() {document.getElementById('layer-persona-mgmt').classList.add('show'); renderPersonas(); }
        function openPersonaModal(id = null) {
            // [FIX-人设重复] 同时写入window._editingPersonaId，确保跨文件作用域一致性
            editingPersonaId = id;
            window._editingPersonaId = id;
            const modal = document.getElementById('modal-persona');
            // [FIX-弹窗不显示] 强制确保弹窗和其内部modal-box可见
            // 修复部分用户反馈"有阴影层但没弹窗"的问题
            modal.style.pointerEvents = '';
            modal.style.visibility = '';
            modal.style.zIndex = '10001';
            var _mbox = modal.querySelector('.modal-box');
            if (_mbox) {
                _mbox.style.zIndex = '10002';
                _mbox.style.position = 'relative';
                _mbox.style.opacity = '1';
                _mbox.style.visibility = 'visible';
                _mbox.style.transform = 'none';
                _mbox.style.pointerEvents = 'auto';
            }
            // [FIX-DOM嵌套] 如果弹窗被嵌套在有 transform 的父容器中，移到 body 直属
            if (modal.parentNode && modal.parentNode !== document.body) {
                document.body.appendChild(modal);
            }
            const title = modal.querySelector('h3');
            
            if (id) {
                const p = store.personas.find(x => x.id === id);
                if (!p) return;
                title.innerText = '编辑人设';
                document.getElementById('new-p-name').value = p.name;
                document.getElementById('new-p-desc').value = p.desc;
                document.getElementById('new-p-note').value = p.note || '';
                document.getElementById('new-persona-img').src = p.avatar || '';
                document.getElementById('new-persona-img').style.display = p.avatar ? 'block' : 'none';
                // [性别] 回显
                selectPersonaGender(p.gender || '');
                const customEl = document.getElementById('new-p-gender-custom');
                if (customEl) customEl.value = (p.gender === 'custom' ? (p.customGender || '') : '');
            } else {
                title.innerText = '新建人设';
                document.getElementById('new-p-name').value = '';
                document.getElementById('new-p-desc').value = '';
                document.getElementById('new-p-note').value = '';
                document.getElementById('new-persona-img').src = '';
                document.getElementById('new-persona-img').style.display = 'none';
                // [性别] 重置
                selectPersonaGender('');
                const customEl = document.getElementById('new-p-gender-custom');
                if (customEl) customEl.value = '';
            }
            modal.style.display = 'flex';
        }

        // [性别] 选择人设性别按钮回调
        function selectPersonaGender(val) {
            const hidden = document.getElementById('new-p-gender');
            if (hidden) hidden.value = val || '';
            document.querySelectorAll('#modal-persona .pg-btn').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-gender') === val);
            });
            const customEl = document.getElementById('new-p-gender-custom');
            if (customEl) customEl.style.display = (val === 'custom') ? 'block' : 'none';
        }
        window.selectPersonaGender = selectPersonaGender;

        // [FIX-人设重复] 防双击提交锁
        let _personaSaving = false;
        function saveNewPersona() {
             // [FIX-人设重复] 防止移动端键盘收起抖动导致的双击重复提交
             if (_personaSaving) return;
             _personaSaving = true;
             setTimeout(function() { _personaSaving = false; }, 600);

             // [FIX] 先让输入框失焦，避免移动端键盘收起引起的布局抖动导致点击失效
             document.activeElement && document.activeElement.blur();
             const n = document.getElementById('new-p-name').value;
             const d = document.getElementById('new-p-desc').value;
             const noteVal = document.getElementById('new-p-note').value;
             const img = document.getElementById('new-persona-img').src;
             if(!n) return toast("请输入名称");

             // [性别] 读取
             const genderVal = (document.getElementById('new-p-gender')?.value || '').trim();
             const customGenderVal = (document.getElementById('new-p-gender-custom')?.value || '').trim();

             // [FIX-人设重复] 优先读取window._editingPersonaId，防止跨文件作用域的editingPersonaId不一致
             // 根因：editingPersonaId在app-part1.js中声明，app-wallet.js中访问的可能是不同作用域
             // 的同名变量，导致编辑时走到else分支push新人设
             const _editingId = (typeof window._editingPersonaId !== 'undefined' && window._editingPersonaId !== null)
                 ? window._editingPersonaId
                 : editingPersonaId;

             if (_editingId) {
                const p = store.personas.find(x => x.id === _editingId);
                if (p) {
                    p.name = n;
                    p.desc = d;
                    p.note = noteVal;
                    p.avatar = img;
                    p.gender = genderVal || '';
                    p.customGender = (genderVal === 'custom') ? customGenderVal : '';
                    toast("人设已更新");
                }
             } else {
                store.personas.push({
                    id:'p'+Date.now(), name:n, desc:d, note:noteVal, avatar:img,
                    gender: genderVal || '',
                    customGender: (genderVal === 'custom') ? customGenderVal : ''
                });
                toast("人设已创建");
             }
             
             save(); renderPersonas(); document.getElementById('modal-persona').style.display='none';
             editingPersonaId = null;
             window._editingPersonaId = null;
        }

        function deletePersona(id) {
            if (store.personas.length <= 1) return toast("至少保留一个人设", "error");
            if (confirm("确定删除这个人设吗？")) {
                store.personas = store.personas.filter(p => p.id !== id);
                // Reset any contacts using this persona to empty (will fallback to WeChat name)
                store.contacts.forEach(c => {
                    if (c.settings && c.settings.userPersona === id) {
                        c.settings.userPersona = '';
                    }
                });
                save();
                renderPersonas();
                toast("人设已删除");
            }
        }

        function renderPersonas() {
             const l = document.getElementById('persona-list'); l.innerHTML = '';
             store.personas.forEach(p => {
                 const box = document.createElement('div');
                 box.className = 'group-box persona-card collapsed';
                 box.style.cssText = 'padding:16px; cursor:pointer; background:#fff; border:1px solid #e5e5e5; border-radius:12px; margin-bottom:10px; box-shadow:none;';
                 box.innerHTML = `
                    <div class="persona-header" style="display:flex; align-items:center;">
                        <img src="${p.avatar||_ph(50)}" class="avatar" style="width:42px; height:42px; border-radius:50%; margin-right:12px; border:1px solid #e5e5e5;">
                        <div style="flex:1;"><strong style="font-size:15px; color:#1d1d1f;">${p.name}</strong>${p.note ? `<div style="font-size:11px; color:#86868b; margin-top:3px;">${p.note}</div>` : ''}</div>
                        <i class="fas fa-chevron-right persona-arrow" style="font-size:11px; color:#999; transition:transform 0.2s; margin-right:8px;"></i>
                        <i class="fas fa-users" title="AI生成身边人" style="cursor:pointer; color:#1d1d1f; margin-left:6px; font-size:13px;" onclick="event.stopPropagation(); if(typeof openGenerateCirclePanel==='function'){openGenerateCirclePanel('${p.id}');}else{toast('模块未加载','error');}"></i>
                        <i class="fas fa-edit" style="cursor:pointer; color:#86868b; margin-left:10px; font-size:13px;" onclick="event.stopPropagation(); openPersonaModal('${p.id}')"></i>
                        <i class="fas fa-trash" style="cursor:pointer; color:#86868b; margin-left:10px; font-size:13px;" onclick="event.stopPropagation(); deletePersona('${p.id}')"></i>
                    </div>
                    <div class="persona-detail" style="display:none; margin-top:12px; padding-top:12px; border-top:1px solid #f0f0f0;">
                        <p style="margin:0; color:#444; font-size:13px; white-space:pre-wrap; line-height:1.6;">${p.desc || '暂无描述'}</p>
                        <div style="margin-top:12px; padding-top:12px; border-top:1px solid #f0f0f0; display:flex; gap:8px;">
                            <button onclick="event.stopPropagation(); if(typeof openGenerateCirclePanel==='function'){openGenerateCirclePanel('${p.id}');}else{toast('模块未加载','error');}" style="flex:1;padding:9px 12px;background:#1d1d1f;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-weight:500;">
                                <i class="fas fa-users" style="margin-right:4px;"></i>AI 生成身边人
                            </button>
                        </div>
                    </div>`;
                 box.onclick = function(e) {
                     if (e.target.closest('.fa-edit') || e.target.closest('.fa-trash')) return;
                     const detail = this.querySelector('.persona-detail');
                     const arrow = this.querySelector('.persona-arrow');
                     const isCollapsed = this.classList.toggle('collapsed');
                     detail.style.display = isCollapsed ? 'none' : 'block';
                     arrow.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)';
                 };
                 l.appendChild(box);
             });
        }

        // --- WORLD BOOK ---
        function openWBModal() {
            var _wbModal = document.getElementById('modal-wb');
            if (!_wbModal) return;
            // [OPT-世界书卡顿] 先显示弹窗，再清空表单，减少用户感知延迟
            // [FIX-DOM嵌套] 如果弹窗被嵌套在有 transform 的父容器中，移到 body 直属
            if (_wbModal.parentNode && _wbModal.parentNode !== document.body) {
                document.body.appendChild(_wbModal);
            }
            // [FIX-弹窗不显示] 强制确保弹窗和其内部modal-box可见
            _wbModal.style.cssText = 'display:flex;z-index:10001;pointer-events:auto;visibility:visible;';
            var _wbBox = _wbModal.querySelector('.modal-box');
            if (_wbBox) {
                _wbBox.style.cssText += ';z-index:10002;position:relative;opacity:1;visibility:visible;transform:none;pointer-events:auto;';
            }
            // 清空表单
            var nameEl = document.getElementById('new-wb-name');
            var contentEl = document.getElementById('new-wb-content');
            var cateEl = document.getElementById('new-wb-cate-sel');
            if (nameEl) nameEl.value = '';
            if (contentEl) contentEl.value = '';
            if (cateEl) cateEl.value = '';
            var kwEl = document.getElementById('new-wb-keywords');
            if (kwEl) kwEl.value = '';
            var htmlEl = document.getElementById('new-wb-html');
            if (htmlEl) htmlEl.value = '';
            updateCategorySelect();
        }
        function openCategoryModal() {
            var _catModal = document.getElementById('modal-category');
            // [FIX-弹窗不显示] 强制确保弹窗可见
            _catModal.style.pointerEvents = '';
            _catModal.style.visibility = '';
            _catModal.style.zIndex = '10001';
            var _catBox = _catModal.querySelector('.modal-box');
            if (_catBox) {
                _catBox.style.zIndex = '10002';
                _catBox.style.opacity = '1';
                _catBox.style.visibility = 'visible';
                _catBox.style.transform = 'none';
                _catBox.style.pointerEvents = 'auto';
            }
            if (_catModal.parentNode && _catModal.parentNode !== document.body) {
                document.body.appendChild(_catModal);
            }
            _catModal.style.display='flex';
        }
        function saveCategory() {
            // [FIX] 收起移动端键盘
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            const name = document.getElementById('new-category-name').value;
            if(!name) return toast("请输入分类名称");
            if(!store.categories) store.categories = [];
            store.categories.push(name);
            save(); 
            document.getElementById('modal-category').style.display='none';
            toast("分类已创建", "success");
            // Refresh both the worldbook view and the category selector in the modal
            renderWorldBooks();
            updateCategorySelect();
        }
        function updateCategorySelect() {
            const sel = document.getElementById('new-wb-cate-sel');
            sel.innerHTML = '<option value="">无分类</option>';
            (store.categories||[]).forEach(c => {
                sel.innerHTML += `<option value="${c}">${c}</option>`;
            });
        }
        function saveNewWorldBook() {
             // [FIX] 收起移动端键盘
             if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
             const n = document.getElementById('new-wb-name').value;
             const c = document.getElementById('new-wb-content').value;
             const cate = document.getElementById('new-wb-cate-sel').value;
             const kwEl = document.getElementById('new-wb-keywords');
             const htmlEl = document.getElementById('new-wb-html');
             const keywords = kwEl ? kwEl.value.split(',').map(k => k.trim()).filter(k => k) : [];
             const htmlCode = htmlEl ? htmlEl.value : '';
             const injectionPosEl = document.getElementById('new-wb-injection-pos');
             const injectionPosition = injectionPosEl ? injectionPosEl.value : 'middle';
             if(!n) return toast("请输入名称");
             if(!store.worldbooks) store.worldbooks = [];
             store.worldbooks.push({id:'wb'+Date.now(), name:n, content:c, cate, keywords, htmlCode, injectionPosition});
             // [OPT-世界书卡顿] 先关闭弹窗让UI立即响应，再异步渲染列表
             document.getElementById('modal-wb').style.display='none';
             save();
             requestAnimationFrame(function() { renderWorldBooks(); });
        }
        let activeWBCategory = 'all';
        let wbBatchMode = false;
        let wbBatchSelected = [];

        function _escapeHtml(str) {
            if (!str) return '';
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        window.toggleWbBatchMode = function() {
            wbBatchMode = !wbBatchMode;
            wbBatchSelected = [];
            var btn = document.getElementById('wb-batch-btn');
            if (btn) btn.style.color = wbBatchMode ? '#fa5151' : '';
            renderWorldBooks();
        };

        window.toggleWbBatchSelect = function(e, id) {
            e.stopPropagation();
            var idx = wbBatchSelected.indexOf(id);
            if (idx > -1) wbBatchSelected.splice(idx, 1);
            else wbBatchSelected.push(id);
            renderWorldBooks();
        };

        window.wbBatchSelectAll = function() {
            var list = store.worldbooks || [];
            if (activeWBCategory !== 'all') list = list.filter(w => w.cate === activeWBCategory);
            if (wbBatchSelected.length === list.length) {
                wbBatchSelected = [];
            } else {
                wbBatchSelected = list.map(w => w.id);
            }
            renderWorldBooks();
        };

        window.wbBatchDeleteSelected = function() {
            if (!wbBatchSelected.length) return toast('请先选择要删除的世界书');
            showConfirm('批量删除', '确定删除选中的 ' + wbBatchSelected.length + ' 本世界书吗？此操作不可撤销。', () => {
                var idsToDelete = wbBatchSelected.slice();
                store.worldbooks = (store.worldbooks || []).filter(w => idsToDelete.indexOf(w.id) === -1);
                // 清理联系人挂载引用
                (store.contacts || []).forEach(c => {
                    if (c.settings) {
                        if (c.settings.mountedWbIds && Array.isArray(c.settings.mountedWbIds)) {
                            c.settings.mountedWbIds = c.settings.mountedWbIds.filter(wbId => idsToDelete.indexOf(String(wbId)) === -1 && idsToDelete.indexOf(wbId) === -1);
                        }
                        if (c.settings.wb && idsToDelete.indexOf(c.settings.wb) > -1) c.settings.wb = '';
                    }
                });
                // [FIX-世界书数量] 清理全局世界书引用，防止删除后数量仍显示旧值
                store.globalWbIds = (store.globalWbIds || []).filter(gid => idsToDelete.indexOf(String(gid)) === -1 && idsToDelete.indexOf(gid) === -1);
                if (store.globalWbMounts) {
                    idsToDelete.forEach(did => delete store.globalWbMounts[String(did)]);
                }
                wbBatchSelected = [];
                save();
                renderWorldBooks();
                toast('已删除 ' + idsToDelete.length + ' 本世界书');
            });
        };

        function renderWorldBooks() {
             // Render Category Bar
             const catBar = document.getElementById('wb-category-bar');
             if (!catBar) return;
             const categories = ['全部', ...(store.categories || [])];
             catBar.innerHTML = categories.map((c, i) => {
                const val = i === 0 ? 'all' : c;
                // Add long-press/context-menu handlers, but not for "全部"
                const interactionHandlers = i > 0 ? `
                    oncontextmenu="showWBCategoryMenu(event, '${val}')"
                    ontouchstart="handleWBCategoryTouchStart(event, '${val}')"
                    ontouchend="handleWBCategoryTouchEnd()"` : '';
                return `<div class="wb-cate-chip ${activeWBCategory === val ? 'active' : ''}" onclick="filterWorldBook('${val}')" ${interactionHandlers}>${c}</div>`;
             }).join('');

             // Render List
             const l = document.getElementById('wb-list');
             if (!l) return;
             
             let list = store.worldbooks || [];
             if(activeWBCategory !== 'all') {
                 list = list.filter(w => w.cate === activeWBCategory);
             }
             
             if(list.length === 0) {
                 l.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">暂无内容</div>';
                 return;
             }

             // [OPT-世界书卡顿] 使用DocumentFragment批量构建DOM，减少重排
             const frag = document.createDocumentFragment();
             const cateOptCache = ['<option value="">无分类</option>'].concat((store.categories||[]).map(cat => `<option value="${cat}">${cat}</option>`)).join('');

             list.forEach((w, idx) => {
                const item = document.createElement('div');
                item.className = 'group-box wb-item collapsed';
                item.style.padding = '15px';
                
                // [FIX-世界书收起展开] Header click to toggle collapse, properly handle edit mode
                item.onclick = function(e) {
                    if (wbBatchMode) {
                        // 批量模式下点击整行切换选中
                        e.stopPropagation();
                        var _wid = w.id;
                        var _idx = wbBatchSelected.indexOf(_wid);
                        if (_idx > -1) wbBatchSelected.splice(_idx, 1);
                        else wbBatchSelected.push(_wid);
                        renderWorldBooks();
                        return;
                    }
                    if(!e.target.closest('.wb-btn') && !e.target.closest('textarea') && !e.target.closest('input') && !e.target.closest('select') && !e.target.closest('.wb-btn-row')) {
                        // [FIX-编辑按钮消失] 如果当前在编辑模式，只退出编辑模式，不折叠
                        if (this.classList.contains('wb-editing')) {
                            this.classList.remove('wb-editing');
                            return;
                        }

                        this.classList.toggle('collapsed');
                        const arrow = this.querySelector('.wb-collapse-arrow');
                        if (arrow) arrow.style.transform = this.classList.contains('collapsed') ? 'rotate(0deg)' : 'rotate(90deg)';
                    }
                };

                const kwStr = (w.keywords || []).join(', ');
                const htmlStr = w.htmlCode || '';
                // [OPT] 缓存分类选项，只替换selected状态
                const cateOptions = w.cate ? cateOptCache.replace(`value="${w.cate}"`, `value="${w.cate}" selected`) : cateOptCache;
                const isBatchChecked = wbBatchMode && wbBatchSelected.indexOf(w.id) > -1;
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            ${wbBatchMode ? `<div onclick="toggleWbBatchSelect(event,'${w.id}')" style="width:22px;height:22px;border-radius:4px;border:2px solid ${isBatchChecked ? '#fa5151' : '#ccc'};background:${isBatchChecked ? '#fa5151' : '#fff'};display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;"><i class="fas fa-check" style="color:#fff;font-size:12px;${isBatchChecked ? '' : 'display:none;'}"></i></div>` : `<i class="fas fa-chevron-right wb-collapse-arrow" style="font-size:12px; color:#999; transition:transform 0.2s;"></i>`}
                            <strong>${_escapeHtml(w.name)}</strong>
                            ${w.cate ? `<span style="background:#f0f0f0; padding:2px 8px; border-radius:4px; font-size:12px; margin-left:5px;">${_escapeHtml(w.cate)}</span>` : ''}
                            ${w.keywords && w.keywords.length > 0 ? `<span style="background:#e8f5e9; color:#2e7d32; padding:2px 8px; border-radius:4px; font-size:11px;"><i class="fas fa-code" style="margin-right:3px;"></i>HTML弹窗</span>` : ''}
                            ${w.injectionPosition && w.injectionPosition !== 'middle' ? `<span style="background:${w.injectionPosition === 'before' ? '#e3f2fd' : '#fff3e0'}; color:${w.injectionPosition === 'before' ? '#1565c0' : '#e65100'}; padding:2px 8px; border-radius:4px; font-size:11px;">📌${w.injectionPosition === 'before' ? '前' : '后'}</span>` : ''}
                            ${w.triggerMode === 'keyword' ? `<span style="background:#fce4ec; color:#c62828; padding:2px 8px; border-radius:4px; font-size:11px;">🎯触发</span>` : ''}
                        </div>
                        ${wbBatchMode ? '' : `<button class="wb-btn edit" onclick="event.stopPropagation(); editWbItem(this, '${w.id}')">编辑</button>`}
                    </div>
                    <div class="wb-content" id="wb-content-${w.id}" style="user-select:text;-webkit-user-select:text;">${_escapeHtml(w.content)}</div>
                    <div class="wb-edit-area" id="wb-edit-${w.id}">
                        <div style="margin-bottom:8px;">
                            <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">名称</label>
                            <input id="wb-name-${w.id}" value="${w.name}" placeholder="世界书名称" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:13px; box-sizing:border-box;" onclick="event.stopPropagation()">
                        </div>
                        <div style="margin-bottom:8px;">
                            <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">分类</label>
                            <select id="wb-cate-${w.id}" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:13px; box-sizing:border-box;" onclick="event.stopPropagation()">${cateOptions}</select>
                        </div>
                        <div style="margin-bottom:8px;">
                            <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">内容</label>
                            <textarea id="wb-textarea-${w.id}" onclick="event.stopPropagation()">${w.content}</textarea>
                        </div>
                        <div style="margin-top:8px;">
                            <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">触发关键词 (逗号分隔)</label>
                            <input id="wb-keywords-${w.id}" value="${kwStr}" placeholder="如: 菜单,menu,点餐" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:13px; box-sizing:border-box;" onclick="event.stopPropagation()">
                        </div>
                        <div style="margin-top:8px;">
                            <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">HTML弹窗代码</label>
                            <textarea id="wb-html-${w.id}" placeholder="输入HTML代码，当关键词被提及时将渲染为弹窗" style="width:100%; height:80px; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:13px; font-family:monospace; resize:vertical; box-sizing:border-box;" onclick="event.stopPropagation()">${htmlStr}</textarea>
                        </div>
                        <div style="margin-top:8px;">
                            <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">📌 注入位置</label>
                            <select id="wb-injection-pos-${w.id}" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:13px; box-sizing:border-box;" onclick="event.stopPropagation()">
                                <option value="before" ${w.injectionPosition === 'before' ? 'selected' : ''}>前（最先发送给AI）</option>
                                <option value="middle" ${!w.injectionPosition || w.injectionPosition === 'middle' ? 'selected' : ''}>中（默认，随人设一起）</option>
                                <option value="after" ${w.injectionPosition === 'after' ? 'selected' : ''}>后（最后发送给AI）</option>
                            </select>
                        </div>
                        <div style="margin-top:8px;">
                            <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">🎯 触发模式（减少注意力稀释）</label>
                            <select id="wb-trigger-mode-${w.id}" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:13px; box-sizing:border-box;" onclick="event.stopPropagation()" onchange="document.getElementById('wb-trigger-kw-row-${w.id}').style.display=this.value==='keyword'?'block':'none'">
                                <option value="always" ${!w.triggerMode || w.triggerMode === 'always' ? 'selected' : ''}>始终注入（默认）</option>
                                <option value="keyword" ${w.triggerMode === 'keyword' ? 'selected' : ''}>关键词触发（对话提到时才注入）</option>
                            </select>
                        </div>
                        <div id="wb-trigger-kw-row-${w.id}" style="margin-top:8px;${(!w.triggerMode || w.triggerMode !== 'keyword') ? 'display:none;' : ''}">
                            <label style="font-size:12px; color:#888; display:block; margin-bottom:4px;">🔑 触发关键词（逗号分隔，对话中出现任一关键词时注入此世界书）</label>
                            <input id="wb-trigger-kw-${w.id}" value="${(w.triggerKeywords || []).join(',')}" placeholder="如: 咖啡馆,星月,约会" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; font-size:13px; box-sizing:border-box;" onclick="event.stopPropagation()">
                        </div>
                        <div class="wb-btn-row">
                            <button class="wb-btn del" onclick="deleteWbItem('${w.id}')">删除</button>
                            <button class="wb-btn cancel" onclick="cancelEditWbItem('${w.id}')">取消</button>
                            <button class="wb-btn save" onclick="saveWbItem('${w.id}')">保存</button>
                        </div>
                    </div>
                `;
                frag.appendChild(item);
             });
             // [OPT] 一次性清空并插入，只触发一次重排
             l.innerHTML = '';
             l.appendChild(frag);

             // 批量模式：底部操作栏
             if (wbBatchMode) {
                 var batchBar = document.createElement('div');
                 batchBar.style.cssText = 'position:sticky;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #eee;padding:10px 15px;display:flex;align-items:center;justify-content:space-between;z-index:10;box-shadow:0 -2px 8px rgba(0,0,0,0.06);';
                 var allChecked = list.length > 0 && wbBatchSelected.length === list.length;
                 batchBar.innerHTML = '<div onclick="wbBatchSelectAll()" style="display:flex;align-items:center;gap:8px;cursor:pointer;">'
                     + '<div style="width:20px;height:20px;border-radius:4px;border:2px solid ' + (allChecked ? '#fa5151' : '#ccc') + ';background:' + (allChecked ? '#fa5151' : '#fff') + ';display:flex;align-items:center;justify-content:center;">'
                     + '<i class="fas fa-check" style="color:#fff;font-size:11px;' + (allChecked ? '' : 'display:none;') + '"></i></div>'
                     + '<span style="font-size:13px;color:#333;">全选</span></div>'
                     + '<div style="display:flex;align-items:center;gap:12px;">'
                     + '<span style="font-size:12px;color:#999;">已选 ' + wbBatchSelected.length + ' 项</span>'
                     + '<button onclick="wbBatchDeleteSelected()" style="padding:8px 20px;background:' + (wbBatchSelected.length > 0 ? '#fa5151' : '#ccc') + ';color:#fff;border:none;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;">删除</button>'
                     + '</div>';
                 l.appendChild(batchBar);
             }
        }

        function editWbItem(btn, id) {
            const item = btn.closest('.wb-item');
            item.classList.remove('collapsed'); // Ensure expanded
            // [FIX-世界书编辑] 使用CSS class控制编辑模式，避免inline display与CSS冲突
            item.classList.add('wb-editing');
            const arrow = item.querySelector('.wb-collapse-arrow');
            if (arrow) arrow.style.transform = 'rotate(90deg)';
        }

        function cancelEditWbItem(id) {
            // [FIX-世界书编辑] 移除编辑模式class，恢复正常显示
            const editArea = document.getElementById(`wb-edit-${id}`);
            const item = editArea ? editArea.closest('.wb-item') : null;
            if (item) {
                item.classList.remove('wb-editing');
            }
        }

        function saveWbItem(id) {
            // [FIX] 收起移动端键盘
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
            const newContent = document.getElementById(`wb-textarea-${id}`).value;
            const nameEl = document.getElementById(`wb-name-${id}`);
            const cateEl = document.getElementById(`wb-cate-${id}`);
            const kwEl = document.getElementById(`wb-keywords-${id}`);
            const htmlEl = document.getElementById(`wb-html-${id}`);
            const wb = store.worldbooks.find(w => w.id === id);
            if(wb) {
                if (nameEl && nameEl.value.trim()) wb.name = nameEl.value.trim();
                if (cateEl) wb.cate = cateEl.value;
                wb.content = newContent;
                if (kwEl) wb.keywords = kwEl.value.split(',').map(k => k.trim()).filter(k => k);
                if (htmlEl) wb.htmlCode = htmlEl.value;
                const injPosEl = document.getElementById(`wb-injection-pos-${id}`);
                if (injPosEl) wb.injectionPosition = injPosEl.value;
                // [NEW-触发式注入] 保存触发模式和触发关键词
                const triggerModeEl = document.getElementById(`wb-trigger-mode-${id}`);
                if (triggerModeEl) wb.triggerMode = triggerModeEl.value;
                const triggerKwEl = document.getElementById(`wb-trigger-kw-${id}`);
                if (triggerKwEl) wb.triggerKeywords = triggerKwEl.value.split(',').map(k => k.trim()).filter(k => k);
                save();
                renderWorldBooks();
                toast("已保存");
            }
        }

        function deleteWbItem(id) {
            showConfirm("删除世界书", "确定删除这条世界书内容吗？", () => {
                store.worldbooks = store.worldbooks.filter(w => w.id !== id);
                
                // 清理所有联系人中对该世界书的挂载引用
                (store.contacts || []).forEach(c => {
                    if (c.settings) {
                        // 清理新版多挂载列表
                        if (c.settings.mountedWbIds && Array.isArray(c.settings.mountedWbIds)) {
                            c.settings.mountedWbIds = c.settings.mountedWbIds.filter(wbId => String(wbId) !== String(id));
                        }
                        // 清理旧版单挂载
                        if (c.settings.wb === id) {
                            c.settings.wb = '';
                        }
                    }
                });
                
                // [FIX-世界书数量] 清理全局世界书引用，防止删除后数量仍显示旧值
                store.globalWbIds = (store.globalWbIds || []).filter(gid => String(gid) !== String(id));
                if (store.globalWbMounts) delete store.globalWbMounts[String(id)];
                
                save();
                renderWorldBooks();
                toast("已删除");
            });
        }
        
        function filterWorldBook(cat) {
            activeWBCategory = cat;
            renderWorldBooks();
        }

        function handleWBCategoryTouchStart(e, catName) {
            isLongPress = false;
            activeWBCategoryName = catName;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                showWBCategoryMenu(e, catName);
            }, 500);
        }

        function handleWBCategoryTouchEnd() {
            clearTimeout(longPressTimer);
        }

        function showWBCategoryMenu(e, catName) {
            e.preventDefault();
            e.stopPropagation();
            activeWBCategoryName = catName;
            const menu = document.getElementById('wb-category-menu');
            
            // Use clientX/Y from touch or mouse event
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const y = e.touches ? e.touches[0].clientY : e.clientY;

            menu.style.display = 'flex';
            const rect = menu.getBoundingClientRect();
            menu.style.left = `${Math.min(x, window.innerWidth - rect.width - 10)}px`;
            menu.style.top = `${Math.min(y, window.innerHeight - rect.height - 10)}px`;
        }

        function renameWBCategory() {
            if (!activeWBCategoryName) return;
            showPromptModal('重命名分类 "' + activeWBCategoryName + '":', activeWBCategoryName).then(function(newName) {
            if (newName && newName.trim() !== activeWBCategoryName) {
                const oldName = activeWBCategoryName;
                const index = store.categories.indexOf(oldName);
                if (index > -1) {
                    store.categories[index] = newName;
                }
                (store.worldbooks || []).forEach(wb => {
                    if (wb.cate === oldName) {
                        wb.cate = newName;
                    }
                });
                if (activeWBCategory === oldName) {
                    activeWBCategory = newName;
                }
                save();
                renderWorldBooks();
                toast('分类已重命名', 'success');
            }
            });
            document.getElementById('wb-category-menu').style.display = 'none';
        }

        function toggleWBCategoryManageMenu(e) {
            e.stopPropagation();
            const menu = document.getElementById('wb-category-manage-menu');
            const addMenu = document.getElementById('wb-add-menu');
            if (addMenu) addMenu.style.display = 'none';
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }

        function manageWBCategoryRename() {
            document.getElementById('wb-category-manage-menu').style.display = 'none';
            if (activeWBCategory === 'all') {
                toast('请先选择一个分类', 'error');
                return;
            }
            const oldName = activeWBCategory;
            showPromptModal('重命名分类 "' + oldName + '":', oldName).then(function(newName) {
                if (newName && newName.trim() !== oldName) {
                    const trimmedName = newName.trim();
                    const index = store.categories.indexOf(oldName);
                    if (index > -1) {
                        store.categories[index] = trimmedName;
                    }
                    (store.worldbooks || []).forEach(wb => {
                        if (wb.cate === oldName) {
                            wb.cate = trimmedName;
                        }
                    });
                    activeWBCategory = trimmedName;
                    save();
                    renderWorldBooks();
                    toast('分类已重命名', 'success');
                }
            });
        }

        function manageWBCategoryDelete() {
            document.getElementById('wb-category-manage-menu').style.display = 'none';
            if (activeWBCategory === 'all') {
                toast('请先选择一个分类', 'error');
                return;
            }
            const nameToDelete = activeWBCategory;
            showConfirm('删除分类', `确定要删除分类 "${nameToDelete}" 吗？该分类下的世界书将变为"无分类"。`, () => {
                // Remove from categories list
                store.categories = (store.categories || []).filter(c => c !== nameToDelete);
                // Un-categorize associated world books
                (store.worldbooks || []).forEach(wb => {
                    if (wb.cate === nameToDelete) {
                        wb.cate = '';
                    }
                });
                activeWBCategory = 'all';
                save();
                renderWorldBooks();
                toast('分类已删除');
            });
        }

        function deleteWBCategory() {
            if (!activeWBCategoryName) return;
            showConfirm('删除分类', `确定要删除分类 "${activeWBCategoryName}" 吗？该分类下的世界书将变为"无分类"。`, () => {
                const nameToDelete = activeWBCategoryName;
                // Remove from categories list
                store.categories = (store.categories || []).filter(c => c !== nameToDelete);
                // Un-categorize associated world books
                (store.worldbooks || []).forEach(wb => {
                    if (wb.cate === nameToDelete) {
                        wb.cate = '';
                    }
                });
                // If the deleted category was active, switch to 'all'
                if (activeWBCategory === nameToDelete) {
                    activeWBCategory = 'all';
                }
                save();
                renderWorldBooks();
                toast('分类已删除');
            });
            document.getElementById('wb-category-menu').style.display = 'none';
        }


        // --- WORLD BOOK: 从微信"我的"界面打开世界书 ---
        function openWorldBookFromMe() {
            // 先关闭微信层，打开世界书层
            document.getElementById('layer-wechat').classList.remove('show');
            openApp('worldbook');
        }

        // --- WORLD BOOK: 全局设置界面（设置全局世界书 + 批量挂载） ---
        function openGlobalWBSettings() {
            const allWbs = store.worldbooks || [];
            if (!store.globalWbIds) store.globalWbIds = [];
            
            const overlay = document.createElement('div');
            overlay.id = 'global-wb-settings-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;';
            
            let tabHtml = `
            <div style="background:#fff;border-radius:12px;width:92%;max-width:420px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;">
                <div style="padding:16px 20px;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between;">
                    <div style="font-size:17px;font-weight:bold;color:#333;">世界书设置</div>
                    <div onclick="document.getElementById('global-wb-settings-overlay').remove()" style="cursor:pointer;font-size:18px;color:#999;padding:4px 8px;">×</div>
                </div>
                <div style="display:flex;border-bottom:1px solid #e0e0e0;" id="gwb-tab-bar">
                    <div class="gwb-tab active" onclick="switchGWBTab('global')" data-tab="global" style="flex:1;text-align:center;padding:12px;cursor:pointer;font-size:14px;font-weight:600;color:#333;border-bottom:2px solid #333;margin-bottom:-1px;">全局世界书</div>
                    <div class="gwb-tab" onclick="switchGWBTab('batch')" data-tab="batch" style="flex:1;text-align:center;padding:12px;cursor:pointer;font-size:14px;color:#999;">批量挂载</div>
                </div>
                <div id="gwb-tab-content" style="flex:1;overflow-y:auto;padding:16px;"></div>
            </div>`;
            
            overlay.innerHTML = tabHtml;
            document.body.appendChild(overlay);
            
            // 默认显示全局世界书标签
            renderGWBGlobalTab();
        }
        
        function switchGWBTab(tab) {
            document.querySelectorAll('#gwb-tab-bar .gwb-tab').forEach(t => {
                if (t.dataset.tab === tab) {
                    t.style.color = '#333';
                    t.style.borderBottom = '2px solid #333';
                    t.style.fontWeight = '600';
                } else {
                    t.style.color = '#999';
                    t.style.borderBottom = 'none';
                    t.style.fontWeight = 'normal';
                }
            });
            if (tab === 'global') renderGWBGlobalTab();
            else renderGWBBatchTab();
        }
        
