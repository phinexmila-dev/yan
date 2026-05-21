
        function renderSpacetimeModule(area, space) {
            if (!space) { coupleViewMode = 'detail'; renderCouple(); return; }
            
            // Init memories in space
            if (!space.spacetimeMemories) space.spacetimeMemories = [];

            const partner = store.contacts.find(x => x.id === space.partnerId);
            const partnerName = partner ? partner.name : 'TA';

            if (spacetimeState.active) {
                renderSpacetimeActiveScene(area, space, partnerName);
            } else {
                // [改] 不再自动生成，只显示空白+手动生成按钮，用户需手动点击才触发生成
                // if (generatedSpacetimeEras.length === 0 && !isGeneratingEras && !eraGenerationFailed) {
                //     generateSpacetimeEras(space);
                // }
                renderSpacetimeHomeDynamic(area, space, partnerName);
            }
        }

        function renderSpacetimeHome(area, space, partnerName) {
            const memories = space.spacetimeMemories || [];
            let html = `
                <div class="nav-bar">
                    <div class="nav-icon" onclick="coupleViewMode='detail';renderCouple()"><i class="fas fa-chevron-left"></i></div>
                    <div class="nav-title">时空系统</div>
                    <div style="position:relative;">
                        <div class="nav-icon" onclick="toggleSTMoreMenu(event)" title="更多"><i class="fas fa-ellipsis-v"></i></div>
                        <div class="st-more-menu" id="st-more-menu" style="display:none;">
                            <div class="st-more-menu-item" onclick="openSpacetimeMemories();closeSTMoreMenu()"><i class="fas fa-history"></i><span>历史</span></div>
                            <div class="st-more-menu-item" onclick="openSpacetimeMemories();closeSTMoreMenu()"><i class="fas fa-book-open"></i><span>回顾</span></div>
                            <div class="st-more-menu-item" onclick="openSTFontSettings();closeSTMoreMenu()"><i class="fas fa-font"></i><span>穿越对话字体</span></div>
                            <div class="st-more-menu-item" onclick="openSpacetimeSettings();closeSTMoreMenu()"><i class="fas fa-cog"></i><span>时空设置</span></div>
                        </div>
                    </div>
                </div>
                <div class="scroll-y st-home-scroll" style="background: #ffffff; padding:0; color:${spacetimeSettings.homeFontColor || '#1a1a1a'}; font-size:${spacetimeSettings.fontSize || 14}px; min-height: calc(100% - 44px);">
                    <div class="st-hero">
                        <div class="st-hero-particles"></div>
                        <div class="st-hero-icon"><i class="fas fa-hourglass-half"></i></div>
                        <div class="st-hero-title">选择穿越目的地</div>
                        <div class="st-hero-sub">与 ${partnerName} 一起穿越时空</div>
                    </div>

                    <!-- 相知时间点 -->
                    <div class="st-category-header">
                        <div class="st-category-icon">${currentSpacetimeEras.xiangzhi.icon}</div>
                        <div class="st-category-info">
                            <div class="st-category-title">${currentSpacetimeEras.xiangzhi.title}</div>
                            <div class="st-category-subtitle">${currentSpacetimeEras.xiangzhi.subtitle}</div>
                        </div>
                    </div>
                    <div class="st-era-grid">
                        ${currentSpacetimeEras.xiangzhi.eras.map(era => `
                            <div class="st-era-card st-era-card-reality" onclick="showSpacetimeTravelModeChoice('${era.id}')">
                                <div class="st-era-icon">${era.icon}</div>
                                <div class="st-era-info">
                                    <div class="st-era-name">${era.name}</div>
                                    <div class="st-era-year"><i class="fas fa-clock" style="margin-right:4px;font-size:11px;opacity:0.7;"></i>${era.year}</div>
                                    <div class="st-era-desc"><i class="fas fa-user" style="margin-right:4px;font-size:11px;opacity:0.7;"></i>${era.contactAge || ''}</div>
                                </div>
                                <i class="fas fa-chevron-right st-era-arrow" style="opacity:0.3;"></i>
                            </div>
                        `).join('')}
                    </div>

                    <!-- IF线分割 -->
                    <div class="st-category-divider">
                        <div class="st-divider-line"></div>
                        <div class="st-divider-text">或者</div>
                        <div class="st-divider-line"></div>
                    </div>

                    <!-- IF线 -->
                    <div class="st-category-header st-category-header-if">
                        <div class="st-category-icon">${currentSpacetimeEras.ifline.icon}</div>
                        <div class="st-category-info">
                            <div class="st-category-title">${currentSpacetimeEras.ifline.title}</div>
                            <div class="st-category-subtitle">${currentSpacetimeEras.ifline.subtitle}</div>
                        </div>
                    </div>
                    <div class="st-era-grid">
                        ${currentSpacetimeEras.ifline.eras.map(era => `
                            <div class="st-era-card st-era-card-if" onclick="showSpacetimeTravelModeChoice('${era.id}')">
                                <div class="st-era-icon">${era.icon}</div>
                                <div class="st-era-info">
                                    <div class="st-era-name">${era.name}</div>
                                    <div class="st-era-year"><i class="fas fa-clock" style="margin-right:4px;font-size:11px;opacity:0.7;"></i>${era.year}</div>
                                    <div class="st-era-desc"><i class="fas fa-user" style="margin-right:4px;font-size:11px;opacity:0.7;"></i>${era.contactAge || ''}</div>
                                </div>
                                <i class="fas fa-chevron-right st-era-arrow" style="opacity:0.3;"></i>
                            </div>
                        `).join('')}
                        <div class="st-era-card st-era-card-if" onclick="openCustomEraModal()">
                            <div class="st-era-icon">✨</div>
                            <div class="st-era-info">
                                <div class="st-era-name">自定义时空</div>
                                <div class="st-era-year">???</div>
                                <div class="st-era-desc">创建你自己的穿越目的地</div>
                            </div>
                            <i class="fas fa-chevron-right st-era-arrow" style="opacity:0.3;"></i>
                        </div>
                    </div>

                    <div style="text-align:center; margin:20px 0;">
                        <button class="st-status-btn" onclick="randomizeSpacetimeEras();renderCouple();" style="padding:10px 24px; border:1px solid currentColor; background:transparent; color:inherit; opacity:0.7; border-radius:20px; font-size:13px; cursor:pointer;"><i class="fas fa-sync-alt" style="margin-right:6px;"></i>换一批</button>
                    </div>

                    ${memories.length > 0 ? `
                        <div class="st-section-title"><i class="fas fa-book-open"></i> 穿越记忆 (${memories.length})</div>
                        <div class="st-memories-preview">
                            ${memories.slice(-3).reverse().map((m, i) => `
                                <div class="st-memory-chip" onclick="openSpacetimeMemories()">
                                    <span class="st-memory-era">${m.eraName}</span>
                                    <span class="st-memory-summary">${m.summary.substring(0, 30)}...</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
            area.innerHTML = html;
        }

        function renderSpacetimeActiveScene(area, space, partnerName) {
            const st = spacetimeState;
            const hoursLeft = Math.max(0, Math.floor((st.maxMinutes - st.elapsedMinutes) / 60));
            const minsLeft = Math.max(0, (st.maxMinutes - st.elapsedMinutes) % 60);
            const progressPct = Math.min(100, (st.elapsedMinutes / st.maxMinutes) * 100);

            let html = `
                <div class="nav-bar st-active-nav" style="background: #ffffff; border-bottom: 1px solid #e0e0e0;">
                    <div class="nav-icon" onclick="confirmExitSpacetime()" style="color:#333;"><i class="fas fa-chevron-left"></i></div>
                    <div class="nav-title" style="color:#1a1a1a;">${st.era.name}</div>
                    <div style="display:flex;align-items:center;">
                        <div class="nav-icon" onclick="showSpacetimeTaskPanel()" style="margin-right:2px;" title="查看任务">
                            <i class="fas fa-tasks" style="color:#666666;"></i>
                            <span id="st-task-mini-countdown" style="font-size:9px;color:#999;position:absolute;bottom:2px;right:0;"></span>
                        </div>
                        <div style="position:relative;">
                        <div class="nav-icon" onclick="toggleSTMoreMenu(event)" title="更多"><i class="fas fa-ellipsis-v" style="color:#666666;"></i></div>
                        <div class="st-more-menu" id="st-more-menu" style="display:none;">
                            <div class="st-more-menu-item" onclick="openSTFontSettings();closeSTMoreMenu()"><i class="fas fa-font"></i><span>穿越对话字体</span></div>
                            <div class="st-more-menu-item" onclick="openSpacetimeSettings();closeSTMoreMenu()"><i class="fas fa-cog"></i><span>时空设置</span></div>
                            <div class="st-more-menu-item" onclick="forceReturnSpacetime();closeSTMoreMenu()" style="color:#cc0000;"><i class="fas fa-undo"></i><span>强制返回</span></div>
                        </div>
                        </div>
                    </div>
                </div>
                <div class="scroll-y st-scene-container" id="st-scene-container">
                    <div class="st-time-bar">
                        <div class="st-time-info">
                            <span><i class="fas fa-clock"></i> 剩余 ${hoursLeft}h ${minsLeft}m</span>
                            <span class="st-era-badge">${st.era.icon} ${st.era.year}</span>
                        </div>
                        <div class="st-progress-track">
                            <div class="st-progress-fill" style="width:${progressPct}%"></div>
                        </div>
                    </div>
                    
                    <div class="st-dialog-area" id="st-dialog-area">
                        ${st.dialogHistory.map((d, i) => `
                            <div class="st-dialog-item ${d.role}">
                                ${d.role === 'narrator' ? `
                                    <div class="st-narrator-box">
                                        <div class="st-msg-actions">
                                            <span class="st-msg-action-btn" onclick="stMsgAction('regenerate',${i})" title="重回"><i class="fas fa-redo-alt"></i></span>
                                            <span class="st-msg-action-btn" onclick="stMsgAction('recall',${i})" title="撤回"><i class="fas fa-undo-alt"></i></span>
                                            <span class="st-msg-action-btn" onclick="stMsgAction('edit',${i})" title="修改"><i class="fas fa-edit"></i></span>
                                            <span class="st-msg-action-btn" onclick="stMsgAction('expand',${i})" title="扩写"><i class="fas fa-expand-alt"></i></span>
                                        </div>
                                        ${d.text}
                                    </div>
                                ` : d.role === 'partner' ? `
                                    <div class="st-partner-msg">
                                        <div class="st-partner-name">${partnerName}</div>
                                        <div class="st-partner-bubble">
                                            <div class="st-msg-actions">
                                                <span class="st-msg-action-btn" onclick="stMsgAction('regenerate',${i})" title="重回"><i class="fas fa-redo-alt"></i></span>
                                                <span class="st-msg-action-btn" onclick="stMsgAction('recall',${i})" title="撤回"><i class="fas fa-undo-alt"></i></span>
                                                <span class="st-msg-action-btn" onclick="stMsgAction('edit',${i})" title="修改"><i class="fas fa-edit"></i></span>
                                                <span class="st-msg-action-btn" onclick="stMsgAction('expand',${i})" title="扩写"><i class="fas fa-expand-alt"></i></span>
                                            </div>
                                            ${d.text}
                                        </div>
                                    </div>
                                ` : d.role === 'user' ? `
                                    <div class="st-user-msg">
                                        <div class="st-user-bubble">
                                            <div class="st-msg-actions">
                                                <span class="st-msg-action-btn" onclick="stMsgAction('regenerate',${i})" title="重回"><i class="fas fa-redo-alt"></i></span>
                                                <span class="st-msg-action-btn" onclick="stMsgAction('recall',${i})" title="撤回"><i class="fas fa-undo-alt"></i></span>
                                                <span class="st-msg-action-btn" onclick="stMsgAction('edit',${i})" title="修改"><i class="fas fa-edit"></i></span>
                                                <span class="st-msg-action-btn" onclick="stMsgAction('expand',${i})" title="扩写"><i class="fas fa-expand-alt"></i></span>
                                            </div>
                                            ${d.text}
                                        </div>
                                    </div>
                                ` : d.role === 'system' ? `
                                    <div class="st-system-msg">${d.text}</div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>

                    ${st.generating ? `
                        <div class="st-generating">
                            <div class="st-gen-dots"><span></span><span></span><span></span></div>
                            <span>时空波动中...</span>
                        </div>
                    ` : ''}
                </div>
                
                <div id="st-smart-reply-bar" class="smart-reply-bar st-smart-reply-bar" style="display:none;">
                    <div class="smart-reply-list" id="st-smart-reply-list"></div>
                    <button class="smart-reply-refresh" id="st-smart-reply-refresh" onclick="refreshStSmartReplies()" title="换一批">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div class="st-input-bar" id="st-input-bar">
                    <div class="st-action-btns" id="st-action-btns">
                        <button class="st-action-btn" onclick="spacetimeChooseAction('explore')"><i class="fas fa-compass"></i> 探索</button>
                        <button class="st-action-btn" onclick="spacetimeChooseAction('talk')"><i class="fas fa-comment-dots"></i> 对话</button>
                        <button class="st-action-btn" onclick="spacetimeChooseAction('interact')"><i class="fas fa-hand-pointer"></i> 互动</button>
                        <button class="st-action-btn" onclick="openSpacetimeCustomAction()"><i class="fas fa-pen"></i> 自由</button>
                    </div>
                    <div class="st-custom-input" id="st-custom-input" style="display:none;width:100%;box-sizing:border-box;overflow:hidden;">
                        <input type="text" id="st-custom-text" placeholder="输入你想做的事..." class="st-text-input" style="min-width:0;width:0;box-sizing:border-box;">
                        <button class="st-send-btn" style="flex-shrink:0;" onclick="sendSpacetimeCustomAction()"><i class="fas fa-paper-plane"></i></button>
                        <button class="st-cancel-btn" style="flex-shrink:0;" onclick="closeSpacetimeCustomAction()"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            `;
            area.innerHTML = html;
            // [FIX-输入框飞天v3] 将area设为flex列布局，让input-bar自然贴底
            area.style.display = 'flex';
            area.style.flexDirection = 'column';
            area.style.height = '100%';
            area.style.overflow = 'hidden';

            // Scroll to bottom of the scrollable scene container (not the dialog area itself)
            setTimeout(() => {
                const container = document.getElementById('st-scene-container');
                if (container) container.scrollTop = container.scrollHeight;
            }, 100);

            // [FIX-输入框上弹白屏] 使用 visualViewport API 适配移动端虚拟键盘
            _stBindKeyboardAdapter();
        }

        // [FIX-输入框飞天v3] 时空系统键盘适配器 - 纯flex布局，不使用visualViewport
        // 输入框已改为flex布局定位(非fixed)，无需JS动态计算bottom
        var _stKeyboardAdapterBound = false;
        function _stBindKeyboardAdapter() {
            if (_stKeyboardAdapterBound) return;
            _stKeyboardAdapterBound = true;

            var textInput = document.getElementById('st-custom-text');
            if (textInput) {
                textInput.addEventListener('focus', function() {
                    // 键盘弹出后滚动场景容器到底部，并确保输入框可见
                    setTimeout(function() {
                        var sceneContainer = document.getElementById('st-scene-container');
                        if (sceneContainer) {
                            sceneContainer.scrollTop = sceneContainer.scrollHeight;
                        }
                        var inputBar = document.getElementById('st-input-bar');
                        if (inputBar) {
                            inputBar.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        }
                    }, 300);
                });
            }
        }
        function _stUnbindKeyboardAdapter() {
            _stKeyboardAdapterBound = false;
        }

        function openCustomEraModal() {
            showPromptModal('输入时空名称（如：三国时代）:', '').then(function(name) {
                if (!name) return;
                showPromptModal('输入年代（如：公元220年）:', '').then(function(year) {
                    year = year || '未知年代';
                    showPromptModal('输入场景描述（如：许都城外，乱世风云）:', '').then(function(desc) {
                        desc = desc || '自定义的时空旅程';
                        const customEra = { id: 'custom_' + Date.now(), name, year, desc, icon: '✨' };
                        showSpacetimeTravelModeChoice(null, customEra);
                    });
                });
            });
        }

        // 穿越模式选择（单人/双人）
        let spacetimeTravelMode = 'duo'; // 'solo' or 'duo'

        function showSpacetimeTravelModeChoice(eraId, customEra) {
            const space = getCurrentCoupleSpace();
            if (!space) return toast('请先进入情侣空间');
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return toast('找不到伴侣联系人');

            const modalHtml = `
                <div class="modal-mask" id="modal-st-travel-mode" style="display:flex;">
                    <div class="modal-box">
                        <h3 style="text-align:center; margin-bottom:20px;"><i class="fas fa-users" style="margin-right:8px;"></i>选择穿越方式</h3>
                        <div class="mode-choice-card" onclick="spacetimeTravelMode='duo';document.getElementById('modal-st-travel-mode').remove();doStartSpacetimeTravel('${eraId || ''}', ${customEra ? 'true' : 'false'});">
                            <div class="mode-icon"><i class="fas fa-user-friends"></i></div>
                            <div>
                                <div style="font-weight:bold; font-size:16px;">双人穿越</div>
                                <div style="font-size:12px; color:#888; margin-top:4px;">与 ${partner.name} 一起穿越时空</div>
                            </div>
                        </div>
                        <div class="mode-choice-card" onclick="spacetimeTravelMode='solo';document.getElementById('modal-st-travel-mode').remove();doStartSpacetimeTravel('${eraId || ''}', ${customEra ? 'true' : 'false'});">
                            <div class="mode-icon"><i class="fas fa-user"></i></div>
                            <div>
                                <div style="font-weight:bold; font-size:16px;">单人穿越</div>
                                <div style="font-size:12px; color:#888; margin-top:4px;">独自一人探索时空</div>
                            </div>
                        </div>
                        <div style="text-align:center; margin-top:15px; color:#999;" onclick="document.getElementById('modal-st-travel-mode').remove()">取消</div>
                    </div>
                </div>
            `;
            // Store customEra temporarily if needed
            if (customEra) window._tempCustomEra = customEra;
            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
        }

        function doStartSpacetimeTravel(eraId, isCustom) {
            const customEra = (isCustom === true || isCustom === 'true') ? window._tempCustomEra : null;
            window._tempCustomEra = null;
            startSpacetimeTravel(eraId || null, customEra);
        }

        async function startSpacetimeTravel(eraId, customEra = null) {
            const space = getCurrentCoupleSpace();
            if (!space) return toast('请先进入情侣空间');

            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return toast('找不到伴侣联系人');

            const era = customEra || generatedSpacetimeEras.find(e => e.id === eraId);
            if (!era) return toast('找不到该时空场景');

            // Get worldbook context for persona compliance
            let stWorldBook = '';
            if (partner.settings?.mountedWbIds && Array.isArray(partner.settings.mountedWbIds)) {
                const mountedBooks = (store.worldbooks || []).filter(wb => partner.settings.mountedWbIds.includes(wb.id));
                if (mountedBooks.length > 0) stWorldBook = mountedBooks.map(wb => wb.content).join('\n');
            }

            const isSolo = spacetimeTravelMode === 'solo';
            const styleGuide = getSpacetimeStyleGuide();
            const langGuide = getEraLanguageGuide(era);
            const userName = getUserPersonaName(partner, '旅行者');
            const userPersona = store.personas.find(p => p.id === partner.settings?.userPersona) || store.personas[0];
            const userPersonaDesc = userPersona?.desc || '';

            // Init state
            spacetimeState.active = true;
            spacetimeState.era = era;
            spacetimeState.elapsedMinutes = 0;
            spacetimeState.dialogHistory = [];
            spacetimeState.generating = true;
            spacetimeState.soloMode = isSolo;

            // Render loading state
            renderCouple();

            // Generate opening scene
            try {
                const sysPrompt = `你是一个沉浸式时空穿越小说的叙述者。

背景设定：
- 时空：${era.name}（${era.year}）
- 场景：${era.desc}
${isSolo ? `- 穿越者：${userName}（独自穿越）
- 用户人设：${userPersonaDesc || '无特定人设'}` : `- 两人当前关系：${era.relation || '未知'}
- 角色1（用户）：${userName}
- 用户人设：${userPersonaDesc || '无特定人设'}
- 角色2（伴侣）：${partner.name}
- 伴侣人设：${partner.persona || ''}
- 伴侣在此时空的状态：${era.contactAge || ''}`}
- 世界观补充：${stWorldBook || '无'}
${styleGuide}

【严格规则 - 必须遵守】：
1. ${isSolo ? '以环境描写、NPC行为、事件发展为主，减少对用户行为的直接描写' : `${partner.name}的所有言行必须完全符合其人设和性格特征，禁止OOC`}
2. 禁止出现任何婚礼、结婚、求婚场景或暗示
3. 禁止出现任何孩子、怀孕、生育场景或暗示
4. ${isSolo ? '' : '两人的互动亲密程度必须符合当前的"关系状态"'}
5. 对话风格和用词必须符合角色的年龄和性格
6. 自由发挥创意，加入意外元素和随机事件
7. 必须严格根据用户人设中的性别/特征来描写用户角色，不得擅自更改用户的性别设定
8. 【极其重要 - 减少描写用户】不要过多描写用户的行为、动作、心理活动。应以${isSolo ? 'NPC的行为、环境描写、情景描写、故事线索' : `${partner.name}和其他NPC的行为、对话、表情、动作`}为主要描写对象。用户的行为由用户自己决定，你只需描写周围的世界和角色如何反应
${langGuide}

【节奏控制 - 极其重要】：
1. 开场白只是穿越的开始，不要一上来就安排大量剧情冲突
2. 先着重描写环境氛围、角色状态，让读者沉浸在场景中
3. 留下足够的探索空间和互动余地，不要把故事推进太快
4. 避免在开场就出现高潮情节，应该循序渐进

任务：生成穿越开场白（${spacetimeSettings.minWords}-${spacetimeSettings.maxWords}字）。
要求各方面描写均衡分配：
1. 环境与氛围描写（约占20%）：简洁的五感描写，点到为止，营造沉浸氛围，不要大段堆砌环境细节
2. ${isSolo ? 'NPC和角色对话' : '角色语言对话'}（约占40%）：${isSolo ? 'NPC的对话、环境中的声音、故事线索的展现' : `${partner.name}和NPC自然的对话互动，${partner.name}必须在场景中主动说话至少3-4句，体现其性格特征。对话要生动、有个性，可以是调侃、关心、好奇、撒娇、吐槽等各种语气`}
3. ${isSolo ? 'NPC和角色的' : '角色的'}心理与情感描写（约占15%）：${isSolo ? 'NPC的内心感受和情绪变化，而非用户的心理' : `${partner.name}和NPC的内心感受、想法、情绪变化`}
4. ${isSolo ? 'NPC和角色的' : '角色的'}动作行为描写（约占25%）：${isSolo ? 'NPC的动作和行为、事件的发展' : `${partner.name}和NPC的动作和互动，穿着、神态。${partner.name}要有丰富的肢体语言和表情变化`}
5. ${isSolo ? '以一个悬念或好奇的环境细节作为结尾' : `以${partner.name}的一句完全符合人设的、有情感张力的对话作为结尾（可以是疑问、感叹、调侃、温柔等）`}
⚠️ 【极其重要】不要替用户做决定！不要描写"你走上前去"、"你感到..."、"你说道..."等用户的行为。只描写char、NPC的行为和环境变化，让用户自己选择如何行动。
⚠️ 严禁环境描写喧宾夺主！对话必须是最核心的部分，不要连续大段描写环境。
${isSolo ? '' : `⚠️ 【极其重要】${partner.name}必须是一个活跃的、有血有肉的角色：
- 必须在SCENE中包含${partner.name}的多句对话（用「」或""包裹）
- ${partner.name}的语言要符合其人设性格，有情绪起伏，不能只是附和
- ${partner.name}要主动发起话题、提出疑问、表达感受、做出反应
- 对话中要体现${partner.name}的口癖、语气词、说话习惯等个性化特征
- PARTNER标签中写${partner.name}在场景最后的一句最有表现力的台词`}

格式要求：
[SCENE]综合场景描写（对话为核心，均衡穿插心理、动作、环境）[/SCENE]
${isSolo ? '' : `[PARTNER]${partner.name}最后说的一句有表现力的台词[/PARTNER]`}`;

                const data = await API.chatCompletion([
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: '开始穿越' }
                ], 0.95);

                const reply = data.choices[0].message.content;
                
                let sceneText = reply;
                let partnerText = '';
                
                const sceneMatch = reply.match(/\[SCENE\]([\s\S]*?)\[\/SCENE\]/);
                const partnerMatch = reply.match(/\[PARTNER\]([\s\S]*?)\[\/PARTNER\]/);
                
                if (sceneMatch) sceneText = sceneMatch[1].trim();
                if (partnerMatch) partnerText = partnerMatch[1].trim();
                
                // If parsing failed, use the whole thing as scene
                if (!sceneMatch && !partnerMatch) {
                    sceneText = reply;
                }

                spacetimeState.scene = sceneText;
                spacetimeState.dialogHistory.push({
                    role: 'system',
                    text: `⏳ 穿越至 ${era.name}（${era.year}）`,
                    time: 0
                });
                spacetimeState.dialogHistory.push({
                    role: 'narrator',
                    text: sceneText,
                    time: 0
                });
                if (partnerText) {
                    spacetimeState.dialogHistory.push({
                        role: 'partner',
                        text: partnerText,
                        time: 0
                    });
                }

                // Start time progression
                startSpacetimeTimer();

                // Initialize choice system
                spacetimeState.choiceCounter = 0;
                spacetimeState.choicesMade = [];
                spacetimeState.ending = null;

                // Generate tasks via AI based on era/persona context
                generateSpacetimeTasks(era, partner).then(() => {
                    setTimeout(() => {
                        showSpacetimeTaskModal();
                        startStTaskCountdown();
                    }, 600);
                });
                
            } catch(e) {
                console.error('Spacetime generation failed:', e);
                spacetimeState.dialogHistory.push({
                    role: 'system',
                    text: '时空波动异常...穿越失败：' + e.message,
                    time: 0
                });
            }

            spacetimeState.generating = false;
            renderCouple();
            // 初始穿越完成后生成推荐行动
            setTimeout(() => { if (typeof checkStSmartReply === 'function') checkStSmartReply(); }, 500);
        }

        function startSpacetimeTimer() {
            if (spacetimeState.timerInterval) clearInterval(spacetimeState.timerInterval);
            // 时间流逝速度：timeSpeed倍率控制，每个interval增加的故事分钟数
            // timeSpeed: 0.25=极慢(4秒1分钟), 0.5=慢(2秒1分钟), 1=正常(1秒1分钟), 2=快(1秒2分钟), 4=极快(1秒4分钟)
            const _timeSpeed = spacetimeSettings.timeSpeed || 1;
            const _intervalMs = _timeSpeed >= 1 ? 1000 : Math.round(1000 / _timeSpeed);
            const _minutesPerTick = _timeSpeed >= 1 ? Math.round(_timeSpeed) : 1;
            spacetimeState.timerInterval = setInterval(() => {
                spacetimeState.elapsedMinutes += _minutesPerTick;
                // Only force return when timer actually runs out, not prematurely
                if (spacetimeState.elapsedMinutes >= spacetimeState.maxMinutes) {
                    clearInterval(spacetimeState.timerInterval);
                    spacetimeState.timerInterval = null;
                    forceReturnSpacetime();
                } else {
                    // Update progress bar only
                    const fill = document.querySelector('.st-progress-fill');
                    if (fill) {
                        fill.style.width = Math.min(100, (spacetimeState.elapsedMinutes / spacetimeState.maxMinutes) * 100) + '%';
                    }
                    const info = document.querySelector('.st-time-info span:first-child');
                    if (info) {
                        const h = Math.max(0, Math.floor((spacetimeState.maxMinutes - spacetimeState.elapsedMinutes) / 60));
                        const m = Math.max(0, (spacetimeState.maxMinutes - spacetimeState.elapsedMinutes) % 60);
                        info.innerHTML = `<i class="fas fa-clock"></i> 剩余 ${h}h ${m}m`;
                    }
                }
            }, _intervalMs);
        }

        async function spacetimeChooseAction(actionType) {
            if (spacetimeState.generating) return toast('请等待当前场景生成完毕');
            
            const space = getCurrentCoupleSpace();
            if (!space) return;
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return;

            const st = spacetimeState;
            const isSolo = st.soloMode;
            let actionDesc = '';
            
            switch(actionType) {
                case 'explore':
                    actionDesc = '你决定探索周围的环境，四处走走看看。';
                    break;
                case 'talk':
                    actionDesc = isSolo ? '你尝试和周围的人搭话。' : `你转向${partner.name}，想和TA聊聊。`;
                    break;
                case 'interact':
                    actionDesc = '你尝试与周围的环境或人物进行互动。';
                    break;
            }

            st.dialogHistory.push({ role: 'user', text: actionDesc, time: st.elapsedMinutes });
            st.generating = true;
            st.elapsedMinutes += 20; // Reduced from 30 to 20 to slow down pacing
            renderCouple();

            await generateSpacetimeResponse(actionDesc, partner);
        }

        function openSpacetimeCustomAction() {
            document.getElementById('st-action-btns').style.display = 'none';
            document.getElementById('st-custom-input').style.display = 'flex';
            var inputEl = document.getElementById('st-custom-text');
            // [FIX-输入框上弹] 延迟focus，避免键盘弹出时白屏
            setTimeout(function() {
                inputEl.focus();
                // 确保输入框滚动到可见区域
                setTimeout(function() {
                    inputEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 300);
            }, 100);
        }

        function closeSpacetimeCustomAction() {
            document.getElementById('st-action-btns').style.display = 'flex';
            document.getElementById('st-custom-input').style.display = 'none';
            // [FIX-输入框飞天v3] 已改为flex布局，无需重置position/bottom
        }

        async function sendSpacetimeCustomAction() {
            const input = document.getElementById('st-custom-text');
            const text = input.value.trim();
            if (!text) return;

            if (spacetimeState.generating) return toast('请等待当前场景生成完毕');

            const space = getCurrentCoupleSpace();
            if (!space) return;
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return;

            spacetimeState.dialogHistory.push({ role: 'user', text: text, time: spacetimeState.elapsedMinutes });
            spacetimeState.generating = true;
            spacetimeState.elapsedMinutes += 20; // Reduced from 30 to 20
            input.value = '';
            closeSpacetimeCustomAction();
            renderCouple();

            await generateSpacetimeResponse(text, partner);
        }

        async function generateSpacetimeResponse(userAction, partner) {
            const st = spacetimeState;
            const timeLeft = st.maxMinutes - st.elapsedMinutes;
            const isNearEnd = timeLeft <= 120; // Only trigger at 2 hours or less (was 3)
            const isSolo = st.soloMode;
            const styleGuide = getSpacetimeStyleGuide();
            const langGuide = getEraLanguageGuide(st.era);
            const userName = getUserPersonaName(partner, '旅行者');
            const userPersona = store.personas.find(p => p.id === partner.settings?.userPersona) || store.personas[0];
            const userPersonaDesc = userPersona?.desc || '';

            // Build context from recent dialog (with dedup check)
            // 截取每条对话的摘要，避免上下文过长导致AI重复
            const recentDialog = st.dialogHistory.slice(-10).map(d => {
                const truncText = d.text.length > 200 ? d.text.substring(0, 200) + '...(省略)' : d.text;
                if (d.role === 'narrator') return `[旁白] ${truncText}`;
                if (d.role === 'partner') return `[${partner.name}] ${truncText}`;
                if (d.role === 'user') return `[用户] ${truncText}`;
                if (d.role === 'system') return `[系统] ${truncText}`;
                return '';
            }).join('\n');

            // Get worldbook for persona compliance
            let stRespWorldBook = '';
            if (partner.settings?.mountedWbIds && Array.isArray(partner.settings.mountedWbIds)) {
                const mountedBooks = (store.worldbooks || []).filter(wb => partner.settings.mountedWbIds.includes(wb.id));
                if (mountedBooks.length > 0) stRespWorldBook = mountedBooks.map(wb => wb.content).join('\n');
            }

            // Calculate story progression stage
            const progressPct = (st.elapsedMinutes / st.maxMinutes) * 100;
            let paceGuide = '';
            const partnerDialogReminder = isSolo ? '' : `${partner.name}在这个阶段必须积极说话、表达想法和情感，不能沉默！`;
            if (progressPct < 20) {
                paceGuide = `【当前阶段：开篇探索期】故事刚刚开始，${isSolo ? '通过NPC的对话和环境描写' : `通过${partner.name}和NPC轻松的闲聊对话`}来展现新环境。${partnerDialogReminder}可以安排NPC的日常互动、好奇的提问、对新环境的反应和讨论。${isSolo ? '不要描写用户的行为和心理，让用户自己决定如何行动。' : `${partner.name}应该主动分享发现、提出疑问、表达对环境的好奇或兴奋。`}`;
            } else if (progressPct < 50) {
                paceGuide = `【当前阶段：发展期】开始引入有趣的事件和NPC，${isSolo ? '通过NPC的行为和环境事件推进' : `${partner.name}和NPC通过大量对话讨论眼前的事件`}。${partnerDialogReminder}${isSolo ? '不要描写用户的行为和心理。' : `${partner.name}应该对事件发表看法、出谋划策、开玩笑或表达担忧，展现丰富的性格侧面。`}`;
            } else if (progressPct < 80) {
                paceGuide = `【当前阶段：深入期】故事进入中后段，${isSolo ? '通过NPC的深入对话和情景描写' : `通过${partner.name}深入的对话展现关系的微妙变化`}。${partnerDialogReminder}${isSolo ? '不要描写用户的行为和心理。' : `${partner.name}应该表露更深层的情感、回忆过去、倾诉心声，对话要更加真挚动人。`}`;
            } else {
                paceGuide = `【当前阶段：尾声期】故事接近尾声，${isSolo ? '通过环境描写和NPC的反应收束剧情' : `通过${partner.name}和NPC间深情的对话收束剧情`}。${partnerDialogReminder}${isSolo ? '不要描写用户的行为和心理。' : `${partner.name}应该表达不舍、感慨、或用轻松的语气掩饰离别的伤感，给出令人印象深刻的临别语。`}`;
            }

            const sysPrompt = `你是沉浸式时空穿越小说的叙述者。

当前时空：${st.era.name}（${st.era.year}）
场景：${st.era.desc}
${isSolo ? `穿越者：${userName}（独自穿越）
用户人设：${userPersonaDesc || '无特定人设'}` : `两人当前关系：${st.era.relation || '未知'}
用户名：${userName}
用户人设：${userPersonaDesc || '无特定人设'}
伴侣：${partner.name}
伴侣人设：${partner.persona || ''}
伴侣状态：${st.era.contactAge || ''}`}
世界观：${stRespWorldBook || '无'}
故事进度：${Math.round(progressPct)}%
${styleGuide}

${paceGuide}

最近对话：
${recentDialog}

${st.tasks ? `【当前任务引导（自然融入剧情，不要直接提及"任务"二字）】
主线目标：${st.tasks.main.title}（${st.tasks.main.desc}）- 进度${st.tasks.main.progress}%${st.tasks.main.completed ? '（已完成）' : ''}
支线目标：${st.tasks.side.title}（${st.tasks.side.desc}）- 进度${st.tasks.side.progress}%${st.tasks.side.completed ? '（已完成）' : ''}
请在叙述中自然地引导剧情向这些目标方向发展，但不要生硬地提示用户。让用户通过探索和互动自然地推进目标。` : ''}
${(st.choicesMade && st.choicesMade.length > 0) ? `【用户已做的关键选择（影响剧情走向）】\n${st.choicesMade.map(c => `- ${c.situation} → 选择了「${c.choice}」(${c.effect === 'advance' ? '积极' : c.effect === 'retreat' ? '消极' : '中立'})`).join('\n')}\n请根据这些选择的累积效果来调整剧情走向和氛围。积极选择多则剧情向好发展，消极选择多则增加困难和紧张感。` : ''}

任务：根据用户的行动，生成后续场景（${spacetimeSettings.minWords}-${spacetimeSettings.maxWords}字）。

【描写比例要求（强制）】
- ${isSolo ? 'NPC对话与环境叙事' : '角色语言对话'}：约占40%（最核心！${isSolo ? 'NPC的对话、环境中的事件展开、故事线索的自然呈现' : `${partner.name}必须在每段回复中主动说话至少3-5句，语言要有个性、有情绪，不能只是简单附和`}）
- ${isSolo ? 'NPC和角色的' : '角色的'}动作行为描写：约占25%（${isSolo ? 'NPC的动作、表情、事件发展，不要描写用户的动作' : '角色的动作、表情、肢体语言、互动细节'}）
- ${isSolo ? 'NPC和角色的' : '角色的'}心理活动描写：约占15%（${isSolo ? 'NPC的内心感受和情绪变化，不要描写用户的心理' : '角色的内心感受、想法、情绪变化'}）
- 环境与氛围描写：约占20%（简洁的环境变化，点到为止，不要大段堆砌）
⚠️ 严禁环境描写喧宾夺主！对话必须是最核心的内容。不要连续大段描写景色或环境。
⚠️ 【极其重要】不要替用户做决定！不要描写"你走上前去"、"你感到..."、"你说道..."等用户的行为和心理。只描写${isSolo ? 'NPC的行为、环境变化、故事线索' : `${partner.name}和其他NPC的行为`}，让用户自己选择如何行动。
${isSolo ? '' : `⚠️ 【极其重要 - ${partner.name}的对话要求】：
- ${partner.name}在SCENE中必须有丰富的台词（用「」或""包裹），至少3-5句话
- 台词要体现${partner.name}的性格特点：口癖、语气词、说话习惯、情绪表达
- ${partner.name}要主动发起话题、提出疑问、吐槽、调侃、关心、表达感受
- ${partner.name}不是一个沉默的背景角色，TA应该是活跃的、有主见的、会主动互动的
- 每次回复中${partner.name}的对话要有情绪变化和起伏，不能都是同一种语气
- PARTNER标签中写${partner.name}这段场景中最后一句最有感染力/表现力的台词`}

格式要求（必须严格遵守）：
[SCENE]综合场景描写（以对话为核心，穿插动作、心理、环境）[/SCENE]
${isSolo ? '' : `[PARTNER]${partner.name}在本段场景中最后说的一句有表现力的台词[/PARTNER]`}

【严格规则 - 必须遵守】：
1. ${isSolo ? '以NPC行为、环境描写、情景描写、故事线索为主，尽量不描写用户的行为和心理' : `${partner.name}的所有言行必须完全符合其人设，禁止OOC，但TA必须是活跃地参与对话和互动的。尽量减少对用户行为和心理的直接描写`}
2. 禁止出现任何婚礼、结婚、求婚、孩子、怀孕、生育相关内容
3. 保持时代特色和沉浸感，必须严格根据用户人设中的性别/特征来描写用户角色
4. 【极其重要 - 严禁重复】绝对不要重复之前对话中已经描写过的场景、情节、对话或描写。每次回复必须有全新的推进和变化。如果你发现自己在写类似的内容，立即换一个完全不同的方向
5. 可以引入NPC、突发事件、环境变化来增加自由度和趣味性
6. ${isSolo ? '' : '互动亲密度必须符合当前的"关系状态"'}
7. 用中文回复
${langGuide}
${isNearEnd ? '\n⚠️ 时间即将耗尽！穿越通道开始不稳定，请在叙述中加入时空不稳定的描写，但不要直接让角色传送回去。让故事自然推进，时空不稳定只是环境变化的一部分。' : ''}`;

            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: `用户行动：${userAction}` }
                ], 0.95);

                const reply = data.choices[0].message.content;
                
                let sceneText = reply;
                let partnerText = '';
                
                const sceneMatch = reply.match(/\[SCENE\]([\s\S]*?)\[\/SCENE\]/);
                const partnerMatch = reply.match(/\[PARTNER\]([\s\S]*?)\[\/PARTNER\]/);
                
                if (sceneMatch) sceneText = sceneMatch[1].trim();
                if (partnerMatch) partnerText = partnerMatch[1].trim();
                
                if (!sceneMatch && !partnerMatch) {
                    sceneText = reply;
                }

                // Dedup check: prevent identical or highly similar content
                const lastNarrator = st.dialogHistory.filter(d => d.role === 'narrator').slice(-1)[0];
                if (lastNarrator) {
                    const prevText = lastNarrator.text.trim();
                    const newText = sceneText.trim();
                    // 完全相同 或 前100字相同 视为重复
                    const isSameContent = prevText === newText ||
                        (prevText.length > 50 && newText.length > 50 && prevText.substring(0, 100) === newText.substring(0, 100));
                    if (isSameContent) {
                        console.warn('[Spacetime] 检测到重复场景内容，跳过添加');
                        st.generating = false;
                        renderCouple();
                        return;
                    }
                }

                st.dialogHistory.push({ role: 'narrator', text: sceneText, time: st.elapsedMinutes });
                if (partnerText && !isSolo) {
                    st.dialogHistory.push({ role: 'partner', text: partnerText, time: st.elapsedMinutes });
                }

                // Update task progress after AI reply
                if (st.tasks && !st.tasks.expired) {
                    if (!st.tasks.main.completed) {
                        st.tasks.main.progress = Math.min(100, st.tasks.main.progress + Math.floor(Math.random() * 11) + 5);
                        if (st.tasks.main.progress >= 100) st.tasks.main.completed = true;
                    }
                    if (!st.tasks.side.completed) {
                        st.tasks.side.progress = Math.min(100, st.tasks.side.progress + Math.floor(Math.random() * 8) + 3);
                        if (st.tasks.side.progress >= 100) st.tasks.side.completed = true;
                    }
                    const mainBar = document.getElementById('st-main-task-progress');
                    const sideBar = document.getElementById('st-side-task-progress');
                    if (mainBar) mainBar.style.width = st.tasks.main.progress + '%';
                    if (sideBar) sideBar.style.width = st.tasks.side.progress + '%';
                    save();
                }

                // Choice system: increment counter and trigger choice popup every 3 actions
                if (!st.choiceCounter) st.choiceCounter = 0;
                st.choiceCounter++;
                if (st.choiceCounter % 3 === 0 && !st.ending) {
                    setTimeout(() => showSpacetimeChoicePopup(), 800);
                }

                // Only force return if timer says so, NOT based on story elapsed time alone
                // The timer handles force return, so we just let the story continue

            } catch(e) {
                console.error('Spacetime response failed:', e);
                st.dialogHistory.push({ role: 'system', text: '时空波动异常...' + e.message, time: st.elapsedMinutes });
            }

            st.generating = false;
            renderCouple();
            // 生成时空推荐回复
            setTimeout(() => { if (typeof checkStSmartReply === 'function') checkStSmartReply(); }, 500);
        }

        function confirmExitSpacetime() {
            showConfirm('离开时空', '确定要提前返回现实吗？当前穿越记忆将被保存。', () => {
                // [FIX] 不用async回调，改为同步触发异步流程，避免showConfirm吞掉异步错误
                _doExitSpacetime();
            });
        }

        // [FIX] 抽取退出逻辑，防止重复调用
        let _exitingSpacetime = false;
        async function _doExitSpacetime() {
            if (_exitingSpacetime) return;
            _exitingSpacetime = true;
            try {
                // 先停止计时器，添加系统消息，立即更新UI
                const st = spacetimeState;
                if (st.timerInterval) {
                    clearInterval(st.timerInterval);
                    st.timerInterval = null;
                }
                // [FIX-飞天v2] 退出时空时清理键盘适配器
                _stUnbindKeyboardAdapter();
                st.dialogHistory.push({
                    role: 'system',
                    text: '⏳ 正在保存穿越记忆，准备返回现实...',
                    time: st.elapsedMinutes
                });
                st.generating = false;
                renderCouple();

                // 并行执行保存和结局判定，不阻塞UI
                const endingType = determineSpacetimeEnding();
                // 先启动结局展示（内部会显示loading），同时后台保存记忆
                const savePromise = saveSpacetimeMemory().catch(e => console.warn('Save memory error:', e));
                showSpacetimeEnding(endingType);
                await savePromise;
            } catch(e) {
                console.error('Exit spacetime error:', e);
                toast('退出时空失败，请重试');
            } finally {
                _exitingSpacetime = false;
            }
        }

        let _forceReturning = false;
        async function forceReturnSpacetime() {
            if (_forceReturning) return; // Prevent double trigger
            _forceReturning = true;

            const st = spacetimeState;
            if (st.timerInterval) {
                clearInterval(st.timerInterval);
                st.timerInterval = null;
            }
            // [FIX-飞天v2] 强制返回时也清理键盘适配器
            _stUnbindKeyboardAdapter();

            st.dialogHistory.push({
                role: 'system',
                text: '⚡ 24小时已到！时空通道关闭，你们被强制拉回现实...',
                time: st.maxMinutes
            });

            st.generating = false;
            renderCouple();

            try {
                // Save memory
                await saveSpacetimeMemory();
            } catch(e) {
                console.error('Force return save error:', e);
            }

            setTimeout(() => {
                _forceReturning = false;
                const endingType = determineSpacetimeEnding();
                showSpacetimeEnding(endingType);
            }, 2000);
        }

        // ========== Spacetime Task Functions ==========
        function showSpacetimeTaskModal() {
            const st = spacetimeState;
            if (!st.tasks) return;
            const t = st.tasks;
            const existing = document.getElementById('modal-st-task');
            if (existing) existing.remove();

            const modalHtml = `
            <div id="modal-st-task" class="modal" style="display:flex;z-index:9999;">
                <div class="modal-box" style="background:#fff;max-width:340px;border-radius:12px;padding:20px;">
                    <div style="text-align:center;margin-bottom:15px;">
                        <div style="font-size:20px;font-weight:bold;color:#1a1a1a;">📋 时空任务</div>
                        <div style="font-size:12px;color:#999;margin-top:4px;">在倒计时结束前完成任务</div>
                    </div>
                    <div style="text-align:center;margin-bottom:15px;padding:8px;background:#f5f5f5;border-radius:8px;">
                        <div style="font-size:12px;color:#999;">剩余时间</div>
                        <div id="st-task-countdown" style="font-size:24px;font-weight:bold;color:#1a1a1a;">30:00</div>
                    </div>
                    <div style="border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:10px;">
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                            <span style="background:#333;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;">主线</span>
                            <span style="font-weight:bold;color:#1a1a1a;font-size:14px;" id="st-main-task-title">${t.main.title}</span>
                        </div>
                        <div style="font-size:12px;color:#666;" id="st-main-task-desc">${t.main.desc}</div>
                        <div style="margin-top:6px;background:#e0e0e0;border-radius:4px;height:4px;overflow:hidden;">
                            <div id="st-main-task-progress" style="background:#333;height:100%;width:${t.main.progress}%;transition:width 0.3s;"></div>
                        </div>
                    </div>
                    <div style="border:1px solid #e0e0e0;border-radius:8px;padding:12px;margin-bottom:15px;">
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                            <span style="background:#999;color:#fff;font-size:10px;padding:2px 6px;border-radius:4px;">支线</span>
                            <span style="font-weight:bold;color:#1a1a1a;font-size:14px;" id="st-side-task-title">${t.side.title}</span>
                        </div>
                        <div style="font-size:12px;color:#666;" id="st-side-task-desc">${t.side.desc}</div>
                        <div style="margin-top:6px;background:#e0e0e0;border-radius:4px;height:4px;overflow:hidden;">
                            <div id="st-side-task-progress" style="background:#999;height:100%;width:${t.side.progress}%;transition:width 0.3s;"></div>
                        </div>
                    </div>
                    <div style="display:flex;gap:10px;">
                        <button onclick="document.getElementById('modal-st-task').style.display='none'"
                            style="flex:1;padding:10px;background:#333;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">
                            ${t.main.progress > 0 ? '继续穿越' : '开始穿越'}
                        </button>
                        <button onclick="refreshSpacetimeTasks()"
                            style="padding:10px 14px;background:#f0f0f0;color:#333;border:1px solid #e0e0e0;border-radius:8px;font-size:14px;cursor:pointer;"
                            title="刷新任务">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
            </div>`;
            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
        }

        function showSpacetimeTaskPanel() {
            showSpacetimeTaskModal();
        }

        function startStTaskCountdown() {
            if (stTaskTimer) clearInterval(stTaskTimer);
            stTaskTimer = setInterval(() => {
                const st = spacetimeState;
                if (!st.active || !st.tasks) {
                    clearInterval(stTaskTimer);
                    return;
                }
                const elapsed = (Date.now() - st.tasks.countdownStart) / 1000 / 60;
                const remaining = Math.max(0, st.tasks.countdown - elapsed);

                const mins = Math.floor(remaining);
                const secs = Math.floor((remaining - mins) * 60);
                const display = String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');

                const el = document.getElementById('st-task-countdown');
                if (el) el.textContent = display;

                const miniEl = document.getElementById('st-task-mini-countdown');
                if (miniEl) miniEl.textContent = display;

                if (remaining <= 0) {
                    st.tasks.expired = true;
                    clearInterval(stTaskTimer);
                    stTaskTimer = null;
                    save();
                    toast('⏰ 任务时间已到！');
                    // Auto-trigger ending when countdown expires
                    setTimeout(async () => {
                        await saveSpacetimeMemory();
                        const endingType = determineSpacetimeEnding();
                        showSpacetimeEnding(endingType);
                    }, 1500);
                }
            }, 1000);
        }

        // AI-driven task generation based on era, persona, and current story context
        async function generateSpacetimeTasks(era, partner) {
            const st = spacetimeState;
            const recentDialog = (st.dialogHistory || []).slice(-5).map(d => d.text).join('\n').substring(0, 500);
            
            try {
                const prompt = `你是时空穿越游戏的任务设计师。根据以下信息，为穿越者生成1个主线任务和1个支线任务。

时空：${era.name}（${era.year}）
场景：${era.desc}
${partner ? `伴侣：${partner.name}，人设：${(partner.persona || '').substring(0, 200)}` : '独自穿越'}
${recentDialog ? `当前剧情：\n${recentDialog}` : '刚刚进入时空'}

要求：
- 任务必须紧密贴合当前时空背景和角色人设
- 主线任务应该有深度和内涵（关于守护、探索真相、改变命运等，但要具体到当前时空）
- 支线任务应该有趣且与主线有关联
- 任务描述要简洁有吸引力
- 绝不能出现不忠、出轨等三观不正的内容

严格按以下JSON格式回复，不要多余文字：
{"main":{"title":"主线任务标题","desc":"主线任务描述"},"side":{"title":"支线任务标题","desc":"支线任务描述"}}`;

                const data = await API.chatCompletion([
                    { role: 'system', content: prompt }
                ], 0.9);
                
                const reply = data.choices[0].message.content.trim();
                const jsonMatch = reply.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const tasks = JSON.parse(jsonMatch[0]);
                    st.tasks = {
                        main: { title: tasks.main.title, desc: tasks.main.desc, progress: 0, completed: false },
                        side: { title: tasks.side.title, desc: tasks.side.desc, progress: 0, completed: false },
                        countdown: 30,
                        countdownStart: Date.now(),
                        expired: false
                    };
                    save();
                    return;
                }
            } catch(e) {
                console.warn('AI task generation failed, using fallback:', e);
            }
            
            // Fallback to template pool
            const mainTask = SPACETIME_TASK_POOL.main[Math.floor(Math.random() * SPACETIME_TASK_POOL.main.length)];
            const sideTask = SPACETIME_TASK_POOL.side[Math.floor(Math.random() * SPACETIME_TASK_POOL.side.length)];
            st.tasks = {
                main: { ...mainTask, progress: 0, completed: false },
                side: { ...sideTask, progress: 0, completed: false },
                countdown: 30,
                countdownStart: Date.now(),
                expired: false
            };
            save();
        }

        async function refreshSpacetimeTasks() {
            const st = spacetimeState;
            if (!st.tasks) return;
            
            toast('正在生成新任务...');
            const space = getCurrentCoupleSpace();
            const partner = space ? store.contacts.find(x => x.id === space.partnerId) : null;
            
            await generateSpacetimeTasks(st.era, partner);
            
            // Update UI
            const mt = document.getElementById('st-main-task-title');
            const md = document.getElementById('st-main-task-desc');
            const st2 = document.getElementById('st-side-task-title');
            const sd = document.getElementById('st-side-task-desc');
            const mp = document.getElementById('st-main-task-progress');
            const sp = document.getElementById('st-side-task-progress');
            if (mt) mt.textContent = st.tasks.main.title;
            if (md) md.textContent = st.tasks.main.desc;
            if (st2) st2.textContent = st.tasks.side.title;
            if (sd) sd.textContent = st.tasks.side.desc;
            if (mp) mp.style.width = '0%';
            if (sp) sp.style.width = '0%';

            toast('任务已刷新');
        }

        // ========== Spacetime Choice System ==========
        const SPACETIME_CHOICE_POOL = [
            {
                situation: '你发现了一条隐秘的小路，尽头似乎隐藏着什么...',
                options: [
                    { text: '谨慎探索小路', effect: 'advance', desc: '小心翼翼地前进，发现了重要线索' },
                    { text: '绕道而行', effect: 'neutral', desc: '选择安全的路线，错过了一些发现' },
                    { text: '无视继续前行', effect: 'retreat', desc: '忽略了可能改变命运的机会' }
                ]
            },
            {
                situation: '一个神秘人向你伸出了手，眼中满是真诚...',
                options: [
                    { text: '握住对方的手', effect: 'advance', desc: '建立了信任，获得了关键帮助' },
                    { text: '保持警惕观察', effect: 'neutral', desc: '没有冒险，但也没有收获' },
                    { text: '转身离开', effect: 'retreat', desc: '失去了一个重要的盟友' }
                ]
            },
            {
                situation: '远处传来求救声，但前方的路也在召唤你...',
                options: [
                    { text: '前去救援', effect: 'advance', desc: '救下了关键人物，命运的齿轮开始转动' },
                    { text: '派人去查看', effect: 'neutral', desc: '间接帮助了他人，但错过了直接联系' },
                    { text: '专注自己的目标', effect: 'retreat', desc: '错过了改变结局的重要契机' }
                ]
            },
            {
                situation: '你获得了一件神秘的物品，它散发着奇异的光芒...',
                options: [
                    { text: '仔细研究它', effect: 'advance', desc: '发现了物品的秘密，任务取得突破' },
                    { text: '收起来以后再看', effect: 'neutral', desc: '暂时保管，没有立即获得收益' },
                    { text: '觉得危险丢掉', effect: 'retreat', desc: '丢弃了可能扭转局势的关键道具' }
                ]
            },
            {
                situation: '面前出现了两条截然不同的道路...',
                options: [
                    { text: '选择荆棘密布的窄路', effect: 'advance', desc: '历经艰辛后发现了隐藏的真相' },
                    { text: '选择平坦的大路', effect: 'neutral', desc: '安全但平淡地前进了一段' },
                    { text: '原地等待', effect: 'retreat', desc: '犹豫不决，浪费了宝贵的时间' }
                ]
            },
            {
                situation: '你听到了一段关于这个时空的古老传说...',
                options: [
                    { text: '深入追寻传说的真相', effect: 'advance', desc: '传说中隐藏着解开谜题的钥匙' },
                    { text: '记在心里继续前行', effect: 'neutral', desc: '信息被记录但未被利用' },
                    { text: '当作无稽之谈', effect: 'retreat', desc: '忽视了重要的历史线索' }
                ]
            },
            {
                situation: '一场突如其来的危机降临，你必须做出抉择...',
                options: [
                    { text: '挺身而出面对危机', effect: 'advance', desc: '勇敢的行动赢得了所有人的信任' },
                    { text: '寻找安全的解决方案', effect: 'neutral', desc: '化解了危机但没有获得额外收获' },
                    { text: '选择自保', effect: 'retreat', desc: '虽然安全了，但失去了他人的信任' }
                ]
            },
            {
                situation: '你发现了一个被封印的秘密房间...',
                options: [
                    { text: '想办法打开封印', effect: 'advance', desc: '房间里藏着改变一切的关键信息' },
                    { text: '记下位置以后再来', effect: 'neutral', desc: '保留了选择但错过了最佳时机' },
                    { text: '封印存在必有原因，不碰', effect: 'retreat', desc: '错过了最重要的发现' }
                ]
            },
            {
                situation: '有人向你透露了一个惊人的秘密...',
                options: [
                    { text: '追问更多细节', effect: 'advance', desc: '获得了扭转局势的关键情报' },
                    { text: '默默记住', effect: 'neutral', desc: '信息不完整，但有所收获' },
                    { text: '不想卷入是非', effect: 'retreat', desc: '主动放弃了了解真相的机会' }
                ]
            },
            {
                situation: '你感受到了时空的波动，似乎有什么在改变...',
                options: [
                    { text: '顺着波动追溯源头', effect: 'advance', desc: '找到了时空异变的核心，离真相更近了' },
                    { text: '静观其变', effect: 'neutral', desc: '波动平息了，一切似乎没有变化' },
                    { text: '试图抵抗波动', effect: 'retreat', desc: '对抗时空力量让你消耗了大量精力' }
                ]
            }
        ];

        // HE结局模板 - 温馨、有内涵、符合正向价值观
        const SPACETIME_ENDINGS_HE = [
            { title: '命运的馈赠', desc: '你的每一个选择都在编织着命运的丝线。当最后一缕光芒穿透时空的裂隙，你发现——所有的相遇都不是偶然，所有的付出都有了回响。这段穿越的记忆，将永远铭刻在灵魂深处。', icon: '🌟' },
            { title: '归途如歌', desc: '时空的通道缓缓关闭，你带着满满的收获踏上归途。那些在异世界建立的羁绊、守护的承诺、追寻的真相，都化作了最珍贵的记忆。你知道，这不是结束，而是新故事的开始。', icon: '🎵' },
            { title: '星辰与你', desc: '当最后的谜题被解开，整个时空都为之震颤。你用智慧和勇气改写了命运的轨迹，让这个世界迎来了最好的结局。抬头望去，星辰似乎都在为你闪烁。', icon: '✨' },
            { title: '永恒的约定', desc: '穿越的旅程画上了圆满的句号。你完成了所有的使命，守护了重要的人，也找到了属于自己的答案。在时空交汇的那一刻，你许下了一个永恒的约定——无论在哪个时空，都要勇敢地活着。', icon: '💫' },
            { title: '破晓之光', desc: '黎明的光芒驱散了所有的阴霾。你的选择让这个时空迎来了最美的破晓，所有的牺牲和坚持都有了意义。带着这份光明，你踏上了回家的路。', icon: '🌅' },
        ];

        // BE结局模板 - 有内涵、不涉及不忠/出轨，可以是牺牲、囚禁、遗憾等
        const SPACETIME_ENDINGS_BE = [
            { title: '时空的囚笼', desc: '时间耗尽了，时空的裂隙在你面前缓缓闭合。你被困在了这个时空的夹缝中，一个由记忆和遗憾构成的牢笼。透过模糊的时空壁障，你似乎还能看到那个未完成的约定...', icon: '🔒' },
            { title: '英雄的代价', desc: '为了守护这个时空的安宁，你选择了留下。当通道关闭的那一刻，你知道自己再也回不去了。但看着因你而获救的人们，嘴角还是浮现了一丝微笑——有些牺牲，值得。', icon: '⚔️' },
            { title: '未完的篇章', desc: '故事戛然而止，像一本被风吹合的书。那些未解的谜题、未说出口的话、未完成的使命，都成了永远的遗憾。时空的洪流带走了一切，只留下一声叹息回荡在虚空中。', icon: '📖' },
            { title: '记忆的牢笼', desc: '你发现自己陷入了无尽的记忆循环。同样的场景、同样的选择、同样的结局，一遍又一遍地重演。也许某一天，你能找到打破循环的方法...但不是今天。', icon: '🔄' },
            { title: '黄昏的告别', desc: '夕阳西下，时空的通道在最后一缕余晖中消散。你没能完成使命，那些期待着你的人，将永远等不到答案。在这个陌生的时空里，你只能带着未竟的遗憾，独自面对漫长的黄昏。', icon: '🌇' },
        ];

        async function showSpacetimeChoicePopup() {
            const st = spacetimeState;
            if (!st.active || st.ending) return;

            const existing = document.getElementById('modal-st-choice');
            if (existing) existing.remove();

            // Show loading state
            const loadingHtml = `
            <div id="modal-st-choice" class="modal" style="display:flex;z-index:9999;">
                <div class="modal-box" style="background:#fff;max-width:340px;border-radius:12px;padding:20px;text-align:center;">
                    <div style="font-size:28px;margin-bottom:8px;">⚡</div>
                    <div style="font-size:14px;color:#999;">命运正在编织选择...</div>
                </div>
            </div>`;
            document.getElementById('device').insertAdjacentHTML('beforeend', loadingHtml);

            // Try AI-generated choice based on current story context
            let scenario = null;
            try {
                const space = getCurrentCoupleSpace();
                const partner = space ? store.contacts.find(x => x.id === space.partnerId) : null;
                const recentDialog = st.dialogHistory.slice(-6).map(d => d.text).join('\n').substring(0, 600);
                const choiceHistory = (st.choicesMade || []).map(c => c.choice).join('、');

                const prompt = `你是时空穿越互动游戏的剧情设计师。根据当前情景生成一个关键抉择。

时空：${st.era.name}（${st.era.year}）- ${st.era.desc}
${partner ? `伴侣：${partner.name}（${(partner.persona || '').substring(0, 150)}）` : '独自穿越'}
当前任务：${st.tasks ? st.tasks.main.title : '无'}
已做选择：${choiceHistory || '无'}
最近剧情：
${recentDialog}

要求：
- 选择必须紧密贴合当前剧情发展，不能脱离上下文
- 3个选项分别代表不同方向：一个勇敢/积极的、一个谨慎/中立的、一个回避/消极的
- 每个选项都应该合理，没有明显的"正确答案"
- 选项的后果描述要具体，与当前剧情相关
- 绝不能出现不忠、出轨等三观不正的内容
- BE方向可以是牺牲、囚禁、遗憾等有内涵的方向

严格按JSON格式回复：
{"situation":"当前面临的情景描述","options":[{"text":"选项1","effect":"advance","desc":"选择后果"},{"text":"选项2","effect":"neutral","desc":"选择后果"},{"text":"选项3","effect":"retreat","desc":"选择后果"}]}`;

                const data = await API.chatCompletion([{ role: 'system', content: prompt }], { temperature: 0.9, scene: 'spacetime' });
                const reply = data.choices[0].message.content.trim();
                const jsonMatch = reply.match(/\{[\s\S]*\}/);
                if (jsonMatch) scenario = JSON.parse(jsonMatch[0]);
            } catch(e) {
                console.warn('AI choice generation failed, using fallback:', e);
            }

            // Fallback to template pool
            if (!scenario || !scenario.options || scenario.options.length < 2) {
                scenario = SPACETIME_CHOICE_POOL[Math.floor(Math.random() * SPACETIME_CHOICE_POOL.length)];
            }

            // Remove loading, show actual choice
            const loadingModal = document.getElementById('modal-st-choice');
            if (loadingModal) loadingModal.remove();

            const optionsHtml = scenario.options.map((opt, i) => `
                <button onclick="makeSpacetimeChoice(${i})" class="st-choice-option"
                    style="display:block;width:100%;text-align:left;padding:12px;margin-bottom:8px;background:#f5f5f5;border:1px solid #e0e0e0;border-radius:8px;cursor:pointer;font-size:13px;color:#1a1a1a;transition:background 0.2s;">
                    <div style="font-weight:bold;margin-bottom:2px;">${opt.text}</div>
                </button>
            `).join('');

            const modalHtml = `
            <div id="modal-st-choice" class="modal" style="display:flex;z-index:9999;">
                <div class="modal-box" style="background:#fff;max-width:340px;border-radius:12px;padding:20px;">
                    <div style="text-align:center;margin-bottom:15px;">
                        <div style="font-size:28px;margin-bottom:8px;">⚡</div>
                        <div style="font-size:16px;font-weight:bold;color:#1a1a1a;">命运的抉择</div>
                    </div>
                    <div style="font-size:13px;color:#666;line-height:1.6;margin-bottom:15px;padding:10px;background:#f9f9f9;border-radius:8px;border-left:3px solid #333;">
                        ${scenario.situation}
                    </div>
                    <div id="st-choice-options">${optionsHtml}</div>
                    <div style="font-size:11px;color:#999;text-align:center;margin-top:8px;">
                        你的选择将影响剧情走向
                    </div>
                </div>
            </div>`;

            spacetimeState._currentChoice = scenario;
            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
        }

        window.makeSpacetimeChoice = function(optionIdx) {
            const st = spacetimeState;
            if (!st._currentChoice) return;

            const option = st._currentChoice.options[optionIdx];
            if (!option) return;

            // Record choice
            if (!st.choicesMade) st.choicesMade = [];
            st.choicesMade.push({ situation: st._currentChoice.situation, choice: option.text, effect: option.effect });

            // Apply effect to task progress
            if (st.tasks && !st.tasks.expired) {
                switch(option.effect) {
                    case 'advance':
                        if (!st.tasks.main.completed) {
                            st.tasks.main.progress = Math.min(100, st.tasks.main.progress + 15);
                            if (st.tasks.main.progress >= 100) st.tasks.main.completed = true;
                        }
                        if (!st.tasks.side.completed) {
                            st.tasks.side.progress = Math.min(100, st.tasks.side.progress + 10);
                            if (st.tasks.side.progress >= 100) st.tasks.side.completed = true;
                        }
                        break;
                    case 'neutral':
                        // No change to progress
                        break;
                    case 'retreat':
                        if (!st.tasks.main.completed) {
                            st.tasks.main.progress = Math.max(0, st.tasks.main.progress - 10);
                        }
                        if (!st.tasks.side.completed) {
                            st.tasks.side.progress = Math.max(0, st.tasks.side.progress - 5);
                        }
                        break;
                }
                // Update progress bars
                const mainBar = document.getElementById('st-main-task-progress');
                const sideBar = document.getElementById('st-side-task-progress');
                if (mainBar) mainBar.style.width = st.tasks.main.progress + '%';
                if (sideBar) sideBar.style.width = st.tasks.side.progress + '%';
            }

            // Add choice result to dialog
            st.dialogHistory.push({
                role: 'system',
                text: `【命运抉择】${option.text} —— ${option.desc}`,
                time: st.elapsedMinutes
            });

            // Close modal
            const modal = document.getElementById('modal-st-choice');
            if (modal) modal.remove();
            delete st._currentChoice;

            // Show feedback toast
            if (option.effect === 'advance') toast('✨ 命运的天平向好的方向倾斜');
            else if (option.effect === 'retreat') toast('⚠️ 这个选择让局势变得更加复杂');
            else toast('📝 你的选择已被记录');

            save();
            renderCouple();
        };

        // ========== Spacetime Ending System ==========
        function determineSpacetimeEnding() {
            const st = spacetimeState;
            if (!st.tasks) return 'be';
            
            // HE condition: main task completed
            if (st.tasks.main.completed) return 'he';
            // BE condition: main task not completed
            return 'be';
        }

        async function showSpacetimeEnding(endingType) {
            const st = spacetimeState;
            st.ending = endingType;

            const existing = document.getElementById('modal-st-ending');
            if (existing) existing.remove();

            // Show loading
            const loadHtml = `<div id="modal-st-ending" class="modal" style="display:flex;z-index:10000;">
                <div class="modal-box" style="background:#fff;max-width:360px;border-radius:14px;padding:24px;text-align:center;border:1px solid #e0e0e0;">
                    <div style="font-size:36px;margin-bottom:10px;">${endingType === 'he' ? '✨' : '🌑'}</div>
                    <div style="font-size:14px;color:#999;">结局正在生成...</div>
                </div>
            </div>`;
            document.getElementById('device').insertAdjacentHTML('beforeend', loadHtml);

            // Try AI-generated ending
            let ending = null;
            try {
                const space = getCurrentCoupleSpace();
                const partner = space ? store.contacts.find(x => x.id === space.partnerId) : null;
                const recentDialog = st.dialogHistory.slice(-8).map(d => d.text).join('\n').substring(0, 800);
                const choiceHistory = (st.choicesMade || []).map(c => `${c.situation} → ${c.choice}`).join('\n');

                const prompt = `你是时空穿越故事的结局撰写者。根据以下信息，为这次穿越写一个${endingType === 'he' ? '圆满的好结局(Happy Ending)' : '遗憾的坏结局(Bad Ending)'}。

时空：${st.era.name}（${st.era.year}）- ${st.era.desc}
${partner ? `伴侣：${partner.name}（${(partner.persona || '').substring(0, 150)}）` : '独自穿越'}
任务：${st.tasks ? `主线「${st.tasks.main.title}」${st.tasks.main.completed ? '已完成' : '未完成('+st.tasks.main.progress+'%)'}，支线「${st.tasks.side.title}」${st.tasks.side.completed ? '已完成' : '未完成('+st.tasks.side.progress+'%)'}` : '无'}
用户的关键选择：
${choiceHistory || '无'}
最近剧情：
${recentDialog}

要求：
- 结局必须紧密贴合当前时空、人设、剧情发展和用户的选择
- 结局要有深度和内涵，让用户感到回味无穷
- ${endingType === 'he' ? '好结局可以是：守护成功、真相大白、命运改写、深情告白、家国情怀的胜利等' : '坏结局可以是：被囚禁关小黑屋、为人类/爱人牺牲、陷入时空循环、未完成的遗憾等'}
- 绝不能出现任何不忠、出轨等三观不正的内容
- 结局描述100-200字，要有文学性和感染力

严格按JSON格式回复：
{"title":"结局标题(4-6字)","desc":"结局描述","icon":"一个合适的emoji"}`;

                const data = await API.chatCompletion([{ role: 'system', content: prompt }], { temperature: 0.9, scene: 'spacetime' });
                const reply = data.choices[0].message.content.trim();
                const jsonMatch = reply.match(/\{[\s\S]*\}/);
                if (jsonMatch) ending = JSON.parse(jsonMatch[0]);
            } catch(e) {
                console.warn('AI ending generation failed, using fallback:', e);
            }

            // Fallback
            if (!ending || !ending.title) {
                const pool = endingType === 'he' ? SPACETIME_ENDINGS_HE : SPACETIME_ENDINGS_BE;
                ending = pool[Math.floor(Math.random() * pool.length)];
            }

            // Remove loading
            const loadModal = document.getElementById('modal-st-ending');
            if (loadModal) loadModal.remove();

            const choicesSummary = (st.choicesMade || []).map(c =>
                `<div style="font-size:11px;color:#666;padding:4px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="color:#999;">▸</span> ${c.choice}
                </div>`
            ).join('');

            const taskStatus = st.tasks ? `
                <div style="display:flex;gap:8px;margin-bottom:12px;">
                    <div style="flex:1;padding:6px;background:#f5f5f5;border-radius:6px;text-align:center;">
                        <div style="font-size:10px;color:#999;">主线</div>
                        <div style="font-size:14px;font-weight:bold;color:${st.tasks.main.completed ? '#333' : '#999'};">${st.tasks.main.completed ? '✓ 完成' : st.tasks.main.progress + '%'}</div>
                    </div>
                    <div style="flex:1;padding:6px;background:#f5f5f5;border-radius:6px;text-align:center;">
                        <div style="font-size:10px;color:#999;">支线</div>
                        <div style="font-size:14px;font-weight:bold;color:${st.tasks.side.completed ? '#333' : '#999'};">${st.tasks.side.completed ? '✓ 完成' : st.tasks.side.progress + '%'}</div>
                    </div>
                </div>
            ` : '';

            const bgColor = endingType === 'he' ? '#ffffff' : '#f5f5f5';
            const titleColor = endingType === 'he' ? '#1a1a1a' : '#666';
            const badge = endingType === 'he'
                ? '<span style="background:#333;color:#fff;font-size:10px;padding:2px 8px;border-radius:10px;margin-left:6px;">HAPPY ENDING</span>'
                : '<span style="background:#999;color:#fff;font-size:10px;padding:2px 8px;border-radius:10px;margin-left:6px;">BAD ENDING</span>';

            const modalHtml = `
            <div id="modal-st-ending" class="modal" style="display:flex;z-index:10000;">
                <div class="modal-box" style="background:${bgColor};max-width:360px;border-radius:14px;padding:24px;border:1px solid #e0e0e0;">
                    <div style="text-align:center;margin-bottom:16px;">
                        <div style="font-size:48px;margin-bottom:8px;">${ending.icon || (endingType === 'he' ? '✨' : '🌑')}</div>
                        <div style="font-size:18px;font-weight:bold;color:${titleColor};">
                            ${ending.title}${badge}
                        </div>
                    </div>
                    <div style="font-size:13px;color:#666;line-height:1.8;margin-bottom:16px;padding:12px;background:#fafafa;border-radius:8px;border:1px solid #eee;">
                        ${ending.desc}
                    </div>
                    ${taskStatus}
                    ${choicesSummary ? `
                    <div style="margin-bottom:12px;">
                        <div style="font-size:11px;color:#999;margin-bottom:4px;">你的抉择轨迹：</div>
                        ${choicesSummary}
                    </div>` : ''}
                    <button onclick="closeSpacetimeEnding()"
                        style="width:100%;padding:12px;background:#333;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;">
                        回到现实
                    </button>
                </div>
            </div>`;

            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
        }

        window.closeSpacetimeEnding = function() {
            const modal = document.getElementById('modal-st-ending');
            if (modal) modal.remove();
            resetSpacetimeState();
            renderCouple();
        };

        window.showSpacetimeChoicePopup = showSpacetimeChoicePopup;
        window.showSpacetimeEnding = showSpacetimeEnding;

        // [FIX] 防止重复保存记忆
        let _savingSpacetimeMemory = false;
        async function saveSpacetimeMemory() {
            if (_savingSpacetimeMemory) return;
            _savingSpacetimeMemory = true;
            
            try {
            const st = spacetimeState;
            const space = getCurrentCoupleSpace();
            if (!space || !st.era) { _savingSpacetimeMemory = false; return; }

            if (!space.spacetimeMemories) space.spacetimeMemories = [];

            // Generate summary
            let summary = st.dialogHistory.filter(d => d.role === 'narrator').map(d => d.text).join(' ').substring(0, 100) + '...';
            
            try {
                const fullText = st.dialogHistory.map(d => {
                    if (d.role === 'narrator') return `[旁白]${d.text}`;
                    if (d.role === 'partner') return `[伴侣]${d.text}`;
                    if (d.role === 'user') return `[用户]${d.text}`;
                    return '';
                }).join('\n');

                const data = await API.chatCompletion([
                    { role: 'system', content: '用30-50字总结以下时空穿越故事的精华。用优美的中文。' },
                    { role: 'user', content: fullText.substring(0, 2000) }
                ], 0.7);
                summary = data.choices[0].message.content.trim();
            } catch(e) {
                console.warn('Summary generation failed, using fallback');
            }

            space.spacetimeMemories.push({
                id: 'stm_' + Date.now(),
                eraId: st.era.id,
                eraName: st.era.name,
                eraYear: st.era.year,
                eraData: JSON.parse(JSON.stringify(st.era)),
                soloMode: st.soloMode || false,
                summary: summary,
                fullDialog: st.dialogHistory,
                date: new Date().toLocaleString(),
                duration: st.elapsedMinutes
            });

            save();
            } finally {
                _savingSpacetimeMemory = false;
            }
        }

        function resetSpacetimeState() {
            if (spacetimeState.timerInterval) clearInterval(spacetimeState.timerInterval);
            if (stTaskTimer) { clearInterval(stTaskTimer); stTaskTimer = null; }
            const taskModal = document.getElementById('modal-st-task');
            if (taskModal) taskModal.remove();
            const choiceModal = document.getElementById('modal-st-choice');
            if (choiceModal) choiceModal.remove();
            const endingModal = document.getElementById('modal-st-ending');
            if (endingModal) endingModal.remove();
            spacetimeState = {
                active: false,
                era: null,
                scene: '',
                elapsedMinutes: 0,
                maxMinutes: 1440,
                dialogHistory: [],
                memories: [],
                timerInterval: null,
                generating: false,
                soloMode: false,
                choiceCounter: 0,
                choicesMade: [],
                ending: null
            };
        }

        async function continueSpacetimeMemory(idx) {
            const space = getCurrentCoupleSpace();
            if (!space) return toast('请先进入情侣空间');
            const memories = space.spacetimeMemories || [];
            const m = memories[idx];
            if (!m) return toast('找不到该穿越记忆');

            if (spacetimeState.active) return toast('当前已有穿越进行中，请先结束');

            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return toast('找不到伴侣联系人');

            // Reconstruct era from saved data or build minimal era object
            const era = m.eraData || { id: m.eraId, name: m.eraName, year: m.eraYear, desc: m.eraName, relation: '', contactAge: '' };
            const isSolo = m.soloMode || false;

            // Get worldbook context
            let stWorldBook = '';
            if (partner.settings?.mountedWbIds && Array.isArray(partner.settings.mountedWbIds)) {
                const mountedBooks = (store.worldbooks || []).filter(wb => partner.settings.mountedWbIds.includes(wb.id));
                if (mountedBooks.length > 0) stWorldBook = mountedBooks.map(wb => wb.content).join('\n');
            }

            const styleGuide = getSpacetimeStyleGuide();
            const langGuide = getEraLanguageGuide(era);
            const userName = getUserPersonaName(partner, '旅行者');
            const userPersona = store.personas.find(p => p.id === partner.settings?.userPersona) || store.personas[0];
            const userPersonaDesc = userPersona?.desc || '';

            // Build previous story summary from dialog history (last 15 entries for context)
            const prevDialog = (m.fullDialog || []).slice(-15).map(d => {
                if (d.role === 'narrator') return `[旁白] ${d.text}`;
                if (d.role === 'partner') return `[${partner.name}] ${d.text}`;
                if (d.role === 'user') return `[用户] ${d.text}`;
                if (d.role === 'system') return `[系统] ${d.text}`;
                return '';
            }).filter(Boolean).join('\n');

            // Init state with fresh timer but carry over context
            resetSpacetimeState();
            spacetimeState.active = true;
            spacetimeState.era = era;
            spacetimeState.elapsedMinutes = 0;
            spacetimeState.soloMode = isSolo;
            spacetimeState.generating = true;
            spacetimeState.continuedFromMemoryId = m.id;

            // Add system message about continuation
            spacetimeState.dialogHistory.push({
                role: 'system',
                text: `🔄 续接上回 —— ${m.eraName}（${m.eraYear}）`,
                time: 0
            });

            renderCouple();

            // Generate continuation scene
            try {
                const sysPrompt = `你是一个沉浸式时空穿越小说的叙述者。

这是一次【续接穿越】——用户之前已经穿越过这个时空，现在再次回到这里继续冒险。

背景设定：
- 时空：${era.name}（${era.year}）
- 场景：${era.desc}
${isSolo ? `- 穿越者：${userName}（独自穿越）
- 用户人设：${userPersonaDesc || '无特定人设'}` : `- 两人当前关系：${era.relation || '未知'}
- 角色1（用户）：${userName}
- 用户人设：${userPersonaDesc || '无特定人设'}
- 角色2（伴侣）：${partner.name}
- 伴侣人设：${partner.persona || ''}
- 伴侣在此时空的状态：${era.contactAge || ''}`}
- 世界观补充：${stWorldBook || '无'}
${styleGuide}

【上次穿越的最后片段】：
${prevDialog}

【续接要求 - 极其重要】：
1. 你必须延续上次穿越的故事线，不要重新开始
2. 开场描写这个时空中的场景变化——环境的变迁、NPC的反应、${isSolo ? '周围世界的变化' : `${partner.name}发现用户归来时的反应`}
3. 从上次故事结束的地方自然衔接，可以设定"过了一段时间"的时间跳跃
4. 保持角色关系的连续性，${isSolo ? '' : `${partner.name}应该记得上次的互动`}
5. 引入新的情节发展，不要重复上次的内容
6. 禁止出现任何婚礼、结婚、求婚、孩子、怀孕、生育相关内容
7. 必须严格根据用户人设中的性别/特征来描写用户角色
8. 【极其重要 - 减少描写用户】不要过多描写用户的行为、动作、心理活动。应以${isSolo ? 'NPC的行为、环境描写、情景描写、故事线索' : `${partner.name}和其他NPC的行为、对话、表情、动作`}为主要描写对象
${langGuide}

任务：生成续接开场白（${spacetimeSettings.minWords}-${spacetimeSettings.maxWords}字）。
【描写比例要求】：
- ${isSolo ? 'NPC对话与环境叙事' : '角色语言对话'}：约占40%（${isSolo ? 'NPC的对话、环境事件、故事线索' : `${partner.name}必须在场景中主动说话至少3-5句，展现对用户归来的情感反应`}）
- ${isSolo ? 'NPC和角色的' : '角色的'}动作行为描写：约占25%
- ${isSolo ? 'NPC和角色的' : '角色的'}心理活动描写：约占15%
- 环境描写：约占20%
⚠️ 【极其重要】不要替用户做决定！不要描写用户的行为和心理。只描写${isSolo ? 'NPC的行为、环境变化、故事线索' : `${partner.name}和其他NPC的行为`}，让用户自己选择如何行动。
要求：
1. 描写这个时空中环境和角色的变化，${isSolo ? 'NPC对用户归来的反应' : `${partner.name}发现用户归来时的情感表现`}
2. 自然衔接上次的故事，展现时间流逝后的变化
3. ${isSolo ? '以一个新的发现或悬念作为结尾' : `${partner.name}必须有丰富的台词表现，体现TA对用户归来的惊喜/感慨/调侃等真实情感反应`}
4. ${isSolo ? '' : `${partner.name}的对话要有层次：从发现用户回来→情绪反应→回忆过往→展望接下来的冒险`}
5. 以${isSolo ? '一个新的悬念' : `${partner.name}的一句充满感染力的台词`}作为结尾

格式要求：
[SCENE]综合场景描写（以对话为核心，穿插动作、心理、环境）[/SCENE]
${isSolo ? '' : `[PARTNER]${partner.name}在本段中最后说的一句有表现力的台词[/PARTNER]`}`;

                const data = await API.chatCompletion([
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: '续接穿越，回到上次的时空' }
                ], 0.95);

                const reply = data.choices[0].message.content;

                let sceneText = reply;
                let partnerText = '';

                const sceneMatch = reply.match(/\[SCENE\]([\s\S]*?)\[\/SCENE\]/);
                const partnerMatch = reply.match(/\[PARTNER\]([\s\S]*?)\[\/PARTNER\]/);

                if (sceneMatch) sceneText = sceneMatch[1].trim();
                if (partnerMatch) partnerText = partnerMatch[1].trim();

                if (!sceneMatch && !partnerMatch) {
                    sceneText = reply;
                }

                spacetimeState.scene = sceneText;
                spacetimeState.dialogHistory.push({
                    role: 'narrator',
                    text: sceneText,
                    time: 0
                });
                if (partnerText) {
                    spacetimeState.dialogHistory.push({
                        role: 'partner',
                        text: partnerText,
                        time: 0
                    });
                }

                startSpacetimeTimer();

            } catch(e) {
                console.error('Spacetime continuation failed:', e);
                spacetimeState.dialogHistory.push({
                    role: 'system',
                    text: '时空波动异常...续接失败：' + e.message,
                    time: 0
                });
            }

            spacetimeState.generating = false;
            renderCouple();
        }

        function openSpacetimeMemories() {
            const space = getCurrentCoupleSpace();
            if (!space) return;
            const memories = space.spacetimeMemories || [];
            
            const partner = store.contacts.find(x => x.id === space.partnerId);
            const partnerName = partner ? partner.name : 'TA';

            let html = `
                <div class="nav-bar" style="background:rgba(13,13,43,0.95);">
                    <div class="nav-icon" onclick="coupleViewMode='sub_spacetime';renderCouple()"><i class="fas fa-chevron-left" style="color:#fff;"></i></div>
                    <div class="nav-title" style="color:#fff;">穿越记忆</div>
                    <div class="nav-icon"></div>
                </div>
                <div class="scroll-y st-home-scroll" style="background:#ffffff; padding:16px; min-height:calc(100% - 44px); color:${spacetimeSettings.homeFontColor || '#1a1a1a'}; font-size:${spacetimeSettings.fontSize || 14}px;">
            `;

            if (memories.length === 0) {
                html += `<div style="text-align:center; color:#999999; padding:80px 20px;">
                    <i class="fas fa-book-open" style="font-size:48px; margin-bottom:15px; display:block; color:#cccccc;"></i>
                    尚无穿越记忆<br>去时空系统开启你的第一次穿越吧
                </div>`;
            } else {
                memories.slice().reverse().forEach((m, i) => {
                    const origIdx = memories.length - 1 - i;
                    const durationH = Math.floor(m.duration / 60);
                    const durationM = m.duration % 60;
                    html += `
                        <div class="st-memory-card">
                            <div class="st-memory-card-header">
                                <div>
                                    <div class="st-memory-card-title">${m.eraName}</div>
                                    <div class="st-memory-card-year">${m.eraYear} · ${m.date}</div>
                                </div>
                                <div class="st-memory-card-actions">
                                    <button onclick="readSpacetimeMemory(${origIdx})" class="st-mem-btn"><i class="fas fa-eye"></i></button>
                                    <button onclick="editSpacetimeMemory(${origIdx})" class="st-mem-btn"><i class="fas fa-edit"></i></button>
                                    <button onclick="deleteSpacetimeMemory(${origIdx})" class="st-mem-btn del"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                            <div class="st-memory-card-body">${m.summary}</div>
                            <div class="st-memory-card-footer">
                                <span><i class="fas fa-clock"></i> 停留 ${durationH}h${durationM}m</span>
                                <span><i class="fas fa-comment-dots"></i> ${(m.fullDialog||[]).length} 段对话</span>
                            </div>
                            <div style="padding:8px 12px; border-top:1px solid #e0e0e0; text-align:right;">
                                <button onclick="continueSpacetimeMemory(${origIdx})" style="padding:6px 16px; border:none; background:#333333; color:#fff; border-radius:16px; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">
                                    <i class="fas fa-play-circle"></i> 续接上回
                                </button>
                            </div>
                        </div>
                    `;
                });
            }

            html += `</div>`;
            const area = document.getElementById('couple-content-area');
            area.innerHTML = html;
        }

        function readSpacetimeMemory(idx) {
            const space = getCurrentCoupleSpace();
            if (!space) return;
            const m = space.spacetimeMemories[idx];
            if (!m) return;

            const partner = store.contacts.find(x => x.id === space.partnerId);
            const partnerName = partner ? partner.name : 'TA';

            let html = `
                <div class="nav-bar" style="background:rgba(13,13,43,0.95);">
                    <div class="nav-icon" onclick="openSpacetimeMemories()"><i class="fas fa-chevron-left" style="color:#fff;"></i></div>
                    <div class="nav-title" style="color:#fff;">${m.eraName} 回忆录</div>
                    <div class="nav-icon"></div>
                </div>
                <div class="scroll-y st-home-scroll" style="background:#ffffff; padding:16px; min-height:calc(100% - 44px); color:${spacetimeSettings.homeFontColor || '#1a1a1a'}; font-size:${spacetimeSettings.fontSize || 14}px;">
                    <div class="st-read-summary">"${m.summary}"</div>
                    <div class="st-read-meta">${m.eraYear} · 停留${Math.floor(m.duration/60)}小时 · ${m.date}</div>
                    <div class="st-read-dialog-list">
                        ${(m.fullDialog || []).map(d => `
                            <div class="st-dialog-item ${d.role}" style="margin-bottom:12px;">
                                ${d.role === 'narrator' ? `<div class="st-narrator-box">${d.text}</div>` :
                                  d.role === 'partner' ? `<div class="st-partner-msg"><div class="st-partner-name">${partnerName}</div><div class="st-partner-bubble">${d.text}</div></div>` :
                                  d.role === 'user' ? `<div class="st-user-msg"><div class="st-user-bubble">${d.text}</div></div>` :
                                  d.role === 'system' ? `<div class="st-system-msg">${d.text}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    <div style="text-align:center; margin:20px 0 30px;">
                        <button onclick="continueSpacetimeMemory(${idx})" style="padding:12px 32px; border:none; background:#333333; color:#fff; border-radius:24px; font-size:14px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                            <i class="fas fa-play-circle"></i> 续接上回，继续穿越
                        </button>
                    </div>
                </div>
            `;
            const area = document.getElementById('couple-content-area');
            area.innerHTML = html;
        }

        function editSpacetimeMemory(idx) {
            const space = getCurrentCoupleSpace();
            if (!space) return;
            const m = space.spacetimeMemories[idx];
            if (!m) return;

            showPromptModal('编辑穿越记忆摘要:', m.summary, {multiline: true}).then(function(newSummary) {
                if (newSummary !== null && newSummary.trim()) {
                    m.summary = newSummary.trim();
                    save();
                    openSpacetimeMemories();
                    toast('记忆已更新');
                }
            });
        }

        function deleteSpacetimeMemory(idx) {
            const space = getCurrentCoupleSpace();
            if (!space) return;

            showConfirm('删除记忆', '确定要删除这段穿越记忆吗？此操作不可恢复。', () => {
                space.spacetimeMemories.splice(idx, 1);
                save();
                openSpacetimeMemories();
                toast('记忆已删除');
            });
        }

        function refreshSpacetimeScene() {
            if (!spacetimeState.active) return;
            spacetimeState.dialogHistory = spacetimeState.dialogHistory.slice(0, 2); // Keep system + opening
            spacetimeState.elapsedMinutes = 0;
            startSpacetimeTimer();
            renderCouple();
            toast('场景已刷新');
        }

        // ==========================================
        // --- SPACETIME MORE MENU (时空更多菜单) ---
        // ==========================================
        function toggleSTMoreMenu(e) {
            e && e.stopPropagation();
            const menus = document.querySelectorAll('.st-more-menu');
            menus.forEach(menu => {
                if (menu.style.display === 'none' || !menu.style.display) {
                    menu.style.display = 'block';
                    setTimeout(() => {
                        document.addEventListener('click', _closeSTMoreMenuHandler, { once: true });
                    }, 10);
                } else {
                    menu.style.display = 'none';
                }
            });
        }
        function _closeSTMoreMenuHandler() {
            closeSTMoreMenu();
        }
        function closeSTMoreMenu() {
            const menus = document.querySelectorAll('.st-more-menu');
            menus.forEach(menu => menu.style.display = 'none');
            document.removeEventListener('click', _closeSTMoreMenuHandler);
        }

        // ==========================================
        // --- SPACETIME FONT SETTINGS (穿越对话字体设置) ---
        // 【备注】此设置仅控制"进入穿越之后"的对话页面中所有文字的字体大小和颜色
        // 包括：旁白(narrator)、伴侣对话(partner bubble)、用户对话(user bubble)、系统消息(system msg)
        // 不影响时空系统主页面（选择穿越目的地页面），主页面字体颜色由"时空设置"中的homeFontColor控制
        // ==========================================
        function openSTFontSettings() {
            const saved = spacetimeSettings || {};
            const fontSize = saved.fontSize || 14;
            const fontColor = saved.fontColor || '#ffffff';

            const modalHtml = `
                <div class="modal-mask" id="modal-st-font-settings" style="display:flex;" onclick="if(event.target===this)this.remove()">
                    <div class="modal-box" style="max-width:360px;" onclick="event.stopPropagation()">
                        <h3 style="margin-bottom:18px;"><i class="fas fa-font" style="margin-right:8px;"></i>穿越对话字体设置</h3>
                        <div style="font-size:12px; color:#888; margin-bottom:12px; padding:8px 10px; background:#f5f5f5; border-radius:6px; line-height:1.5;">
                            💡 此设置仅控制<b>进入穿越后</b>对话页面中的字体大小和颜色（旁白、对话气泡等）。<br>主页面字体颜色请在「时空设置」中调整。
                        </div>
                        <div class="group-box">
                            <div class="form-cell">
                                <span class="form-label">字体大小</span>
                                <div style="display:flex; align-items:center; gap:8px; flex:1;">
                                    <input id="st-font-size-slider" type="range" min="12" max="28" value="${fontSize}" style="flex:1;" oninput="document.getElementById('st-font-size-display').textContent=this.value+'px'; previewSTFont()">
                                    <span id="st-font-size-display" style="min-width:40px; text-align:center; font-size:13px; font-weight:600;">${fontSize}px</span>
                                </div>
                            </div>
                            <div class="form-cell" style="margin-top:12px;">
                                <span class="form-label">对话字体颜色</span>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <input id="st-font-color-picker" type="color" value="${fontColor}" style="width:40px; height:32px; border:1px solid #ddd; border-radius:6px; padding:0; cursor:pointer;" oninput="previewSTFont()">
                                    <div id="st-font-color-hex" style="font-size:12px; color:#888; font-family:monospace;">${fontColor}</div>
                                    <button onclick="document.getElementById('st-font-color-picker').value='#ffffff';document.getElementById('st-font-color-hex').textContent='#ffffff';previewSTFont()" style="padding:4px 10px; border:1px solid #ddd; background:#f9f9f9; border-radius:6px; font-size:11px; cursor:pointer;">重置</button>
                                </div>
                            </div>
                            <div style="margin-top:16px; padding:12px; background:rgba(102,126,234,0.08); border-radius:8px;">
                                <div style="font-size:12px; color:#888; margin-bottom:6px;">预览效果</div>
                                <div id="st-font-preview" style="font-size:${fontSize}px; color:${fontColor}; padding:8px; background:rgba(13,13,43,0.95); border-radius:6px; line-height:1.6;">在遥远的时空中，命运让我们再次相遇...</div>
                            </div>
                        </div>
                        <div style="display:flex; justify-content:flex-end; margin-top:20px; gap:10px;">
                            <button onclick="document.getElementById('modal-st-font-settings').remove()" style="padding:10px 20px; border:none; background:#eee; border-radius:8px; font-size:14px; cursor:pointer;">取消</button>
                            <button onclick="saveSTFontSettings()" style="padding:10px 20px; border:none; background:var(--primary); color:#fff; border-radius:8px; font-size:14px; cursor:pointer;">保存</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
        }

        function previewSTFont() {
            const size = document.getElementById('st-font-size-slider').value;
            const color = document.getElementById('st-font-color-picker').value;
            const preview = document.getElementById('st-font-preview');
            const hexDisplay = document.getElementById('st-font-color-hex');
            if (preview) {
                preview.style.fontSize = size + 'px';
                preview.style.color = color;
            }
            if (hexDisplay) hexDisplay.textContent = color;
        }

        function saveSTFontSettings() {
            const size = parseInt(document.getElementById('st-font-size-slider').value);
            const color = document.getElementById('st-font-color-picker').value;
            spacetimeSettings.fontSize = size;
            spacetimeSettings.fontColor = color;
            saveSpacetimeSettings();
            document.getElementById('modal-st-font-settings').remove();
            applySpacetimeFontSettings();
            renderCouple();
            toast('字体设置已保存');
        }

        // ==========================================
        // --- SPACETIME SETTINGS (时空设置) ---
        // 【备注】此设置是时空系统的综合设置，包含文风、字数范围等
        // fontColor: 控制"进入穿越后"对话页面的字体颜色（旁白、对话气泡等）
        // homeFontColor: 控制"时空系统主页面"（选择穿越目的地页面）所有文字的颜色
        //   包括：标题、副标题、时空名称、年代、描述、分类标题、记忆预览、状态提示文字等
        // ==========================================
        let spacetimeSettings = JSON.parse(localStorage.getItem('spacetimeSettings') || 'null') || {
            writingStyle: '沉浸小说',
            minWords: 200,
            maxWords: 400,
            fontSize: 14,
            fontColor: '',
            homeFontColor: '',
            timeSpeed: 1,  // 时间流逝速度倍率：0.25=极慢, 0.5=慢, 1=正常, 2=快, 4=极快
            customStyles: [
                {name: '沉浸小说', desc: '用华丽、沉浸式的小说文笔，注重五感细节和氛围渲染。'},
                {name: '古典文言', desc: '融入文言文的优雅韵律，用半文半白的风格书写，引经据典。'},
                {name: '轻松日常', desc: '用轻松活泼的日常口吻，注重人物间的趣味互动和生活细节。'},
                {name: '诗意散文', desc: '用散文诗般的笔触，注重意象和情感的流淌，文字要如诗如画。'},
                {name: '紧张悬疑', desc: '用紧凑的悬疑笔法，营造紧张氛围，设置悬念和伏笔。'}
            ]
        };
        // [FIX] 兼容旧版本没有timeSpeed字段的情况
        if (spacetimeSettings.timeSpeed === undefined) spacetimeSettings.timeSpeed = 1;
        // Migrate old string-based customStyles to object format
        if (spacetimeSettings.customStyles && spacetimeSettings.customStyles.length > 0 && typeof spacetimeSettings.customStyles[0] === 'string') {
            const defaultDescMap = {
                '沉浸小说': '用华丽、沉浸式的小说文笔，注重五感细节和氛围渲染。',
                '古典文言': '融入文言文的优雅韵律，用半文半白的风格书写，引经据典。',
                '轻松日常': '用轻松活泼的日常口吻，注重人物间的趣味互动和生活细节。',
                '诗意散文': '用散文诗般的笔触，注重意象和情感的流淌，文字要如诗如画。',
                '紧张悬疑': '用紧凑的悬疑笔法，营造紧张氛围，设置悬念和伏笔。'
            };
            spacetimeSettings.customStyles = spacetimeSettings.customStyles.map(s => ({
                name: s,
                desc: defaultDescMap[s] || `按照"${s}"的风格来写作。`
            }));
            localStorage.setItem('spacetimeSettings', JSON.stringify(spacetimeSettings));
        }

        function saveSpacetimeSettings() {
            localStorage.setItem('spacetimeSettings', JSON.stringify(spacetimeSettings));
        }

        function openSpacetimeSettings() {
            const styles = spacetimeSettings.customStyles || [];
            let styleOptions = styles.map(s => `<option value="${s.name}" ${spacetimeSettings.writingStyle === s.name ? 'selected' : ''}>${s.name}</option>`).join('');
            
            const currentStyle = spacetimeSettings.writingStyle;
            const currentStyleObj = styles.find(s => s.name === currentStyle);
            const currentDesc = currentStyleObj ? currentStyleObj.desc : '';

            // 文风列表HTML (新版 SVG 图标)
            const stylesListHtml = styles.map((s, i) => `
                <div class="settings-style-item">
                    <div class="ssi-info">
                        <div class="ssi-name">${s.name}</div>
                        <div class="ssi-desc">${s.desc || '无描述'}</div>
                    </div>
                    <div class="ssi-actions">
                        <button onclick="editSTStyle(${i})" title="编辑"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <button class="del" onclick="deleteSTStyle(${i})" title="删除"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                </div>
            `).join('');

            const modalHtml = `
                <div class="settings-sheet-mask show" id="modal-st-settings" onclick="if(event.target===this){this.remove()}">
                    <div class="settings-sheet" onclick="event.stopPropagation()">
                        <!-- 顶栏 -->
                        <div class="settings-sheet-header">
                            <button class="settings-sheet-close" onclick="document.getElementById('modal-st-settings').remove()">
                                <svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                            <span class="settings-sheet-title">时空设置</span>
                        </div>

                        <!-- 滚动区域 -->
                        <div class="settings-sheet-body">
                            <!-- ===== 写作 ===== -->
                            <div class="settings-section-title">写作</div>
                            <div class="settings-group">
                                <div class="settings-row clickable" onclick="openSTStylePicker()">
                                    <span class="settings-row-label">
                                        <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                        文风
                                    </span>
                                    <div class="settings-row-right">
                                        <span id="st-setting-style-display" style="font-size:13px;color:#333;">${currentStyle}</span>
                                        <svg class="settings-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                                        <select id="st-setting-style" style="display:none;">
                                            ${styleOptions}
                                        </select>
                                    </div>
                                </div>
                                <div class="settings-desc-row" id="st-current-style-desc">${currentDesc || '无描述'}</div>
                                <div class="settings-row">
                                    <span class="settings-row-label">
                                        <svg viewBox="0 0 24 24"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
                                        字数范围
                                    </span>
                                    <div class="settings-row-right">
                                        <input id="st-setting-min-words" type="number" value="${spacetimeSettings.minWords}">
                                        <span style="color:#999;">—</span>
                                        <input id="st-setting-max-words" type="number" value="${spacetimeSettings.maxWords}">
                                        <span class="settings-val-text">字</span>
                                    </div>
                                </div>
                                <div class="settings-row clickable" onclick="toggleSTStylePanel()">
                                    <span class="settings-row-label">
                                        <svg viewBox="0 0 24 24"><path d="M12 3v18"/><path d="M5 10l7-7 7 7"/></svg>
                                        管理文风
                                    </span>
                                    <div class="settings-row-right">
                                        <svg id="st-style-toggle-arrow" class="settings-chevron" viewBox="0 0 24 24" style="transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"/></svg>
                                    </div>
                                </div>
                                <!-- 文风管理展开区 -->
                                <div id="st-style-panel" class="settings-style-expand">
                                    <div class="settings-style-inner">
                                        <div id="st-custom-styles-list">
                                            ${stylesListHtml}
                                        </div>
                                        <div class="settings-style-add">
                                            <div class="settings-style-add-title">
                                                <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                                添加自定义文风
                                            </div>
                                            <input id="st-setting-custom-style" placeholder="文风名称">
                                            <textarea id="st-setting-custom-style-desc" placeholder="文风描述（AI将按此风格写作）"></textarea>
                                            <button class="settings-style-add-btn" onclick="addCustomSTStyle()">添加</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- ===== 外观 ===== -->
                            <div class="settings-section-title">外观</div>
                            <div class="settings-group">
                                <div class="settings-row">
                                    <span class="settings-row-label">
                                        <svg viewBox="0 0 24 24"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
                                        字体大小
                                    </span>
                                    <div class="settings-row-right" style="flex:1; margin-left:12px;">
                                        <input id="st-setting-font-size" type="range" min="12" max="24" value="${spacetimeSettings.fontSize || 14}" oninput="document.getElementById('st-font-size-val').textContent=this.value+'px'">
                                        <span id="st-font-size-val" class="settings-val-text" style="min-width:36px; font-weight:500;">${spacetimeSettings.fontSize || 14}px</span>
                                    </div>
                                </div>
                                <div class="settings-row">
                                    <span class="settings-row-label">
                                        <svg viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                                        主页文字颜色
                                    </span>
                                    <div class="settings-row-right">
                                        <input id="st-setting-home-font-color" type="color" value="${spacetimeSettings.homeFontColor || '#ffffff'}">
                                        <button onclick="document.getElementById('st-setting-home-font-color').value='#ffffff';" style="padding:4px 12px; border:1px solid #e0e0e0; background:#fafafa; border-radius:12px; font-size:11px; cursor:pointer; color:#666;">重置</button>
                                    </div>
                                </div>
                            </div>

                            <!-- ===== 时间 ===== -->
                            <div class="settings-section-title">时间</div>
                            <div class="settings-group">
                                <div class="settings-row">
                                    <span class="settings-row-label">
                                        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                        流逝速度
                                    </span>
                                    <div class="settings-row-right">
                                        <select id="st-setting-time-speed">
                                            <option value="0.25" ${spacetimeSettings.timeSpeed == 0.25 ? 'selected' : ''}>极慢 (0.25x)</option>
                                            <option value="0.5" ${spacetimeSettings.timeSpeed == 0.5 ? 'selected' : ''}>慢速 (0.5x)</option>
                                            <option value="1" ${!spacetimeSettings.timeSpeed || spacetimeSettings.timeSpeed == 1 ? 'selected' : ''}>正常 (1x)</option>
                                            <option value="2" ${spacetimeSettings.timeSpeed == 2 ? 'selected' : ''}>快速 (2x)</option>
                                            <option value="4" ${spacetimeSettings.timeSpeed == 4 ? 'selected' : ''}>极快 (4x)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="settings-group-hint">控制穿越中时间流逝的快慢。修改后对当前穿越立即生效。</div>
                        </div>

                        <!-- 底部按钮 -->
                        <div class="settings-sheet-footer">
                            <button class="settings-sheet-done" onclick="confirmSpacetimeSettings()">完成</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
            // [文风折叠] 应用折叠状态
            try { _applySTStylePanelState(); } catch(_e){}
        }

        // --- [文风折叠] 时空文风折叠面板 ---
        const _ST_STYLE_PANEL_LS_KEY = 'spacetimeStylePanelExpanded';
        function _applySTStylePanelState() {
            const panel = document.getElementById('st-style-panel');
            const arrow = document.getElementById('st-style-toggle-arrow');
            if (!panel) return;
            const expanded = localStorage.getItem(_ST_STYLE_PANEL_LS_KEY) === '1';
            if (expanded) { panel.classList.add('open'); } else { panel.classList.remove('open'); }
            if (arrow) arrow.style.transform = expanded ? 'rotate(180deg)' : 'rotate(0deg)';
        }
        function toggleSTStylePanel() {
            const cur = localStorage.getItem(_ST_STYLE_PANEL_LS_KEY) === '1';
            localStorage.setItem(_ST_STYLE_PANEL_LS_KEY, cur ? '0' : '1');
            _applySTStylePanelState();
        }
        window.toggleSTStylePanel = toggleSTStylePanel;

        function onSTStyleChange() {
            const sel = document.getElementById('st-setting-style');
            const styleName = sel.value;
            const styles = spacetimeSettings.customStyles || [];
            const styleObj = styles.find(s => s.name === styleName);
            const descEl = document.getElementById('st-current-style-desc');
            if (descEl) descEl.textContent = styleObj ? (styleObj.desc || '无描述') : '无描述';
            // [FIX-文风选择] 同步更新显示文本
            const styleDisp = document.getElementById('st-setting-style-display');
            if (styleDisp) styleDisp.textContent = styleName;
        }

        // [FIX-文风选择卡住] 弹出式文风选择器，替代原生select（参考线下模式的openOfflineStylePicker）
        window.openSTStylePicker = function() {
            const styles = spacetimeSettings.customStyles || [];
            if (styles.length === 0) { toast('还没有文风，请先在下方"管理文风"中添加'); return; }
            const sel = document.getElementById('st-setting-style');
            const currentStyle = sel ? sel.value : (spacetimeSettings.writingStyle || '沉浸小说');

            // 移除已有的picker避免重复
            var existingPicker = document.getElementById('st-style-picker-overlay');
            if (existingPicker) existingPicker.remove();

            const overlay = document.createElement('div');
            overlay.id = 'st-style-picker-overlay';
            // 不使用modal-mask类(有display:none冲突)，全部使用inline样式
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:10200;display:flex;align-items:flex-end;justify-content:center;';
            overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

            let listHtml = '';
            styles.forEach(function(s) {
                const isActive = s.name === currentStyle;
                const descShort = s.desc ? (s.desc.length > 40 ? s.desc.substring(0, 40) + '...' : s.desc) : '';
                listHtml += '<div style="padding:12px 14px;border-radius:10px;margin-bottom:6px;cursor:pointer;background:' + (isActive ? '#e8f5e9' : '#f9f9fb') + ';" data-style-name="' + s.name.replace(/"/g, '&quot;') + '">'
                    + '<div style="font-weight:500;font-size:14px;">' + (isActive ? '✓ ' : '') + s.name + '</div>'
                    + (descShort ? '<div style="font-size:11px;color:#999;margin-top:2px;">' + descShort + '</div>' : '')
                    + '</div>';
            });

            overlay.innerHTML = '<div style="background:#fff;border-radius:16px 16px 0 0;width:100%;max-width:420px;max-height:50vh;display:flex;flex-direction:column;pointer-events:auto;" onclick="event.stopPropagation()">'
                + '<div style="padding:14px 16px;border-bottom:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">'
                + '<span style="font-size:16px;font-weight:600;">🖋️ 选择文风</span>'
                + '<span onclick="document.getElementById(\'st-style-picker-overlay\').remove()" style="font-size:22px;color:#999;cursor:pointer;padding:0 4px;">×</span></div>'
                + '<div style="overflow-y:auto;padding:8px 12px;flex:1;">' + listHtml + '</div>'
                + '</div>';

            document.getElementById('device').appendChild(overlay);

            overlay.addEventListener('click', function(e) {
                const item = e.target.closest('[data-style-name]');
                if (!item) return;
                const name = item.getAttribute('data-style-name');
                // 更新隐藏select
                if (sel) sel.value = name;
                // 触发描述更新
                onSTStyleChange();
                overlay.remove();
            });
        };

        function addCustomSTStyle() {
            const nameInput = document.getElementById('st-setting-custom-style');
            const descInput = document.getElementById('st-setting-custom-style-desc');
            const name = nameInput.value.trim();
            const desc = descInput.value.trim();
            if (!name) return toast('请输入文风名称');
            if (!desc) return toast('请输入文风描述，AI将按此描述来写作');
            if (!spacetimeSettings.customStyles) spacetimeSettings.customStyles = [];
            if (spacetimeSettings.customStyles.find(s => s.name === name)) return toast('该文风已存在');
            spacetimeSettings.customStyles.push({name, desc});
            saveSpacetimeSettings();
            // Refresh the select
            const sel = document.getElementById('st-setting-style');
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            sel.appendChild(opt);
            sel.value = name;
            nameInput.value = '';
            descInput.value = '';
            // Refresh the modal to show updated list
            document.getElementById('modal-st-settings').remove();
            openSpacetimeSettings();
            toast('已添加文风: ' + name);
        }

        function editSTStyle(idx) {
            const styles = spacetimeSettings.customStyles || [];
            if (!styles[idx]) return;
            const s = styles[idx];
            
            const modalHtml = `
                <div class="settings-sheet-mask show" id="modal-edit-st-style" style="z-index:10001;" onclick="if(event.target===this)this.remove()">
                    <div class="settings-sheet" style="max-height:60vh;" onclick="event.stopPropagation()">
                        <div class="settings-sheet-header">
                            <button class="settings-sheet-close" onclick="document.getElementById('modal-edit-st-style').remove()">
                                <svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                            <span class="settings-sheet-title">编辑文风</span>
                        </div>
                        <div class="settings-sheet-body">
                            <div style="margin-bottom:12px;">
                                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#1a1a1a;">文风名称</label>
                                <input id="edit-st-style-name" value="${s.name}" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:12px;font-size:13px;background:#fafafa;">
                            </div>
                            <div>
                                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#1a1a1a;">文风描述</label>
                                <textarea id="edit-st-style-desc" style="width:100%;padding:9px 12px;border:1px solid #e0e0e0;border-radius:12px;min-height:80px;font-size:13px;resize:vertical;font-family:inherit;background:#fafafa;">${s.desc || ''}</textarea>
                            </div>
                        </div>
                        <div class="settings-sheet-footer">
                            <button class="settings-sheet-done" onclick="saveEditSTStyle(${idx})">保存</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('device').insertAdjacentHTML('beforeend', modalHtml);
        }

        function saveEditSTStyle(idx) {
            const name = document.getElementById('edit-st-style-name').value.trim();
            const desc = document.getElementById('edit-st-style-desc').value.trim();
            if (!name) return toast('名称不能为空');
            const oldName = spacetimeSettings.customStyles[idx].name;
            spacetimeSettings.customStyles[idx] = {name, desc};
            // Update writingStyle if it was the one being edited
            if (spacetimeSettings.writingStyle === oldName) {
                spacetimeSettings.writingStyle = name;
            }
            saveSpacetimeSettings();
            document.getElementById('modal-edit-st-style').remove();
            document.getElementById('modal-st-settings').remove();
            openSpacetimeSettings();
            toast('文风已更新');
        }

        function deleteSTStyle(idx) {
            const styles = spacetimeSettings.customStyles || [];
            if (!styles[idx]) return;
            if (styles.length <= 1) return toast('至少保留一个文风');
            const deletedName = styles[idx].name;
            styles.splice(idx, 1);
            if (spacetimeSettings.writingStyle === deletedName) {
                spacetimeSettings.writingStyle = styles[0].name;
            }
            saveSpacetimeSettings();
            document.getElementById('modal-st-settings').remove();
            openSpacetimeSettings();
            toast('已删除文风: ' + deletedName);
        }

        function confirmSpacetimeSettings() {
            spacetimeSettings.writingStyle = document.getElementById('st-setting-style').value;
            spacetimeSettings.minWords = parseInt(document.getElementById('st-setting-min-words').value) || 200;
            spacetimeSettings.maxWords = parseInt(document.getElementById('st-setting-max-words').value) || 400;
            spacetimeSettings.fontSize = parseInt(document.getElementById('st-setting-font-size').value) || 14;
            spacetimeSettings.homeFontColor = document.getElementById('st-setting-home-font-color').value || '';
            // [NEW] 保存时间流逝速度
            const _tsEl = document.getElementById('st-setting-time-speed');
            if (_tsEl) spacetimeSettings.timeSpeed = parseFloat(_tsEl.value) || 1;
            saveSpacetimeSettings();
            // [NEW] 如果正在穿越中，实时应用新的时间速度（重启计时器）
            if (spacetimeState.active && spacetimeState.timerInterval) {
                startSpacetimeTimer();
            }
            applySpacetimeFontSettings();
            document.getElementById('modal-st-settings').remove();
            toast('时空设置已保存');
        }

        function applySpacetimeFontSettings() {
            let styleEl = document.getElementById('spacetime-font-style');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'spacetime-font-style';
                document.head.appendChild(styleEl);
            }
            const fs = spacetimeSettings.fontSize || 14;
            const fc = spacetimeSettings.fontColor || '';
            const hfc = spacetimeSettings.homeFontColor || '';
            let css = '';

            // ======================================================
            // 【穿越对话字体覆盖】- fontColor 仅控制进入穿越后的对话页面
            // 包括：旁白、伴侣对话、用户对话、系统消息
            // ======================================================
            css += `.st-narrator-box, .st-partner-bubble, .st-user-bubble, .st-system-msg { font-size: ${fs}px !important; }`;
            if (fc && fc !== '#ffffff') {
                css += `.st-narrator-box, .st-partner-bubble, .st-user-bubble { color: ${fc} !important; }`;
            }

            // ======================================================
            // 【主页面（选择穿越目的地页面）字体覆盖】- homeFontColor 控制主页面所有文字
            // 包括：标题、副标题、时空名称、年代、描述、分类标题、记忆预览、
            //       状态提示文字（生成中、生成失败、加载中）、重新生成按钮等
            // ======================================================
            if (fs !== 14) {
                css += `
                    .st-home-scroll .st-hero-title { font-size: ${Math.round(fs * 1.57)}px !important; }
                    .st-home-scroll .st-hero-sub { font-size: ${fs}px !important; }
                    .st-home-scroll .st-category-title { font-size: ${Math.round(fs * 1.43)}px !important; }
                    .st-home-scroll .st-category-subtitle { font-size: ${fs}px !important; }
                    .st-home-scroll .st-era-name { font-size: ${Math.round(fs * 1.14)}px !important; }
                    .st-home-scroll .st-era-year { font-size: ${Math.round(fs * 0.86)}px !important; }
                    .st-home-scroll .st-era-desc { font-size: ${Math.round(fs * 0.86)}px !important; }
                    .st-home-scroll .st-divider-text { font-size: ${Math.round(fs * 0.86)}px !important; }
                    .st-home-scroll .st-section-title { font-size: ${fs}px !important; }
                    .st-home-scroll .st-memory-era { font-size: ${Math.round(fs * 0.86)}px !important; }
                    .st-home-scroll .st-memory-summary { font-size: ${fs}px !important; }
                    .st-home-scroll .st-memory-card-title { font-size: ${Math.round(fs * 1.14)}px !important; }
                    .st-home-scroll .st-memory-card-year { font-size: ${Math.round(fs * 0.86)}px !important; }
                    .st-home-scroll .st-memory-card-body { font-size: ${fs}px !important; }
                    .st-home-scroll .st-memory-card-footer { font-size: ${Math.round(fs * 0.86)}px !important; }
                    .st-home-scroll .st-read-summary { font-size: ${Math.round(fs * 1.14)}px !important; }
                    .st-home-scroll .st-read-meta { font-size: ${Math.round(fs * 0.86)}px !important; }
                    .st-home-scroll .st-narrator-box { font-size: ${fs}px !important; }
                    .st-home-scroll .st-partner-bubble { font-size: ${fs}px !important; }
                    .st-home-scroll .st-user-bubble { font-size: ${fs}px !important; }
                    .st-home-scroll .st-system-msg { font-size: ${fs}px !important; }
                    .st-home-scroll .st-partner-name { font-size: ${Math.round(fs * 0.86)}px !important; }
                `;
            }
            // 主页面字体颜色覆盖 - 使用 homeFontColor，覆盖页面所有元素（包括下半部分状态提示等）
            // 同时覆盖穿越记忆列表页和回忆详情页（历史回顾）
            if (hfc) {
                css += `
                    .st-home-scroll { color: ${hfc} !important; }
                    .st-home-scroll .st-hero-title,
                    .st-home-scroll .st-hero-sub,
                    .st-home-scroll .st-category-title,
                    .st-home-scroll .st-category-subtitle,
                    .st-home-scroll .st-era-name,
                    .st-home-scroll .st-era-year,
                    .st-home-scroll .st-era-desc,
                    .st-home-scroll .st-era-badge,
                    .st-home-scroll .st-era-card i.fas,
                    .st-home-scroll .st-divider-text,
                    .st-home-scroll .st-section-title,
                    .st-home-scroll .st-section-title i,
                    .st-home-scroll .st-memory-era,
                    .st-home-scroll .st-memory-summary,
                    .st-home-scroll .st-memory-chip,
                    .st-home-scroll .st-memory-card-title,
                    .st-home-scroll .st-memory-card-year,
                    .st-home-scroll .st-memory-card-body,
                    .st-home-scroll .st-memory-card-footer,
                    .st-home-scroll .st-era-info div,
                    .st-home-scroll .st-category-info div,
                    .st-home-scroll .st-hero-icon,
                    .st-home-scroll .st-status-area,
                    .st-home-scroll .st-status-text,
                    .st-home-scroll .st-status-sub,
                    .st-home-scroll .st-status-btn,
                    .st-home-scroll .st-era-arrow,
                    .st-home-scroll .st-read-summary,
                    .st-home-scroll .st-read-meta,
                    .st-home-scroll .st-read-dialog-list,
                    .st-home-scroll .st-narrator-box,
                    .st-home-scroll .st-partner-bubble,
                    .st-home-scroll .st-partner-name,
                    .st-home-scroll .st-user-bubble,
                    .st-home-scroll .st-system-msg { color: ${hfc} !important; }
                `;
            }
            styleEl.innerHTML = css;
        }

        // 页面加载时应用已保存的字体设置
        setTimeout(applySpacetimeFontSettings, 100);

        // ==========================================
        // --- SPACETIME MSG ACTIONS (消息操作) ---
        // ==========================================
        async function stMsgAction(action, msgIdx) {
            const st = spacetimeState;
            if (!st.active || st.generating) return toast('请等待当前操作完成');
            if (msgIdx < 0 || msgIdx >= st.dialogHistory.length) return;

            const msg = st.dialogHistory[msgIdx];
            const space = getCurrentCoupleSpace();
            if (!space) return;
            const partner = store.contacts.find(x => x.id === space.partnerId);
            if (!partner) return;

            switch(action) {
                case 'regenerate':
                    // 重回：从该消息开始重新生成
                    st.dialogHistory = st.dialogHistory.slice(0, msgIdx);
                    st.generating = true;
                    renderCouple();
                    // Find the last user action before this message
                    let lastUserAction = '继续推进剧情';
                    for (let i = msgIdx - 1; i >= 0; i--) {
                        if (st.dialogHistory[i] && st.dialogHistory[i].role === 'user') {
                            lastUserAction = st.dialogHistory[i].text;
                            break;
                        }
                    }
                    await generateSpacetimeResponse(lastUserAction, partner);
                    break;

                case 'recall':
                    // 撤回：删除该消息及之后的所有消息
                    st.dialogHistory = st.dialogHistory.slice(0, msgIdx);
                    renderCouple();
                    toast('已撤回');
                    break;

                case 'edit':
                    // 修改：允许用户编辑消息内容
                    showPromptModal('编辑内容:', msg.text, {multiline: true}).then(function(newText) {
                        if (newText !== null && newText.trim()) {
                            st.dialogHistory[msgIdx].text = newText.trim();
                            renderCouple();
                            toast('已修改');
                        }
                    });
                    break;

                case 'expand':
                    // 扩写：基于该消息扩展更多内容
                    st.generating = true;
                    renderCouple();
                    await expandSpacetimeMsg(msgIdx, partner);
                    break;
            }
        }

        async function expandSpacetimeMsg(msgIdx, partner) {
            const st = spacetimeState;
            const msg = st.dialogHistory[msgIdx];
            if (!msg) { st.generating = false; renderCouple(); return; }

            let stWorldBook = '';
            if (partner.settings?.mountedWbIds && Array.isArray(partner.settings.mountedWbIds)) {
                const mountedBooks = (store.worldbooks || []).filter(wb => partner.settings.mountedWbIds.includes(wb.id));
                if (mountedBooks.length > 0) stWorldBook = mountedBooks.map(wb => wb.content).join('\n');
            }

            const styleGuide = getSpacetimeStyleGuide();

            const expandPrompt = `你是沉浸式时空穿越小说的叙述者。

当前时空：${st.era.name}（${st.era.year}）
场景：${st.era.desc}
伴侣：${partner.name}
伴侣人设：${partner.persona || ''}
世界观：${stWorldBook || '无'}
${styleGuide}

以下是需要扩写的内容：
"${msg.text}"

任务：将以上内容扩写为更加丰富、细腻的版本。增加更多感官细节、环境渲染、${partner.name}和NPC的心理描写与行为描写。保持原有剧情走向不变，只是让描写更加饱满。注意：不要过多描写用户的行为和心理，重点扩写${partner.name}、NPC的行为以及环境描写。
${getEraLanguageGuide(st.era)}

字数要求：${spacetimeSettings.minWords}-${spacetimeSettings.maxWords}字。

直接输出扩写后的内容，不要添加任何标签或格式。`;

            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: expandPrompt },
                    { role: 'user', content: '请扩写' }
                ], 0.9);
                const expanded = data.choices[0].message.content.trim();
                st.dialogHistory[msgIdx].text = expanded;
            } catch(e) {
                toast('扩写失败: ' + e.message, 'error');
            }

            st.generating = false;
            renderCouple();
        }

        // ==========================================
        // --- ERA LANGUAGE GUIDE (时代语言指南) ---
        // ==========================================
        function getEraLanguageGuide(era) {
            if (!era) return '';
            const yearStr = (era.year || '').toLowerCase();
            const nameStr = (era.name || '').toLowerCase();
            const descStr = (era.desc || '').toLowerCase();

            // 检测是否为古代/历史时空
            const ancientKeywords = ['唐', '宋', '元', '明', '清', '汉', '秦', '三国', '春秋', '战国', '古代', '古埃及', '中世纪', '罗马', '江户', '大航海', '武侠', '仙', '修真', '玄幻', '丝路', '长安', '洛阳', '建安', '天宝', '元禄', '前\\d+年', '公元前', '公元\\d+年'];
            const modernKeywords = ['现代', '当代', '2[0-9]{3}年', '赛博', '未来', '科幻', '末日'];

            const combined = yearStr + nameStr + descStr;
            const isAncient = ancientKeywords.some(kw => new RegExp(kw).test(combined));
            const isModern = modernKeywords.some(kw => new RegExp(kw).test(combined));

            if (isAncient && !isModern) {
                return `
【语言风格要求 - 极其重要】：
1. 角色的对话和称呼必须完全符合${era.year || '该时代'}的历史时期
2. 严禁使用任何现代用语、网络用语、现代称呼（如：老公、老婆、宝贝、亲爱的、先生、女士、OK、没问题等）
3. 必须使用该时代对应的称谓体系（如古代中国用：公子、姑娘、夫人、郎君、娘子、兄台、阁下等；日本用：殿、様、君等；西方中世纪用：阁下、大人、骑士等）
4. 对话语气、措辞、句式都必须符合时代特征
5. 不要出现任何穿越感（即角色不应该知道现代的事物、概念或用词）
6. 旁白和环境描写也要使用符合时代氛围的文笔`;
            }

            return '';
        }

        function getSpacetimeStyleGuide() {
            const styleName = spacetimeSettings.writingStyle || '沉浸小说';
            const styles = spacetimeSettings.customStyles || [];
            const styleObj = styles.find(s => s.name === styleName);
            const desc = styleObj ? styleObj.desc : `按照"${styleName}"的风格来写作。`;
            return `\n文风要求：${desc}`;
        }

        // --- LISTEN TOGETHER & MUSIC ---
        // Entry point: Open contact selector
        function openMusic() { 
            const list = document.getElementById('listen-contact-list');
            list.innerHTML = `
                <div class="list-item" onclick="startListenTogether(null)">
                    <div class="avatar" style="background:#333; display:flex; justify-content:center; align-items:center; color:#fff;"><i class="fas fa-user"></i></div>
                    <div class="list-content"><div class="list-title">独自聆听</div></div>
                    <i class="fas fa-chevron-right" style="color:#ddd;"></i>
                </div>
            `;
            
            const contacts = store.contacts.filter(c => !c.isGroup);
            contacts.forEach(c => {
                list.innerHTML += `
                    <div class="list-item" onclick="startListenTogether('${c.id}')">
                        <img src="${c.avatar}" class="avatar">
                        <div class="list-content"><div class="list-title">${c.name}</div></div>
                        <i class="fas fa-chevron-right" style="color:#ddd;"></i>
                    </div>
                `;
            });
            
            document.getElementById('modal-listen-contact').style.display = 'flex';
        }

        let listenTimerInterval = null;
        let listenLyricInterval = null;
        let currentListenPage = 0;

        // Swipe Logic (with touchmove follow-through for smooth feel)
        let listenTouchStartX = 0;
        let listenTouchStartY = 0;
        let listenIsDragging = false;
        let listenIsHorizontal = null;
        let listenCurrentX = 0;
        const listenSwipeContainer = document.getElementById('listen-swipe-container');
        const listenSwipeWrapper = document.getElementById('listen-swipe-wrapper');

        function _listenContainerW() { return listenSwipeContainer.offsetWidth || window.innerWidth; }

        listenSwipeContainer.addEventListener('touchstart', (e) => {
            listenTouchStartX = e.touches[0].clientX;
            listenTouchStartY = e.touches[0].clientY;
            listenCurrentX = listenTouchStartX;
            listenIsDragging = true;
            listenIsHorizontal = null;
            listenSwipeWrapper.style.transition = 'none';
        }, {passive: true});

        listenSwipeContainer.addEventListener('touchmove', (e) => {
            if (!listenIsDragging) return;
            const x = e.touches[0].clientX, y = e.touches[0].clientY;
            if (listenIsHorizontal === null) {
                const dx = Math.abs(x - listenTouchStartX), dy = Math.abs(y - listenTouchStartY);
                if (dx > 5 || dy > 5) {
                    listenIsHorizontal = dx > dy;
                    if (!listenIsHorizontal) { listenIsDragging = false; return; }
                } else { return; }
            }
            listenCurrentX = x;
            const diff = x - listenTouchStartX;
            const cw = _listenContainerW();
            const baseOffset = -currentListenPage * cw;
            let offset = baseOffset + diff;
            const maxOff = 0, minOff = -cw;
            if (offset > maxOff) offset = maxOff + (offset - maxOff) * 0.3;
            else if (offset < minOff) offset = minOff + (offset - minOff) * 0.3;
            const pct = (offset / (cw * 2)) * 100;
            listenSwipeWrapper.style.transform = `translate3d(${pct}%, 0, 0)`;
        }, {passive: true});

        listenSwipeContainer.addEventListener('touchend', (e) => {
            if (!listenIsDragging) { listenSwipeWrapper.style.transition = ''; return; }
            listenIsDragging = false;
            const endX = e.changedTouches[0].clientX;
            handleListenSwipe(endX);
        }, {passive: true});

        listenSwipeContainer.addEventListener('touchcancel', () => {
            listenIsDragging = false;
            listenSwipeWrapper.style.transition = '';
            listenSwipeWrapper.style.transform = `translate3d(-${currentListenPage * 50}%, 0, 0)`;
        });
        
        // Also support mouse swipe for desktop testing
        listenSwipeContainer.addEventListener('mousedown', (e) => {
            listenTouchStartX = e.clientX;
            listenTouchStartY = e.clientY;
            listenCurrentX = e.clientX;
            listenIsDragging = true;
            listenIsHorizontal = null;
            listenSwipeWrapper.style.transition = 'none';
        });
        listenSwipeContainer.addEventListener('mousemove', (e) => {
            if (!listenIsDragging) return;
            const x = e.clientX, y = e.clientY;
            if (listenIsHorizontal === null) {
                const dx = Math.abs(x - listenTouchStartX), dy = Math.abs(y - listenTouchStartY);
                if (dx > 5 || dy > 5) { listenIsHorizontal = dx > dy; if (!listenIsHorizontal) { listenIsDragging = false; return; } } else { return; }
            }
            listenCurrentX = x;
            const diff = x - listenTouchStartX;
            const cw = _listenContainerW();
            const baseOffset = -currentListenPage * cw;
            let offset = baseOffset + diff;
            const maxOff = 0, minOff = -cw;
            if (offset > maxOff) offset = maxOff + (offset - maxOff) * 0.3;
            else if (offset < minOff) offset = minOff + (offset - minOff) * 0.3;
            const pct = (offset / (cw * 2)) * 100;
            listenSwipeWrapper.style.transform = `translate3d(${pct}%, 0, 0)`;
        });
        listenSwipeContainer.addEventListener('mouseup', (e) => {
            if (!listenIsDragging) return;
            listenIsDragging = false;
            handleListenSwipe(e.clientX);
        });
        listenSwipeContainer.addEventListener('mouseleave', () => {
            if (listenIsDragging) { listenIsDragging = false; handleListenSwipe(listenCurrentX); }
        });

        function handleListenSwipe(endX) {
            // Block swipe when any overlay layer is visible
            if (document.querySelector('.layer.show')) {
                listenSwipeWrapper.style.transition = '';
                listenSwipeWrapper.style.transform = `translate3d(-${currentListenPage * 50}%, 0, 0)`;
                return;
            }
            const diffX = endX - listenTouchStartX;
            const threshold = _listenContainerW() * 0.15;
            
            if (Math.abs(diffX) > threshold) {
                if (diffX < 0 && currentListenPage === 0) {
                    currentListenPage = 1;
                } else if (diffX > 0 && currentListenPage === 1) {
                    currentListenPage = 0;
                }
            }
            listenSwipeWrapper.style.transition = '';
            listenSwipeWrapper.style.transform = `translate3d(-${currentListenPage * 50}%, 0, 0)`;
            document.querySelectorAll('.listen-dot').forEach((d, i) => {
                d.classList.toggle('active', i === currentListenPage);
            });
        }

        // 歌词页面滚动监听：用户手动滚动时暂停自动滚动
        (function initLyricsScrollListener() {
            const lyricsPage = document.getElementById('listen-lyrics-page');
            if (lyricsPage) {
                lyricsPage.addEventListener('touchstart', () => {
                    lyricsUserScrolling = true;
                    if (lyricsScrollTimer) clearTimeout(lyricsScrollTimer);
                }, {passive: true});
                lyricsPage.addEventListener('touchend', () => {
                    // 用户停止触摸后5秒恢复自动滚动
                    if (lyricsScrollTimer) clearTimeout(lyricsScrollTimer);
                    lyricsScrollTimer = setTimeout(() => {
                        lyricsUserScrolling = false;
                    }, 5000);
                }, {passive: true});
                // 鼠标滚轮也算手动滚动
                lyricsPage.addEventListener('wheel', () => {
                    lyricsUserScrolling = true;
                    if (lyricsScrollTimer) clearTimeout(lyricsScrollTimer);
                    lyricsScrollTimer = setTimeout(() => {
                        lyricsUserScrolling = false;
                    }, 5000);
                }, {passive: true});
            }
        })();

        function startListenTogether(partnerId) {
            document.getElementById('modal-listen-contact').style.display = 'none';
            
            store.listenState.active = true;
            store.listenState.partnerId = partnerId;
            store.listenState.minimized = false;
            store.listenState.startTime = Date.now();
            store.listenState.accumulatedTime = 0;
            
            // Reset Page
            currentListenPage = 0;
            updateListenPageUI();

            // Setup UI
            const meImg = document.getElementById('listen-avatar-me-img');
            const partnerImg = document.getElementById('listen-avatar-partner-img');
            const partnerBox = document.getElementById('listen-avatar-partner');
            const partnerName = document.getElementById('listen-partner-name');
            const myBox = document.getElementById('listen-avatar-me').parentElement; // Get container
            
            const listenPartner = partnerId ? store.contacts.find(x => x.id === partnerId) : null;
            meImg.src = getUserPersonaAvatar(listenPartner, store.user.avatar || _ph(80));
            
            // Sync Vinyl BG - use object-fit cover for proper circular cropping
            const vinyl = document.getElementById('listen-vinyl');
            if(store.listenState.vinylBg) {
                vinyl.style.backgroundImage = `url(${store.listenState.vinylBg})`;
                vinyl.style.backgroundSize = 'cover';
                vinyl.style.backgroundPosition = 'center center';
            }

            const wave = document.getElementById('listen-connect-wave');
            if (partnerId) {
                const c = store.contacts.find(x => x.id === partnerId);
                partnerImg.src = c.avatar;
                partnerBox.style.display = 'block';
                if(wave) wave.classList.add('active');
                
                // Reset positions
                document.getElementById('listen-avatar-me').classList.remove('me-center');
                document.getElementById('listen-avatar-me').style.transform = 'translate(-140%, 10px)';
                document.getElementById('listen-avatar-me').style.left = '50%';
                
                partnerName.innerText = `与 ${c.name} 一起听`;
            } else {
                partnerBox.style.display = 'none';
                if(wave) wave.classList.remove('active');
                document.getElementById('listen-avatar-me').style.transform = 'translate(-50%, 10px)'; 
                document.getElementById('listen-avatar-me').style.left = '50%';
                partnerName.innerText = '独自聆听';
            }
            
            document.getElementById('listen-player-modal').style.display = 'flex';
            document.getElementById('listen-float-ball').classList.remove('show');
            
            // Start Timer
            if(listenTimerInterval) clearInterval(listenTimerInterval);
            listenTimerInterval = setInterval(() => {
                store.listenState.accumulatedTime++;
                document.getElementById('listen-time-val').innerText = `已一起聆听 ${Math.floor(store.listenState.accumulatedTime / 60)} 分钟`;
                
                // Achievements
                const mins = Math.floor(store.listenState.accumulatedTime / 60);
                const badge = document.getElementById('listen-achievement');
                if(mins >= 60) badge.innerHTML = '<div class="achievement-badge"><i class="fas fa-medal"></i></div>';
                else badge.innerHTML = '';
            }, 1000);

            // 初始化UI但不自动播放，等用户点击播放按钮
            if(store.musics && store.musics.length > 0) {
                // 如果之前已经在播放，保持状态
                if(store.listenState.playing) {
                    updateListenUI();
                } else {
                    updateListenUI();
                }
                // Ensure lyrics are parsed and displayed if returning to active session
                if(store.musics[store.listenState.curMusicIdx]) {
                    parseLyrics(store.musics[store.listenState.curMusicIdx].lrc || '');
                }
            } else {
                updateListenUI();
            }
        }

        function toggleListenPage(targetPage) {
            if (targetPage !== undefined) {
                currentListenPage = targetPage;
            } else {
                currentListenPage = currentListenPage === 0 ? 1 : 0;
            }
            updateListenPageUI();
        }

        // 歌词页面用户手动滚动标记，防止自动滚动抢夺控制权
        let lyricsUserScrolling = false;
        let lyricsScrollTimer = null;

        function updateListenPageUI() {
            const wrapper = document.getElementById('listen-swipe-wrapper');
            wrapper.style.transition = '';
            wrapper.style.transform = `translate3d(-${currentListenPage * 50}%, 0, 0)`;
            
            document.querySelectorAll('.listen-dot').forEach((d, i) => {
                d.classList.toggle('active', i === currentListenPage);
            });
        }

        function closeListenPlayer() {
            document.getElementById('listen-player-modal').style.display = 'none';
            // Fix: also reset inline display style set by minimizeListenPlayer
            const floatBall = document.getElementById('listen-float-ball');
            floatBall.classList.remove('show');
            floatBall.style.display = 'none';
            store.listenState.active = false;
            store.listenState.minimized = false;
            
            const audio = document.getElementById('global-audio');
            audio.pause();
            store.listenState.playing = false;
            
            // Stop Breathe & Wave
            document.getElementById('listen-avatar-me').classList.remove('glow');
            document.getElementById('listen-avatar-partner').classList.remove('glow');
            const wave = document.getElementById('listen-connect-wave');
            if(wave) wave.classList.remove('active');
            
            if(listenTimerInterval) clearInterval(listenTimerInterval);
            if(listenLyricInterval) clearInterval(listenLyricInterval);
            listenTimerInterval = null;
            listenLyricInterval = null;
        }

        function minimizeListenPlayer() {
            document.getElementById('listen-player-modal').style.display = 'none';
            store.listenState.minimized = true;
            document.getElementById('listen-float-ball').classList.add('show');
            // Ensure float ball is visible by forcing style if needed, though class 'show' does transform
            document.getElementById('listen-float-ball').style.display = 'flex'; 
            updateFloatBall();
        }

        function maximizeListenPlayer() {
            const playerModal = document.getElementById('listen-player-modal');
            playerModal.style.display = 'flex';
            store.listenState.minimized = false;
            document.getElementById('listen-float-ball').classList.remove('show');
            // 恢复唱片背景
            const vinyl = document.getElementById('listen-vinyl');
            if(store.listenState.vinylBg) {
                vinyl.style.backgroundImage = `url(${store.listenState.vinylBg})`;
                vinyl.style.backgroundSize = 'cover';
                vinyl.style.backgroundPosition = 'center center';
            }
            // 恢复弹窗背景
            if(store.listenState.playerBg) {
                playerModal.style.backgroundImage = `url(${store.listenState.playerBg})`;
                playerModal.style.backgroundSize = 'cover';
                playerModal.style.backgroundPosition = 'center';
                playerModal.style.backgroundRepeat = 'no-repeat';
            }
            updateListenUI();
        }

        function updateFloatBall() {
            const ball = document.getElementById('listen-float-ball');
            const img = document.getElementById('listen-float-img');
            const info = document.getElementById('listen-float-info');
            
            if(store.listenState.playing) ball.classList.add('playing');
            else ball.classList.remove('playing');
            
            // Sync Vinyl BG to Float Ball - 使用独立的vinylBg
            const floatCover = store.listenState.vinylBg;
            if(floatCover) {
                img.src = floatCover;
            } else {
                img.src = 'https://png.pngtree.com/png-vector/20220623/ourmid/pngtree-vinyl-record-png-image_5323868.png';
            }
            
            const currentMusic = store.musics[store.listenState.curMusicIdx];
            info.innerText = currentMusic ? currentMusic.name : '未播放';
        }

        // Music Controls
        let tempMusicData = { url: '', name: '', lrc: '' };

        // 显示添加菜单：选择上传专辑图片还是上传歌曲
        function showListenAddMenu() {
            const existing = document.getElementById('listen-add-menu-modal');
            if (existing) existing.remove();
            const modal = document.createElement('div');
            modal.id = 'listen-add-menu-modal';
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:10001;display:flex;align-items:center;justify-content:center;';
            modal.innerHTML = `
                <div onclick="document.getElementById('listen-add-menu-modal').remove()" style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);"></div>
                <div style="position:relative;z-index:1;background:#fff;border-radius:16px;padding:20px;width:260px;box-shadow:0 8px 30px rgba(0,0,0,0.15);">
                    <div style="font-size:16px;font-weight:600;text-align:center;margin-bottom:16px;color:#333;">选择操作</div>
                    <div onclick="document.getElementById('listen-add-menu-modal').remove();openMusicUpload();" style="display:flex;align-items:center;gap:12px;padding:14px;background:#fafafa;border-radius:12px;cursor:pointer;margin-bottom:10px;transition:background 0.15s;">
                        <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:#333;font-size:20px;"><i class="fas fa-music"></i></div>
                        <div><div style="font-weight:500;font-size:14px;color:#333;">上传歌曲</div><div style="font-size:11px;color:#999;margin-top:2px;">添加音乐到播放列表</div></div>
                    </div>
                    <div onclick="document.getElementById('listen-add-menu-modal').remove();uploadVinylAlbumCover();" style="display:flex;align-items:center;gap:12px;padding:14px;background:#fafafa;border-radius:12px;cursor:pointer;margin-bottom:10px;transition:background 0.15s;">
                        <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:#333;font-size:20px;"><i class="fas fa-image"></i></div>
                        <div><div style="font-weight:500;font-size:14px;color:#333;">上传专辑图片</div><div style="font-size:11px;color:#999;margin-top:2px;">更换唱片封面图片</div></div>
                    </div>
                    <div onclick="document.getElementById('listen-add-menu-modal').remove();uploadListenPlayerBg();" style="display:flex;align-items:center;gap:12px;padding:14px;background:#fafafa;border-radius:12px;cursor:pointer;transition:background 0.15s;">
                        <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:#333;font-size:20px;"><i class="fas fa-palette"></i></div>
                        <div><div style="font-weight:500;font-size:14px;color:#333;">修改弹窗背景</div><div style="font-size:11px;color:#999;margin-top:2px;">更换一起听歌弹窗背景</div></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        window.showListenAddMenu = showListenAddMenu;

        // 独立上传专辑封面（不绑定歌曲）
        function uploadVinylAlbumCover() {
            const input = _createFileInput(function() {
                const file = input.files[0];
                if (input.parentNode) input.parentNode.removeChild(input);
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function(e) {
                    openVinylCropper(e.target.result);
                };
                reader.readAsDataURL(file);
            });
            setTimeout(() => input.click(), 50);
        }
        window.uploadVinylAlbumCover = uploadVinylAlbumCover;

        // [FIX-QQ浏览器兼容] 修正音频文件的data URL中可能错误的MIME类型
        // QQ浏览器文件管理器选取文件时可能返回空MIME或application/octet-stream，
        // 导致readAsDataURL生成的data URL无法被<audio>元素识别播放
        function _fixAudioDataUrl(dataUrl, fileName) {
            if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
            // 提取当前MIME类型
            var mimeMatch = dataUrl.match(/^data:([^;,]*)/);
            var currentMime = mimeMatch ? mimeMatch[1] : '';
            // 如果已经是正确的audio/*类型，无需修复
            if (currentMime.startsWith('audio/')) return dataUrl;
            // 根据文件扩展名推断正确的MIME类型
            var correctMime = 'audio/mpeg'; // 默认mp3
            if (fileName) {
                var ext = (fileName.toLowerCase().match(/\.([^.]+)$/) || [])[1] || '';
                var mimeMap = {
                    'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg',
                    'm4a': 'audio/mp4', 'flac': 'audio/flac', 'aac': 'audio/aac',
                    'wma': 'audio/x-ms-wma', 'webm': 'audio/webm', 'opus': 'audio/opus',
                    'amr': 'audio/amr', 'mid': 'audio/midi', 'midi': 'audio/midi'
                };
                if (mimeMap[ext]) correctMime = mimeMap[ext];
            }
            // 替换错误的MIME类型
            console.log('[FIX-Audio] 修正MIME类型: ' + currentMime + ' → ' + correctMime + (fileName ? ' (' + fileName + ')' : ''));
            return dataUrl.replace(/^data:[^;,]*/, 'data:' + correctMime);
        }

        function openMusicUpload() {
            tempMusicData = { url: '', name: '', lrc: '' }; // Reset
            document.getElementById('music-add-name').value = '';
            document.getElementById('music-add-url').value = '';
            document.getElementById('music-file-status').style.display = 'none';
            document.getElementById('lyrics-status').innerText = '未选择';
            const manualInput = document.getElementById('manual-lyrics-input');
            if (manualInput) { manualInput.style.display = 'none'; manualInput.value = ''; }
            // Reset vinyl preview in modal
            const vinylPreviewImg = document.getElementById('vinyl-preview-img');
            const vinylPreviewIcon = document.getElementById('vinyl-preview-icon');
            if (vinylPreviewImg) { vinylPreviewImg.style.display = 'none'; vinylPreviewImg.src = ''; }
            if (vinylPreviewIcon) vinylPreviewIcon.style.display = '';
            tempVinylFromModal = '';
            document.getElementById('modal-music').style.display = 'flex';
        }

        let tempVinylFromModal = '';
        function handleVinylUploadFromModal(input) {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                tempVinylFromModal = e.target.result;
                const vinylPreviewImg = document.getElementById('vinyl-preview-img');
                const vinylPreviewIcon = document.getElementById('vinyl-preview-icon');
                if (vinylPreviewImg) { vinylPreviewImg.src = tempVinylFromModal; vinylPreviewImg.style.display = 'block'; }
                if (vinylPreviewIcon) vinylPreviewIcon.style.display = 'none';
            };
            reader.readAsDataURL(file);
            input.value = '';
        }

        function toggleManualLyricsInput() {
            const ta = document.getElementById('manual-lyrics-input');
            if (!ta) return;
            if (ta.style.display === 'none' || !ta.style.display) {
                ta.style.display = 'block';
                ta.focus();
            } else {
                ta.style.display = 'none';
            }
        }

        function handleVinylUpload(input) {
            const file = input.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                openVinylCropper(e.target.result);
            };
            reader.readAsDataURL(file);
            input.value = '';
        }

        // 唱片圆形裁剪弹窗
        let vinylCropperInstance = null;
        function openVinylCropper(imgUrl) {
            const modal = document.getElementById('modal-vinyl-cropper');
            const img = document.getElementById('vinyl-cropper-img');
            img.src = imgUrl;
            modal.style.display = 'flex';
            
            if (vinylCropperInstance) vinylCropperInstance.destroy();
            
            // 等待图片加载后初始化裁剪器
            setTimeout(() => {
                vinylCropperInstance = new Cropper(img, {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 0.85,
                    dragMode: 'move',
                    cropBoxResizable: true,
                    cropBoxMovable: true,
                    guides: false,
                    center: true,
                    highlight: false,
                    background: false
                });
            }, 100);
        }

        function closeVinylCropper() {
            document.getElementById('modal-vinyl-cropper').style.display = 'none';
            window._songCoverTargetIdx = -1; // 清除歌曲封面目标
            if (vinylCropperInstance) {
                vinylCropperInstance.destroy();
                vinylCropperInstance = null;
            }
        }

        // 应用唱片封面到唱片UI（不绑定歌曲，独立的专辑卡片图片）
        function applyVinylCover(coverUrl) {
            store.listenState.vinylBg = coverUrl;
            const vinyl = document.getElementById('listen-vinyl');
            if (vinyl) {
                vinyl.style.backgroundImage = `url(${coverUrl})`;
                vinyl.style.backgroundSize = 'cover';
                vinyl.style.backgroundPosition = 'center center';
            }
        }

        function finishVinylCrop() {
            if (!vinylCropperInstance) return;
            const canvas = vinylCropperInstance.getCroppedCanvas({
                width: 300,
                height: 300,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });
            if (!canvas) return;

            // 创建圆形canvas
            const circleCanvas = document.createElement('canvas');
            circleCanvas.width = 300;
            circleCanvas.height = 300;
            const ctx = circleCanvas.getContext('2d');
            ctx.beginPath();
            ctx.arc(150, 150, 150, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(canvas, 0, 0, 300, 300);

            const finalUrl = circleCanvas.toDataURL('image/png', 0.9);
            
            // 检查是否是为特定歌曲更换封面
            if (typeof window._songCoverTargetIdx === 'number' && window._songCoverTargetIdx >= 0) {
                const targetIdx = window._songCoverTargetIdx;
                window._songCoverTargetIdx = -1;
                if (store.musics && store.musics[targetIdx]) {
                    store.musics[targetIdx].cover = finalUrl;
                }
                // [FIX] 如果更换的是当前正在播放的歌曲，同步更新唱片大图
                if (targetIdx === store.listenState.curMusicIdx) {
                    applyVinylCover(finalUrl);
                }
                save();
                closeVinylCropper();
                renderListenPlaylist();
                toast("歌曲封面已更换");
            } else {
                applyVinylCover(finalUrl);
                save();
                closeVinylCropper();
                toast("唱片封面已更换");
            }
        }

        function confirmAddMusic() {
            const name = document.getElementById('music-add-name').value || '未知歌曲';
            let url = (document.getElementById('music-add-url').value || '').trim();
            
            // Priority: Local File > URL Input
            if(tempMusicData.url) url = tempMusicData.url;
            
            if(!url) return toast("请上传文件或输入链接");
            
            // URL链接预处理：确保外部URL可以播放
            if(url.startsWith('http://') || url.startsWith('https://')) {
                // 尝试将常见音乐平台的分享链接转为直链（如果是直链则不变）
                url = url.split('?')[0].includes('.mp3') || url.split('?')[0].includes('.wav') || url.split('?')[0].includes('.ogg') || url.split('?')[0].includes('.m4a') || url.split('?')[0].includes('.flac') || url.split('?')[0].includes('.aac') ? url : url;
            }
            
            // 歌词优先级：上传的lrc文件 > 手动输入的歌词
            let lrcContent = tempMusicData.lrc || '';
            const manualLyrics = document.getElementById('manual-lyrics-input');
            if (!lrcContent && manualLyrics && manualLyrics.value.trim()) {
                lrcContent = manualLyrics.value.trim();
            }
            
            if(!store.musics) store.musics = [];
            const newSong = {
                name: name,
                url: url,
                lrc: lrcContent,
                cover: tempVinylFromModal || ''
            };
            store.musics.push(newSong);
            
            // 如果上传了专辑封面，应用到唱片（独立卡片图片）
            if (tempVinylFromModal) {
                applyVinylCover(tempVinylFromModal);
            }
            
            save();
            toast("音乐已添加");
            
            // 不自动播放，等用户点击播放按钮
            if(store.musics.length === 1) {
                store.listenState.curMusicIdx = 0;
                updateListenUI();
            }
            renderListenPlaylist();
            document.getElementById('modal-music').style.display='none';
        }

        // Modified play logic - optimized to reduce lag
        // [FIX-一起听播放v2] 增强音频源切换逻辑，彻底清除旧源防止残留，支持本地blob
        let _playMusicLock = false; // 防止快速连续切歌导致竞态
        function playListenMusic(idx) {
            if(!store.musics || store.musics.length === 0) return;
            if(idx < 0 || idx >= store.musics.length) return;
            
            // [FIX] 防止快速连续切歌竞态
            if (_playMusicLock) {
                console.log('[Listen] 切歌锁定中，跳过');
                return;
            }
            _playMusicLock = true;
            
            store.listenState.curMusicIdx = idx;
            const m = store.musics[idx];
            const audio = document.getElementById('global-audio');
            
            // [FIX] 检查音频URL是否有效（支持data:和blob:本地音频）
            if (!m.url || m.url.trim() === '') {
                toast('该歌曲没有有效的音频源', 'error');
                store.listenState.playing = false;
                updateListenUI();
                _playMusicLock = false;
                return;
            }
            
            // [FIX] 清除所有之前的事件监听，防止堆积
            audio.oncanplay = null;
            audio.onerror = null;
            audio.onloadeddata = null;
            audio.oncanplaythrough = null;
            
            // [FIX-一起听切歌v2] 先彻底停止并清除旧音频源
            try {
                audio.pause();
            } catch(e) {}
            audio.removeAttribute('src');
            audio.load(); // 强制清除旧缓冲区，防止旧音频残留
            
            // [FIX] 对外部URL设置crossOrigin，本地data:/blob:不设置
            const isExternalUrl = m.url.startsWith('http://') || m.url.startsWith('https://');
            const isLocalData = m.url.startsWith('data:') || m.url.startsWith('blob:');
            if(isExternalUrl) {
                audio.crossOrigin = 'anonymous';
            } else {
                audio.removeAttribute('crossOrigin');
            }
            
            // 立即更新UI（歌名等），不等音频加载
            parseLyrics(m.lrc || '');
            updateListenUI();
            renderListenPlaylist(); // [FIX] 同步更新播放列表高亮
            
            // [FIX] 使用短延迟确保旧源完全清除后再设置新源
            setTimeout(() => {
                // [FIX-QQ浏览器兼容] 播放前再次确保data URL的MIME类型正确
                var playUrl = m.url;
                if (playUrl && playUrl.startsWith('data:') && !playUrl.match(/^data:audio\//)) {
                    playUrl = _fixAudioDataUrl(playUrl, m.name);
                    m.url = playUrl; // 修正后回写，避免每次播放都修正
                    save();
                }
                audio.src = playUrl;
                
                // [FIX] 本地音频(data:/blob:)使用loadeddata事件，外部URL使用canplay
                const playEvent = isLocalData ? 'loadeddata' : 'canplay';
                
                const onReady = () => {
                    audio.removeEventListener('loadeddata', onReady);
                    audio.removeEventListener('canplay', onReady);
                    audio.removeEventListener('error', onError);
                    audio.play().then(() => {
                        store.listenState.playing = true;
                        updateListenUI();
                    }).catch(e => {
                        console.error('播放失败:', e);
                        // [FIX] 用户交互限制时，标记为暂停但不报错
                        if (e.name === 'NotAllowedError') {
                            toast('请点击播放按钮开始播放');
                            store.listenState.playing = false;
                        } else {
                            toast('播放失败，请检查音频文件', 'error');
                            store.listenState.playing = false;
                        }
                        updateListenUI();
                    });
                    _playMusicLock = false;
                };
                
                const onError = (e) => {
                    audio.removeEventListener('loadeddata', onReady);
                    audio.removeEventListener('canplay', onReady);
                    audio.removeEventListener('error', onError);
                    console.error('音频加载失败:', e);
                    _playMusicLock = false;
                    // [FIX-一起听断开] 加载失败时自动切下一首，而非静默停止
                    if(store.musics && store.musics.length > 1) {
                        toast('当前歌曲加载失败，自动切换下一首');
                        setTimeout(() => nextListenMusic(), 300);
                    } else {
                        toast('音频加载失败，请检查文件是否可用', 'error');
                        store.listenState.playing = false;
                        updateListenUI();
                    }
                };
                
                audio.addEventListener('loadeddata', onReady, { once: true });
                audio.addEventListener('canplay', onReady, { once: true });
                audio.addEventListener('error', onError, { once: true });
                
                // [FIX] 超时保护：5秒后如果还没触发，释放锁
                setTimeout(() => {
                    _playMusicLock = false;
                }, 5000);
                
            }, 80); // [FIX] 稍微增加延迟确保旧源完全清除
        }

        function toggleListenPlay() {
            const audio = document.getElementById('global-audio');
            const hasValidMusic = store.musics && store.musics.length > 0;
            const curIdx = store.listenState.curMusicIdx || 0;
            const curMusic = hasValidMusic ? store.musics[curIdx] : null;
            
            // [FIX-一起听播放v2] 更全面的音频源有效性检查
            const audioSrc = audio.src || '';
            const isEmptySrc = !audioSrc || audioSrc === '' || audioSrc === window.location.href || audioSrc === window.location.href.replace(/#.*$/, '');
            
            // [FIX] 检查当前音频源是否匹配当前歌曲（防止删除后残留）
            let srcMismatch = false;
            if (curMusic && !isEmptySrc) {
                // 对于data:和blob:URL，检查是否完全匹配
                // 对于http URL，检查路径是否匹配
                const curUrl = curMusic.url || '';
                if (curUrl.startsWith('data:') || curUrl.startsWith('blob:')) {
                    srcMismatch = (audioSrc !== curUrl);
                } else if (curUrl.startsWith('http')) {
                    // 外部URL：简单比较
                    srcMismatch = (audioSrc !== curUrl);
                }
            }
            
            // 如果没有音频源，或者源不匹配（删除后残留/切歌），重新加载
            if (isEmptySrc || srcMismatch) {
                if (hasValidMusic) {
                    playListenMusic(curIdx);
                    return;
                } else {
                    return toast('请先添加音乐');
                }
            }
            
            if(audio.paused) {
                audio.play().catch(e => {
                    console.warn('播放失败:', e);
                    // [FIX] 如果play失败（可能是源已失效），尝试重新加载
                    if (hasValidMusic) {
                        playListenMusic(curIdx);
                    }
                });
                store.listenState.playing = true;
            } else {
                audio.pause();
                store.listenState.playing = false;
            }
            // 立即更新按钮状态，不等回调
            const playBtn = document.getElementById('listen-play-icon');
            const vinyl = document.getElementById('listen-vinyl');
            if (playBtn) playBtn.className = store.listenState.playing ? 'fas fa-pause' : 'fas fa-play';
            if (vinyl) vinyl.classList.toggle('playing', store.listenState.playing);
            updateListenUI();
        }

        function prevListenMusic() {
            if(!store.musics || store.musics.length === 0) return;
            let newIdx = store.listenState.curMusicIdx - 1;
            if(newIdx < 0) newIdx = store.musics.length - 1;
            playListenMusic(newIdx);
        }

        function nextListenMusic() {
            if(!store.musics || store.musics.length === 0) return;
            let newIdx = store.listenState.curMusicIdx + 1;
            if(store.listenState.mode === 'random') {
                // [FIX] 随机模式避免连续播放同一首
                if (store.musics.length > 1) {
                    do {
                        newIdx = Math.floor(Math.random() * store.musics.length);
                    } while (newIdx === store.listenState.curMusicIdx);
                } else {
                    newIdx = 0;
                }
            } else if (newIdx >= store.musics.length) {
                newIdx = 0;
            }
            playListenMusic(newIdx);
        }
        
        function toggleListenMode() {
            const modes = ['order', 'random', 'loop'];
            let idx = modes.indexOf(store.listenState.mode);
            store.listenState.mode = modes[(idx + 1) % 3];
            updateListenUI();
            toast("模式: " + (store.listenState.mode==='order'?'顺序播放':(store.listenState.mode==='random'?'随机播放':'单曲循环')));
        }

        function seekListenMusic(e) {
            const bar = document.getElementById('listen-progress-bar');
            const audio = document.getElementById('global-audio');
            if(!audio.duration) return;
            
            const rect = bar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audio.currentTime = percent * audio.duration;
        }

        function updateListenUI() {
            const audio = document.getElementById('global-audio');
            const playBtn = document.getElementById('listen-play-icon');
            const vinyl = document.getElementById('listen-vinyl');
            const modeIcon = document.getElementById('listen-mode-icon');
            const meBox = document.getElementById('listen-avatar-me');
            const partnerBox = document.getElementById('listen-avatar-partner');
            
            // 唱片背景 - 使用独立的vinylBg（不绑定歌曲）
            const coverUrl = store.listenState.vinylBg;
            if(coverUrl) {
                vinyl.style.backgroundImage = `url(${coverUrl})`;
                vinyl.style.backgroundSize = 'cover';
                vinyl.style.backgroundPosition = 'center center';
            } else {
                vinyl.style.backgroundImage = '';
            }
            
            // Play/Pause state
            if(store.listenState.playing) {
                playBtn.className = 'fas fa-pause';
                vinyl.classList.add('playing');
                // Breath Effect for BOTH
                meBox.classList.add('glow');
                if(store.listenState.partnerId) partnerBox.classList.add('glow');
            } else {
                playBtn.className = 'fas fa-play';
                vinyl.classList.remove('playing');
                // Stop Breath
                meBox.classList.remove('glow');
                partnerBox.classList.remove('glow');
            }
            
            // Mode Icon
            if(store.listenState.mode === 'order') modeIcon.className = 'fas fa-list-ol';
            if(store.listenState.mode === 'random') modeIcon.className = 'fas fa-random';
            if(store.listenState.mode === 'loop') modeIcon.className = 'fas fa-redo';
            
            // Float ball
            updateFloatBall();
            
            // Update favorite icon
            updateListenFavIcon();
        }

        // Global Audio Events Hook
        const gAudio = document.getElementById('global-audio');
        // Cache DOM refs for time update to avoid repeated lookups
        const _listenFillEl = document.getElementById('listen-progress-fill');
        const _listenCurEl = document.getElementById('listen-cur-time');
        const _listenTotalEl = document.getElementById('listen-total-time');
        // Throttle ontimeupdate to reduce DOM thrashing (~4 updates/sec max)
        let _lastTimeUpdate = 0;
        let _lastFormattedCur = '';
        let _lastFormattedDur = '';
        gAudio.ontimeupdate = () => {
            const now = performance.now();
            if (now - _lastTimeUpdate < 250) return;
            _lastTimeUpdate = now;

            const cur = gAudio.currentTime;
            const dur = gAudio.duration || 1;
            const percent = Math.min(100, Math.max(0, (cur / dur) * 100));
            
            if (_listenFillEl) _listenFillEl.style.width = percent + '%';
            // 只在文本变化时更新DOM
            const fc = formatTime(cur);
            const fd = formatTime(dur);
            if (fc !== _lastFormattedCur) { _lastFormattedCur = fc; if (_listenCurEl) _listenCurEl.textContent = fc; }
            if (fd !== _lastFormattedDur) { _lastFormattedDur = fd; if (_listenTotalEl) _listenTotalEl.textContent = fd; }
            
            syncLyrics(cur);
        };
        gAudio.onended = () => {
            if(store.listenState.mode === 'loop') {
                gAudio.currentTime = 0;
                gAudio.play();
            } else {
                nextListenMusic();
            }
        };

        // [FIX-一起听断开] 全局音频错误处理：播放中出错自动切下一首
        gAudio.addEventListener('error', function() {
            if(store.listenState && store.listenState.active && store.listenState.playing) {
                console.warn('[Listen] 播放中音频出错，尝试切下一首');
                if(store.musics && store.musics.length > 1) {
                    setTimeout(() => nextListenMusic(), 500);
                } else {
                    store.listenState.playing = false;
                    updateListenUI();
                }
            }
        });

        // [FIX-一起听断开] 音频流中断(stalled)时尝试恢复
        gAudio.addEventListener('stalled', function() {
            if(store.listenState && store.listenState.active && store.listenState.playing && !gAudio.paused) {
                console.warn('[Listen] 音频流中断(stalled)，尝试恢复播放');
                // 尝试重新加载当前位置
                var curTime = gAudio.currentTime;
                try {
                    gAudio.load();
                    gAudio.currentTime = curTime;
                    gAudio.play().catch(function(){});
                } catch(e) {
                    console.warn('[Listen] stalled恢复失败:', e);
                }
            }
        });

        // [FIX-一起听断开] 页面从后台恢复时检查并恢复音频播放
        // 记录通话前的播放状态，用于通话结束后恢复
        var _listenWasPlayingBeforeCall = false;
        document.addEventListener('visibilitychange', function() {
            if(!document.hidden && store.listenState && store.listenState.active) {
                // 页面回到前台：如果状态标记为playing但音频实际暂停了，恢复播放
                if(store.listenState.playing && gAudio.paused && gAudio.src) {
                    console.log('[Listen] 页面回到前台，恢复音频播放');
                    gAudio.play().catch(function(e) {
                        console.warn('[Listen] 前台恢复播放失败:', e.message);
                        // NotAllowedError需要用户交互，不强制
                        if(e.name !== 'NotAllowedError') {
                            store.listenState.playing = false;
                            updateListenUI();
                        }
                    });
                }
            }
        });

        function formatTime(s) {
            const m = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
        }

        // Lyrics Logic
        function parseLyrics(lrcText) {
            store.listenState.lyrics = [];
            // 获取全屏歌词容器
            const containerFull = document.getElementById('listen-lyrics-full-content');
            
            if(!lrcText) {
                containerFull.innerHTML = '<div class="lyric-line-full active">暂无歌词</div>';
                return;
            }
            
            const lines = lrcText.split('\n');
            const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
            
            lines.forEach(line => {
                const match = line.match(regex);
                if(match) {
                    const min = parseInt(match[1]);
                    const sec = parseInt(match[2]);
                    const ms = parseInt(match[3]);
                    const text = match[4].trim();
                    if(text) {
                        store.listenState.lyrics.push({
                            time: min * 60 + sec + ms / 1000,
                            text: text
                        });
                    }
                }
            });
            
            // Render Full Page Lyrics
            containerFull.innerHTML = store.listenState.lyrics.map((l, i) => `<div class="lyric-line-full" id="lyric-full-${i}" onclick="seekToLyric(${l.time})">${l.text}</div>`).join('');
        }

        function seekToLyric(time) {
            const audio = document.getElementById('global-audio');
            if(audio && !isNaN(time)) {
                audio.currentTime = time;
                audio.play(); // Seek and play
                store.listenState.playing = true;
                updateListenUI();
            }
        }

        function syncLyrics(time) {
            if(!store.listenState.lyrics.length) return;
            
            let activeIdx = -1;
            for(let i = 0; i < store.listenState.lyrics.length; i++) {
                if(time >= store.listenState.lyrics[i].time) {
                    activeIdx = i;
                } else {
                    break;
                }
            }
            
            if(activeIdx !== -1 && activeIdx !== store.listenState.currentLine) {
                store.listenState.currentLine = activeIdx;
                
                // Update Full Page Lyrics
                document.querySelectorAll('.lyric-line-full').forEach(el => el.classList.remove('active'));
                const elFull = document.getElementById(`lyric-full-${activeIdx}`);
                if(elFull) {
                    elFull.classList.add('active');
                    // 只在用户没有手动滚动时才自动滚动歌词
                    // 使用容器相对滚动，避免scrollIntoView导致整个弹窗上移
                    if(!lyricsUserScrolling) {
                        const lyricsContainer = document.getElementById('listen-lyrics-page');
                        if(lyricsContainer) {
                            const containerRect = lyricsContainer.getBoundingClientRect();
                            const elRect = elFull.getBoundingClientRect();
                            const scrollTarget = lyricsContainer.scrollTop + (elRect.top - containerRect.top) - (containerRect.height / 2) + (elRect.height / 2);
                            lyricsContainer.scrollTo({ top: scrollTarget, behavior: 'smooth' });
                        }
                    }
                }
            }
        }

        function showMusicEmoji(emoji) {
            const area = document.getElementById('listen-emoji-area');
            const el = document.createElement('div');
            el.className = 'listen-emoji';
            el.innerText = emoji;
            el.style.left = (Math.random() * 80 + 10) + '%';
            el.style.bottom = '20%';
            area.appendChild(el);
            setTimeout(() => el.remove(), 2000);
        }

        // Playlist
        function toggleListenPlaylist() {
            const drawer = document.getElementById('listen-playlist-drawer');
            if(drawer.classList.contains('show')) {
                drawer.classList.remove('show');
                // Auto exit manage mode on close
                if (isListenPlaylistManageMode) toggleListenPlaylistManageMode();
            } else {
                renderListenPlaylist();
                drawer.classList.add('show');
            }
        }

        function toggleListenPlaylistManageMode() {
            isListenPlaylistManageMode = !isListenPlaylistManageMode;
            selectedPlaylistItems.clear();
            
            const manageBtn = document.getElementById('listen-playlist-manage-btn');
            const modeBtn = document.getElementById('listen-playlist-mode-btn');
            
            if(isListenPlaylistManageMode) {
                manageBtn.style.display = 'block';
                modeBtn.innerText = '取消';
            } else {
                manageBtn.style.display = 'none';
                modeBtn.innerText = '管理';
            }
            renderListenPlaylist();
        }

        function togglePlaylistItemSelection(idx) {
            if(selectedPlaylistItems.has(idx)) selectedPlaylistItems.delete(idx);
            else selectedPlaylistItems.add(idx);
            renderListenPlaylist();
        }

        function deleteSelectedPlaylistItems() {
            if(selectedPlaylistItems.size === 0) return toast("请选择要删除的歌曲");
            
            showConfirm("删除歌曲", `确定要删除选中的 ${selectedPlaylistItems.size} 首歌曲吗?`, () => {
                // [FIX-一起听批量删除] 检查是否包含当前播放的歌
                const deletingCurrent = selectedPlaylistItems.has(store.listenState.curMusicIdx);
                
                // Delete logic
                const sorted = Array.from(selectedPlaylistItems).sort((a,b) => b-a); // Descending
                sorted.forEach(idx => {
                    store.musics.splice(idx, 1);
                });
                
                // [FIX] 如果删除了当前播放的歌，停止并清除音频源
                if (deletingCurrent) {
                    const audio = document.getElementById('global-audio');
                    if (audio) {
                        audio.pause();
                        audio.removeAttribute('src');
                        audio.load();
                    }
                    store.listenState.playing = false;
                }
                
                // Adjust current playing index if needed
                if(store.listenState.curMusicIdx >= store.musics.length) {
                    store.listenState.curMusicIdx = 0;
                }
                
                save();
                toggleListenPlaylistManageMode(); // Exit manage mode
                renderListenPlaylist();
                updateListenUI();
                toast("删除成功");
            });
        }

        // Handle Long Press for Playlist Item
        let playlistLongPressTimer = null;
        function handlePlaylistTouchStart(idx) {
            playlistLongPressTimer = setTimeout(() => {
                if(!isListenPlaylistManageMode) {
                    toggleListenPlaylistManageMode();
                    togglePlaylistItemSelection(idx);
                }
            }, 600);
        }
        function handlePlaylistTouchEnd() {
            if(playlistLongPressTimer) clearTimeout(playlistLongPressTimer);
        }

        // 为指定歌曲更换封面
        let pendingCoverSongIdx = -1;
        function changeSongCover(idx, event) {
            if (event) event.stopPropagation();
            pendingCoverSongIdx = idx;
            // [FIX-播放列表封面上传v2] 每次都动态创建全新的 file input
            // 之前复用已有 input 会因残留 value 或移动端 WebView 限制导致点击无反应
            // [FIX-上传无反应] 移除 setTimeout 包装，保持 input.click() 在用户手势的同步调用栈中
            // 否则移动端浏览器/WebView 会因为脱离用户手势上下文而静默拦截文件选择器弹出
            var oldTmp = document.getElementById('song-cover-file-input-tmp');
            if (oldTmp && oldTmp.parentNode) oldTmp.parentNode.removeChild(oldTmp);
            var input = document.createElement('input');
            input.type = 'file';
            input.id = 'song-cover-file-input-tmp';
            input.accept = 'image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico';
            input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
            input.onchange = function() { handleSongCoverUpload(input); if (input.parentNode) input.parentNode.removeChild(input); };
            document.body.appendChild(input);
            input.click();
        }
        function handleSongCoverUpload(input) {
            const file = input.files[0];
            if (!file || pendingCoverSongIdx < 0) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                // 直接用裁剪器
                const savedIdx = pendingCoverSongIdx;
                pendingCoverSongIdx = -1;
                openSongCoverCropper(e.target.result, savedIdx);
            };
            reader.readAsDataURL(file);
            input.value = '';
        }
        function openSongCoverCropper(imgUrl, songIdx) {
            // 复用vinyl cropper，但完成后保存到指定歌曲
            window._songCoverTargetIdx = songIdx;
            openVinylCropper(imgUrl);
        }
        // [FIX-一起听上传] 把这三个函数暴露到 window，
        // 否则播放列表里 onclick="changeSongCover(...)" 和 <input onchange="handleSongCoverUpload(this)"> 在全局作用域找不到函数，点击封面按钮上传无效
        window.changeSongCover = changeSongCover;
        window.handleSongCoverUpload = handleSongCoverUpload;
        window.openSongCoverCropper = openSongCoverCropper;

        function renderListenPlaylist() {
            const list = document.getElementById('listen-playlist-content');
            const subColor = getComputedStyle(document.documentElement).getPropertyValue('--text-sub').trim() || '#777';
            list.innerHTML = store.musics.map((m, i) => {
                let content = '';
                const coverThumb = m.cover ? `<img src="${m.cover}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; margin-right:12px; flex-shrink:0;">` : `<div style="width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.15); margin-right:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center;"><i class="fas fa-music" style="font-size:14px; color:${subColor};"></i></div>`;
                if (isListenPlaylistManageMode) {
                    const isSelected = selectedPlaylistItems.has(i);
                    content = `
                        <div class="list-item" onclick="togglePlaylistItemSelection(${i})" style="background:transparent; border-bottom:1px solid rgba(255,255,255,0.1); padding:12px 0;">
                            <div style="margin-right:15px; width:20px; height:20px; border:1px solid ${subColor}; border-radius:4px; display:flex; justify-content:center; align-items:center; background:${isSelected?'var(--primary)':'transparent'}; border-color:${isSelected?'var(--primary)':subColor}">
                                ${isSelected ? '<i class="fas fa-check" style="font-size:12px; color:#fff;"></i>' : ''}
                            </div>
                            ${coverThumb}
                            <div style="color:var(--text-sub); flex:1; font-size:14px;">${m.name}</div>
                        </div>
                    `;
                } else {
                    content = `
                        <div class="list-item"
                             onclick="playListenMusic(${i})"
                             ontouchstart="handlePlaylistTouchStart(${i})"
                             ontouchend="handlePlaylistTouchEnd()"
                             onmousedown="if(event.button===0) handlePlaylistTouchStart(${i})"
                             onmouseup="handlePlaylistTouchEnd()"
                             style="background:transparent; border-bottom:1px solid rgba(255,255,255,0.1); padding:12px 0;">
                            ${coverThumb}
                            <div style="color:${i===store.listenState.curMusicIdx?'var(--primary)':'var(--text-sub)'}; flex:1; font-size:14px;">${m.name}</div>
                            <div onclick="changeSongCover(${i}, event)" style="padding:5px 8px; cursor:pointer;" title="更换封面"><i class="fas fa-image" style="color:${subColor}; font-size:14px;"></i></div>
                            <i class="fas fa-play" style="color:${subColor}; font-size:12px;"></i>
                        </div>
                    `;
                }
                return content;
            }).join('');
        }

        // Chat & Interactive
        async function sendListenChatFromModal(text) {
            if(!text) return;
            const input = document.getElementById('listen-bubble-input-me');
            input.value = text; // Show text in bubble
            
            // Partner reply simulation
            if(store.listenState.partnerId) {
                try {
                    const c = store.contacts.find(x => x.id === store.listenState.partnerId);
                    // 构建包含音乐上下文的提示
                    const music = store.musics && store.musics[store.listenState.curMusicIdx];
                    let musicInfo = '';
                    if (music) {
                        musicInfo = `\n你们正在一起听: 《${music.name}》`;
                        const lyrics = store.listenState.lyrics;
                        const curLine = store.listenState.currentLine;
                        if (lyrics && curLine >= 0 && curLine < lyrics.length) {
                            musicInfo += `\n当前歌词: "${lyrics[curLine].text}"`;
                        }
                    }
                    const data = await API.chatCompletion([
                        { role: 'system', content: `You are ${c.name}. Persona: ${c.persona}. You are listening to music with user.${musicInfo}\nUser said: "${text}". Reply in Chinese, briefly (max 20 Chinese characters).` },
                        { role: 'user', content: text }
                    ]);
                    const reply = (data.choices[0].message.content || '');
                    showBubblePartner(reply);
                } catch(e) {
                    console.error(e);
                }
            } else {
                toast("还没有邀请好友哦");
            }
        }

        function showBubblePartner(text) {
            // const b = document.getElementById('listen-bubble-partner');
            const t = document.getElementById('listen-bubble-text-partner');
            t.innerText = text;
            // b.style.display = 'block';
            
            // Reset to ellipsis
            setTimeout(() => {
                t.innerText = '...';
            }, 4000);
        }

        // --- STICKERS ---
        function openStickerGallery() {
            // Migration check
            if(!store.stickerCategories) {
                store.stickerCategories = [{id:'default', name:'默认', stickers:[{url:'😀', type:'emoji'}]}];
                if(store.stickers && store.stickers.length > 0) {
                     store.stickerCategories[0].stickers = store.stickerCategories[0].stickers.concat(store.stickers.filter(s=>s.url!=='😀'));
                }
                store.stickers = [];
                save();
            }
            
            // [FIX-管理模式] 每次打开图库时重置管理模式状态
            isStickerManageMode = false;
            selectedStickers.clear();
            const bar = document.getElementById('sticker-manage-bar');
            if (bar) bar.style.display = 'none';
            
            document.getElementById('layer-stickers').classList.add('show');
            renderStickerCategories();
        }

        function toggleStickerManageMode() {
            // [FIX-管理表情包] 先关闭菜单
            const menu = document.getElementById('sticker-menu');
            if (menu) menu.style.display = 'none';
            
            // [FIX-管理模式] 直接同步切换，不再使用setTimeout延迟
            isStickerManageMode = !isStickerManageMode;
            const bar = document.getElementById('sticker-manage-bar');
            
            if (isStickerManageMode) {
                if (bar) bar.style.display = 'flex';
                selectedStickers.clear();
            } else {
                if (bar) bar.style.display = 'none';
                selectedStickers.clear();
            }
            renderStickerGallery();
        }

        function toggleStickerSelection(idx) {
            if (selectedStickers.has(idx)) selectedStickers.delete(idx);
            else selectedStickers.add(idx);
            renderStickerGallery();
        }

        function deleteSelectedStickers() {
            if (selectedStickers.size === 0) return toast("请选择要删除的表情");
            showConfirm("删除表情", `确定删除选中的 ${selectedStickers.size} 个表情吗？`, () => {
                const cate = store.stickerCategories.find(c => c.id === activeStickerCateId);
                if (cate) {
                    // Filter out selected indices
                    // Sort indices desc to delete safely
                    const indices = Array.from(selectedStickers).sort((a, b) => b - a);
                    indices.forEach(i => cate.stickers.splice(i, 1));
                    
                    save();
                    toggleStickerManageMode(); // Exit manage mode
                    toast("删除成功");
                }
            });
        }
        
        function openStickerMenu(e) {
            e.stopPropagation();
            const el = document.getElementById('sticker-menu');
            document.querySelectorAll('.add-menu').forEach(m => { if(m.id !== el.id) m.style.display = 'none'; });
            el.style.display = el.style.display==='flex'?'none':'flex';
        }

        function addStickerCategoryPopup() {
            document.getElementById('modal-sticker-cate').style.display='flex';
            document.getElementById('sticker-menu').style.display='none';
        }
        
        function saveStickerCategory() {
            const n = document.getElementById('new-sticker-cate-name').value;
            if(!n) return toast("请输入分类名");
            if (!store.stickerCategories) store.stickerCategories = [];
            store.stickerCategories.push({id:'sc'+Date.now(), name:n, stickers:[]});
            save(); 
            renderStickerCategories(); 
            document.getElementById('modal-sticker-cate').style.display='none';
            toast("分类已创建");
        }

        function deleteStickerCategoryPopup() {
            document.getElementById('sticker-menu').style.display='none';
            if (!store.stickerCategories || store.stickerCategories.length <= 1) {
                return toast("至少保留一个分类", "error");
            }
            // 构建多选删除弹窗
            const cats = store.stickerCategories.filter(c => c.id !== 'default');
            if (cats.length === 0) return toast("没有可删除的分类", "error");
            let html = '<div style="max-height:300px;overflow-y:auto;">';
            cats.forEach(c => {
                html += `<label style="display:flex;align-items:center;padding:10px 4px;border-bottom:1px solid #f0f0f0;gap:10px;cursor:pointer;">
                    <input type="checkbox" value="${c.id}" style="width:18px;height:18px;accent-color:#fa5151;">
                    <span style="flex:1;font-size:14px;">${c.name}</span>
                    <span style="color:#999;font-size:12px;">${c.stickers.length}个表情</span>
                </label>`;
            });
            html += '</div>';
            const modal = document.getElementById('modal-confirm');
            document.getElementById('confirm-title').textContent = '删除分类（多选）';
            document.getElementById('confirm-text').innerHTML = html;
            
            const okBtn = document.getElementById('confirm-btn-ok');
            const cancelBtn = document.getElementById('confirm-btn-cancel');
            const newOk = okBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOk, okBtn);
            const newCancel = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
            newCancel.style.display = '';
            newCancel.onclick = () => { modal.style.display = 'none'; };
            newOk.textContent = '确定删除';
            newOk.onclick = () => {
                const checked = [...modal.querySelectorAll('input[type="checkbox"]:checked')].map(cb => cb.value);
                if (checked.length === 0) return toast("请至少选择一个分类");
                if (store.stickerCategories.length - checked.length < 1) return toast("至少保留一个分类", "error");
                store.stickerCategories = store.stickerCategories.filter(c => !checked.includes(c.id));
                if (checked.includes(activeStickerCateId)) {
                    activeStickerCateId = store.stickerCategories[0].id;
                }
                save();
                renderStickerCategories();
                renderStickerGallery();
                modal.style.display = 'none';
                toast(`已删除 ${checked.length} 个分类`);
            };
            modal.style.display = 'flex';
        }

        function addStickerPopup() {
            const s = document.getElementById('sticker-add-cate-sel');
            s.innerHTML = store.stickerCategories.map(c=>`<option value="${c.id}" ${c.id===activeStickerCateId?'selected':''}>${c.name}</option>`).join('');
            document.getElementById('modal-sticker').style.display='flex'; 
            document.getElementById('sticker-menu').style.display='none';
        }
        
        function showStickerInput(type) {
            document.getElementById('sticker-url-area').style.display = type==='url'?'block':'none';
            document.getElementById('sticker-local-area').style.display = type==='local'?'block':'none';
        }

        function clearStickerInput() {
            document.getElementById('sticker-url-in').value = '';
            toast("已清空");
        }
        
        function confirmAddSticker() {
            const targetCateId = document.getElementById('sticker-add-cate-sel').value;
            const cate = store.stickerCategories.find(c=>c.id===targetCateId);
            if(!cate) return;

            if(document.getElementById('sticker-url-area').style.display==='block') {
                const rawText = document.getElementById('sticker-url-in').value.trim();
                if(!rawText) return toast("请输入链接", "error");
                
                const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                let addedCount = 0;
                
                lines.forEach(line => {
                    let name = '';
                    let url = '';
                    
                    // 格式1: 名字+http链接
                    const plusMatch = line.match(/^(.+?)\+(https?:\/\/.+)$/i);
                    if (plusMatch) {
                        name = plusMatch[1].trim();
                        url = plusMatch[2].trim();
                    } else if (line.match(/^https?:\/\//i)) {
                        // 格式2: 纯URL链接，自动提取名字
                        url = line.trim();
                        name = extractStickerNameFromUrl(url);
                    } else {
                        // 尝试从行中提取http链接
                        const httpMatch = line.match(/(https?:\/\/\S+)/i);
                        if (httpMatch) {
                            url = httpMatch[1].trim();
                            name = line.replace(url, '').trim() || extractStickerNameFromUrl(url);
                        }
                    }
                    
                    if (url) {
                        cate.stickers.push({url: url, type: 'image', name: name || ''});
                        addedCount++;
                    }
                });
                
                if (addedCount === 0) return toast("未找到有效链接", "error");
                toast(`已添加 ${addedCount} 个表情包`);
            }
            save();
            if(activeStickerCateId === targetCateId) renderStickerGallery();
            document.getElementById('modal-sticker').style.display='none';
        }
        
        // 从URL中自动提取表情包名字
        function extractStickerNameFromUrl(url) {
            try {
                const pathname = new URL(url).pathname;
                const filename = pathname.split('/').pop();
                if (!filename) return '';
                // 去掉扩展名
                const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
                // 解码URL编码
                const decoded = decodeURIComponent(nameWithoutExt);
                // 清理常见无意义字符
                const cleaned = decoded.replace(/[_\-]+/g, ' ').replace(/\d{10,}/g, '').trim();
                return cleaned || '';
            } catch(e) {
                return '';
            }
        }
        
        function renderStickerCategories() {
            const sb = document.getElementById('sticker-categories');
            sb.innerHTML = '';
            store.stickerCategories.forEach(c => {
                sb.innerHTML += `<div class="sticker-cate-tab ${activeStickerCateId===c.id?'active':''}" onclick="switchStickerCate('${c.id}')">${c.name}</div>`;
            });
            renderStickerGallery();
        }
        
        function switchStickerCate(id) {
            activeStickerCateId = id;
            renderStickerCategories(); // Re-render to update active state
        }

        function renderStickerGallery() {
            const g = document.getElementById('sticker-gallery-grid'); 
            g.innerHTML='';
            const cate = store.stickerCategories.find(c=>c.id===activeStickerCateId);
            if(!cate) return;

            cate.stickers.forEach((s, idx) => {
                const item = document.createElement('div');
                item.className = 'sticker-item';
                item.style.position = 'relative';
                
                // 1. Render Sticker Content
                if (s.type === 'emoji') {
                    item.innerText = s.url;
                } else {
                    const img = document.createElement('img');
                    img.src = s.url;
                    item.appendChild(img);
                }

                // 2. Interaction Logic
                if (isStickerManageMode) {
                    const isSelected = selectedStickers.has(idx);
                    if (isSelected) {
                        item.style.border = '2px solid var(--primary)';
                        const check = document.createElement('div');
                        check.innerHTML = '<i class="fas fa-check"></i>';
                        check.style.cssText = 'position:absolute; top:0; right:0; background:var(--primary); color:#fff; border-radius:0 0 0 8px; padding:2px 5px; font-size:10px;';
                        item.appendChild(check);
                    }
                    // Overlay div to capture clicks in manage mode
                    const overlay = document.createElement('div');
                    overlay.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; z-index:10;';
                    overlay.onclick = () => toggleStickerSelection(idx);
                    item.appendChild(overlay);
                } else {
                    // Normal mode interaction - 仅在聊天界面打开时才发送，否则只是预览
                    const chatLayerOpen = document.getElementById('layer-chat')?.classList.contains('show');
                    if (chatLayerOpen && activeChatId) {
                        if (s.type === 'emoji') {
                            item.onclick = () => { if (isLongPress || _stickerContextMenuJustOpened) { isLongPress = false; return; } sendSticker(s.url, 'emoji', s.name); };
                        } else {
                            item.onclick = () => { if (isLongPress || _stickerContextMenuJustOpened) { isLongPress = false; return; } sendSticker(s.url, 'image', s.name); };
                        }
                    } else {
                        // 不在聊天中，点击只做预览（大图查看）
                        if (s.type !== 'emoji') {
                            item.onclick = () => { if (isLongPress || _stickerContextMenuJustOpened) { isLongPress = false; return; } showBigImg(s.url); };
                        } else {
                            item.onclick = () => { if (isLongPress || _stickerContextMenuJustOpened) { isLongPress = false; return; } };
                        }
                    }
                    
                    // Add Long Press Handlers
                    item.ontouchstart = (e) => handleStickerTouchStart(idx, e);
                    item.ontouchmove = handleStickerTouchMove;
                    item.ontouchend = (e) => handleStickerTouchEnd(e);
                    item.onmousedown = (e) => handleStickerMouseDown(idx, e);
                    item.onmouseup = handleStickerMouseUp;
                    item.oncontextmenu = (e) => e.preventDefault();
                }
                
                // Name label if it has a custom name or auto-recognized name
                const displayName = s.name || s.autoName;
                if(displayName) {
                    const nameLabel = document.createElement('div');
                    nameLabel.innerText = displayName;
                    nameLabel.style.cssText = `position:absolute; bottom:0; width:100%; background:${s.name ? 'rgba(0,0,0,0.5)' : 'rgba(0,100,200,0.5)'}; color:#fff; font-size:10px; text-align:center; padding:2px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; z-index: 5; pointer-events: none;`;
                    item.appendChild(nameLabel);
                }

                g.appendChild(item);
            });
        }

        // Sticker Long Press Logic
        function handleStickerTouchStart(idx, e) {
            isLongPress = false;
            selectedStickerIdx = idx;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                showStickerContextMenu(e.touches[0].clientX, e.touches[0].clientY);
            }, 500);
        }
        function handleStickerTouchMove() { clearTimeout(longPressTimer); }
        function handleStickerTouchEnd(e) {
            clearTimeout(longPressTimer);
            if (isLongPress) {
                e.preventDefault(); // 阻止长按后触发click事件
                isLongPress = false; // [FIX-点击残留] 长按结束后必须重置，否则下一次短按也会被误判拦截
            }
        }
        function handleStickerMouseDown(idx, e) {
            if(e.button !== 0) return;
            isLongPress = false;
            selectedStickerIdx = idx;
            longPressTimer = setTimeout(() => { 
                isLongPress = true; 
                showStickerContextMenu(e.clientX, e.clientY); 
            }, 500);
        }
        function handleStickerMouseUp() { clearTimeout(longPressTimer); }

        // [FIX-长按菜单] 保护标记，防止长按弹出的右键菜单被全局click handler立即关闭
        let _stickerContextMenuJustOpened = false;
        
        function showStickerContextMenu(x, y) {
            const menu = document.getElementById('sticker-context-menu');
            menu.style.display = 'flex';
            const rect = menu.getBoundingClientRect();
            
            let finalX = x;
            let finalY = y;
            if (finalX + rect.width > window.innerWidth) finalX = window.innerWidth - rect.width - 10;
            if (finalY + rect.height > window.innerHeight) finalY = window.innerHeight - rect.height - 10;
            
            menu.style.left = finalX + 'px';
            menu.style.top = finalY + 'px';
            
            // [FIX-长按菜单] 设置保护标记，延迟300ms后才允许被全局click handler关闭
            _stickerContextMenuJustOpened = true;
            setTimeout(() => { _stickerContextMenuJustOpened = false; }, 300);
        }

        function renameSticker() {
            const cate = store.stickerCategories.find(c => c.id === activeStickerCateId);
            if (!cate || selectedStickerIdx === null) return;
            
            const sticker = cate.stickers[selectedStickerIdx];
            document.getElementById('sticker-context-menu').style.display = 'none';
            showStickerRenamePopup(sticker);
        }

        // 手动命名表情包弹窗（替代prompt，兼容移动端）
        function showStickerRenamePopup(sticker, onDone) {
            const currentName = sticker.name || sticker.autoName || '';
            const previewHtml = sticker.type === 'emoji'
                ? `<div style="font-size:48px; text-align:center; margin-bottom:10px;">${sticker.url}</div>`
                : `<img src="${sticker.url}" style="max-width:120px; max-height:120px; border-radius:8px; display:block; margin:0 auto 10px auto;">`;
            
            const modal = document.createElement('div');
            modal.id = 'modal-sticker-rename';
            modal.className = 'modal-mask';
            modal.style.display = 'flex';
            modal.innerHTML = `<div class="modal-box" style="padding:20px; max-width:320px;">
                <h3 style="text-align:center; margin:0 0 12px 0;">手动命名表情包</h3>
                ${previewHtml}
                ${sticker.autoName ? `<div style="text-align:center; color:#999; font-size:12px; margin-bottom:8px;">AI识别: ${sticker.autoName}</div>` : ''}
                <input id="sticker-rename-input" type="text" value="${currentName.replace(/"/g, '&quot;')}" placeholder="输入表情包名称 (用于AI识别)" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; font-size:14px; box-sizing:border-box;">
                <div style="color:#999; font-size:11px; margin-top:6px;">手动命名后将覆盖AI识别名称</div>
                <div style="display:flex; gap:10px; margin-top:15px;">
                    <button onclick="closeStickerRenamePopup()" style="flex:1; padding:10px; border:1px solid #ddd; border-radius:8px; background:#f5f5f5; cursor:pointer;">取消</button>
                    <button onclick="confirmStickerRename()" style="flex:1; padding:10px; border:none; border-radius:8px; background:var(--primary, #07c160); color:#fff; cursor:pointer;">确定</button>
                </div>
            </div>`;
            document.body.appendChild(modal);
            
            // 保存回调和目标sticker引用
            modal._sticker = sticker;
            modal._onDone = onDone;
            
            // 自动聚焦输入框
            setTimeout(() => {
                const input = document.getElementById('sticker-rename-input');
                if (input) { input.focus(); input.select(); }
            }, 100);
        }

        function closeStickerRenamePopup() {
            const modal = document.getElementById('modal-sticker-rename');
            if (modal) {
                const onDone = modal._onDone;
                modal.remove();
                // 管理模式下取消也继续下一个表情的命名流程
                if (typeof onDone === 'function') onDone();
            }
        }

        function confirmStickerRename() {
            const modal = document.getElementById('modal-sticker-rename');
            if (!modal) return;
            const input = document.getElementById('sticker-rename-input');
            const newName = input ? input.value.trim() : '';
            const sticker = modal._sticker;
            const onDone = modal._onDone;
            
            if (sticker) {
                sticker.name = newName;
                save();
                renderStickerGallery();
                toast(newName ? "命名已更新" : "已清除命名");
            }
            modal.remove();
            if (typeof onDone === 'function') onDone();
        }

        // 管理模式下对选中的表情包逐个手动命名
        function renameSelectedStickers() {
            if (selectedStickers.size === 0) return toast("请选择要命名的表情");
            const cate = store.stickerCategories.find(c => c.id === activeStickerCateId);
            if (!cate) return;
            
            const indices = Array.from(selectedStickers).sort((a, b) => a - b);
            let currentIndex = 0;
            
            function renameNext() {
                if (currentIndex >= indices.length) {
                    toast(`已完成 ${indices.length} 个表情的命名`);
                    toggleStickerManageMode();
                    return;
                }
                const idx = indices[currentIndex];
                const sticker = cate.stickers[idx];
                if (!sticker) { currentIndex++; renameNext(); return; }
                
                showStickerRenamePopup(sticker, () => {
                    currentIndex++;
                    renameNext();
                });
            }
            renameNext();
        }

        // 自动识别未命名表情包内容（通过视觉API）
        async function autoRecognizeStickers(cateId) {
            const cate = store.stickerCategories.find(c => c.id === cateId);
            if (!cate || !cate.stickers || cate.stickers.length === 0) return;

            const unnamed = cate.stickers.filter(s => !s.name && !s.autoName && s.type !== 'emoji');
            if (unnamed.length === 0) {
                toast('所有表情都已命名');
                return;
            }

            toast(`正在识别 ${unnamed.length} 个未命名表情...`);

            // 批量处理，每次最多5个
            for (let i = 0; i < unnamed.length; i += 5) {
                const batch = unnamed.slice(i, i + 5);
                const promises = batch.map(async (sticker) => {
                    try {
                        let imgUrl = sanitizeImageUrl(sticker.url);
                        // [FIX-mimeType] 转换不支持的图片格式（如BMP/SVG等），避免API报mimeType错误
                        if (typeof isGifDataUrl === 'function' && isGifDataUrl(imgUrl)) {
                            try { imgUrl = await convertGifToPng(imgUrl); } catch(e) {}
                        }
                        if (typeof isUnsupportedImageMime === 'function' && isUnsupportedImageMime(imgUrl)) {
                            try {
                                const converted = await convertImageToPng(imgUrl);
                                if (converted) imgUrl = converted;
                                else { console.warn('表情识别: 图片格式不支持且转换失败, 跳过'); return; }
                            } catch(e) { return; }
                        }
                        const messages = [
                            { role: 'system', content: '你是表情包识别专家。请用3-10个中文字描述这个表情包的【含义和使用场景】，而不仅仅是画面内容。要求：\n1. 如果表情上有文字，直接用文字内容作为名字（最高优先级）\n2. 如果没有文字，描述格式为：角色形象+情绪/用途（如：猫猫无语、柴犬嘲讽、熊猫头生无可恋）\n3. 重点识别表情传达的情绪和聊天中的使用意图（如：表示无语、表示开心、表示嫌弃、表示撒娇、表示震惊、阴阳怪气等）\n4. 不要只描述画面动作，要理解meme文化含义（如竖中指=骂人/不爽，歪嘴=阴阳怪气，捂脸=尴尬/害羞）\n5. 只输出描述词，不要标点和其他内容\n示例：猫猫无语翻白眼、柴犬嘲讽笑、小人比心、熊猫头生无可恋、文字谢谢老板、狗头保命、歪嘴阴阳怪气、捂脸尴尬' },
                            { role: 'user', content: [
                                { type: 'text', text: '这个表情包在聊天中通常表达什么意思？用3-10个字概括它的含义和情绪' },
                                { type: 'image_url', image_url: { url: imgUrl } }
                            ]}
                        ];
                        const data = await API.chatCompletion(messages, { temperature: 0.3, silent: true, scene: 'sticker-recognize' });
                        if (data && data.choices && data.choices[0]) {
                            const name = (data.choices[0].message.content || '').trim().replace(/["""''。，！？、\s]/g, '').slice(0, 15);
                            sticker.autoName = name;
                        }
                    } catch (e) {
                        console.error('表情识别失败:', e);
                    }
                });
                await Promise.all(promises);
            }

            save();
            renderStickerGallery();
            const recognized = unnamed.filter(s => s.autoName).length;
            toast(`识别完成: ${recognized}/${unnamed.length} 个表情`);
        }

        function deleteSingleSticker() {
            const cate = store.stickerCategories.find(c => c.id === activeStickerCateId);
            if (!cate || selectedStickerIdx === null) return;
            
            showConfirm("删除表情", "确定要删除这个表情吗?", () => {
                cate.stickers.splice(selectedStickerIdx, 1);
                save();
                renderStickerGallery();
                toast("删除成功");
            });
            document.getElementById('sticker-context-menu').style.display = 'none';
        }
        
        function showBigImg(url) {
            document.getElementById('big-img-el').src = url;
            document.getElementById('modal-big-img').style.display = 'flex';
        }

        // --- PERCEPTION ---
        // 模拟大数据分析环境
        function analyzeEnvironment(city, dateStr, timeStr) {
            const now = dateStr ? new Date(dateStr) : new Date();
            const month = now.getMonth() + 1; // 1-12
            const hour = timeStr ? parseInt(timeStr.split(':')[0]) : new Date().getHours();
            
            // 1. 判断半球 (Big Data Simulation)
            const southCities = ['悉尼', '墨尔本', '里约', '开普敦', '布宜诺斯艾利斯', '奥克兰', '圣地亚哥'];
            const isSouth = southCities.some(c => city.includes(c));
            const hemisphere = isSouth ? '南半球' : '北半球';
            
            // 2. 季节判断 (Season Judgment)
            let season = '未知';
            if (isSouth) {
                if (month >= 9 && month <= 11) season = '春季';
                else if (month === 12 || month <= 2) season = '夏季';
                else if (month >= 3 && month <= 5) season = '秋季';
                else season = '冬季';
            } else {
                if (month >= 3 && month <= 5) season = '春季';
                else if (month >= 6 && month <= 8) season = '夏季';
                else if (month >= 9 && month <= 11) season = '秋季';
                else season = '冬季';
            }

            // 3. 时区推算 (Timezone Logic)
            let timezone = 'UTC+8'; // 默认国内
            if (city.includes('伦敦')) timezone = 'UTC+0';
            else if (city.includes('纽约') || city.includes('华盛顿')) timezone = 'UTC-5';
            else if (city.includes('洛杉矶') || city.includes('旧金山')) timezone = 'UTC-8';
            else if (city.includes('东京')) timezone = 'UTC+9';
            else if (city.includes('巴黎') || city.includes('柏林') || city.includes('罗马')) timezone = 'UTC+1';
            else if (city.includes('悉尼')) timezone = 'UTC+10';
            else if (city.includes('莫斯科')) timezone = 'UTC+3';
            else if (city.includes('迪拜')) timezone = 'UTC+4';

            // 4. 温度推算 (Temperature Estimation)
            let baseTemp = 20;
            if (season === '春季') baseTemp = 18;
            if (season === '夏季') baseTemp = 28;
            if (season === '秋季') baseTemp = 22;
            if (season === '冬季') baseTemp = 5;
            
            // 昼夜温差
            if (hour < 6 || hour > 20) baseTemp -= 5;
            else if (hour > 11 && hour < 15) baseTemp += 3;
            
            // 纬度/城市微调
            if (city.includes('哈尔滨') || city.includes('莫斯科')) baseTemp -= 15;
            if (city.includes('三亚') || city.includes('曼谷') || city.includes('新加坡')) baseTemp = 30;
            
            // 随机波动
            const temp = Math.floor(baseTemp + (Math.random() * 4 - 2));

            return {
                season,
                hemisphere,
                timezone,
                temp: temp + '°C'
            };
        }

        function savePerception() {
             const p = store.perception;
             p.master = document.getElementById('perc-master').checked;
             
             p.customDate = document.getElementById('perc-custom-date').checked;
             p.dateVal = document.getElementById('perc-date-val').value;
             
             p.customTime = document.getElementById('perc-custom-time').checked;
             p.timeVal = document.getElementById('perc-time-val').value;
             
             p.customCity = document.getElementById('perc-custom-city').checked;
             p.cityVal = document.getElementById('perc-city-val').value;
             p.realCityVal = document.getElementById('perc-real-city-val').value;
             
             p.customWeather = document.getElementById('perc-custom-weather').checked;
             p.weatherVal = document.getElementById('perc-weather-val').value;
             
             p.customTemp = document.getElementById('perc-custom-temp').checked;
             p.tempVal = document.getElementById('perc-temp-val').value;
             
             p.customClimate = document.getElementById('perc-custom-climate').checked;
             
             save();
             renderPerception();
        }

        function renderPerception() {
             const p = store.perception;
             
             let displayWeather = "未知";
             let displayTemp = "--";
             let displayLoc = "未知";
             let envData = { season: '--', hemisphere: '--', timezone: '--', temp: '--' };
             
             if (p.master) {
                 // 确定使用的地点和时间
                 const targetCity = (p.customCity && p.cityVal) ? p.cityVal : (p.realCityVal || '上海');
                 displayLoc = targetCity;
                 
                 const targetDate = (p.customDate && p.dateVal) ? p.dateVal : new Date().toISOString().split('T')[0];
                 const targetTime = (p.customTime && p.timeVal) ? p.timeVal : new Date().toTimeString().slice(0,5);
                 
                 // 调用“大数据”分析
                 envData = analyzeEnvironment(targetCity, targetDate, targetTime);
                 
                 if (p.customWeather && p.weatherVal) {
                     displayWeather = p.weatherVal;
                 } else {
                     displayWeather = p.weather || '晴朗';
                 }
                 
                 // 自定义温度优先
                 if (p.customTemp && p.tempVal) {
                     displayTemp = p.tempVal + '°C';
                 } else if (p.customWeather && !p.tempVal && !p.customTemp) {
                      // 如果只定义了天气没定义温度，用推算
                      displayTemp = envData.temp;
                 } else {
                     // 默认推算
                     displayTemp = envData.temp;
                 }
             } else {
                 displayWeather = "感知已关闭";
             }

             document.getElementById('perc-weather').innerText = displayWeather;
             document.getElementById('perc-weather-temp').innerText = displayTemp;
             document.getElementById('perc-loc').innerText = displayLoc;
             document.getElementById('perc-season').innerText = envData.season;
             document.getElementById('perc-hemisphere').innerText = envData.hemisphere;
             document.getElementById('perc-timezone').innerText = envData.timezone;

             // Controls
             document.getElementById('perc-master').checked = p.master;
             
             document.getElementById('perc-custom-date').checked = p.customDate;
             document.getElementById('perc-date-val').value = p.dateVal;
             document.getElementById('perc-date-val').disabled = !p.customDate;
             
             document.getElementById('perc-custom-time').checked = p.customTime;
             document.getElementById('perc-time-val').value = p.timeVal;
             document.getElementById('perc-time-val').disabled = !p.customTime;
             
             document.getElementById('perc-custom-city').checked = p.customCity;
             document.getElementById('perc-city-val').value = p.cityVal || '';
             document.getElementById('perc-real-city-val').value = p.realCityVal || '';
             document.getElementById('perc-city-val').disabled = !p.customCity;
             document.getElementById('perc-real-city-val').disabled = !p.customCity;

             document.getElementById('perc-custom-weather').checked = p.customWeather;
             document.getElementById('perc-weather-val').value = p.weatherVal || '';
             document.getElementById('perc-weather-val').disabled = !p.customWeather;

             document.getElementById('perc-custom-temp').checked = p.customTemp;
             document.getElementById('perc-temp-val').value = p.tempVal || '';
             document.getElementById('perc-temp-val').disabled = !p.customTemp;

             document.getElementById('perc-custom-climate').checked = p.customClimate;
             document.getElementById('perc-climate-val').innerText = p.climateVal || '点击选择';
             document.getElementById('perc-climate-val').style.color = p.customClimate ? '#333' : '#aaa';
             document.getElementById('perc-climate-val').style.pointerEvents = p.customClimate ? 'auto' : 'none';

             // Render calendar instead of old festival list
             renderCalendar();
        }

        // ========== 一键彻底还原所有美化 ==========
        // [FIX-CSS残留] 彻底清除所有美化相关的CSS、字体、气泡样式、主题设置
        function resetAllBeauty() {
            if (!confirm('确定要还原所有美化设置吗？\n\n将清除以下内容：\n• 自定义CSS（气泡/界面/线下模式）\n• 自定义字体\n• 气泡滑条样式\n• 全局主题（恢复默认）\n• 联系人独立美化\n\n此操作不可撤销！')) return;
            
            // === 1. [FIX-还原彻底] 彻底移除所有自定义CSS style标签（从DOM中删除，不留空壳） ===
            ['custom-style-bubble', 'custom-style-global', 'custom-style-offline'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
            
            // === 2. [FIX-还原彻底] 彻底移除联系人独立CSS style标签 ===
            ['contact-style-bubble', 'contact-style-global', 'contact-style-offline'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.remove();
            });
            
            // === 3. 清除气泡覆盖和预览 style标签 ===
            const bubbleOverride = document.getElementById('bubble-slider-override');
            if (bubbleOverride) bubbleOverride.innerHTML = '';
            const avatarPreview = document.getElementById('avatar-preview-override');
            if (avatarPreview) avatarPreview.remove();
            
            // === 4. 清除自定义字体 style标签 ===
            const fontStyle = document.getElementById('custom-font-style');
            if (fontStyle) fontStyle.remove();
            
            // === 5. 清除body上的标记class ===
            // [FIX-还原不了] 补充了 has-custom-global-css（之前遗漏）
            document.body.classList.remove('has-custom-bubble-css', 'has-custom-global-css', 'has-custom-offline-css');
            
            // === 6. 清除所有CSS变量（恢复默认） ===
            const root = document.documentElement.style;
            // 气泡相关
            root.removeProperty('--bubble-size');
            root.removeProperty('--bubble-padding');
            root.removeProperty('--bubble-spacing');
            root.removeProperty('--bubble-gap');
            root.removeProperty('--bubble-font-size');
            root.removeProperty('--avatar-size');
            root.removeProperty('--avatar-radius');
            root.removeProperty('--bubble-border');
            root.removeProperty('--bubble-border-me');
            root.removeProperty('--bubble-border-other');
            root.removeProperty('--bubble-radius');
            root.removeProperty('--bubble-left');
            root.removeProperty('--bubble-right');
            // 主题相关
            root.removeProperty('--text-main');
            root.removeProperty('--font-size-main');
            root.removeProperty('--text-sub');
            root.removeProperty('--font-size-sub');
            root.removeProperty('--text-desktop');
            root.removeProperty('--text-diary');
            root.removeProperty('--text-lockscreen');
            // 韩系/字体相关
            root.removeProperty('--kr-font');
            
            // === 7. 清除store中的所有美化数据 ===
            // [FIX-还原后切主题] 用空对象代替delete，防止后续代码读取undefined时判断出错
            store.customCSS = {};
            store.customFont = '';
            store.bubbleStyles = {};
            
            // === 8. 恢复默认主题 ===
            document.body.classList.remove('theme-cute', 'theme-korean', 'theme-mono');
            store.globalTheme = 'default';
            _enableDefaultTheme();
            
            // === 9. 清除联系人独立CSS数据 ===
            if (store.contacts) {
                store.contacts.forEach(c => {
                    if (c.settings && c.settings.contactCSS) {
                        delete c.settings.contactCSS;
                    }
                });
            }
            
            // === 10. 恢复主题颜色设置为默认 ===
            store.theme = {
                mainColor: '#111111', mainSize: '16px',
                subColor: '#999999', subSize: '13px',
                desktopTextColor: '#262626',
                diaryFontColor: '#333333',
                lockScreenTextColor: '#ffffff'
            };
            
            // === 11. 重置textarea为默认模板 ===
            const cssBubble = document.getElementById('css-bubble');
            const cssGlobal = document.getElementById('css-global');
            const cssOffline = document.getElementById('css-offline');
            const fontInput = document.getElementById('font-url-input');
            if (cssBubble) cssBubble.value = DEFAULT_BUBBLE_CSS;
            if (cssGlobal) cssGlobal.value = DEFAULT_GLOBAL_CSS;
            if (cssOffline) cssOffline.value = DEFAULT_OFFLINE_CSS;
            if (fontInput) fontInput.value = '';
            
            // === 12. 保存 ===
            // v11: 直接调用saveNow立即写入IDB（原子事务，不再需要单独同步LS Core）
            if (typeof window.saveNow === 'function') {
                window.saveNow();
            } else {
                save();
            }
            // [FIX-美化阴魂不散] 立即写入IDB，防止50ms防抖内用户刷新导致IDB仍是旧数据
            if (typeof _doSaveNow === 'function') _doSaveNow();
            // [FIX-退出重进消失] 还原时也清除localStorage热备份，防止下次启动恢复出已还原的数据
            try { localStorage.removeItem('YAN_customCSS_backup'); } catch(_e){}
            
            toast('已彻底还原所有美化设置 ✅', 'success');
        }
        
        // [FIX-滑条不生效] 暴露气泡美化函数到全局作用域
        // updateBubblePreview/applyBubbleStyles/resetBubbleStyles 已移至 app-calendar.js 中暴露
        window.resetAllBeauty = resetAllBeauty;
        window.restoreCSSBeforeImport = restoreCSSBeforeImport;
        // [FIX-美化包CSS不全] 暴露CSS处理函数到全局，供app-beauty-pack.js导入时调用
        window._autoImportant = _autoImportant;
        window._moveCustomStylesToEnd = _moveCustomStylesToEnd;

        // --- ICON SIZE CUSTOMIZATION ---
        function previewIconSize() {
            const appSize = document.getElementById('icon-size-slider').value;
            const dockSize = document.getElementById('dock-size-slider').value;
            const appNameSize = Math.max(10, Math.round(appSize * 0.2));
            const dockNameSize = Math.max(9, Math.round(dockSize * 0.22));

            document.getElementById('icon-size-val').innerText = appSize + 'px';
            document.getElementById('dock-size-val').innerText = dockSize + 'px';

            // Update preview
            const previewApp = document.getElementById('preview-app-icon');
            const previewDock = document.getElementById('preview-dock-icon');
            const previewAppName = document.getElementById('preview-app-name');
            const previewDockName = document.getElementById('preview-dock-name');
            const previewAppI = document.getElementById('preview-app-icon-i');
            const previewDockI = document.getElementById('preview-dock-icon-i');

            if (previewApp) {
                previewApp.style.width = appSize + 'px';
                previewApp.style.height = appSize + 'px';
                previewAppI.style.fontSize = Math.round(appSize * 0.5) + 'px';
            }
            if (previewDock) {
                previewDock.style.width = dockSize + 'px';
                previewDock.style.height = dockSize + 'px';
                previewDockI.style.fontSize = Math.round(dockSize * 0.48) + 'px';
            }
            if (previewAppName) previewAppName.style.fontSize = appNameSize + 'px';
            if (previewDockName) previewDockName.style.fontSize = dockNameSize + 'px';
        }

        function applyIconSize() {
            const appSize = parseInt(document.getElementById('icon-size-slider').value);
            const dockSize = parseInt(document.getElementById('dock-size-slider').value);
            const appNameSize = Math.max(10, Math.round(appSize * 0.2));
            const dockNameSize = Math.max(9, Math.round(dockSize * 0.22));

            const root = document.documentElement.style;
            root.setProperty('--app-icon-size', appSize + 'px');
            root.setProperty('--app-name-size', appNameSize + 'px');
            root.setProperty('--dock-icon-size', dockSize + 'px');
            root.setProperty('--dock-name-size', dockNameSize + 'px');

            if (!store.iconSize) store.iconSize = {};
            store.iconSize = { appSize, dockSize };
            save();
            toast('图标大小已应用', 'success');
        }

        function resetIconSize() {
            document.getElementById('icon-size-slider').value = 60;
            document.getElementById('dock-size-slider').value = 50;
            previewIconSize();

            const root = document.documentElement.style;
            root.setProperty('--app-icon-size', '60px');
            root.setProperty('--app-name-size', '12px');
            root.setProperty('--dock-icon-size', '50px');
            root.setProperty('--dock-name-size', '11px');

            if (store.iconSize) delete store.iconSize;
            save();
            toast('已重置为默认大小', 'info');
        }

        function loadIconSize() {
            if (store.iconSize) {
                const { appSize, dockSize } = store.iconSize;
                const appNameSize = Math.max(10, Math.round(appSize * 0.2));
                const dockNameSize = Math.max(9, Math.round(dockSize * 0.22));
                const root = document.documentElement.style;
                root.setProperty('--app-icon-size', appSize + 'px');
                root.setProperty('--app-name-size', appNameSize + 'px');
                root.setProperty('--dock-icon-size', dockSize + 'px');
                root.setProperty('--dock-name-size', dockNameSize + 'px');
            }
        }

        // --- BEAUTIFY ---
        function renderBeautify() {
             if(!store.appIcons) store.appIcons = { wechat:'', worldbook:'', couple:'', live:'', perception:'', checkphone:'', beauty:'', settings:'', map:'', shop:'', forum:'', mailbox:'', games:'', fanfic:'', study:'', paopao:'', fooddelivery:'', sms:'', spirit:'', 'penguin-video':'' };
             if(!store.appIcons.paopao) store.appIcons.paopao = '';
             if(!store.appIcons.fooddelivery) store.appIcons.fooddelivery = '';
             if(!store.appIcons.sms) store.appIcons.sms = '';
             if(!store.appIcons.live) store.appIcons.live = '';
             if(!store.appIcons.spirit) store.appIcons.spirit = '';
             if(!store.appIcons['penguin-video']) store.appIcons['penguin-video'] = '';
             
             const grid = document.getElementById('beautify-grid');
             if(!grid) return;

             // Load saved icon size into sliders
             if (store.iconSize) {
                 const sl1 = document.getElementById('icon-size-slider');
                 const sl2 = document.getElementById('dock-size-slider');
                 if (sl1) { sl1.value = store.iconSize.appSize || 60; }
                 if (sl2) { sl2.value = store.iconSize.dockSize || 50; }
                 previewIconSize();
             }

             const appNames = { wechat:'微信', couple:'情侣空间', live:'直播间', perception:'感知', checkphone:'查手机', beauty:'美化', settings:'设置', map:'地图', shop:'购物', forum:'论坛', mailbox:'邮箱', games:'游戏', fanfic:'同人', study:'学习', paopao:'泡泡', fooddelivery:'外卖', sms:'短信', spirit:'精灵', 'penguin-video':'企鹅视频', worldbook:'世界书' };
             grid.innerHTML =
                ['wechat','couple','live','perception','worldbook','spirit','penguin-video','checkphone','beauty','settings','map','shop','forum','mailbox','games','fanfic','study','paopao','fooddelivery','sms'].map(id => {
                    const icon = store.appIcons[id] || '';
                    // Fix: If icon exists, transparent bg. If not, grey bg. Using 100% 100% to ensure corner alignment
                    const style = icon ? `background-color:transparent; background-image:url(${icon}); background-size:100% 100%; background-position:center; background-repeat:no-repeat;` : 'background-color:#eee;';
                    return `<div style="display:flex; flex-direction:column; align-items:center;" onclick="changeAppIcon('${id}')">
                        <div style="width:50px; height:50px; border-radius:12px; ${style} display:flex; justify-content:center; align-items:center;">${icon?'':'<i class="fas fa-image" style="color:#aaa;"></i>'}</div>
                        <span style="font-size:12px; margin-top:5px;">${appNames[id] || id}</span>
                    </div>`;
                }).join('');
        }
        function changeAppIcon(id) {
            // 支持本地上传和链接上传两种方式
            const modal = document.getElementById('modal-confirm');
            document.getElementById('confirm-title').innerText = '修改图标';
            document.getElementById('confirm-text').innerText = '选择图标来源';
            modal.style.display = 'flex';

            const okBtn = document.getElementById('confirm-btn-ok');
            const cancelBtn = document.getElementById('confirm-btn-cancel');
            const newOkBtn = okBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOkBtn, okBtn);
            const newCancelBtn = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

            newOkBtn.innerText = '本地上传';
            newCancelBtn.innerText = '链接上传';
            newCancelBtn.style.background = '#576b95';
            newCancelBtn.style.color = '#fff';

            newOkBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                newCancelBtn.innerText = '取消';
                newCancelBtn.style.background = '';
                newCancelBtn.style.color = '';
                tempImgTarget = 'icon-'+id;
                document.getElementById('file-input').click();
            });
            newCancelBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                newCancelBtn.innerText = '取消';
                newCancelBtn.style.background = '';
                newCancelBtn.style.color = '';
                showPromptModal('请输入图标图片链接:', '').then(function(url) {
                    if (url && url.trim()) {
                        if(!store.appIcons) store.appIcons = {};
                        store.appIcons[id] = url.trim();
                        _saveImageNow();
                        renderBeautify();
                        renderDesktop();
                        toast('图标已更新');
                    }
                });
            });
        }

        // --- RESET/RESTORE FUNCTIONS ---
        window.resetDesktopWallpaper = function() {
            if (!confirm('确定还原主屏幕壁纸？')) return;
            store.desktopBg = '';
            document.getElementById('layer-desktop').style.removeProperty('background-image');
            save();
            renderDesktop();
            toast('主屏幕壁纸已还原 ✅', 'success');
        };
        window.resetAllAppIcons = function() {
            if (!confirm('确定还原所有应用图标为默认？')) return;
            store.appIcons = { wechat:'', worldbook:'', couple:'', live:'', perception:'', checkphone:'', beauty:'', settings:'', map:'', shop:'', forum:'', mailbox:'', games:'', fanfic:'', study:'', paopao:'', fooddelivery:'', sms:'', spirit:'', 'penguin-video':'' };
            save();
            renderBeautify();
            renderDesktop();
            toast('所有应用图标已还原 ✅', 'success');
        };
        window.resetDesktopAll = function() {
            if (!confirm('确定还原壁纸和所有应用图标？此操作不可撤销！')) return;
            store.desktopBg = '';
            store.appIcons = { wechat:'', worldbook:'', couple:'', live:'', perception:'', checkphone:'', beauty:'', settings:'', map:'', shop:'', forum:'', mailbox:'', games:'', fanfic:'', study:'', paopao:'', fooddelivery:'', sms:'', spirit:'', 'penguin-video':'' };
            document.getElementById('layer-desktop').style.removeProperty('background-image');
            save();
            renderBeautify();
            renderDesktop();
            toast('壁纸和图标已全部还原 ✅', 'success');
        };

        // --- THEME ---
        function applyTheme(themeToApply) {
            const root = document.documentElement.style;
            root.setProperty('--text-main', themeToApply.mainColor);
            root.setProperty('--font-size-main', themeToApply.mainSize);
            root.setProperty('--text-sub', themeToApply.subColor);
            root.setProperty('--font-size-sub', themeToApply.subSize);
            root.setProperty('--text-desktop', themeToApply.desktopTextColor || '#262626');
            root.setProperty('--text-diary', themeToApply.diaryFontColor || '#333333');
            root.setProperty('--text-lockscreen', themeToApply.lockScreenTextColor || '#ffffff');
            
            // Apply lock screen text color
            const lockTimeEl = document.querySelector('.lock-screen-time');
            const lockDateEl = document.querySelector('.lock-screen-date');
            const lockSwipeEl = document.querySelector('.lock-screen-swipe-hint');
            const lsColor = themeToApply.lockScreenTextColor || '#ffffff';
            if (lockTimeEl) lockTimeEl.style.color = lsColor;
            if (lockDateEl) lockDateEl.style.color = lsColor;
            if (lockSwipeEl) lockSwipeEl.style.color = lsColor;
        }

        function loadTheme() {
            if (!store.theme) {
                 store.theme = {
                    mainColor: '#111111', mainSize: '16px',
                    subColor: '#777777', subSize: '14px',
                    desktopTextColor: '#262626',
                    diaryFontColor: '#333333',
                    lockScreenTextColor: '#ffffff'
                };
            }
            applyTheme(store.theme);
            // also update the input controls in settings
            document.getElementById('theme-main-color').value = store.theme.mainColor;
            document.getElementById('theme-main-size').value = parseInt(store.theme.mainSize);
            document.getElementById('theme-main-size-val').textContent = store.theme.mainSize;
            document.getElementById('theme-sub-color').value = store.theme.subColor;
            document.getElementById('theme-sub-size').value = parseInt(store.theme.subSize);
            document.getElementById('theme-sub-size-val').textContent = store.theme.subSize;
            document.getElementById('theme-desktop-color').value = store.theme.desktopTextColor || '#262626';
            document.getElementById('theme-diary-color').value = store.theme.diaryFontColor || '#333333';
            document.getElementById('theme-lockscreen-color').value = store.theme.lockScreenTextColor || '#ffffff';
        }

        function saveTheme() {
            store.theme.mainColor = document.getElementById('theme-main-color').value;
            store.theme.mainSize = document.getElementById('theme-main-size').value + 'px';
            store.theme.subColor = document.getElementById('theme-sub-color').value;
            store.theme.subSize = document.getElementById('theme-sub-size').value + 'px';
            store.theme.desktopTextColor = document.getElementById('theme-desktop-color').value;
            store.theme.diaryFontColor = document.getElementById('theme-diary-color').value;
            store.theme.lockScreenTextColor = document.getElementById('theme-lockscreen-color').value;
            applyTheme(store.theme);
            save();
            toast("主题已保存");
        }
        
        function resetTheme() {
             const defaultTheme = {
                mainColor: '#111111', mainSize: '16px',
                subColor: '#777777', subSize: '14px',
                desktopTextColor: '#262626',
                diaryFontColor: '#333333',
                lockScreenTextColor: '#ffffff'
            };
            store.theme = defaultTheme;
            loadTheme(); // this will apply and update controls
            save();
            toast("主题已重置");
        }

        // --- DATA MGMT ---

        // ===== 选择性导出 =====
        function showExportModal() {
            // 重置所有选项为未选中
            document.querySelectorAll('.export-cat-item').forEach(item => {
                item.dataset.selected = '0';
                const chk = item.querySelector('.export-cat-chk');
                const ico = chk && chk.querySelector('.fas.fa-check');
                if (chk) { chk.style.background = 'transparent'; chk.style.borderColor = '#ccc'; }
                if (ico) ico.style.display = 'none';
            });
            // 重置全选
            const allChk = document.getElementById('export-chk-all');
            const allDot = document.getElementById('export-chk-all-dot');
            if (allChk) { allChk.style.background = 'transparent'; allChk.style.borderColor = '#aaa'; }
            if (allDot) allDot.style.display = 'none';
            document.getElementById('modal-export-select').style.display = 'flex';
        }

        function toggleExportAll(el) {
            const allChk = document.getElementById('export-chk-all');
            const allDot = document.getElementById('export-chk-all-dot');
            const isSelected = allDot && allDot.style.display !== 'none';
            if (isSelected) {
                if (allChk) { allChk.style.background = 'transparent'; allChk.style.borderColor = '#aaa'; }
                if (allDot) allDot.style.display = 'none';
                document.querySelectorAll('.export-cat-item').forEach(item => {
                    item.dataset.selected = '0';
                    const chk = item.querySelector('.export-cat-chk');
                    const ico = chk && chk.querySelector('.fas.fa-check');
                    if (chk) { chk.style.background = 'transparent'; chk.style.borderColor = '#ccc'; }
                    if (ico) ico.style.display = 'none';
                });
            } else {
                if (allChk) { allChk.style.background = '#111'; allChk.style.borderColor = '#111'; }
                if (allDot) allDot.style.display = 'block';
                document.querySelectorAll('.export-cat-item').forEach(item => {
                    item.dataset.selected = '1';
                    const chk = item.querySelector('.export-cat-chk');
                    const ico = chk && chk.querySelector('.fas.fa-check');
                    if (chk) { chk.style.background = '#111'; chk.style.borderColor = '#111'; }
                    if (ico) ico.style.display = 'block';
                });
            }
        }

        function toggleExportCat(el) {
            const isSelected = el.dataset.selected === '1';
            const chk = el.querySelector('.export-cat-chk');
            const ico = chk && chk.querySelector('.fas.fa-check');
            if (isSelected) {
                el.dataset.selected = '0';
                if (chk) { chk.style.background = 'transparent'; chk.style.borderColor = '#ccc'; }
                if (ico) ico.style.display = 'none';
                // 取消全选状态
                const allChk = document.getElementById('export-chk-all');
                const allDot = document.getElementById('export-chk-all-dot');
                if (allChk) { allChk.style.background = 'transparent'; allChk.style.borderColor = '#aaa'; }
                if (allDot) allDot.style.display = 'none';
            } else {
                el.dataset.selected = '1';
                if (chk) { chk.style.background = '#111'; chk.style.borderColor = '#111'; }
                if (ico) ico.style.display = 'block';
            }
        }

        function doSelectiveExport() {
            const allDot = document.getElementById('export-chk-all-dot');
            const isAll = allDot && allDot.style.display !== 'none';

            const selectedKeys = [];
            document.querySelectorAll('.export-cat-item').forEach(item => {
                if (item.dataset.selected === '1') selectedKeys.push(item.dataset.key);
            });

            if (!isAll && selectedKeys.length === 0) {
                return toast('请至少选择一个导出类别', 'error');
            }

            try {
                let exportObj = {};

                if (isAll) {
                    // [FIX-导出解析] 安全序列化：处理循环引用和超大base64
                    const seen = new WeakSet();
                    exportObj = JSON.parse(JSON.stringify(store, function(key, value) {
                        if (typeof value === 'object' && value !== null) {
                            if (seen.has(value)) return '[Circular]';
                            seen.add(value);
                        }
                        if (typeof value === 'string' && value.length > 2 * 1024 * 1024 && value.startsWith('data:image')) {
                            return value.substring(0, 100) + '...[图片数据过大已裁剪]';
                        }
                        return value;
                    }));
                } else {
                    selectedKeys.forEach(key => {
                        switch(key) {
                            case 'chats':
                                exportObj.chats = store.chats || {};
                                exportObj.offlineChats = store.offlineChats || {};
                                exportObj.ticketWallet = store.ticketWallet || {};
                                break;
                            case 'contacts':
                                exportObj.contacts = store.contacts || [];
                                exportObj.contactGroups = store.contactGroups || [];
                                exportObj.categories = store.categories || [];
                                break;
                            case 'moments':
                                exportObj.moments = store.moments || [];
                                break;
                            case 'diaries':
                                exportObj.diaries = store.diaries || {};
                                break;
                            case 'worldbooks':
                                exportObj.worldbooks = store.worldbooks || [];
                                break;
                            case 'memorySummaries':
                                exportObj.memorySummaries = store.memorySummaries || {};
                                // [FIX-记忆导出] 同时导出新分层记忆系统数据，防止导入后记忆丢失
                                if (store.memorySystem) {
                                    exportObj.memorySystem = store.memorySystem;
                                }
                                break;
                            case 'system':
                                exportObj.user = store.user;
                                exportObj.system = store.system;
                                exportObj.theme = store.theme;
                                exportObj.stt = store.stt;
                                exportObj.imgGen = store.imgGen;
                                exportObj.apiPresets = store.apiPresets || [];
                                exportObj.personas = store.personas || [];
                                exportObj.perception = store.perception;
                                break;
                            case 'forum':
                                exportObj.forumPosts = store.forumPosts || [];
                                exportObj.forumNotifs = store.forumNotifs || [];
                                exportObj.forumDMs = store.forumDMs || {};
                                exportObj.forumProfile = store.forumProfile;
                                exportObj.forumSettings = store.forumSettings;
                                exportObj.forumAccounts = store.forumAccounts || [];
                                exportObj.forumSections = store.forumSections || [];
                                break;
                            case 'musics':
                                exportObj.musics = store.musics || [];
                                exportObj.favoriteSongs = store.favoriteSongs || [];
                                exportObj.listenState = store.listenState;
                                break;
                            case 'desktop':
                                exportObj.appIcons = store.appIcons;
                                exportObj.desktopBg = store.desktopBg;
                                exportObj.globalWallpapers = store.globalWallpapers;
                                exportObj.page2 = store.page2;
                                exportObj.compStyles = store.compStyles;
                                exportObj.layoutOrder = store.layoutOrder;
                                exportObj.floatBall = store.floatBall;
                                exportObj.bubbleStyles = store.bubbleStyles;
                                exportObj.customCSS = store.customCSS;
                                exportObj.customFont = store.customFont;
                                exportObj.fontPresets = store.fontPresets || [];
                                exportObj.cssPresets = store.cssPresets || { bubble: {}, global: {}, offline: {} };
                                break;
                            case 'shop':
                                exportObj.shopProducts = store.shopProducts || [];
                                exportObj.shopCart = store.shopCart || [];
                                exportObj.shopOrders = store.shopOrders || [];
                                exportObj.bills = store.bills || [];
                                break;
                            case 'couple':
                                exportObj.couple = store.couple;
                                exportObj.coupleSpaces = store.coupleSpaces || [];
                                break;
                            case 'desktopStyle':
                                exportObj.desktopBg = store.desktopBg;
                                exportObj.globalWallpapers = store.globalWallpapers;
                                exportObj.compStyles = store.compStyles;
                                exportObj.bubbleStyles = store.bubbleStyles;
                                exportObj.customCSS = store.customCSS;
                                exportObj.customFont = store.customFont;
                                exportObj.fontPresets = store.fontPresets || [];
                                exportObj.cssPresets = store.cssPresets || { bubble: {}, global: {}, offline: {} };
                                exportObj.theme = store.theme;
                                break;
                        }
                    });
                    exportObj._exportType = 'selective';
                    exportObj._exportKeys = selectedKeys;
                    exportObj._exportTime = new Date().toISOString();
                }

                // [FIX-导出解析] 安全序列化：清理控制字符防止JSON损坏
                const dataStr = JSON.stringify(exportObj, function(key, value) {
                    if (typeof value === 'string') {
                        return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
                    }
                    return value;
                });
                const keyLabelMap = {
                    chats:'Chats', contacts:'Contacts', moments:'Moments',
                    diaries:'Diaries', worldbooks:'Worldbooks', memorySummaries:'Memory',
                    system:'Settings', forum:'Forum', musics:'Musics',
                    desktop:'Desktop', shop:'Shop', couple:'Couple',
                    desktopStyle:'DesktopStyle'
                };
                const keyLabel = isAll ? 'All' : selectedKeys.map(k => keyLabelMap[k] || k).join('-');
                const filename = `AIChatOS_Export_${keyLabel}_${new Date().toISOString().slice(0,10)}.json`;

                document.getElementById('modal-export-select').style.display = 'none';

                const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
                if (isCapacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FileExport) {
                    toast('正在准备导出...');
                    _exportChunked(dataStr, filename);
                    return;
                }
                const isAndroidWebView = /wv|WebView/.test(navigator.userAgent);
                if (isAndroidWebView) {
                    _exportFallbackShare(dataStr, filename);
                    return;
                }
                const blob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                setTimeout(() => {
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(url), 60000);
                    toast('导出已触发 ✅', 'success');
                }, 100);
            } catch(e) {
                console.error('Selective export failed:', e);
                toast('导出失败: ' + e.message, 'error');
            }
        }

        // ===== 选择性清理 =====
        let _currentCleanType = 'chat';

        function showCleanDataModal() {
            _currentCleanType = 'chat';
            ['chat','images','memory','moments'].forEach(t => {
                const btn = document.getElementById('clean-type-btn-' + t);
                if (btn) {
                    if (t === 'chat') {
                        btn.style.background = '#111'; btn.style.color = '#fff';
                        btn.style.border = '1.5px solid #111';
                    } else {
                        btn.style.background = 'transparent'; btn.style.color = '#555';
                        btn.style.border = '1.5px solid rgba(0,0,0,0.12)';
                    }
                }
            });
            document.getElementById('modal-clean-data').style.display = 'flex';
            _renderCleanList();
        }

        function switchCleanType(type) {
            _currentCleanType = type;
            ['chat','images','memory','moments'].forEach(t => {
                const btn = document.getElementById('clean-type-btn-' + t);
                if (btn) {
                    if (t === type) {
                        btn.style.background = '#111'; btn.style.color = '#fff';
                        btn.style.border = '1.5px solid #111';
                    } else {
                        btn.style.background = 'transparent'; btn.style.color = '#555';
                        btn.style.border = '1.5px solid rgba(0,0,0,0.12)';
                    }
                }
            });
            const descEl = document.getElementById('clean-type-desc');
            const descs = {
                chat: '选择要清理聊天记录的联系人（可多选）',
                images: '选择要清理聊天图片的联系人，图片将从消息中移除以释放存储空间（可多选）',
                memory: '选择要清理 AI 记忆摘要的联系人（可多选）',
                moments: '清理朋友圈动态数据'
            };
            if (descEl) descEl.textContent = descs[type] || '';
            // 重置全选框图标
            const allCb = document.getElementById('clean-select-all');
            const allIcon = document.getElementById('clean-all-check-icon');
            const allBox = document.getElementById('clean-all-box');
            if (allCb) allCb.checked = false;
            if (allIcon) allIcon.style.display = 'none';
            if (allBox) { allBox.style.background = 'transparent'; allBox.style.borderColor = '#ccc'; }
            _renderCleanList();
        }

        function _renderCleanList() {
            const listEl = document.getElementById('clean-contact-list');
            if (!listEl) return;

            let html = '';

            if (_currentCleanType === 'moments') {
                // 朋友圈：展示全局选项
                const count = (store.moments || []).length;
                html = `
                    <div class="clean-item" data-id="all_moments" style="display:flex;align-items:center;padding:12px 0;border-bottom:1px solid #f5f5f5;cursor:pointer;" onclick="toggleCleanItem(this)">
                        <input type="checkbox" class="clean-chk" style="width:18px;height:18px;accent-color:#ff9500;margin-right:12px;flex-shrink:0;pointer-events:none;">
                        <div style="width:40px;height:40px;border-radius:50%;background:#f0f0f0;display:flex;align-items:center;justify-content:center;margin-right:12px;font-size:20px;flex-shrink:0;">🌟</div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:14px;font-weight:600;color:#222;">所有朋友圈动态</div>
                            <div style="font-size:12px;color:#999;margin-top:2px;">共 ${count} 条动态</div>
                        </div>
                    </div>`;
            } else {
                // 联系人列表
                const contacts = store.contacts || [];
                if (contacts.length === 0) {
                    html = '<div style="text-align:center;padding:30px;color:#bbb;font-size:14px;">暂无联系人</div>';
                } else {
                    contacts.forEach(c => {
                        let subInfo = '';
                        if (_currentCleanType === 'chat') {
                            const msgs = (store.chats && store.chats[c.id]) || [];
                            subInfo = `${msgs.length} 条消息`;
                        } else if (_currentCleanType === 'images') {
                            const msgs = (store.chats && store.chats[c.id]) || [];
                            const imgCount = msgs.filter(m => m.img || m.image || (m.content && m.content.startsWith('data:image'))).length;
                            subInfo = `${imgCount} 张图片`;
                        } else if (_currentCleanType === 'memory') {
                            const mems = (store.memorySummaries && store.memorySummaries[c.id]) || [];
                            subInfo = `${mems.length} 条记忆`;
                        }
                        const avatarStyle = c.avatar
                            ? `background-image:url(${c.avatar});background-size:cover;background-position:center;`
                            : `background:#e0e0e0;`;
                        const initials = (c.name || '?')[0];
                        html += `
                            <div class="clean-item" data-id="${c.id}" style="display:flex;align-items:center;padding:12px 0;border-bottom:1px solid #f5f5f5;cursor:pointer;" onclick="toggleCleanItem(this)">
                                <input type="checkbox" class="clean-chk" style="width:18px;height:18px;accent-color:#ff9500;margin-right:12px;flex-shrink:0;pointer-events:none;">
                                <div style="width:40px;height:40px;border-radius:50%;${avatarStyle}display:flex;align-items:center;justify-content:center;margin-right:12px;font-size:18px;font-weight:700;color:#fff;flex-shrink:0;">${c.avatar ? '' : initials}</div>
                                <div style="flex:1;min-width:0;">
                                    <div style="font-size:14px;font-weight:600;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name || '未知'}</div>
                                    <div style="font-size:12px;color:#999;margin-top:2px;">${subInfo}</div>
                                </div>
                            </div>`;
                    });
                }
            }

            listEl.innerHTML = html;
            document.getElementById('clean-select-all').checked = false;
            _updateCleanCount();
        }

        function toggleCleanItem(el) {
            const chk = el.querySelector('.clean-chk');
            if (!chk) return;
            chk.checked = !chk.checked;
            _updateCleanCount();
        }

        function toggleCleanAll(masterChk) {
            const checked = masterChk.checked;
            document.querySelectorAll('#clean-contact-list .clean-chk').forEach(chk => {
                chk.checked = checked;
            });
            // 同步自定义全选图标
            const allIcon = document.getElementById('clean-all-check-icon');
            const allBox = document.getElementById('clean-all-box');
            if (allIcon) allIcon.style.display = checked ? 'block' : 'none';
            if (allBox) { allBox.style.background = checked ? '#111' : 'transparent'; allBox.style.borderColor = checked ? '#111' : '#ccc'; }
            _updateCleanCount();
        }

        function _updateCleanCount() {
            const total = document.querySelectorAll('#clean-contact-list .clean-chk:checked').length;
            const countEl = document.getElementById('clean-selected-count');
            if (countEl) countEl.textContent = '已选 ' + total + ' 项';
        }

        function doCleanData() {
            const selectedIds = [];
            document.querySelectorAll('#clean-contact-list .clean-item').forEach(item => {
                const chk = item.querySelector('.clean-chk');
                if (chk && chk.checked) {
                    selectedIds.push(item.dataset.id);
                }
            });

            if (selectedIds.length === 0) {
                return toast('请至少选择一项', 'error');
            }

            const typeLabels = {
                chat: '聊天记录',
                images: '聊天图片',
                memory: 'AI记忆摘要',
                moments: '朋友圈动态'
            };
            const label = typeLabels[_currentCleanType] || '数据';

            let confirmMsg = '';
            if (_currentCleanType === 'moments') {
                confirmMsg = `确定要清理所有朋友圈动态吗？此操作不可恢复。`;
            } else {
                confirmMsg = `确定要清理 ${selectedIds.length} 个联系人的【${label}】吗？此操作不可恢复。`;
            }

            document.getElementById('modal-clean-data').style.display = 'none';

            showConfirm('确认清理', confirmMsg, () => {
                _executeClean(selectedIds);
            });
        }

        function _executeClean(selectedIds) {
            let cleaned = 0;
            try {
                if (_currentCleanType === 'chat') {
                    selectedIds.forEach(contactId => {
                        if (store.chats && store.chats[contactId]) {
                            store.chats[contactId] = [];
                            cleaned++;
                        }
                        if (store.offlineChats && store.offlineChats[contactId]) {
                            store.offlineChats[contactId] = [];
                        }
                    });
                } else if (_currentCleanType === 'images') {
                    selectedIds.forEach(contactId => {
                        if (store.chats && store.chats[contactId]) {
                            const before = store.chats[contactId].length;
                            store.chats[contactId] = store.chats[contactId].map(msg => {
                                // 移除图片内容（base64或img字段）
                                const newMsg = Object.assign({}, msg);
                                if (newMsg.img) delete newMsg.img;
                                if (newMsg.image) delete newMsg.image;
                                // 如果content是base64图片，替换为提示文字
                                if (newMsg.content && typeof newMsg.content === 'string' && newMsg.content.startsWith('data:image')) {
                                    newMsg.content = '[图片已清理]';
                                }
                                return newMsg;
                            });
                            cleaned++;
                        }
                    });
                } else if (_currentCleanType === 'memory') {
                    selectedIds.forEach(contactId => {
                        // [FIX-记忆残留] 彻底清除所有记忆数据
                        if (store.memorySummaries && store.memorySummaries[contactId]) {
                            delete store.memorySummaries[contactId];
                            cleaned++;
                        }
                        // [类人记忆系统] 同步清除分层记忆
                        if (window.MemorySystem && window.MemorySystem.Store) {
                            try { window.MemorySystem.Store.clearContact(contactId); } catch(_) {}
                        }
                        // 同时清除情侣空间中的时空穿越记忆
                        if (store.coupleSpaces) {
                            store.coupleSpaces.forEach(space => {
                                if (space && space.partnerId === contactId && space.spacetimeMemories) {
                                    space.spacetimeMemories = [];
                                }
                            });
                        }
                        // 重置消息计数器，防止基于旧记忆的自动总结
                        const contact = store.contacts.find(c => c.id === contactId);
                        if (contact && contact.settings) {
                            contact.settings.msgCount = 0;
                            // [FIX-自动总结] 同时重置新的基于聊天长度的计数基准
                            contact.settings._lastSummaryAt = (store.chats[contactId] || []).length;
                        }
                    });
                } else if (_currentCleanType === 'moments') {
                    if (selectedIds.includes('all_moments')) {
                        store.moments = [];
                        cleaned = 1;
                    }
                }

                save();

                // 若当前正在聊天页且清理的是该联系人，刷新UI
                if ((_currentCleanType === 'chat' || _currentCleanType === 'images') && activeChatId && selectedIds.includes(activeChatId)) {
                    if (typeof renderHistory === 'function') renderHistory();
                }

                toast(`已成功清理 ${cleaned} 项数据 ✅`, 'success');

                // [FIX-清理刷新] 清理完成后重新打开数据管理弹窗并刷新列表，让用户看到更新后的条数
                setTimeout(() => {
                    const cleanModal = document.getElementById('modal-clean-data');
                    if (cleanModal) {
                        cleanModal.style.display = 'flex';
                        _renderCleanList();
                    }
                }, 300);
            } catch(e) {
                console.error('Clean data failed:', e);
                toast('清理失败: ' + e.message, 'error');
            }
        }

        // ===== 按日期范围清理聊天记录 =====
        function cleanChatsByDateRange() {
            const dateFromStr = document.getElementById('clean-date-from')?.value || '';
            const dateToStr = document.getElementById('clean-date-to')?.value || '';

            if (!dateFromStr && !dateToStr) {
                return toast('请至少选择一个日期', 'error');
            }

            let dateFrom = dateFromStr ? new Date(dateFromStr) : null;
            let dateTo = dateToStr ? new Date(dateToStr) : null;
            if (dateFrom) dateFrom.setHours(0, 0, 0, 0);
            if (dateTo) dateTo.setHours(23, 59, 59, 999);

            if (dateFrom && dateTo && dateFrom > dateTo) {
                return toast('开始日期不能晚于结束日期', 'error');
            }

            // 先统计匹配的消息数
            let totalMatch = 0;
            const contacts = store.contacts || [];
            contacts.forEach(c => {
                const msgs = (store.chats && store.chats[c.id]) || [];
                msgs.forEach(m => {
                    if (!m.time) return;
                    const msgDate = new Date(m.time);
                    if (dateFrom && msgDate < dateFrom) return;
                    if (dateTo && msgDate > dateTo) return;
                    totalMatch++;
                });
            });

            if (totalMatch === 0) {
                return toast('该日期范围内没有找到消息', 'info');
            }

            const rangeText = (dateFromStr || '最早') + ' 至 ' + (dateToStr || '最新');
            showConfirm('按日期清理', `将删除所有联系人在 [${rangeText}] 范围内的 ${totalMatch} 条消息，此操作不可恢复。`, () => {
                let deleted = 0;
                contacts.forEach(c => {
                    if (!store.chats || !store.chats[c.id]) return;
                    const before = store.chats[c.id].length;
                    store.chats[c.id] = store.chats[c.id].filter(m => {
                        if (!m.time) return true;
                        const msgDate = new Date(m.time);
                        if (dateFrom && msgDate < dateFrom) return true;
                        if (dateTo && msgDate > dateTo) return true;
                        return false;
                    });
                    deleted += before - store.chats[c.id].length;
                });
                save();
                toast(`已清理 ${deleted} 条消息`, 'success');
                // 刷新当前聊天
                if (typeof renderHistory === 'function' && activeChatId) renderHistory();
                // 清空日期输入
                const df = document.getElementById('clean-date-from');
                const dt = document.getElementById('clean-date-to');
                if (df) df.value = '';
                if (dt) dt.value = '';
                const preview = document.getElementById('clean-date-preview');
                if (preview) preview.textContent = '';
            });
        }

        // ========== 存储空间管理系统 ==========
        // 类似手机存储管理，统计各模块数据占用并支持分类清理

        function _smBytesToStr(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }

        function _smSizeOf(obj) {
            try {
                if (obj === undefined || obj === null) return 0;
                return new Blob([JSON.stringify(obj)]).size;
            } catch(e) { return 0; }
        }

        async function calculateStorageUsage() {
            const results = [];

            // 1. 聊天记录（线上）
            results.push({ id: 'chats', icon: '💬', label: '聊天记录', desc: '线上对话消息与图片', bytes: _smSizeOf(store.chats), color: '#5856d6' });

            // 2. 线下聊天
            results.push({ id: 'offlineChats', icon: '🌙', label: '线下聊天', desc: '线下模式对话记录', bytes: _smSizeOf(store.offlineChats), color: '#af52de' });

            // 2b. [撤销重回] 线下AI回复历史版本（history字段占用）
            // 与 offlineChats 分开统计，方便用户定向清理误操作累积的旧版本
            let _offHistBytes = 0;
            try {
                Object.values(store.offlineChats || {}).forEach(function(chatArr){
                    (chatArr || []).forEach(function(m){
                        if (m && Array.isArray(m.history) && m.history.length > 0) {
                            _offHistBytes += _smSizeOf(m.history);
                        }
                    });
                });
            } catch(e) {}
            results.push({ id: 'offlineHistory', icon: '↶', label: '线下回复历史版本', desc: '"上一版本"可回退的旧回复', bytes: _offHistBytes, color: '#9b59b6' });

            // 3. 表情包
            results.push({ id: 'stickers', icon: '😀', label: '表情包', desc: '自定义表情贴纸', bytes: _smSizeOf(store.stickerCategories), color: '#ff9500' });

            // 4. 联系人（含头像）
            results.push({ id: 'contacts', icon: '👤', label: '联系人数据', desc: '资料、头像、设置、人设', bytes: _smSizeOf(store.contacts) + _smSizeOf(store.personas), color: '#34aadc' });

            // 5. 朋友圈
            results.push({ id: 'moments', icon: '📸', label: '朋友圈', desc: '动态与图片', bytes: _smSizeOf(store.moments), color: '#ff2d55' });

            // 6. AI记忆
            results.push({ id: 'memory', icon: '🧠', label: 'AI记忆摘要', desc: '对话记忆数据', bytes: _smSizeOf(store.memorySummaries), color: '#5ac8fa' });

            // 7. 泡泡数据
            results.push({ id: 'paopao', icon: '🫧', label: '泡泡', desc: '泡泡聊天与联系人', bytes: _smSizeOf(store.paopao), color: '#ff6b81' });

            // 8. 论坛
            results.push({ id: 'forum', icon: '🏛️', label: '论坛', desc: '帖子、私信、通知', bytes: _smSizeOf(store.forumPosts) + _smSizeOf(store.forumDMs) + _smSizeOf(store.forumNotifs) + _smSizeOf(store.forumAccounts) + _smSizeOf(store.forumSections), color: '#4cd964' });

            // 9. 同人文
            results.push({ id: 'fanfic', icon: '📝', label: '同人文', desc: '创作与书架', bytes: _smSizeOf(store.fanfic), color: '#ffcc00' });

            // 10. 情侣空间
            results.push({ id: 'couple', icon: '💕', label: '情侣空间', desc: '情侣互动数据', bytes: _smSizeOf(store.coupleSpaces) + _smSizeOf(store.couple), color: '#ff4081' });

            // 11. 音乐
            results.push({ id: 'music', icon: '🎵', label: '音乐', desc: '歌曲与收藏', bytes: _smSizeOf(store.musics) + _smSizeOf(store.favoriteSongs) + _smSizeOf(store.listenState), color: '#007aff' });

            // 12. 学习资料
            results.push({ id: 'study', icon: '📚', label: '学习', desc: '学习资料与记录', bytes: _smSizeOf(store.study), color: '#8e8e93' });

            // 13. 日记/收藏/邮箱/关系网等杂项
            let miscBytes = _smSizeOf(store.diaries) + _smSizeOf(store.favorites) + _smSizeOf(store.mailbox) + _smSizeOf(store.relationNetworks) + _smSizeOf(store.mapGameSave) + _smSizeOf(store.shopOrders) + _smSizeOf(store.shopCart) + _smSizeOf(store.apiErrorLogs);
            results.push({ id: 'misc', icon: '📦', label: '其他', desc: '日记、收藏、邮箱、关系网等', bytes: miscBytes, color: '#c7c7cc' });

            // 14. 壁纸图片（独立IDB key）
            try {
                const gwpImages = await idb.get('AIChatOS_v8_GWP_Images');
                results.push({ id: 'wallpaper', icon: '🖼️', label: '壁纸图片', desc: '全局壁纸（独立存储）', bytes: gwpImages ? _smSizeOf(gwpImages) : _smSizeOf(store.globalWallpapers), color: '#e91e63' });
            } catch(e) {
                results.push({ id: 'wallpaper', icon: '🖼️', label: '壁纸图片', desc: '全局壁纸', bytes: _smSizeOf(store.globalWallpapers), color: '#e91e63' });
            }

            // 15. 泡泡存档（独立数据库）
            try {
                const ppDb = await new Promise((resolve) => {
                    try {
                        const req = indexedDB.open('PP_Archives_DB', 1);
                        req.onsuccess = () => resolve(req.result);
                        req.onerror = () => resolve(null);
                        req.onupgradeneeded = (e) => {
                            const db = e.target.result;
                            if (!db.objectStoreNames.contains('pp_archives')) db.createObjectStore('pp_archives');
                        };
                    } catch(e) { resolve(null); }
                });
                if (ppDb) {
                    const data = await new Promise(r => {
                        try {
                            const tx = ppDb.transaction('pp_archives', 'readonly');
                            const s = tx.objectStore('pp_archives');
                            const req = s.get('pp_archive_list');
                            req.onsuccess = () => r(req.result);
                            req.onerror = () => r(null);
                        } catch(e) { r(null); }
                    });
                    results.push({ id: 'ppArchives', icon: '💾', label: '泡泡存档', desc: '泡泡游戏存档（独立数据库）', bytes: data ? _smSizeOf(data) : 0, color: '#ff6b81' });
                    ppDb.close();
                } else {
                    results.push({ id: 'ppArchives', icon: '💾', label: '泡泡存档', desc: '泡泡游戏存档', bytes: 0, color: '#ff6b81' });
                }
            } catch(e) {
                results.push({ id: 'ppArchives', icon: '💾', label: '泡泡存档', desc: '泡泡游戏存档', bytes: 0, color: '#ff6b81' });
            }

            // 16. SW缓存
            try {
                if (window.caches) {
                    const keys = await caches.keys();
                    let cacheSize = 0;
                    for (const key of keys) {
                        const cache = await caches.open(key);
                        const reqs = await cache.keys();
                        cacheSize += reqs.length * 30000; // 估算每个缓存条目约30KB
                    }
                    results.push({ id: 'swCache', icon: '🔄', label: 'SW缓存', desc: 'Service Worker缓存资源', bytes: cacheSize, color: '#8e8e93' });
                }
            } catch(e) {}

            // 17. localStorage
            let lsSize = 0;
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    lsSize += (k.length + (localStorage.getItem(k) || '').length) * 2;
                }
            } catch(e) {}
            results.push({ id: 'localStorage', icon: '💿', label: '本地缓存', desc: 'localStorage备份数据', bytes: lsSize, color: '#8e8e93' });

            // 按大小降序排列
            results.sort((a, b) => b.bytes - a.bytes);
            return results;
        }

        function renderStorageCategories(results) {
            const listEl = document.getElementById('sm-category-list');
            const totalEl = document.getElementById('sm-total-size');
            const progressEl = document.getElementById('sm-total-progress');
            if (!listEl) return;

            const totalBytes = results.reduce((sum, r) => sum + r.bytes, 0);
            totalEl.textContent = _smBytesToStr(totalBytes);

            // 进度条（假设上限500MB）
            const pct = Math.min(100, (totalBytes / (500 * 1024 * 1024)) * 100);
            progressEl.style.width = pct + '%';

            let html = '';
            results.forEach(r => {
                if (r.bytes === 0 && r.id !== 'swCache' && r.id !== 'localStorage') return; // 隐藏空项（保留缓存类）
                const barPct = totalBytes > 0 ? Math.max(2, (r.bytes / totalBytes) * 100) : 0;
                const canClean = !['localStorage'].includes(r.id); // localStorage不提供单独清理
                html += `<div style="display:flex;align-items:center;padding:14px 0;border-bottom:1px solid rgba(0,0,0,0.04);">
                    <div style="font-size:22px;width:36px;text-align:center;flex-shrink:0;">${r.icon}</div>
                    <div style="flex:1;min-width:0;margin:0 12px;">
                        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
                            <span style="font-size:14px;font-weight:600;color:#222;">${r.label}</span>
                            <span style="font-size:13px;font-weight:700;color:#111;flex-shrink:0;">${_smBytesToStr(r.bytes)}</span>
                        </div>
                        <div style="height:6px;background:rgba(0,0,0,0.05);border-radius:3px;overflow:hidden;margin-bottom:4px;">
                            <div style="height:100%;width:${barPct}%;background:${r.color};border-radius:3px;transition:width 0.4s;"></div>
                        </div>
                        <div style="font-size:11px;color:#aaa;">${r.desc}</div>
                    </div>
                    ${canClean && r.bytes > 0 ? `<button onclick="cleanStorageCategory('${r.id}')" style="flex-shrink:0;padding:6px 12px;border:1.5px solid rgba(0,0,0,0.1);border-radius:12px;background:#fff;color:#fa5151;font-size:12px;font-weight:600;cursor:pointer;">清理</button>` : ''}
                </div>`;
            });

            if (!html) html = '<div style="text-align:center;padding:40px 0;color:#bbb;">暂无数据</div>';
            listEl.innerHTML = html;
        }

        async function showStorageManager() {
            document.getElementById('modal-storage-manager').style.display = 'flex';
            // 显示loading
            document.getElementById('sm-category-list').innerHTML = '<div style="text-align:center;padding:40px 0;color:#bbb;font-size:14px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:10px;display:block;"></i>正在扫描存储空间...</div>';
            document.getElementById('sm-total-size').textContent = '计算中...';
            document.getElementById('sm-total-progress').style.width = '0%';
            try {
                const results = await calculateStorageUsage();
                renderStorageCategories(results);
            } catch(e) {
                document.getElementById('sm-category-list').innerHTML = '<div style="text-align:center;padding:40px 0;color:#fa5151;">扫描失败: ' + e.message + '</div>';
            }
        }

        async function refreshStorageManager() {
            try {
                const results = await calculateStorageUsage();
                renderStorageCategories(results);
                toast('已刷新', 'success');
            } catch(e) {
                toast('刷新失败: ' + e.message, 'error');
            }
        }

        function cleanStorageCategory(catId) {
            const actions = {
                chats: { label: '聊天记录', fn: () => { store.chats = {}; store.contacts.forEach(c => { c.lastMsg = ''; c.lastMsgTime = 0; }); }},
                offlineChats: { label: '线下聊天', fn: () => { store.offlineChats = {}; }},
                offlineHistory: { label: '线下回复历史版本', fn: () => {
                    // [撤销重回] 只删 history/historyIndex 字段，保留消息本体
                    // ⚠️ 用 delete 而非赋空数组，彻底移除 key 避免残留
                    let cleared = 0;
                    Object.values(store.offlineChats || {}).forEach(function(chatArr){
                        (chatArr || []).forEach(function(m){
                            if (m && m.history !== undefined) { delete m.history; cleared++; }
                            if (m && m.historyIndex !== undefined) delete m.historyIndex;
                        });
                    });
                    // 清理后若正在线下界面，立即刷新以移除"上一版本"菜单项
                    if (typeof renderOfflineChat === 'function') {
                        try { renderOfflineChat(); } catch(e) {}
                    }
                }},
                stickers: { label: '表情包', fn: () => { store.stickerCategories = [{id:'default', name:'默认', stickers:[{url:'😀', type:'emoji'}]}]; }},
                contacts: { label: '联系人头像', fn: () => {
                    (store.contacts || []).forEach(c => {
                        if (c.avatar && typeof c.avatar === 'string' && c.avatar.startsWith('data:')) c.avatar = '';
                    });
                    if (store.user && store.user.avatar && store.user.avatar.startsWith('data:')) store.user.avatar = '';
                    if (store.user && store.user.desktopAvatar && store.user.desktopAvatar.startsWith('data:')) store.user.desktopAvatar = '';
                }},
                moments: { label: '朋友圈', fn: () => { store.moments = []; }},
                memory: { label: 'AI记忆', fn: () => {
                    store.memorySummaries = {};
                    // [类人记忆系统] 同步清空分层记忆
                    if (window.MemorySystem && store.memorySystem) {
                        store.memorySystem.contacts = {};
                    }
                }},
                paopao: { label: '泡泡数据', fn: () => { store.paopao = null; }},
                forum: { label: '论坛', fn: () => { store.forumPosts = []; store.forumDMs = {}; store.forumNotifs = []; }},
                fanfic: { label: '同人文', fn: () => { store.fanfic = {cps:[],stories:[],bookshelf:[],settings:{penName:'',avatar:''},drafts:[]}; }},
                couple: { label: '情侣空间', fn: () => { store.coupleSpaces = []; }},
                music: { label: '音乐', fn: () => { store.musics = []; store.favoriteSongs = []; }},
                study: { label: '学习数据', fn: () => { store.study = null; }},
                misc: { label: '杂项数据', fn: () => {
                    store.diaries = {}; store.favorites = {}; store.mailbox = [];
                    store.relationNetworks = {}; store.mapGameSave = null; store.apiErrorLogs = [];
                }},
                wallpaper: { label: '壁纸图片', fn: async () => {
                    try { await idb.set('AIChatOS_v8_GWP_Images', []); } catch(e) {}
                    if (store.globalWallpapers) store.globalWallpapers = { images: [], assign: {} };
                    document.querySelectorAll('.gwp-bg-layer').forEach(el => el.remove());
                    document.querySelectorAll('.gwp-has-wallpaper').forEach(el => el.classList.remove('gwp-has-wallpaper'));
                }},
                ppArchives: { label: '泡泡存档', fn: async () => {
                    try {
                        const delReq = indexedDB.deleteDatabase('PP_Archives_DB');
                        await new Promise((resolve) => {
                            delReq.onsuccess = resolve;
                            delReq.onerror = resolve;
                            delReq.onblocked = resolve;
                        });
                    } catch(e) {}
                }},
                swCache: { label: 'SW缓存', fn: async () => {
                    try {
                        const keys = await caches.keys();
                        await Promise.all(keys.map(k => caches.delete(k)));
                    } catch(e) {}
                }}
            };

            const action = actions[catId];
            if (!action) return toast('未知类别', 'error');

            showConfirm('确认清理', `确定要清理「${action.label}」吗？此操作不可恢复。`, async () => {
                try {
                    await action.fn();
                    save();
                    toast(`${action.label} 已清理`, 'success');
                    // 刷新存储管理器
                    setTimeout(() => refreshStorageManager(), 300);
                    // 刷新相关UI
                    if (typeof renderHistory === 'function' && activeChatId) try { renderHistory(); } catch(e) {}
                    if (typeof renderContacts === 'function') try { renderContacts(); } catch(e) {}
                } catch(e) {
                    toast('清理失败: ' + e.message, 'error');
                }
            });
        }

        function cleanAllStorageData() {
            showConfirm('⚠️ 清除全部数据', '此操作将永久删除所有数据（包括泡泡存档、壁纸、SW缓存等），不可恢复！\n\n请确保已导出备份！', async () => {
                try {
                    // 1. localStorage
                    localStorage.clear();
                    // 2. 主数据库
                    indexedDB.deleteDatabase('AIChatOS_DB');
                    // 3. 泡泡存档数据库
                    indexedDB.deleteDatabase('PP_Archives_DB');
                    // 4. SW缓存
                    try {
                        const keys = await caches.keys();
                        await Promise.all(keys.map(k => caches.delete(k)));
                    } catch(e) {}
                    toast('所有数据已清除，即将刷新页面...', 'success');
                    setTimeout(() => location.reload(), 1500);
                } catch(e) {
                    toast('清除失败: ' + e.message, 'error');
                }
            });
        }
        // ========== END 存储空间管理系统 ==========

        function exportData() {
            // [FIX-导出崩溃] 改为异步导出，避免大数据同步操作导致UI卡死和内存溢出
            toast("正在准备导出数据...", "info");
            
            // 使用setTimeout释放主线程，防止同步操作阻塞UI
            setTimeout(async function() {
                try {
                    // [FIX-导出崩溃] 优化：不再做双重序列化（JSON.parse(JSON.stringify())），
                    // 直接序列化一次，大幅降低内存占用（原来需要3倍内存，现在只需1倍）
                    let dataStr;
                    // [FIX-导出解析] 始终使用安全序列化，防止循环引用和特殊字符导致JSON损坏
                    const seen = new WeakSet();
                    try {
                        dataStr = JSON.stringify(store, function(key, value) {
                            if (typeof value === 'object' && value !== null) {
                                if (seen.has(value)) return '[Circular]';
                                seen.add(value);
                            }
                            // [FIX-导出不裁剪] 不再截断大图片，确保壁纸和主界面图片完整导出
                            // 原来>2MB的base64图片会被替换为占位符，导致导入后壁纸丢失
                            // [FIX-A3] 清理字符串中的非法控制字符 + \u2028\u2029（部分WebView的JSON.parse对此敏感）
                            if (typeof value === 'string') {
                                return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u2028\u2029]/g, '');
                            }
                            return value;
                        });
                    } catch(serErr) {
                        console.error('[Export] 安全序列化也失败:', serErr.message);
                        throw serErr;
                    }
                    
                    if (!dataStr || dataStr.length < 10) {
                        return toast("导出数据为空或无效，请重试", "error");
                    }
                    
                    // [FIX-导出崩溃] 简化验证：只检查关键标记存在，不再做完整的JSON.parse反序列化
                    // 避免对超大JSON做第二次解析导致内存溢出
                    if (!dataStr.includes('"user"') && !dataStr.includes('"contacts"')) {
                        return toast("导出数据验证失败（缺少关键字段），请重试", "error");
                    }
                    
                    var rawSizeMB = (dataStr.length / 1024 / 1024).toFixed(2);
                    console.log('[Export] 原始数据大小:', rawSizeMB + 'MB');
                    
                    // [FIX-A4] 文件名加平台标记，便于跨端排障
                    const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
                    const platformTag = isCapacitor ? 'apk' : (/wv|WebView/.test(navigator.userAgent) ? 'webview' : 'web');
                    
                    // [FIX-APK导出v2] 在Capacitor/Android环境中使用分块写入
                    if (isCapacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FileExport) {
                        var filename_apk = "AIChatOS_Backup_" + platformTag + "_" + new Date().toISOString().slice(0,10) + ".json";
                        _exportChunked(dataStr, filename_apk);
                        return;
                    }
                    
                    // [FIX-APK导出] Android WebView回退
                    const isAndroidWebView = /wv|WebView/.test(navigator.userAgent);
                    if (isAndroidWebView) {
                        var filename_wv = "AIChatOS_Backup_" + platformTag + "_" + new Date().toISOString().slice(0,10) + ".json";
                        _exportFallbackShare(dataStr, filename_wv);
                        return;
                    }
                    
                    // [FIX-导出压缩-v2] 浏览器环境：根据平台决定是否压缩
                    // iOS Safari 的 CompressionStream 实现不稳定（16.4+才支持，且可能产生
                    // 与标准gzip不完全兼容的输出），导致导出的.gz文件在其他设备上无法导入。
                    // 优化策略：iOS和移动端直接导出不压缩JSON（最大兼容性），
                    // 仅桌面浏览器使用CompressionStream压缩。
                    var blob, filename;
                    var _isIOSExport = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                    var _isMobileExport = _isIOSExport || /Android/i.test(navigator.userAgent);
                    // iOS和移动端：不压缩（最大兼容性）；桌面且支持CompressionStream：压缩
                    var _useCompression = !_isMobileExport && (typeof CompressionStream !== 'undefined');
                    
                    if (_useCompression) {
                        try {
                            toast("正在压缩数据...", "info");
                            var _textEncoder = new TextEncoder();
                            var _rawBytes = _textEncoder.encode(dataStr);
                            dataStr = null;
                            
                            var _cs = new CompressionStream('gzip');
                            var _writer = _cs.writable.getWriter();
                            var _reader = _cs.readable.getReader();
                            var _chunks = [];
                            
                            _writer.write(_rawBytes);
                            _writer.close();
                            _rawBytes = null;
                            
                            while (true) {
                                var _readResult = await _reader.read();
                                if (_readResult.done) break;
                                _chunks.push(_readResult.value);
                            }
                            
                            blob = new Blob(_chunks, { type: 'application/gzip' });
                            filename = "AIChatOS_Backup_" + platformTag + "_" + new Date().toISOString().slice(0,10) + ".json.gz";
                            
                            var compressedSizeMB = (blob.size / 1024 / 1024).toFixed(2);
                            var ratio = ((1 - blob.size / (parseFloat(rawSizeMB) * 1024 * 1024)) * 100).toFixed(0);
                            console.log('[Export] 压缩后:', compressedSizeMB + 'MB (节省' + ratio + '%)');
                        } catch(_compErr) {
                            console.warn('[Export] 压缩失败，回退到未压缩导出:', _compErr);
                            if (!dataStr) {
                                var seen2 = new WeakSet();
                                dataStr = JSON.stringify(store, function(key, value) {
                                    if (typeof value === 'object' && value !== null) {
                                        if (seen2.has(value)) return '[Circular]';
                                        seen2.add(value);
                                    }
                                    if (typeof value === 'string') {
                                        return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u2028\u2029]/g, '');
                                    }
                                    return value;
                                });
                            }
                            blob = new Blob([dataStr], {type: "application/json;charset=utf-8"});
                            filename = "AIChatOS_Backup_" + platformTag + "_" + new Date().toISOString().slice(0,10) + ".json";
                            dataStr = null;
                        }
                    } else {
                        // 移动端 / 不支持CompressionStream：直接导出JSON（不添加BOM）
                        // [FIX-导入BOM干扰] 旧版导出添加了 UTF-8 BOM (\uFEFF)，
                        // 这在某些iOS WebView中导致JSON.parse失败，现在不再添加
                        blob = new Blob([dataStr], {type: "application/json;charset=utf-8"});
                        filename = "AIChatOS_Backup_" + platformTag + "_" + new Date().toISOString().slice(0,10) + ".json";
                        dataStr = null;
                    }
                    
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    
                    setTimeout(() => {
                        a.click();
                        document.body.removeChild(a);
                        setTimeout(() => URL.revokeObjectURL(url), 60000);
                        toast("导出成功 ✅" + (_useCompression && filename.endsWith('.gz') ? ' (已压缩)' : ''), "success");
                    }, 100);
                } catch(e) {
                    console.error("Export failed:", e);
                    // [FIX-导出崩溃] 提供更详细的错误信息和恢复建议
                    if (e.message && (e.message.includes('out of memory') || e.message.includes('allocation') || e.message.includes('Maximum call stack'))) {
                        toast("导出失败：数据量过大导致内存不足。建议先清理聊天图片或历史记录后重试。", "error");
                    } else {
                        toast("导出失败: " + e.message, "error");
                    }
                }
            }, 50);
        }

        /**
         * [FIX-APK导出v2] 分块导出：将大数据分成多个小块通过 Capacitor Bridge 传输
         * 解决 Android IPC TransactionTooLargeException（超过 ~500KB 即可能崩溃）
         * 每块 200KB，确保安全
         */
        async function _exportChunked(dataStr, filename) {
            const FE = window.Capacitor.Plugins.FileExport;
            const CHUNK_SIZE = 200 * 1024; // 200KB per chunk
            
            try {
                // 步骤1: 开始分块导出
                await FE.startChunkedExport({ filename: filename });
                
                // 步骤2: 分块写入
                // [FIX-A2] 安全切片：避免在UTF-16代理对中间切断（emoji等），否则Android端拼接后JSON损坏
                function _safeSlice(str, start, maxEnd) {
                    let end = Math.min(maxEnd, str.length);
                    if (end < str.length) {
                        const lastCode = str.charCodeAt(end - 1);
                        // 如果末尾是高位代理（\uD800-\uDBFF），回退一位让代理对完整留给下一块
                        if (lastCode >= 0xD800 && lastCode <= 0xDBFF) {
                            end--;
                        }
                    }
                    return { chunk: str.substring(start, end), nextStart: end };
                }
                
                console.log("[FIX-APK导出v2] 总大小:", dataStr.length, "字节, 安全分块传输");
                
                let cursor = 0;
                let chunkIdx = 0;
                while (cursor < dataStr.length) {
                    const r = _safeSlice(dataStr, cursor, cursor + CHUNK_SIZE);
                    await FE.writeChunk({ chunk: r.chunk });
                    cursor = r.nextStart;
                    chunkIdx++;
                    
                    // 每5块更新一次进度提示
                    if (chunkIdx > 0 && chunkIdx % 5 === 0) {
                        const pct = Math.round((cursor / dataStr.length) * 100);
                        toast("导出中... " + pct + "%");
                    }
                }
                
                // 步骤3: 完成导出并触发分享
                await FE.finishChunkedExport();
                toast("导出成功，请选择保存位置 ✅", "success");
                
            } catch(err) {
                console.error("[FIX-APK导出v2] Chunked export failed:", err);
                // 回退到 navigator.share（使用 Blob 方式，不经过 Capacitor Bridge）
                toast("分块导出失败，尝试备用方案...");
                _exportFallbackShare(dataStr, filename);
            }
        }

        // [FIX-APK导出] navigator.share 回退方案
        function _exportFallbackShare(dataStr, filename) {
            try {
                // [FIX-导入BOM干扰-v2] 不再添加BOM，BOM会导致某些iOS WebView的JSON.parse失败
                // 在导入端已有BOM清理逻辑，旧文件的BOM可以被正确处理
                const blob = new Blob([dataStr], {type: "application/json;charset=utf-8"});
                if (navigator.share && navigator.canShare) {
                    const file = new File([blob], filename, { type: 'application/json' });
                    const shareData = { title: '导出数据备份', files: [file] };
                    if (navigator.canShare(shareData)) {
                        navigator.share(shareData).then(() => {
                            toast("导出成功 ✅", "success");
                        }).catch(err => {
                            console.warn("Share failed:", err);
                            if (err.name !== 'AbortError') {
                                _exportFallbackDownload(blob, filename);
                            }
                        });
                        return;
                    }
                }
                // canShare不支持或不可用，尝试直接下载
                _exportFallbackDownload(blob, filename);
            } catch(e) {
                console.error("Share fallback failed:", e);
                toast("导出失败: " + e.message, "error");
            }
        }

        // [FIX-APK导出] 最终回退：直接下载（浏览器方式）
        function _exportFallbackDownload(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            setTimeout(() => {
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 60000);
                toast("导出已触发");
            }, 100);
        }

        // [选择性导入] 暂存解析后的导入数据
        var _pendingImportData = null;

        // [选择性导入] 导入类别检测映射
        // [FIX-导入数据完整性] 补全所有缺失的数据类别，确保选择性导入不会丢数据
        var _importCatDetect = {
            chats: { keys: ['chats','offlineChats'], label: '💬 聊天记录', sub: '对话与离线消息' },
            contacts: { keys: ['contacts','contactGroups','categories'], label: '👥 联系人', sub: '好友与分组' },
            moments: { keys: ['moments'], label: '📷 朋友圈', sub: '动态与评论' },
            diaries: { keys: ['diaries'], label: '📔 日记', sub: '日记内容' },
            worldbooks: { keys: ['worldbooks'], label: '📚 世界书', sub: '世界观设定' },
            memorySummaries: { keys: ['memorySummaries'], label: '🧠 记忆摘要', sub: '长期记忆' },
            system: { keys: ['user','system','stt','imgGen','apiPresets','personas','perception'], label: '⚙️ 系统设置', sub: 'API与偏好' },
            forum: { keys: ['forumPosts','forumNotifs','forumDMs','forumProfile'], label: '🏛️ 论坛数据', sub: '帖子与消息' },
            musics: { keys: ['musics','favoriteSongs','listenState'], label: '🎵 一起听歌', sub: '歌曲与收藏' },
            desktop: { keys: ['appIcons','page2','layoutOrder','floatBall'], label: '📱 桌面布局', sub: '图标与排列' },
            shop: { keys: ['shopProducts','shopCart','shopOrders','bills'], label: '🛒 商店数据', sub: '商品与订单' },
            couple: { keys: ['couple','coupleSpaces','coupleLedger'], label: '💑 恋爱空间', sub: '情侣互动与记账' },
            desktopStyle: { keys: ['desktopBg','globalWallpapers','compStyles','bubbleStyles','customCSS','customFont','fontPresets','cssPresets','theme','avatarFrames'], label: '🎨 主界面美化', sub: '壁纸、主题、头像框' },
            study: { keys: ['study'], label: '📖 学习数据', sub: '资料、计划、陪伴统计' },
            spirits: { keys: ['spirits'], label: '🐾 精灵/宠物', sub: '精灵养成数据' },
            redpackets: { keys: ['redpackets'], label: '🧧 红包', sub: '红包记录' },
            tickets: { keys: ['ticketWallet'], label: '🎫 票券', sub: '票券钱包' },
            supervise: { keys: ['supervise'], label: '📋 监督系统', sub: '监督任务与记录' },
            schedules: { keys: ['schedules'], label: '📅 日程', sub: '日程安排' },
            phoneData: { keys: ['phoneData'], label: '📱 手机数据', sub: '模拟手机内容' },
            relationNetwork: { keys: ['relationNetwork'], label: '🕸️ 关系网', sub: 'NPC关系网络' },
            mailbox: { keys: ['mailbox','mailDailyCount'], label: '📮 邮箱', sub: '信件与邮箱' },
            stickers: { keys: ['stickerCategories','stickerPacks'], label: '😀 表情包', sub: '表情分类与包' },
            wallet: { keys: ['wallet'], label: '💰 钱包', sub: '余额与交易' }
        };

        // [选择性导入] 检测导入数据中包含哪些类别
        function _detectImportCategories(data) {
            var found = [];
            var coveredKeys = new Set();
            for (var cat in _importCatDetect) {
                var info = _importCatDetect[cat];
                var hasAny = info.keys.some(function(k) { return data[k] !== undefined; });
                if (hasAny) found.push(cat);
                info.keys.forEach(function(k) { coveredKeys.add(k); });
            }
            // [FIX-导入数据完整性] 检测未被任何类别覆盖的key，归入"其他数据"
            var hasUncovered = false;
            for (var key in data) {
                if (key.startsWith('_')) continue; // 跳过元数据
                if (!coveredKeys.has(key)) { hasUncovered = true; break; }
            }
            if (hasUncovered) found.push('_other');
            return found;
        }

        // [选择性导入] 根据选中类别过滤数据，只保留选中类别的key
        function _filterImportData(data, selectedCats) {
            var allowedKeys = new Set();
            var allCoveredKeys = new Set();
            selectedCats.forEach(function(cat) {
                if (cat === '_other') return; // _other 单独处理
                var info = _importCatDetect[cat];
                if (info) info.keys.forEach(function(k) { allowedKeys.add(k); });
            });
            // 收集所有已知类别的key
            for (var c in _importCatDetect) {
                _importCatDetect[c].keys.forEach(function(k) { allCoveredKeys.add(k); });
            }
            // 如果选中了"其他数据"，把所有未被覆盖的key也加入
            if (selectedCats.indexOf('_other') !== -1) {
                for (var key in data) {
                    if (!key.startsWith('_') && !allCoveredKeys.has(key)) {
                        allowedKeys.add(key);
                    }
                }
            }
            // 保留元数据key
            allowedKeys.add('_exportType');
            allowedKeys.add('_exportKeys');
            allowedKeys.add('_exportTime');
            var filtered = {};
            for (var key in data) {
                if (allowedKeys.has(key)) filtered[key] = data[key];
            }
            return filtered;
        }

        // [选择性导入] 显示导入选择模态框
        function _showImportSelectModal(data) {
            var cats = _detectImportCategories(data);
            var listEl = document.getElementById('import-cat-list');
            if (!listEl) return false;
            listEl.innerHTML = cats.map(function(cat) {
                var info = _importCatDetect[cat] || { label: '📦 其他数据', sub: '未分类的附加数据' };
                return '<div class="import-cat-item" data-key="' + cat + '" data-selected="0" onclick="_toggleImportCat(this)" style="display:flex;align-items:center;padding:12px 14px;background:rgba(0,0,0,0.04);border:1.5px solid rgba(0,0,0,0.08);border-radius:16px;cursor:pointer;transition:all 0.18s;">' +
                    '<div class="import-cat-chk" style="width:20px;height:20px;border-radius:6px;border:2px solid #ccc;display:flex;align-items:center;justify-content:center;margin-right:10px;flex-shrink:0;transition:all 0.2s;background:transparent;">' +
                        '<i class="fas fa-check" style="font-size:10px;color:#fff;display:none;"></i>' +
                    '</div>' +
                    '<div>' +
                        '<div style="font-size:13px;font-weight:700;color:#222;">' + info.label + '</div>' +
                        '<div style="font-size:11px;color:#999;margin-top:1px;">' + info.sub + '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
            // 重置全选
            var allChk = document.getElementById('import-chk-all');
            var allDot = document.getElementById('import-chk-all-dot');
            if (allChk) { allChk.style.background = 'transparent'; allChk.style.borderColor = '#aaa'; }
            if (allDot) allDot.style.display = 'none';
            document.getElementById('modal-import-select').style.display = 'flex';
            return true;
        }

        function toggleImportAll(el) {
            var allChk = document.getElementById('import-chk-all');
            var allDot = document.getElementById('import-chk-all-dot');
            var isSelected = allDot && allDot.style.display !== 'none';
            if (isSelected) {
                if (allChk) { allChk.style.background = 'transparent'; allChk.style.borderColor = '#aaa'; }
                if (allDot) allDot.style.display = 'none';
                document.querySelectorAll('.import-cat-item').forEach(function(item) {
                    item.dataset.selected = '0';
                    var chk = item.querySelector('.import-cat-chk');
                    var ico = chk && chk.querySelector('.fas.fa-check');
                    if (chk) { chk.style.background = 'transparent'; chk.style.borderColor = '#ccc'; }
                    if (ico) ico.style.display = 'none';
                });
            } else {
                if (allChk) { allChk.style.background = '#5856d6'; allChk.style.borderColor = '#5856d6'; }
                if (allDot) allDot.style.display = 'block';
                document.querySelectorAll('.import-cat-item').forEach(function(item) {
                    item.dataset.selected = '1';
                    var chk = item.querySelector('.import-cat-chk');
                    var ico = chk && chk.querySelector('.fas.fa-check');
                    if (chk) { chk.style.background = '#5856d6'; chk.style.borderColor = '#5856d6'; }
                    if (ico) ico.style.display = 'block';
                });
            }
        }
        window.toggleImportAll = toggleImportAll;

        function _toggleImportCat(el) {
            var isSelected = el.dataset.selected === '1';
            var chk = el.querySelector('.import-cat-chk');
            var ico = chk && chk.querySelector('.fas.fa-check');
            if (isSelected) {
                el.dataset.selected = '0';
                if (chk) { chk.style.background = 'transparent'; chk.style.borderColor = '#ccc'; }
                if (ico) ico.style.display = 'none';
                var allChk = document.getElementById('import-chk-all');
                var allDot = document.getElementById('import-chk-all-dot');
                if (allChk) { allChk.style.background = 'transparent'; allChk.style.borderColor = '#aaa'; }
                if (allDot) allDot.style.display = 'none';
            } else {
                el.dataset.selected = '1';
                if (chk) { chk.style.background = '#5856d6'; chk.style.borderColor = '#5856d6'; }
                if (ico) ico.style.display = 'block';
            }
        }
        window._toggleImportCat = _toggleImportCat;

        // [选择性导入] 执行选择性导入
        async function doSelectiveImport() {
            var allDot = document.getElementById('import-chk-all-dot');
            var isAll = allDot && allDot.style.display !== 'none';
            var selectedKeys = [];
            document.querySelectorAll('.import-cat-item').forEach(function(item) {
                if (item.dataset.selected === '1') selectedKeys.push(item.dataset.key);
            });
            if (!isAll && selectedKeys.length === 0) {
                return toast('请至少选择一个导入类别', 'error');
            }
            document.getElementById('modal-import-select').style.display = 'none';
            var data = _pendingImportData;
            if (!data) { toast('导入数据丢失，请重新选择文件', 'error'); return; }
            // 如果不是全选，过滤数据
            if (!isAll) {
                data = _filterImportData(data, selectedKeys);
            }
            // 执行实际导入
            await _doImportMerge(data);
        }
        window.doSelectiveImport = doSelectiveImport;

        // [FIX-Chrome导入无反馈] 取消导入时清理暂存数据并提示用户
        function _cancelPendingImport() {
            if (_pendingImportData) {
                _pendingImportData = null;
                toast('已取消导入', 'info');
                console.log('[Import] 用户取消了选择性导入');
            }
        }
        window._cancelPendingImport = _cancelPendingImport;

        // [选择性导入] 实际合并导入逻辑（从原handleImport中提取）
        // [FIX-导入数据不恢复-v2] 重写IDB保存逻辑：
        //   1. 使用与 _doSaveNow() 相同的分片存储格式（chats拆分为独立key）
        //   2. 使用 idb.batchSet() 原子写入，避免不一致
        //   3. 设置 _importReloading 阻止 reload 前的自动保存覆盖导入数据
        async function _doImportMerge(data) {
            const loading = document.getElementById('loading');
            if(loading) loading.style.display = 'block';
            try {
                // [FIX-导入只有美化] 导入前先清除旧的LS Core缓存，防止reload后旧Core覆盖新导入的数据
                try {
                    localStorage.removeItem('AIChatOS_v8_Core');
                } catch(_e) {}
                
                // 深度合并：只覆盖导入数据中存在的key，其他保持不变
                for (let key in data) {
                    if (key.startsWith('_')) continue; // 跳过元数据
                    try {
                        if (typeof store[key] === 'object' && store[key] !== null && !Array.isArray(store[key]) && typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
                            store[key] = { ...store[key], ...data[key] };
                        } else {
                            store[key] = data[key];
                        }
                    } catch(mergeErr) {
                        console.warn('[SelectiveImport] 合并字段 ' + key + ' 失败:', mergeErr.message);
                    }
                }
                // 确保user对象完整
                if (data.user && DB.user) {
                    store.user = { ...DB.user, ...store.user };
                }
                
                const importTs = Date.now();
                store._saveTimestamp = importTs;
                store._importedAt = importTs;
                
                // [FIX-导入数据不恢复-v2] 阻止自动保存在 reload 前覆盖导入数据
                // _doSaveNow 的分片格式与此处的保存可能冲突
                window._importReloading = true;
                
                toast("正在保存数据...", "info");
                let idbSuccess = false;
                let lsSuccess = false;
                
                // [FIX-导入数据不恢复-v2] 使用与 _doSaveNow() 相同的分片存储方式
                // 将 chats 拆分为独立 IDB key，主 store 标记 _chatSharded
                for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                        var entries = [];
                        
                        // 准备主 store（与 _doSaveNow 保持一致的分片结构）
                        var mainStore = Object.assign({}, store);
                        mainStore._saveTimestamp = importTs;
                        mainStore._importedAt = importTs;
                        
                        // 聊天数据分片存储
                        var origChats = mainStore.chats || {};
                        mainStore.chats = {};
                        mainStore._chatSharded = true;
                        mainStore._chatIds = Object.keys(origChats);
                        
                        // 书籍content/rawData剥离
                        var bookContents = {};
                        if (mainStore.books && Array.isArray(mainStore.books)) {
                            mainStore.books = mainStore.books.map(function(bk) {
                                if (bk.content || bk.rawData) {
                                    bookContents[bk.id] = { content: bk.content, rawData: bk.rawData };
                                    var clean = Object.assign({}, bk);
                                    if (clean.content && !clean.contentLength) clean.contentLength = clean.content.length;
                                    delete clean.content;
                                    delete clean.rawData;
                                    return clean;
                                }
                                return bk;
                            });
                        }
                        
                        entries.push({ key: 'AIChatOS_v8', value: mainStore });
                        
                        // 所有聊天分片
                        for (var cid in origChats) {
                            if (origChats[cid] && Array.isArray(origChats[cid])) {
                                entries.push({ key: 'AIChatOS_v8_Chat_' + cid, value: origChats[cid] });
                            }
                        }
                        
                        // 书籍内容
                        for (var bookId in bookContents) {
                            if (bookContents.hasOwnProperty(bookId)) {
                                entries.push({ key: 'AIChatOS_v8_Book_' + bookId, value: bookContents[bookId] });
                            }
                        }
                        
                        // AppIcons
                        if (store.appIcons && Object.keys(store.appIcons).length > 0) {
                            entries.push({ key: 'AIChatOS_v8_AppIcons', value: store.appIcons });
                        }
                        
                        // DesktopBg
                        if (store.desktopBg) {
                            entries.push({ key: 'AIChatOS_v8_DesktopBg', value: store.desktopBg });
                        }
                        
                        // 原子写入
                        await idb.batchSet(entries);
                        console.log('[Import-v2] 原子写入成功, entries=' + entries.length + ', chats=' + mainStore._chatIds.length);
                        idbSuccess = true;
                        break;
                    } catch(err) {
                        console.warn('[Import-v2] IDB batchSet 失败 attempt=' + attempt, err);
                        if (attempt < 2) await new Promise(r => setTimeout(r, 500));
                    }
                }
                if (store.globalWallpapers && store.globalWallpapers.images && store.globalWallpapers.images.length > 0) {
                    try { await idb.set('AIChatOS_v8_GWP_Images', store.globalWallpapers.images); } catch(e) {}
                }
                // [FIX-数据丢失终极修复] LS写入使用与 _emergencyLsBackup() 相同的截断策略：
                // - 大图片(>80KB)剥离，聊天每人只保留最近15条
                // - 防止完整store超过LS 5-10MB限额导致写入失败
                // - IDB才是主存储，LS只是紧急回退（initStore优先读IDB）
                try {
                    var _IMPORT_LS_LARGE = 80000;
                    var _importLsStore = {};
                    // 核心设置
                    _importLsStore.user = store.user;
                    _importLsStore.theme = store.theme;
                    _importLsStore.system = store.system;
                    _importLsStore.stt = store.stt;
                    _importLsStore.imgGen = store.imgGen;
                    _importLsStore.personas = store.personas;
                    _importLsStore.worldbooks = store.worldbooks;
                    _importLsStore.categories = store.categories;
                    _importLsStore.perception = store.perception;
                    _importLsStore.couple = store.couple;
                    _importLsStore.coupleSpaces = store.coupleSpaces;
                    _importLsStore.study = store.study;
                    _importLsStore.apiPresets = store.apiPresets;
                    _importLsStore.bubbleStyles = store.bubbleStyles;
                    _importLsStore.customCSS = store.customCSS;
                    _importLsStore.customFont = store.customFont;
                    _importLsStore.fontPresets = store.fontPresets;
                    _importLsStore.cssPresets = store.cssPresets;
                    _importLsStore.layoutOrder = store.layoutOrder;
                    _importLsStore.compStyles = store.compStyles;
                    _importLsStore.lockScreen = store.lockScreen;
                    _importLsStore.avatarFrames = store.avatarFrames;
                    // 联系人（剥离大头像）
                    _importLsStore.contacts = (store.contacts || []).map(function(c) {
                        var cc = Object.assign({}, c);
                        if (cc.avatar && cc.avatar.length > _IMPORT_LS_LARGE) cc.avatar = '';
                        return cc;
                    });
                    // page2（剥离大图片）
                    if (store.page2) {
                        _importLsStore.page2 = Object.assign({}, store.page2);
                        ['photo','album','square','miniAvatar'].forEach(function(k) {
                            if (_importLsStore.page2[k] && _importLsStore.page2[k].length > _IMPORT_LS_LARGE) _importLsStore.page2[k] = '';
                        });
                    }
                    // appIcons（剥离大图标）
                    if (store.appIcons) {
                        _importLsStore.appIcons = {};
                        for (var _ik in store.appIcons) {
                            if (store.appIcons.hasOwnProperty(_ik)) {
                                var _iv = store.appIcons[_ik];
                                if (_ik === 'widgetImages' && Array.isArray(_iv)) {
                                    _importLsStore.appIcons[_ik] = _iv.map(function(img) {
                                        return (typeof img === 'string' && img.length > _IMPORT_LS_LARGE) ? '' : (img || '');
                                    }).filter(function(img) { return img !== ''; });
                                } else {
                                    _importLsStore.appIcons[_ik] = (typeof _iv === 'string' && _iv.length > _IMPORT_LS_LARGE) ? '' : (_iv || '');
                                }
                            }
                        }
                    }
                    _importLsStore.desktopBg = (store.desktopBg && store.desktopBg.length > _IMPORT_LS_LARGE) ? '' : (store.desktopBg || '');
                    _importLsStore.floatBall = store.floatBall ? Object.assign({}, store.floatBall, {
                        image: (store.floatBall.image && store.floatBall.image.length > _IMPORT_LS_LARGE) ? '' : (store.floatBall.image || '')
                    }) : store.floatBall;
                    // 聊天（每人保留最近15条，剥离大内容）
                    _importLsStore.chats = {};
                    if (store.chats) {
                        for (var _lsCid in store.chats) {
                            if (store.chats.hasOwnProperty(_lsCid) && Array.isArray(store.chats[_lsCid])) {
                                _importLsStore.chats[_lsCid] = store.chats[_lsCid].slice(-15).map(function(m) {
                                    var mc = Object.assign({}, m);
                                    if (mc.content && mc.content.length > 5000) mc.content = mc.content.substring(0, 5000);
                                    if (mc.audioData) delete mc.audioData;
                                    if (mc.voiceData) delete mc.voiceData;
                                    return mc;
                                });
                            }
                        }
                    }
                    // 壁纸只保留元数据
                    if (store.globalWallpapers) {
                        _importLsStore.globalWallpapers = Object.assign({}, store.globalWallpapers);
                        if (_importLsStore.globalWallpapers.images && _importLsStore.globalWallpapers.images.length > 0) {
                            _importLsStore.globalWallpapers.images = _importLsStore.globalWallpapers.images.map(function(img) { return { id: img.id, name: img.name, addedAt: img.addedAt }; });
                            _importLsStore.globalWallpapers._hasExternalImages = true;
                        }
                    }
                    _importLsStore._saveTimestamp = importTs;
                    _importLsStore._importedAt = importTs;
                    _importLsStore._isLsBackup = true;
                    localStorage.setItem('AIChatOS_v8_LS', JSON.stringify(_importLsStore));
                    // 也写入 AIChatOS_v8 用于 iOS Safari IDB lazy flush fallback
                    localStorage.setItem('AIChatOS_v8', JSON.stringify(_importLsStore));
                    lsSuccess = true;
                } catch(lsErr) {
                    console.warn('[Import] LS写入失败(可能超quota):', lsErr.message);
                    try { localStorage.setItem('AIChatOS_v8', JSON.stringify({ user: store.user, system: store.system, theme: store.theme, _saveTimestamp: importTs, _importedAt: importTs })); } catch(e2) {}
                }
                // [FIX-导入只有美化] LS Core也写入_importedAt标记，确保reload后initStore能识别刚导入的数据
                try {
                    localStorage.setItem('AIChatOS_v8_Core', JSON.stringify({
                        user: store.user, theme: store.theme, system: store.system,
                        bubbleStyles: store.bubbleStyles, customCSS: store.customCSS, customFont: store.customFont,
                        page2: store.page2, compStyles: store.compStyles, appIcons: store.appIcons, desktopBg: store.desktopBg,
                        apiPresets: store.apiPresets, stt: store.stt, imgGen: store.imgGen, personas: store.personas,
                        perception: store.perception, couple: store.couple, _saveTimestamp: importTs, _importedAt: importTs
                    }));
                } catch(e) {}
                if(loading) loading.style.display = 'none';
                if (idbSuccess || lsSuccess) {
                    // [FIX-C] 导入成功后自动触发一次备份，方便导入错了能回滚
                    try {
                        if (window.BackupManager && typeof window.BackupManager.backupNow === 'function') {
                            window.BackupManager.backupNow('导入前自动备份').catch(function(){});
                        }
                    } catch(_bkErr) {}
                    
                    // [FIX-导入数据不恢复-v4] 回读 IDB 验证数据已真正持久化。
                    // iOS Safari 的 IDB 写入可能是 lazy flush，reload 时数据可能还没落盘。
                    // 使用多次重试验证，确保数据确实写入成功。
                    var _verifiedPersist = false;
                    var _verifyMaxRetries = 5;
                    for (var _vRetry = 0; _vRetry < _verifyMaxRetries; _vRetry++) {
                        try {
                            if (_vRetry > 0) {
                                // 每次重试间隔递增（500ms, 1000ms, 1500ms, 2000ms）
                                await new Promise(function(r) { setTimeout(r, _vRetry * 500); });
                            }
                            var _readBack = await idb.get('AIChatOS_v8');
                            if (_readBack && _readBack._importedAt === importTs) {
                                _verifiedPersist = true;
                                console.log('[Import-v4] IDB 回读验证成功 (重试' + _vRetry + '次), _importedAt=' + importTs);
                                break;
                            } else {
                                console.warn('[Import-v4] IDB 回读不匹配 (attempt ' + _vRetry + '), 期望=' + importTs + ', 实际=' + (_readBack && _readBack._importedAt));
                            }
                        } catch(_vErr) {
                            console.warn('[Import-v4] IDB 回读异常 (attempt ' + _vRetry + '):', _vErr);
                        }
                    }
                    
                    // [FIX-导入数据不恢复-v4] 如果IDB多次验证都失败，尝试重新写入一次
                    if (!_verifiedPersist && idbSuccess) {
                        console.warn('[Import-v4] IDB验证失败，尝试单独重写主store...');
                        try {
                            var _retryStore = Object.assign({}, store);
                            _retryStore._importedAt = importTs;
                            _retryStore._saveTimestamp = importTs;
                            var _retryChats = _retryStore.chats || {};
                            _retryStore.chats = {};
                            _retryStore._chatSharded = true;
                            _retryStore._chatIds = Object.keys(_retryChats);
                            await idb.set('AIChatOS_v8', _retryStore);
                            // 等待后再验证一次
                            await new Promise(function(r) { setTimeout(r, 1000); });
                            var _finalCheck = await idb.get('AIChatOS_v8');
                            if (_finalCheck && _finalCheck._importedAt === importTs) {
                                _verifiedPersist = true;
                                console.log('[Import-v4] 重写后验证成功');
                            }
                        } catch(_rwErr) {
                            console.warn('[Import-v4] 重写失败:', _rwErr);
                        }
                    }
                    
                    // [FIX-导入数据不恢复-v4] 在 LS 中写入导入标记，作为 IDB 不可靠时的回退。
                    // initStore 会检查此标记，如果 IDB 数据比 LS 导入旧，使用 LS 数据。
                    try {
                        localStorage.setItem('AIChatOS_v8_ImportTs', String(importTs));
                    } catch(_e) {}
                    
                    // [FIX-导入数据不恢复-v4] iOS Safari 专用：检测平台决定刷新延迟
                    var _isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                    var _reloadDelay;
                    if (_verifiedPersist) {
                        _reloadDelay = 2000; // 验证通过：2秒
                    } else if (_isIOSSafari) {
                        _reloadDelay = 8000; // iOS未验证：8秒（给Safari更多flush时间）
                    } else {
                        _reloadDelay = 4000; // 其他未验证：4秒
                    }
                    
                    toast("数据导入成功，" + (_reloadDelay / 1000) + "秒后刷新..." + (_verifiedPersist ? '' : '（正在等待数据落盘）'), "success");
                    setTimeout(function() { location.reload(); }, _reloadDelay);
                } else {
                    window._importReloading = false; // 保存失败时恢复自动保存
                    toast("导入后保存失败，请检查存储空间后重试", "error");
                }
            } catch(err) {
                window._importReloading = false; // 异常时恢复自动保存
                if(loading) loading.style.display = 'none';
                toast("导入失败: " + err.message, "error");
            }
            _pendingImportData = null;
        }

        function handleImport(input) {
            const file = input.files[0];
            if (!file) return;
            
            const fileName = (file.name || '').toLowerCase();
            const fileType = (file.type || '').toLowerCase();
            const isJsonByName = fileName.endsWith('.json');
            const isGzByName = fileName.endsWith('.gz') || fileName.endsWith('.json.gz');
            const isJsonByType = fileType.includes('json');
            const isGzByType = fileType.includes('gzip') || fileType.includes('x-gzip');
            const isTextByType = fileType.includes('text') || fileType === '';
            const isOctetStream = fileType === 'application/octet-stream';
            
            if (fileName && !isJsonByName && !isGzByName && !isJsonByType && !isGzByType && !isTextByType && !isOctetStream) {
                toast("请选择 .json 或 .json.gz 格式的备份文件", "error");
                input.value = '';
                return;
            }
            
            const loading = document.getElementById('loading');
            if(loading) loading.style.display = 'block';
            toast("正在读取备份文件...", "info");
            
            // [FIX-导入压缩支持] 统一的数据解析管线
            async function _parseImportContent(rawContent, isCompressed) {
                var jsonStr;
                
                if (isCompressed) {
                    // gzip压缩文件：使用 DecompressionStream API 解压
                    toast("正在解压数据...", "info");
                    if (typeof DecompressionStream !== 'undefined') {
                        try {
                            var _ds = new DecompressionStream('gzip');
                            var _writer = _ds.writable.getWriter();
                            var _reader = _ds.readable.getReader();
                            var _textChunks = [];
                            
                            _writer.write(new Uint8Array(rawContent));
                            _writer.close();
                            
                            var _decoder = new TextDecoder();
                            while (true) {
                                var _r = await _reader.read();
                                if (_r.done) break;
                                _textChunks.push(_decoder.decode(_r.value, { stream: true }));
                            }
                            _textChunks.push(_decoder.decode()); // flush
                            jsonStr = _textChunks.join('');
                        } catch(_decompErr) {
                            throw new Error("解压失败: " + _decompErr.message + "。文件可能已损坏。");
                        }
                    } else {
                        throw new Error("当前浏览器不支持解压 .gz 文件。请使用Chrome/Safari/Firefox最新版本，或导出未压缩的 .json 文件。");
                    }
                } else {
                    jsonStr = rawContent;
                }
                
                if (!jsonStr) throw new Error("文件内容为空");
                
                var fileSizeMB = (jsonStr.length / 1024 / 1024).toFixed(2);
                if (jsonStr.length > 500 * 1024 * 1024) {
                    throw new Error("文件过大(" + fileSizeMB + "MB)，可能导致浏览器崩溃。");
                }
                
                toast("正在解析数据(" + fileSizeMB + "MB)...", "info");
                await new Promise(function(r) { setTimeout(r, 50); });
                
                // 预处理：清理可能导致JSON解析失败的内容
                var cleanContent = jsonStr;
                // 1. 移除 BOM（UTF-8 BOM: \uFEFF）
                if (cleanContent.charCodeAt(0) === 0xFEFF) {
                    cleanContent = cleanContent.slice(1);
                }
                // 2. 移除 NUL 和其他非法控制字符 + \u2028\u2029（保留 \t \n \r）
                cleanContent = cleanContent.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u2028\u2029]/g, '');
                // 3. 检测是否为 JSON 格式（必须以 { 或 [ 开头）
                var trimmed = cleanContent.trimStart();
                if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                    var preview = trimmed.substring(0, 20);
                    throw new Error("该文件不是JSON格式（开头为: \"" + preview + "...\"）。请确认选择的是 .json 备份文件，而非回忆录等其他格式的文件。");
                }
                
                try {
                    return JSON.parse(cleanContent);
                } catch(parseErr) {
                    var posInfo = '';
                    try {
                        var posMatch = parseErr.message.match(/position\s+(\d+)/i);
                        if (posMatch) {
                            var pos = parseInt(posMatch[1]);
                            var ctx = cleanContent.substring(Math.max(0, pos - 30), pos + 30);
                            posInfo = '\n出错位置附近: ...' + ctx + '...';
                        }
                    } catch(_) {}
                    throw new Error("JSON解析失败，文件可能已损坏: " + parseErr.message + posInfo);
                }
            }
            
            // [FIX-导入压缩支持-v2] 统一以ArrayBuffer读取，然后用gzip魔术字节自动检测
            // iOS上文件名后缀和MIME type都不可靠（.gz文件可能报告为octet-stream或text/plain），
            // 改用gzip魔术字节（0x1F 0x8B）自动检测，比文件名/MIME判断更准确可靠
            var _smartReader = new FileReader();
            _smartReader.onload = async function(e) {
                try {
                    var arrayBuf = e.target.result;
                    var bytes = new Uint8Array(arrayBuf);
                    
                    // 检测gzip魔术字节：0x1F 0x8B
                    var _isActuallyGzip = bytes.length > 2 && bytes[0] === 0x1F && bytes[1] === 0x8B;
                    
                    if (_isActuallyGzip) {
                        console.log('[Import] 检测到gzip魔术字节，按压缩文件处理');
                        var data = await _parseImportContent(arrayBuf, true);
                        _handleParsedImportData(data, loading);
                    } else {
                        // 不是gzip，当作纯文本JSON处理
                        // 先尝试UTF-8解码
                        var textContent;
                        try {
                            var decoder = new TextDecoder('utf-8', { fatal: false });
                            textContent = decoder.decode(bytes);
                        } catch(_decErr) {
                            // TextDecoder不可用时回退（极旧浏览器）
                            textContent = String.fromCharCode.apply(null, bytes.length < 65535 ? bytes : new Uint8Array(arrayBuf));
                        }
                        var data = await _parseImportContent(textContent, false);
                        _handleParsedImportData(data, loading);
                    }
                } catch(err) {
                    console.error("Import failed:", err);
                    if(loading) loading.style.display = 'none';
                    toast("导入失败: " + err.message, "error");
                }
            };
            _smartReader.onerror = function(evt) {
                if(loading) loading.style.display = 'none';
                toast("读取文件失败，请检查文件是否可访问", "error");
            };
            _smartReader.readAsArrayBuffer(file);
            input.value = '';
        }
        
        // [FIX-导入压缩支持] 提取解析后的公共处理逻辑
        async function _handleParsedImportData(data, loading) {
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                console.log("[Import] Valid data, keys:", Object.keys(data).slice(0,10).join(','));
                if(loading) loading.style.display = 'none';
                
                // 检查数据是否为空对象
                var dataKeyCount = Object.keys(data).filter(function(k){ return !k.startsWith('_'); }).length;
                if (dataKeyCount === 0) {
                    toast('备份文件中没有可导入的数据', 'error');
                    return;
                }
                
                // 暂存数据，显示选择性导入模态框
                _pendingImportData = data;
                if (!_showImportSelectModal(data)) {
                    // 模态框不可用，直接全量导入
                    console.log('[Import] 模态框不可用，直接全量导入');
                    _pendingImportData = null;
                    await _doImportMerge(data);
                } else {
                    toast('请选择要导入的数据类别，然后点击确认导入', 'info');
                }
            } else {
                throw new Error("无效的备份文件格式（不是JSON对象）");
            }
        }

        // --- VOICE CALL: SMOOTH SUBTITLE UPDATE ---
        function updateVcSubtitle(text) {
            const el = document.getElementById('vc-subtitle');
            if (!el) return;
            el.classList.add('fade-out');
            el.classList.remove('fade-in');
            setTimeout(() => {
                el.innerText = text;
                el.classList.remove('fade-out');
                el.classList.add('fade-in');
            }, 400);
        }

        // --- VOICE CALL LOGIC ---
        // Prevent touch swipe from causing page transitions when voice call layer is open
        (function initVCTouchGuard() {
            const vcLayer = document.getElementById('layer-voice-call');
            if (!vcLayer) return;

            // [FIX] 让layer可以接收焦点（用于sendVoiceCallText中的vcLayer.focus()）
            if (!vcLayer.hasAttribute('tabindex')) {
                vcLayer.setAttribute('tabindex', '-1');
                vcLayer.style.outline = 'none';
            }

            vcLayer.addEventListener('touchmove', function(e) {
                // Allow scrolling inside vc-history-content, block everything else
                if (!e.target.closest('#vc-history-content')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }, { passive: false });
            vcLayer.addEventListener('touchstart', function(e) {
                e.stopPropagation();
                // [FIX] 设置阻断标记，防止触摸语音通话layer时触发全局长按
                window._lastInputTouchTime = Date.now();
            }, { passive: true });
            vcLayer.addEventListener('touchend', function(e) {
                e.stopPropagation();
            }, { passive: true });

            // [FIX] 拦截语音通话layer内的所有键盘事件，防止穿透到底层chat-input
            vcLayer.addEventListener('keydown', function(e) {
                e.stopPropagation();
            }, { capture: false });
            vcLayer.addEventListener('keypress', function(e) {
                e.stopPropagation();
            }, { capture: false });
            vcLayer.addEventListener('keyup', function(e) {
                e.stopPropagation();
            }, { capture: false });

            // [FIX] 拦截click事件，防止穿透到底层
            vcLayer.addEventListener('click', function(e) {
                e.stopPropagation();
            }, { capture: false });
        })();

        // [新增] 通话内容保存到记忆系统
        function _saveCallConversationToMemory(contactId, conversationHistory, callType, durationText) {
            if (!contactId || !conversationHistory || conversationHistory.length < 2) return;
            try {
                const contact = store.contacts.find(c => c.id === contactId);
                if (!contact) return;
                const userName = getUserPersonaName(contact, store.user.name || '用户');
                const callTypeLabel = callType === 'video_call' ? '视频通话' : '语音通话';
                
                // 构建通话内容摘要
                const recentHistory = conversationHistory.slice(-30);
                let conversationText = recentHistory.map(h => {
                    if (h.role === 'user') return `${userName}: ${h.text}`;
                    if (h.role === 'ai') return `${contact.name}: ${h.text}`;
                    return '';
                }).filter(s => s).join('\n');
                
                if (!conversationText || conversationText.length < 20) return; // 内容太少不保存
                
                // 直接保存为记忆摘要（不调用API，直接记录通话内容）
                if (!store.memorySummaries) store.memorySummaries = {};
                if (!store.memorySummaries[contactId]) store.memorySummaries[contactId] = [];
                
                // 截取关键内容，避免过长
                if (conversationText.length > 800) {
                    conversationText = conversationText.substring(0, 800) + '...';
                }
                
                const memoryContent = `[${callTypeLabel}记录，时长${durationText}] ${conversationText}`;

                // [类人记忆系统] 同时写入新的分层记忆系统
                if (window.MemorySystem && window.MemorySystem.Pipeline) {
                    try {
                        window.MemorySystem.Pipeline.addManual(contactId, memoryContent, {
                            tier: 'short', // 通话原始记录先入短期，AI总结后会晋升
                            tags: ['call', callType]
                        });
                    } catch(_) {}
                } else {
                    const _callMemo = {
                        id: 'memo_call_' + Date.now(),
                        date: Date.now(),
                        content: memoryContent,
                        source: callType,
                        fictional: false
                    };
                    store.memorySummaries[contactId].push(_callMemo);
                    _syncMemoToNewSystem(contactId, _callMemo);
                    if (store.memorySummaries[contactId].length > 100) {
                        store.memorySummaries[contactId] = store.memorySummaries[contactId].slice(-80);
                    }
                }
                
                // [FIX-通话记忆总结] 如果联系人开启了自动记忆总结，使用AI对通话内容进行总结
                if (contact.settings?.enableMemorySummary) {
                    _autoSummarizeCallConversation(contactId, contact, userName, conversationText, callTypeLabel, durationText);
                }
                
                console.log(`[${callTypeLabel}] 通话记忆已保存，联系人: ${contact.name}`);
            } catch(e) {
                console.warn('保存通话记忆失败:', e);
            }
        }

        // [新增] 自动AI总结通话内容
        async function _autoSummarizeCallConversation(contactId, contact, userName, conversationText, callTypeLabel, durationText) {
            try {
                const contactName = contact.name || '对方';
                const existingMems = (store.memorySummaries && store.memorySummaries[contactId]) ?
                    store.memorySummaries[contactId].filter(m => m.source !== 'voice_call' && m.source !== 'video_call').slice(-5).map(m => m.content).join('\n') : '';

                const sysPrompt = `你是${contactName}，请以你（${contactName}）的第一人称视角，根据以下${callTypeLabel}（时长${durationText}）的对话记录提取关键信息生成记忆条目。要求：
1. 用"我"称呼自己（${contactName}），用"${userName}"称呼对方
2. 重点提取：重要事件、${userName}的偏好/习惯、关系变化、约定/承诺、提到的人名地名、情感转折点
3. 不要泛泛而谈，要提取具体事实
4. 80-150字，可以用分号分隔多个要点
${existingMems ? `5. 已有记忆（避免重复）：\n${existingMems}` : ''}`;

                const data = await API.chatCompletion([
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: conversationText }
                ]);
                const summaryText = data.choices[0].message.content;

                if (!store.memorySummaries) store.memorySummaries = {};
                if (!store.memorySummaries[contactId]) store.memorySummaries[contactId] = [];

                const _callSumMemo = {
                    id: 'memo_call_summary_' + Date.now(),
                    date: Date.now(),
                    content: `[通话总结] ${summaryText}`,
                    source: 'call_summary',
                    fictional: false
                };
                store.memorySummaries[contactId].push(_callSumMemo);
                _syncMemoToNewSystem(contactId, _callSumMemo);

                save();
                console.log(`[${callTypeLabel}] AI总结已生成，联系人:`, contactName);
            } catch(e) {
                console.warn(`${callTypeLabel}AI总结生成失败:`, e);
            }
        }

        let _vcLastCallTime = 0; // Debounce: prevent rapid re-triggers
        // [FIX-去重] 语音通话对话历史，用于给AI提供上下文避免重复
        let _vcConversationHistory = [];
        function startVoiceCall() {
            // Close ext-menu immediately to prevent accidental re-triggers
            closeExtMenu();

            // [FIX] 如果视频通话正在进行中，不允许触发语音通话
            if (window._vidCallState && window._vidCallState.active) return;
            // [FIX] 如果视频通话layer正在显示，也阻止
            const vidCallLayer = document.getElementById('layer-video-call');
            if (vidCallLayer && vidCallLayer.classList.contains('show')) return;

            // [FIX-v6] 语音通话只能从聊天界面触发，必须确保layer-chat处于显示状态
            const chatLayer = document.getElementById('layer-chat');
            if (!chatLayer || !chatLayer.classList.contains('show')) return;
            
            // [FIX-v6] 如果桌面处于活动状态，说明刚从其他app退出，阻止触发
            const desktopLayer = document.getElementById('layer-desktop');
            if (desktopLayer && desktopLayer.classList.contains('active')) return;
    
            // [FIX-v5] 防止从设置页面等非聊天界面意外触发（包括长按API密钥等场景）
            const settingsLayer = document.getElementById('layer-settings');
            if (settingsLayer && settingsLayer.classList.contains('show')) return;
            // 美化页面也要阻止
            const beautyLayer = document.getElementById('layer-beauty');
            if (beautyLayer && beautyLayer.classList.contains('show')) return;
            // [FIX-地图语音冲突] 地图app打开时阻止语音通话触发
            const mapLayer = document.getElementById('layer-map');
            if (mapLayer && mapLayer.classList.contains('show')) return;
            // 如果有任何非微信/非聊天的layer处于显示状态，也阻止
            const anyNonWxLayer = document.querySelector('.layer.show:not(#layer-wechat):not(#layer-voice-call):not(#layer-video-call):not(#layer-chat)');
            if (anyNonWxLayer) return;
            // [FIX-v5] 如果当前焦点在input/textarea上（如API Key输入框），也阻止
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) return;
            // [FIX-v6] 如果聊天设置页面打开，也阻止
            const chatSettingsLayer = document.getElementById('layer-chat-settings');
            if (chatSettingsLayer && chatSettingsLayer.classList.contains('show')) return;
            // [FIX-Edge] Edge浏览器兼容：检查最近1秒内是否有过输入框/设置页的touchstart
            // Edge的stopPropagation有时无法阻止capture阶段，用时间戳双重保险
            if (window._lastInputTouchTime && (Date.now() - window._lastInputTouchTime) < 1000) return;

            if (!activeChatId) return toast("请先选择联系人");
            // Debounce: block if called within 2 seconds of last call
            const now = Date.now();
            if (now - _vcLastCallTime < 2000) return;
            _vcLastCallTime = now;

            // Guard: if already in a call (minimized), re-show the voice call layer
            if (store.callState && store.callState.active) {
                const vcLayer = document.getElementById('layer-voice-call');
                if (vcLayer && !vcLayer.classList.contains('show')) {
                    vcLayer.classList.add('show');
                    removeVCMiniBubble();
                    return;
                }
                return; // already visible
            }

            // Guard: don't start if voice call layer is already visible
            const vcLayer = document.getElementById('layer-voice-call');
            if (vcLayer && vcLayer.classList.contains('show')) return;

            const contact = store.contacts.find(c => c.id === activeChatId);
            if (!contact) return toast("找不到联系人");

            // Confirmation dialog to prevent accidental triggers
            showConfirm('语音通话', `确定要给 ${contact.name} 打电话吗？`, () => {
                _doStartVoiceCall(contact, false); // false = 我主动打出
            });
        }

        function _doStartVoiceCall(contact, isIncoming) {
            // 先彻底清理上一次通话残留状态，防止卡死
            try {
                if(store.callState.timerInterval) { clearInterval(store.callState.timerInterval); store.callState.timerInterval = null; }
                if(store.callState.recognition) { store.callState.recognition.onend = null; store.callState.recognition.onerror = null; try { store.callState.recognition.stop(); } catch(e){} store.callState.recognition = null; }
                store.callState.isSpeaking = false;
            } catch(e) { console.warn('VC cleanup error', e); }

            // Stop Music if playing - [FIX-一起听断开] 记录通话前播放状态，通话结束后恢复
            const gAudio = document.getElementById('global-audio');
            _listenWasPlayingBeforeCall = !gAudio.paused && store.listenState && store.listenState.active;
            if(!gAudio.paused) {
                gAudio.pause();
                store.listenState.playing = false;
                updateListenUI();
            }

            // UI Init
            document.getElementById('vc-avatar-img').src = contact.avatar || _ph(120);
            document.getElementById('vc-status').innerText = isIncoming ? "正在接听..." : "正在呼叫...";
            updateVcSubtitle("");
            document.getElementById('vc-timer').innerText = "00:00";
            document.getElementById('vc-history-content').innerHTML = '';
            // [FIX-去重] 新通话开始时清空对话历史
            _vcConversationHistory = [];
            // [FIX-麦克风按钮] 新通话开始时清空缓存的文字
            _vcPendingTexts = [];
            document.getElementById('vc-text-input-box').style.display = 'none';
            document.getElementById('vc-history-panel').style.display = 'none';
            document.querySelectorAll('.vc-btn.active').forEach(b => b.classList.remove('active'));
            
            // 应用语音通话背景
            const vcLayer = document.getElementById('layer-voice-call');
            if (contact.settings && contact.settings.vcBg) {
                vcLayer.style.backgroundImage = `url(${contact.settings.vcBg})`;
                vcLayer.style.backgroundSize = 'cover';
                vcLayer.style.backgroundPosition = 'center';
                vcLayer.style.backgroundRepeat = 'no-repeat';
            } else {
                // 清除所有内联背景样式，恢复CSS默认的灰色半透明毛玻璃效果
                vcLayer.style.backgroundImage = '';
                vcLayer.style.backgroundSize = '';
                vcLayer.style.backgroundPosition = '';
                vcLayer.style.backgroundRepeat = '';
            }
            vcLayer.classList.add('show');
            
            // 关闭字体设置面板（如果上次打开了）
            const vcFontPanel = document.getElementById('vc-font-settings');
            if (vcFontPanel) vcFontPanel.style.display = 'none';
            // 应用已保存的字体设置
            if (typeof _applyVCFont === 'function') _applyVCFont();
            // 更新动作描写开关按钮UI
            _updateVCActionBtnUI();

            // Play ringtone
            playRingtone();
            
            // State Init
            store.callState.active = true;
            store.callState.contactId = contact.id; // [FIX-联系人串号] 记录通话联系人ID，防止缩小后切换聊天导致串号
            store.callState.startTime = Date.now();
            store.callState.micMuted = false;
            store.callState.speakerOn = true;
            store.callState.isIncoming = !!isIncoming; // 标记是否为来电（对方打来的）
            
            // Start Timer
            store.callState.timerInterval = setInterval(() => {
                if (!store.callState.active) { clearInterval(store.callState.timerInterval); return; }
                const diff = Math.floor((Date.now() - store.callState.startTime) / 1000);
                const m = Math.floor(diff / 60).toString().padStart(2, '0');
                const s = (diff % 60).toString().padStart(2, '0');
                document.getElementById('vc-timer').innerText = `${m}:${s}`;
            }, 1000);
            
            // PTT模式：不自动启动语音识别，等用户按住说话按钮
            // 显示PTT按钮区域
            document.getElementById('vc-ptt-area').style.display = 'flex';
            // 隐藏实时文字区域（等按住时再显示）
            document.getElementById('vc-live-transcript').classList.remove('active');
            document.getElementById('vc-live-transcript-content').innerHTML = '';
            
            // Fake Connection Delay（来电已停止铃声，去电需要等待连接）
            const connectDelay = isIncoming ? 500 : 1500;
            setTimeout(() => {
                if (!store.callState.active) return; // 已挂断则跳过
                document.getElementById('vc-status').innerText = "通话中";
                stopRingtone();
                playVoiceSystemSound('connect');
            }, connectDelay);
        }

        // Extra guard: block swipe navigation when voice call or video call is active
        function isVoiceCallActive() {
            return (store.callState && store.callState.active) || (typeof isVideoCallActive === 'function' && isVideoCallActive());
        }

        function endVoiceCall() {
            // [FIX-问题4] 记录通话时长，用于生成通话记录气泡
            let callDuration = store.callState.startTime ? Math.floor((Date.now() - store.callState.startTime) / 1000) : 0;
            // [FIX-通话时长异常] 防止残留startTime导致计算出不合理的超长通话时长
            if (callDuration > 86400 || callDuration < 0) {
                console.warn('[endVoiceCall] 检测到异常通话时长:', callDuration, '秒，已重置为0');
                callDuration = 0;
            }
            // [FIX-联系人串号] 使用通话开始时记录的contactId，而非当前activeChatId
            const callContactId = store.callState.contactId || activeChatId;
            const callIsIncoming = !!store.callState.isIncoming;
            
            // ====== 第1步：立即标记状态（阻止所有后续回调）======
            store.callState.active = false;
            store.callState.contactId = null; // [FIX-联系人串号] 通话结束清理contactId
            store.callState.isSpeaking = false;
            store.callState._pttActive = false;
            // [FIX-麦克风按钮] 通话结束时清空缓存的文字
            _vcPendingTexts = [];
            
            // [FIX-一起听断开] 通话结束后恢复音乐播放
            if(_listenWasPlayingBeforeCall && store.listenState && store.listenState.active) {
                setTimeout(function() {
                    var _gAudio = document.getElementById('global-audio');
                    if(_gAudio && _gAudio.src) {
                        _gAudio.play().then(function() {
                            store.listenState.playing = true;
                            updateListenUI();
                            console.log('[Listen] 通话结束，已恢复音乐播放');
                        }).catch(function(e) { console.warn('[Listen] 通话后恢复播放失败:', e.message); });
                    }
                }, 500);
                _listenWasPlayingBeforeCall = false;
            }
            
            // ====== 第2步：立即重置UI（保证视觉即时响应）======
            stopRingtone();
            removeVCMiniBubble();
            if(store.callState.timerInterval) { clearInterval(store.callState.timerInterval); store.callState.timerInterval = null; }
            
            // Stop TTS（轻量操作）
            try { const audio = document.getElementById('tts-audio'); if(audio) { audio.pause(); audio.currentTime = 0; } } catch(e) {}
            
            // 快速重置UI元素
            const vcPulse = document.getElementById('vc-avatar-pulse');
            const vcWave = document.getElementById('vc-mic-wave');
            const vcTextBox = document.getElementById('vc-text-input-box');
            const vcHistPanel = document.getElementById('vc-history-panel');
            const vcPttBtn = document.getElementById('vc-ptt-btn');
            const vcPttHint = document.getElementById('vc-ptt-hint');
            const vcTranscript = document.getElementById('vc-live-transcript');
            const vcTransContent = document.getElementById('vc-live-transcript-content');
            
            if(vcPulse) vcPulse.classList.remove('speaking');
            if(vcWave) vcWave.classList.remove('active');
            if(vcTextBox) vcTextBox.style.display = 'none';
            if(vcHistPanel) vcHistPanel.style.display = 'none';
            document.querySelectorAll('.vc-btn.active').forEach(b => b.classList.remove('active'));
            if(vcPttBtn) vcPttBtn.classList.remove('pressing');
            if(vcPttHint) { vcPttHint.textContent = '按住说话'; vcPttHint.classList.remove('recording'); }
            if(vcTranscript) vcTranscript.classList.remove('active');
            if(vcTransContent) vcTransContent.innerHTML = '';
            
            // 播放挂断音效 + 立即开始关闭动画
            playVoiceSystemSound('hangup');
            setTimeout(() => {
                document.getElementById('layer-voice-call').classList.remove('show');
            }, 300);
            
            // ====== 第3步：异步清理重操作（不阻塞UI）======
            setTimeout(() => {
                // 清理语音服务检测计时器
                if(store.callState._pttServiceCheckTimer) { clearTimeout(store.callState._pttServiceCheckTimer); store.callState._pttServiceCheckTimer = null; }
                // [FIX-松开残留] 清理PTT安全超时计时器
                if(store.callState._pttSafetyTimer) { clearTimeout(store.callState._pttSafetyTimer); store.callState._pttSafetyTimer = null; }
                // 彻底停止语音识别
                if(store.callState.recognition) {
                    store.callState.recognition.onend = null;
                    store.callState.recognition.onerror = null;
                    store.callState.recognition.onresult = null;
                    try { store.callState.recognition.stop(); } catch(e) {}
                    store.callState.recognition = null;
                }
                
                // 停止STT API录音
                stopSTTApiCapture();
                
                // 添加语音通话记录气泡到聊天记录
                if (callContactId && callDuration > 0) {
                    if (!store.chats[callContactId]) store.chats[callContactId] = [];
                    const minutes = Math.floor(callDuration / 60);
                    const seconds = callDuration % 60;
                    const durationText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                    // [新增-通话记录] 将通话对话内容保存到消息中，便于点击气泡查看
                    let _vcCallDialogText = '';
                    if (_vcConversationHistory && _vcConversationHistory.length > 0) {
                        const _vcContact = store.contacts.find(c => c.id === callContactId);
                        const _vcUserName = (typeof getUserPersonaName === 'function' && _vcContact) ? getUserPersonaName(_vcContact, store.user.name || '用户') : (store.user.name || '用户');
                        const _vcContactName = _vcContact ? _vcContact.name : '对方';
                        _vcCallDialogText = _vcConversationHistory.map(h => {
                            if (h.role === 'user') return _vcUserName + ': ' + h.text;
                            if (h.role === 'ai') return _vcContactName + ': ' + h.text;
                            return '';
                        }).filter(s => s).join('\n');
                        if (_vcCallDialogText.length > 2000) _vcCallDialogText = _vcCallDialogText.substring(0, 2000) + '...';
                    }
                    store.chats[callContactId].push({
                        sender: callIsIncoming ? 'ai' : 'me',
                        type: 'voice_call',
                        content: durationText,
                        duration: callDuration,
                        time: Date.now(),
                        callDialog: _vcCallDialogText || ''
                    });

                    // [新增] 将语音通话内容保存到记忆系统
                    _saveCallConversationToMemory(callContactId, _vcConversationHistory, 'voice_call', durationText);

                    // 延迟save和renderHistory，避免卡顿
                    requestAnimationFrame(() => {
                        save();
                        if (activeChatId === callContactId) {
                            renderHistory();
                        }
                    });
                }
            }, 50);
        }

        // ===== 联系人主动发起语音通话邀请 =====
        function showIncomingCallInvite(contact) {
            if (!contact) return;
            // 如果已经在通话中，不弹出
            if (store.callState && store.callState.active) return;
            // 如果已有来电弹窗，不重复弹出
            if (document.getElementById('incoming-call-overlay')) return;

            // 播放来电铃声
            playRingtone();

            // 创建来电弹窗
            const overlay = document.createElement('div');
            overlay.id = 'incoming-call-overlay';
            overlay.className = 'incoming-call-overlay';
            overlay.innerHTML = `
                <div class="incoming-call-popup">
                    <div class="incoming-call-avatar">
                        <div class="incoming-call-avatar-pulse"></div>
                        <img src="${contact.avatar || _ph(80)}" alt="${contact.name}">
                    </div>
                    <div class="incoming-call-name">${contact.name}</div>
                    <div class="incoming-call-label">邀请您进行语音通话</div>
                    <div class="incoming-call-buttons">
                        <div class="incoming-call-btn reject" onclick="handleIncomingCallReject()">
                            <i class="fas fa-phone-slash"></i>
                            <span>拒绝</span>
                        </div>
                        <div class="incoming-call-btn accept" onclick="handleIncomingCallAccept('${contact.id}')">
                            <i class="fas fa-phone-alt"></i>
                            <span>接听</span>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('device').appendChild(overlay);

            // 30秒后自动取消（未接来电）
            overlay._autoRejectTimer = setTimeout(() => {
                handleIncomingCallReject();
                // 添加未接来电记录
                if (contact.id) {
                    if (!store.chats[contact.id]) store.chats[contact.id] = [];
                    store.chats[contact.id].push({
                        sender: 'ai',
                        type: 'voice_call',
                        content: '未接来电',
                        duration: 0,
                        time: Date.now()
                    });
                    save();
                    if (activeChatId === contact.id) renderHistory();
                }
            }, 30000);
        }

        function handleIncomingCallAccept(contactId) {
            const overlay = document.getElementById('incoming-call-overlay');
            if (overlay) {
                if (overlay._autoRejectTimer) clearTimeout(overlay._autoRejectTimer);
                overlay.remove();
            }
            stopRingtone();

            // 找到联系人并启动语音通话（来电接听）
            const contact = store.contacts.find(c => c.id === contactId);
            if (contact) {
                // 确保在聊天界面
                activeChatId = contactId;
                _doStartVoiceCall(contact, true); // true = 对方打来的（来电）
            }
        }

        function handleIncomingCallReject() {
            const overlay = document.getElementById('incoming-call-overlay');
            if (overlay) {
                if (overlay._autoRejectTimer) clearTimeout(overlay._autoRejectTimer);
                overlay.classList.add('dismissing');
                setTimeout(() => overlay.remove(), 300);
            }
            stopRingtone();
        }

        // [FIX-麦克风按钮] 缓冲区：当麦克风关闭（静音）时，用户的话会被缓存
        // 当用户重新开启麦克风时，所有缓存的话一次性发送给AI处理
        let _vcPendingTexts = [];
        
        function toggleVCMute() {
            store.callState.micMuted = !store.callState.micMuted;
            const btn = document.getElementById('vc-btn-mute');
            if(store.callState.micMuted) {
                btn.classList.add('active');
                btn.title = '麦克风已关闭（说的话会被缓存，开启后联系人才会回复）';
                if(store.callState.recognition) store.callState.recognition.stop();
                // 显示提示
                toast('麦克风已关闭，你可以继续说话但对方不会立即回复', 'info');
            } else {
                btn.classList.remove('active');
                btn.title = '麦克风已开启（说完话联系人会立即回复）';
                // [FIX-麦克风按钮] 开启麦克风时，如果有缓存的文字，合并发送给AI
                if (_vcPendingTexts.length > 0) {
                    const combinedText = _vcPendingTexts.join('。');
                    _vcPendingTexts = [];
                    toast('正在发送缓存的消息...', 'info');
                    updateVcSubtitle("我: " + combinedText);
                    appendVoiceLog('me', combinedText);
                    processVoiceInput(combinedText);
                } else {
                    // ★ [FIX-麦克风重启] 没有缓存消息时，重启语音识别以继续监听
                    if (store.callState.active && store.callState.recognition && !store.callState.isSpeaking) {
                        setTimeout(() => {
                            try { store.callState.recognition.start(); } catch(e) { console.log('[VC] 重启识别失败:', e); }
                        }, 200);
                    }
                }
            }
        }

        function toggleVCSpeaker() {
            store.callState.speakerOn = !store.callState.speakerOn;
            const btn = document.getElementById('vc-btn-speaker');
            if(store.callState.speakerOn) btn.classList.add('active');
            else btn.classList.remove('active');
            // In a real app, this would switch audio output device
        }

        function toggleVCKeyboard() {
            const area = document.getElementById('vc-text-input-box');
            area.style.display = area.style.display === 'flex' ? 'none' : 'flex';
            if (area.style.display === 'flex') {
                // [FIX] 设置输入阻断标记，防止键盘弹出时触发长按通话
                window._lastInputTouchTime = Date.now();
                document.getElementById('vc-input').focus();
            }
        }
        
        // 移除语音通话悬浮小窗
        function removeVCMiniBubble() {
            const existing = document.getElementById('vc-mini-bubble');
            if (existing) existing.remove();
        }

        function toggleVCMinimize() {
            document.getElementById('layer-voice-call').classList.remove('show');
            // 创建悬浮小窗口
            removeVCMiniBubble();
            const bubble = document.createElement('div');
            bubble.id = 'vc-mini-bubble';
            bubble.style.cssText = 'position:fixed;top:50px;right:10px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#4facfe,#00f2fe);z-index:9500;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(0,0,0,0.3);cursor:pointer;animation:vc-bubble-pulse 2s infinite;';
            bubble.innerHTML = '<i class="fas fa-phone-alt" style="color:#fff;font-size:22px;"></i>';
            // 点击小窗回到通话
            // [FIX-联系人串号] 记录通话联系人ID，点击恢复时切回对应聊天
            const _bubbleContactId = store.callState.contactId;
            bubble.onclick = function() {
                // 如果当前聊天不是通话联系人，先切回去
                if (_bubbleContactId && activeChatId !== _bubbleContactId) {
                    activeChatId = _bubbleContactId;
                    if (typeof renderChat === 'function') renderChat();
                }
                document.getElementById('layer-voice-call').classList.add('show');
                removeVCMiniBubble();
            };
            // 长按挂断
            let _bubbleLongPress = null;
            bubble.ontouchstart = bubble.onmousedown = function(e) {
                _bubbleLongPress = setTimeout(function() {
                    endVoiceCall();
                    removeVCMiniBubble();
                }, 1000);
            };
            bubble.ontouchend = bubble.onmouseup = bubble.ontouchcancel = function() {
                if (_bubbleLongPress) { clearTimeout(_bubbleLongPress); _bubbleLongPress = null; }
            };
            document.getElementById('device').appendChild(bubble);
            toast("通话小窗 · 点击返回 · 长按挂断");
        }
        
        function toggleVCMore() {
            const panel = document.getElementById('vc-history-panel');
            panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
        }

        // ===== 语音通话动作描写开关 =====
        function toggleVCActionMode() {
            // 读取当前状态（默认开启动作描写）
            if (!store.vcSettings) store.vcSettings = {};
            store.vcSettings.hideActions = !store.vcSettings.hideActions;
            save();
            // 更新按钮UI
            _updateVCActionBtnUI();
            const status = store.vcSettings.hideActions ? '已关闭动作描写，仅显示语言' : '已开启动作描写';
            toast(status, 'success');
        }

        function _updateVCActionBtnUI() {
            const btn = document.getElementById('vc-toggle-action-btn');
            if (!btn) return;
            const hideActions = store.vcSettings && store.vcSettings.hideActions;
            if (hideActions) {
                btn.style.opacity = '0.4';
                btn.title = '动作描写已关闭（点击开启）';
            } else {
                btn.style.opacity = '0.9';
                btn.title = '动作描写已开启（点击关闭）';
            }
        }

        // ===== 语音通话字体设置 =====
        function toggleVCFontSettings() {
            const panel = document.getElementById('vc-font-settings');
            if (!panel) return;
            if (panel.style.display === 'none' || !panel.style.display) {
                panel.style.display = 'block';
                // 加载已保存的设置
                const saved = store.vcFontSettings || { size: 15, color: '#ffffff' };
                const slider = document.getElementById('vc-font-size-slider');
                if (slider) slider.value = saved.size;
                document.getElementById('vc-font-size-val').textContent = saved.size + 'px';
                document.getElementById('vc-font-color-picker').value = saved.color;
                // 高亮选中的颜色
                document.querySelectorAll('.vc-color-opt').forEach(el => {
                    const bg = el.style.background;
                    el.style.borderColor = bg === saved.color ? 'rgba(255,255,255,0.8)' : 'transparent';
                });
            } else {
                panel.style.display = 'none';
            }
        }

        function applyVCFontSettings() {
            const size = document.getElementById('vc-font-size-slider').value;
            document.getElementById('vc-font-size-val').textContent = size + 'px';
            if (!store.vcFontSettings) store.vcFontSettings = { size: 15, color: '#ffffff' };
            store.vcFontSettings.size = parseInt(size);
            _applyVCFont();
            save();
        }

        function setVCFontColor(color) {
            if (!store.vcFontSettings) store.vcFontSettings = { size: 15, color: '#ffffff' };
            store.vcFontSettings.color = color;
            document.getElementById('vc-font-color-picker').value = color;
            // 更新高亮
            document.querySelectorAll('.vc-color-opt').forEach(el => {
                const elColor = el.getAttribute('onclick').match(/'([^']+)'/);
                el.style.borderColor = (elColor && elColor[1] === color) ? 'rgba(255,255,255,0.8)' : 'transparent';
            });
            _applyVCFont();
            save();
        }

        function _applyVCFont() {
            const settings = store.vcFontSettings || { size: 15, color: '#ffffff' };
            // 应用到通话界面文字元素
            const subtitle = document.getElementById('vc-subtitle');
            const status = document.getElementById('vc-status');
            const transcript = document.getElementById('vc-live-transcript-content');
            const logTexts = document.querySelectorAll('.vc-log-text');
            const logActions = document.querySelectorAll('.vc-log-action');
            if (subtitle) { subtitle.style.fontSize = settings.size + 'px'; subtitle.style.color = settings.color; }
            if (status) { status.style.fontSize = (settings.size + 3) + 'px'; status.style.color = settings.color; }
            if (transcript) { transcript.style.fontSize = settings.size + 'px'; transcript.style.color = settings.color; }
            logTexts.forEach(el => { el.style.fontSize = settings.size + 'px'; el.style.color = settings.color; });
            logActions.forEach(el => { el.style.fontSize = (settings.size - 2) + 'px'; });
        }

        function appendVoiceLog(sender, textOrObj) {
            const item = document.createElement('div');
            item.className = 'vc-log-item ' + sender;
            
            // Sender Label
            const senderLabel = document.createElement('div');
            senderLabel.className = 'vc-log-sender ' + sender;
            senderLabel.innerText = sender === 'me' ? '我' : (store.contacts.find(c=>c.id===activeChatId)?.name || '对方');
            item.appendChild(senderLabel);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'vc-log-content';

            if (typeof textOrObj === 'object') {
                if (textOrObj.action) {
                    const actionDiv = document.createElement('div');
                    actionDiv.className = 'vc-log-action';
                    actionDiv.innerText = `*${textOrObj.action}*`;
                    contentDiv.appendChild(actionDiv);
                }
                const textDiv = document.createElement('div');
                textDiv.className = 'vc-log-text';
                textDiv.innerText = textOrObj.text;
                contentDiv.appendChild(textDiv);
            } else {
                const textDiv = document.createElement('div');
                textDiv.className = 'vc-log-text';
                textDiv.innerText = textOrObj;
                contentDiv.appendChild(textDiv);
            }
            
            item.appendChild(contentDiv);
            
            const box = document.getElementById('vc-history-content');
            box.appendChild(item);
            box.scrollTop = box.scrollHeight;
        }

        function initAudioCapture() {
            // 如果启用了STT API，使用MediaRecorder + API方式
            if (store.stt?.enabled) {
                initAudioCaptureSTTApi();
                return;
            }

            // 否则使用浏览器内置SpeechRecognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.warn("Browser does not support SpeechRecognition");
                toast("浏览器不支持语音识别，建议在设置中配置语音识别API", "error");
                return;
            }
            
            try {
                if (store.callState.recognition) {
                    store.callState.recognition.onend = null;
                    store.callState.recognition.stop();
                }

                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = 'zh-CN';

                // [新增] 语音服务可用性检测
                let _vcGotResult = false;
                let _vcServiceCheckTimer = null;

                recognition.onstart = () => {
                    document.getElementById('vc-mic-wave').classList.add('active');
                    // 启动服务可用性检测：5秒内无结果则提示
                    if (!_vcGotResult && !_vcServiceCheckTimer) {
                        _vcServiceCheckTimer = setTimeout(() => {
                            if (!_vcGotResult && store.callState.active) {
                                console.warn('[VC] 5秒内未收到识别结果，语音服务可能不可用');
                                toast("未检测到语音输入，请检查麦克风权限。若持续无法识别，建议在设置→语音识别中配置API", "error");
                            }
                        }, 5000);
                    }
                };

                recognition.onerror = (event) => {
                    console.error("Speech recognition error", event.error);
                    document.getElementById('vc-mic-wave').classList.remove('active');
                    if (event.error === 'no-speech' || event.error === 'aborted') {
                        return;
                    }
                    if (event.error === 'network') {
                        // [修复] 网络错误 = 语音服务连接失败
                        if (_vcServiceCheckTimer) { clearTimeout(_vcServiceCheckTimer); _vcServiceCheckTimer = null; }
                        toast("语音服务连接失败，建议在设置中配置语音识别API", "error");
                        return;
                    }
                    if (event.error === 'service-not-allowed') {
                        if (_vcServiceCheckTimer) { clearTimeout(_vcServiceCheckTimer); _vcServiceCheckTimer = null; }
                        toast("语音服务不可用，建议在设置中配置语音识别API", "error");
                    }
                };

                recognition.onend = () => {
                    document.getElementById('vc-mic-wave').classList.remove('active');
                    if(store.callState.active && !store.callState.micMuted && !store.callState.isSpeaking) {
                        setTimeout(() => {
                            try { recognition.start(); } catch(e) { console.log("Resume rec failed", e); }
                        }, 100);
                    }
                };

                recognition.onresult = (event) => {
                    _vcGotResult = true;
                    if (_vcServiceCheckTimer) { clearTimeout(_vcServiceCheckTimer); _vcServiceCheckTimer = null; }
                    let interim = '';
                    let final = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            final += event.results[i][0].transcript;
                        } else {
                            interim += event.results[i][0].transcript;
                        }
                    }
                    if (interim) updateVcSubtitle("我: " + interim);
                    if (final) {
                        updateVcSubtitle("我: " + final);
                        appendVoiceLog('me', final);
                        processVoiceInput(final);
                    }
                };

                store.callState.recognition = recognition;
                recognition.start();
            } catch(e) {
                console.error("Init Audio Capture Failed:", e);
            }
        }

        // --- STT API 模式的语音捕获 ---
        async function initAudioCaptureSTTApi() {
            try {
                // 停止之前的录音
                if (store.callState._sttMediaRecorder) {
                    try { store.callState._sttMediaRecorder.stop(); } catch(e) {}
                    store.callState._sttMediaRecorder = null;
                }
                if (store.callState._sttStream) {
                    store.callState._sttStream.getTracks().forEach(t => t.stop());
                    store.callState._sttStream = null;
                }

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                store.callState._sttStream = stream;

                const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
                                 MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
                if (!mimeType) { console.warn('No supported audio MIME type'); return; }

                // 使用VAD（静音检测）方式：录制片段，检测到停顿后发送
                let chunks = [];
                let silenceTimer = null;
                let isRecording = false;
                const SILENCE_TIMEOUT = 1500; // 1.5秒静音后认为说完

                // 创建AudioContext用于音量检测
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 512;
                source.connect(analyser);
                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                store.callState._sttAudioCtx = audioCtx;

                const mediaRecorder = new MediaRecorder(stream, { mimeType });
                store.callState._sttMediaRecorder = mediaRecorder;

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data);
                };

                mediaRecorder.onstop = async () => {
                    if (chunks.length === 0 || !store.callState.active) return;
                    const blob = new Blob(chunks, { type: mimeType });
                    chunks = [];

                    // 只处理大于一定大小的音频（过滤纯静音）
                    if (blob.size < 1000) {
                        restartRecording();
                        return;
                    }

                    document.getElementById('vc-mic-wave').classList.remove('active');
                    updateVcSubtitle("识别中...");

                    try {
                        const text = await callSTTApi(blob);
                        if (text && text.trim()) {
                            updateVcSubtitle("我: " + text);
                            appendVoiceLog('me', text);
                            processVoiceInput(text);
                        } else {
                            // 没识别到内容，继续录音
                            restartRecording();
                        }
                    } catch(e) {
                        console.error('STT API call failed:', e);
                        restartRecording();
                    }
                };

                function restartRecording() {
                    if (!store.callState.active || store.callState.micMuted || store.callState.isSpeaking) return;
                    try {
                        chunks = [];
                        mediaRecorder.start();
                        isRecording = true;
                        document.getElementById('vc-mic-wave').classList.add('active');
                    } catch(e) {
                        console.log('Restart recording failed:', e);
                    }
                }

                // 音量监测循环
                function checkVolume() {
                    if (!store.callState.active) return;
                    analyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

                    if (avg > 10) {
                        // 有声音
                        if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
                        if (!isRecording && !store.callState.isSpeaking && !store.callState.micMuted) {
                            restartRecording();
                        }
                    } else if (isRecording) {
                        // 静音中
                        if (!silenceTimer) {
                            silenceTimer = setTimeout(() => {
                                silenceTimer = null;
                                if (isRecording && mediaRecorder.state === 'recording') {
                                    isRecording = false;
                                    mediaRecorder.stop();
                                }
                            }, SILENCE_TIMEOUT);
                        }
                    }

                    requestAnimationFrame(checkVolume);
                }

                // 开始录音
                mediaRecorder.start();
                isRecording = true;
                document.getElementById('vc-mic-wave').classList.add('active');
                checkVolume();

            } catch(e) {
                console.error('STT API audio capture init failed:', e);
                toast('麦克风访问失败', 'error');
            }
        }

        // 停止STT API录音（挂断时调用）
        function stopSTTApiCapture() {
            if (store.callState._sttMediaRecorder) {
                try { store.callState._sttMediaRecorder.stop(); } catch(e) {}
                store.callState._sttMediaRecorder = null;
            }
            if (store.callState._sttStream) {
                store.callState._sttStream.getTracks().forEach(t => t.stop());
                store.callState._sttStream = null;
            }
            if (store.callState._sttAudioCtx) {
                try { store.callState._sttAudioCtx.close(); } catch(e) {}
                store.callState._sttAudioCtx = null;
            }
        }

        // --- PTT (按住说话) 功能 (重构：修复手机浏览器兼容性) ---
        function vcPttStart(e) {
            if (e) e.preventDefault();
            if (!store.callState.active || store.callState.isSpeaking) return;
            
            store.callState._pttActive = true;
            const btn = document.getElementById('vc-ptt-btn');
            const hint = document.getElementById('vc-ptt-hint');
            btn.classList.add('pressing');
            hint.textContent = '松开发送';
            hint.classList.add('recording');
            
            // 显示实时文字区域
            const transcriptEl = document.getElementById('vc-live-transcript');
            transcriptEl.classList.add('active');
            document.getElementById('vc-live-transcript-content').innerHTML = '<span class="interim">正在聆听...</span>';
            
            // 显示波形动画
            document.getElementById('vc-mic-wave').classList.add('active');
            
            // [FIX-松开残留] 安全超时：60秒后强制结束PTT，防止事件丢失导致永远卡在按住状态
            if (store.callState._pttSafetyTimer) clearTimeout(store.callState._pttSafetyTimer);
            store.callState._pttSafetyTimer = setTimeout(() => {
                if (store.callState._pttActive) {
                    console.warn('[PTT] 安全超时60秒，强制结束PTT');
                    vcPttEnd(null);
                }
                store.callState._pttSafetyTimer = null;
            }, 60000);
            
            // 启动语音识别
            _pttStartRecognition();
        }
        
        function vcPttEnd(e) {
            if (e) e.preventDefault();
            if (!store.callState._pttActive) {
                // [FIX-松开残留] 即使_pttActive已经为false，也强制清理UI状态
                // 防止极端情况下按钮效果残留
                _vcPttForceCleanUI();
                return;
            }
            store.callState._pttActive = false;
            
            // [FIX-松开残留] 清理安全超时计时器
            if (store.callState._pttSafetyTimer) {
                clearTimeout(store.callState._pttSafetyTimer);
                store.callState._pttSafetyTimer = null;
            }
            
            _vcPttForceCleanUI();
            
            // 停止语音识别并获取最终结果
            _pttStopRecognition();
        }
        
        // [FIX-松开残留] 强制清理PTT按钮的所有视觉效果
        function _vcPttForceCleanUI() {
            const btn = document.getElementById('vc-ptt-btn');
            const hint = document.getElementById('vc-ptt-hint');
            const micWave = document.getElementById('vc-mic-wave');
            if (btn) btn.classList.remove('pressing');
            if (hint) {
                hint.textContent = '按住说话';
                hint.classList.remove('recording');
            }
            if (micWave) micWave.classList.remove('active');
        }

        // ====== PTT按钮事件绑定（修复手机浏览器兼容性）======
        (function initVcPttBtn() {
            const btn = document.getElementById('vc-ptt-btn');
            if (!btn) return;

            // 触摸事件
            btn.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                vcPttStart(e);
            }, { passive: false });

            btn.addEventListener('touchend', function(e) {
                e.preventDefault();
                e.stopPropagation();
                vcPttEnd(e);
            }, { passive: false });

            btn.addEventListener('touchcancel', function(e) {
                e.preventDefault();
                vcPttEnd(e);
            }, { passive: false });

            // 触摸移出按钮区域时结束录音
            btn.addEventListener('touchmove', function(e) {
                e.preventDefault();
                if (!store.callState._pttActive) return;
                const touch = e.touches[0];
                if (!touch) return;
                const rect = btn.getBoundingClientRect();
                const tolerance = 40; // PTT按钮容差更大
                if (touch.clientX < rect.left - tolerance || touch.clientX > rect.right + tolerance ||
                    touch.clientY < rect.top - tolerance || touch.clientY > rect.bottom + tolerance) {
                    vcPttEnd(e);
                }
            }, { passive: false });

            // 鼠标事件（桌面端）
            btn.addEventListener('mousedown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                vcPttStart(e);
            });

            btn.addEventListener('mouseup', function(e) {
                e.preventDefault();
                e.stopPropagation();
                vcPttEnd(e);
            });

            // 全局mouseup兜底
            document.addEventListener('mouseup', function() {
                if (store.callState._pttActive) vcPttEnd(null);
            });

            // [FIX-松开残留] 全局touchend兜底：防止手机触摸在按钮外松开无法结束
            document.addEventListener('touchend', function() {
                if (store.callState._pttActive) {
                    console.log('[PTT] 全局touchend兜底触发vcPttEnd');
                    vcPttEnd(null);
                }
            });
            
            // [FIX-松开残留] 全局touchcancel兜底
            document.addEventListener('touchcancel', function() {
                if (store.callState._pttActive) {
                    console.log('[PTT] 全局touchcancel兜底触发vcPttEnd');
                    vcPttEnd(null);
                }
            });
            
            // [FIX-松开残留] 页面失焦/切换时强制结束PTT
            document.addEventListener('visibilitychange', function() {
                if (document.hidden && store.callState._pttActive) {
                    console.log('[PTT] 页面切换，强制结束PTT');
                    vcPttEnd(null);
                }
            });

            // 禁止右键菜单和文字选择
            btn.addEventListener('contextmenu', function(e) { e.preventDefault(); });
            btn.style.userSelect = 'none';
            btn.style.webkitUserSelect = 'none';
            btn.style.touchAction = 'none';
        })();
        
        function _pttStartRecognition() {
            // 如果启用了STT API，检查是否有有效的模型/密钥配置
            if (store.stt?.enabled) {
                const provider = store.stt.provider || 'openai';
                let hasValidKey = false;
                switch(provider) {
                    case 'openai': hasValidKey = !!(store.stt.openai?.key); break;
                    case 'google': hasValidKey = !!(store.stt.google?.key); break;
                    case 'tencent': hasValidKey = !!(store.stt.tencent?.secretId && store.stt.tencent?.secretKey); break;
                    case 'xfyun': hasValidKey = !!(store.stt.xfyun?.appId && store.stt.xfyun?.apiKey); break;
                    case 'azure': hasValidKey = !!(store.stt.azure?.key); break;
                    case 'custom': hasValidKey = !!(store.stt.custom?.url); break;
                }
                if (hasValidKey) {
                    _pttStartSTTApi();
                    return;
                }
                // [FIX-语音回退] STT已启用但没有配置有效密钥，回退到浏览器内置语音识别
                console.log('[STT] No valid API key configured, falling back to browser SpeechRecognition');
            }
            
            // 使用浏览器内置SpeechRecognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.warn("Browser does not support SpeechRecognition");
                toast("浏览器不支持语音识别，请在设置中配置语音识别API", "error");
                return;
            }
            
            try {
                // 清理之前的识别实例
                if (store.callState.recognition) {
                    store.callState.recognition.onend = null;
                    store.callState.recognition.onerror = null;
                    store.callState.recognition.onresult = null;
                    try { store.callState.recognition.stop(); } catch(e) {}
                }
                
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'zh-CN';
                
                // [FIX] 使用累积式finalText，防止手机端识别自动重启时丢失之前的结果
                let _pttAccumulatedFinal = '';
                
                recognition.onstart = () => {
                    document.getElementById('vc-mic-wave').classList.add('active');
                };
                
                recognition.onerror = (event) => {
                    console.error("PTT Speech recognition error", event.error);
                    // no-speech和aborted在手机上是常见的非致命错误，不中断
                    if (event.error === 'no-speech' || event.error === 'aborted') {
                        return;
                    }
                    if (event.error === 'network') {
                        // [修复] 网络错误 = 语音服务连接失败
                        document.getElementById('vc-live-transcript-content').innerHTML = '<span class="interim">语音服务连接失败，建议配置语音识别API</span>';
                        toast("语音服务连接失败，建议在设置→语音识别中配置API", "error");
                        return;
                    }
                    if (event.error === 'service-not-allowed') {
                        document.getElementById('vc-live-transcript-content').innerHTML = '<span class="interim">语音服务不可用，建议配置API</span>';
                        return;
                    }
                    document.getElementById('vc-live-transcript-content').innerHTML = '<span class="interim">识别出错，请重试</span>';
                };
                
                recognition.onend = () => {
                    // [关键修复] 手机浏览器上SpeechRecognition会频繁自动结束
                    // 如果用户还在按住，自动重启保持连续性
                    if (store.callState._pttActive && store.callState.active) {
                        try {
                            recognition.start();
                            console.log('[PTT] 识别自动重启（用户仍在按住）');
                        } catch(e) {
                            console.log("PTT resume failed", e);
                            // 延迟重试
                            setTimeout(() => {
                                if (store.callState._pttActive && store.callState.active) {
                                    try { recognition.start(); } catch(e2) {
                                        console.error("PTT resume retry failed", e2);
                                    }
                                }
                            }, 200);
                        }
                    } else if (_pttAccumulatedFinal.trim()) {
                        // 松开后，发送累积的最终文字
                        const finalText = _pttAccumulatedFinal.trim();
                        updateVcSubtitle("我: " + finalText);
                        appendVoiceLog('me', finalText);
                        processVoiceInput(finalText);
                        _pttAccumulatedFinal = '';
                        // 清空实时文字显示
                        setTimeout(() => {
                            document.getElementById('vc-live-transcript').classList.remove('active');
                        }, 500);
                    } else {
                        // [改进] 区分语音服务不可用和真的没说话
                        const normalMsg = '未识别到语音';
                        document.getElementById('vc-live-transcript-content').innerHTML = '<span class="interim">' + normalMsg + '</span>';
                        // 如果通话过程中从未收到过结果，可能是服务不可用
                        toast("未识别到语音，如持续无法识别建议在设置中配置语音识别API", "error");
                        setTimeout(() => {
                            document.getElementById('vc-live-transcript').classList.remove('active');
                        }, 1500);
                    }
                };
                
                recognition.onresult = (event) => {
                    store.callState._pttGotResult = true; // 标记收到过结果
                    let interim = '';
                    // [FIX] 只从resultIndex开始遍历，累积final结果
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            _pttAccumulatedFinal += event.results[i][0].transcript;
                        } else {
                            interim += event.results[i][0].transcript;
                        }
                    }
                    // 实时更新屏幕上的文字
                    const contentEl = document.getElementById('vc-live-transcript-content');
                    let html = '';
                    if (_pttAccumulatedFinal) html += '<span class="final">' + _pttAccumulatedFinal + '</span>';
                    if (interim) html += '<span class="interim">' + interim + '</span>';
                    if (html) contentEl.innerHTML = html;
                    
                    // 同时更新字幕
                    if (_pttAccumulatedFinal || interim) {
                        updateVcSubtitle("我: " + (_pttAccumulatedFinal + interim || '...'));
                    }
                    
                    // 自动滚动
                    const transcriptEl = document.getElementById('vc-live-transcript');
                    transcriptEl.scrollTop = transcriptEl.scrollHeight;
                };
                
                store.callState.recognition = recognition;
                store.callState._pttFinalText = '';
                store.callState._pttGotResult = false; // 初始化标记
                recognition.start();

                // [新增] PTT语音服务可用性检测
                store.callState._pttServiceCheckTimer = setTimeout(() => {
                    if (store.callState._pttActive && store.callState.active && !store.callState._pttGotResult) {
                        console.warn('[PTT] 5秒内未收到识别结果，语音服务可能不可用');
                        document.getElementById('vc-live-transcript-content').innerHTML = '<span class="interim">未检测到语音输入，请检查麦克风权限</span>';
                        toast("未检测到语音输入，请检查麦克风权限。若持续无法识别，建议在设置→语音识别中配置API", "error");
                    }
                }, 5000);
            } catch(e) {
                console.error("PTT Init Failed:", e);
                toast("语音识别启动失败", "error");
            }
        }
        
        function _pttStopRecognition() {
            // 清理语音服务检测计时器
            if (store.callState._pttServiceCheckTimer) { clearTimeout(store.callState._pttServiceCheckTimer); store.callState._pttServiceCheckTimer = null; }
            // [FIX-语音回退] 优先检查是否有浏览器recognition实例（可能是STT无key时的回退）
            if (store.callState.recognition) {
                // 使用的是浏览器内置SpeechRecognition，让onend回调处理最终结果
                try { store.callState.recognition.stop(); } catch(e) {}
                return;
            }
            
            // 使用的是STT API模式
            if (store.stt?.enabled) {
                _pttStopSTTApi();
                return;
            }
        }
        
        // PTT + STT API模式
        async function _pttStartSTTApi() {
            try {
                if (store.callState._sttMediaRecorder) {
                    try { store.callState._sttMediaRecorder.stop(); } catch(e) {}
                }
                if (store.callState._sttStream) {
                    store.callState._sttStream.getTracks().forEach(t => t.stop());
                }
                
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                store.callState._sttStream = stream;
                
                const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
                                 MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
                if (!mimeType) { console.warn('No supported audio MIME type'); return; }
                
                let chunks = [];
                const mediaRecorder = new MediaRecorder(stream, { mimeType });
                store.callState._sttMediaRecorder = mediaRecorder;
                
                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunks.push(e.data);
                };
                
                mediaRecorder.onstop = async () => {
                    if (chunks.length === 0 || !store.callState.active) return;
                    const blob = new Blob(chunks, { type: mimeType });
                    chunks = [];
                    
                    if (blob.size < 1000) {
                        document.getElementById('vc-live-transcript-content').innerHTML = '<span class="interim">未识别到语音</span>';
                        setTimeout(() => {
                            document.getElementById('vc-live-transcript').classList.remove('active');
                        }, 1500);
                        return;
                    }
                    
                    document.getElementById('vc-live-transcript-content').innerHTML = '<span class="interim">识别中...</span>';
                    
                    try {
                        const text = await callSTTApi(blob);
                        if (text && text.trim()) {
                            document.getElementById('vc-live-transcript-content').innerHTML = '<span class="final">' + text + '</span>';
                            updateVcSubtitle("我: " + text);
                            appendVoiceLog('me', text);
                            processVoiceInput(text);
                            setTimeout(() => {
                                document.getElementById('vc-live-transcript').classList.remove('active');
                            }, 500);
                        } else {
                            document.getElementById('vc-live-transcript-content').innerHTML = '<span class="interim">未识别到语音</span>';
                            setTimeout(() => {
                                document.getElementById('vc-live-transcript').classList.remove('active');
                            }, 1500);
                        }
                    } catch(e) {
                        console.error('PTT STT API call failed:', e);
                        document.getElementById('vc-live-transcript-content').innerHTML = '<span class="interim">识别失败</span>';
                        setTimeout(() => {
                            document.getElementById('vc-live-transcript').classList.remove('active');
                        }, 1500);
                    }
                };
                
                mediaRecorder.start();
                document.getElementById('vc-mic-wave').classList.add('active');
                document.getElementById('vc-live-transcript-content').innerHTML = '<span class="interim">正在录音...</span>';
                
            } catch(e) {
                console.error('PTT STT API init failed:', e);
                toast('麦克风访问失败', 'error');
            }
        }
        
        function _pttStopSTTApi() {
            if (store.callState._sttMediaRecorder && store.callState._sttMediaRecorder.state === 'recording') {
                store.callState._sttMediaRecorder.stop();
            }
            if (store.callState._sttStream) {
                store.callState._sttStream.getTracks().forEach(t => t.stop());
                store.callState._sttStream = null;
            }
        }

        function sendVoiceCallText() {
            const input = document.getElementById('vc-input');
            const text = input ? input.value.trim() : '';
            if(!text) return;
            // [FIX] 设置输入阻断标记，防止blur后触发其他操作
            window._lastInputTouchTime = Date.now();
            // [FIX] 先清空和隐藏输入框，防止重复提交
            if (input) input.value = '';
            const textBox = document.getElementById('vc-text-input-box');
            if (textBox) textBox.style.display = 'none';
            // [FIX] 先将焦点移到语音通话layer内的非输入元素，防止焦点跳到chat-input
            const vcLayer = document.getElementById('layer-voice-call');
            if (vcLayer) vcLayer.focus();
            // 然后blur，确保键盘收起
            if (input) input.blur();
            // [FIX] 确保焦点不在任何输入框上（防止手机浏览器自动聚焦到chat-input）
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
                document.activeElement.blur();
            }
            // 确保语音通话layer保持显示
            if (vcLayer && !vcLayer.classList.contains('show')) {
                vcLayer.classList.add('show');
            }
            updateVcSubtitle("我: " + text);
            processVoiceInput(text);
        }

        async function processVoiceInput(text) {
            if(!text) return;
            
            // [FIX-麦克风按钮] 如果麦克风关闭（静音状态），缓存用户的话而不是立即触发AI回复
            if (store.callState.micMuted) {
                _vcPendingTexts.push(text);
                updateVcSubtitle("我: " + text + " (已缓存，开启麦克风后发送)");
                document.getElementById('vc-status').innerText = `已缓存 ${_vcPendingTexts.length} 条消息，开启麦克风后对方将回复`;
                return;
            }
            
            // Processing Visuals
            document.getElementById('vc-status').innerText = "对方思考中...";
            store.callState.isSpeaking = true; // Stop listening while contact speaks
            if(store.callState.recognition) store.callState.recognition.stop();

            // Generate Response
            await aiGenerateVoiceCall(text);
        }

        async function aiGenerateVoiceCall(text) {
            // [FIX-联系人串号] 使用通话开始时记录的contactId，防止缩小通话后切换聊天导致AI回复串到其他联系人
            const _vcContactId = store.callState.contactId || activeChatId;
            const contact = store.contacts.find(c => c.id === _vcContactId);
            if (!contact) return;
            
            // [FIX-问题1] 获取世界书内容
            let worldBookContent = 'None';
            try {
                if (contact.settings?.mountedWbIds && Array.isArray(contact.settings.mountedWbIds)) {
                    const mountedBooks = (store.worldbooks || []).filter(wb => contact.settings.mountedWbIds.includes(wb.id));
                    if (mountedBooks.length > 0) {
                        worldBookContent = mountedBooks.map(wb => `[${wb.name}]:\n${wb.content}`).join('\n\n');
                    }
                }
            } catch(_wbErr) { console.warn('[worldbook] 语音通话获取世界书失败:', _wbErr); }
            
            // [FIX-问题1] 加入全局记忆系统，确保语音通话记忆互通
            const globalMemory = buildContactGlobalMemory(_vcContactId);
            
            // [FIX-问题1] 获取用户人设名
            const userName = getUserPersonaName(contact, store.user.name || '用户');

            // [FIX-去重] 记录用户这轮输入到对话历史
            _vcConversationHistory.push({ role: 'user', text: text });
            // 限制历史长度，只保留最近40条，避免token过多
            if (_vcConversationHistory.length > 40) {
                _vcConversationHistory = _vcConversationHistory.slice(-40);
            }
            
            // [FIX-去重] 构建对话历史摘要，让AI知道之前说过什么
            let conversationContext = '';
            if (_vcConversationHistory.length > 1) {
                const recentHistory = _vcConversationHistory.slice(-20); // 最近20条
                conversationContext = '\n\n【本次通话对话历史（你必须参考，严禁重复已说过的内容）】：\n';
                recentHistory.forEach(h => {
                    if (h.role === 'user') {
                        conversationContext += `${userName}：${h.text}\n`;
                    } else {
                        conversationContext += `${contact.name}：${h.text}\n`;
                    }
                });
            }
            
            const _vcHideActions = store.vcSettings && store.vcSettings.hideActions;
            
            const sysPrompt = `You are ${contact.name}. Persona: ${contact.persona}.
            World Book Context: ${worldBookContent}
            ${globalMemory ? `\n${globalMemory}` : ''}
            ${conversationContext}
            
            User (${userName}) said: "${text}".
            
            【重要场景设定】你们正在进行语音通话（Voice Call）。
            - 你们双方并未见面，只是通过电话/语音通话交流
            - 你看不到对方，对方也看不到你
            - 你们只能通过声音交流
            ${_vcHideActions ? `
            【格式要求 - 纯语言模式】：
            ⚠️ 不要使用任何动作描写、括号动作、星号动作
            ⚠️ 只输出纯粹的对话语言内容
            ⚠️ 不要使用[ACTION]标签
            ⚠️ 直接说话，不要描写任何动作、表情、语气
            
            CRITICAL FORMAT REQUIREMENT:
            Do NOT include any action descriptions. Only output pure dialogue.
            Format: [DIALOGUE]语言内容[/DIALOGUE]
            
            Example:
            [DIALOGUE]你真是的，总是这样[/DIALOGUE][DIALOGUE]不过我还是很喜欢你这样[/DIALOGUE]
            
            Rules:
            1. ONLY use [DIALOGUE] tags, NO [ACTION] tags at all
            2. Keep each segment short (5-15 characters)
            3. Use natural, conversational Chinese
            4. Remember: This is a VOICE CALL - you cannot see each other
            5. NEVER repeat what you or the user already said in this conversation` : `
            【严格禁止的动作描写】：
            ❌ 禁止描写任何需要面对面才能做的动作：看着对方、对视、递东西、触碰、拥抱、牵手、靠近等
            ❌ 禁止描写对方的表情、动作、外貌（因为你看不到）
            ❌ 禁止描写"看到你"、"望向你"、"注视"等视觉相关动作
            
            【允许的动作描写】：
            ✅ 声音相关：语气变化、笑声、叹气、停顿、声音颤抖
            ✅ 自己的动作：摸自己的头发、靠在椅子上、看窗外、喝水
            ✅ 环境互动：听到背景声、调整手机音量、走动
            ✅ 情绪表达：通过语气、停顿、呼吸来传达情绪`}

            【去重要求 - 极其重要】：
            ⚠️ 严禁重复自己之前说过的话或表达过的意思
            ⚠️ 严禁鹦鹉学舌式地复述用户刚说的内容（如用户说"我今天很开心"，你不能说"你今天很开心啊"）
            ⚠️ 如果用户重复提到同一件事，用不同的角度或新的信息回应，不要重复之前的回答
            ⚠️ 每次回复都要推进对话，带来新的信息、观点或情感，而不是原地踏步
            ${!_vcHideActions ? `
            CRITICAL FORMAT REQUIREMENT:
            You MUST alternate between action descriptions and dialogue.
            Format: [ACTION]动作描写[/ACTION][DIALOGUE]语言内容[/DIALOGUE]
            
            Example (语音通话场景):
            [ACTION]声音里带着笑意[/ACTION][DIALOGUE]你真是的，总是这样[/DIALOGUE][ACTION]轻轻叹了口气[/ACTION][DIALOGUE]不过我还是很喜欢你这样[/DIALOGUE]
            
            Rules:
            1. Start with an action tag
            2. Follow with dialogue tag
            3. Alternate between them
            4. Keep each segment short (5-15 characters)
            5. Use natural, conversational Chinese
            6. Actions should describe tone, emotion, or your own movements (NOT the user's appearance/actions)
            7. Remember: This is a VOICE CALL - you cannot see each other
            8. NEVER repeat what you or the user already said in this conversation` : ''}
            
            Do NOT use JSON. Do NOT use markdown. Just use the tag format above.`;

            try {
                const data = await API.chatCompletion([
                    {role: 'system', content: sysPrompt},
                    {role: 'user', content: text}
                ]);
                let content = data.choices[0].message.content.trim();
                
                // 解析交替格式
                const actionRegex = /\[ACTION\](.*?)\[\/ACTION\]/g;
                const dialogueRegex = /\[DIALOGUE\](.*?)\[\/DIALOGUE\]/g;
                
                const actions = [];
                const dialogues = [];
                
                let match;
                while ((match = actionRegex.exec(content)) !== null) {
                    actions.push(match[1]);
                }
                while ((match = dialogueRegex.exec(content)) !== null) {
                    dialogues.push(match[1]);
                }
                
                // [FIX-去重] 提取AI的纯对话文本，记录到历史中
                const aiDialogueText = dialogues.length > 0 ? dialogues.join(' ') : content.replace(/\[ACTION\].*?\[\/ACTION\]/g, '').trim();
                if (aiDialogueText) {
                    _vcConversationHistory.push({ role: 'ai', text: aiDialogueText });
                }
                
                // 如果解析失败，使用原始内容
                if (actions.length === 0 && dialogues.length === 0) {
                    const resObj = { action: "", text: content, tts_text: content };
                    document.getElementById('vc-status').innerText = "通话中";
                    appendVoiceLog('ai', resObj);
                    // [FIX-同步] 先请求音频，音频开始播放时再显示字幕
                    await playVoiceCallAudio(resObj.tts_text, resObj.text);
                    return;
                }
                
                // 交替播放动作和对话
                document.getElementById('vc-status').innerText = "通话中";
                
                for (let i = 0; i < Math.max(actions.length, dialogues.length); i++) {
                    const action = actions[i] || "";
                    const dialogue = dialogues[i] || "";
                    
                    // [FIX-动作开关] 仅在动作描写开启时显示动作
                    if (action && !_vcHideActions) {
                        updateVcSubtitle(`*${action}*`);
                        appendVoiceLog('ai', { action: action, text: "" });
                        // [FIX-速度] 动作描写停顿时间根据字数动态计算，最少2500ms，每字+150ms
                        const actionDelay = Math.max(2500, 1500 + action.length * 150);
                        await new Promise(resolve => setTimeout(resolve, actionDelay));
                    }
                    
                    if (dialogue) {
                        appendVoiceLog('ai', { action: "", text: dialogue });
                        // [FIX-同步] 先请求音频，音频开始播放时再显示字幕
                        await playVoiceCallAudio(dialogue, dialogue);
                    }
                }

            } catch(e) {
                console.error("Voice Call Error:", e);
                document.getElementById('vc-status').innerText = "连接不稳定";
                store.callState.isSpeaking = false;
                // PTT模式：不自动重启，等用户按住说话
            }
        }

        async function playVoiceCallAudio(text, subtitleText) {
            const contact = store.contacts.find(c => c.id === activeChatId);
            
            // [FIX-同步] 如果传入了subtitleText，在音频开始播放时才显示字幕
            // 如果没传，则不处理字幕（向后兼容）
            
            // Check if MiniMax TTS is enabled for this contact
            if (!contact.settings?.enableTTS) {
                // [FIX-同步+速度] TTS禁用时，模拟语音延迟，先显示字幕再等待
                if (subtitleText) updateVcSubtitle(subtitleText);
                // [FIX-速度] 增加每字阅读时间到300ms，最低2000ms
                const readTime = Math.max(2000, text.length * 300);
                document.getElementById('vc-avatar-pulse').classList.add('speaking');
                
                // [FIX] 改为返回Promise，确保await能正确等待延迟结束
                return new Promise(resolve => {
                    setTimeout(() => {
                        document.getElementById('vc-avatar-pulse').classList.remove('speaking');
                        store.callState.isSpeaking = false;
                        // PTT模式：不自动重启，等用户按住说话
                        resolve();
                    }, readTime);
                });
            }

            document.getElementById('vc-avatar-pulse').classList.add('speaking');
            
            try {
                const result = await API.textToSpeech(text, contact.settings?.voiceId, contact.settings?.voiceLang);
                // 浏览器内置语音回退：已经播放完毕
                if (result === '__BROWSER_TTS_DONE__') {
                    // [FIX-同步] 浏览器TTS回退时也显示字幕
                    if (subtitleText) updateVcSubtitle(subtitleText);
                    document.getElementById('vc-avatar-pulse').classList.remove('speaking');
                    store.callState.isSpeaking = false;
                    // PTT模式：不自动重启
                    return;
                }
                const url = URL.createObjectURL(result);
                const audio = document.getElementById('tts-audio');
                audio.src = url;
                
                // [FIX-同步] 音频准备播放时才显示字幕，确保语音和文字同步
                return new Promise((resolve) => {
                    audio.onplay = () => {
                        // 音频开始播放时才显示字幕文字
                        if (subtitleText) updateVcSubtitle(subtitleText);
                    };
                    
                    audio.onended = () => {
                        document.getElementById('vc-avatar-pulse').classList.remove('speaking');
                        store.callState.isSpeaking = false;
                        // PTT模式：不自动重启，等用户按住说话
                        // [FIX-速度] 音频播放结束后额外等待500ms，让字幕多停留一会
                        setTimeout(resolve, 500);
                    };
                    
                    audio.onerror = () => {
                        if (subtitleText) updateVcSubtitle(subtitleText);
                        document.getElementById('vc-avatar-pulse').classList.remove('speaking');
                        store.callState.isSpeaking = false;
                        resolve();
                    };
                    
                    audio.play().catch(e => {
                        console.error("TTS Play Error:", e);
                        if (subtitleText) updateVcSubtitle(subtitleText);
                        document.getElementById('vc-avatar-pulse').classList.remove('speaking');
                        store.callState.isSpeaking = false;
                        resolve();
                    });
                });
            } catch(e) {
                console.error("TTS Play Error:", e);
                // [FIX-同步] 即使出错也显示字幕
                if (subtitleText) updateVcSubtitle(subtitleText);
                // Only show error if enabled and failed
                if (contact.settings?.enableTTS) {
                    showToast("语音合成失败", "error");
                }
                document.getElementById('vc-avatar-pulse').classList.remove('speaking');
                store.callState.isSpeaking = false;
                // PTT模式：不自动重启
            }
        }

        function playVoiceSystemSound(type) {
            // Simulated system sounds
            // In real app, play specific audio files
        }

        // --- UTILS ---
        const DEFAULT_BUBBLE_CSS = `/* --- 二次元黑白便签风 气泡CSS美化全集 --- */

/* 💡 提示：本模板支持CSS变量自定义，可在:root中修改以下变量：
   --avatar-radius: 头像圆角 (默认8px，50%为圆形)
   --bubble-border: 气泡边框 (如: 2px solid #ff69b4)
   --bubble-border-me: 自己气泡边框 (覆盖--bubble-border)
   --bubble-border-other: 对方气泡边框 (覆盖--bubble-border)
   --bubble-radius: 气泡圆角 (默认2px)
   --bubble-left: 对方气泡背景色
   --bubble-right: 自己气泡背景色
*/

/* 1. 基础布局调整 */
.msg-row {
  margin-bottom: var(--bubble-gap, 14px);
  align-items: flex-start;
}

/* 2. 头像样式（大小由--avatar-size变量控制，圆角由--avatar-radius变量控制） */
.avatar {
  width: var(--avatar-size, 48px);
  height: var(--avatar-size, 48px);
  border-radius: var(--avatar-radius, 8px);
  border: 2.5px solid #1a1a1a;
  box-shadow: 2px 2px 0px #1a1a1a;
  filter: grayscale(15%);
  transition: transform 0.15s;
}
.avatar:active {
  transform: scale(0.95);
}

/* 3. 气泡通用样式：便签风（支持CSS变量自定义） */
.bubble {
  border: var(--bubble-border, 2px solid #1a1a1a);
  border-radius: var(--bubble-radius, 2px);
  box-shadow: 3px 3px 0px #1a1a1a;
  position: relative;
  transition: transform 0.1s, box-shadow 0.1s;
  max-width: var(--bubble-size, calc(100vw - 120px));
  line-height: var(--bubble-spacing, 1.5);
  padding: var(--bubble-padding, 10px 14px);
  overflow: visible !important; /* 防止贴图被裁剪 */
}
.bubble:active {
  transform: translate(1px, 1px);
  box-shadow: 1px 1px 0px #1a1a1a;
}

/* 4. 对方气泡 - 白底便签（支持自定义边框） */
.msg-row:not(.me) .bubble {
  background: var(--bubble-left, #fff);
  color: #1a1a1a;
  margin-left: 5px;
  border: var(--bubble-border-other, var(--bubble-border, 2px solid #1a1a1a));
}
.msg-row:not(.me) .bubble::before {
  border-right-color: var(--bubble-left, #fff) !important;
}

/* 5. 自己气泡 - 浅灰便签（支持自定义边框） */
.msg-row.me .bubble {
  background: var(--bubble-right, #f0f0f0);
  color: #1a1a1a;
  margin-right: 5px;
  border: var(--bubble-border-me, var(--bubble-border, 2px solid #1a1a1a));
}
.msg-row.me .bubble::after {
  border-left-color: var(--bubble-right, #f0f0f0) !important;
}

/* 💡 自定义示例：
:root {
  --avatar-radius: 50%;  /* 圆形头像 */
  --bubble-border: 2px solid #ff69b4;  /* 粉色边框 */
  --bubble-radius: 16px;  /* 圆角气泡 */
}
*/

/* 6. 图片消息样式 */
.bubble img:not(.emoji-img) {
  border: 1.5px solid #1a1a1a !important;
  border-radius: 0 !important;
  filter: grayscale(5%);
}
.msg-row:not(.me) .bubble:has(img:not(.emoji-img)):not(.voice),
.msg-row.me .bubble:has(img:not(.emoji-img)):not(.voice) {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}
/* [FIX-表情包距离] 图片/表情包气泡与头像保持安全距离，防止被头像框遮挡 */
.msg-row:not(.me) .bubble:has(img):not(.voice) {
  margin-left: 6px;
}
.msg-row.me .bubble:has(img):not(.voice) {
  margin-right: 6px;
}
.bubble:has(img:not(.emoji-img))::before,
.bubble:has(img:not(.emoji-img))::after {
  display: none !important;
}

/* 7. 语音消息样式 */
.bubble.voice {
  display: flex;
  align-items: center;
  min-width: 90px;
  cursor: pointer;
}
.bubble.voice i { font-size: 14px; }
.msg-row:not(.me) .bubble.voice i { color: #1a1a1a; margin-right: 8px; }
.msg-row.me .bubble.voice { flex-direction: row-reverse; }
.msg-row.me .bubble.voice i { color: #555; margin-left: 8px; margin-right: 0; }
.bubble.voice .voice-wave-anim span { background: #1a1a1a !important; }
.msg-row.me .bubble.voice .voice-wave-anim span { background: #555 !important; }
.bubble.voice .voice-sec { font-family: 'Courier New', monospace; color: #888; }

/* 8. 转账/红包消息样式 */
.bubble-transfer {
  border: 2px solid #1a1a1a !important;
  border-radius: 2px !important;
  box-shadow: 3px 3px 0px #1a1a1a !important;
  background: #fff !important;
  width: 240px !important;
  overflow: hidden;
}
.bubble-transfer .transfer-top {
  padding: 15px;
  background: #f5f3ef;
  border-bottom: 1.5px dashed #ccc;
}
.bubble-transfer .transfer-amt {
  color: #1a1a1a !important;
  font-family: 'Courier New', monospace;
  font-weight: 900;
}
.bubble-transfer .transfer-bottom {
  background: #fafafa;
  color: #888;
  border-top: none;
  font-family: 'Courier New', monospace;
  font-size: 11px;
}
.bubble-transfer.done { opacity: 0.7; }

/* 8.5 红包消息样式 */
.bubble-redpacket {
  border: 2px solid #1a1a1a !important;
  border-radius: 2px !important;
  box-shadow: 3px 3px 0px #1a1a1a !important;
  overflow: hidden;
  width: 260px !important;
  cursor: pointer;
  background: #fff !important;
}
.bubble-redpacket .rp-top {
  background: linear-gradient(135deg, #c0392b, #a93226);
  padding: 20px 18px;
  display: flex;
  align-items: center;
  min-height: 60px;
  position: relative;
}
.bubble-redpacket .rp-top::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 10%;
  width: 80%;
  height: 1px;
  background: rgba(255,255,255,0.15);
}
.bubble-redpacket .rp-info {
  flex: 1;
  min-width: 0;
}
.bubble-redpacket .rp-greeting {
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  word-break: break-all;
}
.bubble-redpacket .rp-status {
  color: rgba(255,255,255,0.6);
  font-size: 12px;
  margin-top: 6px;
}
.bubble-redpacket .rp-bottom {
  background: #a93226;
  color: rgba(255,255,255,0.5);
  font-size: 11px;
  padding: 6px 18px;
  text-align: left;
  border-top: 1px solid rgba(255,255,255,0.08);
}
.bubble-redpacket.rp-done {
  opacity: 0.7;
}
.bubble-redpacket.rp-done .rp-top {
  background: linear-gradient(135deg, #999, #777);
}
.bubble-redpacket.rp-done .rp-bottom {
  background: #777;
}

/* 红包发送弹窗类型选择按钮 */
.rp-type-btn {
  flex: 1;
  padding: 8px 4px;
  border: 1.5px solid #ccc;
  border-radius: 8px;
  text-align: center;
  font-size: 13px;
  cursor: pointer;
  background: #fff;
  color: #333;
  transition: all 0.2s;
}
.rp-type-btn:hover {
  border-color: #666;
  color: #111;
}
.rp-type-btn.active {
  border-color: #333;
  background: #f5f5f5;
  color: #111;
  font-weight: bold;
}

/* 9. 地理位置消息 */
.bubble-location {
  border: 2px solid #1a1a1a;
  border-radius: 2px;
  box-shadow: 3px 3px 0px #1a1a1a;
}
.bubble-location .loc-info { background: #fff; }
.bubble-location .loc-name { font-weight: 900; font-family: 'Courier New', monospace; }

/* 10. 撤回消息样式 */
.bubble.recalled {
  background: transparent !important;
  border: 1.5px dashed #999 !important;
  box-shadow: none !important;
  color: #888 !important;
  font-size: 12px !important;
  font-family: 'Courier New', monospace;
  padding: 5px 0 !important;
  text-align: center;
  width: 100%;
  max-width: 100% !important;
}
.msg-row:has(.recalled) { justify-content: center; }
.msg-row:has(.recalled) .avatar-wrapper-chat { display: none !important; }
.msg-row:has(.recalled) .avatar { display: none; }

/* 11. 引用消息预览框 */
.quote-preview {
  background: #f5f3ef;
  border: 1.5px solid #1a1a1a;
  border-left: 3px solid #1a1a1a;
  border-radius: 0;
  color: #555;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  margin: 0 10px 10px 10px;
}

/* 12. 气泡内引用样式 - 上下结构 */
.bubble-quote {
  margin-bottom: 6px;
  padding: 6px 10px;
  background: #f5f3ef;
  border-left: none;
  font-size: 12px;
  color: #555;
  opacity: 0.85;
  border-radius: 4px;
  white-space: pre-wrap;
  display: block;
  width: 100%;
  box-sizing: border-box;
}

/* 13. 共享帖子气泡 */
.bubble-shared-post {
  border: 2px solid #1a1a1a !important;
  border-radius: 2px !important;
  box-shadow: 3px 3px 0px #1a1a1a !important;
  background: #fff !important;
}
`;

        const DEFAULT_GLOBAL_CSS = `/* --- 二次元黑白便签风 全局UI主题模板 --- */

/* 1. 核心变量覆盖 */
:root {
  --primary: #1a1a1a !important;
  --bg-grey: #f5f3ef !important;
  --text-main: #1a1a1a !important;
  --text-sub: #888 !important;
  --radius-box: 2px !important;
  --radius-btn: 0px !important;
}

/* 2. 背景 */
body {
  background-color: #f5f3ef;
}
#device {
  background-color: #f5f3ef;
}

/* 导航栏：黑白粗边框 */
.nav-bar {
  background: #fff !important;
  border-bottom: 2.5px solid #1a1a1a !important;
  box-shadow: 0 3px 0px #1a1a1a !important;
}
.nav-title {
  font-family: 'Courier New', monospace !important;
  font-weight: 900 !important;
  letter-spacing: 1.5px !important;
  color: #1a1a1a !important;
}
.nav-icon {
  color: #1a1a1a !important;
}

/* 3. 列表项：便签卡片风 */
.list-item, .form-cell {
  background: #fff;
  transition: all 0.1s;
}
.list-item:active, .form-cell:active {
  background: #f5f5f5 !important;
  transform: translate(1px, 1px);
}
/* 分组：便签卡片 */
.group-box {
  background: #fff !important;
  border: 2px solid #1a1a1a !important;
  border-radius: 2px !important;
  box-shadow: 3px 3px 0px #1a1a1a !important;
  margin: 14px 12px !important;
  overflow: hidden;
}
.list-item:last-child, .form-cell:last-child {
  border-bottom: none !important;
}

/* 4. 输入栏：黑白风 */
.input-bar {
  background: #fff !important;
  border-top: 2.5px solid #1a1a1a !important;
  box-shadow: 0 -3px 0px #1a1a1a !important;
}
.input-field {
  background: #f9f9f9 !important;
  border: 1.5px solid #1a1a1a !important;
  border-radius: 0 !important;
  color: #1a1a1a !important;
}
.input-field:focus {
  background: #fff !important;
  box-shadow: 2px 2px 0px #1a1a1a !important;
}
.btn-send {
  color: #1a1a1a !important;
  font-weight: 700;
}

/* 5. 底部标签栏：黑白风 */
.wx-tab-bar {
  background: #fff !important;
  border-top: 2.5px solid #1a1a1a !important;
  box-shadow: 0 -3px 0px #1a1a1a !important;
}
.nav-tab {
  color: #999 !important;
  font-family: 'Courier New', monospace !important;
  font-weight: 700 !important;
}
.nav-tab.active {
  color: #1a1a1a !important;
}

/* 6. 弹窗与模态框：便签风 */
.modal-box {
  background: #fff !important;
  border: 2.5px solid #1a1a1a !important;
  border-radius: 2px !important;
  box-shadow: 6px 6px 0px #1a1a1a !important;
}

/* 7. 按钮：黑白风 */
.full-btn {
  border: 2px solid #1a1a1a !important;
  border-radius: 0 !important;
  font-family: 'Courier New', monospace !important;
  font-weight: 700 !important;
  background: #1a1a1a !important;
  color: #fff !important;
  box-shadow: 2px 2px 0px #555;
  transition: all 0.1s;
}
.full-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 0 0 0 #555;
}

/* 8. 聊天输入栏工具图标 */
.toolbar {
  background: #fafafa;
  border-top: 1px dashed #ccc;
}
.toolbar i {
  color: #1a1a1a !important;
  font-size: 22px;
  padding: 8px 10px;
  transition: all 0.15s;
}
.toolbar i:active {
  transform: scale(0.85);
  color: #555 !important;
}
.btn-act {
  color: #1a1a1a !important;
  transition: transform 0.15s;
}
.btn-act:active {
  transform: scale(0.85);
}
.btn-gen {
  color: #1a1a1a !important;
}
.btn-thought {
  color: #555 !important;
}

/* 9. 开关：方形黑白风 */
.switch .slider {
  border: 1.5px solid #1a1a1a !important;
  border-radius: 0 !important;
  background: #eee !important;
}
.switch .slider::before {
  border-radius: 0 !important;
  border: 1px solid #1a1a1a !important;
}
.switch input:checked + .slider {
  background: #1a1a1a !important;
}
`;

        const DEFAULT_OFFLINE_CSS = `/* --- 线下模式CSS美化模板 --- */

/* 1. 线下模式顶部栏 */
.offline-fixed-header {
  background: linear-gradient(135deg, #ffeef1, #fff0f5);
}
.offline-nav-area {
  color: #ff758c;
}

/* 2. 线下模式头像信息栏 */
.offline-info-bar {
  padding: 12px 20px;
}
.offline-avatar-group img {
  border: 2px solid rgba(255, 117, 140, 0.3);
  border-radius: 50%;
}
.offline-heart-rate {
  color: #ff758c;
}

/* 3. 线下模式消息卡片 */
.offline-msg-box {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.offline-msg-header {
  border-radius: 16px 16px 0 0;
  background: linear-gradient(135deg, #fff5f7, #ffeef1);
}
.offline-msg-header.user {
  background: linear-gradient(135deg, #f0f7ff, #e8f4fd);
}
.offline-msg-body {
  color: #333;
  font-size: 15px;
  line-height: 1.8;
}

/* 4. 线下模式输入栏 */
.offline-input-bar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 117, 140, 0.15);
}

/* 5. 线下模式背景 (私聊界面) */
#chat-history.offline-chat-active {
  background: linear-gradient(180deg, #fff5f7 0%, #ffeef1 100%) !important;
}

/* 6. 线下模式文本块气泡 */
.bubble.offline-text-block {
  max-width: 100% !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  line-height: 1.8;
}
`;

        function restoreDefaultCSS(type) {
            const cssMap = { bubble: DEFAULT_BUBBLE_CSS, global: DEFAULT_GLOBAL_CSS, offline: DEFAULT_OFFLINE_CSS };
            const css = cssMap[type] || DEFAULT_GLOBAL_CSS;
            // 1. 将textarea恢复为默认模板
            const textareaEl = document.getElementById(`css-${type}`);
            if (textareaEl) textareaEl.value = css;
            
            // 2. [FIX-还原彻底] 彻底移除自定义style标签（而非仅清空innerHTML）
            // 借鉴：每次还原后整体重建，不留空壳标签在DOM中干扰层叠顺序
            const styleEl = document.getElementById(`custom-style-${type}`);
            if (styleEl) {
                styleEl.remove();
            }
            
            // 3. [FIX-还原不生效] 从store中删除该类型的自定义CSS
            if (store.customCSS) {
                delete store.customCSS[type];
            }
            
            // 4. [FIX-气泡CSS优先] 还原CSS时移除对应标记class，让全局主题恢复控制
            document.body.classList.remove('has-custom-bubble-css', 'has-custom-global-css', 'has-custom-offline-css');
            // 重新添加仍有效的标记class
            if (store.customCSS) {
                if (store.customCSS.bubble) document.body.classList.add('has-custom-bubble-css');
                if (store.customCSS.global) document.body.classList.add('has-custom-global-css');
                if (store.customCSS.offline) document.body.classList.add('has-custom-offline-css');
            }
            
            // 5. [FIX-CSS残留] 彻底移除联系人独立CSS对应类型的style标签
            const contactStyleEl = document.getElementById(`contact-style-${type}`);
            if (contactStyleEl) contactStyleEl.remove();
            
            // 6. [FIX-CSS残留] 气泡类型还原时，额外清除bubble-slider-override和avatar-preview-override
            // 这些动态style标签含有!important规则，不清除会导致样式残留
            if (type === 'bubble') {
                const bubbleOverride = document.getElementById('bubble-slider-override');
                if (bubbleOverride) bubbleOverride.innerHTML = '';
                const avatarPreview = document.getElementById('avatar-preview-override');
                if (avatarPreview) avatarPreview.remove();
                
                // [FIX-CSS残留] 重置CSS变量为默认值，清除之前setProperty设置的值
                const root = document.documentElement.style;
                root.removeProperty('--bubble-size');
                root.removeProperty('--bubble-padding');
                root.removeProperty('--bubble-spacing');
                root.removeProperty('--bubble-gap');
                root.removeProperty('--bubble-font-size');
                root.removeProperty('--avatar-size');
                root.removeProperty('--avatar-radius');
                root.removeProperty('--bubble-border');
                root.removeProperty('--bubble-border-me');
                root.removeProperty('--bubble-border-other');
                root.removeProperty('--bubble-radius');
                root.removeProperty('--bubble-left');
                root.removeProperty('--bubble-right');
                
                // [FIX-CSS残留] 清除bubbleStyles store数据，防止下次加载重新注入
                if (store.bubbleStyles) {
                    delete store.bubbleStyles;
                }
            }
            
            // [FIX-还原持久化] 使用 saveNow 确保立即写入IDB，防止刷新导致数据丢失
            if (typeof window.saveNow === 'function') {
                window.saveNow();
            } else {
                save();
            }
            
            // [FIX-还原背景残留] 同步更新localStorage热备份，防止IDB未写完退出时下次启动恢复已删除的CSS
            try {
                if (store.customCSS && (store.customCSS.bubble || store.customCSS.global || store.customCSS.offline)) {
                    localStorage.setItem('YAN_customCSS_backup', JSON.stringify(store.customCSS));
                } else {
                    localStorage.removeItem('YAN_customCSS_backup');
                }
            } catch(_e){}
            
            // 7. [FIX-还原彻底] 检查是否所有类型的自定义CSS都已清除
            // 如果全部清除，恢复当前主题的CSS link标签
            const hasAnyCustom = store.customCSS && (store.customCSS.bubble || store.customCSS.global || store.customCSS.offline);
            if (!hasAnyCustom) {
                const currentTheme = (typeof store !== 'undefined' && store.globalTheme) ? store.globalTheme : 'default';
                // [FIX-主题恢复] 恢复所有主题CSS link标签（它们通过body.theme-xxx选择器自动控制生效范围）
                _enableDefaultTheme();
                // 如果不是default主题，禁用default-theme.css（由主题自己的CSS接管）
                if (currentTheme !== 'default') {
                    var defLink = document.getElementById('default-theme-link');
                    if (defLink) { defLink.disabled = true; defLink.setAttribute('media', 'not all'); }
                }
                // [FIX-还原彻底] 彻底移除所有自定义style标签（不仅清空，而是从DOM中删除）
                ['bubble', 'global', 'offline'].forEach(t => {
                    const el = document.getElementById(`custom-style-${t}`);
                    if (el) el.remove();
                    const cel = document.getElementById(`contact-style-${t}`);
                    if (cel) cel.remove();
                });
            } else {
                // [FIX-还原彻底] 仍有其他类型的自定义CSS存在时，重新注入它们确保生效
                // 借鉴整体重建思路：还原单项后，把剩余的CSS重新注入到<head>末尾
                ['bubble', 'global', 'offline'].forEach(t => {
                    if (store.customCSS && store.customCSS[t]) {
                        let el = document.getElementById(`custom-style-${t}`);
                        if (!el) {
                            el = document.createElement('style');
                            el.id = `custom-style-${t}`;
                        }
                        el.innerHTML = store.customCSS[t];
                        document.head.appendChild(el);
                    }
                });
                // 仍有自定义CSS时保持禁用default-theme
                _disableDefaultTheme();
            }
            
            // [FIX-还原不了] 还原后强制触发样式重排和保护机制
            if (typeof _moveCustomStylesToEnd === 'function') _moveCustomStylesToEnd();
            if (typeof _ensureBottomNavProtection === 'function') _ensureBottomNavProtection();
            if (typeof _ensureModalProtection === 'function') _ensureModalProtection();
            
            toast("已还原默认样式");
        }

        // [FIX-还原不了] 还原到美化包导入前的状态（使用导入前快照）
        function restoreCSSBeforeImport() {
            if (!store._cssBackupBeforeImport || !store._cssBackupBeforeImport._timestamp) {
                toast('没有找到导入前的备份数据', 'error');
                return;
            }
            const backup = store._cssBackupBeforeImport;
            const backupTime = new Date(backup._timestamp);
            const timeStr = backupTime.getFullYear() + '/' + (backupTime.getMonth()+1) + '/' + backupTime.getDate() + ' ' + backupTime.getHours() + ':' + String(backupTime.getMinutes()).padStart(2,'0');
            
            if (!confirm('确定还原到导入美化包之前的状态吗？\n\n备份时间: ' + timeStr + '\n\n此操作会覆盖当前的自定义CSS。')) return;
            
            // 先清除当前所有自定义CSS
            ['bubble', 'global', 'offline'].forEach(type => {
                const styleEl = document.getElementById('custom-style-' + type);
                if (styleEl) styleEl.innerHTML = '';
            });
            
            // 从备份恢复
            store.customCSS = {};
            ['bubble', 'global', 'offline'].forEach(type => {
                if (backup[type]) {
                    store.customCSS[type] = backup[type];
                    // 同步textarea
                    const cssEl = document.getElementById('css-' + type);
                    if (cssEl) cssEl.value = backup[type];
                    // 注入style标签
                    let styleEl = document.getElementById('custom-style-' + type);
                    if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = 'custom-style-' + type;
                    }
                    styleEl.innerHTML = backup[type];
                    document.head.appendChild(styleEl);
                    // 恢复body标记class
                    if (type === 'bubble') document.body.classList.toggle('has-custom-bubble-css', true);
                    if (type === 'global') document.body.classList.toggle('has-custom-global-css', true);
                    if (type === 'offline') document.body.classList.toggle('has-custom-offline-css', true);
                } else {
                    // 备份中没有该类型，清除textarea
                    const cssEl = document.getElementById('css-' + type);
                    if (cssEl) cssEl.value = '';
                    if (type === 'bubble') document.body.classList.remove('has-custom-bubble-css');
                    if (type === 'global') document.body.classList.remove('has-custom-global-css');
                    if (type === 'offline') document.body.classList.remove('has-custom-offline-css');
                }
            });
            
            // 检查是否有任何自定义CSS
            const hasAnyCustom = store.customCSS.bubble || store.customCSS.global || store.customCSS.offline;
            if (hasAnyCustom) {
                if (typeof _disableDefaultTheme === 'function') _disableDefaultTheme();
            } else {
                if (typeof _enableDefaultTheme === 'function') _enableDefaultTheme();
            }
            
            save();
            if (typeof _moveCustomStylesToEnd === 'function') _moveCustomStylesToEnd();
            if (typeof _ensureBottomNavProtection === 'function') _ensureBottomNavProtection();
            if (typeof _ensureModalProtection === 'function') _ensureModalProtection();
            
            toast('已还原到导入美化包之前的状态 ✅');
        }

        // 伪装图片：返回简单占位标识（不再生成巨大的base64 data URL）
        function createFakeImagePlaceholder() {
            return '[fake-image]';
        }

        // 显示伪装图片描述弹窗
        // [FIX-伪装图片描述-v2] 使用独立高层级弹窗，不再依赖showConfirm
        // 根因：showConfirm使用#modal-confirm（z-index:10001），在聊天层内部
        // 可能被其他浮层遮挡或事件被长按逻辑吞噬导致点不开
        function showFakeImageDesc(desc) {
            const displayDesc = (desc && desc.trim()) ? desc : '（未填写图片描述）';
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;';
            overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
            var box = document.createElement('div');
            box.style.cssText = 'background:#fff;border-radius:14px;width:80%;max-width:320px;padding:24px 20px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,0.2);';
            box.innerHTML = '<div style="font-size:16px;font-weight:600;margin-bottom:12px;">📷 图片描述</div>' +
                '<div style="font-size:14px;color:#666;line-height:1.6;word-break:break-word;max-height:50vh;overflow-y:auto;padding:0 4px;">' +
                displayDesc.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>' +
                '<div style="margin-top:18px;"><button onclick="this.closest(\'div[style*=fixed]\').remove()" style="padding:10px 36px;border:none;background:#07c160;color:#fff;border-radius:20px;font-size:15px;cursor:pointer;">知道了</button></div>';
            overlay.appendChild(box);
            document.body.appendChild(overlay);
        }

        function textToImage(text, bgCol='#e0e0e0', textCol='#333') {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const font = 'bold 40px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.font = font;
            
            // Adjust canvas to fit text
            const maxWidth = 580;
            const lineHeight = 50;
            const padding = 20;
            
            let lines = [];
            let currentLine = '';
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const testLine = currentLine + char;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && i > 0) {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);
            
            canvas.width = Math.min(ctx.measureText(text).width + padding * 2, maxWidth + padding * 2);
            if (lines.length > 1) {
                canvas.width = maxWidth + padding * 2;
            }
            canvas.height = lines.length * lineHeight + padding * 2;
            
            // Re-apply font settings after canvas resize
            ctx.font = font;
            ctx.fillStyle = bgCol;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = textCol;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const yStart = (canvas.height / 2) - ((lines.length - 1) * lineHeight / 2);
            
            lines.forEach((line, index) => {
                ctx.fillText(line, canvas.width / 2, yStart + (index * lineHeight));
            });
            
            return canvas.toDataURL('image/png');
        }

        function uploadImg(target) {
            tempImgTarget = target;
            
            // 朋友圈发图：支持多选
            if (target === 'post-moment') {
                const fi = document.createElement('input');
                fi.type = 'file';
                fi.accept = 'image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico';
                fi.multiple = true;
                fi.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
                document.body.appendChild(fi);
                fi.onchange = function() {
                    if (fi.parentNode) fi.parentNode.removeChild(fi);
                    const files = Array.from(fi.files);
                    if (!files.length) return;
                    const imgs = [];
                    let processed = 0;
                    files.forEach(file => {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            imgs.push(e.target.result);
                            processed++;
                            if (processed === files.length) {
                                // [FIX-iOS朋友圈配文丢失] 延迟弹出配文弹窗，等待iOS文件选择器的残余事件消散
                                // iOS从文件选择器返回后可能触发幽灵点击事件，导致showPromptModal被意外关闭
                                setTimeout(function() {
                                    showPromptModal('配文:', '').then(function(caption) {
                                        // [FIX-配文丢失] caption为null表示用户取消了弹窗，此时仍然发布（只是没有配文）
                                        // 但如果caption有值则保留，不再用 || '' 覆盖
                                        if (caption === null) caption = '';
                                        if (imgs.length === 1) {
                                            postMoment(caption, imgs[0], null);
                                        } else {
                                            postMoment(caption, null, imgs);
                                        }
                                    });
                                }, 300);
                            }
                        };
                        reader.readAsDataURL(file);
                    });
                };
                setTimeout(() => fi.click(), 50);
                return;
            }

            // Non-image targets: use raw file input directly
            if (target === 'music-file' || target === 'lyrics-file' || target === 'sticker-batch') {
                const fi = document.getElementById('file-input');
                fi.multiple = (target === 'sticker-batch');
                if (target === 'music-file') fi.accept = 'audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.wma,.opus,application/octet-stream';
                else if (target === 'lyrics-file') fi.accept = '.lrc,.txt';
                else fi.accept = 'image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico';
                fi.value = '';
                // [FIX-上传锁屏] 设置全局标志位，防止文件选择器弹出期间触发锁屏
                window._isUploadingFile = true;
                // [FIX-Edge上传退出] 延迟click防止Edge焦点竞争
                setTimeout(() => fi.click(), 50);
                return;
            }
            
            // Icon targets: use cropper flow (file input only, no URL)
            if (target.startsWith('icon-')) {
                const fi = document.getElementById('file-input');
                fi.multiple = false;
                fi.accept = 'image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico';
                fi.value = '';
                // [FIX-上传锁屏] 设置全局标志位，防止文件选择器弹出期间触发锁屏
                window._isUploadingFile = true;
                // [FIX-Edge上传退出] 延迟click防止Edge焦点竞争
                setTimeout(() => fi.click(), 50);
                return;
            }

            // All other image targets: open unified modal with Local + URL support
            const titleMap = {
                'desktop-user-avatar': '上传主页头像',
                'desktop-widget-bg': '上传组件背景',
                'new-contact-avatar': '上传联系人头像',
                'edit-contact-avatar': '修改联系人头像',
                'moment-bg': '修改朋友圈背景',
                'post-moment': '发布朋友圈图片',
                'desktop-bg': '修改主页背景',
                'my-avatar': '修改微信头像',
                'chat-bg': '修改聊天背景',
                'vc-bg': '修改语音通话背景',
                'send-photo': '发送图片',
                'offline-photo': '发送线下图片',
                'new-persona-avatar': '上传人设头像',
                'new-group-avatar': '上传群聊头像',
                'profile-preset-avatar': '上传预设头像'
            };
            const title = titleMap[target] || '上传图片';
            
            openImgUploadModal(title, (imgResult) => {
                // Process through the same compression & assignment logic
                processUploadedImage(target, imgResult);
            });
        }
        
        // 上传一起听歌弹窗背景
        function uploadListenPlayerBg() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico';
            input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
            document.body.appendChild(input);
            input.onchange = function() {
                const file = input.files[0];
                if (input.parentNode) input.parentNode.removeChild(input);
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imgUrl = e.target.result;
                    // 保存到 store
                    if (!store.listenState) store.listenState = {};
                    store.listenState.playerBg = imgUrl;
                    // 应用背景
                    const playerModal = document.getElementById('listen-player-modal');
                    if (playerModal) {
                        playerModal.style.backgroundImage = `url(${imgUrl})`;
                        playerModal.style.backgroundSize = 'cover';
                        playerModal.style.backgroundPosition = 'center';
                        playerModal.style.backgroundRepeat = 'no-repeat';
                    }
                    save();
                    toast("弹窗背景已更新", "success");
                };
                reader.readAsDataURL(file);
            };
            setTimeout(() => input.click(), 50);
        }
        window.uploadListenPlayerBg = uploadListenPlayerBg;
        
        function processUploadedImage(target, imgUrl) {
            const compressImage = (dataUrl, callback) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        // 不压缩尺寸，保持原始分辨率，避免图片变糊
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d', { alpha: true });
                        ctx.clearRect(0, 0, img.width, img.height);
                        // [FIX-图标透明] 背景类图片和图标都保持透明，不填充白色
                        const isBgTarget = target === 'moment-bg' || target === 'desktop-bg' || target === 'desktop-widget-bg' || target === 'chat-bg' || target === 'vc-bg' || target === 'vidcall-bg';
                        const isIcon = target && target.startsWith('icon-');
                        const needTransparent = isBgTarget || isIcon;
                        if (!needTransparent) {
                            ctx.fillStyle = '#ffffff';
                            ctx.fillRect(0, 0, img.width, img.height);
                        }
                        ctx.drawImage(img, 0, 0, img.width, img.height);
                        
                        // [FIX-图标透明] 背景类和图标使用PNG保持透明度，其他用JPEG节省空间
                        const compressed = needTransparent
                            ? canvas.toDataURL('image/png')
                            : canvas.toDataURL('image/jpeg', 0.92);
                        callback(compressed);
                    } catch (e) {
                        console.error('图片压缩失败:', e);
                        callback(dataUrl);
                    }
                };
                img.onerror = () => {
                    console.error('图片加载失败');
                    callback(dataUrl);
                };
                img.crossOrigin = 'anonymous';
                img.src = dataUrl;
            };

            const applyImage = (finalUrl) => {
                switch(target) {
                    case 'desktop-user-avatar':
                        store.user.desktopAvatar = finalUrl;
                        document.getElementById('desktop-user-avatar-img').src = finalUrl;
                        toast("主页头像已更新", "success");
                        break;
                    case 'desktop-widget-bg':
                        processWidgetImage(finalUrl);
                        // processWidgetImage内部会调用save，这里不需要重复
                        return; // 提前返回，避免重复保存
                    case 'new-contact-avatar':
                        document.getElementById('new-contact-img').src = finalUrl;
                        document.getElementById('new-contact-img').style.display = 'block';
                        // 新建联系人头像暂存，不需要立即保存
                        return;
                    case 'edit-contact-avatar':
                        const c = store.contacts.find(x => x.id === activeChatId);
                        if(c) {
                            c.avatar = finalUrl;
                            _saveImageNow();
                            openChatSettings();
                            renderHistory();
                            renderContacts();
                            toast("头像已更新", "success");
                        }
                        return;
                    case 'moment-bg':
                        store.user.momentBg = finalUrl;
                        _saveImageNow();
                        renderMoments();
                        toast("朋友圈背景已更新", "success");
                        return;
                    case 'post-moment':
                        showPromptModal('配文:', '').then(function(cap) { postMoment(cap || '', finalUrl); });
                        return; // postMoment内部会保存
                    case 'desktop-bg':
                        store.desktopBg = finalUrl;
                        // [FIX-背景不生效] 同步设置data-bg-url属性 + 所有background子属性
                        // 防止自定义美化CSS的background简写覆盖background-image
                        var _deskEl = document.getElementById('layer-desktop');
                        _deskEl.setAttribute('data-bg-url', finalUrl);
                        _deskEl.style.setProperty('background-image', `url(${finalUrl})`, 'important');
                        _deskEl.style.setProperty('background-size', 'cover', 'important');
                        _deskEl.style.setProperty('background-position', 'center', 'important');
                        _deskEl.style.setProperty('background-repeat', 'no-repeat', 'important');
                        toast("主页背景已修改", "success");
                        break;
                    case 'my-avatar':
                        store.user.avatar = finalUrl;
                        document.getElementById('my-avatar').src = finalUrl;
                        // 修复：头像更新后刷新已打开的聊天界面，避免聊天气泡显示旧头像
                        if (activeChatId && document.getElementById('layer-chat')?.classList.contains('show')) {
                            renderHistory(true);
                        }
                        toast("微信头像已更新", "success");
                        break;
                    case 'chat-bg':
                        const contact = store.contacts.find(x => x.id === activeChatId);
                        if(contact) {
                            if(!contact.settings) contact.settings = {};
                            contact.settings.bg = finalUrl;
                            const chatHistEl = document.getElementById('chat-history');
                            if(chatHistEl) {
                                chatHistEl.classList.add('has-custom-bg');
                                // [FIX-壁纸被覆盖] 使用setProperty+important，防止美化包CSS的!important覆盖用户壁纸
                                // [FIX-壁纸卡顿发热] 使用Blob URL避免base64阻塞渲染
                                var _bgBlobUrl = (typeof _getChatBgBlobUrl === 'function') ? _getChatBgBlobUrl(finalUrl) : finalUrl;
                                chatHistEl.style.setProperty('background-image', `url(${_bgBlobUrl})`, 'important');
                                chatHistEl.style.setProperty('background-size', 'cover', 'important');
                                chatHistEl.style.setProperty('background-position', 'center', 'important');
                                chatHistEl.style.setProperty('background-repeat', 'no-repeat', 'important');
                            }
                            /* [FIX-悬浮底栏白色] 同步背景到layer-chat */
                            const _lc = document.getElementById('layer-chat');
                            if(_lc) {
                                _lc.style.setProperty('background-image', `url(${finalUrl})`, 'important');
                                _lc.style.setProperty('background-size', 'cover', 'important');
                                _lc.style.setProperty('background-position', 'center', 'important');
                                _lc.style.setProperty('background-repeat', 'no-repeat', 'important');
                            }
                            toast("聊天背景应用成功", "success");
                        }
                        break;
                    case 'vc-bg':
                        const vcContact = store.contacts.find(x => x.id === activeChatId);
                        if(vcContact) {
                            if(!vcContact.settings) vcContact.settings = {};
                            vcContact.settings.vcBg = finalUrl;
                            toast("语音通话背景已设置 ✅", "success");
                        }
                        break;
                    case 'vidcall-bg':
                        const vidcallContact = store.contacts.find(x => x.id === activeChatId);
                        if(vidcallContact) {
                            if(!vidcallContact.settings) vidcallContact.settings = {};
                            vidcallContact.settings.vidcallBg = finalUrl;
                            toast("视频通话背景已设置 ✅", "success");
                            _saveImageNow();
                            openChatSettings();
                        }
                        break;
                    case 'offline-photo':
                        // [FIX-线下图片] 线下模式上传图片：预览模式，不直接发送
                        if (typeof _showOfflineImagePreview === 'function') {
                            _showOfflineImagePreview(finalUrl);
                        }
                        return;
                    case 'send-photo':
                        userSend('image', finalUrl);
                        return; // userSend内部会保存
                    case 'new-persona-avatar':
                        document.getElementById('new-persona-img').src = finalUrl;
                        document.getElementById('new-persona-img').style.display = 'block';
                        return; // 新建人设头像暂存，不需要立即保存
                    case 'profile-preset-avatar':
                        document.getElementById('profile-preset-edit-avatar').src = finalUrl;
                        return; // 预设头像暂存，不需要立即保存
                    case 'new-group-avatar':
                        const groupAvatarImg = document.getElementById('new-group-avatar-img');
                        if (groupAvatarImg) {
                            groupAvatarImg.src = finalUrl;
                            groupAvatarImg.style.display = 'block';
                        }
                        return; // 新建群聊头像暂存，不需要立即保存
                    default:
                        break;
                }
                _saveImageNow();
            };

            // If it's a URL (starts with http), use it directly without compression
            // to avoid CORS issues with canvas
            if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
                applyImage(imgUrl);
            } else {
                // It's a data URL from local file, compress it
                compressImage(imgUrl, (compressed) => {
                    applyImage(compressed);
                });
            }
        }
        
        // Cropper Logic
        let cropperInstance = null;
        function startCropper(url) {
            const img = document.getElementById('cropper-img');
            img.src = url;
            document.getElementById('modal-cropper').style.display = 'flex';
            
            if(cropperInstance) cropperInstance.destroy();
            
            cropperInstance = new Cropper(img, {
                aspectRatio: 1, // Icons are square
                viewMode: 1,
                autoCropArea: 1,
                dragMode: 'move'
            });
        }

        function closeCropper() {
            document.getElementById('modal-cropper').style.display = 'none';
            if(cropperInstance) {
                cropperInstance.destroy();
                cropperInstance = null;
            }
            document.getElementById('file-input').value = '';
        }

        function finishCrop() {
            if(!cropperInstance) return;
            // Get cropped canvas
            const canvas = cropperInstance.getCroppedCanvas({
                width: 150, // Optimal size for icons
                height: 150,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high'
            });
            
            if (!canvas) return;

            // [FIX-图标透明] 使用PNG格式保持透明通道，JPEG会导致透明底变黑底
            const finalUrl = canvas.toDataURL('image/png');
            
            // Apply logic specifically for icons
            if (tempImgTarget && tempImgTarget.startsWith('icon-')) {
                const appId = tempImgTarget.replace('icon-','');
                if(!store.appIcons) store.appIcons = {};
                store.appIcons[appId] = finalUrl;
                _saveImageNow();
                renderDesktop(); 
                renderBeautify(); 
                toast("图标已修改", "success");
            }
            
            closeCropper();
        }

        // [FIX-上传锁屏] 安全网：用户取消文件选择时某些浏览器不触发onchange
        // 通过window focus事件延迟清除标志位
        window.addEventListener('focus', function() {
            if (window._isUploadingFile) {
                setTimeout(function() { window._isUploadingFile = false; }, 500);
            }
        });

        document.getElementById('file-input').onchange = function(e) {
            // [FIX-上传锁屏] 文件选择器已关闭，清除上传标志位
            window._isUploadingFile = false;
            // [FIX-Edge上传退出] 延迟处理防止Edge在文件选择器关闭时丢失焦点
            if (!e.target.files || e.target.files.length === 0) return;

            const handleFile = (file) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const u = event.target.result;
                    
                    // Intercept for App Icons to use Cropper
                    if (tempImgTarget && tempImgTarget.startsWith('icon-')) {
                        startCropper(u);
                        return; // Stop further processing here, wait for crop finish
                    }

                    // 问题1修复：优化图片压缩逻辑，确保移动端正常显示
                    const compressImage = (dataUrl, callback) => {
                        const img = new Image();
                        img.onload = () => {
                            try {
                                const canvas = document.createElement('canvas');
                                // 图标需要小尺寸，其他保持原始分辨率不压缩尺寸
                                const isIcon = tempImgTarget && tempImgTarget.startsWith('icon-');
                                let width = img.width;
                                let height = img.height;
                                if (isIcon) {
                                    const maxSize = 150;
                                    if (width > height && width > maxSize) {
                                        height = (height * maxSize) / width;
                                        width = maxSize;
                                    } else if (height > maxSize) {
                                        width = (width * maxSize) / height;
                                        height = maxSize;
                                    }
                                }
                                
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d', { alpha: true });
                                
                                ctx.clearRect(0, 0, width, height);
                                // [FIX-图标透明] 背景类图片和图标都保持透明，不填充白色
                                // 图标(icon-)也需要保持透明，否则抠图的透明区域会变黑
                                const isBgTarget = tempImgTarget === 'moment-bg' || tempImgTarget === 'desktop-bg' || tempImgTarget === 'desktop-widget-bg' || tempImgTarget === 'chat-bg' || tempImgTarget === 'vc-bg';
                                const needTransparent = isBgTarget || isIcon;
                                if (!needTransparent) {
                                    ctx.fillStyle = '#ffffff';
                                    ctx.fillRect(0, 0, width, height);
                                }
                                ctx.drawImage(img, 0, 0, width, height);
                                
                                // [FIX-图标透明] 背景类和图标使用PNG保持透明度，其他用JPEG节省空间
                                const compressed = needTransparent
                                    ? canvas.toDataURL('image/png')
                                    : canvas.toDataURL('image/jpeg', 0.92);
                                callback(compressed);
                            } catch (e) {
                                console.error('图片压缩失败:', e);
                                toast('图片处理失败，使用原图', 'error');
                                callback(dataUrl);
                            }
                        };
                        img.onerror = () => {
                            console.error('图片加载失败');
                            toast('图片加载失败，请重试', 'error');
                            callback(dataUrl);
                        };
                        img.crossOrigin = 'anonymous'; // 处理跨域图片
                        img.src = dataUrl;
                    };

                    const processImage = (finalUrl) => {
                        switch(tempImgTarget) {
                            case 'desktop-user-avatar':
                                store.user.desktopAvatar = finalUrl;
                                save();
                                document.getElementById('desktop-user-avatar-img').src = finalUrl;
                                toast("主页头像已更新", "success");
                                break;
                            case 'desktop-widget-bg':
                                processWidgetImage(finalUrl);
                                break;
                            case 'new-contact-avatar':
                                document.getElementById('new-contact-img').src=finalUrl; 
                                document.getElementById('new-contact-img').style.display='block';
                                break;
                            case 'edit-contact-avatar':
                                const c = store.contacts.find(x=>x.id===activeChatId);
                                if(c) { c.avatar = finalUrl; save(); openChatSettings(); renderHistory(); renderContacts(); toast("头像已更新", "success"); }
                                break;
                            case 'moment-bg':
                                store.user.momentBg = finalUrl;
                                save();
                                renderMoments();
                                toast("朋友圈背景已更新", "success");
                                break;
                            case 'post-moment':
                                showPromptModal('配文:', '').then(function(cap) { postMoment(cap || '', finalUrl); });
                                break;
                            case 'music-file':
                                // [FIX-QQ浏览器兼容] 修正音频data URL的MIME类型
                                tempMusicData.url = _fixAudioDataUrl(finalUrl, file.name);
                                tempMusicData.name = file.name.replace(/\.[^/.]+$/, "");
                                // Auto fill name if empty
                                const nameInput = document.getElementById('music-add-name');
                                if(!nameInput.value) nameInput.value = tempMusicData.name;
                                document.getElementById('music-file-status').style.display = 'block';
                                document.getElementById('music-file-status').innerText = '文件已就绪: ' + file.name;
                                toast("MP3已就绪");
                                break;
                            case 'lyrics-file':
                                tempMusicData.lrc = finalUrl;
                                document.getElementById('lyrics-status').innerText = file.name;
                                toast("歌词已就绪");
                                break;
                            case 'desktop-bg':
                                store.desktopBg = finalUrl;
                                // [FIX-背景不生效] 同步设置data-bg-url属性 + 所有background子属性
                                var _deskEl2 = document.getElementById('layer-desktop');
                                _deskEl2.setAttribute('data-bg-url', finalUrl);
                                _deskEl2.style.setProperty('background-image', `url(${finalUrl})`, 'important');
                                _deskEl2.style.setProperty('background-size', 'cover', 'important');
                                _deskEl2.style.setProperty('background-position', 'center', 'important');
                                _deskEl2.style.setProperty('background-repeat', 'no-repeat', 'important');
                                toast("主页背景已修改", "success");
                                break;
                            case 'my-avatar':
                                store.user.avatar=finalUrl;
                                document.getElementById('my-avatar').src=finalUrl;
                                // 修复：头像更新后刷新已打开的聊天界面，避免聊天气泡显示旧头像
                                if (activeChatId && document.getElementById('layer-chat')?.classList.contains('show')) {
                                    renderHistory(true);
                                }
                                toast("微信头像已更新", "success");
                                break;
                            case 'chat-bg':
                                const contact = store.contacts.find(x=>x.id===activeChatId);
                                if(contact) {
                                    if(!contact.settings) contact.settings={};
                                    contact.settings.bg=finalUrl;
                                    const chatHistEl2 = document.getElementById('chat-history');
                                    if(chatHistEl2) {
                                        chatHistEl2.classList.add('has-custom-bg');
                                        // [FIX-壁纸被覆盖] 使用setProperty+important
                                        // [FIX-壁纸卡顿发热] 使用Blob URL
                                        var _bgBlobUrl2 = (typeof _getChatBgBlobUrl === 'function') ? _getChatBgBlobUrl(finalUrl) : finalUrl;
                                        chatHistEl2.style.setProperty('background-image', `url(${_bgBlobUrl2})`, 'important');
                                        chatHistEl2.style.setProperty('background-size', 'cover', 'important');
                                        chatHistEl2.style.setProperty('background-position', 'center', 'important');
                                        chatHistEl2.style.setProperty('background-repeat', 'no-repeat', 'important');
                                    }
                                    /* [FIX-悬浮底栏白色] 同步背景到layer-chat */
                                    const _lc2 = document.getElementById('layer-chat');
                                    if(_lc2) {
                                        _lc2.style.setProperty('background-image', `url(${finalUrl})`, 'important');
                                        _lc2.style.setProperty('background-size', 'cover', 'important');
                                        _lc2.style.setProperty('background-position', 'center', 'important');
                                        _lc2.style.setProperty('background-repeat', 'no-repeat', 'important');
                                    }
                                    toast("聊天背景应用成功", "success");
                                }
                                break;
                            case 'vc-bg':
                                const vcContact2 = store.contacts.find(x=>x.id===activeChatId);
                                if(vcContact2) {
                                    if(!vcContact2.settings) vcContact2.settings={};
                                    vcContact2.settings.vcBg=finalUrl;
                                    toast("语音通话背景已设置 ✅", "success");
                                }
                                break;
                            case 'vidcall-bg':
                                const vidcallContact2 = store.contacts.find(x=>x.id===activeChatId);
                                if(vidcallContact2) {
                                    if(!vidcallContact2.settings) vidcallContact2.settings={};
                                    vidcallContact2.settings.vidcallBg=finalUrl;
                                    toast("视频通话背景已设置 ✅", "success");
                                    save();
                                    openChatSettings();
                                }
                                break;
                            case 'send-photo':
                                userSend('image', finalUrl);
                                break;
                            case 'new-persona-avatar':
                                document.getElementById('new-persona-img').src=finalUrl;
                                document.getElementById('new-persona-img').style.display='block';
                                break;
                            case 'profile-preset-avatar':
                                document.getElementById('profile-preset-edit-avatar').src=finalUrl;
                                break;
                            default:
                                if (tempImgTarget.startsWith('icon-')) {
                                    const appId = tempImgTarget.replace('icon-','');
                                    if(!store.appIcons) store.appIcons = {};
                                    store.appIcons[appId] = finalUrl;
                                    _saveImageNow();
                                    renderDesktop(); 
                                    renderBeautify(); 
                                    toast("图标已修改", "success");
                                }
                                break;
                        }
                    };

                    // 问题1修复：确保所有图片都经过压缩处理
                    // 修复：图标上传不压缩，避免变白
                    if (tempImgTarget === 'music-file' || tempImgTarget.startsWith('icon-')) {
                        processImage(u);
                    } else {
                        compressImage(u, (compressed) => {
                            processImage(compressed);
                            save(); // 确保保存
                        });
                    }
                };
                
                if (tempImgTarget === 'lyrics-file') {
                    reader.readAsText(file);
                } else {
                    reader.readAsDataURL(file);
                }
            };

            if (tempImgTarget === 'sticker-batch') {
                const targetCateId = document.getElementById('sticker-add-cate-sel').value;
                const cate = store.stickerCategories.find(c => c.id === targetCateId);
                if (!cate) { window._isUploadingFile = false; return toast("添加失败: 未找到分类", "error"); }

                const totalFiles = e.target.files.length;
                let processed = 0;
                Array.from(e.target.files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;
                            const maxSize = 400;
                            
                            if (width > height && width > maxSize) {
                                height = (height * maxSize) / width;
                                width = maxSize;
                            } else if (height > maxSize) {
                                width = (width * maxSize) / height;
                                height = maxSize;
                            }
                            
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            const compressed = canvas.toDataURL('image/jpeg', 0.7);
                            
                            cate.stickers.push({url: compressed, type: 'image'});
                            processed++;
                            
                            if (processed === totalFiles) {
                                save();
                                if (activeStickerCateId === targetCateId) renderStickerGallery();
                                // [FIX-上传锁屏] 所有文件处理完成后才关闭模态框
                                document.getElementById('modal-sticker').style.display = 'none';
                                toast("表情已添加", "success");
                            }
                        };
                        img.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            } else {
                const file = e.target.files[0];
                if (file) handleFile(file);
            }
        }
        
        function testLink(id, type) {
            let u = document.getElementById(id).value;
            if(!u) return toast("请输入链接");
            // 支持textarea多行：提取第一个有效URL
            const firstLine = u.split('\n').map(l=>l.trim()).find(l=>l.length>0) || '';
            const urlMatch = firstLine.match(/(https?:\/\/\S+)/i);
            u = urlMatch ? urlMatch[1] : firstLine;
            if(type==='audio') { const a=new Audio(u); a.onloadedmetadata=()=>toast("有效"); a.onerror=()=>toast("无效"); }
            else { const i=new Image(); i.onload=()=>toast("有效"); i.onerror=()=>toast("无效"); i.src=u; }
        }

        // --- MEMORY MORE MENU ---
        function toggleMemoryMoreMenu(e) {
            e.stopPropagation();
            const menu = document.getElementById('memory-more-menu');
            if (!menu) return;
            if (menu.style.display === 'none' || !menu.style.display) {
                menu.style.display = 'block';
                setTimeout(() => {
                    document.addEventListener('click', hideMemoryMoreMenuOnClick, { once: true });
                }, 0);
            } else {
                menu.style.display = 'none';
            }
        }
        function hideMemoryMoreMenu() {
            const menu = document.getElementById('memory-more-menu');
            if (menu) menu.style.display = 'none';
        }
        function hideMemoryMoreMenuOnClick() {
            hideMemoryMoreMenu();
        }

        // [FIX-记忆同步] 将写入 memorySummaries 的记忆同步到新 memorySystem
        // 解决：手动/自动总结只写旧结构导致V2渲染看不到记忆的问题
        function _syncMemoToNewSystem(contactId, memo) {
            try {
                if (!window.MemorySystem || !window.MemorySystem.Store || !window.MemorySystem.Pipeline) {
                    // [FIX-记忆丢失v2] 新系统不可用时，标记此记忆为"待同步"
                    // 防止后续 syncToLegacyStore() 用新系统空数据覆盖旧系统数据导致丢失
                    memo._pendingSync = true;
                    console.warn('[FIX-记忆丢失v2] 新记忆系统不可用，记忆已标记为待同步:', memo.id);
                    return;
                }
                // 用 Pipeline.addManual 写入新系统（自动分析情感+关键词+层级）
                // [FIX-邮件记忆分类] 把 source 映射为 channel，避免邮件等渠道被错归类为"手动记录"
                // [FIX-记忆重构v3] 传入事件时间（memo.date），而非写入时间
                const _syncChannel = memo.source || 'chat';
                const _syncScene = window.MemorySystem.Migration._sourceToScene(_syncChannel) || '聊天';
                const newMemo = window.MemorySystem.Pipeline.addManual(contactId, memo.content, {
                    fictional: !!memo.fictional,
                    channel: _syncChannel,
                    scene: _syncScene,
                    tags: memo.source ? [memo.source] : [],
                    eventTime: memo.date || Date.now()
                });
                if (newMemo) {
                    // 覆盖id保持一致，方便后续编辑/删除
                    newMemo.id = memo.id;
                    newMemo.sourceDetail = { channel: _syncChannel, scene: _syncScene };
                    // [FIX-记忆丢失v2] 同步成功则清除待同步标记
                    delete memo._pendingSync;
                    console.log('[FIX-记忆同步] 已同步到新记忆系统:', newMemo.tier, memo.id);
                } else {
                    // [FIX-记忆丢失v2] Pipeline.addManual 返回 null，同样标记为待同步
                    memo._pendingSync = true;
                }
            } catch(e) {
                console.warn('[FIX-记忆同步] 同步失败，不影响旧系统:', e);
                // [FIX-记忆丢失v2] 异常情况也标记为待同步
                memo._pendingSync = true;
            }
        }

        // --- MEMORY SUMMARY SYSTEM ---
        function openMemorySystem() {
            if (!activeChatId) return;
            document.getElementById('layer-memory-system').classList.add('show');
            renderMemorySystem();
            closeExtMenu();
        }

        function renderMemorySystem() {
            const listEl = document.getElementById('memory-list');
            if (!listEl) return;

            // ===== [类人记忆系统] 优先使用分层渲染 =====
            if (typeof window.MemorySystem === 'object' && window.MemorySystem && window.MemorySystem.Store && activeChatId) {
                try {
                    // [FIX-记忆同步] 如果新系统为空但旧系统有数据，自动重新迁移
                    const _cm = window.MemorySystem.Store.getContactMem(activeChatId);
                    const _legacyMems = (store.memorySummaries && store.memorySummaries[activeChatId]) || [];
                    // [FIX-记忆丢失] 归档记忆也要计入，否则全部衰减归档后会误判为空并重复迁移
                    const _newCount = _cm ? (_cm.core.length + _cm.long.length + _cm.short.length + _cm.archive.length) : 0;
                    if (_newCount === 0 && _legacyMems.length > 0) {
                        console.log('[FIX-记忆同步] 检测到旧系统有', _legacyMems.length, '条记忆但新系统为空，自动迁移...');
                        _legacyMems.forEach(memo => {
                            if (!memo.content) return;
                            // 跳过日程/课表等特殊条目
                            if (memo.content.indexOf('[日程:') >= 0 || memo.content.indexOf('[课表信息]') >= 0) return;
                            if (memo.id && (memo.id.startsWith('sch_') || memo.id.startsWith('tt_'))) return;
                            _syncMemoToNewSystem(activeChatId, memo);
                        });
                        save();
                    }
                    return _renderMemorySystemV2(listEl);
                } catch(e) {
                    console.warn('[MemorySystem] V2 render failed, fallback to legacy:', e);
                }
            }

            // ========== 旧版渲染（兜底） ==========
            const allSummaries = (store.memorySummaries && store.memorySummaries[activeChatId]) ? [...store.memorySummaries[activeChatId]].reverse() : [];
            const summaries = allSummaries.filter(m => {
                if (!m.content) return true;
                if (m.content.indexOf('[日程:') >= 0) return false;
                if (m.content.indexOf('[课表信息]') >= 0) return false;
                if (m.id && (m.id.startsWith('sch_') || m.id.startsWith('tt_'))) return false;
                return true;
            });
            
            if (summaries.length === 0) {
                listEl.innerHTML = '<div style="text-align:center; color:#999; padding:50px;">暂无记忆总结<br>开启功能后将自动生成</div>';
                return;
            }

            const realCount = summaries.filter(m => !m.fictional).length;
            const fictionalCount = summaries.filter(m => m.fictional).length;

            listEl.innerHTML = (fictionalCount > 0 ? `<div style="padding:8px 12px; margin-bottom:8px; background:#fff3e0; border-radius:8px; font-size:12px; color:#e65100;">
                <i class="fas fa-info-circle"></i> 真实记忆 ${realCount} 条 · 虚构/小剧场 ${fictionalCount} 条（虚构记忆不会被AI当作真实事件）
            </div>` : '') + summaries.map(memo => {
                const isFictional = memo.fictional;
                const fictionalBadge = isFictional ? '<span style="display:inline-block; background:#ff9800; color:#fff; font-size:10px; padding:1px 6px; border-radius:10px; margin-left:6px; vertical-align:middle;">虚构</span>' : '';
                const fictionalStyle = isFictional ? 'border-left:3px solid #ff9800; opacity:0.85;' : '';
                return `
                <div class="list-item" style="${fictionalStyle}">
                    <div class="list-content">
                        <div class="memo-date">${new Date(memo.date).toLocaleString()}${fictionalBadge}${memo.source ? ' <span style="font-size:10px;color:#999;">(' + (memo.source === 'online' ? '线上' : memo.source === 'offline' ? '线下' : memo.source === 'manual' ? '手动' : memo.source) + ')</span>' : ''}</div>
                        <div class="memo-content">${memo.content.replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="memo-actions">
                        <i class="fas ${isFictional ? 'fa-check-circle' : 'fa-theater-masks'}" title="${isFictional ? '标记为真实' : '标记为虚构'}" onclick="toggleMemoryFictional('${memo.id}')" style="color:${isFictional ? '#4caf50' : '#ff9800'};"></i>
                        <i class="fas fa-edit" onclick="editMemory('${memo.id}')"></i>
                        <i class="fas fa-trash" onclick="deleteMemory('${memo.id}')"></i>
                    </div>
                </div>`;
            }).join('');
        }

        // ===== [类人记忆系统] 分层记忆UI渲染 =====
        // 顶部tab切换：💎核心 / 📌长期 / 💭短期 / 📦归档
        // 每条记忆显示：强度条 + 情感类型 + 提及次数 + 来源场景 + 操作按钮
        let _memoryTierTab = 'all'; // 'all' | 'core' | 'long' | 'short' | 'archive'
        window._memoryTierTab = _memoryTierTab;

        function switchMemoryTier(tier) {
            _memoryTierTab = tier;
            window._memoryTierTab = tier;
            renderMemorySystem();
        }
        window.switchMemoryTier = switchMemoryTier;

        // ===== 极简黑白风格（Minimal B&W）分层记忆UI =====
        function _escapeHtmlMem(str) {
            if (str == null) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function _renderMemorySystemV2(listEl) {
            const MS = window.MemorySystem;
            const contactMem = MS.Store.getContactMem(activeChatId);
            if (!contactMem) {
                listEl.innerHTML = `<div class="mem-empty"><div class="mem-empty-icon"><i class="far fa-lightbulb"></i></div>暂无记忆<br><span style="font-size:12px; color:#bbb;">开启功能后将自动生成</span></div>`;
                return;
            }

            // 触发维护（被动式，有频率限制）
            try { MS.Decay.maintain(activeChatId); } catch(_) {}

            // 过滤无效条目（日程/课表）
            const filterValid = (arr) => arr.filter(m => {
                if (!m || !m.content) return false;
                if (m.content.indexOf('[日程:') >= 0) return false;
                if (m.content.indexOf('[课表信息]') >= 0) return false;
                if (m.id && (m.id.startsWith('sch_') || m.id.startsWith('tt_'))) return false;
                return true;
            });

            const core = filterValid(contactMem.core);
            const long = filterValid(contactMem.long);
            const shortT = filterValid(contactMem.short);
            const archive = filterValid(contactMem.archive);
            const total = core.length + long.length + shortT.length;

            if (total === 0 && archive.length === 0) {
                listEl.innerHTML = `<div class="mem-empty"><div class="mem-empty-icon"><i class="far fa-lightbulb"></i></div>暂无记忆<br><span style="font-size:12px; color:#bbb;">开启功能后将自动生成</span></div>`;
                return;
            }

            const currentTab = window._memoryTierTab || 'all';
            const tabBtn = (key, label, count) => {
                const active = currentTab === key;
                return `<div class="mem-tab ${active ? 'active' : ''}" onclick="switchMemoryTier('${key}')">${label}${count > 0 ? `<span class="mem-tab-count">${count}</span>` : ''}</div>`;
            };

            // 决定要渲染哪些记忆
            let toRender = [];
            if (currentTab === 'all') {
                toRender = [
                    ...core.map(m => ({ m, t: 'core' })),
                    ...long.map(m => ({ m, t: 'long' })),
                    ...shortT.map(m => ({ m, t: 'short' }))
                ];
            } else if (currentTab === 'core') toRender = core.map(m => ({ m, t: 'core' }));
            else if (currentTab === 'long') toRender = long.map(m => ({ m, t: 'long' }));
            else if (currentTab === 'short') toRender = shortT.map(m => ({ m, t: 'short' }));
            else if (currentTab === 'archive') toRender = archive.map(m => ({ m, t: 'archive' }));

            // 按创建时间倒序
            toRender.sort((a, b) => (b.m.createdAt || 0) - (a.m.createdAt || 0));

            const fictionalCount = toRender.filter(x => x.m.fictional).length;
            const realCount = toRender.length - fictionalCount;

            const tierLabel = { core: '核心记忆', long: '长期记忆', short: '短期记忆', archive: '归档' };
            const emotionLabel = {
                joy: '开心', love: '喜爱', sadness: '难过', anger: '生气',
                surprise: '惊讶', fear: '害怕', neutral: '平静'
            };

            const renderCard = ({ m, t }) => {
                const strength = m.strength != null ? m.strength : MS.Decay.calculateStrength(m);
                const strengthPct = Math.round(strength * 100);

                const sceneLabel = (m.sourceDetail && m.sourceDetail.scene) || '聊天';
                const accessCount = m.accessCount || 0;
                const emotText = emotionLabel[m.emotionType || 'neutral'] || '';

                const content = (m.content || '');
                // 粗略判断是否需要折叠：超过60字或含2+换行
                const isLong = content.length > 60 || (content.match(/\n/g) || []).length >= 2;
                const safeContent = _escapeHtmlMem(content).replace(/\n/g, '<br>');
                // [FIX-时间戳v5] 优先使用事件时间（对话实际发生时间），而非createdAt（可能是总结时间）
                // 解决：21号聊天、23号总结，记忆显示日期全部是23号的问题
                const _eventTs = (m.eventTimeRange && m.eventTimeRange.start && m.eventTimeRange.start > 0) ? m.eventTimeRange.start : null;
                const _memDate = new Date(_eventTs || m.createdAt || m.date || Date.now());
                const dateStr = _memDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'numeric', day: 'numeric' }) + ' ' + _memDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

                // 卡片类名
                const cardClasses = ['mem-card'];
                if (t === 'archive') cardClasses.push('is-archive');
                if (m.fictional) cardClasses.push('is-fictional');

                // 层级标签
                const tagClass = `mem-tag tier-${t}`;
                const tierText = tierLabel[t];

                // 扩展标签
                const extTags = [];
                if (m.isCoreEvent) extTags.push(`<span class="mem-tag-ext is-core-event">关键</span>`);
                if (m.fictional) extTags.push(`<span class="mem-tag-ext is-fictional">虚构</span>`);
                if (m.pinned) extTags.push(`<span class="mem-tag-ext"><i class="fas fa-thumbtack" style="font-size:9px; margin-right:3px;"></i>置顶</span>`);

                // 操作按钮
                const canPromote = t !== 'core' && t !== 'archive';
                const canDemote = t !== 'short' && t !== 'archive';
                const promoteTo = t === 'short' ? '长期' : '核心';
                const demoteTo = t === 'core' ? '长期' : '短期';

                const actionsHtml = `
                    <div class="mem-actions">
                        ${canPromote ? `<button class="mem-btn" onclick="promoteMemory('${m.id}')" title="晋升为${promoteTo}"><i class="fas fa-arrow-up"></i>晋升</button>` : ''}
                        ${canDemote ? `<button class="mem-btn" onclick="demoteMemory('${m.id}')" title="降级为${demoteTo}"><i class="fas fa-arrow-down"></i>降级</button>` : ''}
                        ${t === 'archive' ? `<button class="mem-btn" onclick="restoreMemory('${m.id}')"><i class="fas fa-undo"></i>恢复</button>` : ''}
                        <button class="mem-btn ${m.pinned ? 'mem-btn-pinned' : ''}" onclick="togglePinMemory('${m.id}')" title="${m.pinned ? '取消置顶' : '置顶（防止衰减）'}"><i class="fas fa-thumbtack"></i>${m.pinned ? '已置顶' : '置顶'}</button>
                        <button class="mem-btn" onclick="toggleMemoryFictional('${m.id}')" title="${m.fictional ? '标记为真实' : '标记为虚构'}"><i class="fas ${m.fictional ? 'fa-check' : 'fa-theater-masks'}"></i>${m.fictional ? '真实' : '虚构'}</button>
                        <button class="mem-btn" onclick="editMemory('${m.id}')"><i class="fas fa-pen"></i>编辑</button>
                        <button class="mem-btn mem-btn-danger" onclick="deleteMemory('${m.id}')"><i class="far fa-trash-alt"></i>删除</button>
                    </div>`;

                return `
                <div class="${cardClasses.join(' ')}" data-mem-id="${m.id}">
                    <div class="mem-card-top">
                        <div>
                            <span class="${tagClass}">${tierText}</span>
                            ${extTags.join('')}
                        </div>
                        <span class="mem-card-scene">${_escapeHtmlMem(sceneLabel)}</span>
                    </div>
                    <div class="mem-card-body ${isLong ? 'is-clamped' : ''}" id="mem-body-${m.id}">${safeContent}</div>
                    ${isLong ? `<button class="mem-expand-toggle" onclick="toggleMemExpand('${m.id}', this)">展开全部</button>` : ''}
                    <div class="mem-strength">
                        <span style="font-size:11px; color:#999;">强度</span>
                        <div class="mem-strength-bar"><div class="mem-strength-fill" style="width:${strengthPct}%"></div></div>
                        <span class="mem-strength-val">${strengthPct}%</span>
                    </div>
                    <div class="mem-card-meta">
                        <span>${dateStr}</span>
                        <span class="dot"></span>
                        <span>提及 ${accessCount} 次</span>
                        ${emotText ? `<span class="dot"></span><span>${emotText}</span>` : ''}
                    </div>
                    ${actionsHtml}
                </div>`;
            };

            const headerHtml = `
                <div class="mem-head">
                    <div class="mem-tabs">
                        ${tabBtn('all', '全部', total)}
                        ${tabBtn('core', '核心', core.length)}
                        ${tabBtn('long', '长期', long.length)}
                        ${tabBtn('short', '短期', shortT.length)}
                        ${tabBtn('archive', '归档', archive.length)}
                    </div>
                    ${fictionalCount > 0 ? `<div class="mem-stat-line"><span>真实 ${realCount}</span><span class="mem-stat-dot"></span><span>虚构 ${fictionalCount}</span></div>` : ''}
                </div>`;

            if (toRender.length === 0) {
                listEl.innerHTML = headerHtml + `<div class="mem-empty">该层级暂无记忆</div>`;
                return;
            }

            // 底部留白
            listEl.innerHTML = headerHtml + toRender.map(renderCard).join('') + `<div style="height:30px;"></div>`;
        }

        // 展开/收起记忆内容
        window.toggleMemExpand = function(memId, btn) {
            const body = document.getElementById('mem-body-' + memId);
            if (!body) return;
            const expanded = body.classList.toggle('expanded');
            if (btn) btn.textContent = expanded ? '收起' : '展开全部';
        };

        // ===== [类人记忆系统] 晋升/降级/置顶/恢复 =====
        function promoteMemory(memId) {
            if (!activeChatId || !window.MemorySystem) return;
            const found = window.MemorySystem.Store.findById(activeChatId, memId);
            if (!found) return;
            const nextTier = found.tier === 'short' ? 'long' : found.tier === 'long' ? 'core' : 'core';
            if (window.MemorySystem.Store.moveToTier(activeChatId, memId, nextTier)) {
                window.MemorySystem.Migration.syncToLegacyStore();
                save();
                const tierLabel = { core: '💎核心', long: '📌长期', short: '💭短期' }[nextTier] || '';
                toast(`已晋升为${tierLabel}记忆`, 'success');
                renderMemorySystem();
            }
        }
        window.promoteMemory = promoteMemory;

        function demoteMemory(memId) {
            if (!activeChatId || !window.MemorySystem) return;
            const found = window.MemorySystem.Store.findById(activeChatId, memId);
            if (!found) return;
            const nextTier = found.tier === 'core' ? 'long' : found.tier === 'long' ? 'short' : 'short';
            if (window.MemorySystem.Store.moveToTier(activeChatId, memId, nextTier)) {
                window.MemorySystem.Migration.syncToLegacyStore();
                save();
                const tierLabel = { core: '💎核心', long: '📌长期', short: '💭短期' }[nextTier] || '';
                toast(`已降级为${tierLabel}记忆`, 'info');
                renderMemorySystem();
            }
        }
        window.demoteMemory = demoteMemory;

        function restoreMemory(memId) {
            if (!activeChatId || !window.MemorySystem) return;
            if (window.MemorySystem.Store.moveToTier(activeChatId, memId, 'short')) {
                window.MemorySystem.Migration.syncToLegacyStore();
                save();
                toast('已从归档恢复', 'success');
                renderMemorySystem();
            }
        }
        window.restoreMemory = restoreMemory;

        function togglePinMemory(memId) {
            if (!activeChatId || !window.MemorySystem) return;
            const found = window.MemorySystem.Store.findById(activeChatId, memId);
            if (!found) return;
            found.memory.pinned = !found.memory.pinned;
            window.MemorySystem.Migration.syncToLegacyStore();
            save();
            toast(found.memory.pinned ? '已置顶（永不衰减）' : '已取消置顶', 'success');
            renderMemorySystem();
        }
        window.togglePinMemory = togglePinMemory;

        // [FIX-虚构记忆-双向同步] 手动切换记忆的真实/虚构状态
        // 必须同时写入新记忆系统(MemorySystem.Store)和旧仓(store.memorySummaries)，
        // 否则 syncToLegacyStore 会把新仓的旧值覆盖回去，造成"切换又变回去"的现象。
        // 同时，切换为真实时剥离 content 开头的 [小剧场]/[虚构] 前缀，避免 AI 读到残留标记。
        function toggleMemoryFictional(memoId) {
            if (!activeChatId) return;
            const _stripFictionalPrefix = (s) => (typeof s === 'string')
                ? s.replace(/^\s*\[(小剧场|虚构)\]\s*/g, '')
                : s;
            let newFictional;
            // 1) 主写：新记忆系统
            if (window.MemorySystem && window.MemorySystem.Store && typeof window.MemorySystem.Store.findById === 'function') {
                const found = window.MemorySystem.Store.findById(activeChatId, memoId);
                if (found && found.memory) {
                    found.memory.fictional = !found.memory.fictional;
                    newFictional = found.memory.fictional;
                    if (!newFictional) {
                        found.memory.content = _stripFictionalPrefix(found.memory.content);
                    }
                    if (window.MemorySystem.Migration && typeof window.MemorySystem.Migration.syncToLegacyStore === 'function') {
                        window.MemorySystem.Migration.syncToLegacyStore();
                    }
                }
            }
            // 2) 兜底：旧仓（若新系统不可用或找不到）
            if (store.memorySummaries && store.memorySummaries[activeChatId]) {
                const memo = store.memorySummaries[activeChatId].find(m => m.id === memoId);
                if (memo) {
                    if (typeof newFictional === 'undefined') {
                        memo.fictional = !memo.fictional;
                        newFictional = memo.fictional;
                    } else {
                        // 同步新系统的结果，防止被 syncToLegacyStore 覆盖成旧值
                        memo.fictional = newFictional;
                    }
                    if (!newFictional) memo.content = _stripFictionalPrefix(memo.content);
                }
            }
            if (typeof newFictional === 'undefined') return; // 两处都没找到
            save();
            renderMemorySystem();
            toast(newFictional ? '已标记为虚构/小剧场' : '已标记为真实记忆', 'success');
        }

        // [FIX-虚构记忆-检测收紧] 检测对话内容是否为虚构/小剧场/角色扮演
        // 旧实现：子串 includes 任一即命中，导致线下长叙事（含"假装/扮演/出戏"等自然用语）
        // 几乎必被误判为虚构。新实现：
        //   1) 精简关键词表，只保留明确的"用户指令"短语，去掉叙事常用词
        //   2) 仅在消息前若干条（通常是用户的开场指令）中匹配指令类关键词（强信号）
        //   3) 全文命中低置信度词时，需要命中 ≥2 种不同短语才算虚构（弱信号+阈值）
        function _detectFictionalContent(chatHistory) {
            if (!chatHistory || chatHistory.length === 0) return false;
            // 强指令类关键词：用户在对话开头明确声明进入虚构/小剧场
            const strongCommandKeywords = [
                '小剧场', '剧场模式', '开始剧场', '开始表演', '开始小剧场',
                '角色扮演', '我们来角色扮演', '来演一个', '来演一下',
                '你来演一个', '你来演一下', '我们来演', '你扮演一个', '我扮演一个',
                '情景模拟', '场景模拟'
            ];
            // 低置信度关键词：单独出现可能是叙事用语，需要组合才算虚构
            const weakKeywords = [
                '虚构', '设定是', '背景设定', '故事设定', '这是假的', '只是虚构'
            ];
            const getText = (m) => (typeof m.content === 'string') ? m.content : '';

            // 1) 强信号：只看前若干条（用户的开场指令最有代表性）
            //    线下/线上场景的 AI 叙事动辄千字，若全文扫描极易误伤，故限定在前 6 条用户消息
            const firstUserMsgs = chatHistory
                .filter(m => m && (m.sender === 'me' || m.sender === 'user'))
                .slice(0, 6)
                .map(getText)
                .join(' ');
            for (const kw of strongCommandKeywords) {
                if (firstUserMsgs.includes(kw)) return true;
            }

            // 2) 弱信号 + 阈值：全文命中 ≥2 种不同弱关键词才算虚构
            const fullText = chatHistory.map(getText).join(' ');
            let weakHits = 0;
            for (const kw of weakKeywords) {
                if (fullText.includes(kw)) weakHits++;
                if (weakHits >= 2) return true;
            }
            return false;
        }

        async function generateMemorySummary(contactId, source = 'online') {
            if (!contactId) return;

            const _memContact = store.contacts.find(c => c.id === contactId) || {};
            let chatHistory = [];
            if (source === 'online') {
                const allChats = store.chats[contactId] || [];
                // [FIX-记忆漏总结] 从上次总结位置开始精确切片，而非简单取最后50条
                // 线上线下交叉进行时，slice(-50)会导致前面的消息被漏掉
                let lastAt = (_memContact.settings && _memContact.settings._lastSummaryAt) || 0;
                // [FIX-自动总结] 防止_lastSummaryAt越界导致空切片（聊天记录被清除但计数器未重置）
                if (lastAt > allChats.length) {
                    lastAt = Math.max(0, allChats.length - 30);
                    if (_memContact.settings) _memContact.settings._lastSummaryAt = lastAt;
                }
                const startIdx = Math.max(0, lastAt - 5); // 往前多取5条作为上下文衔接
                chatHistory = allChats.slice(startIdx, Math.min(allChats.length, startIdx + 60));
            } else {
                const allOffline = store.offlineChats[contactId] || [];
                let lastAt = (_memContact.settings && _memContact.settings._lastOfflineSummaryAt) || 0;
                // [FIX-自动总结] 防止_lastOfflineSummaryAt越界
                if (lastAt > allOffline.length) {
                    lastAt = Math.max(0, allOffline.length - 30);
                    if (_memContact.settings) _memContact.settings._lastOfflineSummaryAt = lastAt;
                }
                const startIdx = Math.max(0, lastAt - 5);
                chatHistory = allOffline.slice(startIdx, Math.min(allOffline.length, startIdx + 60));
            }
             
            if (chatHistory.length < 5) return;

            // ===== [类人记忆系统] 优先走新管道：统一入口+情感分析+分层存储+联想检索 =====
            if (typeof window.MemorySystem === 'object' && window.MemorySystem && window.MemorySystem.Pipeline) {
                try {
                    const channel = source === 'offline' ? 'offline' : 'chat';
                    const newMemo = await window.MemorySystem.Pipeline.ingest(contactId, chatHistory, {
                        channel: channel,
                        scene: source === 'offline' ? '线下见面' : '微信聊天'
                    });
                    if (newMemo) {
                        if (document.getElementById('layer-memory-system') && document.getElementById('layer-memory-system').classList.contains('show')) {
                            renderMemorySystem();
                        }
                        const tierLabel = { core: '💎核心', long: '📌长期', short: '💭短期' }[newMemo.tier] || '';
                        toast(`${tierLabel}记忆已生成`, 'success');
                        return;
                    }
                } catch(memErr) {
                    console.warn('[MemorySystem] Pipeline.ingest failed, fallback to legacy:', memErr);
                }
            }
            // 若新管道不可用或失败，继续使用下方旧逻辑（向后兼容）

            // [FIX-记忆混乱] 自动检测是否为虚构内容
            const isFictional = _detectFictionalContent(chatHistory);

            const contactObj = store.contacts.find(c=>c.id===contactId) || {};
            const contactName = contactObj.name || '对方';
            const _isGroupMemory = !!contactObj.isGroup;
            // 获取用户在该联系人聊天中的人设名称
            const _targetC = store.contacts.find(c => c.id === contactId);
            const userName = (typeof getUserPersonaName === 'function') ? getUserPersonaName(_targetC, store.user.name || '用户') : (store.user.name || '用户');
            // [FIX-群聊记忆视角] 群聊用第三人称+成员实名，私聊保持原逻辑
            const historyText = chatHistory.map(m => {
                const text = typeof m.content === 'string' ? m.content.replace(/\[HEARTBEAT:[^\]]*\]/g, '').trim() : (m.textVal || m.type || '');
                if (_isGroupMemory) {
                    if (m.sender === 'me' || m.sender === 'user') return `${userName}: ${text}`;
                    const _mc = store.contacts.find(c => c.id === m.sender);
                    const _mn = m.goSenderName || m.memberName || (_mc ? _mc.name : m.sender);
                    return `${_mn}: ${text}`;
                }
                let senderName = '我';
                if (source === 'online') {
                    senderName = m.sender === 'me' ? userName : '我';
                } else {
                    senderName = m.sender === 'user' ? userName : '我';
                }
                return `${senderName}: ${text}`;
            }).join('\n');
            // 获取已有记忆，避免重复
            const existingMems = (store.memorySummaries && store.memorySummaries[contactId]) ? store.memorySummaries[contactId].slice(-8).map(m => m.content).join('\n') : '';
            // [FIX-虚构记忆] 检测到虚构内容时，只让AI"明确指出虚构的人名/情节"，
            // 不再要求AI在正文开头硬写"[小剧场]"前缀——由 memo.fictional 字段承担标注，
            // 渲染层和AI读取层都按字段自动补充徽章/前缀，避免双重标注、前缀洗不掉。
            const fictionalHint = isFictional ? `\n⚠️ 注意：这段对话包含小剧场/角色扮演/虚构内容。请在总结中明确指出哪些人名、情节是虚构的扮演，不是真实发生的事。不要在开头加任何标签前缀。` : '';
            // [FIX-群聊记忆视角] 群聊统一第三人称旁观者视角，私聊保持联系人第一人称
            let sysPrompt;
            if (_isGroupMemory) {
                const _memberNames = (contactObj.members || []).map(mid => { const mc = store.contacts.find(c => c.id === mid); return mc ? mc.name : ''; }).filter(Boolean).join('、');
                sysPrompt = `你是一个客观的第三人称记录者。请根据以下群聊"${contactName}"（成员：${userName}、${_memberNames}）的对话记录，以第三人称旁观者视角提取关键信息生成记忆条目。要求：
1. 用每个人的名字称呼他们（如"${userName}"、各成员名），绝对不要用"我"
2. 重点提取（按优先级排列）：
   a) 各成员提到的个人信息（工作、学校、家庭、宠物、住址等）
   b) 成员间的互动和关系变化
   c) 群里达成的重要约定、承诺、计划
   d) 关系变化、情感转折点、争吵/和好
   e) 提到的具体人名、地名、时间点
   f) 各成员分享的具体经历、故事、近况
3. 不要泛泛而谈，要提取具体事实。好的例子："${userName}告诉大家ta养了一只叫小橘的猫"、"小明说下周二要去北京出差"、"群里约好周末一起去西湖玩"
4. 坏的例子（太笼统，禁止使用）："大家聊了很多"、"群里讨论了近况"、"气氛很好"
5. 150-300字，尽可能多地提取具体信息点，用分号分隔多个要点。宁可多记也不要漏掉重要信息
${existingMems ? `6. 已有记忆（避免重复，但可以补充新细节）：\n${existingMems}` : ''}${fictionalHint}`;
            } else {
                sysPrompt = `你是${contactName}，请以你（${contactName}）的第一人称视角，根据以下对话记录提取关键信息生成记忆条目。要求：
1. 用"我"称呼自己（${contactName}），用"${userName}"称呼对方
2. 重点提取（按优先级排列）：
   a) ${userName}提到的个人信息（名字、年龄、工作、学校、家庭、宠物、住址等）
   b) ${userName}的偏好/习惯/喜好/讨厌的东西
   c) 你们之间的重要约定、承诺、计划
   d) 关系变化、情感转折点、吵架/和好
   e) 提到的具体人名、地名、时间点
   f) ${userName}分享的具体经历、故事、近况
   g) 你对${userName}做出的承诺或${userName}对你的要求
3. 不要泛泛而谈，要提取具体事实。好的例子："${userName}告诉我ta养了一只叫小橘的猫"、"我跟${userName}说我下周二要去北京出差"、"我和${userName}约好周末去西湖玩"、"${userName}说ta最讨厌吃香菜"、"${userName}在一家互联网公司做产品经理"
4. 坏的例子（太笼统，禁止使用）："我们聊了很多"、"${userName}分享了近况"、"我们关系更好了"
5. 150-300字，尽可能多地提取具体信息点，用分号分隔多个要点。宁可多记也不要漏掉重要信息
${existingMems ? `6. 已有记忆（避免重复，但可以补充新细节）：\n${existingMems}` : ''}${fictionalHint}`;
            }
            
            try {
                // [FIX-记忆续写v1] 重构消息结构：将对话记录放入system消息，user消息改为明确的总结指令
                // 之前：system="你是XX" + user=聊天记录 → 模型误以为要续写对话
                // 现在：system="你是XX" + 对话记录 → user="请生成记忆总结" → 模型明确知道要输出总结
                const messagesForSummary = [
                    { role: 'system', content: sysPrompt + '\n\n---以下是需要总结的对话记录---\n' + historyText },
                    { role: 'user', content: '请根据以上对话记录，严格按照要求生成记忆总结条目。只输出总结内容，不要续写对话，不要模拟任何角色说话，不要生成新的对话回复。' }
                ];
                // [FIX-副API回退] 记忆总结使用副API失败时，自动回退到主API重试
                let data;
                try {
                    data = await API.chatCompletion(messagesForSummary, { scene: 'memory' });
                } catch (secErr) {
                    console.warn('[记忆总结] 副API失败，尝试回退到主API:', secErr.message || secErr);
                    // 不传scene参数，强制使用主API
                    data = await API.chatCompletion(messagesForSummary, { scene: null });
                }
                const summaryText = data.choices[0].message.content;
                
                if (!store.memorySummaries) store.memorySummaries = {};
                if (!store.memorySummaries[contactId]) store.memorySummaries[contactId] = [];

                // [FIX-时间戳v5] 从chatHistory中提取对话实际发生时间，而非使用总结时间
                const _chatEventTime = chatHistory.reduce((earliest, m) => {
                    const t = m.time || m.timestamp || 0;
                    return (t > 0 && (earliest === 0 || t < earliest)) ? t : earliest;
                }, 0) || Date.now();
                const _autoMemo = {
                    id: 'memo' + Date.now(),
                    date: _chatEventTime,
                    content: (summaryText || '').replace(/^\s*\[(小剧场|虚构)\]\s*/g, ''),
                    source: source,
                    fictional: isFictional
                };
                store.memorySummaries[contactId].push(_autoMemo);
                _syncMemoToNewSystem(contactId, _autoMemo);
                save();
                toast(isFictional ? "虚构内容总结已生成（已标记为小剧场）" : "对话总结已生成并保存", "success");
                
                // [FIX-记忆弹窗不可见] 生成后刷新记忆面板，并自动滚动到新卡片使其可见
                if (document.getElementById('layer-memory-system').classList.contains('show')) {
                    renderMemorySystem();
                    // 滚动到最新的记忆卡片
                    setTimeout(function() {
                        var memList = document.getElementById('mem-list');
                        if (memList) {
                            var cards = memList.querySelectorAll('.mem-card');
                            if (cards.length > 0) {
                                var lastCard = cards[cards.length - 1];
                                lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // 高亮动画提示新生成的卡片
                                lastCard.style.transition = 'box-shadow 0.3s, transform 0.3s';
                                lastCard.style.boxShadow = '0 0 12px rgba(7,193,96,0.5)';
                                lastCard.style.transform = 'scale(1.02)';
                                setTimeout(function() {
                                    lastCard.style.boxShadow = '';
                                    lastCard.style.transform = '';
                                }, 2000);
                            }
                        }
                    }, 300);
                }

            } catch (e) {
                console.error("Failed to generate memory summary:", e);
                toast("总结生成失败", "error");
            }
        }
        
        function addManualMemory(content) {
            if (!activeChatId || !content) return;

            // ===== [类人记忆系统] 优先通过新管道添加，自动分析情感+关键词+层级 =====
            if (typeof window.MemorySystem === 'object' && window.MemorySystem && window.MemorySystem.Pipeline) {
                try {
                    const memo = window.MemorySystem.Pipeline.addManual(activeChatId, content);
                    if (memo) {
                        const tierLabel = { core: '💎核心', long: '📌长期', short: '💭短期' }[memo.tier] || '';
                        toast(`${tierLabel}记忆已添加`, 'success');
                        renderMemorySystem();
                        return;
                    }
                } catch(e) {
                    console.warn('[MemorySystem] addManual failed, fallback:', e);
                }
            }

            // 兜底（旧逻辑）
            if (!store.memorySummaries) store.memorySummaries = {};
            if (!store.memorySummaries[activeChatId]) store.memorySummaries[activeChatId] = [];

            store.memorySummaries[activeChatId].push({
                id: 'memo' + Date.now(),
                date: Date.now(),
                content: content,
                source: 'manual',
                fictional: false
            });
            save();
            toast("记忆已添加", "success");
            renderMemorySystem();
        }

        function editMemory(memoId) {
            // 新系统优先
            if (window.MemorySystem && window.MemorySystem.Store) {
                const found = window.MemorySystem.Store.findById(activeChatId, memoId);
                if (found) {
                    editingMemoryId = memoId;
                    const modal = document.getElementById('modal-edit-memory');
                    document.getElementById('edit-memory-content').value = found.memory.content;
                    modal.style.display = 'flex';
                    return;
                }
            }
            // 兜底
            const memories = store.memorySummaries[activeChatId];
            if (!memories) return;
            const memory = memories.find(m => m.id === memoId);
            if (!memory) return;
            editingMemoryId = memoId;
            const modal = document.getElementById('modal-edit-memory');
            document.getElementById('edit-memory-content').value = memory.content;
            modal.style.display = 'flex';
        }
        
        function saveEditedMemory() {
            if (!editingMemoryId) return;
            const newContent = document.getElementById('edit-memory-content').value.trim();
            if (!newContent) return toast("内容不能为空", "error");

            // 新系统优先
            if (window.MemorySystem && window.MemorySystem.Store) {
                const found = window.MemorySystem.Store.findById(activeChatId, editingMemoryId);
                if (found) {
                    found.memory.content = newContent;
                    // 重新提取关键词和情感
                    try {
                        found.memory.keywords = window.MemorySystem.Keywords.extract(newContent, 6);
                        const emo = window.MemorySystem.Emotion.analyze(newContent);
                        found.memory.emotionScore = emo.score;
                        found.memory.emotionType = emo.type;
                    } catch(_) {}
                    window.MemorySystem.Migration.syncToLegacyStore();
                    save();
                    renderMemorySystem();
                    document.getElementById('modal-edit-memory').style.display = 'none';
                    editingMemoryId = null;
                    toast("记忆已更新", "success");
                    return;
                }
            }
            // 兜底
            const memories = store.memorySummaries[activeChatId];
            if (!memories) return;
            const memory = memories.find(m => m.id === editingMemoryId);
            if (!memory) return;
            memory.content = newContent;
            save();
            renderMemorySystem();
            document.getElementById('modal-edit-memory').style.display = 'none';
            editingMemoryId = null;
            toast("记忆已更新", "success");
        }

        function deleteMemory(memoId) {
            showConfirm("删除记忆", "确定要删除这条记忆吗？", () => {
                // 新系统优先
                if (window.MemorySystem && window.MemorySystem.Store) {
                    if (window.MemorySystem.Store.deleteMemory(activeChatId, memoId)) {
                        window.MemorySystem.Migration.syncToLegacyStore();
                        save();
                        renderMemorySystem();
                        toast("删除成功");
                        return;
                    }
                }
                // 兜底
                let memories = store.memorySummaries[activeChatId];
                if (memories) {
                    store.memorySummaries[activeChatId] = memories.filter(m => m.id !== memoId);
                    save();
                    renderMemorySystem();
                    toast("删除成功");
                }
            });
        }

        // --- 记忆来源选择 ---
        let _memorySummarizeMode = 'manual'; // 'manual' or 'all'
        let _memorySummarizeSource = 'online'; // 'online' or 'offline'

        function showMemorySummarizeChoice(mode) {
            if (!activeChatId) return toast("请先打开一个聊天");
            _memorySummarizeMode = mode;
            const titleEl = document.getElementById('memory-source-title');
            if (titleEl) titleEl.textContent = mode === 'all' ? '总结全部记忆 - 选择来源' : '手动总结 - 选择来源';
            document.getElementById('modal-memory-source').style.display = 'flex';
        }

        function confirmMemorySource(source) {
            _memorySummarizeSource = source;
            document.getElementById('modal-memory-source').style.display = 'none';
            if (_memorySummarizeMode === 'all') {
                doSummarizeAllMemory(source);
            } else {
                openManualSummaryPicker(source);
            }
        }

        function openManualSummaryPicker(source) {
            if (!activeChatId) return toast("请先打开一个聊天");
            if (source) _memorySummarizeSource = source;
            document.getElementById('summary-round-count').value = 30;
            document.getElementById('modal-manual-summary').style.display = 'flex';
        }

        async function doManualSummary() {
            const rounds = parseInt(document.getElementById('summary-round-count').value) || 30;
            document.getElementById('modal-manual-summary').style.display = 'none';
            if (!activeChatId) return;

            // [FIX-串记忆v3] 立即快照 activeChatId，防止 await 过程中用户切换联系人
            // 导致总结写入错误的联系人名下（"A 的记忆里出现 B 的通话"最常见成因）
            const _targetCid = activeChatId;

            const source = _memorySummarizeSource || 'online';
            const sourceLabels = { online: '线上', offline: '线下', call: '通话' };
            toast(`正在从${sourceLabels[source] || '线上'}记录生成总结...`, "info");

            let chatHistory;
            if (source === 'call') {
                // [FIX-通话记忆] 从已保存的通话记忆中提取原始通话内容进行AI总结
                const allMems = (store.memorySummaries && store.memorySummaries[_targetCid]) || [];
                const callMems = allMems.filter(m => m.source === 'voice_call' || m.source === 'video_call');
                const recentCallMems = callMems.slice(-rounds);
                if (recentCallMems.length < 1) return toast("没有找到通话记录，无法总结", "error");
                // 将通话记忆转换为chatHistory格式以复用后续逻辑
                chatHistory = recentCallMems.map(m => ({
                    sender: 'call_record',
                    content: m.content || '',
                    time: m.date
                }));
            } else if (source === 'offline') {
                chatHistory = ((store.offlineChats && store.offlineChats[_targetCid]) || []).slice(-rounds);
            } else {
                chatHistory = (store.chats[_targetCid] || []).slice(-rounds);
            }
            if (chatHistory.length < 1) return toast(`${sourceLabels[source] || '线上'}记录太少，无法总结`, "error");

            // [FIX-记忆混乱] 检测虚构内容
            const isFictional = _detectFictionalContent(chatHistory);

            const contactObj = store.contacts.find(c => c.id ===_targetCid) || {};
            const contactName = contactObj.name || '对方';
            const _isGroupManual = !!contactObj.isGroup;
            const _targetC = store.contacts.find(c => c.id === _targetCid);
            const userName = (typeof getUserPersonaName === 'function') ? getUserPersonaName(_targetC, store.user.name || '用户') : (store.user.name || '用户');
            // [FIX-群聊记忆视角] 群聊用第三人称+成员实名，私聊保持原逻辑
            const historyText = chatHistory.map(m => {
                if (source === 'call') {
                    // 通话记录已经是完整的记忆文本，直接使用
                    return m.content || '';
                }
                if (_isGroupManual) {
                    if (m.sender === 'me' || m.sender === 'user') return `${userName}: ${m.content || ''}`;
                    const _mc = store.contacts.find(c => c.id === m.sender);
                    const _mn = m.goSenderName || m.memberName || (_mc ? _mc.name : m.sender);
                    return `${_mn}: ${m.content || ''}`;
                }
                let senderName;
                if (source === 'online') {
                    senderName = m.sender === 'me' ? userName : '我';
                } else {
                    senderName = m.sender === 'user' ? userName : '我';
                }
                return `${senderName}: ${m.content || ''}`;
            }).join('\n');

            // [FIX-串记忆v3] 使用快照 _targetCid，避免跨 await 后读到错联系人的已有记忆
            const existingMems = (store.memorySummaries && store.memorySummaries[_targetCid]) ? store.memorySummaries[_targetCid].filter(m => m.source !== 'voice_call' && m.source !== 'video_call').slice(-5).map(m => m.content).join('\n') : '';
            // [FIX-虚构记忆] 由 fictional 字段承担标注，不再让AI在正文加前缀
            const fictionalHint = isFictional ? `\n⚠️ 注意：这段对话包含小剧场/角色扮演/虚构内容。请在总结中明确指出哪些人名、情节是虚构的扮演，不是真实发生的事。不要在开头加任何标签前缀。` : '';
            const sourceDesc = source === 'call' ? '语音/视频通话' : (source === 'online' ? '线上聊天' : '线下见面');
            // [FIX-群聊记忆视角] 群聊统一第三人称旁观者视角
            let sysPrompt;
            if (_isGroupManual) {
                const _memberNames = (contactObj.members || []).map(mid => { const mc = store.contacts.find(c => c.id === mid); return mc ? mc.name : ''; }).filter(Boolean).join('、');
                sysPrompt = `你是一个客观的第三人称记录者。请根据以下群聊"${contactName}"（成员：${userName}、${_memberNames}）的${sourceDesc}记录，以第三人称旁观者视角提取关键信息生成记忆条目。要求：
1. 用每个人的名字称呼他们，绝对不要用"我"
2. 重点提取：重要事件、各成员的偏好/习惯、成员间关系变化、约定/承诺、提到的人名地名、情感转折点
3. 不要泛泛而谈，要提取具体事实。好的例子："${userName}告诉大家ta养了一只叫小橘的猫"、"小明说下周二要去北京出差"
4. 80-150字，可以用分号分隔多个要点
${existingMems ? `5. 已有记忆（避免重复）：\n${existingMems}` : ''}${fictionalHint}`;
            } else {
                sysPrompt = `你是${contactName}，请以你（${contactName}）的第一人称视角，根据以下${sourceDesc}的对话记录提取关键信息生成记忆条目。要求：
1. 用"我"称呼自己（${contactName}），用"${userName}"称呼对方
2. 重点提取：重要事件、${userName}的偏好/习惯、关系变化、约定/承诺、提到的人名地名、情感转折点
3. 不要泛泛而谈，要提取具体事实。好的例子："${userName}告诉我ta养了一只叫小橘的猫"、"我跟${userName}说我下周二要去北京出差"
4. 80-150字，可以用分号分隔多个要点
${existingMems ? `5. 已有记忆（避免重复）：\n${existingMems}` : ''}${fictionalHint}`;
            }

            try {
                const data = await API.chatCompletion([
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: historyText }
                ]);
                const summaryText = data.choices[0].message.content;

                if (!store.memorySummaries) store.memorySummaries = {};
                if (!store.memorySummaries[_targetCid]) store.memorySummaries[_targetCid] = [];

                // [FIX-时间戳v5] 从chatHistory中提取对话实际发生时间
                const _manualEventTime = chatHistory.reduce((earliest, m) => {
                    const t = m.time || m.timestamp || 0;
                    return (t > 0 && (earliest === 0 || t < earliest)) ? t : earliest;
                }, 0) || Date.now();
                const _manualMemo = {
                    id: 'memo' + Date.now(),
                    date: _manualEventTime,
                    content: (summaryText || '').replace(/^\s*\[(小剧场|虚构)\]\s*/g, ''),
                    source: source === 'call' ? 'call_summary' : source,
                    fictional: isFictional
                };
                // [FIX-串记忆v3] 全程使用快照的 _targetCid，避免写到切换后的联系人
                store.memorySummaries[_targetCid].push(_manualMemo);
                _syncMemoToNewSystem(_targetCid, _manualMemo);
                save();
                toast(isFictional ? "虚构内容总结已生成（已标记为小剧场）" : "总结已生成", "success");
                if (document.getElementById('layer-memory-system').classList.contains('show')) {
                    renderMemorySystem();
                }
            } catch (e) {
                console.error("Manual summary failed:", e);
                toast("总结生成失败", "error");
            }
        }

        // --- 总结全部记忆 ---
        async function doSummarizeAllMemory(source) {
            if (!activeChatId) return toast("请先打开一个聊天");
            // [FIX-串记忆v3] 立即快照 activeChatId，后续异步分批循环全部用快照值
            const _targetCid = activeChatId;

            source = source || _memorySummarizeSource || 'online';
            let allChats;
            if (source === 'call') {
                // [FIX-通话记忆] 从记忆中提取通话记录
                const allMems = (store.memorySummaries && store.memorySummaries[_targetCid]) || [];
                const callMems = allMems.filter(m => m.source === 'voice_call' || m.source === 'video_call');
                if (callMems.length < 1) return toast("没有找到通话记录，无法总结", "error");
                allChats = callMems.map(m => ({
                    sender: 'call_record',
                    content: m.content || '',
                    time: m.date
                }));
            } else if (source === 'offline') {
                allChats = (store.offlineChats && store.offlineChats[_targetCid]) || [];
            } else {
                allChats = store.chats[_targetCid] || [];
            }
            const sourceLabelMap = { online: '线上', offline: '线下', call: '通话' };
            const sourceLabel = sourceLabelMap[source] || '线上';
            if (allChats.length < (source === 'call' ? 1 : 5)) return toast(`${sourceLabel}记录太少，无法总结`, "error");

            showConfirm("总结全部记忆", `将对全部 ${allChats.length} 条${sourceLabel}记录进行分批总结，可能需要较长时间和多次API调用。是否继续？`, async () => {
                const contactObj = store.contacts.find(c => c.id === _targetCid) || {};
                const contactName = contactObj.name || '对方';
                const _isGroupBatch = !!contactObj.isGroup;
                const _targetC = store.contacts.find(c => c.id === _targetCid);
                const userName = (typeof getUserPersonaName === 'function') ? getUserPersonaName(_targetC, store.user.name || '用户') : (store.user.name || '用户');

                const batchSize = 50; // 每批处理50条
                const totalBatches = Math.ceil(allChats.length / batchSize);
                let successCount = 0;

                toast(`开始总结全部${sourceLabel}记忆，共 ${totalBatches} 批...`, "info");

                for (let b = 0; b < totalBatches; b++) {
                    const start = b * batchSize;
                    const end = Math.min(start + batchSize, allChats.length);
                    const batchChats = allChats.slice(start, end);

                    // [FIX-记忆混乱] 每批次独立检测虚构内容
                    const batchIsFictional = _detectFictionalContent(batchChats);

                    // [FIX-群聊记忆视角] 群聊用第三人称+成员实名，私聊保持原逻辑
                    const historyText = batchChats.map(m => {
                        if (source === 'call') {
                            return m.content || '';
                        }
                        if (_isGroupBatch) {
                            if (m.sender === 'me' || m.sender === 'user') return `${userName}: ${m.content || ''}`;
                            const _mc = store.contacts.find(c => c.id === m.sender);
                            const _mn = m.goSenderName || m.memberName || (_mc ? _mc.name : m.sender);
                            return `${_mn}: ${m.content || ''}`;
                        }
                        let senderName;
                        if (source === 'online') {
                            senderName = m.sender === 'me' ? userName : '我';
                        } else {
                            senderName = m.sender === 'user' ? userName : '我';
                        }
                        return `${senderName}: ${m.content || ''}`;
                    }).join('\n');

                    const existingMems = (store.memorySummaries && store.memorySummaries[_targetCid]) ? store.memorySummaries[_targetCid].filter(m => m.source !== 'voice_call' && m.source !== 'video_call').slice(-5).map(m => m.content).join('\n') : '';
                    // [FIX-虚构记忆] 由 fictional 字段承担标注，不再让AI在正文加前缀
                    const batchFictionalHint = batchIsFictional ? `\n⚠️ 注意：这批对话包含小剧场/角色扮演/虚构内容。请在总结中明确指出哪些人名、情节是虚构的扮演，不是真实发生的事。不要在开头加任何标签前缀。` : '';
                    const sourceDescMap = { online: '线上聊天', offline: '线下见面', call: '语音/视频通话' };
                    // [FIX-群聊记忆视角] 群聊统一第三人称旁观者视角
                    let sysPrompt;
                    if (_isGroupBatch) {
                        const _memberNames = (contactObj.members || []).map(mid => { const mc = store.contacts.find(c => c.id === mid); return mc ? mc.name : ''; }).filter(Boolean).join('、');
                        sysPrompt = `你是一个客观的第三人称记录者。请根据以下群聊"${contactName}"（成员：${userName}、${_memberNames}）的${sourceDescMap[source] || sourceLabel}记录，以第三人称旁观者视角提取关键信息生成记忆条目。要求：
1. 用每个人的名字称呼他们，绝对不要用"我"
2. 重点提取：重要事件、各成员的偏好/习惯、成员间关系变化、约定/承诺、提到的人名地名、情感转折点
3. 不要泛泛而谈，要提取具体事实。好的例子："${userName}告诉大家ta养了一只叫小橘的猫"、"小明说下周二要去北京出差"
4. 80-200字，可以用分号分隔多个要点
5. 这是第${b + 1}/${totalBatches}批对话（第${start + 1}-${end}条）
${existingMems ? `6. 已有记忆（避免重复）：\n${existingMems}` : ''}${batchFictionalHint}`;
                    } else {
                        sysPrompt = `你是${contactName}，请以你（${contactName}）的第一人称视角，根据以下${sourceDescMap[source] || sourceLabel}的对话记录提取关键信息生成记忆条目。要求：
1. 用"我"称呼自己（${contactName}），用"${userName}"称呼对方
2. 重点提取：重要事件、${userName}的偏好/习惯、关系变化、约定/承诺、提到的人名地名、情感转折点
3. 不要泛泛而谈，要提取具体事实。好的例子："${userName}告诉我ta养了一只叫小橘的猫"、"我跟${userName}说我下周二要去北京出差"
4. 80-200字，可以用分号分隔多个要点
5. 这是第${b + 1}/${totalBatches}批对话（第${start + 1}-${end}条）
${existingMems ? `6. 已有记忆（避免重复）：\n${existingMems}` : ''}${batchFictionalHint}`;
                    }

                    try {
                        const data = await API.chatCompletion([
                            { role: 'system', content: sysPrompt },
                            { role: 'user', content: historyText }
                        ]);
                        const summaryText = data.choices[0].message.content;

                        if (!store.memorySummaries) store.memorySummaries = {};
                        if (!store.memorySummaries[_targetCid]) store.memorySummaries[_targetCid] = [];

                        // [FIX-时间戳v5] 从batchChats中提取对话实际发生时间
                        const _batchEventTime = batchChats.reduce((earliest, m) => {
                            const t = m.time || m.timestamp || 0;
                            return (t > 0 && (earliest === 0 || t < earliest)) ? t : earliest;
                        }, 0) || Date.now();
                        const _batchMemo = {
                            id: 'memo' + Date.now() + '_' + b,
                            date: _batchEventTime,
                            content: `[批次${b + 1}/${totalBatches}]` + (summaryText || '').replace(/^\s*\[(小剧场|虚构)\]\s*/g, ''),
                            source: source === 'call' ? 'call_summary' : source,
                            fictional: batchIsFictional
                        };
                        // [FIX-串记忆v3] 全程使用快照的 _targetCid，防止跨 await 漂移
                        store.memorySummaries[_targetCid].push(_batchMemo);
                        _syncMemoToNewSystem(_targetCid, _batchMemo);
                        save();
                        successCount++;
                        toast(`总结进度: ${b + 1}/${totalBatches} 批完成${batchIsFictional ? '(含虚构)' : ''}`, "info");
                    } catch (e) {
                        console.error(`Batch ${b + 1} summary failed:`, e);
                        toast(`第${b + 1}批总结失败: ${e.message}`, "error");
                    }

                    // 批次间延迟，避免API限流
                    if (b < totalBatches - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }
                }

                if (successCount > 0) {
                    // [FIX-自动总结] 总结全部完成后，更新_lastSummaryAt到当前聊天长度
                    // 防止后续自动总结因_lastSummaryAt残留旧值而永远不触发或重复总结
                    const _sumContact = store.contacts.find(c => c.id === _targetCid);
                    if (_sumContact && _sumContact.settings) {
                        if (source === 'offline') {
                            _sumContact.settings._lastOfflineSummaryAt = allChats.length;
                        } else if (source === 'online') {
                            _sumContact.settings._lastSummaryAt = (store.chats[_targetCid] || []).length;
                        }
                    }
                    save();
                    toast(`全部记忆总结完成！共生成 ${successCount} 条总结`, "success");
                    if (document.getElementById('layer-memory-system').classList.contains('show')) {
                        renderMemorySystem();
                    }
                } else {
                    toast("总结全部失败", "error");
                }
            });
        }

        // --- NEW FEATURES LOGIC ---

        // --- CSS & Font Customization ---
        // [FIX-CSS兼容] 禁用/启用主题CSS，避免硬编码主题样式覆盖用户自定义CSS
        var _allThemeLinkIds = ['default-theme-link', 'cute-theme-link', 'korean-theme-link', 'mono-theme-link'];
        function _disableDefaultTheme() {
            // [FIX-主题不被重置] 只禁用 default-theme.css，保持 cute/korean/mono 主题 CSS 可用
            // 这些主题通过 body.theme-xxx 选择器自动控制生效范围，不会干扰非该主题场景
            // 之前的实现会禁用全部4个主题CSS，导致应用自定义CSS时当前全局主题被意外重置
            var defLink = document.getElementById('default-theme-link');
            if (defLink) {
                defLink.disabled = true;
                defLink.setAttribute('media', 'not all');
            }
            // 确保 cute/korean/mono 主题 link 标签保持启用
            ['cute-theme-link', 'korean-theme-link', 'mono-theme-link'].forEach(function(id) {
                var link = document.getElementById(id);
                if (link) {
                    link.disabled = false;
                    link.removeAttribute('media');
                }
            });
        }
        function _enableDefaultTheme() {
            // 只恢复default-theme，其他主题由switchGlobalTheme控制
            var link = document.getElementById('default-theme-link');
            if (link) {
                link.disabled = false;
                link.removeAttribute('media');
            }
            // [FIX-主题恢复] 同时恢复当前激活的主题CSS
            _enableCurrentThemeCSS();
        }
        // [FIX-主题恢复] 恢复当前激活主题的CSS link标签
        function _enableCurrentThemeCSS() {
            var themeMap = { 'theme-cute': 'cute-theme-link', 'theme-korean': 'korean-theme-link', 'theme-mono': 'mono-theme-link' };
            for (var cls in themeMap) {
                var link = document.getElementById(themeMap[cls]);
                if (link) {
                    if (document.body.classList.contains(cls)) {
                        link.disabled = false;
                        link.removeAttribute('media');
                    } else {
                        // 非当前主题保持可用（它们通过body.theme-xxx选择器自动不生效）
                        link.disabled = false;
                        link.removeAttribute('media');
                    }
                }
            }
        }

        // [FIX-CSS覆盖] 辅助函数：确保自定义CSS的<style>标签始终在<head>最末尾
        // 这样在CSS优先级相同时，用户自定义CSS一定能覆盖前面的样式
        function _moveCustomStylesToEnd() {
            ['custom-style-bubble', 'custom-style-global', 'custom-style-offline', 'custom-font-style'].forEach(id => {
                const el = document.getElementById(id);
                if (el && el.innerHTML.trim()) {
                    document.head.appendChild(el); // 移到末尾
                }
            });
            // [FIX-底部导航栏保护] 在所有自定义CSS之后追加保护性样式
            // 允许修改颜色/背景/圆角/边框等装饰性属性，但确保不会被隐藏
            _ensureBottomNavProtection();
            // [FIX-弹窗保护] 确保弹窗不被自定义美化CSS影响（字体/颜色/背景等看不清问题）
            _ensureModalProtection();
            // [FIX-壁纸&选中保护] 确保壁纸和气泡选中阴影不被自定义CSS覆盖
            _ensureWallpaperAndSelectionProtection();
            // [FIX-SVG贴图兼容] CSS变更后检测按钮贴图，自动隐藏/恢复SVG
            setTimeout(_detectBtnCustomIcons, 50);
        }

        // [FIX-底部导航栏保护] 确保底部导航栏不会被自定义CSS隐藏
        // 只保护可见性相关属性，允许自定义CSS修改装饰性样式（颜色、背景、图标等）
        function _ensureBottomNavProtection() {
            let protectEl = document.getElementById('protect-style-bottom-nav');
            if (!protectEl) {
                protectEl = document.createElement('style');
                protectEl.id = 'protect-style-bottom-nav';
            }
            protectEl.innerHTML = `
                /* [保护] 防止自定义CSS隐藏底部导航栏 - 只保护可见性，不影响装饰 */
                /* [FIX-精灵app底部胶囊栏] 当layer打开时不强制显示，避免覆盖layer-open隐藏逻辑 */
                body:not(.layer-open) .bottom-nav:not(.keyboard-open) {
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    min-height: 60px !important;
                    pointer-events: auto !important;
                    clip: auto !important;
                    clip-path: none !important;
                    overflow: visible !important;
                    z-index: 1000 !important;
                    position: fixed !important;
                    transform: translateX(-50%) !important;
                }
                body:not(.layer-open) .bottom-nav .bottom-nav-item {
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
                .bottom-nav .dock-icon {
                    display: flex !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
            `;
            // 始终追加到<head>最末尾，确保优先级最高
            document.head.appendChild(protectEl);
            // [FIX-聊天输入栏保护] 同时保护聊天输入栏布局，防止自定义CSS导致按钮错位重合
            _ensureChatInputProtection();
        }

        // [FIX-弹窗保护] 确保弹窗(.modal-mask/.modal-box)不被美化老师的自定义CSS影响
        // 用户常见问题：自定义CSS里用了宽泛选择器（* / body / div / font-family / color 等）
        // 会连带把弹窗文字、背景、边框、字体覆盖掉，导致弹窗看不清或样式错乱。
        // 本函数注入一段高优先级保护CSS，把弹窗相关元素的关键视觉属性复位到默认/主题样式。
        function _ensureModalProtection() {
            let protectEl = document.getElementById('protect-style-modal');
            if (!protectEl) {
                protectEl = document.createElement('style');
                protectEl.id = 'protect-style-modal';
            }
            // 使用 html body 提升选择器特异度，配合 !important 确保能覆盖自定义CSS
            // 注意：不强行写死颜色/背景，而是用 revert-layer / initial / 继承默认，
            // 让 styles.css 和 cute-theme.css 等主题样式能正常生效，只挡住"外来"自定义CSS
            protectEl.innerHTML = `
                /* [弹窗保护] 防止自定义美化CSS影响弹窗显示 */
                /* 1. 弹窗容器本身：字体、文字颜色恢复默认 */
                html body .modal-mask,
                html body .modal-mask .modal-box {
                    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif !important;
                }
                /* 2. 弹窗内所有文字元素：颜色、字体、文字阴影、字重复位 */
                html body .modal-mask .modal-box,
                html body .modal-mask .modal-box *:not(i):not(.fa):not([class*="fa-"]) {
                    font-family: inherit !important;
                    text-shadow: none !important;
                    letter-spacing: normal !important;
                }
                /* 3. 弹窗标题：保证可读 */
                html body .modal-mask .modal-box h1,
                html body .modal-mask .modal-box h2,
                html body .modal-mask .modal-box h3,
                html body .modal-mask .modal-box h4 {
                    color: #1a1a1a !important;
                    text-shadow: none !important;
                    -webkit-text-fill-color: #1a1a1a !important;
                }
                /* 4. 弹窗正文、标签、提示文字：默认深色 */
                html body .modal-mask .modal-box p,
                html body .modal-mask .modal-box label,
                html body .modal-mask .modal-box span:not([class*="icon"]):not([class*="emoji"]),
                html body .modal-mask .modal-box div:not([class*="icon"]):not([class*="emoji"]) {
                    color: inherit !important;
                    -webkit-text-fill-color: inherit !important;
                }
                /* 5. 弹窗输入框/下拉/文本域：保证可读 */
                html body .modal-mask .modal-box input,
                html body .modal-mask .modal-box textarea,
                html body .modal-mask .modal-box select {
                    color: #1a1a1a !important;
                    -webkit-text-fill-color: #1a1a1a !important;
                    background-color: #fff !important;
                    background-image: none !important;
                    font-family: inherit !important;
                    text-shadow: none !important;
                }
                /* 6. 弹窗按钮：字体与文字颜色由默认样式接管 */
                html body .modal-mask .modal-box button {
                    font-family: inherit !important;
                    text-shadow: none !important;
                }
                /* 7. 弹窗遮罩本身不被自定义CSS加奇怪的滤镜/变换 */
                html body .modal-mask {
                    filter: none !important;
                    backdrop-filter: blur(2px) !important;
                    -webkit-backdrop-filter: blur(2px) !important;
                    transform: none !important;
                }
                /* 8. 弹窗气泡不被聊天气泡的自定义样式误伤（弹窗内可能出现.bubble class） */
                html body .modal-mask .modal-box .bubble {
                    all: revert !important;
                }
                /* 9. cute/korean 等主题有自己的弹窗美化，要让它们仍然生效，
                      所以不强制写 background / border / border-radius / box-shadow，
                      只挡住那些会让弹窗"看不清"的关键文字视觉属性。 */
            `;
            // 始终追加到<head>最末尾，确保优先级高于自定义CSS
            document.head.appendChild(protectEl);
        }

        // [FIX-壁纸&选中保护] 确保用户设置的壁纸（主界面+聊天背景）和气泡长按选中阴影
        // 不会被自定义美化CSS覆盖。无论美化老师的CSS写了什么，这些关键UI状态都不受影响。
        function _ensureWallpaperAndSelectionProtection() {
            let protectEl = document.getElementById('protect-style-wallpaper-selection');
            if (!protectEl) {
                protectEl = document.createElement('style');
                protectEl.id = 'protect-style-wallpaper-selection';
            }
            protectEl.innerHTML = `
                /* ===== [保护] 主界面壁纸不被覆盖 ===== */
                /* [FIX-背景不生效] 扩大保护范围：同时匹配data-bg-url和inline style两种情况
                   防止自定义美化CSS的background简写覆盖掉用户设置的背景图 */
                html body #layer-desktop[data-bg-url],
                html body #layer-desktop[style*="background-image"] {
                    background-size: cover !important;
                    background-position: center !important;
                    background-repeat: no-repeat !important;
                    background-color: transparent !important;
                }
                /* 防止自定义CSS用 background 简写覆盖（简写会重置所有子属性） */
                /* 注意：不能在这里写background-image因为值是动态的，靠inline !important保护 */
                /* ===== [保护] 聊天背景不被覆盖 ===== */
                /* 聊天历史区域：用户为每个联系人设置的独立背景，inline style已用!important */
                html body #layer-chat .chat-history[style*="background-image"] {
                    background-size: cover !important;
                    background-position: center !important;
                    background-repeat: no-repeat !important;
                }
                /* ===== [保护] 全局壁纸层不被覆盖 ===== */
                html body .gwp-bg-layer {
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    pointer-events: none !important;
                }
                /* ===== [保护] 气泡选中阴影遮罩不被覆盖 ===== */
                /* 长按气泡删除时的半透明黑色遮罩层 + 勾选图标 */
                html body #layer-chat .bubble.selected::after,
                html body #layer-chat .bubble-transfer.selected::after,
                html body #layer-chat .bubble-redpacket.selected::after,
                html body #layer-chat .bubble-location.selected::after,
                html body #layer-chat .bubble-copay.selected::after,
                html body #layer-chat .bubble-contact-card.selected::after,
                html body #layer-chat .bubble-gift-delivery.selected::after,
                html body #layer-chat .bubble-fav-product.selected::after,
                html body #layer-chat .bubble-literature.selected::after,
                html body #layer-chat .bubble-literature-frag.selected::after,
                html body #layer-chat .bubble-merge-forward.selected::after,
                html body #layer-chat .go-offline-bubble.selected::after,
                html body #layer-chat .bubble-shared-post.selected::after {
                    content: '' !important;
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    background: rgba(0, 0, 0, 0.4) !important;
                    border-radius: inherit !important;
                    z-index: 10 !important;
                    pointer-events: none !important;
                    border: none !important;
                    width: auto !important;
                    height: auto !important;
                    transform: none !important;
                    filter: none !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    display: block !important;
                }
                html body #layer-chat .bubble.selected::before,
                html body #layer-chat .bubble-transfer.selected::before,
                html body #layer-chat .bubble-redpacket.selected::before,
                html body #layer-chat .bubble-location.selected::before,
                html body #layer-chat .bubble-copay.selected::before,
                html body #layer-chat .bubble-contact-card.selected::before,
                html body #layer-chat .bubble-gift-delivery.selected::before,
                html body #layer-chat .bubble-fav-product.selected::before,
                html body #layer-chat .bubble-literature.selected::before,
                html body #layer-chat .bubble-literature-frag.selected::before,
                html body #layer-chat .bubble-merge-forward.selected::before,
                html body #layer-chat .go-offline-bubble.selected::before,
                html body #layer-chat .bubble-shared-post.selected::before {
                    content: '\\f00c' !important;
                    font-family: "Font Awesome 6 Free" !important;
                    font-weight: 900 !important;
                    position: absolute !important;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    color: #fff !important;
                    font-size: 24px !important;
                    z-index: 11 !important;
                    pointer-events: none !important;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
                    border: none !important;
                    width: auto !important;
                    height: auto !important;
                    background: none !important;
                    filter: none !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    display: block !important;
                }
                /* 确保selected气泡有定位上下文 */
                html body #layer-chat .bubble.selected,
                html body #layer-chat .bubble-transfer.selected,
                html body #layer-chat .bubble-redpacket.selected,
                html body #layer-chat .bubble-location.selected,
                html body #layer-chat .bubble-copay.selected,
                html body #layer-chat .bubble-contact-card.selected,
                html body #layer-chat .bubble-gift-delivery.selected,
                html body #layer-chat .bubble-fav-product.selected,
                html body #layer-chat .bubble-literature.selected,
                html body #layer-chat .bubble-literature-frag.selected,
                html body #layer-chat .bubble-merge-forward.selected,
                html body #layer-chat .go-offline-bubble.selected,
                html body #layer-chat .bubble-shared-post.selected {
                    position: relative !important;
                }
            `;
            document.head.appendChild(protectEl);
        }

        // [FIX-聊天输入栏保护] 确保聊天输入栏的核心布局不会被自定义CSS破坏
        // 用户的美化CSS可能包含position/width/height/margin等被_autoImportant加了!important后
        // 覆盖了输入栏按钮的flex布局，导致按钮全部错位重合到同一位置
        function _ensureChatInputProtection() {
            let protectEl = document.getElementById('protect-style-chat-input');
            if (!protectEl) {
                protectEl = document.createElement('style');
                protectEl.id = 'protect-style-chat-input';
            }
            protectEl.innerHTML = `
                /* [保护-v3] 防止自定义CSS破坏聊天输入栏布局 - 只保护布局相关属性，不限制外观 */
                #layer-chat .input-bar {
                    display: flex !important;
                    flex-direction: column !important;
                    position: relative !important;
                    box-sizing: border-box !important;
                    transform: none !important;
                    left: auto !important;
                    right: auto !important;
                    float: none !important;
                    /* [FIX-胶囊兼容] 不再强制 width:100%/margin:0，让悬浮胶囊的 margin 和宽度生效 */
                }
                #layer-chat .input-bar .input-row {
                    display: flex !important;
                    flex-direction: row !important;
                    align-items: center !important;
                    gap: 4px !important;
                    width: 100% !important;
                    height: auto !important;
                    min-height: 36px !important;
                    position: relative !important;
                    box-sizing: border-box !important;
                    transform: none !important;
                    top: auto !important;
                    left: auto !important;
                    float: none !important;
                    flex-wrap: nowrap !important;
                }
                #layer-chat .input-bar .input-row > .btn-act,
                #layer-chat .input-bar .input-row > .btn-gen,
                #layer-chat .input-bar .input-row > .btn-thought,
                #layer-chat .input-bar .input-row > .btn-send {
                    position: relative !important;
                    top: auto !important;
                    left: auto !important;
                    right: auto !important;
                    bottom: auto !important;
                    transform: none !important;
                    float: none !important;
                    flex-shrink: 0 !important;
                    width: 32px !important;
                    height: 32px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    /* [FIX-贴图兼容] 允许背景图显示 */
                    background-size: contain !important;
                    background-repeat: no-repeat !important;
                    background-position: center !important;
                }
                /* [FIX-SVG贴图兼容] 当按钮被用户CSS设置了背景图(贴图)时，隐藏内部SVG */
                #layer-chat .input-bar .btn-act.has-custom-icon > svg {
                    display: none !important;
                }
                #layer-chat .input-bar .input-row > .input-field,
                #layer-chat .input-bar .input-row > #chat-input {
                    position: relative !important;
                    flex: 1 1 auto !important;
                    min-width: 0 !important;
                    width: auto !important;
                    transform: none !important;
                    top: auto !important;
                    left: auto !important;
                    float: none !important;
                    margin: 0 !important;
                    box-sizing: border-box !important;
                }
                #layer-chat .input-bar .input-row > #voice-hold-btn {
                    position: relative !important;
                    flex: 1 1 auto !important;
                    transform: none !important;
                    top: auto !important;
                    left: auto !important;
                    float: none !important;
                }
                #layer-chat .toolbar:not(#chat-toolbar) {
                    display: flex !important;
                    flex-direction: row !important;
                    justify-content: space-around !important;
                    align-items: center !important;
                    position: relative !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                    transform: none !important;
                    top: auto !important;
                    left: auto !important;
                    float: none !important;
                }
                /* [FIX-折叠按钮] #chat-toolbar 只保护布局，不强制display，允许JS控制显示/隐藏 */
                #layer-chat #chat-toolbar {
                    flex-direction: row !important;
                    justify-content: space-around !important;
                    align-items: center !important;
                    position: relative !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                    transform: none !important;
                    top: auto !important;
                    left: auto !important;
                    float: none !important;
                }
                #layer-chat .toolbar > i {
                    position: relative !important;
                    top: auto !important;
                    left: auto !important;
                    right: auto !important;
                    bottom: auto !important;
                    transform: none !important;
                    float: none !important;
                }
                /* [保护] 防止quote-preview被错位 */
                #layer-chat .quote-preview {
                    position: relative !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                    transform: none !important;
                    top: auto !important;
                    left: auto !important;
                    float: none !important;
                }
            `;
            document.head.appendChild(protectEl);
        }

        // [FIX-SVG贴图兼容v2] 检测聊天输入栏按钮是否被用户CSS设置了background-image贴图
        // 如果检测到贴图，自动给按钮加 has-custom-icon class 隐藏内部 SVG
        // v2: 多次重试 + MutationObserver 确保时机可靠
        function _doDetectBtnIcons() {
            try {
                var btns = document.querySelectorAll('#chat-input-bar .input-row > .btn-act');
                if (!btns.length) return;
                for (var i = 0; i < btns.length; i++) {
                    var btn = btns[i];
                    var cs = window.getComputedStyle(btn);
                    var bgImg = cs.backgroundImage;
                    // 检测是否有实际的背景图（非 none）
                    if (bgImg && bgImg !== 'none' && bgImg !== '') {
                        btn.classList.add('has-custom-icon');
                    } else {
                        btn.classList.remove('has-custom-icon');
                    }
                }
            } catch(_e) {}
        }
        var _detectIconTimer = null;
        function _detectBtnCustomIcons() {
            // 立即检测一次
            _doDetectBtnIcons();
            // 多次重试：CSS可能需要时间被浏览器解析并应用到computedStyle
            clearTimeout(_detectIconTimer);
            [50, 150, 400, 800].forEach(function(delay) {
                setTimeout(_doDetectBtnIcons, delay);
            });
        }
        // 暴露到全局，供美化包导入等场景调用
        window._detectBtnCustomIcons = _detectBtnCustomIcons;
        
        // [FIX-SVG贴图兼容v2] MutationObserver：监听<head>中<style>标签变化，自动重新检测
        try {
            var _headObserver = new MutationObserver(function(mutations) {
                var hasStyleChange = false;
                for (var i = 0; i < mutations.length; i++) {
                    var m = mutations[i];
                    // 检测是否有style标签被添加/修改
                    if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                            if (m.addedNodes[j].tagName === 'STYLE') { hasStyleChange = true; break; }
                        }
                    } else if (m.type === 'characterData' && m.target.parentNode && m.target.parentNode.tagName === 'STYLE') {
                        hasStyleChange = true;
                    }
                    if (hasStyleChange) break;
                }
                if (hasStyleChange) {
                    // 延迟检测，等CSS解析完成
                    clearTimeout(_detectIconTimer);
                    _detectIconTimer = setTimeout(_doDetectBtnIcons, 100);
                }
            });
            _headObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
        } catch(_moErr) {}

        // [FIX-CSS清理] 清理用户粘贴的CSS：移除BOM、智能引号、零宽字符等
        function _sanitizeCSS(raw) {
            if (!raw) return '';
            var s = raw;
            // 移除BOM和零宽字符
            s = s.replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '');
            // 替换中文/智能引号为普通引号
            s = s.replace(/[\u201C\u201D\u2018\u2019\uFF02]/g, '"');
            s = s.replace(/\uFF07/g, "'");
            // 替换全角分号/冒号/大括号为半角
            s = s.replace(/\uFF1B/g, ';');
            s = s.replace(/\uFF1A/g, ':');
            s = s.replace(/\uFF5B/g, '{');
            s = s.replace(/\uFF5D/g, '}');
            return s;
        }

        // [FIX-CSS增强] 自动给没有!important的属性值添加!important
        // 这样用户粘贴的CSS能覆盖主题中的!important规则
        // [FIX-按钮错位v2] 排除布局关键属性，只给装饰性属性加!important
        // position/top/left/right/bottom/float/display/flex*/width/height/margin/transform等
        // 这些属性如果被!important强制覆盖，会导致输入栏按钮错位重合
        function _autoImportant(css) {
            if (!css || !css.trim()) return css;
            // [FIX-CSS应用不全] 逐声明解析，确保每条CSS声明（包括最后一条）都能被处理
            // 旧正则在多行CSS末尾声明可能匹配不到
            return css.replace(/([^{}\/\*]+?)\s*;/g, function(match) {
                // 跳过注释内容
                if (match.indexOf('/*') !== -1) return match;
                // 如果已有!important，不重复添加
                if (/!important/i.test(match)) return match;
                // [FIX-按钮错位v2] 提取属性名，判断是否为布局关键属性
                var propMatch = match.match(/^\s*([\w-]+)\s*:/);
                if (propMatch) {
                    var prop = propMatch[1].toLowerCase().trim();
                    // [FIX-CSS应用不全] 精简布局属性白名单：只排除真正的结构/定位属性
                    // 将 opacity/visibility/padding 等常用装饰属性移出白名单，让美化CSS能覆盖主题
                    var layoutProps = [
                        'position', 'top', 'left', 'right', 'bottom',
                        'float', 'clear', 'display',
                        'flex', 'flex-direction', 'flex-wrap', 'flex-flow',
                        'flex-grow', 'flex-shrink', 'flex-basis',
                        'align-items', 'align-self', 'align-content',
                        'justify-content', 'justify-items', 'justify-self',
                        'order', 'grid', 'grid-template', 'grid-template-columns',
                        'grid-template-rows', 'grid-column', 'grid-row',
                        'grid-area', 'grid-gap', 'gap', 'row-gap', 'column-gap',
                        'width', 'min-width', 'max-width',
                        'height', 'min-height', 'max-height',
                        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
                        'transform', 'translate', 'rotate', 'scale',
                        'overflow', 'overflow-x', 'overflow-y',
                        'clip', 'clip-path',
                        'content-visibility',
                        'pointer-events',
                        'box-sizing', 'vertical-align', 'table-layout'
                    ];
                    if (layoutProps.indexOf(prop) !== -1) {
                        return match; // 不添加!important
                    }
                }
                // 在分号前插入 !important
                return match.replace(/;\s*$/, ' !important;');
            });
        }

        // [FIX-iOS美化卡顿-2026-05-12] iOS 上自动剥离 GPU 重属性
        // 用户粘贴的CSS可能含 backdrop-filter/复杂animation，经 _autoImportant 后
        // 变成 !important 优先级高于 ios-perf.css 的全局禁用规则，导致全局卡顿
        function _stripIOSHeavyProps(css) {
            if (!css) return css;
            var isIOS = document.documentElement.classList.contains('is-ios');
            if (!isIOS) return css;
            // [FIX-iOS气泡透明-2026-05-13] 检测是否有backdrop-filter被剥离
            var hadBackdrop = /backdrop-filter\s*:/i.test(css);
            // 剥离 backdrop-filter 和 -webkit-backdrop-filter 声明（含 !important）
            css = css.replace(/[\s;]*-webkit-backdrop-filter\s*:[^;]*;?/gi, ';');
            css = css.replace(/[\s;]*backdrop-filter\s*:[^;]*;?/gi, ';');
            // 清理连续分号
            css = css.replace(/;{2,}/g, ';');
            // [FIX-iOS气泡透明-2026-05-13] 如果剥离了backdrop-filter，注入iOS兜底气泡背景
            // 防止美化老师的CSS用transparent+backdrop-filter做毛玻璃效果，剥离后气泡变透明只剩小三角
            if (hadBackdrop) {
                css += '\n/* [iOS-fallback] backdrop-filter已被剥离，补充兜底背景 */\n';
                css += 'html.is-ios #layer-chat .bubble { background-color: var(--bubble-left, #ffffff) !important; }\n';
                css += 'html.is-ios #layer-chat .msg-row.me .bubble { background-color: var(--bubble-right, #95ec69) !important; }\n';
            }
            return css;
        }

        function applyCustomCSS(type) {
            var rawCss = document.getElementById(`css-${type}`).value;
            // [FIX-CSS清理] 清理特殊字符，防止粘贴后CSS解析失败
            var css = _sanitizeCSS(rawCss);
            // [FIX-CSS增强] 自动添加!important，确保能覆盖主题样式
            css = _autoImportant(css);
            // [FIX-iOS美化卡顿-2026-05-12] iOS上剥离GPU重属性
            css = _stripIOSHeavyProps(css);
            // 如果清理后与原始不同，同步回textarea让用户看到
            if (css !== rawCss) {
                document.getElementById(`css-${type}`).value = css;
            }
            let styleEl = document.getElementById(`custom-style-${type}`);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = `custom-style-${type}`;
            }
            styleEl.innerHTML = css;
            // [FIX-CSS覆盖] 始终将自定义CSS的<style>标签追加到<head>末尾
            // 确保在所有<link>和其他<style>之后，获得最高的层叠优先级
            document.head.appendChild(styleEl);
            
            // [FIX-CSS兼容] 一旦有自定义CSS被应用，禁用default-theme.css以避免覆盖
            _disableDefaultTheme();
            
            // [FIX-气泡CSS优先] 如果是气泡类型且有内容，给body加标记class
            // 这样cute-theme/korean-theme中的气泡样式会自动让步
            if (type === 'bubble' && css.trim()) {
                document.body.classList.add('has-custom-bubble-css');
            } else if (type === 'bubble' && !css.trim()) {
                document.body.classList.remove('has-custom-bubble-css');
            }
            // [FIX-全局CSS兼容] 全局界面CSS也标记body，让主题样式让步
            if (type === 'global' && css.trim()) {
                document.body.classList.add('has-custom-global-css');
            } else if (type === 'global' && !css.trim()) {
                document.body.classList.remove('has-custom-global-css');
            }
            // [FIX-线下CSS兼容] 线下模式CSS同理，让apk-perf.css的!important规则让步
            if (type === 'offline' && css.trim()) {
                document.body.classList.add('has-custom-offline-css');
            } else if (type === 'offline' && !css.trim()) {
                document.body.classList.remove('has-custom-offline-css');
            }
            
            // [FIX-CSS覆盖] 确保所有自定义CSS标签都在末尾（保持顺序一致性）
            _moveCustomStylesToEnd();
            
            // [FIX-美化持久化] 保存自定义CSS，使用saveNow确保立即写入IDB
            if (!store.customCSS) store.customCSS = {};
            store.customCSS[type] = css;
            if (typeof window.saveNow === 'function') {
                window.saveNow();
            } else {
                save();
            }
            // [FIX-退出重进消失] 同步写入localStorage作为热备份
            // 防止IDB异步写入未完成时用户退出导致数据丢失
            try { localStorage.setItem('YAN_customCSS_backup', JSON.stringify(store.customCSS)); } catch(_e){}
            
            // [PERF-2026-05-04] 应用自定义CSS后触发性能审计
            if (typeof window._checkCustomCSSPerformance === 'function') {
                setTimeout(function() { window._checkCustomCSSPerformance(); }, 200);
            }
            
            // [FIX-SVG贴图兼容] 应用CSS后检测按钮是否有贴图，自动隐藏SVG
            setTimeout(_detectBtnCustomIcons, 100);
            
            const typeLabels = { bubble: '气泡', global: '界面', offline: '线下模式' };
            toast(`${typeLabels[type] || type}样式已应用`);
        }

        function saveCSSPreset(type) {
            const cssEl = document.getElementById(`css-${type}`);
            if (!cssEl) return toast("找不到CSS编辑器", "error");
            const css = cssEl.value;
            if (!css.trim()) return toast("内容为空，无法保存", "error");

            showPromptModal('请输入预设名称:', '').then(function(presetName) {
            if (!presetName || !presetName.trim()) return;
            presetName = presetName.trim();

            // [FIX-预设保存] 确保cssPresets是对象而非数组，且包含所有类型
            if (!store.cssPresets || Array.isArray(store.cssPresets)) store.cssPresets = { bubble: {}, global: {}, offline: {} };
            if (!store.cssPresets[type] || typeof store.cssPresets[type] !== 'object') store.cssPresets[type] = {};
            
            store.cssPresets[type][presetName] = css;
            try {
                save();
                toast("预设已保存: " + presetName, "success");
            } catch(e) {
                console.error('[saveCSSPreset] save失败:', e);
                toast("保存失败，可能存储空间不足", "error");
            }
            initCSSCustomization(); // Refresh preset selectors
            });
        }

        function loadCSSPreset(type, presetName) {
            if (!presetName) return;
            const css = store.cssPresets?.[type]?.[presetName];
            if (css !== undefined) {
                document.getElementById(`css-${type}`).value = css;
                applyCustomCSS(type);
                toast("已加载预设: " + presetName);
            }
        }

        function openPresetPopup(type) {
            if (!store.cssPresets || Array.isArray(store.cssPresets)) store.cssPresets = { bubble: {}, global: {}, offline: {} };
            const presets = store.cssPresets[type] || {};
            const names = Object.keys(presets);
            const typeLabelsMap = { bubble: '气泡', global: '界面', offline: '线下模式' };
            const typeLabel = typeLabelsMap[type] || type;
            
            let html = '';
            if (names.length === 0) {
                html = '<div style="text-align:center;padding:30px 0;color:#999;font-size:14px;">暂无预设</div>';
            } else {
                html = '<div style="max-height:350px;overflow-y:auto;">';
                names.forEach(name => {
                    html += `<div style="display:flex;align-items:center;padding:12px 8px;border-bottom:1px solid #f0f0f0;cursor:pointer;" class="preset-item" data-name="${name}">
                        <span style="flex:1;font-size:14px;" onclick="loadCSSPreset('${type}','${name}');document.getElementById('modal-confirm').style.display='none';">${name}</span>
                        <span onclick="deleteCSSPresetItem('${type}','${name}')" style="color:#fa5151;font-size:18px;padding:0 6px;cursor:pointer;line-height:1;">&times;</span>
                    </div>`;
                });
                html += '</div>';
            }
            
            const modal = document.getElementById('modal-confirm');
            document.getElementById('confirm-title').textContent = `${typeLabel}预设列表`;
            document.getElementById('confirm-text').innerHTML = html;
            
            const okBtn = document.getElementById('confirm-btn-ok');
            const cancelBtn = document.getElementById('confirm-btn-cancel');
            const newOk = okBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOk, okBtn);
            const newCancel = cancelBtn.cloneNode(true);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
            newOk.textContent = '关闭';
            newOk.onclick = () => { modal.style.display = 'none'; };
            newCancel.style.display = 'none';
            modal.style.display = 'flex';
        }

        function deleteCSSPresetItem(type, name) {
            showConfirm("删除预设", `确定删除预设「${name}」吗？`, () => {
                if (store.cssPresets && store.cssPresets[type]) {
                    delete store.cssPresets[type][name];
                    save();
                    toast("预设已删除");
                    // 重新打开弹窗刷新列表
                    openPresetPopup(type);
                }
            });
        }
        
        // [FIX-字体兼容] 辅助函数：生成字体全局覆盖CSS
        function _buildFontCSS(_ff) {
            return `
                /* [FIX-字体全局v3] 覆盖所有CSS变量中的字体定义 */
                :root, html, body,
                body.theme-korean, body.theme-cute,
                body[class*="theme-"] {
                    --kr-font: ${_ff} !important;
                    --cute-font: ${_ff} !important;
                    --font-family: ${_ff} !important;
                    --ff: ${_ff} !important;
                }
                html, html body, html body * { font-family: ${_ff} !important; }
                html body #device, html body #device * { font-family: ${_ff} !important; }
                html body[class], html body[class] * { font-family: ${_ff} !important; }
                [style*="font-family"], [style*="font-Family"],
                [style*="fontFamily"], [style*="FONT-FAMILY"] { font-family: ${_ff} !important; }
                html body input, html body textarea, html body select, html body button,
                html body input::placeholder, html body textarea::placeholder { font-family: ${_ff} !important; }
                html body *::before, html body *::after { font-family: ${_ff} !important; }
                body.theme-korean #layer-chat > .nav-bar#chat-nav-bar .nav-title,
                body.theme-korean #layer-chat .bubble, body.theme-korean #layer-chat .bubble *,
                body.theme-korean #layer-chat .msg-row .time-label,
                body.theme-korean #layer-chat .bubble-time-label,
                body.theme-korean #layer-chat .chat-input-bar *,
                body.theme-korean #tab-me *, body.theme-korean #tab-me #my-name,
                body.theme-korean #tab-me #my-wxid, body.theme-korean #tab-me .list-title,
                body.theme-korean #tab-me .list-sub, body.theme-korean #tab-me .form-label,
                body.theme-korean #tab-me #wallet-balance,
                body.theme-korean #tab-contacts *, body.theme-korean #tab-chats *,
                body.theme-korean #layer-beauty *, body.theme-korean #layer-beauty > .nav-bar .nav-title,
                body.theme-korean #layer-beauty .beauty-menu-title, body.theme-korean #layer-beauty .form-label,
                body.theme-korean #layer-beauty p,
                body.theme-korean #layer-settings *, body.theme-korean #layer-settings > .nav-bar .nav-title,
                body.theme-korean #layer-settings .settings-nav-title-text, body.theme-korean #layer-settings .form-label,
                body.theme-korean #layer-settings button,
                body.theme-korean #layer-worldbook *, body.theme-korean #layer-study *,
                body.theme-korean #layer-chat-settings *, body.theme-korean #layer-chat-settings .form-label,
                body.theme-korean #layer-chat-settings .nav-bar .nav-title,
                body.theme-korean .modal-mask .modal-box h3, body.theme-korean .modal-mask .modal-box button,
                body.theme-korean .modal-mask .modal-box *, body.theme-korean .study-lecture-msg,
                body.theme-korean .wb-html-popup-container *, body.theme-korean #wb-html-popup-title,
                body.theme-korean input, body.theme-korean textarea,
                body.theme-korean select, body.theme-korean button { font-family: ${_ff} !important; }
                body.theme-cute #layer-chat > .nav-bar#chat-nav-bar .nav-title,
                body.theme-cute #layer-chat .bubble, body.theme-cute #layer-chat .bubble *,
                body.theme-cute #layer-chat .msg-row .time-label,
                body.theme-cute #layer-chat .bubble-time-label,
                body.theme-cute #layer-chat .chat-input-bar *,
                body.theme-cute #tab-me *, body.theme-cute #tab-contacts *,
                body.theme-cute #tab-chats *, body.theme-cute #layer-beauty *,
                body.theme-cute #layer-beauty > .nav-bar .nav-title,
                body.theme-cute #layer-settings *, body.theme-cute #layer-settings > .nav-bar .nav-title,
                body.theme-cute #layer-settings .settings-nav-title-text,
                body.theme-cute #layer-worldbook *, body.theme-cute #layer-study *,
                body.theme-cute #layer-chat-settings *,
                body.theme-cute .modal-mask .modal-box h3, body.theme-cute .modal-mask .modal-box button,
                body.theme-cute .modal-mask .modal-box *, body.theme-cute .study-lecture-msg,
                body.theme-cute input, body.theme-cute textarea,
                body.theme-cute select, body.theme-cute button { font-family: ${_ff} !important; }
                #layer-chat > .nav-bar#chat-nav-bar .nav-title,
                #layer-chat .bubble, #layer-chat .bubble *,
                #layer-chat .msg-row .time-label, #layer-chat .bubble-time-label,
                #layer-chat .chat-input-bar *,
                #tab-me *, #tab-me #my-name, #tab-me #my-wxid,
                #tab-me .list-title, #tab-me .list-sub, #tab-me .form-label, #tab-me #wallet-balance,
                #tab-contacts *, #tab-chats *,
                #layer-beauty *, #layer-beauty > .nav-bar .nav-title,
                #layer-beauty .beauty-menu-title, #layer-beauty .form-label,
                #layer-settings *, #layer-settings > .nav-bar .nav-title,
                #layer-settings .settings-nav-title-text, #layer-settings .form-label,
                #layer-worldbook *, #layer-worldbook > .nav-bar .nav-title,
                #layer-study *, #layer-perception *, #layer-couple *,
                #layer-chat-settings *, #layer-chat-settings .form-label,
                #layer-offline-mode *, #layer-wechat *, #layer-desktop *,
                .modal-mask .modal-box h3, .modal-mask .modal-box button,
                .modal-mask .modal-box *, .modal-mask *,
                #modal-confirm *, #modal-contact *,
                #modal-wb *, #modal-wb-select *,
                #modal-custom-input .modal-box *,
                #modal-forward-contact .modal-box *,
                #contact-list *, #contact-list .list-item .list-title,
                .bubble, .bubble *, .bubble .voice-sec,
                .bubble-location .loc-name, .msg-row .time-label,
                .offline-text-block, .offline-text-block *,
                .go-offline-bubble, .go-offline-bubble *,
                .nav-bar .nav-title, .nav-title, .settings-nav-title-text,
                .list-title, .list-sub, .form-label, .form-val,
                .form-cell *, .group-box *,
                .beauty-subpage *, .settings-subpage *,
                .bottom-nav *, .study-bottom-nav *,
                .wb-html-popup-header span, #wb-html-popup-title,
                .wb-html-popup-container *,
                .ff-nav-title, .ff-read-nav-title, .ff-read-body,
                .ff-write-textarea, .ff-card *, .ff-detail *,
                .study-lecture-msg,
                .moment-card *, .moment-detail *,
                .mail-read-body, .mail-item *, .mail-read-sender,
                .mail-read-date, .mail-compose *,
                .forum-post *, .forum-reply *,
                .receipt-barcode, .shop-receipt .receipt-barcode,
                .sv-mood-input-area textarea,
                .vc-log-action, .vc-log-text,
                .font-preset-item .fp-name,
                #keepalive-status,
                .beauty-comp-tab, .beauty-mode-btn,
                [class*="layer-"] *, [id*="layer-"] *,
                [class*="tab-"] *, [id*="tab-"] *,
                [class*="modal-"] *, [id*="modal-"] * { font-family: ${_ff} !important; }
                #tab-me #my-wxid,
                #tab-me .group-box .list-item .list-title,
                #tab-me .group-box .form-cell .form-label { font-family: ${_ff} !important; }
                .fas, .far, .fab, .fa, .fal, .fad,
                .fas::before, .far::before, .fab::before, .fa::before, .fal::before, .fad::before,
                i.fas, i.far, i.fab, i.fa, i.fal, i.fad,
                i.fas::before, i.far::before, i.fab::before, i.fa::before,
                [class^="fa-"], [class*=" fa-"],
                [class^="fa-"]::before, [class*=" fa-"]::before {
                    font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands" !important;
                }
            `;
        }

        async function applyCustomFont(directUrl, silent) {
            const url = directUrl || (document.getElementById('font-url-input')?.value || '').trim();
            if (!url) { if (!silent) toast("请输入字体URL", "error"); return; }

            if (!silent) toast("正在加载字体...", "info");

            const fontName = 'CustomGlobalFont';

            // [FIX-字体兼容] 判断URL类型：CSS链接（Google Fonts等）vs 直接字体文件
            const isCSS = /\.(css)(\?|$)/i.test(url) ||
                          /fonts\.googleapis\.com/i.test(url) ||
                          /fonts\.cdnfonts\.com/i.test(url) ||
                          /use\.typekit\.net/i.test(url);

            try {
            if (isCSS) {
                // CSS链接方式加载字体（如Google Fonts）
                // 先移除旧的外部字体链接
                const oldLink = document.getElementById('custom-font-link');
                if (oldLink) oldLink.remove();

                const link = document.createElement('link');
                link.id = 'custom-font-link';
                link.rel = 'stylesheet';
                link.href = url;
                document.head.appendChild(link);

                // 等待字体加载完成
                await new Promise((resolve, reject) => {
                    link.onload = () => {
                        // 等待字体实际可用
                        if (document.fonts && document.fonts.ready) {
                            document.fonts.ready.then(resolve);
                        } else {
                            setTimeout(resolve, 1500);
                        }
                    };
                    link.onerror = () => reject(new Error('CSS字体链接加载失败'));
                    // 超时兜底
                    setTimeout(resolve, 5000);
                });

                // 尝试从CSS中提取font-family名称
                let detectedFontFamily = null;
                try {
                    for (const sheet of document.styleSheets) {
                        try {
                            if (sheet.href && sheet.href === url) {
                                for (const rule of sheet.cssRules) {
                                    if (rule instanceof CSSFontFaceRule) {
                                        const ff = rule.style.getPropertyValue('font-family');
                                        if (ff) {
                                            detectedFontFamily = ff.replace(/['"]/g, '').trim();
                                            break;
                                        }
                                    }
                                }
                            }
                        } catch(e) { /* 跨域样式表无法读取 */ }
                    }
                } catch(e) { /* ignore */ }

                // 如果无法检测到font-family，使用URL中的提示或通用名
                if (!detectedFontFamily) {
                    // 尝试从Google Fonts URL中提取
                    const gfMatch = url.match(/family=([^&:+]+)/);
                    if (gfMatch) {
                        detectedFontFamily = decodeURIComponent(gfMatch[1]).replace(/\+/g, ' ');
                    }
                }

                if (detectedFontFamily) {
                    // 用检测到的字体名作为主要字体
                    const _ffCSS = `'${detectedFontFamily}', -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif`;
                    let styleEl = document.getElementById('custom-font-style');
                    if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = 'custom-font-style';
                        document.head.appendChild(styleEl);
                    }
                    // 复用已有的全局覆盖逻辑
                    styleEl.innerHTML = _buildFontCSS(_ffCSS);
                    _moveCustomStylesToEnd();

                    if (!store.customFont) store.customFont = {};
                    store.customFont.url = url;
                    store.customFont.type = 'css';
                    store.customFont.family = detectedFontFamily;
                    if (!silent) save();
                    if (!silent) toast("CSS字体应用成功!", "success");
                } else {
                    if (!silent) toast("CSS字体链接已加载，但无法自动检测字体名称。请使用直接字体文件链接(.ttf/.woff2)以获得最佳效果。", "warning");
                    if (!store.customFont) store.customFont = {};
                    store.customFont.url = url;
                    store.customFont.type = 'css';
                    if (!silent) save();
                }
                return;
            }

            // [FIX-字体兼容APK] 直接字体文件方式加载
            // 支持：http(s)链接、file://路径、capacitor://路径、content://路径（APK内部）
            const isLocalPath = url.startsWith('file://') || url.startsWith('capacitor://') || url.startsWith('content://') || url.startsWith('/');
            const fontSrc = url;
            const isNativeApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

            // [FIX-CORS] 辅助：通过fetch获取字体数据，绕过FontFace的CORS限制
            // 原理：Capacitor原生fetch不受CORS限制，Web端走代理也不受限制
            const _fetchFontAsBuffer = async (fetchUrl) => {
                const resp = await fetch(fetchUrl, { mode: 'cors' });
                if (!resp.ok) throw new Error(`字体下载失败: HTTP ${resp.status}`);
                return await resp.arrayBuffer();
            };

            // [FIX-CORS] 尝试直接加载，失败后自动走代理/原生fetch
            // 如果上次已确定需要代理（needProxy），启动时直接走备选方案
            let font;
            let usedProxy = false;
            const knownNeedProxy = !isLocalPath && store.customFont && store.customFont.needProxy && store.customFont.url === url;

            if (knownNeedProxy) {
                // 上次已记录需要备选方案
                if (isNativeApp) {
                    // APK原生：用fetch获取ArrayBuffer（原生不受CORS限制）
                    const fontData = await _fetchFontAsBuffer(fontSrc);
                    font = new FontFace(fontName, fontData);
                    await font.load();
                } else {
                    // Web：通过服务器代理
                    const proxyUrl = `/api/font-proxy?url=${encodeURIComponent(fontSrc)}`;
                    font = new FontFace(fontName, `url(${proxyUrl})`);
                    await font.load();
                }
                usedProxy = true;
            } else {
                try {
                    font = new FontFace(fontName, `url(${fontSrc})`);
                    await font.load();
                } catch (directErr) {
                    // 如果是本地路径，不走代理
                    if (isLocalPath) {
                        throw directErr;
                    }
                    // 直接加载失败（通常是CORS），自动通过备选方式重试
                    console.warn("[Font] 直接加载失败，尝试备选方式...", directErr.message);
                    if (!silent) toast("直接加载受限，正在通过备选方式加载字体...", "info");

                    if (isNativeApp) {
                        // APK原生：用fetch获取ArrayBuffer绕过CORS
                        const fontData = await _fetchFontAsBuffer(fontSrc);
                        font = new FontFace(fontName, fontData);
                        await font.load();
                    } else {
                        // Web：通过服务器代理
                        const proxyUrl = `/api/font-proxy?url=${encodeURIComponent(fontSrc)}`;
                        font = new FontFace(fontName, `url(${proxyUrl})`);
                        await font.load();
                    }
                    usedProxy = true;
                }
            }

                document.fonts.add(font);
                
                let styleEl = document.getElementById('custom-font-style');
                if (!styleEl) {
                    styleEl = document.createElement('style');
                    styleEl.id = 'custom-font-style';
                    document.head.appendChild(styleEl);
                }

                const _ff = `'${fontName}', -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif`;
                styleEl.innerHTML = _buildFontCSS(_ff);

                // [FIX-字体全局] 确保字体CSS始终在最末尾，优先级最高
                _moveCustomStylesToEnd();
                // [FIX-气泡字体大小] 字体异步加载完成后_moveCustomStylesToEnd会把自定义CSS移到末尾，
                // 可能覆盖bubble-slider-override中的滑条设置（如font-size !important），
                // 必须把bubble-slider-override重新移到最末尾确保滑条设置优先级最高
                var _bsOverride = document.getElementById('bubble-slider-override');
                if (_bsOverride && _bsOverride.parentNode) {
                    document.head.appendChild(_bsOverride);
                }

                if (!store.customFont) store.customFont = {};
                store.customFont.url = url;
                // [FIX-CORS] 记录是否需要代理，启动时用代理URL直接加载，避免重复尝试
                store.customFont.needProxy = usedProxy;
                if (!silent) save();

                if (!silent) toast(usedProxy ? "字体通过代理应用成功!" : "字体应用成功!", "success");
            } catch (e) {
                console.error("Font load error:", e);
                if (!silent) toast("字体加载失败，链接无效或无法访问。请检查链接是否正确。", "error");
            }
        }

        function initCSSCustomization() {
            // [FIX-CSS兼容] 新的初始化逻辑：
            // - 无自定义CSS时：default-theme.css（<link>标签）提供默认黑白便签外观
            // - 有自定义CSS时：禁用default-theme.css，用户CSS通过<style>标签生效
            
            // [FIX-类型兼容] 旧版本DB中customCSS初始值是空字符串''，这里做类型修正
            // 确保store.customCSS始终是对象，避免后续.bubble等属性访问出错
            if (!store.customCSS || typeof store.customCSS === 'string') {
                store.customCSS = {};
                // [FIX-退出重进消失] 从localStorage热备份恢复（IDB异步加载可能未完成导致store为空）
                try {
                    var _cssBackup = localStorage.getItem('YAN_customCSS_backup');
                    if (_cssBackup) {
                        var _parsed = JSON.parse(_cssBackup);
                        if (_parsed && typeof _parsed === 'object' && (_parsed.bubble || _parsed.global || _parsed.offline)) {
                            store.customCSS = _parsed;
                            console.log('[FIX-退出重进] 从localStorage热备份恢复了customCSS');
                        }
                    }
                } catch(_e) {}
            }
            
            let hasCustomCSS = false;
            
            // 1. Load and apply saved custom CSS on startup
            if (store.customCSS) {
                if (store.customCSS.bubble) {
                    document.getElementById('css-bubble').value = store.customCSS.bubble;
                    hasCustomCSS = true;
                }
                if (store.customCSS.global) {
                    document.getElementById('css-global').value = store.customCSS.global;
                    hasCustomCSS = true;
                }
                // [FIX] 加载线下模式CSS
                if (store.customCSS.offline) {
                    const offlineEl = document.getElementById('css-offline');
                    if (offlineEl) {
                        offlineEl.value = store.customCSS.offline;
                        hasCustomCSS = true;
                    }
                }
            }

            // 2. Load and apply saved custom font on startup
            if (store.customFont && store.customFont.url) {
                 const fontInput = document.getElementById('font-url-input');
                 if (fontInput) fontInput.value = store.customFont.url;
                 applyCustomFont(store.customFont.url, true);
            }

            // 2b. Load diary/mail custom fonts on startup
            if (store.diaryFont && store.diaryFont.type === 'custom' && store.diaryFont.url) {
                if (typeof _loadDiaryCustomFont === 'function') {
                    _loadDiaryCustomFont(store.diaryFont.url, function(family) {
                        if (family) store.diaryFont.family = family;
                    });
                }
            }
            if (store.mailFont && store.mailFont.type === 'custom' && store.mailFont.url) {
                if (typeof _loadDiaryCustomFont === 'function') {
                    _loadDiaryCustomFont(store.mailFont.url, function(family) {
                        if (family) store.mailFont.family = family;
                    });
                }
            }

            // 3. Init preset storage
            if (!store.cssPresets || Array.isArray(store.cssPresets)) store.cssPresets = { bubble: {}, global: {}, offline: {} };
            if (!store.cssPresets.offline) store.cssPresets.offline = {};

            // 4. Set default CSS templates (only fill textareas, don't inject as <style>)
            if (!document.getElementById('css-bubble').value) {
                document.getElementById('css-bubble').value = DEFAULT_BUBBLE_CSS;
            }
            if (!document.getElementById('css-global').value) {
                document.getElementById('css-global').value = DEFAULT_GLOBAL_CSS;
            }
            // [FIX] 线下模式CSS默认模板
            const offlineEl = document.getElementById('css-offline');
            if (offlineEl && !offlineEl.value) {
                offlineEl.value = DEFAULT_OFFLINE_CSS;
            }
            
            // 5. [FIX-CSS兼容] 如果有用户保存的自定义CSS，应用它们并禁用default-theme.css
            // 这样用户之前的美化代码（包括气泡、全局界面、线下模式）不会被覆盖
            if (hasCustomCSS) {
                // [FIX-主题+自定义CSS共存] 只禁用default-theme.css，保持其他主题CSS可用
                // 其他主题CSS通过body.theme-xxx选择器自动控制生效范围，不会互相干扰
                var _defLinkInit = document.getElementById('default-theme-link');
                if (_defLinkInit) { _defLinkInit.disabled = true; _defLinkInit.setAttribute('media', 'not all'); }
                ['cute-theme-link', 'korean-theme-link', 'mono-theme-link'].forEach(function(id) {
                    var _link = document.getElementById(id);
                    if (_link) { _link.disabled = false; _link.removeAttribute('media'); }
                });
                // 注入用户保存的CSS到<style>标签中
                // [FIX-iOS美化卡顿-2026-05-12] 启动时也需要剥离iOS GPU重属性
                var _isIOSRestore = document.documentElement.classList.contains('is-ios');
                var _stripBlurRestore = function(cssText) {
                    if (!_isIOSRestore || !cssText) return cssText;
                    return cssText
                        .replace(/[\s;]*-webkit-backdrop-filter\s*:[^;]*;?/gi, ';')
                        .replace(/[\s;]*backdrop-filter\s*:[^;]*;?/gi, ';')
                        .replace(/;{2,}/g, ';');
                };
                if (store.customCSS.bubble) {
                    let styleEl = document.getElementById('custom-style-bubble');
                    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'custom-style-bubble'; }
                    // [FIX-iOS气泡透明-2026-05-13] 检测原始CSS是否含backdrop-filter
                    var _bubbleHadBackdrop = _isIOSRestore && /backdrop-filter\s*:/i.test(store.customCSS.bubble);
                    var _bubbleCss = _stripBlurRestore(store.customCSS.bubble);
                    // 如果剥离了backdrop-filter，注入兜底背景色防止气泡变透明只剩小三角
                    if (_bubbleHadBackdrop) {
                        _bubbleCss += '\n/* [iOS-fallback] backdrop-filter已剥离，补充兜底背景 */\n';
                        _bubbleCss += 'html.is-ios #layer-chat .bubble { background-color: var(--bubble-left, #ffffff) !important; }\n';
                        _bubbleCss += 'html.is-ios #layer-chat .msg-row.me .bubble { background-color: var(--bubble-right, #95ec69) !important; }\n';
                    }
                    styleEl.innerHTML = _bubbleCss;
                    // [FIX-CSS覆盖] 始终appendChild确保在<head>最末尾
                    document.head.appendChild(styleEl);
                    // [FIX-气泡CSS优先] 标记body，让全局主题的气泡样式自动让步
                    document.body.classList.add('has-custom-bubble-css');
                }
                if (store.customCSS.global) {
                    let styleEl = document.getElementById('custom-style-global');
                    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'custom-style-global'; }
                    styleEl.innerHTML = _stripBlurRestore(store.customCSS.global);
                    document.head.appendChild(styleEl);
                    // [FIX-全局CSS标记] 标记body，让主题CSS中依赖:not(.has-custom-global-css)的规则正确让步
                    document.body.classList.add('has-custom-global-css');
                }
                if (store.customCSS.offline) {
                    let styleEl = document.getElementById('custom-style-offline');
                    if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'custom-style-offline'; }
                    styleEl.innerHTML = _stripBlurRestore(store.customCSS.offline);
                    document.head.appendChild(styleEl);
                    // [FIX-线下CSS兼容] 标记body，让apk-perf.css的线下模式规则让步
                    document.body.classList.add('has-custom-offline-css');
                }
                // [FIX-底部导航栏保护] 自定义CSS注入后，确保底部导航栏不被隐藏
                _ensureBottomNavProtection();
                // [FIX-弹窗保护] 自定义CSS注入后，确保弹窗不被影响
                _ensureModalProtection();
                // [FIX-气泡字体大小] 自定义CSS注入后，确保bubble-slider-override在最末尾
                // 防止自定义气泡CSS中的!important规则覆盖滑条设置的字体大小等属性
                var _bsOverrideInit = document.getElementById('bubble-slider-override');
                if (_bsOverrideInit && _bsOverrideInit.parentNode) {
                    document.head.appendChild(_bsOverrideInit);
                }
                // [FIX-SVG贴图兼容] 启动时恢复CSS后，延迟检测按钮贴图
                setTimeout(_detectBtnCustomIcons, 300);
            }
            // 如果没有自定义CSS，default-theme.css保持启用，提供默认黑白便签外观
        }

        // ===== 智能推荐回复 (Smart Reply) =====
        let _smartReplyGenerating = false;
        let _smartReplyGeneratingStartTime = 0; // [FIX] 记录生成开始时间，用于超时保护
        let _smartReplyPendingChatId = null; // [FIX] 当正在生成时，记录待处理的chatId
        let _smartReplyCache = {}; // chatId -> { replies: [], lastMsgTime: number }

        // 检查联系人是否启用了推荐回复（默认关闭）
        function isSmartReplyEnabled(chatId) {
            const c = store.contacts.find(x => x.id === chatId);
            if (!c || !c.settings) return false;
            return c.settings.enableSmartReply === true;
        }

        // [MOD] 不做超时限制
        function _checkSmartReplyStuck() {
            // 不做超时检查
        }

        // 检查是否应该显示推荐回复
        function checkSmartReply() {
            if (!activeChatId) { hideSmartReply(); return; }
            // 如果用户未在聊天设置中开启推荐回复，不显示
            if (!isSmartReplyEnabled(activeChatId)) { hideSmartReply(); return; }
            const chatMsgs = store.chats[activeChatId] || [];
            if (chatMsgs.length === 0) { hideSmartReply(); return; }
            
            const lastMsg = chatMsgs[chatMsgs.length - 1];
            // 只有当最后一条消息是对方发的时候才显示推荐回复
            if (lastMsg.sender === 'me' || lastMsg.sender === 'user') { hideSmartReply(); return; }
            // 只对文本消息和语音消息生成推荐回复
            if (lastMsg.type !== 'text' && lastMsg.type !== 'voice') { hideSmartReply(); return; }
            
            // 检查缓存：如果已有缓存且对应最后一条消息时间相同，直接显示
            const cache = _smartReplyCache[activeChatId];
            if (cache && cache.lastMsgTime === lastMsg.time && cache.replies.length > 0) {
                displaySmartReplies(cache.replies);
                return;
            }
            
            // [FIX] 先检查超时保护
            _checkSmartReplyStuck();
            
            // 生成推荐回复
            generateSmartReplies(activeChatId);
        }

        // 生成推荐回复
        async function generateSmartReplies(chatId) {
            // [FIX] 如果正在生成，记录为待处理请求而非静默丢弃
            if (_smartReplyGenerating) {
                _smartReplyPendingChatId = chatId;
                console.log('[SmartReply] 正在生成中，已记录待处理请求:', chatId);
                return;
            }
            _smartReplyGenerating = true;
            _smartReplyGeneratingStartTime = Date.now();
            
            const bar = document.getElementById('smart-reply-bar');
            const list = document.getElementById('smart-reply-list');
            if (!bar || !list) { _smartReplyGenerating = false; _smartReplyGeneratingStartTime = 0; return; }
            
            // 显示加载状态
            bar.style.display = 'flex';
            list.innerHTML = '<div class="smart-reply-loading"><span>推荐回复生成中</span><div class="dot-pulse"><span></span><span></span><span></span></div></div>';
            
            try {
                const chatMsgs = store.chats[chatId] || [];
                if (chatMsgs.length === 0) { hideSmartReply(); _smartReplyGenerating = false; _smartReplyGeneratingStartTime = 0; return; }
                
                const lastMsg = chatMsgs[chatMsgs.length - 1];
                const contact = store.contacts.find(x => x.id === chatId);
                const userP = store.personas[0];
                const userName = userP ? userP.name : (store.user?.name || '我');
                const contactName = contact ? contact.name : '对方';
                
                // 获取最近的对话上下文（最多15条，提供更多上下文）
                const recentMsgs = chatMsgs.slice(-15);
                let contextStr = recentMsgs.map(m => {
                    const who = (m.sender === 'me' || m.sender === 'user') ? userName : contactName;
                    let text = '';
                    if (m.type === 'text') text = m.content || '';
                    else if (m.type === 'voice') text = '[语音] ' + (m.textVal || '');
                    else if (m.type === 'image') text = m.fakeImgDesc ? '[图片] ' + m.fakeImgDesc : (m.stickerName ? '[表情]' : '[图片]');
                    else if (m.type === 'transfer') text = '[转账]';
                    else if (m.type === 'redpacket') text = '[红包]';
                    else if (m.type === 'location') text = '[位置]';
                    else text = m.content || '[消息]';
                    // 清理heartbeat标签
                    text = text.replace(/\[HEARTBEAT:[^\]]*\]/g, '').trim();
                    return `${who}: ${text.substring(0, 150)}`;
                }).filter(Boolean).join('\n');
                
                // 获取用户的回复习惯（分析用户最近的消息风格）
                const userMsgs = chatMsgs.filter(m => (m.sender === 'me' || m.sender === 'user') && m.type === 'text' && m.content);
                const recentUserMsgs = userMsgs.slice(-15);
                let styleHints = '';
                if (recentUserMsgs.length > 0) {
                    const avgLen = Math.round(recentUserMsgs.reduce((sum, m) => sum + (m.content || '').length, 0) / recentUserMsgs.length);
                    const usesEmoji = recentUserMsgs.some(m => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(m.content || ''));
                    const sampleMsgs = recentUserMsgs.slice(-5).map(m => (m.content || '').replace(/\[HEARTBEAT:[^\]]*\]/g, '').trim().substring(0, 50)).filter(s => s.length > 1).join('；');
                    styleHints = `\n用户的说话风格特征：平均消息长度约${avgLen}字，${usesEmoji ? '常用emoji表情' : '较少用emoji'}。最近几条消息示例：${sampleMsgs}`;
                }

                // 提取对方最后说的话（用于强调上下文衔接）
                const lastMsgContent = lastMsg.type === 'text' ? (lastMsg.content || '').replace(/\[HEARTBEAT:[^\]]*\]/g, '').trim() : (lastMsg.type === 'voice' ? (lastMsg.textVal || '') : '');
                
                // 构建推荐回复的prompt
                const sysPrompt = `你是一个帮用户想聊天回复的助手。请仔细阅读完整的聊天上下文，特别是对方最后一条消息，站在用户的角度生成3条自然且贴合语境的回复建议。

核心要求：
1. 【最重要】回复必须紧密衔接对方最后说的话："${lastMsgContent.substring(0, 120)}"，直接回应其中的具体内容、问题或情感
2. 回复必须像真人在微信/QQ上打的字，自然口语化，可以带语气词、emoji、省略号等
3. 模仿用户平时的说话风格（参考用户历史消息的语气、长度、用词习惯）
4. 3条回复分别侧重不同方向：
   - 一条偏情感/共鸣方向（表达理解、关心或共情）
   - 一条偏互动/延伸方向（追问细节、分享自己的经历、推进话题）
   - 一条偏轻松/俏皮方向（幽默回应、调侃、发表情包式回复）
5. 每条回复10-40字左右，简洁有力
6. 不要生成与上下文无关的泛泛而谈的回复
7. 不要使用引号包裹回复内容
8. 用户和${contactName}的关系：${contact?.persona ? '对方人设：' + contact.persona.substring(0, 100) : '普通聊天'}
${userP?.desc ? '用户人设：' + userP.desc.substring(0, 100) : ''}
${styleHints}

严格按以下格式输出，每行一条回复，共3行，不要有编号或其他内容：
回复1
回复2
回复3`;

                const msgs = [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: `以下是最近的对话上下文：\n${contextStr}\n\n对方最后说的是："${lastMsgContent.substring(0, 150)}"\n\n请为用户（${userName}）生成3条贴合上下文的推荐回复。` }
                ];
                
                const data = await API.chatCompletion(msgs, { temperature: 0.9, silent: true, scene: 'reply-suggest' });
                
                // 确保chatId仍然是当前活跃聊天
                if (activeChatId !== chatId) { _smartReplyGenerating = false; return; }
                
                if (!data || !data.choices || !data.choices[0]?.message?.content) {
                    hideSmartReply();
                    _smartReplyGenerating = false;
                    return;
                }
                
                const replyText = data.choices[0].message.content.trim();
                const replies = replyText.split('\n')
                    .map(line => line.replace(/^\d+[\.\)、]\s*/, '').replace(/^["'"']|["'"']$/g, '').trim())
                    .filter(line => line.length > 0 && line.length <= 80)
                    .slice(0, 3);
                
                if (replies.length === 0) {
                    hideSmartReply();
                    _smartReplyGenerating = false;
                    return;
                }
                
                // 缓存结果
                _smartReplyCache[chatId] = {
                    replies: replies,
                    lastMsgTime: lastMsg.time
                };
                
                displaySmartReplies(replies);
            } catch (err) {
                console.error('[SmartReply] 生成失败:', err);
                hideSmartReply();
            } finally {
                _smartReplyGenerating = false;
                _smartReplyGeneratingStartTime = 0;
                // [FIX] 生成结束后，处理待处理的请求
                _processPendingSmartReply();
            }
        }

        // [FIX] 处理待处理的推荐回复请求
        function _processPendingSmartReply() {
            if (_smartReplyPendingChatId) {
                const pendingId = _smartReplyPendingChatId;
                _smartReplyPendingChatId = null;
                // 延迟100ms执行，避免同步递归
                setTimeout(() => {
                    if (activeChatId === pendingId && isSmartReplyEnabled(pendingId)) {
                        generateSmartReplies(pendingId);
                    }
                }, 100);
            }
        }

        // 显示推荐回复
        function displaySmartReplies(replies) {
            const bar = document.getElementById('smart-reply-bar');
            const list = document.getElementById('smart-reply-list');
            if (!bar || !list) return;
            
            bar.style.display = 'flex';
            list.innerHTML = replies.map((reply, idx) =>
                `<div class="smart-reply-item" onclick="selectSmartReply(${idx})" title="${reply.replace(/"/g, '&quot;')}">${reply}</div>`
            ).join('');
        }

        // 选择推荐回复 → 填入输入框
        function selectSmartReply(idx) {
            const cache = _smartReplyCache[activeChatId];
            if (!cache || !cache.replies[idx]) return;
            
            const input = document.getElementById('chat-input');
            if (input) {
                input.value = cache.replies[idx];
                input.focus();
            }
            // 不自动隐藏推荐回复，用户可以选择直接发送或修改
        }

        // 刷新推荐回复（带重试）
        let _smartReplyRefreshRetries = 0;
        function refreshSmartReplies() {
            if (_smartReplyGenerating) return;
            
            // 清除当前聊天的缓存
            if (activeChatId && _smartReplyCache[activeChatId]) {
                delete _smartReplyCache[activeChatId];
            }
            
            // 刷新按钮旋转动画
            const refreshBtn = document.getElementById('smart-reply-refresh');
            if (refreshBtn) {
                refreshBtn.classList.add('spinning');
                setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
            }
            
            // 重新生成（带重试逻辑）
            if (activeChatId) {
                _smartReplyRefreshRetries = 0;
                _doRefreshSmartReplies(activeChatId);
            }
        }

        async function _doRefreshSmartReplies(chatId) {
            try {
                await generateSmartReplies(chatId);
                // 检查是否生成成功（有缓存说明成功了）
                if (!_smartReplyCache[chatId] && _smartReplyRefreshRetries < 2) {
                    _smartReplyRefreshRetries++;
                    console.log(`[SmartReply] 刷新重试 ${_smartReplyRefreshRetries}/2`);
                    setTimeout(() => _doRefreshSmartReplies(chatId), 1000);
                }
            } catch (e) {
                if (_smartReplyRefreshRetries < 2) {
                    _smartReplyRefreshRetries++;
                    console.log(`[SmartReply] 刷新重试 ${_smartReplyRefreshRetries}/2`);
                    setTimeout(() => _doRefreshSmartReplies(chatId), 1000);
                }
            }
        }

        // 隐藏推荐回复
        function hideSmartReply() {
            const bar = document.getElementById('smart-reply-bar');
            if (bar) bar.style.display = 'none';
        }

        // 关闭（叉掉）推荐回复 - 保留函数兼容性但不再使用
        function dismissSmartReply() {
            hideSmartReply();
        }

        // 重新开启推荐回复 - 保留函数兼容性但不再使用
        function enableSmartReply() {
            if (typeof checkSmartReply === 'function') checkSmartReply();
        }

        // 重置推荐回复UI（切换聊天时使用）
        function resetSmartReplyState() {
            const bar = document.getElementById('smart-reply-bar');
            if (bar) bar.style.display = 'none';
        }

        // ===== 时空系统智能推荐回复 (Spacetime Smart Reply) =====
        let _stSmartReplyGenerating = false;
        let _stSmartReplyCache = null; // { dialogLen: number, replies: [] }

        // 检查是否应显示时空推荐回复
        function checkStSmartReply() {
            if (!spacetimeState.active || spacetimeState.generating) {
                hideStSmartReply();
                return;
            }
            // 检查当前聊天是否开启了推荐回复
            if (!isSmartReplyEnabled(activeChatId)) { hideStSmartReply(); return; }
            const dh = spacetimeState.dialogHistory;
            if (dh.length === 0) { hideStSmartReply(); return; }

            const lastEntry = dh[dh.length - 1];
            // 只有当最后一条是旁白或伴侣说话时才生成推荐
            if (lastEntry.role !== 'narrator' && lastEntry.role !== 'partner') {
                hideStSmartReply();
                return;
            }

            // 检查缓存
            if (_stSmartReplyCache && _stSmartReplyCache.dialogLen === dh.length && _stSmartReplyCache.replies.length > 0) {
                displayStSmartReplies(_stSmartReplyCache.replies);
                return;
            }

            generateStSmartReplies();
        }

        // 生成时空推荐回复
        async function generateStSmartReplies() {
            if (_stSmartReplyGenerating) return;
            _stSmartReplyGenerating = true;

            const bar = document.getElementById('st-smart-reply-bar');
            const list = document.getElementById('st-smart-reply-list');
            if (!bar || !list) { _stSmartReplyGenerating = false; return; }

            // 显示加载状态
            bar.style.display = 'flex';
            list.innerHTML = '<div class="smart-reply-loading"><span>推荐行动生成中</span><div class="dot-pulse"><span></span><span></span><span></span></div></div>';

            try {
                const st = spacetimeState;
                const space = getCurrentCoupleSpace();
                const partner = space ? store.contacts.find(x => x.id === space.partnerId) : null;
                const partnerName = partner ? partner.name : 'TA';
                const isSolo = st.soloMode;

                // 获取最近对话上下文
                const recentDialog = st.dialogHistory.slice(-6).map(d => {
                    const truncText = d.text.length > 100 ? d.text.substring(0, 100) + '...' : d.text;
                    if (d.role === 'narrator') return `[旁白] ${truncText}`;
                    if (d.role === 'partner') return `[${partnerName}] ${truncText}`;
                    if (d.role === 'user') return `[你] ${truncText}`;
                    if (d.role === 'system') return `[系统] ${truncText}`;
                    return '';
                }).filter(Boolean).join('\n');

                const sysPrompt = `你是时空穿越互动小说的行动建议生成器。根据当前场景和对话上下文，为穿越者生成3条不同方向的行动建议。

当前时空：${st.era.name}（${st.era.year}）
场景：${st.era.desc}
${isSolo ? '穿越模式：单人穿越' : `伴侣：${partnerName}`}

要求：
1. 每条建议简短精炼，不超过20个字
2. 3条建议要覆盖不同方向：比如探索环境、与人互动/对话、做某个具体动作
3. 建议要贴合当前场景和剧情走向，自然且有趣
4. 用第一人称视角，像"我想..."或直接描述动作
5. 不要使用引号

严格按以下格式输出，每行一条，共3行：
建议1
建议2
建议3`;

                const msgs = [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: `当前场景对话：\n${recentDialog}\n\n请生成3条行动建议。` }
                ];

                const data = await API.chatCompletion(msgs, { temperature: 0.9, silent: true, scene: 'action-suggest' });

                if (!spacetimeState.active) { _stSmartReplyGenerating = false; return; }

                if (!data || !data.choices || !data.choices[0]?.message?.content) {
                    hideStSmartReply();
                    _stSmartReplyGenerating = false;
                    return;
                }

                const replyText = data.choices[0].message.content.trim();
                const replies = replyText.split('\n')
                    .map(line => line.replace(/^\d+[\.\)、]\s*/, '').replace(/^["'"']|["'"']$/g, '').trim())
                    .filter(line => line.length > 0 && line.length <= 40)
                    .slice(0, 3);

                if (replies.length === 0) {
                    hideStSmartReply();
                    _stSmartReplyGenerating = false;
                    return;
                }

                _stSmartReplyCache = {
                    dialogLen: st.dialogHistory.length,
                    replies: replies
                };

                displayStSmartReplies(replies);
            } catch (err) {
                console.error('[StSmartReply] 生成失败:', err);
                hideStSmartReply();
            } finally {
                _stSmartReplyGenerating = false;
            }
        }

        // 显示时空推荐回复
        function displayStSmartReplies(replies) {
            const bar = document.getElementById('st-smart-reply-bar');
            const list = document.getElementById('st-smart-reply-list');
            if (!bar || !list) return;

            bar.style.display = 'flex';
            list.innerHTML = replies.map((reply, idx) =>
                `<div class="smart-reply-item" onclick="selectStSmartReply(${idx})" title="${reply.replace(/"/g, '&quot;')}">${reply}</div>`
            ).join('');
        }

        // 选择时空推荐回复 → 填入自由输入框并打开
        function selectStSmartReply(idx) {
            if (!_stSmartReplyCache || !_stSmartReplyCache.replies[idx]) return;

            // 打开自由输入模式
            const actionBtns = document.getElementById('st-action-btns');
            const customInput = document.getElementById('st-custom-input');
            const textInput = document.getElementById('st-custom-text');

            if (actionBtns) actionBtns.style.display = 'none';
            if (customInput) customInput.style.display = 'flex';
            if (textInput) {
                textInput.value = _stSmartReplyCache.replies[idx];
                textInput.focus();
            }
        }

        // 刷新时空推荐回复
        function refreshStSmartReplies() {
            if (_stSmartReplyGenerating) return;
            _stSmartReplyCache = null;

            const refreshBtn = document.getElementById('st-smart-reply-refresh');
            if (refreshBtn) {
                refreshBtn.classList.add('spinning');
                setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
            }

            generateStSmartReplies();
        }

        // 隐藏时空推荐回复
        function hideStSmartReply() {
            const bar = document.getElementById('st-smart-reply-bar');
            if (bar) bar.style.display = 'none';
        }

        // 关闭（叉掉）时空推荐回复 - 保留函数兼容性但不再使用
        function dismissStSmartReply() {
            hideStSmartReply();
        }

        // 重新开启时空推荐回复 - 保留函数兼容性但不再使用
        function enableStSmartReply() {
            if (typeof checkStSmartReply === 'function') checkStSmartReply();
        }
