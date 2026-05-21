/**
 * ★★★ YAN3 统一设备适配器 v3.2 ★★★
 *
 * [FIX-2026-04-06] v3.2 修复:
 *   - 修复iOS Chrome(WKWebView)打开地图等layer时页面偏移的bug
 *   - 添加iOS Chrome/非Safari浏览器检测（is-ios-chrome class）
 *   - 在layer获得show class时，非键盘状态下清除残留的键盘适配内联样式
 *   - restoreLayerHeights()增强：检测更多残留样式情况
 *   - iOS Chrome专用CSS修复：强制GPU重绘，确保layer.show定位正确
 *
 * [FIX-2026-04-06] v3.1 修复:
 *   - 恢复safe-area真实探测（viewport-fit=cover需要）
 *   - 添加is-pwa/is-browser class检测（CSS规则依赖这些class）
 *   - 添加is-ios class检测
 *   - 修复JS和CSS的safe-area策略冲突导致的:
 *     1. iOS状态栏下方白色长条（底部溢出）
 *     2. 页面顶部与原生状态栏重合（safe-area未正确处理）
 *
 * 键盘处理:
 *   核心原则: 不对抗浏览器，让浏览器自己处理键盘
 *   1. 不手动移动输入栏位置
 *   2. 不使用 position:fixed 来定位输入栏
 *   3. 不设置 body/layer 的固定高度（键盘弹出时）
 *   4. 使用 visualViewport 仅设置CSS变量，让CSS flexbox自然布局
 *   5. 键盘弹出时，layer高度 = visualViewport.height，输入栏自然在底部
 */
