// ====== 沉浸式触摸互动模块 (app-touch.js) ======
// 在情侣空间"TA的状态"页面右上角入口进入
// 用户上传联系人图片 → 标记身体部位区域 → AI生成反应 → MiniMax TTS合成语音 → 触摸互动

(function() {
    'use strict';

    // ====== 状态 ======
    window.touchInteractState = {
        bgImage: null,
        zones: [],
        reactions: {},
        generating: false,
        editMode: false,
        showSettings: false,
        speechTimer: null,
        currentAudio: null,
        loadingText: '',
        loadingProgress: '',
        _loadedSpaceId: null,
    };

    // ====== 工具函数 ======
    function getTouchData(spaceId) {
        const key = 'touchInteract_' + spaceId;
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch(e) { return null; }
    }

    function saveTouchData(spaceId, data) {
        const key = 'touchInteract_' + spaceId;
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch(e) {
            console.error('[Touch] 保存数据失败:', e);
        }
    }

    function loadTouchState(spaceId) {
        const saved = getTouchData(spaceId);
        if (saved) {
            touchInteractState.bgImage = saved.bgImage || null;
            touchInteractState.zones = saved.zones || [];
            touchInteractState.reactions = saved.reactions || {};
        } else {
            touchInteractState.bgImage = null;
            touchInteractState.zones = [];
            touchInteractState.reactions = {};
        }
        touchInteractState.generating = false;
        touchInteractState.editMode = false;
        touchInteractState.showSettings = false;
    }

    function persistTouchState(spaceId) {
        saveTouchData(spaceId, {
            bgImage: touchInteractState.bgImage,
            zones: touchInteractState.zones,
            reactions: touchInteractState.reactions,
        });
    }

    // 获取 #device 容器（弹窗应该挂载到这里避免被裁切）
    function getDeviceEl() {
        return document.getElementById('device') || document.body;
    }

    // ====== 渲染主入口 ======
    window.renderTouchModule = function(area, space) {
        if (!space) { coupleViewMode = 'detail'; renderCouple(); return; }

        const spaceId = space.id;
        const partner = store.contacts.find(x => x.id === space.partnerId);
        const partnerName = partner ? partner.name : 'TA';

        // 首次进入此space时加载数据
        if (!touchInteractState._loadedSpaceId || touchInteractState._loadedSpaceId !== spaceId) {
            loadTouchState(spaceId);
            touchInteractState._loadedSpaceId = spaceId;
        }

        const st = touchInteractState;

        // 判断是否需要上传图片（首次）
        if (!st.bgImage) {
            renderTouchUploadGuide(area, space, partnerName);
            return;
        }

        // 渲染主互动界面
        renderTouchInteractPage(area, space, partnerName);
    };

    // ====== 上传引导页面 ======
    function renderTouchUploadGuide(area, space, partnerName) {
        area.innerHTML = `
            <div class="touch-page">
                <div class="touch-nav-bar">
                    <div class="nav-icon" onclick="coupleViewMode='sub_status';renderCouple()"><i class="fas fa-chevron-left"></i></div>
                    <div style="flex:1;"></div>
                </div>
                <div class="touch-upload-guide">
                    <div class="touch-upload-icon"><i class="fas fa-hand-pointer"></i></div>
                    <div class="touch-upload-title">沉浸式互动</div>
                    <div class="touch-upload-desc">
                        上传${partnerName}的图片<br>
                        标记身体部位，戳一戳看${partnerName}的反应~<br>
                        <span style="font-size:12px;color:#ccc;">支持全身照、半身照等</span>
                    </div>
                    <button class="touch-upload-btn" onclick="touchUploadImage()">
                        <i class="fas fa-image" style="margin-right:8px;"></i>上传图片
                    </button>
                </div>
            </div>
        `;
    }

    // ====== 上传图片 ======
    window.touchUploadImage = function() {
        openImgUploadModal('上传互动图片', function(imgResult) {
            const space = getCurrentCoupleSpace();
            if (!space) return;
            touchInteractState.bgImage = imgResult;
            touchInteractState.zones = [];
            touchInteractState.reactions = {};
            persistTouchState(space.id);
            renderCouple();
            // 自动进入添加部位模式
            setTimeout(function() { touchOpenAddZone(); }, 400);
        });
    };

    // ====== 主互动页面渲染 ======
    function renderTouchInteractPage(area, space, partnerName) {
        const st = touchInteractState;

        // 部位区域 HTML
        let zonesHTML = '';
        st.zones.forEach(function(zone, idx) {
            // [FIX-触摸旋转] 支持旋转角度
            var rotateStyle = zone.rotate ? 'transform:rotate(' + zone.rotate + 'deg);' : '';
            var style = 'left:' + zone.x + '%;top:' + zone.y + '%;width:' + zone.w + '%;height:' + (zone.h2 || zone.h) + '%;' + rotateStyle;
            var shapeClass = ' shape-' + (zone.shape || 'circle');
            if (st.editMode) {
                zonesHTML += '<div class="touch-zone editing' + shapeClass + '" style="' + style + '" data-zone-idx="' + idx + '"' +
                    ' ontouchstart="touchZoneDragStart(event,' + idx + ')" onmousedown="touchZoneDragStart(event,' + idx + ')">' +
                    '<span class="touch-zone-label">' + zone.name + (zone.rotate ? ' ' + Math.round(zone.rotate) + '°' : '') + '</span>' +
                    '<div class="touch-zone-drag-handle" ontouchstart="event.stopPropagation()" onmousedown="event.stopPropagation()" onclick="touchDeleteZone(' + idx + ')"><i class="fas fa-times"></i></div>' +
                    '<div class="touch-zone-resize-handle" ontouchstart="touchZoneResizeStart(event,' + idx + ')" onmousedown="touchZoneResizeStart(event,' + idx + ')"><i class="fas fa-expand-arrows-alt"></i></div>' +
                    '<div class="touch-zone-rotate-handle" ontouchstart="touchZoneRotateStart(event,' + idx + ')" onmousedown="touchZoneRotateStart(event,' + idx + ')"><i class="fas fa-sync-alt"></i></div>' +
                    '</div>';
            } else {
                // 使用 ontouchstart 替代 ontouchend 提升灵敏度，保留 onclick 作为桌面端兼容
                zonesHTML += '<div class="touch-zone' + shapeClass + '" style="' + style + '" data-zone-idx="' + idx + '"' +
                    ' ontouchstart="touchZoneTap(event,' + idx + ')" onclick="touchZoneTap(event,' + idx + ')">' +
                    '<span class="touch-zone-label">' + zone.name + '</span></div>';
            }
        });

        // 空提示
        var emptyHint = '';
        if (st.zones.length === 0 && !st.editMode) {
            emptyHint = '<div class="touch-empty-hint"><i class="fas fa-hand-pointer"></i>点击右上角菜单<br>添加身体部位区域</div>';
        }

        // 编辑模式提示
        var editHint = '';
        if (st.editMode) {
            editHint = '<div class="touch-edit-hint"><i class="fas fa-info-circle" style="margin-right:4px;"></i>编辑模式：拖拽移动 · 右下↗缩放 · 左下↻旋转 · ×删除</div>';
        }

        // 加载遮罩
        var loadingHTML = '';
        if (st.generating) {
            loadingHTML = '<div class="touch-loading-overlay">' +
                '<div class="touch-loading-spinner"></div>' +
                '<div class="touch-loading-text">' + (st.loadingText || '正在生成反应...') + '</div>' +
                '<div class="touch-loading-progress">' + (st.loadingProgress || '') + '</div></div>';
        }

        // 设置菜单（内嵌在area里面，避免position:fixed问题）
        var settingsHTML = '<div class="touch-settings-overlay ' + (st.showSettings ? 'show' : '') + '" id="touch-settings-overlay" onclick="touchCloseSettings()">' +
            '<div class="touch-settings-sheet" onclick="event.stopPropagation()">' +
            '<div class="touch-sheet-title">互动设置</div>' +
            '<div class="touch-settings-item" onclick="touchOpenAddZone();touchCloseSettings();"><i class="fas fa-plus-circle"></i>添加身体部位</div>' +
            '<div class="touch-settings-item" onclick="touchToggleEditMode();touchCloseSettings();"><i class="fas fa-edit"></i>' + (st.editMode ? '退出编辑模式' : '编辑部位位置') + '</div>' +
            '<div class="touch-settings-item" onclick="touchRegenReactions();touchCloseSettings();"><i class="fas fa-sync-alt"></i>重新生成所有反应</div>' +
            '<div class="touch-settings-item" onclick="touchOpenHistory();touchCloseSettings();"><i class="fas fa-history"></i>查看互动留存</div>' +
            '<div class="touch-settings-item" onclick="touchChangeBgImage();touchCloseSettings();"><i class="fas fa-image"></i>更换背景图片</div>' +
            '<div class="touch-settings-item danger" onclick="touchResetAll();touchCloseSettings();"><i class="fas fa-trash-alt"></i>重置所有数据</div>' +
            '<div style="text-align:center;margin-top:12px;color:#bbb;cursor:pointer;padding:10px;" onclick="touchCloseSettings()">关闭</div>' +
            '</div></div>';

        area.innerHTML = '<div class="touch-page">' +
            '<div class="touch-nav-bar">' +
                '<div class="nav-icon" onclick="touchGoBack()"><i class="fas fa-chevron-left"></i></div>' +
                '<div style="flex:1;"></div>' +
                '<div class="touch-nav-actions">' +
                    (st.editMode ? '<div class="touch-nav-btn" onclick="touchToggleEditMode()" style="background:#fff3e0;color:#e8a43a;"><i class="fas fa-check"></i></div>' : '') +
                    '<div class="touch-nav-btn" onclick="touchOpenSettings()"><i class="fas fa-ellipsis-v"></i></div>' +
                '</div>' +
            '</div>' +
            '<div class="touch-bg-area"><img src="' + st.bgImage + '" class="touch-bg-img" alt=""></div>' +
            '<div class="touch-zones-layer" id="touch-zones-layer">' + zonesHTML + emptyHint + '</div>' +
            editHint + loadingHTML + settingsHTML +
            '</div>';

        // 非编辑模式下，在 touch-zones-layer 上添加全局触摸检测
        // 当用户触摸的位置没有直接命中 .touch-zone 元素时，查找最近的区域触发
        if (!st.editMode && st.zones.length > 0) {
            setTimeout(function() {
                var layer = document.getElementById('touch-zones-layer');
                if (!layer) return;
                layer.addEventListener('touchstart', function(e) {
                    // 如果已经命中了某个 .touch-zone，不做额外处理
                    if (e.target.closest('.touch-zone')) return;
                    
                    var touch = e.touches[0];
                    var rect = layer.getBoundingClientRect();
                    var touchXPct = ((touch.clientX - rect.left) / rect.width) * 100;
                    var touchYPct = ((touch.clientY - rect.top) / rect.height) * 100;
                    
                    // 查找最近的区域（中心点距离）
                    var bestIdx = -1;
                    var bestDist = Infinity;
                    var zones = touchInteractState.zones;
                    for (var i = 0; i < zones.length; i++) {
                        var z = zones[i];
                        var cx = z.x + z.w / 2;
                        var cy = z.y + (z.h2 || z.h) / 2;
                        var halfW = z.w / 2 + 5; // 扩展5%的容差
                        var halfH = (z.h2 || z.h) / 2 + 5;
                        // 先判断是否在扩展区域内
                        if (Math.abs(touchXPct - cx) <= halfW && Math.abs(touchYPct - cy) <= halfH) {
                            var dist = Math.sqrt(Math.pow(touchXPct - cx, 2) + Math.pow(touchYPct - cy, 2));
                            if (dist < bestDist) {
                                bestDist = dist;
                                bestIdx = i;
                            }
                        }
                    }
                    
                    if (bestIdx >= 0) {
                        e.preventDefault();
                        touchZoneTap(e, bestIdx);
                    }
                }, { passive: false });
            }, 50);
        }
    }

    // ====== 返回 ======
    window.touchGoBack = function() {
        touchInteractState.editMode = false;
        touchInteractState.showSettings = false;
        if (touchInteractState.currentAudio) {
            touchInteractState.currentAudio.pause();
            touchInteractState.currentAudio = null;
        }
        if (touchInteractState.speechTimer) {
            clearTimeout(touchInteractState.speechTimer);
            touchInteractState.speechTimer = null;
        }
        document.querySelectorAll('.touch-speech-bubble').forEach(function(el) { el.remove(); });
        coupleViewMode = 'sub_status';
        renderCouple();
    };

    // ====== 设置菜单 ======
    window.touchOpenSettings = function() {
        touchInteractState.showSettings = true;
        renderCouple();
    };
    window.touchCloseSettings = function() {
        touchInteractState.showSettings = false;
        renderCouple();
    };

    // ====== 编辑模式 ======
    window.touchToggleEditMode = function() {
        touchInteractState.editMode = !touchInteractState.editMode;
        var space = getCurrentCoupleSpace();
        if (space) persistTouchState(space.id);
        renderCouple();
    };

    // ====== 添加部位 ======
    window.touchOpenAddZone = function() {
        // 先移除已有的
        var old = document.getElementById('touch-add-zone-modal');
        if (old) old.remove();

        var presetZones = ['头发', '额头', '脸颊', '眼睛', '鼻子', '嘴巴', '耳朵', '脖子', '锁骨', '肩膀', '手', '手指', '手腕', '胸口', '腰', '小腹', '后背', '臀部', '大腿', '小腿', '脚'];

        var presetsHTML = presetZones.map(function(name) {
            return '<div class="touch-preset-tag" onclick="touchSelectPreset(this,\'' + name + '\')">' + name + '</div>';
        }).join('');

        var modal = document.createElement('div');
        modal.className = 'touch-add-zone-modal';
        modal.id = 'touch-add-zone-modal';
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        modal.innerHTML = '<div class="touch-add-zone-sheet" onclick="event.stopPropagation()">' +
            '<div class="touch-sheet-title">添加身体部位</div>' +
            '<div class="touch-sheet-label">快速选择</div>' +
            '<div class="touch-preset-zones">' + presetsHTML + '</div>' +
            '<div class="touch-sheet-input-group">' +
                '<label class="touch-sheet-label">部位名称</label>' +
                '<input class="touch-sheet-input" id="touch-zone-name" placeholder="输入部位名称，如：头发" maxlength="10">' +
            '</div>' +
            '<div class="touch-sheet-size-row">' +
                '<div class="touch-sheet-input-group">' +
                    '<label class="touch-sheet-label">区域大小</label>' +
                    '<select class="touch-sheet-input" id="touch-zone-size">' +
                        '<option value="small">小（如鼻子、嘴巴）</option>' +
                        '<option value="medium" selected>中（如脸颊、手）</option>' +
                        '<option value="large">大（如上身、后背）</option>' +
                    '</select>' +
                '</div>' +
                '<div class="touch-sheet-input-group">' +
                    '<label class="touch-sheet-label">形状</label>' +
                    '<select class="touch-sheet-input" id="touch-zone-shape">' +
                        '<option value="circle">⭕ 圆形</option>' +
                        '<option value="ellipse">🥚 椭圆形</option>' +
                        '<option value="rect">▢ 矩形</option>' +
                    '</select>' +
                '</div>' +
            '</div>' +
            '<div class="touch-sheet-btn-row">' +
                '<button class="touch-sheet-btn secondary" onclick="document.getElementById(\'touch-add-zone-modal\').remove()">取消</button>' +
                '<button class="touch-sheet-btn primary" onclick="touchConfirmAddZone()">添加</button>' +
            '</div></div>';

        getDeviceEl().appendChild(modal);
    };

    window.touchSelectPreset = function(el, name) {
        document.querySelectorAll('.touch-preset-tag').forEach(function(t) { t.classList.remove('active'); });
        el.classList.add('active');
        var input = document.getElementById('touch-zone-name');
        if (input) input.value = name;
        var sizeMap = {
            '头发': 'large', '额头': 'medium', '脸颊': 'medium', '眼睛': 'small', '鼻子': 'small',
            '嘴巴': 'small', '耳朵': 'small', '脖子': 'medium', '锁骨': 'medium', '肩膀': 'large',
            '手': 'medium', '手指': 'small', '手腕': 'small', '胸口': 'large', '腰': 'large',
            '小腹': 'medium', '后背': 'large', '臀部': 'large', '大腿': 'large', '小腿': 'medium', '脚': 'small'
        };
        var shapeMap = {
            '头发': 'ellipse', '额头': 'rect', '脸颊': 'circle', '眼睛': 'ellipse', '鼻子': 'circle',
            '嘴巴': 'ellipse', '耳朵': 'circle', '脖子': 'ellipse', '锁骨': 'rect', '肩膀': 'rect',
            '手': 'ellipse', '手指': 'circle', '手腕': 'circle', '胸口': 'rect', '腰': 'rect',
            '小腹': 'ellipse', '后背': 'rect', '臀部': 'ellipse', '大腿': 'ellipse', '小腿': 'ellipse', '脚': 'ellipse'
        };
        var sizeEl = document.getElementById('touch-zone-size');
        if (sizeEl && sizeMap[name]) sizeEl.value = sizeMap[name];
        var shapeEl = document.getElementById('touch-zone-shape');
        if (shapeEl && shapeMap[name]) shapeEl.value = shapeMap[name];
    };

    window.touchConfirmAddZone = function() {
        var nameInput = document.getElementById('touch-zone-name');
        var sizeSelect = document.getElementById('touch-zone-size');
        var shapeSelect = document.getElementById('touch-zone-shape');
        var name = nameInput ? nameInput.value.trim() : '';
        if (!name) return toast('请输入部位名称');

        var sizeVal = sizeSelect ? sizeSelect.value : 'medium';
        var shapeVal = shapeSelect ? shapeSelect.value : 'circle';
        var sizeMap = { small: 10, medium: 16, large: 24 };
        var size = sizeMap[sizeVal] || 16;

        // 根据形状调整宽高比
        var w = size;
        var h2 = size; // h2 是实际高度百分比
        if (shapeVal === 'ellipse') {
            // 椭圆形：宽度比高度略小，或根据大小调整
            h2 = Math.round(size * 1.4);
        } else if (shapeVal === 'rect') {
            h2 = Math.round(size * 1.2);
        }

        var existingCount = touchInteractState.zones.length;
        var offsetX = (existingCount % 3) * 15;
        var offsetY = Math.floor(existingCount / 3) * 12;

        var zone = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            x: Math.min(50 - w/2 + offsetX, 90 - w),
            y: Math.min(30 + offsetY, 85 - h2),
            w: w,
            h: w,   // 保持w用于兼容
            h2: h2,  // 实际显示高度
            shape: shapeVal
        };

        touchInteractState.zones.push(zone);
        var space = getCurrentCoupleSpace();
        if (space) persistTouchState(space.id);

        var modal = document.getElementById('touch-add-zone-modal');
        if (modal) modal.remove();

        touchInteractState.editMode = true;
        renderCouple();
        toast('已添加「' + name + '」，拖动调整位置');
    };

    // ====== 删除部位 ======
    window.touchDeleteZone = function(idx) {
        var zone = touchInteractState.zones[idx];
        if (!zone) return;
        if (typeof showConfirm === 'function') {
            showConfirm('删除部位', '确定删除「' + zone.name + '」吗？', function() {
                delete touchInteractState.reactions[zone.id];
                touchInteractState.zones.splice(idx, 1);
                var space = getCurrentCoupleSpace();
                if (space) persistTouchState(space.id);
                renderCouple();
                toast('已删除');
            });
        } else {
            delete touchInteractState.reactions[zone.id];
            touchInteractState.zones.splice(idx, 1);
            var space = getCurrentCoupleSpace();
            if (space) persistTouchState(space.id);
            renderCouple();
            toast('已删除');
        }
    };

    // ====== 拖拽移动部位 (rAF优化) ======
    window.touchZoneDragStart = function(e, idx) {
        if (!touchInteractState.editMode) return;
        e.preventDefault();
        e.stopPropagation();

        var layer = document.getElementById('touch-zones-layer');
        if (!layer) return;
        var layerRect = layer.getBoundingClientRect();
        var zone = touchInteractState.zones[idx];
        if (!zone) return;
        var el = layer.querySelector('[data-zone-idx="' + idx + '"]');

        var startTouch = e.touches ? e.touches[0] : e;
        var startX = startTouch.clientX;
        var startY = startTouch.clientY;
        var origX = zone.x;
        var origY = zone.y;
        var _rafId = 0;
        var _lastTouchX = startX, _lastTouchY = startY;

        function onMove(ev) {
            ev.preventDefault();
            var touch = ev.touches ? ev.touches[0] : ev;
            _lastTouchX = touch.clientX;
            _lastTouchY = touch.clientY;
            if (!_rafId) {
                _rafId = requestAnimationFrame(function() {
                    _rafId = 0;
                    var dx = ((_lastTouchX - startX) / layerRect.width) * 100;
                    var dy = ((_lastTouchY - startY) / layerRect.height) * 100;
                    var actualH = zone.h2 || zone.h;
                    zone.x = Math.max(-zone.w * 0.4, Math.min(100 - zone.w * 0.6, origX + dx));
                    zone.y = Math.max(-actualH * 0.4, Math.min(100 - actualH * 0.6, origY + dy));
                    if (el) {
                        el.style.left = zone.x + '%';
                        el.style.top = zone.y + '%';
                    }
                });
            }
        }

        function onEnd() {
            if (_rafId) { cancelAnimationFrame(_rafId); _rafId = 0; }
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('touchend', onEnd);
            document.removeEventListener('mouseup', onEnd);
            var space = getCurrentCoupleSpace();
            if (space) persistTouchState(space.id);
        }

        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchend', onEnd);
        document.addEventListener('mouseup', onEnd);
    };

    // ====== 缩放部位 (rAF优化) ======
    window.touchZoneResizeStart = function(e, idx) {
        e.preventDefault();
        e.stopPropagation();

        var layer = document.getElementById('touch-zones-layer');
        if (!layer) return;
        var layerRect = layer.getBoundingClientRect();
        var zone = touchInteractState.zones[idx];
        if (!zone) return;
        var el = layer.querySelector('[data-zone-idx="' + idx + '"]');

        var startTouch = e.touches ? e.touches[0] : e;
        var startX = startTouch.clientX;
        var startY = startTouch.clientY;
        var origW = zone.w;
        var origH2 = zone.h2 || zone.h;
        var _rafId = 0;
        var _lastTouchX = startX, _lastTouchY = startY;

        function onMove(ev) {
            ev.preventDefault();
            var touch = ev.touches ? ev.touches[0] : ev;
            _lastTouchX = touch.clientX;
            _lastTouchY = touch.clientY;
            if (!_rafId) {
                _rafId = requestAnimationFrame(function() {
                    _rafId = 0;
                    var dx = ((_lastTouchX - startX) / layerRect.width) * 100;
                    var dy = ((_lastTouchY - startY) / layerRect.height) * 100;
                    zone.w = Math.max(6, Math.min(50, origW + dx));
                    zone.h2 = Math.max(6, Math.min(60, origH2 + dy));
                    zone.h = zone.w;
                    if (el) {
                        el.style.width = zone.w + '%';
                        el.style.height = zone.h2 + '%';
                    }
                });
            }
        }

        function onEnd() {
            if (_rafId) { cancelAnimationFrame(_rafId); _rafId = 0; }
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('touchend', onEnd);
            document.removeEventListener('mouseup', onEnd);
            var space = getCurrentCoupleSpace();
            if (space) persistTouchState(space.id);
        }

        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchend', onEnd);
        document.addEventListener('mouseup', onEnd);
    };

    // ====== 旋转部位 (rAF优化) ======
    window.touchZoneRotateStart = function(e, idx) {
        e.preventDefault();
        e.stopPropagation();

        var layer = document.getElementById('touch-zones-layer');
        if (!layer) return;
        var zone = touchInteractState.zones[idx];
        if (!zone) return;
        var el = layer.querySelector('[data-zone-idx="' + idx + '"]');

        var layerRect = layer.getBoundingClientRect();
        var centerX = layerRect.left + (zone.x + zone.w / 2) / 100 * layerRect.width;
        var centerY = layerRect.top + (zone.y + (zone.h2 || zone.h) / 2) / 100 * layerRect.height;
        var origRotate = zone.rotate || 0;

        var startTouch = e.touches ? e.touches[0] : e;
        var startAngle = Math.atan2(startTouch.clientY - centerY, startTouch.clientX - centerX) * 180 / Math.PI;
        var _rafId = 0;
        var _lastTouchX = startTouch.clientX, _lastTouchY = startTouch.clientY;

        function onMove(ev) {
            ev.preventDefault();
            var touch = ev.touches ? ev.touches[0] : ev;
            _lastTouchX = touch.clientX;
            _lastTouchY = touch.clientY;
            if (!_rafId) {
                _rafId = requestAnimationFrame(function() {
                    _rafId = 0;
                    var currentAngle = Math.atan2(_lastTouchY - centerY, _lastTouchX - centerX) * 180 / Math.PI;
                    var deltaAngle = currentAngle - startAngle;
                    zone.rotate = Math.round((origRotate + deltaAngle) % 360);
                    if (zone.rotate > 180) zone.rotate -= 360;
                    if (zone.rotate < -180) zone.rotate += 360;
                    if (el) {
                        el.style.transform = 'rotate(' + zone.rotate + 'deg)';
                        var label = el.querySelector('.touch-zone-label');
                        if (label) label.textContent = zone.name + ' ' + Math.round(zone.rotate) + '°';
                    }
                });
            }
        }

        function onEnd() {
            if (_rafId) { cancelAnimationFrame(_rafId); _rafId = 0; }
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('touchend', onEnd);
            document.removeEventListener('mouseup', onEnd);
            var space = getCurrentCoupleSpace();
            if (space) persistTouchState(space.id);
        }

        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchend', onEnd);
        document.addEventListener('mouseup', onEnd);
    };

    // ====== 触摸部位 - 防止重复触发 ======
    var _touchTapLock = false;
    window.touchZoneTap = async function(e, idx) {
        e.preventDefault();
        e.stopPropagation();
        if (_touchTapLock) return;
        _touchTapLock = true;
        setTimeout(function() { _touchTapLock = false; }, 300);

        var st = touchInteractState;
        if (st.editMode || st.generating) return;

        var zone = st.zones[idx];
        if (!zone) return;

        var space = getCurrentCoupleSpace();
        if (!space) return;
        var partner = store.contacts.find(function(x) { return x.id === space.partnerId; });
        if (!partner) return;

        // 涟漪效果
        createTouchRipple(e, idx);
        // 心形粒子
        createHeartParticles(e);

        // 先检查是否有缓存的预生成反应
        var cached = st.reactions[zone.id];
        if (cached && cached.length > 0) {
            var reaction = cached[0];
            showTouchSpeech(partner.name, reaction.text);
            if (reaction.audioUrl) {
                playTouchAudio(reaction.audioUrl);
            }
        }

        // 每次触摸都调用API生成新回复（异步）
        try {
            var newReaction = await generateSingleReaction(space, partner, zone);
            if (newReaction) {
                if (!cached || cached.length === 0) {
                    showTouchSpeech(partner.name, newReaction.text);
                    if (newReaction.audioUrl) {
                        playTouchAudio(newReaction.audioUrl);
                    }
                }
                if (!st.reactions[zone.id]) st.reactions[zone.id] = [];
                st.reactions[zone.id].unshift(newReaction);
                if (st.reactions[zone.id].length > 20) st.reactions[zone.id] = st.reactions[zone.id].slice(0, 20);
                persistTouchState(space.id);
            }
        } catch(err) {
            console.error('[Touch] 生成反应失败:', err);
            if (!cached || cached.length === 0) {
                showTouchSpeech(partner.name, '嗯...?（生成失败了）');
            }
        }
    };

    // ====== 生成单个部位反应 ======
    async function generateSingleReaction(space, partner, zone) {
        var partnerName = partner.name;
        var persona = partner.persona || '无特定人设';
        var userName = typeof getUserPersonaName === 'function' ? getUserPersonaName(partner, store.user?.name || '用户') : (store.user?.name || '用户');

        var worldBookContent = '';
        try {
            if (partner.settings && partner.settings.mountedWbIds && Array.isArray(partner.settings.mountedWbIds)) {
                var mountedBooks = (store.worldbooks || []).filter(function(wb) { return partner.settings.mountedWbIds.includes(wb.id); });
                if (mountedBooks.length > 0) {
                    worldBookContent = mountedBooks.map(function(wb) { return '[' + wb.name + ']:\n' + wb.content; }).join('\n\n');
                }
            }
        } catch(_wbErr) { console.warn('[worldbook] 触摸获取世界书失败:', _wbErr); }

        var voiceId = (partner.settings && partner.settings.voiceId) ? partner.settings.voiceId : 'male-qn-qingse';

        var prompt = '你是' + partnerName + '。你的人设：' + persona + '\n' +
            (worldBookContent ? '世界书/背景：' + worldBookContent.substring(0, 500) + '\n' : '') +
            '你在意的人：' + userName + '\n\n' +
            '【场景】' + userName + '正在看你的照片，然后用手指戳了你的「' + zone.name + '」。\n\n' +
            '【任务】用你的性格和语气，生成你被戳到「' + zone.name + '」时的一句反应/台词。要求：\n' +
            '1. 完全符合你的人设和性格\n' +
            '2. 生动、自然、有趣，像真人被戳到那个部位时的真实反应\n' +
            '3. 台词只需要一句话(10-30个字)，不需要动作描写\n' +
            '4. 每次反应要不同，有时害羞、有时嗔怪、有时调皮、有时撒娇\n' +
            '5. 可以适当表达被触摸该部位的身体感受\n\n' +
            '只输出台词文字，不要加引号和任何额外说明。';

        _currentApiScene = 'game';
        var data = await API.chatCompletion([
            { role: 'system', content: '你是一个角色扮演反应生成器。只输出角色说的一句话，不需要任何额外格式。' },
            { role: 'user', content: prompt }
        ], { temperature: 0.9, scene: 'game' });

        var text = (data.choices[0].message.content || '').trim();
        text = text.replace(/^["""''「」『』]+|["""''「」『』]+$/g, '');
        if (!text) return null;

        var audioUrl = null;
        var hasTTS = store.system && store.system.minimax && store.system.minimax.apiKey;
        if (hasTTS) {
            try {
                var result = await API.textToSpeech(text, voiceId, 'zh');
                if (result && result !== '__BROWSER_TTS_DONE__') {
                    audioUrl = URL.createObjectURL(result);
                }
            } catch(e) {
                console.warn('[Touch] TTS合成失败:', e);
            }
        }

        return {
            text: text,
            audioUrl: audioUrl,
            timestamp: Date.now(),
            zoneName: zone.name
        };
    }

    // ====== 首次生成所有部位的反应 ======
    window.touchGenerateAllReactions = async function() {
        var st = touchInteractState;
        if (st.generating) return;
        if (st.zones.length === 0) return toast('请先添加身体部位');

        var space = getCurrentCoupleSpace();
        if (!space) return toast('请先进入情侣空间');
        var partner = store.contacts.find(function(x) { return x.id === space.partnerId; });
        if (!partner) return toast('找不到联系人');

        st.generating = true;
        st.loadingText = '正在生成反应...';
        st.loadingProgress = '0/' + st.zones.length;
        renderCouple();

        var completed = 0;
        for (var i = 0; i < st.zones.length; i++) {
            var zone = st.zones[i];
            try {
                st.loadingProgress = completed + '/' + st.zones.length + ' - ' + zone.name;
                renderCouple();

                var reaction = await generateSingleReaction(space, partner, zone);
                if (reaction) {
                    if (!st.reactions[zone.id]) st.reactions[zone.id] = [];
                    st.reactions[zone.id].unshift(reaction);
                }
                completed++;
            } catch(e) {
                console.error('[Touch] 生成 ' + zone.name + ' 反应失败:', e);
                completed++;
            }
        }

        st.generating = false;
        st.loadingText = '';
        st.loadingProgress = '';
        persistTouchState(space.id);
        renderCouple();
        toast('反应生成完成！试试戳一戳吧~', 'success');
    };

    // ====== 重新生成所有反应 ======
    window.touchRegenReactions = function() {
        if (typeof showConfirm === 'function') {
            showConfirm('重新生成', '将为所有部位重新生成反应文字和语音，确定吗？', function() {
                touchInteractState.reactions = {};
                var space = getCurrentCoupleSpace();
                if (space) persistTouchState(space.id);
                touchGenerateAllReactions();
            });
        } else {
            touchInteractState.reactions = {};
            var space = getCurrentCoupleSpace();
            if (space) persistTouchState(space.id);
            touchGenerateAllReactions();
        }
    };

    // ====== 显示浮现文字 ======
    function showTouchSpeech(name, text) {
        document.querySelectorAll('.touch-speech-bubble').forEach(function(el) {
            el.classList.add('fade-out');
            setTimeout(function() { el.remove(); }, 500);
        });

        if (touchInteractState.speechTimer) {
            clearTimeout(touchInteractState.speechTimer);
        }

        var bubble = document.createElement('div');
        bubble.className = 'touch-speech-bubble';
        bubble.innerHTML = '<div class="touch-speech-name">' + name + '</div><div class="touch-speech-text">' + text + '</div>';
        getDeviceEl().appendChild(bubble);

        touchInteractState.speechTimer = setTimeout(function() {
            bubble.classList.add('fade-out');
            setTimeout(function() { bubble.remove(); }, 500);
        }, 4000);
    }

    // ====== 播放语音 ======
    function playTouchAudio(audioUrl) {
        if (touchInteractState.currentAudio) {
            touchInteractState.currentAudio.pause();
        }
        var audio = new Audio(audioUrl);
        touchInteractState.currentAudio = audio;
        audio.play().catch(function(e) { console.warn('[Touch] 播放失败:', e); });
        audio.onended = function() {
            touchInteractState.currentAudio = null;
        };
    }

    // ====== 涟漪效果 ======
    function createTouchRipple(e, idx) {
        var layer = document.getElementById('touch-zones-layer');
        if (!layer) return;
        var zone = touchInteractState.zones[idx];
        if (!zone) return;

        var ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        var size = 60;
        var cx = zone.x + zone.w / 2;
        var cy = zone.y + zone.h / 2;
        ripple.style.cssText = 'left:calc(' + cx + '% - ' + (size/2) + 'px);top:calc(' + cy + '% - ' + (size/2) + 'px);width:' + size + 'px;height:' + size + 'px;';
        layer.appendChild(ripple);
        setTimeout(function() { ripple.remove(); }, 800);
    }

    // ====== 心形粒子 (性能优化：复用DOM + 限制粒子数) ======
    var _heartPool = [];
    var _activeHearts = 0;
    var _maxHearts = 6; // 同时存在的最大粒子数

    function createHeartParticles(e) {
        var layer = document.getElementById('touch-zones-layer');
        if (!layer) return;
        // 限制同时存在的粒子数量，避免低端设备卡顿
        if (_activeHearts >= _maxHearts) return;

        var rect = layer.getBoundingClientRect();
        var touch = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
        var x = touch.clientX - rect.left;
        var y = touch.clientY - rect.top;

        var hearts = ['💕', '❤️', '💗', '💖', '✨'];
        // 减少到2个粒子（从3个）
        for (var i = 0; i < 2; i++) {
            var heart;
            if (_heartPool.length > 0) {
                heart = _heartPool.pop();
                heart.style.animation = 'none';
                // 强制reflow后重新触发动画
                void heart.offsetWidth;
            } else {
                heart = document.createElement('div');
                heart.className = 'touch-heart-particle';
            }
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.left = (x + (Math.random() - 0.5) * 40) + 'px';
            heart.style.top = (y - 10) + 'px';
            heart.style.animation = 'touch-heart-float 1s ease-out forwards';
            heart.style.animationDelay = (i * 0.1) + 's';
            layer.appendChild(heart);
            _activeHearts++;
            (function(h) {
                setTimeout(function() {
                    if (h.parentNode) h.parentNode.removeChild(h);
                    _heartPool.push(h);
                    _activeHearts--;
                }, 1100);
            })(heart);
        }
    }

    // ====== 更换背景 ======
    window.touchChangeBgImage = function() {
        openImgUploadModal('更换互动背景图', function(imgResult) {
            var space = getCurrentCoupleSpace();
            if (!space) return;
            touchInteractState.bgImage = imgResult;
            persistTouchState(space.id);
            renderCouple();
            toast('背景已更换');
        });
    };

    // ====== 重置所有 ======
    window.touchResetAll = function() {
        if (typeof showConfirm === 'function') {
            showConfirm('重置互动', '将清除所有部位、反应和图片数据，确定吗？', function() {
                var space = getCurrentCoupleSpace();
                if (!space) return;
                touchInteractState.bgImage = null;
                touchInteractState.zones = [];
                touchInteractState.reactions = {};
                touchInteractState.editMode = false;
                persistTouchState(space.id);
                renderCouple();
                toast('已重置');
            });
        }
    };

    // ====== 查看互动留存 ======
    window.touchOpenHistory = function() {
        var old = document.getElementById('touch-history-modal');
        if (old) old.remove();

        var st = touchInteractState;
        var allReactions = [];

        for (var i = 0; i < st.zones.length; i++) {
            var zone = st.zones[i];
            var reactions = st.reactions[zone.id] || [];
            for (var j = 0; j < reactions.length; j++) {
                var r = reactions[j];
                allReactions.push({
                    text: r.text,
                    audioUrl: r.audioUrl,
                    timestamp: r.timestamp,
                    zoneName: zone.name,
                    zoneId: zone.id
                });
            }
        }

        allReactions.sort(function(a, b) { return (b.timestamp || 0) - (a.timestamp || 0); });

        if (allReactions.length === 0) {
            toast('还没有互动留存，快去戳一戳吧~');
            return;
        }

        var itemsHTML = allReactions.map(function(r) {
            var time = r.timestamp ? new Date(r.timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
            return '<div class="touch-history-item">' +
                '<div class="touch-history-zone-name">' + (r.zoneName || '?') + '</div>' +
                '<div class="touch-history-text">' + r.text + '</div>' +
                '<div class="touch-history-time">' + time + '</div>' +
                '<div class="touch-history-actions">' +
                    (r.audioUrl ? '<div class="touch-history-action-btn" onclick="touchPlayHistoryAudio(\'' + r.audioUrl + '\')"><i class="fas fa-play"></i></div>' : '') +
                    '<div class="touch-history-action-btn delete" onclick="touchDeleteReaction(\'' + r.zoneId + '\',' + r.timestamp + ')"><i class="fas fa-trash"></i></div>' +
                '</div></div>';
        }).join('');

        var modal = document.createElement('div');
        modal.className = 'touch-history-modal';
        modal.id = 'touch-history-modal';
        modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
        modal.innerHTML = '<div class="touch-history-sheet" onclick="event.stopPropagation()">' +
            '<div class="touch-sheet-title">互动留存 (' + allReactions.length + ')</div>' +
            itemsHTML +
            '<div style="text-align:center;margin-top:12px;color:#bbb;cursor:pointer;padding:10px;" onclick="document.getElementById(\'touch-history-modal\').remove()">关闭</div>' +
            '</div>';
        getDeviceEl().appendChild(modal);
    };

    window.touchPlayHistoryAudio = function(audioUrl) {
        playTouchAudio(audioUrl);
    };

    window.touchDeleteReaction = function(zoneId, timestamp) {
        var st = touchInteractState;
        if (st.reactions[zoneId]) {
            st.reactions[zoneId] = st.reactions[zoneId].filter(function(r) { return r.timestamp !== timestamp; });
        }
        var space = getCurrentCoupleSpace();
        if (space) persistTouchState(space.id);
        var modal = document.getElementById('touch-history-modal');
        if (modal) modal.remove();
        touchOpenHistory();
        toast('已删除');
    };

})();
