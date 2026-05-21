        // ========== GLOBAL WALLPAPER MANAGEMENT SYSTEM ==========
        // 全局壁纸管理：上传壁纸库 → 分配到各界面 → 调节透明度
        // 不影响用户自定义CSS代码
        // [FIX-壁纸卡顿] 使用Blob URL缓存避免base64直接渲染到DOM，大幅减少卡顿

        (function() {
            'use strict';

            // ---- Blob URL 缓存系统 ----
            // [FIX-壁纸卡顿] 将base64转为Blob URL用于DOM渲染，避免巨量base64字符串阻塞主线程
            var _blobUrlCache = {}; // { imgId: blobUrl }
            var _blobUrlOrder = []; // [FIX-壁纸内存v2] LRU顺序追踪，用于缓存淘汰
            var _GWP_MAX_BLOB_CACHE = 12; // [FIX-壁纸内存v2] Blob URL缓存上限，超出时淘汰最早的

            // [FIX-壁纸删除残留] 健康检查抑制标志，删除/清除壁纸后短暂跳过健康检查
            // 防止健康检查在异步持久化完成前检测到"壁纸层丢失"而恢复已删除的壁纸
            var _gwpHealthCheckSuppressUntil = 0;

            // [FIX-壁纸发热v2] 低端设备检测：内存<=4GB 或 CPU核心<=4 视为低端
            // 低端设备降级backdrop-filter为纯色背景，避免GPU过载发热
            var _gwpIsLowEnd = (function() {
                try {
                    var mem = navigator.deviceMemory || 8; // 默认假设高端
                    var cores = navigator.hardwareConcurrency || 8;
                    // Android WebView 通常能拿到真实值；iOS Safari 不暴露deviceMemory
                    return mem <= 4 || cores <= 4;
                } catch(e) { return false; }
            })();

            // [FIX-壁纸掉图v2] 移除同步XHR验证（阻塞主线程），改为信任缓存+异步重建策略
            // Blob URL 只要不被 revoke 就一直有效，无需主动验证
            // 如果渲染时发现图片加载失败（onerror），再触发重建

            function gwpGetBlobUrl(imgObj) {
                if (!imgObj || !imgObj.data) return '';
                // [FIX-壁纸掉图] 检查缓存的Blob URL是否仍然有效，失效则重建
                if (_blobUrlCache[imgObj.id]) {
                    // [FIX-壁纸内存v2] 更新LRU顺序
                    var lruIdx = _blobUrlOrder.indexOf(imgObj.id);
                    if (lruIdx > -1) _blobUrlOrder.splice(lruIdx, 1);
                    _blobUrlOrder.push(imgObj.id);
                    return _blobUrlCache[imgObj.id];
                }
                try {
                    // [FIX-壁纸内存v2] 缓存淘汰：超出上限时释放最早的Blob URL
                    while (_blobUrlOrder.length >= _GWP_MAX_BLOB_CACHE) {
                        var evictId = _blobUrlOrder.shift();
                        if (_blobUrlCache[evictId]) {
                            try { URL.revokeObjectURL(_blobUrlCache[evictId]); } catch(ex) {}
                            delete _blobUrlCache[evictId];
                        }
                    }
                    // 将base64转为Blob
                    var parts = imgObj.data.split(',');
                    var mime = parts[0].match(/:(.*?);/);
                    var mimeType = (mime && mime[1]) ? mime[1] : 'image/jpeg';
                    var byteStr = atob(parts[1]);
                    var ab = new ArrayBuffer(byteStr.length);
                    var ia = new Uint8Array(ab);
                    for (var i = 0; i < byteStr.length; i++) {
                        ia[i] = byteStr.charCodeAt(i);
                    }
                    var blob = new Blob([ab], { type: mimeType });
                    var url = URL.createObjectURL(blob);
                    _blobUrlCache[imgObj.id] = url;
                    _blobUrlOrder.push(imgObj.id);
                    return url;
                } catch(e) {
                    console.warn('[GWP] Blob URL creation failed, falling back to data URL:', e);
                    return imgObj.data;
                }
            }

            // [FIX-壁纸掉图] 强制重建指定图片的Blob URL（当检测到失效时调用）
            function gwpRebuildBlobUrl(imgObj) {
                if (!imgObj || !imgObj.data) return '';
                // 先清除旧的
                if (_blobUrlCache[imgObj.id]) {
                    try { URL.revokeObjectURL(_blobUrlCache[imgObj.id]); } catch(e) {}
                    delete _blobUrlCache[imgObj.id];
                    var idx = _blobUrlOrder.indexOf(imgObj.id);
                    if (idx > -1) _blobUrlOrder.splice(idx, 1);
                }
                return gwpGetBlobUrl(imgObj);
            }

            function gwpRevokeBlobUrl(imgId) {
                if (_blobUrlCache[imgId]) {
                    try { URL.revokeObjectURL(_blobUrlCache[imgId]); } catch(e) {}
                    delete _blobUrlCache[imgId];
                    var idx = _blobUrlOrder.indexOf(imgId);
                    if (idx > -1) _blobUrlOrder.splice(idx, 1);
                }
            }

            function gwpRevokeAllBlobUrls() {
                Object.keys(_blobUrlCache).forEach(function(k) {
                    try { URL.revokeObjectURL(_blobUrlCache[k]); } catch(e) {}
                });
                _blobUrlCache = {};
                _blobUrlOrder = [];
            }

            // 预加载所有壁纸的Blob URL（异步，不阻塞）
            // [FIX-壁纸内存v2] 只预加载当前已分配的壁纸，未分配的按需加载
            function gwpPreloadBlobUrls() {
                var images = (store.globalWallpapers && store.globalWallpapers.images) || [];
                var assign = (store.globalWallpapers && store.globalWallpapers.assign) || {};
                var assignedIds = Object.values(assign);
                images.forEach(function(img, i) {
                    if (!_blobUrlCache[img.id] && img.data && assignedIds.indexOf(img.id) !== -1) {
                        // 使用setTimeout分帧处理，避免一次性转换多张图片时卡顿
                        setTimeout(function() { gwpGetBlobUrl(img); }, i * 50);
                    }
                });
            }

            // 壁纸可分配的界面定义
            // [FIX-外卖壁纸] 移除外卖界面：外卖使用自定义DOM结构(fd-navbar/fd-container)，与壁纸系统不兼容
            const GWP_PAGES = [
                { id: 'home',       name: '主界面',           layer: '#layer-desktop', selector: '#layer-desktop' },
                { id: 'wx-contact', name: '微信联系人界面',   layer: '#layer-wechat', selector: '#tab-contacts' },
                { id: 'wx-me',      name: '微信我的界面',     layer: '#layer-wechat', selector: '#tab-me' },
                { id: 'worldbook',  name: '世界书界面',       layer: '#layer-worldbook', selector: '#layer-worldbook' },
                { id: 'perception', name: '感知界面',         layer: '#layer-perception', selector: '#layer-perception' },
                { id: 'couple',     name: '情侣空间联系人界面', layer: '#layer-couple', selector: '#layer-couple' },
                { id: 'beauty',     name: '美化界面',         layer: '#layer-beauty', selector: '#layer-beauty' },
                { id: 'settings',   name: '设置界面',         layer: '#layer-settings', selector: '#layer-settings' }
            ];

            // 初始化store数据
            function gwpEnsureStore() {
                if (!store.globalWallpapers) {
                    store.globalWallpapers = {
                        images: [],      // [{id, data, name, addedAt}]
                        assign: {},      // { pageId: imageId }
                        opacity: {}      // { pageId: { nav: 80, content: 90 } }
                    };
                }
                if (!store.globalWallpapers.images) store.globalWallpapers.images = [];
                if (!store.globalWallpapers.assign) store.globalWallpapers.assign = {};
                if (!store.globalWallpapers.opacity) store.globalWallpapers.opacity = {};
            }

            // 渲染全局壁纸管理页面
            window.gwpRenderPage = function() {
                gwpEnsureStore();
                gwpRenderGallery();
                gwpRenderAssignList();
                gwpRenderOpacityList();
            };

            // ---- 壁纸库渲染 ----
            // [FIX-壁纸卡顿] 使用Blob URL渲染缩略图，避免在DOM中嵌入大量base64
            function gwpRenderGallery() {
                const gallery = document.getElementById('gwp-gallery');
                if (!gallery) return;
                const images = store.globalWallpapers.images || [];
                if (images.length === 0) {
                    gallery.innerHTML = '<div style="text-align:center; padding:20px; color:#aaa; font-size:13px;">还没有上传壁纸，点击下方按钮添加</div>';
                    return;
                }
                gallery.innerHTML = images.map(function(img, idx) {
                    var thumbUrl = gwpGetBlobUrl(img);
                    return '<div class="gwp-thumb" data-id="' + img.id + '">' +
                        '<div class="gwp-thumb-img" style="background-image:url(' + thumbUrl + ')"></div>' +
                        '<div class="gwp-thumb-name">' + (img.name || ('壁纸' + (idx+1))) + '</div>' +
                        '<div class="gwp-thumb-del" onclick="event.stopPropagation(); gwpDeleteImage(\'' + img.id + '\')"><i class="fas fa-times"></i></div>' +
                    '</div>';
                }).join('');
            }

            // ---- 上传壁纸 ----
            window.gwpUploadWallpaper = function() {
                var fi = document.getElementById('gwp-file-input');
                if (fi) { fi.value = ''; fi.click(); }
            };

            // [FIX-壁纸卡顿] 上传完成后先更新UI再异步save，防止save阻塞界面
            window.gwpHandleFiles = function(files) {
                gwpEnsureStore();
                if (!files || files.length === 0) return;
                var loaded = 0;
                var total = files.length;
                // [FIX-壁纸卡顿] 显示上传中提示
                toast('正在处理图片...', 'info');
                Array.from(files).forEach(function(file) {
                    // [FIX-文件管理器兼容] 某些文件管理器返回的MIME可能是application/octet-stream，通过扩展名辅助判断
                    var isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|bmp|webp|svg|ico|avif|tiff?)$/i.test(file.name);
                    if (!isImage) { loaded++; return; }
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        // [FIX-壁纸画质] 提高压缩尺寸和质量，避免壁纸模糊
                        gwpCompressImage(e.target.result, 1920, 0.85, function(compressed) {
                            var imgObj = {
                                id: 'gwp_' + Date.now() + '_' + Math.random().toString(36).substr(2,6),
                                data: compressed,
                                name: file.name.replace(/\.[^.]+$/, '').substring(0, 20),
                                addedAt: Date.now()
                            };
                            store.globalWallpapers.images.push(imgObj);
                            // [FIX-壁纸卡顿] 立即为新图片创建Blob URL
                            gwpGetBlobUrl(imgObj);
                            loaded++;
                            if (loaded >= total) {
                                // [FIX-壁纸卡顿] 先用rAF更新UI，再异步save
                                requestAnimationFrame(function() {
                                    gwpRenderGallery();
                                    gwpRenderAssignList();
                                    toast('已添加 ' + store.globalWallpapers.images.length + ' 张壁纸', 'success');
                                    // [FIX-壁纸丢失] 立即触发save而非延迟，防止用户上传后快速切走导致数据未持久化
                                    save();
                                    // [FIX-壁纸掉图] 同时调用_doSaveNow立即持久化到IDB，不等debounce
                                    if (typeof _doSaveNow === 'function') _doSaveNow();
                                });
                            }
                        });
                    };
                    reader.readAsDataURL(file);
                });
            };

            // 图片压缩
            // [FIX-壁纸画质] 使用较高的maxSize和quality保证壁纸清晰度
            function gwpCompressImage(dataUrl, maxSize, quality, cb) {
                var img = new Image();
                img.onload = function() {
                    var w = img.width, h = img.height;
                    if (w > maxSize || h > maxSize) {
                        var ratio = Math.min(maxSize / w, maxSize / h);
                        w = Math.round(w * ratio);
                        h = Math.round(h * ratio);
                    }
                    var canvas = document.createElement('canvas');
                    canvas.width = w; canvas.height = h;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    var result = canvas.toDataURL('image/jpeg', quality);
                    // [FIX-壁纸卡顿] 释放canvas内存
                    canvas.width = 1; canvas.height = 1;
                    cb(result);
                };
                img.onerror = function() { cb(dataUrl); };
                img.src = dataUrl;
            }

            // ---- 删除壁纸 ----
            window.gwpDeleteImage = function(imgId) {
                gwpEnsureStore();
                // [FIX-壁纸卡顿] 释放Blob URL
                gwpRevokeBlobUrl(imgId);
                // [FIX-壁纸删除残留] 先同步移除使用该图片的壁纸DOM层，防止健康检查或分帧应用恢复旧壁纸
                var assign = store.globalWallpapers.assign;
                Object.keys(assign).forEach(function(k) {
                    if (assign[k] === imgId) {
                        var wpLayer = document.getElementById('gwp-layer-' + k);
                        if (wpLayer) wpLayer.remove();
                        delete assign[k];
                    }
                });
                // 移除图片
                store.globalWallpapers.images = store.globalWallpapers.images.filter(function(i) { return i.id !== imgId; });
                // [FIX-壁纸删除残留] 抑制健康检查120秒，等待IDB异步写入完成
                _gwpHealthCheckSuppressUntil = Date.now() + 120000;
                // [FIX-壁纸卡顿] 先更新UI再异步save
                gwpRenderGallery();
                gwpRenderAssignList();
                gwpApplyAllWallpapers();
                toast('壁纸已删除', 'success');
                // [FIX-壁纸自动变] 删除后立即持久化到IDB+LS Core，防止debounce窗口内关闭导致删除未生效
                save();
                if (typeof _doSaveNow === 'function') _doSaveNow();
                // [FIX-壁纸删除残留] 同步更新独立IDB图片key，防止下次加载时从IDB恢复已删除的图片
                try {
                    if (typeof idb !== 'undefined' && idb.set) {
                        idb.set('AIChatOS_v8_GWP_Images', store.globalWallpapers.images).catch(function(e) {
                            console.warn('[GWP] 删除后同步IDB图片key失败:', e);
                        });
                    }
                } catch(e) {}
            };

            // ---- 壁纸分配渲染 ----
            // [FIX-壁纸卡顿] 使用Blob URL渲染预览图
            function gwpRenderAssignList() {
                var container = document.getElementById('gwp-assign-list');
                if (!container) return;
                gwpEnsureStore();
                var images = store.globalWallpapers.images || [];
                var assign = store.globalWallpapers.assign;

                container.innerHTML = GWP_PAGES.map(function(page) {
                    var curId = assign[page.id] || '';
                    var options = '<option value="">不设置</option>';
                    images.forEach(function(img, idx) {
                        var selected = (img.id === curId) ? ' selected' : '';
                        options += '<option value="' + img.id + '"' + selected + '>' + (img.name || ('壁纸' + (idx+1))) + '</option>';
                    });
                    var previewStyle = '';
                    if (curId) {
                        var found = images.find(function(i) { return i.id === curId; });
                        if (found) {
                            var previewUrl = gwpGetBlobUrl(found);
                            previewStyle = 'background-image:url(' + previewUrl + ')';
                        }
                    }
                    return '<div class="gwp-assign-item">' +
                        '<div class="gwp-assign-preview" style="' + previewStyle + '">' +
                            (curId ? '' : '<i class="fas fa-image" style="color:#ccc;font-size:16px;"></i>') +
                        '</div>' +
                        '<div class="gwp-assign-info">' +
                            '<div class="gwp-assign-name">' + page.name + '</div>' +
                            '<select class="gwp-assign-select" onchange="gwpAssignWallpaper(\'' + page.id + '\', this.value)">' + options + '</select>' +
                        '</div>' +
                    '</div>';
                }).join('');
            }

            // ---- 分配壁纸到界面 ----
            window.gwpAssignWallpaper = function(pageId, imgId) {
                gwpEnsureStore();
                if (imgId) {
                    store.globalWallpapers.assign[pageId] = imgId;
                } else {
                    delete store.globalWallpapers.assign[pageId];
                }
                // [FIX-壁纸卡顿] 先更新UI再异步save
                gwpRenderAssignList();
                gwpApplyWallpaper(pageId);
                // [FIX-壁纸丢失] 立即触发save
                save();
                // [FIX-换不了壁纸] 立即持久化到IDB，防止debounce窗口内切走导致未保存
                if (typeof _doSaveNow === 'function') _doSaveNow();
            };

            // ---- 透明度设置渲染 ----
            function gwpRenderOpacityList() {
                var container = document.getElementById('gwp-opacity-list');
                if (!container) return;
                gwpEnsureStore();
                var opacity = store.globalWallpapers.opacity;

                container.innerHTML = GWP_PAGES.map(function(page) {
                    var o = opacity[page.id] || {};
                    var navVal = o.nav != null ? o.nav : 85;
                    var contentVal = o.content != null ? o.content : 90;
                    return '<div class="gwp-opacity-item">' +
                        '<div class="gwp-opacity-name">' + page.name + '</div>' +
                        '<div class="gwp-opacity-controls">' +
                            '<div class="gwp-opacity-row">' +
                                '<span class="gwp-opacity-label">导航栏</span>' +
                                '<input type="range" min="0" max="100" value="' + navVal + '" ' +
                                    'oninput="gwpSetOpacity(\'' + page.id + '\',\'nav\',this.value); this.nextElementSibling.textContent=this.value+\'%\'" class="gwp-opacity-slider">' +
                                '<span class="gwp-opacity-val">' + navVal + '%</span>' +
                            '</div>' +
                            '<div class="gwp-opacity-row">' +
                                '<span class="gwp-opacity-label">内容区</span>' +
                                '<input type="range" min="0" max="100" value="' + contentVal + '" ' +
                                    'oninput="gwpSetOpacity(\'' + page.id + '\',\'content\',this.value); this.nextElementSibling.textContent=this.value+\'%\'" class="gwp-opacity-slider">' +
                                '<span class="gwp-opacity-val">' + contentVal + '%</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
                }).join('');
            }

            // ---- 设置透明度 ----
            window.gwpSetOpacity = _debounce(function(pageId, type, val) {
                gwpEnsureStore();
                if (!store.globalWallpapers.opacity[pageId]) {
                    store.globalWallpapers.opacity[pageId] = { nav: 85, content: 90 };
                }
                store.globalWallpapers.opacity[pageId][type] = parseInt(val);
                gwpApplyWallpaper(pageId);
                // [FIX-壁纸卡顿] 异步save
                setTimeout(function() { save(); }, 50);
            }, 300);

            // ---- 应用壁纸到指定页面 ----
            // [FIX-壁纸卡顿] 使用Blob URL设置背景图，避免base64直接渲染
            // [FIX-换不了壁纸] 增加_retryCount参数，目标DOM不存在时延迟重试（最多3次）
            function gwpApplyWallpaper(pageId, _retryCount) {
                gwpEnsureStore();
                var assign = store.globalWallpapers.assign;
                var images = store.globalWallpapers.images || [];
                var opacity = store.globalWallpapers.opacity;
                var pageConf = GWP_PAGES.find(function(p) { return p.id === pageId; });
                if (!pageConf) return;

                var imgId = assign[pageId];
                var el = document.querySelector(pageConf.selector);
                // [FIX-换不了壁纸] 目标DOM不存在时延迟重试，避免layer尚未创建导致壁纸静默失败
                if (!el) {
                    var retries = _retryCount || 0;
                    if (retries < 3) {
                        setTimeout(function() { gwpApplyWallpaper(pageId, retries + 1); }, 500 * (retries + 1));
                    }
                    return;
                }

                // 获取或创建壁纸层
                var wpLayerId = 'gwp-layer-' + pageId;
                var existingLayer = document.getElementById(wpLayerId);

                if (!imgId) {
                    // 移除壁纸
                    if (existingLayer) existingLayer.remove();
                    el.style.removeProperty('--gwp-bg');
                    el.style.removeProperty('--gwp-nav-opacity');
                    el.style.removeProperty('--gwp-content-opacity');
                    el.classList.remove('gwp-has-wallpaper');
                    // [FIX-壁纸透明] 移除壁纸时，清除所有inline背景样式以恢复主题默认
                    gwpClearInlineStyles(el);
                    return;
                }

                var imgObj = images.find(function(i) { return i.id === imgId; });
                if (!imgObj) return;

                var o = opacity[pageId] || { nav: 85, content: 90 };

                // 创建或更新壁纸背景层
                if (!existingLayer) {
                    existingLayer = document.createElement('div');
                    existingLayer.id = wpLayerId;
                    existingLayer.className = 'gwp-bg-layer';
                    // 确保插入到容器的第一个子元素之前
                    if (el.firstChild) {
                        el.insertBefore(existingLayer, el.firstChild);
                    } else {
                        el.appendChild(existingLayer);
                    }
                }

                // [FIX-壁纸卡顿] 使用Blob URL而非base64
                // [FIX-壁纸掉图] 获取Blob URL，如果缓存失效则自动重建
                var bgUrl = gwpGetBlobUrl(imgObj);
                if (!bgUrl && imgObj.data) {
                    // Blob URL获取失败，强制重建
                    bgUrl = gwpRebuildBlobUrl(imgObj);
                }
                // [FIX-壁纸掉图] 如果仍然没有URL但有data，直接用data URL作为兜底
                if (!bgUrl && imgObj.data) {
                    bgUrl = imgObj.data;
                }
                existingLayer.style.backgroundImage = 'url(' + bgUrl + ')';
                el.classList.add('gwp-has-wallpaper');

                // 设置CSS变量控制透明度
                el.style.setProperty('--gwp-nav-opacity', (o.nav / 100).toString());
                el.style.setProperty('--gwp-content-opacity', (o.content / 100).toString());

                // [FIX-壁纸透明] 直接通过inline样式设置导航栏透明度，覆盖主题CSS的!important
                gwpForceApplyInlineStyles(el, o);
            }

            // [FIX-壁纸透明] 强制通过inline样式覆盖主题CSS
            // [FIX-全局壁纸] 只样式化容器的直接子元素，不影响子页面（如beauty-subpage）内部的元素
            // [FIX-壁纸发热v2] 低端设备降级：不使用backdrop-filter，改用更高不透明度的纯色背景
            function gwpForceApplyInlineStyles(container, o) {
                var navOpacity = o.nav / 100;
                var contentOpacity = o.content / 100;
                // [FIX-壁纸发热v2] 低端设备提高背景不透明度补偿无blur的视觉效果
                var effectiveNavOpacity = _gwpIsLowEnd ? Math.min(navOpacity + 0.15, 1) : navOpacity;
                var navBg = 'rgba(255,255,255,' + effectiveNavOpacity + ')';
                var contentBg = 'rgba(255,255,255,' + contentOpacity + ')';
                var borderColor = 'rgba(209,209,209,' + effectiveNavOpacity + ')';

                // [FIX-全局壁纸] 辅助函数：样式化导航栏
                function styleNav(nav) {
                    nav.style.setProperty('background', navBg, 'important');
                    nav.style.setProperty('background-image', 'none', 'important');
                    // [FIX-壁纸发热v2] 低端设备跳过backdrop-filter，避免GPU过载发热
                    if (!_gwpIsLowEnd) {
                        nav.style.setProperty('backdrop-filter', 'blur(10px)', 'important');
                        nav.style.setProperty('-webkit-backdrop-filter', 'blur(10px)', 'important');
                    } else {
                        nav.style.removeProperty('backdrop-filter');
                        nav.style.removeProperty('-webkit-backdrop-filter');
                    }
                    nav.style.setProperty('border-bottom-color', borderColor, 'important');
                    // [FIX-联系人列表被挤低] 保留nav-bar原有的position值，不强制改为relative
                    // 如果nav-bar本身是absolute定位（如微信联系人界面），改成relative会让它占据文档流空间，挤低下方内容
                    var currentPos = window.getComputedStyle(nav).position;
                    if (currentPos !== 'absolute' && currentPos !== 'fixed') {
                        nav.style.setProperty('position', 'relative', '');
                    }
                    nav.style.setProperty('z-index', '100', 'important');
                    nav.setAttribute('data-gwp-styled', '1');
                }

                // [FIX-全局壁纸] 只设置容器直接子元素中的导航栏，避免影响子页面
                var directNav = container.querySelector(':scope > .nav-bar');
                if (directNav) {
                    styleNav(directNav);
                }

                // [FIX-全局壁纸] 设置容器直接子元素中的滚动区域
                var directScrolls = container.querySelectorAll(':scope > .scroll-y');
                directScrolls.forEach(function(scroll) {
                    scroll.style.setProperty('background', contentBg, 'important');
                    scroll.style.setProperty('background-image', 'none', 'important');
                    scroll.setAttribute('data-gwp-styled', '1');
                });

                // [FIX-全局壁纸] 设置子页面(beauty-subpage/settings-subpage)内的scroll-y也透明
                var subpageScrolls = container.querySelectorAll(':scope > .beauty-subpage > .scroll-y, :scope > .settings-subpage > .scroll-y');
                subpageScrolls.forEach(function(scroll) {
                    scroll.style.setProperty('background', contentBg, 'important');
                    scroll.style.setProperty('background-image', 'none', 'important');
                    scroll.setAttribute('data-gwp-styled', '1');
                });

                // [FIX-全局壁纸] 设置子页面本身为透明背景
                var subpages = container.querySelectorAll(':scope > .beauty-subpage, :scope > .settings-subpage');
                subpages.forEach(function(sp) {
                    sp.style.setProperty('background', 'transparent', 'important');
                    sp.style.setProperty('background-image', 'none', 'important');
                    sp.setAttribute('data-gwp-styled', '1');
                });

                // 设置底部tab栏透明（只搜索直接子元素）
                var directTabBars = container.querySelectorAll(':scope > .wx-tab-bar');
                directTabBars.forEach(function(tab) {
                    tab.style.setProperty('background', navBg, 'important');
                    tab.style.setProperty('background-image', 'none', 'important');
                    // [FIX-壁纸发热v2] 低端设备跳过backdrop-filter
                    if (!_gwpIsLowEnd) {
                        tab.style.setProperty('backdrop-filter', 'blur(10px)', 'important');
                        tab.style.setProperty('-webkit-backdrop-filter', 'blur(10px)', 'important');
                    } else {
                        tab.style.removeProperty('backdrop-filter');
                        tab.style.removeProperty('-webkit-backdrop-filter');
                    }
                    tab.setAttribute('data-gwp-styled', '1');
                });
            }

            // [FIX-壁纸透明] 清除inline壁纸样式
            function gwpClearInlineStyles(container) {
                var styledEls = container.querySelectorAll('[data-gwp-styled]');
                styledEls.forEach(function(el) {
                    el.style.removeProperty('background');
                    el.style.removeProperty('background-image');
                    el.style.removeProperty('backdrop-filter');
                    el.style.removeProperty('-webkit-backdrop-filter');
                    el.style.removeProperty('border-bottom-color');
                    // 不移除position和z-index，因为它们可能是原始样式
                    el.removeAttribute('data-gwp-styled');
                });
            }

            // ---- 应用所有壁纸 ----
            // [FIX-壁纸卡顿] 分帧应用壁纸，避免一次性应用所有界面导致卡顿
            function gwpApplyAllWallpapers() {
                gwpEnsureStore();
                var pages = GWP_PAGES.slice();
                var idx = 0;
                function applyNext() {
                    if (idx >= pages.length) return;
                    gwpApplyWallpaper(pages[idx].id);
                    idx++;
                    if (idx < pages.length) {
                        requestAnimationFrame(applyNext);
                    }
                }
                requestAnimationFrame(applyNext);
            }
            window.gwpApplyAllWallpapers = gwpApplyAllWallpapers;

            // ---- 清除所有 ----
            window.gwpClearAll = function() {
                showConfirm('清除壁纸', '确定清除所有壁纸和分配设置？', function() {
                    gwpEnsureStore();
                    // [FIX-壁纸卡顿] 释放所有Blob URL
                    gwpRevokeAllBlobUrls();
                    store.globalWallpapers.images = [];
                    store.globalWallpapers.assign = {};
                    store.globalWallpapers.opacity = {};
                    // [FIX-壁纸删除残留] 抑制健康检查120秒
                    _gwpHealthCheckSuppressUntil = Date.now() + 120000;
                    // 先移除所有已存在的壁纸背景层DOM元素
                    document.querySelectorAll('.gwp-bg-layer').forEach(function(el) { el.remove(); });
                    // [FIX-壁纸透明] 清除所有壁纸inline样式
                    document.querySelectorAll('[data-gwp-styled]').forEach(function(el) {
                        el.style.removeProperty('background');
                        el.style.removeProperty('background-image');
                        el.style.removeProperty('backdrop-filter');
                        el.style.removeProperty('-webkit-backdrop-filter');
                        el.style.removeProperty('border-bottom-color');
                        el.removeAttribute('data-gwp-styled');
                    });
                    // 清除gwp-has-wallpaper类和CSS变量
                    document.querySelectorAll('.gwp-has-wallpaper').forEach(function(el) {
                        el.classList.remove('gwp-has-wallpaper');
                        el.style.removeProperty('--gwp-bg');
                        el.style.removeProperty('--gwp-nav-opacity');
                        el.style.removeProperty('--gwp-content-opacity');
                    });
                    gwpRenderPage();
                    toast('所有壁纸已清除', 'success');
                    setTimeout(function() { save(); }, 50);
                    // [FIX-壁纸删除残留] 同步清空独立IDB图片key
                    try {
                        if (typeof idb !== 'undefined' && idb.set) {
                            idb.set('AIChatOS_v8_GWP_Images', []).catch(function(e) {
                                console.warn('[GWP] 清除后同步IDB图片key失败:', e);
                            });
                        }
                    } catch(e) {}
                });
            };

            // ---- 页面加载时自动应用壁纸 ----
            // [FIX-壁纸卡顿] 先预加载Blob URL，再延迟分帧应用
            setTimeout(function() {
                if (store.globalWallpapers && store.globalWallpapers.images && store.globalWallpapers.images.length > 0) {
                    gwpPreloadBlobUrls();
                    // 等Blob URL创建完成后再应用
                    setTimeout(function() {
                        gwpApplyAllWallpapers();
                    }, 200);
                }
            }, 1500);

            // [FIX-壁纸掉图] 定期壁纸健康检查：检测壁纸背景层是否丢失并自动恢复
            // [FIX-壁纸卡顿发热] 从30秒改为60秒，减少不必要的DOM遍历和样式重计算
            setInterval(function() {
                try {
                    // [FIX-壁纸删除残留] 删除/清除操作后短暂跳过健康检查，防止恢复已删除的壁纸
                    if (Date.now() < _gwpHealthCheckSuppressUntil) return;
                    if (!store.globalWallpapers || !store.globalWallpapers.assign) return;
                    var assign = store.globalWallpapers.assign;
                    var images = store.globalWallpapers.images || [];
                    var needReapply = false;
                    GWP_PAGES.forEach(function(page) {
                        var imgId = assign[page.id];
                        if (!imgId) return;
                        var imgObj = images.find(function(i) { return i.id === imgId; });
                        if (!imgObj || !imgObj.data) return;
                        // 检查壁纸背景层DOM是否存在
                        var wpLayer = document.getElementById('gwp-layer-' + page.id);
                        if (!wpLayer) {
                            console.warn('[GWP-健康检查] 壁纸层丢失: ' + page.id + '，自动恢复');
                            needReapply = true;
                            return;
                        }
                        // 检查背景图是否为空
                        var bgImg = wpLayer.style.backgroundImage;
                        if (!bgImg || bgImg === 'none' || bgImg === '') {
                            console.warn('[GWP-健康检查] 壁纸背景图丢失: ' + page.id + '，自动恢复');
                            needReapply = true;
                        }
                    });
                    if (needReapply) {
                        gwpPreloadBlobUrls();
                        setTimeout(function() { gwpApplyAllWallpapers(); }, 100);
                    }
                } catch(e) {
                    console.warn('[GWP-健康检查] 异常:', e);
                }
            }, 60000);

            // [FIX-壁纸掉图] 页面从后台恢复时重新检查壁纸
            document.addEventListener('visibilitychange', function() {
                if (document.visibilityState === 'visible') {
                    setTimeout(function() {
                        try {
                            if (!store.globalWallpapers || !store.globalWallpapers.images || store.globalWallpapers.images.length === 0) return;
                            gwpPreloadBlobUrls();
                            setTimeout(function() { gwpApplyAllWallpapers(); }, 200);
                        } catch(e) {}
                    }, 500);
                }
            });

        })();
        // ========== END GLOBAL WALLPAPER MANAGEMENT SYSTEM ==========