(function() {
    'use strict';

    // ==========================================
    // 1. 基础变量
    // ==========================================
    // [FIX-2026-04-06] 恢复safe-area探测，viewport-fit=cover需要正确处理safe-area
    var _safeTop = 0;
    var _safeBottom = 0;
    var _safeLeft = 0;
    var _safeRight = 0;
    var _fullViewportHeight = window.innerHeight;
    var _isKeyboardOpen = false;
    var _kbHeight = 0;
    var _isPWA = false;
    var _isIOS = false;
    var _isIOSChrome = false; // [FIX-iOS Chrome偏移] iOS Chrome使用WKWebView但行为与Safari不同

    // ==========================================
    // 1a. 检测运行环境（PWA/浏览器/iOS）
    // ==========================================
    // [FIX-2026-04-06] 添加环境检测，给<html>添加is-pwa/is-browser class
    // CSS中的html.is-pwa和html.is-browser规则依赖这些class
    function detectEnvironment() {
        var doc = document.documentElement;
        
        // 检测iOS
        _isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        if (_isIOS) {
            doc.classList.add('is-ios');
        }
        
        // [FIX-iOS Chrome偏移] 检测iOS Chrome
        // iOS Chrome使用WKWebView，但visualViewport行为与Safari不同
        // CriOS是iOS Chrome的UA标识，OPT是Opera，FxiOS是Firefox
        _isIOSChrome = _isIOS && /CriOS|OPT|FxiOS/.test(navigator.userAgent);
        if (_isIOSChrome) {
            doc.classList.add('is-ios-chrome');
            console.log('[DeviceAdapter] 检测到iOS Chrome/非Safari浏览器');
        }
        
        // [FIX-2026-04-10] 检测Capacitor/Android APK环境
        // Capacitor注入了window.Capacitor对象，或者UA中包含capacitor标识
        // 某些Android机型的WebView不支持env(safe-area-inset-top)，
        // 需要使用MainActivity注入的--apk-status-bar-height CSS变量作为fallback
        var isCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
        var isAndroid = /Android/i.test(navigator.userAgent);
        if (isCapacitor || document.body.classList.contains('is-apk')) {
            doc.classList.add('is-capacitor');
            if (isAndroid) {
                doc.classList.add('is-android-apk');
            }
            console.log('[DeviceAdapter] 检测到Capacitor APK环境, Android=' + isAndroid);
        }
        
        // 检测PWA模式（已添加到主屏幕）
        _isPWA = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                 (window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches) ||
                 (window.navigator.standalone === true); // iOS Safari特有属性
        
        if (_isPWA) {
            doc.classList.add('is-pwa');
            doc.classList.remove('is-browser');
        } else {
            doc.classList.add('is-browser');
            doc.classList.remove('is-pwa');
        }
        
        console.log('[DeviceAdapter] 环境检测: iOS=' + _isIOS + ', PWA=' + _isPWA);
    }

    // ==========================================
    // 2. 安全区域测量 — 恢复真实探测
    // ==========================================
    // [FIX-2026-04-06] viewport-fit=cover存在时，env(safe-area-inset-*)有真实值
    // 必须正确探测，否则JS和CSS的safe-area策略会冲突
    function measureSafeAreas() {
        var doc = document.documentElement;
        
        // 使用探测元素读取CSS env()的真实值
        var probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;' +
            'padding-top:env(safe-area-inset-top,0px);' +
            'padding-bottom:env(safe-area-inset-bottom,0px);' +
            'padding-left:env(safe-area-inset-left,0px);' +
            'padding-right:env(safe-area-inset-right,0px);' +
            'visibility:hidden;pointer-events:none;z-index:-9999;';
        document.body.appendChild(probe);
        
        var cs = getComputedStyle(probe);
        _safeTop = parseInt(cs.paddingTop) || 0;
        _safeBottom = parseInt(cs.paddingBottom) || 0;
        _safeLeft = parseInt(cs.paddingLeft) || 0;
        _safeRight = parseInt(cs.paddingRight) || 0;
        
        document.body.removeChild(probe);
        
        doc.style.setProperty('--safe-top', _safeTop + 'px');
        doc.style.setProperty('--safe-bottom', _safeBottom + 'px');
        doc.style.setProperty('--safe-left', _safeLeft + 'px');
        doc.style.setProperty('--safe-right', _safeRight + 'px');
        
        console.log('[DeviceAdapter] safe-area: top=' + _safeTop + ' bottom=' + _safeBottom);
    }

    // ==========================================
    // 3. 视口高度 — 设置CSS变量
    // ==========================================
    function updateViewportHeight() {
        var h = window.innerHeight;
        // 非键盘状态下记录完整高度
        if (!_isKeyboardOpen) {
            _fullViewportHeight = h;
        }
        var doc = document.documentElement;
        doc.style.setProperty('--app-height', _fullViewportHeight + 'px');
        doc.style.setProperty('--vh', (_fullViewportHeight * 0.01) + 'px');
        doc.style.setProperty('--viewport-height', h + 'px');
        // [FIX-iOS飞天-v9] 非键盘状态下同步 --vv-height（iOS CSS 依赖此变量）
        if (!_isKeyboardOpen) {
            doc.style.setProperty('--vv-height', _fullViewportHeight + 'px');
            doc.style.setProperty('--vv-offset-top', '0px');
        }
    }

    // ==========================================
    // 4. 应用安全区域到页面元素
    // ==========================================
    // [FIX-2026-04-06] 恢复safe-area应用逻辑
    // viewport-fit=cover时需要正确处理safe-area
    function applySafeAreas() {
        // CSS env() 已经在样式表中处理了大部分safe-area适配
        // 这里只需要确保JS变量和CSS变量同步
        var doc = document.documentElement;
        doc.style.setProperty('--safe-top', _safeTop + 'px');
        doc.style.setProperty('--safe-bottom', _safeBottom + 'px');
    }

    // ==========================================
    // 5. 页面高度设置（仅在无键盘时）
    // ==========================================
    // [FIX-2026-04-06] 关键修复：
    // viewport-fit=cover模式下，window.innerHeight 包含了safe-area区域
    // 这就是正确的全屏高度，body/device/layer应该使用这个高度
    // CSS的env(safe-area-inset-top)会让nav-bar的padding-top增加，
    // 但这是在容器内部的padding，不会增加容器总高度
    // 所以直接用innerHeight是正确的
    function fixPageHeights() {
        document.body.style.height = _fullViewportHeight + 'px';
        document.body.style.position = 'fixed';
        document.body.style.overflow = 'hidden';
        document.body.style.width = '100%';
        document.body.style.top = '0';
        document.body.style.left = '0';
        
        var device = document.getElementById('device');
        if (device) {
            device.style.height = _fullViewportHeight + 'px';
            device.style.width = '100%';
            device.style.position = 'relative';
            device.style.overflow = 'hidden';
        }
        
        // [FIX-界面分裂v4] 不再对layer设置内联height，让CSS var(--app-height) 接管
        // 之前这里强制设置 el.style.height = _fullViewportHeight + 'px'，
        // 在键盘动画期间可能用错误值覆盖，导致界面分裂
        // 现在只在键盘未打开时清除可能残留的内联height
        document.querySelectorAll('.layer').forEach(function(el) {
            if (!_isKeyboardOpen && !el.classList.contains('offline-generating')) {
                el.style.height = '';
            }
        });
        
        var desktop = document.getElementById('desktop');
        if (desktop) {
            desktop.style.minHeight = _fullViewportHeight + 'px';
        }
        
        document.body.style.overscrollBehavior = 'none';
        if (device) device.style.overscrollBehavior = 'none';
    }

    // ==========================================
    // 6. ★ 键盘处理 — 极简方案 ★
    // ==========================================
    //
    // 核心思路:
    //   键盘弹出时:
    //     1. 检测到键盘 → 设置 keyboard-active class
    //     2. 隐藏底部导航栏
    //     3. 让当前聊天layer高度 = visualViewport.height
    //        这样 flex 布局自然会把输入栏推到可见区域底部
    //     4. 滚动聊天记录到底部
    //   键盘收起时:
    //     1. 移除 keyboard-active class
    //     2. 恢复底部导航栏
    //     3. 恢复layer高度
    //
    // 不做的事情:
    //   - 不用 position:fixed 定位输入栏
    //   - 不手动设置输入栏的 bottom/transform
    //   - 不添加任何遮罩层
    //   - 不轮询检测键盘
    // ==========================================

    var _maxVVHeight = 0; // visualViewport 最大高度（无键盘时）
    var _rafId = null;

    // [FIX-线下跳B1-v7] 全局保存线下模式 scrollTop 快照。
    // 必须在 resize 事件处理器的同步阶段保存，因为 rAF 回调时 iOS 可能已经完成 re-layout。
    var _offlineScrollSnapshot = 0;

    function setupKeyboard() {
        var vv = window.visualViewport;
        if (!vv) {
            // 没有 visualViewport API，使用 focusin/focusout 基础方案
            setupFallbackKeyboard();
            return;
        }

        _maxVVHeight = vv.height;

        function onViewportChange() {
            // [FIX-线下跳B1-v7] 在 rAF 之前（resize 事件同步阶段）立即保存 scrollTop。
            // iOS Safari 在 visualViewport resize 后的下一帧会 re-layout position:fixed 的 layer，
            // 导致 rAF 内读到的 scrollTop 可能已经被浏览器重置为 0。
            var _offSCSync = document.querySelector('#layer-offline-mode.show .offline-scroll-container');
            if (_offSCSync) {
                _offlineScrollSnapshot = _offSCSync.scrollTop;
            }

            // [FIX-键盘贴合-v5] ★ 同步阶段只更新 --vv-offset-top ★
            // iOS Safari 键盘弹出时会推页面（offsetTop变化），必须同步更新位置。
            // 但 --vv-height 不能逐帧同步更新！因为键盘弹出动画期间（~300ms）
            // visualViewport.height 每帧都在变，逐帧更新 layer height 会造成"屏幕震动"。
            // --vv-height 只在键盘状态切换时一次性设置（见 onKeyboardOpen/onKeyboardClose）。
            var _syncOffsetTop = vv.offsetTop || 0;
            document.documentElement.style.setProperty('--vv-offset-top', _syncOffsetTop + 'px');

            if (_rafId) return;
            _rafId = requestAnimationFrame(function() {
                _rafId = null;
                
                var currentH = vv.height;
                // [FIX-界面分裂v2] 更新最大高度（无键盘时的高度）
                // 增加衰减逻辑：如果当前高度接近_maxVVHeight（差值<100），更新为当前值
                // 防止旋转/多任务切换后_maxVVHeight被错误撑大，导致diff永远>100
                if (currentH > _maxVVHeight) {
                    _maxVVHeight = currentH;
                } else if (!_isKeyboardOpen && currentH > 0 && (_maxVVHeight - currentH) < 100) {
                    // 非键盘状态下，viewport微小变化时同步更新（如地址栏显隐）
                    _maxVVHeight = currentH;
                }
                
                var diff = _maxVVHeight - currentH;
                var keyboardOpen = diff > 100;
                var wasOpen = _isKeyboardOpen;
                
                _isKeyboardOpen = keyboardOpen;
                _kbHeight = keyboardOpen ? diff : 0;
                
                // 设置CSS变量（rAF 内再精确校正一次，确保 _maxVVHeight 更新后的值准确）
                document.documentElement.style.setProperty('--keyboard-height', _kbHeight + 'px');
                
                if (keyboardOpen && !wasOpen) {
                    onKeyboardOpen(currentH);
                } else if (!keyboardOpen && wasOpen) {
                    onKeyboardClose();
                } else if (keyboardOpen) {
                    // 键盘高度变化（如切换输入法）
                    onKeyboardResize(currentH);
                }
            });
        }

        vv.addEventListener('resize', onViewportChange);
        // scroll 事件也要监听（iOS在键盘弹出时会触发scroll而非resize）
        vv.addEventListener('scroll', function() {
            // [FIX-键盘贴合-v5] scroll 事件只同步更新 --vv-offset-top（位置补偿）
            // 不更新 --vv-height，避免键盘动画期间逐帧改高度导致震动
            var _scrollOffTop = vv.offsetTop || 0;
            document.documentElement.style.setProperty('--vv-offset-top', _scrollOffTop + 'px');
            if (_isKeyboardOpen) {
                // 确保layer位置正确
                adjustLayerForKeyboard(vv.height);
            }
        });
    }

    /**
     * 键盘弹出
     */
    function onKeyboardOpen(visibleHeight) {
        // [FIX-线下打字跳顶v4] 检测当前聚焦的是否是线下模式输入框
        var _activeEl = document.activeElement;
        var _isOfflineInput = _activeEl && (
            _activeEl.id === 'offline-chat-input' ||
            (_activeEl.closest && _activeEl.closest('#layer-offline-mode .offline-input-bar'))
        );
        // [FIX-线下打字跳顶v4] 同时检测线下编辑弹窗内的 textarea
        var _isOfflineEditInput = _activeEl && (
            _activeEl.classList.contains('offline-edit-modal-textarea') ||
            (_activeEl.closest && _activeEl.closest('.offline-edit-modal'))
        );
        var _isAnyOfflineInput = _isOfflineInput || _isOfflineEditInput;

        // [FIX-线下跳B1-v7] 使用在 resize 事件同步阶段保存的 scrollTop 快照。
        // rAF 内（即此处）读取的 scrollTop 可能已被 iOS Safari re-layout 重置为 0。
        // _offlineScrollSnapshot 在 onViewportChange 的同步阶段已更新。
        var _offSC = document.querySelector('#layer-offline-mode.show .offline-scroll-container');
        var _savedOffScroll = _offSC ? Math.max(_offSC.scrollTop, _offlineScrollSnapshot) : 0;

        // [FIX-iOS键盘-v8] 移除 keyboard-closing class（如果上次收键盘的过渡还在进行中）
        document.documentElement.classList.remove('keyboard-closing');
        document.documentElement.classList.add('keyboard-active');

        // [FIX-键盘贴合-v5] ★ 一次性设置 --vv-height ★
        // 键盘动画完成后的稳定高度。动画期间不逐帧更新，避免屏幕震动。
        document.documentElement.style.setProperty('--vv-height', visibleHeight + 'px');

        // [FIX-iOS键盘透底-v8] 不再用 visibility:hidden 隐藏底层 layer（会导致白色闪烁）。
        // 当前 layer 始终保持 position:fixed + inset:0 全屏覆盖，底层 layer 自然被遮住。
        // 仅设置 data-kb-hidden 标记用于 CSS z-index 降级（不做可见性切换）。
        if (_isIOS) {
            var _focusLayer = _activeEl ? (_activeEl.closest ? _activeEl.closest('.layer.show') : null) : null;
            document.querySelectorAll('.layer.show').forEach(function(l) {
                if (l !== _focusLayer) {
                    l.dataset.kbHidden = '1';
                }
            });
        }

        // [FIX-iOS键盘-v8] 不再调用 window.scrollTo(0, 0)
        // 这会触发强制同步布局（forced reflow），在键盘弹出动画期间造成明显卡顿。
        // CSS 已通过 html.is-ios.keyboard-active { overflow:hidden; position:fixed; } 锁定页面。
        
        // 隐藏底部导航栏（使用class切换，配合CSS保护规则的:not(.keyboard-open)选择器）
        var bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.classList.add('keyboard-open');
            bottomNav.style.display = 'none';
        }

        // [FIX-iOS] 隐藏微信底部tab栏（微信/发现/我/精灵），防止iOS上键盘弹出时tab栏显示在键盘上方
        var wxTabBar = document.querySelector('.wx-tab-bar');
        if (wxTabBar) {
            wxTabBar.style.display = 'none';
        }

        adjustLayerForKeyboard(visibleHeight);
        
        if (_offSC) {
            // [FIX-线下跳B1-v11] 简化恢复逻辑。v11 CSS 方案让 layer 保持 top:0;bottom:0 全屏，
            // 用 padding-top/padding-bottom 补偿偏移和键盘空间，scroll container 尺寸稳定，
            // 不再需要 v7~v10 的 6个setTimeout + ResizeObserver + vv.scroll 极端恢复策略。
            _offSC.style.setProperty('overflow-anchor', 'none');
            var _restoreOfflineScroll = function() {
                if (!_offSC || !_isKeyboardOpen) return;
                var _atBottom = (_offSC.scrollHeight - _savedOffScroll - _offSC.clientHeight) < 100;
                if (_atBottom) {
                    _offSC.scrollTop = _offSC.scrollHeight;
                } else {
                    _offSC.scrollTop = _savedOffScroll;
                }
            };
            // 立即 + rAF + 安全网 setTimeout 恢复（3层足够）
            _restoreOfflineScroll();
            requestAnimationFrame(_restoreOfflineScroll);
            setTimeout(_restoreOfflineScroll, 300);
        } else {
            // 非线下模式：延迟一帧再滚动，确保布局已更新
            requestAnimationFrame(function() {
                scrollChatToBottom();
            });
        }
        
        // [FIX-APK键盘遮挡-v8] 用 requestIdleCallback 代替 setTimeout(500)，
        // 不阻塞键盘弹出动画帧。无 requestIdleCallback 的环境降级为 setTimeout。
        var _checkInputVisibility = function() {
            if (!_isKeyboardOpen) return;
            var active = document.activeElement;
            if (!active) return;
            var isOffInput = active.id === 'offline-chat-input' ||
                (active.closest && active.closest('#layer-offline-mode .offline-input-bar'));
            var isOffEditInput = active.classList.contains('offline-edit-modal-textarea') ||
                (active.closest && active.closest('.offline-edit-modal'));
            if (!isOffInput && !isOffEditInput && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
                var rect = active.getBoundingClientRect();
                var vvHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                if (rect.bottom > vvHeight || rect.top < 0) {
                    active.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }
            }
        };
        if (window.requestIdleCallback) {
            requestIdleCallback(_checkInputVisibility, { timeout: 600 });
        } else {
            setTimeout(_checkInputVisibility, 500);
        }
    }

    /**
     * 键盘收起
     */
    function onKeyboardClose() {
        var docEl = document.documentElement;
        docEl.classList.remove('keyboard-active');

        // [FIX-iOS键盘透底-v8] 恢复被标记的 layer（仅清除 data 属性）
        document.querySelectorAll('.layer[data-kb-hidden="1"]').forEach(function(l) {
            delete l.dataset.kbHidden;
        });
        
        var _anyLayerShow = !!document.querySelector('.layer.show');
        
        var bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.classList.remove('keyboard-open');
            bottomNav.style.display = _anyLayerShow ? 'none' : '';
        }
        
        var wxTabBar = document.querySelector('.wx-tab-bar');
        if (wxTabBar) {
            wxTabBar.style.display = _anyLayerShow ? 'none' : '';
        }
        
        if (document.body) {
            document.body.classList.toggle('layer-open', _anyLayerShow);
        }
        
        // [FIX-iOS键盘-v8] 先立即设置 --keyboard-height:0 和 keyboard-closing class，
        // CSS 的 transition:padding-bottom 0.15s 会平滑过渡。
        // 然后在过渡结束后（150ms）做一次性的 layout 恢复。
        docEl.style.setProperty('--keyboard-height', '0px');
        // [FIX-iOS飞天-v9] 清理 iOS 键盘偏移补偿变量
        docEl.style.setProperty('--vv-offset-top', '0px');
        docEl.style.setProperty('--vv-height', _fullViewportHeight + 'px');
        docEl.classList.add('keyboard-closing');
        
        // [FIX-iOS键盘-v8] 合并两个 setTimeout(250) 为一个，减少回调开销
        // 150ms 与 CSS 的 padding-bottom 过渡时长对齐
        setTimeout(function() {
            docEl.classList.remove('keyboard-closing');
            if (!_isKeyboardOpen) {
                if (window.visualViewport) {
                    _maxVVHeight = Math.max(_maxVVHeight, window.visualViewport.height);
                }
                restoreLayerHeights();
                updateViewportHeight();
                fixPageHeights();
                
                // [FIX-桌面回B1-v1] 键盘关闭后恢复桌面 swipe wrapper 到当前页位置。
                // iOS Safari 键盘弹出时 html/body 变 position:fixed，
                // 会导致 desktop-swipe-wrapper 的 transform 在重排中丢失/重置为初始状态。
                var _dswKb = document.getElementById('desktop-swipe-wrapper');
                if (_dswKb) {
                    var _pg = parseInt(_dswKb.dataset.page) || 0;
                    _dswKb.style.transition = 'none';
                    _dswKb.style.transform = 'translate3d(-' + (_pg * 50) + '%, 0, 0)';
                    // 下一帧恢复 transition
                    requestAnimationFrame(function() {
                        if (_dswKb) _dswKb.style.transition = '';
                    });
                }
            }
        }, 180);
    }

    /**
     * 键盘高度变化
     */
    function onKeyboardResize(visibleHeight) {
        // [FIX-键盘贴合-v5] 切换输入法等稳定的键盘高度变化，一次性更新 --vv-height
        document.documentElement.style.setProperty('--vv-height', visibleHeight + 'px');

        // [FIX-线下打字跳顶v4] 切换输入法等键盘高度变化时，也保存/恢复 offline scrollTop
        var _offSC2 = document.querySelector('#layer-offline-mode.show .offline-scroll-container');
        var _savedScroll2 = _offSC2 ? _offSC2.scrollTop : 0;
        
        adjustLayerForKeyboard(visibleHeight);
        
        // 恢复 scrollTop
        if (_offSC2 && _savedScroll2 > 0) {
            _offSC2.scrollTop = _savedScroll2;
            requestAnimationFrame(function() {
                if (_offSC2) _offSC2.scrollTop = _savedScroll2;
            });
        }
    }

    /**
     * ★ 核心: 调整聊天layer高度为可见视口高度
     * 
     * 原理: layer是flex column布局:
     *   nav-bar (固定高度)
     *   chat-history (flex:1, 自动填满)
     *   input-bar (固定高度)
     *   toolbar (固定高度)
     * 
     * 当layer高度 = visualViewport.height 时，
     * 输入栏自然就在键盘正上方，不需要任何position:fixed的hack
     */
    function adjustLayerForKeyboard(visibleHeight) {
        // [FIX-键盘贴合-v5] 此函数仅更新 --vv-offset-top（位置补偿）和 --keyboard-height。
        // ★ 不更新 --vv-height ★ — 高度只在 onKeyboardOpen/onKeyboardResize 中一次性设置，
        // 避免键盘动画期间逐帧改 layer height 造成"屏幕震动"。
        var vv = window.visualViewport;
        if (!vv) return;
        
        // [FIX-线下飞天-v12] 在更新 CSS 变量之前同步保存线下 scrollTop。
        var _offSCAdjust = document.querySelector('#layer-offline-mode.show .offline-scroll-container');
        var _savedScrollAdjust = _offSCAdjust ? Math.max(_offSCAdjust.scrollTop, _offlineScrollSnapshot) : 0;
        
        var doc = document.documentElement;
        
        // 只更新位置偏移（iOS Safari 推页面补偿），不更新高度
        var offsetTop = vv.offsetTop || 0;
        doc.style.setProperty('--vv-offset-top', offsetTop + 'px');
        
        // 更新精确的键盘高度
        var preciseKbHeight = _fullViewportHeight - visibleHeight;
        if (preciseKbHeight > 50) {
            doc.style.setProperty('--keyboard-height', preciseKbHeight + 'px');
        }
        
        // [FIX-线下飞天-v12] CSS 变量更新后立即同步恢复 scrollTop + rAF 二次兜底。
        // top+height 方案下 scroll container 高度会变化，scrollTop 可能被 clamp。
        if (_offSCAdjust && _savedScrollAdjust > 0) {
            _offSCAdjust.scrollTop = _savedScrollAdjust;
            requestAnimationFrame(function() {
                if (_offSCAdjust && _isKeyboardOpen) {
                    var _atBot = (_offSCAdjust.scrollHeight - _savedScrollAdjust - _offSCAdjust.clientHeight) < 100;
                    _offSCAdjust.scrollTop = _atBot ? _offSCAdjust.scrollHeight : _savedScrollAdjust;
                }
            });
        }
    }

    /**
     * 恢复layer高度
     * [FIX-收键盘卡顿-2026-05-12-v2] 加入防重入+rAF机制：
     * 多次快速调用只会在下一帧执行一次，避免键盘收起时4次DOM遍历+重排
     */
    var _restorePending = false;
    function restoreLayerHeights() {
        if (_restorePending) return;
        _restorePending = true;
        requestAnimationFrame(function() {
            _restorePending = false;
            _doRestoreLayerHeights();
        });
    }
    function _doRestoreLayerHeights() {
        var currentHeight = window.innerHeight;
        if (currentHeight > 0 && !_isKeyboardOpen) {
            _fullViewportHeight = currentHeight;
            var doc = document.documentElement;
            doc.style.setProperty('--app-height', _fullViewportHeight + 'px');
            doc.style.setProperty('--vh', (_fullViewportHeight * 0.01) + 'px');
            doc.style.setProperty('--viewport-height', currentHeight + 'px');
        }

        // [FIX-iOS飞天-v9] 清除键盘状态的 CSS 变量，恢复 layer 全屏
        var doc2 = document.documentElement;
        doc2.style.setProperty('--vv-offset-top', '0px');
        doc2.style.setProperty('--vv-height', _fullViewportHeight + 'px');
        // --keyboard-height 在 onKeyboardClose 中已置 0

        // 清除输入栏残留内联样式
        var chatInputBar = document.getElementById('chat-input-bar');
        if (chatInputBar) {
            chatInputBar.style.cssText = 'flex-shrink:0;';
        }
        var chatHistory = document.getElementById('chat-history');
        if (chatHistory) {
            chatHistory.style.marginBottom = '';
        }
        var smartBar = document.getElementById('smart-reply-bar');
        if (smartBar) {
            smartBar.style.position = '';
            smartBar.style.bottom = '';
            smartBar.style.left = '';
            smartBar.style.right = '';
            smartBar.style.zIndex = '';
        }
        
        var offLayer = document.getElementById('layer-offline-mode');
        if (offLayer) {
            var offInputBar = offLayer.querySelector('.offline-input-bar');
            if (offInputBar) {
                offInputBar.style.cssText = '';
            }
            var scrollContainer = offLayer.querySelector('.offline-scroll-container');
            if (scrollContainer) {
                scrollContainer.style.marginBottom = '';
                // [FIX-线下跳B1-v11] 清除键盘期间设置的 overflow-anchor:none
                scrollContainer.style.overflowAnchor = '';
            }
        }
    }

    /**
     * 滚动聊天记录到底部
     */
    function scrollChatToBottom() {
        var chatHistory = document.getElementById('chat-history');
        if (chatHistory) {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
        // 也处理线下聊天
        var offlineHistory = document.getElementById('offline-chat-history');
        if (offlineHistory) {
            var container = offlineHistory.closest('.offline-scroll-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }

    /**
     * 回退方案: 无 visualViewport API 时使用 focusin/focusout
     */
    function setupFallbackKeyboard() {
        document.addEventListener('focusin', function(e) {
            var tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
                _isKeyboardOpen = true;
                var docEl = document.documentElement;
                docEl.classList.remove('keyboard-closing');
                docEl.classList.add('keyboard-active');
                var bottomNav = document.querySelector('.bottom-nav');
                if (bottomNav) { bottomNav.classList.add('keyboard-open'); bottomNav.style.display = 'none'; }
                // [FIX-iOS] 隐藏微信底部tab栏
                var wxTabBar = document.querySelector('.wx-tab-bar');
                if (wxTabBar) wxTabBar.style.display = 'none';
                
                // [FIX-fallback键盘v8] 无 visualViewport 时也调整 layer 高度
                var _fbOffSC = document.querySelector('#layer-offline-mode.show .offline-scroll-container');
                var _fbSavedScroll = _fbOffSC ? _fbOffSC.scrollTop : 0;
                setTimeout(function() {
                    var visibleH = window.innerHeight;
                    // [FIX-iOS键盘-v8] 用 --keyboard-height 驱动 CSS padding-bottom
                    var kbH = _fullViewportHeight - visibleH;
                    if (kbH > 100) {
                        docEl.style.setProperty('--keyboard-height', kbH + 'px');
                        // [FIX-iOS飞天-v9] fallback 模式也设置 --vv-height
                        docEl.style.setProperty('--vv-height', visibleH + 'px');
                        docEl.style.setProperty('--vv-offset-top', '0px');
                    }
                    var isOfflineInput = e.target.id === 'offline-chat-input' || (e.target.closest && e.target.closest('#layer-offline-mode .offline-input-bar'));
                    var isOffEditInput = e.target.classList.contains('offline-edit-modal-textarea') || (e.target.closest && e.target.closest('.offline-edit-modal'));
                    if (!isOfflineInput && !isOffEditInput) {
                        e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                    if ((isOfflineInput || isOffEditInput) && _fbOffSC) {
                        var _fbRestore = function() {
                            if (!_fbOffSC || !_isKeyboardOpen) return;
                            var _atBot = (_fbOffSC.scrollHeight - _fbSavedScroll - _fbOffSC.clientHeight) < 100;
                            _fbOffSC.scrollTop = _atBot ? _fbOffSC.scrollHeight : _fbSavedScroll;
                        };
                        _fbRestore();
                        setTimeout(_fbRestore, 120);
                        setTimeout(_fbRestore, 300);
                    }
                }, 400);
            }
        });
        
        document.addEventListener('focusout', function(e) {
            var tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
                setTimeout(function() {
                    var active = document.activeElement;
                    var stillEditing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
                    if (!stillEditing) {
                        _isKeyboardOpen = false;
                        var docEl = document.documentElement;
                        docEl.classList.remove('keyboard-active');
                        docEl.style.setProperty('--keyboard-height', '0px');
                        // [FIX-iOS飞天-v9] fallback 关闭时也清理 iOS 键盘变量
                        docEl.style.setProperty('--vv-offset-top', '0px');
                        docEl.style.setProperty('--vv-height', _fullViewportHeight + 'px');
                        var _hasLayer2 = !!document.querySelector('.layer.show');
                        var bottomNav = document.querySelector('.bottom-nav');
                        if (bottomNav) { bottomNav.classList.remove('keyboard-open'); if (!_hasLayer2) bottomNav.style.display = ''; }
                        var wxTabBar = document.querySelector('.wx-tab-bar');
                        if (wxTabBar) wxTabBar.style.display = _hasLayer2 ? 'none' : '';
                        // [FIX-iOS键盘-v8] 统一 keyboard-closing 过渡
                        docEl.classList.add('keyboard-closing');
                        setTimeout(function() {
                            docEl.classList.remove('keyboard-closing');
                            if (!_isKeyboardOpen) {
                                restoreLayerHeights();
                                updateViewportHeight();
                                fixPageHeights();
                            }
                        }, 180);
                    }
                }, 200);
            }
        });
    }

    // ==========================================
    // 7. 输入框焦点辅助
    // ==========================================
    function setupInputFocus() {
        // [FIX-线下跳B1-v7] 在 focusin 时（键盘弹出之前）保存线下模式 scrollTop。
        // 这是最可靠的保存时机：此时 iOS Safari 还没开始 re-layout，scrollTop 值是准确的。
        document.addEventListener('focusin', function(e) {
            var tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
                var _offSCFocusin = document.querySelector('#layer-offline-mode.show .offline-scroll-container');
                if (_offSCFocusin) {
                    _offlineScrollSnapshot = _offSCFocusin.scrollTop;
                }
            }
        }, true); // capture phase，确保最早执行

        // 点击非输入区域收起键盘
        document.addEventListener('touchstart', function(e) {
            if (!_isKeyboardOpen) return;
            var tag = e.target.tagName;
            var isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
            // 不是输入元素，也不是输入栏内的按钮
            // [FIX-编辑区点不动] 增加 .inline-edit-wrap 白名单，防止内联编辑区内的操作被误收键盘
            if (!isEditable && !e.target.closest('.input-bar') && !e.target.closest('.toolbar') && !e.target.closest('.btn-send') && !e.target.closest('.btn-act') && !e.target.closest('.offline-input-bar') && !e.target.closest('.inline-edit-wrap')) {
                var active = document.activeElement;
                if (active && active !== document.body) {
                    active.blur();
                }
            }
        }, { passive: true });

        // [FIX-性能v3] 安全网改为按需启动：只在键盘打开时启动定时器，关闭后清除
        // 之前的 setInterval 每1.5秒无条件运行，即使无键盘也在空转消耗CPU
        var _safetyNetTimer = null;
        
        function _startKeyboardSafetyNet() {
            if (_safetyNetTimer) return;
            _safetyNetTimer = setInterval(function() {
                if (_isKeyboardOpen) {
                    var active = document.activeElement;
                    var isEditing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
                    if (!isEditing) {
                        // 没有在编辑，但状态还是打开的，重置
                        _isKeyboardOpen = false;
                        _kbHeight = 0;
                        var docEl = document.documentElement;
                        docEl.classList.remove('keyboard-active');
                        docEl.style.setProperty('--keyboard-height', '0px');
                        // [FIX-iOS飞天-v9] 安全网清理 iOS 键盘变量
                        docEl.style.setProperty('--vv-offset-top', '0px');
                        docEl.style.setProperty('--vv-height', _fullViewportHeight + 'px');
                        var _hasLayer3 = !!document.querySelector('.layer.show');
                        var bottomNav = document.querySelector('.bottom-nav');
                        if (bottomNav) { bottomNav.classList.remove('keyboard-open'); if (!_hasLayer3) bottomNav.style.display = ''; }
                        var wxTabBar = document.querySelector('.wx-tab-bar');
                        if (wxTabBar) wxTabBar.style.display = _hasLayer3 ? 'none' : '';
                        // [FIX-iOS键盘-v8] 统一 keyboard-closing 过渡
                        docEl.classList.add('keyboard-closing');
                        setTimeout(function() {
                            docEl.classList.remove('keyboard-closing');
                            restoreLayerHeights();
                            updateViewportHeight();
                        }, 180);
                        _stopKeyboardSafetyNet();
                    }
                } else {
                    // 键盘已关闭，停止安全网
                    _stopKeyboardSafetyNet();
                }
            }, 1500);
        }
        
        function _stopKeyboardSafetyNet() {
            if (_safetyNetTimer) {
                clearInterval(_safetyNetTimer);
                _safetyNetTimer = null;
            }
        }
        
        // 监听键盘状态变化来启动/停止安全网
        document.addEventListener('focusin', function(e) {
            var tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
                _startKeyboardSafetyNet();
            }
        });
        document.addEventListener('focusout', function() {
            // 延迟停止，给键盘关闭动画时间
            setTimeout(function() {
                if (!_isKeyboardOpen) _stopKeyboardSafetyNet();
            }, 2000);
        });
    }

    // ==========================================
    // 8. MutationObserver — 动态元素适配
    // ==========================================
    function setupMutationObserver() {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(m) {
                if (m.type === 'childList' && m.addedNodes.length > 0) {
                    for (var i = 0; i < m.addedNodes.length; i++) {
                        var node = m.addedNodes[i];
                        if (node.nodeType === 1) {
                            // [FIX-界面分裂v4] 新增layer时清除内联height，让CSS接管
                            if (node.classList && node.classList.contains('layer')) {
                                if (!_isKeyboardOpen) {
                                    node.style.height = '';
                                }
                            }
                        }
                    }
                }
                if (m.type === 'attributes' && m.attributeName === 'class') {
                    var target = m.target;
                    if (target.classList && target.classList.contains('layer') && target.classList.contains('show')) {
                        if (!_isKeyboardOpen) {
                            // [FIX-界面分裂v4] 清除内联height，让CSS接管
                            target.style.height = '';
                            // [FIX-iOS Chrome偏移] layer获得show class时，如果非键盘状态，
                            // 强制清除可能残留的键盘适配内联样式（position:fixed, top, left等）
                            // 这是iOS Chrome上最常见的偏移原因：之前的键盘事件没有正确清理
                            if (target.style.position === 'fixed') {
                                target.style.position = '';
                                target.style.top = '';
                                target.style.left = '';
                                target.style.right = '';
                                target.style.bottom = '';
                            }
                            if (target.hasAttribute('data-kb-zindex')) {
                                target.style.zIndex = target.getAttribute('data-kb-zindex');
                                target.removeAttribute('data-kb-zindex');
                            }
                        }
                    }
                }
            });
        });
        
        // [FIX-性能v3] 缩小 MutationObserver 监听范围
        // 之前监听 document.body 的 subtree:true，所有DOM变动都会触发回调
        // 改为只监听 #device 容器（所有 layer 都在其中），大幅减少无关回调
        var observeTarget = document.getElementById('device') || document.body;
        observer.observe(observeTarget, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // ==========================================
    // 9. 初始化
    // ==========================================
    function init() {
        console.log('[DeviceAdapter] v3.1 初始化...');
        
        // [FIX-2026-04-06] 首先检测环境，添加is-pwa/is-browser class
        detectEnvironment();
        
        measureSafeAreas();
        updateViewportHeight();
        applySafeAreas();
        fixPageHeights();
        setupKeyboard();
        setupInputFocus();
        setupMutationObserver();
        
        // resize事件（非键盘时更新视口）
        window.addEventListener('resize', function() {
            if (!_isKeyboardOpen) {
                updateViewportHeight();
                fixPageHeights();
            }
        });
        
        // 屏幕旋转
        window.addEventListener('orientationchange', function() {
            setTimeout(function() {
                if (window.visualViewport) {
                    _maxVVHeight = window.visualViewport.height;
                }
                _isKeyboardOpen = false;
                _kbHeight = 0;
                document.documentElement.classList.remove('keyboard-active');
                document.documentElement.style.setProperty('--keyboard-height', '0px');
                updateViewportHeight();
                measureSafeAreas();
                applySafeAreas();
                fixPageHeights();
            }, 500);
        });
        
        // 延迟再次测量
        setTimeout(function() {
            measureSafeAreas();
            applySafeAreas();
            updateViewportHeight();
            fixPageHeights();
            if (window.visualViewport) {
                _maxVVHeight = Math.max(_maxVVHeight, window.visualViewport.height);
            }
        }, 500);
        
        // PWA standalone模式
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            setTimeout(function() {
                _fullViewportHeight = window.innerHeight;
                updateViewportHeight();
                fixPageHeights();
                measureSafeAreas();
                applySafeAreas();
            }, 1000);
        }
        
        // ★ [FIX-iOS滑动退出-v2] iOS Safari 左右边缘滑动会触发浏览器历史导航（后退/前进）
        // v2: 加强防护 — 更宽的边缘区域、CSS级别阻止、减少iOS卡顿
        // 仅在iOS上启用，不影响Android
        (function initIOSSwipeGuard() {
            var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            if (!isIOS) return;
            
            // ★ [FIX-iOS卡顿] 添加iOS专用CSS优化，减少卡顿
            var iosStyle = document.createElement('style');
            var iosCssRules = [
                // 禁止整个页面的overscroll弹性效果（防止拉动时"退出"感）
                'html, body { overscroll-behavior: none !important; }',
                // 减少iOS上的触摸延迟
                '* { -webkit-tap-highlight-color: transparent; }',
                // 防止iOS Safari的橡皮筋回弹
                '#device { overscroll-behavior: none !important; overflow: hidden !important; }',
                // 所有layer内容区域优化滚动性能
                '.layer { -webkit-overflow-scrolling: touch; overscroll-behavior-x: none !important; }',
                // 聊天历史区域：仅允许垂直滚动，禁止水平滑动触发导航
                '.chat-history { overscroll-behavior-x: none !important; touch-action: pan-y pinch-zoom !important; }',
                // 桌面滑动容器：已有自己的滑动逻辑，不需要浏览器手势
                '#desktop-swipe-container { touch-action: pan-y !important; }',
            ];
            
            // [FIX-iOS Chrome偏移] iOS Chrome特定修复
            // iOS Chrome的WKWebView在viewport变化时可能不正确地缓存layer的渲染位置
            // 导致打开layer时一半在屏幕内一半在屏幕外
            if (_isIOSChrome) {
                iosCssRules.push(
                    // 确保layer.show在非键盘状态下始终使用正确的定位
                    'html:not(.keyboard-active) .layer.show { left: 0 !important; right: auto !important; }',
                    // 地图layer的map-content确保占满容器
                    '#map-content { width: 100% !important; overflow-x: hidden !important; }',
                    // 强制GPU重绘layer，防止iOS Chrome渲染缓存问题
                    '.layer.show { -webkit-transform: translateZ(0); transform: translateZ(0); }'
                );
            }
            
            iosStyle.textContent = iosCssRules.join('\n');
            document.head.appendChild(iosStyle);
            
            var _iosSwipeStartX = 0;
            var _iosSwipeStartY = 0;
            var _iosSwipeDirection = null; // null=未确定, 'h'=水平, 'v'=垂直
            
            document.addEventListener('touchstart', function(e) {
                if (e.touches.length !== 1) return;
                _iosSwipeStartX = e.touches[0].clientX;
                _iosSwipeStartY = e.touches[0].clientY;
                _iosSwipeDirection = null;
            }, { passive: true });
            
            document.addEventListener('touchmove', function(e) {
                if (e.touches.length !== 1 || !e.cancelable) return;
                
                var touch = e.touches[0];
                var dx = touch.clientX - _iosSwipeStartX;
                var dy = touch.clientY - _iosSwipeStartY;
                var absDx = Math.abs(dx);
                var absDy = Math.abs(dy);
                
                // 首次移动时判断方向（降低阈值，更快响应）
                if (_iosSwipeDirection === null && (absDx > 5 || absDy > 5)) {
                    _iosSwipeDirection = absDx > absDy ? 'h' : 'v';
                }
                
                // 仅拦截从屏幕左/右边缘开始的水平滑动（Safari历史导航手势）
                if (_iosSwipeDirection === 'h') {
                    var screenW = window.innerWidth;
                    var edgeZone = 50; // ★ v2: 加宽到50px，iOS手势区域实际可达40-50px
                    var isLeftEdge = _iosSwipeStartX <= edgeZone;
                    var isRightEdge = _iosSwipeStartX >= screenW - edgeZone;
                    
                    if (isLeftEdge || isRightEdge) {
                        // 在app内始终阻止边缘滑动导航（不再检查是否有可见layer）
                        // 因为即使在桌面页面，也不应该触发浏览器后退
                        e.preventDefault();
                    }
                }
            }, { passive: false });
            
            // ★ [FIX-iOS卡顿] 监听gesturestart事件，阻止iOS双指缩放
            document.addEventListener('gesturestart', function(e) {
                e.preventDefault();
            }, { passive: false });
            
            console.log('[DeviceAdapter] iOS Safari 滑动退出防护v2已启用');
        })();
        
        console.log('[DeviceAdapter] v3.2 初始化完成. viewport=' + _fullViewportHeight + 'px, safeTop=' + _safeTop + ', safeBottom=' + _safeBottom + ', PWA=' + _isPWA + ', iOSChrome=' + _isIOSChrome);
    }

    // 暴露API（保持兼容）
    window.DeviceAdapter = {
        refresh: function() {
            detectEnvironment();
            measureSafeAreas();
            updateViewportHeight();
            applySafeAreas();
            fixPageHeights();
        },
        getSafeTop: function() { return _safeTop; },
        getSafeBottom: function() { return _safeBottom; },
        getViewportHeight: function() { return _fullViewportHeight; },
        isKeyboardOpen: function() { return _isKeyboardOpen; },
        getKeyboardHeight: function() { return _kbHeight; },
        isPWA: function() { return _isPWA; },
        isIOS: function() { return _isIOS; },
        isIOSChrome: function() { return _isIOSChrome; },
        // 兼容旧API
        adjustInputBars: function() { /* noop - 新版本不需要手动调整 */ },
        resetInputBars: restoreLayerHeights,
        applySafeAreas: applySafeAreas
    };

    // DOM ready时初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
