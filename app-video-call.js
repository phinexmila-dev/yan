// ============================================
// VIDEO CALL MODULE
// 视频通话模块：摄像头/抓帧/环境识别/Live2D伪装
// ============================================

(function() {
    'use strict';

    // ========== 视频通话状态 ==========
    const vidCallState = {
        active: false,
        startTime: 0,
        timerInterval: null,
        micMuted: false,
        speakerOn: true,
        isSpeaking: false,       // AI正在说话
        isIncoming: false,       // 是否来电

        // 摄像头相关
        cameraOn: false,
        facingMode: 'user',       // 'user'=前置, 'environment'=后置
        localStream: null,

        // 环境识别
        captureInterval: null,
        captureFrequency: 5000,   // 每5秒抓帧
        envContext: '',            // 最新环境描述
        envAnalyzing: false,      // 是否正在分析

        // PTT相关
        _pttActive: false,
        _pttSafetyTimer: null,
        _pttServiceCheckTimer: null,
        _pttGotResult: false,

        // STT API相关
        _sttMediaRecorder: null,
        _sttStream: null,
        _sttAudioCtx: null,

        // 语音识别
        recognition: null,

        // Live2D伪装
        live2d: null,
    };

    // 暴露给全局
    window._vidCallState = vidCallState;

    // [FIX-去重] 视频通话对话历史，用于给AI提供上下文避免重复
    let _vidCallConversationHistory = [];

    // [新增] 将视频通话内容保存到记忆系统
    function _saveVidCallToMemory(contactId, durationText) {
        if (!contactId || !_vidCallConversationHistory || _vidCallConversationHistory.length < 1) return;
        try {
            const contact = store.contacts.find(c => c.id === contactId);
            if (!contact) return;
            const userName = (typeof getUserPersonaName === 'function') ? getUserPersonaName(contact, store.user.name || '用户') : (store.user.name || '用户');

            // 构建通话内容摘要
            const recentHistory = _vidCallConversationHistory.slice(-30);
            let conversationText = recentHistory.map(h => {
                if (h.role === 'user') return `${userName}: ${h.text}`;
                if (h.role === 'ai') return `${contact.name}: ${h.text}`;
                return '';
            }).filter(s => s).join('\n');

            if (!conversationText || conversationText.length < 20) return;

            if (!store.memorySummaries) store.memorySummaries = {};
            if (!store.memorySummaries[contactId]) store.memorySummaries[contactId] = [];

            if (conversationText.length > 800) {
                conversationText = conversationText.substring(0, 800) + '...';
            }

            // [FIX-通话记忆总结] 先保存原始通话记录
            const memoryContent = `[视频通话记录，时长${durationText}] ${conversationText}`;
            const _vcMemo = {
                id: 'memo_call_' + Date.now(),
                date: Date.now(),
                content: memoryContent,
                source: 'video_call',
                fictional: false
            };
            store.memorySummaries[contactId].push(_vcMemo);
            // [FIX-记忆重构v3] 同步到新记忆系统，传入 channel 和 eventTime
            try {
                if (window.MemorySystem && window.MemorySystem.Pipeline) {
                    window.MemorySystem.Pipeline.addManual(contactId, _vcMemo.content, {
                        tags: ['video_call'],
                        channel: 'video_call',
                        scene: '视频通话',
                        eventTime: Date.now()
                    });
                }
            } catch(_e) {}

            if (store.memorySummaries[contactId].length > 100) {
                store.memorySummaries[contactId] = store.memorySummaries[contactId].slice(-80);
            }

            // [FIX-通话记忆总结] 如果联系人开启了自动记忆总结，使用AI对通话内容进行总结
            if (contact.settings?.enableMemorySummary && typeof API !== 'undefined') {
                _autoSummarizeCallContent(contactId, contact, userName, conversationText, '视频通话', durationText);
            }

            console.log('[视频通话] 通话记忆已保存，联系人:', contact.name);
        } catch(e) {
            console.warn('保存视频通话记忆失败:', e);
        }
    }

    // [新增] 自动AI总结通话内容
    async function _autoSummarizeCallContent(contactId, contact, userName, conversationText, callTypeLabel, durationText) {
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

            const _vcSumMemo = {
                id: 'memo_call_summary_' + Date.now(),
                date: Date.now(),
                content: `[通话总结] ${summaryText}`,
                source: 'call_summary',
                fictional: false
            };
            store.memorySummaries[contactId].push(_vcSumMemo);
            // [FIX-记忆重构v3] 同步到新记忆系统，传入 channel 和 eventTime
            try {
                if (window.MemorySystem && window.MemorySystem.Pipeline) {
                    window.MemorySystem.Pipeline.addManual(contactId, _vcSumMemo.content, {
                        tags: ['call_summary'],
                        channel: 'call_summary',
                        scene: '通话总结',
                        eventTime: Date.now()
                    });
                }
            } catch(_e) {}

            if (typeof save === 'function') save();
            else if (typeof saveStore === 'function') saveStore();
            console.log(`[${callTypeLabel}] AI总结已生成，联系人:`, contactName);
        } catch(e) {
            console.warn(`${callTypeLabel}AI总结生成失败:`, e);
        }
    }

    // ========== PIP小窗拖动 ==========
    (function initPipDrag() {
        const pip = document.getElementById('vidcall-local-pip');
        if (!pip) return;
        let startX, startY, initX, initY, dragging = false;

        function onStart(e) {
            dragging = true;
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            initX = pip.offsetLeft;
            initY = pip.offsetTop;
            pip.style.transition = 'none';
        }
        function onMove(e) {
            if (!dragging) return;
            e.preventDefault();
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            pip.style.left = (initX + dx) + 'px';
            pip.style.top = (initY + dy) + 'px';
            pip.style.right = 'auto';
        }
        function onEnd() {
            if (!dragging) return;
            dragging = false;
            pip.style.transition = 'left 0.3s, top 0.3s, right 0.3s';
            // Snap to nearest corner
            const parent = pip.parentElement;
            if (!parent) return;
            const pw = parent.offsetWidth;
            const ph = parent.offsetHeight;
            const cx = pip.offsetLeft + pip.offsetWidth / 2;
            const cy = pip.offsetTop + pip.offsetHeight / 2;
            const margin = 15;
            if (cx < pw / 2) {
                pip.style.left = margin + 'px';
                pip.style.right = 'auto';
            } else {
                pip.style.left = 'auto';
                pip.style.right = margin + 'px';
            }
            if (cy < ph / 2) {
                pip.style.top = Math.max(100, pip.offsetTop) + 'px';
            } else {
                pip.style.top = Math.min(ph - pip.offsetHeight - 200, pip.offsetTop) + 'px';
            }
        }

        pip.addEventListener('touchstart', onStart, { passive: true });
        pip.addEventListener('touchmove', onMove, { passive: false });
        pip.addEventListener('touchend', onEnd);
        pip.addEventListener('touchcancel', onEnd);
        pip.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
    })();

    // ========== Touch Guard ==========
    (function initVidCallTouchGuard() {
        const layer = document.getElementById('layer-video-call');
        if (!layer) return;

        // [FIX] 让layer可以接收焦点（用于sendVideoCallText中的layer.focus()）
        if (!layer.hasAttribute('tabindex')) {
            layer.setAttribute('tabindex', '-1');
            layer.style.outline = 'none';
        }

        layer.addEventListener('touchmove', function(e) {
            if (!e.target.closest('#vidcall-history-content')) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, { passive: false });
        layer.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            // [FIX] 设置阻断标记，防止触摸视频通话layer时触发全局长按
            window._lastInputTouchTime = Date.now();
        }, { passive: true });
        layer.addEventListener('touchend', function(e) {
            e.stopPropagation();
        }, { passive: true });

        // [FIX] 拦截视频通话layer内的所有键盘事件，防止穿透到底层chat-input
        layer.addEventListener('keydown', function(e) {
            e.stopPropagation();
            // 如果是Enter键且目标是vidcall-input，让onkeydown处理
            // 其他情况阻止冒泡即可
        }, { capture: false });
        layer.addEventListener('keypress', function(e) {
            e.stopPropagation();
        }, { capture: false });
        layer.addEventListener('keyup', function(e) {
            e.stopPropagation();
        }, { capture: false });

        // [FIX] 拦截click事件，防止穿透到底层
        layer.addEventListener('click', function(e) {
            e.stopPropagation();
        }, { capture: false });
    })();

    // ========== Pseudo Live2D Engine ==========
    class PseudoLive2D {
        /**
         * @param {HTMLCanvasElement} canvas
         * @param {string} imageUrl - 头像或背景图片URL
         * @param {object} options - { mode: 'avatar'|'background', dynamic: false }
         */
        constructor(canvas, imageUrl, options = {}) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.mode = options.mode || 'avatar'; // 'avatar' = 头像动态, 'background' = 背景图
            this.dynamic = options.dynamic || false; // 背景模式下是否开启动态渲染
            this.avatarLoaded = false;
            this.avatar = new Image();
            this.avatar.crossOrigin = 'anonymous';
            this.avatar.onload = () => {
                this.avatarLoaded = true;
                // Set canvas size to match container
                const parent = canvas.parentElement;
                if (parent) {
                    canvas.width = parent.offsetWidth;
                    canvas.height = parent.offsetHeight;
                }
            };
            this.avatar.src = imageUrl;

            this.state = {
                breathPhase: 0,
                isSpeaking: false,
                bgParticles: [],
            };

            this.animId = null;
            this.running = false;

            // 初始化粒子（用于背景动态渲染）
            if (this.mode === 'background' && this.dynamic) {
                this._initParticles();
            }
        }

        _initParticles() {
            this.state.bgParticles = [];
            for (let i = 0; i < 25; i++) {
                this.state.bgParticles.push({
                    x: Math.random(),
                    y: Math.random(),
                    size: Math.random() * 3 + 1,
                    speed: Math.random() * 0.0005 + 0.0001,
                    alpha: Math.random() * 0.3 + 0.05,
                    phase: Math.random() * Math.PI * 2,
                    wobble: Math.random() * 0.01 + 0.003,
                });
            }
        }

        start() {
            this.running = true;
            this._render();
        }

        stop() {
            this.running = false;
            if (this.animId) {
                cancelAnimationFrame(this.animId);
                this.animId = null;
            }
        }

        setSpeaking(val) {
            this.state.isSpeaking = val;
        }

        _render() {
            if (!this.running) return;

            if (this.mode === 'background') {
                this._renderBackground();
            } else {
                this._renderAvatar();
            }

            this.animId = requestAnimationFrame(() => this._render());
        }

        // ===== 背景图模式渲染 =====
        _renderBackground() {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.clearRect(0, 0, w, h);

            if (!this.avatarLoaded) return;

            const s = this.state;
            const img = this.avatar;

            // 计算cover填充（完全覆盖画布）
            const imgAspect = img.width / img.height;
            const canvasAspect = w / h;
            let drawW, drawH, drawX, drawY;

            if (canvasAspect > imgAspect) {
                drawW = w;
                drawH = w / imgAspect;
            } else {
                drawH = h;
                drawW = h * imgAspect;
            }
            drawX = (w - drawW) / 2;
            drawY = (h - drawH) / 2;

            ctx.save();

            // 轻微呼吸效果：非常缓慢的微小缩放
            s.breathPhase += 0.008;
            const bgBreath = 1 + Math.sin(s.breathPhase * 0.5) * 0.003;

            ctx.translate(w / 2, h / 2);
            ctx.scale(bgBreath, bgBreath);
            ctx.translate(-w / 2, -h / 2);

            // 绘制背景图（完全填满）
            ctx.drawImage(img, drawX, drawY, drawW, drawH);

            ctx.restore();

            // 轻柔飘动光点粒子
            if (this.dynamic && s.bgParticles && s.bgParticles.length) {
                s.bgParticles.forEach(p => {
                    p.phase += p.speed * 60;
                    p.y -= p.speed * 0.8;
                    if (p.y < -0.05) {
                        p.y = 1.05;
                        p.x = Math.random();
                        p.size = Math.random() * 3 + 1;
                    }
                    const wobbleAmt = (p.wobble || 0.005) * w;
                    const px = p.x * w + Math.sin(p.phase) * wobbleAmt;
                    const py = p.y * h;
                    const pAlpha = p.alpha * (0.5 + 0.5 * Math.sin(p.phase * 2));

                    ctx.beginPath();
                    ctx.arc(px, py, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255,255,255,${pAlpha})`;
                    ctx.fill();
                });
            }
        }

        // ===== 头像模式渲染 =====
        _renderAvatar() {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            ctx.clearRect(0, 0, w, h);

            // 背景渐变
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, '#1a1a2e');
            grad.addColorStop(1, '#16213e');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h);

            if (!this.avatarLoaded) return;

            const s = this.state;

            // 轻微呼吸效果
            s.breathPhase += 0.02;
            const breathScale = 1 + Math.sin(s.breathPhase) * 0.005;
            const breathY = Math.sin(s.breathPhase) * 1.5;

            // 计算头像绘制参数 - cover模式填满整个画布
            const imgAspect = this.avatar.width / this.avatar.height;
            const canvasAspect = w / h;
            let drawW, drawH;
            if (canvasAspect > imgAspect) {
                drawW = w;
                drawH = w / imgAspect;
            } else {
                drawH = h;
                drawW = h * imgAspect;
            }
            const drawX = (w - drawW) / 2;
            const drawY = (h - drawH) / 2;

            ctx.save();

            // 应用轻微呼吸
            ctx.translate(w / 2, h / 2);
            ctx.scale(breathScale, breathScale);
            ctx.translate(-w / 2, -h / 2 + breathY);

            // 绘制头像
            ctx.drawImage(this.avatar, drawX, drawY, drawW, drawH);

            ctx.restore();
        }

        updateAvatar(url) {
            this.avatarLoaded = false;
            this.avatar.src = url;
        }

        resize() {
            const parent = this.canvas.parentElement;
            if (parent) {
                this.canvas.width = parent.offsetWidth;
                this.canvas.height = parent.offsetHeight;
            }
        }
    }

    // ========== 启动视频通话 ==========
    let _vidCallLastTime = 0;

    window.startVideoCall = function() {
        closeExtMenu();

        // Guards (复用语音通话的安全检查)
        const chatLayer = document.getElementById('layer-chat');
        if (!chatLayer || !chatLayer.classList.contains('show')) return;
        const desktopLayer = document.getElementById('layer-desktop');
        if (desktopLayer && desktopLayer.classList.contains('active')) return;
        const settingsLayer = document.getElementById('layer-settings');
        if (settingsLayer && settingsLayer.classList.contains('show')) return;
        const beautyLayer = document.getElementById('layer-beauty');
        if (beautyLayer && beautyLayer.classList.contains('show')) return;
        const mapLayer = document.getElementById('layer-map');
        if (mapLayer && mapLayer.classList.contains('show')) return;
        const anyNonWxLayer = document.querySelector('.layer.show:not(#layer-wechat):not(#layer-video-call):not(#layer-voice-call):not(#layer-chat)');
        if (anyNonWxLayer) return;
        const activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) return;
        const chatSettingsLayer = document.getElementById('layer-chat-settings');
        if (chatSettingsLayer && chatSettingsLayer.classList.contains('show')) return;
        if (window._lastInputTouchTime && (Date.now() - window._lastInputTouchTime) < 1000) return;

        if (!activeChatId) return toast("请先选择联系人");

        const now = Date.now();
        if (now - _vidCallLastTime < 2000) return;
        _vidCallLastTime = now;

        // 如果已在视频通话中（最小化），恢复显示
        if (vidCallState.active) {
            const layer = document.getElementById('layer-video-call');
            if (layer && !layer.classList.contains('show')) {
                layer.classList.add('show');
                _removeVidCallMiniBubble();
                return;
            }
            return;
        }

        // 如果语音通话中，不允许同时视频通话
        if (store.callState && store.callState.active) {
            return toast("正在语音通话中，请先挂断");
        }

        const layer = document.getElementById('layer-video-call');
        if (layer && layer.classList.contains('show')) return;

        const contact = store.contacts.find(c => c.id === activeChatId);
        if (!contact) return toast("找不到联系人");

        showConfirm('视频通话', `确定要给 ${contact.name} 发起视频通话吗？`, () => {
            _doStartVideoCall(contact, false);
        });
    };

    function _doStartVideoCall(contact, isIncoming) {
        // 清理上一次残留
        try {
            if (vidCallState.timerInterval) { clearInterval(vidCallState.timerInterval); vidCallState.timerInterval = null; }
            if (vidCallState.recognition) {
                vidCallState.recognition.onend = null;
                vidCallState.recognition.onerror = null;
                try { vidCallState.recognition.stop(); } catch(e) {}
                vidCallState.recognition = null;
            }
            vidCallState.isSpeaking = false;
        } catch(e) { console.warn('VidCall cleanup error', e); }

        // 停止音乐
        const gAudio = document.getElementById('global-audio');
        if (gAudio && !gAudio.paused) {
            gAudio.pause();
            if (store.listenState) {
                store.listenState.playing = false;
                if (typeof updateListenUI === 'function') updateListenUI();
            }
        }

        // UI Init
        document.getElementById('vidcall-remote-name').innerText = contact.name;
        document.getElementById('vidcall-status').innerText = isIncoming ? "正在接听..." : "正在呼叫...";
        _updateVidCallSubtitle("");
        document.getElementById('vidcall-timer').innerText = "00:00";
        document.getElementById('vidcall-history-content').innerHTML = '';
        // [FIX-去重] 新通话开始时清空对话历史
        _vidCallConversationHistory = [];
        // [FIX-麦克风按钮] 新通话开始时清空缓存的文字
        _vidCallPendingTexts = [];
        document.getElementById('vidcall-text-input-box').style.display = 'none';
        document.getElementById('vidcall-history-panel').style.display = 'none';
        document.querySelectorAll('.vidcall-btn.active').forEach(b => b.classList.remove('active'));

        // 隐藏环境标签
        document.getElementById('vidcall-env-badge').style.display = 'none';
        document.getElementById('vidcall-env-text').innerText = '';

        // 摄像头默认关闭
        vidCallState.cameraOn = false;
        vidCallState.facingMode = 'user';
        document.getElementById('vidcall-local-placeholder').style.display = 'flex';
        document.getElementById('vidcall-local-video').style.display = 'none';
        document.getElementById('vidcall-btn-camera').classList.remove('active');

        // 初始化Live2D / 背景图模式
        const canvas = document.getElementById('vidcall-live2d-canvas');
        if (vidCallState.live2d) {
            vidCallState.live2d.stop();
        }

        // 判断是否有视频通话背景图
        const hasVidcallBg = contact.settings && contact.settings.vidcallBg;
        const vidcallDynamic = contact.settings && contact.settings.vidcallDynamic;

        if (hasVidcallBg) {
            // 使用用户上传的视频通话背景图
            vidCallState.live2d = new PseudoLive2D(canvas, contact.settings.vidcallBg, {
                mode: 'background',
                dynamic: !!vidcallDynamic
            });
        } else {
            // 没有自定义背景，使用头像模式
            const avatarUrl = contact.avatar || _ph(400);
            vidCallState.live2d = new PseudoLive2D(canvas, avatarUrl, { mode: 'avatar' });
        }
        vidCallState.live2d.start();

        // 清除layer级别背景（不再使用layer背景，由canvas全覆盖）
        const layer = document.getElementById('layer-video-call');
        layer.style.backgroundImage = '';
        layer.style.backgroundSize = '';
        layer.style.backgroundPosition = '';
        layer.classList.add('show');

        // 关闭字体设置面板
        const fontPanel = document.getElementById('vidcall-font-settings');
        if (fontPanel) fontPanel.style.display = 'none';
        _applyVidCallFont();

        // 播放铃声
        if (typeof playRingtone === 'function') playRingtone();

        // State Init
        vidCallState.active = true;
        vidCallState.startTime = Date.now();
        vidCallState.micMuted = false;
        vidCallState.speakerOn = true;
        vidCallState.isIncoming = !!isIncoming;
        vidCallState.envContext = '';

        // Start Timer
        vidCallState.timerInterval = setInterval(() => {
            if (!vidCallState.active) { clearInterval(vidCallState.timerInterval); return; }
            const diff = Math.floor((Date.now() - vidCallState.startTime) / 1000);
            const m = Math.floor(diff / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            document.getElementById('vidcall-timer').innerText = `${m}:${s}`;
        }, 1000);

        // PTT区域
        document.getElementById('vidcall-ptt-area').style.display = 'flex';
        const transcript = document.getElementById('vidcall-live-transcript');
        if (transcript) transcript.classList.remove('active');
        const transcriptContent = document.getElementById('vidcall-live-transcript-content');
        if (transcriptContent) transcriptContent.innerHTML = '';

        // 连接延迟
        const connectDelay = isIncoming ? 500 : 1500;
        setTimeout(() => {
            if (!vidCallState.active) return;
            document.getElementById('vidcall-status').innerText = "通话中";
            if (typeof stopRingtone === 'function') stopRingtone();
            if (typeof playVoiceSystemSound === 'function') playVoiceSystemSound('connect');
        }, connectDelay);
    }

    // ========== 挂断视频通话 ==========
    window.endVideoCall = function() {
        let callDuration = vidCallState.startTime ? Math.floor((Date.now() - vidCallState.startTime) / 1000) : 0;
        if (callDuration > 86400 || callDuration < 0) callDuration = 0;
        const callContactId = activeChatId;
        const callIsIncoming = !!vidCallState.isIncoming;

        // 立即标记
        vidCallState.active = false;
        vidCallState.isSpeaking = false;
        vidCallState._pttActive = false;
        // [FIX-麦克风按钮] 通话结束时清空缓存的文字
        _vidCallPendingTexts = [];

        // 停止铃声
        if (typeof stopRingtone === 'function') stopRingtone();
        _removeVidCallMiniBubble();
        if (vidCallState.timerInterval) { clearInterval(vidCallState.timerInterval); vidCallState.timerInterval = null; }

        // 停止TTS
        try { const audio = document.getElementById('tts-audio'); if (audio) { audio.pause(); audio.currentTime = 0; } } catch(e) {}

        // [新增] 清除isSpeaking安全守卫
        if (typeof _clearSpeakingGuard === 'function') _clearSpeakingGuard();

        // 停止摄像头
        _stopCamera();

        // 停止抓帧
        _stopFrameCapture();

        // 停止Live2D
        if (vidCallState.live2d) {
            vidCallState.live2d.stop();
            vidCallState.live2d = null;
        }

        // 重置UI
        document.querySelectorAll('.vidcall-btn.active').forEach(b => b.classList.remove('active'));
        const pttBtn = document.getElementById('vidcall-ptt-btn');
        if (pttBtn) pttBtn.classList.remove('pressing');
        const pttHint = document.getElementById('vidcall-ptt-hint');
        if (pttHint) { pttHint.textContent = '按住说话'; pttHint.classList.remove('recording'); }
        const transcript = document.getElementById('vidcall-live-transcript');
        if (transcript) transcript.classList.remove('active');
        const textBox = document.getElementById('vidcall-text-input-box');
        if (textBox) textBox.style.display = 'none';
        const histPanel = document.getElementById('vidcall-history-panel');
        if (histPanel) histPanel.style.display = 'none';

        if (typeof playVoiceSystemSound === 'function') playVoiceSystemSound('hangup');
        setTimeout(() => {
            document.getElementById('layer-video-call').classList.remove('show');
        }, 300);

        // 异步清理
        setTimeout(() => {
            if (vidCallState._pttServiceCheckTimer) { clearTimeout(vidCallState._pttServiceCheckTimer); vidCallState._pttServiceCheckTimer = null; }
            if (vidCallState._pttSafetyTimer) { clearTimeout(vidCallState._pttSafetyTimer); vidCallState._pttSafetyTimer = null; }
            if (vidCallState.recognition) {
                vidCallState.recognition.onend = null;
                vidCallState.recognition.onerror = null;
                vidCallState.recognition.onresult = null;
                try { vidCallState.recognition.stop(); } catch(e) {}
                vidCallState.recognition = null;
            }
            _stopVidCallSTT();

            // 添加通话记录
            if (callContactId && callDuration > 0) {
                if (!store.chats[callContactId]) store.chats[callContactId] = [];
                const minutes = Math.floor(callDuration / 60);
                const seconds = callDuration % 60;
                const durationText = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                // [新增-通话记录] 将通话对话内容保存到消息中，便于点击气泡查看
                let _vidCallDialogText = '';
                if (_vidCallConversationHistory && _vidCallConversationHistory.length > 0) {
                    const contact = store.contacts.find(c => c.id === callContactId);
                    const userName = (typeof getUserPersonaName === 'function' && contact) ? getUserPersonaName(contact, store.user.name || '用户') : (store.user.name || '用户');
                    const contactName = contact ? contact.name : '对方';
                    _vidCallDialogText = _vidCallConversationHistory.map(h => {
                        if (h.role === 'user') return userName + ': ' + h.text;
                        if (h.role === 'ai') return contactName + ': ' + h.text;
                        return '';
                    }).filter(s => s).join('\n');
                    if (_vidCallDialogText.length > 2000) _vidCallDialogText = _vidCallDialogText.substring(0, 2000) + '...';
                }
                store.chats[callContactId].push({
                    sender: callIsIncoming ? 'ai' : 'me',
                    type: 'video_call',
                    content: durationText,
                    duration: callDuration,
                    time: Date.now(),
                    callDialog: _vidCallDialogText || ''
                });

                // [新增] 将视频通话内容保存到记忆系统
                _saveVidCallToMemory(callContactId, durationText);

                requestAnimationFrame(() => {
                    save();
                    if (activeChatId === callContactId && typeof renderHistory === 'function') {
                        renderHistory();
                    }
                });
            }
        }, 50);
    };

    // ========== 摄像头控制 ==========
    window.toggleVidCallCamera = async function() {
        if (vidCallState.cameraOn) {
            _stopCamera();
            _stopFrameCapture();
            vidCallState.cameraOn = false;
            document.getElementById('vidcall-local-placeholder').style.display = 'flex';
            document.getElementById('vidcall-local-video').style.display = 'none';
            document.getElementById('vidcall-btn-camera').classList.remove('active');
            document.getElementById('vidcall-env-badge').style.display = 'none';
        } else {
            try {
                vidCallState.localStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: vidCallState.facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
                    audio: false
                });
                const videoEl = document.getElementById('vidcall-local-video');
                videoEl.srcObject = vidCallState.localStream;
                videoEl.style.display = 'block';
                // 前置镜像，后置不镜像
                videoEl.style.transform = vidCallState.facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
                document.getElementById('vidcall-local-placeholder').style.display = 'none';
                vidCallState.cameraOn = true;
                document.getElementById('vidcall-btn-camera').classList.add('active');
                _startFrameCapture();
            } catch(e) {
                console.error('摄像头打开失败:', e);
                toast('摄像头访问失败，请检查权限', 'error');
            }
        }
    };

    window.flipVidCallCamera = async function() {
        if (!vidCallState.cameraOn) {
            toast('请先开启摄像头');
            return;
        }
        // 切换方向
        vidCallState.facingMode = vidCallState.facingMode === 'user' ? 'environment' : 'user';

        // 停止当前流
        _stopCamera();

        try {
            vidCallState.localStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: vidCallState.facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });
            const videoEl = document.getElementById('vidcall-local-video');
            videoEl.srcObject = vidCallState.localStream;
            videoEl.style.display = 'block';
            videoEl.style.transform = vidCallState.facingMode === 'user' ? 'scaleX(-1)' : 'scaleX(1)';
            toast(vidCallState.facingMode === 'user' ? '已切换前置摄像头' : '已切换后置摄像头');
        } catch(e) {
            console.error('摄像头切换失败:', e);
            toast('摄像头切换失败', 'error');
            vidCallState.cameraOn = false;
            document.getElementById('vidcall-local-placeholder').style.display = 'flex';
            document.getElementById('vidcall-local-video').style.display = 'none';
            document.getElementById('vidcall-btn-camera').classList.remove('active');
        }
    };

    function _stopCamera() {
        if (vidCallState.localStream) {
            vidCallState.localStream.getTracks().forEach(t => t.stop());
            vidCallState.localStream = null;
        }
        const videoEl = document.getElementById('vidcall-local-video');
        if (videoEl) videoEl.srcObject = null;
    }

    // ========== 抓帧 + 环境识别 ==========
    function _startFrameCapture() {
        _stopFrameCapture();
        // 先立即抓一帧
        _captureAndAnalyze();
        vidCallState.captureInterval = setInterval(_captureAndAnalyze, vidCallState.captureFrequency);
    }

    function _stopFrameCapture() {
        if (vidCallState.captureInterval) {
            clearInterval(vidCallState.captureInterval);
            vidCallState.captureInterval = null;
        }
    }

    async function _captureAndAnalyze() {
        if (!vidCallState.cameraOn || !vidCallState.active) return;
        if (vidCallState.envAnalyzing) return; // 上一次还没分析完

        const video = document.getElementById('vidcall-local-video');
        if (!video || video.videoWidth === 0) return;

        const canvas = document.getElementById('vidcall-capture-canvas');
        const ctx = canvas.getContext('2d');

        // 压缩为小尺寸
        canvas.width = 320;
        canvas.height = 240;
        ctx.drawImage(video, 0, 0, 320, 240);

        const base64 = canvas.toDataURL('image/jpeg', 0.5);

        vidCallState.envAnalyzing = true;
        try {
            // 直接用用户已有的聊天API发送多模态消息
            const data = await API.chatCompletion([
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: '简要描述图片中的环境场景。包括：地点类型（室内/室外/车内等）、光线明暗、可见的主要物品或特征。30字以内中文，直接描述，不要说"图片中"。如果画面很暗，描述"光线昏暗的室内"而不是"黑乎乎的"。'
                            },
                            {
                                type: 'image_url',
                                image_url: { url: base64 }
                            }
                        ]
                    }
                ], 0.3, true); // silent=true
    
                if (data && data.choices && data.choices[0]) {
                    const envResult = data.choices[0].message.content.trim();
                    vidCallState.envContext = envResult;
                    _updateEnvBadge(envResult);
                }
        } catch(e) {
            // API不支持识图或请求失败，静默忽略
            console.warn('环境识别失败（API可能不支持识图）:', e.message);
        }
        vidCallState.envAnalyzing = false;
    }

    function _updateEnvBadge(text) {
        const badge = document.getElementById('vidcall-env-badge');
        const textEl = document.getElementById('vidcall-env-text');
        if (!badge || !textEl) return;
        if (text) {
            textEl.innerText = text;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    // ========== 获取当前摄像头帧（用于直接发送给AI） ==========
    function _captureCurrentFrame() {
        if (!vidCallState.cameraOn || !vidCallState.active) return null;
        const video = document.getElementById('vidcall-local-video');
        if (!video || video.videoWidth === 0) return null;
        try {
            const canvas = document.getElementById('vidcall-capture-canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 320;
            canvas.height = 240;
            ctx.drawImage(video, 0, 0, 320, 240);
            return canvas.toDataURL('image/jpeg', 0.5);
        } catch (e) {
            console.warn('[VidCall] 抓帧失败:', e.message);
            return null;
        }
    }

    // ========== 静音/键盘/最小化/更多 ==========
    // [FIX-麦克风按钮] 缓冲区：当麦克风关闭（静音）时，用户的话会被缓存
    let _vidCallPendingTexts = [];
    
    window.toggleVidCallMute = function() {
        vidCallState.micMuted = !vidCallState.micMuted;
        const btn = document.getElementById('vidcall-btn-mute');
        if (vidCallState.micMuted) {
            btn.classList.add('active');
            btn.title = '麦克风已关闭（说的话会被缓存，开启后联系人才会回复）';
            if (vidCallState.recognition) vidCallState.recognition.stop();
            if (typeof toast === 'function') toast('麦克风已关闭，你可以继续说话但对方不会立即回复', 'info');
        } else {
            btn.classList.remove('active');
            btn.title = '麦克风已开启（说完话联系人会立即回复）';
            // [FIX-麦克风按钮] 开启麦克风时，如果有缓存的文字，合并发送给AI
            if (_vidCallPendingTexts.length > 0) {
                const combinedText = _vidCallPendingTexts.join('。');
                _vidCallPendingTexts = [];
                if (typeof toast === 'function') toast('正在发送缓存的消息...', 'info');
                _showUserSubtitle(combinedText);
                _updateVidCallSubtitle("我: " + combinedText);
                _appendVidCallLog('me', combinedText);
                _processVideoInput(combinedText);
            } else {
                // ★ [FIX-麦克风重启] 没有缓存消息时，重启语音识别以继续监听
                if (vidCallState.active && vidCallState.recognition && !vidCallState.isSpeaking) {
                    setTimeout(() => {
                        try { vidCallState.recognition.start(); } catch(e) { console.log('[VidCall] 重启识别失败:', e); }
                    }, 200);
                }
            }
        }
    };

    window.toggleVidCallKeyboard = function() {
        const area = document.getElementById('vidcall-text-input-box');
        area.style.display = area.style.display === 'flex' ? 'none' : 'flex';
        if (area.style.display === 'flex') {
            // [FIX] 设置输入阻断标记，防止键盘弹出时触发长按通话
            window._lastInputTouchTime = Date.now();
            document.getElementById('vidcall-input').focus();
        }
    };

    function _removeVidCallMiniBubble() {
        const existing = document.getElementById('vidcall-mini-bubble');
        if (existing) existing.remove();
    }

    window.toggleVidCallMinimize = function() {
        document.getElementById('layer-video-call').classList.remove('show');
        _removeVidCallMiniBubble();
        const bubble = document.createElement('div');
        bubble.id = 'vidcall-mini-bubble';
        bubble.style.cssText = 'position:fixed;top:50px;right:10px;width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#4facfe,#00f2fe);z-index:9500;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(0,0,0,0.3);cursor:pointer;animation:vidcall-bubble-pulse 2s infinite;';
        bubble.innerHTML = '<i class="fas fa-video" style="color:#fff;font-size:22px;"></i>';
        bubble.onclick = function() {
            document.getElementById('layer-video-call').classList.add('show');
            _removeVidCallMiniBubble();
        };
        let _bubbleLongPress = null;
        bubble.ontouchstart = bubble.onmousedown = function() {
            _bubbleLongPress = setTimeout(function() {
                endVideoCall();
                _removeVidCallMiniBubble();
            }, 1000);
        };
        bubble.ontouchend = bubble.onmouseup = bubble.ontouchcancel = function() {
            if (_bubbleLongPress) { clearTimeout(_bubbleLongPress); _bubbleLongPress = null; }
        };
        document.getElementById('device').appendChild(bubble);
        toast("视频通话小窗 · 点击返回 · 长按挂断");
    };

    window.toggleVidCallMore = function() {
        const panel = document.getElementById('vidcall-history-panel');
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    };

    // 右上角查看对话历史按钮
    window.toggleVidCallHistory = function() {
        const panel = document.getElementById('vidcall-history-panel');
        if (!panel) return;
        panel.style.display = panel.style.display === 'flex' ? 'none' : 'flex';
    };

    // ========== 字体设置 ==========
    window.toggleVidCallFontSettings = function() {
        const panel = document.getElementById('vidcall-font-settings');
        if (!panel) return;
        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'block';
            const saved = store.vidCallFontSettings || store.vcFontSettings || { size: 15, color: '#ffffff' };
            const slider = document.getElementById('vidcall-font-size-slider');
            if (slider) slider.value = saved.size;
            document.getElementById('vidcall-font-size-val').textContent = saved.size + 'px';
            document.getElementById('vidcall-font-color-picker').value = saved.color;
            document.querySelectorAll('.vidcall-color-opt').forEach(el => {
                const bg = el.style.background;
                el.style.borderColor = bg === saved.color ? 'rgba(255,255,255,0.8)' : 'transparent';
            });
        } else {
            panel.style.display = 'none';
        }
    };

    window.applyVidCallFontSettings = function() {
        const size = document.getElementById('vidcall-font-size-slider').value;
        document.getElementById('vidcall-font-size-val').textContent = size + 'px';
        if (!store.vidCallFontSettings) store.vidCallFontSettings = { size: 15, color: '#ffffff' };
        store.vidCallFontSettings.size = parseInt(size);
        _applyVidCallFont();
        save();
    };

    window.setVidCallFontColor = function(color) {
        if (!store.vidCallFontSettings) store.vidCallFontSettings = { size: 15, color: '#ffffff' };
        store.vidCallFontSettings.color = color;
        document.getElementById('vidcall-font-color-picker').value = color;
        document.querySelectorAll('.vidcall-color-opt').forEach(el => {
            const elColor = el.getAttribute('onclick').match(/'([^']+)'/);
            el.style.borderColor = (elColor && elColor[1] === color) ? 'rgba(255,255,255,0.8)' : 'transparent';
        });
        _applyVidCallFont();
        save();
    };

    function _applyVidCallFont() {
        const settings = store.vidCallFontSettings || store.vcFontSettings || { size: 15, color: '#ffffff' };
        const subtitle = document.getElementById('vidcall-subtitle');
        const status = document.getElementById('vidcall-status');
        const transcript = document.getElementById('vidcall-live-transcript-content');
        const logTexts = document.querySelectorAll('.vidcall-log-text');
        const logActions = document.querySelectorAll('.vidcall-log-action');
        if (subtitle) { subtitle.style.fontSize = settings.size + 'px'; subtitle.style.color = settings.color; }
        if (status) { status.style.fontSize = (settings.size + 3) + 'px'; status.style.color = settings.color; }
        if (transcript) { transcript.style.fontSize = settings.size + 'px'; transcript.style.color = settings.color; }
        logTexts.forEach(el => { el.style.fontSize = settings.size + 'px'; el.style.color = settings.color; });
        logActions.forEach(el => { el.style.fontSize = (settings.size - 2) + 'px'; });
    }

    // ========== 字幕更新 ==========
    // [FIX-用户语句可见] 分离用户和AI的字幕显示
    let _userSubtitleTimer = null;
    function _updateVidCallSubtitle(text) {
        const el = document.getElementById('vidcall-subtitle');
        if (!el) return;
        if (!text) {
            el.innerHTML = '';
            return;
        }
        // 支持动作斜体标记 *动作*
        const html = text.replace(/\*([^*]+)\*/g, '<span class="vidcall-action">*$1*</span>');
        el.innerHTML = html;
    }
    // [FIX-用户语句可见] 显示用户说的话，保持显示一段时间后淡出
    function _showUserSubtitle(text) {
        const el = document.getElementById('vidcall-user-subtitle');
        if (!el) return;
        el.innerText = '我: ' + text;
        el.style.opacity = '1';
        el.style.display = 'block';
        if (_userSubtitleTimer) clearTimeout(_userSubtitleTimer);
        _userSubtitleTimer = setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => { el.style.display = 'none'; }, 500);
        }, 5000);
    }

    // ========== 对话记录 ==========
    function _appendVidCallLog(sender, textOrObj) {
        const item = document.createElement('div');
        item.className = 'vidcall-log-item ' + sender;

        const senderLabel = document.createElement('div');
        senderLabel.className = 'vidcall-log-sender ' + sender;
        senderLabel.innerText = sender === 'me' ? '我' : (store.contacts.find(c => c.id === activeChatId)?.name || '对方');
        item.appendChild(senderLabel);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'vidcall-log-content';

        if (typeof textOrObj === 'object') {
            if (textOrObj.action) {
                const actionDiv = document.createElement('div');
                actionDiv.className = 'vidcall-log-action';
                actionDiv.innerText = `*${textOrObj.action}*`;
                contentDiv.appendChild(actionDiv);
            }
            if (textOrObj.text) {
                const textDiv = document.createElement('div');
                textDiv.className = 'vidcall-log-text';
                textDiv.innerText = textOrObj.text;
                contentDiv.appendChild(textDiv);
            }
        } else {
            const textDiv = document.createElement('div');
            textDiv.className = 'vidcall-log-text';
            textDiv.innerText = textOrObj;
            contentDiv.appendChild(textDiv);
        }

        item.appendChild(contentDiv);
        const box = document.getElementById('vidcall-history-content');
        box.appendChild(item);
        box.scrollTop = box.scrollHeight;
    }

    // ========== 文字发送 ==========
    window.sendVideoCallText = function() {
        const input = document.getElementById('vidcall-input');
        const text = input ? input.value.trim() : '';
        if (!text) return;
        // [FIX] 设置输入阻断标记，防止blur后触发其他操作
        window._lastInputTouchTime = Date.now();
        // [FIX] 先清空和隐藏输入框，防止重复提交
        if (input) input.value = '';
        const textBox = document.getElementById('vidcall-text-input-box');
        if (textBox) textBox.style.display = 'none';
        // [FIX] 先将焦点移到视频通话layer内的非输入元素，防止焦点跳到chat-input
        const layer = document.getElementById('layer-video-call');
        if (layer) layer.focus();
        // 然后blur，确保键盘收起
        if (input) input.blur();
        // [FIX] 确保焦点不在任何输入框上（防止手机浏览器自动聚焦到chat-input）
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
            document.activeElement.blur();
        }
        // 确保视频通话layer保持显示
        if (layer && !layer.classList.contains('show')) {
            layer.classList.add('show');
        }
        _showUserSubtitle(text);
        _updateVidCallSubtitle("我: " + text);
        _appendVidCallLog('me', text);
        _processVideoInput(text);
    };

    // ========== PTT (按住说话) ==========
    function _vidCallPttStart(e) {
        if (e) e.preventDefault();
        if (!vidCallState.active || vidCallState.isSpeaking) return;

        vidCallState._pttActive = true;
        const btn = document.getElementById('vidcall-ptt-btn');
        const hint = document.getElementById('vidcall-ptt-hint');
        btn.classList.add('pressing');
        hint.textContent = '松开发送';
        hint.classList.add('recording');

        const transcriptEl = document.getElementById('vidcall-live-transcript');
        transcriptEl.classList.add('active');
        document.getElementById('vidcall-live-transcript-content').innerHTML = '<span class="interim">正在聆听...</span>';

        // 安全超时
        if (vidCallState._pttSafetyTimer) clearTimeout(vidCallState._pttSafetyTimer);
        vidCallState._pttSafetyTimer = setTimeout(() => {
            if (vidCallState._pttActive) {
                console.warn('[VidCall PTT] 安全超时60秒');
                _vidCallPttEnd(null);
            }
            vidCallState._pttSafetyTimer = null;
        }, 60000);

        _vidCallPttStartRecognition();
    }

    function _vidCallPttEnd(e) {
        if (e) e.preventDefault();
        if (!vidCallState._pttActive) {
            _vidCallPttForceCleanUI();
            return;
        }
        vidCallState._pttActive = false;

        if (vidCallState._pttSafetyTimer) {
            clearTimeout(vidCallState._pttSafetyTimer);
            vidCallState._pttSafetyTimer = null;
        }

        _vidCallPttForceCleanUI();
        _vidCallPttStopRecognition();
    }

    function _vidCallPttForceCleanUI() {
        const btn = document.getElementById('vidcall-ptt-btn');
        const hint = document.getElementById('vidcall-ptt-hint');
        if (btn) btn.classList.remove('pressing');
        if (hint) {
            hint.textContent = '按住说话';
            hint.classList.remove('recording');
        }
    }

    // PTT按钮事件绑定
    (function initVidCallPttBtn() {
        const btn = document.getElementById('vidcall-ptt-btn');
        if (!btn) return;

        btn.addEventListener('touchstart', function(e) {
            e.preventDefault(); e.stopPropagation();
            _vidCallPttStart(e);
        }, { passive: false });
        btn.addEventListener('touchend', function(e) {
            e.preventDefault(); e.stopPropagation();
            _vidCallPttEnd(e);
        }, { passive: false });
        btn.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            _vidCallPttEnd(e);
        }, { passive: false });
        btn.addEventListener('touchmove', function(e) {
            e.preventDefault();
            if (!vidCallState._pttActive) return;
            const touch = e.touches[0];
            if (!touch) return;
            const rect = btn.getBoundingClientRect();
            const tolerance = 40;
            if (touch.clientX < rect.left - tolerance || touch.clientX > rect.right + tolerance ||
                touch.clientY < rect.top - tolerance || touch.clientY > rect.bottom + tolerance) {
                _vidCallPttEnd(e);
            }
        }, { passive: false });
        btn.addEventListener('mousedown', function(e) {
            e.preventDefault(); e.stopPropagation();
            _vidCallPttStart(e);
        });
        btn.addEventListener('mouseup', function(e) {
            e.preventDefault(); e.stopPropagation();
            _vidCallPttEnd(e);
        });
        document.addEventListener('mouseup', function() {
            if (vidCallState._pttActive) _vidCallPttEnd(null);
        });
        document.addEventListener('touchend', function() {
            if (vidCallState._pttActive) _vidCallPttEnd(null);
        });
        document.addEventListener('touchcancel', function() {
            if (vidCallState._pttActive) _vidCallPttEnd(null);
        });
        document.addEventListener('visibilitychange', function() {
            if (document.hidden && vidCallState._pttActive) _vidCallPttEnd(null);
        });
        btn.addEventListener('contextmenu', function(e) { e.preventDefault(); });
        btn.style.userSelect = 'none';
        btn.style.webkitUserSelect = 'none';
        btn.style.touchAction = 'none';
    })();

    // ========== PTT语音识别 ==========
    function _vidCallPttStartRecognition() {
        // 优先STT API
        if (store.stt && store.stt.enabled) {
            const provider = store.stt.provider || 'openai';
            let hasValidKey = false;
            switch(provider) {
                case 'openai': hasValidKey = !!(store.stt.openai && store.stt.openai.key); break;
                case 'google': hasValidKey = !!(store.stt.google && store.stt.google.key); break;
                case 'azure': hasValidKey = !!(store.stt.azure && store.stt.azure.key); break;
                case 'tencent': hasValidKey = !!(store.stt.tencent && store.stt.tencent.secretId && store.stt.tencent.secretKey); break;
                case 'xfyun': hasValidKey = !!(store.stt.xfyun && store.stt.xfyun.appId && store.stt.xfyun.apiKey); break;
                case 'custom': hasValidKey = !!(store.stt.custom && store.stt.custom.url); break;
                default: hasValidKey = false;
            }
            if (hasValidKey) {
                _vidCallPttStartSTTApi();
                return;
            }
        }

        // 浏览器内置SpeechRecognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast("浏览器不支持语音识别，请在设置中配置语音识别API", "error");
            return;
        }

        try {
            if (vidCallState.recognition) {
                vidCallState.recognition.onend = null;
                vidCallState.recognition.onerror = null;
                vidCallState.recognition.onresult = null;
                try { vidCallState.recognition.stop(); } catch(e) {}
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'zh-CN';

            let _pttAccumulatedFinal = '';

            recognition.onstart = () => {};

            recognition.onerror = (event) => {
                console.error("VidCall PTT Speech recognition error", event.error);
                if (event.error === 'no-speech' || event.error === 'aborted') return;
                if (event.error === 'network') {
                    document.getElementById('vidcall-live-transcript-content').innerHTML = '<span class="interim">语音服务连接失败</span>';
                    return;
                }
            };

            recognition.onend = () => {
                if (vidCallState._pttActive && vidCallState.active) {
                    try { recognition.start(); } catch(e) {
                        setTimeout(() => {
                            if (vidCallState._pttActive && vidCallState.active) {
                                try { recognition.start(); } catch(e2) {}
                            }
                        }, 200);
                    }
                } else if (_pttAccumulatedFinal.trim()) {
                    const finalText = _pttAccumulatedFinal.trim();
                    _showUserSubtitle(finalText);
                    _updateVidCallSubtitle("我: " + finalText);
                    _appendVidCallLog('me', finalText);
                    _processVideoInput(finalText);
                    _pttAccumulatedFinal = '';
                    setTimeout(() => {
                        document.getElementById('vidcall-live-transcript').classList.remove('active');
                    }, 500);
                } else {
                    document.getElementById('vidcall-live-transcript-content').innerHTML = '<span class="interim">未识别到语音</span>';
                    setTimeout(() => {
                        document.getElementById('vidcall-live-transcript').classList.remove('active');
                    }, 1500);
                }
            };

            recognition.onresult = (event) => {
                vidCallState._pttGotResult = true;
                let interim = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        _pttAccumulatedFinal += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }
                const contentEl = document.getElementById('vidcall-live-transcript-content');
                let html = '';
                if (_pttAccumulatedFinal) html += '<span class="final">' + _pttAccumulatedFinal + '</span>';
                if (interim) html += '<span class="interim">' + interim + '</span>';
                if (html) contentEl.innerHTML = html;
                if (_pttAccumulatedFinal || interim) {
                    _updateVidCallSubtitle("我: " + (_pttAccumulatedFinal + interim || '...'));
                }
            };

            vidCallState.recognition = recognition;
            vidCallState._pttGotResult = false;
            recognition.start();

            vidCallState._pttServiceCheckTimer = setTimeout(() => {
                if (vidCallState._pttActive && vidCallState.active && !vidCallState._pttGotResult) {
                    document.getElementById('vidcall-live-transcript-content').innerHTML = '<span class="interim">未检测到语音输入</span>';
                    toast("未检测到语音输入，请检查麦克风权限", "error");
                }
            }, 5000);
        } catch(e) {
            console.error("VidCall PTT Init Failed:", e);
            toast("语音识别启动失败", "error");
        }
    }

    function _vidCallPttStopRecognition() {
        if (vidCallState._pttServiceCheckTimer) { clearTimeout(vidCallState._pttServiceCheckTimer); vidCallState._pttServiceCheckTimer = null; }
        // 停止浏览器内置语音识别
        if (vidCallState.recognition) {
            try { vidCallState.recognition.stop(); } catch(e) {}
        }
        // 停止STT API录音（不管是否有recognition，都尝试清理STT状态）
        if (vidCallState._sttMediaRecorder || vidCallState._sttStream) {
            _vidCallPttStopSTTApi();
        }
    }

    // PTT + STT API
    async function _vidCallPttStartSTTApi() {
        try {
            if (vidCallState._sttMediaRecorder) {
                try { vidCallState._sttMediaRecorder.stop(); } catch(e) {}
            }
            if (vidCallState._sttStream) {
                vidCallState._sttStream.getTracks().forEach(t => t.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            vidCallState._sttStream = stream;

            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
                             MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
            if (!mimeType) return;

            let chunks = [];
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            vidCallState._sttMediaRecorder = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                if (chunks.length === 0 || !vidCallState.active) return;
                const blob = new Blob(chunks, { type: mimeType });
                chunks = [];

                if (blob.size < 1000) {
                    document.getElementById('vidcall-live-transcript-content').innerHTML = '<span class="interim">未识别到语音</span>';
                    setTimeout(() => {
                        document.getElementById('vidcall-live-transcript').classList.remove('active');
                    }, 1500);
                    return;
                }

                document.getElementById('vidcall-live-transcript-content').innerHTML = '<span class="interim">识别中...</span>';

                try {
                    const text = await callSTTApi(blob);
                    if (text && text.trim()) {
                        document.getElementById('vidcall-live-transcript-content').innerHTML = '<span class="final">' + text + '</span>';
                        _showUserSubtitle(text);
                        _updateVidCallSubtitle("我: " + text);
                        _appendVidCallLog('me', text);
                        _processVideoInput(text);
                        setTimeout(() => {
                            document.getElementById('vidcall-live-transcript').classList.remove('active');
                        }, 500);
                    } else {
                        document.getElementById('vidcall-live-transcript-content').innerHTML = '<span class="interim">未识别到语音</span>';
                        setTimeout(() => {
                            document.getElementById('vidcall-live-transcript').classList.remove('active');
                        }, 1500);
                    }
                } catch(e) {
                    document.getElementById('vidcall-live-transcript-content').innerHTML = '<span class="interim">识别失败</span>';
                    setTimeout(() => {
                        document.getElementById('vidcall-live-transcript').classList.remove('active');
                    }, 1500);
                }
            };

            mediaRecorder.start();
            document.getElementById('vidcall-live-transcript-content').innerHTML = '<span class="interim">正在录音...</span>';
        } catch(e) {
            console.error('VidCall PTT STT API init failed:', e);
            toast('麦克风访问失败', 'error');
        }
    }

    function _vidCallPttStopSTTApi() {
        if (vidCallState._sttMediaRecorder && vidCallState._sttMediaRecorder.state === 'recording') {
            vidCallState._sttMediaRecorder.stop();
        }
        if (vidCallState._sttStream) {
            vidCallState._sttStream.getTracks().forEach(t => t.stop());
            vidCallState._sttStream = null;
        }
    }

    function _stopVidCallSTT() {
        if (vidCallState._sttMediaRecorder) {
            try { vidCallState._sttMediaRecorder.stop(); } catch(e) {}
            vidCallState._sttMediaRecorder = null;
        }
        if (vidCallState._sttStream) {
            vidCallState._sttStream.getTracks().forEach(t => t.stop());
            vidCallState._sttStream = null;
        }
        if (vidCallState._sttAudioCtx) {
            try { vidCallState._sttAudioCtx.close(); } catch(e) {}
            vidCallState._sttAudioCtx = null;
        }
    }

    // ========== 核心：处理用户输入 → AI回复 ==========
    async function _processVideoInput(text) {
        if (!text) return;
        if (!vidCallState.active) return; // [FIX] 通话已结束则不处理

        // [FIX-麦克风按钮] 如果麦克风关闭（静音状态），缓存用户的话而不是立即触发AI回复
        if (vidCallState.micMuted) {
            _vidCallPendingTexts.push(text);
            _updateVidCallSubtitle("我: " + text + " (已缓存，开启麦克风后发送)");
            document.getElementById('vidcall-status').innerText = `已缓存 ${_vidCallPendingTexts.length} 条消息，开启麦克风后对方将回复`;
            return;
        }

        // [FIX] 确保视频通话layer保持显示
        const layer = document.getElementById('layer-video-call');
        if (layer && !layer.classList.contains('show')) {
            layer.classList.add('show');
        }

        document.getElementById('vidcall-status').innerText = "对方思考中...";
        vidCallState.isSpeaking = true;
        if (vidCallState.recognition) {
            try { vidCallState.recognition.stop(); } catch(e) {}
        }

        await _aiGenerateVideoCall(text);
    }

    // [MOD] 不做超时限制，直接调用API
    function _apiCallWithTimeout(messages, timeoutMs = 30000) {
        return API.chatCompletion(messages);
    }

    // [新增] 带重试的API请求
    async function _apiCallWithRetry(messages, maxRetries = 2, timeoutMs = 35000) {
        let lastErr = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            if (!vidCallState.active) return null; // 通话已结束，不再重试
            try {
                if (attempt > 0) {
                    console.log(`[VidCall] API重试第${attempt}次...`);
                    document.getElementById('vidcall-status').innerText = `重新连接中...(${attempt}/${maxRetries})`;
                    // 重试前等待递增时间，避免立即重试
                    await new Promise(r => setTimeout(r, 1500 * attempt));
                    if (!vidCallState.active) return null;
                }
                const data = await _apiCallWithTimeout(messages, timeoutMs);
                return data;
            } catch(e) {
                lastErr = e;
                console.warn(`[VidCall] API调用失败(attempt ${attempt + 1}/${maxRetries + 1}):`, e.message);
            }
        }
        throw lastErr; // 所有重试都失败
    }

    // [新增] isSpeaking状态安全守卫 - 防止状态卡死导致无法继续对话
    let _speakingGuardTimer = null;
    function _startSpeakingGuard() {
        _clearSpeakingGuard();
        _speakingGuardTimer = setTimeout(() => {
            if (vidCallState.active && vidCallState.isSpeaking) {
                console.warn('[VidCall] isSpeaking状态卡死超过90秒，强制重置');
                vidCallState.isSpeaking = false;
                if (vidCallState.live2d) vidCallState.live2d.setSpeaking(false);
                document.getElementById('vidcall-status').innerText = '通话中';
                _updateVidCallSubtitle('');
            }
            _speakingGuardTimer = null;
        }, 90000); // 90秒安全超时
    }
    function _clearSpeakingGuard() {
        if (_speakingGuardTimer) {
            clearTimeout(_speakingGuardTimer);
            _speakingGuardTimer = null;
        }
    }

    async function _aiGenerateVideoCall(text) {
        const contact = store.contacts.find(c => c.id === activeChatId);
        if (!contact) return;

        // [新增] 启动isSpeaking安全守卫，防止任何异常导致状态卡死
        _startSpeakingGuard();

        // 获取世界书
        let worldBookContent = 'None';
        try {
            if (contact.settings && contact.settings.mountedWbIds && Array.isArray(contact.settings.mountedWbIds)) {
                const mountedBooks = (store.worldbooks || []).filter(wb => contact.settings.mountedWbIds.includes(wb.id));
                if (mountedBooks.length > 0) {
                    worldBookContent = mountedBooks.map(wb => `[${wb.name}]:\n${wb.content}`).join('\n\n');
                }
            }
        } catch(_wbErr) { console.warn('[worldbook] 视频通话获取世界书失败:', _wbErr); }

        const globalMemory = buildContactGlobalMemory(activeChatId);
        const userName = getUserPersonaName(contact, store.user.name || '用户');

        // [FIX-去重] 记录用户这轮输入到对话历史
        _vidCallConversationHistory.push({ role: 'user', text: text });
        // 限制历史长度，只保留最近40条，避免token过多
        if (_vidCallConversationHistory.length > 40) {
            _vidCallConversationHistory = _vidCallConversationHistory.slice(-40);
        }
        
        // [FIX-去重] 构建对话历史摘要，让AI知道之前说过什么
        let vidConversationContext = '';
        if (_vidCallConversationHistory.length > 1) {
            const recentHistory = _vidCallConversationHistory.slice(-20);
            vidConversationContext = '\n\n【本次通话对话历史（你必须参考，严禁重复已说过的内容）】：\n';
            recentHistory.forEach(h => {
                if (h.role === 'user') {
                    vidConversationContext += `${userName}：${h.text}\n`;
                } else {
                    vidConversationContext += `${contact.name}：${h.text}\n`;
                }
            });
        }

        // 环境描述 + 直接抓帧
        const cameraOn = vidCallState.cameraOn;
        const envDesc = vidCallState.envContext;
        // [FIX-核心] 直接抓取当前摄像头帧，作为多模态图片发送给AI
        const currentFrame = cameraOn ? _captureCurrentFrame() : null;

        let envSection = '';
        if (currentFrame) {
            // 有摄像头帧（将直接以图片形式发给AI看）
            if (envDesc) {
                // 同时有之前的环境识别文本描述，作为辅助参考
                envSection = `
【视觉信息 - 最高优先级】你正在视频通话中，你可以通过屏幕看到对方。
这条消息附带了一张对方摄像头的实时画面截图，你必须仔细观察这张图片。
之前的环境识别结果供参考：「${envDesc}」
你已经能看到对方的环境了！请根据图片中你看到的实际场景来回应。
严禁说"看不到"、"看不清"、"黑乎乎"、"画面在加载"、"卡卡的"等——因为你确实能看到。
如果对方问你看到什么，请描述图片中的真实环境（地点、光线、物品等）。`;
            } else {
                envSection = `
【视觉信息 - 最高优先级】你正在视频通话中，你可以通过屏幕看到对方。
这条消息附带了一张对方摄像头的实时画面截图，你必须仔细观察这张图片。
请根据图片中你看到的实际场景来回应，如地点类型、光线、可见的物品特征等。
严禁说"看不到"、"看不清"、"黑乎乎"、"画面在加载"、"卡卡的"等——因为你确实能看到。
如果对方问你看到什么，请描述图片中的真实环境。`;
            }
        } else if (envDesc) {
            // 没有帧但有之前的环境识别文字结果
            envSection = `
【视觉信息 - 最高优先级】你正在视频通话中，你可以通过屏幕看到对方。
你现在看到的对方环境是：「${envDesc}」
你必须根据这个环境描述来回应。如果对方问你看到什么，你要描述你看到的这个环境。
严禁说"看不到"、"看不清"、"黑乎乎"、"画面在加载"、"卡卡的"等——因为你已经看到了。
自然地提及环境，比如："我看到你那边好像是${envDesc}"。`;
        } else if (cameraOn) {
            envSection = `
【视觉信息】对方开启了摄像头，画面正在加载中，你暂时还没看清楚。可以说"等一下，画面还在加载"。`;
        } else {
            envSection = `
【视觉信息】对方没有开启摄像头，你看不到对方的画面。
这更像一个纯语音通话，但你有视频画面（你的形象展示给对方看）。`;
        }

        // [FIX-视频通话外语] 根据联系人的voiceLang动态决定对话语言，与普通聊天逻辑一致
        const _vidVoiceLang = contact.settings?.voiceLang;
        const _vidLangMap = { 'ja': 'Japanese (日本語)', 'ko': 'Korean (한국어)', 'en': 'English', 'yue': '粤语(Cantonese)', 'fr': 'French (Français)', 'de': 'German (Deutsch)', 'es': 'Spanish (Español)', 'id': 'Indonesian (Bahasa Indonesia)' };
        const _vidLangInstruction = (_vidVoiceLang && _vidVoiceLang !== 'zh' && _vidLangMap[_vidVoiceLang])
            ? `Use natural, conversational ${_vidLangMap[_vidVoiceLang]}. All DIALOGUE content MUST be in ${_vidLangMap[_vidVoiceLang]}. 禁止在对话中使用中文。`
            : 'Use natural, conversational Chinese';
        // ACTION标签的描写语言：外语联系人的动作描写也用对应外语
        const _vidActionLangHint = (_vidVoiceLang && _vidVoiceLang !== 'zh' && _vidLangMap[_vidVoiceLang])
            ? `Action descriptions should also be in ${_vidLangMap[_vidVoiceLang]}.`
            : '';

        const sysPrompt = `You are ${contact.name}.
【━━━ 人设核心（绝对优先，每次回复都必须忠实体现）━━━】
${contact.persona}
【━━━ 人设核心结束 ━━━】
以上是你的完整人设。你的说话方式、性格、表情习惯全部由人设决定。每次回复前先问自己：「${contact.name}会这样说/做吗？」
World Book Context: ${worldBookContent}
${globalMemory ? `\n${globalMemory}` : ''}
${vidConversationContext}

User (${userName}) said: "${text}".

【重要场景设定】你们正在进行视频通话（Video Call）。
${envSection}

【视频通话中允许的互动】：
✅ 面部表情：微笑、歪头、挑眉、做鬼脸、撅嘴等
✅ 手势动作：挥手、比心、伸懒腰、托腮等
✅ 视觉互动：凑近屏幕、指向某物、展示东西
✅ 评论环境：对方的环境、光线、背景物品等
✅ 声音互动：笑声、叹气、语气变化

【禁止】：
❌ 身体接触类动作（牵手、拥抱、触碰对方）— 你们隔着屏幕

【去重要求 - 极其重要】：
⚠️ 严禁重复自己之前说过的话或表达过的意思
⚠️ 严禁鹦鹉学舌式地复述用户刚说的内容（如用户说"我今天很开心"，你不能说"你今天很开心啊"）
⚠️ 如果用户重复提到同一件事，用不同的角度或新的信息回应，不要重复之前的回答
⚠️ 每次回复都要推进对话，带来新的信息、观点或情感，而不是原地踏步

CRITICAL FORMAT REQUIREMENT:
You MUST alternate between action descriptions and dialogue.
Format: [ACTION]动作/表情描写[/ACTION][DIALOGUE]语言内容[/DIALOGUE]

Example (视频通话场景):
[ACTION]歪着头凑近屏幕，好奇地看着[/ACTION][DIALOGUE]你今天在外面吗，感觉你那边好亮[/DIALOGUE][ACTION]抬手比了个心[/ACTION][DIALOGUE]嘿嘿，想你了[/DIALOGUE]

Rules:
1. Start with an action tag
2. Follow with dialogue tag
3. Alternate between them
4. Keep each segment short (5-15 characters)
5. ${_vidLangInstruction}
6. Actions describe YOUR facial expressions, gestures, and screen-related movements${_vidActionLangHint ? ' ' + _vidActionLangHint : ''}
7. Remember: This is a VIDEO CALL - you can see each other through the screen but cannot touch
${currentFrame ? '8. 你收到了一张对方的实时摄像头画面，请仔细看图并结合画面内容回应' : ''}
9. NEVER repeat what you or the user already said in this conversation

Do NOT use JSON. Do NOT use markdown. Just use the tag format above.`;

        // [FIX-核心-多模态] 构建user消息：如果有摄像头帧，以多模态（图片+文字）形式发送
        let userContent;
        if (currentFrame) {
            // 多模态消息：文字 + 摄像头实时截图
            const textPart = envDesc
                ? `${text}\n\n[附带的图片是我的摄像头实时画面。之前的环境识别：${envDesc}。请根据你看到的图片来回应我。]`
                : `${text}\n\n[附带的图片是我的摄像头实时画面，请根据你看到的图片来回应我。]`;
            userContent = [
                { type: 'text', text: textPart },
                { type: 'image_url', image_url: { url: currentFrame } }
            ];
            console.log('[VidCall] 以多模态(图片+文字)方式发送给AI，envDesc:', envDesc || '(无)');
        } else if (envDesc) {
            // 纯文字但有环境描述
            userContent = `${text}\n\n[你通过视频看到对方的环境是：${envDesc}。请根据你看到的环境来回应。严禁说看不到、看不清。]`;
            console.log('[VidCall] 以纯文字方式发送给AI，envDesc:', envDesc);
        } else {
            userContent = text;
            console.log('[VidCall] 以纯文字方式发送给AI，无环境信息');
        }

        try {
            let data;
            try {
                // [优化] 使用带超时和重试的API调用，防止断链
                data = await _apiCallWithRetry([
                    {role: 'system', content: sysPrompt},
                    {role: 'user', content: userContent}
                ], 2, 35000);
            } catch (multimodalErr) {
                // [FIX-fallback] 如果多模态请求失败（API不支持识图），降级为纯文本请求
                if (currentFrame && Array.isArray(userContent)) {
                    console.warn('[VidCall] 多模态请求失败，降级为纯文本+重试:', multimodalErr.message);
                    const fallbackText = envDesc
                        ? `${text}\n\n[你通过视频看到对方的环境是：${envDesc}。请根据你看到的环境来回应。严禁说看不到、看不清。]`
                        : text;
                    // 纯文本降级也用重试
                    data = await _apiCallWithRetry([
                        {role: 'system', content: sysPrompt},
                        {role: 'user', content: fallbackText}
                    ], 2, 35000);
                } else {
                    throw multimodalErr; // 不是多模态问题，重新抛出
                }
            }

            // [FIX] 重试返回null表示通话已结束
            if (!data) return;

            // [FIX] API调用完成后再次确认通话仍然活跃，防止挂断后继续更新UI
            if (!vidCallState.active) return;

            // [FIX] 确保视频通话layer保持显示（防止异步期间被意外关闭）
            const layerCheck = document.getElementById('layer-video-call');
            if (layerCheck && !layerCheck.classList.contains('show')) {
                layerCheck.classList.add('show');
            }

            let content = data.choices[0].message.content.trim();

            // [FIX-消息顺序v2] 使用顺序扫描替代分别提取，保证ACTION/DIALOGUE按原文顺序播放
            const tagRegex = /\[(ACTION|DIALOGUE)\]([\s\S]*?)\[\/\1\]/g;
            const segments = [];
            let match;
            while ((match = tagRegex.exec(content)) !== null) {
                segments.push({ type: match[1].toLowerCase(), text: match[2].trim() });
            }

            // [FIX-去重] 提取AI的纯对话文本，记录到历史中
            const dialogueSegments = segments.filter(s => s.type === 'dialogue');
            const aiDialogueText = dialogueSegments.length > 0 ? dialogueSegments.map(s => s.text).join(' ') : content.replace(/\[ACTION\][\s\S]*?\[\/ACTION\]/g, '').trim();
            if (aiDialogueText) {
                _vidCallConversationHistory.push({ role: 'ai', text: aiDialogueText });
            }

            if (segments.length === 0) {
                // 没有标签结构，整体当对话处理
                const resObj = { action: "", text: content, tts_text: content };
                document.getElementById('vidcall-status').innerText = "通话中";
                _appendVidCallLog('ai', resObj);
                await _playVideoCallAudio(resObj.tts_text, resObj.text);
                return;
            }

            document.getElementById('vidcall-status').innerText = "通话中";

            // 按原文顺序依次播放每个段落
            for (const seg of segments) {
                if (!vidCallState.active) break; // 通话已结束则停止

                if (seg.type === 'action' && seg.text) {
                    _updateVidCallSubtitle(`*${seg.text}*`);
                    _appendVidCallLog('ai', { action: seg.text, text: "" });
                    // Live2D表情变化
                    if (vidCallState.live2d) {
                        vidCallState.live2d.setSpeaking(false);
                    }
                    const actionDelay = Math.max(2500, 1500 + seg.text.length * 150);
                    await new Promise(resolve => setTimeout(resolve, actionDelay));
                } else if (seg.type === 'dialogue' && seg.text) {
                    _appendVidCallLog('ai', { action: "", text: seg.text });
                    // Live2D说话动画
                    if (vidCallState.live2d) {
                        vidCallState.live2d.setSpeaking(true);
                    }
                    await _playVideoCallAudio(seg.text, seg.text);
                    if (vidCallState.live2d) {
                        vidCallState.live2d.setSpeaking(false);
                    }
                }
            }

            // [FIX] 正常完成后重置isSpeaking状态，防止PTT被锁定
            vidCallState.isSpeaking = false;
            if (vidCallState.live2d) vidCallState.live2d.setSpeaking(false);
            _clearSpeakingGuard(); // [新增] 清除安全守卫

        } catch(e) {
            console.error("Video Call Error:", e);
            vidCallState.isSpeaking = false;
            if (vidCallState.live2d) vidCallState.live2d.setSpeaking(false);
            _clearSpeakingGuard(); // [新增] 清除安全守卫

            // [优化] 更友好的错误提示和自动恢复
            if (vidCallState.active) {
                const isTimeout = e && e.message && e.message.includes('API_TIMEOUT');
                const isNetwork = e && e.message && (e.message.includes('network') || e.message.includes('fetch') || e.message.includes('Failed'));
                
                if (isTimeout) {
                    document.getElementById('vidcall-status').innerText = "网络超时，请重试";
                    _updateVidCallSubtitle("网络连接超时，请再说一次~");
                } else if (isNetwork) {
                    document.getElementById('vidcall-status').innerText = "网络波动，请重试";
                    _updateVidCallSubtitle("网络不太好，请再试一次~");
                } else {
                    document.getElementById('vidcall-status').innerText = "连接不稳定";
                    _updateVidCallSubtitle("出了点小问题，请再说一次~");
                }

                // [新增] 3秒后自动恢复为"通话中"状态，让用户可以继续对话
                setTimeout(() => {
                    if (vidCallState.active) {
                        document.getElementById('vidcall-status').innerText = '通话中';
                    }
                }, 3000);
            }
        }
    }

    async function _playVideoCallAudio(text, subtitleText) {
        const contact = store.contacts.find(c => c.id === activeChatId);

        if (!contact || !contact.settings || !contact.settings.enableTTS) {
            // 无TTS，模拟语音延迟
            if (subtitleText) _updateVidCallSubtitle(subtitleText);
            const readTime = Math.max(2000, text.length * 300);

            return new Promise(resolve => {
                setTimeout(() => {
                    vidCallState.isSpeaking = false;
                    resolve();
                }, readTime);
            });
        }

        try {
            const result = await API.textToSpeech(text, contact.settings.voiceId, contact.settings.voiceLang);

            if (result === '__BROWSER_TTS_DONE__') {
                if (subtitleText) _updateVidCallSubtitle(subtitleText);
                vidCallState.isSpeaking = false;
                return;
            }

            const url = URL.createObjectURL(result);
            const audio = document.getElementById('tts-audio');
            audio.src = url;

            return new Promise((resolve) => {
                let resolved = false;
                const safeResolve = () => { if (!resolved) { resolved = true; resolve(); } };

                // [新增] 音频播放安全超时（60秒），防止Promise永远挂起
                const audioSafetyTimer = setTimeout(() => {
                    console.warn('[VidCall] 音频播放超时60秒，强制resolve');
                    vidCallState.isSpeaking = false;
                    try { audio.pause(); } catch(e) {}
                    safeResolve();
                }, 60000);

                audio.onplay = () => {
                    if (subtitleText) _updateVidCallSubtitle(subtitleText);
                };

                audio.onended = () => {
                    clearTimeout(audioSafetyTimer);
                    vidCallState.isSpeaking = false;
                    setTimeout(safeResolve, 500);
                };

                audio.onerror = () => {
                    clearTimeout(audioSafetyTimer);
                    if (subtitleText) _updateVidCallSubtitle(subtitleText);
                    vidCallState.isSpeaking = false;
                    safeResolve();
                };

                audio.play().catch(e => {
                    clearTimeout(audioSafetyTimer);
                    if (subtitleText) _updateVidCallSubtitle(subtitleText);
                    vidCallState.isSpeaking = false;
                    safeResolve();
                });
            });
        } catch(e) {
            console.error('[VidCall TTS Error]', e.message || e);
            if (subtitleText) _updateVidCallSubtitle(subtitleText);
            vidCallState.isSpeaking = false;
            // TTS失败时用模拟延迟代替，让用户能看到字幕
            const readTime = Math.max(2000, text.length * 300);
            await new Promise(resolve => setTimeout(resolve, readTime));
        }
    }

    // ========== 来电邀请（AI主动发起视频通话） ==========
    window.showIncomingVideoCallInvite = function(contact) {
        if (!contact) return;
        if (vidCallState.active) return;
        if (store.callState && store.callState.active) return; // 语音通话中
        if (document.getElementById('incoming-vidcall-overlay')) return;

        if (typeof playRingtone === 'function') playRingtone();

        const overlay = document.createElement('div');
        overlay.id = 'incoming-vidcall-overlay';
        overlay.className = 'incoming-vidcall-overlay';
        overlay.innerHTML = `
            <div class="incoming-vidcall-popup">
                <div class="incoming-vidcall-avatar">
                    <div class="incoming-vidcall-avatar-pulse"></div>
                    <img src="${contact.avatar || _ph(80)}" alt="${contact.name}">
                </div>
                <div class="incoming-vidcall-name">${contact.name}</div>
                <div class="incoming-vidcall-label">邀请您进行视频通话</div>
                <div class="incoming-vidcall-buttons">
                    <div class="incoming-vidcall-btn reject" onclick="handleIncomingVideoCallReject()">
                        <i class="fas fa-phone-slash"></i>
                        <span>拒绝</span>
                    </div>
                    <div class="incoming-vidcall-btn accept" onclick="handleIncomingVideoCallAccept('${contact.id}')">
                        <i class="fas fa-video"></i>
                        <span>接听</span>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('device').appendChild(overlay);

        overlay._autoRejectTimer = setTimeout(() => {
            handleIncomingVideoCallReject();
            if (contact.id) {
                if (!store.chats[contact.id]) store.chats[contact.id] = [];
                store.chats[contact.id].push({
                    sender: 'ai',
                    type: 'video_call',
                    content: '未接来电',
                    duration: 0,
                    time: Date.now()
                });
                save();
                if (activeChatId === contact.id && typeof renderHistory === 'function') renderHistory();
            }
        }, 30000);
    };

    window.handleIncomingVideoCallAccept = function(contactId) {
        const overlay = document.getElementById('incoming-vidcall-overlay');
        if (overlay) {
            if (overlay._autoRejectTimer) clearTimeout(overlay._autoRejectTimer);
            overlay.remove();
        }
        if (typeof stopRingtone === 'function') stopRingtone();

        const contact = store.contacts.find(c => c.id === contactId);
        if (contact) {
            activeChatId = contactId;
            _doStartVideoCall(contact, true);
        }
    };

    window.handleIncomingVideoCallReject = function() {
        const overlay = document.getElementById('incoming-vidcall-overlay');
        if (overlay) {
            if (overlay._autoRejectTimer) clearTimeout(overlay._autoRejectTimer);
            overlay.classList.add('dismissing');
            setTimeout(() => overlay.remove(), 300);
        }
        if (typeof stopRingtone === 'function') stopRingtone();
    };

    // ========== 视频通话活跃检测（阻止滑动） ==========
    window.isVideoCallActive = function() {
        return vidCallState.active;
    };

    // ========== 窗口大小变化时Live2D重绘 ==========
    window.addEventListener('resize', function() {
        if (vidCallState.live2d && vidCallState.active) {
            vidCallState.live2d.resize();
        }
    });

    // ========== 清理函数（供app-part1.js启动时调用） ==========
    window.cleanupVideoCallState = function() {
        vidCallState.active = false;
        vidCallState.isSpeaking = false;
        vidCallState._pttActive = false;
        // [新增] 清除isSpeaking安全守卫
        if (typeof _clearSpeakingGuard === 'function') _clearSpeakingGuard();
        if (vidCallState.timerInterval) { clearInterval(vidCallState.timerInterval); vidCallState.timerInterval = null; }
        if (vidCallState.captureInterval) { clearInterval(vidCallState.captureInterval); vidCallState.captureInterval = null; }
        if (vidCallState.localStream) {
            vidCallState.localStream.getTracks().forEach(t => t.stop());
            vidCallState.localStream = null;
        }
        if (vidCallState.live2d) { vidCallState.live2d.stop(); vidCallState.live2d = null; }
        if (vidCallState.recognition) {
            try { vidCallState.recognition.stop(); } catch(e) {}
            vidCallState.recognition = null;
        }
        vidCallState.startTime = 0;
        const layer = document.getElementById('layer-video-call');
        if (layer) layer.classList.remove('show');
    };

})();
