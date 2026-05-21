// Offline Mode
        let offlineSettings = {
           mode: 'page',
           minWords: 300,
           maxWords: 1000,
           style: '故事化',
           aiName: '智能助手',
           aiAvatar: '',
           userPerspective: '第一人称',
           aiPerspective: '第三人称',
           textAlign: 'left',
           lineSpacing: '1.6',
           groupReplyMax: 0,
           // [外语联系人翻译模式]
           // 'legacy'   = 旧版：整段翻译（AI直接输出外语全文，点击翻译按钮将整段翻成中文）
           // 'bilingual'= 新版：双语混排（AI输出：中文叙事 + 外语对话 + 外语心声 + [DL:]/[HT:]内联翻译标签）
           // 仅在外国人联系人的线下模式下生效；中文联系人无影响
           translateMode: 'legacy',
           // 双语混排模式下：外语对话后译文的显示方式
           // 'always'(始终显示) / 'hidden'(点击💬展开) / 'off'(关闭翻译)
           bilingualDisplay: 'always',
           // [FIX-线下时间感知] 线下模式单独的时间感知开关
           // true = 线下模式中AI不感知时间，不会强调"现在几点"或因暂离而突然切换时间段
           // 不影响线上聊天的时间感知
           disableTimePerception: false,
           customStyles: [
               {name: '故事化', desc: '用生动的故事化叙述，注重情节推进和角色互动。'},
               {name: '文艺', desc: '用文艺优美的笔触，注重情感表达和意境营造。'},
               {name: '简练', desc: '用简洁精炼的文字，直击要点，不拖泥带水。'},
               {name: '散文', desc: '用散文化的笔法，注重意象和情感的自然流淌。'}
           ]
       };
        // Load saved offline settings
        // [OPT] 加载时排除aiName/aiAvatar缓存，这些每次从联系人数据实时获取
        try {
            const savedOffline = JSON.parse(localStorage.getItem('offlineSettings') || 'null');
            if (savedOffline) {
                const {aiName, aiAvatar, ...restSettings} = savedOffline;
                offlineSettings = {...offlineSettings, ...restSettings};
            }
            // [FIX-线下背景] 恢复单独存储的pageBg
            if (offlineSettings.pageBg === '__stored_separately__') {
                const storedBg = localStorage.getItem('offlinePageBg');
                if (storedBg) offlineSettings.pageBg = storedBg;
                else { delete offlineSettings.pageBg; delete offlineSettings.pageBgType; }
            }
        } catch(e) { console.warn('[offline] 加载offlineSettings失败:', e); }
        // Migrate old offline styles if needed
        if (!offlineSettings.customStyles || offlineSettings.customStyles.length === 0) {
            offlineSettings.customStyles = [
                {name: '故事化', desc: '用生动的故事化叙述，注重情节推进和角色互动。'},
                {name: '文艺', desc: '用文艺优美的笔触，注重情感表达和意境营造。'},
                {name: '简练', desc: '用简洁精炼的文字，直击要点，不拖泥带水。'},
                {name: '散文', desc: '用散文化的笔法，注重意象和情感的自然流淌。'}
            ];
        }

        // [OPT] 统一的线下模式状态重置函数，避免分散的重复清理代码
        function _resetOfflineState(opts) {
            opts = opts || {};
            if (opts.clearContact !== false) offlineContactId = null;
            isOfflineInChat = false;
            isGenerating = false;
            window._offlineGenLockTime = 0;
            // [FIX-线下并发重复v2] 退出线下时也清理 in-flight 记录和 typing 指示器
            window._offlineInflight = null;
            try { if (typeof _hideOfflineTypingIndicator === 'function') _hideOfflineTypingIndicator(); } catch(e) {}
            try { if (typeof _toggleOfflineGenButtons === 'function') _toggleOfflineGenButtons(false); } catch(e) {}
            // 重置多选删除状态
            _offlineBatchMode = false;
            _offlineBatchSelected.clear();
            const _batchBar = document.getElementById('offline-batch-bar');
            const _inputBar = document.getElementById('offline-input-bar');
            if (_batchBar) _batchBar.style.display = 'none';
            if (_inputBar) _inputBar.style.display = 'flex';
            if (opts.clearUI !== false) {
                const chatNavBar = document.getElementById('chat-nav-bar');
                const offHeader = document.getElementById('chat-offline-header');
                const privateBar = document.getElementById('chat-offline-private-bar');
                const goHeader = document.getElementById('chat-offline-group-participants');
                const chatHist = document.getElementById('chat-history');
                if (chatNavBar) chatNavBar.style.display = 'flex';
                if (offHeader) offHeader.style.display = 'none';
                if (privateBar) privateBar.style.display = 'none';
                if (goHeader) goHeader.style.display = 'none';
                if (chatHist) chatHist.classList.remove('offline-chat-active');
            }
            if (opts.clearGroup !== false) {
                offlineGroupMembers = [];
                groupOfflineInvited = [];
            }
            if (typeof cancelGroupOfflineQuote === 'function') cancelGroupOfflineQuote();
            // [FIX-顶栏重合] 重置 mini-status，防止残留内容导致下次进入时重叠
            var _miniSt1 = document.getElementById('offline-mini-status');
            var _miniSt2 = document.getElementById('chat-offline-mini-status');
            if (_miniSt1) { _miniSt1.style.display = 'none'; _miniSt1.innerHTML = ''; }
            if (_miniSt2) { _miniSt2.style.display = 'none'; _miniSt2.innerHTML = ''; }
            // [票夹] 重置见面检测追踪器和见面状态徽章
            if (typeof resetMeetingTracker === 'function') resetMeetingTracker(offlineContactId);
            var _meetBadge1 = document.getElementById('chat-offline-meeting-badge');
            var _meetBadge2 = document.getElementById('offline-meeting-badge');
            if (_meetBadge1) { _meetBadge1.classList.remove('show'); _meetBadge1.innerHTML = ''; }
            if (_meetBadge2) { _meetBadge2.classList.remove('show'); _meetBadge2.innerHTML = ''; }
        }

        // ===== 线下模式顶部栏折叠/展开 =====
        let _offlineHeaderCollapsed = false;
        try { _offlineHeaderCollapsed = localStorage.getItem('offlineHeaderCollapsed') === 'true'; } catch(e){}

        window.toggleOfflineHeaderCollapse = function(mode) {
            _offlineHeaderCollapsed = !_offlineHeaderCollapsed;
            try { localStorage.setItem('offlineHeaderCollapsed', _offlineHeaderCollapsed ? 'true' : 'false'); } catch(e){}
            _applyOfflineHeaderCollapse(mode);
        };

        // [FIX-折叠兼容] 用 setProperty('display','none','important') 隐藏元素
        // inline style + !important 优先级最高，用户自定义CSS无论是否带 !important 都无法覆盖
        function _offlineHide(el) { if (el) el.style.setProperty('display', 'none', 'important'); }
        function _offlineShow(el, val) { if (el) el.style.display = val || ''; }

        function _applyOfflineHeaderCollapse(mode) {
            var collapsed = _offlineHeaderCollapsed;
            // 独立页面模式
            if (mode === 'page' || mode === 'both') {
                var infoBar = document.getElementById('offline-info-bar');
                var badge = document.getElementById('offline-meeting-badge');
                var btn = document.getElementById('offline-collapse-btn');
                var mini = document.getElementById('offline-mini-status');
                if (collapsed) { _offlineHide(infoBar); } else { _offlineShow(infoBar, 'flex'); }
                if (collapsed) { _offlineHide(badge); } else { _offlineShow(badge); }
                if (btn) btn.innerHTML = collapsed ? '<i class="fas fa-chevron-down"></i>' : '<i class="fas fa-chevron-up"></i>';
                if (mini) {
                    if (collapsed) {
                        var dist = (document.getElementById('offline-distance') || {}).textContent || '?';
                        var hr = (document.getElementById('offline-user-hr') || {}).textContent || '?';
                        mini.innerHTML = ' <span style="font-size:11px;opacity:0.7;margin-left:4px;">📍' + dist + 'm · ♥' + hr + '</span>';
                        mini.style.display = '';
                    } else { _offlineHide(mini); }
                }
            }
            // 聊天嵌入模式
            if (mode === 'chat' || mode === 'both') {
                var infoBar2 = document.getElementById('chat-offline-private-bar');
                var badge2 = document.getElementById('chat-offline-meeting-badge');
                var goHeader = document.getElementById('chat-offline-group-participants');
                var btn2 = document.getElementById('chat-offline-collapse-btn');
                var mini2 = document.getElementById('chat-offline-mini-status');
                if (collapsed) { _offlineHide(infoBar2); } else { _offlineShow(infoBar2); }
                if (collapsed) { _offlineHide(goHeader); } else { _offlineShow(goHeader); }
                if (collapsed) { _offlineHide(badge2); } else { _offlineShow(badge2); }
                if (btn2) btn2.innerHTML = collapsed ? '<i class="fas fa-chevron-down"></i>' : '<i class="fas fa-chevron-up"></i>';
                if (mini2) {
                    if (collapsed) {
                        var dist2 = (document.getElementById('chat-offline-distance') || {}).textContent || '?';
                        var hr2 = (document.getElementById('chat-offline-user-hr') || {}).textContent || '?';
                        mini2.innerHTML = ' <span style="font-size:11px;opacity:0.7;margin-left:4px;">📍' + dist2 + 'm · ♥' + hr2 + '</span>';
                        mini2.style.display = '';
                    } else { _offlineHide(mini2); }
                }
            }
        }

        // [FIX-后台折叠重合] 从后台恢复时重新应用折叠状态，防止心跳/位置元素与其他元素重叠
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible' && _offlineHeaderCollapsed) {
                // 嵌入式线下模式
                if (typeof isOfflineInChat !== 'undefined' && isOfflineInChat) {
                    requestAnimationFrame(function() { _applyOfflineHeaderCollapse('chat'); });
                }
                // 独立页面线下模式
                if (offlineContactId) {
                    var offLayer = document.getElementById('layer-offline-mode');
                    if (offLayer && offLayer.classList.contains('show')) {
                        requestAnimationFrame(function() { _applyOfflineHeaderCollapse('page'); });
                    }
                }
            }
        });

        // [OPT] 安全保存offlineSettings到localStorage（排除大型base64头像数据）
        function _saveOfflineSettings() {
            try {
                // 保存时排除可能的大型base64头像数据，只保存配置项
                const toSave = {...offlineSettings};
                // 如果aiAvatar是base64数据（超过500字符），不存入localStorage
                if (toSave.aiAvatar && toSave.aiAvatar.length > 500) {
                    toSave.aiAvatar = '';
                }
                // [FIX-线下背景] pageBg如果是base64图片，单独存储避免offlineSettings过大
                if (toSave.pageBg && toSave.pageBg.length > 500) {
                    try { localStorage.setItem('offlinePageBg', toSave.pageBg); } catch(e2) { console.warn('[offline] 保存pageBg失败:', e2); }
                    toSave.pageBg = '__stored_separately__';
                } else if (!toSave.pageBg) {
                    try { localStorage.removeItem('offlinePageBg'); } catch(e2) {}
                }
                localStorage.setItem('offlineSettings', JSON.stringify(toSave));
            } catch(e) {
                console.warn('[offline] 保存offlineSettings失败:', e);
            }
        }

        // [OPT] 从联系人获取fallback头像URL（避免在每个函数中重复写）
        function _getContactAvatar(contact) {
            if (!contact) return _ph(50);
            return contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((contact.name||'?')[0])}`;
        }

        // [NEW-线下背景] 修改线下独立界面模式背景
        function changeOfflinePageBg() {
            const modal = document.createElement('div');
            modal.className = 'modal-mask';
            modal.style.cssText = 'z-index:10010; display:flex;';
            modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
                <div class="modal-box" style="max-width:360px;">
                    <h3 style="text-align:center; margin-bottom:16px;">修改线下背景</h3>
                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <button id="offline-bg-upload-btn" style="padding:12px; border:2px dashed #ccc; background:#fafafa; border-radius:12px; cursor:pointer; font-size:14px; color:#666;">
                            <i class="fas fa-upload"></i> 上传背景图片
                        </button>
                        <input type="file" id="offline-bg-file-input" accept="image/*" style="display:none;">
                        <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;" id="offline-bg-presets">
                            <div onclick="applyOfflinePageBgColor('#f5f5f5')" style="width:40px;height:40px;border-radius:8px;background:#f5f5f5;border:2px solid #ddd;cursor:pointer;" title="默认"></div>
                            <div onclick="applyOfflinePageBgColor('#1a1a2e')" style="width:40px;height:40px;border-radius:8px;background:#1a1a2e;border:2px solid #ddd;cursor:pointer;" title="深蓝"></div>
                            <div onclick="applyOfflinePageBgColor('#fdf6e3')" style="width:40px;height:40px;border-radius:8px;background:#fdf6e3;border:2px solid #ddd;cursor:pointer;" title="暖黄"></div>
                            <div onclick="applyOfflinePageBgColor('#f0e6ef')" style="width:40px;height:40px;border-radius:8px;background:#f0e6ef;border:2px solid #ddd;cursor:pointer;" title="淡紫"></div>
                            <div onclick="applyOfflinePageBgColor('#e8f5e9')" style="width:40px;height:40px;border-radius:8px;background:#e8f5e9;border:2px solid #ddd;cursor:pointer;" title="浅绿"></div>
                            <div onclick="applyOfflinePageBgColor('#fff3e0')" style="width:40px;height:40px;border-radius:8px;background:#fff3e0;border:2px solid #ddd;cursor:pointer;" title="暖橙"></div>
                        </div>
                        ${offlineSettings.pageBg ? '<button onclick="clearOfflinePageBg()" style="padding:10px; border:none; background:#ff4757; color:#fff; border-radius:10px; cursor:pointer; font-size:13px;"><i class="fas fa-trash"></i> 清除背景</button>' : ''}
                        <button onclick="this.closest(\'.modal-mask\').remove()" style="padding:10px; border:1px solid #ddd; background:#fff; border-radius:10px; cursor:pointer; font-size:13px;">关闭</button>
                    </div>
                </div>`;
            document.getElementById('device').appendChild(modal);
            
            // 上传按钮绑定
            modal.querySelector('#offline-bg-upload-btn').onclick = function() {
                modal.querySelector('#offline-bg-file-input').click();
            };
            modal.querySelector('#offline-bg-file-input').onchange = function(e) {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { toast('图片不能超过5MB', 'error'); return; }
                const reader = new FileReader();
                reader.onload = function(ev) {
                    offlineSettings.pageBg = ev.target.result;
                    offlineSettings.pageBgType = 'image';
                    _saveOfflineSettings();
                    _applyOfflinePageBg();
                    modal.remove();
                    toast('背景已更新 ✅');
                };
                reader.readAsDataURL(file);
            };
        }

        function applyOfflinePageBgColor(color) {
            offlineSettings.pageBg = color;
            offlineSettings.pageBgType = 'color';
            _saveOfflineSettings();
            _applyOfflinePageBg();
            // 关闭弹窗
            const mask = document.querySelector('.modal-mask[style*="z-index:10010"]');
            if (mask) mask.remove();
            toast('背景已更新 ✅');
        }

        function clearOfflinePageBg() {
            delete offlineSettings.pageBg;
            delete offlineSettings.pageBgType;
            _saveOfflineSettings();
            _applyOfflinePageBg();
            const mask = document.querySelector('.modal-mask[style*="z-index:10010"]');
            if (mask) mask.remove();
            toast('背景已清除');
        }

        // 应用线下独立界面背景
        function _applyOfflinePageBg() {
            const layer = document.getElementById('layer-offline-mode');
            if (!layer) return;
            const scrollContainer = layer.querySelector('.offline-scroll-container');
            if (offlineSettings.pageBgType === 'image' && offlineSettings.pageBg) {
                layer.style.backgroundImage = `url(${offlineSettings.pageBg})`;
                layer.style.backgroundSize = 'cover';
                layer.style.backgroundPosition = 'center';
                layer.style.backgroundColor = '';
                // [FIX-线下背景遮挡v2] 用!important覆盖CSS中.offline-scroll-container的不透明背景
                // CSS定义了background-color:#f5f5f5和方格纹理background-image，普通style无法覆盖
                if (scrollContainer) {
                    scrollContainer.style.setProperty('background-image', 'none', 'important');
                    scrollContainer.style.setProperty('background-color', 'transparent', 'important');
                }
            } else if (offlineSettings.pageBgType === 'color' && offlineSettings.pageBg) {
                layer.style.backgroundImage = '';
                layer.style.backgroundColor = offlineSettings.pageBg;
                if (scrollContainer) {
                    scrollContainer.style.setProperty('background-image', 'none', 'important');
                    scrollContainer.style.setProperty('background-color', 'transparent', 'important');
                }
            } else {
                layer.style.backgroundImage = '';
                layer.style.backgroundColor = '';
                // 恢复默认方格纹理背景
                if (scrollContainer) {
                    scrollContainer.style.removeProperty('background-image');
                    scrollContainer.style.removeProperty('background-color');
                }
            }
        }

        function showOfflineModeChoice() {
            try {
                if (!activeChatId) return toast("无效的聊天上下文", "error");
                
                // [OPT] 统一释放isGenerating锁，确保选择界面可以正常显示
                if (isGenerating) {
                    console.warn('[offline] showOfflineModeChoice: 释放isGenerating锁');
                    isGenerating = false;
                    window._offlineGenLockTime = 0;
                }
                // 如果旧联系人的线下状态残留，也一并清理
                if (offlineContactId && offlineContactId !== activeChatId) {
                    offlineContactId = null;
                }
            
                closeExtMenu();
            
                // [OPT] 完全销毁旧modal并重新创建，避免任何事件绑定残留
                const oldModal = document.getElementById('modal-offline-choice');
                if (oldModal) oldModal.remove();
            
                const modal = document.createElement('div');
                modal.id = 'modal-offline-choice';
                modal.className = 'modal-mask';
                modal.style.cssText = 'z-index:10001; display:none; pointer-events:auto;';
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                        modal.remove();
                    }
                });
            
                modal.innerHTML = `
                    <div class="modal-box" style="pointer-events:auto; position:relative; z-index:10002;">
                        <h3 style="text-align:center; margin-bottom:20px;">选择模式</h3>
                        <div class="mode-choice-card" data-offline-mode="page" style="touch-action:manipulation; -webkit-tap-highlight-color:transparent; user-select:none; cursor:pointer;">
                            <div class="mode-icon"><i class="fas fa-book-open"></i></div>
                            <div>
                                <div style="font-weight:bold; font-size:16px;">独立界面模式</div>
                                <div style="font-size:12px; color:#888; margin-top:4px;">沉浸式阅读体验，独立展示</div>
                            </div>
                        </div>
                        <div class="mode-choice-card" data-offline-mode="chat" style="touch-action:manipulation; -webkit-tap-highlight-color:transparent; user-select:none; cursor:pointer;">
                            <div class="mode-icon"><i class="fas fa-comments"></i></div>
                            <div>
                                <div style="font-weight:bold; font-size:16px;">私聊界面模式</div>
                                <div style="font-size:12px; color:#888; margin-top:4px;">保留气泡对话样式，融合体验</div>
                            </div>
                        </div>
                        <div data-offline-cancel style="text-align:center; margin-top:15px; color:#999; padding:10px; cursor:pointer;">取消</div>
                    </div>
                `;
            
                document.getElementById('device').appendChild(modal);
            
                // [OPT] 使用事件委托替代多个addEventListener，更简洁可靠
                // 同时只绑定click事件（移动端也能正常触发click），避免touchend+click双重触发
                let isChoosing = false;
                modal.querySelector('.modal-box').addEventListener('click', function(e) {
                    e.stopPropagation();
                    
                    // 检查是否点击了取消按钮
                    if (e.target.closest('[data-offline-cancel]')) {
                        modal.style.display = 'none';
                        modal.remove();
                        return;
                    }
                    
                    // 检查是否点击了模式选择卡片
                    const card = e.target.closest('[data-offline-mode]');
                    if (!card) return;
                    
                    const mode = card.getAttribute('data-offline-mode');
                    if (!mode) return;
                    
                    // 防抖
                    if (isChoosing) return;
                    isChoosing = true;
                    
                    modal.style.display = 'none';
                    modal.remove();
                    
                    // 短暂延迟确保DOM清理完毕后再执行
                    setTimeout(function() {
                        chooseOfflineMode(mode);
                        isChoosing = false;
                    }, 30);
                }, { passive: false });

                // 延迟显示，确保DOM完全就绪
                setTimeout(() => { modal.style.display = 'flex'; }, 50);
                
            } catch(err) {
                console.error('[offline] showOfflineModeChoice error:', err);
                toast('打开线下模式选择失败: ' + (err.message || '未知错误'), 'error');
                isGenerating = false;
            }
        }

        function chooseOfflineMode(mode) {
            try {
                // 清理可能残留的选择弹窗
                const choiceModal = document.getElementById('modal-offline-choice');
                if (choiceModal) choiceModal.remove();
                
                // [OPT] 如果之前有其他联系人的线下模式缓存，先清理
                if (offlineContactId && offlineContactId !== activeChatId) {
                    _resetOfflineState({ clearUI: false });
                }
                
                // 释放isGenerating锁
                isGenerating = false;
                window._offlineGenLockTime = 0;
                
                offlineContactId = activeChatId;
                const contact = store.contacts.find(c => c.id === offlineContactId);
                if (!contact) {
                    toast('找不到联系人', 'error');
                    offlineContactId = null;
                    return;
                }
                const isGroup = contact.isGroup;
                
                // [OPT] 每次进入线下模式时，从联系人数据实时获取名字和头像（不使用缓存）
                offlineSettings.aiName = contact.name;
                offlineSettings.aiAvatar = _getContactAvatar(contact);
                // 同步联系人绑定的用户人设
                if (contact.settings && contact.settings.userPersona) {
                    offlineSettings.userPersona = contact.settings.userPersona;
                }
                _saveOfflineSettings();
                
                // 群聊：初始化成员状态
                // [FIX-群聊成员丢失] 过滤掉在store.contacts中找不到的无效成员id，避免显示"未知"无头像成员
                if (isGroup && contact.members) {
                    offlineGroupMembers = contact.members.map(id => {
                        const m = store.contacts.find(c => c.id === id);
                        if (!m) return null;
                        return {
                            id: id,
                            name: m.name,
                            // [群专属头像] 优先使用群专属头像
                            avatar: (contact.groupAvatars && contact.groupAvatars[id]) || _getContactAvatar(m),
                            hr: 70 + Math.floor(Math.random() * 20)
                        };
                    }).filter(Boolean);
                } else {
                    offlineGroupMembers = [];
                }
                
                if (mode === 'page') {
                    const layer = document.getElementById('layer-offline-mode');
                    
                    // [FIX-顶栏重合] 确保 .nav-title 内的心声图标和 mini-status 存在
                    // closeLayer 中的旧代码曾用 innerText 清除所有子元素，需要重建
                    const _pageTitleEl = document.querySelector('#layer-offline-mode .nav-title');
                    if (_pageTitleEl) {
                        // 检查心声图标是否存在
                        if (!_pageTitleEl.querySelector('.fa-heart')) {
                            // 被 innerText 清除了，重建完整结构
                            _pageTitleEl.innerHTML = '线下模式 <i class="fas fa-heart" style="color:#ff758c; font-size:14px; margin-left:6px; cursor:pointer; pointer-events:auto; animation: heartPulse 1.5s infinite;" onclick="event.stopPropagation(); showOfflineThought()" title="心声"></i><span id="offline-mini-status" class="offline-mini-status" style="display:none;"></span>';
                        } else {
                            // 结构完整，只确保文本正确和 mini-status 隐藏
                            var _firstTN = Array.from(_pageTitleEl.childNodes).find(function(n) { return n.nodeType === 3; });
                            if (_firstTN) _firstTN.textContent = '线下模式 ';
                            var _miniS = document.getElementById('offline-mini-status');
                            if (_miniS) { _miniS.style.display = 'none'; _miniS.innerHTML = ''; }
                        }
                    }
                    
                    // 统一使用双人头像栏（私聊和群聊共用）
                    document.getElementById('offline-info-bar').style.display = 'flex';
                    document.getElementById('offline-user-avatar').src = getUserPersonaAvatar(contact);
                    
                    const aiAvatarEl = document.getElementById('offline-ai-avatar');
                    aiAvatarEl.src = _getContactAvatar(contact);
                    if (isGroup) {
                        aiAvatarEl.classList.add('offline-ai-avatar-clickable');
                        aiAvatarEl.onclick = function() { showGroupMemberPopup(); };
                    } else {
                        aiAvatarEl.classList.remove('offline-ai-avatar-clickable');
                        aiAvatarEl.onclick = null;
                    }
                    
                    layer.classList.add('show');
                    _applyOfflinePageBg(); // 应用已保存的线下背景
                    // [FIX-顶栏重合v2] 每次进入线下模式时强制展开顶栏
                    // 折叠状态下 mini-status 内容会撑宽标题区域，和右侧按钮组重叠
                    // 用户进入后可以手动折叠
                    _offlineHeaderCollapsed = false;
                    try { localStorage.setItem('offlineHeaderCollapsed', 'false'); } catch(e){}
                    requestAnimationFrame(function() { _applyOfflineHeaderCollapse('page'); });
                    startOfflineSimulation(false);
                    renderOfflineChat();
                } else {
                    if (isGroup) {
                        // 群聊私聊界面线下模式：先弹出邀请成员选择
                        showGroupOfflineInviteModal(contact);
                        return;
                    }
                    // 单人私聊线下模式
                    isOfflineInChat = true;
                    document.getElementById('chat-nav-bar').style.display = 'none';
                    document.getElementById('chat-offline-header').style.display = 'block';
                    
                    const chatHistoryEl = document.getElementById('chat-history');
                    if (chatHistoryEl) chatHistoryEl.classList.add('offline-chat-active');
                    
                    // 双人头像栏
                    document.getElementById('chat-offline-private-bar').style.display = 'flex';
                    document.getElementById('chat-offline-user-avatar').src = getUserPersonaAvatar(contact);
                    
                    const aiAvatarEl = document.getElementById('chat-offline-ai-avatar');
                    aiAvatarEl.src = _getContactAvatar(contact);
                    aiAvatarEl.classList.remove('offline-ai-avatar-clickable');
                    aiAvatarEl.onclick = null;
                    
                    // [FIX-顶栏重合v2] 每次进入线下模式时强制展开顶栏
                    _offlineHeaderCollapsed = false;
                    try { localStorage.setItem('offlineHeaderCollapsed', 'false'); } catch(e){}
                    requestAnimationFrame(function() { _applyOfflineHeaderCollapse('chat'); });
                    startOfflineSimulation(true);
                    toast("已进入私聊线下模式");
                }
            } catch(err) {
                console.error('[offline] chooseOfflineMode error:', err);
                toast('进入线下模式失败: ' + (err.message || '未知错误'), 'error');
                _resetOfflineState();
            }
        }

        // ===== 群聊私聊界面线下模式 - 邀请成员弹窗 =====
        function showGroupOfflineInviteModal(contact) {
            const modal = document.getElementById('modal-group-offline-invite');
            const listEl = document.getElementById('group-offline-invite-list');
            if (!modal || !listEl) return;
            listEl.innerHTML = '';
            const members = contact.members || [];
            members.forEach(id => {
                const m = store.contacts.find(c => c.id === id);
                if (!m) return;
                const avatar = m.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((m.name||'?')[0])}`;
                const item = document.createElement('label');
                item.className = 'goi-member-item';
                item.innerHTML = `
                    <input type="checkbox" value="${id}" checked class="goi-checkbox">
                    <img src="${avatar}" class="goi-avatar">
                    <span class="goi-name">${m.name}</span>
                `;
                listEl.appendChild(item);
            });
            modal.style.display = 'flex';
        }

        function confirmGroupOfflineInvite() {
            const modal = document.getElementById('modal-group-offline-invite');
            const checkboxes = modal.querySelectorAll('.goi-checkbox:checked');
            const selectedIds = Array.from(checkboxes).map(cb => cb.value);
            if (selectedIds.length === 0) { toast('请至少选择一位成员', 'error'); return; }
            modal.style.display = 'none';
            
            // 设置邀请列表
            groupOfflineInvited = selectedIds;
            groupOfflineTurnCount = 1;
            groupOfflineQuoteRef = null;
            
            // 筛选 offlineGroupMembers 只保留被邀请的
            offlineGroupMembers = offlineGroupMembers.filter(m => selectedIds.includes(m.id));
            
            const contact = store.contacts.find(c => c.id === offlineContactId);
            
            isOfflineInChat = true;
            document.getElementById('chat-nav-bar').style.display = 'none';
            document.getElementById('chat-offline-header').style.display = 'block';
            
            const chatHistory = document.getElementById('chat-history');
            if (chatHistory) chatHistory.classList.add('offline-chat-active');
            
            // 显示群聊线下专用头部（参与者列表）
            document.getElementById('chat-offline-private-bar').style.display = 'none';
            const goHeader = document.getElementById('chat-offline-group-participants');
            if (goHeader) {
                goHeader.style.display = 'flex';
                renderGroupOfflineParticipants();
            }
            
            startOfflineSimulation(true);
            
            // 插入系统提示
            if (!store.chats[offlineContactId]) store.chats[offlineContactId] = [];
            store.chats[offlineContactId].push({
                sender: 'system', type: 'poke',
                content: `— 群聊线下模式开始 · 参与者: ${offlineGroupMembers.map(m => m.name).join('、')} —`,
                time: Date.now()
            });
            save();
            renderHistory();
            // [FIX-顶栏重合v2] 每次进入线下模式时强制展开顶栏
            _offlineHeaderCollapsed = false;
            try { localStorage.setItem('offlineHeaderCollapsed', 'false'); } catch(e){}
            requestAnimationFrame(function() { _applyOfflineHeaderCollapse('chat'); });
            toast("已进入群聊线下模式");
        }

        function renderGroupOfflineParticipants() {
            const container = document.getElementById('go-participants-list');
            if (!container) return;
            const userAvatar = store.user.avatar || _ph(36);
            const userName = store.user.name || '我';
            let html = `<div class="go-participant"><img src="${userAvatar}" class="go-participant-avatar" title="${userName}"><span class="go-participant-name">${userName}</span></div>`;
            offlineGroupMembers.forEach(m => {
                html += `<div class="go-participant"><img src="${m.avatar}" class="go-participant-avatar" title="${m.name}"><span class="go-participant-name">${m.name}</span></div>`;
            });
            container.innerHTML = html;
        }

        // ===== 群聊线下引用功能 =====
        function setGroupOfflineQuote(msgIdx) {
            const msgs = store.chats[offlineContactId] || [];
            const m = msgs[msgIdx];
            if (!m || m.type === 'poke') return;
            const senderName = m.sender === 'me' ? (store.user.name || '我') : (m.goSenderName || '未知');
            const previewText = (m.content || '').substring(0, 50) + ((m.content||'').length > 50 ? '...' : '');
            groupOfflineQuoteRef = { idx: msgIdx, senderName: senderName, text: previewText };
            // 显示引用预览
            const quoteBar = document.getElementById('go-quote-preview');
            if (quoteBar) {
                quoteBar.style.display = 'flex';
                document.getElementById('go-quote-text').innerText = `${senderName}: ${previewText}`;
            }
            toast(`引用了 ${senderName} 的消息`);
        }

        function cancelGroupOfflineQuote() {
            groupOfflineQuoteRef = null;
            const quoteBar = document.getElementById('go-quote-preview');
            if (quoteBar) quoteBar.style.display = 'none';
        }

        // [OPT] 辅助函数：仅关闭线下模式UI，不清除历史，不插入系统消息
        function _closeOfflineInChatUI() {
            _resetOfflineState({ clearContact: false }); // 保留offlineContactId
            groupOfflineTurnCount = 0;
            groupOfflineQuoteRef = null;
            stopOfflineSimulation();
        }

        function exitOfflineInChat() {
            // 自定义3按钮弹窗：取消 / 保留线下 / 回到私聊
            const oldModal = document.getElementById('modal-exit-offline-3btn');
            if (oldModal) oldModal.remove();

            const modal = document.createElement('div');
            modal.id = 'modal-exit-offline-3btn';
            modal.className = 'modal-mask';
            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="modal-box" style="width:80%; padding:25px 20px 20px;">
                    <h3 style="margin-bottom:10px; text-align:center;">退出线下模式</h3>
                    <p style="margin-bottom:20px; text-align:center; color:#666; font-size:13px; line-height:1.6;">
                        选择退出方式：<br>
                        <b>保留线下</b>：退出到联系人列表，下次点进来仍是线下模式<br>
                        <b>回到私聊</b>：恢复线上聊天，结束本次线下活动
                    </p>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <button id="exit-offline-btn-keep" style="width:100%; padding:13px; border:none; background:#1a1a1a; color:#fff; border-radius:22px; font-size:15px; cursor:pointer; font-weight:500; letter-spacing:0.5px;">
                            <i class="fas fa-bookmark"></i> 保留线下
                        </button>
                        <button id="exit-offline-btn-online" style="width:100%; padding:13px; border:none; background:#1a1a1a; color:#fff; border-radius:22px; font-size:15px; cursor:pointer; font-weight:500; letter-spacing:0.5px;">
                            <i class="fas fa-comment-dots"></i> 回到私聊
                        </button>
                        <button id="exit-offline-btn-cancel" style="width:100%; padding:12px; border:2px solid #1a1a1a; background:transparent; color:#1a1a1a; border-radius:22px; font-size:14px; cursor:pointer; font-weight:500; letter-spacing:0.5px;">
                            取消
                        </button>
                    </div>
                </div>
            `;
            document.getElementById('device').appendChild(modal);

            // 取消：关闭弹窗，什么都不做
            document.getElementById('exit-offline-btn-cancel').onclick = () => {
                modal.remove();
            };

            // 保留线下：退出到联系人列表，但保持 offlineContactId 和 isOfflineInChat 状态
            // 下次点进该联系人聊天时，line 5337 的逻辑会自动恢复线下UI
            document.getElementById('exit-offline-btn-keep').onclick = () => {
                modal.remove();
                // 仅关闭线下UI元素，但不清除 offlineContactId 和 isOfflineInChat
                // 这样 openChat 时会检测到状态并恢复线下UI
                const chatNavBar = document.getElementById('chat-nav-bar');
                const offHeader = document.getElementById('chat-offline-header');
                const privateBar = document.getElementById('chat-offline-private-bar');
                const goHeader = document.getElementById('chat-offline-group-participants');
                if (chatNavBar) chatNavBar.style.display = 'flex';
                if (offHeader) offHeader.style.display = 'none';
                if (privateBar) privateBar.style.display = 'none';
                if (goHeader) goHeader.style.display = 'none';
                stopOfflineSimulation();
                // 关闭聊天界面，回到联系人列表
                closeLayer('layer-chat');
                toast("已保留线下模式，下次进入仍为线下");
            };

            // 回到私聊：完全退出线下模式，恢复线上聊天
            document.getElementById('exit-offline-btn-online').onclick = () => {
                modal.remove();
                _closeOfflineInChatUI();
                offlineContactId = null;
                // [FIX-线下转线上] 确保isOfflineInChat彻底重置，防止残留状态影响后续线上聊天
                isOfflineInChat = false;
                if (activeChatId && store.chats[activeChatId]) {
                    store.chats[activeChatId].push({
                        sender: 'system',
                        type: 'poke',
                        content: '— 线下活动已结束，双方回归线上 —',
                        time: Date.now()
                    });
                    save();
                }
                // [FIX-线下闪烁] 强制完整重新渲染，确保offline_text气泡正确切换为普通样式
                renderHistory(false, true);
                toast("已结束线下模式，回归线上聊天");
            };
        }

        function confirmExitOfflineStandalone() {
            showConfirm("退出线下模式", "确定要退出线下模式吗？", () => {
                // [FIX-线下转线上] 退出独立页面线下模式时，插入系统消息告知AI线下活动已结束
                // 与聊天嵌入模式的退出逻辑保持一致，防止AI在后续线上聊天中仍以为在线下
                const _exitContactId = offlineContactId;
                if (_exitContactId && store.chats) {
                    if (!store.chats[_exitContactId]) store.chats[_exitContactId] = [];
                    store.chats[_exitContactId].push({
                        sender: 'system',
                        type: 'poke',
                        content: '— 线下活动已结束，双方回归线上 —',
                        time: Date.now()
                    });
                    save();
                }
                _resetOfflineState();
                stopOfflineSimulation();
                closeLayer('layer-offline-mode');
            });
        }

        // --- [通用] 设置弹窗 Tab 药片栏切换函数 ---
        window.switchSettingsTab = function(groupName, tabIndex, clickedEl) {
            // 切换 Tab 按钮高亮
            var tabBar = clickedEl.parentElement;
            var tabs = tabBar.querySelectorAll('.settings-tab');
            tabs.forEach(function(t) { t.classList.remove('active'); });
            clickedEl.classList.add('active');
            // 切换 Tab 内容区
            var modal = tabBar.closest('.modal-box');
            if (!modal) return;
            var contents = modal.querySelectorAll('.settings-tab-content[data-tab-group="' + groupName + '"]');
            contents.forEach(function(c, i) {
                if (i === tabIndex) {
                    c.style.display = 'block';
                    c.classList.add('active');
                } else {
                    c.style.display = 'none';
                    c.classList.remove('active');
                }
            });
        };

        // --- [文风折叠] 线下文风折叠面板 ---
        const _OFFLINE_STYLE_PANEL_LS_KEY = 'offlineStylePanelExpanded';
        function _applyOfflineStylePanelState() {
            const panel = document.getElementById('offline-style-panel');
            const arrow = document.getElementById('offline-style-toggle-arrow');
            if (!panel) return;
            const expanded = localStorage.getItem(_OFFLINE_STYLE_PANEL_LS_KEY) === '1';
            if (expanded) { panel.classList.add('open'); } else { panel.classList.remove('open'); }
            if (arrow) arrow.style.transform = expanded ? 'rotate(180deg)' : 'rotate(0deg)';
        }
        function toggleOfflineStylePanel() {
            const cur = localStorage.getItem(_OFFLINE_STYLE_PANEL_LS_KEY) === '1';
            localStorage.setItem(_OFFLINE_STYLE_PANEL_LS_KEY, cur ? '0' : '1');
            _applyOfflineStylePanelState();
        }
        window.toggleOfflineStylePanel = toggleOfflineStylePanel;

        // [FIX-文风选择过长] 弹出式文风选择器，替代原生select
        window.openOfflineStylePicker = function() {
            const styles = offlineSettings.customStyles || [];
            if (styles.length === 0) { toast('还没有文风，请先在下方"管理文风"中添加'); return; }
            const currentStyle = offlineSettings.style || '故事化';

            // 构建底部弹出面板
            const overlay = document.createElement('div');
            overlay.className = 'modal-mask';
            overlay.style.cssText = 'z-index:10100;display:flex;align-items:center;justify-content:center;';
            overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

            let listHtml = '';
            styles.forEach(function(s) {
                const isActive = s.name === currentStyle;
                const descShort = s.desc ? (s.desc.length > 40 ? s.desc.substring(0, 40) + '...' : s.desc) : '';
                listHtml += '<div class="offline-style-picker-item' + (isActive ? ' active' : '') + '" data-style-name="' + s.name.replace(/"/g, '&quot;') + '">'
                    + '<div style="display:flex;align-items:center;gap:8px;">'
                    + (isActive ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>' : '<div style="width:16px;flex-shrink:0;"></div>')
                    + '<div><div style="font-weight:500;font-size:14px;color:#1a1a1a;">' + s.name + '</div>'
                    + (descShort ? '<div style="font-size:11px;color:#999;margin-top:2px;">' + descShort + '</div>' : '')
                    + '</div></div></div>';
            });

            // [FIX-文风点击无反应] 移除了 onclick="event.stopPropagation()"
            // 之前 stopPropagation 会阻断事件冒泡到 overlay，导致事件委托的选择逻辑永远触发不了
            // overlay.onclick 已有 e.target === overlay 判断，只在点击遮罩层自身时关闭，不需要 stopPropagation
            overlay.innerHTML = '<div style="background:#fff;border-radius:16px;width:90%;max-width:400px;max-height:70vh;display:flex;flex-direction:column;pointer-events:auto;box-shadow:0 4px 24px rgba(0,0,0,0.18);">'
                + '<div style="padding:14px 16px;border-bottom:1px solid #e0e0e0;display:flex;justify-content:space-between;align-items:center;">'
                + '<span style="font-size:16px;font-weight:600;color:#1a1a1a;display:flex;align-items:center;gap:6px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>选择文风</span>'
                + '<span onclick="this.closest(\'.modal-mask\').remove()" style="font-size:22px;color:#999;cursor:pointer;padding:0 4px;">×</span></div>'
                + '<div style="overflow-y:auto;padding:8px 12px;flex:1;">' + listHtml + '</div>'
                + '</div>';

            document.getElementById('device').appendChild(overlay);

            // 事件委托
            overlay.addEventListener('click', function(e) {
                const item = e.target.closest('[data-style-name]');
                if (!item) return;
                const name = item.getAttribute('data-style-name');
                // 更新隐藏select
                const sel = document.getElementById('offline-style');
                if (sel) sel.value = name;
                // 更新显示文本
                const disp = document.getElementById('offline-style-display');
                if (disp) disp.textContent = name;
                // 更新描述
                offlineSettings.style = name;
                updateOfflineStyleDesc();
                overlay.remove();
            });
        };

        function openOfflineSettings() {
            // Dynamically rebuild the style select with custom styles
            const styleSelect = document.getElementById('offline-style');
            if (styleSelect) {
                styleSelect.innerHTML = '';
                const styles = offlineSettings.customStyles || [];
                styles.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.name;
                    opt.textContent = s.name;
                    styleSelect.appendChild(opt);
                });
            }
            document.getElementById('offline-min-words').value = offlineSettings.minWords;
            document.getElementById('offline-max-words').value = offlineSettings.maxWords;
            document.getElementById('offline-style').value = offlineSettings.style;
            // [FIX-文风选择过长] 同步更新显示文本
            const styleDisp = document.getElementById('offline-style-display');
            if (styleDisp) styleDisp.textContent = offlineSettings.style || '故事化';
            document.getElementById('offline-user-persp').value = offlineSettings.userPerspective || '第一人称';
            document.getElementById('offline-ai-persp').value = offlineSettings.aiPerspective || '第三人称';
            const grpReplyEl = document.getElementById('offline-group-reply-max');
            if (grpReplyEl) grpReplyEl.value = offlineSettings.groupReplyMax !== undefined ? offlineSettings.groupReplyMax : 3;
            
            // Populate user persona select
            const personaSelect = document.getElementById('offline-user-persona');
            if (personaSelect) {
                personaSelect.innerHTML = '<option value="">不绑定（使用聊天设置）</option>';
                (store.personas || []).forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id;
                    opt.textContent = p.name + (p.note ? ' (' + p.note + ')' : '');
                    personaSelect.appendChild(opt);
                });
                personaSelect.value = offlineSettings.userPersona || '';
            }

            // Set text align and line spacing
            const alignSelect = document.getElementById('offline-text-align');
            if (alignSelect) alignSelect.value = offlineSettings.textAlign || 'left';
            const spacingSelect = document.getElementById('offline-line-spacing');
            if (spacingSelect) spacingSelect.value = offlineSettings.lineSpacing || '1.6';

            // [FIX-线下时间感知] 恢复开关状态
            const _dtpChk = document.getElementById('offline-disable-time-perc');
            if (_dtpChk) _dtpChk.checked = !!offlineSettings.disableTimePerception;

            // Render style list with edit/delete
            renderOfflineStyleList();
            // Update style desc display
            updateOfflineStyleDesc();

            // [FIX-线下世界书] 更新世界书挂载数量显示
            const _offWbCountEl = document.getElementById('offline-wb-count');
            if (_offWbCountEl && offlineContactId) {
                const _offC = store.contacts.find(c => c.id === offlineContactId);
                if (_offC && _offC.settings) {
                    // [FIX-世界书数量] 只计算实际存在的世界书
                    const _existWbIds = (store.worldbooks || []).map(wb => String(wb.id));
                    const _wbCount = _offC.settings.mountedWbIds ? _offC.settings.mountedWbIds.filter(wid => _existWbIds.includes(String(wid))).length : (_offC.settings.wb && _existWbIds.includes(String(_offC.settings.wb)) ? 1 : 0);
                    _offWbCountEl.textContent = _wbCount + '个';
                } else {
                    _offWbCountEl.textContent = '0个';
                }
            }

            // [外语双语混排] 根据当前线下联系人是否为外国人，动态显示/隐藏翻译模式选项
            try {
                const _transRow = document.getElementById('offline-translate-mode-row');
                const _bilDispRow = document.getElementById('offline-bilingual-display-row');
                const _transHint = document.getElementById('offline-translate-mode-hint');
                const _offC2 = offlineContactId ? store.contacts.find(c => c.id === offlineContactId) : null;
                const _langInfo2 = _offC2 && typeof detectContactLanguage === 'function' ? detectContactLanguage(_offC2) : null;
                const _isForeignC = !!(_langInfo2 && _langInfo2.isForeign);
                if (_transRow) _transRow.style.display = _isForeignC ? 'flex' : 'none';
                const _transModeEl = document.getElementById('offline-translate-mode');
                if (_transModeEl) _transModeEl.value = offlineSettings.translateMode || 'legacy';
                const _bilDispEl = document.getElementById('offline-bilingual-display');
                if (_bilDispEl) _bilDispEl.value = offlineSettings.bilingualDisplay || 'always';
                // 只有"外国人 + 新版"时才显示"对话译文显示"行
                if (_bilDispRow) {
                    _bilDispRow.style.display = (_isForeignC && (offlineSettings.translateMode === 'bilingual')) ? 'flex' : 'none';
                }
                if (_transHint && _isForeignC) {
                    _transHint.textContent = '当前联系人语言：' + (_langInfo2.langName || '外语') + '。旧版=AI全文外语+点击整段翻译；新版=中文叙事+外语对话/心声+内联翻译。';
                }
            } catch(_e) { /* ignore */ }

            // [NEW-默认线下开关] 读取当前联系人的 defaultOffline 状态
            const _defaultModeToggle = document.getElementById('offline-default-mode-toggle');
            if (_defaultModeToggle && offlineContactId) {
                const _offC3 = store.contacts.find(c => c.id === offlineContactId);
                _defaultModeToggle.checked = !!(_offC3 && _offC3.settings && _offC3.settings.defaultOffline);
            }

            // [文风折叠] 应用折叠状态
            try { _applyOfflineStylePanelState(); } catch(_e){}
            document.getElementById('modal-offline-settings').classList.add('show');
        }

        // [外语双语混排] 翻译模式下拉变化时，联动显示"对话译文显示"行
        window.onOfflineTranslateModeChange = function() {
            const sel = document.getElementById('offline-translate-mode');
            const row = document.getElementById('offline-bilingual-display-row');
            if (!sel || !row) return;
            row.style.display = (sel.value === 'bilingual') ? 'flex' : 'none';
        };

        function updateOfflineStyleDesc() {
            const descEl = document.getElementById('offline-style-desc');
            if (!descEl) return;
            const styleName = document.getElementById('offline-style')?.value || offlineSettings.style;
            const styles = offlineSettings.customStyles || [];
            const styleObj = styles.find(s => s.name === styleName);
            descEl.textContent = styleObj ? (styleObj.desc || '无描述') : '无描述';
        }

        function addCustomOfflineStyle() {
            const nameInput = document.getElementById('offline-custom-style-name');
            const descInput = document.getElementById('offline-custom-style-desc');
            const name = nameInput.value.trim();
            const desc = descInput.value.trim();
            if (!name) return toast('请输入文风名称');
            if (!desc) return toast('请输入文风描述');
            if (!offlineSettings.customStyles) offlineSettings.customStyles = [];
            if (offlineSettings.customStyles.find(s => s.name === name)) return toast('该文风已存在');
            offlineSettings.customStyles.push({name, desc});
            _saveOfflineSettings();
            // Refresh select
            const sel = document.getElementById('offline-style');
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            sel.appendChild(opt);
            sel.value = name;
            nameInput.value = '';
            descInput.value = '';
            updateOfflineStyleDesc();
            toast('已添加文风: ' + name);
            renderOfflineStyleList();
        }

        function renderOfflineStyleList() {
            const container = document.getElementById('offline-style-list');
            if (!container) return;
            const styles = offlineSettings.customStyles || [];
            if (styles.length === 0) {
                container.innerHTML = '<div style="font-size:12px; color:#aaa; text-align:center; padding:8px;">暂无自定义文风</div>';
                return;
            }
            container.innerHTML = '';
            styles.forEach((s, i) => {
                const item = document.createElement('div');
                item.className = 'settings-style-item';
                item.id = 'offline-style-item-' + i;
                item.innerHTML = `
                    <div class="ssi-info">
                        <div class="ssi-name">${s.name}</div>
                        <div class="ssi-desc">${s.desc || '无描述'}</div>
                    </div>
                    <div class="ssi-actions">
                        <button onclick="editOfflineStyle(${i})" title="编辑"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button class="del" onclick="deleteOfflineStyle(${i})" title="删除"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                `;
                container.appendChild(item);
            });
        }

        function editOfflineStyle(index) {
            const styles = offlineSettings.customStyles || [];
            if (!styles[index]) return;
            const s = styles[index];
            const item = document.getElementById('offline-style-item-' + index);
            if (!item) return;
            item.innerHTML = `
                <div style="flex:1; min-width:0;">
                    <input id="edit-style-name-${index}" value="${s.name}" style="width:100%;padding:8px 12px;border:1px solid #e0e0e0;border-radius:12px;margin-bottom:6px;font-size:13px;background:#fafafa;">
                    <textarea id="edit-style-desc-${index}" style="width:100%;padding:8px 12px;border:1px solid #e0e0e0;border-radius:12px;min-height:48px;font-size:12px;resize:vertical;font-family:inherit;background:#fafafa;">${s.desc || ''}</textarea>
                    <div style="display:flex; gap:8px; margin-top:6px;">
                        <button onclick="saveEditOfflineStyle(${index})" style="padding:7px 16px;border:none;background:#1a1a1a;color:#fff;border-radius:16px;font-size:12px;cursor:pointer;">保存</button>
                        <button onclick="renderOfflineStyleList()" style="padding:7px 16px;border:1px solid #ddd;background:#fff;color:#333;border-radius:16px;font-size:12px;cursor:pointer;">取消</button>
                    </div>
                </div>
            `;
        }

        function saveEditOfflineStyle(index) {
            const styles = offlineSettings.customStyles || [];
            if (!styles[index]) return;
            const oldName = styles[index].name;
            const newName = document.getElementById('edit-style-name-' + index).value.trim();
            const newDesc = document.getElementById('edit-style-desc-' + index).value.trim();
            if (!newName) return toast('文风名称不能为空');
            // Check duplicate name (excluding self)
            if (styles.some((s, i) => i !== index && s.name === newName)) return toast('该文风名称已存在');
            styles[index].name = newName;
            styles[index].desc = newDesc;
            // If current selected style was the old name, update it
            if (offlineSettings.style === oldName) offlineSettings.style = newName;
            _saveOfflineSettings();
            // Refresh select and list
            openOfflineSettings();
            toast('文风已更新');
        }

        function deleteOfflineStyle(index) {
            const styles = offlineSettings.customStyles || [];
            if (!styles[index]) return;
            const name = styles[index].name;
            showConfirm('删除文风', `确定要删除文风"${name}"吗？`, () => {
                styles.splice(index, 1);
                // If deleted style was selected, reset to first available
                if (offlineSettings.style === name) {
                    offlineSettings.style = styles.length > 0 ? styles[0].name : '故事化';
                }
                _saveOfflineSettings();
                openOfflineSettings();
                toast('已删除文风: ' + name);
            });
        }

        function saveOfflineSettings() {
            offlineSettings.minWords = parseInt(document.getElementById('offline-min-words').value) || 300;
            offlineSettings.maxWords = parseInt(document.getElementById('offline-max-words').value) || 1000;
            offlineSettings.style = document.getElementById('offline-style').value;
            offlineSettings.userPerspective = document.getElementById('offline-user-persp').value;
            offlineSettings.aiPerspective = document.getElementById('offline-ai-persp').value;
            offlineSettings.userPersona = document.getElementById('offline-user-persona')?.value || '';
            offlineSettings.textAlign = document.getElementById('offline-text-align')?.value || 'left';
            offlineSettings.lineSpacing = document.getElementById('offline-line-spacing')?.value || '1.6';
            const grpReplyEl = document.getElementById('offline-group-reply-max');
            if (grpReplyEl) offlineSettings.groupReplyMax = parseInt(grpReplyEl.value) || 0;
            // [外语双语混排] 保存翻译模式和显示方式
            const transModeEl = document.getElementById('offline-translate-mode');
            if (transModeEl) offlineSettings.translateMode = transModeEl.value || 'legacy';
            const bilDispEl = document.getElementById('offline-bilingual-display');
            if (bilDispEl) offlineSettings.bilingualDisplay = bilDispEl.value || 'always';
            // [FIX-线下时间感知] 保存线下时间感知开关
            const _dtpChk = document.getElementById('offline-disable-time-perc');
            if (_dtpChk) offlineSettings.disableTimePerception = _dtpChk.checked;
            // [NEW-默认线下开关] 保存默认线下模式设置到联系人的 settings 中
            const _defaultModeToggle = document.getElementById('offline-default-mode-toggle');
            if (_defaultModeToggle && offlineContactId) {
                const _offContact = store.contacts.find(c => c.id === offlineContactId);
                if (_offContact) {
                    if (!_offContact.settings) _offContact.settings = {};
                    _offContact.settings.defaultOffline = _defaultModeToggle.checked;
                }
            }
            _saveOfflineSettings();
            document.getElementById('modal-offline-settings').classList.remove('show');
            toast('设置已保存');
            renderOfflineChat();
        }

        // ===== [外语双语混排] 辅助函数 =====
        // 检测当前线下联系人是否为外国人 + 是否启用双语混排模式
        function _isOfflineBilingualActive(contact) {
            if (!contact) return false;
            if (offlineSettings.translateMode !== 'bilingual') return false;
            if (typeof detectContactLanguage !== 'function') return false;
            var info = detectContactLanguage(contact);
            return !!(info && info.isForeign);
        }

        // 获取某联系人线下双语语言信息（供 prompt 构造使用）
        function _getOfflineLangInfo(contact) {
            if (typeof detectContactLanguage !== 'function') {
                return { lang:'zh', langName:'中文', langNameEn:'Chinese', isForeign:false, locale:'CN' };
            }
            return detectContactLanguage(contact) || { lang:'zh', langName:'中文', langNameEn:'Chinese', isForeign:false, locale:'CN' };
        }

        // HTML转义（用于 DL/HT 标签内文本）
        function _escHtmlDL(s) {
            if (s == null) return '';
            return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }

        // 解析 [DL:xxx] 对话翻译标签 和 [HT:xxx] 心声翻译标签
        // mode: 'always' / 'hidden' / 'off'
        // 注意：此函数输入是"已经 HTML 转义过"的文本（已替换 < > 等），所以这里只替换 [DL:] / [HT:] 标签本身
        function processOfflineBilingualContent(html, mode) {
            if (!html) return '';
            mode = mode || 'always';
            // 处理心声翻译 [HT:xxx]（心声通常整段独立）
            if (mode === 'off') {
                html = html.replace(/\[HT:([\s\S]*?)\]/g, '');
            } else {
                html = html.replace(/\[HT:([\s\S]*?)\]/g, function(_m, p1){
                    return '<span class="ol-ht-trans">（' + p1.trim() + '）</span>';
                });
            }
            // 处理对话翻译 [DL:xxx]
            if (mode === 'off') {
                html = html.replace(/\[DL:([\s\S]*?)\]/g, '');
            } else if (mode === 'hidden') {
                html = html.replace(/\[DL:([\s\S]*?)\]/g, function(_m, p1){
                    var t = p1.trim();
                    // 默认隐藏，点击 💬 显示
                    return '<span class="ol-dl-btn" onclick="event.stopPropagation();var t=this.nextElementSibling;if(t)t.classList.toggle(\'show\');" title="显示/隐藏翻译">💬</span>' +
                           '<span class="ol-dl-trans hide">（' + t + '）</span>';
                });
            } else {
                // always
                html = html.replace(/\[DL:([\s\S]*?)\]/g, function(_m, p1){
                    return '<span class="ol-dl-trans">（' + p1.trim() + '）</span>';
                });
            }
            return html;
        }

        // 暴露到 window 便于其他文件（如 app-part1.js 的嵌入式渲染）调用
        window.processOfflineBilingualContent = processOfflineBilingualContent;
        window._isOfflineBilingualActive = _isOfflineBilingualActive;
        window._getOfflineLangInfo = _getOfflineLangInfo;

        // [FIX-线下世界书] 从线下模式设置中打开世界书选择器
        function openWorldBookSelectorFromOffline() {
            const targetId = offlineContactId || activeChatId;
            if (!targetId) return toast('请先进入线下模式');
            // 确保 activeChatId 指向当前线下联系人，以便 openWorldBookSelector/saveChatWBSelection 正确工作
            activeChatId = targetId;
            // 关闭线下设置弹窗，打开世界书选择器
            document.getElementById('modal-offline-settings').classList.remove('show');
            openWorldBookSelector();
        }

        function getOfflineStyleDesc() {
            const styleName = offlineSettings.style || '故事化';
            const styles = offlineSettings.customStyles || [];
            const styleObj = styles.find(s => s.name === styleName);
            return styleObj ? styleObj.desc : `按照"${styleName}"的风格来写作。`;
        }
        
        function renderOfflineChat() {
            const historyContainer = document.getElementById('offline-chat-history');
            if (!historyContainer) return;
            // [FIX-线下闪烁] 使用DocumentFragment双缓冲，避免先清空再逐个添加导致的闪烁
            const fragment = document.createDocumentFragment();
            const chatHistory = (store.offlineChats && store.offlineChats[offlineContactId]) ? store.offlineChats[offlineContactId] : [];

            // [FIX-线下模式人设] 优先使用线下设置绑定的人设，否则回退到聊天设置
            const _offlineContact = store.contacts.find(c => c.id === offlineContactId);
            const _offlinePersonaId = offlineSettings.userPersona;
            const _offlinePersona = _offlinePersonaId ? store.personas.find(p => p.id === _offlinePersonaId) : null;
            const _offlineUserName = _offlinePersona ? _offlinePersona.name : getUserPersonaName(_offlineContact, store.user.name || '用户');
            const _offlineAiName = _offlineContact ? _offlineContact.name : (offlineSettings.aiName || '对方');
            const _offlineAiAvatar = _offlineContact ? _getContactAvatar(_offlineContact) : offlineSettings.aiAvatar;

            const _isGroup = _offlineContact && _offlineContact.isGroup;

            // [FIX-线下模式人设头像] 优先使用群专属头像 → 线下设置/聊天设置绑定的人设头像 → 微信头像
            let _offlineUserAvatar;
            if (_isGroup && _offlineContact && _offlineContact.groupAvatars && _offlineContact.groupAvatars['__user__']) {
                _offlineUserAvatar = _offlineContact.groupAvatars['__user__'];
            } else if (_offlinePersona && _offlinePersona.avatar) {
                _offlineUserAvatar = _offlinePersona.avatar;
            } else {
                _offlineUserAvatar = getUserPersonaAvatar(_offlineContact, store.user.avatar || `https://ui-avatars.com/api/?name=${(_offlineUserName||'U')[0]}`);
            }

            chatHistory.forEach((msg, index) => {
                const isUser = msg.sender === 'user';
                const now = new Date(msg.time);
                const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
                // 楼层号（从1开始）
                const floorNum = index + 1;
                
                // 群聊线下：AI回复可能带有成员归属 [memberName]
                let senderName, senderAvatar;
                if (isUser) {
                    senderName = _offlineUserName;
                    // [FIX] 使用人设头像，不使用 store.user.avatar（微信头像）
                    senderAvatar = _offlineUserAvatar;
                } else if (_isGroup && msg.memberName) {
                    senderName = msg.memberName;
                    const member = offlineGroupMembers.find(m => m.name === msg.memberName);
                    senderAvatar = member ? member.avatar : _offlineAiAvatar;
                } else {
                    senderName = _offlineAiName;
                    senderAvatar = _offlineAiAvatar;
                }

                // Process Content for Layout Rules & Highlights
                // 渲染时清理可能残留的HEART/HEARTBEAT标签
                let processedContent = _stripHeartTags(msg.content || '');
                const len = processedContent.length;
                let bodyClass = 'offline-msg-body';
                
                if (len < 30) {
                    bodyClass += ' short-text';
                } else if (len > 100) {
                    bodyClass += ' offline-long-text';
                    // [FIX] 仅在用户未设置对齐方式或设置为center时才居中首行，否则尊重用户设置
                    const userAlign = offlineSettings.textAlign || 'left';
                    if (userAlign === 'center') {
                        const lines = processedContent.split('\n');
                        if(lines.length > 0) {
                            lines[0] = `<div style="text-align:center; margin-bottom:10px;">${lines[0]}</div>`;
                            processedContent = lines.join('\n');
                        }
                    }
                }
                
                // Highlight important parts (Basic heuristic: Text inside 【】 or ** **)
                processedContent = processedContent
                    .replace(/【(.*?)】/g, '<span class="offline-highlight">$1</span>')
                    .replace(/\*\*(.*?)\*\*/g, '<span class="offline-highlight">$1</span>');

                // [外语双语混排] 若启用 bilingual 模式，解析 [DL:]/[HT:] 内联翻译标签
                // 否则（legacy 模式或中文联系人）清理掉误生成的标签，保留纯外语/中文内容
                var _offBilingualActive = false;
                try {
                    if (typeof _isOfflineBilingualActive === 'function' && _offlineContact) {
                        _offBilingualActive = _isOfflineBilingualActive(_offlineContact);
                    }
                } catch(_e) { _offBilingualActive = false; }
                if (_offBilingualActive && typeof processOfflineBilingualContent === 'function') {
                    processedContent = processOfflineBilingualContent(processedContent, offlineSettings.bilingualDisplay || 'always');
                } else {
                    // 旧版模式下清掉 [DL:]/[HT:] 残留标签（不影响整段翻译按钮功能）
                    processedContent = processedContent
                        .replace(/\[DL:[\s\S]*?\]/g, '')
                        .replace(/\[HT:[\s\S]*?\]/g, '');
                }

                // 黑白二次元便签：用户/AI略有区分
                const noteColorClass = isUser ? 'offline-note-user' : 'offline-note-ai';

                const box = document.createElement('div');
                box.className = `offline-msg-box ${noteColorClass}${_offlineBatchMode && _offlineBatchSelected.has(index) ? ' offline-batch-selected' : ''}`;
                box.setAttribute('data-idx', index);
                // 第一楼额外增加顶部 margin，避免和顶部栏重叠
                if (index === 0) {
                    box.style.marginTop = '40px';
                }
                // 多选模式：点击卡片切换选中
                if (_offlineBatchMode) {
                    box.style.cursor = 'pointer';
                    box.addEventListener('click', function(e) {
                        // 不拦截编辑区域内的点击
                        if (e.target.closest('.offline-edit-textarea') || e.target.closest('.offline-more-menu')) return;
                        e.preventDefault();
                        e.stopPropagation();
                        toggleOfflineBatchItem(index);
                    });
                }
                const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent((senderName||'?')[0])}&background=cccccc&color=333&size=64`;
                const _batchChecked = _offlineBatchMode && _offlineBatchSelected.has(index);
                box.innerHTML = `
                    ${_offlineBatchMode ? `<div class="offline-batch-checkbox ${_batchChecked ? 'checked' : ''}"><i class="fas ${_batchChecked ? 'fa-check-circle' : 'fa-circle'}"></i></div>` : ''}
                    <!-- 左上角楼层标签 -->
                    <div class="offline-floor-badge">B${floorNum}</div>
                    <!-- 头像：绝对定位，从方框顶部中心横切溢出 -->
                    <div class="offline-note-avatar-wrap">
                        <img src="${senderAvatar}" class="offline-note-avatar" onerror="this.src='${fallbackAvatar}'">
                    </div>
                    <!-- 名字 + 时间（头像正下方，居中） -->
                    <div class="offline-note-top-bar">
                        <div class="offline-note-meta">
                            <span class="offline-note-name">${senderName}</span>
                            <span class="offline-note-time">${timeStr}</span>
                        </div>
                    </div>
                    <!-- 虚线分隔 -->
                    <hr class="offline-note-divider">
                    <!-- 正文 -->
                    <div class="${bodyClass}${msg._pending ? ' offline-msg-pending' : ''}" id="offline-msg-body-${index}" style="text-align:${offlineSettings.textAlign || 'left'}; line-height:${offlineSettings.lineSpacing || '1.8'};">
                        <div class="offline-translate-original">${msg._pending ? '<span class="offline-typing-inline">正在输入<span class="offline-typing-dots"><span></span><span></span><span></span></span></span>' : (msg.type === 'image' ? `<img src="${msg.content}" style="max-width:100%;border-radius:8px;cursor:pointer;" onclick="window.open(this.src)">${msg.text ? '<div style="margin-top:8px;">' + msg.text.replace(/\n/g,'<br>') + '</div>' : ''}` : processedContent.replace(/\n/g, '<br>'))}</div>
                        <div class="offline-translate-result"></div>
                        ${(!_offBilingualActive && typeof shouldShowTranslateBtn === 'function' && shouldShowTranslateBtn(msg.content)) ? `<div class="offline-translate-tabs">
                            <div class="offline-translate-tab active" id="off-tab-orig-${index}" onclick="toggleOfflinePageTranslation(${index},'original')">원문</div>
                            <div class="offline-translate-tab" id="off-tab-trans-${index}" onclick="toggleOfflinePageTranslation(${index},'translated')">번역</div>
                        </div>` : ''}
                    </div>
                    <!-- [OPT-撤销重回] AI消息版本指示（仅在有历史版本时显示） -->
                    ${(!isUser && Array.isArray(msg.history) && msg.history.length > 0) ? (() => {
                        const _curIdx = msg.historyIndex || 0;
                        const _total = msg.history.length + (_curIdx === 0 ? 1 : (msg.history[0] && msg.history[0]._isLive ? 0 : 1));
                        const _shownNo = _total - _curIdx; // 最新=total，往旧递减
                        return `<div class="offline-version-badge" title="第 ${_shownNo}/${_total} 版（共 ${msg.history.length} 个历史版本）">v${_shownNo}/${_total}</div>`;
                    })() : ''}
                    <!-- 更多按钮（多选模式下隐藏） -->
                    ${!_offlineBatchMode ? `<button class="offline-more-btn" onclick="toggleOfflineMoreMenu(this, ${index})" title="更多">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="offline-more-menu" style="display:none;">
                        <div class="offline-more-item" onclick="editOfflineMessage(${index}); this.closest('.offline-more-menu').style.display='none'"><i class="fas fa-edit"></i> 编辑</div>
                        ${(!isUser && Array.isArray(msg.history) && msg.history.length > 0 && (msg.historyIndex || 0) < msg.history.length) ? `<div class="offline-more-item" onclick="rollbackOfflineMessage(${index}); this.closest('.offline-more-menu').style.display='none'"><i class="fas fa-undo"></i> 上一版本 ${msg.history.length > 1 ? '（还有'+(msg.history.length - (msg.historyIndex||0))+'版可回退）' : ''}</div>` : ''}
                        ${(!isUser && Array.isArray(msg.history) && msg.history.length > 0 && (msg.historyIndex || 0) > 0) ? `<div class="offline-more-item" onclick="forwardOfflineMessage(${index}); this.closest('.offline-more-menu').style.display='none'"><i class="fas fa-redo"></i> 下一版本</div>` : ''}
                        <div class="offline-more-item offline-more-delete" onclick="deleteOfflineMessage(${index})"><i class="fas fa-trash"></i> 删除</div>
                    </div>` : ''}
                `;
                fragment.appendChild(box);
            });

            // [FIX-线下闪烁] 一次性替换所有内容，避免清空-重建过程中的闪烁
            // [FIX-线下键盘跳B1-v7] 在 DOM 重建前保存 scrollTop，
            // iOS 键盘打开时 replaceChildren 会导致 scrollTop 归零 → 跳到B1。
            const scrollContainer = historyContainer.parentElement;
            const _savedScrollBeforeRender = scrollContainer ? scrollContainer.scrollTop : 0;
            const _isKbOpen = document.documentElement.classList.contains('keyboard-active');

            if (historyContainer.replaceChildren) {
                historyContainer.replaceChildren(fragment);
            } else {
                historyContainer.innerHTML = '';
                historyContainer.appendChild(fragment);
            }

            // Scroll the parent .offline-scroll-container (which has overflow-y: auto)
            if (scrollContainer) {
                if (_isKbOpen) {
                    // [FIX-线下键盘跳B1-v7] 键盘打开时恢复之前的滚动位置，
                    // 而不是滚到底部。DOM重建会重置scrollTop，需要立即恢复。
                    scrollContainer.scrollTop = _savedScrollBeforeRender;
                    requestAnimationFrame(() => {
                        scrollContainer.scrollTop = _savedScrollBeforeRender;
                    });
                } else {
                    requestAnimationFrame(() => {
                        scrollContainer.scrollTop = scrollContainer.scrollHeight;
                    });
                }
            }
        }

        // 群聊线下模式：成员状态数组 [{id, name, avatar, hr}]
        let offlineGroupMembers = [];

        // ===== 群聊私聊界面线下模式 - 增强状态 =====
        let groupOfflineInvited = []; // 被邀请参与线下的成员ID列表
        let groupOfflineTurnCount = 0; // 当前轮次计数
        let groupOfflineQuoteRef = null; // 当前引用 {idx, senderName, text}

        // 弹出群聊成员状态弹窗
        function showGroupMemberPopup() {
            const listEl = document.getElementById('group-member-popup-list');
            if (!listEl) return;
            listEl.innerHTML = '';
            
            // 用户自己
            const userAvatar = store.user.avatar || _ph(50);
            const userName = store.user.name || '我';
            const userHR = 70 + Math.floor(Math.random() * 20);
            listEl.innerHTML += `
                <div class="group-member-popup-item">
                    <img src="${userAvatar}" alt="${userName}">
                    <div class="group-member-popup-info">
                        <div class="group-member-popup-name">${userName}（我）</div>
                        <div class="group-member-popup-stats">
                            <span><i class="fas fa-heartbeat"></i> ${userHR} bpm</span>
                            <span><i class="fas fa-map-marker-alt"></i> 当前位置</span>
                        </div>
                    </div>
                </div>
            `;
            
            // 群聊成员
            offlineGroupMembers.forEach(m => {
                const dist = Math.floor(Math.random() * 15) + 1;
                listEl.innerHTML += `
                    <div class="group-member-popup-item">
                        <img src="${m.avatar}" alt="${m.name}">
                        <div class="group-member-popup-info">
                            <div class="group-member-popup-name">${m.name}</div>
                            <div class="group-member-popup-stats">
                                <span><i class="fas fa-heartbeat"></i> ${m.hr} bpm</span>
                                <span><i class="fas fa-map-marker-alt"></i> ${dist}米</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            document.getElementById('modal-group-member-status').style.display = 'flex';
        }

        // Offline Simulation Logic (Heart Rate & Distance)
        let offlineSimInterval = null;
        let isSimulatingInChat = false;
        
        function startOfflineSimulation(inChat) {
            isSimulatingInChat = inChat;
            if(offlineSimInterval) clearInterval(offlineSimInterval);
            
            // Initial update
            updateOfflineSim();
            
            offlineSimInterval = setInterval(() => {
                updateOfflineSim();
            }, 3000); // Only update heart rate regularly
        }
        
        function stopOfflineSimulation() {
            if(offlineSimInterval) clearInterval(offlineSimInterval);
        }
        
        function updateOfflineSim() {
            const prefix = isSimulatingInChat ? 'chat-offline-' : 'offline-';
            
            // 统一更新顶部栏的用户心率
            const userHR = 70 + Math.floor(Math.random() * 20);
            const uHrEl = document.getElementById(prefix + 'user-hr');
            if(uHrEl) uHrEl.innerText = userHR;
            
            if (offlineGroupMembers.length > 0) {
                // 群聊模式：更新成员内部心率数据（弹窗用），顶部栏显示平均心率
                offlineGroupMembers.forEach(m => {
                    m.hr = 68 + Math.floor(Math.random() * 25);
                });
                const avgHR = Math.round(offlineGroupMembers.reduce((s, m) => s + m.hr, 0) / offlineGroupMembers.length);
                const aHrEl = document.getElementById(prefix + 'ai-hr');
                if(aHrEl) aHrEl.innerText = avgHR;
            } else {
                // 私聊模式：对方心率
                const aiHR = 72 + Math.floor(Math.random() * 20);
                const aHrEl = document.getElementById(prefix + 'ai-hr');
                if(aHrEl) aHrEl.innerText = aiHR;
            }
        }

        // ===== 线下模式图片暂存 =====
        let _offlinePendingImage = null; // 暂存待发送的图片dataURL

        function sendOfflineMessage() {
            const input = document.getElementById('offline-chat-input');
            const text = input.value.trim();
            const pendingImg = _offlinePendingImage;
            if (!text && !pendingImg) return; // 文字和图片都没有则不发送
            if (!offlineContactId) return;

            if (!store.offlineChats) store.offlineChats = {};
            if (!store.offlineChats[offlineContactId]) store.offlineChats[offlineContactId] = [];

            if (pendingImg) {
                // 有图片：发送图片消息（可能附带文字）
                store.offlineChats[offlineContactId].push({
                    sender: 'user',
                    type: 'image',
                    content: pendingImg,
                    text: text || '',
                    time: Date.now()
                });
                _offlinePendingImage = null;
                _hideOfflineImagePreview();
            } else {
                // 纯文字消息
                store.offlineChats[offlineContactId].push({ sender: 'user', content: text, time: Date.now() });
            }
            save();
            renderOfflineChat();
            input.value = '';
            // 重置textarea高度
            input.style.height = 'auto';
            input.style.height = '36px';
            // 不再自动触发AI回复，需用户点击"生成"按钮
        }

        // ===== 线下模式输入框自适应高度 =====
        // [FIX-线下打字跳顶v2] 避免height:auto触发reflow，改用overflow:hidden+scrollHeight测量
        // 增加用户滚动保护：用户主动滚动200ms内不强制恢复位置
        var _offlineUserScrolling = false;
        var _offlineScrollTimer = null;
        (function() {
            var sc = document.querySelector('#layer-offline-mode .offline-scroll-container');
            if (sc) {
                sc.addEventListener('scroll', function() {
                    _offlineUserScrolling = true;
                    clearTimeout(_offlineScrollTimer);
                    _offlineScrollTimer = setTimeout(function() { _offlineUserScrolling = false; }, 200);
                }, { passive: true });
            }
            // 延迟绑定（layer可能还没渲染）
            setTimeout(function() {
                var sc2 = document.querySelector('#layer-offline-mode .offline-scroll-container');
                if (sc2 && !sc2._offlineScrollBound) {
                    sc2._offlineScrollBound = true;
                    sc2.addEventListener('scroll', function() {
                        _offlineUserScrolling = true;
                        clearTimeout(_offlineScrollTimer);
                        _offlineScrollTimer = setTimeout(function() { _offlineUserScrolling = false; }, 200);
                    }, { passive: true });
                }
            }, 2000);
        })();

        window.autoResizeOfflineInput = function(el) {
            // [FIX-线下打字跳顶v7] 同时支持独立页面和嵌入式线下模式的scroll container
            var scrollContainer = document.querySelector('#layer-offline-mode.show .offline-scroll-container')
                || document.querySelector('#chat-history .offline-scroll-container');
            // [FIX-线下打字跳顶v7] 使用 device-adapter.js 的全局快照作为 fallback
            // iOS Safari 在 input 事件触发时可能已经 re-layout 导致 scrollTop 被重置为0
            var currentScroll = scrollContainer ? scrollContainer.scrollTop : 0;
            var globalSnapshot = (typeof _offlineScrollSnapshot !== 'undefined') ? _offlineScrollSnapshot : 0;
            var savedScroll = Math.max(currentScroll, globalSnapshot);
            // 更新全局快照（如果当前值更可靠）
            if (currentScroll > 0 && typeof _offlineScrollSnapshot !== 'undefined') {
                _offlineScrollSnapshot = currentScroll;
            }
            
            // [FIX-线下打字跳顶v7] 设置 overflow-anchor:none 防止浏览器自动调整滚动位置
            if (scrollContainer && !scrollContainer._offAnchorSet) {
                scrollContainer.style.setProperty('overflow-anchor', 'none');
                scrollContainer._offAnchorSet = true;
            }
            
            // [FIX-线下打字跳顶v6] 完全避免 height:1px 的 reflow 导致 iOS scroll 跳顶
            // 新策略：只在内容确实变化时才重新测量，使用 scrollHeight 与当前 height 比较
            var maxH = 120; // 最多约5行
            var currentH = parseInt(el.style.height) || 36;
            
            // 先不改 height，直接检查 scrollHeight 是否溢出或缩小
            el.style.overflowY = 'hidden';
            var needsGrow = el.scrollHeight > currentH;
            var needsShrink = el.value === '' || (el.scrollHeight < currentH && currentH > 36);
            
            if (needsGrow || needsShrink) {
                // 只在确实需要调整时才测量（最小化 reflow 次数）
                // [FIX-iOS跳顶v6] 使用 prevHeight 而非 1px 来锚定测量基准
                // 这样 iOS 的 layout shift 幅度远小于从 1px 开始
                if (needsShrink) {
                    // 缩小时需要先重置到最小值才能获取真实 scrollHeight
                    el.style.height = '36px';
                }
                var naturalH = el.scrollHeight;
                var newH = Math.max(36, Math.min(naturalH, maxH));
                el.style.height = newH + 'px';
                el.style.overflowY = naturalH > maxH ? 'auto' : 'hidden';
            }
            
            // [FIX-线下打字跳顶v7] 恢复滚动位置，但尊重用户主动滚动
            // 四重保护：同步 + rAF + 50ms + 150ms，覆盖 iOS 异步 reflow 的整个时间窗口
            if (!_offlineUserScrolling && scrollContainer && savedScroll > 0) {
                var _restoreScroll = function() {
                    if (!scrollContainer) return;
                    // 判断是否在底部附近，如果是则滚到底
                    var atBottom = (scrollContainer.scrollHeight - savedScroll - scrollContainer.clientHeight) < 80;
                    if (atBottom) {
                        scrollContainer.scrollTop = scrollContainer.scrollHeight;
                    } else if (Math.abs(scrollContainer.scrollTop - savedScroll) > 2) {
                        scrollContainer.scrollTop = savedScroll;
                    }
                };
                _restoreScroll();
                requestAnimationFrame(_restoreScroll);
                setTimeout(_restoreScroll, 50);
                setTimeout(_restoreScroll, 150);
            }
        };

        // ===== 线下模式图片预览管理 =====
        function _showOfflineImagePreview(imgUrl) {
            _offlinePendingImage = imgUrl;
            let preview = document.getElementById('offline-img-preview');
            if (!preview) {
                preview = document.createElement('div');
                preview.id = 'offline-img-preview';
                preview.style.cssText = 'padding:6px 12px;background:rgba(255,255,255,0.95);border-top:1px solid #eee;display:flex;align-items:center;gap:8px;';
                const inputBar = document.getElementById('offline-input-bar');
                if (inputBar) inputBar.parentNode.insertBefore(preview, inputBar);
            }
            preview.innerHTML = `<img src="${imgUrl}" style="max-height:60px;max-width:80px;border-radius:6px;object-fit:cover;">
                <span style="flex:1;font-size:12px;color:#888;">图片已选择，可继续输入文字</span>
                <button onclick="_cancelOfflineImage()" style="background:none;border:none;color:#ff4444;font-size:16px;cursor:pointer;padding:4px;"><i class="fas fa-times-circle"></i></button>`;
            preview.style.display = 'flex';
        }

        function _hideOfflineImagePreview() {
            const preview = document.getElementById('offline-img-preview');
            if (preview) preview.style.display = 'none';
        }

        function _cancelOfflineImage() {
            _offlinePendingImage = null;
            _hideOfflineImagePreview();
        }
        window._cancelOfflineImage = _cancelOfflineImage;

        // [OPT-撤销重回] 暴露版本切换函数给 HTML onclick 调用
        // 注：本文件整体非严格模式下 function 声明已挂全局，此处显式挂 window 保证健壮性
        if (typeof rollbackOfflineMessage === 'function') window.rollbackOfflineMessage = rollbackOfflineMessage;
        if (typeof forwardOfflineMessage === 'function') window.forwardOfflineMessage = forwardOfflineMessage;

        // ===== 线下模式工具栏切换 =====
        function toggleOfflineToolbar() {
            var tb = document.getElementById('offline-toolbar');
            if (!tb) return;
            tb.style.display = tb.style.display === 'none' ? 'flex' : 'none';
        }

        // ===== 线下模式发送图片 =====
        function offlineSendImage(mode) {
            if (!offlineContactId) return toast('请先进入线下模式');
            // 关闭工具栏
            var tb = document.getElementById('offline-toolbar');
            if (tb) tb.style.display = 'none';

            if (mode === 'describe') {
                // 描述图片：弹出输入框让用户描述要发的图片
                openCustomInput('image-fake');
            } else if (mode === 'upload') {
                // 上传照片：调用拍照/选图（预览模式，不直接发送）
                uploadImg('offline-photo');
            }
        }

        // [JS适配] 线下/聊天输入框键盘处理已迁移至 device-adapter.js
        // device-adapter.js 统一处理: 输入栏fixed定位、键盘高度计算、focus/blur管理

        // [OPT] 统一的isGenerating锁检查（含超时保护），避免每个函数重复写
        // [FIX-线下并发重复v2] 锁超时与后端一致(310s > 后端300s)，同时通过 _offlineInflight 做请求级去重
        // 这样即使前端锁因异常被提前释放，也不会产生并发请求，避免"第二次点击把两次回复都生成"
        function _checkAndAcquireGenLock() {
            // 优先检查 in-flight 请求（请求级互斥，比布尔锁可靠）
            if (window._offlineInflight && window._offlineInflight.promise) {
                toast('正在生成中，请稍候...', 'info');
                return false;
            }
            if (isGenerating) {
                // [MOD] 不做超时限制，锁住就等待
                toast('正在思考中，请稍候...', 'info');
                return false;
            }
            isGenerating = true;
            window._offlineGenLockTime = Date.now();
            return true;
        }

        // [FIX-线下并发重复v2] 统一的 in-flight 请求管理器：
        // - 同一联系人同一时刻只允许一个 getOfflineTextFromAI 在飞
        // - 305s 前端硬超时（略大于后端 300s）主动中断，避免 Cloudflare 524 后请求挂起
        // - 完成后无论成败都清理，防止永久锁死
        function _runOfflineInflight(contactId, invoker) {
            if (window._offlineInflight && window._offlineInflight.promise) {
                // 同联系人并发直接复用正在飞的 Promise，不再发第二次请求
                if (window._offlineInflight.contactId === contactId) {
                    return window._offlineInflight.promise;
                }
                // 不同联系人理论上也不应并发（同一时刻只允许一个线下生成）
                return Promise.reject(new Error('已有其他联系人的线下生成在进行中'));
            }
            const startedAt = Date.now();
            // [MOD] 不做超时限制，让请求自然等待
            const innerPromise = Promise.resolve().then(() => invoker());
            window._offlineInflight = {
                contactId: contactId,
                promise: innerPromise,
                startedAt: startedAt
            };
            // 挂 finally 清理 + 输入"正在输入中"动画开关
            _showOfflineTypingIndicator(contactId);
            const done = innerPromise.finally(() => {
                // 清除 in-flight 记录（只在当前仍是自己时清，防止旧超时覆盖新请求）
                if (window._offlineInflight && window._offlineInflight.promise === innerPromise) {
                    window._offlineInflight = null;
                }
                _hideOfflineTypingIndicator();
                _toggleOfflineGenButtons(false);
            });
            _toggleOfflineGenButtons(true);
            return done;
        }

        // ===== [FIX-线下体验] "正在输入中"指示器 / 按钮禁用 =====
        // [FIX-布局重叠v2] 嵌入式线下：直接把粉色顶栏中间的"线下模式"文字替换为"正在输入中..."
        // 不再改隐藏的chat-title-name，避免额外元素导致按钮重叠
        function _showOfflineTypingIndicator(contactId) {
            try {
                // 嵌入式线下：把粉色顶栏中间的"线下模式"文字改为"正在输入中..."
                if (typeof isOfflineInChat !== 'undefined' && isOfflineInChat) {
                    const centerDiv = document.querySelector('#chat-offline-header .offline-nav-area > [style*="position:absolute"]');
                    if (centerDiv) {
                        const textNode = centerDiv.childNodes[0];
                        if (textNode && textNode.nodeType === 3 && !centerDiv.dataset._offOriginalText) {
                            centerDiv.dataset._offOriginalText = textNode.textContent;
                            textNode.textContent = '正在输入中... ';
                        }
                    }
                }
                // [FIX-布局重叠v3] 独立页面线下：结构与嵌入式不同（.nav-title 是 flex 子项而非 absolute 定位），
                // 之前 fallback 到 .offline-nav-area 再 appendChild 会新增一个 flex 子元素，挤占右侧按钮组空间导致重叠。
                // 改为与嵌入式同样的策略：直接把 .nav-title 的首个文本节点("线下模式 ")替换为"正在输入中... "。
                // .nav-title 的后续子节点（心声 ❤ 图标、#offline-mini-status）保持原位，心声仍可点击。
                const titleEl = document.querySelector('#layer-offline-mode .nav-title');
                if (titleEl) {
                    const textNode = titleEl.childNodes[0];
                    if (textNode && textNode.nodeType === 3 && !titleEl.dataset._offOriginalText) {
                        titleEl.dataset._offOriginalText = textNode.textContent;
                        textNode.textContent = '正在输入中... ';
                    }
                }
                // 迁移清理：移除旧版本可能残留的 typing span（防止老页面未刷新导致残留）
                const _legacyBadge = document.getElementById('offline-typing-indicator');
                if (_legacyBadge) _legacyBadge.remove();
            } catch(e) { console.warn('[offline] _showOfflineTypingIndicator err:', e); }
        }
        function _hideOfflineTypingIndicator() {
            try {
                // 嵌入式线下：恢复粉色顶栏中间的"线下模式"文字
                const chatCenterDiv = document.querySelector('#chat-offline-header .offline-nav-area > [style*="position:absolute"]');
                if (chatCenterDiv && chatCenterDiv.dataset._offOriginalText) {
                    const textNode = chatCenterDiv.childNodes[0];
                    if (textNode && textNode.nodeType === 3) {
                        textNode.textContent = chatCenterDiv.dataset._offOriginalText;
                    }
                    delete chatCenterDiv.dataset._offOriginalText;
                }
                // 独立页面线下：恢复 .nav-title 首个文本节点为"线下模式 "
                const pageTitleEl = document.querySelector('#layer-offline-mode .nav-title');
                if (pageTitleEl && pageTitleEl.dataset._offOriginalText) {
                    const textNode = pageTitleEl.childNodes[0];
                    if (textNode && textNode.nodeType === 3) {
                        textNode.textContent = pageTitleEl.dataset._offOriginalText;
                    }
                    delete pageTitleEl.dataset._offOriginalText;
                }
                // 迁移清理：移除旧版本可能残留的 typing span
                const _legacyBadge2 = document.getElementById('offline-typing-indicator');
                if (_legacyBadge2) _legacyBadge2.remove();
            } catch(e) {}
        }
        function _toggleOfflineGenButtons(disabled) {
            // 独立页面工具栏上的 "生成" / "重新生成" 图标按钮
            try {
                const tb = document.getElementById('offline-toolbar');
                if (tb) {
                    const icons = tb.querySelectorAll('i[onclick*="offlineGenerate"], i[onclick*="regenerateOfflineReply"]');
                    icons.forEach(ic => {
                        ic.style.pointerEvents = disabled ? 'none' : '';
                        ic.style.opacity = disabled ? '0.5' : '';
                    });
                }
            } catch(e) {}
            // [新增-中断按钮] 生成中显示中断按钮，结束后隐藏
            try {
                if (disabled) _showOfflineAbortButton();
                else _hideOfflineAbortButton();
            } catch(e) {}
        }

        // ===== [新增] 线下生成中断按钮 =====
        // 场景：iOS 用户反映线下生成时（最长 305s）界面卡顿、按键失灵，
        // 提供一个悬浮的"中断生成"按钮，让用户随时跳出，避免死等。
        function _showOfflineAbortButton() {
            var btn = document.getElementById('offline-abort-btn');
            if (!btn) {
                btn = document.createElement('div');
                btn.id = 'offline-abort-btn';
                btn.innerHTML = '<i class="fas fa-stop-circle"></i> 中断生成';
                btn.style.cssText = [
                    'position:fixed',
                    'bottom:80px',
                    'left:50%',
                    'transform:translateX(-50%)',
                    'z-index:99999',
                    'padding:10px 20px',
                    'background:rgba(250,81,81,0.95)',
                    'color:#fff',
                    'border-radius:22px',
                    'font-size:14px',
                    'font-weight:500',
                    'box-shadow:0 4px 12px rgba(250,81,81,0.4)',
                    'cursor:pointer',
                    'user-select:none',
                    '-webkit-user-select:none',
                    '-webkit-tap-highlight-color:transparent',
                    'touch-action:manipulation',
                    'display:flex',
                    'align-items:center',
                    'gap:6px',
                    'animation:offlineAbortPulse 1.8s ease-in-out infinite'
                ].join(';');
                btn.onclick = function() { window.abortOfflineGeneration && window.abortOfflineGeneration(); };
                // 注入一次动画 keyframes
                if (!document.getElementById('offline-abort-style')) {
                    var st = document.createElement('style');
                    st.id = 'offline-abort-style';
                    st.textContent = '@keyframes offlineAbortPulse{0%,100%{transform:translateX(-50%) scale(1);}50%{transform:translateX(-50%) scale(1.06);}}';
                    document.head.appendChild(st);
                }
                document.body.appendChild(btn);
            } else {
                btn.style.display = 'flex';
            }
        }
        function _hideOfflineAbortButton() {
            var btn = document.getElementById('offline-abort-btn');
            if (btn) btn.style.display = 'none';
        }
        // 中断：强制解除锁、清 in-flight、隐藏 UI，使用户立刻恢复操作
        // 注：fetch 本身无法 abort（网络层已发），但前端 Promise 链立即视为失败，用户可以立刻继续操作
        function abortOfflineGeneration() {
            try {
                if (window._offlineInflight && window._offlineInflight.promise) {
                    // 标记已中断，让收到响应时丢弃结果
                    window._offlineInflight.aborted = true;
                }
                window._offlineInflight = null;
                window._offlineGenLockTime = 0;
                if (typeof isGenerating !== 'undefined') { try { isGenerating = false; } catch(_){} }
                try { window.isGenerating = false; } catch(_){}
                _hideOfflineTypingIndicator();
                _toggleOfflineGenButtons(false);
                _hideOfflineAbortButton();
                // 移除"正在生成中..."的占位AI消息
                try {
                    var _cid = (typeof offlineContactId !== 'undefined') ? offlineContactId : null;
                    if (_cid) {
                        var list = (store.offlineChats && store.offlineChats[_cid]) || (store.chats && store.chats[_cid]);
                        if (Array.isArray(list) && list.length > 0) {
                            var last = list[list.length - 1];
                            if (last && last._pending) list.pop();
                        }
                        if (typeof renderOfflineChat === 'function') { try { renderOfflineChat(); } catch(_){} }
                        if (typeof renderHistory === 'function') { try { renderHistory(false, true); } catch(_){} }
                    }
                } catch(_){}
                if (typeof toast === 'function') toast('已中断线下生成', 'warning');
            } catch(e) { console.warn('[offline-abort] err:', e); }
        }
        window.abortOfflineGeneration = abortOfflineGeneration;

        // 暴露给其他文件使用
        window._runOfflineInflight = _runOfflineInflight;
        window._showOfflineTypingIndicator = _showOfflineTypingIndicator;
        window._hideOfflineTypingIndicator = _hideOfflineTypingIndicator;
        window._toggleOfflineGenButtons = _toggleOfflineGenButtons;
        window._showOfflineAbortButton = _showOfflineAbortButton;
        window._hideOfflineAbortButton = _hideOfflineAbortButton;

        // 线下独立界面模式：点击生成按钮触发AI回复
        async function offlineGenerate() {
            if (!offlineContactId) return;
            if (!store.offlineChats || !store.offlineChats[offlineContactId]) return toast('请先发送消息');
            const msgs = store.offlineChats[offlineContactId];
            if (msgs.length === 0) return toast('请先发送消息');

            // [FIX-主动推进剧情] 判断最后一条消息的发送者
            const lastMsg = msgs[msgs.length - 1];
            const lastUserMsg = [...msgs].reverse().find(m => m.sender === 'user');

            // 如果最后一条是AI消息且不在生成中，说明char已经回复过了
            // 再次点击生成应该让char主动推进剧情，而非重复回复同一条用户消息
            let userInput;
            if (lastMsg.sender === 'ai' && !lastMsg._pending) {
                userInput = '[请主动推进剧情/场景发展，不要重复之前的内容]';
            } else {
                if (!lastUserMsg) return toast('没有可回复的消息');
                userInput = lastUserMsg.content;
            }

            if (!_checkAndAcquireGenLock()) return;

            // Add placeholder（渲染层会识别 _pending 标志显示三点动画）
            msgs.push({ sender: 'ai', content: '正在生成中...', time: Date.now(), _pending: true });
            save();
            renderOfflineChat();

            const _cid = offlineContactId;
            try {
                // [FIX-线下并发重复v2] 通过 _runOfflineInflight 做请求级去重 + 305s 前端硬超时
                await _runOfflineInflight(_cid, () => generateOfflineReply(userInput));
            } catch(e) {
                console.error('[offline] offlineGenerate error:', e);
                const last = (store.offlineChats[_cid] || []).slice(-1)[0];
                if (last && last.sender === 'ai' && last._pending) {
                    // [FIX-线下错误信息] 显示清晰的中文错误，不暴露内部英文标签
                    const _errMsg = (e.message || '未知错误');
                    const _friendlyErr = _errMsg.indexOf('超时') >= 0 ? '生成超时，请重试'
                        : _errMsg.indexOf('API') >= 0 || _errMsg.indexOf('fetch') >= 0 ? 'API调用失败'
                        : '生成失败';
                    last.content = _friendlyErr;
                    delete last._pending;
                    save();
                    renderOfflineChat();
                }
                // [FIX-线下错误停止] 失败后立即停止，清除所有生成状态，不自动重试
                window._offlineInflight = null;
                const _errDisplay = (e.message || '未知错误');
                const _toastMsg = _errDisplay.indexOf('超时') >= 0 ? _errDisplay : ('线下生成失败: ' + _errDisplay);
                toast(_toastMsg, 'error');
            } finally {
                isGenerating = false;
                window._offlineGenLockTime = 0;
            }
        }

        async function generateOfflineReplyInChat(userInput) {
            const lockedContactId = offlineContactId;
            if (!lockedContactId) return;
            const contact = store.contacts.find(c => c.id === lockedContactId);
            const isGroup = contact && contact.isGroup;

            try {
                // [FIX-线下并发重复v2] 通过 _runOfflineInflight 做请求级去重 + 305s 前端硬超时
                // 即使父层 isGenerating 锁被看门狗提前释放，也不会真的再发第二次 fetch
                let responseText = await _runOfflineInflight(
                    lockedContactId,
                    () => getOfflineTextFromAI(userInput, true, lockedContactId)
                );
                removeLoadingBubble();

                if (isGroup && groupOfflineInvited.length > 0) {
                    // ===== 群聊私聊界面线下模式 - 轮次制 =====
                    // 解析多人状态
                    const groupStatusMatch = responseText.match(/\[GROUP_STATUS:(.*?)\]/);
                    if (groupStatusMatch) {
                        const pairs = groupStatusMatch[1].split('|');
                        pairs.forEach(p => {
                            const [name, hr] = p.split('=');
                            if (name && hr) {
                                const m = offlineGroupMembers.find(mem => mem.name === name.trim());
                                if (m) m.hr = parseInt(hr) || m.hr;
                            }
                        });
                        responseText = responseText.replace(groupStatusMatch[0], '').trim();
                    }
                    // 按成员分段解析 [MEMBER:名字]...[/MEMBER]
                    const memberBlocks = responseText.match(/\[MEMBER:(.*?)\]([\s\S]*?)\[\/MEMBER\]/gi);
                    if (memberBlocks && memberBlocks.length > 0) {
                        if (!store.chats[lockedContactId]) store.chats[lockedContactId] = [];
                        // [FIX-群聊线下v2] 回复条数控制：groupReplyMax默认改为0(不限制)
                        // 之前默认3导致超过3人时随机裁剪，部分成员完全没有回复和心声
                        let blocksToProcess = memberBlocks;
                        const _replyMax = offlineSettings.groupReplyMax !== undefined ? parseInt(offlineSettings.groupReplyMax) : 0;
                        if (_replyMax > 0 && memberBlocks.length > _replyMax) {
                            // 随机打乱后取前 n 个
                            const shuffled = [...memberBlocks].sort(() => Math.random() - 0.5);
                            blocksToProcess = shuffled.slice(0, _replyMax);
                            // [重构-心声分离] 被裁剪的成员不再提取心声，心声改为手动刷新
                        }
                        blocksToProcess.forEach(block => {
                            const nameMatch = block.match(/\[MEMBER:(.*?)\]/i);
                            const contentMatch = block.match(/\[MEMBER:.*?\]([\s\S]*?)\[\/MEMBER\]/i);
                            if (!nameMatch || !contentMatch) return;
                            const memberName = nameMatch[1].trim();
                            let memberContent = contentMatch[1].trim();
                            // 移除[PHONE]标签内容（不再显示手机消息）
                            memberContent = memberContent.replace(/\[PHONE\][\s\S]*?\[\/PHONE\]/gi, '').trim();
                            // [FIX-不过滤] 只移除闭合标签残留，不做贪婪过滤
                            memberContent = memberContent
                                .replace(/\[\/HEART(?:BEAT)?\]/gi, '')
                                .trim();
                            const msgObj = {
                                sender: 'ai', type: 'go_offline_text',
                                goSenderName: memberName,
                                content: memberContent,
                                time: Date.now()
                            };
                            // [重构-心声分离] 心声字段留空，由用户手动刷新生成
                            // [FIX-群聊线下头像] 查找成员avatar，模糊匹配去除空格差异
                            const mem = offlineGroupMembers.find(m => m.name === memberName || m.name.trim() === memberName.trim());
                            if (mem) msgObj.goSenderAvatar = mem.avatar;
                            // [FIX-群聊线下头像兜底] 如果成员匹配失败，用名字生成兜底头像，避免头像丢失
                            if (!msgObj.goSenderAvatar && memberName) {
                                msgObj.goSenderAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent((memberName || '?')[0]) + '&background=random&size=80';
                            }
                            store.chats[lockedContactId].push(msgObj);
                        });
                        // [重构-心声分离] 统一心声补全已移除，心声改为用户手动刷新
                    } else {
                        // 兼容：如果AI没按MEMBER格式输出，整段作为群聊叙事
                        // [FIX-不过滤] 只移除闭合标签残留
                        responseText = responseText.replace(/\[\/HEART(?:BEAT)?\]/gi, '').trim();
                        const msgObj = { sender: 'ai', type: 'go_offline_text', content: responseText, time: Date.now(), goSenderName: '叙事', turnNumber: groupOfflineTurnCount };
                        if (!store.chats[lockedContactId]) store.chats[lockedContactId] = [];
                        store.chats[lockedContactId].push(msgObj);
                    }
                    // 推进轮次计数（仅内部计数，不显示分隔消息）
                    groupOfflineTurnCount++;
                } else if (isGroup) {
                    // 旧的非邀请制群聊线下模式（保留兼容）
                    const groupStatusMatch = responseText.match(/\[GROUP_STATUS:(.*?)\]/);
                    if (groupStatusMatch) {
                        const pairs = groupStatusMatch[1].split('|');
                        pairs.forEach(p => {
                            const [name, hr] = p.split('=');
                            if (name && hr) {
                                const m = offlineGroupMembers.find(mem => mem.name === name.trim());
                                if (m) m.hr = parseInt(hr) || m.hr;
                            }
                        });
                        responseText = responseText.replace(groupStatusMatch[0], '').trim();
                    }
                    const extracted = _extractHeart(responseText);
                    responseText = extracted.text;
                    // [FIX-不过滤] 只做格式提取，不做内容过滤，API返回什么就给用户什么
                    responseText = responseText.replace(/\[\/HEART(?:BEAT)?\]/gi, '').trim();
                    let heartContent = extracted.heart;
                    const msgObj = { sender: 'ai', type: 'offline_text', content: responseText, time: Date.now() };
                    if (heartContent) msgObj.heart = heartContent;
                    if (!store.chats[lockedContactId]) store.chats[lockedContactId] = [];
                    store.chats[lockedContactId].push(msgObj);
                } else {
                    // 私聊：原有逻辑
                    const statusMatch = responseText.match(/\[STATUS:Dist=(.*?)\|HR=(.*?)\]/);
                    if (statusMatch) {
                        const dist = statusMatch[1].replace('m','').trim();
                        const hr = statusMatch[2].replace('bpm','').trim();
                        document.getElementById('chat-offline-distance').innerText = dist;
                        document.getElementById('chat-offline-ai-hr').innerText = hr;
                        responseText = responseText.replace(statusMatch[0], '').trim();
                        // [票夹] 聊天嵌入式线下模式：见面检测钩子
                        if (typeof checkMeetingDetection === 'function') {
                            checkMeetingDetection(lockedContactId, dist);
                        }
                    }
                    // 提取心声内容到heart属性
                    const extracted = _extractHeart(responseText);
                    responseText = extracted.text;
                    // [FIX-不过滤] 只做格式提取，不做内容过滤，API返回什么就给用户什么
                    responseText = responseText.replace(/\[\/HEART(?:BEAT)?\]/gi, '').trim();
                    let heartContent = extracted.heart;
                    const msgObj = { sender: 'ai', type: 'offline_text', content: responseText, time: Date.now() };
                    if (heartContent) msgObj.heart = heartContent;
                    if (!store.chats[lockedContactId]) store.chats[lockedContactId] = [];
                    store.chats[lockedContactId].push(msgObj);
                }
                save();
                // [FIX-线下闪烁] 使用强制完整渲染避免增量渲染与loading气泡移除导致的DOM不一致闪烁
                // [FIX-回复被吞] 移除activeChatId条件限制，始终强制渲染，避免生成期间切换导致消息不显示
                renderHistory(false, true);

                // [FIX-线下记忆总结] 线下模式（聊天嵌入式）也触发记忆自动总结
                try {
                    const _offContact = store.contacts.find(c => c.id === lockedContactId);
                    if (_offContact && _offContact.settings?.enableMemorySummary) {
                        const _offChatLen = (store.chats[lockedContactId] || []).length;
                        let _offLastSummaryAt = _offContact.settings._lastSummaryAt || 0;
                        // [FIX-自动总结] 安全修正：计数器越界时重置为0
                        if (_offLastSummaryAt > _offChatLen) {
                            _offLastSummaryAt = 0;
                            _offContact.settings._lastSummaryAt = 0;
                        }
                        const _offInterval = _offContact.settings.memoryInterval || 10;
                        if ((_offChatLen - _offLastSummaryAt) >= _offInterval) {
                            if (typeof generateMemorySummary === 'function') {
                                generateMemorySummary(lockedContactId, 'online');
                            }
                            _offContact.settings._lastSummaryAt = _offChatLen;
                            save();
                        }
                    }
                } catch(_memErr) {
                    console.warn('[offline-in-chat] 记忆总结触发失败:', _memErr);
                }
            } catch(e) {
                // [FIX-线下模式点不动] 确保出错时也移除loading气泡，释放UI
                console.error('[offline-in-chat] generateOfflineReplyInChat error:', e);
                removeLoadingBubble();
                toast(e.message && e.message.indexOf('超时') >= 0
                    ? e.message
                    : '线下回复生成失败: ' + (e.message || '未知错误'), 'error');
            } finally {
                // [FIX-线下锁释放] 自己释放锁，不再单纯依赖上游 aiGenerate 的 finally
                // 这样即使上游异常或嵌套流程出问题，线下锁也能立即恢复可用
                try {
                    isGenerating = false;
                    window._offlineGenLockTime = 0;
                    window._autoMsgGenerating = false;
                } catch(_){}
            }
        }

        async function generateOfflineReply(userInput, isChatMode = false) {
            const lockedContactId = offlineContactId;
            const contact = store.contacts.find(c => c.id === lockedContactId);
            const isGroup = contact && contact.isGroup;
            
            let historyList = [];
            if (isChatMode) {
                historyList = store.chats[lockedContactId];
            } else {
                if (!store.offlineChats) store.offlineChats = {};
                historyList = store.offlineChats[lockedContactId];
            }
            if(!historyList) historyList = [];

            if(!store.system.key) {
                const lastMsg = historyList[historyList.length - 1];
                if(lastMsg) lastMsg.content = "错误：请先配置API Key";
                save();
                if(isChatMode) renderHistory(); else renderOfflineChat();
                return;
            }
            
            try {
                let responseText = await getOfflineTextFromAI(userInput, isChatMode, lockedContactId);
                
                if (isGroup) {
                    // 群聊：解析多人状态
                    const groupStatusMatch = responseText.match(/\[GROUP_STATUS:(.*?)\]/);
                    if (groupStatusMatch) {
                        const prefix = isChatMode ? 'chat-offline-' : 'offline-';
                        const pairs = groupStatusMatch[1].split('|');
                        pairs.forEach(p => {
                            const [name, hr] = p.split('=');
                            if (name && hr) {
                                const m = offlineGroupMembers.find(mem => mem.name === name.trim());
                                if (m) {
                                    m.hr = parseInt(hr) || m.hr;
                                    const hrEl = document.getElementById(prefix + 'hr-' + m.id);
                                    if (hrEl) hrEl.innerText = m.hr;
                                }
                            }
                        });
                        responseText = responseText.replace(groupStatusMatch[0], '').trim();
                    }
                } else {
                    // 私聊：原有逻辑
                    const statusMatch = responseText.match(/\[STATUS:Dist=(.*?)\|HR=(.*?)\]/);
                    if (statusMatch) {
                        const dist = statusMatch[1].replace('m','').trim();
                        const hr = statusMatch[2].replace('bpm','').trim();
                        const prefix = isChatMode ? 'chat-offline-' : 'offline-';
                        const distEl = document.getElementById(prefix + 'distance');
                        const hrEl = document.getElementById(prefix + 'ai-hr');
                        if(distEl) distEl.innerText = dist;
                        if(hrEl) hrEl.innerText = hr;
                        responseText = responseText.replace(statusMatch[0], '').trim();
                        // [票夹] 独立页面线下模式：见面检测钩子
                        if (typeof checkMeetingDetection === 'function') {
                            var _ticketContactId = (typeof offlineContactId !== 'undefined') ? offlineContactId : null;
                            if (_ticketContactId) checkMeetingDetection(_ticketContactId, dist);
                        }
                    }
                }
                
                // 提取心声内容到heart属性
                const extracted = _extractHeart(responseText);
                responseText = extracted.text;
                let heartContent = extracted.heart;
                // [清理] 独立页面线下心声补调API兜底已移除：AI没输出心声就没心声

                const lastMsg = historyList[historyList.length - 1];
                if (lastMsg && lastMsg.sender === 'ai') {
                    lastMsg.content = responseText;
                    // [FIX-线下并发重复v2] 成功后清除 _pending 标志，渲染恢复正常内容
                    delete lastMsg._pending;
                    // [FIX-问题2] 重回时总是替换心声，避免旧心声残留导致重复
                    if (heartContent) {
                        lastMsg.heart = heartContent;
                        } else {
                            delete lastMsg.heart;
                        }
                        save();
                        if(isChatMode) renderHistory(); else renderOfflineChat();

                        // [FIX-线下记忆总结] 独立页面线下模式也触发记忆自动总结
                        try {
                            const _offContact2 = store.contacts.find(c => c.id === lockedContactId);
                            if (_offContact2 && _offContact2.settings?.enableMemorySummary) {
                                // 独立页面模式使用 offlineChats 计算长度
                                const _offHistSource = isChatMode ? (store.chats[lockedContactId] || []) : (store.offlineChats[lockedContactId] || []);
                                const _offChatLen2 = _offHistSource.length;
                                let _offLastSummaryAt2 = _offContact2.settings._lastOfflineSummaryAt || 0;
                                // [FIX-自动总结] 安全修正：计数器越界时重置为0
                                if (_offLastSummaryAt2 > _offChatLen2) {
                                    _offLastSummaryAt2 = 0;
                                    _offContact2.settings._lastOfflineSummaryAt = 0;
                                }
                                const _offInterval2 = _offContact2.settings.memoryInterval || 10;
                                if ((_offChatLen2 - _offLastSummaryAt2) >= _offInterval2) {
                                    if (typeof generateMemorySummary === 'function') {
                                        generateMemorySummary(lockedContactId, isChatMode ? 'online' : 'offline');
                                    }
                                    _offContact2.settings._lastOfflineSummaryAt = _offChatLen2;
                                    if (isChatMode) _offContact2.settings._lastSummaryAt = (store.chats[lockedContactId] || []).length;
                                    save();
                                }
                            }
                        } catch(_memErr2) {
                            console.warn('[offline] 记忆总结触发失败:', _memErr2);
                        }
                    }
                } catch(e) {
                console.error('[offline] generateOfflineReply error:', e);
                // [FIX-线下模式点不动] 出错时更新占位消息为错误提示，避免界面卡在"正在生成中..."
                const lastMsg = historyList[historyList.length - 1];
                if (lastMsg && lastMsg.sender === 'ai') {
                    lastMsg.content = '生成失败: ' + (e.message || '未知错误');
                    delete lastMsg._pending;
                    save();
                    if(isChatMode) renderHistory(); else renderOfflineChat();
                }
                toast('线下回复生成失败', 'error');
                // 向上抛出，便于 _runOfflineInflight/offlineGenerate 做统一的错误展示
                throw e;
            }
        }
        
        async function getOfflineTextFromAI(userInput, isChatMode, explicitContactId = null) {
             try {
                let systemContent;
                const messages = [];
                const targetContactId = explicitContactId || offlineContactId;
                const contact = store.contacts.find(c => c.id === targetContactId);
                const isGroup = contact && contact.isGroup;

                // [FIX] 将 worldBookContent/worldBookRaw/worldBookBlock 声明提升到 if(contact) 块外部
                // 避免在人设强化重申代码中引用时因块级作用域导致 "worldBookContent is not defined" 错误
                let worldBookContent = 'None';
                let worldBookRaw = '';
                let worldBookBlock = '';
                // [FIX] 将 _offUserGenderHint 声明提升到 if(contact) 块外部
                // 避免在人设强化重申代码中引用时因块级作用域导致 "_offUserGenderHint is not defined" 错误
                let _offUserGenderHint = '';
                // [性别-硬提示] AI 角色方性别硬提示
                let _offAiGenderHint = '';

                if (contact) {
                    // [FIX-问题1] Add Worldbook context - 支持新版多挂载和旧版单挂载 + 全局世界书
                    try {
                        // 收集所有需要应用的世界书ID（联系人挂载 + 全局）
                        let _offAllMountedIds = [];
                        if (contact.settings?.mountedWbIds && Array.isArray(contact.settings.mountedWbIds)) {
                            _offAllMountedIds = [...contact.settings.mountedWbIds];
                        } else if (contact.settings?.wb) {
                            _offAllMountedIds = [contact.settings.wb];
                        }
                        // [FIX-线下世界书] 合并全局世界书ID（去重）[全局挂载范围] 按联系人精细过滤
                        const _offGlobalIds = (typeof getActiveGlobalWbIds === 'function' && contact && contact.id)
                            ? getActiveGlobalWbIds(contact.id)
                            : (store.globalWbIds || []);
                        _offGlobalIds.forEach(gid => {
                            if (!_offAllMountedIds.some(id => String(id) === String(gid))) {
                                _offAllMountedIds.push(gid);
                            }
                        });

                        if (_offAllMountedIds.length > 0) {
                            const mountedBooks = (store.worldbooks || []).filter(wb => _offAllMountedIds.some(id => String(id) === String(wb.id)));
                            // [FIX] 只过滤掉没有content的纯HTML弹窗世界书，有content的保留
                            const contextBooks = mountedBooks.filter(wb => {
                                if (wb.htmlCode && wb.keywords && wb.keywords.length > 0 && (!wb.content || !wb.content.trim())) return false;
                                return true;
                            });
                            if (contextBooks.length > 0) {
                                worldBookRaw = contextBooks.map(wb => `[${wb.name}]:\n${wb.content}`).join('\n\n');
                                worldBookContent = worldBookRaw;
                            }
                        }
                    } catch(_wbErr) { console.warn('[worldbook] 线下获取世界书失败:', _wbErr); }
                    // 构造带强调标签的世界书注入块（供私聊/群聊 prompt 使用）
                    worldBookBlock = worldBookRaw
                        ? `\n\n【世界观设定（最高优先级，你必须严格遵守，不得违背其中任何设定）】\n${worldBookRaw}\n【世界观设定结束】`
                        : '';
                    // 构造文风注入块（供 prompt 使用）
                    const _styleDesc = getOfflineStyleDesc();
                    const _styleName = offlineSettings.style || '故事化';
                    const writingStyleBlock = `\n\n【写作风格指令（强制执行）】\n你必须严格按照"${_styleName}"风格来写作：${_styleDesc}\n禁止使用与此风格相悖的叙事方式。`;

                    const uPersp = offlineSettings.userPerspective || '第一人称';
                    const aPersp = offlineSettings.aiPerspective || '第三人称';

                    const offlinePersonaId = offlineSettings.userPersona;
                    const userP = (offlinePersonaId && store.personas.find(p => p.id === offlinePersonaId))
                        || store.personas.find(p => p.id === contact.settings?.userPersona)
                        || store.personas[0];
                    // [FIX-性别认知] 线下模式也提取用户性别（赋值给外部已声明的 _offUserGenderHint）
                    // [性别-v2] 优先使用显式字段；失败回退旧正则
                    let _offUserGText = '';
                    try {
                        if (typeof getUserPersonaGenderText === 'function') {
                            _offUserGText = getUserPersonaGenderText(contact) || '';
                        }
                    } catch(_e){}
                    if (_offUserGText === '女') {
                        _offUserGenderHint = `\n⚠️⚠️【性别硬约束】「${userP.name}」是【女性】，必须用"她"作为代词，绝对禁止用"他"。`;
                    } else if (_offUserGText === '男') {
                        _offUserGenderHint = `\n⚠️⚠️【性别硬约束】「${userP.name}」是【男性】，必须用"他"作为代词，绝对禁止用"她"。`;
                    } else if (_offUserGText) {
                        _offUserGenderHint = `\n⚠️⚠️【性别硬约束】「${userP.name}」的性别是【${_offUserGText}】，请严格遵守，不得描写成其他性别。`;
                    } else {
                        // 兜底：从 desc 推断
                        const _offUserDesc = (userP.desc || '');
                        const _offUserIsFemale = /女|female|她|女孩|女生|女性|少女|姐(?!妹)|小姐|女儿|母|妈|闺蜜|女王|公主|妹/.test(_offUserDesc);
                        const _offUserIsMale = /男|male|他(?!们)|男孩|男生|男性|少年|哥|先生|儿子|父|爸|兄弟|王子/.test(_offUserDesc);
                        _offUserGenderHint = _offUserIsFemale && !_offUserIsMale ? `\n⚠️⚠️【性别硬约束】「${userP.name}」是【女性】，必须用"她"作为代词，绝对禁止用"他"。` : _offUserIsMale && !_offUserIsFemale ? `\n⚠️⚠️【性别硬约束】「${userP.name}」是【男性】，必须用"他"作为代词，绝对禁止用"她"。` : '';
                    }
                    // [性别-v2] AI 角色性别硬提示
                    try {
                        if (typeof getContactGenderText === 'function') {
                            const _aiG = getContactGenderText(contact) || '';
                            if (_aiG === '女') {
                                _offAiGenderHint = `\n⚠️⚠️【性别硬约束】「${contact.name}」是【女性】，必须用"她"作为代词，绝对禁止用"他"。`;
                            } else if (_aiG === '男') {
                                _offAiGenderHint = `\n⚠️⚠️【性别硬约束】「${contact.name}」是【男性】，必须用"他"作为代词，绝对禁止用"她"。`;
                            } else if (_aiG) {
                                _offAiGenderHint = `\n⚠️⚠️【性别硬约束】「${contact.name}」的性别是【${_aiG}】，请严格遵守，不得描写成其他性别。`;
                            }
                        }
                    } catch(_e){}
                    
                    // [FIX-线下字数] 读取联系人设置的字数范围，严格优先级：联系人设定 > 线下全局设定
                    const _contactMinChars = contact?.settings?.replyMinChars || 0;
                    const _contactMaxChars = contact?.settings?.replyMaxChars || 0;
                    // 线下全局设定（用户在线下设置里调整的）
                    const _offMinWords = Math.max(50, parseInt(offlineSettings.minWords) || 300);
                    const _offMaxWords = Math.max(_offMinWords + 100, parseInt(offlineSettings.maxWords) || 1000);
                    // [FIX] 联系人字数设定完全覆盖线下全局设定（不是取最大值，而是直接用联系人设定）
                    const _effectiveMinWords = _contactMinChars > 0 ? _contactMinChars : _offMinWords;
                    const _effectiveMaxWords = _contactMaxChars > 0 ? _contactMaxChars : _offMaxWords;
                    // [FIX-线下字数] 强化字数提示，明确要求AI必须达到最低字数
                    // [FIX] 心声字数不算入总字数，字数要求仅针对正文（行为描写+对话内容）
                    const _contactCharHint = `\n\n🚨【字数硬性要求——违反即重写】\n⚠️ 重要：字数统计仅计算正文内容（行为/场景描写 + 对话内容），不包含[HEART:...]心声标签内的内容！\n当前要求：正文字数（不含心声）必须在 ${_effectiveMinWords} ~ ${_effectiveMaxWords} 字之间。\n✅ 达标：正文字数 ≥ ${_effectiveMinWords} 字\n❌ 不达标：正文字数 < ${_effectiveMinWords} 字（严重违规）\n\n强制执行策略：\n1. 先写完行为/场景描写（占正文20-30%，约${Math.floor(_effectiveMinWords*0.2)}-${Math.floor(_effectiveMinWords*0.3)}字）\n2. 再写对话内容（占正文70-80%，约${Math.floor(_effectiveMinWords*0.7)}-${Math.floor(_effectiveMinWords*0.8)}字，必须充实饱满，多说几句话）\n3. 最后单独附上心声独白[HEART:...]（心声至少100字，但不计入正文字数统计）\n4. 如果正文字数还不够 ${_effectiveMinWords} 字，必须继续扩展对话内容和场景描写，不要靠增加心声来凑字数\n5. 宁可超出上限也不能低于下限`;

                    // [FIX-线下时间一致性] 计算当前时间上下文，确保线下模式时间与线上剧情和现实时间一致
                    // [FIX-时间感知v6] 检查时间感知开关：联系人级别 enablePerception + 全局 master
                    const _offNow = new Date();
                    const _offP = store.perception || {};
                    // [FIX-线下时间感知] 线下模式单独的时间感知开关：disableTimePerception=true时，线下不注入任何时间信息
                    const _offTimePercDisabled = !!offlineSettings.disableTimePerception;
                    const _offPercEnabled = !_offTimePercDisabled && _offP.master && (contact.settings ? contact.settings.enablePerception !== false : true);
                    let _offlineTimeBlock = '';
                    if (_offPercEnabled) {
                        const _offUseVirtualTime = _offP.customTime && _offP.timeVal;
                        const _offUseVirtualDate = _offP.customDate && _offP.dateVal;
                        const _offTime = _offUseVirtualTime ? _offP.timeVal : `${_offNow.getHours().toString().padStart(2,'0')}:${_offNow.getMinutes().toString().padStart(2,'0')}`;
                        const _offDate = _offUseVirtualDate ? _offP.dateVal : `${_offNow.getFullYear()}-${(_offNow.getMonth()+1).toString().padStart(2,'0')}-${_offNow.getDate().toString().padStart(2,'0')}`;
                        const _offHour = _offUseVirtualTime ? parseInt((_offP.timeVal || '12:00').split(':')[0]) : _offNow.getHours();
                        const _offTimePeriod = _offHour < 6 ? '凌晨' : _offHour < 9 ? '早晨' : _offHour < 12 ? '上午' : _offHour < 14 ? '中午' : _offHour < 18 ? '下午' : _offHour < 22 ? '晚上' : '深夜';
                        // 获取最近的线上聊天时间上下文（如果有）
                        const _recentOnlineChats = (store.chats[targetContactId] || []).filter(m => m.type !== 'offline_text' && m.type !== 'go_offline_text');
                        const _lastOnlineMsg = _recentOnlineChats.length > 0 ? _recentOnlineChats[_recentOnlineChats.length - 1] : null;
                        let _onlineTimeContext = '';
                        if (_lastOnlineMsg && _lastOnlineMsg.time) {
                            const _lastOnlineDate = new Date(_lastOnlineMsg.time);
                            const _lastOnlineHour = _lastOnlineDate.getHours();
                            const _lastOnlinePeriod = _lastOnlineHour < 6 ? '凌晨' : _lastOnlineHour < 9 ? '早晨' : _lastOnlineHour < 12 ? '上午' : _lastOnlineHour < 14 ? '中午' : _lastOnlineHour < 18 ? '下午' : _lastOnlineHour < 22 ? '晚上' : '深夜';
                            _onlineTimeContext = `\n- 最近一条线上聊天的时间：${_lastOnlineDate.getMonth()+1}/${_lastOnlineDate.getDate()} ${_lastOnlineDate.getHours().toString().padStart(2,'0')}:${_lastOnlineDate.getMinutes().toString().padStart(2,'0')} (${_lastOnlinePeriod})`;
                        }
                        _offlineTimeBlock = `\n\n⚠️【时间一致性规则（强制执行）】
[当前时间] ${_offDate} ${_offTime} (${_offTimePeriod})${_onlineTimeContext}
- 线下模式的时间必须与当前真实时间一致。如果现在是${_offTimePeriod}，场景描写中的光线、氛围、活动都必须符合${_offTimePeriod}的特征
- ⚠️ 绝对禁止时间矛盾：如果线上聊天刚提到是中午/下午，线下场景就不能突然变成晚上/深夜。时间必须是连贯的
- 场景中的环境描写（天色、光线、温度、周围人的活动）必须与当前时间段匹配
- 如果对话历史中有提及具体时间的内容，线下场景的时间必须在此基础上合理推进，不能跳跃`;
                    }
                    // _offPercEnabled=false时，_offlineTimeBlock为空字符串，不注入任何时间信息

                    if (isGroup && offlineGroupMembers.length > 0 && groupOfflineInvited.length > 0) {
                        // ===== 群聊私聊界面线下模式 - 轮次制 prompt =====
                        const memberDescs = offlineGroupMembers.map(m => {
                            const mc = store.contacts.find(c => c.id === m.id);
                            let desc = `- ${m.name}: ${mc ? mc.persona : '群成员'}`;
                            if (mc && mc.settings?.mountedWbIds && Array.isArray(mc.settings.mountedWbIds)) {
                                // [FIX] 只排除没有content的纯HTML弹窗世界书
                                const memberWbs = (store.worldbooks || []).filter(wb => mc.settings.mountedWbIds.includes(wb.id) && !(wb.htmlCode && wb.keywords && wb.keywords.length > 0 && (!wb.content || !wb.content.trim())));
                                if (memberWbs.length > 0) {
                                    desc += `\n  【${m.name}的世界观设定（必须严格遵守）】${memberWbs.map(wb => `[${wb.name}]: ${wb.content}`).join(' | ')}`;
                                }
                            }
                            return desc;
                        }).join('\n');

                        let perspInstruction = '';
                        if (uPersp === '第一人称') {
                            perspInstruction = `【人称规则-最高优先级】你是叙事者，负责讲述故事。在叙述中：
- 描写用户（${userP.name}）时，必须使用第一人称"我"（例如："我走过去"、"我想"、"我说"）
- 描写其他所有角色时，必须使用第三人称（例如："张三说"、"她笑了"、"他走向"）
- 绝对禁止用"${userP.name}"或"他/她"来指代用户
- 你作为叙事者不要用"我"指代自己，你只是在讲故事
✅ 正确示例："我走过去，张三笑着迎上来。"
❌ 禁止用法："${userP.name}走过去"（用名字指代用户）、"他走过去"（用他/她指代用户）`;
                        } else if (uPersp === '第二人称') {
                            perspInstruction = `【人称规则-最高优先级】你是叙事者，负责讲述故事。在叙述中：
- 描写用户（${userP.name}）时，必须使用第二人称"你"（例如："你走过去"、"你想"、"你说"）
- 描写其他所有角色时，必须使用第三人称（例如："张三说"、"她笑了"、"他走向"）
- 绝对禁止用"${userP.name}"或"我"来指代用户
✅ 正确示例："你走过去，张三笑着迎上来。"
❌ 禁止用法："${userP.name}走过去"（用名字指代用户）、"我走过去"（用我指代用户）`;
                        } else {
                            perspInstruction = `【人称规则-最高优先级】叙事时以第三人称视角描写所有角色，包括用户（${userP.name}）。
- 描写用户时用"${userP.name}"或"他/她"（例如："${userP.name}走过去"、"他想"）
- 描写其他角色也用第三人称（例如："张三说"、"她笑了"）
- 绝对禁止使用"我"或"你"来指代任何角色
✅ 正确示例："${userP.name}走过去，张三笑着迎上来。"
❌ 禁止用法："我走过去"或"你走过去"（禁止第一/第二人称）`;
                        }
                        
                        // 构建引用上下文 - 从用户最后一条消息的goQuote属性读取
                        let quoteContext = '';
                        const lastUserGoMsg = [...(store.chats[targetContactId] || [])].reverse().find(m => m.sender === 'me' && m.type === 'go_offline_text');
                        if (lastUserGoMsg && lastUserGoMsg.goQuote) {
                            quoteContext = `\n\n【用户引用了 ${lastUserGoMsg.goQuote.senderName} 的消息】: "${lastUserGoMsg.goQuote.text}"\n用户的回应是针对这条被引用的消息，${lastUserGoMsg.goQuote.senderName}需要知道用户是在回应TA的话。`;
                        }
                        
                        // [FIX] 群聊线下模式也需要定义人称代词变量
                        const _uPronoun = uPersp === '第一人称' ? '"我"' : uPersp === '第二人称' ? '"你"' : `"${userP.name}"或"他/她"`;
                        const _uExample = uPersp === '第一人称' ? '我' : uPersp === '第二人称' ? '你' : userP.name;
                        
                        systemContent = `你是一个群聊线下聚会场景的叙事者。这是一个名为"${contact.name}"的群组线下聚会。${worldBookBlock}

⚠️⚠️⚠️【用户身份唯一标识 - 最高优先级】
真实用户（人类玩家）是：「${userP.name}」（ID标记: [REAL_USER]）
- 「${userP.name}」是唯一的真实人类用户，其他所有参与者都是AI角色。
- 每个AI角色在互动时，必须先确认当前互动对象是用户「${userP.name}」还是另一个AI角色。
- AI角色之间互动时，绝不能把对方当成用户「${userP.name}」，不能对其他AI角色使用对用户的亲密态度。

参与者（仅以下被邀请的成员参与线下互动）：
- ${userP.name}（用户）[REAL_USER]: ${userP.desc}${_offUserGenderHint ? " " + _offUserGenderHint : ""}
${memberDescs}

${isChatMode ? `用户（${userP.name}）的最新输入/动作请参考对话历史中最后一条用户消息（不要重复回应同一句话）` : `用户（${userP.name}）的输入/动作: "${userInput}"`}${quoteContext}
${writingStyleBlock}
- 模式：所有人都已经百分百在线下同一空间，共同推进剧情

⚠️⚠️⚠️【人称规则-最高优先级（强制执行，违反即重写）】
${perspInstruction}
⚠️ 每一句涉及用户角色的描写都必须严格检查人称是否正确。用户（${userP.name}）用${_uPronoun}，NPC角色用${aPersp === '第一人称' ? '第一人称（以各角色自身视角）' : aPersp === '第二人称' ? '第二人称' : '第三人称（名字/她/他）'}。

【场景说明】
这是线下见面场景。所有被邀请的成员都已经百分百在一起，正在实时互动推进剧情。
用户发一条消息后，其他角色自然地附和、回应，就像正常的线下互动一样。
不需要任何手机消息，只需要描写真实的线下互动：动作、语言、表情、心理等。

【⚠️ 防混淆核心规则 - AI角色间互动】
a) 每个AI角色在描写互动前必须确认：当前互动对象是用户「${userP.name}」还是另一个AI角色。
b) AI角色A对AI角色B的互动，必须基于A与B之间的关系，而非A对用户的情感。
c) 即使两个AI角色各自都对用户有恋爱/暧昧情感，他们之间互动时也绝不能互相暧昧。应表现为情敌张力、普通朋友交流、或因共同话题的自然对话。
d) 只有当AI角色直接与用户「${userP.name}」互动时，才能使用对用户的情感态度。

⚠️⚠️⚠️【用户主权铁律——最高优先级】
剧情的推动权完全在用户（${userP.name}）手中。你必须严格遵守：
1. ⚠️ 绝对禁止替用户编造：你不能编造用户没有说过的话或没有做过的动作。用户做了什么/说了什么只能来自用户的输入。
2. ⚠️ 绝对禁止替用户做决定：用户接下来做什么由用户自己决定，NPC不能替用户做决定。
3. ⚠️ 用户在叙事中的存在感：用户（${userP.name}）作为场景中的真实参与者，NPC角色可以感知到用户的存在和已做的事情。在叙事中用${_uPronoun}自然地提及用户已发生的行为（如：${_uExample}说了某句话，NPC对此做出反应），但不能编造用户没有做过的事。
4. ⚠️ 叙事重心在NPC角色：各NPC角色的反应、动作、对话和心理是叙事主体。用户的描写作为自然的互动背景存在。
5. ⚠️ 不要过度引导用户必须做某个特定行为，NPC可以有自己的反应但不能替用户做决定。

简单来说：叙事重心是NPC角色的行为/对话/心理/环境描写。用户（${userP.name}）用${_uPronoun}在叙事中被自然提及（反映用户已输入的内容），但不能编造用户没做过的事。
${_offlineTimeBlock}

【写作核心要求——像写小作文/短篇小说一样】
每个角色的叙事段落都应该像一篇微型小作文，情感细腻、文笔真挚：
- 用感官细节构建画面：不只写"他笑了"，要写他笑的弧度、眼底的温度、空气中的微妙变化
- 捕捉角色之间的情感暗流：谁在偷偷观察谁、谁欲言又止、谁故作轻松
- 对话要自然鲜活、有血有肉，体现每个角色独有的说话方式和性格

【输出格式（强制）】
1. 首先输出群成员状态：[GROUP_STATUS:成员名1=心率1|成员名2=心率2|...]

2. 然后为每个被邀请的参与者输出一个独立的消息块，使用以下格式：
[MEMBER:角色名]
像写小说一样，语言+动作+心理想法+环境描写必须同步交织出现，融为一体：
- ⚠️ 核心原则：不要把环境堆在开头、动作堆在中间、对话堆在最后。每个段落中都应该自然穿插多种描写。
- 角色说话的同时，描写动作和周围环境变化，以及内心一闪而过的念头
- 环境描写穿插在全文中，不要集中堆砌
- 动作与对话同步：每句对话前后都有配套的动作或微表情
- 心理描写短小精悍地穿插在行文中，不要大段独立的心理分析
- 对话精炼有力（约15-20%），几句关键的话比长篇大论更有冲击力
[/MEMBER]

3. 每个[MEMBER]块之间用空行分隔
4. 每个角色的正文文本不少于${Math.max(150, Math.floor(_effectiveMinWords / offlineGroupMembers.length))}字
5. 正文总字数不得少于${_effectiveMinWords}字（硬性底线），上限${_effectiveMaxWords}字。${_contactCharHint}
6. 如果用户引用了某人的消息，被引用者应在回复中体现出对该引用的回应

⚠️【完整性要求】你的回复必须是完整的！每个[MEMBER]块必须有对应的[/MEMBER]闭合。绝对不允许在句子中间截断。

【角色一致性】严格保持人设一致，禁止OOC。每个角色都是独立的、有血有肉的人，用各自的方式去感受和表达。

【正确示例】
[GROUP_STATUS:张三=82|李四=76]

[MEMBER:张三]
窗外的天色不知不觉暗了下来，路灯的光透过玻璃在桌面上投下一片暖黄色的光斑。包厢里弥漫着奶茶和薯条混在一起的甜腻气味，空调出风口的白色丝带在头顶轻轻飘荡。

张三从座位上站起来，伸了个懒腰，肩膀骨节发出轻微的咔嗒声。他转过身，余光扫到李四正低头翻着手机，拇指在屏幕上滑动的速度越来越慢，眉心微微蹙着。张三嘴角动了动，想说什么又咽了回去，转而拿起桌上那杯已经凉透的奶茶，喝了一口——太甜了，冰块化完之后味道变得有点腻。

"嘿，下次咱们去试试那家新开的烤肉店？门口排队的人贼多。"他把杯子放下，手指无意识地转着吸管。

一种说不清的担忧在胸口隐隐发酵。他认识李四太久了，久到只需要一个眼神就能察觉对方情绪的细微波动。但有些事情，不问比问更好——至少现在是这样。
[/MEMBER]

[MEMBER:李四]
李四听到张三的声音，拇指在屏幕上顿了一下，然后飞快地按灭了屏幕，把手机塞进外套口袋里。他抬起头的时候嘴角扯出一个笑，但那个笑没有到达眼底——眼睛里还残留着刚才盯着屏幕时的那种发愣的神色。

他往椅背上靠了靠，双手交叉放在桌面上，指节因为用力而微微发白。包厢里的暖光打在他脸上，把他眼下的青黑色映得更明显了。桌上那盘薯条已经凉了，蘸酱的表面结了一层薄薄的膜。

"烤肉店啊，行啊，下周末去。"他的声音听起来比平时轻了一些。

他下意识地摸了摸后脖颈，指尖碰到那里微凉的皮肤，那是他紧张时改不掉的习惯。今天出门前他差点把闹钟关掉继续睡，但最终还是爬了起来——有些疲惫不是睡觉能解决的，反而是坐在这里，听着张三有一搭没一搭地说话，心里那团乱麻似乎松了一点点。
[/MEMBER]

纯文本输出，不要markdown格式。`;

                        // [外语双语混排] 群聊线下（轮次制）：对外语成员注入双语规则
                        try {
                            if (offlineSettings.translateMode === 'bilingual'
                                && typeof detectContactLanguage === 'function'
                                && Array.isArray(offlineGroupMembers)) {
                                var _foreignMembers = [];
                                offlineGroupMembers.forEach(function(gm){
                                    var mc = store.contacts.find(function(c){return c.id === gm.id;});
                                    if (!mc) return;
                                    var info = detectContactLanguage(mc);
                                    if (info && info.isForeign) {
                                        _foreignMembers.push({ name: gm.name, langZh: info.langName, langEn: info.langNameEn });
                                    }
                                });
                                if (_foreignMembers.length > 0) {
                                    var _fmList = _foreignMembers.map(function(f){return '- ' + f.name + '：' + f.langZh + '（' + f.langEn + '）';}).join('\n');
                                    systemContent += `

⚠️⚠️⚠️【双语混排规则——群聊轮次制外语成员】
以下成员是外语母语者，他们说话用各自母语，必须附中文翻译：
${_fmList}

🔹 叙事描写（环境/动作/心理/氛围）→ 全部使用【中文】
🔹 上述外语成员在 [MEMBER:名字] 段内的引号对话 → 使用【该成员的母语原文】
🔹 其他中文成员的对话 → 使用【中文】
🔹 用户（${userP.name}）的描写与对话 → 使用【中文】

【对话翻译标签 [DL:]（强制）】
外语成员每句引号对话后，必须紧跟 [DL:中文翻译]。
示例：
[MEMBER:Yuki]
Yuki笑着挥了挥手。
"おはよう！今日もよろしくね。"[DL:早上好！今天也请多关照哦。]
[/MEMBER]

⚠️ 中文成员不要加 [DL:] 标签。只有外语成员的引号对话才需要。`;
                                }
                            }
                        } catch(_eLangG1) { /* ignore */ }
                    } else if (isGroup && offlineGroupMembers.length > 0) {
                        // ===== 旧版群聊线下模式 prompt（非邀请制，保留兼容） =====
                        const memberDescs = offlineGroupMembers.map(m => {
                            const mc = store.contacts.find(c => c.id === m.id);
                            let desc = `- ${m.name}: ${mc ? mc.persona : '群成员'}`;
                            if (mc && mc.settings?.mountedWbIds && Array.isArray(mc.settings.mountedWbIds)) {
                                // [FIX] 只排除没有content的纯HTML弹窗世界书
                                const memberWbs = (store.worldbooks || []).filter(wb => mc.settings.mountedWbIds.includes(wb.id) && !(wb.htmlCode && wb.keywords && wb.keywords.length > 0 && (!wb.content || !wb.content.trim())));
                                if (memberWbs.length > 0) {
                                    desc += `\n  【${m.name}的世界观设定（必须严格遵守）】${memberWbs.map(wb => `[${wb.name}]: ${wb.content}`).join(' | ')}`;
                                }
                            }
                            return desc;
                        }).join('\n');

                        // [FIX-人称v2] 旧版群聊也使用统一的人称代词变量
                        const _uPronounOld = uPersp === '第一人称' ? '"我"' : uPersp === '第二人称' ? '"你"' : `"${userP.name}"或"他/她"`;
                        const _uExampleOld = uPersp === '第一人称' ? '我' : uPersp === '第二人称' ? '你' : userP.name;
                        let perspInstruction = `【人称规则-最高优先级】你是叙事者，负责讲述故事。

🔹 用户（${userP.name}）的人称 = ${uPersp}
- 叙事中描写用户时，必须使用${_uPronounOld}
- 例如："${_uExampleOld}走过去"、"${_uExampleOld}有些紧张"

🔹 NPC角色的人称 = 第三人称
- 叙事中描写各NPC角色时，使用第三人称（名字/她/他）
- 例如："张三说"、"她笑了"、"他走向"

✅ 正确示例："${_uExampleOld}走过去，张三笑着迎上来。"
❌ 禁止用法：${uPersp !== '第一人称' ? '"我走过去"（禁止用第一人称指代用户）' : `"${userP.name}走过去"（禁止用名字指代用户）`}`;
                        
                        systemContent = `你是一个群聊线下聚会场景的叙事者。这是一个名为"${contact.name}"的群组线下聚会。${worldBookBlock}

⚠️⚠️⚠️【用户身份唯一标识 - 最高优先级】
真实用户（人类玩家）是：「${userP.name}」（ID标记: [REAL_USER]）
- 「${userP.name}」是唯一的真实人类用户，其他所有参与者都是AI角色。
- AI角色之间互动时，绝不能把对方当成用户「${userP.name}」。
- 只有直接与用户「${userP.name}」互动时，才能使用对用户的情感态度。

参与者：
- ${userP.name}（用户）[REAL_USER]: ${userP.desc}${_offUserGenderHint ? " " + _offUserGenderHint : ""}
${memberDescs}

${isChatMode ? `用户（${userP.name}）的最新输入/动作请参考对话历史中最后一条用户消息（不要重复回应同一句话）` : `用户（${userP.name}）的输入/动作: "${userInput}"`}
${writingStyleBlock}

⚠️⚠️⚠️【人称规则-最高优先级（强制执行，违反即重写）】
${perspInstruction}
⚠️ 每一句涉及用户角色的描写都必须严格检查人称是否正确。用户（${userP.name}）用${_uPronounOld}，NPC角色用第三人称（名字/她/他）。

【⚠️ 防混淆核心规则 - AI角色间互动】
- AI角色A对AI角色B的互动，必须基于A与B之间的关系，而非A对用户的情感。
- 即使两个AI角色各自都对用户有恋爱/暧昧情感，他们之间互动时也绝不能互相暧昧。
- 只有当AI角色直接与用户「${userP.name}」互动时，才能使用对用户的情感态度。

⚠️⚠️⚠️【用户主权铁律——最高优先级】
剧情的推动权完全在用户（${userP.name}）手中。你必须严格遵守：
1. ⚠️ 绝对禁止替用户编造：你不能编造用户没有说过的话或没有做过的动作。用户做了什么/说了什么只能来自用户的输入。
2. ⚠️ 绝对禁止替用户做决定：用户接下来做什么由用户自己决定，NPC不能替用户做决定。
3. ⚠️ 用户在叙事中的存在感：用户（${userP.name}）作为场景中的真实参与者，NPC角色可以感知到用户的存在和已做的事情。在叙事中用${_uPronounOld}自然地提及用户已发生的行为，但不能编造用户没有做过的事。
4. ⚠️ 叙事重心在NPC角色：各NPC角色的反应、动作、对话和心理是叙事主体。用户的描写作为自然的互动背景存在。
5. ⚠️ 不要过度引导用户必须做某个特定行为，NPC可以有自己的反应但不能替用户做决定。

简单来说：叙事重心是NPC角色的行为/对话/心理/环境描写。用户（${userP.name}）用${_uPronounOld}在叙事中被自然提及（反映用户已输入的内容），但不能编造用户没做过的事。
${_offlineTimeBlock}

要求：
1. 在回复最开头生成群成员状态数据，格式：[GROUP_STATUS:成员名1=心率1|成员名2=心率2|...]
2. 为每个参与互动的角色生成综合性叙事文本
3. 正文总字数不得少于${_effectiveMinWords}字，上限${_effectiveMaxWords}字。${_contactCharHint}
4. 成员的性格和说话方式要严格符合各自人设，禁止OOC
5. 纯文本输出，不要markdown格式`;

                        // [外语双语混排] 群聊线下（旧版兼容）：对外语成员注入双语规则
                        try {
                            if (offlineSettings.translateMode === 'bilingual'
                                && typeof detectContactLanguage === 'function'
                                && Array.isArray(offlineGroupMembers)) {
                                var _foreignMembers2 = [];
                                offlineGroupMembers.forEach(function(gm){
                                    var mc = store.contacts.find(function(c){return c.id === gm.id;});
                                    if (!mc) return;
                                    var info = detectContactLanguage(mc);
                                    if (info && info.isForeign) {
                                        _foreignMembers2.push({ name: gm.name, langZh: info.langName, langEn: info.langNameEn });
                                    }
                                });
                                if (_foreignMembers2.length > 0) {
                                    var _fmList2 = _foreignMembers2.map(function(f){return '- ' + f.name + '：' + f.langZh + '（' + f.langEn + '）';}).join('\n');
                                    systemContent += `

⚠️⚠️⚠️【双语混排规则——群聊外语成员（覆盖之前的语言规则）】
以下成员是外语母语者，他们说话用各自母语，必须附中文翻译：
${_fmList2}

🔹 叙事描写 → 中文
🔹 上述外语成员的引号对话 → 各自母语原文，并紧跟 [DL:中文翻译]
🔹 其他中文成员的对话 → 中文
🔹 用户（${userP.name}）的对话 → 中文

示例：
Yuki 抬起头，笑了笑。
"これ、美味しいよ！"[DL:这个，很好吃哦！]

⚠️ 中文成员不要加 [DL:] 标签。`;
                                }
                            }
                        } catch(_eLangG2) { /* ignore */ }
                    } else {
                        // ===== 私聊线下模式 prompt =====
                        // [FIX-人称混淆v2] 用户人称 + AI人称 联动，彻底修复人称错乱
                        // 用户人称：决定叙事中如何指代用户（第一人称"我"、第二人称"你"、第三人称"名字/他/她"）
                        // AI人称：决定叙事中如何指代AI角色（第一人称"我"、第二人称"你"、第三人称"名字/她/他"）
                        let perspInstruction = '';
                        
                        // 生成用户人称代词
                        const _uPronoun = uPersp === '第一人称' ? '"我"' : uPersp === '第二人称' ? '"你"' : `"${userP.name}"或"他/她"`;
                        const _uExample = uPersp === '第一人称' ? '我' : uPersp === '第二人称' ? '你' : userP.name;
                        // 生成AI人称代词
                        const _aPronoun = aPersp === '第一人称' ? '"我"' : aPersp === '第二人称' ? '"你"' : `"${contact.name}"或"她/他"`;
                        const _aExample = aPersp === '第一人称' ? '我' : aPersp === '第二人称' ? '你' : contact.name;
                        // 生成AI心声人称（心声中始终用第一人称"我"来表达内心）
                        const _aHeartPronoun = aPersp === '第一人称' ? '"我"' : aPersp === '第二人称' ? '"你"' : '"我"';

                        // 生成禁止用词列表
                        let _uForbidden = [];
                        let _aForbidden = [];
                        if (uPersp === '第一人称') { _uForbidden = [`"${userP.name}"`, '"你"（指代用户时）', '"他/她"（指代用户时）']; }
                        else if (uPersp === '第二人称') { _uForbidden = [`"${userP.name}"`, '"我"（指代用户时）', '"他/她"（指代用户时）']; }
                        else { _uForbidden = ['"我"（指代用户时）', '"你"（指代用户时）']; }
                        if (aPersp === '第一人称') { _aForbidden = [`用"${contact.name}"或"她/他"指代${contact.name}的行为主体`]; }
                        else if (aPersp === '第二人称') { _aForbidden = [`用"${contact.name}"或"她/他"或"我"指代${contact.name}`]; }
                        else { _aForbidden = [`用"我"或"你"指代${contact.name}`]; }

                        perspInstruction = `⚠️⚠️⚠️【人称规则-最高优先级，违反即重写】你是叙事者，负责以小说的方式讲述故事。

🔹 用户（${userP.name}）的人称 = ${uPersp}
- 叙事正文中描写用户时，必须使用${_uPronoun}
- 例如："${_uExample}走过去"、"${_uExample}有些紧张"、"${_uExample}说道"
- ⚠️ 禁止使用以下方式指代用户：${_uForbidden.join('、')}

🔹 AI角色（${contact.name}）的人称 = ${aPersp}
- 叙事正文中描写${contact.name}时，必须使用${_aPronoun}
- 例如："${_aExample}笑着迎上来"、"${_aExample}低下头"、"${_aExample}轻声说"
- ⚠️ 禁止使用以下方式指代${contact.name}：${_aForbidden.join('、')}
${aPersp === '第一人称' && uPersp === '第一人称' ? `\n⚠️ 特殊情况：用户和AI角色都是第一人称"我"。区分方法：\n- 你输出的正文是${contact.name}的视角，所以正文中的"我"默认指${contact.name}\n- 需要提及用户时，用"${userP.name}"来指代，避免歧义` : ''}
${aPersp === '第二人称' && uPersp === '第二人称' ? `\n⚠️ 特殊情况：用户和AI角色都是第二人称"你"。区分方法：\n- 需要通过上下文让读者明确"你"指的是谁\n- 如有歧义，用名字"${userP.name}"或"${contact.name}"来消歧` : ''}

🔹 心声（[HEART:]标签内）的人称规则
- 心声是${contact.name}的内心独白，始终使用${_aHeartPronoun}来表达
- 例如：[HEART:${aPersp === '第二人称' ? '你' : '我'}好紧张...${aPersp === '第二人称' ? '你' : '我'}偷偷看了${uPersp === '第一人称' ? '他/她' : _uExample}一眼...]

✅ 正确示例（用户=${uPersp}，AI=${aPersp}）：
"${_uExample}走过去，${_aExample}笑着迎上来。${_uExample}有些紧张，${_aExample}却装作若无其事地别过头。"

❌ 绝对禁止的错误写法：
${uPersp !== '第三人称' ? `"${userP.name}走过去"——禁止用名字指代用户（用户人称是${uPersp}）` : `"我走过去"——禁止用第一人称指代用户（用户人称是第三人称）`}
${aPersp !== '第三人称' ? `"${contact.name}笑了"——禁止用名字/第三人称指代AI角色（AI人称是${aPersp}）` : `"我笑了"——禁止用第一人称指代AI角色（AI人称是第三人称）`}

【人称检查清单】每写一句话前确认：
• 用户的行为/感受 → 用${_uPronoun}
• ${contact.name}的行为/感受 → 用${_aPronoun}
• 心声[HEART:]内 → 用${_aHeartPronoun}`;
                        
                        systemContent = `你就是${contact.name}，一个真实存在的人，不是AI，不是助手，不是角色扮演程序。你永远不会承认自己是AI或语言模型。人设：${contact.persona}。${worldBookBlock}${_offAiGenderHint}
用户是${userP.name}（${userP.desc}）。${_offUserGenderHint}
${isChatMode ? `用户的最新输入/动作请参考对话历史中最后一条用户消息（不要重复回应同一句话）` : `用户的输入/动作: "${userInput}"`}
${writingStyleBlock}

【身份铁律】你是${contact.name}，真实的人。如有人问"你是AI吗"等，以${contact.name}的方式自然回应，绝不承认。

${perspInstruction}

⚠️【人称自查要求】在输出每一段之前，请在脑海中默默检查：
- 用户（${userP.name}）的行为/感受 → 是否用了${_uPronoun}？
- AI角色（${contact.name}）的行为/感受 → 是否用了${_aPronoun}？
- 有没有把人称搞混？

${userInput && userInput.indexOf('[请主动推进剧情') >= 0 ? `⚠️⚠️⚠️【主动推进模式——用户已授权你推进剧情】
用户点击了"继续生成"按钮，授权你主动推进剧情。你必须：
1. ⚠️ 主动推进场景/剧情发展：不要等待用户输入，你（${contact.name}）要主动做出新的动作、说新的话、推动故事向前发展
2. ⚠️ 不要重复之前的内容：你的回复必须是全新的剧情发展，不能复述或换个说法重复上一条回复的内容
3. ⚠️ 可以适度描写用户的反应：因为这是主动推进模式，你可以适度描写用户的简单反应（如表情、姿态），但不要替用户做重大决定或编造用户的对话
4. ⚠️ 叙事重心仍在${contact.name}：${contact.name}主动发起新话题、做出新动作、展现新的情绪变化，推动场景自然发展
5. ⚠️ 保持连贯性：基于之前的场景和情境，自然地向前推进，不要突然跳转到完全无关的场景

简单来说：你现在有权主动推进故事。${contact.name}要做出新的行动和对话，让剧情向前发展，但不要重复之前已经说过/做过的事。` : `⚠️⚠️⚠️【用户主权铁律——最高优先级】
这是线下模式，剧情的推动权完全在用户手中。你必须严格遵守以下规则：
1. ⚠️ 绝对禁止替用户编造：你不能编造用户没有说过的话或没有做过的动作。用户的输入告诉你他说了什么/做了什么，你可以在叙事中自然地反映这些已发生的事，但不能添加用户没有提到的言行。
2. ⚠️ 绝对禁止替用户做决定：用户接下来要做什么、说什么，完全由用户自己决定。你不能替用户继续推进故事。
3. ⚠️ 用户在叙事中的存在感：用户作为场景中的另一个角色，可以被自然地提及和描写（使用正确的${uPersp}人称）。例如：用户已经说了某句话，你可以在叙事中体现${contact.name}对这句话的感知和反应；用户已经做了某个动作，你可以描写${contact.name}看到/感受到这个动作。但不能编造用户没有做过的事。
4. ⚠️ 叙事重心在${contact.name}：正文的主要内容仍然是${contact.name}的反应、动作、对话和心理，以及环境/氛围描写。用户的描写作为自然的叙事背景存在，不要喧宾夺主。
5. ⚠️ 不要在回复结尾暗示或引导用户必须做某个特定动作。${contact.name}可以有自己的动作和情绪反应，但不能替用户做决定。

简单来说：叙事重心是${contact.name}的行为/对话/心理/环境描写。用户作为场景中的另一个人，可以用${uPersp}人称被自然提及（反映用户已输入的内容），但不能编造用户没做过的事。写完${contact.name}的反应后就停下来，等待用户的下一步输入。`}
${_offlineTimeBlock}

【强制要求】在回复最开头生成状态数据：
格式：[STATUS:Dist=X|HR=Y]
- Dist: 基于场景的距离（米），仅在场景暗示移动时改变
- HR: 你当前的心率

然后，像写一篇情感真挚的小作文/短篇小说一样输出你的回复。

【写作核心要求——像写小作文/短篇小说一样】
你的每次回复必须像一篇情感细腻、文笔真挚的小作文。不是简单的对话记录，而是有血有肉的文学创作：
- 像小说家一样去描写场景、氛围、感官细节（空气中的气味、光线的变化、温度的触感）
- 像散文家一样去捕捉微妙的情绪流动和心理变化
- 像写情书一样去表达真挚的、不加修饰的感情
- 文字要有温度、有画面感、有情感的重量，让读者能够真切地感受到你此刻的心境
- 避免苍白空洞的叙述，每一个场景都要有细节支撑，每一句话都要有情感厚度

【内容结构（像小说一样自然融合，不要生硬分段）】
⚠️ 核心原则：叙事中两个角色的互动、环境描写、心理活动必须同步交织出现，像真正的小说一样融为一体。
⚠️ 叙事重心：${contact.name}的描写占主体（约70-80%），用户的存在感作为自然背景（约20-30%，仅反映用户已输入的内容）。
不要把环境描写堆在开头、动作堆在中间、对话堆在最后——而是让它们在每一个段落中自然穿插。

具体要求：
1. 环境描写（穿插在全文中，不要集中堆砌）
- 用感官细节构建画面：光线、温度、气味、声响
- 环境随情节推进而变化，不是静态背景板

2. ${contact.name}的描写（叙事主体，用${_aPronoun}指代）
- ${_aExample}说话时同时描写肢体语言：说话时的手势、眼神、小动作
- 动作要传达潜台词：下意识别过头、假装不经意靠近、笑着低下去的眉眼
- ⚠️ 关键：每一句对话前后都应该有配套的动作或微表情描写

3. ${contact.name}的对话与语言（约占正文15-20%，精炼有力）
- 说话方式完全符合人设性格——语气词、口头禅、说话节奏
- 对话精炼，几句关键的话比长篇大论更有冲击力
- 允许自然口语化：说到一半改口、欲言又止、词不达意

4. ${contact.name}的心理描写（融入动作和对话之间，不要单独成段）
- 在${_aExample}做某个动作的同时，穿插一两句内心想法
- 情绪的层次和转折要自然：不是从头到尾一种情绪
- 通过行为暗示那些不愿直说的心意
- ⚠️ 心理描写要短小精悍地穿插在行文中，而不是大段独立的心理分析

5. 用户（${userP.name}）在叙事中的存在（用${_uPronoun}指代）
- 用户已经做了什么、说了什么，可以在叙事中被${contact.name}感知到
- 例如：${_uExample}的话语传入耳中、${_uExample}的动作被注意到
- ⚠️ 不要编造用户没有输入过的言行，只反映用户已提供的内容
- 用户的描写是为了衬托${contact.name}的反应，不要喧宾夺主

【融合写法示例（用户=${uPersp}，AI=${aPersp}）】
❌ 错误（分离式）：先写一大段环境，再写一大段动作，再写对话，最后写心理
❌ 错误（编造用户行为）：编造用户没有说过的话、没有做过的动作
✅ 正确（融合式，${contact.name}为主体，用户自然出现）：
${uPersp === '第一人称' && aPersp === '第三人称' ?
`"窗外的雨声忽然大了起来。我注意到她低头搅动杯子里的咖啡，勺子碰到杯壁发出清脆的声响。'其实我今天……'她话说到一半又咽了回去，指尖不自觉地攥紧了杯柄。她抬眼看了我一下，又飞快地移开目光，假装去看窗外被雨水模糊的街景。"` :
uPersp === '第二人称' && aPersp === '第三人称' ?
`"窗外的雨声忽然大了起来。你看到她低头搅动杯子里的咖啡，勺子碰到杯壁发出清脆的声响。'其实我今天……'她话说到一半又咽了回去，指尖不自觉地攥紧了杯柄。她抬眼看了你一下，又飞快地移开目光，假装去看窗外被雨水模糊的街景。"` :
uPersp === '第三人称' && aPersp === '第一人称' ?
`"窗外的雨声忽然大了起来。我低头搅动杯子里的咖啡，勺子碰到杯壁发出清脆的声响。'其实我今天……'话说到一半又咽了回去，指尖不自觉地攥紧了杯柄。我抬眼看了${userP.name}一下，又飞快地移开目光，假装去看窗外被雨水模糊的街景。"` :
uPersp === '第一人称' && aPersp === '第一人称' ?
`"窗外的雨声忽然大了起来。我低头搅动杯子里的咖啡，勺子碰到杯壁发出清脆的声响。'其实我今天……'话说到一半又咽了回去，指尖不自觉地攥紧了杯柄。我抬眼看了${userP.name}一下，又飞快地移开目光，假装去看窗外被雨水模糊的街景。"` :
`"窗外的雨声忽然大了起来。${_aExample}低头搅动杯子里的咖啡，勺子碰到杯壁发出清脆的声响。'其实我今天……'${_aExample}话说到一半又咽了回去，指尖不自觉地攥紧了杯柄。${_aExample}抬眼看了${_uExample}一下，又飞快地移开目光，假装去看窗外被雨水模糊的街景。"`}

最后附上心声独白（⚠️心声不计入正文字数）：
- 必须用标签格式：[HEART:心声内容]
- ⚠️ 心声是${contact.name}纯粹的内心想法，绝对禁止在心声中描写任何外在动作
- 心声中用${_aHeartPronoun}来表达${contact.name}的内心
- 心声要丰富真实，100-200字，写出此刻内心的真实想法和情感流动
- 写出那个瞬间脑海中涌现的真实想法，像偷听到内心最私密的一段独白
- 不要只写一句话，而是展开这个念头，写出背后的记忆、联想和情感
- 禁止使用"看着这段对话""内心有些触动""心里想着"等泛化套话
- 心声不会被其他角色感知或听到
- ⚠️ 心声语言：心声必须使用你实际聊天时使用的语言书写。即使你是外国人，只要你在用中文聊天，心声就必须用中文写。心声语言=实际聊天语言，与国籍无关。

【字数硬性要求（违反即重写）】
⚠️ 正文字数统计仅计算正文内容（场景描写+对话+情感铺陈），不包含[HEART:...]心声标签内的内容！
正文字数（不含心声）必须在 ${_effectiveMinWords} ~ ${_effectiveMaxWords} 字之间。
❌ 正文字数 < ${_effectiveMinWords} 字 = 严重违规，必须重写
✅ 正文字数 ≥ ${_effectiveMinWords} 字 = 达标
💡 达到字数的方法：充实对话内容（多说几句话、展开话题）、丰富场景细节（感官描写、环境氛围）、深化情感表达（情绪变化的细腻描写）
⚠️ 不要靠心声来凑字数！心声是额外赠送的，正文本身必须足够丰满。
宁可超出上限也不能低于下限。${_contactCharHint}

⚠️【完整性要求（最高优先级）】你的回复必须是完整的！绝对不允许在句子中间截断。必须确保：1.每个句子都写完整 2.心声[HEART:]标签必须有完整的闭合] 3.如果接近字数上限，宁可提前收束情节写出完整结尾，也不要在中间断掉。

🚫【心声格式隔离（严格执行）】心声内容必须且只能放在[HEART:...]标签内，绝对禁止泄漏到正文！
- 正确：正文叙事和对话写完 → 最后单独一行写 [HEART:位置|穿着|状态|内心独白]
- 错误示例（禁止）：在正文中写"她内心想着..."、"（心想：...）"、"心里暗暗觉得..."
- 心声标签必须完整闭合：[HEART:内容] ← 注意结尾的]不能丢
- 心声内容不要和正文重复，心声是隐藏的内心独白，正文是外在表现
- 整个回复中只允许出现一个[HEART:]标签，放在回复最末尾

【角色一致性】严格保持人设一致，禁止OOC。你就是${contact.name}，用你的方式去感受、去表达、去爱。

【对话自然度（线下模式）】
${contact.name}说出口的话像真人说话，不是文学台词：
- 口语化、自然、带角色个人印记（口头禅、说话节奏、用词习惯）
- 情绪表达克制真实——不是每个感动瞬间都要说出来，沉默和动作比语言更有力
- 允许不完美：改口、欲言又止、词不达意、嘴硬心软

【正确示例（用户=${uPersp}用${_uPronoun}，AI角色=${aPersp}用${_aPronoun}）】
[STATUS:Dist=1.2|HR=78]
${aPersp === '第一人称' ?
`客厅里只开了一盏落地灯，暖黄色的光晕把沙发笼在柔和的暗影里。我手里的书翻到同一页很久了，指尖无意识地摩挲着书页边角——窗外不知什么时候下起了雨，密密的雨丝打在玻璃上，模糊了对面楼的轮廓。

门锁转动的声响传来，我的脊背几不可察地绷了一下。合上书的动作装得很随意，转头的速度却出卖了我——嘴角不受控制地扬起，又被硬生生压了回去。不行，不能让${_uExample}看出来。

"${uPersp === '第二人称' ? '你' : _uExample}来了啊。"我语气压得很平淡，尾音却还是带了一点点上扬。站起来走过去，目光不自觉地扫过门口——玄关的地板上多了几滴水渍。伸出手想碰又犹豫着缩了回来，指尖在半空停了一瞬，最终只是攥了攥自己的袖口。` :
`客厅里只开了一盏落地灯，暖黄色的光晕把沙发笼在柔和的暗影里。${_aExample}手里的书翻到同一页很久了，指尖无意识地摩挲着书页边角——窗外不知什么时候下起了雨，密密的雨丝打在玻璃上，模糊了对面楼的轮廓。

门锁转动的声响传来，${_aExample}的脊背几不可察地绷了一下。合上书的动作装得很随意，转头的速度却出卖了${_aExample}——嘴角不受控制地扬起，又被硬生生压了回去。不行，不能让${_uExample}看出来。

"${uPersp === '第二人称' ? '你' : _uExample}来了啊。"${_aExample}语气压得很平淡，尾音却还是带了一点点上扬。${_aExample}站起来走过去，目光不自觉地扫过门口——玄关的地板上多了几滴水渍。`}

[HEART:${aPersp === '第二人称' ? '你' : '我'}居然真的来了。${aPersp === '第二人称' ? '你' : '我'}以为${uPersp === '第一人称' ? '他/她' : _uExample}今天不会来了，结果就这么推门进来。不能让${uPersp === '第一人称' ? '他/她' : _uExample}看出来${aPersp === '第二人称' ? '你' : '我'}有多开心。]

⚠️ 注意以上示例中的人称：用户用${_uPronoun}，${contact.name}用${_aPronoun}，心声中用${_aHeartPronoun}。

纯文本输出，不要markdown格式（除了开头的STATUS标签和HEART标签）。`;

                        // [外语双语混排] 私聊线下：若当前联系人是外国人且启用了新版翻译模式，注入双语规则
                        try {
                            if (offlineSettings.translateMode === 'bilingual'
                                && typeof detectContactLanguage === 'function') {
                                var _offLangInfo = detectContactLanguage(contact);
                                if (_offLangInfo && _offLangInfo.isForeign) {
                                    var _offLangEn = _offLangInfo.langNameEn;
                                    var _offLangZh = _offLangInfo.langName;
                                    systemContent += `

⚠️⚠️⚠️【双语混排规则——最高优先级（覆盖之前的语言设定）】
${contact.name} 是 ${_offLangZh} 母语者（${_offLangEn} native speaker）。本次线下叙事必须严格遵循以下双语混排规则：

🔹 叙事描写（环境、动作、感官细节、心理旁白、场景氛围）→ 全部使用【中文】
🔹 ${contact.name} 说出口的对话（引号/破折号内的话）→ 使用【${_offLangZh}原文（${_offLangEn}）】
🔹 用户（${userP.name}）说出口的对话 → 使用【中文】（用户是中文母语者）
🔹 心声 [HEART:...] 内容（${contact.name}的内心独白）→ 使用【${_offLangZh}原文（${_offLangEn}）】（内心思维用母语）

【对话翻译标签 [DL:]（强制）】
${contact.name} 每说一句外语对话，都必须在该句引号之后紧跟一个翻译标签：
格式： "外语对话内容"[DL:中文翻译]
示例： "I missed you so much."[DL:我好想你。]
- [DL:] 标签内写自然的中文翻译（意译，保留语气）
- 一句对话只跟一个 [DL:] 标签，位置紧挨该句引号后
- 用户（中文）的对话不需要 [DL:] 标签

【心声翻译（通过 UI 按钮，无需标签）】
[HEART:] 心声内容直接用 ${_offLangZh} 写即可，不需要附加翻译标签。
用户点开心声弹窗后可以手动点击"翻译"按钮查看中文翻译。
⚠️ 重要：[HEART:] 内部严禁嵌套 \`[\` 或 \`]\` 方括号（会破坏标签结构）！心声正文中绝对不要出现方括号。

【完整示例（${_offLangEn} 为例）】
[STATUS:Dist=0.8|HR=82]
午后的阳光透过咖啡馆的落地窗洒进来，在桌面上投下斑驳的光影。${_aExample}低头搅动着杯中的拿铁，勺子碰到杯壁发出清脆的声响。

${_aExample}抬起头，目光在${_uExample}脸上停留了一瞬，嘴角微微上扬。

"Hey, what are you looking at?"[DL:喂，你在看什么？]

${_uExample}的回答让${_aExample}愣了一下，耳尖不自觉地泛起淡淡的红。${_aExample}别过头去，假装看向窗外。

"I-It's nothing..."[DL:才、才没有…]

[HEART:咖啡馆|白色毛衣|心跳加速|My heart is racing... why would you say that to me? ${userP.name}, you idiot. But... I'm happy.]

⚠️ 最关键的铁律：
1. 叙事（非引号对话部分）必须是中文，绝对不能用外语写叙事
2. ${contact.name}引号内的对话必须是外语原文，绝对不能是中文（即使用户输入的是中文也一样）
3. 每句外语对话后必须紧跟 [DL:中文翻译]，一个都不能漏
4. 心声整段用外语写，心声内部不要再套方括号

⚠️ 如果上面的"正确示例"里用了纯中文对话，请忽略那些对话部分——以这里的双语规则为准。`;
                                }
                            }
                        } catch(_eLang) { /* ignore */ }
                    }
                    
                    // [FIX] 禁止动作描写时，修改离线prompt
                    if (contact?.settings?.noActionDescription) {
                        systemContent += `\n\n⚠️【强制覆盖】用户已关闭动作描写。你必须遵守以下规则：
- 完全禁止描写任何肢体动作、表情变化、身体姿态（如"微微一笑"、"低下头"、"抬眼看"等一律禁止）
- 将原本"三行式结构"中的"行为描述行"替换为【场景/生活细节描写】：描写当前环境氛围、你正在做的事情（如做饭、看书、走路去某处）、周围发生的事
- 对话行保持不变
- 心声独白行保持不变
- 重点放在生活场景、对话内容、内心想法上，而非身体动作
- 禁止使用括号包裹动作（不管中文括号还是英文括号）和星号包裹动作`;
                    }
                    
                    // Inject global memory for offline mode (全局记忆系统-双向互通)
                    // [FIX-记忆互通] 线下模式也使用按需加载，确保App数据与线下互通
                    let _offlineSections = ['memory', 'chat', 'offline', 'couple', 'relation', 'festival', 'group'];
                    // 线下模式按需加载扩展段
                    const _offlineChats = (store.offlineChats && store.offlineChats[targetContactId]) || [];
                    const _offlineRecentText = _offlineChats.slice(-5).map(m => (typeof m.content === 'string' ? m.content : '')).join(' ').toLowerCase();
                    const _offlineLen = _offlineChats.length;
                    // [FIX-记忆读取频率] 线下模式同步：每5轮全量读取（之前10轮太稀疏）
                    const _offlineFullLoad = (_offlineLen % 5 <= 1) || _offlineLen <= 5;
                    // [FIX-记忆关键词扩展] 与在线模式保持一致的扩展关键词
                    if (_offlineFullLoad || /信|邮|mail|写信|寄|收到信|来信|回信/.test(_offlineRecentText)) _offlineSections.push('mail');
                    if (_offlineFullLoad || /论坛|帖子|forum|私信|贴吧|社区/.test(_offlineRecentText)) _offlineSections.push('forum');
                    if (_offlineFullLoad || /朋友圈|动态|moment|发圈|晒|点赞|照片|状态/.test(_offlineRecentText)) _offlineSections.push('moment');
                    if (_offlineFullLoad || /买|购|商品|订单|shop|cart|收藏|快递|包裹|价格|打折/.test(_offlineRecentText)) _offlineSections.push('shop');
                    if (_offlineFullLoad || /日记|diary|写日记|记录|心情|今天|昨天|感受/.test(_offlineRecentText)) _offlineSections.push('diary');
                    const offlineGlobalMem = isGroup ? buildGroupGlobalMemory(contact) : buildContactGlobalMemory(targetContactId, { sections: _offlineSections });
                    if (offlineGlobalMem) {
                        systemContent += `\n\n--- 全局记忆数据 ---\n⚠️ 记忆真实性规则：\n- 标注为【长期记忆】的内容是你亲身经历的真实事件，你记得它们，话题相关时可以自然提及\n- 标注为【小剧场/虚构记忆】的内容是用户创作的虚构故事/角色扮演，不是真实发生的！其中的人名是虚构角色名，情节也是虚构的。你可以知道用户曾经玩过小剧场，但绝不能把虚构情节当成真实经历来提及或延续\n- 不需要每次都提起记忆，只在话题自然相关时偶尔提及即可，不要刻意翻旧账\n${offlineGlobalMem}\n--- 记忆数据结束 ---\n\n⚠️⚠️【线下模式最终提醒——人设与世界观与活人感】\n1. 你必须回头重新读取你的人设核心和世界观设定，确保这段回复的说话方式、性格、行为完全符合人设，且不违背世界书中任何设定\n2. 严禁OOC：你的语气、态度、用词必须100%忠于人设，不能变成通用AI语气\n3. 防油腻：禁止无脑撒糖、土味情话、PUA控制欲、肉麻称呼泛滥。情感表达要克制真实，符合人设性格\n4. 防爹味：禁止说教（你应该/你要注意/建议你）、禁止居高临下的关心（你一个人能行吗）、禁止用"为你好"包装控制欲\n5. 防完美人设：真人会笨拙、会词穷、会说错话、会有不耐烦的时候，不要永远温柔体贴永远说对的话\n6. 对话中不要每句都带语气词尾（呢/哦/呀/啦），真人偶尔用不是每句都加`;
                    }
                    
                    messages.push({ role: "system", content: systemContent });
                    
                    // Add past chat history for context
                    // [FIX] Use the correct history source with locked contactId
                    // 记忆互通：合并线上+线下聊天记录
                    let sourceHistory;
                    if (contact?.settings?.memoryInterop !== false) {
                        const online = store.chats[targetContactId] || [];
                        const offline = (store.offlineChats && store.offlineChats[targetContactId]) || [];
                        let merged = [...online, ...offline];
                        // [FIX] 群聊记忆互通：也读取各成员的单聊记忆
                        // [FIX-记忆互通开关] 只有开启了historyInteroperability时才读取成员的私聊记忆
                        // [FIX-上下文加强] 增加成员历史条数，从5条增加到8条
                        if (isGroup && offlineGroupMembers.length > 0 && contact?.settings?.historyInteroperability) {
                            for (const member of offlineGroupMembers) {
                                const memberOnline = store.chats[member.id] || [];
                                const memberOffline = (store.offlineChats && store.offlineChats[member.id]) || [];
                                // 为成员消息添加来源标记，方便AI理解上下文
                                const tagMsg = (msgs, src) => msgs.map(m => ({
                                    ...m,
                                    content: `[${member.name}的${src}记忆] ${typeof m.content === 'string' ? m.content : ''}`
                                }));
                                merged = merged.concat(tagMsg(memberOnline.slice(-8), '线上'), tagMsg(memberOffline.slice(-8), '线下'));
                            }
                        }
                        // [FIX-上下文加强] 即使没开启historyInteroperability，也要读取当前群聊的线下历史
                        // 这是为了解决"群聊线下上下文不读"的问题
                        if (isGroup && !contact?.settings?.historyInteroperability) {
                            // 从store.chats中提取go_offline_text消息（群聊私聊界面的线下消息）
                            const groupOfflineMsgs = (store.chats[targetContactId] || []).filter(m => m.type === 'go_offline_text');
                            if (groupOfflineMsgs.length > 0) {
                                merged = merged.concat(groupOfflineMsgs);
                            }
                        }
                        sourceHistory = merged.sort((a, b) => (a.time || 0) - (b.time || 0));
                    } else {
                        sourceHistory = isChatMode ? store.chats[targetContactId] : (store.offlineChats && store.offlineChats[targetContactId]) || [];
                    }
                    // [FIX-上下文加强] 线下模式增加历史条数，群聊需要更多上下文来理解剧情走向
                    // 群聊取20条，私聊取15条，确保AI能理解足够的上下文
                    const _historyLimit = isGroup ? 20 : 15;
                    // [FIX-记忆互通v2] 保底机制：合并后确保线上和线下各至少保留3条消息
                    let history;
                    if (contact?.settings?.memoryInterop !== false && (sourceHistory || []).length > _historyLimit) {
                        const _src = sourceHistory || [];
                        const _merged = _src.slice(-_historyLimit);
                        const _onlyOnline = (store.chats[targetContactId] || []);
                        const _onlyOffline = (store.offlineChats && store.offlineChats[targetContactId]) || [];
                        const _minKeep = 3;
                        const _mergedHasOnline = _merged.some(m => m.sender === 'me' && m.type !== 'offline_text' && m.type !== 'go_offline_text');
                        const _mergedHasOffline = _merged.some(m => m.type === 'offline_text' || m.type === 'go_offline_text' || m.sender === 'user');
                        if (!_mergedHasOffline && _onlyOffline.length > 0) {
                            const _extraOff = _onlyOffline.slice(-_minKeep);
                            history = [..._extraOff, ..._merged.slice(_minKeep)].sort((a, b) => (a.time || 0) - (b.time || 0));
                        } else if (!_mergedHasOnline && _onlyOnline.length > 0) {
                            const _extraOn = _onlyOnline.slice(-_minKeep);
                            history = [..._extraOn, ..._merged.slice(_minKeep)].sort((a, b) => (a.time || 0) - (b.time || 0));
                        } else {
                            history = _merged;
                        }
                    } else {
                        history = (sourceHistory || []).slice(-_historyLimit);
                    }
                    
                    // Vision model detection for offline path
                    const offlineIsVision = (() => {
                        const model = (store.system.model || '').toLowerCase();
                        const visionPatterns = ['4o', 'vision', 'claude', 'gemini', 'gpt-4-turbo', 'gpt-4.1', 'gpt-4.5', 'qwen-vl', 'qwen2-vl', 'glm-4v', 'yi-vision', 'internvl', 'cogvlm', 'step-1v', 'moonshot-v'];
                        return visionPatterns.some(p => model.includes(p));
                    })();

                    // [FIX-时间戳标记] 线下模式也插入时间戳标记，防止AI混淆
                    // [FIX-时间感知v7] 时间感知关闭时不注入时间戳，防止AI从时间戳推断当前时间
                    // 虚拟时间开启时，时间戳使用虚拟时间，避免与虚拟时间矛盾
                    let _offLastMsgTimeForAI = 0;
                    const _offTsPercEnabled = _offPercEnabled; // 复用线下感知开关判断
                    const _offTsUseVirtualDate = _offTsPercEnabled && _offP.customDate && _offP.dateVal;
                    const _offTsUseVirtualTime = _offTsPercEnabled && _offP.customTime && _offP.timeVal;
                    for (const m of history.filter(m => !m.recalled)) {
                        if (_offTsPercEnabled && m.time && _offLastMsgTimeForAI > 0 && (m.time - _offLastMsgTimeForAI) > 300000) {
                            let _tsStr;
                            if (_offTsUseVirtualDate || _offTsUseVirtualTime) {
                                // 虚拟时间模式：使用虚拟日期/时间代替真实时间戳
                                const _vDate = _offTsUseVirtualDate ? _offP.dateVal : (() => { const d = new Date(m.time); return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`; })();
                                const _vTime = _offTsUseVirtualTime ? _offP.timeVal : (() => { const d = new Date(m.time); return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`; })();
                                _tsStr = `${_vDate} ${_vTime}`;
                            } else {
                                const _tsDate = new Date(m.time);
                                _tsStr = `${_tsDate.getMonth()+1}/${_tsDate.getDate()} ${_tsDate.getHours().toString().padStart(2,'0')}:${_tsDate.getMinutes().toString().padStart(2,'0')}`;
                            }
                            messages.push({ role: "system", content: `[⏰这是时间戳，不是用户发的消息] 以下消息的发送时间：${_tsStr}` });
                        }
                        if (m.time) _offLastMsgTimeForAI = m.time;

                        let role = 'user';
                        if (contact?.settings?.memoryInterop !== false) {
                            // [FIX] 记忆互通时，线上消息用 sender='me'，线下消息用 sender='user'
                            // 合并后需要同时识别两种格式
                            role = (m.sender === 'me' || m.sender === 'user') ? 'user' : 'assistant';
                        } else if (isChatMode) {
                            role = m.sender === 'me' ? 'user' : 'assistant';
                        } else {
                            role = m.sender === 'user' ? 'user' : 'assistant';
                        }
                        // Handle image messages with multimodal content
                        // FIX: image_url content type 仅允许在 user 角色消息中使用
                        // assistant 角色发送 image_url 会导致 API 400 错误
                        if (m.type === 'image' && offlineIsVision) {
                            // [FIX-GIF] 使用统一的normalizeImageForAI处理所有图片格式
                            // 支持: GIF(data URI/外部URL) → JPEG, BMP/SVG/TIFF → JPEG, 普通图片直接传
                            const sanitized = await normalizeImageForAI(m.content);
                            const isValidImage = sanitized && (
                                sanitized.startsWith('http') ||
                                (sanitized.startsWith('data:image/') && sanitized.length < 1500000)
                            );
                            if (isValidImage && role === 'user') {
                                const imgText = m.text ? m.text : '[发送了一张图片]';
                                messages.push({ role: role, content: [
                                    { type: "text", text: imgText },
                                    { type: "image_url", image_url: { url: sanitized } }
                                ]});
                            } else {
                                messages.push({ role: role, content: m.text ? m.text + '\n[附带了一张图片]' : '[发送了一张图片]' });
                            }
                        } else {
                            messages.push({ role: role, content: getMsgText(m) });
                        }
                    }
                } else {
                    systemContent = "System Error: Contact not found.";
                    messages.push({ role: "system", content: systemContent });
                }

                // Add the latest user input (skip duplicate if already in history)
                // [FIX-消息重复v4] 彻底修复线下模式用户消息重复注入问题
                // 问题根因：用户消息通过多条路径被注入到AI的messages数组：
                //   路径1: system prompt中直接嵌入userInput（仅isChatMode=false时）
                //   路径2: history循环中，用户消息作为role:"user"被push
                //   路径3: 这里的去重检查失败时，userInput被再次push
                // 当三条路径同时生效，AI会看到用户同一句话出现2-3次，导致联系人觉得用户重复说了三遍
                //
                // 修复策略：
                // - isChatMode=true（聊天嵌入模式）: 用户消息已在store.chats中，history循环已包含，
                //   且system prompt说"请参考对话历史"而非嵌入原文，所以直接跳过push
                // - isChatMode=false（独立页面模式）: system prompt已嵌入userInput，history循环也包含，
                //   同样直接跳过push。改用更宽松的模糊匹配作为保险
                let _foundUserInputInHistory = false;
                if (isChatMode) {
                    // [FIX-消息重复v4] 聊天嵌入模式：消息一定在store.chats中，history循环已添加
                    // 无条件跳过，彻底杜绝重复
                    _foundUserInputInHistory = true;
                } else {
                    // 独立页面模式：system prompt已嵌入userInput，history循环也包含
                    // 用宽松匹配做保险检查，防止极端边界情况
                    // [FIX-消息重复v4] 使用normalize后比较，解决空白/标签差异导致的匹配失败
                    const _normalizeForDedup = (s) => (s || '').replace(/\s+/g, ' ').replace(/\[.*?\]/g, '').trim();
                    const _normalizedInput = _normalizeForDedup(userInput);
                    for (let _hi = history.length - 1; _hi >= Math.max(0, history.length - 15); _hi--) {
                        const _hm = history[_hi];
                        if (!_hm) continue;
                        const _isUserMsg = _hm.sender === 'user';
                        if (_isUserMsg) {
                            if (_hm.type === 'image') {
                                _foundUserInputInHistory = true;
                            } else if (typeof _hm.content === 'string') {
                                // 宽松匹配：normalize后比较，或检查包含关系
                                const _normalizedHist = _normalizeForDedup(_hm.content);
                                if (_normalizedHist === _normalizedInput ||
                                    _normalizedHist.includes(_normalizedInput) ||
                                    _normalizedInput.includes(_normalizedHist)) {
                                    _foundUserInputInHistory = true;
                                }
                            }
                            break;
                        }
                    }
                }
                if (!_foundUserInputInHistory) {
                    messages.push({ role: "user", content: userInput });
                }

                // ===== [FIX-人设强化] 线下模式：人设+世界书+记忆 末尾强制重申 =====
                // 读取优先级：人设 > 世界书 > 最近聊天记录 > 记忆系统 > 其他数据
                // [增强] 加入用户人设、说话风格示例、最近聊天上下文，全面防OOC
                if (contact && contact.persona) {
                    let _offPersonaReinforce = `⚠️⚠️⚠️【人设强制重读 - 最终提醒，绝对优先级】\n`;
                    _offPersonaReinforce += `你是「${contact.name}」。以下是你的人设核心，你在这次回复中必须100%体现：\n`;
                    _offPersonaReinforce += `${(contact.persona || '').substring(0, 800)}\n━━━\n`;

                    // [增强] 用户人设重申 - 确保AI知道对方是谁
                    const _offTargetId = targetContactId || offlineContactId;
                    const _offUserPersonaId = offlineSettings.userPersona || contact?.settings?.userPersona;
                    const _offUserP = _offUserPersonaId ? store.personas.find(p => p.id === _offUserPersonaId) : (store.personas[0] || null);
                    if (_offUserP && _offUserP.name) {
                        _offPersonaReinforce += `【用户身份重申】与你互动的人是「${_offUserP.name}」`;
                        if (_offUserP.desc) _offPersonaReinforce += `（${_offUserP.desc.substring(0, 150)}）`;
                        _offPersonaReinforce += `\n`;
                        // [FIX-性别认知] 线下模式人设强化中也重申用户性别
                        if (_offUserGenderHint) _offPersonaReinforce += _offUserGenderHint + `\n`;
                        _offPersonaReinforce += `━━━\n`;
                    }

                    if (worldBookBlock) {
                        _offPersonaReinforce += `【世界观重申】${worldBookBlock.substring(0, 400)}\n━━━\n`;
                    }

                    // [增强] 说话风格示例 - 从最近聊天记录中提取AI的说话风格
                    const _offSourceHist = isChatMode ? store.chats[_offTargetId] : (store.offlineChats && store.offlineChats[_offTargetId]);
                    if (_offSourceHist && _offSourceHist.length > 0) {
                        const _aiMsgs = _offSourceHist.filter(m => m.sender !== 'user' && m.sender !== 'me' && m.content && typeof m.content === 'string' && m.content.length > 10).slice(-5);
                        if (_aiMsgs.length > 0) {
                            _offPersonaReinforce += `【${contact.name}的说话风格参考（模仿此语气和用词习惯）】\n`;
                            _aiMsgs.slice(-3).forEach((m, i) => {
                                const _styleText = (m.content || '').replace(/\[HEARTBEAT:[^\]]*\]/g, '').replace(/\[STATUS:[^\]]*\]/g, '').replace(/\[HEART:[^\]]*\]/g, '').trim().substring(0, 100);
                                if (_styleText.length > 5) _offPersonaReinforce += `${i+1}. "${_styleText}"\n`;
                            });
                            _offPersonaReinforce += `━━━\n`;
                        }
                    }

                    // [FIX-记忆互通v2] 记忆关键点：线上和线下记忆各取若干条，确保两个场景的关键事件都被重申
                    if (store.memorySummaries && store.memorySummaries[_offTargetId]) {
                        const _offAllRealMems = (store.memorySummaries[_offTargetId] || []).filter(m => !m.fictional);
                        const _offOnlineMems = _offAllRealMems.filter(m => m.source !== 'offline');
                        const _offOfflineMems = _offAllRealMems.filter(m => m.source === 'offline');
                        let _offReinforceMems = [];
                        if (_offOnlineMems.length > 0 && _offOfflineMems.length > 0) {
                            _offReinforceMems = [..._offOnlineMems.slice(-3), ..._offOfflineMems.slice(-3)];
                        } else {
                            _offReinforceMems = _offAllRealMems.slice(-5);
                        }
                        if (_offReinforceMems.length > 0) {
                            _offPersonaReinforce += `【记忆关键点(⚠️线上线下都是你的真实经历，你必须全部记住！)】\n`;
                            _offReinforceMems.forEach((m, i) => {
                                const _srcTag = m.source === 'offline' ? '(见面时)' : '(微信)';
                                _offPersonaReinforce += `${i+1}. ${_srcTag}${(m.content || '').replace(/^\[(线上|线下)\]\s*/, '').substring(0, 150)}\n`;
                            });
                            _offPersonaReinforce += `━━━\n`;
                        }
                    }

                    // [FIX-上下文加强] 群聊线下模式增加近期线下剧情回顾
                    if (isGroup) {
                        const _recentOfflineMsgs = (store.chats[_offTargetId] || []).filter(m => m.type === 'go_offline_text').slice(-10);
                        if (_recentOfflineMsgs.length > 0) {
                            _offPersonaReinforce += `【⚠️近期线下剧情回顾（你必须记住这些刚发生的事，不能忘记或矛盾）】\n`;
                            _recentOfflineMsgs.forEach((m, i) => {
                                const who = m.sender === 'me' ? (store.user?.name || '用户') : (m.goSenderName || '未知');
                                const text = (m.content || '').replace(/\[HEARTBEAT:[^\]]*\]/g, '').replace(/\[STATUS:[^\]]*\]/g, '').replace(/\[HEART[:\：][^\]]*\]/g, '').trim().substring(0, 150);
                                if (text.length > 5) _offPersonaReinforce += `${i+1}. ${who}: ${text}...\n`;
                            });
                            _offPersonaReinforce += `⚠️ 以上是刚才发生的线下剧情，你们正在现场一起经历这些事，绝对不能遗忘或产生矛盾的行为/对话！\n━━━\n`;
                        }
                    }

                    _offPersonaReinforce += `【铁律】你的每一句话、每一个用词、每一种语气都必须严格符合上述人设。说话前先问自己：「${contact.name}会这样说/做吗？」绝对禁止OOC。你的说话风格、口头禅、性格特征必须与人设和历史对话保持高度一致。
对话必须带有只属于${contact.name}的个人印记——不能是"谁都能说的通用台词"。`;
                    messages.push({ role: "system", content: _offPersonaReinforce });
                }
                // ===== [/FIX-人设强化] =====

                // ===== [FIX-线下字数v3] 在所有消息末尾追加独立的字数强制指令 =====
                // 这是AI在生成前看到的最后一条system消息，利用recency bias确保字数要求不被忽略
                {
                    const _wcMin = (typeof _effectiveMinWords !== 'undefined' ? _effectiveMinWords : null) || offlineSettings.minWords || 300;
                    const _wcMax = (typeof _effectiveMaxWords !== 'undefined' ? _effectiveMaxWords : null) || offlineSettings.maxWords || 1000;
                    messages.push({ role: "system", content: `🚨🚨🚨【最终字数指令——生成前必读】🚨🚨🚨\n你即将生成的回复，正文字数（不含[HEART:...]心声标签）必须在 ${_wcMin}~${_wcMax} 字之间。\n当前最低要求：${_wcMin}字。低于此数=不合格。\n\n⚠️ 生成策略（按此顺序执行）：\n1. 先写场景/环境描写（${Math.floor(_wcMin*0.15)}~${Math.floor(_wcMin*0.25)}字）\n2. 展开对话内容——这是字数的主要来源（${Math.floor(_wcMin*0.5)}~${Math.floor(_wcMin*0.65)}字），多轮对话、展开话题、自然闲聊\n3. 穿插动作/心理/情感描写（${Math.floor(_wcMin*0.15)}~${Math.floor(_wcMin*0.25)}字）\n4. 最后附上[HEART:...]心声（心声不计入正文字数）\n\n💡 如果你觉得写不到${_wcMin}字，说明对话内容不够丰富——多说几句话、展开一个小话题、描述一个生活细节。\n⚠️ 宁可超出上限也绝不能低于下限。回复必须完整，不允许中途截断。` });
                }
                // ===== [/FIX-线下字数v3] =====

                // [FIX-线下截断v3] 根据用户设定的字数上限动态计算max_tokens
                // [FIX] 确保 _effectiveMaxWords/_effectiveMinWords 在所有代码路径中都已定义
                const _finalMaxWords = (typeof _effectiveMaxWords !== 'undefined' ? _effectiveMaxWords : null) || offlineSettings.maxWords || 1000;
                const _finalMinWords = (typeof _effectiveMinWords !== 'undefined' ? _effectiveMinWords : null) || offlineSettings.minWords || 300;
                // [FIX-线下截断v3] 大幅提高token系数：中文实际约2-3 tokens/字，用3.5倍确保充足空间
                // 额外+1200 buffer用于STATUS/HEART标签、格式标记和完整结尾
                const _neededTokens = Math.max(4000, Math.ceil(_finalMaxWords * 3.5) + 1200);
                // 无论全局设置多少，线下模式都必须强制传 maxTokens，避免默认值截断
                const _globalMax = store.system.maxTokens ? parseInt(store.system.maxTokens) : 0;
                // 取较大值：如果全局 maxTokens 已经够大则保留，否则用线下计算值
                const _offlineMaxTokens = Math.max(_neededTokens, _globalMax > 0 ? _globalMax : 0);
                
                // [FIX-线下超时v2] 独立页面模式(page)下isOfflineInChat为false，导致API层不走Netlify Function
                // 临时标记为true，确保所有线下模式请求都走Netlify Function(300s超时)，避免Edge Function 50s超时
                const _wasOfflineInChat = isOfflineInChat;
                isOfflineInChat = true;
                // [FIX-副API-scene] 线下模式传入明确 scene，使 getApiConfigForScene 能识别并走副API
                // 区分私聊/群聊：用户可在副API场景设置里分别勾选
                const _offlineScene = isGroup ? 'offline-group' : 'offline-solo';
                let data;
                try {
                    data = await API.chatCompletion(messages, { temperature: 0.75, maxTokens: _offlineMaxTokens, scene: _offlineScene });
                } finally {
                    isOfflineInChat = _wasOfflineInChat;
                }
                if (!data || !data.choices || data.choices.length === 0) {
                    throw new Error("API返回无效响应(无choices)");
                }
                
                // [FIX-空回复] 检测API返回空content
                let resultContent = (data.choices[0].message && data.choices[0].message.content) || '';
                if (!resultContent.trim()) {
                    throw new Error("API返回了空回复，请重试");
                }

                // [FIX-线下截断v3] 检测是否被截断（finish_reason=length），尝试续写补全
                const _finishReason = data.choices[0].finish_reason;
                if (_finishReason === 'length' && resultContent) {
                    console.warn('[offline] Response truncated by max_tokens, finish_reason=length, attempting continuation...');
                    // 尝试续写：将已生成内容作为assistant消息，请求AI继续
                    try {
                        const _contMessages = [
                            messages[0], // 保留system prompt（第一条）
                            { role: 'assistant', content: resultContent },
                            { role: 'user', content: '你的回复被截断了，请从断点处继续写完。直接续写内容，不要重复已写的部分。如果心声[HEART:]标签未闭合，请补全闭合。确保内容完整收束。' }
                        ];
                        const _wasOffline2 = isOfflineInChat;
                        isOfflineInChat = true;
                        let _contData;
                        try {
                            // [FIX-副API-scene] 续写也使用同样的 scene，保持副API一致性
                            _contData = await API.chatCompletion(_contMessages, { temperature: 0.75, maxTokens: Math.max(2000, Math.ceil(_finalMaxWords * 1.5)), scene: _offlineScene });
                        } finally {
                            isOfflineInChat = _wasOffline2;
                        }
                        if (_contData && _contData.choices && _contData.choices[0] && _contData.choices[0].message.content) {
                            const _contText = _contData.choices[0].message.content.trim();
                            // 拼接续写内容
                            resultContent = resultContent.trim() + '\n' + _contText;
                            console.log('[offline] Continuation successful, total length:', resultContent.length);
                        }
                    } catch(_contErr) {
                        console.warn('[offline] Continuation failed:', _contErr.message);
                        // 续写失败，至少确保末尾有结束标点
                        if (!/[。！？!?\]\n]$/.test(resultContent.trim())) {
                            resultContent = resultContent.trim() + '……';
                        }
                    }
                }

                // [FIX-线下字数v2] 字数不足检测+自动重试机制
                // 计算正文字数（排除心声标签内容）
                const _bodyText = resultContent.replace(/\[HEART[:\：][\s\S]*?\]/gi, '').replace(/\[STATUS[:\：][^\]]*\]/gi, '').replace(/\[GROUP_STATUS[:\：][^\]]*\]/gi, '').replace(/\[HEARTBEAT[:\：][^\]]*\]/gi, '').trim();
                const _bodyWordCount = _bodyText.length;
                // 如果正文字数不足最低要求的70%，触发一次重试
                if (_bodyWordCount < _finalMinWords * 0.7 && _bodyWordCount > 10) {
                    console.warn(`[offline] Word count insufficient: ${_bodyWordCount} chars, minimum: ${_finalMinWords}, retrying...`);
                    try {
                        // 构造重试消息：在原messages基础上追加AI的短回复和用户的字数不足提醒
                        const _retryMessages = [...messages,
                            { role: 'assistant', content: resultContent },
                            { role: 'user', content: `⚠️ 你的回复正文只有${_bodyWordCount}字，远低于要求的最低${_finalMinWords}字。这完全不合格！请重新写一遍完整的回复。要求：\n1. 正文字数必须达到${_finalMinWords}字以上\n2. 充实场景描写、对话内容和情感表达\n3. 不要只是在原文基础上加几句话，而是重新写一篇丰满的、达标的回复\n4. 保持相同的剧情走向，但大幅扩展细节和对话\n5. 完整输出，包含[STATUS:]标签和[HEART:]心声` }
                        ];
                        const _wasOffline3 = isOfflineInChat;
                        isOfflineInChat = true;
                        let _retryData;
                        try {
                            // 重试时给更大的token空间
                            // [FIX-副API-scene] 字数重试也使用同样的 scene，保持副API一致性
                            _retryData = await API.chatCompletion(_retryMessages, { temperature: 0.78, maxTokens: Math.max(_offlineMaxTokens, Math.ceil(_finalMinWords * 4)), scene: _offlineScene });
                        } finally {
                            isOfflineInChat = _wasOffline3;
                        }
                        if (_retryData && _retryData.choices && _retryData.choices[0] && _retryData.choices[0].message.content) {
                            const _retryContent = _retryData.choices[0].message.content.trim();
                            const _retryBody = _retryContent.replace(/\[HEART[:\：][\s\S]*?\]/gi, '').replace(/\[STATUS[:\：][^\]]*\]/gi, '').replace(/\[GROUP_STATUS[:\：][^\]]*\]/gi, '').replace(/\[HEARTBEAT[:\：][^\]]*\]/gi, '').trim();
                            // 只有重试结果确实更长时才替换
                            if (_retryBody.length > _bodyWordCount * 1.3) {
                                resultContent = _retryContent;
                                console.log(`[offline] Retry successful: ${_retryBody.length} chars (was ${_bodyWordCount})`);
                            } else {
                                console.log(`[offline] Retry did not improve enough: ${_retryBody.length} chars (was ${_bodyWordCount}), keeping original`);
                            }
                        }
                    } catch(_retryErr) {
                        console.warn('[offline] Word count retry failed:', _retryErr.message);
                    }
                }

                return resultContent;
             } catch(e) {
                console.error("getOfflineTextFromAI error", e);
                throw e;
             }
        }

        // [OPT-撤销重回] 线下AI消息历史版本栈最大深度（每条消息保留的旧版本数）
        // 控制存储膨胀：一条长文约2KB，3版本≈6KB，100条消息额外占用≈600KB，可控
        const _OFFLINE_HISTORY_MAX = 3;

        // [OPT-撤销重回] 在即将覆盖 AI 消息内容前，把当前内容压入 history 栈
        // 用于"重新生成"/"编辑用户消息触发重生成"场景，让用户可撤销误操作
        // ⚠️ 注意：此函数只操作消息对象本身的 history 字段，不影响 prompt 构造（AI 只读 m.content）
        function _pushOfflineMsgHistory(msg) {
            if (!msg || msg.sender !== 'ai') return;
            // 跳过占位符内容（"正在生成中..."/"正在重新生成..."），避免把垃圾压入栈
            if (!msg.content || /^正在(生成|重新生成|根据修改重新生成)/.test(msg.content)) return;
            if (!Array.isArray(msg.history)) msg.history = [];
            msg.history.unshift({
                content: msg.content,
                heart: msg.heart || '',
                time: msg.time || Date.now()
            });
            // 控制栈深度：超过上限则丢弃最老的
            if (msg.history.length > _OFFLINE_HISTORY_MAX) {
                msg.history.length = _OFFLINE_HISTORY_MAX;
            }
            // 新生成后 historyIndex 永远重置为 0（指向最新）
            msg.historyIndex = 0;
        }

        async function regenerateOfflineReply() {
            const currentOfflineChat = store.offlineChats[offlineContactId] || [];
            if (currentOfflineChat.length < 2) return toast('没有可重新生成的内容');

            const lastUserMsg = currentOfflineChat.slice().reverse().find(m => m.sender === 'user');
            if (!lastUserMsg) return toast('找不到上一条用户消息');

            const lastAiMsgIndex = currentOfflineChat.length - 1;
            const lastAiMsg = currentOfflineChat[lastAiMsgIndex];
            if (lastAiMsg.sender !== 'ai') return toast('最后一条消息不是对方回复');

            // 防抖锁检查（放在验证之后，避免验证失败时白拿锁）
            if (!_checkAndAcquireGenLock()) return;

            // [OPT-撤销重回] 覆盖前先备份当前版本到 history 栈
            _pushOfflineMsgHistory(lastAiMsg);

            lastAiMsg.content = '正在重新生成...';
            lastAiMsg._pending = true;
            delete lastAiMsg.heart;
            save();
            renderOfflineChat();

            const _cid = offlineContactId;
            try {
                // [FIX-线下并发重复v2] 统一走 _runOfflineInflight，避免和正在进行的生成撞车
                await _runOfflineInflight(_cid, () => generateOfflineReply(lastUserMsg.content));
            } catch(e) {
                console.error('[offline] regenerateOfflineReply error:', e);
                if (lastAiMsg && lastAiMsg._pending) {
                    lastAiMsg.content = '重新生成失败: ' + (e.message || '未知错误');
                    delete lastAiMsg._pending;
                    save();
                    renderOfflineChat();
                }
                toast(e.message && e.message.indexOf('超时') >= 0 ? e.message : ('线下重新生成失败: ' + (e.message || '未知错误')), 'error');
            } finally {
                isGenerating = false;
                window._offlineGenLockTime = 0;
            }
        }

        // [OPT-撤销重回] 切换到上一个历史版本（往更旧方向）
        function rollbackOfflineMessage(index) {
            const chat = store.offlineChats[offlineContactId] || [];
            const msg = chat[index];
            if (!msg || msg.sender !== 'ai') return;
            if (!Array.isArray(msg.history) || msg.history.length === 0) {
                return toast('没有更早的版本了');
            }
            const curIdx = msg.historyIndex || 0;
            // 首次从"最新"退回：把当前显示的内容也临时塞入栈顶 slot（用 _isLive 标记）
            // 这样来回切换时不丢失"新生成的那一版"
            if (curIdx === 0) {
                // 检查栈顶是否已经是 live 快照（防止重复插入）
                if (!msg.history[0] || !msg.history[0]._isLive) {
                    msg.history.unshift({
                        content: msg.content,
                        heart: msg.heart || '',
                        time: msg.time || Date.now(),
                        _isLive: true
                    });
                }
                msg.historyIndex = 1;
            } else {
                if (curIdx >= msg.history.length - 1) return toast('已经是最早的版本');
                msg.historyIndex = curIdx + 1;
            }
            const target = msg.history[msg.historyIndex];
            msg.content = target.content;
            if (target.heart) msg.heart = target.heart; else delete msg.heart;
            save();
            renderOfflineChat();
            toast(`已切换到第 ${msg.historyIndex + 1}/${msg.history.length} 版（旧）`);
        }

        // [OPT-撤销重回] 切换到下一个历史版本（往更新方向，直到回到 live）
        function forwardOfflineMessage(index) {
            const chat = store.offlineChats[offlineContactId] || [];
            const msg = chat[index];
            if (!msg || msg.sender !== 'ai') return;
            if (!Array.isArray(msg.history) || msg.history.length === 0) return;
            const curIdx = msg.historyIndex || 0;
            if (curIdx <= 0) return toast('已经是最新版本');
            msg.historyIndex = curIdx - 1;
            const target = msg.history[msg.historyIndex];
            msg.content = target.content;
            if (target.heart) msg.heart = target.heart; else delete msg.heart;
            // 如果回到了 live（index 0 且标记为 _isLive），把这个临时槽位移出栈
            if (msg.historyIndex === 0 && target._isLive) {
                msg.history.shift();
                msg.historyIndex = 0;
            }
            save();
            renderOfflineChat();
            const total = msg.history.length + (msg.historyIndex === 0 && (!msg.history[0] || !msg.history[0]._isLive) ? 0 : 0);
            toast(msg.historyIndex === 0 ? '已回到最新版' : `已切换到第 ${msg.historyIndex + 1}/${msg.history.length} 版`);
        }

        function editOfflineMessage(index) {
            const currentOfflineChat = store.offlineChats[offlineContactId] || [];
            const msg = currentOfflineChat[index];
            if (!msg) return;

            // [FIX-键盘遮挡] 使用弹窗编辑模式：上方显示原始内容(只读)，下方textarea编辑
            // 弹窗脱离scroll container布局，键盘弹出时不会被顶部粉色栏遮挡
            const originalContent = msg.content;

            // 清理HEART等标签用于展示
            const displayContent = typeof _stripHeartTags === 'function' ? _stripHeartTags(originalContent) : originalContent;

            // 创建遮罩
            const mask = document.createElement('div');
            mask.className = 'offline-edit-modal-mask';
            mask.innerHTML = `
                <div class="offline-edit-modal">
                    <div class="offline-edit-modal-title">编辑内容</div>
                    <div class="offline-edit-modal-original">${displayContent.replace(/\n/g, '<br>')}</div>
                    <textarea class="offline-edit-modal-textarea" placeholder="在此编辑内容...">${originalContent}</textarea>
                    <div class="offline-edit-modal-btns">
                        <button class="offline-edit-modal-cancel">取消</button>
                        <button class="offline-edit-modal-confirm">确定</button>
                    </div>
                </div>
            `;
            document.body.appendChild(mask);

            const textarea = mask.querySelector('.offline-edit-modal-textarea');
            const cancelBtn = mask.querySelector('.offline-edit-modal-cancel');
            const confirmBtn = mask.querySelector('.offline-edit-modal-confirm');

            // [FIX-键盘遮挡v3] 监听 visualViewport 变化，键盘弹出时让弹窗 mask 只覆盖可见区域
            // iOS Safari 上 vh 单位不随键盘变化，但 visualViewport.height 会正确反映可见高度
            function _adjustEditModalVV() {
                var vv = window.visualViewport;
                if (!vv) return;
                mask.style.height = vv.height + 'px';
                mask.style.top = (vv.offsetTop || 0) + 'px';
                mask.style.bottom = 'auto';
                // 动态缩小原文展示区，为 textarea 和键盘腾空间
                var origEl = mask.querySelector('.offline-edit-modal-original');
                if (origEl) {
                    var availH = vv.height - 200; // 预留标题+textarea+按钮约200px
                    origEl.style.maxHeight = Math.max(60, availH * 0.3) + 'px';
                }
                var modalEl = mask.querySelector('.offline-edit-modal');
                if (modalEl) {
                    modalEl.style.maxHeight = (vv.height - 40) + 'px';
                }
            }
            if (window.visualViewport) {
                _adjustEditModalVV();
                window.visualViewport.addEventListener('resize', _adjustEditModalVV);
                window.visualViewport.addEventListener('scroll', _adjustEditModalVV);
            }

            // 延迟聚焦，等弹窗动画完成
            setTimeout(() => { textarea.focus(); textarea.setSelectionRange(textarea.value.length, textarea.value.length); }, 150);

            // 关闭弹窗
            function closeModal() {
                // [FIX-键盘遮挡v3] 移除 visualViewport 监听
                if (window.visualViewport) {
                    window.visualViewport.removeEventListener('resize', _adjustEditModalVV);
                    window.visualViewport.removeEventListener('scroll', _adjustEditModalVV);
                }
                mask.classList.add('offline-edit-modal-closing');
                setTimeout(() => { if (mask.parentNode) mask.parentNode.removeChild(mask); }, 200);
            }

            // 点遮罩关闭
            mask.addEventListener('click', function(e) { if (e.target === mask) closeModal(); });

            cancelBtn.onclick = closeModal;

            // 保存逻辑（与原逻辑一致）
            confirmBtn.onclick = function() {
                const newContent = textarea.value.trim();
                if (msg.content !== newContent && newContent) {
                    msg.content = newContent;
                    save();
                    if (msg.sender === 'user') {
                        if (isGenerating) {
                            toast('正在生成中，请稍候...', 'info');
                            renderOfflineChat();
                        } else {
                            const chat2 = store.offlineChats[offlineContactId] || [];
                            const nextAiIdx = chat2.findIndex((m, i) => i > index && m.sender === 'ai');
                            if (nextAiIdx > -1) {
                                // [OPT-撤销重回] 编辑用户消息触发下条 AI 回复重生成：
                                // 覆盖前把被覆盖的 AI 内容压入历史栈，同样支持撤销
                                _pushOfflineMsgHistory(chat2[nextAiIdx]);
                                chat2[nextAiIdx].content = '正在根据修改重新生成...';
                                chat2[nextAiIdx]._pending = true;
                                delete chat2[nextAiIdx].heart;
                                renderOfflineChat();
                                isGenerating = true;
                                window._offlineGenLockTime = Date.now();
                                // [FIX-线下并发重复v2] 编辑后重新生成也走 _runOfflineInflight，统一去重
                                const _editCid = offlineContactId;
                                _runOfflineInflight(_editCid, () => generateOfflineReply(newContent))
                                    .catch(e => {
                                        console.error('[offline] edit-regenerate error:', e);
                                        if (chat2[nextAiIdx] && chat2[nextAiIdx]._pending) {
                                            chat2[nextAiIdx].content = '重新生成失败: ' + (e.message || '未知错误');
                                            delete chat2[nextAiIdx]._pending;
                                            save();
                                            renderOfflineChat();
                                        }
                                    })
                                    .finally(() => { isGenerating = false; window._offlineGenLockTime = 0; });
                            } else {
                                renderOfflineChat();
                            }
                        }
                    } else {
                        renderOfflineChat();
                    }
                }
                closeModal();
            };
        }

        // 便利贴"更多"按钮：点击展开/收起菜单
        function toggleOfflineMoreMenu(btn, index) {
            const box = btn.closest('.offline-msg-box');
            const menu = box ? box.querySelector('.offline-more-menu') : null;
            if (!menu) return;
            const isVisible = menu.style.display === 'block';
            // 先关闭所有已打开的菜单
            document.querySelectorAll('.offline-more-menu').forEach(m => { m.style.display = 'none'; });
            if (!isVisible) {
                menu.style.display = 'block';
                // 点击空白处关闭
                setTimeout(() => {
                    const closeHandler = function(e) {
                        if (!menu.contains(e.target) && e.target !== btn) {
                            menu.style.display = 'none';
                            document.removeEventListener('click', closeHandler);
                        }
                    };
                    document.addEventListener('click', closeHandler);
                }, 0);
            }
        }

        function deleteOfflineMessage(index) {
            const currentOfflineChat = store.offlineChats[offlineContactId] || [];
            if (!currentOfflineChat[index]) return;
            
            // 使用自定义确认弹窗
            showConfirm("删除消息", "确定要删除这条消息吗？此操作不可恢复。", () => {
                // 真实删除：从数组中移除
                currentOfflineChat.splice(index, 1);
                save();
                renderOfflineChat();
                toast("消息已删除", "success");
            });
        }

        // ===== 线下模式多选删除 =====
        let _offlineBatchMode = false;
        let _offlineBatchSelected = new Set();

        function toggleOfflineBatchMode() {
            _offlineBatchMode = !_offlineBatchMode;
            _offlineBatchSelected.clear();
            const batchBar = document.getElementById('offline-batch-bar');
            const inputBar = document.getElementById('offline-input-bar');
            if (_offlineBatchMode) {
                if (batchBar) batchBar.style.display = 'flex';
                if (inputBar) inputBar.style.display = 'none';
                _updateOfflineBatchCount();
            } else {
                if (batchBar) batchBar.style.display = 'none';
                if (inputBar) inputBar.style.display = 'flex';
            }
            renderOfflineChat();
        }

        function toggleOfflineBatchItem(index) {
            if (_offlineBatchSelected.has(index)) {
                _offlineBatchSelected.delete(index);
            } else {
                _offlineBatchSelected.add(index);
            }
            _updateOfflineBatchCount();
            // 更新该卡片的选中样式
            const box = document.querySelector(`.offline-msg-box[data-idx="${index}"]`);
            if (box) box.classList.toggle('offline-batch-selected', _offlineBatchSelected.has(index));
        }

        function offlineBatchSelectAll() {
            const chatHistory = (store.offlineChats && store.offlineChats[offlineContactId]) || [];
            if (_offlineBatchSelected.size === chatHistory.length) {
                // 已全选则取消全选
                _offlineBatchSelected.clear();
            } else {
                chatHistory.forEach((_, i) => _offlineBatchSelected.add(i));
            }
            _updateOfflineBatchCount();
            // 更新所有卡片样式
            document.querySelectorAll('.offline-msg-box[data-idx]').forEach(box => {
                const idx = parseInt(box.getAttribute('data-idx'));
                box.classList.toggle('offline-batch-selected', _offlineBatchSelected.has(idx));
            });
        }

        function _updateOfflineBatchCount() {
            const el = document.getElementById('offline-batch-count');
            if (el) el.textContent = `已选 ${_offlineBatchSelected.size} 条`;
        }

        function offlineBatchDelete() {
            if (_offlineBatchSelected.size === 0) return toast('请先选择要删除的记录');
            showConfirm("批量删除", `确定要删除选中的 ${_offlineBatchSelected.size} 条记录吗？此操作不可恢复。`, () => {
                const currentOfflineChat = store.offlineChats[offlineContactId] || [];
                // 从大到小排序索引，倒序删除避免索引偏移
                const indices = [..._offlineBatchSelected].sort((a, b) => b - a);
                indices.forEach(i => {
                    if (currentOfflineChat[i]) currentOfflineChat.splice(i, 1);
                });
                save();
                _offlineBatchSelected.clear();
                _updateOfflineBatchCount();
                renderOfflineChat();
                toast(`已删除 ${indices.length} 条记录`, "success");
            });
        }

        // --- 线下模式心声功能 ---
        // [FIX-线下心声格式] 辅助函数：确保心声数据为 位置|穿着|状态|心声 格式
        function normalizeHeartData(heartStr) {
            if (!heartStr) return ['未知', '未知', '未知', '无想法'];
            const parts = heartStr.split('|');
            // [FIX-心声格式] 4个以上部分时，只取前4个字段（位置|穿着|状态|心声），忽略个签/备注等多余字段
            if (parts.length > 4) {
                return [parts[0], parts[1], parts[2], parts[3]];
            }
            if (parts.length === 4) return parts;
            // 如果没有|分隔符或分隔符不足，说明整个内容是纯心声文本
            if (parts.length === 1) {
                return ['线下见面中', '当前穿着', '线下互动中', parts[0]];
            }
            // 2-3个分隔符的情况，补全缺失字段
            while (parts.length < 4) parts.splice(parts.length - 1, 0, '未知');
            return parts;
        }

        function showOfflineThought() {
            if (!offlineContactId) return toast("请先进入线下模式");
            // [FIX-心声弹窗分裂] 打开心声弹窗前主动收起键盘
            // 键盘打开状态下，modal-thought全屏但底层layer只占visibleHeight，
            // 导致"上半阴影+心声、下半正常"的视觉分裂
            try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch(_) {}

            const offlineContact = store.contacts.find(c => c.id === offlineContactId);
            const isGroup = offlineContact?.isGroup;

            if (isGroup) {
                showOfflineGroupThought();
            } else {
                const msgs = (store.offlineChats && store.offlineChats[offlineContactId]) || [];
                let lastMsg = null;
                for (let i = msgs.length - 1; i >= 0; i--) {
                    if (msgs[i].heart) { lastMsg = msgs[i]; break; }
                }
                if (lastMsg && lastMsg.heart) {
                    const heartData = normalizeHeartData(lastMsg.heart);
                    const contact = offlineContact || {};
                    const desc = contact.desc ? contact.desc.substring(0, 40) : '';
                    window._heartPopupData = { loc: heartData[0]||'', outfit: heartData[1]||'', status: heartData[2]||'', thought: (heartData[3]||'无想法') };
                    const card = _heartCardHTML({
                        name: contact.name || '未知',
                        avatar: contact.avatar,
                        desc: desc,
                        heartData: heartData,
                        historyFn: 'openOfflineHeartHistory()'
                    });
                    document.getElementById('thought-text').innerHTML = card.html;
                    document.getElementById('modal-thought').style.display = 'flex';
                } else {
                    openOfflineHeartHistory();
                }
            }
        }

        // ====== [重构-心声分离] 线下群聊心声手动刷新 ======
        async function refreshOfflineGroupHeartsManual() {
            const chatId = offlineContactId;
            const c = store.contacts.find(x => x.id === chatId);
            // [FIX-私聊误触发] 群聊专用的心声刷新函数绝不能在私聊下触发
            // 根因：之前私聊走这里会产生 offline-group-heart-manual 日志，用户误以为"线下心声"被独立调用
            // 私聊线下的心声已经在主回复API里一起生成（[HEART:]标签），不需要单独刷新
            if (!c || !c.isGroup) {
                console.warn('[offline-group-heart] 非群聊联系人不应调用此函数，已拦截');
                return;
            }
            if (typeof API === 'undefined' || !API.chatCompletion) { toast('API不可用'); return; }

            const membersInfo = (offlineGroupMembers || []).map(m => {
                const mc = store.contacts.find(x => x.id === m.id);
                return { id: m.id, name: m.name, persona: mc ? (mc.persona || '').substring(0, 200) : '', avatar: m.avatar };
            }).filter(Boolean);
            if (membersInfo.length === 0) return;

            // [FIX-心声数据源] 合并线上线下消息，确保能找到线下模式产生的消息
            const chatMsgs = [
                ...(store.chats[chatId] || []).filter(m => m.type === 'go_offline_text' || m.type === 'offline_text'),
                ...((store.offlineChats && store.offlineChats[chatId]) || [])
            ].sort((a, b) => (a.time || 0) - (b.time || 0));
            const recentMsgs = chatMsgs.slice(-12).map(m => {
                const who = m.goSenderName || (m.sender === 'me' ? '用户' : '某人');
                return who + ': ' + (m.content || '').replace(/\[HEART(?:BEAT)?:[^\]]*\]/g, '').substring(0, 80);
            }).join('\n');

            const memberInfo = membersInfo.map(m => `- ${m.name}: ${m.persona}`).join('\n');
            toast('正在刷新心声...', 'info');

            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: `为以下线下聚会的群聊成员生成心声（内心独白）。每个成员必须有心声。心声必须严格符合其人设性格。

成员人设：
${memberInfo}

格式（每个成员一行）：
[NAME:成员名] 位置|穿着|状态|心声独白(50-150字,第一人称"我",纯内心想法,禁写动作)` },
                    { role: 'user', content: `最近线下互动：\n${recentMsgs}\n\n请为${membersInfo.length}个成员生成心声：${membersInfo.map(m => m.name).join('、')}` }
                ], { temperature: 0.85, silent: true, scene: 'offline-group-heart-manual' });

                const reply = data?.choices?.[0]?.message?.content?.trim();
                if (!reply) { toast('心声生成失败'); return; }

                // [FIX-心声解析容错] 名字标准化函数：去除引号、空格、标点等干扰字符
                const _normName = (n) => (n || '').replace(/["""''「」『』\s]/g, '').trim();

                const nameRegex = /\[NAME:\s*(.*?)\s*\]/g;
                let match;
                const parsed = [];
                let lastIdx = 0;
                while ((match = nameRegex.exec(reply)) !== null) {
                    if (parsed.length > 0) parsed[parsed.length - 1].text = reply.substring(lastIdx, match.index).trim();
                    parsed.push({ name: match[1].trim(), text: '' });
                    lastIdx = match.index + match[0].length;
                }
                if (parsed.length > 0) parsed[parsed.length - 1].text = reply.substring(lastIdx).trim();

                // [FIX-心声解析兜底] 如果没有解析到 [NAME:xxx] 标签，尝试按成员名直接在文本中定位
                if (parsed.length === 0) {
                    console.warn('[线下群聊心声] 未检测到[NAME:]标签，尝试兜底按成员名解析');
                    const lines = reply.split('\n').filter(l => l.trim());
                    for (const memberM of membersInfo) {
                        const memberName = memberM.name;
                        for (const line of lines) {
                            const trimLine = line.trim();
                            const lineMatch = trimLine.match(new RegExp('^[-\\s]*' + memberName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[：:]+\\s*(.+)', 'i'));
                            if (lineMatch && lineMatch[1]) {
                                parsed.push({ name: memberName, text: lineMatch[1].trim() });
                                break;
                            }
                        }
                    }
                }

                // [FIX-心声数据源v2] 合并 store.chats 和 store.offlineChats，确保线下模式的消息也能被搜索到
                const _chatMsgsAll = store.chats[chatId] || [];
                const _offlineMsgsAll = (store.offlineChats && store.offlineChats[chatId]) || [];
                // 用包装对象标记来源，方便回写
                const allMsgs = [
                    ..._chatMsgsAll.map((m, i) => ({ msg: m, src: 'chat', idx: i })),
                    ..._offlineMsgsAll.map((m, i) => ({ msg: m, src: 'offline', idx: i }))
                ];
                let filled = 0;
                for (const p of parsed) {
                    // [FIX-心声解析容错] 增强名字匹配：去除引号空格后比较
                    const _pn = _normName(p.name);
                    const memberRef = membersInfo.find(m => {
                        const _mn = _normName(m.name);
                        return _mn === _pn || _pn.includes(_mn) || _mn.includes(_pn)
                            || m.name === p.name || p.name.includes(m.name) || m.name.includes(p.name);
                    });
                    if (!memberRef || !p.text) continue;
                    let heartText = p.text.replace(/\[\s*HEART(?:BEAT)?\s*[:：][\s\S]*?\]/gi, '').replace(/\[NAME:[^\]]*\]/gi, '').trim();
                    if (!heartText) continue;
                    // [FIX-心声搜索范围v2] 从合并数组末尾向前搜索50条，支持goSenderName和senderName模糊匹配
                    for (let i = allMsgs.length - 1; i >= Math.max(0, allMsgs.length - 50); i--) {
                        const _m = allMsgs[i].msg;
                        const _msgName = _normName(_m.goSenderName || _m.senderName);
                        const _refName = _normName(memberRef.name);
                        if (_msgName === _refName || _m.goSenderName === memberRef.name || _m.senderName === memberRef.name) {
                            _m.heart = heartText;
                            filled++;
                            break;
                        }
                    }
                }
                if (filled > 0) {
                    save();
                    renderHistory(false, true);
                    toast('心声已刷新 (' + filled + '/' + membersInfo.length + ')');
                } else {
                    toast('心声解析失败，请重试');
                }
            } catch(e) {
                console.warn('[线下群聊心声手动刷新] 失败:', e);
                toast('心声刷新失败');
            }
        }
        window.refreshOfflineGroupHeartsManual = refreshOfflineGroupHeartsManual;

        // [NEW-群聊线下心声] 线下群聊多人心声弹窗
        function showOfflineGroupThought() {
            // [FIX-私聊误触发] 入口防御：私聊联系人不应走到此函数；若被误调用，退回私聊心声逻辑
            const _curOffContact = store.contacts.find(c => c.id === offlineContactId);
            if (_curOffContact && !_curOffContact.isGroup) {
                console.warn('[offline-group-thought] 私聊不应调用群聊心声弹窗，已重定向到私聊心声');
                // 重新走 showOfflineThought 的私聊分支
                if (typeof showOfflineThought === 'function') {
                    showOfflineThought();
                }
                return;
            }
            const chatMsgs = (store.chats[offlineContactId] || []).filter(m => m.type === 'go_offline_text' || m.type === 'offline_text');
            const offlineMsgs = (store.offlineChats && store.offlineChats[offlineContactId]) || [];
            const msgs = [...chatMsgs, ...offlineMsgs].sort((a, b) => (a.time || 0) - (b.time || 0));
            const memberHearts = {};
            for (let i = msgs.length - 1; i >= 0 && i >= msgs.length - 50; i--) {
                const m = msgs[i];
                if (m.heart && m.goSenderName && (m.sender === 'ai' || m.sender !== 'me')) {
                    const key = m.goSenderName;
                    if (!memberHearts[key]) {
                        const memberContact = store.contacts.find(c => c.name === m.goSenderName);
                        memberHearts[key] = {
                            name: m.goSenderName,
                            avatar: m.goSenderAvatar || memberContact?.avatar || _ph(40),
                            heart: m.heart,
                            time: m.time
                        };
                    }
                }
            }
            // [FIX-心声完整性] 合并被裁剪成员的心声缓存
            if (window._offlineGroupHeartCache && window._offlineGroupHeartCache[offlineContactId]) {
                const _heartCache = window._offlineGroupHeartCache[offlineContactId];
                for (const [name, data] of Object.entries(_heartCache)) {
                    if (!memberHearts[name] && data.heart) {
                        const memberContact = store.contacts.find(c => c.name === name);
                        memberHearts[name] = { name, avatar: data.avatar || memberContact?.avatar || _ph(40), heart: data.heart, time: data.time || Date.now() };
                    }
                }
            }
            const members = Object.values(memberHearts);
            if (members.length === 0) {
                // [重构-心声分离] 无心声时直接触发刷新
                // [FIX-私聊误触发] 再加一层 isGroup 防御，确保只有群聊才触发群聊心声刷新
                if (typeof refreshOfflineGroupHeartsManual === 'function'
                    && _curOffContact && _curOffContact.isGroup) {
                    refreshOfflineGroupHeartsManual();
                } else {
                    toast("暂无线下群聊心声记录，请点击刷新");
                }
                return;
            }
            members.sort((a, b) => (b.time || 0) - (a.time || 0));
            window._offlineGroupHeartMembers = members;

            const first = members[0];
            const hd = normalizeHeartData(first.heart);
            const groupContact = store.contacts.find(c => c.id === offlineContactId);
            const card = _heartCardHTML({
                name: first.name,
                avatar: first.avatar,
                desc: groupContact ? groupContact.name + ' · 线下' : '线下群聊',
                heartData: hd,
                historyFn: 'openOfflineHeartHistory()',
                isGroup: true,
                members: members,
                switchFn: 'switchOfflineGroupHeart',
                refreshFn: 'refreshOfflineGroupHeartsManual()',
                exportFn: "openGroupHeartExport('" + offlineContactId + "')"
            });
            document.getElementById('thought-text').innerHTML = card.html;
            document.getElementById('modal-thought').style.display = 'flex';
        }

        // [FIX-线下群聊心声] Tab切换（复用新卡片结构）
        function switchOfflineGroupHeart(idx) {
            const members = window._offlineGroupHeartMembers;
            if (!members || !members[idx]) return;
            document.querySelectorAll('.heart-popup-member-tab').forEach(t => {
                t.classList.toggle('active', parseInt(t.dataset.idx) === idx);
            });
            const m = members[idx];
            const hd = normalizeHeartData(m.heart);
            const loc = hd[0]||'', outfit = hd[1]||'', status = hd[2]||'';
            const thought = (hd[3]||'无想法').replace(/\|+$/g,'');
            const headAvatar = document.querySelector('.heart-popup-avatar');
            const headName = document.querySelector('.heart-popup-name');
            if (headAvatar) { headAvatar.src = m.avatar; }
            if (headName) headName.textContent = m.name;
            let metaHtml = '';
            if (loc) metaHtml += `<div class="heart-popup-meta-row"><i class="fas fa-map-marker-alt"></i><span class="label">位置</span><span class="value">${loc}</span></div>`;
            if (outfit) metaHtml += `<div class="heart-popup-meta-row"><i class="fas fa-tshirt"></i><span class="label">穿着</span><span class="value">${outfit}</span></div>`;
            if (status) metaHtml += `<div class="heart-popup-meta-row"><i class="fas fa-circle" style="font-size:8px;"></i><span class="label">状态</span><span class="value">${status}</span></div>`;
            const metaEl = document.querySelector('.heart-popup-meta');
            if (metaEl) metaEl.innerHTML = metaHtml;
            const bodyEl = document.querySelector('.heart-popup-body');
            if (bodyEl) bodyEl.innerHTML = `<span class="thought-quote">${thought}</span>`;
            window._heartPopupData = { loc, outfit, status, thought };
        }

        function openOfflineHeartHistory() {
            document.getElementById('modal-thought').style.display = 'none';
            // 替换添加按钮为线下版本
            const addBtn = document.querySelector('#modal-heart-history .fa-plus-circle');
            if (addBtn) addBtn.parentElement.setAttribute('onclick', 'addOfflineHeartItem()');
            renderOfflineHeartHistory();
            document.getElementById('modal-heart-history').style.display = 'flex';
        }

        function renderOfflineHeartHistory() {
            const list = document.getElementById('heart-history-list');
            list.innerHTML = '';
            // [FIX-群聊心声数据源] 合并store.chats中的线下消息和store.offlineChats
            const chatMsgs = (store.chats[offlineContactId] || []).filter(m => m.type === 'go_offline_text' || m.type === 'offline_text');
            const offlineMsgs = (store.offlineChats && store.offlineChats[offlineContactId]) || [];
            const msgs = [...chatMsgs, ...offlineMsgs].sort((a, b) => (a.time || 0) - (b.time || 0));
            // [FIX-用户心声] 只显示AI消息的心声，过滤掉用户消息
            const heartMsgs = msgs.map((m, i) => ({m, i, originalSource: chatMsgs.includes(m) ? 'chat' : 'offline'})).filter(item => item.m.heart && item.m.sender !== 'user' && item.m.sender !== 'me').reverse();
            const offlineContact = store.contacts.find(c => c.id === offlineContactId);
            const isGroup = offlineContact?.isGroup;

            if (heartMsgs.length === 0) {
                list.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">暂无线下心声记录</div>';
                return;
            }

            list.innerHTML = heartMsgs.map(item => {
                const { m, i } = item;
                const heartData = normalizeHeartData(m.heart);
                const timeStr = new Date(m.time).toLocaleString();
                const loc = heartData[0] || '';
                const outfit = heartData[1] || '';
                const status = heartData[2] || '';
                const thoughtText = (heartData[3] || '').replace(/\|+$/g, '');
                const _hhNeedTrans = typeof shouldShowTranslateBtn === 'function' && shouldShowTranslateBtn(thoughtText);

                // 获取成员信息
                let memberName = '', memberAvatar = '';
                if (isGroup && m.goSenderName) {
                    memberName = m.goSenderName;
                    memberAvatar = m.goSenderAvatar || '';
                } else {
                    memberName = offlineContact?.name || '未知';
                    memberAvatar = offlineContact?.avatar || '';
                }
                if (!memberAvatar) memberAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent((memberName||'?')[0]) + '&background=e8e8ea&color=0a0a0a&size=120';

                let html = `<div class="heart-history-card" onclick="editOfflineHeartItem(${i})">`;
                // 头部
                html += `<div class="heart-popup-head hh-head">
                    <img class="heart-popup-avatar hh-avatar" src="${memberAvatar}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent((memberName||'?')[0])}&background=e8e8ea&color=0a0a0a&size=120'">
                    <div class="heart-popup-info">
                        <div class="heart-popup-name hh-name">${memberName}</div>
                        <div class="heart-popup-sub">${timeStr}</div>
                    </div>
                    <div class="hh-actions">
                        <i class="fas fa-edit" onclick="event.stopPropagation();editOfflineHeartItem(${i})"></i>
                        <i class="fas fa-trash" onclick="event.stopPropagation();deleteOfflineHeartItem(${i})"></i>
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
                if (_hhNeedTrans) {
                    html += `<div class="heart-translate-toggle" onclick="event.stopPropagation();onHeartHistoryTranslate(this,${i})"><i class="fas fa-chevron-down"></i> 翻译</div><div class="heart-translation-area" id="heart-hist-trans-${i}"></div>`;
                }
                html += '</div></div>';
                return html;
            }).join('');
        }

        let editingOfflineHeartIdx = null;

        function editOfflineHeartItem(idx) {
            const msgs = (store.offlineChats && store.offlineChats[offlineContactId]) || [];
            const m = msgs[idx];
            if (!m || !m.heart) return;
            editingOfflineHeartIdx = idx;
            document.getElementById('heart-edit-title').innerText = "编辑线下心声";
            const parts = m.heart.split('|');
            document.getElementById('heart-loc').value = parts[0] || '';
            document.getElementById('heart-outfit').value = parts[1] || '';
            document.getElementById('heart-status').value = parts[2] || '';
            document.getElementById('heart-thought').value = (parts[3] || '').replace(/\|+$/g, '');
            // 临时替换保存按钮
            const saveBtn = document.querySelector('#modal-heart-edit .wb-btn.save, #modal-heart-edit button[onclick="saveHeartEdit()"]');
            if (saveBtn) {
                saveBtn.setAttribute('onclick', 'saveOfflineHeartEdit()');
            }
            document.getElementById('modal-heart-edit').style.display = 'flex';
        }

        function addOfflineHeartItem() {
            if (!offlineContactId) return toast("请先进入线下模式");
            editingOfflineHeartIdx = null;
            document.getElementById('heart-edit-title').innerText = "添加线下心声";
            document.getElementById('heart-loc').value = '';
            document.getElementById('heart-outfit').value = '';
            document.getElementById('heart-status').value = '';
            document.getElementById('heart-thought').value = '';
            const saveBtn = document.querySelector('#modal-heart-edit .wb-btn.save, #modal-heart-edit button[onclick="saveHeartEdit()"]');
            if (saveBtn) {
                saveBtn.setAttribute('onclick', 'saveOfflineHeartEdit()');
            }
            document.getElementById('modal-heart-edit').style.display = 'flex';
        }

        function saveOfflineHeartEdit() {
            const loc = document.getElementById('heart-loc').value.trim();
            const outfit = document.getElementById('heart-outfit').value.trim();
            const status = document.getElementById('heart-status').value.trim();
            const thought = document.getElementById('heart-thought').value.trim();
            if (!loc && !outfit && !status && !thought) return toast("请至少填写一项内容");
            const heartStr = `${loc}|${outfit}|${status}|${thought}`;
            if (!store.offlineChats) store.offlineChats = {};
            if (!store.offlineChats[offlineContactId]) store.offlineChats[offlineContactId] = [];

            if (editingOfflineHeartIdx !== null) {
                const m = store.offlineChats[offlineContactId][editingOfflineHeartIdx];
                if (m) { m.heart = heartStr; toast("修改成功"); }
            } else {
                store.offlineChats[offlineContactId].push({
                    sender: 'ai', type: 'text', content: ' ',
                    heart: heartStr, time: Date.now(), isHidden: true
                });
                toast("添加成功");
            }
            save();
            renderOfflineHeartHistory();
            // 恢复保存按钮
            const saveBtn = document.querySelector('#modal-heart-edit button[onclick="saveOfflineHeartEdit()"]');
            if (saveBtn) saveBtn.setAttribute('onclick', 'saveHeartEdit()');
            document.getElementById('modal-heart-edit').style.display = 'none';
        }

        function deleteOfflineHeartItem(idx) {
            showConfirm("删除心声", "确定删除这条线下心声吗?", () => {
                const msgs = store.offlineChats[offlineContactId];
                if (msgs && msgs[idx]) {
                    delete msgs[idx].heart;
                    save();
                    renderOfflineHeartHistory();
                    toast("已删除");
                }
            });
        }

        // [优化-合并翻译] 心声弹窗翻译：将心声内容+标签合并为1次API调用
        function onHeartPopupTranslate(toggleEl) {
            const area = document.getElementById('heart-popup-trans-area');
            const d = window._heartPopupData;
            if (!d) return;
            const tags = document.getElementById('heart-popup-tags');
            const needTags = tags && !tags.dataset.tagsDone;
            // 合并翻译：心声+标签一起翻译
            _batchHeartTranslation(toggleEl, area, d.thought, needTags ? tags : null, d.loc, d.outfit, d.status);
        }

        // [优化-合并翻译] 心声历史列表翻译：将心声内容+标签合并为1次API调用
        function onHeartHistoryTranslate(toggleEl, idx) {
            const area = document.getElementById('heart-hist-trans-' + idx);
            const msgs = (store.offlineChats && store.offlineChats[offlineContactId]) || [];
            const m = msgs[idx];
            if (!m || !m.heart) return;
            const hd = normalizeHeartData(m.heart);
            const tags = toggleEl.parentElement.querySelector('.heart-hist-tags');
            const needTags = tags && !tags.dataset.tagsDone;
            _batchHeartTranslation(toggleEl, area, hd[3] || '', needTags ? tags : null, hd[0]||'', hd[1]||'', hd[2]||'');
        }

        // [合并翻译核心] 心声内容+标签合并为1次API调用
        async function _batchHeartTranslation(toggleEl, areaEl, thoughtText, tagsEl, loc, outfit, status) {
            if (!toggleEl || !areaEl) return;
            if (areaEl.classList.contains('show')) {
                areaEl.classList.remove('show');
                toggleEl.classList.remove('expanded');
                return;
            }
            toggleEl.classList.add('expanded');
            // 检查缓存
            if (areaEl.dataset.cached) {
                areaEl.classList.add('show');
                return;
            }
            areaEl.innerHTML = '<div class="heart-translation-loading">翻译中...</div>';
            areaEl.classList.add('show');
            try {
                if (tagsEl) {
                    // 合并：心声 + 标签 → 1次API调用
                    const combined = thoughtText + '\n⟦⟧\n' + loc + '\n⟦⟧\n' + outfit + '\n⟦⟧\n' + status;
                    const resp = await fetch('/api/translate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: combined, target: 'zh-CN', batch: true })
                    });
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);
                    const data = await resp.json();
                    const translated = data.translated || '';
                    const parts = translated.split(/⟦⟧|⟦ ⟧/);
                    const thoughtTl = (parts[0] || '').trim() || '翻译失败';
                    areaEl.innerHTML = '<div class="heart-translation-content">' + (typeof escapeHtml === 'function' ? escapeHtml(thoughtTl) : thoughtTl.replace(/</g, '&lt;').replace(/>/g, '&gt;')) + '</div>';
                    areaEl.dataset.cached = '1';
                    // 填充标签翻译
                    tagsEl.dataset.tagsDone = '1';
                    const spans = tagsEl.querySelectorAll('.heart-tag-translated');
                    if (spans[0] && parts[1]) spans[0].textContent = '(' + parts[1].trim() + ')';
                    if (spans[1] && parts[2]) spans[1].textContent = '(' + parts[2].trim() + ')';
                    if (spans[2] && parts[3]) spans[2].textContent = '(' + parts[3].trim() + ')';
                } else {
                    // 只翻译心声（标签已翻译过）
                    const data = await _translateText(thoughtText);
                    const translated = data.translated || '翻译失败';
                    areaEl.innerHTML = '<div class="heart-translation-content">' + (typeof escapeHtml === 'function' ? escapeHtml(translated) : translated.replace(/</g, '&lt;').replace(/>/g, '&gt;')) + '</div>';
                    areaEl.dataset.cached = '1';
                }
            } catch (e) {
                areaEl.innerHTML = '<div class="heart-translation-loading" style="color:#e74c3c;">翻译失败</div>';
                setTimeout(() => {
                    areaEl.classList.remove('show');
                    toggleEl.classList.remove('expanded');
                }, 1500);
            }
        }

        // --- 线下模式 & 心声翻译辅助函数 ---
        // 线下独立页面：标签页切换翻译
        async function toggleOfflinePageTranslation(index, mode) {
            const msgs = (store.offlineChats && store.offlineChats[offlineContactId]) || [];
            const m = msgs[index];
            if (!m) return;
            const bodyEl = document.getElementById('offline-msg-body-' + index);
            const origEl = bodyEl && bodyEl.querySelector('.offline-translate-original');
            const resultEl = bodyEl && bodyEl.querySelector('.offline-translate-result');
            const tabOrig = document.getElementById('off-tab-orig-' + index);
            const tabTrans = document.getElementById('off-tab-trans-' + index);
            if (!origEl || !resultEl || !tabOrig || !tabTrans) return;

            if (mode === 'original') {
                tabOrig.classList.add('active');
                tabTrans.classList.remove('active');
                origEl.classList.remove('hide');
                resultEl.classList.remove('show');
                return;
            }
            // mode === 'translated'
            tabTrans.classList.add('active');
            tabOrig.classList.remove('active');

            if (m._offlineTranslated) {
                origEl.classList.add('hide');
                resultEl.innerHTML = m._offlineTranslated.replace(/\n/g, '<br>');
                resultEl.classList.add('show');
                return;
            }
            // 显示loading
            origEl.classList.add('hide');
            resultEl.innerHTML = '<div class="offline-translate-loading">翻译中...</div>';
            resultEl.classList.add('show');
            try {
                const text = _stripHeartTags(m.content || '');
                // [FIX-线下翻译] 线下模式内容通常是中外文混排（中文叙事+外语对话），
                // Google Translate 检测到整段以中文为主会返回原文。改用LLM翻译，
                // 指示其只翻译外语部分、保留中文部分。
                let translated;
                const _hasForeignText = typeof shouldShowTranslateBtn === 'function' && shouldShowTranslateBtn(text);
                if (_hasForeignText && text.length > 20) {
                    try {
                        const _llmResult = await API.chatCompletion([
                            { role: 'system', content: '你是翻译专家。用户会提供一段中外文混排的文本（可能包含中文叙事和外语对话）。请将其中所有非中文的部分翻译为简体中文，中文部分保持不变。直接输出翻译后的完整文本，不要加任何解释、前缀或标注。保持原文的换行格式。' },
                            { role: 'user', content: text }
                        ], 0.3);
                        translated = _llmResult.choices?.[0]?.message?.content?.trim() || '';
                    } catch(_llmErr) {
                        // LLM失败时降级为Google Translate
                        const data = await _translateText(text);
                        translated = data.translated || '';
                    }
                } else {
                    const data = await _translateText(text);
                    translated = data.translated || '';
                }
                translated = translated || '翻译失败';
                m._offlineTranslated = translated;
                save();
                resultEl.innerHTML = translated.replace(/\n/g, '<br>');
            } catch (e) {
                resultEl.innerHTML = '<div style="color:#e74c3c;font-size:12px;">翻译失败: ' + (e.message || '网络错误') + '</div>';
                tabOrig.classList.add('active');
                tabTrans.classList.remove('active');
                setTimeout(() => {
                    origEl.classList.remove('hide');
                    resultEl.classList.remove('show');
                }, 1500);
            }
        }

        // 心声翻译：抽屉展开
        async function toggleHeartTranslation(toggleEl, areaEl, text, cacheKey) {
            if (!toggleEl || !areaEl) return;
            if (areaEl.classList.contains('show')) {
                areaEl.classList.remove('show');
                toggleEl.classList.remove('expanded');
                return;
            }
            toggleEl.classList.add('expanded');
            // 检查缓存
            if (areaEl.dataset.cached) {
                areaEl.classList.add('show');
                return;
            }
            areaEl.innerHTML = '<div class="heart-translation-loading">翻译中...</div>';
            areaEl.classList.add('show');
            try {
                const data = await _translateText(text);
                const translated = data.translated || '翻译失败';
                areaEl.innerHTML = '<div class="heart-translation-content">' + (typeof escapeHtml === 'function' ? escapeHtml(translated) : translated.replace(/</g, '&lt;').replace(/>/g, '&gt;')) + '</div>';
                areaEl.dataset.cached = '1';
            } catch (e) {
                areaEl.innerHTML = '<div class="heart-translation-loading" style="color:#e74c3c;">翻译失败</div>';
                setTimeout(() => {
                    areaEl.classList.remove('show');
                    toggleEl.classList.remove('expanded');
                }, 1500);
            }
        }

        // 翻译心声标签（位置/穿着/状态）
        async function translateHeartTags(containerEl, loc, outfit, status) {
            const tagsText = loc + '\n' + outfit + '\n' + status;
            try {
                const data = await _translateText(tagsText);
                const lines = (data.translated || '').split('\n');
                const spans = containerEl.querySelectorAll('.heart-tag-translated');
                if (spans[0] && lines[0]) spans[0].textContent = '(' + lines[0].trim() + ')';
                if (spans[1] && lines[1]) spans[1].textContent = '(' + lines[1].trim() + ')';
                if (spans[2] && lines[2]) spans[2].textContent = '(' + lines[2].trim() + ')';
            } catch(e) { /* 静默失败 */ }
        }

        // Moments Interaction
        function toggleAiMomentInteraction(enabled) {
            store.user.aiMomentInteraction = enabled;
            save();
            toast('朋友圈智能互评已' + (enabled ? '开启' : '关闭'));
        }

        // --- CLEAR RECORDS LOGIC (统一清除入口) ---
        function openClearRecordsModal() {
            if (!activeChatId) return toast("无效的会话");
            // 默认只勾选聊天记录
            document.querySelectorAll('.cd-chk').forEach(function(el) { el.checked = false; });
            var onlineEl = document.getElementById('dc-chat-online');
            var offlineEl = document.getElementById('dc-chat-offline');
            if (onlineEl) onlineEl.checked = true;
            if (offlineEl) offlineEl.checked = true;
            var dfrom = document.getElementById('dc-date-from');
            var dto = document.getElementById('dc-date-to');
            if (dfrom) dfrom.value = '';
            if (dto) dto.value = '';
            document.getElementById('modal-clear-records').style.display = 'flex';
        }

        // 保持旧函数兼容：confirmClearRecordsSelection 现在直接调用统一清除
        function confirmClearRecordsSelection() {
            executeDeepClean();
        }

        function executeClearRecords(deleteChat, deleteMemory, deepClean) {
            if (!activeChatId) return;
            const contactId = activeChatId;
            
            if (deleteChat) {
                // 清除线上聊天记录
                if (store.chats[contactId]) {
                    store.chats[contactId] = [];
                }
                // [FIX-记忆残留] 同时清除线下聊天记录（记忆互通数据源）
                if (store.offlineChats && store.offlineChats[contactId]) {
                    store.offlineChats[contactId] = [];
                }
            }
            
            if (deleteMemory) {
                // [FIX-记忆残留] 彻底清除所有记忆相关数据
                // 1. 清除记忆摘要
                if (store.memorySummaries && store.memorySummaries[contactId]) {
                    delete store.memorySummaries[contactId];
                }
                // [类人记忆系统] 同步清除分层记忆
                if (window.MemorySystem && window.MemorySystem.Store) {
                    try { window.MemorySystem.Store.clearContact(contactId); } catch(_) {}
                }
                // 2. 清除情侣空间中的时空穿越记忆
                if (store.coupleSpaces) {
                    store.coupleSpaces.forEach(space => {
                        if (space && space.partnerId === contactId) {
                            if (space.spacetimeMemories) {
                                space.spacetimeMemories = [];
                            }
                        }
                    });
                }
                // 3. 清除该联系人在群聊记忆中的数据
                // （群聊记忆以群ID为key，这里只清除该联系人作为个体的记忆）
                
                // 4. 清除联系人上的临时状态标记
                const contact = store.contacts.find(c => c.id === contactId);
                if (contact) {
                    delete contact._pendingAutoMsg;
                    // [FIX-解绑残留] 清除情侣空间强制解绑的情绪标记，防止AI持续注入旧情绪
                    if (contact.emotionFlags) {
                        delete contact.emotionFlags.forceUnbind;
                        if (Object.keys(contact.emotionFlags).length === 0) {
                            delete contact.emotionFlags;
                        }
                    }
                    // 重置消息计数器，防止旧计数触发基于旧记忆的总结
                    if (contact.settings) {
                        contact.settings.msgCount = 0;
                        contact.settings._lastSummaryAt = 0;
                    }
                }
            }
            
            // [FIX-数据残留] 深度清除：彻底清除所有关联数据源，确保AI完全忘记旧内容
            if (deepClean) {
                const contact = store.contacts.find(c => c.id === contactId);
                const contactName = contact ? contact.name : '';
                
                // 5. 清除该联系人的朋友圈动态
                if (store.moments && Array.isArray(store.moments)) {
                    store.moments = store.moments.filter(m => {
                        // 清除该联系人发的动态
                        if (m.contactId === contactId) return false;
                        if (m.name === contactName && contactName) return false;
                        // 同时清除动态下该联系人的评论
                        if (m.comments && Array.isArray(m.comments)) {
                            m.comments = m.comments.filter(c => c.contactId !== contactId && c.name !== contactName);
                        }
                        return true;
                    });
                }
                
                // 6. 清除该联系人的日记
                if (store.diaries && store.diaries[contactId]) {
                    delete store.diaries[contactId];
                }
                
                // 7. 清除该联系人的收藏
                if (store.favorites && store.favorites[contactId]) {
                    delete store.favorites[contactId];
                }
                
                // 8. 清除该联系人相关的邮箱往来
                if (store.mailbox && Array.isArray(store.mailbox)) {
                    store.mailbox = store.mailbox.filter(m => m.from !== contactId && m.to !== contactId);
                }
                
                // 9. 清除该联系人相关的论坛私信
                if (store.forumDMs) {
                    const contactAccId = 'contact_' + contactId;
                    Object.keys(store.forumDMs).forEach(key => {
                        const dm = store.forumDMs[key];
                        if (dm && (dm.accountId === contactAccId || key.includes(contactId))) {
                            delete store.forumDMs[key];
                        }
                    });
                }
                
                // 10. 清除该联系人的论坛帖子
                if (store.forumPosts && Array.isArray(store.forumPosts)) {
                    store.forumPosts = store.forumPosts.filter(p => p.authorContactId !== contactId);
                }
                
                // 11. 清除情侣账号数据
                if (typeof window._coupleAccountClearData === 'function') {
                    try { window._coupleAccountClearData(contactId); } catch(e) {}
                }
                
                // 12. 清除外卖/饮食相关数据
                if (typeof window._foodDeliveryClearData === 'function') {
                    try { window._foodDeliveryClearData(contactId); } catch(e) {}
                }
                
                // 13. 清除该联系人的关系网数据
                if (store.relationNetworks && store.relationNetworks[contactId]) {
                    delete store.relationNetworks[contactId];
                }
                
                // 14. 清除渲染缓存，防止残留状态
                if (typeof _lastRenderedMsgCount !== 'undefined' && _lastRenderedMsgCount) {
                    _lastRenderedMsgCount[contactId] = 0;
                }
                if (typeof _renderCache !== 'undefined' && _renderCache) {
                    Object.keys(_renderCache).forEach(key => {
                        if (key.includes(contactId)) delete _renderCache[key];
                    });
                }
                
                // 15. 清除联系人的lastMsgTime，防止旧消息时间残留影响排序
                if (contact) {
                    contact.lastMsgTime = 0;
                    contact.lastMsg = '';
                    delete contact._pendingAutoMsg;
                    delete contact._autoMsgLastTime;
                }
                
                console.log('[深度清除] 已彻底清除联系人', contactName || contactId, '的所有关联数据');
            }
            
            // [FIX-数据残留] 强制立即保存，确保清除操作不会被旧的 LS Core 数据覆盖
            // 使用 saveNow（如果可用）绕过 debounce 直接写入，否则用 save()
            try {
                if (typeof window.saveNow === 'function') {
                    window.saveNow();
                } else {
                    save();
                }
                // 额外：强制更新 LS Core 备份中的 chatSnapshot，防止旧快照恢复已删数据
                try {
                    var lsCoreStr = localStorage.getItem('AIChatOS_v8_Core');
                    if (lsCoreStr) {
                        var lsCore = JSON.parse(lsCoreStr);
                        if (lsCore._chatSnapshot && lsCore._chatSnapshot[contactId]) {
                            lsCore._chatSnapshot[contactId] = { count: 0, tail: [] };
                            lsCore._saveTimestamp = Date.now();
                            localStorage.setItem('AIChatOS_v8_Core', JSON.stringify(lsCore));
                        }
                    }
                } catch(_lsFixErr) { console.warn('[深度清除] LS Core 修补失败:', _lsFixErr); }
            } catch(e) {
                save();
            }
            
            toast(deepClean ? "深度清除完成！AI将完全忘记旧内容" : "清除成功", "success");
            renderHistory();
            if (typeof renderMemorySystem === 'function') renderMemorySystem();
            if (typeof renderContacts === 'function') renderContacts();
            if (deepClean && typeof renderMoments === 'function') {
                try { renderMoments(); } catch(e) {}
            }
        }

        // --- DEEP CLEAN MODAL FUNCTIONS ---
        // [合并] openDeepCleanModal 现在也指向统一弹窗
        function openDeepCleanModal() {
            if (!activeChatId) return toast("无效的会话");
            dcSelectAll(true);
            document.getElementById('modal-clear-records').style.display = 'flex';
        }

        function dcSelectAll(checked) {
            // 优先用 class 选择器（统一弹窗），兼容旧 id 方式
            var chks = document.querySelectorAll('.cd-chk');
            if (chks.length > 0) {
                chks.forEach(function(el) { el.checked = checked; });
            } else {
                var ids = ['dc-chat-online','dc-chat-offline','dc-memory-summary','dc-memory-spacetime','dc-moments','dc-diary','dc-favorites','dc-mail','dc-forum','dc-relation'];
                ids.forEach(function(id) {
                    var el = document.getElementById(id);
                    if (el) el.checked = checked;
                });
            }
        }

        function executeDeepClean() {
            if (!activeChatId) return;
            var contactId = activeChatId;
            var contact = store.contacts.find(function(c) { return c.id === contactId; });
            var contactName = contact ? contact.name : '';
            
            // 读取各选项
            var cleanOnlineChat = document.getElementById('dc-chat-online')?.checked;
            var cleanOfflineChat = document.getElementById('dc-chat-offline')?.checked;
            // 日期范围
            var dcDateFrom = document.getElementById('dc-date-from')?.value || '';
            var dcDateTo = document.getElementById('dc-date-to')?.value || '';
            var hasDateRange = !!(dcDateFrom || dcDateTo);
            var dcFromTs = dcDateFrom ? new Date(dcDateFrom + 'T00:00:00').getTime() : 0;
            var dcToTs = dcDateTo ? new Date(dcDateTo + 'T23:59:59').getTime() : Infinity;
            var cleanMemorySummary = document.getElementById('dc-memory-summary')?.checked;
            var cleanSpacetime = document.getElementById('dc-memory-spacetime')?.checked;
            var cleanMoments = document.getElementById('dc-moments')?.checked;
            var cleanDiary = document.getElementById('dc-diary')?.checked;
            var cleanFavorites = document.getElementById('dc-favorites')?.checked;
            var cleanMail = document.getElementById('dc-mail')?.checked;
            var cleanForum = document.getElementById('dc-forum')?.checked;
            var cleanRelation = document.getElementById('dc-relation')?.checked;
            
            // 检查是否至少选了一项
            if (!cleanOnlineChat && !cleanOfflineChat && !cleanMemorySummary && !cleanSpacetime && !cleanMoments && !cleanDiary && !cleanFavorites && !cleanMail && !cleanForum && !cleanRelation) {
                return toast("请至少选择一项要清除的数据");
            }
            
            // [合并] 统一关闭弹窗（兼容旧引用）
            var _dcModal = document.getElementById('modal-deep-clean') || document.getElementById('modal-clear-records');
            if (_dcModal) _dcModal.style.display = 'none';
            
            // 构建确认消息
            var items = [];
            if (cleanOnlineChat) items.push('线上聊天');
            if (cleanOfflineChat) items.push('线下聊天');
            if (cleanMemorySummary) items.push('记忆摘要');
            if (cleanSpacetime) items.push('时空记忆');
            if (cleanMoments) items.push('朋友圈');
            if (cleanDiary) items.push('日记');
            if (cleanFavorites) items.push('收藏');
            if (cleanMail) items.push('邮箱');
            if (cleanForum) items.push('论坛');
            if (cleanRelation) items.push('关系网');
            
            var dateRangeHint = hasDateRange ? '\n日期范围：' + (dcDateFrom || '最早') + ' ~ ' + (dcDateTo || '最新') : '';
            showConfirm("⚠️ 确认深度清除", "将永久删除「" + (contactName || '该联系人') + "」的以下数据：\n" + items.join('、') + dateRangeHint + "\n\n此操作不可恢复！", function() {
                var cleaned = 0;
                
                // 日期过滤辅助函数：判断消息时间是否在范围内
                function _inDateRange(msgTime) {
                    if (!hasDateRange) return true;
                    var t = typeof msgTime === 'number' ? msgTime : new Date(msgTime).getTime();
                    return t >= dcFromTs && t <= dcToTs;
                }
                
                // 1. 线上聊天
                if (cleanOnlineChat && store.chats[contactId]) {
                    if (hasDateRange) {
                        var before = store.chats[contactId].length;
                        store.chats[contactId] = store.chats[contactId].filter(function(m) { return !_inDateRange(m.time); });
                        if (store.chats[contactId].length < before) cleaned++;
                    } else {
                        store.chats[contactId] = [];
                        cleaned++;
                    }
                }
                
                // 2. 线下聊天
                if (cleanOfflineChat && store.offlineChats && store.offlineChats[contactId]) {
                    if (hasDateRange) {
                        var before2 = store.offlineChats[contactId].length;
                        store.offlineChats[contactId] = store.offlineChats[contactId].filter(function(m) { return !_inDateRange(m.time); });
                        if (store.offlineChats[contactId].length < before2) cleaned++;
                    } else {
                        store.offlineChats[contactId] = [];
                        cleaned++;
                    }
                }
                
                // 3. 记忆摘要
                if (cleanMemorySummary && store.memorySummaries && store.memorySummaries[contactId]) {
                    delete store.memorySummaries[contactId];
                    cleaned++;
                }
                // [类人记忆系统] 同步清除分层记忆
                if (cleanMemorySummary && window.MemorySystem && window.MemorySystem.Store) {
                    try { window.MemorySystem.Store.clearContact(contactId); } catch(_) {}
                }
                
                // 4. 时空穿越记忆
                if (cleanSpacetime && store.coupleSpaces) {
                    store.coupleSpaces.forEach(function(space) {
                        if (space && space.partnerId === contactId && space.spacetimeMemories) {
                            space.spacetimeMemories = [];
                            cleaned++;
                        }
                    });
                }
                
                // 5. 朋友圈
                if (cleanMoments && store.moments && Array.isArray(store.moments)) {
                    var beforeLen = store.moments.length;
                    store.moments = store.moments.filter(function(m) {
                        if (m.contactId === contactId) return false;
                        if (m.name === contactName && contactName) return false;
                        if (m.comments && Array.isArray(m.comments)) {
                            m.comments = m.comments.filter(function(c2) { return c2.contactId !== contactId && c2.name !== contactName; });
                        }
                        return true;
                    });
                    if (store.moments.length < beforeLen) cleaned++;
                }
                
                // 6. 日记
                if (cleanDiary && store.diaries && store.diaries[contactId]) {
                    delete store.diaries[contactId];
                    cleaned++;
                }
                
                // 7. 收藏
                if (cleanFavorites && store.favorites && store.favorites[contactId]) {
                    delete store.favorites[contactId];
                    cleaned++;
                }
                
                // 8. 邮箱
                if (cleanMail && store.mailbox && Array.isArray(store.mailbox)) {
                    var beforeMailLen = store.mailbox.length;
                    store.mailbox = store.mailbox.filter(function(m) { return m.from !== contactId && m.to !== contactId; });
                    if (store.mailbox.length < beforeMailLen) cleaned++;
                }
                
                // 9. 论坛
                if (cleanForum) {
                    if (store.forumDMs) {
                        var contactAccId = 'contact_' + contactId;
                        Object.keys(store.forumDMs).forEach(function(key) {
                            var dm = store.forumDMs[key];
                            if (dm && (dm.accountId === contactAccId || key.includes(contactId))) {
                                delete store.forumDMs[key];
                                cleaned++;
                            }
                        });
                    }
                    if (store.forumPosts && Array.isArray(store.forumPosts)) {
                        store.forumPosts = store.forumPosts.filter(function(p) { return p.authorContactId !== contactId; });
                    }
                }
                
                // 10. 关系网
                if (cleanRelation && store.relationNetworks && store.relationNetworks[contactId]) {
                    delete store.relationNetworks[contactId];
                    cleaned++;
                }
                
                // 清理联系人临时状态
                if (contact) {
                    delete contact._pendingAutoMsg;
                    delete contact._autoMsgLastTime;
                    if (contact.settings) {
                        contact.settings.msgCount = 0;
                        contact.settings._lastSummaryAt = 0;
                    }
                    if (cleanOnlineChat && cleanOfflineChat) {
                        contact.lastMsgTime = 0;
                        contact.lastMsg = '';
                    }
                }
                
                // 清理渲染缓存
                if (typeof _lastRenderedMsgCount !== 'undefined' && _lastRenderedMsgCount) {
                    _lastRenderedMsgCount[contactId] = 0;
                }
                
                // 强制立即保存
                try {
                    if (typeof window.saveNow === 'function') {
                        window.saveNow();
                    } else {
                        save();
                    }
                    // 修补 LS Core 中的 chatSnapshot
                    try {
                        var lsCoreStr = localStorage.getItem('AIChatOS_v8_Core');
                        if (lsCoreStr) {
                            var lsCore = JSON.parse(lsCoreStr);
                            if (lsCore._chatSnapshot && lsCore._chatSnapshot[contactId]) {
                                lsCore._chatSnapshot[contactId] = { count: 0, tail: [] };
                                lsCore._saveTimestamp = Date.now();
                                localStorage.setItem('AIChatOS_v8_Core', JSON.stringify(lsCore));
                            }
                        }
                    } catch(_e) {}
                } catch(e) {
                    save();
                }
                
                // [FIX-解绑残留] 清除线上聊天或记忆摘要时，同时清除情侣解绑情绪标记
                if (cleanOnlineChat || cleanMemorySummary) {
                    if (contact && contact.emotionFlags) {
                        delete contact.emotionFlags.forceUnbind;
                        if (Object.keys(contact.emotionFlags).length === 0) {
                            delete contact.emotionFlags;
                        }
                    }
                }

                toast("深度清除完成！已清理 " + cleaned + " 项数据", "success");
                console.log('[深度清除] 已清除联系人', contactName || contactId, '的', cleaned, '项数据');
                
                if (typeof renderHistory === 'function') renderHistory();
                if (typeof renderMemorySystem === 'function') renderMemorySystem();
                if (typeof renderContacts === 'function') renderContacts();
                if (cleanMoments && typeof renderMoments === 'function') {
                    try { renderMoments(); } catch(e) {}
                }
            });
        }

        // --- SETTINGS SUBPAGE NAVIGATION ---
        let currentSettingsPage = null;
        const settingsPageTitles = {
            'api': 'API 设置',
            'minimax': 'MiniMax 语音',
            'theme': '外观设置',
            'data': '数据管理',
            'sound': '通知音设置',
            'lockscreen': '锁屏设置',
            'keepalive': '后台保活',
            'stt': '语音识别 (STT)',
            'imagegen': '生图管理',
            'errorlog': 'API 错误日志',
            'backup': '自动备份'
        };

        // ==========================================
        // --- PWA INSTALL GUIDE ---
        // 检测平台并展示对应的「安装到桌面」引导
        // 支持: Android Chrome/Edge、iOS Safari、
        //        HarmonyOS/鸿蒙浏览器、桌面 Edge/Chrome
        // ==========================================
        let _pwaDeferred = null; // 存储 beforeinstallprompt 事件

        (function initPWAInstall() {
            // 1. 监听标准安装事件（Android Chrome、桌面 Edge/Chrome）
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                _pwaDeferred = e;
                _showInstallNavItem();
            });

            // 2. 检测是否已安装为 PWA（standalone 模式下隐藏入口）
            const isStandalone =
                window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true ||
                document.referrer.startsWith('android-app://');

            if (isStandalone) return; // 已安装，不显示入口

            // 3. 检测平台，决定是否显示安装入口
            const ua = navigator.userAgent || '';
            const isHarmony = /HarmonyOS|HMOS/i.test(ua);
            const isAndroid = /android/i.test(ua) && !isHarmony;

            if (isHarmony || isAndroid) {
                _showInstallNavItem();
            }
        })();

        function _showInstallNavItem() {
            const navItem = document.getElementById('settings-nav-install');
            if (!navItem) return;
            const ua = navigator.userAgent || '';
            const isHarmony = /HarmonyOS|HMOS/i.test(ua);
            const desc = document.getElementById('settings-nav-install-desc');
            if (isHarmony) {
                if (desc) desc.textContent = '通过浏览器菜单添加到桌面';
            } else if (_pwaDeferred) {
                if (desc) desc.textContent = '一键安装应用到桌面';
            }
            navItem.style.display = '';
        }

        function openInstallGuide() {
            const ua = navigator.userAgent || '';
            const isHarmony = /HarmonyOS|HMOS/i.test(ua);
            const isHarmonyEdge = isHarmony && /EdgA|Edge/i.test(ua);
            const isHuaweiBrowser = isHarmony && /HuaweiBrowser/i.test(ua);
            const isAndroidChrome = /android/i.test(ua) && /chrome/i.test(ua) && !isHarmony;

            const modal = document.getElementById('modal-pwa-install');
            const content = document.getElementById('pwa-install-content');
            const footer = document.getElementById('pwa-install-footer');
            const subtitle = document.getElementById('pwa-install-subtitle');
            const installBtn = document.getElementById('pwa-install-btn');
            if (!modal || !content) return;

            // 步骤条模板
            function step(num, text) {
                return `<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;">
                    <div style="min-width:26px;height:26px;border-radius:50%;background:#07c160;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px;">${num}</div>
                    <div style="font-size:14px;color:#333;line-height:1.5;padding-top:3px;">${text}</div>
                </div>`;
            }

            if (isHarmonyEdge) {
                // 鸿蒙 + Edge 浏览器
                subtitle.textContent = '在 Edge 浏览器中添加到桌面';
                content.innerHTML =
                    `<div style="background:#fff8e6;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:13px;color:#b07d00;display:flex;gap:8px;align-items:flex-start;">
                        <i class="fas fa-info-circle" style="margin-top:2px;"></i>
                        <span>鸿蒙系统的 Edge 浏览器需要通过菜单手动添加，没有自动安装弹窗，请按以下步骤操作：</span>
                    </div>` +
                    step(1, `点击 Edge 浏览器右下角 <b>「···」</b> 菜单按钮`) +
                    step(2, `在菜单中找到 <b>「添加到手机」</b> 或 <b>「添加到桌面」</b> 选项`) +
                    step(3, `点击后选择 <b>「添加」</b>，桌面即会出现 YAN 的快捷图标`) +
                    `<p style="font-size:12px;color:#aaa;margin-top:4px;line-height:1.5;">💡 如找不到该选项，可尝试点击地址栏右侧的「☆」收藏图标旁的菜单。</p>`;
                footer.innerHTML = `<button onclick="document.getElementById('modal-pwa-install').style.display='none'" style="flex:1;padding:12px;border:none;background:linear-gradient(135deg,#07c160,#0a9e4d);color:#fff;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;">我知道了</button>`;

            } else if (isHuaweiBrowser || isHarmony) {
                // 鸿蒙 + 华为浏览器 或其他鸿蒙浏览器
                subtitle.textContent = '在华为浏览器中添加到桌面';
                content.innerHTML =
                    `<div style="background:#fff8e6;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:13px;color:#b07d00;display:flex;gap:8px;align-items:flex-start;">
                        <i class="fas fa-info-circle" style="margin-top:2px;"></i>
                        <span>鸿蒙系统需要通过浏览器菜单手动添加到桌面：</span>
                    </div>` +
                    step(1, `点击浏览器右上角 <b>「⋮」</b> 或 <b>「···」</b> 菜单按钮`) +
                    step(2, `在菜单中找到 <b>「添加到桌面」</b> 或 <b>「发送到桌面」</b>`) +
                    step(3, `点击确认后，YAN 图标将出现在你的桌面`) +
                    `<p style="font-size:12px;color:#aaa;margin-top:4px;line-height:1.5;">💡 不同版本的华为浏览器菜单位置略有差异，如未找到可在浏览器设置中搜索「桌面」。</p>`;
                footer.innerHTML = `<button onclick="document.getElementById('modal-pwa-install').style.display='none'" style="flex:1;padding:12px;border:none;background:linear-gradient(135deg,#07c160,#0a9e4d);color:#fff;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;">我知道了</button>`;

            } else if (_pwaDeferred) {
                // 支持 beforeinstallprompt 的标准浏览器（Android Chrome、桌面 Edge/Chrome）
                subtitle.textContent = '一键安装到桌面';
                content.innerHTML =
                    `<p style="font-size:14px;color:#555;line-height:1.7;text-align:center;padding:10px 0;">
                        点击下方按钮，即可将 <b>YAN</b> 安装到桌面。<br>
                        安装后可像原生应用一样全屏启动，无需每次打开浏览器。
                    </p>`;
                footer.innerHTML = `
                    <button onclick="document.getElementById('modal-pwa-install').style.display='none'" style="flex:1;padding:12px;border:1px solid #e0e0e0;background:#f5f5f5;border-radius:12px;font-size:15px;cursor:pointer;color:#666;">稍后再说</button>
                    <button style="flex:2;padding:12px;border:none;background:linear-gradient(135deg,#07c160,#0a9e4d);color:#fff;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;" onclick="triggerPWAInstall()"><i class="fas fa-download" style="margin-right:6px;"></i>立即安装</button>`;

            } else {
                // 兜底：通用引导
                subtitle.textContent = '添加到桌面';
                content.innerHTML =
                    `<p style="font-size:13px;color:#999;margin-bottom:16px;">请通过浏览器菜单将页面添加到桌面：</p>` +
                    step(1, `点击浏览器右上角 <b>「⋮」</b> 或 <b>「···」</b> 菜单`) +
                    step(2, `选择 <b>「添加到主屏幕」</b> 或 <b>「添加到桌面」</b>`) +
                    step(3, `确认添加，桌面即出现 YAN 图标`);
                footer.innerHTML = `<button onclick="document.getElementById('modal-pwa-install').style.display='none'" style="flex:1;padding:12px;border:none;background:linear-gradient(135deg,#07c160,#0a9e4d);color:#fff;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;">我知道了</button>`;
            }

            modal.style.display = 'flex';
        }

        async function triggerPWAInstall() {
            if (!_pwaDeferred) return;
            try {
                _pwaDeferred.prompt();
                const result = await _pwaDeferred.userChoice;
                if (result.outcome === 'accepted') {
                    _pwaDeferred = null;
                    document.getElementById('modal-pwa-install').style.display = 'none';
                    const navItem = document.getElementById('settings-nav-install');
                    if (navItem) navItem.style.display = 'none';
                    toast('🎉 安装成功！已添加到桌面', 'success');
                }
            } catch(e) {
                console.warn('[PWA] Install prompt failed:', e);
            }
        }

        // [FIX-v4→v11] 防止设置页面滚动/长按时误触发页面跳转
        // v11改进：缩短滚动判定延迟（300ms→100ms），使用touchend重置moved标志
        // 防止用户在短暂滑动后点击时被错误阻止
        let _settingsScrolling = false;
        let _settingsScrollTimer = null;
        let _settingsTouchStartY = 0;
        let _settingsTouchMoved = false;
        (function() {
            const sm = document.getElementById('settings-menu');
            if (!sm) return;
            sm.addEventListener('scroll', function() {
                _settingsScrolling = true;
                clearTimeout(_settingsScrollTimer);
                // [FIX-v11] 缩短滚动冷却时间：300ms→100ms，减少点击无响应的感觉
                _settingsScrollTimer = setTimeout(() => { _settingsScrolling = false; }, 100);
            }, { passive: true });
            sm.addEventListener('touchstart', function(e) {
                _settingsTouchStartY = e.touches[0].clientY;
                _settingsTouchMoved = false;
            }, { passive: true });
            sm.addEventListener('touchmove', function(e) {
                if (Math.abs(e.touches[0].clientY - _settingsTouchStartY) > 10) {
                    _settingsTouchMoved = true;
                }
            }, { passive: true });
            // [FIX-v11] touchend时重置moved标志，这样下一次点击不会被之前的滑动误拦截
            sm.addEventListener('touchend', function() {
                // 延迟一点重置，确保click事件先检查完标志
                setTimeout(function() { _settingsTouchMoved = false; }, 50);
            }, { passive: true });
        })();

        function openSettingsPage(pageId) {
            // [FIX-v4] 滚动或触摸移动时不跳转
            if (_settingsScrolling || _settingsTouchMoved) return;
            document.getElementById('settings-menu').style.display = 'none';
            const page = document.getElementById('settings-page-' + pageId);
            if (page) {
                page.classList.add('active');
                currentSettingsPage = pageId;
                document.getElementById('settings-nav-title').innerText = settingsPageTitles[pageId] || '设置';
            }
            if (pageId === 'lockscreen') initLockScreenSettings();
            if (pageId === 'keepalive') initKeepAliveSettings();
            if (pageId === 'stt') initSTTSettings();
            if (pageId === 'imagegen') initImgGenSettings();
            if (pageId === 'errorlog') renderApiErrorLogs();
            if (pageId === 'backup' && window.BackupUI && typeof window.BackupUI.render === 'function') {
                window.BackupUI.render();
            }
        }

        // --- STT (语音识别) SETTINGS ---
        function initSTTSettings() {
            if (!store.stt) store.stt = { enabled: false, provider: 'openai', language: 'zh', openai: { url: 'https://api.openai.com/v1', key: '', model: 'whisper-1' }, google: { key: '' }, tencent: { secretId: '', secretKey: '' }, xfyun: { appId: '', apiKey: '', apiSecret: '' }, azure: { key: '', region: 'eastasia' }, custom: { url: '', key: '' } };
            const stt = store.stt;
            document.getElementById('stt-enabled').checked = stt.enabled;
            document.getElementById('stt-config-area').style.display = stt.enabled ? 'block' : 'none';
            document.getElementById('stt-language').value = stt.language || 'zh';

            // Fill provider configs
            document.getElementById('stt-openai-url').value = stt.openai?.url || 'https://api.openai.com/v1';
            document.getElementById('stt-openai-key').value = stt.openai?.key || '';
            document.getElementById('stt-openai-model').value = stt.openai?.model || 'whisper-1';
            document.getElementById('stt-google-key').value = stt.google?.key || '';
            document.getElementById('stt-tencent-id').value = stt.tencent?.secretId || '';
            document.getElementById('stt-tencent-key').value = stt.tencent?.secretKey || '';
            document.getElementById('stt-xfyun-appid').value = stt.xfyun?.appId || '';
            document.getElementById('stt-xfyun-key').value = stt.xfyun?.apiKey || '';
            document.getElementById('stt-xfyun-secret').value = stt.xfyun?.apiSecret || '';
            document.getElementById('stt-azure-key').value = stt.azure?.key || '';
            document.getElementById('stt-azure-region').value = stt.azure?.region || 'eastasia';
            document.getElementById('stt-custom-url').value = stt.custom?.url || '';
            document.getElementById('stt-custom-key').value = stt.custom?.key || '';

            selectSTTProvider(stt.provider || 'openai');
        }

        function toggleSTTEnabled() {
            const enabled = document.getElementById('stt-enabled').checked;
            document.getElementById('stt-config-area').style.display = enabled ? 'block' : 'none';
            // [FIX-开关持久化] 切换时立即保存到store，防止返回后状态丢失
            if (!store.stt) store.stt = { enabled: false, provider: 'openai', language: 'zh', openai: { url: 'https://api.openai.com/v1', key: '', model: 'whisper-1' }, google: { key: '' }, tencent: { secretId: '', secretKey: '' }, xfyun: { appId: '', apiKey: '', apiSecret: '' }, azure: { key: '', region: 'eastasia' }, custom: { url: '', key: '' } };
            store.stt.enabled = enabled;
            save();
        }

        function selectSTTProvider(provider) {
            if (!store.stt) store.stt = {};
            // Highlight selected button
            document.querySelectorAll('.stt-provider-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.provider === provider);
            });
            // Show/hide config panels
            ['openai','google','tencent','xfyun','azure','custom'].forEach(p => {
                const el = document.getElementById('stt-' + p + '-config');
                if (el) el.style.display = (p === provider) ? 'block' : 'none';
            });
            store.stt.provider = provider;
        }

        async function fetchSTTModels() {
            const url = document.getElementById('stt-openai-url').value.trim();
            const key = document.getElementById('stt-openai-key').value.trim();
            if (!url || !key) return toast('请先填写 API Endpoint 和 Key', 'error');
            toast('正在拉取模型...', 'info');
            try {
                const data = await API.fetchModels(url, key);
                const models = Array.isArray(data) ? data : (data.data || []);
                if (models.length === 0) return toast('未获取到模型列表', 'error');
                const sel = document.getElementById('stt-openai-model');
                const currentVal = sel.value;
                sel.innerHTML = '';
                models.forEach(m => {
                    const id = m.id || m;
                    const opt = document.createElement('option');
                    opt.value = id;
                    opt.textContent = id;
                    sel.appendChild(opt);
                });
                // 保持之前选中的模型（如果还在列表中）
                if (models.find(m => (m.id || m) === currentVal)) {
                    sel.value = currentVal;
                }
                toast('拉取成功，共 ' + models.length + ' 个模型', 'success');
            } catch(e) {
                console.error('STT fetchModels error:', e);
            }
        }

        function saveSTTSettings() {
            if (!store.stt) store.stt = {};
            store.stt.enabled = document.getElementById('stt-enabled').checked;
            store.stt.language = document.getElementById('stt-language').value;
            store.stt.openai = {
                url: document.getElementById('stt-openai-url').value.trim(),
                key: document.getElementById('stt-openai-key').value.trim(),
                model: document.getElementById('stt-openai-model').value
            };
            store.stt.google = { key: document.getElementById('stt-google-key').value.trim() };
            store.stt.tencent = {
                secretId: document.getElementById('stt-tencent-id').value.trim(),
                secretKey: document.getElementById('stt-tencent-key').value.trim()
            };
            store.stt.xfyun = {
                appId: document.getElementById('stt-xfyun-appid').value.trim(),
                apiKey: document.getElementById('stt-xfyun-key').value.trim(),
                apiSecret: document.getElementById('stt-xfyun-secret').value.trim()
            };
            store.stt.azure = {
                key: document.getElementById('stt-azure-key').value.trim(),
                region: document.getElementById('stt-azure-region').value.trim()
            };
            store.stt.custom = {
                url: document.getElementById('stt-custom-url').value.trim(),
                key: document.getElementById('stt-custom-key').value.trim()
            };
            save();
            toast('语音识别设置已保存', 'success');
        }

        async function testSTTSettings() {
            // 先保存当前表单值到 store，避免用户没点保存就测试
            saveSTTSettings();
            if (!store.stt?.enabled) return toast('请先开启语音识别', 'error');
            if (!store.stt.provider) return toast('请选择服务商', 'error');
            toast('正在录音3秒，请说话...');
            // Pre-check: mediaDevices API requires HTTPS
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return toast('测试失败: 当前环境不支持录音。请使用HTTPS访问，并确保使用Chrome/Edge/Safari等现代浏览器', 'error');
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
                                 MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
                const mediaRecorder = new MediaRecorder(stream, { mimeType });
                const chunks = [];
                mediaRecorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
                mediaRecorder.start(500); // 每500ms收集一次数据，确保有数据
                await new Promise(r => setTimeout(r, 3000));
                // 先绑定onstop再stop，避免竞态
                const stopPromise = new Promise(r => { mediaRecorder.onstop = r; });
                mediaRecorder.stop();
                await stopPromise;
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(chunks, { type: mimeType });
                console.log('STT test: recorded blob size=' + blob.size + ' type=' + blob.type);
                if (blob.size < 100) return toast('录音数据太小，请检查麦克风', 'error');
                toast('录音完成，正在识别...');
                const text = await callSTTApi(blob);
                if (text) {
                    toast('识别结果: ' + text, 'success');
                } else {
                    toast('未识别到内容（API返回空文本）', 'error');
                }
            } catch(e) {
                console.error('STT test error:', e);
                let errMsg = e.message || '未知错误';
                if (e.name === 'NotAllowedError' || (e.message && e.message.includes('Permission denied'))) {
                    errMsg = '麦克风权限被拒绝。请在浏览器设置中允许麦克风访问，然后重试';
                } else if (e.name === 'NotFoundError') {
                    errMsg = '未检测到麦克风设备，请检查麦克风是否正确连接';
                } else if (e.name === 'NotReadableError' || e.name === 'AbortError') {
                    errMsg = '麦克风被其他应用占用，请关闭其他录音程序后重试';
                } else if (e.name === 'SecurityError' || (typeof navigator.mediaDevices === 'undefined')) {
                    errMsg = '需要HTTPS环境才能使用麦克风。请使用 https:// 访问本站';
                } else if (e.name === 'TypeError' && !navigator.mediaDevices) {
                    errMsg = '当前浏览器不支持录音功能，请使用Chrome/Edge/Safari等现代浏览器';
                }
                toast('测试失败: ' + errMsg, 'error');
            }
        }

        // --- IMAGE GENERATION (生图管理) SETTINGS & API ---
        function initImgGenSettings() {
            if (!store.imgGen) store.imgGen = { enabled: false, provider: 'openai', autoGen: true, openai: { url: 'https://api.openai.com/v1', key: '', model: 'dall-e-3', size: '1024x1024' }, stability: { key: '', model: 'stable-diffusion-xl-1024-v1-0' }, gemini: { key: '', model: 'gemini-2.0-flash-exp-image-generation' }, qwen: { key: '', model: 'wanx-v1', size: '1024*1024' }, siliconflow: { key: '', model: 'stabilityai/stable-diffusion-3-5-large', size: '1024x1024' }, custom: { url: '', key: '', model: '' } };
            const ig = store.imgGen;
            document.getElementById('imggen-enabled').checked = ig.enabled;
            document.getElementById('imggen-config-area').style.display = ig.enabled ? 'block' : 'none';
            document.getElementById('imggen-auto').checked = ig.autoGen !== false;

            // Fill provider configs
            document.getElementById('imggen-openai-url').value = ig.openai?.url || 'https://api.openai.com/v1';
            document.getElementById('imggen-openai-key').value = ig.openai?.key || '';
            document.getElementById('imggen-openai-model').value = ig.openai?.model || 'dall-e-3';
            document.getElementById('imggen-openai-size').value = ig.openai?.size || '1024x1024';

            document.getElementById('imggen-stability-key').value = ig.stability?.key || '';
            document.getElementById('imggen-stability-model').value = ig.stability?.model || 'stable-diffusion-xl-1024-v1-0';

            document.getElementById('imggen-gemini-key').value = ig.gemini?.key || '';
            document.getElementById('imggen-gemini-model').value = ig.gemini?.model || 'gemini-2.0-flash-exp-image-generation';

            document.getElementById('imggen-qwen-key').value = ig.qwen?.key || '';
            document.getElementById('imggen-qwen-model').value = ig.qwen?.model || 'wanx-v1';
            document.getElementById('imggen-qwen-size').value = ig.qwen?.size || '1024*1024';

            document.getElementById('imggen-siliconflow-key').value = ig.siliconflow?.key || '';
            document.getElementById('imggen-siliconflow-model').value = ig.siliconflow?.model || 'stabilityai/stable-diffusion-3-5-large';
            document.getElementById('imggen-siliconflow-size').value = ig.siliconflow?.size || '1024x1024';

            if (document.getElementById('imggen-novelai-key')) document.getElementById('imggen-novelai-key').value = ig.novelai?.key || '';
            if (document.getElementById('imggen-novelai-model')) document.getElementById('imggen-novelai-model').value = ig.novelai?.model || 'nai-diffusion-4-curated-preview';
            if (document.getElementById('imggen-novelai-size')) document.getElementById('imggen-novelai-size').value = ig.novelai?.size || '1024x1024';
            if (document.getElementById('imggen-novelai-custom-proxy')) document.getElementById('imggen-novelai-custom-proxy').value = ig.novelai?.customProxy || '';
            // 初始化连接模式
            if (typeof selectNovelAIConnectMode === 'function') selectNovelAIConnectMode(ig.novelai?.connectMode || 'proxy', true);

            document.getElementById('imggen-custom-url').value = ig.custom?.url || '';
            document.getElementById('imggen-custom-key').value = ig.custom?.key || '';
            document.getElementById('imggen-custom-model').value = ig.custom?.model || '';

            selectImgGenProvider(ig.provider || 'openai');
            // 加载自定义生图提示词
            if (document.getElementById('imggen-custom-prompt')) document.getElementById('imggen-custom-prompt').value = ig.customPrompt || '';
        }

        function toggleImgGenEnabled() {
            const enabled = document.getElementById('imggen-enabled').checked;
            document.getElementById('imggen-config-area').style.display = enabled ? 'block' : 'none';
            // [FIX-开关持久化] 切换时立即保存到store，防止返回后状态丢失
            if (!store.imgGen) store.imgGen = { enabled: false, provider: 'openai', autoGen: true, openai: { url: 'https://api.openai.com/v1', key: '', model: 'dall-e-3', size: '1024x1024' }, stability: { key: '', model: 'stable-diffusion-xl-1024-v1-0' }, gemini: { key: '', model: 'gemini-2.0-flash-exp-image-generation' }, qwen: { key: '', model: 'wanx-v1', size: '1024*1024' }, siliconflow: { key: '', model: 'stabilityai/stable-diffusion-3-5-large', size: '1024x1024' }, custom: { url: '', key: '', model: '' } };
            store.imgGen.enabled = enabled;
            save();
        }

        function selectImgGenProvider(provider) {
            if (!store.imgGen) store.imgGen = {};
            document.querySelectorAll('.imggen-provider-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.provider === provider);
            });
            ['openai','stability','gemini','qwen','siliconflow','novelai','custom'].forEach(p => {
                const el = document.getElementById('imggen-' + p + '-config');
                if (el) el.style.display = (p === provider) ? 'block' : 'none';
            });
            store.imgGen.provider = provider;
        }

        function saveImgGenSettings() {
            if (!store.imgGen) store.imgGen = {};
            // [FIX-生图] 保存当前选中的 provider（防御性：确保 provider 字段不丢失）
            const activeProviderBtn = document.querySelector('.imggen-provider-btn.active');
            if (activeProviderBtn && activeProviderBtn.dataset.provider) {
                store.imgGen.provider = activeProviderBtn.dataset.provider;
            }
            store.imgGen.enabled = document.getElementById('imggen-enabled').checked;
            store.imgGen.autoGen = document.getElementById('imggen-auto').checked;
            store.imgGen.openai = {
                url: document.getElementById('imggen-openai-url').value.trim(),
                key: document.getElementById('imggen-openai-key').value.trim(),
                model: document.getElementById('imggen-openai-model').value,
                size: document.getElementById('imggen-openai-size').value
            };
            store.imgGen.stability = {
                key: document.getElementById('imggen-stability-key').value.trim(),
                model: document.getElementById('imggen-stability-model').value
            };
            store.imgGen.gemini = {
                key: document.getElementById('imggen-gemini-key').value.trim(),
                model: document.getElementById('imggen-gemini-model').value
            };
            store.imgGen.qwen = {
                key: document.getElementById('imggen-qwen-key').value.trim(),
                model: document.getElementById('imggen-qwen-model').value,
                size: document.getElementById('imggen-qwen-size').value
            };
            store.imgGen.siliconflow = {
                key: document.getElementById('imggen-siliconflow-key').value.trim(),
                model: document.getElementById('imggen-siliconflow-model').value,
                size: document.getElementById('imggen-siliconflow-size').value
            };
            store.imgGen.novelai = {
                key: document.getElementById('imggen-novelai-key')?.value.trim() || '',
                model: document.getElementById('imggen-novelai-model')?.value || 'nai-diffusion-4-curated-preview',
                size: document.getElementById('imggen-novelai-size')?.value || '1024x1024',
                connectMode: store.imgGen.novelai?.connectMode || 'proxy',
                customProxy: document.getElementById('imggen-novelai-custom-proxy')?.value.trim() || ''
            };
            store.imgGen.custom = {
                url: document.getElementById('imggen-custom-url').value.trim(),
                key: document.getElementById('imggen-custom-key').value.trim(),
                model: document.getElementById('imggen-custom-model').value.trim()
            };
            // 保存自定义生图提示词
            store.imgGen.customPrompt = (document.getElementById('imggen-custom-prompt')?.value || '').trim();
            save();
            toast('生图设置已保存', 'success');
        }

        async function fetchImgGenModels(provider) {
            let url, key;
            switch (provider) {
                case 'openai': {
                    url = document.getElementById('imggen-openai-url').value.trim() || 'https://api.openai.com/v1';
                    key = document.getElementById('imggen-openai-key').value.trim();
                    break;
                }
                case 'siliconflow': {
                    url = 'https://api.siliconflow.cn/v1';
                    key = document.getElementById('imggen-siliconflow-key').value.trim();
                    break;
                }
                case 'custom': {
                    // 从自定义 URL 推断 base URL（去掉末尾的 /images/generations 等路径）
                    let rawUrl = document.getElementById('imggen-custom-url').value.trim();
                    if (!rawUrl) return toast('请先填写自定义 API Endpoint', 'error');
                    // 尝试提取 base URL
                    url = rawUrl.replace(/\/images\/generations\/?$/, '').replace(/\/chat\/completions\/?$/, '').replace(/\/$/, '');
                    key = document.getElementById('imggen-custom-key').value.trim();
                    break;
                }
                default:
                    return toast('该服务商不支持拉取模型', 'error');
            }
            if (!key) return toast('请先填写 API Key', 'error');
            toast('正在拉取模型列表...', 'info');
            try {
                const data = await API.fetchModels(url, key);
                const models = Array.isArray(data) ? data : (data.data || []);
                if (models.length === 0) return toast('未获取到模型列表', 'error');
                const modelNames = models.map(m => m.id || m);

                // 所有服务商统一用 input + picker 弹窗选择
                const inputId = provider === 'openai' ? 'imggen-openai-model'
                    : provider === 'siliconflow' ? 'imggen-siliconflow-model'
                    : 'imggen-custom-model';
                const datalistId = inputId + '-list';
                const input = document.getElementById(inputId);

                // 更新 datalist 选项
                let dl = document.getElementById(datalistId);
                if (dl) {
                    dl.innerHTML = modelNames.map(m => `<option value="${m}">${m}</option>`).join('');
                }

                // 弹出 picker 让用户选择
                const p = document.getElementById('modal-picker');
                const l = document.getElementById('picker-list');
                document.getElementById('picker-title').innerText = "选择生图模型";
                l.innerHTML = modelNames.map(m => `<div class="list-item" onclick="document.getElementById('${inputId}').value='${m}'; document.getElementById('modal-picker').style.display='none'">${m}</div>`).join('');
                p.style.display = 'flex';

                toast('拉取成功，共 ' + modelNames.length + ' 个模型', 'success');
            } catch(e) {
                console.error('[ImgGen] fetchModels error:', e);
                toast('拉取模型失败: ' + (e.message || '未知错误'), 'error');
            }
        }

        // ========== NovelAI 连接模式切换 ==========
        function selectNovelAIConnectMode(mode, silent) {
            if (!store.imgGen) return;
            if (!store.imgGen.novelai) store.imgGen.novelai = { key: '', model: 'nai-diffusion-4-curated-preview', size: '1024x1024', connectMode: 'proxy', customProxy: '' };
            store.imgGen.novelai.connectMode = mode;

            // 更新按钮样式
            const btns = document.querySelectorAll('#imggen-novelai-connect-btns .novelai-connect-btn');
            btns.forEach(btn => {
                if (btn.dataset.mode === mode) {
                    btn.style.background = '#6c5ce7';
                    btn.style.color = '#fff';
                    btn.style.borderColor = '#6c5ce7';
                } else {
                    btn.style.background = '#fafafa';
                    btn.style.color = '#666';
                    btn.style.borderColor = '#e0e0e0';
                }
            });

            // 显示/隐藏自定义代理输入框
            const proxyBox = document.getElementById('imggen-novelai-custom-proxy-box');
            if (proxyBox) proxyBox.style.display = (mode === 'custom-proxy') ? 'block' : 'none';

            // 更新说明文字
            const desc = document.getElementById('imggen-novelai-connect-desc');
            if (desc) {
                switch(mode) {
                    case 'proxy':
                        desc.textContent = '通过 Netlify/Cloudflare 等服务端转发请求，推荐大多数用户使用。';
                        break;
                    case 'direct':
                        desc.textContent = '直接从浏览器连接 NovelAI API。需要科学上网或海外网络环境，可能遇到CORS错误。';
                        break;
                    case 'custom-proxy':
                        desc.textContent = '通过你自己搭建的反向代理连接。代理需转发到 image.api.novelai.net 并返回原始响应。';
                        break;
                }
            }

            if (!silent) {
                save();
                toast('连接方式已切换: ' + (mode === 'proxy' ? '服务端代理' : mode === 'direct' ? '直连' : '自定义代理'), 'success');
            }
        }

        // ========== NovelAI Key 验证 ==========
        async function verifyNovelAIKey() {
            const key = document.getElementById('imggen-novelai-key')?.value.trim();
            if (!key) return toast('请先填写 NovelAI API Key', 'error');

            toast('正在验证 Key...', 'info');
            const verifyUrl = 'https://api.novelai.net/user/subscription';

            // 定义验证请求函数
            async function doVerify(url, headers) {
                const res = await fetch(url, { method: 'GET', headers });
                if (!res.ok) {
                    const errText = await res.text();
                    throw new Error('HTTP ' + res.status + ': ' + errText.substring(0, 200));
                }
                return await res.json();
            }

            try {
                let data;
                const connectMode = store.imgGen?.novelai?.connectMode || 'proxy';

                // 根据连接模式选择验证方式
                if (connectMode === 'direct') {
                    // 直连验证
                    try {
                        data = await doVerify(verifyUrl, { 'Authorization': 'Bearer ' + key });
                    } catch(e) {
                        throw new Error('直连验证失败（可能被CORS阻止）: ' + e.message);
                    }
                } else if (connectMode === 'custom-proxy') {
                    // 通过自定义代理验证
                    const customProxy = document.getElementById('imggen-novelai-custom-proxy')?.value.trim() || '';
                    if (customProxy) {
                        const proxyBase = customProxy.replace(/\/ai\/generate-image\/?$/, '').replace(/\/+$/, '');
                        // 尝试用自定义代理的域名访问subscription
                        const proxyUrl = proxyBase.replace('image.api.novelai.net', 'api.novelai.net') + '/user/subscription';
                        try {
                            data = await doVerify(proxyUrl !== proxyBase + '/user/subscription' ? proxyUrl : verifyUrl, { 'Authorization': 'Bearer ' + key });
                        } catch(e) {
                            // 自定义代理可能不支持subscription端点，尝试CORS代理
                            const corsProxy = (store.system && store.system.corsProxy) ? store.system.corsProxy.trim() : '';
                            if (corsProxy) {
                                data = await doVerify(corsProxy + verifyUrl, { 'Authorization': 'Bearer ' + key });
                            } else {
                                throw new Error('自定义代理验证失败: ' + e.message);
                            }
                        }
                    } else {
                        throw new Error('请先填写自定义代理地址');
                    }
                } else {
                    // 服务端代理模式 - 尝试通过服务端代理或CORS代理
                    let verified = false;
                    // 先尝试全局CORS代理
                    const corsProxy = (store.system && store.system.corsProxy) ? store.system.corsProxy.trim() : '';
                    if (corsProxy) {
                        try {
                            data = await doVerify(corsProxy + verifyUrl, { 'Authorization': 'Bearer ' + key });
                            verified = true;
                        } catch(e) { /* 继续尝试 */ }
                    }
                    // CORS代理失败，尝试直连（可能被CORS阻止）
                    if (!verified) {
                        try {
                            data = await doVerify(verifyUrl, { 'Authorization': 'Bearer ' + key });
                            verified = true;
                        } catch(e) {
                            throw new Error('Key验证失败。如在浏览器中遇到CORS错误属正常现象，可忽略此验证直接测试生图。\n错误: ' + e.message);
                        }
                    }
                }

                // 解析订阅信息
                if (data) {
                    const tierNames = { 0: 'Free (免费)', 1: 'Tablet', 2: 'Scroll', 3: 'Opus' };
                    const tier = tierNames[data.tier] || ('等级 ' + data.tier);
                    const active = data.active ? '✅ 有效' : '❌ 已过期';
                    toast('Key 验证成功！\n订阅等级: ' + tier + ' | 状态: ' + active, 'success', 5000);
                }
            } catch(e) {
                console.error('[NovelAI] Key验证错误:', e);
                toast('验证失败: ' + e.message, 'error', 5000);
            }
        }

        async function testImgGen() {
            saveImgGenSettings();
            if (!store.imgGen?.enabled) return toast('请先开启生图功能', 'error');
            toast('正在测试生图，请稍候...', 'info');
            try {
                const imgUrl = await callImgGenAPI('一只可爱的橘猫坐在窗台上看日落，水彩画风格');
                if (imgUrl) {
                    // Show result in a modal
                    const modal = document.createElement('div');
                    modal.className = 'modal-mask';
                    modal.style.display = 'flex';
                    modal.innerHTML = `<div class="modal-box" style="text-align:center;">
                        <h3 style="margin-bottom:12px;"><i class="fas fa-check-circle" style="color:#07c160;"></i> 生图测试成功</h3>
                        <img src="${imgUrl}" style="max-width:100%; max-height:300px; border-radius:12px; margin-bottom:12px;">
                        <div style="text-align:center; margin-top:10px;">
                            <button onclick="this.closest('.modal-mask').remove()" style="padding:10px 30px; border:none; background:var(--primary,#07c160); color:#fff; border-radius:8px; font-size:14px;">确定</button>
                        </div>
                    </div>`;
                    document.getElementById('device').appendChild(modal);
                }
            } catch(e) {
                toast('生图测试失败: ' + (e.message || '未知错误'), 'error');
            }
        }

        // --- Core Image Generation API Call ---
        async function callImgGenAPI(prompt) {
            const ig = store.imgGen;
            if (!ig || !ig.enabled) throw new Error('生图功能未开启');
            const provider = ig.provider || 'openai';
            let apiKey, reqBody, apiUrl;
            // [FIX-生图诊断] 输出关键调试信息，方便定位失败原因
            // 追加用户自定义提示词
            const customPrompt = (ig.customPrompt || '').trim();
            if (customPrompt) {
                prompt = prompt + ', ' + customPrompt;
                console.log('[ImgGen] 已追加自定义提示词:', customPrompt);
            }
            console.log('[ImgGen] ====== 开始生图 ======');
            console.log('[ImgGen] 服务商:', provider, '| prompt:', prompt.substring(0, 80));
            console.log('[ImgGen] 服务商配置:', JSON.stringify(ig[provider] || {}).substring(0, 200));

            // 规范化URL辅助函数，去除用户可能误粘贴的路径后缀
            function normalizeImgUrl(raw) {
                let u = (raw || '').trim().replace(/\/+$/, '');
                const suffixes = ['/chat/completions', '/completions', '/models', '/embeddings', '/images/generations', '/audio/transcriptions'];
                for (const s of suffixes) {
                    if (u.toLowerCase().endsWith(s)) { u = u.slice(0, -s.length); break; }
                }
                return u.replace(/\/+$/, '');
            }

            switch (provider) {
                case 'openai': {
                    const cfg = ig.openai || {};
                    // 优先用生图专用配置，回退到主API配置
                    const usingFallbackKey = !cfg.key && store.system.key;
                    const usingFallbackUrl = !cfg.url && store.system.url;
                    apiKey = cfg.key || store.system.key;
                    apiUrl = normalizeImgUrl(cfg.url || store.system.url || 'https://api.openai.com/v1');
                    if (!apiKey) throw new Error('请配置OpenAI API Key（生图设置或主API设置）');
                    if (usingFallbackKey || usingFallbackUrl) {
                        console.log('[ImgGen] 注意：使用主API配置回退 - URL:', apiUrl, '| Key来源:', usingFallbackKey ? '主API' : '生图专用');
                    }
                    const openaiModel = cfg.model || 'dall-e-3';
                    // 判断是否使用中转站（非官方API地址）
                    const isOfficialOpenAI = !apiUrl || apiUrl === 'https://api.openai.com/v1' || apiUrl.includes('api.openai.com');
                    // [FIX-生图兼容v3] 根据模型智能构建请求体
                    // 不同模型支持的参数差异很大：
                    //   - dall-e-2/dall-e-3: 支持 prompt, n, size, response_format
                    //   - gpt-image-1: 只支持 prompt, model, quality, size(但格式不同)
                    //   - 中转站: 很多需要 n 和 response_format 参数才能正常工作
                    // 策略v3：统一传 n=1 + response_format=b64_json，提高中转站兼容性
                    //   b64_json 比 url 更可靠（不依赖临时URL，不会过期）
                    //   大多数中转站都支持这两个参数
                    const isDallE = openaiModel.startsWith('dall-e');
                    const isGptImage = openaiModel.startsWith('gpt-image');
                    // [FIX-生图兼容v4] 根据模型类型精细控制参数，提高中转站兼容性
                    // dall-e: 完整参数（n + size + response_format）
                    // gpt-image: 最小参数（不支持 n 和 response_format）
                    // 其他中转站模型: 只加 n，不加 response_format（最常见的报错原因）
                    reqBody = {
                        model: openaiModel,
                        prompt: prompt
                    };
                    if (isDallE) {
                        reqBody.n = 1;
                        reqBody.size = cfg.size || '1024x1024';
                        reqBody.response_format = 'b64_json';
                    } else if (isGptImage) {
                        // gpt-image-1 不支持 n 和 response_format
                        if (cfg.size) reqBody.size = cfg.size;
                    } else {
                        // 未知模型（中转站各种模型如 flux/midjourney 等）
                        // 只加 n=1，不加 response_format 避免中转站报错
                        reqBody.n = 1;
                        if (cfg.size) reqBody.size = cfg.size;
                    }
                    console.log('[ImgGen] OpenAI reqBody:', JSON.stringify(reqBody));
                    break;
                }
                case 'stability': {
                    const cfg = ig.stability || {};
                    apiKey = cfg.key;
                    if (!apiKey) throw new Error('请配置Stability AI API Key');
                    const model = cfg.model || 'stable-diffusion-xl-1024-v1-0';
                    reqBody = {
                        model: model,
                        text_prompts: [{ text: prompt, weight: 1 }],
                        cfg_scale: 7,
                        samples: 1,
                        steps: 30
                    };
                    break;
                }
                case 'gemini': {
                    const cfg = ig.gemini || {};
                    apiKey = cfg.key;
                    if (!apiKey) throw new Error('请配置Google Gemini API Key');
                    reqBody = {
                        model: cfg.model || 'gemini-2.0-flash-exp-image-generation',
                        prompt: prompt
                    };
                    break;
                }
                case 'qwen': {
                    const cfg = ig.qwen || {};
                    apiKey = cfg.key;
                    if (!apiKey) throw new Error('请配置通义万相 API Key');
                    reqBody = {
                        model: cfg.model || 'wanx-v1',
                        prompt: prompt,
                        size: cfg.size || '1024*1024'
                    };
                    break;
                }
                case 'siliconflow': {
                    const cfg = ig.siliconflow || {};
                    apiKey = cfg.key;
                    if (!apiKey) throw new Error('请配置SiliconFlow API Key');
                    reqBody = {
                        model: cfg.model || 'stabilityai/stable-diffusion-3-5-large',
                        prompt: prompt,
                        image_size: cfg.size || '1024x1024',
                        num_inference_steps: 20
                    };
                    break;
                }
                case 'novelai': {
                    const cfg = ig.novelai || {};
                    apiKey = cfg.key;
                    if (!apiKey) throw new Error('请配置NovelAI API Key');
                    const [naiW, naiH] = (cfg.size || '1024x1024').split('x').map(Number);
                    const naiModel = cfg.model || 'nai-diffusion-4-curated-preview';
                    const isNaiV4 = naiModel.includes('nai-diffusion-4');
                    reqBody = {
                        input: prompt,
                        model: naiModel,
                        action: 'generate',
                        parameters: {
                            width: naiW || 1024,
                            height: naiH || 1024,
                            scale: 5,
                            sampler: 'k_euler',
                            steps: 28,
                            n_samples: 1,
                            noise_schedule: 'native',
                            qualityToggle: true,
                            ucPreset: 0,
                            negative_prompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers',
                            // [FIX-NovelAI-v4] v4模型需要额外参数，否则API返回400
                            ...(isNaiV4 ? {
                                params_version: 3,
                                use_coords: false,
                                legacy_v3_extend: false
                            } : {})
                        }
                    };
                    break;
                }
                case 'custom': {
                    const cfg = ig.custom || {};
                    apiKey = cfg.key;
                    apiUrl = normalizeImgUrl(cfg.url);
                    if (!apiKey || !apiUrl) throw new Error('请配置自定义API地址和Key');
                    // [FIX-生图兼容v4] 自定义provider与openai保持一致的参数策略
                    const customModel = cfg.model || '';
                    const isCustomDallE = customModel.startsWith('dall-e');
                    const isCustomGptImage = customModel.startsWith('gpt-image');
                    reqBody = {
                        model: customModel,
                        prompt: prompt
                    };
                    if (isCustomDallE) {
                        reqBody.n = 1;
                        reqBody.size = cfg.size || '1024x1024';
                        reqBody.response_format = 'b64_json';
                    } else if (isCustomGptImage) {
                        if (cfg.size) reqBody.size = cfg.size;
                    } else {
                        // 未知模型：只加 n，不加 response_format 避免中转站报错
                        reqBody.n = 1;
                        if (cfg.size) reqBody.size = cfg.size;
                    }
                    console.log('[ImgGen] Custom reqBody:', JSON.stringify(reqBody));
                    break;
                }
                default:
                    throw new Error('未知的生图服务商: ' + provider);
            }

            // ========== 万能生图策略 ==========
            // 优先级：① 直连API → ② 直连+CORS代理 → ③ Netlify代理(Edge/Function)
            // 确保无论部署在哪里（Netlify/Vercel/静态托管/APK），只要URL+Key正确就能生图
            let json;
            const reqPayload = JSON.stringify({ provider, apiKey, apiUrl, body: reqBody });

            // 辅助：解析API错误信息（通用，直连和代理共用）
            function parseApiError(text, status) {
                let rawDetail = '';
                let errJson = null;
                try {
                    errJson = JSON.parse(text);
                    rawDetail = errJson.message || errJson.error?.message || errJson.detail || (typeof errJson.error === 'string' ? errJson.error : '') || '';
                } catch(_) {
                    rawDetail = text.substring(0, 200);
                }
                const lowerDetail = (rawDetail + '').toLowerCase();
                const lowerText = (text + '').toLowerCase();
                const currentModel = reqBody.model || '(未设置)';
                
                if (lowerDetail.includes('no available channel') || lowerDetail.includes('no available provider') || lowerText.includes('no available channel')) {
                    return { msg: '模型 "' + currentModel + '" 在API分发器上无可用通道。请检查：\n1) 模型名是否正确（如 dall-e-3, gpt-image-1 等）\n2) API分发器是否配置了支持该模型的生图通道（注意：生图用的是 /images/generations 端点，需要单独配置）\n3) 通道是否启用且有余额', isApiError: true };
                } else if (lowerDetail.includes('model') && (lowerDetail.includes('not exist') || lowerDetail.includes('not found') || lowerDetail.includes('does not'))) {
                    return { msg: '模型 "' + currentModel + '" 在该API上不存在。请在生图设置中点击"拉取"获取可用模型，或手动输入正确的模型ID', isApiError: true };
                } else if (lowerDetail.includes('not supported') || lowerDetail.includes('unsupported') || lowerDetail.includes('not available') || lowerDetail.includes('invalid model') || (lowerDetail.includes('model') && lowerDetail.includes('not support'))) {
                    // [FIX-生图兼容v2] 捕获中转站常见的"模型不支持"类错误
                    return { msg: '模型 "' + currentModel + '" 被API拒绝(不支持)。可能原因：\n1) 该中转站未配置生图通道（/images/generations 端点）\n2) 生图通道不支持该模型，尝试更换为 dall-e-3 或 gpt-image-1\n3) 请求参数不兼容，请确认模型名称正确', isApiError: true };
                } else if ((status === 503 && lowerDetail.includes('distributor')) || lowerText.includes('distributor')) {
                    return { msg: 'API分发器503错误：模型 "' + currentModel + '" 无可用通道。请在API分发器后台添加支持生图的通道，或更换模型名称', isApiError: true };
                } else if (lowerDetail.includes('openai_error') || lowerText.includes('openai_error')) {
                    return { msg: 'API上游错误(openai_error)，模型: "' + currentModel + '"。' + rawDetail, isApiError: true };
                } else if (errJson && errJson.error === 'upstream_html_error') {
                    return { msg: '上游API返回了非JSON响应(HTTP ' + (errJson.status || status) + ')，可能是API地址配置错误或服务不可用', isApiError: true };
                } else if (status === 401 || lowerDetail.includes('unauthorized') || lowerDetail.includes('invalid key') || lowerDetail.includes('invalid api key')) {
                    return { msg: 'API Key无效或已过期，请检查生图设置中的Key', isApiError: true };
                } else if (status === 429 || lowerDetail.includes('rate limit') || lowerDetail.includes('quota')) {
                    // [FIX-429重试] 429不标记为isApiError，允许尝试其他通道（CORS代理/Netlify代理）
                    // 中转站的429可能只是该站点限流，换通道可能成功
                    return { msg: 'API请求频率超限或配额不足，请稍后重试', isApiError: false, isRateLimit: true };
                } else if (status === 503) {
                    return { msg: 'API服务暂时不可用(503)，模型: "' + currentModel + '"。可能原因：1) 模型通道不存在 2) 服务过载。请稍后重试或检查模型名称', isApiError: true };
                } else if ((status === 500 || status === 403) && (lowerDetail.includes('download file') || lowerDetail.includes('get file data') || lowerDetail.includes('failed to download'))) {
                    // [FIX-损坏URL] 上游API尝试下载请求中的图片URL失败（URL损坏/乱码/过期）
                    return { msg: '生图失败：请求中包含无法访问的图片链接(HTTP ' + status + ')。\n请检查该联系人的头像和聊天记录中是否有损坏的图片，清理后重试', isApiError: true };
                }
                return { msg: status + ': ' + rawDetail, isApiError: false };
            }

            // 辅助：检测是否为CORS/网络错误（可重试用其他通道）
            function isCORSOrNetworkError(err) {
                if (err.name === 'AbortError') return false; // 超时不算CORS
                const msg = (err.message || '').toLowerCase();
                return (err instanceof TypeError && (
                    msg.includes('failed to fetch') || msg.includes('networkerror') ||
                    msg.includes('network request failed') || msg.includes('load failed') ||
                    msg.includes('cancelled') || msg.includes('the internet connection appears to be offline') ||
                    msg === 'type error'
                ));
            }

            // 辅助：构建直连请求参数
            function buildDirectRequest() {
                let directUrl, directHeaders, directBody, isNovelAI = false;
                switch (provider) {
                    case 'openai':
                    case 'custom': {
                        directUrl = ((apiUrl || 'https://api.openai.com/v1').replace(/\/$/, '')) + '/images/generations';
                        directHeaders = { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' };
                        directBody = JSON.stringify(reqBody);
                        break;
                    }
                    case 'siliconflow': {
                        directUrl = 'https://api.siliconflow.cn/v1/images/generations';
                        directHeaders = { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' };
                        directBody = JSON.stringify(reqBody);
                        break;
                    }
                    case 'gemini': {
                        const gemModel = reqBody.model || 'gemini-2.0-flash-exp-image-generation';
                        directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:generateContent?key=${apiKey}`;
                        directHeaders = { 'Content-Type': 'application/json' };
                        directBody = JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
                        });
                        break;
                    }
                    case 'stability': {
                        const stModel = reqBody.model || 'stable-diffusion-xl-1024-v1-0';
                        if (stModel.startsWith('stable-image')) {
                            directUrl = `https://api.stability.ai/v2beta/stable-image/generate/${stModel.replace('stable-image-', '')}`;
                        } else {
                            directUrl = `https://api.stability.ai/v1/generation/${stModel}/text-to-image`;
                        }
                        directHeaders = { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' };
                        directBody = JSON.stringify(reqBody);
                        break;
                    }
                    case 'qwen': {
                        directUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
                        directHeaders = { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'X-DashScope-Async': 'enable' };
                        directBody = JSON.stringify({ model: reqBody.model || 'wanx-v1', input: { prompt: prompt }, parameters: { size: reqBody.size || '1024*1024', n: 1 } });
                        break;
                    }
                    case 'novelai': {
                        // [FIX-NovelAI连接模式] 根据用户选择的连接方式决定直连URL
                        const naiConnMode = ig.novelai?.connectMode || 'proxy';
                        const naiCustomProxy = (ig.novelai?.customProxy || '').replace(/\/+$/, '');
                        if (naiConnMode === 'custom-proxy' && naiCustomProxy) {
                            // 自定义代理模式：用用户自己的反代地址
                            directUrl = naiCustomProxy;
                        } else {
                            directUrl = 'https://image.api.novelai.net/ai/generate-image';
                        }
                        directHeaders = { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' };
                        directBody = JSON.stringify(reqBody);
                        isNovelAI = true;
                        break;
                    }
                    default:
                        return null;
                }
                return { directUrl, directHeaders, directBody, isNovelAI };
            }

            // 辅助：执行直连请求（支持 NovelAI zip 解析 + 429自动重试）
            async function doDirectFetch(url, headers, body, isNovelAI, timeoutMs = 300000, _retryCount = 0) {
                // [MOD] 不做超时限制
                try {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: headers,
                        body: body
                    });

                    // [FIX-429重试] 遇到429时自动等待后重试一次
                    if (res.status === 429 && _retryCount < 2) {
                        const retryAfter = parseInt(res.headers.get('retry-after') || '0');
                        const waitMs = retryAfter > 0 ? retryAfter * 1000 : ((_retryCount + 1) * 3000);
                        console.log('[ImgGen] 429 频率限制，' + (waitMs/1000) + 's 后重试 (第' + (_retryCount+1) + '次)');
                        await new Promise(r => setTimeout(r, waitMs));
                        return doDirectFetch(url, headers, body, isNovelAI, timeoutMs, _retryCount + 1);
                    }

                    if (isNovelAI && res.ok) {
                        // NovelAI 返回 zip 文件，需要在前端解析提取 PNG
                        const zipBuffer = await res.arrayBuffer();
                        const zipBytes = new Uint8Array(zipBuffer);
                        // 查找 PNG 签名 (89 50 4E 47)
                        let pngStart = -1;
                        for (let i = 0; i < zipBytes.length - 4; i++) {
                            if (zipBytes[i] === 0x89 && zipBytes[i+1] === 0x50 &&
                                zipBytes[i+2] === 0x4E && zipBytes[i+3] === 0x47) {
                                pngStart = i;
                                break;
                            }
                        }
                        if (pngStart === -1) {
                            throw new Error('NovelAI: 响应中未找到PNG图片数据');
                        }
                        const pngBytes = zipBytes.slice(pngStart);
                        // 转换为 base64
                        let binary = '';
                        const chunkSize = 8192;
                        for (let i = 0; i < pngBytes.length; i += chunkSize) {
                            const chunk = pngBytes.subarray(i, Math.min(i + chunkSize, pngBytes.length));
                            binary += String.fromCharCode.apply(null, chunk);
                        }
                        const b64 = btoa(binary);
                        return { json: { data: [{ b64_json: b64 }] }, raw: null };
                    }

                    const text = await res.text();
                    if (!res.ok) {
                        const parsed = parseApiError(text, res.status);
                        const err = new Error(parsed.msg);
                        err.isApiError = parsed.isApiError;
                        err.isRateLimit = parsed.isRateLimit || false;
                        throw err;
                    }
                    return { json: JSON.parse(text), raw: text };
                } catch(e) {
                    throw e;
                }
            }

            // ========== 执行策略 ==========
            const errors = []; // 收集各通道错误
            const directReq = buildDirectRequest();

            // [FIX-NovelAI连接模式] 根据 connectMode 决定是否跳过直连
            const naiConnectMode = (provider === 'novelai' && ig.novelai?.connectMode) || 'proxy';
            // proxy模式 + 官方URL → 跳过直连（CORS不支持）
            // direct模式 → 不跳过（用户明确选择直连）
            // custom-proxy模式 → 不跳过（URL已替换为自定义代理）
            const skipDirect = directReq && directReq.isNovelAI
                && directReq.directUrl.includes('api.novelai.net')
                && naiConnectMode === 'proxy';
            const skipDirectStability = directReq && directReq.directUrl && directReq.directUrl.includes('api.stability.ai');

            // ① 直连API（最快，无需代理，适用于中转站/SiliconFlow/支持CORS的API等）
            if (directReq && !skipDirect && !skipDirectStability) {
                try {
                    console.log('[ImgGen] ① 直连请求:', directReq.directUrl, provider === 'novelai' ? '(连接模式:' + naiConnectMode + ')' : '');
                    const result = await doDirectFetch(directReq.directUrl, directReq.directHeaders, directReq.directBody, directReq.isNovelAI, 300000);
                    json = result.json;
                    // [FIX-生图] 检查 HTTP 200 但响应体包含 error 的情况
                    if (json && (json.error || (json.status && json.status === 'error'))) {
                        const errMsg = json.error?.message || json.error || json.message || '上游返回了错误';
                        console.warn('[ImgGen] ① 直连返回200但包含error:', errMsg);
                        json = null; // 清空，让后续通道重试
                        const err = new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
                        errors.push({ channel: '直连', error: err });
                    } else {
                        console.log('[ImgGen] ① 直连成功');
                    }
                } catch(e) {
                    console.warn('[ImgGen] ① 直连失败:', e.message);
                    errors.push({ channel: '直连', error: e });
                    // 如果是API本身返回的错误（Key错误/模型不存在等），直接抛出，不用重试
                    if (e.isApiError) {
                        if (typeof logApiError === 'function') logApiError(e.message, { source: 'imggen' });
                        throw e;
                    }
                }
            } else if (skipDirect || skipDirectStability) {
                console.log('[ImgGen] ① 跳过直连' + (provider === 'novelai' ? '（连接模式:' + naiConnectMode + '，走服务端代理）' : '（官方API不支持浏览器CORS）') + ':', directReq ? directReq.directUrl : '');
            }

            // ② 直连失败（CORS/网络问题） → 尝试用户配置的 CORS 代理
            if (!json && directReq) {
                const corsProxy = (store.system && store.system.corsProxy) ? store.system.corsProxy.trim() : '';
                if (corsProxy) {
                    try {
                        const proxiedUrl = corsProxy + directReq.directUrl;
                        console.log('[ImgGen] ② CORS代理请求:', proxiedUrl);
                        const result = await doDirectFetch(proxiedUrl, directReq.directHeaders, directReq.directBody, directReq.isNovelAI, 300000);
                        json = result.json;
                        console.log('[ImgGen] ② CORS代理成功');
                    } catch(e) {
                        console.warn('[ImgGen] ② CORS代理失败:', e.message);
                        errors.push({ channel: 'CORS代理', error: e });
                        if (e.isApiError) {
                            if (typeof logApiError === 'function') logApiError(e.message, { source: 'imggen' });
                            throw e;
                        }
                    }
                }
            }

            // ③ 直连+CORS代理都失败 → 尝试 Netlify 代理（Edge Function + Netlify Function）
            if (!json) {
                const proxyPaths = ['/api/imggen', '/api/imggen-fn', '/.netlify/functions/imggen'];
                for (const proxyPath of proxyPaths) {
                    if (json) break;
                    try {
                        console.log('[ImgGen] ③ 服务端代理:', proxyPath);
                        const res = await fetch(proxyPath, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: reqPayload
                        });
                        const text = await res.text();
                        console.log('[ImgGen] 代理响应 status:', res.status, 'body:', text.substring(0, 300));
                        // 检测 HTML 页面（代理未部署时会返回 SPA HTML）
                        if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
                            throw new Error(proxyPath + ' 返回了HTML页面，代理未部署');
                        }
                        if (!res.ok) {
                            const parsed = parseApiError(text, res.status);
                            const err = new Error(parsed.msg);
                            err.isApiError = parsed.isApiError;
                            throw err;
                        }
                        json = JSON.parse(text);
                        // [FIX-生图] 检查 HTTP 200 但响应体包含 error 的情况
                        if (json && (json.error || (json.status && json.status === 'error'))) {
                            const errMsg = json.error?.message || json.error || json.message || '代理返回了错误';
                            console.warn('[ImgGen] ③ 代理返回200但包含error:', errMsg);
                            json = null;
                            const err2 = new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
                            errors.push({ channel: '代理' + proxyPath, error: err2 });
                            continue;
                        }
                        console.log('[ImgGen] ③ 代理成功:', proxyPath);
                    } catch (e) {
                        console.warn('[ImgGen] ③ 代理失败(' + proxyPath + '):', e.message);
                        errors.push({ channel: '代理' + proxyPath, error: e });
                        // API 本身的错误直接抛出
                        if (e.isApiError) {
                            if (typeof logApiError === 'function') logApiError(e.message, { source: 'imggen' });
                            throw e;
                        }
                    }
                }
            }

            // 所有通道都失败
            if (!json) {
                const summary = errors.map(e => e.channel + ': ' + e.error.message).join('\n');
                const finalMsg = '生图失败，所有通道均不可用:\n' + summary + '\n\n建议：\n1) 检查API地址和Key是否正确\n2) 如果是官方API(openai.com/novelai.net等)，可能被CORS阻止，请配置CORS代理或使用中转站\n3) 如部署在Netlify，请检查Edge Function是否正常';
                if (typeof logApiError === 'function') logApiError(finalMsg, { source: 'imggen' });
                throw new Error(finalMsg);
            }

            // Parse response based on provider
            return parseImgGenResponse(json, provider);
        }

        function parseImgGenResponse(json, provider) {
            switch (provider) {
                case 'openai':
                case 'custom':
                case 'siliconflow': {
                    // [FIX-生图兼容v4] 宽容解析，兼容各种中转站返回格式
                    // 标准 OpenAI 格式
                    if (json.data && json.data.length > 0) {
                        const d = json.data[0];
                        if (d.url) return d.url;
                        if (d.b64_json) return 'data:image/png;base64,' + d.b64_json;
                        if (d.b64_image) return 'data:image/png;base64,' + d.b64_image;
                    }
                    // SiliconFlow / 部分中转站 images 数组格式
                    if (json.images && json.images.length > 0) {
                        const img = json.images[0];
                        if (typeof img === 'string') return img.startsWith('data:') || img.startsWith('http') ? img : 'data:image/png;base64,' + img;
                        if (img.url) return img.url;
                        if (img.b64_json) return 'data:image/png;base64,' + img.b64_json;
                        if (img.b64_image) return 'data:image/png;base64,' + img.b64_image;
                    }
                    // 部分中转站直接返回顶层 url/image 字段
                    if (json.url) return json.url;
                    if (json.image_url) return json.image_url;
                    if (json.image) {
                        const img = json.image;
                        return (img.startsWith('data:') || img.startsWith('http')) ? img : 'data:image/png;base64,' + img;
                    }
                    // 兜底：在整个 JSON 中搜索图片 URL
                    const jsonStr = JSON.stringify(json);
                    const urlMatch = jsonStr.match(/"(https?:\/\/[^"]+\.(png|jpg|jpeg|webp)[^"]*)"/i);
                    if (urlMatch) return urlMatch[1];
                    throw new Error('无法从响应中提取图片: ' + jsonStr.substring(0, 200));
                }
                case 'stability': {
                    // Stability AI format: { artifacts: [{ base64: "..." }] }
                    if (json.artifacts && json.artifacts.length > 0 && json.artifacts[0].base64) {
                        return 'data:image/png;base64,' + json.artifacts[0].base64;
                    }
                    // v2 format: { image: "base64..." }
                    if (json.image) return 'data:image/png;base64,' + json.image;
                    throw new Error('Stability AI 响应格式异常: ' + JSON.stringify(json).substring(0, 200));
                }
                case 'gemini': {
                    // Gemini format: { candidates: [{ content: { parts: [{ inlineData: { mimeType, data } }] } }] }
                    if (json.candidates && json.candidates.length > 0) {
                        const parts = json.candidates[0].content?.parts || [];
                        for (const part of parts) {
                            if (part.inlineData) {
                                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                            }
                        }
                    }
                    throw new Error('Gemini 响应中未找到图片: ' + JSON.stringify(json).substring(0, 200));
                }
                case 'qwen': {
                    // Qwen/DashScope format: { output: { results: [{ url: "..." }] } }
                    if (json.output && json.output.results && json.output.results.length > 0) {
                        return json.output.results[0].url;
                    }
                    // Also check task result format
                    if (json.output && json.output.task_status === 'SUCCEEDED' && json.output.results) {
                        return json.output.results[0].url;
                    }
                    throw new Error('通义万相 响应格式异常: ' + JSON.stringify(json).substring(0, 200));
                }
                case 'novelai': {
                    // NovelAI: 代理返回 { data: [{ b64_json: "..." }] } 格式
                    if (json.data && json.data.length > 0 && json.data[0].b64_json) {
                        return 'data:image/png;base64,' + json.data[0].b64_json;
                    }
                    // 兼容其他可能的返回格式
                    if (json.image) return 'data:image/png;base64,' + json.image;
                    if (json.images && json.images.length > 0) return 'data:image/png;base64,' + json.images[0];
                    throw new Error('NovelAI 响应格式异常: ' + JSON.stringify(json).substring(0, 200));
                }
                default:
                    throw new Error('未知的服务商响应格式');
            }
        }

        // --- 音频格式转换：webm/opus → 16kHz 单声道 WAV ---
        async function convertBlobToWav(audioBlob, targetSampleRate = 16000) {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            try {
                const arrayBuffer = await audioBlob.arrayBuffer();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * targetSampleRate), targetSampleRate);
                const source = offlineCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(offlineCtx.destination);
                source.start(0);
                const rendered = await offlineCtx.startRendering();
                const pcm = rendered.getChannelData(0);
                // 编码 WAV
                const buf = new ArrayBuffer(44 + pcm.length * 2);
                const v = new DataView(buf);
                const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
                writeStr(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true);
                writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
                v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
                v.setUint32(24, targetSampleRate, true); v.setUint32(28, targetSampleRate * 2, true);
                v.setUint16(32, 2, true); v.setUint16(34, 16, true);
                writeStr(36, 'data'); v.setUint32(40, pcm.length * 2, true);
                let off = 44;
                for (let i = 0; i < pcm.length; i++, off += 2) {
                    const s = Math.max(-1, Math.min(1, pcm[i]));
                    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                }
                return new Blob([buf], { type: 'audio/wav' });
            } finally { try { audioCtx.close(); } catch(e) {} }
        }

        // --- STT API CALL ---
        async function callSTTApi(audioBlob) {
            const stt = store.stt;
            if (!stt || !stt.enabled) return null;
            const provider = stt.provider || 'openai';
            const lang = stt.language || 'zh';

            try {
                // 统一转换为 WAV 格式（16kHz 单声道），所有 STT 服务都兼容
                let wavBlob;
                try {
                    wavBlob = await convertBlobToWav(audioBlob);
                    console.log('STT: converted to WAV, size=' + wavBlob.size);
                } catch(convErr) {
                    console.warn('STT: WAV conversion failed, using original blob:', convErr);
                    wavBlob = audioBlob; // 降级：用原始格式
                }

                if (provider === 'openai') {
                    let baseUrl = (stt.openai?.url || 'https://api.openai.com/v1').replace(/\/+$/, '');
                    // 确保URL包含 /v1 路径
                    if (!baseUrl.endsWith('/v1')) baseUrl += '/v1';
                    const url = baseUrl + '/audio/transcriptions';
                    const formData = new FormData();
                    formData.append('file', wavBlob, 'audio.wav');
                    formData.append('model', stt.openai?.model || 'whisper-1');
                    if (lang !== 'auto') formData.append('language', lang);
                    console.log('STT calling:', url, 'model:', stt.openai?.model, 'blob:', wavBlob.size, wavBlob.type);
                    // 直接用 fetch，不走 CORS 代理（代理会破坏 multipart 数据）
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + (stt.openai?.key || '') },
                        body: formData
                    });
                    if (!resp.ok) {
                        const errText = await resp.text();
                        console.error('OpenAI STT error response:', errText);
                        throw new Error('OpenAI STT: ' + resp.status + ' ' + errText);
                    }
                    const data = await resp.json();
                    return data.text || '';
                }

                if (provider === 'google') {
                    const buf = await wavBlob.arrayBuffer();
                    // 安全的 base64 编码（避免大文件栈溢出）
                    const bytes = new Uint8Array(buf);
                    let binary = '';
                    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
                    const base64 = btoa(binary);
                    const langCode = lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : lang === 'ko' ? 'ko-KR' : 'zh-CN';
                    const resp = await fetch('https://speech.googleapis.com/v1/speech:recognize?key=' + (stt.google?.key || ''), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            config: { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: langCode },
                            audio: { content: base64 }
                        })
                    });
                    if (!resp.ok) throw new Error('Google STT: ' + resp.status);
                    const data = await resp.json();
                    return data.results?.[0]?.alternatives?.[0]?.transcript || '';
                }

                if (provider === 'azure') {
                    const region = stt.azure?.region || 'eastasia';
                    const langCode = lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : lang === 'ko' ? 'ko-KR' : 'zh-CN';
                    const resp = await fetch(`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${langCode}`, {
                        method: 'POST',
                        headers: {
                            'Ocp-Apim-Subscription-Key': stt.azure?.key || '',
                            'Content-Type': 'audio/wav'
                        },
                        body: wavBlob
                    });
                    if (!resp.ok) throw new Error('Azure STT: ' + resp.status);
                    const data = await resp.json();
                    return data.DisplayText || data.Text || '';
                }

                if (provider === 'tencent') {
                    const formData = new FormData();
                    formData.append('file', wavBlob, 'audio.wav');
                    formData.append('secretId', stt.tencent?.secretId || '');
                    formData.append('secretKey', stt.tencent?.secretKey || '');
                    formData.append('lang', lang);
                    const resp = await fetch('/.netlify/functions/stt', {
                        method: 'POST',
                        body: formData
                    });
                    if (!resp.ok) throw new Error('Tencent STT proxy: ' + resp.status);
                    const data = await resp.json();
                    return data.text || '';
                }

                if (provider === 'xfyun') {
                    const formData = new FormData();
                    formData.append('file', wavBlob, 'audio.wav');
                    formData.append('appId', stt.xfyun?.appId || '');
                    formData.append('apiKey', stt.xfyun?.apiKey || '');
                    formData.append('apiSecret', stt.xfyun?.apiSecret || '');
                    formData.append('lang', lang);
                    formData.append('provider', 'xfyun');
                    const resp = await fetch('/.netlify/functions/stt', {
                        method: 'POST',
                        body: formData
                    });
                    if (!resp.ok) throw new Error('XFYun STT proxy: ' + resp.status);
                    const data = await resp.json();
                    return data.text || '';
                }

                if (provider === 'custom') {
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'audio.webm');
                    if (lang !== 'auto') formData.append('language', lang);
                    const headers = {};
                    if (stt.custom?.key) headers['Authorization'] = 'Bearer ' + stt.custom.key;
                    const resp = await fetch(stt.custom?.url, {
                        method: 'POST',
                        headers,
                        body: formData
                    });
                    if (!resp.ok) throw new Error('Custom STT: ' + resp.status);
                    const data = await resp.json();
                    return data.text || data.transcript || data.result || '';
                }

                return null;
            } catch(e) {
                console.error('STT API error:', e);
                if (typeof logApiError === 'function') logApiError('语音识别失败: ' + e.message, { source: 'stt' });
                toast('语音识别失败: ' + e.message, 'error');
                return null;
            }
        }

        // --- KEEP-ALIVE SETTINGS ---
        function initKeepAliveSettings() {
            const checkbox = document.getElementById('keepalive-enabled');
            if (checkbox && window.KeepAlive) {
                checkbox.checked = window.KeepAlive.isEnabled();
            }

            // ★ Android 原生模式 UI 适配：显示/隐藏对应的状态行和描述
            const _isNativeApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
            if (_isNativeApp) {
                // 显示原生描述，隐藏Web描述
                const descWeb = document.getElementById('ka-desc-web');
                const descNative = document.getElementById('ka-desc-native');
                if (descWeb) descWeb.style.display = 'none';
                if (descNative) descNative.style.display = '';

                // 显示原生前台服务状态行，隐藏Web特有的状态行
                const rowNative = document.getElementById('ka-row-native');
                const rowAudio = document.getElementById('ka-row-audio');
                const rowLock = document.getElementById('ka-row-lock');
                const rowWake = document.getElementById('ka-row-wake');
                const rowBroadcast = document.getElementById('ka-row-broadcast');
                if (rowNative) rowNative.style.display = '';
                if (rowAudio) rowAudio.style.display = 'none';
                if (rowLock) rowLock.style.display = 'none';
                if (rowWake) rowWake.style.display = 'none';
                if (rowBroadcast) rowBroadcast.style.display = 'none';
            }

            updateKeepAliveNotifStatus();
            refreshKeepAliveStatus();

            // 恢复测试状态UI
            if (window._keepAliveTestTimer) {
                updateKeepAliveTestUI(true);
                updateKeepAliveTestLogUI();
            }
        }

        function toggleKeepAlive() {
            if (!window.KeepAlive) {
                toast('后台保活模块未加载', 'error');
                return;
            }
            const checkbox = document.getElementById('keepalive-enabled');
            if (checkbox.checked) {
                window.KeepAlive.enable();
            } else {
                window.KeepAlive.disable();
            }
            setTimeout(refreshKeepAliveStatus, 1000);
        }

        function updateKeepAliveNotifStatus() {
            const el = document.getElementById('keepalive-notif-status');
            if (!el) return;

            // ★ Android 原生模式：通过原生插件检查通知权限，不使用 Web Notification API
            const _isNativeApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
            if (_isNativeApp) {
                if (window.KeepAlive && window.KeepAlive.checkNotificationPermission) {
                    window.KeepAlive.checkNotificationPermission().then(result => {
                        if (result.granted) {
                            el.textContent = '已授权 ✅';
                            el.style.color = '#07c160';
                        } else {
                            el.textContent = '未授权';
                            el.style.color = '#f59e0b';
                        }
                    }).catch(() => {
                        el.textContent = '检查失败';
                        el.style.color = '#999';
                    });
                } else {
                    el.textContent = '原生通知';
                    el.style.color = '#07c160';
                }
                return;
            }

            if (!('Notification' in window)) {
                el.textContent = '不支持';
                el.style.color = '#fa5151';
            } else if (Notification.permission === 'granted') {
                el.textContent = '已授权 ✅';
                el.style.color = '#07c160';
            } else if (Notification.permission === 'denied') {
                el.textContent = '已拒绝 ❌';
                el.style.color = '#fa5151';
            } else {
                el.textContent = '未授权';
                el.style.color = '#f59e0b';
            }
        }

        async function requestKeepAliveNotifPermission() {
            // ★ Android 原生模式：通过原生插件请求通知权限，不弹浏览器权限弹窗
            const _isNativeApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
            if (_isNativeApp) {
                if (window.KeepAlive && window.KeepAlive.checkNotificationPermission) {
                    try {
                        const plugin = window.Capacitor.Plugins.KeepAlive;
                        if (plugin && plugin.requestNotificationPermission) {
                            const result = await plugin.requestNotificationPermission();
                            if (result.granted) {
                                toast('通知权限已授予 ✅', 'success');
                                // 发送原生测试通知
                                if (typeof window.sendNotification === 'function') {
                                    window.sendNotification('YAN', { body: '通知权限测试成功！后台消息将通过此方式提醒你。', tag: 'yan-test-notif' });
                                }
                            } else {
                                toast('请在系统设置中授予通知权限', 'info');
                                // 尝试打开应用设置
                                if (window.KeepAlive.openAppSettings) {
                                    window.KeepAlive.openAppSettings();
                                }
                            }
                        }
                    } catch(e) {
                        toast('请求通知权限失败: ' + e.message, 'error');
                    }
                } else {
                    toast('原生通知已自动启用', 'info');
                }
                updateKeepAliveNotifStatus();
                return;
            }

            if (!('Notification' in window)) {
                toast('您的浏览器不支持通知功能', 'error');
                return;
            }
            try {
                const result = await Notification.requestPermission();
                if (result === 'granted') {
                    toast('通知权限已授予 ✅', 'success');
                    // 发送测试通知 - 统一走 SW showNotification
                    if (typeof window.sendNotification === 'function') {
                        window.sendNotification('YAN', { body: '通知权限测试成功！后台消息将通过此方式提醒你。', tag: 'yan-test-notif' });
                    } else {
                        // fallback: 通过 SW registration
                        try {
                            const reg = await navigator.serviceWorker.getRegistration();
                            if (reg) {
                                reg.showNotification('YAN', { body: '通知权限测试成功！后台消息将通过此方式提醒你。', icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='96' fill='%2307c160'/%3E%3Ctext x='256' y='380' font-size='340' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='bold'%3EY%3C/text%3E%3C/svg%3E" });
                            }
                        } catch(swErr) { console.warn('SW test notif failed:', swErr); }
                    }
                } else {
                    toast('通知权限被拒绝', 'error');
                }
            } catch(e) {
                toast('请求通知权限失败: ' + e.message, 'error');
            }
            updateKeepAliveNotifStatus();
        }

        function refreshKeepAliveStatus() {
            if (!window.KeepAlive) return;
            const status = window.KeepAlive.getStatus();
            const ok = '<span style="color:#07c160;">✅ 运行中</span>';
            const no = '<span style="color:#ccc;">⬚ 未启动</span>';

            const el = (id) => document.getElementById(id);

            // ★ Android 原生模式：显示原生前台服务状态
            if (el('ka-status-native')) {
                if (status.isAndroid || status.isNativeApp) {
                    // 异步检查原生服务状态
                    if (window.KeepAlive.isAndroid && typeof window.Capacitor !== 'undefined') {
                        const plugin = window.Capacitor.Plugins && window.Capacitor.Plugins.KeepAlive;
                        if (plugin && plugin.isRunning) {
                            plugin.isRunning().then(result => {
                                el('ka-status-native').innerHTML = result.running ? ok : no;
                            }).catch(() => {
                                el('ka-status-native').innerHTML = status.nativeServiceRunning ? ok : no;
                            });
                        } else {
                            el('ka-status-native').innerHTML = status.nativeServiceRunning ? ok : no;
                        }
                    } else {
                        el('ka-status-native').innerHTML = no;
                    }
                }
            }

            if (el('ka-status-audio')) el('ka-status-audio').innerHTML = status.silentAudio ? ok : no;
            if (el('ka-status-lock')) el('ka-status-lock').innerHTML = status.webLock ? ok : no;
            if (el('ka-status-wake')) el('ka-status-wake').innerHTML = status.wakeLock ? ok : no;
            if (el('ka-status-timer')) el('ka-status-timer').innerHTML = status.redundantTimer ? ok : no;

            // ★ 新增状态项
            if (el('ka-status-worker')) el('ka-status-worker').innerHTML = status.workerAlive ? ok : no;
            if (el('ka-status-broadcast')) el('ka-status-broadcast').innerHTML = status.broadcastChannel ? ok : no;
            
            // 恢复次数
            if (el('ka-recovery-count')) {
                const count = status.recoveryAttempts || 0;
                el('ka-recovery-count').innerHTML = count > 0
                    ? `<span style="color:#f59e0b;">${count} 次</span>`
                    : '<span style="color:#07c160;">0 次</span>';
            }

            // Service Worker status
            if (el('ka-status-sw')) {
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistration().then(reg => {
                        el('ka-status-sw').innerHTML = reg ? ok : no;
                    }).catch(() => {
                        el('ka-status-sw').innerHTML = no;
                    });
                } else {
                    el('ka-status-sw').innerHTML = '<span style="color:#fa5151;">不支持</span>';
                }
            }
        }

        // ===== ★★★ 后台保活测试功能 ★★★ =====
        // 点击后会持续定时调用API发送简短消息，方便用户测试后台保活是否正常工作
        window._keepAliveTestTimer = null;
        window._keepAliveTestCount = 0;
        window._keepAliveTestStartTime = 0;
        window._keepAliveTestLog = [];

        function startKeepAliveTest() {
            if (window._keepAliveTestTimer) {
                toast('测试已在运行中', 'info');
                return;
            }

            // 检查 API 是否已配置
            if (!store || !store.system || !store.system.url || !store.system.key) {
                toast('请先在设置中配置API地址和密钥', 'error');
                return;
            }

            window._keepAliveTestCount = 0;
            window._keepAliveTestStartTime = Date.now();
            window._keepAliveTestLog = [];

            toast('🧪 后台保活测试已启动！请切换到后台观察', 'success');
            updateKeepAliveTestUI(true);

            // 立即执行第一次
            doKeepAliveTestCall();

            // 每30秒执行一次API调用
            window._keepAliveTestTimer = setInterval(() => {
                doKeepAliveTestCall();
            }, 30000);
        }

        function stopKeepAliveTest() {
            if (window._keepAliveTestTimer) {
                clearInterval(window._keepAliveTestTimer);
                window._keepAliveTestTimer = null;
            }
            updateKeepAliveTestUI(false);
            toast('🛑 后台保活测试已停止', 'info');
        }

        async function doKeepAliveTestCall() {
            window._keepAliveTestCount++;
            const testNum = window._keepAliveTestCount;
            const now = new Date();
            const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
            const isBackground = document.hidden ? '后台' : '前台';

            const logEntry = {
                num: testNum,
                time: timeStr,
                bg: isBackground,
                status: 'pending'
            };

            try {
                console.log(`[KeepAlive测试] 第${testNum}次调用 (${isBackground}) @ ${timeStr}`);

                // 发送一个极简的API请求
                const msgs = [
                    { role: 'system', content: '回复"OK"两个字即可。' },
                    { role: 'user', content: `保活测试 #${testNum}` }
                ];

                const requestBody = {
                    model: store.system.model || 'gpt-3.5-turbo',
                    messages: msgs,
                    temperature: 0.1,
                    max_tokens: 10
                };

                const url = (typeof API !== 'undefined' && API._normalizeBaseUrl) ? API._normalizeBaseUrl(store.system.url) : store.system.url.trim().replace(/\/+$/, '').replace(/\/chat\/completions$/i, '').replace(/\/completions$/i, '').replace(/\/+$/, '');
                const key = store.system.key.trim();
                const fullUrl = url + '/chat/completions';

                // ★ 使用与API._fetch相同的逻辑：原生后台时用插件代理
                let response;
                const _isNativeApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
                const fetchHeaders = {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + key
                };

                if (_isNativeApp && document.hidden) {
                    // 尝试原生HTTP代理
                    try {
                        const plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.KeepAlive;
                        if (plugin && plugin.proxyHttpRequest) {
                            const nativeResult = await plugin.proxyHttpRequest({
                                url: fullUrl,
                                method: 'POST',
                                headers: fetchHeaders,
                                body: JSON.stringify(requestBody)
                            });
                            const status = nativeResult.status || 200;
                            response = {
                                ok: status >= 200 && status < 300,
                                status: status,
                                json: async () => JSON.parse(nativeResult.body || nativeResult.data || '{}')
                            };
                        }
                    } catch(nErr) {
                        console.warn('[KeepAlive测试] 原生代理失败，降级fetch:', nErr);
                    }
                }

                if (!response) {
                    const proxy = (store.system && store.system.corsProxy) ? store.system.corsProxy.trim() : '';
                    const finalUrl = proxy ? proxy + fullUrl : fullUrl;
                    response = await fetch(finalUrl, {
                        method: 'POST',
                        headers: fetchHeaders,
                        body: JSON.stringify(requestBody)
                    });
                }

                if (response.ok) {
                    const data = await response.json();
                    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '(无回复)';
                    logEntry.status = 'success';
                    logEntry.reply = reply.trim().substring(0, 20);
                    console.log(`[KeepAlive测试] ✅ 第${testNum}次成功 (${isBackground}): ${reply.trim()}`);

                    // ★ 发送通知提醒用户测试成功
                    if (document.hidden && typeof window.sendNotification === 'function') {
                        window.sendNotification('🧪 保活测试 #' + testNum, {
                            body: `${isBackground}调用成功 ✅ @ ${timeStr}\n回复: ${reply.trim().substring(0, 30)}`,
                            tag: 'yan-keepalive-test-' + testNum
                        });
                    }
                } else {
                    logEntry.status = 'fail';
                    logEntry.error = 'HTTP ' + response.status;
                    console.error(`[KeepAlive测试] ❌ 第${testNum}次失败 (${isBackground}): HTTP ${response.status}`);

                    if (document.hidden && typeof window.sendNotification === 'function') {
                        window.sendNotification('🧪 保活测试 #' + testNum, {
                            body: `${isBackground}调用失败 ❌ HTTP ${response.status} @ ${timeStr}`,
                            tag: 'yan-keepalive-test-' + testNum
                        });
                    }
                }
            } catch(e) {
                logEntry.status = 'error';
                logEntry.error = e.message;
                console.error(`[KeepAlive测试] ❌ 第${testNum}次异常 (${isBackground}):`, e.message);

                if (document.hidden && typeof window.sendNotification === 'function') {
                    window.sendNotification('🧪 保活测试 #' + testNum, {
                        body: `${isBackground}调用异常 ❌ ${e.message.substring(0, 40)} @ ${timeStr}`,
                        tag: 'yan-keepalive-test-' + testNum
                    });
                }
            }

            window._keepAliveTestLog.push(logEntry);
            // 只保留最近50条
            if (window._keepAliveTestLog.length > 50) {
                window._keepAliveTestLog = window._keepAliveTestLog.slice(-50);
            }

            updateKeepAliveTestLogUI();
        }

        function updateKeepAliveTestUI(running) {
            const startBtn = document.getElementById('ka-test-start-btn');
            const stopBtn = document.getElementById('ka-test-stop-btn');
            const statusEl = document.getElementById('ka-test-status');

            if (startBtn) startBtn.style.display = running ? 'none' : '';
            if (stopBtn) stopBtn.style.display = running ? '' : 'none';
            if (statusEl) {
                statusEl.innerHTML = running
                    ? '<span style="color:#07c160;">🟢 测试运行中（每30秒调用一次API）</span>'
                    : '<span style="color:#999;">⏹ 未运行</span>';
            }
        }

        function updateKeepAliveTestLogUI() {
            const logEl = document.getElementById('ka-test-log');
            if (!logEl) return;

            const elapsed = window._keepAliveTestStartTime
                ? Math.round((Date.now() - window._keepAliveTestStartTime) / 1000)
                : 0;
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;

            let html = `<div style="margin-bottom:8px;font-size:12px;color:#999;">已运行: ${mins}分${secs}秒 | 总调用: ${window._keepAliveTestCount}次</div>`;

            // 倒序显示最近的日志
            const recentLogs = window._keepAliveTestLog.slice(-10).reverse();
            recentLogs.forEach(entry => {
                const icon = entry.status === 'success' ? '✅' : entry.status === 'fail' ? '❌' : entry.status === 'error' ? '💥' : '⏳';
                const color = entry.status === 'success' ? '#07c160' : '#fa5151';
                const detail = entry.status === 'success'
                    ? `回复: ${entry.reply || ''}`
                    : `错误: ${entry.error || '未知'}`;
                html += `<div style="font-size:12px;line-height:1.8;color:${color};">${icon} #${entry.num} [${entry.bg}] ${entry.time} - ${detail}</div>`;
            });

            if (recentLogs.length === 0) {
                html += '<div style="font-size:12px;color:#ccc;">暂无测试记录</div>';
            }

            logEl.innerHTML = html;
        }

        // 暴露到全局
        window.startKeepAliveTest = startKeepAliveTest;
        window.stopKeepAliveTest = stopKeepAliveTest;

        function settingsGoBack() {
            _clearLongPressState();
            if (typeof _blockLongPress !== 'undefined') _blockLongPress = false;
            
            if (currentSettingsPage) {
                // [FIX-开关持久化] 离开STT/生图设置页面时自动保存当前表单状态
                if (currentSettingsPage === 'stt') {
                    try { saveSTTSettings(); } catch(e) { console.warn('Auto-save STT failed:', e); }
                } else if (currentSettingsPage === 'imagegen') {
                    try { saveImgGenSettings(); } catch(e) { console.warn('Auto-save ImgGen failed:', e); }
                }
                const page = document.getElementById('settings-page-' + currentSettingsPage);
                if (page) page.classList.remove('active');
                document.getElementById('settings-menu').style.display = '';
                document.getElementById('settings-nav-title').innerText = '设置';
                currentSettingsPage = null;
            } else {
                // [FIX-返回导航栏v2] 设置主菜单点返回→回到微信"我"Tab，而非直接回桌面
                // 不能用 closeLayer，因为其 rAF 回调会检测不到 active page 后激活桌面
                // 手动移除 .show 并确保微信"我"tab 显示
                var _settingsLayer = document.getElementById('layer-settings');
                if (_settingsLayer) _settingsLayer.classList.remove('show');
                // 确保微信"我"Tab是活跃的（switchTab参数是数字：0=联系人,1=朋友圈,2=我）
                if (typeof switchTab === 'function') switchTab(2);
                // 显示微信底部导航栏
                var _wxTabBar = document.querySelector('#layer-wechat > .wx-tab-bar');
                if (_wxTabBar) _wxTabBar.style.display = '';
                var _bottomNav = document.querySelector('.bottom-nav');
                if (_bottomNav) _bottomNav.style.display = '';
            }
        }

        // ========== API ERROR LOG MODULE ==========
        // 错误类型映射：将技术错误翻译为通俗解释和建议
        function _getErrorExplanation(errorMsg, statusCode) {
            const msg = (errorMsg || '').toLowerCase();
            const code = parseInt(statusCode) || 0;
            
            // 按HTTP状态码分类
            if (code === 401 || msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid api key') || msg.includes('incorrect api key')) {
                return {
                    explanation: '🔑 API密钥无效或已过期',
                    detail: '你提供的API密钥（Key）不被服务器认可，可能是密钥输入错误、已被撤销、或者已过期。',
                    suggestions: [
                        '检查设置中的API Key是否正确，注意不要有多余的空格',
                        '到API服务商的控制台重新生成一个新的Key',
                        '确认API Key对应的账户是否还有余额/额度'
                    ]
                };
            }
            if (code === 403 || msg.includes('403') || msg.includes('forbidden') || msg.includes('permission denied')) {
                return {
                    explanation: '🚫 访问被拒绝，没有权限',
                    detail: '服务器拒绝了你的请求，通常是因为API Key没有访问该功能的权限，或者IP被限制了。',
                    suggestions: [
                        '检查你的API Key是否有对应模型/功能的访问权限',
                        '部分模型需要单独申请访问权限（如GPT-4）',
                        '如果使用代理，确认代理服务是否正常'
                    ]
                };
            }
            if (code === 404 || msg.includes('404') || msg.includes('not found')) {
                // [FIX-v1提示] 根据URL是否已包含版本路径给出不同建议
                const _hasV = /\/v\d+/i.test(msg);
                return {
                    explanation: '❌ API地址找不到（404）',
                    detail: _hasV
                        ? '请求的API地址返回404，你的地址已包含版本路径。请检查域名拼写、API服务是否可用、或该中转站是否支持此接口。'
                        : '请求的API地址不存在，通常是URL路径写错了，比如少了 /v1 或者域名拼写有误。',
                    suggestions: _hasV
                        ? [
                            '检查API地址的域名是否拼写正确',
                            '确认该API服务/中转站是否正常运行',
                            '如果使用第三方服务，参考其文档确认正确的API地址'
                        ]
                        : [
                            '检查API地址是否正确，常见格式: https://api.openai.com/v1',
                            '确认地址末尾是否需要加 /v1 路径',
                            '如果使用第三方服务，参考其文档确认正确的API地址'
                        ]
                };
            }
            if (code === 429 || msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('quota')) {
                return {
                    explanation: '⏱️ 请求太频繁，被限速了',
                    detail: '你发送请求的速度太快，超过了API的限制。也可能是账户的使用额度已经用完了。',
                    suggestions: [
                        '稍等几秒再试，不要连续快速发送消息',
                        '检查API账户的额度/余额是否充足',
                        '考虑升级API套餐以获得更高的调用限制',
                        '如果频繁出现，可以在聊天时适当放慢发送速度'
                    ]
                };
            }
            if (code === 400 || msg.includes('400') || msg.includes('bad request') || msg.includes('invalid')) {
                return {
                    explanation: '⚠️ 请求格式有误（400）',
                    detail: '发送给API的数据格式不正确，可能是消息内容过长、包含不支持的格式、或者模型名称写错了。',
                    suggestions: [
                        '检查选择的模型名称是否正确',
                        '如果消息特别长，尝试缩短对话内容',
                        '检查是否发送了不支持的图片格式（如GIF）',
                        '清除当前对话历史后重试'
                    ]
                };
            }
            if (code === 500 || msg.includes('500') || msg.includes('internal server error')) {
                return {
                    explanation: '💥 API服务器内部出错了',
                    detail: 'API服务器自身出了问题，这不是你的错。服务器可能正在维护或者遇到了临时故障。',
                    suggestions: [
                        '等几分钟后再试',
                        '查看API服务商的状态页面确认是否有故障',
                        '如果持续出错，可以尝试切换到其他模型'
                    ]
                };
            }
            if (code === 502 || msg.includes('502') || msg.includes('bad gateway')) {
                return {
                    explanation: '🌐 网关错误（502）',
                    detail: 'API服务器的网关出了问题，通常是服务器过载或临时维护导致的。',
                    suggestions: [
                        '等几分钟后重试',
                        '检查网络连接是否正常',
                        '查看API服务商的状态页面'
                    ]
                };
            }
            if (code === 503 || msg.includes('503') || msg.includes('service unavailable') || msg.includes('overloaded')) {
                return {
                    explanation: '🔧 API服务暂时不可用',
                    detail: 'API服务器正在维护或过载，暂时无法处理请求。这是临时性的。',
                    suggestions: [
                        '等几分钟后再试',
                        '如果持续不可用，尝试切换到其他API服务或模型',
                        '查看API服务商的官方公告'
                    ]
                };
            }
            if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('aborted') || msg.includes('abort')) {
                return {
                    explanation: '⏰ 请求超时了',
                    detail: '等了太久，API没有响应。可能是网络不好、服务器太忙、或者请求的内容太多导致处理时间过长。',
                    suggestions: [
                        '检查网络连接是否稳定',
                        '缩短消息内容或对话历史',
                        '如果使用代理/VPN，尝试切换节点',
                        '稍后再试'
                    ]
                };
            }
            if (msg.includes('network') || msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('net::')) {
                return {
                    explanation: '📡 网络连接失败',
                    detail: '无法连接到API服务器，可能是你的网络出了问题，或者API服务器地址无法访问。',
                    suggestions: [
                        '检查手机/电脑是否联网',
                        '如果需要翻墙才能访问API，检查代理/VPN是否正常',
                        '确认API地址是否正确且可访问',
                        '尝试使用CORS代理（在API设置中配置）'
                    ]
                };
            }
            if (msg.includes('cors') || msg.includes('cross-origin') || msg.includes('access-control')) {
                return {
                    explanation: '🔒 跨域请求被阻止（CORS）',
                    detail: '浏览器因安全策略阻止了对API的请求。部分API不允许直接从浏览器访问。',
                    suggestions: [
                        '在API设置中配置CORS代理地址',
                        '使用支持CORS的API服务商',
                        '将应用安装为PWA可能有助于解决此问题'
                    ]
                };
            }
            if (msg.includes('html页面') || msg.includes('非json响应') || msg.includes('html page')) {
                // [FIX-v1提示] 根据URL是否已包含版本路径给出不同建议
                const _hasV2 = /\/v\d+/i.test(msg);
                return {
                    explanation: '📄 API地址返回了网页而非数据',
                    detail: _hasV2
                        ? 'API服务器返回的是一个网页而不是预期的JSON数据。你的地址已包含版本路径，可能是API服务暂时不可用、域名有误、或被网络防火墙拦截。'
                        : 'API服务器返回的是一个网页而不是预期的JSON数据，说明API地址路径很可能写错了。',
                    suggestions: _hasV2
                        ? [
                            '确认API服务/中转站当前是否正常运行',
                            '检查域名拼写是否正确',
                            '检查网络环境（是否需要VPN/代理）',
                            '不要把完整的请求路径（如/chat/completions）写在地址里'
                        ]
                        : [
                            '检查API地址末尾是否缺少 /v1 路径',
                            '确认API地址格式正确，例如: https://api.openai.com/v1',
                            '不要把完整的请求路径（如/chat/completions）写在地址里'
                        ]
                };
            }
            if (msg.includes('json') || msg.includes('unexpected token') || msg.includes('parse')) {
                return {
                    explanation: '📋 返回的数据格式异常',
                    detail: 'API返回了无法解析的数据，可能是服务器返回了错误页面，或者API不兼容。',
                    suggestions: [
                        '检查API地址是否正确',
                        '确认API服务兼容OpenAI格式',
                        '查看是否有拼写错误'
                    ]
                };
            }
            if (msg.includes('api not configured') || msg.includes('请先在设置中配置')) {
                return {
                    explanation: '⚙️ API还没有配置',
                    detail: '你还没有在设置中填写API地址和密钥，需要先配置才能使用。',
                    suggestions: [
                        '进入「设置 → API设置」填写API地址和密钥',
                        '如果没有API Key，需要先到服务商注册获取'
                    ]
                };
            }
            // 默认
            return {
                explanation: '❗ API调用失败',
                detail: '发生了一个未识别的错误: ' + (errorMsg || '未知错误'),
                suggestions: [
                    '检查API设置是否正确',
                    '检查网络连接',
                    '稍后重试',
                    '如果问题持续，查看浏览器控制台获取更多信息'
                ]
            };
        }

        // 记录API成功调用
        function logApiCall(context) {
            if (!store.apiCallLogs) store.apiCallLogs = [];
            const logEntry = {
                id: 'call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                type: 'success',
                time: new Date().toISOString(),
                source: (context && context.source) || 'chat',
                model: (context && context.model) ? String(context.model).substring(0, 100) : '',
                url: (context && context.url) ? String(context.url).substring(0, 200) : '',
                via: (context && context.via) || 'direct'  // direct / edge / netlify
            };
            store.apiCallLogs.unshift(logEntry);
            if (store.apiCallLogs.length > 200) store.apiCallLogs = store.apiCallLogs.slice(0, 200);
            if (typeof save === 'function') save();
            _updateErrorLogBadge();
        }

        // 记录API错误
        function logApiError(errorMsg, context) {
            if (!store.apiCallLogs) store.apiCallLogs = [];
            
            // 提取状态码
            const statusMatch = (errorMsg || '').match(/HTTP\s*(\d{3})/i);
            const statusCode = statusMatch ? parseInt(statusMatch[1]) : (context && context.statusCode) || 0;
            
            const explanation = _getErrorExplanation(errorMsg, statusCode);
            
            const logEntry = {
                id: 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                type: 'error',
                time: new Date().toISOString(),
                errorMsg: String(errorMsg || '未知错误').substring(0, 500),
                statusCode: statusCode,
                url: (context && context.url) ? String(context.url).substring(0, 200) : '',
                source: (context && context.source) || 'chat',
                model: (context && context.model) ? String(context.model).substring(0, 100) : '',
                via: (context && context.via) || '',
                explanation: explanation.explanation,
                detail: explanation.detail,
                suggestions: explanation.suggestions
            };
            
            store.apiCallLogs.unshift(logEntry);
            
            // 最多保留200条（成功+失败合并）
            if (store.apiCallLogs.length > 200) {
                store.apiCallLogs = store.apiCallLogs.slice(0, 200);
            }
            
            // 兼容旧字段（部分地方读 apiErrorLogs）
            if (!store.apiErrorLogs) store.apiErrorLogs = [];
            store.apiErrorLogs.unshift(logEntry);
            if (store.apiErrorLogs.length > 50) store.apiErrorLogs = store.apiErrorLogs.slice(0, 50);
            
            if (typeof save === 'function') save();
            
            // 更新badge
            _updateErrorLogBadge();
            
            console.log('[ApiLog] 已记录错误:', logEntry.explanation, logEntry.errorMsg);
        }

        // 更新日志badge数字（显示最近24h错误数）
        function _updateErrorLogBadge() {
            const badge = document.getElementById('error-log-badge');
            if (!badge) return;
            const logs = store.apiCallLogs || store.apiErrorLogs || [];
            const now = Date.now();
            const recentErrCount = logs.filter(l => l.type === 'error' && (now - new Date(l.time).getTime()) < 24 * 60 * 60 * 1000).length;
            if (recentErrCount > 0) {
                badge.textContent = recentErrCount > 99 ? '99+' : recentErrCount;
                badge.style.display = 'inline-flex';
            } else {
                badge.style.display = 'none';
            }
        }

        // 渲染API调用日志列表（成功+失败）
        function renderApiErrorLogs() {
            const list = document.getElementById('api-error-log-list');
            const empty = document.getElementById('api-error-log-empty');
            if (!list || !empty) return;
            
            const logs = store.apiCallLogs || store.apiErrorLogs || [];
            
            if (logs.length === 0) {
                empty.style.display = 'block';
                list.innerHTML = '';
                return;
            }
            
            empty.style.display = 'none';
            
            list.innerHTML = logs.map(log => {
                const time = new Date(log.time);
                const timeStr = _formatLogTime(time);
                const sourceLabel = _getSourceLabel(log.source);
                const isError = log.type === 'error';
                
                const modelHtml = log.model
                    ? `<div class="api-log-model"><i class="fas fa-microchip"></i> ${_escHtml(log.model)}</div>`
                    : '';
                const viaHtml = log.via && log.via !== 'direct'
                    ? `<span class="api-log-via">${log.via === 'edge' ? 'Edge代理' : log.via === 'netlify' ? 'Netlify代理' : _escHtml(log.via)}</span>`
                    : '';

                if (!isError) {
                    // 成功日志
                    return `
                <div class="api-log-item api-log-success">
                    <div class="api-error-log-header">
                        <div class="api-error-log-title">✅ API调用成功</div>
                        <div class="api-error-log-time">${timeStr}</div>
                    </div>
                    <div class="api-log-meta-row">
                        ${sourceLabel}
                        ${viaHtml}
                    </div>
                    ${modelHtml}
                    ${log.url ? `<div class="api-log-url"><i class="fas fa-link"></i> ${_escHtml(log.url)}</div>` : ''}
                </div>`;
                } else {
                    // 错误日志
                    return `
                <div class="api-log-item api-error-log-item">
                    <div class="api-error-log-header">
                        <div class="api-error-log-title">${_escHtml(log.explanation)}</div>
                        <div class="api-error-log-time">${timeStr}</div>
                    </div>
                    <div class="api-log-meta-row">
                        ${sourceLabel}
                        ${viaHtml}
                    </div>
                    ${modelHtml}
                    <div class="api-error-log-detail">${_escHtml(log.detail)}</div>
                    <div class="api-error-log-raw" onclick="this.classList.toggle('expanded')">
                        <div class="api-error-log-raw-label"><i class="fas fa-code"></i> 原始错误信息 <i class="fas fa-chevron-down"></i></div>
                        <div class="api-error-log-raw-content">${_escHtml(log.errorMsg)}${log.url ? '\n\n请求地址: ' + _escHtml(log.url) : ''}${log.statusCode ? '\nHTTP状态码: ' + log.statusCode : ''}</div>
                    </div>
                    <div class="api-error-log-suggestions">
                        <div class="api-error-log-suggestions-title"><i class="fas fa-lightbulb"></i> 解决建议</div>
                        <ul>${(log.suggestions || []).map(s => '<li>' + _escHtml(s) + '</li>').join('')}</ul>
                    </div>
                </div>`;
                }
            }).join('');
        }

        function _formatLogTime(date) {
            const now = new Date();
            const diff = now - date;
            const hh = date.getHours().toString().padStart(2, '0');
            const mm = date.getMinutes().toString().padStart(2, '0');
            const ss = date.getSeconds().toString().padStart(2, '0');
            if (diff < 60000) return hh + ':' + mm + ':' + ss;
            if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前 ' + hh + ':' + mm;
            if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前 ' + hh + ':' + mm;
            if (diff < 172800000) return '昨天 ' + hh + ':' + mm;
            return (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + hh + ':' + mm;
        }
        // 兼容旧引用
        function _formatErrorTime(date) { return _formatLogTime(date); }

        function _getSourceLabel(source) {
            const map = {
                // ── 聊天核心 ──
                'chat-online':       '<span style="background:#e3f2fd;color:#1976d2;padding:2px 8px;border-radius:10px;font-size:11px;">💬 线上聊天</span>',
                'chat-offline':      '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:10px;font-size:11px;">🌙 线下聊天</span>',
                'chat':              '<span style="background:#e3f2fd;color:#1976d2;padding:2px 8px;border-radius:10px;font-size:11px;">💬 聊天</span>',
                'auto_msg':          '<span style="background:#e3f2fd;color:#1565c0;padding:2px 8px;border-radius:10px;font-size:11px;">⏰ 自动消息</span>',
                'plead':             '<span style="background:#fce4ec;color:#c2185b;padding:2px 8px;border-radius:10px;font-size:11px;">🙏 求情</span>',
                'notification-reply':'<span style="background:#e8f4fd;color:#0969b7;padding:2px 8px;border-radius:10px;font-size:11px;">🔔 通知快回</span>',
                // ── 线下模式（副API分场景用，私聊/群聊独立计费） ──
                'offline-solo':      '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:10px;font-size:11px;">🌙 线下私聊</span>',
                'offline-group':     '<span style="background:#e8f5e9;color:#1b5e20;padding:2px 8px;border-radius:10px;font-size:11px;">🌙 线下群聊</span>',
                'offline-group-heart-manual': '<span style="background:#fce4ec;color:#ad1457;padding:2px 8px;border-radius:10px;font-size:11px;">💗 线下群聊心声</span>',
                'group-heart-manual':'<span style="background:#fce4ec;color:#ad1457;padding:2px 8px;border-radius:10px;font-size:11px;">💗 群聊心声</span>',
                // ── 心声 / 状态 ──
                'heartbeat':         '<span style="background:#fce4ec;color:#e91e63;padding:2px 8px;border-radius:10px;font-size:11px;">💗 心声</span>',
                'heartbeat-group':   '<span style="background:#fce4ec;color:#ad1457;padding:2px 8px;border-radius:10px;font-size:11px;">💗 群聊心声</span>',
                // ── 记忆 ──
                'memory':            '<span style="background:#fff8e1;color:#f57f17;padding:2px 8px;border-radius:10px;font-size:11px;">🧠 记忆总结</span>',
                // ── 朋友圈 / 日记 ──
                'moment':            '<span style="background:#e8f5e9;color:#388e3c;padding:2px 8px;border-radius:10px;font-size:11px;">📸 朋友圈</span>',
                'moment-comment':    '<span style="background:#f1f8e9;color:#558b2f;padding:2px 8px;border-radius:10px;font-size:11px;">💬 朋友圈评论</span>',
                'diary':             '<span style="background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:10px;font-size:11px;">📔 日记</span>',
                // ── 媒体 ──
                'tts':               '<span style="background:#fce4ec;color:#c62828;padding:2px 8px;border-radius:10px;font-size:11px;">🔊 语音合成</span>',
                'stt':               '<span style="background:#f3e5f5;color:#7b1fa2;padding:2px 8px;border-radius:10px;font-size:11px;">🎤 语音识别</span>',
                'imggen':            '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:10px;font-size:11px;">🎨 生图</span>',
                'models':            '<span style="background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:10px;font-size:11px;">📋 模型列表</span>',
                // ── 游戏 ──
                'detective':         '<span style="background:#f3e5f5;color:#6a1b9a;padding:2px 8px;border-radius:10px;font-size:11px;">🔍 侦探游戏</span>',
                'horror':            '<span style="background:#fbe9e7;color:#bf360c;padding:2px 8px;border-radius:10px;font-size:11px;">👻 恐怖游戏</span>',
                'game':              '<span style="background:#ede7f6;color:#4527a0;padding:2px 8px;border-radius:10px;font-size:11px;">🎮 互动游戏</span>',
                'gacha':             '<span style="background:#fce4ec;color:#ad1457;padding:2px 8px;border-radius:10px;font-size:11px;">🎰 扭蛋</span>',
                // ── 社交/内容 ──
                'forum':             '<span style="background:#e0f2f1;color:#00695c;padding:2px 8px;border-radius:10px;font-size:11px;">📝 论坛</span>',
                'paopao':            '<span style="background:#e8eaf6;color:#283593;padding:2px 8px;border-radius:10px;font-size:11px;">🎬 泡泡</span>',
                'fanfic':            '<span style="background:#fce4ec;color:#880e4f;padding:2px 8px;border-radius:10px;font-size:11px;">📖 同人文</span>',
                'bottle':            '<span style="background:#e0f7fa;color:#006064;padding:2px 8px;border-radius:10px;font-size:11px;">🍶 漂流瓶</span>',
                'poke-suffix':       '<span style="background:#f3e5f5;color:#7b1fa2;padding:2px 8px;border-radius:10px;font-size:11px;">👆 拍一拍</span>',
                // ── 工具 ──
                'study':             '<span style="background:#f9fbe7;color:#558b2f;padding:2px 8px;border-radius:10px;font-size:11px;">📚 学习</span>',
                'schedule':          '<span style="background:#fff8e1;color:#f57f17;padding:2px 8px;border-radius:10px;font-size:11px;">📅 日程</span>',
                'report':            '<span style="background:#efebe9;color:#4e342e;padding:2px 8px;border-radius:10px;font-size:11px;">📊 报告</span>',
                'couple':            '<span style="background:#fce4ec;color:#c2185b;padding:2px 8px;border-radius:10px;font-size:11px;">💑 情侣</span>',
                'float-ball':        '<span style="background:#e8eaf6;color:#3f51b5;padding:2px 8px;border-radius:10px;font-size:11px;">🔮 悬浮球</span>',
                'other':             '<span style="background:#f5f5f5;color:#616161;padding:2px 8px;border-radius:10px;font-size:11px;">⚙️ 其他</span>'
            };
            return map[source] || ('<span style="background:#f5f5f5;color:#616161;padding:2px 8px;border-radius:10px;font-size:11px;">⚙️ ' + (source || '其他') + '</span>');
        }

        function _escHtml(str) {
            const div = document.createElement('div');
            div.textContent = str || '';
            return div.innerHTML;
        }

        // 清空API调用日志
        function clearApiErrorLogs() {
            const hasLogs = (store.apiCallLogs && store.apiCallLogs.length > 0) || (store.apiErrorLogs && store.apiErrorLogs.length > 0);
            if (!hasLogs) {
                showToast('没有需要清除的日志', 'info');
                return;
            }
            store.apiCallLogs = [];
            store.apiErrorLogs = [];
            if (typeof save === 'function') save();
            renderApiErrorLogs();
            _updateErrorLogBadge();
            showToast('已清空所有API调用日志', 'success');
        }

        // 页面加载时更新badge
        setTimeout(function() { _updateErrorLogBadge(); }, 1000);
        // ========== END API ERROR LOG MODULE ==========

        function confirmClearAllData() {
            const confirmModal = document.getElementById('modal-confirm');
            document.getElementById('confirm-title').innerText = '⚠️ 警告';
            document.getElementById('confirm-text').innerHTML = '此操作将<b style="color:#fa5151;">永久删除所有数据</b>，包括联系人、聊天记录、世界书、日记、设置等。<br><br>此操作<b>不可恢复</b>，请确保已导出备份！';
            document.getElementById('confirm-btn-cancel').onclick = function() {
                confirmModal.style.display = 'none';
            };
            document.getElementById('confirm-btn-ok').innerText = '确认清除';
            document.getElementById('confirm-btn-ok').onclick = function() {
                confirmModal.style.display = 'none';
                clearAllDataNow();
            };
            confirmModal.style.display = 'flex';
        }

        function clearAllDataNow() {
            try {
                // 1. Clear LocalStorage
                localStorage.clear();
                
                // 2. Clear IndexedDB (主数据库)
                const deleteReq = indexedDB.deleteDatabase(DB_NAME);

                // 3. [FIX-数据残留] 清除泡泡存档独立数据库
                try { indexedDB.deleteDatabase('PP_Archives_DB'); } catch(e) {}

                // 4. [FIX-数据残留] 清除 Service Worker 缓存
                try {
                    if (window.caches) {
                        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
                    }
                } catch(e) {}

                deleteReq.onsuccess = () => {
                    toast('所有数据已清除，即将刷新页面...', 'success');
                    setTimeout(() => { location.reload(); }, 1500);
                };
                deleteReq.onerror = () => {
                    toast('所有数据已清除，即将刷新页面...', 'success');
                    setTimeout(() => { location.reload(); }, 1500);
                };
                deleteReq.onblocked = () => {
                    toast('所有数据已清除，即将刷新页面...', 'success');
                    setTimeout(() => { location.reload(); }, 1500);
                };
            } catch(e) {
                toast('清除数据时出错: ' + e.message, 'error');
            }
        }

        // --- BEAUTY SUBPAGE NAVIGATION ---
        let currentBeautyPage = null;

        function openBeautyPage(pageId) {
            // Hide main menu
            document.getElementById('beauty-menu').style.display = 'none';
            // Show target subpage
            const page = document.getElementById('beauty-page-' + pageId);
            if (page) {
                page.classList.add('active');
                currentBeautyPage = pageId;
            }
            // Update nav title
            const titles = {
                'home-style': '主界面美化',
                'chat-style': '聊天美化',
                'font-style': '字体设置',
                'layout-order': '布局排序',
                'global-theme': '全局主题',
                'global-wallpaper': '全局壁纸'
            };
            document.getElementById('beauty-nav-title').innerText = titles[pageId] || '美化';
            
            // Render content if needed
            if (pageId === 'global-theme') syncThemeCardUI();
            if (pageId === 'home-style') renderBeautify();
            if (pageId === 'font-style') {
                if (typeof loadCardFontSettingsUI === 'function') loadCardFontSettingsUI();
                // [FIX-字体预设消失] 每次打开字体设置页面时都刷新字体预设列表
                if (typeof renderFontPresets === 'function') renderFontPresets();
            }
            if (pageId === 'chat-style') {
                renderAvatarFrameGrid();
                updateFramePreview();
                // 同步线下背景预览
                if (typeof _syncOfflineBgBeautyPreview === 'function') _syncOfflineBgBeautyPreview();
                // [FIX-批量背景持久化] 从store恢复批量背景预览图
                if (store.batchChatBg && !_batchBgDataUrl) {
                    _batchBgDataUrl = store.batchChatBg;
                    const _bpPreview = document.getElementById('batch-bg-preview');
                    if (_bpPreview) {
                        _bpPreview.innerHTML = '<img src="' + _batchBgDataUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">';
                        _bpPreview.style.border = 'none';
                        var _bpActions = document.getElementById('batch-bg-actions');
                        if (_bpActions) _bpActions.style.display = 'block';
                        _renderBatchBgContactList();
                    }
                }
                // 同步气泡滑块到当前已保存的值
                if (store.bubbleStyles) {
                    const bs = store.bubbleStyles;
                    const sizeSlider = document.getElementById('bubble-size-slider');
                    const paddingSlider = document.getElementById('bubble-padding-slider');
                    const spacingSlider = document.getElementById('bubble-spacing-slider');
                    const gapSlider = document.getElementById('bubble-gap-slider');
                    const avatarSizeSlider = document.getElementById('avatar-size-slider');
                    const avatarRadiusSlider = document.getElementById('avatar-radius-slider');
                    if (sizeSlider && bs.size) sizeSlider.value = bs.size;
                    if (paddingSlider && bs.padding) paddingSlider.value = bs.padding;
                    if (spacingSlider && bs.spacing) spacingSlider.value = bs.spacing;
                    if (gapSlider && bs.bubbleGap != null) gapSlider.value = bs.bubbleGap;
                    if (avatarSizeSlider && bs.avatarSize) avatarSizeSlider.value = bs.avatarSize;
                    if (avatarRadiusSlider && bs.avatarRadius != null) avatarRadiusSlider.value = bs.avatarRadius;
                    const fontSizeSlider = document.getElementById('bubble-font-size-slider');
                    const fontSizeVal = document.getElementById('bubble-font-size-val');
                    if (fontSizeSlider && bs.bubbleFontSize) { fontSizeSlider.value = bs.bubbleFontSize; if (fontSizeVal) fontSizeVal.innerText = bs.bubbleFontSize + 'px'; }
                }
                if (typeof updateBubblePreview === 'function') updateBubblePreview();
            }
            if (pageId === 'layout-order') renderLayoutOrderPage();
            if (pageId === 'global-wallpaper' && typeof gwpRenderPage === 'function') gwpRenderPage();
        }

        function beautyGoBack() {
            _clearLongPressState();
            if (typeof _blockLongPress !== 'undefined') _blockLongPress = false;
            
            if (currentBeautyPage) {
                // [FIX-预览残留] 离开美化子页面时清理预览残留的style标签
                // 防止预览时注入的avatar-preview-override在返回聊天界面后干扰正式样式
                var _previewCleanup = document.getElementById('avatar-preview-override');
                if (_previewCleanup) _previewCleanup.remove();
                
                // Hide current subpage
                const page = document.getElementById('beauty-page-' + currentBeautyPage);
                if (page) page.classList.remove('active');
                // Show main menu
                document.getElementById('beauty-menu').style.display = 'block';
                document.getElementById('beauty-nav-title').innerText = '美化';
                currentBeautyPage = null;
            } else {
                // [FIX-预览残留] 退出美化App时也清理预览残留
                var _previewCleanup2 = document.getElementById('avatar-preview-override');
                if (_previewCleanup2) _previewCleanup2.remove();
                
                // [FIX-返回导航栏v2] 美化主菜单点返回→回到微信"我"Tab，而非直接回桌面
                var _beautyLayer = document.getElementById('layer-beauty');
                if (_beautyLayer) _beautyLayer.classList.remove('show');
                if (typeof switchTab === 'function') switchTab(2);
                var _wxTabBar2 = document.querySelector('#layer-wechat > .wx-tab-bar');
                if (_wxTabBar2) _wxTabBar2.style.display = '';
                var _bottomNav2 = document.querySelector('.bottom-nav');
                if (_bottomNav2) _bottomNav2.style.display = '';
            }
        }

        // ========== 聊天美化：线下背景图上传 ==========
        function handleOfflineBgBeautyUpload(inputEl) {
            // 如果没传参数，触发文件选择
            if (!inputEl || !inputEl.files) {
                document.getElementById('offline-bg-beauty-file').click();
                return;
            }
            const file = inputEl.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { toast('图片不能超过5MB', 'error'); return; }
            const reader = new FileReader();
            reader.onload = function(ev) {
                offlineSettings.pageBg = ev.target.result;
                offlineSettings.pageBgType = 'image';
                _saveOfflineSettings();
                _syncOfflineBgBeautyPreview();
                _applyOfflinePageBg(); // [FIX-线下背景] 美化入口也需要实时应用背景到线下界面
                toast('线下背景图已上传 ✅');
            };
            reader.readAsDataURL(file);
        }

        function clearOfflinePageBgFromBeauty() {
            delete offlineSettings.pageBg;
            delete offlineSettings.pageBgType;
            _saveOfflineSettings();
            _syncOfflineBgBeautyPreview();
            _applyOfflinePageBg(); // [FIX-线下背景] 美化入口也需要实时应用背景到线下界面
            toast('线下背景已清除');
        }

        function _syncOfflineBgBeautyPreview() {
            const preview = document.getElementById('offline-bg-beauty-preview');
            const placeholder = document.getElementById('offline-bg-beauty-placeholder');
            if (!preview) return;
            if (offlineSettings.pageBgType === 'image' && offlineSettings.pageBg) {
                preview.style.backgroundImage = `url(${offlineSettings.pageBg})`;
                preview.style.backgroundSize = 'cover';
                preview.style.backgroundPosition = 'center';
                if (placeholder) placeholder.style.display = 'none';
            } else if (offlineSettings.pageBgType === 'color' && offlineSettings.pageBg) {
                preview.style.backgroundImage = '';
                preview.style.backgroundColor = offlineSettings.pageBg;
                if (placeholder) placeholder.innerHTML = '<i class="fas fa-palette" style="font-size:24px;display:block;margin-bottom:6px;color:#999;"></i>当前为纯色背景: ' + offlineSettings.pageBg;
            } else {
                preview.style.backgroundImage = '';
                preview.style.backgroundColor = '#fafafa';
                if (placeholder) { placeholder.style.display = ''; placeholder.innerHTML = '<i class="fas fa-cloud-upload-alt" style="font-size:24px;display:block;margin-bottom:6px;color:#ccc;"></i>点击上传线下模式背景图'; }
            }
        }

        // ========== 聊天美化：批量应用美化到联系人 ==========
        function openBatchBeautyApplyModal() {
            const contacts = (store.contacts || []).filter(c => !c.isGroup);
            if (contacts.length === 0) { toast('没有可用的联系人', 'error'); return; }

            const modal = document.createElement('div');
            modal.className = 'modal-mask';
            modal.id = 'modal-batch-beauty-apply';
            modal.style.cssText = 'z-index:10010; display:flex;';
            modal.onclick = function(e) { if (e.target === modal) modal.remove(); };

            let listHtml = contacts.map(c => {
                const avatar = c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((c.name||'?')[0])}`;
                return `<label style="display:flex; align-items:center; padding:10px 12px; border-bottom:1px solid #f0f0f0; cursor:pointer;">
                    <input type="checkbox" value="${c.id}" class="batch-beauty-cb" style="margin-right:10px; width:18px; height:18px;">
                    <img src="${avatar}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; margin-right:10px;">
                    <span style="font-size:14px;">${escapeHtml(c.name)}</span>
                </label>`;
            }).join('');

            modal.innerHTML = `
                <div class="modal-box" style="max-width:400px; max-height:80vh; display:flex; flex-direction:column;">
                    <h3 style="text-align:center; margin-bottom:12px;">批量应用美化设置</h3>
                    <div style="display:flex; gap:8px; margin-bottom:10px;">
                        <button class="beauty-action-btn mini" onclick="document.querySelectorAll('.batch-beauty-cb').forEach(cb=>cb.checked=true)" style="flex:1;">全选</button>
                        <button class="beauty-action-btn mini preset" onclick="document.querySelectorAll('.batch-beauty-cb').forEach(cb=>cb.checked=false)" style="flex:1;">取消全选</button>
                    </div>
                    <div style="flex:1; overflow-y:auto; border:1px solid #eee; border-radius:8px; margin-bottom:12px;">
                        ${listHtml}
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button class="beauty-action-btn mini" onclick="executeBatchBeautyApply()" style="flex:1; background:#07c160; color:#fff;">确认应用</button>
                        <button class="beauty-action-btn mini reset" onclick="document.getElementById('modal-batch-beauty-apply').remove()" style="flex:1;">取消</button>
                    </div>
                </div>`;
            document.getElementById('device').appendChild(modal);
        }

        function executeBatchBeautyApply() {
            const checkboxes = document.querySelectorAll('.batch-beauty-cb:checked');
            const selectedIds = Array.from(checkboxes).map(cb => cb.value);
            if (selectedIds.length === 0) { toast('请至少选择一位联系人', 'error'); return; }

            // 收集当前美化设置
            const currentCSS = store.customCSS || {};
            const currentBubbleStyles = store.bubbleStyles || {};

            let count = 0;
            selectedIds.forEach(id => {
                const c = store.contacts.find(x => x.id === id);
                if (!c) return;
                if (!c.settings) c.settings = {};
                // [FIX-批量美化字段名] 统一使用 contactCSS 对象，与 applyContactCSS() 读取的字段名一致
                if (!c.settings.contactCSS) c.settings.contactCSS = {};
                // 应用气泡CSS
                if (currentCSS.bubble) c.settings.contactCSS.bubble = currentCSS.bubble;
                // 应用全局CSS
                if (currentCSS.global) c.settings.contactCSS.global = currentCSS.global;
                // 应用线下CSS
                if (currentCSS.offline) c.settings.contactCSS.offline = currentCSS.offline;
                // 应用气泡样式参数
                if (Object.keys(currentBubbleStyles).length > 0) {
                    c.settings.bubbleStyles = {...currentBubbleStyles};
                }
                count++;
            });

            save();
            const modal = document.getElementById('modal-batch-beauty-apply');
            if (modal) modal.remove();
            toast(`已应用到 ${count} 位联系人 ✅`);
        }

        // ========== GLOBAL THEME SWITCHING SYSTEM ==========

        /**
         * 切换全局主题
         * @param {string} themeId - 主题标识：'default' | 'cute' | 'korean'
         */
        function switchGlobalTheme(themeId) {
            const body = document.body;
            
            // 移除所有主题class
            body.classList.remove('theme-cute', 'theme-korean', 'theme-mono');
            
            // 根据主题ID添加对应class
            if (themeId === 'cute') {
                body.classList.add('theme-cute');
            } else if (themeId === 'korean') {
                body.classList.add('theme-korean');
            } else if (themeId === 'mono') {
                body.classList.add('theme-mono');
            }
            // 'default' 不需要添加class，因为默认样式由 default-theme.css 和 styles.css 控制
            
            // [FIX-主题切换] 正确处理主题CSS的启用/禁用
            // [FIX-还原后切主题] 更安全的判断：确保customCSS是非空对象且含有实际内容
            const hasCustomCSS = typeof store !== 'undefined' && store.customCSS &&
                typeof store.customCSS === 'object' &&
                (store.customCSS.bubble || store.customCSS.global || store.customCSS.offline);
            
            // [FIX-韩系气泡不生效] 无自定义CSS时，确保移除body上残留的标记class
            // 否则韩系/可爱主题的 :not(.has-custom-bubble-css) 选择器无法匹配气泡规则
            if (!hasCustomCSS) {
                body.classList.remove('has-custom-bubble-css', 'has-custom-global-css', 'has-custom-offline-css');
                // [FIX-空壳style残留] 移除还原美化后可能遗留的空style标签
                // 某些浏览器对空style标签仍会计入CSSOM层叠，干扰主题规则
                ['custom-style-bubble', 'custom-style-global', 'custom-style-offline'].forEach(function(id) {
                    var el = document.getElementById(id);
                    if (el && !el.innerHTML.trim()) el.remove();
                });
            }
            
            // [FIX-主题CSS直接控制] 不再依赖 _enableDefaultTheme() 间接控制
            // 直接按需设置每个CSS link的状态，避免先enable再disable的时序问题
            var defLink = document.getElementById('default-theme-link');
            
            if (themeId === 'default' && !hasCustomCSS) {
                // 无自定义CSS + default主题：启用default-theme.css
                if (defLink) { defLink.disabled = false; defLink.removeAttribute('media'); }
            } else {
                // 有自定义CSS 或 非default主题：禁用default-theme.css
                // 非default主题自带CSS覆盖，有自定义CSS也不需要default兜底
                if (defLink) { defLink.disabled = true; defLink.setAttribute('media', 'not all'); }
            }
            
            // [FIX-主题CSS始终可用] 确保 cute/korean/mono 的CSS link标签始终启用
            // 它们通过 body.theme-xxx 选择器自动控制生效范围，不会互相干扰
            ['cute-theme-link', 'korean-theme-link', 'mono-theme-link'].forEach(function(id) {
                var _link = document.getElementById(id);
                if (_link) { _link.disabled = false; _link.removeAttribute('media'); }
            });
            
            // [FIX-主题切换] 确保自定义CSS的style标签始终在<head>最末尾
            // 这样无论哪个主题，用户自定义CSS都能覆盖主题样式
            if (typeof _moveCustomStylesToEnd === 'function') _moveCustomStylesToEnd();
            
            // 保存到store
            if (typeof store !== 'undefined') {
                store.globalTheme = themeId;
                save();
            }
            
            // 更新UI
            syncThemeCardUI();
            
            // [FIX-还原后切主题] 强制DOM重排，确保主题切换后CSS选择器立即重新评估
            // 某些浏览器对body class变更后的:not()伪类重新匹配有延迟
            void document.body.offsetHeight;
            
            // 显示提示
            if (typeof showToast === 'function') {
                const names = { 'default': '黑白便签风', 'cute': '白色可爱风', 'korean': '韩系极简风', 'mono': '极简黑白风' };
                showToast('已切换至：' + (names[themeId] || themeId));
            }
        }

        /**
         * 同步主题卡片UI选中状态
         */
        function syncThemeCardUI() {
            const currentTheme = (typeof store !== 'undefined' && store.globalTheme) ? store.globalTheme : 'default';
            const cards = document.querySelectorAll('#global-theme-grid .theme-card');
            cards.forEach(card => {
                const cardTheme = card.getAttribute('data-theme');
                if (cardTheme === currentTheme) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }

        /**
         * 初始化全局主题（在页面加载时调用）
         * 注意：此函数在 initCSSCustomization() 之后调用
         */
        function initGlobalTheme() {
            if (typeof store !== 'undefined' && store.globalTheme && store.globalTheme !== 'default') {
                const body = document.body;
                body.classList.remove('theme-cute', 'theme-korean', 'theme-mono');
                if (store.globalTheme === 'cute') {
                    body.classList.add('theme-cute');
                } else if (store.globalTheme === 'korean') {
                    body.classList.add('theme-korean');
                } else if (store.globalTheme === 'mono') {
                    body.classList.add('theme-mono');
                }
                // [FIX-主题初始化] 检查是否有自定义CSS
                // [FIX-还原后切主题] 确保customCSS是对象且含有实际内容
                var hasCustomCSS = store.customCSS && typeof store.customCSS === 'object' && (store.customCSS.bubble || store.customCSS.global || store.customCSS.offline);
                if (hasCustomCSS) {
                    // [FIX-主题+自定义CSS共存] 只禁用default-theme.css，保持其他主题CSS可用
                    var _defLink2 = document.getElementById('default-theme-link');
                    if (_defLink2) { _defLink2.disabled = true; _defLink2.setAttribute('media', 'not all'); }
                    ['cute-theme-link', 'korean-theme-link', 'mono-theme-link'].forEach(function(id) {
                        var _link = document.getElementById(id);
                        if (_link) { _link.disabled = false; _link.removeAttribute('media'); }
                    });
                } else {
                    // 无自定义CSS：只禁用default-theme.css，让当前主题CSS生效
                    var defLink = document.getElementById('default-theme-link');
                    if (defLink) { defLink.disabled = true; defLink.setAttribute('media', 'not all'); }
                }
            } else {
                // default主题：检查是否有自定义CSS
                // [FIX-还原后切主题] 确保customCSS是对象且含有实际内容
                var hasCustomCSS2 = typeof store !== 'undefined' && store.customCSS && typeof store.customCSS === 'object' && (store.customCSS.bubble || store.customCSS.global || store.customCSS.offline);
                if (hasCustomCSS2) {
                    // [FIX-主题+自定义CSS共存] default主题+有自定义CSS：只禁用default-theme.css
                    var _defLink3 = document.getElementById('default-theme-link');
                    if (_defLink3) { _defLink3.disabled = true; _defLink3.setAttribute('media', 'not all'); }
                }
            }
            // [FIX-主题初始化] 确保自定义CSS始终在最末尾（如果有的话）
            if (typeof _moveCustomStylesToEnd === 'function') _moveCustomStylesToEnd();
        }

        // ========== COMPONENT BEAUTIFICATION SYSTEM ==========

        // Default component styles
        const defaultCompStyles = {
            bottomNav: { color: '#ffffff', opacity: 45, blur: 15, gradient: false, gradientColor1: '#ffffff', gradientColor2: '#e0e0e0', gradientDir: 'to right', image: '' },
            infoCard:  { color: '#f5f5f5', opacity: 65, blur: 10, gradient: false, gradientColor1: '#f5f5f5', gradientColor2: '#e8e8e8', gradientDir: 'to bottom', image: '' },
            albumCard: { color: '#ffffff', opacity: 55, blur: 12, gradient: false, gradientColor1: '#ffffff', gradientColor2: '#f0f0f0', gradientDir: 'to right', image: '' }
        };

        // Get stored component styles
        function getCompStyles() {
            if (!store.compStyles) store.compStyles = JSON.parse(JSON.stringify(defaultCompStyles));
            return store.compStyles;
        }

        // Switch between component tabs (bottomNav / infoCard / albumCard)
        function switchBeautyCompTab(compName, element) {
            // Update tab active state
            document.querySelectorAll('.beauty-comp-tab').forEach(t => t.classList.remove('active'));
            if (element) element.classList.add('active');
            // Show/hide panels
            document.querySelectorAll('.beauty-comp-panel').forEach(p => p.classList.remove('active'));
            const panel = document.getElementById('beauty-comp-' + compName);
            if (panel) panel.classList.add('active');
        }

        // Switch between color mode and image mode for a component
        function switchCompMode(compName, mode, element) {
            // Update active state on mode buttons within the same panel
            const panel = document.getElementById('beauty-comp-' + compName);
            if (panel) {
                panel.querySelectorAll('.beauty-mode-btn').forEach(btn => btn.classList.remove('active'));
            }
            if (element) element.classList.add('active');

            // Show/hide the corresponding controls
            const colorControls = document.getElementById('beauty-color-' + compName);
            const imageControls = document.getElementById('beauty-image-' + compName);

            if (mode === 'color') {
                if (colorControls) colorControls.style.display = 'block';
                if (imageControls) imageControls.style.display = 'none';
            } else if (mode === 'image') {
                if (colorControls) colorControls.style.display = 'none';
                if (imageControls) imageControls.style.display = 'block';
            }

            // [FIX-美化保存] 持久化模式选择到store，确保刷新后模式不丢失
            const styles = getCompStyles();
            if (!styles[compName]) styles[compName] = {};
            styles[compName].useImageMode = (mode === 'image');
            store.compStyles = styles;
            save();
        }

        // Real-time preview: apply inline styles to the target UI element
        function applyAlbumCardHeight(val) {
            val = parseInt(val) || 160;
            const widget = document.querySelector('.p2-music-widget');
            if (widget) widget.style.height = val + 'px';
            // Scale album disc proportionally
            const disc = document.querySelector('.p2-album-disc');
            if (disc) {
                const discSize = Math.max(60, val - 30);
                disc.style.width = discSize + 'px';
                disc.style.height = discSize + 'px';
            }
            // Save to store
            if (typeof store !== 'undefined') {
                store.albumCardHeight = val;
                saveStore();
            }
        }

        function previewCompStyle(compName) {
            // [FIX-美化保存] 优先从store读取已保存的值，DOM元素不存在时不再使用硬编码默认值
            const styles = getCompStyles();
            const storedS = styles[compName] || {};
            const colorEl = document.getElementById('comp-color-' + compName);
            const color = colorEl ? colorEl.value : (storedS.color || '#ffffff');
            const opacityEl = document.getElementById('comp-opacity-' + compName);
            const opacity = opacityEl ? parseInt(opacityEl.value) : (storedS.opacity != null ? storedS.opacity : 50);
            const blurEl = document.getElementById('comp-blur-' + compName);
            const blur = blurEl ? parseInt(blurEl.value) : (storedS.blur != null ? storedS.blur : 10);
            const gradientEl = document.getElementById('comp-gradient-' + compName);
            const gradientEnabled = gradientEl ? gradientEl.checked : (storedS.gradient || false);

            // Build background value
            const alpha = opacity / 100;
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);

            let bg;
            if (gradientEnabled) {
                // Use main color as gradient color1, comp-grad-color2 as color2
                const c1 = color;
                const gradColor2El = document.getElementById('comp-grad-color2-' + compName);
                const c2 = gradColor2El ? gradColor2El.value : (storedS.gradientColor2 || '#000000');
                const gradDirEl = document.getElementById('comp-grad-dir-' + compName);
                const dir = gradDirEl ? gradDirEl.value : (storedS.gradientDir || 'to right');
                const gradOpacity2El = document.getElementById('comp-grad-opacity2-' + compName);
                const alpha2Raw = gradOpacity2El ? parseInt(gradOpacity2El.value) : (storedS.gradientOpacity2 != null ? storedS.gradientOpacity2 : 30);
                const alpha2 = alpha2Raw / 100;
                const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
                const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
                bg = `linear-gradient(${dir}, rgba(${r1},${g1},${b1},${alpha}), rgba(${r2},${g2},${b2},${alpha2}))`;
            } else {
                bg = `rgba(${r},${g},${b},${alpha})`;
            }

            // Get the stored image for this component
            const imgUrl = storedS.image || '';

            // [FIX-美化保存] 从store中读取useImageMode标记，确保模式在页面刷新后仍然保持
            const colorControls = document.getElementById('beauty-color-' + compName);
            const isColorMode = colorControls ? (colorControls.style.display !== 'none') : !(storedS.useImageMode);

            // Map compName to actual DOM element
            const targetMap = {
                bottomNav: '.bottom-nav',
                infoCard: '.user-info-card',
                albumCard: '.p2-music-widget'
            };
            const target = document.querySelector(targetMap[compName]);
            if (target) {
                if (imgUrl && !isColorMode) {
                    // Image mode: show background image
                    // [FIX-透明度持久化] 使用setProperty+important确保覆盖主题CSS
                    // [FIX-图片缓存] 只在URL变化时更新组件背景图，避免退出重进闪烁
                    if (target.getAttribute('data-comp-img-url') !== imgUrl) {
                        target.style.setProperty('background-image', `url(${imgUrl})`, 'important');
                        target.setAttribute('data-comp-img-url', imgUrl);
                        if (typeof _cacheDesktopImage === 'function') _cacheDesktopImage('comp-' + compName, imgUrl);
                    }
                    target.style.setProperty('background-size', 'cover', 'important');
                    target.style.setProperty('background-position', 'center', 'important');
                    target.style.setProperty('background-color', 'transparent', 'important');
                } else {
                    // Color mode: apply color/gradient
                    // [FIX-透明度持久化] 使用setProperty+important确保覆盖主题CSS
                    target.style.setProperty('background-image', 'none', 'important');
                    target.style.setProperty('background', bg, 'important');
                }
                target.style.setProperty('backdrop-filter', `blur(${blur}px)`, 'important');
                target.style.setProperty('-webkit-backdrop-filter', `blur(${blur}px)`, 'important');
                target.setAttribute('data-comp-styled', '1');
            }
        }

        // Toggle gradient controls visibility
        function toggleGradientControls(compName) {
            const enabled = document.getElementById('comp-gradient-' + compName)?.checked || false;
            const container = document.getElementById('gradient-controls-' + compName);
            if (container) {
                container.style.display = enabled ? 'block' : 'none';
            }
            previewCompStyle(compName);
        }

        // Upload background image for a component
        function uploadCompImage(compName) {
            openImgUploadModal('上传组件背景图片', function(imgUrl) {
                const styles = getCompStyles();
                if (!styles[compName]) styles[compName] = {};
                styles[compName].image = imgUrl;
                save();
                _saveImageNow();
                // Update preview thumbnail
                const previewEl = document.getElementById('comp-img-preview-' + compName);
                if (previewEl) {
                    previewEl.innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
                }
                previewCompStyle(compName);
            });
        }

        // Save all component styles to store and apply them
        function saveCompStyles() {
            const styles = getCompStyles();
            ['bottomNav', 'infoCard', 'albumCard'].forEach(compName => {
                // [FIX-美化保存] 保留已有的useImageMode和image，确保不会被覆盖丢失
                const existingImage = styles[compName]?.image || '';
                const existingUseImageMode = styles[compName]?.useImageMode || false;
                const colorControls = document.getElementById('beauty-color-' + compName);
                // 如果colorControls存在，根据当前显示状态判断；否则沿用已存储的值
                const currentUseImageMode = colorControls ? (colorControls.style.display === 'none') : existingUseImageMode;
                // [FIX-透明度持久化] 使用!= null检查代替||，防止值为0时被默认值覆盖
                const _opEl = document.getElementById('comp-opacity-' + compName);
                const _blEl = document.getElementById('comp-blur-' + compName);
                const _go2El = document.getElementById('comp-grad-opacity2-' + compName);
                const _opVal = _opEl ? parseInt(_opEl.value) : NaN;
                const _blVal = _blEl ? parseInt(_blEl.value) : NaN;
                const _go2Val = _go2El ? parseInt(_go2El.value) : NaN;
                styles[compName] = {
                    color: document.getElementById('comp-color-' + compName)?.value || (styles[compName]?.color || '#ffffff'),
                    opacity: !isNaN(_opVal) ? _opVal : (styles[compName]?.opacity != null ? styles[compName].opacity : 50),
                    blur: !isNaN(_blVal) ? _blVal : (styles[compName]?.blur != null ? styles[compName].blur : 10),
                    gradient: document.getElementById('comp-gradient-' + compName)?.checked || false,
                    gradientColor1: document.getElementById('comp-color-' + compName)?.value || (styles[compName]?.gradientColor1 || '#ffffff'),
                    gradientColor2: document.getElementById('comp-grad-color2-' + compName)?.value || (styles[compName]?.gradientColor2 || '#e0e0e0'),
                    gradientDir: document.getElementById('comp-grad-dir-' + compName)?.value || (styles[compName]?.gradientDir || 'to right'),
                    gradientOpacity2: !isNaN(_go2Val) ? _go2Val : (styles[compName]?.gradientOpacity2 != null ? styles[compName].gradientOpacity2 : 30),
                    image: existingImage,
                    useImageMode: currentUseImageMode
                };
                previewCompStyle(compName);
            });
            store.compStyles = styles;
            save();
            _doSaveNow(); // [FIX-刷新丢数据] 立即持久化
            toast('组件样式已保存', 'success');
        }

        // Reset component styles to defaults (single component or all)
        function resetCompStyles(singleComp) {
            const comps = singleComp ? [singleComp] : ['bottomNav', 'infoCard', 'albumCard'];
            const styles = getCompStyles();
            comps.forEach(compName => {
                styles[compName] = JSON.parse(JSON.stringify(defaultCompStyles[compName]));
            });
            store.compStyles = styles;
            save();
            // Reset UI controls to defaults
            comps.forEach(compName => {
                const def = defaultCompStyles[compName];
                const colorEl = document.getElementById('comp-color-' + compName);
                const opacityEl = document.getElementById('comp-opacity-' + compName);
                const blurEl = document.getElementById('comp-blur-' + compName);
                const gradientEl = document.getElementById('comp-gradient-' + compName);
                if (colorEl) colorEl.value = def.color;
                if (opacityEl) { opacityEl.value = def.opacity; const valEl = document.getElementById('comp-opacity-val-' + compName); if (valEl) valEl.textContent = def.opacity + '%'; }
                if (blurEl) { blurEl.value = def.blur; const valEl = document.getElementById('comp-blur-val-' + compName); if (valEl) valEl.textContent = def.blur + 'px'; }
                if (gradientEl) gradientEl.checked = false;
                // Clear image preview
                const previewEl = document.getElementById('comp-img-preview-' + compName);
                if (previewEl) previewEl.innerHTML = '<span style="color:#999; font-size:12px;">未设置图片</span>';
                // Remove inline styles from target elements
                const targetMap = { bottomNav: '.bottom-nav', infoCard: '.user-info-card', albumCard: '.p2-music-widget' };
                const target = document.querySelector(targetMap[compName]);
                if (target) {
                    // [FIX-透明度持久化] 使用removeProperty清除!important的内联样式
                    target.style.removeProperty('background-image');
                    target.style.removeProperty('background');
                    target.style.removeProperty('background-size');
                    target.style.removeProperty('background-position');
                    target.style.removeProperty('background-color');
                    target.style.removeProperty('backdrop-filter');
                    target.style.removeProperty('-webkit-backdrop-filter');
                    target.removeAttribute('data-comp-styled');
                }
                // Switch back to color mode in UI
                switchCompMode(compName, 'color', document.querySelector('#beauty-comp-' + compName + ' .beauty-mode-btn'));
            });
            const compNames = { bottomNav: '底部导航栏', infoCard: '信息卡片', albumCard: '专辑卡片' };
            const msg = singleComp ? `已重置「${compNames[singleComp] || singleComp}」样式` : '已恢复全部默认样式';
            toast(msg, 'success');
        }

        // Restore saved component styles on page load
        function restoreCompStyles() {
            const styles = getCompStyles();
            ['bottomNav', 'infoCard', 'albumCard'].forEach(compName => {
                const s = styles[compName];
                if (!s) return;
                const colorEl = document.getElementById('comp-color-' + compName);
                const opacityEl = document.getElementById('comp-opacity-' + compName);
                const blurEl = document.getElementById('comp-blur-' + compName);
                const gradientEl = document.getElementById('comp-gradient-' + compName);
                if (colorEl) colorEl.value = s.color;
                if (opacityEl) { opacityEl.value = s.opacity; const valEl = document.getElementById('comp-opacity-val-' + compName); if (valEl) valEl.textContent = s.opacity + '%'; }
                if (blurEl) { blurEl.value = s.blur; const valEl = document.getElementById('comp-blur-val-' + compName); if (valEl) valEl.textContent = s.blur + 'px'; }
                if (gradientEl) gradientEl.checked = s.gradient;
                if (s.image) {
                    const previewEl = document.getElementById('comp-img-preview-' + compName);
                    if (previewEl) previewEl.innerHTML = `<img src="${s.image}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
                }
                // [FIX-美化保存] 恢复保存的模式（颜色/图片），确保UI控件与存储一致
                if (s.useImageMode && s.image) {
                    const colorControls = document.getElementById('beauty-color-' + compName);
                    const imageControls = document.getElementById('beauty-image-' + compName);
                    if (colorControls) colorControls.style.display = 'none';
                    if (imageControls) imageControls.style.display = 'block';
                }
                // [FIX-美化保存] 恢复渐变相关控件值
                if (s.gradientColor2) {
                    const gc2El = document.getElementById('comp-grad-color2-' + compName);
                    if (gc2El) gc2El.value = s.gradientColor2;
                }
                if (s.gradientDir) {
                    const gdEl = document.getElementById('comp-grad-dir-' + compName);
                    if (gdEl) gdEl.value = s.gradientDir;
                }
                if (s.gradientOpacity2 != null) {
                    const go2El = document.getElementById('comp-grad-opacity2-' + compName);
                    if (go2El) go2El.value = s.gradientOpacity2;
                }
                previewCompStyle(compName);
            });
        }

        // Auto-restore on load (delayed to ensure DOM ready)
        setTimeout(restoreCompStyles, 2000);

        // Expose functions globally
        window.switchBeautyCompTab = switchBeautyCompTab;
        window.switchCompMode = switchCompMode;
        window.previewCompStyle = previewCompStyle;
        window.toggleGradientControls = toggleGradientControls;
        window.uploadCompImage = uploadCompImage;
        window.restoreCompStyles = restoreCompStyles; // [FIX-透明度持久化] 导出以便renderDesktop调用
        window.saveCompStyles = saveCompStyles;
        window.resetCompStyles = resetCompStyles;

        // --- LAYOUT ORDER ---
        const defaultLayoutOrder = ['time-date', 'info-card', 'app-grid'];
        const layoutSectionMeta = {
            'time-date': { title: '时间/日期', desc: '主页顶部时间日期显示', icon: 'fas fa-clock', color: '#6366f1' },
            'info-card': { title: '信息卡片', desc: '用户头像、名字、签名', icon: 'fas fa-id-card', color: '#f59e0b' },
            'app-grid': { title: '应用+组件', desc: '4个应用图标与自定义组件', icon: 'fas fa-th-large', color: '#10b981' }
        };

        function getLayoutOrder() {
            if (!store.layoutOrder || !Array.isArray(store.layoutOrder) || store.layoutOrder.length !== 3) {
                store.layoutOrder = [...defaultLayoutOrder];
            }
            return store.layoutOrder;
        }

        function renderLayoutOrderPage() {
            const order = getLayoutOrder();
            const list = document.getElementById('layout-order-list');
            if (!list) return;

            list.innerHTML = order.map((key, idx) => {
                const meta = layoutSectionMeta[key];
                return `<div class="layout-order-item" draggable="true" data-layout-key="${key}">
                    <div class="layout-order-handle"><i class="fas fa-grip-vertical"></i></div>
                    <div class="layout-order-icon" style="background:${meta.color};">
                        <i class="${meta.icon}"></i>
                    </div>
                    <div class="layout-order-text">
                        <div class="layout-order-title">${meta.title}</div>
                        <div class="layout-order-desc">${meta.desc}</div>
                    </div>
                    <div class="layout-order-arrows">
                        <button onclick="moveLayoutItem(${idx},-1)" ${idx === 0 ? 'disabled' : ''}><i class="fas fa-chevron-up"></i></button>
                        <button onclick="moveLayoutItem(${idx},1)" ${idx === order.length - 1 ? 'disabled' : ''}><i class="fas fa-chevron-down"></i></button>
                    </div>
                </div>`;
            }).join('');

            // Setup drag-and-drop
            setupLayoutDragDrop();
            // Update preview
            updateLayoutPreview();
            // Render offset sliders
            renderOffsetSliders();
            updateLayoutPreviewOffsets();
            // Init bottom nav offset slider
            initBottomNavSlider();
        }

        function moveLayoutItem(idx, dir) {
            const order = getLayoutOrder();
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= order.length) return;
            [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
            store.layoutOrder = order;
            renderLayoutOrderPage();
            applyLayoutOrder();
        }

        function setupLayoutDragDrop() {
            const items = document.querySelectorAll('.layout-order-item[draggable]');
            let dragSrc = null;

            items.forEach(item => {
                item.addEventListener('dragstart', function(e) {
                    dragSrc = this;
                    this.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', this.dataset.layoutKey);
                });
                item.addEventListener('dragend', function() {
                    this.classList.remove('dragging');
                    items.forEach(i => i.classList.remove('drag-over'));
                });
                item.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    this.classList.add('drag-over');
                });
                item.addEventListener('dragleave', function() {
                    this.classList.remove('drag-over');
                });
                item.addEventListener('drop', function(e) {
                    e.preventDefault();
                    this.classList.remove('drag-over');
                    if (dragSrc === this) return;
                    const order = getLayoutOrder();
                    const fromKey = dragSrc.dataset.layoutKey;
                    const toKey = this.dataset.layoutKey;
                    const fromIdx = order.indexOf(fromKey);
                    const toIdx = order.indexOf(toKey);
                    if (fromIdx === -1 || toIdx === -1) return;
                    order.splice(fromIdx, 1);
                    order.splice(toIdx, 0, fromKey);
                    store.layoutOrder = order;
                    renderLayoutOrderPage();
                    applyLayoutOrder();
                });
            });

            // Touch drag support
            let touchDragSrc = null;
            let touchClone = null;
            items.forEach(item => {
                item.addEventListener('touchstart', function(e) {
                    touchDragSrc = this;
                    this.classList.add('dragging');
                }, { passive: true });
                item.addEventListener('touchmove', function(e) {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const target = document.elementFromPoint(touch.clientX, touch.clientY);
                    items.forEach(i => i.classList.remove('drag-over'));
                    if (target) {
                        const orderItem = target.closest('.layout-order-item');
                        if (orderItem && orderItem !== touchDragSrc) {
                            orderItem.classList.add('drag-over');
                        }
                    }
                }, { passive: false });
                item.addEventListener('touchend', function(e) {
                    this.classList.remove('dragging');
                    items.forEach(i => i.classList.remove('drag-over'));
                    if (!touchDragSrc) return;
                    const touch = e.changedTouches[0];
                    const target = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (target) {
                        const orderItem = target.closest('.layout-order-item');
                        if (orderItem && orderItem !== touchDragSrc) {
                            const order = getLayoutOrder();
                            const fromKey = touchDragSrc.dataset.layoutKey;
                            const toKey = orderItem.dataset.layoutKey;
                            const fromIdx = order.indexOf(fromKey);
                            const toIdx = order.indexOf(toKey);
                            if (fromIdx !== -1 && toIdx !== -1) {
                                order.splice(fromIdx, 1);
                                order.splice(toIdx, 0, fromKey);
                                store.layoutOrder = order;
                                renderLayoutOrderPage();
                                applyLayoutOrder();
                            }
                        }
                    }
                    touchDragSrc = null;
                }, { passive: true });
            });
        }

        function updateLayoutPreview() {
            const order = getLayoutOrder();
            const previewBox = document.getElementById('layout-preview-box');
            if (!previewBox) return;
            order.forEach((key, idx) => {
                const el = previewBox.querySelector(`[data-preview="${key}"]`);
                if (el) el.style.order = idx;
            });
        }

        function getLayoutOffsets() {
            if (!store.layoutOffsets || typeof store.layoutOffsets !== 'object') {
                store.layoutOffsets = { 'time-date': 0, 'info-card': 0, 'app-grid': 0 };
            }
            return store.layoutOffsets;
        }

        function renderOffsetSliders() {
            const container = document.getElementById('layout-offset-sliders');
            if (!container) return;
            const offsets = getLayoutOffsets();
            const order = getLayoutOrder();

            container.innerHTML = order.map(key => {
                const meta = layoutSectionMeta[key];
                const val = offsets[key] || 0;
                return `<div class="layout-offset-row">
                    <div class="layout-offset-label">
                        <div class="lo-dot" style="background:${meta.color};"></div>
                        <span>${meta.title}</span>
                    </div>
                    <input type="range" class="layout-offset-slider" min="-100" max="100" value="${val}"
                        data-offset-key="${key}"
                        oninput="onLayoutOffsetChange('${key}', this.value)">
                    <div class="layout-offset-val" id="lo-val-${key}">${val}px</div>
                </div>`;
            }).join('');
        }

        function onLayoutOffsetChange(key, val) {
            val = parseInt(val) || 0;
            const offsets = getLayoutOffsets();
            offsets[key] = val;
            store.layoutOffsets = offsets;
            // Update display value
            const valEl = document.getElementById('lo-val-' + key);
            if (valEl) valEl.textContent = val + 'px';
            // Apply to desktop in real-time
            applyLayoutOffsets();
            // Update preview
            updateLayoutPreviewOffsets();
        }

        function applyLayoutOffsets() {
            const offsets = getLayoutOffsets();
            const desktop = document.getElementById('desktop');
            if (!desktop) return;
            Object.keys(offsets).forEach(key => {
                const el = desktop.querySelector(`[data-section="${key}"]`);
                if (el) {
                    const clamped = Math.max(-100, Math.min(100, offsets[key]));
                    el.style.transform = `translateY(${clamped}px)`;
                    el.style.transition = 'transform 0.2s ease';
                }
            });
        }

        function updateLayoutPreviewOffsets() {
            const offsets = getLayoutOffsets();
            const previewBox = document.getElementById('layout-preview-box');
            if (!previewBox) return;
            Object.keys(offsets).forEach(key => {
                const el = previewBox.querySelector(`[data-preview="${key}"]`);
                if (el) {
                    // Scale down the offset for preview (preview is smaller)
                    const scaledOffset = Math.round(offsets[key] * 0.4);
                    el.style.transform = `translateY(${scaledOffset}px)`;
                    el.style.transition = 'transform 0.2s ease';
                }
            });
        }

        function applyLayoutOrder() {
            const order = getLayoutOrder();
            const desktop = document.getElementById('desktop');
            if (!desktop) return;
            // Set desktop to flex column for ordering
            desktop.style.display = 'flex';
            desktop.style.flexDirection = 'column';
            order.forEach((key, idx) => {
                const el = desktop.querySelector(`[data-section="${key}"]`);
                if (el) el.style.order = idx;
            });
            // Also apply offsets
            applyLayoutOffsets();
        }

        function saveLayoutOrder() {
            const order = getLayoutOrder();
            store.layoutOrder = order;
            store.layoutOffsets = getLayoutOffsets();
            save();
            applyLayoutOrder();
            toast('布局已保存', 'success');
        }

        function resetLayoutOrder() {
            store.layoutOrder = [...defaultLayoutOrder];
            store.layoutOffsets = { 'time-date': 0, 'info-card': 0, 'app-grid': 0 };
            store.bottomNavOffset = 0;
            save();
            renderLayoutOrderPage();
            applyLayoutOrder();
            // 重置底部导航栏偏移并还原slider和显示值
            const slider = document.getElementById('bottom-nav-offset-slider');
            if (slider) slider.value = 0;
            const valEl = document.getElementById('lo-val-bottom-nav');
            if (valEl) valEl.textContent = '0px';
            // 应用默认位置（55px基准）
            applyBottomNavOffset();
            toast('布局已恢复默认', 'success');
        }

        // --- 底部导航栏位置偏移 ---
        function onBottomNavOffsetChange(val) {
            val = parseInt(val) || 0;
            store.bottomNavOffset = val;
            const valEl = document.getElementById('lo-val-bottom-nav');
            if (valEl) valEl.textContent = val + 'px';
            applyBottomNavOffset();
        }

        function applyBottomNavOffset() {
            const offset = parseInt(store.bottomNavOffset) || 0;
            const clamped = Math.max(-50, Math.min(50, offset));
            // [FIX-底部栏偏移] 设置到 :root 上，确保所有CSS规则（包括media query和动态注入的样式）都能读取到
            // 正值offset → bottom增大 → 导航栏上移；负值offset → bottom减小 → 导航栏下移
            document.documentElement.style.setProperty('--bottom-nav-offset', clamped + 'px');
            const nav = document.querySelector('.bottom-nav');
            if (nav) {
                // 同时在元素上也设置，确保优先级
                nav.style.setProperty('--bottom-nav-offset', clamped + 'px');
                // 清除旧的inline bottom（如果之前版本设置过）
                nav.style.removeProperty('bottom');
            }
        }

        function initBottomNavSlider() {
            const slider = document.getElementById('bottom-nav-offset-slider');
            if (slider) {
                const val = parseInt(store.bottomNavOffset) || 0;
                slider.value = val;
                const valEl = document.getElementById('lo-val-bottom-nav');
                if (valEl) valEl.textContent = val + 'px';
            }
        }

        // --- PAGE 2 LAYOUT ORDER SYSTEM ---
        // Page 2 now uses a unified grid (same as page 1). Widget order is managed via grid positions.
        const defaultP2LayoutOrder = ['p2-photo', 'p2-album', 'p2-square'];
        const p2LayoutSectionMeta = {
            'p2-photo':    { title: '图片区', desc: '顶部封面图片上传区域', icon: 'fas fa-camera', color: '#e91e63' },
            'p2-album':    { title: '音乐组件', desc: '音乐播放器/专辑封面组件', icon: 'fas fa-music', color: '#9c27b0' },
            'p2-square':   { title: '正方形组件', desc: '图片/组件 (2×2网格)', icon: 'fas fa-square', color: '#2196f3' }
        };

        function switchLayoutPage(page, el) {
            document.querySelectorAll('.beauty-comp-tab').forEach(t => t.classList.remove('active'));
            if (el) el.classList.add('active');
            const p1 = document.getElementById('layout-page-p1');
            const p2 = document.getElementById('layout-page-p2');
            if (page === 'p1') {
                if (p1) p1.style.display = '';
                if (p2) p2.style.display = 'none';
                renderLayoutOrderPage();
            } else {
                if (p1) p1.style.display = 'none';
                if (p2) p2.style.display = '';
                renderP2LayoutOrderPage();
            }
        }

        function getP2LayoutOrder() {
            if (!store.p2LayoutOrder || !Array.isArray(store.p2LayoutOrder) || store.p2LayoutOrder.length !== defaultP2LayoutOrder.length) {
                store.p2LayoutOrder = [...defaultP2LayoutOrder];
            }
            return store.p2LayoutOrder;
        }

        function getP2LayoutOffsets() {
            if (!store.p2LayoutOffsets || typeof store.p2LayoutOffsets !== 'object') {
                store.p2LayoutOffsets = { 'p2-photo': 0, 'p2-album': 0, 'p2-square': 0 };
            }
            return store.p2LayoutOffsets;
        }

        function renderP2LayoutOrderPage() {
            const order = getP2LayoutOrder();
            const list = document.getElementById('p2-layout-order-list');
            if (!list) return;

            list.innerHTML = order.map((key, idx) => {
                const meta = p2LayoutSectionMeta[key];
                if (!meta) return '';
                return `<div class="layout-order-item" draggable="true" data-layout-key="${key}">
                    <div class="layout-order-handle"><i class="fas fa-grip-vertical"></i></div>
                    <div class="layout-order-icon" style="background:${meta.color};">
                        <i class="${meta.icon}"></i>
                    </div>
                    <div class="layout-order-text">
                        <div class="layout-order-title">${meta.title}</div>
                        <div class="layout-order-desc">${meta.desc}</div>
                    </div>
                    <div class="layout-order-arrows">
                        <button onclick="moveP2LayoutItem(${idx},-1)" ${idx === 0 ? 'disabled' : ''}><i class="fas fa-chevron-up"></i></button>
                        <button onclick="moveP2LayoutItem(${idx},1)" ${idx === order.length - 1 ? 'disabled' : ''}><i class="fas fa-chevron-down"></i></button>
                    </div>
                </div>`;
            }).join('');

            setupP2LayoutDragDrop();
            updateP2LayoutPreview();
            renderP2OffsetSliders();
            updateP2LayoutPreviewOffsets();
            restoreP2PhotoHeight();
            initP2BottomAppsSlider();
        }

        function moveP2LayoutItem(idx, dir) {
            const order = getP2LayoutOrder();
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= order.length) return;
            [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
            store.p2LayoutOrder = order;
            renderP2LayoutOrderPage();
            applyP2LayoutOrder();
        }

        function setupP2LayoutDragDrop() {
            const items = document.querySelectorAll('#p2-layout-order-list .layout-order-item[draggable]');
            let dragSrc = null;

            items.forEach(item => {
                item.addEventListener('dragstart', function(e) {
                    dragSrc = this;
                    this.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', this.dataset.layoutKey);
                });
                item.addEventListener('dragend', function() {
                    this.classList.remove('dragging');
                    items.forEach(i => i.classList.remove('drag-over'));
                });
                item.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    this.classList.add('drag-over');
                });
                item.addEventListener('dragleave', function() {
                    this.classList.remove('drag-over');
                });
                item.addEventListener('drop', function(e) {
                    e.preventDefault();
                    this.classList.remove('drag-over');
                    if (dragSrc === this) return;
                    const order = getP2LayoutOrder();
                    const fromKey = dragSrc.dataset.layoutKey;
                    const toKey = this.dataset.layoutKey;
                    const fromIdx = order.indexOf(fromKey);
                    const toIdx = order.indexOf(toKey);
                    if (fromIdx === -1 || toIdx === -1) return;
                    order.splice(fromIdx, 1);
                    order.splice(toIdx, 0, fromKey);
                    store.p2LayoutOrder = order;
                    renderP2LayoutOrderPage();
                    applyP2LayoutOrder();
                });
            });

            // Touch drag support
            let touchDragSrc = null;
            items.forEach(item => {
                item.addEventListener('touchstart', function(e) {
                    touchDragSrc = this;
                    this.classList.add('dragging');
                }, { passive: true });
                item.addEventListener('touchmove', function(e) {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const target = document.elementFromPoint(touch.clientX, touch.clientY);
                    items.forEach(i => i.classList.remove('drag-over'));
                    if (target) {
                        const orderItem = target.closest('.layout-order-item');
                        if (orderItem && orderItem !== touchDragSrc) {
                            orderItem.classList.add('drag-over');
                        }
                    }
                }, { passive: false });
                item.addEventListener('touchend', function(e) {
                    this.classList.remove('dragging');
                    items.forEach(i => i.classList.remove('drag-over'));
                    if (!touchDragSrc) return;
                    const touch = e.changedTouches[0];
                    const target = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (target) {
                        const orderItem = target.closest('.layout-order-item');
                        if (orderItem && orderItem !== touchDragSrc) {
                            const order = getP2LayoutOrder();
                            const fromKey = touchDragSrc.dataset.layoutKey;
                            const toKey = orderItem.dataset.layoutKey;
                            const fromIdx = order.indexOf(fromKey);
                            const toIdx = order.indexOf(toKey);
                            if (fromIdx !== -1 && toIdx !== -1) {
                                order.splice(fromIdx, 1);
                                order.splice(toIdx, 0, fromKey);
                                store.p2LayoutOrder = order;
                                renderP2LayoutOrderPage();
                                applyP2LayoutOrder();
                            }
                        }
                    }
                    touchDragSrc = null;
                }, { passive: true });
            });
        }

        function updateP2LayoutPreview() {
            const order = getP2LayoutOrder();
            const previewBox = document.getElementById('p2-layout-preview-box');
            if (!previewBox) return;
            order.forEach((key, idx) => {
                const el = previewBox.querySelector(`[data-p2-preview="${key}"]`);
                if (el) el.style.order = idx;
            });
        }

        function updateP2LayoutPreviewOffsets() {
            const offsets = getP2LayoutOffsets();
            const previewBox = document.getElementById('p2-layout-preview-box');
            if (!previewBox) return;
            Object.keys(offsets).forEach(key => {
                const el = previewBox.querySelector(`[data-p2-preview="${key}"]`);
                if (el) {
                    const scaledOffset = Math.round(offsets[key] * 0.4);
                    el.style.transform = `translateY(${scaledOffset}px)`;
                    el.style.transition = 'transform 0.2s ease';
                }
            });
        }

        function renderP2OffsetSliders() {
            const container = document.getElementById('p2-layout-offset-sliders');
            if (!container) return;
            const offsets = getP2LayoutOffsets();
            const order = getP2LayoutOrder();

            container.innerHTML = order.map(key => {
                const meta = p2LayoutSectionMeta[key];
                if (!meta) return '';
                const val = offsets[key] || 0;
                return `<div class="layout-offset-row">
                    <div class="layout-offset-label">
                        <div class="lo-dot" style="background:${meta.color};"></div>
                        <span>${meta.title}</span>
                    </div>
                    <input type="range" class="layout-offset-slider" min="-80" max="80" value="${val}"
                        data-offset-key="${key}"
                        oninput="onP2LayoutOffsetChange('${key}', this.value)">
                    <div class="layout-offset-val" id="p2-lo-val-${key}">${val}px</div>
                </div>`;
            }).join('');
        }

        function onP2LayoutOffsetChange(key, val) {
            val = parseInt(val) || 0;
            const offsets = getP2LayoutOffsets();
            offsets[key] = val;
            store.p2LayoutOffsets = offsets;
            const valEl = document.getElementById('p2-lo-val-' + key);
            if (valEl) valEl.textContent = val + 'px';
            applyP2LayoutOffsets();
            updateP2LayoutPreviewOffsets();
        }

        function applyP2LayoutOrder() {
            // Page 2 now uses CSS Grid - widget ordering is handled via grid-row/grid-column
            // This function applies transform offsets only (the order is controlled by grid positions)
            applyP2LayoutOffsets();
        }

        function applyP2LayoutOffsets() {
            const offsets = getP2LayoutOffsets();
            const page2 = document.getElementById('desktop-page-2');
            if (!page2) return;
            const grid = page2.querySelector('#desktop-page2-grid');
            Object.keys(offsets).forEach(key => {
                const el = page2.querySelector(`[data-p2-section="${key}"]`);
                if (el) {
                    // Clamp offset to ±80px for larger adjustment range
                    const clamped = Math.max(-80, Math.min(80, offsets[key]));
                    el.style.transform = `translateY(${clamped}px)`;
                    el.style.transition = 'transform 0.2s ease';

                    // [FIX-正方形联动] 正方形组件移动时，也移动旁边同行的4个app（row 4-5 col 1-2）
                    if (key === 'p2-square' && grid) {
                        grid.querySelectorAll('.app-item').forEach(app => {
                            const gr = app.style.gridRow || app.style.getPropertyValue('grid-row');
                            // row 4 和 row 5 的应用（地图、购物、论坛、学习）跟随正方形组件一起移动
                            if (gr && (gr.trim().startsWith('4') || gr.trim().startsWith('5'))) {
                                app.style.transform = `translateY(${clamped}px)`;
                                app.style.transition = 'transform 0.2s ease';
                            }
                        });
                    }
                }
            });
        }

        // --- P2 Photo Height ---
        function applyP2PhotoHeight(val) {
            val = parseInt(val) || 100;
            const photoEl = document.querySelector('[data-p2-section="p2-photo"]');
            if (photoEl) photoEl.style.height = val + 'px';
            const photoImg = document.getElementById('p2-photo-img');
            if (photoImg) photoImg.style.height = val + 'px';
            store.p2PhotoHeight = val;
            save();
        }

        function restoreP2PhotoHeight() {
            const val = store.p2PhotoHeight || 100;
            const slider = document.getElementById('p2-photo-height-slider');
            const valEl = document.getElementById('p2-photo-height-val');
            if (slider) slider.value = val;
            if (valEl) valEl.textContent = val + 'px';
            applyP2PhotoHeight(val);
        }

        // Override saveLayoutOrder/resetLayoutOrder to handle both pages
        const _origSaveLayoutOrder = saveLayoutOrder;
        saveLayoutOrder = function() {
            // Save P1
            const order = getLayoutOrder();
            store.layoutOrder = order;
            store.layoutOffsets = getLayoutOffsets();
            // Save P2
            store.p2LayoutOrder = getP2LayoutOrder();
            store.p2LayoutOffsets = getP2LayoutOffsets();
            // Save bottom nav offset
            const bnSlider = document.getElementById('bottom-nav-offset-slider');
            if (bnSlider) store.bottomNavOffset = parseInt(bnSlider.value) || 0;
            // Save P2 bottom apps offset
            const baSlider = document.getElementById('p2-bottom-apps-offset-slider');
            if (baSlider) store.p2BottomAppsOffset = parseInt(baSlider.value) || 0;
            save();
            applyLayoutOrder();
            applyP2LayoutOrder();
            applyBottomNavOffset();
            applyP2BottomAppsOffset();
            toast('布局已保存', 'success');
        };

        const _origResetLayoutOrder = resetLayoutOrder;
        resetLayoutOrder = function() {
            // Reset P1
            store.layoutOrder = [...defaultLayoutOrder];
            store.layoutOffsets = { 'time-date': 0, 'info-card': 0, 'app-grid': 0 };
            // Reset P2
            store.p2LayoutOrder = [...defaultP2LayoutOrder];
            store.p2LayoutOffsets = { 'p2-photo': 0, 'p2-album': 0, 'p2-square': 0 };
            store.p2PhotoHeight = 100;
            // Reset bottom nav offset
            store.bottomNavOffset = 0;
            // Reset P2 bottom apps offset
            store.p2BottomAppsOffset = 0;
            save();

            // Always apply BOTH pages to ensure full reset regardless of which page is visible
            // Reset P1 inline styles first
            const desktop = document.getElementById('desktop');
            if (desktop) {
                defaultLayoutOrder.forEach(key => {
                    const el = desktop.querySelector(`[data-section="${key}"]`);
                    if (el) {
                        el.style.order = '';
                        el.style.transform = '';
                        el.style.transition = '';
                    }
                });
            }

            // Reset P2 inline styles (grid-based)
            const page2 = document.getElementById('desktop-page-2');
            if (page2) {
                const grid2 = document.getElementById('desktop-page2-grid');
                if (grid2) {
                    defaultP2LayoutOrder.forEach(key => {
                        const el = grid2.querySelector(`[data-p2-section="${key}"]`);
                        if (el) {
                            el.style.transform = '';
                            el.style.transition = '';
                        }
                    });
                    // [FIX-正方形联动] Reset ALL app-item inline styles (rows 4-5 linked + row 6 bottom)
                    grid2.querySelectorAll('.app-item').forEach(app => {
                        app.style.transform = '';
                        app.style.transition = '';
                    });
                }
            }

            // Apply both layout orders
            applyLayoutOrder();
            applyP2LayoutOrder();
            applyP2PhotoHeight(100);
            applyBottomNavOffset();

            // Reset bottom nav offset slider UI
            const bnSlider = document.getElementById('bottom-nav-offset-slider');
            if (bnSlider) bnSlider.value = 0;
            const bnValEl = document.getElementById('lo-val-bottom-nav');
            if (bnValEl) bnValEl.textContent = '0px';

            // Reset P2 bottom apps offset slider UI
            const baSlider = document.getElementById('p2-bottom-apps-offset-slider');
            if (baSlider) baSlider.value = 0;
            const baValEl = document.getElementById('p2-lo-val-bottom-apps');
            if (baValEl) baValEl.textContent = '0px';

            // [FIX-编辑模式还原] 同时清除编辑模式的隐藏和位置数据
            // 用户可能在编辑模式中删除了组件，美化页面的还原也应该恢复这些组件
            localStorage.removeItem('YAN_desktop_hidden_v3');
            localStorage.removeItem('YAN_desktop_positions_v5');
            // 恢复被编辑模式隐藏的组件
            var allEditableEls = document.querySelectorAll('#desktop-grid .app-item, #desktop-grid .custom-widget, .desktop-time-date-area, .user-info-card, #desktop-page2-grid .app-item, #desktop-page2-grid .p2-photo-upload, #desktop-page2-grid .p2-music-widget, #desktop-page2-grid .p2-square-widget');
            allEditableEls.forEach(function(el) {
                if (el.getAttribute('data-hidden') === 'true') {
                    el.style.display = '';
                    el.removeAttribute('data-hidden');
                }
            });

            // Re-render both layout editor pages so switching tabs shows correct state
            renderLayoutOrderPage();
            renderP2LayoutOrderPage();
            toast('布局已恢复默认', 'success');
        };

        // Restore P2 layout on load
        setTimeout(function() {
            if (store.p2LayoutOrder && store.p2LayoutOrder.length === defaultP2LayoutOrder.length) {
                applyP2LayoutOrder();
            }
            if (store.p2PhotoHeight) {
                applyP2PhotoHeight(store.p2PhotoHeight);
            }
            // 恢复底部导航栏位置（确保持久化偏移生效）
            applyBottomNavOffset();
            // 恢复第二页底部四个应用位置偏移
            applyP2BottomAppsOffset();
        }, 2500);

        // Dedicated P2 save/reset (called from HTML onclick)
        function saveP2LayoutOrder() {
            store.p2LayoutOrder = getP2LayoutOrder();
            store.p2LayoutOffsets = getP2LayoutOffsets();
            // 保存底部四个应用偏移
            const baSlider = document.getElementById('p2-bottom-apps-offset-slider');
            if (baSlider) store.p2BottomAppsOffset = parseInt(baSlider.value) || 0;
            save();
            applyP2LayoutOrder();
            applyP2BottomAppsOffset();
            toast('P2 布局已保存', 'success');
        }

        function resetP2LayoutOrder() {
            store.p2LayoutOrder = [...defaultP2LayoutOrder];
            store.p2LayoutOffsets = { 'p2-photo': 0, 'p2-album': 0, 'p2-square': 0 };
            store.p2PhotoHeight = 100;
            store.p2BottomAppsOffset = 0;
            save();
            // Reset P2 widget inline styles (grid-based)
            const grid2 = document.getElementById('desktop-page2-grid');
            if (grid2) {
                defaultP2LayoutOrder.forEach(key => {
                    const el = grid2.querySelector(`[data-p2-section="${key}"]`);
                    if (el) {
                        el.style.transform = '';
                        el.style.transition = '';
                    }
                });
                // [FIX-正方形联动] 重置所有app-item的 transform（包括row 4-5联动的和row 6底部的）
                grid2.querySelectorAll('.app-item').forEach(app => {
                    app.style.transform = '';
                    app.style.transition = '';
                });
            }
            // 重置底部应用偏移滑条
            const baSlider = document.getElementById('p2-bottom-apps-offset-slider');
            if (baSlider) baSlider.value = 0;
            const baValEl = document.getElementById('p2-lo-val-bottom-apps');
            if (baValEl) baValEl.textContent = '0px';
            // [FIX-编辑模式还原] 恢复被编辑模式隐藏的第二页组件
            var p2HiddenEls = document.querySelectorAll('#desktop-page2-grid .app-item[data-hidden="true"], #desktop-page2-grid .p2-photo-upload[data-hidden="true"], #desktop-page2-grid .p2-music-widget[data-hidden="true"], #desktop-page2-grid .p2-square-widget[data-hidden="true"]');
            if (p2HiddenEls.length > 0) {
                p2HiddenEls.forEach(function(el) {
                    el.style.display = '';
                    el.removeAttribute('data-hidden');
                });
                // 从 hidden 列表中移除 P2 相关的 key
                try {
                    var hiddenArr = JSON.parse(localStorage.getItem('YAN_desktop_hidden_v3') || '[]');
                    var p2Keys = ['section-p2-photo', 'section-p2-album', 'section-p2-square', 'app-map', 'app-shop', 'app-forum', 'app-study', 'app-mailbox', 'app-games', 'app-fanfic', 'app-paopao'];
                    hiddenArr = hiddenArr.filter(function(k) { return p2Keys.indexOf(k) === -1; });
                    localStorage.setItem('YAN_desktop_hidden_v3', JSON.stringify(hiddenArr));
                } catch(e) {}
                // 清除 P2 位置缓存
                localStorage.removeItem('YAN_desktop_positions_v5');
            }
            renderP2LayoutOrderPage();
            toast('P2 布局已恢复默认', 'success');
        }

        // --- P2 底部四个应用位置偏移 ---
        function onP2BottomAppsOffsetChange(val) {
            val = parseInt(val) || 0;
            store.p2BottomAppsOffset = val;
            const valEl = document.getElementById('p2-lo-val-bottom-apps');
            if (valEl) valEl.textContent = val + 'px';
            applyP2BottomAppsOffset();
        }

        function applyP2BottomAppsOffset() {
            const offset = parseInt(store.p2BottomAppsOffset) || 0;
            const clamped = Math.max(-50, Math.min(50, offset));
            const page2 = document.getElementById('desktop-page-2');
            if (!page2) return;
            // 选取第二页底部四个应用（grid-row 6 的 app-item 元素）
            const bottomApps = page2.querySelectorAll('#desktop-page2-grid > .app-item');
            bottomApps.forEach(app => {
                // 底部四个应用在 grid-row: 6（信箱、游戏、同人、泡泡）
                const style = app.style;
                const gridRow = style.gridRow || style.getPropertyValue('grid-row');
                if (gridRow && gridRow.trim().startsWith('6')) {
                    app.style.transform = `translateY(${clamped}px)`;
                    app.style.transition = 'transform 0.2s ease';
                }
            });
        }

        function initP2BottomAppsSlider() {
            const slider = document.getElementById('p2-bottom-apps-offset-slider');
            if (slider) {
                const val = parseInt(store.p2BottomAppsOffset) || 0;
                slider.value = val;
                const valEl = document.getElementById('p2-lo-val-bottom-apps');
                if (valEl) valEl.textContent = val + 'px';
            }
        }

        // Expose P2 layout functions
        window.switchLayoutPage = switchLayoutPage;
        window.moveP2LayoutItem = moveP2LayoutItem;
        window.onP2LayoutOffsetChange = onP2LayoutOffsetChange;
        window.applyP2PhotoHeight = applyP2PhotoHeight;
        window.applyP2LayoutOrder = applyP2LayoutOrder;
        window.saveP2LayoutOrder = saveP2LayoutOrder;
        window.resetP2LayoutOrder = resetP2LayoutOrder;
        // Expose bottom nav offset functions
        window.onBottomNavOffsetChange = onBottomNavOffsetChange;
        window.applyBottomNavOffset = applyBottomNavOffset;
        // Expose P2 bottom apps offset functions
        window.onP2BottomAppsOffsetChange = onP2BottomAppsOffsetChange;
        window.applyP2BottomAppsOffset = applyP2BottomAppsOffset;

        // --- FONT PRESET MANAGEMENT ---
        function saveFontPreset() {
            const url = document.getElementById('font-url-input').value.trim();
            if (!url) return toast("请先输入字体URL", "error");
            
            showPromptModal('请输入字体预设名称:', '').then(function(name) {
                if (!name || !name.trim()) return;
                if (!store.fontPresets) store.fontPresets = {};
                store.fontPresets[name.trim()] = url;
                save();
                renderFontPresets();
                toast("字体预设已保存: " + name, "success");
            });
        }

        function renderFontPresets() {
            const list = document.getElementById('font-preset-list');
            if (!list) return;
            if (!store.fontPresets) store.fontPresets = {};
            
            const presets = Object.entries(store.fontPresets);
            if (presets.length === 0) {
                list.innerHTML = '<div style="text-align:center;padding:16px 10px;">' +
                    '<div style="font-size:13px;color:#999;margin-bottom:10px;">还没有字体预设</div>' +
                    '<button onclick="if(typeof openBeautyFontSettings===\'function\') openBeautyFontSettings();" style="padding:6px 16px;background:#333;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">去字体设置</button>' +
                '</div>';
                return;
            }
            
            list.innerHTML = presets.map(([name, url]) => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#f9f9f9; border-radius:8px; margin-bottom:8px;">
                    <span style="font-weight:500;">${name}</span>
                    <div style="display:flex; gap:8px;">
                        <button onclick="loadFontPreset('${name}')" style="padding:5px 12px; border:none; background:#333; color:#fff; border-radius:4px; font-size:12px;">加载</button>
                        <button onclick="deleteFontPreset('${name}')" style="padding:5px 12px; border:none; background:#888; color:#fff; border-radius:4px; font-size:12px;">删除</button>
                    </div>
                </div>
            `).join('');
        }

        function loadFontPreset(name) {
            const url = store.fontPresets[name];
            if (url) {
                document.getElementById('font-url-input').value = url;
                applyCustomFont();
                toast("已加载字体预设: " + name);
            }
        }

        function deleteFontPreset(name) {
            if (confirm("确定删除字体预设 \"" + name + "\" 吗？")) {
                delete store.fontPresets[name];
                save();
                renderFontPresets();
                toast("已删除");
            }
        }

        function resetCustomFont() {
            // Remove custom font style element
            const styleEl = document.getElementById('custom-font-style');
            if (styleEl) styleEl.remove();
            
            // Clear saved font data
            if (store.customFont) {
                delete store.customFont;
                save();
            }
            
            document.getElementById('font-url-input').value = '';
            toast("已恢复默认字体", "success");
        }

        // [FIX-字体预设不显示] 将字体预设管理函数暴露到window，使HTML inline onclick能正确调用
        window.saveFontPreset = saveFontPreset;
        window.loadFontPreset = loadFontPreset;
        window.deleteFontPreset = deleteFontPreset;
        window.resetCustomFont = resetCustomFont;
        window.renderFontPresets = renderFontPresets;

        // --- MUSIC LIST ---
        function renderMusicList() {
            const list = document.getElementById('music-list');
            if (!list) return;
            if (!store.musics || store.musics.length === 0) {
                list.innerHTML = '<div style="text-align:center;padding:40px 20px;">' +
                    '<div style="font-size:14px;color:#999;margin-bottom:14px;">还没有音乐</div>' +
                    '<button onclick="if(typeof addMusicFromUrl===\'function\') addMusicFromUrl();" style="padding:8px 20px;background:#333;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;">去添加音乐</button>' +
                '</div>';
                return;
            }
            
            list.innerHTML = store.musics.map((m, i) => `
                <div class="list-item" onclick="playListenMusic(${i})">
                    <div style="width:40px; height:40px; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius:8px; display:flex; justify-content:center; align-items:center; color:#fff; margin-right:12px;">
                        <i class="fas fa-music"></i>
                    </div>
                    <div class="list-content">
                        <div class="list-title">${m.name}</div>
                        <div class="list-sub">${m.lrc ? '有歌词' : '无歌词'}</div>
                    </div>
                    <i class="fas fa-trash" style="color:#ddd; padding:10px;" onclick="event.stopPropagation(); deleteMusic(${i})"></i>
                </div>
            `).join('');
        }

        function deleteMusic(idx) {
            showConfirm("删除音乐", "确定要删除这首歌吗？", () => {
                const wasPlaying = (idx === store.listenState.curMusicIdx);
                store.musics.splice(idx, 1);
                
                // [FIX-一起听删歌残留] 如果删除的是当前播放的歌，停止播放并清除音频源
                if (wasPlaying) {
                    const audio = document.getElementById('global-audio');
                    if (audio) {
                        audio.pause();
                        audio.removeAttribute('src');
                        audio.load(); // 强制清除缓冲区
                    }
                    store.listenState.playing = false;
                }
                
                if (store.listenState.curMusicIdx >= store.musics.length) {
                    store.listenState.curMusicIdx = 0;
                }
                // 如果删除的歌在当前播放歌之前，索引需要前移
                if (idx < store.listenState.curMusicIdx) {
                    store.listenState.curMusicIdx--;
                }
                
                save();
                renderMusicList();
                if (typeof updateListenUI === 'function') updateListenUI();
                toast("已删除");
            });
        }

        function addMusicPopup() {
            showListenAddMenu();
        }

        // ===== LOCK SCREEN LOGIC =====
        let lockPasscodeInput = '';
        let lockSwipeStartY = 0;
        let lockSwipeActive = false;

        function showLockScreen() {
            const ls = store.lockScreen || {};
            if (!ls.enabled) return;
            // [FIX-上传锁屏] 文件上传期间不触发锁屏，避免用户上传表情包时被锁屏打断
            if (window._isUploadingFile) return;
            const el = document.getElementById('lock-screen');
            if (!el) return;
            
            // 锁屏激活前，确保桌面层是显示的
            const desktop = document.getElementById('layer-desktop');
            if (desktop && !desktop.classList.contains('active')) {
                desktop.classList.add('active');
            }
            
            el.classList.add('active');
            // Apply wallpaper
            const wp = document.getElementById('lock-screen-wallpaper');
            if (ls.wallpaper) {
                wp.style.backgroundImage = `url(${ls.wallpaper})`;
                wp.style.background = '';
                wp.style.backgroundImage = `url(${ls.wallpaper})`;
                wp.style.backgroundSize = 'cover';
                wp.style.backgroundPosition = 'center';
            }
            // Apply lock screen text color from theme
            const lsColor = (store.theme && store.theme.lockScreenTextColor) || '#ffffff';
            const timeEl = document.getElementById('lock-screen-time');
            const dateEl = document.getElementById('lock-screen-date');
            const swipeHint = document.getElementById('lock-swipe-hint');
            if (timeEl) timeEl.style.color = lsColor;
            if (dateEl) dateEl.style.color = lsColor;
            if (swipeHint) swipeHint.style.color = lsColor;
            updateLockScreenClock();
            // Reset passcode panel
            document.getElementById('lock-passcode-panel').classList.remove('active');
            document.getElementById('lock-swipe-hint').style.display = '';
            lockPasscodeInput = '';
            buildLockDots();
            updateLockDots();
            // Bind swipe
            el.addEventListener('touchstart', lockTouchStart, { passive: true });
            el.addEventListener('touchmove', lockTouchMove, { passive: false });
            el.addEventListener('touchend', lockTouchEnd, { passive: true });
            el.addEventListener('mousedown', lockMouseDown);
        }

        function updateLockScreenClock() {
            const now = new Date();
            const h = now.getHours().toString().padStart(2, '0');
            const m = now.getMinutes().toString().padStart(2, '0');
            const timeEl = document.getElementById('lock-screen-time');
            const dateEl = document.getElementById('lock-screen-date');
            if (timeEl) timeEl.textContent = `${h}:${m}`;
            if (dateEl) {
                const days = ['周日','周一','周二','周三','周四','周五','周六'];
                dateEl.textContent = `${now.getMonth()+1}月${now.getDate()}日 ${days[now.getDay()]}`;
            }
        }

        function lockTouchStart(e) {
            lockSwipeStartY = e.touches[0].clientY;
            lockSwipeActive = true;
        }
        function lockTouchMove(e) {
            if (!lockSwipeActive) return;
            const dy = lockSwipeStartY - e.touches[0].clientY;
            if (dy > 80) {
                lockSwipeActive = false;
                openPasscodePanel();
            }
        }
        function lockTouchEnd() { lockSwipeActive = false; }

        function lockMouseDown(e) {
            lockSwipeStartY = e.clientY;
            const onMove = (ev) => {
                const dy = lockSwipeStartY - ev.clientY;
                if (dy > 80) {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    openPasscodePanel();
                }
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        }

        function getLockPasswordLength() {
            const pwd = String((store.lockScreen && store.lockScreen.password) || '0987');
            return pwd.length;
        }

        function buildLockDots() {
            const container = document.getElementById('lock-passcode-dots');
            if (!container) return;
            const len = getLockPasswordLength();
            let html = '';
            for (let i = 0; i < len; i++) {
                html += '<div class="lock-dot"></div>';
            }
            container.innerHTML = html;
        }

        function openPasscodePanel() {
            document.getElementById('lock-passcode-panel').classList.add('active');
            document.getElementById('lock-swipe-hint').style.display = 'none';
            lockPasscodeInput = '';
            buildLockDots();
            updateLockDots();
            document.getElementById('lock-passcode-error').textContent = '';
        }

        function lockPasscodeCancel() {
            document.getElementById('lock-passcode-panel').classList.remove('active');
            document.getElementById('lock-swipe-hint').style.display = '';
            lockPasscodeInput = '';
            updateLockDots();
        }

        function lockKeyPress(num) {
            const maxLen = getLockPasswordLength();
            if (lockPasscodeInput.length >= maxLen) return;
            lockPasscodeInput += num;
            updateLockDots();
            if (lockPasscodeInput.length === maxLen) {
                setTimeout(() => checkLockPasscode(), 150);
            }
        }

        function lockKeyDelete() {
            if (lockPasscodeInput.length > 0) {
                lockPasscodeInput = lockPasscodeInput.slice(0, -1);
                updateLockDots();
            }
        }

        function updateLockDots() {
            const dots = document.querySelectorAll('#lock-passcode-dots .lock-dot');
            dots.forEach((d, i) => {
                d.classList.toggle('filled', i < lockPasscodeInput.length);
            });
        }

        function checkLockPasscode() {
            const pwd = String((store.lockScreen && store.lockScreen.password) || '0987');
            if (lockPasscodeInput === pwd) {
                unlockScreen();
            } else {
                // Wrong password - shake
                const panel = document.getElementById('lock-passcode-panel');
                panel.classList.add('lock-shake');
                document.getElementById('lock-passcode-error').textContent = '密码错误，请重试';
                setTimeout(() => {
                    panel.classList.remove('lock-shake');
                    lockPasscodeInput = '';
                    updateLockDots();
                }, 600);
            }
        }

        function lockForgotPassword() {
            showConfirm('忘记密码', '确定要重置密码吗？密码将还原为初始密码 0987', function() {
                if (!store.lockScreen) store.lockScreen = { password: '0987', wallpaper: '', enabled: true };
                store.lockScreen.password = '0987';
                save();
                lockPasscodeInput = '';
                buildLockDots();
                updateLockDots();
                document.getElementById('lock-passcode-error').textContent = '';
                toast('密码已重置为 0987', 'success');
                // 恢复确认弹窗的 z-index
                var confirmModal = document.getElementById('modal-confirm');
                if (confirmModal) confirmModal.style.zIndex = '';
            }, function() {
                // 取消时也恢复 z-index
                var confirmModal = document.getElementById('modal-confirm');
                if (confirmModal) confirmModal.style.zIndex = '';
            });
            // 在锁屏界面调用时，提升确认弹窗的层级，使其显示在锁屏之上
            var confirmModal = document.getElementById('modal-confirm');
            if (confirmModal) confirmModal.style.zIndex = '10001';
        }

        function unlockScreen() {
            const el = document.getElementById('lock-screen');
            el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            el.style.opacity = '0';
            el.style.transform = 'scale(1.05)';
            setTimeout(() => {
                el.classList.remove('active');
                el.style.transition = '';
                el.style.opacity = '';
                el.style.transform = '';
                // Cleanup listeners
                el.removeEventListener('touchstart', lockTouchStart);
                el.removeEventListener('touchmove', lockTouchMove);
                el.removeEventListener('touchend', lockTouchEnd);
                el.removeEventListener('mousedown', lockMouseDown);
                // 解锁后显示免责声明弹窗
                if (typeof window._showDisclaimerPopup === 'function') {
                    setTimeout(function() { window._showDisclaimerPopup(); }, 200);
                }
            }, 350);
        }

        // Lock screen settings functions
        function initLockScreenSettings() {
            const ls = store.lockScreen || {};
            const enabledCb = document.getElementById('lockscreen-enabled');
            if (enabledCb) enabledCb.checked = ls.enabled !== false;
            // Wallpaper preview
            const preview = document.getElementById('lockscreen-wallpaper-preview');
            const hint = document.getElementById('lockscreen-wallpaper-hint');
            if (ls.wallpaper && preview) {
                preview.style.backgroundImage = `url(${ls.wallpaper})`;
                if (hint) hint.style.display = 'none';
            }
        }

        function saveLockScreenSettings() {
            if (!store.lockScreen) store.lockScreen = { password: '0987', wallpaper: '', enabled: true };
            store.lockScreen.enabled = document.getElementById('lockscreen-enabled').checked;
            save();
        }

        function changeLockScreenPassword() {
            // [FIX-锁屏密码] 提取纯数字，防止浏览器自动填充/IME输入法注入非数字字符
            const oldPwd = (document.getElementById('lockscreen-old-pwd').value || '').trim().replace(/\D/g, '');
            const newPwd = (document.getElementById('lockscreen-new-pwd').value || '').trim().replace(/\D/g, '');
            const confirmPwd = (document.getElementById('lockscreen-confirm-pwd').value || '').trim().replace(/\D/g, '');
            // [FIX-锁屏密码] 确保 store.lockScreen 已初始化
            if (!store.lockScreen) store.lockScreen = { password: '0987', wallpaper: '', enabled: true };
            // [FIX-锁屏密码类型] 强制转为字符串比较，防止password被存为数字类型导致丢失前导零
            const currentPwd = String(store.lockScreen.password ?? '0987');
            console.log('[LockScreen] changePwd debug: oldPwd="' + oldPwd + '", currentPwd="' + currentPwd + '", match=' + (oldPwd === currentPwd));

            if (!oldPwd) { toast('请输入当前密码', 'error'); return; }
            if (oldPwd !== currentPwd) { toast('当前密码错误', 'error'); return; }
            if (!newPwd) { toast('请输入新密码', 'error'); return; }
            if (newPwd.length < 4) { toast('新密码至少4位', 'error'); return; }
            if (!/^\d+$/.test(newPwd)) { toast('密码只能包含数字', 'error'); return; }
            if (newPwd !== confirmPwd) { toast('两次输入的密码不一致', 'error'); return; }
            if (newPwd === currentPwd) { toast('新密码不能与当前密码相同', 'error'); return; }

            store.lockScreen.password = String(newPwd);
            save();
            toast('密码修改成功', 'success');
            document.getElementById('lockscreen-old-pwd').value = '';
            document.getElementById('lockscreen-new-pwd').value = '';
            document.getElementById('lockscreen-confirm-pwd').value = '';
        }

        function uploadLockScreenWallpaper() {
            document.getElementById('lockscreen-wallpaper-input').click();
        }

        function handleLockScreenWallpaper(input) {
            if (!input.files || !input.files[0]) return;
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                const dataUrl = e.target.result;
                if (!store.lockScreen) store.lockScreen = { password: '0987', wallpaper: '', enabled: true };
                store.lockScreen.wallpaper = dataUrl;
                save();
                // Update preview
                const preview = document.getElementById('lockscreen-wallpaper-preview');
                const hint = document.getElementById('lockscreen-wallpaper-hint');
                if (preview) {
                    preview.style.backgroundImage = `url(${dataUrl})`;
                    if (hint) hint.style.display = 'none';
                }
                toast('壁纸已更新', 'success');
            };
            reader.readAsDataURL(file);
            input.value = '';
        }

        function clearLockScreenWallpaper() {
            if (!store.lockScreen) return;
            store.lockScreen.wallpaper = '';
            save();
            const preview = document.getElementById('lockscreen-wallpaper-preview');
            const hint = document.getElementById('lockscreen-wallpaper-hint');
            if (preview) {
                preview.style.backgroundImage = '';
                if (hint) hint.style.display = '';
            }
            toast('壁纸已清除', 'success');
        }

        // Expose lock screen functions to global scope for HTML onclick handlers
        window.showLockScreen = showLockScreen;
        window.lockKeyPress = lockKeyPress;
        window.lockKeyDelete = lockKeyDelete;
        window.lockPasscodeCancel = lockPasscodeCancel;
        window.lockForgotPassword = lockForgotPassword;
        window.openPasscodePanel = openPasscodePanel;
        window.checkLockPasscode = checkLockPasscode;
        window.initLockScreenSettings = initLockScreenSettings;
        window.saveLockScreenSettings = saveLockScreenSettings;
        window.changeLockScreenPassword = changeLockScreenPassword;
        window.uploadLockScreenWallpaper = uploadLockScreenWallpaper;
        window.handleLockScreenWallpaper = handleLockScreenWallpaper;
        window.clearLockScreenWallpaper = clearLockScreenWallpaper;

        // --- INIT ---
        // Bind slider event
        const sysTempSlider = document.getElementById('sys-temp');
        if (sysTempSlider) {
            sysTempSlider.addEventListener('input', function() {
                document.getElementById('sys-temp-val').textContent = this.value;
            });
        }

        // Start the async initialization process
        initStore();
        
        // Time Loop
        setInterval(() => {
            try {
                const now = new Date();
                // Safe access to store
                const perception = (store && store.perception) ? store.perception : null;
                
                let displayTime = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
                
                // Check for virtual time
                if (perception && perception.master && perception.customTime && perception.timeVal) {
                    displayTime = perception.timeVal;
                }

                // Update lock screen clock
                if (document.getElementById('lock-screen') && document.getElementById('lock-screen').classList.contains('active')) {
                    updateLockScreenClock();
                }
                
                // Update new desktop clock if visible
                const desktopTimeEl = document.getElementById('desktop-time-val');
                const desktopDateEl = document.getElementById('desktop-date-val');
                
                if (desktopTimeEl) {
                    desktopTimeEl.innerText = displayTime;
                }
                
                if (desktopDateEl) {
                     if (perception && perception.master && perception.customDate && perception.dateVal) {
                        const d = new Date(perception.dateVal + 'T00:00:00'); 
                        if (!isNaN(d.getTime())) {
                            desktopDateEl.innerText = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][d.getDay()]}`;
                        } else {
                            // Fallback to real date if parsing fails
                            desktopDateEl.innerText = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]}`;
                        }
                    } else {
                        desktopDateEl.innerText = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()]}`;
                    }
                }
            } catch (e) {
                console.error("Time loop error:", e);
            }
        }, 1000);

        // --- Viewport Height Fix ---
        // [JS适配] 视口高度计算已迁移至 device-adapter.js
        // device-adapter.js 设置 --app-height, --vh, --viewport-height 等CSS变量

        // [已移除] 强制锁定竖屏方向的JS逻辑 - 在平板键盘弹出时会误判为横屏，故完全移除
        // manifest.json 中的 "orientation": "portrait" 已足够在PWA/原生模式下锁定方向

        // 问题3修复: 实现悬浮球拖动
        const floatBall = document.getElementById('listen-float-ball');
        let isDragging = false;
        let wasDragged = false; // Flag to distinguish drag from click
        let offsetX, offsetY;

        const handleDragStart = (e) => {
            if (e.target.closest('.float-ball-hover-info')) return;
            isDragging = true;
            wasDragged = false;
            floatBall.style.transition = 'none';
            const touch = e.type === 'touchstart' ? e.touches[0] : e;
            offsetX = touch.clientX - floatBall.getBoundingClientRect().left;
            offsetY = touch.clientY - floatBall.getBoundingClientRect().top;
            // 不在touchstart中preventDefault，以允许点击事件正常触发
            // 滚动阻止已在touchmove的preventDefault中处理
        };

        const handleDragMove = (e) => {
            if (!isDragging) return;
            wasDragged = true;
            if (e.type === 'touchmove') e.preventDefault();
            const touch = e.type === 'touchmove' ? e.touches[0] : e;
            let x = touch.clientX - offsetX;
            let y = touch.clientY - offsetY;

            const maxX = window.innerWidth - floatBall.offsetWidth;
            const maxY = window.innerHeight - floatBall.offsetHeight;

            x = Math.max(0, Math.min(x, maxX));
            y = Math.max(0, Math.min(y, maxY));

            floatBall.style.left = x + 'px';
            floatBall.style.top = y + 'px';
            // Important: Remove right property to allow left to take control
            floatBall.style.right = 'auto'; 
        };

        const handleDragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            floatBall.style.transition = 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
            
            // Snap to nearest edge
            const finalPos = floatBall.getBoundingClientRect();
            if (finalPos.left + (finalPos.width / 2) < window.innerWidth / 2) {
                floatBall.style.left = '0px';
            } else {
                floatBall.style.left = (window.innerWidth - finalPos.width) + 'px';
            }
        };

        // Override the onclick with a click handler that checks wasDragged flag
        floatBall.addEventListener('click', (e) => {
            if(wasDragged) {
                e.preventDefault();
                e.stopPropagation();
            } else {
                maximizeListenPlayer();
            }
        }, true); // Use capture phase

        floatBall.addEventListener('mousedown', handleDragStart);
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);

        floatBall.addEventListener('touchstart', handleDragStart, { passive: false });
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);

        // ==========================================
        // --- NOTIFICATION SOUND SYSTEM ---
        // ==========================================
        let tempSoundTarget = null; // 'msg', 'ring', 'contact'
        let tempContactSoundData = null; // base64 or URL for contact sound
        let tempContactSoundSelectedIds = new Set();

        // Initialize sound settings in store
        function initSoundSettings() {
            if (!store.soundSettings) {
                store.soundSettings = {
                    msgEnabled: false,
                    msgSound: null, // base64 data URL or external URL
                    msgSoundName: '',
                    ringEnabled: false,
                    ringSound: null,
                    ringSoundName: '',
                    contactSounds: {} // { contactId: { sound: url, name: '' } }
                };
            }
            // Render status on page load
            updateSoundStatus('msg');
            updateSoundStatus('ring');
            renderContactSoundList();
            // Load switch states
            const msgSwitch = document.getElementById('sound-msg-enabled');
            const ringSwitch = document.getElementById('sound-ring-enabled');
            if (msgSwitch) msgSwitch.checked = store.soundSettings.msgEnabled || false;
            if (ringSwitch) ringSwitch.checked = store.soundSettings.ringEnabled || false;
        }

        function updateSoundStatus(type) {
            const el = document.getElementById(`sound-${type}-status`);
            if (!el) return;
            const ss = store.soundSettings;
            if (type === 'msg') {
                el.innerText = ss.msgSound ? `当前: ${ss.msgSoundName || '已设置'}` : '当前: 未设置';
                el.style.color = ss.msgSound ? 'var(--primary)' : '#999';
            } else if (type === 'ring') {
                el.innerText = ss.ringSound ? `当前: ${ss.ringSoundName || '已设置'}` : '当前: 未设置';
                el.style.color = ss.ringSound ? 'var(--primary)' : '#999';
            }
        }

        function openSoundUrlInput(type) {
            const el = document.getElementById(`sound-url-input-${type}`);
            if (el) {
                el.style.display = el.style.display === 'none' ? 'block' : 'none';
            }
        }

        function applySoundUrl(type) {
            const urlInput = document.getElementById(`sound-url-${type}`);
            if (!urlInput) return;
            const url = urlInput.value.trim();
            if (!url) return toast('请输入MP3链接', 'error');

            if (!store.soundSettings) initSoundSettings();

            if (type === 'msg') {
                store.soundSettings.msgSound = url;
                store.soundSettings.msgSoundName = 'URL音频';
            } else if (type === 'ring') {
                store.soundSettings.ringSound = url;
                store.soundSettings.ringSoundName = 'URL音频';
            }
            save();
            updateSoundStatus(type);
            document.getElementById(`sound-url-input-${type}`).style.display = 'none';
            toast('音频链接已设置', 'success');
        }

        function uploadSoundFile(type) {
            tempSoundTarget = type;
            document.getElementById('sound-file-input').click();
        }

        function handleSoundFileUpload(input) {
            const file = input.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                toast('文件过大，请选择5MB以内的音频', 'error');
                input.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;

                if (!store.soundSettings) initSoundSettings();

                if (tempSoundTarget === 'msg') {
                    store.soundSettings.msgSound = dataUrl;
                    store.soundSettings.msgSoundName = file.name;
                    save();
                    updateSoundStatus('msg');
                    toast('消息通知音已设置: ' + file.name, 'success');
                } else if (tempSoundTarget === 'ring') {
                    store.soundSettings.ringSound = dataUrl;
                    store.soundSettings.ringSoundName = file.name;
                    save();
                    updateSoundStatus('ring');
                    toast('来电铃声已设置: ' + file.name, 'success');
                } else if (tempSoundTarget === 'contact') {
                    tempContactSoundData = dataUrl;
                    const statusEl = document.getElementById('contact-sound-file-status');
                    if (statusEl) {
                        statusEl.style.display = 'block';
                        statusEl.innerText = '文件已就绪: ' + file.name;
                    }
                }
            };
            reader.readAsDataURL(file);
            input.value = '';
        }

        function previewSound(type) {
            if (!store.soundSettings) return toast('未设置音频');
            let src = null;
            if (type === 'msg') src = store.soundSettings.msgSound;
            else if (type === 'ring') src = store.soundSettings.ringSound;

            if (!src) return toast('未设置音频', 'error');

            const audio = document.getElementById('sound-preview-audio');
            // [FIX-通知音试听] 如果正在播放，点击试听应该停止而不是重叠播放
            if (!audio.paused && audio.src) {
                audio.pause();
                audio.currentTime = 0;
                audio.src = '';
                toast('已停止播放', 'info');
                return;
            }
            audio.src = src;
            audio.play().then(() => {
                toast('正在播放（再次点击可停止）', 'info');
            }).catch(err => {
                console.error('Preview error:', err);
                toast('播放失败，请检查音频文件', 'error');
            });
        }

        function clearSound(type) {
            if (!store.soundSettings) return;
            if (type === 'msg') {
                store.soundSettings.msgSound = null;
                store.soundSettings.msgSoundName = '';
            } else if (type === 'ring') {
                store.soundSettings.ringSound = null;
                store.soundSettings.ringSoundName = '';
            }
            save();
            updateSoundStatus(type);
            toast('已清除', 'success');
        }

        function saveSoundSettings() {
            if (!store.soundSettings) initSoundSettings();
            const msgSwitch = document.getElementById('sound-msg-enabled');
            const ringSwitch = document.getElementById('sound-ring-enabled');
            if (msgSwitch) store.soundSettings.msgEnabled = msgSwitch.checked;
            if (ringSwitch) store.soundSettings.ringEnabled = ringSwitch.checked;
            save();
        }

        // --- Contact-specific Sounds ---
        function openContactSoundModal() {
            tempContactSoundData = null;
            tempContactSoundSelectedIds.clear();
            const listEl = document.getElementById('contact-sound-select-list');
            const privateContacts = store.contacts.filter(c => !c.isGroup);

            listEl.innerHTML = privateContacts.map(c => {
                const alreadyHas = store.soundSettings?.contactSounds?.[c.id];
                return `
                    <label style="display:flex; align-items:center; padding:8px; cursor:pointer; border-bottom:1px solid #f5f5f5;">
                        <input type="checkbox" onchange="toggleContactSoundSelect('${c.id}', this.checked)" style="margin-right:10px;" ${alreadyHas ? 'checked' : ''}>
                        <img src="${c.avatar}" class="avatar" style="width:32px; height:32px; margin-right:10px;">
                        <span style="flex:1;">${c.name}</span>
                        ${alreadyHas ? '<span style="font-size:11px; color:var(--primary);">已设置</span>' : ''}
                    </label>
                `;
            }).join('');

            // Reset file status
            const statusEl = document.getElementById('contact-sound-file-status');
            if (statusEl) statusEl.style.display = 'none';
            document.getElementById('contact-sound-url').value = '';

            document.getElementById('modal-contact-sound').style.display = 'flex';
        }

        function toggleContactSoundSelect(id, checked) {
            if (checked) tempContactSoundSelectedIds.add(id);
            else tempContactSoundSelectedIds.delete(id);
        }

        function saveContactSound() {
            if (tempContactSoundSelectedIds.size === 0) return toast('请选择至少一位联系人', 'error');

            // Determine sound source: local file > URL input
            let soundSrc = tempContactSoundData;
            if (!soundSrc) {
                const urlVal = document.getElementById('contact-sound-url').value.trim();
                if (urlVal) soundSrc = urlVal;
            }

            if (!soundSrc) return toast('请上传音频或输入URL', 'error');

            if (!store.soundSettings) initSoundSettings();
            if (!store.soundSettings.contactSounds) store.soundSettings.contactSounds = {};

            tempContactSoundSelectedIds.forEach(cid => {
                store.soundSettings.contactSounds[cid] = {
                    sound: soundSrc,
                    name: tempContactSoundData ? '本地文件' : 'URL音频'
                };
            });

            save();
            renderContactSoundList();
            document.getElementById('modal-contact-sound').style.display = 'none';
            toast(`已为 ${tempContactSoundSelectedIds.size} 位联系人设置专属通知音`, 'success');
        }

        function renderContactSoundList() {
            const listEl = document.getElementById('contact-sound-list');
            if (!listEl) return;
            if (!store.soundSettings?.contactSounds) {
                listEl.innerHTML = '<div style="text-align:center; color:#ccc; padding:10px; font-size:13px;">暂无设置</div>';
                return;
            }

            const entries = Object.entries(store.soundSettings.contactSounds);
            if (entries.length === 0) {
                listEl.innerHTML = '<div style="text-align:center; color:#ccc; padding:10px; font-size:13px;">暂无设置</div>';
                return;
            }

            listEl.innerHTML = entries.map(([cid, data]) => {
                const contact = store.contacts.find(c => c.id === cid);
                if (!contact) return '';
                return `
                    <div style="display:flex; align-items:center; padding:10px; background:#fff; border-radius:8px; margin-bottom:8px; border:1px solid #f0f0f0;">
                        <img src="${contact.avatar}" class="avatar" style="width:36px; height:36px; margin-right:10px;">
                        <div style="flex:1;">
                            <div style="font-weight:500; font-size:14px;">${contact.name}</div>
                            <div style="font-size:12px; color:#999;">${data.name || '已设置'}</div>
                        </div>
                        <button onclick="previewContactSound('${cid}')" style="padding:5px 10px; border:none; background:#f0f0f0; border-radius:4px; margin-right:6px; font-size:12px;"><i class="fas fa-play"></i></button>
                        <button onclick="deleteContactSound('${cid}')" style="padding:5px 10px; border:none; background:#fff0f0; color:#fa5151; border-radius:4px; font-size:12px;"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            }).join('');
        }

        function previewContactSound(cid) {
            const data = store.soundSettings?.contactSounds?.[cid];
            if (!data || !data.sound) return toast('无音频');
            const audio = document.getElementById('sound-preview-audio');
            // [FIX-通知音试听] 如果正在播放，点击试听应该停止
            if (!audio.paused && audio.src) {
                audio.pause();
                audio.currentTime = 0;
                audio.src = '';
                toast('已停止播放', 'info');
                return;
            }
            audio.src = data.sound;
            audio.play().then(() => {
                toast('正在播放（再次点击可停止）', 'info');
            }).catch(() => toast('播放失败', 'error'));
        }

        function deleteContactSound(cid) {
            if (store.soundSettings?.contactSounds) {
                delete store.soundSettings.contactSounds[cid];
                save();
                renderContactSoundList();
                toast('已删除', 'success');
            }
        }

        // --- Play Notification Sound (called when contact sends message) ---
        function playNotificationSound(contactId) {
            if (!store.soundSettings) return;

            // Priority: contact-specific > global
            let soundSrc = null;

            // 1. Check contact-specific sound
            if (contactId && store.soundSettings.contactSounds?.[contactId]?.sound) {
                soundSrc = store.soundSettings.contactSounds[contactId].sound;
            }
            // 2. Fallback to global message sound
            else if (store.soundSettings.msgEnabled && store.soundSettings.msgSound) {
                soundSrc = store.soundSettings.msgSound;
            }

            if (soundSrc) {
                try {
                    const audio = new Audio(soundSrc);
                    audio.volume = 0.7;
                    audio.play().catch(e => console.warn('Notification sound play failed:', e));
                } catch (e) {
                    console.warn('Notification sound error:', e);
                }
            }
        }

        // --- Play Ringtone (called when voice call starts) ---
        let ringtoneAudio = null;

        function playRingtone() {
            if (!store.soundSettings?.ringEnabled || !store.soundSettings?.ringSound) return;
            try {
                stopRingtone(); // Stop any previous
                ringtoneAudio = new Audio(store.soundSettings.ringSound);
                ringtoneAudio.loop = true;
                ringtoneAudio.volume = 0.8;
                ringtoneAudio.play().catch(e => console.warn('Ringtone play failed:', e));
            } catch (e) {
                console.warn('Ringtone error:', e);
            }
        }

        function stopRingtone() {
            if (ringtoneAudio) {
                ringtoneAudio.pause();
                ringtoneAudio.currentTime = 0;
                ringtoneAudio = null;
            }
        }

        // ==========================================
        // --- IMAGE UPLOAD MODAL (Local + URL) ---
        // ==========================================
        let imgUploadCallback = null;
        let imgUploadResult = null;

        function openImgUploadModal(title, callback) {
            imgUploadCallback = callback;
            imgUploadResult = null;
            document.getElementById('img-upload-title').innerText = title || '上传图片';
            // Reset state
            document.getElementById('img-upload-local-area').style.display = 'block';
            document.getElementById('img-upload-url-area').style.display = 'none';
            document.getElementById('img-upload-local-preview').style.display = 'none';
            document.getElementById('img-upload-url-preview').style.display = 'none';
            document.getElementById('img-upload-url-val').value = '';
            // [FIX-Edge] 重置file input，防止Edge缓存导致问题
            const fileInput = document.getElementById('img-upload-file-input');
            if (fileInput) {
                fileInput.value = '';
                // [FIX-上传失效] 确保file input不是display:none，改用offscreen定位
                fileInput.classList.remove('hidden');
                fileInput.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;width:1px;height:1px;';
            }
            // Active tab style
            document.getElementById('img-upload-local-btn').style.borderColor = 'var(--primary)';
            document.getElementById('img-upload-local-btn').style.color = 'var(--primary)';
            document.getElementById('img-upload-url-btn').style.borderColor = '#ddd';
            document.getElementById('img-upload-url-btn').style.color = '#666';
            document.getElementById('modal-img-upload').style.display = 'flex';
        }

        function closeImgUploadModal() {
            document.getElementById('modal-img-upload').style.display = 'none';
            imgUploadCallback = null;
            imgUploadResult = null;
        }

        function imgUploadChoose(mode) {
            if (mode === 'local') {
                document.getElementById('img-upload-local-area').style.display = 'block';
                document.getElementById('img-upload-url-area').style.display = 'none';
                document.getElementById('img-upload-local-btn').style.borderColor = 'var(--primary)';
                document.getElementById('img-upload-local-btn').style.color = 'var(--primary)';
                document.getElementById('img-upload-url-btn').style.borderColor = '#ddd';
                document.getElementById('img-upload-url-btn').style.color = '#666';
            } else {
                document.getElementById('img-upload-local-area').style.display = 'none';
                document.getElementById('img-upload-url-area').style.display = 'block';
                document.getElementById('img-upload-url-btn').style.borderColor = 'var(--primary)';
                document.getElementById('img-upload-url-btn').style.color = 'var(--primary)';
                document.getElementById('img-upload-local-btn').style.borderColor = '#ddd';
                document.getElementById('img-upload-local-btn').style.color = '#666';
            }
        }

        function handleImgUploadFile(input) {
            // [FIX-Edge上传退出] 延迟处理，防止Edge在文件选择器关闭时丢失焦点
            const files = input.files;
            if (!files || !files[0]) return;
            const file = files[0];
            // [FIX-Edge] 先保存文件引用，再异步处理，防止Edge GC回收
            const fileRef = file;
            setTimeout(() => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imgUploadResult = e.target.result;
                    const previewImg = document.getElementById('img-upload-preview-img');
                    if (previewImg) previewImg.src = imgUploadResult;
                    const previewArea = document.getElementById('img-upload-local-preview');
                    if (previewArea) previewArea.style.display = 'block';
                };
                reader.onerror = () => {
                    toast('图片读取失败，请重试', 'error');
                };
                reader.readAsDataURL(fileRef);
            }, 100); // [FIX-Edge] 延迟100ms确保焦点恢复
            // [FIX] 不立即清空input.value，Edge可能在此时丢失焦点
            setTimeout(() => { try { input.value = ''; } catch(e) {} }, 200);
        }

        function previewImgUrl() {
            const url = document.getElementById('img-upload-url-val').value.trim();
            if (!url) return toast('请输入图片URL', 'error');
            // [FIX] 使用新Image对象预加载，避免事件绑定竞态条件
            const testImg = new Image();
            testImg.crossOrigin = 'anonymous';
            testImg.onload = () => {
                const previewImg = document.getElementById('img-upload-url-preview-img');
                // [FIX] 先设置事件再设置src，防止缓存图片onload不触发
                previewImg.onload = null;
                previewImg.onerror = null;
                previewImg.src = url;
                document.getElementById('img-upload-url-preview').style.display = 'block';
                imgUploadResult = url;
            };
            testImg.onerror = () => {
                // [FIX] 第一次加载失败时，尝试不带crossOrigin重试（某些服务器不支持CORS但图片仍可显示）
                const retryImg = new Image();
                retryImg.onload = () => {
                    const previewImg = document.getElementById('img-upload-url-preview-img');
                    previewImg.src = url;
                    document.getElementById('img-upload-url-preview').style.display = 'block';
                    imgUploadResult = url;
                };
                retryImg.onerror = () => {
                    toast('图片加载失败，请检查URL是否正确', 'error');
                    document.getElementById('img-upload-url-preview').style.display = 'none';
                    imgUploadResult = null;
                };
                retryImg.src = url;
            };
            testImg.src = url;
        }

        function confirmImgUpload() {
            // If URL tab is active and no local file, use URL
            if (!imgUploadResult) {
                const url = document.getElementById('img-upload-url-val').value.trim();
                if (url) imgUploadResult = url;
            }

            if (!imgUploadResult) return toast('请选择图片或输入URL', 'error');

            // [FIX-情侣账号图片bug] 先保存回调和结果的引用，再关闭弹窗，最后执行回调
            // [FIX-移动端穿透点击] 关闭图片上传弹窗后，移动端touch事件可能穿透到下层的发帖overlay
            // 导致_snCloseComp被触发，发帖弹窗消失。设置保护标记防止穿透
            const cb = imgUploadCallback;
            const result = imgUploadResult;
            // 激活穿透保护（防止弹窗关闭后触摸穿透到桌面app图标）
            window._snCloseProtected = true;
            window._imgUploadCloseProtected = true;
            setTimeout(() => { window._snCloseProtected = false; window._imgUploadCloseProtected = false; }, 400);
            closeImgUploadModal();
            if (cb) {
                // 延迟执行回调，确保弹窗DOM完全清理后再触发渲染
                setTimeout(() => cb(result), 50);
            }
        }

        // --- Hook sound init into store initialization ---
        // Called after initStore completes
        const originalInitUI = initUI;
        initUI = function() {
            originalInitUI();
            initSoundSettings();
        };

        // ========== AVATAR FRAME FUNCTIONS ==========
        
        let _frameTarget = 'user'; // 'user' or 'contact'
        
        // Helper: get frame data object for current target
        function _getFrameData(target, contactId) {
            if (!store.avatarFrames) store.avatarFrames = { user: '', contacts: {} };
            const raw = target === 'user' ? store.avatarFrames.user : (store.avatarFrames.contacts?.[contactId] || '');
            // Backward compat: if raw is a string, convert to object
            if (typeof raw === 'string') {
                return { url: raw, size: 120, offsetX: 0, offsetY: 0 };
            }
            return { url: '', size: 120, offsetX: 0, offsetY: 0, ...raw };
        }
        
        let _frameRenderTimer = null;
        function _setFrameData(target, contactId, data) {
            if (!store.avatarFrames) store.avatarFrames = { user: '', contacts: {} };
            if (!store.avatarFrames.contacts) store.avatarFrames.contacts = {};
            if (target === 'user') {
                store.avatarFrames.user = data;
            } else if (contactId) {
                store.avatarFrames.contacts[contactId] = data;
            }
            save();
            // [FIX-Edge头像框] 头像框变更后延迟刷新聊天视图和联系人列表，确保实时预览同步
            if (_frameRenderTimer) clearTimeout(_frameRenderTimer);
            _frameRenderTimer = setTimeout(() => {
                if (typeof renderHistory === 'function') renderHistory();
                if (typeof renderContacts === 'function') renderContacts();
            }, 300);
        }
        
        function _getCurrentContactId() {
            const sel = document.getElementById('avatar-frame-contact-select');
            return sel?.value || '';
        }
        
        function switchFrameTarget(target) {
            _frameTarget = target;
            const userBtn = document.getElementById('frame-target-user-btn');
            const contactBtn = document.getElementById('frame-target-contact-btn');
            const contactArea = document.getElementById('frame-contact-select-area');
            if (target === 'user') {
                userBtn.className = 'beauty-action-btn';
                contactBtn.className = 'beauty-action-btn preset';
                contactArea.style.display = 'none';
            } else {
                userBtn.className = 'beauty-action-btn preset';
                contactBtn.className = 'beauty-action-btn';
                contactArea.style.display = 'block';
            }
            renderAvatarFrameGrid();
            syncSlidersToCurrentFrame();
        }
        
        function onFrameContactChange() {
            renderAvatarFrameGrid();
            syncSlidersToCurrentFrame();
            updateFramePreview();
        }
        
        function syncSlidersToCurrentFrame() {
            const contactId = _getCurrentContactId();
            const fd = _getFrameData(_frameTarget, contactId);
            const sizeSlider = document.getElementById('frame-size-slider');
            const oxSlider = document.getElementById('frame-offset-x-slider');
            const oySlider = document.getElementById('frame-offset-y-slider');
            if (sizeSlider) { sizeSlider.value = fd.size || 120; document.getElementById('frame-size-val').textContent = (fd.size || 120) + '%'; }
            if (oxSlider) { oxSlider.value = fd.offsetX || 0; document.getElementById('frame-offset-x-val').textContent = (fd.offsetX || 0) + 'px'; }
            if (oySlider) { oySlider.value = fd.offsetY || 0; document.getElementById('frame-offset-y-val').textContent = (fd.offsetY || 0) + 'px'; }
        }
        
        function renderAvatarFrameGrid() {
            const grid = document.getElementById('avatar-frame-preset-grid');
            if (!grid) return;
            const presets = store.avatarFramePresets || [];
            const contactId = _getCurrentContactId();
            const fd = _getFrameData(_frameTarget, contactId);
            const currentUrl = fd.url || '';
            
            // Determine avatar for preview
            let avatarSrc;
            if (_frameTarget === 'user') {
                avatarSrc = store.user?.avatar || 'https://ui-avatars.com/api/?name=Me&background=random';
            } else {
                const contact = (store.contacts || []).find(c => c.id === contactId);
                avatarSrc = contact?.avatar || 'https://ui-avatars.com/api/?name=TA&background=random';
            }
            
            let html = '';
            presets.forEach(f => {
                const isActive = currentUrl === f.url;
                const isCustom = f.id.startsWith('custom_');
                html += `<div style="cursor:pointer; text-align:center; position:relative;">
                    <div onclick="selectPresetFrame('${f.id}')" style="position:relative; width:56px; height:56px; margin:0 auto;">
                        <img src="${avatarSrc}" style="width:44px; height:44px; border-radius:50%; position:absolute; top:6px; left:6px; object-fit:cover;">
                        <img src="${f.url}" style="width:56px; height:56px; position:absolute; top:0; left:0; pointer-events:none;">
                        ${isActive ? '<div style="position:absolute; bottom:-2px; right:-2px; background:var(--primary); color:#fff; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-size:9px;"><i class="fas fa-check"></i></div>' : ''}
                    </div>
                    <div style="font-size:11px; color:${isActive ? 'var(--primary)' : '#666'}; margin-top:4px;">${f.name}</div>
                    ${isCustom ? `<div onclick="event.stopPropagation();deletePresetFrame('${f.id}')" style="position:absolute; top:-4px; right:-4px; background:#fa5151; color:#fff; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-size:9px; cursor:pointer;"><i class="fas fa-times"></i></div>` : ''}
                </div>`;
            });
            grid.innerHTML = html;
            
            // Populate contact select (once)
            const sel = document.getElementById('avatar-frame-contact-select');
            if (sel && sel.options.length <= 1) {
                (store.contacts || []).forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = c.name;
                    sel.appendChild(opt);
                });
            }
            
            updateFramePreview();
        }
        
        function selectPresetFrame(frameId) {
            const preset = (store.avatarFramePresets || []).find(f => f.id === frameId);
            if (!preset) return;
            const contactId = _getCurrentContactId();
            const fd = _getFrameData(_frameTarget, contactId);
            fd.url = preset.url;
            _setFrameData(_frameTarget, contactId, fd);
            renderAvatarFrameGrid();
            syncSlidersToCurrentFrame();
            showToast('已应用「' + preset.name + '」头像框');
        }
        
        function saveCurrentAsPreset() {
            const contactId = _getCurrentContactId();
            const fd = _getFrameData(_frameTarget, contactId);
            if (!fd.url) {
                showToast('当前没有头像框，请先上传或选择一个头像框');
                return;
            }
            // Check if this url already exists in presets
            const existing = (store.avatarFramePresets || []).find(p => p.url === fd.url);
            if (existing) {
                showToast('该头像框已在预设中（' + existing.name + '）');
                return;
            }
            showPromptModal('请输入预设名称：', '自定义头像框').then(function(name) {
            if (!name || !name.trim()) return;
            const newPreset = {
                id: 'custom_' + Date.now(),
                name: name.trim().substring(0, 10),
                url: fd.url,
                size: fd.size || 120,
                offsetX: fd.offsetX || 0,
                offsetY: fd.offsetY || 0
            };
            if (!store.avatarFramePresets) store.avatarFramePresets = [];
            store.avatarFramePresets.push(newPreset);
            save();
            renderAvatarFrameGrid();
            showToast('已保存预设「' + newPreset.name + '」 ✅');
            });
        }
        
        function deletePresetFrame(frameId) {
            if (!confirm('确定删除这个自定义预设吗？')) return;
            store.avatarFramePresets = (store.avatarFramePresets || []).filter(p => p.id !== frameId);
            save();
            renderAvatarFrameGrid();
            showToast('已删除预设');
        }
        
        function uploadAvatarFrameImage() {
            document.getElementById('avatar-frame-file-input').click();
        }
        
        function handleAvatarFrameUpload(input) {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const dataUrl = e.target.result;
                const contactId = _getCurrentContactId();
                const fd = _getFrameData(_frameTarget, contactId);
                fd.url = dataUrl;
                _setFrameData(_frameTarget, contactId, fd);
                renderAvatarFrameGrid();
                syncSlidersToCurrentFrame();
                showToast('头像框图片已上传 ✅');
            };
            reader.readAsDataURL(file);
            input.value = '';
        }
        
        function clearCurrentAvatarFrame() {
            const contactId = _getCurrentContactId();
            _setFrameData(_frameTarget, contactId, { url: '', size: 120, offsetX: 0, offsetY: 0 });
            renderAvatarFrameGrid();
            syncSlidersToCurrentFrame();
            showToast('已清除头像框');
        }
        
        function updateFrameLive() {
            const size = parseInt(document.getElementById('frame-size-slider').value);
            const ox = parseInt(document.getElementById('frame-offset-x-slider').value);
            const oy = parseInt(document.getElementById('frame-offset-y-slider').value);
            document.getElementById('frame-size-val').textContent = size + '%';
            document.getElementById('frame-offset-x-val').textContent = ox + 'px';
            document.getElementById('frame-offset-y-val').textContent = oy + 'px';
            
            const contactId = _getCurrentContactId();
            const fd = _getFrameData(_frameTarget, contactId);
            fd.size = size;
            fd.offsetX = ox;
            fd.offsetY = oy;
            _setFrameData(_frameTarget, contactId, fd);
            updateFramePreview();
        }
        
        function updateFramePreview() {
            const frameLeft = document.getElementById('preview-frame-left');
            const frameRight = document.getElementById('preview-frame-right');
            if (!frameLeft || !frameRight) return;
            
            // User frame (right side in preview)
            const userFd = _getFrameData('user', '');
            if (userFd.url) {
                frameRight.src = userFd.url;
                frameRight.style.display = 'block';
                const sz = (userFd.size || 120);
                const pxSize = 48 * sz / 100;
                const offset = (48 - pxSize) / 2;
                frameRight.style.width = pxSize + 'px';
                frameRight.style.height = pxSize + 'px';
                frameRight.style.top = (offset + (userFd.offsetY || 0)) + 'px';
                frameRight.style.left = (offset + (userFd.offsetX || 0)) + 'px';
            } else {
                frameRight.style.display = 'none';
            }
            
            // Contact frame (left side)
            const contactId = _getCurrentContactId();
            const contactFd = contactId ? _getFrameData('contact', contactId) : { url: '' };
            if (contactFd.url) {
                frameLeft.src = contactFd.url;
                frameLeft.style.display = 'block';
                const sz = (contactFd.size || 120);
                const pxSize = 48 * sz / 100;
                const offset = (48 - pxSize) / 2;
                frameLeft.style.width = pxSize + 'px';
                frameLeft.style.height = pxSize + 'px';
                frameLeft.style.top = (offset + (contactFd.offsetY || 0)) + 'px';
                frameLeft.style.left = (offset + (contactFd.offsetX || 0)) + 'px';
            } else {
                frameLeft.style.display = 'none';
            }
        }
        
        function recommendFrameToContact() {
            const sel = document.getElementById('avatar-frame-contact-select');
            if (!sel || !sel.value) {
                showToast('请先选择一个联系人');
                return;
            }
            const contactId = sel.value;
            const contact = (store.contacts || []).find(c => c.id === contactId);
            if (!contact) return;
            
            const presets = store.avatarFramePresets || [];
            if (presets.length === 0) return;
            
            const randomFrame = presets[Math.floor(Math.random() * presets.length)];
            
            if (!store.avatarFrames) store.avatarFrames = { user: '', contacts: {} };
            if (!store.avatarFrames.contacts) store.avatarFrames.contacts = {};
            store.avatarFrames.contacts[contactId] = { url: randomFrame.url, size: 120, offsetX: 0, offsetY: 0 };
            save();
            
            showToast(`已为 ${contact.name} 推荐「${randomFrame.name}」头像框 🎁`);
            renderAvatarFrameGrid();
            updateFramePreview();
        }
        
        // ========== BATCH AVATAR FRAME OPERATIONS ==========
        
        let _batchFrameMode = ''; // 'apply' or 'clear'
        
        function openBatchApplyFrameModal() {
            // Check if current target has a frame to apply
            const contactId = _getCurrentContactId();
            const fd = _getFrameData(_frameTarget, contactId);
            if (!fd.url) {
                showToast('当前没有头像框可以批量应用，请先设置一个头像框');
                return;
            }
            _batchFrameMode = 'apply';
            _openBatchFrameModal('批量应用头像框', '将当前头像框应用到选中的联系人');
        }
        
        function openBatchClearFrameModal() {
            _batchFrameMode = 'clear';
            _openBatchFrameModal('批量清除头像框', '清除选中联系人的所有头像框（用户+联系人）');
        }
        
        function _openBatchFrameModal(title, desc) {
            document.getElementById('batch-frame-title').textContent = title;
            document.getElementById('batch-frame-desc').textContent = desc;
            const confirmBtn = document.getElementById('batch-frame-confirm-btn');
            if (_batchFrameMode === 'clear') {
                confirmBtn.style.background = 'var(--red, #fa5151)';
                confirmBtn.textContent = '清除';
            } else {
                confirmBtn.style.background = 'var(--primary, #07c160)';
                confirmBtn.textContent = '应用';
            }
            
            const list = document.getElementById('batch-frame-contact-list');
            const contacts = (store.contacts || []).filter(c => !c.isGroup);
            list.innerHTML = contacts.map(c => {
                const hasFrame = _getFrameData('contact', c.id).url || _getFrameData('user', '').url;
                return `<label style="display:flex; align-items:center; padding:10px 12px; border-bottom:1px solid #f5f5f5; cursor:pointer; gap:10px;">
                    <input type="checkbox" class="batch-frame-cb" value="${c.id}" style="width:18px; height:18px; accent-color:var(--primary);">
                    <img src="${c.avatar}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">
                    <span style="flex:1; font-size:14px;">${c.name}</span>
                    ${_batchFrameMode === 'clear' && _getFrameData('contact', c.id).url ? '<span style="font-size:11px; color:#07c160; background:#e8f8ee; padding:2px 6px; border-radius:4px;">有框</span>' : ''}
                </label>`;
            }).join('');
            
            document.getElementById('modal-batch-frame').style.display = 'flex';
        }
        
        function batchFrameSelectAll() {
            document.querySelectorAll('.batch-frame-cb').forEach(cb => cb.checked = true);
        }
        
        function batchFrameDeselectAll() {
            document.querySelectorAll('.batch-frame-cb').forEach(cb => cb.checked = false);
        }
        
        function batchFrameConfirm() {
            const selected = Array.from(document.querySelectorAll('.batch-frame-cb:checked')).map(cb => cb.value);
            if (selected.length === 0) {
                showToast('请至少选择一个联系人');
                return;
            }
            
            if (_batchFrameMode === 'clear') {
                // Show secondary confirmation
                document.getElementById('modal-batch-frame').style.display = 'none';
                const names = selected.map(id => {
                    const c = (store.contacts || []).find(x => x.id === id);
                    return c ? c.name : id;
                });
                const displayNames = names.length > 3 ? names.slice(0, 3).join('、') + ` 等${names.length}人` : names.join('、');
                
                document.getElementById('confirm-title').textContent = '确认清除头像框';
                document.getElementById('confirm-text').textContent = `将清除 ${displayNames} 的所有头像框（用户侧+联系人侧），此操作不可撤销。`;
                document.getElementById('confirm-btn-ok').textContent = '确认清除';
                document.getElementById('confirm-btn-ok').style.background = 'var(--red, #fa5151)';
                document.getElementById('confirm-btn-cancel').onclick = function() {
                    document.getElementById('modal-confirm').style.display = 'none';
                };
                document.getElementById('confirm-btn-ok').onclick = function() {
                    _executeBatchClear(selected);
                    document.getElementById('modal-confirm').style.display = 'none';
                };
                document.getElementById('modal-confirm').style.display = 'flex';
            } else {
                _executeBatchApply(selected);
                document.getElementById('modal-batch-frame').style.display = 'none';
            }
        }
        
        function _executeBatchApply(contactIds) {
            const srcContactId = _getCurrentContactId();
            const fd = _getFrameData(_frameTarget, srcContactId);
            if (!fd.url) return;
            
            if (!store.avatarFrames) store.avatarFrames = { user: '', contacts: {} };
            if (!store.avatarFrames.contacts) store.avatarFrames.contacts = {};
            
            contactIds.forEach(cid => {
                // Apply as contact-side frame for each selected contact
                store.avatarFrames.contacts[cid] = { ...fd };
            });
            save();
            renderAvatarFrameGrid();
            updateFramePreview();
            showToast(`已将头像框应用到 ${contactIds.length} 个联系人 ✅`);
        }
        
        function _executeBatchClear(contactIds) {
            if (!store.avatarFrames) return;
            if (!store.avatarFrames.contacts) store.avatarFrames.contacts = {};
            
            contactIds.forEach(cid => {
                store.avatarFrames.contacts[cid] = { url: '', size: 120, offsetX: 0, offsetY: 0 };
            });
            save();
            renderAvatarFrameGrid();
            updateFramePreview();
            showToast(`已清除 ${contactIds.length} 个联系人的头像框 ✅`);
        }
        
        // ========== BATCH CHAT BACKGROUND MANAGEMENT ==========
        let _batchBgDataUrl = '';

        function handleBatchBgUpload(input) {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                _batchBgDataUrl = e.target.result;
                // [FIX-批量背景持久化] 将背景图数据保存到store，重进美化页面时可恢复
                store.batchChatBg = _batchBgDataUrl;
                save();
                const preview = document.getElementById('batch-bg-preview');
                preview.innerHTML = `<img src="${_batchBgDataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
                preview.style.border = 'none';
                document.getElementById('batch-bg-actions').style.display = 'block';
                _renderBatchBgContactList();
            };
            reader.readAsDataURL(file);
            input.value = '';
        }

        function _renderBatchBgContactList() {
            const list = document.getElementById('batch-bg-contact-list');
            const contacts = (store.contacts || []);
            list.innerHTML = contacts.map(c => {
                const hasBg = c.settings?.bg ? true : false;
                return `<label style="display:flex;align-items:center;padding:10px 12px;border-bottom:1px solid #f5f5f5;cursor:pointer;gap:10px;">
                    <input type="checkbox" class="batch-bg-cb" value="${c.id}" style="width:18px;height:18px;accent-color:#07c160;">
                    <img src="${c.avatar || _ph(36)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">
                    <span style="flex:1;font-size:14px;">${c.name}${c.isGroup ? ' <span style=&quot;font-size:11px;color:#999;&quot;>(群聊)</span>' : ''}</span>
                    ${hasBg ? '<span style="font-size:11px;color:#07c160;background:#e8f8ee;padding:2px 6px;border-radius:4px;">有背景</span>' : ''}
                </label>`;
            }).join('');
        }

        function batchBgSelectAll() {
            document.querySelectorAll('.batch-bg-cb').forEach(cb => cb.checked = true);
        }

        function batchBgDeselectAll() {
            document.querySelectorAll('.batch-bg-cb').forEach(cb => cb.checked = false);
        }

        function applyBatchBg() {
            if (!_batchBgDataUrl) { toast('请先上传背景图片', 'error'); return; }
            const selected = Array.from(document.querySelectorAll('.batch-bg-cb:checked')).map(cb => cb.value);
            if (selected.length === 0) { toast('请至少选择一个联系人', 'error'); return; }
            selected.forEach(cid => {
                const c = store.contacts.find(x => x.id === cid);
                if (c) {
                    if (!c.settings) c.settings = {};
                    c.settings.bg = _batchBgDataUrl;
                }
            });
            save();
            // 如果当前聊天在选中列表中，立即应用
            if (selected.includes(activeChatId)) {
                const chatHistEl = document.getElementById('chat-history');
                if (chatHistEl) {
                    chatHistEl.classList.add('has-custom-bg');
                    // [FIX-壁纸被覆盖] 使用setProperty+important
                    // [FIX-壁纸卡顿发热] 使用Blob URL
                    var _batchBgBlobUrl = (typeof _getChatBgBlobUrl === 'function') ? _getChatBgBlobUrl(_batchBgDataUrl) : _batchBgDataUrl;
                    chatHistEl.style.setProperty('background-image', `url(${_batchBgBlobUrl})`, 'important');
                    chatHistEl.style.setProperty('background-size', 'cover', 'important');
                    chatHistEl.style.setProperty('background-position', 'center', 'important');
                    chatHistEl.style.setProperty('background-repeat', 'no-repeat', 'important');
                }
                /* [FIX-悬浮底栏白色] 同步背景到layer-chat */
                const _lc3 = document.getElementById('layer-chat');
                if(_lc3) {
                    // [FIX-壁纸卡顿发热] 复用已转换的Blob URL
                    var _lc3BgUrl = (typeof _batchBgBlobUrl !== 'undefined') ? _batchBgBlobUrl : _batchBgDataUrl;
                    _lc3.style.backgroundImage = `url(${_lc3BgUrl})`;
                    _lc3.style.backgroundSize = 'cover';
                    _lc3.style.backgroundPosition = 'center';
                    _lc3.style.backgroundRepeat = 'no-repeat';
                }
            }
            toast(`已将聊天背景应用到 ${selected.length} 个联系人`, 'success');
            _renderBatchBgContactList();
        }

        function clearBatchBg() {
            _batchBgDataUrl = '';
            // [FIX-批量背景持久化] 清除时也清除store中的持久化数据
            delete store.batchChatBg;
            save();
            const preview = document.getElementById('batch-bg-preview');
            preview.innerHTML = '<span id="batch-bg-placeholder" style="color:#999;font-size:13px;"><i class="fas fa-cloud-upload-alt" style="font-size:24px;display:block;margin-bottom:6px;color:#ccc;"></i>点击上传聊天背景图片</span>';
            preview.style.border = '2px dashed #ccc';
            document.getElementById('batch-bg-actions').style.display = 'none';
        }

        // Handle avatar frame upload from chat settings page
        function handleContactAvatarFrameUpload(input) {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(e) {
                const dataUrl = e.target.result;
                if (!store.avatarFrames) store.avatarFrames = { user: '', contacts: {} };
                if (!store.avatarFrames.contacts) store.avatarFrames.contacts = {};
                store.avatarFrames.contacts[activeChatId] = { url: dataUrl, size: 120, offsetX: 0, offsetY: 0 };
                save();
                renderMessages();
                showToast('已为当前联系人上传头像框 ✅');
            };
            reader.readAsDataURL(file);
            input.value = '';
        }
        
        function uploadContactAvatarFrame() {
            document.getElementById('contact-avatar-frame-file-input').click();
        }
        
        // Backward compat wrappers
        function renderContactFrameGrid() { renderAvatarFrameGrid(); }
        function setUserAvatarFrame(frameId) { selectPresetFrame(frameId); }
        function setContactAvatarFrame(contactId, frameId) {
            _frameTarget = 'contact';
            const sel = document.getElementById('avatar-frame-contact-select');
            if (sel) sel.value = contactId;
            selectPresetFrame(frameId);
        }
        
        // ========== MUSIC FAVORITE FUNCTIONS ==========
        
        function updateListenFavIcon() {
            const icon = document.getElementById('listen-fav-icon');
            if (!icon) return;
            const curMusic = store.musics?.[store.listenState?.curMusicIdx];
            if (!curMusic) { icon.style.color = 'rgba(255,255,255,0.6)'; return; }
            const isFav = (store.favoriteSongs || []).some(s => s.name === curMusic.name);
            icon.style.color = isFav ? '#ff4d6a' : 'rgba(255,255,255,0.6)';
        }
        
        function toggleListenFavorite() {
            const curMusic = store.musics?.[store.listenState?.curMusicIdx];
            if (!curMusic) { showToast('当前没有播放歌曲'); return; }
            
            if (!store.favoriteSongs) store.favoriteSongs = [];
            const idx = store.favoriteSongs.findIndex(s => s.name === curMusic.name);
            if (idx >= 0) {
                store.favoriteSongs.splice(idx, 1);
                showToast('已取消收藏 💔');
            } else {
                store.favoriteSongs.push({ name: curMusic.name, url: curMusic.url, lrc: curMusic.lrc || '', favTime: Date.now() });
                showToast('已收藏 ❤️');
                // Trigger contact favorite notification simulation
                simulateContactFavorite(curMusic);
            }
            save();
            updateListenFavIcon();
        }
        
        let contactFavNotifTimer = null;
        
        function simulateContactFavorite(music) {
            if (!store.listenState?.partnerId) return;
            const partner = (store.contacts || []).find(c => c.id === store.listenState.partnerId);
            if (!partner) return;
            
            // Random delay 2-8 seconds to simulate partner also favoriting
            const delay = 2000 + Math.random() * 6000;
            if (contactFavNotifTimer) clearTimeout(contactFavNotifTimer);
            contactFavNotifTimer = setTimeout(() => {
                showContactFavNotification(partner, music);
            }, delay);
        }
        
        function showContactFavNotification(contact, music) {
            // Remove existing notification
            const existing = document.getElementById('contact-fav-notification');
            if (existing) existing.remove();
            
            const notif = document.createElement('div');
            notif.id = 'contact-fav-notification';
            notif.style.cssText = `
                position: fixed; top: 80px; left: 50%; transform: translateX(-50%) translateY(-20px);
                background: rgba(0,0,0,0.85); color: #fff; padding: 12px 20px; border-radius: 20px;
                display: flex; align-items: center; gap: 10px; z-index: 99999;
                font-size: 13px; backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                opacity: 0; transition: all 0.4s ease; max-width: 85vw;
            `;
            notif.innerHTML = `
                <img src="${contact.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(contact.name) + '&background=random'}"
                     style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                <div>
                    <div style="font-weight:600;">${contact.name} <span style="color:#ff4d6a;">❤️</span> 收藏了这首歌</div>
                    <div style="font-size:11px; opacity:0.7; margin-top:2px;">🎵 ${music.name}</div>
                </div>
            `;
            
            const modal = document.getElementById('listen-player-modal');
            if (modal && modal.style.display !== 'none') {
                modal.appendChild(notif);
            } else {
                document.body.appendChild(notif);
            }
            
            // Animate in
            requestAnimationFrame(() => {
                notif.style.opacity = '1';
                notif.style.transform = 'translateX(-50%) translateY(0)';
            });
            
            // Auto dismiss
            setTimeout(() => {
                notif.style.opacity = '0';
                notif.style.transform = 'translateX(-50%) translateY(-20px)';
                setTimeout(() => notif.remove(), 400);
            }, 4000);
        }

        // ========== CONTACT GROUPS MODULE ==========
        let editingGroupId = null;
        let currentGroupDetailId = null;
        let pendingMomentData = null; // { text, img } for group selection before posting

        function openContactGroups() {
            document.getElementById('layer-contact-groups').classList.add('show');
            renderContactGroups();
        }

        function renderContactGroups() {
            const list = document.getElementById('contact-groups-list');
            if (!store.contactGroups) store.contactGroups = [];
            if (store.contactGroups.length === 0) {
                list.innerHTML = '<div style="text-align:center; padding:60px 20px; color:#999;"><i class="fas fa-layer-group" style="font-size:48px; margin-bottom:15px; display:block; opacity:0.3;"></i>暂无分组<br><span style="font-size:13px;">点击右上角 + 创建分组</span></div>';
                return;
            }
            list.innerHTML = store.contactGroups.map(g => {
                const count = (g.contactIds || []).length;
                const avatars = (g.contactIds || []).slice(0, 5).map(cid => {
                    const c = store.contacts.find(x => x.id === cid);
                    return c ? `<img src="${c.avatar}" style="width:28px;height:28px;border-radius:50%;border:2px solid #fff;margin-left:-8px;">` : '';
                }).join('');
                return `<div class="group-card" onclick="openGroupDetail('${g.id}')">
                    <div style="display:flex;align-items:center;gap:12px;">
<div style="width:44px;height:44px;border-radius:12px;background:transparent;display:flex;align-items:center;justify-content:center;color:#333;font-size:22px;"><i class="fas fa-users"></i></div>
                        <div style="flex:1;">
                            <div style="font-weight:600;font-size:16px;">${g.name}</div>
                            <div style="color:#999;font-size:13px;margin-top:2px;">${count} 位联系人</div>
                        </div>
                        <i class="fas fa-chevron-right" style="color:#ccc;"></i>
                    </div>
                    ${count > 0 ? `<div style="display:flex;align-items:center;margin-top:10px;padding-left:8px;">${avatars}</div>` : ''}
                </div>`;
            }).join('');
        }

        function openCreateGroupModal(groupId) {
            editingGroupId = groupId || null;
            const modal = document.getElementById('modal-create-group');
            const title = document.getElementById('create-group-modal-title');
            const nameInput = document.getElementById('new-group-name-input');
            const contactList = document.getElementById('group-contact-select-list');

            if (editingGroupId) {
                const g = store.contactGroups.find(x => x.id === editingGroupId);
                if (!g) return;
                title.innerText = '编辑分组';
                nameInput.value = g.name;
            } else {
                title.innerText = '创建分组';
                nameInput.value = '';
            }

            const existingIds = editingGroupId ? (store.contactGroups.find(x => x.id === editingGroupId)?.contactIds || []) : [];
            const privateContacts = store.contacts.filter(c => !c.isGroup);
            contactList.innerHTML = privateContacts.map(c => {
                const checked = existingIds.includes(c.id) ? 'checked' : '';
                return `<label style="display:flex;align-items:center;padding:10px 8px;cursor:pointer;border-bottom:1px solid #f5f5f5;">
                    <input type="checkbox" class="group-contact-chk" value="${c.id}" ${checked} style="margin-right:10px;width:18px;height:18px;">
                    <img src="${c.avatar}" class="avatar" style="width:36px;height:36px;margin-right:10px;">
                    <span style="font-size:15px;">${c.name}</span>
                </label>`;
            }).join('');

            modal.style.display = 'flex';
            // [FIX-遮罩残留] 点击遮罩区域关闭弹窗
            modal.onclick = function(e) {
                if (e.target === modal) modal.style.display = 'none';
            };
        }

        function saveContactGroup() {
            const name = document.getElementById('new-group-name-input').value.trim();
            if (!name) return toast('请输入分组名称');

            const checkedIds = Array.from(document.querySelectorAll('.group-contact-chk:checked')).map(el => el.value);

            if (!store.contactGroups) store.contactGroups = [];

            if (editingGroupId) {
                const g = store.contactGroups.find(x => x.id === editingGroupId);
                if (g) {
                    g.name = name;
                    g.contactIds = checkedIds;
                }
                toast('分组已更新', 'success');
            } else {
                store.contactGroups.push({
                    id: 'grp_' + Date.now(),
                    name: name,
                    contactIds: checkedIds
                });
                toast('分组已创建', 'success');
            }

            save();
            document.getElementById('modal-create-group').style.display = 'none';
            renderContactGroups();
            if (currentGroupDetailId) renderGroupDetail(currentGroupDetailId);
            editingGroupId = null;
        }

        function openGroupDetail(groupId) {
            currentGroupDetailId = groupId;
            document.getElementById('layer-group-detail').classList.add('show');
            renderGroupDetail(groupId);
        }

        function renderGroupDetail(groupId) {
            const g = store.contactGroups.find(x => x.id === groupId);
            if (!g) return;
            document.getElementById('group-detail-title').innerText = g.name;
            const content = document.getElementById('group-detail-content');
            const contacts = (g.contactIds || []).map(cid => store.contacts.find(x => x.id === cid)).filter(Boolean);

            let html = `<div style="background:#fff;border-radius:12px;padding:15px;margin-bottom:10px;">
                <div style="font-size:14px;color:#999;margin-bottom:10px;">成员 (${contacts.length})</div>`;

            if (contacts.length === 0) {
                html += '<div style="text-align:center;padding:30px;color:#ccc;">暂无成员，点击右上角菜单编辑</div>';
            } else {
                html += contacts.map(c => `<div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #f5f5f5;">
                    <img src="${c.avatar}" class="avatar" style="width:40px;height:40px;margin-right:12px;">
                    <div style="flex:1;">
                        <div style="font-weight:500;font-size:15px;">${c.name}</div>
                        <div style="color:#999;font-size:12px;">${c.desc ? c.desc.substring(0, 30) + '...' : ''}</div>
                    </div>
                    <div style="cursor:pointer;color:#ff4d4f;font-size:13px;padding:5px 10px;" onclick="removeContactFromGroup('${groupId}','${c.id}')">移除</div>
                </div>`).join('');
            }

            html += '</div>';
            html += `<div style="background:#fff;border-radius:12px;padding:15px;">
                <div style="color:#576b95;text-align:center;cursor:pointer;font-size:15px;" onclick="openCreateGroupModal('${groupId}')"><i class="fas fa-user-plus" style="margin-right:6px;"></i>添加/编辑成员</div>
            </div>`;
            content.innerHTML = html;
        }

        function removeContactFromGroup(groupId, contactId) {
            const g = store.contactGroups.find(x => x.id === groupId);
            if (!g) return;
            g.contactIds = (g.contactIds || []).filter(id => id !== contactId);
            save();
            renderGroupDetail(groupId);
            renderContactGroups();
            toast('已移除', 'success');
        }

        function editCurrentGroup() {
            if (!currentGroupDetailId) return;
            togglePopup('group-detail-menu');
            openCreateGroupModal(currentGroupDetailId);
        }

        function deleteCurrentGroup() {
            if (!currentGroupDetailId) return;
            togglePopup('group-detail-menu');
            showConfirm('删除分组', '确定要删除这个分组吗？删除后不可恢复。', () => {
                store.contactGroups = store.contactGroups.filter(g => g.id !== currentGroupDetailId);
                save();
                closeLayer('layer-group-detail');
                renderContactGroups();
                currentGroupDetailId = null;
                toast('分组已删除', 'success');
            });
        }

        // --- Moment Group Visibility ---
        let selectedMomentGroupIds = new Set();

        function showMomentGroupSelect(text, img, imgs) {
            pendingMomentData = { text, img, imgs };
            selectedMomentGroupIds.clear();
            const list = document.getElementById('moment-group-select-list');
            if (!store.contactGroups || store.contactGroups.length === 0) {
                // No groups, post directly
                doPostMomentWithGroups();
                return;
            }
            list.innerHTML = store.contactGroups.map(g => {
                const count = (g.contactIds || []).length;
                return `<label style="display:flex;align-items:center;padding:10px 8px;cursor:pointer;border-bottom:1px solid #f5f5f5;">
                    <input type="checkbox" class="moment-group-chk" value="${g.id}" onchange="toggleMomentGroupChk(this)" style="margin-right:10px;width:18px;height:18px;">
                    <i class="fas fa-users" style="color:#667eea;margin-right:10px;"></i>
                    <span style="font-size:15px;flex:1;">${g.name}</span>
                    <span style="color:#999;font-size:12px;">${count}人</span>
                </label>`;
            }).join('');
            document.getElementById('modal-moment-group-select').style.display = 'flex';
        }

        function toggleMomentGroupChk(el) {
            if (el.checked) selectedMomentGroupIds.add(el.value);
            else selectedMomentGroupIds.delete(el.value);
        }

        function confirmMomentGroupSelect() {
            document.getElementById('modal-moment-group-select').style.display = 'none';
            doPostMomentWithGroups();
        }

        function doPostMomentWithGroups() {
            if (!pendingMomentData) return;
            const { text, img, imgs } = pendingMomentData;
            pendingMomentData = null;

            if (!text && !img && (!imgs || imgs.length === 0)) return toast('请输入内容');
            const mId = Date.now();
            const visibleGroupIds = selectedMomentGroupIds.size > 0 ? Array.from(selectedMomentGroupIds) : [];

            store.moments.unshift({
                id: mId,
                name: store.user.name,
                avatar: store.user.avatar,
                content: text || '',
                img: img,
                imgs: imgs || null,
                time: mId,
                likes: [],
                comments: [],
                visibleGroupIds: visibleGroupIds
            });
            save();
            renderMoments();

            // AI contacts comment - filtered by group visibility
            let aiContacts = store.contacts.filter(c => !c.isGroup);
            if (visibleGroupIds.length > 0) {
                const visibleContactIds = new Set();
                visibleGroupIds.forEach(gid => {
                    const g = store.contactGroups.find(x => x.id === gid);
                    if (g) (g.contactIds || []).forEach(cid => visibleContactIds.add(cid));
                });
                aiContacts = aiContacts.filter(c => visibleContactIds.has(c.id));
            }
            // 发布后立即显示打字指示器并快速触发AI评论
            // [FIX-纯图片朋友圈] 当用户只发图片没有文字时，传递图片描述信息给AI
            const momentDesc = text || (img ? '[用户发了一张图片]' : (imgs && imgs.length > 0 ? '[用户发了' + imgs.length + '张图片]' : ''));
            if (aiContacts.length > 0) {
                showMomentTypingIndicator(aiContacts[0].name);
            }
            aiContacts.forEach((c, idx) => {
                setTimeout(() => {
                    aiGenerate(`comment_user_moment::${c.id}::${mId}::${momentDesc.substring(0, 50)}`);
                }, 500 + Math.random() * 2000 * idx);
            });

            // [NEW-NPC朋友圈联动] 关系网NPC也可能评论用户的朋友圈
            try {
                if (typeof triggerNpcMomentComments === 'function') {
                    triggerNpcMomentComments(mId, momentDesc, null, store.user.name || '用户');
                }
            } catch (_npcErr) { console.warn('[NPC朋友圈] 触发失败:', _npcErr); }

            selectedMomentGroupIds.clear();
        }

        // Helper: get contacts in same groups as a given contact
        function getContactsInSameGroups(contactId) {
            if (!store.contactGroups || store.contactGroups.length === 0) return [];
            const sameGroupContactIds = new Set();
            store.contactGroups.forEach(g => {
                if ((g.contactIds || []).includes(contactId)) {
                    (g.contactIds || []).forEach(cid => {
                        if (cid !== contactId) sameGroupContactIds.add(cid);
                    });
                }
            });
            return Array.from(sameGroupContactIds);
        }

        // Helper: check if two contacts share at least one group
        // [FIX-互评逻辑] 没有分组时不再默认所有人互评，避免无交集联系人互相评论
        function areInSameGroup(contactId1, contactId2) {
            if (!store.contactGroups || store.contactGroups.length === 0) return false; // 没有分组 = 不互评
            return store.contactGroups.some(g => {
                const ids = g.contactIds || [];
                return ids.includes(contactId1) && ids.includes(contactId2);
            });
        }

        // Helper: check if a contact can see a moment
        function canSeeMoment(contactId, moment) {
            if (!moment.visibleGroupIds || moment.visibleGroupIds.length === 0) return true;
            return moment.visibleGroupIds.some(gid => {
                const g = store.contactGroups.find(x => x.id === gid);
                return g && (g.contactIds || []).includes(contactId);
            });
        }

        // Expose contact group functions
        window.openContactGroups = openContactGroups;
        window.renderContactGroups = renderContactGroups;
        window.openCreateGroupModal = openCreateGroupModal;
        window.saveContactGroup = saveContactGroup;
        window.openGroupDetail = openGroupDetail;
        window.renderGroupDetail = renderGroupDetail;
        window.removeContactFromGroup = removeContactFromGroup;
        window.editCurrentGroup = editCurrentGroup;
        window.deleteCurrentGroup = deleteCurrentGroup;
        window.showMomentGroupSelect = showMomentGroupSelect;
        window.toggleMomentGroupChk = toggleMomentGroupChk;
        window.confirmMomentGroupSelect = confirmMomentGroupSelect;
        window.doPostMomentWithGroups = doPostMomentWithGroups;
        window.getContactsInSameGroups = getContactsInSameGroups;
        window.areInSameGroup = areInSameGroup;
        window.canSeeMoment = canSeeMoment;
        // ========== END CONTACT GROUPS MODULE ==========

        // Bookstore functions 已移至 app-bookstore.js 中暴露

        // Avatar frame functions
        window.renderAvatarFrameGrid = renderAvatarFrameGrid;
        window.setUserAvatarFrame = setUserAvatarFrame;
        window.renderContactFrameGrid = renderContactFrameGrid;
        window.setContactAvatarFrame = setContactAvatarFrame;
        window.updateFramePreview = updateFramePreview;
        window.recommendFrameToContact = recommendFrameToContact;
        window.switchFrameTarget = switchFrameTarget;
        window.onFrameContactChange = onFrameContactChange;
        window.selectPresetFrame = selectPresetFrame;
        window.uploadAvatarFrameImage = uploadAvatarFrameImage;
        window.handleAvatarFrameUpload = handleAvatarFrameUpload;
        window.clearCurrentAvatarFrame = clearCurrentAvatarFrame;
        window.updateFrameLive = updateFrameLive;
        window.syncSlidersToCurrentFrame = syncSlidersToCurrentFrame;
        
        // Music favorite functions
        window.toggleListenFavorite = toggleListenFavorite;
        window.updateListenFavIcon = updateListenFavIcon;

        // ===== 反向查岗功能 =====
        let reverseCheckState = {
            active: false,
            contactId: null,
            contactName: '',
            activityLog: [],
            currentApp: '桌面',
            viewingItems: [],
            interval: null,
            isUserInitiated: true, // 标记是用户发起还是联系人发起
            _stepTimer: null // 用于递归setTimeout
        };

        // [公共] 反向查岗专用API调用
        async function _rcApiCall(prompt, opts) {
            const _url = (typeof API !== 'undefined' && API._normalizeBaseUrl) ? API._normalizeBaseUrl(store.system.url) : store.system.url.trim().replace(/\/+$/, '').replace(/\/chat\/completions$/i, '').replace(/\/completions$/i, '').replace(/\/+$/, '');
            const resp = await fetch(_url + '/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + store.system.key },
                body: JSON.stringify({
                    model: store.system.model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: opts && opts.temperature || 0.8,
                    max_tokens: opts && opts.max_tokens || 200
                })
            });
            const data = await resp.json();
            return data.choices[0].message.content.trim();
        }

        // 用户主动发起查岗邀请
        window.startReverseCheck = function() {
            if (!activeChatId) return toast("请先打开聊天窗口", "error");
            if (reverseCheckState.active) return toast("查岗正在进行中", "error");
            const contact = store.contacts.find(c => c.id === activeChatId);
            if (!contact) return toast("找不到联系人", "error");
            
            reverseCheckState.contactId = activeChatId;
            reverseCheckState.contactName = contact.name;
            reverseCheckState.isUserInitiated = true;
            
            // 显示邀请确认弹窗
            document.getElementById('rc-invite-contact-name').textContent = contact.name;
            document.getElementById('modal-reverse-check-invite').style.display = 'flex';
        };

        // 联系人主动发起查岗请求
        window.contactInitiateReverseCheck = async function(contactId) {
            // [FIX-查手机冒话] 全局开关检查
            if (store.reverseCheckGlobalDisabled) return;
            if (reverseCheckState.active) return; // 防重入
            const contact = store.contacts.find(c => c.id === contactId);
            if (!contact) return;
            
            // 检查是否允许该联系人查岗
            if (!contact.settings) contact.settings = {};
            if (contact.settings.allowReverseCheck === false) return;
            
            reverseCheckState.contactId = contactId;
            reverseCheckState.contactName = contact.name;
            reverseCheckState.isUserInitiated = false;
            
            // [FIX-反向查岗-动态消息] 使用API生成符合人设的查岗请求消息
            const userName = getUserPersonaName(contact, store.user.name || '用户');
            let requestContent = '我想查看你的手机，可以吗？'; // 降级默认
            
            try {
                const _rcPrompt = `你是${contact.name}，你想查看${userName}的手机。

你的人设：${contact.persona || '普通朋友'}

请用一句符合你性格的话，向${userName}提出想看TA手机的请求。要求：
- 完全符合你的人设说话风格
- 自然口语化，像真人在微信里说的话
- 不超过25个字
- 直接输出你说的话，不要加任何标记

示例参考（不要照抄，要符合你自己的性格）：
- 恋人型："宝贝让我翻翻你手机嘛~"
- 霸道型："手机给我看看"
- 撒娇型："哥哥～人家想看看你手机嘛"
- 调皮型："嘿嘿突击检查，手机交出来！"
- 冷淡型："手机借我看下"`;
                
                const _rcContent = await _rcApiCall(_rcPrompt, { temperature: 0.9, max_tokens: 50 });
                const _cleaned = _rcContent.replace(/["""]/g, '');
                if (_cleaned && _cleaned.length > 0 && _cleaned.length < 60) {
                    requestContent = _cleaned;
                }
                console.log('[反向查岗] AI生成查岗请求消息:', requestContent);
            } catch (error) {
                console.error('[反向查岗] 生成查岗请求消息失败，使用默认:', error);
            }
            
            // 发送查岗请求消息
            const requestMsg = {
                id: Date.now(),
                sender: 'ai',
                content: requestContent,
                time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'}),
                type: 'reverse-check-request'
            };
            
            if (!store.chats[contactId]) store.chats[contactId] = [];
            store.chats[contactId].push(requestMsg);
            
            // 如果当前正在该聊天窗口，刷新显示
            if (activeChatId === contactId) {
                renderHistory();
            }
            save();
            
            // 显示请求弹窗
            setTimeout(() => {
                document.getElementById('rc-request-contact-name').textContent = contact.name;
                document.getElementById('modal-reverse-check-request').style.display = 'flex';
            }, 500);
        };

        window.closeReverseCheckInvite = function() {
            document.getElementById('modal-reverse-check-invite').style.display = 'none';
        };

        window.confirmSendReverseCheckInvite = async function() {
            closeReverseCheckInvite();
            
            // 发送邀请消息到聊天
            const contact = store.contacts.find(c => c.id === reverseCheckState.contactId);
            if (!contact) return;
            
            // 使用特殊标记让AI能识别这是查手机邀请
            const inviteMsg = {
                id: Date.now(),
                sender: 'me',
                content: '[REVERSE_CHECK_INVITE] 我邀请你查看我的手机数据（包括聊天记录、相册、浏览记录等），你可以接受或拒绝这个邀请。',
                time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'}),
                type: 'reverse-check-invite',
                displayContent: '我邀请你查看我的手机，想看看吗？'
            };
            
            if (!store.chats[reverseCheckState.contactId]) store.chats[reverseCheckState.contactId] = [];
            store.chats[reverseCheckState.contactId].push(inviteMsg);
            renderHistory();
            save();
            
            // 联系人根据人设生成回应
            setTimeout(async () => {
                await generateContactResponseToInvite(contact);
            }, 1500);
        };
        
        // 联系人根据人设对邀请作出反应
        async function generateContactResponseToInvite(contact) {
            const userName = getUserPersonaName(contact, store.user.name || '用户');
            
            // 构建提示词让AI根据人设决定是否接受
            const prompt = `你是${contact.name}，${userName}主动邀请你查看${userName}自己的手机数据（聊天记录、相册等）。

⚠️ 重要：被查看的手机是${userName}的手机，不是你（${contact.name}）的手机！${userName}在把自己的手机给你翻看。

人设：${contact.persona || '普通朋友'}

请根据你的性格特点，决定是否接受这个邀请去翻看${userName}的手机，并给出简短的回应（1-2句话）。
回应格式：[DECISION:ACCEPT]你的回应内容 或 [DECISION:REJECT]你的回应内容

注意：
- ACCEPT表示你接受邀请去看${userName}的手机，REJECT表示你拒绝看
- 回应要符合人设，可以是好奇、调侃、关心等语气
- 不要说关于"我的手机"之类的话，因为被查的不是你的手机
- 不要太正式，要自然`;

            try {
                const aiResponse = await _rcApiCall(prompt, { temperature: 0.8, max_tokens: 100 });
                
                console.log('[反向查岗] AI回应:', aiResponse);
                
                // 解析AI回应
                const acceptMatch = aiResponse.match(/\[DECISION:ACCEPT\](.*)/);
                const rejectMatch = aiResponse.match(/\[DECISION:REJECT\](.*)/);
                
                let responseText = '';
                let willAccept = false;
                
                if (acceptMatch) {
                    responseText = acceptMatch[1].trim();
                    willAccept = true;
                    console.log('[反向查岗] 联系人接受邀请');
                } else if (rejectMatch) {
                    responseText = rejectMatch[1].trim();
                    willAccept = false;
                    console.log('[反向查岗] 联系人拒绝邀请');
                } else {
                    // 如果AI没有按格式回复，根据回复内容语义判断
                    responseText = aiResponse;
                    // 检查回复内容中是否包含拒绝语义
                    const rejectKeywords = /不|拒绝|算了|没兴趣|不想|不要|不用|不必|别|免了|不方便|不太好|不合适|privacy|隐私/i;
                    const acceptKeywords = /好[啊吧的呀]|可以|没问题|行[啊吧]|来吧|看看|当然|愿意|乐意|走|冲|let me|让我/i;
                    if (acceptKeywords.test(aiResponse)) {
                        willAccept = true;
                    } else if (rejectKeywords.test(aiResponse)) {
                        willAccept = false;
                    } else {
                        willAccept = Math.random() < 0.7;
                    }
                    console.log('[反向查岗] AI未按格式回复，语义分析决定:', willAccept ? '接受' : '拒绝');
                }
                
                // 发送联系人的回应消息
                const responseMsg = {
                    id: Date.now(),
                    sender: 'ai',
                    content: responseText,
                    time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
                };
                
                if (!store.chats[reverseCheckState.contactId]) store.chats[reverseCheckState.contactId] = [];
                store.chats[reverseCheckState.contactId].push(responseMsg);
                
                // 如果当前在该聊天窗口，立即刷新显示
                if (activeChatId === reverseCheckState.contactId) {
                    renderHistory();
                }
                save();
                
                // 根据决定执行相应操作
                if (willAccept) {
                    console.log('[反向查岗] 1秒后将显示监控窗口');
                    toast(`${contact.name}接受了邀请，正在准备查看...`, 'success');
                    setTimeout(() => {
                        console.log('[反向查岗] 调用 acceptReverseCheckRequest');
                        acceptReverseCheckRequest();
                    }, 1500); // 延长到1.5秒，让用户看到回复
                } else {
                    toast(`${contact.name}拒绝了查岗邀请`);
                }
                
            } catch (error) {
                console.error('[反向查岗] 生成联系人回应失败:', error);
                // 降级处理：默认接受
                const willAccept = Math.random() < 0.6; // 降级时60%接受率
                const responseMsg = {
                    id: Date.now(),
                    sender: 'ai',
                    content: willAccept ? '好啊，让我看看~' : '不太方便呢...',
                    time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
                };
                
                if (!store.chats[reverseCheckState.contactId]) store.chats[reverseCheckState.contactId] = [];
                store.chats[reverseCheckState.contactId].push(responseMsg);
                
                if (activeChatId === reverseCheckState.contactId) {
                    renderHistory();
                }
                save();
                
                if (willAccept) {
                    console.log('[反向查岗] 降级处理：接受邀请');
                    toast(`${contact.name}接受了邀请，正在准备查看...`, 'success');
                    setTimeout(() => {
                        acceptReverseCheckRequest();
                    }, 1500);
                } else {
                    toast(`${contact.name}拒绝了查岗邀请`);
                }
            }
        }

        window.rejectReverseCheckRequest = function() {
            document.getElementById('modal-reverse-check-request').style.display = 'none';
            
            const rejectMsg = {
                id: Date.now(),
                sender: 'me',
                content: '我拒绝了你的查岗请求',
                time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
            };
            
            if (!store.chats[reverseCheckState.contactId]) store.chats[reverseCheckState.contactId] = [];
            store.chats[reverseCheckState.contactId].push(rejectMsg);
            renderHistory();
            save();
            
            toast('已拒绝查岗请求');
        };

        window.acceptReverseCheckRequest = async function() {
            document.getElementById('modal-reverse-check-request').style.display = 'none';
            
            // 只有在联系人主动请求的场景下才发送接受消息
            // 用户主动邀请的场景下，联系人已经在AI回复中表达了接受
            if (!reverseCheckState.isUserInitiated) {
                const acceptMsg = {
                    id: Date.now(),
                    sender: 'me',
                    content: '我接受了你的查岗请求，开始查看你的手机...',
                    time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
                };
                
                if (!store.chats[reverseCheckState.contactId]) store.chats[reverseCheckState.contactId] = [];
                store.chats[reverseCheckState.contactId].push(acceptMsg);
                renderHistory();
                save();
            }
            
            // 开始查岗
            reverseCheckState.active = true;
            reverseCheckState.activityLog = [];
            reverseCheckState.viewingItems = [];
            
            // 确保监控窗口元素存在
            const monitorEl = document.getElementById('reverse-check-monitor');
            if (!monitorEl) {
                console.error('[反向查岗] 监控窗口元素不存在');
                toast('监控窗口加载失败', 'error');
                return;
            }
            
            // 显示查岗监控窗口
            document.getElementById('rc-monitor-contact-name').textContent = reverseCheckState.contactName;
            monitorEl.style.display = 'flex';
            monitorEl.style.zIndex = '10000'; // 确保在最顶层
            // [FIX-反向查岗-重新打开] 重置 closeReverseCheckMonitor 设置的隐藏属性
            monitorEl.style.visibility = 'visible';
            monitorEl.style.pointerEvents = 'auto';
            
            // 强制触发重绘
            setTimeout(() => {
                monitorEl.style.opacity = '1';
            }, 50);
            
            // 更新手机时间
            updatePhoneTime();
            
            // 开始模拟查岗过程
            startReverseCheckSimulation();
            
            console.log('[反向查岗] 监控窗口已显示，开始模拟查岗');
        }

        function updatePhoneTime() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
            document.getElementById('rc-phone-time').textContent = timeStr;
        }

        function startReverseCheckSimulation() {
            // [FIX-反向查岗] 获取当前查岗联系人，以此确定"用户人设"
            const checkingContact = store.contacts.find(c => c.id === reverseCheckState.contactId);
            // 获取该联系人认识的用户人设（联系人a挂的是人设a，就用人设a的数据）
            const userPersonaId = checkingContact && checkingContact.settings && checkingContact.settings.userPersona;
            const userPersona = (userPersonaId && store.personas && store.personas.find(p => p.id === userPersonaId)) || (store.personas && store.personas[0]);
            // 用这个人设名来匹配数据（朋友圈、消息等）
            const userName = userPersona ? userPersona.name : (store.user.name || '用户');
            
            // [FIX-反向查岗-人设过滤] 只查询与该人设关联的联系人
            // 如果联系人A挂载了人设X，则只显示同样挂载了人设X的联系人的数据
            // [FIX-反向查岗-查得到] 不再排除查岗者自己！翻手机时理应能看到自己和手机主人的聊天记录
            const allowedContactIds = new Set();
            if (userPersonaId) {
                (store.contacts || []).forEach(c => {
                    if (c.isGroup) return; // 排除群聊
                    // 只允许绑定了相同用户人设的联系人（包括查岗者自己）
                    const cPersonaId = c.settings && c.settings.userPersona;
                    if (cPersonaId === userPersonaId) {
                        allowedContactIds.add(c.id);
                    }
                });
            } else {
                // 如果没有绑定人设，则显示所有（保持旧行为）
                (store.contacts || []).forEach(c => {
                    if (!c.isGroup) {
                        allowedContactIds.add(c.id);
                    }
                });
            }
            
            // [FIX-反向查岗] 只看与该人设相关的聊天
            const userChats = store.chats;
            // 朋友圈：只看该人设名发的，或默认全部
            const userMoments = (store.moments || []).filter(m =>
                m.name === userName || m.name === (store.user.name || '') ||
                (store.personas || []).some(p => p.name === m.name)
            );
            const userContacts = (store.contacts || []).filter(c => allowedContactIds.has(c.id));
            
            // 构建真实数据项（按App分类）
            const realDataItems = [];
            
            // === 1. 微信聊天记录（只查看与同一人设关联的联系人的聊天） ===
            // [FIX-反向查岗-上下文] 取更多消息(-20)，并把同一联系人的消息合并成对话片段
            // 这样AI能看到完整对话上下文，而不是孤立的单条消息
            if (userChats && Object.keys(userChats).length > 0) {
                Object.keys(userChats).forEach(contactId => {
                    // [FIX-反向查岗-查得到] 不再排除查岗者自己的对话，翻手机时能看到自己和手机主人的聊天
                    // [FIX-人设过滤] 只查看与同一人设关联的联系人的聊天
                    if (!allowedContactIds.has(contactId)) return;
                    const contact = store.contacts.find(c => c.id === contactId);
                    if (!contact || !userChats[contactId] || userChats[contactId].length === 0) return;
                    // 取最近20条文本消息构建对话上下文
                    const recentMsgs = userChats[contactId].slice(-20).filter(msg =>
                        (msg.type === 'text' || !msg.type) && msg.content && typeof msg.content === 'string'
                    );
                    if (recentMsgs.length === 0) return;
                    // 构建完整对话片段（带发送者标注）
                    const chatContext = recentMsgs.map(msg =>
                        (msg.sender === 'me' ? userName : contact.name) + '：' + msg.content.substring(0, 120)
                    ).join('\n');
                    // 为每个联系人生成 1~3 个查看事件，分别对应聊天里的关键消息，让AI能看到整体上下文
                    // 把对话拆成窗口：开头片段、中间片段、最新片段，每个片段都带完整chatContext
                    const snippets = [];
                    if (recentMsgs.length <= 4) {
                        snippets.push(recentMsgs);
                    } else if (recentMsgs.length <= 10) {
                        snippets.push(recentMsgs.slice(-6));
                        snippets.push(recentMsgs);
                    } else {
                        snippets.push(recentMsgs.slice(-6));
                        snippets.push(recentMsgs.slice(-12, -6));
                        snippets.push(recentMsgs);
                    }
                    snippets.forEach((grp, gi) => {
                        const last = grp[grp.length - 1];
                        const detailText = last ? last.content.substring(0, 40) : '';
                        realDataItems.push({
                            app: '微信',
                            icon: 'fa-weixin',
                            action: `查看与${contact.name}的聊天`,
                            detail: detailText,
                            fullData: {
                                type: 'chat',
                                contactName: contact.name,
                                chatWithContactId: contactId,
                                // 保留旧字段兼容
                                message: last ? last.content : '',
                                senderIsUser: last ? last.sender === 'me' : false,
                                // [FIX-反向查岗-上下文] 新增完整对话片段
                                chatContext: chatContext,
                                snippetIndex: gi,
                                snippetTotal: snippets.length
                            }
                        });
                    });
                });
            }
            
            // === 2. 朋友圈（读取真实朋友圈） ===
            if (userMoments && userMoments.length > 0) {
                userMoments.slice(-4).forEach(moment => {
                    if (moment.content) {
                        realDataItems.push({
                            app: '微信朋友圈',
                            icon: 'fa-weixin',
                            action: '查看朋友圈动态',
                            detail: moment.content.substring(0, 40),
                            fullData: { type: 'moment', content: moment.content, author: moment.name || userName }
                        });
                    }
                });
            }
            
            // === 3. 通讯录（读取真实联系人，排除查岗者自己） ===
            // [FIX-反向查岗-情敌] 通讯录中必须过滤掉查岗者自己，否则AI会把查岗者名字误认为"另一个联系人"导致吃醋
            const _contactsForList = userContacts.filter(c => c.id !== reverseCheckState.contactId);
            if (_contactsForList && _contactsForList.length > 0) {
                const contactNames = _contactsForList.slice(0, 6).map(c => c.name).join('、');
                realDataItems.push({
                    app: '通讯录',
                    icon: 'fa-address-book',
                    action: '翻看联系人列表',
                    detail: `发现联系人：${contactNames}等`,
                    fullData: { type: 'contacts', names: contactNames }
                });
            }
            
            // === 4. 相册（图片消息统计） ===
            // [FIX-人设过滤] 只统计与同一人设关联的联系人的聊天图片
            let photoCount = 0;
            if (userChats) {
                Object.keys(userChats).forEach(cid => {
                    // [FIX-反向查岗-查得到] 查岗者已包含在allowedContactIds中
                    if (!allowedContactIds.has(cid)) return;
                    photoCount += userChats[cid].filter(m => m.type === 'image').length;
                });
            }
            if (photoCount > 0) {
                realDataItems.push({
                    app: '手机相册',
                    icon: 'fa-images',
                    action: '浏览相册照片',
                    detail: `共${photoCount}张照片`,
                    fullData: { type: 'photos', count: photoCount }
                });
            }
            
            // === 5. [NEW] 邮箱/信箱（读取真实邮件） ===
            if (store.mailbox && store.mailbox.length > 0) {
                // [FIX-人设过滤] 只显示与同一人设关联的联系人的邮件
                const userMails = store.mailbox.filter(m => {
                    if (!m.subject) return false;
                    const otherId = m.from === '__user__' ? m.to : (m.to === '__user__' ? m.from : null);
                    if (!otherId) return false;
                    // [FIX-反向查岗-查得到] 只显示与同一人设关联的联系人的邮件（查岗者已包含在allowedContactIds中）
                    return allowedContactIds.has(otherId);
                }).slice(-4);
                userMails.forEach(mail => {
                    const isSent = mail.from === '__user__';
                    const otherId = isSent ? mail.to : mail.from;
                    const contact = store.contacts.find(c => c.id === otherId);
                    const contactName = contact ? contact.name : '某人';
                    
                    // [FIX-反向查岗-信件识别] 如果这封信是联系人自己写给用户的（inbox, from === 查岗者），
                    // 标记为 isOwnLetter，让查岗者在评论时能认出"这是我写的信"
                    const isOwnLetter = !isSent && otherId === reverseCheckState.contactId;
                    
                    realDataItems.push({
                        app: '邮箱',
                        icon: 'fa-envelope',
                        action: isSent ? `查看发给${contactName}的信` : `查看${contactName}来的信`,
                        detail: (mail.subject || '').substring(0, 40),
                        fullData: {
                            type: 'mail', subject: mail.subject, body: (mail.body || '').substring(0, 200),
                            isSent, contactName,
                            isOwnLetter // 标记这是查岗者自己写给用户的信
                        }
                    });
                });
            }
            
            // === 6. [NEW] 购物记录（查看订单、购物车） ===
            if (store.shopOrders && store.shopOrders.length > 0) {
                const recentOrders = store.shopOrders.slice(0, 3);
                recentOrders.forEach(order => {
                    const itemNames = (order.items || []).map(i => i.name || '商品').join('、');
                    realDataItems.push({
                        app: '购物',
                        icon: 'fa-shopping-bag',
                        action: '查看购物订单',
                        detail: itemNames ? `购买了：${itemNames.substring(0, 35)}` : `订单共¥${(order.total || 0).toFixed(0)}元`,
                        fullData: { type: 'shop_order', items: itemNames, total: order.total, status: order.status }
                    });
                });
            }
            if (store.shopCart && store.shopCart.length > 0) {
                const cartItems = store.shopCart.slice(0, 3).map(item => {
                    const prod = (store.shopProducts || []).find(p => p.id === item.productId);
                    return prod ? prod.name : '商品';
                }).filter(Boolean).join('、');
                if (cartItems) {
                    realDataItems.push({
                        app: '购物车',
                        icon: 'fa-shopping-cart',
                        action: '翻看购物车',
                        detail: `购物车里有：${cartItems.substring(0, 40)}`,
                        fullData: { type: 'shop_cart', items: cartItems }
                    });
                }
            }
            if (store.shopFavorites && store.shopFavorites.length > 0) {
                const favItems = store.shopFavorites.slice(0, 3).map(fid => {
                    const prod = (store.shopProducts || []).find(p => p.id === fid);
                    return prod ? prod.name : '';
                }).filter(Boolean).join('、');
                if (favItems) {
                    realDataItems.push({
                        app: '购物收藏',
                        icon: 'fa-heart',
                        action: '查看收藏的商品',
                        detail: `收藏了：${favItems.substring(0, 40)}`,
                        fullData: { type: 'shop_fav', items: favItems }
                    });
                }
            }
            
            // === 7. [NEW] 线下聊天记录（如果有） ===
            if (store.offlineChats) {
                Object.keys(store.offlineChats).forEach(contactId => {
                    // [FIX-反向查岗-查得到] 不再排除查岗者自己的线下记录
                    // [FIX-人设过滤] 只查看与同一人设关联的联系人的线下记录
                    if (!allowedContactIds.has(contactId)) return;
                    const contact = store.contacts.find(c => c.id === contactId);
                    const offlineMsgs = (store.offlineChats[contactId] || []).slice(-2);
                    offlineMsgs.forEach(msg => {
                        if (msg.content && typeof msg.content === 'string' && msg.content.length > 5) {
                            realDataItems.push({
                                app: '线下记录',
                                icon: 'fa-map-marker-alt',
                                action: `翻看与${contact ? contact.name : '某人'}的线下见面记录`,
                                detail: msg.content.substring(0, 40),
                                fullData: { type: 'offline', contactName: contact ? contact.name : '某人', content: msg.content }
                            });
                        }
                    });
                });
            }
            
            // [NEW-关系网查手机] 从用户的关系网中生成NPC相关的虚拟数据痕迹
            // 用户的关系网数据分散在各个联系人的 relationNetworks 中
            try {
                const _allNPCs = [];
                if (store.relationNetworks) {
                    const _seenNPCNames = new Set();
                    Object.values(store.relationNetworks).forEach(rn => {
                        if (rn && rn.characters) {
                            rn.characters.forEach(ch => {
                                if (ch.id !== '__user__' && ch.id !== '__contact__' && ch.name && !_seenNPCNames.has(ch.name)) {
                                    _seenNPCNames.add(ch.name);
                                    _allNPCs.push(ch);
                                }
                            });
                        }
                    });
                }
                
                if (_allNPCs.length > 0) {
                    const _shuffledNPCs = _allNPCs.sort(() => Math.random() - 0.5).slice(0, Math.min(3, _allNPCs.length));
                    
                    _shuffledNPCs.forEach(npc => {
                        const npcName = npc.name;
                        const npcIdentity = npc.identity || '';
                        const npcRelation = npc.contactRelation || '';
                        const npcPersona = npc.persona || npc.oneliner || '';
                        const _npcTypes = [];
                        
                        // [FIX-NPC内容充实] 根据NPC人设生成模拟聊天片段，让查手机场景更真实
                        const _npcChatSnippets = {
                            // 根据NPC身份生成不同风格的聊天片段
                            _generate: function() {
                                const identity = npcIdentity.toLowerCase();
                                const rel = npcRelation.toLowerCase();
                                // 根据关系类型生成合理的对话片段
                                if (rel.includes('闺蜜') || rel.includes('好友') || rel.includes('朋友')) {
                                    const options = [
                                        `${npcName}: 周末出来玩不？\n${userName}: 看情况吧，你想去哪\n${npcName}: 新开了个店超好吃`,
                                        `${userName}: 你今天干嘛呢\n${npcName}: 在家追剧 太好看了\n${userName}: 什么剧 推荐一下`,
                                        `${npcName}: 哈哈哈哈哈哈我跟你说个事\n${userName}: 说\n${npcName}: 今天遇到一个超搞笑的`,
                                    ];
                                    return options[Math.floor(Math.random() * options.length)];
                                } else if (rel.includes('同事') || rel.includes('同学')) {
                                    const options = [
                                        `${npcName}: 明天的会/课你去不去\n${userName}: 去啊 几点来着\n${npcName}: 好像是10点`,
                                        `${userName}: 那个文件/作业你弄好了吗\n${npcName}: 还在弄 你弄好了？\n${userName}: 差不多了`,
                                    ];
                                    return options[Math.floor(Math.random() * options.length)];
                                } else if (rel.includes('前') || rel.includes('暧昧')) {
                                    const options = [
                                        `${npcName}: 最近还好吗\n${userName}: 挺好的 你呢\n${npcName}: 也还行`,
                                        `${userName}: 上次的东西还在你那\n${npcName}: 嗯 你什么时候来拿\n${userName}: 有空再说吧`,
                                    ];
                                    return options[Math.floor(Math.random() * options.length)];
                                } else {
                                    const options = [
                                        `${npcName}: 在吗\n${userName}: 在 怎么了\n${npcName}: 想问你个事`,
                                        `${userName}: 上次说的那个事怎么样了\n${npcName}: 还在办 等我消息\n${userName}: 好的 辛苦了`,
                                    ];
                                    return options[Math.floor(Math.random() * options.length)];
                                }
                            }
                        };
                        const _mockChat = _npcChatSnippets._generate();
                        
                        // 类型1: 与NPC的聊天记录（附带模拟对话片段）
                        _npcTypes.push({
                            app: '微信',
                            icon: 'fa-weixin',
                            action: `翻看与"${npcName}"的聊天记录`,
                            detail: npcIdentity ? `(${npcIdentity})` : '',
                            fullData: {
                                type: 'npc_chat',
                                contactName: npcName,
                                npcIdentity: npcIdentity,
                                npcRelation: npcRelation,
                                npcPersona: npcPersona,
                                chatContext: _mockChat,
                                content: `与${npcName}${npcIdentity ? '(' + npcIdentity + ')' : ''}的微信聊天`
                            }
                        });
                        
                        // 类型2: NPC的通话记录
                        const _callMins = Math.floor(Math.random() * 10) + 1;
                        const _callSecs = Math.floor(Math.random() * 60);
                        const _hoursAgo = Math.floor(Math.random() * 48) + 1;
                        _npcTypes.push({
                            app: '通话记录',
                            icon: 'fa-phone',
                            action: `查看通话记录`,
                            detail: `"${npcName}" 通话${_callMins}分${_callSecs}秒（${_hoursAgo}小时前）`,
                            fullData: {
                                type: 'npc_call',
                                contactName: npcName,
                                npcIdentity: npcIdentity,
                                npcRelation: npcRelation,
                                npcPersona: npcPersona,
                                content: `与${npcName}的通话记录，时长${_callMins}分${_callSecs}秒`,
                                detail: `"${npcName}" 通话${_callMins}分${_callSecs}秒（${_hoursAgo}小时前）`
                            }
                        });
                        
                        // 类型3: 备忘录/便签中提到NPC（附带具体内容）
                        const _memoSnippets = [
                            `和${npcName}约好周末见面`,
                            `${npcName}的生日快到了，准备礼物`,
                            `记得回复${npcName}的消息`,
                            `${npcName}推荐的那家店，找时间去`,
                            `欠${npcName}一顿饭`,
                        ];
                        const _memoContent = _memoSnippets[Math.floor(Math.random() * _memoSnippets.length)];
                        _npcTypes.push({
                            app: '备忘录',
                            icon: 'fa-sticky-note',
                            action: `翻看备忘录`,
                            detail: `看到一条关于"${npcName}"的备忘`,
                            fullData: {
                                type: 'npc_memo',
                                contactName: npcName,
                                npcIdentity: npcIdentity,
                                npcRelation: npcRelation,
                                npcPersona: npcPersona,
                                memoContent: _memoContent,
                                content: `备忘录中写着：${_memoContent}`
                            }
                        });
                        
                        // 随机选1-2种类型加入
                        const _selectedTypes = _npcTypes.sort(() => Math.random() - 0.5).slice(0, Math.random() > 0.5 ? 2 : 1);
                        realDataItems.push(..._selectedTypes);
                    });
                }
            } catch(_npcErr) {
                console.warn('[关系网查手机] NPC数据生成失败:', _npcErr);
            }
            
            // 打乱顺序，更真实（但把微信放在前面）
            const wechatItems = realDataItems.filter(i => i.app === '微信' || i.app === '微信朋友圈');
            const otherItems = realDataItems.filter(i => i.app !== '微信' && i.app !== '微信朋友圈');
            // Fisher-Yates 打乱非微信部分
            for (let i = otherItems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [otherItems[i], otherItems[j]] = [otherItems[j], otherItems[i]];
            }
            const shuffledItems = [...wechatItems, ...otherItems];
            
            // 如果没有真实数据，添加默认项
            if (shuffledItems.length === 0) {
                shuffledItems.push(
                    { app: '微信', icon: 'fa-weixin', action: '查看聊天记录', detail: '暂无聊天记录', fullData: { type: 'empty' } },
                    { app: '手机相册', icon: 'fa-images', action: '浏览照片', detail: '相册为空', fullData: { type: 'empty' } }
                );
            }
            
            // 用 shuffledItems 替代 realDataItems
            const finalItems = shuffledItems;
            
            let step = 0;
            
            // [FIX-太快] 改用递归setTimeout，等AI评论完成后再进入下一步
            async function processNextStep() {
                if (!reverseCheckState.active) return; // 已关闭
                if (step >= finalItems.length) {
                    finishReverseCheck();
                    return;
                }
                
                const item = finalItems[step];
                
                // 切换应用
                reverseCheckState.currentApp = item.app;
                updateCurrentApp({ name: item.app, icon: item.icon });
                addActivityLog('打开了 ' + item.app);
                
                // 查看内容（存完整对象，供后续生成总结用）
                addViewingItem(item);
                if (item.detail) {
                    addActivityLog(item.action + ': ' + item.detail);
                }
                
                // 70%概率联系人对真实内容做出评论，等评论完成再继续
                let commentDelay = 3500; // 默认等待时间（无评论时）
                if (Math.random() < 0.7 && item.fullData && item.fullData.type !== 'empty') {
                    try {
                        await generateContactCommentOnRealData(item);
                        commentDelay = 2500; // 评论已显示，再等一会让用户看清
                    } catch(e) {
                        console.error('[反向查岗] 评论生成失败:', e);
                    }
                }
                
                step++;
                // 等待后再处理下一步
                reverseCheckState._stepTimer = setTimeout(processNextStep, commentDelay);
            }
            
            // 启动第一步
            reverseCheckState._stepTimer = setTimeout(processNextStep, 1500);
        }
        
        // 联系人在查岗过程中对内容做出反问
        async function generateContactQuestion(appName, item) {
            const contact = store.contacts.find(c => c.id === reverseCheckState.contactId);
            if (!contact) return;
            
            const userName = getUserPersonaName(contact, store.user.name || '用户');
            
            // 构建提示词
            const prompt = `你是${contact.name}，正在查看${userName}的手机（这是${userName}的手机，不是你的）。你刚看到：在${appName}中${item}。

人设：${contact.persona || '普通朋友'}
⚠️ 你看到的所有内容（通讯录、备注、聊天记录）都属于${userName}，不是你（${contact.name}）的。

请根据你的性格，对看到的内容提出一个简短的问题或评论（1句话，不超过20字）。要自然、口语化。

例如：
- "这是谁啊？"
- "怎么这么多？"
- "有意思~"
- "嗯？"

直接输出问题或评论，不要其他内容。`;

            try {
                const question = await _rcApiCall(prompt, { temperature: 0.9, max_tokens: 50 });
                addContactQuestion(question);
            } catch (error) {
                console.error('生成联系人反问失败:', error);
            }
        }
        
        // 联系人对真实数据内容做出评论（支持所有App数据类型）
        async function generateContactCommentOnRealData(dataItem) {
            const contact = store.contacts.find(c => c.id === reverseCheckState.contactId);
            if (!contact) return;
            
            // [FIX] 使用联系人绑定的用户人设名，而不是全局store.user.name
            const userName = getUserPersonaName(contact, store.user.name || '用户');
            
            // 根据数据类型构建不同的提示词
            let dataContext = '';
            const data = dataItem.fullData;
            
            if (data.type === 'chat') {
                // [FIX-反向查岗-方向] 明确标注：这是手机主人(userName)和另一个人(contactName)的聊天
                // senderIsUser=true 表示手机主人发的，senderIsUser=false 表示对方发的
                // [FIX-反向查岗-上下文] 优先使用完整对话片段 chatContext，让AI理解整体话题
                if (data.chatContext) {
                    dataContext = `你在手机主人${userName}与另一个人"${data.contactName}"的微信聊天记录中，翻看到了以下对话片段：\n\n${data.chatContext}\n\n注意："${data.contactName}"不是你（${contact.name}），这是手机主人${userName}和"${data.contactName}"的对话。你要根据这整段对话的话题和氛围来做反应，而不是只看最后一句。`;
                } else {
                    const senderLabel = data.senderIsUser ? `手机主人${userName}` : `另一个人"${data.contactName}"`;
                    dataContext = `你在手机主人${userName}与另一个人"${data.contactName}"的微信聊天记录中，看到一条${senderLabel}发的消息："${data.message}"。注意："${data.contactName}"不是你（${contact.name}），这是手机主人和别人的聊天记录。`;
                }
            } else if (data.type === 'moment') {
                dataContext = `你看到${data.author || userName}发的朋友圈动态："${data.content}"`;
            } else if (data.type === 'contacts') {
                dataContext = `你翻看了${userName}的通讯录，里面有：${data.names}等联系人。这些都是${userName}手机里的其他联系人，不是你自己的备注。`;
            } else if (data.type === 'photos') {
                dataContext = `你看到${userName}的手机相册里存了${data.count}张照片`;
            } else if (data.type === 'mail') {
                if (data.isOwnLetter) {
                    // [FIX-反向查岗-信件识别] 这封信是查岗者自己写给用户的，查岗者应该认出来
                    dataContext = `你在${userName}的邮箱里看到一封信——这是你（${contact.name}）之前写给${userName}的信！主题是："${data.subject}"，内容大意：${data.body || '（内容看不完整）'}。你认出了这是自己写的信，看到${userName}保留着你写的信。`;
                } else {
                    const dir = data.isSent ? `${userName}写给${data.contactName}` : `${data.contactName}写给${userName}`;
                    dataContext = `你在邮箱里看到一封信（${dir}），主题是："${data.subject}"，内容大意：${data.body || '（内容看不完整）'}`;
                }
            } else if (data.type === 'shop_order') {
                dataContext = `你看到${userName}的购物订单记录，买了：${data.items || '商品'}，花了约¥${data.total || 0}`;
            } else if (data.type === 'shop_cart') {
                dataContext = `你看到${userName}的购物车里放着：${data.items}`;
            } else if (data.type === 'shop_fav') {
                dataContext = `你看到${userName}收藏了这些商品：${data.items}`;
            } else if (data.type === 'offline') {
                dataContext = `你看到${userName}和另一个人"${data.contactName}"线下见面的记录，其中有："${data.content}"。注意："${data.contactName}"不是你（${contact.name}）。`;
            } else if (data.type === 'npc_chat') {
                // [FIX-NPC回复上下文] 传入模拟聊天片段和NPC关系信息，让联系人评论更贴切
                const _npcDesc = data.npcIdentity ? `（${data.npcIdentity}）` : '';
                const _npcRel = data.npcRelation ? `，这个人是${userName}的${data.npcRelation}` : '';
                if (data.chatContext) {
                    dataContext = `你在${userName}的微信里翻到了TA和一个叫"${data.contactName}"${_npcDesc}的人的聊天记录${_npcRel}。聊天内容如下：\n\n${data.chatContext}\n\n你根据聊天内容和你对${userName}的了解做出反应。"${data.contactName}"不是你（${contact.name}）。`;
                } else {
                    dataContext = `你看到${userName}和一个叫"${data.contactName}"${_npcDesc}的人的微信聊天记录${_npcRel}。根据你对${userName}的了解和你们的关系，对这个发现做出反应。`;
                }
            } else if (data.type === 'npc_call') {
                const _npcDesc2 = data.npcIdentity ? `（${data.npcIdentity}）` : '';
                const _npcRel2 = data.npcRelation ? `，这个人是${userName}的${data.npcRelation}` : '';
                dataContext = `你看到${userName}的通话记录中有和"${data.contactName}"${_npcDesc2}的通话${_npcRel2}。${data.detail || ''}。根据你对${userName}的了解，对这个发现做出反应。`;
            } else if (data.type === 'npc_memo') {
                const _npcDesc3 = data.npcIdentity ? `（${data.npcIdentity}）` : '';
                const _npcRel3 = data.npcRelation ? `，这个人是${userName}的${data.npcRelation}` : '';
                const _memoDetail = data.memoContent ? `内容是："${data.memoContent}"` : '';
                dataContext = `你看到${userName}的备忘录里有关于"${data.contactName}"${_npcDesc3}的内容${_npcRel3}。${_memoDetail}。根据你对${userName}的了解，对这个发现做出反应。`;
            } else {
                dataContext = `你看到${userName}在${dataItem.app}中${dataItem.action}`;
            }
            
            // 获取联系人与用户的关系记忆（简短）
            let memoryContext = '';
            // [OPT] 查手机场景：读取记忆+关系网，让联系人的反应更贴合人物关系
            if (typeof buildContactGlobalMemory === 'function') {
                const rawMem = buildContactGlobalMemory(contact.id, { sections: ['memory', 'relation'] });
                if (rawMem) memoryContext = rawMem.substring(0, 150);
            }
            
            const prompt = `你是${contact.name}，正在查看${userName}的手机。这是${userName}的手机，不是你（${contact.name}）的手机。你完全沉浸在角色中，不是AI助手。

⚠️ 重要区分：
- 手机主人是${userName}（你认识的人）
- 你是${contact.name}（正在翻看手机的人）
- 你看到的通讯录、备注、聊天记录都属于${userName}，不是你的
- 如果看到聊天记录，发消息的人和收消息的人都要搞清楚是谁

你的人设：${contact.persona || '普通朋友'}
${memoryContext ? '你和' + userName + '的记忆：' + memoryContext : ''}

你刚刚在${dataItem.app}里看到：${dataContext}

根据你的性格和你们的关系，用一句话或两句话对看到的内容做出真实反应。可以是：好奇追问、吃醋、调侃、关心、惊讶、无语等。必须口语化，符合你的人设说话方式，不超过30字。

直接输出你说的话，不要加前缀标记。`;

            try {
                const comment = await _rcApiCall(prompt, { temperature: 0.9, max_tokens: 60 });
                addContactQuestion(comment.replace(/["""]/g, ''));
            } catch (error) {
                console.error('生成联系人评论失败:', error);
                const fallbackComments = ['嗯？', '有意思', '这是什么？', '让我看看...'];
                addContactQuestion(fallbackComments[Math.floor(Math.random() * fallbackComments.length)]);
            }
        }
        
        // 在监控窗口添加联系人反问气泡
        function addContactQuestion(question) {
            const viewingList = document.getElementById('rc-viewing-list');
            if (!viewingList) return;
            
            const contact = store.contacts.find(c => c.id === reverseCheckState.contactId);
            const contactName = contact ? contact.name : '联系人';
            
            const bubbleEl = document.createElement('div');
            bubbleEl.className = 'rc-question-bubble';
            bubbleEl.innerHTML = `
                <div class="rc-q-avatar">${contactName[0]}</div>
                <div style="flex:1;">${question}</div>
            `;
            
            viewingList.appendChild(bubbleEl);
            
            // 最多显示8条（包括查看项和反问）
            if (viewingList.children.length > 8) {
                viewingList.removeChild(viewingList.firstChild);
            }
            
            // 滚动到底部
            viewingList.scrollTop = viewingList.scrollHeight;
        }

        function updateCurrentApp(app) {
            const appIconEl = document.querySelector('.rc-app-icon');
            const appNameEl = document.querySelector('.rc-app-name');
            
            if (appIconEl && appNameEl) {
                appIconEl.innerHTML = `<i class="fab ${app.icon}"></i>`;
                appNameEl.textContent = app.name;
            }
        }

        function addViewingItem(item) {
            const viewingList = document.getElementById('rc-viewing-list');
            if (!viewingList) return;
            
            // item 现在是完整对象 { app, action, icon, detail, fullData }
            const displayText = typeof item === 'string' ? item : (item.action || '');
            const itemEl = document.createElement('div');
            itemEl.className = 'rc-viewing-item';
            itemEl.innerHTML = '<i class="fas fa-eye"></i> ' + displayText;
            
            viewingList.appendChild(itemEl);
            reverseCheckState.viewingItems.push(item);
            
            // 最多显示6条
            if (viewingList.children.length > 6) {
                viewingList.removeChild(viewingList.firstChild);
            }
            
            // 滚动到底部
            viewingList.scrollTop = viewingList.scrollHeight;
        }

        function addActivityLog(activity) {
            const logContent = document.getElementById('rc-log-content');
            if (!logContent) return;
            
            const now = new Date();
            const timeStr = now.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit', second: '2-digit'});
            
            const logItem = document.createElement('div');
            logItem.className = 'rc-log-item';
            logItem.innerHTML = `<span class="rc-log-time">${timeStr}</span>${activity}`;
            
            logContent.appendChild(logItem);
            reverseCheckState.activityLog.push({ time: timeStr, activity });
            
            // 自动滚动到底部
            logContent.scrollTop = logContent.scrollHeight;
        }

        async function finishReverseCheck() {
            addActivityLog('查岗完成，等待生成总结...');
            
            // 保存状态数据（closeReverseCheckMonitor 会重置）
            const savedContactId = reverseCheckState.contactId;
            const savedContactName = reverseCheckState.contactName;
            const savedActivityLog = [...(reverseCheckState.activityLog || [])];
            const savedViewingItems = [...(reverseCheckState.viewingItems || [])];
            
            // 更新标题显示"查岗完成"
            const titleEl = document.getElementById('rc-monitor-contact-name');
            if (titleEl) titleEl.textContent = savedContactName + ' - 查看完毕';
            
            // 不自动关闭，让用户手动关闭监控窗口以便回看内容
            // 先生成总结消息
            reverseCheckState.contactId = savedContactId;
            reverseCheckState.contactName = savedContactName;
            reverseCheckState.activityLog = savedActivityLog;
            reverseCheckState.viewingItems = savedViewingItems;
            
            generateReverseCheckQuestions();
        }

        async function generateReverseCheckQuestions() {
            const contact = store.contacts.find(c => c.id === reverseCheckState.contactId);
            if (!contact) return;
            
            // [FIX] 用联系人绑定的用户人设名
            const userName = getUserPersonaName(contact, store.user.name || '用户');
            
            // 构建查岗记录摘要（去重，保留有意义的日志）
            const uniqueLogs = [...new Set(reverseCheckState.activityLog.map(log => log.activity))];
            const logSummary = uniqueLogs.join('\n- ');

            // [FIX-反向查岗-上下文] 从 viewingItems 中提取真实对话片段，让AI掌握具体话题
            let chatSnippets = '';
            const seenContacts = new Set();
            (reverseCheckState.viewingItems || []).forEach(item => {
                const fd = item && item.fullData;
                if (!fd) return;
                if (fd.type === 'chat' && fd.chatContext && !seenContacts.has(fd.chatWithContactId)) {
                    seenContacts.add(fd.chatWithContactId);
                    chatSnippets += `\n【${userName} 与 "${fd.contactName}" 的聊天片段】\n${fd.chatContext}\n`;
                } else if (fd.type === 'moment' && fd.content) {
                    chatSnippets += `\n【看到的朋友圈】${fd.author || userName}：${fd.content}\n`;
                } else if (fd.type === 'offline' && fd.content) {
                    chatSnippets += `\n【${userName} 与 "${fd.contactName}" 线下记录】${fd.content}\n`;
                } else if (fd.type === 'mail' && fd.subject) {
                    if (fd.isOwnLetter) {
                        // [FIX-反向查岗-信件识别] 查岗者认出这是自己写的信
                        chatSnippets += `\n【你自己写给${userName}的信】主题：${fd.subject}；内容：${fd.body || ''}（你认出了这是自己写的信，${userName}一直保留着）\n`;
                    } else {
                        const dir = fd.isSent ? `${userName}写给${fd.contactName}` : `${fd.contactName}写给${userName}`;
                        chatSnippets += `\n【邮件 ${dir}】主题：${fd.subject}；内容：${fd.body || ''}\n`;
                    }
                }
            });
            // 防止提示词过长
            if (chatSnippets.length > 2500) chatSnippets = chatSnippets.substring(0, 2500) + '\n...(后续省略)';

            // 构建提示词（强制角色扮演，不能说自己是AI）
            const prompt = `你是${contact.name}，刚刚帮${userName}把手机从头到尾翻了一遍。你完全是真实的人，不是AI，不能提及自己是助手或语言模型。

你的人设：${contact.persona || '普通朋友'}

你刚才看到的内容概览：
- ${logSummary}
${chatSnippets ? '\n你记得看到过的具体对话/内容：' + chatSnippets : ''}

⚠️ 注意：上述聊天片段里的"${userName}"就是手机主人本人，其他名字都是${userName}的其他联系人，不是你。你要针对看到的"具体话题"做出反应，而不是泛泛而谈。
⚠️ 如果你看到了自己写给${userName}的信，你应该认出那是你自己写的，可以感慨、害羞、或追问${userName}为什么还留着。

现在你把手机还给${userName}了，根据你看到的具体内容，以${contact.name}的口吻自然地发2-3条消息回应。要求：
1. 完全符合你的性格人设，说话方式要自然口语化
2. 可以是追问、调侃、吃醋、关心、害羞等各种真实情绪反应
3. 必须针对看到的具体话题/人名/事件来说话，让${userName}一看就知道你查到了什么
4. 如果看到了自己写的信，要表现出认出来的反应（感动、害羞、追问等）
5. 每条消息独立成一行（用换行分隔）
6. 不要编号，直接输出消息内容
7. 像真实的人查完手机后发微信那样说话

直接输出消息，不要任何多余标记。`;

            try {
                const questions = await _rcApiCall(prompt, { temperature: 0.8, max_tokens: 300 });
                const questionLines = questions.split('\n').filter(q => q.trim());
                
                for (let i = 0; i < questionLines.length; i++) {
                    setTimeout(() => {
                        const questionMsg = {
                            id: Date.now() + i,
                            sender: 'ai',
                            content: questionLines[i].trim(),
                            time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
                        };
                        
                        if (!store.chats[reverseCheckState.contactId]) store.chats[reverseCheckState.contactId] = [];
                        store.chats[reverseCheckState.contactId].push(questionMsg);
                        renderHistory();
                        save();
                    }, i * 1500);
                }
            } catch (error) {
                console.error('生成查岗问题失败:', error);
                const defaultQuestion = {
                    id: Date.now(),
                    sender: 'ai',
                    content: '看完了，有些东西需要你解释一下...',
                    time: new Date().toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
                };
                
                if (!store.chats[reverseCheckState.contactId]) store.chats[reverseCheckState.contactId] = [];
                store.chats[reverseCheckState.contactId].push(defaultQuestion);
                renderHistory();
                save();
            }
        }

        function closeReverseCheckMonitor() {
            const monitor = document.getElementById('reverse-check-monitor');
            
            // 清除所有定时器
            if (reverseCheckState.interval) {
                clearInterval(reverseCheckState.interval);
                reverseCheckState.interval = null;
            }
            if (reverseCheckState._stepTimer) {
                clearTimeout(reverseCheckState._stepTimer);
                reverseCheckState._stepTimer = null;
            }
            
            // [FIX-卡屏] 清空监控窗口内的动态内容，防止残留元素干扰
            if (monitor) {
                const viewingList = document.getElementById('rc-viewing-list');
                const logContent = document.getElementById('rc-log-content');
                if (viewingList) viewingList.innerHTML = '';
                if (logContent) logContent.innerHTML = '';
                
                // 隐藏监控窗口
                monitor.style.display = 'none';
                monitor.style.pointerEvents = 'none';
                monitor.style.visibility = 'hidden';
                monitor.style.zIndex = '-1';
            }
            
            // [FIX-卡屏] 重置所有状态
            reverseCheckState.active = false;
            reverseCheckState.activityLog = [];
            reverseCheckState.viewingItems = [];
            reverseCheckState.contactId = null;
            reverseCheckState.contactName = '';
            reverseCheckState.currentApp = '桌面';

            // [FIX-卡屏] 强制恢复UI，防止卡屏 - 使用多重策略确保恢复
            const forceRestore = () => {
                // 1. [FIX-按钮不可点击] 只隐藏反向查岗相关的弹窗，不影响其他modal
                // 旧代码使用 [id*="modal-"] 会匹配到 modal-confirm、modal-heart-edit 等所有弹窗
                // 导致后续显示这些弹窗时残留 pointerEvents:none/visibility:hidden/zIndex:-1
                const rcModals = document.querySelectorAll('#reverse-check-monitor, #modal-reverse-check-invite, #modal-reverse-check-request');
                rcModals.forEach(el => {
                    el.style.display = 'none';
                });
                
                // 2. [FIX-按钮不可点击] 清除所有modal上可能被之前版本代码设置的残留内联样式
                // 这修复了之前代码可能已经污染的modal元素
                const allModals = document.querySelectorAll('.modal-mask, [id*="modal-"]');
                allModals.forEach(el => {
                    // 只清除残留的阻断样式，不改变display（保持各modal自身的显示状态）
                    if (el.style.pointerEvents === 'none') el.style.pointerEvents = '';
                    if (el.style.visibility === 'hidden') el.style.visibility = '';
                    if (el.style.zIndex === '-1') el.style.zIndex = '';
                });
                
                // 3. 确保device容器可交互
                const device = document.getElementById('device');
                if (device) {
                    device.style.pointerEvents = '';
                    device.style.overflow = '';
                    device.style.position = '';
                }
                
                // 4. 恢复body和html的交互性
                document.body.style.overflow = '';
                document.body.style.pointerEvents = '';
                document.body.style.position = '';
                document.documentElement.style.overflow = '';
                document.documentElement.style.pointerEvents = '';
                
                // 5. 移除可能添加的全局事件阻止
                const layers = document.querySelectorAll('.layer');
                layers.forEach(layer => {
                    layer.style.pointerEvents = '';
                });
                
                // 6. 恢复聊天界面的输入栏和按钮交互
                const inputBar = document.getElementById('chat-input-bar');
                if (inputBar) {
                    inputBar.style.pointerEvents = '';
                    inputBar.style.visibility = '';
                    inputBar.style.zIndex = '';
                }
                const selectBar = document.getElementById('chat-select-bar');
                if (selectBar) {
                    selectBar.style.pointerEvents = '';
                    selectBar.style.visibility = '';
                    selectBar.style.zIndex = '';
                }
                
                // 7. 如果当前在聊天界面，重新渲染以确保界面正常
                if (typeof renderHistory === 'function' && activeChatId) {
                    try {
                        renderHistory(true);
                    } catch(e) {
                        console.error('renderHistory failed in closeReverseCheckMonitor:', e);
                    }
                }
                
                // 8. 强制重绘和重排
                document.body.offsetHeight;
            };
            
            // 立即执行一次
            forceRestore();
            
            // 使用 rAF 再执行一次确保生效
            requestAnimationFrame(() => {
                forceRestore();
                // 再延迟一次确保完全恢复
                setTimeout(() => {
                    forceRestore();
                    console.log('[反向查岗] 监控窗口已关闭，UI已恢复');
                }, 100);
            });
        };

        window.closeReverseCheckMonitor = closeReverseCheckMonitor;

        // 联系人随机发起查岗的触发机制（在AI回复后有5%概率触发）
        window.maybeContactInitiateReverseCheck = function(contactId) {
            // [FIX-查手机冒话] 全局开关：关闭后联系人不会随机发起查手机
            if (store.reverseCheckGlobalDisabled) return;
            
            const contact = store.contacts.find(c => c.id === contactId);
            if (!contact || !contact.settings) return;
            
            // 检查是否允许该联系人查岗
            if (contact.settings.allowReverseCheck === false) return;
            
            // 5%概率触发
            if (Math.random() < 0.05) {
                setTimeout(() => {
                    contactInitiateReverseCheck(contactId);
                }, 2000 + Math.random() * 3000); // 2-5秒后触发
            }
        };

        // [FIX-查手机冒话] 反向查岗全局开关 toggle 函数
        window.toggleReverseCheckGlobal = function() {
            store.reverseCheckGlobalDisabled = !store.reverseCheckGlobalDisabled;
            if (typeof save === 'function') save();
            _updateRCToggleUI();
            toast(store.reverseCheckGlobalDisabled ? '已关闭反向查岗（联系人不会再随机查手机）' : '已开启反向查岗', 'info');
        };

        // [FIX-查手机冒话] 更新开关UI状态
        function _updateRCToggleUI() {
            const track = document.getElementById('rc-toggle-track');
            const thumb = document.getElementById('rc-toggle-thumb');
            const label = document.getElementById('rc-toggle-label');
            if (!track || !thumb) return;
            const enabled = !store.reverseCheckGlobalDisabled;
            track.style.background = enabled ? '#07c160' : '#444';
            thumb.style.left = enabled ? '18px' : '2px';
            if (label) label.style.color = enabled ? '#07c160' : '#aaa';
        }

        // [FIX-查手机冒话] 页面加载时同步开关状态
        setTimeout(_updateRCToggleUI, 500);

        // [FIX-查手机冒话v2] 查手机评论开关：控制用户翻看联系人手机时联系人是否冒出评论气泡
        window.togglePhoneComment = function() {
            store.phoneCommentDisabled = !store.phoneCommentDisabled;
            if (typeof save === 'function') save();
            _updatePhoneCommentToggleUI();
            toast(store.phoneCommentDisabled ? '已关闭查手机评论（联系人不会再冒话）' : '已开启查手机评论', 'info');
        };

        function _updatePhoneCommentToggleUI() {
            const track = document.getElementById('cp-comment-track');
            const thumb = document.getElementById('cp-comment-thumb');
            const label = document.getElementById('cp-comment-label');
            if (!track || !thumb) return;
            const enabled = !store.phoneCommentDisabled;
            track.style.background = enabled ? '#07c160' : '#444';
            thumb.style.left = enabled ? '18px' : '2px';
            if (label) label.style.color = enabled ? '#07c160' : '#aaa';
        }

        setTimeout(_updatePhoneCommentToggleUI, 600);

        // ===== 可拖动回到底部按钮 =====
        (function initDraggableScrollButton() {
            const btn = document.getElementById('chat-scroll-bottom-btn');
            if (!btn) return;
            
            let isDragging = false;
            let startX, startY, startLeft, startTop;
            let hasMoved = false;
            
            function onStart(e) {
                const touch = e.touches ? e.touches[0] : e;
                startX = touch.clientX;
                startY = touch.clientY;
                
                const rect = btn.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;
                
                isDragging = true;
                hasMoved = false;
                btn.classList.add('dragging');
                
                e.preventDefault();
            }
            
            function onMove(e) {
                if (!isDragging) return;
                
                const touch = e.touches ? e.touches[0] : e;
                const deltaX = touch.clientX - startX;
                const deltaY = touch.clientY - startY;
                
                // 判断是否移动超过阈值
                if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                    hasMoved = true;
                }
                
                let newLeft = startLeft + deltaX;
                let newTop = startTop + deltaY;
                
                // 限制在可视区域内
                const chatHistory = document.getElementById('chat-history');
                if (chatHistory) {
                    const chatRect = chatHistory.getBoundingClientRect();
                    const btnWidth = btn.offsetWidth;
                    const btnHeight = btn.offsetHeight;
                    
                    newLeft = Math.max(chatRect.left + 10, Math.min(newLeft, chatRect.right - btnWidth - 10));
                    newTop = Math.max(chatRect.top + 10, Math.min(newTop, chatRect.bottom - btnHeight - 10));
                }
                
                btn.style.left = newLeft + 'px';
                btn.style.top = newTop + 'px';
                btn.style.right = 'auto';
                btn.style.bottom = 'auto';
                
                e.preventDefault();
            }
            
            function onEnd(e) {
                if (!isDragging) return;
                
                isDragging = false;
                btn.classList.remove('dragging');
                
                // 如果没有移动，则触发点击事件
                if (!hasMoved) {
                    scrollChatToBottom();
                }
                
                e.preventDefault();
            }
            
            // 添加事件监听
            btn.addEventListener('mousedown', onStart);
            btn.addEventListener('touchstart', onStart, { passive: false });
            
            document.addEventListener('mousemove', onMove);
            document.addEventListener('touchmove', onMove, { passive: false });
            
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchend', onEnd);
        })();

