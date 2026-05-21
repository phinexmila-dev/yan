/* =====================================================
 * app-beauty-pack.js —— 美化配置包 导入/导出系统
 * -----------------------------------------------------
 * 功能：把 store 里散落的美化数据打包成一个 JSON 文件，
 *       方便美化老师分享，其他用户一键导入即可应用。
 *
 * 包含的美化数据模块（均可选择性导出）：
 *   - customCSS       自定义CSS（气泡/全局/线下模式）
 *   - bubbleStyles    气泡滑条样式
 *   - theme           主题颜色（文字颜色/大小等）
 *   - globalTheme     全局主题ID（default/cute/korean）
 *   - customFont      自定义字体
 *   - fontPresets     字体预设
 *   - compStyles      主界面组件样式
 *   - cssPresets      CSS预设集合
 *   - avatarFrames    头像框
 *   - desktopBg       桌面背景（体积大，默认不导出）
 *   - globalWallpapers 全局壁纸（体积大，默认不导出）
 *
 * 文件格式标识：_type = "YAN_beauty_pack"
 * 文件扩展名：.yan-beauty.json
 * ===================================================== */
(function(){
    'use strict';

    var PACK_TYPE = 'YAN_beauty_pack';
    var PACK_VERSION = 2;
    var MAX_IMPORT_SIZE = 20 * 1024 * 1024; // 20MB 上限

    // ---------- 工具函数 ----------

    function _toast(msg, type) {
        if (typeof window.toast === 'function') window.toast(msg, type || 'info');
        else if (typeof window.showToast === 'function') window.showToast(msg, type || 'info');
        else alert(msg);
    }

    function _getStore() {
        if (typeof window.store !== 'undefined' && window.store) return window.store;
        // 兜底：尝试从 localStorage 还原
        try {
            var raw = localStorage.getItem('YAN_store');
            if (raw) { var parsed = JSON.parse(raw); if (parsed && typeof parsed === 'object') return parsed; }
        } catch(e) {}
        try {
            var raw2 = localStorage.getItem('store');
            if (raw2) { var parsed2 = JSON.parse(raw2); if (parsed2 && typeof parsed2 === 'object') return parsed2; }
        } catch(e2) {}
        return null;
    }

    function _save() {
        if (typeof window.save === 'function') window.save();
    }

    // CSS 安全过滤：防止恶意脚本注入
    function _sanitizeCSS(css) {
        if (typeof css !== 'string') return '';
        return css
            .replace(/javascript\s*:/gi, '/* blocked:js */')
            .replace(/expression\s*\(/gi, '/* blocked:expr */(')
            .replace(/behavior\s*:/gi, '/* blocked:behavior */')
            .replace(/@import\s+url/gi, '/* blocked:@import */')
            .replace(/<\s*script/gi, '/* blocked:<script */')
            .replace(/<\s*\/\s*script/gi, '/* blocked:</script */');
    }

    function _escHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function _fmtBytes(n) {
        if (n == null) return '-';
        if (n < 1024) return n + ' B';
        if (n < 1024*1024) return (n/1024).toFixed(1) + ' KB';
        return (n/1024/1024).toFixed(2) + ' MB';
    }

    function _downloadJSON(obj, filename) {
        var json = JSON.stringify(obj, null, 2);
        var blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        var url = URL.createObjectURL(blob);

        // [FIX-导出无反应] 多重下载策略兜底
        var downloaded = false;

        // 策略1：Capacitor Filesystem（APK 环境）
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) {
            try {
                window.Capacitor.Plugins.Filesystem.writeFile({
                    path: filename, data: json, directory: 'DOCUMENTS', encoding: 'utf8'
                }).then(function(result) {
                    _toast('美化包已保存到 Documents/' + filename + ' ✅', 'success');
                    if (window.Capacitor.Plugins.Share) {
                        window.Capacitor.Plugins.Share.share({ title: filename, url: result.uri, dialogTitle: '分享美化包' }).catch(function(){});
                    }
                }).catch(function() { _showCopyFallback(json, filename); });
                URL.revokeObjectURL(url);
                return;
            } catch(e) { /* fallthrough */ }
        }

        // 策略2：标准 <a download>（PC 浏览器）
        try {
            var a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            // [FIX-导出无反应] 使用 MouseEvent 模拟真实点击，解决部分浏览器安全策略拦截 a.click()
            var evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            downloaded = a.dispatchEvent(evt);
            document.body.removeChild(a);
        } catch(e) {
            downloaded = false;
        }

        // 策略3：如果上述都没效果，回退到复制兜底
        // 某些浏览器 dispatchEvent 返回 true 但实际没下载，用 setTimeout 延迟检测给用户兜底选项
        setTimeout(function(){
            URL.revokeObjectURL(url);
            // 如果是 WebView/移动浏览器，主动弹复制面板作为备选
            var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
            if (isMobile && !window._beautyPackDownloadConfirmed) {
                // 移动端默认也提供复制按钮作为备选
                _showCopyFallback(json, filename);
            }
        }, 1500);
    }

    // [NEW] 兜底方案：显示JSON内容供用户复制保存
    function _showCopyFallback(json, filename) {
        _ensureModalStyle();
        _closeModal('bp-copy-mask');

        var html = '';
        html += '<div id="bp-copy-mask" class="bp-mask" style="z-index:999999;">';
        html +=   '<div class="bp-box">';
        html +=     '<div class="bp-head">';
        html +=       '<div class="bp-title"><i class="fas fa-copy" style="margin-right:6px;color:#07c160;"></i>导出成功</div>';
        html +=       '<div class="bp-close" onclick="document.getElementById(\'bp-copy-mask\').remove()"><i class="fas fa-times"></i></div>';
        html +=     '</div>';
        html +=     '<div class="bp-body">';
        html +=       '<div class="bp-tip">📱 如果没有自动下载，请点击下方按钮复制 JSON 内容，粘贴保存为 <b>' + _escHtml(filename) + '</b></div>';
        html +=       '<textarea id="bp-copy-text" class="bp-textarea" style="min-height:150px;font-family:monospace;font-size:11px;" readonly>' + _escHtml(json) + '</textarea>';
        html +=     '</div>';
        html +=     '<div class="bp-foot">';
        html +=       '<button class="bp-btn bp-btn-ghost" onclick="window._beautyPackDownloadConfirmed=true;document.getElementById(\'bp-copy-mask\').remove()">已下载成功</button>';
        html +=       '<button class="bp-btn bp-btn-primary" onclick="var t=document.getElementById(\'bp-copy-text\');t.select();t.setSelectionRange(0,t.value.length);document.execCommand(\'copy\');if(typeof window.toast===\'function\')window.toast(\'已复制到剪贴板 ✅\',\'success\');else if(typeof window.showToast===\'function\')window.showToast(\'已复制 ✅\',\'success\');else alert(\'已复制\')"><i class="fas fa-copy"></i> 一键复制</button>';
        html +=     '</div>';
        html +=   '</div>';
        html += '</div>';

        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        document.body.appendChild(wrap.firstChild);
    }

    // ---------- 模块定义（导出时展示的选项） ----------

    var MODULES = [
        { key: 'css',       label: '自定义CSS',  desc: '气泡/全局/线下模式CSS代码', icon: 'fa-code', def: true },
        { key: 'bubble',    label: '气泡样式',    desc: '气泡大小/间距/圆角/字体等滑条设置', icon: 'fa-comment-dots', def: true },
        { key: 'theme',     label: '主题配色',    desc: '文字颜色/字号/桌面/日记等主题色', icon: 'fa-palette', def: true },
        { key: 'globalTheme', label: '全局主题预设', desc: '默认/可爱/韩式 三选一', icon: 'fa-swatchbook', def: true },
        { key: 'font',      label: '字体设置',    desc: '自定义字体 + 字体预设列表', icon: 'fa-font', def: true },
        { key: 'comp',      label: '组件样式',    desc: '主界面导航栏/信息卡/专辑卡样式', icon: 'fa-th-large', def: true },
        { key: 'presets',   label: 'CSS预设集合', desc: '你保存的所有气泡/全局/线下CSS预设', icon: 'fa-layer-group', def: false },
        { key: 'frame',     label: '头像框',      desc: '用户/联系人头像框设置', icon: 'fa-id-badge', def: false },
        { key: 'wallpaper', label: '壁纸（体积大）', desc: '桌面背景图 + 全局壁纸（可能很大）', icon: 'fa-image', def: false }
    ];

    // ---------- 收集数据 ----------

    function collectPack(options) {
        var store = _getStore();
        if (!store) throw new Error('store 未初始化');

        var pack = {
            _type: PACK_TYPE,
            _version: PACK_VERSION,
            _name: (options.name || '').trim() || '未命名美化包',
            _author: (options.author || '').trim(),
            _desc: (options.desc || '').trim(),
            _createdAt: new Date().toISOString(),
            _tags: options.tags || []
        };

        if (options.preview) pack._preview = options.preview;

        var m = options.modules || {};

        if (m.css) {
            pack.customCSS = {
                bubble:  (store.customCSS && store.customCSS.bubble)  || '',
                global:  (store.customCSS && store.customCSS.global)  || '',
                offline: (store.customCSS && store.customCSS.offline) || ''
            };
        }
        if (m.bubble)      pack.bubbleStyles = store.bubbleStyles || {};
        if (m.theme)       pack.theme = store.theme || {};
        if (m.globalTheme) pack.globalTheme = store.globalTheme || 'default';
        if (m.font) {
            pack.customFont  = store.customFont  || '';
            pack.fontPresets = store.fontPresets || [];
        }
        if (m.comp)        pack.compStyles = store.compStyles || {};
        if (m.presets)     pack.cssPresets = store.cssPresets || { bubble: {}, global: {}, offline: {} };
        if (m.frame)       pack.avatarFrames = store.avatarFrames || { user: '', contacts: {} };
        if (m.wallpaper) {
            pack.desktopBg = store.desktopBg || '';
            pack.globalWallpapers = store.globalWallpapers || {};
        }

        return pack;
    }

    // ---------- 应用到 store ----------

    function applyPack(pack, modules) {
        var store = _getStore();
        if (!store) { _toast('store 未初始化', 'error'); return false; }

        var applied = [];

        // CSS
        if (modules.css && pack.customCSS) {
            // [FIX-还原不了] 导入美化包前保存当前CSS快照，用于后续"还原到导入前"
            if (!store._cssBackupBeforeImport) store._cssBackupBeforeImport = {};
            store._cssBackupBeforeImport = JSON.parse(JSON.stringify(store.customCSS || {}));
            store._cssBackupBeforeImport._timestamp = Date.now();
            if (!store.customCSS) store.customCSS = {};
            ['bubble', 'global', 'offline'].forEach(function(type){
                if (pack.customCSS[type] !== undefined) {
                    var clean = _sanitizeCSS(pack.customCSS[type]);
                    store.customCSS[type] = clean;

                    // 同步编辑器 textarea
                    var cssEl = document.getElementById('css-' + type);
                    if (cssEl) cssEl.value = clean;

                    // [FIX-iOS美化卡顿-2026-05-12] iOS上剥离GPU重属性
                    var isIOS = document.documentElement.classList.contains('is-ios');
                    // [FIX-iOS气泡透明-2026-05-13] 记录是否有backdrop-filter被剥离
                    var hadBackdropFilter = isIOS && /backdrop-filter\s*:/i.test(clean);
                    if (isIOS) {
                        clean = clean.replace(/[\s;]*-webkit-backdrop-filter\s*:[^;]*;?/gi, ';');
                        clean = clean.replace(/[\s;]*backdrop-filter\s*:[^;]*;?/gi, ';');
                        clean = clean.replace(/;{2,}/g, ';');
                    }
                    // [FIX-iOS气泡透明-2026-05-13] 气泡类型且剥离了backdrop-filter时，注入兜底背景色
                    if (type === 'bubble' && hadBackdropFilter) {
                        clean += '\n/* [iOS-fallback] backdrop-filter已剥离，补充兜底背景 */\n';
                        clean += 'html.is-ios #layer-chat .bubble { background-color: var(--bubble-left, #ffffff) !important; }\n';
                        clean += 'html.is-ios #layer-chat .msg-row.me .bubble { background-color: var(--bubble-right, #95ec69) !important; }\n';
                    }

                    // [FIX-美化包CSS不全] 导入的CSS也需要经过_autoImportant处理
                    // 确保能覆盖主题中的!important规则，与applyCustomCSS()保持一致
                    if (typeof window._autoImportant === 'function') {
                        clean = window._autoImportant(clean);
                    }

                    // 创建/更新 style 标签
                    var styleEl = document.getElementById('custom-style-' + type);
                    if (!styleEl) {
                        styleEl = document.createElement('style');
                        styleEl.id = 'custom-style-' + type;
                    }
                    styleEl.innerHTML = clean;
                    // [FIX-CSS覆盖] 始终appendChild到head末尾，确保最高层叠优先级
                    document.head.appendChild(styleEl);

                    // body 标记 class（参照 app-part2.js 的 applyCustomCSS 逻辑）
                    if (type === 'bubble') {
                        document.body.classList.toggle('has-custom-bubble-css', !!clean.trim());
                    } else if (type === 'global') {
                        document.body.classList.toggle('has-custom-global-css', !!clean.trim());
                    } else if (type === 'offline') {
                        document.body.classList.toggle('has-custom-offline-css', !!clean.trim());
                    }
                }
            });
            // [FIX-美化包冲突] 只禁用 default-theme.css，保留 cute/korean/mono 主题 link
            // 这些主题通过 body.theme-xxx 选择器自动控制生效范围，不会干扰非该主题场景
            // 只有当确实有非空CSS时才禁用，避免空包导入导致主题退化
            var _hasAnyCss = ['bubble','global','offline'].some(function(t){
                return store.customCSS[t] && String(store.customCSS[t]).trim();
            });
            if (_hasAnyCss) {
                var _defLink = document.getElementById('default-theme-link');
                if (_defLink) { _defLink.disabled = true; _defLink.setAttribute('media','not all'); }
            }
            // [FIX-美化包CSS覆盖] 确保自定义style标签在head最末尾 + 保护性CSS
            if (typeof window._moveCustomStylesToEnd === 'function') {
                window._moveCustomStylesToEnd();
            }
            // [FIX-退出重进消失] 同步写入localStorage热备份
            try { localStorage.setItem('YAN_customCSS_backup', JSON.stringify(store.customCSS)); } catch(_e){}
            applied.push('CSS');
        }

        // 气泡样式
        if (modules.bubble && pack.bubbleStyles) {
            store.bubbleStyles = Object.assign({}, store.bubbleStyles || {}, pack.bubbleStyles);
            // 同步滑条 UI
            var bs = store.bubbleStyles;
            var mapping = {
                'bubble-size-slider':    bs.size,
                'bubble-padding-slider': bs.padding,
                'bubble-spacing-slider': bs.spacing,
                'bubble-gap-slider':     bs.bubbleGap,
                'avatar-size-slider':    bs.avatarSize,
                'avatar-radius-slider':  bs.avatarRadius,
                'bubble-font-size-slider': bs.bubbleFontSize
            };
            Object.keys(mapping).forEach(function(id){
                if (mapping[id] != null) {
                    var el = document.getElementById(id);
                    if (el) el.value = mapping[id];
                }
            });
            // 触发应用
            if (typeof window.applyBubbleStyles === 'function') {
                try { window.applyBubbleStyles(); } catch(e) { console.warn('[beauty-pack] applyBubbleStyles 失败:', e); }
            }
            applied.push('气泡样式');
        }

        // 主题配色
        if (modules.theme && pack.theme) {
            store.theme = Object.assign({}, store.theme || {}, pack.theme);
            if (typeof window.applyTheme === 'function') {
                try { window.applyTheme(store.theme); } catch(e) { console.warn('[beauty-pack] applyTheme 失败:', e); }
            }
            applied.push('主题配色');
        }

        // 全局主题预设
        if (modules.globalTheme && pack.globalTheme) {
            if (typeof window.switchGlobalTheme === 'function') {
                try { window.switchGlobalTheme(pack.globalTheme); } catch(e) { console.warn('[beauty-pack] switchGlobalTheme 失败:', e); }
            } else {
                store.globalTheme = pack.globalTheme;
            }
            applied.push('全局主题');
        }

        // 字体
        if (modules.font) {
            if (pack.customFont !== undefined) store.customFont = pack.customFont;
            if (pack.fontPresets !== undefined) store.fontPresets = pack.fontPresets;
            // 触发字体重新应用
            if (typeof window.applyCustomFont === 'function') {
                try { window.applyCustomFont(); } catch(e) {}
            }
            applied.push('字体');
        }

        // 组件样式
        if (modules.comp && pack.compStyles) {
            store.compStyles = Object.assign({}, store.compStyles || {}, pack.compStyles);
            if (typeof window.applyAllCompStyles === 'function') {
                try { window.applyAllCompStyles(); } catch(e) {}
            }
            applied.push('组件样式');
        }

        // CSS 预设集合
        if (modules.presets && pack.cssPresets) {
            if (!store.cssPresets) store.cssPresets = { bubble: {}, global: {}, offline: {} };
            ['bubble', 'global', 'offline'].forEach(function(t){
                if (pack.cssPresets[t] && typeof pack.cssPresets[t] === 'object') {
                    if (!store.cssPresets[t]) store.cssPresets[t] = {};
                    Object.keys(pack.cssPresets[t]).forEach(function(name){
                        store.cssPresets[t][name] = _sanitizeCSS(pack.cssPresets[t][name]);
                    });
                }
            });
            applied.push('CSS预设');
        }

        // 头像框
        if (modules.frame && pack.avatarFrames) {
            store.avatarFrames = Object.assign({}, store.avatarFrames || {}, pack.avatarFrames);
            if (typeof window.applyAvatarFrames === 'function') {
                try { window.applyAvatarFrames(); } catch(e) {}
            }
            applied.push('头像框');
        }

        // 壁纸
        if (modules.wallpaper) {
            if (pack.desktopBg !== undefined) store.desktopBg = pack.desktopBg;
            if (pack.globalWallpapers !== undefined) store.globalWallpapers = pack.globalWallpapers;
            if (typeof window.gwpApplyAll === 'function') {
                try { window.gwpApplyAll(); } catch(e) {}
            }
            if (typeof window.applyDesktopBg === 'function') {
                try { window.applyDesktopBg(); } catch(e) {}
            }
            applied.push('壁纸');
        }

        _save();

        // [PERF-2026-05-04] 美化包导入后触发CSS性能审计
        // 检测导入的CSS是否含高成本属性，自动添加降级class
        if (typeof window._checkCustomCSSPerformance === 'function') {
            setTimeout(function() {
                var score = window._checkCustomCSSPerformance();
                if (score >= 15) {
                    console.log('[beauty-pack] ⚠ 导入的美化包CSS性能得分偏高(' + score + ')，已自动启用性能降级');
                }
            }, 300);
        }

        return applied;
    }

    // ---------- 校验 ----------

    function validatePack(pack) {
        if (!pack || typeof pack !== 'object') return '文件内容为空或格式错误';
        if (pack._type !== PACK_TYPE) return '不是有效的美化包（_type 不匹配）';
        if (typeof pack._version !== 'number') return '缺少版本号 _version';
        if (pack._version > PACK_VERSION) return '美化包版本(' + pack._version + ')高于当前系统(' + PACK_VERSION + ')，请升级';
        return null;
    }

    // 检测美化包中实际包含的模块
    function detectModules(pack) {
        return {
            css:         !!pack.customCSS,
            bubble:      !!pack.bubbleStyles,
            theme:       !!pack.theme,
            globalTheme: !!pack.globalTheme,
            font:        (pack.customFont !== undefined || pack.fontPresets !== undefined),
            comp:        !!pack.compStyles,
            presets:     !!pack.cssPresets,
            frame:       !!pack.avatarFrames,
            wallpaper:   (pack.desktopBg !== undefined || pack.globalWallpapers !== undefined)
        };
    }

    // ---------- UI：模态框样式注入 ----------

    function _ensureModalStyle() {
        if (document.getElementById('beauty-pack-style')) return;
        var style = document.createElement('style');
        style.id = 'beauty-pack-style';
        style.innerHTML = [
            '.bp-mask{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999999;display:flex;align-items:center;justify-content:center;padding:20px;animation:bpFade .2s ease;touch-action:auto;pointer-events:auto;}',
            '@keyframes bpFade{from{opacity:0}to{opacity:1}}',
            '.bp-box{background:#fff;border-radius:16px;width:100%;max-width:420px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.2);}',
            '.bp-head{padding:16px 18px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;}',
            '.bp-title{font-size:16px;font-weight:600;color:#111;}',
            '.bp-close{width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:#999;cursor:pointer;border-radius:50%;}',
            '.bp-close:hover{background:#f5f5f5;color:#333;}',
            '.bp-body{flex:1;overflow-y:auto;padding:14px 18px;}',
            '.bp-foot{padding:12px 18px;border-top:1px solid #eee;display:flex;gap:10px;}',
            '.bp-btn{flex:1;padding:10px 14px;border-radius:10px;border:none;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .15s;}',
            '.bp-btn:active{opacity:.7;}',
            '.bp-btn-primary{background:#07c160;color:#fff;}',
            '.bp-btn-ghost{background:#f5f5f5;color:#333;}',
            '.bp-btn-danger{background:#fa5151;color:#fff;}',
            '.bp-field{margin-bottom:12px;}',
            '.bp-label{display:block;font-size:12px;color:#666;margin-bottom:6px;font-weight:500;}',
            '.bp-input,.bp-textarea{width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid #ddd;border-radius:8px;font-size:14px;background:#fafafa;font-family:inherit;}',
            '.bp-input:focus,.bp-textarea:focus{outline:none;border-color:#07c160;background:#fff;}',
            '.bp-textarea{resize:vertical;min-height:56px;}',
            '.bp-module-list{display:flex;flex-direction:column;gap:6px;}',
            '.bp-module-item{display:flex;align-items:center;padding:10px 12px;background:#fafafa;border-radius:10px;cursor:pointer;transition:background .15s;gap:10px;}',
            '.bp-module-item:hover{background:#f0f0f0;}',
            '.bp-module-item.active{background:#e8f7ee;border:1px solid #07c160;}',
            '.bp-module-item.disabled{opacity:.45;cursor:not-allowed;}',
            '.bp-module-item.disabled:hover{background:#fafafa;}',
            '.bp-module-icon{width:32px;height:32px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;color:#07c160;font-size:14px;flex-shrink:0;}',
            '.bp-module-text{flex:1;min-width:0;}',
            '.bp-module-label{font-size:13px;color:#111;font-weight:500;}',
            '.bp-module-desc{font-size:11px;color:#999;margin-top:2px;line-height:1.3;}',
            '.bp-module-check{width:18px;height:18px;border:1.5px solid #ccc;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;flex-shrink:0;}',
            '.bp-module-item.active .bp-module-check{background:#07c160;border-color:#07c160;}',
            '.bp-meta-card{background:linear-gradient(135deg,#e8f7ee 0%,#fff 100%);border-radius:12px;padding:14px;margin-bottom:14px;border:1px solid #d0eadd;}',
            '.bp-meta-name{font-size:15px;font-weight:600;color:#111;margin-bottom:4px;}',
            '.bp-meta-row{font-size:12px;color:#666;margin-top:3px;display:flex;align-items:center;gap:6px;}',
            '.bp-meta-row i{width:14px;color:#07c160;font-size:11px;}',
            '.bp-meta-desc{font-size:12px;color:#555;margin-top:8px;padding-top:8px;border-top:1px dashed #cce5d8;line-height:1.5;white-space:pre-wrap;word-break:break-word;}',
            '.bp-section-title{font-size:12px;color:#888;margin:14px 0 8px;font-weight:500;display:flex;align-items:center;gap:6px;}',
            '.bp-tip{background:#fff7e6;border:1px solid #ffe58f;color:#8a6d3b;padding:8px 10px;border-radius:8px;font-size:11px;line-height:1.5;margin-bottom:10px;}',
            '.bp-size-tag{display:inline-block;background:#fff;border:1px solid #ddd;padding:1px 8px;border-radius:10px;font-size:10px;color:#666;margin-left:4px;}',
            '.bp-import-modes{display:flex;gap:6px;margin-bottom:12px;}',
            '.bp-import-mode{flex:1;padding:8px 10px;text-align:center;border:1px solid #ddd;border-radius:8px;font-size:12px;cursor:pointer;background:#fafafa;color:#666;}',
            '.bp-import-mode.active{background:#07c160;color:#fff;border-color:#07c160;}'
        ].join('');
        document.head.appendChild(style);
    }

    function _closeModal(maskId) {
        var el = document.getElementById(maskId);
        if (el) el.remove();
    }

    // ---------- UI：导出面板 ----------

    function openExportModal() {
        _ensureModalStyle();
        _closeModal('bp-export-mask');

        // 初始模块勾选状态
        var modState = {};
        MODULES.forEach(function(m){ modState[m.key] = m.def; });

        var html = '';
        html += '<div id="bp-export-mask" class="bp-mask">';
        html +=   '<div class="bp-box">';
        html +=     '<div class="bp-head">';
        html +=       '<div class="bp-title"><i class="fas fa-file-export" style="margin-right:6px;color:#07c160;"></i>导出美化包</div>';
        html +=       '<div class="bp-close" onclick="window.BeautyPack._closeExport()"><i class="fas fa-times"></i></div>';
        html +=     '</div>';
        html +=     '<div class="bp-body">';
        html +=       '<div class="bp-tip">💡 把你的美化配置打包成 JSON 文件，分享给别人一键导入即可应用。</div>';
        html +=       '<div class="bp-field">';
        html +=         '<label class="bp-label">美化包名称 *</label>';
        html +=         '<input id="bp-exp-name" class="bp-input" placeholder="例如：二次元黑白便签风" maxlength="40" />';
        html +=       '</div>';
        html +=       '<div class="bp-field">';
        html +=         '<label class="bp-label">作者</label>';
        html +=         '<input id="bp-exp-author" class="bp-input" placeholder="你的名字（选填）" maxlength="30" />';
        html +=       '</div>';
        html +=       '<div class="bp-field">';
        html +=         '<label class="bp-label">描述</label>';
        html +=         '<textarea id="bp-exp-desc" class="bp-textarea" placeholder="简单介绍下这款美化的风格特点（选填）" maxlength="300"></textarea>';
        html +=       '</div>';
        html +=       '<div class="bp-field">';
        html +=         '<label class="bp-label">标签（用空格或逗号分隔）</label>';
        html +=         '<input id="bp-exp-tags" class="bp-input" placeholder="例如：黑白 简约 二次元" maxlength="60" />';
        html +=       '</div>';
        html +=       '<div class="bp-section-title"><i class="fas fa-list-check"></i> 选择要导出的内容</div>';
        html +=       '<div class="bp-module-list" id="bp-exp-modules">';
        MODULES.forEach(function(m){
            var active = modState[m.key];
            html += '<div class="bp-module-item' + (active?' active':'') + '" data-mkey="' + m.key + '" onclick="window.BeautyPack._toggleExportModule(\'' + m.key + '\')">';
            html +=   '<div class="bp-module-icon"><i class="fas ' + m.icon + '"></i></div>';
            html +=   '<div class="bp-module-text">';
            html +=     '<div class="bp-module-label">' + _escHtml(m.label) + '</div>';
            html +=     '<div class="bp-module-desc">' + _escHtml(m.desc) + '</div>';
            html +=   '</div>';
            html +=   '<div class="bp-module-check"><i class="fas fa-check"></i></div>';
            html += '</div>';
        });
        html +=       '</div>';
        html +=     '</div>';
        html +=     '<div class="bp-foot">';
        html +=       '<button class="bp-btn bp-btn-ghost" onclick="window.BeautyPack._closeExport()">取消</button>';
        html +=       '<button class="bp-btn bp-btn-primary" onclick="window.BeautyPack._doExport()"><i class="fas fa-download"></i> 导出下载</button>';
        html +=     '</div>';
        html +=   '</div>';
        html += '</div>';

        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        document.body.appendChild(wrap.firstChild);

        // 保存临时状态到全局
        window.BeautyPack._expState = modState;
    }

    function _toggleExportModule(key) {
        var state = window.BeautyPack._expState || {};
        state[key] = !state[key];
        var el = document.querySelector('#bp-exp-modules [data-mkey="' + key + '"]');
        if (el) el.classList.toggle('active', state[key]);
    }

    function _doExport() {
        var nameEl = document.getElementById('bp-exp-name');
        var name = nameEl ? nameEl.value.trim() : '';
        if (!name) { _toast('请填写美化包名称', 'error'); if (nameEl) nameEl.focus(); return; }

        var author = (document.getElementById('bp-exp-author') || {}).value || '';
        var desc   = (document.getElementById('bp-exp-desc')   || {}).value || '';
        var tagsRaw= (document.getElementById('bp-exp-tags')   || {}).value || '';
        var tags = tagsRaw.split(/[\s,，、]+/).map(function(s){return s.trim();}).filter(Boolean);

        var modState = window.BeautyPack._expState || {};
        // 至少勾一项
        var hasAny = Object.keys(modState).some(function(k){ return modState[k]; });
        if (!hasAny) { _toast('请至少选择一项导出内容', 'error'); return; }

        try {
            var pack = collectPack({
                name: name, author: author, desc: desc, tags: tags, modules: modState
            });
            var safeName = name.replace(/[\\\/:*?"<>|]/g, '_');
            var filename = safeName + '.yan-beauty.json';
            _downloadJSON(pack, filename);
            // 估算大小
            var jsonStr = JSON.stringify(pack);
            var sizeText = _fmtBytes(new Blob([jsonStr]).size);
            _toast('美化包已导出 ✅ (' + sizeText + ')', 'success');
            _closeModal('bp-export-mask');
        } catch (e) {
            console.error('[beauty-pack] 导出失败:', e);
            _toast('导出失败：' + (e.message === 'store 未初始化' ? '数据尚未加载完成，请等页面完全加载后再试' : e.message), 'error');
        }
    }

    // ---------- UI：导入面板（选择文件） ----------

    function openImportModal() {
        _ensureModalStyle();
        _closeModal('bp-import-mask');

        var html = '';
        html += '<div id="bp-import-mask" class="bp-mask">';
        html +=   '<div class="bp-box">';
        html +=     '<div class="bp-head">';
        html +=       '<div class="bp-title"><i class="fas fa-file-import" style="margin-right:6px;color:#07c160;"></i>导入美化包</div>';
        html +=       '<div class="bp-close" onclick="window.BeautyPack._closeImport()"><i class="fas fa-times"></i></div>';
        html +=     '</div>';
        html +=     '<div class="bp-body">';
        html +=       '<div class="bp-tip">💡 支持 <b>.yan-beauty.json</b> 或普通 <b>.json</b> 格式。导入前会让你预览美化包信息和选择要应用的模块。</div>';
        html +=       '<div class="bp-field">';
        html +=         '<label class="bp-label">方式一：选择文件</label>';
        html +=         '<input id="bp-imp-file" type="file" accept=".json,application/json" onchange="window.BeautyPack._onFilePick(this)" style="width:100%;padding:8px;border:1px dashed #ccc;border-radius:8px;background:#fafafa;" />';
        html +=       '</div>';
        html +=       '<div class="bp-field">';
        html +=         '<label class="bp-label">方式二：粘贴 JSON 内容</label>';
        html +=         '<textarea id="bp-imp-text" class="bp-textarea" style="min-height:100px;font-family:monospace;font-size:12px;" placeholder="粘贴美化包 JSON 内容..."></textarea>';
        html +=       '</div>';
        html +=     '</div>';
        html +=     '<div class="bp-foot">';
        html +=       '<button class="bp-btn bp-btn-ghost" onclick="window.BeautyPack._closeImport()">取消</button>';
        html +=       '<button class="bp-btn bp-btn-primary" onclick="window.BeautyPack._onTextParse()"><i class="fas fa-arrow-right"></i> 下一步</button>';
        html +=     '</div>';
        html +=   '</div>';
        html += '</div>';

        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        document.body.appendChild(wrap.firstChild);
    }

    function _onFilePick(input) {
        if (!input.files || !input.files[0]) return;
        var file = input.files[0];
        if (file.size > MAX_IMPORT_SIZE) {
            _toast('文件过大（超过 ' + _fmtBytes(MAX_IMPORT_SIZE) + '）', 'error');
            return;
        }
        var reader = new FileReader();
        reader.onload = function(ev) {
            try {
                var pack = JSON.parse(ev.target.result);
                _closeModal('bp-import-mask');
                openPreviewModal(pack);
            } catch(e) {
                _toast('JSON 解析失败：' + e.message, 'error');
            }
        };
        reader.onerror = function() { _toast('文件读取失败', 'error'); };
        reader.readAsText(file, 'utf-8');
    }

    function _onTextParse() {
        var ta = document.getElementById('bp-imp-text');
        var txt = ta ? ta.value.trim() : '';
        // 如果 textarea 为空，尝试从文件
        if (!txt) {
            var f = document.getElementById('bp-imp-file');
            if (f && f.files && f.files[0]) {
                _onFilePick(f);
                return;
            }
            _toast('请选择文件或粘贴 JSON 内容', 'error');
            return;
        }
        if (txt.length > MAX_IMPORT_SIZE) {
            _toast('内容过大', 'error'); return;
        }
        try {
            var pack = JSON.parse(txt);
            _closeModal('bp-import-mask');
            openPreviewModal(pack);
        } catch(e) {
            _toast('JSON 解析失败：' + e.message, 'error');
        }
    }

    // ---------- UI：预览面板（选择要导入的模块） ----------

    function openPreviewModal(pack) {
        _ensureModalStyle();

        // 校验
        var err = validatePack(pack);
        if (err) { _toast(err, 'error'); return; }

        var detected = detectModules(pack);

        // 默认勾选所有存在的模块
        var modState = {};
        MODULES.forEach(function(m){ modState[m.key] = !!detected[m.key]; });

        // 估算大小
        var packSize = _fmtBytes(new Blob([JSON.stringify(pack)]).size);

        var createdDate = pack._createdAt ? new Date(pack._createdAt).toLocaleString('zh-CN') : '-';

        var html = '';
        html += '<div id="bp-preview-mask" class="bp-mask">';
        html +=   '<div class="bp-box">';
        html +=     '<div class="bp-head">';
        html +=       '<div class="bp-title"><i class="fas fa-eye" style="margin-right:6px;color:#07c160;"></i>美化包预览</div>';
        html +=       '<div class="bp-close" onclick="window.BeautyPack._closePreview()"><i class="fas fa-times"></i></div>';
        html +=     '</div>';
        html +=     '<div class="bp-body">';
        // 元信息卡
        html +=       '<div class="bp-meta-card">';
        if (pack._preview) {
            html +=     '<div style="text-align:center;margin-bottom:10px;"><img src="' + _escHtml(pack._preview) + '" style="max-width:100%;max-height:140px;border-radius:8px;border:1px solid #eee;" /></div>';
        }
        html +=         '<div class="bp-meta-name">' + _escHtml(pack._name || '未命名美化包') + '</div>';
        if (pack._author)    html += '<div class="bp-meta-row"><i class="fas fa-user"></i> ' + _escHtml(pack._author) + '</div>';
        html +=         '<div class="bp-meta-row"><i class="fas fa-clock"></i> ' + createdDate + '<span class="bp-size-tag">' + packSize + '</span></div>';
        if (pack._version)   html += '<div class="bp-meta-row"><i class="fas fa-code-branch"></i> 格式版本 v' + pack._version + '</div>';
        if (pack._tags && pack._tags.length) html += '<div class="bp-meta-row"><i class="fas fa-tags"></i> ' + pack._tags.map(_escHtml).join(' · ') + '</div>';
        if (pack._desc)      html += '<div class="bp-meta-desc">' + _escHtml(pack._desc) + '</div>';
        html +=       '</div>';

        html +=       '<div class="bp-section-title"><i class="fas fa-check-double"></i> 选择要导入的模块</div>';
        html +=       '<div class="bp-module-list" id="bp-prev-modules">';
        MODULES.forEach(function(m){
            var has = !!detected[m.key];
            var active = modState[m.key];
            html += '<div class="bp-module-item' + (active?' active':'') + (has?'':' disabled') + '" data-mkey="' + m.key + '"' +
                    (has ? ' onclick="window.BeautyPack._togglePreviewModule(\'' + m.key + '\')"' : '') + '>';
            html +=   '<div class="bp-module-icon"><i class="fas ' + m.icon + '"></i></div>';
            html +=   '<div class="bp-module-text">';
            html +=     '<div class="bp-module-label">' + _escHtml(m.label) + (has ? '' : '<span style="color:#ccc;font-size:11px;margin-left:6px;">（该包未包含）</span>') + '</div>';
            html +=     '<div class="bp-module-desc">' + _escHtml(m.desc) + '</div>';
            html +=   '</div>';
            html +=   '<div class="bp-module-check"><i class="fas fa-check"></i></div>';
            html += '</div>';
        });
        html +=       '</div>';
        html +=       '<div class="bp-tip" style="margin-top:12px;background:#fef2f2;border-color:#fecaca;color:#b91c1c;">⚠️ 导入将<b>覆盖</b>当前对应模块的美化设置，建议先备份（设置→数据管理→导出）。</div>';
        html +=     '</div>';
        html +=     '<div class="bp-foot">';
        html +=       '<button class="bp-btn bp-btn-ghost" onclick="window.BeautyPack._closePreview()">取消</button>';
        html +=       '<button class="bp-btn bp-btn-primary" onclick="window.BeautyPack._doImport()"><i class="fas fa-check"></i> 确认导入</button>';
        html +=     '</div>';
        html +=   '</div>';
        html += '</div>';

        var wrap = document.createElement('div');
        wrap.innerHTML = html;
        document.body.appendChild(wrap.firstChild);

        window.BeautyPack._prevPack = pack;
        window.BeautyPack._prevState = modState;
        window.BeautyPack._prevDetected = detected;
    }

    function _togglePreviewModule(key) {
        var detected = window.BeautyPack._prevDetected || {};
        if (!detected[key]) return;
        var state = window.BeautyPack._prevState || {};
        state[key] = !state[key];
        var el = document.querySelector('#bp-prev-modules [data-mkey="' + key + '"]');
        if (el) el.classList.toggle('active', state[key]);
    }

    function _doImport() {
        var pack = window.BeautyPack._prevPack;
        var state = window.BeautyPack._prevState || {};
        if (!pack) { _toast('没有可导入的美化包', 'error'); return; }

        var anySelected = Object.keys(state).some(function(k){ return state[k]; });
        if (!anySelected) { _toast('请至少选择一项要导入的模块', 'error'); return; }

        try {
            var applied = applyPack(pack, state);
            _closeModal('bp-preview-mask');
            if (applied && applied.length) {
                _toast('美化包导入成功 ✅（' + applied.join('、') + '）', 'success');
            } else {
                _toast('没有可应用的模块', 'info');
            }
            // 清理临时状态
            window.BeautyPack._prevPack = null;
            window.BeautyPack._prevState = null;
            window.BeautyPack._prevDetected = null;
        } catch(e) {
            console.error('[beauty-pack] 导入失败:', e);
            _toast('导入失败：' + e.message, 'error');
        }
    }

    // ---------- 导出到 window ----------

    window.BeautyPack = {
        // 对外接口
        openExport: openExportModal,
        openImport: openImportModal,
        collectPack: collectPack,
        applyPack: applyPack,
        validatePack: validatePack,
        detectModules: detectModules,
        MODULES: MODULES,

        // 内部 UI 回调（onclick 调用）
        _closeExport: function(){ _closeModal('bp-export-mask'); },
        _closeImport: function(){ _closeModal('bp-import-mask'); },
        _closePreview: function(){ _closeModal('bp-preview-mask'); },
        _toggleExportModule: _toggleExportModule,
        _togglePreviewModule: _togglePreviewModule,
        _doExport: _doExport,
        _doImport: _doImport,
        _onFilePick: _onFilePick,
        _onTextParse: _onTextParse,
        _showCopyFallback: _showCopyFallback,

        // 临时状态占位
        _expState: null,
        _prevPack: null,
        _prevState: null,
        _prevDetected: null
    };

})();
