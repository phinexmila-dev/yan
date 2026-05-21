// ============================================
// 竖屏关系网模块 - Portrait Relationship Network
// 侦探档案板风格 / 纯黑白灰 / DOM列表布局
// ============================================

(function() {
    'use strict';

    // === 数据管理（与横屏模块共享store数据） ===
    function getRNData() {
        var contactId = typeof activeChatId !== 'undefined' ? activeChatId : null;
        if (!contactId) return { characters: [], relations: [] };
        if (!store.relationNetworks) store.relationNetworks = {};
        if (!store.relationNetworks[contactId]) {
            store.relationNetworks[contactId] = { characters: [], relations: [] };
        }
        var rn = store.relationNetworks[contactId];
        if (rn.characters) {
            rn.characters.forEach(function(c) {
                if (c.personality && !c.identity) c.identity = c.personality;
                if (c.background && !c.experience) c.experience = c.background;
                if (!c.contactRelation) c.contactRelation = '';
                if (!c.familyBg) c.familyBg = '';
                if (!c.experience) c.experience = '';
                if (!c.identity) c.identity = '';
                if (!c.linkedContactId) c.linkedContactId = '';
                if (!c.linkedContactRole) c.linkedContactRole = '';
            });
        }
        return rn;
    }

    function ensureProtagonists() {
        var rn = getRNData();
        var contact = store.contacts ? store.contacts.find(function(c) { return c.id === activeChatId; }) : null;
        var user = store.user || {};

        var userPersona = null;
        if (contact && contact.settings && contact.settings.userPersona) {
            userPersona = (store.personas || []).find(function(p) { return p.id === contact.settings.userPersona; });
        }
        if (!userPersona && store.personas && store.personas.length > 0) {
            userPersona = store.personas[0];
        }

        var userDisplayName = (userPersona && userPersona.name) ? userPersona.name : (user.name || '用户');
        var userDisplayAvatar = (userPersona && userPersona.avatar) ? userPersona.avatar : (user.avatar || '');

        var userChar = rn.characters.find(function(c) { return c.id === '__user__'; });
        if (!userChar) {
            userChar = {
                id: '__user__', name: userDisplayName, avatar: userDisplayAvatar,
                role: 'user', gender: '', age: '', identity: '真实用户',
                experience: '', familyBg: '', contactRelation: '', notes: '', x: 0, y: 0
            };
            rn.characters.push(userChar);
        } else {
            userChar.name = userDisplayName || userChar.name || '用户';
            userChar.avatar = userDisplayAvatar || userChar.avatar || '';
        }

        if (contact) {
            var contactDisplayName = contact.name || '联系人';
            var contactDisplayAvatar = contact.avatar || '';
            var contactChar = rn.characters.find(function(c) { return c.id === '__contact__'; });
            if (!contactChar) {
                contactChar = {
                    id: '__contact__', name: contactDisplayName, avatar: contactDisplayAvatar,
                    role: 'contact', gender: '', age: '', identity: '联系人',
                    experience: '', familyBg: '', contactRelation: '', notes: '', x: 0, y: 0
                };
                rn.characters.push(contactChar);
            } else {
                contactChar.name = contactDisplayName || contactChar.name || '联系人';
                contactChar.avatar = contactDisplayAvatar || contactChar.avatar || '';
            }
        }
        return rn;
    }

    // === 工具函数 ===
    function esc(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function avatarUrl(ch) {
        if (ch.avatar) return ch.avatar;
        var letter = encodeURIComponent((ch.name || '?')[0]);
        return 'https://ui-avatars.com/api/?name=' + letter + '&background=111111&color=ffffff&size=200&bold=true';
    }

    function charNumId(ch) {
        return (ch.id || '').replace(/[^0-9]/g, '').slice(-6).padStart(6, '0');
    }

    // 获取角色简述
    function charBrief(ch) {
        var parts = [];
        if (ch.gender) parts.push(ch.gender);
        if (ch.age) parts.push(ch.age);
        if (ch.identity) parts.push(ch.identity);
        if (ch.contactRelation) parts.push(ch.contactRelation);
        return parts.join(' / ') || '---';
    }

    // === 缩放状态 ===
    var rnpScale = 1;
    var rnpZoomTimer;

    function applyZoom() {
        var layer = document.getElementById('layer-relation-network-portrait');
        if (!layer) return;
        var inner = layer.querySelector('.rnp-board-inner');
        if (!inner) return;
        inner.style.transform = 'scale(' + rnpScale + ')';
        inner.style.transformOrigin = 'center top';
        inner.style.width = (100 / rnpScale) + '%';
        inner.style.marginLeft = ((1 - 1/rnpScale) * 50) + '%';
    }

    function showRnpZoom() {
        var indicator = document.querySelector('.rnp-zoom-indicator');
        if (!indicator) return;
        indicator.textContent = Math.round(rnpScale * 100) + '%';
        indicator.classList.add('show');
        clearTimeout(rnpZoomTimer);
        rnpZoomTimer = setTimeout(function() { indicator.classList.remove('show'); }, 1200);
    }

    window._rnpZoomIn = function() {
        rnpScale = Math.min(3, rnpScale + 0.15);
        applyZoom();
        showRnpZoom();
    };

    window._rnpZoomOut = function() {
        rnpScale = Math.max(0.4, rnpScale - 0.15);
        applyZoom();
        showRnpZoom();
    };

    window._rnpZoomReset = function() {
        rnpScale = 1;
        applyZoom();
        showRnpZoom();
    };

    // 双指缩放支持
    function setupPinchZoom() {
        var board = document.querySelector('#layer-relation-network-portrait .rnp-board');
        if (!board || board._pinchSetup) return;
        board._pinchSetup = true;

        var lastDist = 0;

        board.addEventListener('touchstart', function(e) {
            if (e.touches.length === 2) {
                var dx = e.touches[0].clientX - e.touches[1].clientX;
                var dy = e.touches[0].clientY - e.touches[1].clientY;
                lastDist = Math.sqrt(dx * dx + dy * dy);
            }
        }, { passive: true });

        board.addEventListener('touchmove', function(e) {
            if (e.touches.length === 2) {
                var dx = e.touches[0].clientX - e.touches[1].clientX;
                var dy = e.touches[0].clientY - e.touches[1].clientY;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (lastDist > 0) {
                    var ratio = dist / lastDist;
                    rnpScale = Math.max(0.4, Math.min(3, rnpScale * ratio));
                    applyZoom();
                    showRnpZoom();
                }
                lastDist = dist;
            }
        }, { passive: true });

        board.addEventListener('touchend', function() {
            lastDist = 0;
        }, { passive: true });

        // 鼠标滚轮缩放
        board.addEventListener('wheel', function(e) {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                var delta = e.deltaY > 0 ? -0.1 : 0.1;
                rnpScale = Math.max(0.4, Math.min(3, rnpScale + delta));
                applyZoom();
                showRnpZoom();
            }
        }, { passive: false });
    }

    // === 渲染竖屏视图 ===
    function renderPortraitView() {
        var layer = document.getElementById('layer-relation-network-portrait');
        if (!layer) return;
        var board = layer.querySelector('.rnp-board');
        if (!board) return;

        var rn = ensureProtagonists();
        var chars = rn.characters;
        var rels = rn.relations;
        var npcs = chars.filter(function(c) { return c.role !== 'user' && c.role !== 'contact'; });
        var userChar = chars.find(function(c) { return c.id === '__user__'; });
        var contactChar = chars.find(function(c) { return c.id === '__contact__'; });

        // 用户和联系人之间的关系标签
        var protagRel = rels.find(function(r) {
            return (r.from === '__user__' && r.to === '__contact__') ||
                   (r.from === '__contact__' && r.to === '__user__');
        });
        var protagRelLabel = protagRel ? protagRel.label : '';

        var html = '';

        // === 1. 核心人物区 ===
        html += '<div class="rnp-protagonists">';
        if (userChar) {
            html += '<div class="rnp-protag-card" data-char-id="' + userChar.id + '" onclick="window._rnpShowCard(this.dataset.charId)">';
            html += '<img class="rnp-protag-photo" src="' + esc(avatarUrl(userChar)) + '" onerror="this.src=\'https://ui-avatars.com/api/?name=U&background=111111&color=ffffff&size=200\'">';
            html += '<div class="rnp-protag-name">' + esc(userChar.name) + '</div>';
            html += '<div class="rnp-protag-tag">SUBJECT</div>';
            html += '<div class="rnp-protag-id">NO.' + charNumId(userChar) + '</div>';
            html += '</div>';
        }
        html += '<div class="rnp-protag-link">';
        html += '<div class="rnp-protag-line"></div>';
        if (protagRelLabel) {
            html += '<div class="rnp-protag-rel-label">' + esc(protagRelLabel) + '</div>';
        }
        html += '</div>';
        if (contactChar) {
            html += '<div class="rnp-protag-card" data-char-id="' + contactChar.id + '" onclick="window._rnpShowCard(this.dataset.charId)">';
            html += '<img class="rnp-protag-photo" src="' + esc(avatarUrl(contactChar)) + '" onerror="this.src=\'https://ui-avatars.com/api/?name=C&background=111111&color=ffffff&size=200\'">';
            html += '<div class="rnp-protag-name">' + esc(contactChar.name) + '</div>';
            html += '<div class="rnp-protag-tag">SUBJECT</div>';
            html += '<div class="rnp-protag-id">NO.' + charNumId(contactChar) + '</div>';
            html += '</div>';
        }
        html += '</div>';

        // === 2. 关系线索 ===
        if (rels.length > 0) {
            html += '<div class="rnp-section-title">CONNECTIONS</div>';
            html += '<div class="rnp-threads">';
            rels.forEach(function(rel) {
                var fromChar = chars.find(function(c) { return c.id === rel.from; });
                var toChar = chars.find(function(c) { return c.id === rel.to; });
                if (!fromChar || !toChar) return;
                html += '<div class="rnp-thread-item">';
                html += '<span class="rnp-thread-dot"></span>';
                html += '<span class="rnp-thread-from">' + esc(fromChar.name) + '</span>';
                html += '<span class="rnp-thread-line"></span>';
                html += '<span class="rnp-thread-label">' + esc(rel.label || '---') + '</span>';
                html += '<span class="rnp-thread-line"></span>';
                html += '<span class="rnp-thread-to">' + esc(toChar.name) + '</span>';
                html += '<span class="rnp-thread-dot-end"></span>';
                html += '</div>';
            });
            html += '</div>';
        } else {
            html += '<div class="rnp-section-title">CONNECTIONS</div>';
            html += '<div class="rnp-threads"><div class="rnp-threads-empty">NO CONNECTIONS RECORDED</div></div>';
        }

        // === 3. 档案列表 ===
        if (npcs.length > 0) {
            html += '<div class="rnp-section-title">SUSPECT FILES</div>';
            html += '<div class="rnp-dossier-list">';
            npcs.forEach(function(npc) {
                html += renderDossierCard(npc, chars, rels);
            });
            html += '</div>';
        } else {
            html += '<div class="rnp-empty">';
            html += '<div class="rnp-empty-icon"><i class="fas fa-user-secret"></i></div>';
            html += '<div class="rnp-empty-title">NO SUSPECTS FOUND</div>';
            html += '<div class="rnp-empty-desc">Press + to add characters<br>to the investigation board</div>';
            html += '</div>';
        }

        board.innerHTML = '<div class="rnp-board-inner">' + html + '</div>';
        applyZoom();
        setupPinchZoom();
    }

    // === 渲染单个档案卡 ===
    function renderDossierCard(ch, allChars, allRels) {
        var isProtected = ch.role === 'user' || ch.role === 'contact';
        var myRels = allRels.filter(function(r) { return r.from === ch.id || r.to === ch.id; });

        var html = '<div class="rnp-dossier-card" data-char-id="' + ch.id + '">';

        // 折叠头部
        html += '<div class="rnp-dossier-header" onclick="window._rnpToggleDossier(this.parentElement)">';
        html += '<img class="rnp-dossier-thumb" src="' + esc(avatarUrl(ch)) + '" onerror="this.src=\'https://ui-avatars.com/api/?name=' + encodeURIComponent((ch.name || '?')[0]) + '&background=111111&color=ffffff&size=100\'">';
        html += '<div class="rnp-dossier-summary">';
        html += '<div class="rnp-dossier-file-tag">SUSPECT FILE #' + charNumId(ch) + '</div>';
        html += '<div class="rnp-dossier-name">' + esc(ch.name || '---') + '</div>';
        html += '<div class="rnp-dossier-brief">' + esc(charBrief(ch)) + '</div>';
        html += '</div>';
        html += '<i class="fas fa-chevron-down rnp-dossier-expand-icon"></i>';
        html += '</div>';

        // 展开区域
        html += '<div class="rnp-dossier-body">';

        // 详细信息
        html += '<div class="rnp-dossier-detail">';

        // 左侧大照片
        html += '<div class="rnp-dossier-photo-area">';
        html += '<img class="rnp-dossier-photo" src="' + esc(avatarUrl(ch)) + '" onerror="this.src=\'https://ui-avatars.com/api/?name=' + encodeURIComponent((ch.name || '?')[0]) + '&background=111111&color=ffffff&size=200\'" onclick="window._rnpUploadAvatar(\'' + ch.id + '\')">';
        html += '<div class="rnp-dossier-photo-id">NO.' + charNumId(ch) + '</div>';
        html += '</div>';

        // 右侧字段
        html += '<div class="rnp-dossier-fields">';
        html += renderField('NAME', ch.name);
        if (ch.gender) html += renderField('GENDER', ch.gender);
        if (ch.age) html += renderField('AGE', ch.age);
        if (ch.identity) html += renderField('ID', ch.identity);
        if (ch.contactRelation) html += renderField('RELATION', ch.contactRelation);
        if (ch.personality) html += renderField('PERSONA', ch.personality);
        if (ch.mbti || ch.zodiac) html += renderField('TYPE', [ch.mbti, ch.zodiac].filter(Boolean).join(' / '));
        if (ch.hobbies) html += renderField('HOBBIES', ch.hobbies);
        // 关联联系人
        if (ch.linkedContactId) {
            var linked = (store.contacts || []).find(function(c) { return c.id === ch.linkedContactId; });
            if (linked) {
                html += renderField('LINKED', (linked.name || '---') + (ch.linkedContactRole ? ' (' + ch.linkedContactRole + ')' : ''));
            }
        }
        html += '</div>';
        html += '</div>';

        // 信息块
        if (ch.appearance) {
            html += '<div class="rnp-dossier-info-block">';
            html += '<div class="rnp-dossier-info-title">APPEARANCE</div>';
            html += '<div class="rnp-dossier-info-text">' + esc(ch.appearance) + '</div>';
            html += '</div>';
        }
        if (ch.experience) {
            html += '<div class="rnp-dossier-info-block">';
            html += '<div class="rnp-dossier-info-title">BACKGROUND</div>';
            html += '<div class="rnp-dossier-info-text">' + esc(ch.experience) + '</div>';
            html += '</div>';
        }
        if (ch.familyBg) {
            html += '<div class="rnp-dossier-info-block">';
            html += '<div class="rnp-dossier-info-title">FAMILY</div>';
            html += '<div class="rnp-dossier-info-text">' + esc(ch.familyBg) + '</div>';
            html += '</div>';
        }
        if (ch.notes) {
            html += '<div class="rnp-dossier-info-block">';
            html += '<div class="rnp-dossier-info-title">NOTES</div>';
            html += '<div class="rnp-dossier-info-text">' + esc(ch.notes) + '</div>';
            html += '</div>';
        }

        // 关系列表
        if (myRels.length > 0) {
            html += '<div class="rnp-dossier-connections">';
            html += '<div class="rnp-dossier-conn-title">CONNECTIONS</div>';
            myRels.forEach(function(r) {
                var otherId = r.from === ch.id ? r.to : r.from;
                var other = allChars.find(function(c) { return c.id === otherId; });
                if (!other) return;
                html += '<div class="rnp-dossier-conn-item" onclick="window._rnpShowCard(\'' + other.id + '\')">';
                html += '<span class="rnp-dossier-conn-bullet">*</span>';
                html += '<span class="rnp-dossier-conn-name">' + esc(other.name) + '</span>';
                html += '<span class="rnp-dossier-conn-dots">....</span>';
                html += '<span class="rnp-dossier-conn-label">' + esc(r.label || '---') + '</span>';
                html += '</div>';
            });
            html += '</div>';
        }

        // 操作栏
        html += '<div class="rnp-dossier-actions">';
        html += '<button class="rnp-dossier-act" onclick="event.stopPropagation();window._rnpEditChar(\'' + ch.id + '\')"><i class="fas fa-pen"></i> EDIT</button>';
        html += '<button class="rnp-dossier-act" onclick="event.stopPropagation();window._rnpAddRelation(\'' + ch.id + '\')"><i class="fas fa-link"></i> LINK</button>';
        if (!isProtected) {
            html += '<button class="rnp-dossier-act rnp-dossier-act-del" onclick="event.stopPropagation();window._rnpDeleteChar(\'' + ch.id + '\')"><i class="fas fa-trash-alt"></i> DEL</button>';
        }
        html += '</div>';

        html += '</div>'; // dossier-body
        html += '</div>'; // dossier-card
        return html;
    }

    function renderField(label, value) {
        return '<div class="rnp-dossier-field">' +
            '<span class="rnp-dossier-field-label">' + label + '</span>' +
            '<span class="rnp-dossier-field-dots">..</span>' +
            '<span class="rnp-dossier-field-value">' + esc(value || '---') + '</span>' +
            '</div>';
    }

    // === 展开/折叠档案卡 ===
    window._rnpToggleDossier = function(cardEl) {
        if (!cardEl) return;
        cardEl.classList.toggle('expanded');
    };

    // === 显示角色详情（复用横屏的ID Card弹窗） ===
    window._rnpShowCard = function(charId) {
        // 复用横屏模块的弹窗函数（已暴露为全局）
        if (typeof window._rnShowCard === 'function') {
            window._rnShowCard(charId);
        }
    };

    // === 编辑角色（复用横屏模块的编辑表单） ===
    window._rnpEditChar = function(charId) {
        if (typeof window._rnEditChar === 'function') {
            window._rnEditChar(charId);
        }
    };

    // === 建立关系（复用横屏模块） ===
    window._rnpAddRelation = function(charId) {
        if (typeof window._rnAddRelation === 'function') {
            window._rnAddRelation(charId);
        }
    };

    // === 删除角色（复用横屏模块） ===
    window._rnpDeleteChar = function(charId) {
        if (typeof window._rnDeleteChar === 'function') {
            window._rnDeleteChar(charId);
        }
    };

    // === 头像上传 ===
    window._rnpUploadAvatar = function(charId) {
        // 创建隐藏的file input
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,.ico';
        input.onchange = function() {
            if (!input.files || !input.files[0]) return;
            var file = input.files[0];
            if (file.size > 2 * 1024 * 1024) {
                if (typeof toast === 'function') toast('Image must be under 2MB', 'error');
                return;
            }
            var reader = new FileReader();
            reader.onload = function(e) {
                var rn = getRNData();
                var ch = rn.characters.find(function(c) { return c.id === charId; });
                if (ch) {
                    ch.avatar = e.target.result;
                    if (typeof save === 'function') save();
                    renderPortraitView();
                    if (typeof toast === 'function') toast('Avatar updated');
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    // === 打开竖屏关系网 ===
    function openPortrait() {
        var layer = document.getElementById('layer-relation-network-portrait');
        if (!layer) return;

        ensureProtagonists();
        layer.classList.add('active');
        document.body.classList.add('rnp-active');

        // 保存偏好
        if (typeof store !== 'undefined') {
            store.rnViewMode = 'portrait';
            if (typeof save === 'function') save();
        }

        renderPortraitView();
    }

    function closePortrait() {
        var layer = document.getElementById('layer-relation-network-portrait');
        if (layer) layer.classList.remove('active');
        document.body.classList.remove('rnp-active');
    }

    // === 切换到横屏模式 ===
    window._rnpSwitchToLandscape = function() {
        closePortrait();
        // 保存偏好
        if (typeof store !== 'undefined') {
            store.rnViewMode = 'landscape';
            if (typeof save === 'function') save();
        }
        setTimeout(function() {
            if (typeof openRelationNetwork === 'function') {
                openRelationNetwork();
            }
        }, 100);
    };

    // === 从横屏切换到竖屏 ===
    window._rnSwitchToPortrait = function() {
        if (typeof closeRelationNetwork === 'function') {
            closeRelationNetwork();
        }
        // 保存偏好
        if (typeof store !== 'undefined') {
            store.rnViewMode = 'portrait';
            if (typeof save === 'function') save();
        }
        setTimeout(function() {
            openPortrait();
        }, 100);
    };

    // === 添加新角色 ===
    window._rnpAddNewChar = function() {
        // 复用横屏模块的添加表单
        if (typeof window._rnAddNewChar === 'function') {
            window._rnAddNewChar();
        }
    };

    // === 监听弹窗操作后刷新竖屏视图 ===
    // 拦截原始的save操作来自动刷新
    var _origRnCloseCard = window._rnCloseCard;
    var _origRnCloseForm = window._rnCloseForm;
    var _origRnCloseLink = window._rnCloseLink;

    function wrapClose(origFn, fnName) {
        return function() {
            if (typeof origFn === 'function') origFn.apply(this, arguments);
            // 延迟刷新竖屏视图（等弹窗关闭动画完成）
            setTimeout(function() {
                var layer = document.getElementById('layer-relation-network-portrait');
                if (layer && layer.classList.contains('active')) {
                    renderPortraitView();
                }
            }, 300);
        };
    }

    // 等横屏模块加载完毕后包装
    function setupCloseWrappers() {
        if (window._rnCloseCard && window._rnCloseCard._rnpWrapped !== true) {
            var orig1 = window._rnCloseCard;
            window._rnCloseCard = function() {
                orig1.apply(this, arguments);
                setTimeout(function() {
                    var layer = document.getElementById('layer-relation-network-portrait');
                    if (layer && layer.classList.contains('active')) renderPortraitView();
                }, 300);
            };
            window._rnCloseCard._rnpWrapped = true;
        }
        if (window._rnCloseForm && window._rnCloseForm._rnpWrapped !== true) {
            var orig2 = window._rnCloseForm;
            window._rnCloseForm = function() {
                orig2.apply(this, arguments);
                setTimeout(function() {
                    var layer = document.getElementById('layer-relation-network-portrait');
                    if (layer && layer.classList.contains('active')) renderPortraitView();
                }, 300);
            };
            window._rnCloseForm._rnpWrapped = true;
        }
        if (window._rnCloseLink && window._rnCloseLink._rnpWrapped !== true) {
            var orig3 = window._rnCloseLink;
            window._rnCloseLink = function() {
                orig3.apply(this, arguments);
                setTimeout(function() {
                    var layer = document.getElementById('layer-relation-network-portrait');
                    if (layer && layer.classList.contains('active')) renderPortraitView();
                }, 300);
            };
            window._rnCloseLink._rnpWrapped = true;
        }
    }

    // 延迟设置包装器（确保横屏模块已加载）
    setTimeout(setupCloseWrappers, 2000);

    // === 智能打开：根据偏好选择模式 ===
    function openRelationNetworkSmart() {
        var mode = (typeof store !== 'undefined' && store.rnViewMode) ? store.rnViewMode : 'portrait';
        if (mode === 'landscape') {
            if (typeof openRelationNetwork === 'function') {
                openRelationNetwork();
            }
        } else {
            openPortrait();
        }
    }

    // === 暴露全局函数 ===
    window.openRelationNetworkPortrait = openPortrait;
    window.closeRelationNetworkPortrait = closePortrait;
    window.openRelationNetworkSmart = openRelationNetworkSmart;
    window._rnpRefresh = renderPortraitView;

    // 覆盖默认入口：让关系网默认走智能模式选择
    // 保存原始横屏打开函数
    var _origOpenRN = window.openRelationNetwork;
    window._openRelationNetworkLandscape = _origOpenRN;

    // 替换为智能入口
    window.openRelationNetwork = function() {
        var mode = (typeof store !== 'undefined' && store.rnViewMode) ? store.rnViewMode : 'portrait';
        if (mode === 'portrait') {
            openPortrait();
        } else {
            if (typeof _origOpenRN === 'function') _origOpenRN();
        }
    };

})();
