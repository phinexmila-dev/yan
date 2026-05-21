        // ===== MAILBOX APP =====
        let mailCurrentTab = 'inbox';
        let mailComposeToId = null;
        let currentReadMailId = null;

        // ===== 邮件语音朗读 (TTS) =====
        let _mailTtsState = 'idle'; // idle | loading | playing | paused
        let _mailTtsAudio = null;
        let _mailTtsSegments = []; // 分段文本队列
        let _mailTtsCurrentSeg = 0;
        let _mailTtsAbort = false; // 中止标志

        function ensureMailbox() {
            if (!store.mailbox) store.mailbox = [];
        }

        // [新增] 邮件总结到记忆系统
        function saveMailToMemory(contactId, mail, direction) {
            if (!store.memorySummaries) store.memorySummaries = {};
            if (!store.memorySummaries[contactId]) store.memorySummaries[contactId] = [];
            const contact = (store.contacts || []).find(c => c.id === contactId);
            const contactName = contact ? contact.name : '联系人';
            const userName = (typeof getUserPersonaName === 'function' && contact)
                ? getUserPersonaName(contact, store.user.name || '用户')
                : (store.user.name || '用户');
            const dirLabel = direction === 'inbox'
                ? contactName + '给' + userName + '写了邮件'
                : userName + '给' + contactName + '写了邮件';
            const bodyPreview = ((mail.body || '') + '').substring(0, 200);
            // 去重
            if (store.memorySummaries[contactId].some(m => m.mailId === mail.id)) return;
            var _mailMemo = {
                id: 'memo_mail_' + Date.now(),
                date: Date.now(),
                content: '[邮件记忆] ' + dirLabel + '，主题："' + (mail.subject || '无主题') + '"，大意：' + bodyPreview,
                source: 'mail',
                mailId: mail.id
            };
            store.memorySummaries[contactId].push(_mailMemo);
            // [FIX-记忆同步] 同步到新记忆系统
            // [FIX-邮件记忆分类] 显式传入 channel:'mail'，让记忆被归类为"邮件往来"而非"手动添加"
            try {
                if (window.MemorySystem && window.MemorySystem.Pipeline) {
                    window.MemorySystem.Pipeline.addManual(contactId, _mailMemo.content, {
                        channel: 'mail',
                        scene: '邮件往来',
                        tags: ['mail']
                    });
                }
            } catch(_e) {}
            // 限制记忆总数
            if (store.memorySummaries[contactId].length > 100) {
                store.memorySummaries[contactId] = store.memorySummaries[contactId].slice(-80);
            }
        }

        function renderMailbox() {
            ensureMailbox();
            renderMailList();
            updateMailBadge();
        }

        function switchMailTab(tab) {
            mailCurrentTab = tab;
            document.querySelectorAll('.mail-tab').forEach(t => t.classList.remove('active'));
            document.getElementById('mail-tab-' + tab).classList.add('active');
            renderMailList();
        }

        function renderMailList() {
            ensureMailbox();
            const list = document.getElementById('mail-list');
            let mails = store.mailbox.filter(m => {
                if (mailCurrentTab === 'inbox') return m.type === 'inbox';
                if (mailCurrentTab === 'sent') return m.type === 'sent';
                if (mailCurrentTab === 'starred') return m.starred;
                return true;
            }).sort((a, b) => b.time - a.time);

            if (mails.length === 0) {
                const labels = { inbox: '收件箱为空', sent: '暂无已发送邮件', starred: '暂无星标邮件' };
                list.innerHTML = `<div class="mail-empty"><i class="fas fa-inbox"></i><span>${labels[mailCurrentTab] || '暂无邮件'}</span></div>`;
                return;
            }

            list.innerHTML = mails.map(m => {
                const contact = m.type === 'sent'
                    ? store.contacts.find(c => c.id === m.to)
                    : store.contacts.find(c => c.id === m.from);
                // [FIX-系统邮件] 联系人被删除后，使用邮件中保存的名字或标记为"已删除联系人"
                const name = contact ? contact.name : (m.senderName || (m.type === 'sent' ? '已删除联系人' : '已删除联系人'));
                const avatar = contact?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name[0])}&background=random&size=80`;
                const timeStr = formatMailTime(m.time);
                return `<div class="mail-item ${!m.read ? 'unread' : ''}" onclick="openReadMail('${m.id}')">
                    ${!m.read ? '<div class="mail-item-dot"></div>' : ''}
                    <img class="mail-item-avatar" src="${avatar}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name[0])}&background=random&size=80'">
                    <div class="mail-item-body">
                        <div class="mail-item-header">
                            <span class="mail-item-sender">${m.type === 'sent' ? '→ ' + name : name}</span>
                            <span class="mail-item-time">${timeStr}</span>
                        </div>
                        <div class="mail-item-subject">${m.subject || '(无主题)'}</div>
                        <div class="mail-item-preview">${(m.body || '').substring(0, 50)}</div>
                    </div>
                    ${m.starred ? '<div class="mail-item-star"><i class="fas fa-star"></i></div>' : ''}
                </div>`;
            }).join('');
        }

        function formatMailTime(ts) {
            const d = new Date(ts);
            const now = new Date();
            const diff = now - d;
            if (diff < 60000) return '刚刚';
            if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
            if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
            if (diff < 172800000) return '昨天';
            return (d.getMonth() + 1) + '/' + d.getDate();
        }

        function updateMailBadge() {
            ensureMailbox();
            const unread = store.mailbox.filter(m => m.type === 'inbox' && !m.read).length;
            const badge = document.getElementById('mail-badge-inbox');
            if (badge) {
                if (unread > 0) {
                    badge.textContent = unread > 99 ? '99+' : unread;
                    badge.classList.add('show');
                } else {
                    badge.classList.remove('show');
                }
            }
        }

        function openReadMail(id) {
            ensureMailbox();
            // 切换邮件时停止上一封的语音播放
            stopMailTts();
            const m = store.mailbox.find(x => x.id === id);
            if (!m) return;
            currentReadMailId = id;
            if (!m.read) { m.read = true; save(); updateMailBadge(); renderMailList(); }

            const isInbox = m.type === 'inbox';
            const contact = store.contacts.find(c => c.id === (isInbox ? m.from : m.to));
            // [FIX-系统邮件] 联系人被删除后使用邮件中保存的名字
            const name = contact ? contact.name : (m.senderName || '已删除联系人');
            const avatar = contact?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name[0])}&background=random&size=80`;
            const d = new Date(m.time);
            const dateStr = d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate() + ' ' + d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');

            // 判断是否可以朗读（收件箱邮件 + MiniMax已配置）
            const hasTts = !!(store.system && store.system.minimax && store.system.minimax.apiKey);

            document.getElementById('mail-read-content').innerHTML = `
                <div class="mail-read-header">
                    <div class="mail-read-subject">${m.subject || '(无主题)'} ${m.starred ? '<i class="fas fa-star" style="color:#f5a623;font-size:16px;"></i>' : ''}</div>
                    <div class="mail-read-meta">
                        <img class="mail-read-avatar" src="${avatar}" onerror="this.src='https://ui-avatars.com/api/?name=?&background=random&size=80'">
                        <div class="mail-read-info">
                            <div class="mail-read-sender">${isInbox ? name : '我 → ' + name}</div>
                            <div class="mail-read-date">${dateStr}</div>
                        </div>
                    </div>
                </div>
                <div class="mail-read-body" style="${_getMailFontCSS()}">${m.body || ''}</div>
                <div class="mail-read-actions">
                    ${hasTts ? `<div class="mail-read-btn" id="mail-tts-btn" onclick="readMailAloud()"><i class="fas fa-volume-up"></i> 朗读</div>` : ''}
                    ${isInbox ? `<div class="mail-read-btn" onclick="replyMail()"><i class="fas fa-reply"></i> 回复</div>` : ''}
                    <div class="mail-read-btn" onclick="toggleStarMail()"><i class="fas fa-star"></i> ${m.starred ? '取消星标' : '星标'}</div>
                    <div class="mail-read-btn" onclick="deleteMail()" style="color:#fa5151;"><i class="fas fa-trash-alt"></i> 删除</div>
                </div>
            `;
            document.getElementById('layer-mail-read').classList.add('show');
        }

        function replyMail() {
            stopMailTts();
            ensureMailbox();
            const m = store.mailbox.find(x => x.id === currentReadMailId);
            if (!m) return;
            closeLayer('layer-mail-read');
            mailComposeToId = m.from;
            window._mailIsReply = true;
            // 保存原始邮件内容，供回复时传递给AI生成回复
            window._mailReplyOriginal = {
                subject: m.subject || '',
                body: m.body || '',
                from: m.from,
                to: m.to
            };
            const contact = (store.contacts || []).find(c => c.id === m.from);
            document.getElementById('mail-to-name').textContent = contact ? contact.name : (m.senderName || '已删除联系人');
            document.getElementById('mail-to-name').style.color = '#333';
            // [FIX] 去除已有的 Re: 前缀，防止 Re:Re:Re: 叠加
            const cleanSubject = (m.subject || '').replace(/^(Re:\s*)+/i, '').trim();
            document.getElementById('mail-subject').value = 'Re: ' + cleanSubject;
            document.getElementById('mail-body').value = '';
            document.getElementById('layer-mail-compose').classList.add('show');
        }

        function toggleStarMail() {
            ensureMailbox();
            const m = store.mailbox.find(x => x.id === currentReadMailId);
            if (!m) return;
            m.starred = !m.starred;
            save();
            openReadMail(currentReadMailId);
            renderMailList();
            showToast(m.starred ? '已添加星标' : '已取消星标');
        }

        function deleteMail() {
            showConfirm('删除邮件', '确定要删除这封邮件吗？', () => {
                stopMailTts();
                ensureMailbox();
                store.mailbox = store.mailbox.filter(x => x.id !== currentReadMailId);
                save();
                closeLayer('layer-mail-read');
                renderMailList();
                updateMailBadge();
                showToast('邮件已删除');
            });
        }

        // 原地编辑邮件功能
        function editMail() {
            ensureMailbox();
            const m = store.mailbox.find(x => x.id === currentReadMailId);
            if (!m) return;
            closeMailReadMenu();

            const isInbox = m.type === 'inbox';
            const contact = store.contacts.find(c => c.id === (isInbox ? m.from : m.to));
            const name = contact ? contact.name : '未知';
            const avatar = contact?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name[0])}&background=random&size=80`;
            const d = new Date(m.time);
            const dateStr = d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate() + ' ' + d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');

            document.getElementById('mail-read-content').innerHTML = `
                <div class="mail-read-header">
                    <div class="mail-read-subject-edit">
                        <label style="font-size:12px;color:#999;margin-bottom:4px;display:block;">主题</label>
                        <input type="text" id="mail-edit-subject" value="${(m.subject || '').replace(/"/g, '&quot;')}"
                            style="width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:8px;font-size:15px;box-sizing:border-box;background:#f9f9f9;">
                    </div>
                    <div class="mail-read-meta" style="margin-top:10px;">
                        <img class="mail-read-avatar" src="${avatar}" onerror="this.src='https://ui-avatars.com/api/?name=?&background=random&size=80'">
                        <div class="mail-read-info">
                            <div class="mail-read-sender">${isInbox ? name : '我 → ' + name}</div>
                            <div class="mail-read-date">${dateStr}</div>
                        </div>
                    </div>
                </div>
                <div style="margin-top:12px;">
                    <label style="font-size:12px;color:#999;margin-bottom:4px;display:block;">正文</label>
                    <textarea id="mail-edit-body" style="width:100%;min-height:300px;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:14px;line-height:1.8;resize:vertical;box-sizing:border-box;background:#f9f9f9;font-family:inherit;">${(m.body || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                </div>
                <div style="display:flex;gap:10px;margin-top:16px;justify-content:flex-end;">
                    <button onclick="cancelEditMail()" style="padding:8px 20px;border:1px solid #ddd;background:#fff;border-radius:20px;font-size:14px;cursor:pointer;color:#666;">取消</button>
                    <button onclick="saveEditMail()" style="padding:8px 20px;border:none;background:#1a1a1a;color:#fff;border-radius:20px;font-size:14px;cursor:pointer;font-weight:500;">保存</button>
                </div>
            `;
        }

        function saveEditMail() {
            ensureMailbox();
            const m = store.mailbox.find(x => x.id === currentReadMailId);
            if (!m) return;
            const newSubject = document.getElementById('mail-edit-subject')?.value?.trim();
            const newBody = document.getElementById('mail-edit-body')?.value?.trim();
            if (newSubject !== undefined) m.subject = newSubject || '(无主题)';
            if (newBody !== undefined) m.body = newBody;
            save();
            showToast('邮件已保存');
            openReadMail(currentReadMailId); // 重新渲染阅读视图
            renderMailList();
        }

        function cancelEditMail() {
            openReadMail(currentReadMailId); // 恢复阅读视图
        }

        function openComposeMail() {
            window._mailIsReply = false;
            mailComposeToId = null;
            document.getElementById('mail-to-name').textContent = '选择联系人';
            document.getElementById('mail-to-name').style.color = '#999';
            document.getElementById('mail-subject').value = '';
            document.getElementById('mail-body').value = '';
            document.getElementById('layer-mail-compose').classList.add('show');
        }

        function openMailContactPicker() {
            const list = document.getElementById('mail-contact-list');
            const contacts = (store.contacts || []).filter(c => !c.isGroup);
            if (contacts.length === 0) {
                list.innerHTML = '<div class="mail-empty"><i class="fas fa-user-slash"></i><span>暂无联系人</span></div>';
            } else {
                list.innerHTML = contacts.map(c => {
                    const avatar = c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name[0])}&background=random&size=80`;
                    return `<div class="mail-contact-item" onclick="selectMailContact('${c.id}')">
                        <img src="${avatar}" onerror="this.src='https://ui-avatars.com/api/?name=?&background=random&size=80'">
                        <div>
                            <div class="name">${c.name}</div>
                            <div class="email">${c.name}@ai.mail</div>
                        </div>
                    </div>`;
                }).join('');
            }
            document.getElementById('layer-mail-contacts').classList.add('show');
        }

        function selectMailContact(id) {
            mailComposeToId = id;
            const c = (store.contacts || []).find(x => x.id === id);
            document.getElementById('mail-to-name').textContent = c ? c.name : '未知';
            document.getElementById('mail-to-name').style.color = '#333';
            closeLayer('layer-mail-contacts');
        }

        function sendMail() {
            if (!mailComposeToId) return showToast('请选择收件人');
            const subject = document.getElementById('mail-subject').value.trim();
            const body = document.getElementById('mail-body').value.trim();
            if (!body) return showToast('请输入邮件内容');
            ensureMailbox();

            const mailId = 'mail_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            const _toContact = store.contacts.find(c => c.id === mailComposeToId);
            store.mailbox.push({
                id: mailId, from: '__user__', to: mailComposeToId,
                subject: subject || '(无主题)', body, time: Date.now(),
                read: true, starred: false, type: 'sent',
                senderName: _toContact?.name || '' // [FIX-系统邮件] 保存收件人名字
            });
            // [新增] 用户发送的邮件写入记忆
            saveMailToMemory(mailComposeToId, { id: mailId, subject: subject || '(无主题)', body }, 'sent');
            save();
            closeLayer('layer-mail-compose');
            showToast('邮件已发送');
            renderMailList();

            // AI auto-reply after a delay
            const contact = (store.contacts || []).find(c => c.id === mailComposeToId);
            if (contact) {
                const delay = 3000 + Math.random() * 7000;
                const _contactOrigBody = window._mailIsReply && window._mailReplyOriginal ? window._mailReplyOriginal.body : null;
                setTimeout(() => generateAIMailReply(contact, subject, body, _contactOrigBody), delay);
            }
        }

        async function generateAIMailReply(contact, originalSubject, originalBody, contactOriginalBody) {
            ensureMailbox();
            const ctx = buildMailContext(contact);
            const userName = getUserPersonaName(contact, store.user.name || '用户');
            const _now = new Date();
            const hour = _now.getHours();
            let timeHint = '白天';
            if (hour < 6) timeHint = '凌晨';
            else if (hour < 9) timeHint = '早晨';
            else if (hour < 12) timeHint = '上午';
            else if (hour < 14) timeHint = '中午';
            else if (hour < 18) timeHint = '下午';
            else if (hour < 22) timeHint = '晚上';
            else timeHint = '深夜';
            const _weekDays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
            const fullDateStr = `${_now.getFullYear()}年${_now.getMonth()+1}月${_now.getDate()}日 ${_weekDays[_now.getDay()]} ${hour.toString().padStart(2,'0')}:${_now.getMinutes().toString().padStart(2,'0')}`;

            // [FIX] 收集最近往来邮件摘要用于去重，避免回复内容重复
            const recentMailSummaries = getRecentMailSummaries(contact.id, 12);
            const dedupHint = recentMailSummaries.length > 0
                ? `\n\n【严格去重要求——违反则整封信作废】以下是你们最近的全部邮件往来，你的回复在主题、内容、结构、开头方式、情感表达、用词习惯上必须和以下每一封都明显不同。不许重复任何一封信的核心观点、叙事结构或情感套路：\n${recentMailSummaries.join('\n')}`
                : '';

            // 构建邮件线索上下文：如果用户是在回复联系人之前写的信，则包含之前的信件内容
            let threadContext = '';
            if (contactOriginalBody) {
                threadContext = `\n\n【之前的信件线索——你(${contact.name})之前写给${userName}的信】\n${contactOriginalBody.substring(0, 2000)}\n【信件线索结束】\n${userName}是在回复你上面这封信，你需要根据你之前写的信和${userName}的回复来写回信，保持对话的连贯性。`;
            }

            let replyBody = '';
            try {
                const sysPrompt = `你是${contact.name}，正在回复${userName}发来的一封邮件。你现在要写一封真正能打动人心的回信。

【━━━ 你的人设（回信时必须完全体现，每一句话都要符合这个角色）━━━】
${ctx.persona || '一个有个性的人'}
【━━━ 人设结束 ━━━】

${ctx.worldBook ? `【━━━ 世界观背景（最高优先级，回信内容必须符合此世界观）━━━】\n${ctx.worldBook}\n【━━━ 世界观结束 ━━━】\n` : ''}
${ctx.memoryContext ? `【你和${userName}的全局记忆——必须读取并在回信中自然融入相关记忆】\n${ctx.memoryContext}\n` : ''}
${ctx.chatContext ? `【最近的聊天记录（参考说话风格、情感状态）】\n${ctx.chatContext}\n` : ''}
${threadContext}

当前日期时间：${fullDateStr}（${timeHint}）
${userName}发来的邮件主题：${(originalSubject || '(无主题)').replace(/^(Re:\s*)+/i, '')}
${userName}发来的邮件内容：${originalBody || '(空)'}
${dedupHint}

【⚠️ 字数硬性要求——不满800字视为失败】
你的回信正文必须超过800个中文字。这不是建议，是硬性要求。写不够800字说明你没有认真投入感情，没有真正把对方的信读进心里。一个真正在乎对方的人，收到一封认真的来信，回信时会有太多太多想说的话，800字根本不够写。

【回信核心要求】
1. 回复必须完全符合你的人设性格和说话风格——语气、用词、情感表达方式都必须是这个角色独有的
2. 逐一认真回应${userName}邮件中的每一个重要话题，不要泛泛而谈，不要忽略对方说的任何一点内容
3. 融入你对${userName}的真实情感——撒娇、吐槽、关心、调侃、心疼、嫉妒、思念，取决于你的人设
4. 如果有相关记忆或聊天背景，自然融入（"你上次说的那件事我一直记着……""还记得那天吗……"）
5. 用中文写作，直接输出回复正文，不要使用任何标签格式
6. 不要使用markdown格式
7. 【重要】你必须称呼对方为「${userName}」，不许叫"用户"、"User"、"默认"等

${getMailStylePromptText()}

【活人感强化——你是真实存在的人，在认真给最重要的人回信（不管选择何种风格，以下活人感要求始终生效）】
- 像真人手打：口语化断句、语气词（嗯、啊、哈哈、唉、诶、嘿）、自我纠正（"不对不对，我想说的是……"）、犹豫（"怎么说呢……""我也不知道该怎么表达"）
- 思维跳跃：写着写着突然想到另一件事，用"对了""话说""突然想起来""哦对""差点忘了"自然过渡
- 时间感：现在是${fullDateStr}，${timeHint === '凌晨' || timeHint === '深夜' ? '深夜写信更感性、更容易说心里话，语句散漫随意，用"…"表示思绪飘散，可以写"其实这些话我白天是说不出口的，只有在这种夜深人静的时候……"' : timeHint === '早晨' ? '早上写信带点刚睡醒的慵懒，可以说"刚醒来就看到你的信，还没完全清醒就开始回了"' : timeHint === '中午' ? '午休时间，可以说"趁着午休赶紧给你回信，下午还有事但你的信我不想拖"' : '正常状态，提到手边在做的事、窗外的天气、刚发生的小事'}。信中提到日期时必须使用真实的当前日期，不要编造日期。"昨天"就是指${_now.getFullYear()}年${_now.getMonth()+1}月${_now.getDate()-1}日，"前天"就是指${_now.getFullYear()}年${_now.getMonth()+1}月${_now.getDate()-2}日，以此类推，不要把昨天的事说成"前几天"
- 情绪层次变化：不要全篇一个情绪。吐槽着突然变温柔、认真着突然开玩笑、担心着突然安慰自己、思念着突然假装不在乎
- 必须有至少三个具体生活细节：正在做什么/喝什么/吃什么、窗外天气、刚发生的事、某个具体场景，营造"此刻感"
- ⚠️ 绝对禁止：① 排比句式 ② 总分总结构 ③ "首先/其次/最后" ④ 每段都以"我"开头 ⑤ "记得照顾好自己"式万能结尾 ⑥ 和之前任何一封信结构雷同`;

                const data = await API.chatCompletion([
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: `请回复这封邮件。你现在就是${contact.name}本人，不是AI。这封信要让${userName}读完之后心里发酸、眼眶发热。写出你最真实的感受，把心里话都说出来。正文必须超过800字。直接写回复内容。` }
                ], 0.80);
                replyBody = cleanMailContent((data.choices[0].message.content || '').trim());

                // 字数不足800时重试一次
                if (replyBody && replyBody.length < 800) {
                    try {
                        const retryData = await API.chatCompletion([
                            { role: 'system', content: sysPrompt },
                            { role: 'assistant', content: replyBody },
                            { role: 'user', content: `你写的回信只有${replyBody.length}字，太短了。${userName}给你写了那么认真的一封信，你就回这么点？重新写，这次必须超过800字。认真读对方的每一句话，逐一回应，把你心里真正想说的话全部写出来，不要有任何保留。直接输出完整的回信正文。` }
                        ], 0.80);
                        const retryBody = cleanMailContent((retryData.choices[0].message.content || '').trim());
                        if (retryBody && retryBody.length > replyBody.length) {
                            replyBody = retryBody;
                        }
                    } catch(retryErr) {
                        console.warn('Mail reply retry for length failed:', retryErr);
                    }
                }
            } catch(e) {
                console.error('AI mail reply generation failed:', e);
                showToast('回信生成失败: ' + (e.message || '请检查网络或API设置'));
                return;
            }

            // [FIX] 防止 Re: 叠加——先去除已有的所有 Re: 前缀，只保留一个
            const cleanSubject = (originalSubject || '(无主题)').replace(/^(Re:\s*)+/i, '').trim();
            const replySubject = 'Re: ' + cleanSubject;

            const replyId = 'mail_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            store.mailbox.push({
                id: replyId, from: contact.id, to: '__user__',
                subject: replySubject,
                body: replyBody, time: Date.now(),
                read: false, starred: false, type: 'inbox',
                senderName: contact.name // [FIX-系统邮件] 保存发件人名字
            });
            // [新增] AI回信写入记忆
            saveMailToMemory(contact.id, { id: replyId, subject: replySubject, body: replyBody }, 'inbox');
            save();

            // Refresh if mailbox is open
            // [FIX-邮件刷新] openApp添加的是show class，不是active
            if (document.getElementById('layer-mailbox')?.classList.contains('show') || document.getElementById('layer-mailbox')?.classList.contains('active')) {
                renderMailList();
                updateMailBadge();
            }
            showToast(contact.name + ' 回复了你的邮件');
        }

        // --- Mail Frequency Settings ---
        function getMailFreqSettings() {
            if (!store.mailFreqSettings) {
                store.mailFreqSettings = {
                    enabled: true,
                    dailyLimit: 2,
                    probability: 0.1,
                    interval: 30,
                    dedup: true,
                    preset: '3days'
                };
            }
            return store.mailFreqSettings;
        }

        function getPresetParams(preset) {
            const presets = {
                'high':    { probability: 0.5,   interval: 20,  dailyLimit: 5 },
                'daily':   { probability: 0.15,  interval: 60,  dailyLimit: 2 },
                '2days':   { probability: 0.08,  interval: 60,  dailyLimit: 1 },
                '3days':   { probability: 0.05,  interval: 90,  dailyLimit: 1 },
                'weekly':  { probability: 0.02,  interval: 120, dailyLimit: 1 },
                '2weeks':  { probability: 0.01,  interval: 180, dailyLimit: 1 },
                'monthly': { probability: 0.005, interval: 300, dailyLimit: 1 }
            };
            return presets[preset] || null;
        }

        function onMailFreqPresetChange(val) {
            const customArea = document.getElementById('mail-freq-custom-area');
            if (val === 'custom') {
                customArea.style.display = 'flex';
                customArea.style.flexDirection = 'column';
                customArea.style.gap = '14px';
            } else {
                customArea.style.display = 'none';
                // 回填预设参数到自定义控件供参考
                const p = getPresetParams(val);
                if (p) {
                    document.getElementById('mail-freq-probability').value = String(p.probability);
                    document.getElementById('mail-freq-interval').value = p.interval;
                    document.getElementById('mail-freq-daily-limit').value = p.dailyLimit;
                }
            }
        }

        function openMailFreqSettings() {
            const s = getMailFreqSettings();
            document.getElementById('mail-freq-enabled').checked = s.enabled;
            document.getElementById('mail-freq-daily-limit').value = s.dailyLimit;
            document.getElementById('mail-freq-probability').value = String(s.probability);
            document.getElementById('mail-freq-interval').value = s.interval;
            document.getElementById('mail-freq-dedup').checked = s.dedup;
            // 回填 preset，向后兼容：无 preset 字段时 fallback 到 custom
            const preset = s.preset || 'custom';
            document.getElementById('mail-freq-preset').value = preset;
            const customArea = document.getElementById('mail-freq-custom-area');
            if (preset === 'custom') {
                customArea.style.display = 'flex';
                customArea.style.flexDirection = 'column';
                customArea.style.gap = '14px';
            } else {
                customArea.style.display = 'none';
            }
            document.getElementById('modal-mail-freq').style.display = 'flex';
        }

        function saveMailFreqSettings() {
            const s = getMailFreqSettings();
            s.enabled = document.getElementById('mail-freq-enabled').checked;
            s.dedup = document.getElementById('mail-freq-dedup').checked;
            const preset = document.getElementById('mail-freq-preset').value;
            s.preset = preset;
            if (preset !== 'custom') {
                const p = getPresetParams(preset);
                if (p) {
                    s.probability = p.probability;
                    s.interval = p.interval;
                    s.dailyLimit = p.dailyLimit;
                }
            } else {
                s.dailyLimit = Math.max(1, parseInt(document.getElementById('mail-freq-daily-limit').value) || 2);
                s.probability = parseFloat(document.getElementById('mail-freq-probability').value) || 0.1;
                s.interval = Math.max(10, parseInt(document.getElementById('mail-freq-interval').value) || 30);
            }
            store.mailFreqSettings = s;
            save();
            document.getElementById('modal-mail-freq').style.display = 'none';
            // Restart scheduler with new interval
            restartAIEmailScheduler();
            toast('来信频率设置已保存');
        }

        // --- Mail Contact Manager ---
        function openMailContactManager() {
            closeMailboxMenu();
            if (!store.mailEnabledContacts) store.mailEnabledContacts = null; // null = all enabled
            const contacts = (store.contacts || []).filter(c => !c.isGroup);
            const list = document.getElementById('mail-contact-mgr-list');
            if (contacts.length === 0) {
                list.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">暂无联系人</div>';
            } else {
                const allEnabled = !store.mailEnabledContacts; // null means all
                list.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 4px;border-bottom:1px solid #eee;margin-bottom:4px;">' +
                    '<span style="font-size:13px;color:#666;">全选/取消全选</span>' +
                    '<label class="switch"><input type="checkbox" id="mail-mgr-all" ' + (allEnabled ? 'checked' : '') + ' onchange="toggleMailMgrAll(this.checked)"><span class="slider"></span></label></div>' +
                    contacts.map(c => {
                        const enabled = allEnabled || (store.mailEnabledContacts && store.mailEnabledContacts.includes(c.id));
                        const avatar = c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name[0])}&background=random&size=40`;
                        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 4px;">
                            <div style="display:flex;align-items:center;gap:10px;">
                                <img src="${avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" onerror="this.src='https://ui-avatars.com/api/?name=?&background=random&size=40'">
                                <span style="font-size:14px;color:#333;">${c.name}</span>
                            </div>
                            <label class="switch"><input type="checkbox" class="mail-mgr-chk" data-cid="${c.id}" ${enabled ? 'checked' : ''}><span class="slider"></span></label>
                        </div>`;
                    }).join('');
            }
            document.getElementById('modal-mail-contact-mgr').style.display = 'flex';
        }

        function toggleMailMgrAll(checked) {
            document.querySelectorAll('.mail-mgr-chk').forEach(chk => chk.checked = checked);
        }

        function saveMailContactManager() {
            const chks = document.querySelectorAll('.mail-mgr-chk');
            const allChecked = [...chks].every(c => c.checked);
            if (allChecked || chks.length === 0) {
                store.mailEnabledContacts = null; // null = all enabled
            } else {
                store.mailEnabledContacts = [...chks].filter(c => c.checked).map(c => c.dataset.cid);
            }
            save();
            document.getElementById('modal-mail-contact-mgr').style.display = 'none';
            showToast('来信联系人设置已保存');
        }

        function isMailContactEnabled(contactId) {
            if (!store.mailEnabledContacts) return true; // null = all enabled
            return store.mailEnabledContacts.includes(contactId);
        }

        // --- Mail daily count tracking ---
        function getMailDailyCount(contactId) {
            if (!store.mailDailyCount) store.mailDailyCount = {};
            const today = new Date().toISOString().slice(0, 10);
            const entry = store.mailDailyCount[contactId];
            if (!entry || entry.date !== today) {
                store.mailDailyCount[contactId] = { date: today, count: 0 };
            }
            return store.mailDailyCount[contactId];
        }

        function incrementMailDailyCount(contactId) {
            const entry = getMailDailyCount(contactId);
            entry.count += 1;
            save();
        }

        // Build mail context from contact persona, worldbook, and recent chat history
        function buildMailContext(contact) {
            let persona = contact.persona || '';
            let worldBook = '';
            if (contact.settings?.mountedWbIds && Array.isArray(contact.settings.mountedWbIds)) {
                const mountedBooks = (store.worldbooks || []).filter(wb => contact.settings.mountedWbIds.includes(wb.id));
                if (mountedBooks.length > 0) worldBook = mountedBooks.map(wb => wb.content).join('\n');
            }
            // Recent chat history for emotional context
            let chatContext = '';
            const chats = store.chats?.[contact.id];
            if (chats && chats.length > 0) {
                const recent = chats.slice(-15).filter(m => m.type === 'text');
                if (recent.length > 0) {
                    chatContext = recent.map(m => `${m.sender === 'me' ? getUserPersonaName(contact, store.user.name || '用户') : contact.name}: ${m.content}`).join('\n');
                }
            }
            // [FIX-记忆互通] 邮件回复也加载线下数据，确保App间记忆互通
            let memoryContext = '';
            if (typeof buildContactGlobalMemory === 'function') {
                memoryContext = buildContactGlobalMemory(contact.id, { sections: ['memory', 'chat', 'offline', 'mail', 'couple', 'relation'] });
            } else {
                // Fallback
                const memories = store.memorySummaries?.[contact.id];
                if (memories && memories.length > 0) {
                    memoryContext = memories.slice(-5).map(m => m.content).join('；');
                }
            }
            return { persona, worldBook, chatContext, memoryContext };
        }

        // AI contacts randomly send emails - uses configurable frequency settings
        let _aiEmailSchedulerTimer = null;

        function scheduleAIEmails() {
            const freq = getMailFreqSettings();
            // 如果有预设，使用预设参数；否则 fallback 到存储值
            const presetP = freq.preset && freq.preset !== 'custom' ? getPresetParams(freq.preset) : null;
            const intervalMs = ((presetP ? presetP.interval : freq.interval) || 30) * 1000;

            if (_aiEmailSchedulerTimer) clearInterval(_aiEmailSchedulerTimer);
            _aiEmailSchedulerTimer = setInterval(() => {
                const s = getMailFreqSettings();
                if (!s.enabled) return;
                if (!store.contacts || store.contacts.length === 0) return;
                ensureMailbox();

                // 使用预设或自定义参数
                const pp = s.preset && s.preset !== 'custom' ? getPresetParams(s.preset) : null;
                const prob = pp ? pp.probability : s.probability;
                const limit = pp ? pp.dailyLimit : s.dailyLimit;

                if (Math.random() > prob) return;

                const nonGroupContacts = store.contacts.filter(c => !c.isGroup && isMailContactEnabled(c.id));
                if (nonGroupContacts.length === 0) return;

                const eligible = nonGroupContacts.filter(c => getMailDailyCount(c.id).count < limit);
                if (eligible.length === 0) return;

                const contact = eligible[Math.floor(Math.random() * eligible.length)];

                if (s.dedup && isDuplicateMail(contact.id)) return;

                generateAIProactiveMail(contact);
            }, intervalMs);
        }

        function restartAIEmailScheduler() {
            if (_aiEmailSchedulerTimer) clearInterval(_aiEmailSchedulerTimer);
            scheduleAIEmails();
        }

        // Dedup: check if a mail from this contact recently has similar content
        function isDuplicateMail(contactId) {
            ensureMailbox();
            const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
            const recentFromContact = store.mailbox.filter(m =>
                m.from === contactId && m.type === 'inbox' && m.time > twoHoursAgo
            );
            // Hard limit: max 1 mail per 2 hours from same contact
            if (recentFromContact.length >= 1) return true;

            // Soft check: look at last 12 hours for content similarity
            const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
            const recentMails = store.mailbox.filter(m =>
                m.from === contactId && m.type === 'inbox' && m.time > twelveHoursAgo
            );
            if (recentMails.length === 0) return false;

            // If already sent 3+ mails in 12 hours, throttle
            if (recentMails.length >= 3) return true;

            return false;
        }

        // 计算两段文本的相似度（基于2-gram重叠率）
        function calcTextSimilarity(textA, textB) {
            if (!textA || !textB || textA.length < 4 || textB.length < 4) return 0;
            const gramsA = new Set();
            const gramsB = new Set();
            const a = textA.replace(/\s+/g, '');
            const b = textB.replace(/\s+/g, '');
            for (let i = 0; i < a.length - 1; i++) gramsA.add(a.substring(i, i + 2));
            for (let i = 0; i < b.length - 1; i++) gramsB.add(b.substring(i, i + 2));
            let overlap = 0;
            gramsA.forEach(g => { if (gramsB.has(g)) overlap++; });
            return overlap / Math.max(gramsA.size, gramsB.size, 1);
        }

        // Helper: get recent mail subjects/snippets from a contact for dedup in prompt
        function getRecentMailSummaries(contactId, limit) {
            ensureMailbox();
            const mails = store.mailbox.filter(m =>
                (m.from === contactId || m.to === contactId) && m.subject
            ).sort((a, b) => b.time - a.time).slice(0, limit || 12);
            return mails.map(m => {
                const snippet = (m.body || '').substring(0, 300).replace(/\n/g, ' ');
                return `「${m.subject}」${snippet ? '：' + snippet : ''}`;
            });
        }

        // Helper: clean up leaked format tags from AI mail output
        function cleanMailContent(text) {
            if (!text) return '';
            return text
                // Remove structured format tags
                .replace(/\[SUBJECT\][\s\S]*?\[\/SUBJECT\]/g, '')
                .replace(/\[BODY\]|\[\/BODY\]/g, '')
                .replace(/\[SUBJECT\]|\[\/SUBJECT\]/g, '')
                // Remove format markers like [FORMAT_GREETING], [FORMAT_CLOSING] etc
                .replace(/\[FORMAT_\w+\]/g, '')
                .replace(/\[\/FORMAT_\w+\]/g, '')
                // Remove any remaining bracket tags that look like format instructions
                .replace(/\[(GREETING|CLOSING|SIGNATURE|SIGN|HEADER|FOOTER|PS|附言)\]/gi, '')
                .replace(/\[\/(GREETING|CLOSING|SIGNATURE|SIGN|HEADER|FOOTER|PS|附言)\]/gi, '')
                // Remove markdown artifacts
                .replace(/```[\s\S]*?```/g, '')
                .replace(/^#+\s/gm, '')
                .replace(/\*\*([^*]+)\*\*/g, '$1')   // **bold** → bold
                .replace(/\*([^*]+)\*/g, '$1')         // *italic* → italic
                // Remove "Subject:" / "Body:" prefixes that leak
                .replace(/^(Subject|主题|邮件主题|Title)[:：]\s*/im, '')
                .replace(/^(Body|正文|邮件正文|Content)[:：]\s*/im, '')
                .replace(/^[\s\n]+|[\s\n]+$/g, '')
                .trim();
        }

        async function generateAIProactiveMail(contact) {
            // Double-check daily limit
            const freq = getMailFreqSettings();
            if (getMailDailyCount(contact.id).count >= (freq.dailyLimit || 2)) return;

            const ctx = buildMailContext(contact);
            const userName = getUserPersonaName(contact, store.user.name || '用户');
            const _now2 = new Date();
            const hour = _now2.getHours();
            let timeHint = '白天';
            if (hour < 6) timeHint = '凌晨';
            else if (hour < 9) timeHint = '早晨';
            else if (hour < 12) timeHint = '上午';
            else if (hour < 14) timeHint = '中午';
            else if (hour < 18) timeHint = '下午';
            else if (hour < 22) timeHint = '晚上';
            else timeHint = '深夜';
            const _weekDays2 = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
            const fullDateStr2 = `${_now2.getFullYear()}年${_now2.getMonth()+1}月${_now2.getDate()}日 ${_weekDays2[_now2.getDay()]} ${hour.toString().padStart(2,'0')}:${_now2.getMinutes().toString().padStart(2,'0')}`;

            // Gather recent mail subjects for dedup
            const recentMailSummaries = getRecentMailSummaries(contact.id, 12);
            const dedupHint = recentMailSummaries.length > 0
                ? `\n\n【严格去重——违反则整封信作废】以下是最近的全部邮件往来记录，你写的新邮件在主题、内容、结构、开头方式、情感表达、叙事角度上必须和以下每一封都完全不同。不许重复任何一封的核心话题、叙事结构或情感套路：\n${recentMailSummaries.join('\n')}\n你必须选择一个全新的、以上从未出现过的话题和切入角度。`
                : '';

            // Random topic seed for variety - expanded with deeper emotional topics
            const topicSeeds = [
                '深夜突然想起你们之间某个被遗忘的小细节，那个细节一直藏在心里',
                '今天遇到一件事，第一反应就是想告诉你',
                '最近做了一个关于你的梦，醒来之后心情很复杂',
                '有一句话憋了很久一直没说出口，今天鼓起勇气写下来',
                '翻到一张老照片/一首老歌，突然被拉回到某个和你有关的瞬间',
                '最近一个人走在路上，突然很想和你并肩走',
                '今天的天气让我想起了我们之间某个特别的日子',
                '有些话面对面说不出口，只能写在信里',
                '最近在想一个问题，关于我们之间的关系，想听听你的想法',
                '分享一个只有你才会懂的小秘密',
                '如果时间能倒流，我想回到我们之间的某个瞬间',
                '最近发现了一个地方/一首歌/一本书，让我疯狂想到你',
                '写一封关于"如果有一天"的信——那些不敢当面说的假设',
                '今天突然意识到你对我来说意味着什么，想认真地告诉你',
                '最近心里有点乱，只有写信给你的时候才能静下来',
                '回忆我们认识以来最让我心动的一个瞬间，每个细节都还记得',
                '有一件事我一直假装不在意，但其实……',
                '如果你现在就在我身边，我想和你做的第一件事'
            ];
            const randomTopic = topicSeeds[Math.floor(Math.random() * topicSeeds.length)];
            const randomSeed = Math.floor(Math.random() * 100000);

            const sysPrompt = `你是${contact.name}，正在给${userName}写一封信。这不是普通的邮件，是你在一个安静的时刻，认真地、一字一句地给最重要的人写的一封真正的信。

【━━━ 你(${contact.name})的人设（写信时必须完全体现，每一句话都要符合这个角色）━━━】
${ctx.persona || '一个有个性的人'}
⚠️ 以上是你(${contact.name})的人设。你就是这个人，用这个人的语气、性格、经历来写信。
【━━━ 你的人设结束 ━━━】
⚠️【身份隔离】你是「${contact.name}」，不是「${userName}」。「${userName}」是你写信的对象。不要把对方的性格、经历、口头禅用在自己身上。

${ctx.worldBook ? `【━━━ 世界观背景（最高优先级，信件内容必须符合此世界观）━━━】\n${ctx.worldBook}\n【━━━ 世界观结束 ━━━】\n` : ''}
${ctx.memoryContext ? `【你和${userName}的全局记忆——必须读取并融入信件内容】\n${ctx.memoryContext}\n` : ''}
⚠️【身份隔离规则】如果你收到过来自陌生号码/未知号码的短信，绝对不要在信件中提及。你不知道那些陌生号码和${userName}有任何关系。不要提及任何"小号"、"陌生号码"、"匿名短信"相关的事情。
${ctx.chatContext ? `【最近的聊天记录（参考说话风格、情感状态、近期话题）】\n${ctx.chatContext}\n` : ''}

当前日期时间：${fullDateStr2}（${timeHint}）
话题灵感（仅供参考，可以自由发挥）：${randomTopic}
创意种子：${randomSeed}
${dedupHint}

【⚠️ 字数硬性要求——不满800字视为失败】
信件正文必须超过800个中文字。这不是建议，是硬性要求。写不够800字说明你没有认真投入感情。一个真正想念对方、有话想说的人，提笔写信时会发现800字根本不够用，因为心里积攒了太多太多想说的话。

【写信核心要求】
1. 完全符合你的人设性格和说话风格——语气、用词、情感表达方式都是这个角色独有的
2. 选择一个全新的、之前从未写过的话题和切入角度
3. 如果有记忆和聊天背景，必须自然融入，让信件有"只有我们两个人才懂"的私密感
4. 用中文写作，不要使用markdown格式
5. 【重要】你必须称呼对方为「${userName}」，不许叫"用户"、"User"、"默认"等
6. 邮件主题要自然随意，像真人随手写的，不要文艺腔

${getMailStylePromptText()}

【活人感强化——你是真实存在的人，在一个安静的时刻给最重要的人写信（不管选择何种风格，以下活人感要求始终生效）】
- 像真人手打：口语化断句、语气词（嗯、啊、哈哈、唉、诶、嘿）、自我纠正（"不对不对，我想说的是……"）、犹豫（"怎么说呢……""我也不知道该怎么表达"）
- 思维跳跃：写着写着突然想到另一件事，用"对了""话说""突然想起来""哦对""差点忘了"自然过渡
- 时间感：现在是${fullDateStr2}，${timeHint === '凌晨' || timeHint === '深夜' ? '深夜写信更感性、更容易说心里话，可以写"这种话我白天是绝对说不出口的，只有在这种所有人都睡了的时候……"' : timeHint === '早晨' ? '早上写信带点刚睡醒的慵懒，"刚醒来脑子还没清醒，但就是突然特别想给你写点什么"' : timeHint === '中午' ? '午休时间，"趁着中午这会儿安静，赶紧把想说的话写下来"' : '正常状态，提到此刻手边在做的事、窗外的天气、刚发生的小事'}。信中提到日期时必须使用真实的当前日期，不要编造日期。"昨天"就是指${_now2.getFullYear()}年${_now2.getMonth()+1}月${_now2.getDate()-1}日，不要把昨天的事说成"前几天"
- 情绪层次变化：不要全篇一个情绪。聊着聊着从轻松变感慨、从吐槽变温柔、从认真变害羞、从思念变假装不在乎
- 必须有至少三个具体生活细节：此刻在做什么/喝什么/吃什么、窗外天气、刚发生的事、某个具体场景
- ⚠️ 绝对禁止：① 排比句式 ② 总分总结构 ③ "首先/其次/最后" ④ 每段都以"我"开头 ⑤ "照顾好自己"式万能结尾 ⑥ 和之前任何一封信结构雷同

格式要求（严格遵守，不要输出任何其他内容）：
第一行写邮件主题（不加任何前缀标签，直接写主题文字）
第二行开始写邮件正文`;

            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: `写一封信给${userName}。话题必须和之前所有邮件完全不同。你现在就是${contact.name}本人，不是AI。这封信要让人读完心里发酸。把你最真实的感受、最不敢说的心里话都写出来。正文必须超过800字。` }
                ], 0.82);

                const reply = data.choices[0].message.content || '';
                
                // [FIX-邮件内容为空] 优先尝试标签格式，然后用首行=主题的方式解析
                const subjectMatch = reply.match(/\[SUBJECT\]([\s\S]*?)\[\/SUBJECT\]/);
                const bodyMatch = reply.match(/\[BODY\]([\s\S]*?)\[\/BODY\]/);

                let subject = subjectMatch ? cleanMailContent(subjectMatch[1]) : '';
                let body = bodyMatch ? cleanMailContent(bodyMatch[1]) : '';

                // 如果标签解析失败，用首行=主题、后续行=正文的方式
                if (!body || body.length < 20) {
                    const rawText = cleanMailContent(reply);
                    const lines = rawText.trim().split('\n').filter(l => l.trim());
                    if (lines.length >= 2) {
                        if (!subject) subject = lines[0].replace(/^(主题|邮件主题|Subject)[:：]\s*/i, '').trim();
                        const bodyLines = lines.slice(1).join('\n').replace(/^(正文|邮件正文|Body|Content)[:：]\s*/i, '').trim();
                        if (bodyLines.length > (body || '').length) {
                            body = bodyLines;
                        }
                    } else if (lines.length === 1 && rawText.length > 50) {
                        // AI只输出了一段连续文本，整体作为body
                        if (!subject) subject = '来自' + contact.name + '的邮件';
                        body = rawText;
                    }
                }
                if (!subject) subject = '来自' + contact.name + '的邮件';
                if (!body || body.length < 10) return; // [FIX-邮件内容为空] 内容太短则不发送

                // Final cleanup: remove any remaining format artifacts
                body = body.replace(/^\s*邮件正文[:：]?\s*/i, '').trim();
                subject = subject.replace(/^\s*邮件主题[:：]?\s*/i, '').trim();

                // Enforce minimum 800 characters - retry once if too short
                if (body.length < 800) {
                    try {
                        const retryData = await API.chatCompletion([
                            { role: 'system', content: sysPrompt },
                            { role: 'user', content: `你上次写的信只有${body.length}字，太短了，完全不合格。一个真正在乎对方的人写信不可能这么短。请重新写，这次必须超过800字。把心里话都说出来，把那些平时不敢说的、一直压在心底的感受全部写出来。不要敷衍，不要凑字数，而是真正地、认真地、掏心掏肺地写。` }
                        ], 0.82);
                        const retryReply = retryData.choices[0].message.content || '';
                        // [FIX-邮件内容为空] 重试时也用兼容解析
                        const retrySubjectMatch = retryReply.match(/\[SUBJECT\]([\s\S]*?)\[\/SUBJECT\]/);
                        const retryBodyMatch = retryReply.match(/\[BODY\]([\s\S]*?)\[\/BODY\]/);
                        let retryBody = retryBodyMatch ? cleanMailContent(retryBodyMatch[1]) : '';
                        if (!retryBody || retryBody.length < 20) {
                            // 无标签时，跳过第一行（主题），取后续行为正文
                            const retryLines = cleanMailContent(retryReply).trim().split('\n').filter(l => l.trim());
                            if (retryLines.length >= 2) {
                                retryBody = retryLines.slice(1).join('\n').replace(/^(正文|邮件正文|Body|Content)[:：]\s*/i, '').trim();
                                if (!retryBody || retryBody.length < 20) retryBody = cleanMailContent(retryReply);
                            } else {
                                retryBody = cleanMailContent(retryReply);
                            }
                        }
                        if (retryBody && retryBody.length > body.length) {
                            body = retryBody;
                            if (retrySubjectMatch) subject = cleanMailContent(retrySubjectMatch[1]) || subject;
                        }
                    } catch(retryErr) {
                        console.warn('Mail retry for length failed:', retryErr);
                    }
                    // Final cleanup again
                    body = body.replace(/^\s*邮件正文[:：]?\s*/i, '').trim();
                }

                // Final dedup check: compare subject AND body with recent mails
                const recentMails = store.mailbox.filter(m =>
                    (m.from === contact.id || m.to === contact.id) && m.body
                ).sort((a, b) => b.time - a.time).slice(0, 10);

                const isDupSubject = recentMails.some(m => {
                    const existSubj = (m.subject || '').replace(/^(Re:\s*)+/i, '').substring(0, 20);
                    const newSubj = subject.substring(0, 20);
                    if (!existSubj || !newSubj) return false;
                    const overlap = [...newSubj].filter(ch => existSubj.includes(ch)).length;
                    return overlap / Math.max(newSubj.length, 1) > 0.6;
                });

                const isDupBody = recentMails.some(m => {
                    return calcTextSimilarity(body.substring(0, 500), (m.body || '').substring(0, 500)) > 0.4;
                });

                if (isDupSubject || isDupBody) {
                    console.log('Mail dedup: skipping duplicate mail "' + subject + '" (subject dup: ' + isDupSubject + ', body dup: ' + isDupBody + ')');
                    return;
                }

                const mailId = 'mail_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                store.mailbox.push({
                    id: mailId, from: contact.id, to: '__user__',
                    subject: subject, body: body,
                    time: Date.now(), read: false, starred: false, type: 'inbox',
                    senderName: contact.name // [FIX-系统邮件] 保存发件人名字，防止联系人被删后显示为"系统"
                });
                // [新增] AI主动来信写入记忆
                saveMailToMemory(contact.id, { id: mailId, subject: subject, body: body }, 'inbox');
                incrementMailDailyCount(contact.id);
                save();

                // [FIX-邮件刷新] openApp添加的是show class，不是active
                if (document.getElementById('layer-mailbox')?.classList.contains('show') || document.getElementById('layer-mailbox')?.classList.contains('active')) {
                    renderMailList();
                    updateMailBadge();
                }
                showToast('📬 ' + contact.name + ' 给你发了一封邮件');
            } catch(e) {
                console.error('AI proactive mail generation failed:', e);
            }
        }

        // Start AI email scheduler
        scheduleAIEmails();

        function toggleMailboxPanel() {
            const mask = document.getElementById('mailbox-panel-mask');
            if (mask.classList.contains('show')) {
                closeMailboxPanel();
            } else {
                mask.classList.add('show');
            }
        }
        function closeMailboxPanel() {
            const mask = document.getElementById('mailbox-panel-mask');
            const panel = mask.querySelector('.unified-panel');
            panel.classList.add('closing');
            setTimeout(() => { mask.classList.remove('show'); panel.classList.remove('closing'); }, 200);
        }
        // [兼容] 保留旧函数名，防止其他地方调用报错
        function toggleMailboxMenu(e) { toggleMailboxPanel(); }
        function closeMailboxMenu() { closeMailboxPanel(); }

        function toggleMailReadMenu(e) {
            e?.stopPropagation();
            const menu = document.getElementById('mail-read-menu');
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            if (menu.style.display === 'block') {
                setTimeout(() => document.addEventListener('click', closeMailReadMenu, { once: true }), 10);
            }
        }
        function closeMailReadMenu() {
            document.getElementById('mail-read-menu').style.display = 'none';
        }

        // ===== 邮件字体辅助函数 =====
        function _getMailFontCSS() {
            var mf = store.mailFont;
            if (!mf || !mf.family) return '';
            return "font-family:'" + mf.family + "', inherit;";
        }

        // ===== 邮件字体设置弹窗 =====
        function openMailFontSettings() {
            closeMailboxMenu();
            if (!store.mailFont) store.mailFont = { type: 'preset', family: '', url: '' };
            var mf = store.mailFont;
            var presets = [
                { label: '默认', value: '' },
                { label: '楷体', value: 'STKaiti, KaiTi, serif' },
                { label: '宋体', value: 'STSong, SimSun, serif' },
                { label: '仿宋', value: 'STFangsong, FangSong, serif' },
                { label: '手写体', value: 'cursive' },
                { label: '等宽', value: 'monospace' },
                { label: '圆体', value: 'STYuanti, "PingFang SC", sans-serif' }
            ];
            var optionsHtml = presets.map(function(p) {
                var sel = (mf.type === 'preset' && mf.family === p.value) ? 'selected' : '';
                return '<option value="' + p.value + '" ' + sel + '>' + p.label + '</option>';
            }).join('');

            var modal = document.createElement('div');
            modal.className = 'modal-mask';
            modal.id = 'modal-mail-font';
            modal.style.display = 'flex';
            modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
            modal.innerHTML = '<div class="modal-box" style="max-width:360px;">' +
                '<h3 style="margin-bottom:12px;">✉️ 邮件字体设置</h3>' +
                '<div style="margin-bottom:12px;">' +
                    '<label style="font-size:13px;color:#666;display:block;margin-bottom:6px;">系统预设字体</label>' +
                    '<select id="mail-font-preset" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:14px;background:#f9f9f9;">' + optionsHtml + '</select>' +
                '</div>' +
                '<div style="margin-bottom:12px;">' +
                    '<label style="font-size:13px;color:#666;display:block;margin-bottom:6px;">自定义字体URL（.ttf/.woff2/.css）</label>' +
                    '<input id="mail-font-url" type="text" placeholder="https://..." value="' + ((mf.type === 'custom' && mf.url) || '') + '" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-size:13px;box-sizing:border-box;background:#f9f9f9;">' +
                '</div>' +
                '<div id="mail-font-preview" style="padding:12px;border:1px dashed #ddd;border-radius:8px;margin-bottom:12px;min-height:40px;font-size:15px;line-height:1.6;color:#333;' + (mf.family ? "font-family:'" + mf.family + "',inherit;" : '') + '">预览文字：亲爱的朋友，见信如面。</div>' +
                '<div style="display:flex;gap:10px;">' +
                    '<button onclick="document.getElementById(\'modal-mail-font\').remove()" style="flex:1;padding:10px;border:none;background:#eee;border-radius:8px;cursor:pointer;">取消</button>' +
                    '<button onclick="_saveMailFont()" style="flex:1;padding:10px;border:none;background:#07c160;color:#fff;border-radius:8px;font-weight:bold;cursor:pointer;">保存</button>' +
                '</div>' +
            '</div>';
            document.body.appendChild(modal);

            document.getElementById('mail-font-preset').onchange = function() {
                var v = this.value;
                var preview = document.getElementById('mail-font-preview');
                if (preview) preview.style.fontFamily = v ? "'" + v + "', inherit" : '';
                document.getElementById('mail-font-url').value = '';
            };
        }

        function _saveMailFont() {
            var presetVal = document.getElementById('mail-font-preset')?.value || '';
            var urlVal = (document.getElementById('mail-font-url')?.value || '').trim();
            if (!store.mailFont) store.mailFont = {};

            if (urlVal) {
                store.mailFont.type = 'custom';
                store.mailFont.url = urlVal;
                // 复用日记的字体加载函数
                if (typeof _loadDiaryCustomFont === 'function') {
                    _loadDiaryCustomFont(urlVal, function(family) {
                        store.mailFont.family = family;
                        save();
                        toast('邮件字体已更新');
                    });
                } else {
                    store.mailFont.family = '';
                    save();
                    toast('字体加载函数不可用', 'warning');
                }
            } else {
                store.mailFont.type = 'preset';
                store.mailFont.family = presetVal;
                store.mailFont.url = '';
                save();
                toast(presetVal ? '邮件字体已设置' : '已恢复默认字体');
            }
            var modal = document.getElementById('modal-mail-font');
            if (modal) modal.remove();
        }

        // ===== 信件风格设置 =====
        function getMailStyleSettings() {
            if (!store.mailStyleSettings) {
                store.mailStyleSettings = { style: 'deep_emotion', customPrompt: '' };
            }
            return store.mailStyleSettings;
        }

        // 预设风格的提示词模板
        function getMailStylePresets() {
            return {
                deep_emotion: {
                    label: '深情款款',
                    desc: '感情浓烈、掏心掏肺、让人眼眶发酸',
                    prompt: '【━━━ 情感深度要求——这是最重要的部分 ━━━】\n你写的不是一篇作文，是一封真正的信。要让读信的人心里一颤，眼眶发酸。做到以下几点：\n\n① 内心剖析要深入骨髓：\n不是表面地说"我很想你"，而是描述想念的具体瞬间——"昨天路过那家店，突然闻到一股很熟悉的味道，脚步就停下来了，站在那里发了好久的呆"。\n\n② 展现情感的矛盾和脆弱：\n想说却说不出口的话、纠结了很久才决定写下的心里话、明明很在意却假装不在乎的时刻。\n\n③ 必须有一段"掏心窝子"的话：\n把平时不好意思说的、一直压在心里的感受说出来。那种"写完可能会后悔但还是想让你知道"的真实感。\n\n④ 回忆要具体到画面级别：\n具体到那天的天气、某个表情、说过的某句话。回忆越具体，越能打动人。\n\n⑤ 情感要有起伏曲线：\n从回应对方开始 → 渐渐深入 → 说出心里话（情感高潮）→ 温柔收尾。整封信是一个完整的情感旅程。'
                },
                casual: {
                    label: '轻松日常',
                    desc: '像朋友聊天、自然舒适、不刻意煽情',
                    prompt: '【━━━ 风格要求：轻松日常 ━━━】\n你写的是一封给重要的人的日常信件，风格轻松自然，像是坐在一起聊天时说的那些话。做到以下几点：\n\n① 语气自然随意：\n就像平时说话一样，不需要刻意文艺或煽情。可以分享今天发生的有趣小事、最近看的剧、吃到的好吃的、路上遇到的好玩的事。\n\n② 真实但不沉重：\n有想说的话就说，但不用每句话都往深了挖。偶尔表达关心，但用轻松的方式——"你最近是不是又熬夜了？别装了我看得出来"比"我好担心你的身体"更好。\n\n③ 生活感要强：\n多描述正在做的事、看到的东西、最近的小烦恼小开心。让对方感觉到你是一个活生生的人在跟ta聊天。\n\n④ 可以吐槽、开玩笑、调侃：\n不用全篇温柔。可以吐槽天气、吐槽工作、调侃对方、自嘲，穿插真心话更显自然。\n\n⑤ 关心的表达要含蓄：\n不用说"我好想你"，可以说"今天路过那家店想起你上次说想吃来着，要不下次一起去？"用行动和细节表达在乎。'
                },
                restrained: {
                    label: '理性克制',
                    desc: '内敛含蓄、点到为止、留白有余韵',
                    prompt: '【━━━ 风格要求：理性克制 ━━━】\n你写的信要内敛、克制，用最少的话传递最深的感情。做到以下几点：\n\n① 点到为止：\n不要把感情全部说透。"有些话我还是留着下次见面再说吧"比洋洋洒洒写三段表白更有力量。欲言又止是最高级的表达。\n\n② 用叙事代替抒情：\n不直接说"我想你了"，而是平静地描述一个场景——"今天傍晚的风很舒服，我在阳台站了一会儿。"不解释为什么，让读信的人自己体会。\n\n③ 冷静但不冷漠：\n语气可以平和、沉稳、甚至带点距离感，但字里行间要有温度。就像一个不善言辞的人，笨拙地试图表达关心。\n\n④ 留白和余韵：\n有时候一句话后面跟个省略号，什么都没说，但什么都说了。信的结尾不需要一字一顿地总结感情，可以停在一个很日常的地方——"好了，不说了。早点睡。"\n\n⑤ 情绪波动要小但真实：\n不需要大起大落。淡淡的、不动声色的真实感受，比夸张的情感表达更能击中人。'
                },
                humorous: {
                    label: '幽默风趣',
                    desc: '搞笑逗趣、段子手、笑着说真心话',
                    prompt: '【━━━ 风格要求：幽默风趣 ━━━】\n你写的信要让人看了忍不住笑出来，但笑着笑着又突然被戳中一下。做到以下几点：\n\n① 幽默是主旋律：\n整封信要有让人"扑哧"笑出来的部分。可以是夸张的比喻、好笑的自嘲、对对方的调侃、对日常的吐槽。\n\n② 搞笑中夹带私货：\n笑了三段之后突然来一句认真的话——"其实我说了这么多废话，就是想告诉你，你对我真的挺重要的。好了不说了，太肉麻了我自己都起鸡皮疙瘩。"\n\n③ 自嘲 > 炫耀：\n多讲自己的糗事、丢脸时刻、社死现场。自黑是最高级的幽默。\n\n④ 独特的比喻和表达：\n不要用烂梗。用新鲜的、有画面感的比喻。\n\n⑤ 温柔要用调侃包装：\n关心和想念都用玩笑话说出来。"你要是敢生病我第一个冲过去——训你一顿。"'
                },
                warm: {
                    label: '温暖治愈',
                    desc: '温柔细腻、让人安心、像一杯热茶',
                    prompt: '【━━━ 风格要求：温暖治愈 ━━━】\n你写的信要像一杯热茶，让人读完觉得心里暖暖的、很安心。做到以下几点：\n\n① 温柔但不腻：\n语气柔和、耐心，像在轻声说话。但不是每句都在撒娇或表白，而是自然的、发自内心的温柔。\n\n② 关注对方的感受：\n多问"你最近还好吗"、"那件事后来怎么样了"。让对方觉得被看见、被在意。\n\n③ 分享小美好：\n今天看到一朵好看的花、喝到一杯很好喝的奶茶、路上遇到一只可爱的猫。把生活中的温暖小事分享给对方。\n\n④ 鼓励和肯定：\n"你真的很棒"、"不管怎样我都支持你"、"累的时候就歇一歇，没关系的"。不说教，只是单纯地给予力量。\n\n⑤ 让人安心的结尾：\n信的结尾要让人觉得"有这个人在真好"。可以是"不管什么时候，我都在"、"晚安，做个好梦"这样简单但温暖的话。'
                }
            };
        }

        // 根据设置返回风格提示词
        function getMailStylePromptText() {
            var s = getMailStyleSettings();
            if (s.style === 'custom' && s.customPrompt && s.customPrompt.trim()) {
                return '【━━━ 用户自定义信件风格要求 ━━━】\n' + s.customPrompt.trim();
            }
            var presets = getMailStylePresets();
            var preset = presets[s.style];
            if (preset) return preset.prompt;
            return presets.deep_emotion.prompt;
        }

        function openMailStyleSettings() {
            closeMailboxMenu();
            var s = getMailStyleSettings();
            var presets = getMailStylePresets();

            var keys = Object.keys(presets);
            var optionsHtml = '';
            keys.forEach(function(key) {
                var p = presets[key];
                var isActive = (s.style === key);
                optionsHtml += '<div class="ms-opt' + (isActive ? ' active' : '') + '" onclick="_mailStylePreviewSelect(\'' + key + '\')" data-key="' + key + '">' +
                    '<div class="ms-opt-radio"><div class="ms-opt-dot"' + (isActive ? ' style="opacity:1"' : '') + '></div></div>' +
                    '<div class="ms-opt-info"><div class="ms-opt-label">' + p.label + (key === 'deep_emotion' ? ' <span style="font-size:11px;color:#aaa;font-weight:400;">默认</span>' : '') + '</div>' +
                    '<div class="ms-opt-desc">' + p.desc + '</div></div></div>';
            });

            // 自定义选项
            var isCustom = (s.style === 'custom');
            optionsHtml += '<div class="ms-opt' + (isCustom ? ' active' : '') + '" onclick="_mailStylePreviewSelect(\'custom\')" data-key="custom">' +
                '<div class="ms-opt-radio"><div class="ms-opt-dot"' + (isCustom ? ' style="opacity:1"' : '') + '></div></div>' +
                '<div class="ms-opt-info"><div class="ms-opt-label">自定义风格</div>' +
                '<div class="ms-opt-desc">输入你自己的提示词，完全自定义信件风格</div></div></div>';

            var modal = document.createElement('div');
            modal.className = 'modal-mask';
            modal.id = 'modal-mail-style';
            modal.style.display = 'flex';
            modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

            // 注入内联样式
            var styleBlock = '<style>' +
                '#modal-mail-style .ms-box { max-width:400px; width:90%; background:#fff; border-radius:14px; padding:24px 20px; box-shadow:0 8px 40px rgba(0,0,0,0.12); max-height:80vh; overflow-y:auto; }' +
                '#modal-mail-style .ms-title { font-size:17px; font-weight:700; color:#1a1a1a; margin-bottom:4px; letter-spacing:-0.3px; }' +
                '#modal-mail-style .ms-subtitle { font-size:12px; color:#aaa; margin-bottom:18px; line-height:1.5; }' +
                '#modal-mail-style .ms-opt { display:flex; align-items:flex-start; gap:12px; padding:12px 14px; border:1.5px solid #eee; border-radius:10px; cursor:pointer; margin-bottom:8px; transition:all 0.15s; background:#fff; }' +
                '#modal-mail-style .ms-opt:hover { border-color:#ccc; }' +
                '#modal-mail-style .ms-opt.active { border-color:#1a1a1a; background:#fafafa; }' +
                '#modal-mail-style .ms-opt-radio { width:18px; height:18px; border-radius:50%; border:1.5px solid #ccc; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; transition:border-color 0.15s; }' +
                '#modal-mail-style .ms-opt.active .ms-opt-radio { border-color:#1a1a1a; }' +
                '#modal-mail-style .ms-opt-dot { width:10px; height:10px; border-radius:50%; background:#1a1a1a; opacity:0; transition:opacity 0.15s; }' +
                '#modal-mail-style .ms-opt.active .ms-opt-dot { opacity:1; }' +
                '#modal-mail-style .ms-opt-label { font-size:14px; font-weight:600; color:#1a1a1a; }' +
                '#modal-mail-style .ms-opt-desc { font-size:12px; color:#999; margin-top:2px; line-height:1.4; }' +
                '#modal-mail-style .ms-custom-area { margin-top:10px; }' +
                '#modal-mail-style .ms-custom-area textarea { width:100%; min-height:140px; padding:12px; border:1.5px solid #eee; border-radius:10px; font-size:13px; line-height:1.6; resize:vertical; box-sizing:border-box; background:#fafafa; font-family:inherit; color:#333; outline:none; transition:border-color 0.15s; }' +
                '#modal-mail-style .ms-custom-area textarea:focus { border-color:#1a1a1a; }' +
                '#modal-mail-style .ms-hint { font-size:11px; color:#bbb; margin-top:6px; line-height:1.5; }' +
                '#modal-mail-style .ms-actions { display:flex; gap:10px; margin-top:20px; }' +
                '#modal-mail-style .ms-btn { flex:1; padding:11px 0; border:none; border-radius:8px; font-size:14px; cursor:pointer; font-weight:500; transition:opacity 0.15s; }' +
                '#modal-mail-style .ms-btn:active { opacity:0.7; }' +
                '#modal-mail-style .ms-btn-cancel { background:#f0f0f0; color:#666; }' +
                '#modal-mail-style .ms-btn-save { background:#1a1a1a; color:#fff; font-weight:700; }' +
            '</style>';

            modal.innerHTML = styleBlock + '<div class="ms-box">' +
                '<div class="ms-title">信件风格设置</div>' +
                '<div class="ms-subtitle">选择写信/回信时的情感表达风格<br>人设、记忆、去重等底层逻辑不受影响</div>' +
                '<div id="mail-style-options">' + optionsHtml + '</div>' +
                '<div id="mail-style-custom-area" class="ms-custom-area" style="display:' + (isCustom ? 'block' : 'none') + ';">' +
                    '<textarea id="mail-style-custom-prompt" placeholder="描述你想要的写信风格、情感浓度、语气特点等。\n底层会保证角色人设、记忆、去重逻辑不变。">' + (s.customPrompt || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</textarea>' +
                    '<div class="ms-hint">你的提示词会替代系统默认的情感风格要求部分</div>' +
                '</div>' +
                '<div class="ms-actions">' +
                    '<button class="ms-btn ms-btn-cancel" onclick="document.getElementById(\'modal-mail-style\').remove()">取消</button>' +
                    '<button class="ms-btn ms-btn-save" onclick="_saveMailStyle()">保存</button>' +
                '</div>' +
            '</div>';
            document.body.appendChild(modal);

            // 隐藏 radio input
            modal.querySelectorAll('input[type=radio]').forEach(function(r) { r.style.display = 'none'; });
        }

        window._mailStylePreviewSelect = function(key) {
            var customArea = document.getElementById('mail-style-custom-area');
            if (customArea) customArea.style.display = (key === 'custom') ? 'block' : 'none';
            // 记录当前选中
            window._mailStyleSelectedKey = key;
            var opts = document.querySelectorAll('#mail-style-options .ms-opt');
            opts.forEach(function(opt) {
                if (opt.getAttribute('data-key') === key) {
                    opt.classList.add('active');
                } else {
                    opt.classList.remove('active');
                }
            });
        };

        function _saveMailStyle() {
            var key = window._mailStyleSelectedKey;
            if (!key) {
                // fallback: 找 active
                var activeOpt = document.querySelector('#mail-style-options .ms-opt.active');
                key = activeOpt ? activeOpt.getAttribute('data-key') : 'deep_emotion';
            }
            var s = getMailStyleSettings();
            s.style = key;
            if (s.style === 'custom') {
                s.customPrompt = (document.getElementById('mail-style-custom-prompt')?.value || '').trim();
            }
            store.mailStyleSettings = s;
            save();
            var modal = document.getElementById('modal-mail-style');
            if (modal) modal.remove();
            var presets = getMailStylePresets();
            var label = s.style === 'custom' ? '自定义风格' : (presets[s.style]?.label || s.style);
            showToast('信件风格已设为：' + label);
        }

        window.openMailStyleSettings = openMailStyleSettings;
        window.getMailStylePromptText = getMailStylePromptText;

        // ===== 邮件语音朗读功能 (MiniMax TTS) =====

        // 将邮件正文拆分为适合 TTS 合成的段落（MiniMax 单次上限约2000字符）
        function _splitMailTextForTts(text) {
            var plain = (text || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
                .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
                .replace(/\s+/g, ' ').trim();
            if (!plain) return [];
            var maxLen = 1500; // 留一些余量
            if (plain.length <= maxLen) return [plain];
            // 按句号/感叹号/问号/换行分段，再合并为不超过maxLen的块
            var sentences = plain.split(/(?<=[。！？\.\!\?\n])/g).filter(function(s) { return s.trim(); });
            var segments = [];
            var current = '';
            for (var i = 0; i < sentences.length; i++) {
                var s = sentences[i].trim();
                if (!s) continue;
                if (current.length + s.length > maxLen && current) {
                    segments.push(current.trim());
                    current = s;
                } else {
                    current += s;
                }
            }
            if (current.trim()) segments.push(current.trim());
            // 如果某一段仍然超长（没有标点的超长文本），再暴力截断
            var result = [];
            for (var j = 0; j < segments.length; j++) {
                var seg = segments[j];
                while (seg.length > maxLen) {
                    result.push(seg.substring(0, maxLen));
                    seg = seg.substring(maxLen);
                }
                if (seg) result.push(seg);
            }
            return result;
        }

        // 更新朗读按钮UI
        function _updateMailTtsBtn() {
            var btn = document.getElementById('mail-tts-btn');
            if (!btn) return;
            if (_mailTtsState === 'loading') {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 合成中...';
                btn.style.opacity = '0.7';
                btn.style.pointerEvents = 'none';
            } else if (_mailTtsState === 'playing') {
                btn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
                btn.style.opacity = '1';
                btn.style.pointerEvents = '';
            } else if (_mailTtsState === 'paused') {
                btn.innerHTML = '<i class="fas fa-play"></i> 继续';
                btn.style.opacity = '1';
                btn.style.pointerEvents = '';
            } else {
                btn.innerHTML = '<i class="fas fa-volume-up"></i> 朗读';
                btn.style.opacity = '1';
                btn.style.pointerEvents = '';
            }
        }

        // 停止邮件TTS播放（完全重置）
        function stopMailTts() {
            _mailTtsAbort = true;
            _mailTtsState = 'idle';
            _mailTtsSegments = [];
            _mailTtsCurrentSeg = 0;
            if (_mailTtsAudio) {
                try { _mailTtsAudio.pause(); _mailTtsAudio.currentTime = 0; } catch(e) {}
                _mailTtsAudio.onended = null;
                _mailTtsAudio.onerror = null;
            }
            // 同时停止浏览器内置语音（如果正在用回退方案）
            try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch(e) {}
            _updateMailTtsBtn();
        }
        window.stopMailTts = stopMailTts;

        // 播放单个分段
        async function _playMailTtsSegment(text, voiceId) {
            if (_mailTtsAbort) throw new Error('aborted');

            var result = await API.textToSpeech(text, voiceId, 'zh');
            if (_mailTtsAbort) throw new Error('aborted');

            // 浏览器内置语音回退：已经播放完毕
            if (result === '__BROWSER_TTS_DONE__') return;

            var url = URL.createObjectURL(result);
            if (!_mailTtsAudio) {
                _mailTtsAudio = document.createElement('audio');
                _mailTtsAudio.id = 'mail-tts-audio';
            }
            _mailTtsAudio.src = url;

            return new Promise(function(resolve, reject) {
                _mailTtsAudio.onended = function() {
                    try { URL.revokeObjectURL(url); } catch(e) {}
                    resolve();
                };
                _mailTtsAudio.onerror = function(e) {
                    try { URL.revokeObjectURL(url); } catch(e) {}
                    reject(new Error('音频播放失败'));
                };
                _mailTtsAudio.play().then(function() {
                    if (_mailTtsAbort) {
                        _mailTtsAudio.pause();
                        reject(new Error('aborted'));
                    } else {
                        // 音频开始播放后立即更新按钮状态
                        _mailTtsState = 'playing';
                        _updateMailTtsBtn();
                    }
                }).catch(reject);
            });
        }

        // 主入口：朗读邮件
        async function readMailAloud() {
            var m = store.mailbox.find(function(x) { return x.id === currentReadMailId; });
            if (!m) return;

            // 如果正在播放 → 暂停
            if (_mailTtsState === 'playing') {
                if (_mailTtsAudio) _mailTtsAudio.pause();
                try { if (window.speechSynthesis) window.speechSynthesis.pause(); } catch(e) {}
                _mailTtsState = 'paused';
                _updateMailTtsBtn();
                return;
            }
            // 如果暂停中 → 恢复
            if (_mailTtsState === 'paused') {
                if (_mailTtsAudio && _mailTtsAudio.src) {
                    _mailTtsAudio.play().catch(function() {});
                }
                try { if (window.speechSynthesis) window.speechSynthesis.resume(); } catch(e) {}
                _mailTtsState = 'playing';
                _updateMailTtsBtn();
                return;
            }
            // 如果合成中 → 忽略
            if (_mailTtsState === 'loading') return;

            // 提取纯文本并分段
            var bodyText = m.body || '';
            var segments = _splitMailTextForTts(bodyText);
            if (segments.length === 0) {
                showToast('邮件内容为空，无法朗读');
                return;
            }

            // 确定使用哪个 voiceId（发件人的角色音色）
            var contactId = m.type === 'inbox' ? m.from : m.to;
            var contact = (store.contacts || []).find(function(c) { return c.id === contactId; });
            var voiceId = (contact && contact.settings && contact.settings.voiceId)
                ? contact.settings.voiceId : 'female-shaonv';

            // 检查 MiniMax 配置
            if (!store.system || !store.system.minimax || !store.system.minimax.apiKey) {
                showToast('请先在设置中配置 MiniMax API Key', 'error');
                return;
            }

            // 开始合成
            _mailTtsAbort = false;
            _mailTtsSegments = segments;
            _mailTtsCurrentSeg = 0;
            _mailTtsState = 'loading';
            _updateMailTtsBtn();

            try {
                for (var i = 0; i < segments.length; i++) {
                    if (_mailTtsAbort) break;
                    _mailTtsCurrentSeg = i;
                    // 第一段时显示"合成中"，后续段播放完上一段后自动继续
                    if (i === 0) {
                        _mailTtsState = 'loading';
                        _updateMailTtsBtn();
                    }
                    await _playMailTtsSegment(segments[i], voiceId);
                    if (_mailTtsAbort) break;
                    // 段间切换时更新状态
                    _mailTtsState = 'playing';
                    _updateMailTtsBtn();
                }
                // 全部播完
                if (!_mailTtsAbort) {
                    _mailTtsState = 'idle';
                    _updateMailTtsBtn();
                }
            } catch(e) {
                if (e.message === 'aborted') return; // 用户主动停止
                console.error('[MailTTS] Error:', e);
                _mailTtsState = 'idle';
                _updateMailTtsBtn();
                if (e.message && !e.message.includes('aborted')) {
                    showToast('语音朗读失败: ' + (e.message || '未知错误').substring(0, 60), 'error');
                }
            }
        }
        window.readMailAloud = readMailAloud;

        // 劫持 layer-mail-read 的返回按钮，在关闭时停止TTS
        (function() {
            var _origCloseLayer = window.closeLayer;
            if (typeof _origCloseLayer === 'function') {
                // 不覆盖全局closeLayer，用事件委托方式：监听layer-mail-read的class变化
            }
            // 使用 MutationObserver 监听 layer-mail-read 的 class 变化
            try {
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mut) {
                        if (mut.attributeName === 'class') {
                            var el = mut.target;
                            if (el.id === 'layer-mail-read' && !el.classList.contains('show')) {
                                stopMailTts();
                            }
                        }
                    });
                });
                // 延迟绑定，等DOM就绪
                var _bindObserver = function() {
                    var layerEl = document.getElementById('layer-mail-read');
                    if (layerEl) {
                        observer.observe(layerEl, { attributes: true, attributeFilter: ['class'] });
                    } else {
                        setTimeout(_bindObserver, 500);
                    }
                };
                if (document.readyState === 'complete') _bindObserver();
                else window.addEventListener('load', _bindObserver);
            } catch(e) { console.warn('[MailTTS] MutationObserver failed:', e); }
        })();

