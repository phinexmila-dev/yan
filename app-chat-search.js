
        // ========== 聊天记录搜索功能 ==========
        (function() {
            let _chatSearchDebounceTimer = null;
            let _chatSearchLocatedIdx = -1; // 当前定位到的消息索引

            // 打开搜索面板
            window.openChatSearch = function() {
                const panel = document.getElementById('chat-search-panel');
                if (!panel) return;
                panel.style.display = 'flex';
                panel.classList.add('show');
                // 隐藏聊天输入栏，防止在搜索面板下方显示
                const chatInputBar = document.getElementById('chat-input-bar');
                if (chatInputBar) chatInputBar.style.display = 'none';
                const extMenuPanel = document.getElementById('ext-menu-panel');
                if (extMenuPanel) extMenuPanel.style.display = 'none';
                const stickerPanel = document.getElementById('sticker-panel');
                if (stickerPanel) stickerPanel.style.display = 'none';
                // 清空之前的搜索状态
                const input = document.getElementById('chat-search-input');
                if (input) { input.value = ''; setTimeout(function(){ input.focus(); }, 100); }
                const dateFrom = document.getElementById('chat-search-date-from');
                const dateTo = document.getElementById('chat-search-date-to');
                if (dateFrom) dateFrom.value = '';
                if (dateTo) dateTo.value = '';
                const results = document.getElementById('chat-search-results');
                if (results) results.innerHTML = '<div class="chat-search-empty">输入关键字或选择日期范围来搜索聊天记录</div>';
                const clearBtn = document.getElementById('chat-search-clear-btn');
                if (clearBtn) clearBtn.style.display = 'none';
                _chatSearchLocatedIdx = -1;
            };

            // 关闭搜索面板
            window.closeChatSearch = function() {
                const panel = document.getElementById('chat-search-panel');
                if (panel) {
                    panel.style.display = 'none';
                    panel.classList.remove('show');
                }
                // 恢复聊天输入栏
                const chatInputBar = document.getElementById('chat-input-bar');
                if (chatInputBar) chatInputBar.style.display = '';
                // 如果之前定位了消息，返回最新消息位置
                if (_chatSearchLocatedIdx >= 0) {
                    _chatSearchLocatedIdx = -1;
                    scrollChatToBottom();
                    _removeBackLatestBtn();
                }
            };

            // 清空搜索输入
            window.clearChatSearchInput = function() {
                const input = document.getElementById('chat-search-input');
                if (input) { input.value = ''; input.focus(); }
                const clearBtn = document.getElementById('chat-search-clear-btn');
                if (clearBtn) clearBtn.style.display = 'none';
                doChatSearch();
            };

            // 清除日期筛选
            window.clearChatSearchDate = function() {
                const dateFrom = document.getElementById('chat-search-date-from');
                const dateTo = document.getElementById('chat-search-date-to');
                if (dateFrom) dateFrom.value = '';
                if (dateTo) dateTo.value = '';
                doChatSearch();
            };

            // 执行搜索（防抖）
            window.doChatSearch = function() {
                // 显示/隐藏清除按钮
                const input = document.getElementById('chat-search-input');
                const clearBtn = document.getElementById('chat-search-clear-btn');
                if (input && clearBtn) {
                    clearBtn.style.display = input.value.length > 0 ? 'block' : 'none';
                }

                if (_chatSearchDebounceTimer) clearTimeout(_chatSearchDebounceTimer);
                _chatSearchDebounceTimer = setTimeout(_executeChatSearch, 300);
            };

            function _executeChatSearch() {
                const keyword = (document.getElementById('chat-search-input')?.value || '').trim().toLowerCase();
                const dateFromStr = document.getElementById('chat-search-date-from')?.value || '';
                const dateToStr = document.getElementById('chat-search-date-to')?.value || '';
                const resultsContainer = document.getElementById('chat-search-results');
                if (!resultsContainer) return;

                // 没有搜索条件
                if (!keyword && !dateFromStr && !dateToStr) {
                    resultsContainer.innerHTML = '<div class="chat-search-empty">输入关键字或选择日期范围来搜索聊天记录</div>';
                    return;
                }

                const chatId = typeof activeChatId !== 'undefined' ? activeChatId : null;
                // [FIX-搜索线下] 合并 store.chats（含嵌入式线下 offline_text/go_offline_text）与 store.offlineChats（独立页面线下）
                const _onlineMsgs = (chatId && store.chats && store.chats[chatId]) ? store.chats[chatId] : [];
                const _offlinePageMsgs = (chatId && store.offlineChats && store.offlineChats[chatId]) ? store.offlineChats[chatId] : [];
                if (!chatId || (_onlineMsgs.length === 0 && _offlinePageMsgs.length === 0)) {
                    resultsContainer.innerHTML = '<div class="chat-search-empty">当前没有聊天记录</div>';
                    return;
                }

                // 给每条消息加 _src 标记，定位时据此决定跳转目标
                // _src='online' → store.chats[chatId]，_src='offline' → store.offlineChats[chatId]
                const _tagged = [];
                _onlineMsgs.forEach(function(m, i){ _tagged.push({ m: m, idx: i, src: 'online' }); });
                _offlinePageMsgs.forEach(function(m, i){ _tagged.push({ m: m, idx: i, src: 'offline' }); });
                const msgs = _tagged; // 本次搜索使用的统一集合（包含原索引与来源）
                const contact = store.contacts.find(c => c.id === chatId);
                const contactName = contact?.name || '对方';
                const contactAvatar = contact?.avatar || _ph(40);
                // [FIX-搜索头像] 使用绑定的人设头像和名字，而非微信账号数据
                const _searchPersonaId = contact?.settings?.userPersona;
                const _searchPersona = _searchPersonaId ? (store.personas || []).find(p => p.id === _searchPersonaId) : null;
                const userAvatar = (_searchPersona?.avatar) || store.user?.avatar || _ph(40);
                const userName = (_searchPersona?.name && !['默认', '用户', 'User', 'user', '默认用户'].includes(_searchPersona.name.trim())) ? _searchPersona.name : (store.user?.name || '我');

                // 解析日期范围
                let dateFrom = dateFromStr ? new Date(dateFromStr) : null;
                let dateTo = dateToStr ? new Date(dateToStr) : null;
                if (dateFrom) dateFrom.setHours(0, 0, 0, 0);
                if (dateTo) dateTo.setHours(23, 59, 59, 999);

                // 搜索匹配的消息
                const matchedResults = [];
                msgs.forEach((item) => {
                    const m = item.m;
                    const idx = item.idx;
                    const src = item.src;
                    // 跳过系统消息
                    if (m.type === 'poke' || m.type === 'block_event') return;

                    // 日期筛选
                    if (m.time) {
                        const msgDate = new Date(m.time);
                        if (dateFrom && msgDate < dateFrom) return;
                        if (dateTo && msgDate > dateTo) return;
                    } else if (dateFrom || dateTo) {
                        return; // 没有时间戳且设了日期范围，跳过
                    }

                    // 关键字搜索
                    let textContent = '';
                    if (m.type === 'text' || !m.type) {
                        textContent = m.content || '';
                    } else if (m.type === 'image' || m.type === 'img') {
                        textContent = m.fakeImgDesc ? '[图片] ' + m.fakeImgDesc : (m.stickerName ? '[表情]' : '[图片]');
                    } else if (m.type === 'voice' || m.type === 'audio') {
                        textContent = m.content || '[语音消息]';
                    } else if (m.type === 'video') {
                        textContent = '[视频]';
                    } else if (m.type === 'sticker') {
                        textContent = '[表情包]';
                    } else if (m.type === 'transfer') {
                        textContent = '[转账] ' + (m.content || '');
                    } else if (m.type === 'redpacket') {
                        textContent = '[红包] ' + (m.content || '');
                    } else if (m.type === 'location') {
                        textContent = '[位置] ' + (m.content || '');
                    } else if (m.type === 'revoked') {
                        textContent = m.content || '消息已撤回';
                    } else if (m.type === 'offline_text' || m.type === 'go_offline_text') {
                        // [FIX-搜索线下] 嵌入式线下私聊/群聊消息，content 即正文
                        textContent = m.content || '';
                    } else {
                        textContent = m.content || `[${m.type || '消息'}]`;
                    }

                    if (keyword && !textContent.toLowerCase().includes(keyword)) return;

                    matchedResults.push({
                        idx: idx,
                        src: src,
                        msg: m,
                        text: textContent
                    });
                });

                // 渲染结果
                if (matchedResults.length === 0) {
                    resultsContainer.innerHTML = '<div class="chat-search-empty">没有找到匹配的聊天记录</div>';
                    return;
                }

                // 按时间倒序排列（最新的在前）
                matchedResults.sort((a, b) => (b.msg.time || 0) - (a.msg.time || 0));

                // 保存匹配结果供删除使用（按来源分桶，删除时不会误删）
                window._lastSearchMatched = matchedResults.map(item => ({ idx: item.idx, src: item.src }));
                window._lastSearchMatchedIdxs = matchedResults.filter(item => item.src === 'online').map(item => item.idx);
                window._lastSearchChatId = chatId;

                let html = `<div class="chat-search-result-count" style="display:flex;justify-content:space-between;align-items:center;">
                    <span>找到 ${matchedResults.length} 条相关记录</span>
                    <span onclick="deleteSearchedMessages()" style="color:#fa5151;font-size:12px;cursor:pointer;padding:4px 10px;border:1px solid #fa5151;border-radius:12px;white-space:nowrap;"><i class="fas fa-trash-alt" style="margin-right:3px;"></i>删除这些消息</span>
                </div>`;
                matchedResults.forEach(item => {
                    const m = item.msg;
                    const isMe = m.sender === 'me';
                    const avatar = isMe ? userAvatar : contactAvatar;
                    const name = isMe ? userName : (m.senderName || contactName);

                    // 时间格式化
                    let timeStr = '';
                    if (m.time) {
                        const d = new Date(m.time);
                        const now = new Date();
                        const isToday = d.toDateString() === now.toDateString();
                        const isThisYear = d.getFullYear() === now.getFullYear();
                        const timeOnly = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                        if (isToday) {
                            timeStr = timeOnly;
                        } else if (isThisYear) {
                            timeStr = `${d.getMonth() + 1}/${d.getDate()} ${timeOnly}`;
                        } else {
                            timeStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${timeOnly}`;
                        }
                    }

                    // 高亮关键字
                    let displayText = _escapeHtml(item.text);
                    if (keyword) {
                        const regex = new RegExp(_escapeRegExp(keyword), 'gi');
                        displayText = displayText.replace(regex, match => `<mark>${match}</mark>`);
                    }

                    // [FIX-搜索线下] 根据消息来源加来源标签；独立页面线下消息单独标记，点击跳转到线下页面
                    const _srcTag = item.src === 'offline'
                        ? '<span style="background:#e8f5e9;color:#2e7d32;padding:1px 6px;border-radius:8px;font-size:10px;margin-right:4px;">🌙 线下</span>'
                        : (item.msg.type === 'offline_text' || item.msg.type === 'go_offline_text')
                            ? '<span style="background:#fff3e0;color:#e65100;padding:1px 6px;border-radius:8px;font-size:10px;margin-right:4px;">🌙 嵌入线下</span>'
                            : '';
                    html += `<div class="chat-search-result-item" onclick="locateChatMessage(${item.idx},'${item.src}')">
                        <img class="chat-search-result-avatar" src="${_escapeHtml(avatar)}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(name[0])}&background=random&size=80'">
                        <div class="chat-search-result-content">
                            <div class="chat-search-result-header">
                                <span class="chat-search-result-name">${_escapeHtml(name)}</span>
                                <span class="chat-search-result-time">${timeStr}</span>
                            </div>
                            <div class="chat-search-result-text">${_srcTag}${displayText}</div>
                        </div>
                    </div>`;
                });

                resultsContainer.innerHTML = html;
            }

            // 删除搜索到的消息（[FIX-搜索线下] 按来源分桶删除，不误删另一侧）
            window.deleteSearchedMessages = function() {
                const matched = window._lastSearchMatched;
                const chatId = window._lastSearchChatId;
                if (!matched || matched.length === 0 || !chatId) return;

                const onlineIdxs = matched.filter(x => x.src === 'online').map(x => x.idx);
                const offlineIdxs = matched.filter(x => x.src === 'offline').map(x => x.idx);
                const total = onlineIdxs.length + offlineIdxs.length;

                showConfirm('删除消息', `确定要删除搜索到的 ${total} 条消息吗？此操作不可恢复。`, () => {
                    // 删除线上（含嵌入式线下 offline_text / go_offline_text）
                    if (onlineIdxs.length > 0 && store.chats && store.chats[chatId]) {
                        const msgs = store.chats[chatId];
                        [...onlineIdxs].sort((a, b) => b - a).forEach(idx => {
                            if (idx >= 0 && idx < msgs.length) msgs.splice(idx, 1);
                        });
                    }
                    // 删除独立页面线下
                    if (offlineIdxs.length > 0 && store.offlineChats && store.offlineChats[chatId]) {
                        const offMsgs = store.offlineChats[chatId];
                        [...offlineIdxs].sort((a, b) => b - a).forEach(idx => {
                            if (idx >= 0 && idx < offMsgs.length) offMsgs.splice(idx, 1);
                        });
                    }
                    save();
                    toast(`已删除 ${total} 条消息`, 'success');
                    window._lastSearchMatched = null;
                    window._lastSearchMatchedIdxs = null;
                    // 刷新搜索结果
                    _executeChatSearch();
                    // 刷新聊天界面
                    if (typeof renderHistory === 'function') renderHistory();
                    // 若当前在独立线下页面，也刷新
                    if (typeof renderOfflineChat === 'function' && typeof offlineContactId !== 'undefined' && offlineContactId === chatId) {
                        try { renderOfflineChat(); } catch (_) {}
                    }
                });
            };

            // 定位到指定消息（[FIX-搜索线下] src='online' 跳聊天页，src='offline' 跳独立线下页面）
            window.locateChatMessage = function(msgIdx, src) {
                src = src || 'online';
                // 关闭搜索面板
                const panel = document.getElementById('chat-search-panel');
                if (panel) {
                    panel.style.display = 'none';
                    panel.classList.remove('show');
                }
                // [FIX-搜索白屏] 恢复聊天输入栏（openChatSearch 中隐藏了它）
                const chatInputBar = document.getElementById('chat-input-bar');
                if (chatInputBar) chatInputBar.style.display = '';

                // === 独立页面线下消息：跳转到 layer-offline-mode 并定位 ===
                if (src === 'offline') {
                    const _cid = window._lastSearchChatId;
                    const _contact = _cid && store.contacts ? store.contacts.find(c => c.id === _cid) : null;
                    if (!_contact) { toast('联系人不存在'); return; }
                    // 确保进入独立线下页面
                    if (typeof offlineContactId === 'undefined' || offlineContactId !== _cid) {
                        // 尝试调用线下入口
                        if (typeof chooseOfflineMode === 'function') {
                            try { chooseOfflineMode('page', _contact); } catch(_) {}
                        } else {
                            // 兜底：直接打开 layer
                            try {
                                window.offlineContactId = _cid;
                                const _layer = document.getElementById('layer-offline-mode');
                                if (_layer && typeof openLayer === 'function') openLayer('layer-offline-mode');
                                else if (_layer) _layer.classList.add('show');
                                if (typeof renderOfflineChat === 'function') renderOfflineChat();
                            } catch(_) {}
                        }
                    }
                    requestAnimationFrame(() => {
                        setTimeout(() => {
                            const container = document.getElementById('offline-chat-history');
                            if (!container) return;
                            const msgRows = container.querySelectorAll('.msg-row, .offline-msg-box, [data-idx]');
                            // 优先按 data-idx 查找
                            let targetRow = null;
                            msgRows.forEach(r => {
                                if (!targetRow && r.dataset && parseInt(r.dataset.idx) === msgIdx) targetRow = r;
                            });
                            if (!targetRow && msgIdx < msgRows.length) targetRow = msgRows[msgIdx];
                            if (!targetRow && msgRows.length > 0) targetRow = msgRows[msgRows.length - 1];
                            if (targetRow) {
                                targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                targetRow.classList.remove('search-highlight');
                                void targetRow.offsetWidth;
                                targetRow.classList.add('search-highlight');
                                setTimeout(() => targetRow.classList.remove('search-highlight'), 2500);
                            }
                        }, 300);
                    });
                    return;
                }

                // === 线上 / 嵌入式线下：原逻辑，跳转聊天页 ===
                _chatSearchLocatedIdx = msgIdx;

                // 强制完整渲染聊天记录，确保所有消息都在DOM中
                if (typeof renderHistory === 'function') {
                    renderHistory(true, true);
                }

                // 等待渲染完成后定位
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        const history = document.getElementById('chat-history');
                        if (!history) return;

                        // 找到目标消息行
                        const msgRows = history.querySelectorAll('.msg-row');
                        let targetRow = null;

                        // msg-row 与 msgs 数组的对应关系：
                        // renderHistory 按顺序渲染 msgs，但中间穿插了时间分隔符
                        // 我们需要找到第 msgIdx 个 msg-row
                        if (msgIdx < msgRows.length) {
                            targetRow = msgRows[msgIdx];
                        } else if (msgRows.length > 0) {
                            targetRow = msgRows[msgRows.length - 1];
                        }

                        if (targetRow) {
                            // 滚动到目标消息
                            targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });

                            // 添加高亮动画
                            targetRow.classList.remove('search-highlight');
                            void targetRow.offsetWidth; // 触发reflow
                            targetRow.classList.add('search-highlight');
                            setTimeout(() => targetRow.classList.remove('search-highlight'), 2500);

                            // 显示"返回最新"按钮
                            _showBackLatestBtn();
                        }
                    }, 150);
                });
            };

            // 显示"返回最新消息"按钮
            function _showBackLatestBtn() {
                let btn = document.getElementById('chat-search-back-latest');
                if (!btn) {
                    btn = document.createElement('div');
                    btn.id = 'chat-search-back-latest';
                    btn.className = 'chat-search-back-latest-btn';
                    btn.innerHTML = '<i class="fas fa-chevron-down" style="margin-right:4px;font-size:10px;"></i>返回最新消息';
                    btn.onclick = function() {
                        _chatSearchLocatedIdx = -1;
                        scrollChatToBottom();
                        _removeBackLatestBtn();
                    };
                    // 插入到 layer-chat 中
                    const layerChat = document.getElementById('layer-chat');
                    if (layerChat) layerChat.appendChild(btn);
                }
                btn.style.display = 'flex';
                btn.style.alignItems = 'center';

                // 当用户下滑到底部时自动隐藏
                const chatHistory = document.getElementById('chat-history');
                if (chatHistory) {
                    const _scrollHandler = function() {
                        const distFromBottom = chatHistory.scrollHeight - chatHistory.scrollTop - chatHistory.clientHeight;
                        if (distFromBottom < 100) {
                            _chatSearchLocatedIdx = -1;
                            _removeBackLatestBtn();
                            chatHistory.removeEventListener('scroll', _scrollHandler);
                        }
                    };
                    // 移除旧的监听器（防止重复绑定）
                    chatHistory._searchScrollHandler && chatHistory.removeEventListener('scroll', chatHistory._searchScrollHandler);
                    chatHistory._searchScrollHandler = _scrollHandler;
                    chatHistory.addEventListener('scroll', _scrollHandler);
                }
            }

            // 移除"返回最新消息"按钮
            function _removeBackLatestBtn() {
                const btn = document.getElementById('chat-search-back-latest');
                if (btn) btn.style.display = 'none';
            }

            // HTML转义
            function _escapeHtml(str) {
                if (!str) return '';
                return String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#039;');
            }

            // 正则特殊字符转义
            function _escapeRegExp(str) {
                return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            }

        })();
        // ========== END 聊天记录搜索功能 ==========
