// ============================================
// 角色关系网模块 - Character Relationship Network
// 横屏布局 + Canvas关系图 + 档案卡片
// ============================================

(function() {
    'use strict';

    // === 数据管理 ===
    // [FIX-关系网隔离] 关系网按联系人隔离存储，每个联系人有独立的关系网
    // 数据存储在 store.relationNetworks[contactId] 中
    function getRNData() {
        const contactId = typeof activeChatId !== 'undefined' ? activeChatId : null;
        if (!contactId) {
            // 无活跃聊天时返回空数据（不可写入store）
            return { characters: [], relations: [] };
        }
        if (!store.relationNetworks) store.relationNetworks = {};
        
        // [FIX-关系网隔离] 兼容旧数据：如果存在旧的全局 store.relationNetwork，迁移到当前联系人
        if (store.relationNetwork) {
            if (!store.relationNetworks[contactId]) {
                const oldRN = store.relationNetwork;
                if (oldRN.characters && oldRN.characters.length > 0) {
                    store.relationNetworks[contactId] = JSON.parse(JSON.stringify(oldRN));
                    console.log('[关系网迁移] 已将旧全局关系网数据迁移到联系人:', contactId);
                }
            }
            // 迁移完成后删除旧数据，避免下次再迁移到其他联系人
            delete store.relationNetwork;
            if (typeof save === 'function') save();
        }
        
        if (!store.relationNetworks[contactId]) {
            store.relationNetworks[contactId] = {
                characters: [],
                relations: []
            };
        }
        // 兼容旧数据：将personality映射到identity，background映射到experience
        const rn = store.relationNetworks[contactId];
        if (rn.characters) {
            rn.characters.forEach(c => {
                if (c.personality && !c.identity) {
                    c.identity = c.personality;
                }
                if (c.background && !c.experience) {
                    c.experience = c.background;
                }
                if (!c.contactRelation) c.contactRelation = '';
                if (!c.familyBg) c.familyBg = '';
                if (!c.experience) c.experience = '';
                if (!c.identity) c.identity = '';
                // [关联联系人] 兼容旧数据
                if (!c.linkedContactId) c.linkedContactId = '';
                if (!c.linkedContactRole) c.linkedContactRole = '';
            });
        }
        return rn;
    }

    // 确保联系人和用户始终存在
    function ensureProtagonists() {
        const rn = getRNData();
        const contact = store.contacts ? store.contacts.find(c => c.id === activeChatId) : null;
        const user = store.user || {};

        // 获取聊天设置中挂载的用户人设（优先使用人设数据，而非微信数据）
        let userPersona = null;
        if (contact && contact.settings && contact.settings.userPersona) {
            userPersona = (store.personas || []).find(p => p.id === contact.settings.userPersona);
        }
        if (!userPersona && store.personas && store.personas.length > 0) {
            userPersona = store.personas[0];
        }

        const userDisplayName = (userPersona && userPersona.name) ? userPersona.name : (user.name || '用户');
        const userDisplayAvatar = (userPersona && userPersona.avatar) ? userPersona.avatar : (user.avatar || '');

        // 确保用户角色存在（使用人设数据）
        let userChar = rn.characters.find(c => c.id === '__user__');
        if (!userChar) {
            userChar = {
                id: '__user__',
                name: userDisplayName,
                avatar: userDisplayAvatar,
                role: 'user',
                gender: '',
                age: '',
                identity: '真实用户',
                experience: '',
                familyBg: '',
                contactRelation: '',
                notes: '',
                x: 0, y: 0
            };
            rn.characters.push(userChar);
        } else {
            userChar.name = userDisplayName || userChar.name || '用户';
            userChar.avatar = userDisplayAvatar || userChar.avatar || '';
        }

        // 确保联系人角色存在（使用联系人的人设名和头像）
        if (contact) {
            // 联系人的人设名和头像：优先使用联系人自身设置的名字和头像
            const contactDisplayName = contact.name || '联系人';
            const contactDisplayAvatar = contact.avatar || '';

            let contactChar = rn.characters.find(c => c.id === '__contact__');
            if (!contactChar) {
                contactChar = {
                    id: '__contact__',
                    name: contactDisplayName,
                    avatar: contactDisplayAvatar,
                    role: 'contact',
                    gender: '',
                    age: '',
                    identity: '联系人',
                    experience: '',
                    familyBg: '',
                    contactRelation: '',
                    notes: '',
                    x: 0, y: 0
                };
                rn.characters.push(contactChar);
            } else {
                contactChar.name = contactDisplayName || contactChar.name || '联系人';
                contactChar.avatar = contactDisplayAvatar || contactChar.avatar || '';
            }
        }
        return rn;
    }

    // === 星空背景 ===
    let starCanvas, starCtx, stars = [];
    let starAnimFrame;

    function initStarfield() {
        const container = document.querySelector('.rn-starfield');
        if (!container) return;
        starCanvas = container.querySelector('canvas');
        if (!starCanvas) {
            starCanvas = document.createElement('canvas');
            container.appendChild(starCanvas);
        }
        starCtx = starCanvas.getContext('2d');
        resizeStarCanvas();
        createStars();
        animateStars();
    }

    function resizeStarCanvas() {
        if (!starCanvas) return;
        starCanvas.width = window.innerWidth;
        starCanvas.height = window.innerHeight;
    }

    function createStars() {
        stars = [];
        const count = Math.min(200, Math.floor(window.innerWidth * window.innerHeight / 4000));
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * starCanvas.width,
                y: Math.random() * starCanvas.height,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                speed: Math.random() * 0.02 + 0.005,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    function animateStars() {
        if (!starCtx || !starCanvas) return;
        starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
        
        // 深空渐变背景
        const gradient = starCtx.createRadialGradient(
            starCanvas.width / 2, starCanvas.height / 2, 0,
            starCanvas.width / 2, starCanvas.height / 2, starCanvas.width * 0.7
        );
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(0.5, '#050510');
        gradient.addColorStop(1, '#000005');
        starCtx.fillStyle = gradient;
        starCtx.fillRect(0, 0, starCanvas.width, starCanvas.height);

        // 绘制星星
        const time = Date.now() * 0.001;
        stars.forEach(s => {
            const twinkle = Math.sin(time * s.speed * 50 + s.phase) * 0.3 + 0.7;
            starCtx.beginPath();
            starCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            starCtx.fillStyle = `rgba(200,220,255,${s.opacity * twinkle})`;
            starCtx.fill();
            
            if (s.size > 1.5) {
                starCtx.beginPath();
                starCtx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
                starCtx.fillStyle = `rgba(150,180,255,${s.opacity * twinkle * 0.1})`;
                starCtx.fill();
            }
        });

        starAnimFrame = requestAnimationFrame(animateStars);
    }

    function stopStarfield() {
        if (starAnimFrame) {
            cancelAnimationFrame(starAnimFrame);
            starAnimFrame = null;
        }
    }

    // === Canvas 关系图渲染 ===
    let rnCanvas, rnCtx;
    let viewOffset = { x: 0, y: 0 };
    let viewScale = 1;
    let dragState = { dragging: false, dragNode: null, startX: 0, startY: 0, lastX: 0, lastY: 0, isPanning: false, isDragConfirmed: false };
    let avatarCache = {};
    let rnAnimFrame;

    // 节点大小根据角色类型和关系远近计算（缩小版适配手机）
    function getNodeRadius(ch) {
        const rn = getRNData();
        if (ch.role === 'user' || ch.role === 'contact') {
            return 28; // 主要人物
        }
        // NPC: 根据与主角的关系远近计算大小
        const rels = rn.relations;
        const hasDirectRelToProtag = rels.some(r =>
            (r.from === ch.id && (r.to === '__user__' || r.to === '__contact__')) ||
            (r.to === ch.id && (r.from === '__user__' || r.from === '__contact__'))
        );
        if (hasDirectRelToProtag) return 22; // 与主角直接关系
        
        // 检查是否有间接关系（通过其他NPC关联到主角）
        const directlyConnected = rels.filter(r => r.from === ch.id || r.to === ch.id);
        if (directlyConnected.length > 0) return 18; // 有关系的NPC
        
        return 16; // 无关系的NPC最小
    }

    function initRelationCanvas() {
        const area = document.querySelector('.rn-canvas-area');
        if (!area) return;
        rnCanvas = area.querySelector('canvas');
        if (!rnCanvas) {
            rnCanvas = document.createElement('canvas');
            area.appendChild(rnCanvas);
        }
        rnCtx = rnCanvas.getContext('2d');
        resizeRNCanvas();
        setupCanvasEvents();
        autoLayoutCharacters();
        renderRelationGraph();
    }

    function resizeRNCanvas() {
        if (!rnCanvas) return;
        const area = document.querySelector('.rn-canvas-area');
        if (!area) return;
        rnCanvas.width = area.clientWidth * (window.devicePixelRatio || 1);
        rnCanvas.height = area.clientHeight * (window.devicePixelRatio || 1);
        rnCanvas.style.width = area.clientWidth + 'px';
        rnCanvas.style.height = area.clientHeight + 'px';
        rnCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }

    function autoLayoutCharacters() {
        const rn = getRNData();
        const chars = rn.characters;
        if (chars.length === 0) return;

        const w = rnCanvas ? (rnCanvas.width / (window.devicePixelRatio || 1)) : window.innerWidth;
        const h = rnCanvas ? (rnCanvas.height / (window.devicePixelRatio || 1)) : window.innerHeight;
        const cx = w / 2;
        const cy = h / 2;

        // 检查是否需要重新布局
        const needLayout = chars.some(c => c.x === 0 && c.y === 0);
        if (!needLayout) return;

        if (chars.length === 1) {
            chars[0].x = cx;
            chars[0].y = cy;
        } else if (chars.length === 2) {
            chars[0].x = cx - 120;
            chars[0].y = cy;
            chars[1].x = cx + 120;
            chars[1].y = cy;
        } else {
            // 横屏布局：user和contact在左右两侧偏中间，NPC围绕分布
            const userChar = chars.find(c => c.role === 'user');
            const contactChar = chars.find(c => c.role === 'contact');
            const npcs = chars.filter(c => c.role !== 'user' && c.role !== 'contact');

            if (userChar && (userChar.x === 0 && userChar.y === 0)) {
                userChar.x = cx - w * 0.2;
                userChar.y = cy;
            }
            if (contactChar && (contactChar.x === 0 && contactChar.y === 0)) {
                contactChar.x = cx + w * 0.2;
                contactChar.y = cy;
            }

            const radius = Math.min(w, h) * 0.32;
            npcs.forEach((npc, i) => {
                if (npc.x === 0 && npc.y === 0) {
                    const angle = (i / npcs.length) * Math.PI * 2 - Math.PI / 2;
                    npc.x = cx + Math.cos(angle) * radius;
                    npc.y = cy + Math.sin(angle) * radius;
                }
            });
        }

        viewOffset = { x: 0, y: 0 };
        viewScale = 1;
    }

    function loadAvatar(src) {
        if (!src) return null;
        if (avatarCache[src]) return avatarCache[src];
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            avatarCache[src] = img;
            renderRelationGraph();
        };
        img.onerror = () => {
            avatarCache[src] = null;
        };
        img.src = src;
        avatarCache[src] = 'loading';
        return 'loading';
    }

    function renderRelationGraph() {
        if (!rnCtx || !rnCanvas) return;
        const rn = getRNData();
        const dpr = window.devicePixelRatio || 1;
        const w = rnCanvas.width / dpr;
        const h = rnCanvas.height / dpr;

        rnCtx.save();
        rnCtx.clearRect(0, 0, w, h);

        // 应用视图变换
        rnCtx.translate(viewOffset.x, viewOffset.y);
        rnCtx.scale(viewScale, viewScale);

        const chars = rn.characters;
        const rels = rn.relations;

        // 1. 先画关系线
        rels.forEach(rel => {
            const fromChar = chars.find(c => c.id === rel.from);
            const toChar = chars.find(c => c.id === rel.to);
            if (!fromChar || !toChar) return;

            // 画线 - 白色调
            rnCtx.beginPath();
            rnCtx.moveTo(fromChar.x, fromChar.y);
            rnCtx.lineTo(toChar.x, toChar.y);
            rnCtx.strokeStyle = 'rgba(255,255,255,0.2)';
            rnCtx.lineWidth = 1.5;
            rnCtx.stroke();

            // 发光效果
            rnCtx.beginPath();
            rnCtx.moveTo(fromChar.x, fromChar.y);
            rnCtx.lineTo(toChar.x, toChar.y);
            rnCtx.strokeStyle = 'rgba(255,255,255,0.05)';
            rnCtx.lineWidth = 6;
            rnCtx.stroke();

            // 关系标签 - 直角小标签
            if (rel.label) {
                const mx = (fromChar.x + toChar.x) / 2;
                const my = (fromChar.y + toChar.y) / 2;
                
                rnCtx.font = '9px "PingFang SC", "Microsoft YaHei", sans-serif';
                const textWidth = rnCtx.measureText(rel.label).width;
                const padding = 5;
                
                // 直角方块背景
                const rx = mx - textWidth / 2 - padding;
                const ry = my - 7;
                const rw = textWidth + padding * 2;
                const rh = 14;
                rnCtx.fillStyle = 'rgba(0,0,0,0.7)';
                rnCtx.fillRect(rx, ry, rw, rh);
                
                rnCtx.strokeStyle = 'rgba(255,255,255,0.1)';
                rnCtx.lineWidth = 0.5;
                rnCtx.strokeRect(rx, ry, rw, rh);

                rnCtx.fillStyle = 'rgba(255,255,255,0.7)';
                rnCtx.textAlign = 'center';
                rnCtx.textBaseline = 'middle';
                rnCtx.fillText(rel.label, mx, my);
            }
        });

        // 2. 画角色节点
        chars.forEach(ch => {
            const nodeRadius = getNodeRadius(ch);
            const cx = ch.x;
            const cy = ch.y;

            // 白色边框圆环（锐利细线）
            rnCtx.beginPath();
            rnCtx.arc(cx, cy, nodeRadius + 1.5, 0, Math.PI * 2);
            rnCtx.strokeStyle = 'rgba(255,255,255,0.7)';
            rnCtx.lineWidth = 1.5;
            rnCtx.stroke();

            // 头像裁剪 - 圆形内只显示头像
            rnCtx.save();
            rnCtx.beginPath();
            rnCtx.arc(cx, cy, nodeRadius, 0, Math.PI * 2);
            rnCtx.clip();

            const avatarImg = ch.avatar ? loadAvatar(ch.avatar) : null;
            if (avatarImg && avatarImg !== 'loading') {
                // 显示头像图片
                rnCtx.drawImage(avatarImg, cx - nodeRadius, cy - nodeRadius, nodeRadius * 2, nodeRadius * 2);
            } else {
                // 默认头像背景 + 首字母（无头像时）
                const bgGrad = rnCtx.createLinearGradient(cx - nodeRadius, cy - nodeRadius, cx + nodeRadius, cy + nodeRadius);
                bgGrad.addColorStop(0, '#1a1a2e');
                bgGrad.addColorStop(1, '#16213e');
                rnCtx.fillStyle = bgGrad;
                rnCtx.fillRect(cx - nodeRadius, cy - nodeRadius, nodeRadius * 2, nodeRadius * 2);
                
                // 首字母作为默认头像占位
                rnCtx.fillStyle = 'rgba(255,255,255,0.8)';
                const fontSize = Math.max(10, nodeRadius * 0.65);
                rnCtx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
                rnCtx.textAlign = 'center';
                rnCtx.textBaseline = 'middle';
                rnCtx.fillText((ch.name || '?')[0], cx, cy);
            }
            rnCtx.restore();

            // 名字标签 - 在圆形下方（紧凑小字）
            const nameFontSize = 10;
            rnCtx.font = `${nameFontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
            rnCtx.textAlign = 'center';
            rnCtx.textBaseline = 'top';
            
            const nameWidth = rnCtx.measureText(ch.name || '').width;
            rnCtx.fillStyle = 'rgba(0,0,0,0.55)';
            const nbx = cx - nameWidth / 2 - 4;
            const nby = cy + nodeRadius + 3;
            const nbw = nameWidth + 8;
            const nbh = 14;
            // 直角小标签
            rnCtx.fillRect(nbx, nby, nbw, nbh);

            rnCtx.fillStyle = 'rgba(255,255,255,0.9)';
            rnCtx.fillText(ch.name || '未命名', cx, cy + nodeRadius + 4);
        });

        rnCtx.restore();

        // 空状态提示
        const emptyHint = document.querySelector('.rn-empty-hint');
        if (emptyHint) {
            emptyHint.style.display = chars.length <= 2 ? 'block' : 'none';
        }
    }

    // === Canvas交互 ===
    let canvasEventsSetup = false;
    function setupCanvasEvents() {
        if (!rnCanvas) return;
        // [FIX] 防止重复绑定事件导致状态混乱（每次openRelationNetwork都会调用initRelationCanvas）
        if (canvasEventsSetup && rnCanvas._eventsAttached) return;

        // 先移除旧事件（安全起见）
        rnCanvas.removeEventListener('touchstart', handleTouchStart);
        rnCanvas.removeEventListener('touchmove', handleTouchMove);
        rnCanvas.removeEventListener('touchend', handleTouchEnd);
        rnCanvas.removeEventListener('mousedown', handleMouseDown);
        rnCanvas.removeEventListener('mousemove', handleMouseMove);
        rnCanvas.removeEventListener('mouseup', handleMouseUp);
        rnCanvas.removeEventListener('wheel', handleWheel);
        rnCanvas.removeEventListener('click', handleCanvasClick);

        rnCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        rnCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        rnCanvas.addEventListener('touchend', handleTouchEnd);

        rnCanvas.addEventListener('mousedown', handleMouseDown);
        rnCanvas.addEventListener('mousemove', handleMouseMove);
        rnCanvas.addEventListener('mouseup', handleMouseUp);
        rnCanvas.addEventListener('wheel', handleWheel, { passive: false });

        rnCanvas.addEventListener('click', handleCanvasClick);

        canvasEventsSetup = true;
        rnCanvas._eventsAttached = true;
    }

    let lastTouchDist = 0;
    let touchStartTime = 0;
    let lastTouchEndTime = 0;

    function screenToWorld(sx, sy) {
        return {
            x: (sx - viewOffset.x) / viewScale,
            y: (sy - viewOffset.y) / viewScale
        };
    }

    function findNodeAt(wx, wy, extraMargin) {
        const rn = getRNData();
        // [FIX] 在移动端增大触摸检测范围，考虑缩放比例
        const touchExtra = (extraMargin || 0) + 15 + (viewScale < 1 ? Math.round(15 / viewScale) : 0);
        for (let i = rn.characters.length - 1; i >= 0; i--) {
            const ch = rn.characters[i];
            const nodeRadius = getNodeRadius(ch);
            const dx = ch.x - wx;
            const dy = ch.y - wy;
            if (Math.sqrt(dx * dx + dy * dy) <= nodeRadius + touchExtra) {
                return ch;
            }
        }
        return null;
    }

    // [FIX-触摸坐标] 检测是否处于CSS旋转横屏模式
    function isPortraitRotated() {
        const layer = document.getElementById('layer-relation-network');
        if (!layer) return false;
        return window.matchMedia('(orientation: portrait)').matches && layer.classList.contains('active');
    }

    // [FIX-触摸坐标] 将触摸/鼠标的视口坐标转换为canvas内部坐标
    // 在竖屏CSS旋转90度模式下，需要特殊处理坐标映射
    function getLocalPos(clientX, clientY) {
        if (!rnCanvas) return { x: 0, y: 0 };
        const rect = rnCanvas.getBoundingClientRect();
        if (isPortraitRotated()) {
            // CSS rotate(90deg)顺时针 + transform-origin: top left + left: 100vw
            // 旋转后getBoundingClientRect返回AABB:
            //   rect.width = canvas原始高度, rect.height = canvas原始宽度
            // 坐标映射：
            //   视口Y增大 → canvas本地X增大 (localX = clientY - rect.top)
            //   视口X增大 → canvas本地Y减小 (localY = rect.right - clientX)
            const localX = clientY - rect.top;
            const localY = rect.right - clientX;
            return { x: localX, y: localY };
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function getCanvasPos(e) {
        return getLocalPos(e.clientX, e.clientY);
    }

    function handleTouchStart(e) {
        e.preventDefault();
        touchStartTime = Date.now();
        
        if (e.touches.length === 1) {
            const pos = getLocalPos(e.touches[0].clientX, e.touches[0].clientY);
            const world = screenToWorld(pos.x, pos.y);
            const node = findNodeAt(world.x, world.y);
            
            dragState.startX = pos.x;
            dragState.startY = pos.y;
            dragState.lastX = pos.x;
            dragState.lastY = pos.y;
            // [FIX] 保存原始触摸viewport坐标，用于touchEnd中的后备检测
            dragState.startClientX = e.touches[0].clientX;
            dragState.startClientY = e.touches[0].clientY;
            
            if (node) {
                dragState.dragging = true;
                dragState.dragNode = node;
                dragState.isPanning = false;
                dragState.isDragConfirmed = false;
            } else {
                dragState.dragging = true;
                dragState.dragNode = null;
                dragState.isPanning = true;
            }
        } else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDist = Math.sqrt(dx * dx + dy * dy);
            dragState.dragging = false;
        }
    }

    function handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && dragState.dragging) {
            const pos = getLocalPos(e.touches[0].clientX, e.touches[0].clientY);
            const dx = pos.x - dragState.lastX;
            const dy = pos.y - dragState.lastY;
            
            // 计算从起始点的总移动量
            const totalMoveFromStart = Math.abs(pos.x - dragState.startX) + Math.abs(pos.y - dragState.startY);

            // 如果是节点触摸且未超过拖拽阈值，不移动节点（保持为潜在点击）
            // [FIX] 增大拖拽阈值从15到25，移动设备上手指抖动常超过15像素
            if (dragState.dragNode && !dragState.isDragConfirmed) {
                if (totalMoveFromStart >= 25) {
                    dragState.isDragConfirmed = true;  // 确认为拖拽
                } else {
                    dragState.lastX = pos.x;
                    dragState.lastY = pos.y;
                    return;  // 不移动节点，等待判定
                }
            }

            if (dragState.dragNode) {
                dragState.dragNode.x += dx / viewScale;
                dragState.dragNode.y += dy / viewScale;
            } else {
                viewOffset.x += dx;
                viewOffset.y += dy;
            }
            
            dragState.lastX = pos.x;
            dragState.lastY = pos.y;
            renderRelationGraph();
        } else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (lastTouchDist > 0) {
                const scale = dist / lastTouchDist;
                const newScale = Math.max(0.3, Math.min(3, viewScale * scale));
                
                const midPos = getLocalPos((e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2);
                const cx = midPos.x;
                const cy = midPos.y;
                
                viewOffset.x = cx - (cx - viewOffset.x) * (newScale / viewScale);
                viewOffset.y = cy - (cy - viewOffset.y) * (newScale / viewScale);
                viewScale = newScale;
                
                renderRelationGraph();
                showZoomIndicator();
            }
            lastTouchDist = dist;
        }
    }

    function handleTouchEnd(e) {
        const elapsed = Date.now() - touchStartTime;
        
        // [FIX] 计算viewport级别的移动量（不依赖坐标映射，更可靠）
        let totalMove = 0;
        let totalClientMove = 0;
        let endTouch = null;
        if (e.changedTouches && e.changedTouches.length > 0) {
            endTouch = e.changedTouches[0];
            try {
                const endPos = getLocalPos(endTouch.clientX, endTouch.clientY);
                totalMove = Math.abs(endPos.x - dragState.startX) + Math.abs(endPos.y - dragState.startY);
            } catch(ex) {
                totalMove = 0;
            }
            // [FIX] 使用viewport原始坐标计算移动量作为后备（不受坐标映射影响）
            if (dragState.startClientX !== undefined) {
                totalClientMove = Math.abs(endTouch.clientX - dragState.startClientX) + Math.abs(endTouch.clientY - dragState.startClientY);
            }
        }
        
        // [FIX] 使用更宽松的点击判定条件
        // 条件1：未确认为拖拽 且 时间短
        // 条件2：viewport级别的移动量也很小（双重校验）
        const isLikelyTap = elapsed < 500 && !dragState.isDragConfirmed && (totalMove < 25 || totalClientMove < 25);
        
        if (isLikelyTap) {
            if (dragState.dragNode) {
                showCharacterCard(dragState.dragNode.id);
            } else {
                // dragNode可能在touchstart时未命中（坐标映射问题），用多种方式尝试检测
                let foundNode = null;
                
                // 方法1：使用touchEnd坐标重新检测
                if (endTouch) {
                    const pos = getLocalPos(endTouch.clientX, endTouch.clientY);
                    const world = screenToWorld(pos.x, pos.y);
                    foundNode = findNodeAt(world.x, world.y, 10);
                }
                
                // 方法2：使用touchStart保存的坐标重新检测（更大范围）
                if (!foundNode) {
                    const startWorld = screenToWorld(dragState.startX, dragState.startY);
                    foundNode = findNodeAt(startWorld.x, startWorld.y, 15);
                }
                
                if (foundNode) {
                    showCharacterCard(foundNode.id);
                }
            }
        }
        
        if (dragState.dragNode && dragState.isDragConfirmed) {
            save();  // 只在真正拖拽后保存
        }
        
        lastTouchEndTime = Date.now();
        dragState.dragging = false;
        dragState.dragNode = null;
        dragState.isPanning = false;
        dragState.isDragConfirmed = false;
        lastTouchDist = 0;
    }

    function handleMouseDown(e) {
        const pos = getCanvasPos(e);
        const world = screenToWorld(pos.x, pos.y);
        const node = findNodeAt(world.x, world.y);
        
        dragState.startX = pos.x;
        dragState.startY = pos.y;
        dragState.lastX = pos.x;
        dragState.lastY = pos.y;
        
        if (node) {
            dragState.dragging = true;
            dragState.dragNode = node;
            dragState.isPanning = false;
        } else {
            dragState.dragging = true;
            dragState.dragNode = null;
            dragState.isPanning = true;
        }
    }

    function handleMouseMove(e) {
        if (!dragState.dragging) return;
        const pos = getCanvasPos(e);
        const dx = pos.x - dragState.lastX;
        const dy = pos.y - dragState.lastY;
        
        if (dragState.dragNode) {
            dragState.dragNode.x += dx / viewScale;
            dragState.dragNode.y += dy / viewScale;
        } else {
            viewOffset.x += dx;
            viewOffset.y += dy;
        }
        
        dragState.lastX = pos.x;
        dragState.lastY = pos.y;
        renderRelationGraph();
    }

    function handleMouseUp(e) {
        if (dragState.dragNode) {
            save();
        }
        dragState.dragging = false;
        dragState.dragNode = null;
        dragState.isPanning = false;
    }

    function handleCanvasClick(e) {
        // [FIX] 如果是触摸设备且touchEnd已经处理过，跳过以避免重复
        if (Date.now() - lastTouchEndTime < 500) return;
        const pos = getCanvasPos(e);
        const totalMove = Math.abs(pos.x - dragState.startX) + Math.abs(pos.y - dragState.startY);
        if (totalMove > 20) return;
        
        const world = screenToWorld(pos.x, pos.y);
        const node = findNodeAt(world.x, world.y);
        if (node) {
            showCharacterCard(node.id);
        }
    }

    function handleWheel(e) {
        e.preventDefault();
        const pos = getCanvasPos(e);
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.3, Math.min(3, viewScale * delta));
        
        viewOffset.x = pos.x - (pos.x - viewOffset.x) * (newScale / viewScale);
        viewOffset.y = pos.y - (pos.y - viewOffset.y) * (newScale / viewScale);
        viewScale = newScale;
        
        renderRelationGraph();
        showZoomIndicator();
    }

    let zoomTimer;
    function showZoomIndicator() {
        const indicator = document.querySelector('.rn-zoom-indicator');
        if (!indicator) return;
        indicator.textContent = Math.round(viewScale * 100) + '%';
        indicator.classList.add('show');
        clearTimeout(zoomTimer);
        zoomTimer = setTimeout(() => indicator.classList.remove('show'), 1200);
    }

    // === 角色档案卡 - 横向ID Card风格，黑底白字暗黑版 ===
    function showCharacterCard(charId) {
        const rn = getRNData();
        const ch = rn.characters.find(c => c.id === charId);
        if (!ch) return;

        const overlay = document.getElementById('rn-card-overlay');
        if (!overlay) return;

        // 实时刷新主角的人设数据（确保卡片显示的是聊天设置中挂载的人设，而非微信数据）
        const _contact = store.contacts ? store.contacts.find(c => c.id === activeChatId) : null;
        if (charId === '__user__') {
            let _userPersona = null;
            if (_contact && _contact.settings && _contact.settings.userPersona) {
                _userPersona = (store.personas || []).find(p => p.id === _contact.settings.userPersona);
            }
            if (!_userPersona && store.personas && store.personas.length > 0) {
                _userPersona = store.personas[0];
            }
            if (_userPersona) {
                if (_userPersona.name) ch.name = _userPersona.name;
                if (_userPersona.avatar) ch.avatar = _userPersona.avatar;
            }
        } else if (charId === '__contact__' && _contact) {
            ch.name = _contact.name || ch.name || '联系人';
            ch.avatar = _contact.avatar || ch.avatar || '';
        }

        // 获取该角色的所有关系
        const myRelations = rn.relations.filter(r => r.from === charId || r.to === charId);
        const relatedChars = myRelations.map(r => {
            const otherId = r.from === charId ? r.to : r.from;
            const other = rn.characters.find(c => c.id === otherId);
            return { char: other, label: r.label, relId: r.from + '_' + r.to };
        }).filter(r => r.char);

        const avatarSrc = ch.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((ch.name || '?')[0])}&background=111111&color=ffffff&size=200&bold=true`;
        const isProtected = ch.role === 'user' || ch.role === 'contact';

        // 获取联系人名称
        const contact = store.contacts ? store.contacts.find(c => c.id === activeChatId) : null;
        const contactName = contact ? contact.name : '联系人';

        // 构建基本信息行（ID Card右侧部分）
        let infoLines = '';
        infoLines += `<div class="idc-field"><span class="idc-label">NAME</span><span class="idc-value">${ch.name || '未命名'}</span></div>`;
        if (ch.gender) infoLines += `<div class="idc-field"><span class="idc-label">GENDER</span><span class="idc-value">${ch.gender}</span></div>`;
        if (ch.age) infoLines += `<div class="idc-field"><span class="idc-label">AGE</span><span class="idc-value">${ch.age}</span></div>`;
        if (ch.identity) infoLines += `<div class="idc-field"><span class="idc-label">IDENTITY</span><span class="idc-value">${ch.identity}</span></div>`;
        if (ch.personality) infoLines += `<div class="idc-field"><span class="idc-label">PERSONALITY</span><span class="idc-value">${ch.personality}</span></div>`;
        if (ch.mbti || ch.zodiac) infoLines += `<div class="idc-field"><span class="idc-label">TYPE</span><span class="idc-value">${[ch.mbti, ch.zodiac].filter(Boolean).join(' · ')}</span></div>`;
        if (ch.hobbies) infoLines += `<div class="idc-field"><span class="idc-label">HOBBIES</span><span class="idc-value">${ch.hobbies}</span></div>`;
        if (ch.contactRelation) infoLines += `<div class="idc-field"><span class="idc-label">RELATION</span><span class="idc-value">${ch.contactRelation}</span></div>`;
        // [关联联系人] 显示关联的联系人信息
        if (ch.linkedContactId) {
            const linkedContact = (store.contacts || []).find(c => c.id === ch.linkedContactId);
            if (linkedContact) {
                infoLines += `<div class="idc-field"><span class="idc-label">LINKED</span><span class="idc-value">${linkedContact.name || '联系人'}${ch.linkedContactRole ? ' (' + ch.linkedContactRole + ')' : ''}</span></div>`;
            }
        }

        // 详细信息 - 斜贴纸条
        let stickyNotes = '';
        if (ch.appearance) {
            stickyNotes += `
                <div class="idc-sticky-wrap">
                    <div class="idc-sticky" style="transform:rotate(0.8deg)">
                        <div class="idc-tape"></div>
                        <div class="idc-sticky-label">外貌描述</div>
                        <div class="idc-sticky-body">${ch.appearance}</div>
                    </div>
                </div>`;
        }
        if (ch.experience) {
            stickyNotes += `
                <div class="idc-sticky-wrap">
                    <div class="idc-sticky" style="transform:rotate(-1.5deg)">
                        <div class="idc-tape"></div>
                        <div class="idc-sticky-label">生活经历</div>
                        <div class="idc-sticky-body">${ch.experience}</div>
                    </div>
                </div>`;
        }
        if (ch.familyBg) {
            stickyNotes += `
                <div class="idc-sticky-wrap">
                    <div class="idc-sticky" style="transform:rotate(1deg)">
                        <div class="idc-tape"></div>
                        <div class="idc-sticky-label">家庭背景</div>
                        <div class="idc-sticky-body">${ch.familyBg}</div>
                    </div>
                </div>`;
        }
        if (ch.notes) {
            stickyNotes += `
                <div class="idc-sticky-wrap">
                    <div class="idc-sticky" style="transform:rotate(-0.7deg)">
                        <div class="idc-tape"></div>
                        <div class="idc-sticky-label">备注</div>
                        <div class="idc-sticky-body">${ch.notes}</div>
                    </div>
                </div>`;
        }

        // 关系区域
        let relHtml = '';
        if (relatedChars.length > 0) {
            relHtml = `<div class="idc-rel-section">
                <div class="idc-rel-title">CONNECTIONS</div>
                <div class="idc-rel-list">
                    ${relatedChars.map(r => {
                        return `<div class="idc-rel-item" onclick="window._rnShowCard('${r.char.id}')">
                            <span class="idc-rel-name">${r.char.name}</span>
                            <span class="idc-rel-tag">${r.label || '认识'}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }

        overlay.innerHTML = `
            <div class="idc-card" onclick="event.stopPropagation()">
                <div class="idc-scroll">
                    <!-- ID Card 头部：横向布局，左头像右信息 -->
                    <div class="idc-header">
                        <div class="idc-header-title">IDENTITY CARD</div>
                    </div>
                    <div class="idc-body">
                        <div class="idc-photo-side" onclick="document.getElementById('idc-avatar-upload-input').click()">
                            <img class="idc-photo" id="idc-card-photo" src="${avatarSrc}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent((ch.name || '?')[0])}&background=080808&color=ffffff&size=200&bold=true'">
                            <div class="idc-photo-id">NO.${ch.id.replace(/[^0-9]/g,'').slice(-6).padStart(6,'0')}</div>
                            <div class="idc-photo-upload-hint">点击更换</div>
                            <input type="file" id="idc-avatar-upload-input" accept="image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico" style="display:none" onchange="window._rnCardAvatarUpload(this, '${ch.id}')">
                        </div>
                        <div class="idc-info-side">
                            ${infoLines}
                            <div class="idc-signature">✦ ${(ch.name || '?')}</div>
                        </div>
                    </div>
                    <!-- 贴纸条区域 -->
                    ${stickyNotes}
                    <!-- 人物关系 -->
                    ${relHtml}
                </div>
                <!-- 底部操作栏 -->
                <div class="idc-actions">
                    <button class="idc-act" onclick="window._rnCloseCard()"><i class="fas fa-times"></i></button>
                    <button class="idc-act" onclick="window._rnEditChar('${ch.id}')"><i class="fas fa-pen"></i></button>
                    <button class="idc-act" onclick="window._rnAddRelation('${ch.id}')"><i class="fas fa-link"></i></button>
                    ${!isProtected ? `<button class="idc-act idc-act-del" onclick="window._rnDeleteChar('${ch.id}')"><i class="fas fa-trash-alt"></i></button>` : ''}
                </div>
            </div>
        `;

        // 点击遮罩关闭
        overlay.onclick = function(e) {
            if (e.target === overlay) window._rnCloseCard();
        };

        // [FIX-iOS弹窗] 强制回流后用rAF延迟显示，避免iOS Safari innerHTML后渲染竞争
        overlay.offsetHeight;
        requestAnimationFrame(function() { overlay.classList.add('show'); });
    }

    // === 添加/编辑人物表单 ===
    function showCharacterForm(charId) {
        const rn = getRNData();
        const ch = charId ? rn.characters.find(c => c.id === charId) : null;
        const isEdit = !!ch;
        const isNpc = !ch || ch.role === 'npc';

        const overlay = document.getElementById('rn-form-overlay');
        if (!overlay) return;

        // 获取联系人名称
        const contact = store.contacts ? store.contacts.find(c => c.id === activeChatId) : null;
        const contactName = contact ? contact.name : '联系人';

        // [关联联系人] 构建已有联系人选择列表
        const allContacts = store.contacts || [];
        const currentLinkedId = ch ? (ch.linkedContactId || '') : '';
        const currentLinkedRole = ch ? (ch.linkedContactRole || '') : '';
        let contactSelectOptions = '<option value="">-- 不关联 --</option>';
        allContacts.filter(ct => !ct.isGroup).forEach(ct => {
            const selected = currentLinkedId === ct.id ? 'selected' : '';
            contactSelectOptions += `<option value="${ct.id}" ${selected}>${ct.name || '未命名'}</option>`;
        });
        // 预定义的身份角色列表
        const rolePresets = ['好朋友', '闺蜜', '兄弟', '情敌', '前任', '暗恋对象', '同学', '同事', '室友', '邻居', '亲戚', '师生', '上下级', '竞争对手', '合作伙伴'];
        let roleChipsHtml = rolePresets.map(r => {
            const active = currentLinkedRole === r ? 'rn-role-chip-active' : '';
            return `<div class="rn-role-chip ${active}" onclick="window._rnPickLinkedRole(this, '${r}')">${r}</div>`;
        }).join('');

        // MBTI 选项
        const mbtiOptions = ['', 'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
        const mbtiSelect = mbtiOptions.map(m => `<option value="${m}" ${(ch?.mbti || '') === m ? 'selected' : ''}>${m || '-- 未设置 --'}</option>`).join('');
        // 星座选项
        const zodiacOptions = ['', '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];
        const zodiacSelect = zodiacOptions.map(z => `<option value="${z}" ${(ch?.zodiac || '') === z ? 'selected' : ''}>${z || '-- 未设置 --'}</option>`).join('');

        // 构建一句话描述的默认值（合并已有的性格+外貌信息）
        let onelinerDefault = ch ? (ch.oneliner || '') : '';
        if (!onelinerDefault && ch) {
            const parts = [ch.personality, ch.appearance].filter(Boolean);
            if (parts.length) onelinerDefault = parts.join('，');
        }

        overlay.innerHTML = `
            <div class="rn-form-panel">
                <div class="rn-form-header">
                    <span class="rn-form-title">${isEdit ? '编辑人物' : '添加人物'}</span>
                    <span class="rn-form-close" onclick="window._rnCloseForm()"><i class="fas fa-times"></i></span>
                </div>
                <!-- 快速/详细模式切换 -->
                <div class="rn-form-mode-toggle">
                    <div class="rn-form-mode-btn active" id="rn-mode-quick" onclick="window._rnSwitchFormMode('quick')">⚡ 快速</div>
                    <div class="rn-form-mode-btn" id="rn-mode-detail" onclick="window._rnSwitchFormMode('detail')">📋 详细</div>
                </div>
                <div class="rn-form-body">
                    <!-- 核心字段（快速模式可见） -->
                    <div class="rn-form-group">
                        <label>头像</label>
                        <div class="rn-avatar-upload">
                            <img class="rn-avatar-preview" id="rn-form-avatar-preview" src="${ch && ch.avatar ? ch.avatar : 'https://ui-avatars.com/api/?name=?&background=1a1a2e&color=64b4ff&size=60'}" onerror="this.src='https://ui-avatars.com/api/?name=?&background=1a1a2e&color=64b4ff&size=60'">
                            <span class="rn-avatar-btn" onclick="document.getElementById('rn-form-avatar-input').click()">选择图片</span>
                            <input type="file" id="rn-form-avatar-input" accept="image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico" style="display:none" onchange="window._rnHandleAvatarUpload(this)">
                        </div>
                        <input type="hidden" id="rn-form-avatar" value="${ch ? (ch.avatar || '') : ''}">
                    </div>
                    <div class="rn-form-group">
                        <label>姓名 *</label>
                        <input type="text" id="rn-form-name" placeholder="角色名字" value="${ch ? (ch.name || '') : ''}">
                    </div>
                    <div class="rn-form-group" style="display:none;">
                        <select id="rn-form-role">
                            <option value="npc" ${(!ch || ch.role === 'npc') ? 'selected' : ''}>NPC</option>
                            ${ch && (ch.role === 'user' || ch.role === 'contact') ? `<option value="${ch.role}" selected>${ch.role === 'user' ? '用户(主角)' : '联系人(主角)'}</option>` : ''}
                        </select>
                    </div>
                    <div class="rn-form-group" style="display:flex;gap:10px;">
                        <div style="flex:1;">
                            <label>性别</label>
                            <input type="text" id="rn-form-gender" placeholder="男/女" value="${ch ? (ch.gender || '') : ''}">
                        </div>
                        <div style="flex:1;">
                            <label>年龄</label>
                            <input type="text" id="rn-form-age" placeholder="如：18岁" value="${ch ? (ch.age || '') : ''}">
                        </div>
                    </div>
                    <div class="rn-form-group">
                        <label>身份/职业</label>
                        <input type="text" id="rn-form-identity" placeholder="如：学生/老师/王子/医生..." value="${ch ? (ch.identity || '') : ''}">
                    </div>
                    <div class="rn-form-group">
                        <label>与${contactName}的关系</label>
                        <input type="text" id="rn-form-contact-relation" placeholder="如：朋友/恋人/同学/师生..." value="${ch ? (ch.contactRelation || '') : ''}">
                    </div>
                    <!-- 快速模式专属：一句话描述 -->
                    <div class="rn-form-group" id="rn-form-oneliner-group">
                        <label>一句话描述 <span style="font-size:11px;color:rgba(255,255,255,0.35);">（AI会据此推断性格外貌等）</span></label>
                        <input type="text" id="rn-form-oneliner" class="rn-oneliner-input" placeholder="如：温柔的邻家大姐姐 / 腹黑毒舌的学霸..." value="${onelinerDefault}">
                    </div>
                    <!-- AI一键生成按钮（快速模式） -->
                    <div id="rn-form-ai-gen-wrap">
                        <div class="rn-ai-generate-btn" id="rn-ai-gen-btn" onclick="window._rnAiGenerateNpc()">
                            <i class="fas fa-magic"></i> AI 一键补全
                        </div>
                    </div>

                    <!-- 详细模式额外字段 -->
                    <div class="rn-form-detail-fields rn-form-quick-hidden" id="rn-form-detail-section">
                        <div style="height:8px;border-top:1px solid rgba(255,255,255,0.06);margin:12px 0 8px;"></div>
                        <div class="rn-form-group">
                            <label>性格特点</label>
                            <input type="text" id="rn-form-personality" placeholder="如：温柔/腹黑/傲娇/阳光开朗..." value="${ch ? (ch.personality || '') : ''}">
                        </div>
                        <div class="rn-form-group">
                            <label>外貌描述</label>
                            <textarea id="rn-form-appearance" placeholder="角色的外貌特征...">${ch ? (ch.appearance || '') : ''}</textarea>
                        </div>
                        <div class="rn-form-group">
                            <label>兴趣爱好</label>
                            <input type="text" id="rn-form-hobbies" placeholder="如：画画/弹琴/运动/读书..." value="${ch ? (ch.hobbies || '') : ''}">
                        </div>
                        <div class="rn-form-group" style="display:flex;gap:10px;">
                            <div style="flex:1;">
                                <label>MBTI</label>
                                <select id="rn-form-mbti">${mbtiSelect}</select>
                            </div>
                            <div style="flex:1;">
                                <label>星座</label>
                                <select id="rn-form-zodiac">${zodiacSelect}</select>
                            </div>
                        </div>
                        <div class="rn-form-group">
                            <label>生活经历</label>
                            <textarea id="rn-form-experience" placeholder="角色的生活经历...">${ch ? (ch.experience || '') : ''}</textarea>
                        </div>
                        <div class="rn-form-group">
                            <label>家庭背景</label>
                            <textarea id="rn-form-familybg" placeholder="角色的家庭背景...">${ch ? (ch.familyBg || '') : ''}</textarea>
                        </div>
                        <div class="rn-form-group">
                            <label>备注</label>
                            <textarea id="rn-form-notes" placeholder="其他补充信息...">${ch ? (ch.notes || '') : ''}</textarea>
                        </div>
                        <div style="height:8px;border-top:1px solid rgba(255,255,255,0.06);margin:12px 0 8px;"></div>
                        <div class="rn-form-section-title">
                            <i class="fas fa-link"></i> 关联已有联系人
                            <span class="rn-form-section-hint">将此角色关联到通讯录中的联系人，互评时会根据关系来互动</span>
                        </div>
                        <div class="rn-form-group">
                            <label>关联联系人</label>
                            <select id="rn-form-linked-contact" onchange="window._rnOnLinkedContactChange(this.value)">${contactSelectOptions}</select>
                        </div>
                        <div class="rn-form-group">
                            <label>与此角色的身份关系 <span style="font-size:11px;color:rgba(255,255,255,0.4);">（如：情敌、好朋友等）</span></label>
                            <input type="text" id="rn-form-linked-role" placeholder="填写身份，如：情敌/好朋友/竞争对手..." value="${currentLinkedRole}">
                            <div class="rn-role-chips">${roleChipsHtml}</div>
                        </div>
                    </div>
                </div>
                <div class="rn-form-footer">
                    <button class="rn-form-btn cancel" onclick="window._rnCloseForm()">取消</button>
                    <button class="rn-form-btn save" onclick="window._rnSaveChar('${charId || ''}')">保存</button>
                </div>
            </div>
        `;

        // [FIX-iOS弹窗] 强制回流后用rAF延迟显示，避免iOS Safari innerHTML后渲染竞争
        overlay.offsetHeight;
        requestAnimationFrame(function() { overlay.classList.add('show'); });
    }

    // 快速/详细模式切换
    window._rnSwitchFormMode = function(mode) {
        const quickBtn = document.getElementById('rn-mode-quick');
        const detailBtn = document.getElementById('rn-mode-detail');
        const detailSection = document.getElementById('rn-form-detail-section');
        const onelinerGroup = document.getElementById('rn-form-oneliner-group');
        const aiGenWrap = document.getElementById('rn-form-ai-gen-wrap');
        if (!detailSection) return;

        if (mode === 'detail') {
            detailSection.classList.remove('rn-form-quick-hidden');
            if (onelinerGroup) onelinerGroup.style.display = 'none';
            if (aiGenWrap) aiGenWrap.style.display = 'none';
            if (quickBtn) quickBtn.classList.remove('active');
            if (detailBtn) detailBtn.classList.add('active');
        } else {
            detailSection.classList.add('rn-form-quick-hidden');
            if (onelinerGroup) onelinerGroup.style.display = '';
            if (aiGenWrap) aiGenWrap.style.display = '';
            if (quickBtn) quickBtn.classList.add('active');
            if (detailBtn) detailBtn.classList.remove('active');
        }
    };

    // AI一键补全NPC信息
    window._rnAiGenerateNpc = function() {
        const nameEl = document.getElementById('rn-form-name');
        const relationEl = document.getElementById('rn-form-contact-relation');
        const genderEl = document.getElementById('rn-form-gender');
        const onelinerEl = document.getElementById('rn-form-oneliner');
        const btn = document.getElementById('rn-ai-gen-btn');

        const name = nameEl ? nameEl.value.trim() : '';
        const relation = relationEl ? relationEl.value.trim() : '';
        const oneliner = onelinerEl ? onelinerEl.value.trim() : '';

        if (!name && !relation && !oneliner) {
            if (typeof showToast === 'function') showToast('请至少填写姓名或关系再生成');
            return;
        }

        if (btn) { btn.classList.add('loading'); btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...'; }

        // 显示AI加载弹窗
        if (window.aiModal) window.aiModal.loading('AI 正在补全角色信息...');

        const contact = store.contacts ? store.contacts.find(c => c.id === activeChatId) : null;
        const contactName = contact ? contact.name : '联系人';

        const prompt = '请为一个角色扮演故事中的NPC生成简要信息。' +
            (name ? '名字：' + name + '。' : '') +
            (relation ? '与' + contactName + '的关系：' + relation + '。' : '') +
            (oneliner ? '描述：' + oneliner + '。' : '') +
            (genderEl && genderEl.value.trim() ? '性别：' + genderEl.value.trim() + '。' : '') +
            '\n请严格按JSON格式输出，不要其他文字：' +
            '\n{"name":"姓名","gender":"男/女","age":"年龄","identity":"身份职业","personality":"性格特点(10字内)","appearance":"外貌简述(15字内)","oneliner":"一句话概括(15字内)"}';

        if (typeof API !== 'undefined' && API.chatCompletion) {
            API.chatCompletion([
                {role:'system', content:'你是角色设定助手，帮助生成NPC的基本信息。输出简洁的JSON。'},
                {role:'user', content: prompt}
            ], 0.8, true).then(function(data) {
                var filled = false;
                try {
                    const text = (data && data.text) ? data.text.trim() : '';
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const info = JSON.parse(jsonMatch[0]);
                        if (info.name && nameEl && !nameEl.value.trim()) nameEl.value = info.name;
                        if (info.gender && genderEl && !genderEl.value.trim()) genderEl.value = info.gender;
                        const ageEl = document.getElementById('rn-form-age');
                        if (info.age && ageEl && !ageEl.value.trim()) ageEl.value = info.age;
                        const identityEl = document.getElementById('rn-form-identity');
                        if (info.identity && identityEl && !identityEl.value.trim()) identityEl.value = info.identity;
                        if (info.oneliner && onelinerEl && !onelinerEl.value.trim()) onelinerEl.value = info.oneliner;
                        // 也填充详细模式的字段
                        const personalityEl = document.getElementById('rn-form-personality');
                        if (info.personality && personalityEl && !personalityEl.value.trim()) personalityEl.value = info.personality;
                        const appearanceEl = document.getElementById('rn-form-appearance');
                        if (info.appearance && appearanceEl && !appearanceEl.value.trim()) appearanceEl.value = info.appearance;
                        filled = true;
                    }
                } catch(e) { console.warn('[RN] AI生成解析失败', e); }
                if (btn) { btn.classList.remove('loading'); btn.innerHTML = '<i class="fas fa-magic"></i> AI 一键补全'; }
                // 显示结果弹窗
                if (window.aiModal) {
                    if (filled) window.aiModal.success('AI 补全完成');
                    else window.aiModal.fail('AI 返回数据解析失败');
                }
            }).catch(function() {
                if (btn) { btn.classList.remove('loading'); btn.innerHTML = '<i class="fas fa-magic"></i> AI 一键补全'; }
                if (window.aiModal) window.aiModal.fail('AI 补全失败，请重试');
            });
        } else {
            // 无API时的本地fallback
            const fallbackPersonalities = ['温柔体贴','活泼开朗','冷酷高傲','腹黑毒舌','阳光正直','内向害羞','霸道强势','古灵精怪'];
            const fallbackAppearances = ['清秀俊朗','温婉可人','英气逼人','甜美可爱','高冷帅气','文静优雅','阳光帅气','冷艳高贵'];
            const p = fallbackPersonalities[Math.floor(Math.random()*fallbackPersonalities.length)];
            const a = fallbackAppearances[Math.floor(Math.random()*fallbackAppearances.length)];
            if (onelinerEl && !onelinerEl.value.trim()) onelinerEl.value = p + '的' + (relation || '角色');
            const personalityEl = document.getElementById('rn-form-personality');
            if (personalityEl && !personalityEl.value.trim()) personalityEl.value = p;
            const appearanceEl = document.getElementById('rn-form-appearance');
            if (appearanceEl && !appearanceEl.value.trim()) appearanceEl.value = a;
            if (btn) { btn.classList.remove('loading'); btn.innerHTML = '<i class="fas fa-magic"></i> AI 一键补全'; }
            if (window.aiModal) window.aiModal.close();
            if (typeof showToast === 'function') showToast('已生成基本信息（本地）');
        }
    };

    // 保留旧函数兼容性
    window._rnSwitchFormPage = function() {};

    // [关联联系人] 快速选择身份角色
    window._rnPickLinkedRole = function(el, role) {
        const input = document.getElementById('rn-form-linked-role');
        if (input) input.value = role;
        // 高亮选中的chip
        document.querySelectorAll('.rn-role-chip').forEach(c => c.classList.remove('rn-role-chip-active'));
        el.classList.add('rn-role-chip-active');
    };

    // [关联联系人] 选择关联联系人时，直接使用该联系人的人设数据填充所有字段
    window._rnOnLinkedContactChange = function(contactId) {
        if (!contactId) return; // 选择了"不关联"，不做任何操作
        const linkedContact = (store.contacts || []).find(c => c.id === contactId);
        if (!linkedContact) return;
        
        // [FIX-关联自动填充] 直接使用关联联系人的数据填充，不再要求字段为空才填充
        // 用户关联了联系人，就是想用那个联系人的人设，不应该还要手动填
        
        // 自动填充姓名（直接覆盖）
        const nameEl = document.getElementById('rn-form-name');
        if (nameEl) {
            nameEl.value = linkedContact.name || '';
        }
        
        // 自动填充头像（直接覆盖）
        if (linkedContact.avatar) {
            const avatarPreview = document.getElementById('rn-form-avatar-preview');
            const avatarInput = document.getElementById('rn-form-avatar');
            if (avatarPreview) avatarPreview.src = linkedContact.avatar;
            if (avatarInput) avatarInput.value = linkedContact.avatar;
        }
        
        // 从人设(persona)中提取信息并填充所有字段
        const persona = linkedContact.persona || '';
        if (persona) {
            // 填充身份/职业
            const identityEl = document.getElementById('rn-form-identity');
            if (identityEl) {
                const identityMatch = persona.match(/(?:身份|职业|是个?|是一[个名位]|职位)\s*[:：]?\s*([^\n,，。.;；]{2,15})/);
                if (identityMatch) identityEl.value = identityMatch[1].trim();
            }
            
            // 填充性别
            const genderEl = document.getElementById('rn-form-gender');
            if (genderEl) {
                if (/男[生孩性人]|男的|少年|男子|哥哥|弟弟|先生|王子|男友|老公|他是/.test(persona)) {
                    genderEl.value = '男';
                } else if (/女[生孩性人]|女的|少女|女子|姐姐|妹妹|小姐|公主|女友|老婆|她是/.test(persona)) {
                    genderEl.value = '女';
                }
            }
            
            // 填充性格特点
            const personalityEl = document.getElementById('rn-form-personality');
            if (personalityEl) {
                const personalityMatch = persona.match(/(?:性格|个性|人格)\s*[:：]?\s*([^\n,，。.;；]{2,30})/);
                if (personalityMatch) personalityEl.value = personalityMatch[1].trim();
            }
            
            // 填充年龄
            const ageEl = document.getElementById('rn-form-age');
            if (ageEl) {
                const ageMatch = persona.match(/(\d{1,3})\s*岁/);
                if (ageMatch) ageEl.value = ageMatch[1] + '岁';
            }
            
            // 填充外貌描述
            const appearanceEl = document.getElementById('rn-form-appearance');
            if (appearanceEl && !appearanceEl.value.trim()) {
                const appearMatch = persona.match(/(?:外貌|外表|长相|容貌|样貌)\s*[:：]?\s*([^\n]{2,60})/);
                if (appearMatch) appearanceEl.value = appearMatch[1].trim();
            }
            
            // 填充兴趣爱好
            const hobbiesEl = document.getElementById('rn-form-hobbies');
            if (hobbiesEl && !hobbiesEl.value.trim()) {
                const hobbyMatch = persona.match(/(?:爱好|兴趣|喜欢)\s*[:：]?\s*([^\n,，。.;；]{2,30})/);
                if (hobbyMatch) hobbiesEl.value = hobbyMatch[1].trim();
            }
            
            // 填充生活经历
            const experienceEl = document.getElementById('rn-form-experience');
            if (experienceEl && !experienceEl.value.trim()) {
                const expMatch = persona.match(/(?:经历|背景|过去|经验)\s*[:：]?\s*([^\n]{2,80})/);
                if (expMatch) experienceEl.value = expMatch[1].trim();
            }
        }
        
        // 提示用户已自动填充
        if (typeof toast === 'function') {
            toast('已关联「' + (linkedContact.name || '') + '」并自动填充人设信息', 'success');
        }
        
        // 自动切换到基本信息页查看填充结果
        window._rnSwitchFormPage(0, document.querySelectorAll('.rn-form-tab')[0]);
    };

    // === 建立关系弹窗 ===
    function showAddRelation(fromCharId) {
        const rn = getRNData();
        const fromChar = rn.characters.find(c => c.id === fromCharId);
        if (!fromChar) return;

        const others = rn.characters.filter(c => c.id !== fromCharId);
        if (others.length === 0) {
            toast('暂无其他角色，请先添加角色', 'info');
            return;
        }

        const overlay = document.getElementById('rn-link-overlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <div class="rn-link-panel">
                <div class="rn-form-header">
                    <span class="rn-form-title">为 ${fromChar.name} 建立关系</span>
                    <span class="rn-form-close" onclick="window._rnCloseLink()"><i class="fas fa-times"></i></span>
                </div>
                <div class="rn-link-list">
                    ${others.map(c => {
                        const existing = rn.relations.find(r =>
                            (r.from === fromCharId && r.to === c.id) ||
                            (r.to === fromCharId && r.from === c.id)
                        );
                        const avatar = c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((c.name || '?')[0])}&background=1a1a2e&color=64b4ff&size=40`;
                        return `<div class="rn-link-item ${existing ? 'selected' : ''}" data-id="${c.id}" onclick="window._rnToggleLinkItem(this)">
                            <img src="${avatar}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent((c.name || '?')[0])}&background=1a1a2e&color=64b4ff&size=40'">
                            <span class="rn-link-name">${c.name}${existing ? ' <span style="color:rgba(255,255,255,0.4);font-size:11px;">(' + (existing.label || "已关联") + ')</span>' : ''}</span>
                            <i class="fas fa-check-circle rn-link-check"></i>
                        </div>`;
                    }).join('')}
                </div>
                <div class="rn-link-relation-input">
                    <input type="text" id="rn-link-label" placeholder="关系描述（如：朋友、恋人、师生...）">
                </div>
                <div class="rn-form-footer">
                    <button class="rn-form-btn cancel" onclick="window._rnCloseLink()">取消</button>
                    <button class="rn-form-btn save" onclick="window._rnSaveRelation('${fromCharId}')">确定</button>
                </div>
            </div>
        `;

        // [FIX-iOS弹窗] 强制回流后用rAF延迟显示
        overlay.offsetHeight;
        requestAnimationFrame(function() { overlay.classList.add('show'); });
    }

    // === 卡片头像上传 ===
    window._rnCardAvatarUpload = function(input, charId) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        if (file.size > 2 * 1024 * 1024) {
            if (typeof toast === 'function') toast('图片不能超过2MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            const rn = getRNData();
            const ch = rn.characters.find(c => c.id === charId);
            if (ch) {
                ch.avatar = dataUrl;
                avatarCache = {};
                save();
                // 更新卡片上的头像
                const photoEl = document.getElementById('idc-card-photo');
                if (photoEl) photoEl.src = dataUrl;
                renderRelationGraph();
                if (typeof toast === 'function') toast('头像已更新');
            }
        };
        reader.readAsDataURL(file);
    };

    // === 全局API ===
    window._rnShowCard = function(charId) {
        const overlay = document.getElementById('rn-card-overlay');
        if (overlay && overlay.classList.contains('show')) {
            const oldCard = overlay.querySelector('.idc-card');
            if (oldCard) {
                oldCard.classList.add('switching-out');
                setTimeout(() => {
                    showCharacterCard(charId);
                    const newCard = overlay.querySelector('.idc-card');
                    if (newCard) newCard.classList.add('switching-in');
                }, 150);
                return;
            }
        }
        showCharacterCard(charId);
    };

    window._rnCloseCard = function() {
        const overlay = document.getElementById('rn-card-overlay');
        if (overlay) overlay.classList.remove('show');
    };

    window._rnEditChar = function(charId) {
        window._rnCloseCard();
        setTimeout(() => showCharacterForm(charId), 200);
    };

    window._rnDeleteChar = function(charId) {
        const rn = getRNData();
        const ch = rn.characters.find(c => c.id === charId);
        if (!ch) return;
        if (ch.role === 'user' || ch.role === 'contact') {
            toast('主角不能删除', 'error');
            return;
        }
        showConfirm('删除角色', `确定要删除角色 "${ch.name}" 吗？相关关系也会被清除。`, () => {
            rn.characters = rn.characters.filter(c => c.id !== charId);
            rn.relations = rn.relations.filter(r => r.from !== charId && r.to !== charId);
            save();
            window._rnCloseCard();
            renderRelationGraph();
            toast('已删除角色: ' + ch.name);
        });
    };

    window._rnAddRelation = function(charId) {
        window._rnCloseCard();
        setTimeout(() => showAddRelation(charId), 200);
    };

    window._rnCloseForm = function() {
        const overlay = document.getElementById('rn-form-overlay');
        if (overlay) overlay.classList.remove('show');
    };

    window._rnCloseLink = function() {
        const overlay = document.getElementById('rn-link-overlay');
        if (overlay) overlay.classList.remove('show');
    };

    window._rnHandleAvatarUpload = function(input) {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        if (file.size > 2 * 1024 * 1024) {
            toast('图片不能超过2MB', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            document.getElementById('rn-form-avatar-preview').src = dataUrl;
            document.getElementById('rn-form-avatar').value = dataUrl;
        };
        reader.readAsDataURL(file);
    };

    window._rnSaveChar = function(charId) {
        const rn = getRNData();
        const name = document.getElementById('rn-form-name').value.trim();
        if (!name) {
            toast('请输入角色名字', 'error');
            return;
        }

        const avatar = document.getElementById('rn-form-avatar').value;
        const gender = document.getElementById('rn-form-gender').value.trim();
        const age = document.getElementById('rn-form-age').value.trim();
        const identity = document.getElementById('rn-form-identity').value.trim();
        const contactRelation = document.getElementById('rn-form-contact-relation').value.trim();
        // 新增字段
        const personality = (document.getElementById('rn-form-personality')?.value || '').trim();
        const appearance = (document.getElementById('rn-form-appearance')?.value || '').trim();
        const hobbies = (document.getElementById('rn-form-hobbies')?.value || '').trim();
        const mbti = (document.getElementById('rn-form-mbti')?.value || '').trim();
        const zodiac = (document.getElementById('rn-form-zodiac')?.value || '').trim();
        const experience = document.getElementById('rn-form-experience').value.trim();
        const familyBg = document.getElementById('rn-form-familybg').value.trim();
        const notes = document.getElementById('rn-form-notes').value.trim();
        // 一句话描述（快速模式）
        const oneliner = (document.getElementById('rn-form-oneliner')?.value || '').trim();
        // [关联联系人] 读取关联联系人和身份关系
        const linkedContactEl = document.getElementById('rn-form-linked-contact');
        const linkedRoleEl = document.getElementById('rn-form-linked-role');
        const linkedContactId = linkedContactEl ? linkedContactEl.value : '';
        const linkedContactRole = linkedRoleEl ? linkedRoleEl.value.trim() : '';

        if (charId) {
            // 编辑
            const ch = rn.characters.find(c => c.id === charId);
            if (ch) {
                ch.name = name;
                if (avatar) ch.avatar = avatar;
                ch.gender = gender;
                ch.age = age;
                ch.identity = identity;
                ch.contactRelation = contactRelation;
                ch.oneliner = oneliner;
                ch.personality = personality;
                ch.appearance = appearance;
                ch.hobbies = hobbies;
                ch.mbti = mbti;
                ch.zodiac = zodiac;
                ch.experience = experience;
                ch.familyBg = familyBg;
                ch.notes = notes;
                ch.linkedContactId = linkedContactId;
                ch.linkedContactRole = linkedContactRole;
            }
        } else {
            // 新增NPC
            const newChar = {
                id: 'rn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                name: name,
                avatar: avatar || '',
                role: 'npc',
                gender: gender,
                age: age,
                identity: identity,
                contactRelation: contactRelation,
                oneliner: oneliner,
                personality: personality,
                appearance: appearance,
                hobbies: hobbies,
                mbti: mbti,
                zodiac: zodiac,
                experience: experience,
                familyBg: familyBg,
                notes: notes,
                linkedContactId: linkedContactId,
                linkedContactRole: linkedContactRole,
                x: 0, y: 0
            };
            rn.characters.push(newChar);
            
            // 自动布局新节点
            const w = rnCanvas ? (rnCanvas.width / (window.devicePixelRatio || 1)) : window.innerWidth;
            const h = rnCanvas ? (rnCanvas.height / (window.devicePixelRatio || 1)) : window.innerHeight;
            newChar.x = w / 2 + (Math.random() - 0.5) * 200;
            newChar.y = h / 2 + (Math.random() - 0.5) * 200;

            // 如果填了与联系人的关系，自动建立关系
            if (contactRelation) {
                const contactChar = rn.characters.find(c => c.id === '__contact__');
                if (contactChar) {
                    rn.relations.push({
                        from: newChar.id,
                        to: '__contact__',
                        label: contactRelation
                    });
                }
            }
        }

        save();
        window._rnCloseForm();
        avatarCache = {};
        renderRelationGraph();
        toast(charId ? '角色信息已更新' : '角色已添加');
    };

    window._rnToggleLinkItem = function(el) {
        el.classList.toggle('selected');
    };

    window._rnSaveRelation = function(fromCharId) {
        const rn = getRNData();
        const label = document.getElementById('rn-link-label').value.trim();
        const selectedItems = document.querySelectorAll('#rn-link-overlay .rn-link-item.selected');
        
        if (selectedItems.length === 0) {
            toast('请选择至少一个角色', 'error');
            return;
        }

        selectedItems.forEach(item => {
            const toId = item.dataset.id;
            const existIdx = rn.relations.findIndex(r =>
                (r.from === fromCharId && r.to === toId) ||
                (r.to === fromCharId && r.from === toId)
            );
            
            if (existIdx >= 0) {
                if (label) rn.relations[existIdx].label = label;
            } else {
                rn.relations.push({
                    from: fromCharId,
                    to: toId,
                    label: label || '认识'
                });
            }
        });

        save();
        window._rnCloseLink();
        renderRelationGraph();
        toast('关系已更新');
    };

    // === 页面控制 - 强制横屏 ===
    function openRelationNetwork() {
        const layer = document.getElementById('layer-relation-network');
        if (!layer) return;
        
        ensureProtagonists();
        layer.classList.add('active');
        
        // 强制横屏
        try {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
            }
        } catch(e) {}
        
        // 延迟初始化，确保DOM已展示
        setTimeout(() => {
            initStarfield();
            initRelationCanvas();
        }, 100);
    }

    function closeRelationNetwork() {
        const layer = document.getElementById('layer-relation-network');
        if (layer) layer.classList.remove('active');
        stopStarfield();
        
        if (rnAnimFrame) {
            cancelAnimationFrame(rnAnimFrame);
            rnAnimFrame = null;
        }

        // 恢复竖屏
        try {
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        } catch(e) {}
    }

    function resetView() {
        viewOffset = { x: 0, y: 0 };
        viewScale = 1;
        
        const rn = getRNData();
        rn.characters.forEach(c => { c.x = 0; c.y = 0; });
        autoLayoutCharacters();
        renderRelationGraph();
        showZoomIndicator();
    }

    // 窗口resize
    window.addEventListener('resize', () => {
        const layer = document.getElementById('layer-relation-network');
        if (layer && layer.classList.contains('active')) {
            resizeStarCanvas();
            resizeRNCanvas();
            renderRelationGraph();
        }
    });

    // === 暴露全局函数 ===
    window.openRelationNetwork = openRelationNetwork;
    window.closeRelationNetwork = closeRelationNetwork;

    window._rnAddNewChar = function() {
        showCharacterForm(null);
    };

    window._rnResetView = function() {
        resetView();
    };

    window._rnFitView = function() {
        const rn = getRNData();
        if (rn.characters.length === 0) return;
        
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        rn.characters.forEach(c => {
            minX = Math.min(minX, c.x);
            minY = Math.min(minY, c.y);
            maxX = Math.max(maxX, c.x);
            maxY = Math.max(maxY, c.y);
        });
        
        const pad = 80;
        const bw = maxX - minX + pad * 2;
        const bh = maxY - minY + pad * 2;
        const cw = rnCanvas.width / (window.devicePixelRatio || 1);
        const ch2 = rnCanvas.height / (window.devicePixelRatio || 1);
        
        viewScale = Math.min(cw / bw, ch2 / bh, 2);
        viewOffset.x = cw / 2 - ((minX + maxX) / 2) * viewScale;
        viewOffset.y = ch2 / 2 - ((minY + maxY) / 2) * viewScale;
        
        renderRelationGraph();
        showZoomIndicator();
    };
})();
